/**
 * Everything the parity harness knows about the OLD site, derived from the detached
 * baseline checkout at BASELINE_SHA, never from a second authored registry.
 * Consumers: harness/urls.ts, harness/parity.spec.ts, tests/unit/*, fixture generation.
 */
import { readFileSync, existsSync, statSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { runInNewContext } from 'node:vm';
import type { PageType } from './urls.ts';

export const BASELINE_SHA = '0f196d094ad64383ec58df5472fc12d403f846b3';

const REPO_ROOT = dirname(import.meta.dirname);

/** HEAD of the checkout, read from the vcs files directly (no subprocess). */
function checkoutSha(dir: string): string {
  const dotGit = resolve(dir, '.git');
  // A plain clone keeps a `.git` directory; a linked worktree keeps a file holding `gitdir: <path>`.
  const gitDir =
    statSync(dotGit).isDirectory() ? dotGit
    : resolve(dir, readFileSync(dotGit, 'utf8').trim().replace(/^gitdir:\s*/, ''));
  const head = readFileSync(resolve(gitDir, 'HEAD'), 'utf8').trim();
  if (!/^[0-9a-f]{40}$/.test(head)) {
    throw new Error(`${gitDir}/HEAD is not a detached SHA: ${head}`);
  }
  return head;
}

let verified: string | null = null;

/**
 * The baseline checkout, pinned to BASELINE_SHA. This is the only door to it, so every path that
 * reads or vm-executes a baseline file is covered by the pin, not just the Playwright config. The
 * resolved directory is memoized, so the check runs once per process.
 */
export function oldDir(): string {
  if (verified) return verified;
  const dir = resolve(REPO_ROOT, process.env.PARITY_OLD_DIR ?? '../personal-website-old');
  if (!existsSync(resolve(dir, 'index.html'))) {
    throw new Error(
      `Baseline checkout not found at ${dir} (no index.html). Set PARITY_OLD_DIR to the detached ` +
        `worktree of main at ${BASELINE_SHA}.`,
    );
  }
  const sha = checkoutSha(dir);
  if (sha !== BASELINE_SHA) {
    throw new Error(`Baseline checkout ${dir} is at ${sha}, expected ${BASELINE_SHA}`);
  }
  return (verified = dir);
}

function read(rel: string): string {
  return readFileSync(resolve(oldDir(), rel), 'utf8');
}

/** vm results live in another realm, so their arrays fail deepStrictEqual; round-trip them home. */
function plain<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

/** `var ORDER = [...]` in js/theme-bootstrap.js: the 16 live themes, default first. */
export function themeOrder(): string[] {
  const m = /var ORDER = \[([^\]]*)\]/.exec(read('js/theme-bootstrap.js'));
  if (!m) throw new Error('js/theme-bootstrap.js: `var ORDER = [...]` not found');
  const order = [...m[1]!.matchAll(/'([^']*)'/g)].map((q) => q[1]!);
  if (order.length !== 16 || order[0] !== 'default') {
    throw new Error(`Unexpected theme ORDER (${order.length} entries): ${order.join(', ')}`);
  }
  return order;
}

export interface BlogPost {
  id: string;
  external?: boolean;
  [k: string]: unknown;
}

/** js/blog-data.js executed in node:vm with a stub `window`; no regex parsing of object literals. */
function blogData(): { featuredProjects: unknown[]; blogPosts: BlogPost[] } {
  const src = read('js/blog-data.js') + ';({FEATURED_PROJECTS, BLOG_POSTS})';
  const out = runInNewContext(src, { window: {} }) as {
    FEATURED_PROJECTS: unknown[];
    BLOG_POSTS: BlogPost[];
  };
  return plain({ featuredProjects: out.FEATURED_PROJECTS, blogPosts: out.BLOG_POSTS });
}

/** Listing order, minus the external posts (which have no page on this site). */
export function localPostIds(): string[] {
  return blogData()
    .blogPosts.filter((p) => p.external !== true)
    .map((p) => p.id);
}

export interface Step {
  action: string;
  text?: string;
  duration?: number;
  count?: number;
  fn?: string;
}

export interface MastheadPage {
  elementId: string;
  typingDelay: number;
  deleteDelay: number;
  sequences: Array<{ steps: Step[]; terminals: string[] }>;
  /** `js/script.js:203-206` passes one; the listing does not. */
  onNewlineCount?: { count: number; callback: string };
}

export interface MastheadFixture {
  baselineSha: string;
  source: { home: string; blog: string };
  method: string;
  home: MastheadPage;
  blog: MastheadPage;
}

const MASTHEAD_METHOD =
  'The startTypingSequence({...}) argument is sliced out of the frozen baseline source between its ' +
  'literal markers and evaluated in node:vm; each missing identifier is resolved on ReferenceError to ' +
  'its `const <name> = <number>` value in the same file, or to a marker naming the callback. Terminals ' +
  'are simulated in Node: type appends, delete drops trailing characters, other steps no-op.';

/** Slice `startTypingSequence({ … })`'s argument out of a frozen source file. */
function sliceCall(src: string, file: string): string {
  const open = /^([ \t]*)startTypingSequence\(\{/m.exec(src);
  if (!open) throw new Error(`${file}: startTypingSequence({ not found`);
  const marker = `\n${open[1]!}});`;
  const close = src.indexOf(marker, open.index);
  if (close < 0) throw new Error(`${file}: closing marker ${JSON.stringify(marker)} not found`);
  return src.slice(open.index + open[0].length - 1, close + marker.length - 2);
}

/**
 * Evaluate the sliced object literal, teaching the context one identifier per ReferenceError:
 * a numeric `const` from the same file, else a marker carrying the callback's name.
 */
function evalCall(literal: string, src: string, file: string): Record<string, unknown> {
  const ctx: Record<string, unknown> = {};
  for (let i = 0; i < 50; i++) {
    try {
      return plain(runInNewContext(`(${literal})`, ctx) as Record<string, unknown>);
    } catch (e) {
      // The error comes from the vm's realm, so `instanceof ReferenceError` is false here.
      const name = /^(\w+) is not defined$/.exec(String((e as { message?: unknown })?.message ?? ''))?.[1];
      if (!name) throw e;
      const num = new RegExp(`\\bconst\\s+${name}\\s*=\\s*(-?[\\d.]+)\\s*;`).exec(src);
      ctx[name] = num ? Number(num[1]) : { __callback: name };
    }
  }
  throw new Error(`${file}: startTypingSequence argument still unresolved after 50 identifiers`);
}

/** The name evalCall parked on an unresolved identifier that turned out to be a function. */
function callbackName(fn: unknown, file: string, what: string): string {
  const name = (fn as { __callback?: string } | undefined)?.__callback;
  if (!name) throw new Error(`${file}: ${what} has no resolvable callback`);
  return name;
}

function mastheadPage(src: string, file: string): MastheadPage {
  const call = evalCall(sliceCall(src, file), src, file);
  const raw = call.sequences as Array<Array<Record<string, unknown>>>;
  const sequences = raw.map((seq) => {
    const steps: Step[] = seq.map((s) => {
      if (s.action !== 'callback') return s as unknown as Step; // parsed data, as authored
      return { action: 'callback', fn: callbackName(s.fn, file, 'callback step') };
    });
    let text = '';
    const terminals: string[] = [];
    for (const s of steps) {
      if (s.action === 'type') terminals.push((text += s.text ?? ''));
      else if (s.action === 'delete') text = text.slice(0, text.length - (s.count ?? 0));
    }
    return { steps, terminals };
  });
  const onNewline = call.onNewlineCount as { count: number; callback: unknown } | undefined;
  return {
    elementId: call.elementId as string,
    typingDelay: call.typingDelay as number,
    deleteDelay: call.deleteDelay as number,
    sequences,
    ...(onNewline ?
      { onNewlineCount: { count: onNewline.count, callback: callbackName(onNewline.callback, file, 'onNewlineCount') } }
    : {}),
  };
}

/** The two masthead call sites, as authored, plus the text each `type` step lands on. */
export function masthead(): MastheadFixture {
  const source = { home: 'js/script.js', blog: 'blog/blog-listing.js' };
  return {
    baselineSha: BASELINE_SHA,
    source,
    method: MASTHEAD_METHOD,
    home: mastheadPage(read(source.home), source.home),
    blog: mastheadPage(read(source.blog), source.blog),
  };
}

/** The OLD site's URL form (§9): bare paths in the default theme, `?style=<id>` otherwise. */
export function oldPath(page: PageType, theme: string, postId?: string): string {
  if (page === 'post' && !postId) throw new Error('oldPath: page "post" needs a postId');
  const base =
    page === 'home' ? '/'
    : page === 'blog' ? '/blog/'
    : page === 'post' ? `/blog/post.html?id=${postId}`
    : page === 'privacy' ? '/privacy/'
    : '/404.html';
  if (theme === 'default') return base;
  return `${base}${base.includes('?') ? '&' : '?'}style=${theme}`;
}

export interface ContentFixture {
  baselineSha: string;
  source: string;
  method: string;
  featuredProjects: unknown[];
  blogPosts: BlogPost[];
  localPostIds: string[];
}

/**
 * The baseline's content registry, re-derived on every call. No `capturedAt`: the fixture's whole
 * value is that re-derivation is byte-identical, which a timestamp would destroy.
 * Consumers: harness/parity.spec.ts (`@capture:content`), S1-05/S1-06.
 */
export function content(): ContentFixture {
  const data = blogData();
  return {
    baselineSha: BASELINE_SHA,
    source: 'js/blog-data.js',
    method:
      'node:vm execution of the baseline file with a stub window, then reading FEATURED_PROJECTS and BLOG_POSTS.',
    featuredProjects: data.featuredProjects,
    blogPosts: data.blogPosts,
    localPostIds: data.blogPosts.filter((p) => p.external !== true).map((p) => p.id),
  };
}
