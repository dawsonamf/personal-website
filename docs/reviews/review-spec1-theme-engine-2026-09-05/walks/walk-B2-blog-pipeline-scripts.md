# Walk B2: blog pipeline scripts (Opus subagent of the thermonuclear reviewer)

Everything is read; nothing was written. Findings below (`L`=`/Users/dawsonamf/Desktop/dax/personal-website/blog/blog-listing.js`, `P`=`.../blog/blog-post.js`, `H`=`.../blog/post.html`, `I`=`.../blog/index.html`, `D`=`.../js/blog-data.js`).

## 1. Line counts
L 179, P 201, H 107, I 128 (`wc -l`).

## 2. blog-listing.js

**Masthead** `startTypingSequence` L:34-89, element `blog-typing-text`, typingDelay 75 (L:4), deleteDelay 40 (L:37). The engine picks ONE sequence at random (`js/typing-engine.js:165`) and `delete` is per-char `text.slice(0, len - count)` (`typing-engine.js:218`). Every sequence is the same 5-step shape: type X, callback `onBlogTypingComplete`, pause 800, delete N, type `'Blog.'`:
- L:39-45 "Cool things I've built." del 23
- L:46-52 "Things I find interesting." del 26
- L:53-59 "Late night rabbit holes." del 24
- L:60-66 "Rabbit holes." del 13
- L:67-73 "Things I've built." del 18
- L:74-80 "Random projects." del 16
- L:81-87 "Side quests." del 12

CHECK: the follow-up text is always "Blog." and no phrase starts with "B", so LCP=0 and expected delete = full length. All 7 counts match exactly; no exceptions (verified with an inline `os.path.commonprefix` script).

**Intro wave** `onBlogTypingComplete` L:7-32: `animateThenPersist` (`js/anim-utils.js:24-30`) fades `#blog-sub-text`/`-2`/`-3`, `#blog-socials-list`, `.name-logo`, `.static-menu(-mobile)`; slides in `#selected-works-header`'s `.section-header`, fades its spacer, calls `window.revealSectionHeader` after 250 ms (L:15-20); slides the carousel container and dots (L:27-31). Pure behavior on existing DOM.

**Data** L:93-95: `posts = window.BLOG_POSTS || []`; `allTags` = unique `flatMap(tags)` then default `.sort()` (lexicographic: "AI & ML", "Swift", "Systems", "Tools"); `activeTags` Set.

**Filter bar** L:99-119: `#filter-bar.innerHTML` = one `<button class="filter-pill" data-tag="${tag}">${tag}</button>` per tag (L:102-104). No "All" pill; empty selection means show everything (L:159-162). Single delegated click listener (L:106-118) toggles the tag in the Set plus `.active`, then `applyFilters()`.

**Cards** L:123-152, verbatim L:131-138:
```
`<div class="blog-card-wrapper" data-tags="${(post.tags || []).join(',')}" data-aos="fade-up" data-aos-once="true" data-aos-delay="${i * 50}">
        <a class="blog-card" href="${url}"${target}>
          <h3 class="blog-card-title">${post.title}</h3>
          <p class="blog-card-date">${post.date}</p>
          <p class="blog-card-excerpt">${post.excerpt}</p>
          <div class="blog-card-tags">${tagsHTML}</div>
        </a>
      </div>`
```
Built from ALL of `BLOG_POSTS` in registry order: no filter, no sort (the registry is hand-ordered newest first, D:112-211; `gemma4-heretic-ara` is commented out at D:123-128). `data-aos-delay = i*50` (L:131). `target="_blank" rel="noopener noreferrer"` only when `post.external` (L:129); non-external URLs have the leading `blog/` stripped (L:130). Then `VanillaTilt.init` on `.blog-card` gated on `window.__styleAllowsTilt` (L:142-151; defined `js/theme-bootstrap.js:646-649`, reads `flags.tilt`) with max 8, speed 400, perspective 1200, scale 1.02, glare false, gyroscope false.

**Filtering** `applyFilters` L:156-167: OR-match of `dataset.tags.split(',')` vs `activeTags`, toggles `.filtered-out` (`blog/blog-listing-styles.css:189-191` = `display: none`).

**Init** L:171-178: `initFeaturedCarousel({ isSubpage: true })`, `renderFilterBar()`, `renderCards()`, `resize` -> `AOS.refresh()`, `AOS.init({ offset: 50 })`.

Render (pure of `BLOG_POSTS`): pills L:102-104, cards L:127-139. Behavior: typing L:34-89, wave L:7-32, click L:106-118, tilt L:142-151, filters L:156-167, carousel/AOS L:171-178.

## 3. blog-post.js

**Renderer** `marked.use` P:4-30, `gfm: true, breaks: false`:
- link P:8-15: http(s) hrefs -> `<a href="${href}" class="text-link" target="_blank" rel="noopener noreferrer"${titleAttr}>`; otherwise `<a href="${href}" class="text-link"${titleAttr}>`.
- image P:16-19: `<img src="${href}" alt="${text}" class="blog-image"${titleAttr}>`.
- code P:20-28: `lang === 'mermaid'` -> `<div class="mermaid">${text}</div>` (raw, unescaped); known hljs lang -> `<pre><code class="hljs language-${lang}">` + `hljs.highlight`; else `hljs.highlightAuto`.

**Frontmatter** P:32-48: regex `^---\n([\s\S]*?)\n---\n([\s\S]*)$` (LF only), no match -> empty meta. Each line splits on first `:`; `[...]` values split on `,`, trimmed, surrounding quotes stripped (P:42-44). Keys are whatever appears; in practice `title`, `date`, `scripts`, `styles`.

**Id/fetch**: `new URLSearchParams(location.search).get('id')` P:137-138; missing -> "Post not found" P:140-143. `fetch(\`posts/${postId}.md\`)` P:145, non-ok throws P:147; catch P:197-200 writes "Post not found" and `<p>Sorry, this post could not be loaded.</p>`.

**Title/meta** P:153-166: `document.title = (meta.title || 'Blog') + ' | Dawson Metzger-Fleetwood'`; `#post-title.textContent = meta.title`. Pills: `meta.date` (frontmatter), then `postData.tags` where `postData = BLOG_POSTS.find(id)` (P:160), then a literal `<span id="read-time"></span>`; each wrapped in `<span class="pill">` (P:166). Two sources means drift: `metr-doubling.md:3` says "February 2026" vs D:178 "January 2026"; `helm.md:3` "March 2026" vs D:151 "April 2026".

**JSON-LD** `injectJsonLd` P:56-88: `@type BlogPosting`; `headline` = meta.title; `url` and `mainEntityOfPage.@id` = `window.location.href` (P:57, runtime); author/publisher hardcoded Person "Dawson Metzger-Fleetwood" / `https://www.dawsonamf.com/` (P:66-75); `datePublished` = `dateModified` = `parsePostDate(meta.date)` (P:50-54: `new Date(dateStr + ' 1').toISOString().slice(0,10)`, local parse then UTC, so in UTC+ zones "May 2026" becomes "2026-04-30", client-TZ dependent); `description` = registry excerpt, `keywords` = registry tags joined (P:81-82). Appended as `<script type="application/ld+json">` to head (P:84-87), after render, so only JS-executing crawlers see it.

**styles** P:127-135: `forEach` -> `<link rel="stylesheet">` appended to head, no await; called at P:168 before content is rendered. **scripts** P:114-125: `reduce` into a Promise chain; each `<script src>` appended to body, resolves on `onload`, rejects on `onerror`, strictly sequential (Plotly before chart script); called last at P:194-195 after content exists. Both coerce a string to a one-element array (P:168, P:194).

**Copy buttons** `addCopyButtons` P:90-112: for each `pre > code`, `pre.classList.add('has-copy-btn')`, then a `<button type="button" class="code-copy-btn" aria-label="Copy code">` whose innerHTML is `<i class="code-copy-icon code-copy-icon-copy fa-regular fa-copy" aria-hidden="true"></i><i class="code-copy-icon code-copy-icon-check fa-solid fa-check" aria-hidden="true"></i>` (P:99-101), appended as last child of the `pre` (P:110). Click: `navigator.clipboard.writeText(code.innerText)` then `.copied` for 1500 ms (P:103-108). Mermaid divs are not `pre>code`, so no button.

**Mermaid**: loaded unconditionally as a sync `<script>` in post.html head (H:22, `mermaid@11.15.0`); nothing injects it. `mermaid.initialize` is inline in post.html H:27-58: `startOnLoad: false, theme: 'base'`, colors read via `getComputedStyle` (H:32-36) from `--secondary` (fallback `#2c2c2c`), `--text` (`#e6f1ff`), `--neutral-gray` (`#a2a2a3`) (H:37-39), mapped to background/primaryColor/mainBkg/edgeLabelBackground, text vars, and line/border vars (H:43-54); `flowchart: { curve: 'basis', padding: 16 }` (H:55). `mermaid.run({ nodes: contentEl.querySelectorAll('.mermaid') })` is P:172, immediately after `contentEl.innerHTML = marked.parse(body)` P:171, before copy buttons P:173 and JSON-LD P:174; not awaited. Only `toolbelt.md` has mermaid fences (:17, :27); the other 10 posts load mermaid for nothing.

**Read time** P:176-179: `words = contentEl.innerText.trim().split(/\s+/).length`; `minutes = Math.max(1, Math.round(words / 200))`; `#read-time.textContent = minutes + ' min read'`. `innerText` is layout-aware (skips `display:none`, includes code and mermaid source text).

**Tilt** P:181-192: gated on `__styleAllowsTilt`, `VanillaTilt.init` on `.blog-image` with max 8, speed 6000, perspective 1200, scale 1, glare true, "max-glare" 0.15, gyroscope true.

**DOM** confirmed at H:87-93:
```
<article class="blog-post-container">
  <header class="blog-post-header">
    <h1 class="blog-post-title" id="post-title"></h1>
    <div class="blog-post-meta" id="post-meta"></div>
  </header>
  <div class="blog-post-content" id="post-content"></div>
</article>
```
JS only fills the three ids; the wrappers are static.

## 4. post.html
Head, in order: charset H:4, viewport H:5, `<title>Loading… | Dawson Metzger-Fleetwood</title>` H:6, description H:7 (no canonical, no OG tags, unlike the CLAUDE.md checklist), favicons H:8-9; CSS: font-awesome 6.5.1 H:11, boxicons@2.0.9 H:12, `../css/styles.css` H:13, `../css/mobile-styles.css` H:14, `blog-styles.css` H:15, `../css/theme-cycler.css` H:16; `<script src="../js/theme-bootstrap.js">` sync H:17; hljs github-dark 11.9.0 CSS H:19; sync scripts: highlight.js 11.9.0 H:20, `marked@18.0.5/lib/marked.umd.min.js` H:21, `mermaid@11.15.0/dist/mermaid.min.js` H:22, vanilla-tilt 1.7.0 H:23, `../js/blog-data.js` H:24; defer: `../js/nav-config.js` H:25, `../js/cursor-follow.js` H:26; inline `mermaid.initialize` H:27-58. Body: cursor divs H:63-66, nav shells H:73-85 (filled by nav-config), article H:87-93, footer H:95-101. End of body: `blog-post.js` sync H:104, `theme-cycler.js` defer H:105.

## 5. blog/index.html
Intro: three paragraphs `#blog-sub-text`, `-2`, `-3` at I:64-66 inside `#blog-typing-left` I:62-67 under `h1#blog-typing-text` I:63; `#blog-socials-list` I:68-70 is filled by nav-config. JS-filled containers: `#featured-track` I:83, `#featured-dots` I:88, `#filter-bar` I:100 (itself carries `data-aos`), `#blog-grid` I:105. Section headers: `<span class="sec-num">01.</span>Selected Works` I:76 inside `#selected-works-header` with `data-header-intro` I:75; `<span class="sec-num">02.</span>All Posts` I:96 in a `data-aos="fade-up"` wrapper I:95. Head: canonical I:8, OG I:11-16; aos@2.3.1 CSS I:20, Calendly CSS I:21, `featured-carousel.css` I:24, `blog-listing-styles.css` I:25; theme-bootstrap sync I:27; sync: aos@2.3.1 I:29, vanilla-tilt 1.7.0 I:30; Calendly widget.js `async` I:31; sync `blog-data.js` I:32, `featured-carousel.js` I:33, `typing-engine.js` I:34, `anim-utils.js` I:35; defer nav-config I:36, cursor-follow I:37. End of body: `blog-listing.js` sync I:125, `theme-cycler.js` defer I:126.

## 6. Assets
`blog/posts/assets/`: cohort-swe-age-data.json, cohort-unemployment-data.json, cohorts-chart.css/.js, heretic-ara-charts.css/.js, job-market-chart.css/.js, metr-chart.css/.js, rate-data.json, underviewed-art.css/.js.

Fetch URLs, all page-relative to `/blog/post.html`: `cohorts-chart.js:642` `'posts/assets/cohort-unemployment-data.json'`, `:658` overlay `'posts/assets/rate-data.json'`, `:664` `'posts/assets/cohort-swe-age-data.json'`, `:682` overlay `'posts/assets/rate-data.json'` (fetched at :717, :721). `job-market-chart.js:12` `'posts/assets/rate-data.json'` (fetched :129); its live series are `:8-9` raw.githubusercontent.com hiring-lab CSVs (:118). `metr-chart.js:204` fetches metr.org YAML via `corsproxy.io` (:216), parsed with `jsyaml.load` (:222).

Frontmatter -> assets: `metr-doubling.md:4-5` scripts `[https://cdn.plot.ly/plotly-2.27.0.min.js, https://cdn.jsdelivr.net/npm/js-yaml@4.2.0/dist/js-yaml.min.js, posts/assets/metr-chart.js]`, styles `[posts/assets/metr-chart.css]`; `gemma4-heretic-ara.md:4-5` scripts `[plotly-2.27.0, posts/assets/heretic-ara-charts.js]`, styles `[heretic-ara-charts.css]`; `underviewed-art.md:4-5` `[posts/assets/underviewed-art.js]` / `[underviewed-art.css]` (hits Met/Cleveland/V&A/Getty APIs, `underviewed-art.js:41,70,89,127,150,156`); `toolbelt.md` has no scripts/styles, only mermaid fences. `cohorts-chart.*`, `job-market-chart.*` and the three JSONs are referenced by no published post, only `docs/planned-posts/ai-job-market.md`, `docs/ai-job-market-post-plan.md`, `docs/TODO.md`.

## Judgment

Pure functions of build-time data (statically emittable today):
- Listing: filter pills (L:102-104) and the whole card grid including `data-aos-delay` and href rewriting (L:127-139).
- Post: `document.title`, `h1`, meta pills (P:153-166), the markdown-to-HTML body (marked + hljs are deterministic on the source), the `<div class="mermaid">` presence (P:21-22), so the mermaid `<script>` tag could be conditional on a mermaid fence (only toolbelt needs it), the copy-button markup (P:95-101, P:110; only the click handler P:103-108 is behavior), the per-post `<link>`s and `<script>`s in frontmatter order (P:114-135), and JSON-LD (P:56-88) once `url` is derived from site URL + id instead of `location.href` and the date is formatted without `Date`/TZ. Read time is pure in substance (word count / 200, P:176-177); only the `innerText` extraction is browser-bound, and `textContent` or the markdown word count gives the same rounded minutes.

Genuinely needs the browser: typing masthead and intro wave (L:7-89), AOS reveals and refresh (L:174-178), tilt (L:142-151, P:181-192), filter toggling state (L:106-118, L:156-167), clipboard writes (P:104), the mermaid SVG itself (colors are read from live theme vars at H:32-39, so a prebuilt SVG would freeze one skin), and the chart scripts (Plotly draw plus live fetches to GitHub, METR, museum APIs).
