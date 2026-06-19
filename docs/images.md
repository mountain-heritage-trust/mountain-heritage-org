# Images

How image assets are stored, sized, and served. The goals are small page
weight for visitors and a repo that doesn't grow without bound as trustees
upload photos through `/admin`.

## Where images live

| Path | What |
| --- | --- |
| `public/uploads/` | Originals. Trustee uploads land here (Sveltia `media_folder`), served at `/uploads/<file>`. |
| `public/uploads/optimised/` | Generated AVIF + WebP variants at 640px and 1280px, plus `manifest.json`. Committed to git. |
| `public/brand/` | Hand-curated brand/partner logos used by components (e.g. the footer). |

## How images are served

`src/components/Image.astro` renders a `<picture>` with AVIF and WebP `srcset`
sources from `optimised/`, falling back to the original `<img src>`. It reads
intrinsic width/height from `manifest.json` to prevent layout shift. Use it for
any structured image (covers, photos):

```astro
<Image src="/uploads/foo.jpg" alt="…" sizes="(max-width: 768px) 100vw, 1280px" />
```

**Inline markdown images** (e.g. images dropped into a blog body) are *not*
routed through this component — they render as a plain `<img>` to the original.
That's the main reason originals are kept to a sane size (below).

## Two-part optimisation

### 1. Originals are capped — `scripts/downsize-originals.mjs`

Originals are downsized **in place** to a max of **2048px** on the longest edge
and re-encoded at **JPEG quality 82** (PNGs recompressed). Filenames are
preserved, so **no URLs change**. The script:

- only touches `*.jpg/*.jpeg/*.png` directly under `public/uploads` (never the
  generated `optimised/` variants);
- bakes in EXIF orientation, then drops metadata;
- only rewrites a file when the result is ≥2% smaller, so it is **idempotent**
  (re-running causes no further changes / no git churn);
- never enlarges.

Visitors never see more than the 1280px variant, so 2048px leaves ample buffer.
The one-time pass over the migrated content cut `public/uploads` from ~255 MB to
~117 MB.

> Full-resolution originals remain recoverable from git history — this is a
> forward re-encode, not a history rewrite. The repo is a **delivery** store,
> not an archival master copy.

### 2. Variants are generated — `scripts/optimise-images.mjs`

Generates the 640/1280px AVIF + WebP variants and `manifest.json`. Idempotent
(skips variants newer than their source). Output is committed so Cloudflare's
build doesn't need to run `sharp`.

Run both together:

```bash
npm run images
```

## Compress on ingest (automation)

Trustees upload through `/admin`, which commits straight to `main` via the
GitHub API — so optimisation can't run as a local git hook. It runs in CI
instead (see [deployment.md](deployment.md) for the deploy model):

- **Trustee `[cms]` uploads** → `.github/workflows/deploy-production.yml` runs
  `npm run images`, commits the optimised result back to `main`, then tags and
  deploys production. Prod is optimised on the first deploy.
- **Developer pushes** that touch `public/uploads/**` →
  `.github/workflows/optimise-images.yml` runs `npm run images` and commits the
  result back (staging rebuilds via Cloudflare).

Both commit back with a `[skip-optimise]` marker so they don't re-trigger the
optimiser. If you add images locally as a developer, run `npm run images`
before pushing so the variants exist immediately (CI will also catch it).

## Adjusting the policy

- Size cap / quality: `MAX_EDGE` and `JPEG_QUALITY` in
  `scripts/downsize-originals.mjs`.
- Variant widths / formats / quality: `WIDTHS` and `FORMATS` in
  `scripts/optimise-images.mjs`.

Changing these and running `npm run images` re-processes everything. Because the
downsizer only shrinks, *raising* the cap won't restore detail already removed —
recover the original from git history first if you need to go back up.
