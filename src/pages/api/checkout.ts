// Shop checkout — creates a Stripe Checkout Session and redirects to it.
// Runs in the Cloudflare Worker (via @astrojs/cloudflare). See docs/shop.md.
//
// The browser posts the basket as `items` (JSON: [{ slug, qty }]). Nothing
// else from the client is trusted: titles and prices come from the `shop`
// content collection bundled into the Worker at build time, and the
// shipping rate comes from src/content/settings/shop.json. Line items are
// sent to Stripe as inline `price_data`, so no products or prices need to
// exist in the Stripe Dashboard.

import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { getCollection } from 'astro:content';
import { toPence, shopSettings } from '../../lib/shop';

export const prerender = false;

const MAX_QTY = 10;
const MAX_LINES = 20;
const SLUG_RE = /^[a-z0-9-]+$/;

interface Line {
  slug: string;
  qty: number;
}

function redirectTo(request: Request, path: string, query = ''): Response {
  const url = new URL(path, request.url);
  url.search = query;
  return Response.redirect(url.toString(), 303);
}

function parseItems(raw: FormDataEntryValue | null): Line[] | null {
  if (typeof raw !== 'string') return null;
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }
  if (!Array.isArray(parsed) || parsed.length > MAX_LINES) return null;
  const lines: Line[] = [];
  for (const entry of parsed) {
    if (!entry || typeof entry !== 'object') return null;
    const { slug, qty } = entry as Record<string, unknown>;
    if (typeof slug !== 'string' || !SLUG_RE.test(slug)) return null;
    if (typeof qty !== 'number' || !Number.isInteger(qty) || qty < 1 || qty > MAX_QTY) return null;
    if (lines.some((l) => l.slug === slug)) return null;
    lines.push({ slug, qty });
  }
  return lines;
}

/**
 * Flatten a nested object into Stripe's form-encoded bracket syntax:
 * { line_items: [{ quantity: 1 }] } → line_items[0][quantity]=1
 */
function encodeForm(params: Record<string, unknown>): URLSearchParams {
  const out = new URLSearchParams();
  const walk = (value: unknown, prefix: string) => {
    if (value === undefined || value === null) return;
    if (Array.isArray(value)) {
      value.forEach((v, i) => walk(v, `${prefix}[${i}]`));
    } else if (typeof value === 'object') {
      for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
        walk(v, prefix ? `${prefix}[${k}]` : k);
      }
    } else {
      out.append(prefix, String(value));
    }
  };
  walk(params, '');
  return out;
}

export const POST: APIRoute = async ({ request }) => {
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return new Response('Bad request', { status: 400 });
  }

  const lines = parseItems(form.get('items'));
  if (lines === null) return new Response('Bad request', { status: 400 });
  if (lines.length === 0) return redirectTo(request, '/shop/basket', '?error=empty');

  const products = await getCollection('shop');
  const bySlug = new Map(products.map((p) => [p.id, p]));

  const origin = new URL(request.url).origin;
  const lineItems = [];
  for (const line of lines) {
    const product = bySlug.get(line.slug);
    if (!product || product.data.draft || product.data.soldOut) {
      return redirectTo(request, '/shop/basket', '?error=unavailable');
    }
    lineItems.push({
      quantity: line.qty,
      adjustable_quantity: { enabled: true, minimum: 1, maximum: MAX_QTY },
      price_data: {
        currency: 'gbp',
        unit_amount: toPence(product.data.price),
        product_data: {
          name: product.data.title,
          ...(product.data.cover ? { images: [new URL(product.data.cover, origin).toString()] } : {}),
          metadata: { slug: product.id },
        },
      },
    });
  }

  const { STRIPE_SECRET_KEY } = env;
  if (!STRIPE_SECRET_KEY) {
    console.error('checkout: missing env var STRIPE_SECRET_KEY');
    return redirectTo(request, '/shop/basket', '?error=server');
  }

  const params = {
    mode: 'payment',
    submit_type: 'pay',
    locale: 'en-GB',
    line_items: lineItems,
    // UK-only delivery, single flat rate. Both are configured by trustees
    // in the CMS (Site settings → Shop).
    shipping_address_collection: { allowed_countries: ['GB'] },
    shipping_options: [
      {
        shipping_rate_data: {
          type: 'fixed_amount',
          display_name: shopSettings.shippingLabel,
          fixed_amount: { amount: toPence(shopSettings.shippingPrice), currency: 'gbp' },
        },
      },
    ],
    billing_address_collection: 'auto',
    phone_number_collection: { enabled: true },
    success_url: `${origin}/shop/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/shop/basket?cancelled=1`,
    // Human-readable summary visible on the payment in the Dashboard.
    metadata: {
      source: 'mountain-heritage.org shop',
      items: lines.map((l) => `${l.slug} x${l.qty}`).join(', ').slice(0, 500),
    },
  };

  const res = await fetch('https://api.stripe.com/v1/checkout/sessions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${STRIPE_SECRET_KEY}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: encodeForm(params),
  });

  if (!res.ok) {
    console.error('checkout: Stripe error', res.status, await res.text());
    return redirectTo(request, '/shop/basket', '?error=server');
  }

  const session = (await res.json()) as { url?: string };
  if (!session.url) {
    console.error('checkout: Stripe response had no url');
    return redirectTo(request, '/shop/basket', '?error=server');
  }

  return Response.redirect(session.url, 303);
};
