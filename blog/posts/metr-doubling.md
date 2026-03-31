---
title: How Fast Are Agents Improving?
date: February 2026
scripts: [https://cdn.plot.ly/plotly-2.27.0.min.js, https://cdn.jsdelivr.net/npm/js-yaml@4/dist/js-yaml.min.js, posts/metr-chart.js]
styles: [posts/metr-chart.css]
---

There's a question that keeps coming up in every AI safety discussion, every VC pitch, and probably every policy brief: how fast are AI systems getting better? With every software engineer you know spewing their personal anecdotes about how AI has transformed their workflow, and every executive showcasing their custom dashboards and asking you questions about CORS restrictions, an objective signal is desperately needed. We need a way of quantifying exactly how fast AI systems are improving.

METR's task-horizon benchmark gives us one of the best empirical answers we have to this question. It measures how long an agent can work autonomously on software tasks before its reliability drops below a given threshold. Their dataset reports two metrics for each model. `P50` is the task length at which the model succeeds 50% of the time, `P80` is the same metric but for 80% reliability. Using these two datasets I expanded on METR's work by extrapolating a `P99` metric using log-linear interpolation across the reliability curve.

Here's an interactive chart. You can pan, zoom, hover over a data point to see the model that produced it, or hover over a trend line to see the projected date and effective horizon for that reliability level.

<div id="metr-chart"></div>
<div class="chart-bottom-row">
  <p class="chart-caption">METR-Horizon reliability projections.<br>Scroll to zoom, hover for details.</p>
  <div id="doubling-times"></div>
</div>

When I saw this data for the first time two things jumped out at me.

The first is that the task doubling speed is roughly 3.6 months. This means that every quarter, the task length an AI agent can handle reliably roughly doubles. To put this in concrete terms: in early 2024, the best models in the world could only reliably handle tasks that took a few minutes. In early 2026 we're looking at models that can sustain multi-hour autonomous work sessions. If the trend holds, in late 2026 models will be able to perform an entire workday's worth of work, and by the end of 2027 entire work weeks.

The second is that the all-time trend and the post-2023 trend are different. The post-2023 trend is noticeably steeper than the all-time trend. Interestingly, this acceleration started before the release of o1 which indicates reasoning models are not the cause of the steeper trend.

Anyway, I am personally excited to see how this trend plays out. The raw benchmark data is sourced from [METR's public benchmark results](https://metr.org/blog/2025-03-19-measuring-ai-ability-to-complete-long-tasks/) and the chart updates automatically as new models are evaluated.
