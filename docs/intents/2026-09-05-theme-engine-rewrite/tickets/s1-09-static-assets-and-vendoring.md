# S1-09 — Move static assets and establish the single vendor map

**Status:** Done 2026-09-06 · **Spec milestone:** T3 / T4 / T6 asset prerequisites · **Scope:** one asset migration

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

## Completion report

Done, 2026-09-06. Ran on Node v25.9.0 (Node 24 not installed; `.nvmrc` = 24 stays the CI contract). Worktree branched stale at `1208d01`; fast-forwarded to `02aafd6` before any work. `npm ci` exit 0; no other installs. No git write actions: everything below is untracked for the merge agent.

**Created** (nothing modified, nothing deleted; legacy trees stay in place until S1-25):
- `scripts/vendor-map.mjs` (99 lines, 18 rows), `scripts/vendor.mjs` (25), `tests/unit/vendor-map.test.ts` (169, 12 tests).
- `public/`, 107 files, all byte-identical to their worktree sources: `css/` 4 + `css/themes/` 20 (incl. inactive space/vapor/wanted/constructivist and theme-base) · `resources/` 41 (26 + 15 `autoencoders/`) · `blog/blog-styles.css`, `blog/blog-listing-styles.css` · `blog/posts/assets/` 13 · `privacy/privacy-styles.css` · `lexchat/lexchat-styles.css` · `subsites/elise/12years/` 3 · `subsites/dawson/embedded-swift-agent/` 4 (`agent.js` `+esm` import untouched) · `vendor/` 18 (jquery 1, jquery-ui 1, gsap 1, aos 2, vanilla-tilt 1, highlight.js 1, fontawesome-free 9, boxicons 2).
- Deliberately not copied (other owners): `public/robots.txt` (S1-22), `public/blog/post.html` (S1-20), `public/js/**` (S1-11/S1-14 onward). Never: CNAME, .nojekyll, docs, CLAUDE.md, post Markdown, HTML pages, sitemap.xml.

**Vendor map interface** (`scripts/vendor-map.mjs`, the handoff for S1-10, S1-11, S1-13 to S1-16, S1-22, S1-23): `export const VENDOR_FILES`, 18 rows `{ npmPath?: string; publicPath: string; cdnUrl: string }`. `npmPath` is relative to `node_modules/`; `publicPath` is origin-root under `/vendor/<package>/<file>` (Font Awesome and Boxicons keep their `css/` + `webfonts/`|`fonts/` depth so the CSS `../` font URLs resolve unedited); `cdnUrl` is the exact URL the legacy pages author today (normalizer rule 6 maps cdnUrl to publicPath). Public paths: `/vendor/jquery/jquery.min.js`, `/vendor/jquery-ui/jquery-ui.min.js`, `/vendor/gsap/gsap.min.js`, `/vendor/aos/aos.js`, `/vendor/aos/aos.css`, `/vendor/vanilla-tilt/vanilla-tilt.min.js`, `/vendor/highlight.js/github-dark.min.css`, `/vendor/fontawesome-free/css/all.min.css`, `/vendor/fontawesome-free/webfonts/{fa-brands-400,fa-regular-400,fa-solid-900,fa-v4compatibility}.{woff2,ttf}`, `/vendor/boxicons/css/boxicons.min.css`, `/vendor/boxicons/fonts/boxicons.woff2` (the two Boxicons rows have no npmPath: committed copies of the pinned jsdelivr build). `npm run vendor` = `node scripts/vendor.mjs [destRoot]` copies the 16 npm rows only; copy-only, no lifecycle hook, no hash catalog. Consumers today: `vendor.mjs` and the unit test; the harness normalizer and `harness/scripts.ts` (S1-02/S1-13) are the remaining two of the spec's three.

**Commands and results** (run by the builder, four reviewers and the orchestrator):
- `npm run vendor`: exit 0, `vendored 16 files -> <repo>/public`. `node --check` on both scripts: exit 0.
- `node --test tests/unit/vendor-map.test.ts`: tests 12, pass 12, fail 0. `npm run test:unit`: tests 57, pass 57, fail 0, skipped 0.
- Byte copies: `diff -rq` clean for css, resources, blog/posts/assets, 12years, embedded-swift-agent; `cmp` clean for the four single CSS files; all 16 npm rows `cmp`-identical to `node_modules` at the exact pins; `public/vendor` holds exactly the 18 table paths; no dotfiles, no strays.
- CDN comparison (evidence only, nothing written): 15 of 16 npm rows byte-identical to their cdnUrl; jquery-ui differs by exactly one byte (CDN 253,668 B, npm 253,669 B, `cmp`: differ at char 45841, an extra `\` escaping `/` in `escapeSelector`'s regex, suffix identical). Recorded on its row.
- Boxicons 2.0.9: CSS 200, 63,781 B, sha256 `4fc89b0c376bb37f904f4a63ef38e27ba939b1b2da6df77d127d533bb9d167f7`; woff2 200, 102,988 B, sha256 `df8458262a7d3d4dad2851655de2b3ba3b711f52e2bfce63ce0348730bb819c7`; both re-fetched and `cmp`-identical by the security reviewer; `wOF2` magic asserted by the test.
- Browser font check (one-off scratch script: Node http server on 127.0.0.1, ephemeral port, cached Playwright chromium-1228, self-terminating): a fixture loading every vendored CSS/JS produced 0 responses >= 400 and 0 failed requests; `document.fonts.check` true for FA Free (solid + regular), FA Brands and boxicons; `.fa-house::before` font is "Font Awesome 6 Free", `.bx-home::before` is boxicons; globals jQuery 3.6.0, jQuery.ui 1.12.1, gsap 3.9.1, AOS, VanillaTilt present. Not committed as a test (browser tests belong to the harness); the unit test keeps the static precondition (every CSS `url()` resolves to a table row).
- `./node_modules/.bin/astro build`: exit 0, "0 page(s) built" with the expected `Missing pages directory` warnings; `diff -rq` public vs dist clean for every subtree; dist = 107 files + the 2 redirect stubs from astro.config; `dist/` and `.astro/` removed afterwards.
- `./node_modules/.bin/tsc --noEmit -p tsconfig.json`: exit 0, 1.3 s. `git check-ignore -v` on vendor js, woff2 and a PDF: not ignored.

**Review:** four fresh reviewers (2 correctness on Fable, security and conventions on Opus): no high or medium findings. One fix pass: jquery-ui note on its row; `vendor.mjs` header documents `argv[2]` and the copy-only ceiling; `||` so an empty argv falls back to `public/`; `assert.ifError(run.error)` before the status check; Boxicons `url()` check made as strict as Font Awesome's (every reference must resolve under `/vendor/boxicons/fonts/boxicons.`).

**Deviations / interface adjustments:** `vendor.mjs` takes an optional destination root (`argv[2]`) so the repeatability test writes to a temp dir; not in the ticket's interface list. The test's CDN-basename check strips a dotted version from the CDN filename (code.jquery.com serves `jquery-3.6.0.min.js`). Boxicons ships only the woff2; its CSS still names eot/woff/ttf/svg, a first-party 404 only for engines without woff2 (ticket scope: the browser-used woff2). "One mapping serves all three consumers" is two of three until the harness tickets import the table.

**Accepted risks:** (1) `blog/posts/assets/{rate-data,cohort-swe-age-data,cohort-unemployment-data}.json` equal this branch's legacy files but differ from the `0f196d0` baseline checkout (commit `5070950` refreshed them; `"fetched"` 2026-08-31 vs 2026-08-24). The harness (S1-02/S1-13) must move its baseline forward or allow-list those chart pixels; S1-19/S1-20 own the per-post fetch URLs. (2) Boxicons has no npm anchor; the git blob is the integrity record per D5 (no hash catalog by design). (3) Copy-only vendor script leaves a stale file when a row is renamed; the no-strays test fails on it. (4) Every copied JS file now sits in the tsconfig program twice (root and public) until S1-25 removes the legacy tree; TypeScript skips `*.min.js` by default and `checkJs` is off, so exit 0 today. (5) Node 25 instead of 24 (environment; no observed difference).

**Environment blocks:** none. No listeners started; `lsof`/`pgrep` empty after every run.
