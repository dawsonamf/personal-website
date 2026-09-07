// What a page tells the composer about itself. S1-12 extends this file with the
// Composition and layout types; `themeHtml` never sees a PageContext (plan contract
// #2: theme projection owns attributes/tokens/ramp/links and nothing page-shaped).
import type { PageType } from '../themes/types.ts';

/** `--prop` → value pairs a page adds to `<html style>` after the theme projection (D14 prose, D35 ticker). */
export type StyleExtras = Record<`--${string}`, string>;

export interface PageContext {
  type: PageType;
  /** Unthemed canonical path with a concrete post id, e.g. `/blog/toolbelt/`; `href(path, theme)` themes it. */
  path: string;
  previewDraft?: boolean;
  styleExtras?: StyleExtras;
}
