# TODO

## Up next

- [ ] **AI & Job Market post — more charts.** Research done; plan + data sources + pending decisions in [ai-job-market-post-plan.md](ai-job-market-post-plan.md). Blocked on 4 user decisions (D1–D6 in that file) before building.
- [ ] OG / Twitter card images per blog post (so links unfurl nicely when shared — social crawlers don't execute JS, so `post.html` can only carry generic tags; inherent tradeoff of no-build)
- [ ] Case studies for 2–3 strongest projects (problem → constraints → decisions → outcome → what I'd do differently). Either a separate "Case Studies" section on the home page or tag existing posts as Case Study.
- [ ] README.md — the repo has no README. CLAUDE.md documents conventions for agents; the README should sell the architecture to people: what this is, how to run locally, the interesting parts (theme system, config-driven nav, client-side markdown blog), a repo map, and conventions.
- [ ] .editorconfig — zero-dependency way to signal formatting discipline (spec in `docs/BACKLOG.md` git history if needed)

## Polish

- [ ] `loading="lazy" decoding="async"` on blog-post images and the contact map
- [ ] Selected Works scroll-expand treatment — `js/featured-carousel.js` ships a complete scroll-driven "expand" visual behind `EXPAND_VISUAL = false` (styles under `.fc-expand-*` in `css/featured-carousel.css`; respects `prefers-reduced-motion`). If enabled, reconcile its injected heading with the static "03. Selected Works" header.

## Someday / maybe

- [ ] Uses / stack page (`/uses` — editor, tools, hardware, services, dotfiles link)
- [ ] "X reads" badge on blog posts (needs an analytics service — GoatCounter free / Plausible paid / Umami self-hosted. Site can stay on GH Pages; only the counter source moves.)
- [ ] Basic build step (esbuild or similar: minify, bundle, version assets). Only worth it if the site outgrows raw static.
- [ ] Reading list / "things that shaped me" page — books, papers, talks.
- [ ] Astro migration — only if style-mode authoring hurts after 2–3 takeover modes ship; default is to stay no-build. Context in [theme-explorations.html](theme-explorations.html).

## Done

- [x] User-selectable color scheme — not just light/dark but any curated combo from a constrained palette.
- [x] Embedded live demo in at least one post (small interactive thing readers can poke — way higher signal than a project card)

## Resume

_Scored against HackerRank's open-source hiring-agent: open_source 35 / self_projects 30 / production 25 / tech 10, + up to 20 bonus, out of 120. Non-deterministic (same resume scores 66–99). Production and Tech are already maxed; all headroom is **open_source (~6/35)** and **self_projects (~22/30)**. Key mechanic: the LLM scores from resume **text**; the GitHub fetch only reads your **own** repos, so external contributions only count if written on the page._

**Do now — resume text only:**

- [ ] One tight bullet for the About Objects MCP server, the tiered multi-agent setup (varying tool access, per-tier system prompts), Apple Foundation Models as a fully edge model, and the MCP→Foundation Models bridge. (Resume still only mentions the old "MCP server to help PMs" line.) Reinforces maxed Production/Tech; strong interview material, not an ATS mover unless open-sourced.
- [ ] Helm: use the VS Code Marketplace listing URL instead of (or alongside) the GitHub link. Counts as a live demo (+10–20% on that project); currently GitHub only.
- [ ] (Deferred) Optionally add Amino Amigo (App Store, shipped app + live demo) and LexChat / Toolbelt as extra linked projects.

**Biggest lever — open_source (35 pts), the only real upside:**

Need 3 open-source contributions to large, highly starred repos. BookPlayer is contribution #1; need to identify two more.

- [ ] Land the BookPlayer SharePlay PR (TortugaPower/BookPlayer, 2.1k stars, Swift), then add an "Open Source" line: _"Contributed SharePlay to BookPlayer (2.1k-star open-source audiobook app) — [merged PR link]."_ Must be in resume **text** (the fetch can't see external PRs). Now also offsets the all-self_project deduction the just-added GitHub link exposes (without an open-source line, the fetch sees only self_project repos → open_source capped ≤10 + a 3–5 deduction). Moves open_source ~6 → high-teens–20s.
- [ ] Identify and land a 2nd open-source contribution to a high-star repo (Heretic ARA upstream, the MCP→Foundation Models community lib, or another BookPlayer PR).
- [ ] Identify and land a 3rd open-source contribution to a high-star repo.

**GitHub presence:**

- [ ] Get followers on GitHub (contribute visibly, engage with issues, etc.)
- [ ] Get stars on personal projects (EmbeddedSwiftAgent, Helm, Toolbelt)
- [ ] friend-commit to flip your own repo to `open_source` type — only lifts the ≤10 cap + a weak nudge (best case ~6→10–14 on a noisy run). Downside: reads as padding to a human, and is fully dominated by one real BookPlayer line?

**Project demos:**

- [ ] Create demos or links to live demos for each personal project on the resume. Currently projects link to repos only; a working demo (video, hosted app, marketplace listing, etc.) is much stronger signal.
- [ ] Helm: use the VS Code Marketplace listing URL instead of (or alongside) the GitHub link. Counts as a live demo.
- [ ] Embedded Swift Agent: record a demo or asciinema showing the agent in action.
- [ ] Gemma fine-tune: link to model card / inference demo on HuggingFace.
