# Contact form

The site has a single form: `src/pages/contact.astro` posting to
`src/pages/api/contact.ts`, an Astro API route that runs as a Cloudflare
Worker handler (via `@astrojs/cloudflare`). The handler forwards messages
by email via [Resend](https://resend.com).

> **Note.** The route opts out of static prerender via
> `export const prerender = false`, so it runs dynamically. Every other
> page in the site is still prerendered and served as plain static HTML
> via the Worker's static-assets binding.

## Why Resend

- Free tier covers our expected volume (3,000 emails/month, 100/day).
- Verifies the sending domain so messages don't go to spam.
- Plain HTTP API — no SMTP fiddling from a Cloudflare Worker.

## Environment variables (Cloudflare Pages → Settings → Environment variables)

| Variable          | Purpose                                                      |
| ----------------- | ------------------------------------------------------------ |
| `RESEND_API_KEY`  | API token from the Resend dashboard.                         |
| `CONTACT_EMAIL`   | Where to forward messages, e.g. `enquiries@mountain-heritage.org`. |
| `FROM_EMAIL`      | Verified sender on Resend, e.g. `noreply@mountain-heritage.org`. |

Set them once for **Production**, and once for **Preview** (you can point
preview at a test inbox to avoid noise).

## Anti-spam

- A honeypot field named `website` is rendered off-screen. Real users never
  see it; bots fill it. Submissions where it is non-empty are silently
  dropped (we still redirect to `?sent=1` so the bot thinks it succeeded).
- For a stronger layer, add Cloudflare Turnstile when ready (free, ships
  with Cloudflare). See <https://developers.cloudflare.com/turnstile/>.

## Behaviour

| Outcome                                       | Result                                  |
| --------------------------------------------- | --------------------------------------- |
| Valid submission, env vars set, Resend OK     | Redirect to `/contact?sent=1`.          |
| Honeypot filled                               | Redirect to `/contact?sent=1` silently. |
| Missing fields / bad email / overlong message | Redirect to `/contact?error=...`.       |
| Env vars missing or Resend errors             | Redirect to `/contact?error=server`.    |

The contact page reads `?sent` / `?error` from `Astro.url` and renders the
appropriate message above the form.

## Local development

In `npm run dev` the page UI works but the API route does not actually send
mail (no env vars, no real Worker runtime). To exercise the route end-to-end
locally:

```sh
npm run build
npx wrangler dev --local
```

Pass env vars via a gitignored `.dev.vars` file at the repo root:

```
RESEND_API_KEY=re_...
CONTACT_EMAIL=enquiries@mountain-heritage.org
FROM_EMAIL=onboarding@resend.dev
```

## Future improvements

- Add Turnstile.
- Rate-limit per IP via Cloudflare Pages Functions middleware.
- Persist submissions to a Cloudflare D1 table for backup, in case the email
  delivery fails.
