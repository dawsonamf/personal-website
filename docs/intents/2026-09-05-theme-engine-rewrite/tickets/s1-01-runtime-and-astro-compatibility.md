# S1-01 — Establish the pinned runtime and verify Astro compatibility

**Status:** Unstarted · **Spec milestone:** T0 · **Scope:** one compatibility spike

**Depends on:** None

Assign one agent this ticket plus the [execution contract](../../../superpowers/plans/2026-09-05-spec-1-migration-engine.md). Read [Spec 1](../spec-1-migration-engine-parity.md) §3.2, §6.2, §12 T0, D1–D2 and D39. Dependencies supply code and evidence; there is no owner review between tickets.

## Deliverable

A working Astro scaffold and a reproducible answer to all eleven T0 experiments. Investigate failures, apply the smallest compatible correction, document it, and continue; this is implementation work, not an owner checkpoint.

## Files

- Create: `.nvmrc`, `package.json`, `package-lock.json`, `tsconfig.json`, `astro.config.mjs`.
- Create: `tests/build/astro-compatibility.test.ts`, `tests/fixtures/astro-compatibility/`.
- Create: `docs/intents/2026-09-05-theme-engine-rewrite/research/spike-findings.md`.
- Modify: `.gitignore` for dependencies, builds and test output.
- Work in the migration checkout. Keep the baseline at `0f196d0` read-only. Preserve root `CNAME` and `.nojekyll`.

## Interfaces

- Runtime: Node 24, npm; exact dependency pins are in the execution contract.
- Test convention: `tests/unit/*.test.ts` uses Node's test runner; `tests/build/*.test.ts` runs isolated builds serially. Browser tests use the pinned Playwright.
- Add `test:unit = node --test tests/unit/*.test.ts`, `test:build = node --test --test-concurrency=1 tests/build/*.test.ts`, and `test:parity = playwright test harness/parity.spec.ts`. Later tickets create the suites; do not claim an empty suite passed.
- S1-08 replaces the provisional build script with Spec 1's production command. S1-02 owns Playwright configuration.
- Define `vendor = node scripts/vendor.mjs` now; S1-09 creates that script. This keeps package.json ownership sequential between S1-01 and S1-08.

## Work

- [ ] Inspect existing checkouts/runtime/cache; reuse an appropriate isolated migration checkout and the detached baseline. Never start a persistent dev server. Browser test runners own their localhost servers and teardown.
- [ ] Set the exact Astro config in §3.2, initially without imports of modules later tickets create. Install only the specified dependencies through the available tool permissions; do not update pins to newer releases.
- [ ] Port baseline home markup to an isolated fixture and prove compiler acceptance, preserving the rendered DOM when repairing syntax.
- [ ] Build experiments for (a) compiler strictness, (b) canonical head injection and hypothetical injected-node position, (c) undefined rest parameters, (d) `404.html`, (e) route/entry collisions, (f) a throwing build-done hook, (g) marked output from the raw post body, (h) meta-refresh redirects, (i) verbatim public files and the subsite's `+esm` import, (j) Python servers plus cached Chromium 1228, and (k) accessor/checks sharing one module instance.
- [ ] For (k), insert a unique missing-size record from an Astro component; import the accessor set in the build hook and assert the same record is visible. Fix the import/build arrangement if duplicated rather than introducing `globalThis`.
- [ ] Retain reproducible experiments under test fixtures, remove their temporary routes from the scaffold, and record exact commands/results.

## Acceptance and verification

- [ ] All T0 items a–k have observed results and a working implementation path in `spike-findings.md`.
- [ ] Collision and throwing-hook subprocesses exit nonzero; successful fixture builds exit zero.
- [ ] `dist/404.html` exists in its fixture; undefined `theme` emits root routes.
- [ ] No browser download is performed when the pinned cached browser is usable; test servers leave no listeners.
- [ ] Toolchain and tests are available to the next agents without further owner design decisions.

```bash
node --version
npm --version
node --test --test-concurrency=1 tests/build/astro-compatibility.test.ts
```

Distinguish tests actually run from unavailable environment capabilities. An actual access failure is an environment block, never a request for architecture review.

## Agent handoff

Record changed files, commands and exit results, and any interface adjustments in the completion report. Resolve implementation failures in scope; do not replace failed assertions with broader exclusions. Leave owner QA to the end of the complete migration.
