# S1-10 — Implement theme-to-HTML projection and content-free routing helpers

**Status:** Unstarted · **Spec milestone:** T3 · **Scope:** one pure engine change

**Depends on:** [S1-02](s1-02-baseline-harness-and-captures.md), [S1-09](s1-09-static-assets-and-vendoring.md)

Assign one agent this ticket plus the [execution contract](../../../superpowers/plans/2026-09-05-spec-1-migration-engine.md). Read [Spec 1](../spec-1-migration-engine-parity.md) §5.1/5.4, §6.1 and D31/D33. Dependencies supply code and evidence; there is no owner review between tickets.

## Deliverable

One pure theme projection reproduces the baseline's attributes/ramp, and one path helper handles every internal component link without knowing post ids.

## Files

- Create: `src/themes/ramp.ts`, `src/themes/apply.ts`, `src/themes/paths.ts`, `src/themes/validate.ts`, `src/layouts/types.ts`.
- Modify: `src/themes/types.ts`, `src/themes/registry.ts` for finalized engine assertions.
- Create: `tests/unit/theme-html.test.ts`, `tests/unit/theme-paths.test.ts`.
- Read: `harness/fixtures/baseline/theme-html.json`.

## Interfaces

- `themeHtml(theme, colors = theme.colors): { attrs: Record<string,string>; style: string; links: string[] }` is pure; its only runtime src dependency is `ramp.ts`.
- `rampDeclarations(colors: Colors): string` emits the five raw-hex bases and 95 hsla step declarations.
- `href(path: string, theme?: string): string` and `themeParams(): Array<{ theme: string | undefined }>`.
- ``PageContext = { type: PageType; path: string; previewDraft?: boolean; styleExtras?: Record<`--${string}`, string> }`` in `src/layouts/types.ts`. `path` is the unthemed canonical path, including a concrete post id.
- Page-owned prose/ticker declarations are passed in `styleExtras`; `themeHtml` never imports prose. This resolves §5.4's schematic inclusion of page prose while retaining D33's pure dependency boundary.

## Work

- [ ] Port exact hex-to-HSL arithmetic, rounding, alpha percentages, property order and token absence from the baseline.
- [ ] Implement default/nondefault attributes and ordered font/base/skin link projection. New typing attributes carry the exact legacy defaults.
- [ ] Implement every href rule, including schemes, protocol-relative URLs, fragments, static prefixes, default and relative-path rejection.
- [ ] Keep same-page home fragments bare; preserve queries/hashes; do not prefix static assets or subsites.
- [ ] Add public skin-file assertions through a build-only validation entry point. Browser projection must not import Node filesystem APIs or layout factories.
- [ ] Compare all 16 theme results with the pre-cycler references as declaration maps; separately assert new typing carriers.

## Acceptance and verification

- [ ] Default has the ramp and no theme tokens/skin flags/assets.
- [ ] Every base role remains a raw hex string; all 95 step values exactly match baseline formatting.
- [ ] ThemeHtml and ramp can be bundled for the browser with no content, filesystem or Astro-layout dependency.
- [ ] Reserved ids, missing CSS and empty structural layouts fail validation.
- [ ] Paths remain independent of the post reader and any theme-specific page catalog.

```ts
assert.equal(href('/blog/toolbelt/', 'doodle'), '/doodle/blog/toolbelt/');
assert.equal(href('#contact', 'doodle'), '#contact');
assert.equal(href('/resources/contact.vcf', 'doodle'), '/resources/contact.vcf');
assert.throws(() => href('../blog/', 'doodle'));
assert.deepEqual(themeParams()[0], { theme: undefined });
```

```bash
node --test tests/unit/theme-html.test.ts tests/unit/theme-paths.test.ts
```

## Agent handoff

Record changed files, commands and exit results, and any interface adjustments in the completion report. Resolve implementation failures in scope; do not replace failed assertions with broader exclusions. Leave owner QA to the end of the complete migration.
