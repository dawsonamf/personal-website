# Step 5: fix pass (Opus, single agent) — report verbatim

Applied `05-fix-list.md` to the spec. Pre-fix snapshot `spec-finalized.md` (902 lines, 86,165 bytes); post-fix snapshot `spec-after-fix.md` (1214 lines, 128,089 bytes). One delegated verification (Explore, "Verify cycler data contract", banked under `walks/`) confirmed the registry deletion is complete; its four corrections were folded in before this report.

---

## 1. Per fix-list item

**A. Parity harness (blockers)**
- **A1** done — normaliser rule 6 now maps each old form to its canonical route *then* applies `href(route, theme)`; added bare `#x`, `index.html`/`./index.html`/`../index.html`/`./`, the two `https://www.dawsonamf.com/…` forms, and the Boxicons CDN URL.
- **A2** done — new step 8 exception table keyed one-to-one to §15 (6 rows); checks 1-3 defined as "equal after the table"; comment nodes dropped in step 2; "harness green" in T4/T5/T6/T8 redefined.
- **A3** done — check 3 excludes `--prose-*`, matching step 7.
- **A4** done — `seedFor(index, n, draw)`; masthead is draw 2 on home (jQuery's `expando`), draw 1 on the listing; chart-asset posts noted as inconsequential.
- **A5** done — sticky-nav state is 800→500.
- **A6** done — settle step 2 keeps "stable for 500 ms", count dropped, `loadAllFonts` skip explained.
- **A7** done — T3 captures the reference before `theme-cycler.js` boots; real inline-style order stated (interleaved per role, `hsla(H,S%,L%,A%)`, no spaces, percentage alpha); step 7 compares a sorted declaration map.
- **A8** done — palette-toy matrix state (shuffle, navigate, assert first paint, reload) **and** the manual-QA line.
- **A9** done — `mouse.wheel` state on the carousel track added; deviation from intent §4.9 stated in §16.
- **A10** done — sentence added: the old side needs network for eleven live CDNs, so check 4 depends on their availability; the abort list covers non-deterministic APIs only.

**B. Deploy and cutover (blockers)**
- **B1** done — `public/vendor/` committed, `prebuild`/`predev` and sha256 dropped, `vendor-static/` folded in, one `scripts/vendor-map.mjs` with three consumers; D5 and §8 rewritten.
- **B2** done — `/sitemap-index.xml` throughout, `robots.txt` points at it, `/sitemap.xml` is a dead URL row in §6.4, Search Console resubmission is §14 item 7.
- **B3** done — T7 merges `main` into `astro` and edits the arriving file; stated in §10 step 2 and T7.
- **B4** done — `env: GH_TOKEN: ${{ github.token }}` beside `permissions: actions: write`.
- **B5** done — `type: boolean, default: false`, the `if:` guard shown in the YAML sketch, `-F deploy=false` everywhere.
- **B6** done — §10 step 3 runs it once on `main` first; §14 item 5 covers the owner action.
- **B7** done — `source` documented-optional (422 fallback dropped), `actions: write` documented, both dispatch events named as exceptions, step 5 labelled unverified.
- **B8** done — consequence stated in §14 item 3 and D22, with the interim `Disallow: /docs/` line.

**C. False claims and parity gaps**
- **C1** done — pre-paint palette override restored as `PalettePrepaint.astro`; D4 rewritten; citations corrected.
- **C2** done — §6.2 now has a per-page head table; "theme links are not last in `<head>`" with the privacy/lexchat exception; D29 no longer owns the head.
- **C3** done — full post DOM contract including all three class names, with the 20/20 sheet fact.
- **C4** done — suffix on blog, post, privacy, 404 only; home and lexchat spelled out.
- **C5** done — D30 is `.tc-nav-item` *containing* `button.tc-nav-trigger`; T6 tests the touch path.
- **C6** done — chose `/vendor/fontawesome/css/all.min.css` on 404 and lexchat, reason given (one dock component on all six page types); listed in §15.3 and Q4.
- **C7** done — "defer on home, listing and post; absent from privacy, 404, lexchat" with citations.
- **C8** done — three prose fields `blog.intro.p1/p2/p3`, ids stamped by `BlogListing.astro`.
- **C9** done — resolved via D36: island carries derived steps, clients splice their callback.
- **C10** done — `mailto:` branch added; `.calendly-link` on the social anchors too.
- **C11** done — D17 keeps `data-job`/`id="job-{i+1}"` positional; prose `id` is a content key.
- **C12** done — §6.3 splits the three pages; lexchat is the iframe only.
- **C13** done — `<style is:inline>` named as the single exception.
- **C14** done — array-of-one parser in D7 and rule 6.
- **C15** done — `process.exit(1)` removed, source-verified behavior stated, T0 keeps the check.
- **C16** done — `compressHTML` and `prerenderConflictBehavior` wording corrected.
- **C17** done — explicit `null` excerpt/tags, §15.4 gemma4 JSON-LD clause dropped, Q2 extended, Q1 card changes and gemma4 pills added to §15.
- **C18** *done differently* — applied the pinned expression, query-preservation and `post.html` `style` forwarding, plus the T3/§10 checks; but the `/<id>//` premise does not reproduce (`'/' + 'brutalist' + location.pathname` on `/` is `/brutalist/`, one slash), so the spec presents the explicit `/` branch as making the root case obvious rather than as a bug fix. The real defects (dropped query parameters, dropped `?style=` on the shim) are fixed as written.
- **C19** done — logo authored `href('/', theme)`, vCard root-absolute, both mapped by rule 6, logo listed in §15.1.
- **C20** done — §15.11.
- **C21** done — clear-on-switch stays, in D11 and §5.5.
- **C22** done — T3 is 16 × 4 + `404.html`; 240 lands in T5.
- **C23** done — T2 → T3 sequential in the graph and in T3's deliverables.
- **C24** done — exemption in §4.3's `CLAUDE.md` rule and Q11, with the museum-API aria-label called out.

**D. Structural adoptions** — all done: D1→spec **D32**, D2→**D33**, D3→**D34**, D4→**D35**, D5→**D36**, D6→**D37**, D7→§6.1 rule 5 + D31, D8→**D38**, D9→**D39**, D10→§9 + D20, D11→§8 + D3, D12→§12 graph and paths (chart-workflow patch moved to T7, `astro.config.mjs` added to T6, `public/` move assigned to T3), D13→§7 render-once.

**E. Minor corrections** — E1, E3-E17, E19-E26 all done. **E18** done (Q2 default says "added to the sitemap"). **E2** *done differently*: the six OG/Twitter tags are applied as written, but "the bootstrap `<script>` terminates today's head" is true only for privacy and lexchat — I re-read all six heads and home/listing/post/404 carry further tags after it, matching the orchestrator's own spot-check, which overrides the reviewer.

**F. Dispositions** — F1 done (D32 adopted now), F2 done (§6.2 states the real position), F3 done (§17 item 11 records the finalizer's error), F4 done (B8 mitigation, owner's ask kept), F5 done (§15.11), F6 done (D38 keeps `PickerFab`), F7 done (D10: budgets documented, not linted).

**Verification corrections** (from the delegated cycler check, all four applied): `nav-config.js:27` named as the second `__THEME_CYCLER_ENABLED` reader with the nav item build-rendered; neutrals snapshot pinned to before the first `applyDerivedNeutrals()` write, with `--code-bg`/`--code-fg` as removals so the baseline is four values plus two; `.trim()` pinned on every `--tc-row-*` read, with the `:216` raw-compare reason; D32's seven globals corrected and `__PAGE_PATH` named as this spec's own phantom.

## 2. Sections rewritten and decisions

Rewritten: header, §1, §2 (whole table), §3.1-3.3, §4.1-4.3, §5.1-5.5, §6.1-6.5, §7, §8, §9, §10, §11, §12, §13, §14, §15, §16, §17.

Added: **D32** no runtime registry or theme globals (`<html>` already carries every flag a script reads); **D33** one `themeHtml()` projection (the mapping was otherwise written twice with only one side tested); **D34** compose once, layouts own their heads (the branch was re-derived in seven places); **D35** build-time facts stay at build (each was a `data-*` bridge for a pure function of build data); **D36** masthead stores lines, derives steps (a JSON island cannot carry the callback step); **D37** one door into prose (`prose.data` otherwise bypasses draft marking and unwritten recording); **D38** the structural surface actually shipped (a desk-check is not shipped surface); **D39** engine invariants in `src/build/checks.ts` (they do not belong in the prose integration).

Revised: D1, D2, D3, D4, D5, D7, D10, D11, D12, D13, D14, D15, D16, D17, D18, D20, D21, D22, D24, D26, D27, D28, D29, D30, D31.

## 3. Beyond the fix list

- `postDates()`/`postIds()` were headed for `themes/paths.ts`, which would have re-introduced the exact content dependency the `href()` rewrite removes. Moved both to `src/build/posts.ts`; §3.1, §3.2, §3.3 and §6.1 updated.
- The 404's runtime apply indexed an array by string id (`THEMES[id]`); changed to `THEMES.find((t) => t.id === id)`.
- `retainBody` is not a false claim (it exists and defaults to `true`), so rather than "correcting" it I dropped the redundant option and stated that `entry.body` holds the raw Markdown; T0 item (g) reworded.
- D5's Boxicons row has no npm path: installing that package pulls six runtime dependencies including React 16, so §8 now says its files are committed from the pinned CDN build and the row carries only the public path and CDN URL.

## 4. Size

Before 902 lines / 86,165 bytes; after **1214 lines / 128,089 bytes**. Em dashes **0 before, 0 after**. Growth is concentrated in §2 (8 new decisions), §6.2 (the per-page head table C2 requires), §9 (the exception table and rule 6), §12 (ticket graph and path scoping) and §11.

Stale-claim greps, every remaining hit being the corrected form: `last in <head>` 1 ("are **not** last"), `seven globals` 0, `__THEME_REGISTRY` 2 (both naming it as deleted), `__PAGE_PATH` 1 ("no `__PAGE_PATH` is introduced"), `npx astro build` 1 ("`npm run build` rather than"), `prebuild` 1 ("no `prebuild`/`predev` hook"), `sitemap.xml` 5 (all dead-URL/never-writes/resubmit), `no pre-paint override` 0, `retainBody` 0, `any .tc-nav-item element is a trigger` 0, `Redirect.astro` 0, `process.exit(1)` 2 (both "no fallback needed"), `data-tech`/`buildTickerRun`/`data-slide-label`/`data-copy-label` all in deletion lists, `extraPages` 2 (not-built list, "needs no knowledge of"), `--tc-z` 1 and `fragments(n)` 2 (not-built list / §11 right column), `vendor-static` 1 ("no separate"), `titleSuffix` scoped to "blog, post, privacy and 404 only". Also: 11 markdown tables, 0 malformed; 39 D, 13 Q, 10 T defined with **no dangling references**.

## 5. Hygiene

`git status --short` shows exactly six untracked entries: the five `docs/*prototype*.html` files and `docs/intents/`. No git actions taken. One file modified: `/Users/dawsonamf/Desktop/dax/personal-website/docs/intents/2026-09-05-theme-engine-rewrite/spec-1-migration-engine-parity.md`. Scratch under `/tmp/spec1-fix/` only. No installs, no servers, no browser; nothing listening on 8781/8782/8765 and no background jobs.
