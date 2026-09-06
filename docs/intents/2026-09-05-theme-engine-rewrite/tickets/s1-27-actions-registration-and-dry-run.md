# S1-27 — Register Actions and prove the finished deployment workflow

**Status:** Unstarted · **Spec milestone:** T7 execution · **Scope:** one deployment rehearsal

**Depends on:** [S1-26](s1-26-final-automated-parity-and-readiness.md)

Assign one agent this ticket plus the [execution contract](../../../superpowers/plans/2026-09-05-spec-1-migration-engine.md). Read [Spec 1](../spec-1-migration-engine-parity.md) §10 steps 2–5 and T7; owner QA occurs only after S1-28. Dependencies supply code and evidence; there is no owner review between tickets.

## Deliverable

The deploy workflow is registered, the migration branch has the full workflow without an add/add conflict, and build/dispatch behavior is proven while the current live deployment remains served.

## Files and external state

- Apply S1-23's registration copy as `.github/workflows/deploy.yml` on main.
- Bring that file into the migration branch by merging main, then replace it with S1-23's full copy.
- Create: `docs/intents/2026-09-05-theme-engine-rewrite/research/deploy-results.md`.
- External operations: the explicit workflow registration changes/dispatches described here, using the execution environment's repository authorization.
- No source/rendering refactor and no Pages build_type flip in this ticket.

## Interfaces

- Migration integration branch is astro; detect actual checkout paths before commands.
- Dispatch uses typed `-F deploy=false`, not a truthy string environment test.
- Chart refresh's `verify_dispatch` path exercises the actual actions:write/GH_TOKEN context without chart changes or a deployment.
- A failed artifact upload specifically due to legacy Pages is retried after the switch in S1-28, as the spec permits; it is recorded as unverified until then.

## Work

- [ ] Confirm the final implementation and reports from S1-26 are present. Apply/register the harmless dispatch-only workflow on main and run it once.
- [ ] Merge main into astro, edit the arriving workflow to the full version and publish the branch changes through the authorized repository workflow.
- [ ] Record current Pages build_type, cname and https_enforced.
- [ ] Dispatch the full astro workflow with deploy=false; inspect the completed run and artifact rather than treating dispatch submission as success.
- [ ] Run the refresh verification-only path on astro and inspect the resulting harmless main dispatch; this proves token/permission behavior even when chart data is unchanged.
- [ ] Verify changed/unchanged refresh behavior from the existing tests and that the full deploy job stayed skipped in the dry run.
- [ ] Record run URLs, branch revisions, observed results and any actual legacy-upload constraint; proceed to S1-28 without an owner review.

## Acceptance and verification

- [ ] Registration run exists on main and succeeds without attempting a legacy-site build.
- [ ] Astro's full build uses npm ci + npm run build and succeeds; deploy job remains skipped.
- [ ] Artifact upload succeeds, or the specifically allowed legacy Pages restriction is documented for immediate retry in S1-28.
- [ ] Refresh token successfully dispatches deploy=false under its real job permissions.
- [ ] Pages remains legacy until S1-28 and there is no add/add workflow conflict.

```bash
gh workflow run deploy.yml --ref main -F deploy=false
gh api /repos/dawsonamf/personal-website/pages --jq '{build_type,cname,https_enforced}'
gh workflow run deploy.yml --ref astro -F deploy=false
gh workflow run refresh-chart-data.yml --ref astro -F verify_dispatch=true
gh run list --workflow deploy.yml
```

Inspect each run to completion with gh run view/watch. Do not mark “dispatched” as “passed.”

## Agent handoff

Record changed files, commands and exit results, and any interface adjustments in the completion report. Resolve implementation failures in scope; do not replace failed assertions with broader exclusions. Leave owner QA to the end of the complete migration.
