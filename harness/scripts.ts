/**
 * §9 check 5 for the OLD side: today's `<script src>` set per page type. Builder 2 resolves each
 * src with `new URL(src, document.baseURI)` and passes a pathname (same origin) or the full URL
 * (cross origin). Line refs are `personal-website-old` at the baseline SHA.
 * Consumers: harness/parity.spec.ts.
 */
import type { PageType } from './urls.ts';

const THEME_BOOTSTRAP = '/js/theme-bootstrap.js'; // index.html:27, blog/index.html:27, blog/post.html:17, privacy/index.html:18, 404.html:16, lexchat/index.html:11
const THEME_CYCLER = '/js/theme-cycler.js'; // index.html:316, blog/index.html:126, blog/post.html:105, privacy/index.html:128, 404.html:69, lexchat/index.html:17
const CALENDLY = 'https://assets.calendly.com/assets/external/widget.js'; // index.html:35, blog/index.html:31
const AOS = 'https://unpkg.com/aos@2.3.1/dist/aos.js'; // index.html:33, blog/index.html:29
const TILT = 'https://cdnjs.cloudflare.com/ajax/libs/vanilla-tilt/1.7.0/vanilla-tilt.min.js'; // index.html:34, blog/index.html:30, blog/post.html:23

const allowedScripts: Record<PageType, ReadonlyArray<string | RegExp>> = {
  home: [
    THEME_BOOTSTRAP,
    'https://cdnjs.cloudflare.com/ajax/libs/gsap/3.9.1/gsap.min.js', // index.html:30
    'https://code.jquery.com/jquery-3.6.0.min.js', // index.html:31
    'https://code.jquery.com/ui/1.12.1/jquery-ui.min.js', // index.html:32
    AOS,
    TILT,
    CALENDLY,
    '/js/blog-data.js', // index.html:36
    '/js/featured-carousel.js', // index.html:37
    '/js/typing-engine.js', // index.html:38
    '/js/anim-utils.js', // index.html:39
    '/js/nav-config.js', // index.html:40
    '/js/script.js', // index.html:41
    '/js/cursor-follow.js', // index.html:42
    THEME_CYCLER,
  ],
  blog: [
    THEME_BOOTSTRAP,
    AOS,
    TILT,
    CALENDLY,
    '/js/blog-data.js', // blog/index.html:32
    '/js/featured-carousel.js', // blog/index.html:33
    '/js/typing-engine.js', // blog/index.html:34
    '/js/anim-utils.js', // blog/index.html:35
    '/js/nav-config.js', // blog/index.html:36
    '/js/cursor-follow.js', // blog/index.html:37
    '/blog/blog-listing.js', // blog/index.html:125
    THEME_CYCLER,
  ],
  post: [
    THEME_BOOTSTRAP,
    'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/highlight.min.js', // blog/post.html:20
    'https://cdn.jsdelivr.net/npm/marked@18.0.5/lib/marked.umd.min.js', // blog/post.html:21
    'https://cdn.jsdelivr.net/npm/mermaid@11.15.0/dist/mermaid.min.js', // blog/post.html:22
    TILT,
    '/js/blog-data.js', // blog/post.html:24
    '/js/nav-config.js', // blog/post.html:25
    '/js/cursor-follow.js', // blog/post.html:26
    '/blog/blog-post.js', // blog/post.html:104
    THEME_CYCLER,
    // Appended by blog/blog-post.js:114-125 from each post's frontmatter `scripts:`.
    // metr-doubling.md:4 is the only matrix post that uses it (Plotly + js-yaml + a local asset).
    'https://cdn.plot.ly/plotly-2.27.0.min.js',
    'https://cdn.jsdelivr.net/npm/js-yaml@4.2.0/dist/js-yaml.min.js',
    /^\/blog\/posts\/assets\/[\w.-]+\.js$/,
  ],
  privacy: [THEME_BOOTSTRAP, THEME_CYCLER],
  notFound: [THEME_BOOTSTRAP, THEME_CYCLER],
  // The old LexChat loads the cycler (lexchat/index.html:17); §8 removes it on the new side.
  lexchat: [THEME_BOOTSTRAP, THEME_CYCLER],
};

export function disallowedScripts(page: PageType, resolvedSrcs: string[]): string[] {
  const allowed = allowedScripts[page];
  return resolvedSrcs.filter(
    (src) => !allowed.some((rule) => (typeof rule === 'string' ? rule === src : rule.test(src))),
  );
}
