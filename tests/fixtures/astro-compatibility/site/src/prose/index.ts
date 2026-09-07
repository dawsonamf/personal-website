// Spike stand-in for src/prose/index.ts (D39 / cross-ticket contract 3).
// Module-scope accumulator, no globalThis. Erasable TS only (Node type-stripping).
export const unwrittenSizes = new Set<string>();

export function record(key: string): void {
  unwrittenSizes.add(key);
}
