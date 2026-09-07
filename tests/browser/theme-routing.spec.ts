/**
 * S1-12: the four runtime halves of the routing/composition work, in a browser against a REAL
 * Astro build of the real src/ tree (pages included).
 *
 *   a. the saved palette is on the document before first paint and survives a reload
 *   b. `?style=` on a default route navigates to the themed same page, query and hash intact
 *   c. the 404 resolves its theme from the path, then the query, and keeps default-theme links
 *   d. LexChat stays picker-free
 *
 * Server: one in-process node:http static server bound to 127.0.0.1 on an ephemeral port and
 * closed in the worker teardown, never a persistent listener. It answers with GitHub Pages
 * semantics, which is what makes (c) reachable: a directory resolves to index.html, and every
 * missing path gets dist/404.html with a 404 status. Every page aborts requests to any host but
 * 127.0.0.1, so no font or CDN ever loads and the run is offline-deterministic.
 *
 * Run: ./node_modules/.bin/playwright test tests/browser/theme-routing.spec.ts   (no PARITY_MODE)
 */
import { test as base, expect } from '@playwright/test';
import type { Locator, Page } from '@playwright/test';
import { mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { createServer } from 'node:http';
import type { AddressInfo } from 'node:net';
import { dirname, extname, join, normalize } from 'node:path';

import { rampDeclarations } from '../../src/themes/ramp.ts';
import { THEMES } from '../../src/themes/registry.ts';
import type { SkinTheme } from '../../src/themes/types.ts';
import { firstPaint, recordFirstPaint } from '../../harness/palette.ts';
import { exceptionRectangles, screenshotWithExceptionRectangles } from '../../harness/exceptions.ts';
import { recordScriptRequests, scriptOrderIssues } from '../../harness/scripts.ts';
import { buildSite, cleanup } from '../fixtures/composition/build.ts';

declare global {
  interface Window {
    /** Test-only: one entry per <html style> mutation batch, oldest first. */
    __paintLog?: Array<{ readyState: string; text: string }>;
  }
}

const skin = (id: string) => THEMES.find((entry) => entry.id === id) as SkinTheme;
const baseText = (id: string) => skin(id).colors.text;

/** Five valid, distinct, non-registry colours: nothing here can match a theme by accident. */
const SEED_COLORS = ['#123456', '#abcdef', '#0f1e2d', '#fedcba', '#778899'];

/** A second palette for the same theme, so a reload cannot pass by repainting the first. */
const SECOND_COLORS = ['#111213', '#141516', '#171819', '#1a1b1c', '#1d1e1f'];
const ROLE_TOKENS = ['--text', '--bg', '--primary', '--secondary', '--accent'] as const;

/** `rampDeclarations` as prop -> value pairs: what `getPropertyValue` returns for a custom property. */
const rampMap = (colors: string[]) => {
  const [text, bg, primary, secondary, accent] = colors;
  const declarations = rampDeclarations({ text, bg, primary, secondary, accent }).split(';').filter(Boolean);
  return Object.fromEntries(
    declarations.map((declaration) => {
      const colon = declaration.indexOf(':');
      return [declaration.slice(0, colon), declaration.slice(colon + 1)];
    }),
  );
};
const seedRecord = (style: string) => ({
  style,
  colors: SEED_COLORS,
  locks: [false, false, false, false, false],
  scheme: 'random',
  theme: 'dark',
});

// ---- server and the built site ---------------------------------------------

const MIME: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
};

/**
 * Loopback-only static server on an ephemeral port, with GitHub Pages semantics: a directory
 * resolves to index.html, and anything missing is answered with dist/404.html and a 404 status.
 */
async function serve(root: string) {
  const notFound = readFileSync(join(root, '404.html'));
  const server = createServer((req, res) => {
    let path: string;
    try {
      path = decodeURIComponent((req.url ?? '/').split('?')[0]);
    } catch {
      // A malformed %-escape is a bad request, not an exception that takes the server down.
      res.writeHead(400, { 'content-type': 'text/plain' });
      res.end('bad request');
      return;
    }
    let file = join(root, normalize(path).replace(/^(\.\.(\/|\\|$))+/, ''));
    try {
      if (statSync(file).isDirectory()) file = join(file, 'index.html');
    } catch {
      // Missing path: the readFileSync below turns it into the 404.
    }
    let body: Buffer;
    try {
      body = readFileSync(file);
    } catch {
      res.writeHead(404, { 'content-type': 'text/html; charset=utf-8' });
      res.end(notFound);
      return;
    }
    res.writeHead(200, { 'content-type': MIME[extname(file)] ?? 'application/octet-stream' });
    res.end(body);
  });
  await new Promise<void>((ready) => server.listen(0, '127.0.0.1', ready));
  const { port } = server.address() as AddressInfo;
  return {
    origin: `http://127.0.0.1:${port}`,
    close: () => new Promise<void>((done) => server.close(() => done())),
  };
}

const test = base.extend<object, { site: string }>({
  site: [
    async ({}, use) => {
      // buildSite removes its own tree when the build fails, and the two finallys cover the
      // rest, so neither a build nor a listening socket outlives the worker.
      const { dir, dist } = buildSite('w-');
      try {
        const server = await serve(dist);
        try {
          await use(server.origin);
        } finally {
          await server.close();
        }
      } finally {
        cleanup(dir);
      }
    },
    { scope: 'worker' },
  ],
});

// Offline: only the loopback server answers.
test.beforeEach(async ({ page }) => {
  await page.context().route('**/*', (route) => {
    const { hostname } = new URL(route.request().url());
    return hostname === '127.0.0.1' ? route.continue() : route.abort();
  });
});

// ---- helpers ---------------------------------------------------------------

const isTouch = () => test.info().project.use.hasTouch === true;
const activate = async (target: Locator) => (isTouch() ? target.tap() : target.click());

/** The live `--text` declaration on <html>, which is what the pre-paint script writes. */
const textVar = (page: Page) =>
  page.evaluate(() => document.documentElement.style.getPropertyValue('--text').trim());

const styleAttr = (page: Page) => page.evaluate(() => document.documentElement.getAttribute('data-style'));

/**
 * Seed the session record and start recording every `<html style>` mutation, both before any
 * page script runs. The observer is registered on `document` with subtree, because at this
 * point the parser has not created `documentElement` yet, so it filters down to the mutations
 * whose target IS `<html>`. The seed is written only when the record is absent: a test that
 * replaces it and reloads must see its own record, not this one again.
 */
const instrument = (page: Page, record: object) =>
  page.addInitScript((seed) => {
    try {
      if (!sessionStorage.getItem('dawson-theme-cycler')) {
        sessionStorage.setItem('dawson-theme-cycler', JSON.stringify(seed));
      }
    } catch {}
    window.__paintLog = [];
    new MutationObserver((mutations) => {
      if (!mutations.some((mutation) => mutation.target === document.documentElement)) return;
      window.__paintLog?.push({
        readyState: document.readyState,
        text: document.documentElement.style.getPropertyValue('--text').trim(),
      });
    }).observe(document, { attributes: true, attributeFilter: ['style'], subtree: true });
  }, record);

const paintLog = (page: Page) => page.evaluate(() => window.__paintLog ?? []);

/** The first thing that touched `<html style>` was the pre-paint script, mid-parse. */
async function assertPrePaint(page: Page, text = SEED_COLORS[0]) {
  const log = await paintLog(page);
  expect(log.length).toBeGreaterThan(0);
  expect(log[0].readyState).toBe('loading');
  expect(log[0].text).toBe(text);
  expect(await textVar(page)).toBe(text);
}

/** boot() has run once the preview card carries the active theme's name. */
const booted = (page: Page) => expect(page.locator('#tc-preview-name')).toHaveText(/\S/);

/** Every part of one preset row the 404's marker move touches (S1-11's contract). */
const rowState = (page: Page, id: string) =>
  page.evaluate((theme) => {
    const link = document.querySelector(`#tc-presets a[data-id="${theme}"]`);
    const row = link?.parentElement;
    const card = row?.querySelector('button[data-id]');
    return {
      row: row?.className ?? null,
      link: link?.className ?? null,
      current: link?.getAttribute('aria-current') ?? null,
      card: card?.className ?? null,
      pressed: card?.getAttribute('aria-pressed') ?? null,
    };
  }, id);

// ---- a. the saved palette, before first paint -------------------------------

test('a: the shared observer proves a saved palette survives navigation and reload before paint', async ({ page, site }) => {
  await recordFirstPaint(page, 'dawson-theme-cycler', ROLE_TOKENS);
  await instrument(page, seedRecord('brutalist'));

  await page.goto(`${site}/brutalist/`);
  await assertPrePaint(page);
  expect((await firstPaint(page)).roles).toEqual(Object.fromEntries(ROLE_TOKENS.map((role, i) => [role, SEED_COLORS[i]])));
  await booted(page);
  expect(await textVar(page)).toBe(SEED_COLORS[0]); // the runtime keeps what the pre-paint wrote

  await page.goto(`${site}/brutalist/blog/`);
  expect((await firstPaint(page)).roles).toEqual(Object.fromEntries(ROLE_TOKENS.map((role, i) => [role, SEED_COLORS[i]])));
  await booted(page);

  // Replace the record with a second palette under the same theme. The init script seeds only
  // when nothing is stored, so what the reload paints can only have come from storage.
  await page.evaluate((colors) => {
    const saved = JSON.parse(sessionStorage.getItem('dawson-theme-cycler') ?? 'null');
    sessionStorage.setItem('dawson-theme-cycler', JSON.stringify({ ...saved, colors }));
  }, SECOND_COLORS);

  await page.reload();
  await assertPrePaint(page, SECOND_COLORS[0]);
  expect((await firstPaint(page)).roles).toEqual(Object.fromEntries(ROLE_TOKENS.map((role, i) => [role, SECOND_COLORS[i]])));
  await booted(page);
  expect(await textVar(page)).toBe(SECOND_COLORS[0]);
});

test('a: the pre-paint script alone restores the palette on picker-free LexChat', async ({ page, site }) => {
  await instrument(page, seedRecord('brutalist'));

  await page.goto(`${site}/brutalist/lexchat/`);
  await assertPrePaint(page);
  // Nothing else could have done it: this composition loads no picker runtime.
  expect(await page.locator('script[src*="theme-cycler.js"]').count()).toBe(0);

  // The whole ramp, not just --text: the pre-paint script inlines its own copy of
  // rampDeclarations, so every one of the 100 properties has to match the build's output.
  const expected = rampMap(SEED_COLORS);
  expect(Object.keys(expected)).toHaveLength(100);
  const applied = await page.evaluate(
    (props) =>
      Object.fromEntries(props.map((prop) => [prop, document.documentElement.style.getPropertyValue(prop)])),
    Object.keys(expected),
  );
  expect(applied).toEqual(expected);
});

test('a: a record drawn under another theme is ignored', async ({ page, site }) => {
  await instrument(page, seedRecord('grid'));

  await page.goto(`${site}/brutalist/`);
  await booted(page);
  expect(await textVar(page)).toBe(baseText('brutalist'));
});

// ---- b. the ?style= shim ----------------------------------------------------

test('b: ?style= on a default route navigates to the themed same page', async ({ page, site }) => {
  for (const [from, to] of [
    ['/?style=brutalist&x=1#about', '/brutalist/?x=1#about'],
    ['/blog/?style=marquee&x=1#y', '/marquee/blog/?x=1#y'],
    ['/privacy/?style=grid', '/grid/privacy/'],
  ]) {
    await page.goto(`${site}${from}`, { waitUntil: 'commit' });
    await expect(page).toHaveURL(`${site}${to}`);
    await page.waitForLoadState('load');
  }
});

test('b: an unknown, default or already-themed ?style= does not misroute', async ({ page, site }) => {
  for (const [url, style] of [
    ['/?style=default', null],
    ['/?style=nope', null],
    // A themed route carries no shim at all: the theme is already the path.
    ['/brutalist/?style=grid', 'brutalist'],
  ]) {
    await page.goto(`${site}${url}`);
    await page.waitForLoadState('load');
    await expect(page).toHaveURL(`${site}${url}`);
    expect(await styleAttr(page)).toBe(style);
  }
});

// ---- c. the 404 -------------------------------------------------------------

test('c: the 404 resolves a valid path segment and applies that theme', async ({ page, site }) => {
  const response = await page.goto(`${site}/brutalist/nope/`);
  expect(response?.status()).toBe(404);
  expect(await styleAttr(page)).toBe('brutalist');

  // fonts, theme-base, skin sheet, in the bootstrap's order (§5.4).
  const links = await page
    .locator('head link[data-style-asset]')
    .evaluateAll((nodes) => nodes.map((node) => node.getAttribute('href')));
  expect(links).toEqual([...(skin('brutalist').fonts ?? []), '/css/themes/theme-base.css', skin('brutalist').css]);

  // The marker moved, in both directions: all five parts of S1-11's row contract.
  const target = await rowState(page, 'brutalist');
  expect(target.row).toContain('tc-row-sel');
  expect(target.link).toContain('tc-sel');
  expect(target.current).toBe('true');
  expect(target.card).toContain('tc-sel');
  expect(target.pressed).toBe('true');

  const vacated = await rowState(page, 'default');
  expect(vacated.row).not.toContain('tc-row-sel');
  expect(vacated.link).not.toContain('tc-sel');
  expect(vacated.current).toBe(null);
  expect(vacated.card).not.toContain('tc-sel');
  expect(vacated.pressed).toBe('false');

  // D27: the page is built in the default theme, so even here, where the runtime rewrote the
  // document, its own links stay unthemed.
  await expect(page.locator('a.name-logo')).toHaveAttribute('href', '/');
  await expect(page.locator('a.text-link')).toHaveAttribute('href', '/');

  // The picker boots on top of the runtime-applied theme and opens from the FAB.
  await booted(page);
  await activate(page.locator('.tc-fab .tc-nav-trigger'));
  await expect(page.locator('#tc-dock')).toHaveClass(/tc-mega-open/);
  await expect(page.locator('#tc-dock')).not.toHaveClass(/tc-hidden/);
});

test('c: the 404 falls back to ?style= and ignores an unknown id', async ({ page, site }) => {
  await page.goto(`${site}/nope/?style=grid`);
  expect(await styleAttr(page)).toBe('grid');

  await page.goto(`${site}/nope/?style=nope`);
  expect(await styleAttr(page)).toBe(null);

  const response = await page.goto(`${site}/nope/`);
  expect(response?.status()).toBe(404);
  expect(await styleAttr(page)).toBe(null);
  // Nothing resolved, so the default row keeps the marker it was built with.
  expect((await rowState(page, 'default')).row).toContain('tc-row-sel');
});

test('c: the 404 applies the saved palette of the theme it resolved', async ({ page, site }) => {
  await instrument(page, seedRecord('brutalist'));

  await page.goto(`${site}/brutalist/nope/`);
  await booted(page);
  expect(await textVar(page)).toBe(SEED_COLORS[0]);
});

// ---- d. LexChat is picker-free ---------------------------------------------

test('d: LexChat carries no picker markup and no picker runtime', async ({ page, site }) => {
  for (const path of ['/lexchat/', '/grid/lexchat/']) {
    await page.goto(`${site}${path}`);
    for (const selector of ['#tc-dock', '#tc-scrim', '.tc-nav-trigger', '.tc-fab']) {
      expect(await page.locator(selector).count(), `${path} ${selector}`).toBe(0);
    }
    const scripts = await page
      .locator('script[src]')
      .evaluateAll((nodes) => nodes.map((node) => node.getAttribute('src') ?? ''));
    expect(scripts.filter((src) => src.includes('theme-cycler.js'))).toEqual([]);
  }
});

// ---- S1-13 harness boundary probes ------------------------------------------------------------

test('S1-13 masks the same bounded visible picker rectangle on privacy and 404', async ({ browser }, testInfo) => {
  for (const pageType of ['privacy', 'notFound'] as const) {
    const context = await browser.newContext({ viewport: { width: 320, height: 200 } });
    const oldPage = await context.newPage();
    const newPage = await context.newPage();
    try {
      const base = '<meta name="viewport" content="width=device-width"><style>html,body{margin:0;width:100%;height:100%;background:white}</style><main style="width:20px;height:20px;background:black"></main>';
      await oldPage.setContent(base);
      await newPage.setContent(`${base}<button class="tc-fab" style="position:fixed;right:16px;bottom:16px;width:48px;height:48px;background:red">T</button><div id="tc-scrim" style="position:fixed;inset:0;opacity:0"></div>`);
      const rectangles = await exceptionRectangles(oldPage, newPage, pageType, 'default');
      expect(rectangles).toEqual([{ x: 256, y: 136, width: 48, height: 48 }]);
      const oldPng = await screenshotWithExceptionRectangles(oldPage, [], rectangles, false);
      const newPng = await screenshotWithExceptionRectangles(newPage, [], rectangles, false);
      const name = `s1-13-${pageType}-mask.png`;
      const reference = testInfo.snapshotPath(name, { kind: 'screenshot' });
      mkdirSync(dirname(reference), { recursive: true });
      writeFileSync(reference, oldPng);
      expect(newPng).toMatchSnapshot(name, { maxDiffPixels: 0, threshold: 0 });

      await newPage.evaluate(() => {
        const unrelated = document.createElement('div');
        unrelated.style.cssText = 'position:fixed;left:0;bottom:0;width:24px;height:24px;background:blue';
        document.body.append(unrelated);
      });
      const changed = await screenshotWithExceptionRectangles(newPage, [], rectangles, false);
      expect(changed).not.toEqual(oldPng);
    } finally {
      await context.close();
    }
  }
});

test('S1-13 changed-card mask is the bounded union of asymmetric OLD and NEW wrapping', async ({ browser }, testInfo) => {
  const context = await browser.newContext({ viewport: { width: 500, height: 300 } });
  const oldPage = await context.newPage();
  const newPage = await context.newPage();
  const cards = (side: 'old' | 'new') => `
    <meta name="viewport" content="width=device-width"><style>html,body{margin:0;background:white}.blog-card{position:absolute;width:180px;height:110px;color:black}.blog-card-title{position:absolute;left:0;top:0;margin:0;width:${side === 'old' ? 70 : 160}px;font:16px Arial}.blog-card-date{position:absolute;left:0;top:80px;margin:0;font:12px Arial}</style>
    <a class="blog-card" style="left:20px;top:20px" href="${side === 'old' ? 'post.html?id=helm' : '/blog/helm/'}"><span class="blog-card-title">${side === 'old' ? 'A substantially longer old Helm title' : 'New Helm'}</span><span class="blog-card-date">March 2026</span></a>
    <a class="blog-card" style="left:250px;top:20px" href="${side === 'old' ? 'post.html?id=metr-doubling' : '/blog/metr-doubling/'}"><span class="blog-card-title">${side === 'old' ? 'Old METR' : 'A substantially longer new METR title'}</span><span class="blog-card-date">February 2026</span></a>`;
  try {
    await oldPage.setContent(cards('old'));
    await newPage.setContent(cards('new'));
    const rectangles = await exceptionRectangles(oldPage, newPage, 'blog', 'default');
    expect(rectangles).toHaveLength(2);
    expect(rectangles[0]!.height).toBeGreaterThan(80);
    expect(rectangles[1]!.width).toBeGreaterThan(150);
    const oldPng = await screenshotWithExceptionRectangles(oldPage, [], rectangles, false);
    const newPng = await screenshotWithExceptionRectangles(newPage, [], rectangles, false);
    const name = 's1-13-changed-card-union.png';
    const reference = testInfo.snapshotPath(name, { kind: 'screenshot' });
    mkdirSync(dirname(reference), { recursive: true });
    writeFileSync(reference, oldPng);
    expect(newPng).toMatchSnapshot(name, { maxDiffPixels: 0, threshold: 0 });
  } finally {
    await context.close();
  }
});

test('S1-13 records an unlisted dynamic module and a loaded-then-removed script', async ({ page, site }) => {
  await page.route(`${site}/script-probe/`, (route) => route.fulfill({
    contentType: 'text/html',
    body: '<script type="module">import("/unlisted-module.js").then(()=>window.moduleLoaded=true)</script><script src="/removed.js" onload="window.removedLoaded=true;this.remove()"></script>',
  }));
  await page.route(`${site}/unlisted-module.js`, (route) => route.fulfill({ contentType: 'text/javascript', body: 'export const loaded = true;' }));
  await page.route(`${site}/removed.js`, (route) => route.fulfill({ contentType: 'text/javascript', body: 'window.removedExecuted=true;' }));
  const requests = recordScriptRequests(page);
  try {
    await page.goto(`${site}/script-probe/`, { waitUntil: 'load' });
    await expect.poll(() => page.evaluate(() => Boolean((window as unknown as { moduleLoaded?: boolean }).moduleLoaded))).toBe(true);
    await expect.poll(() => page.evaluate(() => Boolean((window as unknown as { removedLoaded?: boolean }).removedLoaded))).toBe(true);
    expect(await page.locator('script[src]').count()).toBe(0);
    const actual = requests.snapshot(`${site}/script-probe/`);
    expect([...actual].sort()).toEqual(['/removed.js', '/unlisted-module.js']);
    expect(scriptOrderIssues('lexchat', 'old', 'loaded', actual).join('\n')).toMatch(/not allowed.*removed|removed.*not allowed/);
    expect(scriptOrderIssues('lexchat', 'old', 'loaded', actual).join('\n')).toMatch(/not allowed.*unlisted|unlisted.*not allowed/);
  } finally {
    requests.dispose();
  }
});
