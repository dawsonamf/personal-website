# Spec 1: Astro migration, prose file, theme engine, parity harness, deploy

**Status:** draft, awaiting owner approval (intent §8: "each spec goes through the owner").
**Written:** 2026-09-05 from `intent.md` §8.1 and the seven research files in `research/`.
**Baseline:** `main` @ `0f196d0`. The parity harness compares against this commit.
**Scope:** everything in intent §8.1. Nothing from specs 2-6 (the five structural themes) is
built here; §11 desk-checks the engine against their demands so they do not force a redesign.

How to read this: §2 lists every decision this spec makes on the owner's behalf (intent §5
says to state them). §12 is the ticket breakdown. §13 is the batch of questions only the
owner can answer, each with the default the spec assumes until answered. §15 is the list of
deliberate visible changes, which is what the parity harness allow-lists.

---

## 1. Outcome

When this spec is done:

1. `www.dawsonamf.com` is built by Astro 7 and deployed by GitHub Actions on every push to
   `main`. Old URLs redirect. Blog posts are static pages at `/blog/<id>/` with real
   `<title>`, description, canonical and JSON-LD in the served HTML.
2. Every visitor-facing string lives in `src/content/prose.yaml`, sized, schema-validated.
   A draft anywhere in that file fails the production build. A size a component asks for
   but nobody wrote fails the build with the list of what is missing.
3. The theme engine is a typed registry with two kinds (`skin`, `structural`). The default
   theme and the 15 active skins are prerendered under `/`, `/<skin>/`, `/<skin>/blog/`,
   `/<skin>/blog/<id>/`, `/<skin>/privacy/`, `/<skin>/lexchat/`. The `structural` kind is
   fully designed (§5.3, §11) and its fallback path exists, but has no consumer yet.
4. The parity harness proves the 16 themes are unchanged to the eye on every page type at
   1440 and 390, before and after four scripted interactions, and the owner has signed off
   the manual QA list. Only the changes in §15 differ.

Non-goals (intent §1, §7): no visual redesign, no case studies, no posts leaving Markdown, no
library cleanup beyond what the migration forces (gsap 3.9.1 stays loaded, Boxicons stays,
jQuery stays), no build-time syntax highlighting via Astro's pipeline, no `<Image />`.

---

## 2. Decisions made by this spec (intent §5: say what you chose)

| # | Decision | Why (one line; details in the section cited) |
|---|---|---|
| D1 | **Astro 7.3.1**, exact pin. Node **24 LTS** via `.nvmrc`, npm, committed `package-lock.json`. | Stable today. Astro does not support odd Node lines; the owner's 25.9 is unsupported and fails silently, not loudly (`research/astro-capabilities.md` §2.1). |
| D2 | `compressHTML: false`, `prerenderConflictBehavior: 'error'`, `build.inlineStylesheets: 'never'`, `trailingSlash: 'always'`, `build.format: 'directory'`, `site: 'https://www.dawsonamf.com'`, no `base`. | Astro 7's default `'jsx'` whitespace stripping breaks DOM parity; the rest matches GitHub Pages and today's URL shape (§3.2). |
| D3 | **Structure is rewritten; the behavior runtime is kept.** HTML becomes Astro components fed by the prose file and the registry. The existing behavior scripts (typing engine, intro reveals, carousel, jobs panel, cursor, palette toy) stay classic scripts served from `public/js/`, edited only where the render/behavior split and the prose feed require. | Intent §4.13 allows refactoring behavior "where the output provably does not change" but does not require it; sync/defer load order is load-bearing today (§8). Modularising them is intent §7's cleanup pass. |
| D4 | **Theme application moves to build time.** `theme-bootstrap.js` is retired. Each `/<theme>/…` page is emitted with `data-style`, flags, inline tokens, the colour ramp and the theme `<link>`s already in place. One small `is:inline` pre-paint script remains for the palette toy's session override and the runtime globals the behavior scripts read. | The theme is in the path (intent §4.5), so nothing needs resolving at runtime. Removes a blocking script and the runtime `<link>` appends (§5.4). |
| D5 | **Libraries: npm is the source of truth; files are served verbatim.** A 20-line `scripts/vendor.mjs` copies the exact npm artifacts into `public/vendor/` (gitignored) on `prebuild`/`predev`. Bundling them as ES modules is intent §7. **Exceptions:** mermaid, Plotly and js-yaml stay on their pinned CDN URLs (mermaid's npm package is 76 MB for one 3.3 MB UMD file nothing bundles); Boxicons is a committed two-file copy (its npm package declares React 16 + react-router as runtime deps). | Byte-identical artifacts verified by sha256 (`research/library-migration.md` §1). Per-theme isolation (intent §3.3) comes from which layout emits which tags, not from Vite chunking. |
| D6 | **Posts render at build with marked 18.0.5 + the three existing renderer overrides + highlight.js `lib/common`**, not with Astro's Markdown pipeline. Mermaid stays client-rendered and lazy. | Astro 7's Sätteri pipeline emits different HTML (ids, classes, escaping); the marked output is what every skin sheet targets (§7). |
| D7 | **Prose file shape:** every prose field is a size map (`{ xs, s, m, l }`); data fields (urls, ids, dates) are plain scalars; lists of labels (tech chips, tags) are plain string lists declared `xs` by the schema. One YAML document loaded as **one** content-collection entry via `file()` + `parser`, so one zod tree validates it and one `superRefine` lists every draft at once. | `research/astro-capabilities.md` §2.2: per-section entries would surface only the first failing section per build. |
| D8 | **Post metadata (title, date, excerpt, tags, external url) moves into `prose.yaml`**; post frontmatter keeps only `scripts`/`styles`. The build asserts a 1:1 match between `src/content/posts/*.md` and `prose.posts`. | "All prose in one file" (intent §3.1). Also removes the two sources that already disagree (§13 Q1) and the hand-rolled frontmatter parser that only survives `helm`'s colon by luck. |
| D9 | **Draft rendering in preview builds:** `xs`/`s` drafts are wrapped in `<span class="prose-draft">`, `m`/`l` in `<div class="prose-draft">`; a preview-only floating pill shows the page's draft count and toggles native rendering (`localStorage`, persists across pages). Production builds emit none of this. | Intent §4.4. Attribute-context drafts (alt, aria) cannot be marked inline; the pill lists them. |
| D10 | **Unwritten sizes:** the accessor records every `(field, size)` a component requests; the build fails at `astro:build:done` with the full list (fallback: fail on first request if a hook cannot fail the build; verified in T0). Word budgets (§4.2 of the intent) are documented, not linted. | Lists "exactly what is unwritten" (intent §4.2). |
| D11 | **Theme switch keeps the current page** (`/blog/x/` → `/brutalist/blog/x/`). Today every switch lands on `/`. Palette-toy state persists for the session and survives reload (today reload wipes it, alongside the theme). | Consistent with "reload keeps the theme" (intent §4.5). Listed in §15. |
| D12 | **Picker floating fallback (FAB) is new code.** Today privacy, 404 and lexchat load the cycler and get no picker (`theme-cycler.js:558-559` bails without a nav item); the `.tc-toggle` FAB in the docs never existed. Built in T6, visual approval by the owner (§13 Q4). | Intent §4.7 requires the picker reachable everywhere. |
| D13 | **Skins get their full sheet on every page type** (that is what a skin is, and skins style `.privacy-*` and `.nf-*` today). "Tokens only" applies to structural themes' unowned page types and to utility pages under structural themes. | Parity for skins; intent §4.7 for structural. |
| D14 | **CSS `content:` prose:** marquee's ticker literal and doodle's `'currently here ✓'` move to `prose.yaml` under `themes.<id>` and reach CSS as custom properties emitted on `<html>` at build; the sheets change to `content: var(--…)`. Counters and glyphs (`FIG.`, `№`, `✷`, `■`) stay in CSS as decoration (§13 Q6). | Intent §3.1; only two literals are real prose (`research/prose-and-url-inventory.md` §2.9). |
| D15 | **`<br><br>` paragraph separators** (about body, skills body 3, all 8 project descriptions) are stored as normal Markdown paragraphs; the canonical components render them with `paragraphs: 'br'`, which joins rendered paragraphs with `<br><br>` inside one element. Structural themes use `'p'` (default). | Readable YAML, identical DOM for skins. |
| D16 | **Calendly link inside prose:** the renderer turns any Markdown link to `#calendly` into `<a href="#" class="text-link calendly-link">`; every other link gets `class="text-link"` (+ `target/rel` when external), exactly as `blog-post.js` does today. | Markdown cannot emit the class; a link convention can. |
| D17 | **Section numbers** (`01.`…`05.`) are generated from section order per page; only the label is prose. Job titles are `role` + `company` (+ url); the hero subtitle is the three skill-group names joined by the component with `&nbsp;|&nbsp;`. | Themes reorder sections; presentation quirks belong in components, not prose. |
| D18 | **Repo layout:** `src/` (components, prose, registry, pages), `public/` keeps today's URL paths for everything static (`/css/*`, `/js/*`, `/resources/*`, `/blog/posts/assets/*`, `/blog/*.css`, `/privacy/privacy-styles.css`) so the DOM diff needs no path normalisation for them. New: `/vendor/*`. `CNAME` and `.nojekyll` stay at the repo root (needed only for a legacy-mode rollback) and are **not** put in `public/`. | `research/deploy-and-parity-harness.md` §1.2-1.3: Actions deploys ignore `CNAME` and strip dotfiles from the artifact. |
| D19 | **Posts move to `src/content/posts/`**; ids stay the filenames. Post-body links are rewritten once: `../../resources/` → `/resources/`, `post.html?id=x` → `/blog/x/`. Frontmatter `scripts`/`styles` and the chart scripts' fetch URLs become root-absolute (`/blog/posts/assets/…`). | Prerendering at `/blog/<id>/` changes the depth; page-relative URLs 404 (`research/library-migration.md` R1). |
| D20 | **Harness:** Playwright `@playwright/test@1.61.1` (matches the cached Chromium 1228, no browser download), both sites served by `python3 -m http.server --bind 127.0.0.1` (old worktree :8781, `dist/` :8782), baselines generated from OLD then compared against NEW, DOM dump equality + screenshot diff + computed-token sample. | §9. Same server on both sides removes a class of false diffs. |
| D21 | **Deploy:** generic `actions/checkout@v7` → `setup-node@v7` → `npm ci` → `astro build` → `upload-pages-artifact@v5` → `deploy-pages@v5`, with a `workflow_dispatch` `deploy: false` dry run. `withastro/action` not used. `refresh-chart-data.yml` gains `permissions: actions: write` + `gh workflow run deploy.yml`. | §10; `research/deploy-and-parity-harness.md` §2.2-2.6. |
| D22 | **`docs/` stops being served.** Today legacy Pages serves the whole repo, including unpublished post drafts and `CLAUDE.md`. Nothing links there. (§13 Q8 to confirm.) | Free under Astro; a leak today. |
| D23 | **`docs/theme-explorations.html` is frozen** with a banner comment pointing here; the engine's authoring docs move to `src/themes/README.md`, and `CLAUDE.md` is rewritten for the new layout plus the prose rule. | Intent §9 left this open; the file is already stale in three places (`research/theme-engine-contracts.md` §9). |
| D24 | **Sitemap** is generated: default-theme pages only (themed prefixes, shims and 404 filtered), posts carry `lastmod` from their date, other pages carry none. `color-randomizer` (a live 404 today) is dropped. | Intent §4.6. Hand-written `lastmod` values are already wrong by months. |
| D25 | **Mobile structure for structural themes** (intent §9): CSS-first reflow; a theme that truly needs a different mobile DOM renders both subtrees toggled by media query (mono's pattern) and accepts the duplication. Must be resize-stable: no boot-time JS breakpoint flag. The engine adds nothing. | Both prototypes read the breakpoint once and break on rotation (`research/structural-theme-demands.md` §1.20). |
| D26 | **Theme-internal colour modes** (mono): separate state from the palette toy, namespaced storage key, pre-paint stamp through the engine's inline script, mode switches dispatch `dawson:palette`, palette toy hidden on themes that declare modes. Designed here (§5.3), built in the mono spec. | `research/structural-theme-demands.md` §4.5-4.7. |

---

## 3. Architecture

### 3.1 Layout

```
astro.config.mjs  package.json  package-lock.json  .nvmrc  tsconfig.json  playwright.config.ts
CNAME  .nojekyll  robots.txt?                  # root: legacy-mode rollback only (D18)
src/
  content.config.ts                            # collections: prose (file+parser), posts (glob)
  content/prose.yaml                           # THE prose file (§4)
  content/posts/*.md                           # moved from blog/posts/ (D19)
  prose/schema.ts  prose/index.ts  prose/markdown.ts   # zod tree, accessor, marked wrapper
  themes/registry.ts  themes/paths.ts  themes/README.md # registry (§5), themeParams(), docs
  layouts/canonical/                           # the default layout family (canonical DOM)
    Head.astro  ThemeAssets.astro  ThemeRuntime.astro    # head order, theme links, inline blob
    Home.astro  BlogListing.astro  BlogPost.astro  Privacy.astro  NotFound.astro  LexChat.astro
    components/  Nav.astro Hero.astro About.astro Jobs.astro FeaturedCarousel.astro
                 BlogRail.astro BlogCards.astro Contact.astro Footer.astro ThemePicker.astro
                 PickerFab.astro DraftPill.astro Redirect.astro
  pages/
    [...theme]/index.astro   [...theme]/blog/index.astro   [...theme]/blog/[id].astro
    [...theme]/privacy/index.astro   [...theme]/lexchat/index.astro   404.astro
scripts/vendor.mjs                             # node_modules → public/vendor (D5)
harness/  parity.spec.ts  settle.ts  normalize.ts  urls.ts  __parity__/ (gitignored)
public/
  css/ (styles, mobile-styles, featured-carousel, theme-cycler, themes/*.css incl. 4 inactive)
  js/  (anim-utils, typing-engine, featured-carousel, script, cursor-follow, nav-behavior,
        theme-cycler, blog-post-client, blog-listing-client)          # classic scripts (D3)
  vendor/ (gitignored, generated)   vendor-static/boxicons/ (committed, D5)
  blog/blog-styles.css  blog/blog-listing-styles.css  blog/post.html (shim)  blog/posts/assets/*
  privacy/privacy-styles.css  lexchat/lexchat-styles.css  resources/*
  subsites/elise/12years/   embedded-swift-agent/ (location per §13 Q3)
  12years/index.html (redirect stub)   robots.txt
.github/workflows/deploy.yml  refresh-chart-data.yml
docs/prebake-cohort-data.py                     # OUT_DIR updated (T5)
```

### 3.2 `astro.config.mjs`

```js
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import { THEME_IDS } from './src/themes/registry.ts';

export default defineConfig({
  site: 'https://www.dawsonamf.com',
  output: 'static',
  trailingSlash: 'always',
  compressHTML: false,                 // D2: parity
  prerenderConflictBehavior: 'error',  // D2: theme id vs page name collisions
  build: { format: 'directory', inlineStylesheets: 'never' },
  markdown: { syntaxHighlight: false },// posts do not go through Astro's pipeline (D6)
  redirects: {                         // meta-refresh stubs; query-string cases are pages (§6.4)
    '/12years/': '/subsites/elise/12years/',
    // '/embedded-swift-agent/': …      // per §13 Q3
  },
  integrations: [sitemap({
    filter: (page) => !THEME_IDS.some((id) => new URL(page).pathname.startsWith(`/${id}/`))
                   && !/\/(404|blog\/post)\.html$/.test(page),
    serialize: (item) => { /* lastmod for posts from prose.posts[id].date */ return item; },
  })],
});
```

### 3.3 Build-time vs runtime boundary

Build time (TypeScript, typed): prose loading and validation, Markdown rendering, theme
registry, route generation, page composition, head emission, theme attributes and tokens,
static markup for everything that depends only on data (nav, cards, carousel, dock rows,
JSON-LD, sitemap, redirects).

Runtime (classic scripts in `public/js/`, contracts documented in `src/themes/README.md`):
intro reveals, typing masthead, jobs panel, carousel behavior, tilt, cursor follower, AOS,
sticky header, smooth scroll, Calendly popup, palette toy and dock open/close, code copy
buttons, mermaid, read time, blog filter.

Runtime reads build-time data from one inline blob (`ThemeRuntime.astro`, §5.4) and from
`<script type="application/json">` islands where a component owns the data (masthead
sequences, projects' tech for the ticker). No runtime code parses the prose file.

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
  titleSuffix: { xs: Dawson Metzger-Fleetwood }
  email: dawsonamf@icloud.com               # data, not prose
  footerCredit: { s: Designed and built by Dawson Metzger-Fleetwood }
meta:                                       # per page type: title, description, og
  home: { title: { s: Dawson Metzger-Fleetwood }, description: { m: "…" }, ogDescription: { s: "…" } }
  blog: …  post: { description: { s: A blog post by Dawson Metzger-Fleetwood. } }  privacy: …  notFound: …  lexchat: …
nav:
  about: { xs: About }  experience: { xs: Experience }  projects: { xs: Projects }
  blog: { xs: Blog }  contact: { xs: Contact }  resume: { xs: Resume }  email: { xs: Email }  theme: { xs: Theme }
  aria: { main: { xs: Main navigation }, quick: { xs: Quick links }, social: { xs: Social links } }
socials:                                    # order = render order; label doubles as aria-label
  - { id: linkedin, label: { xs: LinkedIn }, href: https://…, icon: "fab fa-linkedin" }
  - { id: calendly, label: { xs: Schedule a call }, calendly: true, icon: "far fa-calendar-alt" }
home:
  sections: { about: { xs: About }, jobs: { xs: Where I've Worked }, projects: { xs: Selected Works }, blog: { xs: Blog }, contact: { xs: Contact } }
  heroAlt: { xs: Dawson Metzger-Fleetwood }
  about: { title: { xs: About Me }, body: { l: | … 4 Markdown paragraphs … } }
  skills:
    title: { xs: Skills }
    groups:
      - { id: web, name: { xs: Web }, body: { l: "…" } }
      - { id: ios, name: { xs: iOS and visionOS }, body: { l: "…" } }
      - { id: ml,  name: { xs: ML and RL }, body: { l: "…" } }
  contact: { body: { m: "… [email](mailto:…) … [schedule a call](#calendly)." }, mapAlt: { xs: Map } }
  seeAllPosts: { xs: See all posts }
jobs:
  - id: about-objects
    company: { xs: About Objects }
    role: { xs: Software Engineer }
    url: https://www.aboutobjects.com/
    dates: { xs: July 2023 – Present }
    bullets: { l: [ "…", "…", "…", "…", "…", "…" ] }   # m: up to 3 bullets, written when a theme asks
projects:
  - id: silicon-fly
    title: { xs: Silicon Fly }
    description: { l: | … Markdown paragraphs … }
    image: /resources/Fly_Media.jpg
    tech: [ Metal, Swift, Compute Shaders, Connectomics, GPU ]     # xs list
    ctas: [ { label: { xs: Read the post }, href: /blog/fly-on-my-laptop/ }, { label: { xs: View on GitHub }, href: https://…, external: true } ]
posts:                                      # keyed by post id = src/content/posts/<id>.md
  fly-on-my-laptop:
    title: { s: There is a fly on my laptop and it runs away }
    date: August 2026
    excerpt: { m: "…" }
    tags: [ Swift, Systems ]
  autoencoders-1: { title: …, date: January 2024, excerpt: …, tags: [ AI & ML ], external: https://www.aboutobjects.com/… }
blog:
  intro: { l: | … 3 paragraphs … }
  sections: { works: { xs: Selected Works }, posts: { xs: All Posts } }
canonical:                                  # strings only the canonical layout uses
  masthead:
    home:    [ { steps: [ { type: "Hi,\nI'm Dawson,\nweb developer." }, { delete: 14 }, { type: "iOS developer." }, … ] }, … ]   # 9 sequences verbatim
    listing: [ … 7 sequences … ]
picker:                                     # the theme picker's own UI strings
  ariaLabel: { xs: Theme controls }  styles: { xs: Styles }  palette: { xs: Palette }  advanced: { xs: Advanced }
  backToStyles: { xs: Back to styles }  shuffle: { xs: Shuffle colors }  shuffleSub: { xs: random palette }
  reset: { xs: Reset }  resetSub: { xs: back to default }  advancedSub: { xs: scheme & colors }  doneEditing: { xs: done editing }
  scheme: { xs: Scheme }  colors: { xs: Colors }  current: { xs: current }  preview: { xs: preview }
  roles: { text: { xs: Text }, background: { xs: Background }, primary: { xs: Primary }, secondary: { xs: Secondary }, accent: { xs: Accent } }
  lock: { xs: Lock }  unlock: { xs: Unlock }
  schemes: { random: { xs: random }, monochromatic: { xs: monochromatic }, … }
themes:                                     # one entry per registry id; theme-specific strings live here
  default: { label: { xs: Default } }
  grid: { label: { xs: Swiss Grid } }
  chinoiserie: { label: { xs: Porcelain } }
  marquee: { label: { xs: Marquee }, ticker: { xs: "✷ WEB ✷ iOS ✷ VISIONOS ✷ MACHINE LEARNING ✷ REINFORCEMENT LEARNING" } }
  doodle: { label: { xs: Doodle }, currentlyHere: { xs: "currently here ✓" } }
privacy:
  title: { xs: Privacy Policy }  updated: { xs: Updated January 10, 2026 }  body: { l: | … 738 words of Markdown with ## / ### / lists … }
notFound: { code: { xs: "404" }, message: { s: This page doesn't exist, or it moved. }, back: { xs: Back to the home page } }
lexchat: { title: { xs: LexChat } }
```

Rules the schema enforces:

- A prose field is `Record<'xs'|'s'|'m'|'l', string | { draft: string } | null>` with at least
  one size. `bullets` is the same with string arrays. Chip/tag lists are `string[]` (each `xs`).
- `posts` keys must equal the set of `src/content/posts/*.md` ids (both directions).
- `themes` keys must equal the registry's ids; every entry has `label.xs`.
- `canonical.masthead` sequences: `delete` counts must not exceed the characters typed so far
  (today they are hand-counted and silently break on edit).
- In `--mode production` (the default for `astro build`), any `{ draft }` anywhere fails the
  build listing every path. `astro build --mode preview` renders drafts marked (D9).
- The `file()` loader swallows YAML syntax errors into an empty collection; an
  `astro:config:setup` hook parses the file itself and throws so a broken file is a failed build.

What existing text becomes: everything live today enters as approved `l` (bodies, bullets,
excerpts, descriptions) or `xs` (labels, chips, tags, theme labels, nav, picker strings), or
`s` (footer credit, titles, subtitles). No `m` or `s` variants are written in this spec; the
first structural theme's build will list what it needs and those arrive as drafts.

### 4.2 Accessor (build-time only)

```ts
import { prose } from '~/prose';
prose.get('home.about.body', 'l')                    // string (Markdown rendered to HTML)
prose.get('home.about.body', 'l', { paragraphs: 'br' })
prose.text('nav.about', 'xs')                        // plain text, entities escaped: attributes, <title>
prose.has('jobs.0.bullets', 'm')                     // false when null; throws when unwritten (recorded, D10)
prose.list('jobs.0.bullets', 'l')                    // string[] rendered inline
```

`get` on `null` returns `''` and the component omits the element. Markdown rendering is
marked 18.0.5 with `gfm: true, breaks: false` and the link rule from D16; inline-only for
`xs`/`s`, block for `m`/`l`. Output is injected with `set:html` on a `<Fragment>` so no
wrapper appears. `xs` strings never contain Markdown (schema: no `[`, `*`, `` ` ``).

### 4.3 Draft flow, standing rule, lint

`CLAUDE.md` gains: "Every new visitor-facing string enters `src/content/prose.yaml` as
`{ draft: … }`. Nothing ships until the owner clears it. Subsites under `public/subsites/`
and `public/embedded-swift-agent/` are exempt (they are verbatim copies)." The production
build is the gate. `npm run prose:check` runs the same tree walk in five lines for anyone who
wants a pre-push hook (`.githooks/pre-push`, enabled by the owner with
`git config core.hooksPath .githooks`; optional).

---

## 5. Theme engine

### 5.1 Registry (`src/themes/registry.ts`)

```ts
type Colors = { text: string; bg: string; primary: string; secondary: string; accent: string };
type RandomProfile = { light: Profile; dark: Profile };          // today's palette-toy shape, unchanged
interface ThemeBase {
  id: string;                     // URL segment; reserved: blog, privacy, lexchat, subsites, 404, _astro, vendor, css, js, resources, docs
  polarity: 'dark' | 'light';
  colors: Colors;
  tokens?: Record<`--${string}`, string>;
  fonts?: string[];               // Google Fonts css2 URLs; none for default and grid
  random?: RandomProfile;
}
interface SkinTheme extends ThemeBase {
  kind: 'skin';
  css?: string;                   // '/css/themes/<id>.css'; absent only for default
  flags?: { tilt?: false; still?: true };
  typing?: 'cursor' | 'letter' | 'word';
  typingDelete?: 'char' | 'word';
}
interface StructuralTheme extends ThemeBase {                     // designed here, no consumer yet (§11)
  kind: 'structural';
  owns: PageType[];                                               // 'home' | 'blog' | 'post'; utility pages never owned
  layouts: Partial<Record<PageType, AstroComponentFactory>>;
  extraPages?: { path: string; component: AstroComponentFactory }[];   // e.g. /mono/work/
  picker: { mount: 'own' } | { mount: 'fab'; corner: 'br' | 'bl' | 'tr' | 'tl' };
  modes?: { key: string; default: string; ids: string[]; vars: Record<string, Record<string, string>> };
  root?: { html?: string; body?: string };                        // theme-owned root CSS, never inherited by fallback pages
  breakpoint?: number;                                            // theme-owned; 1100 is canonical-only
  storageNamespace: string;                                       // `theme.<id>.` prefix for any client storage
}
export const THEMES: (SkinTheme | StructuralTheme)[] = [ /* default, then the 15 skins in ORDER */ ];
export const ORDER = ['default','brutalist','marquee','blueprint','field-notes','doodle','grid','miami-deco','bauhaus','chinoiserie','gallery','banknote','neo-pop','broadsheet','studio','wheatpaste'];
```

`label` is not in the registry: it is `prose.themes.<id>.label.xs`. The four inactive
sheets (`space`, `vapor`, `wanted`, `constructivist`) stay on disk under
`public/css/themes/` with no registry entry, as today. The registry module asserts at import:
unique ids, no reserved ids, every id has a prose entry, `ORDER` equals the id set.

### 5.2 Page composition

For every `(theme, pageType)` the page file picks the layout:

```
skin                               → canonical layout + theme assets (fonts, theme-base.css, skin css) on every page type
structural, pageType in owns       → theme.layouts[pageType]
structural, otherwise              → canonical layout + tokens + fonts only (no skin css, no theme.root, no theme scripts)
utility (privacy, 404, lexchat)    → canonical utility layout; skins as line 1, structural as line 3
```

Every page gets `ThemeRuntime.astro` (§5.4) and a picker mount: the canonical Nav renders the
`Theme` trigger and the dock; utility layouts render `PickerFab.astro`; structural themes place
`<ThemePicker />` in their own chrome or declare `picker.mount: 'fab'` with a corner.

### 5.3 Structural-kind contract (built by the first consumer, cream)

The interface above is the contract. Spec 1 ships: the discriminated type, the composition
rule, the tokens+fonts fallback path exercised by a build-time test with a stub structural
entry (not registered in `ORDER`), the reserved-id and root-CSS-leak assertions, the `href()`
helper, the picker mount API (`mount element + anchor element`, body-parented dock, theme-set
z-index), and namespaced storage. Spec 1 does **not** ship: any structural layout, modes UI,
preloader slot, smooth-scroll wrappers, extra pages. §11 maps each demand to where it lands.

### 5.4 Theme assets and runtime blob

`ThemeAssets.astro` emits, at the exact position today's bootstrap `<script>` tag occupied
(last in `<head>` on home/listing/privacy/404/lexchat; before `github-dark.min.css` on posts):
the theme's font `<link>`s, `/css/themes/theme-base.css`, then the skin sheet, each with
`data-style-asset="1"`. The layout stamps `<html data-style data-still data-no-tilt>` and the
inline `style` with tokens + the 100-property colour ramp (same `STEPS`, same `hsla()`
formatting, same `toFixed(0)` rounding as `theme-bootstrap.js:744-774`; the default theme gets
the ramp but no attributes, as today). Under marquee/doodle the `content:` custom properties
from D14 are added.

`ThemeRuntime.astro` is one `<script is:inline>` (pre-paint, ~8 KB):

```js
window.__THEME = { active: 'brutalist', kind: 'skin', flags: {tilt:false, still:true}, typing: 'cursor',
  typingDelete: 'char', page: '/blog/', order: [...], registry: { id: { label, polarity, colors, fonts, random } } };
window.__styleAllowsTilt = () => __THEME.flags.tilt !== false;   // same three globals the behavior scripts read today
window.__styleTypingMode = () => __THEME.typing || 'cursor';
window.__styleTypingDeleteMode = () => __THEME.typingDelete || 'char';
// palette-toy session override, applied pre-paint so toy users see no flash:
try { var s = JSON.parse(sessionStorage.getItem('dawson-theme-cycler')); if (s && s.colors && s.colors.length === 5) applyRamp(s.colors); } catch (e) {}
```

`?style=` shim: on default-theme pages the same script does
`var q = new URLSearchParams(location.search).get('style'); if (q && q !== 'default' && __THEME.order.includes(q)) location.replace('/' + q + location.pathname);`.

### 5.5 Picker behavior changes (`public/js/theme-cycler.js`)

Kept: dock geometry constants (`MEASURE 940`, `EDGE 10`, 300 ms hover-close, 440 ms hide),
`void dock.offsetWidth` (rAF is skipped under automation), hover-open gate, Space-to-shuffle,
palette generation, derived neutrals, `dawson:palette` (still no `detail`), `loadAllFonts`
(§13 Q5). Changed: `injectDom()` wires the server-rendered `#tc-dock`/`#tc-scrim` instead of
creating them; `switchStyle(id)` navigates to `href(page, id)`; `resetToDefault()` navigates
to the default path of the current page after clearing toy state; all UI strings come from
`data-*` attributes on the rendered dock (prose), including `Lock/Unlock <Role>` composition;
no reload detection. The dock's class names and nesting (`.tc-dock .tc-mega .tc-presets
.tc-action .tc-schemes .tc-role .tc-sw`) are part of the parity surface and do not change.

---

## 6. Pages, routing, URLs

### 6.1 Routes

`src/pages/[...theme]/…` with `themeParams()` returning `{ theme: undefined }` plus one entry
per non-default id. Page count: 16 themes × (home, listing, 11 posts, privacy, lexchat) = 240,
plus `404.html` and the shims. No page files exist outside `[...theme]/` except `404.astro`.

`href(path, theme)` prefixes site-internal paths (`/`, `/blog/`, `/blog/<id>/`, `/privacy/`,
`/lexchat/`, `/#about`) with `/<theme>` when `theme` is set; never subsites, resources,
external, or `mailto:`. Every internal link in every component goes through it. Themed pages
carry `<link rel="canonical" href="<default url>">` and `<meta name="robots" content="noindex">`;
default pages carry canonical to themselves.

### 6.2 Head order (parity)

`Head.astro` writes today's tags by hand, per page type, in today's order: meta → favicons →
OG → third-party CSS (`/vendor/fontawesome/css/all.min.css`, `/vendor-static/boxicons/boxicons.min.css`,
`/vendor/aos/aos.css`, Calendly css) → `/css/styles.css` → `/css/mobile-styles.css` → page CSS
→ `/css/theme-cycler.css` → `<ThemeAssets />` → `<ThemeRuntime />` → the page's script tags
with today's sync/defer/async attributes. No frontmatter CSS imports anywhere in the canonical
family (they would land in Astro's injected block at an uncontrolled position).

### 6.3 Utility pages

`privacy`, `404`, `lexchat` become Astro pages on the canonical utility layout (logo header,
content, footer, no nav) plus `PickerFab.astro` (D12). `404.astro` uses root-absolute paths and
renders the default theme only. `lexchat` keeps the full-viewport iframe.

### 6.4 Redirects and shims

| Old | New | Mechanism |
|---|---|---|
| `/?style=<id>` (any page) | `/<id>/<same page>` | inline script in `ThemeRuntime` (§5.4); `?style=default` → same page |
| `/blog/post.html?id=<id>` | `/blog/<id>/` | `public/blog/post.html`: inline `location.replace`, meta-refresh fallback to `/blog/`, canonical `/blog/` |
| `/12years/` | `/subsites/elise/12years/` | `redirects` config (meta refresh) |
| `/embedded-swift-agent/` | per §13 Q3 | `redirects` config if it moves |
| `/docs/*`, `/CLAUDE.md` | gone | none (D22) |

### 6.5 Subsites

`public/subsites/elise/12years/{index.html,then.jpeg,now.jpeg}` verbatim (page-relative
paths only; its own gsap 3.12.5 from cdnjs stays). `embedded-swift-agent/` (4 files, `agent.js`
has a bare `+esm` import Vite must never see) verbatim at the location decided in §13 Q3.
Project CTAs in `prose.projects` point at the final URLs.

---

## 7. Blog

- Collection `posts`: `glob({ pattern: '*.md', base: './src/content/posts' })`,
  `generateId` = filename without `.md`, frontmatter schema `{ scripts?: string[]; styles?: string[] }`,
  `retainBody: true`. Titles, dates, excerpts, tags come from `prose.posts[id]` (D8).
- Rendering (`src/prose/markdown.ts`, shared with prose fields): marked 18.0.5, `gfm: true`,
  `breaks: false`, renderer overrides copied from `blog/blog-post.js:4-30`: `link` → `.text-link`
  (+ `target=_blank rel="noopener noreferrer"` for http(s)), `image` → `<img class="blog-image">`,
  `code` → `<div class="mermaid">` for `mermaid`, else `<pre><code class="hljs language-<lang>">`
  via `hljs.highlight` from `highlight.js/lib/common` (the exact 36-language set the CDN ships),
  else `highlightAuto` (unreachable today; kept for behavior parity). Raw HTML passes through.
- Page head: `<title>{title} | {suffix}</title>`, description = excerpt, canonical, OG
  title/description/url/image (site avatar; per-post images are intent §7), JSON-LD `BlogPosting`
  with the same fields `blog-post.js:56-88` builds today, `github-dark.min.css` from `/vendor/`,
  per-post `styles` as `<link>`s.
- Body: `article.blog-post-container > header > h1#post-title + div#post-meta (pills: date,
  tags, read-time span)` + `div#post-content` with the rendered HTML, exactly today's DOM
  (`research/page-behavior-and-blog-pipeline.md` §5.6). Per-post `scripts` are emitted as
  classic `<script src>` tags at the end of `<body>` in frontmatter order (sequential by
  construction, matching today's chained loader).
- Client (`public/js/blog-post-client.js`, small): copy buttons (`.has-copy-btn` + button
  markup verbatim), `mermaid.run` after lazily injecting `/vendor…`/CDN mermaid **only when
  `.mermaid` exists**, read time (`Math.max(1, Math.round(words/200))` from `innerText`, kept
  client-side so the number cannot drift), tilt on `.blog-image` gated on `__styleAllowsTilt`.
  The mermaid `initialize` block stays `is:inline` and after `ThemeAssets`, reading the same
  three custom properties with the same fallbacks.
- Listing: cards rendered at build (`BlogCards.astro`, same markup as `blog-listing.js:123-152`
  incl. `data-aos-delay={i*50}`), filter pills from the sorted tag set; behavior
  (`blog-listing-client.js`): typing masthead, intro wave, filter toggling `.filtered-out`,
  `AOS.init({offset:50})` + refresh-on-resize, tilt. Home rail cards rendered at build likewise.
- Assets: `public/blog/posts/assets/*` verbatim; fetch URLs inside `cohorts-chart.js` and
  `job-market-chart.js` rewritten to `/blog/posts/assets/…`; `.github/workflows/refresh-chart-data.yml`
  and `docs/prebake-cohort-data.py` updated to the `public/` path. The unpublished
  `ai-job-market` assets ride along untouched.
- `sitemap.xml` generated (D24); `robots.txt` in `public/`.

---

## 8. Behavior runtime (`public/js/`)

Per file, what changes (everything else is verbatim, same constants):

| File | Removed (now build-time) | Kept / changed |
|---|---|---|
| `theme-bootstrap.js` | entire file | replaced by `ThemeAssets` + `ThemeRuntime` (§5.4) |
| `nav-config.js` | config objects, `buildNavItems`, all `innerHTML` rendering | → `nav-behavior.js`: sticky header (`SCROLL_THRESHOLD 300`), Calendly click with the palette-derived URL |
| `blog-data.js` | entire file | data lives in prose; carousel/rail/cards are components; the ticker run is computed at build (same dedupe, `✷`, ×2, `402/46`) and emitted on `<html>`; `featured-carousel.js` keeps everything except `renderFeaturedCarousel` and `buildTickerRun` |
| `script.js` | `renderBlogCards`, the inline masthead sequences | reads sequences from the JSON island; intro wave, jobs panel, smooth scroll, tilt, AOS unchanged; still `defer`, still after `nav-behavior.js` |
| `blog-listing.js` | card + filter-bar rendering | → `blog-listing-client.js` (§7) |
| `blog-post.js` | fetch, frontmatter, marked, JSON-LD, asset loading | → `blog-post-client.js` (§7) |
| `theme-cycler.js` | dock construction, `?style=` navigation, reload wipe | §5.5 |
| `typing-engine.js`, `anim-utils.js`, `cursor-follow.js` | nothing | verbatim |

Load order per page type is copied from today's `<head>`/`<body>` verbatim, including the
asymmetries (AOS/tilt/anim-utils sync on the listing, defer on home; `vanilla-tilt` sync
everywhere; `anim-utils.js` sync). `research/theme-engine-contracts.md` §6 is the table.

Vendor map (`scripts/vendor.mjs`): `jquery/dist/jquery.min.js`, `jquery-ui-dist/jquery-ui.min.js`,
`gsap/dist/gsap.min.js`, `aos/dist/aos.{js,css}`, `vanilla-tilt/dist/vanilla-tilt.min.js`,
`highlight.js/styles/github-dark.min.css`, `@fortawesome/fontawesome-free/{css/all.min.css,webfonts/*}`.
Sha256 of each copied file is asserted against the values in `research/library-migration.md`
once, in T4, then the script just copies.

---

## 9. Parity harness (`harness/`)

**Definition of parity** (all must hold, per theme × page × viewport × state):

1. Normalised DOM dump equal (`expect(newLines).toEqual(oldLines)`), taken after `settle()`.
2. `toHaveScreenshot` within `maxDiffPixelRatio: 0.001`, `threshold: 0.2`, `animations: 'disabled'`,
   `caret: 'hide'`, `scale: 'css'`; the masthead is masked and asserted as text separately.
3. Computed-style sample equal (exact): the five colour roles and every `--*` token on `<html>`,
   plus `color/background-color/font-family/font-size/line-height/border-radius` on 12 sentinel
   selectors per page type.
4. No 4xx/5xx network response on either side (catches broken asset paths silently).
5. No page references a script it did not reference today (grep of built HTML; also the
   §3.3 lean guard for future themes).

**Matrix:** 16 themes × pages {home, listing, `toolbelt` (mermaid + bash/json), `embedded-swift-agent`
(swift/c + image), `metr-doubling` (Plotly + assets), privacy, 404} × {desktop-1440, mobile-390}
× states {settled, job tab 2 clicked, carousel dot 3 clicked, theme menu open (click, not hover),
filter `Swift` (listing only), sticky nav after scroll 400→200 (desktop home), smooth-scroll to
`#contact` (desktop home)}. Sharded by theme (`--grep @theme:<id>`), ~15 min full sweep.

**Old side:** `PARITY_OLD_DIR` (default `../personal-website-old`), a detached worktree of
`main` at the baseline SHA, created by the owner (§14), read-only, served by
`python3 -m http.server --bind 127.0.0.1 8781 --directory …`. URL pairs in `harness/urls.ts`:
`/?style=x` ↔ `/x/`, `/blog/?style=x` ↔ `/x/blog/`, `/blog/post.html?id=p&style=x` ↔ `/x/blog/p/`,
`/privacy/?style=x` ↔ `/x/privacy/`, `/404.html` ↔ `/404.html`. Fresh browser context per test.

**Determinism:** one `addInitScript` seeding `Math.random` (mulberry32, seed 3 → home sequence
index 3, the fastest settle; a second mobile shot seeded to index 1 covers the taller
`min-height` reservation); `page.emulateMedia({ reducedMotion: 'no-preference' })`; mouse never
moves before capture (cursor follower stays at opacity 0); `route.abort` for
`assets.calendly.com`, `corsproxy.io`, the four museum APIs, `raw.githubusercontent.com`;
fonts never blocked, `document.fonts.status === 'loaded'` awaited after the cycler's idle font
load. `page.clock` is optional and only used if the typing settle proves flaky.

**`settle(page)`:** `load` → fonts loaded → every in-viewport `[data-aos]` has `aos-animate`
→ `document.getAnimations()` has nothing finite running → the page-type condition from
`research/page-behavior-and-blog-pipeline.md` §3 (masthead text is one of the terminal strings
and `.cursor` animates `blink`; the 8 intro elements carry inline `animation: none`; `#highlight`
has geometry; carousel has 8 cards + 8 dots, one active; `#read-time` matches `/^\d+ min read$/`;
every `.mermaid` has an `svg`).

**Normaliser (`normalize.ts`):** drops `<script>`/`<noscript>`; sorts attributes; collapses
whitespace; maps old link forms to new (`index.html#x`/`../index.html#x` → `/#x`,
`blog/post.html?id=p` and `post.html?id=p` → `/blog/p/`, `../blog/` → `/blog/`,
`resources/…`/`../resources/…` → `/resources/…`, CDN URLs → `/vendor/…`, `/?style=x` → `/x/…`);
strips `/_astro/HASH`, `data-astro-*`, the post page's runtime-added `<link>`s in `<head>` order
differences are not normalised (they must match). The dump keeps `<html style>` verbatim: the
new build reproduces the ramp exactly (§5.4). A second, pre-settle dump of the raw served HTML
separates "emitted HTML differs" from "JS produced a different DOM".

**Config:** `reporter: [['html', { open: 'never' }], ['list']]`; `webServer` array with
`gracefulShutdown`; `snapshotPathTemplate` without site or platform; `harness/__parity__/`
gitignored. Guard test: `matchMedia('(hover: hover) and (pointer: fine)')` is `true` on desktop
and `false` on mobile (assert, do not assume). After the first run, check
`lsof -nP -iTCP:8781 -sTCP:LISTEN` returns nothing.

**Manual QA list** (owner, ordered by skin as intent §4.9 asks): tilt feel on cards/carousel/
post images; cursor follower; hover states on nav, pills, dock rows; palette toy shuffle/scheme/
lock/colour input; marquee tickers and glyph headers; mobile jobs rail scroll; Calendly popup
colours; reduced-motion pass (`emulateMedia` run of the suite is automated; the feel is not).

---

## 10. Deploy and cutover

`.github/workflows/deploy.yml` exactly as `research/deploy-and-parity-harness.md` §2.2
(`checkout@v7`, `setup-node@v7` with `node-version-file: .nvmrc` and `cache: npm`, `npm ci`,
`npx astro build`, `upload-pages-artifact@v5` of `dist`, `deploy-pages@v5` in a `github-pages`
environment, `concurrency: pages`, `workflow_dispatch` input `deploy: false` for dry runs).
`refresh-chart-data.yml`: paths → `public/blog/posts/assets/`, `permissions: actions: write`,
`gh workflow run deploy.yml --ref main` when the commit happened.

Cutover runbook (owner drives, agent prepares commands; each step separately approved):

1. Parity green on every theme; manual QA signed; `npm run build` clean in production mode.
2. `gh api /repos/dawsonamf/personal-website/pages --jq '{build_type,cname,https_enforced}'` (record).
3. Dispatch `deploy.yml` on the `astro` branch with `deploy: false`: artifact builds and uploads
   while Pages is still legacy (only `deploy-pages` needs the flip).
4. `gh api --method PUT /repos/dawsonamf/personal-website/pages -f build_type=workflow`
   (fallback body with `source` if it 422s). The last legacy deployment keeps serving.
5. Merge `astro` → `main` (one merge, intent §4.11). Push triggers the deploy. Watch it.
6. Verify live: `/`, `/brutalist/blog/toolbelt/`, `/blog/post.html?id=helm`, `/12years/`,
   a bogus path (custom 404), `https_enforced` unchanged, `dawsonamf.com` → `www`.
7. Rollback: `-f build_type=legacy` + revert the merge commit. `CNAME`/`.nojekyll` at the repo
   root make the legacy path work again.

---

## 11. Desk-check against the five structural themes

From `research/structural-theme-demands.md` §3 (40 capabilities) plus illoca (intent §6.5,
added after the research pass). Where each lands:

| Demand | Spec 1 provides | Left to the theme spec |
|---|---|---|
| Own DOM per page type; own `<head>`; own root CSS incl. `html{font-size:1vw}` | `kind: 'structural'`, `owns`, `layouts`, `root`; **fallback pages never inherit `root`**, asserted by a build test | the layouts |
| Own nav with a picker mount; full-screen menu; no always-visible control | `<ThemePicker mount anchor />` body-parented, z-index prop; `picker: 'own' | 'fab'+corner` | placement (§13 Q9) |
| Floating fallback | `PickerFab.astro` (D12) | corner choice |
| Theme-only routes (`/mono/work/`, mosbyfiles About) | `extraPages` in the registry, emitted only under that theme; 404 elsewhere | pages |
| Unowned page types in theme tokens + fonts | composition rule §5.2 | none |
| Theme scripts only on theme pages; two GSAP versions | layouts emit their own tags; `"gsap-next": "npm:gsap@3.15.0"` alias reserved for themes (`research/library-migration.md` §3.2) | imports |
| Internal colour modes coexisting with picker and toy | `modes` in the registry; pre-paint stamp via `ThemeRuntime`; `dawson:palette` on change; toy hidden when `modes` present (D26) | mode UI, wipe |
| Prose by slot and size with null; theme-specific strings; ordered fragment arrays; structural constraints (starts with "I", one line) | accessor §4.2; `themes.<id>.*` free-form section validated by a per-theme zod fragment the theme registers; schema helper `fragments(n)` for fixed-length `xs` arrays; per-slot `constraints` (max lines, initial letter) as schema refinements | the strings, as drafts |
| New fields: project `category`, `year`; `jobs[i].summary` (m); `projects[i].description` (s) | schema accepts them now as optional; nothing writes them | drafts |
| Socials with labels, icons, grouping, GitHub | `socials[]` already carries label + icon; `group` optional field added | GitHub entry (owner) |
| Image grid from project images; responsive sizes | `projects[].image` + optional `images[]`; no image pipeline (intent §7) | sizes |
| Preloader/curtain before content; no-JS path; reduced-motion | a `chrome` slot rendered before `<main>` in the page shell; README rule: every structural theme ships `<noscript>` and a reduced-motion branch | content |
| Smooth-scroll wrappers (ScrollSmoother needs `#smooth-wrapper > #smooth-content`; Lenis on `window`) | the page shell lets a layout own everything inside `<body>` except `ThemeRuntime` and the picker/draft mounts | wrapper |
| Different mobile structure; theme breakpoint | D25; `breakpoint` field | CSS |
| Document-level SVG defs; theme storage keys | `<defs>` slot with `theme-<id>-` id prefix convention; `storageNamespace` | usage |
| Split-text safety (plain text only) | `prose.text()` for such slots; README rule | usage |
| Contact form → mailto; stats/testimonials omitted | `null` sizes + section-level omission in data-driven page composition | choices |
| WebGL canvases (three.js/OGL), Rive, video demos, self-hosted paid fonts, cursor coordinate readout (illoca) | same mechanisms: theme scripts/assets only on its pages (§5.2, §9 check 5), `chrome` slot, theme-owned `<head>` for fonts; a `public/themes/<id>/` asset directory convention for video/GLB; no engine change | recorded clips and font licensing (owner), drafts for tags/one-liners/FAQ |

Nothing in the five themes requires a change to the registry shape, the routing, the prose
accessor, or the composition rule as specified. Cream (first consumer) will exercise
`chrome`, `picker`, `root`, `extraPages: none`, GSAP alias, and `themes.cream.*` constraints;
if it finds a gap, it fixes the engine (intent §8).

---

## 12. Tickets

Order is dependency order; T2/T3 can run in parallel after T0; T7 can run any time after T3.
Each ticket ends with the harness green for its scope (T0/T1/T7/T9 excepted).

| # | Ticket | Delivers | Done when |
|---|---|---|---|
| T0 | **Spike: Astro 7 on this markup** | Astro 7.3.1 scaffold on the `astro` branch/worktree; `index.html` ported verbatim into one page; `compressHTML:false`; build. Settles the nine unverified items in `research/astro-capabilities.md` §3 (Rust compiler accepts today's HTML; head insertion point; `[...theme]` undefined param; redirect output; `404.html`; dotfiles in `public/`; failing the build from `astro:build:done`; `is:inline` behaviors; `python3 -m http.server --bind` + Playwright 1.61.1 run with cached Chromium). | A `research/spike-findings.md` with each item answered; installs approved and recorded (§14). |
| T1 | **Parity harness v1 (old vs old)** | `harness/` per §9 against the baseline worktree on both ports; DOM dump, screenshots, token sample, settle, seeds, interactions, URL map, reporter config. | Old-vs-old run is green for all 16 themes × 7 pages × 2 viewports × 7 states; listeners gone after the run. |
| T2 | **Prose model** | `prose.yaml` with every string from `research/prose-and-url-inventory.md` migrated verbatim (`l`/`xs`/`s`), schema, sizes, null, drafts, production gate, unwritten-size report, accessor, marked wrapper (D15, D16), preview marking + pill (D9), `CLAUDE.md` rule, `prose:check`. Resolves §13 Q1 metadata once the owner answers. | `astro build` fails on a planted draft listing it; `--mode preview` renders it red; a planted unwritten request fails with the list; unit test: every field renders to exactly today's HTML fragment (fixture from the old files). |
| T3 | **Registry, routing, theme assets** | `registry.ts`, `paths.ts`, `[...theme]/` pages (empty layouts ok), `ThemeAssets`, `ThemeRuntime`, `href()`, canonical/noindex, `?style=` shim, reserved ids, `prerenderConflictBehavior`, structural-kind types + fallback test (§5.3), `README.md` skeleton. | Build emits 240 pages; `<html>` attributes/inline ramp byte-equal to today for each theme (unit test against `theme-bootstrap.js` output captured in T1); a stub structural theme's blog page has tokens but no `root` CSS. |
| T4 | **Canonical home** | `Head`, `Nav`, `Hero`, `About`, `Jobs`, `FeaturedCarousel`, `BlogRail`, `Contact`, `Footer`, `ThemePicker` (dock rendered at build); `public/js/` edits per §8; `scripts/vendor.mjs`; Boxicons static copy; masthead JSON island; ticker vars at build. | Harness green for home × 16 × 2 × all states. |
| T5 | **Blog listing and posts** | posts collection, marked-at-build, per-post head, assets as tags, `blog-post-client.js`, `blog-listing-client.js`, `BlogCards`, `post.html` shim, `.md` link rewrites, frontmatter cleanup, R1 fetch-URL fix, chart workflow paths, sitemap integration. | Harness green for listing + the 3 posts × 16 × 2; every one of the 11 posts builds; `/blog/post.html?id=helm` lands on `/blog/helm/`; no 4xx in the network log on any post. |
| T6 | **Utility pages, FAB, subsites, redirects** | privacy/404/lexchat pages; `PickerFab` (new UI, owner preview); `public/subsites/elise/12years/`, embedded-swift-agent placement; redirect stubs; `robots.txt`; `docs/` unpublished. | Harness green for privacy/404 with the FAB allow-listed; owner approves the FAB visually on 3 skins; old subsite URLs land on the new ones. |
| T7 | **Deploy workflow** | `deploy.yml`, `.nvmrc`, `refresh-chart-data.yml` patch, `prebake-cohort-data.py` OUT_DIR. | Dry run (`deploy: false`) on the `astro` branch uploads an artifact; a manual `workflow_dispatch` of `refresh-chart-data.yml` dispatches `deploy.yml` (visible in Actions), Pages still legacy. |
| T8 | **All 16 themes green + manual QA** | The full harness matrix; per-skin fixes (D14 sheet edits; stale `.tc-toggle` rules audited against the real FAB); manual QA list run by the owner, ordered by skin. | Full sweep green; owner sign-off recorded in `research/qa-signoff.md` per skin. |
| T9 | **Docs and cutover** | `CLAUDE.md` rewrite, `src/themes/README.md` (registry, kinds, slots, runtime contracts, hard-won rules carried over and corrected), banner on `docs/theme-explorations.html`, runbook §10 executed with the owner. | Live site serves from Actions; §10 step 6 checks pass; rollback command recorded. |

Rough size: T0 half a day; T1 two days; T2 two days; T3 one day; T4 three days; T5 three
days; T6 one day; T7 half a day; T8 two to four days (owner QA bound); T9 one day.

---

## 13. Questions only the owner can answer (batch for the grilling session)

Each has the default this spec assumes. Answers change T2/T5/T6 scope only.

| # | Question | Default assumed |
|---|---|---|
| Q1 | **Post metadata conflicts.** `helm`: listing says *"Helm: A Minimalist Workspace Switcher for your IDE" / April 2026*, the post file says *"Helm: A Workspace Switcher for VS Code and Cursor" / March 2026*. `metr-doubling`: *January* vs *February 2026*. Which wins? | Post-file values (they are what a reader of the post sees). |
| Q2 | **Unlisted and duplicate posts.** `gemma4-heretic-ara` is live and in the sitemap but commented out of the listing: list it (its commented excerpt/tags would need your approval) or keep it unlisted? `autoencoders-1/2` exist locally but the listing links to aboutobjects.com: keep the local copies published at `/blog/autoencoders-1/` (and link them?), or drop them and redirect to the external posts? `color-randomizer` sitemap entry is a live 404: drop it? | gemma4 stays unlisted but is prerendered and in the sitemap (as today); autoencoders local copies stay published, listing still links external (as today), both in the sitemap; color-randomizer dropped. |
| Q3 | **Where does `/embedded-swift-agent/` live?** Intent §4.8 groups subsites by person, but this is your own project demo, linked from a project CTA, a post body and the sitemap. `/subsites/dawson/embedded-swift-agent/`, `/subsites/embedded-swift-agent/`, or leave it at `/embedded-swift-agent/` (no redirect needed)? | Leave it at `/embedded-swift-agent/`; `subsites/<person>/` is for pages made for people. |
| Q4 | **Picker on privacy, 404 and lexchat.** Today they have none (the FAB in the docs never existed). Building it is new UI: a fixed bottom-right button with the palette icon opening the same dock. Do you want it on all three, or exempt lexchat (a full-viewport iframe app shell)? You will see it before it ships. | All three, bottom-right. |
| Q5 | **`loadAllFonts`.** The picker fetches all 14 Google Fonts stylesheets on every page after idle so the dock's style rows render in their own fonts. Keep (parity, 14 requests per page) or load them on first dock open (lean, brief font flash in the dock)? | Keep for parity; cleanup pass changes it. |
| Q6 | **CSS counter prefixes and glyphs** (`FIG. 01`, `№ 3`, `(01)`, `✷`, `■`, `·`, `/`) in blueprint, field-notes, banknote, marquee, studio, brutalist, gallery: prose (editable in the YAML) or decoration (stays in CSS)? Only marquee's ticker and doodle's "currently here ✓" move regardless. | Decoration. |
| Q7 | **Home masthead duplicates.** Sequences 5-8 are two exact duplicate pairs, so "builder." runs on 4 of 9 loads. Intentional weighting? | Keep verbatim. |
| Q8 | **`docs/` stops being public** (`/docs/theme-explorations.html`, three unpublished post drafts, `/CLAUDE.md`, `/docs/TODO.md` are live URLs today). OK to drop without redirects? | Yes. |
| Q9 | **Structural themes and the picker** (shapes the mount API): may a structural theme hide the global picker inside its own menu with no always-visible control (cream has no room; mono's bottom-right is taken)? | Yes; the FAB is only for themes that mount nothing. |
| Q10 | **Palette toy on structural themes and mono's modes.** Hide the toy on themes that declare their own colour modes (it can only reach 2 of mono's 11 variables and would break cream's single-ink design)? Should a theme's internal mode persist for the session (not in the URL)? | Hide it there; session persistence, namespaced key. |
| Q11 | **Subsites and the prose rule.** `12years/` (~450 words you wrote) and `embedded-swift-agent-context.md` (a public bio the agent reads to visitors) are verbatim copies outside `prose.yaml`. Exempt them explicitly in `CLAUDE.md`? | Exempt. |
| Q12 | **Palette-toy state on reload.** Today a reload clears both the theme and the toy. The theme now survives reload (intent §4.5). Should the toy's colours survive too? | Yes (no reload detection at all). |

---

## 14. Owner actions this spec needs (not questions)

1. **Node 24 LTS** on your machine (Astro does not support 25). Install approval needed for
   whatever manager you use (`brew install node@24`, `nvm install 24`, or `fnm`). `.nvmrc` = `24`.
2. **Install approvals**, requested again at execution time, one command each:
   `npm install --save-exact astro@7.3.1 @astrojs/sitemap@3.7.4 js-yaml@4.3.0 marked@18.0.5 highlight.js@11.9.0 jquery@3.6.0 jquery-ui-dist@1.12.1 aos@2.3.1 vanilla-tilt@1.7.0 gsap@3.9.1 @fortawesome/fontawesome-free@6.5.1`
   and `npm install --save-dev --save-exact @playwright/test@1.61.1` (no browser download at
   1.61.1; any newer version needs `npx playwright install chromium`, ~150 MB). `js-yaml` is
   pinned to the 4.x line Astro itself depends on (`^4.3.0`) so npm installs one copy; 5.x exists
   but is not needed. All versions above were confirmed on the registry on 2026-09-05.
3. **Commit the prototypes** (`docs/*-prototype*.html`, `docs/intents/`): they are untracked;
   specs 2-3 start from two of them.
4. **Create the baseline worktree** once: `git worktree add --detach ../personal-website-old 0f196d0`
   (the harness only reads it; it never runs git there). And the working branch:
   `git worktree add ../personal-website-astro -b astro`.
5. **Cutover** steps 2, 4, 5 in §10 are yours to run (repo settings + merge).
6. **Manual QA** in T8, ordered by skin.

---

## 15. Deliberate visible changes (harness allow-list)

1. Theme in the URL (`/<id>/…`); reload keeps the theme; switching keeps the current page (D11).
2. Palette-toy state survives reload (D11, Q12).
3. Theme picker FAB on privacy, 404, lexchat (D12, Q4).
4. Posts at `/blog/<id>/` with real `<title>`, description, canonical, OG, JSON-LD in the served
   HTML; no "Loading…" title; old URL redirects via a shim page.
5. `/12years/` moves under `/subsites/elise/`; embedded-swift-agent per Q3.
6. Generated sitemap (entries and `lastmod` change; `color-randomizer` gone).
7. `docs/` and `CLAUDE.md` no longer served (Q8).
8. Third-party files served from `/vendor/` instead of CDNs (byte-identical; mermaid, Plotly,
   js-yaml still CDN). Mermaid loads only on posts that have a diagram.
9. Dock markup is in the served HTML instead of built by JS (identical after load).
10. Themed pages carry `canonical` + `noindex`.

Everything else, on every page, at both viewports, in every listed interaction, must match
today's site to the harness's tolerances and to your eye.

---

## 16. Traceability

| Intent | Where |
|---|---|
| §3.1 prose ownership | §4, D7-D10, D14-D17, Q6, Q11 |
| §3.2 parity | §9, §15, T1, T8 |
| §3.3 lean | D5, §5.2 fallback (no theme scripts), §9 check 5, §11 GSAP alias |
| §3.4 done properly | §3.3 boundary, typed registry §5.1, accessor §4.2, D3 stated |
| §3.5 URLs | §6.4 |
| §3.6-3.7 structural freedom, four consumers | §5.3, §11 |
| §4.1-4.13 locked decisions | D1-D2 (stack), §4 (sizes, file, drafts), §6 (paths, posts, coverage, subsites), §9 (harness), §10 (deploy, worktree), D5 (libraries), D3 (behavior policy) |
| §5 delegated | §2 |
| §9 undecided | D7 (YAML shape), D25 (mobile), D26 (modes), D9 (draft toggle), D10 (budgets), §6.1 (canonical/noindex/sitemap), D23 (explorations doc), §9 (thresholds, viewports, settling) |
