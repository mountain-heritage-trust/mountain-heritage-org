# Plan: e-commerce shop and membership

**Status:** Draft for discussion — not yet approved or started.
**Last updated:** 2026-06-18

This is a planning document only. No code has been written. It records the
goals, the decisions taken so far, a recommended approach, the likely costs,
and the questions still open before any build begins.

## Goals

- Sell small physical items (keyrings, books, magazines, and similar) to raise
  funds for the Trust.
- Offer an ongoing **membership** so supporters can contribute on a recurring
  basis, with basic subscription management (recurring payments, members can
  cancel/manage).
- Keep day-to-day running easy for non-technical trustees (adding products,
  seeing orders, managing stock).
- Present the shop at `/shop` so it feels part of this site.
- Ship within the **UK only**, at least to start.

## Decisions taken so far

These were agreed up front and drive the recommendation below:

| Decision | Choice |
| --- | --- |
| Monthly cost tolerance | A small fixed fee is acceptable (~£5–30/month). |
| Membership | Build as a recurring **subscription product** within the shop platform. |
| Storefront | **Embed** products into our own `/shop` page (keep the site's look). |
| Scale | Modest but growing — tens of products over time. |

## Recommended platform: Shopify (Basic)

Shopify fits the decisions above: a trustee-friendly admin, real inventory and
order management, embeddable buy buttons for `/shop`, and built-in subscription
support. It also handles the hard/risky parts (PCI-compliant card processing,
checkout, fraud) so we never touch card data — valuable for a small charity.

**Plan:** Shopify **Basic**. The cheaper **Starter** plan (£5/month) only
offers buy buttons/links with no real online store and is too limited for a
growing catalogue and for subscriptions. Basic gives the full product admin,
collections, abandoned-cart recovery, and supports the subscription tooling we
need.

### Costs (verify current figures at signup — Shopify changes pricing)

- **Basic plan:** ~£19/month billed annually, or ~£25/month billed monthly
  (annual billing saves ~25%). Promotional £1/month for the first 3 months is
  usually available.
- **Transaction fees (Shopify Payments):** ~2.0% + £0.25 per online transaction.
  Using a third-party payment gateway instead adds an extra Shopify fee, so we
  should use Shopify Payments.
- **Subscriptions:** Shopify's own **Shopify Subscriptions** app is free but
  requires Shopify Payments. Third-party subscription apps exist (more features)
  at extra monthly cost — not needed initially.
- **Realistic total:** roughly **£19–25/month + ~2% of sales**. This sits at the
  top of the agreed budget. Note: this is a deliberate paid service on a site
  that otherwise runs at near-£0/month — it should be justified by the income
  the shop and memberships generate.

Sources (2026): [Shopify pricing (UK)](https://www.charle.co.uk/articles/shopify-pricing/),
[Shopify Help — pricing overview](https://help.shopify.com/en/manual/intro-to-shopify/pricing-plans/pricing-overview).

## How `/shop` would integrate

- A new `/shop` page on this site (Astro) embeds Shopify's **Buy Button**:
  a small script plus product/collection embeds. The page keeps our header,
  footer, and styling.
- When a customer checks out, they are taken to Shopify's secure hosted
  checkout. We never handle card details.
- Add `/shop` to the header navigation and footer.
- If we later add a Content-Security-Policy to the site, we must allow
  Shopify's domains (e.g. `cdn.shopify.com`, `sdks.shopifycdn.com`,
  `*.myshopify.com`). There is no CSP today, so nothing blocks the embed now.

## Membership — important constraint

The agreed approach is "membership as a subscription product inside the shop".
There is a real Shopify limitation to design around:

> **Shopify's embeddable Buy Buttons do not support subscriptions.** Selling
> plans (recurring products) can only be sold through Shopify's own online
> store, the Shop app, POS, or a custom (headless) storefront — **not** through
> buy buttons embedded on another site.

Source: [Shopify Help — Buy Button](https://help.shopify.com/en/manual/online-sales-channels/buy-button),
[Shopify dev — subscriptions](https://shopify.dev/docs/apps/build/purchase-options/subscriptions).

So one-off products can be embedded on `/shop`, but the membership purchase
cannot be embedded the same way. Two workable options:

1. **Linked hosted page (recommended for v1).** Keep `/shop` embedding the
   physical products, and make "Become a member" a button that links to the
   membership product on Shopify's hosted online store / checkout. The membership
   page lives on Shopify rather than on our site. Lowest effort; the trade-off is
   that the membership signup looks like Shopify, not our site. The online store
   theme can be styled to broadly match.
2. **Headless storefront (more work).** Build a custom membership/cart flow on
   our site using Shopify's Storefront API, which *does* support selling plans.
   Best visual consistency, significantly more development and ongoing
   maintenance. Not recommended for v1.

Members manage/cancel their subscription via Shopify's customer portal.

## Charity and tax considerations (confirm with the Trust's accountant)

- **VAT:** selling goods is trading income. Charities have a small-scale trading
  tax exemption with limits; whether the Trust needs to register for VAT depends
  on turnover. Confirm before launch.
- **Gift Aid:** Gift Aid generally **cannot** be claimed on the purchase of
  goods, and membership that confers benefits usually doesn't qualify unless
  carefully structured within HMRC benefit limits. A Shopify subscription
  "product" sale will **not** handle Gift Aid declarations. If Gift Aid on
  recurring support is important, regular giving through a donation platform
  (e.g. CAF/JustGiving, already used for one-off donations) is more suitable than
  a shop subscription. This is a genuine trade-off against the "subscription in
  the shop" decision — worth an explicit accountant view.
- **Terms:** we'll need a shop returns/refunds policy and to update the privacy
  notice to cover order data held by Shopify.

## Operations

- **UK-only shipping:** set Shopify shipping zones to the UK; choose flat-rate or
  weight-based postage. Factor packaging and postage costs into pricing.
- **Fulfilment:** trustees pack and post orders; order notifications come by
  email and in the Shopify admin. Decide who owns this day-to-day.
- **Stock:** managed in Shopify; low-stock visibility built in.

## Suggested phased implementation (when approved)

- **Phase 0 — setup:** start a Shopify Basic trial; complete Shopify Payments
  onboarding (charity business details and bank account); decide membership
  tiers, prices, and benefits.
- **Phase 1 — physical shop:** create products and collections; configure UK
  shipping; build the `/shop` page with embedded buy buttons; add nav/footer
  links; write returns/T&Cs and update the privacy notice; test a real checkout.
- **Phase 2 — membership:** install Shopify Subscriptions; create the membership
  product with a selling plan; link "Become a member" from `/shop` and the
  donate page; test the recurring payment and the member self-service portal.

## Open questions / decisions still needed

1. **Gift Aid:** does recurring membership need to be Gift Aid-eligible? If yes,
   reconsider handling membership via a giving platform rather than the shop.
2. **VAT / trading exemption:** accountant confirmation before launch.
3. **Fulfilment owner:** who packs, posts, and manages stock?
4. **Postage model and packaging costs.**
5. **Membership tiers, prices, and benefits.**
6. **Checkout branding:** do we want a `shop.` subdomain (needs a DNS change) or
   is the default `*.myshopify.com` checkout fine?
7. **Shopify Payments eligibility** for the charity entity and bank account.
8. **Returns/refunds policy** content.

## Alternatives considered

- **Ecwid / Lightspeed eCommerce:** embeds well into an existing site, has a free
  tier and cheaper paid tiers; subscriptions on paid plans. A cheaper embed-first
  option worth a look if Shopify's cost feels high.
- **Stripe Payment Links + Stripe Billing:** no fixed monthly fee (≈1.5% + 20p
  per UK card), and Stripe Billing handles **recurring membership** very well.
  Weaker as a product catalogue/admin for non-technical trustees. The strongest
  alternative specifically for the *membership* side if the in-shop subscription
  proves awkward — could even be combined with Shopify for products.
- **WooCommerce / Squarespace / BigCommerce:** either pull us onto WordPress
  hosting (against our boring, low-maintenance stack) or offer no real advantage
  here.

**Recommendation:** Shopify Basic for the shop and one-off products embedded at
`/shop`, with membership delivered via a linked Shopify-hosted subscription page
(option 1 above) for v1. Revisit Stripe Billing for membership if Gift Aid or
on-site consistency becomes a priority.

## Risks

- **Cost vs income:** the monthly fee and transaction fees must be covered by
  shop/membership income; review after a few months.
- **Split UX:** one-off products embed on our site, but membership signup lives
  on Shopify — two slightly different journeys until/unless we go headless.
- **Trustee time:** fulfilment and stock management are ongoing manual work.
- **Lock-in:** product/customer data lives in Shopify; ensure we can export it.
