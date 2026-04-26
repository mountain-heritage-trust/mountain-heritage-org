# Sveltia CMS

Trustees edit the site at **https://www.mountain-heritage.org/admin** using
[Sveltia CMS](https://github.com/sveltia/sveltia-cms). Sveltia loads in the
browser, presents a friendly editor for each content collection, and commits
changes directly to the GitHub repo. Cloudflare Pages then rebuilds the site
on push.

## Files

- `public/admin/index.html` — loads the Sveltia CMS bundle from a CDN.
- `public/admin/config.yml` — defines collections, fields and widgets.
- `public/uploads/` — destination for media uploads (served at `/uploads/...`).

## Architecture

```
Trustee  →  /admin (browser)  →  Sveltia CMS UI
                                      │
                                      │ 1. Cloudflare Access checks
                                      │    @mountain-heritage.org SSO
                                      │
                                      │ 2. GitHub OAuth (Sveltia → GitHub)
                                      │    on first save
                                      │
                                      ▼
                                 GitHub repo
                                      │
                                      │ webhook
                                      ▼
                            Cloudflare Pages build
```

Two layers of auth:

1. **Cloudflare Access** in front of `/admin/*` restricts who can even reach
   the CMS UI — only `@mountain-heritage.org` Google Workspace users.
   See `docs/auth.md`.
2. **GitHub OAuth** is what Sveltia uses to actually commit changes to the
   repo. The GitHub user identity is what shows up in commit history.

## Required setup (one-off, by an administrator)

1. **GitHub repo.** Already set up at
   `mountain-heritage-trust/mountain-heritage-org`. `backend.repo` in
   `public/admin/config.yml` points at it.
2. **Sveltia OAuth** — Sveltia ships with a hosted OAuth proxy by default.
   Most setups need no extra configuration, but if commits fail with auth
   errors, follow the [self-hosted auth guide](https://github.com/sveltia/sveltia-cms#authentication).
3. **Grant trustees access on the GitHub repo** — every trustee who edits
   needs at least Write access on the GitHub repo. Without that, GitHub will
   refuse the commit even if Cloudflare Access lets them through.
4. **Configure Cloudflare Access on `/admin/*`** — see `docs/auth.md`.

## Keeping schemas in sync

Sveltia's `config.yml` field shapes **must match** the Astro schemas in
`src/content.config.ts`. If they drift, trustees can save invalid frontmatter
that breaks the build.

When changing a field:

1. Update the Zod schema in `src/content.config.ts`.
2. Update the matching widget in `public/admin/config.yml`.
3. Update `docs/content.md`.
4. Run `npm run check` to confirm nothing in existing content trips on the
   schema change.

## Naming

The Astro content collection internally named `archive` is exposed in the CMS
as **"Archive collections"**. Public URLs are `/collections/<slug>`. See
`docs/migration.md` for why.

## Trustee-facing guide

A trustee-friendly walkthrough lives at `docs/trustee-guide.md`.

## Local preview of the CMS

Sveltia supports a "local proxy" mode for editing files on disk during
development. From the repo root:

```sh
npx @sveltia/cms-proxy-server
npm run dev
```

Then open `http://localhost:4321/admin`. Edits are written to your local
filesystem rather than committed to GitHub, which is much faster for
iterating on `config.yml`.
