// S1-13: D39 engine invariants, proven first against hand-built emitted HTML and then through
// REAL isolated Astro builds. Every overlay mutates a copy assembled by buildSite(); production
// src/, public/ and astro.config.mjs are never written by this test.
import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { after, describe, it } from 'node:test';
import { pathToFileURL } from 'node:url';

import { buildSite } from '../fixtures/composition/build.ts';

const checks = await import('../../src/build/checks.ts');

const scratch: string[] = [];
after(() => scratch.splice(0).forEach((dir) => rmSync(dir, { recursive: true, force: true })));

function page(html: string, pathname = '/'): { pages: Array<{ pathname: string }>; dir: URL } {
  const root = mkdtempSync(join(tmpdir(), 's1-13-page-'));
  scratch.push(root);
  writeFileSync(join(root, pathname === '/404.html' ? '404.html' : 'index.html'), html);
  return { pages: [{ pathname }], dir: pathToFileURL(root + '/') };
}

const enabled = (mount: 'nav' | 'fab' = 'nav') => `<!doctype html><html><head><!--theme-assets--></head><body>
<!--picker-mount:${mount}-->
<aside id="tc-dock"></aside><div id="tc-scrim"></div><script defer src="/js/theme-cycler.js"></script>
<${mount === 'nav' ? 'li' : 'div'} class="tc-nav-item${mount === 'fab' ? ' tc-fab' : ''}"><button type="button" class="tc-nav-trigger" aria-haspopup="true" aria-controls="tc-dock" aria-expanded="false">Theme</button></${mount === 'nav' ? 'li' : 'div'}>
</body></html>`;

const pickerNone = '<!doctype html><html><head><!--theme-assets--></head><body><!--picker-mount:none--></body></html>';

function expectInvariantFailure(html: string, pattern: RegExp): void {
  const fixture = page(html);
  assert.throws(() => checks.assertShellInvariants(fixture.pages, fixture.dir), pattern);
}

function edit(dir: string, rel: string, from: string, to: string): void {
  const file = join(dir, rel);
  const text = readFileSync(file, 'utf8');
  const parts = text.split(from);
  assert.equal(parts.length, 2, `${rel}: expected one ${JSON.stringify(from)}`);
  writeFileSync(file, parts.join(to));
}

function rejectedBuild(name: string, mutate: (dir: string) => void, pattern: RegExp): void {
  assert.throws(() => buildSite(`${name}-`, mutate), pattern);
}

describe('pure emitted-page checks', () => {
  it('accepts nav, fab and picker-none pages with one asset and mount marker', () => {
    for (const html of [enabled('nav'), enabled('fab'), pickerNone]) {
      const fixture = page(html);
      assert.doesNotThrow(() => checks.assertShellInvariants(fixture.pages, fixture.dir));
    }
  });

  it('reports missing and double ThemeAssets markers with the route', () => {
    expectInvariantFailure(enabled().replace('<!--theme-assets-->', ''), /\/: expected exactly one ThemeAssets marker, found 0/);
    expectInvariantFailure(enabled().replace('<!--theme-assets-->', '<!--theme-assets--><!--theme-assets-->'), /found 2/);
  });

  it('rejects missing, double and invalid picker-mount provenance', () => {
    expectInvariantFailure(enabled().replace('<!--picker-mount:nav-->', ''), /picker-mount marker, found 0/);
    expectInvariantFailure(enabled().replace('<!--picker-mount:nav-->', '<!--picker-mount:nav--><!--picker-mount:nav-->'), /picker-mount marker, found 2/);
    expectInvariantFailure(enabled().replace('picker-mount:nav', 'picker-mount:own'), /invalid picker-mount marker "own"/);
  });

  it('requires one dock, scrim and cycler for enabled compositions', () => {
    expectInvariantFailure(enabled().replace('<aside id="tc-dock"></aside>', ''), /tc-dock.*found 0/);
    expectInvariantFailure(enabled().replace('<div id="tc-scrim"></div>', '<div id="tc-scrim"></div><div id="tc-scrim"></div>'), /tc-scrim.*found 2/);
    expectInvariantFailure(enabled().replace('<script defer src="/js/theme-cycler.js"></script>', ''), /theme-cycler.*found 0/);
  });

  it('requires every trigger to be a valid nested button and validates fab provenance', () => {
    expectInvariantFailure(enabled().replace('<button type="button" class="tc-nav-trigger"', '<a class="tc-nav-trigger"'), /trigger.*button/);
    expectInvariantFailure(enabled().replace(' aria-haspopup="true"', ''), /aria-haspopup/);
    expectInvariantFailure(enabled().replace(' aria-controls="tc-dock"', ''), /aria-controls/);
    expectInvariantFailure(enabled().replace(' aria-expanded="false"', ''), /aria-expanded/);
    expectInvariantFailure(enabled().replace('class="tc-nav-item"', 'class="not-the-item"'), /nested.*tc-nav-item/);
    expectInvariantFailure(enabled().replace('</body>', '<li class="tc-nav-item"><button class="tc-nav-trigger" aria-haspopup="true" aria-controls="tc-dock" aria-expanded="false"></button></li></body>'), /exactly one.*trigger.*found 2/);
    expectInvariantFailure(enabled('fab').replace(' tc-fab', ''), /fab.*tc-fab/);
    expectInvariantFailure(enabled('nav').replace('tc-nav-item', 'tc-nav-item tc-fab'), /nav.*tc-fab/);
  });

  it('requires picker-none to emit no picker markup or runtime', () => {
    for (const addition of ['<aside id="tc-dock"></aside>', '<div id="tc-scrim"></div>', '<script src="/js/theme-cycler.js"></script>', '<div class="tc-fab"></div>', '<button class="tc-nav-trigger"></button>']) {
      expectInvariantFailure(pickerNone.replace('</body>', addition + '</body>'), /picker-none.*must not emit/);
    }
  });

  it('rejects relative and literal same-origin navigation in emitted anchors but permits generated SEO', () => {
    expectInvariantFailure(enabled().replace('</body>', '<a href="blog/">Bad</a></body>'), /relative navigation href "blog\/"/);
    expectInvariantFailure(enabled().replace('</body>', '<a href="https:\/\/www.dawsonamf.com\/blog\/">Bad</a></body>'), /literal same-origin navigation/);
    const fixture = page(enabled().replace('</head>', '<link rel="canonical" href="https://www.dawsonamf.com/"><meta property="og:url" content="https://www.dawsonamf.com/"></head>'));
    assert.doesNotThrow(() => checks.assertShellInvariants(fixture.pages, fixture.dir));
    for (const href of ['HTTPS://WWW.DAWSONAMF.COM/blog/', '//www.dawsonamf.com/blog/']) {
      expectInvariantFailure(enabled().replace('</body>', `<a href="${href}">Bad</a></body>`), /literal same-origin navigation/);
    }
    const differentHost = page(enabled().replace('</body>', '<a href="https://www.dawsonamf.com.evil.example/blog/">External</a></body>'));
    assert.doesNotThrow(() => checks.assertShellInvariants(differentHost.pages, differentHost.dir));
  });

  it('ignores HTML lookalikes in comments, raw text and RCDATA while parsing quoted > attributes', () => {
    const valid = pickerNone.replace('</body>', '<script>const example = \'<a href="blog/">x</a><!--picker-mount:nav-->\';</script><textarea><aside id="tc-dock"></aside><!--theme-assets--></textarea><a data-example=">" href="/blog/">Blog</a></body>');
    const fixture = page(valid);
    assert.doesNotThrow(() => checks.assertShellInvariants(fixture.pages, fixture.dir));
    expectInvariantFailure(pickerNone.replace('<!--theme-assets-->', '').replace('</body>', '<script>"<!--theme-assets-->"</script></body>'), /ThemeAssets marker, found 0/);
    expectInvariantFailure(pickerNone.replace('</body>', '<!--<aside id="tc-dock"></aside>--><div id="tc-dock"></div></body>'), /picker-none.*#tc-dock/);
  });

  it('rejects URL-resolved output paths outside the build directory', () => {
    const root = mkdtempSync(join(tmpdir(), 's1-13-boundary-'));
    scratch.push(root);
    const dist = join(root, 'dist');
    mkdirSync(dist);
    writeFileSync(join(root, 'outside.html'), pickerNone);
    for (const pathname of ['%2e%2e/outside.html', '.%2e/outside.html', '%2e./outside.html']) {
      assert.throws(
        () => checks.assertShellInvariants([{ pathname }], pathToFileURL(dist + '/')),
        new RegExp(`escapes output directory.*${pathname.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`),
      );
    }
  });
});

describe('source href check', () => {
  it('names file and line for relative hrefs and literal same-origin navigation', () => {
    const root = mkdtempSync(join(tmpdir(), 's1-13-src-'));
    scratch.push(root);
    writeFileSync(join(root, 'bad.astro'), '<a href="../blog/">bad</a>\n<a href="https://www.dawsonamf.com/">home</a>\n');
    assert.throws(() => checks.assertNoRelativeHrefs(root), /bad\.astro:1.*relative href "\.\.\/blog\/"[\s\S]*bad\.astro:2.*literal same-origin/);
  });

  it('accepts root paths, fragments, schemes and generated canonical values', () => {
    const root = mkdtempSync(join(tmpdir(), 's1-13-src-'));
    scratch.push(root);
    writeFileSync(join(root, 'good.astro'), '<a href="/blog/">blog</a><a href="#contact">c</a><a href="mailto:a@b.com">m</a><link rel="canonical" href="https://www.dawsonamf.com/"><meta property="og:url" content="https://www.dawsonamf.com/">');
    assert.doesNotThrow(() => checks.assertNoRelativeHrefs(root));
  });

  it('normalizes literal origins without rejecting hostname prefixes and preserves the scheme-pass contract', () => {
    const root = mkdtempSync(join(tmpdir(), 's1-13-src-'));
    scratch.push(root);
    writeFileSync(join(root, 'mixed.astro'), '<a href="HTTPS://WWW.DAWSONAMF.COM/blog/">same</a><a href="//www.dawsonamf.com/blog/">same</a>');
    assert.throws(() => checks.assertNoRelativeHrefs(root), /literal same-origin navigation/);
    writeFileSync(join(root, 'mixed.astro'), '<a href="https://www.dawsonamf.com.evil.example/">external</a><a href="javascript:example()">scheme pass</a>');
    assert.doesNotThrow(() => checks.assertNoRelativeHrefs(root));
  });
});

describe('isolated negative Astro builds', () => {
  it('fails missing and double asset markers', () => {
    rejectedBuild('missing-asset', (dir) => edit(dir, 'src/layouts/ThemeAssets.astro', '<!--theme-assets-->', ''), /expected exactly one ThemeAssets marker, found 0/);
    rejectedBuild('double-asset', (dir) => edit(dir, 'src/layouts/ThemeAssets.astro', '<!--theme-assets-->', '<!--theme-assets--><!--theme-assets-->'), /found 2/);
  });

  it('fails an extra dock and a missing trigger', () => {
    rejectedBuild('extra-dock', (dir) => edit(dir, 'src/layouts/canonical/components/ThemeDock.astro', '<aside class="tc-dock', '<aside id="tc-dock"></aside><aside class="tc-dock'), /tc-dock.*found 2/);
    rejectedBuild('missing-trigger', (dir) => edit(dir, 'src/layouts/canonical/components/ThemePicker.astro', ' tc-nav-trigger`}', '`}' ), /trigger.*found 0/);
  });

  it('fails a complete picker-tail deletion using the independent mount marker', () => {
    rejectedBuild('deleted-picker-tail', (dir) => edit(dir, 'src/layouts/Shell.astro', "picker.mount !== 'none' && (", "false && picker.mount !== 'none' && ("), /picker mount nav.*tc-dock.*found 0/);
  });

  it('fails a missing prose size and a relative source href with source context', () => {
    rejectedBuild('missing-size', (dir) => edit(dir, 'src/layouts/canonical/Home.astro', "prose.text('meta.home.title', 's')", "prose.text('meta.home.title', 'xs')"), /prose:meta\.home\.title:xs/);
    rejectedBuild('relative-href', (dir) => edit(dir, 'src/layouts/canonical/Home.astro', 'href="/css/styles.css"', 'href="css/styles.css"'), /Home\.astro:\d+.*relative href "css\/styles\.css"/);
  });
});
