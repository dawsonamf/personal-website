/**
 * Spec 1 §9 determinism: the harness controls randomness at its source instead of widening any
 * tolerance. `Math.random` is replaced page-side by a seeded mulberry32 before any site script
 * runs, and the seed is derived from the *sequence index* the run wants, never hand-picked, so a
 * new sequence in `js/script.js` or `blog/blog-listing.js` moves the seed rather than silently
 * changing which line is typed.
 *
 * Line refs are `personal-website-old` at the baseline SHA.
 * Consumers: harness/parity.spec.ts, harness/sentinels.ts.
 */
import type { Page } from '@playwright/test';
import { masthead } from './baseline.ts';
import type { PageType } from './urls.ts';

/**
 * Standard mulberry32. Deliberately self-contained: its source is stringified and injected into
 * the page, so it may reference nothing outside its own body (`tests/unit/parity-seeds.test.ts`
 * evaluates `mulberry32.toString()` standalone and matches the outputs to prove it).
 */
export function mulberry32(seed: number): () => number {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function checkDraw(count: number, draw: number): void {
  if (!Number.isInteger(count) || count < 1) throw new Error(`count must be a positive integer, got ${count}`);
  if (!Number.isInteger(draw) || draw < 1) throw new Error(`draw must be a 1-based integer, got ${draw}`);
}

/** What `Math.floor(Math.random() * count)` returns on the `draw`-th (1-based) call under `seed`. */
export function pickIndex(seed: number, count: number, draw: number): number {
  checkDraw(count, draw);
  const random = mulberry32(seed);
  let r = 0;
  for (let i = 0; i < draw; i++) r = random();
  return Math.floor(r * count);
}

/** The smallest seed >= 0 whose `draw`-th draw picks `index` out of `count`. */
export function seedFor(index: number, count: number, draw: number): number {
  checkDraw(count, draw);
  if (!Number.isInteger(index) || index < 0 || index >= count) {
    throw new Error(`index must be an integer in [0, ${count}), got ${index}`);
  }
  // A million is enough headroom that a miss is a bug rather than a short search: every real pick
  // lands far below it (the largest in use is 13).
  for (let seed = 0; seed < 1_000_000; seed++) {
    if (pickIndex(seed, count, draw) === index) return seed;
  }
  throw new Error(`no seed below 1000000 picks index ${index} of ${count} on draw ${draw}`);
}

/**
 * Which `Math.random()` call the masthead pick (`js/typing-engine.js:165`) is. jQuery 3.6.0 draws
 * once at load for its expando and is a `defer` script ahead of `js/typing-engine.js` on home
 * (`index.html:31` vs `:38`); the listing loads no jQuery (`blog/index.html:29-37`).
 */
export const MASTHEAD_DRAW = { home: 2, blog: 1 } as const;

/**
 * The sequence each page settles on: the shortest one the page has, so the settle is as short as
 * the baseline allows. Home 3 is `Hi,\nI'm Dawson,\nsoftware engineer.` — one `type` step and no
 * delete at all. Listing 6 is `Side quests.` (12 typed, 12 deleted, then `Blog.`), the shortest of
 * its 7 by the engine's own cost model — `tests/unit/parity-seeds.test.ts` derives that ranking
 * from `masthead.json` and asserts this constant is its winner, so a new sequence in
 * `blog/blog-listing.js` moves the pin rather than silently leaving a longer one in place. The
 * index also fixes what `reserveHeight()` reserves and therefore the listing's whole vertical
 * layout, on both sides.
 */
export const MASTHEAD_INDEX = { home: 3, blog: 6 } as const;

/** Home sequence 0 is the longest delete path (§9 asks for one mobile shot that exercises it). */
export const HOME_DELETE_INDEX = 0;

/**
 * Pages with no masthead still need a fixed seed: `metr-doubling`'s Plotly names its clip paths,
 * legends and per-series `trace<hex>` classes from `Math.random`, so any fixed seed makes both
 * sides equal. The value is arbitrary; only its fixedness matters.
 */
export const STATIC_PAGE_SEED = 1;

/** One mulberry32 state advance: the pinned Mermaid 11.15 load consumes exactly this first draw. */
export const MERMAID_RANDOM_STEP = 0x6d2b79f5;

export interface RouteSeedPlan {
  /** Exact pathname+search keys for every route the context may load. */
  seeds: Record<string, number>;
  /** NEW post locations where conditional Mermaid removed one proven leading library draw. */
  phaseAdvanceLocations: string[];
}

export interface RouteSeedState {
  location: string;
  baseSeed: number;
  effectiveSeed: number;
  removedLibraryDraws: 0 | 1;
}

/** Reject a source/plumbing drift before serializing the route plan into a browser context. */
export function validateRouteSeedPlan(plan: RouteSeedPlan): void {
  for (const [location, seed] of Object.entries(plan.seeds)) {
    if (!location.startsWith('/')) throw new Error(`determinism: ${JSON.stringify(location)} is not an absolute location`);
    if (!Number.isInteger(seed)) throw new Error(`determinism: ${location} has non-integer seed ${seed}`);
  }
  if (new Set(plan.phaseAdvanceLocations).size !== plan.phaseAdvanceLocations.length) {
    throw new Error('determinism: duplicate phase-advance location');
  }
  for (const location of plan.phaseAdvanceLocations) {
    if (!Object.hasOwn(plan.seeds, location)) {
      throw new Error(`determinism: phase-advance location ${location} is not a seeded route`);
    }
  }
}

/** Pure and standalone-stringifiable: `installDeterminism` executes this exact function in-page. */
export function routeSeedState(location: string, fallbackSeed: number, plan: RouteSeedPlan): RouteSeedState {
  const baseSeed = Object.hasOwn(plan.seeds, location) ? plan.seeds[location]! : fallbackSeed;
  const removedLibraryDraws = plan.phaseAdvanceLocations.includes(location) ? 1 : 0;
  return {
    location,
    baseSeed,
    effectiveSeed: (baseSeed + removedLibraryDraws * 0x6d2b79f5) | 0,
    removedLibraryDraws,
  };
}

/** The seed that makes `pageType`'s masthead pick `index`, derived from the baseline's own count. */
export function mastheadSeed(pageType: 'home' | 'blog', index: number = MASTHEAD_INDEX[pageType]): number {
  const count = masthead()[pageType].sequences.length;
  return seedFor(index, count, MASTHEAD_DRAW[pageType]);
}

/** The seed a matrix page is loaded under. Reads the baseline for home and the listing only. */
export function seedForPage(pageType: PageType, mastheadIndex?: number): number {
  if (pageType === 'home' || pageType === 'blog') return mastheadSeed(pageType, mastheadIndex);
  return STATIC_PAGE_SEED;
}

/**
 * Replace `Math.random` with the seeded generator before any site script runs, and count the
 * draws in `window.__parityRandomDraws` so the draw numbers above stay evidence rather than
 * folklore. The injected source is built from `mulberry32.toString()`, so Node and the browser
 * run the same function rather than two copies that can drift.
 */
export async function installDeterminism(
  page: Page,
  seed: number,
  plan: RouteSeedPlan = { seeds: {}, phaseAdvanceLocations: [] },
): Promise<void> {
  validateRouteSeedPlan(plan);
  await page.addInitScript({
    content: [
      '(() => {',
      `  const resolveSeed = ${routeSeedState.toString()};`,
      `  const seedState = resolveSeed(location.pathname + location.search, ${seed}, ${JSON.stringify(plan)});`,
      `  const factory = ${mulberry32.toString()};`,
      '  const next = factory(seedState.effectiveSeed);',
      '  window.__parityRandomSeed = seedState;',
      '  window.__parityRandomDraws = 0;',
      '  Math.random = function () { window.__parityRandomDraws += 1; return next(); };',
      '})();',
    ].join('\n'),
  });
}

/** How many `Math.random()` calls the page has made. Read after `settle()`, dumped per side. */
export async function randomDraws(page: Page): Promise<number> {
  return page.evaluate(() => (window as unknown as { __parityRandomDraws?: number }).__parityRandomDraws ?? -1);
}

/** The actual route-selected seed beside its raw draw count; written into each parity dump. */
export async function randomSeedState(page: Page): Promise<RouteSeedState> {
  return page.evaluate(() => {
    const state = (window as unknown as { __parityRandomSeed?: RouteSeedState }).__parityRandomSeed;
    if (!state) throw new Error('determinism: route seed state was not installed');
    return state;
  });
}

/** The engine emits `<br>` for `\n` and parks a zero-width space in the cursorless anchor. */
export function cleanMastheadText(text: string): string {
  return text.replace(/\u200B/g, '').replace(/\n/g, '');
}

/** The two elements `typing-engine.js` types into, one per masthead page type. */
export const MASTHEAD_ELEMENT_IDS = { home: 'typing-text', blog: 'blog-typing-text' } as const;

/**
 * Record every distinct state each masthead passes through, so readiness can assert the *path* the
 * engine took and not merely where it stopped. Asserting the terminal alone is very nearly vacuous:
 * home sequences 0, 1, 3, 5 and 7 all end on the same line and all seven listing sequences end on
 * `Blog.`, so the pinned index — and with it `MASTHEAD_DRAW` — would never actually be checked.
 * Installed on every home and listing capture, both sides (`harness/parity.spec.ts`).
 *
 * Both ids are recorded by one observer, not just the current page's: `@state:palette`'s `after`
 * hook navigates home -> listing on the same `Page`, and an init script registered for `typing-text`
 * would leave that landing's readiness with nothing to assert.
 */
export async function recordMastheadHistory(page: Page): Promise<void> {
  await page.addInitScript({
    content: [
      '(() => {',
      `  const clean = ${cleanMastheadText.toString()};`,
      `  const ids = ${JSON.stringify(Object.values(MASTHEAD_ELEMENT_IDS))};`,
      '  const history = {};',
      '  ids.forEach((id) => { history[id] = []; });',
      '  window.__parityMastheadHistory = history;',
      '  const record = () => {',
      '    for (const id of ids) {',
      '      const el = document.getElementById(id);',
      '      if (!el) continue;',
      '      const text = clean(el.textContent || "");',
      '      const seen = history[id];',
      '      if (seen[seen.length - 1] !== text) seen.push(text);',
      '    }',
      '  };',
      '  new MutationObserver(record).observe(document, {',
      '    subtree: true, childList: true, characterData: true,',
      '  });',
      '})();',
    ].join('\n'),
  });
}

/** Whatever `recordMastheadHistory` has collected so far for one masthead element. */
export async function mastheadHistory(page: Page, elementId: string): Promise<string[]> {
  return page.evaluate(
    (id) =>
      (window as unknown as { __parityMastheadHistory?: Record<string, string[]> }).__parityMastheadHistory?.[
        id
      ] ?? [],
    elementId,
  );
}

/**
 * `js/cursor-follow.js:21-31` runs a rAF ease that never stops and never terminates. Each frame
 * moves the follower a fixed fraction of the way to `pointer - offsetWidth / 2` (0.6 for
 * `.cursor-follow`, 0.25 for `.circle-follow`), so it approaches its target **asymptotically** and
 * what lands in the DOM is a frame count, not a position. Two runs stop on different frames, so
 * the two sides agree on the position and differ only in the float tail.
 *
 * Two states produce that tail. Before any mouse move (§9: the mouse is untouched for every state
 * but `carousel-wheel`) the target is `-offsetWidth / 2` and, once the follower has no box, 0: the
 * residual is an exponent-notation crumb such as `-4.31945e-41px`, and `-0` also appears. After
 * `carousel-wheel`'s `mouse.move` the target is a real on-screen point and the residual sits in the
 * last decimals, `712.9999999997px` against `713.0000000002px`.
 *
 * One rule covers both: round the two follower elements' own inline `left`/`top` to **one decimal
 * place**. `-5e-13px` and `-0` both become `0.0px`; `712.9999999997px` becomes `713.0px`. The
 * interaction waits until both elements are stable to two decimals across consecutive frames
 * before capturing, so the two sides are within a hundredth of a pixel of the same target and
 * approach it from the same side — a tenth of a pixel is an order of magnitude of headroom, and
 * nothing else on the page is touched.
 *
 * The class is matched as a **whitespace-delimited token**, not as the whole attribute:
 * `cursor-follow.js:36-41` adds `cursor-follow-clickable` while the pointer is over an
 * `a, button, .job-menu-item`, which `carousel-wheel`'s `mouse.move` can land on, and an
 * exact-attribute match would silently stop canonicalising exactly the element that has the tail.
 * `cursor-follow-clickable` on its own is not a match: the token has to stand alone.
 */
export function canonicalizeCursorFollower(html: string): string {
  return html.replace(/<div\b[^>]*\bclass="(?:[^"]*\s)?(?:cursor|circle)-follow(?:\s[^"]*)?"[^>]*>/g, (tag) =>
    tag.replace(/((?:left|top):\s*)(-?\d+(?:\.\d+)?(?:e[-+]?\d+)?)px/g, (_m, prefix: string, value: string) => {
      // `+ 0` after the round, so a negative crumb lands on `0.0` and never on `-0.0`.
      return `${prefix}${(Math.round(Number(value) * 10) / 10 + 0).toFixed(1)}px`;
    }),
  );
}

/**
 * Mermaid names its `<svg>`, the eight `<marker>`s, every rule of its injected `<style>` and every
 * node id after `Date.now()` (`mermaid-<13 digits>`), so `toolbelt`'s two diagrams differ on every
 * run on *both* sides. Rewrite each distinct epoch to `mermaid-T<n>` by order of first appearance:
 * two diagrams stay distinct, and every `#mermaid-…` / `url(#mermaid-…)` reference maps with them.
 *
 * This lives here and not in `normalize.ts` because it canonicalises an intrinsically
 * nondeterministic timestamp, not a migration difference, so it applies to both sides in every
 * mode. Plotly needs no rule: its `randstr` ids and `trace<hex>` classes come from `Math.random`
 * and the seed above makes them equal.
 */
export function canonicalizeGeneratedIds(html: string): string {
  const aliases = new Map<string, string>();
  return html.replace(/mermaid-\d{13}(?!\d)/g, (token) => {
    let alias = aliases.get(token);
    if (alias === undefined) {
      alias = `mermaid-T${aliases.size + 1}`;
      aliases.set(token, alias);
    }
    return alias;
  });
}
