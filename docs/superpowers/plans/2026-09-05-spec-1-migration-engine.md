# Spec 1 migration engine implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans to implement the assigned tickets. Steps use checkbox syntax. The owner's execution policy below overrides staged owner-review or pause instructions in those workflows.

**Goal:** Complete the Astro migration, content ownership, 16-theme engine, demonstrated structural authoring, parity harness and Actions cutover as individually executable tickets.

**Architecture:** A typed registry, shared prose accessor and publication-filtered post sources feed build-time composition and static routes. Canonical layouts own their behavior and assets; the shared picker runs independently, and structural layouts use explicit owned/fallback composition. An old-site harness and isolated structural fixture verify behavior and architecture.

**Tech stack:** Astro 7.3.1, Node 24, npm, TypeScript 5.8.3, YAML, marked/highlight.js, Playwright 1.61.1 and GitHub Pages Actions. Exact pins and constraints are below.

**Spec:** [Spec 1: migration, engine and parity](../../intents/2026-09-05-theme-engine-rewrite/spec-1-migration-engine-parity.md); [settled intent](../../intents/2026-09-05-theme-engine-rewrite/intent.md).

**Prepared:** 2026-09-05 against repository revision `9538df5`. Behavior baseline remains `0f196d0`. All 28 tickets are unstarted; this document does not claim implementation or deployment has occurred.

## Execution policy

The owner's latest instruction is **no gates**. Agents proceed through implementation dependencies, fix failures and run their own verification. There are no intermediate owner approvals, design reviews, FAB previews, manual QA milestones or owner sign-off requirements. The owner performs QA themselves once the entire migration is complete.

This replaces earlier staged owner-review and manual-sign-off timing in Spec 1 §§10, 12 and 14. T0 is ordinary compatibility work; T1 establishes test evidence; T8 produces automated architecture/parity evidence. Their results are inputs for dependent work, not presentations awaiting approval. S1-28 deploys and verifies the completed migration, then provides one final QA package.

Actual tool permissions, missing credentials or unavailable services can still be concrete environment constraints. Report those precisely and continue unaffected work; do not turn them into a routine owner approval process. Writing this backlog performs no installs, commits, pushes or deployments.

**Owner amendment, 2026-09-08:** S1-21 retires the local LexChat engine family and unused page assets, with no compatibility redirect, while retaining its project card/image/approved description and linking directly to the owner-approved Hugging Face URL. Privacy/404 acceptance is functional: exact OLD/NEW visual/DOM parity is waived. Use focused tests and a light orchestrator spot-check for S1-21, without the four-reviewer pipeline or full utility matrix. S1-26 preserves this waiver and all other page parity. S1-25 removes audited remaining legacy LexChat copies only.

## Global constraints

Every ticket includes these requirements:

- **Astro 7.3.1**, exact pin. Node **24 LTS** via `.nvmrc`, npm and a repository lockfile.
- `compressHTML: false`, `prerenderConflictBehavior: 'error'`, `build.inlineStylesheets: 'never'`, `trailingSlash: 'always'`, `build.format: 'directory'`, `site: 'https://www.dawsonamf.com'`, no `base`; static output.
- Sizes: **xs, s, m, l**. Explicit null omits a slot; a requested absent size fails production. New unapproved prose remains structurally marked. This migration reuses live approved text; it does not generate new copy awaiting mid-project approval.
- Shared site/theme prose belongs to `src/content/prose.yaml`; every post owns metadata/body. No `prose.posts` mirror. Whole post drafts never enter production routes, listings, sitemap or raw-source output.
- Keep ten listing entries/order: **fly-on-my-laptop, underviewed-art, arena-freshness, helm, toolbelt, embedded-swift-agent, metr-doubling, autoencoders-2, autoencoders-1, college-projects**. The autoencoders are external; Gemma is the eleventh retained source and is a draft. Keep its separate featured project.
- Theme order: **default, brutalist, marquee, blueprint, field-notes, doodle, grid, miami-deco, bauhaus, chinoiserie, gallery, banknote, neo-pop, broadsheet, studio, wheatpaste**. Keep **space, vapor, wanted, constructivist** sheets inactive.
- Preserve canonical DOM, constants and asymmetric resource order. Existing canonical mobile breakpoint remains **1100px**. Structural CSS owns its breakpoint and must survive resize.
- No visual redesign, five production structural themes, new case studies, MDX dependency, Astro image pipeline or optional library cleanup in this backlog.
- No browser theme globals or runtime registry except 404's complete appearance data. All other runtime inputs are owned DOM data/JSON islands. Structural owned pages load no canonical behavior or canonical-only libraries.
- Every picker supports randomization. Theme switches preserve the page and clear the old toy palette; navigation/reload retain the active palette before paint. LexChat is an external project link, with no local page or redirect (owner amendment 2026-09-08).
- Exactly **176 page routes plus 404.html**, with explicit additional redirect stubs. Eight published local posts; ten listing entries. Production excludes fixtures, docs, CLAUDE, raw post sources and draft/archived external bodies.
- Preserve root `CNAME` and `.nojekyll` for rollback; do not copy them into public.
- Test runners may start/stop their own localhost servers; do not start a persistent dev server.

### Dependency pins

The pins below are the spec's contract, not a recommendation to substitute whatever is newest. S1-01 verifies they work in the execution environment.

| Runtime/build dependency | Exact version |
|---|---|
| astro | 7.3.1 |
| @astrojs/sitemap | 3.7.4 |
| js-yaml | 4.3.0 |
| marked | 18.0.5 |
| highlight.js | 11.9.0 |
| jquery | 3.6.0 |
| jquery-ui-dist | 1.12.1 |
| aos | 2.3.1 |
| vanilla-tilt | 1.7.0 |
| gsap | 3.9.1 |
| @fortawesome/fontawesome-free | 6.5.1 |
| @playwright/test (dev) | 1.61.1 |
| @astrojs/check (dev) | 0.9.10 |
| typescript (dev) | 5.8.3 |

Boxicons 2.0.9 is a committed CDN copy, never an npm install. Mermaid 11.15.0, Plotly 2.27.0 and post-side js-yaml 4.2.0 keep their existing pinned CDN URLs. Calendly and Google Fonts keep their current external delivery. No vendor prebuild/predev hook, separate integrity catalog or speculative GSAP alias.

## Ordered tickets

Numeric order is a valid serial execution order. For parallel work, start a ticket when its listed dependencies are integrated and its files are free. Each link contains the bounded deliverable, source reads, files, consumed/produced interfaces, work checklist and verification commands.

| Ticket | Deliverable | Depends on | Spec grouping |
|---|---|---|---|
| [S1-01](../../intents/2026-09-05-theme-engine-rewrite/tickets/s1-01-runtime-and-astro-compatibility.md) | Establish the pinned runtime and verify Astro compatibility | — | T0 |
| [S1-02](../../intents/2026-09-05-theme-engine-rewrite/tickets/s1-02-baseline-harness-and-captures.md) | Build the old-site harness and capture immutable references | S1-01 | T1 |
| [S1-03](../../intents/2026-09-05-theme-engine-rewrite/tickets/s1-03-deterministic-interaction-matrix.md) | Complete deterministic baseline interactions | S1-02 | T1 |
| [S1-04](../../intents/2026-09-05-theme-engine-rewrite/tickets/s1-04-theme-data-and-prose-field-types.md) | Port theme data and define reusable prose field types | S1-01 | T2 |
| [S1-05](../../intents/2026-09-05-theme-engine-rewrite/tickets/s1-05-markdown-prose-access-and-drafts.md) | Implement Markdown rendering, typed prose access and draft tracking | S1-04 | T2 |
| [S1-06](../../intents/2026-09-05-theme-engine-rewrite/tickets/s1-06-shared-prose-migration.md) | Migrate approved shared prose and implement the site schema | S1-05 | T2 |
| [S1-07](../../intents/2026-09-05-theme-engine-rewrite/tickets/s1-07-post-ownership-and-publication.md) | Migrate post ownership and publication-filtered source projections | S1-05 | T2 |
| [S1-08](../../intents/2026-09-05-theme-engine-rewrite/tickets/s1-08-content-validation-and-preview.md) | Wire collections, production validation and draft previews | S1-06, S1-07 | T2 |
| [S1-09](../../intents/2026-09-05-theme-engine-rewrite/tickets/s1-09-static-assets-and-vendoring.md) | Move static assets and establish the single vendor map | S1-04 | T3 / T4 / T6 assets |
| [S1-10](../../intents/2026-09-05-theme-engine-rewrite/tickets/s1-10-theme-projection-and-paths.md) | Implement theme-to-HTML projection and content-free routing helpers | S1-02, S1-09 | T3 |
| [S1-11](../../intents/2026-09-05-theme-engine-rewrite/tickets/s1-11-shared-picker-and-palette-runtime.md) | Build shared picker chrome and isolate its palette runtime | S1-08, S1-10 | T4 / T6 shared dependency |
| [S1-12](../../intents/2026-09-05-theme-engine-rewrite/tickets/s1-12-composition-shell-and-prerendered-routes.md) | Wire composition, Shell, pre-paint behavior and route scaffolds | S1-11 | T3 |
| [S1-13](../../intents/2026-09-05-theme-engine-rewrite/tickets/s1-13-engine-invariants-and-migrated-harness.md) | Enforce engine invariants and connect the migrated harness | S1-03, S1-12 | T3 |
| [S1-14](../../intents/2026-09-05-theme-engine-rewrite/tickets/s1-14-canonical-navigation-and-shared-behavior.md) | Port canonical navigation, shared chrome and behavior dependencies | S1-13 | T4 |
| [S1-15](../../intents/2026-09-05-theme-engine-rewrite/tickets/s1-15-home-sections-and-jobs-behavior.md) | Port home sections, masthead and jobs behavior | S1-14 | T4 |
| [S1-16](../../intents/2026-09-05-theme-engine-rewrite/tickets/s1-16-carousel-and-css-prose.md) | Render carousel markup, dots and ticker data at build time | S1-14 | T4 |
| [S1-17](../../intents/2026-09-05-theme-engine-rewrite/tickets/s1-17-canonical-home-integration.md) | Assemble canonical home and verify all 16 themes | S1-15, S1-16 | T4 |
| [S1-18](../../intents/2026-09-05-theme-engine-rewrite/tickets/s1-18-blog-listing.md) | Build the blog listing and retain its filter/typing behavior | S1-17 | T5 |
| [S1-19](../../intents/2026-09-05-theme-engine-rewrite/tickets/s1-19-static-blog-posts.md) | Render published posts at build time with metadata/body-slot layouts | S1-17 | T5 |
| [S1-20](../../intents/2026-09-05-theme-engine-rewrite/tickets/s1-20-post-redirects-sitemap-and-asset-paths.md) | Generate legacy post redirects, sitemap and stable asset URLs | S1-18, S1-19 | T5 |
| [S1-21](../../intents/2026-09-05-theme-engine-rewrite/tickets/s1-21-utility-pages-and-themed-404.md) | Complete functional Privacy/404 and retire local LexChat | S1-17 | T6 |
| [S1-22](../../intents/2026-09-05-theme-engine-rewrite/tickets/s1-22-subsites-redirects-and-public-boundary.md) | Relocate verbatim subsites and finish public URL boundaries | S1-20, S1-21 | T6 |
| [S1-23](../../intents/2026-09-05-theme-engine-rewrite/tickets/s1-23-deployment-workflow-preparation.md) | Prepare Actions deployment and chart-refresh integration | S1-09 | T7 preparation |
| [S1-24](../../intents/2026-09-05-theme-engine-rewrite/tickets/s1-24-structural-authoring-proof.md) | Prove structural theme authoring through an isolated fixture | S1-22 | T8 |
| [S1-25](../../intents/2026-09-05-theme-engine-rewrite/tickets/s1-25-architecture-cleanup-and-authoring-docs.md) | Finish the migration tree and document the supported architecture | S1-24 | T8 |
| [S1-26](../../intents/2026-09-05-theme-engine-rewrite/tickets/s1-26-final-automated-parity-and-readiness.md) | Run the complete automated verification and finish all regressions | S1-25, S1-23 | T8 |
| [S1-27](../../intents/2026-09-05-theme-engine-rewrite/tickets/s1-27-actions-registration-and-dry-run.md) | Register Actions and prove the finished deployment workflow | S1-26 | T7 execution |
| [S1-28](../../intents/2026-09-05-theme-engine-rewrite/tickets/s1-28-cutover-live-verification-and-owner-handoff.md) | Cut over, verify the live migration and hand over the finished site | S1-27 | T9 |

### Useful parallel batches

These are scheduling opportunities, not review checkpoints:

| After | May run together |
|---|---|
| S1-01 | S1-02 baseline harness and S1-04 data/contracts |
| S1-02 / S1-04 | S1-03 interactions, S1-05 prose library and S1-09 assets |
| S1-05 / S1-09 / S1-02 | S1-06 shared prose, S1-07 post sources, S1-10 theme projection and S1-23 deployment preparation |
| S1-14 | S1-15 home sections and S1-16 carousel |
| S1-17 | S1-18 listing, S1-19 posts and S1-21 utilities |

The engine sequence is S1-08 → S1-11 → S1-12 → S1-13 → S1-14, with S1-10 supplying S1-11 and S1-03 supplying S1-13. After the page branches finish: S1-20 → S1-22 → S1-24 → S1-25 → S1-26 → S1-27 → S1-28. S1-23 joins at S1-26.

### Shared-file ownership

- `package.json`: S1-01 creates the initial scripts including vendor; S1-08 edits production scripts. S1-09 creates the vendor implementation without touching package.json.
- `astro.config.mjs`: S1-01 → S1-08 → S1-20 → S1-22. Engine tickets use existing config imports unless a specific integration correction is necessary; serialize such corrections.
- `src/themes/{types,registry}.ts`: S1-04 → S1-10; S1-12 extends only layout types; S1-24 fixture registration occurs in an isolated copy.
- `src/build/checks.ts`: S1-08 creates content assertions; S1-13 adds emitted-page assertions.
- `src/content/prose.yaml`/site schema: S1-06. Post sources/reader/schema: S1-07. No parallel content mirrors.
- Shared picker files: S1-11. Page agents consume them; fixes are integrated serially.
- `Home.astro`: S1-12 scaffold → S1-17 assembly. S1-15 and S1-16 only touch their components/runtime/isolated fixtures.
- Listing/post/utility branches own separate layouts and scripts. S1-19 consumes S1-07's already-migrated body URLs, so no post test depends on the later redirect ticket.
- S1-09 copies standalone subsite assets before any page/link sweep. S1-22 verifies those files and adds old-path redirects; it does not block the new URLs from working in earlier page tests.
- `src/themes/README.md`: S1-12 skeleton → S1-24 demonstrated workflow → S1-25 final documentation. Earlier runtime agents write module headers, avoiding parallel README edits.
- Workflow files and Python OUT_DIR: S1-23; default-branch registration/full deploy integration: S1-27. Full deploy.yml arrives through main before replacement, avoiding an add/add conflict.
- S1-24 onward may fix discovered shared defects after implementation agents have finished. Record those edits; do not silently change a live neighbor's interface.

Independent checkouts are preferred during execution. No two agents run fixed-port parity servers, write the same dist tree or update snapshots at once. One agent owns integration of each shared-file change.

## Cross-ticket implementation contracts

These concrete details resolve schematic interfaces in the spec so agents do not invent incompatible versions:

1. **Composition needs route identity and awaits lazy layouts.** Use `compose(theme: Theme, page: PageContext): Promise<Composition>`, with PageContext's unthemed path carrying a concrete post id. This makes canonical URLs correct; it does not add another composition branch.
2. **Theme projection stays pure.** themeHtml owns attributes/tokens/ramp/links. PageContext.styleExtras carries approved CSS prose/ticker values. Canonical layouts obtain them from canonicalStyleExtras; 404 serializes matching values at build. No prose or filesystem import enters apply/ramp.
3. **The checks integration needs the same accessor instance.** Pure `src/prose/index.ts` owns createProseAccess and unwrittenSizes. `src/prose/site.ts` binds shared prose. Components import the bound instance; post accessors use the same factory; checks import the pure accumulator. Validate this through an actual build.
4. **Small shared picker components.** ThemePicker is the trigger; ThemeDock renders dock/scrim/static controls; PickerFab renders the same trigger contract. They live at the spec's components location but have no canonical runtime dependency.
5. **Post projections are pure and publication-filtered.** `PostSource = { id, source, body, meta }`; readPostSources returns source records; publishedPostIds/listingPosts/postDates/legacyPostDestinations produce public projections. Only preview routes explicitly select whole drafts.
6. **Post body rendering happens once.** marked/highlight produce one canonical HTML body per published source; any per-theme internal-link projection only rewrites link destinations through href.
7. **Actual legacy CTA output wins over contradictory prose.** The second CTA uses `external2 ? externalAttrs : linkTarget` in baseline featured-carousel.js. Preserve that result, including Embedded Swift's external second link, and test it; do not implement the spec's contrary narrative.
8. **Workflow registration must run on a no-build main.** The initial dispatch-only copy has a harmless registration job. The full build/deploy workflow replaces that arriving file on astro. A verify-only chart-refresh dispatch proves its real token permissions without making fake data commits.

## Verification conventions

S1-01 creates the test scripts; the tickets create their test files. Paths listed under Create/Modify are planned destinations until their owning ticket is executed.

Within tickets, `research/` means `docs/intents/2026-09-05-theme-engine-rewrite/research/`; other paths are repository-relative unless the containing directory is explicitly stated. Read current Spec 1 before historical research where they disagree.

- Pure contracts: `node --test tests/unit/<name>.test.ts`; import pure modules by explicit relative paths that Node 24 can resolve.
- Build tests: `node --test --test-concurrency=1 tests/build/<name>.test.ts`. Each mutating/negative fixture uses an isolated temporary copy and asserts subprocess exit status. Exclude intentional negative type fixtures from the ordinary project check.
- Browser component tests: `npx playwright test tests/browser/<name>.spec.ts`. Configure test discovery for these plus `harness/theme-authoring.spec.ts`, as well as the parity entry point. Their fixtures own build/server lifecycle on separate available ports.
- Parity: `PARITY_MODE=old-old|old-new npm run test:parity -- --grep <tag>`. S1-02 establishes tags/project names; S1-03 completes deterministic interactions; S1-13 introduces old-new mappings. Old-old never depends on migrated normalization.
- Snapshot source is always the detached OLD checkout. NEW never generates the accepted old baseline.
- §9 tolerances remain maxDiffPixelRatio 0.001 and threshold 0.2; normalized DOM/computed tokens stay exact under only §15's explicit exceptions.
- Each completed page ticket runs its page scope. During partial assembly, palette persistence tests use an already-complete destination; S1-26 exercises the complete cross-page matrix. No incomplete page is reported as visually migrated.
- S1-26 defines `PARITY_REDUCED_MOTION=1` for an additional reduced-motion run, while the ordinary comparison uses no-preference. It records both commands/results.
- No ticket completion requires a commit or owner review. Report changed files, tested interfaces, commands and outcomes. Never mark a skipped/unavailable check as passed.

## Spec coverage and final completion

| Spec requirement | Owning tickets |
|---|---|
| §1.1 coherent architecture, local theme additions, demonstrated workflow, finished transition | S1-11–S1-14, S1-24–S1-26 |
| §2 D1–D2 stack and compiler/config assumptions | S1-01 |
| D3–D5 build/runtime split, pre-paint and vendoring | S1-09, S1-11–S1-17, S1-24–S1-25 |
| D6–D10 content ownership/rendering/drafts | S1-04–S1-08, S1-19–S1-20 |
| D11–D14 picker/palette/utility CSS and CSS prose | S1-11–S1-12, S1-16, S1-21 |
| D15–D17 prose presentation and canonical generated markup | S1-05–S1-06, S1-14–S1-19 |
| D18–D24 public paths/posts/harness/deploy/docs/sitemap | S1-02–S1-03, S1-07, S1-09, S1-13, S1-19–S1-23, S1-25–S1-28 |
| D25–D28 mobile/structural palette/404/slim registry | S1-04, S1-10–S1-12, S1-21, S1-24 |
| D29–D34 Shell/picker/href/globals/projection/composition | S1-10–S1-14, S1-21 |
| D35–D37 static facts/masthead/shared accessor | S1-05–S1-08, S1-15–S1-19 |
| D38–D39 authoring proof and build invariants | S1-08, S1-12–S1-13, S1-24–S1-26 |
| §6 routes/shims/subsites and §7 complete blog pipeline | S1-07, S1-10, S1-12, S1-18–S1-22 |
| §8 every retained/deleted runtime and resource order | S1-09, S1-11–S1-19, S1-21, S1-25 |
| §9 complete automated matrix and new-behavior assertions | S1-02–S1-03, S1-13, S1-17–S1-22, S1-24, S1-26 |
| §10 deployment rehearsal/cutover/rollback | S1-23, S1-27–S1-28 |
| §11 future-consumer boundaries, without implementing specs 2–6 | S1-24–S1-25 |
| §§13–14 settled owner decisions and execution details | Global constraints, per-ticket references, S1-23/S1-27/S1-28; latest no-gates instruction replaces staged approval timing |
| §15 deliberate differences; §17 research corrections | All parity owners, S1-25–S1-26 |
| Owner QA after the entire migration is finished | S1-28 supplies one final package; owner performs QA afterward |

Spec 1 is implemented when the agent-owned tickets are complete, production is deployed and live checks pass, with architecture/parity evidence and final authoring docs. The owner then does their own QA using `research/owner-qa.md`; their checks are never prefilled by an agent.
