// S1-13: the old-new adapter, exact §9 map-then-theme rule, bounded §15 exceptions, palette
// comparison boundary and script identities. Pure: no browser, server or network.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { describe, it } from 'node:test';

import { applyDomExceptions, postHeadIssues, screenshotExceptionGroups, styleSampleForComparison } from '../../harness/exceptions.ts';
import { createMigratedAdapter } from '../../harness/migrated.ts';
import { normalizeHtml, type NormalizeOptions } from '../../harness/normalize.ts';
import { paletteEvidenceForComparison, reloadOutcome } from '../../harness/palette.ts';
import { expectedScripts, rawScriptSources, scriptOrderIssues } from '../../harness/scripts.ts';
import { loadMigratedAdapter } from '../../harness/urls.ts';

const adapter = createMigratedAdapter();
const oldNew = (
  side: 'old' | 'new',
  page: NormalizeOptions['page'] = 'home',
  theme = 'brutalist',
  postId?: string,
): NormalizeOptions => ({ mode: 'old-new', side, page, theme, ...(postId ? { postId } : {}), adapter });
const norm = (html: string, opts: NormalizeOptions) => normalizeHtml(html, opts).lines;

describe('lazy migrated adapter and URL matrix facts', () => {
  it('does not invoke the migrated loader in old-old mode', async () => {
    let calls = 0;
    const loaded = await loadMigratedAdapter('old-old', async () => {
      calls++;
      throw new Error('old-old imported migrated production modules');
    });
    assert.equal(loaded, null);
    assert.equal(calls, 0);
  });

  it('keeps the old-old parity static import graph independent of migrated production modules', () => {
    const seen = new Set<string>();
    const visit = (file: string): void => {
      if (seen.has(file)) return;
      seen.add(file);
      const source = readFileSync(file, 'utf8');
      const statements = /^\s*import\b[\s\S]*?;\s*$/gm;
      for (const statement of source.matchAll(statements)) {
        if (/^\s*import\s+type\b/.test(statement[0])) continue;
        const specifier = /(?:\bfrom\s*)?["'](\.[^"']+)["']/.exec(statement[0])?.[1];
        if (!specifier) continue;
        const target = resolve(dirname(file), specifier);
        if (target.endsWith('.ts') || target.endsWith('.mjs')) visit(target);
      }
    };
    visit(resolve(import.meta.dirname, '../../harness/parity.spec.ts'));
    const forbidden = [...seen].filter((file) =>
      file.endsWith('/harness/migrated.ts') || file.endsWith('/scripts/vendor-map.mjs')
        || /\/src\/(?:themes|build\/posts|prose\/site)\//.test(file),
    );
    assert.deepEqual(forbidden, []);
  });

  it('derives all theme and published-post ids from production sources', () => {
    assert.deepEqual(adapter.themeIds, ['default', 'brutalist', 'marquee', 'blueprint', 'field-notes', 'doodle', 'grid', 'miami-deco', 'bauhaus', 'chinoiserie', 'gallery', 'banknote', 'neo-pop', 'broadsheet', 'studio', 'wheatpaste']);
    assert.deepEqual(adapter.publishedPostIds, ['fly-on-my-laptop', 'underviewed-art', 'arena-freshness', 'helm', 'toolbelt', 'embedded-swift-agent', 'metr-doubling', 'college-projects']);
    assert.deepEqual(adapter.matrixPosts, ['toolbelt', 'embedded-swift-agent', 'metr-doubling']);
  });

  it('projects the six page forms without default or double prefixes', () => {
    assert.deepEqual(
      ['home', 'blog', 'post', 'privacy', 'notFound', 'lexchat'].map((page) => adapter.newPath(page as never, 'brutalist', 'toolbelt')),
      ['/brutalist/', '/brutalist/blog/', '/brutalist/blog/toolbelt/', '/brutalist/privacy/', '/404.html?style=brutalist', '/brutalist/lexchat/'],
    );
    assert.equal(adapter.newPath('post', 'default', 'toolbelt'), '/blog/toolbelt/');
    assert.throws(() => adapter.newPath('post', 'default'), /needs a postId/);
  });
});

describe('§9 old-side-only map then theme', () => {
  it('maps authored navigation and static asset forms before applying the theme', () => {
    const old = '<html><head><link rel="stylesheet" href="../css/styles.css"><link rel="stylesheet" href="blog-listing-styles.css"><link rel="stylesheet" href="https://unpkg.com/aos@2.3.1/dist/aos.css"></head><body><a href="../index.html#contact">Home</a><a href="./">Blog</a><a href="post.html?id=toolbelt">Post</a><img src="../../resources/a.png"><iframe src="/lexchat/"></iframe></body></html>';
    const migrated = '<html><head><link rel="stylesheet" href="/css/styles.css"><link rel="stylesheet" href="/blog/blog-listing-styles.css"><link rel="stylesheet" href="/vendor/aos/aos.css"></head><body><a href="/brutalist/#contact">Home</a><a href="/brutalist/blog/">Blog</a><a href="/brutalist/blog/toolbelt/">Post</a><img src="/resources/a.png"><iframe src="/brutalist/lexchat/"></iframe></body></html>';
    assert.deepEqual(norm(old, oldNew('old', 'blog')), norm(migrated, oldNew('new', 'blog')));
  });

  it('leaves bare fragments and external URLs verbatim', () => {
    const html = '<html><body><a href="#contact">C</a><a href="mailto:a@b.com">M</a><img src="https://example.com/x.png"></body></html>';
    assert.deepEqual(norm(html, oldNew('old')), norm(html, oldNew('new')));
  });

  it('does not normalize unlisted internal-looking forms', () => {
    const old = '<html><body><a href="../12years/">old redirect</a><a href="/unlisted/">unlisted</a><a href="../post.html?id=toolbelt">near</a><a href="post.html?id=toolbelt&junk=1">junk</a><a href="post.html?style=brutalist&id=toolbelt">reordered</a><a href="post.html?id=toolbelt#x">fragment</a><a href="post.html?id=toolbelt&style=wrong">wrong style</a></body></html>';
    const migrated = '<html><body><a href="/subsites/elise/">moved</a><a href="/brutalist/unlisted/">hidden</a><a href="/brutalist/blog/toolbelt/">hidden</a><a href="/brutalist/blog/toolbelt/">hidden</a><a href="/brutalist/blog/toolbelt/">hidden</a><a href="/brutalist/blog/toolbelt/#x">hidden</a><a href="/wrong/blog/toolbelt/">hidden</a></body></html>';
    assert.notDeepEqual(norm(old, oldNew('old')), norm(migrated, oldNew('new')));
  });

  it('maps only the three documented post path forms and exact legacy style query', () => {
    for (const href of ['post.html?id=toolbelt', 'blog/post.html?id=toolbelt', '../blog/post.html?id=toolbelt', 'post.html?id=toolbelt&style=brutalist']) {
      const old = `<html><body><a href="${href}">post</a></body></html>`;
      const migrated = '<html><body><a href="/brutalist/blog/toolbelt/">post</a></body></html>';
      assert.deepEqual(norm(old, oldNew('old')), norm(migrated, oldNew('new')), href);
    }
  });

  it('does not rewrite generated canonical or OG metadata', () => {
    const old = '<html><head><link rel="canonical" href="https://www.dawsonamf.com/"><link rel="icon" href="https://www.dawsonamf.com/resources/a.png"><meta property="og:url" content="https://www.dawsonamf.com/"><meta property="og:image" content="https://www.dawsonamf.com/resources/a.png"></head><body></body></html>';
    const migrated = old.replace('<link rel="icon" href="https://www.dawsonamf.com/resources/a.png">', '<link rel="icon" href="/resources/a.png">');
    assert.deepEqual(norm(old, oldNew('old')), norm(migrated, oldNew('new')));
  });

  it('skips the theme step on 404 while still mapping authored forms', () => {
    const old = '<html><body><a href="/">Home</a><img src="resources/a.png"></body></html>';
    const migrated = '<html><body><a href="/">Home</a><img src="/resources/a.png"></body></html>';
    assert.deepEqual(norm(old, oldNew('old', 'notFound')), norm(migrated, oldNew('new', 'notFound')));
  });

  it('finishes ?style links at step one instead of theming twice', () => {
    const old = '<html><body><a href="?style=marquee">M</a></body></html>';
    const migrated = '<html><body><a href="/marquee/blog/">M</a></body></html>';
    assert.deepEqual(norm(old, oldNew('old', 'blog', 'brutalist')), norm(migrated, oldNew('new', 'blog', 'brutalist')));
    assert.ok(!norm(old, oldNew('old', 'blog', 'brutalist')).join('\n').includes('/brutalist/marquee/'));
  });

  it('preserves pre whitespace and does not hide missing nodes', () => {
    assert.notDeepEqual(norm('<html><body><pre>a\n b</pre></body></html>', oldNew('old')), norm('<html><body><pre>a\n  b</pre></body></html>', oldNew('new')));
    assert.notDeepEqual(norm('<html><body><p>x</p></body></html>', oldNew('old')), norm('<html><body></body></html>', oldNew('new')));
  });
});

describe('bounded §15 exception table', () => {
  it('removes only the declared privacy/404 picker additions from new DOM', () => {
    const base = ['<html>', '  <body>', '    <p class="keep">', '      #text x', '    </p>', '  </body>', '</html>'];
    const additions = ['<html>', '  <body>', '    <div class="tc-fab">', '    </div>', '    <aside id="tc-dock">', '    </aside>', '    <div id="tc-scrim">', '    </div>', '    <p class="keep">', '      #text x', '    </p>', '  </body>', '</html>'];
    assert.deepEqual(applyDomExceptions(additions, { page: 'privacy', side: 'new', theme: 'default' }), base);
    assert.notDeepEqual(applyDomExceptions(additions, { page: 'home', side: 'new', theme: 'default' }), base);
  });

  it('bounds post metadata exceptions to title, description and new social tags', () => {
    const old = '<html><head><title>Loading…</title><meta name="description" content="old"></head><body><p>same</p></body></html>';
    const migrated = '<html><head><title>Toolbelt</title><meta name="description" content="new"><link rel="canonical" href="https://www.dawsonamf.com/blog/toolbelt/"><meta property="og:title" content="Toolbelt"><meta name="twitter:card" content="summary"></head><body><p>same</p></body></html>';
    assert.deepEqual(norm(old, oldNew('old', 'post', 'default', 'toolbelt')), norm(migrated, oldNew('new', 'post', 'default', 'toolbelt')));
    assert.notDeepEqual(norm(old.replace('<p>same</p>', '<p>changed</p>'), oldNew('old', 'post', 'default', 'toolbelt')), norm(migrated, oldNew('new', 'post', 'default', 'toolbelt')));
  });

  it('normalizes only declared dock and themed-route attributes', () => {
    const old = '<html><head><link rel="canonical" href="https://www.dawsonamf.com/"></head><body><aside id="tc-dock"><ul id="tc-presets"><li><a class="tc-row-link" href="/?style=brutalist">B</a></li></ul></aside></body></html>';
    const migrated = '<html data-typing="word" data-typing-delete="word"><head><link rel="canonical" href="https://www.dawsonamf.com/"><meta name="robots" content="noindex"></head><body><aside id="tc-dock" data-styles="Styles"><ul id="tc-presets"><li data-profile="{&quot;polarity&quot;:&quot;dark&quot;}"><a class="tc-row-link" data-fonts="[]" href="/brutalist/">B</a></li></ul></aside></body></html>';
    assert.deepEqual(norm(old, oldNew('old')), norm(migrated, oldNew('new')));

    const stray = migrated.replace('<body>', '<body><p data-profile="must-remain">x</p>');
    assert.notDeepEqual(norm(old, oldNew('old')), norm(stray, oldNew('new')));

    for (const lookalike of [
      '<a class="tc-row-link" href="/wrong" data-fonts="wrong">outside</a>',
      '<aside id="tc-dock"><a class="tc-row-link" href="/wrong" data-fonts="wrong">no presets</a></aside>',
      '<aside id="tc-dock"><ul id="tc-presets"><span class="tc-row-link" href="/wrong" data-fonts="wrong">wrong element</span></ul></aside>',
    ]) {
      const left = `<html><body>${lookalike}</body></html>`;
      const right = left.replaceAll('/wrong', '/different').replaceAll('data-fonts="wrong"', 'data-fonts="different"');
      assert.notDeepEqual(norm(left, oldNew('old')), norm(right, oldNew('new')));
    }
  });

  it('limits changed-card text removal to Helm and METR card descendants', () => {
    const changed = ['<html>', '  <body>', '    <a class="blog-card" href="/blog/helm/">', '      <h2 class="blog-card-title">', '        #text changed', '      </h2>', '    </a>', '    <a class="blog-card" href="/blog/toolbelt/">', '      <h2 class="blog-card-title">', '        #text keep', '      </h2>', '    </a>', '  </body>', '</html>'];
    const filtered = applyDomExceptions(changed, { page: 'blog', side: 'new', theme: 'default' });
    assert.ok(!filtered.includes('        #text changed'));
    assert.ok(filtered.includes('        #text keep'));
    const collision = changed.map((line) => line.replace('/blog/helm/', '/blog/shellmet-helmet/'));
    assert.ok(applyDomExceptions(collision, { page: 'blog', side: 'new', theme: 'default' }).includes('        #text changed'));
  });

  it('drops only --prose-* from the new computed token sample', () => {
    const sample = { 'html --text': '#fff', 'html --prose-lead': '2rem', 'html --ticker-run': 'x', 'body color': 'rgb(1, 2, 3)' };
    assert.deepEqual(styleSampleForComparison(sample, { mode: 'old-new', side: 'new' }), { 'html --text': '#fff', 'html --ticker-run': 'x', 'body color': 'rgb(1, 2, 3)' });
    assert.deepEqual(styleSampleForComparison(sample, { mode: 'old-new', side: 'old' }), sample);
    assert.deepEqual(styleSampleForComparison(sample, { mode: 'old-old', side: 'new' }), sample);
  });

  it('exposes only the exact screenshot masks implied by visible exceptions', () => {
    assert.deepEqual(screenshotExceptionGroups('privacy', 'default'), [['.tc-fab']]);
    assert.deepEqual(screenshotExceptionGroups('notFound', 'default'), [['.tc-fab']]);
    assert.deepEqual(screenshotExceptionGroups('blog', 'brutalist'), [
      ['a.blog-card[href="/brutalist/blog/helm/"] .blog-card-title', 'a.blog-card[href="/brutalist/blog/helm/"] .blog-card-date'],
      ['a.blog-card[href="/brutalist/blog/metr-doubling/"] .blog-card-title', 'a.blog-card[href="/brutalist/blog/metr-doubling/"] .blog-card-date'],
    ]);
    assert.deepEqual(screenshotExceptionGroups('post', 'default'), []);
  });
});

describe('authoritative migrated facts and palette outcomes', () => {
  it('reads Helm and METR changed card facts from their post sources', () => {
    assert.deepEqual(adapter.changedCards, {
      helm: { title: 'Helm: A Workspace Switcher for VS Code and Cursor', date: 'March 2026' },
      'metr-doubling': { title: 'How Fast Are Agents Improving?', date: 'February 2026' },
    });
    assert.equal(adapter.postMetadata.toolbelt.canonical, 'https://www.dawsonamf.com/blog/toolbelt/');
    assert.equal(adapter.postMetadata.toolbelt.ogImage, 'https://www.dawsonamf.com/resources/og-avatar.jpg');
    assert.equal(adapter.postMetadata.toolbelt.datePublished, '2026-03-01');
    assert.deepEqual(adapter.postMetadata.toolbelt.tags, ['Tools', 'Systems']);
    assert.match(adapter.postMetadata.toolbelt.title, /^Toolbelt:/);
  });

  it('rejects missing, wrong, duplicate or arbitrary excluded post metadata', () => {
    const expected = adapter.postMetadata.toolbelt;
    const valid = {
      titles: [expected.titleTag], descriptions: [expected.description], canonicals: [expected.canonical],
      openGraph: [
        ['og:title', expected.title], ['og:description', expected.description],
        ['og:url', expected.canonical], ['og:image', expected.ogImage],
      ] as Array<[string | null, string | null]>,
      twitter: [] as Array<[string | null, string | null]>, jsonLd: [expected.jsonLd], heading: expected.title,
    };
    assert.deepEqual(postHeadIssues(valid, expected), []);
    assert.match(postHeadIssues({ ...valid, openGraph: valid.openGraph.filter(([name]) => name !== 'og:image') }, expected).join('\n'), /og:image/);
    assert.match(postHeadIssues({ ...valid, openGraph: valid.openGraph.map(([name, value]) => [name, name === 'og:image' ? '/wrong.png' : value]) }, expected).join('\n'), /wrong\.png/);
    assert.match(postHeadIssues({ ...valid, openGraph: [...valid.openGraph, ['og:title', expected.title]] }, expected).join('\n'), /Open Graph/);
    assert.deepEqual(postHeadIssues({ ...valid, twitter: [['twitter:card', 'summary']] }, expected), []);
    assert.match(postHeadIssues({ ...valid, twitter: [['twitter:card', 'summary'], ['twitter:card', 'summary']] }, expected).join('\n'), /Twitter/);
  });

  it('keeps old reload reset and requires new reload persistence', () => {
    assert.equal(reloadOutcome('old-old', 'old'), 'reset');
    assert.equal(reloadOutcome('old-old', 'new'), 'reset');
    assert.equal(reloadOutcome('old-new', 'old'), 'reset');
    assert.equal(reloadOutcome('old-new', 'new'), 'persist');
  });

  it('compares shared palette evidence without hiding unrelated fields', () => {
    const evidence = { base: { a: 1 }, shuffled: { a: 2 }, navigate: { a: 2 }, reload: { a: 9 }, picker: { open: true }, extra: 'kept' };
    assert.deepEqual(paletteEvidenceForComparison(evidence, 'old-new'), { base: { a: 1 }, shuffled: { a: 2 }, navigate: { a: 2 }, picker: { open: true }, extra: 'kept' });
    assert.deepEqual(paletteEvidenceForComparison(evidence, 'old-old'), evidence);
  });
});

describe('raw and loaded script verification', () => {
  it('resolves raw emitted scripts in source order', () => {
    const html = '<!--<script src="/fake-comment.js"></script>--><script data-note=">" defer src="/vendor/aos/aos.js"></script><script>const fake = \'<script src="/fake-raw.js"></script>\';</script><script src="https://cdn.plot.ly/plotly-2.27.0.min.js"></script>';
    assert.deepEqual(rawScriptSources(html, 'http://127.0.0.1:8782/blog/metr-doubling/'), ['/vendor/aos/aos.js', 'https://cdn.plot.ly/plotly-2.27.0.min.js']);
  });

  it('uses exact identities, raw source order, and only source-proven loaded order', () => {
    const oldHome = ['https://cdnjs.cloudflare.com/ajax/libs/gsap/3.9.1/gsap.min.js', 'https://code.jquery.com/jquery-3.6.0.min.js', 'https://code.jquery.com/ui/1.12.1/jquery-ui.min.js'];
    assert.deepEqual(scriptOrderIssues('home', 'old', 'raw', oldHome), []);
    assert.match(scriptOrderIssues('home', 'old', 'raw', [...oldHome].reverse()).join('\n'), /order/);
    const metrResources = expectedScripts('post', 'old', 'loaded', 'metr-doubling');
    assert.deepEqual(scriptOrderIssues('post', 'old', 'loaded', [metrResources[1]!, metrResources[0]!, ...metrResources.slice(2)], 'metr-doubling'), []);
    const reversedAssets = [...metrResources.slice(0, -3), ...metrResources.slice(-3).reverse()];
    assert.match(scriptOrderIssues('post', 'old', 'loaded', reversedAssets, 'metr-doubling').join('\n'), /resource order/);
    const migratedMetrResources = expectedScripts('post', 'new', 'loaded', 'metr-doubling', adapter);
    const migratedAssetsFirst = [...migratedMetrResources.slice(-3).reverse(), ...migratedMetrResources.slice(0, -3)];
    assert.deepEqual(scriptOrderIssues('post', 'new', 'loaded', migratedAssetsFirst, 'metr-doubling', true, adapter), []);
    assert.deepEqual(scriptOrderIssues('lexchat', 'new', 'raw', [], undefined, false, adapter), []);
    assert.match(scriptOrderIssues('lexchat', 'new', 'raw', ['/js/theme-cycler.js'], undefined, false, adapter).join('\n'), /not allowed/);
    const newHome = expectedScripts('home', 'new', 'raw', undefined, adapter);
    assert.ok(newHome.includes('/vendor/gsap/gsap.min.js'));
    assert.deepEqual(scriptOrderIssues('home', 'new', 'raw', newHome, undefined, true, adapter), []);
    assert.match(scriptOrderIssues('home', 'new', 'raw', newHome.slice(1), undefined, true, adapter).join('\n'), /complete/);
  });
});
