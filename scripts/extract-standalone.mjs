#!/usr/bin/env node
// Extract standalone (non-collection) pages from the Webflow mirror into
// bespoke .astro pages under src/pages/.
//
// These pages had ad-hoc Webflow layouts. We pull their paragraph/heading
// text into an Astro page wrapped in BaseLayout. Visual layout is replaced
// with a plain text presentation; refine after launch.

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { load } from 'cheerio';

const SOURCE = '_audit/www.mountain-heritage.org';
const TARGET = 'src/pages';

// Map source HTML → output .astro path. Keep URL identical.
const pages = [
  { src: 'privacy-notice.html',          out: 'privacy-notice.astro' },
  { src: 'terms-of-use.html',            out: 'terms-of-use.astro' },
  { src: 'supporters.html',              out: 'supporters.astro' },
  { src: 'man-mountain-learning-resources.html', out: 'man-mountain-learning-resources.astro' },
  { src: 'contact.html',                 out: 'contact.astro' },
  { src: 'donate.html',                  out: 'donate.astro' },
];

function escapeAstro(text) {
  // Astro treats `<` as an element start and `{}` as JSX expression delimiters.
  // HTML entities are rendered as-is in static content, so use them for both.
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\{/g, '&#123;')
    .replace(/\}/g, '&#125;');
}

function renderBlocks(blocks) {
  return blocks.map(({ tag, text }) => {
    const escaped = escapeAstro(text);
    if (tag === 'h2') return `  <h2>${escaped}</h2>`;
    if (tag === 'h3') return `  <h3>${escaped}</h3>`;
    return `  <p>${escaped}</p>`;
  }).join('\n');
}

function titleFromSlug(slug) {
  return slug
    .replace(/\.html$/, '')
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

for (const { src, out } of pages) {
  const html = readFileSync(join(SOURCE, src), 'utf8');
  const $ = load(html);
  $('.navbar, [class*="nav-bar"], header.nav, footer, script, style, [class*="footer"], .w-nav, .w-condition-invisible, [data-w-nav]').remove();

  const title = $('h1').first().text().trim() || titleFromSlug(src);
  const blocks = [];
  $('p, h2, h3').each((_, el) => {
    const $el = $(el);
    const text = $el.text().trim().replace(/\s+/g, ' ');
    if (text.length < 20) return;
    const tag = $el.prop('tagName').toLowerCase();
    blocks.push({ tag, text });
  });

  const body = blocks.length
    ? renderBlocks(blocks)
    : `  <p>Content coming soon.</p>`;

  const astro = `---
import BaseLayout from '../layouts/BaseLayout.astro';
// TODO: this page was extracted from the previous Webflow site. Review and
// edit content as needed via the CMS once it's wired up.
---
<BaseLayout title=${JSON.stringify(title)}>
  <article class="article">
    <h1>${escapeAstro(title)}</h1>
${body}
  </article>
</BaseLayout>
`;

  const outPath = join(TARGET, out);
  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, astro);
  console.log(`wrote ${outPath} (${blocks.length} blocks)`);
}
