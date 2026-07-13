// Build-time conversion of standalone YouTube links into embedded
// players.
//
// A YouTube URL pasted on its own line in markdown (which GFM autolinks
// into a paragraph containing just that link) is replaced with a
// responsive <iframe> served from the privacy-enhanced
// youtube-nocookie.com domain. Links inside sentences, and links whose
// text differs from the URL, are left as ordinary links.
//
// All processing happens at build time. No runtime cost.

import type { Plugin } from 'unified';
import type { Root, Element, ElementContent, RootContent } from 'hast';

const VIDEO_ID = /^[A-Za-z0-9_-]{11}$/;

// Accept a start time as plain seconds ("90") or in YouTube's
// h/m/s form ("1m30s", "19s").
function parseStart(raw: string | null): number {
  if (!raw) return 0;
  if (/^\d+$/.test(raw)) return Number(raw);
  const m = raw.match(/^(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?$/);
  if (!m) return 0;
  return Number(m[1] ?? 0) * 3600 + Number(m[2] ?? 0) * 60 + Number(m[3] ?? 0);
}

// Extract a video id (and optional start offset) from any of the common
// YouTube URL shapes: watch?v=, youtu.be/, /shorts/, /live/, /embed/.
function parseYouTubeUrl(raw: string): { id: string; start: number } | null {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return null;
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return null;
  const host = url.hostname.replace(/^(www|m)\./, '');
  let id: string | null = null;
  if (host === 'youtu.be') {
    id = url.pathname.slice(1).split('/')[0] || null;
  } else if (host === 'youtube.com' || host === 'youtube-nocookie.com') {
    if (url.pathname === '/watch') {
      id = url.searchParams.get('v');
    } else {
      const m = url.pathname.match(/^\/(shorts|live|embed)\/([^/]+)/);
      if (m) id = m[2];
    }
  }
  if (!id || !VIDEO_ID.test(id)) return null;
  return { id, start: parseStart(url.searchParams.get('t') ?? url.searchParams.get('start')) };
}

function textOf(node: ElementContent): string {
  if (node.type === 'text') return node.value;
  if (node.type === 'element') return node.children.map(textOf).join('');
  return '';
}

// A paragraph counts as a standalone YouTube link when its only
// non-whitespace content is a single link whose visible text is the URL
// itself (i.e. a pasted URL, not an authored link).
function standaloneYouTubeLink(node: RootContent): { id: string; start: number } | null {
  if (node.type !== 'element' || node.tagName !== 'p') return null;
  const meaningful = node.children.filter(
    (c) => !(c.type === 'text' && c.value.trim() === ''),
  );
  if (meaningful.length !== 1) return null;
  const child = meaningful[0];
  if (child.type !== 'element' || child.tagName !== 'a') return null;
  const href = String(child.properties?.href ?? '');
  const text = textOf(child).trim();
  if (text !== href && text !== href.replace(/^https?:\/\//, '')) return null;
  return parseYouTubeUrl(href);
}

function buildEmbed(id: string, start: number): Element {
  const src = `https://www.youtube-nocookie.com/embed/${id}${start > 0 ? `?start=${start}` : ''}`;
  return {
    type: 'element',
    tagName: 'div',
    properties: { className: ['youtube-embed'] },
    children: [
      {
        type: 'element',
        tagName: 'iframe',
        properties: {
          src,
          title: 'YouTube video player',
          loading: 'lazy',
          allow: 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share',
          allowFullScreen: true,
          referrerPolicy: 'strict-origin-when-cross-origin',
        },
        children: [],
      },
    ],
  };
}

function visit(node: Root | Element) {
  node.children = node.children.map((child) => {
    const yt = standaloneYouTubeLink(child);
    if (yt) return buildEmbed(yt.id, yt.start);
    if (child.type === 'element') visit(child);
    return child;
  }) as typeof node.children;
}

/**
 * Rehype plugin that replaces paragraphs consisting of a single bare
 * YouTube URL with an embedded player. Applies to all markdown content.
 */
export function youtubeEmbedPlugin(): Plugin<[], Root> {
  return () => (tree) => visit(tree);
}
