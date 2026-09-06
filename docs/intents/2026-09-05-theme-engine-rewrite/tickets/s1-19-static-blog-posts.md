# S1-19 — Render published posts at build time with metadata/body-slot layouts

**Status:** Unstarted · **Spec milestone:** T5 · **Scope:** one post rendering pipeline

**Depends on:** [S1-17](s1-17-canonical-home-integration.md)

Assign one agent this ticket plus the [execution contract](../../../superpowers/plans/2026-09-05-spec-1-migration-engine.md). Read [Spec 1](../spec-1-migration-engine-parity.md) §7, §6.2 post head, D6/D8/D19/D35/D37 and Q1–Q2. Dependencies supply code and evidence; there is no owner review between tickets.

## Deliverable

Eight local posts prerendered across 16 themes, with real served metadata, unchanged marked/highlight output and a small client behavior module.

## Files

- Modify: `src/layouts/canonical/BlogPost.astro` (replace the S1-12 scaffold).
- Create: `src/pages/[...theme]/blog/[id].astro`, `src/posts/render.ts`, `public/js/blog-post-client.js`.
- Create: `tests/build/post-html.test.ts`, `tests/browser/post-behavior.spec.ts`.
- Read: `blog/post.html`, `blog/blog-post.js`, shared Markdown renderer, post projections.
- Do not edit source metadata, sitemap/redirect config, listing or utility files.

## Interfaces

- BlogPost accepts `{ theme, page, composition, post }` and named `post-body` slot. `post.prose` is the same createProseAccess implementation used by shared prose.
- `renderPostBody(post: PostSource): { html: string; hasMermaid: boolean }` delegates to S1-05's Markdown renderer with the approved copy label.
- Render each body once before crossing it with themes in getStaticPaths. If internal links need theme projection, change only link destinations from that canonical render via href; do not re-run Markdown/highlighting 16 times.
- Draft routes exist only in preview, visibly marked/noindex. External records never render archived bodies.

## Work

- [ ] Render the eight published bodies through marked/highlight common, preserving raw HTML and load-bearing article/header/post-content classes.
- [ ] Generate title/description/canonical/OG and BlogPosting JSON-LD from each post source, using its description.l and authoritative date.
- [ ] Emit copy buttons at build; client delegates clicks, preserves 1500 ms copied state, calculates read time from innerText at 200 words/minute and initializes allowed image tilt.
- [ ] Emit pinned Mermaid script and inline initialization only when rendered HTML contains a mermaid div, at the original head position; run diagrams after the library is ready.
- [ ] Preserve per-post stylesheet and classic script order. Leave post Calendly CSS/AOS absent and remove runtime marked/highlight.
- [ ] Apply canonical CSS-prose extras without carousel ticker data.
- [ ] Document the metadata/body-slot extension point without adding MDX, a format registry or converting existing bodies.

## Acceptance and verification

- [ ] The route set is 192 page routes plus 404, before additional redirect stubs.
- [ ] Exactly eight local bodies render; no Gemma/raw draft/archived autoencoder body in output.
- [ ] Toolbelt's two diagrams, Embedded Swift's fences/image and METR's Plotly/js-yaml assets work on both widths.
- [ ] Title/description/JSON-LD exist in raw response HTML and contain correct unescaped text values.
- [ ] Script allow-lists match; no Mermaid download on diagram-free posts and no runtime marked/highlight anywhere on posts.
- [ ] Copy/read-time/image-tilt behavior and source-body links pass. S1-07 already supplies migrated body URLs; S1-20 adds public redirect/sitemap behavior and an all-post resource/link sweep.

```bash
node --test --test-concurrency=1 tests/build/post-html.test.ts
npx playwright test tests/browser/post-behavior.spec.ts
npm run build
PARITY_MODE=old-new npm run test:parity -- --grep @page:post
```

Resolve rendering/link failures against S1-07's source contract in this ticket; do not defer a failing post comparison to the later redirect ticket.

## Agent handoff

Record changed files, commands and exit results, and any interface adjustments in the completion report. Resolve implementation failures in scope; do not replace failed assertions with broader exclusions. Leave owner QA to the end of the complete migration.
