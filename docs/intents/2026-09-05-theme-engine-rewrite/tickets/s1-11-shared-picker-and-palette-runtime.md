# S1-11 — Build shared picker chrome and isolate its palette runtime

**Status:** Done with risks 2026-09-07 · **Spec milestone:** T4 / T6 shared dependency · **Scope:** one picker component and runtime change

**Depends on:** [S1-08](s1-08-content-validation-and-preview.md), [S1-10](s1-10-theme-projection-and-paths.md)

Assign one agent this ticket plus the [execution contract](../../../superpowers/plans/2026-09-05-spec-1-migration-engine.md). Read [Spec 1](../spec-1-migration-engine-parity.md) §5.5, D11/D26/D29–D32 and Q5/Q9/Q10/Q12. Dependencies supply code and evidence; there is no owner review between tickets.

## Deliverable

A build-rendered dock, reusable trigger and FAB, with a runtime that works on a page containing no canonical DOM, scripts or libraries.

## Files

- Create: `src/layouts/canonical/components/ThemeDock.astro`, `ThemePicker.astro`, `PickerFab.astro` in that same components directory.
- Create: `public/js/theme-cycler.js`, `tests/browser/picker.spec.ts`, `tests/fixtures/picker/`.
- Modify: `public/css/theme-cycler.css` only for FAB rules.
- Read: `js/theme-cycler.js`, `js/nav-config.js:98`; do not edit canonical page runtimes.

## Interfaces

- `ThemeDock` props: `{ theme: Theme; page: PageContext }`; emits one dock plus scrim, including static roles/scheme controls and preset rows.
- `ThemePicker` props: `{ className?: string }`; emits a `.tc-nav-item` containing `button.tc-nav-trigger` with the D30 aria contract and approved prose.
- `PickerFab` props: `{ corner: 'br'|'bl'|'tr'|'tl' }`; emits that same trigger contract with `.tc-fab`.
- Runtime reads root flags, dock prose attributes, trimmed row CSS variables, `data-fonts` and active-row polarity/random profile. It publishes `dawson:palette` without detail.
- Current-page links come from `href(page.path, row.id)`; 404 supplies the default page context.

## Work

- [ ] Reproduce exact dock hierarchy and rows, including the li's empty/selected class, anchor and sibling wordmark button. Do not invent a `tc-row` class.
- [ ] Render prose, rows, role controls and schemes at build; replace static DOM construction with `wireDom()` and in-place state updates.
- [ ] Delete registry globals, old enable flag, unused STYLE_KEY, isReload and reload wipe. Return early when no dock exists.
- [ ] Trim every row custom-property read; snapshot derived-neutral tokens before the first write. Preserve four values plus two removals for skins and six removals for default.
- [ ] Keep randomizer/scheme/locks/color inputs enabled, Space shuffle, exact geometry/timing constants and forced reflow. Preserve canonical session storage and clear-on-theme-switch behavior.
- [ ] Preserve existing skins' idle font loading. Do not preload an inactive structural theme's owned fonts/assets via picker rows.
- [ ] Implement reachable FAB mouse/touch interaction and responsive placement. Use existing approved picker text, with no intermediate owner preview.
- [ ] Document runtime ownership, inputs, dependencies and initialization in the module header.

## Acceptance and verification

- [ ] Standalone fixture uses only the shared picker runtime and required picker CSS/icons; opening, switching and randomizing work.
- [ ] Every trigger works by mouse, touch and keyboard; aria-expanded and scrim reflect state.
- [ ] Row links preserve the current page; switching clears toy state, resetting uses the default row link.
- [ ] Palette controls retain native input focus while updating.
- [ ] No canonical/global registry dependency, token whitespace divergence, changed timing constant or unintended default neutral token.
- [ ] New utility FABs are tested automatically; owner QA is deferred until the complete migration.

```bash
npx playwright test tests/browser/picker.spec.ts
```

Use a runner-owned isolated fixture build/server. Do not reuse parity ports concurrently.

## Agent handoff

Record changed files, commands and exit results, and any interface adjustments in the completion report. Resolve implementation failures in scope; do not replace failed assertions with broader exclusions. Leave owner QA to the end of the complete migration.

## Completion report

Done with risks, 2026-09-07. Node v25.9.0 (Node 24 not installed; `.nvmrc` = 24 stays the CI contract). Worktree HEAD was already `665fde5` (S1-08), no fast-forward needed. `npm ci` exit 0; no other installs, no git write actions, no persistent listeners (browser tests own loopback ephemeral-port servers and tear them down). The run was interrupted by an account rate limit and a network outage; every affected agent was resumed with no work lost.

**Created:** `src/layouts/canonical/components/ThemeDock.astro` (120), `ThemePicker.astro` (26), `PickerFab.astro` (19), `public/js/theme-cycler.js` (810), `tests/browser/picker.spec.ts` (871), `tests/fixtures/picker/pages/{[...theme]/index.astro (42), [...theme]/fab/index.astro (37), fab/[corner]/index.astro (41)}`. **Modified:** `public/css/theme-cycler.css` (+78 appended, the `Utility FAB (S1-11, D12)` block; nothing above it changed), `tsconfig.json` (+1: `tests/fixtures/picker` in `exclude`, like the other fixtures). Legacy files, `harness/`, `playwright.config.ts`, `scripts/`, the rest of `public/`, `CNAME`, `.nojekyll` untouched.

**Components (handoff for S1-12, S1-14, S1-21, S1-24):** all three import `prose` from `src/prose/site.ts` (build-time only), have no `<style>`/`<script>`/CSS import, and have no canonical runtime dependency.
- `ThemeDock { theme: Theme; page: PageContext }` emits `<aside id="tc-dock" class="tc-dock tc-mega tc-hidden">` then `<div id="tc-scrim" class="tc-scrim">`, the legacy post-boot hierarchy verbatim (no `tc-row` class): 16 rows in `THEMES` order, 6 scheme buttons (`random` selected), 5 role tiles, actions, preview card. Row: `<li class="tc-row-sel"|"" style="--tc-row-text:..;--tc-row-bg:..;--tc-row-primary:..;--tc-row-secondary:..;--tc-row-accent:..;[--tc-row-heading:..;]" data-profile='{"polarity":..[,"random":..]}'>` + `<a href={href(page.path, id)} data-id class="tc-row-link menu-item tc-stagger [tc-sel]" [aria-current="true"] [data-fonts='[..]']>` + `<button data-id class="tc-row-card tc-stagger [tc-sel]" aria-pressed tabindex="-1" aria-hidden="true">`. Astro renders an empty class as bare `class` (DOM-identical to legacy `class=""`).
- `ThemePicker { className?: string; icon?: string }` emits `<li class="tc-nav-item[ className]">` with the D30 button (`type, class, aria-label, aria-haspopup="true", aria-expanded="false", aria-controls="tc-dock"`): label + caret variant (`menu-item tc-nav-trigger`) or, with `icon`, the icon-only variant (`socials-item tc-nav-trigger`), byte-equal to `nav-config.js:98-105`.
- `PickerFab { corner: 'br'|'bl'|'tr'|'tl' }` emits `<div class="tc-nav-item tc-fab" data-corner>` + `button.tc-nav-trigger.tc-fab-btn` (palette icon, aria-label `nav.theme`). CSS: fixed 16px + safe-area insets per corner, 48px round button from `--bg/--text/--primary`, `.tc-fab.tc-lift` z-index 10000, `.tc-dock.tc-mega.tc-from-fab .tc-mega-inner` height cap. Shell tail order (D29): dock, scrim, `<script defer src="/js/theme-cycler.js">`, FAB, draft pill.

**Runtime contract (`public/js/theme-cycler.js`, classic IIFE, no globals, no libraries; needs `/css/theme-cycler.css` + a Font Awesome sheet):** boots at DOMContentLoaded or immediately when parsed; returns early without `#tc-dock` (or a dock without rows). Reads `<html data-style>` (absent = default) at boot, the nine dock attributes `data-styles|advanced|back-to-styles|advanced-sub|done-editing|current|preview|lock|unlock`, every row's `--tc-row-*` (trimmed), the ACTIVE row's `data-profile` (located by `data-id`, never by the marker), skin rows' `data-fonts`, `.tc-nav-item` mounts, `.tc-fab[data-corner]`. `wireDom()` binds; nothing is created. Kept verbatim: MEASURE 940, EDGE 10, 300 ms hover close, 440 ms hide, `void dock.offsetWidth`, the `(hover: hover) and (pointer: fine)` gate, Space shuffle, palette generation, `DEFAULT_RANDOM`, derived neutrals (baseline snapshotted from `<html style>` before the first write: four values + two removals for skins, six removals for default), `loadAllFonts` after idle, `dawson:palette` (no `detail`). `switchStyle` clears storage then follows the row's own href; `resetToDefault` keeps its legacy shape.
- **Storage (the pre-paint contract for S1-12):** `sessionStorage['dawson-theme-cycler']` = `{"style":<theme id>,"colors":[5 "#rrggbb"],"locks":[5 bool],"scheme":<string>,"theme":"dark"|"light"}`. `restore()` and the pre-paint script both apply a record ONLY when `saved.style === (documentElement.getAttribute('data-style') || 'default')` and all five colours match `/^#[0-9a-f]{6}$/i`; otherwise treat it as absent (boot re-persists the current theme). The `style` field is new: with the theme in the URL, Back after a switch or a typed themed URL lands on another theme, and an unscoped record painted theme B with theme A's palette (reproduced during review). The pre-paint rewrites the 5 raw-hex roles + 95 `hsla()` steps only; the runtime restores locks/scheme/polarity/neutrals/controls after load.
- **404 (S1-12/S1-21):** built in default; its script must run before the cycler and do its work synchronously at execution (not in a DOMContentLoaded callback, which fires after every deferred script): apply `themeHtml(theme)` to `<html>` (attrs incl. `data-style`, style, links) and move the visual marker (`tc-row-sel` on the `<li>`, `tc-sel` + `aria-current="true"` on the `<a>`, `tc-sel` + `aria-pressed="true"` on the card) from the default row. Nothing else: `data-profile` is on every row. 404 passes `page = { type: 'notFound', path: '/' }` so rows link to `/<id>/` (§15.11).

**Commands and results (builder, fix agent, reviewers and orchestrator):** `npm run check` exit 0, `Result (81 files): 0 errors, 0 warnings, 48 hints`. `node --check public/js/theme-cycler.js` exit 0. `./node_modules/.bin/playwright test tests/browser/picker.spec.ts` (no `PARITY_MODE`): 28 passed in desktop-1440 + mobile-390, 0 skipped, exit 0, four consecutive runs (14.2s, 11.8s, 9.7s, 9.0s). `npm run test:unit`: 449 pass, 0 fail. `PARITY_OLD_DIR=/Users/dawsonamf/Desktop/dax/personal-website-old npm run test:build`: 27 pass (before the fix pass; the fix pass touched no build-test input). Dock DOM parity: old `/?style=<id>` (legacy files at the worktree root, externals aborted) vs new `/<id>/` for default, brutalist, marquee, grid on both viewports: canonical shapes equal after dropping only the new `data-*` and row `href`s. Em dashes: 0 in every touched file. `git status --short`: only the paths above. `./node_modules/.bin/tsc --noEmit -p tsconfig.json`: exit 2 with 8 x TS2688 (`estree 2`, `node 2`, ...): the MAIN checkout's `node_modules/@types/` holds duplicate `<name> 2` directories that TypeScript reaches through ancestor resolution from this nested worktree; `tsc --noEmit -p tsconfig.json --typeRoots ./node_modules/@types` exit 0; the builder's earlier run (before those directories appeared) was exit 0.

**Review:** four fresh reviewers (2 correctness on Fable, security and conventions on Opus); one fix pass by a fresh Opus agent: storage scoped to the theme (high), `data-profile` on every row instead of the active row only (removes the 404's re-serialization duty), `data-style` read at boot, dead fallback palette deleted, runtime header completed (`data-corner`, pill selector, ids, 404 and pre-paint contracts), stronger tests (return-to-base after divergence proven by mutation, FAB fit after the transition settles plus a 1280x600 run, keyboard FAB, programmatic shuffle while an input is focused, storage-scope cases), test hygiene (`THEME_IDS.length`, guarded `decodeURIComponent`, temp dir removed on a failed build, named waits), dead CSS declarations removed, em dashes removed.

**Deviations / interface adjustments:** (1) `ThemePicker` gains `icon?: string` (legacy mobile icon-only trigger). (2) `data-profile` rides on every row, not the active row alone (§5.5 wording). (3) The storage record gains `style` and colours are validated as `#rrggbb` (§5.4's snippet reads only `colors`). (4) `syncRoles()` writes the swatch `style` attribute and the input `value` attribute so the serialized dock matches legacy under a restored palette; the post-drag DOM therefore differs from legacy's CSSOM `rgb()` form (manual-only state). (5) `applyColors()` has no `writeUi` parameter; all tile updates are in place. (6) `PickerFab` is a `div`, and the dock carries `tc-from-fab` while opened from a FAB. (7) `tsconfig.json` exclude added.

**Accepted risks:** unvalidated `sessionStorage` values are now shape-checked but a same-origin script can still write CSS-ish strings (same-origin already means full control). `href()` passes schemes through; `page.path` is build-controlled. `data-fonts` hrefs are registry-controlled. The old-side test server serves the checkout root on loopback only for the run. Test j's font expectation and the row counts derive from `THEMES`/`THEME_IDS`. Node 25 instead of 24. **Environment block:** the duplicate `@types/* 2` directories in the main checkout's `node_modules` break bare `tsc` from any nested worktree; remove them (or `npm ci` there) before relying on `tsc` at the root.
