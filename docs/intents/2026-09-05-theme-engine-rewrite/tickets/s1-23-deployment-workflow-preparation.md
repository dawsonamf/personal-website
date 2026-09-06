# S1-23 — Prepare Actions deployment and chart-refresh integration

**Status:** Unstarted · **Spec milestone:** T7 preparation · **Scope:** one deployment configuration change

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
