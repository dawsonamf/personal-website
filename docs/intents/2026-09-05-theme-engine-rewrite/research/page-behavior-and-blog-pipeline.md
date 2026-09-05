# Page behavior, nondeterminism, blog pipeline, canonical DOM

Research for spec 1 (Astro migration + parity harness). Read-only pass over the
repo at `main` (working tree, 2026-09-05). Every claim cites `file:line`.
Anything I could not verify from the repo is marked **unverified**.

---

## 1. Summary for the spec author

1. **All 9 home masthead sequences end in one of two strings** — `Hi,\nI'm Dawson,\nsoftware engineer.` or `Hey,\nI'm Dawson,\nsoftware engineer.` (`js/script.js:129-192`). All 7 listing sequences end in exactly `Blog.` (`blog/blog-listing.js:38-88`). Screenshot the settled end state, never mid-type.
2. **Sequence pick is the only site-code `Math.random` on a screenshot path**: `js/typing-engine.js:165`. Seeding `Math.random` from a Playwright `addInitScript` pins it. Index 3 (`Hi,\n…\nsoftware engineer.`, one `type` step, no delete) settles fastest at ~2550 ms; index 0 is worst case at ~11.65 s.
3. **Intro reveals pin final styles in `animationend`** (`js/anim-utils.js:15-22`), so the settled DOM carries `style="animation: none; visibility: visible; opacity: 1"` (or `transform: translateX(0)`) inline on 8 home elements. A DOM diff must either normalize these or the new build must reproduce them exactly.
4. **The home intro wave is anchored to the typing callback, not to load.** `startAnimations` runs as a `callback` step after the first `type` step (`js/script.js:132`), so absolute settle time = (first-step length x 75 ms) + 2640 ms. The offsets are literal `3.76 - 3`, `3.38 - 3`, `3.04 - 3`, `3.34 - 3`, `4.84 - 3` seconds with `DELAY_ADJUSTMENT = 3` (`js/script.js:7,34,41,48,55,62,70,78,90`).
5. **The jobs highlight bar writes 6 inline props on every move** (`js/script.js:284-301`) and is only first painted on `window.load` (`js/script.js:307-309`). Its `top`/`height` (desktop) and `left`/`width`/`top` (mobile) are measured — viewport- and font-dependent. Pin the viewport and wait for `document.fonts.ready` before screenshotting.
6. **`featured-carousel.js` writes two inline custom props on `<html>`**: `--ticker-run` (a ~1500-char quoted string built from every project's `tech` chips) and `--ticker-dur` (`js/featured-carousel.js:413-414`). Deterministic, but they show up in every DOM diff of `<html>`.
7. **`gsap` 3.9.1 is loaded on the home page and never called.** Only `12years/index.html` uses GSAP, and it loads its own 3.12.5 copy (`index.html:30` vs `12years/index.html:9-10,1199-1262`). Confirms intent §2.
8. **jQuery is used for exactly two things**: the smooth-scroll click handler with jQuery UI's `easeInOutQuad` (`js/script.js:215-252`) and `$('.card').get()` as a VanillaTilt selector (`js/script.js:258`). Timing is `clamp(100 * ln(distance), 300, 1000)` ms (`js/script.js:240-242`).
9. **Five `VanillaTilt.init` call sites, three distinct option sets**, all gated on `window.__styleAllowsTilt()`: `js/script.js:259-267`, `js/script.js:398-405`, `js/featured-carousel.js:193-201`, `blog/blog-listing.js:143-150`, `blog/blog-post.js:183-191`.
10. **`hljs.highlightAuto` is unreachable from today's posts.** All 38 opening fences across `blog/posts/*.md` carry a language; the 7 distinct languages (python, swift, typescript, bash, mermaid, json, javascript, c) are all in hljs's common bundle. Prerendering can use explicit-language highlighting only.
11. **Code block DOM is `<pre><code class="hljs language-<lang>">` with hljs 11.9.0 span markup** (`blog/blog-post.js:25`), plus a `.has-copy-btn` class and an injected `button.code-copy-btn` (`blog/blog-post.js:92-110`). Mermaid fences become `<div class="mermaid">raw</div>` (`blog/blog-post.js:21-23`).
12. **Frontmatter parsing is a hand-rolled line splitter, not YAML** (`blog/blog-post.js:32-48`): first `:` splits key/value, `[a, b]` becomes an array with quote stripping. Note `helm.md` title contains a `:` and survives only because of the "first colon" rule.
13. **Post `scripts` load sequentially after render, `styles` load in parallel before render** (`blog/blog-post.js:114-135, 168, 194-195`). Paths in frontmatter are relative to `blog/` (`posts/assets/...`), which breaks under a `/blog/<id>/` route without rewriting.
14. **Frontmatter and `BLOG_POSTS` disagree on two posts.** `helm.md:2` title vs `js/blog-data.js:150`; `metr-doubling.md:3` date `February 2026` vs `js/blog-data.js:178` `January 2026`. The post page shows the frontmatter values, the listing shows `BLOG_POSTS`. Pick a source of truth explicitly in the spec.
15. **Three orphaned states in the content registry**: `gemma4-heretic-ara` is commented out of `BLOG_POSTS` (`js/blog-data.js:122-129`) but has a live `.md`, sitemap entry and assets; `sitemap.xml:29` lists `color-randomizer`, which has no `.md`; `blog/posts/assets/{cohorts,job-market}-chart.*` + 3 JSONs belong to `docs/planned-posts/ai-job-market.md`, which is not published.
16. **`.tc-toggle` FAB does not exist in JS.** `injectDom()` returns before creating the dock when there is no `.tc-nav-item` (`js/theme-cycler.js:558-559`). `404.html` and `privacy/index.html` load the cycler but get no picker at all. 16 skin sheets carry dead `.tc-toggle` rules. The `docs/theme-explorations.html` comment is wrong here; intent §4.7's "engine injects the floating fallback" is new work, not parity.
17. **`js/theme-cycler.js` `boot()` runs `applyColors()` on every page** (`js/theme-cycler.js:754`), rewriting `--text/--bg/--primary/--secondary/--accent` plus 95 alpha-ramp props inline on `<html>` even on 404/privacy. `theme-bootstrap.js:764-774` already wrote them pre-paint; the values match at default. Normalize `<html style>` in the DOM diff.
18. **`js/cursor-follow.js` starts an uncancellable `requestAnimationFrame` loop** (`js/cursor-follow.js:21-31`) writing `left`/`top` on `.cursor-follow`/`.circle-follow` every frame. The container is `opacity: 0` until the first `mousemove` (`css/styles.css:110`, `js/cursor-follow.js:43-46`) and `display: none` below 1100 px. Never move the mouse in the harness and it stays invisible at `0,0`.
19. **The `--section-rule` scrub loop is rAF-driven and eases at 0.14/frame with a 0.0015 settle threshold** (`js/anim-utils.js:93-94, 237-247`). It writes `--section-rule` to 4 decimals on every `.section-header-wrapper`. Settled = every wrapper's `--section-rule` equals its target and no frame is scheduled.
20. **Mobile breakpoint 1100 appears in JS three times**: `js/script.js:4`, `js/featured-carousel.js:145`, and `blog/blog-listing-styles.css:243` / `css/mobile-styles.css`. `js/featured-carousel.js:145` is inside dead code (see #21).
21. **`EXPAND_VISUAL = false`** (`js/featured-carousel.js:16, 421`), so `setupExpandVisual` and its whole colour/inset/radius scroll scrub never run. The theme-explorations rule about "0 radius is valid" (`--border-radius` parse at `js/featured-carousel.js:135-137`) governs dead code today.
22. **The blog filter uses `display: none` via `.filtered-out`** (`blog/blog-listing.js:165`, `blog/blog-listing-styles.css:189-191`), so filtered cards stay in the DOM and `:nth-child` still counts them — the documented trap is real.
23. **AOS is initialized twice, differently**: `AOS.init()` bare on home (`js/script.js:212`), `AOS.init({ offset: 50 })` on the listing plus an `AOS.refresh()` on every resize (`blog/blog-listing.js:174-178`). Listing cards get `data-aos-delay = i * 50` (`blog/blog-listing.js:131`).
24. **Runtime network fetches on screenshot paths**: the post `.md` itself (`blog/blog-post.js:145`), 3 CORS-proxied / live museum + METR APIs, and 2 raw.githubusercontent CSVs. All must be blocked or stubbed by the runner (details in §2.4).
25. **`js/anim-utils.js` is the only non-deferred site script on `index.html`** (`index.html:39`) — everything else in the head is `defer` and executes in document order. `js/nav-config.js` runs before `js/script.js`, which is why the jQuery `.menu-item` binding finds anchors.

---

## 2. Detailed findings

### 2.1 Per-module contracts, constants and third-party calls

#### `js/script.js` (home page only, `defer`, `index.html:41`)

Purpose: home intro wave, smooth scroll, card tilt, jobs tab panel, home blog rail.

Constants (`js/script.js:4-7`):
- `MOBILE_BREAKPOINT = 1100`
- `TYPING_DELAY = 75`
- `ANIMATION_DURATION = 500` (jobs swap)
- `DELAY_ADJUSTMENT = 3` (subtracted from every hard-coded delay)

Once-per-load guards: `heroChromeIn` (`:14,17-18`) and `subTextIn` (`:109,112-113`) — the typing sequence's callbacks are re-fired on live theme switches (`js/typing-engine.js:637-639`) and must not re-animate.

`startAnimations()` (`:16-105`) adds `hero-extras-in` to `<html>` (`:24`) then writes, on each element, `style.animation`, `style.animationDelay`, `style.animationFillMode = "forwards"` and registers `persistAfterAnimation`:

| Element | selector | animation | delay (computed) | pinned final styles |
|---|---|---|---|---|
| static menu | `.static-menu` | `fadein 0.8s ease-out` | `0.76s` | `visibility: visible; opacity: 1` |
| name logo | `.name-logo` | `fadein 0.8s ease-out` | `0.38s` | same |
| typing container | `#typing-container` | `slidein 0.8s ease-out` | `0s` | `transform: translateX(0)` |
| socials | `#socials-list` | `fadein 0.8s ease-out` | `0.76s` | `visibility/opacity` |
| mobile menu | `.static-menu-mobile` | `fadein 0.8s ease-out` | `0.76s` | `visibility/opacity` |
| about card | `.double-view-left` | `slideInLeft 1.5s ease-out` | `0.04s` | `visibility: visible; transform: translateX(0)` |
| skills card | `.double-view-right` | `slideInRight 1.5s ease-out` | `0.34s` | same |
| about h2 + spacer | `#about-header-wrapper .section-header`, `.section-header-spacer` | `fadein 0.8s ease-out` | `1.84s` | `visibility/opacity` |

Plus `setTimeout(() => window.revealSectionHeader(aboutHeaderWrapper), 1840)` (`:101-103`).
Keyframes: `slidein` `css/styles.css:363`, `slideInLeft` `:368`, `slideInRight` `:373`, `fadein` `:402`.

`fadeInSubText()` (`:111-122`): `#sub-text`, `fadein 0.8s ease-out`, delay `0.01s`, pinned `visibility/opacity`. Wired to `onNewlineCount: { count: 2 }` (`:204-207`) — fires when the second `<br>` lands, i.e. after `Hi,\nI'm Dawson,\n`.

`AOS.init()` bare (`:212`) — AOS 2.3.1 defaults (duration 400, easing `ease`, offset 120, once false). Per-element `data-aos-once="true"` overrides `once`.

jQuery smooth scroll (`:215-252`):
- Bound to `.menu-item`; early-returns for `.resume-link`, `.blog-page-link`, `.tc-nav-trigger` (`:219`).
- Offsets: `#project-header-static` 60, `#blog-header-static` 60, `#contact` 80, default 40 (`:225-237`).
- `timing = clamp(100 * Math.log(distance), 300, 1000)` (`:240-242`).
- `$('html, body').animate({scrollTop: …}, timing, 'easeInOutQuad')` (`:244-250`) — the only jQuery UI dependency.

VanillaTilt on `.card` (`:255-268`), gated on `window.__styleAllowsTilt()` (`:257`):
`{ max: 10, speed: 7500, perspective: 1250, scale: 1.02, glare: false, "max-glare": 0.3, gyroscope: true }`.
`.card` is on `#typing-image` (`index.html:75`) and `.contact-image-wrapper` (`index.html:290`).

`initJobsMenu()` (`:271-370`):
- Requires `#jobs-menu-list`, `#highlight`, `.menu li.selected`, optional `.menu-scroll-wrapper`.
- `moveHighlight(target, animate)` (`:283-302`) writes inline `transition` = `"top 0.3s, height 0.3s, left 0.3s, width 0.3s, border-radius 0.3s"` or `"none"`, then:
  - mobile (`innerWidth <= 1100`): `left = target.offsetLeft - scrollWrapper.scrollLeft`, `width = target.offsetWidth`, `top = jobsMenuList.offsetTop + jobsMenuList.offsetHeight`, `height = "2px"`, `borderRadius = "0"`.
  - desktop: `top = target.offsetTop`, `height = target.offsetHeight`, `left = "-3px"`, `width = "3px"`, `borderRadius = "6px"`.
- Listeners: `window resize` (`:304`), `window load` (`:307`) — the first paint is on `load`, not DOMContentLoaded; `ResizeObserver` on the list and each `li` with the first delivery skipped (`:314-325`); `.menu-scroll-wrapper` `scroll` (`:326-331`).
- Click handler (`:333-369`): `li` only, guarded by `isAnimating`. Swaps `.selected`, then `currentlyShowing.classList.add('job-out-right')`; at +500 ms removes `job-out-right`/`showing`, adds `hidden`; at +500 ms un-hides the new panel with `job-in-right`; at +1000 ms swaps `job-in-right` for `showing`. Two nested `setTimeout(…, 500)` (`:351,360,363`).
- CSS: `.job-out-right { transform: translateX(1100px); transition: transform 0.5s ease-in-out }` (`css/styles.css:710-713`), `.job-in-right { animation: jobSlideInRight 0.5s forwards ease-in-out }` (`:714-721`).

Module body order (runs at defer time, before DOMContentLoaded): `AOS.init()` → jQuery ready registrations → `initJobsMenu()` (`:375`) → `initFeaturedCarousel({isSubpage:false})` (`:377`) → `runHomeTypingSequence()` (`:379`).

`renderBlogCards()` + `setupBlogScrollFade()` run on `DOMContentLoaded` (`:432-435`).
- Card markup (`:388-394`): `<a class="blog-card" href="{url}"[ target=_blank rel=noopener noreferrer]><h3 class="blog-card-title">…</h3><p class="blog-card-date">…</p><p class="blog-card-excerpt">…</p></a>`. No tags on the home rail.
- Tilt on `.blog-card` (`:398-405`): `{ max: 8, speed: 400, perspective: 1200, scale: 1.02, glare: false, gyroscope: false }`.
- Fades (`:409-430`): writes `opacity` `'0'`/`'1'` on `.blog-scroll-fade-left/-right`, threshold 5 px (`:420-421`); listens `track scroll` + `window resize`.

#### `js/anim-utils.js` (non-deferred, `index.html:39`, `blog/index.html:35`)

Two globals: `persistAfterAnimation` (`:15-22`) and `animateThenPersist` (`:24-30`). `persistAfterAnimation` filters on `e.target !== el` (`:17`) so descendant animations don't fire it, then sets `animation: 'none'` and `Object.assign(el.style, finalStyles)` (`:19-20`). Also exposes `window.revealSectionHeader` (`:351`).

Section-header scrub IIFE (`:87-357`):
- `GLYPH_SKINS = { marquee: true }` (`:90`)
- `REVEAL_MARGIN = '0px 0px -12% 0px'` (`:92`), `EASE = 0.14` (`:93`), `SETTLED = 0.0015` (`:94`)
- `IntersectionObserver(..., { rootMargin: REVEAL_MARGIN, threshold: 0.1 })` (`:321-335`)
- `MutationObserver` on `<html>` `attributeFilter: ['data-style']` → `resplit()` (`:301-306`)
- `prefers-reduced-motion` or no `IntersectionObserver` → every header immediately `section-header-in` and `--section-rule: 1` (`:308-319`)
- `now()` uses `performance.now()` (`:100-102`); `readInMs` reads `--header-in-ms` off the wrapper (`:179-182`)
- Scrub math (`:209-228`): `travel = vh/2 + box.height`, `p = (vh - box.top) / travel`, clamped; the written value is `min(p, titleProgress)`
- DOM it creates: `span.section-header-text` inside each `.section-header` (`:136-137,172`), and under `marquee` additionally `span.section-header-word` + one `span.section-header-glyph` per char carrying `--glyph-i` / `--glyph-r` (`:139-160`). Original `h2` text is stashed on `h2.__headerText` (`:120-126`).
- Every `.section-header-wrapper` gets inline `--section-rule` from init (`:293`) and each tick (`:244`).
- `data-header-intro` wrappers are excluded from the initial observe (`:341`) and join on `revealSectionHeader` (`:264-267`).

#### `js/typing-engine.js` (`defer`, home `index.html:38`; listing `blog/index.html:34`)

Globals read: `window.__styleTypingMode` (`:99`), `window.__styleTypingDeleteMode` (`:109`). Global written: `window.__restartTypingSequence` (`:637`). Statics on the function: `_activeRun`, `_lastConfig`, `_reserve`, `_resizeBound` (`:85-88, 305-307`).

Constants: default `typingDelay` 75 / `deleteDelay` 40 (`:76-77`), `ERASE_MS = 300` (`:113`), default pause 800 (`:380`).

**Nondeterminism**: `const steps = sequences[Math.floor(Math.random() * sequences.length)]` (`:165`).

DOM it creates in `#typing-text` / `#blog-typing-text`:
- cursor mode: bare text nodes + `<br>`, plus `span.cursor` as the trailing anchor (`:170-177`); glyphs after the 2nd newline go in `span.typing-accent` which *accumulates* characters (`:436-445`).
- letter/word modes: `span.tw` per glyph (`+ typing-accent` after the 2nd newline, `:337`), grouped into `span.tw-word` (`:148-153`, nowrap via `css/styles.css:321-323`), spaces stay bare text nodes, and the anchor is `span.tw-anchor` holding `​` (`:174-175`).
- Deleting glyphs get `.tw-out` and linger 300 ms in a `draining` Set before removal (`:120-131, 594-595`).

`reserveHeight()` (`:233-262`): clones the element (`cloneNode(false)`, keeps the id), inserts it after the real one, fills each planned state, takes the tallest `getBoundingClientRect().height`, then writes **inline `min-height` on the headline** (`:261`). Re-runs on `document.fonts.ready` (`:270-272`), on every `link[data-style-asset]` `load` (`:292-299`), on `window load` if not complete (`:300-304`), and on `window resize` (bound once, `:306-311`).

Cursor blink: inline `animation: 'blink 1s infinite'` or `'none'` (`:316-318`), keyframe at `css/styles.css:310-312`, base `.cursor` at `:300-308`.

`insertBreak()` increments `newlineCount` and fires `onNewlineCount.callback` once (`:320-333`).

#### `js/featured-carousel.js` (`defer` home `index.html:37`; sync listing `blog/index.html:33`)

Module constants: `FEATURED_STYLE = 'floating'` (`:15`), `EXPAND_VISUAL = false` (`:16`).
Reads `window.FEATURED_PROJECTS`; requires `#featured-carousel`, `#featured-track`, `#featured-dots`, `.featured-carousel-fade-left/-right`. Exposes `window.initFeaturedCarousel` (`:417-426`).

`renderFeaturedCarousel(isSubpage)` (`:59-92`): adds `fc-style-floating` to the section (`:65`), then per project emits
`div.fc-card > div.fc-card-image > img` + `div.fc-card-body > h3.fc-card-title, p.fc-card-desc, div.fc-card-tech > span.pill*, [div.fc-card-ctas > a.fc-card-cta*]` (`:83-90`).
When `isSubpage` is false it strips a leading `../` from `image`, `url`, `url2` (`:71-73`). Alt text is the project title (`:84`). `description` is injected as raw HTML (contains `<br><br>`).

`initCarouselTilt()` (`:187-202`) on `.fc-card-image`, gated (`:190`):
`{ max: 8, speed: 6000, perspective: 1200, scale: 1, glare: true, "max-glare": 0.15, gyroscope: true }`.

`setupCarouselFades()` (`:239-257`): writes `opacity` `'0'`/`'1'`, 5 px threshold (`:251-252`), `scroll` passive.

`setupCarouselDots()` (`:259-295`): `<button class="fc-dot[ active]" data-index="i" aria-label="Go to slide i+1">` (`:266`); click centres via `track.scrollTo({ behavior: 'smooth' })` (`:283-286`); a `scroll` listener sets `.active` from `getClosestCardIndex` (`:289-294`).

`setupVerticalWheelGuard()` (`:297-358`): `VERTICAL_RATIO = 1.15`, `HORIZONTAL_RATIO = 1.25`, `GESTURE_END_MS = 140` (`:301-303`). A vertical gesture adds `is-vertical-wheeling` to the track and pins `scrollLeft` back on a rAF (`:314, 317-324`). Passive wheel listener (`:357`).

`buildTickerRun()` (`:388-415`), always runs: `TICKER_SEP = '✷'` (`:376`), `TICKER_PASSES_PER_HALF = 2` (`:382`), `TICKER_CHARS_PER_SEC = 402 / 46` (`:386`). Dedupes `tech` case-insensitively, keeps authored casing, escapes `\` and `"`, writes `--ticker-run` (the run twice) and `--ticker-dur` (rounded seconds) **on `document.documentElement`** (`:412-414`).

Dead code today (`EXPAND_VISUAL === false`, `:421`): `applyExpandVisualShell` (`:94-120`) which would insert `#fc-expand-visual` and reparent the section, and `setupExpandVisual` (`:122-185`) with its `0.45/0.45` header ramp (`:144`), `1100 px` inset switch (`:145`), `0.92→1` scaleY (`:148`), `0.82`/`0.34` viewport-height scroll window (`:165-167`) and the `--border-radius` NaN guard (`:135-137`).

#### `js/cursor-follow.js` (`defer`, home/listing/post)

Requires `.cursor-follow`, `.circle-follow`, `#cursor-container`. Lerp factors 0.25 (circle) and 0.6 (dot), both centred by half-size (`:22-25`). Writes inline `left`/`top` in px every frame forever (`:26-31`) — **never settles**. Hover selectors `'a, button, .job-menu-item'` toggle `.cursor-follow-clickable` (`:35-41`). First `mousemove` sets `#cursor-container` `opacity: '1'` once (`:43-46`); base is `opacity: 0` (`css/styles.css:110`) and hidden below 1100 px (`blog/blog-listing-styles.css:244-245` and the mobile sheet).

#### `js/nav-config.js` (`defer`, before `script.js`)

`isSubpage = pathname.indexOf('/blog') !== -1` (`:4`) — path-based, will need rethinking under `/blog/<id>/` and `/<theme>/blog/`.
Writes `window.NAV_CONFIG` (`:7-22`) with `NAV_LINKS` (About, Experience, Projects, Blog, Contact, Resume), `MOBILE_NAV_LINKS` (Email, Blog, Resume) and `SCROLL_THRESHOLD = 300` (`:21`). Appends a `Theme` entry to both when `window.__THEME_CYCLER_ENABLED` (`:27-30`).
`window.SOCIAL_LINKS` (`:49-56`): LinkedIn, X, Messenger, Email, Contact card, Schedule a call (`isCalendly`).
Renders into `.moving-menu .menu-list`, `.static-menu .menu-list` (identical HTML), `.static-menu-mobile .menu-list`, `#socials-list`, `#blog-socials-list`, `.contact-menu .menu-list`, `.contact-menu-mobile .menu-list` (`:65-93, 120-130`).
Nav item markup (`:95-116`): `<li><a class="menu-item[ resume-link| blog-page-link]" …>` with `<li><span class="menu-spacer"></span></li>` between items (not after the last). Theme trigger: `<li class="tc-nav-item"><button class="menu-item tc-nav-trigger" aria-haspopup aria-expanded="false" aria-controls="tc-dock">Theme<i class="fa-solid fa-chevron-down tc-nav-caret"></i></button></li>` (`:101-105`); mobile variant uses `socials-item` + a palette icon.
Calendly: URL built at click time from `--bg`/`--text`/`--primary` (`:38-48`), `Calendly.initPopupWidget({url})` (`:138`) — a **live third-party call**.
Sticky header (`:143-163`): `menu-invisible` below `300/3 = 100` px, `menu-sticky` when scrolling up past 300.

#### `blog/blog-listing.js` (end of body, `blog/index.html:125`)

`TYPING_DELAY = 75` (`:4`), `deleteDelay: 40` (`:37`).
`onBlogTypingComplete()` (`:7-32`) — fired from the `callback` step after the first `type` step, delays relative to that moment: `#blog-sub-text` 0.01s, `#blog-sub-text-2` 0.08s, `#blog-sub-text-3` 0.12s, `#blog-socials-list` 0.15s, `.name-logo` 0.38s, `.static-menu` 0.76s, `.static-menu-mobile` 0.76s — all `fadein 0.8s ease-out`. `#selected-works-header .section-header` gets `slideInUp 0.8s ease-out` at 0.25s pinned to `opacity: 1; transform: translateY(0)`, its spacer `fadein` at 0.25s, plus `setTimeout(revealSectionHeader, 250)` (`:15-20`). `#featured-carousel .featured-carousel-container` and `.featured-carousel-dots` get the same `slideInUp` at 0.25s (`:27-31`). Keyframe `slideInUp` at `blog/blog-listing-styles.css:233-236`; base state `opacity:0; translateY(60px)` at `:222-231`.
Filter bar (`:99-119`): `<button class="filter-pill" data-tag="{tag}">`; tags are `[...new Set(posts.flatMap(p => p.tags))].sort()` (`:94`), toggling `.active` and calling `applyFilters()`.
Cards (`:123-152`): `<div class="blog-card-wrapper" data-tags="a,b" data-aos="fade-up" data-aos-once="true" data-aos-delay="{i*50}"><a class="blog-card" href=…><h3 class="blog-card-title"><p class="blog-card-date"><p class="blog-card-excerpt"><div class="blog-card-tags"><span class="pill">…</a></div>`. `blog/` prefix is stripped from internal urls (`:130`). Tilt `{max:8, speed:400, perspective:1200, scale:1.02, glare:false, gyroscope:false}` (`:143-150`).
`applyFilters()` (`:156-167`) toggles `.filtered-out` (OR across active tags).
Init order (`:171-178`): `initFeaturedCarousel({isSubpage:true})` → `renderFilterBar()` → `renderCards()` → resize→`AOS.refresh()` → `AOS.init({offset: 50})`. Note AOS initializes *after* the cards exist.

#### `blog/blog-post.js` (end of body, `blog/post.html:104`) — see §5.

#### `js/theme-cycler.js` (`defer`, end of body on all themed pages)

Gate: returns immediately unless `window.__THEME_CYCLER_ENABLED` (`:5`).
`boot()` (`:747-770`) → `restore()` (unless reload) → `injectDom()` → `applyColors()` → `renderSchemes()` → `renderPresets()` → `idle(loadAllFonts, {timeout: 2500})` with an 800 ms `setTimeout` fallback (`:761-762`), which appends **every registry theme's Google Fonts links** to `<head>` (`:370-387`).
`injectDom()` (`:507-577`) builds `aside#tc-dock.tc-dock.tc-mega.tc-hidden` and `div#tc-scrim.tc-scrim`, both appended to `<body>`, **but only if `document.querySelectorAll('.tc-nav-item').length` is non-zero** (`:558-559`).
`applyColors()` (`:178-200`) writes 5 role vars + 5x19 alpha steps inline on `<html>`, then dispatches `new CustomEvent('dawson:palette')` on `window` (`:191`).
Dropdown (`:589-743`): `MEASURE = 940`, `EDGE = 10` (`:596-597`); `canHover = matchMedia('(hover: hover) and (pointer: fine)')` (`:594`); open writes inline `top`, `right`, `--tc-mega-w`, `--tc-mega-target` (`:623-626`) and forces a reflow with `void dock.offsetWidth` (`:647`); close hides after 440 ms (`:674-676`); hover-close timers 300 ms (`:706, 723`). `Escape` closes (`:740-742`). Space randomizes while open (`:764-769`).
`switchStyle(id)` navigates to `/?style=<id>` (`:276`) — a full page load.

#### `js/theme-bootstrap.js` (synchronous, in `<head>` on every themed page)

`THEME_CYCLER_ENABLED = true` (`:7`) → `window.__THEME_CYCLER_ENABLED` (`:8`).
Registry keys (16, all in `ORDER`): default, studio, brutalist, broadsheet, field-notes, blueprint, doodle, wheatpaste, bauhaus, chinoiserie, banknote, grid, gallery, miami-deco, neo-pop, marquee (`:16-561`, `ORDER` at `:637`). `css/themes/{constructivist,space,vapor,wanted}.css` exist but have no registry entry — confirms intent §2.
Globals written: `__THEME_REGISTRY`, `__THEME_ORDER` (`:639-640`), `__styleAllowsTilt` (`:646`), `__styleTypingMode` (`:654`), `__styleTypingDeleteMode` (`:664`), `__ACTIVE_STYLE` (`:700`).
Reload detection via `performance.getEntriesByType('navigation')[0].type === 'reload'` (`:674-678`) — **a nondeterminism source for the harness** (see §2.4).
Style resolution (`:684-698`): `?style=` wins, else sessionStorage (`dawson-style`), cleared on reload.
Applies (`:703-722`): `data-style`, `data-still`, `data-no-tilt` on `<html>`; token custom props inline; appends `link[data-style-asset]` for fonts, then `/css/themes/theme-base.css`, then the skin sheet.
Colour ramps (`:764-774`): for each of 5 roles writes `--<role>` plus 19 `--<role><N>` `hsla()` steps inline on `<html>` (`STEPS` at `:671`). **95+5 inline custom props on `<html>` on every page, always** — the DOM diff must normalize `<html style>`.

### 2.2 Load order and sync/defer

`index.html:19-42` head order (execution order for the deferred set is document order):
1. sync: `vanilla-tilt` (`:34`), `js/theme-bootstrap.js` (`:27`), `js/anim-utils.js` (`:39`)
2. async: Calendly widget (`:35`)
3. defer, in order: gsap → jquery → jquery-ui → aos → `blog-data.js` → `featured-carousel.js` → `typing-engine.js` → `nav-config.js` → `script.js` → `cursor-follow.js`
4. `js/theme-cycler.js` deferred at end of body (`:316`) — last.

Hard dependencies this creates:
- `script.js` calls `AOS.init`, `$`, `VanillaTilt`, `initFeaturedCarousel`, `startTypingSequence`, `persistAfterAnimation`, `animateThenPersist`, `window.revealSectionHeader`, `window.BLOG_POSTS` — all must exist first.
- `nav-config.js` must run before `script.js` so `.menu-item` anchors exist for the jQuery binding.
- `anim-utils.js` is non-deferred so both deferred and end-of-body scripts can use it (`js/anim-utils.js:12-13`).
- `theme-bootstrap.js` must be synchronous and pre-paint (`js/theme-bootstrap.js:1-3`).

`blog/index.html:29-37`: aos, vanilla-tilt sync; Calendly async; `blog-data.js`, `featured-carousel.js`, `typing-engine.js`, `anim-utils.js` **all sync**; `nav-config.js`, `cursor-follow.js` deferred. `blog-listing.js` at end of body (`:125`), `theme-cycler.js` deferred after it (`:126`). No jQuery, no gsap on the listing.

`blog/post.html:19-26`: hljs css + hljs, marked, mermaid, vanilla-tilt, `blog-data.js` all sync; `nav-config.js`, `cursor-follow.js` deferred; an inline mermaid `initialize` block (`:27-58`) reading CSS vars; `blog-post.js` at end of body (`:104`), then deferred `theme-cycler.js` (`:105`). No AOS, no jQuery, no typing engine, no `anim-utils.js` on post pages.

### 2.3 Inline style writes (what a DOM diff sees)

On `<html>`: 5 role vars + 95 alpha steps (bootstrap `:764-774`, rewritten by cycler `:179-186`); registry `tokens` under a skin (`:707-711`); `--ticker-run` + `--ticker-dur` (`featured-carousel.js:413-414`); `class="hero-extras-in"` on home (`script.js:24`).

On elements:
- 8 home intro elements: `animation: none` + pinned `visibility`/`opacity`/`transform` (`anim-utils.js:19-20`).
- 7 listing elements + 3 carousel/header nodes: same (`blog-listing.js:8-31`).
- `#highlight`: `transition`, `top`, `height`, `left`, `width`, `border-radius` (`script.js:284-301`).
- `#typing-text` / `#blog-typing-text`: `min-height` (`typing-engine.js:261`).
- `span.cursor`: `animation` (`typing-engine.js:317`).
- Every `.section-header-wrapper`: `--section-rule` (`anim-utils.js:244, 293`).
- Under `marquee` only: `--glyph-i`, `--glyph-r` on every glyph span (`anim-utils.js:156-157`).
- `.blog-scroll-fade-*` and `.featured-carousel-fade-*`: `opacity` (`script.js:423-424`, `featured-carousel.js:251-252`).
- `.cursor-follow` / `.circle-follow`: `left`/`top` per frame; `#cursor-container`: `opacity` after first mousemove.
- Every VanillaTilt target: `transform: perspective(...)` etc. written by the library on hover; `will-change`/`transition` on init. **Unverified** exactly which props vanilla-tilt 1.7.0 writes at rest — worth confirming against the built site during harness bring-up.
- `#tc-dock`: `top`, `right`, `--tc-mega-w`, `--tc-mega-target` when opened; `--i` on `.tc-stagger` children (`theme-cycler.js:360`).

### 2.4 Nondeterminism inventory and how to pin it from outside

| # | Source | file:line | What varies | Pin from the runner |
|---|---|---|---|---|
| 1 | Typing sequence pick | `js/typing-engine.js:165` | Which of 9 (home) / 7 (listing) sequences runs; total duration 2.5-11.7 s; `min-height` on mobile | `page.addInitScript` replacing `Math.random` with a seeded PRNG **before** any script runs |
| 2 | Palette toy randomize | `js/theme-cycler.js:59, 106, 114, 255, 258` | Only after clicking Shuffle | Same seeded PRNG; or never click Shuffle |
| 3 | `heretic-ara-charts.js` scatter jitter | `blog/posts/assets/heretic-ara-charts.js:158-171` | Point cloud positions in the Pareto chart | Same seeded PRNG (post is unlisted; still reachable by `?id=`) |
| 4 | `underviewed-art.js` random object pick + shuffle | `:14, 62, 87, 101, 106, 133, 155, 160` | Entire gallery content | Block/stub the 4 museum APIs and seed `Math.random`; expect the error state |
| 5 | Cache-buster with `Date.now()` | `blog/posts/assets/underviewed-art.js:87` | Query string | Freeze `Date.now` in the init script |
| 6 | `performance.now()` scrub clock | `js/anim-utils.js:101` | `--section-rule` value mid-ease | Wait for settle (see §3) rather than freezing |
| 7 | Reload detection | `js/theme-bootstrap.js:674-678` | `nav.type === 'reload'` clears the style session | Always `page.goto` (navigate), never `page.reload`, for themed URLs |
| 8 | `sessionStorage` (`dawson-style`, `dawson-theme-cycler`) | `js/theme-bootstrap.js:669-670, 687-696, 728-741` | Style/palette carried between navigations | Fresh browser context per screenshot, or `?style=<id>` on every URL |
| 9 | Post `.md` fetch | `blog/blog-post.js:145` | Whole post body; race with `DOMContentLoaded` | Serve locally; wait on `#post-content` having children + `#read-time` non-empty |
| 10 | METR YAML via corsproxy.io | `blog/posts/assets/metr-chart.js:204, 216` | Live data vs baked `FALLBACK_DATA` (`:5-30+`) | **Route-abort the request** → the `.catch` deterministically uses `FALLBACK_DATA` (`:228-231`) |
| 11 | Indeed hiring-lab CSVs | `blog/posts/assets/job-market-chart.js:8-9` | Live daily data | Not on any published post today; block anyway |
| 12 | Local JSON snapshots | `job-market-chart.js:12`, `cohorts-chart.js:717-723` | Deterministic per commit (refreshed weekly by `.github/workflows/refresh-chart-data.yml`) | Pin the worktree commit; both sides read the same files |
| 13 | Museum APIs (Met, Cleveland, V&A, Getty) | `underviewed-art.js:38, 84, 127, 146` | Live images | Route-abort; screenshot the error/loading state, or exclude this post |
| 14 | Calendly widget | `blog/index.html:31`, `index.html:35`, `js/nav-config.js:138` | External script, popup on click | Block `assets.calendly.com` for screenshots; only exercise the click if the popup is in scope |
| 15 | Plotly CDN | frontmatter, `blog/posts/*.md:4` | External script | Serve locally or block; unpinned in-page render otherwise |
| 16 | Google Fonts (all themes, idle) | `js/theme-cycler.js:370-387, 761-762` | Late layout shift; 800-2500 ms after boot | Wait for `document.fonts.ready` **after** the idle callback has run, or block fonts and pin metrics |
| 17 | `requestIdleCallback` | `js/theme-cycler.js:761` | When the fonts land | Wait on `document.fonts.status === 'loaded'` |
| 18 | rAF loops | `cursor-follow.js:30`, `anim-utils.js:247`, `featured-carousel.js:174, 324` | Never-ending (cursor) vs settling (scrub) | Don't move the mouse; assert on `--section-rule` values |
| 19 | `ResizeObserver` on the jobs menu | `js/script.js:314-325` | Re-seats `#highlight` after late fonts / theme switch | Wait for `document.fonts.ready` before reading `#highlight` |
| 20 | `IntersectionObserver` | `js/anim-utils.js:321-335`; AOS internally | Which headers/AOS elements have fired depends on scroll + viewport | Fixed viewport, screenshot `fullPage` only after scrolling through once, or screenshot per-section with explicit waits |
| 21 | Viewport-dependent measurement | `script.js:290-299` (highlight), `typing-engine.js:233-262` (min-height), `theme-cycler.js:614-627` (dock), `featured-carousel.js:209-237` (dot index) | Everything geometric | Fixed `viewport: {width: 1440\|390, height: …}` and `deviceScaleFactor` |
| 22 | `matchMedia('(hover: hover) and (pointer: fine)')` | `js/theme-cycler.js:594` | Hover-open behavior of the theme menu | Set `hasTouch`/`isMobile` explicitly per project; use click, not hover, to open |
| 23 | `prefers-reduced-motion` | `anim-utils.js:308-309`, `featured-carousel.js:138`, `underviewed-art.js:5-6` | Skips the whole scrub/ramp path | `page.emulateMedia({ reducedMotion: 'no-preference' })` explicitly |
| 24 | Copy-button timer | `blog/blog-post.js:106` | 1500 ms `.copied` class | Only if the harness clicks copy |
| 25 | Read time | `blog/blog-post.js:176-179` | Deterministic given the same rendered text | None needed, but it depends on `innerText` so it is layout-adjacent — **unverified** whether it changes with wrapping (it uses `\s+` split, so no) |

### 2.5 Home masthead: exact per-sequence timings

`typingDelay = 75`, `deleteDelay = 40` (`js/script.js:127-128`). Callback (`startAnimations`) fires immediately after the first `type` step.

| idx | first type step | chars | to callback | total to settle | final text |
|---|---|---|---|---|---|
| 0 | `Hi,\nI'm Dawson,\nweb developer.` | 30 | 2250 ms | ~11 650 ms | `Hi,…software engineer.` |
| 1 | `…full stack engineer.` | 35 | 2625 | ~5 775 | `Hi,…` |
| 2 | `Hey,…software engineer.` | 35 | 2625 | 2 625 | `Hey,…` |
| 3 | `Hi,…software engineer.` | 34 | 2550 | 2 550 | `Hi,…` |
| 4 | `Hey,…builder.` | 25 | 1875 | ~5 045 | `Hey,…` |
| 5 | `Hi,…builder.` | 24 | 1800 | ~4 970 | `Hi,…` |
| 6 | `Hey,…builder.` | 25 | 1875 | ~5 045 | `Hey,…` |
| 7 | `Hi,…builder.` | 24 | 1800 | ~4 970 | `Hi,…` |
| 8 | `Hey,…agentic engineer.` | 34 | 2550 | ~6 080 | `Hey,…` |

(Times exclude timer drift; `later()` is `setTimeout`, so real runs are longer.)

Listing (`blog/blog-listing.js:38-88`): 7 sequences, first-step lengths 12-26 chars, totals ~2 555-4 165 ms, **all ending in exactly `Blog.`**.

---

## 3. Settling recipe per page type

Global preconditions for every screenshot, both viewports:
`page.emulateMedia({reducedMotion: 'no-preference'})`; seeded `Math.random` init script; no mouse movement before the shot (keeps `#cursor-container` at `opacity: 0`); wait for `document.fonts.ready`; wait for `window.__tcFontsIdleDone`-equivalent — since there is no such hook, wait ~2.6 s past `load` or assert `document.fonts.status === 'loaded'` after the cycler's idle fonts land (`js/theme-cycler.js:761-762`).

### Home (`/`), desktop 1440 and mobile 390

Order of animations at load:
1. `theme-bootstrap.js` stamps `<html>` (pre-paint).
2. Deferred body of `script.js`: `AOS.init()`, `initJobsMenu()`, `initFeaturedCarousel()` (cards + dots + ticker vars land here), `runHomeTypingSequence()` → `reserveHeight()` writes `min-height`, typing begins.
3. `DOMContentLoaded`: `anim-utils` init (splits headers, observes), jQuery ready (smooth-scroll binding, `.card` tilt), `renderBlogCards()` + `setupBlogScrollFade()`, cycler `boot()` (injects `#tc-dock`, `#tc-scrim`, rewrites `<html>` vars, dispatches `dawson:palette`).
4. Typing reaches 2 newlines → `#sub-text` fades (0.8 s).
5. First type step done → `startAnimations()`: the 8-element wave, last ending at callback + 2.64 s.
6. `window.load` → `moveHighlight(selected, true)` first paints `#highlight`; `ResizeObserver` may re-seat it after late fonts.
7. Typing runs its remaining pause/delete/type steps; on completion the caret gets `animation: blink 1s infinite`.
8. AOS stamps `aos-animate` on whatever is in view; scrolling stamps the rest.

**Settled condition (checkable, no site hooks):**
- `#typing-text` `textContent` (with `<br>` as `\n`) equals one of the two terminal strings **and** `#typing-text .cursor` has computed `animation-name === 'blink'` (cursor mode) — this is the unambiguous "sequence finished" signal (`js/typing-engine.js:369`).
- All 8 intro elements have inline `animation: none` (i.e. `el.style.animation === 'none'`), which only happens in the `animationend` handler (`js/anim-utils.js:19`).
- `#highlight` has a non-empty inline `top` and `height` (desktop) / `left` and `width` (mobile).
- `#featured-track` has `FEATURED_PROJECTS.length` `.fc-card` children and `#featured-dots` the same number of `.fc-dot`, with exactly one `.active`.
- `#blog-scroll-track` has `BLOG_POSTS.length` `.blog-card` children.
- `document.documentElement.style.getPropertyValue('--ticker-run')` is non-empty.
- Every `.section-header-wrapper` has `--section-rule` whose value has stopped changing across two rAFs.
- If asserting AOS: count elements with `[data-aos]` that are within the viewport and require all of them to carry `aos-animate`. There are 6 `[data-aos]` elements authored on home (`index.html:138, 214, 241, 262, 269, 291`).

**Screenshot the masthead in the terminal state, seeded to sequence index 3** (`Hi,\nI'm Dawson,\nsoftware engineer.`): shortest run, single `type` step, no delete drain, and its planned-height set is a single 3-line state so `min-height` is unambiguous. If the spec prefers exercising the delete path too, take a second shot seeded to index 0. Do **not** screenshot mid-type.

Total worst-case wait with seed 3: ~2.6 s typing + 2.64 s wave + fonts idle. Budget 6 s with the settle assertions as the real gate.

### Blog listing (`/blog/`)

1. Sync scripts run at parse; `blog-listing.js` at end of body starts typing immediately, then `initFeaturedCarousel({isSubpage:true})`, `renderFilterBar()`, `renderCards()`, `AOS.init({offset:50})`.
2. `DOMContentLoaded`: `anim-utils` init, `nav-config` (deferred) renders menus, cycler boot.
3. First type step done → `onBlogTypingComplete()` wave; last element ends at callback + 1.56 s.
4. Typing settles at `Blog.` (all sequences).

**Settled:** `#blog-typing-text` textContent === `Blog.` and the caret is blinking; the 10 `animateThenPersist` targets carry inline `animation: none`; `#filter-bar` has `allTags.length` `.filter-pill` buttons with none `.active`; `#blog-grid` has `BLOG_POSTS.length` `.blog-card-wrapper`, none `.filtered-out`, and every in-viewport one carries `aos-animate`; carousel assertions as above.

### One post (`/blog/post.html?id=…`)

No typing, no AOS, no jQuery. The whole page is one fetch chain (`blog/blog-post.js:145-196`).

**Settled:** `document.title` !== `Loading… | Dawson Metzger-Fleetwood`; `#post-title` non-empty; `#post-content` has children; `#read-time` textContent matches `/^\d+ min read$/`; every `pre` has `.has-copy-btn` and a `button.code-copy-btn` child; for a mermaid post, every `.mermaid` has an `svg` child and `data-processed="true"` (mermaid 11 marks rendered nodes — **unverified** exact attribute for 11.15.0, check at bring-up); `blog/posts/assets` scripts finished (post-specific: `#metr-chart` has a `.plot-container`, `#underviewed-art` has `.uva-media` populated).
Recommended parity post: **`toolbelt`** — it is the only post with mermaid, has bash + json fences, no external scripts, and no images. Add **`embedded-swift-agent`** for the swift/c code-block and image path, and **`autoencoders-2`** for the raw-HTML `<figure>`/`.blog-figure-row` path.

### Privacy (`/privacy/`)

Fully static HTML. Only `theme-bootstrap.js` (sync) and `theme-cycler.js` (deferred, no dock created — see §6). **Settled:** `load` fired. No animations. Note: no Font Awesome icon usage beyond the stylesheet, no nav.

### 404 (`/404.html`)

Same as privacy: static, `theme-bootstrap.js` + `theme-cycler.js`, no dock. `.name-logo-visible` means the logo is visible without any intro wave (`css/styles.css:280-282`). **Settled:** `load`.

---

## 4. Interactions to script

| Interaction | Act on | Expected change | Settle condition |
|---|---|---|---|
| **Job tab click** | `#jobs-menu-list li[data-job="job-2"]` | Old `li` loses `.selected`, new gains it; `#highlight` inline `top`/`height` change (desktop) or `left`/`width` (mobile); `#job-1` goes `showing`→`job-out-right`→`hidden`; `#job-2` goes `hidden`→`job-in-right`→`showing` | Wait ≥1000 ms (two chained 500 ms timers, `js/script.js:351-368`); assert `#job-2.showing`, `#job-1.hidden`, and neither has `job-in-right`/`job-out-right`. Click is ignored while `isAnimating` (`:335`), so don't double-click. |
| **Carousel scroll** | `#featured-track` | `scrollLeft` moves; `.featured-carousel-fade-left` opacity `0→1`; `.fc-dot.active` moves to the nearest card | Prefer `#featured-dots .fc-dot[data-index="2"]` click (`js/featured-carousel.js:275-287`) — it is smooth-scroll so wait for `scrollLeft` to stop changing for 2 rAFs, then assert exactly one `.fc-dot.active` with `data-index="2"`. Avoid `wheel`: the wheel guard's axis detection (1.15/1.25 ratios, `:301-302`) makes synthetic wheels flaky. |
| **Theme menu open** | `.tc-nav-item .tc-nav-trigger` (click, not hover) | `#tc-dock` loses `tc-hidden`, gains `tc-mega-open`; `#tc-scrim` gains `tc-on`; the pill gains `tc-lift`; the trigger's `aria-expanded` → `"true"`; `#tc-presets` has 16 `li` | Assert `#tc-dock.tc-mega-open` + `#tc-scrim.tc-on` + `.tc-stagger` elements all have `--i` set (`js/theme-cycler.js:354-362`). CSS transition length lives in `css/theme-cycler.css` (**unverified** value); the close path is 440 ms (`:676`). Do not hover — `canHover` differs between desktop and mobile projects (`:594`). |
| **Blog filter** | `#filter-bar .filter-pill[data-tag="Swift"]` | Pill gains `.active`; non-matching `.blog-card-wrapper` gain `.filtered-out` (`display:none`) | Synchronous — assert immediately: count `#blog-grid .blog-card-wrapper:not(.filtered-out)` equals the expected tag count. **The hidden nodes stay in the DOM**, so `:nth-child` striping in skins is a real diff risk; screenshot at least one multi-tag filter state. |
| **Mobile quick-links / menu toggle** | none exists | There is no mobile hamburger. `.static-menu-mobile` is a always-visible 3-item row below 1100 px (`css/mobile-styles.css:24`), `.static-menu` and `.moving-menu` are `display: none` there (`:77-78`). | n/a — but the mobile screenshots must confirm the row renders `Email / Blog / Resume / Theme`. |
| **Calendly button** | `.calendly-link` (6 social lists + one inline text link, `index.html:275`) | `e.preventDefault()`, then `Calendly.initPopupWidget({url})` (`js/nav-config.js:136-139`) with `background_color`/`text_color`/`primary_color` from live CSS vars | External iframe. Recommend **not** scripting the click; instead assert the built URL by evaluating the same var reads. If the Calendly script is blocked, the click throws a ReferenceError — worth an explicit console-error allowance. |
| **Sticky nav on scroll** | `window.scrollTo(0, 400)` then `(0, 200)` | `.moving-menu` loses `menu-invisible` past 100 px and gains `menu-sticky` when scrolling up past 300 (`js/nav-config.js:147-162`) | Desktop only (`.moving-menu` is hidden on mobile). Two-step scroll needed: the class depends on direction. |
| **Smooth scroll nav click** | `.menu-item[href="#contact"]` | jQuery animates `scrollTop` to `$('#contact').offset().top - 80` over `clamp(100·ln d, 300, 1000)` ms with `easeInOutQuad` | Wait for `scrollY` to stop changing; then assert `scrollY` within a pixel or two of the target. Good regression for the jQuery-UI easing replacement. |
| **Code copy button** | `.code-copy-btn` on a post | `.copied` for 1500 ms, icon swap (`blog/blog-post.js:103-108`) | Needs clipboard permission; low value for parity, skip unless the skin styles `.copied`. |
| **Hover effects with JS** | tilt targets (`.card`, `.fc-card-image`, `.blog-card`, `.blog-image`) | vanilla-tilt writes an inline `transform` on `mousemove` | Explicitly listed as manual QA in intent §4.9 — recommend keeping it manual; synthetic hovers make screenshots position-sensitive. |

Also worth scripting: **theme switch** (`#tc-presets a.tc-row-link[data-id="brutalist"]` click) — it clears `sessionStorage['dawson-theme-cycler']` and navigates to `/?style=brutalist` (`js/theme-cycler.js:272-277`). Under the new theme-in-path model this becomes a different URL, so the harness should test both the old redirect and the new path.

---

## 5. Blog pipeline in full

### 5.1 `blog/post.html` → `blog/blog-post.js`

- `?id=` read via `new URLSearchParams(window.location.search).get('id')` (`blog/blog-post.js:137-138`). Missing id → `#post-title` becomes `Post not found` and the script returns (`:140-143`).
- Fetch: `fetch('posts/' + postId + '.md')` — **relative to `/blog/`** (`:145`). Non-200 throws; `.catch` sets `Post not found` + `<p>Sorry, this post could not be loaded.</p>` (`:197-200`). There is no id whitelist, so any `?id=` value is a fetch attempt.
- Frontmatter regex: `/^---\n([\s\S]*?)\n---\n([\s\S]*)$/` (`:33`). Per line, split on the **first** `:`; a value wrapped in `[...]` is split on `,`, trimmed, and stripped of surrounding `"`/`'` (`:37-46`). Everything else is a raw string. No nesting, no multiline, no comments, no escaping. Fields actually used: `title` (`:153-154`), `date` (`:158`), `scripts` (`:194`), `styles` (`:168`). No other keys appear in any post.
- `document.title = (meta.title || 'Blog') + ' | Dawson Metzger-Fleetwood'` (`:153`).
- Meta pills (`:156-166`): `[date, ...BLOG_POSTS[id].tags, '<span id="read-time"></span>']` each wrapped in `<span class="pill">`. Note the read-time span is nested inside a pill: `<span class="pill"><span id="read-time">7 min read</span></span>`. **Tags come from `js/blog-data.js`, not the frontmatter**, so an unlisted post (`gemma4-heretic-ara`) renders with only date + read time.
- JSON-LD `BlogPosting` appended to `<head>` (`:56-88`): headline, url (`window.location.href` — will change under the new routes), `datePublished`/`dateModified` from `new Date(meta.date + ' 1').toISOString().slice(0,10)` (`:50-54`), description from the `BLOG_POSTS` excerpt, keywords from tags joined with `', '`.
- Read time: `contentEl.innerText.trim().split(/\s+/).length`, `Math.max(1, Math.round(words / 200))` (`:176-179`).

### 5.2 marked configuration (18.0.5, `blog/post.html:21`)

`marked.use({ gfm: true, breaks: false, renderer: {...} })` (`blog/blog-post.js:4-30`). No extensions, no `headerIds` option set (marked 18 has no auto heading ids by default), no footnote support, no custom tokenizer. Three renderer overrides:

- `link` (`:8-15`): every link gets `class="text-link"`; `http://`/`https://` hrefs additionally get `target="_blank" rel="noopener noreferrer"`. Uses the marked-18 object signature `({href, title, tokens})` with `this.parser.parseInline(tokens)`.
- `image` (`:16-19`): `<img src="{href}" alt="{text}" class="blog-image"[ title]>` — no `<figure>` wrapper, no lazy loading, no dimensions.
- `code` (`:20-28`): three branches —
  - `lang === 'mermaid'` → `<div class="mermaid">{raw text}</div>` (`:22`)
  - `lang && hljs.getLanguage(lang)` → `<pre><code class="hljs language-{lang}">{hljs.highlight(text,{language:lang}).value}</code></pre>` (`:25`)
  - else → `<pre><code class="hljs">{hljs.highlightAuto(text).value}</code></pre>` (`:27`) — **unreachable from today's posts** (§6).

Everything else is stock marked GFM: tables get bare `<table>` (no wrapper div), blockquotes bare, lists bare, headings bare `<h2>`/`<h3>` with no `id`. Raw HTML in the Markdown passes through untouched (`<figure class="blog-figure">`, `<div class="blog-figure-row">`, `<div id="metr-chart">`, floated `<img class="blog-image blog-image-float-right">`).

### 5.3 highlight.js

Version 11.9.0, cdnjs `highlight.min.js` (`blog/post.html:20`), theme `styles/github-dark.min.css` (`:19`). Loaded synchronously in `<head>`, used at parse time inside the renderer — no `hljs.highlightAll()`, no `initHighlightingOnLoad`. Class structure on each block: `pre > code.hljs.language-<lang>` containing hljs's `span.hljs-keyword` / `.hljs-string` / etc. Intent §4.6 requires keeping these exact colours; the practical route is to keep hljs at build time (`hljs.highlight`) rather than Shiki, and keep loading `github-dark.min.css`.

### 5.4 mermaid

Version 11.15.0 (`blog/post.html:22`), configured in an inline script that reads live CSS vars pre-paint (`blog/post.html:27-58`):
`startOnLoad: false`, `theme: 'base'`, `themeVariables: { darkMode: true, background: --secondary||#2c2c2c, primaryColor: same, primaryTextColor: --text||#e6f1ff, primaryBorderColor: --neutral-gray||#a2a2a3, lineColor: same, nodeTextColor: --text, mainBkg: --secondary, nodeBorder: --neutral-gray, edgeLabelBackground: --secondary }`, `flowchart: { curve: 'basis', padding: 16 }`.
Rendered once, imperatively: `mermaid.run({ nodes: contentEl.querySelectorAll('.mermaid') })` (`blog/blog-post.js:172`), immediately after `innerHTML`. The inline comment (`blog/post.html:29-30`) notes a live theme switch is not re-rendered. Intent §4.6 keeps mermaid client-rendered, so this whole block must survive into the Astro post layout, including the CSS-var reads (which must still happen after `theme-bootstrap`'s equivalent has written the vars).

### 5.5 `scripts` / `styles` injection

- `loadPostStyles` (`:127-135`) runs **before** `marked.parse` (`:168`), appending each `<link rel="stylesheet" href="{href}">` to `<head>` in array order, in parallel, no `onload` wait.
- `loadPostScripts` (`:114-125`) runs **last**, after render, mermaid, copy buttons, JSON-LD, read time and tilt. It chains promises so scripts load **strictly sequentially**, each appended to `<body>` as a plain `<script src>` (no `defer`, no `async`, no `type=module`). This is why `metr-doubling` can list Plotly, js-yaml, then `metr-chart.js` and rely on them being ready.
- Paths are frontmatter-literal and resolve relative to `/blog/` (`posts/assets/metr-chart.js`). Under `/blog/<id>/` these become `/blog/<id>/posts/assets/…` and 404 — the migration must rewrite them (or make them root-absolute).

### 5.6 Post DOM produced (what skin sheets target)

```
article.blog-post-container
  header.blog-post-header
    h1.blog-post-title#post-title            <- meta.title (textContent)
    div.blog-post-meta#post-meta
      span.pill                              <- meta.date
      span.pill                              <- each BLOG_POSTS tag
      span.pill > span#read-time             <- "N min read"
  div.blog-post-content#post-content         <- marked output
    p / h2 / h3 / ul / ol / blockquote / table   (stock marked, no wrappers, no ids)
    a.text-link[ target=_blank rel=…]
    img.blog-image                            (markdown images)
    pre.has-copy-btn > code.hljs.language-X > span.hljs-*
    pre.has-copy-btn > button.code-copy-btn[aria-label="Copy code"]
                        > i.code-copy-icon.code-copy-icon-copy.fa-regular.fa-copy
                        > i.code-copy-icon.code-copy-icon-check.fa-solid.fa-check
    div.mermaid > svg                         (after mermaid.run)
    figure.blog-figure[style="max-width: Npx"] > img.blog-image [+ figcaption]   (raw HTML)
    div.blog-figure-row > figure.blog-figure*                                     (raw HTML)
    img.blog-image.blog-image-float-right / -float-left + div[style="clear: both"] (raw HTML, helm.md)
    div#metr-chart, div.chart-bottom-row > p.chart-caption + div#doubling-times    (raw HTML)
    div#underviewed-art > .uva-caption/.uva-frame/.uva-controls/.uva-rail          (JS-built)
```
No footnotes, no heading anchors, no table wrapper anywhere in the codebase. Post pages also carry `#main-body.blog-post-page`, `#cursor-container`, `.moving-menu`, `.header-menu-container` (with `.name-logo.name-logo-visible`), `.static-menu`, `.static-menu-mobile`, and `footer.footer-container.blog-footer` (`blog/post.html:62-101`).

### 5.7 Listing rendering

Covered in §2.1. Filter mechanics: `activeTags` is an OR set; empty set clears all `.filtered-out` (`blog/blog-listing.js:159-162`). Date is the raw `BLOG_POSTS.date` string ("August 2026") — **no formatting function anywhere**; the same string is used on the home rail, the listing card, and the post pill (from frontmatter). Typing masthead sequences: 7, all ending `Blog.` (`:38-88`).

---

## 6. Fenced languages and internal links

### 6.1 Languages (opening fences across `blog/posts/*.md`)

| lang | count | files |
|---|---|---|
| `python` | 20 | autoencoders-1 (8), autoencoders-2 (12) |
| `swift` | 9 | embedded-swift-agent |
| `typescript` | 2 | helm |
| `mermaid` | 2 | toolbelt (lines 17, 27) |
| `bash` | 2 | helm (85), toolbelt (82) |
| `json` | 1 | toolbelt (103) |
| `javascript` | 1 | arena-freshness (20) |
| `c` | 1 | embedded-swift-agent (25) |

**38 opening fences, 38 closing fences, zero bare-language fences.** All 7 code languages are in highlight.js's common bundle, so `hljs.highlightAuto` (`blog/blog-post.js:27`) is dead on today's content. Posts with no fences at all: `college-projects`, `fly-on-my-laptop`, `gemma4-heretic-ara`, `metr-doubling`, `underviewed-art`.

### 6.2 Internal links inside post bodies (URL-change surface)

| link | file:line | breaks if… |
|---|---|---|
| `post.html?id=autoencoders-2` | `autoencoders-1.md:200` | post routes move to `/blog/<id>/`; also currently resolves against `/blog/` |
| `post.html?id=autoencoders-1` | `autoencoders-2.md:6` | same |
| `/embedded-swift-agent/` | `embedded-swift-agent.md:201` | subsite moves to `/subsites/…` (intent §4.8) |
| `../../resources/EmbeddedSwiftAgent_CLIScreenshot.png` | `embedded-swift-agent.md:181` | any depth change in the post URL — `../../` is tuned to `/blog/post.html` |
| `../../resources/{Rotobrush_Media.jpg, SnapCut.pdf, Systems_Media.png, MicrOCaml_Media.png, ML_Media.png}` | `college-projects.md:10,16,22,30,40` | same |
| `../../resources/arena-freshness.user.js` | `arena-freshness.md:52` | same |
| `../../resources/autoencoders/*.png|jpg` (10 files, raw `<img src>`) | `autoencoders-1.md:13,24,35,43,53,60…`, `autoencoders-2.md:31,66,107,121,212,215` | same |
| `../../resources/Helm_{1,2,3}.png` (raw `<img src>`) | `helm.md:6,47,61` | same |

Every `../../resources/…` path is depth-2 from `/blog/post.html`. Under `/blog/<id>/` the correct depth is `../../..`, so the build must rewrite them (root-absolute `/resources/…` is the obvious fix). Non-post pages referencing post URLs: `js/blog-data.js:43, 119, 136, 145, 154, 163, 172, 181, 211` (all `blog/post.html?id=…` or `../blog/post.html?id=…`) and 9 `sitemap.xml` entries.

---

## 7. Per-post assets (`blog/posts/assets/`)

| file | used by | what it does | libraries | data |
|---|---|---|---|---|
| `metr-chart.js` (11 KB) | `metr-doubling.md:4` | Builds the METR task-horizon chart into `#metr-chart`, writes `#doubling-times` (`:198-201`) | Plotly `https://cdn.plot.ly/plotly-2.27.0.min.js`, js-yaml `https://cdn.jsdelivr.net/npm/js-yaml@4.2.0/dist/js-yaml.min.js` (both from frontmatter) | **Live fetch** of `https://corsproxy.io/?…metr.org/assets/benchmark_results_1_1.yaml` (`:204,216`) with a 30+-row baked `FALLBACK_DATA` on failure (`:5-30+`). Fixed dates `2023-07-01`/`2040-01-01` (`:129-130`) |
| `metr-chart.css` (754 B) | same | `#metr-chart` sizing + `.chart-bottom-row`/`.chart-caption` | — | — |
| `underviewed-art.js` (13 KB) | `underviewed-art.md:4` | Builds a random off-view artwork gallery into `#underviewed-art` (`:2`), injecting `.uva-caption/.uva-title/.uva-meta/.uva-frame/.uva-media/.uva-controls/.uva-refresh/.uva-rail/.uva-track` (`:218-234`) | none (vanilla + inline SVG icon) | **4 live APIs, no keys**: Met (`:38`), Cleveland (`:84`), V&A (`:127`), Getty (`:146`). Heavy `Math.random` use |
| `underviewed-art.css` (4 KB) | same | gallery styling | — | — |
| `heretic-ara-charts.js` (11 KB) | `gemma4-heretic-ara.md:4` (post commented out of `BLOG_POSTS`) | Three Plotly charts into `#pareto-chart`, `#ara-objectives-chart`, `#kl-explainer-chart` (`:56,151,270`) | Plotly 2.27.0 | Fully inline/synthetic data; **`Math.random` jitter** at `:158-171` |
| `heretic-ara-charts.css` (401 B) | same | chart containers | — | — |
| `cohorts-chart.js` (31 KB) | **`docs/planned-posts/ai-job-market.md:4` — unpublished** | Two-chart factory (cohort unemployment + SWE age), toolbars, range presets, drag tips | Plotly 2.27.0 | `cohort-unemployment-data.json`, `cohort-swe-age-data.json`, overlay `rate-data.json` (`:717-723`) |
| `cohorts-chart.css` (6 KB) | same | — | — | — |
| `job-market-chart.js` (34 KB) | same, unpublished | Indeed postings chart + DFII10 overlay into `#job-market-chart` | Plotly 2.27.0 | **Live** `raw.githubusercontent.com/hiring-lab/job_postings_tracker/master/US/{job_postings_by_sector_US.csv, aggregate_job_postings_US.csv}` (`:8-9`) + local `posts/assets/rate-data.json` (`:12`) |
| `job-market-chart.css` (6 KB) | same | — | — | — |
| `cohort-unemployment-data.json`, `cohort-swe-age-data.json`, `rate-data.json` | same | prebaked snapshots refreshed weekly by `.github/workflows/refresh-chart-data.yml` (which regenerates them via `docs/prebake-cohort-data.py`) | — | — |

**`dawson:palette` contract**: the cycler dispatches a bare `CustomEvent('dawson:palette')` on `window` after every palette write (`js/theme-cycler.js:191`). All four chart modules listen and redraw after a 150 ms debounce, re-reading CSS vars at draw time: `metr-chart.js:210-214`, `heretic-ara-charts.js:350-354`, `cohorts-chart.js:707-714`, `job-market-chart.js:708`. The theme-explorations rule for palette-coupled widgets is accurate.

**Migration note**: 5 of the 13 asset files (both chart JS, both CSS, and the 3 JSONs) serve no published post. The spec should decide whether they ride along, move to `docs/`, or get dropped; the weekly workflow currently commits into `blog/posts/assets/` and (per intent §4.10) must be taught to dispatch the deploy workflow.

---

## 8. `js/blog-data.js` shape

Both arrays are plain `const`s also assigned onto `window` (`:108-110, 215-217`) — a sync classic script, no module.

### `FEATURED_PROJECTS` (8 entries, `:1-106`)

| field | type | required | visitor-facing | example | consumers |
|---|---|---|---|---|---|
| `id` | string | yes | no | `"gemma4-heretic-ara"` | none (unused in any renderer) |
| `title` | string | yes | **yes** | `"Silicon Fly"` | card `<h3>` **and** the image `alt` (`featured-carousel.js:84,86`) |
| `description` | string (**contains raw `<br><br>`**) | yes | **yes** | see `:6` | `p.fc-card-desc` via `innerHTML` (`:87`) |
| `image` | string, `../`-prefixed | yes | no | `"../resources/Fly_Media.jpg"` | `img src`, `../` stripped on root pages (`:71,84`) |
| `tech` | string[] | yes | **yes** | `["Metal","Swift",…]` | `span.pill` per item (`:68`) **and** the marquee ticker run (`:392-399`) |
| `accentColor` | string hex | yes | no | `"#61ffda"` | **unused anywhere** (dead field, identical on all 8) |
| `url` | string | no | no | `"/lexchat/"` | `a.fc-card-cta` href (`:72,75`) |
| `ctaLabel` | string | no | **yes** | `"View on HuggingFace"` | CTA text (`:75`) |
| `external` | bool | no | no | `true` | adds `target=_blank rel=noopener noreferrer` (`:69`) |
| `url2` | string | no | no | GitHub link | second CTA (`:73,78`) |
| `ctaLabel2` | string | no | **yes** | `"View on GitHub"` | second CTA text (`:78`) |
| `external2` | bool | no | no | `true` | target for CTA 2; note when absent, CTA 2 inherits `external` (`:70`) |

Entry 8 (`deep-rl`, `:97-105`) has no `url`/`ctaLabel` — the `fc-card-ctas` div is omitted entirely (`:80-82`). Order is the display order in both the home and listing carousels and the ticker.

### `BLOG_POSTS` (11 active + 1 commented out, `:112-213`)

| field | type | required | visitor-facing | consumers |
|---|---|---|---|---|
| `id` | string | yes | no | `blog-post.js:160` (tag lookup only) |
| `title` | string | yes | **yes** | `script.js:390` (home rail), `blog-listing.js:133` |
| `date` | string, free-form `"Month YYYY"` | yes | **yes** | `script.js:391`, `blog-listing.js:134` |
| `excerpt` | string | yes | **yes** | `script.js:392`, `blog-listing.js:135`, JSON-LD `description` (`blog-post.js:81`) |
| `url` | string, `blog/`-prefixed for internal | yes | no | `script.js:389` (as-is), `blog-listing.js:130` (`blog/` stripped) |
| `tags` | string[] | yes | **yes** | `blog-listing.js:94` (filter set), `:128` (chips), `blog-post.js:161-163` (meta pills), JSON-LD `keywords` (`:82`) |
| `external` | bool | no | no | `target=_blank` on both rails (`script.js:389`, `blog-listing.js:129`) |

Tag vocabulary in use: `AI & ML`, `Swift`, `Systems`, `Tools` (4 tags → 4 filter pills, sorted).
Two entries are external (`autoencoders-1`, `autoencoders-2` → aboutobjects.com) and have no `.md` in `blog/posts/` … except they **do** (`blog/posts/autoencoders-{1,2}.md` exist and are reachable at `?id=`), which is a live duplicate: the listing links off-site while the local copies are silently published and cross-link each other (`autoencoders-1.md:200`). Worth an explicit decision in the spec.

---

## 9. Canonical DOM outlines

Legend: `[js]` = injected at runtime, `[M]` mobile-only (≤1100 px), `[D]` desktop-only, `[dead]` never runs today.

### `index.html` (home)

```
html[data-style?][data-still?][data-no-tilt?]           [js theme-bootstrap: attrs + ~100 inline custom props]
     .hero-extras-in                                    [js script.js:24]
     style: --ticker-run, --ticker-dur                   [js featured-carousel.js:413]
body
 div#main-body
  header
   nav.moving-menu[aria-label=Main navigation]           [D — hidden ≤1100]
    ul.menu-list
     li > a.menu-item (About|Experience|Projects)        [js nav-config]
     li > span.menu-spacer                               [js, between items only]
     li > a.menu-item.blog-page-link (Blog)              [js]
     li > a.menu-item (Contact)                          [js]
     li > a.menu-item.resume-link (Resume)               [js]
     li.tc-nav-item > button.menu-item.tc-nav-trigger    [js, gated on __THEME_CYCLER_ENABLED]
                       > i.fa-solid.fa-chevron-down.tc-nav-caret
   div#cursor-container                                  [D; opacity:0 until mousemove]
    div.cursor-follow                                    [js: inline left/top per frame]
    div.circle-follow                                    [js: same]
   div.header-menu-container
    a.name-logo (D)                                      [intro: inline animation+opacity]
    nav.static-menu > ul.menu-list                       [D; same items as moving-menu, js]
    nav.static-menu-mobile > ul.menu-list                [M; Email/Blog/Resume/Theme, js]
  main
   div#typing-container                                  [intro: slidein → transform:translateX(0)]
    div#typing-right > img#typing-image.card             [M: display:none] [tilt inline transform]
    div#typing-left
     h1#typing-text                                      [js typing-engine: inline min-height]
      (text nodes + br + span.typing-accent + span.cursor)   [cursor mode]
      (span.tw-word > span.tw[.typing-accent] + span.tw-anchor) [letter/word modes]
     p#sub-text                                          [intro: fadein at 2 newlines]
    div#socials-list                                     [js nav-config: spacer,br,6×a.socials-item,br,spacer]
   div.section-spacer
   div.section-header-wrapper#about-header-wrapper[data-header-intro]
        style="--section-rule: N"                        [js anim-utils]
        .section-header-in                               [js, at 1.84s]
    h2.section-header#about-section-header[style=visibility:hidden;opacity:0]
     span.sec-num "01."
     span.section-header-text "About"                    [js anim-utils split]
      (marquee only: span.section-header-word > span.section-header-glyph[--glyph-i,--glyph-r])
    span.section-header-spacer#about-header-spacer
   section.double-view-container#about
    div.double-view-left.card-style                      [intro: slideInLeft]
     h3.card-title.about-header / p.about-text
    div.double-view-right.card-style                     [intro: slideInRight]
     h3.card-title.skills-header / h4.skills-section-header ×3 / p.skills-text ×3
   div.section-spacer
   section.jobs-section-container[data-aos=fade-up][data-aos-easing=ease-in-out][data-aos-once=true]
        .aos-init .aos-animate                           [js AOS]
    div#jobs-header-static                               (scroll anchor, empty)
    div.section-header-wrapper#jobs-header-wrapper[--section-rule]
     h2.section-header#jobs-header > span.sec-num "02." + span.section-header-text
     span.section-header-spacer#jobs-header-spacer
    div#jobs-section
     div.nav-container#jobs-nav-container
      div.menu-scroll-wrapper > ul.menu#jobs-menu-list
       li.job-menu-item[.selected][data-job=job-1..4] ×4
      div.highlight#highlight                            [js: inline transition/top/height/left/width/border-radius]
     div#jobs-content-wrapper
      div.job-content.showing#job-1 > h3.job-title(+a.text-link) / div.job-dates / ul.job-bullets>li×6
      div.job-content.hidden#job-2..4                    [same shape, 3/6/3 bullets]
   div.section-spacer
   div#project-header-static
   section.project-section-wrapper[data-aos=fade-up …]
    div.section-header-wrapper#project-header-wrapper > h2#project-header(sec-num "03.") + spacer
    section.featured-carousel-section#featured-carousel.fc-style-floating   [js adds the class]
     div.featured-carousel-container
      div.featured-carousel-fade.featured-carousel-fade-left   [js inline opacity]
      div.featured-carousel-track#featured-track
       div.fc-card ×8                                    [js featured-carousel]
        div.fc-card-image > img                          [tilt inline transform]
        div.fc-card-body
         h3.fc-card-title / p.fc-card-desc / div.fc-card-tech > span.pill ×N
         div.fc-card-ctas > a.fc-card-cta ×1-2           [omitted on deep-rl]
      div.featured-carousel-fade.featured-carousel-fade-right  [js inline opacity]
     div.featured-carousel-dots#featured-dots > button.fc-dot[.active][data-index] ×8   [js]
     (div#fc-expand-visual > .fc-expand-backdrop + .fc-expand-heading)   [dead]
   div.section-spacer
   div#blog-header-static
   section.blog-section-wrapper[data-aos=fade-up …]
    div.section-header-wrapper#blog-header-wrapper > h2#blog-header(sec-num "04.") + spacer
    div.blog-scroll-container
     div.blog-scroll-fade.blog-scroll-fade-left          [js inline opacity]
     div.blog-scroll-track#blog-scroll-track
      a.blog-card ×11                                    [js script.js:388, DOMContentLoaded]
       h3.blog-card-title / p.blog-card-date / p.blog-card-excerpt     (no tags here)
     div.blog-scroll-fade.blog-scroll-fade-right
    div.blog-see-all > a.text-link "See all posts"
   div.section-spacer
   div.section-header-wrapper#contact-header-wrapper[data-aos=fade-right][data-aos-once]
    h2.section-header#contact-section-header (sec-num "05.") + span.section-header-spacer#contact-header-spacer
   section.double-view-container#contact
    div.contact-view-left[data-aos=fade-right]
     p.contact-text > a.text-link(mailto) + a.text-link.calendly-link
     div.quick-links
      nav.contact-menu > ul.menu-list > li>a.socials-item ×6, separated by li>span.socials-menu-spacer2   [D] [js]
      nav.contact-menu-mobile > ul.menu-list > li>a.socials-item ×6                                       [M] [js]
    div.contact-image-wrapper.card[data-aos=fade-left]   [M: hidden via theme-base] [tilt]
     img.contact-image
   div.section-spacer
  footer.footer-container > span.footer-spacer + p.footer-text + span.footer-spacer   [D]
  div.footer-container-mobile > p.footer-text-mobile                                   [M]
 aside#tc-dock.tc-dock.tc-mega.tc-hidden                 [js theme-cycler, body-parented]
  div.tc-mega-clip > div.tc-mega-inner
   div.tc-mega-styles > h3#tc-styles-head.tc-mega-head.tc-stagger
     div.tc-mega-swap
      ul#tc-presets > li[--tc-row-*] ×16 > a.tc-row-link.menu-item.tc-stagger + button.tc-row-card
      div#tc-advanced.tc-advanced.tc-hidden > .tc-group-schemes(#tc-schemes) + .tc-group-roles(#tc-roles)
   div.tc-mega-side > h3.tc-mega-head + div.tc-actions > button#tc-randomize/#tc-reset/#tc-advanced-link
   div#tc-preview.tc-preview > span#tc-preview-name + span.tc-preview-rule + span#tc-preview-meta
 div#tc-scrim.tc-scrim                                   [js]
```

### `blog/index.html` (listing)

```
html[…same bootstrap writes…]  (no .hero-extras-in — listing never calls startAnimations)
body > div#main-body
 div#cursor-container > .cursor-follow + .circle-follow          [D]
 nav.moving-menu > ul.menu-list                                  [D] [js nav-config, same 7 items]
 div.header-menu-container > a.name-logo + nav.static-menu[D] + nav.static-menu-mobile[M]
 div#blog-typing-container
  div#blog-typing-left
   h1#blog-typing-text                                           [js typing: min-height + cursor/tw spans]
   p#blog-sub-text / #blog-sub-text-2 / #blog-sub-text-3         [intro fadein 0.01/0.08/0.12s]
  div#blog-socials-list                                          [js nav-config, same 6 anchors]
 div.section-spacer
 div.section-header-wrapper#selected-works-header[data-header-intro][--section-rule]
  h2.section-header.blog-section-header > span.sec-num "01." + span.section-header-text "Selected Works"
  span.section-header-spacer
 section.featured-carousel-section#featured-carousel.fc-style-floating
  div.featured-carousel-container                                [intro slideInUp 0.25s]
   .featured-carousel-fade-left / div.featured-carousel-track#featured-track > .fc-card ×8 / -fade-right
  div.featured-carousel-dots#featured-dots > button.fc-dot ×8    [intro slideInUp 0.25s]
 div.section-spacer
 div.section-header-wrapper[data-aos=fade-up][data-aos-once].aos-init.aos-animate
  h2.section-header.blog-section-header > span.sec-num "02." + span.section-header-text "All Posts"
  span.section-header-spacer
 div.blog-filter-bar#filter-bar[data-aos=fade-up][data-aos-once]
  button.filter-pill[data-tag] ×4  (AI & ML, Swift, Systems, Tools; sorted)   [js]
 div.blog-listing-content > div.blog-listing-grid#blog-grid
  div.blog-card-wrapper[data-tags][data-aos=fade-up][data-aos-once][data-aos-delay=i*50][.filtered-out?] ×11  [js]
   a.blog-card > h3.blog-card-title / p.blog-card-date / p.blog-card-excerpt / div.blog-card-tags>span.pill ×N
 footer.footer-container.blog-listing-footer > spacer + p.footer-text + spacer   [D]
 div.footer-container-mobile > p.footer-text-mobile                              [M]
(then #tc-dock + #tc-scrim on body, as home)
```

### `blog/post.html` (post)

```
html[…bootstrap writes…]        (no --ticker-run: featured-carousel.js is not loaded here)
head + script[type=application/ld+json]                          [js blog-post.js:84-87]
    + link[rel=stylesheet] per frontmatter `styles`              [js blog-post.js:129-134]
body > div#main-body.blog-post-page
 div#cursor-container > .cursor-follow + .circle-follow           [D]
 nav.moving-menu > ul.menu-list                                   [D] [js nav-config]
 div.header-menu-container
  a.name-logo.name-logo-visible                                   (visible without an intro wave)
  nav.static-menu[D] / nav.static-menu-mobile[M]                  [opacity forced to 1 by blog-styles.css:258-261]
 article.blog-post-container
  header.blog-post-header
   h1.blog-post-title#post-title                                  [js: meta.title]
   div.blog-post-meta#post-meta                                   [js]
    span.pill (date) / span.pill (tag)×N / span.pill > span#read-time
  div.blog-post-content#post-content                              [js: marked output — see §5.6]
 footer.footer-container.blog-footer > spacer + p.footer-text + spacer
(script[src] per frontmatter `scripts`, appended to body sequentially)   [js blog-post.js:117-123]
(then #tc-dock + #tc-scrim on body)
```

`privacy/index.html` and `404.html` are static: `#main-body > .header-menu-container > a.name-logo.name-logo-visible`, the content block, `footer.footer-container` [D] and `.footer-container-mobile` [M]. **Neither gets `#tc-dock`** (no `.tc-nav-item`).

---

## 10. `docs/theme-explorations.html` "JS contracts + hard-won rules" vs the code

Rule-by-rule (comment lines are in the HTML comment before `<!DOCTYPE html>`):

| Rule | Verdict | Evidence |
|---|---|---|
| animationend trap; `animation: none` leaves elements invisible forever; retime, never remove | **Confirmed** | `js/anim-utils.js:15-22`; the 8 home + 10 listing call sites |
| "The jobs swap is setTimeout-driven (overriding its animation is safe)" | **Partly wrong** | The *timing* is `setTimeout` (`js/script.js:351,360,363`) but the "in" leg is a CSS animation, `jobSlideInRight 0.5s` (`css/styles.css:714-721`), and the "out" leg is a CSS transition (`:710-713`). Killing `jobSlideInRight` leaves the panel parked at `translateX(1100px)` for 500 ms before the JS swaps the class — visible, not safe |
| Jobs highlight bar: all four geometry props written inline on every move | **Confirmed, undercounted** | Six props are written, not four: `transition`, `top`, `height`, `left`, `width`, `border-radius` (`js/script.js:284-301`) |
| "Desktop `left/width` and mobile `height` are constants; desktop `top/height` and mobile `left/width` are measured" | **Incomplete** | Mobile `top` is also measured (`jobsMenuList.offsetTop + offsetHeight`, `js/script.js:292`) and is not safe to `!important` |
| `border-radius` and `transition` are inline → blanket `!important` fine | **Confirmed** | `js/script.js:284-286, 294, 300` |
| Menu items measured at load (`offsetHeight` sizes the bar); pin `line-height` in px | **Confirmed** | `js/script.js:297`; the first paint is on `window load` (`:307-309`) |
| "A ResizeObserver in `js/script.js` re-seats the bar after live switches" | **Confirmed, incomplete** | `js/script.js:314-325`, with the first delivery deliberately skipped (`:317-320`). Omits the third re-seat path: a `scroll` listener on `.menu-scroll-wrapper` (`:326-331`), which is the mobile one |
| Limited-weight fonts: pin `#typing-text`, `#blog-typing-text`, `.card-title`, `.fc-card-title`, `.blog-card-title` | **Selectors all exist** | `css/styles.css:378`, `blog/…`, `js/script.js:390`, `js/featured-carousel.js:86` — the advice itself is CSS-side, not code-verifiable |
| Hero width budget ~795 px for "full stack engineer." | **Unverified** | `#typing-text` is 70 px / line-height 1.2 (`css/styles.css:378-384`); the 795 px figure is not in any file |
| Tilt: `flags.tilt:false` stamps `data-no-tilt`; theme-base holds targets flat | **Confirmed** | `js/theme-bootstrap.js:706`, `:646-649`; five gated `VanillaTilt.init` sites |
| Code blocks + footers handled in `theme-base.css` | **Not re-verified here** (out of scope) | — |
| Stilled skins: `flags.still` → `data-still`; theme-base kills AOS, cursor follower, dock FAB lift | **Half wrong** | `data-still` is stamped (`js/theme-bootstrap.js:705`). But the AOS kill is CSS-only — the AOS JS still stamps `aos-init`/`aos-animate` on 6 home + 3 listing elements, which a DOM diff will see under every still skin. And there is no dock FAB (below) |
| "featured-carousel.js treats a 0 radius as valid, but grep all CSS for literal radii" | **Dead code** | The `--border-radius` parse (`js/featured-carousel.js:135-137`) lives inside `setupExpandVisual`, which is gated on `EXPAND_VISUAL` (`:16`, `:421`) and is `false`. The CSS-grep half of the advice is still valid |
| `:nth-child` alternation counts hidden nodes (blog filter) | **Confirmed** | `blog/blog-listing.js:165` toggles `.filtered-out`; `blog/blog-listing-styles.css:189-191` is `display: none` |
| Palette-coupled widgets read CSS vars at draw time and redraw on `dawson:palette` | **Confirmed** | Dispatch `js/theme-cycler.js:191`; four listeners, all 150 ms debounced (`metr-chart.js:210`, `heretic-ara-charts.js:351`, `cohorts-chart.js:709`, `job-market-chart.js:708`) |

**Contracts the comment gets wrong:**

1. **The `.tc-toggle` FAB does not exist.** The Architecture section claims "Pages without nav menus (blog posts, privacy, lexchat, 404) get the floating `.tc-toggle` FAB instead." In code, `injectDom()` bails before creating anything when `.tc-nav-item` is absent (`js/theme-cycler.js:558-559`). Blog post pages *do* get nav menus (`blog/post.html:73-85` + `js/nav-config.js`), so they get the real dock. `404.html` and `privacy/index.html` get **no picker at all**, while 16 skin sheets carry dead `[data-style=…] .tc-toggle` rules.
2. **"Engine + seventeen skins"** in the Status section, and the Shipped list names 17. `ORDER` and `REGISTRY` hold 16 ids total = default + 15 skins (`js/theme-bootstrap.js:637`; keys at `:16,22,70,118,139,161,181,266,290,314,339,369,397,496,526,561`). `constructivist`, `space`, `vapor`, `wanted` have sheets but **no registry entry** — they cannot be selected. Intent §2's "sixteen active skins in ORDER" is also off by one in the same direction (the list it gives is 16 items *including* default).

**Contracts the comment omits entirely** (all matter for parity):

- `--ticker-run` / `--ticker-dur` are written on `<html>` unconditionally by `js/featured-carousel.js:412-414`, on **both** the home and listing pages, whether or not a skin reads them.
- `js/typing-engine.js` writes an inline `min-height` on `#typing-text`/`#blog-typing-text` and **re-measures on `document.fonts.ready`, on every `link[data-style-asset]` load, on `window load`, and on every resize** (`:264-311`). A skin that changes headline metrics changes this number.
- `startAnimations` / `fadeInSubText` are **idempotent by guard flags** (`js/script.js:14, 109`) because live theme switches replay the typing sequence; any rewrite must keep that.
- `anim-utils.js` mutates the `<h2>` DOM: it removes the h2's text nodes and appends `span.section-header-text` (`:167-172`), stashing the original on `h2.__headerText`. Every skin's `.section-header` selector is therefore matching a *rewritten* h2.
- `.job-menu-item` is hard-coded in the cursor-follower's hover selector list (`js/cursor-follow.js:35`).
- Both `.moving-menu .menu-list` and `.static-menu .menu-list` get **byte-identical** HTML from `nav-config.js:123-126`, so the theme trigger exists twice on desktop; the single `#tc-dock` reparents between them (`js/theme-cycler.js:607-610`).
- `js/nav-config.js:4` decides subpage-ness from `pathname.indexOf('/blog')`, so every nav href on every blog page is `../`-relative — this breaks under both `/blog/<id>/` and `/<theme>/blog/`.
- The `menu-spacer` `<li>` is emitted between items but **not after the last** (`js/nav-config.js:97`), so the count is `2n - 1` list items — relevant to any `:last-child` skin rule.

---

## 11. Open questions / risks

1. **Which source of truth for post title and date?** `helm.md:2` vs `js/blog-data.js:150`, and `metr-doubling.md:3` (`February 2026`) vs `js/blog-data.js:178` (`January 2026`) disagree today; the post page shows one, the listing the other. Prerendering makes the divergence visible on one page. Parity says reproduce both; sanity says unify. Needs an explicit owner decision.
2. **`gemma4-heretic-ara` is a live-but-unlisted post**: commented out of `BLOG_POSTS` (`js/blog-data.js:122-129`), still in `sitemap.xml:41`, still fetchable, still shipping `heretic-ara-charts.{js,css}`. Prerendering `/blog/<id>/` for every `.md` publishes it; skipping it breaks a sitemap URL. Decide.
3. **`sitemap.xml:29` lists `color-randomizer`**, which has no `.md` — currently a 404-ish "Post not found". The generated sitemap (intent §4.6) will silently drop it; make sure a redirect or removal is deliberate.
4. **`autoencoders-1/2` are published twice**: `BLOG_POSTS` links to aboutobjects.com (`js/blog-data.js:190, 200`) while local `.md` copies exist and cross-link each other (`autoencoders-1.md:200`). Prerendering makes the local copies canonical-looking. Needs a call.
5. **Orphaned assets**: `cohorts-chart.{js,css}`, `job-market-chart.{js,css}` and 3 JSONs (≈95 KB) belong to `docs/planned-posts/ai-job-market.md`. The weekly workflow writes into `blog/posts/assets/`. If those move, `.github/workflows/refresh-chart-data.yml` paths must move with them.
6. **Frontmatter asset paths are `/blog/`-relative** (`posts/assets/…`). Under `/blog/<id>/` they must be rewritten; likewise the `../../resources/…` paths inside every post body (§6.2). A silent 404 here shows as a missing image, not an error — the parity harness should fail on any 404 network response, not just on pixels.
7. **hljs bundle contents unverified.** I assumed cdnjs `highlight.min.js` is the "common" build containing swift and typescript. If the Astro build imports the full `highlight.js` package instead, output should match, but the *class set* on a token could differ between the two builds. Verify by diffing one rendered `<pre>` old vs new before trusting the visual diff.
8. **Mermaid's rendered-node marker for 11.15.0 is unverified** (`data-processed` vs something else). The harness's "post settled" check for `toolbelt` depends on it.
9. **What vanilla-tilt writes at rest is unverified.** If it sets an inline `transform`/`will-change` on init (not just on hover), every tilt target carries an inline style in the canonical DOM and the diff must normalize it.
10. **The theme-cycler dock is absent on 404 and privacy today.** Intent §4.7 requires the picker to be reachable in every theme. That is a deliberate behavior *change*, not parity — flag it in the spec so it does not read as a regression when the harness diffs those two pages.
11. **AOS class stamping under `data-still` skins**: the CSS kill leaves `aos-init`/`aos-animate` in the DOM. A strict DOM diff will match only if the new build also runs AOS under still skins. If the rewrite instead skips AOS entirely for still skins, the visual diff passes and the DOM diff fails — decide which is authoritative per §4.9.
12. **Screenshot policy for `underviewed-art`**: it depends on 4 live museum APIs and heavy `Math.random`. Recommend excluding it from the visual harness, or screenshotting only the deterministic error state with all four hosts route-aborted.
13. **`js/theme-cycler.js` `loadAllFonts` appends every theme's Google Fonts on idle** (`:370-387`), which changes layout after first paint on *every* page. The harness must wait past it or block fonts; either choice must be identical on both sides of the diff.
14. **Home vs listing carousel duplication**: `initFeaturedCarousel` differs only by `isSubpage` path rewriting (`js/featured-carousel.js:71-73`). Astro's `import.meta`/base-aware URLs remove the need, but the emitted `src`/`href` strings must still match the old output character-for-character for the DOM diff to pass without normalization.
15. **`reserveHeight`'s planned states are sequence-dependent** (`js/typing-engine.js:209-222`). On mobile (34 px headline, `css/mobile-styles.css:126-135`), sequence 1's `full stack engineer.` may wrap to a fourth line and reserve a taller `min-height` than the terminal 3-line state. Seeding a fixed sequence removes the variance but means the harness never covers the taller reservation — consider a second mobile shot seeded to index 1.
