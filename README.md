# Mountain Heritage Trust website

The website for [Mountain Heritage Trust](https://www.mountain-heritage.org), a
small UK charity preserving the heritage of British mountaineering.

Built with [Astro](https://astro.build) and deployed to Cloudflare Workers
(Static Assets + the `@astrojs/cloudflare` adapter for dynamic routes). Content
is edited by non-technical trustees through [Sveltia CMS](https://github.com/sveltia/sveltia-cms)
at `/admin`, gated behind Cloudflare Access (Google Workspace SSO).

## Live sites

| Environment        | URL                                                  |
| ------------------ | ---------------------------------------------------- |
| Production         | https://www.mountain-heritage.org                    |
| Dev (`workers.dev`)| https://mountain-heritage-org.remus-ddf.workers.dev  |

> The new site currently runs on its `workers.dev` URL. The custom domain
> `www.mountain-heritage.org` still serves the old site until DNS is migrated
> to Cloudflare — see [docs/deployment.md](docs/deployment.md).

## Quick start

```sh
npm install
npm run dev      # local dev server
npm run build    # production build
npm run check    # type and content checks
```

## Documentation

[`CLAUDE.md`](CLAUDE.md) is the entry point for anyone — human or LLM — working
on the project: stack, conventions, and a full documentation index. Start there.
Key pages:

- [docs/architecture.md](docs/architecture.md) — stack, data flow, repo layout
- [docs/development.md](docs/development.md) — local setup and day-to-day commands
- [docs/content.md](docs/content.md) — content collections and how to add entries
- [docs/cms.md](docs/cms.md) — Sveltia CMS configuration and trustee auth
- [docs/deployment.md](docs/deployment.md) — Cloudflare build and deploy
- [docs/trustee-guide.md](docs/trustee-guide.md) — non-technical guide for editing the site

## Deploying

`main` is the production branch. Every push to `main` triggers a Cloudflare
deploy that goes live within ~1 minute — there is no manual promotion step.
See [docs/deployment.md](docs/deployment.md).
