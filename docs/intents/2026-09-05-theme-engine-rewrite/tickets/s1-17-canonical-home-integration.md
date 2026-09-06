# S1-17 — Assemble canonical home and verify all 16 themes

**Status:** Unstarted · **Spec milestone:** T4 · **Scope:** one page integration

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

- [ ] Compose Hero/About/Skills/Jobs/FeaturedCarousel/BlogRail/Contact and shared chrome in the exact baseline order and nesting.
- [ ] Render all ten rail cards with original date/title/excerpt markup, external target behavior and scroll fades.
- [ ] Reproduce the home head/resource order: pinned vendor paths, synchronous vanilla-tilt/anim-utils, home's deferred AOS/carousel/typing and async Calendly.
- [ ] Keep gsap 3.9.1 loaded as specified, even though unused; no optional library cleanup.
- [ ] Use Meta for the required shared spine, placing canonical/OG/favicons and ThemeAssets exactly as baseline requires.
- [ ] Run all home theme/state comparisons; resolve home implementation diffs without broadening §15 exclusions.
- [ ] Confirm raw HTML contains all content/dots/rail/ticker data without legacy catalog scripts.

## Acceptance and verification

- [ ] Home × 16 × 2 × applicable states passes DOM, screenshot, computed-style and resource assertions.
- [ ] Helm/METR changed rail metadata equals their post sources; all other text/order stays unchanged.
- [ ] Job, wheel, sticky nav, contact scroll, dock and palette navigation/reload tests pass.
- [ ] Default has no unwanted tokens/assets; skin-specific styles match baseline.
- [ ] No canonical initialization or runtime catalog is needed to construct the served content.

```bash
node --test --test-concurrency=1 tests/build/home-html.test.ts
npm run build
PARITY_MODE=old-new npm run test:parity -- --grep @page:home
```

For persistence, navigate between completed home/theme URLs until the full page matrix is available; S1-26 reruns matrix-wide navigation.

## Agent handoff

Record changed files, commands and exit results, and any interface adjustments in the completion report. Resolve implementation failures in scope; do not replace failed assertions with broader exclusions. Leave owner QA to the end of the complete migration.
