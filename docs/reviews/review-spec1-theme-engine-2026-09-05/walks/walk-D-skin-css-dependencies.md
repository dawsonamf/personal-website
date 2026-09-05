# Walk D: skin CSS dependencies (Explore subagent of the thermonuclear reviewer)

## 1. theme-base.css (115 lines) — engine attribute hooks

All three attributes are live, set in `js/theme-bootstrap.js:704-706` (`data-style` = entry.id; `data-still` if `flags.still`; `data-no-tilt` if `flags.tilt === false`).

**`[data-style]`** (presence-only, not per-skin): `css/themes/theme-base.css:13, :18, :24, :28` (post `pre` / code-copy button), `:37, :42, :47-48` (blog footers), `:56-59, :63-64` (typing-text, inside a media query), `:108` (`html[data-style] .nav-container`, ≤1100px), `:112` (`html[data-style] .contact-image-wrapper`, ≤1100px).

**`[data-still]`** — four rules, and it disables exactly these:
- `:71` `[data-still] [data-aos]` → AOS scroll entrances (opacity/transform/transition forced). Live: `data-aos` present in `index.html`, `blog/index.html`.
- `:77` `[data-still] #cursor-container { display: none }` → cursor follower (`js/cursor-follow.js`, `index.html`).
- `:81` `[data-still] .tc-toggle:hover { transform: none }` → dock toggle hover lift.
- `:85` `[data-still] .tc-dock.tc-dropdown { animation: none }` → dropdown open animation.

It does **not** touch tilt (that's `data-no-tilt`) and does not blanket-disable CSS keyframe animations — skins' own marquees/keyframes keep running.

**`[data-no-tilt]`**: `:92-95` (`.card, .blog-card, .fc-card-image, .blog-image` → `transform: none !important`), `:99` (`.js-tilt-glare { display: none }`). Glare is only ever produced by `js/featured-carousel.js:198` (`glare: true`); `js/script.js:264, :403` use `glare: false`.

**`.tc-toggle` per sheet** (grep -c, matching lines): banknote 1, bauhaus 2, blueprint 1, broadsheet 1, brutalist 2, chinoiserie 2, doodle 1, field-notes 0, gallery 1, grid 1, marquee 0, miami-deco 2, neo-pop 2, studio 0, wheatpaste 2, theme-base 1 · inactive: constructivist 2, space 1, vapor 1, wanted 2. Sheets with 2 = base + `:hover` variant; the three zeros (field-notes, marquee, studio) leave the toggle to `css/theme-cycler.css`.

## 2. `content:` declarations

- `css/themes/marquee.css:572`: `content: var(--ticker-run, "✷ WEB ✷ iOS ✷ VISIONOS ✷ MACHINE LEARNING ✷ REINFORCEMENT LEARNING …");` (that 5-term group repeats 12×, trailing space, closing quote).
- `css/themes/doodle.css:535`: `content: 'currently here \2713';`

Every **other** `content:` value containing letters/words across all 20 sheets:
- `css/themes/blueprint.css:652`: `"FIG. " counter(blueprintFig, decimal-leading-zero)`
- `css/themes/space.css:418`: `'[ '` and `:423`: `' ]'` (inactive sheet)

That's the complete set — marquee:572 and doodle:535 are the only prose strings in active sheets besides blueprint's `FIG.` label.

Pure glyph/counter/empty ones: `banknote.css:495, :1235` `'№ '` · `field-notes.css:523` `"№ " counter(fieldNotesFig)` · `brutalist.css:322` `"■ "` · `gallery.css:909` `"·"` · `marquee.css:941` `"(" counter(marquee-bullet, decimal-leading-zero) ")"`, `:1014, :1419` `"✷"` · `studio.css:95` `counter(studio-nav, decimal-leading-zero)`, `:452, :651` `"/"` · `constructivist.css:554` `counter(plan, decimal-leading-zero)` (inactive) · all remaining are `content: ''` / `""`.

## 3. Custom properties

`js/theme-bootstrap.js:671` defines `STEPS = [5,10,…,95]` (19 steps); `:765-773` writes, for each of the 5 roles (`text, bg, primary, secondary, accent` — see `:737`), `--<role>` = hex plus `--<role><step>` with **no separator** (`--text5`, `--primary20`, `--bg95`), as `hsla(h,s%,l%,N%)`. Total: 5 base + 95 ramp steps.

**67 of the 95 ramp steps are referenced anywhere.** By role:
- `--text5,10,15,20,25,30,35,40,45,50,55,60,65,70,75,80,85,90,95` — all 19
- `--bg5,10,20,30,40,50,60,65,70,75,80,85,95` — 13 (missing 15,25,35,45,55,90)
- `--primary5,10,15,20,25,30,35,40,45,50,55,60,75,85` — 14 (missing 65,70,80,90,95)
- `--accent5,10,15,20,25,30,35,40,45,50,55,60,65,70,85` — 15 (missing 75,80,90,95)
- `--secondary40,45,60,70,80,85` — 6 only

Referencing files: every skin sheet (all 20 incl. inactive), plus `css/theme-cycler.css:83`, `css/styles.css:163`, `css/mobile-styles.css:38`, `css/featured-carousel.css:26`, `blog/blog-styles.css:49`, `blog/blog-listing-styles.css:51`, `blog/posts/assets/{cohorts-chart,job-market-chart,metr-chart,underviewed-art}.css`. No `.js` or `.html` reads a ramp step.

Named properties:
- `--ticker-run` — set `js/featured-carousel.js:413`, read `css/themes/marquee.css:572`. Live.
- `--ticker-dur` — set `js/featured-carousel.js:414`, read `css/themes/marquee.css:584`. Live.
- `--section-rule` — set `js/anim-utils.js:244, :293, :316`, read `css/themes/marquee.css:500` (also `:441, :694` comments). Live, marquee-only.
- `--tc-z` — **zero hits repo-wide.** Dead/nonexistent.
- `--neutral-gray` — declared `css/styles.css:27`, recomputed `js/theme-cycler.js:229` (listed in `DERIVED_NEUTRALS`, `:208`), overridden per-skin in `js/theme-bootstrap.js` (`:62, :110, :131, :153, :173, :201, :282, :305, :331, :359, :389, :415, :516, :551, :625`); read at `css/featured-carousel.css:135`, `css/themes/gallery.css:936`, `blog/post.html:39`, `blog/posts/assets/{cohorts-chart.css:36…,heretic-ara-charts.js:24,metr-chart.js:54}`. Live.
- `--prose-*` — **zero hits** anywhere. Confirmed nonexistent today.

## 4. Scoping

Confirmed: **no unscoped rule exists in any active skin sheet.** No `:root` block in any sheet (`grep -n ":root" css/themes/*.css` → empty), no top-level selector lacking `[data-style="…"]`, and no unscoped selector nested inside `@media` blocks. Spot-checks of brutalist, marquee, grid all clean; the only non-`[data-style]` selectors in `css/themes/` at all are theme-base's `[data-still]`/`[data-no-tilt]` rules.

**Dock**: all 20 sheets match `.tc-dock|.tc-mega|.tc-presets|.tc-action|.tc-schemes|.tc-role|.tc-sw`, though depth varies — grid 6 hits, brutalist 4, marquee/studio/theme-base 1 each.

**Privacy / 404**: `.privacy-*` and `.nf-*` are styled by only 5 sheets — `css/themes/banknote.css` (7 hits), `css/themes/grid.css` (7, e.g. `:861, :865, :873, :882`), `css/themes/constructivist.css` (5, inactive), `css/themes/gallery.css` (5), `css/themes/neo-pop.css` (5). Both are live: `privacy/index.html:18` and `404.html` both load `js/theme-bootstrap.js`, and `404.html` uses 6 `nf-` classes. Other sheets mention "privacy" only in comments.

## 5. Line counts

`theme-base.css` 115 · `studio` 745 · `brutalist` 826 · **`../theme-cycler.css` 887** · `miami-deco` 890 · `chinoiserie` 911 · `space` 959 · `bauhaus` 967 · `broadsheet` 997 · `doodle` 1011 · `vapor` 1020 · `field-notes` 1039 · `grid` 1045 · `gallery` 1093 · `constructivist` 1163 · `blueprint` 1165 · `wheatpaste` 1167 · `neo-pop` 1170 · `wanted` 1266 · `banknote` 1424 · `marquee` 2103. Total 21,963.

Dead weight worth noting: `--tc-z` and `--prose-*` don't exist; 28 of 95 ramp steps are never read, and `--secondary` is nearly unused (6/19).
