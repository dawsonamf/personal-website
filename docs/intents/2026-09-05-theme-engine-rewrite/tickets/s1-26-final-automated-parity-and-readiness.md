# S1-26 — Run the complete automated verification and finish all regressions

**Status:** Unstarted · **Spec milestone:** T8 · **Scope:** one final integration sweep

**Depends on:** [S1-25](s1-25-architecture-cleanup-and-authoring-docs.md), [S1-23](s1-23-deployment-workflow-preparation.md)

Assign one agent this ticket plus the [execution contract](../../../superpowers/plans/2026-09-05-spec-1-migration-engine.md). Read [Spec 1](../spec-1-migration-engine-parity.md) §1.1, §9, §15 and T8, subject to the no-intermediate-owner-QA clarification. Dependencies supply code and evidence; there is no owner review between tickets.

## Deliverable

The final implementation has a clean production build, complete architecture evidence and a passing full parity/resource/behavior matrix. This ticket does not wait for owner QA.

## Files

- Modify: `harness/sentinels.ts` for demonstrated readiness corrections, scoped regression tests, and the originating implementation files for actual discovered defects.
- Create: `docs/intents/2026-09-05-theme-engine-rewrite/research/parity-results.md`.
- Finalize: `research/architecture-signoff.md` under this intent.
- Keep reports/screenshots/DOM artifacts under gitignored harness output with durable summary paths.
- Do not broaden exception tables or change version pins to make failures disappear.

## Interfaces

- Use the existing full 16-theme order, 8-page matrix, 2 viewports and applicable §9 states.
- Owner's final QA remains outside the dependency graph. Architecture evidence is recorded by agents; it is not labeled owner-approved.
- Deployment consumes only `npm run build` output. Preview/fixture output is never a deploy artifact.

## Work

- [ ] Run all unit/build/component-browser tests against the final tree, including negative content fixtures and structural authoring isolation.
- [ ] Build production cleanly and verify 192 page routes + 404, eight local posts, ten listing entries, approved redirects and sitemap exclusions.
- [ ] Generate visual baselines from OLD, then compare NEW. Never accept new screenshots as the old reference.
- [ ] Run the full parity matrix: job, carousel dot/wheel, sticky/contact scrolling, picker/filter, active palette navigation and reload first paint.
- [ ] Run reduced-motion checks and a crawl of all local published post links/assets beyond the three visual representatives.
- [ ] Attribute defects to their component/ticket and fix them with focused tests; rerun affected checks, then complete a full sweep after the last code change.
- [ ] Record test counts, source/baseline revisions, environment, exact commands, report paths, accepted §15 differences and clean server teardown.
- [ ] Confirm no open migration defect or undocumented retained implementation remains before handing deployment the build.

## Acceptance and verification

- [ ] Full DOM/screenshot/token comparisons pass under only the specified exceptions.
- [ ] No page references unlisted scripts; no theme-owned heavy resource leaks; no unexpected 4xx/5xx.
- [ ] All §1.1 criteria have evidence, including fixture addition file list and cleanup audit.
- [ ] Build contains neither unapproved publishable prose, draft bodies nor fixture assets.
- [ ] External CDN outages are reported honestly and retried when available; they are not classified as visual regressions or passed tests.
- [ ] No intermediate owner QA request or fabricated owner sign-off.

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
