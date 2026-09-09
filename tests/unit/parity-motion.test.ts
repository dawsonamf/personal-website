import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import { describe, it } from 'node:test';

const repoRoot = resolve(import.meta.dirname, '..', '..');
const configUrl = pathToFileURL(resolve(repoRoot, 'playwright.config.ts')).href;

function loadConfig(value: string | undefined) {
  const env = { ...process.env };
  delete env.PARITY_MODE;
  delete env.PARITY_REDUCED_MOTION;
  if (value !== undefined) env.PARITY_REDUCED_MOTION = value;
  return spawnSync(
    process.execPath,
    [
      '--input-type=module',
      '--eval',
      `const config = (await import(${JSON.stringify(configUrl)})).default; process.stdout.write(String(config.use.contextOptions.reducedMotion));`,
    ],
    { cwd: repoRoot, encoding: 'utf8', env },
  );
}

describe('PARITY_REDUCED_MOTION', () => {
  for (const [value, expected] of [
    [undefined, 'no-preference'],
    ['0', 'no-preference'],
    ['1', 'reduce'],
  ] as const) {
    it(`${value === undefined ? 'absent' : value} selects ${expected}`, () => {
      const run = loadConfig(value);
      assert.equal(run.status, 0, run.stderr);
      assert.equal(run.stdout, expected);
    });
  }

  it('rejects every value outside absent, 0, and 1', () => {
    for (const value of ['', 'false', 'true', '2', 'reduce']) {
      const run = loadConfig(value);
      assert.notEqual(run.status, 0, `${JSON.stringify(value)} unexpectedly loaded the config`);
      assert.match(run.stderr, /PARITY_REDUCED_MOTION/);
    }
  });
});
