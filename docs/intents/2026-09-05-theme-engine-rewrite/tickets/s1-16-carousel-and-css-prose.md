# S1-16 — Render carousel markup, dots and ticker data at build time

**Status:** Unstarted · **Spec milestone:** T4 · **Scope:** one carousel component and runtime change

**Depends on:** [S1-14](s1-14-canonical-navigation-and-shared-behavior.md)

Assign one agent this ticket plus the [execution contract](../../../superpowers/plans/2026-09-05-spec-1-migration-engine.md). Read [Spec 1](../spec-1-migration-engine-parity.md) §5.4, §8, D14/D15/D32/D35. Dependencies supply code and evidence; there is no owner review between tickets.

## Deliverable

A shared home/listing carousel reproduces today's markup and motion, with data-derived DOM/CSS emitted before scripts run.

## Files

- Create: `src/layouts/canonical/components/FeaturedCarousel.astro`, `src/layouts/canonical/presentation.ts`, `public/js/featured-carousel.js`.
- Modify: `public/css/themes/marquee.css`, `public/css/themes/doodle.css`.
- Create: `tests/unit/canonical-presentation.test.ts`, `tests/browser/carousel.spec.ts`, `tests/fixtures/carousel/`.
- Read: `js/featured-carousel.js`, `js/blog-data.js`.
- Do not modify Home, script.js, shared picker, other skin sheets or workflows.

## Interfaces

- FeaturedCarousel consumes `{ theme, page }`, renders eight approved projects in source order, eight dots, and approved dot labels using carousel.goToSlide.
- ``canonicalStyleExtras(themeId: string, options: { carousel: boolean }): Record<`--${string}`, string>`` returns the canonical page's CSS-prose declarations and optional ticker declarations.
- All canonical layouts call that helper when supplying PageContext.styleExtras. Its prose mapping stays out of pure themeHtml.
- Runtime initializes existing cards/dots and performs only interaction, measurements and tilt.

## Work

- [ ] Port card DOM, pillars, images, descriptions joined with br/br, CTA wrappers and fc-style class exactly.
- [ ] Preserve the source conditional for second CTA target: `external2 ? externalAttrs : linkTarget`. Test actual baseline output for both external CTAs and inherited targets; do not infer target behavior from the spec's contradictory Embedded Swift narrative.
- [ ] Compute ticker using case-insensitive first-seen tech dedupe, “✷ ” + tag + space, doubled pass → half, doubled half → run, and Math.round(half.length / (402/46)) seconds.
- [ ] Emit marquee's approved fallback unit repeated twelve times and doodle's approved message as quoted CSS values with safe escaping.
- [ ] Change only those two content declarations to variable references. Keep CSS counters/glyphs untouched.
- [ ] Remove rendering, runtime ticker generation, dot creation and dead EXPAND_VISUAL code; preserve click centering, scroll tracking, vertical wheel guard and early-return tilt predicate.
- [ ] Document module ownership, inputs, dependencies and boot/listener lifecycle.

## Acceptance and verification

- [ ] Eight cards/dots and ticker declarations exist in raw HTML before runtime initialization.
- [ ] All project content/order/CTA targets match baseline; Deep RL has no empty CTA wrapper.
- [ ] Ticker text/duration and fallback literals are byte-equal; no data-tech/data-slide-label bridges remain.
- [ ] Dot 3, wheel guard, tilt and resize work at both widths.
- [ ] Helper supplies CSS prose on non-carousel marquee/doodle pages too; later page agents consume it.

```bash
node --test tests/unit/canonical-presentation.test.ts
npx playwright test tests/browser/carousel.spec.ts
npm run check
```

## Agent handoff

Record changed files, commands and exit results, and any interface adjustments in the completion report. Resolve implementation failures in scope; do not replace failed assertions with broader exclusions. Leave owner QA to the end of the complete migration.
