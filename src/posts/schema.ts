// The post frontmatter schema (§7.1, D8): each src/content/posts/<id>.md owns its own
// metadata, so there is no prose.posts mirror. `publication` is the discriminant:
// published/external require complete publishable metadata (external also an externalUrl),
// while a draft may be unfinished and carries no listingOrder, so it cannot claim a slot.
//
// Pure and plain-Node loadable, like src/prose/fields.ts: astro/zod is a real file on disk.
import { z } from 'astro/zod';

import { labelList, sizedText } from '../prose/fields.ts';

/** The one month source: the `date` pattern here and the YYYY-MM-01 projection in src/build/posts.ts. */
export const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
] as const;

/** Per-post assets: a root-absolute file under public/blog/posts/assets/, or a pinned CDN URL. */
const assetUrl = z
  .string()
  .refine(
    (value) => /^\/blog\/posts\/assets\/[^/]+$/.test(value) || value.startsWith('https://'),
    'an asset is /blog/posts/assets/<file> or a pinned https:// URL',
  );

const publishable = {
  listingOrder: z.number().int().min(0),
  title: sizedText,
  date: z.string().regex(new RegExp(`^(${MONTHS.join('|')}) \\d{4}$`), 'date is "Month YYYY"'),
  description: sizedText,
  tags: labelList,
  scripts: z.array(assetUrl).default([]),
  styles: z.array(assetUrl).default([]),
};

const published = z.strictObject({ publication: z.literal('published'), ...publishable });

const external = z.strictObject({
  publication: z.literal('external'),
  ...publishable,
  externalUrl: z.string().url().startsWith('https://'),
});

// A whole draft is excluded from production, so nothing here is required and the date is loose.
// A draft has no public destination either, so externalUrl is not a key it may carry.
const draft = z.strictObject({
  publication: z.literal('draft'),
  title: sizedText.optional(),
  date: z.string().optional(),
  description: sizedText.optional(),
  tags: labelList.optional(),
  scripts: z.array(assetUrl).default([]),
  styles: z.array(assetUrl).default([]),
});

export const postMeta = z.discriminatedUnion('publication', [published, external, draft]);
export type PostMeta = z.infer<typeof postMeta>;
