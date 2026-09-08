# S1-16 — Render carousel markup, dots and ticker data at build time

**Status:** Done · **Spec milestone:** T4 · **Scope:** one carousel component and runtime change

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

- [x] Port card DOM, pillars, images, descriptions joined with br/br, CTA wrappers and fc-style class exactly.
- [x] Preserve the source conditional for second CTA target: `external2 ? externalAttrs : linkTarget`. Test actual baseline output for both external CTAs and inherited targets; do not infer target behavior from the spec's contradictory Embedded Swift narrative.
- [x] Compute ticker using case-insensitive first-seen tech dedupe, “✷ ” + tag + space, doubled pass → half, doubled half → run, and Math.round(half.length / (402/46)) seconds.
- [x] Emit marquee's approved fallback unit repeated twelve times and doodle's approved message as quoted CSS values with safe escaping.
- [x] Change only those two content declarations to variable references. Keep CSS counters/glyphs untouched.
- [x] Remove rendering, runtime ticker generation, dot creation and dead EXPAND_VISUAL code; preserve click centering, scroll tracking, vertical wheel guard and early-return tilt predicate.
- [x] Document module ownership, inputs, dependencies and boot/listener lifecycle.

## Acceptance and verification

- [x] Eight cards/dots and ticker declarations exist in raw HTML before runtime initialization.
- [x] All project content/order/CTA targets match baseline; Deep RL has no empty CTA wrapper.
- [x] Ticker text/duration and fallback literals are byte-equal; no data-tech/data-slide-label bridges remain.
- [x] Dot 3, wheel guard, tilt and resize work at both widths.
- [x] Helper supplies CSS prose on non-carousel marquee/doodle pages too; later page agents consume it.

```bash
node --test tests/unit/canonical-presentation.test.ts
npx playwright test tests/browser/carousel.spec.ts
npm run check
```

## Agent handoff

Record changed files, commands and exit results, and any interface adjustments in the completion report. Resolve implementation failures in scope; do not replace failed assertions with broader exclusions. Leave owner QA to the end of the complete migration.

## Completion report

The canonical carousel and CSS-prose helper are ready for page assembly. This ticket proves isolated real OLD markup and interaction parity; assembled home/listing visual parity belongs to their page tickets. All source changes stay within the ten prescribed files. Home, script.js, BlogRail, shared picker, other skin sheets, workflows, protected instructions, OLD and unrelated work remain unchanged. Root owns git integration and the execution handoff.

**Files and interfaces:** `FeaturedCarousel.astro` accepts `{ theme: Theme, page: PageContext }` and owns the featured section/container/fades/track, eight source-order cards and eight approved labeled dots. It retains `fc-style-floating`, paragraph br/br separators, image/title/pill content and CTA inheritance from the first source CTA even when that CTA's label is null. Deep RL has no empty CTA wrapper. `presentation.ts` exports the exact `canonicalStyleExtras(themeId: string, options: { carousel: boolean }): Record<\`--${string}\`, string>` contract. It provides theme CSS prose independently of carousel presence and the OLD ticker on every carousel page; current ticker duration is87s. Quotes, backslashes, controls and serializer-reserved punctuation are safely escaped.

`public/js/featured-carousel.js` retains interaction, measurements, motion constants, early-return tilt polarity, fades, dot centering/scroll tracking and the vertical wheel guard against existing markup. It documents canonical ownership and document-lifetime initialization/listeners. Marquee and doodle each change only the prescribed content declaration. `tests/unit/canonical-presentation.test.ts` owns five OLD-derived/helper-boundary tests; `tests/browser/carousel.spec.ts` owns twelve browser cases; fixture `Page.astro`, `src/pages/[variant].astro` and `astro.config.mjs` provide isolated production-component routes and build configuration.

**Final verification:** Node commands prefix `PATH=/private/tmp/theme-engine-openai/s1-13/node-v24.20.0-darwin-arm64/bin:$PATH`. No installs. Logs below are under `/private/tmp/theme-engine-openai/s1-16/logs/`.

| Exact command | Final result | Raw log |
|---|---|---|
| `node --test tests/unit/canonical-presentation.test.ts` | exit0,5/5; root independently repeated | `unit-review-green.log` |
| `TEST_BUILD_OUT_DIR=/private/tmp/theme-engine-openai/s1-16/browser-builds PARITY_OUT_DIR=/private/tmp/theme-engine-openai/s1-16/browser-output ./node_modules/.bin/playwright test tests/browser/carousel.spec.ts` | exit0,12/12,7workers,8.8s | `browser-review-final.log` |
| `npm run check` | exit0,143files,0errors,0warnings,48existing hints | `npm-check-review-final.log` |
| `node --check public/js/featured-carousel.js` | exit0 | `node-check-review-final.log` |
| `git diff --check`; direct byte/EOF checks for all8 new files | clean; controller independently confirmed no trailing whitespace and exactly one final LF | `diff-noindex-review-final.log`; `new-file-format-review-final.log` |

Raw HTML contains all cards/dots and ticker/prose before scripts initialize. Actual immutable OLD home/listing carousel DOM matches at configured1440/390 widths, including current external second CTAs and an equivalent OLD/new mutation proving inherited targets when the first label is null. Unit expectations execute OLD ticker code and extract OLD CSS literals, preserving exact first-seen dedupe, casing, spacing, half/run/duration and fallback values. Browser cases use real click3, trusted wheel and scroll, fades and both breakpoint directions. Both configured desktop and mobile-touch projects verify real VanillaTilt settings/glare/initialization/no-tilt. Trusted hover movement is separately proven in a desktop-input context at actual1440 and390 widths because the mobile-touch browser suppresses hover input. No acceptance case was skipped.

**Reviews and dispositions:** Two fresh Astra correctness reviews and Sol security/conventions reviews inspected the frozen full10-file diff in two waves. Security had no findings. The other three independently identified one merged P2: literal semicolons/braces in valid future CSS prose failed the existing Shell serializer. The original builder's single fix pass hex-escapes those characters and adds regression evidence through the real `declarations()` boundary, with red4pass/1fail then green5/5 and decoded text equality. Current approved bytes remain unchanged. No second review round, unresolved provisional fix or known acceptance failure remains. Reports and dispositions are in the ticket scratch root; `final-file-list.txt` records final hashes.

Initial fixture failures were corrected in scope: accidental helper route, missing OLD vendor dependencies, premature smooth-scroll sampling and endpoint scroll-snap assumptions. The first unit run was4pass/1fail, fixed by targeting the owning OLD doodle declaration. Sandboxed loopback binds failed before approved execution; no unavailable run is counted as passing. One initial elevated6pass/5fail browser stream was not copied from the tool transcript into a scratch raw log; this capture limit is explicitly accepted because all subsequent focused and final corrected runs have raw logs. The two unchanged CSS comments retain legacy context under the declaration-only scope.

**Cleanup and S1-17 handoff:** Fixture builds use unique scratch source/package roots, separate Astro/Vite caches,180000ms build bounds and ephemeral127.0.0.1 listeners, with failure/finally cleanup. The final build root is empty. Controller's final approved `pgrep -af '[p]laywright|[h]eadless_shell|[c]arousel|[a]stro/bin/astro.mjs'` returned exit1, empty; `lsof -nP -iTCP -sTCP:LISTEN` returned exit0 with no owned Node/listener or8765. Logs are `controller-final-process-check.log` and `controller-final-listener-check.log`. Other processes were never signaled. S1-17 supplies the page-specific project header/outer wrapper/spacer, calls `canonicalStyleExtras(theme.id, { carousel: true })` when creating PageContext, and preserves the existing initializer/script order. Later canonical non-carousel pages call the same helper with `carousel: false`. Owner QA remains at migration completion.
