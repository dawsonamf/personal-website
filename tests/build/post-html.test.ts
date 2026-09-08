// S1-19: production post pages at the raw emitted-HTML boundary.
//
// The source records, legacy DOM, and pinned resource lists are read independently of the
// route/layout implementation. One isolated production build supplies every assertion.
//
// Run: node --test --test-concurrency=1 tests/build/post-html.test.ts

import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { after, before, describe, it } from 'node:test';

import { load as loadYaml } from 'js-yaml';

import { projectPostLinks, serializeJsonLd } from '../../src/posts/render.ts';
import { THEME_IDS } from '../../src/themes/registry.ts';
import { buildSite, cleanup } from '../fixtures/composition/build.ts';

const repoRoot = resolve(import.meta.dirname, '..', '..');
const PUBLISHED_IDS = [
  'fly-on-my-laptop',
  'underviewed-art',
  'arena-freshness',
  'helm',
  'toolbelt',
  'embedded-swift-agent',
  'metr-doubling',
  'college-projects',
] as const;
const NON_LOCAL_IDS = ['gemma4-heretic-ara', 'autoencoders-1', 'autoencoders-2'] as const;
const MERMAID = 'https://cdn.jsdelivr.net/npm/mermaid@11.15.0/dist/mermaid.min.js';
const TILT = '/vendor/vanilla-tilt/vanilla-tilt.min.js';
const NAV = '/js/nav-behavior.js';
const CURSOR = '/js/cursor-follow.js';
const CLIENT = '/js/blog-post-client.js';
const CYCLER = '/js/theme-cycler.js';

type SourceMeta = {
  publication: 'published' | 'external' | 'draft';
  title?: { s?: string | null };
  date?: string;
  description?: { l?: string | null };
  tags?: string[] | null;
  scripts?: string[];
  styles?: string[];
};

function source(id: string): { meta: SourceMeta; body: string } {
  const text = readFileSync(join(repoRoot, 'src', 'content', 'posts', `${id}.md`), 'utf8');
  const match = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/.exec(text);
  assert.ok(match, `${id}: source frontmatter`);
  return { meta: loadYaml(match[1], { filename: `${id}.md` }) as SourceMeta, body: match[2] };
}

const sources = new Map<string, { meta: SourceMeta; body: string }>(
  [...PUBLISHED_IDS, ...NON_LOCAL_IDS].map((id) => [id, source(id)]),
);

function decode(text: string): string {
  return text
    .replaceAll('&amp;', '&')
    .replaceAll('&quot;', '"')
    .replaceAll('&#39;', "'")
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>');
}

const count = (text: string, needle: string) => text.split(needle).length - 1;

function ordered(text: string, needles: readonly string[], label: string): void {
  let cursor = -1;
  for (const needle of needles) {
    const next = text.indexOf(needle, cursor + 1);
    assert.notEqual(next, -1, `${label}: no ${JSON.stringify(needle)}`);
    assert.ok(next > cursor, `${label}: ${JSON.stringify(needle)} is out of order`);
    cursor = next;
  }
}

function sourceTags(html: string): Array<{ src: string; tag: string }> {
  return [...html.matchAll(/<script\b[^>]*\bsrc="([^"]+)"[^>]*><\/script>/g)]
    .map((match) => ({ src: match[1], tag: match[0] }));
}

function metaContent(html: string, attribute: string, value: string): string | undefined {
  const tag = [...html.matchAll(/<meta\b[^>]*>/g)].find((candidate) =>
    candidate[0].includes(`${attribute}="${value}"`),
  )?.[0];
  return tag ? decode(/\bcontent="([^"]*)"/.exec(tag)?.[1] ?? '') : undefined;
}

function postContent(html: string): string {
  const match = /<div class="blog-post-content" id="post-content">([\s\S]*)<\/div>\s*<\/article>/.exec(html);
  assert.ok(match, 'post content boundary');
  return match[1];
}

function expectedScripts(id: string): string[] {
  const meta = sources.get(id)!.meta;
  return [
    ...(id === 'toolbelt' ? [MERMAID] : []),
    TILT,
    NAV,
    CURSOR,
    ...(meta.scripts ?? []),
    CLIENT,
    CYCLER,
  ];
}

function filesUnder(root: string): string[] {
  const files: string[] = [];
  const walk = (dir: string) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const path = join(dir, entry.name);
      if (entry.isDirectory()) walk(path);
      else files.push(relative(root, path));
    }
  };
  walk(root);
  return files.sort();
}

describe('S1-19 production post raw HTML', () => {
  let dir: string | undefined;
  let dist = '';
  let renderCalls = '';
  const posts = new Map<string, string>();

  before(() => {
    const built = buildSite('s1-19-posts-', (root) => {
      const countFile = join(root, 'post-render-calls.txt');
      const wrapper = join(root, 'src', 'posts', 'render-counting.ts');
      writeFileSync(wrapper, [
        "import { appendFileSync } from 'node:fs';",
        "import type { PostSource } from '../build/posts.ts';",
        "import { bindPostForLayout, renderPostBody as render, projectPostLinks } from './render.ts';",
        "export { bindPostForLayout, projectPostLinks };",
        `const countFile = ${JSON.stringify(countFile)};`,
        "export function renderPostBody(post: PostSource) { appendFileSync(countFile, post.id + '\\n'); return render(post); }",
      ].join('\n'));
      const route = join(root, 'src', 'pages', '[...theme]', 'blog', '[id].astro');
      writeFileSync(route, readFileSync(route, 'utf8').replace(
        "../../../posts/render.ts",
        "../../../posts/render-counting.ts",
      ));
    });
    dir = built.dir;
    dist = built.dist;
    renderCalls = readFileSync(join(built.dir, 'post-render-calls.txt'), 'utf8');
    for (const theme of THEME_IDS) {
      for (const id of PUBLISHED_IDS) {
        const rel = theme === 'default' ? join('blog', id, 'index.html') : join(theme, 'blog', id, 'index.html');
        posts.set(`${theme}:${id}`, readFileSync(join(dist, rel), 'utf8'));
      }
    }
  });

  after(() => cleanup(dir));

  it('emits exactly eight local posts across all sixteen themes', () => {
    const html = filesUnder(dist).filter((path) => path.endsWith('.html'));
    const preservedExtras = [
      join('12years', 'index.html'),
      join('embedded-swift-agent', 'index.html'),
      join('subsites', 'dawson', 'embedded-swift-agent', 'index.html'),
      join('subsites', 'elise', '12years', 'index.html'),
    ];
    const routeHtml = html.filter((path) => !preservedExtras.includes(path));
    const postFiles = routeHtml.filter((path) => /(?:^|\/)blog\/[^/]+\/index\.html$/.test(path));

    assert.equal(routeHtml.length, 193, '192 page routes plus 404.html');
    assert.deepEqual(html.filter((path) => !routeHtml.includes(path)), preservedExtras);
    assert.equal(postFiles.length, 128, 'eight local posts times sixteen themes');
    for (const theme of THEME_IDS) {
      for (const id of PUBLISHED_IDS) {
        const rel = theme === 'default' ? join('blog', id, 'index.html') : join(theme, 'blog', id, 'index.html');
        assert.ok(existsSync(join(dist, rel)), rel);
      }
    }
  });

  it('does not publish draft, external, or raw source bodies', () => {
    for (const id of NON_LOCAL_IDS) {
      assert.ok(!existsSync(join(dist, 'blog', id, 'index.html')), `${id}: no route`);
    }
    assert.equal(
      filesUnder(dist).filter((path) => path.startsWith(`blog${process.platform === 'win32' ? '\\' : '/'}`) && path.endsWith('.md')).length,
      0,
      'no raw post Markdown',
    );
    const emitted = decode([...posts.values()].join('\n'));
    assert.ok(!emitted.includes('In modern machine learning, autoencoders, encoders, and decoders appear everywhere.'));
    assert.ok(!emitted.includes('This is part two of a two part series on autoencoders.'));
    assert.ok(!emitted.includes("Today's language models are heavily censored."));
  });

  it('renders each selected body once before the theme cross product', () => {
    const calls = renderCalls.trim().split('\n');
    assert.equal(calls.length, PUBLISHED_IDS.length);
    assert.deepEqual([...calls].sort(), [...PUBLISHED_IDS].sort());
    assert.equal(new Set(calls).size, PUBLISHED_IDS.length);
  });

  it('keeps the canonical post DOM and source-owned metadata on every theme', () => {
    for (const theme of THEME_IDS) {
      for (const id of PUBLISHED_IDS) {
        const html = posts.get(`${theme}:${id}`)!;
        const meta = sources.get(id)!.meta;
        const title = meta.title!.s!;
        const description = meta.description!.l!;
        const canonical = `https://www.dawsonamf.com/blog/${id}/`;
        const pageTitle = `${title} | Dawson Metzger-Fleetwood`;
        const iso = `${meta.date!.slice(-4)}-${String([
          'January', 'February', 'March', 'April', 'May', 'June',
          'July', 'August', 'September', 'October', 'November', 'December',
        ].indexOf(meta.date!.split(' ')[0]) + 1).padStart(2, '0')}-01`;

        assert.equal(count(html, 'id="main-body" class="blog-post-page"'), 1, `${theme}:${id}: main`);
        assert.equal(count(html, 'class="blog-post-container"'), 1, `${theme}:${id}: article`);
        assert.equal(count(html, 'class="blog-post-header"'), 1, `${theme}:${id}: header`);
        assert.equal(count(html, 'class="blog-post-title" id="post-title"'), 1, `${theme}:${id}: title`);
        assert.equal(count(html, 'class="blog-post-content" id="post-content"'), 1, `${theme}:${id}: content`);
        assert.equal(count(html, 'id="read-time" data-read-time="{n} min read"'), 1, `${theme}:${id}: read time`);
        assert.ok(html.includes('<footer class="footer-container blog-footer">'), `${theme}:${id}: footer`);
        assert.equal(decode(/<title>([\s\S]*?)<\/title>/.exec(html)![1]), pageTitle, `${theme}:${id}: title tag`);
        assert.equal(decode(/<h1[^>]*>([\s\S]*?)<\/h1>/.exec(html)![1]), title, `${theme}:${id}: h1`);
        assert.equal(metaContent(html, 'name', 'description'), description, `${theme}:${id}: description`);
        assert.equal(decode(/<link rel="canonical" href="([^"]+)">/.exec(html)![1]), canonical, `${theme}:${id}: canonical`);
        assert.equal(metaContent(html, 'property', 'og:type'), undefined, `${theme}:${id}: no unrequested og:type`);
        assert.equal(metaContent(html, 'property', 'og:title'), title, `${theme}:${id}: og:title`);
        assert.equal(metaContent(html, 'property', 'og:description'), description, `${theme}:${id}: og:description`);
        assert.equal(metaContent(html, 'property', 'og:url'), canonical, `${theme}:${id}: og:url`);
        assert.equal(metaContent(html, 'property', 'og:image'), 'https://www.dawsonamf.com/resources/og-avatar.jpg', `${theme}:${id}: og:image`);
        assert.equal(metaContent(html, 'name', 'twitter:card'), 'summary', `${theme}:${id}: twitter`);
        assert.equal(html.includes('<meta name="robots" content="noindex">'), theme !== 'default', `${theme}:${id}: noindex`);

        const json = /<script type="application\/ld\+json">([\s\S]*?)<\/script>/.exec(html);
        assert.ok(json, `${theme}:${id}: JSON-LD`);
        assert.deepEqual(JSON.parse(json[1]), {
          '@context': 'https://schema.org',
          '@type': 'BlogPosting',
          headline: title,
          url: canonical,
          mainEntityOfPage: { '@type': 'WebPage', '@id': canonical },
          author: { '@type': 'Person', name: 'Dawson Metzger-Fleetwood', url: 'https://www.dawsonamf.com/' },
          publisher: { '@type': 'Person', name: 'Dawson Metzger-Fleetwood', url: 'https://www.dawsonamf.com/' },
          datePublished: iso,
          dateModified: iso,
          description,
          keywords: meta.tags!.join(', '),
        }, `${theme}:${id}: JSON-LD object`);
      }
    }
  });

  it('preserves canonical styles, scripts, conditional Mermaid, and post asset order', () => {
    for (const theme of THEME_IDS) {
      for (const id of PUBLISHED_IDS) {
        const html = posts.get(`${theme}:${id}`)!;
        const head = /<head>([\s\S]*?)<\/head>/.exec(html)![1];
        const tags = sourceTags(html);
        assert.deepEqual(tags.map(({ src }) => src), expectedScripts(id), `${theme}:${id}: scripts`);
        tags.forEach(({ src, tag }) => {
          const deferred = src === NAV || src === CURSOR || src === CYCLER;
          assert.equal(/\bdefer(?:\s|>|=)/.test(tag), deferred, `${theme}:${id}: defer ${src}`);
        });
        ordered(head, [
          '/vendor/fontawesome-free/css/all.min.css',
          '/vendor/boxicons/css/boxicons.min.css',
          '/css/styles.css',
          '/css/mobile-styles.css',
          '/blog/blog-styles.css',
          '/css/theme-cycler.css',
          '<!--theme-assets-->',
          '/vendor/highlight.js/github-dark.min.css',
          ...(sources.get(id)!.meta.styles ?? []),
          ...(id === 'toolbelt' ? [MERMAID] : []),
          TILT,
          NAV,
          CURSOR,
        ], `${theme}:${id}: head order`);
        assert.equal(count(html, MERMAID), id === 'toolbelt' ? 1 : 0, `${theme}:${id}: Mermaid download`);
        assert.equal(count(html, 'mermaid.initialize('), id === 'toolbelt' ? 1 : 0, `${theme}:${id}: Mermaid init`);
        if (id === 'toolbelt') assert.match(head, /mermaid\.initialize\([\s\S]*<\/script>$/, `${theme}: Mermaid initializer is final`);
        assert.ok(!html.includes('highlight.min.js'), `${theme}:${id}: no highlight runtime`);
        assert.ok(!html.includes('marked.umd'), `${theme}:${id}: no marked runtime`);
        for (const banned of ['/js/anim-utils.js', '/vendor/aos/aos.js', 'calendly.com']) {
          assert.ok(!html.includes(banned), `${theme}:${id}: no ${banned}`);
        }
        assert.ok(!html.includes('--ticker-run:'), `${theme}:${id}: no carousel ticker run`);
        assert.ok(!html.includes('--ticker-dur:'), `${theme}:${id}: no carousel ticker duration`);
      }
    }
  });

  it('preserves raw HTML, common highlighted output, body bytes, and source links', () => {
    const toolbelt = postContent(posts.get('default:toolbelt')!);
    assert.equal(count(toolbelt, '<div class="mermaid">'), 2, 'Toolbelt diagrams');
    assert.equal(count(toolbelt, '<pre class="has-copy-btn">'), 2, 'Toolbelt highlighted fences');
    assert.equal(count(toolbelt, 'class="code-copy-btn" aria-label="Copy code"'), 2, 'Toolbelt copy markup');
    assert.ok(toolbelt.includes('class="hljs language-bash"'), 'Toolbelt bash fence');
    assert.ok(toolbelt.includes('class="hljs language-json"'), 'Toolbelt JSON fence');

    const embedded = postContent(posts.get('default:embedded-swift-agent')!);
    assert.equal(count(embedded, 'class="hljs language-c"'), 1, 'Embedded Swift C fence');
    assert.equal(count(embedded, 'class="hljs language-swift"'), 9, 'Embedded Swift Swift fences');
    assert.equal(count(embedded, 'class="blog-image"'), 1, 'Embedded Swift image');
    assert.ok(embedded.includes('href="/subsites/dawson/embedded-swift-agent/"'), 'Embedded Swift subsite link');

    assert.ok(postContent(posts.get('default:metr-doubling')!).includes('<div id="metr-chart"></div>'), 'METR raw chart mount');
    assert.ok(postContent(posts.get('default:underviewed-art')!).includes('<div id="underviewed-art">Loading the gallery&hellip;</div>'), 'Underviewed raw HTML');
    assert.ok(postContent(posts.get('default:arena-freshness')!).includes('href="/resources/arena-freshness.user.js"'), 'Arena source link');
    assert.ok(postContent(posts.get('default:college-projects')!).includes('href="/resources/SnapCut.pdf"'), 'College source link');

    for (const id of PUBLISHED_IDS) {
      const canonical = postContent(posts.get(`default:${id}`)!);
      for (const theme of THEME_IDS) {
        assert.equal(postContent(posts.get(`${theme}:${id}`)!), canonical, `${theme}:${id}: body bytes`);
      }
    }
  });

  it('projects eligible anchor hrefs without changing any other rendered byte', () => {
    const canonical = '<p>A <a href="/blog/" data-href="/privacy/" class="text-link" title="x">blog</a>, <a data-href="/privacy/" href=\'/blog/toolbelt/\'>tool</a>, <a href = /blog/ >bare</a>, and <a href="/resources/a.png" class="text-link">asset</a>.</p>\n';
    assert.equal(
      projectPostLinks(canonical, 'brutalist'),
      '<p>A <a href="/brutalist/blog/" data-href="/privacy/" class="text-link" title="x">blog</a>, <a data-href="/privacy/" href=\'/brutalist/blog/toolbelt/\'>tool</a>, <a href = /brutalist/blog/ >bare</a>, and <a href="/resources/a.png" class="text-link">asset</a>.</p>\n',
    );
    assert.equal(projectPostLinks(canonical, 'default'), canonical);
    assert.equal(projectPostLinks('<area href="/blog/"><p data-href="/blog/">x</p>', 'brutalist'), '<area href="/blog/"><p data-href="/blog/">x</p>');
  });

  it('binds source-namespaced post prose before a dynamically selected layout renders', () => {
    let probeDir: string | undefined;
    try {
      const built = buildSite('s1-19-post-layout-prose-', (root) => {
        const registry = join(root, 'src', 'themes', 'registry.ts');
        const original = readFileSync(registry, 'utf8');
        const changed = original.replace(
          "    kind: 'skin',\n    id: 'brutalist',",
          "    kind: 'structural',\n    id: 'brutalist',\n    layouts: { post: () => import('../layouts/PostProseProbe.astro') },",
        );
        const structural = changed
          .replace("    flags: { tilt: false, still: true },\n", '')
          .replace("    css: '/css/themes/brutalist.css',\n", '');
        assert.notEqual(changed, original, 'structural post-layout mutation applied');
        writeFileSync(registry, structural);
        writeFileSync(join(root, 'src', 'layouts', 'PostProseProbe.astro'), [
          '---',
          "import Shell from './Shell.astro';",
          "import ThemeAssets from './ThemeAssets.astro';",
          'const { theme, page, composition, post } = Astro.props;',
          "const title = post.prose.text('title', 's');",
          '---',
          '<Shell theme={theme} page={page} composition={composition}>',
          '  <Fragment slot="head"><ThemeAssets theme={theme} composition={composition} /></Fragment>',
          '  <p id="post-prose-probe">{title}</p>',
          '</Shell>',
          '',
        ].join('\n'));
      });
      probeDir = built.dir;
      const html = readFileSync(join(built.dist, 'brutalist', 'blog', 'toolbelt', 'index.html'), 'utf8');
      assert.match(html, /<p id="post-prose-probe">Toolbelt: Giving AI Clients a Way Into Your Environment<\/p>/);
    } finally {
      cleanup(probeDir);
    }
  });

  it('serializes hostile metadata without terminating JSON-LD and preserves decoded values', () => {
    const value = { headline: 'AI & ML: Dawson\'s "test" </script><&', optional: undefined };
    const serialized = serializeJsonLd(value);
    assert.ok(!serialized.includes('</script>'));
    assert.ok(serialized.includes('\\u003c/script>\\u003c&'));
    assert.deepEqual(JSON.parse(serialized), { headline: value.headline });
  });

  it('omits post elements and JSON-LD fields for explicit-null sized metadata', () => {
    let nullDir: string | undefined;
    try {
      const built = buildSite('s1-19-null-metadata-', (root) => {
        const file = join(root, 'src', 'content', 'posts', 'fly-on-my-laptop.md');
        const text = readFileSync(file, 'utf8')
          .replace(/^title: \{ s: .* \}$/m, 'title: { s: null }')
          .replace(/^description: \{ l: .* \}$/m, 'description: { l: null }');
        writeFileSync(file, text);
      });
      nullDir = built.dir;
      const html = readFileSync(join(built.dist, 'blog', 'fly-on-my-laptop', 'index.html'), 'utf8');
      assert.ok(!html.includes('id="post-title"'), 'null title omits h1');
      assert.equal(metaContent(html, 'name', 'description'), undefined, 'null description omits meta description');
      assert.equal(metaContent(html, 'property', 'og:title'), undefined, 'null title omits og:title');
      assert.equal(metaContent(html, 'property', 'og:description'), undefined, 'null description omits og:description');
      const json = JSON.parse(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/.exec(html)![1]);
      assert.ok(!Object.hasOwn(json, 'headline'), 'null title omits JSON-LD headline');
      assert.ok(!Object.hasOwn(json, 'description'), 'null description omits JSON-LD description');
      assert.equal(json.datePublished, '2026-08-01', 'other metadata remains');
    } finally {
      cleanup(nullDir);
    }
  });
});
