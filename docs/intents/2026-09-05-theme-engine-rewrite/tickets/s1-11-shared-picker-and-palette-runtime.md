# S1-11 — Build shared picker chrome and isolate its palette runtime

**Status:** Unstarted · **Spec milestone:** T4 / T6 shared dependency · **Scope:** one picker component and runtime change

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
