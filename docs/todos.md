# TODO list — initial migration follow-ups

What's left before launch, what's blocked on DNS, and a backlog of
nice-to-haves.

---

## Blocking launch on the real domain — DNS-deferred

The trust does not currently have access to the DNS provider for
`mountain-heritage.org`. Until DNS is migrated to Cloudflare, the new
site lives at `mountain-heritage-org.remus-ddf.workers.dev`.

When DNS access is regained, do these in order:

- [ ] Move DNS to Cloudflare (recommended — makes everything else
  one-click).
- [ ] Attach `www.mountain-heritage.org` as a custom domain on the
  Workers project. Set up an apex redirect `mountain-heritage.org` →
  `www.mountain-heritage.org`.
- [ ] Verify the `mountain-heritage.org` domain in Resend (DKIM +
  SPF DNS records). Once verified, change the Pages env var
  `FROM_EMAIL` from `onboarding@resend.dev` to
  `noreply@mountain-heritage.org` (or similar) so contact-form
  emails come from the trust's own domain.
- [ ] On the Cloudflare Access application gating `/admin/*`, add
  `www.mountain-heritage.org/admin/*` as an additional path. Keep
  the workers.dev path during the transition.

---

## One-off verification

- [ ] **Send yourself a test message via `/contact`**. If it lands at
  `enquiries@mountain-heritage.org`, Resend is wired correctly. If
  not, check the Worker logs for
  `contact form: missing env vars: ...` to see which env var is
  empty.

---

## Content (trustees, in the CMS)

### About pages
4 pages were migrated with thin content because the original Webflow
layouts didn't translate into markdown. Each has a `# TODO` note in
its frontmatter.

- [ ] `about/about-us.md` — flagship page, also hosts the team gallery.
- [ ] `about/accessions.md` — how the trust accepts donations of objects
  and archives.
- [ ] `about/annual-report.md`
- [ ] `about/trustees-staff-patrons-and-advisors.md`

See `docs/style-guide.md` for the trust's voice; trustees can also use
the writing style guide as a checklist.

### Exhibitions metadata
The 4 exhibitions migrated without `startDate`, `endDate`, `venue` or
`status`. Each has a `# TODO`.

- [ ] Fill `startDate`, `endDate`, `venue` and `status`
  (`upcoming` / `current` / `past`) on each in the CMS so the
  Events & Exhibitions listing can sort and label them.

### PDFs and other downloads
Not yet inventoried.

- [ ] Spot-check standalone pages (especially `/man-mountain-learning-resources`)
  and the bigger blog posts for PDFs hosted on the old Webflow CDN.
  Download any worth keeping into `public/uploads/` and rewrite the
  markdown links — same pattern as the image rehost.

---

## Backlog — nice-to-haves

In rough priority order:

- **Trustee onboarding**: walk a non-technical trustee through editing
  a page in `/admin`. Real-world test of the workflow + early signal
  on UX rough edges.
- **Cloudflare Turnstile** on the contact form for stronger spam
  protection. Free, ~10 minutes to wire up.
- **Self-host Montserrat**. Currently loaded from Google Fonts; self-
  hosting is faster and more privacy-friendly. Two `@font-face`
  declarations and a couple of `.woff2` files.
- **404 page styling**. The current `/404` is functional but plain.
- **Switch donations to CAF Donate**. Lower fees and the same Gift Aid
  handling as JustGiving — requires signing the trust up at
  <https://www.cafonline.org/charities/cafdonate>, then replacing the
  `justGivingUrl` constant in `src/pages/donate.astro`. See
  `docs/donations.md`.
- **Search Console + Bing Webmaster Tools**. Verify domain ownership
  (DNS TXT once DNS is on Cloudflare) and submit the sitemap. Surfaces
  ranking queries, indexing issues and Core Web Vitals real-user data.
- **Markdown body-image optimisation**. The `<Image>` component
  optimises template-rendered images (covers, hero, cards), but
  inline images inside blog markdown still serve as plain JPEGs. A
  rehype plugin could transform `<img src="/uploads/...">` into a
  `<picture>` at build time.
- **Auto-link mentions**. When a blog post mentions a person who has a
  `/team/<slug>` page (or a collection that has a `/collections/<slug>`
  page), automatically link to it. A small build-time pass on
  `post.body` would handle this.
- **Pillar pages** for major topics. A 1500-word definitive page per
  cluster (e.g. "British Mountaineering Archives", "Joe Tasker") that
  links to and is linked by the existing tag pages and blog posts.
- **Move uploads to Cloudflare R2**. The repo is now ~250 MB because
  of `public/uploads/` originals and AVIF/WebP variants. R2 (object
  storage, free tier covers our scale) keeps the repo lean and serves
  images from edge.

---

## Recently done

For reference, items that were on this list and are now resolved:

- ✅ Donation provider chosen (JustGiving) and wired up.
- ✅ Brand colours, logo, favicon and typography applied.
- ✅ GitHub repo, Sveltia auto-auth, Cloudflare Workers deploy,
  Cloudflare Zero Trust SSO for `/admin`, Resend signup.
- ✅ Image rehosting (239 images, no Webflow CDN dependency).
- ✅ Image optimisation: AVIF + WebP variants, `<picture>` rendering,
  CLS-safe dimensions.
- ✅ Schema.org JSON-LD: Organization site-wide; BlogPosting,
  Person, ExhibitionEvent and Collection per page; BreadcrumbList on
  inner pages.
- ✅ Sitemap with `lastmod` (from git), `priority`, `changefreq`.
- ✅ Visible breadcrumbs on every per-item page.
- ✅ RSS feed at `/rss.xml`, `llms.txt`, lang="en-GB".
- ✅ Pagination on `/news-blog` (8 pages of 24 posts) and tag pages
  at `/blog/tag/<slug>` for 7 prominent topics with researched copy.
- ✅ OG image on every page (cover image for posts, hero on home).
- ✅ Writing style guide at `docs/style-guide.md` based on existing
  blog post voice.

---

## Things you do NOT need to do

- ✅ Sitemap, robots.txt, RSS, llms.txt, OG/Twitter Card meta tags,
  canonical URLs, accessibility landmarks, honeypot spam protection,
  225/225 URL preservation from the old site — all wired up.
