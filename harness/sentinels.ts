/**
 * Spec 1 §9's 12 computed-style sentinels per page type, the screenshot policy that goes with
 * them, and each page type's readiness predicate. Line refs are `personal-website-old` at the
 * baseline SHA. Selector substitutions on the utility pages are documented in
 * `harness/fixtures/baseline/README.md`. Consumers: harness/settle.ts, harness/parity.spec.ts.
 * S1-03 completes the home/listing/post predicates (see the `S1-03:` comments below).
 */
import type { Page } from '@playwright/test';
import { masthead } from './baseline.ts';
import type { PageType } from './urls.ts';

export const SETTLE_TIMEOUT_MS = 15_000;

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

export interface SentinelSpec {
  /** Exactly 12, each matching exactly one element on that page type (asserted per side). */
  selectors: string[];
  /** Screenshot masks: the typing masthead is masked and asserted as text instead (§9 check 2). */
  mask: string[];
  /** The element whose textContent is compared across sides, when the page type has one. */
  masthead?: string;
  fullPage: boolean;
  ready(page: Page, deadline: number): Promise<void>;
}

/** Distinct end-of-sequence strings, with the `\n` the engine turns into `<br>` removed. */
let terminals: { home: string[]; blog: string[] } | null = null;
function finalTerminals(page: 'home' | 'blog'): string[] {
  if (!terminals) {
    const fixture = masthead();
    const finals = (p: 'home' | 'blog'): string[] => [
      ...new Set(fixture[p].sequences.map((s) => s.terminals[s.terminals.length - 1]!.replace(/\n/g, ''))),
    ];
    terminals = { home: finals('home'), blog: finals('blog') };
  }
  return terminals[page];
}

/**
 * The masthead has finished its randomly picked sequence (`typing-engine.js:165`) and the caret
 * is in its end state (`:367-370` blinks once the last step runs out).
 */
async function mastheadReady(page: Page, pageType: 'home' | 'blog', deadline: number): Promise<void> {
  const elementId = pageType === 'home' ? 'typing-text' : 'blog-typing-text';
  const wanted = finalTerminals(pageType);
  await pollUntil(pageType, 'masthead', deadline, () =>
    page.evaluate(
      ({ elementId, wanted }) => {
        const el = document.getElementById(elementId);
        if (!el) return `#${elementId} is missing`;
        // The engine inserts <br> for "\n"; the cursorless anchor carries a zero-width space.
        const text = (el.textContent ?? '').replace(/\u200B/g, '');
        if (!wanted.includes(text)) return `masthead text ${JSON.stringify(text)} is not a final terminal`;
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
        return null;
      },
      { elementId, wanted },
    ),
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
    fullPage: false, // S1-03 owns the scroll states
    async ready(page, deadline) {
      await mastheadReady(page, 'home', deadline);
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
      // S1-03: the 10 elements anim-utils.js pins via `animationend` (script.js:36-120,
      // blog-listing.js:8-30) all carry the inline `animation: none` end state.
      // S1-03: `#highlight` (index.html:159, script.js:273) has inline geometry.
      // S1-03: `--section-rule` (anim-utils.js scroll scrub) is stable across two rAFs.
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
    async ready(page, deadline) {
      await mastheadReady(page, 'blog', deadline);
      // S1-03: the pinned reveals (blog-listing.js:8-30) and `--section-rule` stability.
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
