import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const legal = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/legal' }),
  schema: z.object({
    title: z.string(),
    // Optional SEO overrides for the legal pages. Without them the pages fall
    // back to `title` and a generic description.
    metaTitle: z.string().optional(),
    metaDescription: z.string().optional(),
    // A legal page still mid-review ships noindex so it stays out of search
    // while it is reachable at its real URL for internal QA and preview.
    noindex: z.boolean().optional(),
  }),
});

export const collections = { legal };
