# Theme engine execution handoff

Execution switched from Anthropic models to OpenAI models on 2026-09-07, starting with ticket S1-13.

- Last Anthropic implementation commit: `b0c442a57074091abd5fe542b97e7d4331340489`, `S1-03: complete deterministic baseline interactions`.
- First OpenAI implementation commit: `9f6b6168e36b75dc3250e54aaddced071bb314b6`, `S1-13: enforce engine invariants and connect migrated harness`, immediately after `b0c442a` on `engine-rewrite`.
- OpenAI execution uses one Astra orchestrator per ticket, with Sol implementation agents and fresh Astra/Sol reviewers. Tickets run sequentially and each completed ticket is committed and pushed to `engine-rewrite`.
- `main` and production cutover remain outside this execution authorization.

To identify the first OpenAI commit by its exact hash:

```bash
git log --diff-filter=A --format='%H %s' -- docs/intents/2026-09-05-theme-engine-rewrite/execution-handoff.md
```
