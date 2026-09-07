# Deploy workflow files (prepared by S1-23)

Branch note: Spec 1 §10 calls the migration branch `astro`; the real branch is **`engine-rewrite`**.
Nothing in this directory has been registered, dispatched or deployed. S1-23 only wrote files.

## 1. What is here, and why two copies

| File | Installed as | By |
|---|---|---|
| `dispatch-only.yml` | `.github/workflows/deploy.yml` on `main` | S1-27 / owner |
| `deploy-full.yml` | `.github/workflows/deploy.yml` on `engine-rewrite` | S1-27 |

Contract #8 in the execution plan: workflow registration must run on a no-build `main`.

- GitHub only exposes `workflow_dispatch` for a workflow present on the default branch: "This trigger only receives events when the workflow file is on the default branch" (docs.github.com, *Trigger a workflow*).
- A dispatched run executes the file version on the target `--ref`, so `--ref engine-rewrite` builds even while `main` holds the stub.
- The stub goes to `main` **first**, then `main` merges into `engine-rewrite`, and the full copy is written over the file that arrives. The §10 step 7 merge is then an edit, not an add/add conflict.
- Both copies share `name: Deploy to Pages` (one workflow in the Actions UI) and an identical typed `deploy` input (one dispatch payload valid against either ref).

## 2. Live state recorded 2026-09-06 (read-only `gh api`)

Pages: `build_type: legacy`, `cname: www.dawsonamf.com`, `https_enforced: true`, source `main` `/`. Registered workflows: "Refresh chart data" (id 315417164) and `pages-build-deployment`. Default branch `main`. No `deploy.yml` exists anywhere yet.

The `github-pages` environment already exists with `custom_branch_policies: true` and exactly one deployment branch policy. `gh api repos/dawsonamf/personal-website/environments/github-pages/deployment-branch-policies`:

```json
{"total_count":1,"branch_policies":[{"id":7293733,"node_id":"MDE2OkdhdGVCcmFuY2hQb2xpY3k3MjkzNzMz","name":"main","type":"branch"}]}
```

## 3. S1-27 steps (owner/S1-27 executes; S1-23 executed none of these)

**i. Register the stub on `main`.** On a `main` checkout:

```bash
cp docs/intents/2026-09-05-theme-engine-rewrite/research/deploy/dispatch-only.yml .github/workflows/deploy.yml
```

Owner commits and pushes it. Harmless: no `push` trigger, no build, `permissions: {}`.

**ii. Confirm registration and dispatchability.**

```bash
gh workflow list                                   # expect "Deploy to Pages"
gh workflow run deploy.yml --ref main -F deploy=false
gh run list --workflow=deploy.yml --limit 3        # take the run id
gh run watch <run-id>
```

Success proves the workflow is registered on the default branch and dispatchable, on a `main` with no Node project.

**iii. Record the Pages state before anything else changes** (Spec §10 step 4).

```bash
gh api repos/dawsonamf/personal-website/pages --jq '{build_type,cname,https_enforced}'
```

**iv. Install the full copy on the migration branch.** On `engine-rewrite`, merge `main` in first (brings `deploy.yml`), then:

```bash
cp docs/intents/2026-09-05-theme-engine-rewrite/research/deploy/deploy-full.yml .github/workflows/deploy.yml
```

Commit and push.

**v. Build-only dry run on the branch.**

```bash
gh workflow run deploy.yml --ref engine-rewrite -F deploy=false
```

Success proves `npm ci` + `npm run build` on Node 24 and an uploaded artifact. **The `deploy` job must show as skipped**, which is the check that the guard works. If `upload-pages-artifact` fails while Pages is still legacy, that is the legacy-upload fallback: postpone this dry run until after the S1-28 flip (Spec §10 step 5) and record which it was.

**vi. Prove the refresh workflow's token path, without fake data.**

```bash
gh workflow run refresh-chart-data.yml --ref engine-rewrite -F verify_dispatch=true
```

Success proves `actions: write` + `GH_TOKEN`: a run by `github-actions[bot]` appears under "Deploy to Pages" (the registration copy, while `main` is still legacy) with `deploy=false`. No data is regenerated, committed or pushed.

**vii. Optional: rehearse the normal path**, while `main` still holds the harmless stub.

```bash
gh workflow run refresh-chart-data.yml --ref engine-rewrite -F verify_dispatch=false
```

This regenerates the data, commits and pushes to the branch only if upstream actually changed, and on a real commit dispatches `deploy.yml --ref main -F deploy=true` against the stub. Not identical to the schedule event: on `schedule` the `inputs` context is empty rather than false.

## 4. S1-28 cutover pointers (detail lives in Spec 1 §10)

```bash
gh api --method PUT repos/dawsonamf/personal-website/pages -f build_type=workflow
# if that 422s because `source` is required (research §2.4):
echo '{"build_type":"workflow","source":{"branch":"main","path":"/"}}' \
  | gh api --method PUT repos/dawsonamf/personal-website/pages --input -
```

Re-read `https_enforced` and re-assert with `-F https_enforced=true` if it changed. Then merge `engine-rewrite` into `main`: the push triggers `deploy.yml`. Live checks: Spec §10 step 8. Rollback: `-f build_type=legacy` plus reverting the merge commit, since the root `CNAME` and `.nojekyll` make the legacy path work again.

**Chart-data drift.** Until cutover, `main`'s legacy refresh keeps rewriting `blog/posts/assets/*.json` on `main`, while the branch's `public/` copies stay frozen at the time S1-09 copied them. After cutover either run `gh workflow run refresh-chart-data.yml --ref main` once (regenerates from upstream and deploys only if changed) or accept up to seven days of staleness until the Monday cron. Once S1-25 deletes `blog/` on the branch, the final merge may hit a modify/delete conflict on those three legacy JSONs: keep the deletion, and let the post-cutover refresh supply fresh data. No test asserts the two copies agree, on purpose, because S1-25 removes the legacy copies.

## 5. Design notes

- `actions/checkout@v4` is kept in the refresh workflow: proven by the successful run that produced commit `5070950` (data fetched 2026-08-31). S1-27 may bump it.
- No PAT is needed: `actions: write` on `GITHUB_TOKEN` covers `POST /repos/{owner}/{repo}/actions/workflows/{workflow_id}/dispatches`.
- The deploy job's `if` keeps Spec §10's literal expression and carries no ref guard. A `deploy=true` dispatch on a non-`main` ref is blocked instead by the `github-pages` environment's deployment branch policy (`main` only, §2), which S1-28 must not loosen. Dispatching at all requires write access to the repo.

## 6. Verified statically here vs. unverified until S1-27

Verified by `node --test tests/unit/deploy-workflows.test.ts` (29 tests): YAML shape of all three workflows, pins, permissions, the typed inputs and the deploy guard expression, the refresh job's step guards, path/`OUT_DIR` agreement with the files that exist under `public/blog/posts/assets/`, that the Python script compiles, and the commit step's real script under `git`/`gh` PATH stubs (unchanged gives `changed=false` with no commit or push; changed gives commit as the bot, then push, then `changed=true`; **push failure gives a non-zero exit and no `changed=` output at all**, so no dispatch can follow).

Unverified until a real Actions run:

- A real dispatch of the registration copy on legacy `main`.
- Whether `upload-pages-artifact` succeeds while Pages is still legacy (§3 step v fallback).
- `actions/deploy-pages` behavior, including its failure mode before the flip.
- Input validation across refs (a dispatch payload accepted against both file versions).
- `actions: write` via `GITHUB_TOKEN` actually dispatching on this repo.
- Schedule-event evaluation of `${{ !inputs.verify_dispatch }}`: the first real evaluation is the first post-cutover Monday, and step vii rehearses the dispatch form only.
