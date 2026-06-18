# Plan: separate production environment with tagged releases

**Status:** Approved — implementation in progress.
**Last updated:** 2026-06-18

## Goal

Today every push to `main` triggers a Cloudflare build that goes live within
~1 minute. That single environment is fine as a **staging** site, but we want a
separate **production** site with more control over *when* developer changes go
live — while keeping trustee content edits effortless (a save in `/admin` should
go live immediately).

## Approach (chosen: "Approach A")

Cloudflare's Git integration only builds on **branch** pushes, not on tags
([Workers build branches](https://developers.cloudflare.com/workers/ci-cd/builds/build-branches/)).
So production is driven by **GitHub Actions** instead, triggered by git tags.

### Two environments

| Environment | Worker | How it deploys |
| --- | --- | --- |
| Staging | `mountain-heritage-org` (existing) | Cloudflare Git build on every push to `main` (unchanged). URL: `mountain-heritage-org.remus-ddf.workers.dev`. |
| Production | `mountain-heritage-org-prod` (new) | GitHub Actions only. Gets `www.mountain-heritage.org` when DNS migrates. |

Both come from the same `wrangler.jsonc`; production is a named environment
(`--env production`) that overrides only the Worker name.

### What triggers a production deploy

A single workflow (`.github/workflows/deploy-production.yml`) deploys prod when:

1. **A `vX.Y.Z` tag is pushed** — the developer promotion path, done with the
   `/deploy` skill. Deploys the exact tagged commit.
2. **A trustee edits content in `/admin`** — Sveltia commits to `main` with a
   `[cms]` marker in the message (configured via `backend.commit_messages`). The
   workflow detects the marker, auto-increments the patch version, tags it, and
   deploys. This makes trustee edits go live with no extra steps.

Plain developer pushes to `main` (no tag, no `[cms]` marker) deploy **only to
staging** — they are not promoted to production until someone runs `/deploy`.

```
trustee saves in /admin ──> commit "[cms] …" on main ──> staging build (CF)
                                                     └──> GH Actions: bump patch, tag, deploy PROD

developer pushes code ─────> commit on main ─────────> staging build (CF) only
developer runs /deploy ────> push tag vX.Y.Z ────────> GH Actions: deploy PROD
```

### The `/deploy` skill

A project skill that wraps the git work:

- `/deploy` — runs `npm run build`, then pushes `main` (staging rebuilds via CF).
- `/deploy --patch | --minor | --major` — promotes the current `main` to
  production: verifies the tree is clean and in sync with `origin/main` (so we
  only ever promote a commit already built and checked on staging), builds,
  computes the next semver from the latest tag, creates an annotated tag, and
  pushes it (which triggers the production deploy). Asks for confirmation first.

### Rollback

Re-deploy any previous tag. The production workflow also accepts a manual
`workflow_dispatch` run with a version input, so rolling back = run it with an
older tag. Cloudflare also keeps prior deployments in the dashboard.

## External setup required (cannot be done from the repo)

These must be in place before the production workflow will succeed:

1. **GitHub repository secrets:** `CLOUDFLARE_API_TOKEN` (scoped to
   *Workers Scripts: Edit*) and `CLOUDFLARE_ACCOUNT_ID`.
2. **First production deploy** creates the `mountain-heritage-org-prod` Worker
   (the token must allow it), or create it once via `wrangler deploy --env production`.
3. **Custom domain:** attach `www.mountain-heritage.org` to the production Worker
   when DNS migrates to Cloudflare (see [deployment.md](../deployment.md)).
4. **Cloudflare Access:** protect the production `/admin` the same way as staging
   (see [auth.md](../auth.md)).
5. **Environment variables** on the production Worker: `RESEND_API_KEY`,
   `CONTACT_EMAIL`, `FROM_EMAIL` (same as staging).
6. **Bootstrap tag:** create an initial `v0.1.0` once the above is ready.

## Notes and decisions

- **Worker naming:** the existing Worker keeps its name (`mountain-heritage-org`)
  as staging to avoid breaking the CMS `base_url` that points at its workers.dev
  URL. Production is `-prod`. We can revisit naming when DNS migrates.
- **Build vs check gate:** the workflow gates on `npm run build` only. `npm run
  check` currently reports 8 pre-existing errors, so it can't be a hard gate
  until those are fixed; worth clearing separately so `check` can become a gate.
- **CMS detection** uses a `[cms]` marker in the commit message rather than the
  committer identity, so it is explicit and visible in `git log`.
- **No double deploys:** the auto-tag is pushed by the Actions `GITHUB_TOKEN`,
  which by design does not retrigger workflows, so the CMS path deploys inline
  without also firing the tag path.
