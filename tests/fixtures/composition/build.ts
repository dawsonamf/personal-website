// The throwaway Astro project both S1-12 tests build: tests/build/composition.test.ts and
// tests/browser/theme-routing.spec.ts. One copy of the project shape, so the two runs cannot
// drift apart on the public subset or the build invocation.
//
// A build is the REAL src/ (pages included), the REAL root config and the public files those
// pages reference, assembled under tests/fixtures/composition/.tmp (gitignored, inside the repo
// so node_modules resolves by walking up). src/, public/ and the root config are never written
// to: an overlay mutates the COPY.
//
// tsconfig.json excludes this directory, so import it with an explicit `.ts` path and keep the
// file to syntax Node's type stripping can erase.
import { spawnSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, mkdtempSync, readdirSync, rmdirSync, rmSync, symlinkSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';

export const repoRoot = resolve(import.meta.dirname, '..', '..', '..');
export const fixtureRoot = join(repoRoot, 'tests', 'fixtures', 'composition');
// Large fixture copies can be routed off an iCloud-synced checkout. Existing callers keep the
// original ignored location unless they opt in; cleanup still removes only the child it created.
export const tmpRoot = process.env.TEST_BUILD_OUT_DIR
  ? resolve(process.env.TEST_BUILD_OUT_DIR)
  : join(fixtureRoot, '.tmp');

/** One Astro build of the real tree, with margin. */
export const BUILD_MS = 180_000;

/** Everything the four route types link to. Images are hrefs, not build inputs, so they stay out. */
const PUBLIC_SUBSET = [
  'css',
  'js',
  'blog',
  'privacy',
  'lexchat',
  'subsites',
  'vendor/aos',
  'vendor/boxicons',
  'vendor/fontawesome-free',
  'vendor/highlight.js',
  'resources/favicon-32.png',
  'resources/apple-touch-icon.png',
];

/**
 * Assemble and build one throwaway project; `overlay` runs on the copy, after it is assembled
 * and before the build. A failed build removes its own tree, so a failed `before` hook or
 * fixture leaves nothing behind.
 */
export function buildSite(prefix: string, overlay?: (dir: string) => void): { dir: string; dist: string } {
  mkdirSync(tmpRoot, { recursive: true });
  const dir = mkdtempSync(join(tmpRoot, prefix));
  try {
    // An external scratch root cannot discover the repository's installed packages by walking
    // parent directories. Keep node_modules itself local so Vite's `.vite` cache is worker-owned,
    // then link each installed top-level package; this installs and copies nothing.
    if (process.env.TEST_BUILD_OUT_DIR && !existsSync(join(dir, 'node_modules'))) {
      const installed = join(repoRoot, 'node_modules');
      const local = join(dir, 'node_modules');
      mkdirSync(local);
      for (const entry of readdirSync(installed, { withFileTypes: true })) {
        if (entry.name === '.vite' || entry.name === '.cache') continue;
        symlinkSync(join(installed, entry.name), join(local, entry.name), entry.isDirectory() ? 'dir' : 'file');
      }
    }
    cpSync(join(repoRoot, 'src'), join(dir, 'src'), { recursive: true });
    cpSync(join(repoRoot, 'astro.config.mjs'), join(dir, 'astro.config.mjs'));
    for (const rel of PUBLIC_SUBSET) {
      const dest = join(dir, 'public', rel);
      mkdirSync(dirname(dest), { recursive: true });
      cpSync(join(repoRoot, 'public', rel), dest, { recursive: true });
    }
    overlay?.(dir);

    const env = { ...process.env };
    delete env.PROSE_DRAFTS;
    const run = spawnSync(process.execPath, [join(repoRoot, 'node_modules', 'astro', 'bin', 'astro.mjs'), 'build', '--root', dir], {
      encoding: 'utf8',
      timeout: BUILD_MS,
      env,
      // Keep Astro's default .astro cache inside this copy. Parallel browser workers otherwise
      // share the checkout cache and can remove one another's hashed prerender chunks.
      cwd: dir,
    });
    if (run.error) throw run.error;
    if (run.status !== 0) throw new Error(`astro build failed (${run.status}):\n${run.stdout}\n${run.stderr}`);
  } catch (error) {
    cleanup(dir);
    throw error;
  }
  return { dir, dist: join(dir, 'dist') };
}

/** Remove one build's tree, then the shared .tmp root once the last consumer is done with it. */
export function cleanup(dir: string | undefined): void {
  if (dir) rmSync(dir, { recursive: true, force: true });
  try {
    rmdirSync(tmpRoot);
  } catch {
    // Another build's tree is still there, or .tmp was never created.
  }
}
