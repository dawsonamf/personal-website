// S1-05: the shared prose accessor (§4.2, D9, D10, D15, D37).
//
// Everything here runs under plain Node with no Astro runtime, which is the point:
// S1-08 externalizes src/prose/index.ts so the build's checks integration loads it the
// same way. The module-scope accumulators (unwrittenSizes, touches) are shared across
// every instance in the process, so tests that assert on them clear first.
//
// Run: node --test tests/unit/prose-access.test.ts

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { findDrafts, isDraft } from '../../src/prose/drafts.ts';
import {
  DRAFT_CLASS,
  DRAFT_TEXT_PREFIX,
  createProseAccess,
  touches,
  unwrittenSizes,
} from '../../src/prose/index.ts';
import type { LabelList, Size, SizedList, SizedText } from '../../src/prose/fields.ts';

// assert.throws matches a RegExp against `String(error)`, so the `prose:` prefix is checked here.
const isProseError = (error: unknown) => error instanceof Error && error.message.startsWith('prose:');

// Shaped like the real tree: sized text/lists, label lists, arrays of records and plain
// data that must stay readable through `data`.
const tree = {
  title: { xs: 'Dawson', s: 'Dawson Metzger-Fleetwood' } as SizedText,
  amp: { xs: 'AI & ML' } as SizedText,
  angles: { xs: `< > " '` } as SizedText,
  entity: { xs: '&amp;lt;' } as SizedText,
  body: { s: '**bold**', l: 'First **para**.\n\nSecond para.', m: 'Only *m*.' } as SizedText,
  omitted: { xs: null, s: 'written' } as SizedText,
  drafted: { xs: { draft: 'Chip' }, l: { draft: 'A **body**.' } } as SizedText,
  draftedList: { l: { draft: ['alpha', 'beta'] } } as SizedList,
  tech: ['Metal', { draft: 'X' }] as LabelList,
  noTech: null as LabelList,
  emptyTech: [] as LabelList,
  image: '/resources/Fly_Media.jpg',
  scripts: ['a.js', 'b.js'],
  jobs: [{ bullets: { l: ['one', 'two'], m: null } as SizedList }],
};

const p = createProseAccess(tree, 'fixture');

describe('the ticket snippet', () => {
  it('records exactly one absent size and throws on a typo', () => {
    unwrittenSizes.clear();
    const snippet = createProseAccess({ title: { s: 'Hello', xs: null } }, 'fixture');
    assert.equal(snippet.text('title', 'xs'), '');
    assert.equal(snippet.has('title', 'm'), false);
    assert.equal(unwrittenSizes.size, 1);
    // @ts-expect-error Deliberately exercise runtime rejection of an unknown path.
    assert.throws(() => snippet.text('titel', 's'));
  });
});

describe('accessor states', () => {
  it('renders a written value', () => {
    assert.equal(p.get('title', 'xs'), 'Dawson');
    assert.equal(p.text('title', 's'), 'Dawson Metzger-Fleetwood');
    assert.deepStrictEqual(p.list('jobs.0.bullets', 'l'), ['one', 'two']);
    assert.deepStrictEqual(p.textList('jobs.0.bullets', 'l'), ['one', 'two']);
    assert.equal(p.has('title', 'xs'), true);
  });

  it('omits a null size without recording anything', () => {
    unwrittenSizes.clear();
    assert.equal(p.get('omitted', 'xs'), '');
    assert.equal(p.text('omitted', 'xs'), '');
    assert.deepStrictEqual(p.paragraphs('omitted', 'xs'), []);
    assert.deepStrictEqual(p.list('jobs.0.bullets', 'm'), []);
    assert.deepStrictEqual(p.textList('jobs.0.bullets', 'm'), []);
    assert.equal(p.has('omitted', 'xs'), false);
    assert.equal(unwrittenSizes.size, 0);
  });

  it('records an absent size from every accessor, has() included', () => {
    unwrittenSizes.clear();
    assert.equal(p.get('title', 'm'), '');
    assert.equal(p.text('title', 'l'), '');
    assert.deepStrictEqual(p.paragraphs('title', 'm'), []);
    assert.deepStrictEqual(p.list('jobs.0.bullets', 'xs'), []);
    assert.deepStrictEqual(p.textList('jobs.0.bullets', 's'), []);
    assert.equal(p.has('title', 'l'), false);
    assert.deepStrictEqual(
      [...unwrittenSizes].sort(),
      [
        'fixture:jobs.0.bullets:s',
        'fixture:jobs.0.bullets:xs',
        'fixture:title:l',
        'fixture:title:m',
      ],
    );
  });

  it('throws on an unknown path and on a non-prose terminal', () => {
    for (const call of [
      // @ts-expect-error unknown key
      () => p.get('titel', 'xs'),
      // a valid path shape whose index does not exist: the type cannot know the length
      () => p.list('jobs.9.bullets', 'l'),
      // @ts-expect-error a plain string is data, not a prose field
      () => p.text('image', 'xs'),
      // @ts-expect-error a record is not a prose field
      () => p.has('jobs.0', 'xs'),
    ]) {
      assert.throws(call, /prose:/);
    }
  });

  it('rejects an array of records: only labels make a list', () => {
    unwrittenSizes.clear();
    // `jobs` is data one level above prose, so reaching it at all needs a cast past ProsePath.
    const loose = p as unknown as {
      has: (path: string, size: Size) => boolean;
      list: (path: string, size: Size) => string[];
    };
    assert.throws(() => loose.has('jobs', 'xs'), isProseError);
    assert.throws(() => loose.list('jobs', 'xs'), isProseError);
    assert.equal(unwrittenSizes.size, 0);
    // a real label list is untouched
    assert.deepStrictEqual(loose.list('tech', 'xs'), ['Metal', `<mark class="${DRAFT_CLASS}">X</mark>`]);
  });

  it('never walks the prototype chain', () => {
    unwrittenSizes.clear();
    // @ts-expect-error `__proto__` is not a ProsePath; the runtime guard is what is under test.
    assert.throws(() => p.get('title.__proto__', 'xs'), isProseError);
    assert.equal(unwrittenSizes.size, 0);
  });

  it('records nothing for a written size', () => {
    unwrittenSizes.clear();
    assert.equal(p.has('title', 'xs'), true);
    assert.equal(p.has('title', 'm'), false);
    assert.deepStrictEqual([...unwrittenSizes], ['fixture:title:m']);
  });

  it('treats a null label list as omitted and an empty one as written', () => {
    unwrittenSizes.clear();
    assert.deepStrictEqual(p.list('noTech', 'xs'), []);
    assert.equal(p.has('noTech', 'xs'), false);
    assert.equal(unwrittenSizes.size, 0);
    assert.deepStrictEqual(p.list('emptyTech', 'xs'), []);
    assert.equal(p.has('emptyTech', 'xs'), true);
  });

  it('records a label list requested at anything but xs (chips are xs only)', () => {
    unwrittenSizes.clear();
    assert.deepStrictEqual(p.list('tech', 'm'), []);
    assert.equal(p.has('tech', 's'), false);
    assert.deepStrictEqual([...unwrittenSizes].sort(), ['fixture:tech:m', 'fixture:tech:s']);
  });
});

describe('the shared accumulators', () => {
  it('collects source-qualified entries from every instance and dedupes them', () => {
    unwrittenSizes.clear();
    const shared = createProseAccess(tree, 'prose');
    const post = createProseAccess(tree, 'posts/helm.md');
    shared.has('title', 'm');
    shared.get('title', 'm');
    post.text('title', 'm');
    assert.deepStrictEqual([...unwrittenSizes].sort(), ['posts/helm.md:title:m', 'prose:title:m']);
  });

  it('increments touches on every method, throwing calls included', () => {
    let last = touches;
    const bump = (label: string, call: () => unknown) => {
      try {
        call();
      } catch {
        // a throwing accessor still counted its touch at entry
      }
      assert.equal(touches, last + 1, label);
      last = touches;
    };
    bump('get', () => p.get('title', 'xs'));
    bump('text', () => p.text('title', 'xs'));
    bump('list', () => p.list('tech', 'xs'));
    bump('textList', () => p.textList('tech', 'xs'));
    bump('paragraphs', () => p.paragraphs('body', 'l'));
    bump('has', () => p.has('title', 'xs'));
    // @ts-expect-error the throwing call must still be counted
    bump('throwing get', () => p.get('titel', 'xs'));
  });
});

describe('draft marking (D9)', () => {
  it('wraps inline output in <mark> and block output in <div>', () => {
    assert.equal(p.get('drafted', 'xs'), `<mark class="${DRAFT_CLASS}">Chip</mark>`);
    assert.equal(
      p.get('drafted', 'l'),
      `<div class="${DRAFT_CLASS}"><p>A <strong>body</strong>.</p>\n</div>`,
    );
    assert.deepStrictEqual(p.paragraphs('drafted', 'l'), [
      `<mark class="${DRAFT_CLASS}">A <strong>body</strong>.</mark>`,
    ]);
  });

  it('marks every item of a drafted sized list', () => {
    assert.deepStrictEqual(p.list('draftedList', 'l'), [
      `<mark class="${DRAFT_CLASS}">alpha</mark>`,
      `<mark class="${DRAFT_CLASS}">beta</mark>`,
    ]);
  });

  it('marks only the drafted items of a label list', () => {
    assert.deepStrictEqual(p.list('tech', 'xs'), ['Metal', `<mark class="${DRAFT_CLASS}">X</mark>`]);
  });

  it('prefixes plain-text output instead of wrapping it', () => {
    assert.equal(p.text('drafted', 'xs'), `${DRAFT_TEXT_PREFIX}Chip`);
    assert.deepStrictEqual(p.textList('tech', 'xs'), ['Metal', `${DRAFT_TEXT_PREFIX}X`]);
    assert.deepStrictEqual(p.textList('draftedList', 'l'), [
      `${DRAFT_TEXT_PREFIX}alpha`,
      `${DRAFT_TEXT_PREFIX}beta`,
    ]);
  });
});

describe('escaping (rule 7)', () => {
  it('escapes once in HTML and hands back plain text elsewhere', () => {
    assert.equal(p.get('amp', 'xs'), 'AI &amp; ML');
    assert.equal(p.text('amp', 'xs'), 'AI & ML');
  });

  it('decodes every entity marked emits, exactly once', () => {
    assert.equal(p.text('angles', 'xs'), `< > " '`);
    // `&amp;lt;` is a literal `&lt;` in the prose: one decode pass, not two.
    assert.equal(p.text('entity', 'xs'), '&lt;');
  });
});

// An optional size map (themes.marquee.ticker, §4.1) is still a size map: hidden on `data`
// and a valid path. An entry that lacks the key is a path error, not an unwritten size.
describe('optional size maps', () => {
  type Tree = { themes: { marquee: { ticker?: SizedText }; default: { ticker?: SizedText } } };
  const themeTree: Tree = { themes: { marquee: { ticker: { xs: 'Now playing' } }, default: {} } };
  const themes = createProseAccess(themeTree, 'fixture');

  it('stays a prose path where written and a path error where the key is absent', () => {
    unwrittenSizes.clear();
    assert.equal(themes.has('themes.marquee.ticker', 'xs'), true);
    assert.equal(themes.get('themes.marquee.ticker', 'xs'), 'Now playing');
    assert.throws(() => themes.has('themes.default.ticker', 'xs'), /no such path/);
    assert.equal(unwrittenSizes.size, 0);
  });
});

describe('rendering', () => {
  it('renders xs and s inline, m and l as blocks', () => {
    assert.equal(p.get('body', 's'), '<strong>bold</strong>');
    assert.equal(p.get('body', 'm'), '<p>Only <em>m</em>.</p>\n');
    assert.equal(p.get('body', 'l'), '<p>First <strong>para</strong>.</p>\n<p>Second para.</p>\n');
  });

  it('returns one wrapper-free fragment per source paragraph (D15)', () => {
    assert.deepStrictEqual(p.paragraphs('body', 'l'), [
      'First <strong>para</strong>.',
      'Second para.',
    ]);
  });
});

describe('shape mismatches', () => {
  it('names the method to use instead', () => {
    // every path below is valid; only the shape is wrong, so this is a runtime check
    assert.throws(() => p.get('tech', 'xs'), /use list\(\)/);
    assert.throws(() => p.paragraphs('jobs.0.bullets', 'l'), /use list\(\)/);
    assert.throws(() => p.list('title', 'xs'), /use get\(\)/);
    assert.throws(() => p.textList('title', 'xs'), /use get\(\)/);
  });
});

describe('findDrafts (D10)', () => {
  it('reports every draft node once, in key order, with its dot path', () => {
    assert.deepStrictEqual(
      findDrafts(tree, 'prose').map((issue) => issue.path),
      ['drafted.xs', 'drafted.l', 'draftedList.l', 'tech.1'],
    );
    assert.deepStrictEqual(findDrafts(tree, 'prose')[0], { source: 'prose', path: 'drafted.xs' });
    assert.deepStrictEqual(findDrafts({ title: { xs: 'approved' } }, 'prose'), []);
  });

  it('recognises only a lone `draft` key', () => {
    assert.equal(isDraft({ draft: 'x' }), true);
    assert.equal(isDraft({ draft: 'x', extra: 1 }), false);
    assert.equal(isDraft(['draft']), false);
    assert.equal(isDraft(null), false);
    assert.equal(isDraft('draft'), false);
  });
});

describe('data', () => {
  it('is the same object and keeps non-prose values readable', () => {
    assert.equal(p.data === tree, true);
    assert.equal(p.data.image, '/resources/Fly_Media.jpg');
    assert.deepStrictEqual(p.data.scripts, ['a.js', 'b.js']);
  });
});

// ---- Type-level checks (enforced by `tsc --noEmit`, not at runtime) ----------
// The root-tsconfig twin of tests/fixtures/prose-types/size-map-access.ts, which the root
// tsconfig excludes: that fixture must fail to compile, so this line proves the same rule
// holds under the config the rest of the repo is checked with.
// @ts-expect-error size maps are `never` on data (D37)
p.data.title.xs;
