# Third-party verification subagent of correctness reviewer 1 (Fable-1)

Re-sent to its parent via SendMessage after the parent had parked; copy banked by the orchestrator. Verbatim:

## ASTRO (astro@7.3.1)

| ID | Verdict | Evidence | Correction |
|---|---|---|---|
| **A1** | **TRUE** | `npm view astro@7.3.1 engines version` → `engines = { npm: '>=9.6.5', node: '>=22.12.0', pnpm: '>=7.1.0' }`, `version = '7.3.1'` | — |
| **A2** | **TRUE** | https://docs.astro.build/en/install-and-setup/ — "**Node.js** - `v22.12.0` or higher. Odd-numbered versions like `v23` are not supported." | Stated as "odd not supported", not "only even supported"; note `engines.node` has no upper bound, so npm won't enforce it. |
| **A3** | **PARTLY** | schema `base.ts:120` `z.union([z.boolean(), z.literal('jsx')])`, default `'jsx'` (`schemas/defaults.ts`) + config reference docs | Type `boolean \| 'jsx'`, default `'jsx'`. `'jsx'` = React/JSX whitespace rules (strips whitespace + line breaks around elements). `true` = **lossless** whitespace/line-break removal from `.astro` components. `false` = no compression, preserves all whitespace. `true` is NOT "a third, HTML-aware mode". |
| **A4** | **PARTLY** | `base.ts:496` `z.enum(['error','warn','ignore'])`; default `'warn'` in `schemas/defaults.ts` | Name and default correct, but **three** values: `'error' \| 'warn' \| 'ignore'`. Governs what happens when two routes generate the same prerendered URL: error = fail build; warn = log + use highest-priority route; ignore = silently use highest-priority route. |
| **A5** | **TRUE** | `base.ts`: `inlineStylesheets: z.enum(['always','auto','never'])`, `trailingSlash: 'always'\|'never'\|'ignore'`, `build.format: 'file'\|'directory'\|'preserve'`, `output: 'static'\|'server'`, `site: z.string().url().optional()`, `markdown.syntaxHighlight` union includes `z.literal(false)` | All valid. Defaults differ from the spec's values: `inlineStylesheets` → `'auto'`, `trailingSlash` → `'ignore'`. |
| **A6** | **TRUE** | Docs: "For statically-generated sites with no adapter installed, this will produce a client redirect using a `<meta http-equiv="refresh">` tag and does not support status codes." Template in `core/routing/3xx.ts:27`. `core/build/common.ts:62` `getOutFile` — case `'redirect'` + format `'directory'` → `new URL('./index.html', outFolder)` → `dist/12years/index.html` | — |
| **A7** | **PARTLY** | `content/loaders/file.ts` (fetched at tag, HTTP 200) | `parser` exists (`parser?: (text) => ParserOutput`). **YAML errors ARE swallowed**: the `try/catch` around `parse` does `logger.error(...)` + `return` — no throw, build continues. But a parser returning **one object with an `id` does NOT yield one entry**: a non-array object is treated as an id→data map, so every top-level key becomes its own entry. Single-entry forms that work: `parser: (t) => [{ id: 'theme', ...yaml.load(t) }]` (array of one) or `parser: (t) => ({ theme: yaml.load(t) })`. |
| **A8** | **TRUE (claim's premise inverted)** | `content/loaders/glob.ts:26-48` | `pattern`, `base`, `generateId` all exist — **and `retainBody` DOES exist** in 7.3.1: "Retains the unparsed body of the file in the data store… If `false`, `entry.body` will be undefined… Defaults to `true`." Also present: `deferRender?: boolean` (default false). So `entry.body` gives the raw Markdown by default; no workaround needed. |
| **A9** | **TRUE** | `types/public/integrations.ts:447` — `'astro:build:done': (options: { pages: {pathname:string}[]; dir: URL; assets: Map<string,URL[]>; logger }) => …` | Exactly those four; **`routes` is NOT there** (moved to `astro:routes:resolved`). Throwing fails the build: `integrations/hooks.ts` `withTakingALongTimeMsg` catches, logs "An unhandled error occurred while running the …hook", then `throw err;` — awaited by `runHookBuildDone`, so it propagates and `astro build` exits non-zero. |
| **A10** | **TRUE** | `integrations.ts:388` — `astro:config:setup` with `config`, `command`, `updateConfig`, `addWatchFile`, `logger`, etc. Same rethrow path as A9. | — |
| **A11** | **TRUE** | Docs (routing): "Setting the rest parameter to `undefined` allows it to match the top level page." Source `core/routing/generator.ts:22` — spread part with missing param returns `''`; `getSegment` returns `''` for empty; `getRouteGenerator` ends `return path \|\| '/'` | Works for both `[...theme].astro` and `[...theme]/index.astro`. Docs example uses the file form. |
| **A12** | **TRUE** | `npm view @astrojs/markdown-satteri version` → `0.4.0`. `npm view astro@7.3.1 dependencies` includes `"@astrojs/markdown-satteri": "0.4.0"`, `"shiki": "^4.0.2"`. `@astrojs/markdown-remark` is **absent** from that list (still published standalone, latest `7.3.0`) | satteri wraps `satteri@^0.10.3` + `@astrojs/prism@4.0.2` + `github-slugger`. |
| **A13** | **PARTLY** | `npm view astro@7.3.1 dependencies` → `"@astrojs/compiler-rs": "^0.4.0"`; `npm view @astrojs/compiler-rs@0.4.0 description` → "Astro's compiler, written in Rust with NAPI-RS bindings for Node.js"; repo `withastro/compiler-rs`. Old `@astrojs/compiler` is **not** a dep of 7.3.1 | Rust compiler confirmed as the dependency. **Unclosed-tag strictness UNVERIFIED** — the published tarball ships only `dist/*.mjs` + a minimal README; confirming would require running a build (blocked by no-install). Treat "errors on unclosed tags" as unproven. |
| **A14** | **TRUE** | https://docs.astro.build/en/reference/directives-reference/ — `is:inline` opts `<script>`/`<style>` out of processing; "You can also use `set:html` on a `<Fragment>` to avoid adding an unnecessary wrapper element." | — |
| **A15** | **TRUE** | https://docs.astro.build/en/guides/environment-variables/ — "you cannot use `import.meta.env` in `astro.config.mjs` to access environment variables that were set in `.env` files"; "You can use `process.env` in a configuration file…" | — |
| **A16** | **TRUE** | `content/utils.ts:224-242` throws `AstroError(InvalidContentEntryDataError)`; `core/errors/errors-data.ts:1822` message maps `...error.issues.map(issue => ...)` — **every** issue printed, then thrown → build fails | Applies to `superRefine` issues too (they land in `error.issues`). |
| **A17** | **TRUE** | `npm view @astrojs/sitemap@3.7.4 version` → `3.7.4` (also current latest). Tarball `dist/index.d.ts`: `filter?(page: string): boolean`; `serialize?(item: SitemapItem): …` with `SitemapItem = Pick<SitemapItemLoose, 'url'\|'lastmod'\|'changefreq'\|'priority'\|'links'>`. `dist/index.js:14` `STATUS_CODE_PAGES = new Set(["404","500"])` + `isStatusCodePage`; `:43` `if (!config.site) logger.warn("The Sitemap integration requires the \`site\` astro.config option. Skipping.")` | All parts hold: filter gets a string, serialize's item shape matches, 404 (and 500) excluded by default, `site` required (warns and skips otherwise). |
| **A18** | **TRUE** | `npm view astro@7.3.1 dependencies.js-yaml` → `^4.3.0`; `npm view js-yaml@4.3.0 version` → `4.3.0`; `npm view js-yaml version` → `5.4.1` | — |

## PLAYWRIGHT

| ID | Verdict | Evidence | Correction |
|---|---|---|---|
| **P1** | **TRUE** | `npm view @playwright/test@1.61.1 version` → `1.61.1`; `npm view @playwright/test version` → `1.63.0` | 1.64.0-alpha prereleases exist but latest stable is 1.63.0. |
| **P2** | **TRUE** | `browsers.json` @ `v1.61.1`: chromium rev `1228` (149.0.7827.55), chromium-headless-shell rev `1228`. @ `v1.63.0`: chromium rev `1243` (153.0.8010.12), headless-shell `1243` | — |
| **P3** | **TRUE** | `packages/playwright/types/test.d.ts` @ v1.61.1: `webServer?: TestConfigWebServer \| TestConfigWebServer[];` (line 1043); `gracefulShutdown?: { signal: "SIGINT"\|"SIGTERM"; timeout: number }` (line 10389) | **Added in 1.50.0** (bisected: absent in v1.49.0, present in v1.50.0). Windows ignores it. |
| **P4** | **TRUE** | `snapshotPathTemplate?: string;` (line 574); "`{platform}` - The value of `process.platform`." (lines 527, 1770) | — |
| **P5** | **TRUE** | `toHaveScreenshot` options block: `animations?: "disabled"\|"allow"`, `caret?: "hide"\|"initial"`, `mask?: Array<Locator>`, `maxDiffPixelRatio?: number`, `scale?: "css"\|"device"`, `threshold?: number` | — |
| **P6** | **TRUE** | `playwright-core/types/types.d.ts` @ v1.61.1: `emulateMedia(options?: {...})` with `reducedMotion?: null\|"reduce"\|"no-preference"`; `clock: Clock;` on both Page (5235) and BrowserContext (9908); `addInitScript` on both; `route(url, handler, …)` on both; `Route.abort(errorCode?: string)` | — |
| **P7** | **TRUE** | `docs/src/test-cli-js.md` @ v1.61.1: "`-g <grep>` or `--grep <grep>` \| Only run tests matching this regular expression"; html reporter type `open?: 'always' \| 'never' \| 'on-failure'` | — |

## GITHUB

| ID | Verdict | Evidence | Correction |
|---|---|---|---|
| **G1** | **TRUE (all four exact)** | `api.github.com/repos/actions/<n>/releases`: checkout **v7.0.1** (2026-07-20), setup-node **v7.0.0** (2026-07-14), upload-pages-artifact **v5.0.0** (2026-04-10), deploy-pages **v5.0.1** (2026-09-01) | deploy-pages v5.0.1 shipped 4 days ago. |
| **G2** | **TRUE** | `raw.githubusercontent.com/actions/upload-pages-artifact/v5/action.yml` — input `include-hidden-files`, default `"false"`, "Include hidden files and directories (those starting with a dot)… Excludes .git and .github regardless." tar line: `${{ inputs.include-hidden-files != 'true' && '--exclude=.[^/]*' \|\| '' }}` | Dotfiles excluded by default, confirmed at the tar level. |
| **G3** | **TRUE** | `actions/setup-node/v7/action.yml` — `node-version-file: 'File containing the version Spec… Examples: package.json, .nvmrc, .node-version, .tool-versions.'`; `cache: 'Supported values: npm, yarn, pnpm.'` | Runs on `node24`. |
| **G4** | **TRUE** | GitHub Pages custom-domain docs — "If you are publishing from a custom GitHub Actions workflow, no `CNAME` file is created, and any existing `CNAME` file is ignored and is not required." | — |
| **G5** | **TRUE** | Events-that-trigger-workflows: "With the exception of `workflow_dispatch` and `repository_dispatch`, other `GITHUB_TOKEN`-triggered events do not create workflow runs at all." Permissions-required-for-GitHub-Apps: `POST /repos/{owner}/{repo}/actions/workflows/{workflow_id}/dispatches` → **Actions: write** | Yes, `actions: write` is required. |
| **G6** | **TRUE** | Events-that-trigger-workflows, workflow_dispatch: "This event will only trigger a workflow run if the workflow file exists on the default branch."; `GITHUB_REF` = "Branch or tag that received dispatch" | The workflow must be on the default branch to be *dispatchable*, but the run executes the file version from the `--ref` you pass. |
| **G7** | **PARTLY** | REST Pages docs — PUT body: `build_type` (`legacy`\|`workflow`), `https_enforced` (boolean), `source` present. GET 200 schema includes `build_type` (string-or-null enum legacy/workflow/null), `cname` (string-or-null), `https_enforced` (boolean) | **`source` is optional, not required.** Everything else in the claim holds. |
| **G8** | **PARTLY** | GitHub Pages 404 docs only say: "You can display a custom 404 error page when people try to access nonexistent pages on your site." | Behavior is real, but **no doc sentence explicitly covers nested paths** like `/brutalist/nope/`. Don't cite docs for the nested-path guarantee. |

## NODE

| ID | Verdict | Evidence | Correction |
|---|---|---|---|
| **N1** | **TRUE** | `nodejs/Release/main/schedule.json`: `v25: {maintenance: 2026-04-01, end: 2026-06-01}`; `v24: {lts: 2025-10-28, maintenance: 2026-10-20, end: 2028-04-30}` | v24 Active LTS → Maintenance on 2026-10-20, EOL 2028-04-30. |
| **N2** | **TRUE** | `nodejs/node` `doc/api/typescript.md` (v24.x): "v23.6.0 … Type stripping is enabled by default." + "By default Node.js will execute TypeScript files that contains only erasable TypeScript syntax." | No flag needed on 24 for erasable-only TS. `enum`/parameter properties need `--experimental-transform-types`; `tsconfig.json` is ignored. |

## NPM REGISTRY

| ID | Verdict | Evidence | Correction |
|---|---|---|---|
| **M1** | **TRUE (12/12)** | `npm view <pkg>@<v> version` echoed the requested version for every one: marked 18.0.5, highlight.js 11.9.0, jquery 3.6.0, jquery-ui-dist 1.12.1, aos 2.3.1, vanilla-tilt 1.7.0, gsap 3.9.1, gsap 3.15.0, @fortawesome/fontawesome-free 6.5.1, mermaid 11.15.0, boxicons 2.0.9, js-yaml 4.3.0 | — |
| **M2** | **TRUE** | `npm view mermaid@11.15.0 dist.unpackedSize` → `76342428` (= 76.34 MB) | — |
| **M3** | **TRUE** | `npm view boxicons@2.0.9 dependencies` → six: `@webcomponents/webcomponentsjs ^2.0.2`, `prop-types ^15.6.0`, `react ^16.0.0`, `react-dom ^16.0.0`, `react-interactive ^0.8.1`, `react-router-dom ^4.2.2` | — |
| **M4** | **TRUE** | `cdn.jsdelivr.net/npm/highlight.js@11.9.0/lib/common.js` — `grep -c registerLanguage` → **36**. cdnjs `highlight.min.js` 11.9.0 (121,727 B): all 34 top-level grammars present; haskell/erlang/elixir/ocaml/nginx/dockerfile/powershell absent | 36 `registerLanguage` calls, but two are sub-grammars (`php-template`, `python-repl`), so **34 user-facing languages**. The cdnjs minified bundle ships the same common set. |
| **M5** | **TRUE (all)** | `curl -sL <dist.tarball> \| tar -tzf -`: aos → `package/dist/aos.js`, `package/dist/aos.css`; jquery-ui-dist → `package/jquery-ui.min.js`; gsap 3.9.1 → `package/dist/gsap.min.js`; fontawesome-free 6.5.1 → `package/css/all.min.css` + `package/webfonts/*.{ttf,woff2}`; highlight.js 11.9.0 → `package/styles/github-dark.min.css` + `package/lib/common.js` | — |

## The five things worth acting on

1. **A7 is the real bug in the spec.** `file()` treats a non-array parser return as an **id→data map**, so `parser: (t) => ({ id: 'x', ...yaml.load(t) })` produces one entry per top-level YAML key, not one entry. Use `[{ id: 'x', ...data }]`.
2. **A7 second half is a silent-failure hazard, and the spec is right about it.** A YAML syntax error is logged and swallowed; the build stays green with an empty collection. If the spec relies on that collection, it needs its own guard.
3. **A8 was written defensively against a false premise.** `retainBody` exists and defaults to `true`; `entry.body` already works.
4. **A3/A4 need small wording fixes** — `compressHTML: true` is lossless whitespace removal (not an HTML-aware mode), and `prerenderConflictBehavior` has a third value, `'ignore'`.
5. **A13's strictness claim is unproven.** The Rust compiler dependency is confirmed; "errors on unclosed tags" could not be verified without a build. Don't ship it as fact.

Two smaller ones: **G7** — `source` is optional on `PUT /repos/{owner}/{repo}/pages`, not required. **G8** — the nested-path 404 behavior is real but has no doc sentence backing it, so drop the citation.
