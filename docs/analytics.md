# Analytics

The site uses **Cloudflare Web Analytics** to see which pages get traffic.
It's free, sets no cookies and stores nothing on the visitor's device, so
no cookie consent banner is needed.

## What it shows

Page views and visits per page, referrers, countries, browsers/devices,
and Core Web Vitals (real-user page speed). Data is kept for about six
months.

Dashboard: Cloudflare → **Analytics & Logs → Web Analytics** →
`www.mountain-heritage.org`.

Limitations worth knowing:

- It estimates visits; it can't count unique people over time.
- Ad blockers hide some visitors, so totals are an undercount. Relative
  comparisons between pages still hold.
- Custom events (e.g. "clicked Donate") aren't supported. Shop and
  donation figures come from Stripe and the donation provider instead.

## How it's wired

- `src/layouts/BaseLayout.astro` adds Cloudflare's beacon script when the
  build-time env var `PUBLIC_CF_WEB_ANALYTICS_TOKEN` is set. Every public
  page uses this layout; `/admin` doesn't, so CMS use isn't counted.
- Only the production build sets it: `.github/workflows/deploy-production.yml`
  reads the GitHub repository **variable** `CF_WEB_ANALYTICS_TOKEN`.
  Staging and local dev have no token, so they don't record anything.
- The token is public (it appears in the page HTML), which is why it's a
  repo variable rather than a secret.

We add the snippet ourselves rather than using Cloudflare's automatic
injection, so the repo decides which build is counted and the setup is
visible in code. If the Web Analytics site is switched to automatic
setup as well, visits are counted twice. Keep it on the manual snippet.

## Setup (one-off)

1. Cloudflare dashboard → **Analytics & Logs → Web Analytics → Add a
   site**. Hostname `www.mountain-heritage.org`; choose the **manual
   JS snippet** option (not automatic setup).
2. Copy the `token` value from the snippet.
3. Set it as a repo variable:
   `gh variable set CF_WEB_ANALYTICS_TOKEN --body <token>`
4. Promote a release (`/deploy --patch`). View source on a production
   page and check for `static.cloudflareinsights.com/beacon.min.js`.

The "Cookies and website analytics" section of `/privacy-notice`
(`src/pages/privacy-notice.astro`) describes this to visitors. Update it
if the analytics setup changes.

To rotate or remove: update or delete the repo variable and promote a
release.

## Why not Google Analytics

GA4 sets cookies, which under UK PECR needs a consent banner. Many
visitors decline, so the data would be partial. It's also a much heavier
script. For "which pages get traffic", a cookieless tool gives better
data with less to maintain. If trustees later want goal tracking or
richer reports, Plausible is the obvious upgrade (paid, so needs
sign-off).

Google Search Console complements this: it shows which searches bring
people to which pages. See the backlog in [todos.md](todos.md).
