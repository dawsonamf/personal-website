// S1-05: build-time Markdown rendering (D6, D16, D35, §7.2).
//
// The legacy parity block is the load-bearing part: the renderer overrides in
// blog/blog-post.js are extracted from the live file and evaluated in a vm realm against
// the same marked/highlight.js versions the CDN pins (18.0.5 / 11.9.0), then every post in
// blog/posts/ is rendered both ways and compared. It never skips: a missing legacy file is
// a hard failure.
//
// Run: node --test tests/unit/markdown.test.ts

import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { describe, it } from 'node:test';
import { runInNewContext } from 'node:vm';

import hljs from 'highlight.js/lib/common';
import { Marked } from 'marked';

import { oldDir } from '../../harness/baseline.ts';
import { renderMarkdown, renderParagraphs } from '../../src/prose/markdown.ts';

const repoRoot = resolve(import.meta.dirname, '..', '..');
const oldRoot = oldDir();
const legacyFile = resolve(oldRoot, 'blog/blog-post.js');
const postsDir = resolve(oldRoot, 'blog/posts');

const inline = (md: string) => renderMarkdown(md, { inline: true });

// The exact markup addCopyButtons builds today (blog-post.js:95-101,110).
const button = (label: string) =>
  `<button type="button" class="code-copy-btn" aria-label="${label}">` +
  '<i class="code-copy-icon code-copy-icon-copy fa-regular fa-copy" aria-hidden="true"></i>' +
  '<i class="code-copy-icon code-copy-icon-check fa-solid fa-check" aria-hidden="true"></i>' +
  '</button>';

describe('links (D16)', () => {
  it('emits attributes in the legacy order for every href class', () => {
    assert.equal(
      inline('[x](https://a.com)'),
      '<a href="https://a.com" class="text-link" target="_blank" rel="noopener noreferrer">x</a>',
    );
    assert.equal(
      inline('[x](http://a.com)'),
      '<a href="http://a.com" class="text-link" target="_blank" rel="noopener noreferrer">x</a>',
    );
    assert.equal(
      inline('[x](mailto:me@example.com)'),
      '<a href="mailto:me@example.com" class="text-link" target="_blank" rel="noopener noreferrer">x</a>',
    );
    assert.equal(inline('[x](#calendly)'), '<a href="#" class="text-link calendly-link">x</a>');
    assert.equal(inline('[x](/blog/x/)'), '<a href="/blog/x/" class="text-link">x</a>');
    assert.equal(inline('[x](#anchor)'), '<a href="#anchor" class="text-link">x</a>');
  });

  it('puts title last', () => {
    assert.equal(
      inline('[x](https://a.com "T")'),
      '<a href="https://a.com" class="text-link" target="_blank" rel="noopener noreferrer" title="T">x</a>',
    );
    assert.equal(inline('[x](/b/ "T")'), '<a href="/b/" class="text-link" title="T">x</a>');
    assert.equal(inline('[x](#calendly "T")'), '<a href="#" class="text-link calendly-link" title="T">x</a>');
  });

  it('renders the label through the inline parser', () => {
    assert.equal(inline('[**x**](/b/)'), '<a href="/b/" class="text-link"><strong>x</strong></a>');
  });
});

describe('images', () => {
  it('emits src, alt, class and an optional title', () => {
    assert.equal(inline('![alt](/i.png)'), '<img src="/i.png" alt="alt" class="blog-image">');
    assert.equal(inline('![b](/j.png "T")'), '<img src="/j.png" alt="b" class="blog-image" title="T">');
  });
});

describe('code', () => {
  it('highlights a registered language', () => {
    const html = renderMarkdown('```js\nconst a = 1;\n```');
    assert.match(html, /^<pre><code class="hljs language-js">/);
    assert.match(html, /<span class="hljs-keyword">const<\/span>/);
    assert.match(html, /<\/code><\/pre>$/);
  });

  it('falls back to highlightAuto for an unknown language', () => {
    const html = renderMarkdown('```nope\nlet a = 1;\n```');
    assert.match(html, /^<pre><code class="hljs">/);
    assert.equal(hljs.getLanguage('nope'), undefined);
  });

  it('passes mermaid through raw', () => {
    assert.equal(
      renderMarkdown('```mermaid\ngraph TD;\nA-->B;\n```'),
      '<div class="mermaid">graph TD;\nA-->B;</div>',
    );
  });
});

describe('highlight.js bundle pin', () => {
  // highlight.js/lib/common, not the full build: if this count moves, the shipped language
  // set moved with it and highlightAuto's guesses change.
  it('imports the common bundle and its 36 languages', () => {
    assert.equal(hljs.listLanguages().length, 36);
  });
});

describe('copy buttons (D35)', () => {
  const label = 'Copy "code" & go';
  const escaped = 'Copy &quot;code&quot; &amp; go';

  it('emits the button on both code branches, with the label attribute-escaped', () => {
    const known = renderMarkdown('```js\nconst a = 1;\n```', { copyLabel: label });
    assert.match(known, /^<pre class="has-copy-btn"><code class="hljs language-js">/);
    assert.ok(known.endsWith(`</code>${button(escaped)}</pre>`), known);

    const unknown = renderMarkdown('```nope\nlet a = 1;\n```', { copyLabel: label });
    assert.match(unknown, /^<pre class="has-copy-btn"><code class="hljs">/);
    assert.ok(unknown.endsWith(`</code>${button(escaped)}</pre>`), unknown);
  });

  it('never touches mermaid', () => {
    assert.equal(
      renderMarkdown('```mermaid\ngraph TD;\n```', { copyLabel: label }),
      '<div class="mermaid">graph TD;</div>',
    );
  });

  it('emits neither class nor button without a label', () => {
    const html = renderMarkdown('```js\nconst a = 1;\n```');
    assert.ok(!html.includes('has-copy-btn'), html);
    assert.ok(!html.includes('code-copy-btn'), html);
  });

  it('treats an empty label as omitted prose, not as an empty aria-label', () => {
    const code = '```js\nconst a = 1;\n```';
    assert.equal(renderMarkdown(code, { copyLabel: '' }), renderMarkdown(code));
  });

  it('does not leak the label into the next render', () => {
    renderMarkdown('```js\nconst a = 1;\n```', { copyLabel: label });
    assert.ok(!renderMarkdown('```js\nconst a = 1;\n```').includes('code-copy-btn'));
  });
});

describe('marked options', () => {
  it('keeps breaks off', () => {
    assert.equal(renderMarkdown('a\nb'), '<p>a\nb</p>\n');
  });

  it('keeps gfm on', () => {
    assert.equal(inline('~~x~~'), '<del>x</del>');
  });

  it('passes raw HTML through', () => {
    assert.equal(renderMarkdown('<div class="x">hi <em>there</em></div>'), '<div class="x">hi <em>there</em></div>');
  });

  it('emits no <p> in inline mode', () => {
    assert.equal(inline('just text'), 'just text');
  });
});

describe('renderParagraphs', () => {
  it('returns one wrapper-free fragment per paragraph and renders other blocks whole', () => {
    assert.deepStrictEqual(renderParagraphs('One **a**.\n\n- x\n- y\n\nTwo.'), [
      'One <strong>a</strong>.',
      '<ul>\n<li>x</li>\n<li>y</li>\n</ul>',
      'Two.',
    ]);
    assert.deepStrictEqual(renderParagraphs('# Title\n\nText.'), ['<h1>Title</h1>', 'Text.']);
  });

  it('resolves reference links and emits no fragment for the definition table', () => {
    assert.deepStrictEqual(renderParagraphs('See [x][r] here.\n\n[r]: https://a.com\n\nSecond.'), [
      'See <a href="https://a.com" class="text-link" target="_blank" rel="noopener noreferrer">x</a> here.',
      'Second.',
    ]);
  });

  it('returns nothing for empty source', () => {
    assert.deepStrictEqual(renderParagraphs(''), []);
  });

  it('matches the inner HTML of the <p> renderMarkdown emits for the same source', () => {
    const source = 'A [link](/b/) and **bold**.\n\nSecond *para*.';
    const inner = [...renderMarkdown(source).matchAll(/<p>([\s\S]*?)<\/p>/g)].map((m) => m[1]);
    assert.deepStrictEqual(renderParagraphs(source), inner);
  });
});

// ---- Legacy parity ----------------------------------------------------------

describe('legacy parity with blog/blog-post.js', () => {
  assert.ok(
    existsSync(legacyFile),
    `${legacyFile} is missing; set PARITY_OLD_DIR to the baseline checkout instead of skipping this check`,
  );

  // Extract the `marked.use({ … });` block verbatim and run it against a fresh Marked
  // instance in a vm realm. Same package versions on both sides, so any difference is ours.
  const legacySource = readFileSync(legacyFile, 'utf8');
  const start = legacySource.indexOf('marked.use({');
  const close = '\n  });';
  const end = legacySource.indexOf(close, start);
  assert.ok(start !== -1 && end !== -1, 'could not find the legacy marked.use block');
  const block = legacySource.slice(start, end + close.length);

  const legacy = new Marked();
  runInNewContext(block, { marked: legacy, hljs }, { filename: legacyFile });
  const legacyParse = (md: string) => legacy.parse(md) as string;

  // D16 is the one intended difference: mailto anchors gain target/rel, and #calendly
  // becomes the Calendly trigger. Nothing else may differ.
  const applyD16 = (html: string) =>
    html
      .replace(
        /<a href="(mailto:[^"]*)" class="text-link"/g,
        '<a href="$1" class="text-link" target="_blank" rel="noopener noreferrer"',
      )
      .replace(/<a href="#calendly" class="text-link"/g, '<a href="#" class="text-link calendly-link"');

  const withButtons = (html: string, label: string) =>
    html
      .replaceAll('<pre>', '<pre class="has-copy-btn">')
      .replaceAll('</code></pre>', `</code>${button(label)}</pre>`);

  it('extracted the three renderer overrides', () => {
    for (const marker of ['link(', 'image(', 'code(', 'mermaid', 'highlightAuto', 'gfm: true', 'breaks: false']) {
      assert.ok(block.includes(marker), marker);
    }
  });

  it('reproduces D16 exactly on top of legacy output', () => {
    const md = '[a](mailto:x@y.z) and [b](#calendly)';
    assert.equal(renderMarkdown(md), applyD16(legacyParse(md)));
  });

  assert.ok(
    existsSync(postsDir),
    `${postsDir} is missing; set PARITY_OLD_DIR to the baseline checkout instead of skipping this check`,
  );

  const posts = readdirSync(postsDir)
    .filter((name) => name.endsWith('.md'))
    .sort();
  assert.ok(posts.length > 0, `no posts found in ${postsDir}`);

  // The frontmatter regex is blog-post.js:32's, verbatim.
  const bodyOf = (name: string) => {
    const raw = readFileSync(join(postsDir, name), 'utf8');
    const match = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
    return match ? (match[2] as string) : raw;
  };

  for (const name of posts) {
    it(`renders ${name} exactly as the legacy renderer does`, () => {
      const body = bodyOf(name);
      const expected = applyD16(legacyParse(body));
      assert.equal(renderMarkdown(body), expected);
      assert.equal(renderMarkdown(body, { copyLabel: 'Copy code' }), withButtons(expected, 'Copy code'));
    });
  }

  it('covers the highlighted and mermaid branches somewhere in the corpus', () => {
    const bodies = posts.map(bodyOf);
    assert.ok(
      bodies.some((body) => renderMarkdown(body).includes('<code class="hljs language-')),
      'no post exercises a highlighted code block',
    );
    assert.ok(
      bodies.some((body) => renderMarkdown(body).includes('<div class="mermaid">')),
      'no post exercises a mermaid block',
    );
  });
});
