// S1-08: production validation and draft previews, proven by REAL builds.
//
// Each case assembles its own throwaway project under tests/fixtures/content-preview/.tmp
// (gitignored, inside the repo so node_modules resolves by walking up) from the REAL root
// astro.config.mjs, the REAL src/ tree and the fixture's pages. Mutations are string
// replacements on the COPY; src/ and the root config are never written to.
//
// Run: node --test --test-concurrency=1 tests/build/content-validation.test.ts

import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { after, before, describe, it } from 'node:test';

import { DRAFT_CLASS } from '../../src/prose/index.ts';

const repoRoot = resolve(import.meta.dirname, '..', '..');
const fixtureRoot = join(repoRoot, 'tests', 'fixtures', 'content-preview');
const tmpRoot = join(fixtureRoot, '.tmp');
const astroBin = join(repoRoot, 'node_modules', 'astro', 'bin', 'astro.mjs');

const PROSE_YAML = join('src', 'content', 'prose.yaml');
const HELM = join('src', 'content', 'posts', 'helm.md');
const AUTOENCODERS = join('src', 'content', 'posts', 'autoencoders-1.md');
const INDEX_PAGE = join('src', 'pages', 'index.astro');
const POST_PAGE = join('src', 'pages', 'blog', '[id].astro');
const CONFIG = 'astro.config.mjs';

/** One occurrence, or the fixture drifted and the case would silently test nothing. */
function edit(dir: string, rel: string, from: string, to: string) {
  const path = join(dir, rel);
  const text = readFileSync(path, 'utf8');
  const parts = text.split(from);
  assert.equal(parts.length, 2, `${rel}: expected exactly one occurrence of ${JSON.stringify(from)}`);
  writeFileSync(path, parts.join(to));
}

const files = (dir: string) =>
  readdirSync(dir, { recursive: true, withFileTypes: true })
    .filter((entry) => entry.isFile())
    .map((entry) => join(entry.parentPath, entry.name));

type Build = ReturnType<typeof build>;

function build(name: string, opts: { mutate?: (dir: string) => void; preview?: boolean } = {}) {
  const dir = join(tmpRoot, name);
  cpSync(join(repoRoot, 'src'), join(dir, 'src'), {
    recursive: true,
    // S1-12 adds the real src/pages; this suite's page set, and therefore its counts, must
    // stay coupled to the fixture pages alone.
    filter: (src) => src !== join(repoRoot, 'src', 'pages'),
  });
  cpSync(join(repoRoot, CONFIG), join(dir, CONFIG));
  cpSync(join(fixtureRoot, 'pages'), join(dir, 'src', 'pages'), { recursive: true });
  opts.mutate?.(dir);

  const env = { ...process.env };
  delete env.PROSE_DRAFTS;
  if (opts.preview) env.PROSE_DRAFTS = 'allow';

  const run = spawnSync(process.execPath, [astroBin, 'build', '--root', dir], {
    encoding: 'utf8',
    timeout: 180_000,
    env,
  });
  assert.ifError(run.error);
  return { ...run, dir, dist: join(dir, 'dist'), out: run.stdout + run.stderr };
}

const readDist = (b: Build, ...rel: string[]) => readFileSync(join(b.dist, ...rel), 'utf8');

// The four planted drafts: a plain sized field and a label-list item in the shared YAML, a
// published post's title and an external post's description.
const ISSUES = [
  'prose:home.about.title.xs',
  'prose:projects.0.tech.0',
  'helm.md:title.s',
  'autoencoders-1.md:description.l',
];

function plantDrafts(dir: string) {
  edit(dir, PROSE_YAML, 'title: { xs: About Me }', 'title: { xs: { draft: About Me } }');
  edit(dir, PROSE_YAML, 'tech: [ Directional Ablation,', 'tech: [ { draft: Directional Ablation },');
  edit(
    dir,
    HELM,
    'title: { s: "Helm: A Workspace Switcher for VS Code and Cursor" }',
    'title: { s: { draft: "Helm: A Workspace Switcher for VS Code and Cursor" } }',
  );
  edit(
    dir,
    AUTOENCODERS,
    'description: { l: "Building intuition',
    'description: { l: { draft: "Building intuition',
  );
  edit(dir, AUTOENCODERS, 'what makes them useful." }', 'what makes them useful." } }');
}

describe('S1-08 content validation and draft preview', () => {
  const built: Record<string, Build> = {};

  before(() => {
    rmSync(tmpRoot, { recursive: true, force: true });
    mkdirSync(tmpRoot, { recursive: true });

    built.a = build('a-production');
    built.b = build('b-preview-drafts', { mutate: plantDrafts, preview: true });
    built.c = build('c-production-drafts', { mutate: plantDrafts });
    built.d = build('d-yaml-syntax', {
      mutate: (dir) => edit(dir, PROSE_YAML, 'logo: { xs: D }', 'logo: { xs: D'),
    });
    built.e = build('e-frontmatter-syntax', {
      mutate: (dir) =>
        edit(
          dir,
          HELM,
          'title: { s: "Helm: A Workspace Switcher for VS Code and Cursor" }',
          'title: { s: "Helm: A Workspace Switcher for VS Code and Cursor"',
        ),
    });
    built.f = build('f-absent-sizes', {
      mutate: (dir) => {
        edit(dir, INDEX_PAGE, "'l' /* SIZE */", "'xs' /* SIZE */");
        edit(dir, POST_PAGE, "'s' /* SIZE */", "'xs' /* SIZE */");
      },
    });
    // The real duplication: src/prose/index.ts stops being externalized, and the page set
    // reaches it only through the bundle (no index.astro, so nothing imports the
    // externalized site.ts, which would otherwise pull in the Node-loaded copy).
    built.g = build('g-duplicated-accessor', {
      mutate: (dir) => {
        rmSync(join(dir, INDEX_PAGE));
        edit(dir, CONFIG, "  './src/prose/index.ts',\n", '');
      },
    });
    // Losing the whole block fails at the first path-resolving module instead.
    built.g2 = build('g2-no-externalization', {
      mutate: (dir) => edit(dir, CONFIG, '  vite: { plugins: [externalizeSharedInstances] },\n', ''),
    });
    built.h = build('h-schema-invalid', {
      mutate: (dir) => edit(dir, PROSE_YAML, '\nnav:', '\nbogusTopLevelKey: 1\n\nnav:'),
    });
    built.i = build('i-client-import', {
      mutate: (dir) =>
        // A hoisted (not is:inline) script is bundled for the CLIENT environment.
        edit(dir, INDEX_PAGE, '  </body>', "    <script>import '../prose/index.ts';</script>\n  </body>"),
    });
  });

  after(() => {
    rmSync(tmpRoot, { recursive: true, force: true });
  });

  it('a: an unmodified production build emits approved prose and no draft record', () => {
    assert.equal(built.a.status, 0, `production build must exit 0\n${built.a.out}`);

    const home = readDist(built.a, 'index.html');
    assert.match(home, /<h1>About Me<\/h1>/, 'rendered approved prose');
    for (const marker of ['prose-draft', 'prose-pill', 'data-prose-native']) {
      assert.ok(!home.includes(marker), `production home has no ${marker}`);
    }

    assert.ok(existsSync(join(built.a.dist, 'blog', 'helm', 'index.html')), 'published post route');
    for (const id of ['gemma4-heretic-ara', 'autoencoders-1']) {
      assert.ok(!existsSync(join(built.a.dist, 'blog', id)), `no /blog/${id}/ route`);
    }

    // The draft body never reaches dist, and neither does any raw frontmatter.
    const phrase = 'Refusal in Language Models Is Mediated by a Single Direction';
    assert.ok(
      readFileSync(join(repoRoot, 'src', 'content', 'posts', 'gemma4-heretic-ara.md'), 'utf8')
        .includes(phrase),
      'the phrase still identifies the draft body',
    );
    for (const path of files(built.a.dist)) {
      const text = readFileSync(path, 'utf8');
      assert.ok(!text.includes(phrase), `${path} leaks the draft body`);
      assert.ok(!text.includes('publication:'), `${path} leaks raw frontmatter`);
    }
    const sitemap = readDist(built.a, 'sitemap-0.xml');
    // The published URL keeps the exclusion honest: an empty sitemap would pass otherwise.
    assert.ok(sitemap.includes('/blog/helm/'), 'sitemap has the published URL');
    assert.ok(!sitemap.includes('gemma4-heretic-ara'), 'sitemap has no draft URL');
  });

  it('b: a preview build marks drafts, counts them and stays asset-free', () => {
    assert.equal(built.b.status, 0, `preview build must exit 0\n${built.b.out}`);

    const home = readDist(built.b, 'index.html');
    assert.ok(home.includes(`<mark class="${DRAFT_CLASS}">`), 'drafted list item is marked');
    assert.ok(home.includes('[draft] About Me'), 'drafted text field is marked');
    assert.ok(home.includes('4 draft field(s) · 1 draft post(s)'), `pill counts\n${home}`);
    for (const issue of ISSUES) {
      assert.ok(home.includes(`<li>${issue}</li>`), `pill lists ${issue}`);
    }

    // The pill hardcodes the selector, so pin it to the constant the accessor marks with.
    assert.ok(home.includes(`.${DRAFT_CLASS} { outline:`), 'the pill CSS targets DRAFT_CLASS');

    // These exercise the fixture's own post page; it models the contract S1-19 implements
    // for the real routes.
    const gemma = readDist(built.b, 'blog', 'gemma4-heretic-ara', 'index.html');
    assert.ok(gemma.includes('<meta name="robots" content="noindex">'), 'draft post is noindex');
    assert.ok(gemma.includes('<p class="post-draft-marker">Draft</p>'), 'draft post is marked');

    const helm = readDist(built.b, 'blog', 'helm', 'index.html');
    assert.match(helm, /<title>\[draft\] Helm: /, 'drafted post title is marked');

    // The pill's CSS and JS are is:inline, so the preview build emits no extra asset.
    assert.ok(!existsSync(join(built.b.dist, '_astro')), 'no dist/_astro directory');
    assert.ok(!home.includes('/_astro/'), 'the home page references no emitted asset');
    assert.ok(home.includes("localStorage.getItem('prose.native')"), 'the pill JS is inline');
  });

  it('c: production reports every draft issue in one run', () => {
    assert.equal(built.c.status, 1, `production build with drafts must fail\n${built.c.out}`);
    for (const issue of ISSUES) {
      assert.ok(built.c.out.includes(`  ${issue}`), `stderr lists ${issue}\n${built.c.out}`);
    }
    assert.match(built.c.out, /prose: 4 unapproved draft field\(s\)/);
  });

  it('d: a YAML syntax error fails before any page renders', () => {
    assert.equal(built.d.status, 1, `broken YAML must fail\n${built.d.out}`);
    assert.match(built.d.out, /checks:/);
    assert.match(built.d.out, /prose\.yaml/);
    assert.ok(!existsSync(join(built.d.dist, 'index.html')), 'no page was emitted');
  });

  it('e: malformed post frontmatter fails and names the source', () => {
    assert.equal(built.e.status, 1, `broken frontmatter must fail\n${built.e.out}`);
    // The config:setup reader's own prefix, not an incidental mention of the filename.
    assert.match(built.e.out, /posts: helm\.md: /);
  });

  it('f: shared and post accessors feed the one unwritten set', () => {
    assert.equal(built.f.status, 1, `an absent requested size must fail\n${built.f.out}`);
    assert.ok(built.f.out.includes('prose:home.about.body:xs'), 'the shared accessor recorded');
    assert.ok(built.f.out.includes('helm.md:title:xs'), 'a post accessor recorded');
    for (const id of ['fly-on-my-laptop', 'underviewed-art', 'arena-freshness', 'toolbelt',
      'embedded-swift-agent', 'metr-doubling', 'college-projects']) {
      assert.ok(built.f.out.includes(`${id}.md:title:xs`), `${id} recorded`);
    }
    // 9 = the one shared home.about.body request + one per published post title (8 routes).
    assert.match(built.f.out, /checks: 9 requested prose size\(s\) are unwritten/);
  });

  it('g: a duplicated accessor module fails on the touch sentinel', () => {
    assert.equal(built.g.status, 1, `a second module instance must fail\n${built.g.out}`);
    assert.match(built.g.out, /checks: no prose request reached the checks integration/);
    assert.match(built.g.out, /externalization in astro\.config\.mjs no longer matches it/);
  });

  it('g2: losing the whole externalization fails at the first bundled module', () => {
    assert.equal(built.g2.status, 1, `no externalization must fail\n${built.g2.out}`);
    assert.match(built.g2.out, /bundled instead of externalized/);
    assert.match(built.g2.out, /spike-findings\.md §k/);
  });

  it('h: valid YAML that breaks the site schema fails the build', () => {
    assert.equal(built.h.status, 1, `an unknown key must fail\n${built.h.out}`);
    assert.match(built.h.out, /prose\.yaml/);
    assert.match(built.h.out, /bogusTopLevelKey/);
  });

  it('i: a client import of the build-time accessor fails the build', () => {
    assert.equal(built.i.status, 1, `a client import must fail\n${built.i.out}`);
    assert.match(built.i.out, /build-time only/);
  });
});

describe('S1-08 prose:check', () => {
  const check = (drafts?: string) => {
    const env = { ...process.env };
    delete env.PROSE_DRAFTS;
    if (drafts) env.PROSE_DRAFTS = drafts;
    const run = spawnSync(process.execPath, ['src/prose/check.ts'], {
      cwd: repoRoot,
      encoding: 'utf8',
      timeout: 60_000,
      env,
    });
    assert.ifError(run.error);
    return run;
  };

  it('refuses to vouch for a production build with PROSE_DRAFTS set', () => {
    const run = check('allow');
    assert.equal(run.status, 1, `an exported preview flag must fail\n${run.stderr}`);
    assert.match(run.stderr, /PROSE_DRAFTS=allow is set; unset it/);
  });

  it('passes on the approved content', () => {
    const run = check();
    assert.equal(run.status, 0, `approved content must pass\n${run.stderr}`);
    assert.match(run.stdout, /prose:check: 0 unapproved draft field\(s\)/);
  });
});
