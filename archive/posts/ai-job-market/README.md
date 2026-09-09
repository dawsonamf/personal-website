# AI job-market post archive

This directory preserves the unpublished post draft, its research, chart code,
and refreshed data snapshots. It is outside `public/` and is not part of the
Astro content collection, so none of these files are published or deployed.

- `draft.md` is the unpublished article draft.
- `research.md` records the research and chart plan.
- `assets/` contains the chart JavaScript and CSS. Data URLs resolve relative to
  the script file so the bundle remains usable when served from this directory.
- `data/` contains the latest committed snapshots. The weekly/manual
  `.github/workflows/refresh-chart-data.yml` workflow refreshes these files.
- `scripts/prebake-cohort-data.py` regenerates the three data snapshots using
  only the Python standard library.
- `listing.patch` is historical publication work. Its legacy `js/blog-data.js`
  and `sitemap.xml` targets were deleted during the Astro rewrite; keep the patch
  for context rather than applying it to the current site.
