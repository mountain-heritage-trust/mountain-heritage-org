# Mountain Heritage Trust website

The website for Mountain Heritage Trust, a small UK charity. Statically generated with Astro, hosted on Cloudflare Pages, edited via Sveltia CMS by non-technical trustees, with `/admin` gated behind Cloudflare Access using Google Workspace SSO.

This file is the entry point for anyone — human or LLM — working on the project. `CLAUDE.md` is a symlink to this file.

## Read first

- [docs/architecture.md](docs/architecture.md) — stack, data flow, repo layout, and why each piece was chosen.
- [docs/todos.md](docs/todos.md) — open follow-ups that need a human decision or external setup before launch.

## Documentation index

- [docs/architecture.md](docs/architecture.md) — overall architecture
- [docs/development.md](docs/development.md) — local development setup and day-to-day commands
- [docs/design.md](docs/design.md) — design system, tokens, component conventions
- [docs/brand.md](docs/brand.md) — brand identity: logo, palette, typography
- [docs/content.md](docs/content.md) — content collections, schemas, and how to add entries / fields / collections
- [docs/cms.md](docs/cms.md) — Sveltia CMS configuration and trustee auth flow
- [docs/deployment.md](docs/deployment.md) — Cloudflare Pages build and deploy
- [docs/auth.md](docs/auth.md) — Cloudflare Access (Google Workspace SSO) for `/admin`
- [docs/forms.md](docs/forms.md) — contact form (Cloudflare Pages Function + Resend)
- [docs/donations.md](docs/donations.md) — donate page and provider options (CAF Donate / JustGiving / Stripe)
- [docs/migration.md](docs/migration.md) — content inventory, URL preservation, and redirect strategy
- [docs/trustee-guide.md](docs/trustee-guide.md) — non-technical guide for editing the site
- [docs/todos.md](docs/todos.md) — initial-migration follow-up list (decisions and external setup)

## Conventions for any change

1. **Preserve URLs.** Any URL change requires a redirect in `public/_redirects`. Old URLs from `mountain-heritage.org` must continue to resolve.
2. **Keep the CMS schema simple.** Trustees are non-technical. New editable fields should be the minimum needed, with clear labels and no raw HTML.
3. **CMS config and Astro schemas must stay in sync.** Field shapes in `public/admin/config.yml` must match `src/content.config.ts`. Drift means trustees can save invalid frontmatter that breaks the build.
4. **No paid services without discussion.** The site runs at near-£0/month. Do not introduce a paid dependency without explicit sign-off.
5. **Update docs in the same change.** If you add or change a feature, update or add the relevant `docs/` page in the same commit or PR.
6. **Prefer boring choices.** Bus factor matters. Another developer should be able to pick this up with this file as their starting point.

## Quick reference

| Need to...                            | Look at                                                       |
| ------------------------------------- | ------------------------------------------------------------- |
| Run the site locally                  | [docs/development.md](docs/development.md)                    |
| Add a blog post / team member / etc.  | [docs/content.md](docs/content.md), [docs/trustee-guide.md](docs/trustee-guide.md) |
| Change how the site looks             | `src/styles/global.css`, [docs/design.md](docs/design.md)     |
| Change what the CMS shows trustees    | `public/admin/config.yml`, [docs/cms.md](docs/cms.md)         |
| Deploy / set environment variables    | [docs/deployment.md](docs/deployment.md)                      |
| Add or revoke a trustee's access      | [docs/auth.md](docs/auth.md)                                  |
| See what's still pending for launch   | [docs/todos.md](docs/todos.md)                                |
