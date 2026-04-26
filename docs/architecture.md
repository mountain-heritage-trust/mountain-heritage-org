# Architecture

## Project

The website for Mountain Heritage Trust, a small UK charity. It replaces the existing site at https://www.mountain-heritage.org/. Content is largely static: about, blog posts, events, contact, donate.

## Goals shaping the architecture

1. **Non-technical trustees can edit content** without learning git, markdown, or Astro.
2. **Low hosting cost** — target near-£0/month for hosting and CMS.
3. **Strong succession story** — another developer should be able to take this over with minimal handover.
4. **Preserve existing URLs** — no dead links from the old site.
5. **Domain-restricted SSO for editors** using Google Workspace (`@mountain-heritage.org`).

## Stack

| Layer            | Choice                                                                | Role                                                                  |
| ---------------- | --------------------------------------------------------------------- | --------------------------------------------------------------------- |
| Site generator   | [Astro](https://astro.build)                                          | Builds static HTML from markdown + components.                        |
| Source of truth  | GitHub repo                                                           | All content and code lives here as files.                             |
| CMS              | [Sveltia CMS](https://github.com/sveltia/sveltia-cms)                 | Browser-based editor for trustees. Commits to GitHub on save.         |
| Hosting          | [Cloudflare Pages](https://pages.cloudflare.com)                      | Watches the repo, builds on push, serves the static output globally.  |
| Auth for `/admin`| Cloudflare Access (Zero Trust)                                        | Restricts CMS access to `@mountain-heritage.org` Google accounts.     |
| Forms            | Cloudflare Pages Functions                                            | Handles contact form submissions.                                     |
| Donations        | TBD (Donorbox / Stripe Payment Link / CAF Donate)                     | Embedded link or button. Not built in-house.                          |

## How content flows

```
Trustee edits in browser  ──►  Sveltia CMS at /admin
                                       │
                                       │ commits to
                                       ▼
                                 GitHub repo  ◄──── developer commits via PR
                                       │
                                       │ webhook
                                       ▼
                            Cloudflare Pages build
                                       │
                                       ▼
                            Static site on global CDN
```

A trustee never sees git, the build, or any code. They open `/admin`, log in with their Google Workspace account, edit a page visually, and click save. The site rebuilds within roughly a minute.

## Repository layout (planned)

```
.
├── AGENTS.md              — entry point for developers and LLMs
├── CLAUDE.md              — symlink to AGENTS.md
├── docs/                  — architecture and how-to documentation
├── src/
│   ├── content/           — markdown content collections (pages, posts, events)
│   ├── layouts/           — Astro layouts
│   ├── components/        — Astro components
│   └── pages/             — routes; mostly thin wrappers around content collections
├── public/
│   ├── admin/             — Sveltia CMS bundle and config.yml
│   └── _redirects         — Cloudflare redirects (preserves old URLs)
├── functions/             — Cloudflare Pages Functions (e.g., /api/contact)
└── astro.config.mjs
```

## Why this stack

- **Astro** produces plain HTML — no runtime framework, fast pages, accessible by default, and the output is portable if we ever swap hosts.
- **Cloudflare Pages** has a generous free tier (unlimited bandwidth, 500 builds/month) and bundles Functions, Access, and Turnstile in the same console.
- **Sveltia CMS** is a maintained, modern fork of Decap CMS with better UX. Free, OSS, no vendor account needed. Editors authenticate via GitHub OAuth or — in our case — Cloudflare Access in front of `/admin`.
- **GitHub as source of truth** means content is just files in a repo. If any tool in this stack disappears, the content survives untouched.

## Key constraints for anyone making changes

- **URL preservation is non-negotiable.** Any URL change must have a corresponding entry in `public/_redirects`. Old URLs from `mountain-heritage.org` must continue to resolve.
- **CMS-editable fields must stay simple.** Trustees are non-technical. Avoid exposing fields they could break the site with (raw HTML, layout switches). Prefer a small number of well-named fields per content type.
- **No paid services without discussion.** Hosting and tooling are free today; keep it that way unless there's a strong reason.
- **Documentation grows with the code.** When you add or change a feature, update the relevant `docs/` page in the same change.
