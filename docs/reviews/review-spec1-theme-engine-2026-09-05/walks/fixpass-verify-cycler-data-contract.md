# Fix-pass verification: cycler data contract after D1/D32 (Explore subagent of the Opus fix pass)

Read all 777 lines of `theme-cycler.js`, the bootstrap helper bodies, the spec's §5.5/§5.4/D32, and all five tilt gates. Findings below.

## 1. Every registry / global / DEFAULT_COLORS read in `/Users/dawsonamf/Desktop/dax/personal-website/js/theme-cycler.js`

| # | file:line | what it reads | scope | covered? |
|---|---|---|---|---|
| 1 | `:5` | `window.__THEME_CYCLER_ENABLED` — feature gate, early return | n/a | yes — replaced by "`#tc-dock` exists or return" |
| 2 | `:9` | `window.__THEME_REGISTRY` → `REGISTRY` | all | yes — rows |
| 3 | `:10` | `window.__THEME_ORDER` → `STYLE_ORDER` | all (order) | yes — DOM order of rows |
| 4 | `:11` | `entryColors`: `e.colors.{text,bg,primary,secondary,accent}` (helper, 5 call sites below) | varies | yes — `--tc-row-{text,bg,primary,secondary,accent}` |
| 5 | `:13` | `REGISTRY.default` + its colors → `DEFAULT_COLORS` | default entry | yes — default row's `--tc-row-*` |
| 6 | `:102` | `REGISTRY[state.style]` | active (`state.style` is never mutated off-active; `switchStyle` navigates) | yes — `data-style` → matching row |
| 7 | `:103` | `entry.random[mode]` (palette profile, `light`/`dark`) | active only, 3 of 16 themes have one | yes — active-row JSON attr |
| 8 | `:167` | `REGISTRY[window.__ACTIVE_STYLE] \|\| REGISTRY.default` | active | yes — `documentElement.dataset.style \|\| 'default'` |
| 9 | `:170` | `activeEntry.id` → `state.style` | active | yes — `data-style` / row `data-id` |
| 10 | `:171` | `entryColors(activeEntry)` → initial `state.colors` | active | yes — active row `--tc-row-*` |
| 11 | `:174` | `activeEntry.polarity` → `state.theme` | active | yes — active-row JSON attr |
| 12 | `:214` | `REGISTRY[state.style]` | active | yes |
| 13 | `:215` | `entryColors(entry)` / `DEFAULT_COLORS` → divergence baseline | active | yes — active row `--tc-row-*` |
| 14 | `:219` | `entry.tokens[k]` for the six `DERIVED_NEUTRALS` (`:208`), incl. the absent/`removeProperty` case | active only | yes — `<html style>` snapshot (see caveat) |
| 15 | `:273` | `REGISTRY[id]` existence guard + `id === state.style` in `switchStyle` | all | yes — row presence + `data-id` vs `data-style` |
| 16 | `:287` | `STYLE_ORDER.map` — build the strip | all (order) | yes — rows are build-rendered |
| 17 | `:288` | `REGISTRY[id]` per row | all | yes |
| 18 | `:290` | `entryColors(e)` → the five `--tc-row-*` | all | yes |
| 19 | `:291` | `e.tokens['--font-heading']` → `--tc-row-heading` | all (absent for default) | yes — `--tc-row-heading` is in the `--tc-row-*` family |
| 20 | `:303` | `e.label` (wide row link text) | all | yes — build renders `prose.themes.<id>.label.xs` |
| 21 | `:305` | `e.label` (wordmark card `.tc-wm-name`) | all | yes |
| 22 | `:335` | `REGISTRY[id]` in `paintPreview` | **all** (any hovered/focused row) | yes — hovered row element |
| 23 | `:339` | `entryColors(entry)` for a non-active preview (`text,bg,primary,accent`; skips secondary) | **all** | yes — hovered row `--tc-row-*` |
| 24 | `:340` | `entry.tokens['--font-heading']` → `--tc-pv-heading`, incl. `removeProperty` case | **all** | yes — hovered row `--tc-row-heading` |
| 25 | `:349` | `entry.label` → `#tc-preview-name` | **all** | yes — row link `textContent` |
| 26 | `:374` | `STYLE_ORDER.forEach` in `loadAllFonts` | all | yes — rows |
| 27 | `:375` | `REGISTRY[id]` in `loadAllFonts` | all | yes |
| 28 | `:376` | `Array.isArray(e.fonts)` | all (absent for default, grid) | yes — `data-fonts` (`[]`/absent) |
| 29 | `:377` | `e.fonts.forEach(href)` | **all** | yes — `data-fonts` JSON array |
| 30 | `:391` | `DEFAULT_COLORS.slice()` in `resetToDefault` | default entry | yes — default row |

**Reads with no source under the replacement: none.** Every one of the 30 maps to a row attribute, `<html>`, or the neutrals snapshot. The two non-active-scope needs (`fonts` for all themes at `:377`, and `colors` + `--font-heading` + `label` for a *hovered* theme at `:339-349`) are exactly what `data-fonts` and the per-row `--tc-row-*` supply, and neither `polarity` nor `random` is ever read for a non-active theme — so keeping those two on the active row only is correct, not a shortcut.

## 2. Tilt gates and typing lookups — all pure active-theme lookups

`/Users/dawsonamf/Desktop/dax/personal-website/js/theme-bootstrap.js:646-667`: all three helpers are `REGISTRY[window.__ACTIVE_STYLE || 'default']` then one field with a default (`!(flags.tilt === false)`, `typing || 'cursor'`, `typingDelete || 'char'`). No cross-theme access, no argument.

`:703-706` stamps `data-style`, `data-still` (`flags.still`), `data-no-tilt` (`flags.tilt === false`) — and only inside `if (entry.id !== 'default')`. Absence-means-default is already the invariant on both sides, so:

- `js/script.js:257`, `js/script.js:397`, `js/featured-carousel.js:190`, `blog/blog-post.js:182`, `blog/blog-listing.js:142` — all five are `window.__styleAllowsTilt` with a truthy-guard; `!documentElement.hasAttribute('data-no-tilt')` is byte-for-byte equivalent, including the default theme (no `flags` → no attribute → tilt on) and non-default themes with `flags` but no `tilt` key.
- `js/typing-engine.js:99` and `:109` — both are `config.mode/deleteMode || <global helper>() || literal`. `dataset.typing || 'cursor'` and `dataset.typingDelete || 'char'` are equivalent. These two attributes do **not** exist today; the build must start emitting them (D32 says so, and the §9 exception table lists them).

`window.__PAGE_PATH` **does not exist**: zero hits in the entire repo outside the spec's own prose (D32 line 81 and §5.5 line 559). D32's "seven globals" is right by count (`__THEME_CYCLER_ENABLED`, `__THEME_REGISTRY`, `__THEME_ORDER`, `__ACTIVE_STYLE`, and the three helpers) but names `__PAGE_PATH` as one of them, which is a phantom.

## Verdict

The replacement is complete for `theme-cycler.js` — all 30 registry reads have a source, and the five tilt gates plus the two typing lookups are pure single-field active-theme reads that `<html>` already carries or (for `data-typing`/`data-typing-delete`) will once the build stamps them. Three things to fix or watch, none of them a missing carrier: (1) `nav-config.js:27` is a **second** consumer of `__THEME_CYCLER_ENABLED` — it pushes the `Theme` nav item into `NAV_CONFIG` — and §5.5's "the cycler runs wherever `#tc-dock` exists" doesn't address it; the nav item has to become build-rendered (D30's trigger contract implies this, but the deletion of the global is only justified against the cycler). (2) The six-neutral snapshot must be captured before the first `applyDerivedNeutrals()` write, since that function writes the same six properties onto `<html style>` when the restored palette is diverged — reading it lazily on first call still works (`boot()` order is `restore` → `applyColors` → `applyDerivedNeutrals`), reading it after does not; also worth noting `--code-bg`/`--code-fg` appear in **zero** registry entries, so both today's `entry.tokens[k]` and the snapshot resolve to `removeProperty` for them, which is fine but means the "six tokens" are really four. (3) Reading `--tc-row-*` back needs `row.style.getPropertyValue(...)` plus `.trim()` — custom-property values round-trip with authored leading whitespace in some engines, and `:216`'s divergence test is a raw lowercased string compare, so an untrimmed read would report "diverged" on a fresh page and silently swap every theme's jobs-rail neutrals for the derived blends.
