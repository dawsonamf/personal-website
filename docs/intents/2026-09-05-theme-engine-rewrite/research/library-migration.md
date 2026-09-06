# Library migration research: CDN → npm (spec 1, parity first)

> Historical research snapshot. The settled owner decisions in [Spec 1 §13](../spec-1-migration-engine-parity.md#13-settled-owner-decisions-q1-q14-2026-09-05) supersede earlier recommendations about post ownership/format, drafts, picker placement and palette support; use the current spec for implementation.

Research for the Astro migration spec (`../intent.md` §2, §3.3, §4.6, §4.12, §6, §7).
Everything below was verified on 2026-09-05 against the repo working tree and the
npm registry / jsDelivr / unpkg. Byte comparisons are `shasum -a 256` of the two
URLs named. Nothing here is from memory; anything unverified says so.

---

## 1. Summary for the spec author

1. **gsap 3.9.1 is dead weight.** `grep -rInE '\bgsap\b|TweenMax|TimelineMax|ScrollTrigger'` over the whole site (excluding `docs/`, `12years/`, `embedded-swift-agent/`) returns exactly one hit: the `<script>` tag itself at `index.html:30`. The intent's claim is confirmed.
2. **Five libraries are byte-identical between the CDN file used today and the npm package file**: jquery 3.6.0, gsap 3.9.1, vanilla-tilt 1.7.0, highlight.js 11.9.0 `highlight.min.js` (via `@highlightjs/cdn-assets`), Font Awesome 6.5.1 `all.min.css`, plus `github-dark.min.css` and plotly 2.27.0. Same sha256, same byte count.
3. **jQuery UI 1.12.1 differs by exactly one byte** between `code.jquery.com` and `jquery-ui-dist@1.12.1`: an escaped `/` inside a regex character class (`,./:` vs `,.\/:`). Semantically identical; a different uglify pass. Safe for parity.
4. **`aos@2.3.1` and `boxicons@2.0.9` are already loaded from unpkg/jsDelivr `/npm/` paths**, so they are the npm files by definition. No verification gap.
5. **`marked@18.0.5/lib/marked.umd.min.js` does not exist in the npm package.** The package ships only `lib/marked.esm.js` and `lib/marked.umd.js` (12 files total). jsDelivr minifies on the fly. There is no byte-identical npm artifact; `lib/marked.umd.js` is the same source unminified.
6. **highlight.js: the CDN file is the 36-language COMMON subset**, verified by extracting `grmr_<lang>` keys from the minified bundle and diffing against `highlight.js@11.9.0/lib/common.js`. Identical sets.
7. **Every fenced-code language on the site is in that common set.** Site uses: `python` (20), `swift` (9), `typescript` (2), `bash` (2), `json` (1), `javascript` (1), `c` (1), plus `mermaid` (2, handled separately).
8. **There are zero language-less code fences.** 38 bare ` ``` ` occurrences, 38 language-tagged opening fences: all bare ones are closing fences. `hljs.highlightAuto` (`blog/blog-post.js:27`) is dead code today, so auto-detect's language-set sensitivity is not a parity risk.
9. **mermaid 11.15.0 is enormous**: `dist.unpackedSize` 76,342,428 bytes, 888 files, 428 of which are `dist/chunks/`. The file the site loads (`dist/mermaid.min.js`) is 3.31 MB. Keep it client-only and lazy.
10. **mermaid's npm `exports` points at `dist/mermaid.core.mjs` (48 KB), not the self-contained UMD.** `import mermaid from 'mermaid'` makes Vite bundle d3, katex, cytoscape, roughjs, dompurify, es-toolkit et al. That is a different artifact from what ships today.
11. **`boxicons@2.0.9` declares `react`, `react-dom`, `react-router-dom`, `prop-types`, `react-interactive`, `@webcomponents/webcomponentsjs` as runtime `dependencies`.** `npm i boxicons` drags React 16 into `node_modules`. Do not install it.
12. **Boxicons is used for exactly one icon**: `bx bx-envelope`, twice, both in `js/nav-config.js` (lines 17 and 53). That is 63 KB of CSS + 103 KB of woff2 for one envelope.
13. **Font Awesome: all 11 classes the site uses exist in the free 6.5.1 `all.min.css`** (verified by grepping `.<class>:before` in the file). `fa-palette`, `fa-linkedin`, `fa-x-twitter`, `fa-facebook-messenger`, `fa-user-circle`, `fa-calendar-alt`, `fa-chevron-down`, `fa-check`, `fa-copy`, `fa-lock`, `fa-lock-open`.
14. **jQuery is used for one thing: the smooth-scroll `$('html,body').animate(..., 'easeInOutQuad')`** at `js/script.js:244-250`, plus `$(document).ready` wrappers and `$('.card').get()`. `easeInOutQuad` comes from jQuery UI, not jQuery core.
15. **`jquery-ui@1.12.1/ui/effect.js` alone defines every `easeIn/Out/InOut<Name>`** (`baseEasings` → `$.easing`, lines 1588-1627), and its only dependency is jQuery. 40 KB source vs the 254 KB full bundle. Its browser-globals branch calls `factory(jQuery)`, so it needs `window.jQuery` set before import.
16. **npm's `main` for `jquery@3.6.0` is `dist/jquery.js` (UMD).** Under a bundler it exports without touching `window`, so `window.jQuery = window.$ = $` must be assigned explicitly before jQuery UI loads and before any global `$(...)` call site runs.
17. **GSAP went fully free in 2025 under Webflow.** `gsap@3.15.0` README: "Thanks to Webflow, GSAP is now 100% FREE including ALL of the bonus plugins like SplitText, MorphSVG, and all the others that were exclusively available to Club GSAP members." Confirmed structurally: `ScrollSmoother.js`, `SplitText.js`, `MorphSVGPlugin.js`, `CustomEase.js`, `DrawSVGPlugin.js`, `InertiaPlugin.js`, `GSDevTools.js` are all in the public tarball at 3.13.0 and 3.15.0, and none of them are in 3.9.1.
18. **Latest gsap 3.x is 3.15.0** (`dist-tags.latest`). Documented import shape is `import gsap from "gsap"` / `import ScrollTrigger from "gsap/ScrollTrigger"`.
19. **npm supports side-by-side versions via the `npm:` alias protocol**, documented in `package.json` docs: `"kpg": "npm:pkg@1.0.0"`. So `"gsap-next": "npm:gsap@3.15.0"` + `import gsap from 'gsap-next'` holds 3.9.1 and 3.15.0 in one tree.
20. **Google Fonts are never in a page `<head>`.** They are injected pre-paint by `js/theme-bootstrap.js:715` from each registry entry's `fonts` array. The `default` and `grid` themes have no `fonts` array at all (default is `sans-serif`/`'SF Mono'`, `css/styles.css:14-16`). There are no `preconnect` hints anywhere on the main site. There is no `@import url()` in any site CSS.
21. **Calendly is invoked from JS, not markup**: `Calendly.initPopupWidget({url})` at `js/nav-config.js:138`, bound to every `.calendly-link`. Only `index.html` and `blog/index.html` load the widget, and only those two pages render `.calendly-link` elements.
22. **Per-post chart assets use page-relative data URLs** (`posts/assets/cohort-unemployment-data.json`, `blog/posts/assets/cohorts-chart.js:642`). Prerendering posts at `/blog/<id>/` (§4.6) breaks these unless the paths are made absolute. This is the sharpest migration risk in this report.
23. **`plotly-2.27.0.min.js` from `cdn.plot.ly` is byte-identical to `plotly.js-dist-min@2.27.0/plotly.min.js`** (sha256 `7f4930eb…`), 3,598,158 bytes.
24. **Lenis latest is 1.3.26**, package name `lenis`; `@studio-freight/lenis` is deprecated with an explicit rename notice on npm.
25. **Every pinned version in intent §4.12 exists on the registry.** All ten `curl https://registry.npmjs.org/<pkg>/<version>` calls returned HTTP 200.

---

## 2. STEP 1 — What the site loads today

Excludes `docs/`, `12years/`, `embedded-swift-agent/` (those are §4 below).

### 2.1 Third-party CSS

| URL | file:line | Pages | Load | What |
|---|---|---|---|---|
| `https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css` | `index.html:19`, `blog/index.html:18`, `blog/post.html:11`, `privacy/index.html:12` | home, listing, post, privacy | `<link>` blocking | Font Awesome 6.5.1 Free, all 3 families |
| `https://cdn.jsdelivr.net/npm/boxicons@2.0.9/css/boxicons.min.css` | `index.html:20`, `blog/index.html:19`, `blog/post.html:12`, `privacy/index.html:13` | home, listing, post, privacy | `<link>` blocking | Boxicons 2.0.9 |
| `https://unpkg.com/aos@2.3.1/dist/aos.css` | `index.html:21`, `blog/index.html:20` | home, listing | `<link>` blocking | AOS animation CSS |
| `https://assets.calendly.com/assets/external/widget.css` | `index.html:22`, `blog/index.html:21` | home, listing | `<link>` blocking | Calendly popup chrome |
| `https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/github-dark.min.css` | `blog/post.html:19` | post | `<link>` blocking | hljs github-dark theme (1,315 bytes) |

`404.html` and `lexchat/index.html` load **no** third-party CSS.

### 2.2 Third-party JS

| URL | file:line | Pages | Load | What |
|---|---|---|---|---|
| `https://cdnjs.cloudflare.com/ajax/libs/gsap/3.9.1/gsap.min.js` | `index.html:30` | home only | `defer` | **never called** |
| `https://code.jquery.com/jquery-3.6.0.min.js` | `index.html:31` | home only | `defer` | jQuery core |
| `https://code.jquery.com/ui/1.12.1/jquery-ui.min.js` | `index.html:32` | home only | `defer` | full jQuery UI bundle; only `effect.js` easings used |
| `https://unpkg.com/aos@2.3.1/dist/aos.js` | `index.html:33` (`defer`), `blog/index.html:29` (**sync**) | home, listing | mixed | AOS |
| `https://cdnjs.cloudflare.com/ajax/libs/vanilla-tilt/1.7.0/vanilla-tilt.min.js` | `index.html:34` (**sync**), `blog/index.html:30` (**sync**), `blog/post.html:23` (**sync**) | home, listing, post | sync | VanillaTilt |
| `https://assets.calendly.com/assets/external/widget.js` | `index.html:35`, `blog/index.html:31` | home, listing | `async` | Calendly widget |
| `https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/highlight.min.js` | `blog/post.html:20` | post | sync | hljs common bundle |
| `https://cdn.jsdelivr.net/npm/marked@18.0.5/lib/marked.umd.min.js` | `blog/post.html:21` | post | sync | markdown renderer |
| `https://cdn.jsdelivr.net/npm/mermaid@11.15.0/dist/mermaid.min.js` | `blog/post.html:22` | post | sync | diagrams (3.31 MB) |

Note the sync/defer asymmetry: `aos.js` is `defer` on home but **synchronous** on the blog listing, and `vanilla-tilt` is synchronous on all three pages. `blog/post.html:27-57` contains an inline **synchronous** `mermaid.initialize(...)` that runs immediately after the mermaid `<script>` and reads CSS custom properties off `<html>` — it depends on both mermaid and `theme-bootstrap.js` having already executed.

### 2.3 Loaded at runtime by JS

`blog/blog-post.js:114-135` (`loadPostScripts` / `loadPostStyles`) appends `<script>`/`<link>` from each post's frontmatter, **sequentially, in order**:

| URL | file:line | Post |
|---|---|---|
| `https://cdn.plot.ly/plotly-2.27.0.min.js` | `blog/posts/gemma4-heretic-ara.md:4` | gemma4-heretic-ara |
| `https://cdn.plot.ly/plotly-2.27.0.min.js` | `blog/posts/metr-doubling.md:4` | metr-doubling |
| `https://cdn.jsdelivr.net/npm/js-yaml@4.2.0/dist/js-yaml.min.js` | `blog/posts/metr-doubling.md:4` | metr-doubling |
| `posts/assets/heretic-ara-charts.js` + `.css` | `blog/posts/gemma4-heretic-ara.md:4-5` | gemma4-heretic-ara |
| `posts/assets/metr-chart.js` + `.css` | `blog/posts/metr-doubling.md:4-5` | metr-doubling |
| `posts/assets/underviewed-art.js` + `.css` | `blog/posts/underviewed-art.md:4-5` | underviewed-art |

`js/theme-bootstrap.js:715` appends, pre-paint and blocking, per active theme: the Google Fonts `css2` URL from `entry.fonts` (14 distinct URLs across the registry), then `/css/themes/theme-base.css`, then `entry.css`.

Runtime third-party HTTP APIs called by per-post assets (not script loads, but external dependencies that must keep working):
`https://corsproxy.io/?…metr.org/assets/benchmark_results_1_1.yaml` (`metr-chart.js:204`),
`collectionapi.metmuseum.org` (`underviewed-art.js:38`), `openaccess-api.clevelandart.org` (`:84`),
`api.vam.ac.uk` (`:127`), `www.getty.edu/art/collection/api` (`:146`).

Orphan: `blog/posts/assets/job-market-chart.js` and `cohorts-chart.js` (plus their CSS and three JSON snapshots) exist and are refreshed weekly by `.github/workflows/refresh-chart-data.yml`, but their post is still at `docs/planned-posts/ai-job-market.md` (not in `blog/posts/`). They must survive the migration even though no live post loads them today.

---

## 3. STEP 2 — Per-library findings

### 3.1 gsap 3.9.1 (default theme)

- Registry: `curl https://registry.npmjs.org/gsap/3.9.1` → **HTTP 200**. `dist.tarball` `https://registry.npmjs.org/gsap/-/gsap-3.9.1.tgz`, unpackedSize 2,943,863, 106 files.
- Entry points: `main: "dist/gsap.js"`, `module: "index.js"`, `types: "types/index.d.ts"`, `sideEffects: false`. **No `exports` field** at 3.9.1.
- Byte parity: `cdnjs…/gsap/3.9.1/gsap.min.js` and `cdn.jsdelivr.net/npm/gsap@3.9.1/dist/gsap.min.js` are both 64,148 bytes, sha256 `6dbe9c2e13cf06c6…`. **Identical.**
- Attaches `window.gsap` when loaded as a classic script; the ESM entry (`index.js`) exports `gsap` / default without touching `window`.
- **Usage: none.** Site-wide grep for `gsap`/`TweenMax`/`TimelineMax`/`ScrollTrigger` returns only `index.html:30`.
- Vite/Astro import: `import gsap from 'gsap'` would work, but there is nothing to import it *for*. Intent §7 defers deleting it to the cleanup pass. For spec 1 the cheapest parity-preserving move is a bare side-effect import in the default theme's entry (`import 'gsap'`) so the bundle graph still contains it, or simply drop the tag and note the deviation — nothing observable changes either way, since no code reads the global.

### 3.2 gsap 3.13.0+ / 3.15.0 (future structural themes)

- Latest 3.x: **3.15.0** (`dist-tags.latest`). 3.13.0 and 3.14.x also exist. Both 3.13.0 (178 files, 6,113,586 bytes) and 3.15.0 (179 files, 6,258,071 bytes) ship the formerly-Club plugins.
- Free-since-2025, primary sources:
  - `gsap.com/docs/v3/Installation/`: "the private NPM repository is no longer maintained as GSAP and all the plugins are now freely available on npm."
  - `unpkg.com/gsap@3.15.0/README.md`: "Thanks to Webflow, GSAP is now **100% FREE** including ALL of the bonus plugins like SplitText, MorphSVG, and all the others that were exclusively available to Club GSAP members."
- Structural confirmation (jsDelivr package file listing, root level):
  - **3.15.0 has**: `ScrollSmoother.js` (40,957 B), `SplitText.js` (17,263 B), `ScrollTrigger.js` (112,578 B), `MorphSVGPlugin.js` (38,174 B), `CustomEase.js` (11,367 B), plus `DrawSVGPlugin.js`, `InertiaPlugin.js`, `GSDevTools.js`, `Physics2DPlugin.js`, `ScrambleTextPlugin.js`, `CustomBounce.js`, `CustomWiggle.js`, `MotionPathHelper.js`.
  - **3.13.0 root file list is the same set** (`ScrollSmoother.js`, `SplitText.js`, `MorphSVGPlugin.js`, `CustomEase.js` all present).
  - **3.9.1 `dist/` has none of them** — only `CSSRulePlugin`, `CustomEase`, `Draggable`, `EasePack`, `EaselPlugin`, `Flip`, `MotionPathPlugin`, `PixiPlugin`, `ScrollToPlugin`, `ScrollTrigger`, `TextPlugin`.
- Import paths (README, verified against the files): `import gsap from "gsap"`, `import ScrollTrigger from "gsap/ScrollTrigger"`, `import Flip from "gsap/Flip"`. Every plugin file's ESM export is `export { X as default }` (`SplitText.js` also has a named `SplitText`). `gsap/all` re-exports everything including `ScrollSmoother` and `SplitText`.
- 3.15.0 has a full `exports` map with `"./*": {"import": "./*.js", "require": "./dist/*.js"}`, so subpath imports resolve cleanly. 3.13.0 has **no** `exports` field and relies on legacy path resolution (still fine under Vite).
- **Side-by-side with 3.9.1 via npm alias.** npm `package.json` docs list `"npm:@scope/pkg@version"` as a "Custom alias for a package", example `{"dependencies": {"kpg": "npm:pkg@1.0.0"}}`. So:
  ```json
  { "dependencies": { "gsap": "3.9.1", "gsap-next": "npm:gsap@3.15.0" } }
  ```
  then `import gsap from 'gsap-next'` and `import ScrollSmoother from 'gsap-next/ScrollSmoother'`. Two separate module graphs, two separate Vite chunks, no version conflict. (Note: 3.13.0's lack of `exports` means the subpath alias form `gsap-next/ScrollSmoother` relies on legacy resolution; pin the alias at 3.15.0 to avoid that.)
- Caution: two GSAP copies means two independent plugin registries and two `gsap.core` singletons. Never mix `gsap` and `gsap-next` objects in one animation. Since the default theme calls neither, this is theoretical for spec 1.

### 3.3 jquery 3.6.0

- Registry: **HTTP 200**. `dist.tarball` `…/jquery-3.6.0.tgz`, unpackedSize 1,318,507, 123 files.
- Entry: `main: "dist/jquery.js"` only. No `module`, no `exports`, no `browser`, no `unpkg`.
- Byte parity: `code.jquery.com/jquery-3.6.0.min.js` and `cdn.jsdelivr.net/npm/jquery@3.6.0/dist/jquery.min.js` are both 89,501 bytes, sha256 `ff1523fb7389539c…`. **Identical.**
- Globals: as a classic script it sets `window.jQuery` and `window.$`. `dist/jquery.js` is UMD; under a bundler the CommonJS branch calls the factory with `noGlobal = true`, so **`window.jQuery` is not set**. You must do `import $ from 'jquery'; window.jQuery = window.$ = $;` before anything that expects the global.
- Usage on the site (all in `js/script.js`): `$(document).ready` (lines 215, 255), `$('.menu-item').on('click', …)` (216), `$(this).is(…)` (219), `$(target).offset().top` / `$(window).scrollTop()` (239, 246), `$('html, body').animate({scrollTop}, timing, 'easeInOutQuad')` (244-250), `$('.card').get()` (258). That is the complete list.
- Latest on npm is 4.0.0 — irrelevant, stay pinned.

### 3.4 jQuery UI 1.12.1

- **Which npm package matches the CDN bundle: `jquery-ui-dist`.** `jquery-ui-dist@1.12.1` ships `/jquery-ui.min.js` (253,669 B), `/jquery-ui.js`, `/jquery-ui.min.css`, `/jquery-ui.structure*.css`, `/jquery-ui.theme*.css`, `/images/ui-icons_*.png` and a vendored `/external/jquery/jquery.js` — 20 files total. `main: "ui/widget.js"` (which does **not** exist in the tarball; the field is wrong, import the file path directly).
- **`jquery-ui`** (same version) is the AMD source layout: 718 files, `ui/effect.js`, `ui/effects/effect-*.js`, `ui/widgets/*.js`, plus `demos/` and `tests/`. `main: "ui/widget.js"`.
- **`jquery-ui-bundle`** exists only at 1.11.4, 1.12.1 and 1.12.1-migrate (3 versions); `dist-tags.latest` is `1.12.1-migrate`. It is a third-party repackage, not maintained by the jQuery team. `jquery-ui-dist` is the one the jQuery project publishes and it goes to 1.13.3.
- Byte comparison: `code.jquery.com/ui/1.12.1/jquery-ui.min.js` is 253,668 B, `jquery-ui-dist@1.12.1/jquery-ui.min.js` is 253,669 B. First difference at byte 45,840, inside `t.ui.escapeSelector`: CDN has `/([!"#$%&'()*+,./:;<=>?@[\]^\`{|}~])/g`, npm has the same regex with `\/` escaped. Same regex semantics, one extra backslash. **Functionally identical.**
- The CDN bundle's banner lists everything: `widget.js, position.js, data.js, disable-selection.js, effect.js, effects/effect-{blind,bounce,clip,drop,explode,fade,fold,highlight,puff,pulsate,scale,shake,size,slide,transfer}.js, focusable.js, form-reset-mixin.js, jquery-1-7.js, keycode.js, labels.js, scroll-parent.js, tabbable.js, unique-id.js, widgets/{accordion,autocomplete,button,checkboxradio,controlgroup,datepicker,dialog,draggable,droppable,menu,mouse,progressbar,resizable,selectable,selectmenu,slider,sortable,spinner,tabs,tooltip}.js`. The site uses **one easing function** out of all of that.
- **Only easing is used.** The single call site is `js/script.js:249`, the string `'easeInOutQuad'`. No `$.easing` reads, no `.effect()`, no widgets, no `swing`, no other `easeIn*`/`easeOut*` name anywhere in the repo.
- **`jquery-ui/ui/effect.js` alone is sufficient.** Verified at `unpkg.com/jquery-ui@1.12.1/ui/effect.js` (40,792 B): lines 1588-1627 build `baseEasings` for `Quad, Cubic, Quart, Quint, Expo` (+ `Sine, Circ, Elastic, Back, Bounce` via `$.extend`) and register `$.easing["easeIn"+name]`, `["easeOut"+name]`, `["easeInOut"+name]`. `easeInOutQuad` is produced there. AMD deps are `["jquery", "./version"]`; the non-AMD branch is `factory( jQuery )`, i.e. it reads the **global** `jQuery`.
  - Under Vite there is no `define`, so `import 'jquery-ui/ui/effect.js'` takes the globals branch → `window.jQuery` must already be assigned. `./version` is only pulled in under AMD, so it is not needed.
  - Caveat: `ui/effect.js` also inlines the whole jQuery Color plugin and the class-animation/morph machinery. It is ~40 KB of source, not just the ~40 lines of easing math. Still 6x smaller than the full bundle.
- **Recommendation for spec 1:** `import 'jquery-ui-dist/jquery-ui.min.js'` (the exact artifact, one-byte-different, zero behavioural risk) — or `import 'jquery-ui/ui/effect.js'` if the 214 KB saving is worth a small parity argument. Replacing the easing with 4 lines of math is explicitly the **cleanup pass** (intent §7), not spec 1.

### 3.5 aos 2.3.1

- Registry: **HTTP 200**. Tarball `…/aos-2.3.1.tgz`, unpackedSize 434,004, 39 files. Runtime deps: `lodash.debounce ^4.0.6`, `lodash.throttle ^4.0.1`, `classlist-polyfill ^1.0.3`.
- Entry: `main: "dist/aos.js"` only. No `module`/`exports`/`browser`.
- Files: `dist/aos.js` (14,239 B), `dist/aos.css` (26,053 B), plus `.map` files.
- Byte parity is trivially guaranteed: the site already loads `unpkg.com/aos@2.3.1/dist/aos.{js,css}`, and unpkg serves the npm tarball verbatim. Both fetched HTTP 200 at the sizes above.
- `dist/aos.js` is UMD (`…?define([],t):"object"==typeof exports?exports.AOS=t():e.AOS=t()`), so it sets `window.AOS` as a classic script, and `import AOS from 'aos'` works under Vite (CJS interop).
- CSS: **`aos/dist/aos.css`** — must be loaded; every `data-aos` animation lives there.
- Init calls and options:
  - `js/script.js:212` → `AOS.init();` (all defaults) — home page.
  - `blog/blog-listing.js:178` → `AOS.init({ offset: 50 });` and `:175` → `AOS.refresh();` — blog listing.
  - Markup attributes in use: `data-aos="fade-up"|"fade-left"|"fade-right"`, `data-aos-easing="ease-in-out"`, `data-aos-once="true"` at `index.html:138-140, 214-216, 241, 262-263, 269-270, 291-293` and `blog/index.html:95, 100`.
- Import shape: `import AOS from 'aos'; import 'aos/dist/aos.css';`
- Latest is 2.3.4 — stay pinned at 2.3.1.

### 3.6 vanilla-tilt 1.7.0

- Registry: **HTTP 200**. Tarball `…/vanilla-tilt-1.7.0.tgz`, unpackedSize 757,534, 28 files (includes stray `.idea/` cruft).
- Entry: `main: "lib/vanilla-tilt.js"`, `types: "vanilla-tilt.d.ts"`. No `module`, no `exports`.
- Builds shipped: `lib/vanilla-tilt.js` (CJS, `module.exports = VanillaTilt`), `lib/vanilla-tilt.es2015.js` (ESM, `export default VanillaTilt`), `dist/vanilla-tilt.js` (IIFE), `dist/vanilla-tilt.min.js` (IIFE, 8,938 B), `dist/vanilla-tilt.babel*.js`.
- Byte parity: `cdnjs…/vanilla-tilt/1.7.0/vanilla-tilt.min.js` and `cdn.jsdelivr.net/npm/vanilla-tilt@1.7.0/dist/vanilla-tilt.min.js` are both 8,938 bytes, sha256 `216dcaae75f9f980…`. **Identical.** (The site loads the UMD/IIFE dist build today.)
- **All three builds do the same two side effects at load time**: `window.VanillaTilt = VanillaTilt` and `VanillaTilt.init(document.querySelectorAll("[data-tilt]"))`. So `import 'vanilla-tilt'` still populates the global and still auto-inits, which preserves today's behaviour for the existing global call sites. (No element on this site carries `data-tilt`, so the auto-init is a no-op.)
- Init options used (four separate call sites, three distinct option sets — do not dedupe them without checking):
  - `js/script.js:259` cards: `{max:10, speed:7500, perspective:1250, scale:1.02, glare:false, "max-glare":0.3, gyroscope:true}`
  - `js/script.js:398` blog cards on home, `blog/blog-listing.js:143` blog cards on listing
  - `js/featured-carousel.js:193` carousel images
  - `blog/blog-post.js:183` post images: `{max:8, speed:6000, perspective:1200, scale:1, glare:true, "max-glare":0.15, gyroscope:true}`
  - Each is gated on `window.__styleAllowsTilt()` (`js/theme-bootstrap.js:645`).
- Import shape: `import VanillaTilt from 'vanilla-tilt'`.

### 3.7 highlight.js 11.9.0

- Registry: **HTTP 200**. Tarball `…/highlight.js-11.9.0.tgz`, unpackedSize 5,287,767, **1,535 files** (every language, ESM + CJS).
- Entry points: `main: "./lib/index.js"`; `exports` map with `"."` → `./es/index.js` (import) / `./lib/index.js` (require), `"./lib/core"` → `./es/core.js`, `"./lib/common"` → `./es/common.js`, `"./lib/languages/*"` → `./es/languages/*.js`, `"./styles/*"` → `./styles/*`, `"./scss/*"`. `sideEffects: ["./es/common.js","./lib/common.js","*.css","*.scss"]`.
- **Which CDN file the site loads:** `cdnjs…/highlight.js/11.9.0/highlight.min.js`, 121,727 bytes. This is the **COMMON** bundle, not "all languages".
  - Byte-identical to `cdn.jsdelivr.net/npm/@highlightjs/cdn-assets@11.9.0/highlight.min.js` (same 121,727 B, sha256 `837a6fa5b0c736b5…`). `@highlightjs/cdn-assets@11.9.0` exists on the registry (HTTP 200, 892 files, 4,213,237 B unpacked) and is the package cdnjs mirrors.
  - Language set extracted from the minified bundle (`grmr_<lang>` keys, 36 entries) and compared to `highlight.js@11.9.0/lib/common.js` (36 `languages/<x>` imports). **The two sets match exactly**:
    `bash, c, cpp, csharp, css, diff, go, graphql, ini, java, javascript, json, kotlin, less, lua, makefile, markdown, objectivec, perl, php, php-template, plaintext, python, python-repl, r, ruby, rust, scss, shell, sql, swift, typescript, vbnet, wasm, xml, yaml`.
- **The `github-dark.min.css` the site loads is byte-identical to the npm one**: `cdnjs…/highlight.js/11.9.0/styles/github-dark.min.css` and `cdn.jsdelivr.net/npm/highlight.js@11.9.0/styles/github-dark.min.css` are both 1,315 bytes, sha256 `9f208d022102b1d0…`. Import as `import 'highlight.js/styles/github-dark.min.css'`. This satisfies intent §4.6's "keep the github-dark look, do not switch to Shiki".
- **`import hljs from 'highlight.js'` pulls ALL languages** (`lib/index.js` / `es/index.js`). To match today's payload exactly, either `import hljs from 'highlight.js/lib/common'` (the same 36) or, better, `highlight.js/lib/core` + explicit `highlight.js/lib/languages/<x>` registrations.
- **Every language used by the site's posts is in the common set** and in the npm package:

  | Fence lang | Count | In common bundle | Files |
  |---|---|---|---|
  | `python` | 20 | yes | `autoencoders-1.md` (8), `autoencoders-2.md` (12) |
  | `swift` | 9 | yes | `embedded-swift-agent.md` |
  | `typescript` | 2 | yes | `helm.md` |
  | `bash` | 2 | yes | `helm.md`, `toolbelt.md` |
  | `json` | 1 | yes | `toolbelt.md` |
  | `javascript` | 1 | yes | `arena-freshness.md` |
  | `c` | 1 | yes | `embedded-swift-agent.md` |
  | `mermaid` | 2 | n/a | `toolbelt.md` — intercepted at `blog/blog-post.js:21-23` before hljs |

  A minimal core build needs 7 language registrations: `bash, c, javascript, json, python, swift, typescript`.
- **No language-less fences.** 38 bare ` ``` ` occurrences vs 38 language-tagged openers, matched per file (arena-freshness 1/1, autoencoders-1 8/8, autoencoders-2 12/12, embedded-swift-agent 10/10, helm 3/3, toolbelt 4/4). So `hljs.highlightAuto` at `blog/blog-post.js:27` is never reached today, and auto-detect's dependency on the loaded language set is not a live parity risk. It **would** become one if a future post ships a bare fence and the build ships a 7-language core instead of the 36-language common set. Shipping `lib/common` removes that hazard entirely.
- Site usage: `hljs.getLanguage(lang)` and `hljs.highlight(text, {language: lang}).value` at `blog/blog-post.js:24-25`; `hljs` class on `<pre><code>` for the theme CSS.
- Latest on npm is 11.12.0 — stay pinned.

### 3.8 marked 18.0.5

- Registry: `curl https://registry.npmjs.org/marked/18.0.5` → **HTTP 200**. Tarball `…/marked-18.0.5.tgz`, unpackedSize 450,269, 12 files.
- 18.x versions on npm: `18.0.0 … 18.0.11`. **`dist-tags.latest` is 18.0.11**, so 18.0.5 is not the newest 18.x. It exists and is installable.
- Entry: `main: "./lib/marked.esm.js"`, `module: "./lib/marked.esm.js"`, `browser: "./lib/marked.umd.js"`, `types: "./lib/marked.d.ts"`, `exports: {".": {"types": …, "default": "./lib/marked.esm.js"}}`.
- **The CDN URL the site uses has no npm counterpart.** `blog/post.html:21` loads `cdn.jsdelivr.net/npm/marked@18.0.5/lib/marked.umd.min.js` (42,858 B) — but the npm package contains only `lib/marked.esm.js` (42,042 B), `lib/marked.umd.js` (42,921 B) and their maps. `unpkg.com/marked@18.0.5/lib/marked.umd.min.js` → **HTTP 404**, and the unpkg `?meta` listing for `/lib/` shows only the four `.esm/.umd` + `.map` files. jsDelivr minified it on the fly.
  - Consequence: "serve verbatim from `public/`" for marked means copying `lib/marked.umd.js` (unminified) or re-minifying. There is no byte-identical option. This is a point in favour of just bundling the ESM.
- `browser` field means a bundler targeting the browser could resolve `marked` to the UMD build; Vite honours `browser` by default for the `browser` target. Force the ESM with an explicit path if that matters: `import { marked } from 'marked'` resolves via `exports["."].default` → `lib/marked.esm.js` regardless, because `exports` wins over `browser`.
- Globals: the UMD build sets `window.marked` (namespace object with `marked`, `parse`, `use`, …). The ESM build sets nothing.
- Config/extensions used, all at `blog/blog-post.js:4-30`: `marked.use({ gfm: true, breaks: false, renderer: { link, image, code } })`, then `marked.parse(body)` at `:171`. The three renderer overrides use the **marked v5+ object-argument signature** (`link({href, title, tokens})`, `image({href, title, text})`, `code({text, lang})`) and call `this.parser.parseInline(tokens)`. That signature is stable across 18.x, so the same code works identically whether marked runs at build time or in the browser.
- Import shape: `import { marked } from 'marked'`.
- Note for §4.6: if posts prerender, marked runs at build time in Node and `blog-post.js`'s renderer overrides must move to the Astro side. Astro's own Markdown pipeline is remark, not marked — using it instead would change the emitted HTML (different id-slugging, different escaping, different `<a>`/`<img>` markup). Keeping marked with these exact renderer overrides is the parity-safe route.

### 3.9 mermaid 11.15.0

- Registry: **HTTP 200**. Tarball `…/mermaid-11.15.0.tgz`, **unpackedSize 76,342,428 bytes (72.8 MiB), 888 files**, of which 428 are `dist/chunks/…` totalling 39,870,160 bytes. 21 runtime dependencies including `d3`, `katex`, `cytoscape`, `cytoscape-fcose`, `cytoscape-cose-bilkent`, `roughjs`, `dompurify`, `dagre-d3-es`, `@iconify/utils`, `es-toolkit`, `marked ^16.3.0`, `stylis`, `khroma`, `@upsetjs/venn.js`, `@mermaid-js/parser`.
- Entry: **no `main`**. `module: "./dist/mermaid.core.mjs"`, `types: "./dist/mermaid.d.ts"`, `exports: {".": {"types": …, "import": "./dist/mermaid.core.mjs", "default": "./dist/mermaid.core.mjs"}, "./*": "./*"}`.
- Relevant dist files: `mermaid.core.mjs` 48,233 B (bundler entry, externalises all deps), `mermaid.esm.mjs` 60,282 B and `mermaid.esm.min.mjs` 28,185 B (self-hosting ESM entries that lazy-load from `dist/chunks/`), `mermaid.js` 7,632,684 B (UMD), **`mermaid.min.js` 3,312,967 B (UMD — this is what the site loads)**.
- The `"./*": "./*"` export means `import 'mermaid/dist/mermaid.esm.min.mjs'` is legal, and so is fetching any dist file for `public/`.
- Site initialization, `blog/post.html:27-57` (inline, synchronous, before `</head>`): `mermaid.initialize({ startOnLoad: false, theme: 'base', themeVariables: {darkMode:true, background, primaryColor, primaryTextColor, primaryBorderColor, lineColor, nodeTextColor, mainBkg, nodeBorder, edgeLabelBackground}, flowchart: {curve:'basis', padding:16} })`. All ten theme variables are read live from CSS custom properties (`--secondary`, `--text`, `--neutral-gray`) that `theme-bootstrap.js` has already set on `<html>`, with hardcoded fallbacks `#2c2c2c` / `#e6f1ff` / `#a2a2a3`. Rendering is triggered by `mermaid.run({ nodes: contentEl.querySelectorAll('.mermaid') })` at `blog/blog-post.js:172`.
- Only **one post** uses mermaid (`blog/posts/toolbelt.md`, 2 diagrams). It is 3.3 MB shipped to every post page today, including the 11 posts that have no diagram. Making it lazy is a strict improvement and invisible to the eye as long as it still renders.
- Latest is 11.17.2 — stay pinned.

### 3.10 Font Awesome 6.5.1

- CDN URL used: `https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css` (102,641 B) on four pages.
- npm: `@fortawesome/fontawesome-free@6.5.1` → **HTTP 200**. Tarball `…/fontawesome-free-6.5.1.tgz`, unpackedSize 18,089,879 (17.3 MiB), 2,126 files. `main: "js/fontawesome.js"`, `style: "css/fontawesome.css"`. Zero dependencies.
- Byte parity: `cdnjs…/font-awesome/6.5.1/css/all.min.css` and `cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.5.1/css/all.min.css` are both 102,641 bytes, sha256 `c22cfb6520a7fdbb…`. **Identical.**
- Webfont paths inside that CSS are relative: `url(../webfonts/fa-solid-900.woff2)`, `fa-regular-400.woff2`, `fa-brands-400.woff2`, `fa-v4compatibility.woff2` (plus `.ttf` for each). Serving verbatim means copying **`css/all.min.css` AND the `webfonts/` directory** at the same relative depth. Bundling via `import '@fortawesome/fontawesome-free/css/all.min.css'` lets Vite rewrite those `url()`s to hashed assets (filenames change, rendering does not).
- Complete inventory of FA classes on the site, all confirmed present in the free `all.min.css`:

  | Class | Where |
  |---|---|
  | `fa-solid fa-palette` | `js/nav-config.js:29` (mobile nav Theme item) |
  | `fab fa-linkedin` | `js/nav-config.js:50` |
  | `fa-brands fa-x-twitter` | `js/nav-config.js:51` |
  | `fab fa-facebook-messenger` | `js/nav-config.js:52` |
  | `fas fa-user-circle` | `js/nav-config.js:54` |
  | `far fa-calendar-alt` | `js/nav-config.js:55` |
  | `fa-solid fa-chevron-down` | `js/nav-config.js:104` (nav caret) |
  | `fa-regular fa-copy` | `blog/blog-post.js:100` (code copy button) |
  | `fa-solid fa-check` | `blog/blog-post.js:101` |
  | `fa-solid fa-lock` / `fa-lock-open` | `js/theme-cycler.js:463` |

- No FA glyph is injected via CSS `content:` and no site CSS declares `font-family: "Font Awesome …"`. `404.html` uses no icons at all.
- Latest is 7.3.1 — stay pinned (6 → 7 renames classes).

### 3.11 Boxicons 2.0.9

- CDN URL used: `https://cdn.jsdelivr.net/npm/boxicons@2.0.9/css/boxicons.min.css` (63,781 B) on four pages. Already an npm path, so byte parity is definitional.
- npm: `boxicons@2.0.9` → **HTTP 200**. Tarball `…/boxicons-2.0.9.tgz`, unpackedSize 3,381,142, 1,549 files. `main: "./dist/boxicons.js"`, `style: "./css/boxicons.css"`.
- **`dependencies` are `react ^16.0.0`, `react-dom ^16.0.0`, `react-router-dom ^4.2.2`, `prop-types ^15.6.0`, `react-interactive ^0.8.1`, `@webcomponents/webcomponentsjs ^2.0.2`** — declared as runtime, not dev. Installing this package installs React 16 and a router. That alone argues for `public/`.
- Font paths inside the CSS: `url(../fonts/boxicons.{eot,svg,ttf,woff,woff2})`. Shipped sizes: woff2 102,988 B, woff 292,480 B, ttf 292,404 B, eot 292,572 B, svg 1,125,137 B.
- **Actually used: one icon.** `bx bx-envelope` at `js/nav-config.js:17` (mobile nav Email) and `:53` (socials Email). `.bx-envelope:before` is present in the CSS (verified). No other `bx-*` class appears anywhere in HTML, JS or CSS.
- So: ~63 KB CSS + ~103 KB woff2 to render one envelope, on four pages. **Cleanup-pass candidate** (swap for `fa-envelope`, which is already in the FA sheet the same pages load, and drop Boxicons entirely). Per intent §7 that is out of scope for spec 1 — parity first, note it and move on.
- Latest is 2.1.4 — stay pinned.

### 3.12 Calendly (stays external)

- Loads: `https://assets.calendly.com/assets/external/widget.css` (`index.html:22`, `blog/index.html:21`) and `https://assets.calendly.com/assets/external/widget.js` (`index.html:35`, `blog/index.html:31`, both `type="text/javascript" async`).
- **Popup, not inline.** `js/nav-config.js:135-140` binds a click handler to every `.calendly-link` that calls `Calendly.initPopupWidget({ url: calendlyUrl() })`.
- `calendlyUrl()` (`js/nav-config.js:37-48`) builds `https://calendly.com/dawsonamf/30min` plus query params derived at click time from live CSS custom properties (`--bg`, etc.) so the popup's colours follow the active theme. That coupling has to survive the migration.
- `.calendly-link` elements only exist on home and the blog listing: `index.html:275` (the "schedule a call" text link) and the socials anchors rendered into `#socials-list` / `#blog-socials-list` / `.contact-menu` (`js/nav-config.js:59, 65-93`). `blog/post.html` and `privacy/` have `.static-menu-mobile` but no socials container and no calendly item in `MOBILE_NAV_LINKS`, so no orphaned handler fires there despite those pages not loading the widget.
- No npm work. These two URLs stay verbatim in the themed page heads. Note that `widget.js`/`widget.css` are **unversioned** — Calendly can change them under us; that is the status quo and the intent accepts it.

### 3.13 Per-post libraries (Plotly, js-yaml)

- **Plotly 2.27.0.** Loaded as `https://cdn.plot.ly/plotly-2.27.0.min.js`, 3,598,158 B, by two posts (`gemma4-heretic-ara.md:4`, `metr-doubling.md:4`) plus the not-yet-published `docs/planned-posts/ai-job-market.md:4`.
  - npm equivalent: `plotly.js-dist-min@2.27.0` → **HTTP 200**, tarball `…/plotly.js-dist-min-2.27.0.tgz`, unpackedSize 3,601,159, `main: "plotly.min.js"`. Version matches exactly.
  - **Byte-identical**: `cdn.plot.ly/plotly-2.27.0.min.js` and `cdn.jsdelivr.net/npm/plotly.js-dist-min@2.27.0/plotly.min.js` both sha256 `7f4930eba8f8541dbec28dca5bd5f787f8eef1cde0369ac9657b70bed230b3e0`.
  - Latest is 4.0.0 — stay pinned; the chart code uses 2.x APIs (`Plotly.update`, `Plotly.restyle`, `plotly_relayout`).
- **js-yaml 4.2.0.** `https://cdn.jsdelivr.net/npm/js-yaml@4.2.0/dist/js-yaml.min.js` (43,461 B), one post (`metr-doubling.md:4`). npm `js-yaml@4.2.0`: `module: "./dist/js-yaml.mjs"`, `exports: {".": {"import": "./dist/js-yaml.mjs", "require": "./index.js"}}`. Already an npm URL, so byte parity is definitional. Sets `window.jsyaml` as a classic script.
- **Recommendation: keep per-post assets verbatim in `public/`, do not bundle them.** Reasons: (a) they are loaded imperatively and sequentially by `loadPostScripts`, and the local asset scripts read the globals the CDN scripts just installed (`Plotly`, `jsyaml`) — bundling breaks that contract; (b) they are classic scripts, not modules, with top-level `var`/IIFE scoping; (c) `.github/workflows/refresh-chart-data.yml` rewrites `blog/posts/assets/*.json` on a schedule and pushes, so those paths must stay stable and buildable without a rebuild of anything else; (d) intent §7 says per-post assets stay. Bundling them buys nothing and risks a lot.
  - **But**: their data URLs are page-relative (below, §5.1) and must be fixed if posts move to `/blog/<id>/`.

### 3.14 Lenis (future `mono` theme only)

- Package `lenis`, latest **1.3.26**. `@studio-freight/lenis` is deprecated on npm with the message: "The '@studio-freight/lenis' package has been renamed to 'lenis'. Please update your dependencies."
- `lenis@1.3.26`: `main`/`module`/`unpkg` all `./dist/lenis.mjs`, `types: "./dist/lenis.d.ts"`, unpackedSize 457,528, 26 files. `exports` also offers `./react`, `./vue`, `./nuxt`, `./snap`, and `./dist/*`. `peerDependencies` are `vue`, `react`, `@nuxt/kit` — all optional in practice (only needed for the framework subpaths); npm 7+ will try to auto-install peers, so add `--omit=peer` or expect React/Vue in the tree unless the peers are marked optional. **Unverified** whether they are declared `peerDependenciesMeta.optional`; check at install time.
- CSS: `lenis/dist/lenis.css` (the `docs/mono-prototype.html:32` prototype loads `cdn.jsdelivr.net/npm/lenis@1.3.21/dist/lenis.css`).
- Import: `import Lenis from 'lenis'; import 'lenis/dist/lenis.css';`
- Prototype pins: `docs/mono-prototype.html` uses lenis **1.3.21** and gsap **3.15.0** (`:591-595`, ScrollTrigger + CustomEase + MorphSVGPlugin); `docs/cream-prototype.html:716-719` uses gsap **3.13.0** (ScrollTrigger + ScrollSmoother + SplitText). Both plugin sets are in the free npm package (§3.2).

### 3.15 Google Fonts (stay as links)

- **Not in any page `<head>`.** Injected pre-paint by `js/theme-bootstrap.js:715`, which concatenates `entry.fonts` with `/css/themes/theme-base.css` and `entry.css` and appends `<link rel="stylesheet" data-style-asset="1">` for each. Because `theme-bootstrap.js` is a blocking `<head>` script, these links block first paint — deliberately (comment at `:712-714`).
- 14 distinct `fonts.googleapis.com/css2?…` URLs across the registry: `studio` (:67), `brutalist` (:115), `broadsheet` (:136), `field-notes` (:158), `blueprint` (:178), `doodle` (:207), `wheatpaste` (:287), `bauhaus` (:311), `chinoiserie` (:336), `banknote` (:366), `gallery` (:422), `miami-deco` (:523), `neo-pop` (:558), `marquee` (:631). Four more are inside commented-out retired entries (`space`, `vapor`, `wanted`, `constructivist`).
- **`default` and `grid` have no `fonts` array.** Default falls through to `css/styles.css:14-16` (`--font-body: sans-serif`, `--font-mono: 'SF Mono', monospace`); `grid` sets `'Helvetica Neue', Helvetica, Arial` in `tokens` with an explicit comment calling itself "the only zero-webfont-payload skin". A default page loads zero webfonts today — that must stay true (intent §3.3).
- No `preconnect`/`dns-prefetch` to `fonts.googleapis.com` or `fonts.gstatic.com` anywhere on the main site (the prototypes in `docs/` do have them; the shipped site does not). Adding them would be a perf win but is a deviation, not parity.
- No `@import` in any site CSS.
- No npm work required. In Astro these become `<link>` tags emitted per theme.

---

## 4. STEP 3 — Standalone subsites

These are copied verbatim into `public/subsites/…` per intent §4.8. Listed here only for their external loads and path assumptions.

### 4.1 `12years/` (3 files: `index.html`, `now.jpeg`, `then.jpeg`)

| URL | Line | Load |
|---|---|---|
| `https://fonts.googleapis.com` (preconnect) | `12years/index.html:7` | `<link rel=preconnect>` |
| `https://fonts.googleapis.com/css2?family=Cormorant+Garamond:…&family=EB+Garamond:…&display=swap` | `:8` | `<link>` blocking |
| `https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js` | `:9` | sync |
| `https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/ScrollTrigger.min.js` | `:10` | sync |

- **A third gsap version (3.12.5)** lives here, separate from the site's 3.9.1 and any future 3.15.0. Because this page is copied verbatim and loads from cdnjs, it needs no npm entry and no alias. Leave it alone.
- Path assumptions: only page-relative (`then.jpeg`, `now.jpeg` at `:850-851`). No absolute `/…` references. **Safe to relocate to any depth.**

### 4.2 `embedded-swift-agent/` (4 files: `index.html`, `agent.js`, `EmbeddedSwiftAgent.wasm`, `embedded-swift-agent-context.md`)

| URL | Line | Load |
|---|---|---|
| `https://cdn.jsdelivr.net/npm/@xterm/xterm@6.0.0/css/xterm.min.css` | `index.html:7` | `<link>` |
| `https://cdn.jsdelivr.net/npm/@xterm/xterm@6.0.0/lib/xterm.min.js` | `index.html:274` | sync |
| `https://cdn.jsdelivr.net/npm/@xterm/addon-fit@0.11.0/lib/addon-fit.min.js` | `index.html:275` | sync |
| `https://cdn.jsdelivr.net/npm/@bjorn3/browser_wasi_shim@0.4.2/+esm` | `agent.js:18` | bare ESM `import` |

- `agent.js` is a **native ES module** with a bare `https://…/+esm` import. If Astro/Vite ever processes this file it will try to resolve or externalise that import. Keep it in `public/` where Vite does not touch it.
- Path assumptions: `fetch("embedded-swift-agent-context.md")` (`index.html:488`) and `wasmUrl: "EmbeddedSwiftAgent.wasm"` (`index.html:495`) are **page-relative**. Safe to relocate, but the three files must stay in the same directory. Serve `.wasm` with `application/wasm` (GitHub Pages does).
- These libraries are **not** in intent §4.12's pinned list and need no npm entries.

### 4.3 `lexchat/` (2 files)

- `lexchat/index.html:16` iframes `https://dawsonamf-lexchat.hf.space`. That is the only external load; no third-party CSS or JS.
- **Path assumptions that break on relocation**: `../resources/favicon-32.png` (`:7`), `../resources/apple-touch-icon.png` (`:8`), `../css/theme-cycler.css` (`:10`), `../js/theme-bootstrap.js` (`:11`), `../js/theme-cycler.js` (`:17`). It also depends on `theme-bootstrap.js`'s **absolute** `/css/themes/*.css` paths (`js/theme-bootstrap.js:68…632, 715`). Per §4.8 lexchat becomes an Astro utility page, so this resolves itself — but it means lexchat cannot simply be dropped into `public/subsites/` the way the other two can.

### 4.4 Absolute URLs that need redirects

`js/blog-data.js:29` → `/embedded-swift-agent/`, `js/blog-data.js:93` → `/lexchat/`. Both are project-card links in `FEATURED_PROJECTS`. Under §4.8's new paths these must either be updated in the content model or covered by the redirects.

---

## 5. STEP 4 — Risks, and bundle-vs-verbatim per library

### 5.1 Things that would change rendered output or behaviour

| # | Risk | Severity | Detail |
|---|---|---|---|
| R1 | **Per-post chart data URLs are page-relative** | **High** | `blog/posts/assets/cohorts-chart.js:642, 657, 663, 682` fetch `posts/assets/*.json`. Resolved against `/blog/post.html` today. Prerendering posts at `/blog/<id>/` (§4.6) makes them resolve to `/blog/<id>/posts/assets/…` → 404 → blank charts. Same class of problem for the frontmatter values `posts/assets/heretic-ara-charts.js` etc., which `loadPostScripts` injects verbatim. Fix: rewrite to root-absolute `/blog/posts/assets/…` in both the asset JS and the frontmatter, or emit a `<base>`. Must be in spec 1, and must be in the parity harness (a post page that renders a chart). |
| R2 | **`import hljs from 'highlight.js'` ships all ~190 languages, not 36** | **Medium** | Not a *rendering* change for the 7 languages in use, but a large payload regression and a behaviour change for `highlightAuto` (which is dead today, §3.7). Use `highlight.js/lib/common` for exact parity, or `lib/core` + 7 explicit registrations for the lean version. |
| R3 | **`import mermaid from 'mermaid'` resolves to `mermaid.core.mjs`, a different artifact** | **Medium** | The site ships the self-contained 3.3 MB UMD; the npm `exports` entry externalises 21 deps for the bundler to resolve. Vite's build of that graph is not the same code. Diagram output should match (same version, same renderer), but the `theme: 'base'` + `themeVariables` path and `flowchart.curve: 'basis'` deserve an explicit visual check on `toolbelt.md`. |
| R4 | **marked has no minified npm artifact** | **Low** | §3.8. Only a payload/serving question, not a rendering one — the source is the same. |
| R5 | **jQuery's global is not set by the ESM import** | **Medium** | `js/script.js` calls bare `$(…)` at module top level, and `jquery-ui`'s non-AMD branch reads `jQuery` off the global. Order matters: assign `window.jQuery = window.$ = $` *before* importing jQuery UI and before any `$()` call. Get this wrong and the smooth scroll silently dies (or throws), which is exactly the kind of thing an eyeball QA pass misses. |
| R6 | **`vanilla-tilt` auto-inits `[data-tilt]` at import time** | **Low** | True of every build including the current CDN one, and no element carries `data-tilt`, so behaviour is unchanged. Worth knowing before someone "cleans up" the side effect. |
| R7 | **`boxicons` pulls React 16 into `node_modules`** | **Medium (supply chain, not rendering)** | §3.11. Two files are needed (`css/boxicons.min.css`, `fonts/boxicons.woff2`). Copying them beats installing a package that declares a router as a runtime dependency. |
| R8 | **Font Awesome webfont paths are relative to `css/`** | **Low** | Copying `all.min.css` without `webfonts/` at `../webfonts/` gives tofu boxes for all ten icons. Copy both, or let Vite rewrite the `url()`s. |
| R9 | **AOS load timing differs between pages today** | **Low but real** | `defer` on `index.html:33`, synchronous on `blog/index.html:29`; `AOS.init()` (defaults) on home, `AOS.init({offset: 50})` on the listing. A naive "one shared AOS import" flattens both differences. The `offset` difference is visible: elements trigger 50px earlier on the listing. |
| R10 | **Calendly's widget is unversioned** | **Low, pre-existing** | `assets.calendly.com/assets/external/widget.{js,css}`. Unchanged by the migration; noted so nobody blames the rewrite when Calendly ships a restyle. |
| R11 | **`marked` at build time vs Astro's remark** | **Medium** | Astro renders `.md` with remark by default. Swapping pipelines changes emitted HTML (heading ids, escaping, `<a>`/`<img>` attributes, the `.text-link` / `.blog-image` classes the site's CSS targets). Keep marked with the exact renderer overrides from `blog/blog-post.js:4-30`. |
| R12 | **Two gsap copies share nothing** | **Low today** | Separate registries and `gsap.core` singletons under the `npm:` alias (§3.2). Harmless while the default theme calls neither, but the eventual cleanup (deleting 3.9.1) should be sequenced *before* anyone tries to share a timeline across themes. |
| R13 | **Three gsap versions in the repo after migration** | **Informational** | 3.9.1 (default, unused), 3.12.5 (`12years/`, cdnjs, verbatim), 3.15.0 (future themes). Only two are npm deps. |
| R14 | **`docs/planned-posts/ai-job-market.md` assets are live but its post is not** | **Low** | `job-market-chart.js`, `cohorts-chart.js` and three JSONs sit in `blog/posts/assets/` and are refreshed weekly by CI, but no published post loads them. Do not garbage-collect them during the migration. |

Explicitly **not** risks: differing minifier output (jQuery UI's one escaped slash, marked's on-the-fly minification) — same semantics, same render.

### 5.2 Recommendation per library for spec 1 (parity first)

| Library | Recommendation | Why |
|---|---|---|
| gsap 3.9.1 | **Bundle via npm** (`import 'gsap'`), or drop | Byte-identical, zero call sites. Nothing observable either way. |
| gsap 3.15.0 (future) | **Bundle via npm alias** `"gsap-next": "npm:gsap@3.15.0"` | Per-theme code splitting is the whole point of §3.3; plugins are ESM with clean subpaths. |
| jquery 3.6.0 | **Bundle via npm**, then `window.jQuery = window.$ = $` | Byte-identical; the global assignment is one line and makes every existing call site work unchanged. |
| jQuery UI 1.12.1 | **Bundle via npm**: `import 'jquery-ui-dist/jquery-ui.min.js'` | One-byte-different from the CDN file, so parity is a non-argument. `jquery-ui/ui/effect.js` (214 KB smaller) is the better answer if the spec is willing to defend it; hand-rolling the 4-line easing is the cleanup pass, not this one. |
| aos 2.3.1 | **Bundle via npm** + `import 'aos/dist/aos.css'` | Already an npm artifact; UMD interops cleanly. Preserve the per-page `init` options and the defer/sync split. |
| vanilla-tilt 1.7.0 | **Bundle via npm** | Byte-identical dist; every build sets `window.VanillaTilt`, so the four global call sites keep working. |
| highlight.js 11.9.0 | **Bundle via npm**, `highlight.js/lib/common` + `highlight.js/styles/github-dark.min.css` | `lib/common` is the exact 36-language set the CDN ships. The CSS is byte-identical. Narrow to `lib/core` + 7 languages only after confirming no bare fences ever ship. |
| marked 18.0.5 | **Bundle via npm** (`import { marked } from 'marked'`) | No minified npm artifact exists, so verbatim serving is worse. Keep the three renderer overrides verbatim. |
| mermaid 11.15.0 | **Serve verbatim from `public/`** via a lazily-injected `<script src="/vendor/mermaid.min.js">` | Exactly the 3.3 MB UMD that ships today, so zero rendering risk; keeps a 73 MB package and 21 transitive deps out of the build graph; and lazy-loading it only on posts that contain `.mermaid` is a large win that the eye cannot detect. (Bundling `mermaid.core.mjs` is the "clean" answer but is a different artifact — defer to the cleanup pass.) |
| Font Awesome 6.5.1 | **Bundle via npm**: `import '@fortawesome/fontawesome-free/css/all.min.css'` | CSS is byte-identical; Vite rewrites the webfont `url()`s correctly. Verbatim `public/` copy of `css/` + `webfonts/` is an equally safe fallback. |
| Boxicons 2.0.9 | **Serve verbatim from `public/`** (`boxicons.min.css` + `fonts/boxicons.woff2`) | The npm package declares React 16 + react-router as runtime deps. Two files vs a package install is not a close call. Flag for cleanup: one icon (`bx-envelope`) that FA already covers. |
| Calendly | **External, unchanged** | Per intent §4.12. Keep both tags on the two pages that have `.calendly-link`, and keep the theme-derived `calendlyUrl()` coupling. |
| Plotly 2.27.0 | **Serve verbatim** (leave the `cdn.plot.ly` URL in frontmatter) | Byte-identical to `plotly.js-dist-min@2.27.0`, so npm buys nothing; the post assets are classic scripts reading the `Plotly` global via the sequential `loadPostScripts` chain. |
| js-yaml 4.2.0 | **Serve verbatim** (leave the jsDelivr URL) | Same reasoning; one post, reads the `jsyaml` global. |
| Per-post `assets/*.js` and `*.css` | **Serve verbatim from `public/`** | Classic scripts, global-dependent, sequentially loaded, and CI rewrites their JSON weekly. **But fix the relative data URLs (R1).** |
| Lenis 1.3.26 (future) | **Bundle via npm** + `import 'lenis/dist/lenis.css'` | Clean modern ESM package; belongs to one theme's chunk. Check the React/Vue peer deps at install. |
| Google Fonts | **Links, unchanged** | Per intent §4.12. Emit per theme; `default` and `grid` emit none. |
| `12years/`, `embedded-swift-agent/` | **Verbatim `public/subsites/`**, no npm entries | Both use only page-relative internal paths, so they relocate cleanly. `agent.js`'s bare `+esm` import must stay outside Vite's reach. |

---

## 6. Open questions / unverified

1. **Are lenis's `vue`/`react`/`@nuxt/kit` peer dependencies marked optional?** Not checked. If they are not, `npm i lenis` may pull React and Vue into the tree. Verify with the `peerDependenciesMeta` field before adding it (mono theme only, not spec 1).
2. **Does Vite's default `resolve.mainFields` pick `marked`'s `browser` field over `exports`?** `exports` should win under Node resolution, but Vite's behaviour with a `browser` field present is worth a one-line check at build time rather than a guess. Either build is the same source.
3. **Does `import 'jquery-ui-dist/jquery-ui.min.js'` under Vite actually reach the globals branch?** It should (no `define` in a Vite module), but the file also probes `typeof define === "function" && define.amd` — verify empirically once, because a silent AMD-shim would leave `$.easing.easeInOutQuad` undefined and jQuery would fall back to `swing` **without throwing**. That is a silent parity break the eye would probably miss.
4. **What exactly does `mermaid.run()` produce differently, if anything, between the UMD and the bundled `core.mjs` build at the same version?** Assumed identical; not verified by rendering. If the spec chooses to bundle, `blog/posts/toolbelt.md` must be in the visual-diff set.
5. **Astro's handling of a synchronous inline `<script>` that reads computed CSS custom properties before `mermaid.run()`** (`blog/post.html:27-57`). Astro processes inline scripts by default; `is:inline` preserves them verbatim. Which one preserves the current pre-paint ordering with `theme-bootstrap.js` is a design decision for the engine spec, not a fact I can look up.
6. **Whether `docs/planned-posts/ai-job-market.md` should migrate as a draft post** or stay in `docs/`. Its assets are live in `blog/posts/assets/` and CI refreshes them weekly. Out of scope here; flagged so it is not lost.
7. **`highlight.js` at build time vs client time.** Intent §4.6 says posts prerender. `hljs.highlight()` in Node produces the same HTML as in the browser (same package, no DOM dependency), so build-time highlighting is safe — but the `hljs` class names and the `github-dark` CSS must both survive, and the copy-button injection (`blog/blog-post.js:90-112`) is DOM-time and stays client-side. Not verified by running it.
