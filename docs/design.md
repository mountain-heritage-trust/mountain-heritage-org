# Design system

The site uses plain CSS with custom properties for tokens. No CSS framework. The aim is a clean, accessible baseline that another developer can read and modify without learning a framework's conventions.

## Tokens

Defined in `src/styles/global.css` on `:root`. Change them there and every component picks up the new values.

| Token                   | Value     | Used for                                  |
| ----------------------- | --------- | ----------------------------------------- |
| `--color-bg`            | `#fafaf7` | Page background (warm off-white).         |
| `--color-surface`       | `#ffffff` | Header background, raised surfaces.       |
| `--color-text`          | `#1f1f1f` | Primary text.                             |
| `--color-muted`         | `#5a5a5a` | Secondary text.                           |
| `--color-accent`        | `#1f4068` | Links, focus rings (deep blue).           |
| `--color-accent-hover`  | `#16304d` | Link hover.                               |
| `--color-donate`        | `#c2410c` | Donate button (warm rust).                |
| `--color-donate-hover`  | `#9a330a` | Donate button hover.                      |
| `--color-border`        | `#e5e5e0` | Hairlines, dividers.                      |
| `--color-footer-*`      | various   | Dark footer.                              |
| `--font-body`           | system    | Body copy. System stack — fast, familiar. |
| `--font-heading`        | Georgia   | Headings. Serif evokes archive/heritage.  |
| `--max-width`           | `72rem`   | Page-frame width (~1152px).               |
| `--content-width`       | `42rem`   | Long-form content width (~672px).         |
| `--radius`              | `0.25rem` | Rounded corners.                          |

## Component conventions

- One component per file under `src/components/`.
- Layouts under `src/layouts/`. Pages compose a layout + content.
- Component-level styles live alongside the component if they're component-specific. Global rules (resets, layout primitives, typography) live in `global.css`.
- All interactive elements must show a visible focus ring (`:focus-visible`).

## Accessibility baseline

- Skip-to-main-content link in `BaseLayout`.
- Semantic landmarks: `header`, `nav` (with `aria-label`), `main`, `footer`.
- Every page uses `<BaseLayout>` so these are guaranteed present.
- Colour contrast: text on background and accent-on-white meet WCAG AA.
- Donate button uses sufficient contrast and is identified by text, not just colour.

## Donate prominence

The donate CTA appears in the header on every page (right-hand side, contrasting colour) so it is reachable from any page in one click. The button currently links to `/donate`; the page itself will host the donation provider's embed/link once chosen.

## Open design questions

1. **Brand colours** — placeholders chosen above (deep blue accent, rust donate button) are reasonable but not researched. If MHT has brand guidelines, swap the tokens to match.
2. **Logo** — the old site uses a wordmark image (`mht-logo.jpg`). For now we render the trust name as text in the heading font. Replace with the logo image once we have a clean SVG or high-resolution source.
3. **Typography** — Georgia for headings is a placeholder. A custom serif (e.g., self-hosted via `@font-face`) would feel more distinctive without adding cost.
