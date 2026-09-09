// Build-time Markdown rendering for prose fields and post bodies (D6, §7.2): marked
// 18.0.5 with `gfm: true, breaks: false` and the three renderer overrides copied from
// blog/blog-post.js:4-30, plus D16's Calendly/mailto link rules and D35's build-emitted
// copy buttons.
//
// Pure and erasable: this module is reached from the externalized src/prose/index.ts,
// so plain Node loads it. No astro:*, no virtual imports, no DOM, no filesystem.
import { Marked } from 'marked';
import type { RendererObject, Token, Tokens } from 'marked';
import hljs from 'highlight.js/lib/common';

const marked = new Marked();

const escapeAttr = (value: string) =>
  value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// marked's renderer has no per-call options channel, so the copy label for the current
// render lives here. parse/parseInline are synchronous (async is off), so setting this
// immediately before the call and clearing it in `finally` is safe.
let copyLabel: string | undefined;

// Exactly the markup blog-post.js:95-101,110 injects today (type, class, aria-label,
// then the two icons), now emitted at build time (D35).
const copyButton = (label: string) =>
  `<button type="button" class="code-copy-btn" aria-label="${escapeAttr(label)}">` +
  '<i class="code-copy-icon code-copy-icon-copy fa-regular fa-copy" aria-hidden="true"></i>' +
  '<i class="code-copy-icon code-copy-icon-check fa-solid fa-check" aria-hidden="true"></i>' +
  '</button>';

// Truthiness, not `!== undefined`: an empty label is omitted prose (§4.1), so no button.
const pre = (code: string) =>
  copyLabel
    ? `<pre class="has-copy-btn">${code}${copyButton(copyLabel)}</pre>`
    : `<pre>${code}</pre>`;

const renderer: RendererObject = {
  // href and title are interpolated raw, exactly as blog-post.js does today: parity, and
  // every link comes from repo-owned prose or post sources.
  link({ href, title, tokens }: Tokens.Link) {
    const text = this.parser.parseInline(tokens);
    const titleAttr = title ? ` title="${title}"` : '';
    if (href === '#calendly') {
      return `<a href="#" class="text-link calendly-link"${titleAttr}>${text}</a>`;
    }
    if (href && (href.startsWith('http://') || href.startsWith('https://') || href.startsWith('mailto:'))) {
      return `<a href="${href}" class="text-link" target="_blank" rel="noopener noreferrer"${titleAttr}>${text}</a>`;
    }
    return `<a href="${href}" class="text-link"${titleAttr}>${text}</a>`;
  },
  image({ href, title, text }: Tokens.Image) {
    const titleAttr = title ? ` title="${title}"` : '';
    return `<img src="${href}" alt="${text}" class="blog-image"${titleAttr}>`;
  },
  code({ text, lang }: Tokens.Code) {
    // mermaid source is emitted raw for the client library, as today, and never gets a
    // copy button.
    if (lang === 'mermaid') {
      return `<div class="mermaid">${text}</div>`;
    }
    if (lang && hljs.getLanguage(lang)) {
      return pre(`<code class="hljs language-${lang}">${hljs.highlight(text, { language: lang }).value}</code>`);
    }
    return pre(`<code class="hljs">${hljs.highlightAuto(text).value}</code>`);
  },
};

marked.use({ gfm: true, breaks: false, renderer });

export function renderMarkdown(source: string, options?: { inline?: boolean; copyLabel?: string }): string {
  copyLabel = options?.copyLabel;
  try {
    return (options?.inline ? marked.parseInline(source) : marked.parse(source)) as string;
  } finally {
    copyLabel = undefined;
  }
}

/** One rendered fragment per source paragraph, with no `<p>` wrapper (D15). */
// Lex once so the lexer's second pass resolves the document's reference links into each
// paragraph's inline tokens; re-lexing a paragraph's raw text loses the `def` table. Never
// sets copyLabel: renderMarkdown resets it in `finally` and a fragment carries no code button.
export function renderParagraphs(source: string): string[] {
  return marked
    .lexer(source)
    // `def` is the link-definition table itself: consumed above, nothing to render.
    .filter((token: Token) => token.type !== 'space' && token.type !== 'def')
    .map((token: Token) =>
      token.type === 'paragraph'
        ? marked.Parser.parseInline((token as Tokens.Paragraph).tokens, marked.defaults)
        : // trimEnd, not trim: a raw HTML block keeps its leading indentation.
          marked.parser([token]).trimEnd(),
    );
}
