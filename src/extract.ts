import { BRAND } from "./brand.ts";
import { blankDimension, emptyDraft, emptyFlags, nextId } from "./model.ts";
import { canonicalDim } from "./numbers.ts";
import { normalizeText, sanitizeToText } from "./sanitize.ts";
import type {
  ArtworkValue,
  BoxTypeId,
  DimensionRow,
  ExtraMaterialId,
  FinishId,
  InsertId,
  MaterialKind,
  PrintValue,
  QuantityRow,
  ReaderFlags,
  RfqDraft,
  Unit,
} from "./types.ts";
import { INCOTERMS } from "./types.ts";

export interface ReadResult {
  draft: RfqDraft;
  flags: ReaderFlags;
}

interface Range {
  start: number;
  end: number;
}

const NUM_SRC = String.raw`(?:\d{1,3}(?:,\d{3})+|\d{1,3},\d{1,2}(?!\d)|\d{1,4}(?:\.\d+)?)`;
const UNIT_SRC = String.raw`(?:millimet(?:er|re)s?|millimeters?|centimet(?:er|re)s?|centimeters?|inches|inch|毫米|厘米|公分|英寸|(?<![a-z])mm(?![a-z])|(?<![a-z])cm(?![a-z])|(?<![a-z])in(?![a-z])|")`;
const AXIS_SRC = String.raw`(?:(?:length|width|height|long|wide|长|宽|高)\s*[:.]?\s*|[lwh]\s*[:.]?\s*)`;
const TRIPLE_SRC = String.raw`(?<![\d.])(?:${AXIS_SRC})?(?<n1>${NUM_SRC})(?:[^\S\n]*(?<u1>${UNIT_SRC}))?[^\S\n]*[x][^\S\n]*(?:${AXIS_SRC})?(?<n2>${NUM_SRC})(?:[^\S\n]*(?<u2>${UNIT_SRC}))?[^\S\n]*[x][^\S\n]*(?:${AXIS_SRC})?(?<n3>${NUM_SRC})(?:[^\S\n]*(?<u3>${UNIT_SRC}))?`;
const INT_SRC = String.raw`(?<![\d.,])(?:\d{1,3}(?:,\d{3})+|\d{2,7})(?!\d|\.\d)`;
const QUNIT_SRC = String.raw`(?:pcs\.?|pieces?|units?|sets?|boxes|box|个|只|套|件)(?![a-z0-9])`;

const PRODUCT_RE = /product\s*(?:size|dimension|is)|item\s*size|内容物(?:尺寸|是)?|产品(?:尺寸|是)/i;
const SHIP_RE = /master\s*carton|shipping\s*carton|export\s*carton|outer\s*carton|外箱|纸箱尺寸/i;
const INNER_RE = /\binner\b|\binside\b|\binternal\b|\bI\.?D\.?\b|内尺寸|内径|内盒|内部尺寸/i;
const OUTER_RE = /\bouter\b|\boutside\b|\bexternal\b|\bO\.?D\.?\b|外尺寸|外径|外盒|外部尺寸/i;

const MAGNETIC_SRC = String.raw`\bmagnetic(?:\s*closure)?(?:\s*box)?\b|\bmagnet\s+box\b|磁吸盒|磁铁盒|磁吸`;

const SPECIFIC_BOXES: Array<{ id: Exclude<BoxTypeId, "" | "rigid" | "other" | "magnetic">; source: string }> = [
  { id: "drawer", source: String.raw`drawer\s*box|slider\s*box|slide\s*box|抽屉盒|抽拉盒|抽屉` },
  { id: "book", source: String.raw`\bbook[-\s]*style\b|\bbook(?:\s*shaped)?\s*box\b|书型盒|书本盒|翻书盒|书型` },
  { id: "lid-base", source: String.raw`lid\s*(?:and|&|\+)\s*base|base\s*(?:and|&)\s*lid|two[-\s]?piece(?:\s*box)?|天地盖|天盖地` },
  { id: "clamshell", source: String.raw`clamshell|flip[-\s]?top(?:\s*box)?|翻盖盒|翻盖` },
  { id: "shoulder", source: String.raw`shoulder(?:\s*neck)?\s*box|neck\s*box|围框盒` },
  { id: "window", source: String.raw`window\s*box|开窗盒|开窗` },
  { id: "folding", source: String.raw`folding\s*(?:carton|box)|mailer\s*box|邮寄盒|彩盒|折叠彩盒|折叠盒` },
  { id: "tube", source: String.raw`tube\s*box|round\s*box|cylinder(?:\s*box)?|圆筒盒|圆筒|圆盒` },
];

/**
 * Read an enquiry with fixed rules.
 * Units, inner/outer, and board family are taken only from words that are present.
 * Quantity tiers are kept separate and are never added together.
 * Grayboard and MDF are different materials; if both appear, neither is chosen.
 */
export function readEnquiry(raw: string): ReadResult {
  const flags = emptyFlags();
  const draft = emptyDraft();
  if (raw.length > BRAND.maxChars) {
    flags.tooLong = true;
    return { draft, flags };
  }

  const sanitized = sanitizeToText(raw);
  flags.htmlRemoved = sanitized.htmlRemoved;
  const text = normalizeText(sanitized.text);
  flags.plainText = text;
  if (!text) return { draft, flags };

  if (/which\s+is\s+better|please\s+advise|what\s+do\s+you\s+recommend|推荐一下|哪个好|请建议/i.test(text)) {
    flags.adviceRequested = true;
  }

  const dimensions = findDimensions(text);
  draft.dimensions = dimensions.boxes;
  if (dimensions.product.length > 0) draft.productFit = dimensions.product.join("; ");
  if (dimensions.shipping.length > 0) draft.shippingCarton = dimensions.shipping.join("; ");

  const masked = maskNonQuantities(maskRanges(text, dimensions.ranges));
  const quantities = findQuantities(text, masked);
  draft.quantities = quantities.rows;
  flags.plusSignSplit = quantities.plusSignSplit;
  flags.statedTotalIgnored = quantities.statedTotalIgnored;

  const material = findMaterial(text, dimensions.ranges);
  draft.materialKind = material.kind;
  draft.thickness = material.thickness;
  flags.materialCandidates = material.candidates;
  flags.materialExtras = material.extras;

  const box = findBox(text);
  draft.boxType = box.id;
  draft.closure = box.closure;
  flags.boxCandidates = box.candidates;
  flags.genericBoxOnly = box.genericOnly;
  flags.alsoRigid = box.alsoRigid;

  const printing = findPrint(text);
  draft.exteriorPrint = printing.exterior;
  draft.interiorPrint = printing.interior;
  flags.printUnassigned = printing.unassigned;

  draft.finishes = findFinishes(text);
  const insert = findInsert(text);
  draft.insert = insert.id;
  flags.insertConflict = insert.conflict;

  if (!draft.productFit) {
    const loose = findLooseProduct(text);
    if (loose) draft.productFit = loose;
  }

  const artwork = findArtwork(text);
  draft.artwork = artwork.value;
  flags.artworkConflict = artwork.conflict;

  const trade = findTrade(text);
  draft.destination = trade.destination;
  draft.incoterm = trade.incoterm;
  draft.incotermPlace = trade.place;
  flags.destinationCandidates = trade.destinationCandidates;
  flags.incotermCandidates = trade.incotermCandidates;
  flags.placeCandidates = trade.placeCandidates;

  const schedule = findSchedule(text);
  draft.schedule = schedule.value;
  flags.scheduleCandidates = schedule.candidates;

  return { draft, flags };
}

function findDimensions(text: string): {
  ranges: Range[];
  boxes: DimensionRow[];
  product: string[];
  shipping: string[];
} {
  const ranges: Range[] = [];
  const boxes: DimensionRow[] = [];
  const product: string[] = [];
  const shipping: string[] = [];

  eachLine(text, (line, offset) => {
    for (const match of line.matchAll(new RegExp(TRIPLE_SRC, "gi"))) {
      const rawStart = match.index ?? 0;
      const start = offset + rawStart;
      const end = start + match[0].length;
      if (ranges.some((range) => start < range.end && end > range.start)) continue;
      const length = canonicalDim(match.groups?.n1 ?? "");
      const width = canonicalDim(match.groups?.n2 ?? "");
      const height = canonicalDim(match.groups?.n3 ?? "");
      if ([length, width, height].some((part) => part === "0" || part.startsWith("0."))) continue;
      const units = [match.groups?.u1, match.groups?.u2, match.groups?.u3]
        .filter((item): item is string => Boolean(item))
        .map(canonUnit);
      const distinct = [...new Set(units.filter((item) => item !== ""))];
      const unitIssue = distinct.length > 1 ? "mixed" : "";
      const unit: Unit = distinct.length === 1 ? distinct[0]! : "";
      const before = text.slice(Math.max(0, start - 42), start);
      const after = text.slice(end, end + 28);
      const role = classifyDimension(before, after);
      const evidence = compact(match[0]);
      ranges.push({ start, end });
      if (role === "product") {
        product.push(describeSize(before, after, length, width, height, unit));
        continue;
      }
      if (role === "shipping") {
        shipping.push(describeSize(before, after, length, width, height, unit));
        continue;
      }
      const row = blankDimension();
      row.length = length;
      row.width = width;
      row.height = height;
      row.unit = unit;
      row.unitIssue = unitIssue;
      row.scope = role === "inner" || role === "outer" ? role : "";
      row.evidence = evidence;
      boxes.push(row);
    }
  });

  return { ranges, boxes, product, shipping };
}

function classifyDimension(before: string, after: string): "inner" | "outer" | "product" | "shipping" | "" {
  const scores: Array<{ kind: "product" | "shipping" | "inner" | "outer"; at: number }> = [
    { kind: "product", at: lastIndex(before, PRODUCT_RE) },
    { kind: "shipping", at: lastIndex(before, SHIP_RE) },
    { kind: "inner", at: lastIndex(before, INNER_RE) },
    { kind: "outer", at: lastIndex(before, OUTER_RE) },
  ];
  scores.sort((a, b) => b.at - a.at);
  if (scores[0] && scores[0].at >= 0) return scores[0].kind;
  const tail = (after.split(/[x\n]/)[0] ?? "").split(/\d/)[0] ?? "";
  const inner = INNER_RE.test(tail);
  const outer = OUTER_RE.test(tail);
  if (inner && !outer) return "inner";
  if (outer && !inner) return "outer";
  return "";
}

function describeSize(
  before: string,
  after: string,
  length: string,
  width: string,
  height: string,
  unit: Unit,
): string {
  const noun = nounAround(`${before} ${after}`);
  const size = `${length} × ${width} × ${height}${unit ? ` ${unit}` : ""}`;
  return noun ? `${noun} ${size}` : size;
}

function nounAround(text: string): string {
  const pairs: Array<[RegExp, string]> = [
    [/香水瓶/, "香水瓶"],
    [/candle\s*jar/i, "candle jar"],
    [/perfume\s*bottle/i, "perfume bottle"],
    [/蜡烛/, "蜡烛"],
    [/香水/, "香水"],
    [/bottle/i, "bottle"],
    [/candle/i, "candle"],
    [/jar/i, "jar"],
  ];
  for (const [pattern, label] of pairs) {
    if (pattern.test(text)) return label;
  }
  return "";
}

function findQuantities(original: string, masked: string): {
  rows: QuantityRow[];
  plusSignSplit: boolean;
  statedTotalIgnored: boolean;
} {
  const taken: Range[] = [];
  const found: Array<QuantityRow & { at: number }> = [];
  let plusSignSplit = false;
  let statedTotalIgnored = false;

  eachLine(masked, (line, offset) => {
    const totalRe = /(?:\btotal\b|合计|总计)\s*[:：]?\s*(?:about|around|约)?\s*(\d{1,3}(?:,\d{3})+|\d{2,7})/gi;
    for (const match of line.matchAll(totalRe)) {
      statedTotalIgnored = true;
      const start = offset + (match.index ?? 0);
      taken.push({ start, end: start + match[0].length });
    }
  });

  const workable = maskRanges(masked, taken);

  eachLine(workable, (line, offset) => {
    const moqRe = new RegExp(
      String.raw`(?:\bMOQ\b|minimum(?:\s+order)?(?:\s+quantity)?|起订量|最小起订量|最低起订量)(?:\s*(?:of|is|:|：))?\s*(?:约|about|around|approximately)?\s*(${INT_SRC})(?:\s*${QUNIT_SRC})?`,
      "gi",
    );
    for (const match of line.matchAll(moqRe)) {
      pushQty(found, taken, original, offset, match, "moq", match[1] ?? "");
    }
  });

  const afterMoq = maskRanges(workable, taken);
  eachLine(afterMoq, (line, offset) => {
    const sampleRe = new RegExp(
      String.raw`(?:\bsamples?\b|样品)\s*[:：]?\s*(?:约|about|around)?\s*(${INT_SRC})(?:\s*${QUNIT_SRC})?|(${INT_SRC})\s*(?:${QUNIT_SRC})?\s*(?:samples?|样品)`,
      "gi",
    );
    for (const match of line.matchAll(sampleRe)) {
      pushQty(found, taken, original, offset, match, "sample", match[1] || match[2] || "");
    }
  });

  const afterSample = maskRanges(afterMoq, taken);
  eachLine(afterSample, (line, offset) => {
    const seqRe = new RegExp(
      String.raw`${INT_SRC}(?:\s*${QUNIT_SRC})?(?:\s*(?:\/|,|、|\+|\bor\b|\band\b|或|及|和)\s*${INT_SRC}(?:\s*${QUNIT_SRC})?){1,8}`,
      "gi",
    );
    for (const match of line.matchAll(seqRe)) {
      const local = match.index ?? 0;
      const start = offset + local;
      const end = start + match[0].length;
      if (overlaps(taken, start, end)) continue;
      const hasUnit = new RegExp(QUNIT_SRC, "i").test(match[0]);
      const cue = /(qty|quantit(?:y|ies)|tiers?|价格档|档位|数量|套数|件数|报价)/i.test(
        line.slice(Math.max(0, local - 48), local),
      );
      const andOnly = !/[\/,、+]/.test(match[0]) && /\b(?:and|or)\b|或|及|和/.test(match[0]);
      if (!hasUnit && !cue) continue;
      if (andOnly && !hasUnit && !cue) continue;
      const numbers = [...match[0].matchAll(new RegExp(INT_SRC, "g"))].map((item) => item[1] ?? item[0]);
      if (numbers.length < 2) continue;
      if (match[0].includes("+")) plusSignSplit = true;
      taken.push({ start, end });
      numbers.forEach((amount, index) => {
        const row = makeQty(canonicalQty(amount), "tier", compact(original.slice(start, end)));
        if (row) found.push({ ...row, at: start + index });
      });
    }
  });

  const afterSeq = maskRanges(afterSample, taken);
  eachLine(afterSeq, (line, offset) => {
    const cueRe = new RegExp(
      String.raw`(?:\bqty\b|\bquantit(?:y|ies)\b|\border\s+qty\b|数量|件数|套数|订量)\s*[:：]?\s*(?:约|about|around)?\s*(${INT_SRC})(?:\s*${QUNIT_SRC})?`,
      "gi",
    );
    for (const match of line.matchAll(cueRe)) {
      pushQty(found, taken, original, offset, match, "tier", match[1] ?? "");
    }
    const unitRe = new RegExp(String.raw`(${INT_SRC})\s*${QUNIT_SRC}`, "gi");
    for (const match of line.matchAll(unitRe)) {
      pushQty(found, taken, original, offset, match, "tier", match[1] ?? "");
    }
  });

  const rows = dedupeQuantities(found);
  return { rows, plusSignSplit, statedTotalIgnored };
}

function pushQty(
  found: Array<QuantityRow & { at: number }>,
  taken: Range[],
  original: string,
  offset: number,
  match: RegExpMatchArray,
  kind: QuantityRow["kind"],
  rawAmount: string,
): void {
  const start = offset + (match.index ?? 0);
  const end = start + match[0].length;
  if (overlaps(taken, start, end)) return;
  const row = makeQty(canonicalQty(rawAmount), kind, compact(original.slice(start, end)));
  if (!row) return;
  taken.push({ start, end });
  found.push({ ...row, at: start });
}

function makeQty(amount: string, kind: QuantityRow["kind"], evidence: string): QuantityRow | null {
  if (!/^\d+$/.test(amount)) return null;
  const value = Number(amount);
  if (!Number.isSafeInteger(value) || value < 10 || value > 10_000_000) return null;
  return { id: nextId("qty"), amount, kind, evidence };
}

function canonicalQty(raw: string): string {
  return raw.replace(/,/g, "");
}

function dedupeQuantities(rows: Array<QuantityRow & { at: number }>): QuantityRow[] {
  const sorted = [...rows].sort((a, b) => a.at - b.at);
  const seen = new Set<string>();
  const output: QuantityRow[] = [];
  const kinds: Array<QuantityRow["kind"]> = ["tier", "moq", "sample"];
  for (const kind of kinds) {
    for (const row of sorted.filter((item) => item.kind === kind)) {
      const key = `${row.kind}:${row.amount}`;
      if (seen.has(key)) continue;
      seen.add(key);
      output.push({ id: row.id, amount: row.amount, kind: row.kind, evidence: row.evidence });
    }
  }
  return output;
}

function findMaterial(text: string, blocked: Range[]): {
  kind: MaterialKind;
  thickness: string;
  candidates: MaterialKind[];
  extras: ExtraMaterialId[];
} {
  const structural: Array<{ kind: MaterialKind; at: number }> = [];
  const extras: ExtraMaterialId[] = [];
  const rules: Array<{ kind: MaterialKind | ExtraMaterialId; source: string; extra?: boolean }> = [
    { kind: "mdf", source: String.raw`medium[-\s]density(?:\s+fib(?:re|er)board)?|\bdensity\s+board\b|\bmdf\b|中密度纤维板|中纤板|密度板` },
    { kind: "grayboard", source: String.raw`(?:gray|grey)\s*board|(?:gray|grey)\s*chip\s*board|\bchip\s*board\b|灰板纸|双灰板|灰板|双灰` },
    { kind: "corrugated", source: String.raw`corrugat(?:ed|ion)?|\b[eabcf](?:\s*-?\s*)flute\b|瓦楞|坑纸` },
    { kind: "cardboard", source: String.raw`card\s*board|卡纸板` },
    { kind: "kraft", source: String.raw`\bkraft\b|牛皮纸|牛卡|牛皮` },
    { kind: "art-paper", source: String.raw`art\s*paper|art\s*card|\bccnb\b|铜版纸|灰底白板`, extra: true },
    { kind: "coated-paper", source: String.raw`白卡纸|白卡|特种纸`, extra: true },
  ];

  for (const rule of rules) {
    const match = new RegExp(rule.source, "i").exec(text);
    if (!match) continue;
    if (rule.extra) {
      if (!extras.includes(rule.kind as ExtraMaterialId)) extras.push(rule.kind as ExtraMaterialId);
      continue;
    }
    structural.push({ kind: rule.kind as MaterialKind, at: match.index ?? 0 });
  }

  const unique: MaterialKind[] = [];
  for (const item of structural) {
    if (!unique.includes(item.kind)) unique.push(item.kind);
  }
  const boards = unique.filter((item) => item !== "kraft");
  const conflict = boards.length > 1;
  const soleBoard = boards.length === 1 ? boards[0]! : "";
  const kind: MaterialKind = conflict ? "" : soleBoard || (unique.includes("kraft") ? "kraft" : "");
  const candidates = conflict ? boards : kind ? [kind] : [];
  const extraIds = [...extras];
  if (soleBoard && unique.includes("kraft")) extraIds.unshift("kraft");

  const thicknesses = findThicknesses(text, blocked);
  let thickness = "";
  if (!conflict && kind) {
    const anchors = structural.filter((item) => item.kind === kind).map((item) => item.at);
    let best: { text: string; distance: number } | null = null;
    for (const candidate of thicknesses) {
      const distance = Math.min(...anchors.map((at) => Math.abs(candidate.start - at)));
      if (distance > 42) continue;
      if (!best || distance < best.distance) best = { text: candidate.text, distance };
    }
    thickness = best?.text ?? "";
  }

  return { kind, thickness, candidates, extras: extraIds };
}

function findThicknesses(text: string, blocked: Range[]): Array<{ text: string; start: number }> {
  const found: Array<{ text: string; start: number }> = [];
  for (const match of text.matchAll(/(?<![\d.])(\d{1,2}(?:\.\d{1,2})?)\s*mm\b/gi)) {
    const value = Number(match[1]);
    if (value < 0.3 || value > 9) continue;
    const start = match.index ?? 0;
    const end = start + match[0].length;
    if (overlaps(blocked, start, end)) continue;
    found.push({ text: `${canonicalDim(match[1] ?? "")} mm`, start });
  }
  for (const match of text.matchAll(/(?<![\d.])(\d{3,4})\s*(?:gsm|g\/m2|g\/㎡)/gi)) {
    const value = Number(match[1]);
    if (value < 250 || value > 2500) continue;
    const start = match.index ?? 0;
    const end = start + match[0].length;
    if (overlaps(blocked, start, end)) continue;
    found.push({ text: `${match[1]} gsm`, start });
  }
  return found;
}

function findBox(text: string): {
  id: BoxTypeId;
  closure: "" | "magnetic";
  candidates: BoxTypeId[];
  genericOnly: boolean;
  alsoRigid: boolean;
} {
  const structures: Array<{ id: Exclude<BoxTypeId, "" | "rigid" | "other" | "magnetic">; span: Span }> = [];
  for (const rule of SPECIFIC_BOXES) {
    const span = firstSpan(text, rule.source);
    if (span && !structures.some((item) => item.id === rule.id)) structures.push({ id: rule.id, span });
  }
  const magnetic = firstSpan(text, MAGNETIC_SRC);
  const magneticIsChoice = magnetic
    ? structures.some((item) => textBetweenIsChoice(text, item.span, magnetic))
    : false;
  const closure = magnetic && !magneticIsChoice ? "magnetic" : "";
  const rigid = /rigid\s*box|set[-\s]?up\s*box|硬盒|精品盒/i.test(text);
  const generic = /gift\s*box(?:es)?|礼盒|包装盒/i.test(text);
  const base = { genericOnly: false, alsoRigid: rigid };

  if (structures.length === 1 && magneticIsChoice) {
    return {
      id: "",
      closure: "",
      candidates: [structures[0]!.id, "magnetic"],
      ...base,
    };
  }
  if (structures.length === 1) {
    return { id: structures[0]!.id, closure, candidates: [structures[0]!.id], ...base };
  }
  if (structures.length > 1) {
    return { id: "", closure, candidates: structures.map((item) => item.id), ...base };
  }
  if (magnetic) {
    return { id: "magnetic", closure: "magnetic", candidates: ["magnetic"], ...base };
  }
  if (rigid) return { id: "rigid", closure: "", candidates: ["rigid"], genericOnly: false, alsoRigid: false };
  return { id: "", closure: "", candidates: [], genericOnly: generic, alsoRigid: false };
}

interface Span {
  start: number;
  end: number;
}

function firstSpan(text: string, source: string): Span | null {
  const match = new RegExp(source, "i").exec(text);
  if (!match || match.index === undefined) return null;
  return { start: match.index, end: match.index + match[0].length };
}

/** "drawer or magnetic" is a choice. "magnetic book-style" is one box with a closure. */
function textBetweenIsChoice(text: string, left: Span, right: Span): boolean {
  const start = Math.min(left.end, right.end);
  const end = Math.max(left.start, right.start);
  if (end <= start) return false;
  return /\bor\b|或者|或|还是/i.test(text.slice(start, end));
}

function findPrint(text: string): { exterior: PrintValue; interior: PrintValue; unassigned: string } {
  const exterior = new Set<PrintValue>();
  const interior = new Set<PrintValue>();
  const unknown = new Set<PrintValue>();
  const unknownPhrases: string[] = [];

  for (const line of text.split(/\n+/)) {
    for (const clause of line.split(/。|；|;/)) {
      const piece = clause.trim();
      if (!piece) continue;
      const types = printTypes(piece);
      if (types.length === 0) continue;
      const side = printSide(piece);
      const target = side === "exterior" ? exterior : side === "interior" ? interior : side === "both" ? null : unknown;
      if (side === "both") {
        for (const type of types) {
          exterior.add(type);
          interior.add(type);
        }
      } else if (target) {
        for (const type of types) target.add(type);
      }
      if (side === "") unknownPhrases.push(compact(piece));
    }
  }

  return {
    exterior: singlePrint(exterior),
    interior: singlePrint(interior),
    unassigned: unknown.size > 0 ? unknownPhrases.slice(0, 2).join(" / ").slice(0, 140) : "",
  };
}

function printTypes(clause: string): PrintValue[] {
  const found: PrintValue[] = [];
  if (/no\s+print|unprinted|without\s+print|无印刷|不印刷|素面/i.test(clause)) found.push("none");
  if (/cmyk|\b4\s*c\b|full\s*colou?r|\bin\s+colou?r\b|四色|彩色/i.test(clause)) found.push("cmyk");
  if (/pantone|\bpms\b|spot\s*colou?r|专色/i.test(clause)) found.push("pms");
  if (found.length === 0 && /\bprint(?:ed|ing|s)?\b|印刷/i.test(clause)) found.push("printed");
  return [...new Set(found)];
}

function printSide(clause: string): "exterior" | "interior" | "both" | "" {
  if (/both\s+sides|内外印刷|内外都/i.test(clause)) return "both";
  const exterior = /exterior|outside|outer\s*(?:print|face|side)|封面|外面|外部|表面/i.test(clause);
  const interior = /interior|inside|inner\s*(?:print|face|side)|lining|里面|内部印刷|内部|内侧/i.test(clause);
  if (exterior && interior) return "both";
  if (exterior) return "exterior";
  if (interior) return "interior";
  return "";
}

function singlePrint(values: Set<PrintValue>): PrintValue {
  if (values.size !== 1) return "";
  return [...values][0] ?? "";
}

function findFinishes(text: string): FinishId[] {
  const found: FinishId[] = [];
  const rules: Array<{ id: FinishId; source: string }> = [
    { id: "soft-touch", source: String.raw`soft[-\s]?touch|触感膜` },
    { id: "matte-lamination", source: String.raw`matte\s*(?:lamination|laminate|film|finish)|哑膜|磨砂膜` },
    { id: "gloss-lamination", source: String.raw`gloss(?:y)?\s*(?:lamination|laminate|film|finish)|光膜|亮膜` },
    { id: "lamination", source: String.raw`\blamination\b|\blaminated\b|\blaminate\b|覆膜` },
    { id: "foil", source: String.raw`\bfoil\b|烫金|烫银|烫玫瑰金` },
    { id: "emboss", source: String.raw`\bemboss(?:ing|ed)?\b|击凸|压凸` },
    { id: "deboss", source: String.raw`\bdeboss(?:ing|ed)?\b|压凹` },
    { id: "spot-uv", source: String.raw`spot\s*uv|局部\s*uv` },
    { id: "varnish", source: String.raw`\bvarnish\b|水性光油|过油` },
  ];
  for (const rule of rules) {
    if (new RegExp(rule.source, "i").test(text)) found.push(rule.id);
  }
  const specificLam = found.some((id) =>
    id === "matte-lamination" || id === "gloss-lamination" || id === "soft-touch",
  );
  const trimmed = specificLam ? found.filter((id) => id !== "lamination") : found;
  if (!trimmed.includes("emboss") && !trimmed.includes("deboss") && /凹凸/.test(text)) {
    trimmed.push("emboss-deboss");
  }
  return trimmed;
}

function findInsert(text: string): { id: InsertId; conflict: boolean } {
  const none = /no\s+insert|without\s+(?:an?\s+)?insert|insert\s+not\s+required|无内托|不需要内托|无内衬/i.test(text);
  const ids: InsertId[] = [];
  if (/\beva\b/i.test(text)) ids.push("eva");
  const withoutEvaFoam = text.replace(/\beva\s*foam\b/gi, " ");
  if (/\bfoam\b|sponge|海绵|珍珠棉|\bepe\b/i.test(withoutEvaFoam)) ids.push("foam");
  if (/flock(?:ing|ed)?|velvet|丝绒|植绒/i.test(text)) ids.push("flock");
  if (/\bblister\b|吸塑/i.test(text)) ids.push("blister");
  if (/paper\s*insert|card(?:board)?\s*insert|纸托|卡纸内托|纸内托/i.test(text)) ids.push("paper");
  const unique = [...new Set(ids)];
  if (none && unique.length > 0) return { id: "", conflict: true };
  if (none) return { id: "none", conflict: false };
  if (unique.length === 1) return { id: unique[0]!, conflict: false };
  if (unique.length > 1) return { id: "", conflict: true };
  return { id: "", conflict: false };
}

function findLooseProduct(text: string): string {
  const match = /(?:product\s+is|item\s+is|内容物(?:是|为)?|产品是)\s*[:：]?\s*([^\n。]{2,70})/i.exec(text);
  if (!match?.[1]) return "";
  return compact(match[1].replace(/[,，].*$/, ""));
}

function findArtwork(text: string): { value: ArtworkValue; conflict: boolean } {
  const ready = /artwork\s+(?:is\s+)?ready|print[-\s]?ready(?:\s+files?)?|设计稿已(?:有|完成|准备)|有设计稿|文件已齐/i.test(text);
  const needed = /need(?:s)?\s+(?:the\s+)?design|artwork\s+(?:is\s+)?(?:not\s+ready|needed)|no\s+artwork|please\s+design|需要设计|没有设计稿|需设计稿|需(?:要)?设计/i.test(text);
  if (ready && needed) return { value: "", conflict: true };
  if (ready) return { value: "ready", conflict: false };
  if (needed) return { value: "needed", conflict: false };
  return { value: "", conflict: false };
}

const COUNTRIES: Array<{ en: string; source: string; needsCue: boolean }> = [
  { en: "United States", source: String.raw`united\s+states|美国|\bUSA\b|U\.S\.A\.`, needsCue: false },
  { en: "United States", source: String.raw`\bUS\b|U\.S\.`, needsCue: true },
  { en: "United Kingdom", source: String.raw`united\s+kingdom|英国|england|\bUK\b|U\.K\.`, needsCue: false },
  { en: "Germany", source: String.raw`germany|德国`, needsCue: false },
  { en: "France", source: String.raw`france|法国`, needsCue: false },
  { en: "Italy", source: String.raw`italy|意大利`, needsCue: false },
  { en: "Spain", source: String.raw`spain|西班牙`, needsCue: false },
  { en: "Netherlands", source: String.raw`netherlands|holland|荷兰`, needsCue: false },
  { en: "Belgium", source: String.raw`belgium|比利时`, needsCue: false },
  { en: "Australia", source: String.raw`australia|澳大利亚|澳洲`, needsCue: false },
  { en: "Canada", source: String.raw`canada|加拿大`, needsCue: false },
  { en: "Japan", source: String.raw`japan|日本`, needsCue: false },
  { en: "South Korea", source: String.raw`south\s+korea|韩国`, needsCue: false },
  { en: "Singapore", source: String.raw`singapore|新加坡`, needsCue: false },
  { en: "United Arab Emirates", source: String.raw`united\s+arab\s+emirates|阿联酋|\bUAE\b`, needsCue: false },
  { en: "Saudi Arabia", source: String.raw`saudi\s+arabia|沙特`, needsCue: false },
  { en: "Mexico", source: String.raw`mexico|墨西哥`, needsCue: false },
  { en: "Brazil", source: String.raw`brazil|巴西`, needsCue: false },
  { en: "India", source: String.raw`\bindia\b|印度`, needsCue: false },
  { en: "Thailand", source: String.raw`thailand|泰国`, needsCue: false },
  { en: "Vietnam", source: String.raw`vietnam|越南`, needsCue: false },
  { en: "Malaysia", source: String.raw`malaysia|马来西亚`, needsCue: false },
  { en: "Indonesia", source: String.raw`indonesia|印度尼西亚|印尼`, needsCue: false },
  { en: "New Zealand", source: String.raw`new\s+zealand|新西兰`, needsCue: false },
  { en: "Sweden", source: String.raw`sweden|瑞典`, needsCue: false },
  { en: "Switzerland", source: String.raw`switzerland|瑞士`, needsCue: false },
  { en: "Poland", source: String.raw`poland|波兰`, needsCue: false },
  { en: "Hong Kong", source: String.raw`hong\s+kong|香港`, needsCue: false },
  { en: "Taiwan", source: String.raw`taiwan|台湾`, needsCue: false },
];

function findTrade(text: string): {
  destination: string;
  destinationCandidates: string[];
  incoterm: string;
  incotermCandidates: string[];
  place: string;
  placeCandidates: string[];
} {
  const incoHits: Array<{ term: string; place: string }> = [];
  for (const match of text.matchAll(new RegExp(String.raw`\b(${INCOTERMS.join("|")})\b`, "gi"))) {
    const term = (match[1] ?? "").toUpperCase();
    const end = (match.index ?? 0) + match[0].length;
    incoHits.push({ term, place: placeAfter(text.slice(end, end + 32)) });
  }
  const terms = unique(incoHits.map((hit) => hit.term));
  const places = unique(incoHits.map((hit) => hit.place).filter(Boolean));
  const incoterm = terms.length === 1 ? terms[0]! : "";
  const place = terms.length === 1 && places.length === 1 ? places[0]! : "";

  const destinations = unique(
    COUNTRIES.flatMap((country) => (countryMentioned(text, country) ? [country.en] : [])),
  );

  return {
    destination: destinations.length === 1 ? destinations[0]! : "",
    destinationCandidates: destinations,
    incoterm,
    incotermCandidates: terms,
    place,
    placeCandidates: places,
  };
}

function countryMentioned(text: string, country: { source: string; needsCue: boolean }): boolean {
  const pattern = new RegExp(country.source, "i");
  if (!country.needsCue) return pattern.test(text);
  const cue = /ship(?:ped|ping)?\s+to|deliver(?:ed|y)?\s+to|destination\s*[:：]?|发往|运往|运至|目的地\s*[:：]?|送到/gi;
  for (const match of text.matchAll(cue)) {
    const start = match.index ?? 0;
    if (pattern.test(text.slice(start, start + 48))) return true;
  }
  return false;
}

function placeAfter(slice: string): string {
  const match = /^\s*([A-Za-z\u4e00-\u9fff]+(?:\s+[A-Za-z\u4e00-\u9fff]+){0,2})/.exec(slice);
  if (!match?.[1]) return "";
  const stop = /^(and|or|to|for|if|with|please|ship|shipping|but|the|a|on|in|is|are|we|our|your|need|quote|by|from|of|after|before|then)$/i;
  const kept: string[] = [];
  for (const word of match[1].split(/\s+/)) {
    if (stop.test(word)) break;
    if (!/^[\p{L}.-]{2,}$/u.test(word)) break;
    kept.push(word);
    if (kept.length === 2) break;
  }
  return kept.join(" ");
}

function findSchedule(text: string): { value: string; candidates: string[] } {
  const found: string[] = [];
  const patterns = [
    /(?:need(?:ed)?\s+by|deliver(?:y)?\s+by|ship\s+by|ready\s+by|deadline\s*[:：]?|before)\s*([A-Za-z]+\.?\s+\d{1,2},?\s+\d{4}|\d{1,2}\s+[A-Za-z]+\.?\s+\d{4}|\d{4}-\d{2}-\d{2})/gi,
    /(?:lead\s*time|delivery\s*time)\s*[:：]?\s*(\d{1,3}\s*(?:days?|weeks?|months?))/gi,
    /交期\s*[:：]?\s*([^\n,，。]{2,40})/g,
    /(\d{4}\s*年\s*\d{1,2}\s*月(?:\s*\d{1,2}\s*日)?)/g,
  ];
  for (const pattern of patterns) {
    for (const match of text.matchAll(pattern)) {
      const value = compact(match[1] ?? "");
      if (value && !found.includes(value)) found.push(value);
    }
  }
  const narrowed = found.filter((value, _, all) => !all.some((other) => other !== value && other.includes(value)));
  if (narrowed.length === 1) return { value: narrowed[0]!, candidates: narrowed };
  return { value: "", candidates: narrowed };
}

function canonUnit(raw: string): Unit {
  const value = raw.toLowerCase();
  if (value === "mm" || value.startsWith("millim") || value === "毫米") return "mm";
  if (value === "cm" || value.startsWith("centim") || value === "厘米" || value === "公分") return "cm";
  if (value === "in" || value.startsWith("inch") || value === '"' || value === "英寸") return "inch";
  return "";
}

function maskNonQuantities(text: string): string {
  return text.replace(
    /\d+(?:\.\d+)?\s*(?:mm|cm|inches|inch|in|gsm|g\/m2|ml|days?|weeks?|个月|天|周)(?![a-z0-9])|pantone\s*[a-z]?\s*\d{2,4}|\bpms\s*\d{2,4}/gi,
    (match) => blank(match),
  );
}

function maskRanges(text: string, ranges: Range[]): string {
  if (ranges.length === 0) return text;
  const chars = text.split("");
  for (const range of ranges) {
    for (let index = Math.max(0, range.start); index < Math.min(chars.length, range.end); index += 1) {
      if (chars[index] !== "\n") chars[index] = " ";
    }
  }
  return chars.join("");
}

function eachLine(text: string, visit: (line: string, offset: number) => void): void {
  let offset = 0;
  const lines = text.split("\n");
  for (let index = 0; index < lines.length; index += 1) {
    visit(lines[index] ?? "", offset);
    offset += (lines[index] ?? "").length + 1;
  }
}

function lastIndex(text: string, pattern: RegExp): number {
  const flags = pattern.flags.includes("g") ? pattern.flags : `${pattern.flags}g`;
  let at = -1;
  for (const match of text.matchAll(new RegExp(pattern.source, flags))) at = match.index ?? at;
  return at;
}

function overlaps(ranges: Range[], start: number, end: number): boolean {
  return ranges.some((range) => start < range.end && end > range.start);
}

function unique(values: string[]): string[] {
  const output: string[] = [];
  for (const value of values) {
    if (value && !output.includes(value)) output.push(value);
  }
  return output;
}

function compact(value: string): string {
  return value.replace(/\s+/g, " ").trim().slice(0, 160);
}

function blank(value: string): string {
  return value.replace(/[^\n]/g, " ");
}
