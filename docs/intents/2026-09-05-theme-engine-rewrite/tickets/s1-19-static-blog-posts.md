# S1-19 — Render published posts at build time with metadata/body-slot layouts

**Status:** Done · **Spec milestone:** T5 · **Scope:** one post rendering pipeline

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

- [x] Render the eight published bodies through marked/highlight common, preserving raw HTML and load-bearing article/header/post-content classes.
- [x] Generate title/description/canonical/OG and BlogPosting JSON-LD from each post source, using its description.l and authoritative date.
- [x] Emit copy buttons at build; client delegates clicks, preserves 1500 ms copied state, calculates read time from innerText at 200 words/minute and initializes allowed image tilt.
- [x] Emit pinned Mermaid script and inline initialization only when rendered HTML contains a mermaid div, at the original head position; run diagrams after the library is ready.
- [x] Preserve per-post stylesheet and classic script order. Leave post Calendly CSS/AOS absent and remove runtime marked/highlight.
- [x] Apply canonical CSS-prose extras without carousel ticker data.
- [x] Document the metadata/body-slot extension point without adding MDX, a format registry or converting existing bodies.

## Acceptance and verification

- [x] The route set is 192 page routes plus 404, before additional redirect stubs.
- [x] Exactly eight local bodies render; no Gemma/raw draft/archived autoencoder body in output.
- [x] Toolbelt's two diagrams, Embedded Swift's fences/image and METR's Plotly/js-yaml assets work on both widths.
- [x] Title/description/JSON-LD exist in raw response HTML and contain correct unescaped text values.
- [x] Script allow-lists match; no Mermaid download on diagram-free posts and no runtime marked/highlight anywhere on posts.
- [x] Copy/read-time/image-tilt behavior and source-body links pass. S1-07 already supplies migrated body URLs; S1-20 adds public redirect/sitemap behavior and an all-post resource/link sweep.

```bash
node --test --test-concurrency=1 tests/build/post-html.test.ts
npx playwright test tests/browser/post-behavior.spec.ts
npm run build
PARITY_MODE=old-new npm run test:parity -- --grep @page:post
```

Resolve rendering/link failures against S1-07's source contract in this ticket; do not defer a failing post comparison to the later redirect ticket.

## Agent handoff

### Completion evidence — 2026-09-08

The frozen exact post selection collected 384 tests and passed 384/384 in 14.7 minutes,
with seven workers across all 16 themes and the actual 1440×900/390×844 viewports.
Source, dist and cache manifests were identical before and after the run. All 384 OLD and
384 NEW captures are present and nonempty. Raw post tests passed 10/10, browser behavior
14/14, and seed/migration units 44/44; root independently reproduced the units. The full
154-file check had zero errors/warnings, and production built 193 page routes including
128 local post routes. Four pre-existing public HTML assets are counted separately.

Two fresh Astra correctness reviews found raw-anchor projection and missing layout-dispatched
post.prose defects; the fresh Sol conventions review corroborated the accessor contract.
Fresh Sol security found inherited preview environment in the production browser fixture.
One consolidated original-builder pass fixed the deduplicated findings. Root also approved
strict source-owned read-time assertions, exact METR style/font-order normalization and
route-aware deterministic calibration for the deliberately omitted Mermaid download.
Raw random counts remain intact; OLD/old-old and noneligible routes retain their base seeds.
Focused post controls passed 6/6 in each mode, and Home/listing palette navigation/reload
controls passed 4/4 in each mode at both widths.

The first full run passed 351/384: 32 failures navigated to unfinished privacy, and one
Bauhaus METR capture timed out on an unidentified finite animation. The one fresh corrective
dispatch used the preauthorized scratch-only METR-to-same-theme-Home destination, preserving
real navigation/reload/pre-paint and destination seed checks. Focused controls passed 34/34
in each mode, then the full matrix passed 384/384. The isolated animation did not reproduce;
its original trace lacks target metadata, and the 15-second deadline remains unchanged.
Tracked METR-to-privacy navigation is retained for S1-26's complete cross-page matrix.

METR uses real pinned Plotly/js-yaml and bundled fallback data in browser/parity checks;
live corsproxy.io success is not claimed. Initial implementation commands and the first
corrective OLD-to-NEW focus lacked tee logs; their transcript limitation is explicit.
Final acceptance has retained raw logs. No packages were installed. Owned listeners and
processes were cleaned up; user PID 45371 on port 4321 was preserved. One test-only trailing
space was removed under root's explicit evidence-applicability ruling.

Final report and exact command/log/artifact pointers:
`/private/tmp/theme-engine-openai/s1-19/final-verification-report.md`.
Review dispositions: `/private/tmp/theme-engine-openai/s1-19/review-dispositions.md`.
S1-20 consumes the eight post routes and source-owned dates/assets for redirects and sitemap;
no source body, metadata, shared prose, sitemap/config, utility, or workflow was changed here.

Record changed files, commands and exit results, and any interface adjustments in the completion report. Resolve implementation failures in scope; do not replace failed assertions with broader exclusions. Leave owner QA to the end of the complete migration.
