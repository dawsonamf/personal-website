// The 404's theme resolution (D27). GitHub Pages serves one /404.html for every missing URL,
// so `/brutalist/nope/` cannot be prerendered per theme: the page is built in the default theme
// and applies one at runtime.
//
// Pure, browser-safe and import-free, because it ships in the 404's client bundle and is unit
// tested on its own. `'default'` is a valid answer; the caller ignores it.
/** The first path segment if it names a theme, else `?style=` if it does, else nothing. */
export function resolveNotFoundTheme(
  pathname: string,
  search: string,
  ids: readonly string[],
): string | undefined {
  const candidates = [pathname.split('/')[1], new URLSearchParams(search).get('style')];
  return candidates.find((value) => value != null && ids.includes(value)) ?? undefined;
}
