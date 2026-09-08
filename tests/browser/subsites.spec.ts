/**
 * S1-22 browser checks for static meta-refresh redirects and the two verbatim subsites.
 * The worker owns one ephemeral 127.0.0.1 server; third-party URLs are observed then blocked.
 */
import { expect, test, type Request, type Response } from '@playwright/test';
import { createHash } from 'node:crypto';
import { createServer, type Server } from 'node:http';
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { extname, isAbsolute, join, relative, resolve, sep } from 'node:path';

import { buildSite, cleanup } from '../fixtures/composition/build.ts';

let server: Server | undefined;
let origin = '';
let buildDir: string | undefined;
let listener: { address: string; port: number } | undefined;

const MIME: Record<string, string> = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.jpeg': 'image/jpeg',
  '.js': 'text/javascript; charset=utf-8',
  '.md': 'text/markdown; charset=utf-8',
  '.wasm': 'application/wasm',
  '.xml': 'application/xml; charset=utf-8',
};
const HASHES: Record<string, string> = {
  '/subsites/elise/12years/then.jpeg': '54483102680a63580ce70fe04b457953f25d2236ee30041b930738354d1f18ce',
  '/subsites/elise/12years/now.jpeg': 'dcef48640ef4b3b6708450e7b05ae2d38564965ab060c6acf6bca8cb054a047e',
  '/subsites/dawson/embedded-swift-agent/agent.js': '574f2076991df09a88e42cf3af87b8db7b7a66b27c2692949039de09959d9a73',
  '/subsites/dawson/embedded-swift-agent/EmbeddedSwiftAgent.wasm': '987f593b23664dae7a8b42181ceae4365fff4ff6a4456c9889c638458f56e9a1',
  '/subsites/dawson/embedded-swift-agent/embedded-swift-agent-context.md': '8bf0980b3df7a68015a83d03cfb90a58b17e1f0fae1b1966286bc9bf2f2319b5',
};

function contained(root: string, candidate: string): boolean {
  const rel = relative(root, candidate);
  return rel === '' || (!rel.startsWith('..' + sep) && rel !== '..' && !isAbsolute(rel));
}

function requestFile(root: string, url: string): string | undefined {
  let pathname: string;
  try {
    pathname = decodeURIComponent(new URL(url, 'http://fixture.invalid').pathname.slice(1));
  } catch {
    return undefined;
  }
  if (pathname.includes('\0')) return undefined;
  let file = resolve(root, pathname);
  if (!contained(root, file)) return undefined;
  try {
    if (statSync(file).isDirectory()) file = join(file, 'index.html');
  } catch {
    return undefined;
  }
  return contained(root, file) && existsSync(file) ? file : undefined;
}

async function closeServer(): Promise<void> {
  if (!server?.listening) return;
  server.closeIdleConnections?.();
  server.closeAllConnections?.();
  await new Promise<void>((done, reject) => server!.close((error) => error ? reject(error) : done()));
}

test.describe('S1-22 subsites @only:desktop-1440', () => {
  test.describe.configure({ mode: 'serial' });

  test.beforeAll(async ({}, workerInfo) => {
    const built = buildSite(`subsites-${workerInfo.project.name}-w${workerInfo.workerIndex}-`);
    buildDir = built.dir;
    try {
      server = createServer((request, response) => {
        const file = requestFile(built.dist, request.url ?? '/');
        if (!file) {
          response.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
          response.end('missing');
          return;
        }
        response.writeHead(200, { 'content-type': MIME[extname(file)] ?? 'application/octet-stream' });
        response.end(readFileSync(file));
      });
      await new Promise<void>((done, reject) => {
        server!.once('error', reject);
        server!.listen(0, '127.0.0.1', done);
      });
      const address = server.address();
      if (!address || typeof address === 'string') throw new Error('subsite fixture did not bind TCP');
      listener = { address: address.address, port: address.port };
      expect(listener.address).toBe('127.0.0.1');
      origin = `http://127.0.0.1:${address.port}`;
    } catch (error) {
      await closeServer().catch(() => {});
      cleanup(buildDir);
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
    cleanup(buildDir);
    const rootRemoved = !buildDir || !existsSync(buildDir);
    const proofRoot = resolve(process.env.PARITY_OUT_DIR ?? tmpdir(), 'cleanup');
    mkdirSync(proofRoot, { recursive: true });
    writeFileSync(join(proofRoot, `subsites-${workerInfo.project.name}-w${workerInfo.workerIndex}.json`), JSON.stringify({
      workerPid: process.pid,
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

  test('old entry documents use meta refresh and land on the final subsite URLs', async ({ browser }) => {
    const context = await browser.newContext({ javaScriptEnabled: false });
    try {
      await context.route('**/*', (route) =>
        route.request().url().startsWith(origin) ? route.continue() : route.abort('blockedbyclient'));
      const page = await context.newPage();
      for (const [oldPath, finalPath] of [
        ['/12years/', '/subsites/elise/12years/'],
        ['/embedded-swift-agent/', '/subsites/dawson/embedded-swift-agent/'],
      ] as const) {
        const response = await page.goto(`${origin}${oldPath}`, { waitUntil: 'domcontentloaded' });
        expect(response?.status(), oldPath).toBe(200);
        await expect(page).toHaveURL(`${origin}${finalPath}`);
      }
    } finally {
      await context.close();
    }
  });

  test('the anniversary page resolves both local images while third-party scripts stay isolated', async ({ page, request }) => {
    const external = new Set<string>();
    const badLocal: Array<{ url: string; status: number }> = [];
    page.on('response', (response: Response) => {
      if (response.url().startsWith(origin) && response.status() >= 400) {
        badLocal.push({ url: response.url(), status: response.status() });
      }
    });
    await page.route('**/*', (route) => {
      const url = route.request().url();
      if (url.startsWith(origin)) return route.continue();
      external.add(url);
      return route.abort('blockedbyclient');
    });

    const response = await page.goto(`${origin}/subsites/elise/12years/`, { waitUntil: 'load' });
    expect(response?.status()).toBe(200);
    await expect(page.locator('img[src="then.jpeg"]')).toHaveJSProperty('complete', true);
    await expect(page.locator('img[src="now.jpeg"]')).toHaveJSProperty('complete', true);
    for (const path of ['/subsites/elise/12years/then.jpeg', '/subsites/elise/12years/now.jpeg']) {
      const asset = await request.get(`${origin}${path}`);
      expect(asset.status(), path).toBe(200);
      expect(createHash('sha256').update(await asset.body()).digest('hex'), path).toBe(HASHES[path]);
    }
    expect(badLocal).toEqual([]);
    expect([...external]).toEqual(expect.arrayContaining([
      'https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js',
      'https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/ScrollTrigger.min.js',
    ]));
  });

  test('the embedded page serves the untouched module, context, and compilable WASM locally', async ({ page, request }) => {
    const external = new Set<string>();
    const badLocal: Array<{ url: string; status: number }> = [];
    const failedLocal: Array<{ url: string; error: string }> = [];
    page.on('response', (response: Response) => {
      if (response.url().startsWith(origin) && response.status() >= 400) {
        badLocal.push({ url: response.url(), status: response.status() });
      }
    });
    page.on('requestfailed', (request: Request) => {
      if (request.url().startsWith(origin)) {
        failedLocal.push({ url: request.url(), error: request.failure()?.errorText ?? 'unknown' });
      }
    });
    await page.route('**/*', (route) => {
      const url = route.request().url();
      if (url.startsWith(origin)) return route.continue();
      external.add(url);
      return route.abort('blockedbyclient');
    });

    const response = await page.goto(`${origin}/subsites/dawson/embedded-swift-agent/`, { waitUntil: 'load' });
    expect(response?.status()).toBe(200);
    const results = await page.evaluate(async () => {
      const paths = ['./agent.js', './embedded-swift-agent-context.md', './EmbeddedSwiftAgent.wasm'];
      const responses = await Promise.all(paths.map((path) => fetch(path)));
      const bytes = await Promise.all(responses.map((entry) => entry.arrayBuffer()));
      await WebAssembly.compile(bytes[2]);
      return responses.map((entry, index) => ({
        url: new URL(paths[index], document.baseURI).pathname,
        status: entry.status,
        contentType: entry.headers.get('content-type'),
        length: bytes[index].byteLength,
      }));
    });
    expect(results).toEqual([
      { url: '/subsites/dawson/embedded-swift-agent/agent.js', status: 200, contentType: 'text/javascript; charset=utf-8', length: 9337 },
      { url: '/subsites/dawson/embedded-swift-agent/embedded-swift-agent-context.md', status: 200, contentType: 'text/markdown; charset=utf-8', length: 10229 },
      { url: '/subsites/dawson/embedded-swift-agent/EmbeddedSwiftAgent.wasm', status: 200, contentType: 'application/wasm', length: 212826 },
    ]);
    for (const path of Object.keys(HASHES).filter((path) => path.includes('/embedded-swift-agent/'))) {
      const asset = await request.get(`${origin}${path}`);
      expect(asset.status(), path).toBe(200);
      expect(createHash('sha256').update(await asset.body()).digest('hex'), path).toBe(HASHES[path]);
    }
    const agent = await (await request.get(`${origin}/subsites/dawson/embedded-swift-agent/agent.js`)).text();
    expect(agent).toContain('from "https://cdn.jsdelivr.net/npm/@bjorn3/browser_wasi_shim@0.4.2/+esm";');
    await expect.poll(() => external.has('https://cdn.jsdelivr.net/npm/@bjorn3/browser_wasi_shim@0.4.2/+esm')).toBe(true);
    expect(badLocal).toEqual([]);
    expect(failedLocal).toEqual([]);
  });
});
