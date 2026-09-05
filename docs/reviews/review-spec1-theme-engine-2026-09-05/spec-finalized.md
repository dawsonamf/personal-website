# Spec 1: Astro migration, prose file, theme engine, parity harness, deploy

**Status:** final draft, awaiting owner approval (intent §8: "each spec goes through the owner").
**Written:** 2026-09-05 from `intent.md` §8.1 and the seven research files in `research/`.
**Finalized:** 2026-09-05. Every claim about the current codebase was re-checked against `main` @
`0f196d0` (file:line), every version and API against the npm registry, GitHub docs and the Astro 7 /
Playwright 1.61 docs on that date. What could not be verified is marked "verified in T0/T1/T7" with a
stated fallback. Research errors found on the way are listed in §17.
**Baseline:** `main` @ `0f196d0`. The parity harness compares against this commit.
**Scope:** everything in intent §8.1. Nothing from specs 2-6 (the five structural themes) is built
here; §11 desk-checks the engine against their demands so they do not force a redesign.

How to read this: §2 lists every decision this spec makes on the owner's behalf (intent §5 says to
state them). §12 is the ticket breakdown. §13 is the batch of questions only the owner can answer,
each with the default the spec assumes until answered. §15 is the list of deliberate visible
changes, which is what the parity harness allow-lists.

---

## 1. Outcome

When this spec is done:

1. `www.dawsonamf.com` is built by Astro 7 and deployed by GitHub Actions on every push to `main`.
   Old URLs redirect. Blog posts are static pages at `/blog/<id>/` with real `<title>`, description,
   canonical and JSON-LD in the served HTML.
2. Every visitor-facing string lives in `src/content/prose.yaml`, sized, schema-validated. A draft
   anywhere in that file fails the production build. A size a component asks for but nobody wrote
   fails the build with the list of what is missing.
3. The theme engine is a typed registry with two kinds (`skin`, `structural`). The default theme and
   the 15 active skins (16 themes) are prerendered under `/`, `/<skin>/`, `/<skin>/blog/`,
   `/<skin>/blog/<id>/`, `/<skin>/privacy/`, `/<skin>/lexchat/`. The `structural` kind is fully
   designed (§5.3, §11) and its fallback path exists and is tested, but it has no consumer yet.
4. The parity harness proves the 16 themes are unchanged to the eye on every page type at 1440 and
   390, settled and after each scripted interaction in §9, and the owner has signed off the manual
   QA list. Only the changes in §15 differ.

Non-goals (intent §1, §7): no visual redesign, no case studies, no posts leaving Markdown, no library
cleanup beyond what the migration forces (gsap 3.9.1 stays loaded, Boxicons stays, jQuery stays), no
build-time syntax highlighting via Astro's pipeline, no `<Image />`.

---

## 2. Decisions made by this spec (intent §5: say what you chose)

| # | Decision | Why (one line; details in the section cited) |
|---|---|---|
| D1 | **Astro 7.3.1**, exact pin. Node **24 LTS** via `.nvmrc`, npm, committed `package-lock.json`. | Astro's install docs support only even Node lines and its `engines` field (`node >=22.12.0`, no upper bound) would not warn on 25; Node 25 reached end-of-life on 2026-06-01 and Node 24 is Active LTS until 2026-10-20 (nodejs release schedule). |
| D2 | `compressHTML: false`, `prerenderConflictBehavior: 'error'`, `build.inlineStylesheets: 'never'`, `trailingSlash: 'always'`, `build.format: 'directory'`, `site: 'https://www.dawsonamf.com'`, no `base`. | Astro 7 defaults `compressHTML` to `'jsx'` (whitespace between elements stripped), which breaks DOM parity; `false` keeps every byte (`true` is a third, HTML-aware mode). `prerenderConflictBehavior` defaults to `'warn'`; `'error'` catches a theme id colliding with a page name. The rest matches GitHub Pages and today's URL shape (§3.2). |
| D3 | **Structure is rewritten; the behavior runtime is kept.** HTML becomes Astro components fed by the prose file and the registry. The existing behavior scripts (typing engine, intro reveals, carousel, jobs panel, cursor, palette toy) stay classic scripts served from `public/js/`, edited only where the render/behavior split and the prose feed require (§8). | Intent §4.13 allows refactoring behavior "where the output provably does not change" but does not require it; sync/defer load order is load-bearing today (§8). Modularising them is intent §7's cleanup pass. |
| D4 | **Theme application moves to build time.** `theme-bootstrap.js` is retired. Each `/<theme>/…` page is emitted with `data-style`, flags, inline tokens, the colour ramp and the theme `<link>`s already in place. `ThemeRuntime.astro` (one `is:inline` script) defines the same seven globals the bootstrap defines today plus the page path, and the `?style=` shim. The 404 page is the one exception (D27). | The theme is in the path (intent §4.5), so nothing needs resolving at runtime. Removes a blocking script and the runtime `<link>` appends (§5.4). The palette toy keeps restoring after load as it does today (`theme-cycler.js:126-147`); there is no pre-paint override today and none is added. |
| D5 | **Libraries: npm is the source of truth; files are served verbatim.** A 20-line `scripts/vendor.mjs` copies the exact npm artifacts into `public/vendor/` (gitignored) on `prebuild`/`predev` and asserts their sha256 (§8). Bundling them as ES modules is intent §7. **Exceptions:** mermaid, Plotly and the post-side js-yaml stay on their pinned CDN URLs (mermaid's npm package is 76.3 MB for one 3.3 MB UMD file nothing bundles; Plotly 2.27.0 rides on two posts' frontmatter, js-yaml 4.2.0 on one); Boxicons is a committed copy under `public/vendor-static/boxicons/` (its npm package declares six runtime deps including React 16 and react-router). | jquery, gsap, vanilla-tilt, `github-dark.min.css` and Font Awesome's `all.min.css` are byte-identical to the CDN copies by sha256; `jquery-ui-dist` differs by one escape byte (semantically identical); aos and Boxicons are already served from npm CDN paths today (`research/library-migration.md` §1, §3). Per-theme isolation (intent §3.3) comes from which layout emits which tags, not from Vite chunking. |
| D6 | **Posts render at build with marked 18.0.5 + the three existing renderer overrides + highlight.js `lib/common`**, not with Astro's Markdown pipeline. Mermaid stays client-rendered and lazy. | The marked output is what every skin sheet targets (§7). Astro 7's pipeline is Sätteri (`@astrojs/markdown-satteri`); its markup has not been compared to marked's and its fenced-code shape under `syntaxHighlight: false` is unverified (`research/astro-capabilities.md` §2.4, §3.5). Reproducing it would be risk without upside. |
| D7 | **Prose file shape:** every prose field is a size map (`{ xs, s, m, l }`); data fields (urls, ids, dates, colours) are plain scalars; lists of labels (tech chips, tags) are plain string lists declared `xs` by the schema. One YAML document loaded as **one** content-collection entry via `file()` + `parser`, so one zod tree validates it and one `superRefine` lists every draft at once. | `research/astro-capabilities.md` §2.2: per-section entries would surface only the first failing section per build. |
| D8 | **Post metadata (title, date, excerpt, tags, external url) moves into `prose.yaml`**; post frontmatter keeps only `scripts`/`styles`. The build asserts a 1:1 match between `src/content/posts/*.md` and `prose.posts`. | "All prose in one file" (intent §3.1). Also removes the two sources that already disagree (§13 Q1) and the hand-rolled frontmatter parser (`blog-post.js:32-48`, a line splitter that survives `helm`'s colon only because it splits on the first one). |
| D9 | **Draft rendering:** the accessor always marks drafts (`get`: `<span class="prose-draft" data-prose="path.size">` for `xs`/`s`, `<div …>` for `m`/`l`; `text`: a `[DRAFT] ` prefix, since attributes and `<title>` cannot carry markup). Production output contains none because the gate (D10) refuses drafts. `DraftPill.astro` is rendered by the Shell only when `PROSE_DRAFTS=allow` (set by `npm run dev` and `npm run build:preview`): a fixed pill with the page's draft count (counted in the DOM at runtime) and a toggle that stores `localStorage['prose-drafts']='native'` and sets `<html data-prose-native>`, which the pill's own CSS uses to drop the red marking; persists across pages. | Intent §4.4. One env var, read with `process.env` everywhere; config files cannot read `import.meta.env`, so `--mode` is not used. |
| D10 | **Two gates.** Drafts: a `superRefine` on the single prose entry adds one issue per draft path unless `PROSE_DRAFTS=allow`; Astro's content validation error prints every issue and fails the build (documented path, `research/astro-capabilities.md` §2.2). Unwritten sizes: the accessor records every `(path, size)` a component requests that is neither written nor `null` on `globalThis.__proseUnwritten`; the prose integration's `astro:build:done` hook prints the full list and throws; if T0 shows a thrown hook error does not make `astro build` exit non-zero, the hook logs and calls `process.exit(1)` instead (guaranteed). Word budgets (intent §4.2) are documented, not linted. | Lists "exactly what is unwritten" (intent §4.2). `astro:build:done` receives `{ pages, dir, assets, logger }` in Astro 7. |
| D11 | **Theme switch keeps the current page** (`/blog/x/` → `/brutalist/blog/x/`). Today every switch lands on `/` (`theme-cycler.js:276`). Palette-toy state persists for the session and survives reload (today a reload wipes it and the theme: `theme-bootstrap.js:675-678`, `theme-cycler.js:126-133`). | Consistent with "reload keeps the theme" (intent §4.5). Listed in §15. |
| D12 | **Picker floating fallback (FAB) is new code.** Today privacy, 404 and lexchat load the cycler and get no picker (`theme-cycler.js:558-559` returns when no `.tc-nav-item` exists); the `.tc-toggle` FAB described in `docs/theme-explorations.html` never existed, though dead `.tc-toggle` rules survive in 16 skin sheets and `theme-base.css:81`. Built in T6, visual approval by the owner (§13 Q4). | Intent §4.7 requires the picker reachable everywhere. |
| D13 | **Skins get their full sheet on every page type** (that is what a skin is; grid, banknote, gallery and neo-pop style `.privacy-*`/`.nf-*` today). "Tokens only" applies to structural themes' unowned page types and to utility pages under structural themes. | Parity for skins; intent §4.7 for structural. |
| D14 | **CSS `content:` prose.** marquee's sheet reads `content: var(--ticker-run, "<literal>")` (`marquee.css:572`); `--ticker-run` is data (deduped project tech), set at runtime by `featured-carousel.js:413` on pages with the carousel, unchanged. The fallback literal, which renders on post/privacy/404/lexchat under marquee, moves to `prose.themes.marquee.ticker` (the unit string; the build repeats it 12 times, byte-equal to today's literal). doodle's `content: 'currently here \2713'` (`doodle.css:535`) moves to `themes.doodle.currentlyHere`. Both reach CSS as `--prose-<key>` custom properties on `<html>` under that theme; the sheets become `var(--ticker-run, var(--prose-ticker))` and `var(--prose-currently-here)`. Counters and glyphs (`FIG.`, `№`, `✷`, `■`, `·`, `/`, `(01)`) stay in CSS as decoration (§13 Q6). | Intent §3.1; these are the only two `content:` literals made of words (`research/prose-and-url-inventory.md` §2.9, whose claim that `--ticker-run` is never assigned is wrong, see §17). |
| D15 | **`<br><br>` paragraph separators** (about body, skills body 3, seven of the eight project descriptions; `deep-rl` is one paragraph) are stored as normal Markdown paragraphs; the canonical components render them with `paragraphs: 'br'`, which joins rendered paragraphs with `<br><br>` inside one element. Structural themes use `'p'` (default). | Readable YAML, identical DOM for skins. |
| D16 | **Calendly link inside prose** (new behavior, not parity): the renderer turns a Markdown link to `#calendly` into `<a href="#" class="text-link calendly-link">`; http(s) links get `class="text-link" target="_blank" rel="noopener noreferrer"`, every other link `class="text-link"` (the two branches `blog-post.js:4-14` has today). No existing post links to `#calendly`; the only `calendly-link` today is hand-written HTML (`index.html:275`). | Markdown cannot emit the class; the contact paragraph must become prose. |
| D17 | **Section numbers** (`<span class="sec-num">01.</span>` … `05.` on home, `01.`/`02.` on the listing) are generated from section order per page; only the label is prose. Job titles are `role` + `company` (+ url); the hero subtitle is the three skill-group names joined by the component with `&nbsp;|&nbsp;` (`index.html:79`). | Themes reorder sections; presentation quirks belong in components, not prose. |
| D18 | **Repo layout:** `src/` (components, prose, registry, pages), `public/` keeps today's URL paths for everything static (`/css/*`, `/js/*`, `/resources/*`, `/blog/posts/assets/*`, `/blog/*.css`, `/privacy/privacy-styles.css`, `/lexchat/lexchat-styles.css`) so the DOM diff needs no path normalisation for them. New: `/vendor/*`, `/vendor-static/*`. `CNAME` and `.nojekyll` stay at the repo root (needed only for a legacy-mode rollback) and are **not** put in `public/`. | GitHub docs: a custom Actions workflow ignores any `CNAME`; `upload-pages-artifact@v5` excludes every dotfile unless `include-hidden-files: true` (`research/deploy-and-parity-harness.md` §1.2-1.3, re-verified against the action's `action.yml`). |
| D19 | **Posts move to `src/content/posts/`**; ids stay the filenames. Post-body links are rewritten once: `../../resources/` → `/resources/` (six posts), `post.html?id=x` → `/blog/x/` (autoencoders-1 ↔ 2). Frontmatter `scripts`/`styles` (three posts) and the chart scripts' fetch URLs become root-absolute (`/blog/posts/assets/…`). | Prerendering at `/blog/<id>/` changes the depth; page-relative URLs 404 (`research/library-migration.md` R1). |
| D20 | **Harness:** Playwright `@playwright/test@1.61.1` (pins Chromium and headless shell build 1228, both already in `~/Library/Caches/ms-playwright`, so no browser download), both sites served by `python3 -m http.server --bind 127.0.0.1` (old worktree :8781, `dist/` :8782), baselines generated from OLD then compared against NEW, DOM dump equality + screenshot diff + computed-token sample. | §9. Same server on both sides removes a class of false diffs. |
| D21 | **Deploy:** generic `actions/checkout@v7` → `setup-node@v7` → `npm ci` → `astro build` → `upload-pages-artifact@v5` → `deploy-pages@v5` (latest majors on 2026-09-05: v7.0.1, v7.0.0, v5.0.0, v5.0.1), with a `workflow_dispatch` `deploy: false` dry run. `withastro/action` not used. `refresh-chart-data.yml` gains `permissions: actions: write` + `gh workflow run deploy.yml`. | §10; `research/deploy-and-parity-harness.md` §2.2-2.6. GitHub docs: pushes made with `GITHUB_TOKEN` never trigger `push` workflows, `workflow_dispatch` is the documented exception. |
| D22 | **`docs/` stops being served.** Today legacy Pages serves the whole repo, including three unpublished post drafts (`docs/planned-posts/`) and `CLAUDE.md`. Nothing links there. (§13 Q8 to confirm.) | Free under Astro; a leak today. |
| D23 | **`docs/theme-explorations.html` is frozen** with a banner comment pointing here; the engine's authoring docs move to `src/themes/README.md`, and `CLAUDE.md` is rewritten for the new layout plus the prose rule. | Intent §9 left this open; the file has six stale claims and eleven omissions (`research/theme-engine-contracts.md` §9), several load-bearing for the harness. |
| D24 | **Sitemap** is generated: default-theme pages only (themed prefixes and 404 filtered), posts carry `lastmod` from their date, other pages carry none. `color-randomizer` (a live 404 today) is dropped. | Intent §4.6. Three of today's hand-written `lastmod` values disagree with the post dates. |
| D25 | **Mobile structure for structural themes** (intent §9): CSS-first reflow; a theme that truly needs a different mobile DOM renders both subtrees toggled by media query and accepts the duplication. Must be resize-stable: no boot-time JS breakpoint flag. The theme's CSS owns its breakpoint; the engine adds nothing and the registry has no breakpoint field. | Both prototypes read the breakpoint once and break on rotation (`research/structural-theme-demands.md` §1.20). |
| D26 | **Theme-internal colour modes** (mono): separate state from the palette toy; sessionStorage key `theme.<id>.mode`; `ThemeRuntime` gains, in the mono spec, a pre-paint block that reads it and stamps `data-mode` plus the mode's custom properties; mode switches dispatch `dawson:palette`; palette toy hidden on themes that declare `modes`. Designed here (§5.1, §5.4), built in the mono spec. | `research/structural-theme-demands.md` §1.7-1.9, §3.10-3.11, §4.5-4.7, §4.11. |
| D27 | **The 404 page resolves its theme at runtime.** GitHub Pages serves one `/404.html` for every missing URL, so `/brutalist/nope/` cannot be prerendered per theme. `404.astro` is built in the default theme; a small bundled script reads the first path segment, else `?style=`, and if either names a theme applies it from `window.__THEME_REGISTRY` through `src/themes/apply.ts` (attributes, tokens, ramp, the three link appends in the bootstrap's order). The only page that applies a theme at runtime; the brief default flash is accepted (§15). | Intent §4.7-4.8 want the 404 themed under every theme path; this is the only mechanism a static host allows. |
| D28 | **Registry slimmed to what the engine reads.** No `ORDER` (array order is picker order), no `owns` (the keys of `layouts`), no `storageNamespace` (keys are `theme.<id>.*` by rule), no `breakpoint` (D25), no `root` CSS (a theme's root rules live in its own layouts, which fallback pages never import). `layouts` values are lazy imports, so the registry never statically imports a layout. | Every dropped field was derivable or unused by the engine; the lazy import keeps the module graph acyclic (§3.3). |
| D29 | **One page shell.** `Shell.astro` is the only component that emits `<html>` (attributes, ramp, tokens, `--prose-*`), the tail of `<head>` (`ThemeRuntime`, then `ThemeAssets` last, where today's runtime-appended links land) and the tail of `<body>` (dock, scrim, cycler script, FAB when due, draft pill when due). The prose integration's build-done scan asserts every emitted page has exactly one `#tc-dock`, one `#tc-scrim`, one `__THEME_REGISTRY` and at least one `.tc-nav-item`. | One place for every engine-owned element; enforcement is a scan, not a README rule. |
| D30 | **Picker trigger contract:** any `.tc-nav-item` element is a trigger (the cycler's selector today). The canonical Nav renders the desktop and mobile `Theme` items as today, `PickerFab.astro` renders a fixed `.tc-nav-item.tc-fab`, structural themes render `<ThemePicker />` (trigger + prose label) anywhere in their chrome. The cycler never creates DOM; `injectDom()` becomes `wireDom()`. | Three mount styles, one code path. |
| D31 | **`href()` is the only way a component writes an internal link** (§6.1): throws on relative paths, prefixes exactly the engine's routes with `/<theme>`, passes everything else through. A grep test fails the build on `href="..` or `href="blog/` in `src/`. | Mechanical instead of "remember to prefix". |

---

## 3. Architecture

### 3.1 Layout

```
astro.config.mjs  package.json  package-lock.json  .nvmrc  tsconfig.json  playwright.config.ts
CNAME  .nojekyll                               # repo root: legacy-mode rollback only (D18)
src/
  content.config.ts                            # collections: prose (file + parser + zod tree), posts (glob)
  content/prose.yaml                           # THE prose file (§4)
  content/posts/*.md                           # moved from blog/posts/ (D19)
  prose/schema.ts  prose/index.ts  prose/markdown.ts     # zod tree; accessor; marked wrapper (§4.2)
  prose/drafts.ts  prose/integration.ts  prose/check.ts  # draft walker; hooks (§4.3); `npm run prose:check`
  themes/types.ts  themes/registry.ts  themes/paths.ts   # types; THEMES + assertions; themeParams(), href()
  themes/ramp.ts  themes/apply.ts  themes/README.md      # ramp (build + 404); runtime apply (404 only); docs
  layouts/Shell.astro  ThemeAssets.astro  ThemeRuntime.astro  compose.ts   # §5.2, §5.4
  layouts/canonical/                           # the default layout family (canonical DOM)
    Head.astro  Home.astro  BlogListing.astro  BlogPost.astro  Privacy.astro  NotFound.astro  LexChat.astro
    components/  Nav.astro Hero.astro About.astro Jobs.astro FeaturedCarousel.astro BlogRail.astro
                 BlogCards.astro Contact.astro Footer.astro ThemePicker.astro PickerFab.astro DraftPill.astro
  pages/
    [...theme]/index.astro   [...theme]/blog/index.astro   [...theme]/blog/[id].astro
    [...theme]/privacy/index.astro   [...theme]/lexchat/index.astro   404.astro
scripts/vendor.mjs                             # node_modules → public/vendor (D5)
harness/  parity.spec.ts  settle.ts  normalize.ts  urls.ts  sentinels.ts  __parity__/ (gitignored)
public/
  css/ (styles, mobile-styles, featured-carousel, theme-cycler, themes/*.css incl. the 4 inactive)
  js/  (anim-utils, typing-engine, featured-carousel, script, cursor-follow, nav-behavior,
        theme-cycler, blog-post-client, blog-listing-client)          # classic scripts (D3)
  vendor/ (gitignored, generated)   vendor-static/boxicons/ (committed, D5)
  blog/blog-styles.css  blog/blog-listing-styles.css  blog/post.html (shim)  blog/posts/assets/*
  privacy/privacy-styles.css  lexchat/lexchat-styles.css  resources/*  robots.txt
  subsites/elise/12years/   embedded-swift-agent/ (location per §13 Q3)
.github/workflows/deploy.yml  refresh-chart-data.yml
docs/prebake-cohort-data.py                     # OUT_DIR updated (T7)
```

### 3.2 `astro.config.mjs`

```js
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import prose from './src/prose/integration.ts';
import { THEME_IDS } from './src/themes/registry.ts';

export default defineConfig({
  site: 'https://www.dawsonamf.com',
  output: 'static',
  trailingSlash: 'always',
  compressHTML: false,                 // D2: parity
  prerenderConflictBehavior: 'error',  // D2: theme id vs page name collisions (default is 'warn')
  build: { format: 'directory', inlineStylesheets: 'never' },
  markdown: { syntaxHighlight: false },// posts do not go through Astro's pipeline (D6)
  redirects: {                         // static output: <meta http-equiv="refresh"> stubs, no status code
    '/12years/': '/subsites/elise/12years/',
    // '/embedded-swift-agent/': …      // only if §13 Q3 moves it
  },
  integrations: [prose(), sitemap({
    filter: (page) => !THEME_IDS.some((id) => new URL(page).pathname.startsWith(`/${id}/`))
                   && !/\/404(\.html|\/)$/.test(page),
    serialize: (item) => { /* lastmod for /blog/<id>/ from prose.posts[id].date */ return item; },
  })],
});
```

### 3.3 Build-time vs runtime boundary

Build time (TypeScript, typed): prose loading and validation, Markdown rendering, theme registry,
route generation, page composition, head emission, theme attributes and tokens, static markup for
everything that depends only on data (nav, cards, carousel, dock rows, JSON-LD, sitemap, redirects).

Runtime (classic scripts in `public/js/`, contracts documented in `src/themes/README.md`): intro
reveals, typing masthead, jobs panel, carousel behavior including the `--ticker-run` property, tilt,
cursor follower, AOS, sticky header, smooth scroll, Calendly popup, palette toy and dock open/close,
code copy buttons, mermaid, read time, blog filter, the 404's theme application (D27).

Runtime reads build-time data from the `ThemeRuntime` globals (§5.4), from `data-*` attributes on the
element a script owns (dock strings, read-time suffix, slide aria template, carousel tech chips), and
from one `<script type="application/json" id="masthead-sequences">` island on home and listing. No
runtime code parses the prose file.

Module graph (one direction, no cycles): `themes/types` ← `themes/registry` ← `themes/paths` ←
`layouts/canonical/*` ← `layouts/compose` ← `pages/*`. `prose/*` is a leaf imported by layouts and
components. `themes/ramp` and `themes/apply` have no imports from the rest of `src/` (the 404 client
script bundles them). Structural theme entries reference layouts only through `() => import(...)`.

---

## 4. Content model

### 4.1 `prose.yaml` shape

```yaml
# Every visitor-facing string on the site. Read src/themes/README.md before editing.
# A plain string is approved. { draft: "…" } is unapproved and blocks the production build.
# Sizes: xs ≤ ~3 words · s one line ≤ ~15 words · m ≤ ~60 words or ≤ 3 bullets · l = full.
# null at a size = "nothing fits here, omit the element". A missing size is only an error
# when some theme requests it; the build then lists exactly what is unwritten.

site:
  name: { xs: Dawson Metzger-Fleetwood }
  titleSuffix: { xs: Dawson Metzger-Fleetwood }       # "<title> | <suffix>" on every page
  email: dawsonamf@icloud.com                          # data, not prose
  footerCredit: { s: Designed and built by Dawson Metzger-Fleetwood }   # one string, desktop + mobile footers
meta:                                                  # per page type: title, description (m), og description (s)
  home: { title: { s: Dawson Metzger-Fleetwood }, description: { m: "…" }, ogDescription: { s: "…" } }
  blog: …   post: { description: { s: A blog post by Dawson Metzger-Fleetwood. } }   privacy: …   notFound: …   lexchat: …
nav:                                                   # labels only; which items appear where is structure (Nav.astro)
  about: { xs: About }  experience: { xs: Experience }  projects: { xs: Projects }  blog: { xs: Blog }
  contact: { xs: Contact }  resume: { xs: Resume }  email: { xs: Email }  theme: { xs: Theme }
  aria: { main: { xs: Main navigation }, quick: { xs: Quick links }, social: { xs: Social links } }
socials:                                               # order = render order; label doubles as aria-label
  - { id: linkedin, label: { xs: LinkedIn }, href: https://…, icon: fab fa-linkedin }
  - { id: x, label: { xs: X (Twitter) }, href: https://…, icon: fa-brands fa-x-twitter }
  - { id: messenger, label: { xs: Messenger }, href: https://…, icon: fab fa-facebook-messenger }
  - { id: email, label: { xs: Email }, href: mailto:dawsonamf@icloud.com, icon: bx bx-envelope }
  - { id: vcard, label: { xs: Contact card }, href: /resources/contact.vcf, icon: fas fa-user-circle }
  - { id: calendly, label: { xs: Schedule a call }, calendly: true, icon: far fa-calendar-alt }
home:
  sections: { about: { xs: About }, jobs: { xs: Where I've Worked }, projects: { xs: Selected Works }, blog: { xs: Blog }, contact: { xs: Contact } }
  heroAlt: { xs: Dawson Metzger-Fleetwood }
  about: { title: { xs: About Me }, body: { l: | … 4 Markdown paragraphs … } }
  skills:
    title: { xs: Skills }
    groups:                                            # names also form the hero subtitle (D17)
      - { id: web, name: { xs: Web }, body: { l: "…" } }
      - { id: ios, name: { xs: iOS and visionOS }, body: { l: "…" } }
      - { id: ml,  name: { xs: ML and RL }, body: { l: "…" } }
  contact: { body: { m: "… [email](mailto:…) … [schedule a call](#calendly)." }, mapAlt: { xs: Map } }
  seeAllPosts: { xs: See all posts }
jobs:                                                  # 4 entries today
  - id: about-objects
    company: { xs: About Objects }
    role: { xs: Software Engineer }
    url: https://www.aboutobjects.com/
    dates: { xs: July 2023 – Present }                 # verbatim, including the dash each entry uses today
    bullets: { l: [ "…", "…", "…", "…", "…", "…" ] }   # m: up to 3 bullets, written when a theme asks
projects:                                              # 8 entries today
  - id: silicon-fly
    title: { xs: Silicon Fly }
    description: { l: | … Markdown paragraphs … }
    image: /resources/Fly_Media.jpg
    accentColor: "#…"                                  # data
    tech: [ Metal, Swift, Compute Shaders, Connectomics, GPU ]     # xs list; also feeds --ticker-run
    ctas: [ { label: { xs: Read the post }, href: /blog/fly-on-my-laptop/ }, { label: { xs: View on GitHub }, href: https://…, external: true } ]
posts:                                                 # keyed by post id = src/content/posts/<id>.md (11 today)
  fly-on-my-laptop:
    title: { s: There is a fly on my laptop and it runs away }
    date: August 2026                                  # as displayed; ISO derived for JSON-LD and lastmod
    excerpt: { m: "…" }
    tags: [ Swift, Systems ]
  autoencoders-1: { title: …, date: January 2024, excerpt: …, tags: [ AI & ML ], external: https://www.aboutobjects.com/… }
post:                                                  # post-page chrome
  copyCode: { xs: Copy code }                          # aria-label on every copy button
  readTime: { xs: "{n} min read" }                     # template; the client substitutes {n}
carousel: { goToSlide: { xs: "Go to slide {n}" } }     # dot aria-label template
blog:
  intro: { l: | … 3 paragraphs … }
  sections: { works: { xs: Selected Works }, posts: { xs: All Posts } }
canonical:                                             # strings only the canonical layout uses
  masthead:
    home:    [ { steps: [ { type: "Hi,\nI'm Dawson,\nweb developer." }, { delete: 14 }, { type: "iOS developer." }, … ] }, … ]   # 9 sequences verbatim (script.js:129-192)
    listing: [ … 7 sequences … ]                                                                                       # blog-listing.js:37-88
picker:                                                # the theme picker's own UI strings (theme-cycler.js)
  ariaLabel: { xs: Theme controls }  styles: { xs: Styles }  palette: { xs: Palette }  advanced: { xs: Advanced }
  backToStyles: { xs: Back to styles }  shuffle: { xs: Shuffle colors }  shuffleSub: { xs: random palette }
  reset: { xs: Reset }  resetSub: { xs: back to default }  advancedSub: { xs: scheme & colors }  doneEditing: { xs: done editing }
  scheme: { xs: Scheme }  colors: { xs: Colors }  current: { xs: current }  preview: { xs: preview }
  roles: { text: { xs: Text }, background: { xs: Background }, primary: { xs: Primary }, secondary: { xs: Secondary }, accent: { xs: Accent } }
  lock: { xs: Lock }  unlock: { xs: Unlock }           # composed as "<Lock|Unlock> <Role>" (theme-cycler.js:462)
  schemes: { random: { xs: random }, monochromatic: { xs: monochromatic }, analogous: { xs: analogous }, complementary: { xs: complementary }, triadic: { xs: triadic }, tetradic: { xs: tetradic } }
themes:                                                # one entry per registry id; theme-specific strings live here
  default: { label: { xs: Default } }
  grid: { label: { xs: Swiss Grid } }
  chinoiserie: { label: { xs: Porcelain } }
  wheatpaste: { label: { xs: Street Poster } }
  marquee: { label: { xs: Marquee }, ticker: { xs: "✷ WEB ✷ iOS ✷ VISIONOS ✷ MACHINE LEARNING ✷ REINFORCEMENT LEARNING " } }   # unit; ×12 at build (D14)
  doodle: { label: { xs: Doodle }, currentlyHere: { xs: "currently here ✓" } }
privacy:
  title: { xs: Privacy Policy }  updated: { xs: Updated January 10, 2026 }  body: { l: | … 738 words of Markdown with ## / ### / lists … }
notFound: { code: { xs: "404" }, message: { s: This page doesn't exist, or it moved. }, back: { xs: Back to the home page } }
lexchat: { title: { xs: LexChat } }
```

Rules the schema enforces (all objects are `z.strictObject`, so a misspelt key fails):

1. A prose field is `Record<'xs'|'s'|'m'|'l', string | { draft: string } | null>` with at least one
   size and no other keys. `bullets` is the same with string arrays. Chip/tag lists are `string[]`
   (each `xs`). Template fields (`post.readTime`, `carousel.goToSlide`) must contain `{n}`.
2. `xs` strings contain no Markdown (`[`, `*`, `` ` ``); they are used raw in attributes.
3. `posts` keys must equal the set of `src/content/posts/*.md` ids (both directions; `readdirSync`
   at schema time).
4. `themes` keys must equal `THEME_IDS`; every entry has `label.xs`.
5. `canonical.masthead` sequences: a `delete` count must not exceed the characters typed so far
   (today they are hand-counted and silently break on edit).
6. Drafts: unless `PROSE_DRAFTS=allow`, every `{ draft }` anywhere is an issue; all are reported at
   once (D10).
7. The `file()` loader swallows YAML syntax errors into an empty collection
   (`research/astro-capabilities.md` §2.2, §3.11; confirmed in the loader source), so the prose
   integration's `astro:config:setup` hook parses the file itself and throws on a syntax error.
8. Strings are plain text in YAML (no HTML escaping): `AI & ML` is stored as written; the renderer
   escapes once, so the served HTML says `AI &amp; ML` and the DOM text stays `AI & ML`, as today.

What existing text becomes: everything live today enters as approved `l` (bodies, bullets, excerpts,
descriptions), `xs` (labels, chips, tags, theme labels, nav, picker strings) or `s` (footer credit,
titles, subtitles). No `m` or `s` variants are written in this spec; the first structural theme's
build will list what it needs and those arrive as drafts.

### 4.2 Accessor (`src/prose/index.ts`, build-time only)

```ts
import { prose } from '~/prose';                     // never imported by client code
prose.data                                            // the validated tree (zod-inferred type) for data fields: urls, ids, dates, tech, ctas
prose.get('home.about.body', 'l')                     // string: Markdown rendered to HTML (block for m/l, inline for xs/s)
prose.get('home.about.body', 'l', { paragraphs: 'br' })
prose.text('nav.about', 'xs')                         // string: plain text, HTML-escaped once (attributes, <title>, JSON-LD, split-text slots)
prose.list('jobs.0.bullets', 'l')                     // string[]: each rendered inline
prose.has('jobs.0.bullets', 'm')                      // boolean
```

Paths are dot paths into the tree; lists are addressed by index (components iterate `prose.data`
and pass the index). Behavior per `(path, size)`:

| State | `get` / `text` | `list` | `has` | Side effect |
|---|---|---|---|---|
| written string | rendered value (draft-marked per D9) | items | `true` | none |
| `null` | `''` (component omits the element) | `[]` | `false` | none |
| absent | `''` | `[]` | `false` | recorded as unwritten → build fails at the end (D10) |
| no such `path` | throws | throws | throws | build fails immediately (a typo is a bug, not a gap) |

Markdown rendering is marked 18.0.5 with `gfm: true, breaks: false` and the link rule from D16;
`text()` renders inline then strips tags. Output is injected with `set:html` on a `<Fragment>` so no
wrapper appears. The same `src/prose/markdown.ts` renders post bodies (§7).

### 4.3 Draft flow, standing rule, lint

`CLAUDE.md` gains: "Every new visitor-facing string enters `src/content/prose.yaml` as
`{ draft: … }`. Nothing ships until the owner clears it. Subsites under `public/subsites/` and
`public/embedded-swift-agent/` are exempt (they are verbatim copies)." npm scripts: `dev` =
`PROSE_DRAFTS=allow astro dev`, `build` = `astro build` (the gate), `build:preview` =
`PROSE_DRAFTS=allow astro build`, `prose:check` = `node src/prose/check.ts` (Node 24 strips types
natively), which runs the same walker (`src/prose/drafts.ts`) the schema uses, for anyone who wants
a pre-push hook (`.githooks/pre-push`, enabled by the owner with `git config core.hooksPath
.githooks`; optional).

---

## 5. Theme engine

### 5.1 Registry (`src/themes/registry.ts`, build-time only)

```ts
type PageType = 'home' | 'blog' | 'post';               // utility pages (privacy, 404, lexchat) are never owned
type Colors = { text: string; bg: string; primary: string; secondary: string; accent: string };
type RandomProfile = { light: Profile; dark: Profile };  // today's palette-toy shape, unchanged
type LazyLayout = () => Promise<{ default: AstroComponentFactory }>;   // () => import('./cream/Home.astro')
interface ThemeBase {
  id: string;                     // URL segment; RESERVED: blog, privacy, lexchat, subsites, embedded-swift-agent, 404, _astro, vendor, vendor-static, css, js, resources
  polarity: 'dark' | 'light';
  colors: Colors;
  tokens?: Record<`--${string}`, string>;   // 15 of 16 today (not default)
  fonts?: string[];                         // Google Fonts css2 URLs; 14 of 16 (not default, grid)
  random?: RandomProfile;                   // 3 of 16 (brutalist, marquee, studio); the toy uses its defaults otherwise
}
interface SkinTheme extends ThemeBase {
  kind: 'skin';
  css?: string;                             // '/css/themes/<id>.css'; every skin but default
  flags?: { tilt?: false; still?: true };   // 14 of 16 (not default, miami-deco)
  typing?: 'cursor' | 'letter' | 'word';    // 8 of 16
  typingDelete?: 'char' | 'word';           // marquee only
}
interface StructuralTheme extends ThemeBase {                       // designed here, no consumer yet (§11)
  kind: 'structural';
  layouts: Partial<Record<PageType, LazyLayout>>;                  // owned page types = the keys
  extraPages?: { path: string; layout: LazyLayout }[];             // e.g. { path: '/work/' } under /mono/
  picker: { mount: 'own' } | { mount: 'fab'; corner: 'br' | 'bl' | 'tr' | 'tl' };
  modes?: { default: string; ids: string[]; vars: Record<string, Record<`--${string}`, string>> };
}
export type Theme = SkinTheme | StructuralTheme;
export const THEMES: Theme[] = [ /* default, then the 15 skins in today's ORDER (theme-bootstrap.js:637) */ ];
export const THEME_IDS = THEMES.map((t) => t.id);                 // array order = picker order
```

`label` is not in the registry: it is `prose.themes.<id>.label.xs`. The four inactive sheets (`space`,
`vapor`, `wanted`, `constructivist`) stay on disk under `public/css/themes/` with no registry entry, as
today. The module asserts at import (throw): `THEMES[0]` is `default`, kind `skin`, without `css`,
`flags`, `tokens` or `fonts`; ids unique; no id in `RESERVED`; every skin `css` file exists under
`public/css/themes/`; every structural theme has at least one layout. The prose ↔ registry
cross-checks live in the schema (§4.1 rule 4). Client code never imports this module; it reads the
runtime blob (§5.4).

### 5.2 Page composition (`src/layouts/compose.ts`)

```
layoutFor(theme, pageType) → AstroComponentFactory
  skin                                   → canonical[pageType]       + ThemeAssets: fonts, theme-base.css, skin css (nothing for default)
  structural, pageType in theme.layouts  → await theme.layouts[pageType]()   + ThemeAssets: fonts only
  structural, otherwise (fallback)       → canonical[pageType]       + ThemeAssets: fonts, theme-base.css (no skin css, no theme scripts)
utility page types (privacy, 404, lexchat) → always canonical; assets as the skin or fallback line above
```

Each page file is five lines: `getStaticPaths` from `themeParams()` (× post ids for `[id].astro`),
`layoutFor`, `<Layout theme page />`. Every layout renders through `Shell.astro` (§5.4), which adds
the picker mount: the canonical Nav renders the `Theme` items and the Shell renders the dock; utility
layouts get `PickerFab.astro`; structural themes place `<ThemePicker />` in their own chrome or
declare `picker.mount: 'fab'` with a corner (D30).

### 5.3 Structural-kind contract (built by the first consumer, cream)

The types above are the contract. Spec 1 ships: the discriminated type, `layoutFor`, the fallback
path exercised by a build-time test with a stub structural entry (registered only under test, never
in `THEMES`), the reserved-id assertion, `href()`, the `.tc-nav-item` trigger contract, the Shell's
end-of-body mount (dock, scrim, FAB, draft pill, all `position: fixed` and restylable by a theme's
CSS), and the storage-key rule (`theme.<id>.*`). Spec 1 does **not** ship: any structural layout,
modes UI, preloader, smooth-scroll wrappers, extra pages. §11 maps each demand to where it lands.

### 5.4 Shell, theme assets, runtime blob

`Shell.astro` (props `theme`, `page`, `canonical`, `pageType`) emits:

- `<html lang="en" data-style data-still data-no-tilt style="…">`: attributes only for non-default
  themes, exactly as `theme-bootstrap.js:703-706`; the inline `style` carries the tokens then the
  100-property colour ramp (`STEPS` has 19 steps × 5 roles + 5 base, `hsla()` with `toFixed(0)`,
  `theme-bootstrap.js:764-774`, ported to `src/themes/ramp.ts`; the default theme gets the ramp and
  nothing else, as today) then the `--prose-*` properties from D14 under marquee/doodle.
- `<head>`: the layout's `head` slot, then `<ThemeRuntime />`, then `<ThemeAssets />` **last**. Today
  the bootstrap appends its `<link>`s to the end of `<head>` at runtime (`theme-bootstrap.js:715-721`),
  so last is the parity position on every page type; it also keeps the skin sheet after
  `github-dark.min.css` on posts, which the cascade relies on.
- `<body>`: the layout's content, then `#tc-dock` + `#tc-scrim` (the markup `injectDom()` builds
  today, strings from prose as `data-*` attributes), `<script defer src="/js/theme-cycler.js">`,
  `<PickerFab />` when the theme mounts nothing, `<DraftPill />` (its CSS and JS `is:inline`, so
  even preview builds inject nothing) when `PROSE_DRAFTS=allow`.

`ThemeAssets.astro` emits, in the bootstrap's order, the theme's font `<link>`s,
`/css/themes/theme-base.css`, then the skin sheet, each with `data-style-asset="1"`; the composition
line (§5.2) decides which of the three apply; nothing for `default`.

`ThemeRuntime.astro` is one `<script is:inline>` (pre-paint, ~7 KB) defining the seven globals the
bootstrap defines today, so the behavior scripts and the cycler read the same names:

```js
window.__THEME_CYCLER_ENABLED = true;
window.__THEME_REGISTRY = { /* id → { id, kind, label, polarity, colors, tokens, css, fonts, flags, typing, typingDelete, random } */ };
window.__THEME_ORDER = [ /* THEME_IDS */ ];
window.__ACTIVE_STYLE = 'brutalist';
window.__PAGE_PATH = '/blog/';                    // new: this page's theme-less route ('/' on theme-only pages)
window.__styleAllowsTilt = function () { … };     // bodies copied verbatim from theme-bootstrap.js:646-669
window.__styleTypingMode = function () { … };
window.__styleTypingDeleteMode = function () { … };
// ?style= shim: default-theme pages only, never on 404 (D27)
var q = new URLSearchParams(location.search).get('style');
if (q && q !== 'default' && __THEME_ORDER.indexOf(q) > -1) location.replace('/' + q + location.pathname + location.hash);
```

`label` comes from prose at build. The 404 page adds a bundled `<script>` (D27):
`id = [location.pathname.split('/')[1], q].find(x => __THEME_ORDER.includes(x))`; if `id` and not
`default`, `applyTheme(__THEME_REGISTRY[id])` from `src/themes/apply.ts` stamps the attributes, sets
tokens and ramp (same `ramp.ts`), and appends the links in the bootstrap's order.

### 5.5 Picker behavior changes (`public/js/theme-cycler.js`)

Kept: dock geometry constants (`MEASURE 940`, `EDGE 10`, 300 ms hover-close, 440 ms hide),
`void dock.offsetWidth` (rAF is throttled under automation), the `(hover: hover) and (pointer: fine)`
hover-open gate, Space-to-shuffle, palette generation, derived neutrals, `dawson:palette` (still no
`detail`), `loadAllFonts` after idle (§13 Q5), session restore from `dawson-theme-cycler`. Changed:
`injectDom()` → `wireDom()` (queries `#tc-dock`/`#tc-scrim`, never creates them); `switchStyle(id)`
navigates to `(id === 'default' ? '' : '/' + id) + __PAGE_PATH` and the server-rendered preset rows
carry the same `href` (computed by `href()` at build); `resetToDefault()` keeps its shape (clear toy
state, then `switchStyle('default')`); all UI strings come from `data-*` attributes on the rendered
dock (prose), including the `Lock/Unlock <Role>` composition; `isReload()` and the reload wipe are
deleted (Q12). The dock's class names and nesting (`.tc-dock .tc-mega .tc-presets .tc-action
.tc-schemes .tc-role .tc-sw`) are part of the parity surface and do not change. The stale "all 20
skins" comment (`:509`) goes.

---

## 6. Pages, routing, URLs

### 6.1 Routes

`src/pages/[...theme]/…` with `themeParams()` returning `{ theme: undefined }` (the documented way to
match the root with a rest parameter) plus one entry per non-default id. Page count: 16 themes ×
(home, listing, 11 posts, privacy, lexchat) = 240, plus `404.html`. No page files exist outside
`[...theme]/` except `404.astro`.

`href(path, theme?)` (`src/themes/paths.ts`, D31):

1. `path` starting with a scheme (`https:`, `mailto:`) or `//` → returned unchanged.
2. `path` starting with `#` → unchanged (same page, same theme).
3. Anything else must start with `/`; otherwise `href` throws (relative paths are banned in `src/`).
4. If `theme` is unset or `default` → unchanged.
5. If the route part (before `#`/`?`) is one of the engine's routes for that theme (`/`, `/blog/`,
   `/blog/<known id>/`, `/privacy/`, `/lexchat/`, the theme's `extraPages` paths) → `'/' + theme + path`.
6. Otherwise (`/resources/…`, `/subsites/…`, `/embedded-swift-agent/`, `/vendor/…`, `/blog/posts/assets/…`) → unchanged.

Themed pages carry `<link rel="canonical" href="<default url>">` and `<meta name="robots"
content="noindex">`; default pages carry canonical to themselves (home and listing already do; posts
gain one, §15).

### 6.2 Head order (parity)

`Head.astro` writes today's tags by hand, per page type, in today's order. Home (`index.html:1-27`):
charset, viewport, title, description, canonical, two favicons, five OG/Twitter tags, third-party CSS
(`/vendor/fontawesome/css/all.min.css`, `/vendor-static/boxicons/css/boxicons.min.css`,
`/vendor/aos/aos.css`, Calendly css), `/css/styles.css`, `/css/mobile-styles.css`,
`/css/featured-carousel.css`, `/css/theme-cycler.css`; then the page's script tags with today's
sync/defer/async attributes (§8). Listing: the same with `/blog/blog-listing-styles.css` before
`theme-cycler.css`. Post: no canonical, no OG, no Calendly css, no AOS today; `github-dark.min.css`
from `/vendor/`, marked is gone (rendered at build), the mermaid `initialize` block stays `is:inline`.
The Shell then appends `ThemeRuntime` and `ThemeAssets` (§5.4). No component `<style>` and no
frontmatter CSS imports anywhere in the canonical family: Astro's injection position is
undocumented, so the family gives it nothing to inject (T0 confirms an empty injection).

### 6.3 Utility pages

`privacy`, `404`, `lexchat` become Astro pages on the canonical utility layout (logo header, content,
footer, no nav, as today) plus `PickerFab.astro` (D12). `404.astro` uses root-absolute paths, renders
the default theme at build, keeps its `.nf-*` rules in an inline `<style>` as today, and applies a
theme at runtime per D27. `lexchat` keeps the full-viewport iframe (`https://dawsonamf-lexchat.hf.space`).

### 6.4 Redirects and shims

| Old | New | Mechanism |
|---|---|---|
| `/?style=<id>` (any default page) | `/<id>/<same page>` | inline script in `ThemeRuntime` (§5.4); `?style=default` → same page |
| `/<id>/<missing>` and `/404.html?style=<id>` | themed 404 | runtime apply on `404.html` (D27) |
| `/blog/post.html?id=<id>` | `/blog/<id>/` | `public/blog/post.html`: inline `location.replace`, meta-refresh fallback to `/blog/`, canonical `/blog/` |
| `/12years/` | `/subsites/elise/12years/` | `redirects` config: static output emits a `<meta http-equiv="refresh">` stub (no status code possible) |
| `/embedded-swift-agent/` | per §13 Q3 | `redirects` config only if it moves |
| `/docs/*`, `/CLAUDE.md` | gone | none (D22) |

### 6.5 Subsites

`public/subsites/elise/12years/{index.html,then.jpeg,now.jpeg}` verbatim (page-relative image paths;
its gsap 3.12.5 + ScrollTrigger from cdnjs stay; ~395 words of the owner's prose).
`embedded-swift-agent/` (4 files: `index.html`, `agent.js`, `EmbeddedSwiftAgent.wasm`,
`embedded-swift-agent-context.md`; `agent.js:11-18` has a bare `+esm` import Vite must never see)
verbatim at the location decided in §13 Q3; it is linked from a project CTA, a post body and the
sitemap. Project CTAs in `prose.projects` point at the final URLs.

---

## 7. Blog

- Collection `posts`: `glob({ pattern: '*.md', base: './src/content/posts', generateId: filename
  without .md, retainBody: true })`, frontmatter schema `{ scripts?: string[]; styles?: string[] }`.
  Titles, dates, excerpts, tags come from `prose.posts[id]` (D8).
- Rendering (`src/prose/markdown.ts`, shared with prose fields): marked 18.0.5, `gfm: true`,
  `breaks: false`, renderer overrides copied from `blog/blog-post.js:4-30`: `link` (D16), `image` →
  `<img class="blog-image">`, `code` → `<div class="mermaid">` for `mermaid`, else
  `<pre><code class="hljs language-<lang>">` via `hljs.highlight` from `highlight.js/lib/common`
  (the exact 36-language set the cdnjs bundle ships, `research/library-migration.md` §3.7), else
  `highlightAuto` (no post hits it today; kept so a future untagged block renders as it would have).
  Raw HTML passes through.
- Page head: `<title>{title} | {suffix}</title>`, description = excerpt, canonical, OG
  title/description/url/image (site avatar; per-post images are intent §7), JSON-LD `BlogPosting`
  with the same fields `blog-post.js:56-88` builds today (headline, url, mainEntityOfPage, author,
  publisher, datePublished/dateModified from `new Date(date + ' 1')`, description, keywords),
  `github-dark.min.css` from `/vendor/`, per-post `styles` as `<link>`s.
- Body: `article.blog-post-container > header.blog-post-header > h1#post-title + div#post-meta`
  (pills: date, tags, `span#read-time`) + `div#post-content` with the rendered HTML, exactly today's
  DOM (`blog/post.html:87-93`, `research/page-behavior-and-blog-pipeline.md` §5.6). Per-post
  `scripts` are emitted as classic `<script src>` tags at the end of `<body>` in frontmatter order
  (today's loader chains them sequentially; `styles` were a plain `forEach`, and become `<link>`s).
- Client (`public/js/blog-post-client.js`, small): copy buttons (`.has-copy-btn` + the
  `button.code-copy-btn` markup verbatim, `aria-label` from `data-copy-label` on `#post-content`),
  `mermaid.run` after lazily injecting the pinned CDN mermaid **only when `.mermaid` exists** (today
  it loads and runs unconditionally), read time (`Math.max(1, Math.round(words/200))` from
  `innerText`, suffix from `data-read-time` on `#read-time`, kept client-side so the number cannot
  drift), tilt on `.blog-image` gated on `__styleAllowsTilt`. The mermaid `initialize` block stays
  `is:inline` and reads `--secondary`, `--text`, `--neutral-gray` with the same fallbacks.
- Listing: cards rendered at build (`BlogCards.astro`, same markup as `blog-listing.js:127-139`
  incl. `data-aos-delay={i*50}`), filter pills from the sorted tag set (no "All" pill today);
  behavior (`blog-listing-client.js`): typing masthead, intro wave, filter toggling `.filtered-out`,
  `AOS.init({offset:50})` + refresh-on-resize, tilt. Home rail cards rendered at build likewise.
- Assets: `public/blog/posts/assets/*` verbatim; the page-relative fetch URLs inside
  `cohorts-chart.js` (`:642-682`) and `job-market-chart.js` (`:12`), both unpublished
  `ai-job-market` assets, rewritten to `/blog/posts/assets/…`; `.github/workflows/refresh-chart-data.yml`
  and `docs/prebake-cohort-data.py` (`OUT_DIR`) updated to the `public/` path.
- `sitemap.xml` generated (D24); `robots.txt` (with its `Sitemap:` line) in `public/`.

---

## 8. Behavior runtime (`public/js/`)

Per file, what changes (everything else is verbatim, same constants):

| File | Removed (now build-time) | Kept / changed |
|---|---|---|
| `theme-bootstrap.js` | entire file | replaced by `Shell` + `ThemeAssets` + `ThemeRuntime` (§5.4); its apply logic lives on as `src/themes/apply.ts` for the 404 (D27) |
| `nav-config.js` | config objects, `buildNavItems`, all `innerHTML` rendering | → `nav-behavior.js`: sticky header (`SCROLL_THRESHOLD 300`), Calendly click building the URL from `--bg`/`--text`/`--primary` with today's fallbacks |
| `blog-data.js` | entire file | data lives in prose; carousel, rail and cards are components |
| `featured-carousel.js` | `renderFeaturedCarousel` | `buildTickerRun` stays and reads each card's tech chips from the rendered DOM (`data-tech`), so `--ticker-run`/`--ticker-dur` (`402/46` chars per second, `✷`, dedupe, ×2) keep being set at runtime exactly as today; dots still built at load, their `aria-label` from `data-slide-label` |
| `script.js` | `renderBlogCards`, the inline masthead sequences | reads sequences from the JSON island; intro wave, jobs panel, smooth scroll, tilt, `AOS.init()` unchanged; still `defer`, still after `nav-behavior.js` |
| `blog-listing.js` | card + filter-bar rendering | → `blog-listing-client.js` (§7) |
| `blog-post.js` | fetch, frontmatter, marked, JSON-LD, asset loading | → `blog-post-client.js` (§7) |
| `theme-cycler.js` | dock construction, `?style=` navigation, reload wipe | §5.5 |
| `typing-engine.js`, `anim-utils.js`, `cursor-follow.js` | nothing | verbatim |

Load order per page type is copied from today's `<head>`/`<body>` verbatim, including the
asymmetries: `aos.js`, `featured-carousel.js` and `typing-engine.js` are `defer` on home and sync on
the listing; `vanilla-tilt` and `anim-utils.js` are sync wherever they appear; the Calendly widget is
`async`; `nav-behavior.js` and `cursor-follow.js` are `defer` everywhere; page scripts
(`blog-listing-client.js`, `blog-post-client.js`) are sync at the end of `<body>` and the cycler is
`defer` after them. `research/theme-engine-contracts.md` §6 is the per-page table (re-verified).

Vendor map (`scripts/vendor.mjs`): `jquery/dist/jquery.min.js`, `jquery-ui-dist/jquery-ui.min.js`,
`gsap/dist/gsap.min.js`, `aos/dist/aos.{js,css}`, `vanilla-tilt/dist/vanilla-tilt.min.js`,
`highlight.js/styles/github-dark.min.css`, `@fortawesome/fontawesome-free/{css/all.min.css,webfonts/*}`
(the CSS references `../webfonts/`, so both copy at the same depth). The script holds the full sha256
of every file it copies and fails if one differs; T4 records them after confirming the five prefixes
`research/library-migration.md` §1 publishes (jquery, gsap, vanilla-tilt, `github-dark.min.css`,
`all.min.css`) and the one-byte jquery-ui difference.

---

## 9. Parity harness (`harness/`)

**Definition of parity** (all must hold, per theme × page × viewport × state):

1. Normalised DOM dump equal (`expect(newLines).toEqual(oldLines)`), taken after `settle()`.
2. `toHaveScreenshot` within `maxDiffPixelRatio: 0.001`, `threshold: 0.2`, `animations: 'disabled'`,
   `caret: 'hide'`, `scale: 'css'`; the masthead is masked and asserted as text separately.
3. Computed-style sample equal (exact): the five colour roles and every `--*` token on `<html>`,
   plus `color/background-color/font-family/font-size/line-height/border-radius` on 12 sentinel
   selectors per page type (`harness/sentinels.ts`; rule: `html`, `body`, the logo, one nav item, the
   masthead, one section header and its number, one body paragraph, one card, one pill or chip, one
   CTA, the footer credit; exact selectors fixed in T1).
4. No 4xx/5xx network response on either side (catches broken asset paths silently).
5. No page references a `<script src>` outside its allow-list in `harness/scripts.ts` (today's set
   per page type, the §8 renames, the 404's bundled apply script; grep of built HTML; also the §3.3
   lean guard for future themes).

**Matrix:** 16 themes × pages {home, listing, `toolbelt` (2 mermaid + bash/json), `embedded-swift-agent`
(9 swift + 1 c fence + image), `metr-doubling` (Plotly + js-yaml + assets), privacy, 404, lexchat}
× {desktop-1440, mobile-390} × states {settled; job tab 2 clicked, carousel dot 3 clicked, sticky nav
after scroll 400→200 and smooth-scroll to `#contact` (home); theme menu open by click (pages with a
trigger); filter `Swift` (listing)}. States apply where the element exists. Sharded by theme
(`--grep @theme:<id>`), ~15 min full sweep.

**Old side:** `PARITY_OLD_DIR` (default `../personal-website-old`), a detached worktree of `main` at
the baseline SHA, created by the owner (§14), read-only, served by
`python3 -m http.server --bind 127.0.0.1 8781 --directory …` (Python 3.9.6 on this machine has both
flags). URL pairs in `harness/urls.ts` (`x` ≠ default; the default theme uses the bare paths on both
sides): `/?style=x` ↔ `/x/`, `/blog/?style=x` ↔ `/x/blog/`, `/blog/post.html?id=p&style=x` ↔
`/x/blog/p/`, `/privacy/?style=x` ↔ `/x/privacy/`, `/lexchat/?style=x` ↔ `/x/lexchat/`,
`/404.html?style=x` ↔ `/404.html?style=x` (both sides apply the theme at runtime, D27). Fresh browser
context per test.

**Determinism:** one `addInitScript` replaces `Math.random` with mulberry32; the harness pins
sequence *indices*, not seeds: `seedFor(index, n)` brute-forces the smallest seed whose first draw
gives `Math.floor(r * n) === index` (the masthead pick at `typing-engine.js:165` is the first draw on
every page; the cycler draws later). Home: index 3 (single `type` step, shortest settle) and a second
mobile shot at index 0 (exercises the delete path); listing: the shortest of its 7 (T1 picks).
`page.emulateMedia({ reducedMotion: 'no-preference' })`; the mouse never moves before capture
(cursor follower stays at opacity 0); `route.abort` for `assets.calendly.com`, `corsproxy.io`,
`collectionapi.metmuseum.org`, `openaccess-api.clevelandart.org`, `api.vam.ac.uk`, `www.getty.edu`,
`framemark.vam.ac.uk`, `media.getty.edu`, `www.metmuseum.org`, `raw.githubusercontent.com`,
`dawsonamf-lexchat.hf.space` (defensive: only Calendly and the lexchat iframe are on matrix pages);
Google Fonts never blocked. `page.clock` is optional and only used if the typing settle proves flaky.

**`settle(page)`** (fails the test after 15 s, never skips):

1. `load` fired.
2. The count of `<link rel="stylesheet">` in `<head>` stable for 500 ms (the cycler's idle font load
   has appended its 14 links) and `document.fonts.ready` resolved.
3. Every in-viewport `[data-aos]` has `aos-animate`.
4. `document.getAnimations()` has no running finite animation.
5. Page type: home and listing: masthead text equals one of the sequence's terminal strings and
   `.cursor`'s `animation-name` is `blink`; home: the 10 elements `anim-utils.js` pins
   (`animationend` → inline `animation: none`) all carry it, `#highlight` has inline geometry, the
   carousel has 8 cards and 8 dots with one active, `--ticker-run` on `<html>` is non-empty,
   `--section-rule` is stable across two rAFs; post: `#read-time` matches `/^\d+ min read$/` and
   every `.mermaid` has an `svg`; 404 under a theme: `data-style` is set and the skin sheet has loaded.

**Normaliser (`normalize.ts`)**, applied identically to both dumps:

1. Input is `document.documentElement.outerHTML` after `settle()`. A second, pre-settle dump of the
   raw response body is stored per page (informational: separates "emitted HTML differs" from "JS
   produced a different DOM").
2. Drop `<script>`, `<noscript>` and `<link rel="modulepreload">`. Nothing else is removed, so
   `<head>` order is compared as-is.
3. Strip `data-astro-*` attributes and rewrite `/_astro/<hash>` → `/_astro/HASH` (guards; the
   canonical family should emit none, and the count is reported).
4. Lowercase tag names, sort attributes alphabetically.
5. Collapse whitespace runs to one space and trim text nodes, except inside `pre`.
6. Map old link forms to new: `index.html#x`, `./index.html#x`, `../index.html#x` → `/#x`;
   `blog/`, `./`, `../blog/` → `/blog/`; `post.html?id=p`, `blog/post.html?id=p`,
   `../blog/post.html?id=p` → `/blog/p/`; `resources/…` at any depth → `/resources/…`;
   `../12years/` → `/subsites/elise/12years/`; CDN URLs → `/vendor/…` per the vendor map;
   `/?style=x` → `href(<page under test>, x)`.
7. `<html style>`: drop `--prose-*` declarations (new side only), then compare verbatim; the new
   build reproduces tokens and ramp byte-for-byte (§5.4).

**Config:** `reporter: [['html', { open: 'never' }], ['list']]`; `webServer` array with
`gracefulShutdown: { signal: 'SIGTERM', timeout: 500 }`; `snapshotPathTemplate` without
`{platform}`; `harness/__parity__/` gitignored. Guard test: `matchMedia('(hover: hover) and
(pointer: fine)')` is `true` on desktop and `false` on mobile (assert, do not assume). After the first
run, check `lsof -nP -iTCP:8781 -sTCP:LISTEN` and `:8782` return nothing.

**Manual QA list** (owner, ordered by skin as intent §4.9 asks): tilt feel on cards/carousel/post
images; cursor follower; hover states on nav, pills, dock rows; palette toy shuffle/scheme/lock/colour
input; marquee tickers and glyph headers; mobile jobs rail scroll; Calendly popup colours;
reduced-motion pass (`emulateMedia` run of the suite is automated; the feel is not).

---

## 10. Deploy and cutover

`.github/workflows/deploy.yml` as `research/deploy-and-parity-harness.md` §2.2 with
`node-version-file: .nvmrc` (§2.2 shows `package.json`; `.nvmrc` is `astro-capabilities.md` §2.1's
recommendation): `checkout@v7`, `setup-node@v7` with `cache: npm`, `npm ci`, `npx astro build`,
`upload-pages-artifact@v5` of `dist`, `deploy-pages@v5` in a `github-pages` environment,
`concurrency: pages`, `workflow_dispatch` input `deploy: false` for dry runs. `refresh-chart-data.yml`:
paths → `public/blog/posts/assets/`, `permissions: actions: write`, `gh workflow run deploy.yml --ref
main` when the commit happened (the permission is the conventional grant; no doc sentence ties it to
`workflow_dispatch`, so T7 verifies the dispatch empirically).

Cutover runbook (owner drives, agent prepares commands; each step separately approved):

1. Parity green on every theme; manual QA signed; `npm run build` clean (drafts gate on).
2. A dispatch-only `deploy.yml` (no `push` trigger) is committed to `main` first: GitHub only runs
   `workflow_dispatch` for workflows present on the default branch. Harmless while `main` is legacy.
3. `gh api /repos/dawsonamf/personal-website/pages --jq '{build_type,cname,https_enforced}'` (record).
4. `gh workflow run deploy.yml --ref astro -f deploy=false`: the artifact builds and uploads while
   Pages is still legacy (only `deploy-pages` needs the flip).
5. `gh api --method PUT /repos/dawsonamf/personal-website/pages -f build_type=workflow`
   (fallback body with `source` if it 422s; whether `source` is required is undocumented). Re-read
   `https_enforced` and re-assert it with `-F https_enforced=true` if it changed. The last legacy
   deployment keeps serving.
6. Merge `astro` → `main` (one merge, intent §4.11; brings the full `deploy.yml`). Push triggers
   the deploy. Watch it.
7. Verify live: `/`, `/brutalist/blog/toolbelt/`, `/blog/post.html?id=helm`, `/12years/`,
   `/brutalist/nope/` (themed 404), `https_enforced` unchanged, `dawsonamf.com` → `www`.
8. Rollback: `-f build_type=legacy` + revert the merge commit. `CNAME`/`.nojekyll` at the repo root
   make the legacy path work again.

---

## 11. Desk-check against the five structural themes

From `research/structural-theme-demands.md` §3 (40 capabilities) plus illoca (intent §6.5, added
after the research pass). Where each lands:

| Demand (§3 ids) | Spec 1 provides | Left to the theme spec |
|---|---|---|
| Own DOM per page type; own `<head>`; own root CSS incl. `html{font-size:1vw}` (1-3) | `kind: 'structural'`, `layouts`; root CSS lives in the theme's layouts, which fallback pages never import; a build test renders a stub theme's fallback blog page and asserts tokens + fonts present and none of the stub layout's markup | the layouts |
| Own nav with a picker mount; full-screen menu; no always-visible control (4, 24) | `.tc-nav-item` trigger contract (D30), body-parented dock, `--tc-z` set by the theme; `picker: { mount: 'own' }` | placement (§13 Q9) |
| Floating fallback (5) | `PickerFab.astro` (D12), `{ mount: 'fab', corner }` | corner choice |
| Theme-only routes (`/mono/work/`, mosbyfiles About) (6, 31) | `extraPages` in the registry, emitted only under that theme; 404 elsewhere; `href()` knows them | pages |
| Unowned page types in theme tokens + fonts (7) | composition rule §5.2 | none |
| Theme scripts only on theme pages; two GSAP versions (8, 9) | layouts emit their own tags; `"gsap-next": "npm:gsap@3.15.0"` alias reserved for themes (`research/library-migration.md` §3.2; README rule: never mix `gsap` and `gsap-next` objects in one animation) | imports |
| Internal colour modes coexisting with picker and toy (10, 11) | `modes` in the registry; pre-paint stamp via `ThemeRuntime`; `dawson:palette` on change; toy hidden when `modes` present (D26) | mode UI, wipe |
| Prose by slot and size with null; theme-specific strings; ordered fragment arrays; structural constraints (starts with "I", one line) (12-15) | accessor §4.2; `themes.<id>.*` free-form section validated by a per-theme zod fragment the theme registers; schema helper `fragments(n)` for fixed-length `xs` arrays; per-slot `constraints` (max lines, initial letter) as schema refinements | the strings, as drafts |
| New fields: project `category`, `year`; `jobs[i].summary` (m); `projects[i].description` (s) (16-19) | schema accepts them now as optional; nothing writes them | drafts |
| Sized job bullets that fit (20) | sizes per field; cream's three bullets (~112 words) exceed the `m` budget (~60) | §13 Q13 |
| Socials with labels, icons, grouping, GitHub (21) | `socials[]` already carries label + icon; `group` optional field added | GitHub entry (owner) |
| Image grid from project images; responsive sizes (22) | `projects[].image` + optional `images[]`; no image pipeline (intent §7) | sizes |
| Preloader/curtain before content; no-JS path; reduced-motion (23, 38) | a `chrome` slot rendered before `<main>` in the page shell; README rule: every structural theme ships `<noscript>` and a reduced-motion branch | content |
| Smooth-scroll wrappers (ScrollSmoother needs `#smooth-wrapper > #smooth-content`; Lenis on `window`) (25) | the Shell lets a layout own everything inside `<body>` except its end-of-body mount | wrapper |
| Different mobile structure; theme breakpoint (26, 27) | D25; the theme's CSS | CSS |
| Document-level SVG defs; theme storage keys (28, 29) | `<defs>` slot with `theme-<id>-` id prefix convention; `theme.<id>.*` key rule | usage |
| Skills as `xs` names + `s` one-liners (33) | sizes are per field: `home.skills.groups[i].body.s` written on request, no schema change | drafts |
| Generated copy ("3 posts"/"1 post", "Go to slide N", "N min read") (34) | template fields: `xs` strings containing `{n}`; plural forms as two fields (`one`, `other`); the component or client substitutes, never regex over prose | the templates |
| Alt/aria for theme chrome from approved strings (35) | `themes.<id>.*` `xs` strings through `prose.text()` | the strings |
| Split-text safety (plain text only) (36) | `prose.text()` for such slots; README rule | usage |
| Opting out of every canonical behavior script (37) | owned pages load none of `public/js/` except the cycler; nothing global assumes they ran | none |
| Draft toggle reachable inside a theme's chrome (39) | the pill shares the Shell's end-of-body mount with the dock and FAB; a theme repositions `#prose-pill` in CSS if its chrome covers the corner | CSS |
| Contact form → mailto; stats/testimonials omitted (30, 32) | `null` sizes + section-level omission in data-driven page composition | choices |
| WebGL canvases (three.js/OGL), Rive, video demos, self-hosted paid fonts, cursor coordinate readout (illoca) | same mechanisms: theme scripts/assets only on its pages (§5.2, §9 check 5), `chrome` slot, theme-owned `<head>` for fonts; a `public/themes/<id>/` asset directory convention for video/GLB; no engine change | recorded clips and font licensing (owner), drafts for tags/one-liners/FAQ |

Nothing in the five themes requires a change to the registry shape, the routing, the prose
accessor, or the composition rule as specified; capabilities 34 and 39 add a template rule and a
shared mount, both above. Cream (first consumer) will exercise `chrome`, `picker`, root CSS in its
layouts, `extraPages: none`, the GSAP alias, and `themes.cream.*` constraints; if it finds a gap, it
fixes the engine (intent §8).

---

## 12. Tickets

Order is dependency order; T2/T3 can run in parallel after T0; T7 can run any time after T3. Each
ticket ends with the harness green for its scope (T0/T1/T7/T9 excepted).

| # | Ticket | Delivers | Done when |
|---|---|---|---|
| T0 | **Spike: Astro 7 on this markup** | Astro 7.3.1 scaffold on the `astro` branch/worktree; `index.html` ported verbatim into one page; `compressHTML:false`; build. Settles: (a) the Rust compiler (`@astrojs/compiler-rs`, strict: unclosed tags error) accepts today's markup once ported; (b) Astro injects nothing into `<head>` for a page whose components have no `<style>` or bundled `<script>` (§6.2 premise) and where an injection would land if one existed; (c) `[...theme]` with `theme: undefined` emits `/` and `/blog/…`; (d) `404.astro` → `dist/404.html`; (e) `prerenderConflictBehavior: 'error'` fires on a planted collision; (f) a throw in `astro:build:done` exits non-zero, else the `process.exit(1)` fallback (D10); (g) a post rendered with `retainBody` + our renderer emits marked's markup, not Sätteri's; (h) `redirects` emits `dist/12years/index.html` as a meta-refresh stub; (i) `public/` copies verbatim, nested dirs and `agent.js`'s `+esm` import untouched; (j) `python3 -m http.server --bind 127.0.0.1` + Playwright 1.61.1 run against the cached Chromium 1228 without a download (`research/astro-capabilities.md` §3 items 3-6, 10; §2.5-2.6; `deploy-and-parity-harness.md` §3.1-3.2). | A `research/spike-findings.md` with each item answered; installs approved and recorded (§14). |
| T1 | **Parity harness v1 (old vs old)** | `harness/` per §9 against the baseline worktree on both ports; DOM dump, screenshots, token sample with the sentinel list, settle, index-pinned seeds, interactions, URL map, reporter config. | Old-vs-old run is green for all 16 themes × 8 pages × 2 viewports × applicable states; listeners gone after the run. |
| T2 | **Prose model** | `prose.yaml` with every string from `research/prose-and-url-inventory.md` migrated verbatim (`l`/`xs`/`s`), schema (§4.1 rules 1-8), accessor (§4.2), marked wrapper (D15, D16), draft marking + pill (D9), both gates (D10), `PROSE_DRAFTS` scripts, `CLAUDE.md` rule, `prose:check`. Resolves §13 Q1 metadata once the owner answers. | `astro build` fails on a planted draft listing it; `build:preview` renders it red and the pill counts it; a planted unwritten request fails with the list; a planted YAML syntax error fails the build; unit test: every field renders to exactly today's HTML fragment (fixture from the old files). |
| T3 | **Registry, routing, shell, theme assets** | `types.ts`, `registry.ts` + assertions, `paths.ts` (`themeParams`, `href` + grep test), `ramp.ts`, `apply.ts`, `Shell`, `ThemeAssets`, `ThemeRuntime`, `compose.ts`, `[...theme]/` pages (empty layouts ok), `404.astro` with D27, canonical/noindex, `?style=` shim, `prerenderConflictBehavior`, structural-kind fallback test (§5.3), build-done page scan (D29), `README.md` skeleton. | Build emits 240 pages + `404.html`; `<html>` attributes and inline style byte-equal to today's post-load `<html>` for each theme (unit test against output captured in T1); `/404.html?style=brutalist` applies brutalist at runtime; a stub structural theme's blog page has tokens + fonts + `theme-base.css` and none of the stub layout's markup; the page scan passes. |
| T4 | **Canonical home** | `Head`, `Nav`, `Hero`, `About`, `Jobs`, `FeaturedCarousel`, `BlogRail`, `Contact`, `Footer`, `ThemePicker` (dock rendered by the Shell); `public/js/` edits per §8; `scripts/vendor.mjs` with recorded sha256s; Boxicons static copy; masthead JSON island; `--prose-*` emission (D14) and the marquee/doodle sheet edits. | Harness green for home × 16 × 2 × all states. |
| T5 | **Blog listing and posts** | posts collection, marked-at-build, per-post head, assets as tags, `blog-post-client.js`, `blog-listing-client.js`, `BlogCards`, `post.html` shim, `.md` link rewrites, frontmatter cleanup, R1 fetch-URL fix, chart workflow paths, sitemap integration. | Harness green for listing + the 3 posts × 16 × 2; every one of the 11 posts builds; `/blog/post.html?id=helm` lands on `/blog/helm/`; no 4xx in the network log on any post. |
| T6 | **Utility pages, FAB, subsites, redirects** | privacy/404/lexchat pages; `PickerFab` (new UI, owner preview); `public/subsites/elise/12years/`, embedded-swift-agent placement; `redirects` config; `robots.txt`; `docs/` unpublished. | Harness green for privacy/404/lexchat with the FAB allow-listed; owner approves the FAB visually on 3 skins; `/12years/` lands on the new URL; `/404.html?style=brutalist` and `/404.html?style=doodle` apply their skins (the path-segment case, `/brutalist/nope/`, is checked live in §10 step 7 because neither `http.server` nor `astro preview` is documented to serve `404.html` for unknown paths). |
| T7 | **Deploy workflow** | `deploy.yml` (full, on the branch) plus the dispatch-only copy for `main` (§10 step 2, owner commits), `.nvmrc`, `refresh-chart-data.yml` patch, `prebake-cohort-data.py` `OUT_DIR`. | Dry run (`deploy: false`) dispatched with `--ref astro` uploads an artifact; a manual `workflow_dispatch` of `refresh-chart-data.yml` dispatches `deploy.yml` (visible in Actions, confirming `actions: write` suffices); Pages still legacy. |
| T8 | **All 16 themes green + manual QA** | The full harness matrix; per-skin fixes; the dead `.tc-toggle` rules in 16 sheets and `theme-base.css` audited against the real FAB; manual QA list run by the owner, ordered by skin. | Full sweep green; owner sign-off recorded in `research/qa-signoff.md` per skin. |
| T9 | **Docs and cutover** | `CLAUDE.md` rewrite, `src/themes/README.md` (registry, kinds, slots, runtime contracts, the hard-won rules and the eleven omissions from `theme-engine-contracts.md` §9 carried over and corrected), banner on `docs/theme-explorations.html`, runbook §10 executed with the owner. | Live site serves from Actions; §10 step 7 checks pass; rollback command recorded. |

Paths each ticket may touch: T0 the spike worktree only; T1 `harness/`, `playwright.config.ts`; T2
`src/content/prose.yaml`, `src/prose/*`, the prose collection in `src/content.config.ts`,
`package.json` scripts, `CLAUDE.md` (rule only); T3 `src/themes/*`, `src/layouts/{Shell,ThemeAssets,
ThemeRuntime}.astro`, `src/layouts/compose.ts`, `src/pages/*`, `astro.config.mjs`; T4
`src/layouts/canonical/*` (home + components), `public/js/*`, `public/css/themes/{marquee,doodle}.css`,
`scripts/vendor.mjs`, `public/vendor-static/`; T5 the posts collection, `BlogListing`/`BlogPost` and
`BlogCards`, `public/js/blog-*-client.js`, `public/blog/**`, `src/content/posts/*`; T6
`Privacy`/`NotFound`/`LexChat`/`PickerFab`, `public/subsites/**`, `public/robots.txt`; T7
`.github/workflows/*`, `.nvmrc`, `docs/prebake-cohort-data.py`; T8 `public/css/themes/*.css`,
harness fixes; T9 docs only.

Rough size: T0 half a day; T1 two days; T2 two days; T3 one and a half days; T4 three days; T5 three
days; T6 one day; T7 half a day; T8 two to four days (owner QA bound); T9 one day.

---

## 13. Questions only the owner can answer (batch for the grilling session)

Each has the default this spec assumes. Answers change T2/T5/T6 scope only (Q13 affects the cream spec).

| # | Question | Default assumed |
|---|---|---|
| Q1 | **Post metadata conflicts.** `helm`: listing says *"Helm: A Minimalist Workspace Switcher for your IDE" / April 2026*, the post file says *"Helm: A Workspace Switcher for VS Code and Cursor" / March 2026*. `metr-doubling`: listing *January 2026*, post file *February 2026*. Which wins? | Post-file values (they are what a reader of the post sees). |
| Q2 | **Unlisted and duplicate posts.** `gemma4-heretic-ara` is live and in the sitemap but commented out of the listing: list it (its commented excerpt/tags would need your approval) or keep it unlisted? `autoencoders-1/2` exist locally but the listing links to aboutobjects.com: keep the local copies published at `/blog/autoencoders-1/` (and link them?), or drop them and redirect to the external posts? `color-randomizer` sitemap entry is a live 404: drop it? | gemma4 stays unlisted but is prerendered and in the sitemap (as today); autoencoders local copies stay published, listing still links external (as today), both in the sitemap; color-randomizer dropped. |
| Q3 | **Where does `/embedded-swift-agent/` live?** Intent §4.8 groups subsites by person, but this is your own project demo, linked from a project CTA, a post body and the sitemap. `/subsites/dawson/embedded-swift-agent/`, `/subsites/embedded-swift-agent/`, or leave it at `/embedded-swift-agent/` (no redirect needed)? | Leave it at `/embedded-swift-agent/`; `subsites/<person>/` is for pages made for people. |
| Q4 | **Picker on privacy, 404 and lexchat.** Today they have none (the FAB in the docs never existed). Building it is new UI: a fixed bottom-right button with the palette icon opening the same dock. Do you want it on all three, or exempt lexchat (a full-viewport iframe app shell)? You will see it before it ships. | All three, bottom-right. |
| Q5 | **`loadAllFonts`.** The picker fetches all 14 Google Fonts stylesheets on every page after idle so the dock's style rows render in their own fonts. Keep (parity, 14 requests per page) or load them on first dock open (lean, brief font flash in the dock)? | Keep for parity; cleanup pass changes it. |
| Q6 | **CSS counter prefixes and glyphs** (`FIG. 01`, `№ 3`, `(01)`, `✷`, `■`, `·`, `/`) in blueprint, field-notes, banknote, marquee, studio, brutalist, gallery: prose (editable in the YAML) or decoration (stays in CSS)? Only marquee's ticker fallback and doodle's "currently here ✓" move regardless. | Decoration. |
| Q7 | **Home masthead duplicates.** Sequences 5-8 are two exact duplicate pairs, so "builder." runs on 4 of 9 loads. Intentional weighting? | Keep verbatim. |
| Q8 | **`docs/` stops being public** (`/docs/theme-explorations.html`, three unpublished post drafts under `docs/planned-posts/`, `/CLAUDE.md`, `/docs/TODO.md` are live URLs today). OK to drop without redirects? | Yes. |
| Q9 | **Structural themes and the picker** (shapes the mount API): may a structural theme hide the global picker inside its own menu with no always-visible control (cream has no room; mono's bottom-right is taken)? | Yes; the FAB is only for themes that mount nothing. |
| Q10 | **Palette toy on structural themes and mono's modes.** Hide the toy on themes that declare their own colour modes (it can only reach 2 of mono's 11 variables and would break cream's single-ink design)? Should a theme's internal mode persist for the session (not in the URL)? | Hide it there; session persistence, namespaced key. |
| Q11 | **Subsites and the prose rule.** `12years/` (~395 words you wrote) and `embedded-swift-agent-context.md` (a public bio the agent reads to visitors) are verbatim copies outside `prose.yaml`. Exempt them explicitly in `CLAUDE.md`? | Exempt. |
| Q12 | **Palette-toy state on reload.** Today a reload clears both the theme and the toy. The theme now survives reload (intent §4.5). Should the toy's colours survive too? | Yes (no reload detection at all). |
| Q13 | **The `m` budget versus cream's job rows.** Cream shows three bullets per job; today's bullets run ~112 words for three, against the `m` budget of ~60 words (`research/structural-theme-demands.md` §3 item 20). Tighter `m` bullets as drafts for you to clear, or a wider budget for bullets? | Tighter `m` bullets as drafts; the budget stays. |

---

## 14. Owner actions this spec needs (not questions)

1. **Node 24 LTS** on your machine (Node 25 is end-of-life; Astro supports even lines only). Install
   approval needed for whatever manager you use (`brew install node@24`, `nvm install 24`, or `fnm`).
   `.nvmrc` = `24`.
2. **Install approvals**, requested again at execution time, one command each:
   `npm install --save-exact astro@7.3.1 @astrojs/sitemap@3.7.4 js-yaml@4.3.0 marked@18.0.5 highlight.js@11.9.0 jquery@3.6.0 jquery-ui-dist@1.12.1 aos@2.3.1 vanilla-tilt@1.7.0 gsap@3.9.1 @fortawesome/fontawesome-free@6.5.1`
   and `npm install --save-dev --save-exact @playwright/test@1.61.1` (no browser download at 1.61.1;
   the latest, 1.63.0, would download Chromium 1243, ~150 MB, and Playwright garbage-collects unused
   builds, so never install a newer Playwright in this checkout without expecting that). `js-yaml` is
   pinned to the 4.x line Astro itself depends on (`^4.3.0`) so npm installs one copy; 5.4.1 is
   latest but not needed. All versions above were confirmed on the registry on 2026-09-05.
3. **Commit the prototypes** (`docs/*-prototype*.html`, `docs/intents/`): they are untracked;
   specs 2-3 start from two of them.
4. **Create the baseline worktree** once: `git worktree add --detach ../personal-website-old 0f196d0`
   (the harness only reads it; it never runs git there). And the working branch:
   `git worktree add ../personal-website-astro -b astro`.
5. **Commit the dispatch-only `deploy.yml` to `main`** before the dry run (§10 step 2; T7 prepares it).
6. **Cutover** steps 3, 5, 6 in §10 are yours to run (repo settings + merge).
7. **Manual QA** in T8, ordered by skin.

---

## 15. Deliberate visible changes (harness allow-list)

1. Theme in the URL (`/<id>/…`); reload keeps the theme; switching keeps the current page (D11).
2. Palette-toy state survives reload (D11, Q12).
3. Theme picker FAB on privacy, 404, lexchat (D12, Q4).
4. Posts at `/blog/<id>/` with real `<title>`, description, canonical, OG, JSON-LD in the served
   HTML; no "Loading…" title; old URL redirects via a shim page. `gemma4-heretic-ara`'s JSON-LD gains
   description and keywords (today it has none, being absent from the listing data).
5. `/12years/` moves under `/subsites/elise/`; embedded-swift-agent per Q3.
6. Generated sitemap (entries and `lastmod` change; `color-randomizer` gone).
7. `docs/` and `CLAUDE.md` no longer served (Q8).
8. Third-party files served from `/vendor/` instead of CDNs (byte-identical except jquery-ui's one
   escape byte; mermaid, Plotly, js-yaml still CDN). Mermaid loads only on posts that have a diagram.
9. Dock markup is in the served HTML instead of built by JS (identical after load); preset rows link
   to the themed URL of the current page instead of `/?style=<id>`.
10. Themed pages carry `canonical` + `noindex`; `<html style>` carries `--prose-*` under marquee/doodle.
11. The 404 page: themed under `/<id>/…` paths (new) and under `?style=` (as today), applied after
    parse rather than pre-paint, so a brief default flash (D27).

Everything else, on every page, at both viewports, in every listed interaction, must match today's
site to the harness's tolerances and to your eye.

---

## 16. Traceability

| Intent | Where |
|---|---|
| §3.1 prose ownership | §4, D7-D10, D14-D17, Q6, Q11, Q13 |
| §3.2 parity | §9, §15, T1, T8, D27, D29 |
| §3.3 lean | D5, §5.2 fallback (no theme scripts), §9 check 5, §11 GSAP alias and capability 37 |
| §3.4 done properly | §3.3 boundary and module graph, typed registry §5.1 (D28), accessor §4.2, Shell D29, `href()` D31, D3 stated |
| §3.5 URLs | §6.4 |
| §3.6-3.7 structural freedom, five consumers | §5.3, §11 |
| §4.1-4.13 locked decisions | D1-D2 (stack), §4 (sizes, file, drafts), §6 (paths, posts, coverage incl. 404 via D27, subsites), §9 (harness), §10 (deploy, worktree), D5 (libraries), D3 (behavior policy) |
| §5 delegated | §2 |
| §9 undecided | D7 (YAML shape), D25 (mobile), D26 (modes), D9 (draft toggle), D10 (budgets), §6.1 (canonical/noindex/sitemap), D23 (explorations doc), §9 (thresholds, viewports, settling) |

---

## 17. Research errors found while finalizing (for the research files' readers)

1. `prose-and-url-inventory.md` §2.9: "`--ticker-run` … never assigned" is wrong;
   `js/featured-carousel.js:413-414` assigns `--ticker-run` and `--ticker-dur` on `<html>` (D14).
2. `library-migration.md` §3.8 calls Astro's pipeline remark; in Astro 7 it is Sätteri (D6).
3. `page-behavior-and-blog-pipeline.md` §3 speaks of masthead *indices* (3, then 0); a seed of 3
   yields index 6. The harness pins indices (§9).
4. `prose-and-url-inventory.md` §2.5 header says "10 sequences"; 9 are active (`script.js:129-192`),
   one is commented out.
5. `page-behavior-and-blog-pipeline.md` §8 says `BLOG_POSTS` has 11 active entries; it has 10 plus
   one commented out (`js/blog-data.js:122-129`).
6. `library-migration.md` §1 headline lumps jquery-ui into the byte-identical set; §1.3/§3.4
   correctly show a one-byte difference (D5, §8).
7. `library-migration.md` R1 names only `cohorts-chart.js`; `job-market-chart.js:12` has the same
   page-relative URL (§7).
8. `deploy-and-parity-harness.md` §2.2 uses `node-version-file: package.json`; this spec uses
   `.nvmrc` per `astro-capabilities.md` §2.1 (§10).
9. `theme-engine-contracts.md` §9 lists six stale claims in `docs/theme-explorations.html`, not
   three; the doc also does not link `theme-bootstrap.js` (D23).
10. `astro-capabilities.md` §3.10 recommends keeping the draft gate in zod; this spec does (D10) and
    uses the `astro:build:done` hook only for the unwritten-size list, with `process.exit(1)` as the
    fallback.
