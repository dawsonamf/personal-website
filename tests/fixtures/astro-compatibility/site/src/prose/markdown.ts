import { Marked } from 'marked';
import type { RendererObject, Tokens } from 'marked';
import hljs from 'highlight.js/lib/common';

const marked = new Marked();

const renderer: RendererObject = {
  link({ href, title, tokens }: Tokens.Link) {
    const text = this.parser.parseInline(tokens);
    const titleAttr = title ? ` title="${title}"` : '';
    if (href && (href.startsWith('http://') || href.startsWith('https://'))) {
      return `<a href="${href}" class="text-link" target="_blank" rel="noopener noreferrer"${titleAttr}>${text}</a>`;
    }
    return `<a href="${href}" class="text-link"${titleAttr}>${text}</a>`;
  },
  image({ href, title, text }: Tokens.Image) {
    const titleAttr = title ? ` title="${title}"` : '';
    return `<img src="${href}" alt="${text}" class="blog-image"${titleAttr}>`;
  },
  code({ text, lang }: Tokens.Code) {
    if (lang === 'mermaid') {
      return `<div class="mermaid">${text}</div>`;
    }
    if (lang && hljs.getLanguage(lang)) {
      return `<pre><code class="hljs language-${lang}">${hljs.highlight(text, { language: lang }).value}</code></pre>`;
    }
    return `<pre><code class="hljs">${hljs.highlightAuto(text).value}</code></pre>`;
  },
};

marked.use({ gfm: true, breaks: false, renderer });

export function renderBody(md: string): string {
  return marked.parse(md) as string;
}
