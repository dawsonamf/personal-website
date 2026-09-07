// S1-06: the migrated shared prose (src/content/prose.yaml) and its schema.
//
// Two kinds of evidence. tests/fixtures/prose-migration.json is the frozen oracle for the
// HTML-sourced prose: each entry holds the legacy DOM fragment as it reads today, and the
// accessor output must equal it after one shared normalizer. The JS-sourced data (nav,
// socials, FEATURED_PROJECTS, theme labels, masthead arrays) and the two CSS `content:`
// literals are compared LIVE against the baseline source in this run, so an edit there
// fails here rather than drifting silently.
//
// A mismatch is a migration bug: fix the YAML toward the legacy, never the fixture.
//
// Run: node --test tests/unit/site-prose.test.ts

import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, it } from 'node:test';
import { runInNewContext } from 'node:vm';

import { load } from 'js-yaml';

import { findDrafts } from '../../src/prose/drafts.ts';
import { SIZES } from '../../src/prose/fields.ts';
import type { Size } from '../../src/prose/fields.ts';
import { createProseAccess } from '../../src/prose/index.ts';
import { deriveMastheadSteps } from '../../src/prose/masthead.ts';
import type { MastheadStep } from '../../src/prose/masthead.ts';
import { siteProseSchema } from '../../src/prose/schema.ts';
import type { SiteProse } from '../../src/prose/schema.ts';
import { THEME_IDS } from '../../src/themes/registry.ts';

const repoRoot = resolve(import.meta.dirname, '..', '..');
// PARITY_OLD_DIR wins, matching tests/unit/theme-registry.test.ts:45.
const oldRoot = process.env.PARITY_OLD_DIR ?? repoRoot;
const legacy = (relative: string) => {
  const file = resolve(oldRoot, relative);
  assert.ok(
    existsSync(file),
    `${file} is missing; set PARITY_OLD_DIR to the baseline checkout instead of skipping this check`,
  );
  return readFileSync(file, 'utf8');
};
/** Drift guard on a legacy source. `includes`, not `assert.match`, so a failure prints the
 *  missing literal rather than the whole file. */
const contains = (relative: string, literal: string) =>
  assert.ok(legacy(relative).includes(literal), `${relative} no longer contains ${JSON.stringify(literal)}`);
/** The six pages the shared prose is migrated from. */
const LEGACY_PAGES = [
  'index.html',
  '404.html',
  'blog/index.html',
  'blog/post.html',
  'lexchat/index.html',
  'privacy/index.html',
];

const yamlText = readFileSync(resolve(repoRoot, 'src/content/prose.yaml'), 'utf8');
// js-yaml 4 throws on a duplicate key, which is the behaviour this migration wants.
const tree = load(yamlText, { filename: 'src/content/prose.yaml' });
// Key order and "what is written" are read off the document, not off the parse: zod rebuilds
// the object in schema order, so an assertion against the parsed tree cannot see YAML drift.
const raw = tree as Record<string, unknown>;
const parsed: SiteProse = siteProseSchema.parse(tree);
const prose = createProseAccess(parsed, 'prose');

// The fixture drives paths as plain strings; the typed path surface is exercised at the
// bottom of this file, where `tsc` is the checker.
type LooseAccess = {
  get(path: string, size: Size): string;
  text(path: string, size: Size): string;
  list(path: string, size: Size): string[];
  paragraphs(path: string, size: Size): string[];
};
const loose = prose as unknown as LooseAccess;

// ---- fixture ----------------------------------------------------------------

type Entry = {
  path: string;
  size: Size;
  method: 'text' | 'paragraphs' | 'list' | 'get';
  source: string;
  expected: string | string[];
  delta?: string;
};
type Fixture = {
  note: string;
  entries: Entry[];
  titles: Record<string, { path: string; legacy: string; source: string; suffix: boolean }>;
  titleSuffix: string;
  urls: { legacy: string; canonical: string; source: string }[];
  picker: { path: string; expected: string; source: string }[];
};
const fixture = JSON.parse(
  readFileSync(resolve(repoRoot, 'tests/fixtures/prose-migration.json'), 'utf8'),
) as Fixture;

// ---- one shared normalizer ---------------------------------------------------
// Both sides are compared as rendered DOM, not as source bytes: marked escapes `"` and `'`
// where the legacy HTML wrote them raw (§4.1 rule 7 keeps prose plain in YAML and lets the
// renderer escape once), and D16 fixes the anchor attribute order. Decoding is a single
// pass, so a double escape (`&amp;amp;`) still fails.
const ENTITIES: Record<string, string> = {
  '&amp;': '&',
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&#39;': "'",
};
const sortAnchorAttributes = (html: string) =>
  html.replace(/<a\s+([^>]*?)\s*>/g, (_match, attrs: string) => {
    const pairs = [...attrs.matchAll(/[a-zA-Z-]+="[^"]*"/g)].map((m) => m[0]).sort();
    const rest = attrs.replace(/[a-zA-Z-]+="[^"]*"/g, '').trim();
    if (rest !== '') throw new Error(`unsorted <a> attribute dropped: ${JSON.stringify(rest)}`);
    return `<a ${pairs.join(' ')}>`;
  });
const norm = (html: string) =>
  sortAnchorAttributes(html)
    .replace(/&(?:amp|lt|gt|quot|#39);/g, (entity) => ENTITIES[entity])
    .replace(/\s+/g, ' ')
    .trim();

// One narrow, explicit transform per fixture entry that carries a `delta`. Applied to the
// legacy side only, before the shared normalizer, and given the item's index so a list delta
// can name the one item it covers. Nothing here may widen into a general rule.
const DELTAS: Record<string, (expected: string, index: number) => string> = {
  // index.html:111 closes the LAST paragraph with a lone <br>; that trailer is presentation
  // and is not stored (S1-15 re-adds it if the canonical card still wants it).
  'home.about.body': (text, index) => (index === 3 ? text.replace(/\s*<br\s*\/?>\s*$/i, '') : text),
  // index.html:275-276 wraps the Calendly anchor across lines, so its text node starts with a
  // space; Markdown emits the text tight. Identical after the browser's own collapsing.
  'home.contact.body': (text) => text.replace('calendly-link"> schedule a call', 'calendly-link">schedule a call'),
  // D16 gives every mailto link target/rel; privacy/index.html:110 has neither today.
  'privacy.body': (text) =>
    text.replace(
      '<a href="mailto:dawsonamf@icloud.com" class="text-link">',
      '<a href="mailto:dawsonamf@icloud.com" class="text-link" target="_blank" rel="noopener noreferrer">',
    ),
};

// ---- legacy JS through a vm realm -------------------------------------------

type Sandbox = Record<string, unknown>;
function evaluateLegacy(file: string, extra: Sandbox = {}): Sandbox {
  const noop = () => {};
  const sandbox: Sandbox = {
    document: {
      documentElement: { setAttribute: noop, style: { setProperty: noop, removeProperty: noop } },
      head: { appendChild: noop },
      createElement: () => ({ setAttribute: noop }),
      getElementById: () => null,
      querySelector: () => null,
      querySelectorAll: () => [],
      addEventListener: noop,
    },
    performance: { getEntriesByType: () => [] },
    sessionStorage: { getItem: () => null, setItem: noop, removeItem: noop },
    location: { search: '', pathname: '/' },
    addEventListener: noop,
    getComputedStyle: () => ({ getPropertyValue: () => '' }),
    ...extra,
  };
  sandbox.window = sandbox;
  runInNewContext(legacy(file), sandbox, { filename: file });
  return sandbox;
}

type LegacyProject = {
  id: string;
  title: string;
  description: string;
  image: string;
  tech: string[];
  accentColor: string;
  url?: string;
  ctaLabel?: string;
  external?: boolean;
  url2?: string;
  ctaLabel2?: string;
  external2?: boolean;
};
type LegacySocial = { href: string; icon: string; label: string; isCalendly?: boolean };
type LegacyPost = { id: string; title: string; excerpt: string };

const blogData = evaluateLegacy('js/blog-data.js');
const legacyProjects = structuredClone(blogData.FEATURED_PROJECTS) as LegacyProject[];
const legacyPosts = structuredClone(blogData.BLOG_POSTS) as LegacyPost[];

const navData = evaluateLegacy('js/nav-config.js', { __THEME_CYCLER_ENABLED: true });
const legacySocials = structuredClone(navData.SOCIAL_LINKS) as LegacySocial[];
type LegacyNavItem = { label?: string; href?: string; isThemeTrigger?: boolean };
const legacyNav = structuredClone(navData.NAV_CONFIG) as {
  NAV_LINKS: LegacyNavItem[];
  MOBILE_NAV_LINKS: LegacyNavItem[];
};

const themeData = evaluateLegacy('js/theme-bootstrap.js');
const legacyRegistry = structuredClone(themeData.__THEME_REGISTRY) as Record<string, { label: string }>;

// The masthead arrays are read the way tests/unit/masthead.test.ts reads their literals:
// slice the `sequences: [...]` array, evaluate it with the callback identifiers stubbed,
// and drop the function-valued callback steps.
function legacySequences(file: string, callbacks: string[]): MastheadStep[][] {
  const text = legacy(file);
  const open = text.indexOf('[', text.indexOf('sequences: ['));
  let depth = 0;
  let end = open;
  for (; end < text.length; end++) {
    if (text[end] === '[') depth++;
    else if (text[end] === ']' && --depth === 0) break;
  }
  const stubs = callbacks.map((name) => `const ${name} = () => {};`).join('');
  // The legacy arrays carry a fourth, function-valued step the derivation never produces.
  type LegacyStep = MastheadStep | { action: 'callback'; fn: unknown };
  const value = runInNewContext(`${stubs} (${text.slice(open, end + 1)})`, {}) as LegacyStep[][];
  // Filter before cloning: functions are not structured-cloneable.
  return structuredClone(
    value.map((steps) => steps.filter((step): step is MastheadStep => step.action !== 'callback')),
  );
}

// ---- tree walking ------------------------------------------------------------

const isSizeMap = (value: unknown): value is Record<string, unknown> => {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return false;
  const keys = Object.keys(value);
  return keys.length > 0 && keys.every((key) => (SIZES as readonly string[]).includes(key));
};

function walk(node: unknown, visit: (path: string, key: string, value: unknown) => boolean | void, path = ''): void {
  if (typeof node !== 'object' || node === null) return;
  for (const [key, value] of Object.entries(node)) {
    const here = path === '' ? key : `${path}.${key}`;
    if (visit(here, key, value) === false) continue;
    walk(value, visit, here);
  }
}

function collectSizeMaps(node: unknown): { path: string; map: Record<string, unknown> }[] {
  const found: { path: string; map: Record<string, unknown> }[] = [];
  walk(node, (here, _key, value) => {
    if (!isSizeMap(value)) return;
    found.push({ path: here, map: value });
    return false;
  });
  return found;
}

// Rule E: the sizes the canonical family requests. Everything not listed is xs.
const SIZE_RULES: [RegExp, Size][] = [
  [/^home\.about\.body$/, 'l'],
  [/^home\.skills\.groups\.\d+\.body$/, 'l'],
  [/^jobs\.\d+\.bullets$/, 'l'],
  [/^projects\.\d+\.description$/, 'l'],
  [/^blog\.intro\.p[123]$/, 'l'],
  [/^privacy\.body$/, 'l'],
  [/^meta\.[A-Za-z]+\.description$/, 'm'],
  [/^home\.contact\.body$/, 'm'],
  [/^meta\.[A-Za-z]+\.title$/, 's'],
  [/^meta\.[A-Za-z]+\.ogDescription$/, 's'],
  [/^site\.footerCredit$/, 's'],
  [/^notFound\.message$/, 's'],
];
const expectedSize = (path: string): Size => SIZE_RULES.find(([re]) => re.test(path))?.[1] ?? 'xs';

/** The "no invented copy" proof: one written size per map, at the size rule E implies. */
function oneSizeIssues(node: unknown): string[] {
  const issues: string[] = [];
  for (const { path, map } of collectSizeMaps(node)) {
    const written = Object.entries(map).filter(([, value]) => value !== undefined);
    if (written.length !== 1) {
      issues.push(`${path}: ${written.length} written sizes (${written.map(([s]) => s).join(',')})`);
      continue;
    }
    const [size, value] = written[0];
    if (size !== expectedSize(path)) issues.push(`${path}: size ${size}, rule E says ${expectedSize(path)}`);
    if (value === null) issues.push(`${path}: null, which omits the element`);
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) issues.push(`${path}: drafted`);
  }
  return issues;
}

/** Every string in the document, path included: the raw-YAML checks below read this, not zod's output. */
function stringLeaves(node: unknown): { path: string; value: string }[] {
  const found: { path: string; value: string }[] = [];
  walk(node, (here, _key, value) => {
    if (typeof value === 'string') found.push({ path: here, value });
  });
  return found;
}

function urlLeaves(node: unknown): { path: string; value: string }[] {
  const found: { path: string; value: string }[] = [];
  walk(node, (here, key, value) => {
    if (typeof value === 'string' && (key === 'href' || key === 'url' || key === 'image')) {
      found.push({ path: here, value });
    }
  });
  return found;
}

// =============================================================================

describe('the document', () => {
  it('loads, validates and carries no draft', () => {
    assert.equal(typeof tree, 'object');
    assert.deepStrictEqual(findDrafts(parsed, 'prose'), []);
  });

  // §4.1 rule 7: prose is plain text in YAML; the renderer escapes it once. The fixture
  // normalizer decodes entities on both sides, so an escaped value would pass parity
  // unnoticed and then reach the page double-escaped. This is the check that catches it.
  it('stores plain text, never HTML (§4.1 rule 7)', () => {
    const offenders = stringLeaves(tree)
      .filter(({ value }) => /&(?:[a-zA-Z]+|#\d+|#x[0-9a-fA-F]+);/.test(value) || /<[a-zA-Z\/!]/.test(value))
      .map(({ path, value }) => `${path}: ${value}`);
    assert.deepStrictEqual(offenders, []);
  });

  it('has exactly the agreed top-level keys, in order', () => {
    // Read off the document: zod rebuilds the object in schema order, so parsed cannot fail here.
    assert.deepStrictEqual(Object.keys(raw), [
      'site',
      'meta',
      'nav',
      'socials',
      'home',
      'jobs',
      'projects',
      'post',
      'carousel',
      'blog',
      'canonical',
      'picker',
      'themes',
      'privacy',
      'notFound',
    ]);
    assert.equal('posts' in raw, false);
  });

  it("holds today's counts", () => {
    assert.equal(parsed.jobs.length, 4);
    assert.equal(parsed.projects.length, 8);
    assert.equal(parsed.socials.length, 6);
    assert.equal(Object.keys(parsed.themes).length, 16);
    assert.equal(parsed.canonical.masthead.home.length, 9);
    assert.equal(parsed.canonical.masthead.listing.length, 7);
  });
});

describe('no post mirror (D8)', () => {
  it('has ten legacy listing records and mirrors none of their prose', () => {
    assert.equal(legacyPosts.length, 10);
    for (const post of legacyPosts) {
      assert.equal(yamlText.includes(post.title), false, `prose.yaml mirrors the title of ${post.id}`);
      assert.equal(yamlText.includes(post.excerpt), false, `prose.yaml mirrors the excerpt of ${post.id}`);
    }
  });
});

describe('sizes (§4.1, rule E)', () => {
  it('writes exactly one size per field, at the requested size', () => {
    assert.deepStrictEqual(oneSizeIssues(parsed), []);
  });

  it('covers every field: the walk sees one size map per prose field', () => {
    // site 4, meta 11, nav 11, socials 6, home 18, jobs 16, projects 25 (16 + 9 CTA labels),
    // post 2, carousel 1, blog 5, picker 28, themes 18, privacy 3, notFound 3. The exact
    // number is the guard against a field silently disappearing.
    assert.equal(collectSizeMaps(parsed).length, 151);
  });

  it('keeps every chip list an xs string list', () => {
    for (const [index, project] of parsed.projects.entries()) {
      assert.ok(Array.isArray(project.tech), `projects.${index}.tech`);
      for (const chip of project.tech ?? []) assert.equal(typeof chip, 'string', `projects.${index}.tech`);
    }
  });
});

describe('fixture parity with the legacy DOM', () => {
  it('registers a transform for every entry that declares a delta, and no other', () => {
    const declared = fixture.entries.filter((entry) => entry.delta).map((entry) => entry.path).sort();
    assert.deepStrictEqual(Object.keys(DELTAS).sort(), declared);
  });

  // The fixture is the rendered DOM, so commented-out markup is not live prose: index.html:172
  // holds a job bullet the page never shows, and migrating it would invent copy.
  it('stores nothing that lives only inside an HTML comment', () => {
    const collapse = (text: string) => text.replace(/\s+/g, ' ').trim();
    const comments = LEGACY_PAGES.flatMap((page) =>
      [...legacy(page).matchAll(/<!--([\s\S]*?)-->/g)].map((match) => collapse(match[1])),
    );
    const leaked = stringLeaves(tree)
      .map(({ path, value }) => ({ path, value: collapse(value) }))
      // Six words is long enough that a match is the migrated sentence, not a shared label.
      .filter(({ value }) => value.split(' ').length >= 6 && comments.some((body) => body.includes(value)))
      .map(({ path, value }) => `${path}: ${value}`);
    assert.deepStrictEqual(leaked, []);
  });

  for (const entry of fixture.entries) {
    it(`${entry.path} (${entry.size}) matches ${entry.source}`, () => {
      const adjust = entry.delta ? DELTAS[entry.path] : (text: string) => text;
      assert.ok(!entry.delta || adjust, `${entry.path} declares a delta with no transform`);
      if (entry.method === 'text' || entry.method === 'get') {
        assert.equal(typeof entry.expected, 'string');
        assert.equal(norm(loose[entry.method](entry.path, entry.size)), norm(adjust(entry.expected as string, 0)));
      } else {
        assert.ok(Array.isArray(entry.expected));
        assert.deepStrictEqual(
          loose[entry.method](entry.path, entry.size).map(norm),
          (entry.expected as string[]).map((text, index) => norm(adjust(text, index))),
        );
      }
    });
  }

  // The jobs panel's anchors, which are data rather than prose: index.html:164/177/186/198.
  // The third job is unlinked today and stays url-less.
  it('keeps each job link, and leaves the unlinked job unlinked', () => {
    const titles = [...legacy('index.html').matchAll(/<h3 class="job-title">(.*?)<\/h3>/g)].map((m) => m[1]);
    assert.equal(titles.length, parsed.jobs.length);
    for (const [index, html] of titles.entries()) {
      assert.equal(parsed.jobs[index].url, /href="([^"]+)"/.exec(html)?.[1], `jobs.${index}.url`);
    }
  });

  it('stores each page title without the shared suffix', () => {
    assert.equal(prose.text('site.titleSuffix', 'xs'), fixture.titleSuffix);
    // The wordmark name and the title suffix are both the home <title>, which carries no suffix.
    assert.equal(prose.text('site.name', 'xs'), fixture.titles.home.legacy);
    assert.equal(prose.text('site.titleSuffix', 'xs'), fixture.titles.home.legacy);
    for (const [page, expected] of Object.entries(fixture.titles)) {
      const stored = loose.text(expected.path, 's');
      const rebuilt = expected.suffix ? `${stored} | ${fixture.titleSuffix}` : stored;
      assert.equal(rebuilt, expected.legacy, `${page} <title> (${expected.source})`);
    }
  });
});

describe('live parity with the legacy JavaScript', () => {
  it('keeps the nav labels and their order', () => {
    const labels = [...legacyNav.NAV_LINKS, ...legacyNav.MOBILE_NAV_LINKS]
      .map((item) => item.label)
      .filter((label): label is string => typeof label === 'string');
    assert.deepStrictEqual(
      [...new Set(labels)],
      ['About', 'Experience', 'Projects', 'Blog', 'Contact', 'Resume', 'Theme', 'Email'],
    );

    // One key per legacy item, not membership in the label pool: the six desktop links in
    // config order, the mobile mailto item, and the theme dropdown trigger (js/nav-config.js:8-30).
    const desktop = legacyNav.NAV_LINKS.filter((item) => !item.isThemeTrigger);
    assert.equal(desktop.length, 6, 'js/nav-config.js no longer has six desktop links');
    const expected = [
      ...(['about', 'experience', 'projects', 'blog', 'contact', 'resume'] as const).map(
        (key, index) => [key, desktop[index].label] as const,
      ),
      ['email', legacyNav.MOBILE_NAV_LINKS.find((item) => item.href?.startsWith('mailto:'))?.label] as const,
      ['theme', legacyNav.NAV_LINKS.find((item) => item.isThemeTrigger)?.label] as const,
    ];
    for (const [key, label] of expected) {
      assert.equal(prose.text(`nav.${key}`, 'xs'), label, `nav.${key}`);
    }
  });

  it('keeps the six socials, in order, with converted hrefs', () => {
    assert.equal(parsed.socials.length, legacySocials.length);
    for (const [index, item] of legacySocials.entries()) {
      const stored = parsed.socials[index];
      assert.equal(loose.text(`socials.${index}.label`, 'xs'), item.label, `socials.${index} label`);
      assert.equal(stored.icon, item.icon, `socials.${index} icon`);
      if (item.isCalendly) {
        assert.equal(stored.calendly, true);
        assert.equal(stored.href, undefined, 'the Calendly item carries no href');
      } else {
        assert.equal(stored.calendly, undefined);
        const converted = fixture.urls.find((row) => row.legacy === item.href);
        assert.equal(stored.href, converted ? converted.canonical : item.href, `socials.${index} href`);
      }
    }

    // site.email is data the mailto social is built from, so the two must not drift apart.
    const email = legacySocials.find((item) => item.href.startsWith('mailto:'));
    assert.equal(email?.href, `mailto:${parsed.site.email}`, 'site.email');
  });

  it('keeps the eight projects verbatim, in order', () => {
    assert.deepStrictEqual(parsed.projects.map((p) => p.id), legacyProjects.map((p) => p.id));
    assert.ok(parsed.projects.some((p) => p.id === 'gemma4-heretic-ara'), 'the Gemma card stays');

    for (const [index, item] of legacyProjects.entries()) {
      const stored = parsed.projects[index];
      const at = `projects.${index} (${item.id})`;
      assert.equal(loose.text(`projects.${index}.title`, 'xs'), item.title, `${at} title`);
      assert.deepStrictEqual(loose.list(`projects.${index}.tech`, 'xs'), item.tech, `${at} tech`);
      assert.equal(stored.accentColor, item.accentColor, `${at} accentColor`);

      const convert = (url: string) => fixture.urls.find((row) => row.legacy === url)?.canonical ?? url;
      assert.equal(stored.image, convert(item.image), `${at} image`);

      assert.deepStrictEqual(
        loose.paragraphs(`projects.${index}.description`, 'l').map(norm),
        item.description.split(/<br><br>/).map(norm),
        `${at} description paragraphs`,
      );

      // Order and the raw target data: CTA 1 carries `external`, CTA 2 carries `external2`.
      const expectedCtas = [
        item.url && item.ctaLabel
          ? { label: item.ctaLabel, href: convert(item.url), external: !!item.external }
          : null,
        item.url2 && item.ctaLabel2
          ? { label: item.ctaLabel2, href: convert(item.url2), external: !!item.external2 }
          : null,
      ].filter((cta) => cta !== null);
      assert.deepStrictEqual(
        stored.ctas.map((cta, i) => ({
          label: loose.text(`projects.${index}.ctas.${i}.label`, 'xs'),
          href: cta.href,
          external: cta.external === true,
        })),
        expectedCtas,
        `${at} ctas`,
      );
    }
  });

  it("preserves the Embedded Swift second-link fallback and Deep RL's absent CTAs", () => {
    const embedded = parsed.projects.find((p) => p.id === 'embedded-swift-agent');
    assert.ok(embedded);
    assert.equal(embedded.ctas.length, 2);
    assert.equal(embedded.ctas[0].external, undefined, 'CTA 1 is the internal subsite link');
    assert.equal(embedded.ctas[0].href, '/subsites/dawson/embedded-swift-agent/');
    assert.equal(embedded.ctas[1].external, true, 'CTA 2 keeps its own external flag');

    const deepRl = parsed.projects.find((p) => p.id === 'deep-rl');
    assert.ok(deepRl);
    assert.deepStrictEqual(deepRl.ctas, []);
  });

  it('keeps the 16 theme labels from js/theme-bootstrap.js', () => {
    // Off the document again: zod would rebuild these keys in THEME_IDS order whatever the YAML says.
    assert.deepStrictEqual(Object.keys(raw.themes as Record<string, unknown>), [...THEME_IDS]);
    for (const id of THEME_IDS) {
      assert.equal(loose.text(`themes.${id}.label`, 'xs'), legacyRegistry[id].label, `themes.${id}.label`);
    }
  });

  it('stores the marquee ticker unit and doodle message from the CSS', () => {
    const marquee = /content: var\(--ticker-run, "([^"]*)"\);/.exec(legacy('css/themes/marquee.css'));
    assert.ok(marquee, 'css/themes/marquee.css no longer has the --ticker-run fallback literal');
    const unit = prose.text('themes.marquee.ticker', 'xs');
    assert.equal(unit.repeat(12), marquee[1], 'the stored unit must rebuild the literal exactly (D14)');
    assert.ok(unit.endsWith(' '), 'the unit keeps its trailing space');

    contains('css/themes/doodle.css', "content: 'currently here \\2713';");
    assert.equal(prose.text('themes.doodle.currentlyHere', 'xs'), 'currently here ✓');
  });
});

describe('masthead (D36)', () => {
  const legacyHome = legacySequences('js/script.js', ['startAnimations']);
  const legacyListing = legacySequences('blog/blog-listing.js', ['onBlogTypingComplete']);

  it('keeps nine home and seven listing sequences, duplicates included', () => {
    assert.equal(legacyHome.length, 9);
    assert.equal(legacyListing.length, 7);
    assert.equal(parsed.canonical.masthead.home.length, legacyHome.length);
    assert.equal(parsed.canonical.masthead.listing.length, legacyListing.length);
    const firsts = parsed.canonical.masthead.home.map((s) => s.lines[0]);
    assert.ok(firsts.length > new Set(firsts).size, 'the duplicate-weighted sequences are still duplicated');
  });

  it('overrides the pause on the one outlier only', () => {
    const pauses = parsed.canonical.masthead.home.map((s) => s.pause);
    assert.deepStrictEqual(
      pauses,
      [undefined, 1000, undefined, undefined, undefined, undefined, undefined, undefined, undefined],
    );
    assert.deepStrictEqual(parsed.canonical.masthead.listing.map((s) => s.pause), Array(7).fill(undefined));
  });

  for (const [page, sequences, fallback] of [
    ['home', legacyHome, 1500],
    ['listing', legacyListing, 800],
  ] as const) {
    for (const [index, expected] of sequences.entries()) {
      it(`derives ${page} sequence ${index} from its stored lines`, () => {
        const stored = parsed.canonical.masthead[page][index];
        assert.deepStrictEqual(deriveMastheadSteps(stored.lines, stored.pause ?? fallback), expected);
      });
    }
  }
});

describe('picker strings and templates', () => {
  for (const row of fixture.picker) {
    it(`${row.path} equals ${row.source}`, () => {
      assert.equal(loose.text(row.path, 'xs'), row.expected);
    });
  }

  it('keeps ampersands plain (§4.1 rule 7)', () => {
    // The legacy carries both forms of the same string: escaped in the dock template it
    // writes as HTML, bare in the JS that later swaps the label. Prose stores it once, plain.
    assert.equal(prose.text('picker.advancedSub', 'xs'), 'scheme & colors');
    contains('js/theme-cycler.js', 'id="tc-advanced-sub">scheme &amp; colors<');
    contains('js/theme-cycler.js', "'done editing' : 'scheme & colors'");
  });

  it('keeps {n} in every generated-text template', () => {
    // The exact strings the client composes today: blog/blog-post.js:176-179 concatenates
    // `minutes + ' min read'`, js/featured-carousel.js:266 `'Go to slide ' + (i + 1)`.
    assert.equal(prose.text('post.readTime', 'xs'), '{n} min read');
    assert.equal(prose.text('carousel.goToSlide', 'xs'), 'Go to slide {n}');
    assert.equal(prose.text('post.copyCode', 'xs'), 'Copy code');
    contains('blog/blog-post.js', "setAttribute('aria-label', 'Copy code')");
    contains('blog/blog-post.js', "minutes + ' min read'");
    contains('js/featured-carousel.js', 'aria-label="Go to slide \' + (i + 1)');
  });
});

describe('URLs (§6.1, §6.4)', () => {
  const leaves = urlLeaves(parsed);

  it('carries no legacy destination form', () => {
    for (const leaf of leaves) {
      assert.equal(leaf.value.includes('post.html?id='), false, leaf.path);
      assert.equal(leaf.value.includes('www.dawsonamf.com'), false, leaf.path);
      assert.equal(leaf.value.startsWith('/embedded-swift-agent/'), false, leaf.path);
    }
  });

  it('honours the fixture conversion table', () => {
    const values = new Set(leaves.map((leaf) => leaf.value));
    for (const row of fixture.urls) {
      assert.ok(values.has(row.canonical), `${row.canonical} is missing (from ${row.source})`);
      assert.equal(values.has(row.legacy), false, `${row.legacy} survived (from ${row.source})`);
    }
  });
});

describe('schema rejections', () => {
  const mutate = (change: (clone: SiteProse) => void) => {
    const clone = structuredClone(parsed);
    change(clone);
    return { clone, result: siteProseSchema.safeParse(clone) };
  };
  const failWith = (result: ReturnType<typeof siteProseSchema.safeParse>, path: string) => {
    assert.equal(result.success, false);
    if (result.success) return;
    const paths = result.error.issues.map((issue) => issue.path.join('.'));
    assert.ok(paths.includes(path), `expected an issue at "${path}", got ${JSON.stringify(paths)}`);
  };

  it('rejects a misspelt key', () => {
    const { result } = mutate((clone) => {
      (clone.home as unknown as Record<string, unknown>).abuot = { xs: 'About' };
    });
    failWith(result, 'home');
    if (!result.success) {
      const issue = result.error.issues.find((i) => i.code === 'unrecognized_keys');
      assert.deepStrictEqual(issue?.keys, ['abuot']);
    }
  });

  it('rejects an unknown theme id', () => {
    const { result } = mutate((clone) => {
      (clone.themes as Record<string, unknown>).brutalism = { label: { xs: 'Brutalism' } };
    });
    failWith(result, 'themes');
    if (!result.success) {
      const issue = result.error.issues.find((i) => i.code === 'unrecognized_keys');
      assert.deepStrictEqual(issue?.keys, ['brutalism']);
    }
  });

  it('rejects a missing theme', () => {
    const { result } = mutate((clone) => {
      delete (clone.themes as Record<string, unknown>).doodle;
    });
    failWith(result, 'themes.doodle');
  });

  it('rejects a drafted theme label', () => {
    const { result } = mutate((clone) => {
      (clone.themes as Record<string, unknown>).grid = { label: { xs: { draft: 'Grid' } } };
    });
    failWith(result, 'themes.grid.label');
  });

  it('rejects a template without {n}', () => {
    const { result } = mutate((clone) => {
      clone.post.readTime = { xs: 'min read' };
    });
    failWith(result, 'post.readTime');
  });

  it('rejects a social with both href and calendly', () => {
    const { result } = mutate((clone) => {
      clone.socials[5].href = 'https://calendly.com/dawsonamf/30min';
    });
    failWith(result, 'socials.5');
  });

  it('rejects a relative href', () => {
    const { result } = mutate((clone) => {
      clone.projects[2].ctas[0].href = '../blog/post.html?id=fly-on-my-laptop';
    });
    failWith(result, 'projects.2.ctas.0.href');
  });

  it('rejects the backslash form of a protocol-relative href', () => {
    // WHATWG URL parsing reads `/\evil.com` as `https://evil.com/`, so it is off-site too.
    const { result } = mutate((clone) => {
      clone.projects[2].ctas[0].href = '/\\evil.com';
    });
    failWith(result, 'projects.2.ctas.0.href');
  });

  it('rejects a posts mirror at the top level', () => {
    const { result } = mutate((clone) => {
      (clone as unknown as Record<string, unknown>).posts = [];
    });
    failWith(result, '');
  });

  it('accepts a second size on a label but the one-size walk rejects it', () => {
    const { clone, result } = mutate((c) => {
      (c.nav.about as Record<string, unknown>).s = 'About me';
    });
    assert.equal(result.success, true, 'the field type allows a second size; only the migration rule forbids it');
    const issues = oneSizeIssues(clone);
    assert.equal(issues.length, 1);
    assert.match(issues[0], /^nav\.about: 2 written sizes/);
  });
});

// ---- Type-level checks (enforced by `tsc --noEmit`, not at runtime) ----------
// Never invoked: tsc checks the body, the runtime never reaches the two deliberate errors.
// `parsed` is already SiteProse, so these calls exercise the real ProsePath union.
function typeChecks(): void {
  prose.text('themes.marquee.ticker', 'xs');
  prose.text('nav.about', 'xs');
  prose.list('jobs.0.bullets', 'l');
  prose.paragraphs('projects.2.description', 'l');
  prose.get('privacy.body', 'l');
  prose.has('meta.post.description', 'm');

  // @ts-expect-error there is no nav.abuot; a typo is a bug, not a gap
  prose.text('nav.abuot', 'xs');
  // @ts-expect-error site.email is data, reachable through `data`, never through a prose method
  prose.get('site.email', 'xs');
}
void typeChecks;
