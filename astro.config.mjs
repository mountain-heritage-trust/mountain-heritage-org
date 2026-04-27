import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import cloudflare from '@astrojs/cloudflare';
import { execSync } from 'node:child_process';

// Build-time metadata. We resolve the commit hash here, in the config
// (which runs in a real Node context), and inject it as a Vite compile-
// time constant. Doing this in user code wouldn't work because the
// Cloudflare prerender environment has no Node APIs.
const ENV_COMMIT_KEYS = [
  'WORKERS_CI_COMMIT_SHA',
  'CF_PAGES_COMMIT_SHA',
  'GITHUB_SHA',
  'COMMIT_SHA',
  'COMMIT_REF',
];

function readCommitHash() {
  for (const key of ENV_COMMIT_KEYS) {
    if (process.env[key]) return process.env[key].slice(0, 7);
  }
  try {
    return execSync('git rev-parse --short HEAD', { encoding: 'utf8' }).trim();
  } catch {
    return 'unknown';
  }
}

const COMMIT_HASH = readCommitHash();
const BUILD_TIME = new Date().toISOString();

// Build a one-time map of file path → last-modified ISO date from git
// history, used to set <lastmod> per URL in the sitemap.
function loadGitLastMod() {
  const cache = new Map();
  try {
    const raw = execSync('git log --pretty=format:%cI --name-only --diff-filter=AMR', {
      encoding: 'utf8',
      maxBuffer: 50 * 1024 * 1024,
    });
    let currentDate = null;
    for (const line of raw.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      if (/^\d{4}-\d{2}-\d{2}T/.test(trimmed)) {
        currentDate = trimmed;
      } else if (currentDate && !cache.has(trimmed)) {
        cache.set(trimmed, currentDate);
      }
    }
  } catch {
    // Outside a git checkout, or no commits yet — fall back to no lastmod.
  }
  return cache;
}

const LAST_MOD = loadGitLastMod();

// Map a URL path to the source file behind it (markdown for content
// collections, .astro for standalone pages). Returned path is relative
// to the repo root, matching git's pathnames.
function urlPathToSource(pathname) {
  const clean = pathname.replace(/\/+$/, '') || '/';
  if (clean === '/') return 'src/pages/index.astro';
  // Content collection routes
  const blog = clean.match(/^\/blog\/([^/]+)$/);
  if (blog) return `src/content/blog/${blog[1]}.md`;
  const team = clean.match(/^\/team\/([^/]+)$/);
  if (team) return `src/content/team/${team[1]}.md`;
  const exhib = clean.match(/^\/exhibitions\/([^/]+)$/);
  if (exhib) return `src/content/exhibitions/${exhib[1]}.md`;
  const archive = clean.match(/^\/collections\/([^/]+)$/);
  if (archive) return `src/content/archive/${archive[1]}.md`;
  const about = clean.match(/^\/about\/([^/]+)$/);
  if (about) return `src/content/about/${about[1]}.md`;
  // Standalone pages live at src/pages/<path>.astro
  return `src/pages${clean}.astro`;
}

const PRIORITIES = [
  { match: (p) => p === '/', priority: 1.0, changefreq: 'weekly' },
  { match: (p) => /^\/(news-blog|collections|events-exhibitions|donate|contact|about\/about-us)\/?$/.test(p), priority: 0.9, changefreq: 'weekly' },
  { match: (p) => /^\/about\//.test(p), priority: 0.8, changefreq: 'monthly' },
  { match: (p) => /^\/(blog|team|exhibitions|collections)\//.test(p), priority: 0.7, changefreq: 'yearly' },
  { match: (p) => /^\/(privacy-notice|terms-of-use|supporters|man-mountain-learning-resources)$/.test(p), priority: 0.4, changefreq: 'yearly' },
];

function classify(pathname) {
  const clean = pathname.replace(/\/+$/, '') || '/';
  for (const rule of PRIORITIES) {
    if (rule.match(clean)) return { priority: rule.priority, changefreq: rule.changefreq };
  }
  return { priority: 0.5, changefreq: 'monthly' };
}

// https://astro.build/config
export default defineConfig({
  site: 'https://www.mountain-heritage.org',
  // Static-by-default; routes with `export const prerender = false` (e.g.
  // src/pages/api/contact.ts) run as Cloudflare Worker handlers.
  output: 'static',
  adapter: cloudflare(),
  integrations: [
    sitemap({
      filter: (page) => !page.includes('/admin'),
      serialize(item) {
        const path = new URL(item.url).pathname;
        const { priority, changefreq } = classify(path);
        item.priority = priority;
        item.changefreq = changefreq;
        const source = urlPathToSource(path);
        const lastmod = LAST_MOD.get(source);
        if (lastmod) item.lastmod = lastmod;
        return item;
      },
    }),
  ],
  vite: {
    define: {
      __COMMIT_HASH__: JSON.stringify(COMMIT_HASH),
      __BUILD_TIME__: JSON.stringify(BUILD_TIME),
    },
  },
});
