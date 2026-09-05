# Spec 1 reviewed: the theme engine rewrite's migration spec (2026-09-05)

The owner's first review round on a spec rather than a diff, run by a Fable 5.1
orchestrator on `docs/intents/2026-09-05-theme-engine-rewrite/spec-1-migration-engine-parity.md`
against `main` @ `0f196d0`, in the order the owner set: one Fable finalizer;
Matt Pocock's `improve-codebase-architecture` skill pointed at the spec, on
Fable; Cursor's `thermo-nuclear-code-quality-review` prompt (fetched verbatim
from `cursor/plugins`, piped into the brief with the orchestrator's framing for
a spec), on Fable; four correctness reviewers as parallel siblings with
pairwise identical briefs, two Fable and two Opus; one Opus fix pass on the
orchestrator's consolidated list; one Opus verification that the fix landed;
then, because the verification surfaced seven residual blockers, one small
Opus follow-up dispatch per the owner's "a new problem is one new dispatch,
not a loop" rule, spot-checked by the orchestrator rather than reviewed again.
Nothing was built: the only file any agent modified is the spec. Every reviewer
got the spec, the intent and repo pointers; none saw the finalizer's report,
and the correctness reviewers did not see the architecture or thermo-nuclear
findings. The fix pass got the orchestrator's list as its instructions and the
raw reports as evidence by finding id; the verifier got the fix agent's report
as claims to check. The raw material is beside this note in
`review-spec1-theme-engine-2026-09-05/`: every report verbatim, the code walks
the reviewers delegated, the verbatim Cursor prompt, the orchestrator's notes
and spot-checks, and the spec at each stage (`spec-before-finalize.md` 722
lines, `spec-finalized.md` 902, `spec-after-fix.md` 1214, `spec-after-fix2.md`
1310, the last identical to the live file).

## What was run

| Step | Agent | Model | Got | Produced |
|---|---|---|---|---|
| 1 | Finalizer | Fable, with three Opus verification subagents (codebase claims, research citations, third-party facts) | intent, draft spec, research pointers, the owner's deep-module bar | the spec at 902 lines: ~45 corrections, five new decisions D27-D31, contracts pinned, §17 (ten research errors) |
| 2 | Architecture pass | Fable, with three Explore walks | the skill files, intent, finalized spec | 8 candidates (2 Strong, 4 Worth exploring, 2 Speculative), Markdown + the skill's HTML report (never opened) |
| 3 | Thermo-nuclear review | Fable, with five walks (A theme runtime globals, B1 home behavior scripts, B2 blog pipeline, C page heads, D skin CSS) | the Cursor prompt verbatim, the orchestrator's call, intent, spec | 13 findings F1-F13, verdict "do not approve", 5 presumptive blockers |
| 4 | Correctness ×4 | Fable ×2, Opus ×2, each with its own verification children | identical briefs: spec, intent, repo pointers, the correctness axis only | fable-1 1/8/21 (+6 third-party notes); fable-2 4/7/19; opus-1 4/15/31; opus-2 3/11/16 (blocker/major/minor) |
| 5 | Fix pass | Opus, one Explore verification of the cycler contract | the 88-item fix list, spec, raw reports by id | the spec at 1214 lines: 86 done, 2 done differently, D32-D39 added, 25 decisions revised, 4 corrections from its own verification |
| 6 | Verification | Opus, five read-only verification agents | both snapshots, the fix list, the fix agent's claims, raw reports | 86/88 landed, 9 landed with an error, 32 residual findings R1-R32 (7 blockers), a scoped follow-up |
| 7 | Follow-up | Opus | the verifier's R1-R32 plus two orchestrator additions | the spec at 1310 lines: 32 + 2 done, 1 done differently, §9 rule 6 rewritten as one scoped rule with a 15-row mapping table |

## The finalizer (Fable)

Read the intent and spec itself and delegated three verification deliverables
to Opus: every codebase claim against the files (64 tool uses), every research
citation against the cited section and the code (50), every third-party
version and API through Context7, `npm view`, GitHub docs and raw action
manifests (52). Corrections it made with `file:line` evidence: the ramp loop is
`theme-bootstrap.js:764-774`, not `:744`; the bootstrap defines seven globals,
not three; D16's `#calendly` convention was new behavior mislabelled as parity;
the marquee ticker is already a runtime custom property (the research had it
"never assigned"); 7 of 8 project descriptions use `<br><br>`, not all 8; the
§9 seed pinned the wrong masthead index (mulberry32 seed 3 draws 0.720, index
6, a "builder." duplicate); the §10 dry run cannot dispatch from a non-default
branch (GitHub: "your workflow must be in the default branch"); Astro's engines
field has no upper Node bound (the real reason for Node 24 is Node 25's EOL);
`astro:build:done` receives no `routes`; `--mode preview` cannot be read from
the config file. It pinned the accessor's state table, the schema's eight
rules, the harness URL map, the settle list, the normaliser's seven rules, the
ticket paths, and added D27 (runtime-themed 404), D28 (slimmed registry), D29
(one shell), D30 (picker trigger), D31 (`href()`), Q13 and §17. Three of its
changes were later overturned by the round: D29's "theme links last in head"
(the bootstrap runs as a blocking script, so its `appendChild` lands right
after `theme-cycler.css`), its verification agent's "no pre-paint palette
override exists today" (`theme-bootstrap.js:727-742` applies the saved toy
palette before paint; the draft had been right), and D30's "any `.tc-nav-item`
is a trigger" (the click binds on `.tc-nav-trigger` inside it). 284k tokens,
about 35 minutes, plus its three children.

## What each reviewer found

Cells read: found or not, with the reviewer's own severity or badge. A =
architecture (badge), T = thermo-nuclear (F number), F1/F2 = the Fable
correctness reviewers, O1/O2 = the Opus ones. The right column is the
orchestrator's disposition, then what the fix pass and the follow-up did.

| Finding | A | T | F1 | F2 | O1 | O2 | Disposition |
|---|---|---|---|---|---|---|---|
| Normaliser maps old links to un-themed routes while the new side prefixes `/<theme>/`; DOM diff red on all 15 skins | no | no | blocker | blocker | no | blocker | fixed (A1); the verifier then found rule 6 still wrong in six ways (`./` is the Blog item, not the logo; no stylesheet mapping; unscoped over canonical/OG; bare `#x` vs `href()` rule 2; `/lexchat/` and `/embedded-swift-agent/` missing; the 404 themed on one side); rewritten in the follow-up as one scoped rule with a mapping table |
| §9 defines parity as exact DOM equality with no mechanism for the §15 allow-list | no | no | no | blocker | blocker | blocker | fixed: normaliser step 8, a per-page-type exception table keyed to §15; comment nodes dropped |
| `npx astro build` never runs `prebuild`; gitignored `public/vendor/` ships empty and every vendored asset 404s in production | adjacent (A8, one vendor table) | adjacent (F10, commit the vendor dir) | no | blocker | no | blocker | fixed by adopting F10: `public/vendor/` committed, hooks and sha256 list dropped, one `vendor-map.mjs` with three consumers |
| D4's "no pre-paint override today" is false; retiring the bootstrap adds a palette flash on every navigation | no | no | major | major | blocker | no | fixed: `PalettePrepaint.astro`; the finalizer's error recorded in §17 |
| Theme links land after `theme-cycler.css` (blocking-script `appendChild`), before `github-dark` on posts; "last in head" breaks head order on 48 themed post pages | Strong | no | read it as last | major | read it as last | no | fixed: per-page head table in §6.2; the orchestrator's own check of `index.html:26-27`, `blog/post.html:16-19`, `theme-bootstrap.js:715-721` decided against the two reviewers who verified the opposite |
| §7's post DOM omits `.blog-post-title`, `.blog-post-meta`, `.blog-post-content`, which 20 of 20 sheets target | no | no | no | no | blocker | no | fixed |
| `titleSuffix` "on every page" doubles the name on home and lexchat | no | no | minor | minor | major | major | fixed: blog, post, privacy, 404 only |
| The cycler binds click on `.tc-nav-trigger` behind a hover gate; a FAB that is only `.tc-nav-item` never opens on touch | no | no | major | no | blocker | no | fixed: D30 is the item containing the button; T6 tests the touch path |
| `file()` treats a non-array parser result as an id→data map, so one YAML document becomes ~17 entries and the single-`superRefine` guarantee is lost | no | no | major (its third-party child, A7) | no | major | no | fixed: array-of-one parser |
| `@astrojs/sitemap` writes `sitemap-index.xml`; `robots.txt` and §7 point at a dead `sitemap.xml` | no | no | no | no | no | major | fixed, plus a Search Console owner action |
| The dispatch-only `deploy.yml` on `main` and T7's full one on `astro` collide as add/add at the one merge | no | no | no | no | major | no | fixed: T7 merges `main` into `astro` first |
| `gh workflow run` in the chart workflow needs `GH_TOKEN` as well as `actions: write` | no | no | no | minor | no | no | fixed |
| jQuery 3.6.0 draws `Math.random` at load, so the masthead pick is draw 2 on home; the seed pins the wrong thing | no | no | major | major | no | no | fixed: `seedFor(index, n, draw)` |
| The masthead's callback and pause steps have no representation in the YAML shape or the island; store the lines and derive the steps | Worth exploring (A5) | F5 | no | major | no | no | fixed: D36; schema rule 5 deleted; verified that every hand-counted delete equals the common-prefix derivation across all 16 sequences |
| `blog.intro` as one field drops the `blog-sub-text*` ids that the intro wave, the listing CSS and 15 skins select | no | no | major | no | no | no | fixed: three fields, ids stamped |
| `nav-behavior.js`/`cursor-follow.js` "defer everywhere" adds a sticky header and a cursor follower to three pages that have neither | no | no | minor | minor | major | major | fixed |
| A ~7 KB runtime registry blob and seven `window.__*` globals on all 240 pages, for flags `<html>` already carries | Speculative (A7, defer to §7) | F1, blocker | no | no | no | no | fixed: D32 adopted over the deferral, because the blob is new machinery and the pre-paint script must exist anyway; the fix pass's own verification confirmed all 30 cycler reads have a carrier |
| The theme→`<html>` mapping written twice (Shell template and the 404's `apply.ts`) with one side tested | Worth exploring (A3) | F2 | no | no | no | no | fixed: D33, one pure `themeHtml()` behind three adapters |
| The composition decision re-derived in Shell, `ThemeAssets` and `PickerFab`; `pageType` flag and a per-page-type `Head.astro` ladder; two owners for the FAB | Strong (A1) | F4 | no | no | no | no | fixed: D34, `compose()` returns the whole composition; layouts own their heads |
| Runtime-built dots, ticker properties, copy buttons and a lazy mermaid loader fed by `data-*` bridges for pure functions of build data; the inline `mermaid.initialize` would throw once mermaid loads lazily | Worth exploring (A4, ticker) | F3 | no | major (the throw) | no | no | fixed: D35, all four at build; mermaid emitted only on posts with a diagram |
| Registry fields, slots and schema helpers nothing in spec 1 writes; §11 promises surface §4/§5/§12 never build; `extraPages` has no route that can emit it | no | F8 | no | major | no | major ×2 | fixed: D38 ships `kind`, `layouts`, the fallback and its test; the rest moves to §11's right column with its mechanism |
| `href()` rule 5 needs the post ids, so `themes/paths.ts` depends on content and a typo passes silently | no | F7 | no | no | no | no | fixed: root-absolute is themed unless a static-asset prefix; the fix pass then moved `postIds()` to `src/build/posts.ts` when it caught itself re-introducing the dependency |
| Engine invariants and a `globalThis` side channel in the prose integration; a `dist/` walk would fail on the redirect stubs | no | F9 | no | minor | no | no | fixed: D39, `src/build/checks.ts` over the hook's `pages[]` |
| `gemma4-heretic-ara` deadlocks schema rule 3, the draft gate and §15.4; Q1's resolution changes listing cards and is not in §15 | no | no | major | no | major | no | fixed: explicit `null` excerpt and tags, Q2 extended, §15 amended; the verifier caught §15.4 still promising tag pills, corrected in the follow-up |
| The contact paragraph's `mailto:` link carries `target`/`rel` today; D16's premise that `.calendly-link` exists only once is false (`nav-config.js:59`) | no | no | major | no | no | major | fixed |
| The jobs panel keys off `job-N` ids, not the prose slugs | no | no | no | no | major | no | fixed |
| lexchat has no logo, footer or icon font; a shared utility layout adds chrome | no | no | no | major | no | no | fixed |
| The 404's inline `<style>` must be `is:inline` or Astro scopes and extracts it | no | no | no | minor | major | no | fixed |
| The `?style=` shim yields `/<id>//` on the home page | no | no | no | blocker | no | no | refuted by the fix pass: `'/' + 'brutalist' + '/'` is one slash; the query-parameter drop and the `post.html` shim dropping `?style=` were real and fixed |
| 404 and lexchat load no icon font; the FAB and the dock's glyphs render as boxes | no | no | major | no | no | no | fixed: Font Awesome on both, listed under §15.3 |
| The logo and the vCard are absolute self-links that pass through `href()` and leave the theme | no | no | minor | no | minor | major | fixed: logo `href('/', theme)`, vCard root-absolute |
| §14's "commit `docs/intents/`" publishes the planning corpus at live URLs while Pages is legacy | no | no | no | no | major | no | accepted with mitigation: the consequence stated, an interim `Disallow: /docs/` line |
| Q3's default ("leave `/embedded-swift-agent/`") contradicts intent §4.8, a locked decision | no | no | minor | minor | no | no | fixed: the default is the locked decision |
| T3 cannot run parallel to T2 (dock strings, labels, rule 4 are T2's); T3's "240 pages" needs T5's posts; T1 and T7 serialised for no reason | no | F11 | no | no | major | major | fixed: §12 graph and path scoping |
| `public/blog/posts/assets/*` chart scripts carry visitor-facing strings, one aria-label built from a museum API field, with no prose home | no | no | no | no | no | major | fixed: post bodies and their assets exempted in Q11 and the `CLAUDE.md` rule |
| "Carousel scroll" became "dot 3 clicked"; the wheel guard is untested (intent §4.9) | no | no | minor | no | no | no | fixed: a `mouse.wheel` state, deviation stated |
| Three silent deviations from locked decisions (D5 vs §4.12, D18 vs §4.10, §9 vs §4.9) | no | no | minor | minor | major | no | fixed: stated in the decision row and §16 |

Counts as each reviewer numbered them: architecture 8; thermo-nuclear 13;
fable-1 30 (1 blocker, 8 major, 21 minor) plus 6 third-party corrections;
fable-2 30 (4/7/19); opus-1 50 (4/15/31); opus-2 30 (3/11/16). The fix list
carried 88 items (10 harness, 8 deploy, 24 codebase and parity, 13 structural,
26 minor, 7 dispositions). Of the thirteen structural adoptions, the
architecture pass and the thermo-nuclear review surfaced all thirteen between
them and the correctness reviewers none, which is what the split of axes was
for; of the 42 harness, deploy and parity items, the four correctness
reviewers surfaced every one, the two structural reviews none. One correctness
finding was refuted (the double slash). Two reviewers' "verified correct"
entries were wrong (both read the bootstrap's `appendChild` as end-of-head);
the orchestrator's own spot-check decided. Every finding not fixed carries a
stated acceptance.

## Duplications

- The normaliser's missing theme step was found by three of four correctness
  reviewers (fable-1, fable-2, opus-2), each from the same reading of `href()`
  rule 5 against `nav-config.js`; opus-1 found the allow-list gap instead, and
  the two together are the whole harness problem.
- The `npx`/`prebuild` hole was found by fable-2 and opus-2 from the npm docs;
  the thermo-nuclear review had independently asked to commit the vendor dir
  (F10) for a different reason (a copy step regenerating immutable files), and
  the architecture pass had asked for one vendor table (A8); one disposition
  closed all three.
- The pre-paint palette override was found by three correctness reviewers
  (fable-1, fable-2, opus-1), all quoting `theme-bootstrap.js:727-742`; it is
  the one place the finalizer's verification had made the spec worse.
- `titleSuffix` and the "defer everywhere" claim were found by all four
  correctness reviewers, with severities from minor to major.
- The masthead's choreography was flagged three ways: the architecture pass as
  a seam in the wrong place, the thermo-nuclear review as data in the wrong
  layer, fable-2 as a gap (the island cannot carry the callback step).
- The runtime registry blob was found by both structural reviews with opposite
  dispositions (architecture: defer to the cleanup pass; thermo-nuclear:
  presumptive blocker); the orchestrator took the deletion.
- The unbuilt structural surface was found by the thermo-nuclear review, fable-2
  and opus-2 (twice, as the `extraPages` route and the §11 promises).

## What only one model found

- Fable alone: the `blog-sub-text*` ids (fable-1); lexchat's iframe-only
  chrome (fable-2); `GH_TOKEN` (fable-2); the missing icon font on 404 and
  lexchat (fable-1); the wheel guard left untested (fable-1); the first-run
  requirement before a `--ref astro` dispatch (fable-2); the jQuery draw
  (both Fable reviewers, neither Opus); and the correct head position among
  the correctness axes (fable-2). Every structural finding, by construction:
  the architecture pass and the thermo-nuclear review ran on Fable.
- Opus alone: the three post DOM classes (opus-1); the `job-N` ids (opus-1);
  the `deploy.yml` add/add conflict (opus-1); `sitemap-index.xml` (opus-2);
  the chart assets' strings (opus-2); the planning corpus going live (opus-1);
  the T2→T3 and T3/T5 ticket errors (opus-1, opus-2); the `is:inline`
  extraction (opus-1 at major; fable-2 had it at minor).
- Reported spend: fable-1 252k, fable-2 261k, opus-1 213k, opus-2 198k, plus
  each one's children (fable-1's third-party table alone was 116k). Wall,
  excluding the two rate-limit gaps: fable-1 about 20 minutes over two
  segments, fable-2 about 20, opus-1 22, opus-2 20. Findings per reviewer:
  the two Opus reviewers reported 80, the two Fable ones 60 plus six
  third-party notes; the Opus reports carried the longer "verified correct"
  lists (about 120 and 60 claims), the Fable reports the fuller third-party
  tables.

## The architecture pass (Fable, improve-codebase-architecture)

Adapted for a spec by the orchestrator: the direction was the spec itself
(the skill's documented "how can we make this change easy?" use), two lenses
(the modules the spec proposes; the seams the migration keeps verbatim), no
grilling loop, no type signatures, the HTML report written to the temp dir and
never opened. Eight candidates in the skill's vocabulary. Strong: decide the
composition once in `compose.ts` (the branch was re-derived in three shared
files); the theme links' head position is a `Head` fact, not a Shell fact
(the premise "appended to the end of head" was false on posts). Worth
exploring: one projection from theme to `<html>` rendered at build and
assigned at runtime; the ticker as a build fact; the masthead as lines with
derived steps; one door into prose (`prose.data` bypassed draft marking and
unwritten recording). Speculative: the flag helpers as pass-throughs; one
vendor table. Verdict: "the spec's architecture is in good shape"; the
friction concentrated where D3 froze the scripts before the render/behavior
line was drawn through them. Every candidate carried the deletion test and
the dependency category; none conflicted with an intent §4 decision. All
eight were adopted (the Speculative pair through the thermo-nuclear findings
that superseded them). 193k tokens, 22 minutes, three Explore walks.

## The thermo-nuclear review (Fable, Cursor's prompt verbatim)

The orchestrator's framing: the "PR" is the codebase the spec proposes;
"preserve behavior" is the parity contract; intent §4 decisions are ADRs and
D1-D31 the author's choices; the kept scripts are read to judge whether the
§8 edit list and the invented bridges add spaghetti; findings, not fixes;
verdict against the Approval Bar. Five code walks (all on Fable, no model
override) fed it. Thirteen findings in the skill's priority order. Structural
regressions: F1 the runtime registry blob rebuilding the bootstrap on all 240
pages; F2 the theme-to-HTML mapping implemented twice. Missed simplifications:
F3 runtime-built DOM for pure functions of build data with four `data-*`
bridges; F4 `pageType` on the Shell, a per-page-type `Head.astro` and two
owners for the FAB; F5 choreography in the prose file. Branching: F6
`settle()` as one function with a page-type switch; F7 `href()` rule 5
depending on content. Boundaries: F8 unconsumed structural fields, slots and
helpers; F9 engine invariants in the prose integration. File size: pass (no
file the spec grows crosses 1000 lines; `styles.css` is already 1010).
Modularity: F10 a copy step regenerating immutable vendor files; F11 tickets
serialised. Legibility: F12 dead branches carried through edited files; F13 a
rendering mode on the shared accessor. Verdict: "do not approve as written",
F1-F4 and F7 as presumptive blockers. Every finding was adopted; F8 except
`PickerFab`, which D12 needs; F12 for the files T4 edits. 198k tokens for the
reviewer after its restart, about 325k across the five walks.

## The fix pass, the verification and the follow-up (Opus)

The fix pass, one fresh Opus agent: 88 items, 86 done, two done differently
with reasons that held on the code (the double slash does not reproduce; the
bootstrap terminates the head only on privacy and lexchat). It rewrote every
section, added D32-D39, revised 25 decisions, and caught four things the list
missed: `postIds()`/`postDates()` headed for `themes/paths.ts` (the exact
dependency the `href()` rewrite removes; moved to `src/build/posts.ts`), the
404 indexing an array by string id, `retainBody` being a redundant option
rather than a false claim, and Boxicons having no npm path. Its own delegated
verification confirmed all 30 cycler registry reads have a carrier under D32
and returned four corrections (a second reader of `__THEME_CYCLER_ENABLED`
in `nav-config.js:27`; the neutrals snapshot timing; `.trim()` on `--tc-row-*`
reads; `__PAGE_PATH` never existed). 902 to 1214 lines. 295k tokens, 44 tool
uses, 28 minutes.

The verification, one fresh Opus agent with five read-only checkers: 86 of
88 landed, both "done differently" calls correct, nine items landed with an
error, and a regression sweep of the new text with 32 findings. Blockers:
rule 6 mapped `./` (the Blog nav item on the listing and posts) to `/`; no
mapping for relative stylesheet hrefs (`css/…`, the four sibling sheets, the
per-post assets); the rule unscoped over canonical and OG URLs; bare `#x`
mapped to `/#x` against `href()` rule 2; `/lexchat/` and root-absolute
`/embedded-swift-agent/` missing; the 404's links themed on the old side
only; and §5.4 claiming all 100 ramp properties are `hsla()` when the five
base roles are raw hex (`theme-bootstrap.js:766`). Majors: the default entry
has no `tokens`, so all six neutrals are removals; the `__ACTIVE_STYLE` read
is at `:167`; the post head row said posts gain Calendly CSS and AOS; gemma4
`tags: null` versus "gains tag pills"; `src/build/posts.ts` orphaned by T3's
deliverables; a step reference off by one after B6's insertion; D32's tilt
instruction inverting the two early-return gates. Eighteen minors, mostly
citations. Verdict: the round's blockers resolved, the spec not yet buildable
because of rule 6, one small dispatch scoped with every correct value and
`file:line`. 260k tokens, 34 tool uses, 19 minutes.

The follow-up, one fresh Opus agent on R1-R32 plus two orchestrator
additions (a §16 "resolved ambiguities" line for intent §4.7 versus D13, and
Q14 asking the owner to confirm that reading): 34 done, one done differently
(rule 6's scope widened from stylesheets to `link[href]`, because the
favicons carry relative paths too; accepted). Rule 6 is now one rule: scope
(`a[href]`, `link[href]`, `img[src]`, `iframe[src]`; canonical and every
`og:`/`meta` URL exempt), a 15-row mapping table from every form the site
authors today to its canonical route, then `href(route, theme)` on the old
side with two carve-outs (static-asset targets never take the theme; the 404
skips the theme step entirely). 1214 to 1310 lines. 192k tokens, 85 tool
uses, 13 minutes. The orchestrator's spot-check afterwards: the `./` row maps
to `/blog/`, the 95 + 5 ramp split in five places, `src/build/posts.ts` in
T3, both tilt-gate forms, Q14, the §16 line, the 404 carve-out, no dangling
`D`/`Q`/`T` reference, 0 em dashes, `git status` unchanged.

Where the spec stands: 1310 lines, 39 decisions, 14 owner questions, 10
tickets, `**Status:** final draft, awaiting owner approval; review round 1
applied`. The next step is the owner's grilling session on §13 (Q1-Q14), then
tickets from §12. Decisions the owner should nod at because they deviate from
the intent's wording or from the draft he last saw: D27 (the 404 applies its
theme at runtime, the only runtime theme application), D18 (`CNAME` and
`.nojekyll` at the root, not `public/`), D5 (vendor files committed, three
libraries on CDN), D32 (no runtime registry, seven globals deleted, seven
one-line edits to kept scripts), the Q3 default flipped to intent §4.8's
locked decision, and the interim `Disallow: /docs/` line while `main` is
still served by legacy Pages, which also covers this folder once committed.

## Incidents

Two session rate-limit cut-offs. The first killed the thermo-nuclear reviewer
before it had read anything; a fresh agent ran the identical prompt. The
second killed both Fable correctness reviewers mid-report (fable-1 while
writing its draft, fable-2 while waiting on two children); both were resumed
with their context intact and finished. Three parents parked while their
children ran (the thermo-nuclear reviewer's five walks, fable-1's third-party
table, the fix pass's cycler verification); the children's reports then
routed to the orchestrator, which banked each verbatim under `walks/` and
handed it back by path. No reviewer touched a tracked file; the only file
modified in the round is the spec; no process was left listening; nothing was
installed; no git action was taken. The orchestrator's two decisions against
a reviewer (the head position, the pre-paint override) and its adoption of the
registry deletion over the architecture pass's deferral are recorded in
`orchestrator-notes.md` with the `file:line` that decided each.

## Spend

Reported by the agents that report it: finalizer 284k; architecture 193k;
thermo-nuclear 198k plus 325k across its five walks; correctness 252k, 261k,
213k, 198k plus their children (116k reported for one); fix pass 295k plus
64k; verification 260k; follow-up 192k. About 2.9 million tokens reported,
plus the finalizer's three Opus children and the correctness reviewers'
remaining children, which did not report counts. Active wall clock about
three and a half hours across the round, excluding the two rate-limit gaps.
