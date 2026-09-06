# Astro capabilities for the theme-engine migration

> Historical research snapshot. The settled owner decisions in [Spec 1 §13](../spec-1-migration-engine-parity.md#13-settled-owner-decisions-q1-q14-2026-09-05) supersede earlier recommendations about post ownership/format, drafts, picker placement and palette support; use the current spec for implementation.

Research date: 2026-09-05. All facts verified against the Astro npm registry entry,
`docs.astro.build`, the `withastro/docs` repo source, or the `withastro/astro` repo source.
Every claim carries a URL. Anything I could not verify is labelled **unverified**.

The stable release today is **Astro 7.3.1**, and Astro 7 is a *large* break from the Astro 5/6
that §4.1 of the intent was written against. Three of those breaks land directly on this
migration (Rust compiler, JSX whitespace default, Sätteri Markdown pipeline). Read section 1
before writing any of the spec.

---

## 1. Summary for the spec author

1. **Latest stable is `astro@7.3.1`**, `engines.node: ">=22.12.0"`, `engines.npm: ">=9.6.5"`.
   ([registry.npmjs.org/astro/latest](https://registry.npmjs.org/astro/latest))
2. **Node 25.9 is not a supported Astro version.** The install docs state: "**Node.js** -
   `v22.12.0` or higher. Odd-numbered versions like `v23` are not supported." `engines.node`
   will not block it, so this fails silently, not loudly. Build CI and the owner's machine
   should both be on **Node 24 LTS** (or 26 when it ships).
   ([install-and-setup](https://docs.astro.build/en/install-and-setup/))
3. **Astro 7 ships a Rust compiler (`@astrojs/compiler-rs`) that no longer auto-corrects HTML.**
   It errors on unclosed tags and passes invalid nesting through as-is instead of restructuring
   it. This is *good* for parity, but any malformed markup in today's hand-written HTML will now
   be a build error rather than a silent fix. ([v7 upgrade](https://docs.astro.build/en/guides/upgrade-to/v7/#rust-compiler))
4. **`compressHTML` now defaults to `'jsx'`, which strips whitespace between elements.**
   `<span>hello</span>\n<em>world</em>` renders as `helloworld`. For DOM parity, set
   **`compressHTML: false`** (preserves all whitespace) and diff from there.
   ([config ref](https://docs.astro.build/en/reference/configuration-reference/#compresshtml),
   [v7 upgrade](https://docs.astro.build/en/guides/upgrade-to/v7/#new-default-whitespace-handling-compresshtml-jsx))
5. **The Markdown pipeline is now Sätteri (Rust), not remark/rehype.** `markdown.remarkPlugins`
   and `markdown.rehypePlugins` are **deprecated** and now additionally require installing
   `@astrojs/markdown-remark`. To use a rehype plugin (e.g. `rehype-highlight`) you must set
   `markdown.processor: unified({ rehypePlugins: [...] })` from `@astrojs/markdown-remark`.
   ([v7 upgrade](https://docs.astro.build/en/guides/upgrade-to/v7/#new-default-markdown-processor-sätteri),
   [markdown.processor](https://docs.astro.build/en/reference/configuration-reference/#markdownprocessor))
6. **`file()` accepts a top-level YAML *map* as well as an array**, and `.yaml`/`.yml` are parsed
   with bundled `js-yaml`. In map form each top-level key becomes an entry `id`. Verified in
   [`packages/astro/src/content/loaders/file.ts`](https://github.com/withastro/astro/blob/main/packages/astro/src/content/loaders/file.ts).
7. **The clean route for ONE structured prose document is `file()` + `parser`**:
   `parser: (text) => ({ prose: yaml.load(text) })` yields a single entry the whole zod schema
   validates as one tree. ([nested docs](https://docs.astro.build/en/guides/content-collections/#nested-json-documents))
8. **A zod failure throws `AstroError` and fails `astro build`, and it prints every issue**, one
   line per issue as `**path.to.field**: message`. That is exactly the shape the draft gate needs
   from a single `superRefine`. Verified in
   [`errors-data.ts` `InvalidContentEntryDataError`](https://github.com/withastro/astro/blob/main/packages/astro/src/core/errors/errors-data.ts)
   and [`content/utils.ts`](https://github.com/withastro/astro/blob/main/packages/astro/src/content/utils.ts).
9. **`z` is Zod 4** (`astro@7.3.1` depends on `zod: ^4.5.4`); import from `astro/zod`.
   ([content-collections](https://docs.astro.build/en/guides/content-collections/#defining-datatypes-with-zod))
10. **`renderMarkdown(content, { fileURL })` exists on `LoaderContext`** (since astro@5.9.0) and
    uses Astro's own Markdown pipeline. Only available inside a *custom* loader, not inside a
    component. ([loader ref](https://docs.astro.build/en/reference/content-loader-reference/#loadercontextrendermarkdown))
11. **Rest params can be `undefined` in `getStaticPaths` to emit the un-prefixed route.** This is
    the mechanism for `/` and `/<theme>/` from one template.
    ([routing](https://docs.astro.build/en/guides/routing/#rest-parameters))
12. **Route priority is documented and deterministic**: reserved routes, then more path segments,
    then static over dynamic, then named params over rest params, and file routes beat redirects.
    `src/pages/blog/index.astro` therefore always wins over `[...theme]/index.astro`.
    ([priority order](https://docs.astro.build/en/guides/routing/#route-priority-order))
13. **`prerenderConflictBehavior: 'error'` (new in v6) fails the build when two routes emit the
    same URL.** Turn it on. It is the cheapest guard against a theme id colliding with a page name.
    ([config ref](https://docs.astro.build/en/reference/configuration-reference/#prerenderconflictbehavior))
14. **Static `redirects` emit an HTML file with `<meta http-equiv="refresh">` and no status code.**
    Dynamic redirects work only when old and new have the *same* params. Query strings and
    trailing-slash-only redirects are explicitly not supported, so `/?style=<id>` and
    `blog/post.html?id=<id>` need real pages with inline scripts.
    ([redirects](https://docs.astro.build/en/reference/configuration-reference/#redirects))
15. **`<script>` tags are no longer hoisted to `<head>`.** Since Astro 5 they render directly
    where authored, are not bundled together across a page, and conditional scripts are no longer
    implicitly inlined. Good for parity, and it means the per-theme library isolation of §3.3 falls
    out naturally. ([v5 upgrade](https://docs.astro.build/en/guides/upgrade-to/v5/#script-tags-are-rendered-directly-as-declared))
16. **`is:inline` is implied by any attribute other than `src`.** So today's `<script defer src=...>`
    and `<script async>` tags survive verbatim without you asking.
    ([directives](https://docs.astro.build/en/reference/directives-reference/#isinline))
17. **Astro-injected head content is emitted as one block: styles, then links, then scripts**, with
    `''` as the separator when `compressHTML` is `true` or `'jsx'` and `'\n'` when it is `false`.
    Verified in [`render/head.ts`](https://github.com/withastro/astro/blob/main/packages/astro/src/runtime/server/render/head.ts).
    To keep today's exact head order, keep all site CSS as hand-written `<link>` tags.
18. **Hand-written `<link rel="stylesheet">` is left verbatim and in place.** It is also the lowest
    precedence layer. ([styling](https://docs.astro.build/en/guides/styling/#link-tags))
19. **`public/` files are copied "as-is, without transform or bundling"** and `public/CNAME` is the
    documented GitHub Pages custom-domain recipe.
    ([publicDir](https://docs.astro.build/en/reference/configuration-reference/#publicdir),
    [deploy/github](https://docs.astro.build/en/guides/deploy/github/))
20. **Astro auto-injects `<!DOCTYPE html>` into any `src/pages/` component** unless it exports
    `partial = true`. It does **not** auto-inject `<meta name="generator">`; that tag only appears
    because the starter templates hand-write `content={Astro.generator}`.
    ([pages](https://docs.astro.build/en/basics/astro-pages/), [styling example](https://docs.astro.build/en/guides/styling/#link-tags))
21. **`<astro-island>` appears only with a `client:*` directive**, and the view-transitions script
    only when you add `<ClientRouter />`. Neither is on by default.
    ([scripts](https://docs.astro.build/en/guides/client-side-scripts/), [view transitions](https://docs.astro.build/en/guides/view-transitions/))
22. **`rehype-highlight` (lowlight) emits `<pre><code class="hljs language-js"><span class="hljs-keyword">…`**,
    the same class vocabulary as browser highlight.js, so the github-dark stylesheet applies unchanged.
    ([rehype-highlight readme](https://github.com/rehypejs/rehype-highlight#readme),
    [lowlight readme](https://github.com/wooorm/lowlight#css))
23. **But `lowlight@3.3.0` pins `highlight.js: ~11.11.0`, not 11.9.0.** Token output can differ from
    the current site because grammars changed between 11.9 and 11.11. Either accept the drift, force
    `highlight.js@11.9.0` via an npm `overrides` block, or keep client-side highlight.js.
    ([registry.npmjs.org/lowlight/latest](https://registry.npmjs.org/lowlight/latest))
24. **`markdown.syntaxHighlight.excludeLangs` (default `['math']`) is the documented Mermaid escape
    hatch**: add `'mermaid'` and the fence passes through unhighlighted for the client renderer.
    ([config ref](https://docs.astro.build/en/reference/configuration-reference/#markdownsyntaxhighlightexcludelangs))
25. **Vite/Astro do not import `.yaml` natively.** There is an official recipe that adds
    `@rollup/plugin-yaml` via `vite.plugins`. This is a second dependency and the *unofficial* route;
    `file()` is the supported one. ([recipe](https://docs.astro.build/en/recipes/add-yaml-support/))
26. **`astro dev` and `astro preview` bind localhost only** (`server.host` defaults to `false`) on
    port 4321. This satisfies the owner's network-privacy rule without extra flags.
    ([server.host](https://docs.astro.build/en/reference/configuration-reference/#serverhost),
    [CLI `--host`](https://docs.astro.build/en/reference/cli-reference/#--host-optional-host-address))

---

## 2. Detailed findings

### 2.1 Version and Node

`https://registry.npmjs.org/astro/latest` (fetched 2026-09-05):

```json
{ "version": "7.3.1",
  "engines": { "node": ">=22.12.0", "npm": ">=9.6.5", "pnpm": ">=7.1.0" } }
```

Notable dependencies of `astro@7.3.1`, all of which shape the spec:

| dep | version | why it matters |
|---|---|---|
| `@astrojs/compiler-rs` | `^0.4.0` | Rust compiler, replaces the Go `@astrojs/compiler` |
| `@astrojs/markdown-satteri` | `0.4.0` | default Markdown pipeline, replaces remark/rehype |
| `vite` | `^8.0.13` | Vite 8 |
| `zod` | `^4.5.4` | `astro/zod` is **Zod 4** |
| `js-yaml` | `^4.3.0` | how `file()` parses `.yaml` |
| `shiki` | `^4.0.2` | default highlighter |

**Node 25 verdict.** `engines.node: ">=22.12.0"` is satisfied by 25.9, so npm will not warn.
But the install docs say plainly: "**Node.js** - `v22.12.0` or higher. Odd-numbered versions like
`v23` are not supported." (<https://docs.astro.build/en/install-and-setup/>). Odd Node lines never
reach LTS and get short support windows. I found no issue tracker entry naming Node 25 specifically
(**unverified**), but "not supported" means any Node-25-only bug is out of scope for the Astro team.

Recommendation for the spec: pin Node 24 in `.nvmrc` and in the Actions workflow
(`actions/setup-node` with `node-version-file: .nvmrc`), and tell the owner to switch locally.

### 2.2 Prose: one YAML file, zod schema, draft gate

#### `file()` accepts a top-level map

From [`packages/astro/src/content/loaders/file.ts`](https://github.com/withastro/astro/blob/main/packages/astro/src/content/loaders/file.ts):

- Extension dispatch: `json` uses `JSON.parse`, `yml`/`yaml` uses `yaml.load(text, { filename })`
  from `js-yaml`, `toml` uses `smol-toml`. A supplied `parser` overrides all of it.
- `if (Array.isArray(data))` requires `id` or `slug` on each item; an item without one logs
  `Item in <file> is missing an id or slug field.` and is **skipped**, not fatal.
- `else if (typeof data === 'object')` iterates `Object.entries(data)` and uses each **key as the
  `id`**. A top-level `$schema` string key is skipped, which is handy if you want editor
  completion on the YAML file.
- Every entry goes through `parseData({ id, data: rawItem, filePath })`, which is where the zod
  schema runs.

The docs say the same, with the JSON example: <https://docs.astro.build/en/guides/content-collections/#the-file-loader>

**Trap.** If a top-level YAML map is used directly, every top-level section (`about:`, `jobs:`,
`nav:`, `themes:`) becomes a *separate entry* and the collection `schema` must validate each of
those heterogeneous shapes with the same schema. That is a bad fit for one structured document.

#### The `parser` option, and the one-entry approach

`parser` is `(text: string) => Promise<ParserOutput> | ParserOutput` where
`ParserOutput = Record<string, Record<string, unknown>> | Array<Record<string, unknown>>`.
It is documented for CSV and for nested JSON documents
(<https://docs.astro.build/en/guides/content-collections/#nested-json-documents>).

For a single structured prose document, wrap the whole tree as one entry:

```ts
// src/content.config.ts
import { defineCollection } from 'astro:content';
import { file } from 'astro/loaders';
import { z } from 'astro/zod';
import { load as parseYaml } from 'js-yaml';
import { proseSchema } from './prose-schema';

const prose = defineCollection({
  // One entry, id "site", whose data is the entire document.
  loader: file('src/content/prose.yaml', {
    parser: (text) => ({ site: parseYaml(text) as Record<string, unknown> }),
  }),
  schema: proseSchema,
});

export const collections = { prose };
```

`js-yaml` is already a transitive dependency of `astro`, but it is not a public export, so
declare it directly in `package.json` rather than relying on hoisting.

The alternative, one entry per top-level section, is also viable and gives nicer error paths
(`prose → jobs` instead of `prose → site`) at the cost of a discriminated-union schema. Either
works; pick one and state it.

#### Deeply nested schemas and multi-issue failures

Zod validates arbitrary nesting, and Astro reports **every** issue. From
[`errors-data.ts`](https://github.com/withastro/astro/blob/main/packages/astro/src/core/errors/errors-data.ts):

```ts
export const InvalidContentEntryDataError = {
  name: 'InvalidContentEntryDataError',
  title: 'Content entry data does not match schema.',
  message(collection, entryId, error) {
    return [
      `**${collection} → ${entryId}** data does not match collection schema.\n`,
      ...error.issues.map((issue) => `  **${issue.path.join('.')}**: ${issue.message}`),
      '',
    ].join('\n');
  },
  hint: 'See https://docs.astro.build/en/guides/content-collections/ ...',
};
```

And from [`content/utils.ts`](https://github.com/withastro/astro/blob/main/packages/astro/src/content/utils.ts),
the schema is run with `safeParseAsync` and on failure Astro constructs that error, attaches a
`location` with the YAML line resolved from the first issue path, and **`throw`s**. An
`AstroError` thrown during content sync aborts `astro build` with a non-zero exit.

So a single `superRefine` walking the tree and calling `ctx.addIssue` once per draft produces
exactly the requested output:

```ts
// prose-schema.ts (Zod 4, imported from 'astro/zod')
import { z } from 'astro/zod';

const SIZES = ['xs', 's', 'm', 'l'] as const;

const draft = z.object({ draft: z.string() });
const sized = z.record(
  z.enum(SIZES),
  z.union([z.string(), draft, z.null()]),
);

export const proseSchema = z.object({ /* sections → fields → sizes */ })
  .superRefine((doc, ctx) => {
    if (import.meta.env.MODE !== 'production') return;   // drafts allowed in preview
    for (const { path } of findDrafts(doc)) {
      ctx.addIssue({
        code: 'custom',
        path,                                  // e.g. ['about','l'] or ['jobs',2,'bullets','m']
        message: 'unapproved draft: clear it or remove the `draft:` wrapper',
      });
    }
  });
```

Build output looks like this (format from the source above, exact console framing **unverified**,
I did not run a build):

```
 error   Content entry data does not match schema.
  **prose → site** data does not match collection schema.

    **about.l**: unapproved draft: clear it or remove the `draft:` wrapper
    **jobs.2.bullets.m**: unapproved draft: clear it or remove the `draft:` wrapper

  Hint: See https://docs.astro.build/en/guides/content-collections/ ...
  File: src/content/prose.yaml:41:0
```

**Gap worth knowing.** `superRefine` runs per entry. If you split the document into one entry per
section, you get one error per *failing section*, and Astro throws on the first one, so the owner
sees only the first section's drafts per build. That is an argument for the single-entry shape,
which lists everything at once. This matches the §4.4 requirement that the build "lists exactly
what is unwritten".

**Second gap.** The `file()` loader swallows *read/parse* failures:
`catch { logger.error('Error reading data from ...'); return; }`. A syntactically broken YAML file
logs an error and yields an empty collection rather than failing the build. If that matters, add a
belt-and-braces check in an `astro:config:setup` integration hook that parses the file itself and
throws.

#### The plain-import alternative

Astro/Vite do **not** import `.yaml` out of the box. The official answer is a recipe titled
"Installing a Vite or Rollup plugin" (<https://docs.astro.build/en/recipes/add-yaml-support/>):

```js
// astro.config.mjs
import { defineConfig } from 'astro/config';
import yaml from '@rollup/plugin-yaml';

export default defineConfig({ vite: { plugins: [yaml()] } });
```

plus a `declare module "*.yml"` ambient type. A module-top-level `proseSchema.parse(...)` in a
`src/lib/prose.ts` would throw during build and abort it, and you'd control the message format
completely.

**Which is officially supported?** `file()` is the documented, first-class route for a single
structured data file; the YAML *import* is a recipe for adding a third-party Rollup plugin. Use
`file()`. The only reason to prefer the import is total control over the error text, and you can
get most of that with `superRefine` messages.

### 2.3 Markdown inside prose fields

`renderMarkdown` is real, and documented at
<https://docs.astro.build/en/reference/content-loader-reference/#loadercontextrendermarkdown>:

> **Type:** `(content: string, options?: { fileURL?: URL }) => Promise<RenderedContent>`
> *(Added in astro@5.9.0)* … Renders a Markdown string to HTML … using the same Markdown
> processing as Astro's built-in `glob()` loader.

`fileURL` (astro@6.0.0+) sets the base for resolving relative image paths.

**Constraint that matters here.** `renderMarkdown` lives on `LoaderContext`, i.e. inside a loader's
`load()`. It is not available in a component. And `RenderedContent` is assigned to *one* `rendered`
field on a `DataEntry`, so it renders one body per entry, not N sized prose fields per entry.

Two workable shapes:

1. **Custom loader.** Replace `file()` with a small custom loader that reads the YAML, walks the
   tree, calls `renderMarkdown` on every prose string, and stores the HTML alongside the source.
   Uses Astro's own pipeline (GFM + SmartyPants + your `markdown.processor` config), so inline
   prose and blog posts render identically. This is the highest-fidelity option and is maybe 60
   lines. See <https://docs.astro.build/en/reference/content-loader-reference/#building-a-loader>.
2. **`marked` at build.** The site already pins `marked@18.0.5` and today's blog renders with it.
   Calling it from a build-time helper keeps the exact current inline-Markdown semantics, which is
   arguably *better* for parity than switching prose to Astro's pipeline.

Either way, inject with `set:html`:

```astro
<p set:html={proseHtml} />
```

`set:html` "Injects an HTML string into an element, similar to setting `el.innerHTML`" and warns
"The value is not automatically escaped by Astro!"
(<https://docs.astro.build/en/reference/directives-reference/#sethtml>). Since the source is the
owner's own YAML file, that is acceptable; note it in the spec anyway. `set:text` is the escaped
counterpart, useful for `xs` labels and aria-labels where no Markdown is wanted.

`set:html` on a `<Fragment>` avoids introducing a wrapper element:

```astro
<Fragment set:html={proseHtml} />
```

### 2.4 Markdown posts

#### `glob()` and pointing outside `src/`

```ts
loader: glob({ pattern: '**/*.md', base: './blog/posts' })
```

Options (<https://docs.astro.build/en/reference/content-loader-reference/#glob-loader>):
`pattern` (micromatch), `base` (`string | URL`, default `"."`), `generateId({ entry, base, data })`
(defaults to a kebab-case slug), `retainBody` (default `true`, astro@5.17.0+), `deferRender`
(default `false`, astro@7.1.0+, defers Markdown rendering to page render to cut build memory).

`base` defaults to `"."` (the project root) and the docs describe it as "a `base` file path of
where your files are located" with no restriction to `src/`. The docs' examples all use `./src/…`,
so **a repo-root `blog/posts/` base is supported but not explicitly demonstrated** (partially
unverified: the type and default allow it, no doc sentence forbids it). Cheapest de-risking is to
just move the posts to `src/content/blog/` during the migration, since §3.5 already permits URL and
layout changes and post URLs are moving to `/blog/<id>/` anyway.

To keep today's post ids exactly (they are the filename), pass:

```ts
generateId: ({ entry }) => entry.replace(/\.md$/, ''),
```

The default lowercases; the docs give this exact "retain uppercase" example
(<https://docs.astro.build/en/guides/content-collections/#defining-custom-ids>). Also note that a
`slug` key in frontmatter overrides the generated id.

#### Rendering

```astro
---
import { getCollection, render } from 'astro:content';

export async function getStaticPaths() {
  const posts = await getCollection('blog');
  return posts.map((post) => ({ params: { id: post.id }, props: { post } }));
}

const { post } = Astro.props;
const { Content, headings } = await render(post);
---
<Content />
```

(<https://docs.astro.build/en/guides/content-collections/#rendering-body-content>,
<https://docs.astro.build/en/guides/content-collections/#building-for-static-output-default>)

#### Syntax highlighting: the Astro 7 situation

`markdown.syntaxHighlight` is now
`SyntaxHighlightConfig | SyntaxHighlightConfigType | false`, default
`{ type: 'shiki', excludeLangs: ['math'] }`
(<https://docs.astro.build/en/reference/configuration-reference/#markdownsyntaxhighlight>).
`type` is `'shiki' | 'prism'` (since 5.5.0) and `excludeLangs` is `Array<string>` (since 5.5.0),
described as "useful when using tools that create diagrams from Markdown code blocks, such as
Mermaid.js and D2".

The three options for highlight.js 11.9.0 github-dark parity:

**(a) `rehype-highlight` at build.** Output markup verified from the
[rehype-highlight readme](https://github.com/rehypejs/rehype-highlight#readme):

- input `<pre><code class="language-js">var name = "World";</code></pre>`
- output `<pre><code class="hljs language-js"><span class="hljs-keyword">var</span> name = <span class="hljs-string">"World"</span>…</code></pre>`

So: the `hljs` class **is** added to `<code>`, the `language-*` class **is** preserved, and the
token spans use the `hljs-` prefix (configurable via `prefix`, default `'hljs-'`). Lowlight's readme
says outright that it ships no CSS and "If you are in a browser, you can use any `highlight.js`
theme" (<https://github.com/wooorm/lowlight#css>). The current `github-dark.min.css` link keeps
working unchanged.

Known differences to plan for:
- Detection is off by default (`detect: false`), so a fence with no language is **not** highlighted.
  Browser `highlightAll()` auto-detects. If any post has a bare ``` fence that currently gets
  colored, it will go plain.
- `rehype-highlight` bundles 37 common languages by default; register more via `languages`.
- `lowlight@3.3.0` depends on `highlight.js: ~11.11.0`, not 11.9.0
  (<https://registry.npmjs.org/lowlight/latest>). Grammar changes between 11.9 and 11.11 will
  produce different span boundaries on some code. If exact parity matters, add an npm `overrides`
  for `highlight.js: 11.9.0`; that is outside lowlight's declared range, so smoke-test it.
- **Astro 7 wiring cost**: rehype plugins now require the `unified()` processor.

```js
// astro.config.mjs
import { defineConfig } from 'astro/config';
import { unified } from '@astrojs/markdown-remark';   // npm i @astrojs/markdown-remark
import rehypeHighlight from 'rehype-highlight';

export default defineConfig({
  markdown: {
    syntaxHighlight: { type: 'shiki', excludeLangs: ['mermaid', 'math'] },
    processor: unified({ rehypePlugins: [rehypeHighlight] }),
  },
});
```

Opting into `unified()` means opting out of Sätteri's speed. Alternatively port to a
[Sätteri HAST plugin](https://satteri.bruits.org/docs/plugins/), which the v7 upgrade guide
recommends (I did not evaluate the Sätteri plugin API; **unverified**).

**(b) Custom plugin calling highlight.js 11.9.0 directly.** Same wiring cost as (a), but lets you
pin the exact version the site uses today. Only worth it if (a)'s version drift shows up in the
parity diff.

**(c) Keep client-side highlight.js on the prerendered HTML.** Set
`markdown.syntaxHighlight: false`, keep the existing `<script src=".../highlight.min.js">` and
`hljs.highlightAll()` call. Zero new dependencies, byte-identical highlighting to today by
construction, no `unified()`, no Sätteri porting. **This is the lazy correct answer for the parity
milestone.** Move highlighting to build time later, in the cleanup pass §7, where the change can be
diffed on its own.

**Markup when `syntaxHighlight: false`.** The config reference says only "do not apply syntax
highlighting" and the syntax-highlighting guide does not state the emitted markup. The standard
CommonMark-to-HAST output is `<pre><code class="language-x">`, which is also what rehype-highlight
documents as its *input*, but I could not find a doc sentence or Sätteri source confirming this for
Astro 7. **Unverified.** Confirm empirically in the first spike, because option (c) depends on it:
`hljs.highlightAll()` keys off `class="language-*"` on `<code>`.

**Mermaid.** No build-time support in Astro; keep the current client script. Add `'mermaid'` to
`excludeLangs` so the fence emits `<pre><code class="language-mermaid">…</code></pre>` untouched
(<https://docs.astro.build/en/reference/configuration-reference/#markdownsyntaxhighlightexcludelangs>).
The existing `mermaid.initialize({ startOnLoad: false, theme: 'base', … })` block in
`blog/post.html` reads CSS variables set pre-paint by `theme-bootstrap.js`, so it must stay
`is:inline` and stay after the theme bootstrap.

### 2.5 Theme routing

#### Optional prefix from one template

There is no "optional segment" syntax, but a rest param that can be `undefined` does the job.
Verbatim from <https://docs.astro.build/en/guides/routing/#rest-parameters>:

```astro
// src/pages/sequences/[...path].astro
export function getStaticPaths() {
  return [
    { params: { path: "one/two/three" }},
    { params: { path: "four" }},
    { params: { path: undefined }}
  ]
}
```

> This will generate `/sequences/one/two/three`, `/sequences/four`, and `/sequences`.
> (Setting the rest parameter to `undefined` allows it to match the top level page.)

Applied here, a rest param at the *root* absorbs the optional theme prefix:

```
src/pages/
  [...theme]/
    index.astro            →  /  and  /<theme>/
    blog/
      index.astro          →  /blog/  and  /<theme>/blog/
      [id].astro           →  /blog/<id>/  and  /<theme>/blog/<id>/
    privacy/index.astro    →  /privacy/  and  /<theme>/privacy/
    lexchat/index.astro    →  /lexchat/  and  /<theme>/lexchat/
  404.astro                →  /404.html
```

with a shared helper:

```ts
// src/lib/theme-paths.ts
import { THEMES } from './themes';           // 16 skins + structural themes
export const themeParams = () => [
  { theme: undefined },                      // default, un-prefixed
  ...THEMES.filter((t) => t.id !== 'default').map((t) => ({ theme: t.id })),
];
```

```astro
// src/pages/[...theme]/blog/[id].astro
export async function getStaticPaths() {
  const posts = await getCollection('blog');
  return themeParams().flatMap(({ theme }) =>
    posts.map((post) => ({ params: { theme, id: post.id }, props: { theme, post } })),
  );
}
```

Note `[...theme]` will happily accept a *multi-segment* value like `a/b`. Since you generate the
list yourself, that never happens; just do not accept the param from user input.

#### Priority and collisions

Verbatim from <https://docs.astro.build/en/guides/routing/#route-priority-order>, in order:

1. Astro reserved routes
2. Routes with more path segments beat less specific ones
3. Static routes without path parameters beat dynamic routes
4. Dynamic routes using named parameters beat rest parameters
5. Pre-rendered dynamic routes beat server dynamic routes
6. Endpoints beat pages
7. File-based routes beat redirects
8. Otherwise, alphabetical, "based on the default locale of your Node installation"

Consequences for this layout:

- If you also keep a literal `src/pages/blog/index.astro`, rule 3 makes it win over
  `[...theme]/blog/index.astro`. That is a foot-gun: put every themed page under `[...theme]/`
  and nothing at the top level except `404.astro`, so there is one template per page type.
- **A theme id equal to a top-level page name is a real hazard.** `/lexchat/` is generated by
  `[...theme]/lexchat/index.astro` with `theme: undefined`. If someone registers a theme with
  `id: 'lexchat'`, the *same* rest-param route emits `/lexchat/` twice (once as the utility page,
  once as the themed home). That is a prerender conflict, not a priority question. Guard it two ways:
  - `prerenderConflictBehavior: 'error'` in the config
    (<https://docs.astro.build/en/reference/configuration-reference/#prerenderconflictbehavior>),
    which fails the build instead of silently picking one, and
  - a reserved-id list in the theme registry (`blog`, `privacy`, `lexchat`, `subsites`, `404`,
    `_astro`, `_actions`, `_server_islands`) asserted at build time.
- Reserved routes are `_astro/`, `_server_islands/`, `_actions/`
  (<https://docs.astro.build/en/guides/routing/#reserved-routes>).
- Prefixing a file or directory in `src/pages/` with `_` excludes it from routing
  (<https://docs.astro.build/en/guides/routing/#excluding-pages>), useful for colocating theme
  components next to their pages.

**Scale.** 17 themes x ~5 page types plus 17 x N posts. With ~10 posts that is roughly 250 pages.
No documented limit; Astro 7 advertises 15-61% faster builds and stable queued rendering
(<https://astro.build/blog/astro-7/>). `build.concurrency` exists if page generation needs tuning
(<https://docs.astro.build/en/reference/configuration-reference/#buildconcurrency>), and
`glob({ deferRender: true })` cuts Markdown memory on large collections.

### 2.6 Redirects and legacy URLs

Verbatim from <https://docs.astro.build/en/reference/configuration-reference/#redirects>:

> For statically-generated sites with no adapter installed, this will produce a client redirect
> using a `<meta http-equiv="refresh">` tag and does not support status codes.

and

> You can redirect both static and dynamic routes, but only to the same kind of route.
> For example, you cannot have a `'/article': '/blog/[...slug]'` redirect.

The config example in the docs source even carries this comment:

```js
redirects: {
  '/old': '/new',
  '/blog/[...slug]': '/articles/[...slug]',
  '/about': 'https://example.com/about',
  '/news': { status: 302, destination: 'https://example.com/news' },
  // '/product1/', '/product1' // Note, this is not supported
}
```

So:

- **Dynamic redirects work** for static output as long as both sides share the same params.
- **Query strings are not expressible.** Keys are route patterns matched by the same file-routing
  matcher; there is no query syntax anywhere in the reference. Confirmed indirectly by
  `Astro.url`: "On prerendered pages, `request.url` does not contain search parameters, like
  `?type=new`, as it's not possible to determine them ahead of time during static builds"
  (<https://docs.astro.build/en/reference/api-reference/#url>).
- **Trailing-slash-only redirects are not supported**, per that comment and the `trailingSlash`
  note: "Trailing slashes on prerendered pages are handled by the hosting platform … You cannot use
  Astro redirects for this use case at this point."
- Redirects are the *lowest* priority: "will always take lower precedence than an existing page
  file of the same name" (<https://docs.astro.build/en/guides/routing/#configured-redirects>).
- `build.redirects` (default `true`) toggles emitting the HTML redirect files at all
  (<https://docs.astro.build/en/reference/configuration-reference/#buildredirects>).

**Therefore `/?style=<id>` and `blog/post.html?id=<id>` need real pages**, each with a tiny
`is:inline` script that reads `location.search` and does `location.replace(...)`:

```astro
---
// src/pages/blog/post.html.astro   →  dist/blog/post.html
export const prerender = true;
---
<!doctype html>
<html lang="en"><head>
<meta charset="utf-8">
<title>Redirecting…</title>
<script is:inline>
  var id = new URLSearchParams(location.search).get('id');
  location.replace(id ? '/blog/' + encodeURIComponent(id) + '/' : '/blog/');
</script>
<meta http-equiv="refresh" content="0;url=/blog/">
</head><body></body></html>
```

**Can a route named `blog/post.html` be produced?** Two ways, both fine:

1. `src/pages/blog/post.html.astro`. With `build.format: 'directory'` (default) this would build
   `/blog/post.html/index.html`, which is wrong. Use `build.format: 'preserve'`, or drop the file
   into `public/`.
2. **`public/blog/post.html` as a literal static file.** Simplest, copied byte-for-byte, immune to
   `build.format`. Same for the home-page `?style=` shim: the shim can live directly in the real
   `/index.html` since `/` is a page anyway, reading `?style=` and redirecting to `/<style>/`.

Recommend (2) for `blog/post.html`, and an inline script on the real home page for `?style=`.

**`build.format` and `trailingSlash`** (<https://docs.astro.build/en/reference/configuration-reference/#buildformat>):

- `'file'`: `src/pages/about.astro` and `src/pages/about/index.astro` both build `/about.html`
- `'directory'` (default): both build `/about/index.html`
- `'preserve'`: exactly as in source; `about.astro` → `/about.html`, `about/index.astro` → `/about/index.html`

And the documented pairing advice: "`directory` - Set `trailingSlash: 'always'`; `file` - Set
`trailingSlash: 'never'`". `build.format` also determines `Astro.url.pathname` during the build
(`/foo/` for directory, `/foo.html` for file).

GitHub Pages serves `dir/index.html` for `/dir/`, so **`build.format: 'directory'` +
`trailingSlash: 'always'`** matches both the target URL shape (`/blog/<id>/`) and today's site.

**`404.astro`** builds to `404.html` (GitHub Pages picks it up automatically). Note this file is
*not* affected by `build.format` in practice, but I did not find a doc sentence stating that
explicitly; **unverified**, confirm in the first build. The existing `404.html` already uses
absolute `/css/...` paths, which is exactly right since it is served at arbitrary depths.

### 2.7 Config surface

| option | default | note (all from <https://docs.astro.build/en/reference/configuration-reference/>) |
|---|---|---|
| `site` | none | "Your final deployed URL." Required by `@astrojs/sitemap`, used for canonical URLs and `Astro.site`. Set to `https://www.dawsonamf.com`. |
| `base` | none | Deployment sub-path. **Do not set it**: the GitHub Pages guide says with a custom domain "Do not set a value for `base`, and remove one if it exists". |
| `trailingSlash` | `'ignore'` | Set `'always'` to pair with `build.format: 'directory'`. Affects dev and on-demand only; static hosts decide for themselves. |
| `outDir` | `./dist` | Fine as-is. |
| `publicDir` | `./public` | "Files in this directory are served at `/` during dev and copied to your build directory during build. These files are always served or copied as-is, without transform or bundling." Keep the name (§5 already decided this). |
| `build.format` | `'directory'` | See 2.6. |
| `build.assets` | `'_astro'` | Where bundled JS/CSS land. Leave alone. |
| `build.inlineStylesheets` | `'auto'` | Inlines project CSS under 4 kB into `<style>`. **Set `'never'`** for parity if you ever import CSS in frontmatter; irrelevant if all CSS is hand-written `<link>`. |
| `compressHTML` | `'jsx'` | **Set `false`.** See 2.8. |
| `prerenderConflictBehavior` | `'warn'` | **Set `'error'`.** |
| `output` | `'static'` | Already the default; state it explicitly anyway. |
| `vite` | none | Full Vite 8 passthrough: `vite.plugins`, `vite.build.assetsInlineLimit`, `vite.ssr.noExternal`. |
| `scopedStyleStrategy` | `'attribute'` | `'where'` / `'class'` / `'attribute'`. Only matters if you use scoped `<style>`. |

**`public/` and dotfiles.** The config reference language is "copied as-is, without transform or
bundling", and the GitHub Pages guide documents `public/CNAME` as the custom-domain mechanism
(<https://docs.astro.build/en/guides/deploy/github/>), so `CNAME` is certainly copied. `.nojekyll`
is not named anywhere in the Astro docs (**unverified**); Astro delegates the copy to Vite's
`publicDir`, which copies the directory recursively, and dotfiles have been copied in practice.
Verify with a single `ls -a dist/` on the first build. (With Actions-based Pages deployment
`.nojekyll` is arguably unnecessary anyway, but keep it since `_astro/` starts with an underscore.)

### 2.8 Scripts

**Default processing** (<https://docs.astro.build/en/guides/client-side-scripts/#script-processing>),
verbatim, for a `<script>` with no attributes other than `src`:

> - **TypeScript support:** All scripts are TypeScript by default.
> - **Import bundling:** Import local files or npm modules, which will be bundled together.
> - **Type Module:** Processed scripts become `type="module"` automatically.
> - **Deduplication:** If a component that contains a `<script>` is used multiple times on a page,
>   the script will only be included once.
> - **Automatic inlining:** If the script is small enough, Astro will inline it directly into the
>   HTML to reduce the number of requests.

**They are not hoisted.** From <https://docs.astro.build/en/guides/upgrade-to/v5/#script-tags-are-rendered-directly-as-declared>:

> Astro 5.0 removes this experimental flag and makes this the new default behavior in Astro:
> scripts are no longer hoisted to the `<head>`, multiple scripts on a page are no longer bundled
> together, and a `<script>` tag may interfere with CSS styling. Additionally, conditionally
> rendered scripts are no longer implicitly inlined.

So a processed `<script>` becomes `<script type="module" src="/_astro/xxx.HASH.js">` (or an inline
module if small) at the position where you authored it. `type="module"` means deferred and
executed after parse, never render-blocking.

**`is:inline`** (<https://docs.astro.build/en/reference/directives-reference/#isinline>), verbatim:

> - Will not be bundled into an external file
> - Will not be deduplicated, the element will appear as many times as it is rendered
> - Will not have its `import`/`@import`/`url()` references resolved relative to the `.astro` file
> - Will be rendered in the final output HTML exactly where it is authored
> - Styles will be global and not scoped to the component

and the caution:

> The `is:inline` directive is implied whenever any attribute other than `src` is used on a
> `<script>` or `<style>` tag.

This is the load-bearing fact for parity. Today's head has `<script src="js/theme-bootstrap.js">`
(synchronous, pre-paint), `<script src="…gsap…" defer>`, `<script async>` for Calendly. Every one
of those carries an attribute beyond `src` or is a `public/` URL, so they come out verbatim,
in place, in order. `theme-bootstrap.js` in particular must stay a synchronous classic script:
copy it into `public/js/` and reference it as `<script is:inline src="/js/theme-bootstrap.js">`.
The docs are explicit: "To load scripts outside of your project's `src/` folder, include the
`is:inline` directive."

**`define:vars`** passes JSON-serializable frontmatter values into a client script, and "Using
`define:vars` on a `<script>` tag implies the `is:inline` directive". Useful for handing the theme
id or prose strings to an inline script. The `data-*` attribute + `dataset` pattern the docs
recommend is equivalent and does not force inlining.

**Per-theme code splitting (§3.3).** Because scripts render where declared and are not merged
across a page, a `<script>` inside `ThemeX/Layout.astro` produces a chunk emitted only on pages
that render that layout. Vite/Rollup code-splits shared imports into common chunks, so ThemeX's
three.js ends up in a chunk referenced only from ThemeX's pages, and a light theme's page never
links it. The two doc sentences that support this are the v5 "scripts are no longer hoisted …
multiple scripts on a page are no longer bundled together" and the styling guide's parallel
statement for CSS: "Each page on your site gets its own chunk, and additionally, CSS that is shared
between multiple pages is further split off into their own chunks for reuse"
(<https://docs.astro.build/en/guides/styling/#bundle-control>). There is **no doc sentence that
states the JS chunking rule in those words** (**unverified**); it follows from Rollup's standard
per-entry splitting. Add one assertion to the parity harness: grep each built page for `three` /
`lenis` / `gsap` chunk names and fail if a light-theme page references them. That is a two-line
check and it turns an inference into a guarantee.

**Strict global load order (jQuery → jQuery UI → site script).** ESM modules are deferred and
unordered relative to classic scripts, so do not try to express this with processed scripts. Two
options:

1. **Keep it verbatim** (recommended for the parity milestone). Vendor `jquery-3.6.0.min.js` and
   `jquery-ui-1.12.1.min.js` into `public/vendor/`, and emit
   `<script is:inline defer src="/vendor/jquery-3.6.0.min.js"></script>` etc. Classic `defer`
   scripts execute in document order, which is exactly today's semantics, and the DOM diff is
   trivially clean.
2. **Bundle it** (§4.12's stated intent, "move from CDN to npm so Vite can split them per theme").
   One processed script per theme that does
   `import $ from 'jquery'; window.jQuery = window.$ = $; await import('jquery-ui/ui/effect.js'); …`.
   Correct ordering, but the DOM changes shape (one module tag instead of three classic tags) and
   jQuery UI's non-modular build fights ESM. Do this in the §7 cleanup pass, not during parity.

Ship (1) for parity; (2) is a follow-up. The `is:inline` + `public/` route is also the only one
that keeps `theme-bootstrap.js` pre-paint.

**Wrapper elements.** Astro adds none for scripts. `<astro-island>` appears only for `client:*`
framework components ("For components with a `client:*` directive, Astro creates an
`<astro-island>` custom element with a `props` attribute",
<https://docs.astro.build/en/guides/client-side-scripts/#passing-frontmatter-variables-to-scripts>).
`<astro-slot>` likewise only appears inside hydrated islands.

### 2.9 Styles and deterministic head order

- **Scoped `<style>`** rewrites selectors and stamps elements: `h1 { color: red }` compiles to
  `h1[data-astro-cid-hhnqfkh6] { color: red }`
  (<https://docs.astro.build/en/guides/styling/#scoped-styles>). Those `data-astro-cid-*`
  attributes land on the DOM and **will show up in a DOM diff**. Avoid scoped `<style>` entirely on
  the sixteen skin pages, since every skin rule targets the canonical DOM's ids and classes.
- **`is:global`** removes the scoping ("Makes the contents of a `<style>` tag apply globally …
  This disables Astro's CSS scoping system", <https://docs.astro.build/en/reference/directives-reference/#isglobal>).
  No attributes are added. Equivalent to wrapping every selector in `:global()`.
- **Frontmatter `import '../styles/x.css'`** gets bundled and emitted as a `<link>` (or inlined
  `<style>` if under 4 kB, see `build.inlineStylesheets`). Astro places those tags in the injected
  head block, so **you do not control their position relative to your hand-written tags**.
- **Hand-written `<link rel="stylesheet" href="/css/styles.css">`** is left exactly as authored,
  in place, and is the lowest-precedence layer: "Style sheets loaded via link tags are evaluated in
  order, before any other styles in an Astro file"
  (<https://docs.astro.build/en/guides/styling/#link-tags>).

**Where Astro's injected head content goes.** From
[`runtime/server/render/head.ts`](https://github.com/withastro/astro/blob/main/packages/astro/src/runtime/server/render/head.ts):

```ts
// Order styles -> links -> scripts similar to src/content/runtime.ts
const sep = result.compressHTML === true || result.compressHTML === 'jsx' ? '' : '\n';
content += styles.join(sep) + links.join(sep) + scripts.join(sep);
```

Elements are deduplicated by a key-order-independent stringification of their props plus children,
so identical tags emitted twice collapse to one. The exact *insertion point* is wherever the
compiler places its `renderHead()` call, which is conventionally immediately before `</head>`;
I did not find that stated in the docs or confirm it in `@astrojs/compiler-rs`. **Unverified,
confirm in the first build.**

**Recipe for exact head parity.** Keep all four of today's stylesheets as hand-written `<link>`
tags in the layout, in the current order:

```astro
<!-- src/layouts/CanonicalHead.astro (excerpt) -->
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/boxicons@2.0.9/css/boxicons.min.css">
<link rel="stylesheet" href="/css/styles.css">
<link rel="stylesheet" href="/css/mobile-styles.css">
<link rel="stylesheet" href="/css/featured-carousel.css">
<link rel="stylesheet" href="/css/theme-cycler.css">
<script is:inline src="/js/theme-bootstrap.js"></script>
```

with `css/` and `js/` living in `public/`. Zero frontmatter CSS imports means zero Astro-injected
`<link>` tags, so the injected block is empty and head order is exactly what you typed.
`theme-base.css` and the skin sheet are appended at runtime by `theme-bootstrap.js` today; on a
prerendered themed path you can instead emit them as literal `<link>` tags in the right position,
which removes the runtime append and keeps the cascade order identical.

### 2.10 Injection inventory for DOM parity

| Thing | Injected? | Control |
|---|---|---|
| `<!DOCTYPE html>` | **Yes**, into any `src/pages/` component. "A page must produce a full HTML document. If not explicitly included, Astro will add the necessary `<!DOCTYPE html>` declaration and `<head>` content to any `.astro` component located within `src/pages/` by default." (<https://docs.astro.build/en/basics/astro-pages/>) | `export const partial = true` opts out (fragments only). Just author the doctype yourself; it is idempotent. |
| `<meta name="generator">` | **No.** `Astro.generator` "is a convenient way to add a `<meta name="generator">` tag" (<https://docs.astro.build/en/reference/api-reference/#generator>), and the styling guide's page example writes it by hand. It only exists if you copy it from a starter template. | Do not write it. |
| Bundled `<link rel="stylesheet">` / `<style>` | Only if you import CSS in frontmatter, use `<style>`, or a dependency does. Emitted in the head block, styles then links then scripts. | Use hand-written `<link>` only; set `build.inlineStylesheets: 'never'` as a belt. |
| `<script type="module">` for processed scripts | Rendered **in place**, not hoisted (Astro 5+). | `is:inline` for verbatim. |
| View-transitions client script | Only with `<ClientRouter />`. "By default, every page will use regular, full-page, browser navigation. You must opt in." (<https://docs.astro.build/en/guides/view-transitions/>) | Do not import it. |
| `<astro-island>` / `<astro-slot>` | Only with `client:*` islands. | No islands needed (§13). |
| `data-astro-cid-*` attributes | Only from scoped `<style>`. | `is:global`, or no `<style>` at all. |
| Whitespace normalization | **Yes, aggressively, by default in v7.** `compressHTML: 'jsx'` collapses whitespace and line breaks between elements. | **`compressHTML: false`** preserves all whitespace. |
| HTML "correction" (tag reordering, auto-closing) | **No longer**, as of v7's Rust compiler, which passes invalid markup through and errors on unclosed tags. | Fix any invalid nesting the old site relied on. |
| CSS serialization | Rust compiler may rewrite `rebeccapurple` → `#639` and add/remove quotes in `url()`. Cosmetic. "unless you have tests or tools that rely on exact CSS string matching" (<https://docs.astro.build/en/guides/upgrade-to/v7/#css-output-differences>) | Only applies to CSS Astro processes. `public/` CSS is untouched. |
| Attribute order, boolean attributes, self-closing tags, entity handling | **Not documented anywhere.** | **Unverified.** Normalize these in the DOM-diff harness rather than trying to control them; parse both sides and compare trees, not strings. Source of truth if you need it: `@astrojs/compiler-rs` and `packages/astro/src/runtime/server/render/` in <https://github.com/withastro/astro>. |

Practical consequence: **do not attempt a byte diff.** Parse both sides and compare normalized DOM
trees (tag, sorted attributes, collapsed text). §3.2 already says byte-identical is not required.

### 2.11 Modes, the draft gate, integrations, sitemap

**Env** (<https://docs.astro.build/en/guides/environment-variables/>):

- `import.meta.env.MODE` is `"development"` for `astro dev`, `"production"` for `astro build`;
  `PROD`/`DEV` are the booleans; `BASE_URL` and `SITE` mirror the config.
- `.env`, `.env.production`, `.env.development`, `.env.<mode>` are loaded from the project root.
- `astro build --mode <string>` (since v5.0.0) sets the mode
  (<https://docs.astro.build/en/reference/cli-reference/#--mode-string>).
- Only `PUBLIC_`-prefixed vars reach client code.
- `astro:env` with `envField.*` gives a typed schema; invalid values error at build. Overkill here,
  a single `import.meta.env.MODE` check in the schema is enough.

So the draft toggle is: `npm run build` (mode `production`, drafts fatal) versus
`astro build --mode preview` (drafts rendered, marked red). The `superRefine` in 2.2 keys off
`import.meta.env.MODE !== 'production'`.

**Integration hooks** (<https://docs.astro.build/en/reference/integrations-reference/>):
`astro:config:setup`, `astro:route:setup`, `astro:routes:resolved`, `astro:config:done`,
`astro:server:setup`, `astro:server:start`, `astro:server:done`, `astro:build:start`,
`astro:build:setup`, `astro:build:ssr`, `astro:build:generated`, `astro:build:done`.

- **Failing the build from a hook is not documented.** The reference documents
  `AstroIntegrationLogger` (`info` / `warn` / `error` / `debug`) but gives no guarantee that
  `logger.error()` halts anything. Throwing from a hook does abort the build in practice, but that
  is **unverified against the docs**. Since the zod schema *is* documented to fail the build, put
  the draft gate in the schema and use hooks only for extras.
- **Writing files at build** is documented: `astro:build:done` receives `dir: URL`, and the docs
  show `writeFile(fileURLToPath(new URL('./x.json', dir)), …)`. Use this for anything the sitemap
  integration cannot express.
- `injectRoute({ pattern, entrypoint })`, `updateConfig()`, `addWatchFile()` are available in
  `astro:config:setup`. `injectRoute` is an alternative to the `[...theme]` file layout if you
  would rather generate the theme routes programmatically; the file layout is simpler.

**`@astrojs/sitemap` 3.7.4** (<https://docs.astro.build/en/guides/integrations-guide/sitemap/>).
`site` is required. Options: `filter((page: string) => boolean)`, `customPages: string[]`,
`customSitemaps`, `entryLimit` (45000), `changefreq`, `lastmod: Date`, `priority`,
`serialize((item) => item | undefined)`, `i18n`, `xslURL`, `namespaces`, `filenameBase`.

Excluding themed prefixes and setting per-page lastmod:

```js
import { THEME_IDS } from './src/lib/themes.mjs';

sitemap({
  // keep only the default (un-prefixed) theme's pages
  filter: (page) => !THEME_IDS.some((id) => new URL(page).pathname.startsWith(`/${id}/`)),
  serialize(item) {
    item.lastmod = lastmodFor(item.url);   // e.g. post frontmatter date
    return item;                            // return undefined to drop the entry
  },
})
```

`filter` and `serialize` are both documented with those exact signatures; `serialize` returning
`undefined` drops the page, which makes `filter` and `serialize` interchangeable for exclusion.
Note `lastmod` at the top level is site-wide; per-page lastmod goes through `serialize`.

This pairs with §4.5's "themed paths carry canonical links to the default and are noindex": emit
`<link rel="canonical" href={defaultUrl}>` and `<meta name="robots" content="noindex">` in the
layout when `theme !== undefined`, and drop those pages from the sitemap with `filter`.

### 2.12 Dev and preview servers

- `server.host` defaults to **`false`**: "`false` - do not expose on a network IP address"
  (<https://docs.astro.build/en/reference/configuration-reference/#serverhost>). Localhost only
  unless `--host` is passed. This satisfies the owner's network-privacy rule with no extra config.
- `server.port` defaults to **4321**, and "If the given port is already in use, Astro will
  automatically try the next available port."
- `--host` (no value) listens on all addresses including LAN and public; `--host <addr>` binds one
  IP. The docs carry the warning: "Do not use the `--host` flag to expose the dev server and
  preview server in a production environment."
  (<https://docs.astro.build/en/reference/cli-reference/#--host-optional-host-address>)
- `astro preview` serves the build "to catch any errors in your build output before deploying it.
  It is not designed to be run in production."
  (<https://docs.astro.build/en/reference/cli-reference/#astro-preview>)

**Does `astro preview` match GitHub Pages routing?** Not guaranteed. The docs say only that it is
for local preview and not production. `trailingSlash` behavior in particular is explicitly
host-dependent for prerendered pages: "Trailing slashes on prerendered pages are handled by the
hosting platform, and may not respect your chosen configuration." **Unverified** whether preview's
404 handling matches Pages. For the parity harness, serve `dist/` with a plain static server rather
than `astro preview`, so both sides of the diff (old `main` worktree and new `dist/`) are served by
the same semantics. That also avoids a long-running Astro process, per the owner's server rule.

### 2.13 Islands

`client:load`, `client:idle`, `client:visible`, `client:media`, `client:only` all exist and are
documented at <https://docs.astro.build/en/reference/directives-reference/#client-directives>.
Adding a React island later means installing `@astrojs/react` and adding it to `integrations`.
Nothing in this migration needs one, and every `client:*` directive introduces an
`<astro-island>` wrapper element, so none should be used on the sixteen skin pages.

### 2.14 Assets, `Astro.url`, `import.meta.glob`

- **`Astro.url`** is "A normalized URL object derived from the current `request.url`". On
  prerendered pages it excludes search params, and during the build it is derived from `site` and
  `base`. In dev it is a localhost URL. `Astro.url.pathname` shape follows `build.format`.
  (<https://docs.astro.build/en/reference/api-reference/#url>)
- **`Astro.site`** is `URL | undefined`, from the `site` config
  (<https://docs.astro.build/en/reference/api-reference/#site>). Use it for canonical URLs.
- **`import.meta.glob()`** is Vite's, "only supports static string literals. It does not support
  dynamic variables and string interpolation", and patterns must be relative
  (<https://docs.astro.build/en/guides/imports/#importmetaglob>). So you *cannot* write
  ``import.meta.glob(`../themes/${id}/*.css`)``. For theme-owned assets, use one static glob over
  all themes plus a lookup by key, or a plain static import inside each theme's own layout, which
  is what actually gives per-theme chunking anyway.
- **`public/` vs `<Image />`.** `public/` files are "always served or copied as-is, without
  transform or bundling"
  (<https://docs.astro.build/en/reference/configuration-reference/#publicdir>). `<Image />` from
  `astro:assets` optimizes, converts format, and rewrites the tag. For parity, keep every existing
  image in `public/resources/` and use plain `<img>`. `<Image />` is a §7 cleanup item, not a
  migration item.

---

## 3. Open questions and risks

1. **Astro 7's whitespace default is the single biggest parity risk.** `compressHTML: false` is the
   answer, but it is a *global* setting and it also changes the separator in Astro's injected head
   block (`'\n'` instead of `''`). Verify visually on the busiest skin (marquee, whose tickers use
   CSS `content:` strings) before trusting the diff.
2. **Node 25 is unsupported by Astro.** Resolve this with the owner before the spec is written: it
   affects `.nvmrc`, the Actions workflow, and any "works on my machine" report.
3. **The Rust compiler will reject invalid HTML the current site may contain.** Nobody has run
   today's markup through it. Cheap de-risking: a one-hour spike that ports `index.html` verbatim
   into a single `.astro` page and builds it. That one spike also settles items 4, 5, and 6 below.
4. **Insertion point of Astro's injected head block is unverified.** Assumed to be immediately
   before `</head>`. Confirm in the spike.
5. **Fenced-code markup with `syntaxHighlight: false` under Sätteri is unverified.** Option (c) for
   highlight.js parity depends on `<code class="language-x">`. Confirm in the spike.
6. **`.nojekyll` and other dotfiles in `public/` are undocumented.** Confirm with `ls -a dist/`.
7. **`glob({ base: './blog/posts' })` outside `src/` is allowed by the type and undocumented by
   example.** Sidestep it: move posts to `src/content/blog/` as part of the migration.
8. **`lowlight` pins `highlight.js ~11.11.0`, not 11.9.0.** Either accept token drift, force an
   npm `overrides`, or keep client-side highlighting (recommended for the parity milestone).
9. **Porting rehype plugins to Astro 7 costs either `@astrojs/markdown-remark` + `unified()` (giving
   up the fast Rust pipeline) or a rewrite as a Sätteri HAST plugin** whose API I did not evaluate.
   Another reason to defer build-time highlighting past parity.
10. **Failing the build from an integration hook is undocumented.** Keep the draft gate in the zod
    schema, where the failure path *is* documented.
11. **`file()` swallows YAML read/parse errors** (`logger.error` + `return`), yielding an empty
    collection instead of a failed build. If a malformed prose file must be fatal, add an explicit
    parse-and-throw in `astro:config:setup`.
12. **Theme ids can collide with page names** (`blog`, `privacy`, `lexchat`, `subsites`, `404`).
    Guard with `prerenderConflictBehavior: 'error'` plus a reserved-id assertion in the registry.
13. **Per-page JS chunking is inferred, not documented.** Add one grep assertion to the parity
    harness so §3.3 is enforced rather than assumed.
14. **`astro preview` routing may not match GitHub Pages.** Use a plain static server for both
    sides of the parity harness.
15. **Not investigated:** MDX (`@astrojs/mdx`) in Astro 7, the Sätteri plugin API,
    `@astrojs/markdown-satteri`'s `features` options, and `astro:assets` behavior for
    theme-owned GLB/GLTF and video (§6 will need the last one).
