// S1-12: §5.2's composition table, the structural fallback and the emitted route set.
//
// Three parts, in one file because they check one decision from three distances:
//   a. composeFor() in process, over {default, a skin, a structural stub} x the five page types.
//   b. A REAL build of an isolated copy whose src/themes/registry.ts is overlaid with a
//      structural registration (the plan's "S1-24 fixture registration occurs in an isolated
//      copy"): the stub reaches the routes, the dock, the prose schema and the 404 island
//      through the ordinary extension points, and its owned assets stay on its owned page.
//   c. A REAL build of the same copy WITHOUT the overlay: the production route set, head
//      values, picker shapes and the 404's runtime bundle.
//
// Both builds assemble their own throwaway project under tests/fixtures/composition/.tmp
// (gitignored, inside the repo so node_modules resolves by walking up). Mutations are string
// replacements on the COPY; src/, public/ and the root config are never written to.
//
// Run: node --test --test-concurrency=1 tests/build/composition.test.ts

import assert from 'node:assert/strict';
import { cpSync, existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, join } from 'node:path';
import { after, before, describe, it } from 'node:test';
import { pathToFileURL } from 'node:url';

import type { AstroComponentFactory } from 'astro/runtime/server/index.js';

import { composeFor } from '../../src/layouts/compose.ts';
import { THEMES, THEME_IDS } from '../../src/themes/registry.ts';
import type { LazyLayout, PageType, SkinTheme, StructuralTheme, Theme } from '../../src/themes/types.ts';
import { BUILD_MS, buildSite, cleanup, fixtureRoot } from '../fixtures/composition/build.ts';

const PAGE_TYPES: readonly PageType[] = ['home', 'blog', 'post', 'privacy', 'notFound'];
const PUBLISHED_POSTS = [
  'fly-on-my-laptop',
  'underviewed-art',
  'arena-freshness',
  'helm',
  'toolbelt',
  'embedded-swift-agent',
  'metr-doubling',
  'college-projects',
] as const;
const ROUTE_TAILS = ['', 'blog/', 'privacy/', ...PUBLISHED_POSTS.map((id) => `blog/${id}/`)];

/** Emitted index.html files that are not engine routes: four redirect stubs, two public passthroughs. */
const NON_ROUTE_PAGES = [
  '12years/index.html',
  'blog/autoencoders-1/index.html',
  'blog/autoencoders-2/index.html',
  'embedded-swift-agent/index.html',
  'subsites/dawson/embedded-swift-agent/index.html',
  'subsites/elise/12years/index.html',
];

const BASE_CSS = '/css/themes/theme-base.css';
const SITE = 'https://www.dawsonamf.com';

// ---- helpers ---------------------------------------------------------------

/** One occurrence, or the fixture drifted and the case would silently test nothing. */
function edit(dir: string, rel: string, from: string, to: string) {
  const path = join(dir, rel);
  const text = readFileSync(path, 'utf8');
  const parts = text.split(from);
  assert.equal(parts.length, 2, `${rel}: expected exactly one occurrence of ${JSON.stringify(from)}`);
  writeFileSync(path, parts.join(to));
}

/**
 * The structural overlay, applied to the COPY: the registry is moved aside as registry.prod.ts
 * and replaced by the fixture's, the stub layout is added and prose.yaml gains its label.
 */
function structuralOverlay(dir: string) {
  const themes = join(dir, 'src', 'themes');
  cpSync(join(themes, 'registry.ts'), join(themes, 'registry.prod.ts'));
  cpSync(join(fixtureRoot, 'registry.ts'), join(themes, 'registry.ts'));
  cpSync(join(fixtureRoot, 'stub'), join(themes, 'stub'), { recursive: true });
  cpSync(join(fixtureRoot, 'public'), join(dir, 'public'), { recursive: true });
  // The prose schema builds `themes` from THEME_IDS, so a registry overlay needs a prose
  // overlay: the new id goes into the same mapping, right after the default's entry.
  const anchor = '  default: { label: { xs: Default } }\n';
  edit(dir, join('src', 'content', 'prose.yaml'), anchor, anchor + '  stub: { label: { xs: Stub } }\n');
}

/** Every emitted index.html, repo-relative to dist, sorted. */
const emittedPages = (dist: string) =>
  readdirSync(dist, { recursive: true, withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name === 'index.html')
    .map((entry) => join(entry.parentPath, entry.name).slice(dist.length + 1))
    .sort();

/** The eleven route pages of every id, in dist-relative form. */
const routePages = (ids: readonly string[]) =>
  ids.flatMap((id) => ROUTE_TAILS.map((tail) => (id === 'default' ? '' : `${id}/`) + tail + 'index.html')).sort();

const read = (dist: string, page: string) => readFileSync(join(dist, page), 'utf8');

const decode = (text: string) => text.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'");

/** The hrefs ThemeAssets emitted, in document order. */
const styleAssets = (html: string) =>
  [...html.matchAll(/<link rel="stylesheet" href="([^"]*)" data-style-asset="1">/g)].map((match) => decode(match[1]));

const markers = (html: string) => html.split('<!--theme-assets-->').length - 1;

const count = (html: string, needle: string) => html.split(needle).length - 1;

/** `#tc-presets` row ids in order, with the page each row links to. */
const dockRows = (html: string) =>
  [...html.matchAll(/<a href="([^"]*)" data-id="([^"]+)"/g)].map((match) => ({ href: match[1], id: match[2] }));

const skin = (id: string) => THEMES.find((entry) => entry.id === id) as SkinTheme;

// Detection substrings, each a stable literal of the component that emits it.
const SHIM = "var p=new URLSearchParams(location.search),q=p.get('style');";
const PREPAINT = "sessionStorage.getItem('dawson-theme-cycler')";
const CYCLER = '/js/theme-cycler.js';

/**
 * §5.4's position, structurally: the pre-paint script sits after `/css/theme-cycler.css` and
 * BEFORE the theme links, which is the order the bootstrap produced (it ran, then appended the
 * links), and all three are inside `<head>`. Nothing can paint before the palette if this holds.
 */
function assertHeadOrder(dist: string, pages: readonly string[]) {
  for (const page of pages) {
    const html = read(dist, page);
    const idx = (needle: string) => {
      const at = html.indexOf(needle);
      assert.notEqual(at, -1, `${page}: no ${JSON.stringify(needle)}`);
      return at;
    };
    assert.ok(idx('/css/theme-cycler.css') < idx(PREPAINT), `${page}: pre-paint before theme-cycler.css`);
    assert.ok(idx(PREPAINT) < idx('<!--theme-assets-->'), `${page}: theme links before the pre-paint script`);
    assert.ok(idx('<!--theme-assets-->') < idx('<body'), `${page}: theme links outside <head>`);
  }
}

/**
 * The 404's runtime half: ONE static chunk carrying no registry, and the island it reads. A
 * dynamic import here would mean a theme's `layouts: { home: () => import('./Home.astro') }`
 * reached the client graph, which is what serializing the registry at build prevents.
 */
function assertNotFoundRuntime(dist: string, ids: readonly string[]) {
  const html = read(dist, '404.html');
  // One module script, whichever form Astro chose: without the registry the chunk falls under
  // the inline limit, so it is written into the page instead of into _astro/.
  assert.equal(count(html, '<script type="module"'), 1, 'exactly one module script on the 404');
  const external = /<script type="module" src="([^"]+)"><\/script>/.exec(html);
  const inline = /<script type="module">([\s\S]*?)<\/script>/.exec(html);
  const bundle = external ? readFileSync(join(dist, external[1].replace(/^\//, '')), 'utf8') : inline?.[1];
  assert.ok(bundle, 'the module script is a resolvable src or an inline body');
  for (const banned of ['node:', '.astro', 'prose', 'posts', 'readFileSync', 'assertRegistry', 'RESERVED_IDS']) {
    assert.ok(!bundle.includes(banned), `the 404 bundle must not contain ${JSON.stringify(banned)}`);
  }
  assert.doesNotMatch(bundle, /\bimport\s*[('"]/, 'the 404 bundle is one chunk with no dynamic import');
  // The whole client output of the build is that one chunk, or nothing when it is inlined:
  // a lazy `layouts: { home: () => import('./Home.astro') }` would show up here as _astro/Home.
  const chunks = existsSync(join(dist, '_astro')) ? readdirSync(join(dist, '_astro')) : [];
  assert.deepEqual(chunks, external ? [basename(external[1])] : [], 'no second client chunk');

  const island = /<script type="application\/json" id="nf-themes">(.*?)<\/script>/s.exec(html);
  assert.ok(island, 'the 404 carries its appearance island');
  const data: Record<string, { theme: { id: string; kind: string }; extras: string; links?: string[] }> = JSON.parse(island[1]);
  assert.deepEqual(Object.keys(data), [...ids]);
  for (const [id, entry] of Object.entries(data)) {
    assert.equal(entry.theme.id, id, id);
    if (id === 'marquee' || id === 'doodle') assert.notEqual(entry.extras, '', `${id}: CSS prose extras`);
    assert.equal(Object.hasOwn(entry.theme, 'layouts'), false, `${id}: no layout metadata`);
  }
}

// ---- a. the table, in process ----------------------------------------------

describe('composeFor(): §5.2s table over the full page-type union', () => {
  const stubHome: LazyLayout = async () => ({ default: (() => '') as unknown as AstroComponentFactory });
  const stub: StructuralTheme = {
    kind: 'structural',
    id: 'stub',
    polarity: 'light',
    colors: { text: '#101014', bg: '#f4f2ee', primary: '#0f4bd8', secondary: '#e3e0d9', accent: '#c2410c' },
    fonts: ['https://fonts.googleapis.com/css2?family=Inter:wght@400;700&display=swap'],
    layouts: { home: stubHome },
  };
  const dflt = THEMES.find((entry) => entry.id === 'default') as Theme;
  const brutalist = skin('brutalist');

  const NO_ASSETS = { fonts: false, base: false, skin: false };
  const FONTS = { fonts: true, base: false, skin: false };
  const FONTS_BASE = { fonts: true, base: true, skin: false };
  const ALL_ASSETS = { fonts: true, base: true, skin: true };
  const NAV = { mount: 'nav' };
  const FAB = { mount: 'fab', corner: 'br' };

  /** [assets, picker, owns the layout] per page type, one row per theme kind. */
  const table: Record<string, Record<PageType, [object, object, boolean]>> = {
    default: {
      home: [NO_ASSETS, NAV, false],
      blog: [NO_ASSETS, NAV, false],
      post: [NO_ASSETS, NAV, false],
      privacy: [NO_ASSETS, FAB, false],
      notFound: [NO_ASSETS, FAB, false],
    },
    brutalist: {
      home: [ALL_ASSETS, NAV, false],
      blog: [ALL_ASSETS, NAV, false],
      post: [ALL_ASSETS, NAV, false],
      privacy: [ALL_ASSETS, FAB, false],
      notFound: [ALL_ASSETS, FAB, false],
    },
    stub: {
      home: [FONTS, FAB, true], // the one owned page type
      blog: [FONTS_BASE, NAV, false],
      post: [FONTS_BASE, NAV, false],
      privacy: [FONTS, FAB, false],
      notFound: [FONTS, FAB, false],
    },
  };

  const themes: Record<string, Theme> = { default: dflt, brutalist, stub };

  for (const [name, row] of Object.entries(table)) {
    for (const type of PAGE_TYPES) {
      const [assets, picker, owned] = row[type];
      it(`${name} / ${type}`, () => {
        const plan = composeFor(themes[name], type);
        assert.deepEqual(plan.assets, assets);
        assert.deepEqual(plan.picker, picker);
        assert.equal(plan.noindex, name !== 'default');
        if (owned) {
          assert.equal(plan.layout, stubHome);
        } else {
          // Not the theme's own layout, and the same canonical function object every theme
          // that falls back to this page type receives.
          assert.notEqual(plan.layout, stubHome);
          assert.equal(plan.layout, composeFor(dflt, type).layout);
        }
      });
    }
  }

  it('the five canonical layouts are five distinct lazy imports', () => {
    const layouts = PAGE_TYPES.map((type) => composeFor(dflt, type).layout);
    assert.equal(new Set(layouts).size, PAGE_TYPES.length);
  });

  it('no current page composition disables the picker', () => {
    for (const theme of THEMES) {
      for (const type of PAGE_TYPES) {
        assert.notEqual(composeFor(theme, type).picker.mount, 'none', `${theme.id} / ${type}`);
      }
    }
  });
});

// ---- b. a structural registration, through the normal extension points ------

describe('a structural theme registered in an isolated copy', () => {
  let dist = '';
  let dir: string | undefined;
  let ids: readonly string[] = [];
  let stubFonts: readonly string[] = [];

  before(async () => {
    const built = buildSite('structural-', structuralOverlay);
    dir = built.dir;
    dist = built.dist;
    // The expected route list comes from the OVERLAID registry, not from a repeated 'stub'.
    const overlay: { THEME_IDS: readonly string[]; THEMES: readonly Theme[] } = await import(
      pathToFileURL(join(built.dir, 'src', 'themes', 'registry.ts')).href
    );
    ids = overlay.THEME_IDS;
    stubFonts = overlay.THEMES.find((theme) => theme.id === 'stub')?.fonts ?? [];
    assert.deepEqual([...ids], [...THEME_IDS, 'stub']);
    assert.equal(stubFonts.length, 1);
  }, { timeout: BUILD_MS });

  after(() => cleanup(dir));

  it('emits 17 x 11 route pages plus 404.html, with no /default/ and no double prefix', () => {
    const expected = routePages(ids);
    const actual = emittedPages(dist);
    assert.equal(expected.length, 17 * 11);
    assert.deepEqual(expected.filter((page) => !actual.includes(page)), []);
    assert.deepEqual(actual.filter((page) => !expected.includes(page)), NON_ROUTE_PAGES);
    assert.ok(existsSync(join(dist, '404.html')));
  });

  it('the owned home renders the themes own body, head and assets', () => {
    const html = read(dist, 'stub/index.html');
    assert.ok(html.includes('<html lang="en" data-style="stub"'));
    assert.ok(html.includes('data-fixture="stub-home"'));
    assert.ok(html.includes('href="/css/stub.css"'));
    assert.ok(!html.includes('id="main-body"'), 'no canonical body wrapper on an owned page');
    // Its own fonts and nothing else: no theme-base, no skin sheet.
    assert.deepEqual(styleAssets(html), [...stubFonts]);
    assert.equal(markers(html), 1);
    assert.ok(html.includes(`<link rel="canonical" href="${SITE}/">`));
    assert.ok(html.includes('<meta name="robots" content="noindex">'));
    // The owned page mounts the FAB (§5.2) and gets the shared dock and runtime.
    assert.ok(html.includes('tc-fab'));
    assert.ok(html.includes('id="tc-dock"'));
    assert.ok(html.includes(CYCLER));
    assert.ok(html.includes(`href="/stub/blog/"`), 'href() themed the internal link');
  });

  it('an unowned blog falls back to the canonical layout with theme-base', () => {
    const html = read(dist, 'stub/blog/index.html');
    assert.deepEqual(styleAssets(html), [...stubFonts, BASE_CSS]);
    assert.equal(markers(html), 1);
    assert.ok(html.includes('<div id="main-body">'));
    assert.ok(html.includes('<nav class="moving-menu"'));
    assert.ok(html.includes('<ul class="menu-list">'));
    assert.ok(html.includes('<li class="tc-nav-item"><button type="button" class="menu-item tc-nav-trigger"'));
    assert.equal(count(html, 'tc-fab'), 0);
    assert.ok(!html.includes('/css/stub.css'));
    assert.ok(!html.includes('data-fixture'));
  });

  it('structural utility pages take the fonts alone', () => {
    const privacy = read(dist, 'stub/privacy/index.html');
    assert.deepEqual(styleAssets(privacy), [...stubFonts]);
    assert.equal(markers(privacy), 1);
    assert.ok(privacy.includes('class="tc-nav-trigger tc-fab-btn"'));
    assert.equal(count(privacy, 'tc-nav-trigger'), 1);

  });

  it('the owned pages assets reach no other page', () => {
    for (const page of emittedPages(dist)) {
      if (page === 'stub/index.html') continue;
      const html = read(dist, page);
      assert.ok(!html.includes('data-fixture'), page);
      assert.ok(!html.includes('/css/stub.css'), page);
    }
    assert.ok(!read(dist, '404.html').includes('/css/stub.css'));

    // The neighbours keep their own shape.
    assert.deepEqual(styleAssets(read(dist, 'brutalist/index.html')), [
      ...(skin('brutalist').fonts ?? []),
      BASE_CSS,
      skin('brutalist').css,
    ]);
    assert.deepEqual(styleAssets(read(dist, 'index.html')), []);
  });

  it('the stub registers in the dock like any other theme', () => {
    const rows = dockRows(read(dist, 'index.html'));
    assert.deepEqual(rows.map((row) => row.id), [...ids]);
    assert.equal(rows.find((row) => row.id === 'stub')?.href, '/stub/');
    // D11: the row keeps the page, so the stubs own row on its own page points at itself.
    assert.equal(dockRows(read(dist, 'stub/index.html')).find((row) => row.id === 'stub')?.href, '/stub/');
  });

  it('the 404 is built default and carries every registered id in its island', () => {
    const html = read(dist, '404.html');
    assert.ok(html.includes('<html lang="en" style="--text:'), 'built in the default theme');
    assert.ok(!html.includes('data-style='));
    assertNotFoundRuntime(dist, ids);
  });

  it('every page puts the pre-paint script between theme-cycler.css and the theme links', () => {
    assertHeadOrder(dist, [...routePages(ids), '404.html']);
  });
});

// ---- c. the production build ------------------------------------------------

describe('the production build', () => {
  let dist = '';
  let dir: string | undefined;

  before(() => {
    const built = buildSite('production-');
    dir = built.dir;
    dist = built.dist;
  }, { timeout: BUILD_MS });

  after(() => cleanup(dir));

  it('emits 16 x 11 route pages plus 404.html and nothing else route-shaped', () => {
    const expected = routePages(THEME_IDS);
    const actual = emittedPages(dist);
    assert.equal(expected.length, 16 * 11);
    assert.deepEqual(expected.filter((page) => !actual.includes(page)), []);
    assert.deepEqual(actual.filter((page) => !expected.includes(page)), NON_ROUTE_PAGES);
    assert.ok(existsSync(join(dist, '404.html')));
  });

  it('carries exactly one ThemeAssets marker per route page and on the 404', () => {
    for (const page of [...routePages(THEME_IDS), '404.html']) {
      assert.equal(markers(read(dist, page)), 1, page);
    }
  });

  it('writes the concrete canonical and robots values §6.1 specifies', () => {
    const themedBlog = read(dist, 'brutalist/blog/index.html');
    assert.ok(themedBlog.includes(`<link rel="canonical" href="${SITE}/blog/">`));
    assert.ok(themedBlog.includes('<meta name="robots" content="noindex">'));

    const blog = read(dist, 'blog/index.html');
    assert.ok(blog.includes(`<link rel="canonical" href="${SITE}/blog/">`));
    assert.equal(count(blog, 'name="robots"'), 0);

    const themedPrivacy = read(dist, 'marquee/privacy/index.html');
    assert.ok(themedPrivacy.includes(`<link rel="canonical" href="${SITE}/privacy/">`));
    assert.ok(themedPrivacy.includes('<meta name="robots" content="noindex">'));

    const privacy = read(dist, 'privacy/index.html');
    assert.equal(count(privacy, 'rel="canonical"'), 0);
    assert.equal(count(privacy, 'name="robots"'), 0);

  });

  it('emits fonts, theme-base and the skin sheet in order, and nothing on default routes', () => {
    assert.deepEqual(styleAssets(read(dist, 'brutalist/index.html')), [
      ...(skin('brutalist').fonts ?? []),
      BASE_CSS,
      skin('brutalist').css,
    ]);
    for (const tail of ROUTE_TAILS) {
      assert.deepEqual(styleAssets(read(dist, tail + 'index.html')), [], tail || '/');
    }
    assert.deepEqual(styleAssets(read(dist, '404.html')), []);
  });

  it('privacy mounts the FAB and no other trigger', () => {
    for (const page of ['privacy/index.html', 'doodle/privacy/index.html']) {
      const html = read(dist, page);
      assert.ok(html.includes('id="tc-dock"'), page);
      assert.ok(html.includes('id="tc-scrim"'), page);
      assert.ok(html.includes(CYCLER), page);
      assert.ok(html.includes('class="tc-nav-trigger tc-fab-btn"'), page);
      assert.equal(count(html, 'tc-nav-trigger'), 1, page);
    }
  });

  it('home and blog mount the trigger in the nav and carry no FAB', () => {
    for (const page of ['index.html', 'blog/index.html', 'brutalist/index.html', 'brutalist/blog/index.html']) {
      const html = read(dist, page);
      assert.ok(html.includes('id="tc-dock"'), page);
      assert.ok(html.includes('id="tc-scrim"'), page);
      assert.ok(html.includes(CYCLER), page);
      assert.ok(html.includes('class="menu-item tc-nav-trigger"'), page);
      assert.equal(count(html, 'tc-fab'), 0, page);
    }
  });

  it('the ?style= shim renders on default routes only, never on a themed route or the 404', () => {
    const idList = JSON.stringify([...THEME_IDS]);
    for (const tail of ROUTE_TAILS) {
      const html = read(dist, tail + 'index.html');
      assert.equal(count(html, SHIM), 1, tail || '/');
      assert.ok(html.includes(idList), `${tail || '/'}: the shim inlines the id list`);
    }
    for (const page of ['brutalist/index.html', 'grid/blog/index.html', 'marquee/privacy/index.html', '404.html']) {
      assert.equal(count(read(dist, page), SHIM), 0, page);
    }
  });

  it('the pre-paint script renders on every emitted engine page and the 404', () => {
    for (const page of [...routePages(THEME_IDS), '404.html']) {
      assert.equal(count(read(dist, page), PREPAINT), 1, page);
    }
  });

  it('the 404s runtime script runs before the picker runtime', () => {
    const html = read(dist, '404.html');
    const module = html.indexOf('<script type="module"');
    assert.ok(module > -1, 'the 404 carries its bundled module script');
    assert.ok(module < html.indexOf(CYCLER), 'the theme is applied before the cycler boots');
  });

  it('the 404s bundle carries no layout, no prose, no Node API and no registry', () => {
    assertNotFoundRuntime(dist, THEME_IDS);
  });

  it('every page puts the pre-paint script between theme-cycler.css and the theme links', () => {
    assertHeadOrder(dist, [...routePages(THEME_IDS), '404.html']);
  });

  it('each page type keeps its own head, so a home/blog layout swap cannot pass', () => {
    const home = read(dist, 'index.html');
    const blog = read(dist, 'blog/index.html');
    assert.ok(blog.includes('/blog/blog-listing-styles.css'), 'the listing carries its own sheet');
    assert.ok(!home.includes('/blog/blog-listing-styles.css'), 'home does not');
    assert.ok(home.includes('/css/featured-carousel.css'), 'home carries the carousel sheet');
  });

  it('the 404s own links stay default-theme links', () => {
    const html = read(dist, '404.html');
    assert.ok(html.includes('class="name-logo name-logo-visible" href="/"'));
    assert.ok(html.includes('class="text-link" href="/"'));
  });
});
