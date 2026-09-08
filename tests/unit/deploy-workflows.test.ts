// S1-23: the deployment workflows are executed by S1-27/S1-28 against the live repo, so the only
// pre-flight guard is this file. It protects the properties a bad edit would silently break:
// the registration copy staying harmless on a no-build `main`, the full copy's pinned action
// versions / least-privilege permissions / typed dispatch guard, and the chart refresh keeping
// contents:write while gaining actions:write, writing to the single public/ destination, and
// dispatching a deploy only after a push that actually succeeded. The commit step's shell script
// is executed for real against PATH stubs, because "no deploy after a failed push" is behavior,
// not YAML shape.
//
// Run: node --test tests/unit/deploy-workflows.test.ts

import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { chmodSync, existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { after, describe, it } from 'node:test';

// js-yaml 4.3.0 ships no types and @types/js-yaml is not installed, so a static import would
// fail `tsc --noEmit` with TS7016. js-yaml 4 uses the YAML 1.2 core schema, so `on:` parses as
// the string key "on", not boolean true, which is asserted below rather than assumed.
const { load, dump } = createRequire(import.meta.url)('js-yaml') as {
  load(src: string): unknown;
  dump(doc: unknown): string;
};

type Step = {
  name?: string;
  id?: string;
  if?: string;
  uses?: string;
  run?: string;
  env?: Record<string, string>;
  with?: Record<string, unknown>;
};
type Job = {
  needs?: string;
  if?: string;
  permissions?: unknown;
  environment?: unknown;
  env?: Record<string, string>;
  steps: Step[];
};
type Workflow = {
  name: string;
  on: Record<string, unknown>;
  permissions?: unknown;
  concurrency?: unknown;
  env?: Record<string, string>;
  jobs: Record<string, Job>;
};

const repoRoot = resolve(import.meta.dirname, '..', '..');
const deployDir = join(repoRoot, 'docs/intents/2026-09-05-theme-engine-rewrite/research/deploy');

const FILES = {
  registration: join(deployDir, 'dispatch-only.yml'),
  full: join(deployDir, 'deploy-full.yml'),
  refresh: join(repoRoot, '.github/workflows/refresh-chart-data.yml'),
};
const PYTHON = join(repoRoot, 'docs/prebake-cohort-data.py');

const raw = (path: string): string => readFileSync(path, 'utf8');
const parse = (path: string): Workflow => load(raw(path)) as Workflow;
// The file text minus its comments: what GitHub actually executes. The header comments name the
// things the workflow must not do ("withastro/action not used", "never set PROSE_DRAFTS"), so the
// forbidden-token check has to read the YAML, not the prose explaining it.
const executable = (path: string): string => dump(parse(path));

const registration = parse(FILES.registration);
const full = parse(FILES.full);
const refresh = parse(FILES.refresh);
const allWorkflows = [registration, full, refresh];
const allRaw = Object.values(FILES).map(raw);

const jobs = (wf: Workflow): Job[] => Object.values(wf.jobs);
const steps = (wf: Workflow): Step[] => jobs(wf).flatMap((job) => job.steps);
const step = (wf: Workflow, name: string): Step => {
  const found = steps(wf).find((s) => s.name === name);
  assert.ok(found, `no step named ${name}`);
  return found;
};

// The declared shape of one workflow_dispatch input, minus its description.
function dispatchInput(wf: Workflow, name: string): { type: unknown; default: unknown } {
  const dispatch = wf.on.workflow_dispatch as { inputs: Record<string, Record<string, unknown>> };
  const input = dispatch.inputs[name];
  assert.ok(input, `no workflow_dispatch input named ${name}`);
  return { type: input.type, default: input.default };
}
const TYPED_FALSE = { type: 'boolean', default: false };

describe('workflow files parse', () => {
  it('keeps `on` as a string key (YAML 1.2 core schema)', () => {
    for (const wf of allWorkflows) {
      assert.ok(Object.hasOwn(wf, 'on'), 'parsed doc has no `on` key');
      assert.equal(typeof wf.on, 'object');
    }
  });

  it('pins every action to a first-party major version', () => {
    for (const wf of allWorkflows) {
      for (const s of steps(wf)) {
        if (s.uses) assert.match(s.uses, /^actions\/[a-z-]+@v\d+$/);
      }
    }
  });
});

describe('registration copy is harmless on a no-build main', () => {
  it('dispatch-only trigger with a typed deploy input', () => {
    assert.deepEqual(Object.keys(registration.on), ['workflow_dispatch']);
    const dispatch = registration.on.workflow_dispatch as { inputs: { deploy: { description?: unknown } } };
    assert.equal(typeof dispatch.inputs.deploy.description, 'string');
    assert.deepEqual(dispatchInput(registration, 'deploy'), TYPED_FALSE);
  });

  it('grants no token permissions and runs one job with no actions', () => {
    assert.deepEqual(registration.permissions, {});
    assert.equal(Object.keys(registration.jobs).length, 1);
    assert.deepEqual(steps(registration).filter((s) => s.uses), []);
  });

  it('has no concurrency or environment', () => {
    assert.equal(registration.concurrency, undefined);
    assert.deepEqual(jobs(registration).filter((j) => j.environment), []);
  });

  it('runs nothing that needs a Node project, and reads inputs through env', () => {
    for (const s of steps(registration)) {
      const script = s.run ?? '';
      for (const forbidden of ['npm', 'node', 'python', 'astro', 'gh ']) {
        assert.ok(!script.includes(forbidden), `registration run mentions ${forbidden}`);
      }
      assert.ok(!script.includes('${{'), 'registration run interpolates ${{ }}');
    }
  });

  it('shares its name and deploy input with the full copy', () => {
    assert.equal(registration.name, full.name);
    assert.deepEqual(dispatchInput(registration, 'deploy'), dispatchInput(full, 'deploy'));
  });
});

describe('full deploy workflow', () => {
  it('triggers on push to main and on dispatch', () => {
    assert.deepEqual(full.on.push, { branches: ['main'] });
    assert.deepEqual(dispatchInput(full, 'deploy'), TYPED_FALSE);
  });

  it('grants least-privilege permissions and serializes on the pages group', () => {
    assert.deepEqual(full.permissions, { contents: 'read' });
    assert.deepEqual(full.jobs.deploy.permissions, { pages: 'write', 'id-token': 'write' });
    assert.equal(full.jobs.build.permissions, undefined);
    assert.deepEqual(full.concurrency, { group: 'pages', 'cancel-in-progress': false });
  });

  it('builds with the pinned actions and the production build script', () => {
    assert.deepEqual(
      full.jobs.build.steps.map((s) => s.uses ?? s.run),
      [
        'actions/checkout@v7',
        'actions/setup-node@v7',
        'npm ci',
        'npm run build',
        'actions/upload-pages-artifact@v5',
      ],
    );
    const setupNode = full.jobs.build.steps.find((s) => s.uses === 'actions/setup-node@v7');
    assert.deepEqual(setupNode?.with, { 'node-version-file': '.nvmrc', cache: 'npm' });
    assert.equal(full.jobs.build.steps.at(-1)?.with?.path, 'dist');
  });

  it('always builds, even on a deploy=false dry run', () => {
    assert.equal(full.jobs.build.if, undefined);
    assert.deepEqual(full.jobs.build.steps.filter((s) => s.if), []);
  });

  it('gates the deploy job on a push or a typed dispatch opt-in', () => {
    const deploy = full.jobs.deploy;
    assert.equal(deploy.needs, 'build');
    assert.equal(deploy.if, "github.event_name == 'push' || inputs.deploy");
    assert.deepEqual(deploy.environment, {
      name: 'github-pages',
      url: '${{ steps.deployment.outputs.page_url }}',
    });
    assert.deepEqual(deploy.steps, [{ id: 'deployment', uses: 'actions/deploy-pages@v5' }]);
  });

  it('uses no substitute action, no draft escape hatch and no vendor hook', () => {
    const text = executable(FILES.full);
    for (const forbidden of ['withastro/action', 'PROSE_DRAFTS', 'configure-pages', 'npx astro']) {
      assert.ok(!text.includes(forbidden), `deploy-full.yml mentions ${forbidden}`);
    }
    assert.deepEqual(steps(full).filter((s) => (s.run ?? '').includes('vendor')), []);
  });

  it('matches the runtime contract the build depends on', () => {
    assert.equal(readFileSync(join(repoRoot, '.nvmrc'), 'utf8').trim(), '24');
    const pkg = JSON.parse(readFileSync(join(repoRoot, 'package.json'), 'utf8')) as {
      scripts: Record<string, string>;
    };
    // The deploy workflow's `npm run build` refreshes the picker adapter before public copying,
    // then gates on the draft check and Astro check before it builds.
    assert.equal(
      pkg.scripts.build,
      'npm run picker:build && npm run prose:check && npm run check && astro build',
    );
  });
});

describe('chart refresh workflow', () => {
  it('adds actions:write without dropping contents:write', () => {
    assert.deepEqual(refresh.permissions, { contents: 'write', actions: 'write' });
  });

  it('keeps the weekly schedule and the proven checkout pin', () => {
    assert.deepEqual(refresh.on.schedule, [{ cron: '17 9 * * 1' }]);
    assert.equal(steps(refresh)[0].uses, 'actions/checkout@v4');
  });

  it('offers a verify-only dispatch that skips data work', () => {
    assert.deepEqual(dispatchInput(refresh, 'verify_dispatch'), TYPED_FALSE);
    assert.equal(step(refresh, 'Rebuild data snapshots').if, '${{ !inputs.verify_dispatch }}');
    assert.equal(step(refresh, 'Commit and push if changed').if, '${{ !inputs.verify_dispatch }}');
    assert.equal(step(refresh, 'Commit and push if changed').id, 'commit');
  });

  // An added unguarded step is what would break "verify-only cannot change data or deploy", so
  // guard the shape of the whole job rather than the four steps that exist today.
  it('guards every step: only checkout is unconditional, data work is verify-gated', () => {
    const [checkout, ...rest] = steps(refresh);
    assert.equal(checkout.if, undefined);
    assert.deepEqual(rest.filter((s) => !s.if), []);
    for (const s of rest) {
      const script = s.run ?? '';
      if (/git |python/.test(script)) {
        assert.equal(s.if, '${{ !inputs.verify_dispatch }}', `unguarded data step: ${s.name}`);
      }
    }
    assert.deepEqual(
      steps(refresh).filter((s) => (s.run ?? '').includes('gh ')).map((s) => s.name),
      ['Redeploy Pages', 'Verify deploy dispatch (deploy=false)'],
    );
  });

  it('dispatches deploy.yml only from the commit output, always against main', () => {
    const redeploy = step(refresh, 'Redeploy Pages');
    assert.equal(redeploy.if, "steps.commit.outputs.changed == 'true'");
    assert.equal(redeploy.run?.trim(), 'gh workflow run deploy.yml --ref main -F deploy=true');
    const verify = step(refresh, 'Verify deploy dispatch (deploy=false)');
    assert.equal(verify.if, '${{ inputs.verify_dispatch }}');
    assert.equal(verify.run?.trim(), 'gh workflow run deploy.yml --ref main -F deploy=false');
  });

  it('scopes GH_TOKEN to the two gh steps only', () => {
    const withToken = steps(refresh).filter((s) => s.env?.GH_TOKEN);
    assert.deepEqual(withToken.map((s) => s.name), [
      'Redeploy Pages',
      'Verify deploy dispatch (deploy=false)',
    ]);
    for (const s of withToken) assert.equal(s.env?.GH_TOKEN, '${{ github.token }}');
    assert.equal(refresh.env, undefined);
    for (const job of jobs(refresh)) assert.equal(job.env, undefined);
  });

  it('references only public/-prefixed asset paths', () => {
    assert.equal(raw(FILES.refresh).match(/(?<!public\/)blog\/posts\/assets/g), null);
  });
});

describe('no secrets are committed', () => {
  it('uses only github.token / secrets.GITHUB_TOKEN and no literal tokens', () => {
    for (const text of allRaw) {
      for (const match of text.match(/secrets\.[A-Za-z_]+/g) ?? []) {
        assert.equal(match, 'secrets.GITHUB_TOKEN');
      }
      assert.doesNotMatch(text, /gh[pousr]_[A-Za-z0-9]{20,}/);
    }
  });
});

describe('single chart-data destination', () => {
  it('the python script has exactly one OUT_DIR pointing at public/', () => {
    const lines = raw(PYTHON).split('\n').filter((line) => /^OUT_DIR = /.test(line));
    assert.deepEqual(lines, ['OUT_DIR = REPO / "public" / "blog" / "posts" / "assets"']);
  });

  it('the script writes exactly the files the workflow commits, and they exist', () => {
    const written = [...raw(PYTHON).matchAll(/path = OUT_DIR \/ "([^"]+)"/g)].map((m) => m[1]).sort();
    const staged = step(refresh, 'Commit and push if changed').run ?? '';
    const added = [...staged.matchAll(/public\/blog\/posts\/assets\/(\S+\.json)/g)]
      .map((m) => m[1])
      .sort();
    assert.deepEqual(written, added);
    assert.ok(written.length > 0);
    for (const name of written) {
      const file = join(repoRoot, 'public/blog/posts/assets', name);
      assert.ok(existsSync(file), `missing public/blog/posts/assets/${name}`);
    }
  });

  it('the patched script still compiles', () => {
    // The builtin compiler, not `py_compile`: py_compile ignores PYTHONDONTWRITEBYTECODE and
    // would leave docs/__pycache__/ behind on a CPython without a pycache prefix set.
    const source = 'import sys; compile(open(sys.argv[1]).read(), sys.argv[1], "exec")';
    const run = spawnSync('python3', ['-c', source, PYTHON], { cwd: repoRoot, encoding: 'utf8' });
    assert.ifError(run.error);
    assert.equal(run.status, 0, run.stderr);
  });
});

// The commit step decides whether a deploy is dispatched. Run its real script with `git` and `gh`
// stubs as the ONLY entries on PATH, so a mistake here can never reach the real gh and dispatch a
// real workflow: an unstubbed command exits 127 instead. The runner's default shell for a step
// with no `shell:` key is `bash -e {0}`; the flags below are the stricter `shell: bash` form, and
// `pipefail` is inert because the script contains no pipes.
describe('commit step behavior (subprocess stubs)', () => {
  const dirs: string[] = [];
  after(() => {
    for (const dir of dirs) rmSync(dir, { recursive: true, force: true });
  });

  // One body serves both names: `$0` supplies the command name, and the `case` patterns only ever
  // match git's arguments, so `gh` just logs and exits 0.
  const STUB = [
    '#!/bin/sh',
    'echo "${0##*/} $*" >> "$STUB_LOG"',
    'case "$*" in',
    '  "diff --cached --quiet") exit "${STUB_DIFF_EXIT:-0}" ;;',
    '  push*) exit "${STUB_PUSH_EXIT:-0}" ;;',
    'esac',
    'exit 0',
    '',
  ].join('\n');

  type Result = { status: number | null; log: string[]; output: string };

  function runScript(script: string, env: Record<string, string> = {}): Result {
    const dir = mkdtempSync(join(tmpdir(), 's1-23-'));
    dirs.push(dir);
    for (const name of ['git', 'gh']) {
      writeFileSync(join(dir, name), STUB);
      chmodSync(join(dir, name), 0o755);
    }
    const scriptFile = join(dir, 'step.sh');
    const log = join(dir, 'stub.log');
    const output = join(dir, 'github_output');
    writeFileSync(scriptFile, script);
    writeFileSync(log, '');
    writeFileSync(output, '');
    const run = spawnSync('/bin/bash', ['--noprofile', '--norc', '-eo', 'pipefail', scriptFile], {
      cwd: dir,
      encoding: 'utf8',
      env: { ...process.env, PATH: dir, GITHUB_OUTPUT: output, STUB_LOG: log, ...env },
    });
    assert.ifError(run.error);
    return {
      status: run.status,
      log: readFileSync(log, 'utf8').split('\n').filter(Boolean),
      output: readFileSync(output, 'utf8'),
    };
  }

  const commitScript = (): string => step(refresh, 'Commit and push if changed').run ?? '';

  it('unchanged data stages, diffs, and records changed=false', () => {
    const { status, log, output } = runScript(commitScript(), { STUB_DIFF_EXIT: '0' });
    assert.equal(status, 0);
    const adds = log.filter((line) => line.startsWith('git add '));
    assert.equal(adds.length, 1);
    for (const name of ['cohort-unemployment-data', 'cohort-swe-age-data', 'rate-data']) {
      assert.ok(adds[0].includes(`public/blog/posts/assets/${name}.json`), `git add is missing ${name}`);
    }
    assert.equal(log.filter((line) => line === 'git diff --cached --quiet').length, 1);
    assert.deepEqual(log.filter((line) => /commit|push/.test(line)), []);
    assert.equal(output.trim(), 'changed=false');
  });

  it('changed data commits as the bot, pushes, then records changed=true', () => {
    const { status, log, output } = runScript(commitScript(), { STUB_DIFF_EXIT: '1' });
    assert.equal(status, 0);
    assert.deepEqual(
      log.map((line) => line.split(' ').slice(0, 2).join(' ')),
      ['git add', 'git diff', 'git -c', 'git push'],
    );
    const commit = log[2];
    assert.ok(commit.includes('user.name=github-actions[bot]'));
    assert.ok(commit.includes('user.email=41898282+github-actions[bot]@users.noreply.github.com'));
    assert.ok(commit.includes('-m Refresh chart data snapshots'));
    assert.equal(output.trim(), 'changed=true');
  });

  it('a failed push aborts before any output, so no deploy can follow', () => {
    const { status, log, output } = runScript(commitScript(), {
      STUB_DIFF_EXIT: '1',
      STUB_PUSH_EXIT: '1',
    });
    assert.notEqual(status, 0);
    // The failure has to be the push, not something earlier: the commit ran and the push was tried.
    assert.equal(log.filter((line) => line.includes('commit -m')).length, 1);
    assert.equal(log.filter((line) => line.startsWith('git push')).length, 1);
    assert.ok(!output.includes('changed='), `push failed but wrote step outputs: ${output}`);
  });

  it('each dispatch step runs exactly one gh command and nothing else', () => {
    for (const name of ['Redeploy Pages', 'Verify deploy dispatch (deploy=false)']) {
      const expected = step(refresh, name).run?.trim() ?? '';
      const { status, log } = runScript(`${expected}\n`);
      assert.equal(status, 0, name);
      assert.deepEqual(log, [expected], name);
    }
  });
});
