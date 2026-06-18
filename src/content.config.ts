import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import * as z from 'zod';

// Sveltia CMS writes `null` for any empty optional field rather than
// omitting it from the YAML/JSON. We use `.nullish()` (≡ `.optional().nullable()`)
// on optional fields so the schema accepts either missing or null values.

const blog = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/blog' }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    summary: z.string().nullish(),
    cover: z.string().nullish(),
    author: z.string().nullish(),
    tags: z.array(z.string()).default([]),
    draft: z.boolean().default(false),
    // Hide from the home page's "Latest news" list while keeping the post
    // live in the blog listing, tags and RSS. For news that has gone stale
    // but is worth keeping for the historic record.
    hideFromHome: z.boolean().default(false),
  }),
});

const team = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/team' }),
  schema: z.object({
    name: z.string(),
    role: z.string(),
    category: z.enum(['trustee', 'staff', 'patron', 'ambassador', 'advisor', 'volunteer']).nullish(),
    // Mark as `former: true` for past trustees / patrons / etc. (e.g. those
    // who have stepped down or are deceased). They are grouped under
    // "In memoriam" / similar at the bottom of listing pages.
    former: z.boolean().default(false),
    order: z.number().nullish(),
    photo: z.string().nullish(),
  }),
});

// Internal name `archive` to avoid clashing with Astro's term "content collection".
// Public URLs remain /collections/<slug>. See docs/migration.md.
const archive = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/archive' }),
  schema: z.object({
    title: z.string(),
    summary: z.string().nullish(),
    cover: z.string().nullish(),
    order: z.number().nullish(),
  }),
});

const exhibitions = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/exhibitions' }),
  schema: z.object({
    title: z.string(),
    startDate: z.coerce.date().nullish(),
    endDate: z.coerce.date().nullish(),
    venue: z.string().nullish(),
    summary: z.string().nullish(),
    cover: z.string().nullish(),
    status: z.enum(['upcoming', 'current', 'past']).nullish(),
  }),
});

const about = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/about' }),
  schema: z.object({
    title: z.string(),
    order: z.number().nullish(),
    summary: z.string().nullish(),
    // Render the team gallery (patrons / ambassadors / trustees / staff)
    // beneath the page body when true. Only intended for about-us today.
    showTeam: z.boolean().default(false),
    // Optional list of downloadable annual reports (PDFs in /uploads).
    // Rendered as a download section beneath the page body. Only used on
    // about-us today. Newest year is shown first regardless of list order.
    annualReports: z
      .array(
        z.object({
          year: z.number(),
          file: z.string(),
        }),
      )
      .default([]),
  }),
});

export const collections = { blog, team, archive, exhibitions, about };
