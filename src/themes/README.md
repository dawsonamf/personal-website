# Theme authoring and runtime contracts

This is the live guide for the Astro theme engine.
`archive/themes/prototypes/theme-explorations.html` is frozen design research, and OLD commit
`0f196d094ad64383ec58df5472fc12d403f846b3` is a historical oracle. Neither is an active
implementation source.

## Architecture

The build graph runs in one direction:

```text
themes/types <- themes/registry <- themes/paths <- canonical layouts
                                               <- layouts/compose <- pages
```

`src/themes/registry.ts` contains 16 active entries in the ordered `THEMES` array: default plus 15
skins. Its order is picker order. A `skin` restyles canonical DOM; a `structural` theme owns one or
more lazy layouts for `home`, `blog` or
`post`. Privacy and 404 are utilities and are never structurally owned. `assertRegistry()` rejects
duplicate, reserved or non-URL-safe ids and structural entries without an owned layout. Picker
labels live at `themes.<id>.label` in `src/content/prose.yaml`; the strict prose schema derives those
keys from `THEME_IDS`, so registry registration is also schema registration.

`src/layouts/compose.ts` is the only skin/structural/fallback branch. Page entrypoints resolve a
registry theme and ask `compose()` for the layout, projected assets, picker mount, canonical URL and
noindex state. `Shell.astro`, `ThemeAssets.astro`, page files and browser scripts render that result;
they do not re-derive the branch.

| Theme and page | Layout | Projected theme assets | Picker |
|---|---|---|---|
| default, any page | canonical | none | nav; Privacy/404 use FAB |
| skin, any page | canonical | fonts, `theme-base.css`, skin CSS | nav; Privacy/404 use FAB |
| structural, owned home/blog/post | owned | fonts only | FAB by default |
| structural, unowned home/blog/post | canonical fallback | fonts, `theme-base.css` | nav |
| structural, Privacy/404 | canonical utility | fonts only | FAB |

LexChat is an external project CTA to `https://huggingface.co/spaces/dawsonamf/lexchat`. It has no
local page, redirect, picker exception or engine page type.

## Projection, paths and head order

`src/themes/apply.ts` owns the single `themeHtml(theme, colors?)` projection. It returns `<html>`
attributes, ordered inline declarations and stylesheet URLs. A non-default skin adds `data-style`
plus any `data-still`, `data-no-tilt`, `data-typing` and `data-typing-delete` attributes, then token
declarations and the palette ramp. The default adds no attribute or stylesheet, but still writes
the five raw hex roles and 95 `hsla()` steps, exactly 100 inline custom properties.

`src/themes/ramp.ts` is the sole authored ramp formula. `PalettePrepaint.astro` stringifies it into
the head, and `scripts/build-picker.mjs` injects the same function into the marked generated region
of the classic picker script. The official `dev`, `build` and `build:preview` package commands run
`picker:build` before Astro can copy `public/`. After changing the ramp, run `npm run picker:build`;
`node scripts/build-picker.mjs --check` is the non-writing drift check. The generated region in
`public/js/theme-cycler.js` is output, not an authoring surface. Keep `rampDeclarations()`
self-contained and limited to TypeScript syntax Node 24 can erase because both consumers use its
`toString()` value.

Each layout owns its complete head. `ThemeAssets.astro` emits one `<!--theme-assets-->` marker at
the layout-selected position and filters the projection without inspecting `theme.kind`. Canonical
post pages deliberately place theme assets before `github-dark.min.css`; the higher-specificity
pins in `theme-base.css` preserve the fixed code-block ground and token colors. Page-derived CSS
values such as `--prose-*`, `--ticker-run` and `--ticker-dur` arrive through
`PageContext.styleExtras`; `declarations()` rejects declaration-breaking characters.

Use `href(path, theme.id)` from `src/themes/paths.ts` for every internal link. Schemes,
protocol-relative URLs and fragments pass through; relative paths throw; root-absolute static URLs
stay unthemed; other root-absolute page URLs gain the theme segment. Asset paths in CSS and
frontmatter are root-absolute because `public/` is copied verbatim.

## Authoring a skin

A skin is a local three-file addition for the shipped contract:

1. Add one ordered `kind: 'skin'` entry to `src/themes/registry.ts`. Supply a URL-safe id, polarity
   and all five colors. Add tokens, Google Font CSS2 URLs, a `/css/themes/<id>.css` URL, motion/tilt
   flags, typing modes or light/dark random profiles only when the design uses them. An omitted
   `fonts` list is valid; an omitted random profile uses the picker runtime's `DEFAULT_RANDOM`.
2. Add the approved `themes.<id>.label` value to `src/content/prose.yaml`. Use the normal draft flow
   for new wording. Do not add a second schema key list.
3. Add `public/css/themes/<id>.css`. Scope every selector under `[data-style="<id>"]`, prefix every
   global `@keyframes` name with `<id>-`, and use root-absolute asset URLs. `theme-base.css` already
   owns code-block ground, centered blog footers, reduced-motion typing, still/no-tilt rules and the
   shared 1100px canonical fixes. The skin sheet owns its visual language across canonical Home,
   listing, posts, Privacy, 404 and picker states.

Map `text`, `bg`, `primary`, `secondary` and `accent` visibly, including randomized values. Check
the canonical post widgets and Mermaid ground as well as ordinary page chrome. CSS decoration can
remain literal; visitor-facing words belong in prose. The carousel ticker text and duration are
already derived at build time, not supplied by skin CSS or runtime markup builders.

The retired `space`, `vapor`, `wanted` and `constructivist` sheets and their exact former metadata
live under `archive/themes/inactive-skins/`. Reactivation means translating the historical entry
into the current typed registry, adding its approved YAML label, moving the sheet into `public/`,
and auditing it against current canonical DOM. Do not restore the old bootstrap, `ORDER`, runtime
globals or query-based architecture.

## Authoring a structural theme

The inert example under `archive/themes/structural-example/` demonstrates the source shape. Follow
the same workflow with the real theme id:

1. Add a `kind: 'structural'` registry entry with its palette, tokens, fonts and narrow random
   profiles. Register at least one lazy layout, for example
   `layouts: { home: () => import('./my-theme/Home.astro') }`.
2. Add the approved picker label in `src/content/prose.yaml`.
3. Add the owned layout under `src/themes/<id>/`. Accept `LayoutProps`, wrap the page with `Shell`,
   and own the complete head and DOM. Include the owned stylesheet, shared
   `/css/theme-cycler.css`, Font Awesome for a FAB, `PalettePrepaint` before `ThemeAssets`, and an
   owned script only when behavior requires one.
4. Read copy through the public `prose` accessor (`text`, `get`, `list`, `paragraphs`, `has`) and
   pass internal links through `href()`. Split-text inputs must use `prose.text()` so they are plain
   escaped strings rather than HTML fragments.
5. Put root sizing and responsive structure in the owned stylesheet. If mobile and desktop need
   different DOM, render both and switch them with the theme's media query. JavaScript must not
   choose the layout from a boot-time width. Test resize in both directions.
6. Keep owned state under `theme.<id>.*`. The canonical palette key remains
   `dawson-theme-cycler`; a structural script does not reuse it for theme-owned state. Prefix
   document SVG ids with `theme-<id>-` and keep heavy assets on owned pages only.
7. Ship a readable no-JavaScript path and a `prefers-reduced-motion: reduce` branch. If a curtain,
   preloader or script hides content, provide `<noscript>` markup that reveals or replaces it. The
   shared picker and palette are enhancements; the built page, navigation and prose remain useful
   without them.

A route unique to one theme remains an ordinary Astro page file and needs no speculative registry
field. Add that page only with its real consumer and verify its route and asset boundary separately.

An owned layout imports only its own CSS/script plus explicit shared Shell/picker components.
Canonical scripts and libraries do not load there. Canonical fallbacks load the structural font and
`theme-base.css`, never the owned stylesheet or script. Utilities load only the structural font.
This isolation is the reason a structural theme can use different DOM without teaching canonical
behavior about it.

## Split text, motion and mobile safety

The typing engine reads `data-typing` and `data-typing-delete` once per run. Cursorless modes wrap
glyphs in `.tw` spans, keep each word inside `.tw-word` to prevent mid-word line breaks, retain
deleted spaces and breaks during the 300ms drain, and keep a zero-width `.tw-anchor` while text is
empty. Style those existing hooks; do not split prose HTML yourself. The second newline's glyphs
also carry `.typing-accent`.

`anim-utils.js` preserves the original section title on the node, wraps it once, and only explodes
headers into glyphs for ids in its audited `GLYPH_SKINS` map. Glyphs stay grouped in
`.section-header-word` spans. Adding a new per-glyph header treatment changes canonical behavior
and needs an explicit audit; ordinary skins use the whole-text wrapper. Intro animations rely on
their `animationend` handlers to pin visible final styles, so use a reduced-motion override that
lands content in its final readable state rather than removing an animation that owns visibility.

Canonical CSS and `script.js` share the 1100px breakpoint. Structural themes own their breakpoint
in CSS and must keep both desktop-to-mobile and mobile-to-desktop transitions valid. The picker
uses touch/click everywhere and adds hover behavior only for fine pointers. On narrow screens its
side column moves first and the preview card hides. `data-still` suppresses AOS entrances and the
cursor follower; it does not suppress the current `.tc-lift` applied to the active picker pill.

## Picker and persistence

The picker DOM is build output from `ThemeDock.astro`. The classic runtime creates no markup and
defines no global. Every mount is `.tc-nav-item` containing `button.tc-nav-trigger`; canonical Home,
listing and post pages use nav mounts, while Privacy, 404 and structural owned pages use the real
`.tc-fab` mount. The retired `.tc-toggle` and `.tc-close` selectors have no contract. The dock closes
through its trigger, outside click or Escape; there is no X button.

The panel has three columns: Styles on the left, Palette actions on the right and a preview card.
Advanced replaces the Styles list with schemes and role controls. The body-parented fixed panel
measures the active nav pill or FAB, caps width at 940px with a 10px viewport edge, waits 300ms on
hover-close and hides 440ms after collapse. Opening deliberately reads `dock.offsetWidth` to commit
the closed state before transition; replacing it with `requestAnimationFrame` breaks background and
automated runs. Pressing Space randomizes while the dock is open and focus is outside an input.

Each row's build-authored `href` points to the same page in that theme, so switching preserves the
page and clears the old theme's palette. On default routes, `StyleQueryShim.astro` converts a valid
`?style=<id>` to the corresponding themed path while preserving other query parameters and the
hash. The runtime 404 separately resolves its first path segment, then `?style=`, from its JSON
appearance island. It is the only page that applies a route theme after parse.

The shared record is:

```text
sessionStorage['dawson-theme-cycler'] =
  { style, colors: [5 '#rrggbb'], locks: [5 boolean], scheme, theme }
```

It survives navigation and reload. Pre-paint restores only a valid five-color record whose `style`
matches the page; the picker later restores controls and derived values. A palette change writes
the five roles and 95 steps, derives the jobs/code neutrals, persists, and dispatches the payload-free
`window` event `dawson:palette`. Returning to base restores captured token values and removes
derived properties that were originally absent. Plotly post assets listen and redraw from CSS vars;
Mermaid initializes once from `--secondary`, `--text` and `--neutral-gray` and does not redraw on
that event.

After first paint, `loadAllFonts()` loads every font URL carried by picker skin rows so their
wordmarks render correctly. It is idle and idempotent, but picker-enabled visitors pay those
non-blocking requests even when they never open the panel. Structural-only owned assets never ride
on rows and are not fetched by this pass.

With JavaScript disabled, themed paths still contain their build-projected attributes, palette,
styles and static content. Picker controls, `?style=` conversion, saved-palette restoration and
interactive behavior do not run. The single `404.html` remains its default build projection because
its path/query theme resolution is necessarily runtime.

## Retained classic modules

These scripts have document-lifetime listeners and no SPA teardown because navigation loads a new
document. Structural owned pages load none of the canonical-only modules.

| Module | Owner and DOM/data inputs | Dependencies | Initialization and lifecycle |
|---|---|---|---|
| `anim-utils.js` | canonical animation helpers; animation targets and section-header DOM | DOM, RAF, `matchMedia`, optional `IntersectionObserver` | plain script; initializes at DOM ready, exposes three helpers, then owns observer/scroll/resize/RAF work |
| `cursor-follow.js` | canonical cursor chrome | DOM, RAF | deferred IIFE; no-op without cursor nodes; delegated pointer listeners and RAF live for the document |
| `featured-carousel.js` | canonical carousel interaction; build-rendered cards/dots | `VanillaTilt`, DOM, RAF/timers | Home/listing caller invokes once; click/scroll/wheel listeners live for the document |
| `nav-behavior.js` | canonical moving nav and Calendly anchors | DOM/CSS roles, optional `Calendly` | deferred immediate init; node flags prevent duplicate binding; click/scroll listeners live for the document |
| `script.js` | canonical Home behavior and build-rendered Home DOM | AOS, jQuery/UI easing, VanillaTilt, typing/animation globals, carousel | mixed immediate and DOM-ready setup; window/rail/jobs listeners and observers live for the document |
| `blog-listing-client.js` | canonical listing filters, typing and carousel | AOS, VanillaTilt, typing/animation globals, carousel | synchronous end-of-body init; filter/resize/animation listeners live for the document |
| `blog-post-client.js` | canonical post copy/read-time/Mermaid/image tilt | Clipboard, optional Mermaid and VanillaTilt | synchronous end-of-body init; delegated copy listener and at most one DOM-ready Mermaid callback |
| `theme-cycler.js` | shared picker; rendered dock, rows, triggers and owned data attributes | DOM, theme-cycler CSS and Font Awesome presentation | deferred DOM-ready init; no-op without dock; document/window/control listeners, timers and idle font load live for the document |
| `typing-engine.js` | reusable canonical masthead choreography | caller config, owned text node, DOM/fonts/timers | called by Home/listing clients; one timed run per call, with load/resize measurement for the document |

Canonical load ownership is explicit in `Home.astro`, `BlogListing.astro` and `BlogPost.astro`.
Privacy and 404 load the shared picker family only. Static carousel cards, dots and ticker values are
build output; there is no runtime static-markup builder.

## Verification

Run the production build, which includes static diagnostics and prose validation:

```bash
npm run build
```

For theme changes, inspect Home, the blog listing, representative posts, Privacy and 404 at desktop
and mobile widths. Exercise navigation, both pointer and touch picker paths, palette persistence,
first paint, reduced motion, no-JavaScript readability, resize in both directions and structural
asset isolation. Keep the LexChat CTA external and confirm no local LexChat route is emitted.
