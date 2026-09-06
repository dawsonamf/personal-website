# S1-18 — Build the blog listing and retain its filter/typing behavior

**Status:** Unstarted · **Spec milestone:** T5 · **Scope:** one page and its runtime

**Depends on:** [S1-17](s1-17-canonical-home-integration.md)

Assign one agent this ticket plus the [execution contract](../../../superpowers/plans/2026-09-05-spec-1-migration-engine.md). Read [Spec 1](../spec-1-migration-engine-parity.md) §7.1–7.2, §8, D8/D17/D32/D36 and Q1–Q2. Dependencies supply code and evidence; there is no owner review between tickets.

## Deliverable

A static ten-entry blog listing for every theme, retaining current filtering, intro choreography and shared carousel behavior.

## Files

- Modify: `src/layouts/canonical/BlogListing.astro`, `src/pages/[...theme]/blog/index.astro`.
- Create: `src/layouts/canonical/components/BlogCards.astro`, `public/js/blog-listing-client.js`, `tests/build/listing-html.test.ts`.
- Read: `blog/index.html`, `blog/blog-listing.js`, S1-07 post projections.
- Do not edit post layout/runtime, utility layouts, Astro config or workflows.

## Interfaces

- BlogCards takes validated listing records and theme; every record uses createProseAccess for sized metadata/tags.
- Filter data is the sorted union of published/external listing tags; there is no All pill.
- Listing supplies canonicalStyleExtras with carousel true and its derived masthead JSON.
- Runtime reads static filter/card markup and the JSON island; no catalog globals or rendering functions.

## Work

- [ ] Reproduce the complete listing DOM, stamping the three intro paragraphs with blog-sub-text, blog-sub-text-2 and blog-sub-text-3.
- [ ] Render numbered Selected Works/All Posts sections, shared carousel and all ten cards with wrapper classes/data-tags/AOS delay i*50.
- [ ] Preserve card order independently of corrected dates. Keep autoencoder destinations external and Gemma absent.
- [ ] Port typing callback insertion, intro wave, active-tag toggles and filtered-out logic, AOS offset 50 and resize refresh.
- [ ] Change the positive tilt predicate to absence of data-no-tilt; preserve its numeric settings.
- [ ] Emit the listing's synchronous AOS/carousel/typing tags and end-of-body client order, retaining the home/listing asymmetry.
- [ ] Document the retained runtime's owner, inputs, dependencies and lifecycle in its header; fix only listing-specific parity differences.

## Acceptance and verification

- [ ] Listing × 16 × 2 × applicable states passes, including Swift filter and dock interactions.
- [ ] All ten entries and original tags/excerpts remain; Helm/METR fields independently match sources.
- [ ] Intro ids, section numbers, card wrappers and AOS delays match baseline.
- [ ] No draft page/card, default All pill or runtime rendering catalog.
- [ ] Listing palette state survives navigation/reload before paint.

```bash
node --test --test-concurrency=1 tests/build/listing-html.test.ts
npm run build
PARITY_MODE=old-new npm run test:parity -- --grep @page:blog
```

## Agent handoff

Record changed files, commands and exit results, and any interface adjustments in the completion report. Resolve implementation failures in scope; do not replace failed assertions with broader exclusions. Leave owner QA to the end of the complete migration.
