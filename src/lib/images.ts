// Build-time helpers for image records (the `images` collection).
// See docs/images.md.

import { getCollection, type CollectionEntry } from 'astro:content';
import { SHOP_PUBLIC } from './shop-flags';

export type ImageRecord = CollectionEntry<'images'>;

let byPath: Promise<Map<string, ImageRecord>> | null = null;

function normalise(src: string): string {
  try {
    return decodeURI(src);
  } catch {
    return src;
  }
}

/** The record for an image path like "/uploads/foo.jpg", if there is one. */
export async function getImageRecord(src: string | null | undefined): Promise<ImageRecord | undefined> {
  if (!src || !src.startsWith('/uploads/')) return undefined;
  byPath ??= getCollection('images').then((all) => new Map(all.map((r) => [r.data.image, r])));
  const map = await byPath;
  return map.get(normalise(src)) ?? map.get(src);
}

export interface ImageUse {
  title: string;
  href: string;
}

let usage: Promise<Map<string, ImageUse[]>> | null = null;

/**
 * Every published page an image appears on, keyed by image path. Covers,
 * photos and logos come from frontmatter; body images are found by
 * looking for "(/uploads/…)" in the markdown.
 */
export function getImageUsage(): Promise<Map<string, ImageUse[]>> {
  usage ??= (async () => {
    const map = new Map<string, ImageUse[]>();
    const add = (path: string | null | undefined, use: ImageUse) => {
      if (!path) return;
      const key = normalise(path);
      const list = map.get(key) ?? [];
      if (!list.some((u) => u.href === use.href)) list.push(use);
      map.set(key, list);
    };
    const addBody = (body: string | undefined, use: ImageUse) => {
      for (const m of (body ?? '').matchAll(/\]\((\/uploads\/[^)\s]+)/g)) add(m[1], use);
    };

    for (const e of await getCollection('blog', (e) => !e.data.draft)) {
      const use = { title: e.data.title, href: `/blog/${e.id}` };
      add(e.data.cover, use);
      addBody(e.body, use);
    }
    for (const e of await getCollection('exhibitions')) {
      const use = { title: e.data.title, href: `/exhibitions/${e.id}` };
      add(e.data.cover, use);
      addBody(e.body, use);
    }
    for (const e of await getCollection('archive')) {
      const use = { title: e.data.title, href: `/collections/${e.id}` };
      add(e.data.cover, use);
      addBody(e.body, use);
    }
    for (const e of await getCollection('about')) {
      addBody(e.body, { title: e.data.title, href: `/about/${e.id}` });
    }
    for (const e of await getCollection('team')) {
      const use = { title: e.data.name, href: `/team/${e.id}` };
      add(e.data.photo, use);
      addBody(e.body, use);
    }
    for (const e of await getCollection('partners')) {
      const use = { title: e.data.name, href: `/partners/${e.id}` };
      add(e.data.logo, use);
      addBody(e.body, use);
    }
    if (SHOP_PUBLIC) {
      for (const e of await getCollection('shop', (e) => !e.data.draft)) {
        const use = { title: e.data.title, href: `/shop/${e.id}` };
        add(e.data.cover, use);
        addBody(e.body, use);
      }
    }
    return map;
  })();
  return usage;
}
