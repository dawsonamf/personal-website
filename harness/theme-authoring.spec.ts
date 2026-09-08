import { expect, test } from '@playwright/test';
import type { Locator, Page } from '@playwright/test';
import { existsSync, readFileSync, statSync, writeFileSync, mkdirSync } from 'node:fs';
import { createServer, type Server } from 'node:http';
import { extname, isAbsolute, join, relative, resolve, sep } from 'node:path';

import { firstPaint, recordFirstPaint } from './palette.ts';
import { buildSite, cleanup } from '../tests/fixtures/composition/build.ts';
import { AUTHOR_THEME_ID, authoringOverlay } from './fixtures/theme-authoring/fixture.ts';

const ROLE_VARS = ['--text', '--bg', '--primary', '--secondary', '--accent'] as const;
const BANNED = ['script.js', 'featured-carousel', 'typing-engine', 'nav-behavior', 'cursor-follow', 'jquery', 'aos', 'vanilla-tilt', 'gsap'];
const FONT = 'https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@500&display=swap';
const PROFILE = {
  polarity: 'light',
  random: {
    light: { sat: [0.55, 0.65], roles: [{ l: [0.12, 0.18], hueT: 0 }, { l: [0.91, 0.95], hueT: 0 }, { l: [0.34, 0.42], hueT: 1, sat: [0.62, 0.72] }, { l: [0.78, 0.84], hueT: 0.2, sat: [0.2, 0.3] }, { l: [0.3, 0.38], hueT: 0.65, sat: [0.58, 0.68] }] },
    dark: { sat: [0.48, 0.58], roles: [{ l: [0.88, 0.94], hueT: 0 }, { l: [0.08, 0.13], hueT: 0 }, { l: [0.6, 0.68], hueT: 1, sat: [0.6, 0.72] }, { l: [0.18, 0.24], hueT: 0.2, sat: [0.24, 0.34] }, { l: [0.62, 0.7], hueT: 0.65, sat: [0.58, 0.7] }] },
  },
};

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
  const built = buildSite('s1-24-browser-', authoringOverlay);
  buildDir = built.dir;
  dist = built.dist;
  try {
    server = createServer((request, response) => {
      const pathname = new URL(request.url ?? '/', 'http://fixture.invalid').pathname;
      let file = resolve(dist, `.${decodeURIComponent(pathname)}`);
      if (!contained(dist, file)) file = '';
      try { if (file && statSync(file).isDirectory()) file = join(file, 'index.html'); } catch { file = ''; }
      const fallback = !file || !existsSync(file);
      if (fallback) file = join(dist, '404.html');
      const types: Record<string, string> = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.woff2': 'font/woff2', '.png': 'image/png' };
      response.statusCode = fallback ? 404 : 200;
      response.setHeader('content-type', types[extname(file)] ?? 'application/octet-stream');
      response.end(readFileSync(file));
    });
    await new Promise<void>((done, reject) => { server!.once('error', reject); server!.listen(0, '127.0.0.1', done); });
    const address = server.address();
    if (!address || typeof address === 'string') throw new Error('authoring server did not bind TCP');
    ownedPort = address.port;
    origin = `http://127.0.0.1:${ownedPort}`;
    const proofDir = join(parityDir, 'cleanup');
    mkdirSync(proofDir, { recursive: true });
    writeFileSync(join(proofDir, `owned-${process.pid}-${ownedPort}.json`), JSON.stringify({ pid: process.pid, host: '127.0.0.1', port: ownedPort }));
  } catch (error) {
    await closeServer().catch(() => {});
    cleanup(buildDir);
    throw error;
  }
});

test.afterAll(async () => {
  try { await closeServer(); }
  finally {
    cleanup(buildDir);
    const proofDir = join(process.env.PARITY_OUT_DIR!, 'cleanup');
    mkdirSync(proofDir, { recursive: true });
    writeFileSync(join(proofDir, `closed-${process.pid}-${ownedPort}.json`), JSON.stringify({ pid: process.pid, host: '127.0.0.1', port: ownedPort, closed: server === undefined }));
  }
});

test.beforeEach(async ({ context }) => {
  await context.route('**/*', (route) => new URL(route.request().url()).hostname === '127.0.0.1' ? route.continue() : route.abort());
});

const isTouch = () => test.info().project.use.hasTouch === true;
const activate = (target: Locator) => isTouch() ? target.tap() : target.click();
const booted = (page: Page) => expect(page.locator('#tc-preview-name')).toHaveText(/\S/);
const roles = (page: Page) => page.evaluate((vars) => vars.map((name) => document.documentElement.style.getPropertyValue(name).trim()), ROLE_VARS);
const storage = (page: Page) => page.evaluate(() => JSON.parse(sessionStorage.getItem('dawson-theme-cycler')!));
const cssRgb = (hex: string) => `rgb(${Number.parseInt(hex.slice(1, 3), 16)}, ${Number.parseInt(hex.slice(3, 5), 16)}, ${Number.parseInt(hex.slice(5, 7), 16)})`;
const hsl = (hex: string) => {
  const values = [1, 3, 5].map((start) => Number.parseInt(hex.slice(start, start + 2), 16) / 255);
  const max = Math.max(...values), min = Math.min(...values), l = (max + min) / 2;
  const d = max - min;
  const s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1));
  return { s, l };
};
const visibleRoleColors = (page: Page) => page.evaluate(() => {
  const narrow = innerWidth <= 720;
  const probes: Array<[string, string]> = narrow
    ? [['.proof-mobile h1', 'color'], ['.proof-mobile p', 'backgroundColor'], ['.proof-mobile-stripe i:first-child', 'backgroundColor'], ['.proof-mobile-stripe', 'backgroundColor'], ['.proof-mobile-stripe i:last-child', 'backgroundColor']]
    : [['.proof-mast h1', 'color'], ['.proof-grid article', 'backgroundColor'], ['.proof-grid nav', 'backgroundColor'], ['.proof-grid aside', 'backgroundColor'], ['.proof-grid aside span', 'backgroundColor']];
  return probes.map(([selector, property]) => getComputedStyle(document.querySelector(selector)!)[property as keyof CSSStyleDeclaration]);
});
const headAssets = (page: Page) => page.evaluate(() => ({
  styles: [...document.querySelectorAll<HTMLLinkElement>('link[rel="stylesheet"]')].map((el) => el.href),
  scripts: [...document.querySelectorAll<HTMLScriptElement>('script[src]')].map((el) => el.src),
  projected: [...document.querySelectorAll<HTMLLinkElement>('link[data-style-asset]')].map((el) => el.href),
}));
const normalize = (urls: string[]) => urls.map((url) => url.startsWith(origin) ? new URL(url).pathname : url);
const assertPageResources = async (page: Page, path: string, expected: { styles: string[]; scripts: string[]; projected: string[]; status?: number; owned?: boolean }) => {
  const bad: string[] = [];
  const failed: string[] = [];
  const requested: string[] = [];
  const onRequest = (request: { url(): string }) => {
    const url = new URL(request.url());
    if (url.origin === origin) requested.push(url.pathname);
  };
  const onResponse = (response: { url(): string; status(): number }) => {
    const url = new URL(response.url());
    if (url.origin === origin && response.status() >= 400 && !(expected.status === 404 && url.pathname === path)) bad.push(`${url.pathname}:${response.status()}`);
  };
  const onFailed = (request: { url(): string; failure(): { errorText: string } | null }) => {
    const url = new URL(request.url());
    if (url.origin === origin) failed.push(`${url.pathname}:${request.failure()?.errorText}`);
  };
  page.on('request', onRequest); page.on('response', onResponse); page.on('requestfailed', onFailed);
  const response = await page.goto(origin + path);
  await page.waitForLoadState('load');
  await page.waitForTimeout(900);
  page.removeListener('request', onRequest); page.removeListener('response', onResponse); page.removeListener('requestfailed', onFailed);
  expect(response?.status()).toBe(expected.status ?? 200);
  expect(bad).toEqual([]); expect(failed).toEqual([]);
  const assets = await headAssets(page);
  const pickerFonts = await page.evaluate(() => [...new Set([...document.querySelectorAll<HTMLElement>('#tc-presets a[data-fonts]')]
    .flatMap((el) => JSON.parse(el.dataset.fonts ?? '[]') as string[]))]);
  expect(normalize(assets.styles)).toEqual([...expected.styles, ...pickerFonts.filter((url) => !expected.styles.includes(url))]);
  const scripts = normalize(assets.scripts);
  expect(scripts).toEqual(expected.scripts);
  expect(normalize(assets.projected)).toEqual(expected.projected);
  const declaredCode = normalize([...assets.styles, ...assets.scripts]).filter((url) => url.startsWith('/')).sort();
  const requestedCode = [...new Set(requested.filter((url) => /\.(?:css|js)$/.test(url)))].sort();
  expect(requestedCode).toEqual(declaredCode);
  if (expected.owned) for (const banned of BANNED) expect(requested.some((url) => url.toLowerCase().includes(banned)), banned).toBe(false);
};
const openPicker = async (page: Page, selector: string) => {
  await activate(page.locator(selector));
  await expect(page.locator('#tc-dock')).toHaveClass(/tc-mega-open/);
};
const row = (page: Page, id: string) => page.viewportSize()!.width <= 1100
  ? page.locator(`#tc-presets .tc-row-card[data-id="${id}"]`)
  : page.locator(`#tc-presets a[data-id="${id}"]`);
const navTrigger = (page: Page) => page.viewportSize()!.width <= 1100
  ? '.static-menu-mobile .tc-nav-trigger'
  : '.static-menu .tc-nav-trigger';

test('owned, fallback, utility, and default pages have exact isolated assets at both sizes', async ({ page }) => {
  const canonicalHomeStyles = ['/vendor/fontawesome-free/css/all.min.css', '/vendor/boxicons/css/boxicons.min.css', '/vendor/aos/aos.css', 'https://assets.calendly.com/assets/external/widget.css', '/css/styles.css', '/css/mobile-styles.css', '/css/featured-carousel.css', '/css/theme-cycler.css'];
  const homeScripts = ['/vendor/gsap/gsap.min.js', '/vendor/jquery/jquery.min.js', '/vendor/jquery-ui/jquery-ui.min.js', '/vendor/aos/aos.js', '/vendor/vanilla-tilt/vanilla-tilt.min.js', 'https://assets.calendly.com/assets/external/widget.js', '/js/featured-carousel.js', '/js/typing-engine.js', '/js/anim-utils.js', '/js/nav-behavior.js', '/js/script.js', '/js/cursor-follow.js', '/js/theme-cycler.js'];
  const listingStyles = ['/vendor/fontawesome-free/css/all.min.css', '/vendor/boxicons/css/boxicons.min.css', '/vendor/aos/aos.css', 'https://assets.calendly.com/assets/external/widget.css', '/css/styles.css', '/css/mobile-styles.css', '/css/featured-carousel.css', '/blog/blog-listing-styles.css', '/css/theme-cycler.css'];
  const listingScripts = ['/vendor/aos/aos.js', '/vendor/vanilla-tilt/vanilla-tilt.min.js', 'https://assets.calendly.com/assets/external/widget.js', '/js/featured-carousel.js', '/js/typing-engine.js', '/js/anim-utils.js', '/js/nav-behavior.js', '/js/cursor-follow.js', '/js/blog-listing-client.js', '/js/theme-cycler.js'];
  const cases = [
    { path: `/${AUTHOR_THEME_ID}/`, selector: '[data-author-home="true"]', owned: true, styles: ['/css/author-proof.css', '/css/theme-cycler.css', '/vendor/fontawesome-free/css/all.min.css', FONT], scripts: ['/js/author-proof.js', '/js/theme-cycler.js'], projected: [FONT] },
    { path: `/${AUTHOR_THEME_ID}/blog/`, selector: '#main-body', styles: [...listingStyles, FONT, '/css/themes/theme-base.css'], scripts: listingScripts, projected: [FONT, '/css/themes/theme-base.css'] },
    { path: `/${AUTHOR_THEME_ID}/blog/toolbelt/`, selector: '#main-body', styles: ['/vendor/fontawesome-free/css/all.min.css', '/vendor/boxicons/css/boxicons.min.css', '/css/styles.css', '/css/mobile-styles.css', '/blog/blog-styles.css', '/css/theme-cycler.css', FONT, '/css/themes/theme-base.css', '/vendor/highlight.js/github-dark.min.css'], scripts: ['https://cdn.jsdelivr.net/npm/mermaid@11.15.0/dist/mermaid.min.js', '/vendor/vanilla-tilt/vanilla-tilt.min.js', '/js/nav-behavior.js', '/js/cursor-follow.js', '/js/blog-post-client.js', '/js/theme-cycler.js'], projected: [FONT, '/css/themes/theme-base.css'] },
    { path: `/${AUTHOR_THEME_ID}/privacy/`, selector: '.privacy-header', styles: ['/vendor/fontawesome-free/css/all.min.css', '/vendor/boxicons/css/boxicons.min.css', '/css/styles.css', '/css/mobile-styles.css', '/privacy/privacy-styles.css', '/css/theme-cycler.css', FONT], scripts: ['/js/theme-cycler.js'], projected: [FONT] },
    { path: `/${AUTHOR_THEME_ID}/missing/`, selector: '.nf-container', styles: ['/css/styles.css', '/css/mobile-styles.css', '/css/theme-cycler.css', '/vendor/fontawesome-free/css/all.min.css', FONT], scripts: ['/js/theme-cycler.js'], projected: [FONT], status: 404 },
    { path: '/', selector: '#main-body', styles: canonicalHomeStyles, scripts: homeScripts, projected: [] },
    { path: '/blog/', selector: '#main-body', styles: listingStyles, scripts: listingScripts, projected: [] },
  ];
  const initial = page.viewportSize()!;
  const opposite = initial.width > 720 ? { width: 390, height: 844 } : { width: 1440, height: 900 };
  for (const item of cases) {
    await assertPageResources(page, item.path, item);
    await expect(page.locator(item.selector)).toBeVisible();
    const structural = item.path.startsWith(`/${AUTHOR_THEME_ID}/`);
    expect((await page.locator('html').evaluate((el) => getComputedStyle(el).getPropertyValue('--font-body').trim()))).toBe(structural ? 'Georgia, serif' : 'sans-serif');
    expect(await page.locator('html').evaluate((el) => getComputedStyle(el).fontSize)).toBe(item.owned ? (initial.width > 720 ? '18px' : '15px') : '16px');
    expect(await page.locator('html').getAttribute('data-author-proof-visits')).toBe(item.owned ? '1' : null);
    if (!item.owned) expect([...item.styles, ...item.scripts].some((url) => url.includes('author-proof'))).toBe(false);
    await page.setViewportSize(opposite);
    await expect(page.locator(item.selector)).toBeVisible();
    expect(await page.locator('html').evaluate((el) => getComputedStyle(el).fontSize)).toBe(item.owned ? (opposite.width > 720 ? '18px' : '15px') : '16px');
    if (item.owned) await expect(page.locator(opposite.width > 720 ? '.proof-desktop' : '.proof-mobile')).toBeVisible();
    await page.setViewportSize(initial);
  }
});

test('the shared randomizer obeys both declared profiles and visibly applies every role', async ({ page }) => {
  await page.addInitScript(() => { Math.random = () => 0.5; });
  await page.goto(`${origin}/${AUTHOR_THEME_ID}/`);
  await booted(page);
  const rowTag = page.locator(`#tc-presets a[data-id="${AUTHOR_THEME_ID}"]`).locator('..');
  expect(JSON.parse((await rowTag.getAttribute('data-profile'))!)).toEqual(PROFILE);
  for (const mode of ['light', 'dark'] as const) {
    if (mode === 'dark') {
      const saved = await storage(page);
      await page.evaluate((record) => sessionStorage.setItem('dawson-theme-cycler', JSON.stringify({ ...record, theme: 'dark' })), saved);
      await page.reload();
    }
    const before = await visibleRoleColors(page);
    await openPicker(page, '.tc-fab .tc-nav-trigger');
    await activate(page.locator('#tc-advanced-link'));
    await expect(page.locator('#tc-randomize')).toBeEnabled();
    await activate(page.locator('#tc-randomize'));
    const after = await roles(page);
    expect((await storage(page))).toEqual({ style: AUTHOR_THEME_ID, colors: after, locks: [false, false, false, false, false], scheme: 'random', theme: mode });
    after.forEach((color, index) => {
      const actual = hsl(color), role = PROFILE.random[mode].roles[index];
      const saturation = role.sat ?? PROFILE.random[mode].sat;
      expect(actual.s).toBeGreaterThanOrEqual(saturation[0] - 0.01);
      expect(actual.s).toBeLessThanOrEqual(saturation[1] + 0.01);
      expect(actual.l).toBeGreaterThanOrEqual(role.l[0] - 0.01);
      expect(actual.l).toBeLessThanOrEqual(role.l[1] + 0.01);
    });
    const visible = await visibleRoleColors(page);
    expect(visible).toEqual(after.map(cssRgb));
    visible.forEach((color, index) => expect(color).not.toBe(before[index]));
  }
});

test('the owned Home FAB switches themes and preserves the current page without canonical behavior', async ({ page }) => {
  await page.goto(`${origin}/${AUTHOR_THEME_ID}/`);
  await booted(page);
  const scripts = normalize((await headAssets(page)).scripts);
  for (const banned of BANNED) expect(scripts.some((url) => url.toLowerCase().includes(banned)), banned).toBe(false);
  await openPicker(page, '.tc-fab .tc-nav-trigger');
  await activate(row(page, 'default'));
  await page.waitForURL(`${origin}/`);
  await booted(page);
  await openPicker(page, navTrigger(page));
  await activate(row(page, AUTHOR_THEME_ID));
  await page.waitForURL(`${origin}/${AUTHOR_THEME_ID}/`);
  expect(await page.evaluate(() => sessionStorage.getItem('theme.author-proof.visits'))).toBe('2');
  expect(await page.evaluate(() => Object.keys(sessionStorage).filter((key) => key.startsWith('theme.author-proof.')))).toEqual(['theme.author-proof.visits']);
});

test('one generated palette survives real href navigation and reloads through the runtime 404', async ({ page }) => {
  await page.addInitScript(() => { Math.random = () => 0.5; });
  await recordFirstPaint(page, 'dawson-theme-cycler', ROLE_VARS);
  await page.goto(`${origin}/${AUTHOR_THEME_ID}/`);
  await booted(page);
  await openPicker(page, '.tc-fab .tc-nav-trigger');
  await activate(page.locator('#tc-advanced-link'));
  await activate(page.locator('#tc-randomize'));
  const saved = await storage(page);
  await page.keyboard.press('Escape');
  const expectedRoles = Object.fromEntries(ROLE_VARS.map((role, index) => [role, saved.colors[index]]));
  const checkLoading = async () => {
    const shot = await firstPaint(page);
    expect(shot.roles).toEqual(expectedRoles);
    expect(JSON.parse(shot.storage!)).toEqual(saved);
    expect(await roles(page)).toEqual(saved.colors);
    expect(await storage(page)).toEqual(saved);
  };
  await page.locator(`a[href="/${AUTHOR_THEME_ID}/blog/"]:visible`).first().click();
  await page.waitForURL(`${origin}/${AUTHOR_THEME_ID}/blog/`); await checkLoading();
  await page.reload(); await checkLoading();
  await page.locator(`a[href="/${AUTHOR_THEME_ID}/blog/toolbelt/"]:visible`).first().click();
  await page.waitForURL(`${origin}/${AUTHOR_THEME_ID}/blog/toolbelt/`); await checkLoading();
  await page.reload(); await checkLoading();
  await page.locator(`a[href="/${AUTHOR_THEME_ID}/"]:visible`).first().click();
  await page.waitForURL(`${origin}/${AUTHOR_THEME_ID}/`); await checkLoading();
  await page.locator(`a[href="/${AUTHOR_THEME_ID}/privacy/"]:visible`).first().click();
  await page.waitForURL(`${origin}/${AUTHOR_THEME_ID}/privacy/`); await checkLoading();
  await page.reload(); await checkLoading();
  await page.goto(`${origin}/${AUTHOR_THEME_ID}/missing/`);
  await expect(page.locator(`#tc-presets li.tc-row-sel a[data-id="${AUTHOR_THEME_ID}"]`)).toHaveAttribute('aria-current', 'true');
  const runtime404 = await page.evaluate(() => window.__parityFirstPaint);
  expect(runtime404?.readyState).toBe('interactive');
  expect(runtime404?.roles).toEqual(expectedRoles);
  expect(await roles(page)).toEqual(saved.colors); expect(await storage(page)).toEqual(saved);
  await page.reload();
  const reloaded404 = await page.evaluate(() => window.__parityFirstPaint);
  expect(reloaded404?.readyState).toBe('interactive');
  expect(reloaded404?.roles).toEqual(expectedRoles);
  expect(await roles(page)).toEqual(saved.colors); expect(await storage(page)).toEqual(saved);
});
