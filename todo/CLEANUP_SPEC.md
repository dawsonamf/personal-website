# Spec: Site Polish Backlog

Status: **open items below.** Everything else from the June 2026 fresh-eyes
audit was implemented at the time (aria-labels on icon-only controls,
`rel="noopener noreferrer"` consistency, HTML validity fixes, scoping the
global `.hidden`/`.showing` rules to the jobs panel, one shared
`.name-logo-visible` definition, semantic renames of the `--my*` variables,
Calendly config single-sourced in `js/nav-config.js`, normalized `<head>`
ordering, page-scoped CSS moved beside its page).

## 1. README.md (highest impact)

The repo has no README — it's the first thing a human sees on GitHub.
CLAUDE.md documents conventions for agents; the README should sell the
architecture to people. Suggested outline:

- **What this is** — personal site on GitHub Pages, and the headline design
  choice: zero build step, zero package.json, on purpose. One paragraph on why.
- **Run it locally** — `python3 -m http.server 8765` from the repo root.
- **How it works** (the interesting parts):
  - Theme system: 5 semantic color roles + JS-generated alpha ramps
    (`--text5`…`--text95`), applied before first paint by the synchronous
    `js/theme-bootstrap.js`; `js/theme-cycler.js` is the palette easter egg.
  - Config-driven chrome: `js/nav-config.js` renders the nav menus and social
    links everywhere from one config.
  - Client-side blog: markdown + frontmatter in `blog/posts/`, rendered by
    `blog/blog-post.js` (marked + mermaid + highlight.js, JSON-LD, read time,
    code-copy buttons), indexed by `BLOG_POSTS` in `js/blog-data.js`.
  - Shared engines: typing animation (`js/typing-engine.js`), featured
    carousel (`js/featured-carousel.js`), animation helpers (`js/anim-utils.js`).
- **Repo map** — one line per directory.
- **Conventions** — 1100px breakpoint, pinned CDN versions, image size budgets
  (or just link CLAUDE.md).
- Optionally a coy "there are easter eggs" line rather than spoiling them.

## 2. .editorconfig

No build step means no formatter config — .editorconfig is the zero-dependency
way to signal formatting discipline. Sketch:

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

## 3. Delete orphaned videos

`resources/Rotobrush_Media.mp4` (542 KB) and `resources/turtle.mp4` (644 KB)
are referenced by nothing (checked June 2026); both remain recoverable from
git history after deletion. Re-verify before deleting:

```sh
grep -rn "Rotobrush_Media.mp4\|turtle.mp4" --exclude-dir=.git .
```

## 4. Selected Works: scroll-expand treatment

`js/featured-carousel.js` ships a complete scroll-driven "expand" visual
behind `EXPAND_VISUAL = false`: a backdrop that grows to full bleed as you
scroll, with its own fading heading (styles in `css/featured-carousel.css`
under `.fc-expand-*`; respects `prefers-reduced-motion`). Parked as a possible
upgrade to the home-page Selected Works section. If enabled, reconcile its
injected heading with the static "03. Selected Works" section header — today
both would render.

## Considered, not scheduled

- **lexchat tab title** lacks the `| Dawson Metzger-Fleetwood` suffix the other
  pages use — visible text change, trivial whenever wanted.
- **`loading="lazy" decoding="async"`** on blog-post images (one line in the
  marked image renderer) and the contact map — safe perf win, just unrequested.
- **Splitting `css/styles.css`** — ~900 well-sectioned lines; splitting adds
  requests and per-page boilerplate for no real gain.
- **Deduplicating the color-math helpers** (theme-bootstrap / theme-cycler /
  featured-carousel each carry a copy) — theme-bootstrap must stay
  self-contained to run pre-paint, and the remaining overlap is too small to
  justify a new load-order dependency.
- **Renaming `resources/` files for case consistency** — churn with no payoff;
  the URLs are content.
- **Per-post OG tags** — social crawlers don't execute JS, so `post.html` can
  only carry generic tags; inherent tradeoff of the no-build design (worth a
  README note).
