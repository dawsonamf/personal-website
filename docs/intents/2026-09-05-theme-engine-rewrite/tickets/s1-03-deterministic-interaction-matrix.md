# S1-03 — Complete deterministic baseline interactions

**Status:** Done with risks 2026-09-07 · **Spec milestone:** T1 · **Scope:** one interaction harness change

**Depends on:** [S1-02](s1-02-baseline-harness-and-captures.md)

Assign one agent this ticket plus the [execution contract](../../../superpowers/plans/2026-09-05-spec-1-migration-engine.md). Read [Spec 1](../spec-1-migration-engine-parity.md) §9 determinism, settle, matrix and manual-QA behavior inventory. Dependencies supply code and evidence; there is no owner review between tickets.

## Deliverable

The full old-old baseline suite, with draw-aware typing seeds, reliable interaction states and no skipped failures.

## Files

- Modify: `harness/parity.spec.ts`, `harness/settle.ts`, `harness/sentinels.ts`, `harness/scripts.ts`, `harness/fixtures/baseline/README.md`.
- Create: `harness/interactions.ts`, `harness/determinism.ts`, `tests/unit/parity-seeds.test.ts`.
- Read: `research/page-behavior-and-blog-pipeline.md` alongside Spec 1 §17's corrections.

## Interfaces

- `seedFor(index: number, count: number, draw: number): number` returns the smallest mulberry32 seed selecting the requested index on the given 1-based draw.
- Home masthead: index 3 on draw 2; a second mobile state pins index 0. Listing: choose and record the shortest sequence on draw 1.
- Test titles carry `@theme:<id>`, `@page:home|blog|post|privacy|notFound|lexchat`, and `@state:<name>`.
- Preserve `PARITY_MODE=old-old`; S1-13 introduces old-new behavior.

## Work

- [x] Inject deterministic randomness before site scripts. Assert intended terminal text and deletion path, not merely a numeric seed.
- [x] Complete readiness: ten pinned home elements, jobs highlight geometry, eight cards/eight dots, stable section rule, post read-time/Mermaid, loaded 404 theme sheet.
- [x] Add job tab 2, carousel dot 3, wheel over track, sticky scroll 800→500, smooth-scroll contact, picker click, listing Swift filter and palette interaction states wherever the baseline has the element.
- [x] Test palette navigation/reload with the baseline's reset behavior in old-old mode. Preserve before/after evidence for S1-13's new persistence assertions.
- [x] Apply exactly §9's API abort list. Keep Google Fonts and required library CDNs available. Report external dependency failures rather than masking them.
- [x] Assert desktop fine-pointer hover and mobile no-hover. Keep the mouse untouched before captures except the wheel state; use fresh contexts for independent scenarios.
- [x] Attach DOM/style/network evidence to failures and tear down both servers.

## Acceptance and verification

- [x] All 16 × 8 × 2 baseline combinations and applicable interaction states pass.
- [x] The wheel test proves the vertical wheel guard and does not substitute a dot click.
- [x] Palette, dock timings, script order and mobile pointer paths are exercised.
- [x] Disabling a required readiness condition produces a test failure within 15 seconds.
- [x] No failures become skips; no first-run images are mislabeled as verified new-site baselines.

```bash
node --test tests/unit/parity-seeds.test.ts
PARITY_MODE=old-old npm run test:parity
lsof -nP -iTCP:8781 -sTCP:LISTEN
lsof -nP -iTCP:8782 -sTCP:LISTEN
```

## Agent handoff

Record changed files, commands and exit results, and any interface adjustments in the completion report. Resolve implementation failures in scope; do not replace failed assertions with broader exclusions. Leave owner QA to the end of the complete migration.

## Completion report

Done with risks, 2026-09-07. Ran on Node v25.9.0 (Node 24 not installed; `.nvmrc`=24 stays the CI contract) in an agent worktree, so every run exported `PARITY_OLD_DIR=/Users/dawsonamf/Desktop/dax/personal-website-old`; the code default `../personal-website-old` is unchanged. Two account rate limits and two network outages interrupted agents mid-work and cost time only; every affected verification was re-run.

**Created:** `harness/determinism.ts` (seeded `Math.random`, index-to-seed search, masthead history, generated-id and cursor-follower canonicalisers), `harness/interactions.ts` (state registry, hooks, helpers), `tests/unit/parity-seeds.test.ts` (10 pure tests). **Modified:** `harness/parity.spec.ts`, `harness/settle.ts`, `harness/sentinels.ts`, `harness/fixtures/baseline/README.md`; `playwright.config.ts` (S1-02's file per the ownership table: only the two comparison projects' `grepInvert` regexes gained `|@only:mobile-390` and `|@only:desktop-1440`, plus a three-line comment). `harness/scripts.ts` was listed but needed no change: no state loads a new script. Legacy files, `CNAME`, `.nojekyll`, the baseline checkout and `harness/{normalize,urls,baseline}.ts` untouched. Run artifacts stay gitignored under `harness/__parity__/`.

**Interfaces (consumed by S1-13 old-new, S1-17/S1-26 full matrix):**
- Titles: `@theme:<id> @page:<type> [@post:<id>] @state:<name> [@only:<project>]`. States: `settled`; `masthead-0` (home, `@only:mobile-390`, index 0 delete path); `jobs-tab-2` (home); `carousel-dot-3`, `carousel-wheel` (home, blog, both viewports); `sticky-nav` (home, blog, post); `smooth-scroll-contact` (home, `@only:desktop-1440`, the mobile row has no Contact item); `picker-open` (home, blog, post); `filter-swift` (blog); `palette` (home, blog, post: shuffle, navigate to the next matrix page asserting the pre-paint palette, reload asserting the baseline's reset). 963 tests = 480 per comparison project + 3 `@capture:`. Grep needs `.*` between tags, e.g. `--grep '@theme:marquee.*@state:palette'`. Project-restricted states are filtered by the config `grepInvert`, never skipped at runtime.
- `determinism.ts`: `mulberry32`, `pickIndex`, `seedFor(index, count, draw)`, `MASTHEAD_DRAW {home: 2, blog: 1}`, `MASTHEAD_INDEX {home: 3, blog: 6}`, `HOME_DELETE_INDEX 0`, `STATIC_PAGE_SEED 1`, `mastheadSeed`, `seedForPage`, `installDeterminism(page, seed)`, `randomDraws`, `recordMastheadHistory(page)`, `mastheadHistory(page, id)`, `canonicalizeGeneratedIds` (`mermaid-<13 digits>` to `mermaid-T<n>` by first appearance, both sides), `canonicalizeCursorFollower` (1-decimal rounding of `.cursor-follow`/`.circle-follow` inline `left`/`top`). Seeds: home 13 (draw 2 gives index 3), home delete path 0, listing 4 (draw 1 gives index 6), static pages 1; the draw counts are confirmed empirically and dumped per side in `<side>.determinism.json`.
- `interactions.ts`: `StateName`, `Interaction {pages, only?, mastheadIndex?, quiesce?, install?, run?, after?}`, `InteractionContext {pair, pageType, project, side, origin, deadline, evidence}`, `INTERACTIONS`, `statesFor(pair)`, `nextPair(pair)`, `primeReveals`, `refreshAos`. Palette navigation is side-aware (`oldPath`/`newPath`); S1-13's flip point (reload persistence, D11) is marked `>>> S1-13 FLIPS THE NEXT THREE ASSERTIONS <<<`.
- `settle.ts`: `settle(page, pageType, opts?: {mastheadIndex})`; `afterInteraction(page, pageType, deadline, opts?)` runs fonts settled, `quiesceLayout`, in-view AOS, no running finite animation, `--section-rule` stable, post assets. `sentinels.ts`: `ready(page, deadline, opts?)`, `quiesceLayout`, `sectionRuleStable`, `holdSteady`, `postAssetsSettled`, `ROLE_TOKENS`, `intendedTerminals`, `pageTerminals`.
- Evidence per test under `harness/__parity__/dumps/<project>/<theme>/<pageId>/<state>/`: `<side>.{response.html,dom.txt,styles.json,network.json,scripts.json,determinism.json,interaction.json,png}` plus `<side>.palette.json`; the evidence records are compared `toEqual` across sides. OLD writes the snapshot reference every run; NEW is only compared. Two condition-based ordering fences in `openSide`, both sides: the post markdown is held until the page's post-`load` idle fence (post nodes always last) and vanilla-tilt is held until every `link[data-style-asset]` has a `.sheet` (glare sizes measured on the skinned layout). `abortApis` is registered last, so the §9 abort list is evaluated first.

**Commands and results (final code):** `./node_modules/.bin/tsc --noEmit -p tsconfig.json` exit 0. `npm run test:unit`: tests 158, pass 158, fail 0, skipped 0. `node --test tests/unit/parity-seeds.test.ts`: 10/10. `--list`: 963 (480 / 480 / 3), no cross-project `@only:` leakage. `PARITY_OLD_DIR=/Users/dawsonamf/Desktop/dax/personal-website-old PARITY_MODE=old-old npm run test:parity` (unsharded, under `caffeinate -i -s`, traces via `--output` in the session scratchpad): **963 passed (24.0m)**, exit 0, 0 failed, 0 skipped, 0 flaky. Afterwards `lsof -nP -iTCP:8781 -sTCP:LISTEN` exit 1, `lsof -nP -iTCP:8782 -sTCP:LISTEN` exit 1, `pgrep -fl 'http.server|playwright'` empty. Earlier full runs are recorded as interrupted or contaminated, never as results: three builder attempts stopped under machine load (187, 213, 28 tests), sweep-1 291 passed / 672 failed (4.5 h) and sweep-2 stopped at 93 / 64 during network outages (CDN `net::ERR_FAILED`, check 4 firing as designed), sweep-3 on pre-fix code stopped at 655 passed / 1 failed (marquee home `picker-open`, dock heading-font swap, fixed), sweep-4 960 passed / 3 failed (wheatpaste blog glare width race, fixed). Readiness-disable check: expecting 9 carousel dots fails one home test at exactly 15.0 s with `settle(home) hit its 15000ms deadline in carousel: 8 carousel dots, expected 9`.

**Deviations and adjustments:** the listing pins index 6 (`Side quests.`), the actual shortest sequence (2555 vs 2670 ms), not S1-02's index 3; a unit test derives it from `masthead.json`. Masthead readiness asserts the observed step-terminal path equals the pinned sequence's, because the final text alone is shared by five home and all seven listing sequences. Clicks use `dispatchEvent('click')` so the mouse never moves except in the wheel state, which sends two gestures (a `{40, 60}` lock gesture the guard must undo, then the pure vertical 300) because Chromium latches a mixed gesture to the track; a dot click fails four of its assertions. `sticky-nav` also runs on blog and post (the element exists); `smooth-scroll-contact` is home and desktop only. Palette: the old side restores a saved palette pre-paint on navigation and clears it on reload (`theme-bootstrap.js:731`), asserted through the first-paint storage being null. Review: four fresh reviewers (two Fable correctness, Opus security, Opus conventions), one fix pass (masthead identity, listing index, dock fonts wait, side-aware palette navigation, follower class-token match, evidence written before `after` assertions, condition-based `.md` fence plus route order, mixed wheel gesture, five wrong legacy line refs, README and cleanup), then one further Opus dispatch for the sweep-surfaced glare race. Security found no exploitable boundary.

**Accepted risks:** `settle()`'s single 15 s deadline is load-sensitive (spec contract; mass `no probe result yet` failures mean load, not code). The old side loads Google Fonts and thirteen library CDNs live; an outage fails check 4 explicitly. `quiesceLayout` dispatches the page's own `scroll` listeners, which leaves `menu-invisible` on `.moving-menu` and `transition: none` on `#highlight` even on desktop: user-reachable legacy states, identical on both sides, documented in the README. `canonicalizeGeneratedIds` is a both-sides determinism canonicalisation of Mermaid's epoch ids outside §9's table (distinctness preserved). Node 25. **Environment:** `~/Desktop` is iCloud-synced; a full run's ~12k artifact writes pegged `bird`/`fileproviderd` (load 138) and stalled runs, so in this worktree `harness/__parity__/{dumps,snapshots}` are symlinks into the session scratchpad and runs used `--output` there (gitignored, local only, reversible). Recommend running the harness outside synced trees or adding a `PARITY_OUT_DIR` in a later ticket. No environment blocks remain.
