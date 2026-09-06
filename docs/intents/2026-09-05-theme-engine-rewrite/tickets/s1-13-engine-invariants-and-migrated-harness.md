# S1-13 — Enforce engine invariants and connect the migrated harness

**Status:** Unstarted · **Spec milestone:** T3 · **Scope:** one validation integration

**Depends on:** [S1-03](s1-03-deterministic-interaction-matrix.md), [S1-12](s1-12-composition-shell-and-prerendered-routes.md)

Assign one agent this ticket plus the [execution contract](../../../superpowers/plans/2026-09-05-spec-1-migration-engine.md). Read [Spec 1](../spec-1-migration-engine-parity.md) §9 normalization/exception table, D20/D31/D39 and §15. Dependencies supply code and evidence; there is no owner review between tickets.

## Deliverable

The engine checks reject invalid built pages, and the harness supports old-new comparisons without weakening the proven old-old suite.

## Files

- Modify: `src/build/checks.ts`, `harness/urls.ts`, `harness/normalize.ts`, `harness/scripts.ts`, `harness/parity.spec.ts`.
- Create: `harness/migrated.ts`, `harness/exceptions.ts`, `harness/palette.ts`, `tests/build/engine-invariants.test.ts`, `tests/unit/parity-migration.test.ts`.
- Read: registry/paths, S1-07 public projections and `scripts/vendor-map.mjs`.

## Interfaces

- Extend `checks()` with `assertShellInvariants(pages)` and `assertNoRelativeHrefs()`; retain YAML and unwritten checks.
- Page scanning uses the build hook's page routes. Redirect stubs/public passthroughs are excluded by provenance, not broad name/path guesses.
- `PARITY_MODE=old-new` selects the migrated adapter and serves dist on 8782; old-old remains independent of future production modules.
- Derive old-new URL pairs from THEMES, href and publishedPostIds; use the explicit three post fixtures from §9.
- Shared vendor map provides CDN mappings and script identities.

## Work

- [ ] Require one ThemeAssets marker on every engine page; picker-enabled compositions require one dock/scrim and a valid nested button trigger. Picker-none requires absence of picker markup/runtime.
- [ ] Reject relative internal hrefs and literal same-origin navigation in src, while allowing generated canonical/SEO metadata. Exercise violations with planted isolated fixtures.
- [ ] Implement old-side-only map-then-theme normalization exactly from §9, including bare fragments, sibling stylesheets, canonical/OG exemptions and the 404's skipped theme step.
- [ ] Add only the stated exception-table exclusions and matching bounded screenshot masks. Verify new metadata and Helm/METR card changes against authoritative sources separately.
- [ ] Add new-side palette navigation/reload assertions that compare saved effective colors at first paint, not old reset behavior. Keep fresh contexts elsewhere.
- [ ] Compare HTML styles as declaration maps; exclude only --prose-* from token equality. Report Astro-generated guard counts.
- [ ] Verify script allow-lists against raw emitted HTML and loaded resources, retaining distinct page load order and LexChat's absence of cycler.

## Acceptance and verification

- [ ] Planted missing/double asset markers, extra dock, missing trigger, missing-size request and relative href each fail with route/source context.
- [ ] Route adapter covers all 16 themes, the 8 matrix pages and public post ids without a hand-maintained catalog.
- [ ] Normalization tests catch double theming, altered pre text, missing nodes and accidental canonical/OG rewriting.
- [ ] Existing old-old suite still passes; engine route tests pass. Incomplete page scaffolds are not reported as visually migrated.
- [ ] New exception mechanisms cannot hide arbitrary selectors or failed network responses.

```bash
node --test tests/unit/parity-migration.test.ts
node --test --test-concurrency=1 tests/build/engine-invariants.test.ts
PARITY_MODE=old-old npm run test:parity
npm run build
```

## Agent handoff

Record changed files, commands and exit results, and any interface adjustments in the completion report. Resolve implementation failures in scope; do not replace failed assertions with broader exclusions. Leave owner QA to the end of the complete migration.
