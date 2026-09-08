/** Spec 1 §9 check 5: exact raw-emitted and loaded script identities in page order. */
import type { Page, Request } from '@playwright/test';
import type { MigratedAdapter } from './migrated.ts';
import type { PageType } from './urls.ts';

type Side = 'old' | 'new';
type Phase = 'raw' | 'loaded';
const OLD_GSAP = 'https://cdnjs.cloudflare.com/ajax/libs/gsap/3.9.1/gsap.min.js';
const OLD_JQUERY = 'https://code.jquery.com/jquery-3.6.0.min.js';
const OLD_JQUERY_UI = 'https://code.jquery.com/ui/1.12.1/jquery-ui.min.js';
const OLD_AOS = 'https://unpkg.com/aos@2.3.1/dist/aos.js';
const OLD_TILT = 'https://cdnjs.cloudflare.com/ajax/libs/vanilla-tilt/1.7.0/vanilla-tilt.min.js';

const BOOTSTRAP = '/js/theme-bootstrap.js';
const CYCLER = '/js/theme-cycler.js';
const CALENDLY = 'https://assets.calendly.com/assets/external/widget.js';
const MERMAID = 'https://cdn.jsdelivr.net/npm/mermaid@11.15.0/dist/mermaid.min.js';
const PLOTLY = 'https://cdn.plot.ly/plotly-2.27.0.min.js';
const POST_YAML = 'https://cdn.jsdelivr.net/npm/js-yaml@4.2.0/dist/js-yaml.min.js';

function postAssets(postId: string | undefined): string[] {
  return postId === 'metr-doubling' ? [PLOTLY, POST_YAML, '/blog/posts/assets/metr-chart.js'] : [];
}

function oldScripts(page: PageType, phase: Phase, postId?: string): string[] {
  const staticByPage: Record<PageType, string[]> = {
    home: [BOOTSTRAP, OLD_GSAP, OLD_JQUERY, OLD_JQUERY_UI, OLD_AOS, OLD_TILT, CALENDLY, '/js/blog-data.js', '/js/featured-carousel.js', '/js/typing-engine.js', '/js/anim-utils.js', '/js/nav-config.js', '/js/script.js', '/js/cursor-follow.js', CYCLER],
    blog: [BOOTSTRAP, OLD_AOS, OLD_TILT, CALENDLY, '/js/blog-data.js', '/js/featured-carousel.js', '/js/typing-engine.js', '/js/anim-utils.js', '/js/nav-config.js', '/js/cursor-follow.js', '/blog/blog-listing.js', CYCLER],
    post: [BOOTSTRAP, 'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/highlight.min.js', 'https://cdn.jsdelivr.net/npm/marked@18.0.5/lib/marked.umd.min.js', MERMAID, OLD_TILT, '/js/blog-data.js', '/js/nav-config.js', '/js/cursor-follow.js', '/blog/blog-post.js', CYCLER],
    privacy: [BOOTSTRAP, CYCLER],
    notFound: [BOOTSTRAP, CYCLER],
    lexchat: [BOOTSTRAP, CYCLER],
  };
  const scripts = staticByPage[page];
  return page === 'post' && phase === 'loaded' ? [...scripts, ...postAssets(postId)] : scripts;
}

function newScripts(page: PageType, adapter: MigratedAdapter, postId?: string): string[] {
  const vendor = (npmPath: string): string => {
    const row = adapter.vendorUrls.find((entry) => entry.npmPath === npmPath);
    if (!row) throw new Error(`script inventory: migrated vendor map has no ${npmPath}`);
    return row.publicPath;
  };
  const aos = vendor('aos/dist/aos.js');
  const tilt = vendor('vanilla-tilt/dist/vanilla-tilt.min.js');
  const byPage: Record<PageType, string[]> = {
    home: [vendor('gsap/dist/gsap.min.js'), vendor('jquery/dist/jquery.min.js'), vendor('jquery-ui-dist/jquery-ui.min.js'), aos, tilt, CALENDLY, '/js/featured-carousel.js', '/js/typing-engine.js', '/js/anim-utils.js', '/js/nav-behavior.js', '/js/script.js', '/js/cursor-follow.js', CYCLER],
    blog: [aos, tilt, CALENDLY, '/js/featured-carousel.js', '/js/typing-engine.js', '/js/anim-utils.js', '/js/nav-behavior.js', '/js/cursor-follow.js', '/js/blog-listing-client.js', CYCLER],
    post: [...(postId === 'toolbelt' ? [MERMAID] : []), tilt, '/js/nav-behavior.js', '/js/cursor-follow.js', ...postAssets(postId), '/js/blog-post-client.js', CYCLER],
    privacy: [CYCLER],
    notFound: [CYCLER],
    lexchat: [],
  };
  return byPage[page];
}

export function expectedScripts(page: PageType, side: Side, phase: Phase, postId?: string, adapter?: MigratedAdapter): string[] {
  if (side === 'old') return oldScripts(page, phase, postId);
  if (!adapter) throw new Error('script inventory: migrated side needs its lazy adapter');
  return newScripts(page, adapter, postId);
}

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

function scriptTags(html: string): string[] {
  const tags: string[] = [];
  const lower = html.toLowerCase();
  let at = 0;
  while (at < html.length) {
    const open = html.indexOf('<', at);
    if (open < 0) break;
    if (html.startsWith('<!--', open)) {
      const end = html.indexOf('-->', open + 4);
      at = end < 0 ? html.length : end + 3;
      continue;
    }
    if (!/^<\s*script\b/i.test(html.slice(open))) { at = open + 1; continue; }
    const end = tagEnd(html, open);
    tags.push(html.slice(open, end + 1));
    const close = lower.indexOf('</script', end + 1);
    at = close < 0 ? html.length : tagEnd(html, close) + 1;
  }
  return tags;
}

function scriptSrc(tag: string): string | null {
  const start = /^<\s*script\b/i.exec(tag)?.[0].length ?? 0;
  const body = tag.slice(start, -1);
  const attrs = /([^\s"'=<>`]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g;
  for (const match of body.matchAll(attrs)) {
    if (match[1]!.toLowerCase() === 'src') return match[2] ?? match[3] ?? match[4] ?? '';
  }
  return null;
}

function scriptIdentity(url: string, documentUrl: string): string {
  const resolved = new URL(url, documentUrl);
  return resolved.origin === new URL(documentUrl).origin ? resolved.pathname : resolved.href;
}

/** Resolve exactly the parser-authored src attributes in authored order. */
export function rawScriptSources(html: string, documentUrl: string): string[] {
  return scriptTags(html).flatMap((tag) => {
    const src = scriptSrc(tag);
    return src === null ? [] : [scriptIdentity(src, documentUrl)];
  });
}

/** Immutable request-event record: dynamic imports and removed script nodes remain present. */
export function recordScriptRequests(page: Page): { snapshot(documentUrl: string): string[]; dispose(): void } {
  const urls: string[] = [];
  const listener = (request: Request): void => {
    if (request.resourceType() === 'script') urls.push(request.url());
  };
  page.on('request', listener);
  return {
    snapshot(documentUrl) { return urls.map((url) => scriptIdentity(url, documentUrl)); },
    dispose() { page.off('request', listener); },
  };
}

function resourceOrderConstraints(side: Side, page: PageType, postId: string | undefined): Array<[string, string]> {
  // Parser/preload scheduling is concurrent, so raw HTML owns authored tag order. Only the old
  // runtime source guarantees request order: its per-post asset loader awaits each prior load.
  return side === 'old' && page === 'post' && postId === 'metr-doubling'
    ? [[PLOTLY, POST_YAML], [POST_YAML, '/blog/posts/assets/metr-chart.js']]
    : [];
}

/** Unknowns and duplicates always fail; raw order is exact, resources use source-backed edges. */
export function scriptOrderIssues(
  page: PageType,
  side: Side,
  phase: Phase,
  actual: readonly string[],
  postId?: string,
  complete = false,
  adapter?: MigratedAdapter,
): string[] {
  const expected = expectedScripts(page, side, phase, postId, adapter);
  const issues: string[] = [];
  const seen = new Set<string>();
  let previous = -1;
  for (const src of actual) {
    const at = expected.indexOf(src);
    if (at < 0) issues.push(`${src}: not allowed on ${side} ${page} ${phase}`);
    else if (phase === 'raw' && at < previous) issues.push(`${src}: order differs from the ${side} ${page} inventory`);
    else previous = at;
    if (seen.has(src)) issues.push(`${src}: duplicate script`);
    seen.add(src);
  }
  for (const [before, after] of phase === 'loaded' ? resourceOrderConstraints(side, page, postId) : []) {
    if (actual.indexOf(before) >= actual.indexOf(after)) {
      issues.push(`${after}: resource order must follow ${before} on ${side} ${page}`);
    }
  }
  const completeMatch = phase === 'raw'
    ? JSON.stringify(actual) === JSON.stringify(expected)
    : actual.length === expected.length && [...actual].sort().every((src, index) => src === [...expected].sort()[index]);
  if (complete && !completeMatch) {
    issues.push(`complete ${side} ${page} ${phase} script inventory differs:\nexpected ${expected.join(' -> ')}\nactual ${actual.join(' -> ')}`);
  }
  return issues;
}

/** Compatibility name for earlier harness callers; S1-13 parity uses scriptOrderIssues directly. */
export function disallowedScripts(page: PageType, resolvedSrcs: string[]): string[] {
  return scriptOrderIssues(page, 'old', 'loaded', resolvedSrcs);
}
