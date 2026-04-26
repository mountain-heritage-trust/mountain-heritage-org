# TODO list — initial migration follow-ups

This is the consolidated list of things that need a human decision or
external setup before the new site can launch. Items are grouped by who
needs to action them.

---

## Decisions needed (you, as trustee)

### Donation provider
- The donate page (`src/pages/donate.astro`) currently uses **JustGiving**
  as the primary CTA — same widget URL as the old site (CharityId 2927521).
  This works today and needs no further setup.
- See `docs/donations.md` for context.

### Brand colours, logo, typography
- Brand guidelines are in [brand.md](brand.md). Tokens are applied in
  `src/styles/global.css`. Brand blue `#1c3278` (matches the logo SVG) and
  brand purple `#990066` are the two primary colours; Montserrat is the
  heading font; the logo SVG is wired up in the header and as the favicon.
- *(No outstanding action.)*

---

## External setup (one-off, by an administrator)

### GitHub
- [ ] Create a GitHub repository for the project (e.g.
  `mountain-heritage-trust/mountain-heritage-org`) and push.
- [ ] Update `public/admin/config.yml`:
  - Set `backend.repo` to the actual `<owner>/<repo>`.
- [ ] Invite each trustee/staff member who will edit the site as a
  **collaborator with Write access**.

### Cloudflare Pages (hosting)
- [ ] Create the Pages project, connect to GitHub, deploy.
- [ ] Attach `www.mountain-heritage.org` as a custom domain.
- [ ] Set up apex redirect `mountain-heritage.org` → `www.mountain-heritage.org`.
- [ ] Set environment variables (Production + Preview):
  - `RESEND_API_KEY`
  - `CONTACT_EMAIL` (e.g. `enquiries@mountain-heritage.org`)
  - `FROM_EMAIL` (e.g. `noreply@mountain-heritage.org`)
- See `docs/deployment.md`.

### Cloudflare Zero Trust (CMS access)
- [ ] Enable Zero Trust on the Cloudflare account (Free plan).
- [ ] Add Google Workspace as an identity provider.
- [ ] Create an Access application for `/admin/*` with a policy allowing
  emails ending `@mountain-heritage.org`.
- See `docs/auth.md`.

### Resend (contact form email)
- [ ] Sign up at <https://resend.com> (free tier).
- [ ] Verify the `mountain-heritage.org` domain (DKIM + SPF DNS records).
- [ ] Generate an API key and add as `RESEND_API_KEY` in Cloudflare Pages.

### DNS
- [ ] Move DNS to Cloudflare (recommended, makes everything else easier).
- [ ] Point `www` and apex at the Pages project.
- [ ] Add Resend's DKIM/SPF/DMARC records once the Resend domain is
  verified.

---

## Content cleanup (trustees, after launch)

### About pages
- 4 about pages were migrated with thin content because the original
  Webflow layouts didn't translate into markdown.
- Each `src/content/about/*.md` has a `# TODO` note in its frontmatter.
- **Action:** review and rewrite via the CMS:
  - `about/about-us.md`
  - `about/accessions.md`
  - `about/annual-report.md`
  - `about/trustees-staff-patrons-and-advisors.md`

### Exhibitions metadata
- 4 exhibitions migrated without `startDate`, `endDate`, `venue`, or `status`.
- Each `src/content/exhibitions/*.md` has a `# TODO` note.
- **Action:** fill these fields in via the CMS so the events listing
  page can sort by date and show the right "current vs past" tag.

### Image rehosting
- 443 unique image URLs in the migrated content currently point to the
  old Webflow CDN (`cdn.prod.website-files.com`).
- These will break the moment the old Webflow site is taken down.
- **Action (before old site goes down):** download the images we want
  to keep into `public/uploads/` and update the markdown references.
- A list of all referenced URLs is at `_audit/asset-urls.txt`. A small
  script to download and rewrite would be straightforward to add.

### PDFs and other downloads
- Not yet inventoried — there may be PDFs linked from the standalone
  pages (e.g. learning resources) hosted on Webflow's CDN.
- **Action:** spot-check the migrated standalone pages and the bigger
  blog posts; download any externally-hosted PDFs we want to preserve.

---

## Optional improvements (would be nice, not blockers)

- **Switch donations to CAF Donate** — lower fees than JustGiving and the
  same Gift Aid handling. Requires signing the trust up at
  <https://www.cafonline.org/charities/cafdonate>, then replacing the
  `justGivingUrl` constant in `src/pages/donate.astro`. See
  `docs/donations.md`.
- **Cloudflare Turnstile** on the contact form for stronger spam protection
  (free, takes 5 minutes once a Cloudflare account exists).
- **Self-host Montserrat** — currently loaded from Google Fonts. Self-hosting
  is faster and more privacy-friendly but takes a few extra steps (fetch
  woff2 files, add `@font-face` rules, drop the Google Fonts `<link>`).
- **RSS feed** for the blog (`/blog/rss.xml`) — Astro has an integration.
- **Tag/category pages** for blog posts (tags are already stored but not
  surfaced).
- **Social share images** (`og:image`) per blog post — would noticeably
  improve the way links unfurl on Slack, Twitter, etc.
- **Pagination on the news/blog listing** — currently 176 posts on one
  page. Workable for now, but worth splitting once content grows.
- **404 page styling** — there's a basic 404 (`src/pages/404.astro`).
  A more on-brand version would be nicer.

---

## Things you do NOT need to do

These are taken care of and need no action:

- ✅ Sitemap is generated automatically on every build (`/sitemap-index.xml`).
- ✅ `robots.txt` is in place (allows everything except `/admin`).
- ✅ Open Graph and Twitter Card meta tags are in `BaseLayout`.
- ✅ Canonical URLs are emitted for every page.
- ✅ Skip-to-main-content link and semantic landmarks for accessibility.
- ✅ Honeypot anti-spam on the contact form.
- ✅ All 225 sitemap URLs from the old site resolve on the new site.
