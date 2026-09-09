// The colour ramp: the single port of theme-bootstrap.js:744-774 (hexToHsl + the
// per-role emission loop).
//
// D33 / §5.4 CONSTRAINT: `rampDeclarations` must stay SELF-CONTAINED. The pre-paint
// `is:inline` script and scripts/build-picker.mjs inline it via
// `Function.prototype.toString()`, so:
//   - it may close over nothing but its own parameter. The steps, the role order and
//     `hexToHsl` all live inside the body, and this module imports nothing at runtime
//     (a type-only import is erased);
//   - only erasable TypeScript inside the body (annotations, `as const`), so the
//     stringified source is valid JavaScript;
//   - the body must never contain `</script` or `<!--`, which would end or comment out
//     the `<script is:inline>` element the stringified source is pasted into.
import type { Colors } from './types.ts';

/**
 * The 100 ramp declarations for `<html style>`, serialised as `prop:value;` with no
 * spaces, in the legacy order: per role (text, bg, primary, secondary, accent) the
 * **raw hex** base (never normalised, `:766`) then 19 `hsla(H,S%,L%,A%)` steps with
 * `toFixed(0)` and a percentage alpha (`:769-772`).
 *
 * The role order is fixed here, not taken from the caller's key order.
 */
export function rampDeclarations(colors: Colors): string {
  const STEPS = [5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85, 90, 95];
  const ROLES = ['text', 'bg', 'primary', 'secondary', 'accent'] as const;

  function hexToHsl(hex: string): { h: number; s: number; l: number } {
    const m = hex.replace('#', '');
    const r = parseInt(m.substring(0, 2), 16) / 255;
    const g = parseInt(m.substring(2, 4), 16) / 255;
    const b = parseInt(m.substring(4, 6), 16) / 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0;
    let s = 0;
    const l = (max + min) / 2;
    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r:
          h = (g - b) / d + (g < b ? 6 : 0);
          break;
        case g:
          h = (b - r) / d + 2;
          break;
        case b:
          h = (r - g) / d + 4;
          break;
      }
      h *= 60;
    }
    return { h: h, s: s * 100, l: l * 100 };
  }

  let out = '';
  for (const role of ROLES) {
    const hex = colors[role];
    out += '--' + role + ':' + hex + ';';
    const hsl = hexToHsl(hex);
    for (const a of STEPS) {
      out +=
        '--' + role + a + ':hsla(' +
        hsl.h.toFixed(0) + ',' + hsl.s.toFixed(0) + '%,' + hsl.l.toFixed(0) + '%,' + a + '%);';
    }
  }
  return out;
}
