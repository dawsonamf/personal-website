import assert from 'node:assert/strict';
import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { dirname, join, relative, resolve } from 'node:path';

export const AUTHOR_THEME_ID = 'author-proof';
export const fixtureRoot = import.meta.dirname;
const repoRoot = resolve(fixtureRoot, '..', '..', '..');
export const AUTHORING_MANIFEST: readonly string[] = JSON.parse(
  readFileSync(join(fixtureRoot, 'allowed-change-manifest.json'), 'utf8'),
);

const hash = (path: string) => createHash('sha256').update(readFileSync(path)).digest('hex');

export function sourceManifest(dir: string) {
  const roots = ['src', 'public'];
  const result = new Map<string, string>();
  for (const root of roots) {
    const base = join(dir, root);
    if (!existsSync(base)) continue;
    for (const entry of readdirSync(base, { recursive: true, withFileTypes: true })) {
      if (!entry.isFile()) continue;
      const path = join(entry.parentPath, entry.name);
      result.set(relative(dir, path), hash(path));
    }
  }
  return result;
}

function editOne(dir: string, rel: string, from: string, to: string) {
  const path = join(dir, rel);
  const text = readFileSync(path, 'utf8');
  const parts = text.split(from);
  assert.equal(parts.length, 2, `${rel}: authoring anchor drifted`);
  writeFileSync(path, parts.join(to));
}

export function authoringOverlay(dir: string) {
  // The browser proof visits real default pages too, so make every resource they request
  // available before the authoring before/after manifest is captured.
  cpSync(join(repoRoot, 'public'), join(dir, 'public'), { recursive: true });
  const before = sourceManifest(dir);
  const home = join(dir, 'src/themes/author-proof/Home.astro');
  mkdirSync(dirname(home), { recursive: true });
  cpSync(join(fixtureRoot, 'Home.astro'), home, { recursive: false });
  cpSync(join(fixtureRoot, 'author-proof.css'), join(dir, 'public/css/author-proof.css'));
  cpSync(join(fixtureRoot, 'author-proof.js'), join(dir, 'public/js/author-proof.js'));

  editOne(
    dir,
    'src/themes/registry.ts',
    '\n];\n\n/** Array order is picker order. */',
    `${readFileSync(join(fixtureRoot, 'registry-entry.ts.txt'), 'utf8')}\n];\n\n/** Array order is picker order. */`,
  );
  const proseAnchor = '  default: { label: { xs: Default } }\n';
  editOne(
    dir,
    'src/content/prose.yaml',
    proseAnchor,
    `${proseAnchor}  author-proof: { label: { xs: Studio } }\n`,
  );

  const after = sourceManifest(dir);
  const changed = [...new Set([...before.keys(), ...after.keys()])]
    .filter((path) => before.get(path) !== after.get(path))
    .sort();
  return { before, after, changed };
}
