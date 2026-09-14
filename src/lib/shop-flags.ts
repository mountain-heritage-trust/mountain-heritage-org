// Launch switch for the shop. See docs/shop.md → "Pre-launch state".
//
// While false, the shop still builds and works at /shop (behind the
// Cloudflare Access application described in docs/auth.md) but is not
// linked from the header and its pages are left out of the sitemap, so
// public visitors don't stumble on a login wall.
//
// Kept as a plain constant in its own file (no Astro imports) so that
// both components and astro.config.mjs can read it.
export const SHOP_PUBLIC = false;
