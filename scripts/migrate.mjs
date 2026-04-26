#!/usr/bin/env node
// Migrate content from the Webflow HTML mirror in _audit/ to markdown
// files under src/content/. Handles: blog, team, exhibitions, archive.
//
// About pages are not auto-migrated — they use bespoke Webflow layouts
// and need a manual rebuild.
//
// Usage:
//   node scripts/migrate.mjs              # all collections
//   node scripts/migrate.mjs blog         # one collection

import { readdirSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, basename } from 'node:path';
import { load } from 'cheerio';
import TurndownService from 'turndown';

const turndown = new TurndownService({
  headingStyle: 'atx',
  codeBlockStyle: 'fenced',
  emDelimiter: '*',
  bulletListMarker: '-',
});

const MONTHS = {
  january: 1, february: 2, march: 3, april: 4, may: 5, june: 6,
  july: 7, august: 8, september: 9, october: 10, november: 11, december: 12,
};

function yamlString(s) {
  return '"' + s.replace(/\\/g, '\\\\').replace(/"/g, '\\"') + '"';
}

function cleanMarkdown(md) {
  // Strip zero-width characters Webflow leaves in empty paragraphs
  return md
    .replace(/[​-‍﻿]/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function extractSummary(markdown, max = 200) {
  const firstPara = markdown
    .split('\n\n')
    .find((p) => p.trim() && !p.startsWith('#') && !p.startsWith('!['));
  if (!firstPara) return null;
  const stripped = firstPara
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/[*_`]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  if (stripped.length <= max) return stripped;
  return stripped.slice(0, max).replace(/\s+\S*$/, '') + '…';
}

function parseDate(dayText, monthYearText) {
  const myMatch = monthYearText.match(/([A-Za-z]+)\s+(\d{4})/);
  if (!myMatch) return null;
  const month = MONTHS[myMatch[1].toLowerCase()];
  const year = parseInt(myMatch[2], 10);
  if (!month || isNaN(year)) return null;
  let day = parseInt(dayText, 10);
  if (isNaN(day) || day < 1 || day > 31) day = 1;
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

const collections = {
  blog: {
    source: '_audit/www.mountain-heritage.org/blog',
    target: 'src/content/blog',
    extract: ($) => {
      const container = $('.article-container').first();
      if (!container.length) return { valid: false, reason: 'no .article-container' };
      const title = container.find('h1').first().text().trim();
      if (!title) return { valid: false, reason: 'no h1' };
      const dateWrap = container.find('.date-wrap').first();
      const isoDate = parseDate(
        dateWrap.children().eq(0).text().trim(),
        dateWrap.children().eq(1).text().trim()
      );
      const coverImg = container.find('img.blog-main-image').attr('src');
      const cover = coverImg && !coverImg.includes('placeholder') ? coverImg : null;
      const bodies = container.find('.rte.w-richtext').filter((_, el) => {
        return !$(el).hasClass('w-dyn-bind-empty') && $(el).text().trim().length > 0;
      });
      const bodyHtml = bodies.last().html() || '';
      const markdown = cleanMarkdown(turndown.turndown(bodyHtml));
      const summary = extractSummary(markdown);
      const front = ['---', `title: ${yamlString(title)}`];
      front.push(isoDate ? `date: ${isoDate}` : 'date: 1970-01-01  # TODO: missing date in source');
      if (summary) front.push(`summary: ${yamlString(summary)}`);
      if (cover) front.push(`cover: ${yamlString(cover)}`);
      front.push('---', '');
      return { valid: true, content: front.join('\n') + markdown + '\n' };
    },
  },

  team: {
    source: '_audit/www.mountain-heritage.org/team',
    target: 'src/content/team',
    extract: ($) => {
      const titleWrap = $('.title-wrapper').first();
      const name = titleWrap.find('h1').first().text().trim();
      if (!name) return { valid: false, reason: 'no name' };
      const role = titleWrap.children().eq(1).text().trim() || 'Trustee';
      const bioHtml = $('.team-details-wrapper .w-richtext').first().html() || '';
      const photoEl = $('img.image').filter((_, el) => {
        const src = $(el).attr('src') || '';
        return src && !src.includes('placeholder');
      }).first();
      const photo = photoEl.attr('src') || null;
      const markdown = cleanMarkdown(turndown.turndown(bioHtml));
      const front = [
        '---',
        `name: ${yamlString(name)}`,
        `role: ${yamlString(role)}`,
      ];
      if (photo) front.push(`photo: ${yamlString(photo)}`);
      front.push('---', '');
      return { valid: true, content: front.join('\n') + markdown + '\n' };
    },
  },

  exhibitions: {
    source: '_audit/www.mountain-heritage.org/exhibitions',
    target: 'src/content/exhibitions',
    extract: ($) => {
      const title = $('h1').first().text().trim();
      if (!title) return { valid: false, reason: 'no h1' };
      const richtexts = $('.w-richtext').filter(
        (_, el) => $(el).text().trim().length > 50
      );
      const bodyHtml = richtexts.first().html() || '';
      const markdown = cleanMarkdown(turndown.turndown(bodyHtml));
      const summary = extractSummary(markdown);
      const front = ['---', `title: ${yamlString(title)}`];
      if (summary) front.push(`summary: ${yamlString(summary)}`);
      front.push('# TODO: add startDate, endDate, venue, status from old site');
      front.push('---', '');
      return { valid: true, content: front.join('\n') + markdown + '\n' };
    },
  },

  archive: {
    source: '_audit/www.mountain-heritage.org/collections',
    target: 'src/content/archive',
    extract: ($) => {
      const title = $('h1').first().text().trim();
      if (!title) return { valid: false, reason: 'no h1' };
      const richtexts = $('.w-richtext').filter(
        (_, el) => $(el).text().trim().length > 50
      );
      const bodyParts = [];
      richtexts.each((_, el) => bodyParts.push($(el).html() || ''));
      const markdown = cleanMarkdown(turndown.turndown(bodyParts.join('\n\n')));
      const summary = extractSummary(markdown);
      const front = ['---', `title: ${yamlString(title)}`];
      if (summary) front.push(`summary: ${yamlString(summary)}`);
      front.push('---', '');
      return { valid: true, content: front.join('\n') + markdown + '\n' };
    },
  },

  // About pages used bespoke Webflow layouts. We extract whatever paragraph
  // text we can find, with a TODO note. Trustees should review and rewrite
  // via the CMS post-launch.
  about: {
    source: '_audit/www.mountain-heritage.org/about',
    target: 'src/content/about',
    extract: ($) => {
      const title = $('h1').first().text().trim();
      if (!title) return { valid: false, reason: 'no h1' };
      // Strip chrome before extracting paragraph content
      $('.navbar, [class*="nav-bar"], header.nav, footer, script, style, [class*="footer"], .w-nav, .w-condition-invisible, [data-w-nav]').remove();
      const blocks = [];
      $('p, h2, h3').each((_, el) => {
        const $el = $(el);
        const text = $el.text().trim().replace(/\s+/g, ' ');
        if (text.length < 30) return;
        const tag = $el.prop('tagName').toLowerCase();
        if (tag === 'h2') blocks.push(`## ${text}`);
        else if (tag === 'h3') blocks.push(`### ${text}`);
        else blocks.push(text);
      });
      const markdown = cleanMarkdown(blocks.join('\n\n'));
      const front = [
        '---',
        `title: ${yamlString(title)}`,
        '# TODO: about pages used bespoke Webflow layouts. Review and rewrite via CMS.',
        '---',
        '',
      ];
      return { valid: true, content: front.join('\n') + markdown + '\n' };
    },
  },
};

const which = process.argv[2];
const targets = which ? [which] : Object.keys(collections);

for (const name of targets) {
  const cfg = collections[name];
  if (!cfg) {
    console.error(`Unknown collection: ${name}`);
    process.exit(1);
  }
  mkdirSync(cfg.target, { recursive: true });
  const files = readdirSync(cfg.source).filter((f) => f.endsWith('.html'));
  let written = 0;
  const errors = [];
  for (const file of files) {
    try {
      const slug = basename(file, '.html');
      const html = readFileSync(join(cfg.source, file), 'utf8');
      const $ = load(html);
      const result = cfg.extract($);
      if (!result.valid) {
        errors.push({ file, error: result.reason });
        continue;
      }
      writeFileSync(join(cfg.target, `${slug}.md`), result.content);
      written++;
    } catch (err) {
      errors.push({ file, error: err.message });
    }
  }
  console.log(`[${name}] wrote ${written}/${files.length}, errors: ${errors.length}`);
  for (const e of errors.slice(0, 5)) console.log(`  - ${e.file}: ${e.error}`);
}
