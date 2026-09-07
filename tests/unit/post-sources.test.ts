// S1-07: post ownership and the publication-filtered projections (§7.1, D8/D10/D19).
//
// The migrated src/content/posts/*.md are checked against the two legacy sources they came
// from: each post's own frontmatter/body (blog/posts/*.md, split with blog/blog-post.js:33's
// regex) and the live listing (js/blog-data.js, evaluated in node:vm with a `window`). Drift on
// either side fails here instead of silently changing the published listing. The legacy tree is
// PARITY_OLD_DIR ?? repoRoot; if it is missing these tests fail, they never skip.
//
// Run: node --test tests/unit/post-sources.test.ts

import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { describe, it } from 'node:test';
import { runInNewContext } from 'node:vm';

import * as posts from '../../src/build/posts.ts';

const {
  POSTS_DIR,
  legacyPostDestinations,
  listingPosts,
  postDates,
  postDraftIssues,
  publishedPostIds,
  readPostSources,
} = posts;

const repoRoot = resolve(import.meta.dirname, '..', '..');
// PARITY_OLD_DIR wins, matching tests/unit/markdown.test.ts:24.
const oldRoot = process.env.PARITY_OLD_DIR ?? repoRoot;
const legacyPostsDir = join(oldRoot, 'blog', 'posts');
const legacyDataFile = join(oldRoot, 'js', 'blog-data.js');
const publicDir = join(repoRoot, 'public');
const fixture = (name: string) => join(repoRoot, 'tests', 'fixtures', 'post-sources', name);

for (const legacy of [legacyPostsDir, legacyDataFile]) {
  assert.ok(
    existsSync(legacy),
    `${legacy} is missing; set PARITY_OLD_DIR to the baseline checkout instead of skipping this check`,
  );
}

// ---- The pinned migration facts --------------------------------------------

const LISTING_ORDER = [
  'fly-on-my-laptop', 'underviewed-art', 'arena-freshness', 'helm', 'toolbelt',
  'embedded-swift-agent', 'metr-doubling', 'autoencoders-2', 'autoencoders-1', 'college-projects',
];
const EXTERNAL_URLS: Record<string, string> = {
  'autoencoders-1': 'https://www.aboutobjects.com/2024/01/05/autoencoders-part-1/',
  'autoencoders-2': 'https://www.aboutobjects.com/2024/04/01/autoencoders-part-2/',
};
const EXTERNAL_IDS = Object.keys(EXTERNAL_URLS).sort();
const DRAFT_IDS = ['gemma4-heretic-ara'];
const PUBLISHED_IDS = LISTING_ORDER.filter((id) => !EXTERNAL_IDS.includes(id));
const EXPECTED_DATES: Record<string, string> = {
  'fly-on-my-laptop': '2026-08-01',
  'underviewed-art': '2026-07-01',
  'arena-freshness': '2026-05-01',
  helm: '2026-03-01',
  toolbelt: '2026-03-01',
  'embedded-swift-agent': '2026-02-01',
  'metr-doubling': '2026-02-01',
  'college-projects': '2022-05-01',
};

// ---- Legacy readers ---------------------------------------------------------

/** blog/blog-post.js:32-48: the hand-rolled splitter the migration had to preserve. */
function legacyParse(raw: string): { meta: Record<string, string | string[]>; body: string } {
  const match = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  assert.ok(match, 'legacy post has no frontmatter block');
  const meta: Record<string, string | string[]> = {};
  for (const line of match[1].split('\n')) {
    const idx = line.indexOf(':');
    if (idx === -1) continue;
    const value = line.slice(idx + 1).trim();
    meta[line.slice(0, idx).trim()] =
      value.startsWith('[') && value.endsWith(']')
        ? value.slice(1, -1).split(',').map((s) => s.trim().replace(/^["']|["']$/g, ''))
        : value;
  }
  return { meta, body: match[2] };
}

const legacyFiles = readdirSync(legacyPostsDir).filter((f) => f.endsWith('.md')).sort();
const legacy = new Map(
  legacyFiles.map((file) => [file.slice(0, -3), legacyParse(readFileSync(join(legacyPostsDir, file), 'utf8'))]),
);

type ListingEntry = { id: string; excerpt: string; tags: string[]; url: string };
const window: { BLOG_POSTS?: ListingEntry[] } = {};
runInNewContext(readFileSync(legacyDataFile, 'utf8'), { window }, { filename: legacyDataFile });
// Copied into this realm: a vm array has a foreign prototype and never deep-strict-equals one here.
const BLOG_POSTS = Array.from(window.BLOG_POSTS!, (entry) => ({
  id: entry.id,
  excerpt: entry.excerpt,
  tags: Array.from(entry.tags),
  url: entry.url,
}));

/** The body rules: relative resources, the two archived autoencoder links, the moved subsite. */
function rewriteBody(body: string): string {
  let out = body.replaceAll('../../resources/', '/resources/');
  for (const [id, url] of Object.entries(EXTERNAL_URLS)) out = out.replaceAll(`post.html?id=${id}`, url);
  out = out.replaceAll('](/embedded-swift-agent/)', '](/subsites/dawson/embedded-swift-agent/)');
  for (const id of PUBLISHED_IDS) {
    out = out.replaceAll(`post.html?id=${id}`, `/blog/${id}/`);
    out = out.replaceAll(`](${id}.md)`, `](/blog/${id}/)`);
  }
  return out;
}

const sources = readPostSources();
const byId = new Map(sources.map((post) => [post.id, post]));
// One loose read-through view, so an assertion can name a field the discriminated union
// only carries on some members (listingOrder, externalUrl) without a cast per line.
type LooseMeta = {
  publication: string;
  listingOrder?: number;
  title?: { s?: unknown };
  date?: string;
  description?: { l?: unknown };
  tags?: unknown;
  scripts: string[];
  styles: string[];
  externalUrl?: string;
};
const meta = (id: string) => byId.get(id)!.meta as unknown as LooseMeta;

// ---- Tests ------------------------------------------------------------------

describe('readPostSources', () => {
  it('reads every migrated source, sorted, with matching ids', () => {
    assert.equal(POSTS_DIR, join(repoRoot, 'src', 'content', 'posts'));
    assert.equal(sources.length, 11);
    assert.deepEqual(sources.map((post) => post.source), legacyFiles);
    for (const post of sources) assert.equal(post.source, `${post.id}.md`);
  });

  it('exports exactly the projection surface', () => {
    assert.deepEqual(Object.keys(posts).sort(), [
      'POSTS_DIR', 'legacyPostDestinations', 'listingPosts', 'postDates',
      'postDraftIssues', 'publishedPostIds', 'readPostSources',
    ]);
  });
});

describe('publication partition', () => {
  const partition = (publication: string) =>
    sources.filter((post) => post.meta.publication === publication).map((post) => post.id).sort();

  it('is eight published, two external and one draft', () => {
    assert.deepEqual(partition('published'), [...PUBLISHED_IDS].sort());
    assert.deepEqual(partition('external'), EXTERNAL_IDS);
    assert.deepEqual(partition('draft'), DRAFT_IDS);
  });

  it('keeps the pinned listing order', () => {
    assert.deepEqual(listingPosts().map((post) => post.id), LISTING_ORDER);
    assert.deepEqual(publishedPostIds(), PUBLISHED_IDS);
  });

  it('excludes the draft from every public projection', () => {
    for (const id of DRAFT_IDS) {
      assert.ok(byId.has(id), 'the draft is retained as a source');
      assert.ok(!listingPosts().some((post) => post.id === id));
      assert.ok(!publishedPostIds().includes(id));
      assert.ok(!(id in postDates()));
      assert.ok(!(id in legacyPostDestinations()));
      assert.ok(!postDraftIssues().some((issue) => issue.source === `${id}.md`));
    }
  });
});

describe('metadata parity', () => {
  it('takes every title and date from the post file', () => {
    for (const [id, post] of legacy) {
      assert.equal(meta(id).title?.s, post.meta.title, `${id} title`);
      assert.equal(meta(id).date, post.meta.date, `${id} date`);
    }
    assert.equal(meta('helm').title?.s, 'Helm: A Workspace Switcher for VS Code and Cursor');
    assert.equal(meta('helm').date, 'March 2026');
    assert.equal(meta('metr-doubling').date, 'February 2026');
  });

  it('takes every description, tag and external URL from the live listing', () => {
    assert.deepEqual(BLOG_POSTS.map((entry) => entry.id), LISTING_ORDER);
    BLOG_POSTS.forEach((entry, index) => {
      assert.equal(meta(entry.id).description?.l, entry.excerpt, `${entry.id} description`);
      assert.deepEqual(meta(entry.id).tags, entry.tags, `${entry.id} tags`);
      assert.equal(meta(entry.id).listingOrder, index, `${entry.id} listingOrder`);
    });
    for (const id of EXTERNAL_IDS) {
      assert.equal(meta(id).externalUrl, EXTERNAL_URLS[id]);
      assert.equal(meta(id).externalUrl, BLOG_POSTS.find((entry) => entry.id === id)!.url);
    }
  });

  it('round-trips the literal ampersand in AI & ML', () => {
    assert.deepEqual(meta('metr-doubling').tags, ['AI & ML']);
    assert.deepEqual(meta('college-projects').tags, ['AI & ML', 'Systems']);
  });

  it('keeps the draft plain and slotless', () => {
    assert.equal(meta('gemma4-heretic-ara').publication, 'draft');
    assert.equal(meta('gemma4-heretic-ara').listingOrder, undefined);
    assert.equal(meta('gemma4-heretic-ara').externalUrl, undefined);
  });

  it('makes every per-post asset root-absolute or a pinned https URL', () => {
    for (const post of sources) {
      for (const asset of [...meta(post.id).scripts, ...meta(post.id).styles]) {
        assert.ok(
          /^\/blog\/posts\/assets\/[^/]+$/.test(asset) || asset.startsWith('https://'),
          `${post.id}: ${asset}`,
        );
      }
    }
    assert.deepEqual(meta('metr-doubling').styles, ['/blog/posts/assets/metr-chart.css']);
  });
});

describe('body parity', () => {
  it('is the legacy body under exactly the migration rewrites', () => {
    for (const [id, post] of legacy) {
      assert.equal(byId.get(id)!.body, rewriteBody(post.body), `${id} body`);
    }
  });

  it('applies the counted resource rewrite everywhere', () => {
    const count = [...legacy.values()]
      .reduce((n, post) => n + (post.body.match(/\.\.\/\.\.\/resources\//g)?.length ?? 0), 0);
    assert.equal(count, 25, 'the legacy corpus has 25 ../../resources/ references');
  });

  it('leaves no relative, post.html or bare .md link behind', () => {
    for (const post of sources) {
      assert.ok(!post.body.includes('../'), `${post.id} still has a relative path`);
      assert.ok(!post.body.includes('post.html'), `${post.id} still links the legacy shim`);
      assert.ok(!/\]\([^)]*\.md\)/.test(post.body), `${post.id} still links a .md source`);
    }
  });

  it('resolves every migrated local reference under public/', () => {
    for (const post of sources) {
      // The lookbehind keeps a path inside an external URL (metr.org/blog/…) out of these scans.
      const refs = [
        ...post.body.match(/(?<=[\s"'(])\/(?:resources|blog\/posts\/assets|subsites)\/[^\s"')\]]+/g) ?? [],
        ...meta(post.id).scripts,
        ...meta(post.id).styles,
      ].filter((ref) => ref.startsWith('/'));
      for (const ref of refs) {
        assert.ok(existsSync(join(publicDir, ref)), `${post.id}: ${ref} is not in public/`);
      }
      // The lookahead keeps /blog/posts/assets/ out: it is an asset path, not a post id.
      for (const [, id] of post.body.matchAll(/(?<=[\s"'(])\/blog\/(?!posts\/)([^/\s"')\]]+)\//g)) {
        assert.ok(PUBLISHED_IDS.includes(id), `${post.id}: /blog/${id}/ is not a published post`);
      }
    }
  });
});

describe('public projections', () => {
  it('dates only the published posts, at day one of the month', () => {
    assert.deepEqual(postDates(), EXPECTED_DATES);
  });

  it('destines published ids locally and external ids to their article', () => {
    assert.deepEqual(legacyPostDestinations(), {
      ...Object.fromEntries(PUBLISHED_IDS.map((id) => [id, `/blog/${id}/`])),
      ...EXTERNAL_URLS,
    });
    assert.equal(Object.keys(legacyPostDestinations()).length, 10);
  });
});

describe('draft fields', () => {
  it('reports none in the migrated corpus', () => {
    assert.deepEqual(postDraftIssues(), []);
  });

  it('reports a drafted field in a published record without failing the load', () => {
    const drafted = readPostSources(fixture('drafted-field'));
    assert.equal(drafted.length, 1);
    assert.deepEqual(postDraftIssues(drafted), [
      { source: 'drafted.md', path: 'title.s' },
      { source: 'drafted.md', path: 'tags.0' },
    ]);
  });

  it('retains a whole draft and keeps it out of every projection', () => {
    const only = readPostSources(fixture('draft-only'));
    assert.equal(only.length, 1);
    assert.equal(only[0].meta.publication, 'draft');
    assert.equal(only[0].body, 'Just an idea.\n');
    assert.deepEqual(listingPosts(only), []);
    assert.deepEqual(publishedPostIds(only), []);
    assert.deepEqual(postDates(only), {});
    assert.deepEqual(legacyPostDestinations(only), {});
    assert.deepEqual(postDraftIssues(only), []);
  });
});

describe('source-qualified failures', () => {
  const cases: [string, RegExp][] = [
    ['yaml-syntax', /^Error: posts: broken\.md: /],
    ['no-frontmatter', /^Error: posts: bare\.md: no --- frontmatter block$/],
    ['unknown-key', /^Error: posts: extra\.md: \(root\): Unrecognized key: "summary"$/],
    ['external-no-url', /^Error: posts: ext\.md: externalUrl: /],
    ['relative-script', /^Error: posts: rel\.md: scripts\.0: an asset is /],
    ['bad-date', /^Error: posts: date\.md: date: date is "Month YYYY"$/],
    ['draft-with-slot', /^Error: posts: slot\.md: \(root\): Unrecognized key: "listingOrder"$/],
    ['order-gap', /^Error: posts: listingOrder must be exactly 0\.\.1: first\.md=0, second\.md=2$/],
    ['order-duplicate', /^Error: posts: listingOrder must be exactly 0\.\.1: first\.md=0, second\.md=0$/],
  ];

  for (const [name, message] of cases) {
    it(`names the source in the ${name} failure`, () => {
      assert.throws(() => readPostSources(fixture(name)), message);
    });
  }

  it('rejects a directory entry that is not a .md source', () => {
    assert.throws(
      () => readPostSources(join(repoRoot, 'tests', 'fixtures', 'post-sources')),
      /^Error: posts: [^:]+: not a \.md source$/,
    );
  });
});
