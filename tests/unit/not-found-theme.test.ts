// S1-21: the runtime 404 resolver. Path wins, then query, and unknown values are ignored.

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { resolveNotFoundTheme } from '../../src/themes/not-found.ts';
import { THEME_IDS } from '../../src/themes/registry.ts';

const resolve = (pathname: string, search = '') =>
  resolveNotFoundTheme(pathname, search, THEME_IDS);

describe('resolveNotFoundTheme', () => {
  it('uses a valid first path segment, including a bare theme route', () => {
    assert.equal(resolve('/brutalist/nope/'), 'brutalist');
    assert.equal(resolve('/brutalist/'), 'brutalist');
  });

  it('falls back from an unknown path segment to a valid query', () => {
    assert.equal(resolve('/nope/', '?style=doodle'), 'doodle');
  });

  it('gives a valid path precedence over a conflicting valid query', () => {
    assert.equal(resolve('/brutalist/nope/', '?style=doodle'), 'brutalist');
  });

  it('ignores unknown and empty candidates', () => {
    assert.equal(resolve('/nope/', '?style=unknown'), undefined);
    assert.equal(resolve('/', '?style='), undefined);
  });
});
