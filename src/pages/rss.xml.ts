// RSS feed for the news/blog section.
// Available at /rss.xml. Linked from BaseLayout's <head>.

import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import type { APIRoute } from 'astro';

export const GET: APIRoute = async (context) => {
  const posts = (await getCollection('blog'))
    .filter((p) => !p.data.draft)
    .sort((a, b) => b.data.date.getTime() - a.data.date.getTime());

  return rss({
    title: 'Mountain Heritage Trust — News',
    description:
      'News, history pieces and announcements from the Mountain Heritage Trust, the UK charity preserving the heritage of British mountaineering.',
    site: context.site!,
    items: posts.map((post) => ({
      title: post.data.title,
      pubDate: post.data.date,
      description: post.data.summary,
      link: `/blog/${post.id}/`,
      author: post.data.author,
      categories: post.data.tags,
    })),
    customData: '<language>en-gb</language>',
  });
};
