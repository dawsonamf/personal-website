/**
 * S1-20 browser checks for the generated legacy query shim, external redirect stubs, and all
 * eight published bodies' same-origin resources. The worker owns one ephemeral loopback server.
 */
import { expect, test, type Request, type Response } from '@playwright/test';
import { cpSync, existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { createServer, type Server } from 'node:http';
import { tmpdir } from 'node:os';
import { extname, isAbsolute, join, relative, resolve, sep } from 'node:path';

import { publishedPostIds } from '../../src/build/posts.ts';
import { buildSite, cleanup } from '../fixtures/composition/build.ts';

const repoRoot = resolve(import.meta.dirname, '..', '..');
let server: Server | undefined;
let origin = '';
let buildDir: string | undefined;
let listener: { address: string; port: number } | undefined;

const MIME: Record<string, string> = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.ico': 'image/x-icon',
  '.jpeg': 'image/jpeg',
  '.jpg': 'image/jpeg',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.ttf': 'font/ttf',
  '.woff2': 'font/woff2',
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

test.beforeAll(async ({}, workerInfo) => {
  const built = buildSite(`legacy-post-${workerInfo.project.name}-w${workerInfo.workerIndex}-`, (root) => {
    mkdirSync(join(root, 'public', 'vendor'), { recursive: true });
    cpSync(join(repoRoot, 'public', 'resources'), join(root, 'public', 'resources'), { recursive: true });
    cpSync(
      join(repoRoot, 'public', 'vendor', 'vanilla-tilt'),
      join(root, 'public', 'vendor', 'vanilla-tilt'),
      { recursive: true },
    );
  });
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
    if (!address || typeof address === 'string') throw new Error('legacy-post fixture did not bind TCP');
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
  writeFileSync(join(proofRoot, `legacy-post-${workerInfo.project.name}-w${workerInfo.workerIndex}.json`), JSON.stringify({
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

test.beforeEach(async ({ page }) => {
  await page.context().route('**/*', (route) => {
    const hostname = new URL(route.request().url()).hostname;
    if (hostname === '127.0.0.1') return route.continue();
    if (hostname === 'www.aboutobjects.com') {
      return route.fulfill({ status: 200, contentType: 'text/html', body: '<!doctype html><title>approved external</title>' });
    }
    return route.abort();
  });
});

test('legacy ids resolve locally by validated style and reject redirect injection', async ({ page }) => {
  await page.goto(`${origin}/blog/post.html?id=helm`);
  await expect(page).toHaveURL(`${origin}/blog/helm/`);

  await page.goto(`${origin}/blog/post.html?id=helm&style=doodle#architecture`);
  await expect(page).toHaveURL(`${origin}/doodle/blog/helm/#architecture`);

  for (const query of [
    'id=helm&style=space',
    'id=helm&style=%2F%2Fevil.example',
    'id=helm&destination=https%3A%2F%2Fevil.example',
  ]) {
    await page.goto(`${origin}/blog/post.html?${query}`);
    await expect(page).toHaveURL(`${origin}/blog/helm/`);
  }

  for (const query of [
    '',
    'id=',
    'id=gemma4-heretic-ara',
    'id=unknown',
    'id=constructor',
    'id=__proto__',
    'destination=https%3A%2F%2Fevil.example',
  ]) {
    await page.goto(`${origin}/blog/post.html${query ? `?${query}` : ''}`);
    await expect(page).toHaveURL(`${origin}/404.html`);
  }
});

test('external query ids and canonical stubs use the exact approved URL', async ({ page }) => {
  const destinations = [
    ['autoencoders-1', 'https://www.aboutobjects.com/2024/01/05/autoencoders-part-1/'],
    ['autoencoders-2', 'https://www.aboutobjects.com/2024/04/01/autoencoders-part-2/'],
  ] as const;
  for (const [id, destination] of destinations) {
    await page.goto(`${origin}/blog/post.html?id=${id}&style=doodle&destination=https%3A%2F%2Fevil.example#ignored`);
    await expect(page).toHaveURL(destination);
    await page.goto(`${origin}/blog/${id}/`);
    await expect(page).toHaveURL(destination);
  }
});

test('the legacy shim reaches its fixed blog fallback with JavaScript disabled', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  try {
    await context.route('**/*', (route) =>
      new URL(route.request().url()).hostname === '127.0.0.1' ? route.continue() : route.abort());
    const page = await context.newPage();
    await page.goto(`${origin}/blog/post.html?id=helm`);
    await expect(page).toHaveURL(`${origin}/blog/`);
  } finally {
    await context.close();
  }
});

test('all eight published post bodies and their same-origin resources return below 400', async ({ page, request }) => {
  const checked = new Set<string>();
  for (const id of publishedPostIds()) {
    const badResponses: Array<{ url: string; status: number }> = [];
    const failedRequests: Array<{ url: string; error: string }> = [];
    const pending = new Set<Request>();
    const local = (url: string) => new URL(url).origin === origin;
    const onRequest = (entry: Request) => { if (local(entry.url())) pending.add(entry); };
    const onResponse = (entry: Response) => {
      if (local(entry.url()) && entry.status() >= 400) {
        badResponses.push({ url: entry.url(), status: entry.status() });
      }
    };
    const onFinished = (entry: Request) => { pending.delete(entry); };
    const onFailed = (entry: Request) => {
      pending.delete(entry);
      if (local(entry.url())) {
        failedRequests.push({ url: entry.url(), error: entry.failure()?.errorText ?? 'unknown' });
      }
    };
    page.on('request', onRequest);
    page.on('response', onResponse);
    page.on('requestfinished', onFinished);
    page.on('requestfailed', onFailed);

    try {
      const response = await page.goto(`${origin}/blog/${id}/`, { waitUntil: 'load', timeout: 15_000 });
      expect(response?.status(), id).toBe(200);
      await page.waitForLoadState('networkidle', { timeout: 5_000 });
      await expect.poll(() => pending.size, { timeout: 2_000 }).toBe(0);

      const references = await page.locator('#post-content [href], #post-content [src], link[href], script[src]')
        .evaluateAll((nodes) => nodes.flatMap((node) => {
          const value = node.getAttribute('href') ?? node.getAttribute('src');
          if (!value) return [];
          try {
            const url = new URL(value, document.baseURI);
            return url.origin === location.origin ? [url.href] : [];
          } catch {
            return [];
          }
        }));
      for (const url of references) {
        if (checked.has(url)) continue;
        checked.add(url);
        const asset = await request.get(url, { maxRedirects: 0 });
        expect(asset.status(), `${id}: ${new URL(url).pathname}`).toBeLessThan(400);
      }

      expect(badResponses, `${id}: same-origin responses >= 400`).toEqual([]);
      expect(failedRequests, `${id}: failed same-origin requests`).toEqual([]);
    } finally {
      page.off('request', onRequest);
      page.off('response', onResponse);
      page.off('requestfinished', onFinished);
      page.off('requestfailed', onFailed);
    }
  }
  expect(checked.size).toBeGreaterThan(20);
});
