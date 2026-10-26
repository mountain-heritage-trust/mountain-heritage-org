// Caption formatting shared by <Image> and the markdown captions plugin
// (image-captions.ts), so captions read the same wherever they appear.
// Kept free of Node imports: <Image> runs in the Cloudflare prerender
// environment.

export interface CaptionFields {
  caption?: string | number | null;
  date?: string | number | null;
  credit?: string | null;
}

const str = (v: unknown) => (v === null || v === undefined ? '' : String(v).trim());

/** Caption text and the muted "date · credit" line, or null if there's nothing to show. */
export function captionLine(r: CaptionFields): { caption: string; meta: string } | null {
  const caption = str(r.caption);
  const meta = [str(r.date), str(r.credit)].filter(Boolean).join(' · ');
  return caption || meta ? { caption, meta } : null;
}
