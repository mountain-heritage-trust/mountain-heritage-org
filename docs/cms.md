# Sveltia CMS

Trustees edit the site at **/admin** using
[Sveltia CMS](https://github.com/sveltia/sveltia-cms). Sveltia loads in the
browser, presents a friendly editor for each content collection, and commits
changes directly to the GitHub repo. Cloudflare then rebuilds the site
on push.

## Files

- `public/admin/index.html` — loads the Sveltia CMS bundle from a CDN.
- `public/admin/config.yml` — defines collections, fields and widgets, and
  points Sveltia at the auth shim.
- `public/uploads/` — destination for media uploads (served at `/uploads/...`).
- `src/pages/admin/auth-callback/[...path].ts` — auth shim. Returns the
  GitHub bot token to Sveltia without a real OAuth round trip.

## Architecture

```
Trustee  →  /admin (browser)
                 │
                 │ 1. Cloudflare Access challenges
                 │    Google sign-in (@mountain-heritage.org only)
                 │    See docs/auth.md.
                 ▼
            Sveltia CMS UI loads
                 │
                 │ 2. Sveltia opens "Sign in" popup at
                 │    /admin/auth-callback. The popup is also
                 │    behind Cloudflare Access, so the request
                 │    arrives at the Worker with a valid
                 │    cf-access-jwt-assertion header.
                 ▼
            Auth shim (Astro API route)
                 │
                 │ 3. Shim returns the bot's GITHUB_BOT_TOKEN
                 │    via window.postMessage. Popup closes.
                 │
                 │ 4. Sveltia uses the token for all subsequent
                 │    GitHub API calls (read/write content).
                 ▼
            GitHub API
                 │
                 │ webhook on push
                 ▼
            Cloudflare build → live site
```

Two key properties:

1. **Trustees never see GitHub at all.** The Google sign-in (Cloudflare
   Access) is the only thing they're asked to do.
2. **The bot token never reaches the public.** It's a Cloudflare Worker
   secret. The auth shim only returns it for requests Cloudflare Access
   has authenticated; if the `cf-access-jwt-assertion` header is absent
   the shim refuses.

The trade-off: every commit is attributed to whichever GitHub user owns
`GITHUB_BOT_TOKEN` — there's no per-trustee attribution in `git log`.
Cloudflare Access logs (Zero Trust → Logs → Access) record which trustee
hit `/admin` and when, so accountability is preserved off-repo.

The login screen only offers the OAuth flow above — `auth_methods: [oauth]`
in `config.yml` disables Sveltia's "Sign in with access token" (personal
access token) button, so the only way in is the Access-gated Google flow.

## One-off setup

### 1. GitHub repo

Already at `mountain-heritage-trust/mountain-heritage-org`. Trustees do
**not** need their own access to this repo — the bot user does.

### 2. Bot GitHub PAT

Create a fine-grained Personal Access Token on a GitHub account that has
**Write** access to the repo:

- Go to <https://github.com/settings/personal-access-tokens>.
- **Token name**: `MHT website bot`.
- **Expiration**: 1 year (or longer, if your security policy allows).
- **Resource owner**: `mountain-heritage-trust`.
- **Repository access**: Only select repositories → `mountain-heritage-org`.
- **Repository permissions**:
  - Contents: **Read and write**
  - Metadata: Read-only (auto-selected)
- Generate. Copy the `github_pat_…` token.

### 3. Add the token to Cloudflare

In **Cloudflare → Workers & Pages → mountain-heritage-org → Settings →
Variables and Secrets**:

- Name: `GITHUB_BOT_TOKEN`
- Type: **Secret**
- Value: the `github_pat_…` token from step 2.

After saving, redeploy (push any change, or use the dashboard's redeploy
button) so the new secret is in effect.

### 4. Cloudflare Access

The Access application gating `/admin/*` automatically also covers
`/admin/auth-callback/*` since path globs include subpaths. No additional
policy needed. See `docs/auth.md`.

## Rotating the bot token

When the bot token expires (or if it's compromised):

1. Generate a new fine-grained PAT (steps under **2. Bot GitHub PAT** above).
2. Update the `GITHUB_BOT_TOKEN` secret in Cloudflare.
3. Trigger a redeploy.
4. Revoke the old PAT at <https://github.com/settings/personal-access-tokens>.

Trustees see no disruption — the new token is picked up the next time
they open `/admin`.

## Keeping schemas in sync

Sveltia's `config.yml` field shapes **must match** the Astro schemas in
`src/content.config.ts`. If they drift, trustees can save invalid
frontmatter that breaks the build.

When changing a field:

1. Update the Zod schema in `src/content.config.ts`.
2. Update the matching widget in `public/admin/config.yml`.
3. Update `docs/content.md`.
4. Run `npm run check` to confirm nothing in existing content trips on
   the schema change.

## Naming

The Astro content collection internally named `archive` is exposed in the
CMS as **"Archive collections"**. Public URLs are `/collections/<slug>`.
See `docs/migration.md` for why.

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
iterating on `config.yml`. The auto-auth shim is bypassed in this mode.
