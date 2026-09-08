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
| `default` | canonical | none | nav; privacy/404: fab |
| skin, any page type | canonical | fonts, `theme-base.css`, skin css | nav; privacy/404: fab |
| structural, page type in `layouts` | the theme's layout | fonts | fab; an own-mount declaration is added with its consumer (§11) |
| structural, unowned home/blog/post | canonical | fonts, `theme-base.css` | nav |
| structural, utility page type | canonical | fonts | privacy/404: fab |

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

Use this workflow for the contract Spec 1 ships:

1. Add one typed registry entry with `kind: 'structural'`, a URL-safe `id`, `polarity`, the five
   colors (`text`, `bg`, `primary`, `secondary`, `accent`), optional tokens/fonts/random profiles,
   and at least one lazy owned layout such as
   `layouts: { home: () => import('./my-theme/Home.astro') }`.
2. Add the matching approved `themes.<id>.label` to `src/content/prose.yaml`. The strict
   `themes` object in `src/prose/schema.ts` is derived from `THEME_IDS`, so registry registration
   is also schema registration. Do not add a parallel label schema or theme-id branch.
3. Add the owned layout under `src/themes/<id>/`. It accepts `LayoutProps`, wraps its content in
   `Shell`, and owns its DOM and head. The head includes its own stylesheet, shared
   `/css/theme-cycler.css`, Font Awesome for the FAB, then `PalettePrepaint` before `ThemeAssets`.
   Add a theme script only when the theme owns behavior; keep its state under `theme.<id>.*`.
4. Read sized copy only through the bound public `prose` accessor (`text`, `get`, `list`,
   `paragraphs`, or `has`). Use `href()` for every root-absolute internal navigation target.
5. Put root sizing and responsive structure in the owned stylesheet. If desktop and mobile need
   distinct DOM, render both and toggle them with the theme's media query. Do not select a layout
   from a boot-time width flag. Map all five shared palette roles into visible theme styling and
   leave the shared randomizer enabled.
6. Build an isolated copy and verify the owned page, canonical fallback listing/posts,
   Privacy/404, exact loaded resources, picker switching, resize in both directions, saved
   palette restoration, and the source-change manifest. Then build ordinary production and
   verify the fixture id, prose, routes, picker row, CSS, and script are absent.

The browser proof requires both output roots explicitly so every build, trace and cleanup record
stays outside the checkout:

```bash
PARITY_OUT_DIR=/private/tmp/theme-engine-openai/s1-24/parity/manual TEST_BUILD_OUT_DIR=/private/tmp/theme-engine-openai/s1-24/builds/manual npx playwright test harness/theme-authoring.spec.ts
```

An executable example lives in `harness/fixtures/theme-authoring/`. Its README records these same
steps, `allowed-change-manifest.json` names the five files changed inside the isolated copy, and
`tests/build/theme-authoring.test.ts` plus `harness/theme-authoring.spec.ts` prove the build and
browser behavior. Unowned Home/listing/post pages fall back to canonical layouts with the
structural theme's fonts and `theme-base.css`; Privacy and 404 use canonical utility layouts with
the structural fonts only. A theme-only route remains an ordinary page file and needs no registry
field.

## Verification

```bash
npm run check                                   # astro check
npm run build                                   # prose:check, astro check, astro build
npm run test:unit                               # pure contracts
npm run test:build                              # build-level fixtures
./node_modules/.bin/playwright test tests/browser/theme-routing.spec.ts   # the runtime halves
```
