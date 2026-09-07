/**
 * Spec 1 §9's interaction states, one registry entry per state. Every state is a *deterministic*
 * end condition the harness waits for and asserts, never a sleep: a state whose condition cannot be
 * reached is a failure, never a skip, and a state applies wherever the baseline has the element.
 *
 * Three hooks, because a state can need the page at three different moments:
 *   `install` before `goto` (an init script), `run` after `settle()` and before the capture, and
 *   `after` once the capture is written (only the palette state, which navigates).
 *
 * Line refs are `personal-website-old` at the baseline SHA.
 * Consumers: harness/parity.spec.ts, harness/fixtures/baseline/README.md.
 */
import { expect } from '@playwright/test';
import type { Page } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { content, masthead, oldDir } from './baseline.ts';
import type { MastheadFixture } from './baseline.ts';
import {
  cleanMastheadText,
  HOME_DELETE_INDEX,
  installDeterminism,
  MASTHEAD_ELEMENT_IDS,
  mastheadHistory,
  seedForPage,
} from './determinism.ts';
import { holdSteady, pollUntil, ROLE_TOKENS, SETTLE_TIMEOUT_MS } from './sentinels.ts';
import { afterInteraction, settle } from './settle.ts';
import { firstPaint, recordFirstPaint, reloadOutcome } from './palette.ts';
import { urlPairs } from './urls.ts';
import type { PageType, ParityMode, UrlPair } from './urls.ts';

export type ProjectName = 'desktop-1440' | 'mobile-390';

/** The `@state:` tag vocabulary. S1-13 / S1-17 / S1-26 grep these names; they are the contract. */
export type StateName =
  | 'settled'
  | 'masthead-0'
  | 'jobs-tab-2'
  | 'carousel-dot-3'
  | 'carousel-wheel'
  | 'sticky-nav'
  | 'smooth-scroll-contact'
  | 'picker-open'
  | 'filter-swift'
  | 'palette';

export interface InteractionContext {
  pair: UrlPair;
  pageType: PageType;
  project: ProjectName;
  /** The side's origin, so a state that navigates stays on the side it was captured from. */
  origin: string;
  /**
   * Which side this context is driving. `origin` alone is not enough for a state that navigates:
   * the two sides do not agree on *paths* under `old-new`, only under `old-old`, so a hook that
   * follows `UrlPair.oldPath` on both would 404 the migrated side the day S1-13 points 8782 at
   * `dist`. `@state:palette` is the one hook that needs it.
   */
  side: 'old' | 'new';
  mode: ParityMode;
  /** Reset by the caller at each hook, so a hook's waits get a full settle budget of their own. */
  deadline: number;
  /** Written to `<side>.interaction.json` and compared `toEqual` across the two sides. */
  evidence: Record<string, unknown>;
}

export interface Interaction {
  /** Page types the baseline gives this state an element on. */
  pages: PageType[];
  /** A state only one viewport can reach; the other project filters it out by `@only:` tag. */
  only?: ProjectName;
  /** Pins a masthead sequence other than `MASTHEAD_INDEX`, threaded into the seed and readiness. */
  mastheadIndex?: number;
  /** `false` where the state's end condition *is* a scroll position; see `afterInteraction`. */
  quiesce?: boolean;
  install?(page: Page, ctx: InteractionContext): Promise<void>;
  run?(page: Page, ctx: InteractionContext): Promise<void>;
  after?(page: Page, ctx: InteractionContext): Promise<void>;
}

// ---- Shared helpers ---------------------------------------------------------------------------

/** The interaction never moves the mouse (§9), so a click is dispatched at the element itself. */
async function dispatchClick(page: Page, selector: string): Promise<void> {
  const target = page.locator(selector);
  await expect(target, `${selector} resolves to exactly one element`).toHaveCount(1);
  await target.dispatchEvent('click');
}

/** `window.scrollTo` plus the wait for the page to come to rest at the new offset. */
async function scrollWindowTo(page: Page, pageType: PageType, deadline: number, y: number): Promise<void> {
  await page.evaluate((target) => window.scrollTo(0, target), y);
  await holdSteady(page, pageType, `scrollTo(0, ${y})`, deadline, 'window.scrollY', 150);
}

/**
 * Walk the page top to bottom a viewport at a time, resting at each step, then return to the top.
 * Used only by `smooth-scroll-contact`, whose gesture crosses the **whole** document in under a
 * second; it is not part of that gesture, it removes a path-dependence the gesture would otherwise
 * leave in the DOM.
 *
 * Two independent chains touch a section header as it comes into view, and they behave differently.
 * AOS adds `aos-animate` from a handler throttled at 99 ms and, because every `[data-aos]` on home
 * and the listing carries `data-aos-once="true"` (6 of 6 and 2 of 2), that one **latches**.
 * `js/anim-utils.js:184-198` adds `section-header-in` from an IntersectionObserver and `unreveal`
 * takes it off again, so that one is live. Across a sub-second jQuery-animated scroll, which of the
 * two lands first is frame timing: measured, **6 of 16 themes** diffed, either on the class *order*
 * on `#contact-header-wrapper` (the same three classes, different insertion order) or on
 * `#jobs-header-wrapper` / `#blog-header-wrapper` never being revealed at all on one side.
 *
 * Walking at rest latches `aos-animate` everywhere on both sides first. After that
 * `section-header-in` can only ever be appended *after* it, and `--section-rule` is a pure function
 * of the scroll offset. The latch is asserted, so a page the walk failed to cover is a failure.
 *
 * Scoped to this one state on purpose. Applying the same walk to every interaction state was tried
 * and made things worse, not better: on `mobile-390` home — a very tall page whose carousel track
 * is itself taller than the viewport — it introduced fresh diffs in `carousel-dot-3`, `sticky-nav`
 * and `carousel-wheel` that were not there before. The cheap, position-independent half of the
 * problem is handled for every state by `refreshAos` instead.
 */
async function primeReveals(page: Page, pageType: PageType): Promise<number> {
  // A fresh budget per wait, not one shared across the walk. Sharing it meant a slow early step
  // could spend the whole 15 s and leave a later one to fail on entry with "no probe result yet"
  // (observed on `chinoiserie` under full-matrix contention) — a bookkeeping failure that says
  // nothing about the page. Each wait is its own question, and a genuinely stuck one still fails
  // inside 15 s naming what was outstanding.
  const budget = (): number => Date.now() + SETTLE_TIMEOUT_MS;
  const steps = await page.evaluate(() => {
    const doc = document.scrollingElement!;
    return Math.max(1, Math.ceil((doc.scrollHeight - innerHeight) / (innerHeight * 0.8)));
  });
  for (let i = 1; i <= steps; i++) {
    await page.evaluate((n) => window.scrollTo(0, Math.round(innerHeight * 0.8 * n)), i);
    // Rest long enough for AOS's 99 ms throttle to fire and the observer to deliver. Deliberately
    // not the full `afterInteraction` here: AOS triggers off offsets cached at `load`, and on one
    // skin a cache that had gone stale left an element in view but below its own trigger point
    // mid-walk. A later step passes that point regardless, and the latch is asserted at the end.
    await holdSteady(page, pageType, `prime step ${i}`, budget(), 'window.scrollY', 150);
  }
  await page.evaluate(() => window.scrollTo(0, 0));
  await holdSteady(page, pageType, 'prime return', budget(), 'window.scrollY', 150);
  await afterInteraction(page, pageType, budget(), { quiesce: false });
  await pollUntil(pageType, 'prime aos latch', budget(), () =>
    page.evaluate(() => {
      // An element a skin hides outright never intersects, so AOS can never reach it.
      const dark = [...document.querySelectorAll('[data-aos][data-aos-once="true"]')].filter(
        (el) => el.getClientRects().length > 0 && !el.classList.contains('aos-animate'),
      );
      return dark.length ?
          `${dark.length} not latched: ${dark.map((el) => `#${el.id}.${el.className}`).join(', ')}`
        : null;
    }),
  );
  return steps;
}

/**
 * Recompute AOS's element offsets from the settled layout, at the settled scroll position, before
 * a state's gesture runs.
 *
 * AOS decides from offsets **cached at `load`** and reacts through a handler throttled at 99 ms, so
 * two sides whose caches were taken at slightly different moments can disagree about an element
 * sitting near its trigger point. Measured twice on `marquee/blog` `sticky-nav`: one
 * `.section-header-wrapper` latched on one side only, while the state's own evidence
 * (`menu-sticky` at `scrollY 500`) matched exactly.
 *
 * `refresh()` recomputes every offset from the live layout and applies the classes for the current
 * offset synchronously (aos 2.3.1 `O`: `prepare(…)` then `handleScroll(…, once)`). Running it at
 * the **settled** position — which `settle()` has already proven identical on both sides — makes
 * the cache identical too, so every later decision is a function of layout rather than of when the
 * cache happened to be taken. The listing already calls it itself on `resize`
 * (`blog/blog-listing.js:174-176`), and this is the same move `quiesceLayout` makes for the page's
 * scroll handlers.
 *
 * Position matters: calling it *after* a gesture was tried and made things worse, because the
 * result is then `latched-during-the-gesture ∪ in-view-at-refresh-time` and the first half is still
 * path-dependent. Nothing is excluded from the comparison either way.
 */
export async function refreshAos(page: Page): Promise<void> {
  await page.evaluate(() => {
    const aos = (window as unknown as { AOS?: { refresh?: () => void } }).AOS;
    if (typeof aos?.refresh === 'function') aos.refresh();
  });
}

/**
 * `carousel-wheel`'s lock gesture. Big enough horizontally that Chromium really would slide the
 * track (the rail is `overflow-x: auto` and every skin overflows it), and still vertical by the
 * guard's own rule, `ay >= ax * 1.15` (`featured-carousel.js:341`) — 60 >= 46.
 */
const WHEEL_LOCK_DELTA = { x: 40, y: 60 };

/** The `.tc-nav-trigger` the viewport actually shows: `.static-menu` desktop, the row on mobile. */
function triggerSelector(project: ProjectName): string {
  const container = project === 'mobile-390' ? '.static-menu-mobile' : '.static-menu';
  return `${container} .tc-nav-item > .tc-nav-trigger`;
}

/** Open the theme dropdown from the visible trigger and wait for the dock to finish opening. */
async function openPicker(page: Page, ctx: InteractionContext): Promise<Record<string, unknown>> {
  const selector = triggerSelector(ctx.project);
  const rendered = await page.evaluate(
    (sel) => [...document.querySelectorAll(sel)].filter((el) => el.getClientRects().length > 0).length,
    selector,
  );
  expect(rendered, `${selector} is rendered exactly once in ${ctx.project}`).toBe(1);
  await dispatchClick(page, selector);

  await pollUntil(ctx.pageType, 'picker open', ctx.deadline, () =>
    page.evaluate((sel) => {
      const dock = document.getElementById('tc-dock');
      const scrim = document.getElementById('tc-scrim');
      const trigger = document.querySelector(sel);
      if (!dock) return '#tc-dock is missing';
      if (!scrim) return '#tc-scrim is missing';
      if (!trigger) return `${sel} is missing`;
      if (dock.classList.contains('tc-hidden')) return '#tc-dock is still tc-hidden';
      if (!dock.classList.contains('tc-mega-open')) return '#tc-dock has no tc-mega-open';
      if (!scrim.classList.contains('tc-on')) return '#tc-scrim has no tc-on';
      if (trigger.getAttribute('aria-expanded') !== 'true') {
        return `aria-expanded is ${trigger.getAttribute('aria-expanded')}`;
      }
      // theme-cycler.js:614-618 positions the dock from the pill's rect on every open.
      const missing = ['top', 'right'].filter((p) => !dock.style.getPropertyValue(p));
      if (missing.length) return `#tc-dock has no inline ${missing.join(', ')}`;
      // stampStagger (:354) indexes the animated children; their entrance must have finished.
      const running = dock
        .getAnimations({ subtree: true })
        .filter((a) => a.playState === 'running' && Number.isFinite(a.effect?.getTiming().iterations ?? Infinity));
      return running.length ? `${running.length} running dock animation(s)` : null;
    }, selector),
  );

  return page.evaluate((sel) => {
    const dock = document.getElementById('tc-dock')!;
    const scrim = document.getElementById('tc-scrim')!;
    return {
      trigger: sel,
      dockClasses: dock.className,
      scrimClasses: scrim.className,
      ariaExpanded: document.querySelector(sel)!.getAttribute('aria-expanded'),
      dockStyle: {
        top: dock.style.top,
        right: dock.style.right,
        '--tc-mega-w': dock.style.getPropertyValue('--tc-mega-w'),
        '--tc-mega-target': dock.style.getPropertyValue('--tc-mega-target'),
      },
      staggerCount: dock.querySelectorAll('.tc-stagger[style*="--i"]').length,
    };
  }, selector);
}

// ---- Palette state ----------------------------------------------------------------------------

/** The cycler's own session key, read from the baseline rather than restated here. */
function storageKey(): string {
  const src = readFileSync(resolve(oldDir(), 'js/theme-cycler.js'), 'utf8');
  const m = /const STORAGE_KEY\s*=\s*'([^']+)'/.exec(src);
  if (!m) throw new Error("js/theme-cycler.js: `const STORAGE_KEY = '…'` not found");
  return m[1]!;
}

interface ThemeHtmlFixture {
  themes: Record<string, { style: Array<[string, string]> }>;
}

let themeHtml: ThemeHtmlFixture | null = null;

/** The five roles `theme-html.json` recorded for a theme: what a page must paint with no toy. */
function fixtureRoles(theme: string): Record<string, string> {
  themeHtml ??= JSON.parse(
    readFileSync(resolve(import.meta.dirname, 'fixtures/baseline/theme-html.json'), 'utf8'),
  ) as ThemeHtmlFixture;
  const entry = themeHtml.themes[theme];
  if (!entry) throw new Error(`theme-html.json has no entry for ${theme}`);
  const declared = new Map(entry.style);
  return Object.fromEntries(ROLE_TOKENS.map((r) => [r, declared.get(r) ?? '(missing)']));
}

/** The five role tokens as the bootstrap and the cycler wrote them onto `<html>`. */
function readRoles(page: Page): Promise<Record<string, string>> {
  return page.evaluate(
    (roles) => Object.fromEntries(roles.map((r) => [r, document.documentElement.style.getPropertyValue(r)])),
    [...ROLE_TOKENS],
  );
}

/** One landing after a navigation or a reload: what the bootstrap painted and what settled. */
async function landing(page: Page, pageType: PageType, key: string) {
  await settle(page, pageType);
  const shot = await firstPaint(page);
  return {
    firstPaint: shot.roles,
    firstPaintStorage: shot.storage,
    settled: await readRoles(page),
    storage: await page.evaluate((k) => sessionStorage.getItem(k), key),
  };
}

/** Derived once per worker: `urlPairs()` walks the baseline and `masthead()` vm-executes it. */
let allPairs: UrlPair[] | null = null;
let mastheadFixture: MastheadFixture | null = null;

/**
 * The next page of the same theme in `urlPairs()` order, wrapping after the last one. The palette
 * state navigates to it to prove the saved palette survives a navigation (§15 item 2 / D4).
 */
export async function nextPair(pair: UrlPair): Promise<UrlPair> {
  const sameTheme = (allPairs ??= await urlPairs()).filter((p) => p.theme === pair.theme);
  const i = sameTheme.findIndex((p) => p.pageId === pair.pageId);
  if (i < 0) throw new Error(`nextPair: ${pair.theme}/${pair.pageId} is not in the matrix`);
  return sameTheme[(i + 1) % sameTheme.length]!;
}

// ---- The registry -----------------------------------------------------------------------------

export const INTERACTIONS: Record<Exclude<StateName, 'settled'>, Interaction> = {
  /**
   * The mobile shot §9 asks for on the longest delete path (home sequence 0). The path check itself
   * is not special to this state any more — `mastheadReady` runs it on every home and listing
   * capture, and the recorder is installed by `harness/parity.spec.ts` rather than here — so this
   * is the index-0 instance of the same check, kept because §9 asks for the capture and because the
   * evidence file is where the four terminals are recorded side by side.
   */
  'masthead-0': {
    pages: ['home'],
    only: 'mobile-390',
    mastheadIndex: HOME_DELETE_INDEX,
    async run(page, ctx) {
      const terminals = (mastheadFixture ??= masthead()).home.sequences[HOME_DELETE_INDEX]!.terminals.map(
        cleanMastheadText,
      );
      const history = await mastheadHistory(page, MASTHEAD_ELEMENT_IDS.home);
      // Every state the engine passed through that is one of the terminals, in order. The delete
      // path only ever walks back through prefixes, so no terminal can be revisited.
      const seen = history.filter((t) => terminals.includes(t)).filter((t, i, a) => a[i - 1] !== t);
      ctx.evidence.terminals = terminals;
      // Only the terminals, not the raw history: MutationObserver coalesces records, so how many
      // intermediate states a run happens to observe is machine load, not behaviour.
      ctx.evidence.seen = seen;
      expect(seen, 'the delete path passed through every step terminal, in order').toEqual(terminals);
    },
  },

  /**
   * `js/script.js:333` — the click handler only fires for an `li` target, so the dispatch goes to
   * the `li` itself. The end condition is the whole swap chain (`:344-368`, two nested 500 ms
   * timeouts), not just the class flip, plus the bar's own geometry branch.
   */
  'jobs-tab-2': {
    pages: ['home'],
    async run(page, ctx) {
      await dispatchClick(page, '#jobs-menu-list > li.job-menu-item:nth-child(2)');
      await pollUntil(ctx.pageType, 'jobs-tab-2', ctx.deadline, () =>
        page.evaluate(() => {
          const items = [...document.querySelectorAll<HTMLElement>('#jobs-menu-list > li.job-menu-item')];
          if (items.length !== 4) return `${items.length} job items, expected 4`;
          if (!items[1]!.classList.contains('selected')) return 'the 2nd item is not .selected';
          if (items[0]!.classList.contains('selected')) return 'the 1st item is still .selected';
          const showing = [...document.querySelectorAll('.job-content.showing')].map((e) => e.id);
          if (showing.length !== 1 || showing[0] !== 'job-2') return `showing: ${showing.join(', ') || 'none'}`;
          if (!document.getElementById('job-1')?.classList.contains('hidden')) return 'job-1 is not .hidden';
          const midSwap = document.querySelectorAll('.job-out-right, .job-in-right').length;
          if (midSwap) return `${midSwap} panel(s) still mid-swap`;
          return null;
        }),
      );
      const shot = await page.evaluate(() => {
        const hl = document.getElementById('highlight') as HTMLElement;
        const list = document.getElementById('jobs-menu-list') as HTMLElement;
        const target = document.querySelectorAll<HTMLElement>('#jobs-menu-list > li.job-menu-item')[1]!;
        const wrapper = document.querySelector('.menu-scroll-wrapper');
        // script.js:283 `isMobileLayout()`, MOBILE_BREAKPOINT 1100 (script.js:4).
        const mobile = window.innerWidth <= 1100;
        const want =
          mobile ?
            {
              left: `${target.offsetLeft - (wrapper ? wrapper.scrollLeft : 0)}px`,
              width: `${target.offsetWidth}px`,
              top: `${list.offsetTop + list.offsetHeight}px`,
              height: '2px',
              borderRadius: '0',
            }
          : {
              top: `${target.offsetTop}px`,
              height: `${target.offsetHeight}px`,
              left: '-3px',
              width: '3px',
              borderRadius: '6px',
            };
        // Round-trip the expected declarations through a real style object, so `0` is compared as
        // the `0px` the browser stores rather than failing on its own serialization.
        const probe = document.createElement('div');
        Object.assign(probe.style, want);
        const read = (el: HTMLElement) => ({
          left: el.style.left,
          width: el.style.width,
          top: el.style.top,
          height: el.style.height,
          borderRadius: el.style.borderRadius,
        });
        return {
          branch: mobile ? 'mobile' : 'desktop',
          selected: target.getAttribute('data-job'),
          label: (target.textContent ?? '').trim(),
          expected: read(probe),
          highlight: read(hl),
          // moveHighlight(target, true) — the animated branch, which only a click takes.
          transition: hl.style.transition,
        };
      });
      ctx.evidence.jobs = shot;
      expect(shot.selected, 'the 2nd tab is selected').toBe('job-2');
      expect(shot.highlight, `#highlight took the ${shot.branch} branch of script.js:283-301`).toEqual(shot.expected);
      expect(shot.transition, 'moveHighlight ran with animate=true').toBe(
        'top 0.3s, height 0.3s, left 0.3s, width 0.3s, border-radius 0.3s',
      );
    },
  },

  /**
   * `js/featured-carousel.js:274-287` — the dot handler smooth-scrolls the track to the centred
   * card, and the track's own `scroll` listener (`:289-293`) re-derives the active dot from the
   * closest card. Both have to land: the third dot alone active, at a scroll offset at rest.
   */
  'carousel-dot-3': {
    pages: ['home', 'blog'],
    async run(page, ctx) {
      await dispatchClick(page, '#featured-dots > .fc-dot:nth-child(3)');
      // `behavior: 'smooth'` does not move scrollLeft in the frame the click lands in, so a bare
      // two-frame stability check would read the *pre*-scroll position as "at rest". Wait for the
      // scroll to have started and for the track's own listener to have re-derived the dot first.
      await pollUntil(ctx.pageType, 'carousel-dot-3 scroll started', ctx.deadline, () =>
        page.evaluate(() => {
          const track = document.getElementById('featured-track') as HTMLElement;
          if (track.scrollLeft <= 0) return `scrollLeft is still ${track.scrollLeft}`;
          const active = [...document.querySelectorAll('#featured-dots > .fc-dot')].flatMap((d, i) =>
            d.classList.contains('active') ? [i] : [],
          );
          return active.length === 1 && active[0] === 2 ? null : `active dots ${JSON.stringify(active)}`;
        }),
      );
      await holdSteady(
        page,
        ctx.pageType,
        'carousel-dot-3 scrollLeft',
        ctx.deadline,
        'document.getElementById("featured-track").scrollLeft',
        300,
      );
      const shot = await page.evaluate(() => {
        const dots = [...document.querySelectorAll('#featured-dots > .fc-dot')];
        return {
          dots: dots.length,
          active: dots.flatMap((d, i) => (d.classList.contains('active') ? [i] : [])),
          scrollLeft: (document.getElementById('featured-track') as HTMLElement).scrollLeft,
        };
      });
      ctx.evidence.carousel = shot;
      expect(shot.dots, 'eight dots').toBe(8);
      expect(shot.active, 'the third dot is the only active one').toEqual([2]);
      expect(shot.scrollLeft, 'the track scrolled away from its origin').toBeGreaterThan(0);
    },
  },

  /**
   * `js/featured-carousel.js:297-357` — the vertical wheel guard, which a dot click cannot reach.
   * A wheel whose |dy| >= 1.15·|dx| sets `gestureAxis = 'vertical'`, `lockCurrentCard()` adds
   * `is-vertical-wheeling` and pins `lockedLeft` to the centred current card, a rAF restore writes
   * that back onto `scrollLeft` (`:317-325`), and `endGesture` takes the class off 140 ms after the
   * last wheel event. All four are asserted: the class was added *and* removed (from a
   * MutationObserver history, so the transient cannot be missed), the page did scroll vertically,
   * and the track did not move horizontally.
   *
   * **Two gestures, because one cannot make both claims.** With `deltaX: 0` the browser never
   * slides the track sideways in the first place, so `scrollLeft === scrollLeft0` would hold with
   * `restoreLockedLeft` deleted outright — the assertion would be describing an untouched track
   * rather than a pinned one. But a wheel that *does* carry a horizontal component latches the
   * whole gesture to the track, because the track is the nearest node that can scroll on that axis,
   * and the vertical half then never chains to the document. Measured: with `deltaX: 40` seven of
   * eight `default`/`wheatpaste` runs reported `nothing scrolled vertically: scrollY 2667 of 3662,
   * track scrollTop 0 of 0`; the one that passed was `wheatpaste`, the skin whose track has 7px of
   * vertical room of its own to absorb it.
   *
   * So the state sends two, separated by the guard's own 140 ms gesture end (which also expires
   * Chromium's wheel latch):
   *
   * 1. `WHEEL_LOCK_DELTA`, mixed and vertical-by-the-rule. It latches to the track, Chromium slides
   *    `scrollLeft` by 40, and the guard's rAF pulls it back to `lockedLeft`. This is the gesture
   *    that makes `scrollLeft === scrollLeft0` load-bearing: the track had somewhere to go (asserted
   *    as `scrollWidth > clientWidth`) and something put it back.
   * 2. The original pure-vertical wheel, which latches to the document and scrolls the page.
   *
   * The class history spans both, so the transient is still asserted the same way, and the pointer
   * never moves between them — gesture 1 scrolls nothing, so gesture 2's aim is the one the bounds
   * below were computed for.
   *
   * The only state that moves the mouse (§9), which is what makes the cursor follower visible.
   */
  'carousel-wheel': {
    pages: ['home', 'blog'],
    async run(page, ctx) {
      await page.evaluate(() =>
        document.getElementById('featured-track')!.scrollIntoView({ block: 'center', behavior: 'instant' }),
      );
      await afterInteraction(page, ctx.pageType, ctx.deadline);

      await page.evaluate(() => {
        const track = document.getElementById('featured-track')!;
        const history: string[] = [track.className];
        const w = window as unknown as {
          __parityTrackClasses: string[];
          __parityWheels: unknown[];
          __parityAnyWheel: unknown[];
        };
        w.__parityTrackClasses = history;
        new MutationObserver(() => {
          if (history[history.length - 1] !== track.className) history.push(track.className);
        }).observe(track, { attributes: true, attributeFilter: ['class'] });
        // The gesture reaching the guard's own listener is the thing a dot click cannot produce.
        w.__parityWheels = [];
        track.addEventListener(
          'wheel',
          (e) => w.__parityWheels.push({ deltaX: e.deltaX, deltaY: e.deltaY }),
          { passive: true },
        );
        // And a window-level capture, so a wheel that lands somewhere else says where it went.
        w.__parityAnyWheel = [];
        window.addEventListener(
          'wheel',
          (e) => {
            const t = e.target as Element;
            w.__parityAnyWheel.push({ deltaY: e.deltaY, x: e.clientX, y: e.clientY, target: `${t.tagName}.${t.className}` });
          },
          { capture: true, passive: true },
        );
      });
      const before = await page.evaluate(() => {
        const track = document.getElementById('featured-track') as HTMLElement;
        return { scrollLeft: track.scrollLeft, scrollTop: track.scrollTop, scrollY: window.scrollY };
      });

      const box = await page.locator('#featured-track').boundingBox();
      if (!box) throw new Error('#featured-track has no bounding box to aim the wheel at');
      // Chromium scrolls a passive-listener wheel on the compositor and only then dispatches the
      // DOM event, hit-testing it at the **new** offset — measured here: a wheel aimed at the
      // track's centre with deltaY 300 arrived at `<main>`, with the track already 300px higher.
      // So the pointer has to be over the track both before and after the scroll: aim near its top
      // edge, and keep the delta inside what is left below the aim point.
      // The track can also be taller than the viewport (the mobile cards are), so `scrollIntoView`
      // leaves its top off-screen: aim from the visible top edge, not the box's own.
      const viewport = page.viewportSize()!;
      const visibleTop = Math.max(box.y, 0);
      const visibleBottom = Math.min(box.y + box.height, viewport.height);
      const aimY = visibleTop + Math.min(24, (visibleBottom - visibleTop) / 4);
      const deltaY = Math.min(300, Math.floor(box.y + box.height - aimY - 24));
      expect(deltaY, '#featured-track leaves room below the aim point for a wheel').toBeGreaterThanOrEqual(100);
      // Both gestures have to read as vertical to the guard (featured-carousel.js:341).
      expect(
        WHEEL_LOCK_DELTA.y,
        'the lock gesture classifies as vertical: |dy| >= 1.15·|dx|',
      ).toBeGreaterThanOrEqual(WHEEL_LOCK_DELTA.x * 1.15);
      const pointer = { x: box.x + box.width / 2, y: aimY };
      const under = await page.evaluate(
        (p) => {
          const el = document.elementFromPoint(p.x, p.y);
          const track = document.getElementById('featured-track');
          return { at: el ? `${el.tagName}.${el.className}` : 'none', inTrack: !!(el && track?.contains(el)) };
        },
        pointer,
      );
      expect(under.inTrack, `the wheel is aimed inside #featured-track, not at ${under.at}`).toBe(true);
      ctx.evidence.pointer = { ...pointer, ...under, trackHeight: box.height, lock: WHEEL_LOCK_DELTA, deltaY };
      await page.mouse.move(pointer.x, pointer.y);

      // Gesture 1: the lock. The track has horizontal room, so Chromium slides it and the guard's
      // rAF restore is the only thing that can put it back.
      const room = await page.evaluate(() => {
        const track = document.getElementById('featured-track') as HTMLElement;
        return { scrollWidth: track.scrollWidth, clientWidth: track.clientWidth };
      });
      expect(
        room.scrollWidth,
        'the track has somewhere to slide, so pinning it is a real claim',
      ).toBeGreaterThan(room.clientWidth);
      await page.mouse.wheel(WHEEL_LOCK_DELTA.x, WHEEL_LOCK_DELTA.y);
      // The guard's own end (140 ms after the last wheel) — which is also what expires Chromium's
      // wheel latch, so gesture 2 re-hit-tests and can chain to the document.
      await pollUntil(ctx.pageType, 'carousel-wheel lock', ctx.deadline, () =>
        page.evaluate((before) => {
          const track = document.getElementById('featured-track') as HTMLElement;
          const w = window as unknown as { __parityTrackClasses: string[]; __parityWheels: unknown[] };
          if (!w.__parityWheels.length) return 'no wheel event reached #featured-track';
          if (!w.__parityTrackClasses.some((c) => c.includes('is-vertical-wheeling'))) {
            return `the guard never fired: ${JSON.stringify(w.__parityTrackClasses)}`;
          }
          if (track.classList.contains('is-vertical-wheeling')) return 'the lock gesture has not ended yet';
          if (track.scrollLeft !== before.scrollLeft) {
            return `the track stayed at ${track.scrollLeft}, expected the guard to restore ${before.scrollLeft}`;
          }
          return null;
        }, before),
      );
      await holdSteady(
        page,
        ctx.pageType,
        'carousel-wheel lock scrollLeft',
        ctx.deadline,
        'document.getElementById("featured-track").scrollLeft',
        200,
      );

      // Gesture 2: the page scroll, pure vertical so it latches to the document rather than to the
      // track. Nothing has moved since the aim was computed, so the pointer is still on target.
      await page.mouse.wheel(0, deltaY);

      ctx.deadline = Date.now() + SETTLE_TIMEOUT_MS;
      await pollUntil(ctx.pageType, 'carousel-wheel', ctx.deadline, () =>
        page.evaluate((before) => {
          const track = document.getElementById('featured-track') as HTMLElement;
          const w = window as unknown as { __parityTrackClasses: string[]; __parityWheels: unknown[]; __parityAnyWheel: unknown[] };
          if (!w.__parityWheels.length) {
            return `no wheel event reached #featured-track (window saw ${JSON.stringify(w.__parityAnyWheel)})`;
          }
          if (!w.__parityTrackClasses.some((c) => c.includes('is-vertical-wheeling'))) {
            return `the guard never fired: ${JSON.stringify(w.__parityTrackClasses)}`;
          }
          if (track.classList.contains('is-vertical-wheeling')) return 'the gesture has not ended yet';
          // The gesture's vertical component has to have gone somewhere. Usually that is the
          // page, but `overflow-x: auto` computes `overflow-y` to `auto` as well, so a skin whose
          // cards overrun the track box gives the track its own vertical room and Chromium latches
          // the gesture there instead of chaining to the document (`wheatpaste`: 7px of it, with
          // 3964px of page still below). Either is the baseline behaving as a user would see it.
          if (window.scrollY <= before.scrollY && track.scrollTop <= before.scrollTop) {
            const doc = document.scrollingElement!;
            return (
              `nothing scrolled vertically: scrollY ${window.scrollY} of ${doc.scrollHeight - innerHeight}, ` +
              `track scrollTop ${track.scrollTop} of ${track.scrollHeight - track.clientHeight}`
            );
          }
          if (track.scrollLeft !== before.scrollLeft) {
            return `the track slid to ${track.scrollLeft}, expected ${before.scrollLeft}`;
          }
          return null;
        }, before),
      );
      await holdSteady(
        page,
        ctx.pageType,
        'carousel-wheel scroll',
        ctx.deadline,
        'window.scrollY + "/" + document.getElementById("featured-track").scrollTop',
        300,
      );
      // The follower now eases toward a real point instead of the origin. It approaches
      // asymptotically and the two sides stop on different frames, so wait for it to converge to
      // two decimals; `canonicalizeCursorFollower` rounds the remaining tail to one.
      await holdSteady(
        page,
        ctx.pageType,
        'cursor follower',
        ctx.deadline,
        '[...document.querySelectorAll(".cursor-follow,.circle-follow")]' +
          '.map((e) => [e.style.left, e.style.top].map((v) => parseFloat(v).toFixed(2)).join(","))',
        200,
      );

      const shot = await page.evaluate(
        ({ before, lock, deltaY }) => {
          const track = document.getElementById('featured-track') as HTMLElement;
          const w = window as unknown as { __parityTrackClasses: string[]; __parityWheels: unknown[] };
          return {
            wheels: w.__parityWheels,
            classHistory: w.__parityTrackClasses,
            scrollLeft0: before.scrollLeft,
            scrollLeft: track.scrollLeft,
            scrollY0: before.scrollY,
            scrollY: window.scrollY,
            scrollTop0: before.scrollTop,
            scrollTop: track.scrollTop,
            scrollWidth: track.scrollWidth,
            clientWidth: track.clientWidth,
            lock,
            deltaY,
          };
        },
        { before, lock: WHEEL_LOCK_DELTA, deltaY },
      );
      ctx.evidence.wheel = shot;
      expect(shot.wheels.length, 'both wheel gestures reached the track listener').toBe(2);
      expect(
        shot.classHistory.some((c) => c.includes('is-vertical-wheeling')),
        'the vertical wheel guard latched',
      ).toBe(true);
      expect(shot.classHistory.at(-1), 'the gesture ended and the class came off').not.toContain(
        'is-vertical-wheeling',
      );
      expect(
        shot.scrollLeft,
        `the guard pinned the track against a ${WHEEL_LOCK_DELTA.x}px horizontal push`,
      ).toBe(shot.scrollLeft0);
      expect(
        shot.scrollY > shot.scrollY0 || shot.scrollTop > shot.scrollTop0,
        'the gesture scrolled vertically instead — the page, or the track box on a skin that gives it height',
      ).toBe(true);
    },
  },

  /**
   * `js/nav-config.js:145-163` — `.moving-menu` becomes sticky only while scrolling **up** past
   * `SCROLL_THRESHOLD` (300), so the state has to scroll down first and then back. `quiesce: false`
   * because the shared tail would dispatch a synthetic `scroll` at the same offset and the handler
   * would read that as "not scrolling up" and undo it.
   */
  'sticky-nav': {
    pages: ['home', 'blog', 'post'],
    quiesce: false,
    async run(page, ctx) {
      await scrollWindowTo(page, ctx.pageType, ctx.deadline, 800);
      const down = await page.evaluate(() => window.scrollY);
      expect(down, 'the page is tall enough to scroll to 800').toBe(800);
      await scrollWindowTo(page, ctx.pageType, ctx.deadline, 500);
      await pollUntil(ctx.pageType, 'sticky-nav', ctx.deadline, () =>
        page.evaluate(() => {
          const menu = document.querySelector('.moving-menu');
          if (!menu) return '.moving-menu is missing';
          if (!menu.classList.contains('menu-sticky')) return `.moving-menu is ${JSON.stringify(menu.className)}`;
          if (menu.classList.contains('menu-invisible')) return '.moving-menu is still menu-invisible';
          return null;
        }),
      );
      const shot = await page.evaluate(() => ({
        classes: document.querySelector('.moving-menu')!.className,
        scrollY: window.scrollY,
      }));
      ctx.evidence.sticky = shot;
      expect(shot.scrollY, 'came to rest at 500').toBe(500);
    },
  },

  /**
   * `js/script.js:213-251` — the jQuery smooth scroll, on the one hash whose offset branch is 80.
   * Home only: `a.menu-item[href="#contact"]` exists nowhere else (on a subpage the nav authors
   * `../index.html#contact`, a real navigation), and `js/script.js` is a home-only script.
   * Desktop only: `MOBILE_NAV_LINKS` (`js/nav-config.js:16-20`) has no Contact item at all.
   */
  'smooth-scroll-contact': {
    pages: ['home'],
    only: 'desktop-1440',
    async run(page, ctx) {
      ctx.evidence.primedSteps = await primeReveals(page, ctx.pageType);
      ctx.deadline = Date.now() + SETTLE_TIMEOUT_MS;
      const target = await page.evaluate(() => {
        const el = document.getElementById('contact')!;
        const doc = document.scrollingElement!;
        const wanted = el.getBoundingClientRect().top + window.scrollY - 80;
        const max = doc.scrollHeight - window.innerHeight;
        return { wanted, max, expected: Math.min(wanted, max) };
      });
      const startY = await page.evaluate(() => window.scrollY);
      await dispatchClick(page, '.static-menu a.menu-item[href="#contact"]');
      // jQuery's animate ends on a timer, not an event; 300 ms at the landing offset is the end of
      // it. Two things are *not* rest and restart the window rather than accumulating it: the
      // pre-first-tick offset (jQuery's easing starts on a timer, so "unchanged" is not "arrived"),
      // and any offset that is not the landing one.
      await holdSteady(page, ctx.pageType, 'smooth-scroll-contact', ctx.deadline, 'window.scrollY', 300, (v) => {
        const y = Number(v);
        if (y === startY && target.expected !== startY) return `scrollY has not left ${startY} yet`;
        return Math.abs(y - target.expected) > 1 ? `scrollY is ${y}, expected ${target.expected}` : null;
      });
      // `section-header-in` follows an IntersectionObserver, which delivers a frame or two after
      // the scroll comes to rest; hold the reveal state still so the capture cannot beat it.
      await holdSteady(
        page,
        ctx.pageType,
        'smooth-scroll-contact reveals',
        ctx.deadline,
        '[...document.querySelectorAll(".section-header-wrapper")]' +
          '.map((e) => e.className + "|" + e.style.getPropertyValue("--section-rule")).join(" ")',
        300,
      );
      const shot = await page.evaluate(() => ({
        scrollY: window.scrollY,
        rectTop: document.getElementById('contact')!.getBoundingClientRect().top,
      }));
      ctx.evidence.smoothScroll = { ...target, ...shot, clamped: target.expected < target.wanted };
      // The `#contact` branch of script.js:224-235 is offset 80, which is the whole point of the
      // state; when the document is too short to honour it the scroll clamps, and the assertion
      // above (rest at the clamped target) is what still pins the landing.
      if (target.expected >= target.wanted) {
        expect(Math.abs(shot.rectTop - 80), '#contact came to rest 80px below the viewport top').toBeLessThanOrEqual(1);
      }
    },
  },

  /**
   * `js/theme-cycler.js:686-696` — the trigger's own click handler, `open(li, true)`. Asserted on
   * whichever menu the viewport renders, so the mobile row's icon trigger is exercised too.
   */
  'picker-open': {
    pages: ['home', 'blog', 'post'],
    async run(page, ctx) {
      ctx.evidence.picker = await openPicker(page, ctx);
    },
  },

  /**
   * `blog/blog-listing.js:98-170` — the tag pills. Which cards stay is derived from the frozen
   * `BLOG_POSTS` registry, not read back off the page, so a filter that hid the wrong cards would
   * fail here rather than agree with itself.
   */
  'filter-swift': {
    pages: ['blog'],
    async run(page, ctx) {
      // blog-listing.js:130 rewrites a local post's `blog/…` url relative to the listing.
      const expected = content().blogPosts.map((post) => {
        const url = post.url as string;
        const tags = (post.tags as string[] | undefined) ?? [];
        return {
          id: post.id,
          href: post.external === true ? url : url.startsWith('blog/') ? url.replace('blog/', '') : url,
          filteredOut: !tags.includes('Swift'),
        };
      });
      await dispatchClick(page, '#filter-bar .filter-pill[data-tag="Swift"]');
      await pollUntil(ctx.pageType, 'filter-swift', ctx.deadline, () =>
        page.evaluate((expected) => {
          const pill = document.querySelector('#filter-bar .filter-pill[data-tag="Swift"]');
          if (!pill?.classList.contains('active')) return 'the Swift pill is not .active';
          const wrappers = [...document.querySelectorAll('#blog-grid > .blog-card-wrapper')];
          if (wrappers.length !== expected.length) {
            return `${wrappers.length} cards, expected ${expected.length}`;
          }
          for (let i = 0; i < expected.length; i++) {
            const want = expected[i]!;
            const href = wrappers[i]!.querySelector('a.blog-card')?.getAttribute('href');
            if (href !== want.href) return `card ${i} links to ${href}, expected ${want.href}`;
            const out = wrappers[i]!.classList.contains('filtered-out');
            if (out !== want.filteredOut) return `${want.id} filtered-out=${out}, expected ${want.filteredOut}`;
          }
          return null;
        }, expected),
      );
      ctx.evidence.filter = expected.map(({ id, filteredOut }) => ({ id, filteredOut }));
    },
  },

  /**
   * §15 item 2 and D4's pre-paint override, the only state that navigates. Shuffle in the open
   * dock, capture that, then walk the baseline's persistence rules: a saved palette survives a
   * **navigation** (`js/theme-bootstrap.js:733-740` reads the key back before first paint) and is
   * cleared by a **reload** (`:731` removes it in the `isReload` branch, `js/theme-cycler.js:749`
   * again once the cycler boots).
   */
  palette: {
    pages: ['home', 'blog', 'post'],
    async run(page, ctx) {
      const key = storageKey();
      const base = await readRoles(page);
      ctx.evidence.storageKey = key;
      ctx.evidence.base = base;
      ctx.evidence.picker = await openPicker(page, ctx);

      await dispatchClick(page, '#tc-randomize');
      await pollUntil(ctx.pageType, 'palette shuffle', ctx.deadline, () =>
        page.evaluate(
          ({ roles, base, key }) => {
            const style = document.documentElement.style;
            const now = Object.fromEntries(roles.map((r) => [r, style.getPropertyValue(r)]));
            if (roles.every((r) => now[r] === base[r])) return 'the roles have not moved off the theme palette';
            if (!sessionStorage.getItem(key)) return `sessionStorage has no ${key}`;
            return null;
          },
          { roles: [...ROLE_TOKENS], base, key },
        ),
      );
      await holdSteady(
        page,
        ctx.pageType,
        'palette roles',
        ctx.deadline,
        `[${ROLE_TOKENS.map((r) => JSON.stringify(r)).join(',')}].map((r) => document.documentElement.style.getPropertyValue(r))`,
        150,
      );

      // The palette the page starts on is the theme's own, byte for byte with the frozen capture.
      expect(base, `${ctx.pair.theme} starts on its theme-html.json roles`).toEqual(fixtureRoles(ctx.pair.theme));

      const shuffled = await readRoles(page);
      ctx.evidence.shuffled = shuffled;
      ctx.evidence.storageAfterShuffle = await page.evaluate((k) => sessionStorage.getItem(k), key);
      expect(shuffled, 'the shuffle moved the palette off the theme base').not.toEqual(base);
    },
    async after(page, ctx) {
      const key = storageKey();
      const base = ctx.evidence.base as Record<string, string>;
      const shuffled = ctx.evidence.shuffled as Record<string, string>;
      const next = await nextPair(ctx.pair);

      await recordFirstPaint(page, key, ROLE_TOKENS);
      // The destination is a different page type, so it draws its own masthead: give it the seed
      // the settled matrix loads it under, or its readiness predicate would be asserting a
      // sequence this page's seed never picks.
      await installDeterminism(page, seedForPage(next.page));

      // The destination on **this** side. Under `old-old` the two paths are the same string; under
      // `old-new` they are not, and following `oldPath` on the migrated side would 404 against
      // `dist` — the S1-13 trap this state would otherwise walk straight into.
      const path = ctx.side === 'old' ? next.oldPath : next.newPath;
      await page.goto(ctx.origin + path, { waitUntil: 'load' });
      // Recorded as the pair's own id, not as `path`: the evidence is compared `toEqual` across the
      // two sides, and the destination is the same *page* on both however its URL is spelled.
      const navigate = { to: next.pageId, ...(await landing(page, next.page, key)) };
      ctx.evidence.navigate = navigate;

      await page.reload({ waitUntil: 'load' });
      const reload = await landing(page, next.page, key);
      ctx.evidence.reload = reload;

      // A navigation keeps the toy: the bootstrap reads the saved colors back before first paint.
      expect(navigate.firstPaint, 'the saved palette is applied pre-paint after a navigation').toEqual(shuffled);
      expect(navigate.settled, 'and the cycler leaves it in place').toEqual(shuffled);
      expect(
        JSON.parse(navigate.firstPaintStorage ?? 'null')?.colors,
        'the saved colors are the shuffled ones',
      ).toEqual(ROLE_TOKENS.map((r) => shuffled[r]));

      if (reloadOutcome(ctx.mode, ctx.side) === 'persist') {
        expect(JSON.parse(reload.firstPaintStorage ?? 'null')?.colors, 'the migrated reload keeps the saved colors before paint')
          .toEqual(ROLE_TOKENS.map((role) => shuffled[role]));
        expect(reload.firstPaint, 'the migrated reload paints the saved palette first').toEqual(shuffled);
        expect(reload.settled, 'the migrated runtime leaves the saved palette in place').toEqual(shuffled);
      } else {
        expect(reload.firstPaintStorage, 'the legacy reload clears the session key before paint').toBe(null);
        expect(reload.firstPaint, 'the legacy reload paints the theme base').toEqual(base);
        expect(reload.settled, 'the legacy runtime re-applies the theme base').toEqual(base);
      }
    },
  },
};

/** `settled` first, then every state this pair's page type has an element for. */
export function statesFor(pair: UrlPair): Array<{ name: StateName; only?: ProjectName }> {
  const states: Array<{ name: StateName; only?: ProjectName }> = [{ name: 'settled' }];
  for (const [name, spec] of Object.entries(INTERACTIONS) as Array<[StateName, Interaction]>) {
    if (spec.pages.includes(pair.page)) states.push({ name, ...(spec.only ? { only: spec.only } : {}) });
  }
  return states;
}
