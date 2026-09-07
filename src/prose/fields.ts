// The reusable prose field types: shared by the site schema (S1-06/S1-08) and by
// post frontmatter (S1-07). Everything is a strictObject, so a misspelt key fails.
//
// This module is loaded by plain Node (the post reader, the unit tests), so it must
// stay free of `astro:content` and every other virtual import. `astro/zod` is a real
// file on disk and is the same zod instance the content layer validates with.
import { z } from 'astro/zod';

export const SIZES = ['xs', 's', 'm', 'l'] as const;
export type Size = (typeof SIZES)[number];

/** A written value: approved, an unapproved draft, or an explicit null meaning "omit the element". */
export type Written<T> = T | { draft: T } | null;

export const draftText = z.strictObject({ draft: z.string() });
export type DraftText = z.infer<typeof draftText>;

// xs is never Markdown-rendered: it reaches attributes and titles through text(), which does the HTML
// escaping. This only keeps Markdown syntax out of a size that would show it literally (§4.1 rule 2).
const xsString = z
  .string()
  .regex(/^[^[*`]*$/, 'xs text is used raw in attributes and may not contain [, * or `');

const written = <T extends z.ZodTypeAny>(value: T) =>
  z.union([value, z.strictObject({ draft: value })]).nullable().optional();

const sizeMap = <X extends z.ZodTypeAny, R extends z.ZodTypeAny>(xs: X, rest: R) =>
  z
    .strictObject({ xs: written(xs), s: written(rest), m: written(rest), l: written(rest) })
    .refine((v) => SIZES.some((size) => v[size] !== undefined), {
      message: 'write at least one of xs, s, m or l',
    });

export const sizedText = sizeMap(xsString, z.string());
export type SizedText = z.infer<typeof sizedText>;

export const sizedList = sizeMap(z.array(xsString), z.array(z.string()));
export type SizedList = z.infer<typeof sizedList>;

/** Chip/tag item: a new chip takes the draft flow (D37). */
export const labelItem = z.union([xsString, z.strictObject({ draft: xsString })]);
export type LabelItem = z.infer<typeof labelItem>;

// null and [] both render nothing, so an empty list is valid.
export const labelList = z.array(labelItem).nullable();
export type LabelList = z.infer<typeof labelList>;

const hasPlaceholder = (value: Written<string> | undefined) => {
  if (value === undefined || value === null) return true;
  return (typeof value === 'string' ? value : value.draft).includes('{n}');
};

/** post.readTime, carousel.goToSlide: the client substitutes {n}, so every written size must carry it. */
export const sizedTemplate = sizedText.refine((v) => SIZES.every((size) => hasPlaceholder(v[size])), {
  message: 'a template must contain {n} at every written size',
});
export type SizedTemplate = z.infer<typeof sizedTemplate>;
