// S1-08: the typed prose contract is enforced by the real checker, not by tsc alone.
// `astro check --tsconfig <fixture>` scopes to the fixture's own program (S1-01 recorded
// that `--root` does not), so the negative fixtures run through the same tool the
// production build runs before `astro build`.
//
// Run: node --test --test-concurrency=1 tests/build/prose-types.test.ts

import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { join, resolve } from 'node:path';
import { describe, it } from 'node:test';

const repoRoot = resolve(import.meta.dirname, '..', '..');
const astroBin = join(repoRoot, 'node_modules', 'astro', 'bin', 'astro.mjs');

// astro check colours its output even when stdout is not a TTY.
const plain = (text: string) => text.replace(/\[[0-9;]*m/g, '');

function check(args: string[]) {
  const run = spawnSync(process.execPath, [astroBin, 'check', ...args], {
    cwd: repoRoot,
    encoding: 'utf8',
    timeout: 300_000,
  });
  assert.ifError(run.error);
  return { status: run.status, out: plain(run.stdout + run.stderr) };
}

describe('S1-08 prose type fixtures', () => {
  it('astro check fails on the negative fixtures', () => {
    const run = check(['--tsconfig', 'tests/fixtures/prose-types/tsconfig.json']);
    assert.equal(run.status, 1, `the negative fixture set must fail\n${run.out}`);
    assert.match(run.out, /Result \(4 files\):/);
    assert.match(run.out, /- 11 errors/);

    // The bound shared instance hides its size maps and rejects an invalid path.
    assert.match(
      run.out,
      /bound-instance\.ts:7:45 - error ts\(2339\): Property 'l' does not exist on type 'never'\./,
    );
    assert.match(run.out, /bound-instance\.ts:8:28 - error ts\(2345\).*"home\.abuot\.body"/);
    assert.match(run.out, /bound-instance\.ts:10:29 - error ts\(2345\).*"home\.about"/);
    // S1-05's hand-built-tree fixtures still fail for the same two reasons.
    assert.equal((run.out.match(/size-map-access\.ts:\d+:\d+ - error ts\(2339\)/g) ?? []).length, 4);
    assert.equal((run.out.match(/unknown-path\.ts:\d+:\d+ - error ts\(2345\)/g) ?? []).length, 4);
  });

  it('astro check passes on the project itself', () => {
    const run = check([]);
    assert.equal(run.status, 0, `the project must type-check\n${run.out}`);
    assert.match(run.out, /- 0 errors/);
  });
});
