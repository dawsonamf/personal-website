# Step 7: follow-up corrections R1-R32 (Opus, single agent) — report verbatim

Applied the verifier's R1-R32 plus the orchestrator's two additions (a §16 resolved-ambiguity line and Q14). Pre snapshot `spec-after-fix.md` (1214 lines, 128,089 bytes); post snapshot `spec-after-fix2.md` (1310 lines, 140,135 bytes). Agent totals: 192k tokens, 85 tool uses, ~13 min.

---

Sanity checks all pass: 0 em dashes, 39 D / 14 Q / 10 T all resolving with zero dangling references, 12 tables with 0 malformed rows, every required grep returning the corrected text, and no tracked file modified.

## 1. Per-item status

| Item | Status |
|---|---|
| R1 | done. `./` grouped with `blog/` and `../blog/` → `/blog/`, tagged as the Blog nav item (`nav-config.js:12,18`), never the logo. |
| R2 | done. `css/…`, `../css/…`, the four sibling sheets and `posts/assets/*.css` are now table rows mapping to their root-absolute forms. |
| R3 | **done differently.** Scope written as `a[href]`, `link[href]`, `img[src]`, `iframe[src]` rather than `link[rel=stylesheet][href]`. Reason: the favicons are `link[rel=icon]` / `link[rel=apple-touch-icon]` carrying `resources/favicon-32.png` on home and `../resources/…` on four subpages; a stylesheet-only scope leaves them unmapped and fails DOM equality on every page. `link[href]` with canonical exempted is R3's own correct statement and subsumes the orchestrator's list. One clause to revert if you want it narrower. |
| R4 | done. Bare `#x` is an explicit "not mapped" row with a "Why bare `#x` is not mapped" paragraph; §6.1 rule 2 now states the canonical Nav authors the parity form. |
| R5 | done. `/lexchat/` → itself, `/embedded-swift-agent/` → `/subsites/dawson/embedded-swift-agent/`; `../12years/` dropped with the reason stated. |
| R6 | done. Rule 6 carve-out skips step two on the 404; exception row 11 tightened to "everything above, and nothing further". |
| R7 | done. 95 step properties as `hsla(H,S%,L%,A%)` (`:771`) plus 5 base roles as raw hex (`:766`), in §5.4, D33, the pre-paint sketch, T1's capture and T3's done-when. |
| R8 | done. Four values plus two removals for the 15 non-default themes; six removals for `default`, which has no `tokens` key at all. |
| R9 | done. `__ACTIVE_STYLE` read once at `:167` seeding `state.style` at `:170`; `:273` and `:293`/`:320` read `state.style`. |
| R10 | done. Canonical and OG gained per §15.4; Calendly CSS and AOS stated as staying absent. |
| R11 | done. §15.4, Q2 and exception row 4 all now say gemma4 is unchanged under the Q2 default; row 4's gemma4 clause removed. |
| R12 | done. T3 delivers `paths.ts` (`themeParams`, `href`) and `src/build/posts.ts` (`postIds`); `src/build/*` added to T3's and T5's paths. |
| R13 | done. "step 7's merge". |
| R14 | done. Both gate forms stated verbatim in D32 and in all four §8 rows. |
| R15 | done. `:94-120`, with `setupExpandVisual` `:122-185` named as its only caller. |
| R16 | done. `initJobsMenu` `:271-370`, `data-job` at `:344`, `getElementById` at `:355`, markup `index.html:153-156` and `:163,176,185,197`, in §8 and D17. |
| R17 | done. `theme-cycler.js:276`. |
| R18 | done. `restore()` `:142-154`; `boot()` `:747-770`, invoked `:772-776`. |
| R19 | done. Rejection is the guard at `:689`; `:693-696` is the fallback it falls through to. |
| R20 | done. `:217-224`. |
| R21 | done. All three utility pages load the bootstrap today; "only the cycler" is true after deletion. |
| R22 | done. `blog/post.html:4-58`, with `:27-58` named as the last node. |
| R23 | done. Exact row markup written out: no `tc-row` class, `tc-row-sel` on the active `<li>`, `data-id` on both the `<a>` and the sibling `button.tc-row-card`. |
| R24 | done. Block-level disjoint, file-level collision on `astro.config.mjs`. |
| R25 | done. "gains `actions: write` alongside today's `contents: write`" in §10 and T7. |
| R26 | done. `index.html:18`, marked "for example" and "a sample, not an inventory (19)". |
| R27 | done. Thirteen libraries plus Google Fonts, with Plotly and js-yaml named via `metr-doubling`. |
| R28 | done. §14 item 4 + D20 for the worktrees. |
| R29 | done. `privacy/index.html:22-127` and `404.html:44-68`, both footer blocks named with line numbers. |
| R30 | done. `:704-706`, `:370-387`, `:674-678`. |
| R31 | done. Stated as a sequence `boot()` imposes (`:751`, `:754`), with `applyColors` → `applyDerivedNeutrals` (`:187`) as the one real edge. |
| R32 | done. "Two on canonical routes, one on themed routes; a structural theme may add its own" in D4 and §5.4. D32 carries no such count, so nothing to change there. |
| §16 addition | done. New "Resolved ambiguities" paragraph recording the intent §4.7 vs D13 reading. |
| §13 Q14 | done. Added at the end of the table with the D13 reading as the default; preamble notes only a "no" changes scope. |

Two small tightenings I made while checking rule 6 against §6.1: the `?style=<id>` row is marked as finished at step one (theming it twice would produce `/<theme>/<id>/…`), and the static-asset targets are stated as never taking the theme, because `/blog/blog-listing-styles.css`, `/privacy/privacy-styles.css` and `/lexchat/lexchat-styles.css` do **not** match `href()` rule 5's prefix list. They are `public/` passthroughs no component routes through `href()`, which is why they pass through unthemed. Saying "they pass through rule 5" would have been false against rule 5 as written.

## 2. The rewritten rule 6

Quoted in the spec at §9 (search for "Map, then theme"); reproduced verbatim in the agent's transcript and identical to the spec text at `spec-after-fix2.md`.

## 3. Size and greps

- Before: 1214 lines / 128,089 bytes. After: 1310 lines / 140,135 bytes (+96 lines, +12,046 bytes).
- `grep -c "—"`: **0**.
- ``grep -n '`\./`'``: one hit, line 935, the `/blog/` mapping row.
- `grep -n "hsla"`: five hits showing the 95 + 5 split (D33 L82, §5.4 L475, pre-paint L507, T1 L1123, T3 L1125).
- `grep -n "postIds"`: four hits; T3's deliverables (L1125) now read `src/build/posts.ts` (`postIds`), agreeing with §3.1 L105 and §6.1 L632.
- `grep -n "data-no-tilt"`: both gate forms present in D32 (L81) and all four §8 rows (L790-793).
- `grep -n "step 6\|step 7"` in §10: L1046 is now "step 7's merge" (the merge), L1052 "after step 6" (the `build_type` flip) is correct as-is. The other hits are §9's normaliser step 7, unrelated.
- Reference integrity: 39 D, 14 Q, 10 T defined; zero dangling in either direction. 12 markdown tables (was 11, +1 for rule 6's mapping table), zero malformed rows.

Three greps for stale text returned hits that are corrected context, not leftovers: `:693-696` (now the fallback the `:689` guard falls through to), "only two" (D14's two `content:` literals, unrelated), "disjoint paths" (inside "block-level disjoint paths, not file-level").

## 4. Hygiene

`git status --short` shows exactly six untracked entries and nothing else: the five `docs/*prototype*.html` files and `docs/intents/`. Zero modified tracked files. No git actions of any kind were run beyond read-only `git status`/`git log`. One file changed: the spec. Scratch is `/tmp/spec1-fix2/` only (`before.md`, `rule6.txt`); nothing was created inside the repo. No installs, no servers, no listeners, no browser; `lsof` on 8781 and 8782 returns nothing, and no process from this session is running.

One thing for your call, flagged rather than acted on beyond the R3 note above: the widened rule-6 scope (`link[href]` instead of `link[rel=stylesheet][href]`) is the only place I departed from your instructions, and it is one clause to narrow if you disagree.
