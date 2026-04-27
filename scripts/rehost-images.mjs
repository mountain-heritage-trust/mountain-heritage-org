#!/usr/bin/env node
// Rehost images from the old Webflow CDN to public/uploads/.
//
// - Walks src/content/ for markdown files.
// - Extracts all https://cdn.prod.website-files.com/... URLs.
// - Downloads each unique URL into public/uploads/ with a sanitised
//   filename derived from the URL.
// - Rewrites the markdown to reference /uploads/<filename> so the site
//   no longer depends on the old Webflow domain staying alive.
//
// Idempotent: re-running skips files that already exist locally.
//
// Usage:
//   node scripts/rehost-images.mjs --dry-run   # report only, no changes
//   node scripts/rehost-images.mjs             # do it

import { readdirSync, readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const DRY_RUN = process.argv.includes('--dry-run');
const ROOT = process.cwd();
const CONTENT = join(ROOT, 'src/content');
const UPLOADS_DIR = join(ROOT, 'public/uploads');
// Match Webflow CDN URLs up to a known image extension. Allowing `(` and
// `)` in the path is important — some asset filenames embed parentheses
// (e.g. `Slovak (5).jpg`) and the previous regex stopped early at `(`.
const URL_PATTERN = /https:\/\/cdn\.prod\.website-files\.com\/[^\s"'<>]+?\.(?:jpe?g|png|gif|svg|webp)\b/gi;
const PUBLIC_PREFIX = '/uploads/';

if (!DRY_RUN) mkdirSync(UPLOADS_DIR, { recursive: true });

function* walk(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) yield* walk(path);
    else if (entry.isFile() && (entry.name.endsWith('.md') || entry.name.endsWith('.mdx'))) yield path;
  }
}

function sanitise(name) {
  return decodeURIComponent(name)
    .replace(/[^a-zA-Z0-9._-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function localFilenameFor(url) {
  const u = new URL(url);
  const last = u.pathname.split('/').pop() ?? 'unnamed';
  return sanitise(last);
}

// 1. Collect all webflow URLs from markdown.
// Markdown sometimes escapes parens with backslashes (`\(1\)`); the actual
// URL on the CDN is unescaped. We track both the literal text in the
// markdown (`raw`, used for find-and-replace) and the canonical URL
// (`url`, used for downloading).
const files = [...walk(CONTENT)];
const urlsByFile = new Map();
const allUrls = new Set();
for (const file of files) {
  const text = readFileSync(file, 'utf8');
  const matches = text.match(URL_PATTERN) || [];
  const pairs = matches.map((raw) => ({ raw, url: raw.replace(/\\([()])/g, '$1') }));
  if (pairs.length) urlsByFile.set(file, pairs);
  for (const p of pairs) allUrls.add(p.url);
}

console.log(`Files containing webflow URLs: ${urlsByFile.size}`);
console.log(`Unique URLs:                   ${allUrls.size}`);

// 2. URL → local filename, disambiguating any collisions
const urlToLocal = new Map();
const usedNames = new Map();
for (const url of allUrls) {
  const baseName = localFilenameFor(url);
  let candidate = baseName;
  let i = 1;
  while (usedNames.has(candidate) && usedNames.get(candidate) !== url) {
    const dot = baseName.lastIndexOf('.');
    const stem = dot >= 0 ? baseName.slice(0, dot) : baseName;
    const ext = dot >= 0 ? baseName.slice(dot) : '';
    candidate = `${stem}-${i}${ext}`;
    i++;
  }
  usedNames.set(candidate, url);
  urlToLocal.set(url, candidate);
}

if (DRY_RUN) {
  console.log('\n--- dry run; nothing downloaded or rewritten ---\n');
  let shown = 0;
  for (const [url, local] of urlToLocal) {
    if (shown < 8) {
      console.log(`  ${url}`);
      console.log(`    → public/uploads/${local}\n`);
      shown++;
    }
  }
  if (urlToLocal.size > 8) console.log(`  … and ${urlToLocal.size - 8} more.`);
  console.log(`\n${urlToLocal.size} unique files would be downloaded.`);
  process.exit(0);
}

// 3. Download (sequentially with a small delay to be polite)
let downloaded = 0;
let cached = 0;
const failures = [];

let i = 0;
for (const [url, local] of urlToLocal) {
  i++;
  const dest = join(UPLOADS_DIR, local);
  if (existsSync(dest)) {
    cached++;
    continue;
  }
  try {
    const res = await fetch(url);
    if (!res.ok) {
      failures.push({ url, status: res.status });
      continue;
    }
    const buf = await res.arrayBuffer();
    writeFileSync(dest, Buffer.from(buf));
    downloaded++;
    if (downloaded % 25 === 0) console.log(`  ${i}/${urlToLocal.size} …`);
  } catch (err) {
    failures.push({ url, error: err.message });
  }
  await new Promise((r) => setTimeout(r, 30));
}

console.log(`Downloaded: ${downloaded}, already present: ${cached}, failed: ${failures.length}`);
if (failures.length) {
  console.log('Failures (showing up to 20):');
  for (const f of failures.slice(0, 20)) console.log('  -', f.status || f.error, '|', f.url);
}

// 4. Rewrite markdown — only swap URLs that we successfully have locally
const failedSet = new Set(failures.map((f) => f.url));
let rewritten = 0;
for (const [file, pairs] of urlsByFile) {
  const before = readFileSync(file, 'utf8');
  let after = before;
  for (const { raw, url } of pairs) {
    if (failedSet.has(url)) continue;
    const local = urlToLocal.get(url);
    if (!local) continue;
    after = after.split(raw).join(`${PUBLIC_PREFIX}${local}`);
  }
  if (after !== before) {
    writeFileSync(file, after);
    rewritten++;
  }
}

console.log(`Rewrote ${rewritten} markdown files.`);
