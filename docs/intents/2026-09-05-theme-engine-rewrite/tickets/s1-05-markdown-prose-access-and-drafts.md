# S1-05 — Implement Markdown rendering, typed prose access and draft tracking

**Status:** Unstarted · **Spec milestone:** T2 · **Scope:** one shared content library

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
