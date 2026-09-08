// S1-20: publication-derived shim, redirect, sitemap and post-resource output.
// Run: node --test --test-concurrency=1 tests/build/publication-output.test.ts
import assert from 'node:assert/strict';
import { cpSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { after, before, describe, it } from 'node:test';
import { runInNewContext } from 'node:vm';

import {
  externalPostRedirects,
  legacyPostShimHtml,
} from '../../src/build/post-output.ts';
import {
  postDates,
  publishedPostIds,
  readPostSources,
} from '../../src/build/posts.ts';
import type { PostSource } from '../../src/build/posts.ts';
import { prose } from '../../src/prose/site.ts';
import { buildSite, cleanup } from '../fixtures/composition/build.ts';

const repoRoot = resolve(import.meta.dirname, '..', '..');
const sources = readPostSources();
const published = publishedPostIds(sources);

function shimScript(html: string): string {
  const match = /<script>([\s\S]*?)<\/script>/.exec(html);
  assert.ok(match, 'shim has one executable script');
  return match[1];
}

function shimDestination(search: string, hash = ''): string {
  let destination = '';
  const location = {
    search,
    hash,
    replace(value: string) { destination = value; },
  };
  runInNewContext(shimScript(legacyPostShimHtml(sources)), {
    URLSearchParams,
    window: { location },
  });
  return destination;
}

function sitemapEntries(xml: string): Map<string, string | undefined> {
  return new Map([...xml.matchAll(/<url>([\s\S]*?)<\/url>/g)].map((match) => {
    const loc = /<loc>(.*?)<\/loc>/.exec(match[1])?.[1];
    assert.ok(loc, 'sitemap entry has loc');
    return [loc, /<lastmod>(.*?)<\/lastmod>/.exec(match[1])?.[1]];
  }));
}

function localReferences(html: string): string[] {
  return [...html.matchAll(/\b(?:href|src)="([^"]+)"/g)]
    .map((match) => match[1])
    .filter((url) => url.startsWith('/') && !url.startsWith('//'));
}

describe('S1-20 publication output', () => {
  let dir: string | undefined;
  let dist = '';

  before(() => {
    const built = buildSite('s1-20-publication-', (root) => {
      mkdirSync(join(root, 'public', 'vendor'), { recursive: true });
      cpSync(join(repoRoot, 'public', 'resources'), join(root, 'public', 'resources'), { recursive: true });
      cpSync(
        join(repoRoot, 'public', 'vendor', 'vanilla-tilt'),
        join(root, 'public', 'vendor', 'vanilla-tilt'),
        { recursive: true },
      );
      writeFileSync(join(root, 'public', 'blog', 'post.html'), 'STALE_SHIM_MUST_NOT_REACH_DIST');
    });
    dir = built.dir;
    dist = built.dist;
  });

  after(() => cleanup(dir));

  it('projects only the approved external redirects, verbatim, from post records', () => {
    assert.deepEqual(externalPostRedirects(sources), {
      '/blog/autoencoders-2/': 'https://www.aboutobjects.com/2024/04/01/autoencoders-part-2/',
      '/blog/autoencoders-1/': 'https://www.aboutobjects.com/2024/01/05/autoencoders-part-1/',
    });
  });

  it('generates a fixed blog fallback and redirects only through embedded projections', () => {
    const html = legacyPostShimHtml(sources);
    assert.ok(html.includes('<link rel="canonical" href="https://www.dawsonamf.com/blog/">'));
    assert.ok(html.includes('<meta http-equiv="refresh" content="0;url=/blog/">'));
    assert.equal(shimDestination('?id=helm'), '/blog/helm/');
    assert.equal(shimDestination('?id=helm&style=doodle'), '/doodle/blog/helm/');
    assert.equal(shimDestination('?style=doodle&id=helm', '#architecture'), '/doodle/blog/helm/#architecture');
    assert.equal(shimDestination('?id=helm&style=default'), '/blog/helm/');
    assert.equal(shimDestination('?id=helm&style=space'), '/blog/helm/');
    assert.equal(shimDestination('?id=helm&style=%2F%2Fevil.example'), '/blog/helm/');
    assert.equal(shimDestination('?id=helm&destination=https%3A%2F%2Fevil.example'), '/blog/helm/');

    for (const search of [
      '',
      '?id=',
      '?id=gemma4-heretic-ara',
      '?id=unknown',
      '?id=constructor',
      '?id=__proto__',
      '?id=https%3A%2F%2Fevil.example',
      '?destination=https%3A%2F%2Fevil.example',
    ]) {
      assert.equal(shimDestination(search, '#ignored'), '/404.html', search);
    }

    assert.equal(
      shimDestination('?id=autoencoders-1&style=doodle&destination=https%3A%2F%2Fevil.example', '#ignored'),
      'https://www.aboutobjects.com/2024/01/05/autoencoders-part-1/',
      'an external record uses its approved destination verbatim',
    );
  });

  it('escapes generated records and theme ids at the script boundary', () => {
    const hostile = {
      id: '</script><script>globalThis.pwned=true</script>',
      source: 'hostile.md',
      body: '',
      meta: {
        publication: 'published', listingOrder: 0, title: { s: 'x' }, date: 'January 2026',
        description: { l: 'x' }, tags: [], scripts: [], styles: [],
      },
    } as PostSource;
    const html = legacyPostShimHtml([hostile], ['default', '</script><script>pwned=true</script>']);
    assert.equal((html.match(/<script>/g) ?? []).length, 1);
    assert.equal(html.includes('</script><script>'), false);
    assert.ok(html.includes('\\u003c/script\\u003e'));
  });

  it('owns visible shim text in approved prose and HTML-escapes it at generation', () => {
    const html = legacyPostShimHtml(sources);
    assert.ok(html.includes(`<title>${prose.text('meta.blog.title', 's')}</title>`));
    assert.ok(html.includes(`<a href="/blog/">${prose.text('nav.blog', 'xs')}</a>`));

    let hostileDir: string | undefined;
    try {
      const hostile = buildSite('s1-20-shim-prose-', (root) => {
        const file = join(root, 'src', 'content', 'prose.yaml');
        const yaml = readFileSync(file, 'utf8')
          .replace('    title: { s: Blog }', '    title: { s: "2 < 3 & 4 > 1" }')
          .replace('\n  blog: { xs: Blog }\n', '\n  blog: { xs: "A < B & C > D" }\n');
        writeFileSync(file, yaml);
      });
      hostileDir = hostile.dir;
      const generated = readFileSync(join(hostile.dist, 'blog', 'post.html'), 'utf8');
      assert.ok(generated.includes('<title>2 &lt; 3 &amp; 4 &gt; 1</title>'));
      assert.ok(generated.includes('<a href="/blog/">A &lt; B &amp; C &gt; D</a>'));
      assert.equal(generated.includes('<title>2 < 3 & 4 > 1</title>'), false);
      assert.equal(generated.includes('<a href="/blog/">A < B & C > D</a>'), false);
    } finally {
      cleanup(hostileDir);
    }
  });

  it('overwrites a stale public shim before copying and emits canonical external stubs', () => {
    const shim = readFileSync(join(dist, 'blog', 'post.html'), 'utf8');
    assert.equal(shim.includes('STALE_SHIM_MUST_NOT_REACH_DIST'), false);
    assert.equal(shim, legacyPostShimHtml(sources));

    for (const [route, destination] of Object.entries(externalPostRedirects(sources))) {
      const html = readFileSync(join(dist, route, 'index.html'), 'utf8');
      assert.ok(html.includes(`<meta http-equiv="refresh" content="0;url=${destination}">`), route);
      assert.ok(html.includes(`<link rel="canonical" href="${destination}">`), route);
      assert.ok(html.includes('<meta name="robots" content="noindex">'), route);
    }
  });

  it('sitemaps only default routes and local posts, with authoritative post dates', () => {
    assert.ok(existsSync(join(dist, 'sitemap-index.xml')));
    assert.ok(existsSync(join(dist, 'sitemap-0.xml')));
    assert.equal(existsSync(join(dist, 'sitemap.xml')), false);

    const entries = sitemapEntries(readFileSync(join(dist, 'sitemap-0.xml'), 'utf8'));
    const expected = new Set([
      'https://www.dawsonamf.com/',
      'https://www.dawsonamf.com/blog/',
      'https://www.dawsonamf.com/lexchat/',
      'https://www.dawsonamf.com/privacy/',
      ...published.map((id) => `https://www.dawsonamf.com/blog/${id}/`),
    ]);
    assert.deepEqual(new Set(entries.keys()), expected);

    const dates = postDates(sources);
    for (const id of published) {
      assert.equal(
        entries.get(`https://www.dawsonamf.com/blog/${id}/`),
        `${dates[id]}T00:00:00.000Z`,
        id,
      );
    }
    for (const forbidden of ['brutalist', 'gemma4-heretic-ara', 'autoencoders-1', 'autoencoders-2', '404']) {
      assert.equal([...entries.keys()].some((url) => url.includes(forbidden)), false, forbidden);
    }
  });

  it('keeps every published body link depth-independent and every local asset emitted', () => {
    assert.equal(published.length, 8);
    for (const id of published) {
      const html = readFileSync(join(dist, 'blog', id, 'index.html'), 'utf8');
      const body = /<div class="blog-post-content" id="post-content">([\s\S]*?)<\/div>\s*<\/article>/.exec(html)?.[1];
      assert.ok(body, `${id}: rendered body`);
      for (const match of body.matchAll(/\b(?:href|src)="([^"]+)"/g)) {
        const url = match[1];
        assert.ok(
          url.startsWith('/') || url.startsWith('#') || /^[a-z][a-z0-9+.-]*:/i.test(url),
          `${id}: depth-dependent body URL ${JSON.stringify(url)}`,
        );
      }
      for (const url of localReferences(html)) {
        const pathname = new URL(url, 'https://www.dawsonamf.com').pathname;
        if (pathname.endsWith('/') || pathname === '/404.html') continue;
        assert.ok(existsSync(join(dist, pathname)), `${id}: missing emitted resource ${pathname}`);
      }
    }
  });

  it('does not emit raw sources, a draft route, or archived external bodies', () => {
    for (const id of ['gemma4-heretic-ara', 'autoencoders-1', 'autoencoders-2']) {
      const route = join(dist, 'blog', id, 'index.html');
      if (id === 'gemma4-heretic-ara') assert.equal(existsSync(route), false);
      else {
        const stub = readFileSync(route, 'utf8');
        assert.equal(stub.includes('blog-post-content'), false, `${id}: redirect has no archived body`);
      }
    }
    assert.equal(existsSync(join(dist, 'src')), false);
    assert.equal(existsSync(join(dist, 'blog', 'posts', 'gemma4-heretic-ara.md')), false);
    assert.equal(readFileSync(join(dist, 'sitemap-0.xml'), 'utf8').includes('color-randomizer'), false);
  });

  it('uses only root-absolute local data destinations in the two corrected chart modules', () => {
    for (const file of ['cohorts-chart.js', 'job-market-chart.js']) {
      const js = readFileSync(join(repoRoot, 'public', 'blog', 'posts', 'assets', file), 'utf8');
      assert.equal(/['"]posts\/assets\//.test(js), false, file);
    }
    const cohorts = readFileSync(join(repoRoot, 'public/blog/posts/assets/cohorts-chart.js'), 'utf8');
    const jobs = readFileSync(join(repoRoot, 'public/blog/posts/assets/job-market-chart.js'), 'utf8');
    for (const name of ['cohort-unemployment-data.json', 'cohort-swe-age-data.json', 'rate-data.json']) {
      assert.ok(cohorts.includes(`/blog/posts/assets/${name}`), name);
    }
    assert.ok(jobs.includes("const RATE_URL = '/blog/posts/assets/rate-data.json';"));
  });
});
