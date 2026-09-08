# Spec 1: Astro migration, prose file, theme engine, parity harness, deploy

**Owner utility acceptance amendment, 2026-09-08:** Privacy and 404 require readable,
functional pages, approved Privacy text, correct links, safe 404 theme resolution,
reachable pickers and utility asset isolation. The owner explicitly waived exact OLD/NEW
Privacy/404 DOM and screenshot equality and will inspect their appearance during final
migration QA. S1-21 uses focused unit/build/browser smoke checks and a light orchestrator
spot-check, without the four-reviewer pipeline or utility parity matrix. S1-26 preserves
this narrow functional acceptance; all other page parity remains unchanged. This supersedes
contrary visual/DOM parity requirements for these two pages below, including §9 and §15.
The intended exact-parity navigation cycle is Home → listing → Toolbelt → Embedded Swift
Agent → METR → same-theme canonical Home. Privacy/404 are outside that comparison cycle;
their functional smoke covers theme/palette navigation and reload, picker opening and links.
This is the final tracked cycle, not a staged destination substitution. Keep actual document
navigation, canonical route seeds, masks and tolerances unchanged. Earlier requirements to
restore Privacy as METR's parity destination are superseded.

**Owner amendment, 2026-09-08, effective S1-21:** LexChat is a retained project linking
directly to the owner's Hugging Face destination. Retire its local engine page family and
unused page assets, including all sixteen default/themed outputs. Create no local,
themed or query compatibility redirect. Retain the project card, image and approved
description. The direct target is `https://huggingface.co/spaces/dawsonamf/lexchat`,
selected from the owner's public Space by root under the direct-Hugging-Face instruction
(Hugging Face API returned exactly `dawsonamf/lexchat`; page HTTP 200, 2026-09-08).
This records an existing-target selection, not a literal URL supplied by the owner.
S1-25 removes only audited remaining legacy copies.
This supersedes the retained-iframe requirements in D12/D29, Q4/Q9/Q14 and the old
LexChat examples below. Production now expects **176 page routes plus 404.html**,
eight published local posts and ten listing entries. Remaining page coverage has seven
representative pages: Home, listing, three posts, Privacy and 404. S1-21 verifies the
exact route/sitemap sets and discovered test counts. S1-24 tests remaining real pages
and any supported general picker-free Shell contract without restoring LexChat or
adding a fixture-specific API. S1-26 consumes the final S1-21 contract. Historical
OLD source references remain evidence; they are not instructions to restore a page.

**Status:** owner decisions Q1-Q14 settled 2026-09-05; architecture completion required; [28 execution tickets written](../../superpowers/plans/2026-09-05-spec-1-migration-engine.md). Review round 1 is historical evidence (see docs/reviews/).
**Latest owner execution clarification, 2026-09-05:** no intermediate gates. Agents execute the
ordered tickets, resolve implementation issues and perform automated verification. The owner
does their own QA only after the whole migration is complete. This supersedes the earlier staged
approval and owner-sign-off timing in §§10, 12 and 14; actual tool/environment permissions still
apply. The linked ticket plan is the current execution schedule.
**Owner clarification, 2026-09-05:** architectural completion and demonstrated theme authoring are
required for Spec 1 (§1.1, D3, D38, §5.3, T8). §13 records the owner's settled answers and delegated implementation choices.
**Written:** 2026-09-05 from `intent.md` §8.1 and the seven research files in `research/`.
**Review baseline finalized:** 2026-09-05, before the owner decisions in §13. Current-code claims were checked against `main` @
`0f196d0` (file:line), every version and API against the npm registry, GitHub docs and the Astro 7 /
Playwright 1.61 docs on that date. What could not be verified is marked "verified in T0/T1/T7" with a
stated fallback. Research errors found on the way, and the one error the finalizing pass itself
introduced, are listed in §17.
**Baseline:** `main` @ `0f196d0`. The parity harness compares against this commit.
**Scope:** everything in intent §8.1. Nothing from specs 2-6 (the five structural themes) is built
here; §11 desk-checks the engine against their demands so they do not force a redesign.

How to read this: §2 lists every decision this spec makes on the owner's behalf (intent §5 says to
state them) and is the single index of them. §12 is the ticket breakdown. §13 is the batch of
settled owner decisions and the implementation choices made under that delegation. §15 is
the list of deliberate visible changes, which is what the parity harness allow-lists (§9 step 8).

---

## 1. Outcome

When this spec is done:

1. `www.dawsonamf.com` is built by Astro 7 and deployed by GitHub Actions on every push to `main`.
   Old URLs redirect. Blog posts are static pages at `/blog/<id>/` with real `<title>`, description,
   canonical and JSON-LD in the served HTML.
2. Shared visitor-facing prose lives in `src/content/prose.yaml`; each post owns its metadata
   and body in its own source (D8). Publishable prose is sized and validated through shared rules.
   Unapproved publishable prose and missing requested sizes fail production; unpublished post
   drafts remain in source and are excluded from production output (§7).
3. The theme engine is a typed registry with two kinds (`skin`, `structural`). The default theme and
   the 15 active skins (16 themes) are prerendered under `/`, `/<skin>/`, `/<skin>/blog/`,
   `/<skin>/blog/<id>/`, `/<skin>/privacy/`. The `structural` kind ships as the
   `kind` discriminant, `layouts`, the composition fallback and the authoring fixture (§5.3, D38).
   §11 shows where each remaining demand of the five future themes lands and by what mechanism.
4. The parity harness proves the 16 themes are unchanged to the eye on every page type at 1440 and
   390, settled and after each scripted interaction in §9, and the owner has signed off the manual
   QA list. Only the changes in §15 differ.
5. The migrated repo has one coherent architecture and a documented, demonstrated workflow for
   adding skins and structural themes. All four architecture completion criteria in §1.1 pass;
   any refactoring needed to satisfy them is finished before cutover.

Non-goals (intent §1, §7): no visual redesign, no new case studies or conversion of existing Markdown bodies, no library
cleanup beyond what the migration forces (gsap 3.9.1 stays loaded, Boxicons stays, jQuery stays), no
build-time syntax highlighting via Astro's pipeline, no `<Image />`.

### 1.1 Architecture completion criteria

These are acceptance criteria for Spec 1, alongside visual and behavioral parity:

1. **One coherent system.** Migrated pages, prose, theme registration, composition, assets,
   behavior, build and deploy use the architecture in §3. Each retained behavior module has a
   documented owner, inputs, dependencies and initialization/lifecycle contract. Canonical
   behavior is loaded by canonical layouts; shared picker behavior is independent of it.
   Structural layouts can run without canonical DOM, scripts or libraries. Refactoring required
   to make these boundaries true is completed in this spec (D3).
2. **Theme additions stay local.** The authoring guide explains how to add a skin or structural
   theme using theme-owned files, typed registry registration, prose and schema registration,
   and any theme-owned page files. For the capabilities shipped here, adding a theme requires
   no edits to shared engine algorithms, canonical layouts/behavior or unrelated themes, and
   introduces no scattered theme-id checks. §11's future capabilities may add explicit shared
   contracts with their consumers; unfinished migration work cannot be passed to those specs.
3. **The authoring workflow is demonstrated.** The test-only structural theme in §5.3 is built
   using the documented extension points, with owned and fallback pages, isolated assets, prose,
   routing, picker interaction and mobile checks. T8 records its results and the file-change list
   needed to add it in `research/architecture-signoff.md`. A type declaration or fallback-only
   stub does not satisfy this criterion.
4. **The transition is finished.** T8 audits the migrated tree and build output, removes
   superseded page/rendering implementations, duplicate content/theme sources and temporary
   migration scaffolding, and records intentionally retained code with its owner and reason.
   The specified URL shims, four inactive skin sheets, verbatim subsites, vendored libraries and
   test fixtures are intentional retained assets. Authoring and repo docs describe the final
   system. Architecture acceptance is a cutover gate in §10, T8 and T9.

---

## 2. Decisions made by this spec (intent §5: say what you chose)

| # | Decision | Why (one line; details in the section cited) |
|---|---|---|
| D1 | **Astro 7.3.1**, exact pin. Node **24 LTS** via `.nvmrc`, npm, committed `package-lock.json`. | Astro's install page states that odd-numbered Node lines (v23, v25) are not supported, and its `engines` field (`node >=22.12.0`, no upper bound) would not warn on 25; Node 25 reached end-of-life on 2026-06-01 and Node 24 is Active LTS until 2026-10-20 (nodejs release schedule). |
| D2 | `compressHTML: false`, `prerenderConflictBehavior: 'error'`, `build.inlineStylesheets: 'never'`, `trailingSlash: 'always'`, `build.format: 'directory'`, `site: 'https://www.dawsonamf.com'`, no `base`. | `compressHTML` defaults to `'jsx'` (whitespace around elements stripped by JSX rules), which breaks DOM parity; `false` preserves every byte, and `true` is lossless whitespace removal, not byte-preserving. `prerenderConflictBehavior` is `'error' \| 'warn' \| 'ignore'` (default `'warn'`); `'error'` fails on any two routes producing the same prerendered URL and, in 7.3.1, on duplicate content-entry ids from `file()`. The rest matches GitHub Pages and today's URL shape (§3.2). |
| D3 | **Architecture is completed; behavior is preserved.** HTML becomes Astro components fed by the prose file and registry. Existing behavior scripts may remain classic scripts in `public/js/` when they meet §1.1: canonical behavior stays within the canonical family, and the shared picker works independently. Refactor, split or remove code wherever needed to establish those boundaries, preserving behavior, constants and required load order. §8 is the starting edit inventory; T8 closes any architectural gaps and removes superseded code. | The owner's clarification of intent §3.4 makes architectural completion a Spec 1 requirement. Retaining working logic is compatible with it; postponing necessary isolation or modularization is not. Optional library replacement remains intent §7's later work. |
| D4 | **Theme application moves to build time.** `theme-bootstrap.js` is retired. Each `/<theme>/…` page is emitted with `data-style`, the flag and typing attributes, inline tokens, the colour ramp and the theme `<link>`s already in place. Two `is:inline` pre-paint scripts survive on canonical (default-theme) routes, one on themed routes: the palette-toy override everywhere, plus the `?style=` shim on default-theme routes only (§5.4). A structural theme may add its own, in its own head (D26). No runtime theme registry (D32). The 404 page is the one exception (D27). | The theme is in the path (intent §4.5), so nothing needs resolving at runtime. But a pre-paint override does exist today (`theme-bootstrap.js:727-742` reads `sessionStorage['dawson-theme-cycler']` in the blocking head script and writes the saved colours into the ramp before first paint), and with build-time ramps plus D11's persistence, dropping it would paint the base palette and flip at `DOMContentLoaded` on every navigation. The cycler still restores after load: `restore()` is `theme-cycler.js:142-154` (`:141` closes `persist()`), called from `boot()`, which is `:747-770` and is invoked at `:772-776`. |
| D5 | **Libraries: npm is the source of truth; the copied files are committed and served verbatim.** One table, `scripts/vendor-map.mjs` (`{ npm path, public path, CDN URL }` per file), is the only list; `npm run vendor` copies the npm artifacts into `public/vendor/`, which is committed. No `prebuild`/`predev` hook, no sha256 list, no separate `vendor-static/` (§8). **Exceptions:** mermaid, Plotly and the post-side js-yaml stay on their pinned CDN URLs (mermaid's npm package is 76.3 MB for one 3.3 MB IIFE global build nothing bundles); Boxicons is a committed copy, not an npm install (its package declares six runtime dependencies including React 16). **Deviation from intent §4.12**, stated: the libraries move to npm but are served as files rather than Vite-split per theme, and three stay on CDN; per-theme isolation (intent §3.3) comes from which layout emits which tags. | The copied output never changes while the pins are frozen, so committing it removes a build hook that CI would not have run (§10) and makes git the integrity record. |
| D6 | **Posts render at build with marked 18.0.5 + the three existing renderer overrides + highlight.js `lib/common`**, not with Astro's Markdown pipeline. Mermaid stays client-run, and ships only on posts that have a diagram (D35). | The marked output is what every skin sheet targets (§7). Astro 7's pipeline is Sätteri (`@astrojs/markdown-satteri`); its markup has not been compared to marked's and its fenced-code shape under `syntaxHighlight: false` is unverified (`research/astro-capabilities.md` §2.4, §3.5). Reproducing it would be risk without upside. |
| D7 | **Shared prose lives in one YAML document**, loaded as one content entry via `file()` with `parser: (text) => [{ id: 'prose', ...yaml.load(text) }]`. Sized fields and draft-capable label lists use the shared schema; URLs, ids, dates and colors are data. **Post metadata is owned by each post source**, using those same field types and validation helpers (D8). | Q1 establishes one source per content item. One YAML entry still permits a complete shared-prose draft report; post issues carry their source filename. |
| D8 | **Each post source owns title, date, description, tags, publication state, external URL and body.** Listings, rails, SEO and sitemap derive from that record; there is no `prose.posts` mirror. Existing post title/date win conflicts, and missing descriptions/tags migrate verbatim from the listing. Existing bodies remain Markdown; the shared post layout takes metadata plus a body slot so future component/MDX posts can use it (§7). | Owner Q1: keep post content together and leave room for animation/case studies. Q2: preserve current listing membership; unpublished bodies remain drafts instead of becoming new public pages. |
| D9 | **Preview draft marking is shared across content owners.** Accessors mark unapproved fields as in §4.2; the Shell emits `DraftPill` only under `PROSE_DRAFTS=allow`, with the persistent native-prose toggle. A whole unpublished post carries a visible draft marker, contributes to the pill count and is `noindex`; its body never reaches production. | Q1/Q2 retain one approval flow while allowing unpublished posts to remain in source. Production has no preview pill or unpublished post output. |
| D10 | **Two shared publication gates.** Drafts: validate the shared YAML and metadata for `published`/`external` post records with the same draft walker, reporting every source/path; production fails on any unapproved field. Whole `publication: draft` posts are excluded before routes, listings and sitemap are generated. Unwritten sizes: every accessor instance records source/path/size in the shared set, asserted by the checks integration (D39) at `astro:build:done`. `PROSE_DRAFTS=allow` enables marked previews. | Preserves the owner's approval rule while allowing unpublished drafts in the repo. Word budgets remain documented; missing requested sizes are fatal. |
| D11 | **Theme switch keeps the current page** (`/blog/x/` → `/brutalist/blog/x/`). Today every switch lands on `/` (`theme-cycler.js:276`, `window.location.href = '/?style=' + …`). Palette-toy state persists for the session and survives reload (today a reload wipes the theme at `theme-bootstrap.js:687` and the toy at `:730-731`, both behind the reload detection at `:674-678`; the cycler's own `isReload()` is `theme-cycler.js:126-131`). `switchStyle` still clears toy state on every switch (`theme-cycler.js:275`), unchanged: a new theme has a new base palette. | Consistent with "reload keeps the theme" (intent §4.5). Listed in §15. |
| D12 | **Build a picker FAB on privacy and 404.** Retire the local LexChat iframe family and unused page assets, with no redirect; its retained project links directly to the owner's Hugging Face destination. | Owner amendment 2026-09-08 supersedes the original Q4 retention decision. |
| D13 | **Skins get their full sheet on every page type** (that is what a skin is; grid, banknote, gallery and neo-pop, plus the inactive constructivist, style `.privacy-*`/`.nf-*` today). "Tokens only" applies to structural themes' unowned page types and to utility pages under structural themes. | Parity for skins; intent §4.7 for structural. |
| D14 | **CSS `content:` prose.** marquee's sheet reads `content: var(--ticker-run, "<literal>")` (`marquee.css:572`); `--ticker-run` is data (deduped project tech), now computed at build (D35) and emitted in `<html style>` on pages that render the carousel. The fallback literal, which renders on post/privacy/404/lexchat under marquee, moves to `prose.themes.marquee.ticker` (the unit string; the build repeats it 12 times, byte-equal to today's literal). doodle's `content: 'currently here \2713'` (`doodle.css:535`) moves to `themes.doodle.currentlyHere`. Both reach CSS as `--prose-<key>` custom properties on `<html>` under that theme; the sheets become `var(--ticker-run, var(--prose-ticker))` and `var(--prose-currently-here)`. Counters and glyphs (`FIG.`, `№`, `✷`, `■`, `·`, `/`, `(01)`) stay in CSS as decoration (§13 Q6). | Intent §3.1; these are the only two `content:` literals that are prose rather than labels or ornament (`blueprint.css:652`'s `"FIG. "` is a third word-bearing literal but is a counter label, Q6). `research/prose-and-url-inventory.md` §2.9's claim that `--ticker-run` is never assigned is wrong, see §17. |
| D15 | **`<br><br>` paragraph separators** (about body, skills body 3, seven of the eight project descriptions; `deep-rl` is one paragraph) are stored as normal Markdown paragraphs; the canonical components call `prose.paragraphs(path, size)` and join with `<br><br>` inside one element (D37). Structural themes render the array as `<p>` elements. | Readable YAML, identical DOM for skins, and the join is a presentation choice in the component rather than a mode on the shared accessor (D17's principle). |
| D16 | **Calendly link inside prose** (new behavior, not parity): the renderer turns a Markdown link to `#calendly` into `<a href="#" class="text-link calendly-link">`; http(s) **and `mailto:`** links get `class="text-link" target="_blank" rel="noopener noreferrer"`, every other link `class="text-link"`, attributes emitted in today's order (`href, class, target, rel, title?`, `blog-post.js:8-15`). `.calendly-link` is **not** unique to the contact paragraph: `nav-config.js:59` puts it on the rendered Calendly social anchor (about four per page on home, one on the listing), so the canonical socials component emits it too and the click handler binds every `.calendly-link`, as today. | Markdown cannot emit the class; the contact paragraph must become prose. The `mailto:` branch is required by `index.html:273`, which carries `target="_blank" rel="noopener noreferrer"` on the email link. |
| D17 | **Section numbers** (`<span class="sec-num">01.</span>` … `05.` on home, `01.`/`02.` on the listing) are generated from section order per page; only the label is prose. Job titles are `role` + `company` (+ url); the hero subtitle is the three skill-group names joined by the component with `&nbsp;\|&nbsp;` (`index.html:79`). The jobs panel's DOM keys stay positional: the canonical Jobs component emits `data-job="job-{i+1}"` on the tabs and `id="job-{i+1}"` on the panels in source order (`index.html:153-156` and `:163,176,185,197`; `initJobsMenu` is `script.js:271-370`, reading `data-job` at `:344` and `getElementById(newJobID)` at `:355`); `jobs[].id` in prose is a content key only and never reaches the DOM. | Themes reorder sections; presentation quirks belong in components, not prose. |
| D18 | **Repo layout:** `src/` (components, prose, registry, pages), `public/` keeps today's URL paths for everything static (`/css/*`, `/js/*`, `/resources/*`, `/blog/posts/assets/*`, `/blog/*.css`, `/privacy/privacy-styles.css`, `/lexchat/lexchat-styles.css`) so the two sides resolve to the same file. The **href strings** still differ (today's pages author `css/styles.css` and `../css/styles.css`; the new side authors `/css/styles.css`), which is why §9 rule 6 maps them. New: `/vendor/*` (committed, D5). `CNAME` and `.nojekyll` stay at the repo root (needed only for a legacy-mode rollback) and are **not** put in `public/`. Intent §4.10 reflects this rollback-only placement. | GitHub docs: a custom Actions workflow ignores any `CNAME`; `upload-pages-artifact@v5` excludes every dotfile unless `include-hidden-files: true` (`research/deploy-and-parity-harness.md` §1.2-1.3, re-verified against the action's `action.yml`). Both facts verified; the rollback path is the only consumer. |
| D19 | **Post sources move to `src/content/posts/` in T2, with metadata and publication state colocated.** Published body links and asset URLs become root-absolute; two autoencoder records stay external listing items with archived bodies, and Gemma stays a draft. T5 renders the eight published local posts and generates redirects from known external ids. | Q1/Q2; avoids accidental publication and broken paths at the new route depth. |
| D20 | **Harness:** Playwright `@playwright/test@1.61.1` (pins Chromium and headless shell build 1228, both already in `~/Library/Caches/ms-playwright`, so no browser download), both sites served by `python3 -m http.server --bind 127.0.0.1` (old worktree :8781, `dist/` :8782), baselines generated from OLD then compared against NEW, DOM dump equality (under the §9 step 8 exception table) + screenshot diff + computed-token sample. `settle()` keeps four generic waits; every per-page-type readiness predicate lives beside its selectors in `harness/sentinels.ts`. | §9. Same server on both sides removes a class of false diffs; page knowledge in one file is what T8 grows. |
| D21 | **Deploy:** generic `actions/checkout@v7` → `setup-node@v7` → `npm ci` → `npm run build` → `upload-pages-artifact@v5` → `deploy-pages@v5` (latest majors on 2026-09-05: v7.0.1, v7.0.0, v5.0.0, v5.0.1), with a `workflow_dispatch` input `deploy` (`type: boolean, default: false`) guarding the deploy job. `withastro/action` not used. `refresh-chart-data.yml` gains `permissions: actions: write`, `env: GH_TOKEN: ${{ github.token }}` and `gh workflow run deploy.yml`. | §10; `research/deploy-and-parity-harness.md` §2.2-2.6. GitHub docs: pushes made with `GITHUB_TOKEN` never trigger `push` workflows; `workflow_dispatch` and `repository_dispatch` are the documented exceptions, and `actions: write` is the documented permission for the dispatch endpoint. |
| D22 | **`docs/` stops being served.** Today legacy Pages serves the whole repo, including three unpublished post drafts (`docs/planned-posts/`, which also holds `ai-job-market-listing.patch`) and `CLAUDE.md`. Nothing links there. Until cutover, `main` gets a `Disallow: /docs/` line in `robots.txt` (§14), because committing `docs/intents/` publishes the planning corpus at live URLs while Pages is still legacy. (Settled in §13 Q8.) | Free under Astro; a leak today, and a bigger one the moment the planning corpus is committed. |
| D23 | **`docs/theme-explorations.html` is frozen** with a banner comment pointing here; the engine's authoring docs move to `src/themes/README.md`, and `CLAUDE.md` is rewritten for the new layout plus the prose rule. | Intent §9 left this open; the file has six stale claims and eleven omissions (`research/theme-engine-contracts.md` §9), several load-bearing for the harness. |
| D24 | **Sitemap** is generated by `@astrojs/sitemap` at `/sitemap-index.xml` and `/sitemap-0.xml`. Include default-theme public pages and published local posts; exclude themed routes, 404, drafts and external-post redirect stubs. `lastmod` comes from each published post's authoritative date. `color-randomizer` and the withdrawn Gemma entry disappear; no duplicate local autoencoder URLs are added. | Q1/Q2 and intent §4.6. The old `/sitemap.xml` is retired; the owner resubmits the index (§14). |
| D25 | **Mobile structure for structural themes** (intent §9): CSS-first reflow; a theme that truly needs a different mobile DOM renders both subtrees toggled by media query and accepts the duplication. Must be resize-stable: no boot-time JS breakpoint flag. The theme's CSS owns its breakpoint; the engine adds nothing and the registry has no breakpoint field. | Both prototypes read the breakpoint once and break on rotation (`research/structural-theme-demands.md` §1.20). |
| D26 | **Every theme supports the palette randomizer; none hides or disables it.** Structural themes may use narrow `random` profiles and map the five roles into their own derived variables. Future internal modes keep session state under `theme.<id>.*`; the mode's pre-paint code applies its base, then any saved palette override, and maps changes to its derived tokens. Mode/override state is scoped per theme and mode. `dawson:palette` remains the notification contract. The first mode-owning consumer adds the mode UI and mapping; the Spec 1 fixture proves basic structural randomization now. | Settled Q10/Q12. The 16 existing themes keep their current palette behavior; extra color modes cannot remove access to the shared tool. |
| D27 | **The 404 page resolves its theme at runtime.** GitHub Pages serves one `/404.html` for every missing URL, so `/brutalist/nope/` cannot be prerendered per theme. `404.astro` is built in the default theme; a small bundled script reads the first path segment, else `?style=`, and if either names a theme applies `themeHtml(theme)` (D33) to the document: attributes (including `data-style`), the inline style, the three link appends in the bootstrap's order, and the active-row marker in `#tc-dock` that the cycler reads. This is the only page that carries the full registry and the only page that applies a theme at runtime; the brief default flash is accepted (§15). | Intent §4.7-4.8 want the 404 themed under every theme path; this is the only mechanism a static host allows. |
| D28 | **Registry slimmed to what the engine reads.** No `ORDER` (array order is picker order), no `owns` (the keys of `layouts`), no `storageNamespace` (keys are `theme.<id>.*` by rule; the canonical family keeps `dawson-theme-cycler` verbatim, and only structural themes use the namespace), no `breakpoint` (D25), no `root` CSS (a theme's root rules live in its own layouts, which fallback pages never import), and none of the structural fields spec 1 has no consumer for (D38). `layouts` values are lazy imports, so the registry never statically imports a layout. | Every dropped field was derivable, unused by the engine, or unbuilt; the lazy import keeps the module graph acyclic (§3.3). |
| D29 | **One page shell.** `Shell.astro` emits `<html>` and the shared tail of `<body>` from the composition: dock, scrim, cycler, optional FAB and draft pill. Each layout owns its head and parity-positioned `ThemeAssets`. The checks integration requires exactly one `ThemeAssets` marker on every page; picker-enabled compositions require one dock/scrim and a valid trigger. LexChat is the explicit picker-free composition and must emit none of those picker elements/scripts. | One owner for engine chrome, with Q4's explicit page exemption encoded in composition and tested. |
| D30 | **Picker trigger contract:** a mount is a `.tc-nav-item` element **containing a `button.tc-nav-trigger`** (`aria-haspopup`, `aria-controls="tc-dock"`, `aria-expanded` as `nav-config.js:98-105`). The canonical Nav, `PickerFab.astro` (a fixed `.tc-nav-item.tc-fab`) and `<ThemePicker />` all emit both. The cycler never creates DOM; `injectDom()` becomes `wireDom()`. | Click is bound on the trigger (`theme-cycler.js:686-688`) and hover-open on the item only under `(hover: hover) and (pointer: fine)` (`:594`), so a bare `.tc-nav-item` never opens on touch, which is exactly the utility pages the FAB exists for. |
| D31 | **`href()` is the only way a component writes an internal link** (§6.1): throws on relative paths, prefixes `/<theme>` onto every root-absolute path that is not a static asset, passes schemes and fragments through. `assertNoRelativeHrefs` (D39) fails the build on `href="..` or `href="blog/` in `src/`. | Mechanical instead of "remember to prefix", and the rule needs no knowledge of the post ids or of any theme's extra pages (D7 of the review round; see §6.1). |
| D32 | **No runtime theme registry and no `window.__*` theme globals.** The seven the bootstrap defines today (`__THEME_CYCLER_ENABLED` `:8`, `__THEME_REGISTRY` `:639`, `__THEME_ORDER` `:640`, `__ACTIVE_STYLE` `:700`, and the three helpers `:646`, `:654`, `:664`) are deleted rather than re-created: `<html>` gains `data-typing` and `data-typing-delete` beside `data-style`/`data-still`/`data-no-tilt`; the five tilt gates read `data-no-tilt` **in the polarity each one already has**, which is not uniform: the two **early-return** gates (`featured-carousel.js:190`, `script.js:257`, today `if (window.__styleAllowsTilt && !window.__styleAllowsTilt()) return;`) become `if (document.documentElement.hasAttribute('data-no-tilt')) return;`, and the three **positive** gates (`script.js:397`, `blog/blog-listing.js:142`, `blog/blog-post.js:182`, today `if (!window.__styleAllowsTilt \|\| window.__styleAllowsTilt()) {`) become `if (!document.documentElement.hasAttribute('data-no-tilt')) { … }`. Writing the negated form in all five would disable tilt on exactly the themes that allow it; `typing-engine.js:99,109` read `document.documentElement.dataset`; the cycler reads the rendered `#tc-presets` rows and `<html>` (§5.5). No `__PAGE_PATH` is introduced either: it appeared only in this spec's earlier draft, never in the codebase. The full registry ships on one page, the 404 (D27). §3.3's three bridges become one rule (§3.3). | Every consumer outside the cycler reads one flag of the active theme that `<html>` already carries, so the blob is a second carrier of a fact the page states; the edits are seven one-liners and output-identical (intent §4.13). |
| D33 | **One projection from theme to HTML.** `src/themes/apply.ts` exports `themeHtml(theme, colors = theme.colors) → { attrs, style, links }` (§5.4): pure, no DOM, no `src/` import but `ramp.ts`. The Shell spreads `attrs` and writes `style`, `ThemeAssets` maps `links`, the 404's script assigns the same value, the pre-paint override calls the ramp part with the saved colours. One byte-equality fixture (T3) covers all three adapters, and it is the guard on the ramp's two output formats: 95 step properties as `hsla()`, 5 base roles as raw hex (§5.4). | The mapping was otherwise written twice (Astro template and DOM code) with only the build side tested. The cycler's own ramp copy (`theme-cycler.js:24-40, 182-185`) stays until the cleanup pass: a classic script cannot import TypeScript. |
| D34 | **A page's composition is decided once.** `compose(theme, pageType)` (`src/layouts/compose.ts`, §5.2) covers the full page-type union including the utility pages and returns the layout, the asset set, the picker mount, the canonical URL and the robots flag. The Shell, `ThemeAssets` and `PickerFab` render that value and never inspect `theme.kind`; the Shell has no `pageType` prop. Each canonical layout writes its own head, sharing one `Meta.astro` spine; `Head.astro` and its per-page-type ladder do not exist. | The same three-way branch otherwise gets re-derived in five page files, the Shell and `ThemeAssets`, which is intent §3.4's "feature checks scattered through shared code"; one table test then covers the whole rule. |
| D35 | **Build-time facts stay at build.** Carousel dots (aria-label from prose), `--ticker-run`/`--ticker-dur` (today's formula: case-insensitive dedupe, `'✷ ' + t + ' '`, the pass doubled into a half and the half doubled into the run, `Math.round(half.length / (402/46))` s), the code copy buttons, and the mermaid `<script>` + `is:inline` initialize block + `mermaid.run` call (only on posts whose rendered body contains `class="mermaid"`) all move to build. `buildTickerRun`, `data-tech`, `addCopyButtons`, `data-copy-label` and `data-slide-label` are deleted, with settle's `--ticker-run` wait. | Each was a `data-*` bridge plus a DOM builder for a pure function of build data, against §3.3's own rule; the conditional mermaid emission also removes the lazy loader, so the initialize block can never run before the library. |
| D36 | **The masthead prose is the lines; the module derives the choreography.** `canonical.masthead.<page>` stores each sequence as an ordered list of terminal strings plus an optional per-sequence `pause` override; a ten-line pure function derives the `type`/`delete`/`pause` steps by longest common prefix; the JSON island carries the derived steps; `script.js` and `blog-listing-client.js` splice their page's callback after the first `type` step, as today. Schema rule 5 (delete counts) is deleted. | Verified mechanically across all 16 sequences: every hand-counted delete equals that derivation. Hand-counted integers and animation vocabulary do not belong in the owner's prose file, and a JSON island cannot carry the function-valued callback step the sequences have today. |
| D37 | **One validated accessor implementation for shared and post prose.** Size maps are inaccessible through `data`; `get`/`text`/`list`/`paragraphs`/`has` share draft marking and unwritten-size recording. `createProseAccess` binds a validated tree and source namespace; `prose` and `post.prose` use it. `astro check` runs before the production build, with a negative type fixture in T2. | Q1 changes ownership, not the approval/validation contract. Post layouts must not introduce a second renderer or bypass for sized metadata. |
| D38 | **Spec 1 ships a demonstrated structural authoring contract:** `kind`, `layouts`, composition/fallback, the Shell and picker, plus §5.3's representative test-only theme. T3 establishes the fallback test; T8 verifies the full workflow and closes architecture gaps before cutover. `extraPages`, `picker`, `modes`, the `chrome` and `<defs>` slots, `--tc-z`, `fragments(n)`, per-slot `constraints`, the optional `category`/`year`/`summary`/`description.s`/`group`/`images[]` fields and plural template fields remain future-consumer additions per §11. Theme-only pages use theme-owned page files; no registry field is needed. | Intent §3.4 and §8.1 now require proof of clean authoring in Spec 1. The fixture exercises the shipped contract without implementing one of the five production themes or speculative future APIs. |
| D39 | **Engine invariants live in `src/build/checks.ts`**, one integration whose `astro:build:done` hook calls named pure functions (`assertNoUnwrittenSizes`, `assertShellInvariants`, `assertNoRelativeHrefs`) over the hook's `pages[]`, plus `assertNoYamlSyntaxError` in `astro:config:setup`. It iterates page routes only, so redirect stubs and `public/` passthroughs are not scanned. No `globalThis` side channel: the accessor exports its unwritten set from module scope, and T0 keeps one check that the two modules share an instance. | Theme-engine assertions do not belong in the prose integration merely because it owns the hook, and an untyped global is a hidden contract between two modules that can import each other. |

---

## 3. Architecture

### 3.1 Layout

```
astro.config.mjs  package.json  package-lock.json  .nvmrc  tsconfig.json  playwright.config.ts
CNAME  .nojekyll                               # repo root: legacy-mode rollback only (D18)
src/
  content.config.ts                            # shared prose collection + post sources with publication filtering
  content/prose.yaml                           # THE prose file (§4)
  content/posts/*.md                           # metadata + body; published/external/draft (D8/D19)
  prose/fields.ts  prose/schema.ts  prose/index.ts  prose/markdown.ts # reusable field types; site schema; accessor; marked
  posts/schema.ts                              # pure post schema; no theme/Astro-runtime dependency
  prose/drafts.ts  prose/integration.ts  prose/check.ts  # draft walker; collection wiring; `npm run prose:check`
  build/checks.ts  build/posts.ts               # invariants; shared post-source reader + publication projections (§7)
  themes/types.ts  themes/registry.ts  themes/paths.ts   # types; THEMES + assertions; themeParams(), href()
  themes/ramp.ts  themes/apply.ts  themes/README.md      # ramp; themeHtml() (build, 404, pre-paint); docs
  layouts/Shell.astro  ThemeAssets.astro  compose.ts     # §5.2, §5.4
  layouts/canonical/                           # the default layout family (canonical DOM)
    Meta.astro  Home.astro  BlogListing.astro  BlogPost.astro  Privacy.astro  NotFound.astro  LexChat.astro
    components/  Nav.astro Hero.astro About.astro Skills.astro Jobs.astro FeaturedCarousel.astro
                 BlogRail.astro BlogCards.astro Contact.astro Footer.astro Socials.astro
                 ThemePicker.astro PickerFab.astro DraftPill.astro PalettePrepaint.astro StyleQueryShim.astro
  pages/
    [...theme]/index.astro   [...theme]/blog/index.astro   [...theme]/blog/[id].astro
    [...theme]/privacy/index.astro   [...theme]/lexchat/index.astro   404.astro
scripts/vendor-map.mjs  scripts/vendor.mjs     # the one vendor table; `npm run vendor` copies (D5)
harness/  parity.spec.ts  settle.ts  normalize.ts  urls.ts  sentinels.ts  scripts.ts  __parity__/ (gitignored)
public/
  css/ (styles, mobile-styles, featured-carousel, theme-cycler, themes/*.css incl. the 4 inactive)
  js/  (anim-utils, typing-engine, featured-carousel, script, cursor-follow, nav-behavior,
        theme-cycler, blog-post-client, blog-listing-client)          # classic scripts (D3)
  vendor/ (committed: jquery, jquery-ui, gsap, aos, vanilla-tilt, highlight.js css, fontawesome, boxicons)
  blog/blog-styles.css  blog/blog-listing-styles.css  blog/post.html (shim)  blog/posts/assets/*
  privacy/privacy-styles.css  lexchat/lexchat-styles.css  resources/*  robots.txt
  subsites/elise/12years/   subsites/dawson/embedded-swift-agent/   # location per §13 Q3
.github/workflows/deploy.yml  refresh-chart-data.yml
docs/prebake-cohort-data.py                     # OUT_DIR updated (T7)
```

### 3.2 `astro.config.mjs`

```js
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import prose from './src/prose/integration.ts';
import checks from './src/build/checks.ts';
import { THEME_IDS } from './src/themes/registry.ts';
import { postDates, publishedPostIds } from './src/build/posts.ts'; // reads authoritative post sources

export default defineConfig({
  site: 'https://www.dawsonamf.com',
  output: 'static',
  trailingSlash: 'always',
  compressHTML: false,                 // D2: parity
  prerenderConflictBehavior: 'error',  // D2: duplicate prerendered URLs and duplicate entry ids (default is 'warn')
  build: { format: 'directory', inlineStylesheets: 'never' },
  markdown: { syntaxHighlight: false },// posts do not go through Astro's pipeline (D6)
  redirects: {                         // static output: <meta http-equiv="refresh"> stubs, no status code
    '/12years/': '/subsites/elise/12years/',
    '/embedded-swift-agent/': '/subsites/dawson/embedded-swift-agent/',   // settled Q3
  },
  integrations: [prose(), checks(), sitemap({
    filter: (page) => !THEME_IDS.some((id) => new URL(page).pathname.startsWith(`/${id}/`))
                   && !/\/404(\.html|\/)$/.test(page)
                   && (!/^\/blog\/[^/]+\/$/.test(new URL(page).pathname)
                       || publishedPostIds().includes(new URL(page).pathname.split('/')[2])),
    serialize: (item) => { /* lastmod for /blog/<id>/ from postDates() */ return item; },
  })],
});
```

`serialize` cannot read a content collection: `astro.config.mjs` runs before collections exist. The
date map comes from `src/build/posts.ts`, which reads and validates the same post frontmatter
sources as the post collection, using js-yaml and shared schema helpers. It filters by publication
state, so sitemap dates and page metadata have one source. It lives outside `themes/` so `paths.ts` keeps no content dependency (§6.1). The integration emits `/sitemap-index.xml` and `/sitemap-0.xml`, never `/sitemap.xml` (D24).

### 3.3 Build-time vs runtime boundary

Build time (TypeScript, typed): prose loading and validation, Markdown rendering, theme registry,
route generation, page composition, head emission, theme attributes and tokens, static markup for
everything that depends only on data (nav, cards, carousel including its dots and ticker properties,
jobs panel markup, dock rows, code copy buttons, JSON-LD, sitemap, redirects).

Runtime (classic scripts in `public/js/`, contracts documented in `src/themes/README.md`): intro
reveals, typing masthead, jobs panel switching, carousel click-centering and scroll tracking, tilt,
cursor follower, AOS, sticky header, smooth scroll, Calendly popup, palette toy and dock open/close,
copy-button clicks, `mermaid.run`, read time, blog filter, the 404's theme application (D27).

The canonical runtime is a layout-family dependency, not an engine dependency. Theme authors use
the typed build-time contract and the documented shared picker/data contracts; they do not edit
canonical scripts to install a theme. T4/T5 document the retained modules' owners, inputs,
dependencies and lifecycle. T8 verifies their isolation and completes any necessary refactoring
under D3 before architecture sign-off (§1.1).

One rule for build-to-runtime data (D32): **a script reads `data-*` on the element it owns, or a
JSON island emitted by the component that owns the data.** The active theme's flags ride on `<html>`
(`data-style`, `data-still`, `data-no-tilt`, `data-typing`, `data-typing-delete`); the dock's strings
and the per-theme row data ride on the rendered `#tc-dock` and `#tc-presets` rows; the masthead steps
ride on one `<script type="application/json" id="masthead-sequences">` on home and listing. There is
no `window.__*` theme namespace and no runtime registry except on the 404 (D27). No runtime code
parses the prose file.

Module graph (one direction, no cycles): `themes/types` ← `themes/registry` ← `themes/paths` ←
`layouts/canonical/*` ← `layouts/compose` ← `pages/*`; `prose/schema` → `themes/registry` for the
rule-4 cross-check. `prose/*` is a leaf imported by layouts and components; `build/checks` imports
`prose/index` (the unwritten set) and nothing else from `src/`; `build/posts` uses only the pure post schema/field helpers and reads the post sources; it never
imports theme modules or `astro:content`. It serves the collection, route projections, sitemap
and checks without depending on Astro's runtime collection instance. `themes/ramp` and `themes/apply`
import nothing from the rest of `src/` (the 404 client script and the pre-paint component bundle
them). Structural theme entries reference layouts only through `() => import(...)`.

---

## 4. Content model

### 4.1 `prose.yaml` shape

```yaml
# Shared site/theme prose; each post owns its metadata/body (§7). Read src/themes/README.md.
# A plain string is approved. { draft: "…" } is unapproved and blocks the production build.
# Sizes: xs ≤ ~3 words · s one line ≤ ~15 words · m ≤ ~60 words or ≤ 3 bullets · l = full.
# null at a size = "nothing fits here, omit the element". A missing size is only an error
# when some theme requests it; the build then lists exactly what is unwritten.
# Quote any flow-mapping value containing , { } [ ] # or ": " (rule 8).

site:
  name: { xs: Dawson Metzger-Fleetwood }
  logo: { xs: D }                                      # the wordmark glyph, on all six pages
  titleSuffix: { xs: Dawson Metzger-Fleetwood }        # "<title> | <suffix>" on blog, post, privacy and 404 only;
                                                       # home is "Dawson Metzger-Fleetwood" and lexchat is "LexChat"
  email: dawsonamf@icloud.com                          # data, not prose
  footerCredit: { s: Designed and built by Dawson Metzger-Fleetwood }   # one string, desktop + mobile footers
meta:                                                  # per page type: title (s), description (m), og description (s)
  home: { title: { s: Dawson Metzger-Fleetwood }, description: { m: "…" }, ogDescription: { s: "…" } }
  blog: …   post: { description: { s: A blog post by Dawson Metzger-Fleetwood. } }   privacy: …   notFound: …   lexchat: …
nav:                                                   # labels only; which items appear where is structure (Nav.astro)
  about: { xs: About }  experience: { xs: Experience }  projects: { xs: Projects }  blog: { xs: Blog }
  contact: { xs: Contact }  resume: { xs: Resume }  email: { xs: Email }  theme: { xs: Theme }
  aria: { main: { xs: Main navigation }, quick: { xs: Quick links }, social: { xs: Social links } }
socials:                                               # order = render order; label doubles as aria-label
  - { id: linkedin, label: { xs: LinkedIn }, href: https://…, icon: fab fa-linkedin }
  - { id: x, label: { xs: "X (Twitter)" }, href: https://…, icon: fa-brands fa-x-twitter }
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
jobs:                                                  # 4 entries today; `id` is a content key only (D17)
  - id: about-objects
    company: { xs: About Objects }
    role: { xs: Software Engineer }
    url: https://www.aboutobjects.com/
    dates: { xs: "July 2023 – Present" }               # verbatim, including the dash each entry uses today
    bullets: { l: [ "…", "…", "…", "…", "…", "…", "…" ] }   # 7 for about-objects (index.html:163-176)
projects:                                              # 8 entries today
  - id: silicon-fly
    title: { xs: Silicon Fly }
    description: { l: | … Markdown paragraphs … }
    image: /resources/Fly_Media.jpg
    accentColor: "#…"                                  # data
    tech: [ Metal, Swift, Compute Shaders, Connectomics, GPU ]     # xs list; also feeds --ticker-run (D35)
    ctas: [ { label: { xs: Read the post }, href: /blog/fly-on-my-laptop/ }, { label: { xs: View on GitHub }, href: "https://…", external: true } ]
    # `external` is per CTA, but today's second CTA inherits the first's target when it has none of its own
    # (`linkTarget2` fallback, featured-carousel.js:70): embedded-swift-agent sets external2 and no external,
    # so its CTA 2 renders with CTA 1's target/rel. The component reproduces that fallback. deep-rl has no CTAs.
post:                                                  # post-page chrome
  copyCode: { xs: Copy code }                          # aria-label on every copy button (rendered at build, D35)
  readTime: { xs: "{n} min read" }                     # template; the client substitutes {n}
carousel: { goToSlide: { xs: "Go to slide {n}" } }     # dot aria-label template (rendered at build, D35)
blog:
  intro: { p1: { l: "…" }, p2: { l: "…" }, p3: { l: "…" } }   # three paragraphs; the listing stamps today's ids (§7)
  sections: { works: { xs: Selected Works }, posts: { xs: All Posts } }
canonical:                                             # strings only the canonical layout uses
  masthead:                                            # each sequence is its terminal lines in order; steps derived (D36)
    home:                                              # 9 sequences (script.js:129-192), default pause 1500 ms
      - { lines: [ "Hi,\nI'm Dawson,\nweb developer.", "iOS developer.", "…" ] }
      - { lines: [ "…" ], pause: 1000 }                # the one outlier (script.js:146)
    listing: [ … 7 sequences … ]                       # blog-listing.js:38-88, default pause 800 ms
picker:                                                # the theme picker's own UI strings (theme-cycler.js)
  ariaLabel: { xs: Theme controls }  styles: { xs: Styles }  palette: { xs: Palette }  advanced: { xs: Advanced }
  backToStyles: { xs: Back to styles }  shuffle: { xs: Shuffle colors }  shuffleSub: { xs: random palette }
  reset: { xs: Reset }  resetSub: { xs: back to default }  advancedSub: { xs: "scheme & colors" }  doneEditing: { xs: done editing }
  scheme: { xs: Scheme }  colors: { xs: Colors }  current: { xs: current }  preview: { xs: preview }
  roles: { text: { xs: Text }, bg: { xs: Background }, primary: { xs: Primary }, secondary: { xs: Secondary }, accent: { xs: Accent } }
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
  title: { xs: Privacy Policy }  updated: { xs: "Updated January 10, 2026" }  body: { l: | … 738 words of Markdown with ## / ### / lists … }
notFound: { code: { xs: "404" }, message: { s: "This page doesn't exist, or it moved." }, back: { xs: Back to the home page } }
lexchat: { title: { xs: LexChat } }
```

Rules the schema enforces (all objects are `z.strictObject`, so a misspelt key fails):

1. A prose field is `Record<'xs'|'s'|'m'|'l', string | { draft: string } | null>` with at least one
   size and no other keys. `bullets` is the same with string arrays. Chip and tag lists are
   `(string | { draft: string })[] | null` (each item `xs`), so a new chip takes the draft flow (D37).
   Template fields (`post.readTime`, `carousel.goToSlide`) must contain `{n}`.
2. `xs` strings contain no Markdown (`[`, `*`, `` ` ``); they are used raw in attributes.
3. Shared YAML contains no post records. Post source ids are unique filenames; their publication
   state and required metadata are validated by §7's post schema, using these same prose field types.
   The production listing-id set must equal today's ten active entries; no draft id may enter it.
4. `themes` keys must equal `THEME_IDS`; every entry has `label.xs`.
5. Drafts: unless `PROSE_DRAFTS=allow`, every `{ draft }` in the shared YAML or publishable post
   metadata is an issue, reported with its source/path (D10). Whole unpublished post drafts are
   excluded from production and do not block it.
6. The `file()` loader swallows YAML syntax errors into an empty collection
   (`research/astro-capabilities.md` §2.2, §3.11; confirmed in the loader source), so
   `assertNoYamlSyntaxError` (D39) parses the file itself in `astro:config:setup` and throws.
7. Strings are plain text in YAML (no HTML escaping): `AI & ML` is stored as written; the renderer
   escapes once, so the served HTML says `AI &amp; ML` and the DOM text stays `AI & ML`, as today.
8. YAML flow mappings (`{ xs: … }`) end a plain scalar at `,`, so any value containing `,`, `{`, `}`,
   `[`, `]`, `#` or `: ` is quoted. Affects `privacy.updated`, `notFound.message`, several `socials`
   labels and every URL with a query string. A block mapping is used instead wherever quoting hurts
   readability.

What existing text becomes: everything live today enters as approved prose at the size the canonical
family asks for. The canonical family requests `l` for bodies, bullets, excerpts and project
descriptions; `m` for `meta.*.description` and `home.contact.body`; `s` for `meta.*.title`,
`meta.*.ogDescription`, each post's `title` and `site.footerCredit`; `xs` everywhere else (labels, chips,
tags, theme labels, nav, picker strings, the logo glyph, templates). Those are the only sizes this
spec writes; the first structural theme's build lists the sizes it needs and those arrive as drafts.

### 4.2 Accessor (`src/prose/index.ts`, build-time only)

```ts
import { prose } from '~/prose';                     // never imported by client code
prose.data                                            // the validated tree with every size map typed `never` (D37): urls, ids, dates, colours, tech, cta shapes
prose.get('home.about.body', 'l')                     // string: Markdown rendered to HTML (block for m/l, inline for xs/s)
prose.paragraphs('home.about.body', 'l')              // string[]: one rendered paragraph per source paragraph (D15)
prose.text('nav.about', 'xs')                         // string: plain text, HTML-escaped once (attributes, <title>, JSON-LD, split-text slots)
prose.list('jobs.0.bullets', 'l')                     // string[]: each rendered inline
prose.has('jobs.0.bullets', 'm')                      // boolean
```

Paths are dot paths into the tree; lists are addressed by index (components iterate `prose.data`
and pass the index). Behavior per `(path, size)`:

| State | `get` / `text` | `list` / `paragraphs` | `has` | Side effect |
|---|---|---|---|---|
| written string | rendered value (draft-marked per D9) | items | `true` | none |
| `null` | `''` (component omits the element) | `[]` | `false` | none |
| absent | `''` | `[]` | `false` | recorded as unwritten → build fails at the end (D10) |
| no such `path` | throws | throws | throws | build fails immediately (a typo is a bug, not a gap) |

Post layouts use `post.prose.text('title', 's')` and the same accessor methods for description/tags.
`createProseAccess(tree, source)` underlies both `prose` and `post.prose`; source-qualified paths
share the draft walker and unwritten set. There is no duplicate post tree in the shared YAML.

Markdown rendering is marked 18.0.5 with `gfm: true, breaks: false` and the link rule from D16;
`text()` renders inline then strips tags. Output is injected with `set:html` on a `<Fragment>` so no
wrapper appears. The same `src/prose/markdown.ts` renders post bodies (§7).

### 4.3 Draft flow, standing rule, lint

`CLAUDE.md` gains the settled ownership rule: shared site/theme prose belongs in
`src/content/prose.yaml`; post-specific metadata and body belong to the post source. New prose
fields use `{ draft: ... }` until approved. New/rewritten post bodies remain `publication: draft`
until the owner approves publication. Whole unpublished drafts are preview-only and never copied
to production; draft fields in publishable metadata or shared prose fail the production check.

Verbatim subsites and existing per-post scripts/assets are grandfathered for migration parity.
This is not permission to add future unapproved strings there: new/changed UI strings use the
owning content source and approval flow. `underviewed-art.js:295` gets an approved aria-label
template when its text is next touched (Q11). Blog bodies are approved as whole documents.

npm scripts: `dev` = `PROSE_DRAFTS=allow astro dev`; `check` = `astro check`;
`build` = `npm run prose:check && npm run check && astro build`;
`build:preview` = `PROSE_DRAFTS=allow astro build`; `vendor` = `node scripts/vendor.mjs`;
`prose:check` = `node src/prose/check.ts`. The last command uses the shared walker and source
reader to report every unapproved shared/publishable metadata field before Astro runs.
`@astrojs/check@0.9.10` and `typescript@5.8.3` are exact dev pins: the checker's declared peer
range supports TypeScript 5/6, not the registry's current TypeScript 7. T0 confirms the toolchain.
An optional pre-push hook may run the same check; enabling it remains an owner action.

---

## 5. Theme engine

### 5.1 Registry (`src/themes/registry.ts`, build-time only)

```ts
type PageType = 'home' | 'blog' | 'post' | 'privacy' | 'notFound' | 'lexchat';   // the full union compose() covers
type OwnablePageType = 'home' | 'blog' | 'post';        // utility pages are never owned by a theme (intent §4.7)
type Colors = { text: string; bg: string; primary: string; secondary: string; accent: string };
type RandomProfile = { light: Profile; dark: Profile };  // today's palette-toy shape, unchanged
type LazyLayout = () => Promise<{ default: AstroComponentFactory }>;   // () => import('./cream/Home.astro')
interface ThemeBase {
  id: string;                     // URL segment; RESERVED: blog, privacy, lexchat, subsites, 12years,
                                  // embedded-swift-agent, 404, sitemap, sitemap-index, robots, _astro, vendor, css, js, resources
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
interface StructuralTheme extends ThemeBase {                       // the whole structural surface spec 1 ships (D38)
  kind: 'structural';
  layouts: Partial<Record<OwnablePageType, LazyLayout>>;            // owned page types = the keys
}
export type Theme = SkinTheme | StructuralTheme;
export const THEMES: Theme[] = [ /* default, then the 15 skins in today's ORDER (theme-bootstrap.js:637) */ ];
export const THEME_IDS = THEMES.map((t) => t.id);                 // array order = picker order
```

`label` is not in the registry: it is `prose.themes.<id>.label.xs`. The four inactive sheets (`space`,
`vapor`, `wanted`, `constructivist`) stay on disk under `public/css/themes/` with no registry entry, as
today; today's entries are commented out in place in `theme-bootstrap.js` (`:213-239`, `:243-265`,
`:428-456`, `:460-495`) and go with that file. They survive in git history, and `src/themes/README.md`
names the commit and the line ranges so re-activating one is a paste, not a rewrite. The module
asserts at import (throw): `THEMES[0]` is `default`, kind `skin`, without `css`, `flags`, `tokens` or
`fonts`; ids unique; no id in `RESERVED`; every skin `css` file exists under `public/css/themes/`;
every structural theme has at least one layout. The prose ↔ registry cross-checks live in the schema
(§4.1 rule 4). No client code reads this module: what a script needs is on `<html>` or on the element
it owns (D32), except on the 404 (D27).

Storage keys: the canonical family keeps today's keys verbatim (`dawson-theme-cycler`, `dawson-style`
in sessionStorage, `theme-cycler.js:124-125`). The `theme.<id>.*` namespace rule (D28) governs
structural themes' own state only, so the two conventions never overlap.

### 5.2 Page composition (`src/layouts/compose.ts`)

`compose(theme, pageType) → Composition` is the single place the skin / owned / fallback rule is
decided, over the full `PageType` union:

```ts
type Composition = {
  layout: AstroComponentFactory;                 // canonical[pageType] or the theme's own
  assets: { fonts: boolean; base: boolean; skin: boolean };   // what ThemeAssets emits
  picker: { mount: 'nav' } | { mount: 'fab'; corner: 'br' | 'bl' | 'tr' | 'tl' } | { mount: 'none' }; // none only for LexChat
  canonical: string;                             // absolute URL of the default-theme page
  noindex: boolean;                              // true on every /<theme>/ path
};
```

| theme, page type | layout | assets | picker |
|---|---|---|---|
| `default` | canonical | none | nav; privacy/404: fab; lexchat: none |
| skin, any page type | canonical | fonts, `theme-base.css`, skin css | nav; privacy/404: fab; lexchat: none |
| structural, page type in `layouts` | the theme's layout | fonts | fab; an own-mount declaration is added with its consumer (§11) |
| structural, unowned home/blog/post | canonical | fonts, `theme-base.css` | nav |
| structural, utility page type | canonical | fonts | privacy/404: fab; lexchat: none |

Each page file is five lines: `getStaticPaths` from `themeParams()` (× post ids for `[id].astro`),
`compose`, `<Layout theme page composition />`. The Shell, `ThemeAssets` and `PickerFab` render what
the composition says and never inspect `theme.kind`; the Shell has no `pageType` prop (D34). One
table test over {skin, structural-with-layout, structural-fallback} × the six page types covers the
whole rule, and T3's stub-theme fallback test hits the same interface.

### 5.3 Structural authoring contract and acceptance fixture

Spec 1 ships the discriminated type, owned-page composition and fallback, the reserved-id
assertion, `href()`, the picker trigger contract (D30), the Shell's end-of-body mount and the
storage-key rule (`theme.<id>.*`). Structural owned pages use the FAB by default until a consumer
adds the own-mount declaration in §11. The five production themes and their additional modes,
extra pages, preloaders and smooth-scroll wrappers remain in their own specs (D38).

T3 establishes the composition table test and initial fallback stub. T8 extends that into a
representative fixture under `harness/fixtures/theme-authoring/`, using the completed T4-T6
components and runtime. The fixture is assembled in an isolated test build through the normal
registration and prose/schema extension points, uses existing approved prose, and never appears
in the production registry, picker, routes, sitemap or output. No fixture-specific branch is
added to the shared engine.

The fixture checks the following at both 1440px and 390px, including a resize between them:

1. An owned home page uses a distinct DOM, its own head, responsive layout, root CSS, stylesheet
   and small behavior script. It reads sized prose through the accessor and uses `href()` for
   internal navigation. Adding it changes only theme-owned files, registration and prose/schema
   registration; the test records that file-change list against the documented authoring steps.
2. Its unowned listing/post and utility pages use canonical composition with the declared tokens
   and fonts. Owned-page root sizing, selectors, script and assets do not leak into those pages
   or default-theme pages. The test asserts this in built HTML and loaded resources/computed styles.
3. Its owned page loads no canonical behavior or canonical-only libraries. The shared picker
   opens from the FAB by mouse and touch and can switch to an existing theme. A subsequent
   navigation/reload follows the normal theme-path rules without any canonical runtime dependency.
   Its randomizer is visible and enabled, produces an effective palette within the declared
   profile, and restores it before paint after navigation/reload. LexChat stays picker-free.
4. The ordinary prose validation, route generation and Shell checks run against the fixture;
   a production build afterward contains none of its registration, routes or assets.

This is an authoring/integration check with its own expected behavior, separate from the old-site
parity matrix. T8 records the results, permitted file-change list and retained-code audit in
`research/architecture-signoff.md`; `src/themes/README.md` contains a working authoring walkthrough
for skins and structural themes. Any missing boundary or extension point needed by this fixture
is fixed before Spec 1 is accepted. §11 maps additional capabilities to their future consumers.

### 5.4 Shell, theme assets, pre-paint

`themeHtml(theme, colors?)` (`src/themes/apply.ts`, D33) is the one projection. It returns:

- `attrs`: `data-style`, `data-still`, `data-no-tilt`, `data-typing`, `data-typing-delete`, set for
  non-default themes exactly as `theme-bootstrap.js:704-706` sets the first three (`:703` is the
  non-default guard around them; the two typing
  attributes are new carriers of `typing`/`typingDelete`, D32; they are in the §9 exception table and
  §15.10).
- `style`: the ordered declarations for `<html style>`: the theme's tokens, then the 100-property
  colour ramp, which is **not** one format but two (`STEPS` is declared at `theme-bootstrap.js:671`:
  19 alphas × 5 roles = **95 step properties**, written by `:771` as `hsla(H,S%,L%,A%)` with
  `toFixed(0)`, no spaces and a percentage alpha, plus the **5 base roles** (`--text`, `--bg`,
  `--primary`, `--secondary`, `--accent`), written by `:766` as the registry entry's **raw hex string**
  and never converted; interleaved per role (`--text`, `--text5` … `--text95`, then `--bg`, …);
  ported to `src/themes/ramp.ts`; the default theme gets the ramp and nothing else, as today), then the
  `--prose-*` properties from D14 under marquee/doodle, then `--ticker-run`/`--ticker-dur` on pages
  that render the carousel (D35).
- `links`: the theme's font hrefs, then `/css/themes/theme-base.css`, then the skin sheet, in the
  bootstrap's order (`:715-721`).

`Shell.astro` (props `theme`, `page`, `composition`) emits `<html lang="en" {...attrs} style={style}>`,
the layout's head slot, the layout's content, and then the tail of `<body>`: `#tc-dock` + `#tc-scrim`
(the markup `injectDom()` builds today, strings from prose as `data-*` attributes, preset rows from
the registry), `<script defer src="/js/theme-cycler.js">`, `<PickerFab />` when
`composition.picker.mount === 'fab'`, `<DraftPill />` (its CSS and JS `is:inline`, so even preview
builds inject nothing) when `PROSE_DRAFTS=allow`.

`ThemeAssets.astro` maps `links` to `<link data-style-asset="1">`; `composition.assets` decides which
of fonts / base / skin apply; nothing for `default`. **The layout, not the Shell, places it**, at the
position today's runtime append lands (§6.2). The attribute is live, not decoration:
`typing-engine.js:293` re-measures the masthead when those links load.

Pre-paint scripts: two on canonical routes, one on themed routes (a structural theme may add its own,
D26). Both sit in the layout's head at the bootstrap's position
(immediately after `/css/theme-cycler.css`, §6.2), so they run before first paint exactly as the
blocking bootstrap does today:

```astro
{/* PalettePrepaint.astro: on every page, is:inline, before paint */}
<script is:inline>
  try {
    var s = JSON.parse(sessionStorage.getItem('dawson-theme-cycler') || 'null');
    if (s && s.colors && s.colors.length === 5) { /* rewrite the 5 base roles (raw hex) + the 95 hsla() steps */ }
  } catch (e) {}
</script>
{/* StyleQueryShim.astro: default-theme routes only, never on 404 (D27) */}
<script is:inline>
  var p = new URLSearchParams(location.search), q = p.get('style');
  if (q && q !== 'default' && ['default','brutalist',/* THEME_IDS inlined at build */].indexOf(q) > -1) {
    p.delete('style');
    var rest = p.toString();
    location.replace('/' + q + (location.pathname === '/' ? '/' : location.pathname)
                     + (rest ? '?' + rest : '') + location.hash);
  }
</script>
```

The palette override is the pre-paint behavior today (`theme-bootstrap.js:727-742`), and D11 makes it
load-bearing: without it every navigation and reload with an active palette paints the base colours
and flips at `DOMContentLoaded`. It inlines the ramp function from `ramp.ts` (D33), so there is one
implementation of the ramp at build and at pre-paint. The `?style=` shim preserves the rest of the
query string and the hash; the `/` branch is written out so the root case is obvious; an unknown id
is ignored, as the guard at `theme-bootstrap.js:689` (`if (param && REGISTRY[param])`) does today,
which falls through to the session-stored value at `:693-696` instead. On the 404 the shim is absent because that page's own
script handles both `?style=` and the path segment (D27).

The 404 page adds a bundled `<script>` (D27) carrying `THEMES` (the only page that does):
`id = [location.pathname.split('/')[1], q].find(x => THEME_IDS.includes(x))`; if `id` and not
`default`, it assigns `themeHtml(THEMES.find((t) => t.id === id))`: the attributes (including `data-style`, which is what
the cycler reads for the active style), `style.cssText`, the links appended in order, and the
current-row marker moved to that theme's row in `#tc-dock`. The path-segment resolution is a pure
expression and is unit-tested in T6.

### 5.5 Picker behavior changes (`public/js/theme-cycler.js`)

Kept: dock geometry constants (`MEASURE 940`, `EDGE 10`, 300 ms hover-close, 440 ms hide),
`void dock.offsetWidth` (rAF is throttled under automation), the `(hover: hover) and (pointer: fine)`
hover-open gate (`:594`), the click binding on `.tc-nav-trigger` (`:686-688`), Space-to-shuffle,
palette generation, derived neutrals, `dawson:palette` (still no `detail`), `loadAllFonts` after idle
(§13 Q5), session restore from `dawson-theme-cycler`, and the clear-on-switch of toy state (`:275`).

Changed:

- `injectDom()` → `wireDom()`: queries `#tc-dock`/`#tc-scrim`, never creates them. The dock's class
  names and nesting (`.tc-dock .tc-mega .tc-presets .tc-action .tc-schemes .tc-role .tc-sw`) are part
  of the parity surface and do not change. The stale "all 20 skins" comment (`:509`) goes.
- Where it reads the registry, it reads the DOM (D32). The build renders today's exact row markup
  (`theme-cycler.js:302-308`), which is more than a `<li>` and an `<a>` and carries **no `tc-row`
  class**: the `<li>` has `class=""` except on the active row, where it is `tc-row-sel`, and the
  `--tc-row-*` custom properties in its `style`; inside it an
  `<a href data-id class="tc-row-link menu-item tc-stagger [tc-sel]" [aria-current="true"]>` and a
  sibling `<button data-id class="tc-row-card tc-stagger [tc-sel]" aria-pressed tabindex="-1"
  aria-hidden="true">` wrapping `span.tc-wm-name` + `span.tc-wm-rule`. Both elements carry `data-id`.
  That markup, plus the `--tc-row-*` properties and a new `data-fonts` on the anchor (a JSON array of
  that theme's Google Fonts URLs, for `loadAllFonts`, `:370-387`), replaces
  `__THEME_REGISTRY`/`__THEME_ORDER` (`:9-10`, read at `:287-305`, `:335-349`, `:374-377`). Emitting a
  `tc-row` class the current DOM lacks would be a diff the step 8 table does not except. `DEFAULT_COLORS` (`:13`) is the default row's colours. Every read of a
  `--tc-row-*` value is `row.style.getPropertyValue(name).trim()`: custom properties round-trip with
  their authored leading whitespace, and the divergence test at `:216` is a raw lowercased string
  compare, so an untrimmed read would report "diverged" on a fresh page and swap the theme's neutrals
  for the derived blends.
- The active theme's `polarity` and, for the three themes that have one, its `random` profile
  (`:102-103`) ride on the active row as one small JSON attribute.
- The `DERIVED_NEUTRALS` baseline (`:208`, branch at `:217-224`) is snapshotted from `<html style>`
  **before the first `applyDerivedNeutrals()` write**; capturing it lazily on that first call is fine,
  capturing it after is not, because the function writes those same properties. `boot()` is what
  orders this: it calls `restore()` at `:751` and `applyColors()` at `:754`, and `applyColors` is the
  one real call edge into `applyDerivedNeutrals` (`:187`). `restore()` does **not** call `applyColors`,
  so the three are a sequence `boot()` imposes, not a chain. The build writes the entry's tokens and
  the pre-paint override rewrites only the ramp, so the snapshot holds the theme's base values, which
  is what the cycler assumes today. The arithmetic differs by entry: for the **15 non-default** themes
  the baseline is **four values plus two removals**, because each defines all four `--jobs-menu-*` /
  `--neutral-gray` tokens while `--code-bg` and `--code-fg` appear in no entry at all. For **`default`**
  it is **six removals**: that entry (`theme-bootstrap.js:16-21`) has no `tokens` key whatsoever, so
  `entry.tokens[k]` is undefined for all six members of `DERIVED_NEUTRALS` and every one falls to
  `removeProperty` at `:221`. `default` is the entry most visitors get and the snapshot the build has
  to reproduce, so the build must emit no `--jobs-menu-*` or `--neutral-gray` there either.
- The active style is `document.documentElement.dataset.style || 'default'`, replacing
  `__ACTIVE_STYLE`. The cycler reads that global exactly once, at `:167`
  (`REGISTRY[window.__ACTIVE_STYLE] || REGISTRY.default`), which seeds `state.style` at `:170`;
  everything downstream reads `state.style` instead, including the current-row marker (`:293`, `:320`)
  and the `switchStyle` no-op guard (`:273`).
- `switchStyle(id)` navigates to the clicked row's `href`, which the build computed with `href()` for
  the current page, so no page-path global is needed; `resetToDefault()` keeps its shape (clear toy
  state, then the default row's `href`). The row's presence and its `data-id` also cover
  `switchStyle`'s existence guard and its no-op check against the active style (`:273`).
- `__THEME_CYCLER_ENABLED` is deleted. It has two readers today, not one: the cycler's own gate
  (`:5`) becomes "run wherever `#tc-dock` exists, else return early", as `:558-559` does today for
  `.tc-nav-item`; and `nav-config.js:27`, which pushes the `Theme` item into `NAV_CONFIG`, goes with
  the nav rendering itself, since the canonical Nav emits that item at build (D30). After both, the
  global has no reader left.
- All UI strings come from `data-*` attributes on the rendered dock (prose), including the
  `Lock/Unlock <Role>` composition (`:462`).
- `isReload()` (`:126-131`) and the reload wipe (`:748-750`) are deleted (Q12), as are `STYLE_KEY`
  (`:125`, unused) and the dead branches listed in §8.

---

## 6. Pages, routing, URLs

### 6.1 Routes

`src/pages/[...theme]/…` with `themeParams()` returning `{ theme: undefined }` (the documented way to
match the root with a rest parameter) plus one entry per non-default id. Page count: 16 themes ×
(home, listing, 8 published local posts, privacy, lexchat) = 192, plus `404.html`.
The two external listing records produce redirect stubs, not local post pages; the Gemma draft
produces no production page. All counts derive from publication-filtered records (§7). No page files exist outside
`[...theme]/` except `404.astro`. A structural theme's own extra pages, when one arrives, are page
files under `src/pages/<theme>/` added by that theme's spec; there is no registry field and no
catch-all route in spec 1 (D38).

`href(path, theme?)` (`src/themes/paths.ts`, D31):

1. `path` starting with a scheme (`https:`, `mailto:`) or `//` → returned unchanged.
2. `path` starting with `#` → unchanged (same page, same theme). This is the parity form: the
   canonical Nav authors bare `#about`, `#jobs-header-static`, `#project-header-static`, `#contact`
   and the Calendly `#` on home exactly as `nav-config.js:9-13` and `index.html:275` do today, so both
   sides carry `#x` and §9 rule 6 deliberately does not map it.
3. Anything else must start with `/`; otherwise `href` throws (relative paths are banned in `src/`).
4. If `theme` is unset or `default` → unchanged.
5. If the path starts with a **static-asset prefix** (`/resources/`, `/vendor/`, `/subsites/`,
   `/blog/posts/`, `/css/`, `/js/`, `/blog/post.html`, `/sitemap-index.xml`, `/sitemap-0.xml`,
   `/robots.txt`) → unchanged.
   Otherwise → `'/' + theme + path`.

The rule is "a root-absolute path is themed unless it is a static asset", so `paths.ts` needs no
knowledge of the post ids, of `extraPages`, or of the content collections, and stays a synchronous
leaf module. A mistyped internal path (`/blog/helmm/`) becomes a themed 404, which harness check 4
catches as a 404 response rather than passing silently as an unprefixed link. The post id set has one
reader, `publishedPostIds()` in `src/build/posts.ts` (used by routes, sitemap and
`harness/urls.ts`; `listingPosts()` separately includes the two external records), which is deliberately not in `themes/` so `paths.ts` stays a content-free leaf.

No component authors a same-origin absolute URL. Today two links are absolute: the logo
(`index.html:57`, `privacy/index.html:25`, `https://www.dawsonamf.com/`) and the vCard
(`nav-config.js:54`). The logo is authored `href('/', theme)`, so it keeps the theme (consistent with
D11; listed in §15 item 1); the vCard is authored `/resources/contact.vcf` and passes through rule 5.
`assertNoRelativeHrefs` (D39) also fails on a literal `https://www.dawsonamf.com` in `src/`.

Themed pages carry `<link rel="canonical" href="<default url>">` and `<meta name="robots"
content="noindex">` (from `composition.canonical` / `composition.noindex`, D34); default pages carry
canonical to themselves (home and listing already do; posts gain one, §15).

### 6.2 Head order (parity)

Each canonical layout writes its own head (D34), sharing `Meta.astro` for the charset/viewport/title/
favicon spine. Today's order per page type, verified against `main` @ `0f196d0`:

| Page | Head, in order |
|---|---|
| home (`index.html:4-42`) | charset, viewport, title, description, canonical, two favicons, six OG/Twitter tags (`og:type`, `og:title`, `og:description`, `og:url`, `og:image`, `twitter:card`), Font Awesome, Boxicons, AOS css, Calendly css, `/css/styles.css`, `/css/mobile-styles.css`, `/css/featured-carousel.css`, `/css/theme-cycler.css`, **theme links here**, then the script block (§8) |
| listing (`blog/index.html:4-37`) | the same, with `/blog/blog-listing-styles.css` before `theme-cycler.css` |
| post (`blog/post.html:4-58`) | charset, viewport, title, description, two favicons, Font Awesome, Boxicons, `/css/styles.css`, `/css/mobile-styles.css`, `/blog/blog-styles.css`, `/css/theme-cycler.css`, **theme links here**, `github-dark.min.css` from `/vendor/`, then scripts, and last the inline mermaid `initialize` block (`:27-58`), which is the final node in this head. No canonical and no OG today; both are **gained** per §15.4. No Calendly css and no AOS today either, and both **stay absent**: §15.4 does not add them, §7's post-head list does not carry them, and the step 8 table excludes no `<link>` for either. marked and highlight.js's runtime script are gone (rendered at build); the mermaid `<script>` and its `is:inline` `initialize` block appear only on posts that have a diagram (D35), in today's position |
| privacy (`:4-18`) | charset, viewport, title, description, two favicons, FA, Boxicons, `/css/styles.css`, `/css/mobile-styles.css`, `/privacy/privacy-styles.css`, `/css/theme-cycler.css`, **theme links here**, end of head |
| 404 (`:4-40`) | charset, viewport, title, `robots: noindex`, two favicons, `/css/styles.css`, `/css/mobile-styles.css`, `/css/theme-cycler.css`, **theme links here**, the `.nf-*` `<style is:inline>`; plus the new `/vendor/fontawesome/css/all.min.css` (§15.3) |
| lexchat (`:4-11`) | charset, viewport, title, two favicons, `/lexchat/lexchat-styles.css`, `/css/theme-cycler.css`, **theme links here**, end of head; no new icon font or picker (Q4) |

**Theme links are not last in `<head>`.** `document.head.appendChild` (`theme-bootstrap.js:715-721`)
runs inside the blocking bootstrap `<script>`, which sits immediately after `/css/theme-cycler.css` on
all six pages, so the links land there. That is the end of `<head>` only on privacy and lexchat; on
home, listing, post and 404 further tags follow, and on posts the skin sheet therefore precedes
`github-dark.min.css` (`blog/post.html:17` vs `:19`). Nothing depends on the order: `theme-base.css`
and every skin rule carry `[data-style]`, no skin sheet contains an `.hljs` selector, and the two
sheets that both style `pre` are separated by specificity (`theme-base.css:13,18`,
`brutalist.css:588,593`). `ThemeAssets` is therefore placed by each layout at the position above, and
the checks integration (D39) asserts exactly one `ThemeAssets` marker per page so placement stays
mechanical.

404 gains the dock/FAB and `/vendor/fontawesome/css/all.min.css` for their icons (§15 item 3).
LexChat is exempt under Q4, so it gains no dock, FAB or icon font. Shell invariants and script
allow-lists explicitly cover that picker-free composition.

No component `<style>` and no frontmatter CSS imports anywhere in the canonical family: Astro's
injection position is undocumented, so the family gives it nothing to inject (T0 confirms an empty
injection). The single exception is the 404's `.nf-*` block, which must be `<style is:inline>`: a
bare component style is scoped and, under `inlineStylesheets: 'never'`, would be extracted into an
injected `<link>` at an undocumented position.

### 6.3 Utility pages

`privacy` and `404` become Astro pages that share the Shell (`<html>` and composition).
Both receive the end-of-body picker mount and FAB. There is no common header/footer utility
layout, because the pages do not share all their chrome:

- `Privacy.astro`: the `<div id="main-body">` wrapper, then logo header + content + **both** footer
  blocks (a desktop `<footer class="footer-container">` at `:113` and a mobile
  `<div class="footer-container-mobile">` at `:121`), no nav, as `privacy/index.html:22-127`. Its logo
  is the absolute `https://www.dawsonamf.com/` today and is authored `href('/', theme)` (§6.1).
- `NotFound.astro`: the `<div id="main-body">` wrapper, then logo header (logo → `/`) + the `.nf-*`
  block + **both** footer blocks (`:55` desktop, `:63` mobile), as `404.html:44-68`, with
  the `<style is:inline>` of §6.2. Root-absolute paths throughout; renders the default theme at build
  and applies a theme at runtime per D27.
- LexChat has no local engine page, theme variant, page asset or compatibility redirect.
  Its retained project CTA is an external URL and never receives an engine theme prefix
  (owner amendment 2026-09-08; deliberate difference §15.12).

### 6.4 Redirects and shims

| Old | New | Mechanism |
|---|---|---|
| `/?style=<id>` (any default page) | `/<id>/<same page>` | `StyleQueryShim` (§5.4), which preserves the rest of the query and the hash; `?style=default` → same page; unknown id ignored |
| `/<id>/<missing>` and `/404.html?style=<id>` | themed 404 | runtime apply on `404.html` (D27) |
| `/blog/post.html?id=<id>` | published local route, known external URL, or 404 | The build-generated shim embeds a destination map from §7's public records: published ids forward `style` to the new local route; external ids redirect to their approved external URL; drafts/unknown ids go to `/404.html`. Never accept a destination URL from the query. Meta-refresh fallback and canonical point to `/blog/`. |
| `/blog/autoencoders-1/`, `/blog/autoencoders-2/` | existing aboutobjects.com article URLs | static redirect stubs generated from the authoritative external records; exclude these stubs from the sitemap |
| `/12years/` | `/subsites/elise/12years/` | `redirects` config: static output emits a `<meta http-equiv="refresh">` stub (no status code possible) |
| `/embedded-swift-agent/` | `/subsites/dawson/embedded-swift-agent/` | `redirects` config (settled Q3) |
| `/sitemap.xml` | gone | none. `@astrojs/sitemap` writes `/sitemap-index.xml` and `/sitemap-0.xml`; a meta-refresh stub cannot redirect an XML fetch, so the old URL is dead and the owner resubmits the new one in Search Console (§14) |
| `/docs/*`, `/CLAUDE.md` | gone | none (D22) |

### 6.5 Subsites

`public/subsites/elise/12years/{index.html,then.jpeg,now.jpeg}` verbatim (page-relative image paths;
its gsap 3.12.5 + ScrollTrigger from cdnjs stay; ~395 words of the owner's prose).
`public/subsites/dawson/embedded-swift-agent/` (4 files: `index.html`, `agent.js`,
`EmbeddedSwiftAgent.wasm`, `embedded-swift-agent-context.md`; `agent.js:11-18` has a bare `+esm`
import Vite must never see) verbatim, per intent §4.8 and settled Q3. It is linked from a
project CTA, a post body and the sitemap; project CTAs in `prose.projects` and the post body point at
the final URL, and the old path redirects (§6.4).

---

## 7. Blog

### 7.1 Post ownership, publication and rendering contract

`src/content/posts/<id>.md` is the authoritative source for a post's metadata and body. Its
frontmatter uses the shared prose field types from `src/prose/fields.ts`, validated by the pure
`src/posts/schema.ts`. Example (schematic, the actual migration uses existing approved text):

```yaml
---
publication: published               # published | external | draft; always explicit
listingOrder: 0                       # preserve today's listing order, independent of corrected dates
title: { s: "There is a fly on my laptop and it runs away" }
date: August 2026
description: { l: "...existing listing excerpt..." }
tags: [Swift, Systems]
scripts: []                           # existing per-post assets, root-absolute or pinned external URL
styles: []
---
...existing Markdown body...
```

`external` records also require `externalUrl`; their body is an archived local copy, never
rendered publicly. `draft` records may have unfinished metadata/body. Draft prose fields in a
`published` or `external` record fail production; whole `draft` records are excluded instead.
Title and description retain sizes for future layouts, using the shared accessor through
`post.prose`. There is one `description` source, used for cards and page metadata; an additional
size is written only when a consumer needs it. Dates and publication/listing order are data.

T2 migrates title/date from each existing post and description/tags from the current listing,
verbatim where absent from the post. Q1 resolves Helm to its post title and March 2026, and METR
to February 2026. Serialize valid YAML during migration, quoting titles containing `: ` (such as
Helm and Toolbelt); preserve the text, not today's hand-rolled parser's invalid YAML spelling.
Preserve exactly today's ten listing ids/order: eight `published` local posts
and the two `external` autoencoder records. Gemma is `draft`; its featured project card remains
unchanged because projects and posts are different content items. Existing planning drafts are
not promoted. Future additions require explicit owner approval and an updated listing baseline.

`src/build/posts.ts` exports `readPostSources()`, `publishedPostIds()`, `listingPosts()`,
`postDates()` and the known legacy redirect destinations as projections of those same sources.
It parses frontmatter with js-yaml and the shared schema, not a second metadata catalog. The
Astro post collection uses that same schema; no second id-to-metadata map is authored in YAML
or JavaScript. Listing/rail/SEO/sitemap consume these validated records. A production build
emits no draft route, listing, sitemap entry, raw source or archived external body. Preview may
render drafts with marking and `noindex`; deploy always uses the production command.

**Format decision (Q1):** keep existing Markdown bodies and marked/highlight.js output for
parity. Per-post scripts already support animations. `BlogPost` and structural post layouts
consume validated metadata and a named `post-body` slot; the current adapter supplies rendered
Markdown through that slot. A future MDX or Astro-component adapter can supply components there
without changing metadata ownership, URLs, listings or theme layout internals. No unused format
registry or MDX dependency is added now. The first component post/case study adds its adapter and
approval checks. Astro's [MDX integration](https://docs.astro.build/en/guides/integrations-guide/mdx/)
supports component-containing content; retaining the current renderer now is the migration
choice based on the existing parity contract.

### 7.2 Migration rendering and behavior

- Rendering (`src/prose/markdown.ts`, shared with prose fields): marked 18.0.5, `gfm: true`,
  `breaks: false`, renderer overrides copied from `blog/blog-post.js:4-30`: `link` (D16, the renderer
  itself at `:8-15`, attribute order `href, class, target, rel, title?`), `image` →
  `<img class="blog-image">`, `code` → `<div class="mermaid">` for `mermaid`, else
  `<pre class="has-copy-btn"><code class="hljs language-<lang>">…</code><button class="code-copy-btn"
  aria-label="…">…</button></pre>` via `hljs.highlight` from `highlight.js/lib/common` (36
  `registerLanguage` calls = 34 languages plus the `php-template` and `python-repl` sub-grammars,
  exactly the set the cdnjs bundle ships, `research/library-migration.md` §3.7), else `highlightAuto`
  (no post hits it today; kept so a future untagged block renders as it would have). Raw HTML passes
  through. The copy-button markup is the one `blog-post.js:95-101,110` injects today, now emitted at
  build (D35). Each post body is rendered **once**, in `getStaticPaths`, and passed to the route as a
  prop; otherwise `[...theme]/blog/[id].astro` would render every post 16 times.
- Page head: `<title>{title} | {suffix}</title>`, description = the post's `description.l`, canonical, OG
  title/description/url/image (site avatar; per-post images are intent §7), JSON-LD `BlogPosting`
  with the same fields `blog-post.js:56-88` builds today (`@context`, `@type`, headline, url,
  mainEntityOfPage, author, publisher, `datePublished`/`dateModified`, and `description`/`keywords`
  only when the post has a description or tags, as today), `github-dark.min.css` from `/vendor/`,
  per-post `styles` as `<link>`s. Dates parse at build with the same rule as `blog-post.js:50-54`
  (`new Date(date + ' 1')`), which also removes today's client-timezone drift.
- Body (exactly today's DOM, `blog/post.html:87-93`):
  `article.blog-post-container > header.blog-post-header > h1#post-title.blog-post-title +
  div#post-meta.blog-post-meta` (pills: date, tags, `span#read-time`), then
  `div#post-content.blog-post-content` containing the `post-body` slot and its rendered content. All three class names are load-bearing:
  20 of 20 sheets in `css/themes/` target `.blog-post-content`. Per-post `scripts` are emitted as
  classic `<script src>` tags at the end of `<body>` in frontmatter order (today's loader chains them
  sequentially; `styles` were a plain `forEach`, and become `<link>`s).
- Client (`public/js/blog-post-client.js`, small): one delegated click listener on `#post-content` for
  the build-emitted copy buttons; `mermaid.run()` on the posts that have diagrams (the pinned CDN
  `<script>` and the `is:inline` `initialize` block, reading `--secondary`, `--text`,
  `--neutral-gray` with the same fallbacks, are emitted in `<head>` in today's position for those
  posts only, so nothing loads lazily and the initialize block can never run before the library);
  read time (`Math.max(1, Math.round(words/200))` from `innerText`, suffix from `data-read-time` on
  `#read-time`, kept client-side so the number cannot drift); tilt on `.blog-image` gated on
  `data-no-tilt` (D32). highlight.js's runtime script is gone from post pages entirely (§15.8).
- Listing: the intro renders as three paragraphs carrying today's ids `blog-sub-text`,
  `blog-sub-text-2`, `blog-sub-text-3` (`blog/index.html:64-66`), which the intro wave
  (`blog-listing.js:8-10`), `blog-listing-styles.css` and 15 skin sheets select as
  `[id^="blog-sub-text"]`; `BlogListing.astro` stamps the ids onto the three `blog.intro.pN` fields in
  order. Cards rendered at build (`BlogCards.astro`, same markup as `blog-listing.js:127-139` incl.
  `data-aos-delay={i*50}`), filter pills from the sorted tag set (no "All" pill today); behavior
  (`blog-listing-client.js`): typing masthead, intro wave, filter toggling `.filtered-out`,
  `AOS.init({offset:50})` + refresh-on-resize, tilt. Home rail cards rendered at build likewise.
- Assets: `public/blog/posts/assets/*` verbatim; the page-relative fetch URLs inside
  `cohorts-chart.js` (`:642-682`) and `job-market-chart.js` (`:12`), both unpublished
  `ai-job-market` assets, rewritten to `/blog/posts/assets/…`; `.github/workflows/refresh-chart-data.yml`
  and `docs/prebake-cohort-data.py` (`OUT_DIR`) updated to the `public/` path. Existing asset text is
  grandfathered under §4.3; any new/changed UI text uses the owning approved content source.
- `/sitemap-index.xml` + `/sitemap-0.xml` generated (D24); `robots.txt` in `public/`, its `Sitemap:`
  line pointing at `/sitemap-index.xml`.

---

## 8. Behavior runtime (`public/js/`)

The minimum migration edits are listed below. Preserve behavior and constants throughout;
additional refactoring needed for §1.1's boundaries is part of D3 and must pass parity. A "kept"
entry preserves its behavior, not an exemption from architecture acceptance.

| File | Removed (now build-time or dead) | Kept / changed |
|---|---|---|
| `theme-bootstrap.js` | entire file | replaced by `Shell` + `ThemeAssets` + `themes/apply.ts` + the two pre-paint components (§5.4); the apply logic lives on as `themeHtml()` for the build, the pre-paint override and the 404 (D27, D33) |
| `nav-config.js` | config objects, `buildNavItems`, all `innerHTML` rendering, and the `__THEME_CYCLER_ENABLED` gate at `:27-29` that pushes the `Theme` item (the canonical Nav emits it at build, D30) | → `nav-behavior.js`: sticky header (`SCROLL_THRESHOLD 300`, `:142-163`), Calendly click building the URL from `--bg`/`--text`/`--primary` with today's fallbacks (`:37-48`, `:135-140`), binding every `.calendly-link` (D16) |
| `blog-data.js` | entire file | data lives in prose; carousel, rail and cards are components |
| `featured-carousel.js` | `renderFeaturedCarousel`; `buildTickerRun` (`:388-415`) and its `--ticker-run`/`--ticker-dur` writes (`:412-414`), now build-time (D35); the dots construction (`:265-267`), now build-time; dead `applyExpandVisualShell` (`:94-120`) and its only caller `setupExpandVisual` (`:122-185`), both behind `EXPAND_VISUAL` (`:17`) and its gate (`:421`) | click-centering and scroll tracking (`:275-294`), the vertical wheel guard, the **early-return** tilt gate at `:190` becoming `if (document.documentElement.hasAttribute('data-no-tilt')) return;` |
| `script.js` | `renderBlogCards`, the inline masthead sequences (`:129-192`), the dead once-guards `heroChromeIn` (`:14`) and `subTextIn` (`:109`) | reads the derived steps from the JSON island and splices `startAnimations` after the first `type` step (D36); intro wave, jobs panel (`initJobsMenu`, `:271-370`, keyed on `data-job` read at `:344` and `getElementById(newJobID)` at `:355`), smooth scroll, `AOS.init()` unchanged; the **early-return** tilt gate at `:257` becomes `if (document.documentElement.hasAttribute('data-no-tilt')) return;` and the **positive** gate at `:397` becomes `if (!document.documentElement.hasAttribute('data-no-tilt')) { … }`; still `defer`, still after `nav-behavior.js` |
| `blog-listing.js` | card + filter-bar rendering | → `blog-listing-client.js` (§7); splices `onBlogTypingComplete` after the first `type` step; the **positive** tilt gate (`:142`) becomes `if (!document.documentElement.hasAttribute('data-no-tilt')) { … }` |
| `blog-post.js` | fetch, frontmatter parse, marked, JSON-LD, asset loading, `addCopyButtons` (`:90-112`), the unconditional mermaid load | → `blog-post-client.js` (§7); the **positive** tilt gate (`:182`) becomes `if (!document.documentElement.hasAttribute('data-no-tilt')) { … }` |
| `theme-cycler.js` | dock construction (`:507-577`, `:284-322`), `?style=` navigation, reload wipe (`:748-750`), `isReload()` (`:126-131`), unused `STYLE_KEY` (`:125`), the registry globals it read at `:9-10` | §5.5 |
| `typing-engine.js` | dead `__restartTypingSequence` (`:637-639`) and the `_lastConfig` (`:88`) it needed | otherwise verbatim; `:99` and `:109` read `document.documentElement.dataset.typing` / `.typingDelete` with the same fallbacks instead of the deleted globals (D32) |
| `anim-utils.js`, `cursor-follow.js` | the obsolete `data-style` MutationObserver at `anim-utils.js:301-306`, after verifying that no remaining canonical flow changes the attribute at runtime | preserve intro finalization, animation constants and cursor behavior; document their canonical ownership and lifecycle under D3 |

Load order per page type is copied from today's `<head>`/`<body>` verbatim, including the
asymmetries: `aos.js`, `featured-carousel.js` and `typing-engine.js` are `defer` on home and sync on
the listing; `vanilla-tilt` and `anim-utils.js` are sync wherever they appear; the Calendly widget is
`async`; `nav-behavior.js` and `cursor-follow.js` are `defer` on home, the listing and posts and are
**absent from privacy, 404 and lexchat**. Those three load the cycler (`privacy/index.html:128`,
`404.html:69`, `lexchat/index.html:17`) **and** `theme-bootstrap.js` (`privacy/index.html:18`,
`404.html:16`, `lexchat/index.html:11`) today; after migration privacy/404 load the cycler, while LexChat emits no picker runtime (Q4); page scripts (`blog-listing-client.js`,
`blog-post-client.js`) are sync at the end of `<body>` and the cycler is `defer` after them.
`research/theme-engine-contracts.md` §6 is the per-page table (re-verified).

Vendor table (`scripts/vendor-map.mjs`), one row per file, `{ npm path, public path, CDN URL }`:
`jquery/dist/jquery.min.js`, `jquery-ui-dist/jquery-ui.min.js`, `gsap/dist/gsap.min.js`,
`aos/dist/aos.{js,css}`, `vanilla-tilt/dist/vanilla-tilt.min.js`,
`highlight.js/styles/github-dark.min.css`, `@fortawesome/fontawesome-free/{css/all.min.css,webfonts/*}`
(the CSS references `../webfonts/`, so both copy at the same depth), plus a Boxicons row with **no npm path**: its package declares six runtime
dependencies including React 16, so its two files are committed from the pinned CDN build and the row
carries only the public path and the CDN URL the normaliser maps. highlight.js's runtime JS is not
vendored at all: post pages no longer load it (D6).
Three consumers import the table: `scripts/vendor.mjs` (`npm run vendor`, run by hand when a pin
changes), the harness normaliser (rule 6, CDN → `/vendor/`) and `harness/scripts.ts` (check 5).
`public/vendor/` is committed, so CI needs no copy step and git is the integrity record (D5).

---

## 9. Parity harness (`harness/`)

**Definition of parity** (all must hold, per theme × page × viewport × state). Checks 1-3 compare the
two sides **after the exception table** (step 8 of the normaliser), which is the mechanism that
carries §15's allow-list; "harness green" in T4, T5, T6 and T8 means green under that table.

1. Normalised DOM dump equal (`expect(newLines).toEqual(oldLines)`), taken after `settle()`.
2. `toHaveScreenshot` within `maxDiffPixelRatio: 0.001`, `threshold: 0.2`, `animations: 'disabled'`,
   `caret: 'hide'`, `scale: 'css'`; the masthead is masked and asserted as text separately.
3. Computed-style sample equal (exact): the five colour roles and every `--*` token on `<html>`
   **except `--prose-*`** (new side only, D14; the same exclusion step 7 makes), plus
   `color/background-color/font-family/font-size/line-height/border-radius` on 12 sentinel selectors
   per page type (`harness/sentinels.ts`; rule: `html`, `body`, the logo, one nav item, the masthead,
   one section header and its number, one body paragraph, one card, one pill or chip, one CTA, the
   footer credit; exact selectors fixed in T1).
4. No 4xx/5xx network response on either side (catches broken asset paths silently).
5. No page references a `<script src>` outside its allow-list in `harness/scripts.ts` (today's set
   per page type minus highlight.js and marked on posts, the §8 renames, the 404's bundled apply
   script, and no cycler on LexChat; grep of built HTML; also the §3.3 lean guard for future themes).

**Matrix:** 16 themes × pages {home, listing, `toolbelt` (2 mermaid + bash/json), `embedded-swift-agent`
(9 swift + 1 c fence + image), `metr-doubling` (Plotly + js-yaml + assets), privacy, 404}
× {desktop-1440, mobile-390} × states {settled; job tab 2 clicked; carousel dot 3 clicked; a
`mouse.wheel` on the carousel track (the vertical wheel guard, which intent §4.9's "carousel scroll"
asks for and a dot click does not exercise); sticky nav after scroll 800→500 and smooth-scroll to
`#contact` (home); theme menu open by click (pages with a trigger); filter `Swift` (listing); palette
toy active (shuffle in the dock, navigate to the next page in the matrix, assert first paint, then
reload), which is the only state that exercises §15 item 2 and the pre-paint override of D4}.
States apply where the element exists. Sharded by theme (`--grep @theme:<id>`), ~15 min full sweep.

**Old side:** `PARITY_OLD_DIR` (default `../personal-website-old`), a detached worktree of `main` at
the baseline SHA, created by the owner (§14), read-only, served by
`python3 -m http.server --bind 127.0.0.1 8781 --directory …` (Python 3.9.6 on this machine has both
flags). The old side loads **thirteen** libraries from live CDNs that are deliberately **not** in the
`route.abort` list (the abort list covers non-deterministic APIs only): the eleven the six page files
hard-code, plus Plotly 2.27.0 and js-yaml 4.2.0, which `metr-doubling` pulls in through its
frontmatter `scripts:` and which is a matrix page. Google Fonts is never blocked either, by design.
So the old side needs network access and check 4 depends on those CDNs being up; a CDN outage is a
harness failure, not a regression, and T1 records that. URL pairs in `harness/urls.ts` are derived, not hand-listed:
`THEME_IDS` × the page list, mapped through `href()` for the new side and through the old side's URL
form (`x` ≠ default; the default theme uses the bare paths on both sides): `/?style=x` ↔ `/x/`,
`/blog/?style=x` ↔ `/x/blog/`, `/blog/post.html?id=p&style=x` ↔ `/x/blog/p/`, `/privacy/?style=x` ↔
`/x/privacy/`, `/lexchat/?style=x` ↔ `/x/lexchat/`, `/404.html?style=x` ↔ `/404.html?style=x` (both
sides apply the theme at runtime, D27). `publishedPostIds()` (§7) supplies the local post ids. Fresh
browser context per test, except the palette-toy state, which navigates within one context.

**Determinism:** one `addInitScript` replaces `Math.random` with mulberry32; the harness pins
sequence *indices*, not seeds: `seedFor(index, n, draw)` brute-forces the smallest seed whose *k*-th
draw gives `Math.floor(r * n) === index`. The masthead pick (`typing-engine.js:165`) is **draw 2 on
home** and **draw 1 on the listing**: jQuery 3.6.0 draws once at load for its `expando` and is a
`defer` script ahead of `typing-engine.js` on home (`index.html:31` vs `:38`), while the listing loads
no jQuery. (Posts with chart assets draw earlier still; no masthead runs there, so it has no
consequence.) Home: index 3 (single `type` step, shortest settle) and a second mobile shot at index 0
(exercises the delete path); listing: the shortest of its 7 (T1 picks).
`page.emulateMedia({ reducedMotion: 'no-preference' })`; the mouse never moves before capture except
in the wheel state (cursor follower stays at opacity 0 otherwise); `route.abort` for
`assets.calendly.com`, `corsproxy.io`, `collectionapi.metmuseum.org`,
`openaccess-api.clevelandart.org`, `api.vam.ac.uk`, `www.getty.edu`, `framemark.vam.ac.uk`,
`media.getty.edu`, `www.metmuseum.org`, `raw.githubusercontent.com`, `dawsonamf-lexchat.hf.space`
(defensive: only Calendly and the lexchat iframe are on matrix pages); Google Fonts never blocked.
`page.clock` is optional and only used if the typing settle proves flaky.

**`settle(page)`** (fails the test after 15 s, never skips) is four generic waits plus one lookup;
every page-type predicate lives beside its selectors in `harness/sentinels.ts` (D20):

1. `load` fired.
2. The count of `<link rel="stylesheet">` in `<head>` stable for 500 ms (the cycler's idle font load
   appends what is not already there; `loadAllFonts` skips hrefs present in `<head>`, so the number
   varies by theme and only stability is asserted) and `document.fonts.ready` resolved.
3. Every in-viewport `[data-aos]` has `aos-animate`.
4. `document.getAnimations()` has no running finite animation.
5. `sentinels.ready[pageType](page)`. Home and listing: masthead text equals one of the sequence's
   terminal strings and `.cursor`'s `animation-name` is `blink`; home also: the 10 elements
   `anim-utils.js` pins (`animationend` → inline `animation: none`) all carry it, `#highlight` has
   inline geometry, the carousel has 8 cards and 8 dots with one active, `--section-rule` is stable
   across two rAFs. Post: `#read-time` matches `/^\d+ min read$/` and every `.mermaid` has an `svg`.
   404 under a theme: `data-style` is set and the skin sheet has loaded. (No `--ticker-run` wait: it
   is a build-time property on the new side now, D35, and is present in the first paint.)

**Normaliser (`normalize.ts`)**, applied identically to both dumps:

1. Input is `document.documentElement.outerHTML` after `settle()`. A second, pre-settle dump of the
   raw response body is stored per page (informational: separates "emitted HTML differs" from "JS
   produced a different DOM").
2. Drop `<script>`, `<noscript>`, `<link rel="modulepreload">` and **HTML comment nodes**: today's
   pages carry comments the components will not reproduce, for example at `index.html:18,29,82,279`,
   `blog/index.html:69,84,89,101,106`, `blog/post.html:68-72`, `privacy/index.html:11,23` and
   `404.html:11-12`. That list is a sample, not an inventory (`index.html` alone has 19), which is
   harmless because the rule drops every comment node. Nothing else is removed, so `<head>` order is
   compared as-is.
3. Strip `data-astro-*` attributes and rewrite `/_astro/<hash>` → `/_astro/HASH` (guards; the
   canonical family should emit none, and the count is reported).
4. Lowercase tag names, sort attributes alphabetically.
5. Collapse whitespace runs to one space and trim text nodes, except inside `pre`.
6. **Map, then theme.** One rule with one scope, applied to the **old** side only.

   **Scope:** `a[href]`, `link[href]`, `img[src]` and `iframe[src]`. Nothing else carries an internal
   URL that differs between the sides. **Exempt, and deliberately so:** `link[rel=canonical]` and
   every `meta[property^="og:"]` or `meta[name]` URL (`og:url` and `og:image` on home and the listing,
   `index.html:8,14,15` and `blog/index.html:8,14,15`). Those are absolute default-theme URLs on both
   sides, by design (§6.1: default pages carry canonical to themselves, themed pages carry canonical
   to the default), so stripping the origin or applying a theme prefix to them would manufacture the
   diff this rule exists to remove. Any `href`/`src` not in the table below (external schemes,
   `mailto:`, bare `#`) is compared verbatim.

   **Step one, map.** Every internal form the site authors today maps to its canonical route:

   | Old form, as authored today | Maps to |
   |---|---|
   | `index.html`, `../index.html`, `https://www.dawsonamf.com/` (the logo's three spellings: `index.html:57`, `blog/index.html:52`, `blog/post.html:78`, `privacy/index.html:25`) | `/` |
   | `index.html#x`, `../index.html#x` (the subpage nav items, `nav-config.js:9-14`) | `/#x` |
   | bare `#x` (the home nav items and the Calendly `#`) | **not mapped**, see below |
   | `./`, `blog/`, `../blog/` (the **Blog** nav item's three spellings, `nav-config.js:12,18`; `./` is the subpage branch, never the logo) | `/blog/` |
   | `post.html?id=p`, `blog/post.html?id=p`, `../blog/post.html?id=p` | `/blog/p/` |
   | `css/…`, `../css/…` | `/css/…` |
   | the four sibling sheets, each loaded from its own page's directory: `blog-listing-styles.css` (`blog/index.html:25`), `blog-styles.css` (`blog/post.html:15`), `privacy-styles.css` (`privacy/index.html:16`), `lexchat-styles.css` (`lexchat/index.html:9`) | `/blog/…`, `/blog/…`, `/privacy/…`, `/lexchat/…` respectively |
   | `posts/assets/<f>.css` (per-post `styles:` frontmatter, appended by `blog-post.js:127-134`) | `/blog/posts/assets/<f>.css` |
   | `resources/…`, `../resources/…`, `../../resources/…` (favicons, images, the résumé, post bodies), and `https://www.dawsonamf.com/resources/…` (the vCard, `nav-config.js:54`) | `/resources/…` |
   | `/lexchat/` (the carousel CTA, `blog-data.js:93`) | `/lexchat/` |
   | `/embedded-swift-agent/` (the carousel CTA `blog-data.js:29` and the post body `blog/posts/embedded-swift-agent.md:201`) | `/subsites/dawson/embedded-swift-agent/` |
   | `/?style=<id>` and `?style=<id>` | that page's route under theme `<id>` |
   | every CDN URL in `scripts/vendor-map.mjs`, including the Boxicons one | its `/vendor/…` path |
   | `/` (the 404's logo, `404.html:46`) | `/` |

   **Step two, theme.** The mapped result goes through `href(route, <theme under test>)`, because the
   new side prefixes `/<theme>` onto every engine route. Two carve-outs:

   - **Engine routes only.** `/`, `/#x`, `/blog/`, `/blog/p/` and `/lexchat/` take the theme. The
     static-asset targets do not, on either side: `/css/…`, `/blog/posts/assets/…`, `/resources/…`,
     `/vendor/…` and `/subsites/…` hit `href()` rule 5's prefix list and pass through unchanged, and
     the four sibling sheets are `public/` passthroughs that no component routes through `href()` at
     all (they are asset references, not links). Either way the theme prefix never reaches them.
   - **The 404 skips step two entirely.** That page is built in the default theme and applies a theme
     at runtime (D27), so both sides carry default-theme hrefs on it: the logo, the favicons, the
     stylesheets and the preset rows. Mapping still runs there; `href(route, theme)` does not.
     Exception row 11 covers what the runtime apply leaves behind.

   **Why bare `#x` is not mapped.** The canonical Nav authors bare `#x` on home, which is the parity
   form and which `href()` rule 2 (§6.1) returns unchanged, so both sides already carry `#x` and are
   equal. Mapping it to `/#x` and then theming it would manufacture a diff on every home page in the
   matrix, and authoring `/<theme>/#x` instead would be a DOM change absent from §15. On the subpages
   `../index.html#x` still maps, because there the old side names the home document and the new side
   does not.

   **Two notes.** `../12years/` is in no row: nothing on the site links to it, so the form is never
   emitted. And the `?style=<id>` row is the one row whose output is **already themed**, under that
   row's own id rather than the theme under test, so it is finished at step one and does not go
   through step two (theming it twice would produce `/<theme>/<id>/…`). Today its only emitter is the
   preset rows (`theme-cycler.js:303`), which exception row 9 excludes wholesale, so the row only
   bites if a stray `?style=` link appears anywhere else.

   D18's "`public/` keeps today's URL paths … so the DOM diff needs no path normalisation for them"
   is true of the **resolved** URL and false of the **href string**: `css/styles.css` and
   `/css/styles.css` resolve to the same file from `/` and differ as text. That is why the stylesheet,
   favicon and asset rows are in this table.
7. `<html style>` is compared as a **declaration map** (parsed, sorted by property), not verbatim, so
   build-time additions (the ticker properties, D35) cannot fail on ordering; `--prose-*` is dropped
   from the new side first.
8. **Exception table**, keyed to §15. Rows say which side is normalized: remove fields that
   exist on both sides from both, and remove newly added nodes from the new side only. Afterward
   compare DOMs. Independently assert the new metadata against the authoritative post record.
   For accepted visible additions/changed card text, the screenshot pair masks the same bounded
   rectangle on both pages; do not infer visual masking from a string-only DOM normalization.
   New picker UI also receives its own interaction/visual QA. Palette persistence after reload
   is a new-side behavioral assertion: compare its saved effective colors before/after reload,
   rather than demanding equality with the old side that intentionally resets them.

| §15 item | Applies to | Normalization before comparison |
|---|---|---|
| 3 | privacy, 404 | New side only: `.tc-fab`, `#tc-dock`, `#tc-scrim`, and 404's added Font Awesome link. LexChat adds none of these. |
| 4 | post pages | Both sides: `<title>` and `meta[name=description]`. New side only: added canonical/OG/Twitter tags. No Gemma production page is compared: its withdrawal is explicitly accepted under Q2 and tested as absence. |
| 4 (Q1) | listing, home rail | Both sides: card title/date fields for Helm and METR. Separately assert the new values equal their post source; preserve all other card content/order. |
| 9 | pages with a dock | Both sides: preset-link `href` attributes. New side only: added `data-fonts`, active-row profile and dock prose attributes. |
| 10 | themed pages | Both sides: canonical and robots metadata being standardized. New side only: `data-typing` and `data-typing-delete`. Verify canonical/noindex separately against the route contract. |
| 11 | 404 | everything above, and nothing further: rule 6 skips the theme step on this page, so the logo, the "Back to the home page" link and the preset rows carry the same default-theme hrefs on both sides. §15.11 still records the visible change (a themed 404's links go to the default theme) |

Nothing else is excluded. A new exception requires a new §15 line, which is the point: the table is
the allow-list, not a place to hide a diff.

**Config:** `reporter: [['html', { open: 'never' }], ['list']]`; `webServer` array with
`gracefulShutdown: { signal: 'SIGTERM', timeout: 500 }`; `snapshotPathTemplate` without
`{platform}`; `harness/__parity__/` gitignored. Guard test: `matchMedia('(hover: hover) and
(pointer: fine)')` is `true` on desktop and `false` on mobile (assert, do not assume). After the first
run, check `lsof -nP -iTCP:8781 -sTCP:LISTEN` and `:8782` return nothing.

**Manual QA list** (owner, ordered by skin as intent §4.9 asks): tilt feel on cards/carousel/post
images; cursor follower; hover states on nav, pills, dock rows; palette toy shuffle/scheme/lock/colour
input, then navigate and reload with the palette active (§15 item 2); marquee tickers and glyph
headers; mobile jobs rail scroll; Calendly popup colours; reduced-motion pass (`emulateMedia` run of
the suite is automated; the feel is not).

---

## 10. Deploy and cutover

`.github/workflows/deploy.yml` as `research/deploy-and-parity-harness.md` §2.2 with
`node-version-file: .nvmrc` (§2.2 shows `package.json`; `.nvmrc` is `astro-capabilities.md` §2.1's
recommendation): `checkout@v7`, `setup-node@v7` with `cache: npm`, `npm ci`, `npm run build`,
`upload-pages-artifact@v5` of `dist`, `deploy-pages@v5` in a `github-pages` environment,
`concurrency: pages`. The `workflow_dispatch` input is typed and defaults off:

```yaml
on:
  push: { branches: [main] }
  workflow_dispatch:
    inputs:
      deploy: { description: Actually deploy, type: boolean, default: false }
jobs:
  build:   { … }                       # always runs
  deploy:  { if: github.event_name == 'push' || inputs.deploy, … }
```

`npm run build` rather than `npx astro build`: the build script is the gate (drafts, unwritten sizes),
and there is no lifecycle hook to miss now that `public/vendor/` is committed (D5). A boolean input
arriving as the string `"false"` would be truthy, so the dispatch always passes it typed:
`gh workflow run deploy.yml --ref astro -F deploy=false`.

`refresh-chart-data.yml`: paths → `public/blog/posts/assets/`, **gains** `actions: write` alongside
today's `contents: write` (the job pushes, so the permission is additive, not a replacement; D21),
**gains** `env: GH_TOKEN: ${{ github.token }}` (the `gh` CLI needs the token in the environment; the
permission alone is not enough), and `gh workflow run deploy.yml --ref main -F deploy=true` when the commit
happened. `actions: write` is the documented permission for
`POST /repos/{owner}/{repo}/actions/workflows/{id}/dispatches`, and `workflow_dispatch` and
`repository_dispatch` are both documented exceptions to the rule that `GITHUB_TOKEN` pushes never
trigger workflows; T7's run is a confirmation, not the only evidence.

Cutover runbook (owner drives, agent prepares commands; each step separately approved):

1. Parity green on every theme; manual QA signed; `npm run build` clean (drafts gate on);
   §1.1 architecture criteria passed, with §5.3 fixture results and the retained-code audit in
   `research/architecture-signoff.md`; repo and authoring docs reflect the finished system.
2. A dispatch-only `deploy.yml` (no `push` trigger) is committed to `main` first: GitHub only runs
   `workflow_dispatch` for workflows present on the default branch. Harmless while `main` is legacy.
   T7 prepares it, and prepares the branch copy by **merging `main` into `astro` first and editing
   the file that arrives**, so step 7's merge is clean rather than an add/add conflict.
3. Run it once on `main` (`gh workflow run deploy.yml -F deploy=false`): GitHub's docs say a workflow
   can be dispatched against any branch once it has run at least once, and the dry run is harmless.
4. `gh api /repos/dawsonamf/personal-website/pages --jq '{build_type,cname,https_enforced}'` (record).
5. `gh workflow run deploy.yml --ref astro -F deploy=false`: the build job should upload an artifact
   while Pages is still legacy, on the reasoning that only `deploy-pages` needs the flip. **Unverified**
   like the other T7 items; if the upload fails under legacy Pages, the dry run moves to after step 6.
6. `gh api --method PUT /repos/dawsonamf/personal-website/pages -f build_type=workflow`. The REST
   endpoint documents `build_type` (`legacy` | `workflow`) with `source` optional, so that body alone
   is valid. Re-read `https_enforced` and re-assert it with `-F https_enforced=true` if it changed.
   The last legacy deployment keeps serving.
7. Merge `astro` → `main` (one merge, intent §4.11; brings the full `deploy.yml`). Push triggers
   the deploy. Watch it.
8. Verify live: `/`, `/?style=brutalist` → `/brutalist/`, `/brutalist/blog/toolbelt/`,
   `/blog/post.html?id=helm`, `/blog/post.html?id=helm&style=doodle` → `/doodle/blog/helm/`,
   `/12years/`, `/embedded-swift-agent/`, `/brutalist/nope/` (themed 404), `/sitemap-index.xml`,
   `https_enforced` unchanged, `dawsonamf.com` → `www`.
9. Rollback: `-f build_type=legacy` + revert the merge commit. `CNAME`/`.nojekyll` at the repo root
   make the legacy path work again.

---

## 11. Desk-check against the five structural themes

From `research/structural-theme-demands.md` §3 (40 capabilities) plus illoca (intent §6.5, added
after the research pass). The middle column is what spec 1 actually builds (D38); the right column
names the mechanism each remaining demand uses and who adds it. Nothing in the right column needs a
change to the registry shape, the routing, the accessor or the composition rule: each is an additive
optional field, a page file, or code inside the theme's own layouts.

| Demand (§3 ids) | Spec 1 ships | Added by the first consumer that needs it |
|---|---|---|
| Own DOM per page type; own `<head>`; own root CSS incl. `html{font-size:1vw}` (1-3) | `kind: 'structural'`, `layouts`, owned/fallback composition; §5.3's fixture proves distinct owned DOM/head and isolation of root CSS/assets from fallback pages | the production theme layouts (each writes its own head, as the canonical layouts do, D34) |
| Own nav with a picker mount; full-screen menu; no always-visible control (4, 24) | the `.tc-nav-item` + `button.tc-nav-trigger` contract (D30), `ThemePicker.astro`, the body-parented dock | `picker: { mount: 'own' }` in the registry; the theme's CSS sets a z-index on `#tc-dock` if its chrome needs one; placement (§13 Q9) |
| Floating fallback (5) | `PickerFab.astro` (D12); `compose` returns `{ mount: 'fab', corner }` | the corner choice per theme |
| Theme-only routes (`/mono/work/`, mosbyfiles About) (6, 31) | `href()` already themes any non-asset root path (§6.1), so no engine change is needed | page files under `src/pages/<theme>/`, added by that theme's spec; no registry field (D38) |
| Unowned page types in theme tokens + fonts (7) | the composition rule §5.2 | none |
| Theme scripts only on theme pages; two GSAP versions (8, 9) | layouts emit their own tags; `"gsap-next": "npm:gsap@3.15.0"` alias reserved (`research/library-migration.md` §3.2; README rule: never mix `gsap` and `gsap-next` objects in one animation) | the imports |
| Internal colour modes coexisting with picker and toy (10, 11) | D26: session mode state, shared role mapping and an always-enabled randomizer; the fixture tests baseline structural palette support | the `modes` registry field, the theme's own `is:inline` pre-paint component, the mode UI and the wipe: all in the mono spec |
| Prose by slot and size with null; theme-specific strings; ordered fragment arrays; structural constraints (12-15) | the accessor §4.2, sizes with explicit `null`, and the `themes.<id>.*` section under the same `strictObject` rules | a per-theme zod fragment, a `fragments(n)` helper for fixed-length `xs` arrays, and per-slot `constraints` (max lines, initial letter) as refinements: added with cream's strings |
| New fields: project `category`, `year`; `jobs[i].summary` (m); `projects[i].description` (s) (16-19) | nothing; sizes are per field, so `description.s` is a size someone writes, not a schema change | `category`, `year` and `summary` as optional fields, one schema line each, in the spec that writes them |
| Sized job bullets that fit (20) | sizes per field; cream's three bullets (~112 words) exceed the `m` budget (~60) | §13 Q13 |
| Socials with labels, icons, grouping, GitHub (21) | `socials[]` with label + icon | an optional `group` field; the GitHub entry (owner) |
| Image grid from project images; responsive sizes (22) | `projects[].image` | an optional `images[]` field; no image pipeline (intent §7) |
| Preloader/curtain before content; no-JS path; reduced-motion (23, 38) | the Shell owns `<html>` and the end-of-body mount only, so a layout already renders whatever it wants before `<main>`; no slot is needed | the curtain markup; README rule: every structural theme ships `<noscript>` and a reduced-motion branch |
| Smooth-scroll wrappers (ScrollSmoother needs `#smooth-wrapper > #smooth-content`; Lenis on `window`) (25) | the same rule: a layout owns everything inside `<body>` except the end-of-body mount | the wrapper |
| Different mobile structure; theme breakpoint (26, 27) | D25; the theme's CSS owns its breakpoint | the CSS |
| Document-level SVG defs; theme storage keys (28, 29) | the `theme.<id>.*` key rule (D28) | the `<defs>` block, rendered by the theme's own layout with a `theme-<id>-` id prefix; no engine slot |
| Skills as `xs` names + `s` one-liners (33) | sizes are per field: `home.skills.groups[i].body.s` written on request, no schema change | the drafts |
| Generated copy ("3 posts"/"1 post", "Go to slide N", "N min read") (34) | template fields: `xs` strings containing `{n}`, substituted by the component or the client, never regex over prose | plural forms as two fields (`one`, `other`) when a theme needs them |
| Alt/aria for theme chrome from approved strings (35) | `themes.<id>.*` `xs` strings through `prose.text()` | the strings |
| Split-text safety (plain text only) (36) | `prose.text()`; README rule | usage |
| Opting out of every canonical behavior script (37) | owned pages load none of `public/js/` except the cycler; nothing global assumes they ran | none |
| Draft toggle reachable inside a theme's chrome (39) | the pill shares the Shell's end-of-body mount with the dock and FAB | CSS, if a theme's chrome covers the corner |
| Contact form → mailto; stats/testimonials omitted (30, 32) | `null` sizes + section-level omission in data-driven page composition | the choices |
| WebGL canvases (three.js/OGL), Rive, video demos, self-hosted paid fonts, cursor coordinate readout (illoca) | the same mechanisms: theme scripts and assets only on its pages (§5.2, §9 check 5), theme-owned `<head>` for fonts, a layout that owns its document chrome | a `public/themes/<id>/` asset directory convention for video and GLB; recorded clips and font licensing (owner); drafts for tags, one-liners and the FAQ |

The Spec 1 fixture proves the shipped authoring workflow before cutover (§5.3). Cream is the first
production consumer; it adds its layouts, the GSAP alias and `themes.cream.*` strings with their
zod fragment. Later specs may extend the engine for additional capabilities, as intent §8 allows;
they do not inherit unfinished migration cleanup or gaps in Spec 1's demonstrated contract.

---

## 12. Tickets

The T0–T9 table below remains the scope grouping. The executable breakdown is the
[ordered 28-ticket backlog](../../superpowers/plans/2026-09-05-spec-1-migration-engine.md), with
one file per agent assignment, concrete interfaces, file ownership and verification commands.
Follow that backlog's dependency ordering and the latest owner execution clarification above;
historical references below to owner previews/sign-offs are not intermediate execution stops.

Dependency graph: **T0 and T1 may overlap after the runner prerequisites are available**; T0
must pass before T2/T3 implementation proceeds. T1 initially runs old-vs-old with a baseline
adapter derived from the old worktree, without imports from future `src/` or vendor modules and
without migration-only normalizations or new-behavior assertions. T3 wires the new
URL/registry/post projections into that harness; T4 supplies the vendor mapping. **T2 → T3** is sequential: T2 owns registry data/types,
shared prose fields, post sources/schema/reader and the prose-to-theme cross-check; T3 completes
engine behavior and file assertions after the public assets move; **T7 runs alongside T2/T3** (it touches nothing in `src/`); **T4**
follows T3; **T5 and T6 run in parallel** after T4 on **block-level** disjoint paths, not file-level: both edit
`astro.config.mjs` (T5 the `sitemap` block, T6 the `redirects` block), so that one file needs
coordinating or serialising; everything else they touch is disjoint. **T8 is the join**; T9 last.
T2/T3 end with their specified schema, type, build and composition checks; their scaffolds do
not claim full-page visual parity. T4-T6 and T8 require the harness green for completed page
scopes under §9. T0/T1/T7/T9 use their own done criteria below.

Architecture acceptance is distributed through the work: T3 establishes the extension points and
initial fallback test; T4/T5 establish and document canonical behavior boundaries; T6 completes the
shared picker and utility integration. T8 demonstrates the complete authoring workflow and closes
any remaining architecture/cleanup work. T9 verifies that sign-off before executing cutover.

| # | Ticket | Delivers | Done when |
|---|---|---|---|
| T0 | **Spike: Astro 7 on this markup** | Astro 7.3.1 scaffold on the `astro` branch/worktree; `index.html` ported verbatim into one page; `compressHTML:false`; build. Settles: (a) the Rust compiler (`@astrojs/compiler-rs`, strict: unclosed tags error) accepts today's markup once ported; (b) Astro injects nothing into `<head>` for a page whose components have no `<style>` or bundled `<script>` (§6.2 premise) and where an injection would land if one existed; (c) `[...theme]` with `theme: undefined` emits `/` and `/blog/…`; (d) `404.astro` → `dist/404.html`; (e) `prerenderConflictBehavior: 'error'` fires on a planted collision; (f) a throw in `astro:build:done` exits non-zero (source says it does: `integrations/hooks.ts` rethrows and `runHookBuildDone` awaits; this confirms it); (g) a post rendered from `entry.body` with our renderer emits marked's markup, not Sätteri's; (h) `redirects` emits `dist/12years/index.html` as a meta-refresh stub; (i) `public/` copies verbatim, nested dirs and `agent.js`'s `+esm` import untouched; (j) `python3 -m http.server --bind 127.0.0.1` + Playwright 1.61.1 run against the cached Chromium 1228 without a download; (k) the accessor module instance the checks integration imports is the same one the components use (D39). | A `research/spike-findings.md` with each item answered; installs approved and recorded (§14). |
| T1 | **Parity harness v1 (old vs old)** | `harness/` per §9 against the baseline worktree on both ports; DOM dump, screenshots, token sample with the sentinel list, settle with `sentinels.ready`, draw-aware pinned seeds, interactions incl. the wheel and palette-toy states, derived URL map, `scripts.ts`, reporter config. Captures the reference `<html>` attributes and inline style per theme **before `theme-cycler.js` boots**, in both of the ramp's formats (the 95 `hsla()` step properties and the 5 raw-hex base roles, §5.4). | Old-vs-old run is green for all 16 themes × 8 pages × 2 viewports × applicable states; listeners gone after the run. |
| T2 | **Content ownership and shared contracts** | Shared `prose.yaml`, reusable field types/accessor/draft walker, pure post schema and source reader, all 11 post source records migrated with publication state (8 local, 2 external, 1 draft), description/title ownership per Q1, fixed listing membership/order per Q2, registry data/types needed by the theme-label cross-check, marked wrapper, preview pill, production validation/type-check scripts and `CLAUDE.md` rule. | Production fails on planted unapproved shared/publishable metadata and missing requested sizes; a whole draft is retained without entering public projections; metadata conflicts resolve to post values; malformed YAML/frontmatter fails; a negative accessor fixture fails `astro check`; masthead derivation and migrated prose fragments match their old fixtures. |
| T3 | **Registry, routing, shell, theme assets** | completion of T2's `types.ts`/`registry.ts` with engine/file assertions, `paths.ts` (`themeParams`, `href`), T2's publication-filtered post projections and the new-side harness adapter (§7; `paths.ts` stays content-free), `ramp.ts`, `apply.ts` (`themeHtml`, D33), `Shell`, `ThemeAssets`, `Meta`, `compose.ts` (D34), `[...theme]/` pages (empty layouts ok), `404.astro` with D27, canonical/noindex, `PalettePrepaint` + `StyleQueryShim` (§5.4), `prerenderConflictBehavior`, the structural-kind fallback test (§5.3), the checks integration (D39), `README.md` skeleton, and the move of `css/`, `resources/`, `blog/*.css`, `privacy/privacy-styles.css`, `lexchat/lexchat-styles.css` into `public/` (D18 assumes it from here on). | Build emits the non-post routes (16 × 4 = 64) + `404.html`; T5 completes the 192 page routes plus `404.html` and post redirect stubs; `<html>` attributes and inline style byte-equal to the T1 pre-cycler capture for each theme (compared as a declaration map, §9 step 7), which includes the ramp's 95 `hsla()` step properties **and** its 5 raw-hex base roles (§5.4: a port that emits `hsla()` for all 100 fails here); `/?style=brutalist` on `/` lands on `/brutalist/` and preserves any other query parameter; `/404.html?style=brutalist` applies brutalist at runtime; a stub structural theme's blog page has tokens + fonts + `theme-base.css` and none of the stub layout's markup; the checks pass. |
| T4 | **Canonical home** | `Nav`, `Hero`, `About`, `Skills`, `Jobs`, `FeaturedCarousel` (dots and ticker properties at build, D35), `BlogRail`, `Contact`, `Footer`, `Socials`, `ThemePicker` (dock rendered by the Shell); `public/js/` edits and dead-code deletions per §8; `scripts/vendor-map.mjs` + `scripts/vendor.mjs`, `public/vendor/` committed (Boxicons included); masthead JSON island; `--prose-*` emission (D14) and the marquee/doodle sheet edits. | Harness green for home × 16 × 2 × all states. |
| T5 | **Blog listing and posts** | T2's post records wired into the collection/routes, the metadata/body-slot contract, marked-at-build with copy buttons, per-post head, per-post assets as tags, conditional mermaid (D35), `blog-post-client.js`, `blog-listing-client.js`, `BlogCards`, the three-paragraph intro with today's ids, `post.html` shim with `style` forwarding, published `.md` link rewrites, generated external-id redirects, exclusion of drafts/archived bodies, R1 fetch-URL fix, sitemap integration and the `postDates()` helper. (The `refresh-chart-data.yml` path patch moves to T7, which owns `.github/workflows/*`.) | Harness green for listing + the 3 posts × 16 × 2; the build emits 192 page routes plus `404.html` and redirect stubs; exactly 8 local posts render and 10 listing entries remain; Gemma/raw drafts/archived external bodies are absent; `/blog/post.html?id=helm` lands on `/blog/helm/` and `?style=doodle` survives; no 4xx in the network log on any post. |
| T6 | **Utility pages, FAB, subsites, redirects** | privacy/404/lexchat pages on the Shell (§6.3); `PickerFab` (new UI, owner preview) and its `public/css/theme-cycler.css` rules; the Font Awesome link on 404; `public/subsites/elise/12years/`, `public/subsites/dawson/embedded-swift-agent/`; `redirects` config; `robots.txt`; `docs/` unpublished. | Harness green for privacy/404/lexchat under the step 8 table; owner approves privacy/404 FABs visually on 3 skins; LexChat remains linked and picker-free; the FAB opens the dock on a touch emulation (the `.tc-nav-trigger` path, D30); `/12years/` and `/embedded-swift-agent/` land on the new URLs; `/404.html?style=brutalist` and `/404.html?style=doodle` apply their skins; a unit test covers the path-segment resolution `[pathname.split('/')[1], q].find(…)` for `/brutalist/nope/`, `/nope/`, `/brutalist/` and an unknown segment (the live check stays in §10 step 8, because neither `http.server` nor `astro preview` is documented to serve `404.html` for unknown paths). |
| T7 | **Deploy workflow** | `deploy.yml` (full, on the branch, built by first merging `main` into `astro` and editing the dispatch-only file that arrives) plus the dispatch-only copy for `main` (§10 step 2, owner commits), `.nvmrc`, `refresh-chart-data.yml` patch (paths; `actions: write` **added to** today's `contents: write`, not replacing it; `GH_TOKEN`; the dispatch), `prebake-cohort-data.py` `OUT_DIR`. | The dispatch-only workflow has run once on `main`; a dry run (`-F deploy=false`) dispatched with `--ref astro` runs the build job and, if legacy Pages allows it, uploads an artifact; a manual `workflow_dispatch` of `refresh-chart-data.yml` dispatches `deploy.yml` (visible in Actions, confirming the permission and token); Pages still legacy. |
| T8 | **Architecture completion, all 16 themes green + manual QA** | §5.3's complete authoring fixture and tests; `CLAUDE.md` rewrite and working skin/structural authoring walkthrough in `src/themes/README.md`, including module contracts, inactive skins, hard-won rules and the eleven corrected omissions from `theme-engine-contracts.md` §9; banner on `docs/theme-explorations.html`; required boundary refactors and removal of superseded code/scaffolding under §1.1; the full parity matrix and per-skin fixes; the dead `.tc-toggle` rules audited against the real `.tc-fab`; manual QA run by the owner. | All four §1.1 criteria pass, with fixture results, its permitted file-change list and the retained-code audit in `research/architecture-signoff.md`; production output contains no fixture; full parity sweep green after final code changes; owner sign-off recorded in `research/qa-signoff.md` per skin. |
| T9 | **Docs verification and cutover** | Final verification of T8's repo/authoring docs and sign-offs; runbook §10 executed with the owner. | T8's architecture and parity sign-offs are complete; repo/authoring docs match the finished code; live site serves from Actions; §10 step 8 checks pass; rollback command recorded. |

Paths each ticket may touch: T0 the spike worktree only; T1 `harness/`, `playwright.config.ts`; T2
`src/content/prose.yaml`, `src/content/posts/*`, `src/prose/*`, `src/posts/schema.ts`,
`src/build/{checks,posts}.ts`, `src/themes/{types,registry}.ts`, content collection definitions,
`package.json` scripts and dev pins, `CLAUDE.md` (rule only); T3 `src/themes/*`,
`src/layouts/{Shell,ThemeAssets}.astro`, `src/layouts/canonical/Meta.astro`,
`src/layouts/compose.ts`, `src/pages/*`, `src/build/*`, `astro.config.mjs`, and the `public/` move; T4
`src/layouts/canonical/*` (home + components), `public/js/*`, `public/css/themes/{marquee,doodle}.css`,
`scripts/vendor*.mjs`, `public/vendor/`; T5 the posts collection, `BlogListing`/`BlogPost` and
`BlogCards`, `public/js/blog-*-client.js`, `public/blog/**`, `src/content/posts/*`, `src/build/*`, the
sitemap block of `astro.config.mjs`; T6 `Privacy`/`NotFound`/`LexChat`/`PickerFab`, `public/css/theme-cycler.css`,
`public/subsites/**`, `public/robots.txt`, the `redirects` block of `astro.config.mjs`; T7
`.github/workflows/*`, `.nvmrc`, `docs/prebake-cohort-data.py`; T8 `harness/` including the authoring
fixture, `CLAUDE.md`, `src/themes/README.md`, the banner in `docs/theme-explorations.html`, the
architecture/QA sign-off docs, per-skin fixes, and any migrated
`src/`/`public/` modules or superseded root implementations that need changes to satisfy §1.1;
T9 docs only. T4/T5 also update the retained-module contracts in `src/themes/README.md`.

Rough size: T0 half a day; T1 two days; T2 two days; T3 one and a half days; T4 three days; T5 three
days; T6 one day; T7 half a day; T8 re-estimated after T3 to include the authoring fixture,
boundary refactors, cleanup and owner QA (the earlier two-to-four-day estimate covered parity/QA
only); T9 one day.

---

## 13. Settled owner decisions (Q1-Q14, 2026-09-05)

The owner settled all fourteen points and delegated the choices noted below. These replace the
earlier assumed defaults. Q ids are retained for traceability; none is awaiting another answer.
Technical spikes and future per-command install/cutover authorization remain execution steps.

| # | Topic | Settled decision and implementation judgment |
|---|---|---|
| Q1 | Post ownership and format | One source per post: title/date/description/tags and body live together. Post-file title/date win conflicts; existing listing descriptions/tags move into the post. Keep existing Markdown for parity and a metadata/body-slot contract for future MDX/component posts and case studies (§7). The format choice was delegated. |
| Q2 | Listing membership and drafts | Do not list anything currently unlisted. Preserve the ten current listing entries/order: eight local posts plus two external autoencoder links. Keep Gemma and other unpublished content as drafts excluded from production. Autoencoder source records retain authoritative metadata and archived bodies, but publish no duplicate local body; old URLs redirect external. Drop the broken color-randomizer sitemap entry. |
| Q3 | Embedded Swift Agent | Move to `/subsites/dawson/embedded-swift-agent/` and redirect the old URL. Agreed. |
| Q4 | Utility pickers and LexChat | Add FABs to privacy and 404; exempt LexChat. Remove its shell only if the project already links directly to Hugging Face. Repo and live `js/blog-data.js` still point to `/lexchat/`, so retain the shell and its URL with no picker (D12). |
| Q5 | Picker fonts | Delegated: preserve current idle font loading for existing skins. Change it if a concrete architectural need warrants it, with a documented check. New structural heavy assets/fonts still obey active-theme isolation; no new owner question is needed. |
| Q6 | CSS decoration | Counters/prefixes/glyphs remain decoration in CSS. Actual marquee ticker text and doodle's message belong in approved prose. Agreed. |
| Q7 | Masthead duplicates | Keep existing sequences and weighting exactly. An explicit probability-weighted typing engine may be a later refactor. |
| Q8 | Public docs | Stop serving docs and `CLAUDE.md` at cutover, without redirects. Add the interim `Disallow: /docs/` rule now. Agreed. |
| Q9 | Picker placement | Delegated: each theme has a reachable picker, including mobile. It may live inside the theme's own menu; supply the floating fallback if no mount is provided. LexChat is the explicit page exception. |
| Q10 | Palette randomizer and modes | Always present and enabled in every theme's picker. Narrow randomization ranges are allowed; do not hide/gray out the tool. Structural themes map the five shared roles into their own variables. Preserve session-scoped internal modes and palette state (D26). |
| Q11 | Prose exemptions | Delegated: grandfather verbatim subsites and existing per-post assets for migration. New/changed UI text uses its owning content source and approval flow. Post bodies are approved as documents; the museum-derived aria-label gets an approved template when next touched. No blanket exemption for future unapproved text. |
| Q12 | Palette persistence | Keep randomized colors across navigation and reload, restored before paint. Agreed. |
| Q13 | Cream job bullets | Delegated: retain the roughly 60-word `m` budget, draft shorter bullets and let the owner review the actual prose. |
| Q14 | Utility styles | Delegated: existing skins keep their full skin sheet on utility pages for parity; structural themes use the canonical utility layout with their tokens/fonts. LexChat remains picker-free. |

---

## 14. Owner actions this spec needs (not questions)

1. **Node 24 LTS** on your machine (Node 25 is end-of-life; Astro's install page rejects odd-numbered
   lines). Install approval needed for whatever manager you use (`brew install node@24`,
   `nvm install 24`, or `fnm`). `.nvmrc` = `24`.
2. **Install approvals**, requested again at execution time, one command each:
   `npm install --save-exact astro@7.3.1 @astrojs/sitemap@3.7.4 js-yaml@4.3.0 marked@18.0.5 highlight.js@11.9.0 jquery@3.6.0 jquery-ui-dist@1.12.1 aos@2.3.1 vanilla-tilt@1.7.0 gsap@3.9.1 @fortawesome/fontawesome-free@6.5.1`
   and `npm install --save-dev --save-exact @playwright/test@1.61.1 @astrojs/check@0.9.10 typescript@5.8.3` (no browser download at 1.61.1).
   Playwright's browser garbage collection is refcounted by installed clients, so build 1228 survives
   as long as 1.61.1 stays a dependency; installing a newer Playwright alongside it would fetch its
   own build (1.63.0 pins Chromium 1243, ~150 MB) and can remove unreferenced ones, and
   `PLAYWRIGHT_SKIP_BROWSER_GC=1` exists if that ever needs suppressing. Boxicons is **not** installed
   from npm (its package declares six runtime dependencies including React 16); its files are
   committed under `public/vendor/boxicons/`. `js-yaml` is pinned to the 4.x line Astro itself depends
   on (`^4.3.0`) so npm installs one copy; 5.4.1 is latest but not needed. All versions above were
   confirmed on the registry on 2026-09-05. The checker's TypeScript peer range accepts the pinned
   5.8.3; do not substitute TypeScript 7 without checking compatibility.
3. **Planning sources are already committed** in `d14e459`. This owner-decision update is also
   authorized for commit/push to `main`; the interim robots rule is included. Legacy Pages still
   serves these files until cutover; `robots.txt` discourages crawling but is not access control.
4. **Create the baseline worktree** once: `git worktree add --detach ../personal-website-old 0f196d0`
   (the harness only reads it; it never runs git there). And the working branch:
   `git worktree add ../personal-website-astro -b astro`.
5. **Commit the dispatch-only `deploy.yml` to `main`** before the dry run, and let it run once there
   (§10 steps 2-3; T7 prepares it).
6. **Cutover** steps 4, 6, 7 in §10 are yours to run (repo settings + merge).
7. **Resubmit the sitemap** in Search Console after cutover: the URL changes from `/sitemap.xml` to
   `/sitemap-index.xml` and the old one is a dead URL that no redirect can cover (D24).
8. **Manual QA** in T8, ordered by skin.

---

## 15. Deliberate visible changes (harness allow-list)

The §9 step 8 exception table implements this list; anything not here must match.

1. Theme in the URL (`/<id>/…`); reload keeps the theme; switching keeps the current page (D11). The
   logo, an absolute URL to the default home today (`index.html:57`, `privacy/index.html:25`), is now
   a themed link, so it keeps the theme instead of dropping to default.
2. Palette-toy state survives reload and navigation, applied pre-paint as today (D11, Q12).
3. Theme picker FAB plus the dock on privacy and 404 (D12, Q4), with the added Font Awesome
   stylesheet on 404. LexChat retirement is separately covered by item 12.
4. Posts at `/blog/<id>/` with real `<title>`, description, canonical, OG and JSON-LD in the served
   HTML; no "Loading…" title; old URL redirects via a shim page that forwards `?style=`. Post
   metadata derives from each post source (Q1), so Helm/METR title/date differences are resolved.
   Preserve current listing membership/order; Gemma is withdrawn into drafts and produces no
   public page. Autoencoder cards retain their external targets; archived local bodies are not
   republished, and their known old URLs redirect external. Draft/unknown legacy ids reach 404.

5. `/12years/` moves under `/subsites/elise/`, `/embedded-swift-agent/` under `/subsites/dawson/`
   (Q3); both old URLs redirect.
6. Generated sitemap at `/sitemap-index.xml` + `/sitemap-0.xml` (entries and `lastmod` change;
   `color-randomizer` and Gemma gone; no duplicate local autoencoder entries). `/sitemap.xml` becomes a dead URL.
7. `docs/` and `CLAUDE.md` no longer served (Q8).
8. Third-party files served from `/vendor/` instead of CDNs (byte-identical except jquery-ui's one
   escape byte; mermaid, Plotly, js-yaml still CDN). Mermaid loads only on posts that have a diagram,
   and highlight.js's runtime script disappears from post pages entirely (rendering moved to build).
9. Dock markup is in the served HTML instead of built by JS (identical after load, plus `data-*`
   attributes carrying its strings and per-theme row data); preset rows link to the themed URL of the
   current page instead of `/?style=<id>`.
10. Themed pages carry `canonical` + `noindex`; `<html>` carries `data-typing`/`data-typing-delete`
    (D32) and, under marquee/doodle, `--prose-*` in its inline style.
11. The 404 page: themed under `/<id>/…` paths (new) and under `?style=` (as today), applied after
    parse rather than pre-paint, so a brief default flash (D27). It is best-effort themed: its "Back
    to the home page" link and its dock rows point at default-theme URLs, because the page is
    rendered as default.
12. **Owner-directed LexChat retirement, 2026-09-08.** Only the LexChat project's existing
    `Visit LexChat` CTA changes from the OLD `/lexchat/` destination to the owner's exact
    approved Hugging Face URL, with the external anchor attributes required by the existing
    project contract. Assert both destinations and the intended attributes before narrowly
    normalizing that identified CTA for comparison. Card image, title, description, ordering,
    other anchors, screenshots and tolerances remain exact. Remove the obsolete LexChat
    iframe matrix entries, and assert absence of every local/theme LexChat page, redirect,
    unused page asset and sitemap entry. No blanket link or page-parity exclusion is allowed.

Everything else, on every page, at both viewports, in every listed interaction, must match today's
site to the harness's tolerances and to your eye.

---

## 16. Traceability

| Intent | Where |
|---|---|
| §3.1 prose ownership | §4, D7-D10, D14-D17, D36, D37, Q6, Q11, Q13 |
| §3.2 parity | §9 (incl. the step 8 exception table), §15, T1, T8, D27, D29, D33 |
| §3.3 lean | D5, §5.2 fallback (no theme scripts), §9 check 5, §11 GSAP alias and capability 37 |
| §3.4 done properly | §1.1 architecture completion gate, §3.3 boundary and module graph, typed registry §5.1 (D28), accessor §4.2 (D37), Shell D29, `compose` D34, `href()` D31, D3/D32, §5.3 authoring fixture (D38), T8 sign-off and T9 cutover |
| §3.5 URLs | §6.4 |
| §3.6-3.7 structural freedom, five consumers | §5.3, D38, §11 |
| §4.1-4.13 locked decisions | D1-D2 (stack), §4 (sizes, file, drafts), §6 (paths, posts, coverage incl. 404 via D27, subsites), §9 (harness), §10 (deploy), §14 item 4 + D20 (baseline and working worktrees), D5 (libraries, deviation stated), D3 (behavior policy) |
| §5 delegated | §2 |
| §9 delegated choices | D7 (YAML shape), D25 (mobile), D26 (modes), D9 (draft toggle), D10 (budgets), §6.1 (canonical/noindex/sitemap), D23 (explorations doc), §9 (thresholds, viewports, settling) |

Deviation from the initial library preference, stated rather than silent: **D5 vs intent §4.12**
(mermaid, Plotly and js-yaml stay on CDN; the rest move to npm but are served as committed files
rather than Vite-split per theme). Intent §4.10 now reflects D18: `CNAME` and `.nojekyll` stay at
the repo root for rollback. The §9 matrix fulfills intent §4.9's "carousel scroll" requirement
with both a dot click and a `mouse.wheel` on the track, exercising the vertical wheel guard.

Settled owner clarifications supersede earlier wording: Q1 places each post's metadata with its
body; Q2 defines publication separately from source retention; Q10 requires the palette tool in
every theme; Q14 keeps full skin CSS on utility pages and tokens/fonts for structural fallback;
Q4 exempts the still-linked LexChat shell from the picker. The intent has been updated to match.

---

## 17. Research errors found while finalizing (for the research files' readers)

1. `prose-and-url-inventory.md` §2.9: "`--ticker-run` … never assigned" is wrong;
   `js/featured-carousel.js:413-414` assigns `--ticker-run` and `--ticker-dur` on `<html>` (D14,
   D35 moves the computation to build).
2. `library-migration.md` §3.8 calls Astro's pipeline remark; in Astro 7 it is Sätteri (D6).
3. `page-behavior-and-blog-pipeline.md` §3 speaks of masthead *indices* (3, then 0); a seed of 3
   yields index 6. The harness pins indices, and pins them per draw (§9).
4. `prose-and-url-inventory.md` §2.5 header says "10 sequences"; 9 are active (`script.js:129-192`),
   one is commented out.
5. `page-behavior-and-blog-pipeline.md` §8 says `BLOG_POSTS` has 11 active entries; it has 10 plus
   one commented out (`js/blog-data.js:122-129`).
6. `library-migration.md` §1 item 2 lists five byte-identical libraries without jquery-ui and item 3
   states the one-byte difference, so the file is correct; the erratum this spec's earlier draft
   carried (that §1's headline lumps jquery-ui into the byte-identical set) is withdrawn.
7. `library-migration.md` R1 names only `cohorts-chart.js`; `job-market-chart.js:12` has the same
   page-relative URL (§7).
8. `deploy-and-parity-harness.md` §2.2 uses `node-version-file: package.json`; this spec uses
   `.nvmrc` per `astro-capabilities.md` §2.1 (§10).
9. `theme-engine-contracts.md` §9 lists six stale claims in `docs/theme-explorations.html`, not
   three; the doc also does not link `theme-bootstrap.js` (D23).
10. `astro-capabilities.md` §3.10 recommends keeping the draft gate in zod; this spec does (D10) and
    uses the `astro:build:done` hook only for the unwritten-size list and the engine invariants
    (D39). No `process.exit(1)` fallback is needed: a thrown hook error propagates and fails the
    build (verified in `astro@7.3.1`'s `integrations/hooks.ts`).
11. **An error this spec's own finalizing pass introduced**, corrected in review round 1: a
    verification agent reported that no pre-paint theme override exists today, and the finalized
    draft repeated it in D4. It is false: `theme-bootstrap.js:727-742` applies the saved palette
    before first paint. D4 and §5.4 now keep that override, which D11's persistence makes
    load-bearing.
