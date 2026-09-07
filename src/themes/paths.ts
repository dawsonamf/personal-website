// The only way a component writes an internal link (D31, §6.1), and a content-free
// leaf: it knows the registry ids and the static-asset prefixes, nothing about post
// ids, extra pages or the content collections. "A root-absolute path is themed unless
// it is a static asset."
import { THEME_IDS } from './registry.ts';

/** §6.1 rule 5: paths that are served as-is under every theme. */
export const STATIC_PREFIXES: readonly string[] = [
  '/resources/',
  '/vendor/',
  '/subsites/',
  '/blog/posts/',
  '/css/',
  '/js/',
  '/blog/post.html',
  '/sitemap-index.xml',
  '/sitemap-0.xml',
  '/robots.txt',
];

const SCHEME = /^[a-z][a-z0-9+.-]*:/i;

/**
 * Theme an internal path. Schemes, protocol-relative URLs and bare fragments pass
 * through; anything else must be root-absolute (relative paths throw, D31); the
 * default theme and static assets pass through; everything else gains `/<theme>`.
 * Queries and hashes ride along untouched.
 */
export function href(path: string, theme?: string): string {
  if (SCHEME.test(path) || path.startsWith('//')) return path; // rule 1
  if (path.startsWith('#')) return path; // rule 2
  if (!path.startsWith('/')) {
    // rule 3
    throw new Error(`href(): "${path}" is not root-absolute; relative paths are banned in src/ (D31)`);
  }
  if (!theme || theme === 'default') return path; // rule 4; an empty theme is unset, never '//blog/'
  if (STATIC_PREFIXES.some((prefix) => path.startsWith(prefix))) return path; // rule 5
  return '/' + theme + path;
}

/**
 * `getStaticPaths()` params for `src/pages/[...theme]/`: `{ theme: undefined }` is the
 * documented way a rest parameter matches the root, then one entry per non-default id
 * in registry (picker) order.
 */
export function themeParams(): Array<{ theme: string | undefined }> {
  return [
    { theme: undefined },
    ...THEME_IDS.filter((id) => id !== 'default').map((theme) => ({ theme })),
  ];
}
