# Content migration & URL preservation

## Source

The existing site is at https://www.mountain-heritage.org/. Its sitemap (`/sitemap.xml`) lists 225 URLs and `robots.txt` permits crawling. The site is built on **Webflow** — confirmed by the `cdn.prod.website-files.com` CDN and Webflow-specific class names in the HTML (e.g., `w-dyn-bind-empty`, `atomic-page-heading`).

A complete HTML mirror has been produced into `_audit/www.mountain-heritage.org/` (gitignored, ~5.1 MB across 239 HTML files):

- `_audit/urls.txt` — sitemap URL inventory (225 URLs).
- `_audit/asset-urls.txt` — 443 unique image URLs harvested from the HTML. These point at Webflow's CDN; download via this list rather than re-crawling.
- `_audit/wget.log` — crawl log (39 errors, all from malformed image references in old exhibition pages — not a real problem).

Images were not mirrored: Webflow serves them off-domain, and wget did not follow off-host links. Use `asset-urls.txt` to fetch what we want to keep.

## URL inventory by category

| Category               | Count | URL pattern                              | Notes                                                                 |
| ---------------------- | ----: | ---------------------------------------- | --------------------------------------------------------------------- |
| Blog posts             |   176 | `/blog/<slug>`                           | Landing page lives at `/news-blog`.                                   |
| Team / trustees        |    24 | `/team/<slug>`                           | Linked from `/about/trustees-staff-patrons-and-advisors`.             |
| Archive collections    |     7 | `/collections/<slug>`                    | Landing page at `/collections`. Astro-naming clash — see below.       |
| Exhibitions            |     4 | `/exhibitions/<slug>`                    | Landing page at `/events-exhibitions`.                                |
| About                  |     4 | `/about/<slug>`                          | `about-us`, `accessions`, `annual-report`, `trustees-staff-...`.      |
| Standalone pages       |    ~9 | various                                  | `/`, `/contact`, `/donate`, `/news-blog`, `/events-exhibitions`, `/collections`, `/man-mountain-learning-resources`, `/supporters`, `/privacy-notice`, `/terms-of-use`. |
| Misc (likely drop)     |     1 | `/style-guide`                           | Old site's design reference — confirm before dropping.                |

## Proposed content model in Astro

| Content type     | Astro collection name | Output URL              | Source files                       |
| ---------------- | --------------------- | ----------------------- | ---------------------------------- |
| Blog posts       | `blog`                | `/blog/<slug>`          | `src/content/blog/<slug>.md`       |
| Team profiles    | `team`                | `/team/<slug>`          | `src/content/team/<slug>.md`       |
| Archive items    | `archive`             | `/collections/<slug>`   | `src/content/archive/<slug>.md`    |
| Exhibitions      | `exhibitions`         | `/exhibitions/<slug>`   | `src/content/exhibitions/<slug>.md`|
| About sections   | `about`               | `/about/<slug>`         | `src/content/about/<slug>.md`      |
| Standalone pages | n/a (Astro pages)     | as-is                   | `src/pages/*.astro`                |

### Naming note: `collections` clash

Astro's own term for content collections clashes with the existing URL prefix `/collections/`. The fix:

- Internally name the Astro collection `archive` (or similar).
- Keep the public URL `/collections/<slug>` by routing via `src/pages/collections/[slug].astro`.

This isolates the clash to one indirection and keeps the public URLs untouched.

### Inconsistent landing-page URLs

The old site uses:

- `/news-blog` as the index for `/blog/<slug>` posts.
- `/events-exhibitions` as the index for `/exhibitions/<slug>`.
- `/collections` as the index for `/collections/<slug>`.

Mismatched parent/child URL pairs are preserved as-is (URL preservation rule). In Astro these become explicit `src/pages/news-blog.astro`, `src/pages/events-exhibitions.astro`, etc., not auto-generated indexes.

## Frontmatter schemas

Finalised in `src/content.config.ts`. See [content.md](content.md) for the full per-collection schema, examples and the rules for adding new entries or fields.

## Redirect strategy

- All URLs in `_audit/urls.txt` should be reachable on the new site at the same path.
- Where a route changes (none planned currently), an entry goes in `public/_redirects`.
- After deploy, re-crawl with the same tooling and compare URL lists to catch anything dropped accidentally.

## Migration outcome

The bulk migration (Task #5) is complete. Coverage:

| Source                      | Migrated | Notes                                                          |
| --------------------------- | -------: | -------------------------------------------------------------- |
| Blog posts                  |  176/176 | Full title, date, summary (derived), cover, body in markdown.  |
| Team profiles               |    24/24 | 3 missing from the wget mirror were fetched directly.          |
| Archive collections         |      6/6 | Title, summary, body. Sitemap counted 7 (the index page).      |
| Exhibitions                 |      4/4 | Title, summary, body. `startDate`/`endDate`/`venue` are TODOs. |
| About pages                 |      4/4 | `/about/regional-advocacy` removed (stub on old site).         |
| Standalone pages (`.astro`) |      6/6 | privacy-notice, terms-of-use, supporters, learning-resources, contact, donate. |
| Listing pages               |      3/3 | news-blog, events-exhibitions, collections.                    |
| Style guide                 |      0/1 | Removed — `/style-guide` was an internal design ref on the old site. |

**Result: 225/225 sitemap URLs build.** `/style-guide` (an internal design reference on the old site) is removed and 404s — it was never a public-facing page. `/about/regional-advocacy` (a stub linked from the old nav) is removed but redirects to `/about/about-us` in `public/_redirects` in case of stray inbound links.

## Migration scripts

Two one-shot scripts under `scripts/`:

- `scripts/migrate.mjs` — converts Webflow HTML to markdown content collection entries (`blog`, `team`, `exhibitions`, `archive`, `about`). Run with `node scripts/migrate.mjs [collection]`.
- `scripts/extract-standalone.mjs` — converts standalone Webflow pages (privacy, terms, supporters, learning-resources, contact, donate) to bespoke `.astro` files. Run with `node scripts/extract-standalone.mjs`.

These scripts are idempotent — re-running rewrites the same files from the same source. Once the trustees start editing in the CMS, do NOT re-run the migration scripts (they will overwrite trustee edits).

## Known TODOs from migration

Marked inline in the migrated files:

- **About pages** — content is thin because the Webflow layouts were bespoke. Each `src/content/about/*.md` has a `# TODO` to review and rewrite via CMS.
- **Exhibitions** — `startDate`, `endDate`, `venue`, `status` were not auto-extractable. Each `src/content/exhibitions/*.md` has a `# TODO` to fill these in.
- **Asset rehosting** — image URLs still point to Webflow's CDN. We need to download the ones we want to keep into `src/assets/` (or `public/`) before the old Webflow site is taken down. See `_audit/asset-urls.txt` (443 unique URLs).
- **PDFs and other downloads** — not yet inventoried; check the standalone pages before launch.

## Assets

The mirror is HTML-only. Image URLs are catalogued in `_audit/asset-urls.txt` (443 unique URLs, all on Webflow's CDN). Migration plan:

- Triage the asset list; we are unlikely to want all 443. Webflow generates per-breakpoint variants of each source image, which inflates the count.
- For each image we keep, download from the Webflow CDN and place under `src/assets/` (so Astro handles optimisation and responsive variants) or `public/` for untouched copies.
- Look out for PDFs linked from blog posts — they may also be on the Webflow CDN and need rehosting.

## Content extraction notes

Webflow HTML wraps body content in CMS-bound divs (e.g., `class="content-sec"`, `class="rich-text"`). The H1 is reliably tagged as `<h1>`. Publish dates are not in standard meta tags — they appear inside the page body. Plan for the migration:

- Extract title from `<h1>`.
- Extract body from the main `.rich-text` (or equivalent) container, then convert HTML → Markdown (e.g., with `turndown`).
- Extract publish date from the visible date string in each post (consistent location per template).
- For team profiles, extract name (H1), role and bio (body).
- For exhibitions, extract title, dates, venue and body.

## Open questions for the trustee team

1. Is `/style-guide` content we want to keep, or an artefact of the old platform?
2. The old site lists "team" entries that include trustees, staff, patrons and advisors. Should they remain in a single collection with a `category` field, or split into separate collections?
3. Are any blog posts no longer wanted? (176 is a lot — a quick triage may be worthwhile.)
4. Donation provider — Donorbox, Stripe Payment Link, or CAF Donate? CAF gets us Gift Aid handling out of the box.
