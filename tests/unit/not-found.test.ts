// S1-12: the 404's theme resolution (D27), path segment first and `?style=` second. Pure, so
// it is checked here rather than through a browser: tests/browser/theme-routing.spec.ts proves
// the same rule end to end against a served 404.
//
// Run: node --test tests/unit/not-found.test.ts

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { resolveNotFoundTheme } from '../../src/themes/not-found.ts';
import { THEME_IDS } from '../../src/themes/registry.ts';

const resolve = (pathname: string, search = '') => resolveNotFoundTheme(pathname, search, THEME_IDS);

describe('resolveNotFoundTheme()', () => {
  it('takes a valid first path segment', () => {
    assert.equal(resolve('/brutalist/nope/'), 'brutalist');
  });

  it('falls back to ?style= when the path names nothing', () => {
    assert.equal(resolve('/nope/', '?style=grid'), 'grid');
  });

  it('prefers the path over the query', () => {
    assert.equal(resolve('/brutalist/x/', '?style=grid'), 'brutalist');
  });

  it('reads the FIRST path segment only, so a theme id deeper in the path is not one', () => {
    assert.equal(resolve('/blog/brutalist/'), undefined);
    assert.equal(resolve('/blog/brutalist/', '?style=grid'), 'grid');
  });

  it('ignores an unknown id in either position', () => {
    assert.equal(resolve('/nope/', '?style=nope'), undefined);
    assert.equal(resolve('/nope/'), undefined);
  });

  it('resolves nothing at the root', () => {
    assert.equal(resolve('/', ''), undefined);
  });

  it('returns "default" for the default segment; the caller ignores it', () => {
    assert.equal(resolve('/default/x'), 'default');
  });

  it('treats an empty ?style= as absent', () => {
    assert.equal(resolve('/nope/', '?style='), undefined);
  });
});
