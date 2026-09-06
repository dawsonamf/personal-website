# S1-07 — Migrate post ownership and publication-filtered source projections

**Status:** Unstarted · **Spec milestone:** T2 · **Scope:** one post-source migration

**Depends on:** [S1-05](s1-05-markdown-prose-access-and-drafts.md)

Assign one agent this ticket plus the [execution contract](../../../superpowers/plans/2026-09-05-spec-1-migration-engine.md). Read [Spec 1](../spec-1-migration-engine-parity.md) §7.1, D8/D19/D24 and Q1–Q2. Dependencies supply code and evidence; there is no owner review between tickets.

## Deliverable

Eleven authoritative post records with one pure source reader and explicit production projections: eight local pages, two external listing records and one unpublished draft.

## Files

- Create: `src/posts/schema.ts`, `src/build/posts.ts`, `src/content/posts/*.md` for the 11 current source ids.
- Create: `tests/unit/post-sources.test.ts`, `tests/fixtures/post-sources/`.
- Read: `blog/posts/*.md`, `js/blog-data.js:112`. Retain legacy root copies until S1-25's transition cleanup.
- Do not edit `src/content/prose.yaml`, theme modules, workflows or `astro.config.mjs`.

## Interfaces

- `PostSource` contains `id`, `source` (filename), `body` (raw Markdown), and validated `meta`.
- `meta.publication` is a discriminant: published/external require current publishable metadata; external also requires `externalUrl`; draft permits unfinished metadata/body.
- Export `readPostSources(): PostSource[]`, `publishedPostIds(): string[]`, `listingPosts(): PostSource[]`, `postDates(): Record<string, string>`, `legacyPostDestinations(): Record<string, string>`.
- Public projections always exclude drafts, even in a preview process. Preview routes explicitly select draft records from `readPostSources()`.
- Legacy destinations contain canonical root paths for published ids and approved external URLs for external ids; absent ids are resolved to 404 by the later shim.

## Work

- [ ] Move metadata/body together using valid YAML. Post title/date win conflicts; listing descriptions/tags are copied verbatim only where absent.
- [ ] Preserve this exact listing order: fly-on-my-laptop, underviewed-art, arena-freshness, helm, toolbelt, embedded-swift-agent, metr-doubling, autoencoders-2, autoencoders-1, college-projects.
- [ ] Make Gemma `publication: draft`; retain autoencoder bodies as archived external sources, with existing aboutobjects.com destinations. Do not promote planning drafts.
- [ ] Preserve raw bodies except the required published-link migration: rewrite relative image/resource paths to root-absolute assets, published .md links to their canonical routes, known external post links to authoritative destinations, and the embedded-agent link to its final subsite path. Normalize scripts/styles metadata to root-absolute local assets or existing pinned external URLs. Test every rewrite against the source URL inventory so S1-19 has no unresolved URL dependency.
- [ ] Validate unique filename ids, listing order, required publishable metadata, dates and external destinations. Use shared field/draft helpers, never `astro:content` or theme imports.
- [ ] Implement one date conversion using the current month/year-plus-day-1 rule with deterministic build-time output; return only published-local dates.
- [ ] Test source-qualified syntax/schema failures, draft retention, publication filtering and exact list membership/order.

## Acceptance and verification

- [ ] Eight published ids, ten listing records and eleven retained sources.
- [ ] Helm title is “Helm: A Workspace Switcher for VS Code and Cursor”, date March 2026; METR date February 2026.
- [ ] Draft fields in published/external metadata are reported; a whole draft is not a production blocker.
- [ ] Neither drafts nor archived external bodies enter public route/body projections.
- [ ] Reader, collection consumers, sitemap and redirects can all use these exports without a second metadata catalog.

```bash
node --test tests/unit/post-sources.test.ts
```

## Agent handoff

Record changed files, commands and exit results, and any interface adjustments in the completion report. Resolve implementation failures in scope; do not replace failed assertions with broader exclusions. Leave owner QA to the end of the complete migration.
