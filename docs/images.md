# Images

How image assets are stored, sized, and served. The goals are small page
weight for visitors and a repo that doesn't grow without bound as trustees
upload photos through `/admin`.

## Where images live

| Path | What |
| --- | --- |
| `public/uploads/` | Originals. Trustee uploads land here (Sveltia `media_folder`), served at `/uploads/<file>`. |
| `public/variants/` | Generated AVIF + WebP variants at 640px and 1280px, plus `manifest.json`. Committed to git. Kept outside the CMS media folder so trustees only see originals; `/uploads/optimised/*` redirects here. |
| `src/content/images/` | One YAML record per original: caption, alt, date, credit, notes, plus generated dimensions and versions. See [Image records](#image-records). |
| `public/brand/` | Hand-curated brand/partner logos used by components (e.g. the footer). |

## How images are served

`src/components/Image.astro` renders a `<picture>` with AVIF and WebP `srcset`
sources from `public/variants/`, falling back to the original `<img src>`. It reads
intrinsic width/height from `manifest.json` to prevent layout shift. Use it for
any structured image (covers, photos):

```astro
<Image src="/uploads/foo.jpg" alt="…" sizes="(max-width: 768px) 100vw, 1280px" />
```

Omit `alt` to use the image record's alt text; pass `alt=""` for a
decorative image (card thumbnails, the home hero). Add `caption` to wrap
the image in a `<figure>` with the record's caption, date and credit (see
[Captions](#captions)).

**Inline markdown images** (e.g. images dropped into a blog body) are *not*
routed through this component — they render as a plain `<img>` to the original
(with alt text and a caption added from the record, see [Captions](#captions)).
That's the main reason originals are kept to a sane size (below).

**Filenames** are percent-encoded by the component before being written into
URLs — spaces and commas are invalid inside `srcset` (comma separates
candidates, space separates a URL from its width descriptor) and silently
break the whole `<picture>`. As a second line of defence, the CMS slugifies
filenames on upload (`slugify_filename` in `public/admin/config.yml`), so new
uploads get clean names like `my-photo.png` in the first place.

## Two-part optimisation

### 1. Originals are capped — `scripts/downsize-originals.mjs`

Originals are downsized **in place** to a max of **2048px** on the longest edge
and re-encoded at **JPEG quality 82** (PNGs recompressed). Filenames are
preserved, so **no URLs change**. The script:

- only touches `*.jpg/*.jpeg/*.png` directly under `public/uploads` (never the
  generated `public/variants/`);
- bakes in EXIF orientation, then drops metadata;
- only *attempts* a file that is genuinely oversized — longest edge > 2048px or
  heavier than ~1 MB — and only rewrites when the result is ≥2% smaller. Files
  already within spec are left untouched, so it is **idempotent**: lossy
  re-encoding never runs twice on the same image (no cumulative quality loss, no
  git churn). This matters because the optimiser runs on every ingest in CI.
- never enlarges.

Visitors never see more than the 1280px variant, so 2048px leaves ample buffer.
The one-time pass over the migrated content cut `public/uploads` from ~255 MB to
~117 MB.

> Full-resolution originals remain recoverable from git history — this is a
> forward re-encode, not a history rewrite. The repo is a **delivery** store,
> not an archival master copy.

### 2. Variants are generated — `scripts/optimise-images.mjs`

Generates the 640/1280px AVIF + WebP variants in `public/variants/` and `manifest.json`. Idempotent
(skips variants newer than their source). Output is committed so Cloudflare's
build doesn't need to run `sharp`.

### 3. Records are kept in step — `scripts/image-records.mjs`

Creates, refreshes or deletes the image records. See below.

Run all three together:

```bash
npm run images
```

## Compress on ingest (automation)

Trustees upload through `/admin`, which commits straight to `main` via the
GitHub API — so optimisation can't run as a local git hook. It runs in CI
instead (see [deployment.md](deployment.md) for the deploy model):

- **Trustee `[cms]` uploads** → `.github/workflows/deploy-production.yml` runs
  `npm run images`, commits the optimised result (and new image records) back to `main`, then tags and
  deploys production. Prod is optimised on the first deploy.
- **Developer pushes** that touch `public/uploads/**` →
  `.github/workflows/optimise-images.yml` runs `npm run images` and commits the
  result back (staging rebuilds via Cloudflare).

Both commit back with a `[skip-optimise]` marker so they don't re-trigger the
optimiser. If you add images locally as a developer, run `npm run images`
before pushing so the variants exist immediately (CI will also catch it).

## Image records

Each original in `public/uploads/` has a record at
`src/content/images/<id>.yml`, where `<id>` is the filename slugified with
any migrated Webflow asset-id prefix removed. Trustees edit records in the
CMS **Image library** (see [cms.md](cms.md#image-library)).

| Field | Who writes it | Shown publicly |
| --- | --- | --- |
| `image` | script | — |
| `caption` | trustee | yes: under the image and on `/images/<id>` |
| `alt` | trustee | as alt text, when the page gives none |
| `date` | trustee (free text: "c. 1953") | yes |
| `credit` | trustee | yes |
| `notes` | trustee | no |
| `suggestedCredit` | script, once, on creation | no |
| `width`, `height`, `versions` | script, every run | `versions` on `/images/<id>` |

`scripts/image-records.mjs`:

- creates a record for any new original, guessing `suggestedCredit` from
  the filename (`CBPL`, `©…`, `photo by …`, `courtesy of …`,
  `… Collection`). It never writes `credit` itself; a trustee copies a
  checked suggestion across.
- refreshes only the script-owned fields on existing records, so trustee
  edits are never overwritten.
- deletes records whose original has gone.
- only writes files that change, so re-runs are a no-op.

It runs as part of `npm run images`, so CI creates records for trustee
uploads in the same commit-back as the variants (see below).

### Captions

Captions show only where they help: article covers (`<Image caption>` on
blog, exhibition, collection, shop and contact pages) and markdown body
images on a line of their own (`src/lib/image-captions.ts`). Cards,
thumbnails, team photos and logos stay uncaptioned. A caption shows the
caption text, then "date · credit", then an **Image details** link. Both
code paths use `captionLine()` in `src/lib/caption-line.ts`, so they
match.

### Image pages

`src/pages/images/[id].astro` renders a page per record: the picture,
date, credit, every page it appears on (`getImageUsage()` in
`src/lib/images.ts`, from frontmatter images and `](/uploads/…)` in
bodies), the versions table and a copyright note. Pages for records with
no caption, date or credit are `noindex` and left out of the sitemap.

## Adjusting the policy

- Size cap / quality: `MAX_EDGE` and `JPEG_QUALITY` in
  `scripts/downsize-originals.mjs`.
- Variant widths / formats / quality: `WIDTHS` and `FORMATS` in
  `scripts/optimise-images.mjs`. Keep `WIDTHS` / `FORMATS` in
  `scripts/image-records.mjs` in step so the versions lists are right.

Changing these and running `npm run images` re-processes everything. Because the
downsizer only shrinks, *raising* the cap won't restore detail already removed —
recover the original from git history first if you need to go back up.
