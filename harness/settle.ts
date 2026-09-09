/**
 * Spec 1 §9 `settle(page, pageType)`: four generic waits plus the page type's readiness predicate,
 * under one 15 s deadline. Never skips: an expiry throws with the page type, the step and the
 * detail that was still outstanding. `afterInteraction()` is the same tail, re-run after an
 * interaction state's own end condition. Consumers: harness/parity.spec.ts, harness/interactions.ts.
 */
import type { Page } from '@playwright/test';
import { parityReducedMotion } from './motion.ts';
import {
  postAssetsSettled,
  pollUntil,
  quiesceLayout,
  sectionRuleStable,
  sentinels,
  SETTLE_TIMEOUT_MS,
} from './sentinels.ts';
import type { PageType } from './urls.ts';

/** `mastheadIndex` names the sequence the caller seeded for; readiness asserts that one exactly. */
export interface SettleOptions {
  mastheadIndex?: number;
}

/**
 * AOS's largest `offset` on this site: `js/script.js:212` takes the library default of 120 and
 * `blog/blog-listing.js:178` passes 50, and no element overrides it with `data-aos-offset`.
 */
const AOS_OFFSET = 120;

/**
 * Every `[data-aos]` AOS's own rule has certainly triggered carries `aos-animate`. AOS animates an
 * element once its top clears `innerHeight - offset` (`aos.js` `getPositionIn`), so an element
 * whose top is still inside that bottom band is one AOS has *not* been asked to reveal yet — a
 * state a scroll interaction lands in routinely, and waiting for it would be waiting forever.
 * Nothing is excluded from the comparison: `aos-animate` is compared verbatim in the DOM dump on
 * both sides, and `noRunningAnimation` below is what catches a reveal that did start.
 */
function aosSettled(page: Page, pageType: PageType, deadline: number): Promise<void> {
  return pollUntil(pageType, 'aos', deadline, () =>
    page.evaluate((offset) => {
      const pending = [...document.querySelectorAll('[data-aos]')].filter((el) => {
        const r = el.getBoundingClientRect();
        const inView = r.bottom > 0 && r.top < innerHeight - offset && r.right > 0 && r.left < innerWidth;
        return inView && !el.classList.contains('aos-animate');
      });
      if (!pending.length) return null;
      const named = pending
        .slice(0, 3)
        .map((el) => {
          const r = el.getBoundingClientRect();
          return `${el.tagName}#${el.id}.${el.className} @${Math.round(r.top)}..${Math.round(r.bottom)}`;
        })
        .join('; ');
      return `${pending.length} in-view [data-aos] without aos-animate (scrollY ${Math.round(scrollY)}): ${named}`;
    }, AOS_OFFSET),
  );
}

/**
 * No font is loading. `document.fonts.status` is `'loading'` exactly while some `FontFace` is in
 * flight, and `fonts.ready` settles a microtask after it flips, so the pair is one question asked
 * two ways; `fonts.ready` is raced against a short timer so a single poll can never hang on it.
 *
 * This is the fonts half of `settle()` step 2b on its own, without the stylesheet-count window: by
 * the time an interaction has run, the `<head>` has long stopped moving, but a **glyph** may only
 * just have been asked for. `.tc-hidden` is `display:none`, so the picker's preset rows — one
 * heading webfont per theme row, `css/theme-cycler.css:231` — are laid out for the very first time
 * when the dock opens, and the faces they need start downloading at that moment. Until they land,
 * every `.menu-item` on the page (the nav included) is measured in the fallback.
 */
function fontsSettled(page: Page, pageType: PageType, deadline: number): Promise<void> {
  return pollUntil(pageType, 'fonts', deadline, () =>
    page.evaluate(async () => {
      const ready = await Promise.race([
        document.fonts.ready.then(() => true),
        new Promise<boolean>((r) => setTimeout(() => r(false), 50)),
      ]);
      if (ready && document.fonts.status === 'loaded') return null;
      const loading = [...document.fonts].filter((f) => f.status === 'loading').length;
      return `document.fonts ready=${ready} status=${document.fonts.status} loading=${loading}`;
    }),
  );
}

/**
 * No running finite animation. Infinite ones (marquee tickers and the caret blink) are cancelled by
 * the screenshot's `animations: 'disabled'` instead. `getAnimations()` includes CSSTransitions, so
 * this is also what settles an interaction's transitions (the jobs bar, a filtered card).
 */
function noRunningAnimation(page: Page, pageType: PageType, deadline: number): Promise<void> {
  return pollUntil(pageType, 'animations', deadline, () =>
    page.evaluate(() => {
      const running = document
        .getAnimations()
        .filter((a) => a.playState === 'running' && Number.isFinite(a.effect?.getTiming().iterations ?? Infinity));
      return running.length ? `${running.length} running finite animation(s)` : null;
    }),
  );
}

export async function settle(page: Page, pageType: PageType, opts?: SettleOptions): Promise<void> {
  const deadline = Date.now() + SETTLE_TIMEOUT_MS;

  // 1. load
  await page.waitForLoadState('load', { timeout: Math.max(1, deadline - Date.now()) });
  const expectedReduced = parityReducedMotion() === 'reduce';
  const actualReduced = await page.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches);
  if (actualReduced !== expectedReduced) {
    throw new Error(
      `settle(${pageType}) received prefers-reduced-motion=${actualReduced ? 'reduce' : 'no-preference'}, ` +
        `expected ${expectedReduced ? 'reduce' : 'no-preference'}`,
    );
  }

  // 2a. An idle fence. The cycler queues loadAllFonts with requestIdleCallback({timeout: 2500})
  //     at theme-cycler.js:762, which runs before `load`, so an idle callback queued after `load`
  //     runs after it and the font links it appends are already in the document when the
  //     stability window below starts. Registry-free, so it behaves the same on the migrated side.
  await page.evaluate(
    () =>
      new Promise((r) =>
        'requestIdleCallback' in window ?
          requestIdleCallback(() => r(undefined), { timeout: 2600 })
        : setTimeout(r, 2600),
      ),
  );

  // 2b. stylesheet count stable for 500 ms and fonts loaded.
  let lastSheets = -1;
  let stableSince = Date.now();
  await pollUntil(pageType, 'stylesheets+fonts', deadline, async () => {
    const probe = await page.evaluate(async () => {
      // fonts.ready settles a microtask after status flips; race it so one poll cannot hang.
      const fontsReady = await Promise.race([
        document.fonts.ready.then(() => true),
        new Promise<boolean>((r) => setTimeout(() => r(false), 50)),
      ]);
      return {
        sheets: document.head.querySelectorAll('link[rel="stylesheet"]').length,
        fontsReady,
        fontStatus: document.fonts.status,
      };
    });
    if (probe.sheets !== lastSheets) {
      lastSheets = probe.sheets;
      stableSince = Date.now();
    }
    const stableFor = Date.now() - stableSince;
    if (stableFor < 500) return `<head> stylesheet count ${probe.sheets} stable for only ${stableFor}ms`;
    if (!probe.fontsReady || probe.fontStatus !== 'loaded') {
      return `document.fonts ready=${probe.fontsReady} status=${probe.fontStatus}`;
    }
    return null;
  });

  // 3. every in-viewport [data-aos] has aos-animate
  await aosSettled(page, pageType, deadline);

  // 4. no running finite animation
  await noRunningAnimation(page, pageType, deadline);

  // 5. the page type's own readiness predicate
  await sentinels[pageType].ready(page, deadline, opts);

  // 4 again: readiness itself starts finite animations (the home and listing reveals fire off the
  // masthead callbacks), so a first pass before step 5 does not settle them.
  await noRunningAnimation(page, pageType, deadline);
}

/**
 * The shared tail of every interaction state (S1-03): once the state's own end condition holds,
 * bring the page back to the same class of rest `settle()` leaves behind. Deliberately **not** a
 * second `settle()`: the masthead and carousel readiness predicates describe the page as loaded,
 * and an interaction is allowed to move what they pin (the active dot, the selected job).
 *
 * `quiesce: false` is for a state whose end condition **is** a scroll position. `quiesceLayout`
 * dispatches the page's own `scroll` handlers to re-seat layout-derived values, and
 * `nav-config.js:149` decides `.moving-menu`'s stickiness from `scrollY < lastScrollTop` — after a
 * real scroll those two are already equal, so a synthetic event reads as "not scrolling up" and
 * would undo the very class the state asserts. Such a state has already run every scroll handler
 * at its final position, for real, which is what the quiesce exists to simulate.
 *
 * The fonts wait runs **first**, before the quiesce, and that order is load-bearing. An interaction
 * can be what asks for a glyph in the first place — opening the picker renders sixteen preset rows
 * out of `display:none`, each in its own theme's heading font — and a face that swaps in afterwards
 * re-measures every `.menu-item` on the page. `quiesceLayout`'s synthetic `window` scroll is picked
 * up by the cycler's own `reanchor` (`theme-cycler.js:681-683`), which re-runs `position()` and
 * rewrites `--tc-mega-w` from the live `.static-menu` width — so quiescing before the swap records
 * the fallback measurement and quiescing after it records the real one. Measured on
 * `marquee/home @state:picker-open`: 658px against 631px, with the nav shifted 27px in the
 * screenshot to match.
 */
export async function afterInteraction(
  page: Page,
  pageType: PageType,
  deadline: number,
  opts: { quiesce?: boolean } = {},
): Promise<void> {
  await fontsSettled(page, pageType, deadline);
  if (opts.quiesce !== false) await quiesceLayout(page);
  await aosSettled(page, pageType, deadline);
  await noRunningAnimation(page, pageType, deadline);
  if (pageType === 'home' || pageType === 'blog') await sectionRuleStable(page, pageType, deadline);
  // The palette shuffle redraws a Plotly post through `dawson:palette`, 150 ms after the click.
  if (pageType === 'post') await postAssetsSettled(page, pageType, deadline);
}
