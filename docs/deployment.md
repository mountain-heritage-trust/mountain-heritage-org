# Deployment

The site deploys to **Cloudflare Workers** with Static Assets, using the
[@astrojs/cloudflare](https://docs.astro.build/en/guides/integrations-guide/cloudflare/)
adapter. Static pages prerender at build time and are served from the
Worker's `ASSETS` binding; routes that opt out of prerender (e.g.
`/api/contact`) run dynamically in the Worker. Hosting and bandwidth are
free at this scale; the only cost is the domain renewal.

## One-off setup

### 1. Push the repo to GitHub

If the repo is not yet on GitHub:

```sh
gh repo create mountain-heritage-trust/mountain-heritage-org --private --source=. --push
```

Then update `public/admin/config.yml`:

```yaml
backend:
  name: github
  repo: mountain-heritage-trust/mountain-heritage-org
```

### 2. Create the Cloudflare Pages project

1. In the Cloudflare dashboard, go to **Workers & Pages → Create → Pages → Connect to Git**.
2. Authorise Cloudflare to access the GitHub repo.
3. Select the repo and configure the build:

   | Setting           | Value                |
   | ----------------- | -------------------- |
   | Framework preset  | Astro                |
   | Build command     | `npm run build`      |
   | Build output      | `dist`               |
   | Root directory    | `/` (default)        |
   | Node version      | `20` or later        |

4. Click **Save and Deploy**. Cloudflare will build and serve the first
   version on a `*.pages.dev` URL.

### 3. Attach the custom domain

> **Staging note.** While DNS for `mountain-heritage.org` lives at the
> trust's existing provider, the new site runs on its `*.pages.dev` URL
> only. Skip step 3 until DNS is migrated to Cloudflare. Pages, Resend
> (with the shared sender) and Cloudflare Access all work fine on the
> pages.dev URL in the meantime.


1. **Workers & Pages → mountain-heritage-org → Custom domains → Set up a custom domain**.
2. Add `www.mountain-heritage.org`.
3. Update DNS: Cloudflare prompts you to point a CNAME at the Pages subdomain.
   If the domain is already on Cloudflare DNS, this is one click. If not,
   either move DNS to Cloudflare or add the CNAME at your current DNS host.
4. Apex redirect: also add `mountain-heritage.org` (without `www`) and use a
   bulk redirect or page rule to forward to `www.mountain-heritage.org`.

### 4. Environment variables

Pages dashboard → **Settings → Environment variables**. Set for both
**Production** and **Preview**:

| Variable          | Where to get it                         |
| ----------------- | --------------------------------------- |
| `RESEND_API_KEY`  | Resend dashboard → API Keys.            |
| `CONTACT_EMAIL`   | `enquiries@mountain-heritage.org`.      |
| `FROM_EMAIL`      | A Resend-verified sender. **Staging:** `onboarding@resend.dev` (Resend's shared sender — works without domain verification). **Production:** `noreply@mountain-heritage.org` once the domain is verified in Resend (needs DNS access). |

In production, verify the trust's domain in Resend before setting
`FROM_EMAIL` to a custom address — Resend won't send from an unverified
domain.

### 5. Cloudflare Access on `/admin`

See `docs/auth.md` for full instructions. In short: create an Access
application gating `https://www.mountain-heritage.org/admin/*`, set the IdP
to Google Workspace, and restrict to the `mountain-heritage.org` domain.

## Environments

There are two Workers, both built from this repo (see `wrangler.jsonc` and
[plans/prod-releases.md](plans/prod-releases.md)):

| Environment | Worker | Deploys when |
| --- | --- | --- |
| **Staging** | `mountain-heritage-org` | Cloudflare's Git build runs on every push to `main`. |
| **Production** | `mountain-heritage-org-prod` | GitHub Actions only — on a `vX.Y.Z` tag, or a trustee CMS edit. |

## Day-to-day deploys

- **Push to `main`** (developer code) → **staging** rebuilds via Cloudflare.
  Production is *not* touched until you promote it.
- **Promote to production** → run `/deploy --patch|--minor|--major`, which tags
  a release and pushes the tag. `.github/workflows/deploy-production.yml` then
  builds and runs `wrangler deploy --name mountain-heritage-org-prod`.
- **Edits in Sveltia CMS** → the trustee saves → a commit marked `[cms]` lands on
  `main` → staging rebuilds **and** the production workflow auto-bumps the patch
  version and deploys. Trustee edits go live with no extra steps.

Staging build time is typically under 60 seconds.

### Production prerequisites (one-off)

The production workflow needs these GitHub repository secrets:

| Secret | Value |
| --- | --- |
| `CLOUDFLARE_API_TOKEN` | A token scoped to *Workers Scripts: Edit* for the account. |
| `CLOUDFLARE_ACCOUNT_ID` | The Cloudflare account ID. |

The first production run creates the `mountain-heritage-org-prod` Worker. Set its
environment variables (`RESEND_API_KEY`, `CONTACT_EMAIL`, `FROM_EMAIL`), attach
`www.mountain-heritage.org` once DNS migrates, and protect its `/admin` with
Cloudflare Access (see [auth.md](auth.md)). Bootstrap an initial `v0.1.0` tag.

## Rollbacks

- **Production:** re-run the *Deploy production* workflow via **Actions → Run
  workflow** and supply an older tag (e.g. `v1.2.3`) in the input. Alternatively,
  roll back in **Workers & Pages → mountain-heritage-org-prod → Deployments**.
- **Staging:** roll back in the Cloudflare dashboard under the staging Worker's
  Deployments, or push a fix to `main`.

## Local preview of a Pages build

To exercise both the static site and the Pages Functions (e.g. the contact
form) locally:

```sh
npm run build
npx wrangler pages dev dist --compatibility-date=2024-01-01
```

Visit `http://localhost:8788`. POSTs to `/api/contact` will hit the function.

To pass env vars locally, create `.dev.vars` (gitignored) at the repo root:

```
RESEND_API_KEY=re_...
CONTACT_EMAIL=enquiries@mountain-heritage.org
FROM_EMAIL=noreply@mountain-heritage.org
```

## Monitoring

- **Build & deploy logs** — Pages dashboard.
- **Function invocations and errors** — Pages dashboard → Functions tab.
- **Access logs** — Cloudflare → Web Analytics (free, privacy-friendly).
  Enable in the Pages project settings.
