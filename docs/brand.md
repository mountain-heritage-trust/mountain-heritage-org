# Brand guidelines

These guidelines were reverse-engineered from the previous Webflow site
(stylesheet at `cdn.prod.website-files.com/.../mountainheritagetrust.shared...min.css`)
and the existing logo. They are the source of truth for the new site's
visual identity until MHT issues a formal brand book.

## Logo

Horizontal lockup: stylised mountain mark and the wordmark "MOUNTAIN
HERITAGE TRUST" set in capitals, all rendered in brand blue.

- **File:** `public/brand/logo.svg` (193×50 viewBox, ~6 KB).
- **Public URL:** `/brand/logo.svg`.
- **Usage:** the only home-page link in the top-left of the site header.
  Sized to 44px tall (≈170px wide).

## Favicon / monogram

A square version of just the mountain mark in brand blue, used for the
favicon and Apple touch icon.

- **File:** `public/brand/favicon.png` (289×289 PNG).
- **Public URL:** `/brand/favicon.png`. Wired up in
  `src/layouts/BaseLayout.astro` as both `rel="icon"` and
  `rel="apple-touch-icon"`.

## Colour palette

| Role            | Hex       | CSS token                      | Use for                                              |
| --------------- | --------- | ------------------------------ | ---------------------------------------------------- |
| Brand primary   | `#1c3278` | `--color-brand-blue`           | Logo, hero blocks, branded backgrounds.              |
| Brand action    | `#990066` | `--color-accent`               | Buttons, links, focus rings, donate CTA.             |
| Action hover    | `#6f0049` | `--color-accent-hover`         | Hover state for buttons and links.                   |
| Body text       | `#333333` | `--color-text`                 | Default copy.                                        |
| Muted text      | `#5d6c7b` | `--color-muted`                | Secondary copy: dates, captions, metadata.           |
| Page background | `#fafaf7` | `--color-bg`                   | Default page background (warm off-white).            |
| Surface         | `#ffffff` | `--color-surface`              | Header, cards, raised surfaces.                      |
| Border / rule   | `#e5e5e0` | `--color-border`               | Hairlines, dividers, input borders.                  |
| Footer bg       | `#2a2a2a` | `--color-footer-bg`            | Footer background (dark contrast).                   |

The two brand colours work hard together: **blue is the identity** (logo and
banner blocks), **purple is the call to action** (buttons and links). Avoid
introducing a third colour for emphasis — pick from these.

## Typography

- **Headings:** Montserrat, weights 600 (semi-bold) and 700 (bold). Loaded
  from Google Fonts in `BaseLayout.astro`.
- **Body:** Helvetica Neue, falling back to system sans (matches the
  previous site).
- **CSS tokens:** `--font-heading` and `--font-body`.

Heading sizes follow a slightly compressed scale, intended for medium-length
headings on a content-heavy site:

| Element | Size       | Line-height |
| ------- | ---------- | ----------- |
| h1      | 2.25rem    | 1.2         |
| h2      | 1.625rem   | 1.2         |
| h3      | 1.25rem    | 1.2         |

## Buttons & links

- Buttons are **uppercase**, **semi-bold** Montserrat (matches the previous
  site's button convention — `text-transform: uppercase` in the old CSS).
- Default button fill: brand purple (`--color-accent`), white text.
- Outlined / inverted variant: 2px purple border, purple text on white
  background.
- Links: brand purple, no underline by default, underline on hover. Inside
  prose, underline is on by default for affordance.

## Voice

Light prescription only — adapt to the page:

- Plain English, written for a non-specialist UK audience.
- The trust is a custodian of mountaineering heritage — confident and
  knowledgeable, but not pompous. Names and historical detail are welcome;
  jargon is not.
- British spelling.
- Headings as short noun phrases (e.g. "Why donate") rather than complete
  sentences.

## What sits where

- Tokens above live in `:root` in `src/styles/global.css`. Swap them there;
  every component picks up the new value.
- Component-level styles that depend on these tokens live in the same file
  for now (header, footer, forms, donate, listings). One file is easier to
  hold in your head than a dozen co-located CSS files.
- The legacy logo lives under `public/brand/`, not `src/assets/`, because
  it's served as-is rather than processed by Astro.
