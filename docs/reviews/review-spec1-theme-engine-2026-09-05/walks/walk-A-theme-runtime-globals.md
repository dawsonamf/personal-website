# Walk A: theme runtime globals (Opus subagent of the thermonuclear reviewer)

## Bottom line

The runtime needs almost nothing from the blob. Outside the cycler, every consumer reads one flag of the **active** theme through three helper functions, and two of those three flags are already stamped as `<html>` attributes. The cycler is the only reader of `__THEME_REGISTRY`/`__THEME_ORDER`, and for non-active themes it needs exactly `{id, label, 5 colors, --font-heading, fonts[]}`, which it already serializes into `<li style="--tc-row-*"> <a data-id>` rows. The one structured datum that resists an attribute is the `random` profile (3 themes have one). So yes: `data-typing`/`data-typing-delete`/`data-polarity` on `<html>` plus build-emitted preset rows (and a small JSON attribute for `random`) would replace the blob.

## 1. Globals the bootstrap defines (all in `/Users/dawsonamf/Desktop/dax/personal-website/js/theme-bootstrap.js`)

| Global | Defined | Consumers, field read |
|---|---|---|
| `__THEME_CYCLER_ENABLED` | :8 | `js/theme-cycler.js:5` (early-return gate); `js/nav-config.js:27-29` (pushes the "Theme" nav item + mobile item) |
| `__THEME_REGISTRY` | :639 | `js/theme-cycler.js:9` only |
| `__THEME_ORDER` | :640 | `js/theme-cycler.js:10` only |
| `__ACTIVE_STYLE` | :700 | bootstrap's own helpers :647/:655/:665; `js/theme-cycler.js:167` |
| `__styleAllowsTilt` | :646-649 | `js/script.js:257`, `:397`; `js/featured-carousel.js:190`; `blog/blog-post.js:182`; `blog/blog-listing.js:142`. All gate `VanillaTilt.init`. |
| `__styleTypingMode` | :654-657 | `js/typing-engine.js:99` (config.mode overrides; fallback `'cursor'`) |
| `__styleTypingDeleteMode` | :664-667 | `js/typing-engine.js:109` (config.deleteMode overrides; fallback `'char'`) |

The three helpers are pure lookups, nothing else. Each is `var entry = REGISTRY[window.__ACTIVE_STYLE || 'default'];` followed by one return: `!(entry && entry.flags && entry.flags.tilt === false)` (:648), `(entry && entry.typing) || 'cursor'` (:656), `(entry && entry.typingDelete) || 'char'` (:666). `__styleAllowsTilt` is therefore identical to `!html.hasAttribute('data-no-tilt')` for non-default themes (:706 stamps from the same test).

Other `window.__*`: `js/typing-engine.js:637` defines `__restartTypingSequence`; no callers exist (`js/script.js:12` and `typing-engine.js:81` are comments about a live-switch path that no longer exists).

DOM/attribute consumers: `js/anim-utils.js:105` reads `data-style`; `:301-305` MutationObserver on `data-style` (dead in practice, switches navigate). `js/typing-engine.js:293` queries `link[data-style-asset]` for load listeners (re-measures masthead). `css/themes/theme-base.css:71-101` uses `[data-still]`/`[data-no-tilt]`; every skin sheet scopes under `[data-style="id"]`. `css/theme-cycler.css` hits (:398, :520, :587, :613) are comments only. `blog/post.html:32-39` and `js/nav-config.js:39-45` read CSS variables via `getComputedStyle`, not the registry.

## 2. theme-cycler.js (`/Users/dawsonamf/Desktop/dax/personal-website/js/theme-cycler.js`)

**(a) Registry reads**

| Line | Read | Purpose | Scope |
|---|---|---|---|
| :13 | `REGISTRY.default.colors` | `DEFAULT_COLORS` for reset :391 / neutrals fallback :215 | default only |
| :102-103 | `REGISTRY[state.style].random[mode]` | palette generator profile; fallback `DEFAULT_RANDOM` :77-98 | active |
| :167-174 | `.id`, `.colors`, `.polarity` | initial `state` (polarity becomes `state.theme`, the dark/light switch for the generator) | active |
| :214-221 | `.colors` + `.tokens[k]` for 6 `DERIVED_NEUTRALS` (:208) | detect divergence from base; restore tokens on return-to-base | active |
| :273 | `REGISTRY[id]` truthiness | guard in `switchStyle` | any |
| :287-305 | `.colors`, `.tokens['--font-heading']`, `.label` | preset rows | ALL |
| :335-349 | same three | preview card on hover | ALL (hovered) |
| :374-377 | `.fonts` | `loadAllFonts` | ALL |

No cycler code reads a non-active theme's `css`, `flags`, `typing`, `typingDelete`, `polarity`, `random`, or any token but `--font-heading`.

**(b) injectDom** :507-577. Builds `<aside id="tc-dock" class="tc-dock tc-mega tc-hidden" aria-label="Theme controls">` (:508-514) containing `.tc-mega-clip > .tc-mega-inner`; `.tc-mega-styles` with `<h3 id="tc-styles-head">Styles</h3>` (:520), `.tc-mega-swap` holding `<ul id="tc-presets">` (:525) and `#tc-advanced` (`.tc-group-schemes` "Scheme" + `#tc-schemes`, `.tc-group-roles` "Colors" + `#tc-roles`, :526-535); `.tc-mega-side` with `<h3>Palette</h3>` (:540) and `.tc-actions` buttons `#tc-randomize` "Shuffle colors / random palette", `#tc-reset` "Reset / back to default", `#tc-advanced-link` with `#tc-advanced-label` "Advanced" + `#tc-advanced-sub` "scheme &amp; colors" (:542-544); `#tc-preview` with `#tc-preview-name`, `.tc-preview-rule`, `#tc-preview-meta` "current" (:548-552). Bails if no `.tc-nav-item` (:558-559), appends dock to `<body>` (:565), adds `#tc-scrim` (:567-570), wires dropdown (:572), binds three buttons (:574-576). More hardcoded strings: `setAdvanced` :414-416 ("Advanced"/"Styles", "Back to styles", "done editing"); role labels `ROLES` :157-163 and "Lock"/"Unlock" :462; scheme names :62/:488; preview meta `'preview'`/`'current'` :316-320.

**(c) switchStyle** :272-277: returns if unknown id or already active (:273); `sessionStorage.removeItem('dawson-theme-cycler')` (:275); `location.href = '/?style=' + id` (:276). Always lands on `/`, never the current page. It does not write `dawson-style`; bootstrap does that on landing (:692). **resetToDefault** :389-398: `switchStyle('default')` (navigates unless already default), resets state, removes STORAGE_KEY (:395), then `applyColors()` (:396) which immediately re-persists via :188. So on the default theme the clear at :395 is undone by :188.

**(d) isReload** :126-131 (`performance` navigation type `'reload'`); boot :748-752 wipes STORAGE_KEY on reload, else `restore()`. Duplicates bootstrap :674-678 and :730-731.

**(e) loadAllFonts** :370-387: iterates `STYLE_ORDER` → `REGISTRY[id].fonts`, dedupes (Set + `link[href=...]`), appends plain `<link rel=stylesheet>` (no `data-style-asset`). Runs from boot :761-762 via `requestIdleCallback` (timeout 2500) or 800 ms `setTimeout`, on every page load, menu opened or not.

**(f) Session** key `'dawson-theme-cycler'` (:124). `persist()` :132-141 writes `{colors[5], locks[5], scheme, theme}` on every `applyColors` (:188): boot :754, shuffle :263, color drag :469, reset :396. `restore()` :142-154 reads at boot (non-reload). Bootstrap :733-738 reads only `colors` to override pre-paint. `STYLE_KEY` is declared :125 but never used in the cycler.

**(g) Geometry**: `MEASURE = 940` (:596), `EDGE = 10` (:597); `position()` :614-627 sets `top = pill.bottom + 10`, clamped `right`, `--tc-mega-w` (pill width) and `--tc-mega-target` (`min(940, innerWidth - 20)`). Timings: hover-close 300 ms (:706, :723), hide-after-collapse 440 ms (:674-676). Hover gate `canHover = matchMedia('(hover: hover) and (pointer: fine)')` :594, binding mouseenter/leave only when true (:698-708, :711-725). Click pins/toggles :688-696; outside click :735-739; Esc :740-742; reanchor on resize/scroll :681-683; forced reflow `void dock.offsetWidth` :647.

**(h)** The cycler never removes, replaces, or reads `data-style-asset`. Only bootstrap :719 sets it and `typing-engine.js:293` reads it.

**(i) Preset rows** :302-308: `<li style="--tc-row-text:..;--tc-row-bg:..;--tc-row-primary:..;--tc-row-secondary:..;--tc-row-accent:..;--tc-row-heading:..">` containing both an `<a href="/?style=id" data-id class="tc-row-link menu-item tc-stagger">` (wide) and a `<button data-id class="tc-row-card" tabindex="-1" aria-hidden>` (narrow); CSS shows one (`css/theme-cycler.css:210-242`). Click on either → `preventDefault(); switchStyle(id)` (:313). The `href` only matters for middle/ctrl-click, which then bypasses the STORAGE_KEY clear.

## 3. Bootstrap ranges

- **:637 ORDER**: 16 ids: `default, brutalist, marquee, blueprint, field-notes, doodle, grid, miami-deco, bauhaus, chinoiserie, gallery, banknote, neo-pop, broadsheet, studio, wheatpaste`. Four retired entries are commented out (space :210-239, vapor :240-265, wanted :425-456, constructivist :457-495).
- **:646-669**: helpers are :646-667; :669 is `var STYLE_KEY`. Confirmed pure lookups (quoted above).
- **:675-678**: this only *detects* reload (`performance.getEntriesByType('navigation')[0].type === 'reload'`). The actual wipes are :687 (`dawson-style`) and :730-731 (`dawson-theme-cycler`). Spec citation is slightly off.
- **:703-706**: for non-default only (:703): `data-style=id` (:704), `data-still=""` if `flags.still` (:705), `data-no-tilt=""` if `flags.tilt === false` (:706). Then :707-711 `root.style.setProperty(k, v)` per token key.
- **:715-721**: `<link rel=stylesheet data-style-asset="1">` for `fonts[] ++ ['/css/themes/theme-base.css'] ++ [css]`, `appendChild` to `<head>`, so they land after all site CSS and after the bootstrap `<script>` itself (`index.html:23-27`).
- **:764-774**: for each of 5 roles in literal order text, bg, primary, secondary, accent: `--<role>` = hex, then 19 `STEPS` (:671, 5..95 by 5): `--<role><a>` = `'hsla(' + h.toFixed(0) + ',' + s.toFixed(0) + '%,' + l.toFixed(0) + '%,' + a + '%)'` (no spaces). 5 + 95 = 100 inline declarations, **also for default**. Non-default totals 108-109 with tokens. `hexToHsl` :744-762 handles 6-digit hex only.

Pure-function verdict: `apply(entry)` → `{attrs, style, links}` depends only on `entry` and `STEPS`. Runtime-only inputs are the resolution (:684-698) and the session palette override (:733-738), both outside the mapping. The ramp format and `hexToHsl` are already duplicated verbatim in the cycler (:24-40, :182-185), so one shared function is a net deletion.

`?style=`: `URLSearchParams.get('style')` :688. Valid id → apply + write `dawson-style` (or remove it if `default`) :689-692. **Unknown id is silently ignored** and falls through to the session value (:693-696), so `?style=bogus` shows whatever style the session holds, not default. Whole block skipped when `THEME_CYCLER_ENABLED` is false (:685).

## 4. Registry data

Every entry has `id, label, polarity, colors{5}`. Other fields:

| id | flags | typing | typingDelete | fonts | random |
|---|---|---|---|---|---|
| default | – | – | – | – | – |
| studio | tilt:false, still | word | – | y | y |
| brutalist | tilt:false, still | – | – | y | y |
| broadsheet | tilt:false, still | word | – | y | – |
| field-notes | tilt:false | – | – | y | – |
| blueprint | tilt:false, still | – | – | y | – |
| doodle | tilt:false | letter | – | y | – |
| wheatpaste | still | – | – | y | – |
| bauhaus | tilt:false | – | – | y | – |
| chinoiserie | tilt:false | letter | – | y | – |
| banknote | tilt:false, still | word | – | y | – |
| grid | tilt:false, still | – | – | **none** | – |
| gallery | tilt:false, still | – | – | y | – |
| miami-deco | **none** | letter | – | y | – |
| neo-pop | tilt:false | letter | – | y | – |
| marquee | tilt:false | word | **word** | y | y |

All 15 non-default entries have `css` and `tokens` (8 standard keys: `--font-body/--font-heading/--border-radius/--radius-pill/--neutral-gray/--jobs-menu-navy-dark/--jobs-menu-navy/--jobs-menu-slate`; five add `--font-mono`; marquee adds `--font-heading-serif` :622).

`random` shape (:33-56): `{ light: { sat:[lo,hi], roles:[5 × { l:[lo,hi], hueT:0..1, sat?:[lo,hi] }] }, dark: {same} }`, roles in text/bg/primary/secondary/accent order (cycler :71-72).

Unread fields: none. Split by reader: `label`, `polarity`, `random` are cycler-only; `flags`, `typing`, `typingDelete`, `css` are bootstrap-only. Stale bits: `docs/THEMES.md` cited at :11 does not exist (`docs/` has `theme-explorations.html` instead); CLAUDE.md's "18 skins" vs 16 in ORDER.

## 5. Line counts

`theme-bootstrap.js` 775, `theme-cycler.js` 777. Cycler breakdown by function boundary:

- (i) dock DOM: `injectDom` :507-577 (71) + `renderPresets` :284-322 (39) + preview :324-351 (28) + `setAdvanced` :400-425 (26) + `stampStagger` :353-362 (10) ≈ **175**; plus the editor's own DOM (`renderRoles` :427-482 = 56, `renderSchemes` :484-505 = 22) ≈ 253.
- (ii) palette toy logic: color math :16-60 (45) + schemes/profiles/`generatePalette` :62-120 (59) + `applyColors` :178-200 (23) + derived neutrals :202-232 (31) + `updateRoleSwatches` :234-248 (15) + `randomize` :250-264 (15) ≈ **188** (≈ 266 with its editor DOM).
- (iii) open/close/geometry: `wireNavDropdown` :589-743 ≈ **155**.
- (iv) fonts/session/navigation: persist/restore/isReload :122-154 (33) + `loadAllFonts` :364-387 (24) + `switchStyle` :266-277 (12) + `resetToDefault` :389-398 (10) + `boot` :747-777 (31) ≈ **110**.
- Remainder ≈ 40 (header, registry reads, `state`).

## Replacement sketch (what the DOM would need)

- `<html data-style data-still data-no-tilt>` already exist; add `data-typing="word|letter"` and `data-typing-delete="word"` and `data-polarity="light|dark"`. `__styleAllowsTilt` → `!hasAttribute('data-no-tilt')`; the typing helpers read the two attributes.
- Build emits the `#tc-presets` rows statically (they are already pure data: `data-id`, `--tc-row-*`, label) plus `data-fonts` per row for `loadAllFonts`. Cycler reads `[data-id]` rows instead of `REGISTRY`/`STYLE_ORDER`.
- Active-theme needs for the toy: base colors come from the active row's `--tc-row-*` (not from `<html style>`, which may already hold a restored override at boot, bootstrap :733-738); the 6 neutral tokens (:208) and the `random` profile need one small JSON attribute or `<script type="application/json">` on the active row, since :219 must restore token values after divergence.
- `docs/theme-explorations.html` grep hits (:39, :48-49, :57, :74, :78, :88-90, :136) describe the current global/attribute contract and would need updating.
