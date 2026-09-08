import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { after, before, describe, it } from 'node:test';

import { buildSite, cleanup, BUILD_MS, repoRoot } from '../fixtures/composition/build.ts';
import { externalPostRedirects } from '../../src/build/post-output.ts';
import { THEME_IDS } from '../../src/themes/registry.ts';
import {
  AUTHOR_THEME_ID,
  AUTHORING_MANIFEST,
  authoringOverlay,
  fixtureRoot,
} from '../../harness/fixtures/theme-authoring/fixture.ts';

const POSTS = ['arena-freshness', 'college-projects', 'embedded-swift-agent', 'fly-on-my-laptop', 'helm', 'metr-doubling', 'toolbelt', 'underviewed-art'];
const ROLE_MARKERS = ['text', 'background', 'primary', 'secondary', 'accent'];
const read = (dist: string, rel: string) => readFileSync(join(dist, rel), 'utf8');
const htmlFiles = (dist: string) => readdirSync(dist, { recursive: true, withFileTypes: true })
  .filter((entry) => entry.isFile() && entry.name.endsWith('.html'))
  .map((entry) => join(entry.parentPath, entry.name).slice(dist.length + 1));
const engineFiles = (dist: string) => {
  const preserved = new Set([
    '12years/index.html', ...Object.keys(externalPostRedirects()).map((route) => join(route.slice(1), 'index.html')),
    'blog/post.html', 'embedded-swift-agent/index.html',
    'subsites/dawson/embedded-swift-agent/index.html', 'subsites/elise/12years/index.html',
  ]);
  return htmlFiles(dist).filter((file) => !preserved.has(file));
};
const routeSet = (ids: readonly string[]) => [
  '404.html',
  ...ids.flatMap((id) => {
    const root = id === 'default' ? '' : `${id}/`;
    return [`${root}index.html`, `${root}blog/index.html`, `${root}privacy/index.html`, ...POSTS.map((post) => `${root}blog/${post}/index.html`)];
  }),
].sort();
const postSet = (ids: readonly string[]) => ids.flatMap((id) => {
  const root = id === 'default' ? '' : `${id}/`;
  return POSTS.map((post) => `${root}blog/${post}/index.html`);
}).sort();
const sitemapSet = (dist: string) => [...read(dist, 'sitemap-0.xml').matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]).sort();
const EXPECTED_SITEMAP = [
  'https://www.dawsonamf.com/',
  'https://www.dawsonamf.com/blog/',
  ...POSTS.map((post) => `https://www.dawsonamf.com/blog/${post}/`),
  'https://www.dawsonamf.com/privacy/',
  'https://www.dawsonamf.com/subsites/dawson/embedded-swift-agent/',
].sort();

describe('documented authoring inputs', () => {
  it('provides every concrete file used by the five-path workflow', () => {
    for (const name of ['Home.astro', 'author-proof.css', 'author-proof.js', 'registry-entry.ts.txt']) {
      assert.ok(existsSync(join(fixtureRoot, name)), name);
    }
    assert.deepEqual([...AUTHORING_MANIFEST], [
      'public/css/author-proof.css', 'public/js/author-proof.js', 'src/content/prose.yaml',
      'src/themes/author-proof/Home.astro', 'src/themes/registry.ts',
    ]);
  });
});

describe('S1-24 isolated structural authoring build', () => {
  let fixtureDir: string | undefined;
  let fixtureDist = '';
  let productionDir: string | undefined;
  let productionDist = '';
  let changes: { changed: string[] };
  let ordinary = { status: null as number | null, stdout: '', stderr: '' };

  before(() => {
    const fixture = buildSite('s1-24-author-', (dir) => { changes = authoringOverlay(dir); });
    fixtureDir = fixture.dir;
    fixtureDist = fixture.dist;
    for (const rel of ['package.json', 'tsconfig.json']) cpSync(join(repoRoot, rel), join(fixture.dir, rel));
    mkdirSync(join(fixture.dir, 'scripts'));
    cpSync(join(repoRoot, 'scripts', 'build-picker.mjs'), join(fixture.dir, 'scripts', 'build-picker.mjs'));
    const run = spawnSync('npm', ['run', 'build'], { cwd: fixture.dir, encoding: 'utf8', timeout: BUILD_MS, env: { ...process.env, PROSE_DRAFTS: undefined } });
    ordinary = { status: run.status, stdout: run.stdout, stderr: run.stderr };
    const production = buildSite('s1-24-production-');
    productionDir = production.dir;
    productionDist = production.dist;
  }, { timeout: BUILD_MS * 2 });

  after(() => { cleanup(fixtureDir); cleanup(productionDir); });

  it('changes exactly the documented authoring manifest', () => {
    assert.deepEqual(changes.changed, [...AUTHORING_MANIFEST]);
  });

  it('passes the ordinary prose, Astro check, Shell checks, and production build after installation', () => {
    assert.equal(ordinary.status, 0, `${ordinary.stdout}\n${ordinary.stderr}`);
  });

  it('emits exact fixture route, post, and sitemap totals', () => {
    const productionRoutes = routeSet(THEME_IDS);
    const fixtureRoutes = routeSet([...THEME_IDS, AUTHOR_THEME_ID]);
    assert.deepEqual(engineFiles(fixtureDist).sort(), fixtureRoutes);
    assert.deepEqual(engineFiles(fixtureDist).filter((file) => file.includes('/blog/') || file.startsWith('blog/')).filter((file) => POSTS.some((post) => file.endsWith(`/blog/${post}/index.html`) || file === `blog/${post}/index.html`)).sort(), postSet([...THEME_IDS, AUTHOR_THEME_ID]));
    assert.deepEqual(sitemapSet(fixtureDist), EXPECTED_SITEMAP);
    assert.deepEqual(fixtureRoutes.filter((file) => !productionRoutes.includes(file)), routeSet([AUTHOR_THEME_ID]).filter((file) => file !== '404.html'));
  });

  it('owns Home while listing, post, Privacy, and 404 use ordinary composition', () => {
    const home = read(fixtureDist, `${AUTHOR_THEME_ID}/index.html`);
    assert.match(home, /data-author-home="true"/);
    assert.match(home, /href="\/author-proof\/blog\/"/);
    assert.match(home, /href="\/author-proof\/privacy\/"/);
    assert.match(home, /href="\/css\/author-proof\.css"/);
    assert.match(home, /src="\/js\/author-proof\.js"/);
    assert.doesNotMatch(home, /id="main-body"|\/js\/script\.js|featured-carousel|typing-engine|jquery|aos|vanilla-tilt|gsap/i);
    for (const role of ROLE_MARKERS) assert.match(home, new RegExp(`data-role="${role}"`));

    for (const rel of [`${AUTHOR_THEME_ID}/blog/index.html`, `${AUTHOR_THEME_ID}/blog/toolbelt/index.html`]) {
      const html = read(fixtureDist, rel);
      assert.match(html, /id="main-body"/);
      assert.match(html, /href="\/css\/themes\/theme-base\.css"[^>]*data-style-asset/);
      assert.doesNotMatch(html, /author-proof\.(?:css|js)|data-author-home/);
    }
    const privacy = read(fixtureDist, `${AUTHOR_THEME_ID}/privacy/index.html`);
    assert.match(privacy, /Privacy Policy/);
    assert.doesNotMatch(privacy, /theme-base\.css|author-proof\.(?:css|js)/);
    const notFound = read(fixtureDist, '404.html');
    assert.match(notFound, /"author-proof"/);
    assert.doesNotMatch(notFound, /author-proof\.(?:css|js)|\.astro|"layouts"/);
  });

  it('registers the strict prose row, random profile, picker, and structural namespace', () => {
    const home = read(fixtureDist, `${AUTHOR_THEME_ID}/index.html`);
    assert.match(home, /data-id="author-proof"/);
    assert.match(home, /data-profile="[^"]*&quot;random&quot;/);
    assert.match(home, /id="tc-randomize"/);
    assert.doesNotMatch(home, /id="tc-randomize"[^>]*(?:disabled|aria-disabled="true")/);
    assert.match(read(fixtureDist, 'js/author-proof.js'), /theme\.author-proof\./);
  });

  it('builds ordinary production afterward with complete fixture absence', () => {
    assert.deepEqual(engineFiles(productionDist).sort(), routeSet(THEME_IDS));
    assert.deepEqual(engineFiles(productionDist).filter((file) => POSTS.some((post) => file.endsWith(`/blog/${post}/index.html`) || file === `blog/${post}/index.html`)).sort(), postSet(THEME_IDS));
    assert.deepEqual(sitemapSet(productionDist), EXPECTED_SITEMAP);
    assert.equal(existsSync(join(productionDist, AUTHOR_THEME_ID)), false);
    for (const file of readdirSync(productionDist, { recursive: true, withFileTypes: true }).filter((entry) => entry.isFile())) {
      const body = readFileSync(join(file.parentPath, file.name), 'utf8');
      assert.equal(body.includes(AUTHOR_THEME_ID), false, join(file.parentPath, file.name));
    }
    assert.equal(existsSync(join(productionDist, 'css/author-proof.css')), false);
    assert.equal(existsSync(join(productionDist, 'js/author-proof.js')), false);
    assert.match(read(productionDist, 'index.html'), /href="https:\/\/huggingface\.co\/spaces\/dawsonamf\/lexchat"/);
    assert.equal(existsSync(join(productionDist, 'lexchat/index.html')), false);
  });
});
