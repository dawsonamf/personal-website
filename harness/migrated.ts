/**
 * The old-new side's only adapter to production modules. harness/urls.ts imports this lazily only
 * in PARITY_MODE=old-new, so the proven old-old suite never loads the future registry, paths,
 * post projections or vendor table.
 */
import { VENDOR_FILES } from '../scripts/vendor-map.mjs';
import { postDates, publishedPostIds, readPostSources } from '../src/build/posts.ts';
import { href } from '../src/themes/paths.ts';
import { THEMES } from '../src/themes/registry.ts';
import { prose } from '../src/prose/site.ts';
import { renderPostBody } from '../src/posts/render.ts';
import type { Written } from '../src/prose/fields.ts';
import type { PageType } from './urls.ts';

export const MIGRATED_MATRIX_POSTS = ['toolbelt', 'embedded-swift-agent', 'metr-doubling'] as const;

export interface OldUrlContext {
  page: PageType;
  theme: string;
  postId?: string;
  tag: 'a' | 'link' | 'img' | 'iframe';
  attr: 'href' | 'src';
}

export interface MigratedAdapter {
  themeIds: string[];
  publishedPostIds: string[];
  matrixPosts: string[];
  changedCards: Record<string, { title: string; date: string }>;
  postMetadata: Record<string, {
    title: string;
    titleTag: string;
    description: string;
    date: string;
    datePublished: string;
    tags: string[];
    canonical: string;
    ogImage: string;
    jsonLd: Record<string, unknown>;
  }>;
  postReadTimeTemplate: string;
  postStyles: Record<string, string[]>;
  postFontLinks: Record<string, string[]>;
  postRandomPhaseLocations: string[];
  vendorUrls: Array<{ npmPath?: string; cdnUrl: string; publicPath: string }>;
  newPath(page: PageType, theme: string, postId?: string): string;
  mapOldUrl(value: string, context: OldUrlContext): string;
}

function text(value: Written<string> | undefined, source: string): string {
  if (typeof value === 'string') return value;
  throw new Error(`migrated adapter: ${source} is not approved text`);
}

function basePath(page: PageType, postId?: string): string {
  if (page === 'post' && !postId) throw new Error('migrated newPath: page "post" needs a postId');
  return page === 'home' ? '/'
    : page === 'blog' ? '/blog/'
    : page === 'post' ? `/blog/${postId}/`
    : page === 'privacy' ? '/privacy/'
    : '/404.html';
}

function newPath(page: PageType, theme: string, postId?: string): string {
  const base = basePath(page, postId);
  if (page === 'notFound') return theme === 'default' ? base : `${base}?style=${encodeURIComponent(theme)}`;
  return href(base, theme);
}

const SIBLING_STYLES: Record<string, string> = {
  'blog-listing-styles.css': '/blog/blog-listing-styles.css',
  'blog-styles.css': '/blog/blog-styles.css',
  'privacy-styles.css': '/privacy/privacy-styles.css',
};

function mapAuthored(value: string, context: OldUrlContext, vendor: Map<string, string>): { value: string; themed: boolean } {
  if (
    value === '/lexchat/'
    && (context.page === 'home' || context.page === 'blog')
    && context.tag === 'a'
    && context.attr === 'href'
  ) {
    return { value: 'https://huggingface.co/spaces/dawsonamf/lexchat', themed: false };
  }
  const vendorPath = vendor.get(value);
  if (vendorPath) return { value: vendorPath, themed: true };
  if (value.startsWith('#') || /^[a-z][a-z0-9+.-]*:/i.test(value) && !value.startsWith('https://www.dawsonamf.com')) {
    return { value, themed: false };
  }

  const styleOnly = /^(?:\/)?\?style=([^&#]+)$/.exec(value);
  if (styleOnly) {
    const id = decodeURIComponent(styleOnly[1]!);
    return { value: newPath(context.page, id, context.postId), themed: false };
  }

  let path = value;
  let mapped = false;
  if (path.startsWith('https://www.dawsonamf.com')) {
    path = path.slice('https://www.dawsonamf.com'.length) || '/';
    if (path !== '/' && !path.startsWith('/resources/')) return { value, themed: false };
    mapped = true;
  }
  if (path === 'index.html' || path === '../index.html') { path = '/'; mapped = true; }
  else if (path.startsWith('index.html#')) { path = '/' + path.slice('index.html'.length); mapped = true; }
  else if (path.startsWith('../index.html#')) { path = '/' + path.slice('../index.html'.length); mapped = true; }
  else if (path === './' || path === 'blog/' || path === '../blog/') { path = '/blog/'; mapped = true; }
  else {
    const post = /^(?:post\.html|blog\/post\.html|\.\.\/blog\/post\.html)\?id=([^&#]+)(?:&style=([^&#]+))?$/.exec(path);
    if (post && (!post[2] || decodeURIComponent(post[2]) === context.theme)) {
      path = `/blog/${decodeURIComponent(post[1]!)}/`;
      mapped = true;
    }
    else if (/^(?:\.\.\/)?css\//.test(path)) { path = '/' + path.replace(/^(?:\.\.\/)?/, ''); mapped = true; }
    else if (SIBLING_STYLES[path]) return { value: SIBLING_STYLES[path]!, themed: false };
    else if (/^posts\/assets\/[^/]+\.css(?:[?#].*)?$/.test(path)) { path = '/blog/' + path; mapped = true; }
    else if (/^(?:\.\.\/){0,2}resources\//.test(path)) { path = '/' + path.replace(/^(?:\.\.\/){0,2}/, ''); mapped = true; }
    else if (path === '/embedded-swift-agent/') { path = '/subsites/dawson/embedded-swift-agent/'; mapped = true; }
    else if (path === '/') mapped = true;
  }
  return mapped ? { value: path, themed: true } : { value, themed: false };
}

export function createMigratedAdapter(): MigratedAdapter {
  const sources = readPostSources();
  const published = publishedPostIds(sources);
  const dates = postDates(sources);
  for (const id of MIGRATED_MATRIX_POSTS) {
    if (!published.includes(id)) throw new Error(`migrated adapter: matrix post ${id} is not published`);
  }
  const metadata = Object.fromEntries(
    sources
      .filter((source) => source.meta.publication === 'published')
      .map((source) => {
        const title = text(source.meta.title?.s, `${source.source}:title.s`);
        const description = text(source.meta.description?.l, `${source.source}:description.l`);
        const date = source.meta.date;
        if (typeof date !== 'string') throw new Error(`migrated adapter: ${source.source}:date is not text`);
        const datePublished = dates[source.id];
        if (!datePublished) throw new Error(`migrated adapter: ${source.source}:date has no ISO projection`);
        if (!Array.isArray(source.meta.tags)) throw new Error(`migrated adapter: ${source.source}:tags is not an approved list`);
        const tags = source.meta.tags.map((tag, index) => text(tag, `${source.source}:tags[${index}]`));
        const canonical = `https://www.dawsonamf.com/blog/${source.id}/`;
        const person = {
          '@type': 'Person',
          name: 'Dawson Metzger-Fleetwood',
          url: 'https://www.dawsonamf.com/',
        };
        return [source.id, {
          title,
          titleTag: `${title} | ${prose.text('site.titleSuffix', 'xs')}`,
          description,
          date,
          datePublished,
          tags,
          canonical,
          ogImage: 'https://www.dawsonamf.com/resources/og-avatar.jpg',
          jsonLd: {
            '@context': 'https://schema.org',
            '@type': 'BlogPosting',
            headline: title,
            url: canonical,
            mainEntityOfPage: { '@type': 'WebPage', '@id': canonical },
            author: person,
            publisher: person,
            datePublished,
            dateModified: datePublished,
            description,
            keywords: tags.join(', '),
          },
        }];
      }),
  );
  const changedCards = Object.fromEntries(['helm', 'metr-doubling'].map((id) => [id, {
    title: metadata[id]!.title,
    date: metadata[id]!.date,
  }]));
  const postStyles = Object.fromEntries(
    sources
      .filter((source) => source.meta.publication === 'published')
      .map((source) => [source.id, [...source.meta.styles]]),
  );
  const vendorUrls = VENDOR_FILES.map(({ npmPath, cdnUrl, publicPath }) => ({ ...(npmPath ? { npmPath } : {}), cdnUrl, publicPath }));
  const vendor = new Map(vendorUrls.map((row) => [row.cdnUrl, row.publicPath]));
  const themeIds = THEMES.map((theme) => theme.id);
  const allFontLinks = [...new Set(THEMES.flatMap((theme) => theme.fonts ?? []))];
  const postFontLinks = Object.fromEntries(THEMES.map((theme) => {
    const initial = theme.fonts ?? [];
    return [theme.id, [...initial, ...allFontLinks.filter((font) => !initial.includes(font))]];
  }));
  const diagramFree = sources
    .filter((source) => source.meta.publication === 'published')
    .filter((source) => !renderPostBody(source).hasMermaid);
  const postRandomPhaseLocations = THEMES.flatMap((theme) =>
    diagramFree.map((source) => newPath('post', theme.id, source.id)));
  return {
    themeIds,
    publishedPostIds: published,
    matrixPosts: [...MIGRATED_MATRIX_POSTS],
    changedCards,
    postMetadata: metadata,
    postReadTimeTemplate: prose.text('post.readTime', 'xs'),
    postStyles,
    postFontLinks,
    postRandomPhaseLocations,
    vendorUrls,
    newPath,
    mapOldUrl(value, context) {
      // normalize.ts exempts only link[rel=canonical] before this method. Other same-origin
      // links, including absolute favicon/resource links, remain in §9's map scope.
      const mapped = mapAuthored(value, context, vendor);
      if (!mapped.themed || context.page === 'notFound') return mapped.value;
      return href(mapped.value, context.theme);
    },
  };
}
