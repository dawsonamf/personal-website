// Engine invariants (D39): ONE integration whose hooks call named pure functions.
// S1-08 owns the content assertions; S1-13 adds the emitted-page ones to this same file.
//
// Imported from astro.config.mjs, so plain Node loads it (research/spike-findings.md §k):
// erasable TypeScript only, explicit .ts extensions, no astro:* or Vite-only import.
// Per §3.3 the only src/ import here is ../prose/index.ts, the shared accumulators.
import { readFileSync, readdirSync } from 'node:fs';
import { extname, isAbsolute, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

import { load } from 'js-yaml';

import type { AstroIntegration } from 'astro';

import { touches, unwrittenSizes } from '../prose/index.ts';

export const PROSE_YAML = fileURLToPath(new URL('../content/prose.yaml', import.meta.url));
export const SRC_ROOT = fileURLToPath(new URL('../', import.meta.url));

type BuiltPage = { pathname: string };

const VOID = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'source', 'track', 'wbr']);
const SOURCE_EXTENSIONS = new Set(['.astro', '.html', '.js', '.jsx', '.mjs', '.ts', '.tsx']);
const SCHEME = /^[a-z][a-z0-9+.-]*:/i;
const SITE_ORIGIN = 'https://www.dawsonamf.com';

interface HtmlElement {
  name: string;
  attrs: Map<string, string>;
  parent?: HtmlElement;
}

/** The emitted file that Astro 7.3.1's page pathname names under build:done's `dir`. */
function emittedFile(dir: URL, pathname: string): URL {
  // Astro's public hook currently supplies `/` for home and slashless `blog/`-style names for
  // other pages. Its 404 page is the special `404/` pathname even though the file is 404.html.
  if (pathname.includes('..') || pathname.includes('\\') || SCHEME.test(pathname) || pathname.startsWith('//')) {
    throw new Error(`checks: invalid build page pathname ${JSON.stringify(pathname)}`);
  }
  const route = pathname.replace(/^\/+/, '');
  const rel = route === '' ? 'index.html'
    : route === '404/' || route === '404.html' ? '404.html'
    : route.endsWith('/') ? route + 'index.html'
    : route;
  const candidate = new URL(rel, dir);
  const rootPath = fileURLToPath(dir);
  const candidatePath = fileURLToPath(candidate);
  const fromRoot = relative(rootPath, candidatePath);
  if (fromRoot === '..' || fromRoot.startsWith(`..${process.platform === 'win32' ? '\\' : '/'}`) || isAbsolute(fromRoot)) {
    throw new Error(`checks: build page pathname escapes output directory ${JSON.stringify(pathname)}`);
  }
  return candidate;
}

function attrsOf(source: string): Map<string, string> {
  const attrs = new Map<string, string>();
  const start = /^<\/?[^\s>]+/.exec(source)?.[0].length ?? 0;
  const body = source.slice(start, source.endsWith('>') ? -1 : undefined);
  const attr = /([^\s"'=<>`]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g;
  for (const match of body.matchAll(attr)) {
    attrs.set(match[1]!.toLowerCase(), match[2] ?? match[3] ?? match[4] ?? '');
  }
  return attrs;
}

interface HtmlToken {
  kind: 'comment' | 'start' | 'end';
  source: string;
  name?: string;
}

const RAW_TEXT = new Set(['script', 'style', 'xmp', 'iframe', 'noembed', 'noframes', 'plaintext', 'textarea', 'title']);

function tagEnd(html: string, start: number): number {
  let quote = '';
  for (let i = start + 1; i < html.length; i++) {
    const char = html[i]!;
    if (quote) {
      if (char === quote) quote = '';
    } else if (char === '"' || char === "'") quote = char;
    else if (char === '>') return i;
  }
  return html.length - 1;
}

/** Actual HTML comments/tags, skipping comments, raw text and RCDATA as browsers do. */
function htmlTokens(html: string): HtmlToken[] {
  const out: HtmlToken[] = [];
  const lower = html.toLowerCase();
  let at = 0;
  while (at < html.length) {
    const open = html.indexOf('<', at);
    if (open < 0) break;
    if (html.startsWith('<!--', open)) {
      const end = html.indexOf('-->', open + 4);
      const stop = end < 0 ? html.length : end + 3;
      out.push({ kind: 'comment', source: html.slice(open, stop) });
      at = stop;
      continue;
    }
    if (/^<!|^<\?/.test(html.slice(open, open + 2))) {
      at = tagEnd(html, open) + 1;
      continue;
    }
    const match = /^<\s*(\/?)\s*([a-zA-Z][\w:-]*)/.exec(html.slice(open));
    if (!match) { at = open + 1; continue; }
    const end = tagEnd(html, open);
    const name = match[2]!.toLowerCase();
    const kind = match[1] ? 'end' : 'start';
    out.push({ kind, name, source: html.slice(open, end + 1) });
    at = end + 1;
    if (kind === 'start' && RAW_TEXT.has(name) && !/\/\s*>$/.test(html.slice(open, end + 1))) {
      if (name === 'plaintext') break;
      const close = lower.indexOf(`</${name}`, at);
      if (close < 0) break;
      at = close;
    }
  }
  return out;
}

/** Enough of the emitted tree to validate exact ids, classes and direct trigger ancestry. */
function elements(tokens: readonly HtmlToken[]): HtmlElement[] {
  const out: HtmlElement[] = [];
  const stack: HtmlElement[] = [];
  for (const token of tokens) {
    if (token.kind === 'comment') continue;
    const source = token.source;
    if (token.kind === 'end') {
      const name = token.name!;
      const at = stack.map((entry) => entry.name).lastIndexOf(name);
      if (at >= 0) stack.length = at;
      continue;
    }
    const name = token.name!;
    const entry: HtmlElement = { name, attrs: attrsOf(source), ...(stack.at(-1) ? { parent: stack.at(-1)! } : {}) };
    out.push(entry);
    if (!VOID.has(name) && !/\/\s*>$/.test(source)) stack.push(entry);
  }
  return out;
}

const classes = (entry: HtmlElement): string[] => (entry.attrs.get('class') ?? '').split(/\s+/).filter(Boolean);
const hasClass = (entry: HtmlElement, name: string): boolean => classes(entry).includes(name);
const attrEquals = (entry: HtmlElement, name: string, value: string): boolean => entry.attrs.get(name) === value;

function literalSameOrigin(value: string): boolean {
  if (!SCHEME.test(value) && !value.startsWith('//')) return false;
  try {
    return new URL(value, SITE_ORIGIN).origin === new URL(SITE_ORIGIN).origin;
  } catch {
    return false;
  }
}

/** D29/D30 over only Astro's emitted page list, never redirects or public passthroughs. */
export function assertShellInvariants(pages: readonly BuiltPage[], dir: URL): void {
  const problems: string[] = [];
  for (const { pathname } of pages) {
    const html = readFileSync(emittedFile(dir, pathname), 'utf8');
    const tokens = htmlTokens(html);
    const nodes = elements(tokens);
    const issue = (message: string): void => { problems.push(`${pathname}: ${message}`); };

    const comments = tokens.filter((token) => token.kind === 'comment').map((token) => token.source);
    const assets = comments.filter((comment) => comment === '<!--theme-assets-->').length;
    if (assets !== 1) issue(`expected exactly one ThemeAssets marker, found ${assets}`);

    const mountMarkers = comments
      .map((comment) => /^<!--picker-mount:([^>]*)-->$/.exec(comment)?.[1])
      .filter((mount): mount is string => mount !== undefined);
    if (mountMarkers.length !== 1) {
      issue(`expected exactly one picker-mount marker, found ${mountMarkers.length}`);
      continue;
    }
    const mount = mountMarkers[0]!;
    if (mount !== 'nav' && mount !== 'fab' && mount !== 'none') {
      issue(`invalid picker-mount marker ${JSON.stringify(mount)}`);
      continue;
    }

    const docks = nodes.filter((node) => attrEquals(node, 'id', 'tc-dock'));
    const scrims = nodes.filter((node) => attrEquals(node, 'id', 'tc-scrim'));
    const cyclers = nodes.filter((node) => node.name === 'script' && attrEquals(node, 'src', '/js/theme-cycler.js'));
    const triggers = nodes.filter((node) => hasClass(node, 'tc-nav-trigger'));
    const fabs = nodes.filter((node) => hasClass(node, 'tc-fab'));

    if (mount === 'none') {
      const present = [
        docks.length && `${docks.length} #tc-dock`,
        scrims.length && `${scrims.length} #tc-scrim`,
        cyclers.length && `${cyclers.length} theme-cycler script`,
        triggers.length && `${triggers.length} trigger`,
        fabs.length && `${fabs.length} .tc-fab`,
      ].filter(Boolean);
      if (present.length) issue(`picker-none composition must not emit picker markup/runtime: ${present.join(', ')}`);
    } else {
      if (docks.length !== 1) issue(`picker mount ${mount}: expected one #tc-dock, found ${docks.length}`);
      if (scrims.length !== 1) issue(`picker mount ${mount}: expected one #tc-scrim, found ${scrims.length}`);
      if (cyclers.length !== 1) issue(`picker mount ${mount}: expected one theme-cycler script, found ${cyclers.length}`);
      if (mount === 'nav' && triggers.length < 1) {
        issue(`picker mount nav: expected at least one valid nested trigger, found ${triggers.length}`);
      }
      if (mount === 'fab' && triggers.length !== 1) {
        issue(`picker mount fab: expected exactly one valid nested trigger, found ${triggers.length}`);
      }
      for (const trigger of triggers) {
        if (trigger.name !== 'button') issue('picker trigger must be a button.tc-nav-trigger');
        if (!trigger.parent || !hasClass(trigger.parent, 'tc-nav-item')) issue('picker trigger must be nested directly in .tc-nav-item');
        if (trigger.attrs.get('aria-haspopup') !== 'true') issue('picker trigger needs aria-haspopup="true"');
        if (trigger.attrs.get('aria-controls') !== 'tc-dock') issue('picker trigger needs aria-controls="tc-dock"');
        if (!trigger.attrs.has('aria-expanded')) issue('picker trigger needs aria-expanded');
      }
      if (mount === 'fab' && fabs.length !== 1) issue(`picker mount fab: expected one .tc-fab, found ${fabs.length}`);
      if (mount === 'nav' && fabs.length !== 0) issue(`picker mount nav: expected no .tc-fab, found ${fabs.length}`);
    }

    for (const anchor of nodes.filter((node) => node.name === 'a' && node.attrs.has('href'))) {
      const href = anchor.attrs.get('href')!;
      if (literalSameOrigin(href)) issue(`literal same-origin navigation href ${JSON.stringify(href)}`);
      else if (href && !href.startsWith('/') && !href.startsWith('#') && !href.startsWith('//') && !SCHEME.test(href)) {
        issue(`relative navigation href ${JSON.stringify(href)}`);
      }
    }
  }
  if (problems.length) throw new Error(`checks: engine invariant failure(s):\n  ${problems.join('\n  ')}`);
}

function sourceFiles(root: string): string[] {
  const files: string[] = [];
  const visit = (dir: string): void => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const path = join(dir, entry.name);
      if (entry.isDirectory()) visit(path);
      else if (entry.isFile() && SOURCE_EXTENSIONS.has(extname(entry.name))) files.push(path);
    }
  };
  visit(root);
  return files.sort();
}

/** D31's authoring gate. Dynamic hrefs are checked by href() and the emitted-page sweep above. */
export function assertNoRelativeHrefs(root = SRC_ROOT): void {
  const problems: string[] = [];
  for (const file of sourceFiles(root)) {
    const text = readFileSync(file, 'utf8');
    const literals = /\bhref\s*(?:=|\()\s*(?:"([^"]*)"|'([^']*)')/g;
    for (const match of text.matchAll(literals)) {
      const value = match[1] ?? match[2] ?? '';
      if (value.includes('${')) continue;
      const tagStart = text.lastIndexOf('<', match.index);
      const tagEnd = text.indexOf('>', match.index);
      const containingTag = tagStart >= 0 && tagEnd >= 0 ? text.slice(tagStart, tagEnd + 1) : '';
      const generatedCanonical = /^<link\b/i.test(containingTag)
        && /\brel\s*=\s*(?:"[^"]*\bcanonical\b[^"]*"|'[^']*\bcanonical\b[^']*')/i.test(containingTag);
      if (generatedCanonical) continue;
      const line = text.slice(0, match.index).split('\n').length;
      const at = `${relative(root, file)}:${line}`;
      if (literalSameOrigin(value)) problems.push(`${at}: literal same-origin navigation ${JSON.stringify(value)}`);
      else if (value && !value.startsWith('/') && !value.startsWith('#') && !value.startsWith('//') && !SCHEME.test(value)) {
        problems.push(`${at}: relative href ${JSON.stringify(value)}`);
      }
    }
  }
  if (problems.length) throw new Error(`checks: source href failure(s):\n  ${problems.join('\n  ')}`);
}

/**
 * §4.1 rule 6: the file() loader swallows a YAML syntax error into an empty collection, so the
 * build must parse the file itself. Returns the parsed tree for callers that want it. This
 * hook re-parses independently of the prose integration's walk, so the check does not depend
 * on integration order (D39).
 */
export function assertNoYamlSyntaxError(): unknown {
  const text = readFileSync(PROSE_YAML, 'utf8');
  try {
    return load(text, { filename: PROSE_YAML });
  } catch (error) {
    throw new Error(
      `checks: ${PROSE_YAML} is not valid YAML (the file() loader would swallow this): `
        + (error instanceof Error ? error.message : String(error)),
    );
  }
}

/**
 * The positive sentinel required by spike §k. An empty unwritten set is only meaningful if
 * prose was actually read through THIS module instance; otherwise the gate passes vacuously.
 */
function assertProseTouched(count: number): void {
  if (count !== 0) return;
  throw new Error(
    'checks: no prose request reached the checks integration (touches === 0), so the '
      + 'unwritten-size gate below would pass vacuously. Causes: no page rendered prose; '
      + 'src/prose/index.ts was bundled a second time because the vite resolveId '
      + 'externalization in astro.config.mjs no longer matches it; or the config chain failed '
      + "to import under Node and astro's vite-load.js silently fell back to Vite's loader "
      + '(run `node -e "import(\'./astro.config.mjs\')"` to surface that error). '
      + 'See research/spike-findings.md §k.',
  );
}

/** D10: a requested size nobody wrote is fatal. */
export function assertNoUnwrittenSizes(unwritten: ReadonlySet<string>): void {
  if (unwritten.size === 0) return;
  const entries = [...unwritten].sort().map((entry) => `  ${entry}`).join('\n');
  throw new Error(
    `checks: ${unwritten.size} requested prose size(s) are unwritten:\n${entries}\n`
      + 'Write the size, or set it to null to omit the slot.',
  );
}

export default function checks(): AstroIntegration {
  return {
    name: 'checks',
    hooks: {
      'astro:config:setup': () => {
        assertNoYamlSyntaxError();
      },
      'astro:build:done': ({ pages, dir }) => {
        // The sentinel first: without it an empty set proves nothing.
        assertProseTouched(touches);
        assertNoUnwrittenSizes(unwrittenSizes);
        assertNoRelativeHrefs();
        assertShellInvariants(pages, dir);
      },
    },
  };
}
