# Shop

A small online shop at `/shop` for books and similar items. The product
catalogue lives in this repo (edited by trustees in the CMS); Stripe handles
the checkout, card payment, receipt and refunds. Nothing needs to be set up
per product in the Stripe Dashboard.

## How it fits together

```
Trustee adds a product in /admin  ──►  src/content/shop/<slug>.md
                                              │ build
                                              ▼
              /shop (listing)   /shop/<slug> (product page)   — prerendered
                                              │ "Add to basket" (JS)
                                              ▼
                     localStorage basket  ──►  /shop/basket (prerendered,
                                               rendered client-side)
                                              │ POST items=[{slug, qty}]
                                              ▼
                     /api/checkout (Cloudflare Worker route)
                       • looks each slug up in the catalogue
                       • rejects drafts / sold-out / unknown items
                       • creates a Stripe Checkout Session with
                         inline prices + flat-rate shipping
                                              │ 303
                                              ▼
                     Stripe-hosted checkout (address, card, receipt)
                                              │
                        success ──► /shop/success  (basket cleared)
                        cancel  ──► /shop/basket?cancelled=1
```

Key design decisions:

- **Catalogue in the repo, not Stripe.** Products are a normal content
  collection (`shop`), so they prerender like everything else, images go
  through the existing optimiser, trustees edit them in the CMS, and staging
  and production can use different Stripe keys without any product mapping.
- **Inline prices.** The Worker sends each line to Stripe as `price_data`
  (name, amount, image) built from the catalogue. No Stripe Products/Prices
  need to exist. The trade-off is that Stripe's product list fills with
  auto-created entries; if the trust later wants per-product reporting in
  Stripe, switch to Price lookup keys (see "Future options").
- **Nothing from the browser is trusted.** The basket only holds slugs and
  quantities. Prices, titles and availability are resolved server-side.
- **No stock counts.** A `soldOut` toggle keeps a product visible but
  unbuyable. Real inventory would need a database; avoid unless needed.
- **No webhook (yet).** Stripe emails the buyer a receipt. Turn on
  Dashboard → Settings → Notifications → "Successful payments" so the trust
  is emailed for each order. Orders are fulfilled from the Stripe Dashboard
  (Payments → each payment shows items, delivery address and phone).

## Pre-launch state

The shop is currently **not public**:

- `SHOP_PUBLIC` in `src/lib/shop-flags.ts` is `false`, which removes the
  Shop link from the header and leaves `/shop*` out of the sitemap. The
  pages still build and work if you know the URL.
- A Cloudflare Access application gates `/shop`, `/shop/*` and
  `/api/checkout` so only `@mountain-heritage.org` accounts can reach them.
  See [auth.md](auth.md) → "Pre-launch gating of the shop".

**To launch:** set `SHOP_PUBLIC = true`, delete (or disable) the Access
application, and promote a release. Both steps are needed — flipping the
flag alone would send visitors to a login wall.

## Files

| Path | Role |
| --- | --- |
| `src/content/shop/*.md` | Products (CMS collection **Shop products**). |
| `src/content/settings/shop.json` | Shop intro text, delivery option name and price (CMS: **Site settings → Shop**). |
| `src/content.config.ts` | `shop` schema. Keep in sync with `public/admin/config.yml`. |
| `src/lib/shop-flags.ts` | `SHOP_PUBLIC` launch switch (header link + sitemap). |
| `src/lib/shop.ts` | Helpers: published products, price formatting, settings, catalogue shape for the basket page. |
| `src/pages/shop/index.astro` | Listing. |
| `src/pages/shop/[slug].astro` | Product page (with Schema.org `Product`). |
| `src/pages/shop/basket.astro` | Basket — static shell + embedded catalogue JSON, rendered client-side. |
| `src/pages/shop/success.astro` | Post-payment thank-you; clears the basket. |
| `src/pages/api/checkout.ts` | Worker route that creates the Stripe Checkout Session. |
| `src/scripts/basket.ts` | Client basket (localStorage), header badge, add-to-basket buttons. |
| `src/components/BasketLink.astro` | Header basket link, hidden until the basket has items. |

## Product fields

```yaml
---
title: Chris Bonington, Mountaineer
price: 12.99          # pounds; converted to pence for Stripe
summary: One-line standfirst shown on the shop page.   # optional
cover: /uploads/bonington-cover.jpg                    # optional
soldOut: false        # visible but unbuyable when true
draft: false          # hidden from the site when true
order: 1              # optional; lower first
---

Full description in markdown.
```

## Shipping

UK only, one flat rate per order, charged by Stripe as a shipping option.
Both the label ("Royal Mail (UK delivery)") and the price are in
`src/content/settings/shop.json` and editable by trustees. Set the price to
`0` for free delivery. To allow other countries, extend
`shipping_address_collection.allowed_countries` in `checkout.ts` and add
further `shipping_options`; more than a couple of rates is a sign to
reconsider the approach.

## VAT and Gift Aid

The trust is below the VAT threshold and mostly sells zero-rated books, so
Stripe Tax is not enabled. Shop purchases are not donations and are not
eligible for Gift Aid; the donate page is separate.

## Environment variables

| Variable | Where |
| --- | --- |
| `STRIPE_SECRET_KEY` | Cloudflare → Workers & Pages → *worker* → Settings → Variables and Secrets, type **Secret**. Use the **test** key (`sk_test_…`) on `mountain-heritage-org` (staging) and the **live** key (`sk_live_…`) on `mountain-heritage-org-prod`. |

Use a **restricted** key rather than the account's full secret key: Stripe
Dashboard → Developers → API keys → Create restricted key, with only
*Checkout Sessions: Write*. Nothing else is needed.

If the key is missing, `/api/checkout` logs `checkout: missing env var
STRIPE_SECRET_KEY` and redirects to `/shop/basket?error=server`.

## Stripe account checklist (one-off)

1. Create the Stripe account for the trust and complete verification.
2. Consider applying for Stripe's nonprofit pricing (lower per-transaction
   fees). Apply via the support form at
   <https://support.stripe.com/contact/email?subject=Non+Profit+pricing>
   with the Stripe account ID, the account's registered email, the
   Charity Commission registration number / HMRC charity reference, and a
   statement of donation volume. **Caveat:** Stripe requires at least 80%
   of the account's payment volume to be tax-deductible donations
   (ticket, membership and product sales don't count). If the account is
   only used for the shop it won't qualify — apply only if donations are
   also moved onto Stripe (see `docs/donations.md`).
3. Settings → Branding: upload the logo and set the brand colour so the
   hosted checkout matches the site.
4. Settings → Notifications: email on successful payments.
5. Settings → Customer emails: enable receipts.
6. Developers → API keys: create the restricted keys (test + live) and add
   them to the two Workers as above.
7. Test with a card from `stripe:test-cards` (e.g. `4242 4242 4242 4242`)
   on staging before adding the live key.

## Local development

`npm run dev` renders the pages and the basket works, but the checkout
route needs the Worker runtime and a key:

```sh
printf 'STRIPE_SECRET_KEY=sk_test_...\n' > .dev.vars   # gitignored
npm run build
npx wrangler dev --local
```

Note that `wrangler dev` serves `dist/`; rebuilding while it is running
can crash it — restart it after a build.

## Behaviour of `/api/checkout`

| Input | Result |
| --- | --- |
| Malformed `items` (not JSON, bad slug, qty outside 1–10, > 20 lines) | `400 Bad request`. |
| Empty basket | Redirect `/shop/basket?error=empty`. |
| Any item unknown, draft or sold out | Redirect `/shop/basket?error=unavailable` (the basket page then prunes it). |
| Key missing or Stripe error | Redirect `/shop/basket?error=server` (details in Worker logs). |
| Success | `303` to the Stripe-hosted checkout. |

Astro's built-in origin check applies: the route only accepts same-origin
form posts.

## Future options

- **Order notifications to the office by email** — add a Stripe webhook
  route (`checkout.session.completed`) that sends via Resend, mirroring the
  contact form. Needs `STRIPE_WEBHOOK_SECRET` and signature verification.
- **Per-product reporting in Stripe** — give each product a `lookupKey`
  field, create matching Prices in Stripe (test and live), and have the
  route send `price: <id>` after resolving the key via
  `GET /v1/prices?lookup_keys[]=…`. Adds a Stripe step per product.
- **International delivery** — see "Shipping" above.
- **Order summary on the success page** — retrieve the session by
  `session_id` in a Worker route and render the items. Purely cosmetic.
