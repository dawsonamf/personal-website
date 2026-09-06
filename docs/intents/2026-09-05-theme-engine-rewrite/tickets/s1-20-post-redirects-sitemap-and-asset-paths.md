# S1-20 — Generate legacy post redirects, sitemap and stable asset URLs

**Status:** Unstarted · **Spec milestone:** T5 · **Scope:** one publication-output integration

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

- [ ] Generate destination-map shim code from validated records; never accept an arbitrary destination parameter. Preserve appropriate query/hash behavior and forward style for local posts.
- [ ] Give the shim canonical/meta-refresh fallback to /blog/. Generate the two canonical autoencoder redirect stubs from external records.
- [ ] Add sitemap integration producing sitemap-index.xml and sitemap-0.xml, with per-post authoritative lastmod.
- [ ] Rewrite both specified chart modules' fetch URLs to /blog/posts/assets/, leaving existing asset prose/logic intact.
- [ ] Verify all eight published bodies' migrated links and static assets, not only the three screenshot posts.
- [ ] Test output absence for raw sources, Gemma, archived external bodies and broken color-randomizer URLs.

## Acceptance and verification

- [ ] /blog/post.html?id=helm resolves to /blog/helm/; adding style=doodle reaches /doodle/blog/helm/.
- [ ] External ids go to their original aboutobjects.com URLs; attacker-supplied destination, unknown, empty and draft ids cannot create an open redirect.
- [ ] Eight local post pages per theme, ten listing entries, 192 page routes plus 404 and explicit redirect stubs.
- [ ] Sitemap contains the correct default URLs/dates and no /sitemap.xml, themed, draft or duplicate local autoencoder entry.
- [ ] No 4xx/5xx on any published post's local resources, and no relative data URL in the two chart modules.
- [ ] Node/schema metadata sources remain single-authority; no manually edited redirect id map.

```bash
node --test --test-concurrency=1 tests/build/publication-output.test.ts
npm run build
npx playwright test tests/browser/legacy-post-urls.spec.ts
PARITY_MODE=old-new npm run test:parity -- --grep '@page:(blog|post)'
```

## Agent handoff

Record changed files, commands and exit results, and any interface adjustments in the completion report. Resolve implementation failures in scope; do not replace failed assertions with broader exclusions. Leave owner QA to the end of the complete migration.
