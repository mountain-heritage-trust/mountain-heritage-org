// Build-time auto-linking of team-member and archive-collection
// references in blog posts.
//
// Reads `src/content/team/` and `src/content/archive/` from disk at
// config time, builds a list of {term, href} entries, plus a small
// hand-written set of short-form aliases ("Bonington", "Bonington
// Papers", etc.) for names that aren't the literal frontmatter title.
//
// Returns a rehype plugin that walks the rendered HAST tree of blog
// posts only, finds the first occurrence of each term, and wraps it
// in an `<a class="auto-link">…</a>`. Skips text inside existing
// links, code blocks, and headings.
//
// All processing happens at build time. No runtime cost.

import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import type { Plugin } from 'unified';
import type { Root, Element, Text, ElementContent } from 'hast';

interface Term {
  raw: string;
  href: string;
}

const ROOT = process.cwd();
const TEAM_DIR = join(ROOT, 'src/content/team');
const ARCHIVE_DIR = join(ROOT, 'src/content/archive');

const SKIP_TAGS = new Set(['a', 'code', 'pre', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6']);

// Read a frontmatter scalar value (`name: ...` / `title: ...`) without
// pulling in a YAML parser. The values may be quoted or bare.
function readScalar(text: string, key: string): string | null {
  const fm = text.match(/^---\n([\s\S]*?)\n---/);
  if (!fm) return null;
  const line = fm[1].match(new RegExp(`^${key}:\\s*("([^"]*)"|([^\\n]+))`, 'm'));
  if (!line) return null;
  return (line[2] ?? line[3] ?? '').trim();
}

function listSlugs(dir: string): string[] {
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((f) => f.endsWith('.md') && !f.startsWith('.'))
    .map((f) => f.replace(/\.md$/, ''));
}

function loadTerms(): Term[] {
  const terms: Term[] = [];
  const seen = new Set<string>();
  const add = (raw: string, href: string) => {
    const t = raw.trim();
    if (!t) return;
    const key = t.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    terms.push({ raw: t, href });
  };

  // Team members → /team/<slug>
  for (const slug of listSlugs(TEAM_DIR)) {
    const path = join(TEAM_DIR, `${slug}.md`);
    const text = readFileSync(path, 'utf8');
    const name = readScalar(text, 'name');
    if (name) add(name, `/team/${slug}`);
  }

  // Archive collections → /collections/<slug>
  for (const slug of listSlugs(ARCHIVE_DIR)) {
    const path = join(ARCHIVE_DIR, `${slug}.md`);
    const text = readFileSync(path, 'utf8');
    const title = readScalar(text, 'title');
    if (title) add(title, `/collections/${slug}`);
  }

  // Hand-written short-form aliases. Order matters here only for
  // de-duplication — actual matching uses longest-first.
  const aliases: Term[] = [
    { raw: 'Sir Chris Bonington', href: '/team/sir-chris-bonington' },
    { raw: 'Chris Bonington', href: '/team/sir-chris-bonington' },
    { raw: 'Bonington', href: '/team/sir-chris-bonington' },
    { raw: 'Bonington Papers', href: '/collections/chris-bonington-papers' },
    { raw: "Sir Chris Bonington's Papers", href: '/collections/chris-bonington-papers' },
    { raw: 'Chris Bonington Papers', href: '/collections/chris-bonington-papers' },

    // Joe Tasker is not a team member (no /team page); only an archive.
    { raw: 'Joe Tasker', href: '/collections/joe-tasker-1948-1982' },
    { raw: 'Joe Tasker Archive', href: '/collections/joe-tasker-1948-1982' },

    // Joe Brown and Doug Scott are former patrons / past trustees with
    // /team/ profiles, so the alias points at the person.
    { raw: 'Joe Brown', href: '/team/joe-brown' },
    { raw: 'Doug Scott', href: '/team/doug-scott-cbe' },

    // Other archive short forms.
    { raw: 'Chorley Hopkinson Library', href: '/collections/chorley-hopkinson-library-at-allan-bank' },
  ];
  for (const a of aliases) add(a.raw, a.href);

  return terms;
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function buildMatcher(terms: Term[]) {
  // Sort longest-first so "Sir Chris Bonington" matches before "Bonington".
  const sorted = [...terms].sort((a, b) => b.raw.length - a.raw.length);
  const map = new Map<string, Term>();
  for (const t of sorted) map.set(t.raw.toLowerCase(), t);
  const pattern = new RegExp(
    `\\b(${sorted.map((t) => escapeRegex(t.raw)).join('|')})\\b`,
    'g',
  );
  return { pattern, map };
}

function transformChildren(
  node: { type?: string; tagName?: string; children?: ElementContent[] },
  state: {
    pattern: RegExp;
    map: Map<string, Term>;
    linked: Set<string>;
    selfHref: string | null;
  },
) {
  if (!node.children) return;
  if (node.type === 'element' && node.tagName && SKIP_TAGS.has(node.tagName)) {
    return;
  }

  const newChildren: ElementContent[] = [];

  for (const child of node.children) {
    if (child.type === 'text') {
      const replaced = replaceTextNode(child as Text, state);
      newChildren.push(...replaced);
    } else {
      transformChildren(child as { children?: ElementContent[] }, state);
      newChildren.push(child);
    }
  }

  node.children = newChildren;
}

function replaceTextNode(node: Text, state: ReturnType<typeof buildState>): ElementContent[] {
  const text = node.value;
  if (!text || !state.pattern.test(text)) {
    state.pattern.lastIndex = 0;
    return [node];
  }
  state.pattern.lastIndex = 0;

  const out: ElementContent[] = [];
  let cursor = 0;
  let match: RegExpExecArray | null;
  while ((match = state.pattern.exec(text)) !== null) {
    const matched = match[1];
    const key = matched.toLowerCase();
    if (state.linked.has(key)) continue;
    const term = state.map.get(key);
    if (!term) continue;
    if (state.selfHref && term.href === state.selfHref) continue;

    const start = match.index;
    const end = start + matched.length;
    if (start > cursor) {
      out.push({ type: 'text', value: text.slice(cursor, start) });
    }
    out.push({
      type: 'element',
      tagName: 'a',
      properties: { href: term.href, className: ['auto-link'] },
      children: [{ type: 'text', value: matched }],
    });
    state.linked.add(key);
    cursor = end;
  }
  if (cursor < text.length) {
    out.push({ type: 'text', value: text.slice(cursor) });
  }
  return out.length > 0 ? out : [node];
}

function buildState(matcher: ReturnType<typeof buildMatcher>, selfHref: string | null) {
  return {
    pattern: matcher.pattern,
    map: matcher.map,
    linked: new Set<string>(),
    selfHref,
  };
}

/**
 * Rehype plugin that auto-links team / archive references in blog
 * posts. Scoped to files under src/content/blog/. No-op elsewhere.
 */
export function autoLinkBlogPlugin(): Plugin<[], Root> {
  const terms = loadTerms();
  if (terms.length === 0) {
    return () => () => undefined;
  }
  const matcher = buildMatcher(terms);

  return () => (tree, file) => {
    const path = String(file?.path ?? file?.history?.[0] ?? '');
    if (!path.includes('/content/blog/')) return;
    const state = buildState(matcher, null);
    transformChildren(tree as Root, state);
  };
}
