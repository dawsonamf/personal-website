// The one place the skin / owned / fallback rule is decided (§5.2, D34). Everything
// downstream renders the returned value: the Shell, ThemeAssets and PickerFab never
// inspect `theme.kind`, and no page file re-derives the branch.
//
// `composeFor` is pure and synchronous, so a table test can import it under plain Node:
// keep `import.meta.env` inside `compose()` (Node has no `import.meta.env`) and keep
// this file free of TS syntax that Node's type stripping cannot erase.
import { THEMES } from '../themes/registry.ts';
import type { LazyLayout, OwnablePageType, PageType, Theme } from '../themes/types.ts';
import type { Composition, PageContext, PickerMount } from './types.ts';

/** What composeFor decides. compose() awaits `layout` and adds the canonical URL. */
export type CompositionPlan = Omit<Composition, 'layout' | 'canonical'> & { layout: LazyLayout };

// Lazy for uniformity with a structural theme's `layouts` entries: one shape, so the
// composition table has one code path and a page pulls in only the layout it renders.
const canonical: Record<PageType, LazyLayout> = {
  home: () => import('./canonical/Home.astro'),
  blog: () => import('./canonical/BlogListing.astro'),
  post: () => import('./canonical/BlogPost.astro'),
  privacy: () => import('./canonical/Privacy.astro'),
  notFound: () => import('./canonical/NotFound.astro'),
};

const OWNABLE: readonly OwnablePageType[] = ['home', 'blog', 'post'];
const isOwnable = (type: PageType): type is OwnablePageType => (OWNABLE as readonly string[]).includes(type);

/** The mount every canonical composition uses: a FAB where there is no nav. */
function mountFor(type: PageType): PickerMount {
  if (type === 'privacy' || type === 'notFound') return { mount: 'fab', corner: 'br' }; // D12: no nav to mount in
  return { mount: 'nav' };
}

/** §5.2's table, whole. The only branch on `theme.kind` in the engine. */
export function composeFor(theme: Theme, type: PageType): CompositionPlan {
  const noindex = theme.id !== 'default'; // every /<theme>/ path

  if (theme.kind === 'structural') {
    const owned = isOwnable(type) ? theme.layouts[type] : undefined;
    // An owned page brings its own CSS, so it takes the fonts and nothing else, and
    // mounts the FAB until a consumer adds the own-mount declaration (§5.3, §11).
    if (owned) {
      return { layout: owned, assets: { fonts: true, base: false, skin: false }, picker: { mount: 'fab', corner: 'br' }, noindex };
    }
    // Fallback to the canonical layout: an unowned home/blog/post needs theme-base.css
    // for the shared skin rules; a utility page takes the fonts alone.
    return { layout: canonical[type], assets: { fonts: true, base: isOwnable(type), skin: false }, picker: mountFor(type), noindex };
  }

  // Skins, including default: the canonical layout, and the default loads nothing.
  const themed = theme.id !== 'default';
  return { layout: canonical[type], assets: { fonts: themed, base: themed, skin: themed }, picker: mountFor(type), noindex };
}

/**
 * The page-facing composer: composeFor plus the resolved layout and the absolute URL of
 * the default-theme page (plan contract #1, so `page.path` carries a concrete post id).
 * The origin comes from `site` in astro.config.mjs; D39 bans the literal domain in src/.
 */
export async function compose(theme: Theme, page: PageContext): Promise<Composition> {
  const { layout, ...plan } = composeFor(theme, page.type);
  return { ...plan, layout: (await layout()).default, canonical: new URL(page.path, import.meta.env.SITE).href };
}

/** `Astro.params.theme` to its registry entry; the root route has no param and is the default. */
export function routeTheme(param: string | undefined): Theme {
  const id = param ?? 'default';
  const theme = THEMES.find((entry) => entry.id === id);
  if (!theme) throw new Error(`routeTheme: no theme "${id}" in the registry`);
  return theme;
}
