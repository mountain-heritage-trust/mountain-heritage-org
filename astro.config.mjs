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
    }),
  ],
  vite: {
    define: {
      __COMMIT_HASH__: JSON.stringify(COMMIT_HASH),
      __BUILD_TIME__: JSON.stringify(BUILD_TIME),
    },
  },
});
