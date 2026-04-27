#!/usr/bin/env node
// Pre-generate AVIF and WebP variants of every image in public/uploads/.
//
// Output goes to public/uploads/optimised/<base>-<width>.<ext>. The
// matching <Image> Astro component picks these up via filename
// convention and emits a <picture> with srcset.
//
// Idempotent: variants whose mtime is newer than the source are skipped.
// A small manifest.json captures the source dimensions so the component
// can emit width/height on the fallback <img> for CLS prevention.
//
// Usage: node scripts/optimise-images.mjs
//
// We commit the output to git so Cloudflare's build doesn't need to
// run sharp at deploy time.

import { readdirSync, statSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join, parse } from 'node:path';
import sharp from 'sharp';

const ROOT = process.cwd();
const SRC = join(ROOT, 'public/uploads');
const OUT = join(ROOT, 'public/uploads/optimised');
const MANIFEST = join(OUT, 'manifest.json');

const WIDTHS = [640, 1280];
const FORMATS = [
  { ext: 'avif', encoder: (w) => ({ avif: { quality: 55, effort: 4 } }) },
  { ext: 'webp', encoder: (w) => ({ webp: { quality: 78 } }) },
];

mkdirSync(OUT, { recursive: true });

const manifest = {};
const files = readdirSync(SRC)
  .filter((f) => /\.(jpe?g|png)$/i.test(f))
  .filter((f) => !f.startsWith('.'));

console.log(`Optimising ${files.length} source images…`);

let made = 0;
let skipped = 0;
let errors = 0;

for (const file of files) {
  const srcPath = join(SRC, file);
  const srcStat = statSync(srcPath);
  const { name } = parse(file);

  // Read intrinsic size once per file
  let width;
  let height;
  try {
    const meta = await sharp(srcPath).metadata();
    width = meta.width ?? 0;
    height = meta.height ?? 0;
    manifest[file] = { width, height };
  } catch (err) {
    console.error(`  ! ${file}: metadata failed: ${err.message}`);
    errors++;
    continue;
  }

  for (const targetWidth of WIDTHS) {
    // Don't enlarge: only create a variant whose width <= source width.
    const effectiveWidth = Math.min(targetWidth, width);

    for (const fmt of FORMATS) {
      const outName = `${name}-${targetWidth}.${fmt.ext}`;
      const outPath = join(OUT, outName);

      if (existsSync(outPath) && statSync(outPath).mtimeMs >= srcStat.mtimeMs) {
        skipped++;
        continue;
      }

      try {
        await sharp(srcPath)
          .resize({ width: effectiveWidth, withoutEnlargement: true })
          .toFormat(fmt.ext, fmt.encoder(effectiveWidth)[fmt.ext])
          .toFile(outPath);
        made++;
      } catch (err) {
        console.error(`  ! ${outName}: ${err.message}`);
        errors++;
      }
    }
  }

  if ((made + skipped) % 100 === 0 && (made + skipped) > 0) {
    console.log(`  …${made} new, ${skipped} cached`);
  }
}

writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2) + '\n');

console.log(`\nDone. Generated: ${made}, cached: ${skipped}, errors: ${errors}.`);
console.log(`Manifest written to ${MANIFEST}.`);
