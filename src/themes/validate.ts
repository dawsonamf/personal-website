// Build-only entry point for the registry's assertions that need the disk (§5.1's
// "every skin css file exists under public/css/themes/"). S1-13's checks integration
// calls this; nothing browser-bound ever imports it, which is why it is the only
// module in src/themes/ allowed to touch node:fs. Keep apply.ts, ramp.ts and
// registry.ts free of it, because those three ship in the 404 page's browser bundle
// (D27, D33); keep paths.ts free of it because §6.1 makes it a content-free leaf.
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { THEMES, assertRegistry } from './registry.ts';
import type { Theme } from './types.ts';

// `<repo>/public`, the served root that theme-base.css and the skins' `css` hrefs
// resolve against. A theme's `fonts` are remote Google Fonts URLs and are never
// resolved here.
const PUBLIC_ROOT = fileURLToPath(new URL('../../public/', import.meta.url));

/**
 * Run the pure registry assertions, then check every stylesheet the projection can
 * emit actually exists. Reports all missing files at once.
 */
export function validateThemes(themes: readonly Theme[] = THEMES, publicRoot: string = PUBLIC_ROOT): void {
  assertRegistry(themes);
  const required = ['/css/themes/theme-base.css'];
  for (const theme of themes) {
    if (theme.kind === 'skin' && theme.css) required.push(theme.css);
  }
  const missing = required.filter((href) => !existsSync(join(publicRoot, href)));
  if (missing.length > 0) {
    throw new Error(
      `theme registry: ${missing.length} stylesheet(s) missing under ${publicRoot}: ${missing.join(', ')}`,
    );
  }
}
