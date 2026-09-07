# S1-14 — Port canonical navigation, shared chrome and behavior dependencies

**Status:** Done · **Spec milestone:** T4 · **Scope:** one canonical shared-component change

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

- [x] Reproduce current nav/social HTML, order, classes, mobile/desktop variants, link target/rel and Calendly classes from the owning prose.
- [x] Keep home anchors bare; subpage anchors route to the themed home. Logo follows theme; vCard stays an asset URL.
- [x] Split nav behavior from config/rendering, retaining sticky threshold 300 and binding every Calendly link with live palette colors/fallbacks.
- [x] Port typing engine with dataset reads; remove dead restart and lastConfig state. Preserve all timings.
- [x] Retain animation finalization/cursor behavior; remove the obsolete data-style observer only after verifying no canonical page flow needs it.
- [x] Document owner, DOM inputs, dependencies, initialization and listener lifecycle in each retained module header.
- [x] Test chrome in isolated home/listing/post fixtures, including script timing and absence of duplicated initialization.

## Acceptance and verification

- [x] Normalized nav/social/footer DOM matches baseline at both widths.
- [x] Calendly URL colors reflect the live palette; a test stub observes all applicable bindings without relying on the blocked API.
- [x] Shared scripts are not added to utility or structural-owned layouts.
- [x] All module dependencies are explicit and no build data rendering remains in nav behavior.
- [x] Typing/cursor/intro behavior preserves constants and flag polarity.

```bash
npx playwright test tests/browser/canonical-chrome.spec.ts
npm run check
```

## Agent handoff

Record changed files, commands and exit results, and any interface adjustments in the completion report. Resolve implementation failures in scope; do not replace failed assertions with broader exclusions. Leave owner QA to the end of the complete migration.


## Completion report

Canonical shared chrome and behavior are complete in `engine-rewrite`, ready for later page assembly. This ticket does **not** claim assembled home/listing/post visual parity. No Shell, picker runtime, page assembly, utility/structural layout, protected worktree or OLD source was changed.

**Interfaces and files:** `Nav.astro` accepts `{ theme: Theme, page: PageContext }`, preserving home-only header and page-specific cursor/nav order, post logo visibility, all three shared picker mounts, bare home anchors and themed subpage/logo/blog links. `Socials.astro` accepts `{ theme, mount: 'home'|'blog'|'contact' }`, retaining sidebar/contact containers, order and target/rel/Calendly attributes. `Footer.astro` accepts `{ variants: Array<'desktop'|'mobile'>, desktopClass?: 'blog-listing-footer'|'blog-footer' }`. All newly owned empty prose slots omit their elements and recompute separators; approved source prose is unchanged.

`public/js/nav-behavior.js` owns sticky threshold 300 and every Calendly binding, using live computed colors/fallbacks and preventing duplicate binding. `typing-engine.js` retains its API/constants/cancellation with root dataset inputs and no dead restart/lastConfig. `anim-utils.js` retains intro/finalization/header behavior without the obsolete style observer; `cursor-follow.js` retains the follower behavior. All four preserve retained owner documentation and state their inputs, dependencies and listener/timer lifetime. `tests/browser/canonical-chrome.spec.ts` and the three files under `tests/fixtures/canonical-chrome/` provide real isolated Astro fixtures, pinned OLD comparisons and behavior evidence. Root separately owns the `execution-handoff.md` note; unrelated untracked `harness/scripts 2.ts` is untouched and excluded.

### Verification

All commands use `PATH=/private/tmp/theme-engine-openai/s1-13/node-v24.20.0-darwin-arm64/bin:$PATH`. Installed proof: Node 24.20.0/npm 11.19.0, Astro 7.3.1 at `./bin/astro.mjs`, Playwright 1.61.1. **No installs** were performed. Raw logs are under `/private/tmp/theme-engine-openai/s1-14/logs/`.

| Exact command | Final result | Log |
|---|---|---|
| `TEST_BUILD_OUT_DIR=/private/tmp/theme-engine-openai/s1-14/fix-browser-builds PARITY_OUT_DIR=/private/tmp/theme-engine-openai/s1-14/fix-browser-output ./node_modules/.bin/playwright test tests/browser/canonical-chrome.spec.ts` | exit 0, **26/26**, both widths, 7 workers | `fix-browser-freeze.log` |
| `npm run check` | exit 0, 123 files, 0 errors/warnings, 48 existing hints | `fix-check-freeze.log` |
| `node --check public/js/nav-behavior.js` | exit 0 | `fix-node-nav-freeze.log` |
| `node --check public/js/typing-engine.js` | exit 0 | `fix-node-typing-freeze.log` |
| `node --check public/js/anim-utils.js` | exit 0 | `fix-node-anim-freeze.log` |
| `node --check public/js/cursor-follow.js` | exit 0 | `fix-node-cursor-freeze.log` |
| `git diff --check` | exit 0, independently repeated by controller | `fix-diff-check-freeze.log` |

The suite includes six exact normalized OLD chrome comparisons at 1440px/390px, explicit-null builds, themed navigation/static assets, OLD-derived script order/defer attributes, all home Calendly calls with live palette/fallbacks and duplicate-binding checks, dataset typing modes/deletion/cancellation/timings, sticky navigation, explicit intro reveal, actual animation completion with persisted inline styles, child-event filtering, cursor reveal and request containment. Calendly is stubbed only at its API boundary; no external API availability is claimed. Normalization covers approved URL migration, comments/whitespace and transient cursor coordinates; production page visual parity remains with assembly tickets.

### Four fresh reviews and dispositions

Two independent Astra correctness reviews and Sol security/conventions reviews ran in waves of two on frozen source. Reports are `correctness-a.md`, `correctness-b.md`, `security.md`, `conventions.md` under the ticket scratch root. One consolidated original-builder pass fixed all evidenced findings: null slot omission; incorrect post animation dependency; false-positive intro/finalization proof; nonportable baseline/scratch paths; shared fixture caches; unbounded build subprocess; removed/stale owner documentation; unreadable compressed templates. Duplicate post findings were merged. The shared ThemePicker contract remains unchanged; repository-authored URLs retain the existing trusted `href()` contract. The optional Calendly guard is accepted graceful handling while its async API is unavailable.

Final diagnostics and their narrow corrections are retained in the builder report: mobile attribute-order drift, an incorrect word-delete expectation, animation shorthand/property assertions, a comment matching the observer source scan, and the retained observer reversing an offscreen intro header. All final tests pass; no provisional fix or known acceptance failure remains. No second review round or broad unrelated parity rerun occurred.

### Cleanup and next-ticket handoff

Each browser worker builds a unique scratch project with local Astro/Vite caches, a 180000 ms build timeout, pinned `oldDir()` resolution and an ephemeral server bound explicitly to `127.0.0.1`. Setup failure and teardown close connections/server and remove only the owned child. Final `fix-cleanup-freeze.log` confirms no owned fixture caches/build roots or Node listener. Controller independently ran `pgrep -af '[p]laywright|[h]eadless_shell|[c]anonical-chrome|[a]stro/bin/astro.mjs'`: exit 1, empty. Listener scan showed only the unrelated Python PID 65794 on `127.0.0.1:49926`, untouched. The separate `.claude/worktrees/agent-afb3c9840962091c1` workflow was left alone. Exact controller evidence: `/private/tmp/theme-engine-openai/s1-14/controller-spotcheck.md`; complete commands/failures/dispositions: `/private/tmp/theme-engine-openai/s1-14/builder-report.md`.

S1-15/S1-16 can consume these components and shared behavior in their isolated work. Later assembly owns all script tags: home typing/nav/cursor deferred and animation helpers synchronous; listing typing/animation helpers synchronous and nav/cursor deferred; posts nav/cursor deferred with **no typing or animation-helper script**. Home/listing request both footer variants; posts request desktop with `blog-footer`, no Socials/mobile footer. No shared behavior was injected into utility or structural-owned layouts. Root performs the per-ticket commit/push; owner QA remains at the end of migration.
