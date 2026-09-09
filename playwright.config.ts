/**
 * Playwright config for the parity harness (S1-02) and the browser/theme-authoring specs that
 * later tickets add. Both origins are served by runner-owned loopback Python servers; nothing
 * here starts a persistent listener. Consumers: harness/parity.spec.ts, tests/browser/**.
 */
import { defineConfig } from '@playwright/test';
import { resolve } from 'node:path';
import { oldDir } from './harness/baseline.ts';
import { parityReducedMotion } from './harness/motion.ts';
import { NEW_ORIGIN, OLD_ORIGIN, parityMode } from './harness/urls.ts';

const serve = (port: number, directory: string, url: string) => ({
  // Single-quoted: inside POSIX double quotes `$` and backticks would still be live.
  command: `python3 -m http.server --bind 127.0.0.1 ${port} --directory '${directory.replace(/'/g, "'\\''")}'`,
  url,
  // A stray listener on a harness port is a bug, never something to adopt.
  reuseExistingServer: false,
  gracefulShutdown: { signal: 'SIGTERM' as const, timeout: 500 },
  stdout: 'ignore' as const,
  stderr: 'ignore' as const, // http.server logs every request to stderr
  timeout: 15_000,
});

// Parity runs only. tests/browser/** own their own servers, so they must not boot these, and
// oldDir() (which is the baseline SHA pin) must not run for them either.
const parity = process.env.PARITY_MODE !== undefined;
const OLD_ROOT = parity ? oldDir() : '';
const ROOT = import.meta.dirname.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // regex-escaped repo root
const PARITY_ROOT = resolve(process.env.PARITY_OUT_DIR ?? resolve(import.meta.dirname, 'harness/__parity__'));

export default defineConfig({
  testDir: '.',
  // Anchored to this checkout's absolute path: string globs are matched as `**/<glob>` against
  // absolute paths, so nested checkouts (agent worktrees under the gitignored .claude/) would be
  // collected too, each importing its own @playwright/test. A `**/.claude/**` ignore is no fix:
  // it drops everything when this checkout itself lives under .claude/.
  testMatch: new RegExp('^' + ROOT + '/(tests/browser/.+\\.spec\\.ts|harness/(parity|theme-authoring)\\.spec\\.ts)$'),
  fullyParallel: true,
  retries: 0,
  timeout: 90_000,
  expect: {
    timeout: 10_000,
    toHaveScreenshot: {
      maxDiffPixelRatio: 0.001,
      threshold: 0.2,
      animations: 'disabled',
      caret: 'hide',
      scale: 'css',
    },
  },
  outputDir: resolve(PARITY_ROOT, 'test-results'),
  // No {platform}: both sides are captured on the same machine in the same run, and the
  // references are regenerated from OLD every time.
  snapshotPathTemplate: resolve(PARITY_ROOT, 'snapshots/{projectName}/{arg}{ext}'),
  reporter: [['html', { open: 'never', outputFolder: resolve(PARITY_ROOT, 'report') }], ['list']],
  use: {
    colorScheme: 'light',
    // 1.61.1 has no top-level `reducedMotion` use-option; it lives under contextOptions.
    contextOptions: { reducedMotion: parityReducedMotion() },
    deviceScaleFactor: 1,
    trace: 'retain-on-failure',
  },
  projects: [
    // The `@only:<project>` tag (harness/interactions.ts) marks a state only one viewport can
    // reach; each project excludes the other's, so such a state is never collected here rather
    // than skipped at runtime.
    {
      name: 'desktop-1440',
      use: { viewport: { width: 1440, height: 900 } },
      grepInvert: /@capture:|@only:mobile-390/,
    },
    {
      name: 'mobile-390',
      use: { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true },
      grepInvert: /@capture:|@only:desktop-1440/,
    },
    {
      // Fixture capture and integrity are viewport-independent, so they run once here instead of
      // being skipped in one of the two comparison projects.
      name: 'capture',
      use: { viewport: { width: 1440, height: 900 } },
      grep: /@capture:/,
    },
  ],
  webServer:
    parity ?
      [
        serve(8781, OLD_ROOT, `${OLD_ORIGIN}/`),
        serve(
          8782,
          parityMode() === 'old-old' ? OLD_ROOT : resolve(import.meta.dirname, 'dist'),
          `${NEW_ORIGIN}/`,
        ),
      ]
    : undefined,
});
