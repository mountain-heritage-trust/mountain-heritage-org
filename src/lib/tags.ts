// Topic tags for blog posts.
//
// Tags are derived at build time by matching each post's title and body
// against a regex defined here, rather than stored as `tags: [...]` in
// frontmatter. That keeps the existing 175+ markdown files untouched
// and lets us tune the taxonomy by editing one file.
//
// Each tag has a slug (URL), display title, and a description shown on
// the tag page. Descriptions are intentionally specific — they explain
// the trust's relationship to the topic, not just the topic itself.

import { getCollection, type CollectionEntry } from 'astro:content';

export interface TagDefinition {
  slug: string;
  title: string;
  description: string;
  /** Tested against post title + raw markdown body. */
  pattern: RegExp;
}

export const TAGS: TagDefinition[] = [
  {
    slug: 'bonington',
    title: 'Sir Chris Bonington',
    description:
      'Sir Chris Bonington is a founder member of the Mountain Heritage Trust, a former Chair and a current Patron. He led the first British ascent of the South West Face of Everest in 1975 and made first ascents on Annapurna II, Nuptse, the Central Pillar of Freney, the Ogre and Kongur, among many others. The Trust holds the Sir Chris Bonington Papers — over fifty years of expedition diaries, correspondence, photographs and manuscripts — and its 2024 exhibition *Man & Mountain* drew on the collection. These posts cover his climbs, the Trust\'s holdings, exhibitions and related events.',
    pattern: /\bbonington\b/i,
  },
  {
    slug: 'joe-tasker',
    title: 'Joe Tasker',
    description:
      'Joe Tasker (1948–1982) was one of the leading lightweight Himalayan climbers of his generation. With Pete Boardman he made the first lightweight ascent of Kangchenjunga without supplementary oxygen in 1979; the pair were last seen high on Everest\'s North East Ridge in May 1982. The Trust houses the Joe Tasker Archive, secured with a Heritage Lottery Fund grant, including his diaries, manuscripts and the writing collection that became *Savage Arena* and *Everest the Cruel Way*. These posts cover Joe\'s climbs, the Towering Talent archive project, and related exhibitions.',
    pattern: /\bjoe[\s-]?tasker\b|\btasker\b(?!\s+award)/i,
  },
  {
    slug: 'joe-brown',
    title: 'Joe Brown',
    description:
      'Joe Brown CBE (1930–2020) was one of Britain\'s greatest rock climbers, making his name on gritstone in Derbyshire before turning to Wales, the Lake District and the Greater Ranges. He made the first ascent of Kangchenjunga in 1955, the first ascent of the Mustagh Tower in 1956, and the first ascent of the nameless Trango Tower in 1976. Joe was the Trust\'s first Patron, serving from 2012 until his death in 2020. These posts cover his climbs, the Trust\'s holdings related to him, and tributes from the climbing community.',
    pattern: /\bjoe[\s-]?brown\b/i,
  },
  {
    slug: 'doug-scott',
    title: 'Doug Scott',
    description:
      'Doug Scott CBE (1941–2020) was a long-standing Trustee of the Mountain Heritage Trust and one of the leading expedition mountaineers of his generation. He made the first British ascent of Everest in 1975 with Dougal Haston, the first lightweight ascent of Kangchenjunga in 1979 with Joe Tasker and Pete Boardman, and a celebrated descent of the Ogre in 1977 with two broken legs. Doug founded Community Action Nepal in the 1990s. These posts cover his climbs, his lectures, his fundraising for CAN, and tributes following his death in 2020.',
    pattern: /\bdoug[\s-]?scott\b/i,
  },
  {
    slug: 'everest',
    title: 'Mount Everest',
    description:
      'Posts about Mount Everest in the British and international climbing record — from the 1921, 1922 and 1924 reconnaissances and expeditions, through the first ascent in 1953 by Hillary and Tenzing, to the 1975 South West Face expedition led by Bonington, the 1982 North East Ridge attempt that took Tasker and Boardman, and contemporary climbs and exhibitions. The Trust holds primary material from several Everest expeditions and its exhibitions have repeatedly returned to the mountain.',
    pattern: /\beverest\b/i,
  },
  {
    slug: 'lake-district',
    title: 'The Lake District',
    description:
      'The Mountain Heritage Trust is based at Blencathra in the Northern Fells, and a substantial part of British climbing history was made on Lakeland rock — from the early Pinnacle Club ascents and Mabel Barker\'s pre-war routes, through Bill Peascod and the post-war Lakeland generation, to the present. These posts cover Lake District climbing and climbers, exhibitions held at Lakeland venues, and the Trust\'s own home in the fells.',
    pattern: /\b(lake[\s-]?district|lakeland|cumbria(?:n)?|keswick|borrowdale|wasdale|langdale|coniston|grasmere|ambleside|kendal|threlkeld|blencathra|skiddaw|helvellyn|scafell)\b/i,
  },
  {
    slug: 'in-memoriam',
    title: 'In memoriam',
    description:
      'Tributes and obituaries published by the Mountain Heritage Trust on the deaths of climbers, trustees, patrons and friends of the Trust. The Trust\'s archives preserve the records and stories these climbers leave behind; these posts preserve the immediate response to their loss.',
    pattern: /\b(passed away|sad news|in tribute|memoriam|1\d{3}-2\d{3}\)|2\d{3}-2\d{3}\))\b/i,
  },
];

export function tagsForPost(post: CollectionEntry<'blog'>): TagDefinition[] {
  const haystack = `${post.data.title}\n${post.body ?? ''}`;
  return TAGS.filter((tag) => tag.pattern.test(haystack));
}

export async function postsForTag(slug: string): Promise<CollectionEntry<'blog'>[]> {
  const tag = TAGS.find((t) => t.slug === slug);
  if (!tag) return [];
  const posts = (await getCollection('blog'))
    .filter((p) => !p.data.draft)
    .sort((a, b) => b.data.date.getTime() - a.data.date.getTime());
  const haystack = (post: CollectionEntry<'blog'>) =>
    `${post.data.title}\n${post.body ?? ''}`;
  return posts.filter((p) => tag.pattern.test(haystack(p)));
}

export function findTag(slug: string): TagDefinition | undefined {
  return TAGS.find((t) => t.slug === slug);
}
