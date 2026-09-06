# S1-22 — Relocate verbatim subsites and finish public URL boundaries

**Status:** Unstarted · **Spec milestone:** T6 · **Scope:** one static-route migration

**Depends on:** [S1-20](s1-20-post-redirects-sitemap-and-asset-paths.md), [S1-21](s1-21-utility-pages-and-themed-404.md)

Assign one agent this ticket plus the [execution contract](../../../superpowers/plans/2026-09-05-spec-1-migration-engine.md). Read [Spec 1](../spec-1-migration-engine-parity.md) §6.4–6.5, D18/D22/D24 and Q3/Q8. Dependencies supply code and evidence; there is no owner review between tickets.

## Deliverable

Both standalone subsites work at their new paths, old entry URLs redirect, and production serves neither planning docs nor source-only content.

## Files

- Verify S1-09's copy: `public/subsites/elise/12years/{index.html,then.jpeg,now.jpeg}`.
- Verify S1-09's copy: `public/subsites/dawson/embedded-swift-agent/{index.html,agent.js,EmbeddedSwiftAgent.wasm,embedded-swift-agent-context.md}`.
- Create: `public/robots.txt`, `tests/build/public-boundary.test.ts`, `tests/browser/subsites.spec.ts`.
- Modify: `astro.config.mjs` subsite redirects only, after S1-20.
- Read: legacy `12years/`, `embedded-swift-agent/`, `robots.txt`, root CNAME/.nojekyll.

## Interfaces

- Redirect /12years/ → /subsites/elise/12years/.
- Redirect /embedded-swift-agent/ → /subsites/dawson/embedded-swift-agent/.
- Static output uses meta-refresh HTML, not an invented HTTP redirect status.
- Public robots points Sitemap to https://www.dawsonamf.com/sitemap-index.xml.
- Root CNAME/.nojekyll remain rollback-only and never enter public.

## Work

- [ ] Verify every subsite file copied in S1-09 against original bytes and relative image/WASM/import paths; keep external dependencies unchanged.
- [ ] Add the two redirect entries without disturbing S1-20's post redirects/sitemap.
- [ ] Verify project and post links already target the final embedded-agent path.
- [ ] Emit production robots and confirm docs/CLAUDE are absent, with no replacement redirect.
- [ ] Test relative subsite resources and the untouched agent.js +esm import; Vite must not transform public passthroughs.
- [ ] Inventory intentional public assets and compare subsite file bytes against baseline.

## Acceptance and verification

- [ ] Both old entry paths land on the new subsite URLs.
- [ ] Three anniversary and four embedded-agent files are byte-identical and their local dependencies resolve.
- [ ] No docs, CLAUDE, raw post Markdown, draft bodies, CNAME or .nojekyll in dist.
- [ ] Sitemap/robots use the new sitemap index; old sitemap.xml is not emitted.
- [ ] LexChat remains separate, linked and picker-free.
- [ ] Legacy root files are still available for S1-25's deliberate cleanup/rollback audit.

```bash
node --test --test-concurrency=1 tests/build/public-boundary.test.ts
npm run build
npx playwright test tests/browser/subsites.spec.ts
```

## Agent handoff

Record changed files, commands and exit results, and any interface adjustments in the completion report. Resolve implementation failures in scope; do not replace failed assertions with broader exclusions. Leave owner QA to the end of the complete migration.
