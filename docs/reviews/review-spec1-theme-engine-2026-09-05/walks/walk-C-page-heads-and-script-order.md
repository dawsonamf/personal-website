# Walk C: page heads and script order (Explore subagent of the thermonuclear reviewer)

All paths below are under `/Users/dawsonamf/Desktop/dax/personal-website/`.

## 1. Head children + all scripts, in document order

**index.html** (head 3–43): meta charset:4, meta viewport:5, title:6, meta description:7, link canonical:8, link icon:9, link apple-touch-icon:10, og:type:11, og:title:12, og:description:13, og:url:14, og:image:15, twitter:card:16, `<!-- Styles -->`:18, css font-awesome:19, boxicons:20, aos.css:21, calendly widget.css:22, css/styles.css:23, mobile-styles.css:24, featured-carousel.css:25, theme-cycler.css:26, **script theme-bootstrap.js:27 (sync)**, `<!-- Scripts -->`:29, gsap:30 defer, jquery:31 defer, jquery-ui:32 defer, aos.js:33 **defer**, vanilla-tilt:34 **sync**, calendly widget.js:35 `type="text/javascript" async`, blog-data.js:36 defer, featured-carousel.js:37 defer, typing-engine.js:38 defer, anim-utils.js:39 **sync**, nav-config.js:40 defer, script.js:41 defer, cursor-follow.js:42 defer. Body: theme-cycler.js:316 defer.

**blog/index.html** (head 3–38): same meta/OG block at 4–16 (canonical:8, blog URLs), then no comment markers: font-awesome:18, boxicons:19, aos.css:20, calendly.css:21, ../css/styles.css:22, mobile-styles.css:23, featured-carousel.css:24, **blog-listing-styles.css:25**, theme-cycler.css:26, theme-bootstrap.js:27 sync, aos.js:29 **sync**, vanilla-tilt:30 sync, calendly widget.js:31 async, blog-data.js:32 **sync**, featured-carousel.js:33 **sync**, typing-engine.js:34 **sync**, anim-utils.js:35 sync, nav-config.js:36 defer, cursor-follow.js:37 defer. Body: blog-listing.js:125 **sync**, theme-cycler.js:126 defer.

**blog/post.html** (head 3–59): charset:4, viewport:5, title:6 ("Loading…"), description:7, icon:8, apple-touch:9 (**no canonical, no OG**), font-awesome:11, boxicons:12, styles.css:13, mobile-styles.css:14, blog-styles.css:15, theme-cycler.css:16, theme-bootstrap.js:17 sync, **highlight.js github-dark.min.css:19 (a stylesheet after a script)**, highlight.min.js:20 sync, marked.umd.min.js:21 sync, mermaid.min.js:22 sync, vanilla-tilt:23 sync, blog-data.js:24 sync, nav-config.js:25 defer, cursor-follow.js:26 defer, inline `<script>`:27–58. Body: blog-post.js:104 sync, theme-cycler.js:105 defer.

**privacy/index.html** (head 3–19): charset:4, viewport:5, title:6, description:7, icon:8, apple-touch:9, `<!-- Styles -->`:11, font-awesome:12, boxicons:13, styles.css:14, mobile-styles.css:15, privacy-styles.css:16, theme-cycler.css:17, theme-bootstrap.js:18 sync. Body: theme-cycler.js:128 defer.

**404.html** (head 3–41): charset:4, viewport:5, title:6, **meta robots noindex:7** (no description), icon:8, apple-touch:9, comment 11–12 (absolute paths for GH Pages), /css/styles.css:13, mobile-styles.css:14, theme-cycler.css:15, theme-bootstrap.js:16 sync, **inline `<style>`:18–40**. Body: theme-cycler.js:69 defer.

**lexchat/index.html** (head 3–12): charset:4, viewport:5, title:6, icon:7, apple-touch:8, lexchat-styles.css:9, theme-cycler.css:10, theme-bootstrap.js:11 sync. Body: iframe:14–16, theme-cycler.js:17 defer.

## 2. `<html>` tag

Identical on all six: `<html lang="en">` at line 2, no inline style in source. At runtime `js/theme-bootstrap.js:704–709` sets `data-style`, optionally `data-still` / `data-no-tilt`, and inline CSS custom properties on `document.documentElement`.

## 3. Nav markup

Nav items are **not static HTML** — every `<ul class="menu-list">` ships empty and is filled by `js/nav-config.js`. Targets are class selectors, not ids: `.moving-menu .menu-list` + `.static-menu .menu-list` get desktop HTML (nav-config.js:123–126); `.static-menu-mobile .menu-list` gets mobile HTML (nav-config.js:127–128). Socials go into ids `socials-list` / `blog-socials-list` (nav-config.js:73; index.html:81, blog/index.html:68) plus `.contact-menu`/`.contact-menu-mobile` (index.html:280–286).

- index.html: `<header>`:47–65 → `.moving-menu`:49–51, `#cursor-container`:52–55, `.header-menu-container`:56–64 (`.name-logo` → `https://www.dawsonamf.com/`:57, `.static-menu`:58–60, `.static-menu-mobile`:61–63).
- blog/index.html: **no `<header>` wrapper**; order differs — `#cursor-container`:42–45 first, then `.moving-menu`:47–49, then `.header-menu-container`:51–59 (`.name-logo` → `../index.html`:52, `.static-menu`:53–55, `.static-menu-mobile`:56–58).

**Theme trigger** (nav-config.js:98–105): `<li class="tc-nav-item">` wrapping a `<button type="button">` — `.tc-nav-item` is the li, the button carries `tc-nav-trigger`. Desktop button class `menu-item tc-nav-trigger`, text "Theme" + `<i class="fa-solid fa-chevron-down tc-nav-caret">`; mobile button class `socials-item tc-nav-trigger`, icon-only `fa-solid fa-palette`. Both get `aria-haspopup="true" aria-expanded="false" aria-controls="tc-dock"`. Pushed onto NAV_LINKS/MOBILE_NAV_LINKS only if `window.__THEME_CYCLER_ENABLED` (nav-config.js:27–30; set true at theme-bootstrap.js:7–8). Desktop it is the last of 7 items; mobile last of 4.

## 4. Head diff summary

Shared spine, all six: DOCTYPE/html/head 1–3, charset+viewport 4–5, title 6, favicon pair, then `theme-cycler.css` → `theme-bootstrap.js` (sync) as the closing pair, then a body-end `theme-cycler.js` defer. That is roughly 8 of 8 tags on lexchat, but only ~8 of 30 on index.html.

- canonical + full OG/twitter block: **index.html:8,11–16 and blog/index.html:8,11–16 only**. post.html, privacy, 404, lexchat have none.
- `meta name="description"`: everywhere except 404.html (which uniquely has `robots noindex`:7) and lexchat.
- font-awesome + boxicons: index, blog, post, privacy — absent on 404 and lexchat (so 404's `<i>` icons, if any, and lexchat get no icon font).
- aos.css/aos.js + calendly widget.css/js: index + blog listing only.
- featured-carousel.css: index:25, blog:24 only.
- gsap/jquery/jquery-ui/script.js: index only (30–32, 41).
- highlight.js CSS+JS, marked, mermaid, inline mermaid config: post.html only (19–22, 27–58).
- Comment markers `<!-- Styles -->`/`<!-- Scripts -->` exist on index (18, 29) and privacy (11) but not blog/index or post.
- **Attribute drift, same script different loading:** aos.js defer (index:33) vs sync (blog:29); blog-data.js defer (index:36) vs sync (blog:32, post:24); featured-carousel.js defer (index:37) vs sync (blog:33); typing-engine.js defer (index:38) vs sync (blog:34). anim-utils.js and vanilla-tilt are sync on both. nav-config.js/cursor-follow.js are defer on all three.
- **Ordering consequence:** nav-config.js is deferred, so it runs *after* the sync body scripts blog-listing.js (blog/index.html:125) and blog-post.js (post.html:104) — those run against un-populated menus.
- Ordering anomaly: theme-cycler.css is the last stylesheet before theme-bootstrap.js everywhere except post.html, where highlight's CSS lands at :19 *after* the script, and 404.html, where the inline `<style>`:18–40 follows theme-bootstrap.js:16.

## 5. blog/post.html mermaid

Inline IIFE in the head, `blog/post.html:27–58`, after the CDN tags. Reads via `getComputedStyle(document.documentElement)` with a `v(name, fallback)` helper: `--secondary` → `#2c2c2c`, `--text` → `#e6f1ff`, `--neutral-gray` → `#a2a2a3` (post.html:38–40). Calls `mermaid.initialize({ startOnLoad: false, theme:'base', ... })`; comment at 28–30 notes diagrams render once so a live theme switch only shows on next load.

marked, highlight.js and mermaid are all **CDN `<script>` tags in the head** (post.html:20–22), sync, not injected by blog-post.js. blog-post.js only consumes the globals (`marked.use` :4, `hljs` :24–27, `mermaid.run` :172) and appends a JSON-LD script (:84–87) plus optional per-post scripts/styles (`loadPostScripts` :113–124, `loadPostStyles` :126+).

## 6. wc -l

index.html 319 · blog/index.html 128 · blog/post.html 107 · privacy/index.html 130 · 404.html 71 · lexchat/index.html 19 · css/styles.css 1010 · css/mobile-styles.css 351 · css/featured-carousel.css 369 · css/theme-cycler.css 887 · blog/blog-styles.css 321 · blog/blog-listing-styles.css 313 · privacy/privacy-styles.css 89 · lexchat/lexchat-styles.css 17.
