# S1-21 — Complete functional Privacy/404 and retire local LexChat

**Status:** Done · **Spec milestone:** T6 · **Scope:** one utility page family

**Depends on:** [S1-17](s1-17-canonical-home-integration.md)

Assign one agent this ticket plus the [execution contract](../../../superpowers/plans/2026-09-05-spec-1-migration-engine.md). Read [Spec 1](../spec-1-migration-engine-parity.md) §6.2–6.3, D12/D13/D27/D30 and Q4/Q14. Dependencies supply code and evidence; there is no owner review between tickets.

## Deliverable

Privacy and 404 are readable and functional with working shared pickers, approved Privacy text, safe theme resolution and correct assets/links. LexChat remains a project card linking directly to the owner-approved Hugging Face URL; its local engine pages and unused assets are removed with no redirect.

**Owner amendment, 2026-09-08:** Exact OLD/NEW Privacy/404 visual and DOM equality is waived. Use focused functional unit/build/browser smoke checks and a light Astra spot-check, without the full utility parity matrix or four fresh reviewers. The owner inspects appearance during final migration QA, with no intermediate gate. This supersedes the original parity-preservation instructions. The LexChat target is `https://huggingface.co/spaces/dawsonamf/lexchat`, selected by root from the owner's public Space under the direct-Hugging-Face instruction (API id verified, page HTTP 200). This is not a claimed literal URL reply from the owner.

## Files

- Modify: `src/layouts/canonical/Privacy.astro`, `NotFound.astro`.
- Remove: `src/layouts/canonical/LexChat.astro`, `src/pages/[...theme]/lexchat/index.astro`, `public/lexchat/lexchat-styles.css`; remove obsolete page type/composition/schema/meta cases and update directly dependent tests/harness. Retain reserved id `lexchat`, project content/image and historical OLD evidence.
- Modify: `src/pages/404.astro`, `src/themes/not-found.ts` for final runtime integration.
- Create: `tests/unit/not-found-theme.test.ts`, `tests/build/utility-html.test.ts`, `tests/browser/utility-picker.spec.ts`.
- Read: `privacy/index.html`, `404.html`, `lexchat/index.html`.
- Do not edit Astro config, shared picker CSS/runtime or unrelated canonical behavior. Report shared defects to the integration owner for a serialized correction.

## Interfaces

- Privacy and NotFound use Shell's FAB composition; both preserve desktop and mobile footer blocks.
- No local LexChat page family, page assets or compatibility redirects remain. Retain the project card/image/description and use its exact approved external CTA without a theme prefix.
- Canonical layouts supply canonicalStyleExtras with carousel false.
- 404 serializes needed appearance and CSS-prose values for all registered themes at build; runtime uses themeHtml and those values without parsing prose or importing layouts.

## Work

- [x] Port privacy's main-body, logo/header, full approved body and both footer variants.
- [x] Port 404's main-body/logo/nf block/footers with root-absolute URLs and style is:inline; add the specified Font Awesome link for picker icons.
- [x] Preserve 404's default link destinations while applying selected theme attributes, tokens, ordered links and active dock row.
- [x] Ensure 404 application completes before cycler reads its active row and restores palette state without erasing the selected theme.
- [x] Remove the local LexChat route/type/layout family and unused page assets; update the project CTA and exact route/sitemap/tests contract. No redirects.
- [x] Apply full CSS for skins on utilities; structural utilities use tokens/fonts without owned assets or theme-base.
- [x] Check FAB opening by touch/mouse, responsive reachability and at least default/brutalist/doodle appearances automatically. Do not request an owner preview.

## Acceptance and verification

- [x] Focused functional Privacy/404 smoke checks pass at both widths; exact OLD/NEW DOM/screenshot parity is waived by the owner.
- [x] /404.html?style=brutalist and ?style=doodle apply their skins and open a functional picker.
- [x] resolveNotFoundTheme covers /brutalist/nope/, /nope/, /brutalist/, unknown segment + valid query and conflicting valid path/query.
- [x] No canonical scripts on utilities and exactly one ThemeAssets marker each. Production emits exactly 176 page routes + 404.html, with no LexChat output/redirect/asset/sitemap entry and the retained external project link.
- [x] Path-themed unknown-URL behavior is unit-tested now and verified on GitHub Pages in S1-28; Python serving 404.html is not evidence of host fallback.

```bash
node --test tests/unit/not-found-theme.test.ts
node --test --test-concurrency=1 tests/build/utility-html.test.ts
npm run build
npx playwright test tests/browser/utility-picker.spec.ts
# No exact utility parity matrix: owner waiver, 2026-09-08.
```

## Agent handoff

Record changed files, commands and exit results, and any interface adjustments in the completion report. Resolve implementation failures in scope; do not replace failed assertions with broader exclusions. Leave owner QA to the end of the complete migration.


## Completion evidence, 2026-09-08

Implemented functional Privacy/404 under the owner's quick acceptance override and retired
all local LexChat engine routes/layout/owned CSS without redirects. The approved project
card/image/description remain; the CTA targets `https://huggingface.co/spaces/dawsonamf/lexchat`.
Updated route/type/composition/schema/prose fixtures, script contracts, dependent tests and
active harness selection. The reserved `lexchat` id and historical OLD evidence remain;
S1-25 owns the audited legacy root removal.

Focused verification passed: 248 unit tests; Astro check 158 files with 0 errors, 0 warnings
and 48 existing hints; 5 isolated production Astro build checks, including exactly 177 engine
page HTML files, 128 published-post pages and 11 sitemap URLs; 6 browser smoke cases across
1440×900 desktop and 390×844 touch/mobile. The final browser run seeds storage once on an
existing same-origin document, then verifies themed navigation/reload without re-seeding,
404 path precedence/selected picker row, matching palette restoration and functional FABs.
Parity discovery is exactly 864 test/project combinations across 80 retained page/theme pairs.
The five-page cycle is the final intended contract, including METR → canonical same-theme Home.
No full parity comparison or four-reviewer wave was run, as explicitly waived by the owner.

Light Astra review corrected a skin/structural test assumption, exact external-stub path
classification and the one-time palette smoke seed. Other initial failures were sandbox
loopback denial and an ambiguous heading selector; retained logs distinguish these from
passing runs. No production defect remains from those checks. No installs or git mutations.
Test-owned listeners were removed; unrelated user PID 89994 on port 4321 was preserved.
Actual GitHub Pages fallback remains S1-28; the local fallback fixture proves runtime behavior only.

Full commands, changed-file list, failure dispositions and cleanup evidence:
`/private/tmp/theme-engine-openai/s1-21/final-verification-report.md` and its referenced logs.
Root owns integration. S1-22 inherits 177 engine pages, 128 local-post outputs, 11 sitemap URLs,
the existing explicit post redirects and the absence of every local LexChat output/redirect.
