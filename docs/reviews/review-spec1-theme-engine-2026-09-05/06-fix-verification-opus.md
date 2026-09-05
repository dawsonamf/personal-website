# Step 6: fix-landed verification (Opus), spec 1 review round, 2026-09-05

Inputs: `spec-finalized.md` (pre-fix, 902 lines) vs `spec-after-fix.md` (post-fix, 1214 lines,
byte-identical to the live
`docs/intents/2026-09-05-theme-engine-rewrite/spec-1-migration-engine-parity.md`, confirmed by
`diff -q`); `05-fix-list.md` as the instruction set; `05-fixpass-opus-report.md` as claims to check;
the raw reviewer reports and `walks/` as evidence by finding id.

Method: `diff -u` between the two snapshots (1543 lines) to locate every change, a full read of the
post-fix spec, and five parallel read-only code-verification agents (all pinned to Opus, matching
this orchestrator) over §8's edit list, §5.4/§5.5, §6.2/§6.3, §9's rule 6, and §12/§3.1/§10. Every
`file:line` below was opened; claims marked "verified" were checked against `main` @ `0f196d0`.

Headline: **86 of 88 items landed; 2 judged correct as "done differently"; 9 landed with an error
that still needs correcting.** The review round's filed blockers (A1-A10, B1-B8) are all addressed.
But normaliser rule 6, the one thing A1 was supposed to fix, is still incomplete and mis-scoped in
six ways, one of them a wrong mapping rather than a missing one. That plus a false claim about the
colour ramp is what a single follow-up dispatch should fix.

---

## 1. Per-item status

### A. Parity harness

| id | status | note |
|---|---|---|
| A1 | **landed with error** | Rule 6 is now map-then-`href(route, theme)` and gained the listed forms, but `./` is mapped to `/` on the fix list's own false premise that it is a logo form. It is the **Blog** nav item and resolves to `/blog/` (R1). Five further rule-6 gaps: R2-R6. |
| A2 | landed | Step 8 exception table, 6 rows keyed to §15; checks 1-3 defined "after the table" (L797-799); comment nodes dropped in step 2 (L877); "harness green" redefined in T4/T5/T6/T8 (L1034). |
| A3 | landed | Check 3 excludes `--prose-*` (L804-805), matching step 7. |
| A4 | landed | `seedFor(index, n, draw)`; draw 2 on home, draw 1 on the listing; `index.html:31` (jQuery) vs `:38` (typing-engine) verified exact; chart-asset posts noted as inconsequential (L839-846). |
| A5 | landed | Sticky-nav state is 800→500 (L819). |
| A6 | landed | Count dropped, "stable for 500 ms" kept, `loadAllFonts` skip explained (L859-861). |
| A7 | **landed with error** | T1 captures the reference before the cycler boots (L1040) ✓; step 7 declaration-map compare ✓; interleaving verified ✓. But "+ 5 base … as `hsla(H,S%,L%,A%)`" is false: the 5 base roles are raw hex (R7). |
| A8 | landed | Palette-toy matrix state (shuffle, navigate, assert first paint, reload) at L821-822 **and** the manual-QA line at L920-921. |
| A9 | landed | `mouse.wheel` state on the track (L818-819); deviation from intent §4.9 stated in §9 and §16. |
| A10 | landed | Sentence at L828-831. The count "eleven" undercounts the matrix (R27). |

### B. Deploy and cutover

| id | status | note |
|---|---|---|
| B1 | landed | `public/vendor/` committed, `prebuild`/`predev` and sha256 gone, `vendor-static/` folded in, one `scripts/vendor-map.mjs` with three named consumers; D5 and §8 rewritten (L54, L781-791). |
| B2 | landed | `/sitemap-index.xml` throughout; `robots.txt` points at it; dead-URL row in §6.4 (L682); §14 item 7. |
| B3 | landed | §10 step 2 and T7 both say merge `main` into `astro` first and edit the arriving file. (The cross-reference to the merge step is now off by one, R13.) |
| B4 | landed | `env: GH_TOKEN: ${{ github.token }}` beside `permissions: actions: write` (L951-952). Verified today's `refresh-chart-data.yml` has neither, and has only `permissions: contents: write`. |
| B5 | landed | `type: boolean, default: false`, the `if:` guard in the YAML sketch, `-F deploy=false` everywhere (L935-949). |
| B6 | landed | §10 step 3 runs it once on `main`; §14 item 5 is the owner action. |
| B7 | landed | 422 fallback dropped, `source` documented-optional, `actions: write` documented, both dispatch events named, step 5 labelled **Unverified** (L970-971). |
| B8 | landed | Consequence in §14 item 3 and D22, with the interim `Disallow: /docs/` line. |

### C. False claims and parity gaps

| id | status | note |
|---|---|---|
| C1 | landed | Pre-paint override restored as `PalettePrepaint.astro`; D4 rewritten around `theme-bootstrap.js:727-742` (verified: reads `sessionStorage['dawson-theme-cycler']`, replaces all five roles at `:737`, ramp built at `:764-774`); §17 item 11 records the finalizer's error. Citation slips are under E1. |
| C2 | landed | §6.2 per-page head table; "Theme links are **not** last in `<head>`"; privacy/lexchat exception; D29 explicitly no longer owns the head. Verified on all six pages: bootstrap sits immediately after `theme-cycler.css` everywhere, and terminates the head only on privacy (`:18`/`</head>:19`) and lexchat (`:11`/`:12`). |
| C3 | landed | Full post DOM contract with all three class names and the 20/20 sheet fact (L722-726). |
| C4 | landed | Suffix on blog, post, privacy, 404 only. All six titles verified verbatim. |
| C5 | landed | D30 is `.tc-nav-item` **containing** `button.tc-nav-trigger`; `theme-cycler.js:686-688` and `:594` verified; T6 tests the touch path. |
| C6 | landed | `/vendor/fontawesome/css/all.min.css` on 404 and lexchat, reason given, listed in §15.3 and Q4. Verified: zero icon-font references in either page today, head or body. |
| C7 | **landed with error** | The defer/absence claim is right (verified on all six pages), but "which load only the cycler" is false for today: all three also load `theme-bootstrap.js` (`privacy/index.html:18`, `404.html:16`, `lexchat/index.html:11`). True only after the bootstrap is deleted (R21). |
| C8 | landed | Three prose fields `blog.intro.p1/p2/p3`, ids stamped by `BlogListing.astro` (L737-741). |
| C9 | landed | Resolved via D36: island carries derived steps, clients splice their callback. |
| C10 | landed | `mailto:` branch in D16; `.calendly-link` on the social anchors (`nav-config.js:59` verified). |
| C11 | **landed with error** | D17 correctly keeps `data-job`/`id="job-{i+1}"` positional, but cites `script.js:273-302`; `initJobsMenu` is `:271-370` and the keying is at `:344`/`:355` (R16). |
| C12 | landed | §6.3 splits the three pages; lexchat is the iframe only; privacy's absolute logo and the 404's `/` logo both verified. |
| C13 | landed | `<style is:inline>` named as the single exception (L654-656). |
| C14 | landed | Array-of-one parser in D7 and §4.1 rule 6. |
| C15 | landed | `process.exit(1)` removed, source-verified behavior stated, T0 keeps the confirmation. |
| C16 | landed | `compressHTML` and `prerenderConflictBehavior` wording corrected (D2). |
| C17 | **landed with error** | `excerpt: null`/`tags: null` ✓, Q2 extended ✓, Q1 card changes in §15.4 ✓, but §15.4 and Q2's own text still say gemma4 "gains the tag pills it lacks today", which `tags: null` cannot produce (R11). The contradiction is inherited verbatim from fix-list C17, which asserted both. |
| C18 | **done differently, reasoning correct** | Verified: `'/' + 'brutalist' + location.pathname` on `/` is `/brutalist/`, one slash; fable-2 C-04's `/<id>//` premise does not reproduce. The two real defects (dropped query parameters, `?style=` dropped by the `post.html` shim) are fixed as written, and the explicit `/` branch is now presented as making the root case obvious rather than as a bug fix (L512, L521-522). T3's done-when and §10 step 8 both carry the checks. Agreed. |
| C19 | landed | Logo authored `href('/', theme)`, vCard root-absolute, both mapped by rule 6, logo in §15.1. Verified `index.html:57`, `privacy/index.html:25`, `nav-config.js:54`. |
| C20 | landed | §15.11 (though the 404's logo is still uncovered, R6). |
| C21 | landed | Clear-on-switch stays, in D11 and §5.5; `theme-cycler.js:275` verified. |
| C22 | landed | T3 is 16 × 4 + `404.html`; 240 lands in T5. Arithmetic checks: 16 × 15 page types = 240. |
| C23 | landed | T2 → T3 sequential in the graph and in T3's deliverables. |
| C24 | landed | Exemption in §4.3's `CLAUDE.md` rule and Q11, with `underviewed-art.js:295` called out. |

### D. Structural adoptions

| id | spec | status | note |
|---|---|---|---|
| D1 | D32 | **landed with error** | All seven globals with correct lines (verified: `:8`, `:639`, `:640`, `:700`, `:646`, `:654`, `:664`, and that is the complete set); `__PAGE_PATH` named as this spec's phantom (zero repo hits, confirmed). But "the five tilt gates read `!…hasAttribute('data-no-tilt')`" inverts two of the five (R14). |
| D2 | D33 | landed | `themeHtml(theme, colors?)`, pure, `ramp.ts` its only helper, three adapters, one byte-equality fixture; the cycler's ramp copy stays with the reason given. |
| D3 | D34 | landed | `compose()` over the full union incl. utility pages; layouts own their heads; `Meta.astro` spine; `Head.astro` ladder gone; Shell's `pageType` prop gone; table test replaces the four-row prose table. |
| D4 | D35 | landed | Dots, ticker properties, copy buttons, conditional mermaid all at build; `buildTickerRun`, `data-tech`, `addCopyButtons`, `data-copy-label`, `data-slide-label` and the `--ticker-run` settle wait all in deletion lists. |
| D5 | D36 | landed | Lines + derived steps + spliced callback; schema rule 5 deleted; T2 proves the derivation against today's 16 literal arrays. |
| D6 | D37 | landed | `prose.data` size maps typed `never`; `prose.paragraphs()` replaces the `{ paragraphs: 'br' }` option; chip/tag items `string \| { draft }`. |
| D7 | §6.1 r5 + D31 | landed | Prefix list present and slightly extended (`/sitemap-0.xml` added); no content import into `themes/paths.ts`; `harness/urls.ts` derived from `THEME_IDS` × page list through `href()`; one `postIds()` helper. |
| D8 | D38 | landed | Every unbuilt item moved to §11's right column with its mechanism and consumer; theme-only pages are page files, no registry field; `PickerFab` retained. |
| D9 | D39 | landed | `src/build/checks.ts`, named pure functions, `pages[]` only, no `globalThis`, T0 keeps the shared-instance check. |
| D10 | §9 + D20 | landed | Four generic waits; per-page predicates in `harness/sentinels.ts`. |
| D11 | §8 + D3 | **landed with error** | Dead-code list present and each symbol verified dead, but `applyExpandVisualShell` is cited `:94-185`; it is `:94-120` (`:122-185` is `setupExpandVisual`) (R15). |
| D12 | §12 | **landed with error** | Graph and scoping mostly correct: chart patch moved to T7 (stated in both directions), `astro.config.mjs` in T6, `public/css/theme-cycler.css` in T6, the `public/` move owned by T3. But "T5 and T6 … on disjoint paths" is false (R24) and `src/build/` is in no ticket's paths (R12). |
| D13 | §7 | landed | "Each post body is rendered **once**, in `getStaticPaths`, and passed to the route as a prop" (L713-714). |

### E. Minor corrections

| id | status | note |
|---|---|---|
| E1 | **landed with errors** | Most citations corrected, but two corrections went wrong and one new wrong citation appeared: `theme-cycler.js:277` should be `:276` (R17); `restore()` `:141-154` should be `:142-154`, and boot `:748-754` is a slice of `boot()` (R18); `__ACTIVE_STYLE` "read at `:273`" should be `:167` (R9). Also `:693-696` (R19), `:214-221` (R20), `:675-678`, `:703-706`, `:370-386` (R30). Verified correct: `isReload()` `:126-131`, `persist()` `:132-141`, `STYLE_KEY` `:125`, `STEPS` `:671`, wipes `:687`/`:730-731`, `blog-post.js:8-15` + attribute order, `parsePostDate` `:50-54` + conditional JSON-LD, `blog-listing.js:38-88`. |
| E2 | **done differently, reasoning correct** | Verified across all six heads. The bootstrap `<script>` terminates the head only on privacy and lexchat; home, listing, post and 404 all carry further tags after it (13, 9, and 7 nodes, and the `.nf-*` `<style>` respectively). The six OG/Twitter tags on home and listing are exactly `og:type`, `og:title`, `og:description`, `og:url`, `og:image`, `twitter:card` at `index.html:11-16` and `blog/index.html:11-16`. The fix agent is right and the reviewer wrong; this matches the orchestrator's own spot-check, which overrides. |
| E3-E8 | landed | `.tc-toggle` 12+4+`theme-base.css:81` (D12); five `.privacy-*`/`.nf-*` sheets (D13); `blueprint.css:652` "FIG. " (D14); `picker.roles` `bg` (L285); seven about-objects bullets (L247); YAML rule 8 with the quoting rule stated (L319-322) and the header comment (L206). |
| E9-E14 | landed | Sizes-per-slot paragraph (L324-329) replaces the contradiction; `RESERVED` includes `12years` (L385); inactive skins' line ranges + git-history pointer (L409-413); sitemap `serialize` note (L161-164); storage-key split (L420-422, D28); §15.8 + check 5 highlight.js. |
| E15-E20 | landed | `linkTarget2` fallback reproduced (L256-258); T6 unit test (L1045); `docs/planned-posts/` = 3 drafts + the patch (verified: `ai-job-market.md`, `color-randomizer.md`, `sample-efficiency.md`, `ai-job-market-listing.patch`); Q2 "added to the sitemap"; Q3 default = intent §4.8 locked, with §3.1/§6.4/§6.5/D7/`RESERVED` all updated; three deviations stated in both the decision row and §16. |
| E21-E26 | landed | `site.logo` (L210); `Skills` in §3.1 and T4; `harness/scripts.ts` in the tree; 36 `registerLanguage` = 34 + 2 sub-grammars; Node/Playwright-GC wording; mermaid IIFE + §17 item 6 erratum withdrawn; the 404 stamps `data-style` and the active-row marker (L526-530); §14 gains the Search Console item (7) and carries the `robots.txt` line inside item 3. |

### F. Dispositions

F1-F7 all landed as reported. Spot-checked: F2 (§6.2 states the real head position, and it is the
position the code produces), F3 (§17 item 11), F5 (§15.11), F6 (D38 keeps `PickerFab`), F7 (D10
documents budgets, does not lint them).

### Verification corrections (the fix agent's four)

| # | status | note |
|---|---|---|
| 1. `nav-config.js:27` as the second `__THEME_CYCLER_ENABLED` reader | **landed, correct** | Verified: exactly two readers repo-wide, `theme-cycler.js:5` and `nav-config.js:27`; definition at `theme-bootstrap.js:8`. |
| 2. Neutrals snapshot before the first `applyDerivedNeutrals()` write; `--code-bg`/`--code-fg` as removals; "four values plus two" | **landed with error** | The four-plus-two arithmetic holds for the 15 non-default entries (each defines all four `--jobs-menu-*`/`--neutral-gray` tokens), but the `default` entry (`theme-bootstrap.js:16-21`) has **no `tokens` key at all**, so all six of `DERIVED_NEUTRALS` (`:208`) resolve to `removeProperty` there (R8). The cited range `:214-221` is also wrong (R20) and the stated call chain is not a real call edge (R31). |
| 3. `.trim()` on every `--tc-row-*` read, with the `:216` raw-compare reason | **landed, correct** | `:216` verified as a raw lowercased `some()` compare. No `--tc-row-*` read exists in JS today (the properties are write-only into CSS), so the requirement is genuinely new and correctly framed. |
| 4. D32's seven globals corrected; `__PAGE_PATH` named as this spec's own phantom | **landed, correct** | All seven line numbers verified exact, and seven is the complete set. `__PAGE_PATH` has zero occurrences outside the spec's own note. |

### Beyond the fix list (the fix agent's four)

| # | status | note |
|---|---|---|
| 1. `postDates()`/`postIds()` moved to `src/build/posts.ts` | **partial** | Right call: putting them in `themes/paths.ts` would have re-introduced the content dependency `href()`'s rewrite removes. §3.1, §3.2, §3.3 and §6.1 were updated, but **T3's deliverables still read "`paths.ts` (`themeParams`, `href` + `postIds`)"** (L1042), directly contradicting §6.1's "deliberately not in `themes/`", and `src/build/` appears in no ticket's paths (R12). |
| 2. 404 runtime apply uses `THEMES.find((t) => t.id === id)` | **landed, correct** | `THEMES` is an array (§5.1 L405), so `THEMES[id]` was a real bug. |
| 3. `retainBody` dropped rather than "corrected"; `entry.body` holds raw Markdown | **landed** | §7 L700-701 and T0 item (g) both reworded. Sound: deleting a redundant option is a smaller change than documenting a non-error. |
| 4. Boxicons row carries no npm path | **landed** | Consistent across §8 (L785-787), D5 (L54) and §14 item 2 (L1101-1103). |

---

## 2. Regression sweep of the new text

Mechanical checks first, all pass: **0 em dashes**; **39 D, 13 Q, 10 T defined, 0 dangling
references** in either direction; **11 markdown tables, 0 malformed rows** (counting only unescaped
pipes; the four apparent mismatches are `\|` inside inline code in D2, D7, D17, D37). The fix
agent's stale-claim grep counts reproduce. §3.1's file tree makes no wrong claim about a
file that exists today (every path checked, including `CNAME`, `.nojekyll`, `robots.txt`,
`sitemap.xml`, the 20 files in `css/themes/`, the 11 posts, `12years/`'s three files and
`embedded-swift-agent/`'s four).

Findings below are what still needs a change, ranked.

### Blockers: the harness cannot pass as written

**R1. §9 rule 6 maps `./` to `/`. It is the Blog nav item and resolves to `/blog/`.**
Severity blocker · confidence high · spec L888-889.
Evidence: `js/nav-config.js:12` and `:18`, `{ label: 'Blog', href: isSubpage ? './' : 'blog/' }`.
On the listing and on every post this renders into two desktop menus and one mobile menu, so three
hrefs per page. The logo on those pages is `../index.html` (`blog/index.html:52`,
`blog/post.html:78`), never `./`. Rule 6 inherits fix-list A1's parenthetical "`./` (logo)", which
is false.
Correct statement: `./` → `/blog/`. Group it with `blog/` and `../blog/`, not with the logo forms.
This is a wrong mapping, not a missing one: left as is, DOM equality fails on the listing and all 11
posts for all 16 themes.

**R2. §9 rule 6 has no mapping for any relative stylesheet href.**
Severity blocker · confidence high · spec L885-895.
Evidence: the old side emits `css/styles.css`, `css/mobile-styles.css`, `css/featured-carousel.css`,
`css/theme-cycler.css` (`index.html:23-26`); the `../css/…` forms on the listing, post, privacy and
lexchat; and the siblings `blog-listing-styles.css` (`blog/index.html:25`), `blog-styles.css`
(`blog/post.html:15`), `privacy-styles.css` (`privacy/index.html:16`), `lexchat-styles.css`
(`lexchat/index.html:9`), plus per-post `styles:` frontmatter rendered as `posts/assets/*.css`
(`blog-post.js:129-133`, e.g. `metr-doubling`, a matrix page). The new side is root-absolute
everywhere: `href()` throws on relative paths and `assertNoRelativeHrefs` fails the build on them
(D31). Step 2 drops `<script>`, `<noscript>`, `<link rel=modulepreload>` and comments, **not**
stylesheet links, so three to five nodes differ on every page of the matrix.
Correct statement: rule 6 maps `css/…`, `../css/…` and the four sibling sheets (and
`posts/assets/*.css`) to their `/`-absolute form. No theme step is needed for them: `href()` rule 5
already passes `/css/` and `/blog/posts/` through unchanged.
Note D18's "`public/` keeps today's URL paths … so the DOM diff needs no path normalisation for
them" is true of the resolved URL and false of the href string; that sentence is probably why the
gap was never noticed.

**R3. §9 rule 6 is unscoped and rewrites metadata URLs.**
Severity blocker · confidence high · spec L885-887 ("Every old internal form…").
Evidence: `https://www.dawsonamf.com/` is not only the logo, it is also `link[rel=canonical]`
(`index.html:8`) and `meta[property=og:url]` (`:14`) on home; `https://www.dawsonamf.com/blog/` is
both on the listing (`blog/index.html:8,14`); `https://www.dawsonamf.com/resources/og-avatar.jpg`
is `og:image` on both (`index.html:15`, `blog/index.html:15`). As written rule 6 strips the origin
and applies the theme prefix to all of them, while the new side keeps absolute default-theme URLs
(§6.1: "default pages carry canonical to themselves"). Exception row 10 excludes
`link[rel=canonical]` on the 15 skins only, and never `og:url`/`og:image`; under the **default**
theme nothing excludes them at all.
Correct statement: scope rule 6 to navigational and asset references (`a[href]`, `link[href]`,
`img/iframe[src]`) and exempt `link[rel=canonical]` and `meta[property^=og:]` explicitly, or list
the metadata URLs as pass-through forms.

**R4. §9 rule 6 and §6.1 `href()` rule 2 contradict each other on bare fragments.**
Severity blocker · confidence high · spec L888 vs L597.
Evidence: rule 6 maps bare `#x` on home to `/#x`, which then takes the theme prefix. §6.1 rule 2
says a path starting with `#` is "unchanged (same page, same theme)". Today home emits `#about`,
`#jobs-header-static`, `#project-header-static`, `#contact` (`nav-config.js:9-13`, non-subpage
branch) and `href="#"` on the Calendly link (`index.html:275`, `nav-config.js:55`), the latter
pinned to `#` by D16. If the canonical Nav authors bare `#x` on home (which rule 2 permits and
parity requires), rule 6 manufactures a diff on every home page in the matrix; if it authors
`/<theme>/#x`, that is a DOM and behaviour change absent from §15.
Correct statement: say which form the canonical Nav authors on home. If it is the parity form, drop
the `#x` mapping from rule 6 and keep only `../index.html#x` → `/#x`.

**R5. §9 rule 6 misses two root-absolute internal forms, both on matrix pages.**
Severity blocker · confidence high · spec L893-894.
Evidence: `js/blog-data.js:93` `url: "/lexchat/"` and `:29` `url: "/embedded-swift-agent/"`, both
rendered as carousel CTAs on home **and** the listing (`featured-carousel.js:72,75`); and
`blog/posts/embedded-swift-agent.md:201` links `/embedded-swift-agent/` inside a matrix post body.
Rule 6 lists only `../embedded-swift-agent/`, a form the site never emits, and has no lexchat
mapping at all.
Correct statement: `/lexchat/` maps to itself and then takes the theme prefix (matching the new
side's `href('/lexchat/', theme)`); `/embedded-swift-agent/` maps to
`/subsites/dawson/embedded-swift-agent/`, which `href()` rule 5 then passes through unchanged.
`../12years/` can be dropped: nothing on the site links to it.

**R6. §9 rule 6 themes the 404's links; the new 404 renders them unthemed.**
Severity blocker · confidence high · spec L885-887 and the row-11 exception at L908.
Evidence: the new 404 is built in the default theme and applies a theme at runtime (D27), so its
hrefs stay default-theme, which §15.11 and row 11 already acknowledge for the "Back to the home
page" link and the preset rows. But rule 6 applies `href(route, theme)` on the old side for every
page, so the 404's logo (`404.html:46`, `href="/"`) becomes `/<theme>/` on the old side and stays
`/` on the new. Row 11 does not cover it, and bare `/` is not a rule-6 form at all.
Correct statement: rule 6 skips the theme step on the 404 (both sides render default-theme links
there), or row 11 excludes every internal `href` on the page rather than two of them.

**R7. §5.4 says all 100 ramp properties are written as `hsla()`. Five of them are raw hex.**
Severity blocker · confidence high · spec L472-476.
Evidence: `js/theme-bootstrap.js:766` `root.style.setProperty('--' + role, hex);` writes the five
base roles as the entry's hex string; only the 19 × 5 step properties use
`'hsla(' + h.toFixed(0) + ',' + s.toFixed(0) + '%,' + l.toFixed(0) + '%,' + a + '%)'` at `:771`.
Correct statement: 95 step properties as `hsla(H,S%,L%,A%)` (`toFixed(0)`, no spaces, percentage
alpha) plus 5 base roles written as the raw hex.
Why it matters: `ramp.ts` is ported from this paragraph and feeds all three adapters (D33). A port
that emits `hsla()` for all 100 fails T3's "byte-equal to the T1 pre-cycler capture" done-when and
changes the served `<html style>` on all 16 themes. The harness would catch it, at the cost of the
whole T3 loop.

### Majors: needs a change, no harness consequence

**R8. §5.5's neutrals baseline arithmetic breaks on the default theme.**
Severity major · confidence high · spec L560-561.
`theme-bootstrap.js:16-21`, the `default` entry, has no `tokens` key, so `entry.tokens[k]` is
undefined for all six members of `DERIVED_NEUTRALS` (`:208`) and every one falls to
`removeProperty` at `:221`. Correct statement: four values plus two removals for the 15 non-default
themes; six removals for `default`. This is the entry most visitors get, and it is the snapshot the
build has to reproduce.

**R9. §5.5 attributes the `__ACTIVE_STYLE` read to `theme-cycler.js:273`.**
Severity major · confidence high · spec L563-566.
The cycler reads the global exactly once, at `:167`
(`REGISTRY[window.__ACTIVE_STYLE] || REGISTRY.default`), which seeds `state.style` at `:170`. Line
`:273` is `if (!REGISTRY[id] || id === state.style) return;`, which reads `state.style`; the
current-row marker reads `state.style` at `:293`/`:320`. Correct statement: replace the read at
`:167`; `:273` is the no-op guard and is correctly cited for that purpose two sentences later.

**R10. §6.2's post row says posts gain Calendly CSS and AOS. Nothing else in the spec does.**
Severity major · confidence high · spec L631.
"No canonical, no OG, no Calendly css, no AOS today (all gained per §15.4)". §15 item 4 lists only
title, description, canonical, OG and JSON-LD; §7's post-head list (L715-720) has neither AOS nor
Calendly; and the step 8 exception table's post row excludes no `<link>` for either. Verified:
`blog/post.html` contains zero AOS and zero Calendly references. Correct statement: canonical and
OG are gained per §15.4; Calendly CSS and AOS stay absent. As written the parenthetical either
misleads the implementer or silently requires two more exception rows.

**R11. gemma4 cannot both carry `tags: null` and gain tag pills.**
Severity major · confidence high · spec L265, L310, L1075, L1136, and exception row 4 at L904.
§4.1 and schema rule 3 give gemma4 explicit `null` excerpt and tags "which renders nothing"; Q2's
default repeats it. Yet §15.4 says the page "gains the tag pills it lacks today (D8)" and Q2's
question text says the same, and row 4 excludes "the tag pills in `#post-meta`" on that post.
Verified: gemma4 is the commented-out `BLOG_POSTS` entry (`js/blog-data.js:122-129`), so its page
renders no tag pills today; with `tags: null` it renders none tomorrow either. The contradiction is
inherited verbatim from fix-list C17, which asserted both halves. Correct statement: with the Q2
default, gemma4's pills are unchanged (none) and the row-4 gemma4 clause is unnecessary; it gains
pills only if the owner approves tags, which is what Q2 asks.

**R12. `src/build/posts.ts` is orphaned by the ticket breakdown.**
Severity major · confidence high · spec L1042 vs L105 and L608-610.
T3 delivers "`paths.ts` (`themeParams`, `href` + `postIds`)", contradicting §3.1 (which puts
`postIds()`/`postDates()` in `src/build/posts.ts`) and §6.1's explicit "deliberately not in
`themes/` so `paths.ts` stays a content-free leaf". This is the one place the fix agent's own
beyond-the-list move was not carried through. Related: `src/build/` is in T2's paths but not T3's,
although T3 delivers the checks integration (D39); T5 delivers `postDates()` with no `src/build/`
in its paths. Correct statement: T3 delivers `paths.ts` (`themeParams`, `href`) and
`src/build/posts.ts` (`postIds`), and `src/build/*` is in T3's and T5's paths.

**R13. §10 step 2's forward reference is off by one.**
Severity major · confidence high · spec L965.
"so **step 6's merge** is clean rather than an add/add conflict": step 6 is the Pages
`build_type=workflow` flip; the merge is step 7. B6 inserted the new "run it once on `main`" step
and shifted everything below it. Every other `§10 step N` reference in the file was checked and
resolves correctly (L971, L1045, L1046, L1048, L1115, L1116).

**R14. D32's tilt-gate instruction inverts two of the five gates.**
Severity major · confidence high · spec L81, restated in §8's rows.
Two gates are early-return: `featured-carousel.js:190` and `script.js:257`
(`if (window.__styleAllowsTilt && !window.__styleAllowsTilt()) return;`). Three are positive:
`script.js:397`, `blog/blog-listing.js:142`, `blog/blog-post.js:182`
(`if (!window.__styleAllowsTilt || window.__styleAllowsTilt()) {`). D32's blanket "the five tilt
gates read `!document.documentElement.hasAttribute('data-no-tilt')`" is correct for the three
positive forms and inverted for the two early-return ones, which would disable tilt on exactly the
themes that allow it. Correct statement: the early-return gates become
`if (document.documentElement.hasAttribute('data-no-tilt')) return;`.

### Minors: one line each

- **R15.** §8: `applyExpandVisualShell` is `featured-carousel.js:94-120`, not `:94-185`; `:122-185`
  is `setupExpandVisual`, its only caller. Both are dead behind `EXPAND_VISUAL` (`:17`, gate `:421`).
- **R16.** §8 and D17: the jobs panel is `script.js:271-370`, not `:273-302` (which is
  `jobsHighlight`/`isMobileLayout`/`moveHighlight`). The `data-job` read is `:344` and
  `getElementById(newJobID)` is `:355`. Markup cites `index.html:153-156` and `:163,176,185,197`.
- **R17.** D11: "every switch lands on `/` (`theme-cycler.js:277`)": `:276` is
  `window.location.href = '/?style=' + …`; `:277` is the closing brace. E1 asked for this change and
  it moved the citation off the code.
- **R18.** D4: `restore()` is `theme-cycler.js:142-154`, not `:141-154` (`:141` closes `persist()`).
  "boot `:748-754`" is a slice of `boot()`'s body: `boot()` is `:747-770`, invoked at `:772-776`.
- **R19.** §5.4: "an unknown id is ignored, as `theme-bootstrap.js:693-696`": the rejection is the
  guard at `:689` (`if (param && REGISTRY[param])`); `:693-696` is the session-stored fallback that
  runs instead. The conclusion holds, the citation does not.
- **R20.** §5.5: the `DERIVED_NEUTRALS` baseline branch is `theme-cycler.js:217-224`, not `:214-221`
  (which starts on the registry lookup and stops mid-loop).
- **R21.** §8: privacy, 404 and lexchat do not "load only the cycler" today; they also load
  `theme-bootstrap.js` (`privacy/index.html:18`, `404.html:16`, `lexchat/index.html:11`). True only
  after the bootstrap is deleted.
- **R22.** §6.2: the post head is `blog/post.html:4-58`, not `:4-26`; the inline mermaid
  `initialize` block at `:27-58` is the last node in that head. §6.2 and D35 both describe the block,
  so only the range is wrong.
- **R23.** §5.5's preset-row sketch is abbreviated in a way that reads as exact markup. Today
  (`theme-cycler.js:302-308`) the `<li>` carries **no** class except `tc-row-sel` on the active row,
  `data-id` sits on the `<a>` **and** on a sibling `button.tc-row-card` the sketch omits entirely,
  and the anchor's classes are `tc-row-link menu-item tc-stagger [tc-sel]` with `aria-current` when
  selected. A literal reading emits a `tc-row` class today's DOM lacks, which the step 8 table does
  not except. State the exact markup or mark the sketch abbreviated.
- **R24.** §12: "T5 and T6 run in parallel after T4 **on disjoint paths**": both edit
  `astro.config.mjs` (T5 the sitemap block, T6 the redirects block). Block-level disjoint, file-level
  collision; say so.
- **R25.** §10 and T7 write "`refresh-chart-data.yml`: … `permissions: actions: write`", which reads
  as replacing today's `permissions: contents: write`. The job pushes, so the permission must be
  additive. D21 says "gains"; §10 and T7 should too.
- **R26.** §9 step 2's comment list cites `index.html:17`; the `<!-- Styles -->` comment is at `:18`.
  The list is also a sample (`index.html` alone has ten-plus comments), which is harmless because the
  rule drops all comment nodes, so say "for example" or drop the enumeration.
- **R27.** §9's "eleven libraries from live CDNs" counts only what the six page files hard-code. The
  matrix also fetches Plotly 2.27.0 and js-yaml 4.2.0 on `metr-doubling`, a matrix page, and neither
  is in the `route.abort` list; Google Fonts is never blocked by design. Thirteen libraries plus
  Google Fonts.
- **R28.** §16: the traceability row "§10 (deploy, worktree)": the baseline worktree is §14 item 4
  and D20, not §10.
- **R29.** §6.3's cited body ranges both exclude the `<div id="main-body">` wrapper
  (`privacy/index.html:22`/`:127`, `404.html:44`/`:68`), and each page has two footer blocks (a
  desktop `<footer class="footer-container">` and a mobile `<div class="footer-container-mobile">`),
  not one.
- **R30.** Three off-by-one citations: §5.4 `:703-706` (the three `setAttribute` calls are
  `:704-706`; `:703` is the non-default guard), §5.5 `loadAllFonts` `:370-386` → `:370-387`, D11
  reload detection `:675-678` → `:674-678`.
- **R31.** §5.5: "which `boot()` reaches via `restore()` → `applyColors()` → `applyDerivedNeutrals()`"
  is not a call chain. `restore()` (`:142-154`) does not call `applyColors()`; `boot()` calls them in
  sequence (`:751`, then `:754`). Only `applyColors` → `applyDerivedNeutrals` (`:187`) is a real edge.
  The conclusion (capture the baseline before the first write) is unaffected.
- **R32.** Wording: D4 and D32 both say "exactly one `is:inline` pre-paint script … plus" a second
  one, while §5.4 says "there are only two", and D26 adds a third for structural themes. Say "two on
  canonical routes, one on themed routes; a structural theme may add its own".

### Parity contract: what the rewrite adds to `<html>`, `<head>` and the DOM

Cross-checked every addition against the §9 step 8 table and §15. Covered correctly:
`data-typing`/`data-typing-delete` (row 10, §15.10); `--prose-*` (step 7 + check 3 exclusion,
§15.10); canonical + robots on themed pages (row 10, §15.10); the FAB, dock and scrim on the three
utility pages plus the Font Awesome link (row 3, §15.3); the post head's new tags (row 4, §15.4);
the dock's `data-*` prose attributes, `data-fonts`, the profile attribute and the rows' new hrefs
(row 9, §15.9); the 404's default-theme links (row 11, §15.11). `--ticker-run`/`--ticker-dur` need
no exception (same formula, same values, and step 7 compares `<html style>` as a sorted map). The
logo needs none once rule 6 themes the old side (§15.1).

Not covered: the 404's logo href (R6) and, if §5.5's row sketch is literal, the `tc-row` class
(R23). Everything else the rewrite adds is either excluded or provably identical.

### Intent §4 locked decisions

Honoured, or deviation stated: §4.1 (Astro pinned, D1), §4.2 (sizes, `null` semantics, unwritten
list), §4.3 (one YAML file, Markdown in prose, TS schema), §4.4 (drafts, toggle persisting across
pages, `CLAUDE.md` rule, cheap pre-push lint), §4.5 (theme in path, reload keeps it, canonical +
noindex), §4.6 (posts prerendered, shim, generated sitemap, highlight.js 11.9.0 github-dark kept,
mermaid client-rendered), §4.7 (picker reachable everywhere via D12/D30), §4.8 (subsites, Q3
default = the locked decision), §4.11 (one merge), §4.13 (behavior policy, D3). The three
deviations are stated in both the decision row and §16: **D5 vs §4.12**, **D18 vs §4.10**, **§9 vs
§4.9**.

One candidate deviation is not in that list, and belongs in the grilling rather than in a fix:
intent §4.7 says "Utility pages (privacy, 404, lexchat) always get tokens only", while §5.2's
composition table gives a **skin** its full sheet on utility pages. D13 states the reading and its
reason (five sheets style `.privacy-*`/`.nf-*` today, so tokens-only would break parity) and the
paragraph in §4.7 is plainly about the owned/unowned fallback, which only structural themes have.
The reading is right; it is just not recorded as a resolved ambiguity in §16.

---

## 3. Verdict

**The review round's blockers are resolved.** All ten A items and all eight B items landed; the two
"done differently" calls (C18, E2) are correct on the code and I would have made the same calls;
the eight new structural decisions D32-D39 are present, coherent and consistent with §2, §12 and
§16. The spec grew from 902 to 1214 lines without introducing a dangling reference, a malformed
table or an em dash.

**It is not yet ready to build from.** Normaliser rule 6, the single item A1 existed to fix, is
still wrong in one mapping (R1) and incomplete or mis-scoped in five more (R2-R6). Any one of them
fails DOM equality on most of the matrix, so T1 would go green old-vs-old and T4 would fail with
diffs that look like component bugs. R7 puts a false statement about today's inline style in the
paragraph `ramp.ts` is ported from.

Per the owner's process, that is **one new small dispatch**, not a second review round. Scope it to:

1. **Rewrite §9 rule 6 and check its scope** (R1-R6): fix `./` → `/blog/`; add the relative
   stylesheet forms; scope the rule to navigational and asset references and exempt canonical/OG;
   reconcile the bare-`#x` mapping with `href()` rule 2 by stating what the canonical Nav authors on
   home; add `/lexchat/` and root-absolute `/embedded-swift-agent/`, drop the never-emitted
   `../12years/`; and either exempt the 404 from the theme step or widen exception row 11 to every
   internal href.
2. **Correct §5.4's ramp sentence** (R7): 95 `hsla()` step properties plus 5 base roles as raw hex.
3. **Apply the seven other majors** (R8-R14) and the eighteen minors (R15-R32), all one-line edits
   with the correct value given above.

That is one agent, one section rewrite plus a list of numbered corrections. It needs no new
research: every correct value is stated here with its `file:line`.

**Owner decisions (§13), not fixes:** the gemma4 pills question is already Q2 and only needs §15.4
and Q2's own text made consistent with whichever answer the owner gives (R11); the intent §4.7
utility-page reading deserves a line in §16 or a confirmation in the grilling.

**Verify at T0/T1/T7, as the spec already says:** the artifact upload under legacy Pages (§10 step
5, already labelled Unverified); `gh workflow run -F` delivering a typed boolean; the three GitHub
dispatch behaviours; Astro's head-injection position (T0 item (b)); and the `.trim()` requirement on
`--tc-row-*` reads, which is new-side code with no counterpart to check today.

### Not verified

- Live-network claims: npm registry versions, GitHub REST/Actions documented behaviour, the Astro
  7.3.1 and Playwright 1.61.1 source assertions (`integrations/hooks.ts`, `content/loaders/file.ts`).
  No network was used; these were verified by the finalizing pass and by
  `walks/correctness-fable-1-third-party-verification.md` and are outside this pass's remit.
- Anything requiring a build or a browser: Astro's actual head-injection position, the rendered DOM
  of any page, screenshot behaviour. Runtime link forms were derived by reading the generators
  (`nav-config.js`, `blog-data.js`, `featured-carousel.js`, `blog-listing.js`, `blog-post.js`,
  `theme-cycler.js`), not by observing a rendered page.
- The `research/*.md` files the spec cites: present under the intent directory, not opened. §17's
  errata about them were not re-derived.
- The `astro` branch and the two worktrees §14 item 4 creates do not exist yet, so nothing about the
  branch copy of `deploy.yml` could be checked beyond the text.

---

## 4. Hygiene

`git status --short` shows exactly six untracked entries and nothing else: `docs/bento-prototypes.html`,
`docs/cream-prototype.html`, `docs/layout-prototypes.html`, `docs/list-portfolio-prototype.html`,
`docs/mono-prototype.html` and `docs/intents/`. No file in the repo was created or modified by this
pass; the only write is this report at `/tmp/spec1-reviews/06-fix-verification-opus.md`. No git
actions. No installs, no servers, no listeners, no browser. All five verification agents ran
read-only and have exited; no background process from this session is running.
