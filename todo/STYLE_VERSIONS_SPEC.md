# Style versions ("hella themes")

Same content, radically different design languages, surfaced as the nav's
Theme dropdown (promoted from easter egg to feature June 2026).

## Status + queue — SINGLE SOURCE OF TRUTH

This section is the one place ship status and queue order live.
[TODO.md](TODO.md), [test-styles.html](test-styles.html), and CLAUDE.md
point here instead of restating it — when a skin lands, update this list
and nothing else.

**Shipped (engine + fourteen skins, June 2026):** studio, brutalist,
broadsheet, field-notes, blueprint, doodle, vapor, wheatpaste, bauhaus,
chinoiserie, banknote (reworked June 2026: engraved two-ink currency,
gold seal retired), grid (labelled "Swiss Grid"; square cursor follower),
gallery (MN·1 white cube), wanted (WW·1 reward poster).

**Queue, tiered June 2026:**

- **Tier 1 — definite, in order:**
  constructivist × rodchenko merge (06 + 06·B).
- **Tier 2 — soon:** 8-bit console (PX·1) OR crt terminal (PX·3), one of
  the two, undecided.
- **Tier 3:** miami deco (AD·2), neo-pop × ben-day merge (02 + PA·1).
- **Tier 4 — likely deferred indefinitely:** picture palace (07·C),
  harvest (11), riso (08), roadside motel (11·C).

Everything else on the sheet is unranked. Approved visuals and per-style
notes (palette roles, fonts, flags, technique) live as tiles in
[test-styles.html](test-styles.html); the rest of that sheet is parked,
TBD. Future engine work, in rough order: Layer-4 strings, a
read-only content API (`js/content-api.js`), Layer-5 takeover modes (a lazy
JS module renders its own UI into an injected `#style-root`; the canonical
DOM stays in place, hidden not removed).

## Architecture

- **Registry** in `js/theme-bootstrap.js`: one entry per style — id, label,
  polarity, colors (the five roles), tokens, fonts (Google Fonts URLs), css
  (sheet path), optional `flags`, `random` palette profiles, and `typing`.
  The default entry IS the site as-built: stamps nothing, loads nothing.
  Append new ids to `ORDER`. `typing` picks the masthead reveal mode
  (`js/typing-engine.js` reads it via `window.__styleTypingMode()`):
  `'cursor'` (default, the classic caret), `'letter'`, or `'word'`. The
  cursorless modes wrap each typed glyph in `span.tw` (`+ .typing-accent`
  after the second newline) and mark deleting glyphs `.tw-out` for ~300ms —
  the skin sheet supplies the in/out animations (doodle draws/erases, vapor
  flickers, studio/broadsheet fade by word); the reduced-motion guard lives
  in `theme-base.css`. Deleted spaces and `<br>`s hold their slot through
  the same ~300ms drain (so the fading tail never jumps left), and an
  unstyled `span.tw-anchor` holding a zero-width space stands in for the
  caret, keeping the last line's box alive between a delete and the retype.
- **Attribute**: `data-style="<id>"` on `<html>`, absent for default.
  `data-theme` keeps its dark/light palette-toy meaning; the axes compose.
- **Persistence**: session-only. sessionStorage carries the id across
  navigation; any reload returns to default. `?style=<id>` applies + seeds
  the session (`?style=default` clears).
- **UI**: a Theme item in the nav menus. `js/nav-config.js` renders the
  trigger (`li.tc-nav-item > button.tc-nav-trigger`, gated on
  `window.__THEME_CYCLER_ENABLED`; label + caret in the desktop menus,
  palette icon in the mobile quick-links row) and `js/theme-cycler.js`
  anchors the dock under whichever trigger opened it (`.tc-dock.tc-dropdown`,
  one node reparented between static menu, moving menu, and mobile row).
  Hover opens on pointer-fine devices, click pins, outside click/Esc/X
  closes; clicks inside the dock pin it so native color pickers can't
  hover-close it. Pages without nav menus (blog posts, privacy, lexchat,
  404) keep the floating `.tc-toggle` FAB, now always visible — the
  selfie-click unlock is gone. Triggers carry `.menu-item`/`.socials-item`,
  so every skin's menu styling applies to them with no extra rules.
  Panel layout: header (title + close), then full-width `.tc-action` rows
  (Shuffle colors, Reset, and the Advanced reveal — scheme pills + named
  role rows with locks and color inputs), then one full-width row per style:
  each row is painted in its own registry palette (bg as the row ground,
  text on the label, primary/secondary/accent as dots, an accent check marks
  the active style). The list scrolls when the viewport runs short and the
  dock self-clamps to the viewport on open. Invert/`flipTheme` (and its
  Alt+T binding) is gone. The panel takes `var(--font-body)`, so skins'
  body type carries into it.
- **Tokens: the registry defines, skins consume.** Token values exist only in
  `css/styles.css :root` (defaults) and inline writes on `<html>` — never in
  skin sheets. Switching styles clears palette-toy overrides; when the toy
  diverges from the active style's base palette, `js/theme-cycler.js` derives
  `--jobs-menu-*`/`--neutral-gray`/`--code-bg`/`--code-fg` and restores them
  on return to base.
- **Skin sheets** at `css/themes/<id>.css`: every rule scoped under
  `[data-style="<id>"]`, root-absolute asset paths, `@keyframes` names
  prefixed with the id (names are global — safe only because a sheet loads
  solely while its style is active). **`css/themes/theme-base.css` loads with any
  skin, before the skin sheet**, and carries the shared plumbing: code-block
  ground, blog footer centering, the mobile rail/contact-wrapper fixes, the
  stillness pack, and the tilt pins. Skin sheets carry only their own design.
- **Layers**: 1 tokens → 2 scoped CSS skin → 3 behavior flags → 4 strings
  (slot exists in concept only; author sparingly, body content never changes)
  → 5 takeover. Flags: `flags.tilt: false` gates every `VanillaTilt.init`
  via `window.__styleAllowsTilt()` (live switches destroy instances) and
  `flags.still: true` marks a motionless skin. Both stamp `<html>`
  attributes (`data-no-tilt`, `data-still`) consumed by `theme-base.css`.

## Building a skin (agent protocol)

Read order: the style's tile in `test-styles.html` → `css/themes/theme-base.css`
(what is already handled for you) → two shipped sheets in full
(`css/themes/studio.css` + one loud one, e.g. `brutalist.css`) → this file →
`css/styles.css` + `css/mobile-styles.css` + page HTML for selector truth. Touch exactly two files: create `css/themes/<id>.css`, and add the
registry entry + `ORDER` id in `js/theme-bootstrap.js`. Anything that seems
to require editing any other file: stop and report. No git commands. Verify:
curl each fonts URL → 200, `node --check js/theme-bootstrap.js`, grep that
every selector carries the scope, then the QA list below.

Full structural coverage — a skin must change *structure cues*, not just
tokens, or it reads as a font/color reskin. Treat every area: page ground +
scrollbar; name-logo + static menu + floating menu + mobile menu; hero (typed
masthead + sub-text + socials + photo); section headers at ID specificity
(`[data-style="…"] #jobs-header` etc.) incl. `.sec-num` + spacer line;
about/skills surfaces; jobs panel; carousel (plates, captions, dots — there
are no arrow elements); blog cards + listing + post pages; contact CTA +
Calendly button; footer; cycler-dock accents; the `≤1100px` media block.
v1 scope is Layers 1–2 (+ tilt flag where the design is still); no copy
changes; `random:` profiles are a follow-up polish round.

## JS contracts + hard-won rules

- **animationend trap**: intro reveals (hero, menus, about columns) pin final
  styles in an `animationend` handler — `animation: none` leaves them
  invisible forever. Retime, never remove. The jobs swap is setTimeout-driven
  (overriding its animation to a sheet-local keyframe or none is safe).
- **Jobs highlight bar**: all four geometry props are written inline on every
  move. Desktop `left/width` and mobile `height` are constants (safe to
  `!important` inside the matching media block); desktop `top/height` and
  mobile `left/width` are measured — never override. `border-radius` and
  `transition` are also inline → blanket `!important` is fine.
- **Menu items are measured at load** (`offsetHeight` sizes the bar): pin
  their `line-height` in px so a late webfont can't change the line box. A
  ResizeObserver in `js/script.js` re-seats the bar after live switches.
- **Limited-weight fonts**: pin everywhere the site bolds heading-font text
  (h defaults, `#typing-text`, `#blog-typing-text`, `.card-title`,
  `.fc-card-title`, `.blog-card-title`) to a loaded weight — synthesized
  bold smears.
- **Hero width budget**: the typed masthead's longest line ("full stack
  engineer.") has ~795px of desktop column — size display type to fit.
- **Tilt**: `flags.tilt: false` stamps `data-no-tilt` and `theme-base.css` holds
  the targets flat (covers the flat inline transform destroy() leaves
  behind). Hover presses use `top/left` on `position: relative`, never
  transform, with the trigger on the element that moves. With tilt ON,
  never base-rotate a tilt target; rotation goes on non-tilt wrappers only.
- **Code blocks + footers**: the `#0d1117` ground pin and the blog footer
  auto-margin restore live in `theme-base.css`; skins only add frames and chips.
- **Stilled skins**: set `flags.still: true` and `theme-base.css` kills AOS
  entrances, the cursor follower, and the dock FAB lift. Square-cornered
  skins: featured-carousel.js now treats a 0 radius as valid (no backdrop
  pin needed), but still grep all CSS for literal non-`var()` radii
  (`.fc-card-cta` is one).
- **Mobile block**: the jobs rail border clear and `.contact-image-wrapper`
  hide are in `theme-base.css`. The static menu still needs
  `align-self: flex-start` if framed (its flexbox stretches it ~11px tall).
- **Line/shadow policy**: pick a stance per sheet and document it in the
  header — fixed ink-toned shadows and white tape are fine as literals;
  every other line/fill derives from the alpha ramps so the palette toy
  keeps working. The site is content-box: frames on width-constrained images
  need `box-sizing: border-box`. `:nth-child` alternation counts hidden
  nodes (blog filter) — use `:nth-child(… of …)` or uniform treatment.
- **Palette-coupled widgets** (Plotly charts): read CSS vars at draw time and
  redraw on the `dawson:palette` CustomEvent — follow that contract for any
  new widget.

## Per-skin QA

- Default-path regression: no style selected → `<html>` attributes, inline
  writes, and network requests identical to today.
- Contrast readable, links distinguishable, focus visible; mobile ≤1100px
  works; `prefers-reduced-motion` respected for added animation.
- Blog post + carousel render (code blocks, mermaid, images); style survives
  navigation; reload returns to default.

## Rejected / parked

Forked per-theme page copies: content forks and rots — one DOM, styles as
data. Astro migration: revisit only if takeover-mode authoring hurts after
2–3 modes ship (islands/static-first fits this site better than Next); the
default is to stay no-build.
