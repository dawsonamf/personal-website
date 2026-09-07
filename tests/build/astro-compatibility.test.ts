// S1-01 / Spec 1 T0: Astro 7.3.1 compatibility spike, items (a)-(k).
//
// Every build runs in a throwaway copy of tests/fixtures/astro-compatibility/site
// placed inside the repo (so node_modules resolves by walking up), and each copy is
// removed in `after`. This suite never writes into the fixture source tree.
//
// Run: node --test --test-concurrency=1 tests/build/astro-compatibility.test.ts

import assert from 'node:assert/strict';
import { spawn, spawnSync } from 'node:child_process';
import { createServer } from 'node:net';
import { homedir } from 'node:os';
import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, rmdirSync, rmSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { after, before, describe, it } from 'node:test';
import { chromium } from '@playwright/test';
import type { BrowserContext, Page } from '@playwright/test';

const repoRoot = resolve(import.meta.dirname, '..', '..');
const fixtureRoot = join(repoRoot, 'tests', 'fixtures', 'astro-compatibility');
const variants = join(fixtureRoot, 'variants');
const tmpRoot = join(fixtureRoot, '.tmp');
const astroBin = join(repoRoot, 'node_modules', 'astro', 'bin', 'astro.mjs');
const oldDir = process.env.PARITY_OLD_DIR ?? resolve(repoRoot, '..', 'personal-website-old');
const browserCache = join(homedir(), 'Library', 'Caches', 'ms-playwright');

// The Astro compiler drops the whitespace-only text node that directly follows EVERY
// <script> element, including the last one before </body>. This and the absent
// trailing newline are the only two differences between the baseline markup and the
// built page. <style is:inline> is unaffected.
const dropWsAfterScript = (html: string) => html.replace(/(<\/script>)\s+/g, '$1');

const headOf = (html: string) => {
  const start = html.indexOf('<head>');
  const end = html.indexOf('</head>');
  assert.ok(start >= 0 && end > start, 'document has a <head>');
  return html.slice(start, end + '</head>'.length);
};

// Nothing in this suite may reach the network. file:// pages are unaffected.
const blockRemote = (target: BrowserContext | Page) =>
  target.route(/^https?:\/\/(?!127\.0\.0\.1[:/])/, (route) => route.abort());

const copies: string[] = [];

function buildCopy(
  name: string,
  opts: { mutate?: (dir: string) => void; env?: Record<string, string> } = {},
) {
  mkdirSync(tmpRoot, { recursive: true });
  const dir = join(tmpRoot, `${name}-${Math.random().toString(36).slice(2, 10)}`);
  copies.push(dir);
  // Astro writes a node_modules/.vite dep cache into the root it builds; never copy it.
  cpSync(join(fixtureRoot, 'site'), dir, {
    recursive: true,
    filter: (src) => !/(^|[/\\])(node_modules|dist|\.astro)([/\\]|$)/.test(src.slice(fixtureRoot.length)),
  });
  opts.mutate?.(dir);
  const run = spawnSync(process.execPath, [astroBin, 'build', '--root', dir], {
    encoding: 'utf8',
    timeout: 180_000,
    env: { ...process.env, ...opts.env },
  });
  assert.ifError(run.error);
  return { dir, dist: join(dir, 'dist'), ...run };
}

function freePort(): Promise<number> {
  return new Promise((res, rej) => {
    const probe = createServer();
    probe.on('error', rej);
    // 127.0.0.1 only: never 0.0.0.0, never a LAN address.
    probe.listen(0, '127.0.0.1', () => {
      const addr = probe.address();
      const port = typeof addr === 'object' && addr ? addr.port : 0;
      probe.close(() => res(port));
    });
  });
}

describe('T0 Astro 7.3.1 compatibility spike', () => {
  let positive: ReturnType<typeof buildCopy>;
  let cacheBefore: string[];
  let baselineHome: string;
  let builtHome: string;

  before(() => {
    cacheBefore = readdirSync(browserCache).sort();
    baselineHome = readFileSync(join(oldDir, 'index.html'), 'utf8');
    positive = buildCopy('positive');
    assert.equal(
      positive.status,
      0,
      `positive fixture build must exit 0\nSTDOUT:\n${positive.stdout}\nSTDERR:\n${positive.stderr}`,
    );
    builtHome = readFileSync(join(positive.dist, 'index.html'), 'utf8');
  });

  after(() => {
    for (const dir of copies) rmSync(dir, { recursive: true, force: true });
    // Non-recursive: removes .tmp only when this run left it empty, so a concurrent
    // run's copies are never clobbered.
    try {
      rmdirSync(tmpRoot);
    } catch {
      /* another run still owns it, or it is already gone */
    }
  });

  // (a) The Rust compiler accepts today's markup once ported, and the rendered DOM is
  //     preserved. The two known source-level transformations are applied to the
  //     BASELINE FILE, which is then parsed by the same browser as the built page, so
  //     the comparison is an exact DOM equality with no dump-level normalization.
  it('a: ported baseline markup compiles and preserves the rendered DOM', async () => {
    const scriptRuns = baselineHome.match(/(<\/script>)\s+/g) ?? [];
    assert.equal(scriptRuns.length, 15, 'whitespace runs after </script> in the baseline home');

    const dropped = dropWsAfterScript(baselineHome);
    const expectedSource = dropped.replace(/\n$/, '');
    assert.equal(dropped.length - expectedSource.length, 1, 'exactly one trailing newline removed');

    const expectedFile = join(positive.dir, 'expected-home.html');
    writeFileSync(expectedFile, expectedSource);

    const browser = await chromium.launch();
    try {
      const context = await browser.newContext({ javaScriptEnabled: false });
      await blockRemote(context);
      const page = await context.newPage();
      const outerHTML = async (file: string) => {
        await page.goto(pathToFileURL(file).href, { waitUntil: 'load' });
        return page.evaluate(() => document.documentElement.outerHTML);
      };
      // The expected file is read from the copy's dir but must resolve its relative
      // assets the same way the baseline does; with JS disabled and remote requests
      // blocked, nothing it loads can affect the DOM.
      assert.equal(await outerHTML(join(positive.dist, 'index.html')), await outerHTML(expectedFile));
    } finally {
      await browser.close();
    }
  });

  // (b) Astro injects nothing into <head> for a page with no component <style> and no
  //     bundled <script>, and the injection probe shows where an injection would land.
  it('b: no head injection on the ported page; probe records the injection position', () => {
    assert.equal(headOf(builtHome), dropWsAfterScript(headOf(baselineHome)));
    assert.ok(!builtHome.includes('/_astro/'), 'ported home references no Astro-emitted asset');
    assert.ok(!builtHome.includes('data-astro-cid-'), 'ported home has no scoped-style attributes');

    const probe = readFileSync(join(positive.dist, 'injection-probe', 'index.html'), 'utf8');
    // The extracted stylesheet link is the LAST node in <head>, directly before </head>,
    // after every authored head node and with no separating whitespace.
    assert.match(
      probe,
      /<meta name="probe-head-marker" content="authored-last-head-node">\n<link rel="stylesheet" href="\/_astro\/[^"]+\.css"><\/head>/,
    );
    // A processed (bundled, external) script is rendered in place in the body, not hoisted.
    assert.match(
      probe,
      /<h1 id="probe"[^>]*>probe<\/h1>[\s\S]*<script type="module" src="\/_astro\/[^"]+\.js"><\/script><\/body>/,
    );
    assert.ok(!headOf(probe).includes('<script'), 'the bundled script is not hoisted into <head>');
  });

  // (c) [...theme] with theme: undefined emits the root routes as well as the themed ones.
  it('c: undefined rest parameter emits root routes', () => {
    for (const rel of [
      'index.html',
      'blog/index.html',
      'brutalist/index.html',
      'brutalist/blog/index.html',
    ]) {
      assert.ok(existsSync(join(positive.dist, rel)), `dist/${rel} exists`);
    }
  });

  // (d) 404.astro emits dist/404.html, not dist/404/index.html.
  it('d: 404.astro emits dist/404.html', () => {
    assert.ok(existsSync(join(positive.dist, '404.html')), 'dist/404.html exists');
    assert.ok(
      !existsSync(join(positive.dist, '404', 'index.html')),
      'dist/404/index.html must not exist under build.format: directory',
    );
  });

  // (e1) prerenderConflictBehavior: 'error' fires on a planted duplicate prerendered URL.
  it('e: a planted route collision fails the build', () => {
    const collision = buildCopy('collision', {
      mutate: (dir) => {
        cpSync(join(variants, 'collision-index.astro'), join(dir, 'src', 'pages', 'index.astro'));
      },
    });
    assert.equal(collision.status, 1, 'collision build exits 1');
    assert.match(collision.stderr + collision.stdout, /PrerenderRouteConflict/);
  });

  // (e2) ...and on duplicate content-entry ids from file() (D2's second claim).
  it('e: planted duplicate content-entry ids fail the build', () => {
    const dupes = buildCopy('entry-ids', {
      mutate: (dir) => {
        cpSync(
          join(variants, 'duplicate-entry-ids.content.config.ts'),
          join(dir, 'src', 'content.config.ts'),
        );
        cpSync(
          join(variants, 'duplicate-entry-ids.json'),
          join(dir, 'src', 'content', 'duplicate-entry-ids.json'),
        );
      },
    });
    assert.equal(dupes.status, 1, 'duplicate-entry-id build exits 1');
    assert.match(dupes.stderr + dupes.stdout, /DuplicateContentEntrySlugError/);
  });

  // (f) A throw in astro:build:done exits nonzero.
  it('f: a throwing astro:build:done hook fails the build', () => {
    const thrown = buildCopy('build-done-throw', { env: { SPIKE_BUILD_DONE_THROW: '1' } });
    assert.equal(thrown.status, 1, 'throwing-hook build exits 1');
    assert.match(thrown.stderr + thrown.stdout, /SPIKE_F_THROW/);
  });

  // (g) A post rendered from entry.body through marked + highlight.js emits marked's
  //     markup, never Astro's Markdown pipeline output.
  it('g: post body renders through marked, not the Astro pipeline', () => {
    const post = readFileSync(join(positive.dist, 'post', 'index.html'), 'utf8');
    assert.ok(post.includes('<pre><code class="hljs language-js">'), 'highlighted js fence');
    // marked's code override interpolates the fence body raw, exactly as
    // blog/blog-post.js does today, so the arrow is NOT entity-escaped.
    assert.ok(post.includes('<div class="mermaid">graph TD; A-->B;</div>'), 'mermaid fence');
    assert.ok(
      post.includes(
        '<a href="https://example.com/thing" class="text-link" target="_blank" rel="noopener noreferrer">',
      ),
      'external link renderer override',
    );
    assert.ok(
      post.includes('<img src="/resources/spike.jpg" alt="a picture" class="blog-image">'),
      'image renderer override',
    );
    for (const marker of ['astro-code', 'data-language', '<pre class="astro-code']) {
      assert.ok(!post.includes(marker), `no Astro-pipeline marker: ${marker}`);
    }
  });

  // (h) redirects emit a meta-refresh stub in static output.
  it('h: redirects emit a meta-refresh stub', () => {
    const stub = join(positive.dist, '12years', 'index.html');
    assert.ok(existsSync(stub), 'dist/12years/index.html exists');
    assert.match(
      readFileSync(stub, 'utf8'),
      /<meta http-equiv="refresh" content="0;url=\/subsites\/elise\/12years\/">/,
    );
  });

  // (i) public/ is copied verbatim, nested dirs intact, the +esm specifier untouched.
  it('i: public/ files are copied byte-for-byte', () => {
    const agentRel = join('subsites', 'dawson', 'embedded-swift-agent', 'agent.js');
    const built = readFileSync(join(positive.dist, agentRel));
    const source = readFileSync(join(oldDir, 'embedded-swift-agent', 'agent.js'));
    assert.ok(built.equals(source), 'agent.js is byte-identical to the baseline copy');
    assert.match(
      built.toString('utf8'),
      /from "https:\/\/cdn\.jsdelivr\.net\/npm\/@bjorn3\/browser_wasi_shim@0\.4\.2\/\+esm";/,
    );
    const plainRel = join('nested', 'deep', 'plain.txt');
    assert.ok(
      readFileSync(join(positive.dist, plainRel)).equals(
        readFileSync(join(fixtureRoot, 'site', 'public', plainRel)),
      ),
      'nested plain file is byte-identical',
    );
  });

  // (j) python3 -m http.server on loopback + the cached Chromium 1228, no download.
  it('j: loopback python server serves dist to the cached Chromium', async () => {
    const port = await freePort();
    const server = spawn(
      'python3',
      ['-m', 'http.server', '--bind', '127.0.0.1', String(port), '--directory', positive.dist],
      { stdio: 'ignore' },
    );
    // Resolve on error too, so `await exited` cannot hang if python3 is missing.
    const exited = new Promise<void>((res) => {
      server.once('exit', () => res());
      server.once('error', () => res());
    });
    try {
      const base = `http://127.0.0.1:${port}`;
      let ready = false;
      for (let i = 0; i < 100 && !ready; i++) {
        try {
          ready = (await fetch(`${base}/index.html`)).ok;
        } catch {
          await new Promise((r) => setTimeout(r, 50));
        }
      }
      assert.ok(ready, 'loopback server became ready');

      assert.match(
        chromium.executablePath(),
        /ms-playwright\/chromium-1228\//,
        'Playwright resolves the already-cached Chromium build 1228',
      );

      const browser = await chromium.launch();
      try {
        const page = await browser.newPage();
        await blockRemote(page);
        await page.goto(`${base}/index.html`, { waitUntil: 'domcontentloaded' });
        assert.equal(await page.title(), 'Dawson Metzger-Fleetwood');
        assert.equal(await page.locator('#typing-container #typing-text').count(), 1);
      } finally {
        await browser.close();
      }
    } finally {
      server.kill('SIGTERM');
      await exited;
    }
  });

  // (k) The checks integration and the page components share ONE accessor instance.
  it('k: checks integration shares the accessor module instance', () => {
    const log = positive.stdout + positive.stderr;
    assert.match(log, /unwrittenSizes\.size=1 entries=\["spike:home\.about\.body:xs"\]/);
    assert.match(log, /SPIKE_K_OK: shared module instance confirmed\./);
  });

  it('no Playwright browser was downloaded', () => {
    assert.deepEqual(readdirSync(browserCache).sort(), cacheBefore);
  });
});
