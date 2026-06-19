#!/usr/bin/env node
// Downsize original images in public/uploads/ to a sane web-delivery size,
// in place, preserving the filename (and therefore the URL).
//
// Why: even though <Image> serves AVIF/WebP variants (see
// scripts/optimise-images.mjs), the originals are still (a) the <picture>
// fallback, (b) what inline markdown images load directly, and (c) committed
// to git. Some came off the old site at up to ~7900px / 4 MB. Users never see
// more than 1280px, so we cap originals at 2048px and re-encode at quality 82.
//
// Safe by construction:
//   - Only touches *.jpg/*.jpeg/*.png directly under public/uploads (never the
//     generated public/uploads/optimised/ variants).
//   - Bakes in EXIF orientation before resizing, then drops metadata.
//   - Only rewrites a file when the result is at least 2% smaller, so it is
//     idempotent — re-running produces no further changes (no git churn).
//   - Never enlarges. Filenames are preserved, so no URLs change.
//
// Full-resolution originals remain recoverable from git history; this is a
// forward commit, not a history rewrite.
//
// Usage:
//   node scripts/downsize-originals.mjs            # rewrite in place
//   node scripts/downsize-originals.mjs --dry-run  # report only, no writes

import { readdirSync, statSync, writeFileSync } from 'node:fs';
import { join, parse } from 'node:path';
import sharp from 'sharp';

const ROOT = process.cwd();
const SRC = join(ROOT, 'public/uploads');

const MAX_EDGE = 2048;
const JPEG_QUALITY = 82;
const MIN_SAVING = 0.02; // only rewrite if >=2% smaller
// Only *attempt* a file when it is genuinely oversized: larger than MAX_EDGE,
// or heavier than this ceiling. This is what makes the pass idempotent — files
// already within spec are left untouched, so lossy re-encoding never runs
// repeatedly on the same image (which would slowly degrade it). Our own output
// (≤MAX_EDGE at q82) reliably lands well under this ceiling, so a processed
// file won't qualify on the next run.
const BYTE_CEILING = 1_000_000;

const dryRun = process.argv.includes('--dry-run');

const files = readdirSync(SRC)
  .filter((f) => /\.(jpe?g|png)$/i.test(f))
  .filter((f) => !f.startsWith('.'));

const fmt = (n) => `${(n / 1024 / 1024).toFixed(2)} MB`;

let before = 0;
let after = 0;
let rewritten = 0;
let skipped = 0;
let errors = 0;

console.log(
  `${dryRun ? '[dry run] ' : ''}Scanning ${files.length} originals (cap ${MAX_EDGE}px, q${JPEG_QUALITY})…`,
);

for (const file of files) {
  const srcPath = join(SRC, file);
  const origBytes = statSync(srcPath).size;
  before += origBytes;

  try {
    const isPng = /\.png$/i.test(file);

    // Gate: skip files already within spec so re-encoding never runs twice on
    // the same image (idempotency / no cumulative quality loss).
    const meta = await sharp(srcPath).metadata();
    const longestEdge = Math.max(meta.width ?? 0, meta.height ?? 0);
    if (longestEdge <= MAX_EDGE && origBytes <= BYTE_CEILING) {
      after += origBytes;
      skipped++;
      continue;
    }

    const pipeline = sharp(srcPath)
      .rotate() // bake EXIF orientation before resizing
      .resize({ width: MAX_EDGE, height: MAX_EDGE, fit: 'inside', withoutEnlargement: true });

    const buf = isPng
      ? await pipeline.png({ compressionLevel: 9, palette: true }).toBuffer()
      : await pipeline.jpeg({ quality: JPEG_QUALITY, mozjpeg: true }).toBuffer();

    const saving = 1 - buf.length / origBytes;
    if (saving >= MIN_SAVING) {
      after += buf.length;
      rewritten++;
      if (origBytes - buf.length > 256 * 1024) {
        console.log(`  ↓ ${file}: ${fmt(origBytes)} → ${fmt(buf.length)} (-${Math.round(saving * 100)}%)`);
      }
      if (!dryRun) writeFileSync(srcPath, buf);
    } else {
      after += origBytes;
      skipped++;
    }
  } catch (err) {
    after += origBytes;
    errors++;
    console.error(`  ! ${file}: ${err.message}`);
  }
}

console.log(
  `\n${dryRun ? '[dry run] ' : ''}Rewrote ${rewritten}, skipped ${skipped}, errors ${errors}.`,
);
console.log(`Total: ${fmt(before)} → ${fmt(after)} (saved ${fmt(before - after)}).`);
if (dryRun) console.log('No files were modified.');
