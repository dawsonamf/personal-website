# Structural authoring proof

This fixture follows the public structural-theme workflow in `src/themes/README.md`. It is
applied only to an isolated copy of the site.

1. Add one `structural` entry to `src/themes/registry.ts`. Give it an id, base five-role
   palette, declared random profiles, fonts, tokens, and a lazy `layouts.home` import.
2. Add the matching approved `themes.author-proof.label` entry to
   `src/content/prose.yaml`. The strict themes schema is derived from `THEME_IDS`, so this
   registry entry is the schema registration and no separate schema edit is required.
3. Add `src/themes/author-proof/Home.astro`. It accepts `LayoutProps`, uses the public prose
   accessor, uses `href()` for internal links, and owns its head and DOM while sharing Shell,
   ThemeAssets, PalettePrepaint, and the FAB palette runtime.
4. Add `/css/author-proof.css` and `/js/author-proof.js`. The stylesheet owns root sizing,
   its responsive layout, and visible mappings for all five palette roles. The script keeps
   fixture-owned state under `theme.author-proof.*` and does not choose a breakpoint.
5. Build and run the ordinary content, route, Shell, resource-isolation, picker, resize, and
   first-paint checks. Compare the isolated source changes to `allowed-change-manifest.json`.
6. Build a fresh production copy and verify that the fixture id, route, prose, and assets are
   absent.

The browser check has an explicit scratch contract:

```bash
PARITY_OUT_DIR=/private/tmp/theme-engine-openai/s1-24/parity/manual TEST_BUILD_OUT_DIR=/private/tmp/theme-engine-openai/s1-24/builds/manual npx playwright test harness/theme-authoring.spec.ts
```
