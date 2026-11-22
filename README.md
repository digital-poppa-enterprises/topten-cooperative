# TOPTEN COOPERATIVE Website

A static website for **TOPTEN COOPERATIVE, Owerri-North Multipurpose Society**. It presents the organisation's
services, membership information, contact details, legal pages, and agent onboarding programme.

The site is built with HTML, CSS, and small browser JavaScript modules. It has no build step or framework.

## Pages

```text
index.html
about-us/index.html
become-an-agent/index.html
contact-us/index.html
services/index.html
terms-and-conditions/index.html
privacy-policy/index.html
```

Shared styles and browser assets are kept in `styles/`, `scripts/`, and `images/`.

## Run locally

No installation is required. Serve the project with a local HTTP server:

```bash
cd topten-cooperative
python3 -m http.server 8000
```

Then open `http://localhost:8000`.

## Project notes

- Page navigation uses clean folder URLs, with each page contained in its own `index.html`.
- `styles/small.css` contains the base and responsive styles.
- `styles/large.css` contains desktop-specific adjustments.
- `scripts/mobile-menu.js` manages mobile navigation behavior.
- `scripts/carousel.js` provides the home-page carousel.
- `scripts/membership-form.mjs` validates and submits the membership enquiry form.
- `scripts/print-button.js` enables printing from the terms and conditions page.
- The site uses Plus Jakarta Sans and Material Symbols from Google Fonts.

## Common edits

- Update page content directly in the relevant `index.html`.
- Add or replace images in the appropriate `images/` subfolder.
- Change brand colours in `styles/small.css`.
- Update the home hero or showcase content in `index.html` and `scripts/carousel.js`.
