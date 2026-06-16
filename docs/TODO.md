# TODO

## Up next

- [ ] OG / Twitter card images per blog post (so links unfurl nicely when shared — social crawlers don't execute JS, so `post.html` can only carry generic tags; inherent tradeoff of no-build)
- [ ] Uses / stack page (`/uses` — editor, tools, hardware, services, dotfiles link)
- [ ] Case studies for 2–3 strongest projects (problem → constraints → decisions → outcome → what I'd do differently). Either a separate "Case Studies" section on the home page or tag existing posts as Case Study.
- [ ] "X reads" badge on blog posts (needs an analytics service — GoatCounter free / Plausible paid / Umami self-hosted. Site can stay on GH Pages; only the counter source moves.)
- [ ] Embedded live demo in at least one post (small interactive thing readers can poke — way higher signal than a project card)
- [ ] README.md — the repo has no README. CLAUDE.md documents conventions for agents; the README should sell the architecture to people: what this is, how to run locally, the interesting parts (theme system, config-driven nav, client-side markdown blog), a repo map, and conventions.
- [ ] .editorconfig — zero-dependency way to signal formatting discipline (spec in `docs/BACKLOG.md` git history if needed)

## Polish

- [ ] `lexchat` tab title lacks the `| Dawson Metzger-Fleetwood` suffix other pages use
- [ ] `loading="lazy" decoding="async"` on blog-post images and the contact map
- [ ] Selected Works scroll-expand treatment — `js/featured-carousel.js` ships a complete scroll-driven "expand" visual behind `EXPAND_VISUAL = false` (styles under `.fc-expand-*` in `css/featured-carousel.css`; respects `prefers-reduced-motion`). If enabled, reconcile its injected heading with the static "03. Selected Works" header.

## Someday / maybe

- [ ] Basic build step (esbuild or similar: minify, bundle, version assets). Only worth it if the site outgrows raw static.
- [ ] User-selectable color scheme — not just light/dark but any curated combo from a constrained palette.
- [ ] Reading list / "things that shaped me" page — books, papers, talks.
- [ ] Astro migration — only if style-mode authoring hurts after 2–3 takeover modes ship; default is to stay no-build. Context in [theme-explorations.html](theme-explorations.html).
