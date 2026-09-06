# Structural theme demands: a desk-check for spec 1

> Historical research snapshot. The settled owner decisions in [Spec 1 §13](../spec-1-migration-engine-parity.md#13-settled-owner-decisions-q1-q14-2026-09-05) supersede earlier recommendations about post ownership/format, drafts, picker placement and palette support; use the current spec for implementation.

**Written:** 2026-09-05. Read-only research pass. Sources: `docs/intents/2026-09-05-theme-engine-rewrite/intent.md`,
`docs/cream-prototype.html` and `docs/mono-prototype.html` read in full, the other three prototypes skimmed,
the architecture comment at the top of `docs/theme-explorations.html`, and the current engine source
(`js/theme-bootstrap.js`, `js/theme-cycler.js`, `js/nav-config.js`, `css/themes/theme-base.css`).
Reference websites were **not** fetched (per instruction); vanlent and mosbyfiles rest on intent §6.3/§6.4 only.
Anything I could not verify from a file is marked **unverified**.

---

## 1. Summary for the spec author

1. Both prototypes replace the entire document, not just the body: `<html>`, `<body>`, fixed chrome, scrollbar rules and root font-size are all theme-owned.
2. Mono sets `html{font-size:1vw}` (`docs/mono-prototype.html:59`) with a `--sr` scale ratio. Any shared stylesheet that assumes a 16px root is wrong on mono's pages, including a "tokens-only fallback" page.
3. Cream's entry curtain is markup that exists **before** the content and is visible until JS removes it (`docs/cream-prototype.html:74,341`). It must be server-rendered in the initial HTML or it flashes.
4. Cream wraps everything in `#smooth-wrapper > #smooth-content` for ScrollSmoother (`:407,752`); mono runs Lenis on `window` (`:616`). Two different smooth-scroll shapes — the engine cannot standardise on one wrapper.
5. Three GSAP versions are now in play: 3.9.1 (default, unused), 3.13.0 (cream), 3.15.0 (mono). npm holds one `gsap` version per install unless aliased. This is an engine decision, not a theme decision.
6. All four free plugins the prototypes want resolve from the public registry (I curled `gsap@3.13.0/ScrollSmoother`, `gsap@3.13.0/SplitText`, `gsap@3.15.0/MorphSVGPlugin`, `lenis@1.3.21` js+css → all `200`).
7. Mono's six colour modes are ~11 CSS custom properties on `<html>` (`:47-53`), not the picker's five roles. They cannot be expressed as palette-toy presets without losing `--nav1/2/3`, `--bg2`, `--fill3`, `--line10`.
8. Mono applies a mode with `document.documentElement.className = 'theme-mode-' + m` (`:823`) — a wholesale className assignment that would wipe anything else the engine puts on `<html>`.
9. Mono's mode is applied **after** boot, so the prototype flashes. The engine's pre-paint bootstrap is the right home for it; modes need the same synchronous treatment as `data-style` today.
10. Bottom-right is **free** in cream but **occupied** in mono: `.menu-link.is-archive.is-resume` is `position:fixed;bottom:0;right:var(--pad)` (`:95`) and on mobile `.sticky-name` is `position:fixed;inset:auto 0 0` at 72px tall. A floating FAB fallback collides on mono.
11. The floating `.tc-toggle` FAB that the architecture comment and intent §4.7 describe **does not exist in code**. `css/theme-cycler.css` has zero `.tc-toggle` rules and `js/theme-cycler.js:558-559` returns early when no `.tc-nav-item` is present. Sixteen skin sheets style a button nothing creates. The fallback has to be built, not migrated.
12. Consequence of 11: privacy, 404 and lexchat load `theme-cycler.js` today and get **no picker at all**. Spec 1's "reachable in every theme" is a new requirement, not parity.
13. Both prototypes shatter canonical prose into layout-shaped fragments: mono splits one skills sentence into seven `<h1>` cells including a mid-word hyphen (`"vision-" / "OS apps,"`, `:355-361`) and the contact line into eight (`:503-546`). These are theme strings, not sizes of a canonical field.
14. Mono needs a **one-paragraph job summary** (`m`), not the bullet array: each certificate shows exactly one hand-picked bullet (`:424, 440, 456, 472`). Cream needs three bullets per job but its actual bullets run ~112 words for three — over the `m` budget of ~60.
15. Mono builds hover copy at runtime with `firstSentence(p.description)` (`:609,1024`). That is a `projects[i].description` at `s` that does not exist yet, faked by regex.
16. Both themes want a project **category** and a project **year**: cream's `.idx__meta` reads "VS Code extension · 2026 · …" (`:600`) and mono's card chip reuses `tech[0]` as a type (`:641`). §6.4 asks for the same field. One `category` + one `year` field serves three themes.
17. Cream's socials are **text labels** including GitHub (`:679-684`); `js/nav-config.js:49-56` has six icon-only entries and no GitHub. Mono renders the same registry as icons and hard-codes past the Calendly URL builder (`:663`). Socials need labels, icons, grouping and per-theme subsetting.
18. Cream tolerates nulls in two places, provably: a job with no website link drops `.idx__cta` (Visual Language Associates, `:520-524`) and a project with no URL renders `.idx__media` as a `<span>` not an `<a>` (Deep RL, `:637-641`). Mono is null-hostile: every `grid-area` cell is populated and an omitted `<h1>` fragment leaves a hole.
19. Mono ships **two structures in one DOM** toggled by `@media (max-width:991px)` plus a boot-time JS flag: `.is-desktop`/`.is-mobile`, a whole duplicate `.m-footer-inner` block (`:557-568`), and `display:none` on the hero reveal block, the globe section, the sticky wordmark, the custom scrollbar and the dev grid (`:223`). Direct evidence for §9's "two rendered structures" option and its duplication cost.
20. Both prototypes read their mobile flag **once** at boot with no resize handler (`cream:724`, `mono:613`). Crossing the breakpoint by rotation leaves the wrong branch. Whatever the engine picks for §9 must be stable across resize.
21. Breakpoints disagree with the site: cream uses 1024 (`:282`), mono 991 (`:221`), the site 1100. A structural theme owns its breakpoint; the 1100px convention is default-only.
22. Neither prototype designs a blog listing or post page. Both link out to the existing `../blog/` and `../blog/post.html?id=…`. Those page types fall back per §4.7 — and under mono that fallback inherits `font-size:1vw` unless scoped.
23. Mono depends on `js/blog-data.js` and `js/nav-config.js` as **data** (`:589-590`), not behaviour. Neither prototype loads AOS, vanilla-tilt, cursor-follow, typing-engine, jQuery, `script.js` or `featured-carousel.js`. Loading none of them is safe and required.
24. Cream writes `localStorage['ll-flies-swatted']` for an Easter-egg counter (`:1001`); mono writes `sessionStorage['theme-mode']` (`:823`). Two theme-owned persistence keys the engine must not stomp.
25. Both prototypes inject document-level SVG: cream a static `<filter id="brand-tone">` used by CSS `filter:url(#brand-tone)` (`:705`), mono one `<filter id="goo-…">` per revealed text line into a runtime `#goo-defs` (`:673-687`). Global id namespace, shared across whatever else is on the page.

---

## 2. Per-prototype findings

### 2.1 cream — `docs/cream-prototype.html` (1066 lines)

#### a. Page structure (in order)

| # | Section | Line | Shows | Canonical mapping |
|---|---|---|---|---|
| 1 | `.pt` entry curtain | 341 | orange + ink panels, fly loader, progress bar | none (chrome) |
| 2 | `.cursor` | 338 | custom cursor dot | none (chrome) |
| 3 | `#site-menu` overlay + trigger | 359-405 | full-screen menu: 5 numbered nav lines, 3 selected-works rows, latest post, fly egg | nav + projects (3) + posts[0] |
| 4 | `.lead` hero | 411 | giant three-line name over a drawn spine, three role links, location/availability, 4-image row | name, skills (3), location, contact status |
| 5 | `.focus-section` (pinned) | 452 | "Focused on building software that is:" + Interactive/Immersive/Intelligent + 3 bios | about + skills as three `m` bios |
| 6 | `.idx--jobs #experience` | 481 | 4 numbered index rows with spine + nodes, 3 bullets each | jobs[] |
| 7 | `#selected-works` | 547 | 3 giant motto words interleaved with 3 framed screenshots | projects[0..2] |
| 8 | `.idx #all-works` | 578 | 5 index rows with 16/10 framed shots | projects[3..7] |
| 9 | `.blog #blog` | 648 | 10 title + date rows | posts[] |
| 10 | `<footer id="contact">` | 669 | giant CTA, contact paragraph, Socials / name+legal / Contacts | contact, socials, footer credit |

**Omitted / merged vs the default:** no About card, no Skills card (both dissolved into the three focus bios); no typed masthead; no carousel (projects become motto rows + index rows); no section numbers `01.`–`05.` (renumbered per-list `01 / 04`); the `Where I've Worked` tabbed panel becomes a flat list of all four employers at once.

#### b. Nav model

Cream owns the nav completely. One fixed 44px hamburger at `top:14px; right:clamp(14px,3vw,40px); z-index:8010` (`:96`) opens a right-hand full-screen overlay (`z-index:8000`) with a blurred scrim. Nav labels: **Home, Let's work together, Projects, Blog, Résumé**, numbered `01`–`05` (`:388-392`). No persistent header, no logo, no inline links anywhere else.

**Picker mount proposal (cream):** add a sixth numbered line `06 Theme` in `.site-menu__nav`, opening the existing body-parented dock at `z-index ≥ 8020`. Two things make this work: the dock is already appended to `<body>` and positioned from the trigger's rect (`js/theme-cycler.js:568,614-627`), precisely so a `backdrop-filter` ancestor cannot become its containing block — cream's `.site-menu__scrim` has `backdrop-filter:blur(14px)` (`:104`), so a dock parented inside the overlay would break the same way. The menu's `lock()` sets `document.documentElement.style.overflow='hidden'` (`:960`) and pauses ScrollSmoother, which the dock does not care about.
**Fallback FAB is also viable here:** nothing in cream occupies bottom-right (the footer is static). The one caveat is `body{cursor:none}` (`:39`) — the FAB inherits no cursor, and the custom dot at `z-index:9999` ties with `.tc-dock`'s 9999, so DOM order decides. Give the FAB `.interactive` so the cursor grows over it.

#### c. External libraries

| URL | Version | Theme-specific? |
|---|---|---|
| `fonts.googleapis.com/css2?family=Poiret+One&family=Outfit:wght@200;300;400;500` (`:23`) | — | yes |
| `cdn.jsdelivr.net/npm/gsap@3.13.0/dist/gsap.min.js` (`:716`) | 3.13.0 | yes |
| `…/gsap@3.13.0/dist/ScrollTrigger.min.js` (`:717`) | 3.13.0 | yes |
| `…/gsap@3.13.0/dist/ScrollSmoother.min.js` (`:718`) | 3.13.0 | yes |
| `…/gsap@3.13.0/dist/SplitText.min.js` (`:719`) | 3.13.0 | yes |

All four GSAP URLs return `200` (verified by curl). No Font Awesome, no Boxicons, no jQuery, no AOS — cream's socials are text, so it needs zero icon fonts. That is a real weight saving and an argument for socials carrying labels as well as icons.

#### d. Document-level chrome and root demands

- **Preloader/curtain:** `.pt{position:fixed;inset:0;z-index:9990;visibility:visible}` (`:74`), in the DOM at `:341`, before `#smooth-wrapper` at `:407`. JS adds `.is-done` only after `load` + the outro timeline (`:1040-1060`). **Blocks first paint by design — must be in the emitted HTML.**
- **Custom cursor:** `.cursor` fixed `z-index:9999` (`:67`); `body{cursor:none}` and `a,button{cursor:none}` (`:39,41`); disabled under `prefers-reduced-motion` and on coarse pointers (`:772`).
- **Smooth scroll:** `ScrollSmoother.create({wrapper:'#smooth-wrapper', content:'#smooth-content', smooth:0.8, smoothTouch:0.5, normalizeScroll:true})` (`:752`). The wrapper contains `main` **and** `footer`; the curtain, cursor, menu and SVG defs sit outside it.
- **Root CSS:** `html{background:var(--bg);color:var(--primary);font-family:var(--body-font);font-size:16px;overflow-x:clip;scroll-behavior:auto}` (`:38`); `body{margin:0;min-height:100vh;overflow-x:clip;background:var(--bg);cursor:none}` (`:39`); scrollbars removed globally via `*{scrollbar-width:none}` + `*::-webkit-scrollbar{display:none}` (`:45-46`); `::selection` recoloured (`:44`). `history.scrollRestoration='manual'` + `scrollTo(0,0)` at boot (`:748-749`).
- **Colour modes:** none. Cream is single-palette (`:26-34`).
- **Document-level SVG:** `<filter id="brand-tone">` at `:705`, referenced by `img.toned{filter:url(#brand-tone)}` (`:43`). A global id; also breaks under a `<base>` tag.
- **Fixed chrome z-order:** cursor 9999 > curtain 9990 > menu trigger 8010 > menu overlay 8000. A picker dock needs ≥ 8020 to sit over the open menu, or ≤ 7999 to sit under it.

#### e. Mobile

One breakpoint: `@media (max-width:1024px)` (`:282-324`), plus `@media (prefers-reduced-motion:reduce)` (`:326`). It **reflows, it does not re-structure**: same DOM, different rules. The signature device is dropped rather than adapted — `.intro__line{display:none}` and `.h3-title span{color:var(--primary)}` (`:294-295`), i.e. the spine disappears and the transparent "I" becomes a normal orange letter. `.intro__name` goes static and left-aligned; `.idx__item` collapses 3 columns → 2 with media and bullets spanning full width; `.sw__motto` rows re-order; the footer stacks.

**Reasoning about 390px (no browser run):**
- Hero name: `.h1-title{font-size:clamp(64px,19vw,160px)}` → ~74px. "Fleetwood" in Poiret One at 74px is roughly 280px against 358px of usable width. Tight but plausible.
- **`.sw__motto` overflows.** At `:317` the motto keeps `padding:0 50px` (290px usable) and `div{gap:50px}`; word size is `clamp(34px,9.5vw,76px)` → ~37px, so "THE SAME" alone is ~170px, plus a `max-height:150px` image plus the 50px gap. The row exceeds 290px and is silently clipped by `html{overflow-x:clip}`. **Likely broken at 390px.**
- `.idx__name{clamp(40px,6.4vw,104px)}` floors at 40px; "Johns Hopkins University" wraps to two lines inside `overflow:hidden` with `line-height:.96` — descender clipping is plausible.
- The footer CTA is measured and refit by JS (`:945`), so its `calc(11vw - 6px)` is not load-bearing.
- `isMobile` is read once (`:724`) and gates `setupFocus`'s entire pin branch. Resizing across 1024px does not re-run it.

#### f. Prose slots (every text slot)

| Slot | Current text | Canonical field or theme string | Size |
|---|---|---|---|
| menu eyebrow | "Menu" | theme string | xs |
| nav 01–05 | Home / Let's work together / Projects / Blog / Résumé | nav labels | xs |
| menu works eyebrow | "Selected works" | theme string | xs |
| menu work row name ×3 | project titles | `projects[i].title` | xs |
| menu work row year ×3 | "2026" | **new field** `projects[i].year` | xs |
| menu latest eyebrow | "Latest post" | theme string | xs |
| menu latest title | "There is a fly on my laptop and it runs away" | `posts[0].title` | s |
| menu latest date | "August 2026" | `posts[0].date` | xs |
| fly hint | "don't swat the fly" / "flies swatted × N" | theme string (2 forms, one templated) | xs / s |
| hero name ×3 | Dawson / Metzger / Fleetwood | name, **split to match spine geometry** | xs ×3 |
| hero role links ×3 | "Full stack / Engineer", "iOS and / visionOS", "ML and / RL" | skills categories, each with a mandated `<br>` | xs |
| hero location | "Located in / Washington, DC" | location | xs |
| hero availability | "Open to / interesting projects" | theme string (or contact status) | xs |
| focus lead-in | "Focused on building<br>software that is:" | theme string, hard break | s |
| focus words ×3 | Interactive / Immersive / Intelligent | theme strings; **each must begin with "I"** (the spine is the shared glyph) | xs |
| focus bio heading ×3 | Full stack engineer / iOS and visionOS / ML and RL | skills category names | xs |
| focus bio body ×3 | 3 paragraphs, ~45-55 words each | about+skills merged; §6.1 calls these the `m` bios. **Prototype header marks them placeholder → drafts.** | m |
| jobs section title | "Where I've Worked" | section title | xs |
| jobs lead | "I'm currently a Software Engineer at About Objects, but am always open to interesting projects." (15 words) | about / contact status | s |
| job name ×4 | employer names | `jobs[i].company` | xs |
| job meta ×4 | "Software Engineer · July 2023 – Present" | `jobs[i].role` + `jobs[i].dates` | s |
| job CTA ×3 | "Visit website" | theme string or `jobs[i].ctaLabel`; **absent on VLA** | xs / **null** |
| job bullets ×4 | 3 bullets each, **~112 words per job** | `jobs[i].bullets` — **over the `m` budget of ~60 words** | m (declared) / l (actual) |
| works title | "Selected Works" | section title | xs |
| works CTA | "See all works ↗" | theme string | xs |
| mottos ×3 | NEVER / THE SAME / STACK | theme strings; exactly 3, one per project row, third row inverted (image then word); each must stay on **one line** (`white-space:nowrap`, width pinned in JS at `:906`) | xs |
| frame chrome title ×8 | project titles | `projects[i].title` | xs |
| hidden captions ×3 | "Gemma 4 MoE Heretic-ARA" + "Model fine-tune · 2026" | title + **new** `category` + `year`; `display:none` (`:249`) so a11y/SEO only | xs |
| index title | "Index" | theme string | xs |
| index lead | "Everything else from the projects registry: an extension, an MCP server, an app, a website, and a self-study." (18 words) | theme string — **over the `s` budget of ~15** | s |
| index project name ×5 | project titles | `projects[i].title` | xs |
| index meta ×5 | "VS Code extension · 2026 · TypeScript, VSCode API, …" | **new** `category` + **new** `year` + existing `tech[]`; year absent on 2 of 5 | s / partial null |
| index CTA ×4 | "View on VS Code Marketplace" etc. | `projects[i].ctaLabel`; **absent on Deep RL** | xs / **null** |
| blog title | "Blog" | section title | xs |
| blog CTA | "See all posts ↗" | theme string | xs |
| blog row title ×10 | post titles | `posts[i].title` | s |
| blog row date ×10 | "August 2026" | `posts[i].date` | xs |
| footer CTA | "Let's work together" | contact CTA (JS refits to width, so elastic) | s |
| footer lead | full contact paragraph with 2 inline links | contact — **Markdown with links**, confirms §4.3 | l |
| "Socials" heading | "Socials" | theme string | xs |
| social labels ×4 | LinkedIn / X / Messenger / **GitHub** | socials as **text**; GitHub is not in `SOCIAL_LINKS` today | xs |
| footer name | "Dawson Metzger-Fleetwood" | name | xs |
| footer edition | "© 2026 Edition" | theme string | xs |
| privacy link | "Privacy Policy" | nav label | xs |
| "Contacts" heading | "Contacts" | theme string | xs |
| contact rows ×3 | email address / "Contact card" / "Résumé" | socials subset, as text | xs |

**Nulls the layout already handles:** job CTA, project CTA, project media link, project year. **Nulls it does not:** the three motto words (the layout is three rows), the three focus words (the spine reveal is per-word), the hero name split.

#### g. Images/assets

All referenced files exist in `resources/`. Hero row: `profile_photo.jpg`, `location.png`, `Fly_Media.jpg`, `Purple_Toolbelt_Image.jpg` in 250×330 figures (need ~500×660 at 2×). Selected works: `KLvsRefusals.png`, `EmbeddedSwiftAgent_CLIScreenshot.png`, `Fly_Media.jpg` in small frames capped at 150px tall. Index: `Helm_All.png`, `Purple_Toolbelt_Image.jpg`, `Amino_Media.png`, `LexChat_Media.jpeg`, `RL_Media.png` at 16/10 in a `minmax(280px,42%)` column (up to ~590px, so ~1180px at 2×). Menu rows reuse three at 62×42. No GLB, no video.
**`location.png` is 943 KB**, over the ≤500 KB convention in `CLAUDE.md`; `ML_Media.png` is 495 KB. Both prototypes use `location.png`.

#### h. Extra pages

None. Cream is a single home page. It links out to `../blog/`, `../blog/post.html?id=…`, `../privacy/`, `../lexchat/`, `../embedded-swift-agent/` and `../resources/Resume.pdf`. Listing and post pages have no cream design → §4.7 fallback (default layout, cream tokens). Cream's blog-row grammar (`:648-664`) is close enough that owning the listing later is cheap, but that is a theme-spec call, not an engine one.

#### i. JS behaviours to author

Curtain + progress + fly hop and exit; custom cursor with hover swell and solid/translucent states; ScrollSmoother; hero timeline (spine `scaleY`, name `clip-path`, label stagger, portrait stagger); the pinned focus section — a measured spine extension driven by an `onUpdate` handler plus per-word clip reveal, ~60 lines of measurement (`:824-873`), the single hairiest piece; index spine scrub + node `is-on` toggles + per-item clip reveals; SplitText title reveal; the motto **font-scramble** hover (12 hard-coded system font stacks, `:894`) with `fitScale` re-measurement on `document.fonts.ready` and resize; blog row reveal; footer CTA fit-to-width + SplitText char reveal + a pointer wave using `gsap.quickTo`; the menu open/close timeline with scroll lock; the fly Easter egg with `localStorage`.

**Global-behaviour conflict check:** cream loads none of AOS, vanilla-tilt, `cursor-follow.js`, `typing-engine.js`, jQuery, `script.js` or `featured-carousel.js`. Loading none is **safe and required** — `cursor-follow` would double the cursor, AOS would re-hide elements cream reveals itself, jQuery's smooth-scroll easing would fight ScrollSmoother, and `script.js` would throw on `#jobs-menu-list` and friends. There is no `#typing-text` node, so `typing-engine.js` would no-op harmlessly, but there is no reason to ship it.

---

### 2.2 mono — `docs/mono-prototype.html` (1113 lines)

#### a. Page structure (in order)

| # | Section | Line | Shows | Canonical mapping |
|---|---|---|---|---|
| 1 | `.grid-wrap` dev grid | 304 | 8-column overlay toggled by a nav square | none (chrome) |
| 2 | `<nav class="nav">` | 311 | grid toggle + Menu button + staircase dropdown tiles | nav |
| 3 | `.intro` | 309 | preloader progress column, morphing logo, hero meta, three-line name, seven skill fragments, six theme swatches, statement, "Hi, I'm Dawson, full stack engineer.", © line, and a full-viewport reveal block with an orbiting tile carousel behind it | name, skills, about, projects (images) |
| 4 | `.featured #work` | 379 | a 3D globe of project tiles under a sticky heading that spreads and becomes "All Works" | projects[] |
| 5 | `.works #all-works` | 396 | 8 card tiles with tilt and slide-up CTA | projects[] |
| 6 | `.awards #experience` | 404 | "Roles & Experience", 4 employer rows with hover certificates | jobs[] |
| 7 | `.awards #blog` | 485 | "Blog & Writing", posts grouped by year | posts[] |
| 8 | `<footer #contact>` | 500 | 8 heading fragments around a live clock and a cycling image cell, mail block, icon socials, separate mobile footer | contact, socials, footer credit |
| 9 | `.theme-change-overlay` / `.theme-wipe` | 570, 587 | totem + liquid wipe for mode switches | none (chrome) |
| 10 | `.sticky-name` | 574 | wordmark halves + preloader count + meta lines | footer credit |
| 11 | `.scrollbar-wrap` | 586 | custom scrollbar | none (chrome) |

**Omitted / merged:** no About section (dissolved into the hero statement); no Skills section (the seven `<h1>` fragments); no section numbers; no typed masthead; jobs and posts share **one** "awards certificate" grammar; projects appear **three times** (orbit tiles, globe, card grid) from the same eight entries.

#### b. Nav model

Mono owns the nav. Fixed bar at `z-index:94` (`:86`) with a grid-toggle square left and a pill "Menu" button right, whose label swaps to "Close". Opening staircases three big tiles down (`Home`, `Work`, `Contact` at `.h2` size, in sizes 240×360 / 272×280 / 224×216 `--px` units) plus two small "archive" tiles pinned to the bottom-right (`Blog`, `Resume`). Numbered indicators `1/2/3` track the section in view via ScrollTrigger (`:806-810`). §6.2 records the reference's labels as Home / Work / Contact / **Experiments**; the prototype substitutes Blog + Resume.

**Picker mount proposal (mono):** a fourth big staircase tile in `[data-nav="link-group"]` labelled "Theme", sized like `.is-contact`, opening the dock body-parented at `z-index ≥ 101` (above `.theme-change-overlay`'s 100). The dropdown closes itself on any scroll over 10px (`:805`), so the dock must not be a child of the group. **Do not use the floating FAB here:** bottom-right holds `.menu-link.is-archive.is-resume` (`position:fixed;bottom:0;right:var(--pad)`, `:96`) while the menu is open, and on mobile `.sticky-name` becomes `position:fixed;inset:auto 0 0` at 72px (`:225`). A second option that avoids the menu entirely: give the global picker its own cell in the existing `.theme-grid` row (`:339-346`), sitting beside the six mode swatches — the row is already a picker, and it is `pointer-events:auto` inside an otherwise inert hero. That would put the global picker and the theme-internal modes literally side by side, which needs an owner decision (§4 below).

#### c. External libraries

| URL | Version | Theme-specific? |
|---|---|---|
| `fonts.googleapis.com/css2?family=Work+Sans:wght@500` (`:29`) | — | yes |
| `cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css` (`:30`) | 6.5.1 | **no — same as the default site** |
| `cdn.jsdelivr.net/npm/boxicons@2.0.9/css/boxicons.min.css` (`:31`) | 2.0.9 | **no — same as the default site** |
| `cdn.jsdelivr.net/npm/lenis@1.3.21/dist/lenis.css` (`:32`) | 1.3.21 | yes |
| `…/gsap@3.15.0/dist/gsap.min.js` (`:591`) | 3.15.0 | yes |
| `…/gsap@3.15.0/dist/ScrollTrigger.min.js` (`:592`) | 3.15.0 | yes |
| `…/gsap@3.15.0/dist/CustomEase.min.js` (`:593`) | 3.15.0 | yes |
| `…/gsap@3.15.0/dist/MorphSVGPlugin.min.js` (`:594`) | 3.15.0 | yes |
| `…/lenis@1.3.21/dist/lenis.min.js` (`:595`) | 1.3.21 | yes |
| `../js/blog-data.js`, `../js/nav-config.js` (`:589-590`) | local | **data, not behaviour** |

Font Awesome and Boxicons are pulled in only to render `SOCIAL_LINKS` icons — if socials carried text labels (as cream does), mono could drop both. Worth flagging to the theme spec as a weight decision.

#### d. Document-level chrome and root demands

- **Preloader:** not a curtain — the page paints, then `preloader()` (`:857-882`) animates a progress column to `height:100%` over 4s, counts 0→100% into a `<div class="count">` and slides the nav in from `±5vw` (`±25vw` mobile). It calls `lenis.stop()` first (`:866`) and `lenis.start()` when done. Everything with `[data-reveal]`, `[data-preloader]`, `[data-sticky-name]`, `[data-sticky-meta]` starts `visibility:hidden` in CSS (`:76`) — so **the initial HTML must ship those elements hidden**, and if JS never runs the page is largely blank. That is a no-JS hazard cream avoids with a `<noscript>` block (`cream:333`); mono has none.
- **Smooth scroll:** `new Lenis({duration:1.2, smoothWheel:true, touchMultiplier:2, easing:…})` on `window` (`:616`), wired to `ScrollTrigger.update` and `gsap.ticker` with `lagSmoothing(0)`. **No wrapper element.**
- **Root CSS:** `html{font-size:1vw;background:var(--bg);scrollbar-width:none}` (`:59`) plus `::-webkit-scrollbar{display:none}` (`:60`). Every dimension in the sheet is `calc(N * var(--px))` where `--px:calc(1rem/var(--sr))` and `--sr` is 14.4 desktop / 3.93 mobile (`:35,45`). `body{line-height:1;overflow-x:clip}` (`:61`). `history.scrollRestoration='manual'` (`:607`).
- **Colour modes (six):** stored as `sessionStorage['theme-mode']` (`:821,823`), applied as a **class on `<html>`** — `html`, `.theme-mode-1`, `.theme-mode-2`, `.theme-mode-3`, `.theme-mode-4`, `.theme-mode-dark` (`:47-53`). Each mode sets **11 custom properties**: `--ink`, `--ink50`, `--ink30`, `--fill3`, `--line10`, `--nav-fill`, `--bg`, `--bg2`, `--nav-active`, `--nav1`, `--nav2`, `--nav3`. Applied with `document.documentElement.className = 'theme-mode-' + m` (`:823`) — a **whole-className write**. Applied post-boot, so the prototype flashes `base` first. Mode names surface as aria-labels: Concrete, Dark, Verdigris, Rust, Light, Blood (`:340-345`).
- **Fixed/sticky chrome:** `.nav` fixed z94 (`:86`); `.grid-wrap` fixed inset:0 z95 (`:99`); `.menu-link.is-archive` fixed bottom-right (`:95`); `.sticky-name` sticky bottom z95, fixed on mobile (`:205,225`); `.scrollbar-wrap` fixed right z10 (`:211`); `.theme-change-overlay` fixed inset:0 z100 (`:213`); `.theme-wipe` fixed inset:0 z99 (`:215`); `.featured-heading-wrap` `position:sticky;top:50%` (`:158`).
- **Runtime SVG:** `#goo-defs` prepended to `<body>` (`:670`) holding one `<filter id="goo-…">` per revealed text line — dozens of filters, random ids.
- **MutationObserver on `documentElement` `attributeFilter:['class']`** (`:1078`) so the fluid canvas re-reads `--bg`. Any engine class-stamping on `<html>` fires it.

#### e. Mobile

One breakpoint, `@media (max-width:991px)`, in two blocks: token overrides at `:45` (`--sr:3.93`, smaller `--h1`, `--p1`) and the layout block at `:221-262`. This is a **different structure, not a reflow**:
- `display:none` on `.nav-grid`, `.reveal-block-wrap`, `.featured` (the whole globe section), `.sticky-name-inner`, `.sticky-name-meta`, `.scrollbar-wrap`, `.is-desktop`, `.works-item-button` (`:223`).
- `.is-mobile{display:block}` reveals a **separate mobile footer** that exists only for mobile (`.m-footer-inner`, `:557-568`).
- Grid goes 8 → 6 columns; every `g-*` grid-area is re-assigned to plain `grid-column` spans (`:236-240`).
- `.theme-grid` becomes a horizontal `overflow:auto` scroller (`:232`).
- `.works-list` grid → flex column; `.award-item-certificate{display:none!important}` (`:250`).
- `.sticky-name` goes `position:fixed;inset:auto 0 0;height:var(--u72)` — a permanent bottom bar.
- JS branches on `mobile` at boot for `initLinks`, `initNav` (stagger direction and clip axis), `initSticky`, `initScrollbar`, `initAwards`, `initFeatured`, `initGlobe`, `initOrbit`, `initFluid` and the preloader's slide distance. Read once at `:613`, **no resize handler**.

**Reasoning about 390px:** `html{font-size:1vw}` → root 3.9px; `--px = 1rem/3.93 ≈ 0.99px`, so the `calc(N*--px)` sizes land near their intended pixel values and `--h1 ≈ 44.6px`. `.menu-link{width:calc(320*--px)}` ≈ 317px fits. The fixed `.sticky-name` bar is 72px tall and the footer's `padding-bottom:var(--u72)` ≈ 71px just clears it. Nothing looks broken at 390px. The **real** risk is the other end: `1vw` has no clamp, so a 2560px monitor gives a 25.6px root, `--px ≈ 1.78px` and `--h1 ≈ 160px` — everything scales forever. Secondary: `.theme-grid`'s horizontal scroller inside a Lenis page with `touchMultiplier:2` is a known friction pattern (**unverified** whether it actually traps the gesture here).

#### f. Prose slots

| Slot | Current text | Canonical field or theme string | Size |
|---|---|---|---|
| nav button | "Menu" / "Close" | theme strings (2) | xs |
| menu tiles ×3 | Home / Work / Contact | nav labels | xs |
| archive tiles ×2 | Blog / Resume | nav labels | xs |
| logo eyebrow | "Engineer<br>& Builder" | theme string, hard break | xs |
| hero meta | "Based in Washington, DC" | location | s |
| hero meta | "Working w/" + "About Objects" | theme string + `jobs[0].company` | xs |
| hero name ×3 | Dawson / Metzger- / Fleetwood | name, **hyphen split baked in** | xs |
| skill fragments ×7 | Web, / iOS & / vision- / OS apps, / ML & / RL / dev. | theme strings; one sentence shattered across grid cells with a mid-word break | xs ×7 |
| statement | "Professional developer since 2019. Builds…real world problems." (21 words, 2 hard breaks) | about; **header comment marks it placeholder → draft** | m |
| hero fragments ×4 | Hi, / I'm / Dawson, full / stack engineer. | theme strings | xs |
| copyright | "© '26" | theme string | xs |
| mode aria-labels ×6 | Concrete / Dark / Verdigris / Rust / Light / Blood | theme strings; §3.1 requires approved aria text | xs |
| featured heading | "Work" / "22-26" / "All Works" | theme strings | xs |
| globe hover info | `title + ". " + firstSentence(description)` (`:1024`) | wants `projects[i].description` at **`s`**; faked by regex today | s |
| works heading | "All Works" | theme string | xs |
| card chip ×8 | `tech[0]` used as a type | wants **new** `projects[i].category` | xs |
| card title ×8 | project titles | `projects[i].title` | xs |
| card CTA ×8 | ctaLabel / ctaLabel2 | `projects[i].ctaLabel`; **omitted when no url** (`:645`) | xs / null |
| jobs heading ×4 | Roles / & / Experi- / ence | theme strings, hyphen split | xs |
| job year ×4 | '23 / '24 / '19 / '22 | derived from `jobs[i].start` | xs |
| job company ×4 | employer names | `jobs[i].company` | xs |
| job role ×4 | Software Engineer, Guest Lecturer, … | `jobs[i].role` | xs |
| job dates ×4 | "July 2023 – Present" | `jobs[i].dates` | xs |
| job certificate ×4 | **one** hand-picked bullet each, ~30-50 words | wants **`jobs[i].summary` at `m`**, not the bullet array | m |
| blog heading ×4 | Blog / & / Writ- / ing | theme strings, hyphen split | xs |
| blog year label | "3 posts", "1 post", ", About Objects blog" | **templated strings built in JS** (`:651`) — visitor-facing, so §3.1 prose | xs |
| post title ×10 | post titles | `posts[i].title` | s |
| post month ×10 | "August" | `posts[i].date` | xs |
| footer fragments ×8 | My inbox / is always / open. If / you're / interested / in working / together, / say hi. | the contact line shattered across grid cells around the clock | xs ×8 |
| clock glyphs | "(" ":" ":" ")" | theme strings | xs |
| footer mail lead | "Always open to<br>interesting projects" | theme string | s |
| footer mail label | "Write directly to:" | theme string | xs |
| footer email | address | contact email | xs |
| social aria-labels ×6 | LinkedIn, X (Twitter), … | `SOCIAL_LINKS[i].label`, **icons only** | xs |
| mobile footer wordmark | "dawson" | theme string | xs |
| mobile footer meta ×2 | "'26 © All rights reserved" / "Built by Dawson Metzger-Fleetwood" | theme strings | s |
| sticky wordmark ×2 | "daw" / "son" | theme strings that **must concatenate to one word** | xs |
| sticky meta ×2 | "'26 © All rights reserved" / "Designed and built by Dawson Metzger-Fleetwood" | theme strings; **header comment marks the meta line placeholder → draft** | s |

**Nulls:** only two paths exist — the card CTA and overlay drop when a project has no `url` (`:642,645`), and a job row renders as `<div>` not `<a>` when it has no link (`:452`). Every other cell is a fixed `grid-area`; **an omitted fragment leaves a visible hole in the grid.** Mono is the theme that most needs the "slot must handle null" rule to be enforced at build.

#### g. Images/assets

All eight `FEATURED_PROJECTS` images, used three times each: orbit tiles at `clamp(16em,30vw,32em)` 4:3 (up to ~1000px wide, so ~2000px at 2×, larger than anything in `resources/` today); globe tiles at `calc(104*--px)` 16:10 (~185px at 1920); works cards at `calc(332*--px)` tall (~590px at 1920). Footer logo cycle uses `profile_photo.jpg`, `location.png`, `Fly_Media.jpg`, `Helm_All.png`, `Amino_Media.png` at ~340px wide (`:518-524`). Two inline SVGs (the monogram with a `data-morph-final` path, and the totem). No GLB, no video, no three.js — the reference's WebGL2 fluid sim is replaced by a 2D canvas (`:1071`). If the real theme wants the actual fluid sim, that is the §3.3 heavy-library case and it does not exist yet.

#### h. Extra pages

§6.2 calls `/work` a theme-only page. **The prototype does not have one** — `#all-works` is a section on the home page (`:396`). So the theme-only route is asserted by the intent, not demonstrated. The engine still needs the capability (mosbyfiles' About page needs it too), but mono's spec can decide whether `/mono/work/` is a route or an anchor. Blog listing and post: no mono design; both fall back per §4.7 — and that fallback must **not** inherit `html{font-size:1vw}`.

#### i. JS behaviours to author

Preloader (progress column, 0→100 count, nav slide-in, Lenis gate); gooey SVG-filter text reveal (per-line filter injection, animated `feGaussianBlur`/`feColorMatrix`); blur div reveal; clip-down reveal; split-char link hover (`chars()` at `:768` **replaces the element's children with `span.ch` per character — any inline markup or Markdown link inside such a label is destroyed**); staircase menu with scroll-close and section indicators; six-mode picker with a radial-mask liquid wipe and a totem spin driven by a hard-coded polynomial (`:846-850`); MorphSVG logo morph; sticky wordmark that joins at page bottom; custom scrollbar; dev grid overlay; footer clock (`setInterval` 1s, never cleared) and image cycle (`setInterval` 5s); awards certificate hover; card tilt hand-rolled with `gsap.quickTo` (±40°/±25°) plus a slide-up button; featured heading width scrub; a CSS-3D globe (fibonacci sphere, `requestAnimationFrame`, drag inertia); hero orbit tiles (chained GSAP timelines, continuous); fluid canvas erase-and-heal (rAF while visible).

**Global-behaviour conflict check:** loading none of the default's behaviour scripts is **safe and required**. Mono's card tilt is its own, so vanilla-tilt (and therefore `flags.tilt`) must not run; AOS entrances would double with `[data-reveal]`; `cursor-follow` is pointless and `typing-engine` has no target. The one dependency that must survive migration is `blog-data.js` + `nav-config.js` **as data** — in Astro that becomes the content collection, which is what §4.3 already plans.

---

### 2.3 The three skimmed prototypes

**`docs/bento-prototypes.html` (350 lines).** Five bento-grid variations (glass, and four others) in one scrollable comparison file, each rendered inside an `88vh` scrolling `.frame` (`:26`). Variation C keeps the canonical five numbered sections (`01 About` … `05 Contact`, `:243-276`); the others rearrange the same content as tile mosaics. Pure CSS grid, no JS, no libraries beyond one Google Fonts link. **No new engine demand.** It is a layout sketchbook, not a theme starting point, and everything it does is expressible as a skin over a re-ordered DOM. Its only useful signal for spec 1 is that a tile grid wants short `xs`/`s` prose plus one image per tile, which the sizes system already covers.

**`docs/layout-prototypes.html` (306 lines).** Six "layout-shifting theme ideas" — sticky chapter heads, full-screen snap slides (`:179-184`, six numbered slides each carrying one canonical section), a two-pane split, a document-style single column, and two more, again in `88vh` frames. Also pure CSS, no libraries. **No new engine demand beyond what cream and mono already force**, but it is the clearest evidence for one thing the checklist must cover: the snap-slide variant reduces each canonical section to a heading plus 2-4 `xs` labels, which is the "same content at a much smaller size" case that §4.2 exists for. Worth citing in the spec as motivation, not as a consumer.

**`docs/list-portfolio-prototype.html` (216 lines).** One full-page mock after benjamincreative.me: white ground, Inter at poster scale, one hot accent `#fb4617`, a **sticky top bar with `backdrop-filter`** (`:32`), numbered hairline lists with hover previews, giant statement blocks, a big-type ticker, an all-caps footer. Uses `html{scroll-behavior:smooth}` and no JS libraries. Section order: hero, selected works, statement, skill sets, pull quote, where I've worked, writing, closing CTA (`:114-204`). **One engine demand it adds that cream and mono do not:** it has a *persistent sticky top bar* rather than a hidden menu, which is the third nav shape (cream = hidden overlay, mono = fixed bar + dropdown, this = sticky bar). If the picker-mount contract is written only against "hamburger" and "pill", a sticky bar theme has nowhere obvious to go. It also uses placeholder statement/quote/about copy — more theme strings.

---

## 3. Engine capabilities checklist

`c` = cream, `m` = mono, `v` = vanlent (§6.3), `x` = mosbyfiles (§6.4). Themes in **bold** are hard blockers for that theme.

| # | Capability | Themes | Evidence | What spec 1 must provide |
|---|---|---|---|---|
| 1 | Own layout/DOM per page type | **c m** v x | cream `:407-700`, mono `:304-588`; nothing canonical survives | A theme declares a layout component per page type it owns; the default components are just the first implementation of that interface. |
| 2 | Own `<head>`: fonts, libs, meta, while the engine still injects shared bits | **c m** v x | cream `:23,716-719`; mono `:29-32,591-595`; §4.5 wants canonical+noindex on themed paths | One `<Head>` slot the theme fills, plus an engine-owned block that always appends picker assets, the draft toggle in preview, canonical link and `noindex`. |
| 3 | Own root-level CSS incl. `html` font-size, background, overflow, scrollbar | **m** c | mono `:59` (`font-size:1vw`), cream `:38-46` | Root/`<html>`/`<body>` attributes and a theme root stylesheet emitted per page, **scoped so unowned fallback pages never inherit them**. |
| 4 | Own nav, with a defined picker mount point | **c m** v x | cream `:359-405`; mono `:311-337`; list-portfolio `:32` adds a third shape | A `<ThemePicker />` component a theme places anywhere in its chrome, positioned from its own trigger rect, body-parented, with a theme-settable z-index. |
| 5 | Floating picker fallback when a theme mounts none | c m v x | **the `.tc-toggle` FAB does not exist** — `css/theme-cycler.css` has 0 rules, `js/theme-cycler.js:558-559` bails without `.tc-nav-item`; 16 skin sheets style a phantom | Build the FAB for real, and let a theme declare its safe corner (mono's bottom-right is taken: `mono:96,225`). |
| 6 | Theme-only routes (`/mono/work/`) | m x | §6.2, §6.4; **mono's prototype inlines it instead** (`:396`) — capability asserted, not demonstrated | `getStaticPaths` over `theme × theme-declared-extra-pages`; a theme-only route must 404 (or redirect) under other themes. |
| 7 | Unowned page types fall back to the default layout in theme tokens | **c m** v x | neither prototype designs listing/post/privacy/404/lexchat; both link to the existing pages | Per §4.7: a theme declares owned page types; everything else renders the default layout with the theme's tokens **and without its root CSS** (see 3). |
| 8 | Theme client scripts load only on that theme's pages | **c m** v x | cream 4 GSAP files, mono 5 + Lenis + 2 icon fonts; §3.3 | Per-theme entry module, code-split by Astro/Vite; assert in the build that no theme bundle leaks into another theme's page. |
| 9 | Multiple pinned versions of one library side by side | **c m** | gsap 3.9.1 (default) / 3.13.0 (`cream:716`) / 3.15.0 (`mono:591`) | Decide now: npm alias (`gsap-313@npm:gsap@3.13.0`), or upgrade everything to one version (§7 already wants 3.9.1 dropped from the default). Do not leave this to the theme specs. |
| 10 | Theme-internal colour modes coexisting with the global picker and palette toy | **m** | mono `:47-53` (6 modes × 11 vars), `:821-823` (sessionStorage + className write) | A theme declares its own modes with its own storage key and its own pre-paint stamp; the engine must stamp `<html>` **additively** (never `className =`) and the picker must not clear a theme's mode. §9 leaves the coexistence model open — decide it here. |
| 11 | Pre-paint application of theme modes | **m** | mono applies in `initTheme()` after boot (`:823`) and flashes | Extend the existing synchronous pre-paint bootstrap to theme modes, the same way `data-style` works today. |
| 12 | Prose requested by slot at a size, with explicit null | **c m** v x | cream's null-tolerant CTAs (`:520,637`); mono's `grid-area` cells that cannot be empty | A slot API that takes `(entry, field, size)`, renders nothing on `null`, and fails the build when a requested size is unwritten (§4.2). |
| 13 | Theme-specific strings under the theme's own prose section | **c m** v x | cream mottos/eyebrows/edition line; mono's 7 skill fragments + 8 footer fragments + wordmark halves | A `themes.<id>.*` section in the YAML, same draft flow, same sizes, schema-validated per theme. |
| 14 | Sized prose that must satisfy **structural** constraints, not just word counts | **c m** | cream's focus words must each start with "I" (`:459-461`); the three mottos must be one line each (`:906`); mono's "daw"+"son" must concatenate; several fragments carry mandated `<br>` | Let a theme declare per-slot constraints (max lines, forced break points, an initial-letter rule) so a prose edit fails the build instead of the layout. **Not in the intent — new.** |
| 15 | Ordered fragment arrays as a prose type | **m** c | mono `:355-361` (7), `:503-546` (8); cream's 3-line name and 3 mottos | The schema needs an ordered-list-of-`xs` type with a fixed length, not N separately named strings. **Not in the intent — new.** |
| 16 | New content field: project `category` | c m **x** | cream `:600` ("VS Code extension"), mono `:641` (abuses `tech[0]`), §6.4 asks for it directly | Add `category` (`xs`) to the project schema; drafts for all eight. |
| 17 | New content field: project `year` | **c** m | cream `:600`, menu rows `:396-398`; absent for 2 of 8 projects | Add `year` as nullable; the meta line must join around a missing value. |
| 18 | New content field: `jobs[i].summary` at `m` | **m** | mono shows exactly one hand-picked bullet per job (`:424,440,456,472`) | Add a one-paragraph job summary; do not make themes pick bullet indexes. |
| 19 | `projects[i].description` at `s` | **m** | mono regexes the first sentence out of the `l` description at runtime (`:609,1024`) | Author an `s` description per project; remove the regex. |
| 20 | Sized `jobs[i].bullets` that actually fit | **c** | cream's three bullets per job run ~112 words vs the `m` budget of ~60 (`:494-500`) | Either write a true `m` bullet set, or let cream request `l` and accept the length. Flag the budget mismatch to the owner. |
| 21 | Socials as text labels, with grouping and subsetting | **c** m | cream `:679-696` (4 text socials incl. **GitHub, absent from `nav-config.js:49-56`**, then a separate "Contacts" group); mono renders icons and hard-codes past the Calendly URL builder (`:663`) | Socials entries carry label + icon + group; a theme picks a subset and a render mode. Add GitHub. Keep the palette-aware Calendly URL builder reachable. |
| 22 | An image grid / gallery fed from project images | m **x** | mono uses each project image three times at three sizes (`:631-641`); §6.4 wants an asymmetric full-bleed grid | Project images need multiple declared sizes and an ordering; consider responsive image generation now that there is a build. |
| 23 | A preloader / curtain that ships in the HTML before content | **c** m | cream `:74,341` (blocking, `visibility:visible` until JS); mono `:76` (everything starts hidden, no `<noscript>`) | A document-chrome slot rendered before the main content, plus a no-JS escape hatch (cream has one at `:333`, mono has none). |
| 24 | Full-screen menu that replaces the nav entirely | **c** m x | cream `:359-405`; mono's staircase `:322-336`; §6.4's single "About" top bar | Nav is a theme component, not engine chrome. The engine contributes only the picker mount. |
| 25 | Smooth-scroll takeover, in **two different shapes** | **c m** v | cream needs `#smooth-wrapper > #smooth-content` around everything (`:407,752`); mono needs Lenis on `window` (`:616`) | The page shell must let a theme wrap the whole body tree, or not, without the engine assuming either. Do not standardise. |
| 26 | Different mobile structure, not just reflow | **m** c | mono hides 8 desktop-only blocks and shows a separate mobile footer (`:223-224,557-568`); cream reflows only | Resolve §9: media-query-toggled dual structure (mono's proof, duplicated markup) vs component branching. Whatever wins must be **resize-stable** — both prototypes read the breakpoint once (`cream:724`, `mono:613`). |
| 27 | Theme-owned breakpoints | **c m** | 1024 (`cream:282`), 991 (`mono:221`), 1100 (site) | The 1100px constant is default-only; a structural theme declares its own. |
| 28 | Document-level SVG defs (filters) | **c m** | cream `<filter id="brand-tone">` (`:705`); mono injects one filter per text line (`:670-687`) | A document-defs slot with namespaced ids, so two themes or a theme plus a chart widget cannot collide. |
| 29 | Theme-owned persistence keys | c m | `localStorage['ll-flies-swatted']` (`cream:1001`), `sessionStorage['theme-mode']` (`mono:823`) | Namespace theme storage and keep the engine off it. Decide whether theme-internal modes persist (owner question, §4 below). |
| 30 | A contact form or mailto | v | §6.3: "a contact form has no backend (mailto or omit)" | Both structural themes here use plain `mailto:`; the engine needs no form runtime. Ship mailto, revisit if vanlent's spec wants a real form. |
| 31 | An About page as a theme-only page | **x** | §6.4 | Same mechanism as capability 6. |
| 32 | Statistics / testimonials as omittable sections | v | §6.3: stats need approved numbers or are omitted; testimonials have no source and are omitted | Section-level omission, which capability 12's `null` already covers if a theme's page composition is data-driven rather than hard-coded. |
| 33 | Six service cards mapping to Skills, or omitted | v | §6.3 | Skills need `xs` names and `s` one-liners in addition to cream's `m` bios. |
| 34 | Hover/interaction copy generated from prose, never from regex | m | mono `firstSentence()` (`:609`); mono's "3 posts / 1 post" pluralisation built in JS (`:651`) | §3.1 says every visitor-facing string is prose. Templated/pluralised strings need an approved template form, not string surgery. **Not called out in the intent — new.** |
| 35 | aria-label and alt sourced from approved strings | c m v x | mono's six mode aria-labels (`:340-345`); cream's `aria-label` on media links (`:601`) | §3.1 already requires this; the checklist item is that **theme chrome** (mode names, menu labels) also needs approved strings, not just content. |
| 36 | Split-text safety | **m** | `chars()` replaces an element's children with per-character spans (`:768-775`) | Slots consumed by split-text must be declared plain-text; Markdown rendering into them has to be blocked at build, not discovered at runtime. **New.** |
| 37 | A theme opting out of every default behaviour script | **c m** v x | neither prototype loads AOS, tilt, cursor-follow, typing-engine, jQuery, `script.js`, `featured-carousel.js` | Default behaviours belong to the default *layout*, not to the site. Nothing global may assume they ran. |
| 38 | Reduced-motion as a theme-level contract | c m | cream's `@media (prefers-reduced-motion)` + a JS `reduced` branch through every init (`:723`) and a `<noscript>` block (`:333`); mono has the JS branch (`:612`) and one CSS rule (`:219`) but **no `<noscript>`** | Require each structural theme to ship both a reduced-motion path and a no-JS path; mono's is missing today. |
| 39 | Draft toggle reachable inside a theme's own chrome | c m v x | §4.4 wants a toggle that persists across pages; both prototypes fill the corners with fixed chrome | The preview-only draft control needs the same "where does it mount" answer as the picker — solve both with one slot. |
| 40 | Heavy-asset budget per theme | m | mono's reference runs a WebGL2 fluid sim, replaced here by a 2D canvas (`:1071`); §3.3 names three.js/GLB/video | Nothing needs it today; keep the per-theme asset directory and lazy-import path open so the mono spec can add it without an engine change. |

**Capabilities in the prompt's list that turned out not to be needed by these two prototypes:** three.js/GLB/video (mono's prototype avoids it), a contact form runtime (mailto only). Both stay in the checklist as §6.3/§6.4/§3.3 asks, at low priority.

---

## 4. Conflicts with the current engine

1. **`.menu-item` / `.tc-nav-item` / `.tc-nav-trigger` are hard-coded contracts.** `js/nav-config.js:101-105` emits `li.tc-nav-item > button.menu-item.tc-nav-trigger`; `js/theme-cycler.js:558,601,609,686,737` queries all three, and `pillFor()` (`:609`) looks for `.moving-menu, .static-menu, .static-menu-mobile` by name. A structural theme has none of those class names. The picker must accept a mount element and an anchor element as inputs, not find them by canonical class.
2. **The `.tc-toggle` FAB is vapourware.** Zero rules in `css/theme-cycler.css`; no creation in `js/theme-cycler.js`; `:558-559` returns early with no nav items. Sixteen skin sheets style it (`css/themes/*.css`). Today privacy, 404 and lexchat load the cycler and get nothing. §4.7's "the engine injects the floating fallback" is **new work**, and the skin sheets' existing `.tc-toggle` rules are a free parity target once it exists.
3. **`theme-base.css` assumes the canonical DOM everywhere.** Every rule is `[data-style] <canonical selector>`: `.blog-post-content pre`, `.footer-container.blog-footer`, `#typing-text .tw`, `[data-aos]`, `.card/.blog-card/.fc-card-image/.blog-image`, `.nav-container`, `.contact-image-wrapper` (`css/themes/theme-base.css:14-115`). Under a structural theme most of these match nothing — harmless — but the file's *purpose* (shared plumbing for skins) does not extend to structural themes, and the mobile block is keyed to `max-width:1100px`, which neither prototype uses. Split it: skin plumbing vs genuinely universal rules.
4. **`[data-style]` scoping does not express "structural".** The registry entry today is `{id, label, polarity, colors, tokens, fonts, css, flags, random, typing}` (`js/theme-bootstrap.js`). There is no `kind`, no owned-page-type list, no per-theme script entry, no modes. §10's two kinds have to become a real discriminated field with different required properties.
5. **The palette toy's five roles vs mono's eleven variables.** `js/theme-cycler.js` randomises five roles and derives `--jobs-menu-*`, `--neutral-gray`, `--code-bg`, `--code-fg` on top. Mono's modes set `--ink/--ink50/--ink30/--fill3/--line10/--nav-fill/--bg/--bg2/--nav-active/--nav1/--nav2/--nav3` (`mono:47-53`). Modes-as-palette-presets loses `--nav1/2/3` and `--bg2`, which are what make the staircase menu and the works band read. Recommend: separate state, and hide the palette toy (or restrict it to `--ink`/`--bg`) on structural themes that declare modes.
6. **`className = 'theme-mode-…'` vs engine class stamping.** `mono:823` writes the whole `className`. Any engine class on `<html>` dies. And `mono:1078` watches `documentElement` `class` mutations, so engine stamping fires the fluid canvas's colour re-read. Contract: the engine stamps *attributes* (`data-*`), themes stamp their own single attribute, nobody assigns `className`.
7. **The `dawson:palette` event.** `js/theme-cycler.js:191` dispatches it and the architecture comment names it the contract for palette-coupled widgets (Plotly charts in blog posts). Mono's mode switch dispatches nothing. If a blog post renders under a mono path with mono's tokens, its charts will never repaint on a mode change. Either mode changes dispatch `dawson:palette` too, or the fallback page types are excluded from mode switching.
8. **`flags.still` / `flags.tilt`.** `theme-base.css:70-99` implements both by targeting canonical selectors (`[data-aos]`, `#cursor-container`, `.card`, `.blog-card`, `.fc-card-image`, `.blog-image`, `.js-tilt-glare`) and `js/script.js:257,397` + `js/featured-carousel.js:190` gate on `window.__styleAllowsTilt()`. A structural theme runs none of that code, so both flags are meaningless for it — but they must still work for the sixteen skins, and mono hand-rolls its own tilt (`mono:1010-1016`) that no flag can reach. Make the flags a property of the *default layout's* behaviour module, not of the theme registry.
9. **Typing-engine hooks.** `window.__styleTypingMode()` / `__styleTypingDeleteMode()` / `__restartTypingSequence` (`js/theme-bootstrap.js:654,664`, `js/typing-engine.js:99,109,637`) are registry-driven and target `#typing-text` / `#blog-typing-text`. Neither prototype has a masthead. These belong to the default layout; the registry should stop carrying them for structural entries.
10. **"Every page shares `styles.css`."** `CLAUDE.md` and the new-page checklist mandate `styles.css` → `mobile-styles.css` → page CSS → `theme-cycler.css`. Under mono, `styles.css` would render at a 1vw root. Under cream, `body{cursor:none}` and hidden scrollbars fight it. A structural theme must be able to ship **zero** of the site-wide sheets, while the picker's own CSS still has to work in that vacuum — which means `theme-cycler.css` cannot depend on `styles.css` tokens.
11. **Session-only persistence and the URL model.** Today: sessionStorage + `?style=`, reload returns to default (`js/theme-bootstrap.js:687-694`). §4.5 moves to theme-in-path. Mono adds a *second* persisted axis (its mode). Two persistence models on one page need one owner, and mono's key (`'theme-mode'`) is unnamespaced.
12. **Breakpoint constant.** `CLAUDE.md` says 1100px is synced across `css/*.css`, `js/script.js` and `js/featured-carousel.js`. Cream is 1024, mono 991. The constant is per-layout, not per-site.
13. **Google Fonts as `<link>` (§4.12) vs per-theme splitting (§3.3).** The registry currently appends font links at runtime. Under theme-in-path, each themed page can emit its own font links statically — good — but the *fallback* page types under a structural theme need that theme's fonts too, which is a token-plus-fonts payload, not tokens alone. §10 defines tokens as "colour roles, fonts and radii", so this is consistent; just make sure the fallback path actually emits the font links.
14. **`docs/theme-explorations.html` is stale in at least one respect** (the `.tc-toggle` FAB). §9 lists "update, freeze, or replace" as undecided. Whatever is chosen, the FAB claim should not be carried forward as fact.

---

## 5. Open questions and risks

### 5.1 Only the site owner can answer

1. **May a structural theme hide the global picker inside its menu**, with no always-visible control? Cream's design has no room for a visible button; mono's bottom-right is occupied. (§4.7 says "reachable", not "visible".)
2. **Should theme-internal modes persist, and where?** Mono uses sessionStorage today. Options: not at all; per session; in the URL (`/mono/?mode=rust`, which makes them shareable and prerenderable); or as part of the theme path (`/mono/rust/`, which multiplies the prerendered page count by six).
3. **Should the palette toy be available on structural themes at all?** On mono it can only touch 2 of 11 variables meaningfully; on cream it would break the single-ink concept the whole design rests on.
4. **Cream's job bullets run ~112 words per employer against an `m` budget of ~60.** Rewrite them shorter for cream, or let cream request `l` and be a long page?
5. **Add GitHub to the socials list?** Cream shows it (`:683`); `js/nav-config.js` does not have it.
6. **Which image goes where**, now that images get used at three sizes in mono and in a 4-up hero row in cream. Also: `location.png` is 943 KB, over the ≤500 KB convention, and is used by both.
7. **Cream's Easter egg (the fly, the swat counter, the "don't swat the fly" line)** — keep it as approved theme prose and behaviour, or cut it?
8. **Mono has no `<noscript>` fallback** and everything animated starts `visibility:hidden`. Acceptable, or does every structural theme need a no-JS path (cream has one)?
9. **Are the six mono mode names final** (Light, Concrete, Rust, Verdigris, Blood, Dark)? They are visitor-facing aria-labels, so §3.1 makes them prose.
10. **Does the owner want cream and mono to own the blog listing/post pages**, or is the token-only fallback acceptable for both? (Cream's row grammar is already 80% of a listing.)

### 5.2 The spec author can decide alone

- Whether multiple GSAP versions coexist via npm alias, or everything moves to one version (§7 already wants 3.9.1 gone).
- How a slot requests a size in a component (§9), and the YAML shape for ordered fragment arrays (capability 15).
- Media-query dual structure vs component branching for mobile (§9) — with the added requirement that it be resize-stable.
- Where the draft toggle mounts and how it shares a slot with the picker.
- Namespacing scheme for theme storage keys and injected SVG filter ids.
- Whether `theme-base.css` is split, renamed, or absorbed.

### 5.3 Risks

- **`html{font-size:1vw}` leaking into fallback pages** is the highest-consequence single failure mode: a blog post under `/mono/blog/…` would render at ~19px on desktop and ~4px on a phone. Whatever "tokens only" means, it must exclude root sizing. Write a build assertion.
- **The picker inside a `backdrop-filter` ancestor** silently collapses to the trigger's width. The current code has a long comment about exactly this (`js/theme-cycler.js:560-566`); cream's scrim (`:104`) and the list-portfolio top bar (`:32`) both have `backdrop-filter`. Body-parenting must survive the rewrite as a contract, not as a comment.
- **Cream's pinned focus section** (`:824-873`) measures geometry against ScrollSmoother's transformed content and re-measures on `onRefreshInit`. It is the most fragile code in either prototype and the most likely thing to be quietly broken by a refactor. Treat it as a parity target of its own.
- **Mono's `.sw__motto`-equivalent overflow**: cream's motto rows very likely overflow at 390px and are hidden by `overflow-x:clip` (§2.1e). Silent clipping is worse than a visible break; the theme spec should catch it in the Playwright 390px pass.
- **Never-cleared intervals**: mono's clock (`setInterval` 1s) and logo cycle (5s) run forever (`:938-947`). Under client-side navigation (if Astro view transitions are ever enabled) these leak.
- **`SplitText`, `ScrollSmoother` and `MorphSVG` are free plugins as of GSAP 3.13** — the prototypes' own claim, corroborated by all four `dist/` URLs returning 200 from the public npm registry. Confirm the licensing text at install time rather than trusting the prototype header comment.
- **`docs/*-prototype.html` are untracked in git** (§2 of the intent notes this, and `git status` still shows them as `??`). If they are lost, specs 2 and 3 lose their starting point. Ask the owner to commit them.
