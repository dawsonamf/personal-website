# S1-26 automated parity and readiness results

Recorded 2026-09-09 against `engine-rewrite` accepted archive
`a53d138e3616a320f6937f414f7f39bc94e7bdb2` plus the twelve code/test changes below. This is
agent-produced automated evidence; the baseline and source manifests identify the tested input.
It does not claim owner QA, S1-27 registration, deployment, or S1-28 live verification.

## Final results

| Scope | Result | Retained evidence |
| --- | --- | --- |
| Units | 515/515, 98 suites, 0 failed/skipped, producer-through-wrapper 0 / tee 0, 1.61s | `final-v4/acceptance-final-a1/logs/unit.log`; `meta/unit-command.txt`, `meta/unit-exits.txt` |
| Serial build and negative fixtures | 142/142, 19 suites, 0 failed/skipped, producer-through-wrapper 0 / tee 0, 43.57s | `final-v4/acceptance-final-a1/logs/build-escalated.log`; `meta/build-command.txt`, `meta/build-exits.txt` |
| Component browsers | 138/138 in 10 files, producer-through-wrapper 0 / tee 0, 1.8m | `final-v4/acceptance-final-a1/logs/components.log`, `logs/components-list.log`; corresponding `meta/components-*.txt` |
| Structural authoring browsers | 8/8, producer-through-wrapper 0 / tee 0, 26.3s | `final-v4/acceptance-final-a1/logs/authoring.log`, `logs/authoring-list.log`; corresponding `meta/authoring-*.txt` |
| Production build and audit | 177 engine HTML; 300 files / 184 HTML / 128 local-post HTML / 12 sitemap URLs / 4 redirects / 3 public HTML; forbidden output absent | `final-v4/acceptance-final-a1/logs/production-build.log`, `logs/production-audit.log`; corresponding `meta/production-*.txt`; output manifest `12043c7e14a86c47f8a6b6aecd5dd8e46c918f1c7a259989185326dc9eeb8979` |
| Immutable OLD capture | 3/3, producer-through-wrapper 0 / tee 0, 6.8s | `final-v4/acceptance-final-a1/logs/capture.log`, `logs/capture-list.log`; corresponding `meta/capture-*.txt` |
| Normal parity | Actual full list 864. Initial sweep 854 passed / 10 failed in 42.4m, producer 1 / tee 0. Exact named retry list 10; 10/10 passed in 1.3m, producer 0 / tee 0. Coverage is 854 initial passes plus 10 successful retries, not a clean initial footer. | `final-v4/acceptance-final-a1/logs/normal.log`, `logs/normal-list.log`; corresponding `meta/normal-*.txt`; `final-v4/normal-exact10-retry-a1/logs/run.log` and `meta/` |
| Reduced-motion observations | Owner waived exact reduced DOM/visual parity as an S1-26 gate. Root then requested graceful termination: 749 passed / 3 failed / 7 interrupted / 105 not run = 864, producer 130 / tee 0. | `final-v4/acceptance-final-a1/logs/reduced.log`, `logs/reduced-list.log`; corresponding `meta/reduced-*.txt`; `/private/tmp/theme-engine-openai/s1-26-owner-reduced-motion-waiver.md` |

Abbreviated `logs/` and `meta/` paths are relative to
`/private/tmp/theme-engine-openai/s1-26/final-v4/acceptance-final-a1/`.
Paths beginning `final-v4/` are relative to `/private/tmp/theme-engine-openai/s1-26/`.
The retry log is `final-v4/normal-exact10-retry-a1/logs/run.log`; its `meta/` directory
belongs to that retry root. The owner amendment is at
`/private/tmp/theme-engine-openai/s1-26-owner-reduced-motion-waiver.md`.
Literal commands, cwd, environment, absolute output roots, project filters, worker counts, timeouts,
and exits are in `final-v4/acceptance-final-a1/meta/`,
`final-v4/normal-exact10-retry-a1/meta/`, and
[the final verifier report](/private/tmp/theme-engine-openai/s1-26/final-acceptance-verification-report.md)
(SHA-256 `f6627570b6f45ed8ba2b3ecd22ac417afab9ab1e6524be4bfb4dc3d2c96140de`).

## Accepted normal coverage

Exact screenshot, normalized-DOM, computed-token, state, script, and response parity covers Home,
listing, Toolbelt, Embedded Swift Agent, and METR for all 16 themes at desktop-1440 and mobile-390.
The real picker-generated palette cycle is Home -> listing -> Toolbelt -> Embedded Swift Agent ->
METR -> same-theme canonical Home, including navigation, loading-time restoration, and reload.
Privacy and runtime 404 passed separate functional coverage. Home, listing, posts, and Privacy
restore a valid saved palette while the document is loading; runtime 404 retains the explicit D27
and §15.11 after-parse `interactive` exception.

The ten initial failures were all desktop Studio and externally transported dependencies failed on
one side: three Home cases lost NEW fonts; five listing cases lost OLD CDN libraries and their AOS
or icon initialization; one listing wheel case lost OLD AOS; and settled listing stalled at OLD
`waitUntil: load` while external requests remained unresolved. That last artifact does not identify
one unique blocking request. HAR timestamps are request initiation times, not failure-completion
times. Twenty-one actual/expected/diff PNGs are retained under seven nested case directories, but
no pixel-level audit was performed, so pixel-specific causality is not claimed. No host-level cause
is claimed. The exact same-source, same-OLD, same-media, same-trace, same-assertion, same-tolerance,
seven-worker retry passed all ten live; no replay was used. Detailed attribution is
`/private/tmp/theme-engine-openai/s1-26/final-normal-triage.md`, SHA-256
`31b5271980bdefec3bfc4bd744279ec2690117f795af8edd9540695b65add884`.

## Reduced-motion amendment

The owner made exact reduced-motion DOM/visual parity non-blocking because immutable OLD had no
accepted reduced baseline and will inspect that mode later. No owner QA has occurred. The partial
run is retained honestly and is not a pass. Blueprint listing picker-open ended with stable
`--section-rule` inline values OLD `0.2251` and NEW `0.2087`; equivalent code queues a frame before the
reduced branch pins `1`, while the upstream geometry difference remains unclassified. Two Bauhaus
mobile carousel DOM symptoms are also unclassified. A prepared Blueprint diagnostic was cancelled
unused. No reduced-only product, test, mask, tolerance, deadline, trace-policy, or exception change
was made. Details are `/private/tmp/theme-engine-openai/s1-26/final-reduced-triage.md`, SHA-256
`e05c0f4dedad2bf824a0bf06507296f37ffb926bb15fc006cf337959a48ad8a7`.

## Defect and review disposition

The initial 135/142 build sweep exposed five stale assertions and two actual build-validation
defects. Current route/Nav/redirect/YAML-phase assertions were corrected. The shared-prose guard
now requires a positive page build/render touch delta after config-time shim reads, and schema
failures name the absolute `prose.yaml` source while retaining Zod detail and the `ZodError` cause.
Focused verification passed 50/50. A component failure was separately diagnosed as a test
final-observation race between two ResizeObserver deliveries; the exact corrected geometry scope
passed 2/2 without production changes. Post-origin palette navigation also needed selector-safe
masthead observer registration before it could land on Home. No mask, tolerance, seed, or product
visual changed.

Four fresh reviews saw only the readiness diff: two Astra correctness, one Sol security, and one
Sol conventions. All reported no supported findings. The original readiness builder applied the
computed-role test correction. The later build-validation, geometry, and observer corrections were
not covered by those four reviews; root and the S1-26 orchestrator independently inspected the
relevant source and installed type/hook ordering, with focused regressions retained. No second
review loop occurred.

## Tested source and integrity

| Path | Purpose | SHA-256 |
| --- | --- | --- |
| `playwright.config.ts` | Select strict normal or reduced media from the environment. | `42a635dba0b36dfccc481e6804852f7fd3133028337b785f57ace203f09f3388` |
| `harness/motion.ts` | Parse the reduced-motion control without permissive fallbacks. | `e0b2790ead545972cd3831591f8ce36c80042c1c9a6b4201083774af2b5f5b58` |
| `harness/settle.ts` | Assert actual media and retain bounded readiness. | `f5219011e48b46ef5a9ab3b04e1a98f47d3d471f1d6528f93f5a6b8f4dbc0e6b` |
| `harness/parity.spec.ts` | Register route-safe masthead observation for every capture lifecycle. | `02d178410c3c1f48e7a727c30b18ab346a049d3b55e8f83053fdada407cac137` |
| `harness/determinism.ts` | Document selector-safe cross-page recorder ownership. | `ceb1067745f3a24caac2f92e9e444a96a38fbf132c733dd1cd020a68bd7db396` |
| `tests/unit/parity-motion.test.ts` | Cover strict normal/reduced configuration. | `17d5342a34ed7b51287f1c29ea53a614d99f1e49d789141a014c1c709294d5eb` |
| `tests/browser/utility-picker.spec.ts` | Prove one generated palette's five-role persistence across navigation/reload and runtime 404. | `01273414380947f24e74cbe7cbea0dd8550e401f82cb8ef43c30380699c91d3a` |
| `tests/browser/home-sections.spec.ts` | Wait for the causal final ResizeObserver geometry before exact assertion. | `eee4760b24e29146a21edb71b93e90bc8cd1b1e21e4d7792b57a110bb6655e89` |
| `tests/build/composition.test.ts` | Pin the complete current route and fallback composition sets. | `c3f433835c767f8e9f272a7ffcebcae7a6bc60b5cc9d25c2155c9ef9e532d551` |
| `tests/build/content-validation.test.ts` | Pin redirects and exact negative content diagnostics. | `cbd38deaa6c58c01d23b90767d88c522820fdc5b213e853238e4b23e29bcd989` |
| `src/build/checks.ts` | Require shared prose access during page build/render. | `f164595d663a8632c9aec9e16e1516be6abe8cea7a8730ac7b402a8bcc753472` |
| `src/prose/site.ts` | Source-qualify schema failures with detail and cause. | `7d95a2cafb2eb2ddf15ccdea39956e5f69d098d7c7f670f1896607563208a2b4` |

The verifier's pre-document final 407-input live and frozen manifests match at
`6fda8968908ddf5c4eb52e8352e77f2e0019f346fec45ca4a6aedc818121c1a0`; config/harness matches at
`fc16b6624a2da0d8e8eae2d3a5adfebc44754fd93f118efa024d3e4164304ae1`.
Immutable OLD remained clean at `0f196d094ad64383ec58df5472fc12d403f846b3`, manifest
`ef3b70ee3aafddb22816f03e72b822a0baa4ccd6d565350625546e55fc425e11`.
The tests ran against these unchanged twelve code/test paths. This result and the architecture/ticket
updates were written afterward as inert, nonpublic Markdown; those doc-only changes are not part of
the tested 407-input manifest and do not require a code rerun.

Normal's sampled 1,700-PID union had no survivor. Reduced's observed 47-PID union had no survivor.
The exact retry's eleven recorded root/Node PIDs had no survivor. The verifier's separate final
signature snapshot found no matching Chromium, Playwright worker, 8781/8782 server, or retry-output
process. Ports 8781 and 8782 were clear after each
owned lifecycle. User ports 8765/8766/8767, both theme-proof aliases, independent worktree,
protected untracked `harness/scripts 2.ts`, and root execution handoff were preserved. Existing
Node 24.20.0/npm 11.19.0, installed packages, and cached Chromium were reused; installs: none.

LexChat remains the exact external CTA to `https://huggingface.co/spaces/dawsonamf/lexchat`; its
card, image, approved prose, ordering, and other anchors remain, with no local route, redirect,
unused page asset, or sitemap entry. The embedded-subsite credential design remains byte-preserved
outside this migration scope as accepted by root, not personally approved by the owner. Local
static serving does not prove GitHub Pages missing-route behavior for runtime 404. S1-27 owns
Actions registration, and S1-28 owns cutover, live verification, and the owner's QA package.

The final verifier summary is
`/private/tmp/theme-engine-openai/s1-26/final-acceptance-verification-report.md`, SHA-256
`66440f1897c1d1037930bc60f6bfcaf9fcb9cf741badd81a94b4d218a7fc8b82`.
