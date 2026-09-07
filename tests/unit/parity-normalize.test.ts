/**
 * Contract tests for the pure half of the parity harness: the §9 normaliser, the style
 * declaration parser and the old-side URL form. Pure: no browser, no server, no network and no
 * baseline checkout, so it needs no environment. The matrix shape is enforced at collection time
 * in `harness/parity.spec.ts` and the derivations are covered by the `@capture:` tests.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeHtml, parseDeclarations, type NormalizeOptions } from '../../harness/normalize.ts';
import { PAGE_TYPES } from '../../harness/urls.ts';
import { oldPath } from '../../harness/baseline.ts';

const OLD_OLD: NormalizeOptions = { mode: 'old-old', side: 'old' };
const norm = (html: string, opts: NormalizeOptions = OLD_OLD): string[] => normalizeHtml(html, opts).lines;

const doc = (body: string, htmlStyle = '--text:#fff; --bg:#000'): string =>
  `<html style="${htmlStyle}"><head><link rel="stylesheet" href="/css/a.css"><link rel="stylesheet" href="/css/b.css"><title>T</title></head><body>${body}</body></html>`;

test('(a) comments alone do not change the normalised form', () => {
  const plain = doc('<p class="lead">hi</p>');
  // The first comment holds markup and a `>`, so the `<!` fallback cannot swallow it whole.
  const commented = doc('<!-- <b>x</b> > y --><p class="lead">hi</p><!-- and another -->');
  assert.deepEqual(norm(commented), norm(plain));
  assert.ok(norm(plain).includes('    <p class="lead">'));
});

test('(b) the T0 delta vanishes: dropped whitespace after </script>, no trailing newline, attribute order', () => {
  const authored =
    '<html lang="en" data-x="1">\n  <head>\n    <script src="/js/a.js"></script>\n    <meta charset="utf-8">\n' +
    '    <script src="/js/b.js"></script>\n  </head>\n  <body><p>text</p></body>\n</html>\n';
  const compiled =
    '<html data-x="1" lang="en">\n  <head>\n    <script src="/js/a.js"></script><meta charset="utf-8">\n' +
    '    <script src="/js/b.js"></script></head>\n  <body><p>text</p></body>\n</html>';
  assert.deepEqual(norm(compiled), norm(authored));
  assert.deepEqual(norm(authored), [
    '<html data-x="1" lang="en">',
    '  <head>',
    '    <meta charset="utf-8">',
    '  </head>',
    '  <body>',
    '    <p>',
    '      #text text',
    '    </p>',
    '  </body>',
    '</html>',
  ]);
});

test('(c) a changed class, token, head order, text or pre whitespace each fails equality on its own', () => {
  const base = doc('<p class="lead">hello world</p><pre>a\n  b</pre>');
  const cases = {
    class: doc('<p class="lede">hello world</p><pre>a\n  b</pre>'),
    token: doc('<p class="lead">hello world</p><pre>a\n  b</pre>', '--text:#eee; --bg:#000'),
    text: doc('<p class="lead">hello  worlds</p><pre>a\n  b</pre>'),
    pre: doc('<p class="lead">hello world</p><pre>a\n   b</pre>'),
    headOrder:
      '<html style="--text:#fff; --bg:#000"><head><link rel="stylesheet" href="/css/b.css"><link rel="stylesheet" href="/css/a.css"><title>T</title></head><body><p class="lead">hello world</p><pre>a\n  b</pre></body></html>',
  };
  for (const [name, variant] of Object.entries(cases)) {
    assert.notDeepEqual(norm(variant), norm(base), `${name} should have failed equality`);
  }
  // collapsed text is insensitive to run length, verbatim `pre` text is not
  assert.deepEqual(norm(doc('<p>hello world</p>')), norm(doc('<p>hello   \n world</p>')));
  assert.ok(norm(base).includes('      #text a\\n  b')); // pre keeps its newline and indent, escaped
});

test('(d) <html style> is a declaration map: reorder is equal, a changed value is not', () => {
  const a = doc('<p>x</p>', '--bg:#000; --text:#fff; color:red');
  const b = doc('<p>x</p>', 'color:red; --text:#fff; --bg:#000');
  assert.deepEqual(norm(b), norm(a));
  assert.equal(norm(a)[0], '<html style="--bg:#000; --text:#fff; color:red">');
  assert.notDeepEqual(norm(doc('<p>x</p>', 'color:blue; --text:#fff; --bg:#000')), norm(a));
  // only <html> gets the treatment; other elements keep their style attribute verbatim
  assert.ok(norm(doc('<p style="b:2;a:1">x</p>')).includes('    <p style="b:2;a:1">'));
});

test('(e) astro guards, and script/noscript/modulepreload are dropped', () => {
  const html =
    '<html><head><link rel="modulepreload" href="/_astro/page.Ab12Cd34.js">' +
    '<link rel="stylesheet" href="/_astro/index.QwErTy99.css"></head>' +
    '<body data-astro-cid-abc123 class="p" data-astro-source-file="/x.astro">' +
    '<noscript><p>no js</p></noscript><script>var q = 1 < 2;</script>' +
    '<img data-astro-cid-abc123 src="/_astro/photo.Zz00.jpg" alt="a">' +
    '<p>see /_astro/thing.Hh11.js</p></body></html>';
  const { lines, guards } = normalizeHtml(html, OLD_OLD);
  // three rewrites, not four: the modulepreload link is dropped before its href is ever read
  assert.deepEqual(guards, { astroAttrs: 3, astroHashes: 3 });
  assert.deepEqual(lines, [
    '<html>',
    '  <head>',
    '    <link href="/_astro/HASH" rel="stylesheet">',
    '  </head>',
    '  <body class="p">',
    '    <img alt="a" src="/_astro/HASH">',
    '    <p>',
    '      #text see /_astro/HASH',
    '    </p>',
    '  </body>',
    '</html>',
  ]);
});

test('(f) old-old normalises nothing side-specific: --prose-* and relative URLs still differ', () => {
  const withProse = doc('<p>x</p>', '--bg:#000; --prose-lead:2rem');
  assert.notDeepEqual(norm(withProse), norm(doc('<p>x</p>', '--bg:#000')));
  assert.ok(norm(withProse)[0]!.includes('--prose-lead:2rem'));
  const relative = '<html><head><link rel="stylesheet" href="css/styles.css"></head><body></body></html>';
  const absolute = '<html><head><link rel="stylesheet" href="/css/styles.css"></head><body></body></html>';
  assert.notDeepEqual(norm(relative), norm(absolute));
  assert.deepEqual(norm(relative, { mode: 'old-old', side: 'new' }), norm(relative));
});

test('(g) parseDeclarations survives function values and quoted font stacks', () => {
  assert.deepEqual(parseDeclarations('--accent5: hsla(210,40%,50%,5%); COLOR : red ;'), [
    ['--accent5', 'hsla(210,40%,50%,5%)'],
    ['color', 'red'],
  ]);
  assert.deepEqual(parseDeclarations("font-family: 'Inter', sans-serif"), [
    ['font-family', "'Inter', sans-serif"],
  ]);
  assert.deepEqual(parseDeclarations("content: 'a;b'; background:url(data:image/png;base64,AA)"), [
    ['content', "'a;b'"],
    ['background', 'url(data:image/png;base64,AA)'],
  ]);
  assert.deepEqual(parseDeclarations('  ;; broken ;'), []);
});

test('(h) oldPath is the bare path in the default theme and ?style= otherwise', () => {
  assert.deepEqual(
    PAGE_TYPES.map((p) => oldPath(p, 'default', 'toolbelt')),
    ['/', '/blog/', '/blog/post.html?id=toolbelt', '/privacy/', '/404.html', '/lexchat/'],
  );
  assert.deepEqual(
    PAGE_TYPES.map((p) => oldPath(p, 'brutalist', 'toolbelt')),
    [
      '/?style=brutalist',
      '/blog/?style=brutalist',
      '/blog/post.html?id=toolbelt&style=brutalist',
      '/privacy/?style=brutalist',
      '/404.html?style=brutalist',
      '/lexchat/?style=brutalist',
    ],
  );
  assert.throws(() => oldPath('post', 'default'), /needs a postId/);
});

test('(i) step 4 lowercases tag names only, and raw-text and void elements are honoured', () => {
  // tag names are lowercased; attribute names are not, because the serializer preserves SVG
  // camelCase (viewBox, markerWidth, gradientUnits) and the post dumps carry it
  assert.deepEqual(norm('<P CLASS="x">t</P>'), ['<p CLASS="x">', '  #text t', '</p>']);
  assert.deepEqual(norm('<svg viewBox="0 0 1 1"></svg>'), ['<svg viewBox="0 0 1 1">', '</svg>']);
  assert.notDeepEqual(norm('<svg viewBox="0 0 1 1"></svg>'), norm('<svg viewbox="0 0 1 1"></svg>'));
  // `style` and `title` are raw text: their content is never parsed as markup
  assert.deepEqual(norm('<style>a>b{content:"<c>"}</style>'), [
    '<style>',
    '  #text a>b{content:"<c>"}',
    '</style>',
  ]);
  assert.deepEqual(norm('<title>1 < 2</title>'), ['<title>', '  #text 1 < 2', '</title>']);
  // `meta` and `link` are void: the next sibling stays at the same depth
  assert.deepEqual(norm('<head><meta charset="utf-8"><p>x</p></head>'), [
    '<head>',
    '  <meta charset="utf-8">',
    '  <p>',
    '    #text x',
    '  </p>',
    '</head>',
  ]);
  assert.equal(norm('<head><link href="/f.ico" rel="icon"><p>x</p></head>')[2], '  <p>');
});

test('(j) custom-property case, escapes in quoted values, and the HTML whitespace class', () => {
  assert.deepEqual(parseDeclarations('--Ticker-Dur: 3s; COLOR: RED'), [
    ['--Ticker-Dur', '3s'],
    ['color', 'RED'],
  ]);
  // the escaped quote does not end the string, so the `;` inside it is not a separator
  assert.deepEqual(parseDeclarations("content: 'a\\';b'; color: red"), [
    ['content', "'a\\';b'"],
    ['color', 'red'],
  ]);
  // U+2009 is not HTML whitespace: the serializer leaves it literal, so it stays content
  assert.deepEqual(norm('<p>a b</p>'), ['<p>', '  #text a b', '</p>']);
  assert.deepEqual(norm('<p>a \t\n\r\fb</p>'), ['<p>', '  #text a b', '</p>']);
});
