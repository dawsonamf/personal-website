// Publication-derived static output (§6.4, D19/D24).
//
// The legacy query route is a literal public file because build.format is `directory`.
// Generate it during config setup, before Astro copies public/, so a stale generated file can
// never win. External redirect entries are projected from the same validated post records.
import { mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import type { AstroIntegration, HookParameters } from 'astro';

import {
  legacyPostDestinations,
  publishedPostIds,
  readPostSources,
} from './posts.ts';
import type { PostSource } from './posts.ts';
import { prose } from '../prose/site.ts';
import { THEME_IDS } from '../themes/registry.ts';

const SITE_ORIGIN = 'https://www.dawsonamf.com';

/** JSON safe to place directly inside a classic script element. */
function scriptJson(value: unknown): string {
  return JSON.stringify(value)
    .replaceAll('&', '\\u0026')
    .replaceAll('<', '\\u003c')
    .replaceAll('>', '\\u003e')
    .replaceAll('\u2028', '\\u2028')
    .replaceAll('\u2029', '\\u2029');
}

function htmlText(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

/** The two known external post routes, with their validated destinations unchanged. */
export function externalPostRedirects(
  sources: PostSource[] = readPostSources(),
): Record<string, string> {
  const local = new Set(publishedPostIds(sources));
  return Object.fromEntries(
    Object.entries(legacyPostDestinations(sources))
      .filter(([id]) => !local.has(id))
      .map(([id, destination]) => [`/blog/${id}/`, destination]),
  );
}

/** Build the literal `/blog/post.html` shim from validated post and theme projections. */
export function legacyPostShimHtml(
  sources: PostSource[] = readPostSources(),
  themeIds: readonly string[] = THEME_IDS,
): string {
  const destinations = legacyPostDestinations(sources);
  const localIds = publishedPostIds(sources);
  const title = htmlText(prose.text('meta.blog.title', 's'));
  const blogLabel = htmlText(prose.text('nav.blog', 'xs'));

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${title}</title>
  <link rel="canonical" href="${SITE_ORIGIN}/blog/">
  <meta http-equiv="refresh" content="0;url=/blog/">
  <meta name="robots" content="noindex">
  <script>
    (function () {
      'use strict';
      var destinations = ${scriptJson(destinations)};
      var localIds = new Set(${scriptJson(localIds)});
      var themeIds = new Set(${scriptJson(themeIds)});
      var params = new URLSearchParams(window.location.search);
      var id = params.get('id');
      var destination = Object.prototype.hasOwnProperty.call(destinations, id)
        ? destinations[id]
        : '/404.html';

      if (localIds.has(id)) {
        var style = params.get('style');
        if (style && style !== 'default' && themeIds.has(style)) {
          destination = '/' + style + destination;
        }
        destination += window.location.hash;
      }

      window.location.replace(destination);
    })();
  </script>
</head>
<body>
  <p><a href="/blog/">${blogLabel}</a></p>
</body>
</html>
`;
}

export function writeLegacyPostShim(
  publicDir: URL,
  sources: PostSource[] = readPostSources(),
): URL {
  const output = new URL('blog/post.html', publicDir);
  mkdirSync(fileURLToPath(new URL('./', output)), { recursive: true });
  writeFileSync(output, legacyPostShimHtml(sources), 'utf8');
  return output;
}

/** Generate public output before Astro's public-directory copy begins. */
export default function postOutput(): AstroIntegration {
  return {
    name: 'post-output',
    hooks: {
      'astro:config:setup': ({ config, command }: HookParameters<'astro:config:setup'>) => {
        if (command === 'build') writeLegacyPostShim(config.publicDir);
      },
    },
  };
}
