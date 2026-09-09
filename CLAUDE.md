# dawsonamf.com

`AGENTS.md` is a relative symlink to `CLAUDE.md`. Editing either name updates these same instructions;
preserve the symlink when editing.

Astro 7 static site. `astro.config.mjs` defines production routes, sitemap, redirects and build
checks. `.github/workflows/deploy.yml` builds and deploys production from `main` through GitHub
Pages Actions. Use feature branches for new work. Root `CNAME` and `.nojekyll` are legacy files
outside Astro's public input.

## Commands

```bash
npm run dev -- --host 127.0.0.1 --port 8766  # owner-started, draft-enabled preview
npm run build          # picker generation, prose validation, Astro check and production build
npm run build:preview  # picker generation and a draft-enabled static build
npm run check          # Astro and TypeScript diagnostics
```

Use Node 24 from `.nvmrc`; the Pages workflow reads this file directly. On this machine, Homebrew's
Node 24 is at `/opt/homebrew/opt/node@24/bin`. If the shell selects another Node version, prefix npm
commands with `PATH="/opt/homebrew/opt/node@24/bin:$PATH"`.

The three official Astro entry commands generate the classic picker adapter before Astro reads
`public/`. `src/themes/ramp.ts` is the sole authored color-ramp formula; run `npm run picker:build`
after changing it and never hand-edit the marked generated region in `public/js/theme-cycler.js`.

The owner starts persistent preview/dev servers. Automated listeners must terminate themselves
within a bounded time and bind only `127.0.0.1`.

## Verification

- For documentation, file moves and simple cleanup, inspect the affected paths and diff.
- For runtime, content or build-configuration changes, run `npm run build`. It includes the prose
  approval gate, Astro diagnostics and the existing route/asset build checks.
- The owner retired the migration tests, parity harness and Playwright setup. Keep checks brief;
  add or restore automated test suites only when requested.

## Project structure

```
src/pages/                    # Astro route entrypoints
src/layouts/                  # composition, Shell and canonical page family
src/themes/                   # typed registry, projection, paths, ramp and authoring guide
src/content/prose.yaml        # shared site and theme prose
src/content/posts/*.md        # one metadata-and-body source per post
src/prose/  src/posts/        # validated prose and post contracts
src/build/                    # build checks, post projections and compatibility output
public/                       # root-absolute URL owners copied by Astro
  css/  js/  vendor/          # classic styles/scripts and pinned libraries
  blog/posts/assets/          # existing post-owned runtime assets
  resources/  subsites/       # media and verbatim standalone sites
scripts/build-picker.mjs      # generated classic adapter from src/themes/ramp.ts
scripts/vendor*.mjs           # pinned dependency copy map and command
archive/                      # tracked, unpublished prototypes, retired skins and planned posts
archive/todo.md                # deferred site work, including structural-theme reskins
docs/                         # ignored local plans and research
.github/workflows/            # Pages deployment and weekly archived chart-data refresh
```

## Key conventions

- `src/layouts/compose.ts` is the only skin/structural/fallback decision. Canonical layouts own
  canonical DOM and behavior. `Shell.astro` renders the selected composition and the shared picker.
- Read `src/themes/README.md` when changing the registry, theme projection, picker, a skin, a
  structural layout, responsive theme behavior, or theme storage. It is the live authoring guide;
  `archive/themes/prototypes/theme-explorations.html` is frozen historical design research.
- Components create internal links through `href()` from `src/themes/paths.ts`. Public asset URLs
  are root-absolute. A file in `public/` is copied verbatim and is not bundled or type-checked.
- Build-time values reach classic scripts through owned `data-*` attributes or an owner-emitted JSON
  island. There is no browser theme registry except the 404's appearance island.
- Canonical responsive behavior uses the existing 1100px breakpoint. A structural layout owns its
  own CSS-first breakpoints and must survive resizing in both directions.
- Dependency versions are pinned. Preserve classic-script load order and verify any new external URL.
- Images stay near 2x display size and at or below 500 KB where practical; use JPEG for photos and
  place shared media under `public/resources/`.
- Record deferred work in `archive/todo.md`. Structural-theme reskins remain deferred; that file
  records their intended behavior. Read `archive/README.md` when restoring archived material.
  Archive files stay outside production inputs; `docs/` remains local and ignored.

## Deployment and chart refreshes

`.github/workflows/deploy.yml` runs the production build and uploads `dist/`. A manual dispatch
with `deploy=false` builds without deploying; a push to `main` triggers production deployment.
For deployment changes or rollback, read that workflow and the local runbook, when available:
`docs/intents/2026-09-05-theme-engine-rewrite/research/deploy/README.md`. Keep the `github-pages`
environment restricted to `main`.

`.github/workflows/refresh-chart-data.yml` keeps the unpublished AI job-market snapshots under
`archive/posts/ai-job-market/data/` current weekly and on manual runs. Its generator lives beside
them in `scripts/`. These archive updates do not dispatch a site deployment.

## Blog posts

Create `src/content/posts/<id>.md`; its validated frontmatter and Markdown body are the only source
for that post. `src/build/posts.ts` derives production routes, listing records and sitemap dates.
Published local posts render to static `/<theme>/blog/<id>/` pages at build time. External records
redirect, and draft records remain source-only in production. Put existing or approved post-owned
scripts/styles under `public/blog/posts/assets/` and reference root-absolute URLs in frontmatter.
Do not edit a sitemap by hand.

The owner-approved policy below is preserved verbatim. Its opening paragraph records the migration
stage when the policy was introduced; the rules remain active for the final Astro tree.

## Prose and post approval

Applies to the Astro migration tree (`src/`, `astro.config.mjs`, `npm run build`), which is being built alongside the legacy static site described above; the legacy notes stay true for the deployed site until cutover, when this file is rewritten (Spec 1 §4.3).

- Shared site/theme prose lives in `src/content/prose.yaml`; each post's metadata and body live in its own `src/content/posts/<id>.md`. Neither is mirrored anywhere else.
- A plain string is approved. A new or rewritten prose field stays `{ draft: "..." }` until the owner approves it; a new or rewritten post stays `publication: draft` until the owner approves publication. Blog bodies are approved as whole documents.
- Drafts are preview-only (`npm run dev` and `npm run build:preview`, both `PROSE_DRAFTS=allow`). Production (`npm run build`) fails on any draft field in shared prose or in `published`/`external` post metadata, and emits nothing for a whole draft post (no route, listing card, sitemap entry, raw source or body).
- Text migrated verbatim from the live site is approved as-is and needs no owner review.
- Grandfathered for migration parity only: the verbatim subsites and the existing per-post scripts/assets. New or changed UI strings anywhere go through the owning source and the draft flow above; the museum aria-label in `underviewed-art.js` gets an approved template the next time its text is touched.