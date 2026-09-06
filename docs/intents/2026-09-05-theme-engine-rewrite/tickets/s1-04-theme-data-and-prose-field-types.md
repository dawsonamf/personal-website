# S1-04 — Port theme data and define reusable prose field types

**Status:** Unstarted · **Spec milestone:** T2 · **Scope:** one pure-contract change

**Depends on:** [S1-01](s1-01-runtime-and-astro-compatibility.md)

Assign one agent this ticket plus the [execution contract](../../../superpowers/plans/2026-09-05-spec-1-migration-engine.md). Read [Spec 1](../spec-1-migration-engine-parity.md) §4.1, §5.1, D28, D32 and D37. Dependencies supply code and evidence; there is no owner review between tickets.

## Deliverable

The authoritative typed 16-theme registry and reusable strict prose field schemas, without eager layouts or client globals.

## Files

- Create: `src/themes/types.ts`, `src/themes/registry.ts`, `src/prose/fields.ts`.
- Create: `tests/unit/theme-registry.test.ts`, `tests/unit/prose-fields.test.ts`.
- Read: `js/theme-bootstrap.js` and the execution contract's theme order.

## Interfaces

- Export `PageType`, `OwnablePageType`, `Colors`, `Theme`, `SkinTheme`, `StructuralTheme`, `LazyLayout` as §5.1 specifies.
- Define schematic `Profile` fully from the current randomizer: saturation ranges, five ordered roles, lightness ranges, hue interpolation and optional role saturation.
- Export `THEMES` and `THEME_IDS` in picker order. Labels live only in prose; layouts are lazy imports.
- Export `Size = 'xs' | 's' | 'm' | 'l'`, `DraftText`, `SizedText`, `SizedList`, `LabelList`, and their strict schemas for other content owners.
- Size maps are partial maps with at least one entry; explicit null is valid. Label-list items support strings or draft objects. No output path may expose unvalidated draft-capable lists.

## Work

- [ ] Port exact colors/tokens/fonts/flags/typing/random values for the 16 active entries; default has no CSS, flags, tokens or fonts.
- [ ] Assert default-first, unique/reserved ids and nonempty structural layouts. S1-10 adds file checks after the public move.
- [ ] Implement strict size-map/text/list/draft schemas, xs Markdown restrictions and `{n}` template refinement.
- [ ] Keep registry runtime dependencies pure enough for theme projection; disk assertions must not pull filesystem code into the 404 browser bundle.
- [ ] Test invalid ids, malformed profiles, misspelled keys, empty maps, null, draft list items and missing template placeholders.

## Acceptance and verification

- [ ] Registry order matches all 16 ids in the execution contract; inactive skins stay unregistered.
- [ ] Registry data matches baseline values, including missing default tokens.
- [ ] Structural types cannot own privacy, notFound or lexchat.
- [ ] No redundant ORDER/owns/storageNamespace/breakpoint/modes fields, runtime theme globals or eager Astro imports.
- [ ] Field schemas work in the Node post reader without `astro:content` or layouts.

```bash
node --test tests/unit/theme-registry.test.ts tests/unit/prose-fields.test.ts
```

## Agent handoff

Record changed files, commands and exit results, and any interface adjustments in the completion report. Resolve implementation failures in scope; do not replace failed assertions with broader exclusions. Leave owner QA to the end of the complete migration.
