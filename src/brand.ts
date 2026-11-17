export const BRAND = {
  tool: "Packaging RFQ Checklist by Yoofo Packaging",
  company: "Shanghai Yoofo Packaging",
  short: "Yoofo Packaging",
  site: "https://customgiftboxesfactory.com",
  quote: "https://customgiftboxesfactory.com/en/quote",
  version: "1.0.1",
  schema: "yoofo-packaging-rfq-checklist/v1",
  maxChars: 100_000,
} as const;

export const DISCLAIMER = {
  en: "This checklist only shows whether an enquiry is complete enough to send. It is not a quotation, not a manufacturability approval, and not a recommendation from a person or a model. It does not calculate a price. Blank means not confirmed.",
  zh: "本清单只说明询价是否写全，方便你发给工厂。它不是报价，不是可生产性确认，也不是人或模型给出的建议。这里不算价格。留空表示尚未确认。",
} as const;
