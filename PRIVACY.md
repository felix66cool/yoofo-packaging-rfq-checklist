# Privacy

Packaging RFQ Checklist is a static page. The enquiry is read in your browser and is not uploaded.

- There is no account and no server-side processing.
- The application does not use analytics, advertising, or a tracker.
- It does not write the enquiry to `localStorage`, `sessionStorage`, IndexedDB, or a cookie. Closing or refreshing the tab clears it.
- Copy stays on your clipboard. Download saves a file on your computer.
- The pasted enquiry is included in the JSON file only when you tick that option.
- Links to customgiftboxesfactory.com are ordinary links. The checklist does not submit them.

The production build sets a Content-Security-Policy that allows scripts and styles from the page itself and blocks connections (`connect-src 'none'`).

This note describes the page in this repository. The factory website it links to is a separate site with its own practices.
