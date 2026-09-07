# S1-10 — Implement theme-to-HTML projection and content-free routing helpers

**Status:** Done 2026-09-07 · **Spec milestone:** T3 · **Scope:** one pure engine change

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

## Completion report

Done, 2026-09-07. Ran on Node v25.9.0 (Node 24 not installed; `.nvmrc` = 24 stays the CI contract). Worktree branched stale at `1208d01`; fast-forwarded to `c68b953` (S1-02) before any work. `npm ci` exit 0; no other installs; no git write actions.

**Created** (nothing deleted): `src/themes/ramp.ts`, `src/themes/apply.ts`, `src/themes/paths.ts`, `src/themes/validate.ts`, `src/layouts/types.ts`, `tests/unit/theme-html.test.ts`, `tests/unit/theme-paths.test.ts`. **Modified:** `src/themes/types.ts` (+7 lines: the `ThemeHtml` interface only). `src/themes/registry.ts` unchanged: `assertRegistry` already covers reserved ids, empty structural layouts, default purity and duplicates; the disk checks live in `validate.ts`. No file owned by another ticket was touched (`harness/`, `public/`, `scripts/` read-only).

**Interfaces (the handoff for S1-11, S1-12, S1-13, S1-21):**
- `src/themes/ramp.ts`: `rampDeclarations(colors: Colors): string`. 100 declarations serialised `prop:value;` (no spaces, each ending in `;`): per role in the fixed order text, bg, primary, secondary, accent, the raw hex base (`--text:#0a0a0a;`, never normalised) then 19 `hsla(H,S%,L%,A%)` steps at alphas 5..95 with `toFixed(0)`. The function is self-contained (no free variables; body carries no `</script` or `<!--`) so the pre-paint `is:inline` script can inline `rampDeclarations.toString()`; under Node type stripping `new Function('return (' + fn.toString() + ')')()` re-evaluates identically (tested). No runtime imports.
- `src/themes/apply.ts`: `themeHtml(theme: Theme, colors: Colors = theme.colors): ThemeHtml`, pure, only runtime import `./ramp.ts`, browser-bundleable. Default: `{ attrs: {}, style: ramp, links: [] }`. Non-default `attrs` in insertion order: `data-style`, `data-still` (`''`, iff `flags.still`), `data-no-tilt` (`''`, iff `flags.tilt === false`), `data-typing` (iff `typing`), `data-typing-delete` (iff `typingDelete`). Absence of a typing carrier means the legacy default `cursor`/`char`: the `typing-engine.js` edits (S1-14/S1-15) must read `dataset.typing || 'cursor'` and `dataset.typingDelete || 'char'`. `style` = `declarations(tokens) + ramp`. `links` = fonts, then `/css/themes/theme-base.css`, then the skin `css` when present (a structural theme gets `data-style` plus fonts and base). `declarations(map: Readonly<Record<`--${string}`, string>>): string` serialises `--k:v;` in insertion order; the Shell (S1-12) appends `declarations(page.styleExtras ?? {})` after `themeHtml().style`. Values are written verbatim, so the caller guarantees complete CSS values (no bare `;`, `}`, unbalanced quote or paren); S1-12 owns that guarantee for prose-built extras such as `--ticker-run`.
- `src/themes/types.ts`: `ThemeHtml { attrs: Record<string, string>; style: string; links: string[] }`.
- `src/themes/paths.ts` (imports only `./registry.ts`): `href(path: string, theme?: string): string` applies §6.1 rules 1 to 5 in order: scheme (`/^[a-z][a-z0-9+.-]*:/i`) or `//` unchanged; `#...` unchanged; anything not starting with `/` throws; `theme` unset, `''` or `'default'` unchanged; `STATIC_PREFIXES` unchanged; otherwise `'/' + theme + path` with queries and hashes intact. `STATIC_PREFIXES: readonly string[]` is the ten §6.1 entries. `themeParams(): Array<{ theme: string | undefined }>` returns `[{ theme: undefined }, ...15 non-default ids in picker order]`; a route file does `themeParams().map((params) => ({ params }))`.
- `src/themes/validate.ts` (build-only, the sole `node:fs` importer): `validateThemes(themes = THEMES, publicRoot = <repo>/public): void` runs `assertRegistry`, then requires `/css/themes/theme-base.css` and every skin `css` to exist under `publicRoot`, throwing once with every missing file listed. S1-13 wires it into the checks integration; nothing browser-bound may import it.
- `src/layouts/types.ts`: `StyleExtras = Record<`--${string}`, string>` and `PageContext { type: PageType; path: string; previewDraft?: boolean; styleExtras?: StyleExtras }`, where `path` is the unthemed canonical path with a concrete post id (`/blog/toolbelt/`). S1-12 extends this file only.

**Commands and results** (run by the builder, four reviewers and the orchestrator): `node --test tests/unit/theme-html.test.ts tests/unit/theme-paths.test.ts`: tests 109, pass 109, fail 0, skipped 0. `npm run test:unit`: tests 257, pass 257, fail 0 (148 pre-existing). `./node_modules/.bin/tsc --noEmit -p tsconfig.json`: exit 0, no output. Fixture parity: all 16 themes equal `harness/fixtures/baseline/theme-html.json` on `attrs` (typing carriers removed first and asserted separately: 8 themes carry `data-typing`, marquee alone carries `data-typing-delete="word"`, default carries neither), on `style` as an ordered declaration list via `parseDeclarations` (tokens then ramp; stricter than the README's sorted-map recipe) and on `links` verbatim in order. A correctness reviewer brute-forced the ported `hexToHsl` against the legacy function for all 16,777,216 24-bit colours: 0 mismatches. `git status --short`: only the eight paths above. `lsof -nP -iTCP -sTCP:LISTEN | grep -E 'node|python'` and `pgrep -fl 'astro|http.server|playwright'`: empty after every run; no server was started.

**Review:** four fresh reviewers (2 correctness on Fable, security and conventions on Opus): no high or medium code findings. One fix pass applied: an empty theme is treated as unset (`href('/blog/', '')` had returned the protocol-relative `//blog/`); `declarations` key type narrowed to custom properties; value-safety and self-containment notes added to the docstrings; `ramp.ts` legacy reference corrected to `theme-bootstrap.js:744-774` and the `</script`/`<!--` constraint recorded; `validate.ts` comment accuracy; one robust import-scan helper (either quote style, `export ... from`, `import()`, `require()`) replaced two regex copies; 18 redundant tests deleted; em dashes removed.

**Deviations / interface adjustments:** exports beyond the ticket's list: `declarations`, `STATIC_PREFIXES`, `StyleExtras`, `ThemeHtml`, `validateThemes`, each documented above. Typing attributes are emitted only when the theme sets them (the ticket's "carry the exact legacy defaults" is met by the value vocabulary plus absence meaning the default, mirroring how the bootstrap sets `data-still`/`data-no-tilt`). `rampDeclarations` uses a fixed role tuple instead of the legacy `Object.keys(colors)`; byte-neutral because every registry entry and the saved-palette object use that order. `registry.ts` was not modified.

**Accepted risks:** (1) `href` rule 1 treats any RFC 3986 scheme-shaped prefix (for example `localhost:8080/x`) as an external URL, as §6.1 specifies; links are owner-authored in `src/` and `assertNoRelativeHrefs` plus harness check 4 catch typos. (2) No double-theming guard: `PageContext.path` is documented unthemed; a themed input would surface as a 404 in harness check 4. (3) `declarations()` does not validate values (a correct check is a CSS tokenizer); the contract is in its docstring and S1-12 guards prose-built extras. (4) `harness/normalize.ts:4` lists two consumers of `parseDeclarations`; `tests/unit/theme-html.test.ts` is now a third. Harness is read-only for this ticket; S1-13 should add the line. (5) Node 25 instead of 24 (environment; no observed difference). **Environment blocks:** none; one reviewer was interrupted by an account rate limit, then resumed and reported in full.
