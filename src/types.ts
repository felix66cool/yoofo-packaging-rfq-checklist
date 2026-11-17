export type Locale = "en" | "zh";
export type ChecklistLang = "en" | "zh" | "both";

export type ClosureId = "" | "magnetic";

export type BoxTypeId =
  | ""
  | "magnetic"
  | "drawer"
  | "book"
  | "lid-base"
  | "clamshell"
  | "shoulder"
  | "window"
  | "folding"
  | "tube"
  | "rigid"
  | "other";

export type MaterialKind =
  | ""
  | "grayboard"
  | "mdf"
  | "corrugated"
  | "cardboard"
  | "kraft"
  | "other";

export type Unit = "" | "mm" | "cm" | "inch";
export type Scope = "" | "inner" | "outer";
export type QtyKind = "tier" | "moq" | "sample";
export type PrintValue = "" | "cmyk" | "pms" | "printed" | "none";
export type ArtworkValue = "" | "ready" | "needed";
export type InsertId =
  | ""
  | "eva"
  | "foam"
  | "flock"
  | "paper"
  | "blister"
  | "none"
  | "other";

export type FinishId =
  | "matte-lamination"
  | "gloss-lamination"
  | "soft-touch"
  | "lamination"
  | "foil"
  | "emboss"
  | "deboss"
  | "emboss-deboss"
  | "spot-uv"
  | "varnish"
  | "none";

export type ExtraMaterialId = "kraft" | "art-paper" | "coated-paper";

export interface DimensionRow {
  id: string;
  scope: Scope;
  length: string;
  width: string;
  height: string;
  unit: Unit;
  /** Set when one size mixed mm, cm, and inches. Nothing is converted. */
  unitIssue: "" | "mixed";
  evidence: string;
}

export interface QuantityRow {
  id: string;
  amount: string;
  kind: QtyKind;
  evidence: string;
}

export interface RfqDraft {
  boxType: BoxTypeId;
  boxTypeOther: string;
  /** Magnetic is a closure. It can apply to a book-style box, a drawer, and so on. */
  closure: ClosureId;
  dimensions: DimensionRow[];
  quantities: QuantityRow[];
  materialKind: MaterialKind;
  materialOther: string;
  thickness: string;
  exteriorPrint: PrintValue;
  interiorPrint: PrintValue;
  finishes: FinishId[];
  insert: InsertId;
  insertOther: string;
  productFit: string;
  artwork: ArtworkValue;
  destination: string;
  incoterm: string;
  incotermPlace: string;
  schedule: string;
  shippingCarton: string;
  buyerNotes: string;
}

export interface ReaderFlags {
  htmlRemoved: boolean;
  tooLong: boolean;
  plainText: string;
  boxCandidates: BoxTypeId[];
  genericBoxOnly: boolean;
  alsoRigid: boolean;
  materialCandidates: MaterialKind[];
  materialExtras: ExtraMaterialId[];
  plusSignSplit: boolean;
  statedTotalIgnored: boolean;
  adviceRequested: boolean;
  printUnassigned: string;
  insertConflict: boolean;
  artworkConflict: boolean;
  destinationCandidates: string[];
  incotermCandidates: string[];
  placeCandidates: string[];
  scheduleCandidates: string[];
}

export type IssueSeverity = "critical" | "warning" | "recommended" | "info";

export interface Issue {
  severity: IssueSeverity;
  code: IssueCode;
  params?: Record<string, string>;
}

export const ISSUE_CODES = [
  "generic-box-only",
  "missing-box-type",
  "ambiguous-box-type",
  "box-needs-structure",
  "box-other-blank",
  "chose-among-box",
  "also-rigid",
  "missing-dimension",
  "partial-dimension",
  "dimension-not-numeric",
  "missing-unit",
  "mixed-units",
  "missing-scope",
  "missing-quantity",
  "moq-only",
  "quantity-not-numeric",
  "tiers-separate",
  "tier-below-moq",
  "plus-not-sum",
  "stated-total",
  "missing-material",
  "ambiguous-material",
  "material-other-blank",
  "chose-among-material",
  "material-also-mentioned",
  "missing-thickness",
  "missing-exterior",
  "missing-interior",
  "print-side",
  "missing-finish",
  "finish-both-sheens",
  "missing-insert",
  "insert-conflict",
  "missing-product",
  "missing-artwork",
  "artwork-conflict",
  "missing-destination",
  "ambiguous-destination",
  "missing-incoterm",
  "ambiguous-incoterm",
  "ambiguous-place",
  "missing-schedule",
  "ambiguous-schedule",
  "html-removed",
  "too-long",
  "advice-requested",
  "shipping-separate",
] as const;

export type IssueCode = (typeof ISSUE_CODES)[number];

export type FieldKey =
  | "structure"
  | "size"
  | "quantity"
  | "material"
  | "print"
  | "finish"
  | "insert"
  | "product"
  | "artwork"
  | "shipping";

export type PillState = "ready" | "missing" | "check";

export interface Assessment {
  issues: Issue[];
  criticalTotal: 4;
  criticalDone: number;
  fieldStatus: Record<FieldKey, PillState>;
}

export const INCOTERMS = [
  "EXW",
  "FCA",
  "FAS",
  "FOB",
  "CFR",
  "CIF",
  "CPT",
  "CIP",
  "DAP",
  "DPU",
  "DDP",
] as const;

export type Incoterm = (typeof INCOTERMS)[number];

export const BOX_ORDER: Exclude<BoxTypeId, "">[] = [
  "magnetic",
  "drawer",
  "lid-base",
  "book",
  "clamshell",
  "shoulder",
  "window",
  "folding",
  "tube",
  "rigid",
  "other",
];

export const MATERIAL_ORDER: Exclude<MaterialKind, "">[] = [
  "grayboard",
  "mdf",
  "corrugated",
  "cardboard",
  "kraft",
  "other",
];

export const FINISH_ORDER: FinishId[] = [
  "matte-lamination",
  "gloss-lamination",
  "soft-touch",
  "lamination",
  "foil",
  "emboss",
  "deboss",
  "emboss-deboss",
  "spot-uv",
  "varnish",
  "none",
];

export const INSERT_ORDER: Exclude<InsertId, "">[] = [
  "eva",
  "foam",
  "flock",
  "paper",
  "blister",
  "none",
  "other",
];

export const PRINT_ORDER: Exclude<PrintValue, "">[] = [
  "cmyk",
  "pms",
  "printed",
  "none",
];
