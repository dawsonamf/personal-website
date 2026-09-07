# S1-04 — Port theme data and define reusable prose field types

**Status:** Done 2026-09-06 · **Spec milestone:** T2 · **Scope:** one pure-contract change

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

## Completion report

Done, 2026-09-06. Ran on Node v25.9.0 (Node 24 not installed; `.nvmrc` = 24 stays the CI contract). Worktree branched stale at `1208d01`; the coordinator fast-forwarded it to `fb42d21` before any work. `npm ci` exit 0 (no other installs).

**Created** (nothing modified, nothing deleted): `src/themes/types.ts` (51 lines), `src/themes/registry.ts` (576), `src/prose/fields.ts` (57), `tests/unit/theme-registry.test.ts` (227), `tests/unit/prose-fields.test.ts` (169). No shared file owned by another ticket was touched.

**Exported interfaces (the handoff for S1-05, S1-09, S1-10):**
- `types.ts`: `PageType`, `OwnablePageType`, `Colors`, `Range = [number, number]`, `RoleProfile { l: Range; hueT: number; sat?: Range }`, `Profile { sat: Range; roles: [RoleProfile x5] }` (order text, bg, primary, secondary, accent, as `theme-cycler.js` reads them), `RandomProfile { light; dark }`, `LazyLayout`, `SkinTheme`, `StructuralTheme`, `Theme`. Only import is `import type { AstroComponentFactory } from 'astro/runtime/server/index.js'` (erased). `ThemeBase` is private.
- `registry.ts`: `RESERVED_IDS: readonly string[]` (the 15 §5.1 ids), `THEMES: readonly Theme[]` (16 skins in picker order), `THEME_IDS: readonly string[]`, `assertRegistry(themes: readonly Theme[]): void` (called at import). Zero runtime imports, so it is safe for the 404 bundle. `label` is prose (`themes.<id>.label`); default has no css/flags/tokens/fonts/random/typing.
- `fields.ts` (`import { z } from 'astro/zod'`, plain-Node loadable, no `astro:content`): `SIZES`, `Size`, `Written<T> = T | { draft: T } | null`, `draftText`/`DraftText`, `sizedText`/`SizedText` (optional xs/s/m/l, each `string | { draft } | null`, at least one key, `{}` fails), `sizedList`/`SizedList` (values `string[] | { draft: string[] } | null`), `labelItem`/`LabelItem`, `labelList`/`LabelList` (`LabelItem[] | null`, `[]` valid), `sizedTemplate`/`SizedTemplate` (every written size contains `{n}`). All objects are `strictObject`. xs strings, xs drafts and xs list items reject `[`, `*` and backtick; s/m/l are unrestricted.

**Commands and results** (run by the builder, four reviewers and the orchestrator):
- `node --test tests/unit/theme-registry.test.ts tests/unit/prose-fields.test.ts`: tests 45, pass 45, fail 0, skipped 0, exit 0. `npm run test:unit`: same.
- `node_modules/.bin/tsc --noEmit -p tsconfig.json`: exit 0, no output (all nine `@ts-expect-error` directives consumed a real error).
- `node -e "import('./src/themes/registry.ts')..."`: `16 default`; `fields.ts` imports under plain Node.
- Parity: the registry test runs `js/theme-bootstrap.js` in a `node:vm` realm and `deepStrictEqual`s all 16 entries (only `label` removed, only `kind` added); two reviewers reproduced full mechanical parity independently (fonts/tokens byte-identical; counts css 15, flags 14, tokens 15, fonts 14, random 3, typing 8, typingDelete 1). Inactive space/vapor/wanted/constructivist are unregistered.
- Type-level: structural layouts cannot own privacy/notFound/lexchat; `Theme` cannot carry `label`/`ORDER`; malformed `Profile` shapes (4 roles, string `hueT`, scalar `l`) fail `tsc`.

**Deviations / interface adjustments:**
- `THEMES`/`THEME_IDS` are `readonly` (spec writes `Theme[]`); compile-time only, nothing is frozen.
- `assertRegistry` also enforces id shape `^[a-z0-9-]+$` (ids are URL segments; the reserved check alone is case-blind). Beyond §5.1's literal list; all 16 ids comply.
- No css-file disk check here (ticket defers it to S1-10 after S1-09's public move); no `label`, `ORDER`, `owns`, `storageNamespace`, `breakpoint`, `modes`, no window globals.
- The picker's `DEFAULT_RANDOM` fallback is runtime data and stays with `theme-cycler.js` (S1-11), not the registry.
- Parity test source: `${PARITY_OLD_DIR ?? repoRoot}/js/theme-bootstrap.js`, hard failure if missing (never skipped). The ticket that retires `js/` (S1-25) must re-point this default to the baseline checkout or retire the parity test.
- Type-only extras beyond the ticket list: `Range`, `RoleProfile`, `Profile`, `Written<T>`, `LabelItem`, `SizedTemplate`, and the `RESERVED_IDS` constant, for S1-05's accessor and S1-10's routing.

**Review:** four fresh reviewers (2 correctness on Fable, security and conventions on Opus), no high-severity findings; one fix pass applied (durable `0f196d0` pointer in the header, `in`-based default purity, id shape, defined-layout check, S1-01-style `PARITY_OLD_DIR` precedence, malformed-profile type checks, test consolidation 52 -> 45 with more rejection cases).

**Accepted risks:** `node:vm` is a realm shim, not a sandbox (it runs a repo-owned file in a dev test). `PARITY_OLD_DIR` is unvalidated (dev-only env var). `''` is a valid written string and an all-null template passes (null means omit, per §4.1). `draftText` itself carries no xs guard (xs fields go through `sizedText`/`labelList`, whose drafts are guarded). Node 25 instead of 24 (environment; no observed difference).

**Environment blocks:** none. No listeners started; `lsof`/`pgrep` empty after every run.
