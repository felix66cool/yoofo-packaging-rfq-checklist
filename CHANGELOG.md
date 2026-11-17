# Changelog

## 1.0.1

- A magnetic book-style box keeps the book-style structure and the magnetic closure, in English and in Chinese. “Drawer or magnetic” stays a choice, not a combination.
- The checklist date uses the browser’s calendar in a named timezone. A UTC instant late on 16 November is 17 November in Asia/Shanghai, and the line says which zone it used.
- The meta Content-Security-Policy no longer includes `frame-ancestors`, which browsers ignore on a meta tag. `connect-src 'none'` and `form-action 'none'` stay.

## 1.0.0

First release of the packaging RFQ checklist. Local reading, English and Chinese, text and JSON export.

The intended public path is `https://customgiftboxesfactory.com/tools/packaging-rfq-checklist/` on the existing Yoofo site. That URL was not verified as serving this release.
