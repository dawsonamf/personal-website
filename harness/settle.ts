/**
 * Spec 1 §9 `settle(page, pageType)`: four generic waits plus the page type's readiness predicate,
 * under one 15 s deadline. Never skips: an expiry throws with the page type, the step and the
 * detail that was still outstanding. Consumers: harness/parity.spec.ts (S1-03 adds states).
 */
import type { Page } from '@playwright/test';
import { pollUntil, sentinels, SETTLE_TIMEOUT_MS } from './sentinels.ts';
import type { PageType } from './urls.ts';

export async function settle(page: Page, pageType: PageType): Promise<void> {
  const deadline = Date.now() + SETTLE_TIMEOUT_MS;

  // 1. load
  await page.waitForLoadState('load', { timeout: Math.max(1, deadline - Date.now()) });

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
  await pollUntil(pageType, 'aos', deadline, () =>
    page.evaluate(() => {
      const pending = [...document.querySelectorAll('[data-aos]')].filter((el) => {
        const r = el.getBoundingClientRect();
        const inView = r.bottom > 0 && r.top < innerHeight && r.right > 0 && r.left < innerWidth;
        return inView && !el.classList.contains('aos-animate');
      });
      return pending.length ? `${pending.length} in-view [data-aos] without aos-animate` : null;
    }),
  );

  // 4. no running finite animation (infinite ones, marquee tickers and the caret, are cancelled
  //    by the screenshot's animations:'disabled' instead).
  const noRunningAnimation = (): Promise<void> =>
    pollUntil(pageType, 'animations', deadline, () =>
      page.evaluate(() => {
        const running = document
          .getAnimations()
          .filter((a) => a.playState === 'running' && Number.isFinite(a.effect?.getTiming().iterations ?? Infinity));
        return running.length ? `${running.length} running finite animation(s)` : null;
      }),
    );
  await noRunningAnimation();

  // 5. the page type's own readiness predicate
  await sentinels[pageType].ready(page, deadline);

  // 4 again: readiness itself starts finite animations (the home and listing reveals fire off the
  // masthead callbacks), so a first pass before step 5 does not settle them.
  await noRunningAnimation();
}
