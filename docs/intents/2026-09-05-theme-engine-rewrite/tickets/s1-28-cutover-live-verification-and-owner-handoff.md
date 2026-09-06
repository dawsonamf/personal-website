# S1-28 — Cut over, verify the live migration and hand over the finished site

**Status:** Unstarted · **Spec milestone:** T9 · **Scope:** one cutover and completed-site handoff

**Depends on:** [S1-27](s1-27-actions-registration-and-dry-run.md)

Assign one agent this ticket plus the [execution contract](../../../superpowers/plans/2026-09-05-spec-1-migration-engine.md). Read [Spec 1](../spec-1-migration-engine-parity.md) §10 steps 6–9, §14/§15; latest owner instruction moves all owner QA to the end. Dependencies supply code and evidence; there is no owner review between tickets.

## Deliverable

The complete migrated site is deployed through Actions and verified live. The owner receives one final QA package after the whole implementation, cleanup and deployment are finished.

## Files and external state

- Execute the prepared Pages setting/astro→main integration/deployment operations from §10.
- Finalize: `docs/intents/2026-09-05-theme-engine-rewrite/research/deploy-results.md`.
- Create: `research/owner-qa.md` under this intent with final URLs, known deliberate changes and a per-theme checklist.
- Verify `CLAUDE.md`, `src/themes/README.md`, architecture and parity reports against the deployed revision.
- Do not fabricate `qa-signoff.md` or mark owner checks completed on their behalf.

## Interfaces

- Input is the tested production revision and completed deployment rehearsal, not a preview build.
- Preserve custom domain and HTTPS settings; old legacy deployment remains served until the successful Actions deploy.
- The owner's later QA is a final handoff activity, not a prerequisite for this ticket or any earlier one.
- Rollback records the actual migration merge SHA, Pages setting and previous production revision.

## Work

- [ ] Reconfirm production build/report revision; apply Pages build_type=workflow and verify cname/https_enforced. Reassert HTTPS only if changed.
- [ ] If legacy mode prevented artifact upload, rerun deploy=false now and inspect the successful artifact before using it.
- [ ] Merge astro into main as the single migration merge, publish it and watch the resulting Actions build/deploy to completion.
- [ ] Verify live home/theme paths, old style query, themed post, old post query with style forwarding, subsites, sitemap and actual path-themed missing-URL fallback.
- [ ] Verify apex → www, HTTPS settings, excluded docs/raw drafts, canonical/noindex and fixture absence from the live deployment.
- [ ] Confirm normal chart-refresh dispatch integration is installed; no fake data commit is required for verification.
- [ ] Record tested rollback commands with the actual merge SHA. If deployment fails, repair or use the prepared rollback within execution authorization; never claim success from an uploaded artifact alone.
- [ ] Hand the owner the finished site plus QA list in registry order: tilt/cursor/hover, picker shuffle/scheme/lock/input, navigation/reload, marquee, mobile jobs, Calendly colors and reduced-motion feel.
- [ ] Include the replacement sitemap-index URL for Search Console. Record submission only if account access permits it; otherwise list it as an account-level follow-up, not an implementation approval.

## Acceptance and verification

- [ ] Live site is served from Actions for the tested production revision.
- [ ] All §10 live checks pass, particularly /brutalist/nope/ on GitHub Pages rather than a local server approximation.
- [ ] Architecture/authoring/repo docs describe deployed code and automated evidence is complete.
- [ ] Owner QA package contains all 16 themes and all accepted §15 changes; its checks remain for the owner to perform themselves.
- [ ] No intermediate owner sign-off was required, and no owner approval is claimed.

```bash
gh api --method PUT /repos/dawsonamf/personal-website/pages -f build_type=workflow
gh api /repos/dawsonamf/personal-website/pages --jq '{build_type,cname,https_enforced}'
```

Live URLs: /, /?style=brutalist, /brutalist/blog/toolbelt/, /blog/post.html?id=helm, /blog/post.html?id=helm&style=doodle, /12years/, /embedded-swift-agent/, /brutalist/nope/, /sitemap-index.xml.

Rollback runbook records `gh api --method PUT /repos/dawsonamf/personal-website/pages -f build_type=legacy` plus `git revert -m 1 <actual-migration-merge-sha>` and the corresponding publish step. Substitute the observed SHA in the delivered report.

## Agent handoff

Record changed files, commands and exit results, and any interface adjustments in the completion report. Resolve implementation failures in scope; do not replace failed assertions with broader exclusions. Leave owner QA to the end of the complete migration.
