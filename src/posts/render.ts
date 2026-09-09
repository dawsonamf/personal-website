// Build-time adapter from an owned post source to the canonical body slot (§7.2).
// Metadata stays with PostSource and BlogPost.astro owns its presentation; this module
// deliberately has no format registry. A future component/MDX adapter can supply the same
// named slot without changing the post layout or public route contract.
import type { PostSource } from '../build/posts.ts';
import { createProseAccess } from '../prose/index.ts';
import type { ProseAccess } from '../prose/index.ts';
import { prose } from '../prose/site.ts';
import { renderMarkdown } from '../prose/markdown.ts';
import { href } from '../themes/paths.ts';

export interface RenderedPostBody {
  html: string;
  hasMermaid: boolean;
}

/** The post contract every dynamically selected layout receives at render time. */
export type PostLayoutSource = PostSource & {
  datePublished?: string;
  hasMermaid: boolean;
  prose: ProseAccess<PostSource['meta']>;
};

/** Bind after static-path props are deserialized, before the selected layout is dispatched. */
export function bindPostForLayout(
  post: PostSource & { datePublished?: string; hasMermaid: boolean },
): PostLayoutSource {
  return { ...post, prose: createProseAccess(post.meta, post.source) };
}

/** Render one source body through the common marked/highlight pipeline. */
export function renderPostBody(post: PostSource): RenderedPostBody {
  const html = renderMarkdown(post.body, { copyLabel: prose.text('post.copyCode', 'xs') });
  return { html, hasMermaid: html.includes('class="mermaid"') };
}

/**
 * Project only rendered anchor destinations for a theme. The renderer owns every other byte,
 * including highlighted code and raw HTML, so theme expansion never converts the body again.
 */
export function projectPostLinks(html: string, themeId: string): string {
  return html.replace(/<a\b(?:"[^"]*"|'[^']*'|[^'">])*>/gi, (anchor) =>
    anchor.replace(
      /(\s)(href)(\s*=\s*)(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+))/i,
      (_attribute, space, name, equals, doubleQuoted, singleQuoted, unquoted) => {
        const destination = doubleQuoted ?? singleQuoted ?? unquoted;
        const projected = href(destination, themeId);
        const value = doubleQuoted !== undefined ? `"${projected}"`
          : singleQuoted !== undefined ? `'${projected}'`
          : projected;
        return `${space}${name}${equals}${value}`;
      },
    ),
  );
}

/** Safe for `<script type="application/ld+json" set:html>`. */
export function serializeJsonLd(value: unknown): string {
  return JSON.stringify(value).replace(/</g, '\\u003c');
}
