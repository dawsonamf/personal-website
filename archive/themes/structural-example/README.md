# Structural theme authoring example

This reusable example came from the retired browser-test fixture. It shows the smallest practical
structural theme source set:

- `registry-entry.ts.txt`: typed registry entry, palette, tokens, fonts, random profiles, and lazy
  layout registration.
- `Home.astro.txt`: owned Home layout. Rename it to `Home.astro` only after placing it under the new
  theme's source directory and updating its imports and asset paths.
- `author-proof.css` and `author-proof.js`: isolated structural assets.

Adapt the ids and filenames together, add an approved `themes.<id>.label` value to
`src/content/prose.yaml`, and follow `src/themes/README.md`. The layout accepts `LayoutProps`, reads
copy through `prose`, routes internal links through `href()`, owns its head and DOM, and shares
`Shell`, `ThemeAssets`, `PalettePrepaint`, and the FAB picker runtime. The stylesheet demonstrates
desktop and mobile DOM and maps all five palette roles. The script keeps owned state under
`theme.author-proof.*` and leaves breakpoint choice to CSS.

This directory is inert reference material; archived `.astro` source uses a `.txt` suffix so Astro
cannot compile it accidentally.
