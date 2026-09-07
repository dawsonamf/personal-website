# S1-01 — Establish the pinned runtime and verify Astro compatibility

**Status:** Done with risks 2026-09-06 · **Spec milestone:** T0 · **Scope:** one compatibility spike

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

## Completion report

Done with risks, 2026-09-06. Ran on Node v25.9.0 (Node 24 not installed, no version manager; `.nvmrc` = `24` is the CI contract). Astro 7.3.1 accepted Node 25 (`engines` `>=22.12.0`); every build passed.

**Created:** `.nvmrc`, `package.json`, `package-lock.json` (lockfileVersion 3, 14 exact pins), `tsconfig.json` (extends `astro/tsconfigs/strict`, excludes `dist` and the spike fixtures), `astro.config.mjs` (Spec §3.2 minus the four later-ticket imports and the sitemap `filter`/`serialize`; each omission commented with its owner), `tests/build/astro-compatibility.test.ts` (13 subtests), `tests/fixtures/astro-compatibility/{site,variants}/` (one positive Astro project; negative cases are mutations built in temp copies under a gitignored `.tmp/`), `research/spike-findings.md` (T0 a-k, installs, deviations, downstream contracts).
**Modified:** `.gitignore` (`node_modules/`, `/dist/`, `/.astro/`, test output, fixture `.tmp`/`dist`/`.astro`). No root `src/`. `CNAME`, `.nojekyll`, legacy site files and the baseline worktree untouched.

**Installs (the two §14 commands, exit 0 each):** `npm install --save-exact astro@7.3.1 @astrojs/sitemap@3.7.4 js-yaml@4.3.0 marked@18.0.5 highlight.js@11.9.0 jquery@3.6.0 jquery-ui-dist@1.12.1 aos@2.3.1 vanilla-tilt@1.7.0 gsap@3.9.1 @fortawesome/fontawesome-free@6.5.1` and `PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1 npm install --save-dev --save-exact @playwright/test@1.61.1 @astrojs/check@0.9.10 typescript@5.8.3`. `npm ci` reproduces. Browser cache unchanged before/after (no download).

**Verification:** `node --version` v25.9.0; `npm --version` 11.12.1; `node --test --test-concurrency=1 tests/build/astro-compatibility.test.ts` and `npm run test:build`: tests 13, pass 13, fail 0, skipped 0, exit 0 (run by the builder, four reviewers and the orchestrator). `astro check` on a temp fixture copy: 0 errors, 0 warnings, 0 hints. `test:unit` and `test:parity` are defined but their suites do not exist yet; not claimed. Collision (e1 route, e2 duplicate `file()` entry id) and throwing-hook builds exit 1; the positive build exits 0; `dist/404.html` exists; `theme: undefined` emits `/` and `/blog/`. No listeners remain after runs (`lsof`/`pgrep` empty).

**T0 results (details and commands in spike-findings.md):** (a) compiler accepted the ported home with zero repairs; the only DOM deltas are 15 dropped whitespace runs after `</script>` (the compiler drops them after every script, including the last before `</body>`) and the missing trailing newline, both count-asserted. (b) nothing injected on the ported page; an extracted stylesheet `<link>` lands as the last head node before `</head>`; a bundled module `<script>` stays in place in the body. (c) root and themed routes emitted. (d) `dist/404.html`. (e1) `[PrerenderRouteConflict]` exit 1; (e2) `[DuplicateContentEntrySlugError]` exit 1, gated by `prerenderConflictBehavior: 'error'` in both `file.js` and `glob.js` (default `'warn'` would only log). (f) throw in `astro:build:done` exits 1. (g) marked output; `glob()` needs `deferRender: true` or Sätteri renders every `.md` at sync (errors logged, not thrown). (h) meta-refresh stub with `noindex`. (i) `public/` byte-identical, `+esm` specifier untouched. (j) loopback python server + cached `chromium-1228`, ephemeral port, remote requests blocked. (k) default arrangement duplicates the accessor module (config side loaded by plain Node `import()`, page side bundled); fixed by a `resolveId` Vite plugin that externalizes the resolved `src/prose/index.ts` id as its absolute `file://` URL. No `globalThis`.

**Interface adjustments / contracts for downstream:**
- S1-08 must add `vite: { plugins: [externalization of src/prose/index.ts] }` to `astro.config.mjs` (§3.2 has no `vite` block; spec amendment recorded in spike-findings §k). The externalized module and everything on the config import path must be erasable TS with explicit `.ts` extensions and no `astro:*`/Vite-only imports.
- S1-05/S1-08 REQUIRED: the pure accessor exports a module-scope touch counter and `checks.ts` asserts `touches > 0` before `assertNoUnwrittenSizes`; duplication (or a swallowed config `import()` failure) otherwise passes vacuously.
- S1-02: baseline-vs-Astro dumps differ by the (a) rules above; the baseline env var is `PARITY_OLD_DIR`; ports 8781/8782 are untouched by this suite.
- S1-07: `glob({ deferRender: true })`; `entry.body` stays raw; mermaid bodies are emitted unescaped, as today. S1-06/S1-07: marked 18 object-argument renderer signatures (fixture `markdown.ts` is typed with `RendererObject`).
- S1-20 owns external-post redirect stubs; S1-22 verifies the two subsite redirects already present in the root config. Redirect stubs never reach `astro:build:done` `pages[]`.
- S1-08: `astro check --root` does not scope to a fixture; the root `tsconfig.json` `**/*` include currently type-checks legacy JS with `checkJs` off.

**Accepted risks:** Node 25 instead of 24 (environment; no observed 24-only dependency). `js-yaml@4.3.0` carries GHSA-5p4m-2wfm-xmqj (fixed in 4.3.2, outside the pin; build-time parsing of repo-owned YAML, exposure nil; pin unchanged, pin table flagged). `@types/node` is transitive only; the test file's typings depend on it (adding it is a new install needing approval; S1-08 decides). Eight `npm ls` "extraneous" rows are sharp wasm-fallback optionals plus one stray empty `node_modules/ajv-draft-04 2/` dir, all inside the lockfile or gitignored. Absolute home paths appear in spike-findings.md (username already public). Port allocation is TOCTOU on loopback (visible flake only).

**Environment blocks:** none.
