# S1-25 — Finish the migration tree and document the supported architecture

**Status:** Complete, verified 2026-09-08 · **Spec milestone:** T8 · **Scope:** one transition cleanup and documentation change

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

- [x] Audit imported/referenced/output files before removing root duplicates. Use the detached baseline/git history as history, not a second active implementation in the migration tree.
- [x] Remove bootstrap/blog-data/nav-config/client Markdown renderers and obsolete migration scaffolds; check all §8 dead-code removals have actually occurred.
- [x] Audit dead .tc-toggle/.tc-close rules against the real .tc-fab. Delete only proven-unused rules; preserve required utility visuals and inactive sheets.
- [x] Resolve the cycler's duplicated ramp implementation with one authored ramp source and mechanically generated/inlined adapters, preserving classic loading, URL and byte output. If generation is needed, own `scripts/build-picker.mjs` here and wire it before public copying; this is separate from vendoring and must not create a second hand-maintained formula. Re-run the pre-paint and picker tests after this change.
- [x] Finish README walkthroughs for skin and structural authoring, inactive reactivation references to 0f196d0 line ranges, mobile/reduced-motion/no-JS rules, split-text safety, storage and asset isolation.
- [x] Incorporate all six stale claims and eleven omitted contracts from theme-engine-contracts.md §9, using current Spec 1 decisions rather than restoring historical behavior.
- [x] Rewrite CLAUDE for Astro, scripts, owning prose, post publishing, public paths and the final architecture. Update contradictory backlog entries; freeze theme-explorations with a banner pointing to the live guide.
- [x] Complete the retained-code audit and all four §1.1 architecture criteria with observed evidence. Repair structural boundary defects here if they remain; do not defer migration work to future theme specs.

## Acceptance and verification

- [x] There is one source of truth per shared prose/theme/post item and one active rendering path.
- [x] No unintended legacy root serving tree or temporary build experiment remains.
- [x] Retained code has named ownership and reason; no speculative future theme API was added.
- [x] Authoring instructions reproduce S1-24's permitted file-change manifest; guide and repo docs match actual code.
- [x] Structural fixture and content/build checks pass after cleanup. Final parity follows in S1-26.

```bash
node --test --test-concurrency=1 tests/build/migration-cleanup.test.ts
npm run test:unit
npm run build
npx playwright test harness/theme-authoring.spec.ts
```

Remove only inspected migration duplicates; do not delete unrelated docs, planned posts or user changes.

## Agent handoff

Completed on `engine-rewrite` after accepted S1-24 revision `0361d63a7b47`. Exactly 119 inspected
legacy files were individually removed; 27 dead picker rule blocks were removed while preserving
the live FAB, inactive skins and migrated owners. Seven test oracles use the existing SHA-pinned
OLD resolver. One authored ramp generates the classic picker adapter before official Astro commands.

Final checks: cleanup 6/6, full units 511/511, structural build 7/7, affected picker/routing/utility
browser 54/54, and structural browser 8/8, all exit 0. The faithful production build emits
177 engine HTML / 128 local posts / 12 sitemap URLs; its 77-file check and the separate test-inclusive
148-file check both report zero errors and warnings. The latter has 36 hints. Source/copy and output
manifests, exact commands, raw failures and final results are under
`/private/tmp/theme-engine-openai/s1-25/`.

Four fresh reviews completed: two Astra correctness and Sol security found no actionable issue;
Sol conventions found premature deployment wording and stale source comments. One original-builder
aggregate pass fixed those and clarified the five-page visual matrix versus structural/utility
probes. Final runtime changes after acceptance are comments only, proven semantically equal to
both tested copies. Protected CLAUDE bytes and the historical exploration body remain exact.
No second review loop, installs, deployment, git mutation or owner sign-off occurred.

See [architecture evidence](../research/architecture-signoff.md) for all four completion criteria.
Root integrates this ticket before S1-26's full parity sweep. S1-26 preparation is retained at
`/private/tmp/theme-engine-openai/s1-25/s1-26-readiness-map.md` and requires post-commit revalidation.

Record changed files, commands and exit results, and any interface adjustments in the completion report. Resolve implementation failures in scope; do not replace failed assertions with broader exclusions. Leave owner QA to the end of the complete migration.
