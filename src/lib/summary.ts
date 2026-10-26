// Many migrated entries have a `summary` that is just the opening of the
// body text (often cut off with "…"). It's fine for listing cards and meta
// descriptions, but shown as the lead paragraph on the entry's own page it
// makes the reader read the same sentence twice. This decides whether the
// lead is worth showing.

const normalise = (s: string) =>
  s
    .toLowerCase()
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

/** True when `summary` adds something the start of `body` doesn't already say. */
export function showSummaryLead(summary: string | undefined | null, body: string | undefined): summary is string {
  if (!summary) return false;
  if (!body) return true;
  const lead = normalise(summary.replace(/(…|\.\.\.)\s*$/, '')).slice(0, 80);
  if (!lead) return false;
  // Look only near the top so a summary that happens to be quoted later
  // in a long article still shows.
  const opening = body
    .slice(0, 1500)
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ') // images
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1'); // links → their text
  return !normalise(opening).includes(lead);
}
