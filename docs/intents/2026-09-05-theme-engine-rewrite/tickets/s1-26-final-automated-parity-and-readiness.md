# S1-26 — Run the complete automated verification and finish all regressions

**Status:** Complete · **Spec milestone:** T8 · **Scope:** one final integration sweep

**Depends on:** [S1-25](s1-25-architecture-cleanup-and-authoring-docs.md), [S1-23](s1-23-deployment-workflow-preparation.md)

Assign one agent this ticket plus the [execution contract](../../../superpowers/plans/2026-09-05-spec-1-migration-engine.md). Read [Spec 1](../spec-1-migration-engine-parity.md) §1.1, §9, §15 and T8, subject to the no-intermediate-owner-QA clarification. Dependencies supply code and evidence; there is no owner review between tickets.

**Owner amendment, 2026-09-08:** S1-21 retires all local LexChat engine pages and unused page assets, with no redirect. Retain its project card/image/approved description and exact external Hugging Face CTA. Privacy/404 require functional coverage; exact OLD/NEW visual and DOM equality is waived. Do not restore the former iframe assumptions. Use the final S1-21 route/sitemap contract: 176 page routes + 404.html, seven representative pages (five with exact parity, plus functional Privacy/404), and no LexChat pages or redirects. Assert the narrow approved external CTA difference; retain exact parity for all other pages.

**Owner amendment, 2026-09-09:** Exact reduced-motion DOM/visual parity is non-blocking. The
owner will inspect that mode later; no owner QA has occurred. Root requested graceful termination
under this waiver, preserving 749 passed / 3 failed / 7 interrupted / 105 not run, producer 130 /
tee 0. The checked requirements below are evaluated under this amendment; reduced results are not
relabeled as a passing full sweep. See the
[recorded owner amendment](/private/tmp/theme-engine-openai/s1-26-owner-reduced-motion-waiver.md).

## Deliverable

The final implementation has a clean production build, complete architecture evidence and a passing full parity/resource/behavior matrix. This ticket does not wait for owner QA.

## Files

- Modify: `harness/sentinels.ts` for demonstrated readiness corrections, scoped regression tests, and the originating implementation files for actual discovered defects.
- Create: `docs/intents/2026-09-05-theme-engine-rewrite/research/parity-results.md`.
- Finalize: `research/architecture-signoff.md` under this intent.
- Keep reports/screenshots/DOM artifacts under gitignored harness output with durable summary paths.
- Do not broaden exception tables or change version pins to make failures disappear.

## Interfaces

- Use the existing full 16-theme order, 7-page coverage (exact parity on Home/listing/three posts; functional Privacy/404), 2 viewports and applicable §9 states.
- The final exact-parity cycle is Home → listing → Toolbelt → Embedded Swift Agent → METR → same-theme canonical Home. Privacy/404 use separate functional theme/palette navigation/reload, picker and link smoke. This owner-approved 2026-09-08 contract supersedes earlier instructions to restore Privacy as METR's parity destination; it is not a stage substitution. Preserve actual document navigation, canonical route seeds and existing masks/tolerances.
- Owner's final QA remains outside the dependency graph. Architecture evidence is recorded by agents; it is not labeled owner-approved.
- Deployment consumes only `npm run build` output. Preview/fixture output is never a deploy artifact.

## Work

- [x] Run all unit/build/component-browser tests against the final tree, including negative content fixtures and structural authoring isolation.
- [x] Build production cleanly and verify 176 page routes + 404, eight local posts, ten listing entries, approved redirects and sitemap exclusions.
- [x] Generate visual baselines from OLD, then compare NEW. Never accept new screenshots as the old reference.
- [x] Run the full parity matrix: job, carousel dot/wheel, sticky/contact scrolling, picker/filter, active palette navigation and reload first paint.
- [x] Run reduced-motion checks and a crawl of all local published post links/assets beyond the three visual representatives.
- [x] Attribute defects to their component/ticket and fix them with focused tests; rerun affected checks, then complete a full sweep after the last code change.
- [x] Record test counts, source/baseline revisions, environment, exact commands, report paths, accepted §15 differences and clean server teardown.
- [x] Confirm no open migration defect or undocumented retained implementation remains before handing deployment the build.

## Acceptance and verification

- [x] DOM/screenshot/token comparisons for Home/listing/three posts pass under only the specified exceptions; Privacy/404 pass functional acceptance under the owner waiver.
- [x] No page references unlisted scripts; no theme-owned heavy resource leaks; no unexpected 4xx/5xx.
- [x] All §1.1 criteria have evidence, including fixture addition file list and cleanup audit.
- [x] Build contains neither unapproved publishable prose, draft bodies nor fixture assets.
- [x] External CDN outages are reported honestly and retried when available; they are not classified as visual regressions or passed tests.
- [x] No intermediate owner QA request or fabricated owner sign-off.

```bash
npm run test:unit
npm run test:build
npx playwright test tests/browser
npx playwright test harness/theme-authoring.spec.ts
npm run build
PARITY_MODE=old-new npm run test:parity
PARITY_REDUCED_MOTION=1 PARITY_MODE=old-new npm run test:parity
lsof -nP -iTCP:8781 -sTCP:LISTEN
lsof -nP -iTCP:8782 -sTCP:LISTEN
```

Define and test PARITY_REDUCED_MOTION=1 if it does not yet exist, preserving no-preference as the normal run's default. Use reduced-motion-aware readiness rather than waiting for animations that are intentionally suppressed.

## Agent handoff

Record changed files, commands and exit results, and any interface adjustments in the completion report. Resolve implementation failures in scope; do not replace failed assertions with broader exclusions. Leave owner QA to the end of the complete migration.

## Completion evidence

Final-source verification passed 515 unit tests, 142 build tests including negative fixtures,
138 component browser tests, 8 structural authoring tests and 3 immutable-OLD capture tests.
Clean production emitted 177 engine HTML, 128 local-post HTML and 12 sitemap URLs, with the exact
300-file / 184-HTML category and exclusion audit passing.

Normal parity coverage is the full 864-case sweep's 854 passes plus exact successful retries of
ten individually transport-attributed Studio failures. The initial producer exit 1 is retained;
the exact ten-case retry passed 10/10 with producer/tee 0/0 on unchanged source, OLD, media,
seven-worker configuration, trace policy and assertions. Reduced-only observations remain
non-blocking under the owner amendment above; no source or comparison relaxation was made.

The final code matches the frozen candidate. Owned PID/signature/port cleanup and OLD/protected
input integrity passed; no installs were made. Completion Markdown was written afterward and is
not part of the tested source snapshot. All affected-file purposes/hashes, exact commands/results,
review provenance, accepted limits and architecture criteria are in
[parity results](../research/parity-results.md),
[architecture sign-off](../research/architecture-signoff.md) and the
[final verification report](/private/tmp/theme-engine-openai/s1-26/final-acceptance-verification-report.md).
Owner QA, S1-27 registration and S1-28 cutover/live verification remain outside this ticket.
