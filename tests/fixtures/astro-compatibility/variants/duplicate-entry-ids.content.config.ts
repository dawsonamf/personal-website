import { defineCollection } from 'astro:content';
import { file, glob } from 'astro/loaders';

const posts = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/posts', deferRender: true }),
});

// (e) Two array items share one id, which prerenderConflictBehavior: 'error'
// turns into a build failure (content/loaders/file.js).
const dupes = defineCollection({
  loader: file('./src/content/duplicate-entry-ids.json'),
});

export const collections = { posts, dupes };
