# S1-02 — Build the old-site harness and capture immutable references

**Status:** Done with risks 2026-09-06 · **Spec milestone:** T1 · **Scope:** one harness foundation

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

## Completion report

Done with risks, 2026-09-06. Ran on Node v25.9.0 (Node 24 not installed; `.nvmrc`=24 stays the CI contract). Built in a worktree, so every run exported `PARITY_OLD_DIR=/Users/dawsonamf/Desktop/dax/personal-website-old`; the code keeps the spec default `../personal-website-old`, which resolves only from the main checkout (the error names the variable).

**Created:** `playwright.config.ts`, `harness/{baseline,urls,normalize,scripts,settle,sentinels}.ts`, `harness/parity.spec.ts`, `harness/fixtures/baseline/{theme-html.json,content.json,masthead.json,README.md}`, `tests/unit/parity-normalize.test.ts`. **Modified:** `.gitignore` (`harness/__parity__/`; both Playwright output dirs now live under it, `test-results/` and `playwright-report/` were already ignored). Nothing else touched; `CNAME`, `.nojekyll`, legacy files and the baseline worktree untouched. Run artifacts (dumps, snapshots, report, ~90 MB) are gitignored; the three JSON fixtures (138 KB, 13 KB, 11 KB) are committed with `baselineSha` and `method`.

**Interfaces as implemented (adjustments in bold):**
- `PARITY_MODE=old-old` serves `PARITY_OLD_DIR` on 8781 and 8782; `old-new` serves `dist/` on 8782 and its URL mapping throws until S1-13. **`PARITY_MODE` is required, no default:** unset, the config starts no servers and skips the baseline pin (future `tests/browser/**` specs never squat the parity ports) and `parity.spec.ts` fails at load with a clear message. Every plan command already sets it.
- Projects `desktop-1440` (1440x900) and `mobile-390` (390x844, `isMobile`, `hasTouch`; the §9 pointer guard is asserted on every compared context and never fired). **Third project `capture`** (`grep /@capture:/`; the viewport projects `grepInvert` it) runs the three viewport-independent fixture tests once, no skips.
- Titles: `@theme:<id> @page:home|blog|post|privacy|notFound|lexchat [@post:<id>] @state:settled` (**`@post:` added**, three matrix posts share `@page:post`); fixture tests are `@capture:theme-html|content|masthead`.
- `harness/urls.ts`: `urlPairs()` = 16 themes x 8 pages = 128 `{ theme, page, postId?, pageId, oldPath, newPath }` (shape asserted at collection time), `PAGE_TYPES`, `MATRIX_POSTS`, `OLD_ORIGIN`, `NEW_ORIGIN`, `parityMode()`. `harness/baseline.ts`: `oldDir()` (resolves, checks `index.html`, pins SHA `0f196d0…` by reading `.git`/`HEAD` directly, memoized), `themeOrder()`, `localPostIds()`, `masthead()`, `content()`, `oldPath()`; all derived from the baseline checkout.
- `settle(page, pageType)`: `load`; a registry-free idle fence (`requestIdleCallback`, timeout 2600) then stylesheet count stable 500 ms plus `document.fonts.ready`; in-view `[data-aos]` animated; no running finite animation (re-checked after readiness); `sentinels[pageType].ready`; one 15 s deadline, never skips. `sentinels.ts` holds 12 selectors, mask, `fullPage` and `ready` per page type; utility substitutions are in the README (LexChat's settled DOM has 13 elements, so nine of its sentinels are head nodes).
- `normalizeHtml(html, { mode, side })` implements §9 steps 2 to 5 and 7 (comments/scripts/noscript/modulepreload dropped, Astro guards counted and reported as a test annotation, tag names lowercased, attributes sorted with name case kept, whitespace collapsed except `pre`, `<html style>` as a sorted declaration map). No step 6/8 in old-old; the S1-13 hook is marked. The T0 (a) whitespace-after-`</script>` delta vanishes through the generic rules, no special case.
- Per-test checks: no status >= 400 and no non-aborted `requestfailed` on either side; `disallowedScripts()` empty on both; normalized DOM equal; computed sample equal (every `--*` property enumerated from `getComputedStyle(html)` plus inline names and the five roles, 116 to 117 names, plus 12 sentinels x 6 properties); masthead text equal where defined; screenshot at ratio 0.001, threshold 0.2, animations disabled, caret hidden, css scale, `fullPage` for the three utility pages, mask `#typing-text`/`#blog-typing-text` only. OLD writes the reference to `testInfo.snapshotPath(..., { kind: 'screenshot' })` on every run before NEW is compared; NEW never generates a reference.
- `theme-html.json`: per theme `{ attrs, style, links }` captured pre-cycler from `/privacy/?style=<id>` with only `/js/theme-cycler.js` aborted (privacy loads nothing else, so the capture is the bootstrap's output, asserted against the registry's token keys). `attrs` is `data-*` only (default `{}`); `style` is the ordered `[prop, value]` list with the 5 raw-hex roles and 95 `hsla()` steps exactly as written; `links` are the `data-style-asset` hrefs in order. No typing attributes exist. The S1-10 comparison recipe is in the README.

**Commands and results (run by the orchestrator after the fix pass):** `./node_modules/.bin/tsc --noEmit -p tsconfig.json` exit 0. `node --test tests/unit/parity-normalize.test.ts` with no env: tests 10, pass 10, fail 0. `--list`: 259 tests (128 + 128 + 3). `PARITY_MODE=old-old PARITY_UPDATE_FIXTURES=1 npm run test:parity -- --grep '@capture:'` 3 passed, then without the flag 3 passed. `PARITY_MODE=old-old npm run test:parity -- --grep '@page:(privacy|notFound|lexchat)'`: **96 passed (34.4s)**, exit 0. `lsof -nP -iTCP:8781 -sTCP:LISTEN` exit 1, `:8782` exit 1, `pgrep -fl 'http.server|playwright'` empty, after every run. Baseline anomalies: none (0 responses >= 400 across the 192 utility loads; the only failed requests are the deliberate `dawsonamf-lexchat.hf.space` iframe aborts).

**Review:** four fresh reviewers (two Fable correctness, Opus security, Opus conventions); 21 fixes applied in one pass, including: SHA pin moved into `oldDir()` so every path that executes baseline JS in `node:vm` is pinned; shell-safe quoting of the served directory; attribute-name case preserved (SVG `viewBox` in post dumps); a comment fixture that exercises the comment rule; capture moved off the home page (the earlier capture was deterministic only because an aborted script made `script.js` throw); context leak on guard failure closed; a missing fixture now fails instead of being written.

**Characterization for S1-03 (not required to pass here):** `--grep '@theme:(default|brutalist) @page:(home|blog|post)'` gives 9 passed, 11 failed; every failure is one of: masthead randomness (`Hi,` vs `Hey,`; the listing pick also changes `#blog-typing-text` `min-height`, shifting the page and `--section-rule`), Mermaid `mermaid-<epoch>` ids on `toolbelt`, Plotly random ids and per-series `trace<hex>` classes on `metr-doubling`. `embedded-swift-agent` passes on both viewports. Fix with `seedFor` plus `page.clock` or a normalizer rule, never a tolerance. Remaining §9 home readiness items are marked `// S1-03:` in `sentinels.ts`; the abort list const is in `parity.spec.ts`; the shortest listing sequence is index 3 (`Rabbit holes.`).

**Accepted risks:** Node 25 (environment). LexChat sentinels are mostly head nodes chosen positionally (head order is parity per §6.2). The old side needs the network (Google Fonts and library CDNs are never blocked; an outage now fails check 4 explicitly). The default `../personal-website-old` does not resolve from a worktree. Interface additions (`capture` project, `@post:` tag, `PARITY_MODE` required) are documented in the README for S1-03 and S1-13. **Environment blocks:** none.

**Follow-up fix (2026-09-07, after merge verification in the main checkout):** with `testDir: '.'` and string `testMatch` globs, Playwright matches `**/<glob>` against absolute paths, so agent worktrees nested under the gitignored `.claude/` were collected too, each importing its own `@playwright/test` ("Requiring @playwright/test second time", `Total: 0 tests in 0 files`). Fix in `playwright.config.ts`: `testMatch` is now one RegExp anchored to the regex-escaped `import.meta.dirname` (`^<root>/(tests/browser/.+\.spec\.ts|harness/(parity|theme-authoring)\.spec\.ts)$`), and the redundant `testIgnore` is gone. A `**/.claude/**` ignore was tried first and rejected: matched against absolute paths it drops everything when the checkout itself lives under `.claude/` (verified: `Total: 0 tests`). Reproduced with a throwaway `.claude/worktrees/x/harness/` copy inside the worktree: `--list` collected 518 tests in 2 files before the fix and 259 in 1 file after, throwaway deleted afterwards; `npm run test:unit` 148/148.
