// Shared helpers for the shop. See docs/shop.md.
//
// The product catalogue is the `shop` content collection (edited by
// trustees in the CMS). Stripe is only used at checkout: the Worker route
// in src/pages/api/checkout.ts builds a Checkout Session from this
// catalogue using inline prices, so nothing has to be configured in the
// Stripe Dashboard per product.

import { getCollection, type CollectionEntry } from 'astro:content';
import settings from '../content/settings/shop.json';

export type Product = CollectionEntry<'shop'>;

/** Products visible on the site (not drafts), in display order. */
export async function getPublishedProducts(): Promise<Product[]> {
  const items = (await getCollection('shop')).filter((p) => !p.data.draft);
  items.sort((a, b) => {
    const ao = a.data.order ?? 999;
    const bo = b.data.order ?? 999;
    if (ao !== bo) return ao - bo;
    return a.data.title.localeCompare(b.data.title);
  });
  return items;
}

/** Pounds (as stored in frontmatter) → integer pence for Stripe. */
export function toPence(pounds: number): number {
  return Math.round(pounds * 100);
}

export function formatGbp(pounds: number): string {
  return new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(pounds);
}

export const shopSettings = {
  intro: (settings.intro ?? '').trim(),
  shippingLabel: (settings.shippingLabel ?? '').trim() || 'Royal Mail (UK delivery)',
  shippingPrice: Number(settings.shippingPrice ?? 0) || 0,
};

/**
 * Shape of the catalogue embedded in the basket page for the client-side
 * script. Kept deliberately small — only what the basket UI needs.
 */
export interface CatalogueItem {
  slug: string;
  title: string;
  price: number;
  cover: string | null;
  soldOut: boolean;
}

export function toCatalogue(products: Product[]): CatalogueItem[] {
  return products.map((p) => ({
    slug: p.id,
    title: p.data.title,
    price: p.data.price,
    cover: p.data.cover ?? null,
    soldOut: p.data.soldOut,
  }));
}

/** Upper bound on quantity per line, mirrored in the client script. */
export const MAX_QTY = 10;
