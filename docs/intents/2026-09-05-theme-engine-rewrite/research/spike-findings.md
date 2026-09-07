# T0 spike findings, Astro 7.3.1 on this markup (S1-01)

Environment: macOS 25.6.0, **Node v25.9.0**, npm 11.12.1, Python 3.9.6.
Repo: `/Users/dawsonamf/Desktop/dax/personal-website`, branch `engine-rewrite`.
Baseline (read-only): `/Users/dawsonamf/Desktop/dax/personal-website-old` @ `0f196d0`.

All eleven items were executed. Reproducible suite:
`node --test --test-concurrency=1 tests/build/astro-compatibility.test.ts`, **13 tests, 13 pass,
0 fail** (a to k, with two subtests for e, plus a browser-cache guard). Same result via
`npm run test:build`, and again after `npm ci`.

---

## 0. Environment deviations and install record

### Node 24 vs Node 25 (deviation, recorded per D1)

`.nvmrc` is `24`, the CI contract. Node 24 is **not installed** on this machine and no version
manager (nvm/fnm/volta) is present, so **every command in this document ran on Node v25.9.0**.
No Node version was installed.

Astro does not refuse Node 25. `astro@7.3.1`'s `engines` is `{"node": ">=22.12.0", ...}` with no
upper bound, so npm emitted no engine warning, and both the root scaffold build and every fixture
build completed. Astro's install docs still say odd-numbered Node lines are unsupported, so CI must
use `.nvmrc`; local results here carry the Node 25 caveat. Nothing observed in this spike depends on
a Node-24-only behavior, and the two Node behaviors the (k) contract relies on, plain `import()` of
an `.mjs` config and native type-stripping of `.ts` specifiers, exist in both 24 and 25.

### Installs performed (the two approved commands, exit 0 each)

```
npm install --save-exact astro@7.3.1 @astrojs/sitemap@3.7.4 js-yaml@4.3.0 marked@18.0.5 \
  highlight.js@11.9.0 jquery@3.6.0 jquery-ui-dist@1.12.1 aos@2.3.1 vanilla-tilt@1.7.0 \
  gsap@3.9.1 @fortawesome/fontawesome-free@6.5.1
→ exit 0, added 210 packages, audited 211

PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1 npm install --save-dev --save-exact \
  @playwright/test@1.61.1 @astrojs/check@0.9.10 typescript@5.8.3
→ exit 0, added 81 packages, audited 292
```

No engine warnings, no peer-dependency warnings, no deprecation notices, no postinstall prompts.
`package-lock.json` written (189 740 bytes). Verbatim `npm ls --depth=0`:

```
dawsonamf-website@ /Users/dawsonamf/Desktop/dax/personal-website
├── @astrojs/check@0.9.10
├── @astrojs/sitemap@3.7.4
├── @emnapi/core@1.11.3 extraneous
├── @emnapi/runtime@1.11.3 extraneous
├── @emnapi/wasi-threads@1.2.3 extraneous
├── @fortawesome/fontawesome-free@6.5.1
├── @img/sharp-wasm32@0.35.4 extraneous
├── @napi-rs/wasm-runtime@1.2.3 extraneous
├── @playwright/test@1.61.1
├── @tybys/wasm-util@0.10.3 extraneous
├── ajv-draft-04 2@ extraneous
├── aos@2.3.1
├── astro@7.3.1
├── gsap@3.9.1
├── highlight.js@11.9.0
├── jquery-ui-dist@1.12.1
├── jquery@3.6.0
├── js-yaml@4.3.0
├── marked@18.0.5
├── tslib@2.8.1 extraneous
├── typescript@5.8.3
└── vanilla-tilt@1.7.0
```

Every pin is exact. The `extraneous` rows are sharp's wasm-fallback optional dependencies plus
`tslib`, all recorded in the lockfile's optional tree and harmless. `ajv-draft-04 2` is an **empty
directory with a space in its name** that pre-exists inside `node_modules`, a filesystem duplicate
artifact rather than a package; it was left alone. The extraneous count is therefore not a stable
number and should not be asserted anywhere.

**Open item for the owner, not actionable by this ticket:** `npm audit` reports one high-severity
advisory against the pinned `js-yaml@4.3.0` (GHSA-5p4m-2wfm-xmqj, quadratic CPU in `!!omap`
resolution, fixed in 4.3.2, outside the pin). The pin was not changed. js-yaml is build-time only
and parses repo-owned YAML, so the exposure is nil in this use, but the pin table should be
revisited.

**Second open item, `@types/node`.** `tests/build/astro-compatibility.test.ts` uses
`import.meta.dirname`, `process` and the `node:*` modules. Their typings currently come from
`@types/node@24.13.3`, which is present only as a **transitive** dependency of the installed tree.
Nothing declares it directly, so a future dependency change can remove it and break the type-check
without touching this file. Adding `@types/node` as a devDependency is a new install and needs owner
approval, so it is flagged here rather than fixed. S1-08 must resolve this before wiring a
type-check script that covers `tests/`.

### Browser cache

`~/Library/Caches/ms-playwright` before and after everything (installs, all builds, all Playwright
runs, `npm ci`): identical, `.links`, `chromium-1228`, `chromium_headless_shell-1228`,
`ffmpeg-1011`. **No browser download occurred.** `chromium.executablePath()` resolves inside
`chromium-1228` (the full Chromium build), which is what the suite asserts. Headless launches use
`chromium_headless_shell-1228` at runtime, but that is not asserted here because
`executablePath()` does not report it.

`PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1` was belt-and-braces: neither `playwright` nor
`@playwright/test` 1.61.1 declares an install script, so an `npm install` never downloads a browser
on its own. Only an explicit `npx playwright install` does, and that was never run.

### Astro CLI entrypoint

`node node_modules/astro/astro.js` does **not exist** in Astro 7. The bin is
`node_modules/astro/bin/astro.mjs` (`package.json#bin.astro`), equivalently
`./node_modules/.bin/astro`. Every command below uses that path.

### Root scaffold smoke (no `src/`)

```
node node_modules/astro/bin/astro.mjs build      → exit 0
[WARN] Missing pages directory: src/pages   (×2)
generating static routes: /12years/index.html, /embedded-swift-agent/index.html
[WARN] [@astrojs/sitemap] No pages found! `sitemap-index.xml` not created.
0 page(s) built
```

Astro accepts a page-less root: it still emits the two `redirects` stubs, and the sitemap
integration warns and emits nothing. `dist/` was removed afterwards; there is no `src/` at the repo
root after this ticket.

---

## a) Compiler strictness on today's markup

**Question.** Does `@astrojs/compiler-rs` accept `index.html` once ported into an `.astro` page, and
is the rendered DOM preserved?

**Method.** `tests/fixtures/astro-compatibility/site/src/pages/[...theme]/index.astro` is the
baseline `index.html` (20 189 bytes) copied verbatim with exactly three mechanical edits, verified by
`diff` against the baseline: an `.astro` frontmatter block prepended (`getStaticPaths` plus the
`Recorder` import), `is:inline` added to all 15 `<script>` tags, and `<Recorder />` inserted
**immediately after `<body>` on the same line** so it contributes no whitespace of its own.

DOM equality is proven by applying the two known source-level transformations to the **baseline
file**, writing the result to a temporary file, and then parsing **both** that file and the built
page with the same browser: Playwright chromium, **JavaScript disabled**
(`browser.newContext({ javaScriptEnabled: false })`), all non-loopback requests aborted via
`context.route`, compared on `document.documentElement.outerHTML`. Transforming the source rather
than the DOM dump means the comparison itself is exact equality with no dump-level normalization.

**Result, exit 0, no repairs needed.** The compiler accepted the markup on the first build. There
were **zero syntax repairs**: no unclosed tag, no attribute, no entity and no text content required
changing. The baseline has no `{` or `}` anywhere, so no expression escaping was needed either.

The two source-level differences are:

1. **All whitespace after `</script>` is dropped.** The compiler removes the whitespace-only text
   node that directly follows **every** `<script>` element, including the last one before `</body>`.
   The home page has **15** such runs: 14 in `<head>` and 1 in `<body>`. `<style is:inline>` is
   **not** affected: a minimal probe showed `<style>a{color:red}</style>\n  <meta>` keeps its
   newline while `<script>var q=1;</script>\n  <meta>` loses it.
2. **No trailing newline.** Astro emits no `\n` after `</html>`, exactly one character.

The test asserts the first fires exactly 15 times and the second removes exactly 1 character, then
asserts the two parsed DOMs are strictly equal. Any other divergence fails. Everything else is
byte-identical, including `&nbsp;`, smart quotes, `<br><br>`, inline `style=` attributes and
comments.

Two further raw-file differences vanish in a parsed DOM and are recorded for the harness's benefit:
multi-line start tags are collapsed to single spaces between attributes (five `data-aos` blocks),
and the file has no final newline. Neither is a DOM node.

**Implementation path.** Port rule for T4/T5/T6: every `<script>` in a canonical layout is
`is:inline`; no component `<style>` in the canonical family (§6.2 already requires this).
**S1-02 must know:** a raw-text DOM dump of an unmodified baseline page will differ from the Astro
output by exactly those two rules. **The whitespace rule is unconditional after every `</script>`**;
do not encode a special case for the last script before `</body>`. Either the dump normalizer
accounts for both rules or the §15 exception table records them. Both are invisible to rendering and
to screenshots.

## b) Head injection

**Question.** Does Astro inject anything into `<head>` for a page with no component `<style>` and no
bundled `<script>`, and where would an injection land?

**Method.** Compare the built home's `<head>` byte-for-byte against the authored head with the
whitespace rule applied. Separately, `src/pages/injection-probe/index.astro` deliberately carries a
scoped component `<style>` and a `<script>` that imports `vanilla-tilt`, a real dependency, so the
bundler cannot tree-shake or inline it, plus a marker `<meta>` as the last authored head node.

**Result.**

*Ported home:* the built `<head>` is byte-identical to the authored head under the whitespace rule.
**Astro injected nothing**: no `<link>`, no `<style>`, no `<script>`, no `<meta name="generator">`,
no `data-astro-cid-*`. `dist/index.html` contains no `/_astro/` reference at all. §6.2's premise
holds.

*Injection probe, exact positions:*

```html
  <meta name="probe-head-marker" content="authored-last-head-node">
<link rel="stylesheet" href="/_astro/index.BwSFhouV.css"></head>
```

- The extracted stylesheet `<link>` is the **last node in `<head>`, immediately before `</head>`**,
  after every authored head node, at column 0 with no separating whitespace. It is preceded by the
  newline that ended the last authored head line.
- The processed `<script>` is **rendered in place in the body at its authored position**, not
  hoisted into `<head>`:
  `<script type="module" src="/_astro/index.astro_astro_type_script_index_0_lang.BzuRMjD1.js"></script></body>`.
  `<head>` contains no `<script>` at all.
- The scoped `<style>` also stamped `data-astro-cid-25rxlv7b` onto `<html>`, `<body>` and `<h1>`,
  and removed the `<style>` element from the body, leaving its surrounding whitespace behind.

**Implementation path.** The canonical family gives Astro nothing to inject, so head order is
entirely author-controlled and `ThemeAssets` can be positioned exactly as §6.2's table specifies.
If a component style ever slips in, it appears as a `<link>` at the very end of `<head>`, after the
theme links, and stamps `data-astro-cid-*` on ancestors. Both are trivially detectable and worth an
assertion in `assertShellInvariants` (S1-13). The 404's `.nf-*` block must stay
`<style is:inline>` as D2 and §6.2 already require.

## c) `[...theme]` with `theme: undefined`

**Question.** Does an optional rest parameter emit the root routes?

**Method.** `src/pages/[...theme]/index.astro` and `src/pages/[...theme]/blog/index.astro`, both with
`getStaticPaths()` returning `[{ params: { theme: undefined } }, { params: { theme: 'brutalist' } }]`.

**Result, exit 0.** All four files emitted: `dist/index.html`, `dist/blog/index.html`,
`dist/brutalist/index.html`, `dist/brutalist/blog/index.html`. `params: { theme: undefined }` is the
correct spelling, not an omitted key.

**Implementation path.** `themeParams()` in `src/themes/paths.ts` (S1-04, S1-10) returns
`{ theme: undefined }` for `default` and `{ theme: id }` for the rest. Nothing else is needed for the
default-theme routes to land at the site root.

## d) `404.astro`

**Result, exit 0.** `dist/404.html` exists; `dist/404/index.html` does **not**, despite
`build.format: 'directory'` and `trailingSlash: 'always'`. `404.astro` is exempt from the directory
format, as GitHub Pages requires.

## e) Route and content-entry collisions under `prerenderConflictBehavior: 'error'`

Two separate negative cases, both mutations applied to isolated temporary copies.

### e1, route collision

**Method.** `tests/fixtures/astro-compatibility/variants/collision-index.astro` dropped in as
`src/pages/index.astro`, a static route emitting `/`, which `[...theme]/index.astro` already emits
for `theme: undefined`.

**Result, exit 1.**

```
[PrerenderRouteConflict] Could not render `` from route `/[...theme]` as it conflicts with
higher priority route `/`.
  Hint: Ensure `/[...theme]` and `/` don't generate the same static paths.
  https://docs.astro.build/en/reference/errors/prerender-route-conflict/
```

Raised at generate time (`core/build/generate.js:109`), so route priority does **not** silently
shadow the duplicate: `'error'` turns it into a build failure as D2 intends.

### e2, duplicate content-entry ids

**Method.** `variants/duplicate-entry-ids.content.config.ts` (a `file()` collection over
`variants/duplicate-entry-ids.json`, whose two array items share `"id": "same-id"`) copied over
`src/content.config.ts`, with the JSON copied into `src/content/`.

**Result, exit 1.**

```
[DuplicateContentEntrySlugError] dupes contains multiple entries with the same slug: `same-id`. Slugs must be unique.

Entries:
- ./src/content/duplicate-entry-ids.json
- ./src/content/duplicate-entry-ids.json
```

**D2's second claim is confirmed.** `prerenderConflictBehavior` **does** gate this branch:
`node_modules/astro/dist/content/loaders/file.js` around line 65 throws
`AstroError(DuplicateContentEntrySlugError)` only when
`config.prerenderConflictBehavior === "error"`, warns when it is `'warn'`, and is silent under
`'ignore'`. The `glob()` loader carries the identical gated branch. The Astro default is `'warn'`,
so without D2's setting a duplicate id would have been a log line, not a failure.

**Implementation path.** The 192-route build is protected on both axes. The realistic route
collision to guard against is a theme id equal to a top-level page segment (`blog`, `privacy`,
`lexchat`, `post`, `subsites`, `404`, `_astro`); S1-04's registry should keep those out of
`THEME_IDS`, with this check as the backstop rather than the primary defence. The entry-id gate
covers S1-06's single-entry `file()` prose load and S1-07's post sources.

## f) Throwing `astro:build:done` hook

**Method.** `SPIKE_BUILD_DONE_THROW=1` makes the fixture's checks integration throw from its
`astro:build:done` hook, one line, no separate fixture tree.

**Result, exit 1.** `[ERROR] [spike-checks] An unhandled error occurred while running the
"astro:build:done" hook` followed by the message. Confirmed independently: the first real (k) failure
also exited 1 with a stack through `runHookBuildDone` then `AstroBuilder.run`.

**Implementation path.** D39's `checks.ts` can fail the build by throwing. `dist/` is already
written when `astro:build:done` runs, so a failed check leaves a complete-looking `dist/` behind.
S1-08 and the deploy workflow must gate on the exit code, never on `dist/` existing.

## g) Post rendering through marked, not Astro's pipeline

**Method.** `src/content.config.ts` defines a `posts` collection with
`glob({ pattern: '**/*.md', base: './src/content/posts', deferRender: true })`.
`src/pages/post/index.astro` reads `entry.body`, the raw Markdown, and passes it through
`src/prose/markdown.ts`: marked 18.0.5 with `gfm: true, breaks: false` and the three renderer
overrides copied from `blog/blog-post.js:4-32`, plus `highlight.js/lib/common`. Injected with
`set:html`. `render()` is never called. The fixture post has a `js` fence, a `mermaid` fence, an
http link and an image.

**Result, exit 0.** Output is marked's markup exactly:

- `<pre><code class="hljs language-js">` with hljs `<span class="hljs-...">` spans
- `<div class="mermaid">graph TD; A-->B;</div>`
- `<a href="https://example.com/thing" class="text-link" target="_blank" rel="noopener noreferrer">`
- `<img src="/resources/spike.jpg" alt="a picture" class="blog-image">`

Zero occurrences of `astro-code`, `data-language` or `<pre class="astro-code`. `set:html` on an
element adds no wrapper.

**The mermaid body is NOT entity-escaped.** The observed output is the literal
`<div class="mermaid">graph TD; A-->B;</div>`, with a raw `-->`, because marked's `code` override
interpolates `${text}` directly, exactly as `blog/blog-post.js` does today. S1-05 and S1-07 must
preserve that: escaping the arrow would break both parity and mermaid's own parser.

**`deferRender: true` is required, and the earlier draft of this document overclaimed here.**
`glob()` does **not** leave Markdown alone by default. `node_modules/astro/dist/content/loaders/glob.js`
(around lines 128 to 153) runs `entryType.getRenderFunction(config)` over every matched `.md` during
content sync **unless `globOptions.deferRender` is set**, and a failure inside that render is
reported with `logger.error(...)`, not thrown, so it would never fail a build. The rendered output
is stored on the entry but is not what this fixture consumes. Setting `deferRender: true` takes
Astro's Markdown pipeline out of the picture entirely. Confirmed present in
`glob.d.ts:32` for 7.3.1, and `entry.body` is still populated with it, because `body` is stored
unless `retainBody === false` and `retainBody` defaults to `true` (`glob.js`, both branches).

**Implementation path.** D6 works as specified. **S1-07 must pass `deferRender: true`** on the posts
collection's `glob()` options, alongside the default `retainBody`. S1-07's reader and S1-19's post
layout use `entry.body` plus one shared `markdown.ts`; `markdown: { syntaxHighlight: false }` in the
config remains belt-and-braces. Marked 18 overrides must use the object-argument renderer signature
(`link({ href, title, tokens })`) with `this.parser.parseInline(tokens)`, as today's file already
does; typing them with marked's exported `RendererObject` and `Tokens.*` gives `this` the right type
without any `any`.

## h) Redirect stubs

**Method.** `redirects: { '/12years/': '/subsites/elise/12years/' }` in the fixture config.

**Result, exit 0.** `dist/12years/index.html`, 395 bytes:

```html
<!doctype html>
<title>Redirecting to: /subsites/elise/12years/</title>
<meta http-equiv="refresh" content="0;url=/subsites/elise/12years/">
<meta name="robots" content="noindex">
<link rel="canonical" href="https://www.dawsonamf.com/subsites/elise/12years/">
<body>
	<a href="/subsites/elise/12years/">Redirecting from <code>/12years/</code> to <code>/subsites/elise/12years/</code></a>
</body>
```

Note the lowercase `<!doctype html>`, the tab-indented body link, the `noindex`, and a `canonical`
built from `site`. The stub is **not** an Astro page route, so it never reaches
`astro:build:done`'s `pages[]` (consistent with D39) and never reaches the sitemap.

**Implementation path.** The two subsite `redirects` entries are **already present in the root
`astro.config.mjs`**, written by this ticket; the block is not an omission. S1-22 verifies those two
and does not re-add them. The **external-post redirect stubs are S1-20's**, added alongside its
sitemap work. Every stub gets exactly this shape. The `noindex` meta means the sitemap `filter` does
not strictly need to exclude stubs, but D24 still should.

## i) `public/` verbatim copy

**Method.** The real baseline `embedded-swift-agent/agent.js` (9 337 bytes) copied to
`public/subsites/dawson/embedded-swift-agent/agent.js`, three levels deep, plus
`public/nested/deep/plain.txt` containing a tab and trailing spaces.

**Result, exit 0.** Both files are **byte-identical** (`Buffer.equals`) to their sources in `dist/`.
Nested directory structure preserved. The bare `+esm` CDN specifier is present unchanged in the
built file:

```js
} from "https://cdn.jsdelivr.net/npm/@bjorn3/browser_wasi_shim@0.4.2/+esm";
```

It was not rewritten, resolved, bundled or flagged. `public/` is a pure file copy with no transform.

**Implementation path.** D18's plan to move `css/`, `js/`, `resources/`, `blog/*.css` and the
subsites into `public/` is safe; S1-09's vendored copies and the subsite JS ship untouched.

## j) Loopback Python server plus cached Chromium 1228

**Method.** After the positive build,
`python3 -m http.server --bind 127.0.0.1 <port> --directory <dist>`. The port is chosen by binding a
Node `net` server to port 0 on 127.0.0.1, reading the assigned port and closing it. Readiness by
polling `fetch`, 100 attempts at 50 ms. Page opened with headless `chromium` from
`@playwright/test`, with all non-loopback requests aborted via `page.route` so the run is hermetic
and never reaches cdnjs, jsdelivr, unpkg or Calendly. Server killed with `SIGTERM` in a `finally`
and awaited to exit; the wait also resolves on a spawn `error`, so a missing `python3` cannot hang
the suite.

**Result, exit 0.** Server bound loopback-only and served `dist/`. `<title>` is
`Dawson Metzger-Fleetwood` and `#typing-container #typing-text` resolves to exactly one element.
`chromium.executablePath()` matched `ms-playwright/chromium-1228/`. The cache directory listing is
identical before and after the whole test file: **no download**. No listener survives the run.

**Implementation path.** S1-02's harness can use the same pattern. Nothing about the pinned
Playwright wants a download as long as the cache is already populated and no
`npx playwright install` runs. The harness's fixed ports 8781 and 8782 (D20) cannot collide with the
ephemeral port this test picks, since the ephemeral range starts well above them.

## k) One accessor instance across components and the checks integration

**Question, the load-bearing one.** Does the module the `astro:build:done` hook imports have the same
instance as the one page components import, without a `globalThis` side channel?

**Method.** `src/prose/index.ts` exports a module-scope `const unwrittenSizes = new Set<string>()`
and `record(key)`. `src/components/Recorder.astro`, rendered by the home page, calls
`record('spike:home.about.body:xs')`. `astro.config.mjs` imports `./src/build/checks.ts`, which
imports `../prose/index.ts` and asserts the record is present in `astro:build:done`, logging the set
size.

**Result, default arrangement: FAILS, exit 1.**

```
[spike-checks] unwrittenSizes.size=0 entries=[]
[ERROR] [spike-checks] An unhandled error occurred while running the "astro:build:done" hook
SPIKE_K_FAIL: checks integration does not share the accessor instance. Expected
"spike:home.about.body:xs"; set has 0 entries.
```

Two instances, exactly as feared: the config side is in Node's module cache, the page side is inlined
into the Vite SSR chunk.

**Result, working arrangement: PASSES, exit 0.**

```
[spike-checks] unwrittenSizes.size=1 entries=["spike:home.about.body:xs"]
[spike-checks] SPIKE_K_OK: shared module instance confirmed.
```

### The arrangement, verbatim (this is the contract S1-05 and S1-08 implement)

Three facts make it work, all verified against the installed Astro source:

1. **The config side is plain Node.** `node_modules/astro/dist/core/config/vite-load.js` tries
   `await import(pathToFileURL(configPath) + '?t=' + Date.now())` first for any `.[cm]?js` config,
   and only falls back to a minimal Vite dev server if that throws. So `astro.config.mjs` and
   everything it imports load through Node's own ESM loader. Node type-strips
   `./src/build/checks.ts` and its `../prose/index.ts` import natively; the cache-busting `?t=`
   query applies only to the config module itself, not its dependencies, so
   `file:///.../src/prose/index.ts` is the cache key.
2. **Prerendering runs in the same process.** `node_modules/astro/dist/core/build/default-prerenderer.js:19`
   does `const prerenderEntry = await import(prerenderEntryUrl.toString())`, a native in-process
   import of the generated prerender entry, so a server chunk that imports a file by path at
   prerender time hits Node's already-populated module cache.
3. **The module must be external to the SSR bundle, with its id rewritten.** This is the fixture's
   `astro.config.mjs`, quoted verbatim:

   ```js
   const proseModule = fileURLToPath(new URL('./src/prose/index.ts', import.meta.url));
   const proseUrl = pathToFileURL(proseModule).href;

   const externalProse = {
     name: 'spike-external-prose',
     enforce: 'pre',
     async resolveId(source, importer) {
       if (!importer) return null;
       const resolved = await this.resolve(source, importer, { skipSelf: true });
       if (resolved && resolved.id.split('?')[0] === proseModule) {
         return { id: proseUrl, external: true };
       }
       return null;
     },
   };

   export default defineConfig({ /* ... */ vite: { plugins: [externalProse] } });
   ```

   **Why `resolveId` and not `build.rollupOptions.external`.** Marking the module external is
   necessary but not sufficient. A plain external keeps the **authored specifier**, and the authored
   specifier is relative (`../prose/index.ts`), which cannot resolve from the temporary server-chunk
   directory the SSR build emits into. The id has to be rewritten to the absolute `file://` URL,
   which is exactly the key Node already holds, and `resolveId` is the hook that can both rewrite the
   id and set `external: true`.

   **Why matching is on the resolved id.** Matching the authored string (for example
   `source.startsWith('.')` plus an exact path compare) misses extensionless, root-absolute and
   aliased specifiers, and Vite runs `alias` before `pre` plugins, so an aliased import bypasses the
   plugin entirely and gets bundled. `this.resolve(source, importer, { skipSelf: true })` catches
   every form.

### The failure mode is silent, so a positive sentinel is REQUIRED

If the externalization ever stops matching, the config side simply sees an **empty** set. D39's
`assertNoUnwrittenSizes` then passes **vacuously**: the build goes green while the entire unwritten-size
gate is dead. Nothing in the current arrangement detects that.

**Requirement for S1-05 and S1-08.** The pure accessor module must also export a module-scope
**touch counter**, incremented by every accessor call (`get`, `text`, `list`, `paragraphs`, `has`),
and `src/build/checks.ts` must assert `touches > 0` **before** calling `assertNoUnwrittenSizes`,
failing with a message that names the externalization as the likely cause. That is the permanent
positive sentinel: it fails loudly on duplication instead of passing quietly.

It also catches a second silent path. `vite-load.js` lines 16 to 21 **swallow** a throwing Node
`import()` of the config (`debug('Failed to load config with Node', e)`) and fall back to Vite's
loader, so a single non-erasable TypeScript construct in `checks.ts` or `prose/index.ts` surfaces not
as a syntax error but as a duplicated module instance.

### What did NOT work

- **`vite.build.rollupOptions.external` as a function.** Build failed, exit 1:
  `Warning: Invalid input options (1 issue found) - For the "external.0". Invalid type: Expected (string | RegExp) but received Function.`
  Note the diagnostic path `external.0`: rolldown's own `ExternalOption` **does** accept a bare
  function (`type ExternalOption = StringOrRegExp | StringOrRegExp[] | ExternalOptionFunction`, in
  `node_modules/rolldown/dist/shared/define-config-*.d.mts`), but Vite normalizes the option into an
  array before handing it over, so the function arrives as `external[0]`, where only
  `string | RegExp` is valid. A plain string would not have matched either, for the specifier reason
  above.
- **The default arrangement**, no externalization at all: two instances, as quoted above.
- `globalThis` was **not** used and is not needed.

### Spec amendment this creates

**Spec 1 §3.2's `astro.config.mjs` has no `vite` block.** It needs one. S1-08 must add
`vite: { plugins: [<the resolveId externalization above>] }` when it wires `prose()` and `checks()`.
The root `astro.config.mjs` written by this ticket carries a comment marking that addition. This is
recorded here as a spec amendment for the orchestrator.

### Constraints downstream code must respect

- `src/prose/index.ts`, and anything on its import path reached from the config, is loaded by **Node
  directly**, so it must use **erasable TypeScript only**: no `enum`, no `namespace`, no parameter
  properties, no decorators; `import type` for type-only imports; and relative imports must carry the
  explicit `.ts` extension. `astro/tsconfigs/base.json` already sets `allowImportingTsExtensions: true`
  and `verbatimModuleSyntax: true`, so this typechecks. Type-only imports of `AstroIntegration`,
  `HookParameters` and marked's `RendererObject` are fully erased and therefore safe.
- The externalized module must stay **pure**: no `astro:*` imports, no Vite-only features, no
  virtual modules, because Node loads it without any of Vite's resolution.
- Per cross-ticket contract 3, `src/prose/index.ts` owns `createProseAccess` and `unwrittenSizes`;
  `src/prose/site.ts` binds shared prose. **Only `src/prose/index.ts` needs to be external.** The
  bound `site.ts` and every component may stay in the bundle, because they reach the accumulator
  through the one external module.
- The plugin is registered for every Vite environment. The client bundle never imports the accessor,
  so this is harmless; if a client bundle ever did, an external `file://` import would break in the
  browser. S1-13 could add an `applyToEnvironment` guard if that risk becomes real.

---

## Files created and modified by this ticket

Created: `.nvmrc`, `package.json`, `package-lock.json`, `tsconfig.json`, `astro.config.mjs`,
`tests/build/astro-compatibility.test.ts`, `tests/fixtures/astro-compatibility/**`, this file.
Modified: `.gitignore`.

`astro.config.mjs` is Spec 1 §3.2 exactly, minus the four imports of modules later tickets create and
therefore minus the sitemap `filter`/`serialize` options that reference them. Each omission carries a
comment naming its owner (S1-08 prose, checks and the `vite` block from item k; S1-20 sitemap
options; S1-22 verification of the redirects block). There is no `src/` at the repo root after this
ticket. `package.json` has no `engines` field: D1 pins Node through `.nvmrc`, and an `engines` entry
would warn on every install on this machine.

`tsconfig.json` extends `astro/tsconfigs/strict`, which already supplies
`allowImportingTsExtensions`, `verbatimModuleSyntax`, `isolatedModules`, `moduleResolution: Bundler`,
`allowJs`, `noEmit` and `strict`, plus the same `include` and `exclude` defaults. The local file
restates `include` and `exclude` because it must add the fixture exclusion.

`.gitignore`'s root build patterns are **anchored** (`/dist/`, `/.astro/`). Unanchored `dist/` would
silently ignore committed vendor copies once S1-09 mirrors npm layouts such as
`public/vendor/gsap/dist/gsap.min.js`. Verified with `git check-ignore -v`: that path is **not**
ignored, while `dist/`, `.astro/`, `node_modules/`, `tests/fixtures/**/.tmp/` and
`tests/fixtures/**/dist/` all are.

### Type-checker smoke, on a temporary copy of the fixture

```
cp -R tests/fixtures/astro-compatibility/site <tmp>   # plus the root tsconfig, fixture exclusion dropped
node node_modules/astro/bin/astro.mjs sync --root <tmp>        → exit 0
./node_modules/.bin/astro check --root <tmp>                   → exit 0
Result (13 files): 0 errors, 0 warnings, 0 hints
```

`@astrojs/check@0.9.10`, `typescript@5.8.3` and `astro@7.3.1` work together, and the fixture's typed
`checks.ts` and `markdown.ts` are clean under `strict`.

**Scope caveat, read this first.** `astro check --root <dir>` does **not** narrow the program to that
directory. Run against the repo root it discovers the root `tsconfig.json`, whose `include: ["**/*"]`
pulls in the **legacy static site's JavaScript** and skips the fixture, which that tsconfig excludes;
that run reported `Result (20 files): 0 errors, 0 warnings, 13 hints`. The fixture therefore has to
be checked in a copy with its own tsconfig, as above.

Because the preset sets `allowJs` but **not** `checkJs`, legacy `.js` files can only produce syntax
errors, never type errors, which is why the 20-file run is clean. The real post-S1-09 concern is
different: once `js/` and `public/vendor/*.min.js` live under `public/`, minified vendor bundles enter
the program's file set. If that becomes slow or noisy, narrow the tsconfig `include` rather than
weakening `strict`.

### Reproducibility

`PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1 npm ci` → exit 0, 292 packages, browser cache unchanged;
`npm run test:build` after it → **13 tests, 13 pass, 0 fail**.

### Fixture layout

```
tests/fixtures/astro-compatibility/
  site/                       one Astro root answering a,b,c,d,g,h,i,j,k in a single build
    astro.config.mjs          the (k) externalization plugin, redirects, and the D2 config
    src/prose/index.ts        the module-scope accumulator (externalized)
    src/prose/markdown.ts     marked 18 + highlight.js with the three overrides
    src/build/checks.ts       integration; throws when SPIKE_BUILD_DONE_THROW is set (item f)
    src/components/Recorder.astro
    src/content.config.ts     glob() posts collection with deferRender: true
    src/content/posts/spike-post.md
    src/pages/[...theme]/index.astro        the ported baseline home
    src/pages/[...theme]/blog/index.astro
    src/pages/post/index.astro              marked rendering of entry.body
    src/pages/injection-probe/index.astro   scoped <style> + bundled <script>
    src/pages/404.astro
    public/subsites/dawson/embedded-swift-agent/agent.js   (verbatim baseline copy)
    public/nested/deep/plain.txt
  variants/
    collision-index.astro                   dropped in as src/pages/index.astro (item e1)
    duplicate-entry-ids.content.config.ts   dropped in as src/content.config.ts (item e2)
    duplicate-entry-ids.json                its two same-id entries
  .tmp/                       gitignored; every build runs in a copy here and is removed after
```

Every build, including the positive one, runs in a temporary copy under
`tests/fixtures/astro-compatibility/.tmp/`, which is **inside the repo** so `node_modules` resolves by
walking up. The copy filter skips `node_modules`, `dist` and `.astro`, because Astro writes a
`node_modules/.vite` dep cache into whatever root it builds. Each copy is removed in `after`; the
`.tmp` root itself is removed **non-recursively**, so a concurrently running suite's copies are never
clobbered. This suite never writes into the fixture source tree.

The baseline checkout is located through **`PARITY_OLD_DIR`** (Spec §9, default
`../personal-website-old`), the same variable S1-02's harness uses.
