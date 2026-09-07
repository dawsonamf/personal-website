# S1-23 — Prepare Actions deployment and chart-refresh integration

**Status:** Done with risks 2026-09-07 · **Spec milestone:** T7 preparation · **Scope:** one deployment configuration change

**Depends on:** [S1-09](s1-09-static-assets-and-vendoring.md)

Assign one agent this ticket plus the [execution contract](../../../superpowers/plans/2026-09-05-spec-1-migration-engine.md). Read [Spec 1](../spec-1-migration-engine-parity.md) §10, D18/D21 and §14. Dependencies supply code and evidence; there is no owner review between tickets.

## Deliverable

Concrete registration/full deployment workflow files and the migrated chart-refresh workflow, ready for agents to execute at the end without intermediate owner QA.

## Files

- Create: `docs/intents/2026-09-05-theme-engine-rewrite/research/deploy/dispatch-only.yml`, `deploy-full.yml` and `README.md` in that deploy directory.
- Modify: `.github/workflows/refresh-chart-data.yml`, `docs/prebake-cohort-data.py` OUT_DIR only.
- Create: `tests/unit/deploy-workflows.test.ts`.
- Read: `.nvmrc`, package scripts and the existing refresh workflow.
- Do not edit src, public assets, package scripts or `.github/workflows/deploy.yml` yet. S1-27 installs the arriving registration file, avoiding an add/add merge.

## Interfaces

- Registration copy has workflow_dispatch with typed deploy boolean default false, no push trigger and no deployment. Its harmless registration job must work on legacy main without package.json.
- Full copy: checkout@v7 → setup-node@v7 (.nvmrc, npm cache) → npm ci → npm run build → upload-pages-artifact@v5 (dist); deploy-pages@v5 in github-pages environment, concurrency pages.
- Full deploy condition: `github.event_name == 'push' || inputs.deploy`; push restricted to main.
- Refresh preserves contents:write and adds actions:write and GH_TOKEN from github.token. Only a real changed-data commit triggers the normal `gh workflow run deploy.yml --ref main -F deploy=true`.
- Add a narrow workflow_dispatch `verify_dispatch` boolean default false: its verification-only path uses the same job permissions/token to dispatch deploy=false without regenerating, committing or pushing chart data. S1-27 uses this when upstream data is unchanged.

## Work

- [ ] Prepare the harmless default-branch registration copy and the full migration-branch workflow. Include required contents-read/pages-write/id-token permissions for deployment.
- [ ] Use the production build command; never set PROSE_DRAFTS=allow in deploy and never add a vendor lifecycle hook.
- [ ] Update refresh path references and Python OUT_DIR to public/blog/posts/assets.
- [ ] Preserve the no-change branch; dispatch only after a successful real commit/push in the normal path.
- [ ] Implement the verification-only dispatch path with deploy=false so token/permission behavior can be tested without fake chart changes.
- [ ] Test typed input conditions, permissions being additive, changed/unchanged branches and verify-only behavior with subprocess stubs.
- [ ] Document exact application/dispatch commands and the legacy-upload fallback. Registration and deployment execution belong to S1-27/S1-28, after the completed implementation.

## Acceptance and verification

- [ ] Registration can run against legacy main without installing Node or trying to build the old site.
- [ ] Dispatch deploy=false runs build but cannot run the full workflow's deploy job; pushes to main deploy.
- [ ] Refresh retains contents:write, receives GH_TOKEN and has actions:write.
- [ ] No-change does not create commits or normal deploys; verify-only cannot change data or deploy.
- [ ] Only one OUT_DIR/path destination exists; workflow changes preserve unrelated behavior.
- [ ] Version pins remain those in the spec, with no withastro/action substitution.

```bash
node --test tests/unit/deploy-workflows.test.ts
```

No external operation is performed merely by preparing these files.

## Agent handoff

Record changed files, commands and exit results, and any interface adjustments in the completion report. Resolve implementation failures in scope; do not replace failed assertions with broader exclusions. Leave owner QA to the end of the complete migration.

## Completion report

Done with risks, 2026-09-07 (work began 2026-09-06). Ran on Node v25.9.0 (Node 24 not installed; `.nvmrc` = 24 stays the CI contract). Worktree fast-forwarded to `63ecfdc` before work; `npm ci` exit 0, no other installs. Nothing registered, dispatched, pushed or deployed; no `gh` writes; no git write actions (everything below is uncommitted for the merge agent). No listeners started (`lsof`/`pgrep` empty after every run).

**Created:** `docs/intents/2026-09-05-theme-engine-rewrite/research/deploy/dispatch-only.yml` (49 lines: registration copy for `main`, `workflow_dispatch` only, typed `deploy` boolean default false, `permissions: {}`, one echo job, no `uses`), `research/deploy/deploy-full.yml` (72: `push: [main]` + the same input; workflow `contents: read`; build = checkout@v7 → setup-node@v7 `.nvmrc`/`cache: npm` → `npm ci` → `npm run build` → upload-pages-artifact@v5 `dist`; deploy = `needs: build`, `if: github.event_name == 'push' || inputs.deploy`, job-level `pages: write` + `id-token: write`, `github-pages` environment, deploy-pages@v5; `concurrency: pages`), `research/deploy/README.md` (119: install/dispatch runbook, cutover pointers, drift note, verified-vs-unverified), `tests/unit/deploy-workflows.test.ts` (410, 29 tests).
**Modified:** `.github/workflows/refresh-chart-data.yml` (40 → 83: paths → `public/blog/posts/assets/`, `actions: write` added beside `contents: write`, `id: commit` + `changed=` outputs, "Redeploy Pages" step `gh workflow run deploy.yml --ref main -F deploy=true` gated on `changed == 'true'`, `verify_dispatch` boolean input whose only step is `gh workflow run deploy.yml --ref main -F deploy=false`, step-level `GH_TOKEN: ${{ github.token }}` on the two `gh` steps; cron, checkout@v4, bot identity and message preserved), `docs/prebake-cohort-data.py` (`OUT_DIR = REPO / "public" / "blog" / "posts" / "assets"` plus the three docstring path lines). `.github/workflows/deploy.yml` deliberately not created.

**S1-27 steps (exact commands in `research/deploy/README.md` §3; owner commits/pushes, nothing here was run):** (i) `cp research/deploy/dispatch-only.yml .github/workflows/deploy.yml` on `main`, commit, push: registers the workflow on the default branch, harmless (no push trigger, no build). (ii) `gh workflow list`; `gh workflow run deploy.yml --ref main -F deploy=false`; `gh run list --workflow=deploy.yml --limit 3`; `gh run watch <run-id>`: proves registration and dispatchability on a no-build `main`. (iii) `gh api repos/dawsonamf/personal-website/pages --jq '{build_type,cname,https_enforced}'`: records the pre-flip state. (iv) on `engine-rewrite` merge `main` in, then `cp research/deploy/deploy-full.yml .github/workflows/deploy.yml`, commit, push: the full workflow replaces the arriving file (no add/add conflict at cutover). (v) `gh workflow run deploy.yml --ref engine-rewrite -F deploy=false`: proves `npm ci` + `npm run build` on Node 24 and the artifact upload; the deploy job must show skipped. Legacy-upload fallback: if `upload-pages-artifact` fails under legacy Pages, postpone this dry run until after the S1-28 flip (Spec §10 step 5). (vi) `gh workflow run refresh-chart-data.yml --ref engine-rewrite -F verify_dispatch=true`: proves `actions: write` + `GH_TOKEN` (a `github-actions[bot]` run appears under "Deploy to Pages", the stub on `main`); no data touched. (vii, optional) the same with `-F verify_dispatch=false`: full normal-path rehearsal against the harmless stub. S1-28: flip `build_type=workflow`, merge `engine-rewrite` → `main`, live checks, rollback (README §4, Spec §10 steps 4-9).

**Commands and results:** `node --test tests/unit/deploy-workflows.test.ts`: tests 29, pass 29, fail 0 (builder, four reviewers and orchestrator). `npm run test:unit`: tests 86, pass 86, fail 0. `./node_modules/.bin/tsc --noEmit -p tsconfig.json`: exit 0. Builtin `compile()` of the Python script: exit 0; no `docs/__pycache__`. js-yaml parse of all three workflows: `on` keys `[workflow_dispatch]`, `[push, workflow_dispatch]`, `[schedule, workflow_dispatch]`. `grep -rn 'blog/posts/assets' .github/workflows docs/prebake-cohort-data.py`: every hit `public/`-prefixed. Read-only `gh api`: Pages `build_type: legacy`, `cname: www.dawsonamf.com`, `https_enforced: true`; workflows registered: "Refresh chart data" (315417164), `pages-build-deployment`; `github-pages` environment has one deployment branch policy, `main`; latest action releases `v7.0.1`/`v7.0.0`/`v5.0.0`/`v5.0.1` match D21's majors. Docs quoted in the README: workflow must exist on the default branch; `GITHUB_TOKEN` events create runs only for `workflow_dispatch`/`repository_dispatch`; `permissions: {}`; deploy-pages needs `pages: write` + `id-token: write`. `git status --short`: exactly the two modified files, the new `research/deploy/` directory and the new test; `CNAME`, `.nojekyll`, `public/`, legacy `blog/posts/assets/` untouched.

**Review:** four fresh reviewers (2 correctness on Fable, security and conventions on Opus); no high findings; one medium confirmed twice (the `py_compile` check passed locally only because Apple's python3 sets `sys.pycache_prefix`; replaced by builtin `compile()`). One fix pass covered: em dashes removed; wrong "`-F` is typed" rationale corrected (see erratum); false "python step never sees the token" claim corrected; stub PATH restricted to the stub directory with `/bin/bash` absolute (a misnamed stub can no longer reach the real `gh`); failed-push case asserts the failure came from `push`; new tests: build job has no `if`, every non-checkout refresh step is guarded and only the two dispatch steps run `gh`; README reordered (Pages state recorded before the branch dry run), `gh run watch <run-id>`, drift note, optional rehearsal, environment policy recorded, duplicated design notes removed.

**Deviations / interface adjustments:** deploy permissions are job-level least privilege (workflow `contents: read`; deploy job `pages: write` + `id-token: write`) rather than research §2.2's workflow-level block; `GH_TOKEN` is step-level on the two `gh` steps; `concurrency` carries `cancel-in-progress: false` (research §2.2); the Python docstring's three path lines were updated with `OUT_DIR` so the file has one destination; the test's forbidden-token check runs on comment-stripped YAML (`dump(load())`) because the headers legitimately name `withastro/action` and `PROSE_DRAFTS`; the test is 410 lines (stub harness). Spec erratum for the orchestrator: Spec §10 says the dispatch "passes it typed" with `-F`; for `gh workflow run`, `-F` sends a string like `-f`. The guard is correct because the input is `type: boolean` and the `inputs` context preserves booleans; the command is unchanged.

**Accepted risks (each with reason):** (1) No ref guard on the deploy job: Spec §10's literal expression is kept; dispatch needs repo write access and the `github-pages` environment's deployment branch policy (`main` only, read 2026-09-06) blocks non-`main` deployments; S1-28 must not loosen it. (2) `actions/checkout@v4` persists the token in `.git/config` during the python step: pre-existing documented behavior the `git push` relies on; unchanged. (3) Pre-existing, out of this ticket's file scope: `prebake-cohort-data.py` copies `observation_date`/`vintage` strings from a third-party bucket into JSON that `public/blog/posts/assets/cohorts-chart.js` writes via `innerHTML`; with automatic dispatch this is an unattended deploy path if that bucket were compromised. Owner follow-up: a one-line regex validation in the generator (ticket said OUT_DIR only). (4) Chart-data drift: `main`'s legacy refresh keeps updating `blog/posts/assets/*.json` until cutover while `public/` copies are frozen; S1-28 dispatches `refresh-chart-data.yml --ref main` once after cutover or accepts ≤ 7 days; once S1-25 deletes `blog/`, the final merge may hit a modify/delete conflict on those three files (keep the deletion). (5) The branch's refresh workflow dispatches `deploy.yml`, which does not exist on `main` until S1-27 step (i); do not dispatch the branch refresh before it. (6) Step (vi) proves permission and token only (the stub runs, not a build); build proof is step (v). (7) Node 25 locally instead of 24 (environment). (8) Legacy `blog/posts/assets/*.json` stay tracked and go stale until S1-25 removes them (single writer/committer destination still holds).

**Unverified until S1-27 (static checks stand in):** real dispatch of the registration copy on legacy `main`; artifact upload under legacy Pages; `deploy-pages` behavior before the flip; input validation across refs; `actions: write` via `GITHUB_TOKEN` on this repo; schedule-event evaluation of `${{ !inputs.verify_dispatch }}`.

**Environment blocks:** none.
