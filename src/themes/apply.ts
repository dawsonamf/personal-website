// One projection from theme to HTML (D33, §5.4), pure and DOM-free, with three
// adapters: Shell.astro spreads `attrs` and writes `style`, ThemeAssets.astro maps
// `links`, and the 404's bundled script assigns the same value at runtime (D27).
// Because the 404 bundles it, this module must stay browser-bundleable: its only
// runtime `src/` dependency is ./ramp.ts: no node:*, no astro, no prose, no
// content, not even the registry. Page-level extras (`--prose-*` D14,
// `--ticker-run`/`--ticker-dur` D35) are not theme projection: they arrive through
// PageContext.styleExtras and are serialised by the same `declarations()` below.
import { rampDeclarations } from './ramp.ts';
import type { Colors, Theme, ThemeHtml } from './types.ts';

/** The shared skin rules every non-default theme loads, and the link ThemeAssets classifies as `base`. */
export const THEME_BASE_CSS = '/css/themes/theme-base.css';

/**
 * Serialise `{ '--k': 'v' }` to `--k:v;--k2:v2;` in insertion order, the `<html style>`
 * format the bootstrap's `style.setProperty` calls produce. Used here for a theme's
 * tokens; S1-12's Shell reuses it for `PageContext.styleExtras`.
 *
 * Values are still written verbatim, so quoting and escaping a prose string into one
 * complete CSS value (balanced quotes and parens, `--ticker-run` above all) remains the
 * producer's job: S1-16's `canonicalStyleExtras`. The guard below only makes a break-out
 * impossible, by rejecting the two characters that would end the declaration or the rule.
 * ramp.ts carries its own copy of this `prop:value;` format rather than calling here,
 * because `rampDeclarations` must stay self-contained (D33).
 */
export function declarations(map: Readonly<Record<`--${string}`, string>>): string {
  let out = '';
  for (const [prop, value] of Object.entries(map)) {
    // A bare `;` appends arbitrary declarations; braces never belong in a declaration value.
    if (/[;{}]/.test(value)) throw new Error(`declarations: ${prop} value contains ";", "{" or "}"`);
    out += prop + ':' + value + ';';
  }
  return out;
}

/**
 * Project a theme onto `<html>`: `data-*` attributes, the ordered inline declarations
 * (tokens, then the ramp) and the stylesheet hrefs (fonts, base, skin), mirroring
 * theme-bootstrap.js:703-721. The default theme applies nothing but the ramp.
 *
 * `colors` overrides the theme's palette for the randomiser (the pre-paint path calls
 * `rampDeclarations` alone with the saved colours).
 */
export function themeHtml(theme: Theme, colors: Colors = theme.colors): ThemeHtml {
  const ramp = rampDeclarations(colors);
  if (theme.id === 'default') return { attrs: {}, style: ramp, links: [] };

  // Insertion order is the projected attribute order. The three legacy attributes are
  // emitted only when set (`:704-706`); the two typing carriers (D32) likewise, and
  // their absence means the legacy defaults 'cursor'/'char', which consumers apply.
  const attrs: Record<string, string> = { 'data-style': theme.id };
  if (theme.kind === 'skin') {
    if (theme.flags?.still) attrs['data-still'] = '';
    if (theme.flags?.tilt === false) attrs['data-no-tilt'] = '';
    if (theme.typing) attrs['data-typing'] = theme.typing;
    if (theme.typingDelete) attrs['data-typing-delete'] = theme.typingDelete;
  }

  return {
    attrs,
    style: declarations(theme.tokens ?? {}) + ramp,
    links: [
      ...(theme.fonts ?? []),
      THEME_BASE_CSS,
      ...(theme.kind === 'skin' && theme.css ? [theme.css] : []),
    ],
  };
}
