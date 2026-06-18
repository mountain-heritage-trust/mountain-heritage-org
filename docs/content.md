# Content collections

Astro's content collections power the site's structured content. Each collection is a directory of markdown files under `src/content/`, with a schema enforcing frontmatter shape. Schemas live in `src/content.config.ts`. Dynamic routes that render entries live under `src/pages/<collection>/[slug].astro`.

## Collections

| Astro name     | Path                       | URL pattern             | Purpose                          |
| -------------- | -------------------------- | ----------------------- | -------------------------------- |
| `blog`         | `src/content/blog/`        | `/blog/<slug>`          | News & blog posts.               |
| `team`         | `src/content/team/`        | `/team/<slug>`          | Trustees, staff, patrons.        |
| `archive`      | `src/content/archive/`     | `/collections/<slug>`   | Archive collection items.        |
| `exhibitions`  | `src/content/exhibitions/` | `/exhibitions/<slug>`   | Exhibitions and events.          |
| `about`        | `src/content/about/`       | `/about/<slug>`         | About-section pages.             |
| `partners`     | `src/content/partners/`    | `/partners/<slug>`      | Supporters & partners.           |

The Astro collection is named `archive` to avoid clashing with Astro's own term "content collection". Public URLs still live under `/collections/`. See [migration.md](migration.md).

## Schemas

### blog

```yaml
---
title: 1922 Olympic medal on Everest
date: 2019-03-08
summary: A short standfirst that appears on listing pages and as the meta description.
cover: ../../assets/blog/1922-medal.jpg   # optional
author: Jane Climber                       # optional
tags: [history, everest]                   # optional
draft: false                               # optional, defaults to false
hideFromHome: false                        # optional, defaults to false
---

Body in markdown...
```

`hideFromHome: true` keeps a post in the blog listing, tag pages and RSS but
removes it from the home page's "Latest news" list — for older news that has
gone stale but is worth keeping for the historic record. `draft: true` hides
it from the public site entirely.

### team

```yaml
---
name: Sir Chris Bonington
role: Patron
category: patron        # trustee | staff | patron | ambassador | advisor | volunteer
order: 1                # optional; for explicit ordering on listing pages
photo: ../../assets/team/chris-bonington.jpg
---

Bio in markdown...
```

### partners (URL: `/partners/<slug>`)

Supporters and partners shown beneath the team gallery on the About us page.
Each entry renders as a clickable logo + name card linking to its detail page.

```yaml
---
name: British Mountaineering Council
logo: /uploads/bmc-logo.jpg          # logo on a transparent / white background
url: https://www.thebmc.co.uk/       # optional link to their own website
summary: One line shown under the name.   # optional
order: 1                             # optional; lower numbers show first
---

Detail in markdown...
```

The gallery only appears on About us pages with `showTeam: true`. Logos are
rendered as plain `<img>` (no image optimisation), so any uploaded logo works
immediately.

### archive (URL: `/collections/<slug>`)

```yaml
---
title: Chris Bonington Papers
summary: Personal papers, photographs and correspondence...
cover: ../../assets/archive/cb-papers.jpg
order: 2
---

Body in markdown...
```

### exhibitions

```yaml
---
title: Man & Mountain — The Life of Chris Bonington
startDate: 2024-04-01      # optional
endDate: 2024-09-30        # optional
venue: Keswick Museum      # optional
status: past               # optional: upcoming | current | past
summary: ...
cover: ...
---

Body in markdown...
```

### about

```yaml
---
title: About us
order: 1
summary: Optional standfirst.
showTeam: true            # render the team gallery beneath the body
annualReports:            # optional list of downloadable report PDFs
  - { year: 2024, file: /uploads/annual-reports/mht-annual-report-2024.pdf }
  - { year: 2023, file: /uploads/annual-reports/mht-annual-report-2023.pdf }
---

Body in markdown...
```

`annualReports` renders a download section beneath the body (newest year
first, regardless of list order). It is currently used only on the About us
page. Trustees can add a year via the CMS "Annual reports" field, uploading the
PDF directly. Report PDFs live in `public/uploads/annual-reports/`.

## Adding a new entry

1. Create a markdown file at `src/content/<collection>/<slug>.md`.
2. Fill in the frontmatter according to the schema.
3. Write the body in markdown.
4. Run `npm run check` to validate frontmatter.
5. Run `npm run dev` to preview.

The slug is the filename. To preserve old URLs, match the slug to the existing path (e.g., `/blog/1922-olympic-medal-on-everest` → `src/content/blog/1922-olympic-medal-on-everest.md`).

## Adding a new field to an existing collection

1. Add the field to the relevant `defineCollection` schema in `src/content.config.ts`.
2. If the field should be rendered on the page, update `src/pages/<collection>/[slug].astro`.
3. If trustees should edit it, expose it in the Sveltia CMS config (see `docs/cms.md` once written).
4. Run `npm run check`.

## Adding a new collection

1. Add a `defineCollection` block to `src/content.config.ts` and export it under `collections`.
2. Create the directory `src/content/<collection>/`.
3. Create `src/pages/<collection>/[slug].astro` to render entries (and any listing/index pages).
4. Add Sveltia CMS config so trustees can edit (later).

## Notes

- We import zod via `import * as z from 'zod';` (zod is an explicit dep). The legacy `import { z } from 'astro:content'` is deprecated in Astro 6.
- `cover` and `photo` are typed as `string` for now. When the asset migration is complete we may switch to Astro's `image()` helper for typed image references and built-in optimisation.
- All collections use Astro's content layer (`glob` loader). No legacy `src/content/config.ts` location.
