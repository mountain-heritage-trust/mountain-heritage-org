# Contact form

The site has a single form: `src/pages/contact.astro` posting to
`functions/api/contact.ts`, a Cloudflare Pages Function. The function
forwards messages by email via [Resend](https://resend.com).

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

The contact form will not actually send mail in `npm run dev` (the function
runs in Pages, not in Astro's dev server). Test the page UI in dev; test the
function via Cloudflare's `wrangler pages dev` (see `docs/deployment.md`).

## Future improvements

- Add Turnstile.
- Rate-limit per IP via Cloudflare Pages Functions middleware.
- Persist submissions to a Cloudflare D1 table for backup, in case the email
  delivery fails.
