---
title: AI and the Job Market
date: July 2026
scripts: [https://cdn.plot.ly/plotly-2.27.0.min.js, posts/assets/job-market-chart.js, posts/assets/cohorts-chart.js]
styles: [posts/assets/job-market-chart.css, posts/assets/cohorts-chart.css]
---

<div class="jm-toolbar" data-chart="jobs">
  <div class="jm-tabs jm-modes" role="group" aria-label="View mode">
    <button type="button" class="jm-mode is-active" data-mode="index">Index</button>
    <button type="button" class="jm-mode" data-mode="pct">% Change</button>
    <span class="jm-hl" aria-hidden="true"></span>
  </div>
  <div class="jm-tabs jm-ranges" role="group" aria-label="Time range">
    <button type="button" class="jm-range" data-months="3">3M</button>
    <button type="button" class="jm-range" data-months="6">6M</button>
    <button type="button" class="jm-range" data-months="12">1Y</button>
    <button type="button" class="jm-range" data-months="60">5Y</button>
    <button type="button" class="jm-range is-active" data-months="all">All</button>
    <span class="jm-hl" aria-hidden="true"></span>
  </div>
  <div class="jm-series" role="group" aria-label="Series">
    <label class="jm-check" data-series="swe"><input type="checkbox" checked> Software Development</label>
    <label class="jm-check" data-series="all"><input type="checkbox" checked> All Jobs</label>
    <label class="jm-check" data-flag="events"><input type="checkbox" checked> AI Releases</label>
    <label class="jm-check" data-flag="rate"><input type="checkbox"> Interest Rate</label>
  </div>
</div>
<div id="job-market-chart"></div>
<div class="jm-bottom-row">
  <p class="jm-caption">US job postings on Indeed, indexed to Feb 1, 2020 = 100. Live from the <a href="https://github.com/hiring-lab/job_postings_tracker" class="text-link" target="_blank" rel="noopener noreferrer">Indeed Hiring Lab</a> tracker. The dashed overlay is the 10-year real interest rate (TIPS yield, right axis), monthly from <a href="https://fred.stlouisfed.org/series/DFII10" class="text-link" target="_blank" rel="noopener noreferrer">FRED</a>. In % Change view each series is measured from the start of the current window, so the dotted line marks that starting level (in Index view it marks the pre-pandemic baseline). Drag the slider below the chart for a custom range.</p>
  <div id="jm-stat" aria-live="polite"></div>
</div>

<div class="jm-toolbar" data-chart="cu">
  <div class="jm-tabs jm-ranges" role="group" aria-label="Time range">
    <button type="button" class="jm-range" data-months="12">1Y</button>
    <button type="button" class="jm-range" data-months="60">5Y</button>
    <button type="button" class="jm-range is-active" data-months="120">10Y</button>
    <button type="button" class="jm-range" data-months="all">All</button>
    <span class="jm-hl" aria-hidden="true"></span>
  </div>
  <div class="jm-series" role="group" aria-label="Cohorts">
    <label class="jm-check" data-series="grads"><input type="checkbox" checked> Recent graduates</label>
    <label class="jm-check" data-series="workers"><input type="checkbox" checked> All workers</label>
    <label class="jm-check" data-series="young"><input type="checkbox" checked> Young workers (22-27)</label>
    <label class="jm-check" data-series="college"><input type="checkbox" checked> College graduates</label>
    <label class="jm-check" data-flag="events"><input type="checkbox"> AI Releases</label>
    <label class="jm-check" data-flag="rate"><input type="checkbox"> Interest Rate</label>
  </div>
</div>
<div id="cohort-unemp-chart" class="cc-chart"></div>
<div class="jm-bottom-row cc-bottom-row">
  <p class="jm-caption">US unemployment rate by group, monthly since 1990. Recent graduates are ages 22-27 with a bachelor's degree or higher; young workers are all 22-27-year-olds. Snapshot of the <a href="https://www.newyorkfed.org/research/college-labor-market" class="text-link" target="_blank" rel="noopener noreferrer">NY Fed college labor market</a> data. The dashed overlay is the 10-year real interest rate (right axis, from 2003). Toggle cohorts to compare; drag the slider below the chart for a custom range.</p>
  <div id="cu-stat" class="cc-stat" aria-live="polite"></div>
</div>

<div class="jm-toolbar" data-chart="cs">
  <div class="jm-tabs jm-modes" role="group" aria-label="View mode">
    <button type="button" class="jm-mode is-active" data-mode="index">Index</button>
    <button type="button" class="jm-mode" data-mode="pct">% Change</button>
    <span class="jm-hl" aria-hidden="true"></span>
  </div>
  <div class="jm-tabs jm-ranges" role="group" aria-label="Time range">
    <button type="button" class="jm-range" data-months="12">1Y</button>
    <button type="button" class="jm-range" data-months="36">3Y</button>
    <button type="button" class="jm-range is-active" data-months="all">All</button>
    <span class="jm-hl" aria-hidden="true"></span>
  </div>
  <div class="jm-series" role="group" aria-label="Age buckets">
    <label class="jm-check" data-series="g2225"><input type="checkbox" checked> 22-25</label>
    <label class="jm-check" data-series="g2630"><input type="checkbox"> 26-30</label>
    <label class="jm-check" data-series="g3134"><input type="checkbox"> 31-34</label>
    <label class="jm-check" data-series="g3540"><input type="checkbox"> 35-40</label>
    <label class="jm-check" data-series="g4149"><input type="checkbox" checked> 41-49</label>
    <label class="jm-check" data-series="g50"><input type="checkbox"> 50+</label>
    <label class="jm-check" data-flag="events"><input type="checkbox" checked> AI Releases</label>
    <label class="jm-check" data-flag="rate"><input type="checkbox"> Interest Rate</label>
  </div>
</div>
<div id="cohort-swe-chart" class="cc-chart"></div>
<div class="jm-bottom-row cc-bottom-row">
  <p class="jm-caption">US software developer employment by age, indexed to Nov 2022 = 100 (the month ChatGPT launched). ADP payroll data via Stanford's <a href="https://digitaleconomy.stanford.edu/project/indicators/canaries-dashboard/" class="text-link" target="_blank" rel="noopener noreferrer">Canaries in the Coal Mine</a> project. Age buckets, not education: "22-25" is the closest available proxy for recent-grad software developers. The dashed overlay is the 10-year real interest rate (right axis). Toggle buckets to compare cohorts.</p>
  <div id="cs-stat" class="cc-stat" aria-live="polite"></div>
</div>

<!-- Standalone rate strip, replaced by the dual-axis "Interest Rate" overlay
on the charts above. Kept for easy restore (its makeCohortChart instance is
commented out at the bottom of cohorts-chart.js).
<div class="jm-toolbar" data-chart="rate">
  <div class="jm-tabs jm-ranges" role="group" aria-label="Time range">
    <button type="button" class="jm-range" data-months="12">1Y</button>
    <button type="button" class="jm-range is-active" data-months="60">5Y</button>
    <button type="button" class="jm-range" data-months="120">10Y</button>
    <button type="button" class="jm-range" data-months="all">All</button>
    <span class="jm-hl" aria-hidden="true"></span>
  </div>
  <div class="jm-series" role="group" aria-label="Overlays">
    <label class="jm-check" data-flag="events"><input type="checkbox"> AI Releases</label>
  </div>
</div>
<div id="rate-chart" class="cc-chart cc-chart-slim"></div>
<div class="jm-bottom-row cc-bottom-row">
  <p class="jm-caption">10-year real interest rate (TIPS yield), monthly average of daily values, snapshot from <a href="https://fred.stlouisfed.org/series/DFII10" class="text-link" target="_blank" rel="noopener noreferrer">FRED</a>. The shaded band is the Fed's hiking cycle (Mar 2022 to Jul 2023), which took the federal funds rate from near zero to 5.25-5.50%. Real rates began climbing in late 2021, months before the first hike and right as job postings peaked.</p>
  <div id="rate-stat" class="cc-stat" aria-live="polite"></div>
</div>
-->
