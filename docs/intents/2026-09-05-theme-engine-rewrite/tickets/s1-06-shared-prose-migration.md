# S1-06 — Migrate approved shared prose and implement the site schema

**Status:** Done 2026-09-07 · **Spec milestone:** T2 · **Scope:** one content migration

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

## Completion report

Done, 2026-09-07. Ran on Node v25.9.0 (Node 24 not installed; `.nvmrc` = 24 stays the CI contract). Worktree branched stale at `1208d01`; fast-forwarded to `834eb4f` (S1-05 landed) before any work; `engine-rewrite` later advanced and the worktree HEAD is `c68b953` (S1-02 on top of S1-05), not re-fast-forwarded mid-task. `npm ci` exit 0; no other installs, no git actions, no listeners. The run was interrupted once by an account rate limit and resumed with no work lost.

**Created** (nothing modified, nothing deleted): `src/content/prose.yaml` (497 lines), `src/prose/schema.ts` (198), `src/prose/js-yaml.d.ts` (7), `tests/unit/site-prose.test.ts` (758), `tests/fixtures/prose-migration.json` (672). `src/prose/site.ts` is NOT created (S1-08 owns the binding); no post content or schema (S1-07). No shared file owned by another ticket touched; legacy files, `CNAME`, `.nojekyll` untouched.

**Exported interfaces (handoff for S1-08, S1-11 to S1-21):**
- `src/prose/schema.ts` (pure, plain-Node loadable; imports only `astro/zod`, `./fields.ts`, `../themes/registry.ts`): `siteProseSchema` and `type SiteProse`. Every object is `strictObject`, composed from S1-04's field types. `themes` is `z.strictObject(Object.fromEntries(THEME_IDS.map(id => [id, entry])))`, so an unknown theme fails with "Unrecognized key" and a missing one with `invalid_type` at `themes.<id>`; each entry is `{ label: sizedText refined to a written xs string, ticker?: sizedText, currentlyHere?: sizedText }`. Shared destination regex `^(?:\/(?![\/\\])|https?:\/\/|mailto:)` on every href/url/image; `accentColor` is 6-digit hex; a social has exactly one of `href`/`calendly: true`; `post.readTime` and `carousel.goToSlide` are `sizedTemplate`. Binding is `createProseAccess(siteProseSchema.parse(load(text)), 'prose')`. The schema has no `id` key: S1-08 decides how the `file()` entry's `id` is kept out of the validated data.
- `src/prose/js-yaml.d.ts`: ambient `declare module 'js-yaml'` typing only `load(text, options?): unknown`, because js-yaml 4.3.0 ships no types and `@types/js-yaml` is not installed (an install needs approval). Delete this file if the types are ever installed: two declarations merge into overloads silently. Import as `import { load } from 'js-yaml'` (real ESM export via `dist/js-yaml.mjs`).
- `src/content/prose.yaml` top-level keys, in order: `site, meta, nav, socials, home, jobs, projects, post, carousel, blog, canonical, picker, themes, privacy, notFound`. No `posts` key (asserted: no legacy post title or excerpt occurs in the file). No top-level `lexchat`: its `<title>` is `meta.lexchat.title`.
- Path families, each written at exactly one size: `site.{name,logo,titleSuffix}:xs`, `site.footerCredit:s`, `site.email` (data). `meta.<page>.title:s` stored WITHOUT the ` | Dawson Metzger-Fleetwood` suffix (`site.titleSuffix` is appended on blog, post, privacy and 404; home and lexchat take none); `meta.{home,blog,post,privacy}.description:m`; `meta.{home,blog}.ogDescription:s`; `meta.{notFound,lexchat}` carry only `title`. `nav.<key>:xs` (about, experience, projects, blog, contact, resume, email, theme) plus `nav.aria.{main,quick,social}:xs`; nav hrefs are Nav structure, not stored. `socials.<i>.label:xs` with `id`, `href?`, `icon`, `calendly?` (vCard href is `/resources/contact.vcf`). `home.sections.<key>:xs`, `home.heroAlt:xs`, `home.about.title:xs`, `home.about.body:l` (4 Markdown paragraphs), `home.skills.title:xs`, `home.skills.groups.<i>.{name:xs, body:l}` (the hero subtitle is composed from the three names, D17), `home.contact.body:m` (Markdown links to `mailto:` and `#calendly`), `home.contact.mapAlt:xs`, `home.seeAllPosts:xs`. `jobs.<i>.{company,role,dates}:xs`, `jobs.<i>.bullets:l` (sizedList), `id` (content key, never in the DOM), `url?` (job 3 has none). `projects.<i>.{title:xs, description:l, tech:xs label list, ctas.<j>.label:xs}` with `id`, `image`, `accentColor`, `ctas.<j>.href`, `ctas.<j>.external?`. `post.{copyCode,readTime}:xs`, `carousel.goToSlide:xs`. `blog.intro.p{1,2,3}:l`, `blog.sections.{works,posts}:xs`. `canonical.masthead.{home,listing}[<i>].lines` is plain `string[]` data (terminal strings with `\n`, 9 and 7 sequences, duplicates kept); `pause` exists only on home[1] (1000); the defaults 1500 (home) and 800 (listing) are component constants. `picker.*:xs` including `picker.roles.*` and `picker.schemes.*`. `themes.<id>.label:xs`, `themes.marquee.ticker:xs` (the unit; the build repeats it 12 times), `themes.doodle.currentlyHere:xs`. `privacy.{title,updated}:xs`, `privacy.body:l` (Markdown with `##`/`###`/lists). `notFound.{code,back}:xs`, `notFound.message:s`.
- CTA data is raw (plan contract #7): `external: true` on CTA 1 iff the legacy `external` flag, on CTA 2 iff the legacy `external2` flag; the component reproduces `external2 ? externalAttrs : linkTarget`. Embedded Swift Agent: CTA 1 internal `/subsites/dawson/embedded-swift-agent/`, CTA 2 external. LexChat's CTA carries `external: true` on the internal `/lexchat/` (legacy quirk; S1-16 reproduces it). deep-rl has `ctas: []`. Gemma's card is present.

**Commands and results** (builder, fix agent, four reviewers and the orchestrator all reproduced): `node --test tests/unit/site-prose.test.ts`: tests 134, pass 134, fail 0, skipped 0, exit 0. `npm run test:unit`: tests 282, pass 282, fail 0, exit 0. `node_modules/.bin/tsc --noEmit -p tsconfig.json`: exit 0 (both `@ts-expect-error` lines consumed). `node -e "import('./src/prose/schema.ts')"`: exports `siteProseSchema`. Parity: the fixture holds whitespace-collapsed fragments of the baseline (`0f196d0`) pages with HTML comments stripped, produced mechanically (no prose retyped); JS-sourced data (nav, socials, FEATURED_PROJECTS, 16 labels, masthead arrays, the two CSS literals) is compared live through `node:vm` from `PARITY_OLD_DIR ?? repoRoot`. 151 size maps, one size each, zero drafts, zero HTML entities or tags in any YAML leaf, 18 live job bullets, `unit.repeat(12)` byte-equal to `marquee.css:572`.

**Deviations / interface adjustments:** (1) no top-level `lexchat` (see above). (2) `meta.post.description` is `m`, not §4.1's `s`: the ticket's size rule wins. (3) `jobs[0].bullets` has 6 items, not §4.1's "7 for about-objects": the 7th `<li>` is inside an HTML comment (`index.html:172`), dead text the owner removed from the live site; not migrated and not drafted (a §4.1 count error for §17). (4) `js-yaml.d.ts` added (see above). (5) `meta.blog.description` and `meta.blog.ogDescription` are the same string because `blog/index.html:7` and `:13` are identical. (6) `THEME_IDS` is `readonly string[]`, so `SiteProse['themes']` is an index signature: `prose.text('themes.<typo>.label', 'xs')` type-checks and throws `prose: no such path` at runtime.

**Deltas vs the legacy DOM that page tickets must handle:** the trailing `<br>` after about paragraph 4 (`index.html:111`) is presentation, not stored (S1-15 emits it or §15 lists it); the legacy Calendly anchor's text starts with a space from a line-wrapped source (`index.html:275`) while Markdown emits it tight (S1-15); D16 adds `target="_blank" rel="noopener noreferrer"` to the privacy mailto (`privacy/index.html:110`, S1-21, §15); anchor attribute order becomes `href, class, target, rel`; marked escapes `"`/`'` in text nodes (served bytes differ, DOM text identical); the `about-text`/`contact-text` wrappers belong to the components; privacy headings render without ids, as today.

**Review:** four fresh reviewers (2 correctness on Fable, security and conventions on Opus). Two high findings fixed by a fresh Opus fix pass: the dead bullet above, and a vacuous rule-7 check (the fixture normalizer decodes entities symmetrically, so `scheme &amp; colors` would have passed; now a direct assertion over every raw YAML leaf). Six medium fixed: key order and `posts` asserted on the raw `yaml.load` object instead of zod's shape-ordered output; exact nav label pairing; exact template text; `jobs[].url`, `site.email`, `site.name` compared to legacy; the backslash protocol-relative form blocked in the url regex; `accentColor` hex guard. Lows fixed (about-body `<br>` delta narrowed to paragraph 4, anchor normalizer throws on unexpected attributes, ~48 lines of tautological tests removed, YAML comment and URL-quoting consistency, schema comment nits). Mutation runs proved each new assertion fails on the corresponding wrong value.

**Accepted risks:** only the URL prefix is validated; consumers must bind destinations, `icon`, `id`, `accentColor` and the two CSS prose strings through Astro `{}` attribute interpolation (never template-string `style`/`set:html`), and S1-12/S1-16 must CSS-escape `ticker`/`currentlyHere` when serializing `--prose-*` custom properties. `node:vm` is a realm shim over repo-owned legacy files (same class S1-04/S1-05 accepted); `PARITY_OLD_DIR` defaults to repoRoot, so S1-25 must re-point or retire the live parity checks when `js/` and the legacy pages retire. The masthead bracket scan reads the frozen legacy files (S1-05's approach). Node 25 instead of 24.

**Environment blocks:** none. No listeners started; `lsof`/`pgrep` empty after every run.
