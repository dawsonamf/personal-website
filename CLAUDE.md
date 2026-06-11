# dawsonamf.com

Static personal site, deployed via GitHub Pages (CNAME → www.dawsonamf.com). No build
step, no package.json — plain HTML/CSS/JS; push to main = deploy.

## New page checklist

Every page repeats this boilerplate by hand (there is deliberately no build step):

1. `<head>`, in this order: meta charset/viewport → title + description (plus
   canonical/OG tags on indexable pages) → favicon links (`resources/favicon-32.png`,
   `resources/apple-touch-icon.png`) → third-party CSS (Font Awesome, boxicons, AOS,
   Calendly, as needed) → site CSS (`css/styles.css`, `css/mobile-styles.css`, then any
   page/feature CSS) → `css/theme-cycler.css` last → then
   `<script src="js/theme-bootstrap.js"></script>` **synchronously, not deferred** —
   it must run before first paint so the `--text50`/`--bg50`-style alpha variables exist.
2. End of `<body>`: `<script defer src="js/theme-cycler.js"></script>`.
3. Adjust paths with `../` for pages in subdirectories. `404.html` is the exception:
   it uses absolute (`/css/...`) paths because GitHub Pages serves it at any missing URL.

## Conventions

- **Mobile breakpoint is 1100px site-wide** — media queries in `css/*.css`,
  `MOBILE_BREAKPOINT` in `js/script.js`, and innerWidth checks in
  `js/featured-carousel.js` must stay in sync.
- **CDN dependencies are version-pinned** (marked, mermaid, highlight.js, AOS,
  vanilla-tilt, jQuery, and per-post scripts in markdown frontmatter). When bumping,
  pin an exact version — never use unversioned `@latest` URLs — and **curl the exact
  URL to confirm it returns 200**: packages move files between majors (e.g. marked
  ≥ v18 ships `lib/marked.umd.min.js`; the old root `marked.min.js` is gone).
- **Nav and social links are config-driven**: `js/nav-config.js` holds `NAV_LINKS`
  and `SOCIAL_LINKS` and renders them into the menus and socials containers.
  Edit links there, not in the HTML.
- **Shared animation helpers** live in `js/anim-utils.js` (loaded as a plain,
  non-defer script so end-of-body scripts can use it).
- **Style versions (theme switcher)**: the registry lives in `js/theme-bootstrap.js`
  (synchronous, pre-paint); per-style skins in `css/themes/<id>.css` with every
  rule scoped under `[data-style="<id>"]` (root-absolute asset paths), plus
  `css/themes/theme-base.css` (shared pins, auto-loaded with any skin) keyed off
  `data-style`/`data-still`/`data-no-tilt`. Activate via the nav's Theme
  dropdown (trigger rendered by `js/nav-config.js`, dock anchored to it by
  `js/theme-cycler.js`; pages without nav menus fall back to a floating
  palette FAB) or `?style=<id>`; session-only, reload → default.
  Architecture: `todo/STYLE_VERSIONS_SPEC.md`.
- **Page-scoped CSS lives beside its page** (`blog/blog-styles.css`,
  `privacy/privacy-styles.css`, `lexchat/lexchat-styles.css`); only shared,
  multi-page CSS goes in `css/`.
- **Images in `resources/`**: commit at roughly 2× display size — ≤1200px wide for
  carousel images (displayed 510×340), ≤1500px for blog post images (750px column).
  Prefer JPEG for photos/art without transparency; aim for under ~500 KB per image.
- Blog posts are markdown in `blog/posts/` with frontmatter (`title`, `date`,
  optional `scripts`/`styles` arrays), rendered client-side by `blog/blog-post.js`,
  and listed via `BLOG_POSTS` in `js/blog-data.js`. New posts also go in `sitemap.xml`.

## Planned work

- Tracked in `todo/` — `todo/TODO.md` is the index. Specs live alongside it:
  `todo/STYLE_VERSIONS_SPEC.md` (multi-theme switcher) and
  `todo/CLEANUP_SPEC.md` (remaining polish: README, .editorconfig, etc.).
