/**
 * S1-11: the shared picker chrome and its palette runtime, proven in a browser against a REAL
 * Astro build of the real src/ tree plus three throwaway fixture pages (a nav mount, a
 * standalone FAB page, and the same FAB in each of the four corners).
 *
 * Servers: two in-process node:http static servers, both bound to 127.0.0.1 on an ephemeral
 * port and closed in the worker teardown: never a parity port, never a persistent listener.
 * The NEW side serves the temp build's dist/; the OLD side serves the SHA-pinned detached
 * baseline checkout (or PARITY_OLD_DIR) for the one
 * dock-parity test. Every page aborts requests to any host but 127.0.0.1, so no font or CDN
 * ever loads and the run is offline-deterministic.
 *
 * Run: ./node_modules/.bin/playwright test tests/browser/picker.spec.ts   (no PARITY_MODE)
 */
import { test as base, expect } from '@playwright/test';
import type { Locator, Page } from '@playwright/test';
import { spawnSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmdirSync, rmSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import type { AddressInfo } from 'node:net';
import { dirname, extname, join, normalize, resolve } from 'node:path';

import { oldDir } from '../../harness/baseline.ts';
import { href, themeParams } from '../../src/themes/paths.ts';
import { THEME_IDS, THEMES } from '../../src/themes/registry.ts';
import type { SkinTheme } from '../../src/themes/types.ts';

const repoRoot = resolve(import.meta.dirname, '..', '..');
const fixtureRoot = join(repoRoot, 'tests', 'fixtures', 'picker');
const tmpRoot = join(fixtureRoot, '.tmp');
const astroBin = join(repoRoot, 'node_modules', 'astro', 'bin', 'astro.mjs');

/** Everything the picker needs and nothing else: the point of the standalone fixture. */
const PUBLIC_SUBSET = ['js/theme-cycler.js', 'css/theme-cycler.css', 'css/themes', 'vendor/fontawesome-free'];

const ROLE_KEYS = ['text', 'bg', 'primary', 'secondary', 'accent'] as const;
const ROLE_VARS = ROLE_KEYS.map((key) => '--' + key);
const DERIVED_NEUTRALS = [
  '--jobs-menu-navy-dark', '--jobs-menu-navy', '--jobs-menu-slate', '--neutral-gray', '--code-bg', '--code-fg',
];
const theme = (id: string) => THEMES.find((entry) => entry.id === id)!;
const skinFonts = (id: string) => (theme(id) as SkinTheme).fonts ?? [];
/** A theme's five registry colours in role order, which is what a fresh boot must paint. */
const baseColors = (id: string) => ROLE_KEYS.map((key) => theme(id).colors[key]);

// Waits, each one sized off a constant in public/js/theme-cycler.js or css/theme-cycler.css.
const BUILD_MS = 180_000;      // one Astro build of the real src/ plus this fixture's routes
const HIDE_MS = 2_000;         // the 440ms hide timer that runs after a close, with margin
const HOVER_CLOSE_MS = 3_000;  // the 300ms hover-close timer plus that 440ms hide, with margin
const FONTS_MS = 6_000;        // requestIdleCallback({timeout: 2500}) plus one link per skin
const SETTLE_SAMPLE_MS = 150;  // gap between the two dock heights that have to agree
const SETTLE_MS = 5_000;       // ceiling for the 0.42s open transition to stop moving

// ---- servers and the built fixture -----------------------------------------

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

/** Loopback-only static file server on an ephemeral port; directories resolve to index.html. */
async function serve(root: string) {
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
      // Missing path: readFileSync below turns it into the 404.
    }
    let body: Buffer;
    try {
      body = readFileSync(file);
    } catch {
      res.writeHead(404, { 'content-type': 'text/plain' });
      res.end('not found');
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

type Sites = { site: string; old: string; dist: string };

const test = base.extend<object, { sites: Sites }>({
  sites: [
    async ({}, use) => {
      mkdirSync(tmpRoot, { recursive: true });
      const dir = mkdtempSync(join(tmpRoot, 'w-'));
      // Everything after the temp dir exists is wrapped, so a failed build or a failed test
      // leaves neither the build nor a listening socket behind.
      const opened: Array<{ close: () => Promise<void> }> = [];
      try {
        // The real src/ minus its pages, the real config, and this fixture's pages: the build
        // exercises the real registry, projection, paths, prose and components.
        cpSync(join(repoRoot, 'src'), join(dir, 'src'), {
          recursive: true,
          filter: (src) => src !== join(repoRoot, 'src', 'pages'),
        });
        cpSync(join(repoRoot, 'astro.config.mjs'), join(dir, 'astro.config.mjs'));
        cpSync(join(fixtureRoot, 'pages'), join(dir, 'src', 'pages'), { recursive: true });
        for (const rel of PUBLIC_SUBSET) {
          const dest = join(dir, 'public', rel);
          mkdirSync(dirname(dest), { recursive: true });
          cpSync(join(repoRoot, 'public', rel), dest, { recursive: true });
        }

        const env = { ...process.env };
        delete env.PROSE_DRAFTS;
        const run = spawnSync(process.execPath, [astroBin, 'build', '--root', dir], {
          encoding: 'utf8',
          timeout: BUILD_MS,
          env,
        });
        if (run.status !== 0) throw new Error(`astro build failed (${run.status}):\n${run.stdout}\n${run.stderr}`);

        // The legacy site, for the dock-parity test. An explicit PARITY_OLD_DIR that is not a
        // checkout is a broken run, not a reason to pass.
        const oldRoot = oldDir();
        if (!existsSync(join(oldRoot, 'js', 'theme-cycler.js'))) {
          throw new Error(`old side ${oldRoot} has no js/theme-cycler.js; PARITY_OLD_DIR is wrong`);
        }

        const dist = join(dir, 'dist');
        const newSite = await serve(dist);
        opened.push(newSite);
        const oldSite = await serve(oldRoot);
        opened.push(oldSite);
        await use({ site: newSite.origin, old: oldSite.origin, dist });
      } finally {
        for (const server of opened) await server.close();
        rmSync(dir, { recursive: true, force: true });
        try {
          rmdirSync(tmpRoot); // succeeds for whichever worker leaves last
        } catch {
          // Another worker still holds a build.
        }
      }
    },
    { scope: 'worker' },
  ],
});

// Offline: only the two loopback servers answer. Context-level so extra pages inherit it.
test.beforeEach(async ({ page }) => {
  await page.context().route('**/*', (route) => {
    const { hostname } = new URL(route.request().url());
    return hostname === '127.0.0.1' ? route.continue() : route.abort();
  });
});

// ---- helpers ---------------------------------------------------------------

const isTouch = () => test.info().project.use.hasTouch === true;
const isNarrow = (page: Page) => (page.viewportSize()?.width ?? 1440) <= 1100;

const roles = (page: Page) =>
  page.evaluate(
    (vars) => vars.map((name) => document.documentElement.style.getPropertyValue(name).trim()),
    ROLE_VARS,
  );

const derived = (page: Page) =>
  page.evaluate(
    (vars) =>
      Object.fromEntries(vars.map((name) => [name, document.documentElement.style.getPropertyValue(name).trim()])),
    DERIVED_NEUTRALS,
  );

const stored = (page: Page) =>
  page.evaluate(() => JSON.parse(sessionStorage.getItem('dawson-theme-cycler') ?? 'null'));

/** Seed the session record the next boot will read. Same origin, so any fixture page will do. */
const seed = (page: Page, record: unknown) =>
  page.evaluate(
    (value) => sessionStorage.setItem('dawson-theme-cycler', JSON.stringify(value)),
    record,
  );

/** The five colour inputs, set and dispatched exactly as a drag on the native picker would. */
const setColors = (page: Page, colors: string[]) =>
  page.evaluate((hexes) => {
    hexes.forEach((hex, i) => {
      const input = document.getElementById(`tc-color-${i}`) as HTMLInputElement;
      input.value = hex;
      input.dispatchEvent(new Event('input', { bubbles: true }));
    });
  }, colors);

/**
 * Wait out the dock's open transition without a fixed sleep: poll until two height readings
 * SETTLE_SAMPLE_MS apart agree and are non-zero.
 */
async function dockSettled(page: Page) {
  const height = async () => (await page.locator('#tc-dock').boundingBox())?.height ?? 0;
  await expect
    .poll(
      async () => {
        const first = await height();
        await page.waitForTimeout(SETTLE_SAMPLE_MS);
        return first > 0 && first === (await height()) ? first : 0;
      },
      { timeout: SETTLE_MS },
    )
    .toBeGreaterThan(0);
}

/** boot() has run once the preview card carries the active theme's name. */
const booted = (page: Page) => expect(page.locator('#tc-preview-name')).toHaveText(/\S/);

const activate = async (target: Locator) => (isTouch() ? target.tap() : target.click());

/** Open the dock from a trigger and wait for the panel to be open. */
async function open(page: Page, selector: string) {
  await activate(page.locator(selector));
  await expect(page.locator('#tc-dock')).toHaveClass(/tc-mega-open/);
  await expect(page.locator('#tc-dock')).not.toHaveClass(/tc-hidden/);
}

/** Reveal the scheme + colour editor, which starts hidden behind the themes list. */
async function openAdvanced(page: Page) {
  await activate(page.locator('#tc-advanced-link'));
  await expect(page.locator('#tc-advanced')).not.toHaveClass(/tc-hidden/);
}

/** The visible shape of a preset row: the text link on wide viewports, the card on narrow. */
const row = (page: Page, id: string) =>
  isNarrow(page) ?
    page.locator(`#tc-presets .tc-row-card[data-id="${id}"]`)
  : page.locator(`#tc-presets a[data-id="${id}"]`);

/**
 * One canonical shape for a subtree: tag, attributes sorted by name with whitespace-collapsed
 * values, and element/non-empty-text children. Comments are dropped. `strip` removes the
 * attributes §15.9 excepts on the NEW side (the dock's prose carriers, every row's
 * profile, and the rows' font lists); `href` on a row link is dropped on both sides, because the
 * new one is the themed URL of this page and the old one is the legacy query seed (D11).
 */
async function dockShape(page: Page, strip: boolean) {
  return page.evaluate((stripNew) => {
    const canon = (el: Element): unknown => {
      const attrs = [...el.attributes]
        .filter((attr) => {
          if (el.matches('a.tc-row-link') && attr.name === 'href') return false;
          if (!stripNew) return true;
          if (el.id === 'tc-dock' && attr.name.startsWith('data-')) return false;
          if (el.tagName === 'LI' && attr.name === 'data-profile') return false;
          if (el.tagName === 'A' && attr.name === 'data-fonts') return false;
          return true;
        })
        .map((attr) => `${attr.name}=${attr.value.replace(/\s+/g, ' ').trim()}`)
        .sort();
      const kids: unknown[] = [];
      for (const node of el.childNodes) {
        if (node.nodeType === 1) kids.push(canon(node as Element));
        else if (node.nodeType === 3) {
          const text = (node.textContent ?? '').replace(/\s+/g, ' ').trim();
          if (text) kids.push(text);
        }
      }
      return [el.tagName, attrs, kids];
    };
    return ['tc-dock', 'tc-scrim'].map((id) => canon(document.getElementById(id)!));
  }, strip);
}

const decode = (text: string) =>
  text.replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&#34;/g, '"').replace(/&amp;/g, '&');

/** The row's data-profile, decoded and parsed, from that row's `<li …>` attribute string. */
const profileOf = (li: string) => JSON.parse(decode(/data-profile="([^"]*)"/.exec(li)![1]));

/** `<li …><a …>` attribute strings per row id, straight out of the built HTML. */
function rowTags(html: string) {
  const rows = new Map<string, { li: string; a: string }>();
  for (const match of html.matchAll(/<li([^>]*)>\s*<a([^>]*)>/g)) {
    const id = /data-id="([^"]+)"/.exec(match[2])?.[1];
    if (id) rows.set(id, { li: match[1], a: match[2] });
  }
  return rows;
}

// ---- tests -----------------------------------------------------------------

test('a: boots standalone on a page with no nav, no canonical DOM and no library', async ({ page, sites }) => {
  const pageErrors: string[] = [];
  const consoleErrors: string[] = [];
  const failed: string[] = [];
  page.on('pageerror', (error) => pageErrors.push(String(error)));
  // The harness aborts every non-loopback request, and Chromium logs each as a console
  // error against that request's own URL; those are ours. Anything the page itself says,
  // and anything served from 127.0.0.1, counts.
  page.on('console', (message) => {
    if (message.type() !== 'error') return;
    const url = message.location().url;
    if (url && !url.includes('127.0.0.1')) return;
    consoleErrors.push(`${url} ${message.text()}`);
  });
  page.on('requestfailed', (request) => {
    if (new URL(request.url()).hostname === '127.0.0.1') failed.push(request.url());
  });

  await page.goto(`${sites.site}/brutalist/fab/`);
  await booted(page);

  expect(pageErrors).toEqual([]);
  expect(consoleErrors).toEqual([]);
  expect(failed).toEqual([]);

  await expect(page.locator('#tc-dock')).toHaveClass(/tc-hidden/);
  // D32: the runtime publishes nothing on the window. `__playwright_snapshot_streamer_<hash>`
  // is the tracer's own injection into the main world (config `trace: retain-on-failure`),
  // not the page's; nothing else beginning `__` may survive.
  expect(await page.evaluate(() =>
    Object.keys(window).filter((key) => key.startsWith('__') && !key.startsWith('__playwright')),
  )).toEqual([]);

  const ids = await page.locator('#tc-presets li a[data-id]').evaluateAll((els) =>
    els.map((el) => el.getAttribute('data-id')));
  expect(ids).toEqual(THEME_IDS);
  expect(ids).toHaveLength(THEME_IDS.length);

  const active = page.locator('#tc-presets li').filter({ has: page.locator('a[data-id="brutalist"]') });
  await expect(active).toHaveClass('tc-row-sel');
  await expect(active.locator('a')).toHaveAttribute('aria-current', 'true');
  await expect(active.locator('button')).toHaveAttribute('aria-pressed', 'true');

  // D11: every row keeps the page you are on.
  const hrefs = await page.locator('#tc-presets a[data-id]').evaluateAll((els) =>
    els.map((el) => new URL((el as HTMLAnchorElement).href).pathname));
  expect(hrefs).toEqual(THEME_IDS.map((id) => href('/fab/', id)));

  // Opening, switching and randomizing all work from the FAB alone (the switch is test h).
  await open(page, '.tc-fab .tc-nav-trigger');
  const before = await roles(page);
  await activate(page.locator('#tc-randomize'));
  await expect.poll(() => roles(page)).not.toEqual(before);
});

test('b: the rendered dock is the DOM the legacy runtime built', async ({ page, sites }) => {
  const oldPage = await page.context().newPage();
  try {
    for (const id of ['default', 'brutalist', 'marquee', 'grid']) {
      await oldPage.goto(`${sites.old}/?style=${id}`);
      await expect(oldPage.locator('#tc-presets li')).toHaveCount(THEME_IDS.length);
      await expect(oldPage.locator('#tc-roles .tc-role')).toHaveCount(5);
      await booted(oldPage);

      await page.goto(`${sites.site}${href('/', id)}`);
      await expect(page.locator('#tc-presets li')).toHaveCount(THEME_IDS.length);
      await expect(page.locator('#tc-roles .tc-role')).toHaveCount(5);
      await booted(page);

      expect(await dockShape(page, true), `dock parity for ${id}`).toEqual(await dockShape(oldPage, false));

      // Each theme is compared as a FIRST visit. boot() persists the palette it applied, and
      // both sides restore it on the next page, so without this the next iteration would be
      // comparing two docks showing the previous theme's colours.
      await page.evaluate(() => sessionStorage.clear());
      await oldPage.evaluate(() => sessionStorage.clear());
    }
  } finally {
    await oldPage.close();
  }
});

test('c: every trigger opens by pointer and keyboard, and the state is on the aria + scrim', async ({ page, sites }) => {
  const dock = page.locator('#tc-dock');
  const scrim = page.locator('#tc-scrim');

  await page.goto(`${sites.site}/`);
  await booted(page);

  for (const [mount, pill] of [
    ['.static-menu .tc-nav-trigger', '.static-menu'],
    ['.static-menu-mobile .tc-nav-trigger', '.static-menu-mobile'],
  ] as const) {
    await open(page, mount);
    await expect(page.locator(mount)).toHaveAttribute('aria-expanded', 'true');
    await expect(scrim).toHaveClass(/tc-on/);
    await expect(page.locator(pill)).toHaveClass(/tc-lift/);
    // A nav dock is anchored under its pill, never capped like a FAB one.
    await expect(dock).not.toHaveClass(/tc-from-fab/);

    await page.keyboard.press('Escape');
    await expect(page.locator(mount)).toHaveAttribute('aria-expanded', 'false');
    await expect(scrim).not.toHaveClass(/tc-on/);
    await expect(dock).toHaveClass(/tc-hidden/, { timeout: HIDE_MS });
  }

  // Keyboard: focus the trigger and press Enter. Park the pointer clear of every mount
  // first, because on the desktop project it is still resting on the trigger it last
  // clicked, and hover-open would reopen the panel behind the keyboard.
  await page.mouse.move(5, 500);
  await page.locator('.static-menu .tc-nav-trigger').focus();
  await page.keyboard.press('Enter');
  await expect(dock).toHaveClass(/tc-mega-open/);
  await page.keyboard.press('Escape');
  await expect(dock).toHaveClass(/tc-hidden/, { timeout: HIDE_MS });

  // Hover-open is gated behind (hover: hover) and (pointer: fine), so it opens on the
  // desktop project and must NOT open on the touch one, which is the whole reason the
  // utility pages get a FAB rather than a bare nav item (D30).
  await page.locator('.static-menu .tc-nav-item').hover();
  if (isTouch()) {
    await expect(dock).toHaveClass(/tc-hidden/);
  } else {
    await expect(dock).toHaveClass(/tc-mega-open/);
    await page.mouse.move(5, 500); // clear of the pill and of the panel it opened
    await expect(dock).toHaveClass(/tc-hidden/, { timeout: HOVER_CLOSE_MS });
  }

  // The FAB: same contract, plus the height cap that only a FAB dock gets.
  await page.goto(`${sites.site}/fab/`);
  await booted(page);
  await open(page, '.tc-fab .tc-nav-trigger');
  await expect(page.locator('.tc-fab .tc-nav-trigger')).toHaveAttribute('aria-expanded', 'true');
  await expect(scrim).toHaveClass(/tc-on/);
  await expect(page.locator('.tc-fab')).toHaveClass(/tc-lift/);
  await expect(dock).toHaveClass(/tc-from-fab/);
  await page.keyboard.press('Escape');
  await expect(page.locator('.tc-fab .tc-nav-trigger')).toHaveAttribute('aria-expanded', 'false');
  await expect(dock).toHaveClass(/tc-hidden/, { timeout: HIDE_MS });
  await expect(dock).not.toHaveClass(/tc-from-fab/);

  // And by keyboard, in both projects: the FAB is a real <button>, so Enter activates it. The
  // touch project has no other way in, since hover-open is gated off there.
  await page.mouse.move(5, 500);
  await page.locator('.tc-fab .tc-nav-trigger').focus();
  await page.keyboard.press('Enter');
  await expect(dock).toHaveClass(/tc-mega-open/);
  await expect(page.locator('.tc-fab .tc-nav-trigger')).toHaveAttribute('aria-expanded', 'true');
  await page.keyboard.press('Escape');
  await expect(dock).toHaveClass(/tc-hidden/, { timeout: HIDE_MS });
});

test('d: a FAB in any corner is reachable and opens a dock that fits the viewport', async ({ page, sites }) => {
  const viewport = page.viewportSize()!;
  for (const corner of ['br', 'bl', 'tr', 'tl'] as const) {
    await page.goto(`${sites.site}/fab/${corner}/`);
    await booted(page);

    const fab = await page.locator('.tc-fab').boundingBox();
    expect(fab, `fab box on ${corner}`).not.toBeNull();
    expect(fab!.x, corner).toBeGreaterThanOrEqual(0);
    expect(fab!.y, corner).toBeGreaterThanOrEqual(0);
    expect(fab!.x + fab!.width, corner).toBeLessThanOrEqual(viewport.width);
    expect(fab!.y + fab!.height, corner).toBeLessThanOrEqual(viewport.height);
    // ...and in the corner it says it is in.
    const horizontal = corner[1] === 'r' ? fab!.x > viewport.width / 2 : fab!.x < viewport.width / 2;
    const vertical = corner[0] === 'b' ? fab!.y > viewport.height / 2 : fab!.y < viewport.height / 2;
    expect(horizontal && vertical, `fab sits in ${corner}`).toBe(true);

    await open(page, '.tc-fab .tc-nav-trigger');
    await dockSettled(page);
    const box = await page.locator('#tc-dock').boundingBox();
    expect(box, `dock box on ${corner}`).not.toBeNull();
    expect(box!.x, corner).toBeGreaterThanOrEqual(0);
    expect(box!.y, corner).toBeGreaterThanOrEqual(0);
    expect(box!.x + box!.width, corner).toBeLessThanOrEqual(viewport.width);
    expect(box!.y + box!.height, corner).toBeLessThanOrEqual(viewport.height);
  }

  // A short desktop viewport is what exercises the .tc-from-fab height cap: 900px of dock
  // opening upward out of a bottom-right FAB has to fit in 600px of window. Desktop only,
  // because the phone project has its own narrower cap and its own viewport.
  if (!isTouch()) {
    await page.setViewportSize({ width: 1280, height: 600 });
    await page.goto(`${sites.site}/fab/br/`);
    await booted(page);
    await open(page, '.tc-fab .tc-nav-trigger');
    await dockSettled(page);
    const box = (await page.locator('#tc-dock').boundingBox())!;
    expect(box.y, 'short viewport').toBeGreaterThanOrEqual(0);
    expect(box.y + box.height, 'short viewport').toBeLessThanOrEqual(600);
  }
});

test('e: shuffle repaints, persists, notifies and updates the tiles in place', async ({ page, sites }) => {
  await page.goto(`${sites.site}/`);
  await booted(page);
  await open(page, '.static-menu .tc-nav-trigger');
  await openAdvanced(page);

  await page.evaluate(() => {
    (window as unknown as { paletteEvents: number }).paletteEvents = 0;
    window.addEventListener('dawson:palette', () => {
      (window as unknown as { paletteEvents: number }).paletteEvents += 1;
    });
    document.querySelectorAll('#tc-roles .tc-role').forEach((el, i) => {
      (el as unknown as { probe: number }).probe = i;
    });
  });

  const before = await roles(page);
  await activate(page.locator('#tc-randomize'));
  await expect.poll(() => roles(page)).not.toEqual(before);
  const after = await roles(page);

  expect(await page.evaluate(() => (window as unknown as { paletteEvents: number }).paletteEvents)).toBe(1);
  expect(await stored(page)).toEqual({
    style: 'default', // this page's theme, which is what scopes the record
    colors: after,
    locks: [false, false, false, false, false],
    scheme: 'random',
    theme: 'dark',
  });

  // Same elements, new values: rebuilding would kill the native colour input.
  expect(await page.evaluate(() =>
    [...document.querySelectorAll('#tc-roles .tc-role')].map((el) => (el as unknown as { probe: number }).probe),
  )).toEqual([0, 1, 2, 3, 4]);
  expect(await page.locator('#tc-roles .tc-role').evaluateAll((els) =>
    els.map((el) => [
      el.getAttribute('title'),
      el.querySelector('.tc-sw')!.getAttribute('style'),
      (el.querySelector('input[type="color"]') as HTMLInputElement).value,
    ]),
  )).toEqual(after.map((hex) => [hex, `background:${hex}`, hex]));

  // Diverged from the theme's base, so all six neutrals are derived now.
  expect(Object.values(await derived(page)).filter(Boolean)).toHaveLength(6);

  // Space shuffles while the dock is open.
  await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
  await page.keyboard.press('Space');
  await expect.poll(() => roles(page)).not.toEqual(after);
  expect(await page.evaluate(() => (window as unknown as { paletteEvents: number }).paletteEvents)).toBe(2);

  // A locked role survives the next shuffle, and the lock says so.
  const lock = page.locator('#tc-roles .tc-role').first().locator('.tc-lk');
  await activate(lock);
  await expect(lock).toHaveClass(/tc-on/);
  await expect(lock).toHaveAttribute('aria-label', 'Unlock Text');
  await expect(lock.locator('i')).toHaveClass('fa-solid fa-lock');
  const beforeLockedShuffle = await roles(page);
  await activate(page.locator('#tc-randomize'));
  await expect.poll(() => roles(page)).not.toEqual(beforeLockedShuffle);
  expect((await roles(page))[0]).toBe(beforeLockedShuffle[0]);
  expect((await stored(page)).locks).toEqual([true, false, false, false, false]);
});

test('f: derived neutrals start from what the page shipped, not from a blend', async ({ page, sites }) => {
  const brutalist = theme('brutalist').tokens!;

  await page.goto(`${sites.site}/brutalist/`);
  await booted(page);
  expect(await derived(page)).toEqual({
    '--jobs-menu-navy-dark': brutalist['--jobs-menu-navy-dark'],
    '--jobs-menu-navy': brutalist['--jobs-menu-navy'],
    '--jobs-menu-slate': brutalist['--jobs-menu-slate'],
    '--neutral-gray': brutalist['--neutral-gray'],
    '--code-bg': '',
    '--code-fg': '',
  });

  // The default theme defines none of the six, so a fresh default page must show none. The
  // palette deliberately survives navigation (Q12), and boot() persisted brutalist's, so this
  // leg needs a clean session to be about the default theme rather than about the last one.
  await page.evaluate(() => sessionStorage.clear());
  await page.goto(`${sites.site}/`);
  await booted(page);
  expect(Object.values(await derived(page)).filter(Boolean)).toEqual([]);

  await open(page, '.static-menu .tc-nav-trigger');
  const base = await roles(page);
  await activate(page.locator('#tc-randomize'));
  await expect.poll(() => roles(page)).not.toEqual(base);
  expect(Object.values(await derived(page)).filter(Boolean)).toHaveLength(6);

  // Reset on the default theme is a no-op navigation, so the restore is observable here.
  await activate(page.locator('#tc-reset'));
  await expect.poll(() => roles(page)).toEqual(base);
  expect(Object.values(await derived(page)).filter(Boolean)).toEqual([]);
  await expect(page.locator('#tc-schemes [data-s="random"]')).toHaveClass('tc-sel');
  await expect(page.locator('#tc-schemes [data-s="random"]')).toHaveAttribute('aria-pressed', 'true');
});

test('f2: the neutral baseline is the theme\'s own tokens even when boot restores a diverged palette', async ({ page, sites }) => {
  const brutalist = theme('brutalist').tokens!;
  const base = baseColors('brutalist');
  const diverged = ['#102030', '#405060', '#708090', '#a0b0c0', '#d0e0f0'];

  // Seed the record, then load the page cold: boot() restores a diverged palette, so the very
  // first applyDerivedNeutrals() call both snapshots and writes. The snapshot has to be taken
  // before that write, which is the only thing that can put the theme's own tokens back.
  await page.goto(`${sites.site}/brutalist/`);
  await booted(page);
  await seed(page, {
    style: 'brutalist',
    colors: diverged,
    locks: [false, false, false, false, false],
    scheme: 'random',
    theme: 'light',
  });
  await page.goto(`${sites.site}/brutalist/`);
  await booted(page);
  expect(await roles(page)).toEqual(diverged);
  expect(Object.values(await derived(page)).filter(Boolean)).toHaveLength(6);

  // Back to brutalist's own five colours through the inputs, which is the return-to-base path.
  await setColors(page, base);
  expect(await roles(page)).toEqual(base);
  // Exactly the registry's four values, and the two brutalist never defined are gone again.
  // A baseline captured after the first derived write would leave the blends and #0d1117 here.
  expect(await derived(page)).toEqual({
    '--jobs-menu-navy-dark': brutalist['--jobs-menu-navy-dark'],
    '--jobs-menu-navy': brutalist['--jobs-menu-navy'],
    '--jobs-menu-slate': brutalist['--jobs-menu-slate'],
    '--neutral-gray': brutalist['--neutral-gray'],
    '--code-bg': '',
    '--code-fg': '',
  });
});

test('g: a colour input keeps focus while the palette updates around it', async ({ page, sites }) => {
  await page.goto(`${sites.site}/`);
  await booted(page);
  await open(page, '.static-menu .tc-nav-trigger');
  await openAdvanced(page);

  await page.locator('#tc-color-2').focus();
  await page.evaluate(() => {
    const input = document.getElementById('tc-color-2') as HTMLInputElement;
    input.value = '#123456';
    input.dispatchEvent(new Event('input', { bubbles: true }));
  });

  expect(await page.evaluate(() => document.activeElement?.id)).toBe('tc-color-2');
  expect((await roles(page))[2]).toBe('#123456');
  await expect(page.locator('#tc-roles .tc-role').nth(2).locator('.tc-sw')).toHaveAttribute(
    'style',
    'background:#123456',
  );

  // The harder case: a shuffle rewrites all five tiles while one of them holds focus. Clicked
  // programmatically, because a real click would move focus to the button and prove nothing.
  const before = await roles(page);
  await page.evaluate(() => (document.getElementById('tc-randomize') as HTMLButtonElement).click());
  expect(await page.evaluate(() => document.activeElement?.id)).toBe('tc-color-2');
  expect(await roles(page)).not.toEqual(before);
});

test('h: switching keeps the page and drops the toy; reset returns to the default route', async ({ page, sites }) => {
  await page.goto(`${sites.site}/brutalist/fab/`);
  await booted(page);
  await open(page, '.tc-fab .tc-nav-trigger');
  const base = await roles(page);
  await activate(page.locator('#tc-randomize'));
  await expect.poll(() => roles(page)).not.toEqual(base);

  await activate(row(page, 'doodle'));
  await page.waitForURL(`${sites.site}/doodle/fab/`);
  await booted(page);
  // The switch cleared the toy before navigating, so doodle boots on its own base palette.
  expect((await roles(page))[0]).toBe(theme('doodle').colors.text);

  await page.goto(`${sites.site}/marquee/fab/`);
  await booted(page);
  await open(page, '.tc-fab .tc-nav-trigger');
  await activate(page.locator('#tc-reset'));
  await page.waitForURL(`${sites.site}/fab/`);
  await booted(page);
  expect(await page.evaluate(() => document.documentElement.hasAttribute('data-style'))).toBe(false);
});

test('i: the palette survives navigation and reload (Q12)', async ({ page, sites }) => {
  await page.goto(`${sites.site}/brutalist/`);
  await booted(page);
  await open(page, '.static-menu .tc-nav-trigger');
  await openAdvanced(page);
  await activate(page.locator('#tc-schemes [data-s="triadic"]'));
  await activate(page.locator('#tc-roles .tc-role').nth(3).locator('.tc-lk'));

  const base = await roles(page);
  await activate(page.locator('#tc-randomize'));
  await expect.poll(() => roles(page)).not.toEqual(base);
  const shuffled = await roles(page);
  expect(await stored(page)).toEqual({
    style: 'brutalist', // the theme the palette was drawn under, which scopes the record
    colors: shuffled,
    locks: [false, false, false, true, false],
    scheme: 'triadic',
    theme: 'light', // brutalist's polarity, off the active row's data-profile
  });

  await page.goto(`${sites.site}/brutalist/fab/`);
  await booted(page);
  expect(await roles(page)).toEqual(shuffled);

  await page.reload();
  await booted(page);
  expect(await roles(page)).toEqual(shuffled);

  await open(page, '.tc-fab .tc-nav-trigger');
  await openAdvanced(page);
  await expect(page.locator('#tc-schemes [data-s="triadic"]')).toHaveClass('tc-sel');
  await expect(page.locator('#tc-roles .tc-role').nth(3).locator('.tc-lk')).toHaveClass(/tc-on/);
  await expect(page.locator('#tc-roles .tc-role').nth(3).locator('.tc-lk')).toHaveAttribute(
    'aria-label',
    'Unlock Secondary',
  );
});

test('j: idle font loading covers every skin exactly once and nothing else', async ({ page, sites }) => {
  // The skin filter below is inert today, and this is the assertion that says so. It fails the
  // day a structural theme lands, which is when this test has to state what loadAllFonts must
  // NOT pull in (§5.5: an inactive structural theme's own assets).
  expect(THEMES.filter((entry) => entry.kind !== 'skin')).toEqual([]);
  const expected = new Set(THEMES.flatMap((entry) => (entry.kind === 'skin' ? entry.fonts ?? [] : [])));
  expect(expected.size).toBeGreaterThan(0);

  await page.goto(`${sites.site}/brutalist/`);
  await booted(page);
  // requestIdleCallback with {timeout: 2500}, so it has fired by then.
  const links = () =>
    page.locator('link[href^="https://fonts.googleapis.com"]').evaluateAll((els) =>
      els.map((el) => el.getAttribute('href')!));
  await expect.poll(async () => (await links()).length, { timeout: FONTS_MS }).toBe(expected.size);

  const hrefs = await links();
  expect(new Set(hrefs)).toEqual(expected);
  // The active theme's own sheet was already in <head>; loadAllFonts must not re-add it.
  expect(hrefs).toHaveLength(new Set(hrefs).size);
  expect(hrefs).toContain(skinFonts('brutalist')[0]);
});

test('k: the runtime source keeps its constants and has no registry or global left', async ({ sites }) => {
  const source = readFileSync(join(sites.dist, 'js', 'theme-cycler.js'), 'utf8');
  for (const kept of [
    'MEASURE = 940',
    'EDGE = 10',
    'setTimeout(close, 300)',
    '}, 440);', // the hide timer, not just the number 440 anywhere in the file
    'void dock.offsetWidth',
    'timeout: 2500',
    "'dawson-theme-cycler'",
    "'dawson:palette'",
    '(hover: hover) and (pointer: fine)',
    // The session record is scoped to its theme, and only well-formed colours are restored.
    'saved.style === state.style',
    '/^#[0-9a-f]{6}$/i',
  ]) {
    expect(source, `kept: ${kept}`).toContain(kept);
  }
  for (const gone of ['window.__', '__THEME', 'isReload', 'dawson-style', 'innerHTML', '?style=', 'tc-row"']) {
    expect(source, `deleted: ${gone}`).not.toContain(gone);
  }
});

test('k2: a palette saved under another theme is ignored', async ({ page, sites }) => {
  const other = ['#112233', '#445566', '#778899', '#aabbcc', '#ddeeff'];
  const record = {
    style: 'brutalist',
    colors: other,
    locks: [false, false, false, false, false],
    scheme: 'random',
    theme: 'light',
  };

  // A record drawn under brutalist, met by a default-theme page. The theme is in the URL, so
  // this is an ordinary navigation (Back after a switch, a typed themed URL, the 404's
  // default-theme links), not an exotic one.
  await page.goto(`${sites.site}/brutalist/fab/`);
  await booted(page);
  await seed(page, record);
  await page.goto(`${sites.site}/fab/`);
  await booted(page);

  expect(await roles(page)).toEqual(baseColors('default'));
  // Not diverged, and the default theme ships none of the six, so <html style> carries none.
  expect(Object.values(await derived(page)).filter(Boolean)).toEqual([]);
  // Ignored, never removed: boot() simply persisted this page's own palette over it.
  expect((await stored(page)).style).toBe('default');
  expect((await stored(page)).colors).toEqual(baseColors('default'));

  // Same rule for a record this runtime cannot trust: no style at all, or a colour that is not
  // #rrggbb. Both leave brutalist on its own base palette.
  const { style: _style, ...styleless } = record;
  for (const broken of [styleless, { ...record, colors: ['red', ...other.slice(1)] }]) {
    await seed(page, broken);
    await page.goto(`${sites.site}/brutalist/fab/`);
    await booted(page);
    expect(await roles(page), JSON.stringify(broken.colors)).toEqual(baseColors('brutalist'));
  }
});

test('l: the built HTML carries the trigger contract, one dock, and the per-row data', async ({ sites }) => {
  const read = (...rel: string[]) => readFileSync(join(sites.dist, ...rel), 'utf8');
  const trigger = 'aria-haspopup="true" aria-expanded="false" aria-controls="tc-dock"';

  const home = read('index.html');
  expect(home).toContain(`<li class="tc-nav-item"><button type="button" class="menu-item tc-nav-trigger" aria-label="Theme" ${trigger}>`);
  expect(home).toContain(`<li class="tc-nav-item tc-mobile"><button type="button" class="socials-item tc-nav-trigger" aria-label="Theme" ${trigger}>`);

  const fab = read('fab', 'index.html');
  expect(fab).toContain(`<div class="tc-nav-item tc-fab" data-corner="br"><button type="button" class="tc-nav-trigger tc-fab-btn" aria-label="Theme" ${trigger}>`);

  for (const [name, html] of [['home', home], ['fab', fab]] as const) {
    expect(html.match(/id="tc-dock"/g), name).toHaveLength(1);
    expect(html.match(/id="tc-scrim"/g), name).toHaveLength(1);
    // One profile per row, not one per page: the 404 (D27) moves the marker and nothing else.
    expect(html.match(/data-profile=/g), name).toHaveLength(THEME_IDS.length);
  }

  // Row data: the default theme has neither a heading font nor fonts to preload.
  const homeRows = rowTags(home);
  expect([...homeRows.keys()]).toEqual(THEME_IDS);
  expect(homeRows.get('default')!.li).not.toContain('--tc-row-heading');
  expect(homeRows.get('default')!.a).not.toContain('data-fonts');

  // Every row's profile parses, and to that row's own theme's polarity.
  for (const [id, tag] of homeRows) {
    expect(profileOf(tag.li).polarity, id).toBe(theme(id).polarity);
  }
  // The active row included: on the home page that is the default theme, whose profile is a
  // polarity and nothing else, because it has no random profile.
  expect(decode(/data-profile="([^"]*)"/.exec(homeRows.get('default')!.li)![1])).toBe('{"polarity":"dark"}');
  // And exactly the three registry entries with a random profile carry one.
  expect([...homeRows].filter(([, tag]) => decode(tag.li).includes('"random"')).map(([id]) => id)).toEqual([
    'brutalist', 'marquee', 'studio',
  ]);

  const brutalistRows = rowTags(read('brutalist', 'index.html'));
  const brutalist = theme('brutalist').colors;
  expect(decode(/style="([^"]*)"/.exec(brutalistRows.get('brutalist')!.li)![1])).toBe(
    `--tc-row-text:${brutalist.text};--tc-row-bg:${brutalist.bg};--tc-row-primary:${brutalist.primary};`
      + `--tc-row-secondary:${brutalist.secondary};--tc-row-accent:${brutalist.accent};`
      + `--tc-row-heading:'Archivo Black', sans-serif;`,
  );
  // The active row on a themed page: brutalist's own polarity, off its own row.
  expect(profileOf(brutalistRows.get('brutalist')!.li).polarity).toBe(theme('brutalist').polarity);

  const marquee = rowTags(read('marquee', 'index.html')).get('marquee')!.li;
  expect(decode(marquee)).toContain('"polarity":"light"');
  expect(decode(marquee)).toContain('"random"');

  // Lock labels are composed prose, not runtime strings.
  for (const [i, role] of ['Text', 'Background', 'Primary', 'Secondary', 'Accent'].entries()) {
    expect(home).toContain(`<button type="button" class="tc-lk " data-i="${i}" aria-label="Lock ${role}">`);
  }

  // Every themed route exists, and each one's rows point at that route's own page.
  for (const { theme: id } of themeParams()) {
    const html = read(...(id ? [id, 'fab', 'index.html'] : ['fab', 'index.html']));
    expect([...rowTags(html).values()].map((tag) => /href="([^"]*)"/.exec(tag.a)![1])).toEqual(
      THEME_IDS.map((rowId) => href('/fab/', rowId)),
    );
  }
});
