(function () {
  // Snapshot of metr.org/assets/benchmark_results_1_1.yaml (taken 2026-06-10),
  // used only when the live fetch fails. Regenerate it from the YAML rather
  // than appending by hand, since METR also revises older estimates.
  const FALLBACK_DATA = [
    {name: "gpt2", date: "2019-02-14", p50_min: 0.053778, p80_min: 0.0128},
    {name: "davinci_002", date: "2020-05-28", p50_min: 0.144057, p80_min: 0.056238},
    {name: "gpt_3_5_turbo_instruct", date: "2022-03-15", p50_min: 0.599247, p80_min: 0.25538},
    {name: "gpt_4", date: "2023-03-14", p50_min: 3.987428, p80_min: 0.889561},
    {name: "gpt_4_1106_inspect", date: "2023-11-06", p50_min: 4.044959, p80_min: 0.783032},
    {name: "claude_3_opus_inspect", date: "2024-03-04", p50_min: 3.952262, p80_min: 0.638973},
    {name: "gpt_4_turbo_inspect", date: "2024-04-09", p50_min: 3.732787, p80_min: 0.927933},
    {name: "gpt_4o_inspect", date: "2024-05-13", p50_min: 6.991195, p80_min: 1.267009},
    {name: "claude_3_5_sonnet_20240620_inspect", date: "2024-06-20", p50_min: 11.395377, p80_min: 1.671757},
    {name: "o1_preview", date: "2024-09-12", p50_min: 20.326586, p80_min: 4.420545},
    {name: "claude_3_5_sonnet_20241022_inspect", date: "2024-10-22", p50_min: 20.522872, p80_min: 2.595677},
    {name: "o1_inspect", date: "2024-12-05", p50_min: 38.831588, p80_min: 7.090121},
    {name: "claude_3_7_sonnet_inspect", date: "2025-02-24", p50_min: 60.388937, p80_min: 12.09179},
    {name: "o3_inspect", date: "2025-04-16", p50_min: 119.732634, p80_min: 29.981603},
    {name: "claude_4_opus_inspect", date: "2025-05-22", p50_min: 100.366123, p80_min: 20.429752},
    {name: "claude_4_1_opus_inspect", date: "2025-08-05", p50_min: 100.472004, p80_min: 23.455761},
    {name: "gpt_5_2025_08_07_inspect", date: "2025-08-07", p50_min: 203.012577, p80_min: 38.312431},
    {name: "gemini_3_pro", date: "2025-11-18", p50_min: 224.325884, p80_min: 54.142849},
    {name: "gpt_5_1_codex_max_inspect", date: "2025-11-19", p50_min: 223.714694, p80_min: 50.632499},
    {name: "claude_opus_4_5_inspect", date: "2025-11-24", p50_min: 292.994594, p80_min: 49.430584},
    {name: "gpt_5_2", date: "2025-12-11", p50_min: 352.249302, p80_min: 66.002649},
    {name: "claude_opus_4_6_inspect", date: "2026-02-05", p50_min: 718.80683, p80_min: 69.874587},
    {name: "gpt_5_3_codex", date: "2026-02-05", p50_min: 349.530732, p80_min: 54.739407},
    {name: "gemini_3_1_pro", date: "2026-02-19", p50_min: 384.147435, p80_min: 89.801503},
    {name: "gpt_5_4", date: "2026-03-05", p50_min: 341.735276, p80_min: 53.877851},
    {name: "claude_mythos_preview_early_inspect", date: "2026-04-07", p50_min: 1044.780145, p80_min: 185.911829}
  ];

  // Chart chrome reads the CSS variables at draw time so it follows the live
  // palette. At the default palette these resolve to the chart's original
  // colors. Trace colors stay fixed; they're series identity, not chrome.
  function cssVar(name, fallback) {
    const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    return v || fallback;
  }
  function hexToRgb(hex) {
    const m = hex.replace('#', '');
    return { r: parseInt(m.substring(0, 2), 16), g: parseInt(m.substring(2, 4), 16), b: parseInt(m.substring(4, 6), 16) };
  }
  function blendHex(a, b, t) {
    const A = hexToRgb(a), B = hexToRgb(b);
    const h = x => Math.round(Math.max(0, Math.min(255, x))).toString(16).padStart(2, '0');
    return '#' + h(A.r + (B.r - A.r) * t) + h(A.g + (B.g - A.g) * t) + h(A.b + (B.b - A.b) * t);
  }
  function chartTheme() {
    const theme = {
      panel: cssVar('--secondary', '#2c2c2c'),
      text: cssVar('--text', '#e6f1ff'),
      label: cssVar('--neutral-gray', '#a2a2a3'),
      grid: '#333',
      legendBg: 'rgba(44,44,44,0.9)',
    };
    // The engine only ever writes 6-digit hexes; keep the defaults otherwise.
    const isHex = h => /^#[0-9a-f]{6}$/i.test(h);
    if (isHex(theme.panel) && isHex(theme.text)) {
      theme.grid = blendHex(theme.panel, theme.text, 0.04);
      const p = hexToRgb(theme.panel);
      theme.legendBg = `rgba(${p.r},${p.g},${p.b},0.9)`;
    }
    return theme;
  }

  function parseYamlToRawData(yaml) {
    const results = yaml.results;
    if (!results) throw new Error("No results in YAML");
    const data = [];
    for (const [name, entry] of Object.entries(results)) {
      const m = entry.metrics;
      if (!m || !m.p50_horizon_length || !m.p80_horizon_length) continue;
      data.push({
        name: name,
        date: entry.release_date,
        p50_min: m.p50_horizon_length.estimate,
        p80_min: m.p80_horizon_length.estimate
      });
    }
    return data;
  }

  function cleanModelName(name) {
    return name.replace(/_inspect$/, '');
  }

  function buildChart(rawData) {
    const processedData = rawData.map(d => {
      const p50_h = d.p50_min / 60;
      const p80_h = d.p80_min / 60;
      const logP50 = Math.log(p50_h);
      const logP80 = Math.log(p80_h);
      const slope = (logP80 - logP50) / 30;
      const logP99 = logP80 + (slope * 19);
      const p99_h = Math.exp(logP99);
      return {
        name: d.name, dateObj: new Date(d.date), dateStr: d.date,
        p50: p50_h, p80: p80_h, p99: p99_h, timestamp: new Date(d.date).getTime()
      };
    }).sort((a, b) => a.timestamp - b.timestamp);

    function calculateTrend(dataSubset, metricKey, startDate, endDate) {
      const x = [], y = [];
      dataSubset.forEach(d => {
        if (d[metricKey] > 0) { x.push(d.timestamp); y.push(Math.log(d[metricKey])); }
      });
      const n = x.length;
      if (n < 2) return { x: [], y: [] };
      const sumX = x.reduce((a, b) => a + b, 0);
      const sumY = y.reduce((a, b) => a + b, 0);
      const sumXY = x.reduce((sum, xi, i) => sum + (xi * y[i]), 0);
      const sumXX = x.reduce((sum, xi) => sum + (xi * xi), 0);
      const sl = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
      const intercept = (sumY - sl * sumX) / n;
      const startTs = startDate.getTime(), endTs = endDate.getTime();
      const trendX = [], trendY = [];
      const steps = 500, stepSize = (endTs - startTs) / steps;
      for (let i = 0; i <= steps; i++) {
        const ts = startTs + (i * stepSize);
        trendX.push(new Date(ts).toISOString().split('T')[0]);
        trendY.push(Math.exp(sl * ts + intercept));
      }
      return { x: trendX, y: trendY, doublingTime: (Math.log(2) / sl) / (1000 * 60 * 60 * 24) };
    }

    const fullStart = processedData[0].dateObj;
    const recentStart = new Date("2023-07-01");
    const futureEnd = new Date("2040-01-01");
    const dataRecent = processedData.filter(d => d.dateObj >= recentStart);

    const trends = {
      p50_all: calculateTrend(processedData, 'p50', fullStart, futureEnd),
      p80_all: calculateTrend(processedData, 'p80', fullStart, futureEnd),
      p99_all: calculateTrend(processedData, 'p99', fullStart, futureEnd),
      p50_recent: calculateTrend(dataRecent, 'p50', recentStart, futureEnd),
      p80_recent: calculateTrend(dataRecent, 'p80', recentStart, futureEnd),
      p99_recent: calculateTrend(dataRecent, 'p99', recentStart, futureEnd),
    };

    function makeScatter(metric, color, symbol, label) {
      return {
        x: processedData.map(d => d.dateStr), y: processedData.map(d => d[metric]),
        mode: 'markers', name: label,
        marker: { color, symbol, size: 7, opacity: 0.8 },
        text: processedData.map(d => `<b>${cleanModelName(d.name).replace(/_/g, ' ')}</b><br>${d.dateStr}<br>Hours: ${d[metric].toFixed(4)}`),
        hoverinfo: 'text'
      };
    }

    function makeLine(trendObj, color, dash, name) {
      return {
        x: trendObj.x, y: trendObj.y, mode: 'lines', name,
        line: { color, dash, width: 2 },
        text: trendObj.x.map((d, i) => `<b>${name}</b><br>${d}<br>Hours: ${trendObj.y[i].toFixed(4)}`),
        hoverinfo: 'text'
      };
    }

    const traces = [
      makeScatter('p50', '#1f77b4', 'circle', 'P50'),
      makeScatter('p80', '#ff7f0e', 'square', 'P80'),
      makeScatter('p99', '#2ca02c', 'triangle-up', 'P99 (Est.)'),
      makeLine(trends.p50_all, '#1f77b4', 'dot', 'P50 All-Time'),
      makeLine(trends.p80_all, '#ff7f0e', 'dot', 'P80 All-Time'),
      makeLine(trends.p99_all, '#2ca02c', 'dot', 'P99 All-Time'),
      makeLine(trends.p50_recent, '#1f77b4', 'solid', 'P50 Post-2023'),
      makeLine(trends.p80_recent, '#ff7f0e', 'solid', 'P80 Post-2023'),
      makeLine(trends.p99_recent, '#2ca02c', 'solid', 'P99 Post-2023'),
    ];

    const T = chartTheme();
    Plotly.newPlot('metr-chart', traces, {
      yaxis: {
        type: 'log', title: { text: 'Effective Horizon (Hours)', font: { color: T.label, size: 13 } },
        range: [-4.5, 4],
        tickvals: [0.0001, 0.001, 0.01, 0.1, 1, 10, 100, 1000, 10000],
        ticktext: ['0.0001', '0.001', '0.01', '0.1', '1', '10', '100', '1K', '10K'],
        gridcolor: T.grid, tickfont: { color: T.label }, zerolinecolor: T.grid
      },
      xaxis: {
        title: { text: 'Release Date', font: { color: T.label, size: 13 } },
        type: 'date', range: ['2019-01-01', '2027-06-01'],
        gridcolor: T.grid, tickfont: { color: T.label }, zerolinecolor: T.grid
      },
      hovermode: 'closest',
      dragmode: 'pan',
      plot_bgcolor: T.panel,
      paper_bgcolor: T.panel,
      legend: { x: 0.01, y: 0.99, bgcolor: T.legendBg, font: { color: T.text, size: 11 } },
      margin: { t: 20, r: 20, b: 60, l: 60 }
    }, { responsive: true, scrollZoom: true, displayModeBar: false });

    const fmt = d => (d / 30.44).toFixed(1);
    const avgAll = (trends.p50_all.doublingTime + trends.p80_all.doublingTime) / 2;
    const avgRecent = (trends.p50_recent.doublingTime + trends.p80_recent.doublingTime) / 2;
    const el = document.getElementById('doubling-times');
    el.innerHTML =
      `all-time doubling: <span>${fmt(avgAll)}mo</span><br>` +
      `post-2023 doubling: <span>${fmt(avgRecent)}mo</span>`;
  }

  const YAML_URL = 'https://corsproxy.io/?' + encodeURIComponent('https://metr.org/assets/benchmark_results_1_1.yaml');

  // Redraw with the same data when the theme cycler changes the palette.
  // Debounced: the color-picker fires once per drag tick.
  let lastData = null;
  let redrawTimer = null;
  window.addEventListener('dawson:palette', () => {
    if (!lastData) return;
    clearTimeout(redrawTimer);
    redrawTimer = setTimeout(() => buildChart(lastData), 150);
  });

  fetch(YAML_URL)
    .then(res => {
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.text();
    })
    .then(text => {
      const yaml = jsyaml.load(text);
      const fetched = parseYamlToRawData(yaml);
      if (fetched.length === 0) throw new Error("Parsed zero entries");
      lastData = fetched;
      buildChart(lastData);
    })
    .catch(() => {
      lastData = FALLBACK_DATA;
      buildChart(lastData);
    });
})();
