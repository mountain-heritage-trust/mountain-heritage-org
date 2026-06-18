---
description: Deploy to staging (push main) or promote to production (tag a release)
argument-hint: "[--patch | --minor | --major]"
allowed-tools: Bash(git *), Bash(npm run build), Bash(npm run check)
---

You are running the project's deploy workflow. Arguments: `$ARGUMENTS`.

See `docs/deployment.md` and `docs/plans/prod-releases.md` for the full model.
In short: pushing `main` rebuilds **staging**; pushing a `vX.Y.Z` tag deploys
**production** via GitHub Actions.

## If no argument was given → deploy to STAGING

1. Run `npm run build`. If it fails, stop and report the error.
2. Show the user `git status` and the unpushed commits (`git log origin/main..HEAD --oneline`).
3. Push the current branch: `git push`.
4. Tell the user staging will rebuild via Cloudflare within ~1 minute.

## If `--patch`, `--minor`, or `--major` was given → promote to PRODUCTION

This tags a release, which triggers the production deploy. Be careful — this is
user-facing.

1. **Preconditions** (stop and report if any fail):
   - On the `main` branch.
   - Working tree is clean (`git status --porcelain` is empty).
   - `git fetch` then confirm `HEAD` equals `origin/main` (we only promote a
     commit already pushed and built on staging).
2. Run `npm run build`. If it fails, stop.
3. Find the latest tag: `git tag --list 'v*.*.*' --sort=-v:refname | head -n1`
   (treat missing as `v0.0.0`). Compute the next version by incrementing the
   major / minor / patch component per the argument (resetting lower components
   to 0 for major/minor).
4. **Confirm with the user**: show the new version and the commit subject being
   promoted, and ask them to confirm before proceeding.
5. Create and push an annotated tag:
   - `git tag -a vX.Y.Z -m "release vX.Y.Z"`
   - `git push origin vX.Y.Z`
6. Tell the user GitHub Actions will build and deploy production, and that they
   can watch it in the repo's Actions tab.

Note: trustee edits made through `/admin` deploy to production automatically, so
`/deploy --patch` is only needed to promote **developer** changes.
