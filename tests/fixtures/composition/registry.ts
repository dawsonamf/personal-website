// S1-12 acceptance fixture: the structural registration, overlaid onto src/themes/registry.ts
// inside an isolated temp build only (the plan's "S1-24 fixture registration occurs in an
// isolated copy"). The test copies the real registry to ./registry.prod.ts first, so the
// production data and assertRegistry are reused rather than restated, and every consumer
// (compose, paths, the prose schema, the dock, the 404) sees exactly one extra theme.
//
// Paths here resolve from src/themes/ in the temp copy, not from this directory, which is why
// tsconfig.json excludes tests/fixtures/composition.
import { RESERVED_IDS, THEMES as PROD_THEMES, assertRegistry } from './registry.prod.ts';
import type { StructuralTheme, Theme } from './types.ts';

export { RESERVED_IDS, assertRegistry };

/** The minimal structural theme: one owned page type, its own font, no skin sheet. */
const STUB: StructuralTheme = {
  kind: 'structural',
  id: 'stub',
  polarity: 'light',
  colors: { text: '#101014', bg: '#f4f2ee', primary: '#0f4bd8', secondary: '#e3e0d9', accent: '#c2410c' },
  fonts: ['https://fonts.googleapis.com/css2?family=Inter:wght@400;700&display=swap'],
  layouts: { home: () => import('./stub/Home.astro') },
};

export const THEMES: readonly Theme[] = [...PROD_THEMES, STUB];

/** Array order is picker order. */
export const THEME_IDS: readonly string[] = THEMES.map((t) => t.id);

assertRegistry(THEMES);
