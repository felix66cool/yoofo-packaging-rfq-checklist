import { assess } from "./assess.ts";
import { BRAND, DISCLAIMER } from "./brand.ts";
import {
  artworkLabel,
  bi,
  boxLabel,
  countryLabel,
  finishLabel,
  insertLabel,
  issueMessage,
  materialLabel,
  pair,
  printLabel,
  scopeLabel,
  t,
  unitLabel,
} from "./i18n.ts";
import { formatGrouped, parseDecimal, parseQty } from "./numbers.ts";
import type { Assessment, ChecklistLang, DimensionRow, Locale, ReaderFlags, RfqDraft } from "./types.ts";

export interface ChecklistFile {
  text: string;
  json: ChecklistJson;
}

export interface ChecklistJson {
  schema: typeof BRAND.schema;
  tool: typeof BRAND.tool;
  company: typeof BRAND.company;
  site: typeof BRAND.site;
  quotePage: typeof BRAND.quote;
  version: typeof BRAND.version;
  generatedLocally: true;
  quantitiesAreCumulative: false;
  reader: {
    method: "deterministic-rules";
    usesLanguageModel: false;
  };
  disclaimer: { en: string; zh: string };
  checklistLanguage: ChecklistLang;
  enquiryText?: string;
  fields: {
    boxType: string | null;
    boxTypeOther: string;
    closure: string | null;
    dimensions: Array<{
      scope: string | null;
      length: number | null;
      width: number | null;
      height: number | null;
      unit: string | null;
      unitIssue: string;
    }>;
    orderQuantities: Array<{ amount: number | null; raw: string }>;
    minimumOrderQuantities: Array<{ amount: number | null; raw: string }>;
    sampleQuantities: Array<{ amount: number | null; raw: string }>;
    material: string | null;
    materialOther: string;
    thickness: string;
    exteriorPrint: string | null;
    interiorPrint: string | null;
    finishes: string[];
    insert: string | null;
    insertOther: string;
    productFit: string;
    artwork: string | null;
    destination: string;
    incoterm: string | null;
    incotermPlace: string;
    schedule: string;
    shippingCarton: string;
    buyerNotes: string;
  };
  issues: Array<{ severity: string; code: string; en: string; zh: string }>;
}

export function buildChecklist(
  draft: RfqDraft,
  flags: ReaderFlags,
  lang: ChecklistLang,
  enquiry?: string,
): ChecklistFile {
  const assessment = assess(draft, flags);
  return {
    text: checklistText(draft, assessment, lang),
    json: checklistJson(draft, assessment, lang, enquiry),
  };
}

export function checklistText(draft: RfqDraft, assessment: Assessment, lang: ChecklistLang): string {
  const locale: Locale = lang === "zh" ? "zh" : "en";
  const lines: string[] = [
    pair(lang, "Packaging RFQ Checklist", "包装询价清单"),
    BRAND.tool,
    BRAND.company,
    BRAND.site,
    "",
    pair(lang, "NOT A QUOTATION", "不是报价"),
    pair(lang, DISCLAIMER.en, DISCLAIMER.zh),
    "",
    generatedLine(lang),
    pair(lang, "Rules only. No language model. No price calculation.", "只有规则。没有语言模型。不算价格。"),
    "",
    heading(lang, "Box structure", "盒型结构"),
    valueLine(draft.boxType ? boxLine(lang, draft) : notConfirmed(lang)),
    ...closureLines(lang, draft),
    "",
    heading(lang, "Box size", "盒子尺寸"),
  ];

  if (draft.dimensions.length === 0) lines.push(notConfirmed(lang));
  for (const row of draft.dimensions) lines.push(formatDimension(lang, row));

  const tiers = draft.quantities.filter((row) => row.kind === "tier");
  const moqs = draft.quantities.filter((row) => row.kind === "moq");
  const samples = draft.quantities.filter((row) => row.kind === "sample");

  lines.push("", heading(lang, "Order quantities", "订单数量"));
  if (tiers.length === 0) lines.push(notConfirmed(lang));
  else {
    lines.push(tiers.length > 1 ? bi(lang, "qtySeparateMany") : bi(lang, "qtySeparateOne"));
    for (const row of tiers) lines.push(`- ${formatAmount(row.amount, locale)}`);
  }

  if (moqs.length > 0) {
    lines.push("", heading(lang, "Minimum order quantity", "起订量"));
    lines.push(bi(lang, "moqLine"));
    for (const row of moqs) lines.push(`- ${formatAmount(row.amount, locale)}`);
  }
  if (samples.length > 0) {
    lines.push("", heading(lang, "Samples", "样品"));
    lines.push(bi(lang, "sampleLine"));
    for (const row of samples) lines.push(`- ${formatAmount(row.amount, locale)}`);
  }

  lines.push(
    "",
    heading(lang, "Board", "板材"),
    draft.materialKind
      ? pair(
          lang,
          materialLabel("en", draft.materialKind) + (draft.materialKind === "other" && draft.materialOther.trim() ? `: ${draft.materialOther.trim()}` : ""),
          materialLabel("zh", draft.materialKind) + (draft.materialKind === "other" && draft.materialOther.trim() ? `：${draft.materialOther.trim()}` : ""),
        )
      : notConfirmed(lang),
    `${pair(lang, "Thickness", "厚度")}: ${draft.thickness.trim() || notConfirmed(lang)}`,
    "",
    heading(lang, "Exterior print", "外面印刷"),
    draft.exteriorPrint ? pair(lang, printLabel("en", draft.exteriorPrint), printLabel("zh", draft.exteriorPrint)) : notConfirmed(lang),
    heading(lang, "Interior print", "里面印刷"),
    draft.interiorPrint ? pair(lang, printLabel("en", draft.interiorPrint), printLabel("zh", draft.interiorPrint)) : notConfirmed(lang),
    "",
    heading(lang, "Finishes", "表面工艺"),
  );
  if (draft.finishes.length === 0) lines.push(notConfirmed(lang));
  else {
    for (const finish of draft.finishes) {
      lines.push(`- ${pair(lang, finishLabel("en", finish), finishLabel("zh", finish))}`);
    }
  }

  lines.push(
    "",
    heading(lang, "Insert", "内托"),
    draft.insert
      ? pair(lang, insertLabel("en", draft.insert), insertLabel("zh", draft.insert)) +
          (draft.insert === "other" && draft.insertOther.trim() ? ` (${draft.insertOther.trim()})` : "")
      : notConfirmed(lang),
    heading(lang, "Product that must fit", "需要装入的产品"),
    draft.productFit.trim() || notConfirmed(lang),
    heading(lang, "Artwork", "设计稿"),
    draft.artwork ? pair(lang, artworkLabel("en", draft.artwork), artworkLabel("zh", draft.artwork)) : notConfirmed(lang),
    "",
    heading(lang, "Destination", "目的地"),
    draft.destination.trim()
      ? pair(lang, draft.destination.trim(), countryLabel("zh", draft.destination.trim()))
      : notConfirmed(lang),
    heading(lang, "Incoterm", "贸易条款"),
    draft.incoterm
      ? [draft.incoterm, draft.incotermPlace.trim()].filter(Boolean).join(" ")
      : notConfirmed(lang),
    heading(lang, "Date or lead time", "日期或交期"),
    draft.schedule.trim() || notConfirmed(lang),
  );

  if (draft.shippingCarton.trim()) {
    lines.push(
      heading(lang, "Shipping carton", "外箱"),
      draft.shippingCarton.trim(),
      pair(lang, "This is the export carton, not the gift-box size.", "这是外箱，不是礼盒尺寸。"),
    );
  }

  if (draft.buyerNotes.trim()) {
    lines.push("", heading(lang, "Notes", "备注"), draft.buyerNotes.trim());
  }

  const critical = assessment.issues.filter((issue) => issue.severity === "critical");
  const warnings = assessment.issues.filter((issue) => issue.severity === "warning");
  const recommended = assessment.issues.filter((issue) => issue.severity === "recommended");
  lines.push("", heading(lang, "Still missing before a useful quote", "报价前仍缺的关键信息"));
  if (critical.length === 0) lines.push(bi(lang, "positiveGaps"));
  else for (const issue of critical) lines.push(`- ${message(lang, issue)}`);

  if (warnings.length > 0) {
    lines.push("", heading(lang, "Resolve before you send", "发出前请核对"));
    for (const issue of warnings) lines.push(`- ${message(lang, issue)}`);
  }
  if (recommended.length > 0) {
    lines.push("", heading(lang, "Still unconfirmed", "尚未确认"));
    for (const issue of recommended) lines.push(`- ${message(lang, issue)}`);
  }

  lines.push(
    "",
    pair(lang, "Quote page, for you to open yourself", "询价页面，需你自行打开"),
    BRAND.quote,
    pair(lang, "This checklist does not send email and does not submit the form.", "本清单不发送邮件，也不提交表单。"),
    "",
  );
  return `${lines.join("\n").replace(/\n{3,}/g, "\n\n")}\n`;
}

export function checklistJson(
  draft: RfqDraft,
  assessment: Assessment,
  lang: ChecklistLang,
  enquiry?: string,
): ChecklistJson {
  const qty = (kind: "tier" | "moq" | "sample") =>
    draft.quantities
      .filter((row) => row.kind === kind)
      .map((row) => ({ amount: parseQty(row.amount), raw: row.amount.trim() }));

  const json: ChecklistJson = {
    schema: BRAND.schema,
    tool: BRAND.tool,
    company: BRAND.company,
    site: BRAND.site,
    quotePage: BRAND.quote,
    version: BRAND.version,
    generatedLocally: true,
    quantitiesAreCumulative: false,
    reader: { method: "deterministic-rules", usesLanguageModel: false },
    disclaimer: { en: DISCLAIMER.en, zh: DISCLAIMER.zh },
    checklistLanguage: lang,
    fields: {
      boxType: draft.boxType || null,
      boxTypeOther: draft.boxTypeOther.trim(),
      closure: draft.closure || null,
      dimensions: draft.dimensions.map((row) => ({
        scope: row.scope || null,
        length: parseDecimal(row.length),
        width: parseDecimal(row.width),
        height: parseDecimal(row.height),
        unit: row.unit || null,
        unitIssue: row.unitIssue,
      })),
      orderQuantities: qty("tier"),
      minimumOrderQuantities: qty("moq"),
      sampleQuantities: qty("sample"),
      material: draft.materialKind || null,
      materialOther: draft.materialOther.trim(),
      thickness: draft.thickness.trim(),
      exteriorPrint: draft.exteriorPrint || null,
      interiorPrint: draft.interiorPrint || null,
      finishes: [...draft.finishes],
      insert: draft.insert || null,
      insertOther: draft.insertOther.trim(),
      productFit: draft.productFit.trim(),
      artwork: draft.artwork || null,
      destination: draft.destination.trim(),
      incoterm: draft.incoterm || null,
      incotermPlace: draft.incotermPlace.trim(),
      schedule: draft.schedule.trim(),
      shippingCarton: draft.shippingCarton.trim(),
      buyerNotes: draft.buyerNotes.trim(),
    },
    issues: assessment.issues.map((issue) => ({
      severity: issue.severity,
      code: issue.code,
      en: issueMessage("en", issue),
      zh: issueMessage("zh", issue),
    })),
  };
  if (enquiry !== undefined) json.enquiryText = enquiry;
  return json;
}

function boxLine(lang: ChecklistLang, draft: RfqDraft): string {
  if (!draft.boxType) return notConfirmed(lang);
  const base = pair(lang, boxLabel("en", draft.boxType), boxLabel("zh", draft.boxType));
  if (draft.boxType === "other" && draft.boxTypeOther.trim()) return `${base}: ${draft.boxTypeOther.trim()}`;
  return base;
}

function formatDimension(lang: ChecklistLang, row: DimensionRow): string {
  const scope = pair(lang, scopeLabel("en", row.scope), scopeLabel("zh", row.scope));
  const unit = row.unit
    ? pair(lang, unitLabel("en", row.unit), unitLabel("zh", row.unit))
    : pair(lang, "unit not set", "单位未定");
  const numbers = [row.length, row.width, row.height].map((part) => (part.trim() ? part.trim() : "—")).join(" × ");
  const mixed = row.unitIssue === "mixed" ? ` (${pair(lang, "mixed units, not converted", "单位混用，未换算")})` : "";
  return `${scope}: ${numbers} ${unit}${mixed}`;
}

function formatAmount(raw: string, locale: Locale): string {
  const value = parseQty(raw);
  if (value === null) return raw.trim() || t(locale, "notConfirmed");
  return formatGrouped(value, locale);
}

function heading(lang: ChecklistLang, en: string, zh: string): string {
  return pair(lang, en, zh);
}

function valueLine(value: string): string {
  return value;
}

function notConfirmed(lang: ChecklistLang): string {
  return pair(lang, "Not confirmed", "未确认");
}

function message(lang: ChecklistLang, issue: Assessment["issues"][number]): string {
  return pair(lang, issueMessage("en", issue), issueMessage("zh", issue));
}

const MONTHS_EN = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

/** Calendar day in an explicit zone. Does not use the UTC date from toISOString. */
export function calendarInTimeZone(now: Date, timeZone: string): { year: number; month: number; day: number } {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const pick = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((part) => part.type === type)?.value);
  return { year: pick("year"), month: pick("month"), day: pick("day") };
}

export function localTimeZone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
}

export function generatedLine(lang: ChecklistLang, now = new Date(), timeZone = localTimeZone()): string {
  const { year, month, day } = calendarInTimeZone(now, timeZone);
  const en = `${day} ${MONTHS_EN[month - 1] ?? month} ${year} (${timeZone})`;
  const zh = `${year}年${month}月${day}日（${timeZone}）`;
  if (lang === "zh") return `于 ${zh} 在本浏览器生成，没有上传。`;
  if (lang === "en") return `Generated in this browser on ${en}. It was not uploaded.`;
  return `Generated in this browser on ${en}. It was not uploaded. / 于 ${zh} 在本浏览器生成，没有上传。`;
}

function closureLines(lang: ChecklistLang, draft: RfqDraft): string[] {
  if (draft.closure !== "magnetic" || draft.boxType === "magnetic") return [];
  return [
    heading(lang, "Closure", "闭合"),
    pair(lang, "Magnetic closure", "磁吸"),
  ];
}
