# Packaging RFQ Checklist

A local completeness checker for gift-box enquiries. The page runs a deterministic rule parser in the browser. It is not AI. Paste a buyer’s message, review the fields the reader suggests, edit the checklist, and take away a copy you can send yourself. The enquiry is not uploaded.

It is published for [Yoofo Packaging](https://customgiftboxesfactory.com) (Shanghai Yoofo Packaging). The factory quote form is [customgiftboxesfactory.com/en/quote](https://customgiftboxesfactory.com/en/quote). This page does not open that form for you and does not send email.

## Public address

The live demo is [https://customgiftboxesfactory.com/tools/packaging-rfq-checklist/](https://customgiftboxesfactory.com/tools/packaging-rfq-checklist/).

That page was independently checked in a browser on 17 November 2026 (Shanghai, UTC+8): the English and Chinese interface, field edits, separate quantities, text and JSON download, a narrow layout, and the quote link. Version 1.0.1 is the source after that check. It fixes a magnetic book-style box being reduced to the closure only, and it prints the checklist date in the browser’s calendar with the timezone named. This repository does not deploy that host by itself.

Hosting is a copy of `dist/` placed at that path on the existing Yoofo site. This project does not use Vercel, and it does not mirror the repository into Vercel. Publishing this source does not deploy or change that site.

## Repository

The source repository is [https://github.com/felix66cool/yoofo-packaging-rfq-checklist](https://github.com/felix66cool/yoofo-packaging-rfq-checklist).

```bash
git clone https://github.com/felix66cool/yoofo-packaging-rfq-checklist.git
cd yoofo-packaging-rfq-checklist
```

The interface is English by default. A control in the header switches it to Chinese. The checklist itself can be English, Chinese, or both.

## What it does

- Reads a pasted enquiry in the browser with a deterministic rule parser: keywords and number patterns in English and Simplified Chinese. It is not AI.
- Shows the suggestion next to the words it matched, and leaves the field editable.
- Asks for the items a gift-box factory usually cannot quote without: structure, a size with a unit and an inner or outer label, an order quantity, and the board.
- Keeps grayboard and MDF apart. If the text names both, neither is selected.
- Lists 500 / 1,000 / 2,000 as three quantity tiers. It does not add them.
- Treats a minimum order quantity as a minimum, not as the order.
- Builds a checklist you can copy, download as text, download as JSON, or print.
- Strips markup before reading, so a pasted page is handled as text.

## What it does not do

- It does not quote a price, and it has no cost formula.
- It does not approve a construction or say that a box can be made.
- It does not recommend a material, a structure, or a supplier.
- It is not a language model. If a unit, a face, or a board is not written, the field stays empty.
- It does not send the enquiry anywhere. The quote-page link is only a link.
- It does not guarantee that a quotation prepared from the checklist is accurate.
- It does not guarantee geographic coverage, search placement, or visibility in generative search.

## Privacy

Everything stays in the browser tab.

- There is no account, no analytics, no tracker, and no upload.
- The script does not call `fetch`, a socket, or storage. Refreshing the page clears the enquiry.
- Downloads are files the browser saves locally. Copy uses the clipboard on your machine.
- The built page sends a Content-Security-Policy that blocks connections (`connect-src 'none'`).
- External links are normal links you choose to open. They use `rel="noreferrer"`.
- The JSON file includes the pasted enquiry only if you tick that box. It is off by default.

Pasted HTML is not rendered. Tags are removed, and the contents of `script` and `style` are discarded. What remains is shown as text.

## How the reader works

The reader is a deterministic browser-local rule parser. It is not AI and it is not a language model. The same paste always produces the same suggestion. Nothing in the enquiry is uploaded.

It looks for a structure (magnetic closure, drawer, lid and base, book-style, and the other openings in the source), triples such as `120 x 90 x 80 mm` or `200×150×60毫米`, quantity phrases, board words, print, finishes, an insert, a product size, artwork, an incoterm, a destination, and a date or lead time written out.

Decisions it will not make:

- No unit is assumed. `10 x 8 x 3` stays without mm, cm, or inches.
- Inner and outer are used only when the text says so.
- A shipping carton is stored separately and is not treated as the gift-box size.
- `1000+2000` is two tiers, not 3000. A sentence that says “total” is noted and is not checked by adding the tiers.
- Grayboard, greyboard, chipboard, and 灰板 are one family. MDF, density board, and 密度板 are another. They are never merged.
- Thickness is kept as written (`2 mm` or `1200 gsm`). One is not converted into the other.
- Magnetic is a closure. Book-style, drawer, and lid-and-base are structures. “Magnetic book-style” keeps both. “Drawer or magnetic” stays a choice.
- FOB Shanghai is the incoterm and the named place. Shanghai is not filled in as the destination.
- The checklist date is the browser’s calendar day, with the timezone written next to it. It is not the UTC date from `toISOString`.
- A lead time such as `45 days` is not turned into a calendar date.

Suggestions are a starting point. The checklist is built from the fields after you edit them.

## Examples

The page includes labelled examples. They were written for the demo. They are not customer enquiries, and the page says so when one is loaded.

## Run it locally

Node.js 22 or newer.

```bash
git clone https://github.com/felix66cool/yoofo-packaging-rfq-checklist.git
cd yoofo-packaging-rfq-checklist
npm ci
npm test
npm run dev
```

Open [http://127.0.0.1:4317](http://127.0.0.1:4317). No API key or account is required.

## Tests

```bash
npm test
```

The suite covers Simplified Chinese and English wording, mm / cm / inch and a missing unit, inner and outer together, MDF against grayboard (including 密度板, 灰板纸, chipboard, and density board), several quantity tiers that must not be summed, a minimum order quantity kept apart from the order, and markup that must not survive as a tag. A source check rejects network calls, storage, and a language-model claim in the app code.

`npm test` also typechecks, because `npm run build` runs `tsc` before the bundle. You can run `npx tsc --noEmit` on its own.

## Build

```bash
npm run build
```

Output goes to `dist/`. Asset URLs are relative (`base: './'` in `vite.config.ts`), so the same folder works at `/tools/packaging-rfq-checklist/` without rewriting the base.

Preview the build without a host or a token:

```bash
npm run preview
```

That serves `dist/` at [http://127.0.0.1:4317](http://127.0.0.1:4317).

## Put `dist/` on the Yoofo site

1. Run `npm test` and `npm run build`.
2. Upload the **contents** of `dist/`, including `.nojekyll`, to the existing host at `/tools/packaging-rfq-checklist/`.
3. Leave `base` as `./`. An absolute base would break that subdirectory.

No token is required to build or to preview. The check workflow in `.github/workflows/check.yml` runs the tests and the build on push. It does not publish the site.

## Optional GitHub Pages

`.github/workflows/pages.yml` can publish `dist/` to GitHub Pages, and only when someone starts that workflow by hand. It does not run on push. The address GitHub assigns is not the live demo above. Enable Pages in the repository settings before starting the workflow. The source repository is [https://github.com/felix66cool/yoofo-packaging-rfq-checklist](https://github.com/felix66cool/yoofo-packaging-rfq-checklist). Starting that workflow is optional and is not part of publishing this source. It does not change the live demo.

## Layout

| Path | Role |
| --- | --- |
| `src/extract.ts` | Rules that read an enquiry |
| `src/assess.ts` | Missing, ambiguous, and recommended items |
| `src/export.ts` | Text checklist and JSON |
| `src/i18n.ts` | English and Chinese copy |
| `src/ui.ts` | The page |
| `src/fixtures.ts` | Labelled synthetic examples |
| `tests/` | Reader, checklist, and source checks |

## JSON

The downloaded file uses schema `yoofo-packaging-rfq-checklist/v1`. Order quantities, minimums, and samples are separate arrays. `quantitiesAreCumulative` is `false`. There is no total field. `reader.usesLanguageModel` is `false`.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md). Please add a test when you change a reading rule, and do not paste a real customer’s enquiry.

## License

[MIT](LICENSE). Copyright (c) 2026 Shanghai Yoofo Packaging.

## Limitations

- Unusual phrasing is missed. The field stays empty rather than being guessed.
- Whole-number quantities under 10 are not picked up. Type them if you need them.
- Only the English and Simplified Chinese patterns in the source are recognised. Another language is read only where those words appear.
- Pastes longer than 100,000 characters are refused.
- Country detection is a fixed list, not a gazetteer. An unknown place stays blank until you type it.
- The tool cannot see attachments. “Artwork is ready” is only what the words say.
- A filled checklist is still not a quotation and not a statement that the box can be manufactured.
- The checklist does not guarantee that a quotation prepared from it is accurate.
- The checklist does not guarantee geographic coverage, search placement, or visibility in generative search.
