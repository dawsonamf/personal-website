# S1-20 — Generate legacy post redirects, sitemap and stable asset URLs

**Status:** Done · **Spec milestone:** T5 · **Scope:** one publication-output integration

**Depends on:** [S1-18](s1-18-blog-listing.md), [S1-19](s1-19-static-blog-posts.md)

Assign one agent this ticket plus the [execution contract](../../../superpowers/plans/2026-09-05-spec-1-migration-engine.md). Read [Spec 1](../spec-1-migration-engine-parity.md) §6.4, §7.2, D19/D24 and Q1–Q2. Dependencies supply code and evidence; there is no owner review between tickets.

## Deliverable

Old blog URLs resolve safely, sitemap contents derive from post sources, and moved post assets have no depth-dependent fetches.

## Files

- Create: `src/build/post-output.ts`, generated `public/blog/post.html`, `tests/build/publication-output.test.ts`, `tests/browser/legacy-post-urls.spec.ts`.
- Modify: `astro.config.mjs` sitemap/post-redirect/integration blocks.
- Modify: `public/blog/posts/assets/cohorts-chart.js`, `public/blog/posts/assets/job-market-chart.js` fetch destinations only.
- Read: `src/build/posts.ts`, `src/content/posts/*.md`. S1-07 owns source-body URL migration.
- Do not modify workflows, utility layouts or subsite redirects; S1-22 edits config after this ticket.

## Interfaces

- Shim destinations come from legacyPostDestinations; dates from postDates; local route membership from publishedPostIds.
- Generate the shim before public copying, or emit its final dist file after copying without allowing stale public output to overwrite it. Prove the chosen lifecycle with an isolated build test.
- Only published ids can forward a style query to local routes; external ids use their approved destination verbatim; missing/draft/unknown ids go to /404.html.
- Sitemap includes default public pages and published local posts, excludes themes, 404, drafts and external redirect stubs.

## Work

- [x] Generate destination-map shim code from validated records; never accept an arbitrary destination parameter. Preserve appropriate query/hash behavior and forward style for local posts.
- [x] Give the shim canonical/meta-refresh fallback to /blog/. Generate the two canonical autoencoder redirect stubs from external records.
- [x] Add sitemap integration producing sitemap-index.xml and sitemap-0.xml, with per-post authoritative lastmod.
- [x] Rewrite both specified chart modules' fetch URLs to /blog/posts/assets/, leaving existing asset prose/logic intact.
- [x] Verify all eight published bodies' migrated links and static assets, not only the three screenshot posts.
- [x] Test output absence for raw sources, Gemma, archived external bodies and broken color-randomizer URLs.

## Acceptance and verification

- [x] /blog/post.html?id=helm resolves to /blog/helm/; adding style=doodle reaches /doodle/blog/helm/.
- [x] External ids go to their original aboutobjects.com URLs; attacker-supplied destination, unknown, empty and draft ids cannot create an open redirect.
- [x] Eight local post pages per theme, ten listing entries, 192 page routes plus 404 and explicit redirect stubs.
- [x] Sitemap contains the correct default URLs/dates and no /sitemap.xml, themed, draft or duplicate local autoencoder entry.
- [x] No 4xx/5xx on any published post's local resources, and no relative data URL in the two chart modules.
- [x] Node/schema metadata sources remain single-authority; no manually edited redirect id map.

```bash
node --test --test-concurrency=1 tests/build/publication-output.test.ts
npm run build
npx playwright test tests/browser/legacy-post-urls.spec.ts
PARITY_MODE=old-new npm run test:parity -- --grep '@page:(blog|post)'
```

## Agent handoff

Record changed files, commands and exit results, and any interface adjustments in the completion report. Resolve implementation failures in scope; do not replace failed assertions with broader exclusions. Leave owner QA to the end of the complete migration.


## Completion evidence (2026-09-08)

Completed against `engine-rewrite` base `7fb2ce2b21999b9d3f2c5c41f1d62bbe2c90b8c2`. Root owns integration; no ticket agent performed git mutations or installs.

- Publication output tests: 9/9; adjoining raw post regression: 10/10; browser redirect/resource tests: 8/8 across both widths. The all-eight-post browser sweep observes same-origin response/request failures and also GETs DOM references.
- Isolated production build: 193 Astro page HTML files, 128 local post files, 10 listing entries, explicit redirect stubs and 12 sitemap URLs. Final check: 157 files, zero errors/warnings, 48 existing hints.
- Exact old-new parity selection `@page:(blog|post)` listed 608 tests, then passed 608/608 in 25.5 minutes with seven workers and unchanged capture limits. Affected blog palette controls passed 32/32 old-new and 32/32 old-old at both widths.
- Four fresh reviews completed. Correctness A/B and security were clean. The conventions finding was fixed by using approved bound Blog prose and HTML escaping in the generated shim. The parent resource-observation gap was fixed in the same original-builder pass. No second review round.
- The initial matrix was incomplete after a disconnect: 531 passed, 36 failed, 41 not run and two runner errors. Its known scratch blog-to-Home query alias missed the newer exact route seed map. Root approved removing only that obsolete scratch alias after all sixteen OLD/NEW route pairs and existing Home seed were verified. Real-document, navigation, reload, prepaint and path assertions remain. Long timeout/closed-browser/truncated-trace failures from the interrupted run are preserved without a product-cause claim; the complete final run covers every selected case.
- Final source/dist/cache manifests are byte-identical before and after the run. Artifacts: 608 OLD PNGs, 608 NEW PNGs, 1,216 interaction JSON files, zero failure traces; all 10,594 files are nonempty. Owned test listeners/runners are gone; unrelated user PID 89994 on port 4321 was preserved.

Evidence directory: `/private/tmp/theme-engine-openai/s1-20/`. Complete report: `final-verification-report.md`; implementation/fix details: `implementation-report.md`; fresh findings/dispositions: `review-*.md`; exact final log: `logs/parity-blog-post-full.log`; collection: `logs/parity-final-blog-post-list.log`; focused controls: `logs/focused-blog-palette-old-{new,old}.log`; input proof: `logs/post-final-run-input-hashes.log`; cleanup: `logs/final-cleanup-proof.log`. Candidate diff/manifest including this ticket: `complete-ticket.diff` and `complete-ticket.sha256`.

The root-authorized adjoining edit to `tests/build/post-html.test.ts` classifies exactly the legacy shim and two external stubs while preserving strict 193-page/128-local-post counts. No metadata authority changed. Staged Home navigation is only a destination within this blog/post selection; standalone Home matrix coverage is not claimed. External requests remain intercepted in focused resource tests and METR live-proxy success is not claimed.

S1-21 receives the publication-output interface and the pending LexChat owner amendment at `/private/tmp/theme-engine-openai/lexchat-owner-amendment.md`; any approved next-ticket route/count changes follow this accepted 193-page state. S1-26 restores the intended tracked cross-page palette destinations once utilities are complete.
