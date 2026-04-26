# Deployment

The site deploys to **Cloudflare Pages**. Hosting and bandwidth are free at
this scale; the only cost is the domain renewal.

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
| `FROM_EMAIL`      | A Resend-verified address on the trust's domain, e.g. `noreply@mountain-heritage.org`. |

Verify the trust's domain in Resend before setting `FROM_EMAIL` — Resend
won't send from an unverified domain.

### 5. Cloudflare Access on `/admin`

See `docs/auth.md` for full instructions. In short: create an Access
application gating `https://www.mountain-heritage.org/admin/*`, set the IdP
to Google Workspace, and restrict to the `mountain-heritage.org` domain.

## Day-to-day deploys

- **Push to `main`** → Cloudflare builds and deploys to production.
- **Open a PR** → Cloudflare deploys a preview to a unique URL on
  `*.pages.dev` (also visible as a check on the PR).
- **Edits in Sveltia CMS** → trustee saves → commit lands on `main` → same
  build pipeline as a normal push.

Build time is typically under 60 seconds for this site.

## Rollbacks

Pages keeps every previous deployment. To roll back:

1. **Workers & Pages → mountain-heritage-org → Deployments**.
2. Find the previous good deployment.
3. Click the menu → **Rollback to this deployment**.

This is instant and does not require touching git.

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
