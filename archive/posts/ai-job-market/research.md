# AI & the Job Market — post plan & research dossier

> Archived after the Astro rewrite. Paths and publication status below describe
> the legacy site at the time of the research. In this archive, the draft is
> `draft.md`, chart code is in `assets/`, snapshots are in `data/`, and the
> refresh script is `scripts/prebake-cohort-data.py`. See `README.md` for the
> current layout; nothing in this directory is published.

**What this is:** a self-contained handoff for the `ai-job-market` blog post. Research is done; a few design decisions are still open (below). This file is written so a fresh context window can build every chart here without re-doing the research or re-reading the whole conversation.

**Status (2026-07-16):**
- The post exists with ONE live chart already shipped (Software Development vs All Jobs). Title/description are placeholders; the user writes the actual copy later. The post is intentionally content-free for now.
- Nothing here is committed unless the user explicitly asks. The user answers the pending decisions later; do not guess them.
- Caveman response mode was active in the session that produced this; irrelevant to the code.

---

## 0. Resume in 30 seconds

1. Read **§1 (pending decisions)** — 4 of the proposed charts are blocked on a user answer. Don't build those until answered.
2. The existing chart and its patterns are **§3** — every new chart reuses that recipe (fetch → theme vars → toolbar → Plotly.react). Read `blog/posts/assets/job-market-chart.js` as the canonical template.
3. Each proposed chart's data source, columns, and buildability are in **§4** + **§5**.
4. Fetchability/CORS rules are **§6** — this decides live-fetch vs pre-baked JSON vs static-hand-entered. Getting this wrong wastes the most time.
5. Exact numbers for static charts + all citations are **§7 / §8**.

---

## 1. PENDING DECISIONS (blockers — user must answer)

| # | Decision | Options | My recommendation |
|---|---|---|---|
| D1 | **Recent-grad chart format** | ~~(a) two-panel; (b) single mixed-frequency 4-line chart~~ | **DECIDED 2026-07-17: (a), as two SEPARATE charts** — user: no messy mixed-frequency single chart. Chart 1: recent grads vs all workers (NY Fed, monthly unemployment rate). Chart 2: young vs experienced software developers (Canaries, monthly employment index — user confirmed wanted; data verified present). CS-major-specific lines are OUT (annual snapshot only), but the writeup MUST note that gap in prose. |
| D2 | **#6 within-tech bars — static OK?** | ~~static bars vs skip~~ | **DECIDED 2026-07-17: NO CHART.** Within-tech divergence goes in the write-up PROSE only, using the §7 figures. |
| D3 | **#6 source mixing** | ~~Indeed-only vs mixed~~ | **CLOSED (moot — no chart, see D2).** All §7 figures usable in prose. |
| D4 | **#7 rate line** | ~~(a) overlay; (b) skip; (REJECTED) residualized "AI effect" line~~ | **DECIDED 2026-07-17: (a), as an aligned rate strip UNDERNEATH the time-series charts** (shared x, small-multiple stack — user: "can go underneath all charts"). User thinks dual-axis may be OK here but said do NOT do it in the first pass. Rate line = `DFII10`; fed funds encoded as a shaded hiking-cycle band (Mar 2022 → Jul 2023) + caption/prose numbers, not a second line. **BUILT 2026-07-17** (user asked "where's the interest rate stuff") — `#rate-chart` via the cohorts factory: DFII10 monthly average (`rate-data.json`, 2003-01→present, trough −1.07% late 2021, latest 2.3%), accent line, dotted zero baseline, `cfg.bands` shaded rect + bottom label, presets 1Y/5Y(default)/10Y/All, slim height (320px/260px), stat + caption with the 0→5.25-5.50% fed funds numbers. Independent x-window per chart — live x-sync across the stack NOT implemented (deferred; would need relayout broadcast without loops). Never a residual labeled "AI". FRED fetch quirk: Akamai stalls on a browser UA without cookies → `fetch(url, ua=None)` in the prebake script. **SUPERSEDED 2026-07-17 (same day): strip → dual-axis overlay trial.** User: strip "too low to be usable — try the dual y axis and overlay it onto the existing charts i know i know but just try it for me" (explicit override of the dataviz no-dual-axis rule). Built: `cfg.overlay` in the cohorts factory + a mirrored overlay in `job-market-chart.js` — DFII10 as a dashed mid-gray (`theme.rate` = label→text 0.55 blend) line on a right-side `yaxis2` (`overlaying:'y'`, colored ticks, `%` suffix, `fixedrange`, own window-fit range in applyRange/rescaleY/buildChart, right margin 16→46 when shown) on ALL THREE charts, toggled by a `data-flag="rate"` "Interest Rate" checkbox (default ON). Overlay is never % rebased, excluded from the stat readout and the min-one-series rule, and clipped to each chart's own date span so it can't stretch the rangeslider (jobs chart would otherwise grow back to 2003). Strip kept commented out (md HTML block + factory instance + CSS) for easy restore. Jobs-chart caveat: postings are daily, rate is monthly → unified hover lists the rate only on month-firsts. |
| D5 | **JOLTS denominator** | keep as the "is it whole-economy or just tech" context chart, or drop (user already knows JOLTS) | Optional — low effort, high credibility; keep if room |
| D6 | **Which extra sectors** on the sector chart | pick from the 47-sector taxonomy | Suggest Nursing + Construction + Customer Service (clear exposed-vs-not contrast) |
| D7 | **Chart chrome polish (user request 2026-07-17)** | — | **DONE 2026-07-17.** (1) Rangeslider: went simple-slider (mini chart hidden, then borderless pill) across two passes, but user reversed course after the pill still felt like a remnant — FINAL: mini chart RESTORED at the original look (thickness 0.09, 1px border, sliderBg 0.04 blend, no CSS rect overrides) with ONE change: `rangeslider: { yaxis: { rangemode: 'auto' }, yaxis2: { rangemode: 'auto' } }` so the strip keeps its own full-data y scale instead of the default 'match' — the mini chart no longer bounces when the main plot's y refits to the window (our rescaleY writes yaxis.range on every drag). Note: in % Change mode the strip still reshapes while dragging — the rebase rewrites the trace data itself, unavoidable. Captions say "slider" (was "strip"). (2) Non-story line colors → hue rotations of the accent (`rotHueHex`/`rotSafe` in both chart JS: HSL rotate keeping s/l; gray accents no-op; non-hex accents fall back to the old gray blends). Jobs: All Jobs = +180° (`theme.context`). cu: workers +180°, young +90°, college +270°. cs ordinal sweep young→old: 0/36/72/108/144/180°. Chips + stat swatches mirror via CSS relative colors `hsl(from var(--accent) calc(h + N) s l)` with the old blends kept as fallback declarations for pre-relative-color browsers. Rate overlay stays mid-gray reference. Captions: "strip"→"slider". |

---

## 2. The article's argument (the spine — so copy/captions can be written later)

**Make the confound the story, not a caveat.** The chart already has AI-release markers; the reader should be able to see that the AI releases mostly DON'T line up with the breaks — the 2022 rate-hike timing does.

**Three camps in the research:**
1. **"No aggregate shock yet."** Yale Budget Lab (CPS through Apr 2026), the Fed, Brookings: occupational mix, unemployment-by-exposure, and firm hiring all within historical norms. Yale: they'd "detect the house burning down but might miss a small fire." Fed FEDS note (Mar 2026): high-AI-adoption firms are *not* posting fewer jobs.
2. **"Narrow entry-level effect."** Stanford/Brynjolfsson **"Canaries in the Coal Mine"** (ADP payroll): workers 22-25 in the most AI-exposed jobs fell ~13% (Aug 2025 draft) → ~16% (Nov 2025 revision, through Oct 2025) relative to older workers in the same roles; **young software developers −20% from their late-2022 peak.** Adjustment via **headcount, not wages** ("seniority-biased technological change"); concentrated where AI *automates* vs *augments*. Effect grew with more data, didn't mean-revert.
3. **The confound (the honest core).** Indeed's own economists refuse to credit AI for the crash. Brendon Bernard: **"nearly half of the net decline in tech postings occurred before ChatGPT went public."** Svenja Gudell (Apr 2026): it's **"the slow, cyclical unwinding of an unprecedented boom"** (pandemic over-hiring + end of ZIRP + 2022 rate hikes). LinkedIn agrees, section literally headed **"Sluggish hiring is not AI's fault"**; **"changes in real interest rates account for most of the variation in SWE hiring over the past decade."** Acemoglu backs the macro-skeptic side (≤0.71% TFP/decade). "AI-washing" is real (Altman: companies blame AI for layoffs "whether or not it really is about AI").

**The 2026 twist (the hook):** Indeed's newest post — Guillermo Gallacher, **"AI and Job Postings: From Destruction to Creation?" (Jul 8, 2026)** — software-dev postings **recovered to −27.5%** (from the ~−36% trough), **grew ~15% since Claude Code launched** (late Feb 2025) while overall postings fell 7%, and the AI-exposure/decline correlation is **flipping positive**. So the mid-2025 "AI ate entry-level tech" narrative is being partly un-told a year later. Did everyone call the apocalypse early?

**The vendor split (a whole section):** same phenomenon, three datasets, three answers.
- **Revelio Labs** (AI is real): +10pp AI exposure → −11% entry-level demand, +7% non-entry; AI-exposed entry roles −40%+ since Jan 2023. But Jun 2026 (w/ Ramp): heavy AI adopters grew headcount +10.2%.
- **Handshake** (it's macro): AI-exposed entry-level roles are NOT declining faster; "too soon to say." >60% of Class of 2026 pessimistic.
- **Lightcast** (orthogonal): AI-*skill* demand exploding regardless — +28% wage premium (43% with 2+ AI skills); genAI postings 55 (Jan 2021) → ~10,000 (May 2025); 51% of AI-skill postings outside IT.
- **LinkedIn** (macro + creation): +1.3M new AI jobs globally 2023-25; exposure buckets show "no significant differences by AI exposure" in hiring.

**Honest framing:** the correlation is real and replicated (AI-exposed young tech roles fell hardest); the *causal* attribution over the ZIRP confound is contested and, on current evidence, unproven — and the 2026 recovery muddies it further.

---

## 2b. Intro frame — Jevons paradox (added 2026-07-18)

**Register rule (user):** write the post for "the user a few weeks ago" — smart technical reader, zero labor-econ background. Every econ term defined inline in plain words at first use (never "elasticity of demand" without immediately saying what it means: how much more of a thing people buy when it gets cheaper). No econ-blog jargon, no assumed familiarity with the literature.

**The full ladder at a glance (each rung relaxes ONE assumption of the standard model; details in the arc below + §9):**
| Rungs | Assumption relaxed | Content | Outcome variable | Where |
|---|---|---|---|---|
| 1-2 | demand fixity | Jevons; satiation curve | quantities | **this post** (postings chart, Gallacher recovery) |
| 3-4 | factor homogeneity; task fixity | horses/Leontief; new tasks vs AI-learns-them-too | quantities | **this post** (cohort chart, Chart B) |
| 5-9 | wage flexibility; sectoral closure | Ricardo, task model, Baumol, labor share (σ), J-curve | prices | part 2 (§9) |
| seam 3 | distribution | who gets the income; does the demand loop close | income shares | part 3, unlikely (§9) |
| seam 4 | scarcity itself | what stays scarce when intelligence is cheap | — | terminal rung; past it = philosophy, not econ (§9) |

Stopping rule: **a rung earns a place only if it has a chart** — the ladder ends where measurement does.

**The arc (user requirement: elasticity comes EARLY — step 2, not buried after the AI mapping):**

1. **Hook — 1865 coal.** Jevons, *The Coal Question*: more efficient steam engines led to MORE coal burned, not less. Quote: "It is wholly a confusion of ideas to suppose that the economical use of fuel is equivalent to a diminished consumption. The very contrary is the truth."
2. **Household version + the condition, immediately — the satiation curve (user framing 2026-07-18: ONE curve, not two goods).** Hot water: when it got cheap (boil-a-pot era → on-demand heaters), nobody kept weekly-bath usage and pocketed the savings — daily long showers, dishwashers, hot laundry cycles; total hot-water energy use went UP. Then the same good later: water heaters grew for decades, then plateaued — nobody wants a longer shower than the one they already take. Today an efficiency gain would just save energy. Lighting rode the identical curve on a longer runway: candles → kerosene → bulbs, consumption exploded for centuries; by the LED era demand was saturated, so 10× efficiency just cut the bill. **Elasticity** (plain words: how much more of a thing people buy when it gets cheaper) **isn't a fixed property of a good — it's your position on the satiation curve.** Jevons lives on the steep part; it's a condition, not a law, and it runs out. *(All illustrative prose, not data — don't dress up with citations or charts.)*
3. **Map to code.** AI collapses the cost per unit of software. Optimist case: software is still on the steep part — endless latent demand nobody could previously afford (internal tools, one-off apps, long-tail automation). Pessimist case: nearer saturation (or budget-capped) than assumed — every business already runs software. Nobody knows where software sits on the curve — that's the post's question, and the charts are the evidence.
4. **Second piece of fine print — Jevons is about the OUTPUT; jobs are about the INPUT.** Demand for software ≠ demand for developers; the bridge is whether human labor *complements* the technology or is *substituted* by it. The horse example: engines made horsepower cheap → power consumption exploded (Jevons held perfectly for the output) → horses were eliminated anyway (~26M US horses ~1915, down ~90% by 1960) — they were the substituted input. Leontief (1983) applied exactly this to humans. So even wildly elastic software demand only helps devs who stay complements. Current data: AI substitutes junior tasks, complements senior judgment → **the profession can ride the Jevons curve while the entry rung rides the horse curve, simultaneously.** The Canaries cohort chart (22-25 devs −21%, 50+ devs +9%) is literally this picture — NOT counterevidence to Jevons ("seniority-biased technological change"). Sets up the cohort charts directly.
   - **Rung 4 (added 2026-07-18) — why Leontief has been wrong for 40 years: NEW TASKS.** The horse story has a hole the sharp reader will spot: every prior automation wave should have horse-ified humans, and didn't. Why: horses had one margin (muscle); when engines took it, nothing left. Humans reallocate — automation destroys tasks AND creates task categories that didn't exist (Autor: most of today's employment is in occupations that didn't exist in 1940; "reinstatement effect" in Acemoglu-Restrepo terms). Complements survive *by moving to the new tasks*. **The AI twist, and the terminal open question: AI is the first technology general enough to potentially learn the new tasks too.** Every prior tech was narrow — took tasks, couldn't follow workers to the new ones. If AI can, the new-task escape hatch closes and Leontief is finally right; if not, this is powerloom-weavers again. Unanswerable with current data — which makes it the honest ENDING, not a claim. **Chart hook: rung 4 is measurable in real time** — Chart B hockey stick (AI-mention share ~4.2%), Gallacher's 37% AI-in-title gains, Lightcast genAI postings 55→~10,000, LinkedIn +1.3M new AI jobs = the reinstatement effect appearing live. The post's own data shows the race running.
   - **Theory ladder → chart map (use when writing copy):** rung 1 efficiency→more demand (Jevons) = postings volume chart; rung 2 only-while-unsaturated (curve position) = Gallacher recovery data; rung 3 only-complements-benefit (horses) = cohort chart; rung 4 complements-survive-via-new-tasks, does-AI-take-those-too = Chart B + AI-in-title/Lightcast/LinkedIn stats. **Depth floor (revised 2026-07-18): FOUR rungs for THIS post — a pacing decision, not an epistemic ceiling.** Rung 4 closes the argument's loop (answers the question rung 3 opens). The seam below it: rungs 5+ change the outcome variable from *people* to *dollars* (wages, labor share, productivity) — different y-axis, different charts → **natural part-2 post** (user 2026-07-18; parked in §9). Within part 1: Acemoglu/Autor already in §8, cite don't teach. Two sanctioned smuggles from below the floor, both in the honest close, one paragraph max each: (1) **agriculture one-liner — even the happy path can look like agriculture: output exploded while farm employment went ~40% of the workforce → under 2%.** Output booms don't guarantee employment booms. (2) **the Ricardo cameo** (see step 7 bullet).
5. **Then the existing §2 spine** (three camps, confound-is-the-story, rate overlay). Prose addition for camp 3: **Section 174** — TCJA change effective 2022 forced amortizing R&D (i.e. engineer salaries) over 5 years instead of immediate deduction; a non-AI, non-rate hiring hit with exact 2022 timing; restored mid-2025. Strengthens the cyclical camp.
   - **The escalation test (user 2026-07-18) — dose-response argument, one of the post's sharpest.** If AI capability drives displacement, each capability leap (ChatGPT → GPT-4 → agentic coding → o3 → …) should march the displacement frontier UP the age ladder: first 22-25, then 26-30 rolling over, then 31-34. Not observed — Canaries middle buckets (26-30 through 41-49) sit flat ≈100-102 through May 2026 despite 3+ years and several capability generations; and no individual model release produces a visible kink in ANY series (the chart markers let readers check). **Precision fix — don't conflate two hinges:** the POSTINGS hinge (Indeed, peak early 2022) predates ChatGPT → that one's rates/pandemic-unwind. The COHORT divergence (Canaries, index base Nov 2022) starts around/after ChatGPT → that's the AI-consistent piece. "The main change happened before ChatGPT" is true of postings only; said carelessly it hands hostile readers a gotcha. The clean claim: *the aggregate crash is cyclical; the compositional split is the only AI-shaped residual — and even it hasn't escalated up-cohort.* **Steelman to include:** releases ≠ treatment dates; enterprise adoption diffuses smoothly 2023→2026, so no sharp kinks expected (the 22-25 line's smooth widening is consistent with diffusion). But diffusion can't explain zero spread to 26-30 by 2026 if the frontier claims were right. **Commit to the falsifiable prediction — "here's what would change my mind": if 26-30 rolls over in the next Canaries vintages, the AI story strengthens; if 22-25 recovers with rates, the cyclical story wins.** Great credibility move; also future-proofs the post. **Chart tweak (small, not built — needs user go-ahead):** add the AI-release marker toggle (jobs-chart pattern) to BOTH cohort charts so the reader can run the escalation test visually.
6. **Ending — Gallacher 2026 recovery as the Jevons test coming in.** Postings +14.8% since Claude Code, 71% of gains senior, 37% AI-in-title: Jevons maybe holding, but senior-tilted. **Paradox for the profession, not the entry rung.**
7. **Honest close.** One cycle of data; elasticity unknown; analogs cut both ways — the ATM/bank-teller story ran positive for decades then reversed; spreadsheets killed bookkeeping clerks while growing accountants/analysts (the spreadsheet analog fits the composition story best).
   - **Ricardo cameo (sanctioned smuggle #2 from below the depth floor — ONE paragraph in the close, NOT a rung 5).** The strongest optimist argument that survives all four rungs: even if AI gains *absolute* advantage in every task (better AND cheaper at everything), *comparative* advantage says humans stay employed wherever their relative disadvantage is smallest — because AI capacity (compute) is scarce, every hour of AI on task X has an opportunity cost in task Y. Needs neither complementarity nor new tasks; pure Ricardo (1817). **Its fine print is the horse story again:** comparative advantage guarantees employment only above the reservation wage — it protects *jobs* by sacrificing *wages*, and if the market-clearing human wage falls below the cost of keeping a human on payroll, humans exit exactly like horses (horses had comparative advantage too; their feed cost exceeded their marginal product). Also thins as compute scales (the scarcity premise weakens). **Why cameo, not rung: it changes the outcome variable from employment to wages, and the post's data is employment data** — no chart maps to it. One-line data tether, don't overwork it: Canaries finds adjustment via *headcount, not wages*, which sits awkwardly with smooth Ricardian wage adjustment (entry-level wages aren't falling to clear the market; hiring just stops).

**Caution for step 3:** Nadella's famous Jevons invocation (Jan 2025, DeepSeek) was about *compute/inference demand*, not dev jobs — cite it for "tech leaders invoke Jevons," don't misattribute it to the labor claim.

---

## 3. The existing chart — baseline & reusable patterns

**This is the template. New charts copy this recipe.** Canonical files:
- `blog/posts/ai-job-market.md` — the post (frontmatter + toolbar HTML + chart div). Frontmatter `scripts:` loads Plotly CDN + the chart JS; `styles:` loads the chart CSS. Rendered client-side by `blog/blog-post.js`.
- `blog/posts/assets/job-market-chart.js` — all chart logic.
- `blog/posts/assets/job-market-chart.css` — chart + toolbar styling.
- Registered in `js/blog-data.js` (`BLOG_POSTS`, id `ai-job-market`, tags `["AI & ML","Economics"]`). Has a `sitemap.xml` entry.

**Reusable patterns already implemented in job-market-chart.js (read it, don't reinvent):**
- **Live fetch with baked fallback:** `fetchSeries()` fetches the raw GitHub CSV; on failure falls back to `FALLBACK_SWE`/`FALLBACK_ALL` (monthly snapshots hardcoded in the file, taken 2026-07-16, `[date, index]` pairs). **Every chart should keep a fallback snapshot** so the post never renders empty.
- **CSV parsing:** `parseCSV`, `toSeries`, `sortByDate`, plus per-source extractors (`extractSWE` filters `display_name` AND `variable === "total postings"` — the variable filter is essential or you get interleaved "new postings" + "total postings" rows; `extractALL` reads the NSA column).
- **Theme integration:** `cssVar()` reads theme CSS vars at draw time (`--secondary`, `--text`, `--neutral-gray`, `--accent`, `--jobs-menu-navy` = `#253347`, `--jobs-menu-navy-dark` = `#192232`, `--jobs-menu-slate` = `#7B8A9A`). A debounced `dawson:palette` event listener rebuilds on theme switch. `uirevision: 'job-market'` preserves zoom across rebuilds.
- **Toolbar (dataviz rule: filters live ABOVE the plot, never inside):** navy tab strips styled after the site "Where I've Worked" jobs menu — 13px slate text, navy hover, navy-dark+accent selected, sliding glowing accent underline (`.jm-hl`, positioned via offsetLeft/offsetWidth, reseated without animation on resize/load). Series toggles are real checkboxes (`.jm-check`), not tab-chips (user rejected chips). No hover bg on checkboxes; the site cursor-follower expands over them instead. No glow on checked boxes.
- **View modes:** Index (Feb 2020 = 100) and **% Change** (every point rebased to the start of the current window; window start is the anchor, moves with presets/pan/slider). `anchorFor(key, ts)`, `recomputeDisp()`, disp = `(v/v0 − 1) × 100`. % numbers show max 2 decimals (`%{y:+.2~f}%`).
- **Time controls:** presets 3M / 6M / 1Y / 5Y / All + a rangeslider for custom range. **Rangeslider is edge-only draggable** (capture-phase `stopPropagation` on mousedown/touchstart inside `.rangeslider-container` unless target matches the grabber classes; middle-drag + click-jump are dead). `cursor: default` CSS on the inert slider parts.
- **Y-axis auto-rescale on any window change:** `plotly_relayout` listener filtered to xaxis keys + `squelchRelayout` flag to distinguish programmatic writes; `visibleYRange()` respects series visibility + display mode; programmatic writes bundle x+y in one `Plotly.update`. `Plotly.restyle` never triggers relayout (no loops).
- **AI release markers** (vertical dashed lines, toggled by an "AI Releases" checkbox), current list (updated 2026-07-18, synced across `job-market-chart.js` AND `cohorts-chart.js`):
  - ChatGPT `2022-11-30`, GPT-4 / Cursor `2023-03-14` (merged label — Cursor launched March 2023 with no firm public day; two lines two weeks apart would collide at this axis scale), Claude Code `2025-02-24` (research-preview launch; anchor for the Gallacher "creation" rebound story), o3 `2025-04-16`, Opus 4.5 `2025-11-24`, Fable 5 `2026-06-09`.
- **Cursor-follow extension:** the site handler (`js/cursor-follow.js`) only matches `a, button, .job-menu-item`; the chart adds its own delegated mouseover/mouseout listeners toggling the same `cursor-follow-clickable` class for `.jm-check` + slider grabbers (survives Plotly SVG re-renders).
- **Safari date quirk:** Plotly range strings use a space separator; `toTs()` does `new Date(String(v).replace(' ','T')).getTime()` before parsing.
- **Stat readout follows the window END (added 2026-07-17):** `#jm-stat` shows values at the window's right edge in BOTH modes (`endIdxFor(key, ts)` = last point ≤ window end). % mode = change across the window, labeled "`<start> → <end>`"; Index mode = level "as of `<end>`". Plus a **drag date tip** (`.jm-drag-tip`, absolutely positioned inside the chart div) that rides a rangeslider edge grabber while held, showing that edge's date; wired via the same capture-phase grabber mousedown + `plotly_relayout` stream. New charts with a slider should copy both.
- **Hovertemplate number formats (learned 2026-07-17):** Plotly's `numberFormat` runs an `adjustFormat` shim that prepends `~` to any d3 format containing `f`/`p`/`s` that doesn't start with `[~,.0$]` — so signed formats like `+.2f` / `+.2~f` become invalid specs, the d3 error is swallowed, and hover values silently render as raw full-precision `String(value)`. Plain `.1f`/`.2f` are safe. For signed/trimmed % values, pre-format in JS (`fmtPct`) into the trace `text` array and hover with `%{text}`; restyle `text` alongside `y` on every % rebase.
- **`scrollZoom: false` on every chart (2026-07-17):** wheel/two-finger scroll must stay page scroll; zooming = presets + slider edge handles. (`metr-chart.js` on the older post still has `scrollZoom: true` — not changed without a user ask.)

**Site rules that apply to every chart (from CLAUDE.md):**
- No build step. CDN deps version-pinned (Plotly `2.27.0`); never `@latest`; curl new CDN URLs to confirm 200 before committing.
- Mobile breakpoint 1100px.
- Page-scoped CSS beside the page; new post assets in `blog/posts/assets/`.
- New live-demo posts need a `sitemap.xml` entry (already done for this post).

---

## 4. Chart menu (full — build details per chart)

Legend for **Build:** `LIVE` = fetch client-side at render (CORS-open, see §6); `PREBAKE` = fetch once, commit a static JSON snapshot to the repo (source is CORS-blocked or needs xlsx parsing); `STATIC` = hand-entered from published figures (no machine-readable series exists).

### Already shipped
**Chart 0 — Software Development vs All Jobs, indexed Feb 2020 = 100.** LIVE. The existing chart. Baseline for everything.

### Trivial live additions (same fetch pattern as Chart 0)
**Chart A — More sectors on the existing chart.** LIVE. Add lines from the same sector CSV (Nursing, Construction, Customer Service — see D6). Filter `display_name == "<sector>"` AND `variable == "total postings"`. 47 sectors available (§7). Directly shows exposed-vs-not divergence. Nearly free — same file, same code. *Palette note:* keep the emphasis pattern — accent for the story series (Software Development), muted grays for context series; don't cycle bright hues (dataviz rule).

**Chart B — AI-mention share of postings (the hockey stick).** LIVE. `ai-tracker/AI_posting.csv`, filter `jobcountry == "US"`, plot `AI_share_postings` over time. Hit ~4.2% Dec 2025; AI-mentioning postings +134% vs Feb 2020 even as overall hiring is flat. Same Indeed methodology, same fetch host. **Note:** the README promises a `GenAI_posting.csv` but it 404s — only the combined AI share exists. Optional companion series: OWID/Lightcast "share of postings requiring ≥1 AI skill" (§5) for a second, independent AI-demand line.

### Approved / high-value
**Chart C — AI exposure vs employment change (scatter).** PREBAKE. *(User approved — but ON HOLD until the Chart D cohort pair ships. User's framing 2026-07-17: compare Anthropic exposure numbers "to each sector" — i.e. X = Anthropic exposure aggregated per Indeed SECTOR, Y = that sector's postings change. That needs a SOC-occupation → Indeed-sector crosswalk (Indeed's 47 sectors are job-title clusters, not SOC; manual mapping, lossy — document it). The occupation-level version below (vs BLS) stays the fallback if the crosswalk is too mushy. Separate chart either way.)* The analytical centerpiece.
- **X** = `job_exposure.csv` from the Anthropic Economic Index (HuggingFace, CC-BY): columns `occ_code, title, observed_exposure` (0–1). Same O*NET/SOC taxonomy as the Canaries paper → consistent with Chart D. Alt X = Microsoft `ai_applicability_scores.csv` (Copilot-revealed) or Eloundou `occ_level.csv` (`dv_rating_beta`, theoretical) or AIOE (theoretical).
- **Y** = BLS employment change by occupation (OEWS levels 2019→latest, or Employment Projections % change). BLS is not cleanly fetchable client-side → **pre-bake the join to a static JSON** (`occ_code, exposure, emp_change, title`). Exposure scores are static anyway, so a snapshot is fine.
- Dataviz: scatter needs per-point hit areas ≥24px (or a nearest-point layer); label only the extremes (e.g. Software Developers, and a low-exposure anchor like Nursing); a trend line is optional but if drawn, caveat correlation≠causation.
- Story: test the displacement thesis visually — do more-exposed occupations show worse employment change? (Genuinely contested; some finders say yes, some no.)

**Chart D — the cohort pair (BUILT 2026-07-17 — pending user visual test; nothing committed).** Files: `blog/posts/assets/cohorts-chart.js` (one factory, two instances), `cohorts-chart.css` (chart containers + per-cohort color-mix chip/swatch colors + flex bottom row), `cohort-unemployment-data.json` + `cohort-swe-age-data.json` (pre-baked snapshots), `docs/prebake-cohort-data.py` (stdlib-only refresh script — rerun to update both JSONs), toolbar HTML blocks appended to `ai-job-market.md`. Existing `job-market-chart.js` toolbar queries were scoped with `.jm-toolbar[data-chart="jobs"]` so the three charts' shared `.jm-*` classes don't cross-wire. Two independent charts, stacked in the post as one "cohorts" section, same toolbar/design language, **cohort include/exclude checkboxes in BOTH** (user requirement: readers can mess around with age buckets). NOT one 4-line chart: unemployment rate (up = bad) vs employment index (up = good) is inverted semantics on top of different populations and baselines — overlaying would mislead.
- **Chart D-1 — unemployment by group.** PREBAKE. NY Fed "Labor Market for Recent College Graduates" xlsx, `unemployed` tab (MONTHLY, Jan 1990→Mar 2026). Columns: `Date, Young workers (22-27), All workers, Recent graduates, College graduates` → **4 toggleable cohorts**; defaults ON = Recent graduates + All workers. The story = the crossover (recent grads now unemploy ABOVE all workers; latest: grads 5.63%, all 4.23%, young 22-27 7.24%). Single view mode (raw % rate — "% change of a rate" is confusing; skip mode tabs), range presets + edge-only slider + drag tip + window-end stat. **Pre-bake:** NY Fed needs a browser User-Agent and is xlsx → fetch+parse once (no npm installs — python3 stdlib `zipfile` + XML, xlsx is a zip), commit JSON, baked JS fallback.
- **Chart D-2 — software developer employment by age.** PREBAKE. Stanford "Canaries" software-dev download. **Schema re-verified 2026-07-17 from a fresh download:** wide CSV, columns exactly `observation_date, Early Career 1 (22-25), Early Career 2 (26-30), Developing (31-34), Mid-Career 1 (35-40), Mid-Career 2 (41-49), Senior (50+), vintage`; monthly `2021-06-01`→`2026-05-01`; Employment Index 100 at `2022-11-01`; vintage `2026-06-18`. → **6 toggleable age buckets**; defaults ON = 22-25 + 50+ (latest ≈78.8 vs ≈108.8). **There is NO "all SWE" total column** — closest read: middle buckets sit ≈100-102 (flat), which visually IS the "all/experienced SWE" baseline; caveat in prose that "recent SWE" is proxied by AGE 22-25 (ADP has no education cut). Index + % Change modes both fine here (copy chart 0). Colors: age is ordinal → sequential ramp accent→muted via `blendHex` (theme-safe), validate steps, direct-label the extremes. **Data floor checked 2026-07-17: the series starts 2021-06-01, full stop.** The GCS bucket carries only the two latest memo vintages (2026-05 and 2026-06 — both start 2021-06), and the underlying ADP panel itself begins in 2021, so this chart cannot extend farther back. Pre-2021 SWE-by-age would need CPS/IPUMS microdata (noisy monthly occupation×age cells, offline processing, household survey vs payroll) — prose-only if ever.
- Zip also ships `_yoy_change` and `_annualized` variants (signed decimal rates, ×100 for %) — not needed for v1.
- **Sibling file for later:** `canaries_age_by_exposure.csv` = same schema + `exposure_quintile` facet (5 quintiles × 6 ages, 300 rows) — verified present; possible future chart.
- The rate now rides each chart as a dual-axis overlay; the standalone strip is commented out (D4 — see the superseded note in that row, 2026-07-17).
- **Why not the literal single 4-line chart:** verified against the actual files — recent-grad CS-major unemployment exists ONLY as an annual single snapshot (6.99%, ACS-based), not a monthly series; and experienced/all-software-dev unemployment does NOT exist as a clean series (BLS monthly occupational UR stops at the too-broad "Professional and related"; the detailed "Computer & mathematical" rate is annual-only, noisy, small-sample, bot-blocked). So 2 of the 4 requested lines can't be drawn monthly as unemployment. **CS-major-specific data stays OUT of the charts but its absence gets noted in the write-up (user 2026-07-17).**

### Under discussion
**Chart E — JOLTS (openings / hires / quits).** PREBAKE (FRED). *(D5 — optional.)* The "is it the whole economy or just tech" denominator. FRED `JTSJOL` (openings), `JTSHIL` (hires), `JTSQUL` (quits), monthly. Index to 2019=100 or plot levels. Openings fell from the ~12M 2022 peak toward ~7M; quits rolled over (end of Great Resignation). NOT the recent-grad source — JOLTS is an establishment survey with no demographic/education/unemployment data (the user asked; they're unrelated). FRED = pre-bake or proxy (§6).

**Chart F — Within-tech divergence.** ~~STATIC bars~~ **DECIDED 2026-07-17: PROSE ONLY, no chart** (D2/D3 closed). Use the §7 figures in the write-up. Original rationale kept for context: no fetchable data below the "Software Development" sector — Indeed GitHub stops at sector; Lightcast has per-title but it's a gated commercial API; LinkedIn has a per-role chart but it's a PDF figure. So this is hand-entered from published figures (§7). Design: diverging horizontal bars from the Feb-2020 baseline, sorted; label "as of July 2025, Indeed Hiring Lab." Story = the strongest in the post: **AI isn't killing tech, it's re-sorting it** (ML/AI roles up, legacy stacks gutted). Recommend Indeed-only bars (D3a).

**Chart G — Software postings vs the real interest rate.** PREBAKE. *(D4 — EFFECTIVELY BUILT 2026-07-17: the dual-axis rate overlay on the postings chart IS this pairing (user explicitly requested dual-axis: "i know i know but just try it for me"). Nothing further unless the trial is rejected. Fed funds: proposed as shaded hiking-cycle band + prose, not a second line — DFII10 leads (rose from ≈−1.1% Dec 2021, before the first hike Mar 2022) and matches the early-2022 postings peak; FEDFUNDS lags in steps and would add ink, not information.)* The honest version of the "rate-adjusted" request. **No residualized/adjusted series exists anywhere** — LinkedIn asserts the conclusion but publishes no model/coefficients/residual; no Fed/NBER/Revelio series does it either. **Do NOT build a DIY residual and call it "the AI effect":** the residual absorbs the pandemic bubble-and-unwind, layoffs, immigration, everything uncorrelated with rates — plus it's a spurious-regression / one-cycle / false-precision trap a sharp reader will shred. Instead: overlay `IHLIDXUSTPSOFTDEVE` (software postings) vs `DFII10` (10y TIPS real yield) so the reader SEES them co-move, and quote LinkedIn's "real interest rates account for most of the variation in SWE hiring over the past decade." If a residual is ever shown, label it **"everything rates don't explain (pandemic unwind + AI + misc)," never "AI."** This is a two-line chart — but the two series are on genuinely different scales, so this is the ONE place a second y-axis is defensible; if avoiding dual-axis (dataviz non-negotiable), invert/normalize the rate or use a small-multiple stack instead.

### Backlog (mentioned, not prioritized)
- **Tech layoffs timeline** — layoffs.fyi (no clean API; Kaggle mirror `swaptr/layoffs-2022`). PREBAKE. Annotated waves (2022-23 rate shock; 2026 AI-restructuring). Softer provenance; AI-attribution is self-reported.
- **Census BTOS AI adoption by firm size / over time** — the *mechanism* (who's deploying). PREBAKE (xlsx or EIG mirror `github.com/EIG-Research/ai-btos`). Big firms ~37% vs tiny single digits. Two "AI use" definitions (broad ~20% vs narrow ~4-8%) — label which.
- **Software employment (CES) vs postings overlay** — "headcount flat, hiring frozen." FRED `CES6054150001`. Caveat: do NOT chart the OEWS "1.7M→1.23M" drop; that's reclassification, not job loss.
- **Wage growth switchers vs stayers** — Atlanta Fed Wage Growth Tracker (FRED `FRBATLWGT3MMAUMHWGO`) or ECI (`ECIWAG`).

---

## 5. Data source reference (exact URLs / columns / series IDs)

**Indeed Hiring Lab GitHub** (org has 6 repos; note branch differs — `job_postings_tracker` uses `master`, all others `main`). CORS-open (`raw.githubusercontent.com`), CC-BY.
- Sector index (Chart 0/A): `https://raw.githubusercontent.com/hiring-lab/job_postings_tracker/master/US/job_postings_by_sector_US.csv` — cols `date, jobcountry, indeed_job_postings_index, variable, display_name`. Filter `variable == "total postings"` (also has `new postings` = postings ≤7 days old, the closest published hiring-flow proxy). Feb 1 2020 = 100.
- Aggregate/all-jobs: `.../master/US/aggregate_job_postings_US.csv` — cols include both `indeed_job_postings_index_SA` and `indeed_job_postings_index_NSA` + `variable`. (Existing chart uses NSA for apples-to-apples with the non-adjusted sector data.)
- 47-sector taxonomy list: `.../master/sector-job-title-examples.csv`.
- AI-mention share (Chart B): `https://raw.githubusercontent.com/hiring-lab/ai-tracker/main/AI_posting.csv` — cols `date, jobcountry, AI_share_postings`. 9 countries incl. US. 2019→2026. (`GenAI_posting.csv` = 404, doesn't exist.)
- Wage growth by sector: `https://raw.githubusercontent.com/hiring-lab/indeed-wage-tracker/main/posted-wage-growth-by-sector.csv`.
- Other Indeed repos: `remote-tracker`, `pay-transparency` (both `main`).

**AI exposure datasets (Chart C, all open):**
- Anthropic: `https://huggingface.co/datasets/Anthropic/EconomicIndex/resolve/main/labor_market_impacts/job_exposure.csv` — `occ_code, title, observed_exposure`. Repo also bundles BLS employment + SOC structure for the join. CC-BY.
- Microsoft: `https://raw.githubusercontent.com/microsoft/working-with-ai/main/ai_applicability_scores.csv` — `SOC Code, title, ai_applicability_score`.
- Eloundou "GPTs are GPTs": `https://raw.githubusercontent.com/openai/GPTs-are-GPTs/main/data/occ_level.csv` — use `dv_rating_beta` (exposure incl. LLM tools).
- AIOE (Felten/Raj/Seamans): `https://raw.githubusercontent.com/AIOE-Data/AIOE/main/AIOE_DataAppendix.xlsx` (+ a "Language Modeling AIOE" variant for LLM-specific exposure).
- OWID/Lightcast AI-skill postings share (Chart B companion): `https://ourworldindata.org/grapher/share-artificial-intelligence-job-postings.csv?v=1&csvType=full`.

**Recent grads (Chart D Panel A):**
- NY Fed xlsx (stable URL, needs browser User-Agent, ~118KB): `https://www.newyorkfed.org/medialibrary/Research/Interactives/Data/college-labor-market/College-labor-data`. Tabs: `unemployed` (MONTHLY, cols `Date, Young workers (22-27), All workers, Recent graduates, College graduates`), `underemployed` (monthly), `wages` (annual), `outcomes by major` (annual single cross-section — CS major unemployment 6.99% lives here, ACS-based). Updated quarterly (unemployment) / annually Feb (majors).

**Canaries / Stanford (Chart D Panel B):**
- Software devs zip (auto-updates to latest vintage, Google Cloud Storage, not bot-blocked): `https://storage.googleapis.com/aviary-del-public/release_memos/latest/downloads/canaries_software_developers_results.zip` → `canaries_software_developers.csv` (Employment Index, 100 at 2022-11-01, monthly, ADP). Other cuts: `canaries_by_exposure_results.zip`, `canaries_age_by_exposure_results.zip`. Dashboard: `https://digitaleconomy.stanford.edu/project/indicators/canaries-dashboard/`. Platform: `https://indicators.stanford.edu`.

**FRED (Charts E, G, backlog)** — CSV pattern `https://fred.stlouisfed.org/graph/fredgraph.csv?id=<ID>` (bot-blocked to WebFetch/default UA; works from browser/curl-UA but **client-side browser fetch fails on CORS** → pre-bake or use the corsproxy pattern the METR chart uses):
- `IHLIDXUSTPSOFTDEVE` = Indeed Software Development postings (US). `IHLIDXUS` = all US postings.
- Rates: `DFII10` (10y TIPS real yield — best "real rate"), `FEDFUNDS`, `DFF`, `PCEPILFE` (core PCE, for building real ffr), `DGS10`.
- JOLTS: `JTSJOL` (openings), `JTSHIL` (hires), `JTSQUL` (quits), `JTSLDL` (layoffs); rates `JTSJOR`, `JTSQUR`.
- Employment/other: `CES6054150001` (Computer Systems Design employment), `TEMPHELPS` (temp help — leading indicator), `OPHNFB` (productivity), `ECIWAG`, `FRBATLWGT3MMAUMHWGO` (Atlanta Fed wage tracker).

**Census BTOS (backlog):** downloads `https://www.census.gov/hfp/btos/data_downloads`; AI supplement `https://www.census.gov/hfp/btos/downloads/AI_Supplement_Table_2026.xlsx`; tidy mirror `https://github.com/EIG-Research/ai-btos`.

**BLS (Chart C Y-axis, backlog):** OEWS `https://www.bls.gov/oes/` (SOC 15-1252 Software Developers); Employment Projections (software devs projected +17.9% 2024-34 per BLS). Detailed occupational unemployment: table `cpsaat25b` (annual, bot-blocked). BLS API v2 needs a free key.

---

## 6. Fetchability & CORS — the rule that decides build type

**CORS-open, fetch client-side (LIVE ok):**
- `raw.githubusercontent.com` — verified working (the existing chart proves it).
- Likely open (verify each before relying — curl the URL and check `access-control-allow-origin`): `huggingface.co/datasets/.../resolve/main/...`, `ourworldindata.org` grapher CSVs, `storage.googleapis.com` (Canaries zip — but it's a ZIP, needs unzip; easier to pre-bake).

**Bot-blocked and/or no CORS → PREBAKE (fetch once server-side, commit JSON) or use corsproxy:**
- **FRED** (`fredgraph.csv`) — sends no CORS headers; browser client-side fetch fails regardless of UA. Pre-bake or proxy.
- **BLS** (`bls.gov`) — Akamai 403 to bots; annual data anyway. Pre-bake.
- **NY Fed** (`newyorkfed.org`) — Akamai; needs browser UA; it's xlsx (needs SheetJS to parse in-browser). Cleanest: fetch+parse once, commit JSON.
- **Census BTOS** — JS-gated; xlsx. Pre-bake (or use the EIG GitHub mirror, which IS on raw.githubusercontent).

**PREBAKE mechanics:** for each pre-baked chart, write a small one-off fetch/parse step (Node or curl-with-UA + a parser), emit `blog/posts/assets/<chart>-data.json`, commit it, and have the chart JS load the JSON (with a baked fallback like Chart 0). Note the snapshot date in the caption ("as of <date>"). This matches the site's no-build, fallback-snapshot philosophy.

**corsproxy alternative:** the site's METR chart (`blog/posts/assets/metr-chart.js`) fetches through `corsproxy.io` — usable for FRED if you want the chart to auto-update, at the cost of a third-party dependency. Pre-baking is more robust; pick per chart.

**STATIC:** Chart F only — no series exists; hand-enter §7 figures.

---

## 7. Key figures appendix (for STATIC/hand-entered charts + captions)

**Chart F — within-tech divergence (Indeed Hiring Lab, Bernard, "The US Tech Hiring Freeze Continues," Jul 30 2025), all vs early/Feb 2020 unless noted:**
- Tech postings overall: **−36%**
- **Machine Learning Engineer: +59%** (but −47% off its early-2022 peak) — one of the few tech titles above baseline
- **Software Engineer** (most common title): **−49%**
- **Specialized devs (Android, Java, .NET, iOS, web): all −60%+**
- Only **28 of 149** tech titles above pre-pandemic (early 2025)
- ML Engineer median posted salary (2024): ~$260,000; tech employment +19% vs 2019
- LinkedIn ("U.S. Software Engineer Talent Landscape," Feb 2026) — *share of hires, different denominator, keep in prose or footnote:* **AI Engineer 14× vs 2019** (10× vs 2022); ML Engineer share ~2× since 2019; GAI-Engineer transitions ~9× since 2021.

**Recovery/creation twist (Gallacher, Jul 8 2026):** software-dev postings **+14.8% since Claude Code** (late Feb 2025), still **−27.5%** vs Feb 2020; **71%** of the May 2025–May 2026 gain = senior roles, **37%** = AI-in-title roles.

**Canaries (verified from download, vintage 2026-06-18, May 2026):** 22-25 devs index 78.8 (≈−21% since ChatGPT); 50+ devs 108.8 (≈+9%). Relative decline for 22-25 in most-exposed occupations ~13% (Aug draft) → ~16% (Nov revision). Young software devs −20% from late-2022 peak.

**NY Fed (Mar 2026):** recent grads 5.63%, all workers 4.23%, young 22-27 7.24%, recent-grad underemployment 41.5%. CS major (annual snapshot): unemployment 6.99%, underemployment 19.1%, early-career wage $87k, mid-career $120k. Computer Engineering 7.78%.

**Indeed AI tracker:** US AI-mention share ~4.2% (Dec 2025); AI-mentioning postings +134% vs Feb 2020.

**Other debate stats:** Eloundou — 80% of workers ≥10% of tasks exposed, 19% ≥50%. Anthropic Economic Index — Computer/Math 35% of Claude usage; Mar 2026 52% augmentation / 45% automation; Claude Code ~79% automation. Acemoglu — ≤0.71% TFP over 10 yrs. Lightcast — +28% AI-skill wage premium. Revelio — +10pp exposure → −11% entry-level demand.

---

## 8. Source bibliography (citations, grouped)

**Your chart's own source / reproducibility:**
- Indeed Hiring Lab tracker: https://github.com/hiring-lab/job_postings_tracker · FRED `IHLIDXUSTPSOFTDEVE`, `IHLIDXUS`.

**The empirical core:**
- Canaries in the Coal Mine (Stanford): https://digitaleconomy.stanford.edu/publication/canaries-in-the-coal-mine-six-facts-about-the-recent-employment-effects-of-artificial-intelligence/ · PDF https://digitaleconomy.stanford.edu/app/uploads/2025/11/CanariesintheCoalMine_Nov25.pdf · primer https://bharatchandar.substack.com/p/a-primer-on-canaries-in-the-coal
- Generative AI at Work (QJE 2025): https://www.nber.org/papers/w31161
- Autor, Rebuild Middle-Class Jobs: https://www.nber.org/papers/w32140
- Acemoglu, Simple Macroeconomics of AI: https://www.nber.org/papers/w32487
- Eloundou, GPTs are GPTs: https://arxiv.org/pdf/2303.10130

**"No aggregate shock" camp:**
- Yale Budget Lab: https://budgetlab.yale.edu/research/tracking-impact-ai-labor-market
- Brookings "no AI jobs apocalypse (for now)": https://www.brookings.edu/articles/new-data-show-no-ai-jobs-apocalypse-for-now/
- Fed FEDS note (AI adoption & job-posting behavior, Mar 2026): https://www.federalreserve.gov/econres/notes/feds-notes/ai-adoption-and-firms-job-posting-behavior-20260327.html

**The confound (Indeed + LinkedIn):**
- Indeed, "US Tech Hiring Freeze Continues" (Bernard, Jul 2025): https://www.hiringlab.org/2025/07/30/the-us-tech-hiring-freeze-continues/
- Indeed, "Long Shadow of the Pandemic" (Gudell, Apr 2026): https://www.hiringlab.org/2026/04/13/how-the-labor-market-is-emerging-from-the-long-shadow-of-the-pandemic/
- Indeed, "AI and Job Postings: From Destruction to Creation?" (Gallacher, Jul 2026): https://www.hiringlab.org/2026/07/08/ai-and-job-postings-from-destruction-to-creation/
- Indeed, Jan 2026 labor market update (AI postings +45% above Feb 2020): https://www.hiringlab.org/2026/01/22/january-labor-market-update-jobs-mentioning-ai-are-growing-amid-broader-hiring-weakness/
- Indeed, "AI at Work Report 2025": https://www.hiringlab.org/2025/09/23/ai-at-work-report-2025-how-genai-is-rewiring-the-dna-of-jobs/
- LinkedIn, "U.S. Software Engineer Talent Landscape" (Feb 2026): https://economicgraph.linkedin.com/content/dam/me/economicgraph/en-us/PDF/us-software-engineer-talent-landscape-2026.pdf
- LinkedIn, Labor Market Report Jan 2026: https://economicgraph.linkedin.com/research/labor-market-report-2026

**The vendor split:**
- Revelio, "Is AI responsible for entry-level unemployment?": https://www.reveliolabs.com/news/macro/is-ai-responsible-for-the-rise-in-entry-level-unemployment/
- Revelio × Ramp, "heavy adopters hire more" (Jun 2026): https://www.reveliolabs.com/news/ai-and-work/greater-ai-investment-more-hiring/
- Lightcast, "Beyond the Buzz" (AI-skill premium): https://lightcast.io/resources/research/beyond-the-buzz-developing-the-ai-skills-employers-actually-need
- Handshake, "Class of 2026 in the AI Economy": https://joinhandshake.com/network-trends/class-of-2026-outlook/

**AI-usage / adoption datasets:**
- Anthropic Economic Index (Mar 2026): https://www.anthropic.com/research/economic-index-march-2026-report · data https://huggingface.co/datasets/Anthropic/EconomicIndex
- Microsoft "Working with AI": https://arxiv.org/pdf/2507.07935 · data https://github.com/microsoft/working-with-ai
- OpenAI "How People Use ChatGPT": https://www.nber.org/papers/w34255
- Census BTOS: https://www.census.gov/programs-surveys/btos.html

**Employment / macro data:**
- NY Fed recent grads: https://www.newyorkfed.org/research/college-labor-market
- ADP × Stanford NER / Canaries dashboard: https://adpemploymentreport.com/ · FRED release rid=194
- BLS Employment Projections (AI in projections): https://www.bls.gov/opub/mlr/2025/article/incorporating-ai-impacts-in-bls-employment-projections.htm

---

## 9. Open follow-ups if more depth is wanted later
- Verify CORS live for HuggingFace / OWID / GCS before choosing LIVE vs PREBAKE for Charts B/C/D.
- ~~Decide whether to add a Claude Code (2025-02-24) marker to the existing chart for the "creation" story.~~ **DONE 2026-07-18** (user asked): Claude Code + Cursor added to all three charts' EVENTS lists (Cursor shares the GPT-4 line, see §3); Recovery prose now points readers at the Claude Code marker.
- Add the AI-release marker toggle to BOTH cohort charts (jobs-chart pattern) so readers can run the §2b escalation test visually — small JS addition, needs user go-ahead.
- If the article wants a "which occupations use AI most" cut, the Anthropic + Microsoft occupation files support a ranked bar (augmentation vs automation split).
- Exposure-gradient chart option for the escalation-test section: `canaries_age_by_exposure.csv` (age × exposure quintile, verified present — §4 D-2 sibling file). Timing says "could be AI"; the gradient says "shaped like AI."
- Harvest prior annual vintages of the NY Fed by-major snapshot (Wayback) if a CS-major *time series* becomes worth the taxonomy-drift risk.

### PART 2 PARKING LOT (user 2026-07-18): "Part 1: quantities. Part 2: prices."
Part 1 (this post) = employment/postings — the four-rung ladder. Part 2 = the outcome variable theory says moves FIRST: **wages**. Empirical hook = the puzzle part 1 ends on: Canaries finds adjustment via headcount, NOT wages — theory says wages absorb, data says they don't.
- **Rungs 5+ (the below-floor material, taught properly):** Ricardo full treatment (comparative advantage protects jobs by sacrificing wages; reservation-wage participation constraint = the horse exit condition; thins as compute scales) · Acemoglu-Restrepo task model (displacement vs productivity vs reinstatement) · Baumol / the agriculture path (where employment migrates when one sector's productivity explodes) · labor share of income (the σ>1 test) · Brynjolfsson productivity J-curve (why aggregate stats lag).
- **Chart candidates, data mostly already in §5:** Indeed posted-wage-growth-by-sector CSV (CORS-open, LIVE) · Lightcast +28% AI-skill premium (43% w/ 2+ skills) · Atlanta Fed wage tracker `FRBATLWGT3MMAUMHWGO` / ECI `ECIWAG` (FRED, PREBAKE) · labor share (FRED, e.g. nonfarm business sector) · productivity `OPHNFB` · ML Engineer ~$260k median posted salary (§7).

**The ladder TERMINATES (user asked 2026-07-18: "does this just keep going?" — no). Each rung relaxes one assumption of the standard model; you run out of assumptions.** Two seams remain past part 2, then done:
- **Seam 3 — prices → DISTRIBUTION (part 3, unlikely, parked for completeness):** if labor share falls, who gets the income (compute/model owners), and does the demand loop close ("who buys the software" — general-equilibrium feedback). Korinek/Stiglitz territory. Still chartable: labor share vs corporate profits, hyperscaler capex, market concentration.
- **Seam 4 — distribution → SCARCITY ITSELF (last econ rung, data-thin, likely never):** when intelligence stops being scarce, value migrates to what remains scarce — energy, land, data, trust, the human-made premium. Aghion-Jones-Jones bottleneck growth (growth constrained by essential tasks that resist improvement — Baumol at civilization scale). Past this rung the question stops being economics (meaning of work = philosophy) — and economics is definitionally the study of scarcity, so "what stays scarce" is structurally the final rung.
- **Stopping rule that generated every floor above: a rung earns a place only if it has a chart.** Data density falls with each seam — part 1 fully charted, part 2 mostly, part 3 barely, seam 4 vibes. The ladder ends where measurement does.
