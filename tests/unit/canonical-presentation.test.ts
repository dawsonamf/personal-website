// S1-16: canonical CSS prose and carousel ticker projection.
//
// Expected ticker values execute the immutable OLD renderer with its own project
// data. Expected theme prose comes from OLD CSS declarations, so these tests do
// not restate the new implementation's constants as a second source of truth.

import assert from 'node:assert/strict';
import { runInNewContext } from 'node:vm';
import { cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve, join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { after, describe, it } from 'node:test';

import { oldDir } from '../../harness/baseline.ts';
import { canonicalStyleExtras } from '../../src/layouts/canonical/presentation.ts';
import { declarations } from '../../src/themes/apply.ts';
import { THEME_IDS } from '../../src/themes/registry.ts';

const repoRoot = resolve(import.meta.dirname, '..', '..');
const oldRoot = oldDir();
const scratchBase = resolve(process.env.TEST_BUILD_OUT_DIR ?? tmpdir());
const ownedRoots: string[] = [];

type Project = { tech?: unknown[]; [key: string]: unknown };
type StyleExtras = Record<`--${string}`, string>;

function decodeCssString(value: string): string {
  assert.equal(value.startsWith('"') && value.endsWith('"'), true);
  return value.slice(1, -1).replace(
    /\\(?:([0-9a-f]{1,6}) ?|(.))/gis,
    (_escape, hex: string | undefined, character: string | undefined) =>
      hex ? String.fromCodePoint(Number.parseInt(hex, 16)) : character!,
  );
}

function oldProjects(): Project[] {
  const source = readFileSync(resolve(oldRoot, 'js', 'blog-data.js'), 'utf8');
  const projects = runInNewContext(`${source};FEATURED_PROJECTS`, { window: {} });
  return JSON.parse(JSON.stringify(projects)) as Project[];
}

function oldTicker(projects: Project[]): StyleExtras {
  const values: StyleExtras = {};
  const window = { FEATURED_PROJECTS: projects } as Record<string, unknown>;
  const document = {
    getElementById: () => null,
    querySelectorAll: () => [],
    documentElement: {
      style: {
        setProperty(name: `--${string}`, value: string) { values[name] = value; },
      },
    },
  };
  runInNewContext(readFileSync(resolve(oldRoot, 'js', 'featured-carousel.js'), 'utf8'), {
    window,
    document,
  });
  (window.initFeaturedCarousel as (options: { isSubpage: boolean }) => void)({ isSubpage: false });
  return values;
}

async function mutatedHelper(
  rewrite: (source: string) => string,
): Promise<typeof canonicalStyleExtras> {
  mkdirSync(scratchBase, { recursive: true });
  const root = mkdtempSync(join(scratchBase, 'canonical-presentation-'));
  ownedRoots.push(root);
  cpSync(resolve(repoRoot, 'src'), resolve(root, 'src'), { recursive: true });
  symlinkSync(resolve(repoRoot, 'node_modules'), resolve(root, 'node_modules'), 'dir');

  const prosePath = resolve(root, 'src', 'content', 'prose.yaml');
  const source = readFileSync(prosePath, 'utf8');
  const changed = rewrite(source);
  assert.notEqual(changed, source, 'prose mutation must apply');
  writeFileSync(prosePath, changed);

  const module = await import(pathToFileURL(
    resolve(root, 'src', 'layouts', 'canonical', 'presentation.ts'),
  ).href) as { canonicalStyleExtras: typeof canonicalStyleExtras };
  return module.canonicalStyleExtras;
}

after(() => {
  for (const root of ownedRoots) rmSync(root, { recursive: true, force: true });
});

describe('canonicalStyleExtras', () => {
  it('matches the immutable OLD ticker run and rounded duration', () => {
    const expected = oldTicker(oldProjects());
    const actual = canonicalStyleExtras('default', { carousel: true });
    assert.deepStrictEqual(actual, expected);
    assert.equal(actual['--ticker-dur'], '87s');
  });

  it('moves both approved CSS prose literals without changing their values', () => {
    const oldMarquee = readFileSync(resolve(oldRoot, 'css', 'themes', 'marquee.css'), 'utf8');
    const fallback = oldMarquee.match(/content: var\(--ticker-run, ("[^"]*")\);/)?.[1];
    assert.ok(fallback, 'OLD marquee ticker fallback is missing');
    assert.equal(
      canonicalStyleExtras('marquee', { carousel: false })['--prose-ticker'],
      fallback,
    );

    const oldDoodle = readFileSync(resolve(oldRoot, 'css', 'themes', 'doodle.css'), 'utf8');
    const sourceValue = oldDoodle.match(/content: '(currently here [^']*)';/)?.[1];
    assert.ok(sourceValue, 'OLD doodle prose declaration is missing');
    const resolvedValue = sourceValue.replace(/\\([0-9a-f]{1,6})/gi, (_match, hex: string) =>
      String.fromCodePoint(Number.parseInt(hex, 16)),
    );
    assert.equal(
      canonicalStyleExtras('doodle', { carousel: false })['--prose-currently-here'],
      JSON.stringify(resolvedValue),
    );
  });

  it('emits theme prose on non-carousel pages and nowhere else', () => {
    for (const themeId of THEME_IDS) {
      const actual = canonicalStyleExtras(themeId, { carousel: false });
      const expectedKeys = themeId === 'marquee'
        ? ['--prose-ticker']
        : themeId === 'doodle' ? ['--prose-currently-here'] : [];
      assert.deepStrictEqual(Object.keys(actual), expectedKeys, themeId);
      assert.equal('--ticker-run' in actual, false, themeId);
      assert.equal('--ticker-dur' in actual, false, themeId);
    }
  });

  it('preserves first-seen casing and OLD separator, pass, half, run and speed behavior', async () => {
    const projects = oldProjects();
    projects.forEach((project) => { project.tech = []; });
    projects[0]!.tech = ['Alpha', 'beta', 'ALPHA'];
    projects[1]!.tech = ['Beta', 'Gamma'];
    const expected = oldTicker(projects);

    let technologyLine = 0;
    const helper = await mutatedHelper((source) => source.replace(
      /^    tech: \[.*\]$/gm,
      () => {
        const replacements = [
          '    tech: [ Alpha, beta, ALPHA ]',
          '    tech: [ Beta, Gamma ]',
        ];
        return replacements[technologyLine++] ?? '    tech: []';
      },
    ));
    assert.equal(technologyLine, projects.length);
    const actual = helper('default', { carousel: true });
    assert.deepStrictEqual(actual, expected);

    const run = JSON.parse(actual['--ticker-run']) as string;
    assert.equal((run.match(/✷ Alpha /g) ?? []).length, 4);
    assert.equal((run.match(/✷ beta /g) ?? []).length, 4);
    assert.equal((run.match(/✷ Gamma /g) ?? []).length, 4);
    assert.equal(run.includes('ALPHA'), false);
    assert.equal(run.includes('✷ Beta '), false);
    assert.equal(run.endsWith(' '), true);
  });

  it('quotes punctuation, quotes, backslashes, NUL and controls through declarations()', async () => {
    const dangerous = 'semi ; braces { } quote " slash \\ nul \0 tab \t line \n del \x7f';
    const helper = await mutatedHelper((source) => source.replace(
      '    currentlyHere: { xs: "currently here ✓" }',
      `    currentlyHere: { xs: ${JSON.stringify(dangerous)} }`,
    ));
    const value = helper('doodle', { carousel: false })['--prose-currently-here'];

    assert.equal(value.startsWith('"') && value.endsWith('"'), true);
    assert.equal(/[\u0000-\u001f\u007f]/.test(value), false, 'raw controls must not reach CSS');
    assert.equal(/[;{}]/.test(value), false, 'serializer terminators must not reach declarations()');
    assert.equal(declarations({ '--prose-currently-here': value }), `--prose-currently-here:${value};`);
    assert.equal(decodeCssString(value), dangerous.replace('\0', '\ufffd'));
    assert.match(value, /semi \\3b /);
    assert.match(value, /braces \\7b  \\7d /);
    assert.match(value, /quote \\"/);
    assert.match(value, /slash \\\\/);
    assert.match(value, /nul \\fffd /);
    assert.match(value, /tab \\9 /);
    assert.match(value, /line \\a /);
    assert.match(value, /del \\7f /);
  });
});
