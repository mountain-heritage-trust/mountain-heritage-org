import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import * as z from 'zod';

const blog = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/blog' }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    summary: z.string().optional(),
    cover: z.string().optional(),
    author: z.string().optional(),
    tags: z.array(z.string()).default([]),
    draft: z.boolean().default(false),
  }),
});

const team = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/team' }),
  schema: z.object({
    name: z.string(),
    role: z.string(),
    category: z.enum(['trustee', 'staff', 'patron', 'advisor']).optional(),
    order: z.number().optional(),
    photo: z.string().optional(),
  }),
});

// Internal name `archive` to avoid clashing with Astro's term "content collection".
// Public URLs remain /collections/<slug>. See docs/migration.md.
const archive = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/archive' }),
  schema: z.object({
    title: z.string(),
    summary: z.string().optional(),
    cover: z.string().optional(),
    order: z.number().optional(),
  }),
});

const exhibitions = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/exhibitions' }),
  schema: z.object({
    title: z.string(),
    startDate: z.coerce.date().optional(),
    endDate: z.coerce.date().optional(),
    venue: z.string().optional(),
    summary: z.string().optional(),
    cover: z.string().optional(),
    status: z.enum(['upcoming', 'current', 'past']).optional(),
  }),
});

const about = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/about' }),
  schema: z.object({
    title: z.string(),
    order: z.number().optional(),
    summary: z.string().optional(),
  }),
});

export const collections = { blog, team, archive, exhibitions, about };
