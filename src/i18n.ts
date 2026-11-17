import { formatGrouped } from "./numbers.ts";
import type {
  ArtworkValue,
  BoxTypeId,
  ChecklistLang,
  ExtraMaterialId,
  FinishId,
  InsertId,
  Issue,
  IssueCode,
  Locale,
  MaterialKind,
  PrintValue,
  QtyKind,
  Scope,
  Unit,
} from "./types.ts";

const en = {
  kicker: "Yoofo Packaging",
  title: "Packaging RFQ Checklist",
  lede: "See whether a gift-box enquiry has the size, board, quantity, print, and shipping terms a factory needs before it can quote.",
  privacy: "Reading stays in this browser tab. Nothing is uploaded, saved, or sent. Refreshing the page clears it.",
  howSummary: "How the reading works",
  how1: "Fixed rules look for keywords and number patterns in English and Simplified Chinese. This is not a language model, and it does not guess.",
  how2: "A missing unit stays missing. Millimetres, centimetres, and inches are not filled in for you. Inner and outer are used only when the text says so.",
  how3: "500 / 1,000 / 2,000 is three quantity tiers. They are not added into one total.",
  how4: "Grayboard and MDF are different boards. If both are written, neither is chosen.",
  how5: "Pasted markup is turned into text. A script in the paste is not run.",
  enquiryTitle: "Enquiry",
  enquiryLabel: "Enquiry text",
  enquiryHint: "Paste the buyer’s message. You can correct every suggestion afterwards.",
  enquiryPlaceholder: "Paste an enquiry: box structure, inner or outer size with a unit, quantity tiers, grayboard or MDF, print, destination…",
  read: "Read the enquiry",
  clear: "Clear",
  examples: "Labelled examples",
  exampleBanner: "Example only. This text was written for the demo. It is not a customer enquiry.",
  exampleEdited: "Started from a labelled example and then edited. It is still not a customer record.",
  statusTitle: "Completeness",
  criticalProgress: "{done} of {total} critical items filled",
  criticalDone: "Structure, a fully labelled size, an order quantity, and a board are filled in. This is still not a quotation, and it does not mean the box can be made.",
  groupCritical: "Needed before a useful quote",
  groupWarning: "Check these",
  groupRecommended: "Worth adding",
  groupInfo: "Notes from the reader",
  noIssues: "Nothing in this group.",
  specTitle: "Suggested fields",
  specIntro: "These are suggestions from the text. Change anything that is wrong. Empty means not confirmed.",
  structure: "Box structure",
  structureHelp: "Book-style, drawer, and lid-and-base are the structure. Magnetic is a closure and can apply as well.",
  closure: "Closure",
  closureHelp: "Kept separate from the box structure. A magnetic book-style box is both.",
  closureUnset: "Not confirmed",
  closureMagnetic: "Magnetic closure",
  size: "Box size",
  sizeHelp: "Length, width, and height need a unit and a statement of inner or outer. A shipping carton is kept separate.",
  addSize: "Add a size",
  remove: "Remove",
  length: "Length",
  width: "Width",
  height: "Height",
  scope: "Inner or outer",
  unit: "Unit",
  scopeInner: "Inner",
  scopeOuter: "Outer",
  scopeUnset: "Not stated",
  unitMm: "mm",
  unitCm: "cm",
  unitInch: "inch",
  unitUnset: "Unit not stated",
  quantity: "Quantities",
  quantityHelp: "Each row is a separate figure. Tiers are alternatives. A minimum order quantity is not the order.",
  addQty: "Add a quantity",
  amount: "Amount",
  kind: "What this number is",
  kindTier: "Order quantity tier",
  kindMoq: "Minimum order quantity",
  kindSample: "Sample",
  material: "Board",
  materialHelp: "Grayboard (a paper board) and MDF (a wood-fibre board) are not interchangeable in this checklist.",
  thickness: "Thickness",
  thicknessHint: "As written, such as 2 mm or 1200 gsm. This page does not convert one into the other.",
  print: "Print",
  exterior: "Exterior print",
  interior: "Interior print",
  finish: "Finishes",
  finishHelp: "Choose “No special finish” if there is no lamination, foil, or similar.",
  insert: "Insert",
  insertHelp: "Choose none if the box has no tray, foam, or fitting inside.",
  product: "Product that must fit",
  productHint: "The item going into the box, including its size if you know it.",
  artwork: "Artwork",
  artworkHelp: "Whether print-ready files exist, or design is still needed.",
  shipping: "Destination, terms, and timing",
  destination: "Destination",
  destinationHint: "Where the goods are going. A port after FOB or CIF is not the destination.",
  incoterm: "Incoterm",
  place: "Named place",
  placeHint: "For example Shanghai after FOB, or the city after DDP.",
  schedule: "Date or lead time",
  scheduleHint: "Kept as written. A number of days is not turned into a calendar date.",
  carton: "Shipping carton",
  cartonHint: "Export carton only. It does not replace the gift-box size.",
  notes: "Your notes",
  notesHint: "Anything else you want on the checklist. Optional.",
  outputTitle: "Checklist",
  outputIntro: "Built from the fields above, in this browser.",
  checklistLang: "Checklist language",
  langEn: "English",
  langZh: "中文",
  langBoth: "Both",
  includeEnquiry: "Include the pasted enquiry in the JSON file",
  copy: "Copy text",
  downloadTxt: "Download text",
  downloadJson: "Download JSON",
  printButton: "Print",
  copied: "Copied the checklist.",
  copyFailed: "Copy was blocked. Select the text below.",
  copyFallbackHint: "The checklist is in this box. Select it and copy.",
  close: "Close",
  notQuotation: "Not a quotation",
  generated: "Generated in this browser on {date}. It was not uploaded.",
  sectionGaps: "Still missing before a useful quote",
  sectionWarnings: "Resolve before you send",
  sectionRecommended: "Still unconfirmed",
  notConfirmed: "Not confirmed",
  qtySeparateMany: "Quote these as separate tiers. Do not add them together.",
  qtySeparateOne: "This is the order quantity to quote.",
  moqLine: "Minimum order quantity. This is not the order quantity.",
  sampleLine: "Sample quantity. Not a production order.",
  quoteCta: "Open the quote page",
  quoteHelp: "The quote page is a separate form. This checklist does not submit it and does not send email.",
  footerPrivacy: "No account, no tracker, no upload. Close the tab and the enquiry is gone.",
  website: "Website",
  quotePage: "Quote page",
  sourceNote: "First release of this checklist. Rules you can read in the source. MIT license.",
  emptyPaste: "Paste an enquiry first.",
  emptyMarkup: "After removing markup, there was no text to read.",
  tooLongPaste: "That paste is over 100,000 characters, so it was not read.",
  readDone: "Suggestions are in the fields. {count} critical gaps remain. Nothing was uploaded.",
  readClear: "The four critical items are filled in. This is still not a quotation. Nothing was uploaded.",
  pillReady: "Filled",
  pillMissing: "Missing",
  pillCheck: "Check",
  markupSummary: "Plain text after markup removal",
  otherLabel: "Describe it",
  selectUnset: "Not confirmed",
  readerSaw: "Reader saw:",
  sheetKicker: "Packaging RFQ Checklist by Yoofo Packaging",
  rulesLine: "Rules only. No language model. No price calculation.",
  orderQtyHeading: "Order quantities",
  moqHeading: "Minimum order quantity",
  sampleHeading: "Samples",
  buyerNotesHeading: "Notes",
  positiveGaps: "The four critical items are filled in. The lines below can still be open. None of this is a quotation or an approval to make the box.",
  uiLanguage: "Language",
} as const;

export type UiKey = keyof typeof en;

const zh: Record<UiKey, string> = {
  kicker: "Yoofo Packaging",
  title: "包装询价清单",
  lede: "在向工厂询价之前，检查礼盒询价是否写清了尺寸、板材、数量、印刷和贸易条款。",
  privacy: "阅读只在这个浏览器标签里进行。不会上传、不会保存、也不会发送。刷新页面就会清除。",
  howSummary: "阅读是怎么做的",
  how1: "用固定规则查找中英文关键词和数字格式。这不是语言模型，也不会替你猜测。",
  how2: "没写单位就保持空白，不会自动填毫米、厘米或英寸。只有原文写了内尺寸或外尺寸才会标出来。",
  how3: "500 / 1,000 / 2,000 是三个数量档，不会加总成一个总数。",
  how4: "灰板和密度板是两种板材。如果两种都写了，本页不会选定其中一种。",
  how5: "粘贴进来的网页标记会变成纯文本。其中的脚本不会运行。",
  enquiryTitle: "询价原文",
  enquiryLabel: "询价文字",
  enquiryHint: "贴上买家的询价。之后每个建议都可以改。",
  enquiryPlaceholder: "贴上询价：盒型结构、带单位的内尺寸或外尺寸、数量档、灰板或密度板、印刷、目的地……",
  read: "读取询价",
  clear: "清空",
  examples: "标注过的示例",
  exampleBanner: "仅为示例。这段文字是为演示写的，不是客户询价。",
  exampleEdited: "从标注示例改过来的文字，仍然不是客户记录。",
  statusTitle: "完整程度",
  criticalProgress: "关键项已填 {done} / {total}",
  criticalDone: "盒型、带单位且标明内外的尺寸、订单数量和板材都已填写。这仍然不是报价，也不表示盒子可以生产。",
  groupCritical: "报价前需要写清",
  groupWarning: "请核对",
  groupRecommended: "建议补充",
  groupInfo: "阅读说明",
  noIssues: "这一组没有内容。",
  specTitle: "建议字段",
  specIntro: "以下内容是从原文读出的建议。不对就改。留空表示尚未确认。",
  structure: "盒型结构",
  structureHelp: "书型、抽屉、天地盖是盒型结构。磁吸是闭合方式，可以同时成立。",
  closure: "闭合",
  closureHelp: "与盒型结构分开记录。磁吸书型盒两者都保留。",
  closureUnset: "未确认",
  closureMagnetic: "磁吸",
  size: "盒子尺寸",
  sizeHelp: "长、宽、高需要单位，并说明是内尺寸还是外尺寸。外箱尺寸单独列出。",
  addSize: "添加一条尺寸",
  remove: "移除",
  length: "长",
  width: "宽",
  height: "高",
  scope: "内尺寸或外尺寸",
  unit: "单位",
  scopeInner: "内尺寸",
  scopeOuter: "外尺寸",
  scopeUnset: "未说明",
  unitMm: "毫米",
  unitCm: "厘米",
  unitInch: "英寸",
  unitUnset: "未写单位",
  quantity: "数量",
  quantityHelp: "每一行都是单独的数字。数量档是备选，不是相加。起订量不是订单数量。",
  addQty: "添加一个数量",
  amount: "数字",
  kind: "这个数字指什么",
  kindTier: "订单数量档",
  kindMoq: "起订量",
  kindSample: "样品",
  material: "板材",
  materialHelp: "在本清单里，灰板（纸板）和密度板（木质纤维板）不能互相代替。",
  thickness: "厚度",
  thicknessHint: "按原文填写，例如 2 mm 或 1200 gsm。本页不会把一种换算成另一种。",
  print: "印刷",
  exterior: "外面印刷",
  interior: "里面印刷",
  finish: "表面工艺",
  finishHelp: "如果没有覆膜、烫金等工艺，请选“无特殊工艺”。",
  insert: "内托",
  insertHelp: "如果盒内没有纸托、海绵或定位件，请选无内托。",
  product: "需要装入的产品",
  productHint: "放进盒子的物品。如果知道产品尺寸，请一并写上。",
  artwork: "设计稿",
  artworkHelp: "印刷文件是否已经准备好，或者还需要设计。",
  shipping: "目的地、条款和交期",
  destination: "目的地",
  destinationHint: "货要送到哪里。FOB 或 CIF 后面的港口不是目的地。",
  incoterm: "贸易条款",
  place: "条款地点",
  placeHint: "例如 FOB 后面的上海，或 DDP 后面的城市。",
  schedule: "日期或交期",
  scheduleHint: "按原文保留。多少天不会被换算成日历日期。",
  carton: "外箱",
  cartonHint: "只指出口纸箱，不能代替礼盒尺寸。",
  notes: "你的备注",
  notesHint: "还想写在清单上的内容。可以留空。",
  outputTitle: "清单",
  outputIntro: "根据上面已确认的字段，在这个浏览器里生成。",
  checklistLang: "清单语言",
  langEn: "English",
  langZh: "中文",
  langBoth: "双语",
  includeEnquiry: "在 JSON 文件中包含粘贴的原文",
  copy: "复制文本",
  downloadTxt: "下载文本",
  downloadJson: "下载 JSON",
  printButton: "打印",
  copied: "清单已复制。",
  copyFailed: "无法复制。请选择下面的文字。",
  copyFallbackHint: "清单在这个框里，选中后复制。",
  close: "关闭",
  notQuotation: "不是报价",
  generated: "于 {date} 在本浏览器生成，没有上传。",
  sectionGaps: "报价前仍缺的关键信息",
  sectionWarnings: "发出前请核对",
  sectionRecommended: "尚未确认",
  notConfirmed: "未确认",
  qtySeparateMany: "请按不同数量档分别报价，不能相加。",
  qtySeparateOne: "这是要报价的订单数量。",
  moqLine: "起订量。它不是订单数量。",
  sampleLine: "样品数量，不是大货订单。",
  quoteCta: "打开询价页面",
  quoteHelp: "询价页面是另一个表单。本清单不会替你提交，也不会发邮件。",
  footerPrivacy: "没有账号，没有跟踪，没有上传。关掉标签页，询价内容就没有了。",
  website: "网站",
  quotePage: "询价页面",
  sourceNote: "这份清单的第一个版本。规则写在源代码里。MIT 许可。",
  emptyPaste: "请先贴上询价。",
  emptyMarkup: "去掉标记之后，没有可以阅读的文字。",
  tooLongPaste: "文字超过 100,000 个字符，因此没有读取。",
  readDone: "建议已填入字段。还有 {count} 项关键信息未齐。没有上传任何内容。",
  readClear: "四项关键信息都已填写。这仍然不是报价。没有上传任何内容。",
  pillReady: "已填",
  pillMissing: "缺失",
  pillCheck: "待核对",
  markupSummary: "去掉标记后的纯文本",
  otherLabel: "请说明",
  selectUnset: "未确认",
  readerSaw: "读到的原文：",
  sheetKicker: "Packaging RFQ Checklist by Yoofo Packaging",
  rulesLine: "只有规则。没有语言模型。不算价格。",
  orderQtyHeading: "订单数量",
  moqHeading: "起订量",
  sampleHeading: "样品",
  buyerNotesHeading: "备注",
  positiveGaps: "四项关键信息都已填写。下面仍可能有未确认的项目。这不是报价，也不是可以生产的确认。",
  uiLanguage: "语言",
};

const issuesEn: Record<IssueCode, string> = {
  "generic-box-only": "The enquiry says gift box, which is not a structure. Name the closure or opening if you know it.",
  "missing-box-type": "Box structure is missing.",
  "ambiguous-box-type": "More than one structure was mentioned: {list}. Choose one.",
  "box-needs-structure": "Rigid box is selected, but the opening or closure is still unnamed.",
  "box-other-blank": "“Other” is selected for the structure. Describe it.",
  "chose-among-box": "Several structures were in the text ({list}). The checklist uses the one selected now.",
  "also-rigid": "The enquiry also says rigid box. The structure selected now is more specific.",
  "missing-dimension": "No box size is confirmed.",
  "partial-dimension": "A size is missing length, width, or height.",
  "dimension-not-numeric": "A size has a value that is not a plain number.",
  "missing-unit": "A size has no unit. Millimetres, centimetres, and inches are not assumed.",
  "mixed-units": "A size mixed units. They were not converted.",
  "missing-scope": "A size does not say whether it is inner or outer. That is not assumed.",
  "missing-quantity": "No order quantity is confirmed.",
  "moq-only": "A minimum order quantity was written. That is not the quantity to quote. Add the order quantity as its own tier.",
  "quantity-not-numeric": "A quantity is not a plain whole number: {value}.",
  "tiers-separate": "These quantities are separate options. Do not add them together.",
  "tier-below-moq": "Below the written minimum of {moq}: {list}. The figures were left as written.",
  "plus-not-sum": "A plus sign between quantities was kept as separate tiers, not a total.",
  "stated-total": "The enquiry mentions a total. This checklist does not add quantities, and it does not check that total.",
  "missing-material": "Board material is missing. Grayboard and MDF are not filled in for you.",
  "ambiguous-material": "More than one board was mentioned: {list}. Choose one. This page does not decide, and grayboard and MDF stay different.",
  "material-other-blank": "“Other” is selected for the board. Name the material.",
  "chose-among-material": "Several boards were in the text ({list}). The checklist uses the one selected now.",
  "material-also-mentioned": "Also mentioned, and not used as the board: {list}.",
  "missing-thickness": "Board thickness is not confirmed.",
  "missing-exterior": "Exterior print is not confirmed.",
  "missing-interior": "Interior print is not confirmed.",
  "print-side": "Print was mentioned ({phrase}) but not which face. It was not assigned to inside or outside.",
  "missing-finish": "Finishes are not confirmed. Choose none if there is no foil, lamination, or similar.",
  "finish-both-sheens": "Both matte and gloss lamination are selected. Confirm where each one goes.",
  "missing-insert": "Insert is not confirmed. Choose none if the box is empty inside.",
  "insert-conflict": "The enquiry both asks for an insert and says none. Choose one.",
  "missing-product": "The product that must fit inside is not described.",
  "missing-artwork": "Artwork status is not confirmed.",
  "artwork-conflict": "The enquiry both says artwork is ready and that design is needed.",
  "missing-destination": "Destination is not confirmed.",
  "ambiguous-destination": "More than one destination was mentioned: {list}. Type the one you mean.",
  "missing-incoterm": "Incoterm is not confirmed.",
  "ambiguous-incoterm": "More than one incoterm was mentioned: {list}.",
  "ambiguous-place": "More than one place was written with the incoterm: {list}.",
  "missing-schedule": "A date or lead time is not confirmed.",
  "ambiguous-schedule": "More than one schedule was mentioned: {list}.",
  "html-removed": "Markup was removed before reading. Check the plain text.",
  "too-long": "The paste is longer than 100,000 characters and was not read.",
  "advice-requested": "The enquiry asks for advice. This page does not recommend a material, a structure, or a price.",
  "shipping-separate": "A shipping carton size is listed on its own. It is not the gift-box size.",
};

const issuesZh: Record<IssueCode, string> = {
  "generic-box-only": "原文只写了礼盒，没有写结构。如果知道开合方式，请选上。",
  "missing-box-type": "还没有确认盒型结构。",
  "ambiguous-box-type": "原文提到了不止一种结构：{list}。请选定一种。",
  "box-needs-structure": "目前只选了硬盒，开合方式还没有写明。",
  "box-other-blank": "结构选了“其他”，请写明是什么盒子。",
  "chose-among-box": "原文里有几种结构（{list}）。清单采用你现在选定的一种。",
  "also-rigid": "原文也写了硬盒。你现在选的结构更具体。",
  "missing-dimension": "还没有确认盒子尺寸。",
  "partial-dimension": "有一条尺寸缺少长、宽或高。",
  "dimension-not-numeric": "有一条尺寸不是普通数字。",
  "missing-unit": "有一条尺寸没有单位。不会默认毫米、厘米或英寸。",
  "mixed-units": "同一条尺寸里混用了单位，没有做换算。",
  "missing-scope": "有一条尺寸没有说明是内尺寸还是外尺寸，不会替你假定。",
  "missing-quantity": "还没有确认订单数量。",
  "moq-only": "原文写了起订量。起订量不是要报价的订单数量，请另加一行订单数量。",
  "quantity-not-numeric": "有一个数量不是整数：{value}。",
  "tiers-separate": "这些数量是分开的选项，不能相加。",
  "tier-below-moq": "{list} 低于原文写的起订量 {moq}。数字保持原样，没有改动。",
  "plus-not-sum": "数量之间的加号按分开的数量档处理，不是总数。",
  "stated-total": "原文提到了总数。本清单不会把数量相加，也不核对那个总数。",
  "missing-material": "还没有确认板材。不会自动填成灰板或密度板。",
  "ambiguous-material": "原文提到了不止一种板材：{list}。请自己选定。本页不会代选，灰板和密度板也不会当成同一种。",
  "material-other-blank": "板材选了“其他”，请写明材料名称。",
  "chose-among-material": "原文里有几种板材（{list}）。清单采用你现在选定的一种。",
  "material-also-mentioned": "原文还提到了这些，但没有当作板材：{list}。",
  "missing-thickness": "板材厚度尚未确认。",
  "missing-exterior": "外面印刷尚未确认。",
  "missing-interior": "里面印刷尚未确认。",
  "print-side": "原文提到了印刷（{phrase}），但没有说明是里面还是外面，因此没有归到任何一面。",
  "missing-finish": "表面工艺尚未确认。如果没有烫金、覆膜等，请选无特殊工艺。",
  "finish-both-sheens": "哑膜和光膜都选中了。请确认各自用在哪里。",
  "missing-insert": "内托尚未确认。如果盒内没有内托，请选无内托。",
  "insert-conflict": "原文既写了内托，又写了不要内托。请选定一种。",
  "missing-product": "还没有描述要装进盒子的产品。",
  "missing-artwork": "设计稿状态尚未确认。",
  "artwork-conflict": "原文既说设计稿已有，又说需要设计。",
  "missing-destination": "目的地尚未确认。",
  "ambiguous-destination": "原文提到了不止一个目的地：{list}。请填入你要的那个。",
  "missing-incoterm": "贸易条款尚未确认。",
  "ambiguous-incoterm": "原文提到了不止一个贸易条款：{list}。",
  "ambiguous-place": "贸易条款后面写了不止一个地点：{list}。",
  "missing-schedule": "日期或交期尚未确认。",
  "ambiguous-schedule": "原文提到了不止一个交期：{list}。",
  "html-removed": "阅读前已去掉标记。请核对纯文本。",
  "too-long": "原文超过 100,000 个字符，没有读取。",
  "advice-requested": "询价在征求建议。本页不会推荐板材、结构或价格。",
  "shipping-separate": "外箱尺寸单独列出，它不是礼盒尺寸。",
};

const boxEn: Record<Exclude<BoxTypeId, "">, string> = {
  magnetic: "Magnetic closure",
  drawer: "Drawer box",
  book: "Book-style box",
  "lid-base": "Lid and base",
  clamshell: "Clamshell / flip-top",
  shoulder: "Shoulder box",
  window: "Window box",
  folding: "Folding carton",
  tube: "Tube box",
  rigid: "Rigid box, structure unnamed",
  other: "Other",
};

const boxZh: Record<Exclude<BoxTypeId, "">, string> = {
  magnetic: "磁吸盒",
  drawer: "抽屉盒",
  book: "书型盒",
  "lid-base": "天地盖",
  clamshell: "翻盖盒",
  shoulder: "围框盒",
  window: "开窗盒",
  folding: "折叠彩盒",
  tube: "圆筒盒",
  rigid: "硬盒，结构未写明",
  other: "其他",
};

const materialEn: Record<Exclude<MaterialKind, "">, string> = {
  grayboard: "Grayboard",
  mdf: "MDF",
  corrugated: "Corrugated board",
  cardboard: "Cardboard",
  kraft: "Kraft",
  other: "Other",
};

const materialZh: Record<Exclude<MaterialKind, "">, string> = {
  grayboard: "灰板",
  mdf: "密度板",
  corrugated: "瓦楞",
  cardboard: "卡纸板",
  kraft: "牛皮",
  other: "其他",
};

const extraEn: Record<ExtraMaterialId, string> = {
  kraft: "kraft",
  "art-paper": "art paper",
  "coated-paper": "coated paper",
};

const extraZh: Record<ExtraMaterialId, string> = {
  kraft: "牛皮",
  "art-paper": "艺术纸或铜版类面纸",
  "coated-paper": "白卡或特种面纸",
};

const finishEn: Record<FinishId, string> = {
  "matte-lamination": "Matte lamination",
  "gloss-lamination": "Gloss lamination",
  "soft-touch": "Soft-touch",
  lamination: "Lamination, sheen not stated",
  foil: "Foil",
  emboss: "Emboss",
  deboss: "Deboss",
  "emboss-deboss": "Emboss / deboss",
  "spot-uv": "Spot UV",
  varnish: "Varnish",
  none: "No special finish",
};

const finishZh: Record<FinishId, string> = {
  "matte-lamination": "哑膜",
  "gloss-lamination": "光膜",
  "soft-touch": "触感膜",
  lamination: "覆膜，光哑未说明",
  foil: "烫金或烫银",
  emboss: "击凸",
  deboss: "压凹",
  "emboss-deboss": "凹凸",
  "spot-uv": "局部 UV",
  varnish: "上光",
  none: "无特殊工艺",
};

const insertEn: Record<Exclude<InsertId, "">, string> = {
  eva: "EVA",
  foam: "Foam",
  flock: "Flock / velvet",
  paper: "Paper insert",
  blister: "Blister",
  none: "No insert",
  other: "Other",
};

const insertZh: Record<Exclude<InsertId, "">, string> = {
  eva: "EVA",
  foam: "海绵或珍珠棉",
  flock: "植绒或丝绒",
  paper: "纸托",
  blister: "吸塑",
  none: "无内托",
  other: "其他",
};

const printEn: Record<Exclude<PrintValue, "">, string> = {
  cmyk: "CMYK / full colour",
  pms: "PMS / spot colour",
  printed: "Printed, method not stated",
  none: "Unprinted",
};

const printZh: Record<Exclude<PrintValue, "">, string> = {
  cmyk: "四色",
  pms: "专色",
  printed: "有印刷，方式未说明",
  none: "无印刷",
};

const artworkEn: Record<Exclude<ArtworkValue, "">, string> = {
  ready: "Artwork is ready",
  needed: "Design is needed",
};

const artworkZh: Record<Exclude<ArtworkValue, "">, string> = {
  ready: "设计稿已有",
  needed: "需要设计",
};

const countries: Record<string, string> = {
  "United States": "美国",
  "United Kingdom": "英国",
  Germany: "德国",
  France: "法国",
  Italy: "意大利",
  Spain: "西班牙",
  Netherlands: "荷兰",
  Belgium: "比利时",
  Australia: "澳大利亚",
  Canada: "加拿大",
  Japan: "日本",
  "South Korea": "韩国",
  Singapore: "新加坡",
  "United Arab Emirates": "阿联酋",
  "Saudi Arabia": "沙特",
  Mexico: "墨西哥",
  Brazil: "巴西",
  India: "印度",
  Thailand: "泰国",
  Vietnam: "越南",
  Malaysia: "马来西亚",
  Indonesia: "印度尼西亚",
  "New Zealand": "新西兰",
  Sweden: "瑞典",
  Switzerland: "瑞士",
  Poland: "波兰",
  "Hong Kong": "香港",
  Taiwan: "台湾",
};

export function t(locale: Locale, key: UiKey, params: Record<string, string> = {}): string {
  return fill(locale === "zh" ? zh[key] : en[key], params);
}

export function bi(lang: ChecklistLang, key: UiKey): string {
  if (lang === "en") return en[key];
  if (lang === "zh") return zh[key];
  return en[key] === zh[key] ? en[key] : `${en[key]} / ${zh[key]}`;
}

export function issueMessage(locale: Locale, issue: Issue): string {
  const template = locale === "zh" ? issuesZh[issue.code] : issuesEn[issue.code];
  return fill(template, localizeParams(locale, issue));
}

export function boxLabel(locale: Locale, id: Exclude<BoxTypeId, "">): string {
  return locale === "zh" ? boxZh[id] : boxEn[id];
}

export function materialLabel(locale: Locale, id: Exclude<MaterialKind, "">): string {
  return locale === "zh" ? materialZh[id] : materialEn[id];
}

export function finishLabel(locale: Locale, id: FinishId): string {
  return locale === "zh" ? finishZh[id] : finishEn[id];
}

export function insertLabel(locale: Locale, id: Exclude<InsertId, "">): string {
  return locale === "zh" ? insertZh[id] : insertEn[id];
}

export function printLabel(locale: Locale, id: Exclude<PrintValue, "">): string {
  return locale === "zh" ? printZh[id] : printEn[id];
}

export function artworkLabel(locale: Locale, id: Exclude<ArtworkValue, "">): string {
  return locale === "zh" ? artworkZh[id] : artworkEn[id];
}

export function unitLabel(locale: Locale, unit: Unit): string {
  if (unit === "mm") return t(locale, "unitMm");
  if (unit === "cm") return t(locale, "unitCm");
  if (unit === "inch") return t(locale, "unitInch");
  return t(locale, "unitUnset");
}

export function scopeLabel(locale: Locale, scope: Scope): string {
  if (scope === "inner") return t(locale, "scopeInner");
  if (scope === "outer") return t(locale, "scopeOuter");
  return t(locale, "scopeUnset");
}

export function qtyKindLabel(locale: Locale, kind: QtyKind): string {
  if (kind === "moq") return t(locale, "kindMoq");
  if (kind === "sample") return t(locale, "kindSample");
  return t(locale, "kindTier");
}

export function countryLabel(locale: Locale, name: string): string {
  if (locale === "en") return name;
  return countries[name] ?? name;
}

export function pair(lang: ChecklistLang, enText: string, zhText: string): string {
  if (lang === "en") return enText;
  if (lang === "zh") return zhText;
  return enText === zhText ? enText : `${enText} / ${zhText}`;
}

function localizeParams(locale: Locale, issue: Issue): Record<string, string> {
  const params = { ...(issue.params ?? {}) };
  const kind = listKind(issue.code);
  if (params.list) params.list = translateList(locale, params.list, kind);
  if (params.value) params.value = params.value.split("|").join(locale === "zh" ? "、" : ", ");
  if (kind === "number" && params.moq && /^\d+$/.test(params.moq)) {
    params.moq = formatGrouped(Number(params.moq), locale);
  }
  return params;
}

function listKind(code: IssueCode): "box" | "material" | "extra" | "country" | "number" | "plain" {
  if (code === "ambiguous-box-type" || code === "chose-among-box") return "box";
  if (code === "ambiguous-material" || code === "chose-among-material") return "material";
  if (code === "material-also-mentioned") return "extra";
  if (code === "ambiguous-destination") return "country";
  if (code === "tier-below-moq") return "number";
  return "plain";
}

function translateList(locale: Locale, list: string, kind: ReturnType<typeof listKind>): string {
  const parts = list.split("|").filter(Boolean);
  const joiner = locale === "zh" ? "、" : ", ";
  const mapped = parts.map((part) => {
    if (kind === "box") return boxLabel(locale, part as Exclude<BoxTypeId, "">);
    if (kind === "material") return materialLabel(locale, part as Exclude<MaterialKind, "">);
    if (kind === "extra") return locale === "zh" ? extraZh[part as ExtraMaterialId] : extraEn[part as ExtraMaterialId];
    if (kind === "country") return countryLabel(locale, part);
    if (kind === "number" && /^\d+$/.test(part)) return formatGrouped(Number(part), locale);
    return part;
  });
  return mapped.join(joiner);
}

function fill(template: string, params: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (token, key: string) => params[key] ?? token);
}
