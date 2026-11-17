import type { Locale } from "./types.ts";

export interface Fixture {
  id: string;
  title: Record<Locale, string>;
  text: string;
}

/** Synthetic examples written for this demo. They are not customer enquiries. */
export const FIXTURES: Fixture[] = [
  {
    id: "clear-en",
    title: {
      en: "Clear English enquiry",
      zh: "清楚的英文询价",
    },
    text: `Hello,

We need a magnetic closure rigid gift box for a candle.

Inner size: 120 x 90 x 80 mm
Outer size: 126 x 96 x 86 mm

Quantity options: 2,000 pcs or 5,000 pcs

Board: 2mm grayboard
Exterior: full color CMYK print with matte lamination and gold foil logo
Interior: unprinted
Insert: EVA foam
Product size: 70 x 70 x 75 mm candle jar

Artwork is ready as a PDF.
Ship to Germany, FOB Shanghai.
Need by 15 March 2027.
`,
  },
  {
    id: "ambiguous-size",
    title: {
      en: "Size without a unit",
      zh: "没有单位的尺寸",
    },
    text: `Please quote gift boxes.

Size 10 x 8 x 3

We need 3,000 boxes.

Printed in color with some lamination.
`,
  },
  {
    id: "zh-grayboard",
    title: {
      en: "Chinese greyboard enquiry",
      zh: "中文灰板询价",
    },
    text: `你好，想做天地盖礼盒。

内尺寸：200×150×60毫米
外尺寸：208×158×68毫米
灰板纸，厚度2mm
外面四色印刷，哑膜，烫金
里面无印刷
纸托
产品尺寸：80×40×20mm 香水瓶
数量：2000套
设计稿已有
FOB上海，发往美国
交期：2027年4月
`,
  },
  {
    id: "mdf-or-grayboard",
    title: {
      en: "MDF and grayboard both mentioned",
      zh: "同时写了密度板和灰板",
    },
    text: `Can you make a drawer box?

Some of our old boxes used 3mm MDF and some used 2mm greyboard. Please advise which is better.

Inner size around 8 x 5 x 2 inches.
Quantity: 2,000 pcs.
`,
  },
  {
    id: "three-tiers",
    title: {
      en: "Three quantity tiers",
      zh: "三个数量档",
    },
    text: `RFQ for a book style box.
Inner dimensions 250 x 180 x 40 mm.
Please quote 500 / 1,000 / 2,000 pcs as separate price tiers.
MOQ 2,000 units.
Do not combine the quantities.
Material: 1.5mm chipboard.
Exterior pantone 186, gloss lamination.
No insert.
Artwork needed.
CIF Rotterdam.
Lead time 45 days.
`,
  },
  {
    id: "markup",
    title: {
      en: "Enquiry pasted with markup",
      zh: "带标记的询价",
    },
    text: `<p>Need a lid and base box.</p>
<p>Inner size <b>180 x 120 x 50 mm</b></p>
<script>alert("xss")</script>
<img src="x" onerror="alert(1)">
Quantity: 2,000 pcs
Material: corrugated E flute
`,
  },
];

export function fixtureById(id: string): Fixture {
  const found = FIXTURES.find((item) => item.id === id);
  if (!found) throw new Error(`Unknown example: ${id}`);
  return found;
}
