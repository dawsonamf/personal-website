# S1-21 — Complete privacy, themed 404 and picker-free LexChat

**Status:** Unstarted · **Spec milestone:** T6 · **Scope:** one utility page family

**Depends on:** [S1-17](s1-17-canonical-home-integration.md)

Assign one agent this ticket plus the [execution contract](../../../superpowers/plans/2026-09-05-spec-1-migration-engine.md). Read [Spec 1](../spec-1-migration-engine-parity.md) §6.2–6.3, D12/D13/D27/D30 and Q4/Q14. Dependencies supply code and evidence; there is no owner review between tickets.

## Deliverable

All utility pages use their correct canonical DOM and shared composition, including working privacy/404 FABs and the retained LexChat iframe shell.

## Files

- Modify: `src/layouts/canonical/Privacy.astro`, `NotFound.astro`, `LexChat.astro`.
- Modify: `src/pages/404.astro`, `src/themes/not-found.ts` for final runtime integration.
- Create: `tests/unit/not-found-theme.test.ts`, `tests/build/utility-html.test.ts`, `tests/browser/utility-picker.spec.ts`.
- Read: `privacy/index.html`, `404.html`, `lexchat/index.html`.
- Do not edit Astro config, shared picker CSS/runtime or unrelated canonical behavior. Report shared defects to the integration owner for a serialized correction.

## Interfaces

- Privacy and NotFound use Shell's FAB composition; both preserve desktop and mobile footer blocks.
- LexChat contains only the existing full-viewport iframe and receives mount none: no dock, scrim, trigger, FAB, icon-font addition or picker runtime.
- Canonical layouts supply canonicalStyleExtras with carousel false.
- 404 serializes needed appearance and CSS-prose values for all registered themes at build; runtime uses themeHtml and those values without parsing prose or importing layouts.

## Work

- [ ] Port privacy's main-body, logo/header, full approved body and both footer variants.
- [ ] Port 404's main-body/logo/nf block/footers with root-absolute URLs and style is:inline; add the specified Font Awesome link for picker icons.
- [ ] Preserve 404's default link destinations while applying selected theme attributes, tokens, ordered links and active dock row.
- [ ] Ensure 404 application completes before cycler reads its active row and restores palette state without erasing the selected theme.
- [ ] Retain /lexchat/ and its project link to the shell, with exactly the specified iframe target.
- [ ] Apply full CSS for skins on utilities; structural utilities use tokens/fonts without owned assets or theme-base.
- [ ] Check FAB opening by touch/mouse, responsive reachability and at least default/brutalist/doodle appearances automatically. Do not request an owner preview.

## Acceptance and verification

- [ ] Privacy/404/LexChat × 16 × 2 pass parity under only §9's explicit additions.
- [ ] /404.html?style=brutalist and ?style=doodle apply their skins and open a functional picker.
- [ ] resolveNotFoundTheme covers /brutalist/nope/, /nope/, /brutalist/, unknown segment + valid query and conflicting valid path/query.
- [ ] No canonical scripts on utilities, no picker runtime on LexChat, and exactly one ThemeAssets marker each.
- [ ] Path-themed unknown-URL behavior is unit-tested now and verified on GitHub Pages in S1-28; Python serving 404.html is not evidence of host fallback.

```bash
node --test tests/unit/not-found-theme.test.ts
node --test --test-concurrency=1 tests/build/utility-html.test.ts
npm run build
npx playwright test tests/browser/utility-picker.spec.ts
PARITY_MODE=old-new npm run test:parity -- --grep '@page:(privacy|notFound|lexchat)'
```

## Agent handoff

Record changed files, commands and exit results, and any interface adjustments in the completion report. Resolve implementation failures in scope; do not replace failed assertions with broader exclusions. Leave owner QA to the end of the complete migration.
