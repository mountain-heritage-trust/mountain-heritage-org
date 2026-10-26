#!/usr/bin/env node
// Keep one image record per original in public/uploads/.
//
// Each record (src/content/images/<id>.yml) holds the details trustees
// add in the CMS — caption, alt text, date, credit, notes — plus fields
// this script owns: dimensions, file size and the list of generated
// versions in public/variants/. Run after optimise-images.mjs (as
// `npm run images` does) so the versions exist.
//
// - New upload → new record, with `suggestedCredit` guessed from the
//   filename where it clearly names a photographer or source.
// - Existing record → only the script-owned fields are refreshed; anything
//   a trustee typed is left alone.
// - Original deleted → its record is deleted.
//
// Only writes files whose content actually changes, so re-running is a
// no-op and CI commits stay quiet.
//
// Usage: node scripts/image-records.mjs

import { readdirSync, readFileSync, writeFileSync, statSync, existsSync, mkdirSync, unlinkSync } from 'node:fs';
import { join, parse } from 'node:path';
import { parse as parseYaml, stringify as stringifyYaml } from 'yaml';

const ROOT = process.cwd();
const UPLOADS = join(ROOT, 'public/uploads');
const VARIANTS = join(ROOT, 'public/variants');
const RECORDS = join(ROOT, 'src/content/images');
const MANIFEST = join(VARIANTS, 'manifest.json');

// Must match WIDTHS / FORMATS in optimise-images.mjs.
const WIDTHS = [640, 1280];
const FORMATS = ['avif', 'webp'];

const IMAGE_EXT = /\.(jpe?g|png|webp|gif|avif|svg)$/i;
const FORMAT_NAMES = { jpg: 'JPEG', jpeg: 'JPEG', png: 'PNG', webp: 'WebP', gif: 'GIF', avif: 'AVIF', svg: 'SVG' };

// Trustee-edited fields, in the order they appear in the file. Kept as-is.
const EDITABLE = ['caption', 'alt', 'date', 'credit', 'notes'];

mkdirSync(RECORDS, { recursive: true });
const manifest = existsSync(MANIFEST) ? JSON.parse(readFileSync(MANIFEST, 'utf8')) : {};

const humanSize = (bytes) =>
  bytes >= 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;

const slugify = (s) =>
  s
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 100)
    .replace(/-+$/, '');

// Turn a migrated Webflow filename back into words: drop the 24-hex asset
// id prefixes, decode the "-20" (space) / "-C2-A9" (©) escapes, and treat
// dashes and underscores as spaces.
function filenameWords(file) {
  return parse(file)
    .name.replace(/^([0-9a-f]{24}_)+/i, '')
    .replace(/-C2-A9/gi, ' © ')
    .replace(/-20/g, ' ')
    .replace(/[-_]+/g, ' ')
    .replace(/\s*\(\d+\)$/, '')
    .replace(/\b(min|small|crop|web)\b/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// A name-like run of words: starts with a capital, allows initials and
// lowercase joiners ("of", "the", "with").
const NAME = "([A-Z][\\w.'’]*(?:\\s+(?:[A-Z][\\w.'’]*|of|the|and|with|IBG))*)";

function suggestCredit(file) {
  const w = filenameWords(file);
  const rules = [
    [/\bCBPL\b/, () => 'Chris Bonington Picture Library'],
    [new RegExp(`(?:©|\\bcopyright)\\s*${NAME}`, 'i'), (m) => m[1]],
    [/\bcourtesy of (.+)$/i, (m) => `Courtesy of ${m[1]}`],
    [new RegExp(`\\bphoto(?:graph)?\\s+(?:by\\s+)?${NAME}`, 'i'), (m) => m[1]],
    [new RegExp(`\\bby\\s+${NAME}`), (m) => m[1]],
    [new RegExp(`\\ba\\s+${NAME}\\s+photo\\b`), (m) => m[1]],
    [/\b([A-Z]\w+(?:\s+[A-Z]\w+)?)\s+Collection\b/, (m) => `${m[1]} Collection`],
    [/\bRoyal Geographical Society(?: with IBG)?\b/, (m) => m[0]],
  ];
  for (const [re, fmt] of rules) {
    const m = w.match(re);
    if (!m) continue;
    // Trailing years and "query" (the old site's marker for an uncertain
    // credit) aren't part of the name.
    const credit = fmt(m).replace(/\s+(\d{4}|query)\b.*$/i, '').trim();
    if (/[A-Za-z]{2}/.test(credit)) return credit;
  }
  return null;
}

function versionsFor(file, width, height) {
  const { name, ext } = parse(file);
  const e = ext.slice(1).toLowerCase();
  const bytes = statSync(join(UPLOADS, file)).size;
  const versions = [
    {
      label: 'Original',
      format: FORMAT_NAMES[e] ?? e.toUpperCase(),
      ...(width ? { width, height } : {}),
      size: humanSize(bytes),
      url: `/uploads/${file}`,
    },
  ];
  for (const target of WIDTHS) {
    for (const fmt of FORMATS) {
      const out = `${name}-${target}.${fmt}`;
      const path = join(VARIANTS, out);
      if (!existsSync(path)) continue;
      const w = Math.min(target, width);
      versions.push({
        label: target === WIDTHS[0] ? 'Medium' : 'Large',
        format: FORMAT_NAMES[fmt],
        width: w,
        height: Math.round((height * w) / width),
        size: humanSize(statSync(path).size),
        url: `/variants/${out}`,
      });
    }
  }
  return versions;
}

// Existing records, keyed by the image they describe.
const byImage = new Map();
for (const f of readdirSync(RECORDS).filter((f) => f.endsWith('.yml'))) {
  const data = parseYaml(readFileSync(join(RECORDS, f), 'utf8')) ?? {};
  if (data.image) byImage.set(data.image, { id: parse(f).name, data });
  else byImage.set(`__orphan:${f}`, { id: parse(f).name, data });
}

const usedIds = new Set([...byImage.values()].map((r) => r.id));
const files = readdirSync(UPLOADS).filter((f) => IMAGE_EXT.test(f) && !f.startsWith('.'));
let created = 0;
let updated = 0;
let removed = 0;

for (const file of files) {
  const image = `/uploads/${file}`;
  let rec = byImage.get(image);
  byImage.delete(image);
  const isNew = !rec;

  if (isNew) {
    // Drop migrated Webflow asset-id prefixes so URLs read as words.
    let id = slugify(parse(file).name.replace(/^([0-9a-f]{24}_)+/i, '')) || 'image';
    if (usedIds.has(id)) id = `${id}-${parse(file).ext.slice(1).toLowerCase()}`;
    for (let n = 2; usedIds.has(id); n++) id = `${id.replace(/-\d+$/, '')}-${n}`;
    usedIds.add(id);
    rec = { id, data: { suggestedCredit: suggestCredit(file) } };
    created++;
  }

  const dims = manifest[file];
  const width = dims?.width ?? rec.data.width ?? null;
  const height = dims?.height ?? rec.data.height ?? null;

  const next = { image };
  for (const k of EDITABLE) next[k] = rec.data[k] ?? null;
  // Suggestions are written once (credit by this script on creation;
  // caption and date by a one-off review of filenames and page context)
  // and only ever read here.
  next.suggestedCaption = rec.data.suggestedCaption ?? null;
  next.suggestedDate = rec.data.suggestedDate ?? null;
  next.suggestionSource = rec.data.suggestionSource ?? null;
  next.suggestedCredit = rec.data.suggestedCredit ?? null;
  next.width = width;
  next.height = height;
  next.versions = versionsFor(file, width, height);

  const path = join(RECORDS, `${rec.id}.yml`);
  const out = stringifyYaml(next, { lineWidth: 0 });
  if (!existsSync(path) || readFileSync(path, 'utf8') !== out) {
    writeFileSync(path, out);
    if (!isNew) updated++;
  }
}

// Anything left describes an image that no longer exists.
for (const { id } of byImage.values()) {
  unlinkSync(join(RECORDS, `${id}.yml`));
  removed++;
}

console.log(`Image records: ${files.length} images, ${created} created, ${updated} updated, ${removed} removed.`);
