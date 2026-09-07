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
| Projects | `desktop-1440` (1440×900) and `mobile-390` (390×844, `isMobile`, `hasTouch`) run **480** comparison tests each (`grepInvert: /@capture:` &#124; `@only:<the other project>/`); `capture` (1440×900) runs the three `@capture:` tests and nothing else. **963 tests total** |
| DPR | 1 everywhere; screenshots `scale: 'css'` |
| Servers | `python3 -m http.server --bind 127.0.0.1 {8781,8782} --directory '<baseline>'` (single-quoted, so a directory holding `$` or a backtick is safe), `reuseExistingServer: false`, `gracefulShutdown: SIGTERM/500 ms` |
| Snapshots | `harness/__parity__/snapshots/{projectName}/{arg}{ext}`, no `{platform}` |
| Reports | `harness/__parity__/report` (`open: 'never'`), plus the list reporter |
| Dumps | `harness/__parity__/dumps/<project>/<theme>/<pageId>/<state>/<side>.{response.html,dom.txt,styles.json,network.json,scripts.json,determinism.json,interaction.json,png}`, plus `<side>.palette.json` for `@state:palette` |

Everything under `harness/__parity__/` is gitignored, and `testIgnore`s it so a stray `.spec.ts` in
the output tree is never collected.

**Test titles.** `@theme:<id> @page:<type> [@post:<id>] @state:<name> [@only:<project>]`, for
example `@theme:brutalist @page:post @post:toolbelt @state:settled` and
`@theme:grid @page:home @state:masthead-0 @only:mobile-390`. Every state name is listed under
[Interaction states](#interaction-states-s1-03); `@only:` marks a state only one viewport can reach
and is what the two comparison projects exclude each other's copy of, so **nothing is skipped at
runtime**. The fixture tests use a separate grammar, `@capture:<fixture>`, excluded by the same
`grepInvert`.

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
`testInfo.snapshotPath(theme, pageId, '<state>.png', {kind:'screenshot'})` on every run and NEW is
compared against it. The test asserts that path equals the template's own output, because a
mismatch would let `toHaveScreenshot` create a NEW-generated reference on the second run.

**Astro guards.** Normaliser step 3 counts the stripped `data-astro-*` attributes and the rewritten
`/_astro/<hash>` URLs per side and reports them as an `astro-guards` test annotation
(`old {…} new {…}`). §9 asks for the count, not an assertion: the canonical family should emit none,
and in old-old both sides emit none by construction.

## Interaction states (S1-03)

`harness/interactions.ts` is the registry: one entry per state, with the page types the baseline
gives it an element on, an optional `@only:` project, and up to three hooks — `install` (an init
script, before `goto`), `run` (after `settle()`, before the capture) and `after` (once the capture
is written; only `palette`, which navigates). `statesFor(pair)` returns `settled` first and then
every applicable state, and `harness/parity.spec.ts` runs **all five §9 checks plus the screenshot
for every state**, exactly as for `settled`.

**A state applies wherever the baseline has the element, and a missing element is a failure.** The
applicability table below is also asserted at collection time as per-state counts, so a registry
edit that quietly drops a state stops the run instead of reporting a smaller green one.

| `@state:` | Pages | `@only:` | Target / gesture | End condition (asserted, never a sleep) | Evidence key |
|---|---|---|---|---|---|
| `settled` | all 8 | — | none | `settle()` | — |
| `masthead-0` | home | `mobile-390` | none — the seed pins home sequence **0**, the longest delete path | the index-0 instance of the [masthead path check](#the-masthead-path-not-just-its-last-line) every home and listing settle now runs | `terminals`, `seen` |
| `jobs-tab-2` | home | — | `#jobs-menu-list > li.job-menu-item:nth-child(2)` | 2nd `li` `.selected` and 1st not; `#job-2` alone `.showing`, `#job-1` `.hidden`, nothing mid-swap; `#highlight`'s inline geometry equals the viewport's branch of `script.js:283-301`; `transition` is the `animate=true` string | `jobs` |
| `carousel-dot-3` | home, blog | — | `#featured-dots > .fc-dot:nth-child(3)` | scroll started (`scrollLeft > 0`) **and** the 3rd dot is the only `.active`, then `scrollLeft` held for 300 ms | `carousel` |
| `carousel-wheel` | home, blog | — | two `mouse.wheel`s over `#featured-track`: a mixed one that the guard must pin, then a vertical one that scrolls the page | both wheels reached the track; `is-vertical-wheeling` appears in the class history **and** is gone again (the 140 ms gesture end); the track had horizontal room and `scrollLeft` is still where it started; something scrolled vertically | `wheel`, `pointer` |
| `sticky-nav` | home, blog, post | — | `scrollTo(0, 800)` then `scrollTo(0, 500)` | `.moving-menu` has `menu-sticky`, not `menu-invisible`; `scrollY === 500` | `sticky` |
| `smooth-scroll-contact` | home | `desktop-1440` | `.static-menu a.menu-item[href="#contact"]` | `scrollY` left its start and then rested 300 ms at `min(#contact top − 80, max scroll)`; unclamped, `#contact`'s rect top is 80 ± 1; then the section-header reveal state held still for 300 ms | `primedSteps`, `smoothScroll` |
| `picker-open` | home, blog, post | — | the one rendered `.tc-nav-trigger` (`.static-menu` desktop, `.static-menu-mobile` mobile) | `#tc-dock` not `tc-hidden` and `tc-mega-open`; `#tc-scrim.tc-on`; `aria-expanded="true"`; inline `top`/`right` written; no running dock animation | `picker` |
| `filter-swift` | blog | — | `#filter-bar .filter-pill[data-tag="Swift"]` | the pill is `.active`, and every `.blog-card-wrapper` has `filtered-out` **iff** its post's tags exclude `Swift` — expected membership derived from `content()`, matched by the card's own `href` | `filter` |
| `palette` | home, blog, post | — | the picker, then `#tc-randomize` | see [The palette record](#the-palette-record) | `storageKey`, `base`, `picker`, `shuffled`, `storageAfterShuffle`, `navigate`, `reload` |

`smooth-scroll-contact` is home-only because the target only exists there: on a subpage the nav
authors `../index.html#contact`, a real navigation, and `js/script.js` (which owns the jQuery smooth
scroll) is a home-only script. It is desktop-only because `MOBILE_NAV_LINKS`
(`js/nav-config.js:16-20`) has no Contact item at all. The utility pages carry no states: privacy
and the 404 render no `.tc-nav-trigger` on the old side, and LexChat is one `<iframe>`.

**Home is too short to honour the 80 px offset, and that is recorded rather than hidden.** Measured
on `desktop-1440`: the handler's own target is `4063.4`, the document's maximum scroll is `3699`, so
the landing clamps and `#contact` comes to rest with its top at `444.4`, not `80`. The assertion is
therefore on the clamped target — `scrollY` rests at `min(wanted, max)` — and the `rectTop ≈ 80`
assertion runs only when the page is long enough to reach it. `wanted`, `max`, `expected`,
`scrollY`, `rectTop` and `clamped` are all in the evidence, so the day a longer home page makes the
landing reachable, the stronger assertion turns itself back on.

### AOS's cache, and the two fixes for it

AOS decides from element offsets **cached at `load`** and reacts through a handler throttled at
99 ms. Because every `[data-aos]` on home and the listing carries `data-aos-once="true"` (6 of 6 and
2 of 2), `aos-animate` **latches**. `js/anim-utils.js:184-198` adds `section-header-in` from an
IntersectionObserver and `unreveal` takes it off again, so that one is live. Two different
divergences follow, and they need two different fixes.

**Position-independent: a cache taken at different moments.** Two sides whose offsets were cached at
slightly different points disagree about an element sitting near its trigger. Measured twice on
`marquee/blog` `sticky-nav`: one `.section-header-wrapper` latched on one side only, while the
state's own evidence (`menu-sticky` at `scrollY 500`) matched exactly.

`refreshAos(page)` runs before every interaction state's gesture, at the **settled** position that
`settle()` has already proven identical on both sides. `AOS.refresh()` recomputes every offset from
the live layout and applies the classes for the current offset synchronously (aos 2.3.1 `O`:
`prepare(…)` then `handleScroll(…, once)`), so the cache becomes identical too and every later
decision is a function of layout rather than of timing. The listing already calls it itself on
`resize` (`blog/blog-listing.js:174-176`); this is the same move `quiesceLayout` makes for the page's
scroll handlers.

*Where it is called matters.* Calling it **after** a gesture was tried and made things worse: the
result is then `latched-during-the-gesture ∪ in-view-at-refresh-time`, and the first half is still
path-dependent, so it added to the problem instead of erasing it. It fixed `marquee/blog`
`sticky-nav` and broke the contact block on `carousel-wheel`.

**Path-dependent: a gesture that crosses the whole document.** `smooth-scroll-contact` scrolls the
entire page in under a second, and across that crossing which of the two chains lands first is frame
timing. Measured: **6 of 16 themes** diffed, either on the class *order* on `#contact-header-wrapper`
(the same three classes, different insertion order) or on `#jobs-header-wrapper` /
`#blog-header-wrapper` never being revealed at all on one side.

`primeReveals` walks that page top to bottom a viewport at a time (80 % of `innerHeight` per step,
resting 150 ms at each — longer than AOS's throttle), returns to the top, settles, and then asserts
the latch: every rendered `[data-aos][data-aos-once="true"]` must carry `aos-animate`, or the state
fails. An element a skin hides outright never intersects and is exempt. Once everything is latched,
`section-header-in` can only ever be appended *after* `aos-animate`, which fixes the class order,
and `--section-rule` is a pure function of the scroll offset.

The per-step wait is deliberately not the full `afterInteraction`: on one skin a cache that had gone
stale left an element in view but below its own trigger point mid-walk. A later step passes that
point regardless, and the end-of-walk assertion still catches an element AOS can genuinely never
reach.

*Scope matters too.* The walk runs for this one state. Applying it to **every** interaction state was
tried and made things worse, not better: on `mobile-390` home — a very tall page whose carousel track
is itself taller than the viewport — it introduced fresh diffs in `carousel-dot-3`, `sticky-nav` and
`carousel-wheel` that were not there before, taking a 112-test home sweep from 2 failures to 9. The
cheap, position-independent half is what every state needs; the expensive walk is what only the
whole-document gesture needs.

### The mouse never moves, except once

Every click is `locator.dispatchEvent('click')` at the exact target, never `click()`/`tap()`, so
the pointer stays where the context opened it and `#cursor-container` stays at `opacity: 0` — §9's
rule, and what keeps the follower's inline `left`/`top` at the origin for every other state.

`carousel-wheel` is the one exception, and it is the state §9 asks for by name because a dot click
cannot exercise the vertical wheel guard: a dispatched click produces no `wheel` event on the track
at all, never sets `is-vertical-wheeling`, moves `scrollLeft` instead of pinning it, and does not
scroll the page. All four are asserted.

Two things the wheel needed, both measured rather than guessed:

- **Aim near the track's top, not its centre.** Chromium scrolls a passive-listener wheel on the
  compositor and only *then* dispatches the DOM event, hit-testing it at the **new** offset. A
  wheel aimed at the track's centre with `deltaY: 300` arrived at `<main>`, with the track already
  exactly 300 px higher. So the pointer is aimed 24 px inside the track's **visible** top edge (the
  mobile track is taller than the viewport, so `scrollIntoView` leaves its real top off-screen) and
  `deltaY` is `min(300, trackBottom − aim − 24)`, which keeps it over the track after the scroll.
  `deltaY` is recorded in the evidence; it is 300 wherever the track has room.
- **The follower becomes visible and has to be allowed to converge.** The state waits until both
  follower elements' inline `left`/`top` hold to two decimals for 200 ms.

And one thing the assertion had to give up. "The page scrolled" is *not* the guard's contract:
`overflow-x: auto` computes `overflow-y` to `auto` as well, so a skin whose cards overrun the track
box gives the track its own vertical room, and Chromium latches the gesture there rather than
chaining it to the document — `wheatpaste` has exactly 7 px of it, with 3964 px of page still below.
That is the baseline behaving as a user would see it, so the end condition is "something scrolled
vertically, the page **or** the track box", and both `scrollY` and the track's `scrollTop` are in
the evidence.

### Why the wheel state sends two gestures

`scrollLeft` staying put is the assertion that carries the guard — but with `deltaX: 0` it carries
nothing. The browser never slides the track sideways in the first place, so the assertion holds just
as well with `restoreLockedLeft` and `scheduleRestore` deleted outright: it would be describing an
untouched track rather than a pinned one.

The obvious fix, giving the one gesture a real horizontal component, breaks the other half.
Chromium latches a wheel gesture to the nearest node that can scroll on *some* axis of the delta,
and the track is `overflow-x: auto` with thousands of pixels of horizontal overflow — so a mixed
wheel latches there and the vertical half never chains to the document. Measured with `deltaX: 40`
on `default` and `wheatpaste`, both viewports: **seven of eight failed** with
`nothing scrolled vertically: scrollY 2667 of 3662, track scrollTop 0 of 0`. The one that passed was
`wheatpaste`, the skin whose track has 7 px of vertical room of its own to absorb it.

So the state sends two gestures, separated by the guard's own 140 ms end (which is also what expires
Chromium's wheel latch, so the second one re-hit-tests):

1. **The lock gesture**, `WHEEL_LOCK_DELTA` = `deltaX: 40, deltaY: 60` — mixed, and still vertical by
   the guard's own rule (`ay >= ax * 1.15`, `featured-carousel.js:341`; 60 ≥ 46, asserted rather than
   assumed). It latches to the track, Chromium slides `scrollLeft` by 40, and the guard's rAF restore
   is the only thing that can put it back. The track having somewhere to go is asserted too
   (`scrollWidth > clientWidth`; `default/home` measured 8421 against 1160), so "still at
   `scrollLeft0`" is a claim about the lock and not about an inert rail.
2. **The page gesture**, the original pure-vertical `deltaY`. It latches to the document and scrolls
   the page.

Gesture 1 scrolls nothing, so the pointer is still exactly where the aim bounds were computed for
when gesture 2 goes out. The class history spans both, so `is-vertical-wheeling` is asserted present
and then gone in the same way; `wheels` now records two entries and both deltas are in the evidence.

### Two frames is not a stability test

Every wait here holds a value for a **duration**, never for two animation frames. Chromium's
programmatic smooth scroll eases in sub-pixel steps, so two consecutive frames can report the same
`scrollLeft` while the animation is still running: measured on `marquee`, one side stopped at 2421
and the other at 2419 on the same dot click. An IntersectionObserver callback and a debounced redraw
are worse still — they are delivered on their own schedule, not every frame. The windows in use are
150 ms (a scroll that lands instantly), 200 ms (the follower's ease), and 300 ms (a smooth scroll,
the section-header reveal, and the Plotly redraw, which is twice its own 150 ms debounce).

### `quiesceLayout` and `afterInteraction`

`quiesceLayout` (`harness/sentinels.ts`) dispatches the page's own `scroll` handlers — one on
`window`, one on `.menu-scroll-wrapper` — without scrolling anything, so `--section-rule`'s eased
scrub and `#highlight`'s inline geometry become a function of the settled layout instead of
whichever frame their handler last ran on.

`afterInteraction(page, pageType, deadline, {quiesce})` (`harness/settle.ts`) is the shared tail
every state runs once its own end condition holds: **the fonts wait**, `quiesceLayout`, the in-view
`[data-aos]` wait, the no-running-finite-animation wait, `--section-rule` two-frame stability on home
and the listing, and `postAssetsSettled` on posts.

**The fonts wait, and why it is first.** It is the fonts half of `settle()` step 2b on its own —
`document.fonts.ready` resolved with `document.fonts.status === 'loaded'`, polled under the
deadline, without the stylesheet-count window, which by this point has long stopped moving. What has
*not* stopped moving is which glyphs the page has asked for: an interaction can be the thing that
asks. `.tc-hidden` is `display:none`, so opening the picker lays out sixteen preset rows for the
first time, each heading in its own theme's webfont (`css/theme-cycler.css:231`), and those faces
only start downloading at the open. Until they land, every `.menu-item` on the page — the nav
included — is measured in the fallback.

It runs before `quiesceLayout` because the quiesce is what *records* the measurement.
`quiesceLayout`'s synthetic `window` scroll is picked up by the cycler's own `reanchor`
(`theme-cycler.js:681-683`), which re-runs `position()` and rewrites `--tc-mega-w` from the live
`.static-menu` width — so quiescing before the swap writes the fallback measurement into the DOM and
quiescing after it writes the real one. This was the one real failure in a 656-test sweep:
`marquee/home @state:picker-open` on desktop, `--tc-mega-w: 658px` against `631px` with the whole
nav shifted 27 px in the screenshot to match. Both sides now settle on `631px`.

**Two marks `quiesceLayout` leaves, recorded rather than hidden.** Both are harness-*induced* but
not harness-*invented* — a real user reaches each, they are compared verbatim in the DOM and the
screenshot, and they land identically on both sides:

- `nav-config.js:151-152` adds `menu-invisible` to `.moving-menu` whenever the handler runs below
  `SCROLL_THRESHOLD / 3`, which the settled position (`scrollY 0`) always is. Without the synthetic
  event the class would depend on whether the page happened to receive a scroll at all, so
  dispatching it is precisely what makes the settled `.moving-menu` the same on both sides.
  `sticky-nav` is the one state that must **not** get this, and passes `quiesce: false`.
- the `.menu-scroll-wrapper` event runs `script.js:328` → `moveHighlight(target, false)`, so
  `#highlight` ends up with inline `transition: none` on **every** viewport, including desktop where
  the wrapper is not scrollable and could never have fired the event by itself. That is the point:
  home's readiness asserts `transition === 'none'` as the proof that the re-seat happened at the
  settled layout rather than mid-entrance.

**Every interaction state runs under `test.slow()`.** It performs `settle()`, then its own end
condition, then the shared tail — three separately bounded phases, on each of two sides. Each phase
keeps its own 15 s `pollUntil` deadline, so a genuine hang still fails in seconds naming the
outstanding detail; the default 90 s *test* budget is simply too tight for six of them plus two page
loads, and one `sticky-nav` crossed it under full-matrix contention. No assertion is relaxed and no
wait is lengthened by this. The `settled` tests keep the default budget.

`sticky-nav` passes `quiesce: false`. `nav-config.js:149` decides `.moving-menu`'s stickiness from
`scrollY < lastScrollTop`, and after a real scroll those two are already equal, so a synthetic
`scroll` event reads as "not scrolling up" and would undo the very class the state asserts. Such a
state has already run every scroll handler at its final position, for real.

### The palette record

`@state:palette` is the only state that navigates, and the only one that exercises §15 item 2 and
D4's pre-paint override. One context per side, three page loads:

1. Settle, record `base` (the five role tokens on `<html>`, cross-checked against
   `theme-html.json`'s roles for the theme), open the picker, click `#tc-randomize`, wait until the
   roles differ from `base`, hold still for 150 ms and the session key is written. Record
   `shuffled` and `storageAfterShuffle`. **The capture for this state is taken here**, with the dock
   open and the shuffled palette live.
2. `goto` the next page of the same theme in `urlPairs()` order (`nextPair(pair)`, wrapping after
   the last), under that page's own seed so its masthead readiness still names a sequence — and
   **on the side this context is driving**: `ctx.side` picks `next.oldPath` on old and
   `next.newPath` on new. Under `old-old` those are the same string, which is exactly why following
   `oldPath` on both sides looked correct; under `old-new` they are not, and the migrated side would
   have 404'd against `dist`. The record names the destination as `next.pageId`, not as a path,
   because the evidence is compared `toEqual` across the two sides and it is the same *page* on
   both however its URL is spelled.
3. `reload()`.

Steps 2 and 3 each record `firstPaint` — the inline roles at `readystatechange === 'interactive'`,
after the blocking `js/theme-bootstrap.js` and before the deferred `js/theme-cycler.js`, which is
what "first paint" means here — plus `firstPaintStorage`, `settled` and `storage`.

| | `firstPaint` | `firstPaintStorage` | `settled` | `storage` (after settle) |
|---|---|---|---|---|
| navigate | `shuffled` | the shuffled colors | `shuffled` | the shuffled colors |
| reload | `base` | **`null`** | `base` | the **base** colors, re-persisted |

The last cell is why the assertion is on `firstPaintStorage` and not on `storage`: the baseline
clears the key before first paint (`theme-bootstrap.js:731`, again at `theme-cycler.js:749`) and
then `boot()`'s own `applyColors()` calls `persist()`, so a moment later the key is back, holding
the theme's base palette. `storage` is recorded as evidence; `firstPaintStorage === null` is the
assertion that the reset happened.

**S1-13 flips exactly three assertions**, marked in `harness/interactions.ts` with a
`>>> S1-13 FLIPS THE NEXT THREE ASSERTIONS <<<` comment: `reload.firstPaintStorage`,
`reload.firstPaint` and `reload.settled`. D11 gives the migrated engine a palette that survives a
reload, so those become `shuffled` / non-null. Nothing else in the record moves. The whole record is
written to `<side>.palette.json` per side and compared `toEqual`.

### Evidence

Every state writes `ctx.evidence` to `<side>.interaction.json` in its dump directory, and the two
sides are compared `toEqual` (and attached to the failure when they differ). The evidence is the
state's own end condition in data form — the wheel's class history, the highlight's geometry, the
ordered `{id, filteredOut}` list, the palette record — so a state that "passed" while doing nothing
would show up as an empty or wrong record rather than as a green test.

One deliberate omission: `masthead-0` records the four terminals it saw, not the raw history
length. `MutationObserver` coalesces records, so how many intermediate states a run happens to
observe is machine load rather than behaviour. The terminals themselves cannot be coalesced away:
every one of them is either the last state of the sequence or followed by a `pause` step, so each
survives at least one task boundary.

### The masthead path, not just its last line

Readiness used to assert only that `#typing-text` had reached the seeded sequence's **final**
terminal, and that check is very nearly vacuous. Home sequences 0, 1, 3, 5 and 7 all end on
`Hi,\nI'm Dawson,\nsoftware engineer.`, and all seven listing sequences end on `Blog.` — so a wrong
seed, a wrong `MASTHEAD_DRAW` or a wrong `MASTHEAD_INDEX` would have sailed through it on every page
in the matrix except the single mobile `masthead-0` capture, which was the only state that looked at
the path at all.

So `recordMastheadHistory` is installed on **every** home and listing capture, on both sides
(`harness/parity.spec.ts`, before `goto`), and `mastheadReady` asserts the whole path: one
`MutationObserver` records every distinct text the element passes through, and the recorded texts
that are step terminals **of any sequence on that page**, deduped and in order, must equal the
pinned sequence's own terminal list.

*Any* sequence's, not the pinned one's, and that distinction is the whole check. Under the index-3
home pin, filtering by index 3's own terminals leaves exactly one entry to match, which sequences 0,
1, 5 and 7 all produce on their way past it — they would still pass. Filtering by the page's whole
terminal set keeps their earlier terminals (`web developer.`, `full stack engineer.`, `builder.`) in
the observed path, where nothing matches them. Verified against `masthead.json`: for all 16
sequences across both pages the filter reproduces exactly that sequence's own terminal list, so it
can never fail a legitimate run, and under either pin it accepts no other sequence.

One init script records both `typing-text` and `blog-typing-text`, keyed by id, because
`@state:palette`'s `after` hook navigates home → listing on the same `Page` and a recorder
registered for one id would leave that landing with nothing to assert.

`masthead-0` keeps its own entry in the registry — §9 asks for the mobile capture on the longest
delete path, and the evidence file is where the four terminals are written down — but it is now the
index-0 instance of the same check rather than the only place it happens.

### Seeds and draws

The masthead pick (`js/typing-engine.js:165`) is draw **2** on home (jQuery 3.6.0 draws once at load
for its expando and is a `defer` script ahead of `typing-engine.js`, `index.html:31` vs `:38`) and
draw **1** on the listing (which loads no jQuery). `seedFor(index, count, draw)` brute-forces the
smallest seed whose *k*-th draw picks the wanted index, so a new sequence in the source moves the
seed rather than silently changing which line is typed.

| Page | Sequence | Call | Seed |
|---|---|---|---|
| home, every state but `masthead-0` | index 3, `Hi,\nI'm Dawson,\nsoftware engineer.` (one `type` step, no delete) | `seedFor(3, 9, 2)` | **13** |
| home, `@state:masthead-0` | index 0, the four-terminal delete path | `seedFor(0, 9, 2)` | **0** |
| listing | index 6, `Side quests.` (the shortest of 7) | `seedFor(6, 7, 1)` | **4** |
| posts, privacy, 404, lexchat | no masthead | `STATIC_PAGE_SEED` | **1** |

**The listing pins index 6, not index 3.** §9 and the ticket both ask for the *shortest* of the
seven, and index 3 (`Rabbit holes.`, 13 typed + 13 deleted) is not it: index 6 (`Side quests.`, 12 +
12) is. Priced with the engine's own model — `typingDelay` per typed character (`typing-engine.js`
`:450`), `deleteDelay` per deleted one (`:580-610`), each `pause` its own duration (`:376-380`),
`callback` free (`:618-621`) — that is 2555 ms against 2670 ms, and
`tests/unit/parity-seeds.test.ts` (i) recomputes the whole ranking from `masthead.json` and asserts
`MASTHEAD_INDEX` is its winner on both pages, with no tie. A new sequence in
`blog/blog-listing.js` therefore fails that test rather than quietly leaving a longer pin in place.

Moving the pin moves what `reserveHeight()` reserves and so the listing's whole vertical layout
(`marquee/blog` now reserves `min-height: 90.1562px`), which is fine: it moves on **both** sides, and
the listing was re-verified live afterwards.

The static seed is not decoration: `metr-doubling`'s Plotly names its clip paths, legends and
per-series `trace<hex>` classes from `Math.random`, so any fixed seed makes both sides equal.

### The `.md` ordering fence

A post's body arrives through `blog/blog-post.js:145` `fetch('posts/<id>.md')`, and everything
downstream of it appends to a document the theme cycler is also appending to — the per-post
stylesheet into `<head>` where `loadAllFonts` is adding fourteen font links, mermaid's
`div.mermaidTooltip` into `<body>` where `#tc-dock` and `#tc-scrim` already are. Which append lands
first is a plain race, and both orders were observed. The harness routes `**/blog/posts/*.md`
through a fence on **both** sides, so the post's nodes are always last. Nothing is excluded: the
order is pinned, not normalised. **S1-13 keeps this fence and inherits its consequence — on the old
side, post-appended nodes sit after the cycler's font links.**

The fence is a **condition, not a stopwatch.** The route handler holds the response on the
requesting page (`route.request().frame().page()`) until `document.readyState === 'complete'` and
then until one `requestIdleCallback(…, {timeout: 2600})` queued *after* `load` has run — the same
fence `settle()` step 2a relies on, and for the same reason: the cycler queues its `loadAllFonts`
with `requestIdleCallback({timeout: 2500})` at `theme-cycler.js:761-762`, before `load`, so an idle
callback queued after `load` can only run behind it. It cannot deadlock, because a `fetch()` is not
a document sub-resource and so cannot hold `load` back itself, and a page that navigates away or
closes mid-flight releases the response rather than hanging it.

**Registration order matters.** Playwright evaluates the most recently registered route first, so
`openSide` registers `fencePostMarkdown` and `fenceStyleAssets` **before** `abortApis` — the abort
list is checked first and an aborted host can never be fenced and then fetched. No pattern overlaps
today (the abort list is APIs and the LexChat host; the fences are one same-origin markdown path and
the tilt library's CDN file) and this ordering is what keeps that true if either list grows.

### The tilt ordering fence

The mirror image of the `.md` fence, at the other end of `<head>`.

`js/theme-bootstrap.js:715-720` appends the skin's two sheets — `theme-base.css` and the
`[data-style="…"]` sheet — with `document.createElement('link')`. A script-created `<link>` is not a
*script-blocking style sheet* (only a parser-created one is), so those two sheets race every script
below them, starting with the parser-blocking `vanilla-tilt.min.js` at `blog/index.html:30` /
`index.html:34`. Both orders happen: a same-origin sheet off a saturated single-threaded
`http.server` against a cross-origin CDN script on a warm connection is a genuine coin flip, and the
two sides flip independently.

That race is permanent, because VanillaTilt 1.7.0 freezes a layout measurement at construction and
can never revise it. `prepareGlare()` writes `.js-tilt-glare-inner`'s `width`/`height` as
`${2 * offsetWidth}px`; the only other writer, `updateGlareSize()` on `resize`, emits the same
number **with no unit**, which the CSSOM rejects. The constructor's number is the one that stays in
the DOM for the life of the page — no wait, event or quiesce can move it, and dispatching a
synthetic `resize` was measured to be a no-op for exactly this reason. So whether the skin sheet had
applied when `featured-carousel.js:193` ran decides the glare for good, and most skins change
`.fc-card-image`'s border box: `wheatpaste.css:544` puts a `4px` border on the `content-box` 510px
image of `featured-carousel.css:270`, giving `1020px` when the sheet lost and `1036px` when it won.
Measured on `wheatpaste/blog @desktop-1440`: `picker-open`, `filter-swift` and `palette` captured
`1036px` against `1020px` on all eight cards with identical state evidence, and the four states that
agreed — `settled` included — agreed only because both sides happened to lose together.

**The exposed set is small, and was checked rather than assumed.** Only three of the sixteen matrix
themes construct a tilt at all — the other thirteen set `flags: { tilt: false }` in
`js/theme-bootstrap.js`, so no glare element exists to size, which is why the six skins that put a
content-box border on `.fc-card-image` (`brutalist`, `broadsheet`, `field-notes`, `blueprint`,
`grid`, `doodle`) are not affected. Of the three that do tilt, `default` appends no skin sheet and
so has nothing to race, `miami-deco.css:445` neutralises the race with `box-sizing: border-box`
(510px measured either way, verified green and still `1020px` after the fence), and `wheatpaste` is
the one left exposed.

`fenceStyleAssets` routes `**/vanilla-tilt*.js` and holds it until the skin sheets have applied.
One fence covers every case because it is a **choke point, not a list**: nothing on the site can
construct a tilt before `VanillaTilt` exists, so the home carousel, the listing carousel and all
sixteen skins are settled by the same hold. It pins the side a real visitor lands on — a same-origin
sheet requested from a blocking `<head>` script beats a cross-origin CDN script that still owes DNS,
TCP and TLS — which is also the side the migrated build is always on, since Astro emits the skin
sheet as a parser-inserted `<link>` that blocks scripts outright. **S1-13 inherits the consequence:
every glare on the old side is now sized from the skinned element, `1036px` on wheatpaste desktop
rather than the stale `1020px`.**

Like the `.md` fence it is a **condition, not a stopwatch**: every same-origin
`link[data-style-asset]` has a non-null `.sheet`, which is exactly "loaded, parsed and applied to
layout". `__ACTIVE_STYLE` (`theme-bootstrap.js:700`, set for *every* style, `default` included) is
what says the bootstrap has run at all, so a request the preload scanner issued ahead of it cannot
read the not-yet-appended set as "nothing to wait for"; `default` appends no sheets and is released
on the first tick. The 5 s bound is the bail-out for a sheet that 404s, never the mechanism — that
sheet fails `badResponses` moments later with its URL. The skin's cross-origin Google Fonts links
are deliberately left out: they are `settle()` step 2b's job, and an outage there must not become a
five-second hold on every request. Registration order is the same rule as the `.md` fence —
`openSide` registers it before `abortApis`, so the abort list is still checked first.

### The cursor follower's inline position

`js/cursor-follow.js:21-31` eases the follower a fixed fraction of the way to its target every
frame (0.6 for `.cursor-follow`, 0.25 for `.circle-follow`), so it approaches asymptotically and
what lands in the DOM is a frame count, not a position — and two runs stop on different frames.
The class is matched as a whitespace-delimited **token**, not as the whole attribute:
`cursor-follow.js:36-41` adds `cursor-follow-clickable` while the pointer is over an
`a, button, .job-menu-item`, which `carousel-wheel`'s `mouse.move` can land on, and an
exact-attribute match would have silently stopped canonicalising the one element that has the tail.
`cursor-follow-clickable` on its own is not a match — the token has to stand alone — and both cases
are covered in `tests/unit/parity-seeds.test.ts` (h).

`canonicalizeCursorFollower` rounds those two elements' own inline `left`/`top` to **one decimal
place**, on both sides in every mode. That covers both shapes of tail: the exponent crumb at rest
(`-4.31945e-41px`, and `-0`, both → `0.0px`) and the last decimals after `carousel-wheel`'s
`mouse.move` (`712.9999999997px` → `713.0px`). The wheel state waits for two-decimal stability
first, so the two sides are within a hundredth of a pixel of the same target and approach it from
the same side; a tenth of a pixel is an order of magnitude of headroom. Nothing else on the page is
touched — a real position keeps its value, rounded.

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
| home | `false` — every state screenshots the viewport, and three of them scroll | `#typing-text` | `#typing-text` |
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

## `settle(page, pageType, opts?)`

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
3. Every `[data-aos]` AOS's own rule has certainly triggered has `aos-animate`: rect intersecting
   the viewport **and** `top < innerHeight - 120`. AOS reveals an element only once its top clears
   `innerHeight - offset`, and 120 is the largest offset in use (`js/script.js:212` takes the
   library default, `blog/blog-listing.js:178` passes 50; no element sets `data-aos-offset`). An
   element still inside that bottom band is one AOS has not been asked to reveal — a state the
   scroll interactions land in routinely. Nothing is excluded from the comparison: `aos-animate` is
   compared verbatim on both sides, and step 4 is what catches a reveal that *did* start.
4. `document.getAnimations()` has no `playState === 'running'` animation with finite iterations
   (infinite ones, marquee tickers and the caret blink, are cancelled by the screenshot's
   `animations: 'disabled'` instead).
5. `sentinels[pageType].ready(page, deadline, opts?)` (`opts.mastheadIndex`, defaulted from
   `MASTHEAD_INDEX`, is threaded through by `settle`'s own `opts`):
   - **privacy**: `.privacy-header` has text and `.privacy-content` exists.
   - **lexchat**: `iframe.lexchat-iframe` exists. Its host is in the abort list, so the embed never
     loads; that is by design on both sides.
   - **notFound**: when `?style=` is present and not `default`, `documentElement.dataset.style`
     equals it and every `link[data-style-asset]` has a non-null `.sheet`. Otherwise it passes.
   - **home / blog**: the masthead's text equals the **seeded sequence's** final terminal (with
     `\n` removed, since the engine emits `<br>`, and `U+200B` stripped), the observed step-terminal
     path equals that sequence's whole terminal list (see
     [The masthead path](#the-masthead-path-not-just-its-last-line)), and exactly one typing
     anchor exists. `animation-name === 'blink'` is asserted on the `.cursor` variant; eight
     registry themes pick a cursorless `typing` mode and get `.tw-anchor`, which
     `typing-engine.js` never animates. Then every `PINNED_TARGETS[pageType]` element carries the
     pinned inline `animation-name: none`, the unrendered ones are **exactly** that page's
     `hiddenOn` set for the viewport, and `--section-rule` is unchanged across two consecutive
     frames. **home also**: 8 `.fc-card`, 8 `.fc-dot`, exactly one `.active`, and `#highlight`
     carries inline `left/width/top/height`.
   - **post**: `#read-time` matches `/^\d+ min read$/`, every `.mermaid` contains an `<svg>`, and
     `postAssetsSettled` holds. `blog/blog-post.js:114-125` appends the frontmatter `scripts:` one
     at a time, each after the previous has loaded, and it does that **after** `#read-time` is
     filled — so the rest of the predicate can pass while the chain has not started.
     `document.scripts.length` holding still for 300 ms is what says the chain is done, whatever a
     post declares. Then, if the post pulled in Plotly, `window.Plotly` exists, at least one
     `.js-plotly-plot` has an `svg.main-svg`, and the plot subtree's size plus the page's
     `Math.random` draw count are unchanged for 300 ms.

     `metr-doubling` needs all of it: its data fetch goes through `corsproxy.io`, which is in the
     abort list, so the chart is drawn from the bundled fallback in the rejection handler, well past
     `load`; and it redraws on the cycler's `dawson:palette` event behind a 150 ms debounce, which
     `@state:palette`'s shuffle fires. A redraw consumes `Math.random`, so one on one side only
     would move every `defs-<hex>` id and fail the DOM comparison. The membership test is
     `script[src*="plotly"]`, **not** `'Plotly' in window`: the global only appears once the CDN
     script has run, and treating "not yet" as "never" is what let one side's reference PNG land on
     an empty chart box while the DOM matched (observed on `brutalist/metr-doubling`).
6. **Step 4 again.** Readiness itself starts finite animations (the home and listing reveals fire off
   the masthead callbacks), so a single pass before step 5 settles the wrong moment. The second poll
   shares the same deadline.

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

The old side loads thirteen libraries and Google Fonts from live CDNs by design, so check 4 depends
on those CDNs. Over the 96 utility-page tests (192 page loads) every one of 4521 responses was
`200`, and the only `requestfailed` entries were the 64 deliberate aborts of
`https://dawsonamf-lexchat.hf.space/` (32 lexchat tests × 2 sides).

Across the much larger interaction matrix, **transient CDN transport errors do occur**, and §9 is
explicit that they are a harness failure rather than a regression — so they fail loudly instead of
being masked. Seen in practice: `net::ERR_QUIC_PROTOCOL_ERROR` fetching
`cdnjs.cloudflare.com/…/font-awesome/6.5.1/webfonts/fa-brands-400.woff2`, which failed two tests and
stretched them to 3.2 minutes (`settle()` waits on `document.fonts.ready`). Both passed on an
immediate rerun, in 15 s. A failing test whose `<side>.network.json` shows only a CDN transport
error on a font or library is this, not a parity difference; rerun it before investigating.

Note that `assets.calendly.com` entries in `failed` are **expected** — that host is in the abort
list, and `badFailures` excludes it from the assertion.

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

`tests/unit/parity-normalize.test.ts` and `tests/unit/parity-seeds.test.ts` are **pure**: no
browser, no server, no network and no baseline *checkout*, so `node --test tests/unit/*.test.ts`
needs no environment at all. Between them they cover the normaliser and `parseDeclarations`, and
`mulberry32` / `pickIndex` / `seedFor` / `cleanMastheadText` / `canonicalizeGeneratedIds` /
`canonicalizeCursorFollower` / `MASTHEAD_INDEX`. `mastheadSeed` and `seedForPage` are deliberately
not imported there: they read the frozen checkout, and `@capture:masthead` is what verifies the
sequence counts they derive from.

The one file either of them reads is the committed `masthead.json`, in test (i): it prices all 16
sequences with the typing engine's own model and asserts `MASTHEAD_INDEX` names the cheapest on both
pages. That is a fixture, not the checkout — `@capture:masthead` is what proves the two agree — so
the file stays environment-free.

Two shapes are enforced at collection time in `harness/parity.spec.ts` instead, where a wrong matrix
stops the run rather than reporting zero failures: the URL matrix (128 pairs / 16 themes / 128 unique
ids / 8 per theme) and the per-state counts of the applicability table above (496 declared:
128 + 16 + 16 + 32 + 32 + 80 + 16 + 80 + 16 + 80). The derivations (`themeOrder`, `localPostIds`,
`content`, `masthead`) are what the `@capture:` fixtures verify.

## Baseline nondeterminism, and how it was closed

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
   closed it, and `pinnedReady` is now the explicit predicate: every reveal target must carry the
   pinned inline `animation-name: none`, and every target this viewport hides must in fact not be
   rendered.
3. **Generated ids in post bodies.** Mermaid names its `<svg>` (and every rule of its injected
   `<style>`, and eight `<marker>`s) `mermaid-<epoch ms>`, so `toolbelt`'s two diagrams differ on
   every run; Plotly does the same with random hex in `clip*`, `defs-*`, `legen*`, `topdefs-*` **and
   the per-series `trace<hex>` class**, so `metr-doubling` differs too. `embedded-swift-agent`, no
   mermaid and no Plotly, passes on both viewports. These ids are intrinsically nondeterministic and
   are not a migration regression; they needed a deterministic source or a canonicaliser, not a
   widened tolerance.

All three are closed by `harness/determinism.ts`: the seeded `Math.random` fixes 1 and, with it,
Plotly's `randstr` ids and `trace<hex>` classes; the completed readiness predicates close 2; and
`canonicalizeGeneratedIds` rewrites mermaid's `mermaid-<13 digits>` epochs to `mermaid-T<n>` on both
sides in every mode.

Adding the interaction states surfaced seven more, every one closed by a deterministic input or a
deterministic wait and every one documented above:

| What moved | Where it showed | How it is closed |
|---|---|---|
| AOS's trigger band | a header 15 px into the viewport, which AOS's own rule never reveals | the wait matches AOS's rule (`top < innerHeight − 120`), not bare intersection |
| AOS's cached offsets and 99 ms throttle | `marquee/blog` `sticky-nav`, one `.section-header-wrapper` latched on one side only | `refreshAos` before every gesture, at the settled position |
| the reveal path of a whole-document gesture | 6 of 16 themes on `smooth-scroll-contact` | `primeReveals` walks that one page at rest first, then the reveal state is held still |
| Plotly's async draw and its `dawson:palette` redraw | `brutalist/metr-doubling`, an empty chart box in the reference PNG | `postAssetsSettled`, keyed on the script tag rather than the global |
| the cursor follower's asymptotic ease | every `carousel-wheel` capture | converge to two decimals, canonicalise to one |
| Chromium's post-scroll wheel hit test | the wheel arriving at `<main>` instead of the track | aim near the track's visible top, delta bounded by the room below it |
| Chromium's wheel latching | a mixed wheel latching to the track, so the page never scrolled (7 of 8 `carousel-wheel` runs) | two gestures: the mixed one for the lock, then a pure-vertical one for the page |
| webfonts first asked for **by** the interaction | `marquee/home` `picker-open`, `--tc-mega-w` 658 against 631 and the nav 27 px out | the fonts wait leads `afterInteraction`, ahead of the quiesce that re-measures |
| two-frame "stability" | `marquee/home` `carousel-dot-3`, landing 2421 against 2419 | every wait holds a value for a duration instead |
| the skin sheet racing the tilt library, frozen forever by VanillaTilt's unitless `updateGlareSize` | `wheatpaste/blog` `picker-open` / `filter-swift` / `palette`, glare `1036px` against `1020px` on eight cards | `fenceStyleAssets` holds `vanilla-tilt*.js` until the skin's own sheets have applied |

**No tolerance moved**: `maxDiffPixelRatio` is still 0.001 and `threshold` still 0.2, no mask was
added, no `test.skip` exists anywhere in the suite, and nothing is excluded from the DOM or
computed-style comparison. Every fix above is either a deterministic input or a deterministic wait.

## Consumers

- **S1-03's harness is complete.** The tag grammar, the ten state names, `harness/interactions.ts`,
  `primeReveals` / `refreshAos` / `afterInteraction`, the seeded `Math.random` and the canonicalisers
  are all in place; `tsc --noEmit` is clean, `npm run test:unit` is 158/158, and collection is 963
  tests (480 + 480 + 3). Every state has been run green across all 16 themes in targeted sweeps —
  **see the completion report for the per-state counts and for the full-matrix result**, which is
  owned by the orchestrator rather than by this document.
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
  points 8782 at `dist` (the config already resolves it as `<repo root>/dist`). Four things are
  already shaped for it: `settle()` depends on no browser theme global, so step 2 behaves
  identically on the migrated side; the `.md` fence runs on both sides, so the old side's
  post-appended nodes are pinned **after** the cycler's font links and the new side has to match
  that order; every interaction targets a selector, so a renamed hook fails loudly rather than
  silently doing nothing; and `@state:palette` is where D11 lands — flip the three assertions marked
  `>>> S1-13 FLIPS THE NEXT THREE ASSERTIONS <<<` in `harness/interactions.ts` so a reload keeps the
  palette, and leave the navigate half alone.

  The palette state's **navigation** is already side-aware and needs no edit: `InteractionContext`
  carries `side`, and the `after` hook follows `next.oldPath` on old and `next.newPath` on new. The
  trap it avoids is quiet — under `old-old` the two paths are identical, so a hook that followed
  `oldPath` on both sides would look correct right up until 8782 points at `dist`.
- **S1-17 / S1-26** run the complete matrix. Shard by theme with `--grep '@theme:<id>'` and by
  state with `--grep '@state:<name>'`; both tags are stable and both are in every title. S1-26's
  extra reduced-motion run (`PARITY_REDUCED_MOTION=1`) has to reckon with the states that scroll:
  `smooth-scroll-contact` goes through jQuery's own easing, which ignores the media query, while
  `carousel-dot-3`'s `behavior: 'smooth'` becomes instant — the end conditions are positions, not
  durations, so both still hold, but the reference images move.
- **S1-05 / S1-06** treat `masthead.json` and `content.json` as the authoritative record of the old
  typing sequences and content registry.
