// What a page tells the composer about itself, and what the composer decided.
// `themeHtml` never sees a PageContext (plan contract #2: theme projection owns
// attributes/tokens/ramp/links and nothing page-shaped).
import type { AstroComponentFactory } from 'astro/runtime/server/index.js';

import type { PageType, Theme } from '../themes/types.ts';

/** `--prop` → value pairs a page adds to `<html style>` after the theme projection (D14 prose, D35 ticker). */
export type StyleExtras = Record<`--${string}`, string>;

export interface PageContext {
  type: PageType;
  /** Unthemed canonical path with a concrete post id, e.g. `/blog/toolbelt/`; `href(path, theme)` themes it. */
  path: string;
  previewDraft?: boolean;
  styleExtras?: StyleExtras;
}

/** Where a page mounts the picker trigger (D30). `none` is LexChat's picker-free composition (Q4). */
export type PickerMount =
  | { mount: 'nav' }
  | { mount: 'fab'; corner: 'br' | 'bl' | 'tr' | 'tl' }
  | { mount: 'none' };

/** What compose() decided for one page (§5.2, D34). Shell/ThemeAssets/PickerFab render this and never read theme.kind. */
export interface Composition {
  layout: AstroComponentFactory; // canonical[page.type] or the theme's own, already awaited
  assets: { fonts: boolean; base: boolean; skin: boolean }; // which projected links ThemeAssets emits
  picker: PickerMount;
  canonical: string; // absolute URL of the default-theme page
  noindex: boolean; // true on every /<theme>/ path
}

/** The props every layout takes, canonical or theme-owned. There is no pageType prop (D34). */
export interface LayoutProps {
  theme: Theme;
  page: PageContext;
  composition: Composition;
}
