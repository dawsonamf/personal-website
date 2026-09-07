// The shared draft walker (D10): every `{ draft: … }` node in a content tree, reported
// with its source and dot path. S1-07/S1-08 run it over post metadata and the shared
// prose tree before a production build.
//
// Pure and erasable: reached from the externalized src/prose/index.ts, so plain Node
// loads it. It never coerces, unwraps or approves anything.

export type DraftIssue = { source: string; path: string };

export function isDraft(value: unknown): value is { draft: unknown } {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return false;
  const keys = Object.keys(value);
  return keys.length === 1 && keys[0] === 'draft';
}

export function findDrafts(tree: unknown, source: string): DraftIssue[] {
  const issues: DraftIssue[] = [];
  const walk = (node: unknown, path: string) => {
    if (isDraft(node)) {
      // The path names the drafted field; what is inside is the unapproved value.
      issues.push({ source, path });
      return;
    }
    const step = (key: string, value: unknown) => walk(value, path === '' ? key : `${path}.${key}`);
    if (Array.isArray(node)) {
      node.forEach((value, index) => step(String(index), value));
    } else if (typeof node === 'object' && node !== null) {
      for (const [key, value] of Object.entries(node)) step(key, value);
    }
  };
  walk(tree, '');
  return issues;
}
