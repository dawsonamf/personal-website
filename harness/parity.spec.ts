/**
 * Spec 1 §9 checks 1-5 plus the settled screenshot, over the 16 × 8 URL matrix in two viewport
 * projects, and the three fixture capture/integrity tests. Old-vs-old today; S1-13 points 8782 at
 * `dist` and turns on the old-new normaliser. S1-03 adds the interaction states.
 * Entry point: `npm run test:parity`.
 */
import { expect, test } from '@playwright/test';
import type { Browser, BrowserContext, Page, TestInfo } from '@playwright/test';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { BASELINE_SHA, content, masthead, oldPath, themeOrder } from './baseline.ts';
import { normalizeHtml } from './normalize.ts';
import { disallowedScripts } from './scripts.ts';
import { sentinels } from './sentinels.ts';
import { settle } from './settle.ts';
import { NEW_ORIGIN, OLD_ORIGIN, parityMode, urlPairs } from './urls.ts';
import type { PageType } from './urls.ts';

const pairs = urlPairs();
{
  // Collection-time matrix-shape guard: a wrong matrix must stop the run, not report 0 failures.
  const themes = new Set(pairs.map((p) => p.theme));
  const ids = new Set(pairs.map((p) => `${p.theme}/${p.pageId}`));
  const perTheme = new Set([...themes].map((t) => pairs.filter((p) => p.theme === t).length));
  if (pairs.length !== 128 || themes.size !== 16 || ids.size !== 128 || perTheme.size !== 1 || !perTheme.has(8)) {
    throw new Error(
      `parity matrix shape: ${pairs.length} pairs / ${themes.size} themes / ${ids.size} unique ids / ` +
        `per-theme ${[...perTheme].join(',')}; expected 128 / 16 / 128 / 8`,
    );
  }
}

/**
 * §9's abort list: non-deterministic third-party APIs and the LexChat iframe host. The thirteen
 * library CDNs and Google Fonts are deliberately absent: the old side needs them, and an outage
 * is a harness failure, not a regression.
 */
const ABORT_HOSTS = new Set([
  'assets.calendly.com',
  'corsproxy.io',
  'collectionapi.metmuseum.org',
  'openaccess-api.clevelandart.org',
  'api.vam.ac.uk',
  'www.getty.edu',
  'framemark.vam.ac.uk',
  'media.getty.edu',
  'www.metmuseum.org',
  'raw.githubusercontent.com',
  'dawsonamf-lexchat.hf.space',
]);

const ROLE_TOKENS = ['--text', '--bg', '--primary', '--secondary', '--accent'];
const SENTINEL_PROPS = ['color', 'background-color', 'font-family', 'font-size', 'line-height', 'border-radius'];
const RAMP_STEPS = [5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85, 90, 95];
const RAMP_PROPS = ROLE_TOKENS.flatMap((role) => [role, ...RAMP_STEPS.map((a) => `${role}${a}`)]);

const DUMP_ROOT = resolve(import.meta.dirname, '__parity__/dumps');
/** Must stay `snapshotPathTemplate` in playwright.config.ts; the test below asserts they agree. */
const SNAPSHOT_ROOT = resolve(import.meta.dirname, '__parity__/snapshots');
const FIXTURE_DIR = resolve(import.meta.dirname, 'fixtures/baseline');
/** The three attributes the bootstrap sets on `<html>` (`theme-bootstrap.js:704-706`). */
const BOOTSTRAP_ATTRS = ['data-style', 'data-still', 'data-no-tilt'];

/**
 * The one context option object both sides get. Manual `browser.newContext()` does not inherit
 * `use`, so it is built explicitly from the project and reused verbatim.
 */
function contextOptions(testInfo: TestInfo) {
  const use = testInfo.project.use;
  return {
    viewport: use.viewport,
    deviceScaleFactor: use.deviceScaleFactor,
    isMobile: use.isMobile,
    hasTouch: use.hasTouch,
    colorScheme: use.colorScheme,
    reducedMotion: use.contextOptions?.reducedMotion,
  };
}

/**
 * 1.61.1 accepts path segments alongside `kind` (`snapshotPath` in workerProcessEntry.js) but its
 * .d.ts overloads do not. A single joined string is *not* equivalent: `sanitizeForFilePath` turns
 * `/` into `-`, so the reference would land somewhere `toHaveScreenshot` never reads.
 */
type SnapshotPathWithKind = (...args: Array<string | { kind: 'screenshot' }>) => string;

async function abortApis(context: BrowserContext): Promise<void> {
  await context.route(
    (url) => ABORT_HOSTS.has(url.hostname),
    (route) => route.abort(),
  );
}

/** A fresh context per side, with §9's pointer guard asserted on every context that is compared. */
async function openSide(browser: Browser, testInfo: TestInfo): Promise<{ context: BrowserContext; page: Page }> {
  const opts = contextOptions(testInfo);
  const context = await browser.newContext(opts);
  await abortApis(context);
  const page = await context.newPage();
  // A failing guard here would otherwise leak the context: it runs before the caller's finally.
  try {
    expect(page.viewportSize(), 'context viewport equals the project viewport').toEqual(opts.viewport);
    const canHover = await page.evaluate(() => matchMedia('(hover: hover) and (pointer: fine)').matches);
    expect(canHover, `(hover: hover) and (pointer: fine) in ${testInfo.project.name}`).toBe(
      testInfo.project.name === 'desktop-1440',
    );
  } catch (e) {
    await context.close();
    throw e;
  }
  return { context, page };
}

interface NetworkInventory {
  responses: Array<{ url: string; status: number; resourceType: string }>;
  failed: Array<{ url: string; errorText: string }>;
}

interface SideCapture {
  responseBody: string;
  html: string;
  sample: Record<string, string>;
  counts: Record<string, number>;
  scripts: string[];
  masthead: string | null;
  network: NetworkInventory;
  png: Buffer;
}

async function captureSide(page: Page, url: string, pageType: PageType): Promise<SideCapture> {
  const spec = sentinels[pageType];
  const network: NetworkInventory = { responses: [], failed: [] };
  page.on('response', (r) => network.responses.push({ url: r.url(), status: r.status(), resourceType: r.request().resourceType() }));
  page.on('requestfailed', (r) => network.failed.push({ url: r.url(), errorText: r.failure()?.errorText ?? 'unknown' }));

  const response = await page.goto(url, { waitUntil: 'load' });
  const responseBody = response ? await response.text() : '';
  await settle(page, pageType);

  const html = await page.evaluate(() => document.documentElement.outerHTML);
  const { sample, counts } = await page.evaluate(
    ({ selectors, roles, props }) => {
      const root = document.documentElement;
      const computed = getComputedStyle(root);
      const sample: Record<string, string> = {};
      const counts: Record<string, number> = {};
      // §9 check 3 is "every `--*` token on <html>", not just the inline ones: skin sheets declare
      // tokens in CSS (styles.css `:root`, banknote.css `[data-style="banknote"]`), and Chromium
      // enumerates those in computed style. Union with the inline declarations and the five roles.
      const names = new Set([
        ...[...computed].filter((n) => n.startsWith('--')),
        ...root.style,
        ...roles,
      ]);
      for (const name of names) {
        sample[`html ${name}`] = computed.getPropertyValue(name).trim();
      }
      for (const selector of selectors) {
        const matches = document.querySelectorAll(selector);
        counts[selector] = matches.length;
        if (matches.length !== 1) continue;
        const style = getComputedStyle(matches[0]!);
        for (const prop of props) sample[`${selector} ${prop}`] = style.getPropertyValue(prop).trim();
      }
      return { sample, counts };
    },
    { selectors: spec.selectors, roles: ROLE_TOKENS, props: SENTINEL_PROPS },
  );
  const scripts = await page.evaluate(() =>
    [...document.scripts]
      .filter((s) => s.src)
      .map((s) => {
        const resolved = new URL(s.getAttribute('src') ?? '', document.baseURI);
        return resolved.origin === location.origin ? resolved.pathname : resolved.href;
      }),
  );
  const mastheadText = spec.masthead ? await page.locator(spec.masthead).textContent() : null;
  const png = await page.screenshot({
    animations: 'disabled',
    caret: 'hide',
    scale: 'css',
    fullPage: spec.fullPage,
    mask: spec.mask.map((s) => page.locator(s)),
  });

  return { responseBody, html, sample, counts, scripts, masthead: mastheadText, network, png };
}

function writeDumps(dir: string, side: 'old' | 'new', capture: SideCapture, lines: string[]): Record<string, string> {
  mkdirSync(dir, { recursive: true });
  const files: Record<string, string> = {
    [`${side}.response.html`]: capture.responseBody,
    [`${side}.dom.txt`]: lines.join('\n'),
    [`${side}.styles.json`]: JSON.stringify({ sample: capture.sample, counts: capture.counts }, null, 2),
    [`${side}.network.json`]: JSON.stringify(capture.network, null, 2),
    [`${side}.scripts.json`]: JSON.stringify(capture.scripts, null, 2),
  };
  const paths: Record<string, string> = {};
  for (const [name, body] of Object.entries(files)) {
    const path = resolve(dir, name);
    writeFileSync(path, body);
    paths[name] = path;
  }
  writeFileSync(resolve(dir, `${side}.png`), capture.png);
  return paths;
}

const badResponses = (network: NetworkInventory): Array<[number, string]> =>
  network.responses.filter((r) => r.status >= 400).map((r) => [r.status, r.url] as [number, string]);

/** A CDN or font host that never connected fails here, not silently as a missing response. */
const badFailures = (network: NetworkInventory): NetworkInventory['failed'] =>
  network.failed.filter((f) => !ABORT_HOSTS.has(new URL(f.url).hostname));

for (const pair of pairs) {
  const title = `@theme:${pair.theme} @page:${pair.page}${pair.postId ? ` @post:${pair.postId}` : ''} @state:settled`;
  test(title, async ({ browser }, testInfo) => {
    const spec = sentinels[pair.page];
    const mode = parityMode();
    const dumpDir = resolve(DUMP_ROOT, testInfo.project.name, pair.theme, pair.pageId, 'settled');

    const old = await openSide(browser, testInfo);
    let oldCapture: SideCapture;
    try {
      oldCapture = await captureSide(old.page, OLD_ORIGIN + pair.oldPath, pair.page);
    } finally {
      await old.context.close();
    }
    const oldNorm = normalizeHtml(oldCapture.html, { mode, side: 'old' });
    const oldPaths = writeDumps(dumpDir, 'old', oldCapture, oldNorm.lines);

    const next = await openSide(browser, testInfo);
    try {
      const newCapture = await captureSide(next.page, NEW_ORIGIN + pair.newPath, pair.page);
      const newNorm = normalizeHtml(newCapture.html, { mode, side: 'new' });
      const newPaths = writeDumps(dumpDir, 'new', newCapture, newNorm.lines);
      const oldLines = oldNorm.lines;
      const newLines = newNorm.lines;

      // Normaliser step 3: the Astro guard counts are reported, never asserted (the canonical
      // family should emit none, and old-old emits none on either side by construction).
      testInfo.annotations.push({
        type: 'astro-guards',
        description: `old ${JSON.stringify(oldNorm.guards)} new ${JSON.stringify(newNorm.guards)}`,
      });

      // 4. no 4xx/5xx and no connection failure on either side (the aborted API hosts are
      //    inventory, not failures)
      expect.soft(badResponses(oldCapture.network), 'old side 4xx/5xx').toEqual([]);
      expect.soft(badResponses(newCapture.network), 'new side 4xx/5xx').toEqual([]);
      expect.soft(badFailures(oldCapture.network), 'old side request failures').toEqual([]);
      expect.soft(badFailures(newCapture.network), 'new side request failures').toEqual([]);

      // 5. no <script src> outside the page type's allow-list
      expect.soft(disallowedScripts(pair.page, oldCapture.scripts), 'old side script allow-list').toEqual([]);
      expect.soft(disallowedScripts(pair.page, newCapture.scripts), 'new side script allow-list').toEqual([]);

      // every sentinel resolves to exactly one element on both sides
      const oneEach = Object.fromEntries(spec.selectors.map((s) => [s, 1]));
      expect.soft(oldCapture.counts, 'old side sentinel match counts').toEqual(oneEach);
      expect.soft(newCapture.counts, 'new side sentinel match counts').toEqual(oneEach);

      // 1. normalised DOM
      if (newLines.join('\n') !== oldLines.join('\n')) {
        await testInfo.attach('old.dom.txt', { path: oldPaths['old.dom.txt']!, contentType: 'text/plain' });
        await testInfo.attach('new.dom.txt', { path: newPaths['new.dom.txt']!, contentType: 'text/plain' });
      }
      expect.soft(newLines, 'normalised DOM').toEqual(oldLines);

      // 3. computed-style sample
      expect.soft(newCapture.sample, 'computed-style sample').toEqual(oldCapture.sample);

      // the masked masthead, asserted as text instead
      if (spec.masthead) expect.soft(newCapture.masthead, 'masthead text').toEqual(oldCapture.masthead);

      // 2. screenshot. OLD writes the reference every run; NEW is only ever compared against it.
      const snapshotPath = testInfo.snapshotPath.bind(testInfo) as unknown as SnapshotPathWithKind;
      const referencePath = snapshotPath(pair.theme, pair.pageId, 'settled.png', { kind: 'screenshot' });
      // A reference written anywhere else would be regenerated from NEW on the next run, which is
      // exactly what "NEW never generates the accepted old baseline" forbids.
      expect(referencePath, 'screenshot reference path').toBe(
        resolve(SNAPSHOT_ROOT, testInfo.project.name, pair.theme, pair.pageId, 'settled.png'),
      );
      mkdirSync(dirname(referencePath), { recursive: true });
      writeFileSync(referencePath, oldCapture.png);
      await expect(next.page).toHaveScreenshot([pair.theme, pair.pageId, 'settled.png'], {
        fullPage: spec.fullPage,
        mask: spec.mask.map((s) => next.page.locator(s)),
      });
    } finally {
      await next.context.close();
    }
  });
}

// ---- Fixture capture and integrity (the `capture` project only) -------------------------------

/** Write the fixture when asked; otherwise return its committed text. A missing one is a failure. */
function fixtureText(rel: string, text: string, testInfo: TestInfo): string | null {
  const path = resolve(FIXTURE_DIR, rel);
  if (process.env.PARITY_UPDATE_FIXTURES !== '1') {
    if (!existsSync(path)) throw new Error(`${rel}: fixture missing, rerun with PARITY_UPDATE_FIXTURES=1`);
    return readFileSync(path, 'utf8');
  }
  mkdirSync(FIXTURE_DIR, { recursive: true });
  writeFileSync(path, text);
  testInfo.annotations.push({ type: 'fixture', description: `${rel} written (${Buffer.byteLength(text)} bytes)` });
  console.log(`[capture] ${rel} written (${Buffer.byteLength(text)} bytes)`);
  return null;
}

interface ThemeHtmlEntry {
  attrs: Record<string, string>;
  style: Array<[string, string]>;
  links: string[];
}

test('@capture:theme-html', async ({ browser }, testInfo) => {
  const order = themeOrder();
  const viewport = testInfo.project.use.viewport ?? null;
  const themes: Record<string, ThemeHtmlEntry> = {};

  for (const id of order) {
    // Fresh context per theme: the bootstrap seeds sessionStorage, so a reused one leaks.
    const context = await browser.newContext(contextOptions(testInfo));
    await abortApis(context);
    // Privacy, not home: it loads exactly two scripts, the blocking bootstrap (which has already
    // run) and the deferred cycler. The cycler is what rewrites the palette after
    // DOMContentLoaded, so aborting it is what makes this a pre-cycler capture, and nothing else
    // on the page touches documentElement. Home would also need featured-carousel.js aborted
    // (:413-414 writes --ticker-run/--ticker-dur, D35 page composition, not themeHtml's
    // projection) and would then depend on script.js failing at the right moment.
    await context.route('**/js/theme-cycler.js', (route) => route.abort());
    const page = await context.newPage();
    let tokens: string[];
    try {
      await page.goto(OLD_ORIGIN + oldPath('privacy', id), { waitUntil: 'load' });
      const shot = await page.evaluate((themeId) => {
        const root = document.documentElement;
        const registry = (
          window as unknown as { __THEME_REGISTRY?: Record<string, { tokens?: Record<string, string> }> }
        ).__THEME_REGISTRY;
        return {
          // data-* only: `lang` is authored markup and `style` is just the serialized form of the
          // declarations recorded below.
          attrs: Object.fromEntries(
            [...root.attributes].filter((a) => a.name.startsWith('data-')).map((a) => [a.name, a.value]),
          ),
          // Raw specified values in authored order: 5 base roles as hex, 95 steps as hsla().
          style: [...root.style].map((prop) => [prop, root.style.getPropertyValue(prop)] as [string, string]),
          links: [...document.querySelectorAll('head link[data-style-asset]')].map((l) => l.getAttribute('href') ?? ''),
          // The registry the bootstrap exposes at theme-bootstrap.js:639, so the capture checks
          // itself against the source it was projected from.
          tokens: Object.keys(registry?.[themeId]?.tokens ?? {}),
        };
      }, id);
      tokens = shot.tokens;
      themes[id] = { attrs: shot.attrs, style: shot.style, links: shot.links };
    } finally {
      await context.close();
    }

    const entry = themes[id]!;
    const props = new Map(entry.style);
    expect(RAMP_PROPS.filter((p) => !props.has(p)), `${id}: missing ramp properties`).toEqual([]);
    for (const role of ROLE_TOKENS) expect(props.get(role), `${id} ${role}`).toMatch(/^#[0-9a-f]{6}$/i);
    for (const step of RAMP_PROPS.filter((p) => !ROLE_TOKENS.includes(p))) {
      expect(props.get(step), `${id} ${step}`).toMatch(/^hsla\(/);
    }
    // §5.4: the declarations that are not ramp are the registry's tokens, in registry order.
    expect(
      entry.style.map(([p]) => p).filter((p) => !RAMP_PROPS.includes(p)),
      `${id}: token declarations`,
    ).toEqual(tokens);
    // Only the three attributes the bootstrap sets. D32's data-typing/data-typing-delete are new
    // carriers (§15.10) and cannot exist in the old capture; this is what says so.
    expect(
      Object.keys(entry.attrs).filter((n) => !BOOTSTRAP_ATTRS.includes(n)),
      `${id}: unexpected <html> attributes`,
    ).toEqual([]);

    if (id === 'default') {
      expect(entry.style.length, 'default declaration count (5 roles + 95 steps)').toBe(100);
      expect(entry.attrs, 'default <html> attributes').toEqual({});
      expect(entry.links, 'default style assets').toEqual([]);
    } else {
      expect(entry.attrs['data-style'], `${id} data-style`).toBe(id);
      expect(entry.links.at(-2), `${id} penultimate style asset`).toBe('/css/themes/theme-base.css');
      expect(entry.links.at(-1), `${id} skin sheet`).toMatch(/^\/css\/themes\/(?!theme-base\.css$)[\w-]+\.css$/);
    }
  }

  const live = {
    baselineSha: BASELINE_SHA,
    method:
      'Each theme loaded over the served baseline privacy page (which loads only the blocking ' +
      'bootstrap and the cycler) with /js/theme-cycler.js aborted, then the bootstrap-applied ' +
      'data-* attributes, inline declarations and data-style-asset links read verbatim. The ' +
      'declaration names that are not ramp are checked against the registry entry\'s tokens.',
    capturedFrom: {
      origin: OLD_ORIGIN,
      path: "'/privacy/?style=<id>' (default: '/privacy/')",
      abortedScripts: ['/js/theme-cycler.js'],
      viewport,
    },
    themes,
  };
  const text = JSON.stringify(live, null, 2) + '\n';
  const committed = fixtureText('theme-html.json', text, testInfo);
  if (committed !== null) expect(live).toEqual(JSON.parse(committed));
});

test('@capture:content', async ({}, testInfo) => {
  const text = JSON.stringify(content(), null, 2) + '\n';
  const committed = fixtureText('content.json', text, testInfo);
  if (committed !== null) expect(text).toBe(committed);
});

test('@capture:masthead', async ({}, testInfo) => {
  const text = JSON.stringify(masthead(), null, 2) + '\n';
  const committed = fixtureText('masthead.json', text, testInfo);
  if (committed !== null) expect(text).toBe(committed);
});
