// Copies the npm-installed vendor artifacts into public/ (Spec 1 D5).
// Run by hand via `npm run vendor` when a pin changes; not a lifecycle hook.
// Boxicons rows have no npmPath: those files are committed CDN copies, so they are skipped.
// Optional argv[2] is the destination root; tests/unit/vendor-map.test.ts copies into a temp dir with it.
// Copy-only: a file whose row was renamed or removed is not deleted here; the test's no-strays
// assertion catches it, remove it by hand.

import { copyFileSync, mkdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';

import { VENDOR_FILES } from './vendor-map.mjs';

const repo = resolve(import.meta.dirname, '..');
const destRoot = process.argv[2] || join(repo, 'public');

let copied = 0;
for (const { npmPath, publicPath } of VENDOR_FILES) {
  if (!npmPath) continue;
  const dest = join(destRoot, publicPath);
  mkdirSync(dirname(dest), { recursive: true });
  copyFileSync(join(repo, 'node_modules', npmPath), dest);
  copied += 1;
}

console.log(`vendored ${copied} files -> ${destRoot}`);
