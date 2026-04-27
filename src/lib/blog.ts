// Shared helpers for the blog listing pages.

import { getCollection, type CollectionEntry } from 'astro:content';

export const POSTS_PER_PAGE = 24;

export async function getPublishedPosts(): Promise<CollectionEntry<'blog'>[]> {
  return (await getCollection('blog'))
    .filter((p) => !p.data.draft)
    .sort((a, b) => b.data.date.getTime() - a.data.date.getTime());
}

export function paginate<T>(items: T[], page: number, perPage = POSTS_PER_PAGE) {
  const totalPages = Math.max(1, Math.ceil(items.length / perPage));
  const safePage = Math.min(Math.max(page, 1), totalPages);
  const start = (safePage - 1) * perPage;
  return {
    items: items.slice(start, start + perPage),
    currentPage: safePage,
    totalPages,
    totalItems: items.length,
  };
}
