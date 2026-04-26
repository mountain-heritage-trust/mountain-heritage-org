import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import cloudflare from '@astrojs/cloudflare';

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
});
