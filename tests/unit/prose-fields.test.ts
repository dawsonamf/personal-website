// S1-04: the reusable prose field schemas (§4.1 rules 1 and 2).
//
// This file imports src/prose/fields.ts under plain Node with no Astro runtime, which
// is the point: the post reader loads the same module the same way.
//
// Run: node --test tests/unit/prose-fields.test.ts

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  SIZES,
  draftText,
  labelList,
  sizedList,
  sizedTemplate,
  sizedText,
} from '../../src/prose/fields.ts';
import type { SizedText } from '../../src/prose/fields.ts';

type Issue = { path: PropertyKey[]; message: string };
type Schema = {
  safeParse: (value: unknown) => { success: true } | { success: false; error: { issues: Issue[] } };
};

const ok = (schema: Schema, value: unknown) => {
  const result = schema.safeParse(value);
  assert.equal(result.success, true, `expected ${JSON.stringify(value)} to parse`);
};

const bad = (schema: Schema, value: unknown): Issue[] => {
  const result = schema.safeParse(value);
  assert.equal(result.success, false, `expected ${JSON.stringify(value)} to be rejected`);
  return result.success ? [] : result.error.issues;
};

describe('sizedText', () => {
  it('accepts a written value at every size', () => {
    assert.deepStrictEqual([...SIZES], ['xs', 's', 'm', 'l']);
    ok(sizedText, { xs: 'About' });
    ok(sizedText, { s: 'A blog post by Dawson Metzger-Fleetwood.' });
    ok(sizedText, { m: 'A paragraph of description.' });
    ok(sizedText, { l: 'A whole body.' });
    ok(sizedText, { xs: 'About', s: 'About me', m: 'More', l: 'Everything' });
  });

  it('accepts explicit null and draft objects', () => {
    ok(sizedText, { xs: null });
    ok(sizedText, { xs: null, l: 'written' });
    ok(sizedText, { xs: { draft: 'About' } });
    ok(sizedText, { l: { draft: 'A body still awaiting approval.' } });
    ok(draftText, { draft: 'anything at all' });
  });

  it('rejects an empty map, naming the four sizes', () => {
    const [issue] = bad(sizedText, {});
    assert.ok(issue);
    assert.match(issue.message, /xs, s, m or l/);
  });

  it('rejects a misspelled size key', () => {
    const issues = bad(sizedText, { xz: 'x' });
    assert.ok(issues.some((i) => i.message.includes('xz')));
  });

  it('rejects a draft key at the map level', () => {
    const issues = bad(sizedText, { xs: 'a', draft: 'b' });
    assert.ok(issues.some((i) => i.message.includes('draft')));
  });

  it('rejects an extra key inside a draft object', () => {
    const issues = bad(sizedText, { xs: { draft: 'a', extra: 1 } });
    assert.deepStrictEqual(issues[0]?.path, ['xs']);
  });

  it('rejects non-string values', () => {
    bad(sizedText, { xs: 1 });
    bad(sizedText, { s: true });
    bad(sizedText, { l: ['a'] });
    bad(sizedText, { xs: { draft: 1 } });
    bad(sizedText, 'a string');
  });
});

describe('xs Markdown restriction', () => {
  const markdown = ['a [link](x)', 'an *emphasis*', 'a `code` span'];

  it('rejects Markdown punctuation at xs, plain and drafted', () => {
    for (const value of markdown) {
      const issues = bad(sizedText, { xs: value });
      assert.deepStrictEqual(issues[0]?.path, ['xs'], value);
      bad(sizedText, { xs: { draft: value } });
      bad(sizedList, { xs: [value] });
      bad(labelList, [value]);
    }
  });

  it('leaves s, m and l unrestricted', () => {
    for (const value of markdown) {
      ok(sizedText, { s: value });
      ok(sizedText, { m: value });
      ok(sizedText, { l: value });
      ok(sizedText, { l: { draft: value } });
      ok(sizedList, { l: [value] });
    }
  });

  it('accepts the punctuation real xs prose uses', () => {
    for (const value of ['X (Twitter)', 'currently here ✓', '{n} min read', 'scheme & colors']) {
      ok(sizedText, { xs: value });
      ok(sizedText, { xs: { draft: value } });
      ok(labelList, [value]);
    }
  });
});

describe('sizedList', () => {
  it('accepts lists, drafted lists and null', () => {
    ok(sizedList, { l: ['a', 'b'] });
    ok(sizedList, { l: { draft: ['a'] } });
    ok(sizedList, { l: null });
    ok(sizedList, { xs: ['Metal', 'Swift'] });
    ok(sizedList, { l: [] });
  });

  it('rejects a bare string, mixed items and an empty map', () => {
    assert.deepStrictEqual(bad(sizedList, { l: 'a' })[0]?.path, ['l']);
    bad(sizedList, { l: ['a', 1] });
    bad(sizedList, { l: ['a', { draft: 'b' }] });
    bad(sizedList, {});
  });
});

describe('labelList', () => {
  it('accepts approved and drafted chips, an empty list and null', () => {
    ok(labelList, ['Metal', { draft: 'Swift' }]);
    ok(labelList, []);
    ok(labelList, null);
  });

  it('rejects non-strings, extra draft keys and Markdown', () => {
    bad(labelList, [1]);
    bad(labelList, [{ draft: 'a', x: 1 }]);
    assert.deepStrictEqual(bad(labelList, ['[md]'])[0]?.path, [0]);
  });
});

describe('sizedTemplate', () => {
  it('accepts written sizes that carry {n}', () => {
    ok(sizedTemplate, { xs: '{n} min read' });
    ok(sizedTemplate, { xs: { draft: 'Go to slide {n}' } });
    ok(sizedTemplate, { xs: '{n} min', s: 'about {n} minutes to read' });
    ok(sizedTemplate, { xs: null, s: '{n} minutes' });
  });

  it('rejects any written size without {n}', () => {
    const [issue] = bad(sizedTemplate, { xs: 'min read' });
    assert.ok(issue);
    assert.match(issue.message, /\{n\}/);
    bad(sizedTemplate, { xs: { draft: 'nope' } });
    bad(sizedTemplate, { xs: '{n} min read', s: 'no placeholder here' });
  });
});

// ---- Type-level check (enforced by `tsc --noEmit`, not at runtime) -----------
({
  // @ts-expect-error 'xz' is not one of the four sizes
  xz: 'x',
}) satisfies SizedText;
