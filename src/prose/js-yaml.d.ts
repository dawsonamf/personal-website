// js-yaml 4.3.0 ships no types and no install was approved, so this declares exactly the
// surface this repo uses. Widen it only when a caller needs more. If S1-08 (or later)
// installs @types/js-yaml, DELETE this file: two `declare module 'js-yaml'` blocks merge
// silently into overloads instead of erroring, so the stale one never surfaces.
declare module 'js-yaml' {
  export function load(text: string, options?: { filename?: string }): unknown;
}
