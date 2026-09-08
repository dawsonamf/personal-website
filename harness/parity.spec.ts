/**
 * Spec 1 §9 checks 1-5 plus a screenshot, over the 16 × 5 retained parity matrix × its states in
 * two viewport projects, and the three fixture capture/integrity tests. Old-vs-old today; S1-13
 * points 8782 at `dist` and turns on the old-new normaliser.
 * Entry point: `npm run test:parity`.
 */
import { expect, test } from '@playwright/test';
import type { Browser, BrowserContext, Page, TestInfo } from '@playwright/test';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { BASELINE_SHA, content, masthead, oldPath, themeOrder } from './baseline.ts';
import {
  canonicalizeCursorFollower,
  canonicalizeGeneratedIds,
  installDeterminism,
  randomDraws,
  randomSeedState,
  recordMastheadHistory,
  seedForPage,
  STATIC_PAGE_SEED,
} from './determinism.ts';
import type { RouteSeedPlan } from './determinism.ts';
import { INTERACTIONS, refreshAos, statesFor } from './interactions.ts';
import type { Interaction, InteractionContext, ProjectName, StateName } from './interactions.ts';
import { paletteEvidenceForComparison } from './palette.ts';
import { exceptionRectangles, postHeadIssues, screenshotWithExceptionRectangles, styleSampleForComparison } from './exceptions.ts';
import { normalizeHtml } from './normalize.ts';
import { rawScriptSources, recordScriptRequests, scriptOrderIssues } from './scripts.ts';
import { ROLE_TOKENS, sentinels, SETTLE_TIMEOUT_MS } from './sentinels.ts';
import { afterInteraction, settle } from './settle.ts';
import { loadMigratedAdapter, NEW_ORIGIN, OLD_ORIGIN, parityMode, urlPairs } from './urls.ts';
import type { PageType, UrlPair } from './urls.ts';

const MODE = parityMode();
const migrated = await loadMigratedAdapter(MODE);
const pairs = await urlPairs(migrated);
const matrix = pairs.flatMap((pair) => statesFor(pair).map((state) => ({ pair, state })));

/**
 * The applicability table of §9's "states apply where the element exists", restated as counts so a
 * registry edit that quietly drops a state fails collection instead of reporting a smaller green
 * run. 16 themes × the pages that carry each state's element.
 */
const EXPECTED_STATE_COUNTS: Record<StateName, number> = {
  settled: 80, // every retained pair
  'masthead-0': 16, // home, mobile only
  'jobs-tab-2': 16, // home
  'carousel-dot-3': 32, // home + listing
  'carousel-wheel': 32, // home + listing
  'sticky-nav': 80, // home + listing + 3 posts
  'smooth-scroll-contact': 16, // home, desktop only
  'picker-open': 80, // home + listing + 3 posts
  'filter-swift': 16, // listing
  palette: 80, // home + listing + 3 posts
};

{
  // Collection-time matrix-shape guard: a wrong matrix must stop the run, not report 0 failures.
  const themes = new Set(pairs.map((p) => p.theme));
  const ids = new Set(pairs.map((p) => `${p.theme}/${p.pageId}`));
  const perTheme = new Set([...themes].map((t) => pairs.filter((p) => p.theme === t).length));
  if (pairs.length !== 80 || themes.size !== 16 || ids.size !== 80 || perTheme.size !== 1 || !perTheme.has(5)) {
    throw new Error(
      `parity matrix shape: ${pairs.length} pairs / ${themes.size} themes / ${ids.size} unique ids / ` +
        `per-theme ${[...perTheme].join(',')}; expected 80 / 16 / 80 / 5`,
    );
  }
  const counts = Object.fromEntries(Object.keys(EXPECTED_STATE_COUNTS).map((n) => [n, 0])) as Record<
    StateName,
    number
  >;
  for (const { state } of matrix) counts[state.name] += 1;
  const wrong = Object.entries(EXPECTED_STATE_COUNTS).filter(([n, want]) => counts[n as StateName] !== want);
  const total = Object.values(EXPECTED_STATE_COUNTS).reduce((a, b) => a + b, 0);
  if (wrong.length || matrix.length !== total) {
    throw new Error(
      `parity state matrix: ${matrix.length} declared, expected ${total}` +
        (wrong.length ?
          `; ${wrong.map(([n, want]) => `${n} ${counts[n as StateName]} (expected ${want})`).join(', ')}`
        : ''),
    );
  }
}

/**
 * §9's abort list: non-deterministic third-party APIs. The retained entries
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
]);

const SENTINEL_PROPS = ['color', 'background-color', 'font-family', 'font-size', 'line-height', 'border-radius'];
const RAMP_STEPS = [5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85, 90, 95];
const RAMP_PROPS: string[] = ROLE_TOKENS.flatMap((role) => [role, ...RAMP_STEPS.map((a) => `${role}${a}`)]);

const PARITY_ROOT = resolve(process.env.PARITY_OUT_DIR ?? resolve(import.meta.dirname, '__parity__'));
const DUMP_ROOT = resolve(PARITY_ROOT, 'dumps');
/** Must stay `snapshotPathTemplate` in playwright.config.ts; the test below asserts they agree. */
const SNAPSHOT_ROOT = resolve(PARITY_ROOT, 'snapshots');
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

/**
 * An ordering fence, not a wait for content. A post page's body arrives through
 * `blog/blog-post.js:145` `fetch('posts/<id>.md')`, and everything downstream of it appends to a
 * document the theme cycler is also appending to: the per-post stylesheet goes to `<head>` (`:133`)
 * where `loadAllFonts` is adding fourteen font links, and mermaid's `div.mermaidTooltip` goes to
 * `<body>` (`:172`) where the cycler has already put `#tc-dock` and `#tc-scrim`. Which append lands
 * first is a plain race between two async chains, and both orders were observed across the matrix
 * — a difference in DOM *position*, which no readiness predicate can settle after the fact.
 *
 * Holding the markdown until the cycler is certainly finished puts the post's nodes last, always,
 * on both sides. Nothing is excluded from the comparison: the order is pinned, not normalised.
 *
 * The hold is a **condition**, not a stopwatch: the response waits on the requesting page for
 * `readyState === 'complete'` and then for one `requestIdleCallback(…, {timeout: 2600})` queued
 * *after* `load`. That is the same fence `settle()` step 2a relies on — the cycler queues
 * `loadAllFonts` with `requestIdleCallback({timeout: 2500})` at `theme-cycler.js:761-762`, before
 * `load`, so an idle callback queued after `load` can only run behind it. A `fetch()` is not a
 * document sub-resource, so it cannot itself hold `load` back and the fence cannot deadlock.
 */
/**
 * The mirror-image ordering fence, for the other end of `<head>`.
 *
 * `js/theme-bootstrap.js:715-720` appends the skin's two sheets — `theme-base.css` and the
 * `[data-style="…"]` sheet — with `document.createElement('link')`. A script-created `<link>` is
 * not a *script-blocking style sheet* (only a parser-created one is), so those two sheets race
 * every script below them, including the parser-blocking
 * `cdnjs…/vanilla-tilt/1.7.0/vanilla-tilt.min.js` at `blog/index.html:30` / `index.html:34` and
 * everything the parser reaches after it. Both orders happen: a same-origin sheet off a saturated
 * single-threaded `http.server` against a cross-origin CDN script on a warm connection is a
 * genuine coin flip, and the two sides flip independently.
 *
 * VanillaTilt freezes a layout measurement at construction and can never revise it. 1.7.0's
 * `prepareGlare()` writes `.js-tilt-glare-inner`'s `width`/`height` as `${2 * offsetWidth}px`, and
 * the only other writer — `updateGlareSize()`, the `resize` handler — emits the same number
 * **with no unit**, which the CSSOM rejects; so the constructor's number is the one that stays in
 * the DOM for the life of the page, and no wait, event or quiesce can move it afterwards. Whether
 * the skin sheet had applied when `featured-carousel.js:193` ran therefore decides it for good,
 * and most skins change `.fc-card-image`'s border box: `wheatpaste.css:544` puts a `4px` border on
 * the `content-box` 510px image of `featured-carousel.css:270`, so the glare is `1020px` if the
 * sheet lost and `1036px` if it won. Measured on `wheatpaste/blog @desktop-1440`: three of seven
 * states captured `1036px` against `1020px` with identical state evidence, and the four that
 * agreed — `settled` included — agreed only because both sides happened to lose together.
 *
 * Only three of the sixteen matrix themes construct a tilt at all; the other thirteen set
 * `flags: { tilt: false }` in the registry, so no glare element exists to size. Of those three,
 * `default` appends no skin sheet and so has nothing to race, `miami-deco.css:445` neutralises the
 * race with `box-sizing: border-box` (510px either way), and `wheatpaste` is the one left exposed.
 * The fence is still written as a choke point rather than a wheatpaste special case: it is what
 * keeps any skin that turns tilt back on from reopening this, and it covers `blog-post.js:188`'s
 * `glare: true` on `.blog-image`, which today is safe only incidentally because the markdown fence
 * already holds that construction until well after `load`.
 *
 * Holding the tilt library until the skin sheets have applied pins the winner. One fence covers
 * every case because it is a choke point rather than a list: nothing on the site can construct a
 * tilt before `VanillaTilt` exists, so the home carousel, the listing carousel and all sixteen
 * skins are settled by the same hold. It also pins the side a real visitor lands on — a
 * same-origin sheet requested from a blocking `<head>` script beats a cross-origin CDN script that
 * still owes DNS, TCP and TLS — which is the side the migrated build is always on, since Astro
 * emits the skin sheet as a parser-inserted `<link>` that blocks scripts outright.
 *
 * The hold is a **condition**, not a stopwatch: every same-origin `link[data-style-asset]` has a
 * non-null `.sheet`, which is exactly "loaded, parsed and applied to layout". `__ACTIVE_STYLE`
 * (`theme-bootstrap.js:700`, set for *every* style, `default` included) is what says the bootstrap
 * has run at all, so a request the preload scanner issued ahead of it cannot read the not-yet-
 * appended set as "nothing to wait for". `default` appends no sheets and is released on the first
 * tick. The 5 s bound is the bail-out for a sheet that 404s, never the mechanism — that sheet
 * fails `badResponses` moments later with its URL. Cross-origin sheets (the skin's Google Fonts
 * entries) are left out: `.sheet` is readable for them, but they are `settle()` step 2b's job and
 * an outage there must not turn into a five-second hold on every request.
 */
async function fenceStyleAssets(context: BrowserContext): Promise<void> {
  await context.route('**/vanilla-tilt*.js', async (route) => {
    await route
      .request()
      .frame()
      .page()
      .evaluate(
        () =>
          new Promise<void>((resolve) => {
            const started = Date.now();
            const pending = (): boolean => {
              // The bootstrap has not run yet, so the sheets it appends are not in the DOM to look
              // for. Not "nothing to wait for" — the opposite.
              if (!('__ACTIVE_STYLE' in window)) return true;
              return [...document.querySelectorAll<HTMLLinkElement>('link[data-style-asset]')]
                .filter((l) => new URL(l.href, location.href).origin === location.origin)
                .some((l) => !l.sheet);
            };
            const tick = (): void => {
              if (!pending() || Date.now() - started > 5000) resolve();
              else setTimeout(tick, 10);
            };
            tick();
          }),
      )
      // Same as the markdown fence: the page went away under us, so there is no order left to pin.
      .catch(() => {});
    await route.continue();
  });
}

async function fencePostMarkdown(context: BrowserContext): Promise<void> {
  await context.route('**/blog/posts/*.md', async (route) => {
    await route
      .request()
      .frame()
      .page()
      .evaluate(
        () =>
          new Promise<void>((resolve) => {
            const idle = (): void => {
              if ('requestIdleCallback' in window) requestIdleCallback(() => resolve(), { timeout: 2600 });
              else setTimeout(resolve, 2600);
            };
            if (document.readyState === 'complete') idle();
            else window.addEventListener('load', idle, { once: true });
          }),
      )
      // The page navigated away or closed under us (`@state:palette` moves off the post it
      // captured); there is no longer an append order to pin, so let the response through.
      .catch(() => {});
    await route.continue();
  });
}

/** A fresh context per side, with §9's pointer guard asserted on every context that is compared. */
async function openSide(browser: Browser, testInfo: TestInfo): Promise<{ context: BrowserContext; page: Page }> {
  const opts = contextOptions(testInfo);
  const context = await browser.newContext(opts);
  // Playwright runs the most recently registered route first, so the abort list is registered last
  // and wins: an aborted host can never be fenced and then fetched. (No pattern overlaps today —
  // the abort list is APIs, the fences are a same-origin markdown path and
  // the tilt library's CDN file — and this ordering is what keeps that true when either grows.)
  await fencePostMarkdown(context);
  await fenceStyleAssets(context);
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
  /** §9's seeded `Math.random` and the draw count it served, dumped as the pick's evidence. */
  determinism: {
    seed: number;
    effectiveSeed: number;
    removedLibraryDraws: 0 | 1;
    location: string;
    draws: number;
  };
  sample: Record<string, string>;
  counts: Record<string, number>;
  rawScripts: string[];
  resourceScripts: string[];
  masthead: string | null;
  network: NetworkInventory;
  png: Buffer;
}

/**
 * One side, loaded and settled, then driven into the state under test before anything is read.
 * `install` lands before `goto` (it registers an init script), `run` after `settle()`, and the
 * shared `afterInteraction()` tail closes out whatever the interaction started.
 */
async function captureSide(
  page: Page,
  url: string,
  pageType: PageType,
  opts: { mastheadIndex?: number; interaction?: Interaction; ctx?: InteractionContext } = {},
): Promise<SideCapture> {
  const spec = sentinels[pageType];
  const { interaction, ctx } = opts;
  const network: NetworkInventory = { responses: [], failed: [] };
  page.on('response', (r) => network.responses.push({ url: r.url(), status: r.status(), resourceType: r.request().resourceType() }));
  page.on('requestfailed', (r) => network.failed.push({ url: r.url(), errorText: r.failure()?.errorText ?? 'unknown' }));
  const scriptRequests = recordScriptRequests(page);

  if (!ctx) throw new Error('captureSide: interaction context is required for route-aware determinism');
  // One initializer covers the initial URL and any interaction navigation/reload. Its exact route
  // map preserves destination masthead seeds and phase-adjusts only source-proven NEW post paths.
  const seed = seedForPage(pageType, opts.mastheadIndex);
  const seeds = Object.fromEntries(pairs.map((candidate) => [
    ctx.side === 'old' ? candidate.oldPath : candidate.newPath,
    seedForPage(candidate.page),
  ]));
  const initialLocation = ctx.side === 'old' ? ctx.pair.oldPath : ctx.pair.newPath;
  seeds[initialLocation] = seed;
  const phaseAdvanceLocations = MODE === 'old-new' && ctx.side === 'new' && migrated
    ? migrated.postRandomPhaseLocations
    : [];
  for (const location of phaseAdvanceLocations) seeds[location] ??= STATIC_PAGE_SEED;
  const routePlan: RouteSeedPlan = { seeds, phaseAdvanceLocations };
  await installDeterminism(page, STATIC_PAGE_SEED, routePlan);
  // Also before goto: `mastheadReady` asserts the *path* the engine took, not just where it
  // stopped, because five of the nine home sequences and all seven listing ones share a final
  // line. Without the recorder the pinned index would go unchecked on every page but one.
  if (pageType === 'home' || pageType === 'blog') await recordMastheadHistory(page);
  if (interaction?.install && ctx) await interaction.install(page, ctx);
  const response = await page.goto(url, { waitUntil: 'load' });
  const responseBody = response ? await response.text() : '';
  await settle(page, pageType, { mastheadIndex: opts.mastheadIndex });
  const seedState = await randomSeedState(page);
  const determinism = { seed: seedState.baseSeed, ...seedState, draws: await randomDraws(page) };

  // The state's own end condition, then the shared tail. Each gets a full settle budget: an
  // interaction that legitimately takes seconds must not eat the budget of the wait after it.
  if (interaction && ctx) {
    // Before any gesture, at the settled position `settle()` has already proven identical on both
    // sides: hand AOS a cache recomputed from that layout, so what it decides during the gesture is
    // a function of the layout rather than of when its offsets happened to be cached.
    await refreshAos(page);
    await afterInteraction(page, pageType, Date.now() + SETTLE_TIMEOUT_MS, { quiesce: false });
    if (interaction.run) {
      ctx.deadline = Date.now() + SETTLE_TIMEOUT_MS;
      await interaction.run(page, ctx);
    }
    await afterInteraction(page, pageType, Date.now() + SETTLE_TIMEOUT_MS, { quiesce: interaction.quiesce });
  }

  // Both sides, every mode: mermaid names itself from Date.now(), which no seed can pin and which
  // is not a migration difference. Plotly gets no rule — the seed above makes its ids equal.
  const html = canonicalizeCursorFollower(
    canonicalizeGeneratedIds(await page.evaluate(() => document.documentElement.outerHTML)),
  );
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
    { selectors: spec.selectors, roles: [...ROLE_TOKENS], props: SENTINEL_PROPS },
  );
  const resourceScripts = scriptRequests.snapshot(url);
  scriptRequests.dispose();
  const mastheadText = spec.masthead ? await page.locator(spec.masthead).textContent() : null;
  // The exception-aware capture runs once both sides exist. Taking an earlier bitmap here would
  // run Playwright's animation preparation before that helper records the live viewport.
  const png = Buffer.alloc(0);

  return {
    responseBody,
    html,
    determinism,
    sample,
    counts,
    rawScripts: rawScriptSources(responseBody, url),
    resourceScripts,
    masthead: mastheadText,
    // A copy, not the live arrays: `@state:palette`'s `after` hook navigates this same page twice
    // more, and the requests those cancel are not part of the capture that was just compared.
    network: { responses: [...network.responses], failed: [...network.failed] },
    png,
  };
}


function writeDumps(dir: string, side: 'old' | 'new', capture: SideCapture, lines: string[]): Record<string, string> {
  mkdirSync(dir, { recursive: true });
  const files: Record<string, string> = {
    [`${side}.response.html`]: capture.responseBody,
    [`${side}.dom.txt`]: lines.join('\n'),
    [`${side}.styles.json`]: JSON.stringify({ sample: capture.sample, counts: capture.counts }, null, 2),
    [`${side}.network.json`]: JSON.stringify(capture.network, null, 2),
    [`${side}.scripts.json`]: JSON.stringify({ raw: capture.rawScripts, resources: capture.resourceScripts }, null, 2),
    [`${side}.determinism.json`]: JSON.stringify(capture.determinism, null, 2),
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

/**
 * The state's own evidence, per side, compared `toEqual` across the two. Written after the state's
 * `after` hook so a navigating state's whole record lands in one file.
 */
function writeEvidence(dir: string, side: 'old' | 'new', state: StateName, evidence: Record<string, unknown>): string {
  mkdirSync(dir, { recursive: true });
  const body = JSON.stringify(evidence, null, 2);
  const path = resolve(dir, `${side}.interaction.json`);
  writeFileSync(path, body);
  // §9 asks for the palette record by name, and S1-13 reads it as the before-and-after.
  if (state === 'palette') writeFileSync(resolve(dir, `${side}.palette.json`), body);
  return path;
}

const badResponses = (network: NetworkInventory): Array<[number, string]> =>
  network.responses.filter((r) => r.status >= 400).map((r) => [r.status, r.url] as [number, string]);

/** A CDN or font host that never connected fails here, not silently as a missing response. */
const badFailures = (network: NetworkInventory): NetworkInventory['failed'] =>
  network.failed.filter((f) => !ABORT_HOSTS.has(new URL(f.url).hostname));

/** Fields removed by §15 are still asserted on NEW from their owning source and route contract. */
async function assertMigratedContracts(page: Page, pair: UrlPair, oldPage?: Page): Promise<void> {
  if (!migrated) return;
  if (pair.page === 'post' && pair.postId) {
    const expected = migrated.postMetadata[pair.postId];
    if (!expected) throw new Error(`no migrated metadata for ${pair.postId}`);
    const actual = await page.evaluate(() => ({
      titles: [...document.querySelectorAll('title')].map((node) => node.textContent ?? ''),
      descriptions: [...document.querySelectorAll('meta[name="description"]')].map((node) => node.getAttribute('content')),
      canonicals: [...document.querySelectorAll('link[rel="canonical"]')].map((node) => node.getAttribute('href')),
      openGraph: [...document.querySelectorAll('meta[property^="og:"]')]
        .map((node) => [node.getAttribute('property'), node.getAttribute('content')] as [string | null, string | null]),
      twitter: [...document.querySelectorAll('meta[name^="twitter:"]')]
        .map((node) => [node.getAttribute('name'), node.getAttribute('content')] as [string | null, string | null]),
      jsonLd: [...document.querySelectorAll('script[type="application/ld+json"]')]
        .map((node) => JSON.parse(node.textContent ?? 'null') as unknown),
      heading: document.getElementById('post-title')?.textContent?.trim() ?? null,
    }));
    expect.soft(postHeadIssues(actual, expected), `${pair.postId}: authoritative post metadata`).toEqual([]);
  }

  if (pair.page === 'home' || pair.page === 'blog') {
    for (const [id, expected] of Object.entries(migrated.changedCards)) {
      const actual = await page.evaluate((postId) => {
        const card = [...document.querySelectorAll<HTMLAnchorElement>('a.blog-card')]
          .find((anchor) => anchor.href.includes(postId));
        return card ? {
          title: card.querySelector('.blog-card-title')?.textContent?.trim() ?? null,
          date: card.querySelector('.blog-card-date')?.textContent?.trim() ?? null,
        } : null;
      }, id);
      expect.soft(actual, `${pair.page}: ${id} card matches its post source`).toEqual(expected);
    }

    if (oldPage) {
      const readLexChat = (candidate: Page) => candidate.evaluate(() => {
        const cards = [...document.querySelectorAll<HTMLElement>('#featured-track > .fc-card')]
          .filter((card) => card.querySelector('.fc-card-title')?.textContent?.trim() === 'LexChat');
        const card = cards[0];
        const cta = card?.querySelector<HTMLAnchorElement>('.fc-card-cta');
        return {
          count: cards.length,
          title: card?.querySelector('.fc-card-title')?.textContent?.trim() ?? null,
          label: cta?.textContent?.trim() ?? null,
          href: cta?.getAttribute('href') ?? null,
          target: cta?.getAttribute('target') ?? null,
          rel: cta?.getAttribute('rel') ?? null,
        };
      });
      const [oldLexChat, newLexChat] = await Promise.all([readLexChat(oldPage), readLexChat(page)]);
      expect.soft(oldLexChat, `${pair.page}: OLD LexChat card contract`).toEqual({
        count: 1,
        title: 'LexChat',
        label: 'Visit LexChat',
        href: '/lexchat/',
        target: '_blank',
        rel: 'noopener noreferrer',
      });
      expect.soft(newLexChat, `${pair.page}: NEW LexChat card contract`).toEqual({
        ...oldLexChat,
        href: 'https://huggingface.co/spaces/dawsonamf/lexchat',
      });
    }
  }

  if (pair.page !== 'notFound') {
    const route = pair.page === 'home' ? '/'
      : pair.page === 'blog' ? '/blog/'
      : pair.page === 'post' ? `/blog/${pair.postId}/`
      : pair.page === 'privacy' ? '/privacy/'
      : '/404.html';
    const expectedCanonical = `https://www.dawsonamf.com${route}`;
    const actual = await page.evaluate(() => ({
      canonicals: [...document.querySelectorAll('link[rel="canonical"]')].map((node) => node.getAttribute('href')),
      robots: [...document.querySelectorAll('meta[name="robots"]')].map((node) => node.getAttribute('content')),
    }));
    const hasDefaultCanonical = pair.page === 'home' || pair.page === 'blog' || pair.page === 'post';
    expect.soft(actual.canonicals, `${pair.page}: route canonical`).toEqual(
      pair.theme !== 'default' || hasDefaultCanonical ? [expectedCanonical] : [],
    );
    expect.soft(actual.robots, `${pair.page}: themed noindex`).toEqual(pair.theme === 'default' ? [] : ['noindex']);
  }
}

for (const { pair, state } of matrix) {
  const interaction = state.name === 'settled' ? undefined : INTERACTIONS[state.name];
  // `@only:` is what the two comparison projects filter on in playwright.config.ts, so a state one
  // viewport cannot reach is never collected there — no runtime skip anywhere in the suite.
  const title =
    `@theme:${pair.theme} @page:${pair.page}${pair.postId ? ` @post:${pair.postId}` : ''} ` +
    `@state:${state.name}${state.only ? ` @only:${state.only}` : ''}`;

  test(title, async ({ browser }, testInfo) => {
    // An interaction state runs `settle()`, then the state's own end condition, then the shared
    // tail — three separately bounded phases, on each of two sides. Each phase keeps its own 15 s
    // `pollUntil` deadline, so a genuine hang still fails in seconds with the outstanding detail;
    // the default 90 s *test* budget is simply too tight for six of them plus two page loads, and
    // one `sticky-nav` crossed it under full-matrix contention. Nothing else changes: no assertion
    // is relaxed and no wait is lengthened.
    if (interaction) test.slow();
    const spec = sentinels[pair.page];
    const mode = MODE;
    const dumpDir = resolve(DUMP_ROOT, testInfo.project.name, pair.theme, pair.pageId, state.name);
    const project = testInfo.project.name as ProjectName;
    const context = (side: 'old' | 'new', origin: string): InteractionContext => ({
      pair,
      pageType: pair.page,
      project,
      origin,
      side,
      mode,
      deadline: Date.now() + SETTLE_TIMEOUT_MS,
      evidence: {},
    });
    const oldCtx = context('old', OLD_ORIGIN);
    const newCtx = context('new', NEW_ORIGIN);
    const sideOpts = { mastheadIndex: interaction?.mastheadIndex, interaction };

    const old = await openSide(browser, testInfo);
    let oldCapture: SideCapture | null = null;
    let oldNorm: ReturnType<typeof normalizeHtml> | null = null;
    let oldPaths: Record<string, string> = {};
    let oldEvidencePath = '';
    try {
      oldCapture = await captureSide(old.page, OLD_ORIGIN + pair.oldPath, pair.page, { ...sideOpts, ctx: oldCtx });
      oldNorm = normalizeHtml(oldCapture.html, {
        mode, side: 'old', page: pair.page, theme: pair.theme, postId: pair.postId, adapter: migrated ?? undefined,
      });
      oldEvidencePath = writeEvidence(dumpDir, 'old', state.name, oldCtx.evidence);

      const next = await openSide(browser, testInfo);
      try {
        const newCapture = await captureSide(next.page, NEW_ORIGIN + pair.newPath, pair.page, {
          ...sideOpts,
          ctx: newCtx,
        });
        const newNorm = normalizeHtml(newCapture.html, {
          mode, side: 'new', page: pair.page, theme: pair.theme, postId: pair.postId, adapter: migrated ?? undefined,
        });

        // §15 visible exceptions are measured once on NEW, then rendered as the same bounded
        // page-coordinate rectangles on both captures. Closed fullscreen scrims never enter this.
        const rectangles = mode === 'old-new'
          ? await exceptionRectangles(old.page, next.page, pair.page, pair.theme, state.name)
          : [];
        oldCapture.png = await screenshotWithExceptionRectangles(
          old.page, spec.mask, rectangles, spec.fullPage,
        );
        newCapture.png = await screenshotWithExceptionRectangles(
          next.page, spec.mask, rectangles, spec.fullPage,
        );

        oldPaths = writeDumps(dumpDir, 'old', oldCapture, oldNorm.lines);
        const newPaths = writeDumps(dumpDir, 'new', newCapture, newNorm.lines);
        writeEvidence(dumpDir, 'new', state.name, newCtx.evidence);
        const oldLines = oldNorm.lines;
        const newLines = newNorm.lines;

        testInfo.annotations.push({
          type: 'astro-guards',
          description: `old ${JSON.stringify(oldNorm.guards)} new ${JSON.stringify(newNorm.guards)}`,
        });

        expect.soft(badResponses(oldCapture.network), 'old side 4xx/5xx').toEqual([]);
        expect.soft(badResponses(newCapture.network), 'new side 4xx/5xx').toEqual([]);
        expect.soft(badFailures(oldCapture.network), 'old side request failures').toEqual([]);
        expect.soft(badFailures(newCapture.network), 'new side request failures').toEqual([]);

        const newSide = mode === 'old-new' ? 'new' : 'old';
        expect.soft(scriptOrderIssues(pair.page, 'old', 'raw', oldCapture.rawScripts, pair.postId, true), 'old raw script order').toEqual([]);
        expect.soft(scriptOrderIssues(pair.page, 'old', 'loaded', oldCapture.resourceScripts, pair.postId, true), 'old resource script order').toEqual([]);
        expect.soft(scriptOrderIssues(pair.page, newSide, 'raw', newCapture.rawScripts, pair.postId, true, migrated ?? undefined), 'new raw script order').toEqual([]);
        expect.soft(scriptOrderIssues(pair.page, newSide, 'loaded', newCapture.resourceScripts, pair.postId, true, migrated ?? undefined), 'new resource script order').toEqual([]);

        const oneEach = Object.fromEntries(spec.selectors.map((selector) => [selector, 1]));
        expect.soft(oldCapture.counts, 'old side sentinel match counts').toEqual(oneEach);
        expect.soft(newCapture.counts, 'new side sentinel match counts').toEqual(oneEach);

        if (newLines.join('\n') !== oldLines.join('\n')) {
          await testInfo.attach('old.dom.txt', { path: oldPaths['old.dom.txt']!, contentType: 'text/plain' });
          await testInfo.attach('new.dom.txt', { path: newPaths['new.dom.txt']!, contentType: 'text/plain' });
        }
        expect.soft(newLines, 'normalised DOM').toEqual(oldLines);

        expect.soft(
          styleSampleForComparison(newCapture.sample, { mode, side: 'new' }),
          'computed-style sample',
        ).toEqual(styleSampleForComparison(oldCapture.sample, { mode, side: 'old' }));

        await assertMigratedContracts(next.page, pair, old.page);
        expect.soft(oldCapture.determinism.removedLibraryDraws, 'OLD random phase offset').toBe(0);
        expect.soft(oldCapture.determinism.effectiveSeed, 'OLD effective random seed').toBe(oldCapture.determinism.seed);
        expect.soft(newCapture.determinism.seed, 'shared base random seed').toBe(oldCapture.determinism.seed);
        const expectedRemovedDraws = mode === 'old-new' && migrated
          && migrated.postRandomPhaseLocations.includes(newCapture.determinism.location) ? 1 : 0;
        expect.soft(newCapture.determinism.removedLibraryDraws, 'source-derived removed Mermaid draw').toBe(expectedRemovedDraws);
        expect.soft(
          newCapture.determinism.draws + expectedRemovedDraws,
          'seeded Math.random raw draw count plus exact removed-library calibration',
        ).toEqual(oldCapture.determinism.draws);
        if (spec.masthead) expect.soft(newCapture.masthead, 'masthead text').toEqual(oldCapture.masthead);

        const snapshotPath = testInfo.snapshotPath.bind(testInfo) as unknown as SnapshotPathWithKind;
        const referencePath = snapshotPath(pair.theme, pair.pageId, `${state.name}.png`, { kind: 'screenshot' });
        expect(referencePath, 'screenshot reference path').toBe(
          resolve(SNAPSHOT_ROOT, testInfo.project.name, pair.theme, pair.pageId, `${state.name}.png`),
        );
        mkdirSync(dirname(referencePath), { recursive: true });
        writeFileSync(referencePath, oldCapture.png);
        expect(newCapture.png).toMatchSnapshot([pair.theme, pair.pageId, `${state.name}.png`], {
          maxDiffPixelRatio: 0.001,
          threshold: 0.2,
        });

        let newEvidencePath = '';
        try {
          if (interaction?.after) {
            oldCtx.deadline = Date.now() + SETTLE_TIMEOUT_MS;
            await interaction.after(old.page, oldCtx);
            newCtx.deadline = Date.now() + SETTLE_TIMEOUT_MS;
            await interaction.after(next.page, newCtx);
          }
        } finally {
          oldEvidencePath = writeEvidence(dumpDir, 'old', state.name, oldCtx.evidence);
          newEvidencePath = writeEvidence(dumpDir, 'new', state.name, newCtx.evidence);
        }
        const oldEvidence = state.name === 'palette'
          ? paletteEvidenceForComparison(oldCtx.evidence, mode, 'old', pair.theme)
          : oldCtx.evidence;
        const newEvidence = state.name === 'palette'
          ? paletteEvidenceForComparison(newCtx.evidence, mode, 'new', pair.theme)
          : newCtx.evidence;
        if (JSON.stringify(newEvidence) !== JSON.stringify(oldEvidence)) {
          await testInfo.attach('old.interaction.json', { path: oldEvidencePath, contentType: 'application/json' });
          await testInfo.attach('new.interaction.json', { path: newEvidencePath, contentType: 'application/json' });
        }
        expect.soft(newEvidence, `@state:${state.name} evidence`).toEqual(oldEvidence);
      } finally {
        await next.context.close();
      }
    } finally {
      await old.context.close();
      writeEvidence(dumpDir, 'old', state.name, oldCtx.evidence);
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
    for (const step of RAMP_PROPS.filter((p) => !(ROLE_TOKENS as readonly string[]).includes(p))) {
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
