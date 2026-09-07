# S1-07 — Migrate post ownership and publication-filtered source projections

**Status:** Done 2026-09-07 · **Spec milestone:** T2 · **Scope:** one post-source migration

**Depends on:** [S1-05](s1-05-markdown-prose-access-and-drafts.md)

Assign one agent this ticket plus the [execution contract](../../../superpowers/plans/2026-09-05-spec-1-migration-engine.md). Read [Spec 1](../spec-1-migration-engine-parity.md) §7.1, D8/D19/D24 and Q1–Q2. Dependencies supply code and evidence; there is no owner review between tickets.

## Deliverable

Eleven authoritative post records with one pure source reader and explicit production projections: eight local pages, two external listing records and one unpublished draft.

## Files

- Create: `src/posts/schema.ts`, `src/build/posts.ts`, `src/content/posts/*.md` for the 11 current source ids.
- Create: `tests/unit/post-sources.test.ts`, `tests/fixtures/post-sources/`.
- Read: `blog/posts/*.md`, `js/blog-data.js:112`. Retain legacy root copies until S1-25's transition cleanup.
- Do not edit `src/content/prose.yaml`, theme modules, workflows or `astro.config.mjs`.

## Interfaces

- `PostSource` contains `id`, `source` (filename), `body` (raw Markdown), and validated `meta`.
- `meta.publication` is a discriminant: published/external require current publishable metadata; external also requires `externalUrl`; draft permits unfinished metadata/body.
- Export `readPostSources(): PostSource[]`, `publishedPostIds(): string[]`, `listingPosts(): PostSource[]`, `postDates(): Record<string, string>`, `legacyPostDestinations(): Record<string, string>`.
- Public projections always exclude drafts, even in a preview process. Preview routes explicitly select draft records from `readPostSources()`.
- Legacy destinations contain canonical root paths for published ids and approved external URLs for external ids; absent ids are resolved to 404 by the later shim.

## Work

- [ ] Move metadata/body together using valid YAML. Post title/date win conflicts; listing descriptions/tags are copied verbatim only where absent.
- [ ] Preserve this exact listing order: fly-on-my-laptop, underviewed-art, arena-freshness, helm, toolbelt, embedded-swift-agent, metr-doubling, autoencoders-2, autoencoders-1, college-projects.
- [ ] Make Gemma `publication: draft`; retain autoencoder bodies as archived external sources, with existing aboutobjects.com destinations. Do not promote planning drafts.
- [ ] Preserve raw bodies except the required published-link migration: rewrite relative image/resource paths to root-absolute assets, published .md links to their canonical routes, known external post links to authoritative destinations, and the embedded-agent link to its final subsite path. Normalize scripts/styles metadata to root-absolute local assets or existing pinned external URLs. Test every rewrite against the source URL inventory so S1-19 has no unresolved URL dependency.
- [ ] Validate unique filename ids, listing order, required publishable metadata, dates and external destinations. Use shared field/draft helpers, never `astro:content` or theme imports.
- [ ] Implement one date conversion using the current month/year-plus-day-1 rule with deterministic build-time output; return only published-local dates.
- [ ] Test source-qualified syntax/schema failures, draft retention, publication filtering and exact list membership/order.

## Acceptance and verification

- [ ] Eight published ids, ten listing records and eleven retained sources.
- [ ] Helm title is “Helm: A Workspace Switcher for VS Code and Cursor”, date March 2026; METR date February 2026.
- [ ] Draft fields in published/external metadata are reported; a whole draft is not a production blocker.
- [ ] Neither drafts nor archived external bodies enter public route/body projections.
- [ ] Reader, collection consumers, sitemap and redirects can all use these exports without a second metadata catalog.

```bash
node --test tests/unit/post-sources.test.ts
```

## Agent handoff

Record changed files, commands and exit results, and any interface adjustments in the completion report. Resolve implementation failures in scope; do not replace failed assertions with broader exclusions. Leave owner QA to the end of the complete migration.

## Completion report

Done, 2026-09-07. Ran on Node v25.9.0 (Node 24 not installed; `.nvmrc` = 24 stays the CI contract). Worktree branched stale at `1208d01`; fast-forwarded to `c68b953` (S1-02 landed, past S1-05's `834eb4f`) before any work. `npm ci` exit 0; no other installs, no git write actions, no listeners started.

**Created** (nothing modified except this ticket file; legacy `blog/posts/*.md`, `js/blog-data.js`, `CNAME`, `.nojekyll` untouched): `src/posts/schema.ts` (56 lines), `src/build/posts.ts` (118), `src/build/js-yaml.d.ts` (5, ambient `load()` declaration because `@types/js-yaml` is not an approved install; an identical sibling declaration merges), `src/content/posts/*.md` (11 files, 1196 lines), `tests/unit/post-sources.test.ts` (331, 29 tests), `tests/fixtures/post-sources/**` (13 small `.md` files in 11 case dirs).

**Schema (`src/posts/schema.ts`, pure; imports `astro/zod` = zod 4.5.4 and `../prose/fields.ts`):** `postMeta = z.discriminatedUnion('publication', [published, external, draft])`, all `strictObject`. `published`/`external` require `listingOrder` (int ≥ 0), `title: sizedText`, `date` matching `^(January|…|December) \d{4}$`, `description: sizedText`, `tags: labelList`, `scripts`/`styles: z.array(assetUrl).default([])` where an asset is `^/blog/posts/assets/[^/]+$` or an `https://` URL; `external` adds `externalUrl: z.string().url().startsWith('https://')`. `draft` has the same keys optional (loose `date`), no `listingOrder` and no `externalUrl` (a draft can claim no slot or destination). Exports `postMeta`, `type PostMeta`, `MONTHS` (the one month table, also used by `postDates`). S1-08 wires `glob({ base: './src/content/posts', pattern: '**/*.md', deferRender: true })` with `schema: postMeta`; ids equal the filenames without `.md`.

**Reader (`src/build/posts.ts`, pure, plain-Node loadable; imports `node:fs/path/url`, `js-yaml`, `../prose/drafts.ts`, `../posts/schema.ts`):** `PostSource = { id, source, body, meta: PostMeta }` (`source` = `<id>.md`, `body` = raw Markdown after the legacy `^---\n…\n---\n` split, byte-exact). Exports: `POSTS_DIR`, `readPostSources(dir = POSTS_DIR): PostSource[]` (sorted by filename; dotfiles such as `.DS_Store` ignored; any other non-`.md` entry throws; YAML via `js-yaml` `load` with `filename`; errors are `posts: <source>: <path>: <message>`, cross-record `posts: listingOrder must be exactly 0..N: …`), `listingPosts(sources = readPostSources())` (published + external by `listingOrder`; typed without drafts), `publishedPostIds(sources?)`, `postDates(sources?)` (published local only, `Month YYYY` → `YYYY-MM-01`, the legacy `blog-post.js:50-54` rule without client-timezone drift), `legacyPostDestinations(sources?)` (published → `/blog/<id>/`, external → `externalUrl`, drafts absent), `postDraftIssues(sources?)` (`findDrafts` over published/external meta only; S1-08's production gate fails on a non-empty result). Zero-arg calls re-read the 11 files; pass one `sources` array when calling several. **`POSTS_DIR` derives from `import.meta.url`, so the module must be loaded natively by Node: S1-08 externalizes it in the same `resolveId` plugin as `src/prose/index.ts` (spike-findings §k); a Vite-bundled copy would resolve the directory under `dist/` and the reader then throws a message naming that cause.** cwd-relative was rejected because `tests/build` spawn `astro build --root <fixture>` with cwd unchanged.

**Sources (`src/content/posts/<id>.md`):** frontmatter order `publication`, `listingOrder`, `title: { s }`, `date`, `description: { l }`, `tags`, `scripts`/`styles` (only when non-empty), `externalUrl`; every string double-quoted, `AI & ML`, en dashes and curly quotes verbatim. Title/date from each legacy post file (Helm "Helm: A Workspace Switcher for VS Code and Cursor" / March 2026; METR February 2026); description/tags from `BLOG_POSTS` verbatim. Partition: **published (8, listing orders 0,1,2,3,4,5,6,9)** fly-on-my-laptop, underviewed-art, arena-freshness, helm, toolbelt, embedded-swift-agent, metr-doubling, college-projects; **external (2, orders 7,8)** autoencoders-2 → `https://www.aboutobjects.com/2024/04/01/autoencoders-part-2/`, autoencoders-1 → `https://www.aboutobjects.com/2024/01/05/autoencoders-part-1/` (archived bodies retained, never projected); **draft (1)** gemma4-heretic-ara (title/date from its file, excerpt/tags from the commented-out `blog-data.js:122-129` entry, plain because the whole record is a draft; no slot). `postDates`: fly 2026-08-01, underviewed 2026-07-01, arena 2026-05-01, helm 2026-03-01, toolbelt 2026-03-01, embedded 2026-02-01, metr 2026-02-01, college 2022-05-01. `legacyPostDestinations`: 10 entries (the eight `/blog/<id>/` plus the two URLs above).

**Body/asset migration (the only edits to post text):** `../../resources/` → `/resources/` 25 times (autoencoders-1 9, autoencoders-2 6, college-projects 5, helm 3, arena-freshness 1, embedded-swift-agent 1; research §3.5 says 24, its own rows sum to 25); `post.html?id=autoencoders-1|2` → the aboutobjects URLs (1 each, inside the archived bodies); `](/embedded-swift-agent/)` → `](/subsites/dawson/embedded-swift-agent/)` (1); the generic `post.html?id=<published>` / `<id>.md` → `/blog/<id>/` rules had 0 applications. `scripts`/`styles`: `posts/assets/X` → `/blog/posts/assets/X`; the plotly 2.27.0 and js-yaml 4.2.0 CDN URLs verbatim. Every `/resources/`, `/blog/posts/assets/` and `/subsites/` reference resolves under `public/`. The test derives the expected body of all 11 posts from `blog/posts/*.md` (`PARITY_OLD_DIR ?? repoRoot`, fails rather than skips when missing) and the expected metadata from `js/blog-data.js` evaluated in `node:vm`, so paraphrase, class loss, order swaps or legacy drift all fail it.

**Commands and results** (builder, four reviewers, fixer and orchestrator reproduced): `node --test tests/unit/post-sources.test.ts`: tests 29, pass 29, fail 0, skipped 0, exit 0. `npm run test:unit`: tests 177, pass 177, fail 0, exit 0. `node_modules/.bin/tsc --noEmit -p tsconfig.json`: exit 0, no output. `node -e "import('./src/build/posts.ts')…"`: exports `POSTS_DIR,legacyPostDestinations,listingPosts,postDates,postDraftIssues,publishedPostIds,readPostSources`; projections as listed above; `postDraftIssues()` = `[]`. `git status --short`: only the five new untracked paths.

**Review:** four fresh reviewers (2 correctness on Fable, security and conventions on Opus); no high findings; one fix pass (one `isListed` type guard replaces three casts, single `MONTHS` source, dead `Publication` type removed, draft variant loses `externalUrl` and gets `scripts`/`styles` defaults, dotfiles ignored, `POSTS_DIR` bundling diagnostic, the test's `/blog/<id>/` scan excludes `/blog/posts/`, two extra negative pins: drafted `tags.0` reported and a draft carrying `listingOrder` rejected).

**Deviations / interface adjustments:** `postDraftIssues()` and `POSTS_DIR` are exports the ticket did not list; every projection takes an optional `sources` (zero-arg calls match the ticket). `listingPosts` returns a draft-free subtype of `PostSource[]`. Empty `scripts`/`styles` are omitted from frontmatter and default to `[]`. The reader is stricter than Astro's frontmatter splitter (LF only, no BOM, `---` on its own lines); all 11 files satisfy it.

**Accepted risks:** `metr-chart.js` (a legacy asset, not this ticket's file) loads the plan-pinned CDN `js-yaml@4.2.0` (GHSA-5p4m-2wfm-xmqj range) and parses YAML fetched through corsproxy.io into a numeric-only sink; changing that pin is an owner decision, recorded here for S1-19/S1-26. URL fields are validated by prefix only on repo-owned content; S1-19 emits `scripts`/`styles` through Astro attribute escaping and S1-20 must JSON-encode the destination map. `sizedText` accepts `title: { s: null }` (shared helper; S1-19's title parity would surface it). The test's `node:vm` is a realm shim, not a sandbox (repo-owned file). `PARITY_OLD_DIR` defaults to repoRoot; S1-25 re-points or retires the legacy comparison when `blog/` and `js/` go. Node 25 instead of 24.

**Environment blocks:** none. This ticket started no processes; at completion the loopback Python servers on 8781/8782 and a Playwright run belonged to the sibling parity agent (worktree `agent-ab5580ca242eaf825`), left untouched.
