# Authentication for /admin

The CMS at `/admin/*` is gated by **Cloudflare Access**, with a **Google
OAuth** identity provider and a policy restricting access to emails ending
`@mountain-heritage.org`. Free for up to 50 users on Cloudflare Zero Trust.

## Why Access in front of /admin

Two layers of auth protect the CMS:

1. **Cloudflare Access** — gatekeeper at the edge. Without a
   `@mountain-heritage.org` Google account, you can't even reach the page.
2. **GitHub PAT or OAuth** — Sveltia's commit auth. The Cloudflare Access
   identity does not give the user write access to the GitHub repo; that
   has to be granted separately on GitHub.

Access at the edge means the public never sees the CMS UI even
unauthenticated. It also gives us logs, IP allow-listing and step-up auth
for free.

## One-off setup

### 1. Enable Cloudflare Zero Trust

In the Cloudflare dashboard:

1. Open **Zero Trust** in the left nav.
2. First time: pick a **team name** (becomes `<team>.cloudflareaccess.com`).
   We use `mountain-heritage`.
3. Choose the **Free** plan.

### 2. Create a Google OAuth client

In **Google Cloud Console** (signed in with a `@mountain-heritage.org`
Workspace admin account):

1. Create or select a project — e.g. `mht-cloudflare-access`.
2. **APIs & Services → OAuth consent screen**:
   - **User type**: **Internal** (locks sign-in to the Workspace; no app
     verification needed).
   - App name: `Mountain Heritage Trust admin`.
   - Authorized domain: `cloudflareaccess.com`.
   - Save.
3. **APIs & Services → Credentials → Create credentials → OAuth client ID**:
   - Application type: **Web application**.
   - Name: `Cloudflare Access`.
   - Authorized redirect URI:

     ```
     https://<team>.cloudflareaccess.com/cdn-cgi/access/callback
     ```

   - Create. Copy the **Client ID** and **Client secret**.

### 3. Add the IdP in Cloudflare

**Zero Trust → Settings → Authentication → Login methods → Add new → Google**:

- App ID: the Client ID.
- Client secret: the Client secret.
- Save and click **Test** — a `@mountain-heritage.org` account should sign
  in successfully.

> **Why Google, not Google Workspace.** Cloudflare offers two Google IdPs.
> The "Google Workspace" one uses a service account with domain-wide
> delegation and lets you read group membership for fine-grained policies.
> We don't need that — a simple "email ending in `@mountain-heritage.org`"
> policy on top of the regular Google IdP gives the same effective gate
> with much less setup.

### 4. Create the Access application

**Zero Trust → Access → Applications → Add an application → Self-hosted**:

| Field                | Value                                                |
| -------------------- | ---------------------------------------------------- |
| Application name     | `MHT — CMS`                                          |
| Session duration     | 24 hours                                             |
| Subdomain            | `mountain-heritage-org.remus-ddf` *(staging)*        |
| Domain               | `workers.dev` *(staging)*                            |
| Path                 | `admin/*`                                            |
| Identity providers   | Google (the one set up above)                        |

When DNS migrates and the custom domain is attached, add
`www.mountain-heritage.org` / `/admin/*` as an additional domain on the
same application. Keep the workers.dev entry in place during the
transition.

### 5. Add a policy

In the same application, **Policies → Add a policy**:

| Field          | Value                                              |
| -------------- | -------------------------------------------------- |
| Policy name    | `MHT staff & trustees`                             |
| Action         | Allow                                              |
| Include rule   | **Emails ending in** `@mountain-heritage.org`      |

Save.

### 6. Test

1. Open `https://mountain-heritage-org.remus-ddf.workers.dev/admin/` in a
   private window.
2. Cloudflare redirects you to a "sign in with Google" page.
3. Sign in with a `@mountain-heritage.org` account → you should be
   redirected to the Sveltia CMS UI.
4. Try a non-`@mountain-heritage.org` account → "Access denied".

If something goes wrong, **Zero Trust → Logs → Access** shows every
attempt and the reason. Most issues are typos in the policy or in the
OAuth redirect URI.

## What if a trustee logs in but Sveltia still won't let them save?

That means Cloudflare Access let them through but GitHub refused the
commit. Sveltia uses GitHub auth (a PAT or OAuth) to actually push edits.

Cloudflare Access and GitHub auth are entirely separate identity systems.
Adding a trustee is a two-step process:

1. **Cloudflare side** — automatic for any `@mountain-heritage.org`
   Workspace account.
2. **GitHub side** — invite their GitHub user to the repo with **Write**
   access (`Settings → Collaborators → Add people`).

If a trustee doesn't have a GitHub OAuth proxy set up, Sveltia falls back
to asking for a Personal Access Token. Generating a fine-grained PAT is
documented at <https://github.com/settings/personal-access-tokens> —
needs Contents: Read & write on this repo.

## Removing access

If a trustee leaves the trust:

- Disable their Google Workspace account → Cloudflare Access denies them
  immediately. Nothing else needed for the CMS UI.
- Remove their GitHub user from the repo → they can no longer push commits.
- Revoke any GitHub PATs they created — `https://github.com/settings/tokens`.

All three steps are needed. Stopping just one is incomplete.
