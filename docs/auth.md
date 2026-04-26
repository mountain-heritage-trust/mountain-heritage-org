# Authentication for /admin

The CMS at `/admin/*` is gated by **Cloudflare Access**, restricted to
Google Workspace users on `@mountain-heritage.org`. This is free for up to
50 users on Cloudflare's Zero Trust plan.

## Why Access in front of /admin

Two layers of auth protect the CMS:

1. **Cloudflare Access** — gatekeeper at the edge. If you don't have a
   `@mountain-heritage.org` Google account, you can't even reach the page.
2. **GitHub OAuth** — Sveltia's commit auth. The Cloudflare Access identity
   does not give the user write access to the GitHub repo; that has to be
   granted separately on GitHub.

Access at the edge means the public never sees the CMS UI, even
unauthenticated. It also gives us logs, IP allow-listing, and step-up auth
for free.

## One-off setup

### 1. Enable Cloudflare Zero Trust

In the Cloudflare dashboard:

1. Go to **Zero Trust** in the left nav. If this is the first time, you'll
   need to pick a team name (e.g. `mountain-heritage`). The team URL becomes
   `mountain-heritage.cloudflareaccess.com`.
2. Choose the **Free** plan (up to 50 users — fine for the trust).

### 2. Add Google Workspace as an identity provider

**Zero Trust → Settings → Authentication → Login methods → Add new → Google Workspace**.

Cloudflare needs three things from Google Workspace:

- A Service Account with admin privileges on the workspace.
- The trust's primary email domain (`mountain-heritage.org`).
- A Service Account JSON key.

Google's side:

1. Go to <https://console.cloud.google.com/> with a Workspace admin account.
2. Create or pick a project (e.g. `mountain-heritage-cf-access`).
3. Enable the **Admin SDK API**.
4. **IAM & Admin → Service Accounts → Create**.
5. Generate a JSON key and download it.
6. In **Workspace Admin Console → Security → API controls → Domain-wide delegation**,
   authorise the service account's client ID with these scopes:

   ```
   https://www.googleapis.com/auth/admin.directory.group.readonly,
   https://www.googleapis.com/auth/admin.directory.user.readonly
   ```

Paste the JSON key and admin email into the Cloudflare Access integration
form. Save and **Test**.

### 3. Create the Access application

**Zero Trust → Access → Applications → Add an application → Self-hosted.**

| Field                   | Value                                                       |
| ----------------------- | ----------------------------------------------------------- |
| Application name        | `Mountain Heritage Trust — CMS`                             |
| Session duration        | 24 hours                                                    |
| Application domain      | `www.mountain-heritage.org`                                 |
| Path                    | `/admin/*`                                                  |
| Identity providers      | Google Workspace (the one set up above)                     |

### 4. Add an Access policy

In the same app, **Policies → Add a policy**:

| Field          | Value                              |
| -------------- | ---------------------------------- |
| Policy name    | `MHT staff & trustees`             |
| Action         | Allow                              |
| Include rule   | **Emails ending in** `@mountain-heritage.org` |

Save.

### 5. Test

1. Open `https://www.mountain-heritage.org/admin/` in a private window.
2. Cloudflare should redirect to a "sign in with Google" prompt.
3. Sign in with your `@mountain-heritage.org` account.
4. You should be redirected back to the Sveltia CMS dashboard.

If something goes wrong, **Zero Trust → Logs → Access** shows every attempt
and why it was allowed or denied.

## What if a trustee logs in but Sveltia still won't let them save?

That means Cloudflare Access let them through but GitHub refused the commit.
Solution: grant their GitHub user **Write** access on the repo
(`Settings → Collaborators → Add people`).

Cloudflare Access and GitHub auth are entirely separate identity systems.
Adding a trustee is a two-step process:

1. Cloudflare side — handled automatically by their Google Workspace
   account.
2. GitHub side — invite their GitHub user to the repo.

Document both steps in `docs/trustee-guide.md` so onboarding doesn't have a
hidden gotcha.

## Removing access

If a trustee leaves the trust:

- Disable their Google Workspace account → Cloudflare Access denies them
  immediately. Nothing else needed for the CMS UI.
- Remove their GitHub user from the repo → they can no longer push commits.

Both steps are needed. Just disabling Google Workspace stops them seeing
`/admin`, but if they had a personal access token cached they could still
push to the repo until removed.
