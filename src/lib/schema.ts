// Schema.org JSON-LD helpers.
//
// One Organization block is included on every page (site-wide identity);
// each page type adds its own page-specific schema (BlogPosting, Person,
// ExhibitionEvent). See BaseLayout.astro and the per-page templates.

import type { CollectionEntry } from 'astro:content';

const ORG_NAME = 'Mountain Heritage Trust';
const ORG_DESCRIPTION =
  'Mountain Heritage Trust preserves and promotes the heritage of British mountaineering — collecting, conserving and sharing the stories, objects and archives of the climbers and mountains that have shaped the sport.';

function logo(siteUrl: URL): string {
  return new URL('/brand/logo.svg', siteUrl).toString();
}

function publisher(siteUrl: URL) {
  return {
    '@type': 'Organization',
    name: ORG_NAME,
    logo: { '@type': 'ImageObject', url: logo(siteUrl) },
  };
}

export function organizationSchema(siteUrl: URL) {
  return {
    '@context': 'https://schema.org',
    '@type': 'NGO',
    name: ORG_NAME,
    alternateName: 'MHT',
    url: siteUrl.origin,
    logo: logo(siteUrl),
    description: ORG_DESCRIPTION,
    address: {
      '@type': 'PostalAddress',
      streetAddress: 'Blencathra Field Centre, Threlkeld',
      addressLocality: 'Keswick',
      addressRegion: 'Cumbria',
      postalCode: 'CA12 4SG',
      addressCountry: 'GB',
    },
    email: 'enquiries@mountain-heritage.org',
    telephone: '+441768779911',
    sameAs: [
      'https://www.facebook.com/MountainHeritageTrust/',
      'https://twitter.com/mtn_heritage',
      'https://www.instagram.com/mountainheritagetrust/',
      'https://www.linkedin.com/company/mountainheritagetrust',
      'https://www.youtube.com/@mountainheritagetrust2106',
    ],
    identifier: {
      '@type': 'PropertyValue',
      propertyID: 'UK Charity Number',
      value: '1083219',
    },
  };
}

export function articleSchema(
  post: CollectionEntry<'blog'>,
  pageUrl: URL,
  siteUrl: URL,
) {
  const data: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.data.title,
    datePublished: post.data.date.toISOString(),
    description: post.data.summary,
    author: post.data.author
      ? { '@type': 'Person', name: post.data.author }
      : { '@type': 'Organization', name: ORG_NAME },
    publisher: publisher(siteUrl),
    mainEntityOfPage: { '@type': 'WebPage', '@id': pageUrl.toString() },
    url: pageUrl.toString(),
  };
  if (post.data.cover) {
    data.image = new URL(post.data.cover, siteUrl).toString();
  }
  if (post.data.tags && post.data.tags.length > 0) {
    data.keywords = post.data.tags.join(', ');
  }
  return data;
}

export function personSchema(
  member: CollectionEntry<'team'>,
  pageUrl: URL,
  siteUrl: URL,
) {
  const data: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: member.data.name,
    jobTitle: member.data.role,
    worksFor: { '@type': 'Organization', name: ORG_NAME },
    url: pageUrl.toString(),
  };
  if (member.data.photo) {
    data.image = new URL(member.data.photo, siteUrl).toString();
  }
  return data;
}

export function exhibitionSchema(
  item: CollectionEntry<'exhibitions'>,
  pageUrl: URL,
  siteUrl: URL,
) {
  const data: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'ExhibitionEvent',
    name: item.data.title,
    description: item.data.summary,
    organizer: { '@type': 'Organization', name: ORG_NAME },
    url: pageUrl.toString(),
  };
  if (item.data.startDate) data.startDate = item.data.startDate.toISOString().slice(0, 10);
  if (item.data.endDate) data.endDate = item.data.endDate.toISOString().slice(0, 10);
  if (item.data.venue) data.location = { '@type': 'Place', name: item.data.venue };
  if (item.data.cover) data.image = new URL(item.data.cover, siteUrl).toString();
  if (item.data.status) {
    data.eventStatus =
      item.data.status === 'past'
        ? 'https://schema.org/EventCancelled' // best-fit; "past" isn't a status itself
        : 'https://schema.org/EventScheduled';
  }
  return data;
}

export function archiveCollectionSchema(
  item: CollectionEntry<'archive'>,
  pageUrl: URL,
  siteUrl: URL,
) {
  const data: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Collection',
    name: item.data.title,
    description: item.data.summary,
    url: pageUrl.toString(),
    isPartOf: { '@type': 'Organization', name: ORG_NAME },
  };
  if (item.data.cover) data.image = new URL(item.data.cover, siteUrl).toString();
  return data;
}

/**
 * Encode a JSON-LD object as a string safe for embedding inside a
 * <script type="application/ld+json"> tag. Escapes `<` so any
 * accidental `</script>` substring inside a value can't break out
 * of the script tag.
 */
export function safeJsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, '\\u003c');
}
