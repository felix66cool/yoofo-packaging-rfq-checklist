import { parseDecimal, parseQty } from "./numbers.ts";
import { dimensionStarted } from "./model.ts";
import type {
  Assessment,
  FieldKey,
  Issue,
  PillState,
  ReaderFlags,
  RfqDraft,
} from "./types.ts";

const STRUCTURE = new Set([
  "generic-box-only",
  "missing-box-type",
  "ambiguous-box-type",
  "box-needs-structure",
  "box-other-blank",
]);
const SIZE = new Set([
  "missing-dimension",
  "partial-dimension",
  "dimension-not-numeric",
  "missing-unit",
  "mixed-units",
  "missing-scope",
]);
const QUANTITY = new Set(["missing-quantity", "moq-only", "quantity-not-numeric"]);
const MATERIAL = new Set(["missing-material", "ambiguous-material", "material-other-blank"]);

export function assess(draft: RfqDraft, flags: ReaderFlags): Assessment {
  if (flags.tooLong) {
    return {
      issues: [{ severity: "critical", code: "too-long" }],
      criticalTotal: 4,
      criticalDone: 0,
      fieldStatus: emptyStatus(),
    };
  }

  const issues: Issue[] = [];
  const specific = draft.boxType !== "" && draft.boxType !== "rigid" && draft.boxType !== "other";

  if (!draft.boxType) {
    if (flags.boxCandidates.length > 1) {
      issues.push({
        severity: "critical",
        code: "ambiguous-box-type",
        params: { list: flags.boxCandidates.join("|") },
      });
    } else if (flags.genericBoxOnly) {
      issues.push({ severity: "critical", code: "generic-box-only" });
    } else {
      issues.push({ severity: "critical", code: "missing-box-type" });
    }
  } else if (draft.boxType === "rigid") {
    issues.push({ severity: "critical", code: "box-needs-structure" });
  } else if (draft.boxType === "other" && !draft.boxTypeOther.trim()) {
    issues.push({ severity: "critical", code: "box-other-blank" });
  }
  if (flags.boxCandidates.length > 1 && draft.boxType) {
    issues.push({
      severity: "info",
      code: "chose-among-box",
      params: { list: flags.boxCandidates.join("|") },
    });
  }
  if (flags.alsoRigid && specific) issues.push({ severity: "info", code: "also-rigid" });

  const started = draft.dimensions.filter(dimensionStarted);
  if (started.length === 0) {
    issues.push({ severity: "critical", code: "missing-dimension" });
  } else {
    let partial = false;
    let nonNumeric = false;
    let mixed = false;
    let missingUnit = false;
    let missingScope = false;
    for (const row of started) {
      const parts = [row.length, row.width, row.height];
      if (parts.some((part) => !part.trim())) {
        partial = true;
        continue;
      }
      if (parts.some((part) => parseDecimal(part) === null)) {
        nonNumeric = true;
        continue;
      }
      if (row.unitIssue === "mixed") {
        mixed = true;
        continue;
      }
      if (!row.unit) missingUnit = true;
      if (!row.scope) missingScope = true;
    }
    if (partial) issues.push({ severity: "critical", code: "partial-dimension" });
    if (nonNumeric) issues.push({ severity: "critical", code: "dimension-not-numeric" });
    if (mixed) issues.push({ severity: "critical", code: "mixed-units" });
    if (missingUnit) issues.push({ severity: "critical", code: "missing-unit" });
    if (missingScope) issues.push({ severity: "critical", code: "missing-scope" });
  }

  const tiers = draft.quantities.filter((row) => row.kind === "tier" && row.amount.trim());
  const moqs = draft.quantities.filter((row) => row.kind === "moq" && row.amount.trim());
  const badQty = draft.quantities.filter((row) => row.amount.trim() && parseQty(row.amount) === null);
  const validTiers = tiers
    .map((row) => parseQty(row.amount))
    .filter((value): value is number => value !== null);
  const validMoq = moqs
    .map((row) => parseQty(row.amount))
    .filter((value): value is number => value !== null);

  if (badQty.length > 0) {
    issues.push({
      severity: "critical",
      code: "quantity-not-numeric",
      params: { value: badQty.map((row) => row.amount.trim()).join("|") },
    });
  }
  if (validTiers.length === 0 && badQty.length === 0) {
    issues.push({
      severity: "critical",
      code: validMoq.length > 0 ? "moq-only" : "missing-quantity",
    });
  }
  if (validTiers.length >= 2) issues.push({ severity: "info", code: "tiers-separate" });
  if (validMoq.length === 1) {
    const moq = validMoq[0]!;
    const below = validTiers.filter((amount) => amount < moq);
    if (below.length > 0) {
      issues.push({
        severity: "warning",
        code: "tier-below-moq",
        params: { list: below.join("|"), moq: String(moq) },
      });
    }
  }
  if (flags.plusSignSplit) issues.push({ severity: "info", code: "plus-not-sum" });
  if (flags.statedTotalIgnored) issues.push({ severity: "info", code: "stated-total" });

  if (!draft.materialKind) {
    if (flags.materialCandidates.length > 1) {
      issues.push({
        severity: "critical",
        code: "ambiguous-material",
        params: { list: flags.materialCandidates.join("|") },
      });
    } else {
      issues.push({ severity: "critical", code: "missing-material" });
    }
  } else if (draft.materialKind === "other" && !draft.materialOther.trim()) {
    issues.push({ severity: "critical", code: "material-other-blank" });
  }
  if (flags.materialCandidates.length > 1 && draft.materialKind) {
    issues.push({
      severity: "info",
      code: "chose-among-material",
      params: { list: flags.materialCandidates.join("|") },
    });
  }
  if (draft.materialKind && flags.materialExtras.length > 0) {
    issues.push({
      severity: "info",
      code: "material-also-mentioned",
      params: { list: flags.materialExtras.join("|") },
    });
  }
  if (!draft.thickness.trim() && draft.materialKind) {
    issues.push({ severity: "recommended", code: "missing-thickness" });
  }

  const printOpen = !draft.exteriorPrint && !draft.interiorPrint;
  if (printOpen && flags.printUnassigned) {
    issues.push({
      severity: "recommended",
      code: "print-side",
      params: { phrase: flags.printUnassigned },
    });
  } else {
    if (!draft.exteriorPrint) issues.push({ severity: "recommended", code: "missing-exterior" });
    if (!draft.interiorPrint) issues.push({ severity: "recommended", code: "missing-interior" });
  }

  if (draft.finishes.length === 0) issues.push({ severity: "recommended", code: "missing-finish" });
  if (draft.finishes.includes("matte-lamination") && draft.finishes.includes("gloss-lamination")) {
    issues.push({ severity: "warning", code: "finish-both-sheens" });
  }

  if (!draft.insert) {
    issues.push({
      severity: "recommended",
      code: flags.insertConflict ? "insert-conflict" : "missing-insert",
    });
  } else if (draft.insert === "other" && !draft.insertOther.trim()) {
    issues.push({ severity: "recommended", code: "missing-insert" });
  }
  if (!draft.productFit.trim()) issues.push({ severity: "recommended", code: "missing-product" });
  if (!draft.artwork) {
    issues.push({
      severity: "recommended",
      code: flags.artworkConflict ? "artwork-conflict" : "missing-artwork",
    });
  }

  if (!draft.destination.trim()) {
    issues.push({
      severity: "recommended",
      code: flags.destinationCandidates.length > 1 ? "ambiguous-destination" : "missing-destination",
      params:
        flags.destinationCandidates.length > 1
          ? { list: flags.destinationCandidates.join("|") }
          : undefined,
    });
  }
  if (!draft.incoterm) {
    issues.push({
      severity: "recommended",
      code: flags.incotermCandidates.length > 1 ? "ambiguous-incoterm" : "missing-incoterm",
      params:
        flags.incotermCandidates.length > 1 ? { list: flags.incotermCandidates.join("|") } : undefined,
    });
  } else if (!draft.incotermPlace.trim() && flags.placeCandidates.length > 1) {
    issues.push({
      severity: "recommended",
      code: "ambiguous-place",
      params: { list: flags.placeCandidates.join("|") },
    });
  }
  if (!draft.schedule.trim()) {
    issues.push({
      severity: "recommended",
      code: flags.scheduleCandidates.length > 1 ? "ambiguous-schedule" : "missing-schedule",
      params:
        flags.scheduleCandidates.length > 1 ? { list: flags.scheduleCandidates.join("|") } : undefined,
    });
  }

  if (flags.htmlRemoved) issues.push({ severity: "info", code: "html-removed" });
  if (flags.adviceRequested) issues.push({ severity: "info", code: "advice-requested" });
  if (draft.shippingCarton.trim()) issues.push({ severity: "info", code: "shipping-separate" });

  const critical = issues.filter((issue) => issue.severity === "critical");
  const done = 4 - [STRUCTURE, SIZE, QUANTITY, MATERIAL].filter((set) =>
    critical.some((issue) => set.has(issue.code)),
  ).length;

  return {
    issues,
    criticalTotal: 4,
    criticalDone: done,
    fieldStatus: {
      structure: structurePill(draft, flags),
      size: sizePill(draft, issues),
      quantity: quantityPill(validTiers.length, validMoq.length, badQty.length),
      material: materialPill(draft, flags),
      print: printPill(draft, flags),
      finish: draft.finishes.length === 0 ? "missing" : draft.finishes.includes("matte-lamination") && draft.finishes.includes("gloss-lamination") ? "check" : "ready",
      insert: !draft.insert || (draft.insert === "other" && !draft.insertOther.trim()) ? (flags.insertConflict ? "check" : "missing") : "ready",
      product: draft.productFit.trim() ? "ready" : "missing",
      artwork: draft.artwork ? "ready" : flags.artworkConflict ? "check" : "missing",
      shipping: shippingPill(draft, flags),
    },
  };
}

function structurePill(draft: RfqDraft, flags: ReaderFlags): PillState {
  if (draft.boxType === "other") return draft.boxTypeOther.trim() ? "ready" : "check";
  if (draft.boxType === "rigid") return "check";
  if (draft.boxType) return "ready";
  if (flags.boxCandidates.length > 1 || flags.genericBoxOnly) return "check";
  return "missing";
}

function sizePill(draft: RfqDraft, issues: Issue[]): PillState {
  if (draft.dimensions.filter(dimensionStarted).length === 0) return "missing";
  return issues.some((issue) => SIZE.has(issue.code)) ? "check" : "ready";
}

function quantityPill(tiers: number, moqs: number, bad: number): PillState {
  if (bad > 0 || (tiers === 0 && moqs > 0)) return "check";
  if (tiers === 0) return "missing";
  return "ready";
}

function materialPill(draft: RfqDraft, flags: ReaderFlags): PillState {
  if (draft.materialKind === "other") return draft.materialOther.trim() ? "ready" : "check";
  if (draft.materialKind) return "ready";
  if (flags.materialCandidates.length > 1) return "check";
  return "missing";
}

function printPill(draft: RfqDraft, flags: ReaderFlags): PillState {
  if (draft.exteriorPrint && draft.interiorPrint) return "ready";
  if (draft.exteriorPrint || draft.interiorPrint || flags.printUnassigned) return "check";
  return "missing";
}

function shippingPill(draft: RfqDraft, flags: ReaderFlags): PillState {
  const filled = [draft.destination.trim(), draft.incoterm, draft.schedule.trim()].filter(Boolean).length;
  const ambiguous = flags.destinationCandidates.length > 1 || flags.incotermCandidates.length > 1 || flags.scheduleCandidates.length > 1;
  if (filled === 3 && !ambiguous) return "ready";
  if (filled === 0 && !ambiguous) return "missing";
  return "check";
}

function emptyStatus(): Record<FieldKey, PillState> {
  return {
    structure: "missing",
    size: "missing",
    quantity: "missing",
    material: "missing",
    print: "missing",
    finish: "missing",
    insert: "missing",
    product: "missing",
    artwork: "missing",
    shipping: "missing",
  };
}
