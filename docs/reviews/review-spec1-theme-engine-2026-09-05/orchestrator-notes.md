# Orchestrator notes (Fable 5.1), spec 1 review round, 2026-09-05

## Step 2 spot-check (architecture pass, Fable)

Checked candidate 2's premise against `main` @ `0f196d0`: `index.html:26-27` and `blog/post.html:16-17` place `<script src="js/theme-bootstrap.js">` immediately after `css/theme-cycler.css`, with further tags after it (`gsap` script on home, `github-dark.min.css` at `post.html:19`). `theme-bootstrap.js:715-721` runs `document.head.appendChild` synchronously inside that blocking script, so the theme `<link>`s land after the bootstrap tag, not at the end of the parsed `<head>`. The finalizer's D29 ("ThemeAssets last in head", premised on "appends to the end of head") is therefore wrong for home, listing, 404 and posts; on posts the skin sheet precedes `github-dark.min.css` today. Confirmed. No skin sheet contains `.hljs` selectors (grep of `css/themes/*.css`), also as claimed. Kept-file sizes: `theme-cycler.js` 777, `typing-engine.js` 639, `script.js` 437, `featured-carousel.js` 427, `blog-post.js` 201, `blog-listing.js` 179 lines; `css/styles.css` is already 1010 lines.

Disposition: candidates 1-8 are carried to the aggregation step (after the correctness reviewers) rather than dispositioned now; candidate 2 is confirmed and will be in the fix list.

## Step 3 (thermonuclear review, Fable)

The first dispatch died on a session rate limit after only listing the docs; a fresh agent with the identical prompt ran it. Its five code walks (A theme runtime globals, B1 home behavior scripts, B2 blog pipeline, C page heads and script order, D skin CSS dependencies) ran on Fable (no model override, per the reviewer's own note); their reports were routed to the orchestrator and banked verbatim under `walks/`, then handed back to the reviewer by path.

Spot-check against `main` @ `0f196d0`: `__THEME_REGISTRY`/`__THEME_ORDER` are read only at `js/theme-cycler.js:9-10` outside the bootstrap (F1 premise holds); `__restartTypingSequence` has no caller, only the comment at `js/script.js:12` (F12 holds); `--ticker-run`/`--ticker-dur` are written at `js/featured-carousel.js:413-414` and read only at `css/themes/marquee.css:572` and `:584` (F3(b) holds); `EXPAND_VISUAL = false` at `js/featured-carousel.js:17` with the gate at `:421` (F12 holds); only `blog/posts/toolbelt.md` contains a mermaid fence (F3(d) holds). Review file: 180 lines, 28,557 bytes, 0 em dashes. All sampled claims pass.

Disposition: F1-F13 carried to aggregation after the correctness reviewers; F1/F2/F3/F4 overlap architecture candidates 1-5 and 7 (same facts, independently found), which raises confidence in that cluster.

## Step 4 (correctness reviewers)

Dispatched four parallel siblings with identical briefs and fresh context (spec + intent + repo pointers only; no earlier report): two on Fable (`04-correctness-fable-1.md`, `04-correctness-fable-2.md`), two on Opus (`04-correctness-opus-1.md`, `04-correctness-opus-2.md`). Axis: correctness only (false codebase claims, false third-party claims, internal contradictions, behavior-producing gaps, intent compliance); findings with severity, confidence, spec lines and evidence; plus "Verified correct" and "Not verified" lists.

### Step 4 spot-checks (after Opus-1 and Opus-2 landed)

- Opus-1 C-03: `js/theme-bootstrap.js:727-742` reads `sessionStorage['dawson-theme-cycler']` inside the blocking head script and overrides `colors` before the ramp is written, so the palette toy IS applied pre-paint today. The finalizer's verification agent A had reported "no such thing exists today" and the finalizer dropped D4's pre-paint override on that basis; the original spec text was right and the finalized spec is wrong. Confirmed; goes to the fix list as a regression introduced in step 1.
- Opus-1 C-04: `js/theme-cycler.js:594` gates hover on `(hover: hover) and (pointer: fine)`; `:686-688` binds the click on `li.querySelector('.tc-nav-trigger')`. A FAB that is only `.tc-nav-item` has no click path. Confirmed.
- Opus-1 C-01: `blog/post.html:87-93` has `h1.blog-post-title#post-title`, `div.blog-post-meta#post-meta`, `div.blog-post-content#post-content`; 20 of 20 sheets in `css/themes/` reference `.blog-post-content`. Confirmed.
- Opus-1 C-05: `index.html:6` `<title>Dawson Metzger-Fleetwood</title>`, `lexchat/index.html:6` `<title>LexChat</title>`, no suffix; `privacy/index.html:6` has it. Confirmed.
- Opus-2 C1: spec line 694 has the workflow run `npx astro build`; D5 (line 52) copies vendor files "on `prebuild`/`predev`". `npx` does not run npm lifecycle scripts. Confirmed.
- Opus-2 C4: spec line 562 says "`sitemap.xml` generated"; `@astrojs/sitemap` writes `sitemap-index.xml` + `sitemap-0.xml`. Confirmed from the integration's documented behavior.

## Step 4 results and aggregation

All four correctness reviewers landed (both Fable reviewers died once on a session rate limit and were resumed with their context intact; reviewer 1's third-party verification child re-sent its table to it directly and a copy is banked under `walks/`). Totals as reported: fable-1 1 blocker / 8 major / 21 minor (+6 third-party notes); fable-2 4 / 7 / 19; opus-1 4 / 15 / 31; opus-2 3 / 11 / 16. Overlap was high on the load-bearing items (normaliser theme prefix, allow-list mechanism, `prebuild` under `npx`, pre-paint palette override, head position, title suffix, picker trigger, `file()` splitting), which is the confidence signal the parallel design is for.

Aggregation written to `05-fix-list.md`: 10 harness items (A), 8 deploy items (B), 24 codebase/parity items (C), 13 structural adoptions (D), 26 minor corrections (E), 7 dispositions (F). Orchestrator calls that went against a reviewer: opus-1's "ThemeAssets-last is the parity position" rejected on the head-order spot-check; the finalizer's verification agent A ("no pre-paint override today") rejected on `theme-bootstrap.js:727-742`; thermo F1 (delete the runtime registry blob) adopted over arch A7's "defer to §7", because the blob is new machinery and the pre-paint script must exist anyway for the palette override; thermo F10 (commit `public/vendor/`) adopted as the fix for the `npx astro build`/`prebuild` blocker; thermo F8 adopted except for `PickerFab`, which D12 needs.

## Step 5 (fix pass, Opus)

Dispatched one fresh Opus agent with the spec, the intent, the fix list as its instruction set, and the raw reports as evidence by finding id. Only the spec may change. Pre-fix snapshot: `/tmp/spec1-reviews/spec-finalized.md` (902 lines, 86,165 bytes).

### Step 5 result and spot-check

Fix pass complete: 902 → 1214 lines, 86,165 → 128,089 bytes; 86 items done, 2 done differently (C18: the `/<id>//` premise from fable-2 C-04 does not reproduce, `'/' + 'brutalist' + '/'` is one slash, so only the query-preservation and shim-forwarding parts were real; E2: "the bootstrap script terminates the head" holds only for privacy and lexchat). Orchestrator re-checked on the file: 0 em dashes; header status updated; D32-D39 present at lines 81-88; the stale-claim greps match the agent's counts (`npx astro build` 1, `prebuild` 1, `sitemap.xml` 5, `__PAGE_PATH` 1, `seven globals` 0, `data-tech` 1, `buildTickerRun` 2, `Redirect.astro` 0); `PalettePrepaint.astro` and `StyleQueryShim.astro` in the §3.1 tree; the post DOM contract carries all three classes; `titleSuffix` scoped; a script over every `D`/`Q`/`T` token found no dangling reference; `git status --short` unchanged. Post-fix snapshot: `spec-after-fix.md`.

## Step 6 (fix-landed verification, Opus)

Dispatched one fresh Opus agent with the pre/post snapshots, the fix list, the fix agent's per-item report (as claims to check), the raw reports as evidence by finding id, and the walks. Tasks: per-item landed/partial/not-landed/landed-with-error, judge the two "done differently" items and the four beyond-the-list changes against the code, regression sweep of the rewritten sections, verdict with anything still needing a change ranked by severity. Report to `06-fix-verification-opus.md`.

### Step 6 result and disposition

Verifier: 86/88 items landed; C18 and E2 "done differently" judged correct on the code (the `/<id>//` premise does not reproduce; the bootstrap terminates the head only on privacy and lexchat); 9 items landed with an error; regression sweep found 32 residual findings, R1-R7 blockers (six in §9 normaliser rule 6: `./` is the Blog nav item and maps to `/blog/` not `/`; no mapping for relative stylesheet hrefs; the rule is unscoped and would rewrite canonical/OG URLs; bare `#x` mapping contradicts `href()` rule 2; `/lexchat/` and root-absolute `/embedded-swift-agent/` missing; the 404's links get themed on the old side only; plus §5.4 claiming all 100 ramp properties are `hsla()` when the 5 base roles are raw hex, `theme-bootstrap.js:766`), R8-R14 majors (default entry has no `tokens` so all six neutrals are removals; `__ACTIVE_STYLE` read is at `:167`; §6.2 post row wrongly says posts gain Calendly CSS and AOS; gemma4 `tags: null` vs "gains tag pills"; `src/build/posts.ts` orphaned by T3's deliverables; §10 step reference off by one; D32's tilt-gate instruction inverts the two early-return gates), R15-R32 minors (citations, wording). Verdict: the round's blockers are resolved; the spec is not yet buildable because of R1-R7; one small dispatch scoped by the verifier.

Disposition: the owner's process ("no second review round; a new problem is one new dispatch on Opus") applies. One follow-up Opus dispatch applies R1-R32 exactly as the verifier specified (every correct value is given with `file:line`), plus a §16 line recording the intent §4.7 utility-page reading (D13). No further review round; the orchestrator spot-checks the rule 6 rewrite, the ramp sentence, R12 and R14 directly. This is one step beyond the owner's literal sequence and is reported as such.
