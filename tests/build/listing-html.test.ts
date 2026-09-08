// S1-18: the production canonical blog listing at the raw emitted-HTML boundary.
//
// Expectations come from the immutable OLD listing catalog. Helm and METR are the two
// approved Q1 differences, and their replacement title/date values are read independently
// from their owning post sources rather than copied from the rendering implementation.
//
// Run: node --test --test-concurrency=1 tests/build/listing-html.test.ts

import assert from 'node:assert/strict';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { after, before, describe, it } from 'node:test';
import { runInNewContext } from 'node:vm';

import { load as loadYaml } from 'js-yaml';

import { oldDir } from '../../harness/baseline.ts';
import { THEME_IDS, THEMES } from '../../src/themes/registry.ts';
import { buildSite, cleanup } from '../fixtures/composition/build.ts';

const repoRoot = resolve(import.meta.dirname, '..', '..');
const baselineRoot = oldDir();
const oldDataFile = join(baselineRoot, 'js', 'blog-data.js');
const oldListingFile = join(baselineRoot, 'blog', 'index.html');
for (const legacy of [oldDataFile, oldListingFile]) {
  assert.ok(
    existsSync(legacy),
    `${legacy} is missing; set PARITY_OLD_DIR to the baseline checkout instead of skipping this check`,
  );
}

type LegacyPost = {
  id: string;
  title: string;
  date: string;
  excerpt: string;
  url: string;
  tags: string[];
  external?: boolean;
};

const legacyWindow: { BLOG_POSTS?: LegacyPost[] } = {};
runInNewContext(readFileSync(oldDataFile, 'utf8'), { window: legacyWindow }, { filename: oldDataFile });
const legacyPosts = Array.from(legacyWindow.BLOG_POSTS ?? [], (post) => ({
  ...post,
  tags: Array.from(post.tags),
}));

const LISTING_IDS = [
  'fly-on-my-laptop', 'underviewed-art', 'arena-freshness', 'helm', 'toolbelt',
  'embedded-swift-agent', 'metr-doubling', 'autoencoders-2', 'autoencoders-1',
  'college-projects',
] as const;
const FILTER_TAGS = ['AI & ML', 'Swift', 'Systems', 'Tools'] as const;

function owningMeta(id: string): { title: { s: string }; date: string } {
  const source = readFileSync(join(repoRoot, 'src', 'content', 'posts', `${id}.md`), 'utf8');
  const match = /^---\n([\s\S]*?)\n---\n/.exec(source);
  assert.ok(match, `${id}: source has frontmatter`);
  const meta = loadYaml(match[1], { filename: `${id}.md` }) as { title: { s: string }; date: string };
  return { title: meta.title, date: meta.date };
}

const approved = new Map([
  ['helm', owningMeta('helm')],
  ['metr-doubling', owningMeta('metr-doubling')],
]);
const expectedPosts = legacyPosts.map((post) => ({
  ...post,
  title: approved.get(post.id)?.title.s ?? post.title,
  date: approved.get(post.id)?.date ?? post.date,
}));

const type = (text: string) => ({ action: 'type', text });
const pause = { action: 'pause', duration: 800 };
const del = (count: number) => ({ action: 'delete', count });
const LISTING_MASTHEAD = [
  [type("Cool things I've built."), pause, del(23), type('Blog.')],
  [type('Things I find interesting.'), pause, del(26), type('Blog.')],
  [type('Late night rabbit holes.'), pause, del(24), type('Blog.')],
  [type('Rabbit holes.'), pause, del(13), type('Blog.')],
  [type("Things I've built."), pause, del(18), type('Blog.')],
  [type('Random projects.'), pause, del(16), type('Blog.')],
  [type('Side quests.'), pause, del(12), type('Blog.')],
];
const INTRO_IDS = ['blog-sub-text', 'blog-sub-text-2', 'blog-sub-text-3'] as const;
const oldListing = readFileSync(oldListingFile, 'utf8');
const legacyIntro = new Map(INTRO_IDS.map((id) => {
  const match = new RegExp(`<p id="${id}">([\\s\\S]*?)<\\/p>`).exec(oldListing);
  assert.ok(match, `OLD listing has ${id}`);
  return [id, match[1]];
}));

const HEAD_SCRIPT_SRCS = [
  '/vendor/aos/aos.js',
  '/vendor/vanilla-tilt/vanilla-tilt.min.js',
  'https://assets.calendly.com/assets/external/widget.js',
  '/js/featured-carousel.js',
  '/js/typing-engine.js',
  '/js/anim-utils.js',
  '/js/nav-behavior.js',
  '/js/cursor-follow.js',
] as const;

const count = (text: string, needle: string) => text.split(needle).length - 1;

function decode(text: string): string {
  return text
    .replaceAll('&amp;', '&')
    .replaceAll('&quot;', '"')
    .replaceAll('&#39;', "'")
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>');
}

function ordered(text: string, needles: readonly string[], label: string): void {
  let cursor = -1;
  for (const needle of needles) {
    const next = text.indexOf(needle, cursor + 1);
    assert.notEqual(next, -1, `${label}: no ${JSON.stringify(needle)}`);
    assert.ok(next > cursor, `${label}: ${JSON.stringify(needle)} is out of order`);
    cursor = next;
  }
}

function sourceTags(html: string): Array<{ src: string; tag: string }> {
  return [...html.matchAll(/<script\b[^>]*\bsrc="([^"]+)"[^>]*><\/script>/g)]
    .map((match) => ({ src: match[1], tag: match[0] }));
}

describe('S1-18 production blog listing raw HTML', () => {
  let dir: string | undefined;
  let dist = '';
  const listings = new Map<string, string>();

  before(() => {
    const built = buildSite('s1-18-listing-');
    dir = built.dir;
    dist = built.dist;
    for (const id of THEME_IDS) {
      const rel = id === 'default' ? 'blog/index.html' : join(id, 'blog', 'index.html');
      listings.set(id, readFileSync(join(dist, rel), 'utf8'));
    }
  });

  after(() => cleanup(dir));

  it('pins the old ten-entry membership/order and reads the two approved corrections from their sources', () => {
    assert.deepEqual(legacyPosts.map((post) => post.id), LISTING_IDS);
    assert.deepEqual([...approved.keys()], ['helm', 'metr-doubling']);
    for (const [id, meta] of approved) {
      assert.equal(typeof meta.title.s, 'string', `${id}: source title`);
      assert.equal(typeof meta.date, 'string', `${id}: source date`);
    }
    assert.deepEqual([...new Set(legacyPosts.flatMap((post) => post.tags))].sort(), FILTER_TAGS);
  });

  it('emits one complete listing for every registered theme', () => {
    assert.equal(listings.size, 16);
    for (const id of THEME_IDS) {
      const rel = id === 'default' ? 'blog/index.html' : join(id, 'blog', 'index.html');
      assert.ok(existsSync(join(dist, rel)), rel);
    }
  });

  it('keeps listing metadata, styles, and the asymmetric script order', () => {
    for (const [id, html] of listings) {
      const head = /<head>([\s\S]*?)<\/head>/.exec(html)?.[1] ?? '';
      ordered(head, [
        '<title>Blog | Dawson Metzger-Fleetwood</title>',
        '/vendor/fontawesome-free/css/all.min.css',
        '/vendor/boxicons/css/boxicons.min.css',
        '/vendor/aos/aos.css',
        'https://assets.calendly.com/assets/external/widget.css',
        '/css/styles.css',
        '/css/mobile-styles.css',
        '/css/featured-carousel.css',
        '/blog/blog-listing-styles.css',
        '/css/theme-cycler.css',
        "sessionStorage.getItem('dawson-theme-cycler')",
        ...(id === 'default' ? ['var p=new URLSearchParams(location.search)'] : []),
        '<!--theme-assets-->',
        ...HEAD_SCRIPT_SRCS,
      ], `${id} head`);

      const tags = sourceTags(head);
      assert.deepEqual(tags.map(({ src }) => src), HEAD_SCRIPT_SRCS, `${id}: head scripts`);
      tags.forEach(({ src, tag }) => {
        const deferred = src === '/js/nav-behavior.js' || src === '/js/cursor-follow.js';
        const async = src.includes('calendly.com');
        assert.equal(/\bdefer(?:\s|>|=)/.test(tag), deferred, `${id}: defer ${src}`);
        assert.equal(/\basync(?:\s|>|=)/.test(tag), async, `${id}: async ${src}`);
      });
      ordered(html, ['/js/blog-listing-client.js', '/js/theme-cycler.js'], `${id} body scripts`);
      assert.ok(!head.includes('/js/blog-listing-client.js'), `${id}: client stays at end of body`);
    }
  });

  it('renders the complete intro, numbered sections, carousel, filters, and masthead island', () => {
    for (const [id, html] of listings) {
      ordered(html, [
        'id="blog-typing-container"',
        'id="blog-typing-text"',
        'id="blog-sub-text"',
        'id="blog-sub-text-2"',
        'id="blog-sub-text-3"',
        'id="blog-socials-list"',
        'id="masthead-sequences"',
        'id="selected-works-header"',
        '<span class="sec-num">01.</span>Selected Works',
        'id="featured-carousel"',
        '<span class="sec-num">02.</span>All Posts',
        'id="filter-bar"',
        'id="blog-grid"',
        '<footer class="footer-container blog-listing-footer">',
        '<div class="footer-container-mobile">',
      ], `${id} body`);
      assert.equal(count(html, 'class="fc-card"'), 8, `${id}: carousel cards`);
      assert.equal(count(html, 'class="fc-dot active"') + count(html, 'class="fc-dot"'), 8, `${id}: carousel dots`);
      const island = /<script type="application\/json" id="masthead-sequences">([\s\S]*?)<\/script>/.exec(html);
      assert.ok(island, `${id}: masthead island`);
      assert.deepEqual(JSON.parse(island[1]), LISTING_MASTHEAD, `${id}: masthead steps`);

      for (const introId of INTRO_IDS) {
        const paragraph = new RegExp(`<p id="${introId}">([\\s\\S]*?)<\\/p>`).exec(html);
        assert.ok(paragraph, `${id}: ${introId}`);
        assert.equal(decode(paragraph[1]), legacyIntro.get(introId), `${id}: ${introId} text`);
      }

      const pills = [...html.matchAll(/<button class="filter-pill" data-tag="([^"]+)">([^<]+)<\/button>/g)]
        .map((match) => decode(match[1]));
      assert.deepEqual(pills, FILTER_TAGS, `${id}: sorted filter union`);
      assert.ok(!pills.includes('All'), `${id}: no All pill`);
    }
  });

  it('renders source-owned cards in old order with exact wrappers, tags, fields, and destinations', () => {
    for (const [themeId, html] of listings) {
      const cards = [...html.matchAll(/<div class="blog-card-wrapper"([^>]*)>\s*<a class="blog-card"([^>]*)>([\s\S]*?)<\/a>\s*<\/div>/g)];
      assert.equal(cards.length, expectedPosts.length, `${themeId}: card count`);
      cards.forEach((card, index) => {
        const expected = expectedPosts[index];
        const wrapper = decode(card[1]);
        const anchor = decode(card[2]);
        const body = decode(card[3]).replace(/\s+/g, ' ').trim();
        const href = expected.external
          ? expected.url
          : `${themeId === 'default' ? '' : `/${themeId}`}/blog/${expected.id}/`;
        assert.ok(wrapper.includes(`data-tags="${expected.tags.join(',')}"`), `${themeId}: ${expected.id} tags`);
        assert.ok(wrapper.includes('data-aos="fade-up"'), `${themeId}: ${expected.id} AOS`);
        assert.ok(wrapper.includes('data-aos-once="true"'), `${themeId}: ${expected.id} AOS once`);
        assert.ok(wrapper.includes(`data-aos-delay="${index * 50}"`), `${themeId}: ${expected.id} delay`);
        assert.ok(anchor.includes(`href="${href}"`), `${themeId}: ${expected.id} href`);
        assert.equal(anchor.includes('target="_blank" rel="noopener noreferrer"'), Boolean(expected.external), `${themeId}: ${expected.id} target`);
        assert.ok(body.includes(`<h3 class="blog-card-title">${expected.title}</h3>`), `${themeId}: ${expected.id} title`);
        assert.ok(body.includes(`<p class="blog-card-date">${expected.date}</p>`), `${themeId}: ${expected.id} date`);
        assert.ok(body.includes(`<p class="blog-card-excerpt">${expected.excerpt}</p>`), `${themeId}: ${expected.id} excerpt`);
        assert.equal(count(body, '<span class="pill">'), expected.tags.length, `${themeId}: ${expected.id} tag count`);
        expected.tags.forEach((tag) => assert.ok(body.includes(`<span class="pill">${tag}</span>`), `${themeId}: ${expected.id} ${tag}`));
      });
      assert.ok(!html.includes('gemma4-heretic-ara'), `${themeId}: Gemma draft absent`);
    }
  });

  it('keeps build-owned facts out of runtime and projects the tilt/ticker carriers', () => {
    for (const [id, html] of listings) {
      assert.ok(!html.includes('/js/blog-data.js'), `${id}: no catalog script`);
      assert.ok(!html.includes('window.BLOG_POSTS'), `${id}: no post catalog global`);
      assert.ok(!html.includes('renderCards'), `${id}: no runtime renderer`);
      assert.ok(!html.includes('renderFilterBar'), `${id}: no runtime filter renderer`);
      assert.ok(html.includes('--ticker-run:&quot;✷ '), `${id}: carousel ticker`);
      assert.ok(html.includes('--ticker-dur:87s;'), `${id}: carousel duration`);

      const theme = THEMES.find((candidate) => candidate.id === id)!;
      const tiltDisabled = theme.kind === 'skin' && theme.flags?.tilt === false;
      const htmlTag = /^<!DOCTYPE html>\n<html\b([^>]*)>/.exec(html);
      assert.ok(htmlTag, `${id}: html tag`);
      assert.equal(htmlTag[1].includes('data-no-tilt'), tiltDisabled, `${id}: tilt carrier`);
    }
  });

  it('omits card and intro elements whose supported prose slot is explicitly null', () => {
    let nullDir: string | undefined;
    try {
      const built = buildSite('s1-18-null-slots-', (root) => {
        const postFile = join(root, 'src', 'content', 'posts', 'fly-on-my-laptop.md');
        const post = readFileSync(postFile, 'utf8')
          .replace(/^title: \{ s: .* \}$/m, 'title: { s: null }')
          .replace(/^description: \{ l: .* \}$/m, 'description: { l: null }');
        writeFileSync(postFile, post);

        const proseFile = join(root, 'src', 'content', 'prose.yaml');
        const site = readFileSync(proseFile, 'utf8').replace(
          /    p2:\n      l: \|-\n        [^\n]+/,
          '    p2: { l: null }',
        );
        writeFileSync(proseFile, site);
      });
      nullDir = built.dir;
      const html = readFileSync(join(built.dist, 'blog', 'index.html'), 'utf8');
      const firstCard = /<div class="blog-card-wrapper"[^>]*>\s*<a class="blog-card"[^>]*>([\s\S]*?)<\/a>\s*<\/div>/.exec(html);
      assert.ok(firstCard, 'null fixture retains the first card wrapper');
      assert.ok(!firstCard[1].includes('class="blog-card-title"'), 'null title omits its heading');
      assert.ok(!firstCard[1].includes('class="blog-card-excerpt"'), 'null description omits its paragraph');
      assert.ok(!html.includes('id="blog-sub-text-2"'), 'null intro omits its paragraph');
      assert.ok(html.includes('id="blog-sub-text"'), 'written intro sibling remains');
      assert.ok(html.includes('id="blog-sub-text-3"'), 'written intro sibling remains');
    } finally {
      cleanup(nullDir);
    }
  });
});
