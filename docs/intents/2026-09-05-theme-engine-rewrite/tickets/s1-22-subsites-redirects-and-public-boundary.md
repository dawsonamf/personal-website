# S1-22 — Relocate verbatim subsites and finish public URL boundaries

**Status:** Done · **Spec milestone:** T6 · **Scope:** one static-route migration

**Depends on:** [S1-20](s1-20-post-redirects-sitemap-and-asset-paths.md), [S1-21](s1-21-utility-pages-and-themed-404.md)

Assign one agent this ticket plus the [execution contract](../../../superpowers/plans/2026-09-05-spec-1-migration-engine.md). Read [Spec 1](../spec-1-migration-engine-parity.md) §6.4–6.5, D18/D22/D24 and Q3/Q8. Dependencies supply code and evidence; there is no owner review between tickets.

## Deliverable

Both standalone subsites work at their new paths, old entry URLs redirect, and production serves neither planning docs nor source-only content.

## Files

- Verify S1-09's copy: `public/subsites/elise/12years/{index.html,then.jpeg,now.jpeg}`.
- Verify S1-09's copy: `public/subsites/dawson/embedded-swift-agent/{index.html,agent.js,EmbeddedSwiftAgent.wasm,embedded-swift-agent-context.md}`.
- Create: `public/robots.txt`, `tests/build/public-boundary.test.ts`, `tests/browser/subsites.spec.ts`.
- Modify: `astro.config.mjs` subsite redirects and the embedded subsite sitemap entry, after S1-20.
- Adjust strict sitemap expectations: `tests/build/publication-output.test.ts`, `tests/build/utility-html.test.ts`.
- Read: legacy `12years/`, `embedded-swift-agent/`, `robots.txt`, root CNAME/.nojekyll.

## Interfaces

- Redirect /12years/ → /subsites/elise/12years/.
- Redirect /embedded-swift-agent/ → /subsites/dawson/embedded-swift-agent/.
- Static output uses meta-refresh HTML, not an invented HTTP redirect status.
- Public robots points Sitemap to https://www.dawsonamf.com/sitemap-index.xml.
- Root CNAME/.nojekyll remain rollback-only and never enter public.
- Include `https://www.dawsonamf.com/subsites/dawson/embedded-swift-agent/` in the sitemap, as required by Spec 1 §6.5. S1-22 adds this relocated public page to S1-21's 11 engine URLs, giving exactly 12 sitemap URLs; 177 engine page HTML and 128 local post outputs remain unchanged. The old entry redirect and anniversary page are excluded. This narrow scope clarification was authorized on 2026-09-08; S1-21's recorded 11-URL result remains historical evidence.

## Work

- [x] Verify every subsite file copied in S1-09 against original bytes and relative image/WASM/import paths; keep external dependencies unchanged.
- [x] Verify the two already-present redirect entries without disturbing S1-20's post redirects/sitemap.
- [x] Verify project and post links already target the final embedded-agent path.
- [x] Emit production robots and confirm docs/CLAUDE are absent, with no replacement redirect.
- [x] Test relative subsite resources and the untouched agent.js +esm import; Vite must not transform public passthroughs.
- [x] Inventory intentional public assets and compare subsite file bytes against baseline.

## Acceptance and verification

- [x] Both old entry paths land on the new subsite URLs.
- [x] Three anniversary and four embedded-agent files are byte-identical and their local dependencies resolve.
- [x] No docs, CLAUDE, raw post Markdown, draft bodies, CNAME or .nojekyll in dist.
- [x] Sitemap/robots use the new sitemap index; old sitemap.xml is not emitted.
- [x] LexChat remains a project linking directly to its approved Hugging Face destination; no local page or redirect is emitted (owner amendment 2026-09-08, S1-21).
- [x] Legacy root files are still available for S1-25's deliberate cleanup/rollback audit.

```bash
node --test --test-concurrency=1 tests/build/public-boundary.test.ts
npm run build
npx playwright test tests/browser/subsites.spec.ts
```

## Agent handoff

Record changed files, commands and exit results, and any interface adjustments in the completion report. Resolve implementation failures in scope; do not replace failed assertions with broader exclusions. Leave owner QA to the end of the complete migration.

### Completion evidence (2026-09-08)

- Full-public boundary tests: 9/9 passed; inherited publication/utility tests: 14/14 passed. A faithful isolated `npm run build` passed with 177 engine pages, 128 local-post outputs and 12 exact sitemap URLs. Its 300 output files contain 184 HTML files: 177 engine pages, four redirect stubs and three public documents. All 117 public files match source bytes; only the intentional embedded-agent context Markdown is published.
- All seven standalone files match immutable OLD `0f196d0`. The 398-file repository/build-copy input manifests matched before and after the retained production build. Browser checks passed 3/3, including actual static redirect navigation, image/module/context bytes, the untouched `+esm` import request and browser compilation of the served WASM. External requests are blocked; third-party runtime behavior is not claimed.
- Final isolated check including the new test sources: 142 files, zero errors, zero warnings and 35 existing hints. The final browser worker PID 24371 exited, its loopback port 49740 is free, and its fixture was removed. No installs or git mutations were performed.
- Both fresh Astra correctness reviewers and the Sol conventions reviewer found no issues. Security identified inherited persistent credential storage in the unchanged embedded subsite (`esa_openrouter_key` and `esa_exa_key` alongside third-party scripts). Root explicitly accepted this existing risk outside the required byte-preserving migration; no credentials were read or logged. A compromised script on the origin could access those saved keys.
- Evidence and literal commands: `/private/tmp/theme-engine-openai/s1-22/final-verification-report.md`, `implementation-report.md`, `review-dispositions.md`, `logs/`, and `manifests/`. The final report distinguishes the production snapshot from subsequent test-only and completion-document edits.
- S1-24 inherits the 177/128/12 contract and the scratch `s1-24-readiness-map.md`. S1-25 reconciles the boundary fixture's legacy input list with audited deletions while preserving output exclusions, the intentional context Markdown and immutable OLD byte pins.
