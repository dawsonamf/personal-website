# Spec: Multiple Style Versions ("hella themes" easter egg)

Status: **planned, not started**. This documents the agreed architecture discussion
(June 2026) so implementation can pick it up later.

## The idea

Same content and structure, but the site can be experienced in radically different
design languages as an easter egg: 90s GeoCities, early-2000s glossy web, old
newspaper, modern SaaS startup, famous-art-style versions (Mondrian, Van Gogh,
vaporwave, terminal/BBS, brutalist, …). Content (about, jobs, projects, blog) never
forks — only the chrome, styling, and optionally the copy's voice change.

## Starting point: ~80% of the engine already exists

The current theme system already provides:

- **CSS custom properties as the styling backbone** — 5 semantic color roles
  (`--text`, `--bg`, `--primary`, `--secondary`, `--accent`) plus generated alpha
  ramps (`--text5` … `--text95`, etc.).
- **Pre-paint application** — `js/theme-bootstrap.js` runs synchronously in `<head>`
  and applies persisted state before first paint (no flash of default theme).
- **A theme UI with state, persistence, and an unlock easter egg** —
  `js/theme-cycler.js` (palette dock, sessionStorage persistence, `data-theme`
  attribute on `<html>`, click-the-selfie unlock).
- **A lazy per-page asset loader pattern** — `blog/blog-post.js`'s
  `loadPostScripts`/`loadPostStyles` chain is exactly the mechanism a theme's
  optional JS/CSS needs.

What's missing: today's system themes **palettes**. Style versions are **full design
languages** — typography, shape, texture, density, behavior, and voice.

## Architecture: a theme registry with layered capabilities

Each theme is one entry in a registry (e.g. `js/themes/index.js`):

```js
{
  id: '90s',
  label: 'GeoCities '96',
  tokens: { /* colors + fonts + radii + shadows ... */ },
  fonts: [ /* optional Google Fonts URLs to inject */ ],
  css:   'css/themes/90s.css',   // optional, lazy-loaded
  js:    'js/themes/90s.js',     // optional, lazy-loaded
  flags: { tilt: false, cursorFollow: false, typing: 'instant' },
  strings: { /* optional copy overrides */ },
}
```

Themes opt into progressively heavier layers:

### Layer 1 — token sheet (data only, ~30 lines per theme)

The theme sets values for an expanded token vocabulary and stamps
`data-theme="<id>"` on `<html>`. The existing alpha-ramp generator is reused as-is.
New tokens to introduce (with current values as defaults so the default theme is
pixel-identical): `--font-body`, `--font-heading`, `--font-mono`, a small font-size
scale, `--radius-card` / `--radius-pill`, `--shadow-card`, `--motion-scale`.

Cheap themes this layer alone can express: terminal/BBS, vaporwave, solarized,
SaaS-light, Mondrian-palette, Van-Gogh-palette.

### Layer 2 — scoped CSS overlay (a "skin", ~100–300 lines)

For design moves tokens can't express (beveled 3D borders and tiled backgrounds for
90s; justified multi-column text, column rules, and drop caps for newspaper; thick
black Mondrian frames). Every rule scoped under `[data-theme="90s"]` so skins can't
leak. Loaded lazily on first activation; default visitors pay nothing.

Stable semantic class names (`.card-style`, `.section-header`, `.menu-list`, …) are
the hooks that make skins possible — keep them stable.

### Layer 3 — behavior flags + optional JS gimmicks

Some themes need different behavior, not just looks:

- `flags` consulted by existing scripts at init: disable tilt (VanillaTilt),
  disable cursor-follow, switch the typing animation to instant text, etc.
  Existing scripts already null-check; gating slots in naturally.
- Optional per-theme script for additive gimmicks (90s hit counter + marquee,
  newspaper halftone treatment), lazy-loaded with the `loadPostScripts` pattern.
- Images stay constant (they're content) but can get per-theme CSS `filter`
  treatments (sepia/halftone for newspaper, posterize for art themes).

### Layer 4 (optional) — copy/voice overrides

Hero typing sequences, masthead/nav labels, footer line ("Dawson's Cyber Corner",
"THE METZGER-FLEETWOOD TIMES"). Typing sequences and nav already live in JS config,
so a `strings` map slots in. Build the slot; author sparingly. Body content never
changes per theme.

## Engine changes mapped to existing files

- **`js/theme-bootstrap.js`** → generalize from "restore palette" to "restore active
  theme": read persisted theme id, stamp `data-theme`, apply tokens, synchronously
  inject the theme's CSS `<link>` if it has one (same pre-paint FOUC-prevention job
  it does today).
- **`js/theme-cycler.js`** → keep the unlock flow and dock; add a preset strip
  (theme names or swatch thumbnails). The random-palette toy remains one feature
  beside presets — they compose (pick "newspaper", then randomize its palette).
- **URL parameter** → support `?theme=90s` in the bootstrap so themes are shareable.
- **Persistence decision** (the one real UX choice):
  - Palette toy: keep current behavior (sessionStorage, reset on reload).
  - Style versions: probably `localStorage` so the choice sticks across visits —
    though "reload returns you to reality" is a defensible bit. Decide at build time.

## Prerequisites (cleanup that should land first)

1. **Single source of truth for the default palette.** Today it's defined in ~6
   places: `css/styles.css :root`, `theme-bootstrap.js DEFAULTS`,
   `theme-cycler.js DEFAULT_COLORS`, the Calendly URL colors (now centralized in
   `js/nav-config.js`, but still hardcoded hex), mermaid `themeVariables` in
   `blog/post.html`, and `accentColor` per project in `js/blog-data.js`.
   The default theme should become just the first registry entry.
2. **Static alpha-ramp fallbacks in `:root`** (the "alpha ramp" item deferred from
   the June 2026 cleanup): declare the generated `--text5`…`--text95` etc. values
   statically in CSS so the design system exists without JS and is documented in
   one greppable place. Zero visual change when JS runs (inline styles win).
3. **Tokenize typography/radius/shadow in `styles.css`** with current values as
   defaults — a mechanical, visually-invisible pass (verify by screenshot diff).
4. **Fix theme leaks** so every theme actually reaches everything: Calendly popup
   colors, mermaid theme variables, `accentColor` fields in `blog-data.js`,
   hardcoded `'SF Mono'` font-families → all should read CSS variables at use time.

## Suggested sequencing

1. Prerequisites above (each is independently safe and useful).
2. Generalize bootstrap + cycler into the registry/engine.
3. Ship two cheap Layer-1 themes (terminal, vaporwave) to prove the pipe end-to-end.
4. Build the marquee Layer-2/3 themes: 90s, newspaper, early-2000s.

## Rejected alternative

Forked static copies of the site per theme (like a fleet of standalone pages).
Hand-craftable but content forks N ways and rots immediately. The registry approach
keeps one content source and one DOM, with style/behavior as data. (`12years/`
remains a standalone art *page* — different thing from a styled *version of the
site*, and fine as-is.)

## Per-theme QA checklist (when themes get built)

- Content stays readable: contrast on text, links distinguishable, focus visible.
- Mobile (≤1100px) layout still works under the skin's overrides.
- `prefers-reduced-motion` respected for any added theme animation.
- Blog post pages and the carousel render correctly (code blocks, mermaid, images).
- Theme survives navigation between pages; reload behavior matches the
  persistence decision.
