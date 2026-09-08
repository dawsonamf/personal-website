# S1-15 — Port home sections, masthead and jobs behavior

**Status:** Done · **Spec milestone:** T4 · **Scope:** one home component family

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
- Numbered About/Jobs/Contact components additionally require `sectionIndex`, the zero-based position derived by the page caller from its single section-order list; each formats `index + 1` as two digits.
- Hero emits `script[type="application/json"]#masthead-sequences` using deriveMastheadSteps; script.js splices startAnimations after the first type.
- Jobs keeps `data-job="job-{i+1}"` and matching panel ids in source order; content ids never become DOM keys.
- Section numbers remain presentation generated from page order, with exact two-digit labels.
- script.js assumes canonical nav/shared runtimes and already-rendered carousel/rail markup; it does not render data catalogs.

## Work

- [x] Reproduce home wrappers/classes, hero subtitle joining and numbered headings without adding Astro wrappers.
- [x] Render canonical paragraph arrays with br/br separators inside existing elements; preserve all bullets, emphasis, links, image alt text and contact links.
- [x] Port intro wave, jobs measurements/transitions/rail, smooth scrolling, AOS and rail scroll-fade behavior with existing constants.
- [x] Read derived masthead steps from the JSON island; delete inline sequence catalogs and dead once guards.
- [x] Remove renderBlogCards but keep its tilt initialization on already-rendered rail cards.
- [x] Preserve opposite tilt predicates: the early return at legacy :257 checks presence of data-no-tilt; the positive rail initializer at :397 checks its absence.
- [x] Document canonical module inputs, initialization order and listeners in its header.
- [x] Exercise job tab switching and geometry with the actual numbered keys at desktop/mobile widths.

## Acceptance and verification

- [x] Canonical section DOM/text matches baseline; no component-generated paragraph/section wrapper drift.
- [x] Ten animation-finalized elements, highlight geometry and first typing callback settle as before.
- [x] Job tab 2 targets job-2; horizontal mobile jobs rail works after resize.
- [x] Hero subtitle, mailto target/rel and every Calendly binding preserve behavior.
- [x] No runtime prose parser, FEATURED_PROJECTS/BLOG_POSTS global, or page markup builder.

```bash
npx playwright test tests/browser/home-sections.spec.ts
npm run check
```

## Agent handoff

Record changed files, commands and exit results, and any interface adjustments in the completion report. Resolve implementation failures in scope; do not replace failed assertions with broader exclusions. Leave owner QA to the end of the complete migration.

## Completion report

The five canonical home components and home behavior are ready for S1-17 assembly. This ticket proves isolated section DOM and behavior, not assembled-home visual parity. `Home.astro`, carousel/shared runtimes, styles, Shell, picker, OLD and protected worktrees remain unchanged. Root owns git integration and the execution handoff; unrelated `harness/scripts 2.ts` is excluded.

**Files and interfaces:** `Hero.astro` owns the hero, home Socials, derived masthead JSON island and spacer. `About.astro` owns its header, shared `#about` container, left card and spacer; `Skills.astro` emits the direct right card. `Jobs.astro` owns positional tabs/panels and spacer; `Contact.astro` owns its header/body/contact Socials/map and spacer. All take `{ theme, page }`; About/Jobs/Contact additionally require zero-based `sectionIndex`, derived by the caller from one page-order list. They format `index + 1` to two digits. About preserves its trailing lone br and all paragraph arrays retain br/br separators. Null prose omits owning slots, with remaining jobs retaining original source-position keys.

`public/js/script.js` retains the intro, jobs, scroll, AOS, tilt and rail behavior and constants. It reads `#masthead-sequences`, inserts the callback after the first type, and initializes already-rendered cards without prose/catalog/markup rendering. The module header specifies dependencies, ordering and document-lifetime listeners. `tests/browser/home-sections.spec.ts` plus `Page.astro`, `astro.config.mjs`, `src/pages/[variant].astro`, `public/js/fixture-carousel.js` and `public/js/fixture-probe.js` under `tests/fixtures/home-sections/` provide real isolated Astro inputs and runtime observation.

**Verification:** Every Node command prefixes `PATH=/private/tmp/theme-engine-openai/s1-13/node-v24.20.0-darwin-arm64/bin:$PATH` (Node24.20.0/npm11.19.0). No installs. Logs below are under `/private/tmp/theme-engine-openai/s1-15/logs/`.

| Command | Final evidence | Log |
|---|---|---|
| `TEST_BUILD_OUT_DIR=/private/tmp/theme-engine-openai/s1-15/fix-final-builds PARITY_OUT_DIR=/private/tmp/theme-engine-openai/s1-15/fix-final-playwright-output ./node_modules/.bin/playwright test tests/browser/home-sections.spec.ts` | exit0, 12/12, seven workers, both widths, 11.2s | `fix-final-browser.log` |
| `npm run check` | exit0, 135 files, 0 errors, 0 warnings, 48 existing hints | `fix-final-check.log` |
| `node --check public/js/script.js` and each fixture JS module | all exit0 | `fix-final-node-checks.log` |
| `node --test tests/unit/masthead.test.ts tests/unit/site-prose.test.ts` | exit0, 155/155; unchanged source contracts | `unit-source-contracts.log` |
| `git diff --check`; direct EOF/trailing-whitespace and no-index checks on all12 introduced source files | clean, including untracked additions | `fix-final-no-index.log`; `../controller-spotcheck.md` |

The suite compares actual immutable OLD owned-section DOM/text at1440/390, asserts true viewport width, wrapper/spacer ancestry, br counts, subtitle, links/alts and null slots, and proves caller-driven numbering with reordered input. It exercises job2, both500ms transition boundaries, click gating, desktop/mobile highlight geometry, horizontal scroll, resize in both directions and ResizeObserver reseating. Real typing reaches the first callback; all ten intro targets receive the wave. Rendered targets naturally finalize through trusted CSS animation events with exact names/durations/delays; viewport-hidden targets remain hidden, matching the established baseline sentinel contract. No synthetic animationend event supplies completion proof. AOS, smooth-scroll offsets/clamps, both tilt polarities on actual cards, rail fades/resize and all Calendly/mailto contracts are covered.

Normalization is limited to comments/ASCII formatting whitespace, attribute ordering, approved URL moves and enumerated transient animation classes/styles. No owned content or element is removed. The actual ten-card rail remains outside owned-section text equality because its Helm/METR differences are already approved by Spec1 §15/S1-13; it supplies real geometry/tilt/fade inputs. Full carousel interaction is deliberately represented only by an initializer boundary recorder until S1-16.

**Reviews and dispositions:** Two fresh Astra correctness reviews plus fresh Sol security/conventions reviews ran in two waves on a frozen12-file diff. Correctness A independently matched all nine runtime masthead configurations to OLD; security reported no findings. The consolidated original-owner fix pass addressed correctness B's synthetic-animation evidence gap, conventions' duplicated page-order ownership, and controller findings for missing fixture viewport metadata and an extra Skills EOF newline. Final checks above cover the corrected sources. No second review round, known acceptance failure or unresolved provisional fix remains. Reports, disposition, original raw failures and final source hashes are under `/private/tmp/theme-engine-openai/s1-15/`.

**Cleanup and handoff:** Unique scratch sources/caches/package links,180000ms bounded builds and ephemeral servers explicitly bound to127.0.0.1 are removed in setup-failure/finally cleanup. `fix-final-cleanup.log` records no owned build children, repository fixture caches or Node listeners; unrelated PythonPID65794 remains at127.0.0.1:49926, untouched. S1-16 supplies FeaturedCarousel, its presentation and carousel runtime; S1-17 owns BlogRail. S1-17 should assemble Nav, Hero, About (already includes Skills), Jobs, project/blog sections, Contact and both footer variants; supply indices from its one section-order list and preserve the established home resource ordering. Do not render Skills twice or add duplicate spacers. Owner QA remains at migration completion.
