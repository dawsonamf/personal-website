# Walk B1: home behavior scripts (Opus subagent of the thermonuclear reviewer)

## Legend
All under `/Users/dawsonamf/Desktop/dax/personal-website/`: `index.html`, `js/script.js`, `js/featured-carousel.js` (fc), `js/nav-config.js` (nav), `js/blog-data.js` (data), `js/typing-engine.js` (te), `js/anim-utils.js` (au), `js/cursor-follow.js` (cf), `js/theme-bootstrap.js` (tb).

## 1. Line counts
script.js 437, fc 427, nav 164, data 217, te 639, au 358, cf 47 (total 2289).

## 2. Load order, render/behavior split, shared state

**Script order (index.html)**: sync in head: tb :27, vanilla-tilt :34, au :39 (au:12-13 says it is non-defer so everything can rely on it). `defer` chain in document order: gsap :30, jquery :31, jquery-ui :32, aos :33, data :36, fc :37, te :38, nav :40, script.js :41, cf :42, theme-cycler :316. Calendly is `async` :35 (only touched at click time, nav:138).

**Handoffs**:
- data → globals `window.FEATURED_PROJECTS` (data:108-110), `window.BLOG_POSTS` (:215-217); read at fc:60, :260, :389 and script.js:382.
- fc → `window.initFeaturedCarousel` (fc:417); called synchronously in script.js:377 (during defer execution, before DOMContentLoaded) and blog/blog-listing.js:171.
- te → global fn `startTypingSequence` (te:72), called script.js:125 via :379. Sequences are passed as an **argument** (`config.sequences`, script.js:129-203; te:78). te also defines `window.__restartTypingSequence` (te:637-639), but **no file calls it**: comments at script.js:11-13, te:81-84, te:631-636, tb:644 attribute it to theme-cycler.js, which contains neither `__restartTypingSequence` nor `VanillaTilt`. The once-guards `heroChromeIn` (script.js:14) / `subTextIn` (:109) and `_lastConfig` (te:88) exist to serve that unwired replay.
- au → globals `persistAfterAnimation` (au:15), `animateThenPersist` (:24), `window.revealSectionHeader` (:351); `init` runs on DOMContentLoaded (:353-357). script.js:102 calls it 1.84 s later via setTimeout, and :258-262 tolerates the pre-init case.
- tb → `__THEME_CYCLER_ENABLED` (tb:8; read nav:27), `__styleAllowsTilt` (tb:646; read script.js:257, :397, fc:190), `__styleTypingMode` (tb:654; te:99), `__styleTypingDeleteMode` (tb:664; te:109), all keyed on the runtime-switchable `__ACTIVE_STYLE` (tb:700).
- nav renders `.menu-item` anchors at its top level (nav:120-128); script.js's jQuery click binding (:215-252) finds them because nav is earlier in the defer chain and `$(document).ready` fires at DOMContentLoaded anyway.

**script.js execution phases**: top-level during defer: `AOS.init()` :212, `initJobsMenu()` :375, `initFeaturedCarousel` :377, `runHomeTypingSequence` :379. `$(document).ready`: smooth scroll :215, tilt :255. `DOMContentLoaded`: `renderBlogCards`, `setupBlogScrollFade` :432-435.

**Render side (builds DOM/data from config)**: fc `renderFeaturedCarousel` :59-92, `buildTickerRun` :388-415, dots markup :265-267, `applyExpandVisualShell` :94-120 (gated off, :17/:421); script.js `renderBlogCards` :388-394; nav `buildNavItems` :95-117, `buildSocialAnchor` :58-63, `renderSocialMenus` :65-93, menu writes :120-128; te's whole output (cursor span :170-177, text/`<br>`/`.typing-accent`/`.tw` nodes :335-340, :436-447); au `split` :119-173.

**Behavior side (acts on existing DOM)**: everything else: script.js intro wave :16-122, smooth scroll, tilt, jobs :271-370, blog fades :409-430; fc tilt :187-202, fades :239-257, dot click/scroll :275-294, wheel guard :297-358; nav Calendly :135-140, sticky :142-163; au scrub loop :209-252 and observers :301-344; all of cf.

**Module state**: script.js `heroChromeIn` :14, `subTextIn` :109, `blogPosts` :382, constants :4-7; jobs closure `jobsSelectedItem`/`isAnimating` :276-277. fc: constants `FEATURED_STYLE` :15, `EXPAND_VISUAL` :17, `TICKER_*` :376-386; wheel-guard closure :305-308. te: statics `_activeRun` :85-87, `_lastConfig` :88, `_reserve` :305, `_resizeBound` :306. nav: `isSubpage`/`prefix` :4-5, `NAV_CONFIG` :7, `SOCIAL_LINKS` :49. au: `headers`/`frame`/`observer` :96-98, `GLYPH_SKINS` :90.

## 3. featured-carousel.js

`renderFeaturedCarousel(isSubpage)` (:59-92): needs `#featured-carousel` + `#featured-track` (:61-63; index.html:222, :225); adds `fc-style-floating` to the section (:65); `track.innerHTML` (:67-91) per project: `div.fc-card > div.fc-card-image > img[src alt=title]` + `div.fc-card-body > h3.fc-card-title, p.fc-card-desc` (description injected as raw HTML), `div.fc-card-tech` holding **visible chips `<span class="pill">`** one per `tech` entry (:68, :88), optional `div.fc-card-ctas > a.fc-card-cta` (:74-82). `isSubpage=false` strips a leading `../` from image/url/url2 (:71-73). Note :70: `linkTarget2` falls back to `linkTarget`.

`buildTickerRun` (:388-415): input is **`window.FEATURED_PROJECTS`** (:389), not the DOM. Dedupes tech case-insensitively on first appearance, keeping authored casing (:392-399). `pass = terms.map('✷ ' + t + ' ').join('')` (:376, :404); `half = pass × TICKER_PASSES_PER_HALF (2)` (:382, :405-406); backslashes/quotes escaped (:411); sets on `document.documentElement.style` (:412): `--ticker-run = '"' + escaped + escaped + '"'` (:413, so pass ×4) and `--ticker-dur = round(half.length / (402/46)) + 's'` (:386, :414). Computed against current data: 8 projects, 36 raw chips, 33 deduped (drops Swift, Python, Python), pass 380 chars, half 760, ticker-run 1520 chars, `--ticker-dur: 87s`. Only the marquee skin reads it (:361-363). No chip contains `"` or `\`, so :411 is currently a no-op.

Dots (:259-295): `dotsContainer.innerHTML` from `featuredProjects.map` (:265-267), so count = `FEATURED_PROJECTS.length` (equals cards but is not read from the DOM); markup `<button class="fc-dot[ active]" data-index="i" aria-label="Go to slide N">`. Click centers card via `getBoundingClientRect` (:209-217, :275-287); scroll re-picks the closest card (:219-237, :289-294).

Wheel guard (:297-358): `wheel` listener on the track; axis decided by ratios 1.15/1.25 (:301-302, :341-344); vertical gestures lock `scrollLeft` to the centered card each rAF (:310-325) and toggle `.is-vertical-wheeling` (:314, :332); gesture ends after 140 ms idle (:303, :352).

Built at load: card markup, dots markup, ticker vars, `fc-style-*` class. Merely wired: tilt (:187-202, `.fc-card-image`, gated :190), fades (:239-257; elements static at index.html:224/:228), dot events, wheel guard. Expand visual (:94-185) builds a shell + "Selected Works" heading and reads `--bg/--text/--border-radius` via `getComputedStyle` (:130-137), but is dead under `EXPAND_VISUAL = false` (:17, :421). Init order :417-426.

## 4. script.js masthead sequences (:129-203)

Vocabulary: `type{text}`, `callback{fn}`, `pause{duration}`, `delete{count}`. No per-step speeds; global `typingDelay 75` (:5, :127), `deleteDelay 40` (:128). `callback: startAnimations` always directly follows the first `type` (:132, :145, :152, :156, :160, :167, :174, :181, :188). Pauses are 1500 except sequence B's 1000 (:146). `onNewlineCount {2, fadeInSubText}` (:204-207).

Terminal lines (shared prefix `Hi,\nI'm Dawson,\n` or `Hey,\nI'm Dawson,\n`):
- A :130-142: web developer. → (del 14) iOS developer. → (del 14) ML engineer. → (del 12) software engineer.
- B :143-149 (Hi): full stack engineer. → (del 20) software engineer.
- C :150-153 (Hey): software engineer. (no delete)
- D :154-157 (Hi): software engineer. (no delete)
- E :158-164 (Hey) / F :165-171 (Hi) / G :172-178 (Hey) / H :179-185 (Hi): builder. → (del 8) software engineer.
- I :186-192 (Hey): agentic engineer. → (del 17) software engineer.
- Commented :193-202 (Hi): software engineer. → (del 18) vibe coder. → (del 11) software engineer.

Property check (verified by script, not by eye): for **every** delete step, `count == len(text so far) - len(LCP(text so far, text after next type))`. A: 14/14/12, B: 20, E-H: 8, I: 17, commented: 18/11; all exact. So every sequence is mechanically derivable from an ordered terminal-string list plus the callback-after-first-type and pause-before-delete conventions (the one irregularity being B's 1000 ms pause). No sequence exploits a shared suffix (e.g. " engineer."); deletes always reach back to the prefix. Duplicates: E≡G and F≡H are byte-identical, doubling their odds in the random pick; C/D differ only in Hi/Hey.

## 5. typing-engine.js

Pick: `sequences[Math.floor(Math.random() * sequences.length)]` (te:165). Modes: `config.mode || window.__styleTypingMode()` (:98-99): `cursor` (default), `letter`, `word`; `config.deleteMode || window.__styleTypingDeleteMode()` (:108-109): `char`/`word`, word-delete only when cursorless (:110). Step handlers: pause :376 (default 800), type :384 (word path :388-420, char path :422-457), delete :460 (word :476-553, char :555-615), callback :618, unknown skipped :624-625, `onComplete` :370. DOM built: `.cursor` or `.tw-anchor` (:170-177), `.tw-word` boxes (:147-154), `.tw[.typing-accent]` glyphs (:335-340), `.typing-accent` span after the 2nd newline in cursor mode (:436-445). `reserveHeight` (:233-262) measures a hidden clone via `getBoundingClientRect` and re-runs on `fonts.ready` (:270-272), `link[data-style-asset]` load (:292-299), window load (:300-304), resize (:306-311). Sequences arrive as an argument; the config is cached on the function (:88) for the uncalled `__restartTypingSequence` (:637-639).

## 6. script.js: data vs DOM

- `renderBlogCards` :384-407: **data**. `window.BLOG_POSTS` (:382) → `#blog-scroll-track.innerHTML` (:385; index.html:248) of `a.blog-card[href][target=_blank if external] > h3.blog-card-title, p.blog-card-date, p.blog-card-excerpt` (:388-394); uses url/external/title/date/excerpt only (not id/tags). Tilt on `.blog-card` :397-406 is behavior.
- Intro wave `startAnimations` :16-105, `fadeInSubText` :111-122: **DOM only**; inline `animation`/`animationDelay` on `.static-menu`, `.name-logo`, `#typing-container`, `#socials-list`, `.static-menu-mobile`, `.double-view-left/right`, `#about-header-wrapper` children; delays 3.76/3.38/3/3.04/3.34/4.84 minus `DELAY_ADJUSTMENT 3` (:7); adds `html.hero-extras-in` (:24). Triggered by the typing callback, so timing is coupled to the animation.
- Jobs `initJobsMenu` :271-370: **DOM only**; `#jobs-menu-list`/`#highlight` (:272-273; index.html:152/:159); measured `offsetLeft/Width/Top/Height` (:290-297), mobile branch `innerWidth <= 1100` (:279-281), resize/load/ResizeObserver/scroll re-seat (:304-331), click swaps `.job-content` via classes + 500 ms timeouts (:333-369; panels static at index.html:163-197).
- Smooth scroll :215-252: **DOM only** (jQuery, `easeInOutQuad` from jquery-ui index.html:32); per-hash offsets :224-237; duration `100·ln(distance)` clamped 300-1000 (:239-242). Depends on nav having rendered `.menu-item`.
- Tilt :255-268: `.card` (index.html:75, :290), gated `__styleAllowsTilt` :257. DOM only.
- `AOS.init()` :212: no config input.

## 7. nav-config.js

`isSubpage = pathname contains '/blog'` (:4), `prefix` (:5). `NAV_CONFIG.NAV_LINKS` `{label, href, isBlogLink?, isResume?}` (:8-15); `MOBILE_NAV_LINKS` `{href, icon, label, ...}` (:16-20); `SCROLL_THRESHOLD: 300` (:21). Theme trigger pushed onto both when `__THEME_CYCLER_ENABLED` (:27-30). `SOCIAL_LINKS` `{href, icon, label, isCalendly?}` (:49-56).

`buildNavItems` (:95-117): `li` per item plus `li > span.menu-spacer` between (:97); theme trigger → `li.tc-nav-item > button.(menu-item|socials-item).tc-nav-trigger[aria-controls=tc-dock]` (:98-106); icon items → `a.socials-item[target=_blank]` (:107-110); else `a.menu-item[.resume-link|.blog-page-link]` (:111-115). innerHTML targets: `.moving-menu .menu-list, .static-menu .menu-list` (:123-126; index.html:50, :59), `.static-menu-mobile .menu-list` (:127-128; :62), `#socials-list`/`#blog-socials-list` (:73-76; :81), `.contact-menu .menu-list` with `socials-menu-spacer2` separators (:79-84; :281), `.contact-menu-mobile .menu-list` (:87-92; :285).

Calendly (:37-48, :135-140): every `.calendly-link` (rendered anchors plus static index.html:275) gets a click handler that calls `Calendly.initPopupWidget({ url: calendlyUrl() })`; `calendlyUrl` reads `getComputedStyle(document.documentElement)` for `--bg/--text/--primary`, strips `#`, fallbacks `1d1d1d`/`e6f1ff`/`61ffda` (:39-47). Sticky header (:142-163): `.menu-invisible` when `scrollTop < 100` (threshold/3, :151), `.menu-sticky` when scrolling up past 300 (:156-160).

If rendering moved to build: :4-130 collapses into per-page templates (`isSubpage` is a property of the page, `__THEME_CYCLER_ENABLED` is a constant at tb:8). Survivors: `CALENDLY_BASE`/`calendlyUrl` + handler (:37-48, :135-140, since the theme is live-switchable) and the sticky header (:142-163) with its threshold (:21).

## 8. blog-data.js

`FEATURED_PROJECTS` (:1-106): `id`, `title`, `description` (HTML prose with `<br><br>`), `image` (`../resources/…`), `tech[]` (data), `accentColor` (all `#61ffda`, not read by any of the seven files), optional `url`, `ctaLabel`, `external`, `url2`, `ctaLabel2`, `external2`. Deep RL (:97-105) has no link. URL forms mix absolute, root-relative (`/embedded-swift-agent/` :29, `/lexchat/` :93) and `../blog/post.html?id=…` (:43). `BLOG_POSTS` (:112-213): `id`, `title`, `date` (prose string), `excerpt` (prose), `url`, `tags[]` (data, unused by script.js), optional `external`. Commented entry :122-129 is the future gemma4-heretic-ara post (April 2026), matching the "currently working on a blog post" line at :6. Exports guarded by `typeof window` (:108-110, :215-217).

## 9. anim-utils.js, cursor-follow.js

au: animation-persist helpers (:15-30) plus a scroll-scrubbed section-header system: wraps each `.section-header` h2's text in `.section-header-text`, exploding it into `.section-header-word`/`.section-header-glyph` spans with `--glyph-i/--glyph-r` only for `GLYPH_SKINS {marquee}` (:90, :119-173), writes `--section-rule` from `getBoundingClientRect` in a rAF loop (:209-248), reveals via IntersectionObserver (:321-344), skips `data-header-intro` wrappers for the page intro (:341; index.html:96). Theme reads: `data-style` attribute (:104-106) re-split on mutation (:301-306), `--header-in-ms` via `getComputedStyle` (:179-182), `prefers-reduced-motion` (:308-319). It does not read `__styleAllowsTilt`.

cf: rAF-lerped `.cursor-follow`/`.circle-follow` toward `clientX/Y` (:16-31), hover class for `a, button, .job-menu-item` (:33-41), reveals `#cursor-container` on first move (:43-46). Reads nothing from the theme engine.

## Judgment

**Pure functions of build-time data (renderable at build)**: carousel card markup incl. `.pill` chips (fc:67-91, from `FEATURED_PROJECTS` + page depth); dots markup (fc:265-267); `--ticker-run`/`--ticker-dur` (fc:404-414) as a static `:root` declaration (1520 chars, 87s); `fc-style-floating` class (fc:65); blog cards (script.js:388-394 from `BLOG_POSTS`); all nav/social/contact menus (nav:58-130, given per-page `isSubpage` and the constant cycler gate); the sequence list itself (script.js:129-203) as data, which could shrink to terminal-string lists since the delete-count property holds everywhere; the `.section-header-text` wrapper for non-glyph skins (au:161-163). The glyph split (au:139-160) and tilt/typing-mode gates are data-pure only if the skin is fixed at build; today they must stay runtime because `data-style` switches live.

**Genuinely browser-side**: the random sequence pick (te:165) and the typing itself with `reserveHeight` measurement (te:233-311); intro-wave timing keyed off typing callbacks (script.js:16-122); jobs highlight geometry (script.js:283-302, :314-325); smooth scroll, tilt, AOS, scroll fades (`scrollWidth`), active-dot tracking and click centering, wheel guard, sticky header, cursor follower, `--section-rule` scrub and IntersectionObserver; Calendly URL from live computed colors (nav:38-48). Escaping caveat for any build step: `title` goes unescaped into `alt` (fc:84) and `description` is trusted HTML (fc:87).
