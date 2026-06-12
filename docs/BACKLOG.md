# Backlog

Planned work, one section per item. Theme-system architecture, ship status,
and the skin build queue live in [THEMES.md](THEMES.md), not here.

## README.md (highest impact)

The repo has no README — the first thing a human sees on GitHub. CLAUDE.md
documents conventions for agents; the README should sell the architecture to
people: what this is (GitHub Pages site, zero build step on purpose), how to
run it locally (`python3 -m http.server 8765`), the interesting parts (theme
system with 5 semantic color roles + JS-generated alpha ramps applied
pre-paint; config-driven nav/socials in `js/nav-config.js`; client-side
markdown blog), a one-line-per-directory repo map, and conventions (1100px
breakpoint, pinned CDN versions, image size budgets — or just link
CLAUDE.md). Optionally a coy "there are easter eggs" line.

## .editorconfig

No build step means no formatter config — .editorconfig is the
zero-dependency way to signal formatting discipline:

```ini
root = true

[*]
charset = utf-8
end_of_line = lf
insert_final_newline = true
indent_style = space
indent_size = 2
trim_trailing_whitespace = true

[*.md]
trim_trailing_whitespace = false
```

## Delete orphaned videos

`resources/Rotobrush_Media.mp4` (542 KB) and `resources/turtle.mp4` (644 KB)
are referenced by nothing (checked June 2026); both stay recoverable from
git history. Re-verify before deleting:

```sh
grep -rn "Rotobrush_Media.mp4\|turtle.mp4" --exclude-dir=.git .
```

## Selected Works: scroll-expand treatment

`js/featured-carousel.js` ships a complete scroll-driven "expand" visual
behind `EXPAND_VISUAL = false` (styles under `.fc-expand-*` in
`css/featured-carousel.css`; respects `prefers-reduced-motion`). Parked as a
possible upgrade to the home-page Selected Works section. If enabled,
reconcile its injected heading with the static "03. Selected Works" header —
today both would render.

## Considered, not scheduled

- **lexchat tab title** lacks the `| Dawson Metzger-Fleetwood` suffix other
  pages use — visible text change, trivial whenever wanted.
- **`loading="lazy" decoding="async"`** on blog-post images and the contact
  map — safe perf win, just unrequested.
- **Splitting `css/styles.css`** — ~900 well-sectioned lines; splitting adds
  requests and boilerplate for no real gain.
- **Deduplicating the color-math helpers** (theme-bootstrap / theme-cycler /
  featured-carousel each carry a copy) — theme-bootstrap must stay
  self-contained to run pre-paint; the remaining overlap is too small to
  justify a load-order dependency.
- **Renaming `resources/` files for case consistency** — churn, no payoff.
- **Per-post OG tags** — social crawlers don't execute JS, so `post.html`
  can only carry generic tags; inherent tradeoff of no-build (README note).
- **Astro migration (maybe, someday)** — only if style-mode authoring hurts
  after 2–3 takeover modes ship; default is to stay no-build. Context in
  [THEMES.md](THEMES.md).
