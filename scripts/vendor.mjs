// Copies the npm-installed vendor artifacts into public/ (Spec 1 D5).
// Run by hand via `npm run vendor` when a pin changes; not a lifecycle hook.
// Boxicons rows have no npmPath: those files are committed CDN copies, so they are skipped.
// Optional argv[2] is the destination root.
// Copy-only: remove obsolete destination files by hand when a row is renamed or removed.

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
