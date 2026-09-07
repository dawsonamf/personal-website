import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';

const posts = defineCollection({
  // deferRender: true keeps Astro's Markdown pipeline off the body entirely.
  // Without it glob() renders every .md during content sync, and a render error
  // there is logged, not thrown (glob.js). entry.body survives either way,
  // because retainBody defaults to true.
  loader: glob({ pattern: '**/*.md', base: './src/content/posts', deferRender: true }),
});

export const collections = { posts };
