// The shared-prose schema (§4.1): the one validated shape of src/content/prose.yaml.
// Every object is strict, so a misspelt key fails validation rather than reaching a
// component as an unwritten size.
//
// Pure and erasable, like the rest of src/prose/: S1-08 loads this from the config side
// as well as the page side, so no astro:* / virtual imports and explicit .ts extensions.
// `astro/zod` is a real file on disk and the instance the content layer validates with.
import { z } from 'astro/zod';

import { labelList, sizedList, sizedText, sizedTemplate } from './fields.ts';
import { THEME_IDS } from '../themes/registry.ts';

// Data, not prose (§4.1): internal destinations are root-absolute canonical paths (D31/§6.1);
// external ones keep their scheme. `//host` and every relative form are rejected, and so is
// the backslash form: WHATWG URL parsing reads `/\evil.com` as `https://evil.com/`.
const url = z
  .string()
  .regex(/^(?:\/(?![\/\\])|https?:\/\/|mailto:)/, 'a destination must be root-absolute, http(s): or mailto:');

// One entry per registry id. `label.xs` must be approved: a draft or an explicit null would
// leave the picker row and the preview card with no name (§4.1 rule 4).
const themeEntry = z.strictObject({
  label: sizedText.refine((v) => typeof v.xs === 'string', 'every theme needs an approved label.xs'),
  ticker: sizedText.optional(),
  currentlyHere: sizedText.optional(),
});

// D36: prose stores the terminal lines; src/prose/masthead.ts derives the type/delete/pause
// steps. `pause` overrides the page default (home 1500 ms, listing 800 ms), which is a
// component constant, not prose.
const mastheadSequence = z.strictObject({
  lines: z.array(z.string()).min(1),
  pause: z.number().int().positive().optional(),
});

export const siteProseSchema = z.strictObject({
  site: z.strictObject({
    name: sizedText,
    logo: sizedText,
    titleSuffix: sizedText,
    email: z.string(),
    footerCredit: sizedText,
  }),

  // Per page, only the fields that page's legacy <head> actually has. Titles are stored
  // without the " | <titleSuffix>" tail; the component appends it (§4.1). og:title equals
  // title today, and og:image/og:url/canonical/robots are structure, so neither is stored.
  meta: z.strictObject({
    home: z.strictObject({ title: sizedText, description: sizedText, ogDescription: sizedText }),
    blog: z.strictObject({ title: sizedText, description: sizedText, ogDescription: sizedText }),
    post: z.strictObject({ description: sizedText }),
    privacy: z.strictObject({ title: sizedText, description: sizedText }),
    notFound: z.strictObject({ title: sizedText }),
    lexchat: z.strictObject({ title: sizedText }),
  }),

  // Labels only: which items appear where, and their hrefs, are structure (Nav.astro).
  nav: z.strictObject({
    about: sizedText,
    experience: sizedText,
    projects: sizedText,
    blog: sizedText,
    contact: sizedText,
    resume: sizedText,
    email: sizedText,
    theme: sizedText,
    aria: z.strictObject({ main: sizedText, quick: sizedText, social: sizedText }),
  }),

  // Order is render order; the label doubles as the aria-label on these icon-only anchors.
  socials: z.array(
    z
      .strictObject({
        id: z.string(),
        label: sizedText,
        href: url.optional(),
        icon: z.string(),
        calendly: z.literal(true).optional(),
      })
      .refine((v) => (v.href === undefined) !== (v.calendly === undefined), {
        message: 'a social link has either an href or calendly: true, never both and never neither',
      }),
  ),

  home: z.strictObject({
    // The "01." … "05." numbers are generated from section order (D17); only the label is prose.
    sections: z.strictObject({
      about: sizedText,
      jobs: sizedText,
      projects: sizedText,
      blog: sizedText,
      contact: sizedText,
    }),
    heroAlt: sizedText,
    about: z.strictObject({ title: sizedText, body: sizedText }),
    skills: z.strictObject({
      title: sizedText,
      // The three group names also compose the hero subtitle (D17), so it is not stored.
      groups: z.array(z.strictObject({ id: z.string(), name: sizedText, body: sizedText })),
    }),
    contact: z.strictObject({ body: sizedText, mapAlt: sizedText }),
    seeAllPosts: sizedText,
  }),

  // `id` is a content key only; the jobs panel's DOM keys stay positional (D17).
  jobs: z.array(
    z.strictObject({
      id: z.string(),
      company: sizedText,
      role: sizedText,
      url: url.optional(),
      dates: sizedText,
      bullets: sizedList,
    }),
  ),

  // Independent of post publication (§4.1): a project card outlives its post's draft state.
  projects: z.array(
    z.strictObject({
      id: z.string(),
      title: sizedText,
      description: sizedText,
      image: url,
      // Reaches a `style` attribute, so it is constrained to the 6-digit hex every card uses today.
      accentColor: z.string().regex(/^#[0-9a-f]{6}$/i, 'accentColor must be a 6-digit hex colour'),
      tech: labelList,
      // Order matters, and so does the raw `external` data: today's second CTA falls back to
      // the first's target when it has none of its own (featured-carousel.js:70), which the
      // component reproduces.
      ctas: z.array(
        z.strictObject({ label: sizedText, href: url, external: z.literal(true).optional() }),
      ),
    }),
  ),

  post: z.strictObject({ copyCode: sizedText, readTime: sizedTemplate }),
  carousel: z.strictObject({ goToSlide: sizedTemplate }),

  blog: z.strictObject({
    intro: z.strictObject({ p1: sizedText, p2: sizedText, p3: sizedText }),
    sections: z.strictObject({ works: sizedText, posts: sizedText }),
  }),

  canonical: z.strictObject({
    masthead: z.strictObject({
      home: z.array(mastheadSequence),
      listing: z.array(mastheadSequence),
    }),
  }),

  picker: z.strictObject({
    ariaLabel: sizedText,
    styles: sizedText,
    palette: sizedText,
    advanced: sizedText,
    backToStyles: sizedText,
    shuffle: sizedText,
    shuffleSub: sizedText,
    reset: sizedText,
    resetSub: sizedText,
    advancedSub: sizedText,
    doneEditing: sizedText,
    scheme: sizedText,
    colors: sizedText,
    current: sizedText,
    preview: sizedText,
    roles: z.strictObject({
      text: sizedText,
      bg: sizedText,
      primary: sizedText,
      secondary: sizedText,
      accent: sizedText,
    }),
    // The bare words; the component composes "Lock <Role>" (theme-cycler.js:462).
    lock: sizedText,
    unlock: sizedText,
    schemes: z.strictObject({
      random: sizedText,
      monochromatic: sizedText,
      analogous: sizedText,
      complementary: sizedText,
      triadic: sizedText,
      tetradic: sizedText,
    }),
  }),

  // Built from THEME_IDS so a registry/prose mismatch fails with no extra code: a missing theme
  // is an `invalid_type` ("expected object, received undefined") at `themes.<id>` and an unknown
  // one is "Unrecognized key" (§4.1 rule 4). THEME_IDS is `readonly string[]`, so the inferred
  // type is an index signature: `prose.text('themes.<typo>.label', 'xs')` type-checks and fails
  // at runtime with `prose: no such path`.
  themes: z.strictObject(Object.fromEntries(THEME_IDS.map((id) => [id, themeEntry] as const))),

  privacy: z.strictObject({ title: sizedText, updated: sizedText, body: sizedText }),
  notFound: z.strictObject({ code: sizedText, message: sizedText, back: sizedText }),
});

export type SiteProse = z.infer<typeof siteProseSchema>;
