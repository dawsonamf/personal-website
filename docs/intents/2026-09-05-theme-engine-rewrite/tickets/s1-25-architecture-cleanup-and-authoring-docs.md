# S1-25 — Finish the migration tree and document the supported architecture

**Status:** Unstarted · **Spec milestone:** T8 · **Scope:** one transition cleanup and documentation change

**Depends on:** [S1-24](s1-24-structural-authoring-proof.md)

Assign one agent this ticket plus the [execution contract](../../../superpowers/plans/2026-09-05-spec-1-migration-engine.md). Read [Spec 1](../spec-1-migration-engine-parity.md) §1.1, §3.3, §8, D3/D18/D23/D32/D35/D38 and §17. Dependencies supply code and evidence; there is no owner review between tickets.

**Owner amendment, 2026-09-08:** S1-21 retires all local LexChat engine pages and unused page assets, with no redirect. Retain its project card/image/approved description and exact external Hugging Face CTA. Privacy/404 require functional coverage; exact OLD/NEW visual and DOM equality is waived. Do not restore the former iframe assumptions. Remove only audited remaining legacy LexChat source/assets; retain the project content/image and every other active owner.

## Deliverable

One final architecture remains in the repo, with no superseded rendering/content sources and working authoring documentation.

## Files

- Remove superseded root implementations after checking references: `index.html`, `404.html`, `robots.txt`, `sitemap.xml`, `js/**`, `css/**`, `resources/**`, `blog/index.html`, `blog/post.html`, `blog/blog-*.js`, root blog CSS/posts/assets, root privacy/LexChat files, root 12years and embedded-swift-agent trees.
- Preserve their migrated src/public owners and the intentional retained files listed below.
- Modify: `CLAUDE.md`, `src/themes/README.md`, `docs/TODO.md`, banner comment in `docs/theme-explorations.html`.
- Modify: `research/architecture-signoff.md` under this intent; create `tests/build/migration-cleanup.test.ts`.
- Narrow cleanup of now-unused declarations in `public/css/theme-cycler.css` and `public/css/themes/*.css`; no discretionary redesign.

## Interfaces

- Canonical behavior belongs to canonical layouts; shared picker is independent. Document every retained module's owner, DOM/data inputs, library dependencies, initialization and listener lifecycle.
- Keep root CNAME/.nojekyll for rollback; public shims, four inactive skins, verbatim subsites, vendor files, existing per-post assets and test fixtures are intentional.
- No fixture-specific algorithm branch, theme-global catalog, duplicate post metadata tree or runtime static-markup builder survives.

## Work

- [ ] Audit imported/referenced/output files before removing root duplicates. Use the detached baseline/git history as history, not a second active implementation in the migration tree.
- [ ] Remove bootstrap/blog-data/nav-config/client Markdown renderers and obsolete migration scaffolds; check all §8 dead-code removals have actually occurred.
- [ ] Audit dead .tc-toggle/.tc-close rules against the real .tc-fab. Delete only proven-unused rules; preserve required utility visuals and inactive sheets.
- [ ] Resolve the cycler's duplicated ramp implementation with one authored ramp source and mechanically generated/inlined adapters, preserving classic loading, URL and byte output. If generation is needed, own `scripts/build-picker.mjs` here and wire it before public copying; this is separate from vendoring and must not create a second hand-maintained formula. Re-run the pre-paint and picker tests after this change.
- [ ] Finish README walkthroughs for skin and structural authoring, inactive reactivation references to 0f196d0 line ranges, mobile/reduced-motion/no-JS rules, split-text safety, storage and asset isolation.
- [ ] Incorporate all six stale claims and eleven omitted contracts from theme-engine-contracts.md §9, using current Spec 1 decisions rather than restoring historical behavior.
- [ ] Rewrite CLAUDE for Astro, scripts, owning prose, post publishing, public paths and the final architecture. Update contradictory backlog entries; freeze theme-explorations with a banner pointing to the live guide.
- [ ] Complete the retained-code audit and all four §1.1 architecture criteria with observed evidence. Repair structural boundary defects here if they remain; do not defer migration work to future theme specs.

## Acceptance and verification

- [ ] There is one source of truth per shared prose/theme/post item and one active rendering path.
- [ ] No unintended legacy root serving tree or temporary build experiment remains.
- [ ] Retained code has named ownership and reason; no speculative future theme API was added.
- [ ] Authoring instructions reproduce S1-24's permitted file-change manifest; guide and repo docs match actual code.
- [ ] Structural fixture and content/build checks pass after cleanup. Final parity follows in S1-26.

```bash
node --test --test-concurrency=1 tests/build/migration-cleanup.test.ts
npm run test:unit
npm run build
npx playwright test harness/theme-authoring.spec.ts
```

Remove only inspected migration duplicates; do not delete unrelated docs, planned posts or user changes.

## Agent handoff

Record changed files, commands and exit results, and any interface adjustments in the completion report. Resolve implementation failures in scope; do not replace failed assertions with broader exclusions. Leave owner QA to the end of the complete migration.
