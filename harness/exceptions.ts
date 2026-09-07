/** The exact Spec 1 §15 DOM/screenshot/style allow-list. No selector is supplied by callers. */
import type { Page } from '@playwright/test';
import { isDeepStrictEqual } from 'node:util';
import type { MigratedAdapter } from './migrated.ts';
import type { ParityMode, PageType } from './urls.ts';

export interface ExceptionContext {
  page: PageType;
  side: 'old' | 'new';
  theme: string;
}

export interface PostHeadSnapshot {
  titles: string[];
  descriptions: Array<string | null>;
  canonicals: Array<string | null>;
  openGraph: Array<[string | null, string | null]>;
  twitter: Array<[string | null, string | null]>;
  jsonLd: unknown[];
  heading: string | null;
}

/** Exact contract for every metadata field excluded from DOM comparison by §15. */
export function postHeadIssues(actual: PostHeadSnapshot, expected: MigratedAdapter['postMetadata'][string]): string[] {
  const issues: string[] = [];
  const exact = (name: string, got: unknown, want: unknown): void => {
    if (!isDeepStrictEqual(got, want)) issues.push(`${name}: expected ${JSON.stringify(want)}, got ${JSON.stringify(got)}`);
  };
  exact('title', actual.titles, [expected.titleTag]);
  exact('description', actual.descriptions, [expected.description]);
  exact('canonical', actual.canonicals, [expected.canonical]);
  exact('Open Graph metadata', [...actual.openGraph].sort(), [
    ['og:description', expected.description],
    ['og:image', expected.ogImage],
    ['og:title', expected.title],
    ['og:url', expected.canonical],
  ]);
  if (actual.twitter.length && !isDeepStrictEqual(actual.twitter, [['twitter:card', 'summary']])) {
    issues.push(`Twitter metadata: expected no tags or one summary card, got ${JSON.stringify(actual.twitter)}`);
  }
  exact('BlogPosting JSON-LD', actual.jsonLd, [expected.jsonLd]);
  exact('post heading', actual.heading, expected.title);
  return issues;
}

const VOID = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'source', 'track', 'wbr']);

function tag(line: string): string | null {
  return /^\s*<([a-z][\w:-]*)\b/.exec(line)?.[1] ?? null;
}

function attr(line: string, name: string): string | undefined {
  return new RegExp(`(?:^|\\s)${name}="([^"]*)"`).exec(line)?.[1];
}

function hasClass(line: string, name: string): boolean {
  return (attr(line, 'class') ?? '').split(/\s+/).includes(name);
}

function withoutAttrs(line: string, names: readonly string[]): string {
  let out = line;
  for (const name of names) out = out.replace(new RegExp(`\\s${name}="[^"]*"`, 'g'), '');
  return out;
}

/** Parent start-line indexes for the normalizer's one-line-per-node representation. */
function parents(lines: readonly string[]): Array<number | undefined> {
  const out: Array<number | undefined> = [];
  const stack: number[] = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]!;
    const close = /^\s*<\//.test(line);
    if (close) {
      stack.pop();
      out[i] = stack.at(-1);
      continue;
    }
    out[i] = stack.at(-1);
    const name = tag(line);
    if (name && !VOID.has(name)) stack.push(i);
  }
  return out;
}

function subtreeEnd(lines: readonly string[], start: number): number {
  const name = tag(lines[start]!);
  if (!name || VOID.has(name)) return start;
  const indent = /^\s*/.exec(lines[start]!)![0];
  for (let i = start + 1; i < lines.length; i++) {
    if (lines[i] === `${indent}</${name}>`) return i;
  }
  return start;
}

function ancestor(lines: readonly string[], links: readonly (number | undefined)[], at: number, predicate: (line: string) => boolean): boolean {
  let parent = links[at];
  while (parent !== undefined) {
    if (predicate(lines[parent]!)) return true;
    parent = links[parent];
  }
  return false;
}

function changedCardHref(theme: string, id: 'helm' | 'metr-doubling'): string {
  return `${theme === 'default' ? '' : `/${theme}`}/blog/${id}/`;
}

function presetAnchor(lines: readonly string[], links: readonly (number | undefined)[], at: number): boolean {
  const line = lines[at]!;
  return tag(line) === 'a' && hasClass(line, 'tc-row-link')
    && ancestor(lines, links, at, (candidate) => attr(candidate, 'id') === 'tc-presets')
    && ancestor(lines, links, at, (candidate) => attr(candidate, 'id') === 'tc-dock');
}

export function applyDomExceptions(lines: readonly string[], ctx: ExceptionContext): string[] {
  const links = parents(lines);
  const drop = new Set<number>();
  const markSubtree = (at: number): void => {
    for (let i = at; i <= subtreeEnd(lines, at); i++) drop.add(i);
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]!;
    const name = tag(line);

    if (ctx.side === 'new' && (ctx.page === 'privacy' || ctx.page === 'notFound')) {
      if (attr(line, 'id') === 'tc-dock' || attr(line, 'id') === 'tc-scrim' || hasClass(line, 'tc-fab')) markSubtree(i);
      if (ctx.page === 'notFound' && name === 'link' && attr(line, 'href') === '/vendor/fontawesome-free/css/all.min.css') drop.add(i);
    }

    if (ctx.page === 'post') {
      if (name === 'title' || (name === 'meta' && attr(line, 'name') === 'description')) markSubtree(i);
      if (ctx.side === 'new') {
        if (name === 'link' && attr(line, 'rel') === 'canonical') drop.add(i);
        if (name === 'meta' && (attr(line, 'property')?.startsWith('og:') || attr(line, 'name')?.startsWith('twitter:'))) drop.add(i);
      }
    }

    if (ctx.theme !== 'default') {
      if (name === 'link' && attr(line, 'rel') === 'canonical') drop.add(i);
      if (name === 'meta' && attr(line, 'name') === 'robots') drop.add(i);
    }

    if ((ctx.page === 'home' || ctx.page === 'blog') && (hasClass(line, 'blog-card-title') || hasClass(line, 'blog-card-date'))) {
      const changedCard = ancestor(lines, links, i, (candidate) =>
        tag(candidate) === 'a' && hasClass(candidate, 'blog-card')
          && (attr(candidate, 'href') === changedCardHref(ctx.theme, 'helm')
            || attr(candidate, 'href') === changedCardHref(ctx.theme, 'metr-doubling')),
      );
      if (changedCard) markSubtree(i);
    }
  }

  return lines
    .flatMap((line, index) => {
      if (drop.has(index)) return [];
      let out = line;
      const isPresetAnchor = presetAnchor(lines, links, index);
      if (isPresetAnchor) out = withoutAttrs(out, ['href']);
      if (ctx.side === 'new') {
        if (tag(out) === 'html') out = withoutAttrs(out, ['data-typing', 'data-typing-delete']);
        if (attr(out, 'id') === 'tc-dock') out = withoutAttrs(out, [
          'data-styles', 'data-advanced', 'data-back-to-styles', 'data-advanced-sub',
          'data-done-editing', 'data-current', 'data-preview', 'data-lock', 'data-unlock',
        ]);
        if (isPresetAnchor) out = withoutAttrs(out, ['data-fonts']);
        if (tag(out) === 'li' && attr(out, 'data-profile') !== undefined
          && ancestor(lines, links, index, (candidate) => attr(candidate, 'id') === 'tc-presets')) {
          out = withoutAttrs(out, ['data-profile']);
        }
      }
      return [out];
    });
}

/** Selector groups measured on NEW; each group becomes one identical union rectangle on both sides. */
export function screenshotExceptionGroups(page: PageType, theme: string, side: 'old' | 'new' = 'new'): string[][] {
  if (page === 'privacy' || page === 'notFound') return [['.tc-fab']];
  if (page === 'home' || page === 'blog') return (['helm', 'metr-doubling'] as const).map((id) => {
    const href = side === 'new' ? changedCardHref(theme, id)
      : `${page === 'home' ? 'blog/' : ''}post.html?id=${id}`;
    const card = `a.blog-card[href="${href}"]`;
    return [`${card} .blog-card-title`, `${card} .blog-card-date`];
  });
  return [];
}

export interface MaskRectangle { x: number; y: number; width: number; height: number }

/** Measure each accepted visible NEW addition as one bounded union rectangle. */
async function measureGroups(page: Page, groups: string[][]): Promise<MaskRectangle[]> {
  if (!groups.length) return [];
  return page.evaluate((selectorGroups) => {
    const viewport = { width: innerWidth, height: innerHeight };
    return selectorGroups.map((selectors) => {
      const boxes = selectors.map((selector) => {
        const nodes = [...document.querySelectorAll<HTMLElement>(selector)];
        if (nodes.length !== 1) throw new Error(`screenshot exception ${selector}: expected one NEW node, found ${nodes.length}`);
        const node = nodes[0]!;
        const style = getComputedStyle(node);
        const box = node.getBoundingClientRect();
        if (style.display === 'none' || style.visibility === 'hidden' || Number(style.opacity) === 0
          || box.width <= 0 || box.height <= 0) {
          throw new Error(`screenshot exception ${selector}: target is not visible and bounded`);
        }
        return box;
      });
      const left = Math.floor(Math.min(...boxes.map((box) => box.left)) + scrollX);
      const top = Math.floor(Math.min(...boxes.map((box) => box.top)) + scrollY);
      const right = Math.ceil(Math.max(...boxes.map((box) => box.right)) + scrollX);
      const bottom = Math.ceil(Math.max(...boxes.map((box) => box.bottom)) + scrollY);
      const rectangle = { x: left, y: top, width: right - left, height: bottom - top };
      if (rectangle.width >= viewport.width && rectangle.height >= viewport.height) {
        throw new Error(`screenshot exception ${selectors.join(', ')}: refuses a viewport-sized rectangle`);
      }
      return rectangle;
    });
  }, groups);
}

export async function exceptionRectangles(
  oldPage: Page,
  newPage: Page,
  pageType: PageType,
  theme: string,
): Promise<MaskRectangle[]> {
  if (pageType === 'privacy' || pageType === 'notFound') {
    return measureGroups(newPage, screenshotExceptionGroups(pageType, theme, 'new'));
  }
  const oldRectangles = await measureGroups(oldPage, screenshotExceptionGroups(pageType, theme, 'old'));
  const newRectangles = await measureGroups(newPage, screenshotExceptionGroups(pageType, theme, 'new'));
  if (oldRectangles.length !== newRectangles.length) throw new Error('screenshot exceptions: OLD/NEW group count differs');
  return oldRectangles.map((oldBox, index) => {
    const newBox = newRectangles[index]!;
    const left = Math.min(oldBox.x, newBox.x);
    const top = Math.min(oldBox.y, newBox.y);
    const right = Math.max(oldBox.x + oldBox.width, newBox.x + newBox.width);
    const bottom = Math.max(oldBox.y + oldBox.height, newBox.y + newBox.height);
    return { x: left, y: top, width: right - left, height: bottom - top };
  });
}

/** Add identical page-coordinate rectangles to either side and mask only those boxes. */
export async function screenshotWithExceptionRectangles(
  page: Page,
  baseMasks: readonly string[],
  rectangles: readonly MaskRectangle[],
  fullPage: boolean,
): Promise<Buffer> {
  await page.evaluate((boxes) => {
    for (const [index, box] of boxes.entries()) {
      const mask = document.createElement('div');
      mask.setAttribute('data-parity-exception-mask', String(index));
      Object.assign(mask.style, {
        position: 'absolute', left: `${box.x}px`, top: `${box.y}px`, width: `${box.width}px`,
        height: `${box.height}px`, pointerEvents: 'none', zIndex: '2147483647',
      });
      document.body.append(mask);
    }
  }, rectangles);
  try {
    return await page.screenshot({
      animations: 'disabled', caret: 'hide', scale: 'css', fullPage,
      mask: [...baseMasks.map((selector) => page.locator(selector)), page.locator('[data-parity-exception-mask]')],
    });
  } finally {
    await page.locator('[data-parity-exception-mask]').evaluateAll((nodes) => nodes.forEach((node) => node.remove()));
  }
}

export function styleSampleForComparison(
  sample: Readonly<Record<string, string>>,
  context: { mode: ParityMode; side: 'old' | 'new' },
): Record<string, string> {
  if (context.mode !== 'old-new' || context.side !== 'new') return { ...sample };
  return Object.fromEntries(Object.entries(sample).filter(([name]) => !name.startsWith('html --prose-')));
}
