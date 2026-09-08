/**
 * S1-19 browser contract for the real production post route.
 *
 * Each Playwright project builds an isolated copy of the current source, serves it from a
 * test-owned ephemeral 127.0.0.1 listener, and removes that copy after closing the listener.
 * Mermaid, Plotly, and js-yaml remain their exact pinned production downloads: the tests wait for
 * their real output instead of substituting diagram/chart stubs.
 */
import { expect, test, type Page } from '@playwright/test';
import { spawnSync } from 'node:child_process';
import {
  cpSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs';
import { createServer, type Server } from 'node:http';
import { tmpdir } from 'node:os';
import { extname, isAbsolute, join, relative, resolve, sep } from 'node:path';
import { installDeterminism, randomDraws, randomSeedState, STATIC_PAGE_SEED } from '../../harness/determinism.ts';
import { createMigratedAdapter } from '../../harness/migrated.ts';

const BUILD_MS = 180_000;
const repoRoot = resolve(import.meta.dirname, '..', '..');
const MERMAID = 'https://cdn.jsdelivr.net/npm/mermaid@11.15.0/dist/mermaid.min.js';
const PLOTLY = 'https://cdn.plot.ly/plotly-2.27.0.min.js';
const YAML = 'https://cdn.jsdelivr.net/npm/js-yaml@4.2.0/dist/js-yaml.min.js';

let server: Server | undefined;
let origin = '';
let ownedRoot = '';
let distRoot = '';
let listener: { address: string; port: number } | undefined;

function contained(root: string, candidate: string): boolean {
  const rel = relative(root, candidate);
  return rel === '' || (!rel.startsWith('..' + sep) && rel !== '..' && !isAbsolute(rel));
}

function resolveRequest(pathname: string): string | undefined {
  let decoded: string;
  try {
    decoded = decodeURIComponent(pathname.slice(1));
  } catch {
    return undefined;
  }
  if (decoded.includes('\0')) return undefined;
  let file = resolve(distRoot, decoded);
  if (!contained(distRoot, file)) return undefined;
  try {
    if (statSync(file).isDirectory()) file = resolve(file, 'index.html');
  } catch {
    return undefined;
  }
  return contained(distRoot, file) && existsSync(file) ? file : undefined;
}

function contentType(file: string): string {
  return ({
    '.css': 'text/css',
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.svg': 'image/svg+xml',
    '.ttf': 'font/ttf',
    '.woff2': 'font/woff2',
  } as Record<string, string>)[extname(file)] ?? 'application/octet-stream';
}

function buildSite(projectRoot: string): string {
  for (const path of ['src', 'public']) {
    cpSync(resolve(repoRoot, path), resolve(projectRoot, path), { recursive: true });
  }
  for (const path of ['astro.config.mjs', 'package.json', 'tsconfig.json']) {
    cpSync(resolve(repoRoot, path), resolve(projectRoot, path));
  }
  const installed = resolve(repoRoot, 'node_modules');
  const local = resolve(projectRoot, 'node_modules');
  mkdirSync(local, { recursive: true });
  for (const entry of readdirSync(installed, { withFileTypes: true })) {
    if (entry.name === '.vite' || entry.name === '.cache' || entry.name === '.astro') continue;
    symlinkSync(
      resolve(installed, entry.name),
      resolve(local, entry.name),
      entry.isDirectory() ? 'dir' : 'file',
    );
  }
  const dist = resolve(projectRoot, 'dist');
  const env: NodeJS.ProcessEnv = { ...process.env, ASTRO_TELEMETRY_DISABLED: '1', TEST_BUILD_OUT_DIR: dist };
  delete env.PROSE_DRAFTS;
  const run = spawnSync(
    process.execPath,
    [resolve(repoRoot, 'node_modules', 'astro', 'bin', 'astro.mjs'), 'build', '--root', projectRoot],
    {
      cwd: projectRoot,
      encoding: 'utf8',
      timeout: BUILD_MS,
      killSignal: 'SIGTERM',
      env,
    },
  );
  if (run.error) throw run.error;
  if (run.status !== 0) {
    throw new Error(`Astro post fixture build failed (${run.status}):\n${run.stdout}\n${run.stderr}`);
  }
  return dist;
}

async function closeServer(): Promise<void> {
  if (!server) return;
  if (!server.listening) {
    server = undefined;
    return;
  }
  server.closeIdleConnections?.();
  server.closeAllConnections?.();
  await new Promise<void>((done, reject) => server!.close((error) => error ? reject(error) : done()));
}

test.beforeAll(async ({}, workerInfo) => {
  const scratchBase = resolve(process.env.TEST_BUILD_OUT_DIR ?? tmpdir());
  mkdirSync(scratchBase, { recursive: true });
  ownedRoot = mkdtempSync(join(scratchBase, `post-behavior-${workerInfo.project.name}-w${workerInfo.workerIndex}-`));

  try {
    distRoot = buildSite(resolve(ownedRoot, 'site'));
    server = createServer((request, response) => {
      const pathname = new URL(request.url ?? '/', 'http://fixture.invalid').pathname;
      const file = resolveRequest(pathname);
      if (!file) {
        response.statusCode = 404;
        response.end('missing');
        return;
      }
      response.setHeader('content-type', contentType(file));
      response.end(readFileSync(file));
    });
    await new Promise<void>((done, reject) => {
      server!.once('error', reject);
      server!.listen(0, '127.0.0.1', done);
    });
    const address = server.address();
    if (!address || typeof address === 'string') throw new Error('post fixture did not bind TCP');
    listener = { address: address.address, port: address.port };
    expect(listener.address).toBe('127.0.0.1');
    origin = `http://127.0.0.1:${address.port}`;
  } catch (error) {
    await closeServer().catch(() => {});
    if (ownedRoot) rmSync(ownedRoot, { recursive: true, force: true });
    throw error;
  }
});

test.afterAll(async ({}, workerInfo) => {
  let closeError: unknown;
  try {
    await closeServer();
  } catch (error) {
    closeError = error;
  }
  const listeningAfterClose = server?.listening ?? false;
  if (ownedRoot) rmSync(ownedRoot, { recursive: true, force: true });
  const rootRemoved = !ownedRoot || !existsSync(ownedRoot);
  const proofRoot = resolve(process.env.PARITY_OUT_DIR ?? tmpdir(), 'cleanup');
  mkdirSync(proofRoot, { recursive: true });
  writeFileSync(resolve(proofRoot, `post-behavior-${workerInfo.project.name}-w${workerInfo.workerIndex}.json`), JSON.stringify({
    listener,
    listeningAfterClose,
    rootRemoved,
    closeError: closeError instanceof Error ? closeError.message : closeError ? String(closeError) : null,
  }, null, 2));
  server = undefined;
  if (closeError) throw closeError;
  expect(listeningAfterClose).toBe(false);
  expect(rootRemoved).toBe(true);
});

interface NetworkRecord {
  responses: Array<{ url: string; status: number }>;
  failed: Array<{ url: string; error: string }>;
  requests: string[];
}

async function observeNetwork(page: Page): Promise<NetworkRecord> {
  const record: NetworkRecord = { responses: [], failed: [], requests: [] };
  page.on('request', (request) => record.requests.push(request.url()));
  page.on('response', (response) => record.responses.push({ url: response.url(), status: response.status() }));
  page.on('requestfailed', (request) => record.failed.push({
    url: request.url(),
    error: request.failure()?.errorText ?? 'unknown',
  }));
  await page.route((url) => url.hostname === 'corsproxy.io', (route) => route.abort());
  return record;
}

function expectNoBadResponses(record: NetworkRecord): void {
  expect(record.responses.filter(({ status }) => status >= 400)).toEqual([]);
  expect(record.failed.filter(({ url }) => new URL(url).hostname !== 'corsproxy.io')).toEqual([]);
}

async function expectViewport(page: Page): Promise<void> {
  expect(await page.evaluate(() => ({ width: innerWidth, height: innerHeight }))).toEqual(page.viewportSize());
}

async function settleDeferredFonts(page: Page): Promise<void> {
  await page.evaluate(async () => {
    await new Promise<void>((done) => {
      const idle = (window as Window & { requestIdleCallback?: (callback: () => void, options: { timeout: number }) => number }).requestIdleCallback;
      if (idle) {
        idle(() => done(), { timeout: 2600 });
      } else {
        window.setTimeout(done, 2600);
      }
    });
    await document.fonts.ready;
  });
}

test('Toolbelt runs both real pinned Mermaid diagrams without runtime Markdown libraries', async ({ page }) => {
  const network = await observeNetwork(page);
  await page.goto(`${origin}/blog/toolbelt/`, { waitUntil: 'load' });
  await expectViewport(page);
  await expect(page.locator('#post-content .mermaid')).toHaveCount(2);
  await expect.poll(() => page.locator('#post-content .mermaid svg').count()).toBe(2);
  const diagrams = await page.locator('#post-content .mermaid svg').evaluateAll((nodes) => nodes.map((node) => ({
    nodes: node.querySelectorAll('g.node').length,
    edges: node.querySelectorAll('g.edgePath, path.flowchart-link').length,
    markup: node.innerHTML.length,
  })));
  expect(diagrams).toHaveLength(2);
  for (const diagram of diagrams) {
    expect(diagram.nodes).toBeGreaterThanOrEqual(3);
    expect(diagram.edges).toBeGreaterThanOrEqual(2);
    expect(diagram.markup).toBeGreaterThan(1_000);
  }
  const mermaidOrder = await page.evaluate(() => {
    const tooltips = [...document.querySelectorAll('.mermaidTooltip')];
    const tooltip = tooltips[0];
    const dock = document.getElementById('tc-dock');
    const scrim = document.getElementById('tc-scrim');
    return {
      count: tooltips.length,
      afterDock: !!tooltip && !!dock && !!(dock.compareDocumentPosition(tooltip) & Node.DOCUMENT_POSITION_FOLLOWING),
      afterScrim: !!tooltip && !!scrim && !!(scrim.compareDocumentPosition(tooltip) & Node.DOCUMENT_POSITION_FOLLOWING),
    };
  });
  expect(mermaidOrder).toEqual({ count: 1, afterDock: true, afterScrim: true });
  await page.evaluate(() => document.dispatchEvent(new Event('DOMContentLoaded')));
  await expect(page.locator('#post-content .mermaid svg')).toHaveCount(2);
  await expect(page.locator('.mermaidTooltip')).toHaveCount(1);
  expect(network.requests.filter((url) => url === MERMAID)).toHaveLength(1);
  const scripts = await page.locator('script[src]').evaluateAll((nodes) =>
    nodes.map((node) => (node as HTMLScriptElement).src));
  expect(scripts.some((src) => /(?:marked|highlight(?:\.min)?)\.js/i.test(src))).toBe(false);
  expect(scripts.some((src) => /aos|calendly/i.test(src))).toBe(false);
  expect(scripts.some((src) => /anim-utils/i.test(src))).toBe(false);
  await settleDeferredFonts(page);
  expectNoBadResponses(network);
});

test('copy reads current visible code and keeps its state for the exact 1500 ms timer', async ({ page }) => {
  await page.addInitScript(() => {
    const nativeSetTimeout = window.setTimeout.bind(window);
    const callbacks: Array<() => void> = [];
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText: async (value: string) => { (window as any).__copiedText = value; } },
    });
    (window as any).__copyTimerDelays = [];
    (window as any).__runCopyTimers = () => callbacks.splice(0).forEach((callback) => callback());
    window.setTimeout = ((callback: TimerHandler, delay?: number, ...args: unknown[]) => {
      if (delay === 1500 && typeof callback === 'function') {
        (window as any).__copyTimerDelays.push(delay);
        callbacks.push(() => callback(...args));
        return 91;
      }
      return nativeSetTimeout(callback, delay, ...args);
    }) as typeof window.setTimeout;
  });
  const network = await observeNetwork(page);
  await page.goto(`${origin}/blog/embedded-swift-agent/`, { waitUntil: 'load' });
  const first = page.locator('#post-content pre.has-copy-btn').first();
  await first.locator('code').evaluate((code) => { (code as HTMLElement).innerText = 'late visible C mutation\nsecond line'; });
  await first.locator('.code-copy-btn').click();
  await expect(first.locator('.code-copy-btn')).toHaveClass(/copied/);
  expect(await page.evaluate(() => (window as any).__copiedText)).toBe('late visible C mutation\nsecond line');
  expect(await page.evaluate(() => (window as any).__copyTimerDelays)).toEqual([1500]);
  await expect(first.locator('.code-copy-btn')).toHaveClass(/copied/);
  await page.evaluate(() => (window as any).__runCopyTimers());
  await expect(first.locator('.code-copy-btn')).not.toHaveClass(/copied/);
  await settleDeferredFonts(page);
  expectNoBadResponses(network);
});

test('embedded-swift-agent keeps C, nine Swift blocks, visible-text reading time, and image tilt rules', async ({ page }) => {
  const network = await observeNetwork(page);
  await page.goto(`${origin}/blog/embedded-swift-agent/`, { waitUntil: 'load' });
  await expectViewport(page);
  await expect(page.locator('#post-content pre.has-copy-btn code.hljs.language-c')).toHaveCount(1);
  await expect(page.locator('#post-content pre.has-copy-btn code.hljs.language-swift')).toHaveCount(9);
  await expect(page.locator('#post-content .code-copy-btn')).toHaveCount(10);
  const expectedReadTime = await page.locator('#post-content').evaluate((content) => {
    const words = (content as HTMLElement).innerText.trim().split(/\s+/).filter(Boolean).length;
    return `${Math.max(1, Math.round(words / 200))} min read`;
  });
  await expect(page.locator('#read-time')).toHaveText(expectedReadTime);

  const image = page.locator('#post-content img.blog-image');
  await expect(image).toHaveCount(1);
  const tilt = await image.evaluate((node) => {
    const instance = (node as HTMLElement & { vanillaTilt?: { settings?: Record<string, unknown> } }).vanillaTilt;
    return { settings: instance?.settings ?? null, glare: !!node.querySelector('.js-tilt-glare') };
  });
  expect(tilt.settings).toMatchObject({
    max: 8,
    speed: 6000,
    perspective: 1200,
    scale: 1,
    glare: true,
    'max-glare': 0.15,
    gyroscope: true,
  });
  expect(tilt.glare).toBe(true);

  await settleDeferredFonts(page);
  expectNoBadResponses(network);

  const blockedPage = await page.context().newPage();
  const blockedNetwork = await observeNetwork(blockedPage);
  await blockedPage.goto(`${origin}/brutalist/blog/embedded-swift-agent/`, { waitUntil: 'load' });
  await expect(blockedPage.locator('html')).toHaveAttribute('data-no-tilt', '');
  const blocked = await blockedPage.locator('#post-content img.blog-image').evaluate((node) => ({
    instance: !!(node as HTMLElement & { vanillaTilt?: unknown }).vanillaTilt,
    glare: !!node.querySelector('.js-tilt-glare'),
  }));
  expect(blocked).toEqual({ instance: false, glare: false });
  await settleDeferredFonts(blockedPage);
  expectNoBadResponses(blockedNetwork);
  await blockedPage.close();
});

test('METR runs pinned Plotly then js-yaml then the real fallback chart asset', async ({ page }) => {
  const network = await observeNetwork(page);
  await page.goto(`${origin}/blog/metr-doubling/`, { waitUntil: 'load' });
  await expectViewport(page);
  await page.waitForFunction(() => (
    'Plotly' in window
      && 'jsyaml' in window
      && !!document.querySelector('#metr-chart.js-plotly-plot svg.main-svg')
      && /mo/.test(document.getElementById('doubling-times')?.innerText ?? '')
  ));
  const order = [
    network.requests.indexOf(PLOTLY),
    network.requests.indexOf(YAML),
    network.requests.findIndex((url) => url === `${origin}/blog/posts/assets/metr-chart.js`),
  ];
  expect(order.every((index) => index >= 0)).toBe(true);
  expect(order[0]).toBeLessThan(order[1]!);
  expect(order[1]).toBeLessThan(order[2]!);
  await expect(page.locator('#metr-chart.js-plotly-plot')).toHaveCount(1);
  await expect(page.locator('#metr-chart.js-plotly-plot svg.main-svg')).toHaveCount(3);
  await expect(page.locator('#metr-chart.js-plotly-plot .scatterlayer .trace')).toHaveCount(9);
  expect(await page.locator('#metr-chart').evaluate((node) => node.innerHTML.length)).toBeGreaterThan(20_000);
  await expect(page.locator('#doubling-times')).toContainText('all-time doubling:');
  await expect(page.locator('#doubling-times')).toContainText('post-2023 doubling:');
  await settleDeferredFonts(page);
  expectNoBadResponses(network);
});

test('diagram-free posts make no Mermaid request and internal body links and assets resolve', async ({ page, request }) => {
  for (const id of ['embedded-swift-agent', 'metr-doubling'] as const) {
    const target = await page.context().newPage();
    const network = await observeNetwork(target);
    await target.goto(`${origin}/blog/${id}/`, { waitUntil: 'load' });
    if (id === 'metr-doubling') {
      await target.waitForFunction(() => !!document.querySelector('#metr-chart svg.main-svg'));
    }
    expect(network.requests.some((url) => url.includes('/mermaid@'))).toBe(false);
    await expect(target.locator('#post-content .mermaid')).toHaveCount(0);

    const local = await target.locator('#post-content a[href], #post-content img[src]').evaluateAll((nodes, localOrigin) =>
      [...new Set(nodes.map((node) => {
        const value = node.getAttribute(node.tagName === 'A' ? 'href' : 'src');
        if (!value) return null;
        const url = new URL(value, document.baseURI);
        return url.origin === localOrigin ? url.pathname : null;
      }).filter((value): value is string => value !== null))], origin);
    for (const path of local) {
      const response = await request.get(origin + path);
      expect(response.status(), `${id}: ${path}`).toBeLessThan(400);
    }
    await settleDeferredFonts(target);
    expectNoBadResponses(network);
    await target.close();
  }
});

test('production fixture excludes drafts even when the parent environment requests preview', async ({ request }) => {
  const response = await request.get(`${origin}/blog/gemma4-heretic-ara/`);
  expect(response.status()).toBe(404);
  expect(existsSync(resolve(distRoot, 'blog', 'gemma4-heretic-ara', 'index.html'))).toBe(false);
});

test('route-aware random calibration follows the actual document across navigation and reload', async ({ page }) => {
  const adapter = createMigratedAdapter();
  const seeds = Object.fromEntries([
    '/', '/blog/', '/blog/toolbelt/', '/blog/embedded-swift-agent/', '/blog/metr-doubling/', '/definitely-unknown',
  ].map((location) => [location, STATIC_PAGE_SEED]));
  for (const location of adapter.postRandomPhaseLocations) seeds[location] ??= STATIC_PAGE_SEED;
  await installDeterminism(page, STATIC_PAGE_SEED, {
    seeds,
    phaseAdvanceLocations: adapter.postRandomPhaseLocations,
  });

  const visit = async (path: string) => {
    await page.goto(origin + path, { waitUntil: 'load' });
    if (path.includes('metr-doubling')) {
      await page.waitForFunction(() => !!document.querySelector('#metr-chart svg.main-svg'));
    }
    return { state: await randomSeedState(page), draws: await randomDraws(page) };
  };
  const metr = await visit('/blog/metr-doubling/');
  expect(metr.state).toMatchObject({ location: '/blog/metr-doubling/', baseSeed: 1, removedLibraryDraws: 1 });
  expect(metr.draws).toBe(60);

  for (const path of ['/', '/blog/', '/blog/toolbelt/', '/definitely-unknown']) {
    const actual = await visit(path);
    expect(actual.state.location).toBe(path);
    expect(actual.state.removedLibraryDraws).toBe(0);
    expect(actual.state.effectiveSeed).toBe(actual.state.baseSeed);
  }

  const embedded = await visit('/blog/embedded-swift-agent/');
  expect(embedded.state).toMatchObject({ location: '/blog/embedded-swift-agent/', baseSeed: 1, removedLibraryDraws: 1 });
  expect(embedded.draws).toBe(0);
  await page.reload({ waitUntil: 'load' });
  expect(await randomSeedState(page)).toEqual(embedded.state);
  expect(await randomDraws(page)).toBe(0);
});
