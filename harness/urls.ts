/**
 * The parity matrix: every theme × page pair the harness visits, derived from the baseline
 * checkout rather than hand-listed. Consumers: harness/parity.spec.ts, playwright.config.ts.
 */
import { localPostIds, oldPath, themeOrder } from './baseline.ts';

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

/** themeOrder() × {home, blog, the three matrix posts, privacy, 404, lexchat} = 16 × 8. */
export function urlPairs(): UrlPair[] {
  if (parityMode() === 'old-new') throw new Error('old-new URL mapping arrives with S1-13');
  const local = localPostIds();
  for (const id of MATRIX_POSTS) {
    if (!local.includes(id)) throw new Error(`Matrix post ${id} is not a local post: ${local.join(', ')}`);
  }
  const pages = PAGE_TYPES.flatMap((page): Array<{ page: PageType; postId?: string }> =>
    page === 'post' ? MATRIX_POSTS.map((postId) => ({ page, postId })) : [{ page }],
  );
  return themeOrder().flatMap((theme) =>
    pages.map(({ page, postId }) => {
      const old = oldPath(page, theme, postId);
      return {
        theme,
        page,
        ...(postId ? { postId } : {}),
        pageId: postId ? `post-${postId}` : page,
        oldPath: old,
        newPath: old,
      };
    }),
  );
}
