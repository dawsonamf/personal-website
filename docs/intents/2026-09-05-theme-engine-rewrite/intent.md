# Intent: theme engine rewrite and structural themes

**Written:** 2026-09-05, from a grilling/brainstorming session with the site owner.
**Status:** intent, not a spec. A later session with a fresh agent splits this into
specs (see §8). Nothing below has been built.
**How to read this:** §3 is the owner's hard requirements (non-negotiable). §4 is
what was decided in the session (locked unless the owner reopens it). §5 is what
the owner delegated to agent judgment (latitude, but say what you chose). §6 is
per-theme detail for the five consumers (§6.5 was added after the session). §9 lists what is deliberately undecided.

---

## 1. Goal

Rebuild the theming engine, and as much of the site's HTML/CSS/JS as that
requires, so that a theme can change not just the skin but the **structure**
of the site: different DOM, different information architecture, different nav
labels, different amount of prose per section, its own libraries and assets,
its own mobile layout, even its own extra pages. Today every theme is the same
structure with a different coat of paint (only `marquee` fakes structural
change, and it does it purely in CSS).

Two things matter as much as the engine itself:

1. **The owner controls every word on the site.** All visitor-facing prose lives
   in one place, in sizes, and nothing unapproved ever ships (§3.1, §4.3, §4.4).
2. **Nothing the owner likes today may change noticeably.** The default site and
   all sixteen active skins must survive the rewrite indistinguishably to the
   owner, on every page, at every screen size, in every behavior (§3.2).

Then five new structural themes get built on the engine, each a separate
consumer based on its own reference (§6), the engine first and the existing
themes migrated before any new one.

### Non-goals (for the engine work)

- Not blending the five references into one theme. Five themes, five references.
- Not implementing case studies (§7), not moving blog posts out of Markdown (§7).
- Not a cleanup pass on legacy libraries beyond what the migration forces (§7).
- Not a visual redesign of the default theme. Parity, not improvement.

---

## 2. Current state (verified 2026-09-04)

Static site, no build step, GitHub Pages serving `main:/` (legacy mode), CNAME
`www.dawsonamf.com`, public repo `dawsonamf/personal-website`. Conventions in
`CLAUDE.md`. Theme architecture is documented in the HTML comment at the top of
`docs/theme-explorations.html`; that comment is accurate and worth reading in
full before designing the new engine. The owner delegates code to agents and
did not personally verify this model of the current state; it was verified by
reading the files listed here, and the owner agreed with it.

**Pages:** `index.html` (home), `blog/index.html` (listing), `blog/post.html?id=`
(post, client-rendered from `blog/posts/*.md` by `blog/blog-post.js`),
`privacy/`, `404.html`, `lexchat/` (iframe), and two standalone unthemed pages
`12years/` and `embedded-swift-agent/`.

**Theme engine:** `js/theme-bootstrap.js` (synchronous, pre-paint; registry of
styles with `id`, `label`, `polarity`, five colour roles, `tokens`, `fonts`,
`css`, `flags {tilt, still}`, `typing`, `random` profiles; stamps
`data-style` on `<html>`, appends `css/themes/theme-base.css` + the skin sheet).
`js/theme-cycler.js` (mega-menu picker in the nav, palette toy that randomizes
the five roles, session-only persistence; switching a style navigates to
`/?style=<id>`; reload returns to default). Sixteen active skins in `ORDER`:
default, brutalist, marquee, blueprint, field-notes, doodle, grid ("Swiss Grid"),
miami-deco, bauhaus, chinoiserie ("Porcelain"), gallery, banknote, neo-pop,
broadsheet, studio, wheatpaste ("Street Poster"). Four skin sheets exist but are
inactive (space, vapor, wanted, constructivist); keep the files, keep them
inactive. Every skin rule is scoped under `[data-style="<id>"]` and targets the
canonical DOM's ids/classes, which is why the canonical DOM must be reproduced
exactly (§3.2).

**Where prose lives today (scattered, the problem):** `index.html` (about,
skills, jobs, contact, footer), `blog/index.html` (intro paragraphs),
`js/blog-data.js` (`FEATURED_PROJECTS` descriptions and CTAs, `BLOG_POSTS`
excerpts and tags), `js/script.js` and `blog/blog-listing.js` (typing-masthead
sequences), `js/nav-config.js` (nav and social labels), `404.html`, skin CSS
`content:` strings (marquee's tickers), alt text and aria-labels in HTML.

**Behavior code worth knowing before touching it:** intro reveals pin final
styles on `animationend` (`js/anim-utils.js`); the jobs highlight bar writes
measured geometry inline (`js/script.js`); menu items are measured at load;
`featured-carousel.js` has a wheel guard and dots; `typing-engine.js` picks a
random sequence per load and has cursorless modes driven by the registry;
skins with `flags.still` kill AOS, the cursor follower and tilt via
`theme-base.css`. The "JS contracts + hard-won rules" section of
`docs/theme-explorations.html` lists the traps.

**Libraries (CDN, pinned):** gsap 3.9.1 (loaded on home, never called), jQuery
3.6.0 + jQuery UI 1.12.1 (smooth-scroll easing only), AOS 2.3.1, vanilla-tilt
1.7.0, Calendly widget, Font Awesome 6.5.1, Boxicons 2.0.9, highlight.js 11.9.0
(github-dark theme), marked 18.0.5, mermaid 11.15.0.

**Prototypes (untracked in git as of writing; the owner should commit them so
later sessions have them):** `docs/cream-prototype.html` (port of lannino.com),
`docs/mono-prototype.html` (port of bleibtgleich.dev), `docs/bento-prototypes.html`,
`docs/layout-prototypes.html`, `docs/list-portfolio-prototype.html`. All are
labelled throwaway; the first two are the starting points for two of the four
themes (§6).

**Tooling on the owner's machine:** Node 25.9, npm 11, pnpm 10, TypeScript 5.8
global, Playwright's Chromium already cached, Google Chrome installed.

---

## 3. Hard requirements (the owner's, non-negotiable)

### 3.1 Prose ownership

- **Every visitor-facing string is prose.** If a guest can see it, it counts:
  nav labels, section titles, typing-masthead lines, project and post blurbs,
  button and CTA labels, footer credit, 404 text, theme names in the picker,
  CSS ticker strings, chips/tags, captions. Code identifiers are not prose.
- **All prose lives in one file**, organized in sections the owner can read, with
  each field carrying **sizes** (§4.2) so the same content fits differently sized
  slots across theme structures. Sizes are per field on every entry: a featured
  project's description has its own sizes, each job's bullets have their own,
  and so on. A theme requests per slot, by size, never by theme name.
- **Nothing the owner has not approved ever ships.** Agents may draft prose, but
  drafts are visibly marked, live in the same file, and block the production
  build until cleared (§4.4). This is a standing rule to be written into the
  project `CLAUDE.md`, plus a cheap lint if it is cheap.
- Alt text and aria-labels are not something the owner wants to review one by
  one, but they must be built from strings the owner has already approved (an
  entry's `xs` title, a sized caption) or be an approved field. No free text.
- The owner edits prose by talking to an agent, not by hand, so the file format
  should suit an agent editing it reliably and the owner reading it.
- Theme-specific strings that are not a size of any canonical field (cream's
  "NEVER THE SAME STACK", mottos, sticky meta lines) are allowed, but only in
  the one prose file under the theme's own section, through the same draft flow.

### 3.2 Parity

- The default theme and all sixteen active skins must be **unchanged to the
  owner's eye**: across screen sizes, on all pages, in all behaviors. Output need
  not be byte-identical if the owner would not notice. This is a strong
  requirement and not a place for shortcuts.
- The owner will QA everything by eye regardless, and wants to be part of the
  process, but the rewrite should work out of the box; an automated parity
  harness is expected (§4.9).
- The new architecture is to be **written properly** (§3.4) and **produce the
  same behavior**, using the same constants for animations and timings. Same
  behavior is not considered much harder than different behavior; it is just
  verified.

### 3.3 Lean stays lean

- A theme may own third-party libraries and heavy assets (GSAP plugins, Lenis,
  three.js, GLB/GLTF models, baked Blender renders, video). Those must load
  **only when that theme is active**. A simple static page in a light theme must
  never pay for another theme's three.js.

### 3.4 Done properly

- Correctness and code quality above all else. The owner pointed at the Cursor
  "thermo-nuclear code quality review" bar: structural simplicity over
  polish, no file over ~1000 lines, no feature checks scattered through shared
  code, explicit typed contracts instead of ad-hoc shapes, reuse existing
  helpers, delete indirection rather than wrap it, feature logic behind its own
  module. Construction must be **componentized** so agents building themes have
  a straightforward time.
- A build step is acceptable if it is the better tool. Framework migration is
  acceptable. A massive rewrite is acceptable.
- Software installs only with the owner's explicit per-install approval. No dev
  servers started by agents (test runners that start and stop their own
  127.0.0.1 servers are fine). No commits, pushes or staging without an explicit
  ask, each action separately.

### 3.5 URLs

- URLs may change as long as the new ones make sense; old URLs must keep
  working via redirects. Applies to theme paths, blog posts and subsites.

### 3.6 Structural freedom for themes

A theme may: own its entire DOM; reorder, merge or omit sections; have its own
nav labels (as sized prose); use its own libraries and assets; add pages the
default does not have; carry internal colour modes of its own; render a
fundamentally different structure on mobile. Every theme must work on mobile.

### 3.7 Five new themes, five separate consumers

See §6. They are not to be blended. The fifth (illoca, §6.5) is built last.

---

## 4. Decisions made in the session (locked)

### 4.1 Stack: Astro, static output

Chosen over raw/no-build and over React. Reasons recorded so nobody relitigates:
a build step lets the prose file be validated by a schema (a missing size a
theme asks for fails the build instead of rendering nothing); `.astro`
components are near-raw HTML, close to the existing code and friendly to
agents; Markdown posts are native; per-theme code splitting gives §3.3 for free;
every page of every theme is emitted as static HTML (crawlable, no flash, no
hidden canonical DOM, no takeover gates in shared scripts). React proper was
rejected: a mostly static site paying hydration for nothing, and the imperative
animation code fights React's render model; if one component ever needs React,
Astro islands allow it. Raw/no-build was rejected because schema validation,
componentization, code splitting and prerendering would all be hand-rolled.
The owner considered a research agent on "do frontier LLMs code better in raw
vs React" and skipped it; the decision rests on architecture, not model
fluency. Astro's `file()` loader reads a single YAML file with a zod schema;
`getStaticPaths` prerenders route sets; client scripts/islands are unrestricted,
so three.js and Blender assets are fine. Pin the Astro version at install.

### 4.2 Sizes: `xs`, `s`, `m`, `l`

- `xs`: a label, about 3 words or fewer (nav items, chips, section titles).
- `s`: one line, about 15 words or fewer (taglines, list-row subtitles, blog rows).
- `m`: a short paragraph or up to 3 bullets, about 60 words or fewer.
- `l`: full, today's prose, unbounded.

Rules: an explicit `null` at a size means "nothing fits here, omit the element";
the theme's slot must handle it. A size that is simply absent is an error only
if some theme requests it, and the build then lists exactly what is unwritten,
so nobody writes sizes no theme uses. Keep the size set minimal and reused
everywhere; do not add sizes per theme.

### 4.3 Content file: one YAML file, Markdown inside prose, TS schema beside it

YAML over TypeScript because prose full of Markdown backticks fights template
literals, and there is no code syntax in the file the owner reviews. Commented
sections (`# About`, `# Jobs`, ...). Prose fields are Markdown (links, emphasis,
paragraphs) rendered to HTML at build. Theme labels, nav labels, typing lines,
social labels, and theme-specific strings all live here. Existing site text
migrates in as approved `l` (and existing `xs` labels), since it is already live.

### 4.4 Drafts

A plain string is approved; a draft is structurally distinct (e.g.
`{ draft: "text" }`) so a tree walk finds every one. Preview/dev builds render
drafts visibly marked (red) by default, with a **toggle** that shows them as
native prose so the owner can read a whole flow either way; the toggle persists
across pages. The production build refuses to run while any draft exists.
Standing `CLAUDE.md` rule: every new visitor-facing string enters the prose file
as a draft; nothing ships until the owner clears it. Add a pre-push lint only if
it is trivially cheap (it is: the same tree walk).

### 4.5 URL model: theme in the path

`/` is default; `/<theme>/`, `/<theme>/blog/`, ... are prerendered with the skin
already applied. Visible changes accepted by the owner: the URL shows the theme,
and reload keeps it (today reload resets). Old `/?style=<id>` links redirect.
Themed paths should carry canonical links to the default and be `noindex`.

### 4.6 Blog posts prerender to `/blog/<id>/`

With a redirect shim at `blog/post.html?id=<id>`. This unblocks per-post
OG/Twitter images, which `docs/TODO.md` calls an inherent no-build tradeoff.
Sitemap generated by the build. Code blocks must keep the highlight.js 11.9.0
github-dark look for parity (do not switch to Shiki's colours); mermaid stays
client-rendered.

### 4.7 Page coverage is per theme and first-class

A theme declares which page types it owns (home, blog listing, post, plus any
theme-only pages). Page types it does not own render the default layout in the
theme's tokens (colours/fonts). Utility pages (privacy, 404, lexchat) always get
tokens only. This fallback is a first-class concept, not a special case. The
global theme picker must be reachable in every theme: the theme mounts the
picker component somewhere in its own chrome, or the engine injects the
floating fallback.

### 4.8 Subsites

Standalone pages group in source under `public/subsites/<person>/<page>/`
(e.g. `public/subsites/elise/12years/`), served at `/subsites/elise/12years/`
with the old `/12years/` and `/embedded-swift-agent/` URLs redirecting. The
folder name `public/` never appears in URLs; the owner did not want "public" in
the name and this satisfies that. `lexchat/`, `privacy/` and `404` become Astro
utility pages so they keep receiving tokens under every theme path.

### 4.9 Parity harness

- DOM diff (no install): built HTML vs current HTML, normalized, per page per
  theme.
- Visual diff via Playwright (`@playwright/test`, install approved in principle,
  ask again for the actual command): old site from a git worktree at today's
  `main` and the new build, both on ephemeral 127.0.0.1 servers the runner
  starts and stops; screenshots of every theme x page (home, listing, one post,
  privacy, 404) x viewports (1440, 390) after intro animations settle; scripted
  interactions (job tab click, carousel scroll, theme menu open, blog filter);
  the random masthead sequence pinned by seeding `Math.random` from the runner,
  not by a hook in site code.
- Manual QA list for motion feel, tilt and hover, ordered by skin.

### 4.10 Deploy: GitHub Actions to Pages

Free for this public repo. On push to `main`: `npm ci`, `astro build` (fails on
drafts or missing sizes), publish `dist/`. `CNAME` and `.nojekyll` ride in
`public/`. Pages source flips from legacy to Actions only at cutover, after
parity passes, with the owner's go-ahead (one `gh api` call or a settings
click). The weekly `refresh-chart-data.yml` commits with `GITHUB_TOKEN`, which
GitHub deliberately does not let trigger `push` workflows, so that workflow must
dispatch the deploy workflow explicitly after committing (`workflow_dispatch`
is the documented exception). Rejected: building locally and committing output
(generated diffs, drift); Cloudflare (second platform, DNS move, no gain).

### 4.11 Where the work happens

An `astro` branch in a git worktree. `main` stays live and untouched until the
parity harness passes on every theme, then one merge.

### 4.12 Libraries

Versions stay pinned to today's (gsap 3.9.1, jQuery 3.6.0, jQuery UI 1.12.1,
AOS 2.3.1, vanilla-tilt 1.7.0, highlight.js 11.9.0, marked 18.0.5, mermaid
11.15.0) and move from CDN to npm so Vite can split them per theme. Google
Fonts stay as links. Calendly stays the external widget. Package manager: npm.

### 4.13 Behavior policy

Architecture rewritten properly; behaviors reproduced with the same constants;
harness and the owner's eyes are the referees. Refactor behavior logic freely
where the output provably does not change.

---

## 5. Delegated to agent judgment

The owner explicitly does not care about these as long as the choice is stated
clearly: switching mechanics (decided: navigation between theme paths); code
structure and file layout; order of the new themes after the existing ones are
migrated (§8); package manager (npm); keeping the folder named `public/`
(Astro allows renaming via `publicDir`; keep the convention). The owner trusts
the agent's judgment on implementation but wants to be told what was chosen.

---

## 6. The five new themes (separate consumers)

Reference observations below were fetched on 2026-09-05 and are summaries;
re-look at each reference before writing its spec. Each theme gets its own
small spec (what it needs from the content model, which page types it owns,
its mobile structure, the drafts it needs), not another grilling session.

### 6.1 cream (reference: lannino.com; prototype: `docs/cream-prototype.html`)

Cream ground, one burnt-orange ink, Poiret One over Outfit. Signature device: a
drawn vertical spine that replaces the stems of the giant name, then becomes
the shared "I" of a pinned Interactive / Immersive / Intelligent stack. Custom
cursor, entry curtain with loader, full-screen menu (numbered lines: Home,
Let's work together, Projects, Blog, Résumé) with a selected-works list and a
latest-post slot, jobs as numbered index rows with a spine and nodes (three
bullets each), selected works as giant motto words interleaved with framed
screenshots, an index of the remaining projects, blog as title+date rows,
footer CTA "Let's work together". Motion on GSAP 3.13 ScrollSmoother,
ScrollTrigger, SplitText (all free since 2025).
**Engine demands:** theme-owned GSAP plugins; full-screen menu owning the nav;
pinned sections; `m` bios per focus area (web / iOS+visionOS / ML+RL), `m`
jobs bullets, `s` blog rows, `xs` nav labels, theme strings (mottos, captions
like "Model fine-tune · 2026"), omitted default sections (no About card, no
Skills card). Mobile: the prototype's responsive handling needs checking.

### 6.2 mono (reference: bleibtgleich.dev; prototype: `docs/mono-prototype.html`)

Monochrome Swiss layout, html font-size 1vw with a 14.4 scale ratio, one
grotesk at weight 500 (Work Sans), 8-column grid. Devices: preloader (vertical
progress line, 0 to 100 count, nav sliding in), gooey SVG-filter text reveal,
blur reveals and clip-down spacers, split-char link hovers, staircase Menu
dropdown, a **theme-internal colour-mode picker** (six modes: Light, Concrete,
Rust, Verdigris, Blood, Dark) with a liquid wipe and spinning totem, sticky
wordmark joining at page bottom, hero wipe-to-reveal orbit of project tiles,
works globe under a sticky heading that turns into "All Works", a **`/work` card
grid** (theme-only page), an awards-style certificate grid reused for jobs and
posts, footer clock with cycling logo. Libraries: gsap 3.15 (ScrollTrigger,
CustomEase, MorphSVG), Lenis 1.3.
**Engine demands:** theme-only page; internal modes coexisting with the global
picker and the palette toy (decide how, §9); preloader/document-level chrome;
Lenis + GSAP as theme libs; `s`/`xs` prose nearly everywhere; theme strings
(hero headline fragments, statement line, footer quote, sticky meta line, all
placeholders in the prototype and therefore drafts). Reference nav labels:
Home, Work, Contact, Experiments. The reference site is image-first with
near-zero prose.

### 6.3 vanlent (reference: vanlent.dev)

Single-page scroll with full-screen sections and GSAP/clip-path reveals. Hero
with three numbered callouts ("CREATIVE DEVELOPER", "AMSTERDAM BASED",
"AVAILABLE FOR WORK") and contact details; projects as a horizontal carousel
of mockups with 2-3 sentence blurbs; six service cards with one-liners;
a statistics row; rotating testimonials; a one-paragraph About; a contact form.
Copy strings observed: "Code, performance, and design working together.
Without compromise." / "From concept to launch, I help bring your ideas to
life."
**Engine demands and open choices for its spec:** the simplest structure of
the four; `s` prose nearly everywhere; services map to Skills (web / iOS /
ML) or are omitted; the stats row needs owner-approved numbers or is omitted;
testimonials have no source and are omitted; the contact form has no backend
(mailto or omit); the EN/NL toggle does not apply. Good test of "omit sections".

### 6.4 mosbyfiles (reference: mosbyfiles.com)

Editorial catalogue: a large display heading, then four categorical sections
each with 2-4 lines of copy and linked names acting as index cards into case
studies, an asymmetric full-bleed image grid, a top bar with a single "About"
link, white ground with dark type, generous whitespace, restrained motion.
(Credited to Tubik Studio; the fetch may have summarized a showcase page; re-look.)
**Engine demands:** projects grouped by a **category** field (new content
field, `xs` strings, drafts); `s`/`m` blurbs per category and per project; an
About page (theme-only page or the about section); an image grid fed from
project images; likely the cleanest fit for a future case-studies section.

### 6.5 illoca (reference: illoca.unseen.co; no prototype; build last)

Added 2026-09-05 after the session, from the served HTML, CSS and JS bundle signatures
(the page is a Nuxt/Vue + Tailwind product landing page by Unseen Studio and is heavily
client-rendered, so re-look in a browser before writing its spec). Paper ground
(`#fffbf3` nav), charcoal ink `#373737`, body grey `#636363`, one blue `#283f7d` and one
orange `#ec633d`, `mix-blend-mode: overlay` layers. Self-hosted commercial fonts
(Architect Pro + Symbols, a hand-drawn architectural face; F37 Analog; Graphik Web) plus
Google Geist Mono, Space Grotesk, Syne, DM Sans, Space Mono and Caveat (handwriting).
Devices: custom cursor with a live "X 0.00 Y 0.00" coordinate readout; a hero line
("Design at the speed of thought") stacked three times; a numbered feature list (1-5),
each with an exclamatory tag ("Intents, Translated!"), a title, one sentence and a
"Watch the demo" video; an "Open Letter" long-form section; three pricing tiers; an FAQ
accordion; a footer with tagline, quick links, socials, email, legal. Bundle: three.js
(WebGLRenderer) and OGL, GSAP 3 with ScrollTrigger and SplitText, Lenis, Rive, video;
fluid breakpoints from 480 to 3840px; `(hover: hover) and (pointer: fine)` vs
coarse-pointer branches.
**Engine demands:** the heaviest consumer of the five: WebGL canvases (three.js/OGL) and
Rive animations that load only under this theme (§3.3); video demos (project demos need
recorded clips: new assets the owner supplies); self-hosted paid fonts (license or
substitute, owner call); custom cursor + coordinate readout as document chrome; the
numbered feature list maps to projects or skills, five items, with `xs` exclamatory tags
and `s` one-liners as theme strings (drafts); the "Open Letter" maps to About at `l`;
pricing has no counterpart (omit); FAQ becomes a "questions people ask me" section (new
drafts) or is omitted; the theme owns touch/pointer branches at its own breakpoints.
Builds last (§8): it needs video assets and font decisions, and by then the engine has
four consumers behind it.

---

## 7. Future directions (out of scope, keep the door open)

- **Case studies**: a new section with more depth on personal and work
  projects, possibly a more dynamic post format with animations. The owner is
  not sure yet what they want; do nothing, but do not make it hard.
- **Blog posts leaving Markdown** if per-section control or animation needs it.
- **Cleanup pass**: drop unused gsap 3.9.1 from the default, replace the jQuery
  smooth-scroll easing, dedupe home/listing rendering. Only after parity lands.
- Per-post OG images (now feasible), README, `.editorconfig`, and the rest of
  `docs/TODO.md`.

---

## 8. Agreed workflow and order

1. **Spec 1: migration + engine + parity.** Astro migration, prose file and
   schema, sizes, drafts, theme engine (skin kind on the reproduced canonical
   DOM, structural kind with owned page types, tokens fallback), theme-in-path
   routing, prerendered posts, subsites and redirects, parity harness, deploy
   workflow, `CLAUDE.md` prose rule. Existing default + sixteen skins migrated
   first and gated by the harness. Desk-check the engine design against every
   demand listed in §6 before building, so the first consumer does not force a
   redesign. Land this on `main` at parity; it is independently valuable
   (static posts, OG images, deploy).
2. **Specs 2-6: one per new theme.** Order is agent judgment (the owner: "do
   whatever can land first, existing themes first"). Recommended: **cream**
   (prototype exists, moderate engine demands), then **mono** (prototype
   exists, adds theme-only page, internal modes, preloader, Lenis, 1vw scale),
   then **vanlent** (simplest, tests omission), then **mosbyfiles** (needs the
   category field and an about page), then **illoca** last (§6.5: WebGL, video
   and font decisions; the heaviest consumer, so it lands once the engine has four
   consumers behind it). If cream exposes an engine gap, fix the
   engine in that spec; it has no other consumers yet, so changing it is cheap.

Each spec goes through the owner for approval before implementation; each new
theme's prose arrives as drafts for the owner to clear.

---

## 9. Deliberately undecided (for the spec authors)

- Exact YAML shape (nesting, entry ids, how sizes and nulls are written) and
  the zod schema; how "a theme requests a size for a slot" looks in a component.
- How a theme expresses a different mobile structure (two rendered structures
  toggled by media query, vs component-level branching) without doubling every
  page's HTML.
- How theme-internal modes (mono) coexist with the global picker and the
  palette toy (separate state, or modes expressed as palette presets).
- Draft toggle UI (query param, floating control, both) and where its state
  persists.
- Whether size budgets (§4.2 word counts) are linted or just documented.
- Canonical/noindex handling for themed paths; sitemap contents.
- Whether `docs/theme-explorations.html` (which links the old bootstrap) is
  updated, frozen as history, or replaced by the new engine docs.
- Playwright thresholds, viewport list, and how animation settling is detected.

---

## 10. Glossary

- **Theme**: a registry entry the picker can select. Two kinds: **skin** (CSS
  and tokens on the reproduced canonical DOM; the sixteen existing ones) and
  **structural** (owns its DOM, IA, libraries, and possibly extra pages).
- **Canonical DOM**: today's markup for home, listing and post, reproduced by
  the default components exactly so skins keep working.
- **Prose / string**: any visitor-facing text. **Size**: `xs/s/m/l` variant of
  a field. **Slot**: a place in a theme's structure that asks for a field at a
  size. **Null**: an explicit "nothing fits here" at a size. **Draft**: prose an
  agent wrote that the owner has not cleared.
- **Mode**: a colour variant inside one theme (mono has six). Distinct from the
  global picker and from the **palette toy** (the cycler's random-colour tool).
- **Tokens**: the five colour roles, fonts and radii a theme sets; the only thing
  utility pages and unowned page types take from a structural theme.
- **Subsite**: a standalone page tree copied through `public/subsites/`.
