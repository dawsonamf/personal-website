# S1-06 — Migrate approved shared prose and implement the site schema

**Status:** Unstarted · **Spec milestone:** T2 · **Scope:** one content migration

**Depends on:** [S1-05](s1-05-markdown-prose-access-and-drafts.md)

Assign one agent this ticket plus the [execution contract](../../../superpowers/plans/2026-09-05-spec-1-migration-engine.md). Read [Spec 1](../spec-1-migration-engine-parity.md) §4.1, D7, D14–D17, D36 and Q6/Q7/Q11. Dependencies supply code and evidence; there is no owner review between tickets.

## Deliverable

One validated YAML document containing today's shared visitor-facing prose, with no duplicated post records or newly approved copy.

## Files

- Create: `src/content/prose.yaml`, `src/prose/schema.ts`.
- Create: `tests/unit/site-prose.test.ts`, `tests/fixtures/prose-migration.json`.
- Read: `index.html`, `blog/index.html`, `privacy/index.html`, `404.html`, `lexchat/index.html`, `js/nav-config.js`, `js/blog-data.js`, `js/theme-cycler.js`, active theme CSS.
- Read: `research/prose-and-url-inventory.md`, correcting it with Spec 1 §17.

## Interfaces

- Export `siteProseSchema` using strict objects and S1-04 field types.
- Theme prose keys must equal `THEME_IDS` and contain approved `label.xs`.
- Schema supports exactly §4.1's current-consumer fields. `projects` remain independent of post publication.
- Existing prose enters at requested sizes: bodies/bullets/excerpts/descriptions l; metadata descriptions/contact m; titles/OG/footer s; labels/tags/templates xs.

## Work

- [ ] Extract all actual text, including head metadata, logo, alt/aria text, nav/socials, four jobs, eight projects, privacy, utility chrome, picker labels and masthead terminal lines.
- [ ] Store about/skills/project paragraphs as Markdown with original paragraph boundaries. Keep positional jobs DOM keys out of content data.
- [ ] Preserve CTA order and target inheritance data, including the Embedded Swift Agent second-link fallback and Deep RL's absent CTAs.
- [ ] Move marquee's fallback unit and doodle's message into theme prose; preserve whitespace and glyphs. Leave counters/prefixes as CSS decoration.
- [ ] Quote commas, colons, braces and other YAML-sensitive scalars. Store ampersands as plain text.
- [ ] Convert internal data URLs to root-absolute canonical destinations, including the final subsite path; retain all approved external destinations.
- [ ] Add fixtures comparing extracted live text, list ordering and rendered canonical paragraph fragments against the baseline source.

## Acceptance and verification

- [ ] No `prose.posts` or post title/date/description mirror.
- [ ] Nine home and seven listing sequences retain duplicate lines, weighting and pause exceptions.
- [ ] All 16 labels, shared picker strings and generated-text templates exist; template fields contain `{n}`.
- [ ] Schema rejects misspelled keys and registry/prose mismatches.
- [ ] No new shortened copy is invented to populate unused sizes; no new draft is treated as approved.
- [ ] Gemma's existing project card remains present even though its post will be a draft.

```bash
node --test tests/unit/site-prose.test.ts
```

## Agent handoff

Record changed files, commands and exit results, and any interface adjustments in the completion report. Resolve implementation failures in scope; do not replace failed assertions with broader exclusions. Leave owner QA to the end of the complete migration.
