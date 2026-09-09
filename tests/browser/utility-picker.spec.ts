// S1-21: functional mouse/touch smoke for the privacy and 404 FABs.

import { expect, test } from '@playwright/test';
import type { Locator, Page } from '@playwright/test';
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { createServer, type Server } from 'node:http';
import { isAbsolute, join, relative, resolve, sep } from 'node:path';

import { firstPaint, recordFirstPaint } from '../../harness/palette.ts';
import { buildSite, cleanup } from '../fixtures/composition/build.ts';

const ROLE_VARS = ['--text', '--bg', '--primary', '--secondary', '--accent'] as const;

let server: Server | undefined;
let origin = '';
let buildDir: string | undefined;
let dist = '';
let ownedPort = 0;

const scratch = (name: 'PARITY_OUT_DIR' | 'TEST_BUILD_OUT_DIR') => {
  const value = process.env[name];
  if (!value || !isAbsolute(value)) throw new Error(`${name} must be an absolute scratch path`);
  return value;
};

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
  const parityDir = scratch('PARITY_OUT_DIR');
  scratch('TEST_BUILD_OUT_DIR');
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
    ownedPort = address.port;
    origin = `http://127.0.0.1:${ownedPort}`;
    const proofDir = join(parityDir, 'cleanup');
    mkdirSync(proofDir, { recursive: true });
    writeFileSync(join(proofDir, `owned-${process.pid}-${ownedPort}.json`), JSON.stringify({
      pid: process.pid,
      host: '127.0.0.1',
      port: ownedPort,
    }));
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
    const proofDir = join(process.env.PARITY_OUT_DIR!, 'cleanup');
    mkdirSync(proofDir, { recursive: true });
    writeFileSync(join(proofDir, `closed-${process.pid}-${ownedPort}.json`), JSON.stringify({
      pid: process.pid,
      host: '127.0.0.1',
      port: ownedPort,
      closed: server === undefined,
    }));
  }
});

const activate = (target: Locator) =>
  test.info().project.use.hasTouch ? target.tap() : target.click();

const roles = (page: Page) => page.evaluate(
  (names) => {
    const computed = getComputedStyle(document.documentElement);
    return Object.fromEntries(names.map((name) => [name, computed.getPropertyValue(name).trim()]));
  },
  [...ROLE_VARS],
);

const storageText = (page: Page) =>
  page.evaluate(() => sessionStorage.getItem('dawson-theme-cycler'));

test('one generated palette survives Privacy, ordinary href navigation, reload, and runtime 404', async ({ page }) => {
  await page.addInitScript(() => { Math.random = () => 0.5; });
  await recordFirstPaint(page, 'dawson-theme-cycler', ROLE_VARS);
  await page.goto(`${origin}/brutalist/privacy/`);
  await expect(page.getByRole('heading', { name: 'Privacy Policy', exact: true })).toBeVisible();
  const trigger = page.locator('.tc-fab .tc-nav-trigger');
  await expect(trigger).toBeVisible();
  await activate(trigger);
  await expect(page.locator('#tc-dock')).toHaveClass(/tc-mega-open/);
  await expect(trigger).toHaveAttribute('aria-expanded', 'true');
  await activate(page.locator('#tc-advanced-link'));
  await activate(page.locator('#tc-randomize'));

  const savedText = await storageText(page);
  expect(savedText).not.toBeNull();
  const saved = JSON.parse(savedText!);
  expect(Object.keys(saved).sort()).toEqual(['colors', 'locks', 'scheme', 'style', 'theme']);
  expect(saved.colors).toHaveLength(5);
  for (const color of saved.colors) expect(color).toMatch(/^#[0-9a-f]{6}$/);
  expect(saved).toEqual({
    style: 'brutalist',
    colors: saved.colors,
    locks: [false, false, false, false, false],
    scheme: 'random',
    theme: 'light',
  });
  const expectedRoles = Object.fromEntries(ROLE_VARS.map((role, index) => [role, saved.colors[index]]));
  expect(await roles(page)).toEqual(expectedRoles);
  await page.keyboard.press('Escape');

  const checkOrdinaryLanding = async () => {
    const shot = await firstPaint(page);
    expect(shot.roles).toEqual(expectedRoles);
    expect(shot.storage).toBe(savedText);
    expect(await roles(page)).toEqual(expectedRoles);
    expect(await storageText(page)).toBe(savedText);
    await expect(page.locator('#tc-presets li.tc-row-sel a[data-id="brutalist"]')).toHaveAttribute('aria-current', 'true');
    await expect(page.locator('#tc-preview-name')).toHaveText('Brutalist');
  };

  await page.locator('a.name-logo[href="/brutalist/"]').click();
  await page.waitForURL(`${origin}/brutalist/`);
  await checkOrdinaryLanding();

  await page.locator('.header-menu-container a[href="/brutalist/blog/"]:visible').click();
  await page.waitForURL(`${origin}/brutalist/blog/`);
  await checkOrdinaryLanding();

  await page.locator('a.blog-card[href="/brutalist/blog/toolbelt/"]').click();
  await page.waitForURL(`${origin}/brutalist/blog/toolbelt/`);
  await checkOrdinaryLanding();

  await page.goto(`${origin}/brutalist/privacy/`);
  await checkOrdinaryLanding();
  await page.reload();
  await checkOrdinaryLanding();
  await activate(page.locator('.tc-fab .tc-nav-trigger'));
  await expect(page.locator('#tc-dock')).toHaveClass(/tc-mega-open/);
  await page.keyboard.press('Escape');

  const response = await page.goto(`${origin}/brutalist/nope/?style=doodle`);
  expect(response?.status()).toBe(404);
  expect(await page.locator('html').getAttribute('data-style')).toBe('brutalist');
  const runtime404 = await page.evaluate(() => window.__parityFirstPaint);
  expect(runtime404?.readyState).toBe('interactive');
  expect(runtime404?.roles).toEqual(expectedRoles);
  expect(runtime404?.storage).toBe(savedText);
  expect(await roles(page)).toEqual(expectedRoles);
  expect(await storageText(page)).toBe(savedText);
  await expect(page.locator('#tc-presets li.tc-row-sel a[data-id="brutalist"]')).toHaveAttribute('aria-current', 'true');
  await expect(page.locator('#tc-preview-name')).toHaveText('Brutalist');
  await activate(page.locator('.tc-fab .tc-nav-trigger'));
  await expect(page.locator('#tc-dock')).toHaveClass(/tc-mega-open/);
  await page.keyboard.press('Escape');
  await page.reload();
  const reloaded404 = await page.evaluate(() => window.__parityFirstPaint);
  expect(reloaded404?.readyState).toBe('interactive');
  expect(reloaded404?.roles).toEqual(expectedRoles);
  expect(reloaded404?.storage).toBe(savedText);
  expect(await page.locator('html').getAttribute('data-style')).toBe('brutalist');
  expect(await roles(page)).toEqual(expectedRoles);
  expect(await storageText(page)).toBe(savedText);
  const reloadedTrigger = page.locator('.tc-fab .tc-nav-trigger');
  await activate(reloadedTrigger);
  await expect(page.locator('#tc-dock')).toHaveClass(/tc-mega-open/);
});

test('404 query fallback applies doodle with its full skin', async ({ page }) => {
  await page.goto(`${origin}/nope/?style=doodle`);
  expect(await page.locator('html').getAttribute('data-style')).toBe('doodle');
  await expect(page.locator('head link[data-style-asset][href="/css/themes/doodle.css"]')).toHaveCount(1);
});
