# Intent: theme engine rewrite and structural themes

**Written:** 2026-09-05, from a grilling/brainstorming session with the site owner.
**Status:** intent with owner decisions settled on 2026-09-05; Spec 1 records the
implementation contract and the Q1-Q14 decision record. Nothing below has been built.
**Owner clarification, 2026-09-05:** Spec 1 must finish with a coherent repo
architecture and a demonstrated workflow for adding themes (§3.4, §8.1).
**Latest execution clarification, 2026-09-05:** no intermediate gates or owner QA checkpoints.
Agents complete the migration and their automated verification; the owner does their own QA
only once the whole thing is complete. The [execution tickets](../../superpowers/plans/2026-09-05-spec-1-migration-engine.md)
apply this clarification to Spec 1's earlier staged approval/sign-off sequence.
**How to read this:** §3 is the owner's hard requirements (non-negotiable). §4 is
what was decided in the session (locked unless the owner reopens it). §5 is what
the owner delegated to agent judgment (latitude, but say what you chose). §6 is
per-theme detail for the five consumers (§6.5 was added after the session). §9 lists
implementation choices delegated to the spec. The settled decisions are recorded in
`spec-1-migration-engine-parity.md` §13; dated research/reviews remain historical evidence.

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
   in its authoritative source, in sizes where needed, and nothing unapproved ever
   ships (§3.1, §4.3, §4.4). Shared site prose is centralized; each post owns its
   metadata and body.
2. **Nothing the owner likes today may change noticeably.** The default site and
   all fifteen active skins (sixteen themes total) must survive the rewrite indistinguishably to the
   owner, on every page, at every screen size, in every behavior (§3.2).

Then five new structural themes get built on the engine, each a separate
consumer based on its own reference (§6), the engine first and the existing
themes migrated before any new one.

### Non-goals (for the engine work)

- Not blending the five references into one theme. Five themes, five references.
- Not implementing case studies yet (§7). Existing posts keep Markdown for parity;
  their shared rendering contract must also accommodate future component-based posts.
- No discretionary replacement of working libraries (§7); refactors needed for
  the clean architecture are included (§3.4).
- Not a visual redesign of the default theme. Parity, not improvement.

---

## 2. Current state (verified 2026-09-04)

Static site, no build step, GitHub Pages serving `main:/` (legacy mode), CNAME
`www.dawsonamf.com`, public repo `dawsonamf/personal-website`. Conventions in
`CLAUDE.md`. Theme architecture is documented in the HTML comment at the top of
`docs/theme-explorations.html`; read it alongside Spec 1's research errata (§17)
and current contracts, which correct its stale claims. The owner delegates code to agents and
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
`/?style=<id>`; reload returns to default). Sixteen active themes in `ORDER`:
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
- **One authoritative source per content item.** Shared site/theme prose lives in
  one YAML file. Each post owns its title, date, description, tags and body in its
  own source; listings, home rails, page metadata and sitemap derive from it. No
  duplicated post metadata in the site YAML. Shared prose is organized in sections
  the owner can read, with each field carrying **sizes** (§4.2) so the same
  content fits differently sized slots across theme structures. Sizes are per field on every entry: a featured
  project's description has its own sizes, each job's bullets have their own,
  and so on. A theme requests per slot, by size, never by theme name.
- **Nothing the owner has not approved ever ships.** Agents may draft prose, but
  drafts are visibly marked in their owning source. Unapproved shared or published
  post metadata blocks production; whole unpublished post drafts are excluded from
  production output and may coexist with published content (§4.4). This standing
  rule belongs in the project `CLAUDE.md`, plus a cheap lint if it is cheap.
- Alt text and aria-labels are not something the owner wants to review one by
  one, but they must be built from strings the owner has already approved (an
  entry's `xs` title, a sized caption) or be an approved field. No free text.
- The owner edits prose by talking to an agent, not by hand, so the file format
  should suit an agent editing it reliably and the owner reading it.
- Theme-specific strings that are not a size of any canonical field (cream's
  "NEVER THE SAME STACK", mottos, sticky meta lines) are allowed, but only in
  the one prose file under the theme's own section, through the same draft flow.

### 3.2 Parity

- The default theme and all fifteen active skins must be **unchanged to the
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
- **Spec 1 finishes the architecture of the migrated site.** Pages, content,
  theme registration, assets, behavior, build and deploy must form one coherent
  system. Retained behavior code has an explicit owner and documented inputs,
  dependencies and lifecycle. Any refactoring needed to establish those
  boundaries belongs in Spec 1 and cannot be deferred as later cleanup.
- **Adding a theme is a supported authoring workflow.** Routine skins and
  structural themes are added through theme-owned files, typed registration,
  and approved prose, using the documented extension points. They must not
  require changes to unrelated themes, canonical behavior, or scattered
  theme-specific branches in shared code. New capabilities may extend a shared
  contract deliberately when a consumer needs them.
- **Prove that workflow before declaring Spec 1 done.** A representative
  structural-theme fixture must exercise its own layout and assets, canonical
  fallback pages, prose access, routing, the picker and mobile behavior through
  the public authoring contract. The fixture is test-only; it does not implement
  one of the five production themes. Record the checks and the files needed to
  add it alongside the authoring guide.
- **Finish the transition.** Remove superseded implementations, duplicate
  sources of truth and temporary migration scaffolding. Required legacy-URL
  shims, inactive skins and standalone subsites remain intentional, documented
  parts of the repo. Update the repo and theme-authoring docs to match the
  finished system.
- A build step is acceptable if it is the better tool. Framework migration is
  acceptable. A massive rewrite is acceptable.
- Software installs only with the owner's explicit per-install approval. No dev
  servers started by agents (test runners that start and stop their own
  127.0.0.1 servers are fine). No commits, pushes or staging without an explicit
  ask, each action separately.

### 3.5 URLs

- URLs may change as long as the new ones make sense; old URLs must keep
  working via redirects. Applies to theme paths, blog posts and subsites.
  The settled Q2 publication decision explicitly withdraws unlisted draft post
  pages such as Gemma; their old URLs may reach 404. External article URLs redirect
  to their authoritative destination (§4.6).

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
Post metadata lives with its post (§4.6), using the same sized-field and approval
conventions where applicable.

### 4.4 Drafts

A plain string is approved; an unapproved prose field is structurally distinct
(`{ draft: "text" }`) so a shared walker can find it. This applies to the shared
YAML and metadata in every publishable post source. Preview builds mark drafts
red and offer the persistent native-prose toggle. Production rejects any such
field in shared prose or a published/external listing record.

Whole unpublished posts use `publication: draft`. They remain in source and may
be previewed with visible draft marking and `noindex`, but production emits no
page, listing card, sitemap entry, raw source or body for them. Keeping these
drafts does not block an otherwise approved production build. New post bodies
remain whole-document drafts until the owner approves publication.

Verbatim subsites and existing per-post assets are grandfathered for this
migration. New or changed UI strings use their owning approved content source;
the museum-derived aria-label needs an approved template when next touched.
The standing `CLAUDE.md` rule and optional pre-push check implement these rules.

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

Each post source owns its metadata and body. Existing post title/date values win
conflicts; missing descriptions and tags migrate verbatim from the existing
listing. One description supplies cards and page metadata at the requested size.
Markdown is the migration format because it preserves existing rendering and
already supports per-post scripts/assets. Shared post layouts consume validated
metadata plus a body slot; a future MDX/component adapter can supply that slot
without duplicating metadata or rewriting theme layouts. Converting existing
posts or building case studies is optional future work.

Preserve the current ten listing entries and their order: eight local posts and
two external autoencoder articles. The external records keep one local metadata
source with `publication: external`; their archived Markdown bodies are not
published. Unlisted Gemma stays a draft. Other planning drafts stay drafts, and
the broken color-randomizer sitemap entry is removed. Old autoencoder URLs
redirect to the external articles; the withdrawn Gemma URL reaches the 404.

### 4.7 Page coverage is per theme and first-class

A theme declares which page types it owns (home, blog listing, post, plus any
theme-only pages). Page types it does not own render the default layout in the
theme's tokens (colours/fonts). Structural themes use canonical utility layouts
with their tokens/fonts; existing skins keep their full skin styles on utility
pages for parity. Every theme has a reachable picker, which may sit in its own
menu; use the floating fallback if it mounts none. LexChat's iframe shell is the
explicit page exception and gets no picker. Its current project CTA still links
to `/lexchat/`, so the shell is retained.

The palette randomizer is present and enabled in every theme's picker. A theme
may use a very narrow randomization profile and derive additional color variables
from the five shared roles. Internal modes persist for the session; they retain
working palette support instead of hiding or disabling it. Preserve the existing
skins' randomization behavior. Keep today's idle picker-font loading for those
skins; further loading changes are delegated when needed by the architecture.

### 4.8 Subsites

Standalone pages group in source under `public/subsites/<person>/<page>/`
(e.g. `public/subsites/elise/12years/`), served at `/subsites/elise/12years/`
with the old `/12years/` and `/embedded-swift-agent/` URLs redirecting. The
folder name `public/` never appears in URLs; the owner did not want "public" in
the name and this satisfies that. `lexchat/`, `privacy/` and `404` become Astro
utility pages so they keep receiving theme styling under every theme path;
LexChat remains exempt from the picker (§4.7).

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

Free for this public repo. On push to `main`: `npm ci`, `npm run build` (`astro check` then `astro build`;
fails on type errors, unapproved publishable prose or missing requested sizes),
publish `dist/`. `CNAME` and `.nojekyll` stay at the repo root for legacy rollback;
the Actions deployment does not need them in `public/` (Spec 1 D18). Pages source
flips from legacy to Actions only at cutover, after
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
where the output provably does not change. Keeping working behavior code is
acceptable when it meets §3.4's boundaries; isolating it correctly is a Spec 1
deliverable.

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
- **MDX/component-based posts and case studies** when per-section control or
  animation needs them, using Spec 1's shared metadata/body rendering contract.
- **Cleanup pass**: drop unused gsap 3.9.1 from the default, replace the jQuery
  smooth-scroll easing, and make optional library/runtime simplifications after
  parity lands. Shared rendering and the architectural boundaries needed for
  clean theme authoring are part of Spec 1 (§3.4).
- Per-post OG images (now feasible), README, `.editorconfig`, and the rest of
  `docs/TODO.md`.

---

## 8. Agreed workflow and order

1. **Spec 1: migration + engine + parity.** Astro migration, prose file and
   schema, sizes, drafts, theme engine (skin kind on the reproduced canonical
   DOM, structural kind with owned page types, tokens fallback), theme-in-path
   routing, prerendered posts, subsites and redirects, parity harness, deploy
   workflow, `CLAUDE.md` prose rule. Existing default + fifteen skins migrated
   first and gated by the harness. Desk-check the engine design against every
   demand listed in §6 before building, so the first consumer does not force a
   redesign. Complete §3.4's architecture and authoring checks, including the
   representative structural-theme fixture, before cutover. Land this on `main`
   at parity with the repo architecture finished and the authoring workflow
   documented and demonstrated; it is independently valuable (static posts,
   OG images, deploy).
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

## 9. Choices delegated to the spec authors

The list below records the original delegation. Spec 1 now resolves these choices;
its §13 records all fourteen settled owner decisions and the judgments made under
that delegation.

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
  and tokens on the reproduced canonical DOM; today's default plus fifteen skins) and
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
