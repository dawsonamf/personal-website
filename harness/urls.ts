/**
 * The parity matrix: every theme × page pair the harness visits, derived from the baseline
 * checkout rather than hand-listed. Consumers: harness/parity.spec.ts, playwright.config.ts.
 */
import { localPostIds, oldPath, themeOrder } from './baseline.ts';
import type { MigratedAdapter } from './migrated.ts';

export type PageType = 'home' | 'blog' | 'post' | 'privacy' | 'notFound' | 'lexchat';

export const PAGE_TYPES: readonly PageType[] = ['home', 'blog', 'post', 'privacy', 'notFound', 'lexchat'];

/** The three post pages §9 puts in the matrix (mermaid+bash/json, swift+c+image, Plotly+js-yaml). */
export const MATRIX_POSTS = ['toolbelt', 'embedded-swift-agent', 'metr-doubling'] as const;

export const OLD_ORIGIN = 'http://127.0.0.1:8781';
export const NEW_ORIGIN = 'http://127.0.0.1:8782';

export type ParityMode = 'old-old' | 'old-new';

/** Required, never defaulted: every plan command sets it, and it also gates the config's servers. */
export function parityMode(): ParityMode {
  const mode = process.env.PARITY_MODE;
  if (mode !== 'old-old' && mode !== 'old-new') {
    throw new Error(
      `PARITY_MODE is ${JSON.stringify(mode)}. Set PARITY_MODE=old-old (old-new arrives with S1-13).`,
    );
  }
  return mode;
}

export interface UrlPair {
  theme: string;
  page: PageType;
  postId?: string;
  /** `post-<id>` for a post, the page type otherwise; the dump and snapshot path segment. */
  pageId: string;
  oldPath: string;
  newPath: string;
}

type AdapterLoader = () => Promise<{ createMigratedAdapter(): MigratedAdapter }>;

/** The isolation boundary: old-old returns before the dynamic import expression is evaluated. */
export async function loadMigratedAdapter(
  mode: ParityMode,
  loader: AdapterLoader = () => import('./migrated.ts'),
): Promise<MigratedAdapter | null> {
  return mode === 'old-new' ? (await loader()).createMigratedAdapter() : null;
}

/** theme source × {home, blog, the three matrix posts, privacy, 404, lexchat} = 16 × 8. */
export async function urlPairs(adapter?: MigratedAdapter | null): Promise<UrlPair[]> {
  const mode = parityMode();
  const migrated = adapter === undefined ? await loadMigratedAdapter(mode) : adapter;
  const legacyThemes = themeOrder();
  const themes = migrated?.themeIds ?? legacyThemes;
  const local = migrated?.publishedPostIds ?? localPostIds();
  if (migrated && JSON.stringify(themes) !== JSON.stringify(legacyThemes)) {
    throw new Error(`Theme order differs between baseline and migrated registry:\nold ${legacyThemes.join(', ')}\nnew ${themes.join(', ')}`);
  }
  const matrixPosts = migrated?.matrixPosts ?? [...MATRIX_POSTS];
  if (migrated && JSON.stringify(matrixPosts) !== JSON.stringify(MATRIX_POSTS)) {
    throw new Error(`Migrated matrix posts differ from §9: ${matrixPosts.join(', ')}`);
  }
  for (const id of matrixPosts) {
    if (!local.includes(id)) throw new Error(`Matrix post ${id} is not a local post: ${local.join(', ')}`);
  }
  const pages = PAGE_TYPES.flatMap((page): Array<{ page: PageType; postId?: string }> =>
    page === 'post' ? matrixPosts.map((postId) => ({ page, postId })) : [{ page }],
  );
  return themes.flatMap((theme) =>
    pages.map(({ page, postId }) => {
      const old = oldPath(page, theme, postId);
      return {
        theme,
        page,
        ...(postId ? { postId } : {}),
        pageId: postId ? `post-${postId}` : page,
        oldPath: old,
        newPath: migrated ? migrated.newPath(page, theme, postId) : old,
      };
    }),
  );
}
