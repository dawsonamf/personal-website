# S1-18 — Build the blog listing and retain its filter/typing behavior

**Status:** Done · **Spec milestone:** T5 · **Scope:** one page and its runtime

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

- [x] Reproduce the complete listing DOM, stamping the three intro paragraphs with blog-sub-text, blog-sub-text-2 and blog-sub-text-3.
- [x] Render numbered Selected Works/All Posts sections, shared carousel and all ten cards with wrapper classes/data-tags/AOS delay i*50.
- [x] Preserve card order independently of corrected dates. Keep autoencoder destinations external and Gemma absent.
- [x] Port typing callback insertion, intro wave, active-tag toggles and filtered-out logic, AOS offset 50 and resize refresh.
- [x] Change the positive tilt predicate to absence of data-no-tilt; preserve its numeric settings.
- [x] Emit the listing's synchronous AOS/carousel/typing tags and end-of-body client order, retaining the home/listing asymmetry.
- [x] Document the retained runtime's owner, inputs, dependencies and lifecycle in its header; fix only listing-specific parity differences.

## Acceptance and verification

- [x] Listing × 16 × 2 × applicable states passes, including Swift filter and dock interactions.
- [x] All ten entries and original tags/excerpts remain; Helm/METR fields independently match sources.
- [x] Intro ids, section numbers, card wrappers and AOS delays match baseline.
- [x] No draft page/card, default All pill or runtime rendering catalog.
- [x] Listing palette state survives navigation/reload before paint.

```bash
node --test --test-concurrency=1 tests/build/listing-html.test.ts
npm run build
PARITY_MODE=old-new npm run test:parity -- --grep @page:blog
```

## Agent handoff

### Completion evidence — 2026-09-08

The exact listing selection collected 224 tests and passed 224/224 across 16 themes and the actual
desktop/mobile projects with seven workers. Focused old-new and old-old controls passed 10/10
each. The final capture suite passed 12/12, including strict paired filtered-metadata handling and
missing, duplicate, asymmetric, unrelated-hidden, other-state and split-wrapper rejection.
The consolidated relevant Node suites passed 52/52. Root independently verified migration units 28/28
and canonical presentation 5/5 with the correct OLD pointer. Final check reported 149 files,
0 errors, 0 warnings and 48 existing hints; production built 65 pages with 0 draft fields.

Two fresh Astra correctness reviews independently found the same null-prose omission defect;
the original builder fixed it with conditional rendering and a real overlay-build regression.
Fresh Sol security and conventions reviews reported no findings. Root authorized narrow harness
corrections for the NEW listing script path and theme-aware Swift-filter destinations, then one
fresh bounded correction for legitimately excluded metadata masks. Selector groups, remaining
mask pixels, viewport/full-page behavior and parity tolerances remain unchanged.

One post-matrix TypeScript assertion changes raw helper source but is proven to emit byte-identical
JavaScript through installed Playwright 1.61.1; root reproduced and accepted that equivalence.
Check/build and capture 12/12 were rerun afterward. No software was installed. Owned test listeners
and processes were cleaned up; unrelated user processes were preserved.

Full commands, raw logs, failure dispositions, review reports, hash/equivalence proof and cleanup:
`/private/tmp/theme-engine-openai/s1-18/final-verification-report.md`.
S1-19 must correct its analogous stale NEW post-client script inventory when implementing posts.
S1-26 must replace the explicit scratch-only listing-to-same-theme-Home palette destination with
the complete cross-page matrix; the current test preserves real navigation/reload and pre-paint
assertions on each side. Post routes remain S1-19 work, so this stage stays 65 pages.

Record changed files, commands and exit results, and any interface adjustments in the completion report. Resolve implementation failures in scope; do not replace failed assertions with broader exclusions. Leave owner QA to the end of the complete migration.
