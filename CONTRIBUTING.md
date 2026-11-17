# Contributing

Thanks for improving the checklist. The useful change is usually a reading rule that fails on a short, made-up enquiry, or a clearer sentence in English or Chinese.

## Local setup

```bash
npm ci
npm test
npm run dev
```

The dev server is [http://127.0.0.1:4317](http://127.0.0.1:4317). Nothing in that flow needs a token.

## What to change

- Reading rules live in `src/extract.ts`. Completeness rules live in `src/assess.ts`.
- User-facing sentences live in `src/i18n.ts`. Add the English string and the Chinese string together. The types fail the build if a key is missing on one side.
- Do not add a network call, analytics, storage, or a language-model client. `tests/source-guard.test.ts` checks the app source for those.
- Do not add a price, a cost formula, or a manufacturability judgement.
- Do not silently fill a unit, an inner/outer label, or a board. An unknown stays empty.
- Do not add quantity tiers together. Order quantities, minimums, and samples stay in separate JSON arrays.

## Tests

Add a case in `tests/reader.test.ts` for a rule you change. Prefer a short synthetic sentence over a long letter.

```bash
npm test
npm run build
```

Both should pass before you open a pull request.

## Examples and issues

The texts in `src/fixtures.ts` are labelled examples, not customer records. Do not commit a real enquiry, a customer’s name, an email address, or a phone number. If a bug report needs an illustration, rewrite it as a few invented lines.

## Pull requests

Say which enquiry shape you covered and what you refused to guess. A screenshot of the checklist is useful when the change is visual.
