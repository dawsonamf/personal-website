# Architecture completion evidence

## S1-25 transition audit and automated acceptance

Recorded 2026-09-08 on `engine-rewrite`, following accepted S1-24 commit
`0361d63a7b47250ba18907e0388ca2064e92b15e`. This is automated architecture evidence, not owner
sign-off or deployment approval. Final full visual parity belongs to S1-26.

| Spec 1 §1.1 criterion | Observed evidence |
|---|---|
| One coherent system | Astro owns routes, composition, prose and post rendering. Canonical layouts own their classic dependencies; Shell owns the independent picker. The live guide records each retained module's owner, DOM/data inputs, dependencies and document-lifetime initialization/listeners. The structural browser proof verifies requested assets and canonical isolation. |
| Theme additions stay local | The structural fixture changes exactly the five documented destination files below, with no shared engine, canonical behavior, unrelated theme or fixture-id branch. Registry-derived prose labels remain the registration seam. |
| Authoring is demonstrated | The final isolated structural build passes 7/7 and the browser proof passes 8/8 at desktop and mobile, including distinct owned Home DOM, canonical fallbacks, utilities, resources, resize, all five palette roles and real generated-palette navigation/reload. |
| Transition is finished | All 119 inspected legacy files were hash-checked and individually removed. Root rendering/catalog/Markdown copies no longer serve as active inputs. Cleanup, full units and production output checks pass; retained owners and historical material remain. |

### Removal and retention audit

The exact removal set contains four root documents/config outputs, three `12years/` files,
30 `blog/` files, 24 `css/` files, four `embedded-swift-agent/` files, nine `js/` files,
two `lexchat/` files, two `privacy/` files and 41 `resources/` files. Each had an inspected
migrated owner or an explicit retirement contract. Root and orchestrator independently verified
119 expected deletions equal 119 actual deletions, every pre-deletion SHA and every mapped owner.
No untracked or unrelated file was deleted.

The per-file source/owner evidence is
`/private/tmp/theme-engine-openai/s1-25/removal-allowlist.json` (SHA-256
`cb17118dd0810475cce34ecc6e484c27814cef3d99eff2abf83ef7cbda180311`).
The pre-cleanup retention inventory records all other 403 tracked files and protected untracked
`harness/scripts 2.ts`. Its retained owners include root `CNAME`/`.nojekyll` for rollback,
`src/content/posts/` for metadata/bodies, `public/blog/post.html` and configured redirects for old
URLs, all four inactive skins, public vendor/post assets, both verbatim subsites, all media,
fixtures, docs and planned posts. Immutable OLD at `0f196d0` remains the historical oracle.

Twenty-five unused `.tc-toggle` blocks and two unused `.tc-close` blocks were removed from
18 public stylesheets after a consumer audit. The actual `.tc-fab` contract and all inactive
stylesheets remain. Seven legacy test readers now use the existing SHA-validating `oldDir()`
and retain `PARITY_OLD_DIR` overrides and exact comparisons. The public-boundary fixture removed
only deleted copy inputs; its output assertions, Markdown exemption and immutable subsite pins
remain intact.

`src/themes/ramp.ts` is the sole authored ramp. `scripts/build-picker.mjs` generates a marked
classic adapter in the existing `/js/theme-cycler.js`; official dev, production and preview
commands generate it before Astro copies public files. The adapter passes exact palette/ramp
comparisons and a non-writing drift check. The runtime keeps its classic loading and palette
event/storage contracts. Picker fixture templates now emit the existing asset and mount markers
required by the real build checks; no check was relaxed.

### Final S1-25 verification

- Full unit suite: 511/511, exit 0. Migration cleanup: 6/6, exit 0.
- Affected picker, pre-paint/routing and utility browser scope: listed 54, then 54/54, exit 0.
- Structural authoring build: 7/7, exit 0. Structural browser scope: listed 8, then 8/8,
  exit 0. These preserve S1-24's meaningful palette generation through real hrefs and reloads.
- Faithful full-public ordinary `npm run build`: exit 0, picker generation first, zero prose
  drafts, 77 checked files / 0 errors / 0 warnings / 35 hints, and 177 Astro pages. Independent
  output audit: 300 files, 184 HTML, 177 engine HTML, 128 local post HTML and 12 exact sitemap
  URLs, with no author-proof output or local LexChat route.
- Separate faithful test/harness-inclusive `npm run check`: 148 files, 0 errors, 0 warnings,
  36 hints, exit 0. This post-cleanup source check includes changed tests and fixtures; it is
  distinct from the production-only 77-file check. Copied inputs were unchanged by each run.

Literal commands, source-copy/output manifests and raw logs are retained under
`/private/tmp/theme-engine-openai/s1-25/`, including `logs/final-unit.log`,
`logs/final-cleanup.log`, `logs/final-production-build.log`,
`logs/final-full-source-check.log` and `logs/ramp-browser-final3.log`.
Earlier sandbox `EPERM` and missing-marker fixture runs are failed diagnostics, not acceptance.
The final browser runs own bounded `127.0.0.1` listeners and record their closure; no unowned
process was stopped. Existing Node 24.20.0/npm 11.19.0 and cached packages/browser were reused,
with no installs.

Four fresh reviews completed from original spec/diff/source inputs: two Astra correctness reviews
and Sol security found no actionable issue. Sol conventions found premature deployment wording and
stale retained-module comments. One original-builder aggregate pass corrected those, clarified
the full five-representative visual matrix versus structural/utility probes, and documented the
fixed migration inventory's scope. No second review loop was run.

After the accepted tests, the only runtime-file changes were ownership comments in
`public/css/styles.css`, `public/css/theme-cycler.css` and `public/js/anim-utils.js`. Their
comment-stripped semantics equal both accepted production and test-inclusive copies. Other final
changes are inert documentation and completion metadata, so the recorded runtime results remain
applicable. Protected CLAUDE policy bytes, including its original EOF boundary, and the frozen
exploration body remain byte-identical to the accepted source. The existing OLD resolver pins
HEAD and relies on the workflow's immutable, clean OLD checkout; S1-26 revalidates that state.

Home/listing/post/Privacy retain strict pre-paint restoration. Runtime 404 retains the existing
D27/§15.11 after-parse/default-flash exception. Privacy/404 have functional coverage, not OLD
visual equality. LexChat retains its approved project prose/image and exact external Hugging Face
CTA, with no local page or redirect. External browser requests are controlled by existing harness
policies; this evidence does not claim live third-party service behavior.

The retained author-proof preview under `/private/tmp/theme-engine-openai/author-proof-preview/`
is a user-requested scratch artifact, not production input. `/private/tmp/theme-proof` is its
short symlink; a bounded loopback HTTP check returned 200 for `/author-proof/` and all five declared
assets, then closed its owned server. Any user-started preview on port 8766 is user-owned.
The source-only S1-26 readiness map
is `/private/tmp/theme-engine-openai/s1-25/s1-26-readiness-map.md`; its references require
revalidation against the accepted S1-25 commit.

## S1-24 structural authoring evidence

Automated evidence recorded 2026-09-08 against `engine-rewrite` baseline
`b4f70f86e8bb8b5e86a8aa4a38a1fbec6f7e63d7`. This is an agent-produced architecture
record, not an owner sign-off.

## Authoring contract

The demonstrated workflow is the six-step guide in `src/themes/README.md` and the matching
fixture README. The isolated addition changes exactly these five destination paths:

- `src/themes/registry.ts`: typed structural entry, lazy owned Home, five colors, tokens,
  font and narrow light/dark random profiles.
- `src/content/prose.yaml`: approved registry-aligned picker label. `THEME_IDS` derives the
  strict theme-label schema, so this is the existing schema-registration seam.
- `src/themes/author-proof/Home.astro`: owned head and genuinely distinct desktop/mobile DOM,
  public sized-prose access and `href()` navigation.
- `public/css/author-proof.css`: owned 18px/15px root sizing, CSS-first responsive structure
  and visible mappings of text/background/primary/secondary/accent.
- `public/js/author-proof.js`: small owned behavior using only
  `theme.author-proof.visits`; it has no breakpoint selection.

The before/after source hash comparison equals `allowed-change-manifest.json`. No shared engine,
canonical layout/behavior or unrelated theme changed, and there is no fixture-id branch.

## Automated results

- `node --test --test-concurrency=1 tests/build/theme-authoring.test.ts`: 7/7 pass. The installed
  fixture passes ordinary `npm run build`, emits the exact 188 engine HTML, 136 post and 12
  sitemap sets, and adds exactly its 11 themed routes. A fresh ordinary
  isolated production build emits 177/128/12 and contains no fixture id, route, row, prose,
  CSS or script. LexChat has no local page/redirect and its project link is exactly
  `https://huggingface.co/spaces/dawsonamf/lexchat`.
- `npx playwright test harness/theme-authoring.spec.ts --workers=1`: 8/8 pass across the
  1440 desktop and 390 touch projects. Each project checks owned Home, real listing, Toolbelt
  post, Privacy and runtime 404 at its initial viewport, resizes every page to the other width
  and back, and verifies exact declared/projected/requested resources plus all same-origin
  responses. It also exercises mouse/touch owned-Home FAB switching, deterministic light/dark
  profile bounds, computed changes for all five visible roles, the structural namespace, and one
  generated palette through real href navigation and reloads.
- Saved palettes mutate `<html style>` while `document.readyState === 'loading'` on owned Home,
  listing, post and Privacy navigation/reload. The single runtime 404 applies the same five
  roles at `interactive`, then preserves them on reload. This is the explicit D27 and §15.11
  after-parse/default-flash exception for GitHub Pages' one runtime-themed 404, not an owned-page
  prepaint claim.
- `npm run check`: 165 files, 0 errors, 0 warnings, 48 existing hints. This includes the new
  fixture, build test and Playwright source.
- A faithful full-public `npm run build` in the accepted scratch copy exited 0: prose 0 drafts,
  77 checked files / 0 errors / 0 warnings / 35 hints, Astro 177 pages, and an audited 300 files /
  184 HTML / 128 local-post HTML / 12 sitemap URLs. It contains zero `author-proof` hits. The
  190-file build-input manifest (src/public except the inert guide, plus the three root configs)
  equals the copied input at SHA-256 `6205a6ec00db344b96607603ef44dd0cd460944c4b674fc4b96e23dd9ad179a7`;
  the 300-file output manifest hash is `5c5f46ff0895dfbf2b3b9605dad3a1f13c909cfc7f0176285fa9df12f5aa4df5`.

Raw logs are under `/private/tmp/theme-engine-openai/s1-24/logs/`. `aggregate-build-red.log`
reproduces the three installed TS2578 diagnostics; `aggregate-build-final.log` is the final 7/7
result. The sandbox-only browser `listen EPERM` and resource-inventory corrections are retained;
`aggregate-browser-final-2.log` supersedes them. No product boundary defect was
found and no shared engine repair was made.

## Process and cleanup

Node 24.20.0 and npm 11.19.0 from the existing scratch runtime were used. Existing packages and
the cached Playwright browser were reused; no install, secret access, deployment, GUI/Xcode or
git mutation occurred. Browser workers owned only ephemeral `127.0.0.1` listeners. Their PID,
port and closed-state records are under `parity/aggregate-browser-final-2/cleanup/`; no unrelated process was
stopped.
