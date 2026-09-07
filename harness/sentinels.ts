/**
 * Spec 1 §9's 12 computed-style sentinels per page type, the screenshot policy that goes with
 * them, and each page type's readiness predicate. Line refs are `personal-website-old` at the
 * baseline SHA. Selector substitutions on the utility pages are documented in
 * `harness/fixtures/baseline/README.md`. Consumers: harness/settle.ts, harness/parity.spec.ts.
 */
import type { Page } from '@playwright/test';
import { masthead } from './baseline.ts';
import type { MastheadFixture } from './baseline.ts';
import { cleanMastheadText, MASTHEAD_ELEMENT_IDS, MASTHEAD_INDEX } from './determinism.ts';
import type { PageType } from './urls.ts';

export const SETTLE_TIMEOUT_MS = 15_000;

/**
 * The five colour roles, in registry order (`theme-bootstrap.js:766`). §9 check 3 unions them into
 * the computed-style sample and `@state:palette` reads them off `<html>`; one definition, imported
 * by both, so the sample and the palette record can never drift apart.
 */
export const ROLE_TOKENS = ['--text', '--bg', '--primary', '--secondary', '--accent'] as const;

/**
 * Poll `probe` every 100 ms until it returns null; a returned string is the outstanding detail
 * and becomes the failure message at the deadline. Never skips. Shared by `settle()`'s generic
 * waits and by every `ready()` below, so one deadline covers the whole settle.
 */
export async function pollUntil(
  pageType: PageType,
  step: string,
  deadline: number,
  probe: () => Promise<string | null>,
): Promise<void> {
  let detail = 'no probe result yet';
  while (Date.now() < deadline) {
    detail = (await probe()) ?? '';
    if (!detail) return;
    await new Promise((r) => setTimeout(r, 100));
  }
  throw new Error(`settle(${pageType}) hit its ${SETTLE_TIMEOUT_MS}ms deadline in ${step}: ${detail}`);
}

/**
 * Poll until a page-side value has been the same for `ms` milliseconds, and return it. `expr` is
 * either source text (composed per state; harness-authored, never page content) or a page function.
 *
 * `reject` is the "not eligible to be at rest yet" half: a value it names a reason for restarts the
 * window instead of accumulating it, which is what keeps "the scroll has not started yet" and "the
 * chart has not drawn yet" from passing as a steady value. It runs host-side on the stringified
 * value, so a state composes it in TypeScript rather than smuggling it into `expr`.
 *
 * A two-frame window is deliberately **not** offered. It is too short for everything that matters
 * here: Chromium's programmatic smooth scroll eases in sub-pixel steps, so two consecutive frames
 * can report the same `scrollLeft` while the animation is still running (measured — one side
 * stopped at 2421 and the other at 2419 on the same dot click); an IntersectionObserver callback
 * and a debounced redraw are delivered on their own schedule, not every frame.
 */
export async function holdSteady(
  page: Page,
  pageType: PageType,
  step: string,
  deadline: number,
  expr: string | (() => unknown),
  ms: number,
  reject?: (value: string) => string | null,
): Promise<string> {
  let last: string | null = null;
  let since = Date.now();
  let held = '';
  await pollUntil(pageType, step, deadline, async () => {
    const now =
      typeof expr === 'string' ?
        await page.evaluate((src) => String((new Function(`return (${src});`) as () => unknown)()), expr)
      : String(await page.evaluate(expr));
    const why = reject?.(now) ?? null;
    if (why) {
      last = null;
      return why;
    }
    if (now !== last) {
      last = now;
      since = Date.now();
    }
    held = now;
    const elapsed = Date.now() - since;
    return elapsed >= ms ? null : `${now} held for only ${elapsed}ms of ${ms}ms`;
  });
  return held;
}

export interface SentinelSpec {
  /** Exactly 12, each matching exactly one element on that page type (asserted per side). */
  selectors: string[];
  /** Screenshot masks: the typing masthead is masked and asserted as text instead (§9 check 2). */
  mask: string[];
  /** The element whose textContent is compared across sides, when the page type has one. */
  masthead?: string;
  fullPage: boolean;
  /** `mastheadIndex` names the sequence the run seeded for; states that pin another one pass it. */
  ready(page: Page, deadline: number, opts?: { mastheadIndex?: number }): Promise<void>;
}

/** Re-deriving the fixture vm-executes a baseline file, and readiness runs twice per test. */
let fixture: MastheadFixture | null = null;

/**
 * Every step terminal of one sequence, in order, with the `\n` the engine turns into `<br>` removed
 * (`cleanMastheadText`, the same cleaner the page-side recorder runs). The index is pinned rather
 * than the seed (`harness/determinism.ts`), so readiness asserts the sequence the run intended.
 */
export function intendedTerminals(pageType: 'home' | 'blog', index: number): string[] {
  const sequences = (fixture ??= masthead())[pageType].sequences;
  const sequence = sequences[index];
  if (!sequence) throw new Error(`masthead.${pageType} has no sequence ${index} (${sequences.length} exist)`);
  if (!sequence.terminals.length) throw new Error(`masthead.${pageType}.sequences[${index}] types nothing`);
  return sequence.terminals.map(cleanMastheadText);
}

/**
 * Every step terminal **any** of the page's sequences lands on — the alphabet the observed path is
 * read in, and the reason the path check is not vacuous. Filtering the history by the *pinned*
 * sequence's own terminals would let four of home's nine sequences through under the index-3 pin
 * (0, 1, 5 and 7 all end on `software engineer.`, and that is the only terminal index 3 has, so
 * the filter would see one entry and be satisfied). Filtering by the page's whole terminal set
 * keeps their earlier terminals — `web developer.`, `full stack engineer.`, `builder.` — in the
 * observed path, where they no longer match. Verified against the fixture: for all 16 sequences
 * across both pages this filter reproduces exactly that sequence's own terminal list, so it can
 * never fail a legitimate run, and no wrong pick survives it under either pin.
 */
function pageTerminals(pageType: 'home' | 'blog'): string[] {
  const sequences = (fixture ??= masthead())[pageType].sequences;
  return [...new Set(sequences.flatMap((s) => s.terminals.map(cleanMastheadText)))];
}

/**
 * The masthead has finished the seeded sequence (`typing-engine.js:165`), the caret is in its end
 * state (`:367-370` blinks once the last step runs out) — and it got there **by that sequence's own
 * path**.
 *
 * The final text alone is very nearly vacuous as an identity check: home sequences 0, 1, 3, 5 and 7
 * all end on `Hi,\nI'm Dawson,\nsoftware engineer.` and all seven listing sequences end on `Blog.`,
 * so a wrong seed, a wrong `MASTHEAD_DRAW` or a wrong `MASTHEAD_INDEX` would sail through it on
 * every page but the one mobile `masthead-0` capture. The observed path is what pins the index:
 * `recordMastheadHistory` (installed on every home and listing capture, both sides) records every
 * distinct text the element passed through, and the recorded texts that are step terminals *of any
 * sequence on the page* (`pageTerminals`), deduped, in order, must be exactly this sequence's
 * terminals. `@state:masthead-0` is the index-0 instance of this same check, kept as a state
 * because §9 asks for a mobile capture on the longest delete path.
 */
async function mastheadReady(
  page: Page,
  pageType: 'home' | 'blog',
  deadline: number,
  index: number,
): Promise<void> {
  const elementId = MASTHEAD_ELEMENT_IDS[pageType];
  const terminals = intendedTerminals(pageType, index);
  const alphabet = pageTerminals(pageType);
  const wanted = terminals[terminals.length - 1]!;
  await pollUntil(pageType, 'masthead', deadline, () =>
    page.evaluate(
      ({ elementId, wanted, terminals, alphabet }) => {
        const el = document.getElementById(elementId);
        if (!el) return `#${elementId} is missing`;
        // The engine inserts <br> for "\n"; the cursorless anchor carries a zero-width space.
        const text = (el.textContent ?? '').replace(/\u200B/g, '');
        if (text !== wanted) {
          return `masthead text ${JSON.stringify(text)}, expected the seeded sequence's ${JSON.stringify(wanted)}`;
        }
        const anchors = el.querySelectorAll(':scope > span.cursor, :scope > span.tw-anchor');
        if (anchors.length !== 1) return `${anchors.length} typing anchors, expected 1`;
        const anchor = anchors[0]!;
        // typing-engine.js:170-177, only the cursor mode gets `.cursor` and the inline blink
        // (`:316-318`). Eight registry themes pick a cursorless `typing` mode and get `.tw-anchor`,
        // which the engine never animates, so `blink` is asserted on the mode that has it.
        if (anchor.classList.contains('cursor')) {
          const name = getComputedStyle(anchor).animationName;
          if (name !== 'blink') return `caret animation-name is ${name}, expected blink`;
        }
        const history = (window as unknown as { __parityMastheadHistory?: Record<string, string[]> })
          .__parityMastheadHistory?.[elementId];
        if (!history) return `no masthead history for #${elementId}: recordMastheadHistory did not run`;
        // Every state the engine passed through that is a step terminal of *some* sequence on this
        // page, in order. The delete steps only ever walk back through prefixes, and no sequence's
        // terminal is a prefix of another's, so nothing spurious can land in here.
        const seen = history.filter((t) => alphabet.includes(t)).filter((t, i, a) => a[i - 1] !== t);
        if (seen.join('\u0000') !== terminals.join('\u0000')) {
          return (
            `masthead path ${JSON.stringify(seen)}, expected the seeded sequence's ` +
            `${JSON.stringify(terminals)} (${history.length} recorded states)`
          );
        }
        return null;
      },
      { elementId, wanted, terminals, alphabet },
    ),
  );
}

interface PinnedTarget {
  selector: string;
  /**
   * The viewport that hides it with `display:none`. Such an element never fires `animationend`,
   * so the wave can never pin it; it is exempt there and required to be hidden there.
   */
  hiddenOn?: 'desktop' | 'mobile';
}

/**
 * Every element the page's intro wave hands to `js/anim-utils.js`, which pins the end state in an
 * `animationend` handler (`:15-21`: inline `animation: none`, then the final styles). Enumerated
 * from the source, never guessed, so a new reveal target fails here instead of being captured
 * mid-animation. §9's "the 10 elements" is home's list.
 */
const PINNED_TARGETS: Record<'home' | 'blog', PinnedTarget[]> = {
  home: [
    { selector: '.static-menu', hiddenOn: 'mobile' }, // script.js:26,36; mobile-styles.css:20
    { selector: '.name-logo' }, // :27,43
    { selector: '#typing-container' }, // :28,50
    { selector: '#socials-list', hiddenOn: 'mobile' }, // :29,57; mobile-styles.css:146
    { selector: '.static-menu-mobile', hiddenOn: 'desktop' }, // :30,64; styles.css:888
    { selector: '.double-view-left' }, // :67,72
    { selector: '.double-view-right' }, // :75,80
    { selector: '#about-header-wrapper .section-header' }, // :92
    { selector: '#about-header-wrapper .section-header-spacer' }, // :97
    { selector: '#sub-text' }, // :115,120, pinned by the masthead's onNewlineCount callback
  ],
  blog: [
    { selector: '#blog-sub-text' }, // blog-listing.js:8
    { selector: '#blog-sub-text-2' }, // :9
    { selector: '#blog-sub-text-3' }, // :10
    { selector: '#blog-socials-list', hiddenOn: 'mobile' }, // :11; blog-listing-styles.css:267
    { selector: '.name-logo' }, // :12
    { selector: '.static-menu', hiddenOn: 'mobile' }, // :13; mobile-styles.css:20
    { selector: '.static-menu-mobile', hiddenOn: 'desktop' }, // :14; styles.css:888
    { selector: '#selected-works-header .section-header' }, // :17
    { selector: '#selected-works-header .section-header-spacer' }, // :18
    { selector: '#featured-carousel .featured-carousel-container' }, // :29
    { selector: '#featured-carousel .featured-carousel-dots' }, // :30
  ],
};

/**
 * Three things, so that nothing is silently exempt:
 *
 * 1. Every target was **reached by the wave** — it carries an inline `animation-name`, which
 *    `js/script.js` / `blog/blog-listing.js` set before handing it to `anim-utils.js`. A selector
 *    that matches nothing, or an element the wave skipped, fails here.
 * 2. Every **rendered** target is pinned (`anim-utils.js:19` overwrites the shorthand with `none`),
 *    so no capture happens mid-entrance.
 * 3. Every target this viewport hides is in fact **not rendered**, so a `display:none` that stops
 *    applying cannot quietly leave the pinned set.
 *
 * The exempt set is not asserted in the other direction, because skins hide reveal targets too:
 * `css/themes/marquee.css:538` hides `.section-header-spacer` everywhere but two wrappers, and
 * pinning that down would mean enumerating sixteen skins' display rules here. Rule 1 is what keeps
 * the exemption honest — a hidden element still has to prove the wave ran over it.
 */
async function pinnedReady(page: Page, pageType: 'home' | 'blog', deadline: number): Promise<void> {
  const targets = PINNED_TARGETS[pageType];
  const viewport = (page.viewportSize()?.width ?? 0) <= 1100 ? 'mobile' : 'desktop';
  const selectors = targets.map((t) => t.selector);
  const mustHide = targets.filter((t) => t.hiddenOn === viewport).map((t) => t.selector);
  await pollUntil(pageType, 'pinned reveals', deadline, () =>
    page.evaluate(
      ({ selectors, mustHide }) => {
        const notReached: string[] = [];
        const unpinned: string[] = [];
        const hidden = new Set<string>();
        for (const selector of selectors) {
          const els = [...document.querySelectorAll<HTMLElement>(selector)];
          if (!els.length) {
            notReached.push(`${selector} matches no element`);
            continue;
          }
          els.forEach((el, i) => {
            const at = els.length > 1 ? `${selector}[${i}]` : selector;
            const rendered = el.getClientRects().length > 0;
            if (!rendered) hidden.add(selector);
            // Before the wave the property is unset; during it, the entrance's name (`fadein`,
            // `slidein`, `slideInLeft`, `slideInUp`); after it, `none`.
            const name = el.style.animationName;
            if (!name) notReached.push(`${at} has no inline animation-name`);
            else if (rendered && name !== 'none') unpinned.push(`${at} still shows ${JSON.stringify(name)}`);
          });
        }
        if (notReached.length) return `${notReached.length} not reached by the wave: ${notReached.join('; ')}`;
        if (unpinned.length) return `${unpinned.length} unpinned: ${unpinned.join('; ')}`;
        const showing = mustHide.filter((s) => !hidden.has(s));
        return showing.length ? `${showing.join(', ')} renders here, expected display:none` : null;
      },
      { selectors, mustHide },
    ),
  );
}

/**
 * Re-run the page's own layout-dependent handlers once, at the settled layout. Two values are
 * otherwise a function of whichever frame their handler last happened to run on, and two runs stop
 * on different frames: `anim-utils.js:244`'s `--section-rule` ease (its rAF loop stops the moment
 * it converges and nothing re-measures it afterwards) and `#highlight`'s inline geometry and
 * `transition` (`script.js:295-311`, re-seated without a transition only if a late font swap
 * happens to resize the rail first). Dispatching the events the page already listens for makes both
 * a function of the final layout instead. Nothing actually scrolls — `scrollY` and the rail's
 * `scrollLeft` are unchanged — so every handler recomputes the same geometry, on both sides.
 *
 * Two of those handlers leave a mark, and both are recorded rather than hidden. They are
 * harness-*induced* but not harness-*invented*: a real user reaches each of them, they are compared
 * verbatim in the DOM and the screenshot, and they land identically on both sides.
 *
 * 1. `nav-config.js:151-152` adds `menu-invisible` to `.moving-menu` whenever the handler runs
 *    below `SCROLL_THRESHOLD / 3`, which the settled position (`scrollY 0`) always is. Without the
 *    synthetic event the class depends on whether the page happened to receive a scroll at all, so
 *    dispatching it is what makes the settled `.moving-menu` the same on both sides. `sticky-nav`
 *    is the state that must **not** get this, and it passes `quiesce: false` (see
 *    `afterInteraction`).
 * 2. The `.menu-scroll-wrapper` event runs `script.js:328` -> `moveHighlight(target, false)`, so
 *    `#highlight` ends up with inline `transition: none` on **every** viewport — including desktop,
 *    where the wrapper is not scrollable and could never have fired the event on its own. That is
 *    exactly the point: home's readiness asserts `transition === 'none'` as the proof that the
 *    re-seat happened at the settled layout rather than mid-entrance.
 */
export async function quiesceLayout(page: Page): Promise<void> {
  await page.evaluate(() => {
    window.dispatchEvent(new Event('scroll')); // anim-utils.js:346 schedule()
    document.querySelector('.menu-scroll-wrapper')?.dispatchEvent(new Event('scroll')); // script.js:328
  });
}

/**
 * `anim-utils.js:244` scrubs `--section-rule` from a rAF loop that eases toward its target, so a
 * capture taken mid-ease differs between two runs by a rounding step. Sampling in two consecutive
 * frames is what proves the loop has stopped.
 */
export async function sectionRuleStable(page: Page, pageType: 'home' | 'blog', deadline: number): Promise<void> {
  await pollUntil(pageType, 'section-rule', deadline, () =>
    page.evaluate(async () => {
      const frame = (): Promise<void> => new Promise((r) => requestAnimationFrame(() => r()));
      // Set with el.style.setProperty, so the attribute is the reliable way to find the wrappers.
      const read = (): string =>
        [...document.querySelectorAll<HTMLElement>('[style*="--section-rule"]')]
          .map((el) => `${el.id || el.className}=${el.style.getPropertyValue('--section-rule')}`)
          .join(' ');
      await frame();
      const first = read();
      await frame();
      const second = read();
      if (!first) return 'no element carries an inline --section-rule';
      return first === second ? null : `--section-rule moved across two frames: ${first} -> ${second}`;
    }),
  );
}

/**
 * A post's own assets have finished arriving and drawing.
 *
 * `blog/blog-post.js:114-125` appends the frontmatter `scripts:` one at a time, each after the
 * previous has loaded, and it does that **after** `#read-time` is filled — so the rest of the post
 * predicate can pass while the chain has not even started. `document.scripts.length` holding still
 * is what says the chain is done, whatever a post declares.
 *
 * Then Plotly, if the post pulls it in. `blog/posts/assets/metr-chart.js:215` fetches its data
 * through `corsproxy.io`, which is in §9's abort list, so the chart is drawn from the bundled
 * fallback in the rejection handler — an async tail well past `load`. It also redraws on the
 * cycler's `dawson:palette` event behind a 150 ms debounce (`:205-213`), which is exactly what
 * `@state:palette`'s shuffle fires. Either way a redraw draws from `Math.random`, so a redraw on
 * one side only would move every `defs-<hex>` id and fail the DOM comparison.
 *
 * `script[src*="plotly"]`, not `'Plotly' in window`, is what says the post wants it: the global
 * only appears once the CDN script has run, and treating "not yet" as "never" is what let a
 * capture land on an empty chart box on one side (observed on `brutalist/metr-doubling`, where the
 * DOM matched because both sides had drawn by then and only the reference PNG was early).
 *
 * The signature is the script count, the plot subtree's size and the page's `Math.random` draw
 * count, held for 300 ms — twice the redraw debounce. `holdSteady` owns the window; a `!`-prefixed
 * probe result is a stage the post has not reached yet, which `reject` restarts the window on
 * rather than letting "still blank" hold still for 300 ms and pass.
 */
export async function postAssetsSettled(page: Page, pageType: PageType, deadline: number): Promise<void> {
  await holdSteady(
    page,
    pageType,
    'post assets',
    deadline,
    () => {
      const scripts = document.scripts.length;
      if (!document.querySelector('script[src*="plotly"]')) return `scripts:${scripts}`;
      if (!('Plotly' in window)) return '!the Plotly script is in the document but has not run';
      const plots = [...document.querySelectorAll('.js-plotly-plot')];
      if (!plots.length) return '!Plotly has run but has drawn nothing yet';
      const blank = plots.filter((p) => !p.querySelector('svg.main-svg')).length;
      if (blank) return `!${blank} plot(s) with no svg.main-svg`;
      const draws = (window as unknown as { __parityRandomDraws?: number }).__parityRandomDraws ?? -1;
      const sizes = plots.map((p) => p.innerHTML.length).join(',');
      return `scripts:${scripts}|plots:${plots.length}/${sizes}/${draws}`;
    },
    300,
    (v) => (v.startsWith('!') ? v.slice(1) : null),
  );
}

export const sentinels: Record<PageType, SentinelSpec> = {
  home: {
    selectors: [
      'html',
      'body',
      '.name-logo', // index.html:57
      '.static-menu .menu-list > li:first-child > a.menu-item', // nav-config.js:115 "About"
      '#typing-text', // index.html:78
      '#about-section-header', // index.html:97
      '#about-section-header .sec-num',
      '.about-text', // index.html:103
      '#featured-track > .fc-card:first-child', // featured-carousel.js:83
      '#featured-track > .fc-card:first-child .fc-card-tech > .pill:first-child',
      '.blog-see-all .text-link', // index.html:253
      '.footer-text', // index.html:304
    ],
    mask: ['#typing-text'], // index.html:78, the typed element itself, not its wrapper
    masthead: '#typing-text',
    // Every home state screenshots the viewport, and three of them (`sticky-nav`,
    // `smooth-scroll-contact`, `carousel-wheel`) leave the page at a scroll offset a full-page
    // capture would stitch away; the viewport shot is what compares where the gesture landed.
    fullPage: false,
    async ready(page, deadline, opts) {
      await mastheadReady(page, 'home', deadline, opts?.mastheadIndex ?? MASTHEAD_INDEX.home);
      await pollUntil('home', 'carousel', deadline, () =>
        page.evaluate(() => {
          const cards = document.querySelectorAll('#featured-track > .fc-card').length;
          const dots = document.querySelectorAll('#featured-dots > .fc-dot').length;
          const active = document.querySelectorAll('#featured-dots > .fc-dot.active').length;
          if (cards !== 8) return `${cards} carousel cards, expected 8`;
          if (dots !== 8) return `${dots} carousel dots, expected 8`;
          if (active !== 1) return `${active} active dots, expected 1`;
          return null;
        }),
      );
      await pinnedReady(page, 'home', deadline);
      await quiesceLayout(page);
      // The jobs rail's bar (index.html:159, script.js:273). moveHighlight writes all four
      // properties in both the mobile and the desktop branch (:295-311); `transition: none` is the
      // `animate=false` branch, which is what the rail's own scroll handler above just ran, so it
      // is also the proof that the re-seat happened at the settled layout.
      await pollUntil('home', 'jobs highlight', deadline, () =>
        page.evaluate(() => {
          const el = document.getElementById('highlight');
          if (!el) return '#highlight is missing';
          const missing = ['left', 'width', 'top', 'height'].filter((p) => !el.style.getPropertyValue(p));
          if (missing.length) return `#highlight has no inline ${missing.join(', ')}`;
          const transition = el.style.transition;
          return transition === 'none' ? null : `#highlight transition is ${JSON.stringify(transition)}, expected none`;
        }),
      );
      await sectionRuleStable(page, 'home', deadline);
    },
  },
  blog: {
    selectors: [
      'html',
      'body',
      '.name-logo', // blog/index.html:52
      '.static-menu .menu-list > li:first-child > a.menu-item',
      '#blog-typing-text', // blog/index.html:63
      '#selected-works-header .section-header', // blog/index.html:75
      '#selected-works-header .sec-num',
      '#blog-sub-text', // blog/index.html:64
      '#blog-grid > .blog-card-wrapper:first-child', // blog-listing.js:127
      '#filter-bar .filter-pill:first-child', // blog-listing.js:100
      '#featured-track > .fc-card:first-child .fc-card-cta', // featured-carousel.js:74
      '.footer-text', // blog/index.html:112
    ],
    mask: ['#blog-typing-text'], // blog/index.html:63
    masthead: '#blog-typing-text',
    fullPage: false,
    async ready(page, deadline, opts) {
      await mastheadReady(page, 'blog', deadline, opts?.mastheadIndex ?? MASTHEAD_INDEX.blog);
      await pinnedReady(page, 'blog', deadline);
      await quiesceLayout(page);
      await sectionRuleStable(page, 'blog', deadline);
    },
  },
  post: {
    selectors: [
      'html',
      'body',
      '.name-logo', // blog/post.html:78
      '.static-menu .menu-list > li:first-child > a.menu-item',
      '#post-title', // blog/post.html:89, filled by blog-post.js:154
      '.blog-post-header', // blog/post.html:88, no `.section-header` exists on a post
      '#read-time', // blog-post.js:165, no `.sec-num` exists on a post
      '#post-content > p:first-of-type', // blog-post.js:171
      '.blog-post-container', // blog/post.html:87, the article is the only boxed surface
      '#post-meta .pill:first-child', // blog-post.js:158-166, the date pill
      '.static-menu .menu-list a.resume-link', // nav-config.js:113, no in-page CTA on a post
      '.footer-text', // blog/post.html:97
    ],
    mask: [],
    fullPage: false,
    async ready(page, deadline) {
      await pollUntil('post', 'post body', deadline, () =>
        page.evaluate(() => {
          const readTime = (document.getElementById('read-time')?.textContent ?? '').trim();
          if (!/^\d+ min read$/.test(readTime)) return `#read-time is ${JSON.stringify(readTime)}`;
          const blocks = [...document.querySelectorAll('.mermaid')];
          const unrendered = blocks.filter((el) => !el.querySelector('svg')).length;
          return unrendered ? `${unrendered}/${blocks.length} .mermaid blocks have no <svg>` : null;
        }),
      );
      await postAssetsSettled(page, 'post', deadline);
    },
  },
  privacy: {
    selectors: [
      'html',
      'body',
      '.name-logo', // privacy/index.html:25
      '.header-menu-container', // :24, the page loads no nav-config, so this is the header bar
      '.privacy-header', // :30
      '.privacy-content > h2:first-of-type', // :43
      '.privacy-header-spacer', // :31, the numbering is baked into the h2 text, no `.sec-num`
      '.privacy-content > p:first-of-type', // :39
      '.privacy-content', // :38, no cards; the one content panel
      '.privacy-meta .pill', // :34
      '.privacy-content .text-link', // :110
      '.footer-text', // :115
    ],
    mask: [],
    fullPage: true,
    async ready(page, deadline) {
      await pollUntil('privacy', 'privacy content', deadline, () =>
        page.evaluate(() => {
          const heading = (document.querySelector('.privacy-header')?.textContent ?? '').trim();
          if (!heading) return 'no .privacy-header text';
          return document.querySelector('.privacy-content') ? null : 'no .privacy-content';
        }),
      );
    },
  },
  notFound: {
    selectors: [
      'html',
      'body',
      '.name-logo', // 404.html:46
      '.header-menu-container', // :45, no nav on this page
      '.nf-code', // :50
      '.nf-container', // :49, the only content section, and it carries no header element
      '.footer-container > .footer-spacer:first-child', // :55, no numbering anywhere on the page
      '.nf-text', // :51
      '#main-body', // :44, no cards; the page shell is the only container
      '.footer-text-mobile', // :64, no chips; the one remaining standalone text token
      '.text-link', // :52
      '.footer-text', // :57
    ],
    mask: [],
    fullPage: true,
    async ready(page, deadline) {
      await pollUntil('notFound', 'themed 404', deadline, () =>
        page.evaluate(() => {
          const wanted = new URLSearchParams(location.search).get('style');
          if (!wanted || wanted === 'default') return null;
          const applied = document.documentElement.dataset.style;
          if (applied !== wanted) return `data-style is ${applied ?? '(unset)'}, expected ${wanted}`;
          const links = [...document.querySelectorAll('link[data-style-asset]')];
          if (!links.length) return 'no [data-style-asset] links';
          const unloaded = links
            .filter((l) => !(l as HTMLLinkElement).sheet)
            .map((l) => l.getAttribute('href'));
          return unloaded.length ? `${unloaded.length} style asset(s) with no .sheet, first ${unloaded[0]}` : null;
        }),
      );
    },
  },
  lexchat: {
    // The whole page is one <iframe> (lexchat/index.html:13-16) and the cycler injects nothing
    // here (theme-cycler.js:557-558 bails without a `.tc-nav-item`), so the DOM has 13 elements
    // and ten slots are substituted with head nodes. Positional `link` indices, not hrefs: the
    // bootstrap appends its [data-style-asset] links after these, so 1-4 are theme-stable.
    selectors: [
      'html',
      'body',
      'head',
      'head > title',
      'head > meta[charset]',
      'head > meta[name="viewport"]',
      'head > link[rel="icon"]',
      'head > link[rel="apple-touch-icon"]',
      'head > link:nth-of-type(3)', // lexchat-styles.css
      'head > link:nth-of-type(4)', // css/theme-cycler.css
      'head > script', // theme-bootstrap.js
      'iframe.lexchat-iframe',
    ],
    mask: [],
    fullPage: true,
    async ready(page, deadline) {
      // The iframe host is in the abort list, so its content never loads, by design on both
      // sides. Only the embed element itself is asserted.
      await pollUntil('lexchat', 'lexchat embed', deadline, () =>
        page.evaluate(() =>
          document.querySelector('iframe.lexchat-iframe') ? null : 'no iframe.lexchat-iframe',
        ),
      );
    },
  },
};

for (const [pageType, spec] of Object.entries(sentinels)) {
  if (spec.selectors.length !== 12 || new Set(spec.selectors).size !== 12) {
    throw new Error(`sentinels.${pageType}: ${spec.selectors.length} selectors, expected 12 distinct`);
  }
}
