# Spec 1 correctness review (reviewer 04, fable-1)

Spec: `docs/intents/2026-09-05-theme-engine-rewrite/spec-1-migration-engine-parity.md` @ `main` 0f196d0.
Axis: correctness (false claims about the codebase, false third-party claims, internal contradictions, behavior gaps, intent compliance).
Line numbers below are the spec's unless prefixed with a repo path. Evidence was read directly from the repo at 0f196d0; third-party facts via `npm view`, GitHub raw/API and the Astro/Playwright docs (section 3).

## 1. Findings (ordered by severity)

### C1. blocker, high. §9 normaliser rule 6 (spec 669-673) can never make the DOM dump match on any non-default theme
- What the spec says: old link forms map to bare routes (`../index.html#x` → `/#x`, `blog/`/`./`/`../blog/` → `/blog/`, `…post.html?id=p` → `/blog/p/`); only `/?style=x` gets `href(<page>, x)`.
- Evidence: the new side under theme `x` emits `href(route, x)` = `/x/blog/`, `/x/#about`, `/x/blog/p/` (§6.1 rule 5, D11). Old side: `js/nav-config.js:9-19` (`../index.html#about`, `./`, `blog/`, `resources/Resume.pdf`), logo `blog/index.html:52` / `blog/post.html:78` (`../index.html`, bare, no hash: not in rule 6 at all), `index.html:57` / `privacy/index.html:25` (`https://www.dawsonamf.com/`: not in rule 6), vcard `js/nav-config.js:54` (`https://www.dawsonamf.com/resources/contact.vcf`: not in rule 6), rail/cards `js/script.js:389`, `blog/blog-listing.js:130` (`post.html?id=p`), CTAs `js/blog-data.js:43` (`../blog/post.html?id=…`).
- Consequence: after normalisation the old dump holds `/blog/p/`, `/#about`, `../index.html`, and the new dump holds `/x/blog/p/`, `/x/#about`, `/x/` on every one of the 15 skin themes; check 1 fails on every page; T4-T8 cannot go green as written.
- Correct statement: rule 6 maps every old internal form to its canonical route and then applies `href(route, <theme under test>)` on the old side; add `index.html`, `../index.html`, `https://www.dawsonamf.com/` → `/` and `https://www.dawsonamf.com/resources/…` → `/resources/…`. (Also decide whether the logo and vcard keep absolute URLs, which under a theme leave the theme, see C14.)

### C2. major, high. D4 (spec 51): "there is no pre-paint override today" is false; D4+D11 introduce a palette flash on every navigation
- Evidence: `js/theme-bootstrap.js:724-738` (blocking `<head>` script) reads `sessionStorage['dawson-theme-cycler']`, and if it holds five colours writes them into the ramp before first paint; only a reload clears it (`:728`). The cycler then re-applies the same colours at DOMContentLoaded (`js/theme-cycler.js:748-754`, `applyColors` `:178-191`).
- Consequence: with build-time ramps (D4) and toy state that now survives navigation and reload (D11, Q12), every page load while a toy palette is active paints the theme's base colours and repaints at DOMContentLoaded: a visible flash that does not exist today for in-session navigation, is not in §15, and is invisible to the harness (no toy state in the matrix).
- Correct statement: "Today the bootstrap restores the toy palette pre-paint (`theme-bootstrap.js:724-738`). `ThemeRuntime` keeps a pre-paint restore (read `dawson-theme-cycler`, rewrite the five roles and ramp) so persistence (D11) does not add a flash" or list the flash in §15.

### C3. major, high. §4.1 `blog.intro` as one `l` field (spec 239) drops the three ids the listing's CSS, skins and intro animation depend on
- Evidence: `blog/index.html:64-66` gives the paragraphs `id="blog-sub-text"`, `blog-sub-text-2`, `blog-sub-text-3`; `blog/blog-listing.js:8-10` runs the intro wave on them by id; `blog/blog-listing-styles.css:50,60,262` and 15 active skin sheets select `[id^="blog-sub-text"]` (e.g. `css/themes/marquee.css:1220,1737`, `grid.css:667`, `studio.css:559`). Rendering one Markdown field with `paragraphs: 'p'` (§4.2) yields bare `<p>` elements.
- Consequence: no intro reveal, skins lose their intro styling, DOM diff fails on the listing under all 16 themes.
- Correct statement: §7 must say the listing renders the intro as three paragraphs carrying today's ids (three prose fields, or split-and-stamp in `BlogListing.astro`).

### C4. major, high. §9 determinism (spec 632-636): the masthead pick is not the first `Math.random` draw on home
- Evidence: `index.html:31` loads jQuery 3.6.0 with `defer` ahead of `typing-engine.js` (`:38`); jQuery draws once at load (`jquery/src/core.js:207` at tag 3.6.0: `expando: "jQuery" + ( version + Math.random() )`). The listing loads no jQuery (`blog/index.html:29-37`). The pinned bundles of gsap 3.9.1, AOS 2.3.1, vanilla-tilt 1.7.0, jQuery UI 1.12.1 and highlight.js 11.9.0 have no load-time draws (grep; gsap's three are inside `shuffle`/`random` helpers). Site code: only `typing-engine.js:165` and the cycler's randomize path (`theme-cycler.js:59,106,114,255,258`).
- Consequence: `seedFor(3, 9)` / `seedFor(0, 9)` pin jQuery's expando on home; the masthead lands on an unintended sequence, so "index 3, shortest settle" and "index 0, delete path" are not what is captured. Parity still holds (same draw order both sides), the intent of the pins does not.
- Correct statement: "the masthead pick is draw 2 on home (after jQuery's expando) and draw 1 on the listing; `seedFor(index, n, draw)` targets the nth draw, or the init script counts draws."

### C5. major, high. D16 (spec 63) does not reproduce the contact paragraph's mailto link
- Evidence: `index.html:273` `<a href="mailto:dawsonamf@icloud.com" target="_blank" rel="noopener noreferrer" class="text-link">`; D16 gives only http(s) links `target`/`rel`, "every other link `class="text-link"`" (mirroring `blog/blog-post.js:11-14`).
- Consequence: attribute diff on home under all 16 themes (check 1 compares attributes).
- Correct statement: the renderer needs a `mailto:` branch (or "http(s) and mailto") emitting `target="_blank" rel="noopener noreferrer"` for that link, or the normaliser allow-lists the difference.

### C6. major, high. D30 / §5.3 (spec 77, 393): "any `.tc-nav-item` element is a trigger" is not the cycler's contract
- Evidence: click is bound only on a `.tc-nav-trigger` inside the item (`js/theme-cycler.js:685-688`); `aria-expanded` is written on that button (`:601-602`); a bare `.tc-nav-item` only gets hover-open, gated on `(hover: hover) and (pointer: fine)` (`:594,697-699`). Today's markup: `js/nav-config.js:105` (`li.tc-nav-item > button.tc-nav-trigger[aria-controls="tc-dock"]`).
- Consequence: a `PickerFab` built as a bare `.tc-nav-item.tc-fab` never opens on touch devices (mobile utility pages).
- Correct statement: "trigger = `.tc-nav-item` containing a `button.tc-nav-trigger` (aria-haspopup/aria-controls as today)"; `ThemePicker.astro` and `PickerFab.astro` emit both.

### C7. major, high. Q1's resolution and D8 are visible changes missing from §15 (spec 841-861)
- Evidence: listing/home rail show `helm` "Helm: A Minimalist Workspace Switcher for your IDE" / April 2026 and `metr-doubling` January 2026 (`js/blog-data.js:149-151,176-178`); post files say "Helm: A Workspace Switcher for VS Code and Cursor" / March 2026 and February 2026 (`blog/posts/helm.md:2-3`, `metr-doubling.md:2-3`). Post pages take their tag pills from `BLOG_POSTS` (`blog/blog-post.js:160-163`), so a post absent from it (`gemma4-heretic-ara`, commented at `blog-data.js:122-129`) has no pills today.
- Consequence: with the Q1 default the listing cards and home rail change (both in the matrix); with the alternative the `metr-doubling` h1/date pill changes (in the matrix); under D8 the gemma4 page gains an "AI & ML" pill, not only JSON-LD as §15 item 4 says. The harness fails or the implementer allow-lists silently.
- Correct statement: add to §15: "post metadata unified per Q1 (listing/rail cards for helm and metr-doubling change under the default); gemma4-heretic-ara gains tag pills".

### C8. major, medium. The picker on 404 and lexchat has no icon font (spec 498-501, T6 775, Q4 805)
- Evidence: `404.html:13-16` and `lexchat/index.html:9-11` load neither Font Awesome nor Boxicons (privacy does, `privacy/index.html:12-13`). The dock uses FA glyphs (`js/theme-cycler.js:464` `fa-solid fa-lock`, `:544` chevron/caret markup), and the FAB is "the palette icon" (today's mobile trigger is `fa-solid fa-palette`, `js/nav-config.js:29`). Today neither page has a dock at all (`injectDom` returns before appending, `theme-cycler.js:558-559`).
- Consequence: following §6.3/T6 literally, the FAB and the dock's lock/caret icons render as empty boxes on those two pages; fixing it adds a `<head>` link the normaliser compares as-is and §15 does not list.
- Correct statement: "404 and lexchat gain `/vendor/fontawesome/css/all.min.css` (listed under §15 item 3)", or the FAB/dock use inline SVG.

### T1. major, high. D7 / §3.1 / T2 (spec 54, 90, 771): "one YAML document loaded as one content-collection entry via `file()` + `parser`" needs an array-of-one parser
- Evidence: `packages/astro/src/content/loaders/file.ts` at tag `astro@7.3.1`: a parser returning a non-array object is treated as an id→data map, so `parser: (t) => ({ id: 'prose', ...yaml.load(t) })` yields one entry per top-level key (`site`, `nav`, `jobs`, …), not one entry; only `parser: (t) => [{ id: 'prose', ...yaml.load(t) }]` (or `({ prose: yaml.load(t) })`) gives a single entry.
- Consequence: with the per-key form, the single zod tree does not apply and the D7 guarantee (one `superRefine` listing every draft at once; §4.1 rule 6, D10) is lost; the schema fails on the first section instead.
- Correct statement: "the `file()` parser returns `[{ id: 'prose', ...yaml.load(text) }]` (array of one); a plain object is split into one entry per key".
- Also confirmed there: the loader logs and swallows a YAML syntax error (`logger.error` + `return`, no throw), so §4.1 rule 7's own parse-and-throw in `astro:config:setup` is required, as the spec says.

### C9. minor, high. §8 (spec 585): "`nav-behavior.js` and `cursor-follow.js` are `defer` everywhere"
- Evidence: privacy, 404 and lexchat load only the bootstrap and the cycler (`privacy/index.html:18,128`, `404.html:16,69`, `lexchat/index.html:11,17`).
- Correct: "defer on home, listing and post; absent on the utility pages" (affects the §9 check-5 allow-list).

### C10. minor, high. D12 / T8 (spec 59, 777): "`.tc-toggle` rules survive in 16 skin sheets"
- Evidence: `grep -c tc-toggle css/themes/*.css`: 12 active sheets (bauhaus, broadsheet, banknote, blueprint, chinoiserie, doodle, brutalist, gallery, neo-pop, grid, miami-deco, wheatpaste) + 4 inactive (space, vapor, wanted, constructivist); field-notes, marquee, studio have none; `theme-base.css:81`.
- Correct: "12 active and 4 inactive sheets plus theme-base".

### C11. minor, high. §6.2 (spec 485): "five OG/Twitter tags"
- Evidence: `index.html:11-16`: og:type, og:title, og:description, og:url, og:image, twitter:card = six.

### C12. minor, high. §4.1 (spec 183): `titleSuffix` "on every page"
- Evidence: `index.html:6` `<title>Dawson Metzger-Fleetwood</title>` and `lexchat/index.html:6` `<title>LexChat</title>` carry no suffix; blog, post, privacy, 404 do. The dump compares `<head>` verbatim.
- Correct: "suffix on blog, post, privacy, 404; home and lexchat titles are bare".

### C13. minor, high. §4.1 (spec 218): `about-objects` shown with six bullets
- Evidence: `index.html:163-176` has seven `<li>`. "Verbatim" migration carries seven.

### C14. minor, high. §4.1 (spec 198) vcard `href: /resources/contact.vcf`; today it is absolute
- Evidence: `js/nav-config.js:54` `https://www.dawsonamf.com/resources/contact.vcf`; the home/privacy logo is `https://www.dawsonamf.com/` (`index.html:57`, `privacy/index.html:25`). `href()` rule 1 passes absolute URLs through, so under a theme those two links leave the theme; the spec does not say which is intended (see C1 for the normaliser side).

### C15. minor, high. §9 settle step 2 (spec 648): "its 14 links"
- Evidence: 18 distinct `fonts.googleapis.com` URLs in `js/theme-bootstrap.js` (`grep -o … | sort -u`), deduped per href by `loadAllFonts` (`theme-cycler.js:370-386`); on a skin page its own URLs are already present, so fewer are appended.
- Correct: keep "stable for 500 ms", drop the count.

### C16. minor, high. D11 (spec 58) cites `theme-bootstrap.js:675-678` for the reload wipe
- Evidence: `:675-678` detect the reload; the wipes are `:687` (style key) and `:728` (toy key).

### C17. minor, high. §3.1 tree (spec 106) omits `harness/scripts.ts`, which §9 check 5 (spec 612) requires.

### C18. minor, high. §9 state "sticky nav after scroll 400→200" (spec 618-619) never yields `menu-sticky`
- Evidence: `js/nav-config.js:150,156` add the class only while scrolling up with `scrollTop > 300`; at 200 it is removed. Use e.g. 800→500.

### C19. minor, medium. D27 / §5.4 (spec 74, 437-440): `apply.ts` does not set `window.__ACTIVE_STYLE`
- Evidence: the cycler reads it for the current-style marker and the `switchStyle` no-op guard (`js/theme-cycler.js:273`); `ThemeRuntime` on the 404 emits `'default'`. `applyTheme` must set it before the cycler boots.

### C20. minor, high. T3 done-when (spec 772): "inline style byte-equal to today's post-load `<html>`"
- Evidence: post-load, the cycler rewrites the ramp and appends derived neutrals (`js/theme-cycler.js:178-188`, called at `:752`); a build-time attribute can only equal the bootstrap's pre-cycler output. Correct: "captured before `theme-cycler.js` boots" (or with the cycler's additions stripped).

### C21. minor, high. Query handling in the shims (spec 434, 509)
- `/blog/post.html?id=p&style=x` → `/blog/p/` drops `style`; the `?style=` shim rebuilds `'/' + q + location.pathname + location.hash` and drops every other query parameter. Correct: forward `style` (→ `/x/blog/p/`) and preserve the rest of the query string.

### C22. minor, high. Locked-decision departures that do not say they depart (intent compliance)
- D5 vs intent §4.12 (mermaid, Plotly, js-yaml stay on CDN; libraries served verbatim rather than Vite-split); D18 vs intent §4.10 (`CNAME`/`.nojekyll` kept out of `public/`); §9 vs intent §4.9 ("carousel scroll" became "dot 3 clicked": the wheel guard, `featured-carousel.js` `setupVerticalWheelGuard`, is untested). Each gives a reason; none states that it overrides the intent.

### C23. minor, high. D22 / Q8 (spec 69, 809): `docs/planned-posts/` holds three `.md` drafts plus `ai-job-market-listing.patch` (four files).

### C24. minor, medium. Q2 default (spec 803): "autoencoders … both in the sitemap (as today)"
- Evidence: `sitemap.xml` has no `autoencoders` entries; they would be new.

### T2. minor, high. D2 (spec 49): "`true` is a third, HTML-aware mode"
- Evidence: `packages/astro/src/core/config/schemas/base.ts:120` `compressHTML: z.union([z.boolean(), z.literal('jsx')])`, default `'jsx'` (`schemas/defaults.ts`); config reference: `'jsx'` strips whitespace and line breaks around elements (JSX rules), `true` removes whitespace/line breaks losslessly, `false` preserves everything.
- Correct: "`true` is lossless whitespace removal; `false` is still the parity choice". Default `'jsx'` and its whitespace stripping hold.

### T3. minor, high. D2 / §3.2 (spec 49, 132): `prerenderConflictBehavior` has three values
- Evidence: `base.ts:496` `z.enum(['error', 'warn', 'ignore'])`, default `'warn'` (`schemas/defaults.ts`). Name, default and `'error'` semantics hold; `'ignore'` exists.

### T4. minor, high. §10 step 5 (spec 709-710): "whether `source` is required is undocumented"
- Evidence: REST docs for `PUT /repos/{owner}/{repo}/pages` list `build_type` (`legacy` | `workflow`), `https_enforced` and `source`, with `source` optional. Correct: "`-f build_type=workflow` alone is a valid body; `source` is optional".

### T5. minor, medium. §10 (spec 697-699): "no doc sentence ties `actions: write` to `workflow_dispatch`"
- Evidence: GitHub's "Permissions required for GitHub Apps" maps `POST /repos/{owner}/{repo}/actions/workflows/{workflow_id}/dispatches` to Actions: write; "Events that trigger workflows" states `GITHUB_TOKEN`-triggered events never create runs except `workflow_dispatch` and `repository_dispatch`. Correct: the grant is documented; T7's empirical check is a confirmation, not the only evidence.

### T6. minor, high. §7 (spec 534): "the exact 36-language set the cdnjs bundle ships"
- Evidence: `highlight.js@11.9.0/lib/common.js` has 36 `registerLanguage` calls = 34 languages + 2 sub-grammars (`php-template`, `python-repl`); the cdnjs `highlight.min.js` 11.9.0 ships the same set (haskell/erlang/elixir/ocaml/nginx/dockerfile/powershell absent in both). The parity conclusion (`lib/common` = cdnjs set) holds; the count is 34 languages.


## 2. Verified correct (load-bearing claims that held)

- `js/theme-bootstrap.js`: `ORDER` at `:637` (16 ids in the stated order); helper bodies `:646-668`; `STEPS` = 19 alphas (`:672`) → 5 + 95 = 100 properties, `hsla()` with `toFixed(0)` (`:764-774`); attributes `:703-706`; link appends `:715-721` (fonts → `theme-base.css` → skin, `data-style-asset="1"`, appended to the end of `<head>`); the default entry stamps nothing and gets only the ramp; `?style=` is honoured on any page that loads the bootstrap (`:688-692`); seven globals (`__THEME_CYCLER_ENABLED`, `__THEME_REGISTRY`, `__THEME_ORDER`, `__styleAllowsTilt`, `__styleTypingMode`, `__styleTypingDeleteMode`, `__ACTIVE_STYLE`); registry counts: tokens 15/16 (not default), fonts 14/16 (not default, grid), random 3 (studio, brutalist, marquee), flags 14/16 (not default, miami-deco), typing 8, typingDelete marquee only; the `.tc-toggle` FAB exists only as prose in `docs/theme-explorations.html:63` and dead CSS.
- `js/theme-cycler.js`: `:276` navigates to `/?style=`; `:462` `Lock/Unlock <Role>`; `:509` stale "all 20 skins"; `:558-559` early return without `.tc-nav-item`; `MEASURE 940` / `EDGE 10` (`:596-597`), 300 ms (`:706,723`), 440 ms (`:676`), `void dock.offsetWidth` (`:647`), hover gate (`:594`), Space-to-shuffle (`:768`), `dawson:palette` without `detail` (`:191`), `loadAllFonts` after idle (`:762`) and it runs on utility pages too (boot continues after `injectDom` returns), keys `dawson-theme-cycler`/`dawson-style` (`:124-125`), every picker string in §4.1 present.
- `js/featured-carousel.js:413-414` sets `--ticker-run`/`--ticker-dur`; `402/46` (`:386`), `✷` (`:376`), dedupe (`:395-396`), doubled run; dot `aria-label="Go to slide N"` (`:266`); 8 cards/dots follow from 8 `FEATURED_PROJECTS`.
- `css/themes/marquee.css:572` `var(--ticker-run, "<unit ×12>")`; `doodle.css:535`; `theme-base.css:81`; `.privacy-*`/`.nf-*` styled by grid, banknote, gallery, neo-pop (plus inactive constructivist); no other word-bearing `content:` literals.
- `blog/blog-post.js`: overrides `:4-30`, link branches `:8-15`, frontmatter `:32-48`, JSON-LD `:56-88` with `new Date(date + ' 1')`, copy buttons `.has-copy-btn` / `button.code-copy-btn` / `Copy code` (`:90-112`), sequential script chain `:114-125`, styles `forEach` `:127-135`, `Math.max(1, Math.round(words/200))` (`:176-177`), ` | Dawson Metzger-Fleetwood` suffix (`:153`), unconditional `mermaid.run` (`:172`), tilt gate (`:182`).
- `blog/blog-listing.js`: 7 sequences `:37-88`; card markup `:127-139` with `data-aos-delay="${i * 50}"`; sorted tag set, no "All" pill; `AOS.init({ offset: 50 })` (`:178`).
- `js/script.js:129-192`: 9 active sequences + 1 commented; index 3 is a single `type` step; sequences 5-8 are two duplicate pairs ("builder." on 4 of 9). `js/nav-config.js:21` `SCROLL_THRESHOLD: 300`; Calendly URL from `--bg/--text/--primary` with fallbacks (`:38-47`); nav labels About/Experience/Projects/Blog/Contact/Resume/Theme and mobile Email/Blog/Resume/Theme; socials order and icons as §4.1; aria labels "Main navigation"/"Quick links"/"Social links".
- `index.html`: head order `:1-27` as §6.2 (tag count aside, C11); `:79` subtitle joined by `&nbsp;|&nbsp;`; `:275` the only hand-written `calendly-link`; `sec-num` 01-05 on home, 01/02 on the listing; about body has 3×`<br><br>` (4 paragraphs), skills body 3 has one; 7 of 8 project descriptions use `<br><br>`, `deep-rl` none; strings "About Me", "Skills", "Map", "See all posts", hero alt, job dates with en dashes; script attributes per §8 (home: gsap/jquery/jquery-ui/aos/blog-data/featured-carousel/typing-engine/nav-config/script/cursor-follow `defer`, vanilla-tilt/anim-utils sync, Calendly `async`; listing: aos/vanilla-tilt/blog-data/featured-carousel/typing-engine/anim-utils sync, nav-config/cursor-follow `defer`, `blog-listing.js` sync at end of body, cycler `defer` after it; post: hljs/marked/mermaid/vanilla-tilt/blog-data sync, `github-dark.min.css` after the bootstrap so runtime skin links land after it, `blog-post.js` sync at end, cycler after).
- `blog/post.html:87-93` DOM shape; "Loading…" title; description "A blog post by Dawson Metzger-Fleetwood."; mermaid init reads `--secondary/--text/--neutral-gray` with the stated fallbacks; no canonical/OG/Calendly/AOS. `blog/index.html`: canonical, `blog-listing-styles.css` before `theme-cycler.css`, 3 intro paragraphs.
- `privacy/index.html`: "Updated January 10, 2026", ~737 words of body text. `404.html`: "404", "This page doesn't exist, or it moved.", "Back to the home page", `noindex`, inline `.nf-*` style, root-absolute paths. `lexchat/index.html`: title "LexChat", iframe page, only the bootstrap and cycler scripts.
- `js/blog-data.js`: 8 projects; `silicon-fly` fields exactly as §4.1 (tech, image, "Read the post" → `fly-on-my-laptop`, "View on GitHub"); 10 active posts + `gemma4-heretic-ara` commented at `:122-129`; `fly-on-my-laptop` and `autoencoders-1` fields as §4.1; Q1 listing values.
- Posts: 11 files; six with `../../resources/` (arena-freshness, autoencoders-1/2, embedded-swift-agent, college-projects, helm); `post.html?id=` only in autoencoders-1 (`:200`) ↔ 2 (`:6`); `scripts`/`styles` on three (gemma4, metr-doubling, underviewed-art), Plotly 2.27.0 on two, js-yaml 4.2.0 on one; toolbelt = 2 mermaid + bash + json; embedded-swift-agent = 9 swift fences + 1 image; metr-doubling has no fences; the post-file values for Q1.
- `sitemap.xml`: `color-randomizer` entry (no such post); three `lastmod` values disagree with the post dates (helm, embedded-swift-agent, metr-doubling); gemma4 present.
- Subsites: `12years/` = `index.html`, `then.jpeg`, `now.jpeg`, gsap 3.12.5 + ScrollTrigger from cdnjs, page-relative images; `embedded-swift-agent/` = 4 files, `agent.js:11-18` bare `+esm` import; linked from a project CTA (`blog-data.js:29`), a post body (`embedded-swift-agent.md:201`) and the sitemap.
- `.github/workflows/refresh-chart-data.yml` commits and pushes with the default token (`permissions: contents: write`); `docs/prebake-cohort-data.py:27` `OUT_DIR`; `cohorts-chart.js:642-682` and `job-market-chart.js:12` page-relative `posts/assets/…` URLs.
- Machine: Python 3.9.6 with `--bind` and `--directory`; `~/Library/Caches/ms-playwright/` holds `chromium-1228` and `chromium_headless_shell-1228`; repo root has `CNAME`, `.nojekyll`, `robots.txt` (with the `Sitemap:` line).
- Arithmetic and cross-references: 16 × 15 = 240 pages; 8-page matrix consistent between §9 and T1; §5.4 shim/§6.4/§9 URL pairs consistent (`?style=default` no-op; 404 never shimmed); §17 items 1, 4, 5, 7 hold.
- Third-party (npm registry, GitHub raw/API/docs, Astro 7.3.1 source and docs, Playwright 1.61.1 types): astro@7.3.1 exists, `engines.node >=22.12.0` with no upper bound; install docs reject odd Node lines; `compressHTML` default `'jsx'`; `prerenderConflictBehavior` default `'warn'`; `build.inlineStylesheets: 'never'`, `trailingSlash: 'always'`, `build.format: 'directory'`, `output: 'static'`, `site`, `markdown.syntaxHighlight: false` all valid; static `redirects` emit a `<meta http-equiv="refresh">` stub at `dist/12years/index.html` with no status code; `file()` accepts `parser` and swallows YAML syntax errors (see T1); `glob()` has `pattern`, `base`, `generateId`, `retainBody` (default `true`, so `entry.body` is the raw Markdown); `astro:build:done` receives exactly `{ pages, dir, assets, logger }` (`routes` moved to `astro:routes:resolved`) and a thrown hook error is rethrown by `integrations/hooks.ts`, so `astro build` exits non-zero (D10's `process.exit(1)` fallback is unneeded); `astro:config:setup` exists; rest params with `theme: undefined` match `/` (documented, and `generator.ts` returns `'/'`); Astro 7's Markdown pipeline is `@astrojs/markdown-satteri@0.4.0` and `@astrojs/markdown-remark` is not a dependency; the compiler dependency is `@astrojs/compiler-rs ^0.4.0` (Rust); `is:inline` and `set:html` on `<Fragment>` documented; `import.meta.env` unavailable in `astro.config.mjs`, `process.env` is; content validation prints every zod issue (`InvalidContentEntryDataError`) and fails the build; `@astrojs/sitemap@3.7.4` is latest, `filter(page: string)`, `serialize(item)`, excludes `404`/`500` by default (the spec's 404 clause is redundant, harmless), warns and skips without `site`; astro depends on `js-yaml ^4.3.0`, `js-yaml@4.3.0` exists, latest 5.4.1. Playwright: `@playwright/test@1.61.1` exists, latest 1.63.0; 1.61.1 pins Chromium/headless-shell 1228, 1.63.0 pins 1243; `webServer` array and `gracefulShutdown` (since 1.50); `snapshotPathTemplate` with `{platform}`; `toHaveScreenshot` options as listed; `emulateMedia({ reducedMotion })`, `page.clock`, `addInitScript`, `route.abort`; `--grep`; html reporter `open: 'never'`. GitHub: latest releases checkout v7.0.1, setup-node v7.0.0, upload-pages-artifact v5.0.0, deploy-pages v5.0.1; `include-hidden-files` default false with tar `--exclude=.[^/]*`; `setup-node` `node-version-file` accepts `.nvmrc`, `cache: npm`; a custom Actions workflow ignores `CNAME`; `GITHUB_TOKEN` pushes never trigger `push` runs, `workflow_dispatch` is the exception; `workflow_dispatch` requires the file on the default branch and runs the version at `--ref`; `PUT /repos/{owner}/{repo}/pages` takes `build_type` legacy|workflow and `https_enforced`, `GET` returns `build_type`, `cname`, `https_enforced`. Node: v25 EOL 2026-06-01, v24 Active LTS until 2026-10-20 (EOL 2028-04-30); Node 24 strips erasable TS syntax without a flag. npm: all 12 pinned versions exist (incl. gsap 3.15.0); mermaid@11.15.0 unpacked 76,342,428 B; boxicons@2.0.9 declares six runtime deps incl. react ^16 and react-router-dom; the vendor-map files exist in the tarballs (`aos/dist/aos.{js,css}`, `jquery-ui-dist/jquery-ui.min.js`, `gsap/dist/gsap.min.js`, `@fortawesome/fontawesome-free/{css/all.min.css,webfonts/*}`, `highlight.js/{styles/github-dark.min.css,lib/common.js}`).

## 3. Not verified

- `@astrojs/compiler-rs` "strict: unclosed tags error" (T0 item a): the published package ships only `dist/*.mjs`; confirming needs a build, which needs an install. Left to T0 as the spec intends.
- GitHub Pages serving `404.html` for nested paths (`/brutalist/nope/`): the behaviour is real but no docs sentence states it; the spec already defers to a live check (§10 step 7).
- sha256 identity of the npm artifacts with the CDN copies (D5, §8): not hashed here; the spec defers to T4.
- `harness`-facing counts not reproducible without running the site: the "10 elements `anim-utils.js` pins" on home (§9 settle 5); the ~395-word count of `12years/` prose (§6.5); whether every rendered prose field equals today's HTML fragment (T2 unit test).
- `embedded-swift-agent.md`'s "1 c fence" (9 swift fences and 1 image verified; the c fence was not separately counted); `lexchat/index.html`'s iframe `src` (the iframe exists; its URL was not read).
- `docs/theme-explorations.html`'s "six stale claims and eleven omissions" (D23, §17.9): not audited; only the `.tc-toggle` description (`:63`) and the absence of any link/script reference to `theme-bootstrap.js` were checked.
- `research/*.md` sections cited by the spec: consulted only where a claim needed them (§17 items 1, 4, 5, 7 re-derived from the code); not read for their own accuracy.
- Whether any current post carries a fence language outside `lib/common` (§7 says none hits `highlightAuto`): fence languages were not enumerated across all 11 posts.
