# Research: Actions deploy to Pages + local Playwright parity harness

> Historical research snapshot. The settled owner decisions in [Spec 1 §13](../spec-1-migration-engine-parity.md#13-settled-owner-decisions-q1-q14-2026-09-05) supersede earlier recommendations about post ownership/format, drafts, picker placement and palette support; use the current spec for implementation.

**For:** Spec 1 (§8.1 of `intent.md`) — covers §4.9 (parity harness), §4.10 (deploy), §4.11 (worktree).
**Verified:** 2026-09-05. Every claim below has a URL. Anything I could not verify from a
primary source is labelled **unverified** and should be tested, not assumed.
**Machine facts** measured locally on this Mac (Node v25.9.0, npm 11.12.1, gh 2.59.0,
python3 3.9.6, git 2.50.1).

---

## 1. Summary for the spec author

Deploy:

1. Current action majors: `actions/configure-pages@v6` (v6.0.0, 2026-03-25), `actions/upload-pages-artifact@v5` (v5.0.0, 2026-04-10), `actions/deploy-pages@v5` (v5.0.1, 2026-09-01), `actions/checkout@v7`, `actions/setup-node@v7`. GitHub's own starter workflows are stale (they still say `upload-pages-artifact@v3`), so do not copy them verbatim.
2. **`CNAME` is dead weight under Actions deploys.** GitHub docs: "If you are publishing from a custom GitHub Actions workflow, no `CNAME` file is created, and any existing `CNAME` file is ignored and is not required." The custom domain lives in repo settings only. This contradicts intent §4.10 ("`CNAME` … rides in `public/`") — harmless but pointless.
3. **`upload-pages-artifact` strips dotfiles by default.** Its `tar` line adds `--exclude=.[^/]*` unless `include-hidden-files: true`. So a `.nojekyll` in `public/` would silently *not* reach the artifact. Since Jekyll does not run on an uploaded artifact anyway, the fix is to drop `.nojekyll` rather than to set the flag.
4. `permissions: {contents: read, pages: write, id-token: write}`, `environment: github-pages` with `url: ${{ steps.deployment.outputs.page_url }}`, `concurrency: {group: "pages", cancel-in-progress: false}`. All three are in GitHub's docs and starter workflow.
5. `setup-node` with `cache: npm` **hard-fails** without a lockfile: `Dependencies lock file is not found in ${workspace}`. `package-lock.json` must be committed (it must be anyway for `npm ci`).
6. Flip the source with one call: `gh api --method PUT /repos/dawsonamf/personal-website/pages -f build_type=workflow`. Revert with `build_type=legacy`. `https_enforced` and `cname` are separate fields and are not touched by that call.
7. **The flip is a clean single go/no-go.** `configure-pages` and `upload-pages-artifact` both work while the source is still `legacy` (they only read Pages metadata / upload an artifact). Only `deploy-pages` needs `build_type: workflow`. So a build-only dry run validates everything before the flip.
8. Artifact limits: tar must be < 10 GB and contain no symlinks; published Pages sites are capped at 1 GB; deploys time out at 10 minutes. The 10-builds/hour soft limit "does not apply if you build and publish your site with a custom GitHub Actions workflow."
9. `GITHUB_TOKEN`-authored pushes do not trigger `push` workflows, but "`workflow_dispatch` and `repository_dispatch` events **always** create workflow runs." So `refresh-chart-data.yml` needs `permissions: actions: write` plus `gh workflow run deploy.yml --ref main` with `GH_TOKEN: ${{ github.token }}`. No PAT needed.
10. Pages already redirects apex → www for you: "If you configure `www.example.com` as the custom domain … then `example.com` will redirect to `www.example.com`." So `site: 'https://www.dawsonamf.com'` in `astro.config` is the correct canonical.
11. Pages has **no** server-side redirect mechanism (no `_redirects`, no config file). Astro's `redirects` option on a static build "will produce a client redirect using a `<meta http-equiv="refresh">` tag and does not support status codes." That is the only tool for intent §3.5 / §4.5 / §4.8 old-URL preservation.
12. Astro defaults that matter: `build.format: 'directory'` (emits `/blog/x/index.html`), `trailingSlash: 'ignore'`, `outDir: './dist'`, `publicDir: './public'`. Latest `astro` on npm is **7.3.1**.

Harness:

13. `@playwright/test` latest is **1.63.0** (published 2026-09-04), which bundles Chromium build **1243** (153.0.8010.12). The cached build on this machine is **1228** = Chrome for Testing **149.0.7827.55**, which is what **Playwright 1.61.0 / 1.61.1** ship. Pinning `@playwright/test@1.61.1` means **zero browser download**. Any newer version needs `npx playwright install chromium` (an install the owner must approve).
14. `webServer` accepts an array (present in the typings since **1.25.0**; 1.24.0 was object-only). Fields: `command`, `url`, `port` (deprecated), `cwd`, `env`, `stdout`/`stderr`, `timeout` (60 000 default), `reuseExistingServer`, `gracefulShutdown`, `name`, `ignoreHTTPSErrors`, `wait` (added 1.57).
15. **`python3 -m http.server` binds all interfaces by default** ("`--bind ADDRESS` … [default: all interfaces]"). `--bind 127.0.0.1` is mandatory, not optional, under the owner's network rule. Likewise **never pass a bare `astro preview --host`** — bare `--host` means "listen on all addresses, including LAN and public addresses". No flag at all = localhost only.
16. Playwright's HTML report server defaults to `host: 'localhost'`, `port: 9323`, and `open` defaults to `'on-failure'` (it will launch a browser). Set `reporter: [['html', { open: 'never' }]]`.
17. Screenshot flow: run the whole suite against OLD with `--update-snapshots=all` to write baselines, then against NEW to compare. Set `snapshotPathTemplate` so the baseline name encodes viewport but **not** which site produced it, and select the site with an env var, not a Playwright project.
18. `animations: 'disabled'` "stops CSS animations, CSS transitions and Web Animations … finite animations are fast-forwarded to completion, so they'll fire `transitionend` event. infinite animations are canceled to initial state." That covers the `marquee` skin's infinite tickers and WAAPI, but **not** the site's `setTimeout`/rAF-driven typing engine.
19. The Clock API (`page.clock`, since **1.45**) overrides `Date`, `setTimeout`/`clearTimeout`, `setInterval`/`clearInterval`, `requestAnimationFrame`/`cancelAnimationFrame`, `requestIdleCallback`/`cancelIdleCallback`, `performance`, and `Event.timeStamp` — enough to drive the typing animation to a chosen point deterministically. `install` MUST be the first clock call.
20. `page.addInitScript` runs "after the document was created but before any of its scripts were run" and the docs' own example is seeding `Math.random` — exactly intent §4.9's requirement, with no hook in site code. It runs before the synchronous `theme-bootstrap.js` in `<head>`.
21. **Node 25.9 has `util.diff` in stdlib** (added v23.11.0, Stability 1 Experimental). On arrays it diffs element-wise, so splitting a normalized DOM dump into lines gives a line diff with zero installs. But the laziest option is lazier still: `expect(newLines).toEqual(oldLines)` — Playwright prints the diff for free. Playwright ships **no** HTML/DOM comparison helper.
22. `expect(locator).toMatchAriaSnapshot()` (since **1.49**) captures roles, accessible names, text and ARIA state but explicitly **ignores CSS and non-semantic DOM attributes** — too lossy for canonical-DOM parity (§3.2 needs skin selectors to still match, i.e. ids/classes), useful only as a cheap secondary check.
23. Only one place in the site depends on pointer type: `js/theme-cycler.js:594` gates hover-to-open on `matchMedia('(hover: hover) and (pointer: fine)')`. There are **no** `hover`/`pointer` media queries in the CSS. So the 390 px project's `hasTouch`/`isMobile` setting decides whether the theme menu hover path is exercised — pick deliberately and assert `matchMedia` in the test rather than trusting the emulation.
24. The 1100 px breakpoint means a plain 390×844 desktop-UA viewport *does* get the mobile layout; iPhone emulation is only needed for the pointer question in (23) and for `meta viewport` handling.

---

## 2. Detailed findings

### 2.1 Action versions (verified against the GitHub Releases API)

| Action | Latest release | Published | Major aliases |
|---|---|---|---|
| `actions/configure-pages` | `v6.0.0` | 2026-03-25 | v0–v6 |
| `actions/upload-pages-artifact` | `v5.0.0` | 2026-04-10 | v0–v5 |
| `actions/deploy-pages` | `v5.0.1` | 2026-09-01 | v1–v5 |
| `actions/checkout` | `v7.0.1` | 2026-07-20 | v1–v7 |
| `actions/setup-node` | `v7.0.0` | 2026-07-14 | v1–v7 |
| `withastro/action` | `v6.1.2` | 2026-07-10 | v0–v6 |

Source: `GET https://api.github.com/repos/{owner}/{repo}/releases/latest` and `/tags` for each.
Docs and starter workflows lag behind: <https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages> shows `configure-pages@v5` / `upload-pages-artifact@v4` / `deploy-pages@v4`, and <https://github.com/actions/starter-workflows/blob/main/pages/static.yml> shows `checkout@v4` / `configure-pages@v5` / `upload-pages-artifact@v3` / `deploy-pages@v5`. Use the majors in the table.

**`actions/configure-pages@v6`** (<https://github.com/actions/configure-pages/blob/main/action.yml>) — inputs `static_site_generator` ("nuxt", "next", "gatsby", or "sveltekit"; Astro is **not** in the list), `generator_config_file`, `token` (default `${{ github.token }}`), `enablement` (default `false`; "This option requires a token other than `GITHUB_TOKEN`"). Outputs `base_url`, `origin`, `host`, `base_path`. For this site `origin` will be `https://www.dawsonamf.com` and `base_path` will be `""`, so the step is only worth keeping if the build consumes `origin` for `--site`.

**`actions/upload-pages-artifact@v5`** (<https://github.com/actions/upload-pages-artifact/blob/main/action.yml>) — inputs `name` (default `github-pages`), `path` (default `_site/`), `retention-days` (default `1`), `include-hidden-files` (default `false`, "Include hidden files and directories (those starting with a dot) in the artifact. Excludes .git and .github regardless."). The tar step is literally:

```sh
tar --dereference --hard-dereference --directory "$INPUT_PATH" \
  -cvf "$RUNNER_TEMP/artifact.tar" \
  --exclude=.git --exclude=.github \
  ${{ inputs.include-hidden-files != 'true' && '--exclude=.[^/]*' || '' }} \
  .
```

That `--exclude=.[^/]*` is why `.nojekyll` and any other dotfile in `dist/` disappears by default. README (<https://github.com/actions/upload-pages-artifact#readme>): the artifact is "a single `gzip` archive containing a single `tar` file", the tar "must not contain any symbolic or hard links" and can "contain only files and directories".

**`actions/deploy-pages@v5`** (<https://github.com/actions/deploy-pages#readme>) — inputs `token` (default `${{ github.token }}`), `timeout` (`600000`), `error_count` (`10`), `reporting_interval` (`5000`), `artifact_name` (`github-pages`), `preview` (`false`). Output `page_url`. Its error strings (<https://github.com/actions/deploy-pages/blob/main/src/internal/deployment.js>) are worth knowing for the cutover:

```
403 -> " Ensure GITHUB_TOKEN has permission \"pages: write\"."
404 -> " Ensure GitHub Pages has been enabled: <repo>/settings/pages"
```

### 2.2 Recommended workflow (`.github/workflows/deploy.yml`)

```yaml
name: Deploy to Pages

on:
  push:
    branches: [main]
  workflow_dispatch:
    inputs:
      deploy:
        description: "Publish the artifact (uncheck for a build-only dry run)"
        type: boolean
        default: true

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: "pages"
  cancel-in-progress: false

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v7
      - uses: actions/setup-node@v7
        with:
          node-version-file: package.json   # or "24"; needs a lockfile for cache
          cache: npm
      - run: npm ci
      - run: npx astro build               # fails on drafts / missing sizes (intent 4.4, 4.2)
      - uses: actions/upload-pages-artifact@v5
        with:
          path: dist

  deploy:
    needs: build
    # Lets the pre-cutover dry run stop after build+upload.
    if: ${{ github.event_name == 'push' || inputs.deploy }}
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - id: deployment
        uses: actions/deploy-pages@v5
```

Notes:
- `actions/configure-pages` is omitted on purpose. Its only job here would be feeding `--site`/`--base`, and this site has a fixed custom domain and no base path — `site: 'https://www.dawsonamf.com'` belongs in `astro.config.mjs` where local builds get it too. Add `configure-pages@v6` back only if you want the `origin` output.
- `node-version-file: package.json` reads `engines.node` / `volta`; if you would rather pin, use `node-version: "24"`. `cache: npm` needs `package-lock.json` committed — `src/cache-restore.ts` throws `Dependencies lock file is not found in ${workspace}. Supported file patterns: package-lock.json,npm-shrinkwrap.json,yarn.lock` (<https://github.com/actions/setup-node/blob/main/src/cache-restore.ts>).
- The `github-pages` environment is required by the docs so branch/deployment protection rules apply: "The deploy job requires `pages: write` and `id-token: write`" (<https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages>).

### 2.3 `withastro/action` — evaluated, not recommended

Source: <https://github.com/withastro/action/blob/main/action.yml>. Inputs: `node-version` (default `"24"`), `package-manager` (auto-detected from lockfiles), `path` (`.`), `build-cmd`, `cache` (`true`), `cache-dir` (`node_modules/.astro`), `out-dir` (`dist`).

It is a composite action that detects the package manager from lockfiles, sets up pnpm/bun/deno/node, installs, restores an Astro cache, runs the build, saves the cache, and calls `actions/upload-pages-artifact@v5`. **It does not run `configure-pages` and does not deploy** — you still write the `deploy` job yourself.

- Pro: one step instead of four; free `node_modules/.astro` caching for optimized images (irrelevant for a site with no `astro:assets` image pipeline).
- Con: it is 5 steps of indirection replacing 5 lines of YAML you can read. It pins its internal actions to *tags*, not SHAs (`pnpm/action-setup@v6.0.9`, `actions/setup-node@v6.4.0`, `actions/cache@v6.1.0`, `upload-pages-artifact@v5`) — so `withastro/action@v6` is one moving part wrapping four more, and its internal `setup-node@v6` is already behind `v7`.
- Con: package-manager auto-detection is a feature this repo does not need (npm is locked in, §4.12).

**Recommendation: skip it.** The generic steps are the same length and every version is yours.

### 2.4 Flipping the publishing source

REST: `PUT /repos/{owner}/{repo}/pages` (<https://docs.github.com/en/rest/pages/pages>). Parameters: `build_type` (`legacy` = "Site built by GitHub when changes are pushed to a specific branch"; `workflow` = "Site built by a custom GitHub Actions workflow"), `source` (`{branch, path}`, path one of `/` or `/docs`), `cname`, `https_enforced`. Requires repo admin/maintainer or "manage GitHub Pages settings"; OAuth tokens need the `repo` scope.

```bash
# 0. record the before state
gh api /repos/dawsonamf/personal-website/pages \
  --jq '{build_type, cname, https_enforced, protected_domain_state, html_url}'

# 1. the flip  (single go/no-go step)
gh api --method PUT /repos/dawsonamf/personal-website/pages -f build_type=workflow

# 1b. if that 422s because `source` is required, send the whole body instead:
echo '{"build_type":"workflow","source":{"branch":"main","path":"/"}}' \
  | gh api --method PUT /repos/dawsonamf/personal-website/pages --input -

# 2. verify, then re-run the deploy workflow
gh api /repos/dawsonamf/personal-website/pages --jq '{build_type, cname, https_enforced}'
gh workflow run deploy.yml --ref main

# rollback
gh api --method PUT /repos/dawsonamf/personal-website/pages -f build_type=legacy
```

`gh api` flags (<https://cli.github.com/manual/gh_api>): `-X, --method <string> (default "GET")`; `-f/--raw-field` = "Add a string parameter in key=value format"; `-F/--field` = typed (`true`/`false`/`null`/numbers converted, `@file`/`@-` reads from file/stdin); `--input` = "The file to use as body for the HTTP request (use \"-\" to read from standard input)". Use `-f` for `build_type` since it is a string. `gh` on this machine is 2.59.0; `gh api` has been stable far longer than that. Whether `source` is mandatory alongside `build_type` is **unverified** — hence 1b.

UI equivalent: Settings → Pages → Build and deployment → Source → "GitHub Actions" (<https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site>).

**Custom domain and HTTPS across the flip.** The custom domain is repo settings state (the `cname` field), not file state — the same doc says "A `CNAME` file in your repository file does not automatically add or remove a custom domain. Instead, you must configure the custom domain through your repository settings or through the API." And decisively (<https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site>):

> If you are publishing your site from a branch, this will create a commit that adds a `CNAME` file directly to the root of your source branch. If you are publishing from a custom GitHub Actions workflow, no `CNAME` file is created, and any existing `CNAME` file is ignored and is not required.

So: **do not ship `CNAME` in `public/`.** It is ignored. Whether `https_enforced` survives the flip is **not documented** (unverified) — capture it in step 0 above and re-assert with `-F https_enforced=true` if the after-state differs. If the certificate goes stale, the documented remedy is Remove + retype the domain + Save, which "will cancel and restart the provisioning process" (<https://docs.github.com/en/pages/getting-started-with-github-pages/securing-your-github-pages-site-with-https>).

**`.nojekyll`.** There is no GitHub doc sentence saying "Jekyll does not run on uploaded artifacts". The evidence that it does not: (a) the custom-workflow docs describe the artifact as the thing that gets deployed, with Jekyll available only via an *explicitly added* `actions/jekyll-build-pages@v1` step; (b) the official `static.yml` starter workflow uploads the entire repo with no `.nojekyll` handling and no Jekyll step. Combined with finding (3) — dotfiles are excluded from the artifact by default anyway — the conclusion for the spec is: **drop `.nojekyll` from `public/`**, and if you want to keep it as a belt-and-braces artifact you must also set `include-hidden-files: true`. Label the "Jekyll never runs" claim **strongly implied, not verbatim**.

**Artifact / site limits** (<https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits>): "Published GitHub Pages sites may be no larger than 1 GB"; source repos have a recommended 1 GB limit; 100 GB/month soft bandwidth; "GitHub Pages deployments will timeout if they take longer than 10 minutes"; 10 builds/hour soft limit that "does not apply if you build and publish your site with a custom GitHub Actions workflow". The `upload-pages-artifact` README adds: tar under 10 GB, "deployment success is not guaranteed above 1GB per official GitHub Pages limits".

**Can the first Actions run happen before the flip?** Yes, and this is what makes the cutover a single reversible step:
- `configure-pages` reads Pages metadata via the API — works while `build_type` is `legacy`.
- `upload-pages-artifact` only tars a directory and calls `actions/upload-artifact` — Pages-agnostic.
- `deploy-pages` creates a Pages deployment and is the only step that requires `build_type: workflow`. Its exact failure status when the source is still `legacy` is **unverified** (403 and 404 both have custom messages; it may also 400).

Hence the `workflow_dispatch` input `deploy: false` in §2.2: dispatch a dry run, confirm `dist/` builds and the artifact uploads, then flip and dispatch again.

### 2.5 404, redirects, trailing slashes

- **404.** <https://docs.github.com/en/pages/getting-started-with-github-pages/creating-a-custom-404-page-for-your-github-pages-site> says to create `404.html` (or `404.md` with `permalink: /404.html` front matter) in "the publishing source for your site". For an Actions deploy the publishing source *is* the artifact, so `dist/404.html` is the right place. The docs never say this in so many words for Actions deploys — **partially unverified**, and it is trivially checkable at the dry-run stage by hitting a bogus path on the live site after cutover. Astro emits `src/pages/404.astro` → `dist/404.html` regardless of `build.format`.
- **Redirects.** GitHub Pages is described as "a static site hosting service that takes HTML, CSS, and JavaScript files straight from a repository on GitHub, optionally runs the files through a build process, and publishes a website" (<https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages>). There is no documented redirect configuration of any kind — no `_redirects`, no `netlify.toml` analogue, no per-path status codes. I found no doc page that says this as a prohibition; the finding is **the absence of any documented mechanism**, which is the strongest available evidence. Confirming: Astro's own config reference says of its `redirects` option, "For statically-generated sites with no adapter installed, this will produce a client redirect using a `<meta http-equiv=\"refresh\">` tag and does not support status codes" (<https://docs.astro.build/en/reference/configuration-reference/>). So intent §3.5/§4.5/§4.8 old-URL preservation = meta-refresh stub pages (add `<link rel="canonical">` + a JS `location.replace` for speed).
- **Trailing slashes.** **Unverified.** No GitHub doc describes Pages' 301 behaviour for `/blog/x` → `/blog/x/`. Empirically Pages does redirect a directory request to the trailing-slash form, but that is not documented and should not be relied on in the spec. The safe design: `build.format: 'directory'` (Astro's default, emits `/blog/x/index.html`) plus `trailingSlash: 'ignore'` (also the default), and emit internal links with the trailing slash so no redirect is ever needed. If the harness compares URLs it should normalize trailing slashes.

### 2.6 `refresh-chart-data.yml` → deploy dispatch

<https://docs.github.com/en/actions/how-tos/write-workflows/choose-when-workflows-run/trigger-a-workflow>:

> When you use the repository's `GITHUB_TOKEN` to perform tasks, events triggered by the `GITHUB_TOKEN` will not create a new workflow run, with the following exceptions:
> - `workflow_dispatch` and `repository_dispatch` events always create workflow runs.
> - `pull_request` events with the `opened`, `synchronize`, or `reopened` activity types: … the resulting `pull_request` event creates workflow runs in an **approval-required** state.

So `workflow_dispatch` is confirmed as the documented escape hatch and **no PAT is needed**. Patch to the existing workflow (which today just relies on the push redeploying Pages — that stops working the moment the source is Actions):

```yaml
permissions:
  contents: write
  actions: write          # required for `gh workflow run`

# ... in the "Commit and push if changed" step, set an output:
      - name: Commit and push if changed
        id: commit
        run: |
          git add blog/posts/assets/cohort-unemployment-data.json \
                  blog/posts/assets/cohort-swe-age-data.json \
                  blog/posts/assets/rate-data.json
          if git diff --cached --quiet; then
            echo "No data changes."
            echo "changed=false" >> "$GITHUB_OUTPUT"
          else
            git -c user.name="github-actions[bot]" \
                -c user.email="41898282+github-actions[bot]@users.noreply.github.com" \
              commit -m "Refresh chart data snapshots"
            git push
            echo "changed=true" >> "$GITHUB_OUTPUT"
          fi

      # GITHUB_TOKEN pushes don't trigger `on: push`, but workflow_dispatch always
      # creates a run. See docs.github.com .../trigger-a-workflow
      - name: Redeploy Pages
        if: steps.commit.outputs.changed == 'true'
        env:
          GH_TOKEN: ${{ github.token }}
        run: gh workflow run deploy.yml --ref main
```

`gh` is preinstalled on GitHub-hosted runners. `deploy.yml` must keep `workflow_dispatch:` in its `on:` block (it does, in §2.2) — `gh workflow run` cannot dispatch a workflow that lacks it. Note the `inputs.deploy` boolean defaults to `true`, so a dispatch with no `-f` flags deploys.

Alternatives if `actions: write` is ever unavailable: `repository_dispatch` (also always creates a run, per the same doc) with a `types: [chart-data-updated]` trigger on `deploy.yml`; or a fine-grained PAT with **Actions: read and write** on this repo (classic PAT equivalent: `repo` + `workflow`). Neither is needed here.

**Spec follow-up:** after the migration the three JSON paths move (they are `blog/posts/assets/*.json` today and will live under `public/` or `src/` in Astro), and `docs/prebake-cohort-data.py` writes to hardcoded paths. Update both together or the weekly job silently commits nothing.

### 2.7 Custom domain, www vs apex, canonical

<https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site>:

> If you configure `www.example.com` as the custom domain for your site, and you have GitHub Pages DNS records set up for the apex and `www` domains, then `example.com` will redirect to `www.example.com`. If you instead configure `example.com` as the custom domain, then `www.example.com` will redirect to `example.com`.

The repo's `CNAME` is `www.dawsonamf.com`, so `dawsonamf.com` → `www.dawsonamf.com` is handled by GitHub. Set `site: 'https://www.dawsonamf.com'` in `astro.config.mjs`; Astro uses `site` for canonical URLs and sitemap generation. Themed paths get `<link rel="canonical">` to the default plus `noindex` per intent §4.5.

---

## 3. Playwright parity harness

### 3.1 Version pin — this decides whether an install is needed

| Playwright | Chromium build | Chrome for Testing version |
|---|---|---|
| 1.63.0 (latest, 2026-09-04) | **1243** | 153.0.8010.12 |
| 1.62.0 / 1.62.1 | 1234 | 151.0.7922.34 |
| **1.61.0 / 1.61.1** | **1228** | **149.0.7827.55** |
| 1.60.0 | 1223 | 148.0.7778.96 |

Source: `packages/playwright-core/browsers.json` at each tag, e.g. <https://raw.githubusercontent.com/microsoft/playwright/v1.61.1/packages/playwright-core/browsers.json>. Versions/dates from <https://registry.npmjs.org/@playwright/test>.

Local cache (`ls ~/Library/Caches/ms-playwright`): `chromium-1228`, `chromium_headless_shell-1228`, `ffmpeg-1011`. The bundle's `Info.plist` reports `CFBundleShortVersionString = 149.0.7827.55`, matching 1.61.x exactly.

**Recommendation: pin `@playwright/test@1.61.1`.** No browser download, no install approval beyond the npm package itself. Commands for the spec to list:

```bash
npm i -D @playwright/test@1.61.1     # the only install needed; browser already cached
# NOT needed at 1.61.1:
#   npx playwright install chromium
```

If a newer Playwright is wanted (1.62/1.63 add nothing this harness needs), the spec must list `npx playwright install chromium` as a separate owner-approved step — it downloads ~150 MB into `~/Library/Caches/ms-playwright`. `ffmpeg-1011` is only for video recording; not needed.

Also pin the browser channel explicitly: `use: { channel: undefined }` (default bundled Chromium). Do **not** use `channel: 'chrome'` — that would use the owner's installed Google Chrome and drift.

### 3.2 `webServer` as an array

`testConfig.webServer` type is `Object | Array<Object>` (<https://playwright.dev/docs/api/class-testconfig#test-config-web-server>). Array support has been in the typings since at least **v1.25.0** (`webServer?: TestConfigWebServer | TestConfigWebServer[]`; v1.24.0 was `TestConfigWebServer` only). Docs: "Multiple web servers (or background processes) can be launched simultaneously by providing an array of `webServer` configurations" (<https://playwright.dev/docs/test-webserver>).

Fields (same page): `command`, `url` ("expected to return a 2xx, 3xx, 400, 401, 402, or 403 status code when the server is ready"), `port` (deprecated in favour of `url`), `cwd` ("defaults to the directory of the configuration file"), `env`, `stdout` (`"pipe"`/`"ignore"`, default `"ignore"`), `stderr` (default `"pipe"`), `timeout` (default 60000), `reuseExistingServer`, `ignoreHTTPSErrors`, `gracefulShutdown` (`{signal: 'SIGTERM'|'SIGINT', timeout}`; "If unspecified, the process group is forcefully `SIGKILL`ed"), `name` (prefixed to log messages), `wait` (regex on server output; added 1.57).

Teardown: the docs describe `gracefulShutdown` as *how* the process group is killed but never state *when* in so many words — **unverified as a doc sentence**, though the existence of `gracefulShutdown` and the "forcefully SIGKILLed" language only makes sense as end-of-run teardown, and that is Playwright's observed behaviour. Given the owner's rule about long-running listeners, this is worth a single manual check on the first run (`lsof -nP -iTCP:8781 -sTCP:LISTEN` after the suite exits) and worth setting `gracefulShutdown: { signal: 'SIGTERM', timeout: 5000 }` explicitly.

```ts
// playwright.config.ts
const OLD_DIR = process.env.PARITY_OLD_DIR ?? '../personal-website-old';
const OLD_PORT = 8781, NEW_PORT = 8782;

export default defineConfig({
  reporter: [['html', { open: 'never' }], ['list']],
  webServer: [
    {
      name: 'old',
      // --bind is REQUIRED: python's default is all interfaces.
      command: `python3 -m http.server --bind 127.0.0.1 ${OLD_PORT} --directory ${OLD_DIR}`,
      url: `http://127.0.0.1:${OLD_PORT}/`,
      reuseExistingServer: false,
      gracefulShutdown: { signal: 'SIGTERM', timeout: 5000 },
      stdout: 'ignore',
    },
    {
      name: 'new',
      // Bare `--host` would listen on LAN + public. Either pass the IP, or omit
      // --host entirely (localhost-only default) — do not pass a bare --host.
      command: `npx astro preview --host 127.0.0.1 --port ${NEW_PORT}`,
      url: `http://127.0.0.1:${NEW_PORT}/`,
      reuseExistingServer: false,
      gracefulShutdown: { signal: 'SIGTERM', timeout: 5000 },
      stdout: 'ignore',
    },
  ],
});
```

Both commands are verified valid:
- `python3 -m http.server --help` on this machine (3.9.6): `[--bind ADDRESS] [--directory DIRECTORY] [port]`, and `--bind ADDRESS … [default: all interfaces]`. **`--bind 127.0.0.1` is load-bearing for the owner's network rule, not cosmetic.**
- `astro preview` "Starts a local server to serve the contents of your static directory (`dist/` by default)", requires `astro build` first, `--port` defaults to 4321, and for `--host`: no flag → localhost only; bare `--host` → "listen on all addresses, including LAN and public addresses"; `--host <address>` → "expose on a network IP address at `<custom-address>`" (<https://docs.astro.build/en/reference/cli-reference/>). Passing `127.0.0.1` is loopback and safe.
- Alternative for the NEW server, if you would rather not have two server implementations differing in header/MIME behaviour: `python3 -m http.server --bind 127.0.0.1 8782 --directory dist`. **This is the better choice for parity** — identical server semantics on both sides removes a whole class of false diffs (Astro's preview server sets different caching headers and handles trailing slashes per `trailingSlash` config, which `http.server` does not). Use `astro preview` only where you specifically want to test the preview server's routing.

Playwright's own tooling and the 127.0.0.1 rule: the HTML reporter binds `host: 'localhost'`, `port: 9323` by default and `open` defaults to `'on-failure'` (<https://playwright.dev/docs/test-reporters>). Both are addressed by `reporter: [['html', { open: 'never' }]]`; env overrides are `PLAYWRIGHT_HTML_OPEN`, `PLAYWRIGHT_HTML_HOST`, `PLAYWRIGHT_HTML_PORT`. Note `open: 'never'` also satisfies the owner's "never run `open`" rule. Do not run `npx playwright show-report`, `--ui`, or `show-trace` from an agent — those are long-running listeners the owner starts. Whether trace-viewer/UI mode bind loopback by default is **unverified**; irrelevant if agents never launch them.

### 3.3 Cross-server screenshot comparison

`toHaveScreenshot()` compares against a stored baseline. On the first run "Playwright Test captures screenshots until two consecutive images match, then saves the final screenshot as the golden file", reporting "A snapshot doesn't exist at [path], writing actual" (<https://playwright.dev/docs/test-snapshots>). That two-consecutive-frames rule is a free settling mechanism, but it settles each side independently — it is not a parity guarantee.

**Recipe.** One test suite, one set of projects (viewports only), site chosen by env var:

```bash
PARITY_SITE=old npx playwright test --update-snapshots=all   # generate baselines from OLD
PARITY_SITE=new npx playwright test                          # compare NEW against them
```

The baseline filename must not encode which site produced it. Default template is
`{snapshotDir}/{testFileDir}/{arg}{-projectName}{-snapshotSuffix}{ext}` — so keep `{projectName}` (it carries the viewport) and select the site with `baseURL`, never with a project:

```ts
expect: {
  toHaveScreenshot: {
    animations: 'disabled',
    caret: 'hide',
    scale: 'css',
    maxDiffPixelRatio: 0.001,   // start strict; loosen per-skin, never globally
    threshold: 0.2,             // default
  },
},
snapshotPathTemplate: '{testDir}/__parity__/{testFileName}/{projectName}/{arg}{ext}',
use: {
  baseURL: process.env.PARITY_SITE === 'new'
    ? 'http://127.0.0.1:8782' : 'http://127.0.0.1:8781',
},
```

Notes:
- Drop `{platform}` from the template: both runs are on the same machine and the baselines are disposable (regenerated from OLD every session). Gitignore `__parity__/`.
- `--update-snapshots=all` explicitly, not the bare flag. The enum is `all | changed | missing | none`; `changed` was added in 1.50 ("`changed` updates only the snapshots that have changed, whereas `all` now updates all snapshots"), and the bare-flag default has moved between versions — being explicit removes the ambiguity.
- `snapshotPathTemplate` tokens: `{testDir}`, `{testFileDir}`, `{platform}`, `{projectName}`, `{testName}`, `{arg}`, `{ext}`, `{testFilePath}`, `{snapshotDir}`, `{testFileName}`, plus `{testFileBaseName}` (added 1.60).

**Option semantics** (<https://playwright.dev/docs/api/class-pageassertions#page-assertions-to-have-screenshot-1>), quoted:

- `animations`: "When set to `\"disabled\"`, stops CSS animations, CSS transitions and Web Animations. Animations get different treatment depending on their duration: finite animations are fast-forwarded to completion, so they'll fire `transitionend` event. infinite animations are canceled to initial state, and then played over after the screenshot."
  - Covers WAAPI. Covers `marquee`'s infinite CSS tickers (cancelled to initial state → deterministic).
  - Does **not** cover `setTimeout`/`rAF`-driven DOM mutation, which is what `js/typing-engine.js` is.
  - Whether a *fast-forwarded CSS animation* fires `animationend` is **not stated** (the sentence only names `transitionend`) — **unverified**, and this matters because `js/anim-utils.js:16` pins the intro reveals' final styles in an `animationend` handler. Do not rely on it: wait for the pinning to have happened (see settle strategy) before the screenshot, so the DOM is already in its final state when `animations: 'disabled'` kicks in.
- `caret`: `"hide"` (default) hides the text caret.
- `threshold`: "An acceptable perceived color difference in the YIQ color space between the same pixel in compared images, between zero (strict) and one (lax)." Default 0.2. This is *per pixel*.
- `maxDiffPixels` / `maxDiffPixelRatio`: absolute count / ratio (0–1) of pixels allowed to differ. Prefer `maxDiffPixelRatio` so the budget scales with the viewport and with `fullPage`.
- `scale`: `"css"` = one image pixel per CSS pixel, `"device"` = per device pixel. Use `"css"` so the two runs are immune to any DPR difference.
- `fullPage`: false by default. For a long themed home page, `fullPage: true` catches everything but makes lazy/scroll-triggered animation (AOS) far harder to settle. Recommendation: viewport screenshots at fixed scroll offsets for the animated sections, `fullPage` only for the short pages (privacy, 404).
- `mask`: locators overlaid with `#FF00FF` (`maskColor` configurable). This is the lever for the typing masthead.
- `stylePath`: "File name containing the stylesheet to apply while making the screenshot." Use one shared file to neutralize known non-parity noise (e.g. Calendly's injected widget, scrollbar rendering) identically on both sides.
- `clip`, `omitBackground`, `timeout` as documented.

**Projects.**

```ts
projects: [
  { name: 'desktop-1440', use: { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 } },
  { name: 'mobile-390',   use: { viewport: { width: 390,  height: 844 }, deviceScaleFactor: 1,
                                 isMobile: true, hasTouch: true } },
],
```

Defaults being overridden (<https://playwright.dev/docs/api/class-testoptions>): `viewport` default 1280×720; `deviceScaleFactor` default 1; `isMobile` default false, "Whether the `meta viewport` tag is taken into account and touch events are enabled"; `hasTouch` default false, "Specifies if viewport supports touch events"; `colorScheme` default `'light'`; `reducedMotion` default `'no-preference'`, values `'reduce'`, `'no-preference'`, `null`; `forcedColors` default `'none'`.

**Is a 390-wide desktop-UA viewport enough?** For layout, yes — the site's only breakpoint is 1100 px (`js/script.js:4` `MOBILE_BREAKPOINT = 1100`; `css/styles.css`, `css/mobile-styles.css`, `css/featured-carousel.css` all use `max-width: 1100px`), and 390 < 1100 either way. For *behaviour*, no: `js/theme-cycler.js:594` does

```js
const canHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
```

which gates the hover-to-open theme mega-menu. There are **zero** `hover:`/`pointer:`/`any-hover`/`any-pointer` media queries in the CSS, so this one line is the entire surface. Whether Playwright's `hasTouch`/`isMobile` flips Chromium's `hover`/`pointer` media features is **not documented** (<https://playwright.dev/docs/emulation> says nothing about it) — so do not guess. Add a one-line guard at the top of the suite:

```ts
test('pointer emulation is what we think it is', async ({ page }) => {
  const canHover = await page.evaluate(() =>
    matchMedia('(hover: hover) and (pointer: fine)').matches);
  expect(canHover).toBe(project === 'desktop-1440');
});
```

If it comes out wrong on `mobile-390`, either drop `isMobile`/`hasTouch` (390 px desktop-UA, hover path exercised on both) or use `...devices['iPhone 13']` and accept the WebKit-flavoured UA string. Either is fine for parity as long as OLD and NEW get the identical setting — the harness compares two sites, not a site against reality. Simplest: **run the hover-menu interaction only in the desktop project** and use a click/tap in the mobile project.

`page.emulateMedia({ colorScheme, reducedMotion, forcedColors, media })` is available per-test (<https://playwright.dev/docs/emulation>) if you want a `prefers-reduced-motion: reduce` pass — worth one extra run, since `js/anim-utils.js:308`, `js/featured-carousel.js:138` and `blog/posts/assets/underviewed-art.js:6` all branch on it, and that branch is easy to lose in a rewrite.

### 3.4 Determinism

**Seeded `Math.random`.** `page.addInitScript` "is evaluated in one of the following scenarios: Whenever the page is navigated. Whenever the child frame is attached or navigated… The script is evaluated after the document was created but before any of its scripts were run. This is useful to amend the JavaScript environment, e.g. to seed `Math.random`" (<https://playwright.dev/docs/api/class-page#page-add-init-script>). That is literally the documented use case and satisfies intent §4.9's "seeding `Math.random` from the runner, not by a hook in site code". It runs before `js/theme-bootstrap.js`, which is synchronous in `<head>`.

```ts
await page.addInitScript((seed: number) => {
  let s = seed >>> 0;
  Math.random = () => {                    // mulberry32
    s = (s + 0x6D2B79F5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}, 1234);
```

The consumers this pins: `js/typing-engine.js:165` (`sequences[Math.floor(Math.random() * sequences.length)]` — the random masthead sequence) and `js/theme-cycler.js:59/106/114/255/258` (the palette toy). Caveat: the *sequence of calls* must match between OLD and NEW for the same seed to yield the same picks. If the rewrite changes how many `Math.random()` calls happen before the typing pick, the seed produces a different sequence and the diff is a false positive. Guard against this by asserting the chosen sequence's text on both sides, not just the pixels.

Docs caveat: "The order of evaluation of multiple scripts installed via `browserContext.addInitScript()` and `page.addInitScript()` is not defined" — use exactly one init script.

**Pinned time.** Two levers:
- `page.clock.setFixedTime(new Date('2026-09-05T12:00:00Z'))` — "Sets the fixed time for `Date.now()` and `new Date()`" without touching timers. Enough if you only need a stable rendered date.
- `page.clock.install({ time })` + `clock.pauseAt` / `clock.fastForward` / `clock.runFor` / `clock.resume` for full timer control.

Clock API introduced in **1.45** ("Utilizing the new Clock API allows to manipulate and control time within tests to verify time-related behavior" — <https://playwright.dev/docs/release-notes>). It overrides (<https://playwright.dev/docs/clock>): `Date` / `new Date()`, `setTimeout`/`clearTimeout`, `setInterval`/`clearInterval`, `requestAnimationFrame`/`cancelAnimationFrame`, `requestIdleCallback`/`cancelIdleCallback`, `performance`, `Event.timeStamp`. Hard rule from the docs: "If you call `install` at any point in your test, the call *MUST* occur before any other clock related calls" — and call it before `page.goto`.

**Yes, this can deterministically drive the typing animation.** `js/typing-engine.js` schedules via `setTimeout` (lines 95, 122); with the clock installed and paused, `await page.clock.runFor(4000)` advances it to an exact point, every time, on both sites. The risk is collateral: the clock also owns `requestAnimationFrame`, which AOS and vanilla-tilt use, so a paused clock freezes those too. Practical shape:

```ts
await page.clock.install({ time: new Date('2026-09-05T12:00:00Z') });
await page.goto('/');
await page.clock.runFor(6000);      // past intro reveals + N typing steps
```

`runFor` (rather than `pauseAt` + resume) advances all timers together, so AOS and the typing engine stay in step.

**Network.** `page.route(url, handler)` with `route.abort([errorCode])` or `route.fulfill({status, contentType, body})` (<https://playwright.dev/docs/api/class-route>). Block the third parties that add nondeterminism and latency:

```ts
await page.route('https://assets.calendly.com/**', r => r.abort());
```

Both sides get the identical rules, so blocking is parity-safe by construction. Candidates from `index.html`: `assets.calendly.com` (widget.css:22, widget.js:35 — the CSS may affect layout of the popup trigger, so verify before blocking), `cdnjs.cloudflare.com`, `cdn.jsdelivr.net`. **Do not block fonts** — `fonts.googleapis.com`/`fonts.gstatic.com` change metrics and would mask real diffs; instead wait on `document.fonts.status`.

### 3.5 Settle strategy (concrete, for the animationend + AOS + setTimeout typing case)

The site's three sources of drift and the lever for each:

| Source | Where | Lever |
|---|---|---|
| CSS intro reveals, pinned on `animationend` | `js/anim-utils.js:16` | wait for the pin, then `animations: 'disabled'` |
| AOS scroll reveals | `js/script.js:212` (`AOS.init()`) | wait for `aos-animate` on in-viewport `[data-aos]` |
| Typing masthead (`setTimeout`) | `js/typing-engine.js:95,122,165` | seeded `Math.random` + `page.clock.runFor`, **or** `mask` |
| Infinite `marquee` tickers | skin CSS `content:` | `animations: 'disabled'` cancels to initial state |
| Fonts | Google Fonts links | `waitForFunction(() => document.fonts.status === 'loaded')` |

Recommended `settle(page)` helper, in order:

```ts
async function settle(page: Page) {
  await page.waitForLoadState('load');
  await page.waitForFunction(() => (document as any).fonts.status === 'loaded');
  // Every element that opted into a reveal has finished and been pinned.
  await page.waitForFunction(() =>
    ![...document.querySelectorAll('[data-aos]')].some(el =>
      el.getBoundingClientRect().top < innerHeight && !el.classList.contains('aos-animate')));
  // No CSS/WAAPI animation still running, ignoring infinite ones (marquee).
  await page.waitForFunction(() =>
    document.getAnimations().every(a =>
      a.playState !== 'running' || (a.effect?.getComputedTiming().iterations ?? 1) === Infinity));
  await page.clock.runFor(6000);          // deterministic typing position
}
```

Then screenshot with `animations: 'disabled'` (which cancels the surviving infinite ones) and `mask: [page.locator('#typed-masthead')]` if the clock-driven typing still proves flaky.

Two failure modes to expect and their answers:
- **Typing still differs.** Mask the masthead element out of every screenshot and cover it with a separate deterministic test that asserts `textContent` after a fixed `runFor`. Losing pixel coverage on one line of text is a much better trade than a suite that cries wolf.
- **`getAnimations()` never quiets** because something re-triggers. Fall back to `expect.poll` on a stability sample: poll `page.screenshot()` byte length or a DOM hash until two consecutive samples match. `expect.poll` defaults: 5 s timeout, `intervals: [100, 250, 500, 1000]`, plus a `message` option (<https://playwright.dev/docs/test-assertions>). Note `toHaveScreenshot` already does a two-consecutive-frames check internally on baseline creation.

### 3.6 Scripted interactions

Intent §4.9 lists job tab click, carousel scroll, theme menu open, blog filter. Take a screenshot after each; the baseline/compare mechanics are identical.

- **Hover-open theme menu** — desktop project only, because of the `pointer: fine` gate at `js/theme-cycler.js:594`. `await page.locator('#theme-trigger').hover()` then `settle()` then screenshot. Assert the `matchMedia` guard once (§3.3) so a silent emulation change shows up as a clear failure instead of a blank menu diff.
- **Carousel wheel** — `await page.locator('.featured-carousel').hover(); await page.mouse.wheel(0, 400);`. Docs: "Dispatches a `wheel` event… Wheel events may cause scrolling if they are not handled, and **this method does not wait for the scrolling to finish before returning**" (<https://playwright.dev/docs/api/class-mouse#mouse-wheel>). So always follow with an explicit wait — the carousel has a wheel guard (`js/featured-carousel.js`), so wait on the dot/active-index state, not a fixed sleep: `await expect(page.locator('.carousel-dot.active')).toHaveAttribute('data-index', '1')`.
- **Job tab click / blog filter** — plain `.click()` then `settle()`. The jobs highlight bar writes measured geometry inline (`js/script.js`), so it is a genuinely good parity target: an inline `style` attribute diff will surface in the DOM diff even if pixels round the same.
- **Mobile equivalents** — use `.tap()` (needs `hasTouch: true`) or `.click()` consistently on both sides.

### 3.7 DOM diff without new installs

Playwright ships **no** HTML/DOM comparison helper. `toMatchSnapshot()` does accept "either a string or a Buffer", but it is flagged deprecated for screenshots and its value here is nil since it stores a baseline the same way `toHaveScreenshot` does. `toMatchAriaSnapshot()` (since **1.49**) compares the accessibility tree in YAML: it captures roles, accessible names, text and ARIA state, and explicitly **ignores** "CSS styling and visual properties" and "DOM attributes unrelated to accessibility semantics" (<https://playwright.dev/docs/aria-snapshots>). Since intent §3.2 requires the canonical DOM's **ids and classes** to be reproduced exactly (every skin rule targets them), aria snapshots are too lossy to be the primary check.

Three no-install options, ranked:

1. **`expect(newLines).toEqual(oldLines)` on a normalized dump. ← recommended.** `page.evaluate` a normalizer, split on newlines, compare the arrays; Playwright's own reporter prints the line-level diff. Zero extra code, zero dependencies.
2. **`util.diff` from Node stdlib** if you want a custom compact report. Available on this machine (Node v25.9.0), added in v23.11.0/v22.15.0, **Stability: 1 – Experimental**. `util.diff(actual, expected)` returns `[[op, value], …]` with `-1` delete, `0` unchanged, `1` insert, using Myers, O(N·D) (<https://nodejs.org/docs/latest-v25.x/api/util.html>). Verified locally: on **strings it diffs per character**, on **arrays per element** — so always pass `dump.split('\n')`, never the raw string.
3. **`git diff --no-index --word-diff old.html.txt new.html.txt`** for eyeballing. Verified working with the system git 2.50.1, no install, exits 1 when files differ (so wrap it or use `|| true` in a script). Worth writing the two dumps to disk regardless, purely so this command is available for manual inspection.

Normalizer sketch (run it identically on both pages):

```ts
const dump = await page.evaluate(() => {
  const skip = new Set(['SCRIPT', 'NOSCRIPT']);
  // Attributes that legitimately differ between builds.
  const drop = /^(nonce|data-astro-[\w-]+|data-aos-id)$/;
  const norm = (v: string) => v
    .replace(/\/_astro\/[^"'\s)]+/g, '/_astro/HASH')   // Vite content hashes
    .replace(/\?v=[\w.]+/g, '?v=V')
    .replace(/\s+/g, ' ').trim();
  const walk = (el: Element, depth = 0): string[] => {
    if (skip.has(el.tagName)) return [];
    const attrs = [...el.attributes]
      .filter(a => !drop.test(a.name))
      .map(a => `${a.name}="${norm(a.value)}"`)
      .sort();                                          // attribute order is not semantic
    const out = [`${'  '.repeat(depth)}<${el.tagName.toLowerCase()} ${attrs.join(' ')}>`];
    for (const n of el.childNodes) {
      if (n.nodeType === Node.ELEMENT_NODE) out.push(...walk(n as Element, depth + 1));
      else if (n.nodeType === Node.TEXT_NODE) {
        const t = norm(n.textContent ?? '');
        if (t) out.push(`${'  '.repeat(depth + 1)}#text ${t}`);
      }
    }
    return out;
  };
  return walk(document.documentElement).join('\n');
});
```

Take the dump **after** `settle()` so pinned inline styles and AOS classes are included — those are exactly the behaviours §3.2 cares about. Consider a second, pre-settle dump of the raw server HTML (via `page.request.get(url)` rather than a rendered page) to separate "the emitted HTML differs" from "the JS produced a different DOM" — that distinction will save a lot of debugging time.

**Computed-style sampling** is the cheap complement and catches what the DOM diff cannot (token values, resolved fonts, skin variables):

```ts
const styles = await page.evaluate((sels) => Object.fromEntries(sels.map(sel => {
  const el = document.querySelector(sel);
  if (!el) return [sel, null];
  const cs = getComputedStyle(el);
  const props = ['color','background-color','font-family','font-size','line-height',
                 'letter-spacing','border-radius','padding','margin','box-shadow','transform'];
  return [sel, Object.fromEntries(props.map(p => [p, cs.getPropertyValue(p)]))];
})), ['html','body','.nav','.hero-title','.featured-card','.job-row','footer']);
```

Compare with `expect(newStyles).toEqual(oldStyles)`. Also snapshot the five colour-role custom properties off `<html>` per skin — a single wrong token is the most likely regression in a theme-engine rewrite, and it produces a tiny pixel diff that a `maxDiffPixelRatio` budget would swallow.

### 3.8 The OLD site worktree

Intent §4.11 puts the work on an `astro` branch in a worktree. The harness needs the mirror image: a read-only checkout of today's `main` at a **fixed commit**.

```bash
# owner runs this once, from the repo (a worktree add is a working-tree-changing
# git command — the agent must not run it)
git worktree add --detach ../personal-website-old <sha-of-main-at-cutover-baseline>
```

Rules for the spec:
- The harness **only ever reads** `PARITY_OLD_DIR`. It never runs `git` against it, never writes into it. `python3 -m http.server --directory` is read-only by construction; make that the only access path.
- Locate it by env var with a sane default, so nothing is hardcoded and CI/other machines can override: `const OLD_DIR = process.env.PARITY_OLD_DIR ?? '../personal-website-old'`. Resolve it relative to the config file (`webServer.cwd` "defaults to the directory of the configuration file").
- Fail fast and loud in `globalSetup` if `path.join(OLD_DIR, 'index.html')` is missing, with the exact `git worktree add` command in the error message. Cheaper than debugging a hundred 404 screenshots.
- Pin the commit in the config (or a `parity.baseline` file) and have the harness print it in the run header, so a screenshot set is always traceable to a specific OLD revision.
- Add `personal-website-old` to `.gitignore` only if the owner puts the worktree inside the repo — better to keep it a sibling directory, which needs no gitignore entry.

### 3.9 Playwright in CI (not planned)

Running `npx playwright test` inside the deploy workflow would need `npx playwright install --with-deps` (or `npx playwright install chromium --with-deps`) as a step, because GitHub's Ubuntu runners lack the browser's shared-library dependencies (<https://playwright.dev/docs/ci>). Not needed: the harness is local and gates the merge, not the deploy.

---

## 4. Open questions / risks

**Unverified — test, do not assume:**

1. Whether `https_enforced` survives the `build_type` flip. Capture before/after with `gh api`.
2. Whether `source` is required in the `PUT /pages` body alongside `build_type`. Fallback command given in §2.4.
3. `deploy-pages`' exact failure status when the source is still `legacy` (403/404/400 all have handlers).
4. That Jekyll never runs on an uploaded artifact — strongly implied by the docs and starter workflows, never stated verbatim.
5. That `404.html` at the artifact root is honoured for Actions deploys — the 404 doc predates Actions deploys and says only "the publishing source". Verify against the live site right after cutover.
6. GitHub Pages' trailing-slash 301 behaviour. Undocumented. Design so it never matters.
7. Whether Playwright's `hasTouch`/`isMobile` flips Chromium's `hover`/`pointer` media features. Assert it in the suite (§3.3).
8. Whether `animations: 'disabled'` fires `animationend` for fast-forwarded CSS animations. The docs name only `transitionend`. `js/anim-utils.js` depends on `animationend`, so settle *before* capture rather than relying on this.
9. Whether Playwright tears down `webServer` processes at end of run — behaviourally yes, but not a doc sentence. Check for listeners once after the first run.
10. Whether Playwright's trace viewer / UI mode bind loopback by default. Moot if agents never launch them; `open: 'never'` covers the HTML report.

**Risks worth calling out in the spec:**

11. **`.nojekyll` would vanish silently.** Intent §4.10 puts it in `public/`; `upload-pages-artifact`'s default `--exclude=.[^/]*` drops it. Nobody would notice until something 404s. Drop it, or set `include-hidden-files: true`.
12. **`CNAME` in `public/` is cargo cult** under Actions deploys ("ignored and is not required"). The real risk is the inverse: someone assumes the file is what holds the domain, deletes it from settings, and the domain drops. The domain lives in settings; treat it as infrastructure state, not repo state.
13. **`refresh-chart-data.yml` breaks silently at cutover.** Today its push redeploys Pages. Once the source is Actions, that push (GITHUB_TOKEN-authored) triggers nothing and the chart data quietly stops reaching production. The dispatch step in §2.6 must land in the *same* change as the flip, and the three JSON paths + `docs/prebake-cohort-data.py` need updating for the new layout.
14. **Seeded `Math.random` is only as stable as the call order.** If the rewrite changes how many `Math.random()` calls precede the typing pick, the same seed yields a different sequence and the whole suite goes red for a non-reason. Assert the chosen sequence's text explicitly so the failure names itself.
15. **`maxDiffPixelRatio` hides token regressions.** A single wrong colour variable on one small element is a handful of pixels. Pair every screenshot with the computed-style/token sample from §3.7 — that check is exact and cannot be tuned away.
16. **17 themes × 5 pages × 2 viewports × ~4 interactions is ~680 screenshots per run**, twice (OLD generate + NEW compare). Shard by theme (`--project` / `--grep`) so a single skin can be re-run in seconds, and expect the full sweep to take real minutes.
17. **Two different HTTP servers is an avoidable variable.** Prefer `python3 -m http.server --directory dist` for the NEW side over `astro preview`; identical server semantics on both sides removes a class of false diffs. Run `astro preview` separately if you specifically want to exercise its routing.
18. **The typing masthead may simply not be worth pixel-diffing.** Mask it and assert its text separately. The suite exists to catch regressions the owner would notice, not to prove a random number generator repeats.
