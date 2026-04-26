# Donations

The donate page (`src/pages/donate.astro`) lists three ways to give:

1. **JustGiving** (primary CTA) — handles Gift Aid automatically for UK
   donors. URL carried over from the previous site (CharityId 2927521).
2. **Bank transfer** — Unity Trust Bank account details are listed inline.
   These were already public on the previous site.
3. **Cheque** — payable to "Mountain Heritage Trust", posted to the
   Blencathra office.

The donate button in the site header (`src/components/DonateButton.astro`)
links to `/donate` rather than directly to a third-party page, so the page
remains the single place where the giving options live.

## Current setup: JustGiving

The trust already has a JustGiving page from the previous Webflow site. The
widget redirect URL is hard-coded in `src/pages/donate.astro` as
`justGivingUrl`. Donors clicking "Donate via JustGiving" land on JustGiving's
hosted donation form, where Gift Aid declarations are collected
automatically.

JustGiving charges a small platform fee per transaction (~5%). For a small
charity, the trade-off against Gift Aid uplift and donor familiarity is
generally worth it.

## Future option: CAF Donate

CAF Donate is worth considering as an alternative:

- Free for the donor and the charity for one-off Gift-Aided donations
  (lower fees than JustGiving).
- Gift Aid declarations are collected and processed by CAF.
- Requires the trust to register a CAF Donate account before use.

To switch to CAF Donate later:

1. Sign the trust up at <https://www.cafonline.org/charities/cafdonate>.
2. Replace `justGivingUrl` in `src/pages/donate.astro` with the CAF
   campaign URL, and update the surrounding copy.
3. Optionally keep JustGiving as a secondary CTA underneath.

This is tracked in `docs/todos.md` under "Optional improvements".

## Other alternatives

- **Stripe Payment Link** — lowest fees, but Gift Aid would become the
  trust's responsibility (declarations collected separately). Probably not
  worth it for a charity.

## Header CTA

The "Donate" button in the header is `src/components/DonateButton.astro`. It
links to `/donate`. If a future site-wide change is needed (e.g. to link
directly to CAF Donate from the header), update only this component — every
page picks up the change.

## Reporting

Donations themselves are handled by the chosen provider, not by this site.
The site has no record of who gave what; CAF/JustGiving/Stripe dashboards
are the source of truth.
