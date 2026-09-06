# S1-02 — Build the old-site harness and capture immutable references

**Status:** Unstarted · **Spec milestone:** T1 · **Scope:** one harness foundation

**Depends on:** [S1-01](s1-01-runtime-and-astro-compatibility.md)

Assign one agent this ticket plus the [execution contract](../../../superpowers/plans/2026-09-05-spec-1-migration-engine.md). Read [Spec 1](../spec-1-migration-engine-parity.md) §9 through normalizer step 7, §12 T1 and D20/D33. Dependencies supply code and evidence; there is no owner review between tickets.

## Deliverable

A runner that compares the baseline checkout against itself and captures pre-cycler theme state. It must work before any `src/` engine or vendor module exists.

## Files

- Create: `playwright.config.ts`, `harness/baseline.ts`, `harness/urls.ts`, `harness/settle.ts`, `harness/sentinels.ts`, `harness/normalize.ts`, `harness/scripts.ts`, `harness/parity.spec.ts`.
- Create: `harness/fixtures/baseline/theme-html.json`, `harness/fixtures/baseline/content.json`, `harness/fixtures/baseline/masthead.json`, `harness/fixtures/baseline/README.md`.
- Create: `tests/unit/parity-normalize.test.ts`.
- Modify: `.gitignore` for `harness/__parity__/` and Playwright reports.
- Read: all six baseline HTML page types, `js/theme-bootstrap.js`, `js/blog-data.js`, `js/script.js`, `blog/blog-listing.js`.

## Interfaces

- `PARITY_MODE=old-old` serves `PARITY_OLD_DIR` (default `../personal-website-old`) on both 8781 and 8782.
- Projects: `desktop-1440` and `mobile-390`; deterministic heights are fixed here and recorded with baselines.
- Initial test titles include `@theme:<id>`, `@page:home|blog|post|privacy|notFound|lexchat` and `@state:settled`. S1-03 extends these tags for interaction states.
- `harness/urls.ts` exports `urlPairs()`; `harness/baseline.ts` derives theme order, content and old URL forms from the detached checkout, not a second authored registry.
- `settle(page, pageType)` owns four generic waits plus `sentinels.ready[pageType]`.
- The reference capture stores attributes and each inline declaration before cycler boot: raw-hex base colors, 95 hsla steps, token presence/removals and font/skin links. New typing attributes cannot exist in the old capture.

## Work

- [ ] Configure runner-owned Python servers bound to `127.0.0.1`, SIGTERM teardown within 500 ms, HTML reporter `open: never`, list reporter, and snapshot paths without platform names.
- [ ] Derive the old theme/page matrix, fresh browser contexts and 12 sentinel samples per page type. For utility DOM lacking nav/card elements, choose real alternatives and document them.
- [ ] Implement load, stable stylesheet count for 500 ms plus fonts-ready, in-view AOS and finite-animation waits with a 15-second failure, followed by page readiness.
- [ ] Capture response HTML, settled DOM, computed styles, screenshots and script/network inventories. Use screenshot ratio 0.001, threshold 0.2, animations disabled, caret hidden and CSS scale; mask masthead but assert its text.
- [ ] Implement common normalization: comments/scripts/noscript/modulepreload, Astro guards, sorted attributes, whitespace except pre. No migration URL mapping, new metadata exclusions or new palette assertions in old-old mode.
- [ ] Capture before-cycler values without saving cycler-modified palettes as references; preserve exact raw declaration values for S1-10.

## Acceptance and verification

- [ ] Old-old settled comparisons pass for privacy/404/LexChat × 16 themes × 2 viewports. S1-03 completes animated home/listing/post readiness and the full matrix.
- [ ] Default references contain no skin attributes/assets/tokens but all 100 ramp properties.
- [ ] Changing a class, token, head order or text in a synthetic fixture fails equality; comments alone do not.
- [ ] Baseline SHA and capture method accompany small JSON contract fixtures. Large visual artifacts stay gitignored.
- [ ] No imports from future `src/` or `scripts/vendor-map.mjs`.

```bash
node --test tests/unit/parity-normalize.test.ts
PARITY_MODE=old-old npm run test:parity -- --grep '@page:(privacy|notFound|lexchat)'
lsof -nP -iTCP:8781 -sTCP:LISTEN
lsof -nP -iTCP:8782 -sTCP:LISTEN
```

Both lsof checks must print no listeners (exit 1 means no match).

## Agent handoff

Record changed files, commands and exit results, and any interface adjustments in the completion report. Resolve implementation failures in scope; do not replace failed assertions with broader exclusions. Leave owner QA to the end of the complete migration.
