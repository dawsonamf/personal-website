# S1-14 — Port canonical navigation, shared chrome and behavior dependencies

**Status:** Unstarted · **Spec milestone:** T4 · **Scope:** one canonical shared-component change

**Depends on:** [S1-13](s1-13-engine-invariants-and-migrated-harness.md)

Assign one agent this ticket plus the [execution contract](../../../superpowers/plans/2026-09-05-spec-1-migration-engine.md). Read [Spec 1](../spec-1-migration-engine-parity.md) §3.3, §6.2, §8 and D16/D30/D32. Dependencies supply code and evidence; there is no owner review between tickets.

## Deliverable

Build-rendered canonical navigation/social/footer markup and correctly isolated shared canonical behavior, ready for home/listing/post assembly.

## Files

- Create: `src/layouts/canonical/components/Nav.astro`, `Socials.astro`, `Footer.astro` in the same directory.
- Create: `public/js/nav-behavior.js`, `public/js/typing-engine.js`, `public/js/anim-utils.js`, `public/js/cursor-follow.js`.
- Create: `tests/browser/canonical-chrome.spec.ts`, `tests/fixtures/canonical-chrome/`.
- Read: `js/nav-config.js`, corresponding root behavior scripts and §8's resource order.
- Do not edit Shell, picker runtime or page assembly files.

## Interfaces

- Nav props `{ theme, page }`; Socials props `{ theme, mount: 'home'|'blog'|'contact' }` reproduce the corresponding baseline container; Footer renders the baseline desktop/mobile variants requested by its caller.
- All internal navigation uses href. Nav owns the shared ThemePicker trigger when composed as nav.
- Behavior modules read only their owned DOM/data and root flags. Page layouts explicitly emit their script tags.
- Type mode reads root dataset.typing/typingDelete with original fallbacks; no theme globals.

## Work

- [ ] Reproduce current nav/social HTML, order, classes, mobile/desktop variants, link target/rel and Calendly classes from the owning prose.
- [ ] Keep home anchors bare; subpage anchors route to the themed home. Logo follows theme; vCard stays an asset URL.
- [ ] Split nav behavior from config/rendering, retaining sticky threshold 300 and binding every Calendly link with live palette colors/fallbacks.
- [ ] Port typing engine with dataset reads; remove dead restart and lastConfig state. Preserve all timings.
- [ ] Retain animation finalization/cursor behavior; remove the obsolete data-style observer only after verifying no canonical page flow needs it.
- [ ] Document owner, DOM inputs, dependencies, initialization and listener lifecycle in each retained module header.
- [ ] Test chrome in isolated home/listing/post fixtures, including script timing and absence of duplicated initialization.

## Acceptance and verification

- [ ] Normalized nav/social/footer DOM matches baseline at both widths.
- [ ] Calendly URL colors reflect the live palette; a test stub observes all applicable bindings without relying on the blocked API.
- [ ] Shared scripts are not added to utility or structural-owned layouts.
- [ ] All module dependencies are explicit and no build data rendering remains in nav behavior.
- [ ] Typing/cursor/intro behavior preserves constants and flag polarity.

```bash
npx playwright test tests/browser/canonical-chrome.spec.ts
npm run check
```

## Agent handoff

Record changed files, commands and exit results, and any interface adjustments in the completion report. Resolve implementation failures in scope; do not replace failed assertions with broader exclusions. Leave owner QA to the end of the complete migration.
