# Style versions ("hella themes" easter egg)

Same content, radically different design languages, behind the cycler-dock
easter egg. Engine + five skins (studio, brutalist, broadsheet, field-notes,
blueprint) shipped June 2026. **Queue: doodle → lava lounge → wheatpaste** —
approved visuals and per-style notes (palette roles, fonts, flags, technique)
live as tiles in [test-styles.html](test-styles.html); the rest of that sheet
is parked, TBD. Future engine work, in rough order: Layer-4 strings, a
read-only content API (`js/content-api.js`), Layer-5 takeover modes (a lazy
JS module renders its own UI into an injected `#style-root`; the canonical
DOM stays in place, hidden not removed).

## Architecture

- **Registry** in `js/theme-bootstrap.js`: one entry per style — id, label,
  polarity, colors (the five roles), tokens, fonts (Google Fonts URLs), css
  (sheet path), optional `flags` and `random` palette profiles. The default
  entry IS the site as-built: stamps nothing, loads nothing. Append new ids
  to `ORDER`.
- **Attribute**: `data-style="<id>"` on `<html>`, absent for default.
  `data-theme` keeps its dark/light palette-toy meaning; the axes compose.
- **Persistence**: session-only. sessionStorage carries the id across
  navigation; any reload returns to default. `?style=<id>` applies + seeds
  the session (`?style=default` clears). A non-default style always shows the
  FAB and unlocks the session, so deep links can't strand anyone.
- **Tokens: the registry defines, skins consume.** Token values exist only in
  `css/styles.css :root` (defaults) and inline writes on `<html>` — never in
  skin sheets. Switching styles clears palette-toy overrides; when the toy
  diverges from the active style's base palette, `js/theme-cycler.js` derives
  `--jobs-menu-*`/`--neutral-gray`/`--code-bg`/`--code-fg` and restores them
  on return to base.
- **Skin sheets** at `css/themes/<id>.css`: every rule scoped under
  `[data-style="<id>"]`, root-absolute asset paths, `@keyframes` names
  prefixed with the id (names are global — safe only because a sheet loads
  solely while its style is active). **`css/themes/_base.css` loads with any
  skin, before the skin sheet**, and carries the shared plumbing: code-block
  ground, blog footer centering, the mobile rail/contact-wrapper fixes, the
  stillness pack, and the tilt pins. Skin sheets carry only their own design.
- **Layers**: 1 tokens → 2 scoped CSS skin → 3 behavior flags → 4 strings
  (slot exists in concept only; author sparingly, body content never changes)
  → 5 takeover. Flags: `flags.tilt: false` gates every `VanillaTilt.init`
  via `window.__styleAllowsTilt()` (live switches destroy instances) and
  `flags.still: true` marks a motionless skin. Both stamp `<html>`
  attributes (`data-no-tilt`, `data-still`) consumed by `_base.css`.

## Building a skin (agent protocol)

Read order: the style's tile in `test-styles.html` → `css/themes/_base.css`
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
- **Tilt**: `flags.tilt: false` stamps `data-no-tilt` and `_base.css` holds
  the targets flat (covers the flat inline transform destroy() leaves
  behind). Hover presses use `top/left` on `position: relative`, never
  transform, with the trigger on the element that moves. With tilt ON,
  never base-rotate a tilt target; rotation goes on non-tilt wrappers only.
- **Code blocks + footers**: the `#0d1117` ground pin and the blog footer
  auto-margin restore live in `_base.css`; skins only add frames and chips.
- **Stilled skins**: set `flags.still: true` and `_base.css` kills AOS
  entrances, the cursor follower, and both dock lifts. Square-cornered
  skins: featured-carousel.js now treats a 0 radius as valid (no backdrop
  pin needed), but still grep all CSS for literal non-`var()` radii
  (`.fc-card-cta` is one).
- **Mobile block**: the jobs rail border clear and `.contact-image-wrapper`
  hide are in `_base.css`. The static menu still needs
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
