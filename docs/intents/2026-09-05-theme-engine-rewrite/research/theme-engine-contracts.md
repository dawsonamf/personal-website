# Theme engine contracts (current, pre-Astro)

> Historical research snapshot. The settled owner decisions in [Spec 1 §13](../spec-1-migration-engine-parity.md#13-settled-owner-decisions-q1-q14-2026-09-05) supersede earlier recommendations about post ownership/format, drafts, picker placement and palette support; use the current spec for implementation.

Research for spec 1, §3.2 parity. Read-only pass over the current engine on
`main` @ `0f196d0` (working tree clean for every file cited). Every claim below
is `file:line` against the repo; anything I could not confirm is marked
**unverified**.

---

## 1. Summary for the spec author

1. **`ORDER` is 16 ids, verbatim, in this order** (`js/theme-bootstrap.js:637`):
   `default, brutalist, marquee, blueprint, field-notes, doodle, grid, miami-deco, bauhaus, chinoiserie, gallery, banknote, neo-pop, broadsheet, studio, wheatpaste`.
   This is the picker's render order and is *not* the `REGISTRY` literal order.
2. **`REGISTRY` object order differs from `ORDER`** (`js/theme-bootstrap.js:15-634`):
   `default, studio, brutalist, broadsheet, field-notes, blueprint, doodle, wheatpaste, bauhaus, chinoiserie, banknote, grid, gallery, miami-deco, neo-pop, marquee`. Only `ORDER` is visitor-visible.
3. **The `default` entry has exactly four fields** — `id`, `label`, `polarity`, `colors` — no `tokens`, `fonts`, `css`, or `flags` (`js/theme-bootstrap.js:16-21`). It stamps no attribute and appends no `<link>` (`js/theme-bootstrap.js:703`).
4. **But the default path is not a no-op**: the colour loop runs unconditionally and writes **100 inline custom properties** on `<html>` (5 roles + 5×19 alpha steps) for every visitor including default (`js/theme-bootstrap.js:764-774`, `STEPS` at `:671`). A DOM-diff harness must expect that inline `style` attribute on `<html>` on every page.
5. **Four sheets exist but are inactive**: `space`, `vapor`, `wanted`, `constructivist` — their registry entries are *commented out* (`js/theme-bootstrap.js:213`, `:243`, `:428`, `:460`) and absent from `ORDER`. Their `.css` files are live on disk and unreachable.
6. **Skin `<link>`s are appended in this order: `fonts…` → `theme-base.css` → `<skin>.css`** (`js/theme-bootstrap.js:715`), at the point the bootstrap script executes. On `blog/post.html` that puts them **before** `highlight.js/github-dark.min.css` (`blog/post.html:17` vs `:19`); on every other page they land last in `<head>`. This cascade asymmetry is load-bearing (see §4).
7. **`.tc-toggle` floating FAB is dead code.** No JS creates it; `injectDom()` bails when no `.tc-nav-item` exists (`js/theme-cycler.js:558-559`). 17 skin sheets still carry `[data-style="x"] .tc-toggle` rules that never match. The `docs/theme-explorations.html` claim that FAB-less pages get a FAB is **stale**.
8. **Consequence: `privacy/`, `404.html`, `lexchat/` have no theme picker at all** — they have no nav (`grep` found zero `moving-menu`/`static-menu` in all three). They still load the bootstrap and honour `?style=`, so a skin applies, but there is no way to leave it except a reload. `blog/post.html` *does* have nav (`blog/post.html:73-83`), contradicting the architecture comment.
9. **Switching a style always navigates to the site root**: `window.location.href = '/?style=' + encodeURIComponent(id)` (`js/theme-cycler.js:276`). Picking a theme from a blog post throws you back to the home page. Fixing that is a *visible improvement*, not parity.
10. **`lexchat/index.html` never loads `css/styles.css`** (`lexchat/index.html:9-11`), only `lexchat-styles.css` + `theme-cycler.css` + the bootstrap. So it gets inline tokens with no `:root` fallback layer.
11. **Persistence is two sessionStorage keys**: `dawson-style` (`STYLE_KEY`) for the id and `dawson-theme-cycler` (`STORAGE_KEY`) for the palette-toy JSON (`js/theme-bootstrap.js:669-670`, `js/theme-cycler.js:124-125`). Both are wiped on `performance.getEntriesByType('navigation')[0].type === 'reload'` (`js/theme-bootstrap.js:674-678, 687, 730`). No localStorage anywhere.
12. **Runtime prose lives in CSS *and* in JS.** `marquee.css:572` ships a hard-coded ~1300-char ticker fallback string; `js/featured-carousel.js:388-415` overwrites `--ticker-run` at runtime from `FEATURED_PROJECTS[].tech`. Both are visitor-facing prose that must move to the prose file, and the second is *derived* prose (dedupe rule, `✷` separator, doubled run, `--ticker-dur = round(halfLen / (402/46))` seconds).
13. **No skin sheet references any `url()` asset, `@import`, or `@font-face`** (verified across all 20). All webfonts arrive as registry `fonts[]` Google Fonts URLs.
14. **The `<id>-` `@keyframes` prefix convention has zero violations** across all 20 sheets (35 keyframes total). 7 sheets have none: `bauhaus`, `brutalist`, `field-notes`, `gallery`, `grid`, `wheatpaste`, `theme-base`.
15. **Every skin sheet is correctly scoped**; the only unscoped rules anywhere are `theme-base.css`'s own `[data-style] …` / `[data-still] …` / `[data-no-tilt] …` selectors.
16. **Only 3 entries define `random` palette profiles**: `studio`, `brutalist`, `marquee`. Every other style falls back to `DEFAULT_RANDOM` (`js/theme-cycler.js:77-98`), which the comment says reproduces the pre-profile generator exactly.
17. **`grid` is the only skin with no `fonts` array** (`js/theme-bootstrap.js:369-396`) — system Helvetica, zero webfont payload. A schema that makes `fonts` required would break it.
18. **`marquee` is the only entry using `--font-heading-serif`** (`js/theme-bootstrap.js:622`, consumed 7× in `marquee.css`). Tokens are otherwise a fixed 8-key set + optional `--font-mono` (7 entries).
19. **Skins style blog-post chart widgets**: `#metr-chart` (19 sheets), `#pareto-chart`/`#kl-explainer-chart`/`#ara-objectives-chart` (17 each), `.mermaid` (17), `.uva-*` (marquee only). Post-asset DOM is part of the canonical DOM contract.
20. **The `dawson:palette` `CustomEvent` has an empty payload** (`js/theme-cycler.js:191`, `new CustomEvent('dawson:palette')` — no `detail`). Four post-asset scripts listen; they re-read CSS vars themselves.
21. **`Math.random()` is called in 3 places in the cycler** (`js/theme-cycler.js:106, 114, 255, 258` — 4 call sites, 3 distinct purposes) plus the typing engine's per-load sequence pick. The harness's `Math.random` seeding (intent §4.9) must cover both files.
22. **Every visitor-facing cycler string is hard-coded in `js/theme-cycler.js`** — 20+ strings including `Styles`, `Palette`, `Advanced`, `Back to styles`, `Shuffle colors`, `random palette`, `Reset`, `back to default`, `scheme & colors`, `done editing`, `Scheme`, `Colors`, the 5 role labels, the 6 scheme names, `current`/`preview`, and `Lock`/`Unlock <Role>` aria-labels. Full list in §3.7.
23. **Skin sheets depend on runtime-injected DOM**: `.tw`/`.tw-out`/`.typing-accent` (typing engine), `.fc-dot` (carousel), `.menu-item`/`.socials-item` (nav-config), `#cursor-container`, `.js-tilt-glare`. `.tw-anchor` and `.fc-dots` are referenced by **no** sheet.
24. **`hero-extras-in` is a class on `<html>`**, added by `js/script.js:24` after the intro; 6 sheets key off it.
25. **`theme-base.css` is only 115 lines** and is the entire shared plumbing layer: code ground, blog footer centering, reduced-motion typing guard, the stillness pack, tilt pins, and 2 mobile fixes.

---

## 2. Registry entry shape (`js/theme-bootstrap.js`)

### 2.1 Field-by-field

| Field | Type | Req? | Default | Semantics |
|---|---|---|---|---|
| `id` | string | required | — | Must equal the `REGISTRY` key. Stamped as `data-style` on `<html>` (`:704`). |
| `label` | string | required | — | The only visitor-facing string in the registry. Rendered in the picker rows, wordmark cards, and preview card (`theme-cycler.js:303, 305, 349`). |
| `polarity` | `'dark' \| 'light'` | required (all 20 have it) | `'dark'` via `DEFAULT_THEME` (`theme-cycler.js:14, 174`) | **Cycler-internal only.** Seeds `state.theme`, which selects `random[mode]`. Nothing is stamped on the DOM for it (`theme-cycler.js:100-103`). |
| `colors` | `{text,bg,primary,secondary,accent}` hex strings | required | — | The five roles. Order matters everywhere: `entryColors()` (`theme-cycler.js:11`) flattens to `[text,bg,primary,secondary,accent]` and index positions are hard-coded in `random.roles[]`, `saved.colors[]`, and `applyDerivedNeutrals()`. |
| `tokens` | `Record<string,string>` | optional (absent on `default` only) | none | Written verbatim as inline custom properties on `<html>` (`:707-711`). Only applied when `id !== 'default'`. |
| `fonts` | `string[]` (absolute Google Fonts URLs) | optional | `[]` (`:715`) | Appended as `<link rel=stylesheet>`. `grid` omits it entirely. |
| `css` | string (root-absolute path) | optional | none | The skin sheet. Absent on `default`. |
| `flags.tilt` | `false` only | optional | tilt ON | `false` stamps `data-no-tilt` (`:706`) and makes `window.__styleAllowsTilt()` return `false` (`:646-649`). Note the check is `=== false`, so `flags.tilt: true` and an absent key behave identically. |
| `flags.still` | `true` only | optional | not still | Stamps `data-still` (`:705`). Consumed exclusively by `theme-base.css:71-87`. |
| `typing` | `'cursor' \| 'letter' \| 'word'` | optional | `'cursor'` (`:654-657`) | Masthead reveal mode, read by `typing-engine.js` via `window.__styleTypingMode()`. |
| `typingDelete` | `'char' \| 'word'` | optional | `'char'` (`:664-667`) | Erase granularity, via `window.__styleTypingDeleteMode()`. Only meaningful with a cursorless `typing`. |
| `random` | `{light: Profile, dark: Profile}` | optional | `DEFAULT_RANDOM` (`theme-cycler.js:77-98`) | Palette-toy generation profile. |

`Profile = { sat: [min,max], roles: RoleSpec[5] }`;
`RoleSpec = { l: [min,max], hueT: number, sat?: [min,max] }`.
`hueT` is the role's share of the scheme's hue spread; a per-role `sat` overrides the shared draw (`theme-cycler.js:71-76, 111-118`).

No other fields exist on any entry. `window.__ACTIVE_STYLE` is set to `entry.id` (`:700`).

### 2.2 Active entries, exact values

`default` (`:16-21`) — `polarity: 'dark'`, `colors {text:#e6f1ff, bg:#1d1d1d, primary:#61ffda, secondary:#2c2c2c, accent:#61ffda}`. **Nothing else.** No attribute, no `<link>`, no token writes.

| id | label | polarity | flags | typing / typingDelete | random | fonts | css |
|---|---|---|---|---|---|---|---|
| `default` | Default | dark | — | — | — | — | — |
| `brutalist` | Brutalist | light | tilt:false, still:true | — | ✅ | 1 | brutalist.css |
| `marquee` | Marquee | light | tilt:false | word / word | ✅ | 1 | marquee.css |
| `blueprint` | Blueprint | dark | tilt:false, still:true | — | — | 1 | blueprint.css |
| `field-notes` | Field Notes | light | tilt:false | — | — | 1 | field-notes.css |
| `doodle` | Doodle | light | tilt:false | letter | — | 1 | doodle.css |
| `grid` | **Swiss Grid** | light | tilt:false, still:true | — | — | **none** | grid.css |
| `miami-deco` | Miami Deco | light | **none** | letter | — | 1 | miami-deco.css |
| `bauhaus` | Bauhaus | light | tilt:false | — | — | 1 | bauhaus.css |
| `chinoiserie` | **Porcelain** | light | tilt:false | letter | — | 1 | chinoiserie.css |
| `gallery` | Gallery | light | tilt:false, still:true | — | — | 1 | gallery.css |
| `banknote` | Banknote | light | tilt:false, still:true | word | — | 1 | banknote.css |
| `neo-pop` | **Pop Art** | light | tilt:false | letter | — | 1 | neo-pop.css |
| `broadsheet` | Broadsheet | light | tilt:false, still:true | word | — | 1 | broadsheet.css |
| `studio` | Studio | light | tilt:false, still:true | word | ✅ | 1 | studio.css |
| `wheatpaste` | **Street Poster** | dark | **still:true only** (tilt ON) | — | — | 1 | wheatpaste.css |

Four labels differ from their ids and are the visitor-facing string: `grid`→"Swiss Grid", `chinoiserie`→"Porcelain", `neo-pop`→"Pop Art", `wheatpaste`→"Street Poster".

### 2.3 Inactive (commented out, sheets on disk)

`space` "Space" dark, no flags, no typing (`:213-239`) · `vapor` "Vaporwave" dark, typing letter (`:243-265`) · `wanted` "Wanted" light, tilt:false+still:true, typing letter (`:428-456`) · `constructivist` "Constructivist" light, tilt:false, typing word + typingDelete word (`:460-495`). A comment at `:635-636` says to re-add them to `ORDER` when restoring.

### 2.4 Token keys in use

`--font-body` (19), `--font-heading` (19), `--border-radius` (19), `--radius-pill` (19), `--neutral-gray` (19), `--jobs-menu-navy-dark` (19), `--jobs-menu-navy` (19), `--jobs-menu-slate` (19), `--font-mono` (7), `--font-heading-serif` (1, marquee). Counts include the 4 commented entries.

`css/styles.css:5-25` defines the `:root` defaults for all of these plus `--socials-menu-spacer-height: 45px` and `--sec-num-color: var(--accent)` — neither of which any registry entry overrides. `--code-bg`/`--code-fg` are **not** in `:root`; they are unset at rest and only ever written by the cycler (`blog/blog-styles.css:56-58, 81` consume them with fallbacks).

---

## 3. Runtime contracts

### 3.1 Bootstrap, step by step (`js/theme-bootstrap.js`)

1. `THEME_CYCLER_ENABLED = true` → `window.__THEME_CYCLER_ENABLED` (`:7-8`). Flipping it to `false` disables `?style=`, persistence and the UI entirely.
2. Registry literal (`:15-634`), then `ORDER` (`:637`), exposed as `window.__THEME_REGISTRY` / `window.__THEME_ORDER` (`:639-640`).
3. Three function globals defined: `__styleAllowsTilt` (`:646`), `__styleTypingMode` (`:654`), `__styleTypingDeleteMode` (`:664`).
4. `isReload` computed from `performance.getEntriesByType('navigation')[0].type === 'reload'`, in a try/catch defaulting to `false` (`:674-678`).
5. **Style resolution** (`:684-698`), only if the gate is on:
   - `if (isReload) sessionStorage.removeItem('dawson-style')`.
   - `new URLSearchParams(location.search).get('style')`. If the param is a **registry key** (note: `'default'` counts, the 4 commented ids do not), it wins. `?style=default` → `removeItem`; any other valid id → `setItem`.
   - Invalid/absent param and `!isReload` → fall back to `sessionStorage.getItem('dawson-style')`, re-validated against `REGISTRY`.
   - Invalid param on a non-reload does **not** clear the session; it silently falls through to the stored id.
   - Everything is wrapped in one try/catch, so a storage exception yields `default`.
6. `entry = REGISTRY[styleId] || REGISTRY['default']`; `window.__ACTIVE_STYLE = entry.id` (`:699-700`).
7. **Stamping**, only when `entry.id !== 'default'` (`:703-722`), in this order: `data-style` → `data-still` (if `flags.still`) → `data-no-tilt` (if `flags.tilt === false`) → each `tokens` key as an inline custom property → the `<link>`s.
8. **`<link>` append order**: `entry.fonts` (in array order) → `/css/themes/theme-base.css` → `entry.css` (`:715`). Each gets `rel="stylesheet"` and `data-style-asset="1"` (`:717-719`) and is `document.head.appendChild`'d — i.e. **after every static `<head>` node parsed so far**.
9. **Colour + alpha ramp write** (`:724-774`), **runs for every style including `default`**:
   - Base = `entry.colors`; if the gate is on and not a reload, a saved `dawson-theme-cycler` blob with a 5-element `colors` array overrides it (`:733-739`). On reload the key is removed.
   - `hexToHsl` (`:744-762`), then for each of the 5 roles: `--<role>` = hex, and `--<role><a>` = `hsla(h,s%,l%,a%)` for `a ∈ STEPS` (19 values, 5…95 step 5) — **100 inline properties**.
   - Rounding: `h.toFixed(0)`, `s.toFixed(0)`, `l.toFixed(0)`. `css/styles.css:34-63` declares the same ramps statically; the inline writes win and (for default) are byte-identical by construction.

**Pre-paint critical**: everything above. The script tag is synchronous, and because the `<link>`s are appended from a blocking `<head>` script they also block first paint (comment at `:712-714`). No `Math.random` and no `Date` anywhere in this file.

### 3.2 Globals and their consumers

| Global | Set at | Consumed by |
|---|---|---|
| `window.__THEME_CYCLER_ENABLED` | `theme-bootstrap.js:8` | `theme-cycler.js:5` (early return), `nav-config.js:27` (whether to render the Theme nav item) |
| `window.__THEME_REGISTRY` | `:639` | `theme-cycler.js:9` |
| `window.__THEME_ORDER` | `:640` | `theme-cycler.js:10` |
| `window.__ACTIVE_STYLE` | `:700` | `theme-bootstrap.js:647,655,665`; `theme-cycler.js:167` |
| `window.__styleAllowsTilt()` | `:646` | `js/script.js:257, 397`; `js/featured-carousel.js:190`; `blog/blog-listing.js:142`; `blog/blog-post.js:182` |
| `window.__styleTypingMode()` | `:654` | `js/typing-engine.js:99` |
| `window.__styleTypingDeleteMode()` | `:664` | `js/typing-engine.js:109` |

### 3.3 Cycler boot order (`js/theme-cycler.js:747-770`)

`boot()` runs on `DOMContentLoaded` (or immediately if already parsed, `:772-776`): reload → clear `dawson-theme-cycler`, else `restore()`; then `injectDom()` → `applyColors()` → `renderSchemes()` → `renderPresets()`; then `requestIdleCallback(loadAllFonts, {timeout:2500})` (fallback `setTimeout(…, 800)`); then a document `keydown` handler where **Space randomizes when the dock is open** (`:764-769`), skipped if the event target is an `INPUT`/`TEXTAREA`.

`injectDom()` builds one `<aside class="tc-dock tc-mega tc-hidden" id="tc-dock" aria-label="Theme controls">` plus a `<div class="tc-scrim" id="tc-scrim">`, **both appended to `document.body`** (`:565, 570`) — deliberately not inside the nav pill, because `.moving-menu`'s `backdrop-filter` would become the containing block for the fixed panel (`:561-564`). Then `wireNavDropdown()`. If `document.querySelectorAll('.tc-nav-item')` is empty it returns **before** appending anything (`:558-559`).

### 3.4 Dock mounting / reparenting

There is **no reparenting**. The single body-parented fixed panel is *positioned* from whichever trigger's pill opened it (`position()`, `:614-627`):
`pillFor(li)` = `li.closest('.moving-menu, .static-menu, .static-menu-mobile')` with fallbacks (`:607-610`); the dock's `top = rect.bottom + 10`, `right` clamped to `EDGE = 10` and `MEASURE = 940` (`:596-597, 617-626`), with `--tc-mega-w` = the pill's width and `--tc-mega-target` = the opened width so CSS owns the morph. `reanchor()` is bound to `resize` and passive `scroll` (`:681-683`).

Open/close semantics: hover opens only when `matchMedia('(hover: hover) and (pointer: fine)')` (`:594`); click pins/unpins (`:688-697`); hover-out closes after **300 ms** unless pinned or `dock.contains(document.activeElement)` (`:703-707, 713-724`); `close()` removes `tc-mega-open` and hides after **440 ms** (`:674-676`); Escape closes (`:740-742`); the dock swallows its own clicks via `stopPropagation` (`:733`). Every fresh open resets Advanced to off (`:636`). The pill gets `.tc-lift` so it rides above the scrim (`:654-656`). Opening forces a sync reflow with `void dock.offsetWidth` (`:647`) — explicitly not rAF, because rAF is throttled in background tabs and skipped under automation. **Relevant to the Playwright harness.**

### 3.5 Palette toy state and writes

`state` (`:169-176`): `{ style, colors[5], locks[5] bool, scheme: 'random'|<scheme>, theme: 'dark'|'light', advanced: bool }`. Initial `colors` = active entry's colours, `theme` = active entry's `polarity`.

`applyColors()` (`:178-200`) writes on `document.documentElement`: `--text/--bg/--primary/--secondary/--accent` + the 100-property alpha ramp (identical formula to the bootstrap), then `applyDerivedNeutrals()`, then `persist()`, then dispatches `dawson:palette`, then repaints the preview card if it is showing the active style.

`applyDerivedNeutrals()` (`:208-232`): the derived set is `['--jobs-menu-navy-dark','--jobs-menu-navy','--jobs-menu-slate','--neutral-gray','--code-bg','--code-fg']`. If the live colours equal the active entry's base colours (case-insensitive), it **restores** the entry's token value or `removeProperty`s it. Once diverged:
`--jobs-menu-navy-dark = secondary` · `--jobs-menu-navy = blend(secondary, text, 0.18)` · `--jobs-menu-slate = blend(text, bg, 0.42)` · `--neutral-gray = blend(text, bg, 0.40)` · `--code-bg = #0d1117` · `--code-fg = #c9d1d9`.

`randomize()` (`:250-264`): base hue = the first **locked** role's hue, else `Math.random()*360`. Scheme = `state.scheme` or a uniform pick from `SCHEMES` when `'random'`. `generatePalette()` (`:100-120`) draws `hueContrast = lerp(0.33, 1.00, Math.random())`, one shared saturation from `prof.sat`, `mult = SCHEME_MULT[scheme]` (`monochromatic 0, analogous .25, complementary .33, triadic .66, tetradic .75`, `:63-69`), and per role `hueOff = role.hueT * hueContrast * mult` plus `±0.01` jitter unless monochromatic. Locked roles are preserved (`:262`).

`switchStyle(id)` (`:272-277`): no-op for an unknown id or the current style; otherwise **clears `dawson-theme-cycler`** then `location.href = '/?style=' + encodeURIComponent(id)`.

`resetToDefault()` (`:389-398`) calls `switchStyle('default')` **first** and then mutates state, clears storage, re-applies and re-renders. The navigation makes those follow-ups near-moot on the outgoing page; reproduce the observable result (land on `/?style=default` with no palette override), not the sequence.

`persist()` (`:132-141`) stores `{colors, locks, scheme, theme}` as JSON under `dawson-theme-cycler`. `restore()` (`:142-154`) requires a 5-element `colors` array, coerces `theme` to `'light'` only on an exact match, and tolerates missing `locks`/`scheme`. **No localStorage anywhere in the repo.**

`loadAllFonts()` (`:369-387`) appends every style's `fonts[]` once, deduped by href and by an existing `link[href=…]` in `<head>`, so the wordmark cards render each label in its own heading font. This means **all 15 font URLs are fetched on every page** shortly after load, not just the active style's.

### 3.6 `dawson:palette` contract

`window.dispatchEvent(new CustomEvent('dawson:palette'))` — **no `detail`** (`js/theme-cycler.js:191`), fired inside `applyColors()`, i.e. on boot, on every shuffle, on every scheme redraw, and on every colour-input `input` event. Listeners re-read CSS vars themselves:
`blog/posts/assets/metr-chart.js:210`, `blog/posts/assets/heretic-ara-charts.js:351`, `blog/posts/assets/cohorts-chart.js:709`, `blog/posts/assets/job-market-chart.js:708`.

### 3.7 Every visitor-facing string the cycler renders

From `js/theme-cycler.js` (all hard-coded; all must move to the prose file):

- Dock `aria-label`: `Theme controls` (`:514`)
- Column heading, left: `Styles` (`:520`) — flips to `Advanced` (`:414`)
- Column heading, right: `Palette` (`:540`)
- Action 1: `Shuffle colors` + sub `random palette` (`:542`)
- Action 2: `Reset` + sub `back to default` (`:543`)
- Action 3: `Advanced` + sub `scheme & colors` (`:544`) — flips to `Back to styles` + `done editing` (`:415-416`)
- Group labels: `Scheme` (`:528`), `Colors` (`:532`)
- Role names: `Text`, `Background`, `Primary`, `Secondary`, `Accent` (`:157-163`) — rendered as visible `<label>` text *and* interpolated into the lock aria-label
- Lock aria-labels: `Lock <Role>` / `Unlock <Role>` (`:462`)
- Scheme pill labels, rendered lowercase verbatim: `random`, `monochromatic`, `analogous`, `complementary`, `triadic`, `tetradic` (`:62, 487-488`)
- Preview card meta: `current` (`:551, 320`) and `preview` (`:316-317`)
- Preview card name + every row label: `entry.label` from the registry (`:303, 305, 349`)
- Role tile `title` attribute: the raw hex (`:457`, and `:243`)

From `js/nav-config.js`: the nav trigger label `Theme` and its `aria-label` (`:28-29, 105`), plus the mobile variant's icon-only button whose `aria-label` is also `Theme`.

Dead in CSS but never rendered by the current JS: `.tc-header`, `.tc-title`, `.tc-close` (`css/theme-cycler.css:111-137`) — there is **no X close button** in the mega dock. The architecture comment's "outside click/Esc/X closes" is stale on the X.

---

## 4. `css/themes/theme-base.css` (115 lines)

Loaded before the skin sheet for any non-default style. Contents, in order:

| Lines | Covers |
|---|---|
| `13-30` | Code ground: `[data-style] .blog-post-content pre { background-color:#0d1117 }`, `pre code { background:none; border:none; color:#c9d1d9 }`, `.code-copy-btn` colours `#8b949e` / `#f0f6fc` on hover. The `(0,2,0)` specificity is what beats github-dark's `.hljs`, which loads **after** the skin on `blog/post.html`. |
| `37-50` | Blog footer restore: `.footer-container.blog-footer { margin:40px auto; justify-content:center }`, `.footer-container.blog-listing-footer { margin:0 auto 40px }`, centered `.footer-text`. Comment `:32-36` explains the extra class is needed to win the tie against a skin's `.footer-container` rule that loads later. |
| `55-67` | `@media (prefers-reduced-motion: reduce)` guard for the cursorless typing spans: `#typing-text .tw`, `#blog-typing-text .tw`, `.tw-out` → `animation:none !important`, and `.tw-out { opacity: 0 }`. |
| `71-87` | **Stillness pack** (`[data-still]`): `[data-aos] { opacity:1 !important; transform:none !important; transition:none !important }`; `#cursor-container { display:none }`; `.tc-toggle:hover { transform:none }` (dead); `.tc-dock.tc-dropdown { animation:none }` (dead — the dock is `.tc-mega`, never `.tc-dropdown`). |
| `92-101` | **Tilt pins** (`[data-no-tilt]`): `transform:none !important` on `.card, .blog-card, .fc-card-image, .blog-image`; `.js-tilt-glare { display:none }`. |
| `107-114` | `@media screen and (max-width:1100px)`: `html[data-style] .nav-container { border-left:none }` and `html[data-style] .contact-image-wrapper { display:none }`. |

**Every `data-still` / `data-no-tilt` selector in the codebase is in this file.** No skin sheet keys on either attribute (the only hit, `grid.css:88`, is a comment).

Two of the four `[data-still]` rules are dead in the current UI (`.tc-toggle`, `.tc-dropdown`). Note also the `[data-still]` rules are *not* prefixed with `html`, so they'd match a `data-still` on any element; in practice only `<html>` carries it.

---

## 5. `js/nav-config.js` (164 lines, runs deferred)

### 5.1 Config shape

`window.NAV_CONFIG.NAV_LINKS` (`:8-15`) — array of `{label, href, isResume?, isBlogLink?, isThemeTrigger?}`:
`About`, `Experience`, `Projects`, `Blog`, `Contact`, `Resume`. Hrefs are computed from `isSubpage = location.pathname.indexOf('/blog') !== -1` (`:4-5`), so blog pages get `../index.html#about` etc.

`MOBILE_NAV_LINKS` (`:16-20`): `{icon:'bx bx-envelope', label:'Email'}`, `Blog`, `Resume`.

`SCROLL_THRESHOLD: 300` (`:21`) — used by the sticky-header handler at `:142-163`: below `threshold/3` the moving menu gets `.menu-invisible`; scrolling up past `threshold` adds `.menu-sticky`.

`window.SOCIAL_LINKS` (`:49-56`) — 6 entries `{href, icon, label, isCalendly?}`: LinkedIn, X (Twitter), Messenger, Email, Contact card, Schedule a call. `label` becomes the `aria-label` on the icon-only anchor (`:61`).

Calendly URL is built at click time from live CSS vars `--bg`/`--text`/`--primary`, with the as-built palette as fallback (`:37-48, 135-140`), so the popup follows the active theme.

### 5.2 Theme trigger insertion

Guarded on `window.__THEME_CYCLER_ENABLED` (`:27`). Pushes to the **end** of both arrays (`:28-29`):
- desktop: `{ label:'Theme', isThemeTrigger:true }`
- mobile: `{ label:'Theme', icon:'fa-solid fa-palette', isThemeTrigger:true }`

Rendered by `buildNavItems()` (`:98-106`) as, verbatim:

```html
<li class="tc-nav-item"><button type="button" class="menu-item tc-nav-trigger"
  aria-label="Theme" aria-haspopup="true" aria-expanded="false" aria-controls="tc-dock"
  >Theme<i class="fa-solid fa-chevron-down tc-nav-caret" aria-hidden="true"></i></button></li>
```

The mobile variant swaps `menu-item` for `socials-item` and renders the icon instead of the label (`:101-104`). Carrying `.menu-item`/`.socials-item` is what makes all 19 skins style the trigger with no extra rules.

### 5.3 DOM it renders

- `.moving-menu .menu-list` and `.static-menu .menu-list` ← `desktopHTML` (`:123-126`)
- `.static-menu-mobile .menu-list` ← `mobileHTML` (`:127-128`)
- Items are separated by `<li><span class="menu-spacer"></span></li>`, omitted after the last item (`:97`)
- `#socials-list` and `#blog-socials-list` ← `<span class="socials-menu-spacer"></span><br>` + 6 anchors + `<br><span class="socials-menu-spacer"></span>` (`:69-76`)
- `.contact-menu .menu-list` ← `<li>`-wrapped anchors joined by `<li><span class="socials-menu-spacer2"></span></li>` (`:79-84`)
- `.contact-menu-mobile .menu-list` ← plain `<li>`-wrapped anchors (`:87-92`)
- Link classes: `menu-item`, `menu-item resume-link`, `menu-item blog-page-link`, `socials-item`, `socials-item calendly-link` (`:59, 112-114`)

### 5.4 Ordering

`nav-config.js` is `defer`red on all three nav pages and loaded **before** `script.js` on `index.html` (`index.html:40` then `:41`), so the menus exist by the time `script.js` measures them. `theme-cycler.js` is `defer`red at the **end of `<body>`** on every page, so it runs after `nav-config.js` and therefore finds the `.tc-nav-item` it needs (`index.html:316`, `blog/index.html:126`, `blog/post.html:105`, `privacy/index.html:128`, `404.html:69`, `lexchat/index.html:17`). `js/script.js:219` explicitly excludes `.tc-nav-trigger` from the jQuery smooth-scroll handler.

---

## 6. Per-page resource matrix

Order is document order. "sync" = blocking, no attribute.

### `index.html`

| # | Line | Kind | Resource | Mode |
|---|---|---|---|---|
| 1 | 4-16 | meta | charset, viewport, title, description, canonical, favicon ×2, og:type/title/description/url/image, twitter:card | — |
| 2 | 19 | css | `cdnjs …/font-awesome/6.5.1/css/all.min.css` | — |
| 3 | 20 | css | `cdn.jsdelivr.net/npm/boxicons@2.0.9/css/boxicons.min.css` | — |
| 4 | 21 | css | `unpkg.com/aos@2.3.1/dist/aos.css` | — |
| 5 | 22 | css | `assets.calendly.com/assets/external/widget.css` | — |
| 6 | 23-26 | css | `css/styles.css`, `css/mobile-styles.css`, `css/featured-carousel.css`, `css/theme-cycler.css` | — |
| 7 | **27** | js | **`js/theme-bootstrap.js`** | **sync, pre-paint** — appends fonts + theme-base + skin **here, i.e. last in `<head>`** |
| 8 | 30-33 | js | gsap 3.9.1, jQuery 3.6.0, jQuery UI 1.12.1, aos 2.3.1 | defer |
| 9 | **34** | js | vanilla-tilt 1.7.0 | **sync** |
| 10 | 35 | js | Calendly widget.js | async |
| 11 | 36-38 | js | `js/blog-data.js`, `js/featured-carousel.js`, `js/typing-engine.js` | defer |
| 12 | **39** | js | `js/anim-utils.js` | **sync** |
| 13 | 40-42 | js | `js/nav-config.js`, `js/script.js`, `js/cursor-follow.js` | defer |
| 14 | 316 | js | `js/theme-cycler.js` | defer, end of body |

No inline scripts.

### `blog/index.html`

Same head shape with `../` prefixes; CSS adds `blog-listing-styles.css` (`:25`) between `featured-carousel.css` and `theme-cycler.css`. Bootstrap at `:27`, again last in `<head>`. **No gsap, no jQuery/jQuery UI.** AOS (`:29`), vanilla-tilt (`:30`) and `blog-data/featured-carousel/typing-engine/anim-utils` (`:32-35`) are all **sync** here, not deferred — a real difference from `index.html`. `nav-config.js` and `cursor-follow.js` are deferred (`:36-37`). `blog-listing.js` sync at `:125`, `theme-cycler.js` defer at `:126`. No inline scripts.

### `blog/post.html`

| # | Line | Kind | Resource | Mode |
|---|---|---|---|---|
| 1 | 4-9 | meta | charset, viewport, `<title>Loading… \| …</title>`, generic description, favicons. **No canonical, no OG** (client-rendered). | — |
| 2 | 11-16 | css | font-awesome, boxicons, `../css/styles.css`, `../css/mobile-styles.css`, `blog-styles.css`, `../css/theme-cycler.css` | — |
| 3 | **17** | js | **`../js/theme-bootstrap.js`** | sync — appends fonts + theme-base + skin **before items 4-9** |
| 4 | 19 | css | `highlight.js/11.9.0/styles/github-dark.min.css` | — **loads after the skin sheet** |
| 5 | 20-23 | js | highlight.js 11.9.0, marked 18.0.5, mermaid 11.15.0, vanilla-tilt 1.7.0 | sync |
| 6 | 24 | js | `../js/blog-data.js` | sync |
| 7 | 25-26 | js | `../js/nav-config.js`, `../js/cursor-follow.js` | defer |
| 8 | **27-58** | **inline** | mermaid init: reads `--secondary`/`--text`/`--neutral-gray` off `<html>` with default-palette fallbacks, `mermaid.initialize({startOnLoad:false, theme:'base', themeVariables:{…}, flowchart:{curve:'basis', padding:16}})`. Comment notes diagrams render once, so a live switch only shows on the next load. | sync |
| 9 | 104-105 | js | `blog-post.js` sync, `../js/theme-cycler.js` defer | — |

This is the only page where a skin sheet is not last in the cascade, and the only page with a theme-reading inline script.

### `privacy/index.html`

font-awesome, boxicons, `../css/styles.css`, `../css/mobile-styles.css`, `privacy-styles.css`, `../css/theme-cycler.css` (`:12-17`), then `../js/theme-bootstrap.js` sync at `:18`. `theme-cycler.js` defer at `:128`. **No nav → no picker.** No inline scripts.

### `404.html`

**All paths root-absolute** (comment at `:11-12`): `/css/styles.css`, `/css/mobile-styles.css`, `/css/theme-cycler.css` (`:13-15`), `/js/theme-bootstrap.js` sync (`:16`). No font-awesome, no boxicons. An **inline `<style>`** (`:18-40`) defines `.nf-container`, `.nf-code` (uses `var(--accent)`, `'SF Mono', monospace`), `.nf-text` (`var(--text)`). `theme-cycler.js` defer at `:69`. **No nav → no picker.** Visible prose: `404`, `This page doesn't exist, or it moved.`, `Back to the home page`, and the footer credit line (twice, desktop + mobile).

### `lexchat/index.html`

`lexchat-styles.css`, `../css/theme-cycler.css` (`:9-10`), `../js/theme-bootstrap.js` sync (`:11`). Body is a single `<iframe class="lexchat-iframe" src="https://dawsonamf-lexchat.hf.space">` (`:14-16`). `theme-cycler.js` defer at `:17`. **`css/styles.css` is not loaded**, so the `:root` token defaults are absent and only the bootstrap's inline writes apply. **No nav → no picker.**

---

## 7. Skin sheets (all 20)

### 7.1 Global answers

- **(b) `url()` asset references: zero** across all 20 sheets. Nothing to migrate.
- **(c) `@import`, `@font-face`, inline `fonts.googleapis`: zero** across all 20. Fonts come only from registry `fonts[]`.
- **(d) `@keyframes` prefix convention: 35 keyframes, 100% compliant** with `<id>-`. Names listed in the matrix below.
- **(e) `data-still` / `data-no-tilt`: zero** rules in any skin sheet (only `theme-base.css`). `.tc-*` usage is per-sheet, below.
- **(f) `≤1100px` media block: present in all 20.** `doodle.css` has two `max-width:1100px` blocks.
- **(h)** Every skin except `theme-base` defines `::selection` exactly once. All except `studio` and `theme-base` style the page scrollbar via `scrollbar-color` + `::-webkit-scrollbar*` on the `[data-style="x"]` element itself (which is `<html>`). Only `banknote` (1) and `space` (2) use `position: fixed` decorative chrome.

### 7.2 Matrix

| sheet | lines | keyframes | keyframe names | `.tc-*` used | `::sel` | scrollbar | fixed | `.tw*` hits | `.typing-accent` | `.fc-dot` |
|---|---|---|---|---|---|---|---|---|---|---|
| banknote | 1424 | 3 | `banknote-press-in/-out`, `banknote-job-fade-in` | dock, presets, action, schemes, toggle | ✅ | ✅ | 1 | 6 | 1 | 3 |
| bauhaus | 967 | 0 | — | dock, presets, action, schemes, toggle | ✅ | ✅ | 0 | 0 | 1 | 3 |
| blueprint | 1165 | 1 | `blueprint-job-fade-in` | dock, presets, action, schemes, role, sw, toggle | ✅ | ✅ | 0 | 0 | 0 | 3 |
| broadsheet | 997 | 3 | `broadsheet-press-in/-out`, `broadsheet-job-fade-in` | dock, presets, action, schemes, toggle | ✅ | ✅ | 0 | 5 | 0 | 3 |
| brutalist | 826 | 0 | — | dock, presets, action, schemes, toggle | ✅ | ✅ | 0 | 0 | 1 | 3 |
| chinoiserie | 911 | 3 | `chinoiserie-glaze-in/-out`, `chinoiserie-job-fade-in` | dock, toggle | ✅ | ✅ | 0 | 5 | 1 | 3 |
| doodle | 1011 | 2 | `doodle-draw-in`, `doodle-erase` | dock, toggle | ✅ | ✅ | 0 | 7 | 2 | 3 |
| field-notes | 1039 | 0 | — | dock, presets, action, schemes | ✅ | ✅ | 0 | 0 | 0 | 3 |
| gallery | 1093 | 0 | — | dock, presets, action, schemes, role, sw, toggle | ✅ | ✅ | 0 | 0 | 1 | 3 |
| grid | 1045 | 0 | — | dock, presets, action, schemes, role, sw, toggle | ✅ | ✅ | 0 | 0 | 1 | 3 |
| marquee | 2103 | 4 | `marquee-clack-in/-out`, `marquee-tick`, `marquee-job-in` | dock only | ✅ | ✅ | 0 | 4 | 0 | 5 |
| miami-deco | 890 | 2 | `miami-deco-neon-in/-out` | dock, toggle | ✅ | ✅ | 0 | 5 | 1 | 3 |
| neo-pop | 1170 | 2 | `neo-pop-pow-in/-out` | dock, presets, action, schemes, role, sw, toggle | ✅ | ✅ | 0 | 6 | 2 | 3 |
| studio | 745 | 3 | `studio-set-in/-out`, `studio-job-fade-in` | dock only | ✅ | — | 0 | 5 | 0 | 3 |
| wheatpaste | 1167 | 0 | — | dock, presets, action, schemes, role, sw, toggle | ✅ | ✅ | 0 | 0 | 2 | 3 |
| *space* (inactive) | 959 | 4 | `space-drift-far/-near`, `space-twinkle-far/-near` | dock, toggle | ✅ | ✅ | 2 | 0 | 4 | 1 |
| *vapor* (inactive) | 1020 | 2 | `vapor-flicker-in/-out` | dock, toggle | ✅ | ✅ | 0 | 7 | 6 | 1 |
| *wanted* (inactive) | 1266 | 3 | `wanted-strike-in/-out`, `wanted-job-in` | dock, presets, action, schemes, role, sw, toggle | ✅ | ✅ | 0 | 4 | 2 | 3 |
| *constructivist* (inactive) | 1163 | 2 | `constructivist-stamp-in/-out` | dock, presets, action, schemes, toggle | ✅ | ✅ | 0 | 5 | 1 | 3 |
| theme-base | 115 | 0 | — | dock, dropdown, toggle | — | — | 0 | 7 | 0 | 0 |

`.tw*` hits count `.tw`, `.tw-out` and `.tw-word` occurrences, not distinct rules.

### 7.3 (a) `content:` declarations carrying visible text

Only these, across all 20 sheets. Everything else is `content: ""` / `content: none` / `justify-content`.

| file:line | value | note |
|---|---|---|
| `marquee.css:572` | `content: var(--ticker-run, "✷ WEB ✷ iOS ✷ VISIONOS ✷ MACHINE LEARNING ✷ REINFORCEMENT LEARNING …")` | The fallback repeats that 5-term run 12 times (~1300 chars). Prose. Overridden at runtime by `featured-carousel.js`. |
| `doodle.css:535` | `content: 'currently here \2713'` | Prose (jobs rail marker + ✓). |
| `blueprint.css:652` | `content: "FIG. " counter(blueprintFig, decimal-leading-zero)` | Prose prefix. |
| `field-notes.css:523` | `content: "№ " counter(fieldNotesFig)` | Prose prefix. |
| `banknote.css:495`, `:1235` | `content: '№ '` | Prose prefix. |
| `brutalist.css:322` | `content: "■ "` | Decorative glyph. |
| `gallery.css:909` | `content: "·"` | Decorative glyph. |
| `studio.css:452`, `:651` | `content: "/"` | Decorative glyph. |
| `studio.css:95` | `content: counter(studio-nav, decimal-leading-zero)` | Generated number, no literal text. |
| `marquee.css:941` | `content: "(" counter(marquee-bullet, decimal-leading-zero) ")"` | Generated number in parens. |
| `marquee.css:1014`, `:1419` | `content: "✷"` | Decorative glyph. |
| *(inactive)* `space.css:418`, `:423` | `content: '[ '` / `' ]'` | Decorative. |
| *(inactive)* `constructivist.css:554` | `content: counter(plan, decimal-leading-zero)` | Generated number. |

Only `marquee`'s ticker and `doodle`'s "currently here" are unambiguously prose per intent §3.1; the numbered `FIG.`/`№` prefixes and the glyphs are borderline and worth an owner call.

### 7.4 (g) Runtime-injected DOM skins depend on

| selector | injected by | sheets using it |
|---|---|---|
| `#typing-text`, `#blog-typing-text` | markup, filled by `typing-engine.js` | **20 / 20** |
| `.fc-dot` | `featured-carousel.js:266` (`<button class="fc-dot" data-index aria-label="Go to slide N">`) | 19 |
| `.menu-item`, `.socials-item` | `nav-config.js:101-115` | 19 each |
| `.typing-accent` | `typing-engine.js:337, 442` (glyphs after the 2nd newline) | 14 |
| `.tw`, `.tw-out` | `typing-engine.js:337, 524, 594` | 12 each |
| `.tc-dock` | `theme-cycler.js:512-513` | 20 |
| `.tc-presets` / `.tc-action` / `.tc-schemes` | `theme-cycler.js:525, 529, 542-544` | 12 each |
| `.tc-role` / `.tc-sw` | `theme-cycler.js:457-458` | 6 each |
| `.tc-toggle` | **nothing** | 17 (all dead) |
| `#cursor-container` | markup, driven by `cursor-follow.js` | 2 (`grid`, `theme-base`) |
| `.js-tilt-glare` | vanilla-tilt | 1 (`theme-base`) |
| `hero-extras-in` (on `<html>`) | `script.js:24` | 6 |
| `.section-header-in` | `anim-utils.js:187, 260, 314` | 4 |
| `.job-in-right` / `.job-out-right` | `script.js:350-364` | 12 each |
| `.tw-word` | `typing-engine.js:150` | 0 sheets (only `css/styles.css:321`) |
| `.tw-anchor`, `.fc-dots` | `typing-engine.js:174` / markup | **0 sheets** |
| `.tc-mega*`, `.tc-stagger`, `.tc-scrim`, `.tc-preview`, `.tc-row-link`, `.tc-row-card`, `.tc-wm-name`, `.tc-sel`, `.tc-lift` | `theme-cycler.js` | **0 sheets** — skins only reach the older class names |

The skin sheets were written against the *previous* dock markup and have never been updated for the mega panel; that is why `css/theme-cycler.css` has specificity notes at `:398, 520, 587, 613` explaining how `[data-style="x"] .tc-dock` at `(0,2,0)` interacts with its own rules. Reproducing the mega markup **and** the legacy class names is required for parity.

### 7.5 Notable per-sheet oddities

- **`marquee.css` (2103 lines)** is the structural outlier: it uses `:is(#about-header-wrapper, #about, .project-section-wrapper, #selected-works-header, .featured-carousel-section, #contact-header-wrapper, #contact)` selector groups (`:1571-1592`) to re-key section headers, defines 8 sheet-local custom properties (`--edge`, `--dither-cell/-cut/-hi/-hi-base/-pivot/-range`, `--header-in-ms`), consumes `--font-heading-serif` 7×, is the only sheet touching `.calendly-link` and the only one touching a blog-post asset's `.uva-*` classes (`blog/posts/assets/underviewed-art.css`), and is the only sheet with just 3 scrollbar declarations.
- **`grid.css:88`** documents that it re-shows `#cursor-container` over `theme-base`'s `[data-still]` hide (same 1-attr + 1-id specificity), i.e. it deliberately fights the base sheet.
- **`bauhaus.css:313`** and **`marquee.css`** both special-case `#selected-works-header`, which exists **only on `blog/index.html:75`** — the blog listing's own "Selected Works" header. Home uses `#project-header-wrapper`.
- **`studio.css`** is the only skin that styles no scrollbar at all.
- **`space.css`** is the only sheet with two `position:fixed` layers (starfield drift).

---

## 8. Canonical DOM: selector-token inventory

**Method:** for each of the 20 sheets, strip `/* … */` comments (`perl -0777 -pe 's{/\*.*?\*/}{ }gs'`), extract `#[A-Za-z_][\w-]*` and `\.[A-Za-z_][\w-]*` tokens, drop hex-colour false positives, dedupe **per sheet**, then count sheets. So the number is "how many of the 20 sheets mention this token", not occurrence count. It over-counts slightly (a token appearing only inside a `content:` string or a `var()` name would land here) and does not distinguish selector position. 162 distinct tokens total.

**Used by all 20:** `#typing-text`, `#blog-typing-text`, `.tc-dock`, `.footer-text`, `.fc-card-image`, `.contact-image-wrapper`, `.blog-post-content`, `.blog-card`.

**19:** `#about-section-header`, `#blog-header`, `#contact-section-header`, `#jobs-header`, `#metr-chart`, `#project-header`, `#sub-text`, `#typing-image`, `.about-header`, `.active`, `.blog-card-date`, `.blog-card-title`, `.blog-section-header`, `.card-style`, `.card-title`, `.contact-view-left`, `.fc-card-cta`, `.fc-card-title`, `.fc-dot`, `.fc-style-floating`, `.filter-pill`, `.footer-spacer`, `.footer-text-mobile`, `.highlight`, `.job-bullets`, `.job-content`, `.job-dates`, `.job-title`, `.menu`, `.menu-item`, `.menu-scroll-wrapper`, `.menu-spacer`, `.moving-menu`, `.name-logo`, `.nav-container`, `.pill`, `.sec-num`, `.section-header`, `.section-header-spacer`, `.skills-header`, `.skills-section-header`, `.skills-text`, `.socials-item`, `.static-menu`, `.static-menu-mobile`, `.text-link`.

**18:** `.about-text`, `.blog-listing-grid`, `.contact-text`, `.double-view-left`, `.double-view-right`, `.fc-card-desc`.
**17:** `#ara-objectives-chart`, `#kl-explainer-chart`, `#pareto-chart`, `.blog-post-title`, `.contact-image`, `.mermaid`, `.selected`, `.socials-menu-spacer`, `.tc-toggle`.
**16:** `.blog-card-excerpt`, `.blog-image`, `.footer-container`.
**15:** `#socials-list`, `.featured-carousel-track`, `.footer-container-mobile`.
**14:** `#blog-socials-list`, `.typing-accent`. **13:** `.section-spacer`.
**12:** `.job-in-right`, `.job-out-right`, `.section-header-wrapper`, `.tc-action`, `.tc-presets`, `.tc-schemes`, `.tw`, `.tw-out`. **11:** `.fc-card`.
**8:** `.blog-post-container`. **7:** `.contact-menu`.
**6:** `#typing-container`, `.blog-post-header`, `.blog-post-meta`, `.cursor`, `.hero-extras-in`, `.tc-role`, `.tc-sw`.
**5:** `#typing-right`, `.contact-menu-mobile`, `.fc-expand-title`, `.menu-list`, `.nf-code`, `.node`, `.privacy-content`, `.privacy-header`, `.privacy-header-spacer`.
**4:** `#about-header-wrapper`, `#main-body`, `.blog-card-tags`, `.fc-card-body`, `.fc-card-tech`, `.featured-carousel-dots`, `.section-header-in`.
**3:** `.blog-scroll-track`, `.blog-see-all`, `.nf-text`.
**2:** `#cursor-container`, `#selected-works-header`, `.blog-card-wrapper`, `.circle-follow`, `.code-copy-btn`, `.cursor-follow`, `.has-copy-btn`.
**1 (single-sheet dependencies, still parity-critical):** `#about`, `#blog-scroll-track`, `#blog-typing-left`, `#contact`, `#contact-header-wrapper`, `#job-1`, `#jobs-section`, `#project-header-wrapper`, `#read-time`, `.aos-animate`, `.blog-footer`, `.blog-image-float-left`, `.blog-image-float-right`, `.blog-listing-content`, `.blog-listing-footer`, `.blog-post-page`, `.blog-scroll-container`, `.blog-section-wrapper`, `.calendly-link`, `.card`, `.double-view-container`, `.featured-carousel-container`, `.featured-carousel-fade-left`, `.featured-carousel-fade-right`, `.featured-carousel-section`, `.js-tilt-glare`, `.project-section-wrapper`, `.privacy-container`, `.quick-links`, `.section-header-glyph`, `.section-header-text`, `.section-header-word`, `.socials-menu-spacer2`, `.tc-dropdown`, `.uva-frame`, `.uva-refresh`, `.uva-retry`, `.uva-thumb`, `.uva-thumb-active`, `.uva-title`.

Notably: `.privacy-*` and `.nf-*` appear in 3-5 sheets, so **skins style the privacy page and the 404 page** even though neither can reach the picker. `#metr-chart` / `#pareto-chart` / `#kl-explainer-chart` / `#ara-objectives-chart` / `.uva-*` mean **blog-post asset DOM is part of the canonical DOM contract**.

---

## 9. What the `theme-explorations.html` comment gets wrong or omits

### Stale

1. **"Pages without nav menus (blog posts, privacy, lexchat, 404) get the floating `.tc-toggle` FAB instead."** Wrong twice: blog posts *do* have nav menus (`blog/post.html:73-83`), and the FAB no longer exists — `injectDom()` returns early with no `.tc-nav-item` (`theme-cycler.js:558-559`), so privacy/404/lexchat get **no** theme UI. The 17 sheets' `.tc-toggle` rules and `theme-base.css:81-83` are dead.
2. **"outside click/Esc/X closes"** — there is no X. `.tc-close` (`css/theme-cycler.css:126-137`) is unrendered.
3. **"Panel layout: header, full-width action rows … then one row per style"** — the mega panel is a 3-part flex row: left "Styles" column (list ⇄ Advanced swap), right "Palette" column (3 actions), and a preview card (`theme-cycler.js:515-556`). Advanced *replaces* the list, it doesn't expand downward (`:400-421`). Mobile reorders `.tc-mega-side` to `order:-1` and hides the preview (`css/theme-cycler.css:846-848`).
4. **"Engine + seventeen skins shipped"** / **"Shipped: … 17 names"** — 16 are in `ORDER`; 4 of the listed names are commented out. The "Shipped" list and `ORDER` disagree.
5. **"architecture in docs/THEMES.md"** (`theme-bootstrap.js:11`) — that file does not exist.
6. **"`[data-still]` … the dock FAB lift"** — the current lift is `.tc-lift` on the pill (`theme-cycler.js:655`), which no `[data-still]` rule touches.

### Omitted

7. **The default path is not asset-free at the DOM level**: 100 inline custom properties land on `<html>` for every visitor, default included (`theme-bootstrap.js:764-774`). The comment's "Default-path regression: … inline writes … identical to today" implies this but never says what is written.
8. **`?style=` is honoured on every page**, including the three with no picker. A visitor can be stranded in a skin on `/privacy/` with no way out but reload.
9. **Switching always lands on `/`** (`theme-cycler.js:276`) — the comment says "switching a style navigates to `/?style=<id>`" but does not flag that this discards the current page.
10. **`loadAllFonts()` fetches all 15 font URLs on every page** after idle (`theme-cycler.js:369-387`), regardless of whether the menu is ever opened. That is a real network-cost contract, and it conflicts with intent §3.3's "lean stays lean" if reproduced naively.
11. **`--ticker-run` / `--ticker-dur` are written on `<html>` by `featured-carousel.js:413-414`** on home and blog listing, feeding `marquee.css:572`. The comment's "Layer 4 strings (concept only; body content never changes)" understates this: prose already crosses from JS into CSS today.
12. **The `blog/post.html` cascade inversion** (skin sheet before github-dark) is why `theme-base.css:13-30` needs `(0,2,0)` specificity. The comment explains the pin but not the ordering that forces it.
13. **`Space` randomizes the palette** while the dock is open (`theme-cycler.js:764-769`).
14. **The 300 ms hover-close, 440 ms hide, `MEASURE = 940`, `EDGE = 10`** timing/geometry constants (`theme-cycler.js:596-597, 676, 706, 723`) — intent §3.2 requires "the same constants".
15. **`void dock.offsetWidth` instead of rAF** (`theme-cycler.js:639-648`), explicitly because rAF is throttled/skipped under automation. Any rewrite that "modernizes" this to rAF will make the panel look stuck in the Playwright harness.
16. **`applyDerivedNeutrals` restores by `removeProperty`** when a style has no token for a derived key (`theme-cycler.js:221`), which is how `--code-bg`/`--code-fg` return to unset.
17. **The mermaid inline init reads `--neutral-gray`** (`blog/post.html:41`), so it is coupled to the derived-neutral logic, and it does **not** listen to `dawson:palette` — diagrams keep the palette they were built with.

---

## 10. Conflicts with the intent's locked decisions

| Intent decision | Current behaviour | Impact |
|---|---|---|
| §4.5 theme in the path, `/theme/…` | `?style=<id>` query param, parsed at `theme-bootstrap.js:688`; switching hard-navigates to `/?style=<id>` (`theme-cycler.js:276`) | Redirect shim needed for `/?style=<id>` on **every** page, not just `/`. Also: today's switch loses your page; the new model should preserve it, which is a visible (welcome) change. |
| §4.5 reload keeps the theme | Reload explicitly wipes both keys (`theme-bootstrap.js:687, 730-731`; `theme-cycler.js:748-749`) | The `isReload` mechanism disappears. Anything that relied on "reload = clean default" (the QA line "style survives navigation; reload returns to default") stops being true. |
| §3.1 prose out of CSS `content:` | `marquee.css:572` ticker, `doodle.css:535` "currently here" | These become sized prose fields. The ticker is *generated* from `FEATURED_PROJECTS[].tech` at runtime; the dedupe rule, `✷` separator, ×2 doubling and `402/46` chars-per-second pairing (`featured-carousel.js:376-414`) must survive as build-time or client logic. |
| §4.7 picker reachable in every theme | Privacy / 404 / lexchat have **no** picker (`theme-cycler.js:558-559`) | This is a *change*, not parity. The floating fallback the intent describes has to be built new; the `.tc-toggle` rules in 17 sheets are a starting point but were written for a bottom-anchored FAB that no longer matches any live geometry. |
| §3.2 parity on all 16 skins | Skin sheets target `.tc-dock`/`.tc-presets`/`.tc-action`/`.tc-schemes`/`.tc-role`/`.tc-sw` only — never `.tc-mega*` | The dock's *class names and nesting* are part of the parity surface. Renaming the picker's classes silently unstyles the dock in 12-19 skins. |
| §3.3 lean stays lean | `loadAllFonts()` pulls all 15 Google Fonts URLs on every page after idle | Reproducing it exactly conflicts with the lean goal; dropping it changes how the wordmark cards look on mobile (`css/theme-cycler.css:865` shows `.tc-row-card` on ≤1100px). Owner call. |
| §4.6 posts prerender, keep hljs github-dark | github-dark loads **after** the skin sheet on posts today (`blog/post.html:17` vs `:19`) | If Astro emits stylesheets in a different order, `theme-base.css:13-22` may start winning/losing differently. Pin the order or convert the pins to `!important`. |
| §4.12 libs move CDN → npm | `blog/index.html` loads AOS/vanilla-tilt/blog-data/featured-carousel/typing-engine/anim-utils **synchronously**, `index.html` defers most of them | Execution-order differences between the two pages are load-bearing today; a uniform bundling strategy changes timing. Worth an explicit harness check on the blog listing's intro animations. |

---

## 11. Open questions / risks

**Owner decisions only they can make:**

1. Are the `FIG.`/`№`/`(01)` counter prefixes and the `✷`/`■`/`·`/`/` glyphs "prose" under §3.1, or decoration that stays in CSS? (§7.3)
2. Should privacy / 404 / lexchat gain a theme picker (§4.7 says yes; today they have none)? If yes, the FAB is new UI needing new visual approval, and the 17 sheets' stale `.tc-toggle` rules need auditing or deleting.
3. Should `loadAllFonts()` survive? It costs 15 stylesheet requests per page for a menu most visitors never open.
4. Do the 4 inactive sheets (`space`, `vapor`, `wanted`, `constructivist`) migrate, freeze, or get deleted? Intent §2 says keep the files inactive; carrying them into Astro means 4 sheets nothing type-checks against.
5. The four odd labels (`Swiss Grid`, `Porcelain`, `Pop Art`, `Street Poster`) are visitor-facing prose that must move to the YAML as approved `xs` — confirm they are final.
6. Reload-resets-theme is being deliberately dropped (§4.5). Confirm nothing else depended on it; the palette toy currently also resets on reload, and that behaviour is worth deciding separately from the theme id.

**Parity risks:**

7. **Dock class names.** 12-19 sheets style `.tc-dock`/`.tc-presets`/`.tc-action`/`.tc-schemes`, 6 style `.tc-role`/`.tc-sw`. A component rewrite that changes these names silently breaks the dock in most skins, and it will not show up in a home-page screenshot unless the harness opens the menu.
8. **`<html>`'s inline style attribute.** A naive DOM diff will flag the 100 inline properties on every page. Normalize them, or reproduce them exactly (same `toFixed(0)` rounding, same `hsla(h,s%,l%,a%)` formatting, same `STEPS` order).
9. **Stylesheet order on `blog/post.html`.** The only page where the skin sheet is not last. Any change flips ties between `theme-base.css` and github-dark.
10. **`void dock.offsetWidth`.** Keep it. rAF is skipped under automation and the panel will read as broken in the visual diff.
11. **`Math.random` seeding** must cover `theme-cycler.js:106, 114, 255, 258` and the typing engine's sequence pick, or the palette/masthead differ run to run.
12. **`--ticker-run` timing.** `--ticker-dur` is derived from the *generated* run length, so changing the dedupe rule or the project list changes the marquee's scroll speed. Pin `FEATURED_PROJECTS` content during the harness run.
13. **Sync vs deferred script order on `blog/index.html`.** Six scripts that are `defer` on home are sync there. The intro reveal timing (`anim-utils.js` pins final styles on `animationend`) can shift if bundling normalizes this.
14. **`hero-extras-in` on `<html>`** (`script.js:24`) and `.section-header-in` (`anim-utils.js`) are animation gates 6 and 4 sheets key off. They must be added at the same point in the lifecycle, or those skins' entrances never fire.
15. **`.tw-anchor`, `.fc-dots`, `.tw-word`** are injected but unstyled by any sheet — safe to change; **do not** assume the same of anything else in §8.
16. **Unverified:** I did not measure computed styles or run the site, so "identical cascade" claims here are structural (source order + specificity), not rendered. The visual harness remains the referee.
