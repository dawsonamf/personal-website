# S1-08 — Wire collections, production validation and draft previews

**Status:** Done with risks 2026-09-07 · **Spec milestone:** T2 · **Scope:** one content integration

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

## Completion report

Done with risks, 2026-09-07. Node v25.9.0 (Node 24 not installed; `.nvmrc` = 24 stays the CI contract). Worktree fast-forwarded to `01ebe8b` (S1-06 landed) before any work; `npm ci` exit 0; no other installs, no git write actions, no listeners started.

**Created:** `src/content.config.ts` (27), `src/prose/site.ts` (26), `src/prose/integration.ts` (41), `src/prose/check.ts` (19), `src/build/checks.ts` (78), `src/layouts/canonical/components/DraftPill.astro` (56), `tests/build/content-validation.test.ts` (299), `tests/build/prose-types.test.ts` (53), `tests/fixtures/content-preview/pages/{index.astro,blog/[id].astro}`, `tests/fixtures/prose-types/bound-instance.ts` (10).
**Modified:** `astro.config.mjs` (integrations, `vite.plugins`), `package.json` (scripts only), `tsconfig.json` (`exclude` + `tests/fixtures/content-preview`: root `astro check` otherwise type-checks the fixture pages, whose imports resolve only inside a temp copy), `tests/fixtures/prose-types/tsconfig.json` (+ `bound-instance.ts`, + the `js-yaml` ambient declaration), `CLAUDE.md` (the §4.3 rule section), and **`tests/unit/deploy-workflows.test.ts` (S1-23's file, one assertion):** it pinned `scripts.build === 'astro build'`; updated to the §4.3 string with a comment naming S1-08. Legacy files, `src/content/**`, `CNAME`, `.nojekyll` untouched.

**Interfaces (handoff for S1-11 to S1-13, S1-18 to S1-20, S1-25, S1-26):**
- Collections (`src/content.config.ts`): `prose` = `file('./src/content/prose.yaml', { parser: text => [{ id: 'prose', ...load(text) }] })`, schema `siteProseSchema.extend({ id: z.literal('prose') })` (still strict; the loader passes `id` inside the data, so the collection schema is the only place that knows about it). `posts` = `glob({ base: './src/content/posts', pattern: '**/*.md', deferRender: true })`, schema `postMeta`; ids are filenames without `.md` (11 entries, `gemma4-heretic-ara` included as a draft record).
- `src/prose/site.ts`: `prose` (bound `createProseAccess(tree, 'prose')`) and `proseDrafts: DraftIssue[]`. Components import `prose` from here; nothing else binds shared prose. It has no Astro-runtime import.
- `src/build/checks.ts`: `PROSE_YAML`, `assertNoYamlSyntaxError(): unknown` (zero-arg, reads the file, returns the tree), `assertNoUnwrittenSizes(unwritten: ReadonlySet<string>)`, default `checks()` (`astro:config:setup` parses the YAML; `astro:build:done` asserts the touch sentinel then the unwritten set). **S1-13 adds `assertShellInvariants(pages)` / `assertNoRelativeHrefs(pages)` at the marked comment inside the `astro:build:done` hook**, which receives `{ pages }`. The only `src/` import is `../prose/index.ts`.
- `src/prose/integration.ts`: `contentDraftIssues(): DraftIssue[]` (shared YAML + published/external metadata) and default `prose()`: `astro:config:setup` does `addWatchFile(PROSE_YAML)` and throws one error listing every `  <source>:<path>` unless `PROSE_DRAFTS=allow`.
- `src/prose/check.ts` (`prose:check`): exits 1 first if `PROSE_DRAFTS=allow` is set (production chain must not run as a preview), prints issues to stderr as `  <source>:<path>` and the summary `prose:check: N unapproved draft field(s)` to stdout; exit 1 when N > 0.
- `DraftPill.astro`: props `{ issues: DraftIssue[]; draftPosts: number }`; renders nothing unless `process.env.PROSE_DRAFTS === 'allow'`; emits `<aside id="prose-pill">` (counts, `<details>` list of `source:path`, `<button id="prose-native" aria-pressed>`), literal `<style is:inline>`/`<script is:inline>`, toggles `data-prose-native` on `<html>`, storage key `prose.native`. The Shell (S1-12) passes `[...proseDrafts, ...postDraftIssues(sources)]` and the whole-draft count; the draft post page's marker and `noindex` belong to S1-19 (the fixture models both).
- Scripts, exact: `dev` = `PROSE_DRAFTS=allow astro dev`, `check` = `astro check`, `prose:check` = `node src/prose/check.ts`, `build` = `npm run prose:check && npm run check && astro build`, `build:preview` = `PROSE_DRAFTS=allow astro build`.
- `astro.config.mjs`: `integrations: [prose(), checks(), sitemap()]`; plugin `externalize-shared-instances` (`enforce: 'pre'`, `apply: 'build'`) externalizes exactly `src/prose/index.ts` (shared accumulators), `src/prose/site.ts` and `src/build/posts.ts` (both locate files via `import.meta.url`), matching on the resolved id and returning the absolute `file://` URL; a client-environment import of any of them throws `… is build-time only …`. S1-20 adds its imports and the sitemap options to this same file.

**Commands and results** (builder, four reviewers, fix pass and orchestrator reproduced): `npm run prose:check` exit 0 (`0 unapproved draft field(s)`); `PROSE_DRAFTS=allow node src/prose/check.ts` exit 1. `npm run check` exit 0 (`Result (76 files): 0 errors, 0 warnings, 48 hints`). `node_modules/.bin/tsc --noEmit -p tsconfig.json` exit 0. `node --test --test-concurrency=1 tests/build/content-validation.test.ts tests/build/prose-types.test.ts`: tests 14, pass 14, fail 0, exit 0. Fixture `astro build` statuses: a production unmodified **0** (helm route present, no gemma/autoencoders route, no draft phrase or `publication:` anywhere in dist, no `prose-draft`/`prose-pill`, sitemap has `/blog/helm/` and no gemma); b preview with four planted drafts **0** (`<mark class="prose-draft">`, pill `4 draft field(s) · 1 draft post(s)` listing all four, gemma page with `noindex` and marker, helm `<title>[draft] …`, pill CSS/JS inline, no `dist/_astro`); c production same drafts **1** (all four `source:path` lines in one run, list item included); d broken `prose.yaml` **1** (`checks:` + `prose.yaml`); e broken `helm.md` frontmatter **1** (`posts: helm.md: `); f two absent sizes **1** (`checks: 9 requested prose size(s)`: `prose:home.about.body:xs` + eight `<id>.md:title:xs`, proving one shared set); g `index.ts` dropped from the externalized list **1** (touch sentinel); g2 whole `vite` block removed **1** (bundling named); h unknown top-level key **1** (`InvalidContentEntryDataError … Unrecognized key`); i hoisted client `<script>` importing `src/prose/index.ts` **1** (`build-time only`). `astro check --tsconfig tests/fixtures/prose-types/tsconfig.json` exit 1 (`Result (4 files): 11 errors`: 4 + 4 from S1-05's files, 3 from `bound-instance.ts`); root `astro check` is the positive case. `PARITY_OLD_DIR=/Users/dawsonamf/Desktop/dax/personal-website-old npm run test:build`: tests 27, pass 27. `npm run test:unit`: tests 449, pass 449. Root `npm run build`: `prose:check` and `check` pass, then `astro build` exits 1 at `astro:build:done` with `checks: no prose request reached the checks integration (touches === 0) …`, because the root has no `src/pages/` yet (S1-12); nothing fails earlier (config load, content sync, both collection schemas, redirects all succeed). `git status --short`: only the files above.

**Deviations / adjustments:** `src/prose/site.ts` is externalized too (its `import.meta.url` lookup, same reason as `posts.ts`). The plugin is `apply: 'build'`: in `astro dev` nothing is externalized, so Vite evaluates `site.ts`/`posts.ts` and an in-process restart (triggered by `addWatchFile`) re-reads edited prose; a reviewer showed Node's ESM cache would otherwise pin the old tree for the dev process. `assertProseTouched` is module-local (three named causes in its message, including Astro's silent config-loader fallback). The draft gate walks the raw tree; schema errors surface through the collection (case h). `prose:check` refuses `PROSE_DRAFTS=allow` (fail-closed production chain; the spec's script strings are untouched). Test g as specified could not reach the sentinel (bundled `posts.ts`/`site.ts` fail first with their own bundling diagnostics), so g drops only `index.ts` and g2 keeps the whole-block removal. `checks()` still parses the YAML in its own `config:setup` although `prose()` already did (D39; order-independent).

**Review:** four fresh reviewers (2 correctness on Fable, security and conventions on Opus); no high findings; one fix pass (19 items: the two above plus the client guard, `check.ts` output/prefixing, literal pill CSS/JS with the selector pinned in the test, tighter assertions e/a/b, cases h and i, `src/pages` excluded from the fixture copy, stdlib directory walk, comments). Rejected: deleting the checks `config:setup` hook (D39), consolidating the two `js-yaml.d.ts` declarations (other tickets' files; S1-25 cleanup).

**Accepted risks:** `astro dev` never started here (listener rule), so `dev` (externalization off, restart freshness, Vite-side `import.meta.url`) is reasoned from Vite sources, not measured; owner smoke: `npm run dev`, load a page, edit `prose.yaml`, expect a restart and the new text. Root `astro build` fails at the sentinel until S1-12 adds pages that request prose (intended: an empty site is not a valid production build). The client guard is tested for a hoisted page `<script>` only (`client:` islands and `public/` scripts are not separately covered). Case f's `9` and case b's counts are coupled to the eight published posts. The test forwards the parent env (minus `PROSE_DRAFTS`) to fixture builds. Two identical `js-yaml` ambient declarations remain. S1-01's suite needs `PARITY_OLD_DIR` when run from a worktree (pre-existing). Node 25 instead of 24.

**Environment blocks:** none. The sibling parity agent's loopback Python servers (127.0.0.1:8781/8782) and Playwright run were observed and left alone.
