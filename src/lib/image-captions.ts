// Image records → captions.
//
// Records live in src/content/images/*.yml (see scripts/image-records.mjs
// and docs/images.md). This module:
//
// - `loadImageRecordsSync()` / `imageCaptionsPlugin()` — read the records
//   from disk at config time (same approach as auto-links.ts) and, for
//   images in markdown bodies, fill in missing alt text and wrap
//   stand-alone images in <figure> with a caption.

import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { join, parse } from 'node:path';
import { parse as parseYaml } from 'yaml';
import type { Plugin } from 'unified';
import type { Root, Element, ElementContent, Parents } from 'hast';
import { captionLine, type CaptionFields } from './caption-line';

export interface ImageRecordLite extends CaptionFields {
  id: string;
  image: string;
  alt?: string | null;
}

/** Image path (as written in content, e.g. "/uploads/foo.jpg") → record. */
export function loadImageRecordsSync(dir = join(process.cwd(), 'src/content/images')): Map<string, ImageRecordLite> {
  const map = new Map<string, ImageRecordLite>();
  if (!existsSync(dir)) return map;
  for (const f of readdirSync(dir).filter((f) => f.endsWith('.yml'))) {
    const data = parseYaml(readFileSync(join(dir, f), 'utf8')) ?? {};
    if (data.image) map.set(data.image, { id: parse(f).name, ...data });
  }
  return map;
}

const el = (tagName: string, properties: Element['properties'], children: ElementContent[]): Element => ({
  type: 'element',
  tagName,
  properties,
  children,
});
const txt = (value: string): ElementContent => ({ type: 'text', value });

/** The <figcaption> element, as HAST. Mirrors the markup in Image.astro. */
function figcaption(id: string, line: { caption: string; meta: string }): Element {
  const children: ElementContent[] = [];
  if (line.caption) children.push(el('span', { className: ['image-caption__text'] }, [txt(line.caption)]), txt(' '));
  if (line.meta) children.push(el('span', { className: ['image-caption__meta'] }, [txt(line.meta)]), txt(' '));
  children.push(el('a', { className: ['image-caption__link'], href: `/images/${id}` }, [txt('Image details')]));
  return el('figcaption', { className: ['image-caption'] }, children);
}

const isBlank = (n: ElementContent) => n.type === 'text' && !n.value.trim();

export function imageCaptionsPlugin(): Plugin<[], Root> {
  const records = loadImageRecordsSync();

  const lookup = (src: unknown) => {
    if (typeof src !== 'string' || !src.startsWith('/uploads/')) return undefined;
    let path = src;
    try {
      path = decodeURI(src);
    } catch {
      // Malformed escape — fall back to the raw string.
    }
    return records.get(path) ?? records.get(src);
  };

  return () => (tree) => {
    const walk = (node: Parents) => {
      node.children.forEach((child, i) => {
        if (child.type !== 'element') return;

        if (child.tagName === 'img') {
          const rec = lookup(child.properties.src);
          if (rec?.alt && !child.properties.alt) child.properties.alt = String(rec.alt);
          return;
        }

        // A paragraph holding just one image (how markdown renders
        // `![](…)` on its own line) becomes a captioned figure.
        if (child.tagName === 'p') {
          const content = child.children.filter((c) => !isBlank(c));
          const img = content.length === 1 && content[0].type === 'element' && content[0].tagName === 'img' ? content[0] : null;
          const rec = img && lookup(img.properties.src);
          const line = rec && captionLine(rec);
          if (img && rec) {
            if (rec.alt && !img.properties.alt) img.properties.alt = String(rec.alt);
            if (line) {
              node.children[i] = el('figure', { className: ['image-figure'] }, [img, figcaption(rec.id, line)]);
              return;
            }
          }
        }

        walk(child);
      });
    };
    walk(tree);
  };
}
