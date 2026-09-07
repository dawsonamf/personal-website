// The one post source reader and its publication-filtered projections (§7.1, D8/D19).
// Listing, rail, SEO, sitemap and the legacy redirect shim all derive from these records,
// so there is no second id-to-metadata catalog. Whole drafts are returned by
// readPostSources and excluded from every other projection (D10).
//
// Pure and plain-Node loadable (the unit test imports it directly): erasable TypeScript,
// explicit .ts imports, node: builtins and js-yaml only, no astro:* import, no writes.
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { load as loadYaml } from 'js-yaml';

import { findDrafts } from '../prose/drafts.ts';
import type { DraftIssue } from '../prose/drafts.ts';
import { MONTHS, postMeta } from '../posts/schema.ts';
import type { PostMeta } from '../posts/schema.ts';

export type PostSource = { id: string; source: string; body: string; meta: PostMeta };

/** A record that holds a listing slot: every publication except a whole draft. */
type ListedPost = PostSource & { meta: Exclude<PostMeta, { publication: 'draft' }> };
const isListed = (post: PostSource): post is ListedPost => post.meta.publication !== 'draft';

// Resolved from import.meta.url, not cwd: a build may run with `astro build --root <fixture>`
// while cwd stays here. So this module must be loaded natively by Node, externalized like
// src/prose/index.ts (research/spike-findings.md §k); a bundled copy resolves this under dist/.
export const POSTS_DIR = fileURLToPath(new URL('../content/posts', import.meta.url));

// The legacy splitter, blog/blog-post.js:33. Kept verbatim so a migrated body is the legacy body.
const FRONTMATTER = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/;

function readPostSource(dir: string, source: string): PostSource {
  const match = FRONTMATTER.exec(readFileSync(join(dir, source), 'utf8'));
  if (!match) throw new Error(`posts: ${source}: no --- frontmatter block`);

  let raw: unknown;
  try {
    raw = loadYaml(match[1], { filename: source });
  } catch (error) {
    throw new Error(`posts: ${source}: ${error instanceof Error ? error.message : String(error)}`);
  }

  const parsed = postMeta.safeParse(raw);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((issue) => `${issue.path.join('.') || '(root)'}: ${issue.message}`)
      .join('; ');
    throw new Error(`posts: ${source}: ${issues}`);
  }
  return { id: source.slice(0, -'.md'.length), source, body: match[2], meta: parsed.data };
}

export function readPostSources(dir = POSTS_DIR): PostSource[] {
  let entries: string[];
  try {
    entries = readdirSync(dir);
  } catch (error) {
    const hint = dir.includes('/dist/')
      ? ' (a path under dist/ means src/build/posts.ts was bundled instead of externalized;'
        + ' see research/spike-findings.md §k)'
      : '';
    throw new Error(`posts: ${dir}: ${error instanceof Error ? error.message : String(error)}${hint}`);
  }

  // Dotfiles are ignored, so a Finder .DS_Store cannot fail a local build. Anything else must be .md.
  const sources = entries.filter((name) => !name.startsWith('.')).sort().map((source) => {
    if (!source.endsWith('.md')) throw new Error(`posts: ${source}: not a .md source`);
    return readPostSource(dir, source);
  });

  // Listing slots are data: the published and external records must hold exactly 0..n-1.
  const listing = sources.filter(isListed);
  const orders = listing.map((post) => post.meta.listingOrder);
  if (new Set(orders).size !== listing.length || orders.some((order) => order >= listing.length)) {
    const got = listing.map((post, i) => `${post.source}=${orders[i]}`).join(', ');
    throw new Error(`posts: listingOrder must be exactly 0..${listing.length - 1}: ${got}`);
  }
  return sources;
}

/** Published and external records in listing order. Never a draft. */
export function listingPosts(sources = readPostSources()): ListedPost[] {
  return sources.filter(isListed).sort((a, b) => a.meta.listingOrder - b.meta.listingOrder);
}

export function publishedPostIds(sources = readPostSources()): string[] {
  return listingPosts(sources)
    .filter((post) => post.meta.publication === 'published')
    .map((post) => post.id);
}

/** `Month YYYY` -> `YYYY-MM-01`: blog/blog-post.js:50-54's rule without the client timezone. */
export function postDates(sources = readPostSources()): Record<string, string> {
  const dates: Record<string, string> = {};
  for (const post of listingPosts(sources)) {
    if (post.meta.publication !== 'published') continue;
    const [month, year] = post.meta.date.split(' ');
    const index = MONTHS.findIndex((name) => name === month);
    dates[post.id] = `${year}-${String(index + 1).padStart(2, '0')}-01`;
  }
  return dates;
}

/** What `/blog/post.html?id=<id>` and `/blog/<id>/` resolve to; absent ids are 404 (§6.4). */
export function legacyPostDestinations(sources = readPostSources()): Record<string, string> {
  const destinations: Record<string, string> = {};
  for (const post of listingPosts(sources)) {
    destinations[post.id] =
      post.meta.publication === 'external' ? post.meta.externalUrl : `/blog/${post.id}/`;
  }
  return destinations;
}

/** Drafted fields inside a publishable record (D10). A whole draft is excluded, not reported. */
export function postDraftIssues(sources = readPostSources()): DraftIssue[] {
  return listingPosts(sources).flatMap((post) => findDrafts(post.meta, post.source));
}
