# Design system

The site uses plain CSS with custom properties for tokens. No CSS framework. The aim is a clean, accessible baseline that another developer can read and modify without learning a framework's conventions.

The visual identity (colours, fonts, logo) is documented in
[brand.md](brand.md). This file describes how those tokens are organised in
the codebase and the component conventions for using them.

## Tokens

Defined in `src/styles/global.css` on `:root`. Change them there and every
component picks up the new values. Source of truth for colour values is
[brand.md](brand.md).

| Token                       | Used for                                                              |
| --------------------------- | --------------------------------------------------------------------- |
| `--color-brand-blue`        | Logo background, branded hero blocks.                                 |
| `--color-accent`            | Links, buttons, focus rings (brand purple).                           |
| `--color-accent-hover`      | Hover state for links and buttons.                                    |
| `--color-donate`            | Donate button — aliased to `--color-accent` per brand.                |
| `--color-bg`                | Page background (warm off-white).                                     |
| `--color-surface`           | Header, cards, raised surfaces.                                       |
| `--color-text`              | Primary body copy.                                                    |
| `--color-muted`             | Secondary copy: dates, captions, metadata.                            |
| `--color-border`            | Hairlines, dividers, input borders.                                   |
| `--color-footer-*`          | Dark footer.                                                          |
| `--font-heading`            | Montserrat, weights 600/700. Loaded from Google Fonts in BaseLayout.  |
| `--font-body`               | Helvetica Neue stack.                                                 |
| `--max-width`               | `72rem` (~1152px) page-frame width.                                   |
| `--content-width`           | `42rem` (~672px) long-form content width.                             |
| `--radius`                  | `0.25rem` rounded corners.                                            |

## Component conventions

- One component per file under `src/components/`.
- Layouts under `src/layouts/`. Pages compose a layout + content.
- Component-level styles that depend on tokens live in `global.css` for now
  (header, footer, forms, donate, listings). One file is easier to hold in
  your head than a dozen co-located CSS files.
- Buttons follow the brand convention: uppercase, semi-bold or bold
  Montserrat, purple background (or purple border for inverted variant).
- All interactive elements must show a visible focus ring (`:focus-visible`).

## Accessibility baseline

- Skip-to-main-content link in `BaseLayout`.
- Semantic landmarks: `header`, `nav` (with `aria-label`), `main`, `footer`.
- Every page uses `<BaseLayout>` so these are guaranteed present.
- Logo `<img>` has descriptive `alt` text, `<a>` parent has `aria-label`
  identifying it as the home link.
- Colour contrast: text on background and accent-on-white meet WCAG AA.
- Donate button uses sufficient contrast and is identified by text, not
  just colour.

## Donate prominence

The donate CTA appears in the header on every page (right-hand side, brand
purple) so it is reachable from any page in one click. The button currently
links to `/donate`; the page itself hosts the JustGiving CTA. See
[donations.md](donations.md).

## Open design questions

1. **Logo SVG** — `public/brand/logo.jpg` is the legacy raster asset (~670 KB,
   CMYK-encoded). Replace with an SVG when the trust provides one. See
   `brand.md`.
2. **Self-host fonts** — Montserrat is currently loaded from Google Fonts.
   Self-hosting would be faster and more privacy-friendly, but takes a
   little more setup. Tracked in `todos.md`.
