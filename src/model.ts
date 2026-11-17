import type {
  DimensionRow,
  MaterialKind,
  QuantityRow,
  ReaderFlags,
  RfqDraft,
  Scope,
  Unit,
} from "./types.ts";

export function nextId(prefix: string): string {
  return `${prefix}-${crypto.randomUUID()}`;
}

export function emptyFlags(): ReaderFlags {
  return {
    htmlRemoved: false,
    tooLong: false,
    plainText: "",
    boxCandidates: [],
    genericBoxOnly: false,
    alsoRigid: false,
    materialCandidates: [],
    materialExtras: [],
    plusSignSplit: false,
    statedTotalIgnored: false,
    adviceRequested: false,
    printUnassigned: "",
    insertConflict: false,
    artworkConflict: false,
    destinationCandidates: [],
    incotermCandidates: [],
    placeCandidates: [],
    scheduleCandidates: [],
  };
}

export function emptyDraft(): RfqDraft {
  return {
    boxType: "",
    boxTypeOther: "",
    closure: "",
    dimensions: [],
    quantities: [],
    materialKind: "",
    materialOther: "",
    thickness: "",
    exteriorPrint: "",
    interiorPrint: "",
    finishes: [],
    insert: "",
    insertOther: "",
    productFit: "",
    artwork: "",
    destination: "",
    incoterm: "",
    incotermPlace: "",
    schedule: "",
    shippingCarton: "",
    buyerNotes: "",
  };
}

export function blankDimension(): DimensionRow {
  return {
    id: nextId("dim"),
    scope: "",
    length: "",
    width: "",
    height: "",
    unit: "",
    unitIssue: "",
    evidence: "",
  };
}

export function blankQuantity(): QuantityRow {
  return {
    id: nextId("qty"),
    amount: "",
    kind: "tier",
    evidence: "",
  };
}

export function dimensionStarted(row: DimensionRow): boolean {
  return Boolean(
    row.length.trim() ||
      row.width.trim() ||
      row.height.trim() ||
      row.unit ||
      row.scope ||
      row.unitIssue,
  );
}

export function isUnit(value: string): value is Unit {
  return value === "" || value === "mm" || value === "cm" || value === "inch";
}

export function isScope(value: string): value is Scope {
  return value === "" || value === "inner" || value === "outer";
}

export function isMaterial(value: string): value is MaterialKind {
  return (
    value === "" ||
    value === "grayboard" ||
    value === "mdf" ||
    value === "corrugated" ||
    value === "cardboard" ||
    value === "kraft" ||
    value === "other"
  );
}
