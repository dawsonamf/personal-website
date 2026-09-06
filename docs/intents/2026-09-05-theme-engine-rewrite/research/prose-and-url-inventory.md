# Prose and URL inventory (for spec 1)

> Historical research snapshot. The settled owner decisions in [Spec 1 §13](../spec-1-migration-engine-parity.md#13-settled-owner-decisions-q1-q14-2026-09-05) supersede earlier recommendations about post ownership/format, drafts, picker placement and palette support; use the current spec for implementation.

Scope: every visitor-facing string the site renders today, and every URL it serves today.
All claims cite `file:line` in this repo at the state of `main` on 2026-09-05.
Blog post bodies are excluded (they stay Markdown); their frontmatter is included.

---

## 1. Summary for the spec author

1. **The prose file needs ~150 fields**, not thousands: 8 project descriptions, 10 post excerpts, 18 job bullets, 4 long body paragraphs, ~40 labels, ~16 theme names, ~35 masthead lines. Full counts in §2.11.
2. **Five prose fields exceed the `l` "unbounded" assumption meaningfully**: `about-text` (190 words, `index.html:103`), three `skills-text` blocks (132 / 89 / 145 words, `index.html:118,122,126`), and the privacy body (738 words, `privacy/index.html:39-110`). Every `FEATURED_PROJECTS.description` is 76-145 words, i.e. all of them already exceed the `m` budget (60) and none fits `s`.
3. **`FEATURED_PROJECTS.description` and `about-text` contain raw `<br><br>` as paragraph separators** (`js/blog-data.js:6,25,39,53,65,77,89`; `index.html:105,107,109,111`), injected via `innerHTML` (`js/featured-carousel.js:87`). Markdown round-trips these to `<p>`, not `<br><br>` — that is a DOM change every skin's CSS sees. Spec must decide: preserve `<br>` semantics, or accept `<p>` and re-verify skins. This is the single biggest parity risk in the prose migration.
4. **Two `<a>` links live inside prose** (`index.html:273` mailto, `index.html:275` a `.calendly-link` with `href="#"` that JS intercepts) plus four job-title employer links (`index.html:164,177,198`). The Calendly one is a link whose behavior comes from a JS click handler keyed on the class (`js/nav-config.js:135`), so Markdown must be able to emit `class="text-link calendly-link"` — plain Markdown cannot.
5. **`index.html:79` uses `&nbsp;` as a visual separator**: `Web&nbsp;|&nbsp;iOS and visionOS&nbsp;|&nbsp;ML and RL`. Markdown will not preserve `&nbsp;` without an escape convention.
6. **Section headers are two elements, not one string**: `<span class="sec-num">01.</span>About` (`index.html:97,144,218,243,264`; `blog/index.html:76,96`). The number and the label are separate prose fields, or the number is generated. Themes reorder sections, which breaks hardcoded numbering.
7. **Theme labels are prose and live in the registry** (`js/theme-bootstrap.js`, `label:` at lines 18,24,72,120,141,163,183,268,292,316,341,371,399,498,528,563 for the 16 active ones). Three labels differ from their ids: `grid`→"Swiss Grid", `chinoiserie`→"Porcelain", `wheatpaste`→"Street Poster", `neo-pop`→"Pop Art". Four inactive entries carry labels in comments (`:215,245,430,462`).
8. **Only one theme has a visible CSS `content:` string**: marquee's ticker (`css/themes/marquee.css:572`), a single ~85-word repeated run. All other `content:` values are punctuation, counters, or `№`/`✷`/`■`/`·`/`/` glyphs — 17 declarations total, listed in §2.9.
9. **`doodle` has one real CSS prose string**: `content: 'currently here \2713'` (`css/themes/doodle.css:535`) — a visible label with an escaped check mark.
10. **10 masthead sequences on home** (`js/script.js:129-203`) and **7 on the blog listing** (`blog/blog-listing.js:38-88`), each with literal `\n` line breaks and integer `delete` counts that are character-exact against the strings. Changing a single character of a masthead line silently breaks its delete count. Full list in §2.5.
11. **Post metadata is duplicated and already out of sync.** `helm`: title and date both differ between `js/blog-data.js:150,151` and `blog/posts/helm.md`. `metr-doubling`: date differs (`js/blog-data.js:178` "January 2026" vs frontmatter "February 2026"). Details in §2.7.
12. **`gemma4-heretic-ara` is a live but unlisted post**: the file exists (`blog/posts/gemma4-heretic-ara.md`), the sitemap lists it (`sitemap.xml:38-43`), but its `BLOG_POSTS` entry is commented out (`js/blog-data.js:122-129`). It has no excerpt/tags in production.
13. **`color-randomizer` is in the sitemap with no post file** — confirmed: `sitemap.xml:26-31` lists `/blog/post.html?id=color-randomizer`; no `blog/posts/color-randomizer.md`; the draft lives at `docs/planned-posts/color-randomizer.md` (title "Shuffling Colors", not "color-randomizer"). That URL is a live 404 today.
14. **`autoencoders-1` / `autoencoders-2` exist as local post files but the site links them off-site** to aboutobjects.com (`js/blog-data.js:190,200`, `external: true`). `/blog/post.html?id=autoencoders-1` renders the local copy. Prerendering `/blog/<id>/` will publish two pages that duplicate an external canonical.
15. **The theme picker is unreachable on `/privacy/`, `/404.html`, and `/lexchat/`.** All three load `theme-bootstrap.js` (tokens apply) and `theme-cycler.js`, but the cycler bails at `js/theme-cycler.js:558-559` (`if (!navItems.length) return;`) because none of them loads `js/nav-config.js`. Intent §4.7 requires the picker in every theme — this is new behavior, not parity.
16. **`/12years/` has zero inbound links from the site.** Only reference anywhere is `CLAUDE.md:38`. `/embedded-swift-agent/` has three inbound references: `js/blog-data.js:29` (project CTA), `blog/posts/embedded-swift-agent.md:201` (root-absolute link inside a post body), `sitemap.xml:64`.
17. **Two post bodies use `post.html?id=` links that break under `/blog/<id>/`**: `blog/posts/autoencoders-1.md:200` and `blog/posts/autoencoders-2.md:6`. One post uses a root-absolute subsite link: `blog/posts/embedded-swift-agent.md:201` → `/embedded-swift-agent/`. Full list in §3.5.
18. **Post-body assets use `../../resources/...` (two levels up from `blog/post.html`)** — 24 occurrences. Under `/blog/<id>/` the depth changes; Astro must either rewrite them or keep serving from a path where `../../` still resolves. §3.5.
19. **The chart-refresh workflow serves a post that does not exist.** `.github/workflows/refresh-chart-data.yml` writes three JSONs consumed by `blog/posts/ai-job-market.md`, which is at `docs/planned-posts/ai-job-market.md`, not in `blog/posts/`. The JSON outputs are hardcoded to `blog/posts/assets/` in both the workflow (`:28-30`) and the script (`docs/prebake-cohort-data.py:27`, `REPO/blog/posts/assets`). A move under `src/` or `public/` breaks both.
20. **`docs/` is tracked and therefore publicly served.** `/docs/theme-explorations.html`, `/docs/TODO.md`, `/docs/planned-posts/*.md` (including unpublished drafts), `/CLAUDE.md`, and the untracked prototypes if committed, are all live URLs today. Spec should decide whether Astro publishes `docs/`.
21. **Root-absolute paths inside JS** that a restructure breaks: 20 skin sheet paths `'/css/themes/*.css'` in `js/theme-bootstrap.js`, `'/css/themes/theme-base.css'` at `:715`, `/?style=<id>` navigation at `js/theme-cycler.js:276,303`, and `404.html`'s entirely absolute `<head>` (`:8,9,13,14,15,16,69`).
22. **Four generated strings are visitor-facing but not authored**: read time `"N min read"` (`blog/blog-post.js:179`), dot aria-labels `"Go to slide N"` (`js/featured-carousel.js:266`), lock aria-labels `"Lock/Unlock <Role>"` (`js/theme-cycler.js:462`), and the scheme buttons which render the raw ids `monochromatic/analogous/...` lowercase (`js/theme-cycler.js:62,488`). §2.12.
23. **Two error strings and one placeholder title exist on the post page**: `'Post not found'` (`blog/blog-post.js:141,198`), `'Sorry, this post could not be loaded.'` (`:199`), and `<title>Loading… | Dawson Metzger-Fleetwood</title>` (`blog/post.html:6`). Prerendering removes the need for all three; keep or drop is a spec call.
24. **Two dead prose strings ship in the bundle but never render**: `"Selected Works"` / `"A few projects I'm proud of"` (`js/featured-carousel.js:110`), gated off by `EXPAND_VISUAL = false` (`js/featured-carousel.js:17,421`). Skin CSS still styles them (`css/themes/*.css`, e.g. `neo-pop.css:764`).
25. **Sitemap is hand-maintained and stale/incomplete**: 12 entries, missing `/privacy/`, `/lexchat/`, `/12years/`, `autoencoders-1`, `autoencoders-2`; includes a 404 (`color-randomizer`); several `lastmod` values disagree with git (§3.10).

---

## 2. PART A — prose inventory

Size bucket column is my assessment of what exists today, per intent §4.2
(`xs` ≤3 words, `s` ≤15 words, `m` ≤60 words, `l` unbounded). Per intent §4.3
existing prose migrates as approved `l` and existing labels as `xs`; the bucket
here is informational only.

### 2.1 Proposed YAML sections

| Section | Fields | Sources |
|---|---|---|
| `meta` | 17 | `<title>`, meta description, OG/Twitter, canonical, per page |
| `nav` | 7 | `js/nav-config.js:8-30` |
| `socials` | 6 | `js/nav-config.js:49-56` |
| `masthead` | 2 sequence sets (17 sequences, 35 lines) | `js/script.js:129-203`, `blog/blog-listing.js:38-88` |
| `hero` | 2 | `index.html:75,79` |
| `about` | 2 | `index.html:97,102,103` |
| `skills` | 7 | `index.html:116-130` |
| `jobs` | 4 entries × (title, company, link, dates, bullets) = 26 | `index.html:144-208` |
| `projects` | 8 entries × (title, description, tech[], CTA labels) = 60 | `js/blog-data.js:1-106` |
| `posts` | 10 active entries × (title, date, excerpt, tags) = 40 | `js/blog-data.js:112-213` + `blog/posts/*.md` frontmatter |
| `blog-listing` | 6 | `blog/index.html:64-66,76,96` |
| `contact` | 3 | `index.html:264,271-276,294` |
| `footer` | 1 | repeated 8× across 5 pages |
| `theme-picker` | 12 UI strings + 16 theme labels + 5 role labels + 6 scheme labels | `js/theme-cycler.js`, `js/theme-bootstrap.js` |
| `404` | 4 | `404.html:6,50,51,52` |
| `privacy` | 30 blocks (738 words) | `privacy/index.html:30,35,39-110` |
| `lexchat` | 1 | `lexchat/index.html:6` |
| `skin-strings` | 17 CSS `content:` declarations (2 are real prose) | `css/themes/*.css` |
| `subsites` | out of the prose file per intent §4.8 — see §3.6 / open question O5 | `12years/`, `embedded-swift-agent/` |

### 2.2 `meta` — page titles, descriptions, OG/Twitter

| Page | Field | Text | file:line | Bucket |
|---|---|---|---|---|
| home | title | `Dawson Metzger-Fleetwood` | `index.html:6` | s |
| home | description | `Dawson Metzger-Fleetwood is a software engineer working across web, iOS and visionOS, and ML/RL. Projects, blog, experience, and ways to get in touch.` (24 w) | `index.html:7` | m |
| home | og:title | `Dawson Metzger-Fleetwood` | `index.html:12` | s |
| home | og:description | `Software engineer working across web, iOS and visionOS, and ML/RL.` (11 w) | `index.html:13` | s |
| home | og:image | `https://www.dawsonamf.com/resources/og-avatar.jpg` | `index.html:15` | — (asset) |
| home | twitter:card | `summary` | `index.html:16` | — |
| home | canonical | `https://www.dawsonamf.com/` | `index.html:8` | — |
| blog | title | `Blog \| Dawson Metzger-Fleetwood` | `blog/index.html:6` | s |
| blog | description | `Deep dives into projects by Dawson Metzger-Fleetwood — AI and ML, Swift, systems, and developer tools.` (16 w, contains an em dash) | `blog/index.html:7,13` | m |
| blog | og:title / og:url / og:image | same pattern | `blog/index.html:12,14,15` | — |
| post | title (static placeholder) | `Loading… | Dawson Metzger-Fleetwood` | `blog/post.html:6` | s |
| post | title (runtime) | `<frontmatter title> | Dawson Metzger-Fleetwood` | `blog/blog-post.js:153` | generated |
| post | description | `A blog post by Dawson Metzger-Fleetwood.` (6 w) — generic, never per-post | `blog/post.html:7` | s |
| privacy | title | `Privacy Policy \| Dawson Metzger-Fleetwood` | `privacy/index.html:6` | s |
| privacy | description | `Privacy policy for the website and applications of Dawson Metzger-Fleetwood.` (11 w) | `privacy/index.html:7` | s |
| 404 | title | `404 \| Dawson Metzger-Fleetwood` | `404.html:6` | s |
| 404 | robots | `noindex` | `404.html:7` | — |
| lexchat | title | `LexChat` | `lexchat/index.html:6` | xs |

Notes: post page has **no** OG/Twitter tags at all (`blog/post.html:1-59`) — this is the
`docs/TODO.md:6` item that §4.6 unblocks. `blog/post.html` also has **no canonical**.
Privacy, 404 and lexchat have no OG tags and no canonical.

### 2.3 `nav` and `socials`

Nav labels — `js/nav-config.js:8-20`, rendered by `buildNavItems` (`:95-117`).
Every label is plain text inside `<a class="menu-item">` or a `<button>`; no HTML inside.

| Label | Where | file:line | Bucket |
|---|---|---|---|
| `About` | desktop nav | `js/nav-config.js:9` | xs |
| `Experience` | desktop nav | `:10` | xs |
| `Projects` | desktop nav | `:11` | xs |
| `Blog` | desktop + mobile nav | `:12,18` | xs |
| `Contact` | desktop nav | `:13` | xs |
| `Resume` | desktop + mobile nav | `:14,19` | xs |
| `Email` | mobile nav (icon-only → becomes `aria-label`) | `:17` | xs |
| `Theme` | desktop nav (dropdown trigger) + mobile (icon-only → `aria-label`) | `:28,29` | xs |

Social labels — `js/nav-config.js:49-56`. All six anchors are **icon-only**, so
`label` is used solely as `aria-label` (`js/nav-config.js:61`). This is the
existing implementation of intent §3.1's "aria-labels built from approved strings".

| Label / aria-label | href | file:line | Bucket |
|---|---|---|---|
| `LinkedIn` | linkedin.com/in/dawsonamf7 | `:50` | xs |
| `X (Twitter)` | twitter.com/dawsonamf7 | `:51` | xs |
| `Messenger` | facebook.com/messages/... | `:52` | xs |
| `Email` | `mailto:dawsonamf@icloud.com` | `:53` | xs |
| `Contact card` | `https://www.dawsonamf.com/resources/contact.vcf` (absolute) | `:54` | xs |
| `Schedule a call` | `#` + `.calendly-link` handler | `:55` | xs |

Nav aria-labels in HTML (static, not config-driven):
`Main navigation` (`index.html:49,58`; `blog/index.html:47,53`; `blog/post.html:73,79`),
`Quick links` (`index.html:61`; `blog/index.html:56`; `blog/post.html:82`),
`Social links` (`index.html:280,284`).
Logo link text is the single character `D` (`index.html:57`; `blog/index.html:52`;
`blog/post.html:78`; `privacy/index.html:25`; `404.html:46`) — an `xs` field, unlabelled for screen readers.

### 2.4 `hero`, `about`, `skills`, `contact`, `footer` (home page)

| Field | Text (verbatim / first sentence) | HTML inside | file:line | Words | Bucket |
|---|---|---|---|---|---|
| hero image alt | `Dawson Metzger-Fleetwood` | — | `index.html:75` | 3 | xs |
| hero subtitle | `Web&nbsp;\|&nbsp;iOS and visionOS&nbsp;\|&nbsp;ML and RL` | **3× `&nbsp;`** | `index.html:79` | 8 | s |
| section header 01 | `<span class="sec-num">01.</span>About` | span.sec-num | `index.html:97` | 1 + number | xs |
| about card title | `About Me` | — | `index.html:102` | 2 | xs |
| about body | `I’m Dawson Metzger-Fleetwood, a software engineer with dual degrees in Finance and Computer Science (Machine Learning specialization) from the University of Maryland.` … 4 paragraphs | **`<br><br>` ×3 and a trailing `<br>`**; curly apostrophes `’` | `index.html:103-112` | **190** | l |
| skills card title | `Skills` | — | `index.html:116` | 1 | xs |
| skills sub-header 1 | `Web` | — | `index.html:117` | 1 | xs |
| skills body 1 | `I have professional experience engineering full-stack web applications and interactive websites.` … | none (single block) | `index.html:118-120` | **132** | l |
| skills sub-header 2 | `iOS and visionOS` | — | `index.html:121` | 3 | xs |
| skills body 2 | `I’ve worked extensively on iOS and visionOS projects, including advanced AR/VR development using RealityKit.` … | none | `index.html:122-124` | **89** | l |
| skills sub-header 3 | `ML and RL` | — | `index.html:125` | 3 | xs |
| skills body 3 | `Professionally, I've applied machine learning to both enterprise and government systems.` … 2 paragraphs | **`<br><br>` ×1** | `index.html:126-130` | **145** | l |
| section header 05 | `<span class="sec-num">05.</span>Contact` | span.sec-num | `index.html:264` | 1 + number | xs |
| contact body | `My inbox is always open. If you're interested in working together, have a question, or just want to say hi, feel free to reach out! Send me an email at …, or connect with me by selecting an option below. You can also schedule a call.` | **2 inline `<a>`**: `mailto:dawsonamf@icloud.com` with `target/rel/class="text-link"`, and `href="#" class="text-link calendly-link"` (JS-bound) | `index.html:271-277` | 48 | m |
| contact map alt | `Map` | — | `index.html:294` | 1 | xs |
| footer credit | `Designed and built by Dawson Metzger-Fleetwood` | — | `index.html:305,312`; `blog/index.html:113,120`; `blog/post.html:98`; `privacy/index.html:116,123`; `404.html:58,65` (**8 desktop+mobile pairs across 5 pages**) | 6 | s |
| "See all posts" | `See all posts` | `<a class="text-link" href="blog/">` | `index.html:254` | 3 | xs |

Section headers on home, all `<span class="sec-num">NN.</span>Label`:
`01. About` (`:97`), `02. Where I've Worked` (`:144`), `03. Selected Works` (`:218`),
`04. Blog` (`:243`), `05. Contact` (`:264`).

### 2.5 `masthead` — typing sequences (verbatim, every line)

Engine picks one sequence at random per load (`js/typing-engine.js:31`). `\n`
is a real newline that becomes `<br>`. Delete counts are character-exact.

**Home — 10 sequences, `js/script.js:129-203`.** Every sequence's `type` step 1
ends `...` and every sequence ends on `software engineer.` except #3 and #4.

| # | file:line | Steps (text verbatim) |
|---|---|---|
| 1 | `:130-142` | type `Hi,\nI'm Dawson,\nweb developer.` → del 14 → type `iOS developer.` → del 14 → type `ML engineer.` → del 12 → type `software engineer.` |
| 2 | `:143-149` | type `Hi,\nI'm Dawson,\nfull stack engineer.` → del 20 → type `software engineer.` |
| 3 | `:150-153` | type `Hey,\nI'm Dawson,\nsoftware engineer.` (no deletes) |
| 4 | `:154-157` | type `Hi,\nI'm Dawson,\nsoftware engineer.` (no deletes) |
| 5 | `:158-164` | type `Hey,\nI'm Dawson,\nbuilder.` → del 8 → type `software engineer.` |
| 6 | `:165-171` | type `Hi,\nI'm Dawson,\nbuilder.` → del 8 → type `software engineer.` |
| 7 | `:172-178` | type `Hey,\nI'm Dawson,\nbuilder.` → del 8 → type `software engineer.` (duplicate of #5) |
| 8 | `:179-185` | type `Hi,\nI'm Dawson,\nbuilder.` → del 8 → type `software engineer.` (duplicate of #6) |
| 9 | `:186-192` | type `Hey,\nI'm Dawson,\nagentic engineer.` → del 17 → type `software engineer.` |
| — | `:193-202` | **commented out**: `...software engineer.` → `vibe coder.` → `software engineer.` |

Sequences 5-8 are two pairs of exact duplicates, which weights "builder." at 4/9
of loads. Preserve the duplication if parity means preserving the odds.

**Blog listing — 7 sequences, `blog/blog-listing.js:38-88`.** All end `Blog.`

| # | file:line | Steps |
|---|---|---|
| 1 | `:39-45` | type `Cool things I've built.` → del 23 → type `Blog.` |
| 2 | `:46-52` | type `Things I find interesting.` → del 26 → type `Blog.` |
| 3 | `:53-59` | type `Late night rabbit holes.` → del 24 → type `Blog.` |
| 4 | `:60-66` | type `Rabbit holes.` → del 13 → type `Blog.` |
| 5 | `:67-73` | type `Things I've built.` → del 18 → type `Blog.` |
| 6 | `:74-80` | type `Random projects.` → del 16 → type `Blog.` |
| 7 | `:81-87` | type `Side quests.` → del 12 → type `Blog.` |

Typing timings: `TYPING_DELAY` (`js/script.js:127`), `deleteDelay: 40`, pauses
1000/1500 ms (home) and 800 ms (listing) — intent §4.13 requires same constants.

### 2.6 `jobs` — `index.html:142-208`

Header: `<span class="sec-num">02.</span>Where I've Worked` (`:144`).
Menu labels (`:153-156`): `About Objects`, `Johns Hopkins University`,
`Visual Language Associates`, `Startup Shell` — all `xs`, no HTML.

| Job | Title string | Employer link | Dates | Bullets | Bullet words | file:line |
|---|---|---|---|---|---|---|
| job-1 | `Software Engineer @ About Objects` | `https://www.aboutobjects.com/` inside an `<a class="text-link" target="_blank">` | `July 2023 – Present` (en dash) | 6 visible (+1 commented at `:172`) | 30/38/22/39/29/14 = **172** | `:164-174` |
| job-2 | `Guest Lecturer @ Johns Hopkins University` | `https://cogsci.jhu.edu/` | `Spring 2024 – Present` | 3 | 43/23/22 = **88** | `:177-183` |
| job-3 | `Technical Co-Founder @ Visual Language Associates` | **no link** | `September 2019 - July 2023` (hyphen, not en dash — inconsistent with the others) | 6 | 42/11/15/29/16/19 = **132** | `:186-195` |
| job-4 | `Fellow @ Startup Shell` | `https://startupshell.org/` | `September 2022 – Present` | 3 | 16/46/16 = **78** | `:198-204` |

Every job title is `Role @ <a>Employer</a>` — two fields plus an href, not one
string, if a theme wants to render them separately (cream's numbered index rows do).
Bullets contain curly apostrophes (`’`) mixed with straight (`'`) — e.g. `Apple’s`
at `:167` vs `UMD’s` at `:201`. No other HTML inside bullets.
Job dates and menu labels are `xs`/`s`; every bullet is `m`-sized (11-46 words).

### 2.7 `posts` — `js/blog-data.js:112-213` vs `blog/posts/*.md` frontmatter

**Mismatches found (flagged per the brief):**

| id | `BLOG_POSTS` title / date | Frontmatter title / date | Verdict |
|---|---|---|---|
| `helm` | `Helm: A Minimalist Workspace Switcher for your IDE` / `April 2026` (`js/blog-data.js:150,151`) | `Helm: A Workspace Switcher for VS Code and Cursor` / `March 2026` | **title AND date differ** |
| `metr-doubling` | `How Fast Are Agents Improving?` / `January 2026` (`:177,178`) | same title / `February 2026` | **date differs** |
| `gemma4-heretic-ara` | **entry commented out** (`:122-129`), commented title `Fine-Tuning Gemma 4 MoE with Heretic-ARA` / `April 2026` | `Fine-Tuning Gemma 4 MoE with Heretic-ARA` / `April 2026` | **post exists + in sitemap, but has no listing entry, no excerpt, no tags in production** |
| `autoencoders-1` | `Autoencoders – Part 1` / `January 2024`, `external: true`, url → aboutobjects.com (`:195-202`) | identical title/date, local file exists | **local file unreachable from the listing; duplicate of an external canonical** |
| `autoencoders-2` | `Autoencoders – Part 2` / `April 2024`, `external: true` (`:185-193`) | identical | same |
| `color-randomizer` | not in `BLOG_POSTS` | **no file in `blog/posts/`**; draft at `docs/planned-posts/color-randomizer.md`, title `Shuffling Colors` | **sitemap 404 (`sitemap.xml:26-31`)** |
| `ai-job-market` | not in `BLOG_POSTS` | draft at `docs/planned-posts/ai-job-market.md`, title `AI and the Job Market` / `July 2026`; a ready-to-apply patch sits at `docs/planned-posts/ai-job-market-listing.patch` | not published; its chart data **is** refreshed weekly (§3.8) |
| `sample-efficiency` | not in `BLOG_POSTS` | draft at `docs/planned-posts/sample-efficiency.md`, `The Sample Efficiency Gap` / `June 2026` | not published |

Matching correctly: `fly-on-my-laptop`, `underviewed-art`, `arena-freshness`,
`toolbelt`, `embedded-swift-agent`, `college-projects`.

**Excerpts (10 active + 1 commented), `js/blog-data.js`:**

| id | line | Words | Bucket | Tags |
|---|---|---|---|---|
| `fly-on-my-laptop` | `:118` | 31 | m | `Swift`, `Systems` |
| `underviewed-art` | `:135` | 19 | m | `Tools` |
| `arena-freshness` | `:144` | 19 | m | `Tools` |
| `helm` | `:153` | 17 | m | `Tools` |
| `toolbelt` | `:162` | 24 | m | `Tools`, `Systems` |
| `embedded-swift-agent` | `:171` | 20 | m | `Swift`, `Systems` |
| `metr-doubling` | `:180` | 17 | m | `AI & ML` |
| `autoencoders-2` | `:189` | 16 | m | `AI & ML` |
| `autoencoders-1` | `:199` | 16 | m | `AI & ML` |
| `college-projects` | `:209` | 17 | m | `AI & ML`, `Systems` |
| `gemma4-heretic-ara` | `:126` (commented) | 25 | m | `AI & ML` |

No excerpt contains HTML. Tag vocabulary is 5 distinct `xs` strings:
`AI & ML`, `Swift`, `Systems`, `Tools`, plus `Economics` in the pending patch.
`AI & ML` contains a literal `&` rendered through `innerHTML`
(`blog/blog-listing.js:128`, `blog/blog-post.js:166`) — it renders because `&`
followed by a space is not an entity, but a YAML round-trip must not turn it into `&amp;`.

Frontmatter is `title` + `date` only, plus `scripts`/`styles` arrays on three posts
(`gemma4-heretic-ara`, `metr-doubling`, `underviewed-art`). Frontmatter is parsed by a
hand-rolled line splitter (`blog/blog-post.js:32-48`), **not YAML** — no quoting,
no multi-line values, `[a, b]` only.

### 2.8 `projects` — `FEATURED_PROJECTS`, `js/blog-data.js:1-106`

Rendered by `js/featured-carousel.js:67-92` via `innerHTML`.
`title` also becomes the card image `alt` (`js/featured-carousel.js:84`) — an existing
"aria/alt built from an approved field" pattern per intent §3.1.

| id | title | desc line | Words | `<br><br>` blocks | tech chips | CTA(s) |
|---|---|---|---|---|---|---|
| `gemma4-heretic-ara` | `Gemma 4 MoE Heretic-ARA` | `:6` | 105 | 2 | 6 | `View on HuggingFace` → huggingface.co |
| `embedded-swift-agent` | `Embedded Swift Agent` | `:25` | 138 | 2 | 5 | `Try it in your browser` → `/embedded-swift-agent/`; `View on GitHub` |
| `silicon-fly` | `Silicon Fly` | `:39` | 114 | 2 | 5 | `Read the post` → `../blog/post.html?id=fly-on-my-laptop`; `View on GitHub` |
| `helm` | `Helm` | `:53` | 121 | 2 | 5 | `View on VS Code Marketplace` |
| `toolbelt` | `Toolbelt` | `:65` | 145 | 2 | 4 | `View on GitHub` |
| `amino-amigo` | `Amino Amigo` | `:77` | 108 | 2 | 3 | `View on the App Store` |
| `lexchat` | `LexChat` | `:89` | 108 | 2 | 5 | `Visit LexChat` → `/lexchat/` |
| `deep-rl` | `Deep RL` | `:101` | 76 | 1 | 3 | **none** (no url/ctaLabel) |

**Every description is 76-145 words, i.e. `l` today; none has an `m` or `s` variant.**
Themes that want short blurbs (cream, mono, vanlent, mosbyfiles per §6) need new
`s`/`m` sizes for all eight — that is 16-24 draft strings on day one.

Curly quotes appear in `helm` (`“spaces”`, `:53`) and `deep-rl` uses a
single-quoted JS string with escaped `\'` because the text contains `OpenAI's` (`:101`).
`deep-rl` also contains a book title in straight double quotes.

Tech chip vocabulary (36 chips total, all `xs`, verbatim at `:8-15,27,41,55,67,79,91,103`):
`Directional Ablation`, `KL Divergence`, `Refusal Suppression`, `HuggingFace`,
`L-BFGS`, `PyTorch`, `Embedded Swift`, `C`, `libcurl`, `cJSON`, `pthreads`,
`Metal`, `Swift`, `Compute Shaders`, `Connectomics`, `GPU`, `TypeScript`,
`VSCode API`, `Webview`, `CSP`, `esbuild`, `Python`, `FastMCP`, `Cloudflare`,
`OAuth 2.0`, `SwiftUI`, `Xcode`, `Pinecone`, `Streamlit`, `OpenAI`,
`BeautifulSoup`, `C++`, `OpenAI Gym`.

CTA label vocabulary (10 strings, all `xs`/`s`): `View on HuggingFace`,
`Try it in your browser`, `View on GitHub` (×3), `Read the post`,
`View on VS Code Marketplace`, `View on the App Store`, `Visit LexChat`.

### 2.9 `skin-strings` — every CSS `content:` with visible text

| Theme | Declaration (verbatim) | file:line | Prose? |
|---|---|---|---|
| marquee | `content: var(--ticker-run, "✷ WEB ✷ iOS ✷ VISIONOS ✷ MACHINE LEARNING ✷ REINFORCEMENT LEARNING ✷ …")` — the 5-word run repeats 12×, ~85 words total | `css/themes/marquee.css:572` | **yes — real prose** |
| doodle | `content: 'currently here \2713'` (✓ escaped) | `css/themes/doodle.css:535` | **yes — real prose** |
| blueprint | `content: "FIG. " counter(blueprintFig, decimal-leading-zero)` | `css/themes/blueprint.css:652` | label + counter |
| field-notes | `content: "№ " counter(fieldNotesFig)` | `css/themes/field-notes.css:523` | glyph + counter |
| banknote | `content: '№ '` (×2) | `css/themes/banknote.css:495,1235` | glyph |
| brutalist | `content: "■ "` | `css/themes/brutalist.css:322` | glyph |
| gallery | `content: "·"` | `css/themes/gallery.css:909` | glyph |
| marquee | `content: "(" counter(marquee-bullet, decimal-leading-zero) ")"` | `css/themes/marquee.css:941` | punctuation + counter |
| marquee | `content: "✷"` (×2) | `css/themes/marquee.css:1014,1419` | glyph |
| studio | `content: counter(studio-nav, decimal-leading-zero)` | `css/themes/studio.css:95` | counter only |
| studio | `content: "/"` (×2) | `css/themes/studio.css:452,651` | glyph |
| constructivist *(inactive)* | `content: counter(plan, decimal-leading-zero)` | `css/themes/constructivist.css:554` | counter |
| space *(inactive)* | `content: '[ '` / `content: ' ]'` | `css/themes/space.css:418,423` | glyph |

No `content:` string exists in `css/styles.css`, `css/mobile-styles.css`,
`css/featured-carousel.css`, `css/theme-cycler.css`, `blog/*.css`,
`privacy/privacy-styles.css`, `lexchat/lexchat-styles.css` other than `''`
(`css/styles.css:844`, `css/theme-cycler.css:505`). No custom property anywhere
holds visible text except `--ticker-run` (referenced only as the fallback above;
never assigned — grep found no `--ticker-run:` declaration, so the literal always wins).

### 2.10 `theme-picker` — `js/theme-cycler.js` + `js/theme-bootstrap.js`

Theme labels (16 active, `js/theme-bootstrap.js`), rendered at `js/theme-cycler.js:303,305`
and in the preview card at `:349`:
`Default` (`:18`), `Studio` (`:24`), `Brutalist` (`:72`), `Broadsheet` (`:120`),
`Field Notes` (`:141`), `Blueprint` (`:163`), `Doodle` (`:183`),
`Street Poster` (`:268`, id `wheatpaste`), `Bauhaus` (`:292`),
`Porcelain` (`:316`, id `chinoiserie`), `Banknote` (`:341`),
`Swiss Grid` (`:371`, id `grid`), `Gallery` (`:399`), `Miami Deco` (`:498`),
`Pop Art` (`:528`, id `neo-pop`), `Marquee` (`:563`).
Inactive/commented: `Space` (`:215`), `Vaporwave` (`:245`), `Wanted` (`:430`),
`Constructivist` (`:462`). Display order is `ORDER` at `js/theme-bootstrap.js:637`,
which is **not** the registry declaration order.

Picker UI strings:

| Text | Role | file:line | Bucket |
|---|---|---|---|
| `Theme controls` | dock `aria-label` | `js/theme-cycler.js:514` | xs |
| `Styles` | left column heading (flips to `Advanced`) | `:520`, `:414` | xs |
| `Advanced` | heading when advanced is on | `:414` | xs |
| `Scheme` | group label | `:528` | xs |
| `Colors` | group label | `:532` | xs |
| `Palette` | right column heading | `:540` | xs |
| `Shuffle colors` | action button | `:542` | xs |
| `random palette` | action sub-label | `:542` | xs |
| `Reset` | action button | `:543` | xs |
| `back to default` | action sub-label | `:543` | xs |
| `Advanced` / `Back to styles` | action button label (toggles) | `:544`, `:415` | xs |
| `scheme &amp; colors` / `done editing` | action sub-label (toggles; **contains `&amp;`**) | `:544`, `:416` | xs |
| `current` | preview card meta (also set to `preview` on hover) | `:546`, `:350` | xs |
| `preview` | preview card meta on hover | `:315,316` | xs |

Role labels — `js/theme-cycler.js:157-163`: `Text`, `Background`, `Primary`,
`Secondary`, `Accent`. Used as visible `<label>` text (`:461`) **and** composed into
the lock `aria-label` (`:462`, `"Lock <Role>"` / `"Unlock <Role>"`).

Scheme buttons render the raw ids lowercase (`js/theme-cycler.js:62,488`):
`random`, `monochromatic`, `analogous`, `complementary`, `triadic`, `tetradic`.
These are visitor-facing labels that are currently identifiers — worth promoting to prose.

Each role tile also carries `title="#rrggbb"` (`js/theme-cycler.js:457`) — a generated tooltip.

### 2.11 `blog-listing`, `404`, `privacy`, `lexchat`

Blog listing (`blog/index.html`):

| Field | Text (first sentence) | Words | file:line | Bucket |
|---|---|---|---|---|
| intro ¶1 | `I like building things. While some projects become public, most never leave my machine…` | 46 | `:64` | m |
| intro ¶2 | `Writing about something is its own kind of project, and so is posting something publicly.` … | 47 | `:65` | m |
| intro ¶3 | `The topics jump around a lot, but if something kept me up late more than a few nights in a row, it might end up here.` | 26 | `:66` | m |
| header 01 | `<span class="sec-num">01.</span>Selected Works` | 2 | `:76` | xs |
| header 02 | `<span class="sec-num">02.</span>All Posts` | 2 | `:96` | xs |
| footer | `Designed and built by Dawson Metzger-Fleetwood` | 6 | `:113,120` | s |

None of the three intro paragraphs contains any HTML — clean Markdown round-trip.
Note the listing's section numbering restarts at `01.`, so `sec-num` is per-page.

404 (`404.html`): `404` (`:50`), `This page doesn't exist, or it moved.` (7 w, `:51`),
`Back to the home page` (5 w, link to `/`, `:52`), footer (`:58,65`).

Privacy (`privacy/index.html`): heading `Privacy Policy` (`:30`);
a pill reading `Updated January 10, 2026` (`:35`) — **hardcoded, will go stale**;
then a 738-word body (`:39-110`) of 15 `<p>`, 8 `<h2>`, 4 `<h3>`, 18 `<li>`,
one `&amp;` entity (`:70`, "Camera & microphone"), and one `mailto` link with
`class="text-link"` (`:110`). Section headings are numbered in the text itself
(`1. Information Collection` … `8. Contact Information`) and sub-headings lettered
(`A.`-`D.`). This is the one page where Markdown is a clean fit — it is already
plain semantic HTML with lists — **except** the `class="text-link"` on the mailto.

LexChat (`lexchat/index.html`): the only string is `<title>LexChat</title>` (`:6`).
No nav, no prose, no footer — just a full-bleed iframe (`:14-16`).

### 2.12 Generated / computed visitor-facing text

Not authored today; the spec must decide whether each is prose or code.

| String | Formula | file:line |
|---|---|---|
| `N min read` | `Math.max(1, Math.round(words / 200))` over the rendered post body | `blog/blog-post.js:176-179` |
| `Go to slide N` | carousel dot `aria-label`, `i + 1` | `js/featured-carousel.js:266` |
| `Lock <Role>` / `Unlock <Role>` | composed from `ROLES[i].label` | `js/theme-cycler.js:462` |
| `#rrggbb` | role tile `title` tooltip | `js/theme-cycler.js:457` |
| `Copy code` | copy-button `aria-label` (static, but injected by JS) | `blog/blog-post.js:98` |
| `Post not found` | fetch failure / missing `?id` | `blog/blog-post.js:141,198` |
| `Sorry, this post could not be loaded.` | fetch failure body | `blog/blog-post.js:199` |
| post `<title>` | `meta.title + ' \| Dawson Metzger-Fleetwood'` | `blog/blog-post.js:153` |
| post date pills | frontmatter `date` string rendered verbatim, **no formatting** | `blog/blog-post.js:158` |
| JSON-LD `author`/`publisher` name | literal `Dawson Metzger-Fleetwood` ×2 | `blog/blog-post.js:68,73` |
| JSON-LD `datePublished` | `new Date(dateStr + ' 1').toISOString().slice(0,10)` — parses `"May 2026"` → `2026-05-01` | `blog/blog-post.js:50-53` |
| filter pills | rendered from post `tags`, no separate label | `blog/blog-listing.js:102-104` |
| card dates | `post.date` verbatim (e.g. `August 2026`) | `js/script.js:391`, `blog/blog-listing.js:134` |
| `Selected Works` / `A few projects I'm proud of` | **dead** — `EXPAND_VISUAL = false` | `js/featured-carousel.js:110,17,421` |

There is **no** "N posts" counter, no pagination text, and no date library anywhere.
Post dates are human-written month-year strings, not ISO — a schema will need to
accept `"August 2026"` or the migration converts them.

### 2.13 Word-count totals

| Section | Fields | Total words |
|---|---|---|
| about | 1 body + 2 labels | 190 + 3 |
| skills | 3 bodies + 4 labels | 366 + 8 |
| jobs | 18 bullets + 4 titles + 4 dates + 4 menu labels | 470 + ~40 |
| projects | 8 descriptions | 915 |
| projects (chrome) | 8 titles + 36 chips + 10 CTAs | ~90 |
| posts | 10 excerpts + 10 titles + 10 dates | 196 + ~85 |
| blog-listing intro | 3 paragraphs | 119 |
| masthead | 17 sequences / 35 type-steps | ~150 |
| privacy | 30 blocks | 738 |
| contact / 404 / footer | 3 + 3 + 1 | ~70 |
| meta (titles + descriptions) | 17 | ~110 |
| theme-picker | ~39 labels | ~60 |
| **Total (excluding post bodies)** | **≈150 fields** | **≈3,600 words** |

Post bodies, excluded per the brief, total 13,253 words across 11 files
(`wc -w blog/posts/*.md`), largest `embedded-swift-agent.md` at 2,157.

---

## 3. PART B — URL inventory

### 3.4 Every URL served today

GitHub Pages legacy mode serves `main:/` verbatim, so **every tracked file is a URL**.

| Path | What it is | Produced by | Linked from |
|---|---|---|---|
| `/` | home | `index.html` | logo (`blog/index.html:52`, `blog/post.html:78`, `404.html:46`, `privacy/index.html:25` — the last two use the absolute `https://www.dawsonamf.com/`), `404.html:52`, sitemap, canonical |
| `/?style=<id>` | home with a skin pre-applied | query param read at `js/theme-bootstrap.js:688` | `js/theme-cycler.js:276,303` (16 hrefs, one per theme in `ORDER`) |
| `/blog/` | listing | `blog/index.html` | `index.html:254`, nav `js/nav-config.js:12,18`, sitemap |
| `/blog/post.html?id=<id>` | post, client-rendered | `blog/post.html` + `blog/blog-post.js:137-145` fetching `posts/<id>.md` | `js/blog-data.js:119,136,145,154,163,172,181,211` (home cards), `blog/blog-listing.js:130` (strips the `blog/` prefix), `js/blog-data.js:43` (project CTA), post bodies (§3.5), sitemap |
| — valid ids | `fly-on-my-laptop`, `underviewed-art`, `arena-freshness`, `helm`, `toolbelt`, `embedded-swift-agent`, `metr-doubling`, `college-projects`, `gemma4-heretic-ara`*, `autoencoders-1`*, `autoencoders-2`* | `blog/posts/*.md` | *not linked from any listing |
| — invalid id | `color-randomizer` | **no file** | `sitemap.xml:26-31` only |
| `/privacy/` | privacy policy | `privacy/index.html` | **nothing on the site links to it** (external App Store listings presumably do) |
| `/404.html` | custom 404, served for any missing URL | `404.html` | GitHub Pages |
| `/lexchat/` | full-page iframe → `https://dawsonamf-lexchat.hf.space` (`lexchat/index.html:16`) | `lexchat/index.html` | `js/blog-data.js:93` (project CTA) |
| `/12years/` | standalone anniversary page | `12years/index.html` | **no inbound link anywhere**; only `CLAUDE.md:38` |
| `/embedded-swift-agent/` | WASM agent terminal | `embedded-swift-agent/index.html` | `js/blog-data.js:29`, `blog/posts/embedded-swift-agent.md:201`, `sitemap.xml:64` |
| `/sitemap.xml` | sitemap | static | `robots.txt:4` |
| `/robots.txt` | robots | static | crawlers |
| `/CNAME` | Pages domain | static (`www.dawsonamf.com`) | Pages |
| `/.nojekyll` | disables Jekyll | empty file | Pages |
| `/CLAUDE.md` | **agent conventions, publicly readable** | tracked | — |
| `/docs/TODO.md`, `/docs/theme-explorations.html`, `/docs/ai-job-market-post-plan.md`, `/docs/mega-menu-top-curtain.md`, `/docs/prebake-cohort-data.py`, `/docs/planned-posts/{ai-job-market,color-randomizer,sample-efficiency}.md`, `/docs/planned-posts/ai-job-market-listing.patch` | **9 tracked docs, all publicly served, including unpublished post drafts** | tracked | — |

Assets served and referenced:

| Path | Referenced by |
|---|---|
| `/resources/og-avatar.jpg` | `index.html:15`, `blog/index.html:15` (og:image, **absolute URL**) |
| `/resources/favicon-32.png` | `index.html:9`, `blog/index.html:9`, `blog/post.html:8`, `privacy/index.html:8`, `lexchat/index.html:7`, `404.html:8` (**absolute path**) |
| `/resources/apple-touch-icon.png` | same six pages (`…:10,10,9,9,8,9`) |
| `/resources/Resume.pdf` | `js/nav-config.js:14,19` (nav "Resume", opens in a new tab) |
| `/resources/contact.vcf` | `js/nav-config.js:54` — **hardcoded absolute `https://www.dawsonamf.com/…`** |
| `/resources/profile_photo.jpg` | `index.html:75` |
| `/resources/location.png` | `index.html:294` |
| `/resources/arena-freshness.user.js` | `blog/posts/arena-freshness.md:52` (a downloadable Tampermonkey script) |
| `/css/themes/<20 sheets>.css` | **root-absolute** in `js/theme-bootstrap.js` (20 `css:` values + `theme-base.css` at `:715`) |
| `/css/styles.css`, `/css/mobile-styles.css`, `/css/theme-cycler.css`, `/js/theme-bootstrap.js`, `/js/theme-cycler.js` | **root-absolute in `404.html:13,14,15,16,69`** (deliberate — 404 is served at any depth) |
| `/blog/posts/assets/*` (6 JS/CSS + 3 JSON) | frontmatter `scripts`/`styles`, loaded relative to `blog/` (`blog/blog-post.js:114-135`) |
| `/embedded-swift-agent/EmbeddedSwiftAgent.wasm`, `/embedded-swift-agent/agent.js` | `embedded-swift-agent/index.html` |
| `/12years/then.jpeg`, `/12years/now.jpeg` | `12years/index.html:850,851` |

Redirect surface for §3.5/§4.5/§4.6/§4.8: `/blog/post.html?id=<11 ids>`,
`/?style=<16 ids>`, `/12years/`, `/embedded-swift-agent/`, plus every
`/resources/*` and `/css/*` path if the folder layout changes.

### 3.5 Internal links inside post bodies that break on a URL change

| File:line | Link | Breaks because |
|---|---|---|
| `blog/posts/autoencoders-1.md:200` | `[part 2](post.html?id=autoencoders-2)` | relative to `blog/`; under `/blog/<id>/` it resolves to `/blog/autoencoders-1/post.html?id=…` |
| `blog/posts/autoencoders-2.md:6` | `[part one](post.html?id=autoencoders-1)` | same |
| `blog/posts/embedded-swift-agent.md:201` | `[run it live in your browser](/embedded-swift-agent/)` | root-absolute; breaks when the subsite moves to `/subsites/<person>/embedded-swift-agent/` |
| `blog/posts/arena-freshness.md:52` | `[script can be downloaded here](../../resources/arena-freshness.user.js)` | depth-relative |
| `blog/posts/college-projects.md:16` | `[read the paper here](../../resources/SnapCut.pdf)` | depth-relative |
| `blog/posts/college-projects.md:10,22,30,40` | 4 `![…](../../resources/*.png\|jpg)` | depth-relative |
| `blog/posts/embedded-swift-agent.md:181` | `![EmbeddedSwiftAgent CLI](../../resources/EmbeddedSwiftAgent_CLIScreenshot.png)` | depth-relative |
| `blog/posts/helm.md:6,47,61` | 3 raw `<img src="../../resources/Helm_*.png" class="blog-image blog-image-float-*">` | depth-relative **and raw HTML** (float classes Markdown can't emit) |
| `blog/posts/autoencoders-1.md:13,24,35,43,53,60,69,75,195` | 9 raw `<img … class="blog-image">` | depth-relative + raw HTML |
| `blog/posts/autoencoders-2.md:31,66,107,121,212,215` | 6 raw `<img … class="blog-image">` | depth-relative + raw HTML |

**24 `../../resources/` references total.** All raw `<img>` tags carry
`class="blog-image"` explicitly because they bypass the marked renderer that adds it
(`blog/blog-post.js:16-19`); tilt is initialized on `.blog-image` (`blog/blog-post.js:183`),
so dropping that class silently kills the hover effect.

In `docs/planned-posts/`: `color-randomizer.md:14` holds a TODO comment containing a
placeholder `post.html?id=THEMES_POST_ID` link (not live). `ai-job-market.md` links only
externally.

No post body links `/12years/` or `/lexchat/`.

### 3.6 The two subsites and lexchat

**`/12years/`** — `12years/index.html`, 3,424 lines, fully self-contained
(all CSS and JS inline). A scroll-driven anniversary letter: an intro
(`Twelve Years Together`, `Dear Elise,`, an anniversary note, `This is a letter about
twelve, told in twelve ways.`, `Keep scrolling` — `:349,353,356,359,363`) then twelve
numbered sections `I`-`XII` each with a Roman-numeral label, a title, and a one-paragraph
body (`:390,391,392` … `:836,837,838`), closing with `I've loved being with you the last
12 years. Here's to the next 12.`, `Love, Dawson ❤️` (`:848`), and a `BACK TO TOP` link.
Section titles: `Twelve Breaths Per Minute`, `Twelve Petals`, `A Dozen Roses`,
`Twelve Faces`, `Twelve Hours`, `Twelve Months`, `Twelve Phases of the Moon`,
`Twelve Notes`, `Twelve Bars`, `Twelve Constellations`, `One Jupiter Orbit`, `Twelve Years`.
Loads: Google Fonts (Cormorant Garamond + EB Garamond, `:7-8`), **GSAP 3.12.5 +
ScrollTrigger from cdnjs** (`:9-10`) — note this is a **different GSAP version** from the
main site's pinned 3.9.1, so §4.12's "versions stay pinned to today's" means two GSAP
versions coexist. Assets `then.jpeg` / `now.jpeg` are **relative** (`:850,851`), so the
whole folder relocates cleanly. **No `theme-bootstrap.js`, no `theme-cycler.js`** — unthemed.
Person: **elise**, confirmed in-content (`12years/index.html:353` `Dear Elise,`) and by
intent §4.8. Target `/subsites/elise/12years/`.
Prose volume: ~30 visitor-facing strings, ~450 words.

**`/embedded-swift-agent/`** — `embedded-swift-agent/index.html`, 517 lines
(inline CSS), plus `agent.js` (327 lines) and `EmbeddedSwiftAgent.wasm`.
A browser terminal for the user's own coding agent: a macOS-style window titled
`EmbeddedSwiftAgent` (`:224`) with a setup form (`OpenRouter API key *`, `Model *`,
`Reasoning effort` with options `none/low/medium/high/max`, `Exa API key`,
`Keys stay in this browser.`, `Start` — `:238-268`), plus window-control
`aria-label`s `Go back` (`:220`) and `Zoom` (`:222`), and terminal status text
written by `agent.js` (`[agent exited]` `:318`, `[agent exited with code N]` `:321`,
`[agent crashed: …]` `:323`). Loads xterm 6.0.0 + addon-fit 0.11.0 from jsDelivr
(`:7,274,275`), all **relative** local paths otherwise. **No theme-bootstrap,
no theme-cycler** — unthemed. Also ships `embedded-swift-agent-context.md`, a
tracked file the agent reads that contains a bio of the site owner and project
summaries (it references `https://www.dawsonamf.com/lexchat/` at `:38`) — **it is a
public URL and contains visitor-facing prose the owner should review**.
**Proposed `<person>` segment: this is not a person's page — it is the owner's own
project demo.** Reasonable options: `/subsites/dawson/embedded-swift-agent/`, or treat
it as a project page rather than a subsite (`/projects/embedded-swift-agent/`).
**Flag as an owner question (see O3).** ~14 visitor-facing strings, ~25 words.

**`/lexchat/`** — `lexchat/index.html`, 19 lines. A full-viewport iframe pointing at
`https://dawsonamf-lexchat.hf.space` (`:16`), styled by a 17-line stylesheet that
absolutely positions the iframe edge-to-edge (`lexchat/lexchat-styles.css`).
**No nav, no header, no footer, no prose** beyond `<title>LexChat</title>` (`:6`).
It **does** load `theme-bootstrap.js` (`:11`), `theme-cycler.css` (`:10`) and
`theme-cycler.js` (`:17`) — but with no `.tc-nav-item` on the page the cycler returns
early (`js/theme-cycler.js:558-559`), so it renders nothing and the theme is invisible
(the iframe covers the viewport). Under intent §4.7 ("utility pages always get tokens
only" + "the picker must be reachable in every theme") this page needs either an
injected floating picker or an explicit exemption.

### 3.7 `privacy/index.html`

Structure: logo header (`:24-26`) → `.privacy-container` → `<h1>Privacy Policy</h1>` +
a spacer span (`:29-32`) → a `.privacy-meta` pill `Updated January 10, 2026` (`:34-36`) →
`.privacy-content` with 8 numbered `<h2>` sections, 4 lettered `<h3>` subsections,
15 `<p>`, 18 `<li>` (`:38-111`) → desktop and mobile footers (`:113-125`).

Themed: **yes, partially.** It loads `../js/theme-bootstrap.js` (`:18`) synchronously,
so a session-persisted style applies its `data-style` attribute, tokens and skin sheet.
It loads `theme-cycler.css` (`:17`) and `theme-cycler.js` (`:128`), but **not**
`nav-config.js`, so the picker never mounts (`js/theme-cycler.js:558-559`) — you can
arrive here themed, but cannot change or leave the theme except by reloading.
It also loads Font Awesome and Boxicons (`:12,13`) although no icon appears on the page.

Links out: the logo to `https://www.dawsonamf.com/` (**absolute**, `:25`), and a single
`mailto:dawsonamf@icloud.com` with `class="text-link"` (`:110`). No nav, no
link to `/blog/`, and **nothing on the site links in**.

### 3.8 `refresh-chart-data.yml` and `prebake-cohort-data.py`

Workflow `.github/workflows/refresh-chart-data.yml`: cron `17 9 * * 1` (Mondays)
plus `workflow_dispatch` (`:8-11`), `permissions: contents: write` (`:13-14`),
`actions/checkout@v4` (`:20`), runs `python3 docs/prebake-cohort-data.py` (`:24`),
then `git add` of exactly three paths and a commit-and-push as `github-actions[bot]`
(`:26-38`).

Files written (both places hardcode the path):

| File | Written at | Workflow adds at |
|---|---|---|
| `blog/posts/assets/cohort-unemployment-data.json` | `docs/prebake-cohort-data.py:174-175` | `:28` |
| `blog/posts/assets/cohort-swe-age-data.json` | `:205-206` | `:29` |
| `blog/posts/assets/rate-data.json` | `:233-234` | `:30` |

`OUT_DIR = REPO / "blog" / "posts" / "assets"` where `REPO = Path(__file__).resolve().parent.parent`
(`docs/prebake-cohort-data.py:26-27`) — **the script derives the repo root from its own
location**, so moving either the script or `blog/posts/assets/` breaks it.

**Consumer:** the script's docstring (`:4`) and the workflow header (`:2`) both name
`blog/posts/ai-job-market.md` — **that file does not exist**. The post is at
`docs/planned-posts/ai-job-market.md`, whose frontmatter loads
`posts/assets/job-market-chart.js` and `posts/assets/cohorts-chart.js`. So the workflow
refreshes data weekly for an **unpublished** post. `blog/posts/assets/cohorts-chart.js`
and `job-market-chart.js` exist and reference those JSONs; nothing in `blog/posts/*.md`
does.

**Restructure hazards:**
1. Both paths assume `blog/posts/assets/` at repo root. Under Astro, posts likely move to
   `src/content/` (or stay) and assets to `public/` — every reference needs updating in
   two files.
2. The script assumes `docs/` is one level under the repo root.
3. The header comment claims "Pushing the refreshed JSONs redeploys GitHub Pages" (`:4`),
   which is true only in legacy Pages mode. Under Actions deploy, `GITHUB_TOKEN` pushes
   do not trigger `push` workflows — intent §4.10 already flags this; the workflow needs a
   `workflow_dispatch` call added, or a PAT.
4. `permissions: contents: write` stays required; the deploy workflow will need
   `pages: write` + `id-token: write` separately.

### 3.9 `resources/` inventory

Total 41 tracked files. `du -sh` per top-level entry:

| Entry | Size | Referenced by |
|---|---|---|
| `autoencoders/` (15 images) | 1.8M | `blog/posts/autoencoders-1.md` (9), `autoencoders-2.md` (6) — every one referenced |
| `SnapCut.pdf` | **1.3M** | `blog/posts/college-projects.md:16` |
| `location.png` | **924K** | `index.html:294` |
| `turtle.mp4` | **648K** | **UNREFERENCED** |
| `Rotobrush_Media.mp4` | **544K** | **UNREFERENCED** (the `.jpg` is used instead) |
| `ML_Media.png` | 484K | `blog/posts/college-projects.md:40` |
| `Amino_Media.png` | 332K | `js/blog-data.js:78` |
| `MicrOCaml_Media.png` | 308K | `blog/posts/college-projects.md:30` |
| `EmbeddedSwiftAgent_CLIScreenshot.png` | 300K | `js/blog-data.js:26`, `blog/posts/embedded-swift-agent.md:181` |
| `RL_Media.png` | 252K | `js/blog-data.js:102` |
| `Systems_Media.png` | 244K | `blog/posts/college-projects.md:22` |
| `LexChat_Media.jpeg` | 164K | `js/blog-data.js:90` |
| `Rotobrush_Media.jpg` | 156K | `blog/posts/college-projects.md:10` |
| `profile_photo.jpg` | 136K | `index.html:75` |
| `Helm_All.png` | 128K | `js/blog-data.js:54` |
| `Fly_Media.jpg` | 124K | `js/blog-data.js:40` |
| `Purple_Toolbelt_Image.jpg` | 120K | `js/blog-data.js:66` |
| `Resume.pdf` | 108K | `js/nav-config.js:14,19` |
| `apple-touch-icon.png` | 68K | 6 pages |
| `Helm_1/2/3.png` | 60K/60K/40K | `blog/posts/helm.md:61,47,6` |
| `KLvsRefusals.png` | 52K | `js/blog-data.js:7` |
| `og-avatar.jpg` | 36K | `index.html:15`, `blog/index.html:15` |
| `arena-freshness.user.js` | 8K | `blog/posts/arena-freshness.md:52` |
| `favicon-32.png` | 4K | 6 pages |
| `contact.vcf` | 4K | `js/nav-config.js:54` |

**Over the 500 KB convention limit (CLAUDE.md):** `SnapCut.pdf` (1.3M),
`location.png` (924K), `turtle.mp4` (648K), `Rotobrush_Media.mp4` (544K).
`location.png` is the only one of these that loads on the home page.

**Unreferenced (informational only, do not delete):** `resources/turtle.mp4`,
`resources/Rotobrush_Media.mp4`. Several files are referenced *only* by the untracked
prototypes in `docs/` (`Amino_Media.png`, `Fly_Media.jpg`, `Helm_All.png`, etc. also have
real `js/blog-data.js` references, so none is prototype-only).

### 3.10 Git last-modified dates (for sitemap `lastmod` parity)

| File | Last commit | Sitemap `lastmod` | Delta |
|---|---|---|---|
| `index.html` | 2026-08-24 | 2026-04-16 | **stale by 4 months** |
| `blog/index.html` | 2026-08-24 | 2026-04-16 | **stale by 4 months** |
| `blog/posts/fly-on-my-laptop.md` | 2026-08-20 | 2026-08-20 | ok |
| `blog/posts/underviewed-art.md` | 2026-07-06 | 2026-07-06 | ok |
| `blog/posts/arena-freshness.md` | 2026-06-25 | 2026-05-01 | stale |
| `blog/posts/helm.md` | 2026-07-01 | 2026-04-01 | stale |
| `blog/posts/toolbelt.md` | 2026-04-08 | 2026-03-01 | stale |
| `blog/posts/embedded-swift-agent.md` | 2026-07-02 | 2026-07-02 | ok |
| `blog/posts/metr-doubling.md` | 2026-06-12 | 2026-01-01 | **stale by 5 months** |
| `blog/posts/college-projects.md` | 2026-06-09 | 2022-05-01 | **`lastmod` is the publish date, not the modification date** |
| `blog/posts/gemma4-heretic-ara.md` | 2026-06-12 | 2026-04-01 | stale |
| `blog/posts/autoencoders-1.md` | 2026-07-01 | — | **not in sitemap** |
| `blog/posts/autoencoders-2.md` | 2026-07-01 | — | **not in sitemap** |
| `embedded-swift-agent/index.html` | 2026-07-03 | 2026-07-02 | ~ok |
| `blog/post.html` | 2026-07-01 | n/a | — |
| `privacy/index.html` | 2026-06-09 | — | **not in sitemap** |
| `404.html` | 2026-06-09 | n/a | — |
| `lexchat/index.html` | 2026-07-01 | — | **not in sitemap** |
| `12years/index.html` | 2026-06-11 | — | **not in sitemap** |
| `js/blog-data.js` | 2026-08-20 | n/a | — |
| `sitemap.xml` | 2026-08-20 | — | — |
| `robots.txt` | 2026-04-16 | — | — |

The sitemap's `lastmod` values are hand-written publish-ish dates, not modification
dates. If the Astro build generates the sitemap from git or file mtimes, **most
`lastmod` values will change**. That is a search-console-visible difference, not a
parity-harness one, so decide deliberately.

---

## 4. Open questions / risks (owner decisions)

**O1 — `<br><br>` vs Markdown paragraphs (highest risk).**
Nine prose fields use `<br><br>` to separate paragraphs inside a single `<p>`
(`index.html:105,107,109,111,128`; `js/blog-data.js:6,25,39,53,65,77,89`). Markdown
produces `<p>…</p><p>…</p>`. Skin CSS targets `.about-text` and `.fc-card-desc` as
single blocks. Options: (a) keep literal `<br>` in the YAML (Markdown allows raw HTML,
but it is ugly in a file the owner reads); (b) accept `<p>` and re-verify all 16 skins;
(c) escape hatch: split into an array of paragraphs and render `<br><br>` between them.
Owner should not have to care, but the spec must pick one before parity screenshots.

**O2 — the `.calendly-link` class inside prose.**
`index.html:275` is an `<a href="#" class="text-link calendly-link">schedule a call</a>`
whose behavior comes from a JS handler keyed on the class (`js/nav-config.js:135-140`).
Markdown emits `<a href="#">`. Either the renderer post-processes, or the contact
paragraph is split into three fields around the link, or the link becomes a component slot.

**O3 — `<person>` for `/embedded-swift-agent/`.**
Intent §4.8 groups subsites by person (`/subsites/elise/12years/`). The embedded Swift
agent is not a page *for* a person: it is the owner's own live project demo, linked from
the projects carousel (`js/blog-data.js:29`) and from a post body
(`blog/posts/embedded-swift-agent.md:201`), and it is in the sitemap (`sitemap.xml:64`).
`/subsites/dawson/embedded-swift-agent/` is grammatical but odd. **Owner call:** is it a
subsite at all, or a project page (`/projects/embedded-swift-agent/`) that keeps
`/embedded-swift-agent/` as the canonical? A demo the owner links publicly probably wants
a stable, short URL.

**O4 — is `docs/` published?**
`docs/planned-posts/*.md` (three unpublished drafts) and `docs/TODO.md` are live URLs
today, as is `CLAUDE.md`. Nothing links them, but they are crawlable. Under Astro the
owner can keep them out of `dist/` for free. Decide: publish, exclude, or exclude only
`planned-posts/`.

**O5 — do subsites' strings enter the prose file?**
Intent §3.1 says every visitor-facing string is prose; §4.8 says subsites are copied
through `public/`. `12years/` alone holds ~30 strings / ~450 words the owner wrote by
hand. Copying them means they escape the prose rule; migrating them means editing a
3,424-line self-contained page. Recommend: explicit exemption for `public/subsites/`,
written into the `CLAUDE.md` rule so it is a decision and not an oversight.

**O6 — `color-randomizer` in the sitemap.**
Confirmed a live 404. Fix by removing the entry, or by publishing
`docs/planned-posts/color-randomizer.md` (title `Shuffling Colors`) — which would need
an owner-approved excerpt and tags.

**O7 — `gemma4-heretic-ara` is published but unlisted.**
Uncomment `js/blog-data.js:122-129`, or leave it unlisted and drop it from the sitemap.
As-is, the prerendered `/blog/gemma4-heretic-ara/` will have no excerpt for OG tags.

**O8 — `autoencoders-1` / `-2` duplicate an external canonical.**
Prerendering will publish two full local copies of posts the site links off-site to
aboutobjects.com. Either point the prerendered pages at the external canonical, or drop
the local files, or start linking the local copies.

**O9 — `helm` and `metr-doubling` metadata conflicts.**
Which title and which date is right? The YAML makes this a single field, so the owner
picks once. (`helm`: "A Minimalist Workspace Switcher for your IDE" vs
"A Workspace Switcher for VS Code and Cursor"; `April` vs `March 2026`.
`metr-doubling`: `January` vs `February 2026`.)

**O10 — the privacy "Updated January 10, 2026" pill.**
Hardcoded at `privacy/index.html:35`. Prose field, or build-generated from git?

**O11 — theme picker on utility pages.**
`/privacy/`, `/404.html`, `/lexchat/` currently cannot show the picker
(`js/theme-cycler.js:558-559`). Intent §4.7 says it must be reachable in every theme.
Adding it is a *visible change from today* on three pages, so it needs the owner's
explicit OK before the parity harness flags it as a diff.

**O12 — sequence duplication in the home masthead.**
Sequences 5-8 (`js/script.js:158-185`) are two exact duplicate pairs, weighting
"builder." to 4/9 of page loads. Intentional weighting or copy-paste? Deduping changes
the odds and the parity screenshots.

**O13 — scheme names shown as raw identifiers.**
`monochromatic`/`analogous`/`complementary`/`triadic`/`tetradic`/`random` render
lowercase from the id array (`js/theme-cycler.js:62,488`). Promote to `xs` prose
(and capitalize), or keep as-is for parity?

**O14 — post dates are free-text month-year strings.**
`"August 2026"`, `"Spring 2024 – Present"` etc. are parsed by
`new Date(dateStr + ' 1')` for JSON-LD (`blog/blog-post.js:50-53`) and rendered verbatim
elsewhere. A zod schema wanting ISO dates changes what the visitor reads. Recommend:
store ISO, add a formatted display field, or keep the strings and validate loosely.

**O15 — the chart workflow's orphaned consumer.**
`refresh-chart-data.yml` runs weekly for `ai-job-market.md`, which is not published.
Publish the post, pause the cron, or leave it. Either way the paths need updating for
whatever layout Astro lands on, and the workflow needs an explicit `workflow_dispatch`
of the deploy workflow (intent §4.10).

**O16 — `embedded-swift-agent-context.md` is public prose.**
`embedded-swift-agent/embedded-swift-agent-context.md` is tracked, publicly readable at
`/embedded-swift-agent/embedded-swift-agent-context.md`, and contains a bio and project
summaries about the owner that the agent reads aloud to visitors. It is visitor-facing
prose by intent §3.1's own test, but it lives outside every list of prose sources.
