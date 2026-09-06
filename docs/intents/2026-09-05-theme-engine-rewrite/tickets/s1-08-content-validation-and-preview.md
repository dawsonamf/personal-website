# S1-08 — Wire collections, production validation and draft previews

**Status:** Unstarted · **Spec milestone:** T2 · **Scope:** one content integration

**Depends on:** [S1-06](s1-06-shared-prose-migration.md), [S1-07](s1-07-post-ownership-and-publication.md)

Assign one agent this ticket plus the [execution contract](../../../superpowers/plans/2026-09-05-spec-1-migration-engine.md). Read [Spec 1](../spec-1-migration-engine-parity.md) §4.3, D9–D10, D37 and D39. Dependencies supply code and evidence; there is no owner review between tickets.

## Deliverable

Production fails on unapproved publishable fields and missing requested sizes, while preview shows drafts visibly. Whole unpublished posts remain safely in source.

## Files

- Create: `src/content.config.ts`, `src/prose/site.ts`, `src/prose/integration.ts`, `src/prose/check.ts`, `src/build/checks.ts`.
- Create: `src/layouts/canonical/components/DraftPill.astro`.
- Create: `tests/build/content-validation.test.ts`, `tests/build/prose-types.test.ts`, `tests/fixtures/content-preview/`.
- Modify: `package.json` scripts, `astro.config.mjs` integration registration, `CLAUDE.md` prose rule only.
- Extend: S1-05's negative type fixtures.

## Interfaces

- `src/prose/site.ts` exports the bound shared `prose`; the pure accessor module keeps its shared set and has no Astro-runtime import.
- Shared prose collection uses `file()` with one `id: 'prose'` entry and the site schema; post collection uses S1-07's reader/schema.
- `src/build/checks.ts` exports default `checks()`, `assertNoYamlSyntaxError()`, `assertNoUnwrittenSizes()`. S1-13 adds emitted-page checks to this same integration.
- `DraftPill` consumes source-qualified draft issues and whole-draft-post count; it renders only under `PROSE_DRAFTS=allow`.

## Work

- [ ] Wire collections and the one shared source/accessor binding. Keep post records owned by their files.
- [ ] Parse shared YAML in `astro:config:setup` so loader-swallowed syntax errors still fail. Report all shared/published/external draft issues before build.
- [ ] Assert the shared unwritten set in `astro:build:done`; prove component requests reach this integration using S1-01's experiment.
- [ ] Set scripts exactly: `dev = PROSE_DRAFTS=allow astro dev`; `check = astro check`; `prose:check = node src/prose/check.ts`; `build = npm run prose:check && npm run check && astro build`; `build:preview = PROSE_DRAFTS=allow astro build`.
- [ ] Implement the visible preview pill and persistent native-prose toggle with inline CSS/JS. Draft posts count, are visibly marked and noindex; production contains no preview chrome.
- [ ] Add the owning-source/approval rule and the narrow grandfathered-assets exception to CLAUDE. Do not wait for owner review of unchanged migrated prose.
- [ ] Plant draft fields, invalid YAML/frontmatter and a requested absent size in isolated copies; test the expected nonzero builds and full issue lists.

## Acceptance and verification

- [ ] Production rejects unapproved shared and published/external metadata, including list items.
- [ ] Whole draft records coexist with a successful production build and do not enter public projections.
- [ ] Preview builds expose draft marking and toggle persistence without changing the ordinary DOM when preview is off.
- [ ] A direct size-map/invalid-path type fixture fails `astro check`; valid code passes.
- [ ] No `globalThis` transport and no second unwritten accumulator.

```bash
npm run prose:check
npm run check
node --test --test-concurrency=1 tests/build/content-validation.test.ts tests/build/prose-types.test.ts
```

## Agent handoff

Record changed files, commands and exit results, and any interface adjustments in the completion report. Resolve implementation failures in scope; do not replace failed assertions with broader exclusions. Leave owner QA to the end of the complete migration.
