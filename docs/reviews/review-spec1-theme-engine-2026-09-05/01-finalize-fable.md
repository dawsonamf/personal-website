# Step 1: finalize spec 1 (Fable 5.1, single agent + three Opus verification subagents)

Dispatched by the orchestrator (Fable 5.1) against `docs/intents/2026-09-05-theme-engine-rewrite/spec-1-migration-engine-parity.md` at its pre-finalize state (722 lines, 60,595 bytes). The agent read `intent.md` and the spec itself, and delegated three verification deliverables to Opus subagents: (A) every codebase claim checked against `js/`, `blog/`, `css/`, `index.html`, `blog/index.html` (64 tool uses); (B) every claim citing `research/*.md` checked against the cited section and the code (50 tool uses); (C) third-party versions and APIs via Context7, `npm view`, GitHub docs and raw action manifests (52 tool uses). One edit pass folded the evidence in. Agent totals: 284k tokens, 24 tool uses, ~35 min wall clock.

The agent's report, verbatim:

---

Sanity check done: the finalized spec has 0 em dashes; every `D1-D31`, `Q1-Q13` and `T0-T9` reference resolves to a definition; `**Status:**` reads `final draft, awaiting owner approval`, `**Written:**` kept, `**Finalized:** 2026-09-05` added; `git status --short` shows exactly the original six untracked entries (five `docs/*prototype*.html` + `docs/intents/`) and zero files created by me inside the repo; nothing listens on 8781/8782, no `http.server`/Playwright processes exist, the monitor has exited and all three subagents completed. The only file modified is `/Users/dawsonamf/Desktop/dax/personal-website/docs/intents/2026-09-05-theme-engine-rewrite/spec-1-migration-engine-parity.md`.

## Report

### 1. Corrections made (spec said → what is true; evidence)

Codebase claims (agent A, file:line):
- Colour ramp cited at `theme-bootstrap.js:744-774` → the loop is `:764-774` (`:744` is inside `hexToHsl`); `STEPS` has 19 entries, 19×5+5 = 100 properties; `hsla(` + `toFixed(0)` at `:771`.
- "Bootstrap tag last in `<head>` on home/listing/privacy/404/lexchat" → last only on privacy (`:18`) and lexchat (`:11`); home `index.html:27` is followed by 13 script tags, listing `:27` by 9, `404.html:16` by a `<style>` block, post `:17` sits before `github-dark` `:19`. More important: the bootstrap appends its links to the **end** of `<head>` at runtime (`:715-721`, `document.head.appendChild`), so `ThemeAssets` now goes last in head on every page (§5.4, D29), which also keeps the skin sheet after `github-dark.min.css`.
- Runtime globals "three" → seven (`__THEME_CYCLER_ENABLED :8`, `__THEME_REGISTRY :639`, `__THEME_ORDER :640`, `__styleAllowsTilt :646`, `__styleTypingMode :654`, `__styleTypingDeleteMode :664`, `__ACTIVE_STYLE :700`); the cycler reads four of them. `ThemeRuntime` now defines the same seven plus `__PAGE_PATH`.
- D4's "pre-paint script for the palette toy's session override" → no such thing exists today; the cycler restores post-load (`theme-cycler.js:126-147`). Dropped.
- Registry fields presented as universal → sparse: `tokens` 15/16, `css` 15, `fonts` 14, `flags` 14 (absent on default and miami-deco), `typing` 8, `random` 3 (brutalist, marquee, studio), `typingDelete` 1 (marquee). Types annotated.
- **D16 "exactly as `blog-post.js` does today"** → false: zero `#calendly` handling anywhere; the `link` renderer (`blog-post.js:4-14`) has two branches; `calendly-link` exists only as hand-written HTML (`index.html:275`, `nav-config.js:60`). Re-labelled new behavior.
- **D14 ticker**: `marquee.css:572` already reads `content: var(--ticker-run, "<unit ×12>")` and `featured-carousel.js:413-414` sets `--ticker-run`/`--ticker-dur` at runtime; the literal is the fallback rendered on pages without the carousel. §8 also claimed the run is "computed at build and emitted on `<html>`" while §3.3 said it is a JSON island; now one statement: it stays runtime, `buildTickerRun` reads chips from the rendered DOM. `402/46` is the chars-per-second constant (`:386`). doodle's string is `'currently here \2713'` (`doodle.css:535`).
- D15 "all 8 project descriptions" have `<br><br>` → 7 of 8 (`deep-rl` is one paragraph).
- D13 "skins style `.privacy-*`/`.nf-*`" → only grid, banknote, gallery, neo-pop (+ inactive constructivist).
- D12 → `.tc-toggle` FAB never existed; dead rules survive in 16 skin sheets + `theme-base.css:81`.
- D8 frontmatter parser "survives helm's colon by luck" → it splits on the first colon (`blog-post.js:32-48`), so the colon is fine by construction.
- §4.1 sample: socials were 2, are 6 (LinkedIn, X (Twitter), Messenger, Email, Contact card, Schedule a call; `nav-config.js:49-61`); nav gained `email`; `picker.schemes` filled (`SCHEMES :62` + random `:487`); jobs are 4; `accentColor` added; new prose strings the code emits that the sample missed: `Copy code` (`blog-post.js:98` aria-label), `{n} min read` (`:165,178`), `Go to slide {n}` (`featured-carousel.js:266`); section numbers are `<span class="sec-num">` on home and listing.
- §6.2 head order "meta → favicons → OG" → charset/viewport, title, description, **canonical** (`index.html:8`), 2 favicons, 5 OG/Twitter, CDN CSS, site CSS, page CSS, `theme-cycler.css`; `post.html` has no canonical, OG, Calendly CSS or AOS.
- §8 load-order sentence was self-contradictory ("AOS/tilt/anim-utils sync on listing, defer on home; vanilla-tilt sync everywhere") → aos, featured-carousel, typing-engine are defer on home/sync on listing; vanilla-tilt and anim-utils are sync on both (`index.html:33-39`, `blog/index.html:29-35`; research §6 table re-verified).
- §7: mermaid "`/vendor…`/CDN" → CDN only (D5); `mermaid.run` is unconditional today (`:172`); frontmatter `styles` are a plain `forEach`, only `scripts` are chained (`:114-135`); card markup `blog-listing.js:123-152` → `:127-139`; there is no "All" pill; museum hosts are four APIs plus three image hosts (`underviewed-art.js:38,84,127,146`); both chart fetch files are unpublished `ai-job-market` assets (`cohorts-chart.js:642-682`, `job-market-chart.js:12`).
- §9 settle "8 intro elements" → 10 (`anim-utils.js:19` pins `.static-menu`, `.name-logo`, `#typing-container`, `#socials-list`, `.static-menu-mobile`, `.double-view-left/right`, two about-header elements, `#sub-text`); added `--ticker-run` non-empty and `--section-rule` stable (research §3).
- §9 "seed 3 → home index 3; second shot seeded to index 1 for min-height" → mulberry32 seed 3's first draw is 0.720 → index 6 (a "builder." duplicate); the research speaks of indices 3 then 0 and gives no seed or min-height rationale. Harness now pins indices via `seedFor(index, n)`.
- §9 matrix had 404 × 16 themes with the pair `/404.html` ↔ `/404.html`, while §6.3 said the 404 "renders the default theme only" and intent §4.7-4.8 want it themed under every path → D27; pair `/404.html?style=x` ↔ `/404.html?style=x`. lexchat was missing from the matrix (§1 promised every page type) → added, `dawsonamf-lexchat.hf.space` aborted.
- §9 "12 sentinel selectors" had no source → a selection rule + `harness/sentinels.ts` fixed in T1.
- §6.5 12years "~450 words" → ~395; three files; gsap 3.12.5 + ScrollTrigger from cdnjs.
- D22/Q8 "three unpublished post drafts" → located in `docs/planned-posts/`.
- D23 "stale in three places" and intent's "links the old bootstrap" → six stale claims + eleven omissions (`theme-engine-contracts.md` §9); the doc does not link `theme-bootstrap.js`.
- D24 "`lastmod` wrong by months" → three of nine disagree (helm, embedded-swift-agent, metr-doubling).
- §3.1 tree: dropped `Redirect.astro` (nothing used it), the `public/12years/index.html` stub (duplicated the `redirects` config; Astro docs give no precedence for a `public/` file colliding with a redirect), and the duplicated `robots.txt`.
- §1.4 "four scripted interactions" vs §9's six → "each scripted interaction in §9". T1 "7 pages × 7 states" → "8 pages × applicable states".

Third-party claims (agent C + my own fetch):
- D1's why: "Astro does not support odd Node lines; 25.9 fails silently" → `npm view astro@7.3.1 engines` = `node >=22.12.0` (no upper bound, no odd-line exclusion); the real reason is Node 25 EOL 2026-06-01 and Node 24 Active LTS (`nodejs/Release/schedule.json`). Conclusion kept, rationale rewritten.
- D2: `compressHTML` is `boolean | "jsx"`, default `'jsx'` (config reference; 7.0.0 changelog #16965); `prerenderConflictBehavior` exists, `'error' | 'warn' | 'ignore'`, default `'warn'`.
- D6: "Sätteri pipeline emits different HTML (ids, classes, escaping)" → unsourced (agent B: that phrasing is `library-migration.md` §3.8 about remark, now stale); Sätteri and `@astrojs/compiler-rs` are real (`npm view astro@7.3.1 dependencies`; 7.0.0 changelog #16966, #16462). Rewritten as "uncompared/unverified".
- D10: `astro:build:done` receives `{ pages, dir, assets, logger }` (no `routes`); whether a throw fails the build is undocumented → `process.exit(1)` fallback pinned. Drafts gate moved into the zod `superRefine` (documented failure path, as research §3.10 recommends).
- D9/§4.1: `astro build --mode preview` → dropped; Astro docs: config files cannot read `import.meta.env`, so one `PROSE_DRAFTS=allow` env var read via `process.env`.
- D5: "byte-identical verified by sha256" → jquery-ui-dist differs by one escape byte (`research/library-migration.md` §1.3/§3.4); aos and Boxicons have no sha (already served from npm CDN paths); Boxicons has six runtime deps (`npm view boxicons@2.0.9 dependencies`); mermaid `dist.unpackedSize` 76,342,428; the post's CDN js-yaml is 4.2.0 while the build installs 4.3.0 (now stated as two different things).
- D18: `upload-pages-artifact@v5` `action.yml` tar line `--exclude=.[^/]*` unless `include-hidden-files: true` (fetched raw); GitHub docs quote on CNAME being ignored under a custom workflow (verified).
- D21: latest majors checkout v7.0.1, setup-node v7.0.0, upload-pages-artifact v5.0.0, deploy-pages v5.0.1 (`gh api …/releases/latest`); GitHub docs quote on `GITHUB_TOKEN` events not creating runs (verified).
- **§10 step 3** (dispatch `deploy.yml` from the `astro` branch before the merge) → impossible as written: GitHub docs, "To trigger the `workflow_dispatch` event, your workflow must be in the default branch." Runbook gains a step 2 (dispatch-only `deploy.yml` committed to `main`, no `push` trigger) and §14 item 5.
- §3.2 `redirects` in static output: meta-refresh only, no status code (config reference); sitemap filter now also catches `/404/`.
- T0's "nine unverified items in `astro-capabilities.md` §3" → §3 has 15 items and only 4 of T0's 9 were in it (agent B); T0 now lists ten explicit checks (a)-(j) with the right citations, dropping "redirect output" and "`is:inline`" (both documented).
- `retainBody` placed inside the `glob()` options (it is a glob option, not a collection option).
- Playwright 1.61.1 ↔ Chromium 1228 confirmed (`browsers.json` at `v1.61.1`; `~/Library/Caches/ms-playwright` has `chromium-1228` and `chromium_headless_shell-1228`); latest is 1.63.0 (1243), which would download and may garbage-collect 1228 (§14 warns).

### 2. Contracts pinned / design changes (all stated in §2)

- **D27** 404 resolves its theme at runtime (path segment, then `?style=`) via `src/themes/apply.ts` + the `__THEME_REGISTRY` blob; the only runtime theme application; why: a static host serves one `404.html`, and intent §4.7-4.8 want it themed under every theme path.
- **D28** registry slimmed: `ORDER`, `owns`, `storageNamespace`, `breakpoint`, `root` removed (each derivable or unused by the engine); `layouts` are lazy imports so the module graph (§3.3) is acyclic.
- **D29** `Shell.astro` is the single owner of `<html>`, the head tail (`ThemeRuntime`, then `ThemeAssets` last) and the body tail (dock, scrim, cycler, FAB, pill); a build-done scan of `dist/` asserts one `#tc-dock`, one `#tc-scrim`, one `__THEME_REGISTRY`, ≥1 `.tc-nav-item` per page (mechanical, not a README rule).
- **D30** picker trigger = any `.tc-nav-item` (the cycler's selector today); `injectDom()` → `wireDom()`; one code path for nav item, FAB and structural mounts.
- **D31** `href()` rules (§6.1): throws on relative paths, prefixes exactly the engine's routes, passes everything else through; a grep test bans `href="..`/`href="blog/` in `src/`.
- §4.2 accessor: `prose.data` + `get/text/list/has`; a state table for written / `null` / absent / unknown path (absent is recorded and fails the build at the end; unknown path throws immediately).
- §4.1 schema rules 1-8: `strictObject`, `{n}` templates, no Markdown in `xs`, posts ↔ files, themes ↔ ids, masthead delete counts, drafts via `superRefine`, YAML-syntax guard in `astro:config:setup`, the `AI & ML` round-trip rule.
- D9 marking: `get` wraps, `text` prefixes `[DRAFT] `; the pill counts the DOM at runtime; `data-prose-native` toggle; pill CSS/JS `is:inline` so even preview builds inject nothing.
- §5.2 `layoutFor` and the per-line `ThemeAssets` rule (skin: fonts + `theme-base` + skin css; structural owned: fonts; fallback: fonts + `theme-base`; default: nothing, as `theme-bootstrap.js:703` does today).
- §5.4 exact blob contents; `?style=` shim never on 404.
- §9: full URL map, index-pinned seeds, sentinel rule, settle as a numbered list with a 15 s failure, normaliser as seven numbered rules (incl. `--prose-*` stripping), explicit abort-host list, check 5 keyed to an allow-list `harness/scripts.ts` (the old wording would have failed on the §8 renames and the 404's bundled script).
- §12: "paths each ticket may touch" per ticket; T0/T3/T6 done-whens made concrete.
- §11: rows added for capabilities 20, 33, 34, 35, 37, 39 (template fields with `{n}` and `one/other` plurals; the pill shares the Shell mount).
- §13 Q13 added (cream's job bullets ≈112 words vs the `m` budget ≈60; default: tighter `m` drafts); §14 items 5 (dispatch-only `deploy.yml` on `main`) added; Q1-Q12 defaults untouched.
- §17 added: ten research errors, for readers of the research files.

### 3. Unverified items left marked in the spec

- T0 (a)-(j): `@astrojs/compiler-rs` accepts the ported markup; Astro injects nothing into `<head>` when components have no styles/bundled scripts (injection position is undocumented); rest-param `undefined` root (documented, still run); `404.astro` → `dist/404.html`; `prerenderConflictBehavior: 'error'` fires; `astro:build:done` throw exit code (fallback `process.exit(1)`); our renderer, not Sätteri, emits post markup; `redirects` stub emission; `public/` verbatim copy; `http.server` + Playwright 1.61.1 run.
- T7: `permissions: actions: write` sufficing for `gh workflow run` (no doc sentence ties the permission to `workflow_dispatch`); whether `source` is required in the `PUT /pages` body (422 fallback); whether `https_enforced` survives the flip (re-asserted).
- T6/§10 step 7: the path-segment 404 case (`/brutalist/nope/`) is checked live, since neither `http.server` nor `astro preview` is documented to serve `404.html` for unknown paths.
- T1: the 12 sentinel selectors and the listing's masthead index.
- highlight.js cdnjs bundle = `:common` rests on the research's language-set diff (`library-migration.md` §3.7, 36 = 36), not a docs sentence.

### 4. Surprises / risks for the owner

- **D16 was not parity**: the `#calendly` link convention is new behavior; safe (no existing link uses it) but the spec had claimed it copied `blog-post.js`.
- **Intent §4.8's themed 404 is impossible without runtime code** on a static host; D27 is the smallest mechanism and it brings a brief default flash on the 404 only (§15 item 11). This is a deliberate deviation from D4's "nothing resolved at runtime".
- **The deploy dry run needs `deploy.yml` on `main` first** (GitHub rule); a new owner action.
- **The owner's Node 25 is end-of-life** (since 2026-06-01), not merely unsupported by Astro.
- **Research errors that would have shipped bugs**: `--ticker-run` "never assigned" (it is, `featured-carousel.js:413`), and "seed 3" (would have pinned masthead index 6, a "builder." duplicate). Both fixed; all ten listed in §17.
- **D18 keeps `CNAME`/`.nojekyll` at the repo root**, deviating from intent §4.10's "ride in `public/`"; both are ignored/stripped on the Actions path (GitHub docs + the action's tar `--exclude=.[^/]*`), so the outcome is the same and the root copies enable the legacy rollback. Worth one nod from the owner.
- **New prose the draft rule must cover**: `Copy code`, `Go to slide {n}`, `{n} min read` (aria and generated text); added to `prose.yaml` as templates.
- Playwright 1.63.0 is latest; installing anything newer than 1.61.1 downloads Chromium and may garbage-collect build 1228.
- `docs/theme-explorations.html` is wrong in six places; the eleven omissions in `theme-engine-contracts.md` §9 (notably `void dock.offsetWidth` instead of rAF under automation) must reach `src/themes/README.md` in T9 or a "modernisation" will break the harness.
- Cosmetic: `refresh-chart-data.yml`'s header references a non-existent `blog/posts/ai-job-market.md`; `theme-cycler.js:509` says "all 20 skins".
- The spec grew 42% (pinned contracts, §17, ticket boundaries); nothing was added beyond what the brief asked to pin.

### 5. Size and hygiene

- Before: 722 lines, 60,595 bytes. After: 902 lines, 86,165 bytes. Em dashes: 0 before, 0 after.
- `git status --short` is unchanged: `?? docs/bento-prototypes.html`, `?? docs/cream-prototype.html`, `?? docs/intents/`, `?? docs/layout-prototypes.html`, `?? docs/list-portfolio-prototype.html`, `?? docs/mono-prototype.html`; no file created in the repo (scratch only under `/tmp/spec1-finalize/`; the pre-edit copy is `/tmp/spec1-finalize/spec-before.md`).
- No git actions, no installs, no servers: `lsof` on 8781/8782 empty, no `http.server`/Playwright processes; the completion monitor exited; the three Opus subagents (A: 64 tool uses, B: 50, C: 52) all completed.

---

## Orchestrator spot-check (Fable 5.1)

Checked against `main` @ `0f196d0` before dispatching step 2: `theme-bootstrap.js:764-774` is the ramp loop with `hsla(` and `toFixed(0)`; `STEPS` at `:671` has 19 entries; `marquee.css:572` reads `content: var(--ticker-run, …)`; `featured-carousel.js:413-414` sets `--ticker-run`/`--ticker-dur`; `blog/blog-post.js:4-14` has the two-branch link renderer and no `calendly` anywhere; `theme-bootstrap.js:715-721` appends the theme links to `document.head`; D27-D31 and §17 exist in the spec; spec is 902 lines / 86,165 bytes with 0 em dashes; `git status --short` unchanged. All pass.

Risk dispositions before step 2: D27 (runtime-themed 404, a deviation from D4) accepted as the smallest mechanism that satisfies intent §4.7-4.8 on a static host, flagged for the owner and left to the reviewers; D18 (`CNAME`/`.nojekyll` at root rather than `public/`) accepted, same served outcome, flagged for the owner; all other items are fixed in the spec or informational.
