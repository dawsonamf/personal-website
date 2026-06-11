# TODO

Index of planned work. The specs in this folder carry the details — keep this
file to one line per item, and update both when something lands.

- [ ] **README.md** — repo front door for human readers (architecture, no-build
      philosophy, how to run). Outline in [CLEANUP_SPEC.md](CLEANUP_SPEC.md).
- [ ] **.editorconfig** — formatting discipline without a build step.
      Sketch in [CLEANUP_SPEC.md](CLEANUP_SPEC.md).
- [ ] **Delete orphaned videos** — `resources/Rotobrush_Media.mp4` (542 KB) and
      `resources/turtle.mp4` (644 KB) are referenced nowhere.
      Details in [CLEANUP_SPEC.md](CLEANUP_SPEC.md).
- [ ] **Selected Works scroll-expand treatment** — possible visual upgrade for
      the home-page carousel; the code already exists behind `EXPAND_VISUAL` in
      `js/featured-carousel.js`. Details in [CLEANUP_SPEC.md](CLEANUP_SPEC.md).
- [ ] **Multiple full style versions** — themes over one content source.
      Ship status and the tiered build queue live in
      [STYLE_VERSIONS_SPEC.md](STYLE_VERSIONS_SPEC.md) ("Status + queue" —
      the single source of truth; not restated here). Approved visuals +
      per-style notes in [test-styles.html](test-styles.html), build
      protocol in [STYLE_VERSIONS_SPEC.md](STYLE_VERSIONS_SPEC.md).
      Takeover modes remain after the queue.
- [ ] **Astro migration (maybe, someday)** — only if style-mode authoring
      ergonomics hurt after 2–3 modes ship. Astro (islands, static-first) fits
      this site better than Next; it's still a rewrite + build step, so the
      default is to stay no-build. Context in
      [STYLE_VERSIONS_SPEC.md](STYLE_VERSIONS_SPEC.md).
