(function () {
  // Two live series from Indeed's Hiring Lab job-postings tracker, both indexed
  // to Feb 1 2020 = 100:
  //   - Software Development: sector file, "total postings".
  //   - All Jobs: national aggregate file, "total postings", NSA column (the
  //     sector file is non-seasonally-adjusted, so we match it with NSA for a
  //     fair comparison rather than the smoother SA series.)
  const SECTOR_URL = 'https://raw.githubusercontent.com/hiring-lab/job_postings_tracker/master/US/job_postings_by_sector_US.csv';
  const AGG_URL = 'https://raw.githubusercontent.com/hiring-lab/job_postings_tracker/master/US/aggregate_job_postings_US.csv';
  // Pre-baked FRED 10-year TIPS real yield, drawn as a dual-axis overlay on a
  // right-side y2 (same snapshot the cohort charts use).
  const RATE_URL = 'posts/assets/rate-data.json';

  // Monthly fallback snapshots (taken 2026-07-16), used only if the live fetch
  // fails. Regenerate from the CSVs rather than hand-editing; Indeed revises
  // history. Each entry is [date, index].
  const FALLBACK_SWE = [["2020-02-01",100],["2020-03-01",100.1],["2020-04-01",86.78],["2020-05-01",70.28],["2020-06-01",64.83],["2020-07-01",65.37],["2020-08-01",69.12],["2020-09-01",70.99],["2020-10-01",75],["2020-11-01",80.75],["2020-12-01",87.85],["2021-01-01",91.26],["2021-02-01",98.02],["2021-03-01",107.85],["2021-04-01",116.91],["2021-05-01",125.65],["2021-06-01",134.03],["2021-07-01",141.23],["2021-08-01",151.06],["2021-09-01",169.75],["2021-10-01",178.99],["2021-11-01",193.78],["2021-12-01",209.85],["2022-01-01",212.98],["2022-02-01",225.17],["2022-03-01",233.56],["2022-04-01",225.64],["2022-05-01",223.5],["2022-06-01",224.89],["2022-07-01",211.3],["2022-08-01",194.2],["2022-09-01",180.37],["2022-10-01",168.09],["2022-11-01",155.06],["2022-12-01",142.34],["2023-01-01",130.28],["2023-02-01",121.17],["2023-03-01",105.97],["2023-04-01",99.53],["2023-05-01",98.22],["2023-06-01",94.04],["2023-07-01",82.63],["2023-08-01",81.54],["2023-09-01",78.66],["2023-10-01",75.12],["2023-11-01",74.19],["2023-12-01",72.55],["2024-01-01",72.69],["2024-02-01",71.19],["2024-03-01",70.94],["2024-04-01",70.75],["2024-05-01",69.23],["2024-06-01",70.18],["2024-07-01",70.11],["2024-08-01",69.76],["2024-09-01",68.58],["2024-10-01",69.21],["2024-11-01",68.59],["2024-12-01",67.47],["2025-01-01",67.54],["2025-02-01",66.79],["2025-03-01",62.6],["2025-04-01",62.59],["2025-05-01",63.21],["2025-06-01",64.1],["2025-07-01",65.36],["2025-08-01",66.22],["2025-09-01",65.05],["2025-10-01",64.3],["2025-11-01",65.79],["2025-12-01",66.66],["2026-01-01",67.24],["2026-02-01",69.44],["2026-03-01",70.72],["2026-04-01",72.78],["2026-05-01",72.96],["2026-06-01",73.44],["2026-07-01",73.49]];
  const FALLBACK_ALL = [["2020-02-01",100],["2020-03-01",101.65],["2020-04-01",82.5],["2020-05-01",65.98],["2020-06-01",69.17],["2020-07-01",77.24],["2020-08-01",85.12],["2020-09-01",88.7],["2020-10-01",93.23],["2020-11-01",97.19],["2020-12-01",96.11],["2021-01-01",92.6],["2021-02-01",100.41],["2021-03-01",107.7],["2021-04-01",121.91],["2021-05-01",131.85],["2021-06-01",137.04],["2021-07-01",140.79],["2021-08-01",141.11],["2021-09-01",147.92],["2021-10-01",151.17],["2021-11-01",156.48],["2021-12-01",158.56],["2022-01-01",156.73],["2022-02-01",159.41],["2022-03-01",163.93],["2022-04-01",167.19],["2022-05-01",166.59],["2022-06-01",166.27],["2022-07-01",162.18],["2022-08-01",159.69],["2022-09-01",158.45],["2022-10-01",155.76],["2022-11-01",154.63],["2022-12-01",150],["2023-01-01",141.62],["2023-02-01",140.88],["2023-03-01",137.08],["2023-04-01",140.82],["2023-05-01",141.52],["2023-06-01",138.78],["2023-07-01",134.06],["2023-08-01",133.51],["2023-09-01",133.33],["2023-10-01",131.16],["2023-11-01",130.39],["2023-12-01",124.61],["2024-01-01",118.86],["2024-02-01",119.25],["2024-03-01",120.48],["2024-04-01",123.58],["2024-05-01",121.94],["2024-06-01",119.14],["2024-07-01",116.58],["2024-08-01",117.86],["2024-09-01",117.37],["2024-10-01",117.41],["2024-11-01",114.04],["2024-12-01",112.65],["2025-01-01",108.84],["2025-02-01",110.4],["2025-03-01",111.03],["2025-04-01",111.09],["2025-05-01",110.12],["2025-06-01",109.49],["2025-07-01",107.67],["2025-08-01",108.05],["2025-09-01",108.64],["2025-10-01",106.08],["2025-11-01",105.57],["2025-12-01",104.39],["2026-01-01",101.31],["2026-02-01",104.65],["2026-03-01",107.57],["2026-04-01",106.25],["2026-05-01",106.58],["2026-06-01",103.86],["2026-07-01",103.81]];

  // ---- theme plumbing (mirrors metr-chart.js) --------------------------------
  // Chart chrome reads the live CSS variables at draw time so it follows the
  // theme cycler. Series colors use the emphasis pattern: Software Development
  // (the story) tracks the accent; All Jobs (the context) wears the accent's
  // hue-wheel complement — colorful, but it can never land on the story's hue
  // as skins change. The cohort charts use the same rotation scheme.
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
  // Hue-rotate a hex color in HSL, keeping saturation/lightness (same helper
  // as cohorts-chart.js).
  function rotHueHex(hex, deg) {
    const { r, g, b } = hexToRgb(hex);
    const rn = r / 255, gn = g / 255, bn = b / 255;
    const max = Math.max(rn, gn, bn), min = Math.min(rn, gn, bn);
    const l = (max + min) / 2, d = max - min;
    let h = 0, s = 0;
    if (d) {
      s = d / (1 - Math.abs(2 * l - 1));
      if (max === rn) h = ((gn - bn) / d) % 6;
      else if (max === gn) h = (bn - rn) / d + 2;
      else h = (rn - gn) / d + 4;
      h *= 60;
    }
    h = ((h + deg) % 360 + 360) % 360;
    const c = (1 - Math.abs(2 * l - 1)) * s;
    const x = c * (1 - Math.abs((h / 60) % 2 - 1));
    const m = l - c / 2;
    const seg = [[c, x, 0], [x, c, 0], [0, c, x], [0, x, c], [x, 0, c], [c, 0, x]][Math.floor(h / 60)];
    const to = v => Math.round((v + m) * 255).toString(16).padStart(2, '0');
    return '#' + to(seg[0]) + to(seg[1]) + to(seg[2]);
  }
  function chartTheme() {
    const theme = {
      panel: cssVar('--secondary', '#2c2c2c'),
      text: cssVar('--text', '#e6f1ff'),
      label: cssVar('--neutral-gray', '#a2a2a3'),
      accent: cssVar('--accent', '#61ffda'),
      grid: '#333',
      baseline: '#4a4a4a',
      sliderBg: 'rgba(255,255,255,0.04)',
      rate: '#c9c9c9',
    };
    const isHex = h => /^#[0-9a-f]{6}$/i.test(h);
    if (isHex(theme.panel) && isHex(theme.text)) {
      theme.grid = blendHex(theme.panel, theme.text, 0.07);
      theme.baseline = blendHex(theme.panel, theme.text, 0.25);
      theme.sliderBg = blendHex(theme.panel, theme.text, 0.04);
    }
    // Rate overlay line: between neutral gray and full text ink, so it reads
    // as a reference layer, not a third jobs series.
    if (isHex(theme.label) && isHex(theme.text)) {
      theme.rate = blendHex(theme.label, theme.text, 0.55);
    }
    // All Jobs: the accent's complement (falls back to neutral gray on
    // non-hex accents). The chip/swatch in job-market-chart.css matches.
    theme.context = isHex(theme.accent) ? rotHueHex(theme.accent, 180) : theme.label;
    return theme;
  }

  // ---- data ------------------------------------------------------------------
  function parseCSV(text) {
    const lines = text.trim().split('\n');
    const headers = lines[0].split(',').map(h => h.trim());
    return lines.slice(1).map(line => {
      const cells = line.split(',');
      const row = {};
      headers.forEach((h, i) => { row[h] = (cells[i] || '').trim(); });
      return row;
    });
  }
  function toSeries(pairs) {
    return pairs.map(p => ({ date: p[0], value: p[1] }));
  }
  function sortByDate(series) {
    return series.filter(d => d.date && !isNaN(d.value)).sort((a, b) => a.date.localeCompare(b.date));
  }
  function extractSWE(rows) {
    return sortByDate(rows
      .filter(r => r.display_name === 'Software Development' && r.variable === 'total postings')
      .map(r => ({ date: r.date, value: parseFloat(r.indeed_job_postings_index) })));
  }
  function extractALL(rows) {
    return sortByDate(rows
      .filter(r => r.variable === 'total postings')
      .map(r => ({ date: r.date, value: parseFloat(r.indeed_job_postings_index_NSA) })));
  }
  function fetchSeries(url, extract, fallback) {
    return fetch(url)
      .then(res => { if (!res.ok) throw new Error('HTTP ' + res.status); return res.text(); })
      .then(text => {
        const data = extract(parseCSV(text));
        if (!data.length) throw new Error('parsed zero rows');
        return data;
      })
      .catch(() => toSeries(fallback));
  }
  // The overlay is garnish: if its fetch fails, the chart renders without it.
  function fetchRate() {
    return fetch(RATE_URL)
      .then(res => { if (!res.ok) throw new Error('HTTP ' + res.status); return res.json(); })
      .then(json => json.dates.map((d, i) => ({ date: d, value: json.series.dfii10[i] }))
        .filter(d => d.date && typeof d.value === 'number'))
      .catch(() => null);
  }

  // ---- chart -----------------------------------------------------------------
  const CHART_ID = 'job-market-chart';
  // This post now has several charts sharing the .jm-* toolbar classes; every
  // toolbar query below is scoped to this chart's own toolbar.
  const TOOLBAR = '.jm-toolbar[data-chart="jobs"] ';
  const SERIES = [
    { key: 'swe', name: 'Software Development' },
    { key: 'all', name: 'All Jobs' },
  ];
  // Release-day markers, toggled by the "AI Releases" checkbox. o3 uses the
  // full public release (not the Dec 2024 preview announcement); Fable 5 uses
  // the original June 9 release, not the post-export-control redeploy.
  const EVENTS = [
    { date: '2022-11-30', label: 'ChatGPT' },
    { date: '2023-03-14', label: 'GPT-4' },
    { date: '2025-04-16', label: 'o3' },
    { date: '2025-11-24', label: 'Opus 4.5' },
    { date: '2026-06-09', label: 'Fable 5' },
  ];
  const state = {
    swe: null, all: null,
    visible: { swe: true, all: true },
    showEvents: true,
    // 'index' plots the raw postings index; 'pct' re-expresses every visible
    // point as % change since the start of the current window, so the window
    // start (presets, pan, or the slider's left edge) is the rebase point.
    mode: 'index',
    // Displayed y-arrays per series for the current mode + window, plus
    // pre-formatted hover strings in % mode (see fmtPct).
    disp: { swe: null, all: null },
    hov: { swe: null, all: null },
    // Rate overlay on y2: raw always (never % rebased), clipped to the
    // postings' date span, toggled by the data-flag="rate" checkbox.
    rate: null,
    showRate: true,
  };
  // Set while we relayout programmatically, so the relayout listener can tell
  // our own range writes apart from user pans/slider drags.
  let squelchRelayout = false;

  // Plotly hands back range strings like "2023-05-01 12:32:14.5"; Safari's
  // Date.parse wants a "T" separator.
  function toTs(v) {
    return new Date(String(v).replace(' ', 'T')).getTime();
  }
  function fmtDate(dateStr) {
    const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const p = dateStr.split('-');
    return MONTHS[parseInt(p[1], 10) - 1] + ' ' + parseInt(p[2], 10) + ', ' + p[0];
  }

  // "+4.25%" / "-11.2%": sign always shown, ≤2 decimals, trailing zeros
  // trimmed. Used for %-mode hover text and the stat readout. Percent hover
  // values must be formatted in JS, not a hovertemplate d3 format: Plotly's
  // adjustFormat shim prepends "~" to any format containing f/p/s that doesn't
  // start with [~,.0$] (so "+.2f" → "~+.2f", invalid), then swallows the d3
  // error and falls back to raw unrounded String(value).
  function fmtPct(v) {
    const rounded = parseFloat(v.toFixed(2));
    return (rounded > 0 ? '+' : '') + rounded + '%';
  }

  function dataBounds() {
    const firsts = [], lasts = [];
    SERIES.forEach(s => {
      const d = state[s.key];
      firsts.push(d[0].date);
      lasts.push(d[d.length - 1].date);
    });
    return { first: firsts.sort()[0], last: lasts.sort().pop() };
  }

  // Current x-window as timestamps (falls back to full data bounds pre-render).
  function currentWindow() {
    const el = document.getElementById(CHART_ID);
    if (el && el._fullLayout && el._fullLayout.xaxis && el._fullLayout.xaxis.range) {
      const r = el._fullLayout.xaxis.range;
      return { x0: toTs(r[0]), x1: toTs(r[1]) };
    }
    const b = dataBounds();
    return { x0: toTs(b.first), x1: toTs(b.last) };
  }

  // First data point of a series at or after ts (the rebase anchor in % mode).
  function anchorFor(key, ts) {
    return state[key].find(d => toTs(d.date) >= ts) || null;
  }

  // Index of the last data point at or before ts (the window's right edge).
  function endIdxFor(key, ts) {
    const data = state[key];
    for (let i = data.length - 1; i >= 0; i--) {
      if (toTs(data[i].date) <= ts) return i;
    }
    return 0;
  }

  // Rebase every series to its first data point at/after x0 (% mode),
  // refreshing the displayed arrays and their hover strings.
  function rebaseTo(x0) {
    SERIES.forEach(s => {
      const anchor = anchorFor(s.key, x0);
      const v0 = anchor ? anchor.value : state[s.key][0].value;
      state.disp[s.key] = state[s.key].map(d => (d.value / v0 - 1) * 100);
      state.hov[s.key] = state.disp[s.key].map(fmtPct);
    });
  }

  // Recompute the displayed y-arrays for the current mode + window.
  function recomputeDisp() {
    if (state.mode === 'pct') {
      rebaseTo(currentWindow().x0);
      return;
    }
    SERIES.forEach(s => {
      state.disp[s.key] = state[s.key].map(d => d.value);
      state.hov[s.key] = null;
    });
  }

  // Y range of the visible series within [x0, x1] (timestamps), padded so the
  // lines never kiss the frame.
  function visibleYRange(x0, x1) {
    let min = Infinity, max = -Infinity;
    SERIES.forEach(s => {
      if (!state.visible[s.key]) return;
      const disp = state.disp[s.key];
      state[s.key].forEach((d, i) => {
        const t = toTs(d.date);
        if (t >= x0 && t <= x1) {
          const v = disp[i];
          if (v < min) min = v;
          if (v > max) max = v;
        }
      });
    });
    if (min === Infinity) return null;
    const pad = (max - min) * 0.08 || 2;
    return [min - pad, max + pad];
  }

  // y2 fit for the rate overlay within [x0, x1] — null when hidden/off-window.
  function overlayYRange(x0, x1) {
    if (!state.rate || !state.showRate) return null;
    let min = Infinity, max = -Infinity;
    state.rate.forEach(d => {
      const t = toTs(d.date);
      if (t >= x0 && t <= x1) {
        if (d.value < min) min = d.value;
        if (d.value > max) max = d.value;
      }
    });
    if (min === Infinity) return null;
    const pad = (max - min) * 0.08 || 0.5;
    return [min - pad, max + pad];
  }

  // Rescale y to fit whatever x window is currently showing.
  function rescaleY() {
    const el = document.getElementById(CHART_ID);
    if (!el || !el._fullLayout) return;
    const win = currentWindow();
    const yr = visibleYRange(win.x0, win.x1);
    if (!yr) return;
    const upd = { 'yaxis.range': yr };
    const yr2 = overlayYRange(win.x0, win.x1);
    if (yr2) upd['yaxis2.range'] = yr2;
    squelchRelayout = true;
    Plotly.relayout(el, upd).then(() => { squelchRelayout = false; });
  }

  // Push the current disp arrays into the traces (used when the rebase anchor
  // moves in % mode). restyle fires plotly_restyle, not plotly_relayout, so
  // this never loops with the relayout listener.
  function pushDisp() {
    Plotly.restyle(CHART_ID, {
      y: SERIES.map(s => state.disp[s.key]),
      text: SERIES.map(s => state.hov[s.key]),
    }, SERIES.map((s, i) => i));
  }

  // ---- tab strips (jobs-menu style sliding underline) ------------------------
  // Same recipe as the jobs menu highlight bar: offsetLeft/offsetWidth against
  // the strip. A null btn means no tab active — the bar fades out.
  function setActiveTab(strip, btn) {
    if (!strip) return;
    strip.querySelectorAll('button').forEach(b => b.classList.toggle('is-active', b === btn));
    const hl = strip.querySelector('.jm-hl');
    if (!hl) return;
    if (!btn) {
      hl.style.opacity = '0';
      return;
    }
    hl.style.left = btn.offsetLeft + 'px';
    hl.style.width = btn.offsetWidth + 'px';
    hl.style.opacity = '1';
  }

  // Re-seat the bars when tab widths change under them (resize, late webfont).
  function reseatTabBars() {
    document.querySelectorAll('.jm-tabs').forEach(strip => {
      const active = strip.querySelector('button.is-active');
      if (!active) return;
      const hl = strip.querySelector('.jm-hl');
      if (hl) hl.style.transition = 'none';
      setActiveTab(strip, active);
      if (hl) {
        void hl.offsetWidth;
        hl.style.transition = '';
      }
    });
  }
  window.addEventListener('resize', reseatTabBars);
  window.addEventListener('load', reseatTabBars);

  // Range slider: only the two edge grabbers are draggable. Plotly also pans
  // the window from the slidebox (middle) and jumps it on background clicks —
  // swallow those interactions in the capture phase before Plotly's handler
  // (which sits on the slider's SVG group) ever sees them. Delegated on
  // document so it survives Plotly re-renders of the slider.
  const GRABBER_SELECTOR = [
    '.rangeslider-grabber-min', '.rangeslider-grabarea-min', '.rangeslider-handle-min',
    '.rangeslider-grabber-max', '.rangeslider-grabarea-max', '.rangeslider-handle-max',
  ].join(', ');
  const GRABBER_MIN_SELECTOR = '.rangeslider-grabber-min, .rangeslider-grabarea-min, .rangeslider-handle-min';

  // While an edge grabber is held, a small tip above it shows the date that
  // edge sits on, live-updated from the relayout stream as the handle moves.
  let dragSide = null; // 'min' | 'max' during a grabber drag, else null
  function dragTipEl(chart) {
    let tip = chart.querySelector('.jm-drag-tip');
    if (!tip) {
      tip = document.createElement('div');
      tip.className = 'jm-drag-tip';
      chart.appendChild(tip);
    }
    return tip;
  }
  // Plotly range values are date strings mid-drag ("2023-05-01 12:32:14"),
  // but guard for numeric timestamps too.
  function rangeDateStr(v) {
    if (typeof v === 'number') return new Date(v).toISOString().slice(0, 10);
    return String(v).slice(0, 10);
  }
  function updateDragTip() {
    if (!dragSide) return;
    const el = document.getElementById(CHART_ID);
    if (!el || !el._fullLayout || !el._fullLayout.xaxis || !el._fullLayout.xaxis.range) return;
    const grab = el.querySelector('.rangeslider-grabber-' + dragSide);
    if (!grab) return;
    const tip = dragTipEl(el);
    tip.textContent = fmtDate(rangeDateStr(el._fullLayout.xaxis.range[dragSide === 'min' ? 0 : 1]));
    tip.style.display = 'block';
    const box = el.getBoundingClientRect();
    const g = grab.getBoundingClientRect();
    const half = tip.offsetWidth / 2;
    const cx = g.left + g.width / 2 - box.left;
    tip.style.left = Math.max(half + 4, Math.min(box.width - half - 4, cx)) - half + 'px';
    tip.style.top = (g.top - box.top - tip.offsetHeight - 8) + 'px';
  }
  function hideDragTip() {
    dragSide = null;
    const el = document.getElementById(CHART_ID);
    const tip = el && el.querySelector('.jm-drag-tip');
    if (tip) tip.style.display = 'none';
  }

  ['mousedown', 'touchstart'].forEach(type => {
    document.addEventListener(type, e => {
      if (!(e.target instanceof Element)) return;
      if (!e.target.closest('#' + CHART_ID + ' .rangeslider-container')) return;
      const grab = e.target.closest(GRABBER_SELECTOR);
      if (grab) {
        // Edge drag begins — show the date tip for that edge until release.
        dragSide = grab.matches(GRABBER_MIN_SELECTOR) ? 'min' : 'max';
        updateDragTip();
        return;
      }
      e.stopPropagation();
    }, true);
  });
  ['mouseup', 'touchend', 'touchcancel'].forEach(type => {
    document.addEventListener(type, () => { if (dragSide) hideDragTip(); }, true);
  });

  // The site cursor (js/cursor-follow.js) only expands over a/button/.job-menu-item.
  // Extend it to this chart's checkbox labels and the range slider's edge
  // grabbers (the only draggable part of the slider). Delegated on document so
  // it survives Plotly re-renders; toggles the same class the site handler uses.
  const CURSOR_TARGETS = '.jm-check, ' + GRABBER_SELECTOR;
  document.addEventListener('mouseover', e => {
    if (!(e.target instanceof Element)) return;
    if (e.target.closest(CURSOR_TARGETS)) {
      const c = document.querySelector('.cursor-follow');
      if (c) c.classList.add('cursor-follow-clickable');
    }
  });
  document.addEventListener('mouseout', e => {
    if (!(e.target instanceof Element)) return;
    if (e.target.closest(CURSOR_TARGETS)) {
      const c = document.querySelector('.cursor-follow');
      if (c) c.classList.remove('cursor-follow-clickable');
    }
  });

  // Range presets set x and the matching y in one update. months = null → all.
  function applyRange(months, btn) {
    const el = document.getElementById(CHART_ID);
    const { first, last } = dataBounds();
    let start = first;
    if (months) {
      const d = new Date(last + 'T00:00:00');
      d.setMonth(d.getMonth() - months);
      const iso = d.toISOString().slice(0, 10);
      if (iso > first) start = iso;
    }
    // Rebase to the new window start before measuring the y fit.
    const winX0 = toTs(start), winX1 = toTs(last);
    if (state.mode === 'pct') rebaseTo(winX0);
    const yr = visibleYRange(winX0, winX1);
    const layoutUpd = { 'xaxis.range': [start, last], 'yaxis.range': yr };
    const yr2 = overlayYRange(winX0, winX1);
    if (yr2) layoutUpd['yaxis2.range'] = yr2;
    squelchRelayout = true;
    Plotly.update(el,
      { y: SERIES.map(s => state.disp[s.key]), text: SERIES.map(s => state.hov[s.key]) },
      layoutUpd,
      SERIES.map((s, i) => i)
    ).then(() => { squelchRelayout = false; });
    setActiveTab(document.querySelector(TOOLBAR + '.jm-ranges'), btn);
    updateStat();
  }

  function traceFor(key, color) {
    const data = state[key];
    const meta = SERIES.find(s => s.key === key);
    return {
      x: data.map(d => d.date),
      y: state.disp[key],
      name: meta.name,
      mode: 'lines',
      line: { color, width: 2, shape: 'linear' },
      visible: state.visible[key] ? true : 'legendonly',
      text: state.mode === 'pct' ? state.hov[key] : null,
      hovertemplate: state.mode === 'pct'
        ? '<b>%{text}</b>  %{fullData.name}<extra></extra>'
        : '<b>%{y:.1f}</b>  %{fullData.name}<extra></extra>',
    };
  }

  function buildChart() {
    const T = chartTheme();
    const traces = [
      traceFor('swe', T.accent),
      traceFor('all', T.context),
    ];
    const showRate = !!(state.rate && state.rate.length && state.showRate);
    if (showRate) {
      // Dual-axis overlay: dashed, mid-gray, on its own right-side y2 so its
      // scale never distorts the postings index. Excluded from % rebasing,
      // the stat readout, and the series-checkbox min-one rule. Monthly data
      // on a daily axis, so the unified hover only lists it on the 1st.
      traces.push({
        x: state.rate.map(d => d.date),
        y: state.rate.map(d => d.value),
        name: '10-year real rate',
        yaxis: 'y2',
        mode: 'lines',
        line: { color: T.rate, width: 1.5, dash: 'dash' },
        hovertemplate: '<b>%{y:.2f}%</b>  %{fullData.name}<extra></extra>',
      });
    }
    const axisFont = { color: T.label, size: 12 };
    const pct = state.mode === 'pct';
    const win = currentWindow();
    const layout = {
      xaxis: {
        type: 'date',
        // The strip's mini chart keeps its own fixed y scale (auto = fit the
        // full data once) instead of the default 'match', so it doesn't
        // bounce every time the main plot's y refits to the window.
        rangeslider: {
          visible: true, bgcolor: T.sliderBg, bordercolor: T.grid, borderwidth: 1, thickness: 0.09,
          yaxis: { rangemode: 'auto' }, yaxis2: { rangemode: 'auto' },
        },
        gridcolor: T.grid, tickfont: axisFont, zerolinecolor: T.grid,
      },
      yaxis: {
        title: {
          text: pct ? '% change since window start' : 'Postings index (Feb 2020 = 100)',
          font: { color: T.label, size: 12 },
        },
        ticksuffix: pct ? '%' : '',
        gridcolor: T.grid, tickfont: axisFont, zerolinecolor: T.grid,
      },
      // Dashed = threshold semantics: the reference level everything is
      // measured against (the Feb 2020 baseline, or the window start in % mode).
      shapes: [{
        type: 'line', xref: 'paper', x0: 0, x1: 1, y0: pct ? 0 : 100, y1: pct ? 0 : 100,
        line: { color: T.baseline, width: 1, dash: 'dot' },
      }].concat(state.showEvents ? EVENTS.map(ev => ({
        type: 'line', x0: ev.date, x1: ev.date, yref: 'paper', y0: 0, y1: 1,
        line: { color: T.baseline, width: 1, dash: 'dash' },
      })) : []),
      annotations: state.showEvents ? EVENTS.map(ev => ({
        x: ev.date, xref: 'x', y: 1, yref: 'paper',
        text: ev.label, showarrow: false,
        textangle: 270, xanchor: 'left', yanchor: 'top', xshift: 2,
        font: { color: T.label, size: 11 },
      })) : [],
      hovermode: 'x unified',
      hoverlabel: {
        bgcolor: T.panel, bordercolor: T.grid,
        font: { color: T.text, size: 13 },
      },
      dragmode: 'pan',
      plot_bgcolor: T.panel,
      paper_bgcolor: T.panel,
      showlegend: false,
      // Keep the user's zoom/pan/range window across theme redraws.
      uirevision: 'job-market',
      // Right margin widens for the overlay axis' own tick labels.
      margin: { t: 16, r: showRate ? 46 : 16, b: 8, l: 56 },
    };
    if (showRate) {
      // Ticks wear the overlay line's color so the axis↔line pairing reads.
      layout.yaxis2 = {
        overlaying: 'y', side: 'right', ticksuffix: '%',
        showgrid: false, zeroline: false, fixedrange: true,
        tickfont: { color: T.rate, size: 12 },
      };
      const yr2 = overlayYRange(win.x0, win.x1);
      if (yr2) layout.yaxis2.range = yr2;
    }
    // scrollZoom off: two-finger scroll should scroll the page, not zoom the
    // chart. Zooming lives in the presets and the slider's edge handles.
    Plotly.react(CHART_ID, traces, layout, { responsive: true, scrollZoom: false, displayModeBar: false });

    const el = document.getElementById(CHART_ID);
    if (el && !el.__jmRelayoutBound) {
      el.__jmRelayoutBound = true;
      // User pans, wheel-zooms, or drags the range slider → the window moved:
      // rebase % mode, refresh the stat readout (it tracks the window's end),
      // refit y, and drop the preset highlight (it's a custom range now). Our
      // own programmatic writes are squelched.
      el.on('plotly_relayout', ev => {
        if (squelchRelayout) return;
        if (!Object.keys(ev).some(k => k.startsWith('xaxis'))) return;
        setActiveTab(document.querySelector(TOOLBAR + '.jm-ranges'), null);
        if (state.mode === 'pct') {
          recomputeDisp();
          pushDisp();
        }
        updateStat();
        updateDragTip();
        rescaleY();
      });
    }

    updateStat();
  }

  // Values at the right edge of the current window, keyed by a colored line
  // swatch (identity lives in the mark, not the text). Index mode shows the
  // index level on the window's end date; % mode shows change across the
  // window (start → end). Both follow the slider's end handle live.
  function updateStat() {
    const el = document.getElementById('jm-stat');
    if (!el) return;
    const pct = state.mode === 'pct';
    const win = currentWindow();
    const rows = SERIES.map(s => {
      const v = state.disp[s.key][endIdxFor(s.key, win.x1)];
      const shown = pct ? fmtPct(v) : v.toFixed(1);
      return '<span class="jm-key jm-key-' + s.key + '"></span>' +
        s.name.toLowerCase() + ': <span class="jm-val">' + shown + '</span>';
    });
    const end = state[SERIES[0].key][endIdxFor(SERIES[0].key, win.x1)];
    if (pct) {
      const anchor = anchorFor(SERIES[0].key, win.x0) || state[SERIES[0].key][0];
      rows.push('<span class="jm-asof">' + fmtDate(anchor.date) + ' → ' + fmtDate(end.date) + '</span>');
    } else {
      rows.push('<span class="jm-asof">as of ' + fmtDate(end.date) + '</span>');
    }
    el.innerHTML = rows.join('<br>');
  }

  function wireControls() {
    // Series checkboxes. Keep at least one series visible so the chart never
    // goes blank; y refits to what's left.
    document.querySelectorAll(TOOLBAR + '.jm-check input').forEach(input => {
      input.addEventListener('change', () => {
        const label = input.closest('.jm-check');
        // The AI Releases checkbox toggles the marker lines, not a series.
        if (label.dataset.flag === 'events') {
          state.showEvents = input.checked;
          buildChart();
          return;
        }
        // The Interest Rate checkbox toggles the y2 overlay, not a series.
        if (label.dataset.flag === 'rate') {
          state.showRate = input.checked;
          buildChart();
          return;
        }
        const key = label.dataset.series;
        const turningOff = state.visible[key];
        const anyOtherOn = SERIES.some(s => s.key !== key && state.visible[s.key]);
        if (turningOff && !anyOtherOn) {
          input.checked = true;
          return;
        }
        state.visible[key] = input.checked;
        const idx = SERIES.findIndex(s => s.key === key);
        Plotly.restyle(CHART_ID, { visible: state.visible[key] ? true : 'legendonly' }, [idx])
          .then(rescaleY);
      });
    });

    // Range presets.
    document.querySelectorAll(TOOLBAR + '.jm-range').forEach(btn => {
      btn.addEventListener('click', () => {
        const m = btn.dataset.months;
        applyRange(m === 'all' ? null : parseInt(m, 10), btn);
      });
    });

    // View mode: raw index vs % change since window start.
    document.querySelectorAll(TOOLBAR + '.jm-mode').forEach(btn => {
      btn.addEventListener('click', () => {
        if (btn.classList.contains('is-active')) return;
        state.mode = btn.dataset.mode;
        setActiveTab(document.querySelector(TOOLBAR + '.jm-modes'), btn);
        recomputeDisp();
        buildChart();
        rescaleY();
      });
    });
  }

  // Redraw with the same data when the theme cycler changes the palette.
  // Debounced: the color picker fires once per drag tick. uirevision preserves
  // the current window.
  let redrawTimer = null;
  window.addEventListener('dawson:palette', () => {
    if (!state.swe) return;
    clearTimeout(redrawTimer);
    redrawTimer = setTimeout(buildChart, 150);
  });

  Promise.all([
    fetchSeries(SECTOR_URL, extractSWE, FALLBACK_SWE),
    fetchSeries(AGG_URL, extractALL, FALLBACK_ALL),
    fetchRate(),
  ]).then(([swe, all, rate]) => {
    state.swe = swe;
    state.all = all;
    // Clip the rate to the postings' span so its longer history (2003→) can't
    // stretch the rangeslider back past Feb 2020.
    const b = dataBounds();
    state.rate = rate && rate.filter(d => d.date >= b.first && d.date <= b.last);
    const rateInput = document.querySelector(TOOLBAR + '.jm-check[data-flag="rate"] input');
    state.showRate = rateInput ? rateInput.checked : false;
    recomputeDisp();
    buildChart();
    wireControls();
    reseatTabBars();
  });
})();
