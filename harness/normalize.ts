/**
 * Spec 1 §9 normaliser steps 2-5 and 7: browser-serialised (or authored) HTML in, one
 * diff-friendly line per DOM node out. No DOM library, pure string work.
 * Consumers: harness/parity.spec.ts, tests/unit/parity-normalize.test.ts.
 */
import type { ParityMode } from './urls.ts';
import type { PageType } from './urls.ts';
import type { MigratedAdapter } from './migrated.ts';
import { applyDomExceptions } from './exceptions.ts';

export interface NormalizeOptions {
  mode: ParityMode;
  side: 'old' | 'new';
  page?: PageType;
  theme?: string;
  postId?: string;
  adapter?: MigratedAdapter;
}

const VOID = new Set([
  'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'source', 'track', 'wbr',
]);
/** Dropped with their entire content (§9 step 2). */
const DROPPED = new Set(['script', 'noscript']);
/** Content is raw/escapable text, so it is read to the matching end tag rather than parsed. */
const RAW_TEXT = new Set(['script', 'noscript', 'style', 'title', 'textarea']);

/** Split a `style` attribute into `[property, value]`, ignoring `;` inside quotes or parens. */
export function parseDeclarations(style: string): Array<[string, string]> {
  const out: Array<[string, string]> = [];
  const push = (chunk: string): void => {
    const decl = chunk.trim();
    const colon = decl.indexOf(':');
    if (colon < 1) return; // empty, or no property: a browser drops it too
    const prop = decl.slice(0, colon).trim();
    // Custom properties are case-sensitive; everything else is not.
    out.push([prop.startsWith('--') ? prop : prop.toLowerCase(), decl.slice(colon + 1).trim()]);
  };
  let depth = 0;
  let quote = '';
  let start = 0;
  for (let i = 0; i < style.length; i++) {
    const ch = style[i]!;
    if (quote) {
      if (ch === '\\') {
        i++; // an escaped character inside the string, including an escaped quote
        continue;
      }
      if (ch === quote) quote = '';
    } else if (ch === '"' || ch === "'") quote = ch;
    else if (ch === '(') depth++;
    else if (ch === ')') depth = Math.max(0, depth - 1);
    else if (ch === ';' && depth === 0) {
      push(style.slice(start, i));
      start = i + 1;
    }
  }
  push(style.slice(start));
  return out;
}

interface Tag {
  name: string;
  attrs: Array<[string, string]>;
  end: number;
  selfClosing: boolean;
}

/** Parse one start tag beginning at `<`; null when it is not a tag at all (a stray `<`). */
function parseTag(html: string, start: number): Tag | null {
  const m = /^<([a-zA-Z][^\s/>]*)/.exec(html.slice(start, start + 200));
  if (!m) return null;
  const attrs: Array<[string, string]> = [];
  let i = start + m[0].length;
  let selfClosing = false;
  while (i < html.length) {
    while (i < html.length && /\s/.test(html[i]!)) i++;
    if (html[i] === '>') {
      i++;
      break;
    }
    if (html[i] === '/' && html[i + 1] === '>') {
      selfClosing = true;
      i += 2;
      break;
    }
    const nameEnd = /[\s=/>]|$/.exec(html.slice(i))!.index + i;
    if (nameEnd === i) {
      i++;
      continue;
    }
    const name = html.slice(i, nameEnd);
    i = nameEnd;
    while (i < html.length && /\s/.test(html[i]!)) i++;
    let value = '';
    if (html[i] === '=') {
      i++;
      while (i < html.length && /\s/.test(html[i]!)) i++;
      const q = html[i];
      if (q === '"' || q === "'") {
        const close = html.indexOf(q, i + 1);
        value = html.slice(i + 1, close < 0 ? html.length : close);
        i = close < 0 ? html.length : close + 1;
      } else {
        const end = /[\s>]|$/.exec(html.slice(i))!.index + i;
        value = html.slice(i, end);
        i = end;
      }
    }
    attrs.push([name, value]);
  }
  return { name: m[1]!.toLowerCase(), attrs, end: i, selfClosing };
}

/** Content of a raw-text element plus the index just past its end tag. */
function readRaw(html: string, from: number, name: string): { text: string; next: number } {
  const m = new RegExp(`</${name}\\s*>`, 'i').exec(html.slice(from));
  if (!m) return { text: html.slice(from), next: html.length };
  return { text: html.slice(from, from + m.index), next: from + m.index + m[0].length };
}

export function normalizeHtml(
  html: string,
  opts: NormalizeOptions,
): { lines: string[]; guards: { astroAttrs: number; astroHashes: number } } {
  const lines: string[] = [];
  const stack: string[] = [];
  let astroAttrs = 0;
  let astroHashes = 0;

  const indent = (): string => '  '.repeat(stack.length);
  const rewrite = (s: string): string =>
    s.replace(/\/_astro\/[^"'\s)]*/g, () => {
      astroHashes++;
      return '/_astro/HASH';
    });
  const emitText = (raw: string, verbatim: boolean): void => {
    const text = rewrite(raw);
    // The HTML whitespace class, not \s: the serializer leaves U+2009, U+2028 and U+FEFF literal
    // and they are content, not layout.
    const value = verbatim ? text : text.replace(/[ \t\n\r\f]+/g, ' ').trim();
    if (!verbatim && !value) return;
    lines.push(`${indent()}#text ${value.replace(/\n/g, '\\n').replace(/\r/g, '\\r').replace(/\t/g, '\\t')}`);
  };
  const closeTag = (name: string): void => {
    const at = stack.lastIndexOf(name);
    if (at < 0) return; // unmatched end tag
    stack.length = at;
    lines.push(`${indent()}</${name}>`);
  };
  const serializeAttrs = (el: string, attrs: Array<[string, string]>): string => {
    const kept: Array<[string, string]> = [];
    // Step 4 lowercases tag names and sorts attributes, nothing more: the serializer has already
    // lowercased every HTML attribute and preserved SVG camelCase (viewBox, markerWidth), which
    // the post dumps carry. So the lowercased copy is only for the checks below.
    for (const [name, rawValue] of attrs) {
      const lower = name.toLowerCase();
      if (/^data-astro-/.test(lower)) {
        astroAttrs++;
        continue;
      }
      let value = rewrite(rawValue);
      const target = (el === 'a' || el === 'link') && lower === 'href' ? 'href'
        : (el === 'img' || el === 'iframe') && lower === 'src' ? 'src'
        : undefined;
      const canonical = el === 'link' && lower === 'href'
        && attrs.some(([attrName, attrValue]) => attrName.toLowerCase() === 'rel' && attrValue === 'canonical');
      if (target && !canonical && opts.mode === 'old-new' && opts.side === 'old') {
        if (!opts.adapter || !opts.page || !opts.theme) {
          throw new Error('normalizeHtml: old-new old-side mapping needs adapter, page and theme');
        }
        value = opts.adapter.mapOldUrl(value, {
          page: opts.page,
          theme: opts.theme,
          ...(opts.postId ? { postId: opts.postId } : {}),
          tag: el as 'a' | 'link' | 'img' | 'iframe',
          attr: target,
        });
      }
      if (el === 'html' && lower === 'style') {
        // Step 7: `<html style>` is a declaration map, so build-time additions cannot fail on order.
        value = parseDeclarations(value)
          .filter(([prop]) => !(opts.mode === 'old-new' && opts.side === 'new' && prop.startsWith('--prose-')))
          .sort((a, b) => (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0))
          .map(([prop, val]) => `${prop}:${val}`)
          .join('; ');
      }
      kept.push([name, value]);
    }
    kept.sort((a, b) => (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0));
    return kept.map(([name, value]) => ` ${name}="${value}"`).join('');
  };

  let i = 0;
  while (i < html.length) {
    const lt = html.indexOf('<', i);
    if (lt < 0) {
      emitText(html.slice(i), stack.includes('pre'));
      break;
    }
    if (lt > i) emitText(html.slice(i, lt), stack.includes('pre'));
    i = lt;
    if (html.startsWith('<!--', i)) {
      const end = html.indexOf('-->', i + 4);
      i = end < 0 ? html.length : end + 3;
      continue;
    }
    if (html[i + 1] === '!' || html[i + 1] === '?') {
      // ponytail: the doctype is dropped, not emitted. documentElement.outerHTML never carries
      // one; only the informational raw dump does, and both sides author the same line.
      const end = html.indexOf('>', i);
      i = end < 0 ? html.length : end + 1;
      continue;
    }
    if (html[i + 1] === '/') {
      const end = html.indexOf('>', i);
      const name = html.slice(i + 2, end < 0 ? html.length : end).trim().toLowerCase();
      i = end < 0 ? html.length : end + 1;
      if (!VOID.has(name)) closeTag(name);
      continue;
    }
    const tag = parseTag(html, i);
    if (!tag) {
      emitText('<', stack.includes('pre'));
      i++;
      continue;
    }
    i = tag.end;
    const name = tag.name;
    if (DROPPED.has(name)) {
      if (!tag.selfClosing) i = readRaw(html, i, name).next;
      continue;
    }
    if (name === 'link') {
      const rel = tag.attrs.find(([n]) => n.toLowerCase() === 'rel')?.[1] ?? '';
      if (rel.toLowerCase().split(/\s+/).includes('modulepreload')) continue;
    }
    lines.push(`${indent()}<${name}${serializeAttrs(name, tag.attrs)}>`);
    if (VOID.has(name) || tag.selfClosing) continue;
    stack.push(name);
    if (RAW_TEXT.has(name)) {
      const raw = readRaw(html, i, name);
      i = raw.next;
      if (raw.text) emitText(raw.text, name === 'textarea');
      closeTag(name);
    }
  }
  while (stack.length) closeTag(stack[stack.length - 1]!);

  const normalized = opts.mode === 'old-new' && opts.page && opts.theme
    ? applyDomExceptions(lines, { page: opts.page, side: opts.side, theme: opts.theme })
    : lines;

  return { lines: normalized, guards: { astroAttrs, astroHashes } };
}
