# The theme engine

How a theme becomes a page. Skeleton written by S1-12; S1-24 adds the demonstrated authoring
walkthrough and S1-25 finishes the documentation. Spec 1 is the authority where this file and the
spec disagree: `docs/intents/2026-09-05-theme-engine-rewrite/spec-1-migration-engine-parity.md`.

## Overview and module graph

One direction, no cycles (§3.3): `themes/types` ← `themes/registry` ← `themes/paths` ←
`layouts/canonical/*` ← `layouts/compose` ← `pages/*`.

`themes/ramp.ts` and `themes/apply.ts` import nothing else from `src/`, because the 404's client
script and the pre-paint component bundle them. `themes/validate.ts` is the only module here that
touches the filesystem and must never reach a browser bundle.

## Registry and types

`registry.ts` holds `THEMES` (array order is picker order), `THEME_IDS` and `RESERVED_IDS`; it is
pure data plus `assertRegistry`. `types.ts` has the discriminated union: a `skin` restyles the
canonical DOM, a `structural` theme owns layouts for some of `home`/`blog`/`post` through
`layouts: Partial<Record<OwnablePageType, LazyLayout>>`. Utility pages are never owned. Reserved ids
are the URL segments and build output a theme id would collide with. `assertRegistry` also holds
an id to `/^[a-z0-9-]+$/`, which is load-bearing rather than tidiness: the id is the `?style=`
redirect target, the 404's `#tc-presets a[data-id="..."]` selector and the route path segment.

## Projection: theme to HTML

`apply.ts` exports the one projection, `themeHtml(theme, colors?) -> { attrs, style, links }`
(D33), `THEME_BASE_CSS` and `declarations(map)` for `--prop:value;` serialisation. `declarations()`
throws on a value containing `;`, `{` or `}`, and every `styleExtras` value reaches it at build
through the Shell, so no page-supplied string can append a declaration of its own. `ramp.ts` exports
`rampDeclarations(colors)`: the 5 raw-hex base roles and 95 `hsla()` steps, self-contained so the
pre-paint script can inline it. Three adapters consume the projection: the Shell, `ThemeAssets` and
the 404's runtime script.

## Paths

`paths.ts` exports `href(path, theme?)`, the only way a component writes an internal link (D31): it
throws on a relative path and prefixes `/<theme>` onto every root-absolute path that is not in
`STATIC_PREFIXES`. `themeParams()` supplies `getStaticPaths()` for `src/pages/[...theme]/`, with
`{ theme: undefined }` for the default theme's root routes.

## Composition

`layouts/compose.ts` decides a page once (§5.2, D34). `composeFor(theme, type)` is pure and
synchronous and holds the whole table; `compose(theme, page)` awaits the selected lazy layout and
adds the canonical URL; `routeTheme(param)` maps a route param to its registry entry.

| theme, page type | layout | assets | picker |
|---|---|---|---|
| `default` | canonical | none | nav; privacy/404: fab; lexchat: none |
| skin, any page type | canonical | fonts, `theme-base.css`, skin css | nav; privacy/404: fab; lexchat: none |
| structural, page type in `layouts` | the theme's layout | fonts | fab; an own-mount declaration is added with its consumer (§11) |
| structural, unowned home/blog/post | canonical | fonts, `theme-base.css` | nav |
| structural, utility page type | canonical | fonts | privacy/404: fab; lexchat: none |

Nothing else in the engine branches on `theme.kind`.

## Shell, theme assets, pre-paint

`layouts/Shell.astro` emits `<html lang="en" {...attrs} style={…}>`, the layout's head slot, the
page content, then the tail of `<body>`: dock and scrim, `/js/theme-cycler.js`, the FAB when the
mount is `fab`, and the draft pill. A `none` mount emits none of the picker elements or scripts.

`layouts/ThemeAssets.astro` emits the `<!--theme-assets-->` marker and the projected links the
composition selects, as `<link rel="stylesheet" href data-style-asset="1">`. **The layout places
it**, at §6.2's position (where today's runtime append lands), and the checks integration asserts
exactly one marker per page.

`canonical/components/PalettePrepaint.astro` restores a saved palette before first paint by
inlining `rampDeclarations`; it applies a record only when its `style` matches this page's theme.
`canonical/components/StyleQueryShim.astro` renders only on default routes and redirects
`?style=<id>` to that theme's path, keeping the rest of the query and the hash. Both sit in the
head immediately after `/css/theme-cycler.css` and BEFORE `ThemeAssets`, which is the order the
bootstrap produced: it ran, then appended the links, so the inline script was never blocked behind
a fonts.googleapis.com stylesheet. The 404 carries the pre-paint component and never the shim.

## Picker runtime contract

`public/js/theme-cycler.js` documents its own inputs in its header comment: read it before changing
any dock markup. It is a classic script, defines no global and creates no DOM; a mount is a
`.tc-nav-item` element containing a `button.tc-nav-trigger` (D30). Its storage record is
`sessionStorage['dawson-theme-cycler'] = { style, colors: [5 '#rrggbb'], locks, scheme, theme }`,
and both the runtime and the pre-paint script ignore a record whose `style` is not this page's.

## The 404 runtime

`themes/not-found.ts` exports `resolveNotFoundTheme(pathname, search, ids)`: path segment first,
`?style=` second. `canonical/NotFound.astro` serialises the registry into one JSON island,
`#nf-themes` = `{ [id]: { theme, extras } }`, where `extras` is the page's `<html style>` tail as a
serialised declaration string (S1-21 fills it; it is `''` until then). The bundled script imports
only `apply.ts` and `not-found.ts`, never the registry: `JSON.stringify` drops a structural theme's
function-valued `layouts`, so no `.astro` layout can reach the client graph, and the ids come from
`Object.keys` of the island. It applies `themeHtml()` to the document, writes `style + extras`,
appends the links and moves the dock's current-row marker. It must run before the picker runtime and
do its work synchronously at its own execution (D27).

## Authoring a structural theme

The minimal API:

1. Register it: `{ kind: 'structural', id, polarity, colors, tokens?, fonts?, layouts: { home: () => import('./home/Home.astro') } }`.
2. Add `themes.<id>.label` to `src/content/prose.yaml`.
3. Your layout takes `LayoutProps`, wraps `<Shell>` and writes its own head: `/css/theme-cycler.css`,
   then `PalettePrepaint`, then `ThemeAssets`, plus a Font Awesome sheet for the FAB glyph.
4. Use `href()` for every internal link; sized prose comes from the accessor.

Unowned page types fall back to the canonical layouts with your fonts and `theme-base.css`.

A working example of exactly those four steps lives in `tests/fixtures/composition/`: `registry.ts`
is the registration (overlaid onto this directory's `registry.ts` inside an isolated test build
only) and `stub/Home.astro` is the owned layout, head and all. `tests/build/composition.test.ts`
builds it and asserts the fallback; S1-24 expands it into the full walkthrough of §5.3.

## Verification

```bash
npm run check                                   # astro check
npm run build                                   # prose:check, astro check, astro build
npm run test:unit                               # pure contracts
npm run test:build                              # build-level fixtures
./node_modules/.bin/playwright test tests/browser/theme-routing.spec.ts   # the runtime halves
```
