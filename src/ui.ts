import { assess } from "./assess.ts";
import { BRAND } from "./brand.ts";
import { checklistJson, checklistText } from "./export.ts";
import { readEnquiry } from "./extract.ts";
import { FIXTURES } from "./fixtures.ts";
import {
  artworkLabel,
  boxLabel,
  finishLabel,
  insertLabel,
  issueMessage,
  materialLabel,
  printLabel,
  qtyKindLabel,
  scopeLabel,
  t,
  unitLabel,
} from "./i18n.ts";
import { blankDimension, blankQuantity, emptyDraft, emptyFlags, isScope, isUnit } from "./model.ts";
import type {
  ArtworkValue,
  Assessment,
  BoxTypeId,
  ChecklistLang,
  DimensionRow,
  FieldKey,
  FinishId,
  InsertId,
  Issue,
  Locale,
  MaterialKind,
  PrintValue,
  QuantityRow,
  ReaderFlags,
  RfqDraft,
} from "./types.ts";
import {
  ARTWORK_VALUES,
  BOX_ORDER,
  FINISH_ORDER,
  INCOTERMS,
  INSERT_ORDER,
  MATERIAL_ORDER,
  PRINT_ORDER,
} from "./lists.ts";

interface AppState {
  locale: Locale;
  checklistLang: ChecklistLang;
  enquiry: string;
  draft: RfqDraft;
  flags: ReaderFlags;
  includeEnquiry: boolean;
  exampleId: string;
  exampleEdited: boolean;
  messageKey: "emptyPaste" | "tooLongPaste" | "emptyMarkup" | "readClear" | "readDone" | "copied" | "copyFailed" | "";
  messageCount: string;
  fallback: string;
}

const state: AppState = {
  locale: "en",
  checklistLang: "both",
  enquiry: "",
  draft: emptyDraft(),
  flags: emptyFlags(),
  includeEnquiry: false,
  exampleId: "",
  exampleEdited: false,
  messageKey: "",
  messageCount: "",
  fallback: "",
};

let rootEl: HTMLElement | null = null;

export function mount(root: HTMLElement): void {
  rootEl = root;
  root.addEventListener("click", onClick);
  root.addEventListener("input", onInput);
  root.addEventListener("change", onChange);
  root.addEventListener("submit", (event) => event.preventDefault());
  render();
}

function render(): void {
  if (!rootEl) return;
  const locale = state.locale;
  document.documentElement.lang = locale === "zh" ? "zh-Hans" : "en";
  document.title = locale === "zh" ? "包装询价清单 · Yoofo Packaging" : BRAND.tool;

  const page = el("div");
  page.append(
    el("a", { className: "skip", text: locale === "zh" ? "跳到询价" : "Skip to enquiry", attrs: { href: "#enquiry" } }),
    topbar(),
    mast(),
    main(),
    footer(),
  );
  rootEl.replaceChildren(page);
  paintDerived();
}

function topbar(): HTMLElement {
  const bar = el("header", { className: "topbar" });
  const inner = el("div", { className: "topbar-inner" });
  const brand = el("a", { className: "brand", attrs: { href: BRAND.site } });
  const mark = document.createElement("img");
  mark.src = `${import.meta.env.BASE_URL}favicon.svg`;
  mark.width = 28;
  mark.height = 28;
  mark.alt = "";
  brand.append(mark, document.createTextNode(t(state.locale, "kicker")));
  inner.append(brand, seg(
    t(state.locale, "uiLanguage"),
    [
      ["en", "English"],
      ["zh", "中文"],
    ],
    state.locale,
    "locale",
  ));
  bar.append(inner);
  return bar;
}

function mast(): HTMLElement {
  const head = el("header", { className: "mast wrap" });
  head.append(
    el("h1", { text: t(state.locale, "title") }),
    el("p", { className: "lede", text: t(state.locale, "lede") }),
    el("p", { className: "privacy", text: t(state.locale, "privacy") }),
  );
  const how = el("details", { className: "how" });
  how.append(el("summary", { text: t(state.locale, "howSummary") }));
  const list = document.createElement("ol");
  for (const key of ["how1", "how2", "how3", "how4", "how5"] as const) {
    list.append(el("li", { text: t(state.locale, key) }));
  }
  how.append(list);
  head.append(how);
  return head;
}

function main(): HTMLElement {
  const wrap = el("main", { className: "wrap" });
  const form = document.createElement("form");
  form.autocomplete = "off";
  form.append(work(), spec(), output());
  wrap.append(form);
  return wrap;
}

function work(): HTMLElement {
  const grid = el("div", { className: "work" });
  grid.append(enquiryPanel(), statusPanel());
  return grid;
}

function enquiryPanel(): HTMLElement {
  const panel = el("section", { className: "panel", attrs: { "aria-labelledby": "enquiry-title" } });
  panel.append(
    el("div", { className: "panel-head" }, el("h2", { text: t(state.locale, "enquiryTitle"), attrs: { id: "enquiry-title" } })),
  );
  const field = el("div", { className: "field" });
  const label = el("label", { text: t(state.locale, "enquiryLabel"), attrs: { for: "enquiry" } });
  const area = document.createElement("textarea");
  area.id = "enquiry";
  area.dataset.bind = "enquiry";
  area.value = state.enquiry;
  area.placeholder = t(state.locale, "enquiryPlaceholder");
  area.spellcheck = true;
  area.setAttribute("aria-describedby", "enquiry-hint");
  field.append(label, area, el("p", { className: "hint", text: t(state.locale, "enquiryHint"), attrs: { id: "enquiry-hint" } }));
  const actions = el("div", { className: "actions" });
  actions.append(
    button(t(state.locale, "read"), "read", "primary"),
    button(t(state.locale, "clear"), "clear", "ghost"),
  );
  const examples = el("div", { className: "examples" });
  examples.append(el("p", { className: "hint", text: t(state.locale, "examples") }));
  for (const fixture of FIXTURES) {
    const chip = button(fixture.title[state.locale], "example", "chip");
    chip.dataset.id = fixture.id;
    chip.setAttribute("aria-pressed", String(state.exampleId === fixture.id && !state.exampleEdited));
    examples.append(chip);
  }
  const banner = el("p", { className: "banner", attrs: { id: "example-banner" } });
  const live = el("p", { className: "live", attrs: { id: "live", role: "status" } });
  const markup = el("details", { attrs: { id: "markup" } });
  markup.append(el("summary", { text: t(state.locale, "markupSummary") }), el("pre"));
  panel.append(field, actions, examples, banner, live, markup);
  return panel;
}

function statusPanel(): HTMLElement {
  const panel = el("aside", { className: "panel status", attrs: { id: "status-panel", "aria-labelledby": "status-title" } });
  panel.append(
    el("h2", { text: t(state.locale, "statusTitle"), attrs: { id: "status-title" } }),
    el("div", { attrs: { id: "status-body" } }),
  );
  return panel;
}

function spec(): HTMLElement {
  const panel = el("section", { className: "panel", attrs: { id: "spec", "aria-labelledby": "spec-heading" } });
  const heading = el("h2", { text: t(state.locale, "specTitle"), attrs: { id: "spec-heading", tabindex: "-1" } });
  panel.append(heading, el("p", { className: "hint", text: t(state.locale, "specIntro") }));
  const grid = el("div", { className: "spec-grid" });
  grid.append(structureField(), sizeField(), quantityField(), materialField(), printField(), finishField(), insertField(), productField(), artworkField(), shippingField(), notesField());
  panel.append(grid);
  return panel;
}

function structureField(): HTMLElement {
  const box = fieldset("structure", t(state.locale, "structure"), t(state.locale, "structureHelp"));
  const select = makeSelect("box-type", "boxType", state.draft.boxType, [
    { value: "", label: t(state.locale, "selectUnset") },
    ...BOX_ORDER.map((id) => ({ value: id, label: boxLabel(state.locale, id) })),
  ]);
  box.append(
    labeled("box-type", t(state.locale, "structure"), select),
    labeled(
      "closure",
      t(state.locale, "closure"),
      makeSelect("closure", "closure", state.draft.closure, [
        { value: "", label: t(state.locale, "closureUnset") },
        { value: "magnetic", label: t(state.locale, "closureMagnetic") },
      ]),
      t(state.locale, "closureHelp"),
    ),
  );
  if (state.draft.boxType === "other") {
    box.append(labeled("box-other", t(state.locale, "otherLabel"), textInput("box-other", "boxTypeOther", state.draft.boxTypeOther)));
  }
  return box;
}

function sizeField(): HTMLElement {
  const box = fieldset("size", t(state.locale, "size"), t(state.locale, "sizeHelp"));
  state.draft.dimensions.forEach((row, index) => box.append(dimensionCard(row, index)));
  box.append(button(t(state.locale, "addSize"), "add-dimension", "ghost"));
  return box;
}

function dimensionCard(row: DimensionRow, index: number): HTMLElement {
  const card = el("div", { className: "size-card" });
  const top = el("div", { className: "card-top" });
  const title = el("strong", { text: `${index + 1}` });
  const remove = button(t(state.locale, "remove"), "remove-dimension", "texty");
  remove.dataset.id = row.id;
  top.append(title, remove);
  card.append(top);
  if (row.evidence) card.append(el("p", { className: "evidence", text: `${t(state.locale, "readerSaw")} ${row.evidence}` }));
  const pair = el("div", { className: "pair" });
  pair.append(
    labeled(
      `scope-${row.id}`,
      t(state.locale, "scope"),
      makeSelect(`scope-${row.id}`, "dim", row.scope, [
        { value: "", label: t(state.locale, "scopeUnset") },
        { value: "inner", label: scopeLabel(state.locale, "inner") },
        { value: "outer", label: scopeLabel(state.locale, "outer") },
      ], { id: row.id, key: "scope" }),
    ),
    labeled(
      `unit-${row.id}`,
      t(state.locale, "unit"),
      makeSelect(`unit-${row.id}`, "dim", row.unit, [
        { value: "", label: t(state.locale, "unitUnset") },
        { value: "mm", label: unitLabel(state.locale, "mm") },
        { value: "cm", label: unitLabel(state.locale, "cm") },
        { value: "inch", label: unitLabel(state.locale, "inch") },
      ], { id: row.id, key: "unit" }),
    ),
  );
  const dims = el("div", { className: "dims" });
  for (const key of ["length", "width", "height"] as const) {
    const input = textInput(`${key}-${row.id}`, "dim", row[key]);
    input.dataset.id = row.id;
    input.dataset.key = key;
    input.inputMode = "decimal";
    input.autocomplete = "off";
    dims.append(labeled(`${key}-${row.id}`, t(state.locale, key), input));
  }
  card.append(pair, dims);
  return card;
}

function quantityField(): HTMLElement {
  const box = fieldset("quantity", t(state.locale, "quantity"), t(state.locale, "quantityHelp"));
  for (const row of state.draft.quantities) box.append(quantityCard(row));
  box.append(button(t(state.locale, "addQty"), "add-quantity", "ghost"));
  return box;
}

function quantityCard(row: QuantityRow): HTMLElement {
  const card = el("div", { className: "qty-card" });
  if (row.evidence) card.append(el("p", { className: "evidence", text: `${t(state.locale, "readerSaw")} ${row.evidence}` }));
  const line = el("div", { className: "qty-row" });
  const amount = textInput(`amount-${row.id}`, "qty", row.amount);
  amount.dataset.id = row.id;
  amount.dataset.key = "amount";
  amount.inputMode = "numeric";
  amount.autocomplete = "off";
  const kind = makeSelect(`kind-${row.id}`, "qty", row.kind, [
    { value: "tier", label: qtyKindLabel(state.locale, "tier") },
    { value: "moq", label: qtyKindLabel(state.locale, "moq") },
    { value: "sample", label: qtyKindLabel(state.locale, "sample") },
  ], { id: row.id, key: "kind" });
  const remove = button(t(state.locale, "remove"), "remove-quantity", "texty");
  remove.dataset.id = row.id;
  line.append(
    labeled(`amount-${row.id}`, t(state.locale, "amount"), amount),
    labeled(`kind-${row.id}`, t(state.locale, "kind"), kind),
    remove,
  );
  card.append(line);
  return card;
}

function materialField(): HTMLElement {
  const box = fieldset("material", t(state.locale, "material"), t(state.locale, "materialHelp"));
  box.append(labeled("material-kind", t(state.locale, "material"), makeSelect("material-kind", "materialKind", state.draft.materialKind, [
    { value: "", label: t(state.locale, "selectUnset") },
    ...MATERIAL_ORDER.map((id) => ({ value: id, label: materialLabel(state.locale, id) })),
  ])));
  if (state.draft.materialKind === "other") {
    box.append(labeled("material-other", t(state.locale, "otherLabel"), textInput("material-other", "materialOther", state.draft.materialOther)));
  }
  const thickness = textInput("thickness", "thickness", state.draft.thickness);
  box.append(labeled("thickness", t(state.locale, "thickness"), thickness, t(state.locale, "thicknessHint")));
  return box;
}

function printField(): HTMLElement {
  const box = fieldset("print", t(state.locale, "print"));
  const options = [
    { value: "", label: t(state.locale, "selectUnset") },
    ...PRINT_ORDER.map((id) => ({ value: id, label: printLabel(state.locale, id) })),
  ];
  const pair = el("div", { className: "pair" });
  pair.append(
    labeled("exterior-print", t(state.locale, "exterior"), makeSelect("exterior-print", "exteriorPrint", state.draft.exteriorPrint, options)),
    labeled("interior-print", t(state.locale, "interior"), makeSelect("interior-print", "interiorPrint", state.draft.interiorPrint, options)),
  );
  box.append(pair);
  return box;
}

function finishField(): HTMLElement {
  const box = fieldset("finish", t(state.locale, "finish"), t(state.locale, "finishHelp"));
  const checks = el("div", { className: "checks" });
  for (const id of FINISH_ORDER) {
    const label = document.createElement("label");
    const input = document.createElement("input");
    input.type = "checkbox";
    input.id = `finish-${id}`;
    input.value = id;
    input.dataset.bind = "finish";
    input.checked = state.draft.finishes.includes(id);
    label.append(input, document.createTextNode(finishLabel(state.locale, id)));
    checks.append(label);
  }
  box.append(checks);
  return box;
}

function insertField(): HTMLElement {
  const box = fieldset("insert", t(state.locale, "insert"), t(state.locale, "insertHelp"));
  box.append(labeled("insert-kind", t(state.locale, "insert"), makeSelect("insert-kind", "insert", state.draft.insert, [
    { value: "", label: t(state.locale, "selectUnset") },
    ...INSERT_ORDER.map((id) => ({ value: id, label: insertLabel(state.locale, id) })),
  ])));
  if (state.draft.insert === "other") {
    box.append(labeled("insert-other", t(state.locale, "otherLabel"), textInput("insert-other", "insertOther", state.draft.insertOther)));
  }
  return box;
}

function productField(): HTMLElement {
  const box = fieldset("product", t(state.locale, "product"), t(state.locale, "productHint"));
  const input = textInput("product-fit", "productFit", state.draft.productFit);
  box.append(labeled("product-fit", t(state.locale, "product"), input));
  return box;
}

function artworkField(): HTMLElement {
  const box = fieldset("artwork", t(state.locale, "artwork"), t(state.locale, "artworkHelp"));
  box.append(labeled("artwork-kind", t(state.locale, "artwork"), makeSelect("artwork-kind", "artwork", state.draft.artwork, [
    { value: "", label: t(state.locale, "selectUnset") },
    ...ARTWORK_VALUES.map((id) => ({ value: id, label: artworkLabel(state.locale, id) })),
  ])));
  return box;
}

function shippingField(): HTMLElement {
  const box = fieldset("shipping", t(state.locale, "shipping"));
  const pair = el("div", { className: "pair" });
  pair.append(
    labeled("destination", t(state.locale, "destination"), textInput("destination", "destination", state.draft.destination), t(state.locale, "destinationHint")),
    labeled("incoterm", t(state.locale, "incoterm"), makeSelect("incoterm", "incoterm", state.draft.incoterm, [
      { value: "", label: t(state.locale, "selectUnset") },
      ...INCOTERMS.map((term) => ({ value: term, label: term })),
    ])),
  );
  box.append(
    pair,
    labeled("incoterm-place", t(state.locale, "place"), textInput("incoterm-place", "incotermPlace", state.draft.incotermPlace), t(state.locale, "placeHint")),
    labeled("schedule", t(state.locale, "schedule"), textInput("schedule", "schedule", state.draft.schedule), t(state.locale, "scheduleHint")),
    labeled("carton", t(state.locale, "carton"), textInput("carton", "shippingCarton", state.draft.shippingCarton), t(state.locale, "cartonHint")),
  );
  return box;
}

function notesField(): HTMLElement {
  const box = document.createElement("fieldset");
  const caption = document.createElement("legend");
  caption.textContent = t(state.locale, "notes");
  box.append(caption, el("p", { className: "hint", text: t(state.locale, "notesHint") }));
  const area = document.createElement("textarea");
  area.id = "buyer-notes";
  area.dataset.bind = "buyerNotes";
  area.value = state.draft.buyerNotes;
  area.rows = 3;
  box.append(labeled("buyer-notes", t(state.locale, "notes"), area));
  return box;
}

function output(): HTMLElement {
  const panel = el("section", { className: "panel", attrs: { id: "output", "aria-labelledby": "output-title" } });
  const controls = el("div", { className: "output-controls" });
  controls.append(
    el("div", {}, el("h2", { text: t(state.locale, "outputTitle"), attrs: { id: "output-title" } }), el("p", { className: "hint", text: t(state.locale, "outputIntro") })),
  );
  const lang = el("div", { className: "field" });
  lang.append(el("p", { className: "hint", text: t(state.locale, "checklistLang"), attrs: { id: "checklist-lang-label" } }));
  lang.append(seg(t(state.locale, "checklistLang"), [
    ["en", t(state.locale, "langEn")],
    ["zh", t(state.locale, "langZh")],
    ["both", t(state.locale, "langBoth")],
  ], state.checklistLang, "checklist-lang", "lang-seg"));
  const include = el("label", { className: "include" });
  const checkbox = document.createElement("input");
  checkbox.type = "checkbox";
  checkbox.id = "include-enquiry";
  checkbox.dataset.bind = "includeEnquiry";
  checkbox.checked = state.includeEnquiry;
  include.append(checkbox, document.createTextNode(t(state.locale, "includeEnquiry")));
  const buttons = el("div", { className: "actions" });
  buttons.append(
    button(t(state.locale, "copy"), "copy", "primary"),
    button(t(state.locale, "downloadTxt"), "download-txt", "ghost"),
    button(t(state.locale, "downloadJson"), "download-json", "ghost"),
    button(t(state.locale, "printButton"), "print", "ghost"),
  );
  controls.append(lang, include, buttons);
  const fallback = el("div", { className: "fallback", attrs: { id: "fallback" } });
  fallback.append(
    el("p", { text: t(state.locale, "copyFallbackHint") }),
    (() => {
      const area = document.createElement("textarea");
      area.className = "fallback-box";
      area.readOnly = true;
      area.id = "fallback-text";
      return area;
    })(),
    button(t(state.locale, "close"), "close-fallback", "ghost"),
  );
  panel.append(controls, el("article", { className: "sheet", attrs: { id: "checklist-sheet" } }), fallback);
  const quote = el("div", { className: "quote-row output-controls" });
  const link = el("a", { className: "button primary", text: t(state.locale, "quoteCta"), attrs: { href: BRAND.quote, target: "_blank", rel: "noopener noreferrer" } });
  quote.append(link, el("p", { className: "hint", text: t(state.locale, "quoteHelp") }));
  panel.append(quote);
  return panel;
}

function footer(): HTMLElement {
  const foot = el("footer", { className: "footer" });
  foot.append(
    el("strong", { text: BRAND.company }),
    el("p", { text: t(state.locale, "footerPrivacy") }),
    el("p", {}, link(t(state.locale, "website"), BRAND.site), document.createTextNode(" · "), link(t(state.locale, "quotePage"), BRAND.quote)),
    el("p", { text: t(state.locale, "sourceNote") }),
  );
  return foot;
}

function paintDerived(): void {
  if (!rootEl) return;
  const locale = state.locale;
  const assessment = assess(state.draft, state.flags);
  const status = rootEl.querySelector("#status-body");
  if (status) status.replaceChildren(statusBody(assessment));
  const sheet = rootEl.querySelector("#checklist-sheet");
  if (sheet) {
    const pre = document.createElement("pre");
    pre.textContent = checklistText(state.draft, assessment, state.checklistLang);
    sheet.replaceChildren(pre);
  }
  for (const [key, value] of Object.entries(assessment.fieldStatus) as Array<[FieldKey, Assessment["fieldStatus"][FieldKey]]>) {
    const pill = rootEl.querySelector(`[data-pill="${key}"]`);
    if (!pill) continue;
    pill.className = `pill ${value}`;
    const word = value === "ready" ? "pillReady" : value === "check" ? "pillCheck" : "pillMissing";
    pill.textContent = t(locale, word);
  }
  toggle("#box-other-wrap", state.draft.boxType === "other");
  toggle("#material-other-wrap", state.draft.materialKind === "other");
  toggle("#insert-other-wrap", state.draft.insert === "other");
  const banner = rootEl.querySelector("#example-banner");
  if (banner instanceof HTMLElement) {
    banner.hidden = state.exampleId === "";
    banner.textContent = state.exampleEdited ? t(locale, "exampleEdited") : t(locale, "exampleBanner");
  }
  const live = rootEl.querySelector("#live");
  if (live) {
    live.textContent = state.messageKey
      ? t(locale, state.messageKey, state.messageCount ? { count: state.messageCount } : {})
      : "";
  }
  const markup = rootEl.querySelector("#markup");
  if (markup instanceof HTMLElement) {
    markup.hidden = !state.flags.htmlRemoved || state.flags.plainText.length === 0;
    const pre = markup.querySelector("pre");
    if (pre) pre.textContent = state.flags.plainText;
  }
  const fallback = rootEl.querySelector("#fallback");
  if (fallback instanceof HTMLElement) {
    fallback.hidden = state.fallback.length === 0;
    const area = fallback.querySelector("textarea");
    if (area instanceof HTMLTextAreaElement) area.value = state.fallback;
  }
  rootEl.querySelectorAll<HTMLButtonElement>("[data-action='checklist-lang'], [data-action='locale']").forEach((button) => {
    const current = button.dataset.action === "locale" ? state.locale : state.checklistLang;
    button.setAttribute("aria-pressed", String(button.dataset.value === current));
  });
}

function statusBody(assessment: Assessment): HTMLElement {
  const body = el("div");
  body.append(el("p", {
    className: "meter",
    text: t(state.locale, "criticalProgress", {
      done: String(assessment.criticalDone),
      total: String(assessment.criticalTotal),
    }),
  }));
  const marks = document.createElement("ol");
  marks.className = "marks";
  for (const key of ["structure", "size", "quantity", "material"] as const) {
    const status = assessment.fieldStatus[key];
    const word = status === "ready" ? "pillReady" : status === "check" ? "pillCheck" : "pillMissing";
    const item = document.createElement("li");
    item.className = status;
    item.textContent = `${t(state.locale, key)}: ${t(state.locale, word)}`;
    marks.append(item);
  }
  body.append(marks);
  if (assessment.criticalDone === assessment.criticalTotal) {
    body.append(el("p", { text: t(state.locale, "criticalDone") }));
  }
  const groups: Array<[Issue["severity"], string, string]> = [
    ["critical", "groupCritical", "critical"],
    ["warning", "groupWarning", "warning"],
    ["recommended", "groupRecommended", "recommended"],
    ["info", "groupInfo", "info"],
  ];
  for (const [severity, title, className] of groups) {
    const issues = assessment.issues.filter((issue) => issue.severity === severity);
    if (issues.length === 0) continue;
    const block = el("section", { className: "status-block" });
    const list = document.createElement("ul");
    list.className = "issues";
    for (const issue of issues) {
      const item = document.createElement("li");
      item.className = `issue ${className}`;
      item.textContent = issueMessage(state.locale, issue);
      list.append(item);
    }
    block.append(el("h3", { text: t(state.locale, title as "groupCritical") }), list);
    body.append(block);
  }
  return body;
}

function onClick(event: Event): void {
  const target = event.target;
  if (!(target instanceof Element)) return;
  const control = target.closest<HTMLElement>("[data-action]");
  if (!control || !rootEl?.contains(control)) return;
  const action = control.dataset.action;
  if (action === "read") readNow();
  else if (action === "clear") clearAll();
  else if (action === "example" && control.dataset.id) loadExample(control.dataset.id);
  else if (action === "add-dimension") addDimension();
  else if (action === "remove-dimension" && control.dataset.id) removeDimension(control.dataset.id);
  else if (action === "add-quantity") addQuantity();
  else if (action === "remove-quantity" && control.dataset.id) removeQuantity(control.dataset.id);
  else if (action === "locale" && (control.dataset.value === "en" || control.dataset.value === "zh")) {
    state.locale = control.dataset.value;
    render();
  } else if (action === "checklist-lang" && isChecklistLang(control.dataset.value)) {
    state.checklistLang = control.dataset.value;
    paintDerived();
  } else if (action === "copy") void copyChecklist();
  else if (action === "download-txt") downloadText();
  else if (action === "download-json") downloadJson();
  else if (action === "print") window.print();
  else if (action === "close-fallback") {
    state.fallback = "";
    paintDerived();
  }
}

function onInput(event: Event): void {
  const target = event.target;
  if (target instanceof HTMLSelectElement) return;
  if (target instanceof HTMLInputElement && target.type !== "text") return;
  if (!(target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement)) return;
  if (!target.dataset.bind) return;
  applyValue(target);
  paintDerived();
}

function onChange(event: Event): void {
  const target = event.target;
  if (!(target instanceof HTMLInputElement || target instanceof HTMLSelectElement)) return;
  if (target instanceof HTMLInputElement && target.type === "text") return;
  if (!target.dataset.bind) return;
  applyValue(target);
  const id = target.id;
  render();
  if (id) document.getElementById(id)?.focus();
}

function applyValue(target: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement): void {
  const bind = target.dataset.bind ?? "";
  const value = target instanceof HTMLInputElement && target.type === "checkbox" ? target.checked : target.value;
  if (bind === "enquiry" && typeof value === "string") {
    state.enquiry = value;
    if (state.exampleId) state.exampleEdited = true;
    return;
  }
  if (bind === "includeEnquiry") {
    state.includeEnquiry = value === true;
    return;
  }
  if (bind === "finish" && target instanceof HTMLInputElement) {
    toggleFinish(target.value, target.checked);
    return;
  }
  if (bind === "dim") {
    const row = state.draft.dimensions.find((item) => item.id === target.dataset.id);
    const key = target.dataset.key;
    if (!row || (key !== "length" && key !== "width" && key !== "height" && key !== "unit" && key !== "scope")) return;
    const text = String(value);
    if (key === "unit" && isUnit(text)) row.unit = text;
    else if (key === "scope" && isScope(text)) row.scope = text;
    else if (key === "length" || key === "width" || key === "height") row[key] = text;
    if (key === "unit") row.unitIssue = "";
    return;
  }
  if (bind === "qty") {
    const row = state.draft.quantities.find((item) => item.id === target.dataset.id);
    const key = target.dataset.key;
    if (!row) return;
    if (key === "amount") row.amount = String(value);
    if (key === "kind" && (value === "tier" || value === "moq" || value === "sample")) row.kind = value;
    return;
  }
  assignDraft(bind, String(value));
}

function assignDraft(bind: string, value: string): void {
  const draft = state.draft;
  if (bind === "boxType" && isBox(value)) draft.boxType = value;
  else if (bind === "boxTypeOther") draft.boxTypeOther = value;
  else if (bind === "closure" && (value === "" || value === "magnetic")) draft.closure = value;
  else if (bind === "materialKind" && isMaterialKind(value)) draft.materialKind = value;
  else if (bind === "materialOther") draft.materialOther = value;
  else if (bind === "thickness") draft.thickness = value;
  else if (bind === "exteriorPrint" && isPrint(value)) draft.exteriorPrint = value;
  else if (bind === "interiorPrint" && isPrint(value)) draft.interiorPrint = value;
  else if (bind === "insert" && isInsert(value)) draft.insert = value;
  else if (bind === "insertOther") draft.insertOther = value;
  else if (bind === "productFit") draft.productFit = value;
  else if (bind === "artwork" && isArtwork(value)) draft.artwork = value;
  else if (bind === "destination") draft.destination = value;
  else if (bind === "incoterm" && (value === "" || (INCOTERMS as readonly string[]).includes(value))) draft.incoterm = value;
  else if (bind === "incotermPlace") draft.incotermPlace = value;
  else if (bind === "schedule") draft.schedule = value;
  else if (bind === "shippingCarton") draft.shippingCarton = value;
  else if (bind === "buyerNotes") draft.buyerNotes = value;
}

function toggleFinish(value: string, checked: boolean): void {
  if (!isFinish(value)) return;
  if (value === "none" && checked) {
    state.draft.finishes = ["none"];
    return;
  }
  const next = state.draft.finishes.filter((item) => item !== value && item !== "none");
  state.draft.finishes = checked ? [...next, value] : next;
}

function setReadMessage(draft: RfqDraft, flags: ReaderFlags): void {
  const gaps = assess(draft, flags);
  const count = gaps.criticalTotal - gaps.criticalDone;
  state.messageCount = String(count);
  state.messageKey = count === 0 ? "readClear" : "readDone";
}

function readNow(): void {
  if (!state.enquiry.trim()) {
    state.messageKey = "emptyPaste";
    state.draft = emptyDraft();
    state.flags = emptyFlags();
    render();
    return;
  }
  const result = readEnquiry(state.enquiry);
  state.draft = result.draft;
  state.flags = result.flags;
  if (result.flags.tooLong) state.messageKey = "tooLongPaste";
  else if (!result.flags.plainText) state.messageKey = "emptyMarkup";
  else setReadMessage(result.draft, result.flags);
  render();
  document.getElementById("spec-heading")?.focus();
}

function clearAll(): void {
  state.enquiry = "";
  state.draft = emptyDraft();
  state.flags = emptyFlags();
  state.exampleId = "";
  state.exampleEdited = false;
  state.messageKey = "";
  state.messageCount = "";
  state.fallback = "";
  render();
}

function loadExample(id: string): void {
  const fixture = FIXTURES.find((item) => item.id === id);
  if (!fixture) return;
  state.enquiry = fixture.text.trim();
  state.exampleId = id;
  state.exampleEdited = false;
  state.fallback = "";
  const result = readEnquiry(state.enquiry);
  state.draft = result.draft;
  state.flags = result.flags;
  setReadMessage(result.draft, result.flags);
  render();
}

function addDimension(): void {
  const row = blankDimension();
  state.draft.dimensions.push(row);
  render();
  document.getElementById(`length-${row.id}`)?.focus();
}

function removeDimension(id: string): void {
  state.draft.dimensions = state.draft.dimensions.filter((row) => row.id !== id);
  render();
}

function addQuantity(): void {
  const row = blankQuantity();
  state.draft.quantities.push(row);
  render();
  document.getElementById(`amount-${row.id}`)?.focus();
}

function removeQuantity(id: string): void {
  state.draft.quantities = state.draft.quantities.filter((row) => row.id !== id);
  render();
}

async function copyChecklist(): Promise<void> {
  const text = currentText();
  try {
    await navigator.clipboard.writeText(text);
    state.fallback = "";
    state.messageKey = "copied";
    paintDerived();
  } catch {
    state.fallback = text;
    state.messageKey = "copyFailed";
    paintDerived();
    document.getElementById("fallback-text")?.focus();
  }
}

function downloadText(): void {
  download("packaging-rfq-checklist.txt", currentText(), "text/plain;charset=utf-8");
}

function downloadJson(): void {
  const json = checklistJson(
    state.draft,
    assess(state.draft, state.flags),
    state.checklistLang,
    state.includeEnquiry ? state.enquiry : undefined,
  );
  download("packaging-rfq-checklist.json", `${JSON.stringify(json, null, 2)}\n`, "application/json;charset=utf-8");
}

function currentText(): string {
  return checklistText(state.draft, assess(state.draft, state.flags), state.checklistLang);
}

function download(filename: string, content: string, type: string): void {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.rel = "noopener";
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function fieldset(pill: FieldKey, legend: string, help?: string): HTMLFieldSetElement {
  const box = document.createElement("fieldset");
  const caption = document.createElement("legend");
  const mark = el("span", { className: "pill", attrs: { "data-pill": pill } });
  caption.append(document.createTextNode(legend), mark);
  box.append(caption);
  if (help) box.append(el("p", { className: "hint", text: help }));
  return box;
}

function labeled(id: string, label: string, control: HTMLElement, hint?: string): HTMLElement {
  const wrap = el("div", { className: "field" });
  const lab = document.createElement("label");
  lab.htmlFor = id;
  lab.textContent = label;
  wrap.append(lab, control);
  if (hint) {
    const note = el("p", { className: "hint", text: hint, attrs: { id: `${id}-hint` } });
    control.setAttribute("aria-describedby", `${id}-hint`);
    wrap.append(note);
  }
  return wrap;
}

function textInput(id: string, bind: string, value: string): HTMLInputElement {
  const input = document.createElement("input");
  input.type = "text";
  input.id = id;
  input.dataset.bind = bind;
  input.value = value;
  input.autocomplete = "off";
  return input;
}

function makeSelect(
  id: string,
  bind: string,
  value: string,
  options: Array<{ value: string; label: string }>,
  data?: { id: string; key: string },
): HTMLSelectElement {
  const select = document.createElement("select");
  select.id = id;
  select.dataset.bind = bind;
  if (data) {
    select.dataset.id = data.id;
    select.dataset.key = data.key;
  }
  for (const option of options) {
    const node = document.createElement("option");
    node.value = option.value;
    node.textContent = option.label;
    select.append(node);
  }
  select.value = value;
  return select;
}

function button(text: string, action: string, kind: "primary" | "ghost" | "chip" | "texty"): HTMLButtonElement {
  const node = document.createElement("button");
  node.type = "button";
  node.className = kind;
  node.dataset.action = action;
  node.textContent = text;
  return node;
}

function seg(
  label: string,
  options: Array<[string, string]>,
  current: string,
  action: string,
  className = "seg",
): HTMLElement {
  const group = el("div", { className, attrs: { role: "group", "aria-label": label } });
  for (const [value, text] of options) {
    const node = button(text, action, "ghost");
    node.className = "";
    node.dataset.value = value;
    node.setAttribute("aria-pressed", String(value === current));
    group.append(node);
  }
  return group;
}

function link(text: string, href: string): HTMLAnchorElement {
  const node = document.createElement("a");
  node.href = href;
  node.textContent = text;
  node.target = "_blank";
  node.rel = "noopener noreferrer";
  return node;
}

function toggle(selector: string, show: boolean): void {
  const node = rootEl?.querySelector(selector);
  if (node instanceof HTMLElement) node.hidden = !show;
}

function el(
  tag: string,
  props: { className?: string; text?: string; attrs?: Record<string, string> } = {},
  ...children: Node[]
): HTMLElement {
  const node = document.createElement(tag);
  if (props.className) node.className = props.className;
  if (props.attrs) {
    for (const [key, value] of Object.entries(props.attrs)) node.setAttribute(key, value);
  }
  if (props.text !== undefined) node.textContent = props.text;
  node.append(...children);
  return node;
}

function isChecklistLang(value: string | undefined): value is ChecklistLang {
  return value === "en" || value === "zh" || value === "both";
}
function isBox(value: string): value is BoxTypeId {
  return value === "" || (BOX_ORDER as readonly string[]).includes(value);
}
function isMaterialKind(value: string): value is MaterialKind {
  return value === "" || (MATERIAL_ORDER as readonly string[]).includes(value);
}
function isPrint(value: string): value is PrintValue {
  return value === "" || (PRINT_ORDER as readonly string[]).includes(value);
}
function isInsert(value: string): value is InsertId {
  return value === "" || (INSERT_ORDER as readonly string[]).includes(value);
}
function isArtwork(value: string): value is ArtworkValue {
  return value === "" || (ARTWORK_VALUES as readonly string[]).includes(value);
}
function isFinish(value: string): value is FinishId {
  return (FINISH_ORDER as readonly string[]).includes(value);
}
