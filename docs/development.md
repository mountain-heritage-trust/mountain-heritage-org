# Local development

## Prerequisites

- Node.js **22.12 or later** (Astro 6 requires it; 24.x works too; check `package.json` `engines`).
- npm 10+ (ships with recent Node).
- Git.

No other system tools are required for local development. Production deploy uses Cloudflare Pages (see [deployment.md](deployment.md) once written).

## First time setup

```sh
git clone <repo-url>
cd mountain-heritage-org
npm install
```

## Day-to-day commands

| Command          | What it does                                                |
| ---------------- | ----------------------------------------------------------- |
| `npm run dev`    | Start the Astro dev server with hot reload at `localhost:4321`. |
| `npm run build`  | Build the production static site into `dist/`.              |
| `npm run preview`| Serve `dist/` locally to sanity-check the production build. |
| `npm run check`  | Type-check the project (Astro components and TS).           |

## Repository layout

See [architecture.md](architecture.md) for the full picture. In short:

- `src/pages/` — routes. A file at `src/pages/about/about-us.astro` becomes `/about/about-us`.
- `src/content/` — markdown content collections (blog posts, team, etc.). Defined per Astro's content collections API.
- `src/layouts/` — shared page layouts (header, footer, meta).
- `src/components/` — reusable Astro components.
- `public/` — static files served as-is. `public/admin/` will host the Sveltia CMS bundle. `public/_redirects` controls Cloudflare Pages redirects.
- `functions/` — Cloudflare Pages Functions (e.g., contact form handler).
- `_audit/` — gitignored mirror of the existing site, for content migration reference.
- `dist/` — build output. Do not commit.

## Adding a new page

For one-off pages, add an `.astro` file under `src/pages/`. The path becomes the URL.

For content-collection-backed pages (blog posts, team profiles, etc.), add a markdown file under `src/content/<collection>/` — see `docs/content.md` *(to be added)* for the schema and conventions.

## URL preservation

If a route would change relative to the existing site, add the redirect to `public/_redirects` in the same change. See [migration.md](migration.md).

## Code style

- Astro components and frontmatter use TypeScript with strict mode (`tsconfig.json` extends `astro/tsconfigs/strict`).
- Run `npm run check` before pushing if you've changed component types or content collection schemas.

## Troubleshooting

- **Build is empty / no pages found** — ensure files in `src/pages/` end in `.astro`, `.md`, or `.mdx`.
- **Content collection errors** — Astro re-generates types on `dev`/`build`; if types feel stale, delete `.astro/` and rerun.
- **Dev server stuck on stale content** — kill it and restart; HMR doesn't always pick up new files in `src/content/`.
