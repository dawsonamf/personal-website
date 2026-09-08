// S1-10: href() is the only way a component writes an internal link (D31, §6.1), and
// paths.ts stays a content-free leaf: it knows the registry ids and the static-asset
// prefixes, never the post ids or any page catalog.
//
// Run: node --test tests/unit/theme-paths.test.ts

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { STATIC_PREFIXES, href, themeParams } from '../../src/themes/paths.ts';
import { THEME_IDS } from '../../src/themes/registry.ts';

describe('href() : the ticket contract', () => {
  it('matches the acceptance asserts verbatim', () => {
    assert.equal(href('/blog/toolbelt/', 'doodle'), '/doodle/blog/toolbelt/');
    assert.equal(href('#contact', 'doodle'), '#contact');
    assert.equal(href('/resources/contact.vcf', 'doodle'), '/resources/contact.vcf');
    assert.throws(() => href('../blog/', 'doodle'));
    assert.deepEqual(themeParams()[0], { theme: undefined });
  });
});

describe('href() rule 1 : schemes and protocol-relative URLs', () => {
  for (const url of ['https://x.y/', 'mailto:a@b.c', 'HTTPS://X.Y/', '//cdn.example/x.js']) {
    it(`${url} is unchanged`, () => assert.equal(href(url, 'doodle'), url));
  }
});

describe('href() rule 2 : fragments stay bare', () => {
  for (const frag of ['#', '#about', '#calendly']) {
    it(`${frag} is unchanged`, () => assert.equal(href(frag, 'doodle'), frag));
  }
});

describe('href() rule 3 : relative paths throw', () => {
  for (const bad of ['../blog/', 'blog/', 'index.html', '', './x', '?style=x']) {
    it(`rejects ${JSON.stringify(bad)}`, () => {
      assert.throws(() => href(bad, 'doodle'), /root-absolute/);
      assert.throws(() => href(bad), /root-absolute/); // rule 3 runs before rule 4
    });
  }
});

describe('href() rule 4 : the default theme themes nothing', () => {
  it('leaves paths alone for undefined and "default"', () => {
    assert.equal(href('/blog/'), '/blog/');
    assert.equal(href('/blog/', 'default'), '/blog/');
    assert.equal(href('/', 'default'), '/');
  });

  it('treats an empty theme as unset, never as a protocol-relative URL', () => {
    assert.equal(href('/blog/', ''), '/blog/');
  });
});

describe('href() rule 5 : static prefixes', () => {
  const staticPaths = [
    ...STATIC_PREFIXES,
    '/resources/contact.vcf',
    '/vendor/jquery/jquery.min.js',
    '/subsites/elise/12years/',
    '/blog/posts/assets/x.js',
    '/css/styles.css',
    '/js/x.js',
    '/blog/post.html?id=toolbelt',
  ];
  for (const path of staticPaths) {
    it(`${path} is unchanged under a theme`, () => assert.equal(href(path, 'doodle'), path));
  }

  it('is exactly the §6.1 list, in order', () => {
    assert.deepEqual(STATIC_PREFIXES, [
      '/resources/',
      '/vendor/',
      '/subsites/',
      '/blog/posts/',
      '/css/',
      '/js/',
      '/blog/post.html',
      '/sitemap-index.xml',
      '/sitemap-0.xml',
      '/robots.txt',
    ]);
    assert.equal(STATIC_PREFIXES.length, 10);
  });
});

describe('href() : everything else is themed', () => {
  const cases: Array<[string, string]> = [
    ['/', '/doodle/'],
    ['/blog/', '/doodle/blog/'],
    ['/blog/toolbelt/?a=1#h', '/doodle/blog/toolbelt/?a=1#h'],
    ['/privacy/', '/doodle/privacy/'],
  ];
  for (const [path, themed] of cases) {
    it(`${path} → ${themed}`, () => assert.equal(href(path, 'doodle'), themed));
  }
});

describe('themeParams()', () => {
  const params = themeParams();

  it('is the root plus one entry per non-default id, in registry order', () => {
    assert.equal(params.length, 16);
    assert.deepEqual(params[0], { theme: undefined });
    assert.deepEqual(params.slice(1), THEME_IDS.slice(1).map((theme) => ({ theme })));
    assert.equal(params.filter((p) => p.theme === 'default').length, 0);
    assert.deepEqual(params.map((p) => p.theme ?? 'default'), THEME_IDS);
  });
});
