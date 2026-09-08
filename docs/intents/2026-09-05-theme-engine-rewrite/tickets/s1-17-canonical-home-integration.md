# S1-17 — Assemble canonical home and verify all 16 themes

**Status:** Done · **Spec milestone:** T4 · **Scope:** one page integration

**Depends on:** [S1-15](s1-15-home-sections-and-jobs-behavior.md), [S1-16](s1-16-carousel-and-css-prose.md)

Assign one agent this ticket plus the [execution contract](../../../superpowers/plans/2026-09-05-spec-1-migration-engine.md). Read [Spec 1](../spec-1-migration-engine-parity.md) §6.2 home head, §8 load order, §9 home states and §15. Dependencies supply code and evidence; there is no owner review between tickets.

## Deliverable

A complete canonical home under all 16 themes, consuming the finished prose, components and runtimes with measured visual/behavior parity.

## Files

- Modify: `src/layouts/canonical/Home.astro`, `src/pages/[...theme]/index.astro` only for final route props.
- Create: `src/layouts/canonical/components/BlogRail.astro`, `tests/build/home-html.test.ts`.
- Read: `index.html`, registry, listingPosts and all home components.
- Narrow fixes in dependency-owned home files are allowed after their agents finish; identify each in the completion report.

## Interfaces

- BlogRail consumes all ten listingPosts in listingOrder, using each record's bound post accessor for text and href for local destinations.
- Home supplies `canonicalStyleExtras(theme.id, { carousel: true })` to Shell via page.styleExtras.
- Home emits exactly one masthead JSON island and one nav picker mount; Shell owns dock/scrim/cycler tail.

## Work

- [x] Compose Hero/About/Skills/Jobs/FeaturedCarousel/BlogRail/Contact and shared chrome in the exact baseline order and nesting.
- [x] Render all ten rail cards with original date/title/excerpt markup, external target behavior and scroll fades.
- [x] Reproduce the home head/resource order: pinned vendor paths, synchronous vanilla-tilt/anim-utils, home's deferred AOS/carousel/typing and async Calendly.
- [x] Keep gsap 3.9.1 loaded as specified, even though unused; no optional library cleanup.
- [x] Use Meta for the required shared spine, placing canonical/OG/favicons and ThemeAssets exactly as baseline requires.
- [x] Run all home theme/state comparisons; resolve home implementation diffs without broadening §15 exclusions.
- [x] Confirm raw HTML contains all content/dots/rail/ticker data without legacy catalog scripts.

## Acceptance and verification

- [x] Home × 16 × 2 × applicable states passes DOM, screenshot, computed-style and resource assertions.
- [x] Helm/METR changed rail metadata equals their post sources; all other text/order stays unchanged.
- [x] Job, wheel, sticky nav, contact scroll, dock and palette navigation/reload tests pass.
- [x] Default has no unwanted tokens/assets; skin-specific styles match baseline.
- [x] No canonical initialization or runtime catalog is needed to construct the served content.

```bash
node --test --test-concurrency=1 tests/build/home-html.test.ts
npm run build
PARITY_MODE=old-new npm run test:parity -- --grep @page:home
```

For persistence, navigate between completed home/theme URLs until the full page matrix is available; S1-26 reruns matrix-wide navigation.

## Completion evidence — 2026-09-08

The canonical home and source-owned ten-card rail are complete for all 16 themes. The exact
old-new Home selection listed 256 tests and passed 256/256 at the required desktop and mobile
projects with seven workers. Focused old-new and old-old controls passed 5/5 each for default
contact, default palette persistence, and Miami carousel wheel. The viewport capture helper now
freezes animations at the live anchor and clips accepted exception rectangles to visible viewport
pixels without changing full-page capture or §9 tolerances.

The final isolated build suites passed 24/24, including seven raw Home assertions and the complete
65-page staged surface. The parity migration unit suite passed 25/25. Astro check reported 0 errors,
0 warnings and 48 hints; the isolated production build reported zero draft fields and 65 pages.
No packages were installed. Full command and cleanup evidence is recorded in
`/private/tmp/theme-engine-openai/s1-17/final-verification-report.md`.

## Agent handoff

Record changed files, commands and exit results, and any interface adjustments in the completion report. Resolve implementation failures in scope; do not replace failed assertions with broader exclusions. Leave owner QA to the end of the complete migration.
