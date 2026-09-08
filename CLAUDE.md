# dawsonamf.com

Astro 7 static site prepared on the migration branch. `astro.config.mjs` defines the production
routes, sitemap, redirects and build checks. Actions registration and production cutover are still
pending; the live site remains on legacy GitHub Pages. Root `CNAME` and `.nojekyll` are rollback
files, not public input.

## Commands

```bash
npm run dev            # picker generation, then draft-enabled Astro dev
npm run build          # picker generation, prose validation, Astro check and production build
npm run build:preview  # picker generation and a draft-enabled static build
npm run test:unit
npm run test:build
npm run test:parity
```

Use Node 24 from `.nvmrc`. The three official Astro entry commands generate the classic picker
adapter before Astro reads `public/`. `src/themes/ramp.ts` is the sole authored color-ramp formula;
run `npm run picker:build` after changing it and never hand-edit the marked generated region in
`public/js/theme-cycler.js`.

## Project structure

```
src/pages/                    # Astro route entrypoints
src/layouts/                  # composition, Shell and canonical page family
src/themes/                   # typed registry, projection, paths, ramp and authoring guide
src/content/prose.yaml        # shared site and theme prose
src/content/posts/*.md        # one metadata-and-body source per post
src/prose/  src/posts/        # validated prose and post contracts
src/build/                    # build checks, post projections and compatibility output
public/                       # root-absolute URL owners copied by Astro
  css/  js/  vendor/          # classic styles/scripts and pinned libraries
  blog/posts/assets/          # existing post-owned runtime assets
  resources/  subsites/       # media and verbatim standalone sites
scripts/build-picker.mjs      # generated classic adapter from src/themes/ramp.ts
scripts/vendor*.mjs           # pinned dependency copy map and command
harness/  tests/              # parity, browser, unit and isolated build evidence
docs/                         # unpublished plans and historical research
```

## Key conventions

- `src/layouts/compose.ts` is the only skin/structural/fallback decision. Canonical layouts own
  canonical DOM and behavior. `Shell.astro` renders the selected composition and the shared picker.
- Read `src/themes/README.md` when changing the registry, theme projection, picker, a skin, a
  structural layout, responsive theme behavior, or theme storage. It is the live authoring guide;
  `docs/theme-explorations.html` is frozen historical design research.
- Components create internal links through `href()` from `src/themes/paths.ts`. Public asset URLs
  are root-absolute. A file in `public/` is copied verbatim and is not bundled or type-checked.
- Build-time values reach classic scripts through owned `data-*` attributes or an owner-emitted JSON
  island. There is no browser theme registry except the 404's appearance island.
- Canonical responsive behavior uses the existing 1100px breakpoint. A structural layout owns its
  own CSS-first breakpoints and must survive resizing in both directions.
- Dependency versions are pinned. Preserve classic-script load order and verify any new external URL.
- Images stay near 2x display size and at or below 500 KB where practical; use JPEG for photos and
  place shared media under `public/resources/`.

## Blog posts

Create `src/content/posts/<id>.md`; its validated frontmatter and Markdown body are the only source
for that post. `src/build/posts.ts` derives production routes, listing records and sitemap dates.
Published local posts render to static `/<theme>/blog/<id>/` pages at build time. External records
redirect, and draft records remain source-only in production. Put existing or approved post-owned
scripts/styles under `public/blog/posts/assets/` and reference root-absolute URLs in frontmatter.
Do not edit a sitemap by hand.

The owner-approved policy below is preserved verbatim. Its opening paragraph records the migration
stage when the policy was introduced; the rules remain active for the final Astro tree.

## Prose and post approval

Applies to the Astro migration tree (`src/`, `astro.config.mjs`, `npm run build`), which is being built alongside the legacy static site described above; the legacy notes stay true for the deployed site until cutover, when this file is rewritten (Spec 1 §4.3).

- Shared site/theme prose lives in `src/content/prose.yaml`; each post's metadata and body live in its own `src/content/posts/<id>.md`. Neither is mirrored anywhere else.
- A plain string is approved. A new or rewritten prose field stays `{ draft: "..." }` until the owner approves it; a new or rewritten post stays `publication: draft` until the owner approves publication. Blog bodies are approved as whole documents.
- Drafts are preview-only (`npm run dev` and `npm run build:preview`, both `PROSE_DRAFTS=allow`). Production (`npm run build`) fails on any draft field in shared prose or in `published`/`external` post metadata, and emits nothing for a whole draft post (no route, listing card, sitemap entry, raw source or body).
- Text migrated verbatim from the live site is approved as-is and needs no owner review.
- Grandfathered for migration parity only: the verbatim subsites and the existing per-post scripts/assets. New or changed UI strings anywhere go through the owning source and the draft flow above; the museum aria-label in `underviewed-art.js` gets an approved template the next time its text is touched.