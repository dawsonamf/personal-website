// S1-21: functional mouse/touch smoke for the privacy and 404 FABs.

import { expect, test } from '@playwright/test';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { createServer, type Server } from 'node:http';
import { isAbsolute, join, relative, resolve, sep } from 'node:path';

import { buildSite, cleanup } from '../fixtures/composition/build.ts';

let server: Server | undefined;
let origin = '';
let buildDir: string | undefined;
let dist = '';

const contained = (root: string, candidate: string) => {
  const rel = relative(root, candidate);
  return rel === '' || (!rel.startsWith(`..${sep}`) && rel !== '..' && !isAbsolute(rel));
};

async function closeServer() {
  if (!server) return;
  server.closeIdleConnections?.();
  server.closeAllConnections?.();
  await new Promise<void>((done, reject) => server!.close((error) => error ? reject(error) : done()));
  server = undefined;
}

test.beforeAll(async () => {
  const built = buildSite('s1-21-browser-');
  buildDir = built.dir;
  dist = built.dist;

  try {
    server = createServer((request, response) => {
      const pathname = new URL(request.url ?? '/', 'http://fixture.invalid').pathname;
      let file = resolve(dist, `.${decodeURIComponent(pathname)}`);
      if (!contained(dist, file)) file = '';
      try {
        if (file && statSync(file).isDirectory()) file = join(file, 'index.html');
      } catch {
        file = '';
      }
      const fallback = !file || !existsSync(file);
      if (fallback) file = join(dist, '404.html');
      response.statusCode = fallback ? 404 : 200;
      response.setHeader('content-type', file.endsWith('.css') ? 'text/css' : file.endsWith('.js') ? 'text/javascript' : 'text/html');
      response.end(readFileSync(file));
    });
    await new Promise<void>((done, reject) => {
      server!.once('error', reject);
      server!.listen(0, '127.0.0.1', done);
    });
    const address = server.address();
    if (!address || typeof address === 'string') throw new Error('utility server did not bind TCP');
    origin = `http://127.0.0.1:${address.port}`;
  } catch (error) {
    await closeServer().catch(() => {});
    cleanup(buildDir);
    throw error;
  }
});

test.afterAll(async () => {
  try {
    await closeServer();
  } finally {
    cleanup(buildDir);
  }
});

test('privacy FAB is reachable and opens the picker', async ({ page }) => {
  await page.goto(`${origin}/privacy/`);
  await page.evaluate(() => sessionStorage.setItem('dawson-theme-cycler', JSON.stringify({
    style: 'brutalist',
    colors: ['#112233', '#ddeeff', '#334455', '#ccddee', '#556677'],
    locks: [false, false, false, false, false],
    scheme: 'random',
  })));
  await page.goto(`${origin}/brutalist/privacy/`);
  await expect(page.getByRole('heading', { name: 'Privacy Policy', exact: true })).toBeVisible();
  expect(await page.locator('html').evaluate((root) => getComputedStyle(root).getPropertyValue('--text').trim())).toBe('#112233');
  await page.reload();
  expect(await page.locator('html').evaluate((root) => getComputedStyle(root).getPropertyValue('--text').trim())).toBe('#112233');
  const trigger = page.locator('.tc-fab .tc-nav-trigger');
  await expect(trigger).toBeVisible();
  test.info().project.use.hasTouch ? await trigger.tap() : await trigger.click();
  await expect(page.locator('#tc-dock')).toHaveClass(/tc-mega-open/);
  await expect(trigger).toHaveAttribute('aria-expanded', 'true');
});

test('404 applies path precedence before picker boot and restores its matching palette', async ({ page }) => {
  await page.goto(`${origin}/privacy/`);
  await page.evaluate(() => sessionStorage.setItem('dawson-theme-cycler', JSON.stringify({
    style: 'brutalist',
    colors: ['#112233', '#ddeeff', '#334455', '#ccddee', '#556677'],
    locks: [false, false, false, false, false],
    scheme: 'random',
  })));
  const response = await page.goto(`${origin}/brutalist/nope/?style=doodle`);
  expect(response?.status()).toBe(404);
  expect(await page.locator('html').getAttribute('data-style')).toBe('brutalist');
  expect(await page.locator('html').evaluate((root) => getComputedStyle(root).getPropertyValue('--text').trim())).toBe('#112233');
  await expect(page.locator('#tc-presets li.tc-row-sel a[data-id="brutalist"]')).toHaveAttribute('aria-current', 'true');
  await expect(page.locator('#tc-preview-name')).toHaveText('Brutalist');
  await page.reload();
  expect(await page.locator('html').getAttribute('data-style')).toBe('brutalist');
  expect(await page.locator('html').evaluate((root) => getComputedStyle(root).getPropertyValue('--text').trim())).toBe('#112233');
  const trigger = page.locator('.tc-fab .tc-nav-trigger');
  test.info().project.use.hasTouch ? await trigger.tap() : await trigger.click();
  await expect(page.locator('#tc-dock')).toHaveClass(/tc-mega-open/);
});

test('404 query fallback applies doodle with its full skin', async ({ page }) => {
  await page.goto(`${origin}/nope/?style=doodle`);
  expect(await page.locator('html').getAttribute('data-style')).toBe('doodle');
  await expect(page.locator('head link[data-style-asset][href="/css/themes/doodle.css"]')).toHaveCount(1);
});
