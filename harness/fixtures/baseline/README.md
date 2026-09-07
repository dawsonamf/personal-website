# Baseline fixtures (S1-02)

Immutable references captured from the OLD site. Everything here is derived from one frozen
checkout; nothing is hand-authored.

## The baseline checkout

| | |
|---|---|
| Baseline SHA | `0f196d094ad64383ec58df5472fc12d403f846b3` (`main`, detached) |
| Expected worktree | `../personal-website-old` relative to the repo root |
| Override | `PARITY_OLD_DIR=<abs path>`, required when the repo root is not the main checkout (for example an agent worktree) |

`harness/baseline.ts` `oldDir()` resolves that directory, reads its HEAD from the vcs files
directly (no subprocess) and throws unless it is the baseline SHA. `.git` is handled both ways: a
plain clone has a `.git` **directory**, a linked worktree has a `.git` **file** holding
`gitdir: <path>`; either way HEAD must be a detached 40-hex SHA, and a `ref:` HEAD throws. `oldDir()`
is the only door to the checkout, so the pin covers every path that reads or vm-executes a baseline
file, not just the Playwright config; the verified directory is memoized, so the check runs once per
process.

## The three fixtures

| File | What it is | How it is captured |
|---|---|---|
| `theme-html.json` | The pre-cycler `<html>` for all 16 themes: the `data-*` attributes, every inline declaration in authored order, and the `[data-style-asset]` links | Browser. Each theme's **privacy** page is loaded over the served baseline with `/js/theme-cycler.js` aborted, then `documentElement`'s `data-*` attributes, `[...style]` and `head link[data-style-asset]` are read verbatim |
| `content.json` | `FEATURED_PROJECTS`, `BLOG_POSTS` and the 8 local post ids | Node. `js/blog-data.js` executed in `node:vm` with a stub `window` (`baseline.ts` `content()`) |
| `masthead.json` | Both `startTypingSequence({…})` call sites as authored, including home's `onNewlineCount`, plus the text each `type` step lands on | Node. The call argument is sliced out of the frozen source and evaluated in `node:vm`, resolving one identifier per `ReferenceError` (`baseline.ts` `masthead()`) |

None of them carries a timestamp. Re-deriving must be byte-identical; `@capture:content` and
`@capture:masthead` compare `JSON.stringify(fn(), null, 2) + '\n'` to the committed bytes, and
`@capture:theme-html` compares the parsed object.

### Regenerating

From the main checkout:

```bash
PARITY_MODE=old-old PARITY_UPDATE_FIXTURES=1 npm run test:parity -- --grep '@capture:'
PARITY_MODE=old-old npm run test:parity -- --grep '@capture:'   # verify: 3 passed
```

From a worktree (or anywhere the baseline is not `../personal-website-old`):

```bash
PARITY_OLD_DIR=/abs/path/to/personal-website-old PARITY_MODE=old-old PARITY_UPDATE_FIXTURES=1 npm run test:parity -- --grep '@capture:'
PARITY_OLD_DIR=/abs/path/to/personal-website-old PARITY_MODE=old-old npm run test:parity -- --grep '@capture:'
```

`PARITY_UPDATE_FIXTURES=1` writes. Without it the three tests are integrity checks, and a **missing**
fixture fails with `fixture missing, rerun with PARITY_UPDATE_FIXTURES=1` rather than being written
silently (a silent write would let a deleted fixture pass as green).

### Why the privacy page, not home

`privacy/index.html` loads exactly two scripts: the blocking bootstrap (`:18`, which has already run
by `load`) and the deferred cycler (`:128`). The cycler is what rewrites the palette after
`DOMContentLoaded`, so aborting it is what makes this a pre-cycler capture, and nothing else on the
page touches `documentElement`.

Home would need two aborts, not one: `js/featured-carousel.js:413-414` also writes `--ticker-run`
and `--ticker-dur` onto `<html>` on every theme, which are D35 page-composition facts and not part of
`themeHtml()`'s projection (§5.4). It would also be deterministic only by accident: `script.js:24`
adds `hero-extras-in` to `<html>` from the masthead callback, and it is skipped solely because
aborting the carousel makes `script.js:377` throw first.

The capture checks itself against its own source: the same `page.evaluate` reads
`window.__THEME_REGISTRY[id].tokens` (the bootstrap exposes the registry at `theme-bootstrap.js:639`)
and Node asserts that the declaration names which are **not** ramp equal those token names in order.

### The two ramp formats (§5.4), preserved verbatim

Per role, in registry order `text, bg, primary, secondary, accent`:

- the **base role** (`--text`) is the registry entry's **raw hex string**, never converted
  (`theme-bootstrap.js:766`), for example brutalist `--text` = `#0a0a0a`;
- the **19 steps** (`--text5` … `--text95`) are `hsla(H,S%,L%,A%)` with `toFixed(0)`, no spaces and
  a percentage alpha (`:769-772`), for example brutalist `--text5` = `hsla(0,0%,4%,5%)`.

5 roles × 20 = 100 ramp properties. A non-default theme's `style` is its 8-9 `tokens` **first**
(`:707-711`), then the ramp; the default theme gets the ramp and nothing else.

`attrs` holds **only `data-*` attributes**: `data-style`, `data-still` and `data-no-tilt` on
non-default themes (`:704-706`), and `{}` on `default`. The authored `lang="en"` is markup, not
projection, and the serialized `style` attribute is only the string form of the declarations already
recorded in `style`, so neither is stored. `links` is `fonts…, /css/themes/theme-base.css,
<skin sheet>` (`grid` has no font, so it has exactly two).

`@capture:theme-html` asserts all of that per theme, plus: the token declarations equal the registry
entry's `tokens` in order; `attrs` keys are a subset of the three bootstrap attributes, which is also
the assertion that D32's `data-typing` / `data-typing-delete` (§15.10) cannot exist in the old
capture; and the default has exactly 100 declarations, `attrs === {}` and no links.

## Runner shape

`PARITY_MODE` is **required**: unset or invalid throws
`Set PARITY_MODE=old-old (old-new arrives with S1-13)`. It also gates the config, so the two parity
servers and the baseline SHA pin run only for a parity run; `tests/browser/**` specs (which own their
own servers) load the same config and get `webServer: undefined`.

| | |
|---|---|
| Projects | `desktop-1440` (1440×900) and `mobile-390` (390×844, `isMobile`, `hasTouch`) run the 128 comparison tests each (`grepInvert: /@capture:/`); `capture` (1440×900) runs the three `@capture:` tests and nothing else. 259 tests total |
| DPR | 1 everywhere; screenshots `scale: 'css'` |
| Servers | `python3 -m http.server --bind 127.0.0.1 {8781,8782} --directory '<baseline>'` (single-quoted, so a directory holding `$` or a backtick is safe), `reuseExistingServer: false`, `gracefulShutdown: SIGTERM/500 ms` |
| Snapshots | `harness/__parity__/snapshots/{projectName}/{arg}{ext}`, no `{platform}` |
| Reports | `harness/__parity__/report` (`open: 'never'`), plus the list reporter |
| Dumps | `harness/__parity__/dumps/<project>/<theme>/<pageId>/settled/<side>.{response.html,dom.txt,styles.json,network.json,scripts.json,png}` |

Everything under `harness/__parity__/` is gitignored, and `testIgnore`s it so a stray `.spec.ts` in
the output tree is never collected.

**Test titles.** `@theme:<id> @page:<type> [@post:<id>] @state:<name>`, for example
`@theme:brutalist @page:post @post:toolbelt @state:settled`. S1-03 adds the interaction states under
the same `@state:` tag. The fixture tests use a separate grammar, `@capture:<fixture>`, so the two
comparison projects can exclude them with one `grepInvert`.

**Pointer guard.** `matchMedia('(hover: hover) and (pointer: fine)').matches` is asserted on **every**
context that is compared, before navigation. `viewport: {390, 844} + isMobile + hasTouch` gives
`false` and `desktop-1440` gives `true`, so plain viewport emulation satisfies §9's guard; the
`devices['iPhone 13']` fallback was not needed. A failing guard closes its context before throwing.

**Both sides get one option object.** A manual `browser.newContext()` does not inherit `use`, so
`contextOptions(testInfo)` builds `{viewport, deviceScaleFactor, isMobile, hasTouch, colorScheme,
reducedMotion}` from `testInfo.project.use` and both sides are opened with it. Note that Playwright
1.61.1 has no top-level `reducedMotion` use-option: the config sets
`use.contextOptions.reducedMotion`.

**Screenshot direction.** OLD writes the reference at
`testInfo.snapshotPath(theme, pageId, 'settled.png', {kind:'screenshot'})` on every run and NEW is
compared against it. The test asserts that path equals the template's own output, because a
mismatch would let `toHaveScreenshot` create a NEW-generated reference on the second run.

**Astro guards.** Normaliser step 3 counts the stripped `data-astro-*` attributes and the rewritten
`/_astro/<hash>` URLs per side and reports them as an `astro-guards` test annotation
(`old {…} new {…}`). §9 asks for the count, not an assertion: the canonical family should emit none,
and in old-old both sides emit none by construction.

## Sentinels (`harness/sentinels.ts`)

12 per page type, each asserted to match **exactly one** element on both sides. §9's rule is `html`,
`body`, logo, one nav item, masthead, one section header **and** its number, one body paragraph, one
card, one pill/chip, one CTA, the footer credit.

| Slot | home | blog | post |
|---|---|---|---|
| html | `html` | `html` | `html` |
| body | `body` | `body` | `body` |
| logo | `.name-logo` | `.name-logo` | `.name-logo` |
| nav item | `.static-menu .menu-list > li:first-child > a.menu-item` | same | same |
| masthead | `#typing-text` | `#blog-typing-text` | `#post-title` |
| section header | `#about-section-header` | `#selected-works-header .section-header` | `.blog-post-header` **[sub]** |
| section number | `#about-section-header .sec-num` | `#selected-works-header .sec-num` | `#read-time` **[sub]** |
| body paragraph | `.about-text` | `#blog-sub-text` | `#post-content > p:first-of-type` |
| card | `#featured-track > .fc-card:first-child` | `#blog-grid > .blog-card-wrapper:first-child` | `.blog-post-container` **[sub]** |
| pill / chip | `#featured-track > .fc-card:first-child .fc-card-tech > .pill:first-child` | `#filter-bar .filter-pill:first-child` | `#post-meta .pill:first-child` |
| CTA | `.blog-see-all .text-link` | `#featured-track > .fc-card:first-child .fc-card-cta` | `.static-menu .menu-list a.resume-link` **[sub]** |
| footer credit | `.footer-text` | `.footer-text` | `.footer-text` |

| Slot | privacy | notFound | lexchat |
|---|---|---|---|
| html | `html` | `html` | `html` |
| body | `body` | `body` | `body` |
| logo | `.name-logo` | `.name-logo` | `head` **[sub]** |
| nav item | `.header-menu-container` **[sub]** | `.header-menu-container` **[sub]** | `head > title` **[sub]** |
| masthead | `.privacy-header` | `.nf-code` | `head > meta[charset]` **[sub]** |
| section header | `.privacy-content > h2:first-of-type` | `.nf-container` **[sub]** | `head > meta[name="viewport"]` **[sub]** |
| section number | `.privacy-header-spacer` **[sub]** | `.footer-container > .footer-spacer:first-child` **[sub]** | `head > link[rel="icon"]` **[sub]** |
| body paragraph | `.privacy-content > p:first-of-type` | `.nf-text` | `head > link[rel="apple-touch-icon"]` **[sub]** |
| card | `.privacy-content` **[sub]** | `#main-body` **[sub]** | `head > link:nth-of-type(3)` **[sub]** |
| pill / chip | `.privacy-meta .pill` | `.footer-text-mobile` **[sub]** | `head > link:nth-of-type(4)` **[sub]** |
| CTA | `.privacy-content .text-link` | `.text-link` | `head > script` **[sub]** |
| footer credit | `.footer-text` | `.footer-text` | `iframe.lexchat-iframe` **[sub]** |

### Substitution rationale

- **post / section header → `.blog-post-header`.** No `.section-header` exists on a post, and the
  markdown `h2` count differs per post (toolbelt 4, embedded-swift-agent 6, metr-doubling 0), so
  nothing derived from the body is stable across the three matrix posts.
- **post / section number → `#read-time`.** No `.sec-num`; the read-time span is the only numeric
  chrome and `blog-post.js:165` writes it for every post.
- **post / card → `.blog-post-container`.** A post renders no card grid; the `<article>` is the only
  boxed surface.
- **post / CTA → `.static-menu .menu-list a.resume-link`.** No in-page CTA; the Résumé link is the
  one CTA-styled affordance present on all three matrix posts. Scoped, because `.resume-link`
  unscoped matches three menus.
- **privacy & 404 / nav item → `.header-menu-container`.** Neither page loads `js/nav-config.js`, so
  no nav item exists; this is the header bar the nav would occupy.
- **privacy / section number → `.privacy-header-spacer`.** The numbering is baked into the `h2` text
  ("1. Information Collection"), so there is no number element; the header rule is the structural
  sibling `.sec-num` would have been.
- **privacy / card → `.privacy-content`.** No cards; this is the page's single content panel.
- **404 / section header → `.nf-container`.** The page's only content section, and it carries no
  header element.
- **404 / section number → `.footer-container > .footer-spacer:first-child`.** No numbering anywhere;
  the footer rule is the only decorative spacer (there are two, hence the scoping).
- **404 / card → `#main-body`.** No cards; the page shell is the only container.
- **404 / pill → `.footer-text-mobile`.** No chips; the one remaining standalone text token, and it
  exercises the mobile branch (`.footer-container` is `display:none !important` ≤1100px).
- **lexchat / everything but `html`, `body` and the iframe.** The page's entire body is one
  `<iframe>` (`lexchat/index.html:13-16`) and the cycler injects nothing here
  (`theme-cycler.js:557-558` returns without a `.tc-nav-item`), so the settled DOM has 13 elements
  and 12 sentinels means "all of them but one". The `link` slots use positional
  `:nth-of-type` rather than `href`, because the bootstrap appends its `[data-style-asset]` links
  after these four and because the hrefs move under S1-13.

`.static-menu` (≤1100px) and `.footer-container` (≤1100px) are `display:none` on mobile but stay in
the DOM, so their counts and computed styles are compared on both viewports.

### Screenshot policy

| Page type | `fullPage` | `mask` | masthead text asserted |
|---|---|---|---|
| home | `false` (S1-03 owns the scroll states) | `#typing-text` | `#typing-text` |
| blog | `false` | `#blog-typing-text` | `#blog-typing-text` |
| post | `false` | none | none |
| privacy, notFound, lexchat | `true` | none | none |

Only the typed element is masked, not its `#typing-left` / `#blog-typing-left` wrapper: the wrapper
also holds the deterministic standfirst (`#sub-text`, and the three `#blog-sub-text*` paragraphs),
and those pixels are compared. The typed element's own box is height-reserved by
`typing-engine.js reserveHeight()`.

### Computed-style sample (§9 check 3)

On `<html>`: **every** `--*` custom property, not only the inline ones. The names come from
`[...getComputedStyle(root)].filter(n => n.startsWith('--'))` united with `[...root.style]` and the
five colour roles, because skin sheets declare tokens in CSS (`css/styles.css` `:root`,
`css/themes/banknote.css` `[data-style="banknote"]`) and Chromium does enumerate those in computed
style. Verified on the baseline: `default` samples 116 `--*` names on privacy (100 ramp plus 16 from
`styles.css` and Font Awesome) and `banknote` 117, the extra one being `--banknote-corner-rings` from
its skin sheet.

Then `color / background-color / font-family / font-size / line-height / border-radius` on the 12
sentinel selectors.

## `settle(page, pageType)`

One 15 s deadline for all the steps; expiry throws with the page type, the step and the outstanding
detail. Never skips.

1. `load` fired.
2. **(a) An idle fence.** After `load`, one `requestIdleCallback(…, {timeout: 2600})` (falling back
   to a 2600 ms timer). The cycler queues its `loadAllFonts` with `requestIdleCallback` at
   `theme-cycler.js:762` with `{timeout: 2500}`, before `load`, so an idle callback queued after
   `load` runs after it and the font `<link>`s it appends are already in the document. This replaces
   the old `window.__THEME_REGISTRY`-gated font-href predicate, which could only run on the baseline;
   the fence is registry-free and behaves identically on the migrated side (S1-13).
   **(b)** Then, polled every 100 ms: `head link[rel="stylesheet"]` count unchanged for 500 ms, and
   `document.fonts.ready` resolved with `document.fonts.status === 'loaded'`.
3. Every `[data-aos]` whose rect intersects the viewport has `aos-animate`.
4. `document.getAnimations()` has no `playState === 'running'` animation with finite iterations
   (infinite ones, marquee tickers and the caret blink, are cancelled by the screenshot's
   `animations: 'disabled'` instead).
5. `sentinels[pageType].ready(page, deadline)`:
   - **privacy**: `.privacy-header` has text and `.privacy-content` exists.
   - **lexchat**: `iframe.lexchat-iframe` exists. Its host is in the abort list, so the embed never
     loads; that is by design on both sides.
   - **notFound**: when `?style=` is present and not `default`, `documentElement.dataset.style`
     equals it and every `link[data-style-asset]` has a non-null `.sheet`. Otherwise it passes.
   - **home / blog**: the masthead's text equals one of `masthead.json`'s **final** terminals
     (with `\n` removed, since the engine emits `<br>`, and `U+200B` stripped), and exactly one
     typing anchor exists. `animation-name === 'blink'` is asserted on the `.cursor` variant;
     eight registry themes pick a cursorless `typing` mode and get `.tw-anchor`, which
     `typing-engine.js` never animates. **home also**: 8 `.fc-card`, 8 `.fc-dot`, exactly one
     `.active`.
   - **post**: `#read-time` matches `/^\d+ min read$/` and every `.mermaid` contains an `<svg>`.
6. **Step 4 again.** Readiness itself starts finite animations (the home and listing reveals fire off
   the masthead callbacks), so a single pass before step 5 settles the wrong moment. The second poll
   shares the same deadline.

Still open, marked `// S1-03:` in `sentinels.ts`: the 10 elements `anim-utils.js` pins on
`animationend`, `#highlight`'s inline geometry, and `--section-rule` stable across two rAFs.

## Abort list (§9, exact)

`assets.calendly.com`, `corsproxy.io`, `collectionapi.metmuseum.org`,
`openaccess-api.clevelandart.org`, `api.vam.ac.uk`, `www.getty.edu`, `framemark.vam.ac.uk`,
`media.getty.edu`, `www.metmuseum.org`, `raw.githubusercontent.com`, `dawsonamf-lexchat.hf.space`.

Non-deterministic APIs only. Google Fonts and the thirteen library CDNs are **never** blocked: the
old side needs them, and a CDN outage is a harness failure, not a regression.

Which is why check 4 asserts **two** things per side, not one: no response with a status ≥ 400, and
no `requestfailed` entry whose host is not in the list above. A CDN that never connects produces no
response at all, so it would otherwise pass check 4 silently. The aborted hosts stay inventory: they
are recorded in `<side>.network.json` and excluded from the assertion.

## Baseline network anomalies

None. Over the 96 utility-page tests (192 page loads) every one of 4521 responses was `200`. The
only `requestfailed` entries are the 64 deliberate aborts of `https://dawsonamf-lexchat.hf.space/`
(32 lexchat tests × 2 sides).

## What old-old deliberately does **not** normalize

Normaliser steps 6 and 8, the old→new URL map and §15's exception table, are the only side-aware
rules and are gated behind `mode === 'old-new'` (the hook is at the bottom of `normalize.ts`). In
old-old both sides are the same bytes, so `--prose-*`, relative hrefs, canonical/OG metadata, the
picker chrome and the post metadata are all compared **verbatim**. Anything old-old excluded would
be an exclusion S1-13 could never notice.

Two normaliser details worth knowing before you extend it:

- **Step 4 lowercases tag names only.** Attribute **names** keep their case, because the serializer
  has already lowercased every HTML attribute and preserved SVG camelCase (`viewBox`, `markerWidth`,
  `gradientUnits`), which the post dumps carry. The lowercased copy exists only for the
  `data-astro-*`, `style` and `rel` checks.
- **Step 5 collapses the HTML whitespace class** (`[ \t\n\r\f]`), not `\s`. U+2009, U+2028 and
  U+FEFF are left literal by the serializer and are content, not layout.

## Unit tests

`tests/unit/parity-normalize.test.ts` is **pure**: no browser, no server, no network and no baseline
checkout, so `node --test tests/unit/parity-normalize.test.ts` needs no environment at all. It covers
the normaliser and `parseDeclarations` only. The matrix shape (128 pairs / 16 themes / 128 unique ids
/ 8 per theme) is enforced at collection time in `harness/parity.spec.ts` instead, where a wrong
matrix stops the run rather than reporting zero failures, and the derivations (`themeOrder`,
`localPostIds`, `content`, `masthead`) are what the `@capture:` fixtures verify.

## Known baseline nondeterminism (S1-03's inbox)

Characterized with `--grep '@theme:(default|brutalist) @page:(home|blog|post)'`, 9 passed / 11 failed.
No 4xx, no request failure, no script-allow-list failure, no ambiguous sentinel and no
computed-style-sample failure appeared anywhere; every failure is DOM/screenshot drift from one of
three sources:

1. **Masthead sequence pick** (`typing-engine.js:165`, unseeded `Math.random`). Home's two distinct
   final terminals differ in their first word, so roughly half of home runs diff on one text line.
   On the listing it is worse than a text diff: the chosen sequence changes what `reserveHeight()`
   reserves, so `#blog-typing-text` came out `min-height: 81.5938px` on one side and `40.7969px` on
   the other, which shifts the whole page, moves the scroll scrub (`--section-rule` `0.2764` vs
   `0.3573`) and fails the screenshot. §9's `seedFor(index, n, draw)` fixes all of it.
2. **Intro-reveal pinning race.** `anim-utils.js:16` pins the final styles in an `animationend`
   handler, and `#about-section-header`'s fade is delayed 1.84 s. `settle()` step 4 used to run only
   before step 5, so a short masthead sequence could let the settle finish while the reveal was still
   running on one side and pinned on the other. Re-running step 4 after readiness (step 6 above)
   closed it: in this run every failing element already carried its pinned end state on both sides.
   S1-03 still owns the explicit predicate.
3. **Generated ids in post bodies.** Mermaid names its `<svg>` (and every rule of its injected
   `<style>`, and eight `<marker>`s) `mermaid-<epoch ms>`, so `toolbelt`'s two diagrams differ on
   every run; Plotly does the same with random hex in `clip*`, `defs-*`, `legen*`, `topdefs-*` **and
   the per-series `trace<hex>` class**, so `metr-doubling` differs too. `embedded-swift-agent`, no
   mermaid and no Plotly, passes on both viewports. These ids are intrinsically nondeterministic and
   are not a migration regression; S1-03 needs a normaliser rule or a deterministic id, not a widened
   tolerance.

## Consumers

- **S1-03** extends the test tags with interaction states, adds the remaining home/listing readiness
  predicates, and owns the determinism work above. The shortest listing sequence is **index 3**
  (`masthead.json` `blog.sequences[3]`).
- **S1-10** uses `theme-html.json` as the byte contract for `themeHtml()`. The recipe:

  ```ts
  expect(themeHtml(theme).attrs).toEqual(fixture.attrs);
  ```

  `attrs` is `data-*` only and the fixture is exact, so `default` must project `{}`. Compare `style`
  as a **declaration map** (`parseDeclarations` from `harness/normalize.ts`, sorted by property), not
  as a string, and note first that the new side's page-level extras are **not** theme projection and
  are absent from the fixture by construction: `--prose-*` (D14, marquee/doodle) and
  `--ticker-run` / `--ticker-dur` (D35, pages that render the carousel). Compare `links` **verbatim,
  in order**: fonts, then `/css/themes/theme-base.css`, then the skin sheet.
- **S1-13** turns on the old-new hook in `normalize.ts`, adds `urlPairs()`'s old-new branch, and
  points 8782 at `dist` (the config already resolves it as `<repo root>/dist`). `settle()` no longer
  depends on any browser theme global, so step 2 behaves identically on the migrated side.
- **S1-05 / S1-06** treat `masthead.json` and `content.json` as the authoritative record of the old
  typing sequences and content registry.
