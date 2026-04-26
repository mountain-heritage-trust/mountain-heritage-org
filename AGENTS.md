# Mountain Heritage Trust website

The website for Mountain Heritage Trust, a small UK charity. Built with Astro and deployed to Cloudflare Workers (Static Assets + the `@astrojs/cloudflare` adapter for dynamic routes). Edited via Sveltia CMS by non-technical trustees, with `/admin` gated behind Cloudflare Access using Google Workspace SSO.

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
- [docs/deployment.md](docs/deployment.md) — Cloudflare Workers build and deploy
- [docs/auth.md](docs/auth.md) — Cloudflare Access (Google Workspace SSO) for `/admin`
- [docs/forms.md](docs/forms.md) — contact form (Astro API route + Resend)
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

## Committing and deploying

The `main` branch is the production branch. Every push to `main` triggers a Cloudflare deploy that goes live within ~1 minute — there is no manual promotion step. Treat `main` as production.

### Default workflow

After a logical unit of work is complete, **commit and push**. Don't pile changes up in the working tree.

A "logical unit of work" is one of:
- A single feature or bug fix (e.g. "add YouTube link to footer").
- A coherent group of changes that depend on each other (e.g. installing an adapter and wiring its routes).
- A round of doc updates that all describe the same thing.

Mixing unrelated changes in one commit makes rollback painful. If you've made two unrelated changes, split them into two commits.

### Before every push

1. `npm run build` succeeds.
2. `npm run check` reports 0 errors and 0 warnings.
3. New or changed docs are committed in the same change as the code.
4. If the change requires a new env var or external setup (Cloudflare Variable, Resend domain verification, etc.), **set those up first** — pushing before they exist breaks the live site. If you can't set them up yourself, hold the push and flag it.

### Commit messages

Short, imperative, lowercase. Match the existing style in `git log`.

```
add youtube link to footer
fix sitemap filter for /admin
remove regional-advocacy stub
```

Wrap the body at ~72 chars if you need explanation. The commit message is the first thing future maintainers read — make it specific. Avoid "various changes" or "wip".

### Autonomous mode

When the user is in auto mode, default to committing and pushing without asking. Asking before every commit is the exact friction auto mode is meant to avoid.

Still **ask first** for:
- Destructive or hard-to-reverse git operations: `reset --hard`, `push --force`, branch deletion, history rewrites.
- Changes that need a real-world action you can't undo (sending an email, posting a PR comment that notifies people, etc.).
- Anything outside the scope of the user's last request.

### Don'ts

- **Never `--amend` a commit that's already on `origin/main`** — create a new commit. Amending rewrites history and forces a force-push, which loses the original.
- **Never `git push --force` to `main`.** If you've made a mistake, fix it forward with another commit.
- **Don't use `--no-verify`** to skip hooks. If a hook fails, fix the underlying issue.
- **Don't commit secrets.** `.env`, `.dev.vars`, API keys, anything with `re_…` or similar tokens. The `.gitignore` covers the standard cases; if in doubt, check.

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
