# S1-05 — Implement Markdown rendering, typed prose access and draft tracking

**Status:** Done 2026-09-06 · **Spec milestone:** T2 · **Scope:** one shared content library

**Depends on:** [S1-04](s1-04-theme-data-and-prose-field-types.md)

Assign one agent this ticket plus the [execution contract](../../../superpowers/plans/2026-09-05-spec-1-migration-engine.md). Read [Spec 1](../spec-1-migration-engine-parity.md) §4.2–4.3, §7.2, D6, D15–D17 and D35–D37. Dependencies supply code and evidence; there is no owner review between tickets.

## Deliverable

A single tested implementation for shared and post prose, with Markdown parity, missing-size reporting, draft handling and derived typing choreography.

## Files

- Create: `src/prose/index.ts`, `src/prose/markdown.ts`, `src/prose/drafts.ts`, `src/prose/masthead.ts`.
- Create: `tests/unit/prose-access.test.ts`, `tests/unit/markdown.test.ts`, `tests/unit/masthead.test.ts`, `tests/fixtures/prose-types/`.
- Read: `blog/blog-post.js:4`, `js/script.js:129`, `blog/blog-listing.js:38`.

## Interfaces

- `createProseAccess<T>(tree: T, source: string): ProseAccess<T>` binds a validated tree; methods are `get/text/list/paragraphs/has(path, size)` per §4.2.
- Export `unwrittenSizes: Set<string>`; deduplicate by source/path/size. Shared and post instances write this same set.
- `findDrafts(tree, source)` returns all source-qualified draft issues; it never silently approves strings.
- `renderMarkdown(source: string, options?: { inline?: boolean; copyLabel?: string }): string` uses the pinned marked and highlight.js common bundle. A supplied approved copy label enables build-emitted code buttons.
- `deriveMastheadSteps(lines: string[], pauseMs: number)` produces the existing typing engine's type/delete/pause step shape. Callbacks remain client-side.
- Keep this module graph importable by the build integration without `astro:content`. S1-08 binds site prose separately in `src/prose/site.ts`.

## Work

- [ ] Copy link/image/code rendering rules, including D16's mailto and Calendly handling, attribute order, raw HTML, mermaid divs and common-language highlighting.
- [ ] Implement all accessor states: written, null, absent size and nonexistent path. Both `has` and rendering accessors record absent sizes; typos throw immediately.
- [ ] Mark drafts consistently in preview, including label-list items and plain-text/attribute use; keep size maps inaccessible through `data`.
- [ ] Preserve canonical paragraph fragments for callers to join with `<br><br>`; do not add wrapper elements inside the accessor.
- [ ] Derive typing edits from longest common prefixes while preserving all nine home and seven listing sequences, duplicates, weighting and pauses.
- [ ] Add negative type fixtures for direct size-map access and unknown paths. Test draft tags/tech through accessor methods instead of exposing raw draft objects.

## Acceptance and verification

- [ ] Approved text escapes once in HTML, attributes and JSON-LD use; `AI & ML` remains that DOM value.
- [ ] Null omits content without an issue; requesting an absent size records exactly its source/path/size; unknown paths throw.
- [ ] Every accessor instance shares the unwritten set. Draft list items receive the same approval behavior as sized text.
- [ ] Code/copy-button, mermaid, image and link HTML match baseline fixtures apart from specified D16 behavior.
- [ ] All 16 derived sequences equal legacy step fixtures after callback positions are accounted for.

```ts
import assert from 'node:assert/strict';
import { createProseAccess, unwrittenSizes } from '../../src/prose/index.ts';
unwrittenSizes.clear();
const p = createProseAccess({ title: { s: 'Hello', xs: null } }, 'fixture');
assert.equal(p.text('title', 'xs'), '');
assert.equal(p.has('title', 'm'), false);
assert.equal(unwrittenSizes.size, 1);
// @ts-expect-error Deliberately exercise runtime rejection of an unknown path.
assert.throws(() => p.text('titel', 's'));
```

```bash
node --test tests/unit/prose-access.test.ts tests/unit/markdown.test.ts tests/unit/masthead.test.ts
```

S1-08 runs the isolated negative fixture through `astro check` and verifies its nonzero result.

## Agent handoff

Record changed files, commands and exit results, and any interface adjustments in the completion report. Resolve implementation failures in scope; do not replace failed assertions with broader exclusions. Leave owner QA to the end of the complete migration.

## Completion report

Done, 2026-09-06. Ran on Node v25.9.0 (Node 24 not installed; `.nvmrc` = 24 stays the CI contract). Worktree branched stale at `1208d01`; fast-forwarded to `02aafd6` (S1-04 landed) before any work. `npm ci` exit 0; no other installs, no git actions, no listeners.

**Created:** `src/prose/index.ts` (240 lines), `src/prose/markdown.ts` (93), `src/prose/drafts.ts` (33), `src/prose/masthead.ts` (32), `tests/unit/prose-access.test.ts` (310), `tests/unit/markdown.test.ts` (275), `tests/unit/masthead.test.ts` (216), `tests/fixtures/prose-types/{size-map-access.ts,unknown-path.ts,tsconfig.json}` (22/17/5). **Modified (shared file created by S1-01, not in the ownership table):** `tsconfig.json`, one line: `exclude` gains `"tests/fixtures/prose-types"` so the negative fixture stays out of the ordinary project check. `src/prose/fields.ts` untouched (imported, not duplicated). No legacy file, `CNAME` or `.nojekyll` touched.

**Exported interfaces (handoff for S1-06, S1-07, S1-08, S1-15, S1-16, S1-19):**
- `src/prose/index.ts` (pure, erasable TS, plain-Node loadable; imports only `./fields.ts`, `./drafts.ts`, `./markdown.ts`; this is the file S1-08 externalizes with the spike §k `resolveId` plugin): `createProseAccess<T>(tree: T, source: string): ProseAccess<T>` (no validation inside; callers pass the zod-parsed tree). `ProseAccess<T> = { data: ProseData<T>; get(path, size): string; text(path, size): string; list(path, size): string[]; textList(path, size): string[]; paragraphs(path, size): string[]; has(path, size): boolean }`, `path: ProsePath<T>` (dot paths ending at a size map or label list, `${number}` for array indices, e.g. `jobs.0.bullets`), `size: Size`. `unwrittenSizes: Set<string>`, entries `${source}:${path}:${size}` (e.g. `prose:home.about.body:xs`). `touches: number` (live `export let`, incremented at entry of all six methods, throwing calls included; S1-08 asserts `touches > 0` before `assertNoUnwrittenSizes`). `DRAFT_CLASS = 'prose-draft'`, `DRAFT_TEXT_PREFIX = '[draft] '`. Types `ProseAccess`, `ProsePath`, `ProseData`. Nothing else is exported (the draft walker lives in `drafts.ts`).
- Behavior per (path, size): written → rendered (`get` block for m/l, inline for xs/s; `list` items inline; `paragraphs` one inline fragment per source paragraph with no `<p>`, callers join with `<br><br>`); `null` → `''`/`[]`/`false`, nothing recorded; absent size → `''`/`[]`/`false` and recorded; unknown path, a terminal that is not a prose field, or the wrong method shape (`get` on a list, `list` on text) → throws `prose: …`. Label lists (`tech`, `tags`) are addressable only at `xs`; other sizes are recorded as unwritten. `has` is `true` for any written value, drafts and `[]` included. `data === tree` at runtime; size maps and draftable label lists are `never` on `data`; plain `string[]` data (post `scripts`) stays readable. An optional field absent on an entry (`themes.default.ticker`) is a path error, not an unwritten size.
- `text()`/`textList()` return PLAIN UNESCAPED text (inline render, strip tags, decode the five entities marked emits); Astro `{}` interpolation, `<title>` and `JSON.stringify` (JSON-LD) then escape exactly once. `get`/`list`/`paragraphs` return HTML for `set:html`.
- Draft marking (D9; applied unconditionally, production never renders a draft because the gate runs `findDrafts` first): inline HTML wrapped `<mark class="prose-draft">…</mark>`, block `get` wrapped `<div class="prose-draft">…</div>`, `text`/`textList` prefixed `[draft] `; label lists mark only the drafted items.
- `src/prose/drafts.ts`: `isDraft(value)`, `findDrafts(tree, source): DraftIssue[]` with `DraftIssue = { source, path }` (depth-first, dot paths like `projects.0.tech.1`, does not descend into a draft, never approves).
- `src/prose/markdown.ts`: `renderMarkdown(source, { inline?, copyLabel? }): string`, `renderParagraphs(source): string[]`. marked 18.0.5, `gfm: true, breaks: false`, overrides copied from `blog/blog-post.js:4-30` plus D16 (`#calendly` → `href="#" class="text-link calendly-link"`; http/https/mailto → `class="text-link" target="_blank" rel="noopener noreferrer"`; attribute order href, class, target, rel, title). `copyLabel` (plain text, attribute-escaped) emits `<pre class="has-copy-btn"><code …>…</code><button type="button" class="code-copy-btn" aria-label="…"><i class="code-copy-icon code-copy-icon-copy fa-regular fa-copy" aria-hidden="true"></i><i class="code-copy-icon code-copy-icon-check fa-solid fa-check" aria-hidden="true"></i></button></pre>` on both non-mermaid branches; an empty label means no button (§4.1 null omits); mermaid stays a raw `<div class="mermaid">`. `renderParagraphs` lexes once, drops `space` and `def` tokens, and renders each paragraph's resolved inline tokens through `marked.Parser.parseInline(tokens, marked.defaults)` so reference links resolve.
- `src/prose/masthead.ts`: `MastheadStep`, `deriveMastheadSteps(lines: string[], pauseMs: number): MastheadStep[]`. **`lines` are terminal strings**, the full on-screen text at each rest point (`"Hi,\nI'm Dawson,\nweb developer."`, `"Hi,\nI'm Dawson,\niOS developer."`, …), per D36 and S1-06's "masthead terminal lines", not §4.1's schematic typed fragments. Steps: `type lines[0]`, then per line `pause pauseMs`, `delete prev.length - lcp`, `type next.slice(lcp)`. The `callback` step is spliced client-side after the first `type`. Home default pause 1500 (sequence 2 is 1000), listing 800.

**Commands and results** (builder, four reviewers, fixer and orchestrator all reproduced): `node --test tests/unit/prose-access.test.ts tests/unit/markdown.test.ts tests/unit/masthead.test.ts`: tests 81, pass 81, fail 0, skipped 0, exit 0. `npm run test:unit`: tests 126, pass 126, fail 0, exit 0. `node_modules/.bin/tsc --noEmit -p tsconfig.json`: exit 0, no output. `node_modules/.bin/tsc --noEmit -p tests/fixtures/prose-types/tsconfig.json`: 8 errors (TS2339 on `never` x4, TS2345 against the `ProsePath` union x4), exit 2, one per intentional line; S1-08 runs the same fixture through `astro check` and should expect this nonzero result. `node -e "import('./src/prose/index.ts')…"`: exports `DRAFT_CLASS,DRAFT_TEXT_PREFIX,createProseAccess,touches,unwrittenSizes`. Legacy parity: the `marked.use({…})` block from `${PARITY_OLD_DIR ?? repoRoot}/blog/blog-post.js`, run in `node:vm` on the installed marked 18.0.5 + highlight.js 11.9.0 (identical to the legacy CDN pins), renders all 11 `blog/posts/*.md` bodies byte-identically to `renderMarkdown` in both the plain and the copy-button forms; 10 posts have highlighted code, `toolbelt.md` has 2 mermaid blocks, 0 posts contain `mailto:` or `#calendly` links (D16 proved on a synthetic case). `hljs.listLanguages().length === 36`. All 16 masthead sequences deep-equal the legacy arrays minus callbacks, with a drift guard against the live source.

**Deviations / interface adjustments:** `textList` added (D35's ticker needs plain-text `projects[i].tech`, which `data` hides). `touches` added (S1-01 contract). Spec §4.2 calls `text()` "HTML-escaped once"; it returns unescaped text because Astro escapes `{}` itself and escaped input would double-escape; the acceptance (`AI & ML` stays that DOM value) holds. Masthead lines are terminal strings (D36 over the §4.1 example); S1-06 authors them that way. `data` hides label lists as well as size maps so a drafted chip can never reach `[object Object]`. The draft mark markup is this ticket's choice (D9 is a delegated decision; the spec defines none).

**Review:** four fresh reviewers (2 correctness on Fable, security and conventions on Opus); no high findings; one fix pass applied (reference links inside `paragraphs`, runtime label-list item check, non-distributive `IsSizeMap` for optional size maps, `Object.hasOwn` path walking, empty copy label, re-exports removed, test guards and hygiene).

**Accepted risks:** raw `href`/`title`/`alt` and mermaid text interpolation exactly as legacy (parity, D16/§7.2; repo-owned content). `highlightAuto` is quadratic on pathological input (the spec keeps the branch; the corpus has 0 untagged fences). A draft containing raw `</mark>` can escape the preview wrapper (preview-only; the pill count comes from `findDrafts`, not the DOM). `text()` decodes only marked's five entities; prose is plain text per rule 7 (no title in the corpus uses an entity; `&hellip;` appears once, inside a post body's raw HTML, which passes through as today). `node:vm` in the parity test is a realm shim, not a sandbox (dev test, repo-owned file, same class S1-04 accepted). `isLabelList` accepts a plain `string[]` at runtime; the type layer (`never` only for draftable items) is what keeps `scripts` out of `list()`. LCP runs on UTF-16 code units, like the engine. `PARITY_OLD_DIR` defaults to repoRoot; S1-25 must re-point or retire the two parity tests when `blog/` and `js/` retire. Node 25 instead of 24.

**Environment blocks:** none. No listeners started; `lsof`/`pgrep` empty after every run.
