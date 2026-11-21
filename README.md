# TOPTEN COOPERATIVE: Website

Static website for **TOPTEN COOPERATIVE, Owerri-North Multipurpose Society**.
Plain HTML, CSS and small JavaScript files. No build step or framework; the membership form loads the pinned
`intl-tel-input` browser library from jsDelivr for international phone-number selection and validation.

## Folder structure

```text
topten-cooperative/
├── index.html                  Home
├── services.html               Our Services
├── about-us.html               About Us
├── become-an-agent.html        Become an Agent
├── contact-us.html             Contact Us
├── terms-and-conditions.html   Terms & Conditions
├── privacy-policy.html         Privacy Policy
├── favicon.ico                 Browser-tab icon (16/32/48px)
└── README.md
```

## Run it locally

No install is needed. Serve the folder locally to test the membership form; its JavaScript module and phone-number
library require HTTP(S), so opening `index.html` directly does not exercise the integration:

- **Serve the folder**:

```bash
cd topten-cooperative
python3 -m http.server 8000      # then visit http://localhost:8000
```

## JavaScript files

Everything that can be done in HTML and CSS is (navigation, dropdowns, FAQ, footer dropdowns, form
field switching). Four small scripts remain because the browser has no HTML/CSS equivalent:

| File | Loaded on | Why it exists |
| --- | --- | --- |
| `carousel.js` | `index.html` | Drives the hero carousel (arrows, dots, autoplay that pauses on hover, keyboard focus and touch) and the photo showcase (timed cross-fade with preloading and retry). |
| `mobile-menu.js` | all pages | The mobile menu is a native `popover`, which does not close when a link to the *same* page is chosen (e.g. the Services page's service links). This ~10-line script closes it. |
| `print-button.js` | `terms-and-conditions.html` | Calls `window.print()` for the "Print Document" button. |
| `membership-form.mjs` | `index.html` | Validates the selected contact method and submits membership enquiries to the public HubSpot Forms API. |

## How things work

| Feature | Implemented with |
| --- | --- |
| Mobile / tablet menu (below 1024px) | Native `popover` (Escape and outside-click built in) + `mobile-menu.js` for link clicks |
| Desktop Services dropdown | CSS `:hover` / `:focus-within`: works with mouse and keyboard Tab |
| Mobile "Our Services" sub-menu, FAQ, footer dropdowns | Native `<details>` / `<summary>` |
| Email / Phone / WhatsApp field switching | CSS `:has()` on the checked radio |
| Membership enquiry submission | `membership-form.mjs` posts mapped fields to HubSpot; no private token is used in the browser |
| Printing | `@media print` rules at the end of `styles.css` hide the header, footer, menu and the Print / Contact Legal Desk buttons |

## Printing

On the Terms page, **Print Document** opens the browser's print dialog. The printed page contains only the
terms (no header, footer, menu or buttons) and fits two A4 pages. The same print styles apply to any page
printed with Ctrl/Cmd+P.

## Fonts

The pages load **Plus Jakarta Sans** (text, weights 400-700) and **Material Symbols Outlined** (icons) from Google Fonts.

## SEO

Each page has its own `<title>` and a unique `<meta name="description">` in its `<head>`.

## Common edits

- **Change the home photo showcase:** edit the JSON list in the `<script id="home-showcase-slides">` block
  inside `index.html` (image path + alt text), and put the image in `images/general/`. The first photo
  is also written directly in the markup (the `<img ... data-home-showcase-layer="0">` below it), so update both.
- **Change brand colours:** edit the variables at the top of `styles/small.css` (section 1).
- **HubSpot membership form:** the form and script use the public portal/form IDs and property names configured in
  `scripts/membership-form.mjs`. The embed identifies the form as EU1, so submissions use HubSpot's EU1 Forms API
  endpoint. The matching HubSpot form must be published, have the mapped fields, allow contact creation without
  email for phone/WhatsApp enquiries, and have CAPTCHA disabled for API submissions. The script sends no tracking
  cookie, IP address, or legal-consent flag. Its spam deterrence is browser-side only (honeypot and minimum completion
  time), not server-side rate limiting. The phone library's code is loaded from jsDelivr; entered numbers are not sent
  to that CDN. Before launch, confirm the privacy notice and deployed `privacy-policy.html` URL with TOPTEN; the
  policy currently contains date and Privacy Officer placeholders.
- **Change the hero's starting slide:** the hero opens on slide 1. To change it, move the `is-active` class (and the
  `inert` attribute) to the slide you want, and `is-active` on the matching dot.
- **Social links:** the footer icons are placeholders. Wrap them in `<a href="...">` once verified URLs are available.
