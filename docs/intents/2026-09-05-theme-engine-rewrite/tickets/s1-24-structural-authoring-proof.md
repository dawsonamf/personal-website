# S1-24 — Prove structural theme authoring through an isolated fixture

**Status:** Done 2026-09-08 · **Spec milestone:** T8 · **Scope:** one authoring integration test

**Depends on:** [S1-22](s1-22-subsites-redirects-and-public-boundary.md)

Assign one agent this ticket plus the [execution contract](../../../superpowers/plans/2026-09-05-spec-1-migration-engine.md). Read [Spec 1](../spec-1-migration-engine-parity.md) §1.1, §5.3, §11 and D3/D25/D26/D38. Dependencies supply code and evidence; there is no owner review between tickets.

**Owner amendment, 2026-09-08:** S1-21 retires all local LexChat engine pages and unused page assets, with no redirect. Retain its project card/image/approved description and exact external Hugging Face CTA. Privacy/404 require functional coverage; exact OLD/NEW visual and DOM equality is waived. Do not restore the former iframe assumptions. Exercise the remaining real pages and any still-supported general picker-free composition contract without a fixture-specific API.

## Deliverable

A representative test-only structural theme demonstrates the documented extension points, with distinct owned DOM and working canonical fallback, without any production fixture leakage.

## Files

- Create: `harness/fixtures/theme-authoring/` containing owned Home.astro, responsive CSS, a small behavior script, registration/prose/schema patches and an allowed-change manifest.
- Create: `harness/theme-authoring.spec.ts`, `tests/build/theme-authoring.test.ts`.
- Modify: `src/themes/README.md` authoring walkthrough.
- Create: `docs/intents/2026-09-05-theme-engine-rewrite/research/architecture-signoff.md` initial automated evidence.
- Only if tests expose a boundary defect: narrowly fix `src/layouts/{compose.ts,Shell.astro,ThemeAssets.astro}`, shared picker components/runtime, `src/themes/{types.ts,paths.ts,apply.ts}` or prose/schema extension wiring. Keep engine fixes separate from the fixture's allowed-change manifest.

## Interfaces

- Assemble the fixture into an isolated copy using normal theme-owned files, registry registration and prose/schema additions; do not add an engine feature flag for its id.
- Owned home has its own head, root CSS, stylesheet and script, and reads approved sized prose through the public accessor.
- Unowned blog/post and utilities use ordinary compose; owned home uses the shared FAB/palette runtime only.
- Fixture assets/registration exist only inside the isolated build. No fixture id, route, picker row, source prose or asset reaches a subsequent production build.

## Work

- [x] Write the skin/structural authoring steps in the guide; follow those exact steps to assemble the fixture from existing approved prose.
- [x] Give the owned home a genuinely different responsive DOM and root sizing. Use href for navigation and the five palette roles for effective visible color changes.
- [x] Test owned home, fallback listing/post, privacy and 404 at 1440 and 390, then resize both directions without a boot-time breakpoint flag.
- [x] Assert owned root CSS/script/assets never load or affect default/fallback pages. Owned home must load no canonical behavior or canonical-only libraries.
- [x] Test mouse/touch picker opening, current-page switching, always-enabled randomizer, declared profile, navigation/reload first-paint restoration and the structural storage namespace rule.
- [x] Run ordinary prose, routes and Shell checks against the fixture; compare actual file changes with the allowed authoring manifest.
- [x] Fix exposed shared boundary defects through general contracts and rerun affected page suites; do not add fixture-id branches. No shared defect was exposed, so no engine repair was needed.
- [x] Build ordinary production afterward and assert complete fixture absence. Record commands, loaded resource evidence, resize results and exact authoring file list.

## Acceptance and verification

- [x] Fixture is more than a fallback-only stub and exercises every §5.3 assertion.
- [x] Adding it through the final documented workflow changes only owned files, typed registration and prose/schema registration.
- [x] No changes to canonical behavior or unrelated themes are part of the theme addition itself.
- [x] Shared randomizer works without canonical runtime; fallback and utilities have precisely their declared assets.
- [x] Production contains no fixture. Report is agent-produced evidence, not a request for owner sign-off.

```bash
node --test --test-concurrency=1 tests/build/theme-authoring.test.ts
PARITY_OUT_DIR=/private/tmp/theme-engine-openai/s1-24/parity/manual TEST_BUILD_OUT_DIR=/private/tmp/theme-engine-openai/s1-24/builds/manual npx playwright test harness/theme-authoring.spec.ts
npm run build
```

## Agent handoff

Record changed files, commands and exit results, and any interface adjustments in the completion report. Resolve implementation failures in scope; do not replace failed assertions with broader exclusions. Leave owner QA to the end of the complete migration.

## Completion evidence

The documented five-path authoring manifest, exact commands, results, resource/resize evidence,
source-manifest hash and intentional runtime-404 timing limit are recorded in
`research/architecture-signoff.md`. Final focused results are 7/7 build tests and 8/8 browser
tests. The faithful full-public build exited 0 with production 177 engine pages, 128 local-post
outputs and 12 sitemap URLs; its 300-file output contains no fixture identifier or assets.

The fixture required no shared interface adjustment. Its executable Home uses repository-root
imports that resolve both before and after installation, without diagnostic suppression.
Registry-derived `THEME_IDS` is the current
strict label-schema registration seam. The runtime 404 restores the structural palette at
`interactive` by design under D27 and §15.11; owned Home, listing, post and Privacy restore it at
`loading` before paint. No owner sign-off is requested here.
