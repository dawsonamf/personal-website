# S1-03 — Complete deterministic baseline interactions

**Status:** Unstarted · **Spec milestone:** T1 · **Scope:** one interaction harness change

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

- [ ] Inject deterministic randomness before site scripts. Assert intended terminal text and deletion path, not merely a numeric seed.
- [ ] Complete readiness: ten pinned home elements, jobs highlight geometry, eight cards/eight dots, stable section rule, post read-time/Mermaid, loaded 404 theme sheet.
- [ ] Add job tab 2, carousel dot 3, wheel over track, sticky scroll 800→500, smooth-scroll contact, picker click, listing Swift filter and palette interaction states wherever the baseline has the element.
- [ ] Test palette navigation/reload with the baseline's reset behavior in old-old mode. Preserve before/after evidence for S1-13's new persistence assertions.
- [ ] Apply exactly §9's API abort list. Keep Google Fonts and required library CDNs available. Report external dependency failures rather than masking them.
- [ ] Assert desktop fine-pointer hover and mobile no-hover. Keep the mouse untouched before captures except the wheel state; use fresh contexts for independent scenarios.
- [ ] Attach DOM/style/network evidence to failures and tear down both servers.

## Acceptance and verification

- [ ] All 16 × 8 × 2 baseline combinations and applicable interaction states pass.
- [ ] The wheel test proves the vertical wheel guard and does not substitute a dot click.
- [ ] Palette, dock timings, script order and mobile pointer paths are exercised.
- [ ] Disabling a required readiness condition produces a test failure within 15 seconds.
- [ ] No failures become skips; no first-run images are mislabeled as verified new-site baselines.

```bash
node --test tests/unit/parity-seeds.test.ts
PARITY_MODE=old-old npm run test:parity
lsof -nP -iTCP:8781 -sTCP:LISTEN
lsof -nP -iTCP:8782 -sTCP:LISTEN
```

## Agent handoff

Record changed files, commands and exit results, and any interface adjustments in the completion report. Resolve implementation failures in scope; do not replace failed assertions with broader exclusions. Leave owner QA to the end of the complete migration.
