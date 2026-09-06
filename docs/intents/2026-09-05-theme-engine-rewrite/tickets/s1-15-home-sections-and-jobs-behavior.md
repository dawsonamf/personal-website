# S1-15 — Port home sections, masthead and jobs behavior

**Status:** Unstarted · **Spec milestone:** T4 · **Scope:** one home component family

**Depends on:** [S1-14](s1-14-canonical-navigation-and-shared-behavior.md)

Assign one agent this ticket plus the [execution contract](../../../superpowers/plans/2026-09-05-spec-1-migration-engine.md). Read [Spec 1](../spec-1-migration-engine-parity.md) §4.1–4.2, §8, D15/D17/D32/D36. Dependencies supply code and evidence; there is no owner review between tickets.

## Deliverable

Canonical home prose sections and their existing behavior, ready for assembly without changing the shared picker or carousel.

## Files

- Create: `src/layouts/canonical/components/Hero.astro`, `About.astro`, `Skills.astro`, `Jobs.astro`, `Contact.astro` in the same directory.
- Create: `public/js/script.js`, `tests/browser/home-sections.spec.ts`, `tests/fixtures/home-sections/`.
- Read: `index.html`, `js/script.js`, `src/prose/masthead.ts`.
- Do not modify `Home.astro` (S1-17 integrates), carousel files, shared runtime files or stylesheets.

## Interfaces

- Each component consumes `{ theme, page }` plus approved prose via the shared accessor.
- Hero emits `script[type="application/json"]#masthead-sequences` using deriveMastheadSteps; script.js splices startAnimations after the first type.
- Jobs keeps `data-job="job-{i+1}"` and matching panel ids in source order; content ids never become DOM keys.
- Section numbers remain presentation generated from page order, with exact two-digit labels.
- script.js assumes canonical nav/shared runtimes and already-rendered carousel/rail markup; it does not render data catalogs.

## Work

- [ ] Reproduce home wrappers/classes, hero subtitle joining and numbered headings without adding Astro wrappers.
- [ ] Render canonical paragraph arrays with br/br separators inside existing elements; preserve all bullets, emphasis, links, image alt text and contact links.
- [ ] Port intro wave, jobs measurements/transitions/rail, smooth scrolling, AOS and rail scroll-fade behavior with existing constants.
- [ ] Read derived masthead steps from the JSON island; delete inline sequence catalogs and dead once guards.
- [ ] Remove renderBlogCards but keep its tilt initialization on already-rendered rail cards.
- [ ] Preserve opposite tilt predicates: the early return at legacy :257 checks presence of data-no-tilt; the positive rail initializer at :397 checks its absence.
- [ ] Document canonical module inputs, initialization order and listeners in its header.
- [ ] Exercise job tab switching and geometry with the actual numbered keys at desktop/mobile widths.

## Acceptance and verification

- [ ] Canonical section DOM/text matches baseline; no component-generated paragraph/section wrapper drift.
- [ ] Ten animation-finalized elements, highlight geometry and first typing callback settle as before.
- [ ] Job tab 2 targets job-2; horizontal mobile jobs rail works after resize.
- [ ] Hero subtitle, mailto target/rel and every Calendly binding preserve behavior.
- [ ] No runtime prose parser, FEATURED_PROJECTS/BLOG_POSTS global, or page markup builder.

```bash
npx playwright test tests/browser/home-sections.spec.ts
npm run check
```

## Agent handoff

Record changed files, commands and exit results, and any interface adjustments in the completion report. Resolve implementation failures in scope; do not replace failed assertions with broader exclusions. Leave owner QA to the end of the complete migration.
