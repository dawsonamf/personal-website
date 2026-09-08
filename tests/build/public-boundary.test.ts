// S1-22: the complete production-publication boundary from one faithful isolated build.
// Run: node --test --test-concurrency=1 tests/build/public-boundary.test.ts
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import {
  cpSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  rmdirSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs';
import { join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { after, before, describe, it } from 'node:test';

const repoRoot = resolve(import.meta.dirname, '..', '..');
const scratchRoot = resolve(process.env.TEST_BUILD_OUT_DIR ?? tmpdir());
const evidenceRoot = resolve(process.env.PARITY_OUT_DIR ?? scratchRoot, 'public-boundary');
const astroBin = join(repoRoot, 'node_modules', 'astro', 'bin', 'astro.mjs');
const BUILD_MS = 180_000;
const INPUT_DIRS = [
  'src', 'public', 'docs',
] as const;
const INPUT_FILES = [
  'astro.config.mjs', 'package.json', 'package-lock.json', 'tsconfig.json', '.nvmrc',
  'CLAUDE.md', 'CNAME', '.nojekyll',
] as const;

const THEMES = [
  'default', 'brutalist', 'marquee', 'blueprint', 'field-notes', 'doodle', 'grid',
  'miami-deco', 'bauhaus', 'chinoiserie', 'gallery', 'banknote', 'neo-pop',
  'broadsheet', 'studio', 'wheatpaste',
] as const;
const POSTS = [
  'fly-on-my-laptop', 'underviewed-art', 'arena-freshness', 'helm', 'toolbelt',
  'embedded-swift-agent', 'metr-doubling', 'college-projects',
] as const;
const EXTERNAL_REDIRECTS = ['blog/autoencoders-1/index.html', 'blog/autoencoders-2/index.html'];
const SUBSITE_REDIRECTS = ['12years/index.html', 'embedded-swift-agent/index.html'];
const PUBLIC_HTML = [
  'blog/post.html',
  'subsites/dawson/embedded-swift-agent/index.html',
  'subsites/elise/12years/index.html',
];
const INTENTIONAL_MARKDOWN = 'subsites/dawson/embedded-swift-agent/embedded-swift-agent-context.md';
const EXPECTED_PUBLIC_PATHS_SHA256 = '7fd05f405cc4c0949efc5328d184abf848f268028a18b92599ccf3772a7ee579';
const SUBSITE_HASHES: Record<string, string> = {
  'subsites/elise/12years/index.html': '5c470cb49a6322da1126b3203078419a904b258075803fc3c1329b96e703d33d',
  'subsites/elise/12years/then.jpeg': '54483102680a63580ce70fe04b457953f25d2236ee30041b930738354d1f18ce',
  'subsites/elise/12years/now.jpeg': 'dcef48640ef4b3b6708450e7b05ae2d38564965ab060c6acf6bca8cb054a047e',
  'subsites/dawson/embedded-swift-agent/index.html': 'e685b6a77ce3099be6168c223998d609e9bd92fccd9ad084d1e20bc3126d77ae',
  'subsites/dawson/embedded-swift-agent/agent.js': '574f2076991df09a88e42cf3af87b8db7b7a66b27c2692949039de09959d9a73',
  'subsites/dawson/embedded-swift-agent/EmbeddedSwiftAgent.wasm': '987f593b23664dae7a8b42181ceae4365fff4ff6a4456c9889c638458f56e9a1',
  [INTENTIONAL_MARKDOWN]: '8bf0980b3df7a68015a83d03cfb90a58b17e1f0fae1b1966286bc9bf2f2319b5',
};

function filesUnder(root: string): string[] {
  if (!existsSync(root)) return [];
  return readdirSync(root, { recursive: true, withFileTypes: true })
    .filter((entry) => entry.isFile())
    .map((entry) => join(entry.parentPath, entry.name).slice(root.length + 1))
    .sort();
}

function sha256(value: Buffer | string): string {
  return createHash('sha256').update(value).digest('hex');
}

function manifest(root: string, paths = filesUnder(root)): string {
  return paths.map((path) => {
    const bytes = readFileSync(join(root, path));
    return `${sha256(bytes)}  ${bytes.length.toString().padStart(9)}  ${path}`;
  }).join('\n') + '\n';
}

function scopedManifest(root: string): string {
  const files = INPUT_DIRS.flatMap((base) => filesUnder(join(root, base)).map((path) => `${base}/${path}`));
  for (const path of INPUT_FILES) {
    if (existsSync(join(root, path))) files.push(path);
  }
  return manifest(root, files.sort());
}

function linkNodeModules(root: string): void {
  const installed = join(repoRoot, 'node_modules');
  const local = join(root, 'node_modules');
  mkdirSync(local);
  for (const entry of readdirSync(installed, { withFileTypes: true })) {
    if (entry.name === '.vite' || entry.name === '.cache') continue;
    symlinkSync(join(installed, entry.name), join(local, entry.name), entry.isDirectory() ? 'dir' : 'file');
  }
}

function copyInput(root: string): void {
  for (const path of INPUT_DIRS) {
    cpSync(join(repoRoot, path), join(root, path), { recursive: true });
  }
  for (const path of INPUT_FILES) {
    cpSync(join(repoRoot, path), join(root, path));
  }
}

function engineHtml(): string[] {
  const routes: string[] = ['404.html'];
  for (const theme of THEMES) {
    const prefix = theme === 'default' ? '' : `${theme}/`;
    routes.push(`${prefix}index.html`, `${prefix}blog/index.html`, `${prefix}privacy/index.html`);
    for (const post of POSTS) routes.push(`${prefix}blog/${post}/index.html`);
  }
  return routes.sort();
}

function relativeReferences(html: string): string[] {
  const values = [
    ...html.matchAll(/\b(?:href|src)=["']([^"']+)["']/g),
    ...html.matchAll(/\b(?:fetch|import)\(["']([^"']+)["']\)/g),
    ...html.matchAll(/\bwasmUrl:\s*["']([^"']+)["']/g),
    ...html.matchAll(/\bfrom\s+["']([^"']+)["']/g),
  ].map((match) => match[1]);
  return [...new Set(values.filter((value) =>
    !value.startsWith('/')
    && !value.startsWith('#')
    && !value.startsWith('data:')
    && !/^[a-z][a-z0-9+.-]*:/i.test(value),
  ))].sort();
}

function sitemapEntries(xml: string): string[] {
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]).sort();
}

describe('S1-22 complete public boundary', () => {
  let root = '';
  let dist = '';
  let repoBefore = '';
  let repoAfter = '';
  let copyBefore = '';
  let copyAfter = '';

  before(() => {
    mkdirSync(scratchRoot, { recursive: true });
    mkdirSync(evidenceRoot, { recursive: true });
    root = mkdtempSync(join(scratchRoot, 's1-22-full-public-'));
    linkNodeModules(root);
    copyInput(root);
    repoBefore = scopedManifest(repoRoot);
    copyBefore = scopedManifest(root);
    writeFileSync(join(evidenceRoot, 'repository-source-pre.sha256'), repoBefore);
    writeFileSync(join(evidenceRoot, 'build-copy-pre.sha256'), copyBefore);

    const env: NodeJS.ProcessEnv = { ...process.env, ASTRO_TELEMETRY_DISABLED: '1' };
    delete env.PROSE_DRAFTS;
    const run = spawnSync(process.execPath, [astroBin, 'build', '--root', root], {
      cwd: root,
      encoding: 'utf8',
      env,
      timeout: BUILD_MS,
    });
    writeFileSync(join(evidenceRoot, 'astro-build.log'), `${run.stdout}${run.stderr}`);
    if (run.error) throw run.error;
    if (run.status !== 0) throw new Error(`astro build failed (${run.status}):\n${run.stdout}\n${run.stderr}`);
    dist = join(root, 'dist');
    repoAfter = scopedManifest(repoRoot);
    copyAfter = scopedManifest(root);
    writeFileSync(join(evidenceRoot, 'repository-source-post.sha256'), repoAfter);
    writeFileSync(join(evidenceRoot, 'build-copy-post.sha256'), copyAfter);
    writeFileSync(join(evidenceRoot, 'public-source.sha256'), manifest(join(repoRoot, 'public')));
    writeFileSync(join(evidenceRoot, 'production-output.sha256'), manifest(dist));
  });

  after(() => {
    if (root) rmSync(root, { recursive: true, force: true });
    try { rmdirSync(scratchRoot); } catch { /* retained sibling evidence or builds */ }
  });

  it('builds from the exact repository inputs without mutating either source tree', () => {
    assert.equal(copyBefore, repoBefore, 'faithful build-copy inputs differ from repository inputs');
    assert.equal(repoAfter, repoBefore, 'repository src/config/public inputs changed during build');
    assert.equal(copyAfter, copyBefore, 'faithful build-copy inputs changed during build');
  });

  it('keeps a complete intentional public inventory and copies every public file byte-for-byte', () => {
    const publicFiles = filesUnder(join(repoRoot, 'public'));
    assert.equal(sha256(publicFiles.join('\n') + '\n'), EXPECTED_PUBLIC_PATHS_SHA256);
    for (const path of publicFiles) {
      assert.ok(existsSync(join(dist, path)), `missing public passthrough: ${path}`);
      assert.deepEqual(readFileSync(join(dist, path)), readFileSync(join(repoRoot, 'public', path)), path);
    }
  });

  it('keeps the seven grandfathered subsite files at their immutable OLD hashes', () => {
    for (const [path, expected] of Object.entries(SUBSITE_HASHES)) {
      assert.equal(sha256(readFileSync(join(repoRoot, 'public', path))), expected, path);
    }
  });

  it('keeps the two local dependency closures and the pinned external imports unchanged', () => {
    const anniversary = readFileSync(join(repoRoot, 'public/subsites/elise/12years/index.html'), 'utf8');
    const embedded = readFileSync(join(repoRoot, 'public/subsites/dawson/embedded-swift-agent/index.html'), 'utf8');
    const agent = readFileSync(join(repoRoot, 'public/subsites/dawson/embedded-swift-agent/agent.js'), 'utf8');
    assert.deepEqual(relativeReferences(anniversary), ['now.jpeg', 'then.jpeg']);
    assert.deepEqual(relativeReferences(embedded), ['./agent.js', 'EmbeddedSwiftAgent.wasm', 'embedded-swift-agent-context.md']);
    assert.match(anniversary, /https:\/\/cdnjs\.cloudflare\.com\/ajax\/libs\/gsap\/3\.12\.5\/gsap\.min\.js/);
    assert.match(anniversary, /https:\/\/cdnjs\.cloudflare\.com\/ajax\/libs\/gsap\/3\.12\.5\/ScrollTrigger\.min\.js/);
    assert.match(embedded, /https:\/\/cdn\.jsdelivr\.net\/npm\/@xterm\/xterm@6\.0\.0\/lib\/xterm\.min\.js/);
    assert.match(embedded, /https:\/\/cdn\.jsdelivr\.net\/npm\/@xterm\/addon-fit@0\.11\.0\/lib\/addon-fit\.min\.js/);
    assert.match(agent, /from "https:\/\/cdn\.jsdelivr\.net\/npm\/@bjorn3\/browser_wasi_shim@0\.4\.2\/\+esm";/);
  });

  it('classifies the complete HTML and Markdown output with no unexpected document', () => {
    const html = filesUnder(dist).filter((path) => path.endsWith('.html'));
    const expected = [...engineHtml(), ...EXTERNAL_REDIRECTS, ...SUBSITE_REDIRECTS, ...PUBLIC_HTML].sort();
    assert.equal(engineHtml().length, 177);
    assert.deepEqual(html, expected);
    assert.deepEqual(filesUnder(dist).filter((path) => path.endsWith('.md')), [INTENTIONAL_MARKDOWN]);
  });

  it('emits only the two specified subsite redirects and preserves their static meta-refresh semantics', () => {
    const redirects = [
      ['12years/index.html', '/subsites/elise/12years/'],
      ['embedded-swift-agent/index.html', '/subsites/dawson/embedded-swift-agent/'],
    ] as const;
    for (const [path, target] of redirects) {
      const html = readFileSync(join(dist, path), 'utf8');
      assert.match(html, new RegExp(`<meta http-equiv="refresh" content="0;url=${target}">`));
      assert.match(html, new RegExp(`<link rel="canonical" href="https://www\\.dawsonamf\\.com${target}">`));
      assert.match(html, /<meta name="robots" content="noindex">/);
    }
  });

  it('keeps source-only content, drafts, rollback files, and the retired sitemap path outside production', () => {
    for (const path of ['CLAUDE.md', 'CNAME', '.nojekyll', 'sitemap.xml', 'src', 'docs']) {
      assert.equal(existsSync(join(dist, path)), false, path);
    }
    assert.equal(filesUnder(dist).some((path) => /(?:^|\/)gemma4-heretic-ara(?:\/|\.|$)/.test(path)), false);
    assert.equal(filesUnder(dist).some((path) => path.startsWith('blog/posts/') && path.endsWith('.md')), false);
  });

  it('publishes production robots and the exact 12-URL sitemap including the embedded subsite', () => {
    assert.equal(readFileSync(join(dist, 'robots.txt'), 'utf8'), [
      'User-agent: *',
      'Allow: /',
      'Disallow: /docs/',
      '',
      'Sitemap: https://www.dawsonamf.com/sitemap-index.xml',
      '',
    ].join('\n'));
    assert.ok(existsSync(join(dist, 'sitemap-index.xml')));
    assert.equal(existsSync(join(dist, 'sitemap.xml')), false);
    assert.deepEqual(sitemapEntries(readFileSync(join(dist, 'sitemap-0.xml'), 'utf8')), [
      'https://www.dawsonamf.com/',
      'https://www.dawsonamf.com/blog/',
      ...POSTS.map((id) => `https://www.dawsonamf.com/blog/${id}/`),
      'https://www.dawsonamf.com/privacy/',
      'https://www.dawsonamf.com/subsites/dawson/embedded-swift-agent/',
    ].sort());
  });

  it('keeps final embedded-agent links and the external LexChat CTA without local LexChat output', () => {
    const home = readFileSync(join(dist, 'index.html'), 'utf8');
    const listing = readFileSync(join(dist, 'blog/index.html'), 'utf8');
    const post = readFileSync(join(dist, 'blog/embedded-swift-agent/index.html'), 'utf8');
    for (const html of [home, listing]) {
      assert.match(html, /href="https:\/\/huggingface\.co\/spaces\/dawsonamf\/lexchat"[^>]*target="_blank" rel="noopener noreferrer"/);
    }
    assert.match(home, /href="\/subsites\/dawson\/embedded-swift-agent\/"/);
    assert.match(post, /href="\/subsites\/dawson\/embedded-swift-agent\/"/);
    assert.equal(filesUnder(dist).some((path) => /(?:^|\/)lexchat(?:\/|$)/.test(path)), false);
  });
});
