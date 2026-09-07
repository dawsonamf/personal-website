# S1-13 — Enforce engine invariants and connect the migrated harness

**Status:** Done 2026-09-07 · **Spec milestone:** T3 · **Scope:** one validation integration

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

- [x] Require one ThemeAssets marker on every engine page; picker-enabled compositions require one dock/scrim and a valid nested button trigger. Picker-none requires absence of picker markup/runtime.
- [x] Reject relative internal hrefs and literal same-origin navigation in src, while allowing generated canonical/SEO metadata. Exercise violations with planted isolated fixtures.
- [x] Implement old-side-only map-then-theme normalization exactly from §9, including bare fragments, sibling stylesheets, canonical/OG exemptions and the 404's skipped theme step.
- [x] Add only the stated exception-table exclusions and matching bounded screenshot masks. Verify new metadata and Helm/METR card changes against authoritative sources separately.
- [x] Add new-side palette navigation/reload assertions that compare saved effective colors at first paint, not old reset behavior. Keep fresh contexts elsewhere.
- [x] Compare HTML styles as declaration maps; exclude only --prose-* from token equality. Report Astro-generated guard counts.
- [x] Verify script allow-lists against raw emitted HTML and loaded resources, retaining distinct page load order and LexChat's absence of cycler.

## Acceptance and verification

- [x] Planted missing/double asset markers, extra dock, missing trigger, missing-size request and relative href each fail with route/source context.
- [x] Route adapter covers all 16 themes, the 8 matrix pages and public post ids without a hand-maintained catalog.
- [x] Normalization tests catch double theming, altered pre text, missing nodes and accidental canonical/OG rewriting.
- [x] Existing old-old suite still passes; engine route tests pass. Incomplete page scaffolds are not reported as visually migrated.
- [x] New exception mechanisms cannot hide arbitrary selectors or failed network responses.

```bash
node --test tests/unit/parity-migration.test.ts
node --test --test-concurrency=1 tests/build/engine-invariants.test.ts
PARITY_MODE=old-old npm run test:parity
npm run build
```

## Agent handoff

Record changed files, commands and exit results, and any interface adjustments in the completion report. Resolve implementation failures in scope; do not replace failed assertions with broader exclusions. Leave owner QA to the end of the complete migration.


## Completion report

Completed in the `engine-rewrite` checkout from `b0c442a`. The engine and migrated harness are complete; current home/blog bodies remain scaffolds and are **not visually migrated**. No git writes, deployment, GUI launch, Xcode build, secret writes, or changes to the detached OLD checkout or protected worktrees were performed by this ticket's agents.

**Interfaces:** `assertShellInvariants(pages, dir)` scans actual Astro build-hook page provenance, with contained output paths and an independent `picker-mount:nav|fab|none` comment emitted from Shell's composition. It enforces exact assets/picker markup/runtime and valid nested triggers. `assertNoRelativeHrefs(root)` reports source/file/line navigation violations; YAML, shared-accessor touch and unwritten-size gates remain intact. Installed Astro 7.3.1 source and actual negative builds confirm the hook's slashless directory paths and special `404/` output mapping.

`urlPairs()` is now async. Old-old returns before loading production modules and uses frozen legacy script identities; old-new derives THEMES/href/published IDs, the explicit three matrix posts, vendors and authoritative metadata through `loadMigratedAdapter()`. Mapping is OLD-only, map-then-theme, with exact URL forms, SEO exemptions and the 404 carveout. Declaration/token comparison excludes only the specified new prose tokens. Closed DOM exceptions use exact ancestry/post identity; both screenshots receive the same bounded rectangles. Post metadata is checked independently, including required OG image and JSON-LD. Palette helpers measure saved effective colors during actual navigation/reload before paint. Raw script order is exact; actual script requests enforce identities/multiplicity and only source-backed ordering edges. Required network failures remain fatal.

**Created:** `harness/migrated.ts` (lazy source-derived adapter); `harness/exceptions.ts` (closed DOM/style/metadata/image contracts); `harness/palette.ts` (first-paint palette evidence); `tests/build/engine-invariants.test.ts` (pure boundaries and planted real builds); `tests/unit/parity-migration.test.ts` (mapping/isolation/exception/script regressions).

**Modified:** `src/build/checks.ts` (engine and source assertions); `src/layouts/Shell.astro` (composition provenance comment); `harness/urls.ts` (async matrix); `harness/normalize.ts` (exact normalization/guards); `harness/scripts.ts` (raw/resource inventories); `harness/interactions.ts` (side-specific palette persistence); `harness/parity.spec.ts` (integrated comparisons and independent contracts); `playwright.config.ts` (`PARITY_OUT_DIR`); `tests/browser/theme-routing.spec.ts` (real palette/mask/resource probes); `tests/fixtures/composition/build.ts` (`TEST_BUILD_OUT_DIR` and isolated Astro/Vite caches); `tests/fixtures/content-preview/pages/index.astro` and `blog/[id].astro` (minimal picker-free markers while retaining real production checks). This ticket records completion. The root controller separately added `../execution-handoff.md` to record the Anthropic/OpenAI boundary; ticket agents did not edit it.

### Final verification

All final Node checks used `PATH=/private/tmp/theme-engine-openai/s1-13/node-v24.20.0-darwin-arm64/bin:$PATH`. Logs below are under `/private/tmp/theme-engine-openai/s1-13/logs/`; complete command/exit evidence and earlier failures are in `/private/tmp/theme-engine-openai/s1-13/builder-report.md`.

| Command | Result | Raw log |
|---|---|---|
| `node --test tests/unit/parity-migration.test.ts` | exit 0, 24/24; also independently rerun by root | `../request-order/unit-full.log` |
| `npm run test:unit` | exit 0, 491/491, 0 failed/skipped | `final-test-unit.log` |
| `./node_modules/.bin/tsc --noEmit` | exit 0 | `final-tsc.log` |
| `TEST_BUILD_OUT_DIR=/private/tmp/theme-engine-openai/s1-13/fix-builds npm run test:build` | exit 0, 85/85 | `fix-full-build.log` |
| `node --test --test-concurrency=1 tests/build/engine-invariants.test.ts` | exit 0, 16/16, including seven planted builds | `fix-engine-invariants-pass2.log` |
| `npm run build -- --outDir /private/tmp/theme-engine-openai/s1-13/fix-production-build` | exit 0, 65 pages, 0 errors/warnings, 48 existing hints | `fix-production-build.log` |
| `TEST_BUILD_OUT_DIR=/private/tmp/theme-engine-openai/s1-13/final-browser-builds PARITY_OUT_DIR=/private/tmp/theme-engine-openai/s1-13/final-browser-output ./node_modules/.bin/playwright test tests/browser/theme-routing.spec.ts` | exit 0, 24/24 | `final-browser.log` |
| `PARITY_MODE=old-new PARITY_OUT_DIR=/private/tmp/theme-engine-openai/s1-13/parity-list ./node_modules/.bin/playwright test harness/parity.spec.ts --list` | exit 0, 963 collected; 128 pairs = 16 themes × 8 page forms | `parity-old-new-list.log` |
| Full bounded old-old command below | exit 0, **963/963 in 24.3m**, 0 failed | `final-old-old.log` |
| `git diff --check` | exit 0; independently checked by both controllers | `cleanup-final.log` |

The complete final parity command used a 2100-second process-group watchdog, with all artifacts outside Desktop/iCloud:

```sh
PARITY_MODE=old-old \
PARITY_OLD_DIR=/Users/dawsonamf/Desktop/dax/personal-website-old \
PARITY_OUT_DIR=/private/tmp/theme-engine-openai/s1-13/final-old-old \
python3 /private/tmp/theme-engine-openai/s1-13/bounded_exec.py 2100 \
  ./node_modules/.bin/playwright test harness/parity.spec.ts
```

The root controller additionally reran old-new `--list` on final post-fix source under scratch Node 24: exit 0, 963 tests in one file; raw log `root-final-old-new-list.log`.

The planted real builds reject missing/double ThemeAssets markers, extra dock, missing trigger, deletion of the entire enabled picker tail, missing prose size and relative href, with route/source context. Real browser probes also prove identical bounded privacy/404 masks, asymmetric card-wrap unions, unrelated visible differences remaining detectable, and successful unlisted dynamic/removed scripts being rejected. The ticket orchestrator independently reran three final parser/path/origin cases, 3/3. The normalizer's final aggregate covers 69 emitted HTML files (65 engine pages plus four redirect/public outputs): every file has `astroAttrs: 0`, `astroHashes: 0`; see `final-astro-guards.json`.

### Review and dispositions

Four fresh reviews ran in bounded waves: two Astra correctness, Sol security and Sol conventions. Reports are `correctness-a.md`, `correctness-b.md`, `security.md`, `conventions.md` under the ticket scratch root. One consolidated original-builder pass fixed every evidenced issue: asymmetric/fullscreen masks; DOM-only script inventories; quote/raw-text parsing; overbroad preset/card exclusions; absolute resource/canonical scope; old-old vendor coupling; unasserted/duplicate metadata; encoded output traversal; unlisted post URL forms; and mixed-case/protocol-relative same-origin navigation.

The newly exposed request-order problem received one bounded fresh Sol correction, with no second review round. Source shows mixed blocking/defer/async tags may initiate requests concurrently. Exact raw order and exact request identities remain enforced; only OLD METR's awaited loader imposes Plotly → js-yaml → chart request edges. Two repeated current-model old-old observations passed 16/16 each (32/32 total), with matching captured inventories. Details and cleanup: `/private/tmp/theme-engine-openai/s1-13/request-order/report.md`.

Explicit rulings: retain D31's scheme-pass contract rather than adding an unrequested protocol whitelist; repository-authored URLs remain trusted inputs. Keep the real checks integration in prose fixtures and add its minimal picker-free envelope, rather than bypassing engine checks. The Shell comment supplies independent composition intent without a visible DOM change. Scratch output/cache isolation fixes remove cross-worker races and preserve existing caller defaults. All other review risks were fixed. Network/CDN availability remains an inherited harness dependency; outages still fail. Current home/blog completed-script probes deliberately remain red until their page ports, never relaxed or reported as visual parity.

### Runtime and cleanup

Node 25 was the machine default. The approved temporary runtime installation resolved the Node 24 contract without changing defaults, manifest or lockfile: Node v24.20.0 / npm 11.19.0, official archive SHA-256 `40e5607e5ecb3db9192723776da2d75d966260fc74a7a9e731c1bd67dda96bc8`. No project package or browser was installed. Exact download/extraction commands:

```sh
curl -fL https://nodejs.org/dist/v24.20.0/SHASUMS256.txt -o /private/tmp/theme-engine-openai/s1-13/SHASUMS256.txt
curl -fL https://nodejs.org/dist/v24.20.0/node-v24.20.0-darwin-arm64.tar.gz -o /private/tmp/theme-engine-openai/s1-13/node-v24.20.0-darwin-arm64.tar.gz
shasum -a 256 /private/tmp/theme-engine-openai/s1-13/node-v24.20.0-darwin-arm64.tar.gz
tar -xzf /private/tmp/theme-engine-openai/s1-13/node-v24.20.0-darwin-arm64.tar.gz -C /private/tmp/theme-engine-openai/s1-13
```

Final `lsof -nP -iTCP:8781 -sTCP:LISTEN` and the same command for 8782 each exited 1 with no output. Sandboxed process enumeration hit `sysmond service not found`; approved escalation succeeded, with `pgrep -af 'playwright|chromium|parity.spec|bounded_exec.py'` exiting 1/empty. The ticket orchestrator independently repeated both port checks plus parity/headless-shell process checks, all exit 1/empty. The unrelated manual-shell Python PID 65794 on `127.0.0.1:49926` was left untouched. Repository `dist` is a real directory, not a leftover symlink, and the owned temporary build root is absent. All listeners were test-owned, bounded and explicitly loopback. Evidence: `cleanup-final.log`.

**Next ticket:** S1-14 may replace the canonical nav scaffold while preserving Shell/ThemeAssets provenance and the nested picker button contract. Consume async URL pairs and the strict migrated inventories; use scratch output variables for checks. Full visual old-new validation remains with the actual page-port tickets. Owner QA remains at the end of the complete migration.
