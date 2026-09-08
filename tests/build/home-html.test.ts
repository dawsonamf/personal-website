// S1-17: the production canonical home, verified at the raw emitted-HTML boundary.
//
// One real isolated build covers every registered home. Assertions stay before browser
// initialization so the page proves that content, navigation, carousel facts and the blog
// rail are build output rather than runtime catalog rendering.
//
// Run: node --test --test-concurrency=1 tests/build/home-html.test.ts

import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { after, before, describe, it } from 'node:test';

import { listingPosts } from '../../src/build/posts.ts';
import { createProseAccess } from '../../src/prose/index.ts';
import { THEME_IDS } from '../../src/themes/registry.ts';
import { buildSite, cleanup } from '../fixtures/composition/build.ts';

const HOME_SCRIPT_SRCS = [
  '/vendor/gsap/gsap.min.js',
  '/vendor/jquery/jquery.min.js',
  '/vendor/jquery-ui/jquery-ui.min.js',
  '/vendor/aos/aos.js',
  '/vendor/vanilla-tilt/vanilla-tilt.min.js',
  'https://assets.calendly.com/assets/external/widget.js',
  '/js/featured-carousel.js',
  '/js/typing-engine.js',
  '/js/anim-utils.js',
  '/js/nav-behavior.js',
  '/js/script.js',
  '/js/cursor-follow.js',
] as const;

const LISTING_IDS = [
  'fly-on-my-laptop', 'underviewed-art', 'arena-freshness', 'helm', 'toolbelt',
  'embedded-swift-agent', 'metr-doubling', 'autoencoders-2', 'autoencoders-1',
  'college-projects',
] as const;

const LISTING = listingPosts().map((post) => {
  const prose = createProseAccess(post.meta, post.source);
  return {
    id: post.id,
    title: prose.text('title', 's'),
    date: post.meta.date,
    excerpt: prose.text('description', 'l'),
    external: post.meta.publication === 'external' ? post.meta.externalUrl : undefined,
  };
});

const count = (text: string, needle: string) => text.split(needle).length - 1;

function ordered(text: string, needles: readonly string[], label: string): void {
  let cursor = -1;
  for (const needle of needles) {
    const next = text.indexOf(needle, cursor + 1);
    assert.notEqual(next, -1, `${label}: no ${JSON.stringify(needle)}`);
    assert.ok(next > cursor, `${label}: ${JSON.stringify(needle)} is out of order`);
    cursor = next;
  }
}

function headOf(html: string): string {
  const match = /<head>([\s\S]*?)<\/head>/.exec(html);
  assert.ok(match, 'home has one head');
  return match[1];
}

function sourceTags(html: string): Array<{ src: string; tag: string }> {
  return [...html.matchAll(/<script\b[^>]*\bsrc="([^"]+)"[^>]*><\/script>/g)]
    .map((match) => ({ src: match[1], tag: match[0] }));
}

function decode(text: string): string {
  return text
    .replaceAll('&amp;', '&')
    .replaceAll('&quot;', '"')
    .replaceAll('&#39;', "'")
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>');
}

describe('S1-17 production home raw HTML', () => {
  let dir: string | undefined;
  let dist = '';
  const homes = new Map<string, string>();

  before(() => {
    const built = buildSite('s1-17-home-');
    dir = built.dir;
    dist = built.dist;
    for (const id of THEME_IDS) {
      const rel = id === 'default' ? 'index.html' : join(id, 'index.html');
      homes.set(id, readFileSync(join(dist, rel), 'utf8'));
    }
  });

  after(() => cleanup(dir));

  it('derives rail fields from the independent exact ten-post source order', () => {
    assert.deepEqual(LISTING.map(({ id }) => id), LISTING_IDS);
    assert.deepEqual(
      LISTING.filter(({ id }) => id === 'helm' || id === 'metr-doubling')
        .map(({ id, title, date, excerpt }) => ({ id, title, date, excerpt })),
      [
        {
          id: 'helm',
          title: 'Helm: A Workspace Switcher for VS Code and Cursor',
          date: 'March 2026',
          excerpt: 'Building a Cursor/VSCode extension that brings Arc Browser style space and workspace management to your IDE sidebar.',
        },
        {
          id: 'metr-doubling',
          title: 'How Fast Are Agents Improving?',
          date: 'February 2026',
          excerpt: 'An analysis of METR-Horizon benchmark data showing AI agent capability doubling times, with interactive projections through 2033.',
        },
      ],
    );
  });

  it('stages the complete current 65-page route surface and all 16 homes', () => {
    const routeFiles = [
      ...THEME_IDS.flatMap((id) => {
        const prefix = id === 'default' ? '' : `${id}/`;
        return ['', 'blog/', 'privacy/', 'lexchat/'].map((tail) => `${prefix}${tail}index.html`);
      }),
      '404.html',
    ];
    assert.equal(routeFiles.length, 65);
    assert.equal(new Set(routeFiles).size, 65);
    for (const rel of routeFiles) assert.ok(existsSync(join(dist, rel)), `dist/${rel}`);
    assert.equal(homes.size, 16);
  });

  it('keeps the authored home metadata, styles and behavior resources in baseline order', () => {
    for (const [id, html] of homes) {
      const head = headOf(html);
      ordered(head, [
        '<meta charset="UTF-8">',
        '<meta name="viewport" content="width=device-width, initial-scale=1.0">',
        '<title>Dawson Metzger-Fleetwood</title>',
        '<meta name="description" content="Dawson Metzger-Fleetwood is a software engineer working across web, iOS and visionOS, and ML/RL. Projects, blog, experience, and ways to get in touch.">',
        '<link rel="canonical" href="https://www.dawsonamf.com/">',
        ...(id === 'default' ? [] : ['<meta name="robots" content="noindex">']),
        '<link rel="icon" type="image/png" sizes="32x32" href="/resources/favicon-32.png">',
        '<link rel="apple-touch-icon" href="/resources/apple-touch-icon.png">',
        '<meta property="og:type" content="website">',
        '<meta property="og:title" content="Dawson Metzger-Fleetwood">',
        '<meta property="og:description" content="Software engineer working across web, iOS and visionOS, and ML/RL.">',
        '<meta property="og:url" content="https://www.dawsonamf.com/">',
        '<meta property="og:image" content="https://www.dawsonamf.com/resources/og-avatar.jpg">',
        '<meta name="twitter:card" content="summary">',
        '/vendor/fontawesome-free/css/all.min.css',
        '/vendor/boxicons/css/boxicons.min.css',
        '/vendor/aos/aos.css',
        'https://assets.calendly.com/assets/external/widget.css',
        '/css/styles.css',
        '/css/mobile-styles.css',
        '/css/featured-carousel.css',
        '/css/theme-cycler.css',
        "sessionStorage.getItem('dawson-theme-cycler')",
        ...(id === 'default' ? ['var p=new URLSearchParams(location.search)'] : []),
        '<!--theme-assets-->',
        ...HOME_SCRIPT_SRCS,
      ], `${id} head`);

      const tags = sourceTags(head);
      assert.deepEqual(tags.map(({ src }) => src), [...HOME_SCRIPT_SRCS], `${id} head scripts`);
      for (const { src, tag } of tags) {
        const sync = src.includes('vanilla-tilt') || src === '/js/anim-utils.js';
        const async = src.includes('calendly.com');
        assert.equal(/\bdefer(?:\s|>|=)/.test(tag), !sync && !async, `${id}: defer ${src}`);
        assert.equal(/\basync(?:\s|>|=)/.test(tag), async, `${id}: async ${src}`);
      }
      assert.ok(html.indexOf('/js/cursor-follow.js') < html.indexOf('/js/theme-cycler.js'), `${id}: Shell cycler is the tail`);
    }
  });

  it('emits the full canonical section tree, carousel facts and one masthead island before runtime', () => {
    for (const [id, html] of homes) {
      ordered(html, [
        '<header>',
        '<main>',
        'id="typing-container"',
        'id="about-header-wrapper"',
        '<span class="sec-num">01.</span>About',
        'id="jobs-header-static"',
        '<span class="sec-num">02.</span>Where I&#39;ve Worked',
        'id="project-header-static"',
        '<section class="project-section-wrapper"',
        '<span class="sec-num">03.</span>Selected Works',
        'id="featured-carousel"',
        'id="blog-header-static"',
        '<section class="blog-section-wrapper"',
        '<span class="sec-num">04.</span>Blog',
        'id="blog-scroll-track"',
        'id="contact-header-wrapper"',
        '<span class="sec-num">05.</span>Contact',
        '<footer class="footer-container">',
        '<div class="footer-container-mobile">',
      ], `${id} body`);
      assert.equal(count(html, 'id="masthead-sequences"'), 1, `${id}: one masthead island`);
      assert.equal(count(html, 'class="fc-card"'), 8, `${id}: carousel cards`);
      assert.equal(count(html, 'class="fc-dot active"') + count(html, 'class="fc-dot"'), 8, `${id}: carousel dots`);
      assert.match(html, /<section class="project-section-wrapper"[^>]*>[\s\S]*<section class="featured-carousel-section fc-style-floating" id="featured-carousel">[\s\S]*<\/section>[\s\S]*<\/section>\s*<div class="section-spacer"><\/div>/);
    }
  });

  it('renders ten source-owned rail cards in listing order with themed local links and external targets', () => {
    for (const [themeId, html] of homes) {
      const cards = [...html.matchAll(/<a class="blog-card"([^>]*)>([\s\S]*?)<\/a>/g)];
      assert.equal(cards.length, LISTING.length, `${themeId}: rail card count`);
      cards.forEach((card, index) => {
        const expected = LISTING[index];
        const attrs = decode(card[1]);
        const body = decode(card[2]).replace(/\s+/g, ' ').trim();
        const local = `${themeId === 'default' ? '' : `/${themeId}`}/blog/${expected.id}/`;
        assert.ok(attrs.includes(`href="${expected.external ?? local}"`), `${themeId}: ${expected.id} href`);
        assert.equal(attrs.includes('target="_blank" rel="noopener noreferrer"'), Boolean(expected.external), `${themeId}: ${expected.id} target`);
        assert.ok(body.includes(`<h3 class="blog-card-title">${expected.title}</h3>`), `${themeId}: ${expected.id} title`);
        assert.ok(body.includes(`<p class="blog-card-date">${expected.date}</p>`), `${themeId}: ${expected.id} date`);
        assert.ok(body.includes(`<p class="blog-card-excerpt">${expected.excerpt}</p>`), `${themeId}: ${expected.id} excerpt`);
      });
      assert.match(html, new RegExp(`<a href="${themeId === 'default' ? '' : `/${themeId}`}/blog/" class="text-link">See all posts<\\/a>`));
      assert.equal(count(html, 'class="blog-scroll-fade blog-scroll-fade-left"'), 1);
      assert.equal(count(html, 'class="blog-scroll-fade blog-scroll-fade-right"'), 1);
    }
  });

  it('serializes carousel ticker data on every home and keeps the default projection lean', () => {
    for (const [id, html] of homes) {
      const htmlTag = /^<!DOCTYPE html>\n<html\b([^>]*)>/.exec(html);
      assert.ok(htmlTag, `${id}: html tag`);
      assert.ok(htmlTag[1].includes('--ticker-run:&quot;✷ '), `${id}: ticker content`);
      assert.ok(htmlTag[1].includes('--ticker-dur:87s;'), `${id}: ticker duration`);
    }

    const home = homes.get('default')!;
    const htmlTag = /^<!DOCTYPE html>\n<html\b([^>]*)>/.exec(home)![1];
    for (const token of ['--text:#e6f1ff;', '--bg:#1d1d1d;', '--primary:#61ffda;', '--secondary:#2c2c2c;', '--accent:#61ffda;']) {
      assert.ok(htmlTag.includes(token), `default ${token}`);
    }
    assert.ok(!htmlTag.includes('data-style='), 'default has no data-style');
    assert.ok(!htmlTag.includes('--prose-'), 'default has no skin prose token');
    assert.equal(count(home, 'data-style-asset="1"'), 0, 'default has no theme assets');
    assert.ok(!home.includes('/_astro/'), 'canonical home has no injected Astro asset');
  });

  it('keeps picker ownership split between Nav triggers and the Shell tail, with no runtime catalogs', () => {
    for (const [id, html] of homes) {
      assert.equal(count(html, 'class="menu-item tc-nav-trigger"'), 2, `${id}: desktop picker triggers`);
      assert.equal(count(html, 'class="socials-item tc-nav-trigger"'), 1, `${id}: mobile picker trigger`);
      assert.equal(count(html, 'id="tc-dock"'), 1, `${id}: one dock`);
      assert.equal(count(html, 'id="tc-scrim"'), 1, `${id}: one scrim`);
      assert.equal(count(html, 'class="tc-fab'), 0, `${id}: no FAB on nav mount`);
      assert.equal(count(html, '<!--picker-mount:nav-->'), 1, `${id}: nav mount contract`);
      assert.ok(!html.includes('/js/blog-data.js'), `${id}: no blog catalog script`);
      assert.ok(!html.includes('window.BLOG_POSTS'), `${id}: no blog catalog global`);
      assert.ok(!html.includes('window.FEATURED_PROJECTS'), `${id}: no project catalog global`);
    }
  });
});
