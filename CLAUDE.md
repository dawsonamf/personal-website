# dawsonamf.com

Static personal site — plain HTML/CSS/JS, no build step, no package manager.
Deployed via GitHub Pages (CNAME → `www.dawsonamf.com`); push to `main` = deploy.

## Run locally

```bash
python3 -m http.server 8765
```

## Project structure

```
index.html              # Home page
404.html                # Custom 404 (absolute paths — served at any missing URL)
css/
  styles.css            # Site-wide styles (~960 lines, well-sectioned)
  mobile-styles.css     # ≤1100px overrides
  featured-carousel.css # Carousel component
  theme-cycler.css      # Theme switcher UI
  themes/               # Per-skin CSS + shared theme-base.css
js/
  theme-bootstrap.js    # Theme registry (synchronous, pre-paint)
  theme-cycler.js       # Theme switcher logic
  nav-config.js         # Nav links + social links (config-driven)
  blog-data.js          # Blog post + project registry
  script.js             # Home page logic
  featured-carousel.js  # Carousel component
  typing-engine.js      # Masthead typing animation
  anim-utils.js         # Shared animation helpers
  cursor-follow.js      # Cursor follower effect
blog/
  posts/                # Markdown blog posts
  posts/assets/         # Per-post JS/CSS
  blog-post.js          # Client-side markdown renderer
lexchat/                # LexChat — search & chat with the Lex Fridman podcast
12years/                # Anniversary page (standalone, self-contained)
privacy/                # Privacy policy
resources/              # Images, PDFs, media
docs/                      # AI-managed knowledge base + spikes
  TODO.md                  # Planned work
  theme-explorations.html  # Theme architecture docs + design tiles
```

## Key conventions

- **No build step by design.** Every page hand-repeats its boilerplate.
- **Mobile breakpoint: 1100px** — synced across `css/*.css`, `js/script.js`, and `js/featured-carousel.js`.
- **CDN deps are version-pinned.** Never use `@latest`. Curl new URLs to confirm 200 before committing.
- **Nav/social links are config-driven** — edit `js/nav-config.js`, not the HTML.
- **Page-scoped CSS lives beside its page** (e.g. `blog/blog-styles.css`); shared CSS goes in `css/`.
- **Images** at ~2x display size, ≤500 KB, JPEG for photos. Stored in `resources/`.
- **Theme system**: 19 skins, registry in `js/theme-bootstrap.js`, skin sheets scoped under `[data-style="<id>"]`. Full architecture in the HTML comment at the top of `docs/theme-explorations.html`.

## New page checklist

1. `<head>` order: meta charset/viewport → title + description + OG tags → favicon links → third-party CSS → site CSS (`styles.css`, `mobile-styles.css`, page CSS) → `theme-cycler.css` → `<script src="js/theme-bootstrap.js"></script>` **synchronous, not deferred**.
2. End of `<body>`: `<script defer src="js/theme-cycler.js"></script>`.
3. Subdirectory pages: prefix paths with `../`. Exception: `404.html` uses absolute (`/css/...`) paths.

## Blog posts

Markdown files in `blog/posts/` with frontmatter (`title`, `date`, optional `scripts`/`styles` arrays).
Rendered client-side by `blog/blog-post.js`, listed via `BLOG_POSTS` in `js/blog-data.js`.
Per-post JS/CSS assets go in `blog/posts/assets/`. New posts also need a `sitemap.xml` entry.