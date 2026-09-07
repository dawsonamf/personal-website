// The two content collections (D7/D8). Shared prose is ONE file() entry validated by the
// site schema; each post owns its metadata, validated by the post schema S1-07 wrote.
import { defineCollection, z } from 'astro:content';
import { file, glob } from 'astro/loaders';
import { load } from 'js-yaml';

import { postMeta } from './posts/schema.ts';
import { siteProseSchema } from './prose/schema.ts';

// file() passes the raw item, `id` included, to the schema, so the collection schema is the
// one place that knows about `id`. src/prose/site.ts parses the same YAML itself and binds a
// tree with no `id` key, which is why siteProseSchema stays strict without one.
const prose = defineCollection({
  loader: file('./src/content/prose.yaml', {
    parser: (text) => [{ id: 'prose', ...(load(text) as object) }],
  }),
  schema: siteProseSchema.extend({ id: z.literal('prose') }),
});

// deferRender keeps Astro's Markdown pipeline off the bodies (D6); ids are the filenames
// without .md. src/build/posts.ts reads the same sources for the build-time projections.
const posts = defineCollection({
  loader: glob({ base: './src/content/posts', pattern: '**/*.md', deferRender: true }),
  schema: postMeta,
});

export const collections = { prose, posts };
