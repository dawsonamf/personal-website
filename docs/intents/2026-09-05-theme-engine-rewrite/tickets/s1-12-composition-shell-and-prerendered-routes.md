# S1-12 — Wire composition, Shell, pre-paint behavior and route scaffolds

**Status:** Unstarted · **Spec milestone:** T3 · **Scope:** one engine integration

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
