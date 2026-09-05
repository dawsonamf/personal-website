# Thermo-nuclear code quality review: Spec 1 (Astro migration, prose file, theme engine, parity harness, deploy)

Reviewer: Fable 5.1, single reviewer, findings only. Spec under review: `docs/intents/2026-09-05-theme-engine-rewrite/spec-1-migration-engine-parity.md` (902 lines), judged against `intent.md` and the current code on `main` @ `0f196d0`. Nothing in the repo was touched. Code evidence comes from five read-only walks of the current code (theme runtime globals, home behavior scripts, blog pipeline, page heads, skin CSS); every `file:line` below is from those walks.

Frame: the "PR" is the proposed codebase in spec §3.1-§10. "Preserve behavior" is the parity contract (intent §3.2, spec §9, the §15 allow-list). Intent §4 decisions are treated as ADRs; no finding below needs one reopened. D1-D31 are the author's choices and are challenged where the evidence says so. Each finding says whether it is spec 1 territory or belongs to intent §7's cleanup pass.

## Summary

The bones are right: one typed registry, one Shell emitting `<html>`, theme in the path, dock rendered at build, `href()` as the only link writer, marked + highlight.js at build. The spec then undercuts its own premise in four places. It keeps a runtime copy of the registry as seven `window.__*` globals on every page (F1); it ports the theme-to-HTML mapping twice (F2); it keeps runtime DOM construction and invents `data-*` bridges to feed it for things that are pure functions of build data (F3); and it threads a `pageType` flag through the Shell and a per-page-type `Head.astro` (F4). Each has a code-judo move that deletes the machinery instead of tidying it, and each stays inside the parity contract. Verdict at the end: do not approve yet; presumptive blockers named.

---

## Findings (skill priority order)

### 1. Structural code-quality regressions

#### F1. `ThemeRuntime` rebuilds the bootstrap's runtime registry on all 240 pages. Delete it.

Spec: D4 (line 51), §3.3 lines 158-161 (three build-to-runtime bridge mechanisms), §5.1 lines 370-371 ("Client code never imports this module; it reads the runtime blob"), §5.4 lines 420-435, §5.5 lines 448-452, §8 line 572, D29 line 76 (the page scan asserts "one `__THEME_REGISTRY`").

Evidence:
- The three helper bodies the spec copies verbatim (lines 429-431) are pure lookups of the active entry: `!(entry && entry.flags && entry.flags.tilt === false)` (`js/theme-bootstrap.js:648`), `(entry && entry.typing) || 'cursor'` (`:656`), `(entry && entry.typingDelete) || 'char'` (`:666`). `data-no-tilt` is stamped from the same test at `:706`, so `__styleAllowsTilt()` is already `!html.hasAttribute('data-no-tilt')`.
- Consumers outside the cycler: five tilt gates (`js/script.js:257, :397`, `js/featured-carousel.js:190`, `blog/blog-post.js:182`, `blog/blog-listing.js:142`) and two typing-mode reads (`js/typing-engine.js:99, :109`). Nothing else on the site reads a theme global.
- `__THEME_REGISTRY` and `__THEME_ORDER` have one reader, `js/theme-cycler.js:9-10`. For non-active themes it needs `{id, label, colors, --font-heading, fonts}` (`:287-305`, `:335-349`, `:374-377`), which it already serialises into `<li style="--tc-row-*"><a data-id href>` rows (`:302-308`), rows the spec now renders at build (§5.4 lines 411-412, §15.9). For the active theme it needs `colors` and `polarity` (`:167-174`), six neutral tokens (`:208`, `:214-221`) and the `random` profile (`:102-103`; three themes have one). `DEFAULT_COLORS` is `REGISTRY.default.colors` (`:13`).
- `__THEME_CYCLER_ENABLED` is read by `theme-cycler.js:5` and `nav-config.js:27-29`; nav rendering moves to build and the constant is `true` at `theme-bootstrap.js:8`. `__PAGE_PATH` is new (line 428) and exists only so `switchStyle` can rebuild a URL the rendered rows already carry (lines 449-450).

Why it fails the bar: D4 says the theme is in the path "so nothing needs resolving at runtime" and that it "removes a blocking script", then adds a ~7 KB pre-paint `is:inline` script to every page carrying data the same page already carries as `<html>` attributes and `--tc-row-*` properties. That is a dual carrier of one fact, an untyped `window.__*` namespace as the build/runtime contract, and the stated reason (line 421: "so the behavior scripts and the cycler read the same names") is a compatibility shim for files §8 edits anyway. This is the "generic mechanism that hides a simple data shape" the skill names.

Restructure (every step is output-identical under intent §4.13; spec 1 territory because the blob is new machinery this spec invents):
1. `<html>` gains `data-typing` and `data-typing-delete` beside `data-no-tilt`/`data-still`; `typing-engine.js:99/:109` read `document.documentElement.dataset` with the same fallbacks; the five tilt gates become `!document.documentElement.hasAttribute('data-no-tilt')`. Seven one-line edits. The two new attributes get the same normaliser/§15 treatment the spec already gives `--prose-*` (line 674, §15.10).
2. The build-rendered `#tc-presets` rows carry `data-id`, the `--tc-row-*` properties and `data-fonts` (JSON array); the active theme's `random` profile and six neutral tokens ride on the active row (or one `<script type="application/json">` inside `#tc-dock`). The cycler reads rows, not `REGISTRY`/`STYLE_ORDER`; `DEFAULT_COLORS` is the default row. These attributes need the same allow-list treatment the spec's own `data-*` dock strings (lines 451-452) already need.
3. `__PAGE_PATH` goes: `switchStyle(id)` navigates to the row's `href` (built by `href()` at build); `resetToDefault` uses the default row.
4. The `?style=` shim is a three-line `is:inline` `<StyleQueryShim />` the canonical page layouts include in their head on default-theme routes, with `THEME_IDS` inlined at build; `NotFound` does not include it (its own apply script handles `?style=`, D27). Keep the membership check: an unknown id is ignored today (`theme-bootstrap.js:693-696`).
5. `__THEME_CYCLER_ENABLED` is deleted; the cycler runs wherever `#tc-dock` exists.

Result: `ThemeRuntime.astro` and the "seven globals" contract disappear; the full registry ships on exactly one page, the 404 (F2); §3.3's three bridges become one rule ("a script reads `data-*` on the element it owns"). Changes: D4, D29 (scan for `#tc-dock`, `#tc-scrim`, `.tc-nav-item` only), §3.3 lines 158-166, §5.4 lines 420-435, §5.5, §8 rows for `typing-engine.js` (two lines, no longer verbatim), `theme-cycler.js`, `script.js`, `blog-*-client.js`; `harness/scripts.ts`; §15. D26's future pre-paint block for mono becomes that theme's own inline component, which is where it belonged anyway.

#### F2. Theme to `<html>` attributes + inline style + `<link>`s is implemented twice (Shell template and `apply.ts`). Make it one pure function.

Spec: D27 (line 74), §3.1 line 96, §3.3 lines 165-166, §5.4 lines 402-406 and 416-418 (Shell/ThemeAssets) versus lines 437-440 (`applyTheme` "stamps the attributes, sets tokens and ramp, and appends the links in the bootstrap's order"), §8 line 572, T3 line 772.

Evidence: today's mapping is one pure function of the entry: attributes `theme-bootstrap.js:703-706`, tokens `:707-711`, ramp `:764-774` (5 base + 95 steps named `--<role><step>` with no separator, `hsla(h,s%,l%,a%)` with `toFixed(0)`, no spaces, emitted for default too), links `fonts ++ ['/css/themes/theme-base.css'] ++ [css]` appended in that order (`:715-721`). The ramp format and `hexToHsl` are already duplicated verbatim in the cycler (`theme-cycler.js:24-40`, `:182-185`); the spec would make it three copies in two languages.

Why it fails: duplicate logic with one test. T3 byte-tests the build side against the T1 capture (line 772); the 404 side is checked by eye (T6, "apply their skins"). Drift in attribute order, `toFixed`, or link order surfaces only on a themed 404.

Restructure: `src/themes/apply.ts` exports `themeHtml(theme): { attrs: Record<string, string>; style: string; links: string[] }` (ramp inside it, or `ramp.ts` as its only import; still no other `src/` imports, so the 404 bundle stays small). `Shell.astro` spreads `attrs` on `<html>` and writes `style`; `ThemeAssets.astro` maps `links` to `<link data-style-asset="1">`; the 404 script sets the attributes, `style.cssText`, and appends the links. One implementation, one byte-equality test covering both paths. The cycler's third copy is cleanup-pass material (a classic script cannot import TS); say so in §8. Changes: §3.1 line 96, §5.4, T3.

### 2. Missed opportunities for dramatic simplification

#### F3. Runtime-built DOM that is a pure function of build data is kept at runtime and fed through new `data-*` bridges.

The spec's own rule (lines 149-151): "static markup for everything that depends only on data". Four places break it, and each invents a bridge to do so.

(a) Carousel dots "still built at load, their `aria-label` from `data-slide-label`" (§8 line 575). `js/featured-carousel.js:265-267` builds `<button class="fc-dot[ active]" data-index aria-label="Go to slide N">` from `FEATURED_PROJECTS.length`. Render them in `FeaturedCarousel.astro` with `carousel.goToSlide` substituted at build; the client keeps click-centering and scroll tracking (`:275-294`). Deletes the dots markup code and `data-slide-label`.

(b) `--ticker-run` / `--ticker-dur` "keep being set at runtime exactly as today" by `buildTickerRun` reading `data-tech` (§8 line 575; §9 settle line 654 waits on it). `buildTickerRun` (`:388-415`) is a pure function of the projects' tech lists: case-insensitive dedupe, `'✷ ' + t + ' '`, the pass repeated four times into the string (1520 characters today), duration `round(half.length / (402/46))` = `87s`; only marquee reads them (`css/themes/marquee.css:572`, `:584`). The chips are already visible `span.pill` elements in the same card (`:68`, `:88`), so `data-tech` is a second carrier of text the DOM already has. Compute both in the Home/Listing component (a ten-line port of `:392-414`) and emit them in `<html style>` beside the `--prose-*` properties D14 already puts there; delete `buildTickerRun`, `data-tech`, and settle's "`--ticker-run` non-empty" wait. Harness cost: normaliser rule 7 (lines 674-675) compares `<html style>` as a declaration map instead of verbatim-after-dropping-`--prose-*`; it already parses the string to drop those, so this is the same code plus a sort.

(c) Copy buttons: "the `button.code-copy-btn` markup verbatim" injected by `blog-post-client.js` (§7 lines 547-548). `blog/blog-post.js:90-112`: the markup (`:95-101`, `:110`) is static per `pre > code`; only the click (`:103-108`) is behavior. The marked `code` override the spec already ports (lines 531-535) can emit `<pre class="has-copy-btn"><code …>…</code><button class="code-copy-btn" aria-label=…>…</button></pre>`; the client delegates one click listener on `#post-content`. Deletes `addCopyButtons` and `data-copy-label`.

(d) Mermaid "lazily injecting the pinned CDN mermaid only when `.mermaid` exists" (§7 lines 549-550). Today the tag is unconditional (`blog/post.html:22`) and only `toolbelt.md:17, :27` has fences. The build knows whether the rendered body contains `class="mermaid"`: `BlogPost.astro` emits the `<script src>`, the `is:inline` initialize block, and a `mermaid.run()` call only for those posts. Same lean outcome as §15.8, no runtime loader.

Why it fails: each is a bridge (attribute + parser + DOM builder) where a template line would do, and each is a thing the harness must wait for. Spec 1 territory: the bridges are new. Changes: §3.3 lines 158-160, §7 lines 547-553, §8 line 575, §9 lines 654 and 674-675, T4/T5.

Not demanded: read time (`innerText` is layout-aware; keeping it client-side is the right parity call) and title/meta/JSON-LD (already at build).

#### F4. `pageType` on the Shell, a per-page-type `Head.astro`, and two owners for the FAB.

Spec: §5.2 lines 383-387 ("utility layouts get `PickerFab.astro`"), §5.4 line 400 (Shell props include `pageType`) and line 413 (Shell renders `<PickerFab />` "when the theme mounts nothing"), D29 line 76, D30 line 77, §6.2 lines 484-491 (`Head.astro` "writes today's tags by hand, per page type, in today's order"), §5.1 line 334 (`PageType` excludes utility pages) versus §5.2 lines 380 and 383 (utility pages still go through `layoutFor`).

Evidence: the six heads share an eight-tag spine and otherwise differ per page: canonical/OG only on home and listing (`index.html:8, 11-16`; `blog/index.html:8, 11-16`), Font Awesome/Boxicons on four of six, AOS/Calendly on two, gsap/jquery on home only (`index.html:30-32`), highlight.js/marked/mermaid plus the inline initialize block on the post only (`blog/post.html:19-22, 27-58`), and attribute drift (`aos.js` defer at `index.html:33`, sync at `blog/index.html:29`; same for `blog-data.js`, `featured-carousel.js`, `typing-engine.js`). A `Head.astro` that reproduces that "per page type" is a six-way conditional ladder in one component, today's copy-paste re-expressed as branches.

Why it fails: "when the theme mounts nothing" is a feature check the Shell cannot evaluate (it would have to inspect its own rendered slot); `pageType` is the flag that exists to drive it and the head switch; and §5.2 and §5.4 name different owners for the same element. Skill rule 2: one-off modes complicating a shared flow.

Restructure: each canonical layout (`Home`, `BlogListing`, `BlogPost`, `Privacy`, `NotFound`, `LexChat`, already one file per page type) writes its own head into the Shell's `head` slot, sharing one `Meta.astro` (charset, viewport, title, favicons); `Head.astro` is deleted. The Shell takes `picker: 'nav' | 'fab'` instead of `pageType`: canonical page layouts pass `'nav'` (their Nav renders the `.tc-nav-item`s), utility layouts pass `'fab'`, a structural layout passes whatever it chose. D29's scan (at least one `.tc-nav-item` per page) then catches a wrong prop mechanically. While there: collapse the §5.2 asset table (lines 375-381) to two facts, `canonical layout ⇒ theme-base.css (non-default)` and `theme.css ⇒ skin sheet`, so `ThemeAssets` takes `{ theme, canonical }` and the four-row rule disappears; and say that utility layouts import their canonical layout directly rather than calling `layoutFor` with a type it does not accept. Changes: §3.1 line 99, §5.2, §5.4 lines 400 and 411-414, §6.2, T4.

#### F5. The masthead sequences store typing choreography in the prose file; store the strings and derive the steps.

Spec: §4.1 lines 242-244 (sequences as `{ type }` / `{ delete: 14 }` steps), schema rule 5 lines 275-276 ("a `delete` count must not exceed the characters typed so far; today they are hand-counted and silently break on edit"), §3.3 line 160 and §8 line 576 (JSON island).

Evidence: checked mechanically across all 9 home sequences (`js/script.js:129-192`) and all 7 listing sequences (`blog/blog-listing.js:37-88`): every `delete` count equals `len(text so far) - len(longest common prefix(text so far, next text))`, with no exception. The only per-sequence variation is one pause (1000 ms at `script.js:146` versus 1500 elsewhere; 800 on the listing) and the fixed convention `callback: startAnimations` after the first `type` (`:132, :145, …`).

Why it fails: the owner's prose file carries animation step vocabulary and hand-counted integers, and the schema grows a rule to police them. Data in the wrong layer, and the spec itself calls the counts fragile.

Restructure: `canonical.masthead.home` is a list of sequences, each an ordered list of terminal strings (plus an optional `pause` override for the one outlier); a ten-line pure function (in the component that feeds the island, or in `script.js`) derives `type`/`delete`/`pause`/`callback` by common prefix. Rule 5 is deleted; T2's fixture test proves the derived steps equal today's literal arrays. Spec 1 territory: the prose shape is being decided now. Changes: §4.1 lines 242-244 and 275-276, T2.

### 3. Spaghetti / branching complexity

#### F6. `settle()` is one function with a page-type switch and eleven home-only predicates.

Spec: §9 lines 644-656.

Steps 1-4 are generic; step 5 is `if home … if post … if 404 …` with ten pinned elements, `#highlight` geometry, 8 cards / 8 dots, `--ticker-run`, `--section-rule` stability (home), a read-time regex and mermaid SVGs (post), `data-style` and sheet loaded (404). This is the file that grows in T8 as flakes get fixed. Put page knowledge in one place: `sentinels.ts` already holds per-page-type selectors (lines 608-610); add `ready: Record<PageType, (page) => Promise<void>>` beside them and keep `settle.ts` to the four generic waits plus one lookup. Under F3(b) the `--ticker-run` predicate goes away. Changes: §9 lines 644-656, §3.1 line 106.

#### F7. `href()` rule 5 needs the post ids and `extraPages`, so `themes/paths.ts` depends on content, and a typo passes silently.

Spec: §6.1 lines 468-476, D31 line 78, module graph lines 163-166 (which does not show `paths` importing content).

Why it fails: deciding "is `/blog/<id>/` one of the engine's routes" needs the posts collection (async `getCollection`, or the prose tree) inside the theme layer, in a function templates call synchronously; a mistyped internal path (`/blog/helmm/`) is left unprefixed, which is the wrong failure (a working link to the default theme's 404 instead of a build or harness error). Rule 5's list is a hand-maintained duplicate of the route table.

Restructure: the invariant is simpler: "a root-absolute path is themed unless it is a static asset". `href` keeps rules 1-4; rule 5 becomes: unchanged if `existsSync(join('public', path))` (or the fixed prefix list `/resources/`, `/vendor/`, `/vendor-static/`, `/subsites/`, `/embedded-swift-agent/`, `/blog/posts/`, `/css/`, `/js/`, `/blog/post.html`), else `'/' + theme + path`. No content import, no `extraPages`, no async; a wrong path becomes a themed 404 that harness check 4 catches. Changes: §6.1 lines 474-476, D31.

### 4. Boundary / abstraction / type-contract problems

#### F8. `StructuralTheme` ships fields, slots and schema helpers that nothing in spec 1 writes.

Spec: §5.1 lines 353-359 (`extraPages`, `picker`, `modes`), §5.3 lines 391-396, D26 line 73 ("designed here, built in the mono spec"), D28 line 75, §11 "Spec 1 provides" column: `fragments(n)` and per-slot `constraints` (line 736), optional `category`/`year`/`summary`/`description.s` that "nothing writes" (737), `group` (739), `images[]` (740), a `chrome` slot (741), a `<defs>` slot with an id-prefix convention (744), `--tc-z` "set by the theme" (730; zero hits repo-wide today), plural template forms (746).

Why it fails: intent §8.1 asks for a desk-check "so the first consumer does not force a redesign"; intent §8.2 says cream fixes the engine if it finds a gap, "it has no other consumers yet, so changing it is cheap". The spec turns the desk-check into shipped surface: registry fields, optional schema fields, two slots, two schema helpers and a custom property, none exercised by any page spec 1 builds. That is the owner's "big interface over little machinery". The five themes justify a seam (the `kind` discriminant, `layouts`, the fallback branch), not fields.

Restructure: spec 1 ships `kind`, `layouts`, the fallback line in `layoutFor` and its stub test. Everything else in the list above moves to §11's right-hand column as "added by the first consumer that needs it" and is removed from §4.1/§5.1/§5.3. `PickerFab.astro` stays (D12 needs it for utility pages); with F4 the Shell no longer needs `picker.mount` either. Changes: §5.1, §5.3, §11, D26, D28.

#### F9. Engine invariants and a `globalThis` side channel live in the prose integration.

Spec: D10 line 57 (`globalThis.__proseUnwritten`), D29 line 76 ("the prose integration's build-done scan asserts every emitted page has exactly one `#tc-dock` …"), D31 line 78 (grep test), §3.1 line 94, rule 7 lines 279-281.

Why it fails: theme-engine assertions (dock, scrim, trigger) sit in `prose/integration.ts` because it happens to own the `astro:build:done` hook, and the accessor talks to the hook through an untyped global. Wrong layer plus a hidden contract.

Restructure: one `src/build/checks.ts` integration whose hooks call named pure functions over `dir`: `assertNoYamlSyntaxError`, `assertNoUnwrittenSizes` (reads the accessor's exported `unwritten` set from module scope; fall back to `globalThis` only if T0 shows the accessor's module instance differs from the integration's, and record which), `assertShellInvariants`, `assertNoRelativeHrefs`. Each check's owner is then obvious. Changes: §3.1 line 94, D10, D29, D31, T2/T3.

### 5. File-size and decomposition

No file the spec grows or creates crosses 1000 lines. `css/styles.css` is already 1010 (CLAUDE.md says ~960) and is untouched; `marquee.css` (2103), `doodle.css` (1011) and eleven other skin sheets are already over and get one-line edits; `theme-cycler.js` (777) shrinks by the dock construction (`:507-577`, `:284-322`, about 175 lines) and shrinks further under F1; `theme-bootstrap.js` (775) is retired; `typing-engine.js` (639) stays; the harness is split into five modules by design; `prose.yaml` is data and its structure (sections, per-field size maps, `strictObject`) is readable. Pass. The skin sheets' size is cleanup-pass material and out of scope.

### 6. Modularity and abstraction

#### F10. D5 runs a copy step on every build to regenerate files that never change, and keeps two vendoring mechanisms.

Spec: D5 line 52, §8 lines 589-595, §3.1 line 111.

`scripts/vendor.mjs` on `prebuild`/`predev` copies seven packages into gitignored `public/vendor/` and asserts hand-recorded sha256s, while Boxicons is a committed copy under `vendor-static/`. Intent §4.12 pins every version until the cleanup pass, and D5 itself says Vite chunking is not used, so the output is immutable. Restructure: run the copy once, commit `public/vendor/` (git is the hash table; Boxicons is already committed), keep `scripts/vendor.mjs` as a manual `npm run vendor` for the day a pin changes, drop the prebuild hook, the sha256 list and the `vendor-static` split. "npm is the source of truth" still holds (the script copies from `node_modules`). Changes: D5, §8, §3.1, T4.

#### F11. Ticket order serialises independent work.

Spec: §12 line 764 ("T2/T3 can run in parallel after T0; T7 can run any time after T3").

T1 (harness old-vs-old) depends only on the baseline worktree (§14.4) and Playwright, that is on T0 item (j) alone; it can start with T0. T7 depends on nothing in `src/`; it can run with T2/T3. T5 and T6 touch disjoint paths (lines 785-787) and can run in parallel after T4. Say so in §12; T8 is the only true join. The deploy runbook (§10) is correctly sequential: each step is an owner approval.

### 7. Legibility and maintainability

#### F12. Dead branches carried through files the spec edits.

`js/featured-carousel.js`: `applyExpandVisualShell` (`:94-185`) is dead under `EXPAND_VISUAL = false` (`:17`, `:421`). `js/typing-engine.js`: `__restartTypingSequence` (`:637-639`) has no caller; the comments at `script.js:11-13`, `typing-engine.js:81-84, :631-636` and `theme-bootstrap.js:644` attribute it to a cycler path that does not exist, and the once-guards `heroChromeIn`/`subTextIn` (`script.js:14`, `:109`) and `_lastConfig` (`typing-engine.js:88`) serve only that path. `js/anim-utils.js:301-306` observes `data-style` mutations that never happen once switching navigates. `js/theme-cycler.js:125` `STYLE_KEY` is unused. Intent §7 defers the library cleanup, but the thermo bar does not carry dead code through a file the spec is already editing: for `featured-carousel.js`, `script.js` and `theme-cycler.js` (edited in T4) delete the dead branches in the same edit and note it in §8; `typing-engine.js` and `anim-utils.js` can wait for the pass if F1's two-line edit is their only change. Changes: §8 table.

#### F13. `prose.get(path, size, { paragraphs: 'br' })` is a rendering mode on the shared accessor for one consumer family.

Spec: D15 line 62, §4.2 line 296. Prefer `prose.paragraphs(path, size): string[]` and let the canonical component join with `<br><br>` (D17's own principle: presentation quirks belong in components). Marginal; do it since the accessor is being written anyway.

---

## Reviewed, no finding

- Registry (§5.1, D28): typed, slimmed, asserted at import, array order = picker order, lazy layout imports. Good. The module graph (lines 163-166) should show `prose/schema → themes/registry` (rule 4) explicitly; it is one-way.
- `Shell.astro` as the only emitter of `<html>`, the head tail and the body tail (D29): right idea; keep it, with F4's prop instead of `pageType`.
- `ThemeAssets` order and `data-style-asset="1"`: the attribute is live (`js/typing-engine.js:293` re-measures the masthead when those links load), so keeping it is correct, not just parity.
- Build-rendered dock + `wireDom()` + one `.tc-nav-item` trigger contract (D30, §5.5): good; the `data-*` strings for the dynamic variants (Lock/Unlock, current/preview) are the right kind of bridge.
- D2 config; D7 one-entry YAML with `superRefine`; D9 draft marking inside the accessor; D10's two gates; rule 7 (own YAML parse because `file()` swallows errors); rule 2 (`xs` has no Markdown); rule 3 (1:1 posts); D8 (metadata into prose, which removes the `helm`/`metr-doubling` drift between `blog-post.js:160` and `blog-data.js:151, :178`); D14 (the two, and only two, prose `content:` strings: `marquee.css:572`, `doodle.css:535`; `blueprint.css:652` `FIG.` is a counter label); D15-D17, D19, D22-D24.
- Blog pipeline (§7, D6): marked 18 + the three overrides + `hljs.highlight` at build; JSON-LD at build also fixes today's client-timezone date (`blog-post.js:50-54`) and runtime `location.href` (`:57`); `post.html` shim; asset and fetch-URL rewrites (`cohorts-chart.js:642-682`, `job-market-chart.js:12`). Note only: `[id].astro` × 16 themes renders each post 16 times; render once per id in `getStaticPaths` and pass the HTML as props.
- `nav-behavior.js` residue (Calendly URL from computed `--bg/--text/--primary`, `nav-config.js:37-48, :135-140`; sticky header `:142-163`): correct split, about 30 lines survive.
- Harness (§9, D20): DOM dump + screenshot + computed sample + network + script allow-list; index pinning over seeds; the `route.abort` list; the `matchMedia` guard; the port check after the run. Normaliser rule 6 reusing `href()` is right.
- `href()` rules 1-4 and the grep test (D31).
- Deploy (D21, §10): dispatch-only workflow on `main` first, dry run, flip, merge, rollback recorded. Good.
- D25 (no boot-time breakpoint). D27's premise (one `404.html` per host is a real constraint; only the duplicate implementation is F2).
- §13 questions and §14 owner actions: complete and well-defaulted.
- Ramp: 28 of 95 steps are unread and `--secondary` steps are used 6 of 19 times, but `<html style>` parity (§9.7) forbids shrinking it now; cleanup pass.

---

## Verdict against the Approval Bar

Do not approve as written.

Presumptive blockers, in the skill's terms:
1. "Preserves a lot of incidental complexity when there is a plausible code-judo move that would delete it": F1 (runtime registry blob), F2 (duplicate theme-to-HTML mapping), F3 (runtime-built dots, ticker vars, copy buttons and mermaid loader with `data-*` bridges), F5 (choreography in prose).
2. "Adds ad-hoc branching that makes an existing flow more tangled" and "solves a local problem by scattering feature checks across shared code": F4 (`pageType` on the Shell, a per-page-type `Head.astro`, two FAB owners).
3. "Adds an unnecessary abstraction, wrapper, or contract that makes the design more indirect": F1's seven globals; F8's unconsumed structural fields, slots and helpers.
4. "Duplicates an existing helper or puts logic in the wrong layer when there is a clear canonical home": F2, F7 (`themes/paths` depending on content), F9 (engine scan in the prose integration).

Met: no file-size explosion (§5 above); no casts or `any`; the typed registry and the accessor contract are explicit; the module graph is one-way once F7 is applied.

What approval looks like: F1-F4 and F7 restructured in the spec (they change §3.3, §5.2-§5.5, §6.1, §6.2, §7, §8, §9 and T3-T5); F5, F8 and F9 accepted or argued per decision; F6 and F10-F13 at the author's discretion but answered. None of it reopens an intent §4 decision; all of it stays inside the §9/§15 parity contract.
