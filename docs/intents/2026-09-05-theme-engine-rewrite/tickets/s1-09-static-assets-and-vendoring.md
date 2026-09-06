# S1-09 — Move static assets and establish the single vendor map

**Status:** Unstarted · **Spec milestone:** T3 / T4 / T6 asset prerequisites · **Scope:** one asset migration

**Depends on:** [S1-04](s1-04-theme-data-and-prose-field-types.md)

Assign one agent this ticket plus the [execution contract](../../../superpowers/plans/2026-09-05-spec-1-migration-engine.md). Read [Spec 1](../spec-1-migration-engine-parity.md) §3.1, §8 vendor table, D5/D18 and §15.8. Dependencies supply code and evidence; there is no owner review between tickets.

## Deliverable

Static files keep their served URL paths under `public/`; libraries have one reproducible npm-to-public mapping. This moves T4's vendoring earlier so engine/page agents have concrete assets.

## Files

- Create/copy: `public/css/**`, `public/resources/**`, `public/blog/blog-styles.css`, `public/blog/blog-listing-styles.css`, `public/blog/posts/assets/**`, `public/privacy/privacy-styles.css`, `public/lexchat/lexchat-styles.css`.
- Create: `scripts/vendor-map.mjs`, `scripts/vendor.mjs`, `public/vendor/**`, `tests/unit/vendor-map.test.ts`.
- Create/copy: `public/subsites/elise/12years/{index.html,then.jpeg,now.jpeg}` and `public/subsites/dawson/embedded-swift-agent/{index.html,agent.js,EmbeddedSwiftAgent.wasm,embedded-swift-agent-context.md}` verbatim. Moving these assets now lets post/link tests pass before S1-22 adds old-path redirects.
- Consume the vendor package script created by S1-01; do not edit package.json concurrently with content integration.
- Retain superseded root files until S1-25; do not copy raw post Markdown, docs, CLAUDE, CNAME or .nojekyll into public.

## Interfaces

- `vendor-map.mjs` exports `VENDOR_FILES`, one row per file: `{ npmPath?: string; publicPath: string; cdnUrl: string }`.
- `publicPath` is an origin-root URL such as `/vendor/jquery/jquery.min.js`; the copy script resolves it beneath `public/`.
- Vendor copier, harness normalizer and script allow-list all consume that one table.
- `npm run vendor` explicitly copies installed npm artifacts; no lifecycle hook or integrity side catalog.

## Work

- [ ] Copy existing static files byte-for-byte, including all four inactive skin sheets. Leave per-post fetch-URL fixes to S1-20.
- [ ] Copy both complete subsite trees to their final paths, preserving relative image/WASM paths and the +esm import. Keep the legacy source trees until S1-25.
- [ ] Add jquery, jquery-ui, gsap, aos JS/CSS, vanilla-tilt, highlight CSS and Font Awesome CSS/webfonts from the exact installed pins.
- [ ] Copy Boxicons 2.0.9 CSS and its browser-used woff2 from their existing pinned CDN paths, preserving CSS/font relative depth; do not install the React-dependent Boxicons package.
- [ ] Keep Calendly/Google Fonts external. Keep Mermaid 11.15.0, Plotly 2.27.0 and post js-yaml 4.2.0 external. Do not vendor runtime marked/highlight scripts.
- [ ] Check emitted vendor paths, font loads, byte comparisons and repeatability. Record jquery-ui's specified single escape-byte difference.
- [ ] Leave vendored outputs as repository files for the eventual authorized commit; this ticket does not silently stage or commit.

## Acceptance and verification

- [ ] All copied static assets resolve under their previous URL path from public.
- [ ] No raw draft sources or documentation are copied to public.
- [ ] Font Awesome webfonts and Boxicons woff2 resolve with no network 404 in the test browser.
- [ ] Re-running vendor produces identical output; one mapping serves all three consumers.
- [ ] No new package family, asset optimization, image pipeline, library upgrade or browser download.

```bash
npm run vendor
node --test tests/unit/vendor-map.test.ts
```

## Agent handoff

Record changed files, commands and exit results, and any interface adjustments in the completion report. Resolve implementation failures in scope; do not replace failed assertions with broader exclusions. Leave owner QA to the end of the complete migration.
