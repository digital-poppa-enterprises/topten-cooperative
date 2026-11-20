# TOPTEN COOPERATIVE: Website

Static website for **TOPTEN COOPERATIVE, Owerri-North Multipurpose Society**.
Plain HTML, CSS and three small JavaScript files. No build step, no framework, no dependencies.

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
├── assets/
│   ├── css/
│   │   └── styles.css          All styling, in labelled sections (tokens, header, hero, footer, utilities, print...)
│   ├── js/
│   │   ├── carousel.js         Home page only: hero carousel + photo showcase
│   │   ├── mobile-menu.js      All pages: closes the mobile menu when a link inside it is chosen
│   │   └── print-button.js     Terms page only: makes "Print Document" open the print dialog
│   ├── fonts/
│   │   └── localize-fonts.py   One-time script that switches the site to locally hosted fonts (see below)
│   └── images/
│       ├── logo/               Logo and favicon PNGs (favicon-32, favicon-192, apple-touch-icon)
│       ├── banners/            Home hero slides (home-hero-1 to 4, in slide order)
│       ├── services/           Service-section photos (Homeowners, FoodThrift gallery)
│       └── general/            Home photo showcase (home-showcase-01 to 11), contact page image
└── README.md
```

## Run it locally

No install is needed. Either:

- **Open `index.html`** in a browser (double-click), or
- serve the folder, which is closer to how it will behave once deployed:

```bash
cd topten-cooperative
python3 -m http.server 8000      # then visit http://localhost:8000
```

## JavaScript files

Everything that can be done in HTML and CSS is (navigation, dropdowns, FAQ, footer dropdowns, form
field switching). Three small scripts remain because the browser has no HTML/CSS equivalent:

| File | Loaded on | Why it exists |
| --- | --- | --- |
| `carousel.js` | `index.html` | Drives the hero carousel (arrows, dots, autoplay that pauses on hover, keyboard focus and touch) and the photo showcase (timed cross-fade with preloading and retry). |
| `mobile-menu.js` | all pages | The mobile menu is a native `popover`, which does not close when a link to the *same* page is chosen (e.g. the Services page's service links). This ~10-line script closes it. |
| `print-button.js` | `terms-and-conditions.html` | Calls `window.print()` for the "Print Document" button. |

## How things work

| Feature | Implemented with |
| --- | --- |
| Mobile / tablet menu (below 1024px) | Native `popover` (Escape and outside-click built in) + `mobile-menu.js` for link clicks |
| Desktop Services dropdown | CSS `:hover` / `:focus-within`: works with mouse and keyboard Tab |
| Mobile "Our Services" sub-menu, FAQ, footer dropdowns | Native `<details>` / `<summary>` |
| Email / Phone / WhatsApp field switching | CSS `:has()` on the checked radio |
| Form submit message | CSS `:target`: the form is a visual mockup and sends nothing |
| Printing | `@media print` rules at the end of `styles.css` hide the header, footer, menu and the Print / Contact Legal Desk buttons |

## Printing

On the Terms page, **Print Document** opens the browser's print dialog. The printed page contains only the
terms (no header, footer, menu or buttons) and fits two A4 pages. The same print styles apply to any page
printed with Ctrl/Cmd+P.

## Fonts

The pages currently load **Plus Jakarta Sans** (text, weights 400-700) and **Material Symbols Outlined** (icons)
from Google Fonts, so an internet connection is needed for them. To host them locally instead, run once on a
computer with internet access:

```bash
python3 assets/fonts/localize-fonts.py
```

It downloads the `.woff2` files into `assets/fonts/`, writes the `@font-face` rules into `styles.css` (between the
`LOCAL-FONTS` markers) and removes the Google Fonts `<link>` tags from the seven pages. It needs only Python 3.
Afterwards, open a page with the internet disconnected to confirm text and icons look the same.

## SEO

Each page has its own `<title>` and a unique `<meta name="description">` in its `<head>`.

## Common edits

- **Change the home photo showcase:** edit the JSON list in the `<script id="home-showcase-slides">` block
  inside `index.html` (image path + alt text), and put the image in `assets/images/general/`. The first photo
  is also written directly in the markup (the `<img ... data-home-showcase-layer="0">` below it), so update both.
- **Change brand colours:** edit the variables at the top of `assets/css/styles.css` (section 1).
- **Connect the membership form:** replace the `action="#membership-status-msg"` / `method="get"` on the form in
  `index.html` with your real endpoint, then add `name` attributes to the inputs.
- **Change the hero's starting slide:** the hero opens on slide 1. To change it, move the `is-active` class (and the
  `inert` attribute) to the slide you want, and `is-active` on the matching dot.
- **Social links:** the footer icons are placeholders. Wrap them in `<a href="...">` once verified URLs are available.
