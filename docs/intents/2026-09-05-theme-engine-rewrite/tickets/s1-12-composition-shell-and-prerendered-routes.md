# S1-12 — Wire composition, Shell, pre-paint behavior and route scaffolds

**Status:** Done with risks 2026-09-07 · **Spec milestone:** T3 · **Scope:** one engine integration

**Depends on:** [S1-11](s1-11-shared-picker-and-palette-runtime.md)

Assign one agent this ticket plus the [execution contract](../../../superpowers/plans/2026-09-05-spec-1-migration-engine.md). Read [Spec 1](../spec-1-migration-engine-parity.md) §5.2–5.4, §6.1–6.2 and D27/D29/D34/D38. Dependencies supply code and evidence; there is no owner review between tickets.

## Deliverable

64 non-post routes plus 404 using one composition decision, one Shell and correctly positioned theme assets. Structural fallback works through normal registration.

## Files

- Create: `src/layouts/compose.ts`, `src/layouts/Shell.astro`, `src/layouts/ThemeAssets.astro`, `src/layouts/canonical/Meta.astro`.
- Create initial `Home.astro`, `BlogListing.astro`, `BlogPost.astro`, `Privacy.astro`, `NotFound.astro`, `LexChat.astro` under `src/layouts/canonical/`, so every composition target exists before the full page ports.
- Create: `src/layouts/canonical/components/PalettePrepaint.astro`, `StyleQueryShim.astro`.
- Create: `src/pages/[...theme]/index.astro`, `src/pages/[...theme]/blog/index.astro`, `src/pages/[...theme]/privacy/index.astro`, `src/pages/[...theme]/lexchat/index.astro`, `src/pages/404.astro`.
- Create: `src/themes/not-found.ts`, `tests/build/composition.test.ts`, `tests/browser/theme-routing.spec.ts`, `tests/fixtures/composition/`.
- Modify: `src/layouts/types.ts`; initialize `src/themes/README.md`.

## Interfaces

- `compose(theme: Theme, page: PageContext): Promise<Composition>` resolves lazy layouts and uses the concrete page path for canonical metadata.
- `Composition` has exactly §5.2's layout/assets/picker/canonical/noindex fields. LexChat always selects mount none.
- Layout and Shell props are `{ theme, page, composition }`; Shell has no separate pageType prop and never branches on theme.kind.
- `ThemeAssets` takes theme/composition, filters projected links by assets, and emits one marker even when no links are selected.
- `resolveNotFoundTheme(pathname: string, search: string, ids: string[]): string | undefined` implements path-first, query-second selection.

## Work

- [ ] Implement the complete six-page composition table, awaiting only the selected lazy layout. Ownable pages are home/blog/post; utilities always use canonical layouts.
- [ ] Render the shared tail from composition: dock/scrim/cycler; optional FAB; optional draft pill. LexChat emits none of the picker elements/scripts.
- [ ] Put ThemeAssets and both applicable pre-paint components in each layout's own head at §6.2's position. No canonical component CSS imports, scoped styles or universal Head ladder.
- [ ] Inline the one ramp implementation for palette restoration before paint; default routes also get the style-query shim preserving remaining query/hash.
- [ ] Build the 404 in default and apply appearance data after parse. Serialize registry appearance data at build, not filesystem checks or lazy layout functions. Apply theme attributes/tokens/links and selected dock row before picker initialization; preserve saved palette overrides.
- [ ] Generate non-post routes through themeParams and test concrete canonical/noindex values. Initial content scaffolds are allowed here and replaced by page tickets; do not claim visual parity yet.
- [ ] Add an isolated structural registration with an owned home and unowned blog to prove lazy composition/fallback. Record the minimal authoring API; S1-24 expands this fixture.

## Acceptance and verification

- [ ] 16 × 4 non-post routes plus `404.html`; no double-prefix, duplicate route or extra default prefix.
- [ ] Full composition table matches §5.2, including structural utilities without theme-base and structural unowned blog with theme-base.
- [ ] Saved palette is present before first paint and survives reload on ordinary routes.
- [ ] Default `?style=brutalist` navigates to the themed same page while retaining other query/hash; unknown/default values do not misroute.
- [ ] 404 resolves valid path segment before query and handles unknown segment plus valid query. Its links remain default-theme links.
- [ ] Structural owned/fallback assets stay separated; runtime 404 bundling includes no Astro layouts or Node APIs.

```bash
node --test --test-concurrency=1 tests/build/composition.test.ts
npx playwright test tests/browser/theme-routing.spec.ts
npm run build
```

## Agent handoff

Record changed files, commands and exit results, and any interface adjustments in the completion report. Resolve implementation failures in scope; do not replace failed assertions with broader exclusions. Leave owner QA to the end of the complete migration.

## Completion report

Done with risks, 2026-09-07. Node v25.9.0 (Node 24 not installed; `.nvmrc` = 24 stays the CI contract). Worktree fast-forwarded to `7ee249e` (S1-11) before any work; `npm ci` exit 0; no other installs, no git write actions, no persistent listeners (the browser spec owns a loopback ephemeral-port server and tears it down). The sibling parity agent's Python servers on 127.0.0.1:8781/8782 were observed and left alone.

**Created:** `src/layouts/compose.ts`, `src/layouts/Shell.astro`, `src/layouts/ThemeAssets.astro`, `src/layouts/canonical/{Meta,Home,BlogListing,BlogPost,Privacy,NotFound,LexChat}.astro`, `src/layouts/canonical/components/{PalettePrepaint,StyleQueryShim}.astro`, `src/pages/[...theme]/{index,blog/index,privacy/index,lexchat/index}.astro`, `src/pages/404.astro`, `src/themes/not-found.ts`, `src/themes/README.md` (skeleton), `src/env.d.ts` (ambient `*.astro` module so plain `tsc` accepts the lazy layout imports the `LazyLayout` design requires; `astro check` resolves the real component first), `tests/build/composition.test.ts`, `tests/browser/theme-routing.spec.ts`, `tests/unit/not-found.test.ts`, `tests/fixtures/composition/{build.ts,registry.ts,stub/Home.astro,public/css/stub.css}`. **Modified:** `src/layouts/types.ts` (+`PickerMount`, `Composition`, `LayoutProps`; S1-10's `StyleExtras`/`PageContext` untouched), `tsconfig.json` (+`tests/fixtures/composition` in `exclude`, like the other fixtures), and **S1-10's `src/themes/apply.ts`** (additive: `export const THEME_BASE_CSS`; `declarations()` now throws at build when a value contains `;`, `{` or `}`, the single choke point for registry tokens, `page.styleExtras` and the 404 island). Nothing else outside the ticket's list; legacy files, `harness/`, `public/`, `scripts/`, `package.json`, `astro.config.mjs`, `src/build/*`, `CNAME`, `.nojekyll` untouched.

**Interfaces (handoff for S1-13 to S1-21, S1-24):**
- `src/layouts/types.ts`: `PickerMount = { mount: 'nav' } | { mount: 'fab'; corner: 'br'|'bl'|'tr'|'tl' } | { mount: 'none' }`; `Composition { layout: AstroComponentFactory; assets: { fonts; base; skin }; picker: PickerMount; canonical: string; noindex: boolean }`; `LayoutProps { theme; page; composition }` (every layout, canonical or theme-owned; no `pageType` prop).
- `src/layouts/compose.ts`: `composeFor(theme, type): CompositionPlan` (pure, sync, the only `theme.kind` branch in the engine; `CompositionPlan` = `Composition` with a `LazyLayout` and no `canonical`); `compose(theme, page): Promise<Composition>` awaits the layout and sets `canonical = new URL(page.path, import.meta.env.SITE).href` (no domain literal in `src/`); `routeTheme(Astro.params.theme)` maps the route param to its registry entry. Table: default = canonical layout, no assets, picker nav (privacy/notFound fab `br`, lexchat none); skin = canonical + fonts/base/skin; structural owned = own layout + fonts, fab `br`; structural unowned home/blog/post = canonical + fonts/base, nav; structural utility = canonical + fonts, fab/none. `noindex = theme.id !== 'default'`.
- `Shell.astro` (props `LayoutProps`): `<!DOCTYPE html><html lang="en" {...themeHtml(theme).attrs} style={themeHtml().style + declarations(page.styleExtras ?? {})}>`, `<head><slot name="head" /></head>`, bare `<body>` with the default slot, then only when `picker.mount !== 'none'`: `ThemeDock` (dock + scrim), `<script is:inline defer src="/js/theme-cycler.js">`, `PickerFab` when `fab`; then `DraftPill` (its inputs computed once per build, only under `PROSE_DRAFTS=allow`).
- `ThemeAssets.astro` (props `theme`, `composition`): emits the marker `<!--theme-assets-->` always, then `<link rel="stylesheet" href data-style-asset="1">` for each projected link the composition keeps (fonts by `theme.fonts`, base by `THEME_BASE_CSS`, the rest = skin). Exactly one marker per page is the S1-13 invariant.
- Head order in every canonical layout (and the stub): §6.2 tags, `/css/theme-cycler.css`, `<PalettePrepaint />`, `<StyleQueryShim theme />` (default routes only, never on 404), `<ThemeAssets />`, then the rest (OG block on home/listing, `github-dark.min.css` on posts, `.nf-*` `<style is:inline>` + FA sheet + runtime on 404). Pre-paint scripts precede the theme links so they are never stylesheet-blocked behind fonts.googleapis.com, matching the legacy bootstrap (script first, links appended by it).
- `Meta.astro` (`{ title: string; suffix?: boolean }` + a slot between `<title>` and the favicons): charset, viewport, title (`suffix` appends ` | ` + `site.titleSuffix`), slot, two favicons. Themed pages put `<link rel="canonical" href={composition.canonical}>` + `<meta name="robots" content="noindex">` in the slot; default home/listing carry canonical to self; default privacy/lexchat/404 gain no canonical.
- `PalettePrepaint.astro`: one `<script is:inline>` IIFE (no globals, try/catch) inlining `rampDeclarations.toString()`; applies `sessionStorage['dawson-theme-cycler']` only when `saved.style === (data-style || 'default')` and all five colours match `/^#[0-9a-f]{6}$/i`; writes the 100 ramp properties via `setProperty`, nothing else. `StyleQueryShim.astro` (`{ theme }`): renders only for `default`; `?style=<known id>` other than `default` → `location.replace('/' + id + pathname + remaining query + hash)`.
- 404 (`NotFound.astro`, `src/themes/not-found.ts`): built default with `page = { type: 'notFound', path: '/' }`; JSON island `<script type="application/json" id="nf-themes">` = `{ [id]: { theme: <registry entry, functions dropped by JSON.stringify>, extras: string } }` with `<` escaped as `<`; **S1-21 replaces `extras: declarations({})` with `declarations(canonicalStyleExtras(id, { carousel: false }))`.** The runtime (Astro-bundled, inlined as one `<script type="module">` in the head, before the body-end cycler) imports only `themeHtml` and `resolveNotFoundTheme(pathname, search, ids)` (first path segment, else `?style=`; `'default'` is returned and ignored by the caller), reads the island, applies attrs, `style.cssText = themeHtml(theme, savedColours?).style + extras`, appends the links with `data-style-asset="1"`, and moves the row marker (li `tc-row-sel`; a `tc-sel` + `aria-current`; card `tc-sel` + `aria-pressed`). No registry, layouts, prose or Node API in the client.
- Routes: `[...theme]/{index,blog/index,privacy/index,lexchat/index}.astro` via `themeParams()`, paths `/`, `/blog/`, `/privacy/`, `/lexchat/`; `404.astro`. S1-14 replaces the scaffold `<nav><ul><ThemePicker /></ul></nav>` on home/listing/post with `Nav.astro`; S1-17/S1-18 fill the bodies (`{/* S1-xx */}` markers) and pass `page.styleExtras`; S1-19 adds `[...theme]/blog/[id].astro` and fills `BlogPost` (`<slot />` body, title via `Meta`); S1-21 finishes privacy/404 bodies; S1-20 owns the sitemap filter.
- `src/themes/README.md` sections: overview and module graph, registry and types, projection, paths, composition table, Shell/ThemeAssets/pre-paint, picker runtime contract, 404 runtime, structural authoring (minimal API + `tests/fixtures/composition/` pointer for S1-24), verification. Fixture: `buildSite(prefix, overlay?)`/`cleanup(dir)` in `tests/fixtures/composition/build.ts` build an isolated copy under the gitignored `.tmp/`; `registry.ts` re-exports the production registry plus a structural `stub` (owned home only), and the stub needs a `themes.stub.label` prose line.

**Commands and results** (builders, four reviewers, fix agent and orchestrator; all exit 0): `npm run check` (`Result (103 files): 0 errors, 0 warnings, 48 hints`); `./node_modules/.bin/tsc --noEmit -p tsconfig.json`; `npm run build` (`65 page(s) built`: 64 route pages + `dist/404.html`; `find dist -name index.html | wc -l` = 68 including the two redirect stubs and two subsite passthroughs; no `dist/default/`, no `dist/<id>/<id>/`; one `<!--theme-assets-->` on all 65); `node --test --test-concurrency=1 tests/build/composition.test.ts` (tests 42, pass 42: §5.2 table over 3 kinds × 6 types in-process, structural fixture build with 17 × 4 routes + owned/fallback/leak/head-order/404 assertions, production build with concrete canonical/noindex/link/picker/shim/pre-paint/404-runtime assertions); `node --test tests/unit/not-found.test.ts` (8 pass); `./node_modules/.bin/playwright test tests/browser/theme-routing.spec.ts` (18 passed on desktop-1440 + mobile-390, three consecutive runs: pre-paint palette recorded while `readyState === 'loading'` and byte-equal to `rampDeclarations`, an overwritten record survives reload, `?style=` redirects with query/hash retained plus three no-misroute cases, 404 path-first/query-second/unknown with all five marker mutations and default links, LexChat picker-free); `./node_modules/.bin/playwright test tests/browser/picker.spec.ts` (28 passed); `npm run test:unit` (457 pass); `PARITY_OLD_DIR=/Users/dawsonamf/Desktop/dax/personal-website-old npm run test:build` (69 pass). Em dashes: 0 in every touched file. `git status --short`: only the paths above.

**Review:** four fresh Opus reviewers (2 correctness, security, conventions), one fix pass by a fresh Opus agent. Fixed: the 404 no longer bundles `THEMES` (a structural fixture build had emitted an empty `Home.<hash>.js` chunk and shipped `assertRegistry`), island `<` escaping, `declarations()` guard, exact link classification via `THEME_BASE_CSS`, pre-paint scripts before the theme links, production gate on the Shell's draft computation, shared test builder, and the test gaps (head position, reload proof, all marker mutations, first-segment rule, default links on the applied case, single-chunk/no-import runtime, lexchat canonical, home/blog discriminator). Rejected: dropping Meta's `suffix` (trades one duplication for four); `S1-12:` header prefixes (tree already mixed).

**Deviations / interface adjustments:** extra exports `composeFor`, `CompositionPlan`, `routeTheme`, `THEME_BASE_CSS`; Meta `suffix?` prop; `src/env.d.ts` and the `tsconfig.json` exclude; the `apply.ts` edits above; pre-paint scripts placed before `ThemeAssets` (§5.4 literal, legacy DOM order; §6.2's "theme links here" still immediately follows them); the 404 runtime reads an island instead of importing the registry (the ticket's "serialize registry appearance data, not lazy layout functions"), and Astro inlines it because it is small; scaffold trigger mounts on home/listing/post so D30 holds on every picker-enabled page now; `BlogPost.astro` is never rendered until S1-19.

**Accepted risks:** Node 25 instead of 24. The `declarations()` guard has no negative unit test yet (S1-16 adds it with the first prose-built producer; CSS quoting of `ticker`/`currentlyHere` stays the producer's job, the guard only blocks `;{}` break-outs). The fixture under `tests/fixtures/composition/` is excluded from `astro check`/`tsc` (its imports resolve only inside the temp copy), so a contract break there surfaces as a failed fixture build. `dist/sitemap-0.xml` lists the 63 themed routes until S1-20 adds the filter. Scaffold bodies are not visual parity (by ticket design); the LexChat iframe attributes serialize on one line (parsed DOM identical to legacy). Two copies of the palette-record validator (`.every` vs indexed loop) are equivalent for JSON input. Calendly CSS stays unpinned as in legacy. **Environment blocks:** none.
