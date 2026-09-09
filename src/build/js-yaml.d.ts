// js-yaml 4 ships no types and @types/js-yaml is not an approved install, so this declares
// the one function the post reader calls. Identical declarations merge, so a sibling copy is safe.
declare module 'js-yaml' {
  export function load(input: string, options?: { filename?: string }): unknown;
}
