# S1-24 structural authoring evidence

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
