import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { assess } from "../src/assess.ts";
import { calendarInTimeZone, checklistJson, checklistText, generatedLine } from "../src/export.ts";
import { readEnquiry } from "../src/extract.ts";
import { fixtureById } from "../src/fixtures.ts";
import { issueMessage } from "../src/i18n.ts";
import { sanitizeToText } from "../src/sanitize.ts";
import { ISSUE_CODES, type Issue, type RfqDraft } from "../src/types.ts";

function tiers(draft: RfqDraft): string[] {
  return draft.quantities.filter((row) => row.kind === "tier").map((row) => row.amount);
}

function moqs(draft: RfqDraft): string[] {
  return draft.quantities.filter((row) => row.kind === "moq").map((row) => row.amount);
}

function read(text: string) {
  return readEnquiry(text);
}

const LIVE_QA = "Example only: Magnetic book-style gift box, 20 x 15 x 8 cm outer dimensions, MDF 2mm, quantities 2000 / 5000 / 8000 pcs as alternatives. CMYK outside, matte lamination, EVA insert. FOB Shanghai.";

test("magnetic book-style keeps the structure and the closure", () => {
  const result = read(LIVE_QA);
  assert.equal(result.draft.boxType, "book");
  assert.equal(result.draft.closure, "magnetic");
  assert.equal(result.draft.dimensions[0]?.scope, "outer");
  assert.equal(result.draft.dimensions[0]?.length, "20");
  assert.equal(result.draft.dimensions[0]?.unit, "cm");
  assert.equal(result.draft.materialKind, "mdf");
  assert.equal(result.draft.thickness, "2 mm");
  assert.deepEqual(tiers(result.draft), ["2000", "5000", "8000"]);
  assert.equal(result.draft.exteriorPrint, "cmyk");
  assert.ok(result.draft.finishes.includes("matte-lamination"));
  assert.equal(result.draft.insert, "eva");
  assert.equal(result.draft.incoterm, "FOB");
  assert.equal(result.draft.incotermPlace, "Shanghai");
  const text = checklistText(result.draft, assess(result.draft, result.flags), "both");
  assert.match(text, /Book-style box/);
  assert.match(text, /书型盒/);
  assert.match(text, /Magnetic closure/);
  assert.match(text, /磁吸/);
  assert.doesNotMatch(text, /15,?000/);
  const json = checklistJson(result.draft, assess(result.draft, result.flags), "en");
  assert.equal(json.fields.boxType, "book");
  assert.equal(json.fields.closure, "magnetic");
});

test("Chinese magnetic book-style keeps both facts", () => {
  const result = read("磁吸书型礼盒，外尺寸 20×15×8厘米，数量 2000套");
  assert.equal(result.draft.boxType, "book");
  assert.equal(result.draft.closure, "magnetic");
  assert.equal(result.draft.dimensions[0]?.scope, "outer");
  assert.equal(result.draft.dimensions[0]?.unit, "cm");
});

test("a local calendar day is not taken from the UTC date", () => {
  const instant = new Date("2026-11-16T16:30:00.000Z");
  const shanghai = calendarInTimeZone(instant, "Asia/Shanghai");
  assert.deepEqual(shanghai, { year: 2026, month: 11, day: 17 });
  const utc = calendarInTimeZone(instant, "UTC");
  assert.deepEqual(utc, { year: 2026, month: 11, day: 16 });
  const line = generatedLine("both", instant, "Asia/Shanghai");
  assert.match(line, /17 November 2026 \(Asia\/Shanghai\)/);
  assert.match(line, /2026年11月17日（Asia\/Shanghai）/);
  assert.doesNotMatch(line, /16 November 2026/);
  const utcLine = generatedLine("en", instant, "UTC");
  assert.match(utcLine, /16 November 2026 \(UTC\)/);
});

test("the page policy does not put frame-ancestors in a meta tag", () => {
  const config = readFileSync(new URL("../vite.config.ts", import.meta.url), "utf8");
  assert.match(config, /connect-src 'none'/);
  assert.match(config, /form-action 'none'/);
  assert.doesNotMatch(config, /frame-ancestors/);
  assert.doesNotMatch(config, /cloudflare|google-analytics|gtag/i);
});

test("clear English enquiry fills the quote-critical fields without guessing", () => {
  const result = read(fixtureById("clear-en").text);
  assert.equal(result.draft.boxType, "magnetic");
  assert.deepEqual(
    result.draft.dimensions.map((row) => ({
      scope: row.scope,
      length: row.length,
      width: row.width,
      height: row.height,
      unit: row.unit,
    })),
    [
      { scope: "inner", length: "120", width: "90", height: "80", unit: "mm" },
      { scope: "outer", length: "126", width: "96", height: "86", unit: "mm" },
    ],
  );
  assert.deepEqual(tiers(result.draft), ["2000", "5000"]);
  assert.deepEqual(moqs(result.draft), []);
  assert.equal(result.draft.materialKind, "grayboard");
  assert.equal(result.draft.thickness, "2 mm");
  assert.equal(result.draft.exteriorPrint, "cmyk");
  assert.equal(result.draft.interiorPrint, "none");
  assert.ok(result.draft.finishes.includes("matte-lamination"));
  assert.ok(result.draft.finishes.includes("foil"));
  assert.equal(result.draft.insert, "eva");
  assert.match(result.draft.productFit, /70 × 70 × 75 mm/);
  assert.match(result.draft.productFit, /candle jar/);
  assert.equal(result.draft.artwork, "ready");
  assert.equal(result.draft.destination, "Germany");
  assert.equal(result.draft.incoterm, "FOB");
  assert.equal(result.draft.incotermPlace, "Shanghai");
  assert.match(result.draft.schedule, /15 March 2027/);
  assert.equal(result.draft.dimensions.some((row) => row.length === "70"), false);
});

test("Chinese greyboard enquiry is read in Simplified Chinese", () => {
  const result = read(fixtureById("zh-grayboard").text);
  assert.equal(result.draft.boxType, "lid-base");
  assert.equal(result.draft.dimensions[0]?.scope, "inner");
  assert.equal(result.draft.dimensions[0]?.length, "200");
  assert.equal(result.draft.dimensions[0]?.unit, "mm");
  assert.equal(result.draft.dimensions[1]?.scope, "outer");
  assert.equal(result.draft.dimensions[1]?.length, "208");
  assert.equal(result.draft.materialKind, "grayboard");
  assert.notEqual(result.draft.materialKind, "mdf");
  assert.equal(result.draft.thickness, "2 mm");
  assert.equal(result.draft.exteriorPrint, "cmyk");
  assert.equal(result.draft.interiorPrint, "none");
  assert.ok(result.draft.finishes.includes("matte-lamination"));
  assert.ok(result.draft.finishes.includes("foil"));
  assert.equal(result.draft.insert, "paper");
  assert.match(result.draft.productFit, /80 × 40 × 20 mm/);
  assert.deepEqual(tiers(result.draft), ["2000"]);
  assert.equal(result.draft.artwork, "ready");
  assert.equal(result.draft.incoterm, "FOB");
  assert.equal(result.draft.incotermPlace, "上海");
  assert.equal(result.draft.destination, "United States");
  assert.match(result.draft.schedule, /2027年4月/);
});

test("units are recognised only when written", () => {
  const cm = read("Inner 10 x 8 x 3 cm. Qty 2000 pcs. Grayboard lid and base.");
  assert.equal(cm.draft.dimensions[0]?.unit, "cm");
  assert.equal(cm.draft.dimensions[0]?.scope, "inner");

  const inches = read('Outer size 4 x 3 x 2 inches. 2000 pcs. MDF drawer box.');
  assert.equal(inches.draft.dimensions[0]?.unit, "inch");
  assert.equal(inches.draft.dimensions[0]?.scope, "outer");
  assert.equal(inches.draft.materialKind, "mdf");

  const quoted = read('Size 4 x 3 x 2". Inner. 2000 pcs. Grayboard.');
  assert.equal(quoted.draft.dimensions[0]?.unit, "inch");

  const bare = read("Size 10 x 8 x 3. Qty 2000 pcs.");
  assert.equal(bare.draft.dimensions[0]?.unit, "");
  assert.equal(bare.draft.dimensions[0]?.scope, "");
  const bareAssessment = assess(bare.draft, bare.flags);
  assert.ok(bareAssessment.issues.some((issue) => issue.code === "missing-unit"));
  assert.ok(bareAssessment.issues.some((issue) => issue.code === "missing-scope"));
  assert.match(issueMessage("en", bareAssessment.issues.find((issue) => issue.code === "missing-unit") as Issue), /not assumed/i);
  assert.doesNotMatch(issueMessage("en", { code: "missing-unit", severity: "critical" }), /assumed mm|default/i);
});

test("a bare triple is not treated as millimetres", () => {
  const result = read("Box size 200 x 150 x 60 for a rigid box. 2000 pcs.");
  assert.equal(result.draft.dimensions[0]?.unit, "");
  assert.equal(result.draft.dimensions[0]?.length, "200");
});

test("fullwidth digits and the multiplication sign are normalised", () => {
  const result = read("内尺寸：２００×１５０×６０ｍｍ，数量2000套，灰板");
  assert.equal(result.draft.dimensions[0]?.length, "200");
  assert.equal(result.draft.dimensions[0]?.width, "150");
  assert.equal(result.draft.dimensions[0]?.height, "60");
  assert.equal(result.draft.dimensions[0]?.unit, "mm");
  assert.equal(result.draft.dimensions[0]?.scope, "inner");
});

test("MDF, density board, and greyboard stay distinct", () => {
  const mdf = read("Drawer box, 3mm MDF, inner 100 x 80 x 40 mm, qty 2000 pcs.");
  assert.equal(mdf.draft.materialKind, "mdf");
  assert.equal(mdf.draft.thickness, "3 mm");
  assert.equal(mdf.flags.materialCandidates.includes("grayboard"), false);

  const density = read("Book style box in 4mm density board. Inner 100 x 80 x 40 mm. 2000 pcs.");
  assert.equal(density.draft.materialKind, "mdf");

  const fibre = read("Magnetic box, medium density fiberboard 3mm, inner 100 x 80 x 40 mm, 2000 pcs.");
  assert.equal(fibre.draft.materialKind, "mdf");

  const chineseMdf = read("书型盒，密度板 3mm，内尺寸 100x80x40mm，数量 2000套");
  assert.equal(chineseMdf.draft.materialKind, "mdf");
  assert.notEqual(chineseMdf.draft.materialKind, "grayboard");

  const gray = read("Rigid box in 1200gsm grey board. Inner 90 x 60 x 30 mm. Qty 2000 pcs.");
  assert.equal(gray.draft.materialKind, "grayboard");
  assert.equal(gray.draft.thickness, "1200 gsm");
  assert.notEqual(gray.draft.materialKind, "mdf");

  const chip = read("Lid and base, 1.5mm chipboard, inner 90 x 60 x 30 mm, 2000 pcs.");
  assert.equal(chip.draft.materialKind, "grayboard");
  assert.equal(chip.draft.thickness, "1.5 mm");

  const chineseGray = read("天地盖，灰板纸 2mm，内尺寸 100x80x40mm，数量 2000套");
  assert.equal(chineseGray.draft.materialKind, "grayboard");
  assert.notEqual(chineseGray.draft.materialKind, "mdf");

  const coated = read("Wrap is 灰底白板 art paper. Inner 100 x 80 x 40 mm. 2000 pcs. Magnetic box.");
  assert.notEqual(coated.draft.materialKind, "grayboard");
  assert.notEqual(coated.draft.materialKind, "mdf");
});

test("MDF and grayboard together are not resolved", () => {
  const result = read(fixtureById("mdf-or-grayboard").text);
  assert.equal(result.draft.boxType, "drawer");
  assert.equal(result.draft.materialKind, "");
  assert.equal(result.draft.thickness, "");
  assert.ok(result.flags.materialCandidates.includes("mdf"));
  assert.ok(result.flags.materialCandidates.includes("grayboard"));
  assert.equal(result.draft.dimensions[0]?.unit, "inch");
  assert.equal(result.draft.dimensions[0]?.scope, "inner");
  assert.deepEqual(tiers(result.draft), ["2000"]);
  assert.equal(result.flags.adviceRequested, true);
  const assessment = assess(result.draft, result.flags);
  assert.ok(assessment.issues.some((issue) => issue.code === "ambiguous-material"));
  assert.ok(assessment.issues.some((issue) => issue.code === "advice-requested"));
  const text = checklistText(result.draft, assessment, "en");
  assert.doesNotMatch(text, /recommend MDF|use MDF|better board|choose grayboard/i);
  result.draft.materialKind = "grayboard";
  const chosen = assess(result.draft, result.flags);
  assert.equal(chosen.issues.some((issue) => issue.code === "ambiguous-material"), false);
});

test("quantity tiers are not added together", () => {
  const result = read(fixtureById("three-tiers").text);
  assert.equal(result.draft.boxType, "book");
  assert.deepEqual(tiers(result.draft), ["500", "1000", "2000"]);
  assert.deepEqual(moqs(result.draft), ["2000"]);
  assert.equal(result.draft.materialKind, "grayboard");
  assert.equal(result.draft.thickness, "1.5 mm");
  assert.equal(result.draft.exteriorPrint, "pms");
  assert.ok(result.draft.finishes.includes("gloss-lamination"));
  assert.equal(result.draft.insert, "none");
  assert.equal(result.draft.artwork, "needed");
  assert.equal(result.draft.incoterm, "CIF");
  assert.equal(result.draft.incotermPlace, "Rotterdam");
  assert.equal(result.draft.destination, "");
  assert.match(result.draft.schedule, /45 days/);

  const assessment = assess(result.draft, result.flags);
  assert.ok(assessment.issues.some((issue) => issue.code === "tiers-separate"));
  assert.ok(assessment.issues.some((issue) => issue.code === "tier-below-moq"));
  const text = checklistText(result.draft, assessment, "both");
  assert.match(text, /Do not add them together/);
  assert.match(text, /不能相加/);
  assert.doesNotMatch(text, /\b3,?500\b/);
  assert.doesNotMatch(text, /\b4,?000\b/);

  const json = checklistJson(result.draft, assessment, "both");
  assert.equal(json.quantitiesAreCumulative, false);
  assert.equal(json.reader.usesLanguageModel, false);
  assert.deepEqual(json.fields.orderQuantities.map((row) => row.amount), [500, 1000, 2000]);
  assert.deepEqual(json.fields.minimumOrderQuantities.map((row) => row.amount), [2000]);
  assert.equal(Object.hasOwn(json, "totalQuantity"), false);
  assert.equal(Object.hasOwn(json.fields, "totalQuantity"), false);
  assert.doesNotMatch(JSON.stringify(json), /3500|3,500/);
});

test("Chinese quantity tiers and a plus sign stay separate", () => {
  const listed = read("数量：500套、1000套或2000套");
  assert.deepEqual(tiers(listed.draft), ["500", "1000", "2000"]);
  const plus = read("Please quote 1000+2000 pcs of a magnetic box.");
  assert.deepEqual(tiers(plus.draft), ["1000", "2000"]);
  assert.equal(plus.flags.plusSignSplit, true);
  const text = checklistText(plus.draft, assess(plus.draft, plus.flags), "en");
  assert.doesNotMatch(text, /\b3,?000\b/);
});

test("a minimum order quantity is not the order quantity", () => {
  const only = read("MOQ 2000 units. Inner 100 x 80 x 40 mm. Grayboard magnetic box.");
  assert.deepEqual(tiers(only.draft), []);
  assert.deepEqual(moqs(only.draft), ["2000"]);
  assert.ok(assess(only.draft, only.flags).issues.some((issue) => issue.code === "moq-only"));

  const both = read("MOQ 2000. Order quantity 5000 pcs. Inner 100 x 80 x 40 mm. Grayboard.");
  assert.deepEqual(tiers(both.draft), ["5000"]);
  assert.deepEqual(moqs(both.draft), ["2000"]);
  assert.equal(assess(both.draft, both.flags).issues.some((issue) => issue.code === "moq-only"), false);
});

test("FOB Shanghai is not a destination, and an absent destination stays empty", () => {
  const fob = read("FOB Shanghai. Inner 100 x 80 x 40 mm. 2000 pcs. Grayboard lid and base.");
  assert.equal(fob.draft.incoterm, "FOB");
  assert.equal(fob.draft.incotermPlace, "Shanghai");
  assert.equal(fob.draft.destination, "");

  const quiet = read("Magnetic box, inner 100 x 50 x 30 mm, 2000 pcs, grayboard.");
  assert.equal(quiet.draft.destination, "");
  assert.equal(quiet.draft.incoterm, "");
  assert.equal(quiet.draft.schedule, "");
  assert.equal(quiet.draft.exteriorPrint, "");
});

test("print is not assigned to a face that was not named", () => {
  const result = read("CMYK printing. Inner 100 x 80 x 40 mm. 2000 pcs. Grayboard magnetic box.");
  assert.equal(result.draft.exteriorPrint, "");
  assert.equal(result.draft.interiorPrint, "");
  assert.ok(result.flags.printUnassigned.length > 0);
  assert.ok(assess(result.draft, result.flags).issues.some((issue) => issue.code === "print-side"));
});

test("ambiguous example leaves unit, scope, structure, and print face open", () => {
  const result = read(fixtureById("ambiguous-size").text);
  assert.equal(result.draft.boxType, "");
  assert.equal(result.flags.genericBoxOnly, true);
  assert.equal(result.draft.dimensions[0]?.length, "10");
  assert.equal(result.draft.dimensions[0]?.unit, "");
  assert.equal(result.draft.dimensions[0]?.scope, "");
  assert.deepEqual(tiers(result.draft), ["3000"]);
  assert.equal(result.draft.materialKind, "");
  assert.equal(result.draft.exteriorPrint, "");
  assert.ok(result.draft.finishes.includes("lamination"));
  assert.equal(result.draft.destination, "");
});

test("two structures are listed instead of picking one", () => {
  const result = read("Is a drawer box or a magnetic box better? Inner 100 x 80 x 40 mm. 2000 pcs.");
  assert.equal(result.draft.boxType, "");
  assert.ok(result.flags.boxCandidates.includes("drawer"));
  assert.ok(result.flags.boxCandidates.includes("magnetic"));
});

test("a specific structure wins over the word rigid", () => {
  const result = read("magnetic closure rigid box, inner 100 x 80 x 40 mm, 2000 pcs, grayboard");
  assert.equal(result.draft.boxType, "magnetic");
  assert.equal(result.flags.alsoRigid, true);
});

test("a price in the paste does not become a field", () => {
  const result = read("Inner 100 x 80 x 40 mm. Qty 2000 pcs. Target USD 3 each. Grayboard magnetic box.");
  const json = checklistJson(result.draft, assess(result.draft, result.flags), "en");
  assert.equal("price" in json.fields, false);
  assert.doesNotMatch(JSON.stringify(json.fields), /USD|price/i);
});

test("a stated total is not checked by adding the tiers", () => {
  const result = read("Quote 1000 pcs and 2000 pcs. Total 9999 pcs. Magnetic box, inner 10 x 8 x 3 cm, grayboard.");
  assert.deepEqual(tiers(result.draft), ["1000", "2000"]);
  assert.equal(result.flags.statedTotalIgnored, true);
  assert.equal(tiers(result.draft).includes("9999"), false);
});

test("mixed language enquiry", () => {
  const result = read("你好, need a 抽屉盒, inner 内尺寸 150 x 100 x 40 mm, 数量 2000 pcs, 灰板 2mm, ship to 德国, FOB Shanghai.");
  assert.equal(result.draft.boxType, "drawer");
  assert.equal(result.draft.materialKind, "grayboard");
  assert.equal(result.draft.dimensions[0]?.length, "150");
  assert.equal(result.draft.dimensions[0]?.scope, "inner");
  assert.equal(result.draft.destination, "Germany");
  assert.equal(result.draft.incoterm, "FOB");
  assert.deepEqual(tiers(result.draft), ["2000"]);
});

test("markup is stripped and does not remain executable text", () => {
  const raw = '<div onclick="alert(1)">Inner 20 x 10 x 5 cm</div><script>alert(1)</script><img src=x onerror=alert(1)><svg onload=alert(1)></svg>';
  const clean = sanitizeToText(raw);
  assert.equal(clean.htmlRemoved, true);
  assert.doesNotMatch(clean.text, /<|>|onerror|onclick|onload|<script/i);
  assert.match(clean.text, /20 x 10 x 5 cm/);

  const encoded = sanitizeToText("&lt;script&gt;alert(1)&lt;/script&gt; Qty: 2000 pcs. Inner 10 x 8 x 4 cm.");
  assert.doesNotMatch(encoded.text, /<script|onerror/i);
  assert.match(encoded.text, /2000/);

  const result = read(fixtureById("markup").text);
  assert.equal(result.flags.htmlRemoved, true);
  assert.equal(result.draft.boxType, "lid-base");
  assert.equal(result.draft.dimensions[0]?.length, "180");
  assert.equal(result.draft.dimensions[0]?.unit, "mm");
  assert.equal(result.draft.dimensions[0]?.scope, "inner");
  assert.deepEqual(tiers(result.draft), ["2000"]);
  assert.equal(result.draft.materialKind, "corrugated");
  assert.doesNotMatch(result.flags.plainText, /<script|onerror|alert\(/i);
});

test("empty and over-long pastes do not invent a specification", () => {
  const empty = read("   ");
  assert.equal(empty.draft.boxType, "");
  assert.equal(empty.draft.dimensions.length, 0);
  assert.equal(empty.flags.tooLong, false);

  const huge = read("a".repeat(100_001));
  assert.equal(huge.flags.tooLong, true);
  assert.equal(huge.draft.materialKind, "");
  assert.ok(assess(huge.draft, huge.flags).issues.some((issue) => issue.code === "too-long"));
});

test("bilingual checklist names the gaps and every issue has both languages", () => {
  const result = read(fixtureById("ambiguous-size").text);
  const assessment = assess(result.draft, result.flags);
  const text = checklistText(result.draft, assessment, "both");
  assert.match(text, /Box structure/);
  assert.match(text, /盒型结构/);
  assert.match(text, /unit not set/);
  assert.match(text, /单位未定/);
  assert.match(text, /customgiftboxesfactory\.com\/en\/quote/);
  assert.match(text, /not a quotation/i);
  assert.match(text, /不是报价/);
  for (const code of ISSUE_CODES) {
    const en = issueMessage("en", { code, severity: "info", params: { list: "magnetic|drawer", moq: "2000", value: "abc", phrase: "CMYK" } });
    const zh = issueMessage("zh", { code, severity: "info", params: { list: "magnetic|drawer", moq: "2000", value: "abc", phrase: "CMYK" } });
    assert.ok(en.length > 8, code);
    assert.ok(zh.length > 2, code);
    assert.notEqual(en, zh, code);
  }
});
