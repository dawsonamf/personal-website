# Spec 1 architecture review (improve-codebase-architecture, spec-directed)

- **Repo:** `/Users/dawsonamf/Desktop/dax/personal-website`, `main` @ `0f196d0`
- **Spec under review:** `docs/intents/2026-09-05-theme-engine-rewrite/spec-1-migration-engine-parity.md` (line numbers below refer to it); intent §4 treated as ADRs, intent §10 as the glossary
- **Date:** 2026-09-05
- **Method:** lens (a) on every module the spec proposes; lens (b) through three read-only walks of the current code (theme runtime contract, behavior-script data feeds, skin sheets vs canonical DOM), load-bearing claims re-verified by hand. Findings only; nothing in the repo was changed.
- **Badges:** `Strong` = tackle before T3; `Worth exploring` = real friction, cheap while the spec is still text; `Speculative` = record, do not act in spec 1.

---

## 1. Decide a page's composition once, in `compose.ts`

**Strength:** Strong · **Dependency category:** in-process

**Files / modules:** spec §5.2 `src/layouts/compose.ts` (`layoutFor`), §5.4 `src/layouts/Shell.astro`, `ThemeAssets.astro`, `PickerFab.astro`, §6.1 canonical/noindex, §5.4 `__PAGE_PATH`.

**Problem.** The interface of `compose.ts` is `layoutFor(theme, pageType) → AstroComponentFactory` (line 376): it returns only the layout. But the same three-way branch (skin / structural-owned / structural-fallback, plus "utility page types always canonical") also decides the asset set (lines 377-380; "the composition line (§5.2) decides which of the three apply", line 419), the picker mount ("utility layouts get `PickerFab.astro`", lines 385-386; "`<PickerFab />` when the theme mounts nothing", line 413) and the canonical/noindex pair (lines 478-480). As written, `ThemeAssets` and the Shell must re-derive the branch from `theme.kind`, `theme.layouts`, `theme.picker.mount` and the page type: one feature check in three shared files, which intent §3.4 forbids, and three places a structural theme author must read to learn what their page will get.

**Solution.** `compose.ts` returns one composition value for `(theme, pageType)`: which layout renders; which of {fonts, `theme-base.css`, skin css} `ThemeAssets` emits; whether the picker mount is nav-owned, theme-owned or FAB (and which corner); the canonical URL and robots flag; the page's theme-less path for `__PAGE_PATH`. The Shell, `ThemeAssets` and `PickerFab` render what that value says and never inspect `theme.kind` or `theme.picker` themselves. A caller (page file or test) needs to know one thing: give it a theme and a page type, render what comes back.

**Wins.**
- locality: the skin / owned / fallback / utility rule lives in one function
- leverage: five page files, the Shell, `ThemeAssets`, `PickerFab` read one value
- test surface: one table test over {skin, structural-with-layout, structural-fallback} × {home, blog, post, privacy, 404, lexchat} asserts the whole composition; T3's stub-theme fallback test hits the same interface
- structural themes learn one fact set from one place

**ADR callout.** None. D29 ("one page shell" owns every engine-owned element) is kept; only the decision moves out of the Shell.

**Deletion test.** Delete `compose.ts`: the branch reappears in five page files, the Shell and `ThemeAssets`. Concentrates. Earns its keep, and deepens once it owns the whole decision.

---

## 2. The theme `<link>`s' position is a `Head.astro` fact, not a Shell fact

**Strength:** Strong · **Dependency category:** in-process

**Files / modules:** spec §5.4 (Shell emits "`<ThemeRuntime />`, then `<ThemeAssets />` last", lines 407-410), §6.2 lines 492-493, D29 line 76; `src/layouts/canonical/Head.astro`; harness `normalize.ts` step 2 (lines 663-664: head order compared as-is).

**Problem.** The spec's premise is that today's bootstrap appends its links "to the end of `<head>`", so "last is the parity position on every page type" and it "keeps the skin sheet after `github-dark.min.css` on posts, which the cascade relies on" (lines 407-410). The code says otherwise. `document.head.appendChild` (`js/theme-bootstrap.js:715-721`) runs inside a blocking script, so the links land right after the bootstrap's own tag, which on every page sits immediately after `/css/theme-cycler.css`: `index.html:26-27`, `blog/index.html:26-27`, `blog/post.html:16-17`, `privacy/index.html:17-18`, `404.html:15-16`, `lexchat/index.html:10-11`. On posts the skin sheet therefore precedes `github-dark.min.css` (`blog/post.html:17` vs `:19`); skins win by specificity, not order (`[data-style] .blog-post-content pre` at `css/themes/theme-base.css:13,18` and `css/themes/brutalist.css:588,593`; no skin sheet uses `.hljs` selectors). Emitting `ThemeAssets` last changes `<head>` order on the 48 themed post pages, so the DOM diff fails there, and the likely quick fix (normalising link order) would hide a real cascade change. The seam is in the wrong module: where the theme links go is a fact of each page type's head, which the canonical `Head.astro` already writes by hand (§6.2), and structural themes own their whole `<head>` anyway (§11, illoca row: "theme-owned `<head>` for fonts").

**Solution.** `ThemeAssets` stays the one implementation of *what* the theme links are (fonts → `theme-base.css` → skin, `data-style-asset="1"`, the bootstrap's order), but the layout's head decides *where*: the canonical `Head.astro` renders `<ThemeAssets />` immediately after `/css/theme-cycler.css` on every canonical page type; a structural layout renders it wherever its head needs it. The Shell keeps `ThemeRuntime` and the end-of-body mount. The D29 build-done scan adds "exactly one `ThemeAssets` marker per page" so placement stays mechanical.

**Wins.**
- parity: `<head>` order byte-equal on posts without a normaliser exception
- locality: head order is one file per layout family, as it already is for every other tag
- leverage: one `ThemeAssets` implementation, two placements (canonical, structural)
- test surface: T3's byte-equal test extends to head link order per page type, from T1's old dumps

**ADR callout.** Refines D29's "the tail of `<head>` (ThemeRuntime, then ThemeAssets last)". Worth reopening because the premise is false on posts and T5's harness run will prove it.

**Deletion test.** Delete `ThemeAssets`: the fonts / base / skin link logic reappears in every layout's head. Concentrates. Keep the module; move only its placement.

---

## 3. One projection from theme to `<html>`, rendered at build and assigned at runtime

**Strength:** Worth exploring · **Dependency category:** in-process

**Files / modules:** spec §3.1 line 96 (`themes/ramp.ts` "build + 404", `themes/apply.ts` "runtime apply (404 only)"), §5.4 lines 402-406 (Shell emits attributes and inline style), lines 437-440 and D27 line 74 (404 applies attributes, tokens, ramp, links "in the bootstrap's order"), D26 line 73 (modes stamp `data-mode` from `ThemeRuntime`). Today: `js/theme-bootstrap.js:703-706` (attributes), `:707-711` (tokens, per-property `setProperty`), `:764-774` (ramp), `:715-721` (links); the palette toy's copy of the same ramp at `js/theme-cycler.js:178-187`.

**Problem.** "Which attributes a theme stamps, which custom properties in which order, which links in which order" is implemented twice in the spec: once as Astro template (Shell + `ThemeAssets`), once as DOM code (`apply.ts`). Only the ramp is shared. T3 tests the build output byte-for-byte (line 772); T6 tests only that the 404 "applies brutalist" (line 775). Two implementations of one fact set, one of them tested. D26 adds a third writer of `<html>` state (the modes pre-paint block), and the palette toy is already a fourth (`theme-cycler.js:178-187` re-implements `theme-bootstrap.js:764-774`).

**Solution.** `apply.ts` exports one pure projection: given a theme (later, a theme and a mode), return the attribute list, the ordered style declarations (tokens, then the 100-property ramp, then `--prose-*`) and the ordered link hrefs. No DOM, no imports from the rest of `src/` (§3.3 already requires this). The Shell and `ThemeAssets` render that value; the 404 script assigns it. What a caller must do: hand it a theme, get back three ordered lists. Which test hits it: the T3 byte-equal fixture, run once against the projection, now covers both adapters (Astro render, DOM assign): two adapters, so the seam is real. The toy's ramp copy stays under D3; record it for intent §7.

**Wins.**
- locality: attribute, property and link order in one function
- leverage: one implementation, two adapters (build render, 404 assign)
- test surface: one fixture instead of a build test plus a runtime smoke
- D26's `data-mode` lands behind the same seam

**ADR callout.** None; D27 and D29 are kept as stated.

**Deletion test.** Delete the projection: the ordering rules reappear in the Shell, `apply.ts` and (for modes) `ThemeRuntime`. Concentrates.

---

## 4. `--ticker-run` is a build fact; delete `buildTickerRun` and `data-tech`

**Strength:** Worth exploring · **Dependency category:** in-process

**Files / modules:** spec §8 line 575 (`buildTickerRun` "stays and reads each card's tech chips from the rendered DOM (`data-tech`)"), D14 line 61 (`--prose-ticker` beside `--ticker-run`; the sheet becomes `var(--ticker-run, var(--prose-ticker))`), §3.3 lines 158-159. Today: `js/featured-carousel.js:388-415` reads `window.FEATURED_PROJECTS` (`:389`), chips from `proj.tech` (`:392`), one call at `:420` on load, writes `--ticker-run` and `--ticker-dur` on `<html>` at `:412-414` with `402/46` chars per second (`:386`); readers are `css/themes/marquee.css:572` and `:584` only; no resize, palette or slide hook (the only `dawson:palette` listeners in the repo are four post chart assets).

**Problem.** Today the ticker string is computed from data, once, at load. The spec keeps the runtime computation but changes its input to the DOM, so one fact (the marquee ticker) gets three carriers: eight `data-tech` attributes → JS → `--ticker-run`, plus `--prose-ticker` at build, plus a two-level `var()` fallback in the sheet. It is a pure function of `prose.projects[].tech`.

**Solution.** Compute `--ticker-run` and `--ticker-dur` at build with the same formula (dedupe by lowercase key, `✷` separator, two passes, doubled, `Math.round(half.length / (402/46))` seconds), ported to TypeScript beside the prose accessor, and emit them in `<html style>` after the ramp on pages that render the carousel; keep D14's `--prose-ticker` on the other pages. Delete `buildTickerRun` and the `data-tech` attributes. Output is provably identical: post-load `<html style>` is the same string in the same property order (the old side appends the two properties after the ramp via `setProperty`; normaliser step 7, line 674-675, compares it verbatim), and settle check 5 ("`--ticker-run` non-empty", line 654) still holds.

**Wins.**
- delete a runtime feed and eight contract attributes
- locality: one carrier per fact, beside the data it derives from
- test surface: T2's fixture test asserts the string against T1's captured `<html style>`

**ADR callout.** Contradicts D14 ("set at runtime … unchanged") and the §8 edit list under D3. Worth reopening because the spec's own edit already changes the input source (data → DOM); the smaller edit is the deletion, and intent §4.13 permits refactors whose output provably does not change.

**Deletion test.** The formula must live somewhere; at build it sits beside the data it derives from, in one place. Concentrates.

---

## 5. Masthead: the prose is the lines; the module derives the steps

**Strength:** Worth exploring · **Dependency category:** in-process

**Files / modules:** spec §4.1 line 243 (`canonical.masthead` as `{ type, delete: 14, pause }` step arrays "verbatim"), schema rule 5 lines 275-276, §3.3 line 160 (one JSON island), §8 line 576 (`script.js` "reads sequences from the JSON island"); `public/js/script.js`, `blog-listing-client.js`, `typing-engine.js` (verbatim). Today: `js/script.js:129-203` (9 active sequences; each has `{ action: 'callback', fn: startAnimations }` right after its first `type` step at `:132,145,152,156,160,167,174,181,188`; pauses 1500 ms except one 1000 ms at `:146`), `blog/blog-listing.js:38-88` (7 sequences, `fn: onBlogTypingComplete` after the first `type` step, pauses 800 ms), `js/typing-engine.js:618` (fires `fn()`).

**Problem.** Two things. A gap: the sequences contain function-valued callback steps, which a JSON island cannot carry, so "reads sequences from the JSON island" is under-specified. A seam in the wrong place: the owner's prose (the words) is stored entangled with behavior facts (delete counts, pause durations, callback position). Rule 5 exists because the counts are hand-maintained and "silently break on edit"; the spec validates the symptom instead of removing the cause.

**Solution.** Prose stores each sequence as its lines (a list of strings, with an optional per-line pause override as data, since `:146` differs). A build-time function derives the data steps: type the first line, pause, delete back to the longest common prefix with the next line, type the remainder, and so on; the island carries those steps. The client (`script.js`, `blog-listing-client.js`, both already edited to read the island) splices its callback step after the first `type` step, a behavior fact that belongs to the script. `typing-engine.js` is untouched. A fixture test proves the derived steps equal today's 16 literal arrays; if a hand count differs, that is a latent bug surfaced, not reproduced.

**Wins.**
- delete rule 5: a wrong delete count becomes impossible
- the owner edits words only; the island is pure data
- locality: counting lives in one function
- test surface: one fixture over 16 sequences

**ADR callout.** Touches the D3/§8 edit list by one splice in two already-edited client files. Friction is real: without it, the island cannot carry the callback at all.

**Deletion test.** Without the derivation, counts are hand-maintained in YAML (today's state, spread over 16 sequences). Concentrates.

---

## 6. One door into prose

**Strength:** Worth exploring · **Dependency category:** in-process

**Files / modules:** spec §4.2 lines 292-300 (`prose.data` "the validated tree (zod-inferred type) for data fields", `get`/`text`/`list`/`has`), D9 line 56 (draft marking in the accessor), D10 line 57 (unwritten sizes recorded by the accessor), §4.1 rule 1 lines 268-270 (chip and tag lists are plain `string[]`).

**Problem.** The accessor is deep: draft marking, unwritten recording, Markdown rendering, escaping and the link rule sit behind four calls. But `prose.data` exposes the whole tree, so every sized field is reachable a second way (`prose.data.jobs[0].bullets.l`) that bypasses D9 and D10: a draft renders unmarked in preview, an unwritten size renders as `undefined` and never reaches the build-done list. "`data` is for data fields" is a convention; the owner's bar is mechanical enforcement. Related: chip and tag lists can never be drafts, so a new chip cannot enter through intent §4.4's draft flow.

**Solution.** The type of `prose.data` strips every size map (a mapped type replacing them with `never`), so `astro check` rejects a sized field read through `data`; sized fields are reachable only through `get`/`text`/`list`/`has`. What a caller must do: read scalars and lists from `data`, read words through the four calls. Which test hits it: T2's fixture test plus one `@ts-expect-error` line. Let chip and tag items be `string | { draft }` so they take the draft flow.

**Wins.**
- enforcement is a type, not a README rule
- D9 and D10 cannot be bypassed
- interface shrinks: one door for words

**ADR callout.** None.

**Deletion test.** Delete the accessor: marking, recording, rendering and escaping reappear in every component. Concentrates. This card narrows its interface; it adds nothing.

---

## 7. The three flag helpers and `__PAGE_PATH` are pass-throughs (defer to intent §7)

**Strength:** Speculative · **Dependency category:** in-process

**Files / modules:** spec §5.4 lines 420-435 (seven globals kept "so the behavior scripts and the cycler read the same names"), §5.5 lines 448-450 (`switchStyle` recomputes the themed URL from `__PAGE_PATH`; the rendered rows already carry the same `href`). Today: `js/theme-bootstrap.js:646-649` (`__styleAllowsTilt` is `!(flags.tilt === false)`, exactly "no `data-no-tilt`", stamped at `:706`), `:654-667` (typing helpers); readers `js/script.js:257,397`, `js/featured-carousel.js:190`, `blog/blog-listing.js:142`, `blog/blog-post.js:182`, `js/typing-engine.js:99,109`.

**Problem.** The Shell already stamps the facts these helpers look up; the helpers exist so scripts frozen by D3 keep their call sites, and the ~7 KB registry blob rides on 240 pages partly for them (the cycler and the 404 are the blob's real consumers). `switchStyle(id)` re-implements `href()` rules 4-5 at runtime although every preset row is server-rendered with the right `href`.

**Solution.** Later, not now: each `__styleAllowsTilt()` site reads `data-no-tilt`; two attributes `data-typing` / `data-typing-delete` replace the typing helpers; the cycler navigates to the clicked row's `href` (and `resetToDefault` to the default row's), deleting `__PAGE_PATH`. Costs touching `typing-engine.js` (verbatim under §8) and the harness's `<html>` attribute compare; the gain is three one-line functions and one global.

**Wins.**
- delete four pass-throughs

**ADR callout.** Contradicts D3's edit list. Not worth reopening in spec 1; record for intent §7's cleanup pass.

**Deletion test.** Deleting the helpers makes complexity vanish, not concentrate: they are pass-throughs, which is why this is a deletion note rather than a deepening.

---

## 8. One vendor table

**Strength:** Speculative · **Dependency category:** in-process

**Files / modules:** spec §8 lines 589-595 (`scripts/vendor.mjs` map + sha256), §9 normaliser step 6 line 672 ("CDN URLs → `/vendor/…` per the vendor map"), §9 check 5 lines 612-614 (`harness/scripts.ts` allow-list), §6.2 (`Head.astro` writes `/vendor/…` paths by hand).

**Problem.** The list of vendored files is known in four places: the copy script, the normaliser's CDN→vendor map, the harness allow-list and the hand-written head.

**Solution.** One table, `{ npm path, public path, CDN URL, sha256 }` per file, imported by `vendor.mjs`, `normalize.ts` and `scripts.ts`; `Head.astro` keeps its hand-written paths (parity markup) and a test asserts every `/vendor/` path it emits is in the table.

**Wins.**
- one list, three readers

**ADR callout.** None.

**Deletion test.** Ten rows reappearing in three files. Concentrates, marginally.

---

## Reviewed, no card

- **`href()`** (§6.1, D31): deep and mechanical (throws on relative paths, grep test). One note: "known post ids" are read in three places (schema rule 3 `readdirSync`, the posts glob, `href()`'s route check); one `postIds()` helper.
- **`markdown.ts`**: one renderer, two consumers (prose fields, post bodies): a real seam by the two-adapter rule.
- **Registry** (§5.1, D28): data with import-time assertions, slimmed to what the engine reads. Fine as data.
- **Harness `settle` / `normalize` / `urls`** (§9): `settle` hides ten page-type conditions behind one call; `normalize` is a pure function on strings; `urls` should derive its pairs from `THEME_IDS` × the page list through `href()` rather than a hand list (the normaliser already calls `href`, line 673). One adapter each; spec-1 scoped, so no seam is proposed.
- **Blog pipeline** (§7): build-rendered body, small client; read time kept client-side is defensible (it measures the DOM the reader sees, after mermaid renders).
- **Picker split** (dock at build, cycler at runtime, strings via `data-*`): the seam runs through the middle of one module, forced by D3 and the parity surface (`.tc-*` nesting is styled by all 15 skins). The `data-*` string bridge is the price of freezing the cycler; intent §7's cleanup pass is where it closes.
- **`scripts/vendor.mjs`, deploy workflow**: tiny or not modules in this sense; nothing to deepen beyond card 8.

## Top recommendation

**Candidate 1, decide the composition once.** It is the seam every one of the five future themes crosses, and the fix is spec text before any code exists. Candidate 2 (the head position) rides along in the same §5 rewrite and must land before T3, because T5's DOM diff will otherwise fail on every themed post page.

## Verdict

The spec's architecture is in good shape. The build/runtime seam is drawn where intent §4 puts it, the module graph is one-directional and enforced by imports, and the prose accessor, `href()`, `markdown.ts`, the registry and the harness's `settle`/`normalize` are deep as specified. The friction concentrates in three places: the composition decision is stated as one function but its consequences are re-derived in three shared files; the Shell claims a head position that the current pages contradict on posts; and three kept-verbatim mechanisms (the ticker, the masthead steps, the seven globals) carry build-time facts through runtime feeds because D3 froze the scripts before the render/behavior line was drawn through them. No card conflicts with an intent §4 decision. Two touch spec-level decisions (D14, D29) where the friction is real; one (D3) is deferred on purpose.
