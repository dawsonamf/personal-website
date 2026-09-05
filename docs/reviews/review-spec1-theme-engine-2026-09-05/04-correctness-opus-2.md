# Spec 1 review — axis: correctness

**Reviewer:** 04-correctness-opus-2
**Spec:** `docs/intents/2026-09-05-theme-engine-rewrite/spec-1-migration-engine-parity.md` (902 lines)
**Baseline:** `main` @ `0f196d0`
**Method:** full read of `intent.md` and the spec; claims verified against the code (`file:line`), the npm
registry, docs.astro.build, docs.github.com, raw `action.yml` / `browsers.json`, and Playwright's pinned
`.d.ts`. Research files consulted only where the spec cites them.

**Headline:** the spec is unusually accurate about the current codebase and about third-party facts — of
~41 external claims checked, none is flatly wrong, and the great majority of `file:line` cites land exactly.
The failures cluster in three places: (1) the deploy workflow cannot produce a working site as written,
(2) the parity harness's normaliser cannot pass on any themed page, and (3) §11 promises engine surface that
§4/§5/§12 never specify or build.

---

## Blockers

### C1 — the deploy workflow never populates `public/vendor/`, so every vendored asset 404s in production
**Severity:** blocker · **Confidence:** high
**Spec lines:** L694 (and D21, L68); L52 (D5); L321 (§4.3 npm scripts)
**Evidence:**
- L694: the workflow is `checkout@v7`, `setup-node@v7` with `cache: npm`, `npm ci`, **`npx astro build`**,
  `upload-pages-artifact@v5`.
- L52 (D5): "A 20-line `scripts/vendor.mjs` copies the exact npm artifacts into `public/vendor/`
  (**gitignored**) on **`prebuild`/`predev`**".
- L321: `build` = `astro build` (i.e. `npm run build` is what carries the `prebuild` hook).
- L111 confirms `public/vendor/ (gitignored, generated)`.

**What is wrong:** `npx astro build` invokes the Astro CLI directly; it does not run npm lifecycle scripts,
so `prebuild` never fires in CI. `public/vendor/` is gitignored, so it is not in the checkout either. The
built `dist/` therefore contains no `/vendor/*`, and every page's head (§6.2, L486-488) references
`/vendor/fontawesome/css/all.min.css`, `/vendor/aos/aos.css`, plus jQuery, jQuery UI, GSAP, vanilla-tilt and
(on posts) `github-dark.min.css`. Production ships with no icons, no AOS, no tilt, no smooth scroll and
unstyled code blocks. `npm ci` runs `prepare`, not `prebuild`.
**Correct statement:** the deploy workflow must run `npm run build` (so `prebuild` fires), or add an explicit
`node scripts/vendor.mjs` step between `npm ci` and the build.

---

### C2 — the harness normaliser maps old links to *default-theme* paths, so DOM equality fails on all 15 themed skins
**Severity:** blocker · **Confidence:** high
**Spec lines:** L669-673 (normaliser rule 6) vs L474-475 (`href()` rule 5); L603 (parity check 1)
**Evidence:**
- L603: parity check 1 is `expect(newLines).toEqual(oldLines)` on the normalised dump.
- L669-672 maps old forms to bare default paths: `index.html#x` → `/#x`; `blog/`, `./`, `../blog/` →
  `/blog/`; `post.html?id=p` → `/blog/p/`; `resources/…` → `/resources/…`. Only the last clause (L673) runs a
  value through `href()`: "`/?style=x` → `href(<page under test>, x)`".
- L474-475: on a themed page `href()` prefixes every engine route with `/<theme>`.
- Old-side reality: today's pages carry no theme in any link (theme is session state,
  `js/theme-bootstrap.js:687`), so `/blog/?style=marquee` serves `<a href="../index.html">`, `<a href="blog/">`,
  `<a href="post.html?id=helm">`.

**What is wrong:** on the new side under `/marquee/`, those same links are `/marquee/`, `/marquee/blog/`,
`/marquee/blog/helm/`. After rule 6 the old side reads `/`, `/blog/`, `/blog/helm/`. Every nav link, logo
link, "See all posts", blog card, footer link and section anchor differs on every one of the 15 themed
skins on every page type. The harness is red before a single real regression exists.
**Correct statement:** rule 6 must compose — map each old form to its default path, then apply
`href(<default path>, <theme under test>)` — not stop at the bare default path.

---

### C3 — §9 defines parity as exact normalised DOM equality, but the normaliser cannot absorb §15's allow-list
**Severity:** blocker · **Confidence:** high
**Spec lines:** L601-603 and L658-675 (§9) vs L843-861 (§15); L775 (T6 "with the FAB allow-listed")
**Evidence:** the normaliser has seven rules. Rule 2 drops `<script>`/`<noscript>`/`modulepreload`; rule 3
strips `data-astro-*` and hashes; rules 4-6 canonicalise case/attributes/whitespace/links; rule 7 drops
`--prose-*` from `<html style>`. Nothing else is removed — L664 says so explicitly: "Nothing else is removed,
so `<head>` order is compared as-is."
Now the §15 items that are guaranteed DOM diffs and have no rule:
- item 10 (L856): themed pages gain `<link rel="canonical">` + `<meta name="robots" content="noindex">`
  (L478-479). Present on 15 themes × every page; absent on the old side.
- item 3 (L845): the picker FAB on privacy, 404 and lexchat — a new element in `<body>` on 3 × 16 pages.
  T6's done-when (L775) even says "with the FAB allow-listed", but §9 never defines an allow-list mechanism
  for DOM nodes.
- item 4 (L846-848): post pages gain a real `<title>`, description, canonical, OG tags and JSON-LD in the
  served head (§7, L537-540). The old post head has none of it (`blog/post.html` has no canonical and no OG
  tags — verified). JSON-LD is a `<script>` so rule 2 covers that one; the `<link>`/`<meta>` tags are not.
- item 11 (L857): the 404's runtime theme application.

**What is wrong:** §9 asserts byte-level dump equality while §15 enumerates eleven deliberate differences and
§9 implements exclusions for exactly one and a half of them. Every ticket whose "Done when" is "harness
green" (T4, T5, T6, T8) is unachievable as written.
**Correct statement:** §9 needs an explicit, enumerated exclusion set keyed one-to-one to §15 (selectors and
attributes dropped from the dump before comparison), and §15 should name the mechanism for each item.

---

## Major

### C4 — `@astrojs/sitemap` does not emit `sitemap.xml`; `/sitemap.xml` becomes a dead URL and `robots.txt` points at it
**Severity:** major · **Confidence:** high
**Spec lines:** L562 ("`sitemap.xml` generated (D24); `robots.txt` (with its `Sitemap:` line) in `public/`"), D24 (L71), §15 item 6 (L850)
**Evidence:** docs.astro.build, integrations-guide/sitemap: "With the sitemap integration configured,
**sitemap-index.xml and sitemap-0.xml** files will be added to your output directory when building your
site." The docs' own `robots.txt` example writes `Sitemap: https://<YOUR SITE>/sitemap-index.xml`. There is a
`filenameBase` option, but it renames the *base*, it does not collapse the pair into one `sitemap.xml`.
Today's `robots.txt` (verified) reads `Sitemap: https://www.dawsonamf.com/sitemap.xml`, and `sitemap.xml`
exists at the repo root.
**What is wrong:** after the migration `/sitemap.xml` 404s (an old URL with no redirect, against intent §3.5),
and the kept-verbatim `robots.txt` advertises a dead sitemap to every crawler. §6.4 has no row for it and
§15 item 6 only allow-lists "entries and `lastmod` change".
**Correct statement:** the build emits `/sitemap-index.xml` + `/sitemap-0.xml`; `robots.txt` must be updated
to `Sitemap: https://www.dawsonamf.com/sitemap-index.xml`, and `/sitemap.xml` needs a redirect row in §6.4
(or `filenameBase` plus an accepted rename, documented in §15).

### C5 — T3's "Done when: build emits 240 pages" cannot hold; posts arrive in T5
**Severity:** major · **Confidence:** high
**Spec lines:** L772 (T3 done-when) vs L774 and L786 (T5)
**Evidence:** L772: "Build emits 240 pages + `404.html`". L464-465: 240 = 16 themes × (home, listing,
**11 posts**, privacy, lexchat), i.e. 176 of the 240 are post pages. L774 (T5) delivers "posts collection,
marked-at-build, …"; L786 gives T5 the paths `src/content/posts/*` and "the posts collection". T3's own touch
list (L782-784) contains neither.
**What is wrong:** at T3 there is no posts collection and no `src/content/posts/*.md`, so
`[...theme]/blog/[id].astro` has no ids to enumerate.
**Correct statement:** T3 emits 16 × 4 = 64 pages + `404.html` (home, listing, privacy, lexchat), or the
post-file move must be pulled forward into T3.

### C6 — §11 promises five engine surfaces that §4, §5 and §12 never specify or build
**Severity:** major · **Confidence:** high
**Spec lines:** L736, L737, L739, L740, L741, L744, L746, L752, L756 vs L391-396 (§5.3), L400-414 (§5.4),
L266-283 (§4.1 rules), L771-772 (T2/T3), and the closing claim at L754
**Evidence, item by item:**
- **`chrome` slot.** L741: "a `chrome` slot rendered before `<main>` in the page shell"; referenced again at
  L752 and L756 ("Cream … will exercise `chrome`"). §5.4's definitive list of what `Shell.astro` emits
  (L400-414) has no `chrome` slot; §5.3's "Spec 1 ships" list (L391-395) does not include it; T3 (L772) does
  not build it. It is also redundant with L742 ("the Shell lets a layout own everything inside `<body>`
  except its end-of-body mount").
- **Per-theme schema extension.** L736: "the `themes.<id>.*` free-form section validated by a per-theme zod
  fragment the theme registers; schema helper `fragments(n)` …; per-slot `constraints` … as schema
  refinements". §4.1's eight rules say none of this, and L266 states "all objects are `z.strictObject`", which
  a free-form per-theme section directly fights. T2's deliverable is "schema (§4.1 rules 1-8)".
- **New optional fields.** L737 (`category`, `year`, `jobs[i].summary`), L739 (`socials[].group`),
  L740 (`projects[].images[]`) — "schema accepts them now as optional" is a §4 requirement that §4.1's shape
  and rules do not contain.
- **Plural fields.** L746: "plural forms as two fields (`one`, `other`)" — a shape §4.1 rule 1 does not allow
  (a prose field is a size map, "no other keys").
- **`<defs>` slot.** L744: "`<defs>` slot with `theme-<id>-` id prefix convention" — not in §5.4's Shell.

**What is wrong:** §11's entire purpose is "so the first consumer does not force a redesign" (L11). Its
closing claim (L754) — "Nothing in the five themes requires a change to the registry shape, the routing, the
prose accessor, or the composition rule as specified" — is true only because §11 silently adds surface that
the specified sections do not have.
**Correct statement:** either fold these into §4.1/§5.4 and the T2/T3 deliverables, or restate §11's column
header as "the first consumer adds" rather than "Spec 1 provides".

### C7 — `extraPages` has no route that can emit it, and §6.1 forbids adding one
**Severity:** major · **Confidence:** high
**Spec lines:** L356, L466, L475, L732, L754 vs L395-396
**Evidence:** L466: "No page files exist outside `[...theme]/` except `404.astro`", and L103-104 lists exactly
five page files (index, blog/index, blog/[id], privacy/index, lexchat/index). None can emit `/mono/work/`.
L732 nonetheless claims Spec 1 provides "`extraPages` in the registry, **emitted only under that theme**;
404 elsewhere; `href()` knows them", and L754 claims nothing requires a routing change. L395-396 says the
opposite: "Spec 1 does **not** ship: … extra pages."
**What is wrong:** emitting a theme-declared arbitrary path requires either a catch-all route file
(`[...theme]/[...extra].astro`) or `injectRoute` from an integration — i.e. exactly the routing change L754
denies. The registry field and `href()`'s knowledge of it are real; the emission is not.
**Correct statement:** the registry field, the reserved-id assertion and `href()` support ship in Spec 1;
emission needs one additional rest route (or `injectRoute`), which the first consumer's spec adds.

### C8 — D16's premise is false: `.calendly-link` is on the rendered social anchors too
**Severity:** major · **Confidence:** high
**Spec lines:** L63 (D16)
**Evidence:** L63 asserts "the only `calendly-link` today is hand-written HTML (`index.html:275`)". Actually
`js/nav-config.js:59` sets it on the rendered social anchor:
`const cls = item.isCalendly ? 'socials-item calendly-link' : 'socials-item';`, for the entry at
`js/nav-config.js:55`, rendered into `#socials-list`, `#blog-socials-list`, `.contact-menu` and
`.contact-menu-mobile`. The file's own comment (`js/nav-config.js:132-134`) says the popup handler binds
"every `.calendly-link` (the social anchors rendered above **plus** the static 'schedule a call' text link)".
Home carries roughly four at runtime, the listing one — not one.
**What is wrong:** §8's row for `nav-config.js` (L573) keeps only "sticky header … Calendly click"; if the
implementer trusts D16 and the components emit `.calendly-link` on the prose link only, the Calendly popup
stops working from the nav, the socials list and both contact menus on every page. The prose sketch does
model the entry (L199, `{ id: calendly, calendly: true }`), so the fix is one component line — but D16 tells
the implementer it is unnecessary.
**Correct statement:** `.calendly-link` is emitted on the prose contact link **and** on the Calendly social
entry wherever the socials list renders; the click handler binds all of them.

### C9 — "`nav-behavior.js` and `cursor-follow.js` are `defer` everywhere" is false; taking it literally adds the cursor follower to three pages
**Severity:** major · **Confidence:** high
**Spec lines:** L585
**Evidence:** `nav-config.js` and `cursor-follow.js` are present on `index.html:40,42`, `blog/index.html:36,37`
and `blog/post.html:25,26` only. They are **absent** from `privacy/index.html`, `404.html` and
`lexchat/index.html`, which load exactly two scripts each (`theme-bootstrap.js` sync, `theme-cycler.js` defer:
`privacy/index.html:18,128`; `404.html:16,69`; `lexchat/index.html:11,17`).
**What is wrong:** "everywhere" makes the implementer emit both on the utility pages. `cursor-follow.js`
would then draw a cursor follower on privacy, 404 and lexchat where none exists today — a visible change not
in §15. §9 check 5 (script allow-list, "today's set per page type") would catch it, but §8 is the
instruction the implementer follows first.
**Correct statement:** `nav-behavior.js` and `cursor-follow.js` are `defer` on home, listing and post; the
three utility pages load only the cycler.

### C10 — `site.titleSuffix` "on every page" breaks `<title>` parity on home and lexchat
**Severity:** major · **Confidence:** high
**Spec lines:** L183 (`titleSuffix … "<title> | <suffix>" on every page`), L186-188 (`meta:`)
**Evidence:** `index.html:6` is the bare string `Dawson Metzger-Fleetwood`; `lexchat/index.html:6` is the bare
string `LexChat`. Neither carries a suffix today.
**What is wrong:** applied universally, home becomes `Dawson Metzger-Fleetwood | Dawson Metzger-Fleetwood`
and lexchat becomes `LexChat | Dawson Metzger-Fleetwood`. Both are `<title>` parity breaks on two page types,
not listed in §15.
**Correct statement:** the suffix applies to the blog listing, posts and privacy; home and lexchat use their
title verbatim (or `meta.<page>.title` must be able to opt out of the suffix).

### C11 — `public/blog/posts/assets/*` ships ~35 visitor-facing strings with no prose home and no exemption
**Severity:** major · **Confidence:** high
**Spec lines:** L227-233 (`posts:` shape), L558 (assets kept verbatim), L319-320 + Q11 (L812) (exemptions)
**Evidence:** the exemption in `CLAUDE.md` (L319-320) and Q11 cover only `public/subsites/` and
`public/embedded-swift-agent/`. Per-post assets are kept verbatim by §7 (L558) and carry, among others:
`Show another` (`blog/posts/assets/underviewed-art.js:225`); `Could not reach the museums.` / `try again`
(`:284-285`); `Untitled` (`:50,110,135,163,250`); `aria-label="Artwork not on view"` (`:223`);
`aria-label="Artworks you have seen this visit"` (`:227`); `aria-label="Loading artwork"` (`:279`); axis and
annotation labels in `metr-chart.js:176,183`, `heretic-ara-charts.js:111,119,135,213,220,237,245,253,307,312`
and `job-market-chart.js:152-157,552`.
Worse for the hard requirement: `underviewed-art.js:295` builds `` `Show ${art.title || 'this artwork'}` ``
— an aria-label composed from a **third-party museum API field**, which intent §3.1's "No free text" rule
prohibits outright.
**What is wrong:** intent §3.1 is a hard requirement ("If a guest can see it, it counts"). The spec neither
brings these into `prose.yaml` nor exempts them, so an implementer following it literally ships unapproved
visitor-facing strings and violates §3.1.
**Correct statement:** add an explicit Q11-style exemption for per-post asset scripts (with the
API-derived aria-label called out as the one that still needs an approved template), or a
`posts.<id>.assets.*` prose namespace.

### C12 — the `post.html` shim drops `?style=`, so themed old post links land unthemed
**Severity:** major · **Confidence:** high
**Spec lines:** L509 (§6.4 row 3) vs L627 (§9 old-side URL)
**Evidence:** L509 specifies the shim as "inline `location.replace`, meta-refresh fallback to `/blog/`,
canonical `/blog/`" — target `/blog/<id>/`, no mention of `style`. L627 uses
`/blog/post.html?id=p&style=x` as the old-side harness URL, so the spec knows that URL form works today
(`js/theme-bootstrap.js` reads `?style=` on every page). The shim is a `public/` passthrough, not an Astro
page, so it has no `ThemeRuntime` and no `?style=` handling of its own.
**What is wrong:** a bookmarked `/blog/post.html?id=helm&style=brutalist` lands on the default-theme post.
Intent §3.5 requires old URLs to keep working; §15 does not list the loss. The harness never catches it
because its URL pair jumps straight to `/x/blog/p/`.
**Correct statement:** the shim must read `style` and redirect to `/<style>/blog/<id>/` when `style` names a
known theme, else `/blog/<id>/`.

### C13 — `href()` rule 1 lets the same-origin absolute logo link escape the theme
**Severity:** major · **Confidence:** medium
**Spec lines:** L470 (`href()` rule 1), L843 (§15 item 1)
**Evidence:** `index.html:57` and `privacy/index.html:25` write the logo as
`href="https://www.dawsonamf.com/"`. `href()` rule 1 returns anything "starting with a scheme … unchanged",
so under `/marquee/` the logo still points at the absolute default-theme home. Today the theme survives
same-session navigation via `sessionStorage` (`js/theme-bootstrap.js:687,692`), so clicking the logo under a
skin keeps the skin; after the migration it drops the visitor to default.
Related, smaller: `js/nav-config.js:54` writes the vCard as
`https://www.dawsonamf.com/resources/contact.vcf` while the prose sketch (L198) writes
`/resources/contact.vcf` — a DOM diff with no normaliser rule and no §15 entry.
**What is wrong:** a behavior regression (leaving the theme on the most-clicked link) plus an unlisted DOM
change, both caused by rule 1 treating same-origin absolute URLs as external.
**Correct statement:** `href()` should reduce same-origin absolute URLs to their path before applying rules
3-6, or the logo and vCard hrefs must be authored root-relative (and the change listed in §15).

### C14 — the deploy workflow's `deploy` input default is never stated, and T7's acceptance depends on it
**Severity:** major · **Confidence:** medium
**Spec lines:** L696 ("`workflow_dispatch` input `deploy: false` for dry runs"), L697-698, L707, L776 (T7 done-when)
**Evidence:** L707 (cutover step 4) explicitly passes `-f deploy=false`, implying the default is `true`.
L697-698 has `refresh-chart-data.yml` run `gh workflow run deploy.yml --ref main` with **no** `-f`, relying
on the default. T7's done-when (L776) requires "a manual `workflow_dispatch` of `refresh-chart-data.yml`
dispatches `deploy.yml` (visible in Actions …); **Pages still legacy**".
**What is wrong:** the two readings both break something. If the default is `false`, the production
chart-refresh dispatch builds and never publishes — the whole point of D21's `refresh-chart-data.yml` patch.
If the default is `true` (the reading step 4 implies), T7's test runs `deploy-pages@v5` against a Pages site
still configured `build_type: legacy` and the run goes red, which is not what "visible in Actions,
confirming `actions: write` suffices" describes.
**Correct statement:** the input defaults to `deploy: true`; T7's dispatch test must pass `-f deploy=false`
(or assert only that the dispatch was *created*, not that the run succeeded) while Pages is still legacy.

---

## Minor

### C15 — `/sitemap.xml`'s siblings: `/blog/posts/*.md` (11 live URLs) are dropped with no §6.4 row
**Severity:** minor · **Confidence:** high · **Spec lines:** L66 (D19), L108-114 (`public/` retention), §6.4
Today `/blog/posts/toolbelt.md` and its ten siblings serve 200 (they are fetched at runtime by
`blog/blog-post.js:145`). D19 moves them to `src/content/posts/`; D18's `public/` list keeps
`/blog/posts/assets/*` but not the `.md` files. §6.4 and §15 do not mention the drop. No consequence beyond
dead raw-markdown URLs, but intent §3.5 ("old URLs must keep working") is stated without exception.
**Correct statement:** list the `.md` drop alongside the `docs/` drop in §15, or keep copies in `public/`.

### C16 — `layoutFor(theme, pageType)` is given page types that `PageType` does not contain
**Severity:** minor · **Confidence:** high · **Spec lines:** L334 vs L376-380, L400, L608
L334: `type PageType = 'home' | 'blog' | 'post'`. L376-380 calls `layoutFor(theme, pageType)` and then adds
"utility page types (privacy, 404, lexchat) → always canonical". `Shell.astro` takes a `pageType` prop (L400)
and `harness/sentinels.ts` is keyed "per page type" over eight of them (L608, L616).
**Correct statement:** the composition/shell signature needs a wider union (`PageType | 'privacy' |
'lexchat' | 'notFound'`); `PageType` stays the three *ownable* types.

### C17 — §5.2 lists `404` as a per-theme composition case, but D27 builds exactly one default-theme 404
**Severity:** minor · **Confidence:** high · **Spec lines:** L380 vs L74 (D27), L466, L499-501
L380 says utility page types including `404` get "assets as the skin or fallback line above" — but there is
one `dist/404.html`, built default, themed at runtime. Nothing per-theme is emitted for it. L464-465's page
count correctly omits 404 from the per-theme product; L380 does not.

### C18 — §9 check 3 ("every `--*` token on `<html>`", exact) contradicts §15 item 10 and normaliser rule 7
**Severity:** minor · **Confidence:** high · **Spec lines:** L607-608 vs L674 and L856
Rule 7 drops `--prose-*` from the **DOM dump**. Check 3 is a separate computed-style sample demanding exact
equality of "every `--*` token on `<html>`" — under marquee and doodle the new side has `--prose-ticker` /
`--prose-currently-here` and the old side does not.
**Correct statement:** check 3 must exclude `--prose-*` as well.

### C19 — `harness/scripts.ts` is used by §9 but missing from the §3.1 layout tree
**Severity:** minor · **Confidence:** high · **Spec lines:** L613 vs L106
L106 lists `harness/ parity.spec.ts settle.ts normalize.ts urls.ts sentinels.ts __parity__/`; L613 references
`harness/scripts.ts` as the script allow-list.

### C20 — the `.tc-toggle` count is right by file but wrong by skin, and the FAB will not inherit any of it
**Severity:** minor · **Confidence:** high · **Spec lines:** L59 (D12), L777 (T8)
`.tc-toggle` appears in 17 files under `css/themes/`: 16 skin sheets + `theme-base.css:81` (verified,
`[data-still] .tc-toggle:hover {`). But **four** of those sheets are the retired ones (`space`, `vapor`,
`wanted`, `constructivist`, none in `ORDER`), and **three active skins have no `.tc-toggle` rule at all**
(`field-notes`, `marquee`, `studio`). So it is 12 active + 4 dead, not "16 skin sheets". T8's "the dead
`.tc-toggle` rules in 16 sheets … audited against the real FAB" would touch four files outside `ORDER` and
find nothing to audit on three active skins.
Second half, more useful: D30 names the FAB `.tc-nav-item.tc-fab` (L77), so **none** of those 12 existing
rules apply to it — the FAB ships with only whatever `theme-cycler.css` gives it under all 15 skins. §15
item 3 allow-lists the FAB's existence, not its appearance. Reusing `.tc-toggle` would inherit 12 skins'
worth of already-written intent for exactly this element.
**Also missed, same class of dead code:** `.tc-dropdown` is never created either (`injectDom()` builds
`tc-dock tc-mega tc-hidden`, `js/theme-cycler.js:512`), yet rules survive at `css/themes/theme-base.css:85`
and `css/theme-cycler.css:51,65,105`.

### C21 — "the 10 elements `anim-utils.js` pins" is mis-attributed
**Severity:** minor · **Confidence:** high · **Spec lines:** L653-654
`js/anim-utils.js:15-30` only defines `persistAfterAnimation` / `animateThenPersist`. The ten pin calls on
home are in `js/script.js` (`:36,43,50,57,64,72,80,120` plus `:91,96`). Count of 10 for home is correct. The
listing pins eleven (`blog/blog-listing.js:8-14,17,18,29,30`), which §9's settle does not name — settle step
4 (`getAnimations()` empty) covers them in practice, since the pins fire on `animationend`.

### C22 — three line-range cites point at reload *detection*, not at the wipe they describe
**Severity:** minor · **Confidence:** high · **Spec lines:** L51, L58
- L58 "`theme-bootstrap.js:675-678`": `:674-678` is the `isReload` sniff; the theme wipe is `:687`
  (`if (isReload) sessionStorage.removeItem(STYLE_KEY)`) and the palette wipe `:730-731`.
- L58 "`theme-cycler.js:126-133`": `:126-131` is `isReload()`, `:132-133` opens `persist()`; the wipe is
  `boot()` `:748-749`.
- L51 "the palette toy keeps restoring after load … `theme-cycler.js:126-147`": `restore()` is `:142-154`
  (the cite truncates it mid-body); the call site is `:750-751`.
Substance is correct in all three; only the cites are one hop short.

### C23 — small cite/count slips (no behavioral consequence)
**Severity:** minor · **Confidence:** high
- L429-431: the three global bodies are `js/theme-bootstrap.js:646-649`, `:654-657`, `:664-667`, not
  `646-669` (`:669` is `var STYLE_KEY = 'dawson-style';`). Note they read the closure `REGISTRY` keyed by
  `window.__ACTIVE_STYLE`, so "copied verbatim" only works if the new runtime keeps a registry lookup.
- L403: `theme-bootstrap.js:703-706` stamps the three attributes correctly, but the inline `style` the
  sketch shows comes from `:707-711` (tokens) and `:764-774` (ramp), not from 703-706.
- L63 "the two branches `blog-post.js:4-14`": the link override is `blog/blog-post.js:8-15`.
- L531 "renderer overrides copied from `blog/blog-post.js:4-30`" is right, but D8's separate cite
  (L55) for the frontmatter parser, `:32-48`, is exact.
- L540 `new Date(date + ' 1')` is real but lives in `parsePostDate` at `blog/blog-post.js:52`, not inline in
  the JSON-LD builder (`:56-88`, which is exact).
- L243 `script.js:129-192` → the nine sequences are `:130-192` (`:129` is the `sequences: [` line);
  L244 `blog-listing.js:37-88` → `:38-88` (`:37` is `deleteDelay: 40,`).
- L486-491: home's head is `six` OG/Twitter tags (`index.html:11-15` og + `:16` twitter:card), not five; and
  the enumeration stops one line short of `theme-bootstrap.js` at `index.html:27`.
- L542-544: the post DOM is right but drops three real classes —
  `h1.blog-post-title#post-title`, `div.blog-post-meta#post-meta`, `div.blog-post-content#post-content`
  (`blog/post.html:87-93`). Skin sheets may target the classes.
- L59: the "never existed" FAB claim in `docs/theme-explorations.html:62-63` also wrongly names blog posts,
  which *do* get the nav picker.

### C24 — Q7's description of the duplicate masthead sequences is inverted
**Severity:** minor · **Confidence:** high · **Spec lines:** L808
Sequences 5≡7 (`js/script.js:158-164` / `:172-178`) and 6≡8 (`:165-171` / `:179-185`) are indeed two exact
duplicate pairs. But `"builder."` is the **opening** string of those four, not the terminal one: each deletes
8 characters and ends on `"software engineer."`. "'builder.' runs on 4 of 9 loads" describes a transient the
owner sees mid-animation, not the resting state — worth fixing before the owner answers Q7.

### C25 — §4.1's closing sentence contradicts its own sketch
**Severity:** minor · **Confidence:** high · **Spec lines:** L287 vs L185-188, L210, L229, L231, L262
L287: "No `m` or `s` variants are written in this spec." The sketch writes both throughout:
`site.footerCredit {s}` (L185), `meta.home.description {m}` / `ogDescription {s}` (L187),
`meta.post.description {s}` (L188), `home.contact.body {m}` (L210), `posts.*.title {s}` (L229),
`posts.*.excerpt {m}` (L231), `notFound.message {s}` (L262) — and L286 says existing text enters as `l`,
`xs` **or `s`**.
**Correct statement:** no *additional* `m`/`s` variants of fields already written at `l` are authored here;
the sizes the current site's strings naturally occupy are written.

### C26 — the `meta:` shape over-specifies three page types
**Severity:** minor · **Confidence:** high · **Spec lines:** L186-188
`lexchat/index.html` has no description and no OG tags; `privacy/index.html` has a description but no OG and
no canonical; `blog/post.html` has no OG (intentionally gained per §15 item 4). A uniform
`{ title, description, ogDescription }` per page type emits new, never-approved meta on privacy and lexchat
unless those sizes are explicitly `null`.
**Correct statement:** `meta.<page>` sizes must be nullable per page type, and the null cases named.

### C27 — D29's build-done page scan will fail on the `/12years/` redirect stub
**Severity:** minor · **Confidence:** medium · **Spec lines:** L76 (D29) vs L135-138, L510
D29 asserts "every emitted page has exactly one `#tc-dock`, one `#tc-scrim`, one `__THEME_REGISTRY` and at
least one `.tc-nav-item`". The `redirects` entry emits `dist/12years/index.html` as a bare
`<meta http-equiv="refresh">` stub (confirmed in Astro's docs: "This will produce a client redirect using a
`<meta http-equiv="refresh">` tag and does not support status codes"), which has none of the four.
**Correct statement:** the scan must skip redirect routes (and any future non-Shell route).

### C28 — D18 reverses a locked intent decision without labelling it as such
**Severity:** minor · **Confidence:** high · **Spec lines:** L65 (D18) vs intent §4.10
Intent §4.10 (locked): "`CNAME` and `.nojekyll` ride in `public/`." D18 does the opposite and keeps them at
the repo root. Both of D18's stated reasons check out — GitHub docs: "If you are publishing from a custom
GitHub Actions workflow, no `CNAME` file is created, and any existing `CNAME` file is ignored and is not
required"; and `upload-pages-artifact@v5`'s `action.yml` does declare `include-hidden-files` with
`default: "false"` and applies `--exclude=.[^/]*` when it is not `'true'`. So the decision is sound; it is
just never flagged as a reversal of a §4 lock, and §16's traceability table does not map D18 to §4.10.
Same pattern, smaller: D5 keeps mermaid on CDN and declines Vite chunking, both against intent §4.12's
letter ("move from CDN to npm so Vite can split them per theme"), with reasons given but no "this reverses
§4.12" label.

### C29 — two third-party framings that are true but would mislead
**Severity:** minor · **Confidence:** high
- **L825-826, "no browser download at 1.61.1".** The revisions are exactly as claimed
  (`@playwright/test@1.61.1` → chromium **1228** and chromium-headless-shell **1228**; 1.63.0 → **1243**),
  but "no download" is a fact about *this machine's* `~/Library/Caches/ms-playwright`, not about the package.
  A fresh checkout or any CI runner will still download 1228. The rest of the sentence (Playwright garbage-
  collects unused builds) is correct.
- **L68/L698, the `GITHUB_TOKEN` exception.** GitHub's wording is "`workflow_dispatch` **and
  `repository_dispatch`** events always create workflow runs". The spec names only `workflow_dispatch`, which
  is the one it uses, so nothing breaks — the list is just incomplete.
- Related, L281: `astro:config:setup` exists with every property the spec relies on, but "throw to fail the
  build" is **not** documented anywhere in the Integration API reference. It works in practice; do not cite
  docs for it (same posture the spec already takes for `astro:build:done` in D10).

### C30 — `trailingSlash: 'always'` does not do what D2 implies
**Severity:** minor · **Confidence:** high · **Spec lines:** L49 (D2), L130
Astro's docs: `trailingSlash` is `'always' | 'never' | 'ignore'` (default `'ignore'`) and controls **route
matching** — "routes will only match URLs that include a trailing slash". The emitted file layout is
`build.format: 'directory'`, which D2 also sets. The configuration is correct; the rationale ("The rest
matches GitHub Pages and today's URL shape") blurs the two, and an implementer debugging output paths would
look in the wrong option.

---

## Verified correct (load-bearing claims that held)

**Current code — theme engine**
- `js/theme-bootstrap.js:637` `ORDER` has exactly 16 ids = `default` + 15 skins. The spec's "the default
  theme and the 15 active skins (16 themes)" (L31, L361) is right; the **intent's** "Sixteen active skins in
  ORDER: default, brutalist, …" is the loose one.
- The seven `window.__*` globals (L420-431) are the complete set the bootstrap defines:
  `:8, :639, :640, :646, :654, :664, :700`. (Adjacent, not the bootstrap's, so the count stands:
  `window.__restartTypingSequence` at `js/typing-engine.js:637` is a dead eighth global whose comment and
  `js/script.js:12` both claim the cycler calls it on live style switch — it does not; `switchStyle()`
  navigates instead. Worth deleting in T4, not a spec error.)
- `<html>` attributes `data-style` / `data-still` / `data-no-tilt`, non-default only, at `:703-706` — exact.
- The ramp: `STEPS` = 19 entries (`:671`) × 5 roles + 5 base = **100 properties**, `hsla()` with
  `toFixed(0)`, at `:764-774` — cite and arithmetic both exact. It runs unconditionally, so the default theme
  does get it (one nuance the spec omits: the default also gets the palette-toy override at `:728-742`).
- Link append order fonts → `theme-base.css` → skin sheet, appended to the end of `<head>`, **each with
  `data-style-asset="1"`** (`:715-721`) — L416-417 exact. This is what makes §5.4's "ThemeAssets last" the
  right parity position, and it means the new side's attribute matches.
- All six registry field counts (L342-351): `tokens` 15/16, `fonts` 14/16 (not default, not grid),
  `random` 3/16 (`studio` `:33`, `brutalist` `:82`, `marquee` `:591`), `flags` 14/16 (not default,
  not miami-deco), `typing` 8/16, `typingDelete` marquee only (`:575`). The runtime blob's field list (L425)
  covers every field any consumer reads.
- `theme-cycler.js:276` — every switch is `window.location.href = '/?style=' + …`, always root (L58 exact).
- `theme-cycler.js:558-559` early-returns with no `.tc-nav-item`; independently confirmed that
  `privacy/index.html`, `404.html` and `lexchat/index.html` load the cycler and never load `nav-config.js`
  (the only source of `.tc-nav-item`, `js/nav-config.js:105`), so they get no picker today (L59 exact).
- Every kept constant in §5.5: `MEASURE 940` (`:596`), `EDGE 10` (`:597`), 300 ms hover-close (`:706,:723`),
  440 ms hide (`:676`), `void dock.offsetWidth` (`:647`), the `(hover: hover) and (pointer: fine)` gate
  (`:594`), Space-to-shuffle (`:768`), `dawson:palette` with **no** detail (`:191`), `loadAllFonts` after idle
  (`:761-762`), `sessionStorage` key `dawson-theme-cycler` (`:124`). All exact.
- `theme-cycler.js:462` composes `aria-label="${locked?'Unlock':'Lock'} ${r.label}"` — exact, and the §4.1
  picker prose list (L245-252) is **complete**: an exhaustive sweep of visitor-visible literals in
  `theme-cycler.js` found nothing missing. (One boundary note: the picker's entry-point label `Theme` lives
  in `js/nav-config.js:28-29`, outside the file §5.5 scopes; the prose sketch covers it at `nav.theme`.)
- Dock class names and ids (L453-454): `.tc-dock .tc-mega` `:512`, `#tc-dock` `:513`, `.tc-presets` `:525`,
  `.tc-schemes` `:529`, `.tc-action` `:542-544`, `.tc-role`/`.tc-sw` `:457-458`, `#tc-scrim` `:568-569`, both
  body-parented. The stale "all 20 skins" comment is at `:509` — exact.
- Determinism premise (L634): `js/typing-engine.js:165` is the masthead pick, and it is the **only**
  `Math.random()` that can fire on home or the listing before capture. `theme-cycler.js`'s five draws
  (`:59,106,114,255,258`) are all behind `randomize()`, reachable only from Shuffle (`:574`) or Space
  (`:768`); `boot()` (`:747-770`) consumes no randomness. Post-asset draws live on posts where
  `typing-engine.js` is not loaded. The premise is stronger than the spec claims.
- `loadAllFonts` count of 14 (L806) — 14 unique font URLs, deduped by a `Set` and by an existing-`<link>`
  check (`:373,378-380`), so 14 new requests on default and 13 on a skinned page.
- D13's four active skins that style `.privacy-*`/`.nf-*` (L60) — `banknote`, `gallery`, `grid`, `neo-pop`.
  (`constructivist.css` also has them but is a retired sheet, not in `ORDER`, so the spec's list is right.)

**Current code — blog, home, assets**
- Frontmatter parser `blog/blog-post.js:32-48` splits on the first colon (`:38`), which is why
  `blog/posts/helm.md:2`'s colon survives — exact.
- All three renderer overrides at `:4-30` and their exact emitted markup; **marked is pinned at 18.0.5**
  (`blog/post.html:21`) and the existing overrides already use marked 18's token-object signatures
  (`link({href,title,tokens})`, `image({href,title,text})`, `code({text,lang,escaped})`), so "copied from
  `blog-post.js:4-30`" carries no migration risk.
- JSON-LD field set at `:56-88` — exact, including the `description`/`keywords` conditionals.
- Read time: `Math.max(1, Math.round(words / 200))` from `innerText` (`:176-179`) — the formula is exactly as
  written, and there is no pluralisation, matching the `{n} min read` template.
- Mermaid loads and runs unconditionally today (`blog/post.html:22`, `blog-post.js:172`), so §7's lazy load
  is a real change — correctly listed in §15 item 8.
- `scripts` chained sequentially (`:114-125`), `styles` a plain `forEach` (`:127-135`) — exact; three posts
  carry them (`gemma4-heretic-ara.md:4-5`, `metr-doubling.md:4-5`, `underviewed-art.md:4-5`).
- Listing card markup `blog/blog-listing.js:127-139` with `data-aos-delay="${i * 50}"` at `:131`; tags sorted,
  no "All" pill (`:94,102-104`); `AOS.init({offset:50})` at `:178` with refresh-on-resize `:174-176`.
- Link rewrite counts (D19): `../../resources/` in exactly **six** posts (arena-freshness, autoencoders-1,
  autoencoders-2, college-projects, embedded-swift-agent, helm); `post.html?id=` in exactly two
  (`autoencoders-1.md:200`, `autoencoders-2.md:6`). An exhaustive sweep for other relative body forms
  (`./`, `assets/`, `posts/`, `12years/`, bare `resources/`, raw-HTML `src=`/`href=`) found none. The
  frontmatter `posts/assets/…` paths are separately covered by D19's own sentence.
- Chart fetch URLs: `cohorts-chart.js:642,657,663,682` and `job-market-chart.js:12` are page-relative;
  `ai-job-market` genuinely has no `.md`. `refresh-chart-data.yml:28-30` and
  `docs/prebake-cohort-data.py:27` both currently write `blog/posts/assets/`.
- Harness matrix content claims: `toolbelt.md` has 2 mermaid fences (`:17,:27`) + bash + json;
  `embedded-swift-agent.md` has 9 swift fences + 1 c fence + an image; `metr-doubling.md:4-5` loads Plotly
  2.27.0, js-yaml 4.2.0 and its own asset pair. All exact.
- 11 `.md` files; 10 active `BLOG_POSTS` + one commented out at `js/blog-data.js:122-129` — §17 items 4 and 5
  are both correct. 8 `FEATURED_PROJECTS`, so "8 cards and 8 dots with one active" holds.
- Section numbers: 5 `.sec-num` on home (`index.html:97,144,218,243,264`), 2 on the listing
  (`blog/index.html:76,96`) — exact. Hero subtitle separator is exactly `&nbsp;|&nbsp;` (`index.html:79`).
- `<br><br>` counts (D15): about body 3 (`index.html:105,107,109`), skills body 3 only (`:128`), and 7 of 8
  project descriptions (`js/blog-data.js:6,25,39,53,65,77,89`; `deep-rl` at `:101` is one paragraph) — exact.
- `SCROLL_THRESHOLD: 300` (`js/nav-config.js:21`) and the Calendly URL built from `--bg`/`--text`/`--primary`
  with fallbacks (`:38-48`) — exact.
- Ticker constants (D14/§8): `TICKER_CHARS_PER_SEC = 402 / 46` (`js/featured-carousel.js:386`),
  `TICKER_SEP = '✷'` (`:376`), `TICKER_PASSES_PER_HALF = 2` (`:382`), dedupe (`:390-399`), assignment on
  `<html>` at **`:413-414`** — §17 item 1's correction of the research is right.
- **The marquee ticker unit is exactly right.** `css/themes/marquee.css:572` is 804 characters; the unit
  `✷ WEB ✷ iOS ✷ VISIONOS ✷ MACHINE LEARNING ✷ REINFORCEMENT LEARNING ` is 67 including the trailing space;
  `unit × 12` is byte-equal to the literal. No parity break in D14.
- **The doodle escape is safe.** `css/themes/doodle.css:535` is `content: 'currently here \2713';`. `\2713`
  is U+2713 and the escape is terminated by the closing quote, so CSS's "consume one following whitespace"
  rule never fires; `var(--prose-currently-here)` round-trips identically. (Worth one line in the build's
  escaping rule for a future mid-string escape followed by a space.)
- **The `content:` audit is effectively complete.** 69 `content:` declarations across all 22 non-vendor
  sheets; exactly three carry English words: marquee's ticker, doodle's "currently here", and
  `css/themes/blueprint.css:652` `content: "FIG. " counter(…)`. The third is already routed to Q6 by D14's
  own sentence, so L61's "the only two … made of words" is a wording slip against its own row, not a missed
  string. Everything else is glyphs, punctuation and counters.
- `404.html:18-40` inline `<style>` with `.nf-*` and absolute paths (`:13-16,:69`); `blog/post.html` is a
  full page today, not a shim; `12years/` is 3 files with gsap **3.12.5** + ScrollTrigger and page-relative
  images (`:9-10,:850-851`), body prose 384 words ("~395" is fine);
  `embedded-swift-agent/` is exactly 4 files with the bare `+esm` import at `agent.js:11-18`.
- Sitemap facts (D24, Q2): `color-randomizer` at `sitemap.xml:27-32` is a live 404;
  exactly **three** `lastmod` values disagree with the post date (`helm` `:47`, `embedded-swift-agent` `:59`,
  `metr-doubling` `:71`); `gemma4-heretic-ara` is present in the sitemap (`:39-44`) and commented out of the
  listing. (Extra, not in the spec: the sitemap omits `autoencoders-1`/`-2` entirely, and for `helm` and
  `metr-doubling` it agrees with `BLOG_POSTS` against the `.md` — which is Q1's conflict, seen from a third
  source.)
- L521's embedded-swift-agent claim is true, all three references found: `js/blog-data.js:29`,
  `blog/posts/embedded-swift-agent.md:201`, `sitemap.xml:64`. (`/12years/` by contrast has zero inbound
  links, so its meta-refresh stub is its only path.)
- No `<noscript>`, no `<form>`, no `<input>`, no `placeholder` anywhere on the site — the prose model does not
  need keys for them.

**Third-party**
- Astro 7.3.1 is published and latest; `engines.node` is exactly `>=22.12.0` with no upper bound.
- `compressHTML` is `boolean | "jsx"` and **defaults to `'jsx'`** in Astro 7 — D2's premise is correct, and
  `false` is the value that preserves whitespace.
- `prerenderConflictBehavior` is real: `'error' | 'warn' | 'ignore'`, default `'warn'` — exactly as D2 says.
- `build.format`, `build.inlineStylesheets: 'never'`, `markdown.syntaxHighlight: false`, `publicDir` — all
  valid with the stated values.
- `redirects` under static output: docs verbatim — "This will produce a client redirect using a
  `<meta http-equiv="refresh">` tag and does not support status codes."
- **Sätteri is real.** `astro@7.3.1` depends on `@astrojs/markdown-satteri@0.4.0` and no longer on
  `@astrojs/markdown-remark`. §17 item 2's correction of the research is right, and D6's caution is justified.
- `glob()` accepts `generateId` and `retainBody` (default `true`); `file()` accepts `parser`;
  `DataEntry.body` holds the raw markdown, so the custom `marked` path in D6/§7 works.
- `astro:build:done` receives exactly `{ pages, dir, assets, logger }` in Astro 7 — D10's cite is exact.
- `{ theme: undefined }` matching the bare root with a rest parameter is documented verbatim.
- `is:inline` and `set:html` on `<Fragment>` behave as §4.2/§5.4/§7 assume; `import.meta.env` genuinely
  cannot be read in `astro.config.mjs`, so D9's `process.env` choice is right.
- `@astrojs/sitemap@3.7.4` is published and latest; `filter` receives the **full URL** (docs say so), so
  `new URL(page).pathname` in the config sketch is correct; `serialize` can set `lastmod`.
- Playwright: `@playwright/test@1.61.1` published (1.63.0 latest); every option in §9 exists in 1.61 —
  `maxDiffPixelRatio`, `threshold`, `animations`, `caret`, `scale`; `webServer` accepts an **array**;
  `gracefulShutdown: { signal, timeout }` is a real per-server option; `snapshotPathTemplate`;
  `HtmlReporterOptions.open`; `addInitScript`; `emulateMedia({reducedMotion})`; `page.clock`; `route.abort`.
  `--grep` matches against tags too, so `@theme:<id>` sharding works (note it is an unanchored regex).
- Action versions on 2026-09-05 are **exactly** as D21 claims: `checkout` v7.0.1, `setup-node` v7.0.0,
  `upload-pages-artifact` v5.0.0, `deploy-pages` v5.0.1.
- GitHub docs confirm, verbatim: a custom Actions workflow ignores any `CNAME`; `workflow_dispatch` "only
  receives events when the workflow file is on the default branch" (§10 step 2 is right);
  `build_type` is a documented Pages-update field with `source` **not** required (§10 step 5's primary body
  works as written); `actions: write` is the documented permission for the workflow-dispatch endpoint.
- All twelve pinned npm versions in §14 exist. `astro@7.3.1` really does depend on `js-yaml@^4.3.0`
  (D-rationale exact) and js-yaml 5.4.1 really is latest. mermaid@11.15.0 unpacked size is **76,342,428
  bytes** = 76.34 MB. `boxicons@2.0.9` declares **exactly six** runtime deps including `react@^16.0.0` and
  `react-router-dom@^4.2.2`. `gsap@3.15.0` exists, so the `gsap-next` alias resolves.
- `highlight.js@11.9.0/lib/common` registers **exactly 36** languages.
- Node schedule: v25 `end: 2026-06-01` (EOL) and v24 Active LTS until `2026-10-20` — D1's dates are exact
  and v24 is the only Active LTS today. (Unstated but relevant: Node 26 exists and becomes LTS 2026-10-28.)

---

## Not verified

1. **`astro build` exit code on a thrown `astro:build:done` hook** (D10). Requires running Astro. The spec
   already scopes this to T0 with a `process.exit(1)` fallback — correct posture.
2. **Whether `globalThis.__proseUnwritten` survives Astro 7's static build** into the `astro:build:done` hook
   (D10). Depends on whether page rendering shares the hook's module realm. Plausible; T0-shaped.
3. **Whether `404.astro` still emits `dist/404.html`** (not `dist/404/index.html`) under
   `trailingSlash: 'always'` + `build.format: 'directory'`. Correctly listed as T0 item (d).
4. **Whether `astro:build:done`'s `pages` array includes `redirects` routes** — the premise of C27. Needs a
   build.
5. **Whether the last legacy Pages deployment keeps serving between §10 steps 5 and 6** (L712). Not stated in
   the docs I could reach; only observable at cutover. If it does not, the site is dark between the flip and
   the merge — worth adding a rollback note to step 5.
6. **Whether `gh workflow run` validates `-f` inputs against the ref's workflow file or the default
   branch's** (§10 steps 2 and 4). Affects whether the dispatch-only copy on `main` must also declare the
   `deploy` input. Not documented clearly; T7 would surface it.
7. **Node 24's native TypeScript stripping for `node src/prose/check.ts`** (L322-323). Type stripping is
   unflagged on recent Node lines, but I did not confirm the exact behavior on 24 for a file importing other
   `.ts` modules (`src/prose/drafts.ts`).
8. **`@astrojs/sitemap@3.7.4` compatibility with Astro 7** — the package declares **no** `peerDependencies`
   and no `engines`, so the registry neither confirms nor denies it. Worth an explicit T0 check.
9. **The exact 12 sentinel selectors per page type** (L608-610) — deferred to T1 by the spec, so
   unresolvable here. Note that four of the eleven listed sentinel kinds (nav item, masthead, card, section
   number) do not exist on privacy, 404 or lexchat, so "12 per page type" cannot be literal.
10. **§17 item 3's arithmetic** ("a seed of 3 yields index 6") — requires executing mulberry32. Moot for the
    spec, which pins indices rather than seeds.
11. **Whether the harness's ~15-minute full-sweep estimate holds** (L621) for 16 × 8 × 2 plus states with a
    15-second settle ceiling. An estimate, not a claim.
12. **Non-hermetic harness runs.** The old side loads jQuery, GSAP, AOS, vanilla-tilt, Boxicons, Font Awesome,
    highlight.js, marked, mermaid, Plotly and js-yaml from live CDNs, none of which is in the `route.abort`
    list (L638-641). §9 check 4 ("no 4xx/5xx on either side") therefore depends on live CDN availability. Not
    a factual error — flagging it because it is a determinism hole the spec does not name.
