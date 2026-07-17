(function () {
  // The cohort charts of the AI & Job Market post: charts driven by one small
  // factory, all fed from pre-baked JSON snapshots committed to the repo
  // (their sources can't be fetched client-side — see
  // docs/prebake-cohort-data.py):
  //   - #cohort-unemp-chart  NY Fed unemployment rate by group (monthly, 1990→).
  //   - #cohort-swe-chart    Canaries/ADP software-developer employment index by
  //     age bucket (monthly, 100 = Nov 2022).
  // Both also carry the FRED 10-year TIPS real yield (rate-data.json) as a
  // dual-axis overlay on a right-side y2 — it replaced the standalone
  // #rate-chart strip, which is kept commented out at the bottom of this file.
  // Interaction patterns mirror job-market-chart.js (the canonical template):
  // jobs-menu toolbar, edge-only rangeslider with a drag date tip, window-end
  // stat readout, % change rebasing, theme-var chrome + dawson:palette redraw.

  // ---- theme plumbing (same recipe as job-market-chart.js) -------------------
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
  const isHex = h => /^#[0-9a-f]{6}$/i.test(h);
  // Blend that degrades gracefully when a theme serves non-hex colors.
  function blendSafe(a, b, t) {
    return (isHex(a) && isHex(b)) ? blendHex(a, b, t) : a;
  }
  // Hue-rotate a hex color in HSL, keeping saturation/lightness. Cohort hues
  // are spun off the accent so they follow every skin but can never land on
  // the story series' own hue.
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
  // Rotation that degrades to a fallback color on non-hex accents.
  function rotSafe(hex, deg, fallback) {
    return isHex(hex) ? rotHueHex(hex, deg) : fallback;
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
    if (isHex(theme.panel) && isHex(theme.text)) {
      theme.grid = blendHex(theme.panel, theme.text, 0.07);
      theme.baseline = blendHex(theme.panel, theme.text, 0.25);
      theme.sliderBg = blendHex(theme.panel, theme.text, 0.04);
    }
    // Rate overlay line: between the neutral-gray benchmark series and full
    // text ink, so it reads as a reference layer, not another cohort.
    theme.rate = blendSafe(theme.label, theme.text, 0.55);
    return theme;
  }

  // Same release-day markers as the postings chart, for visual continuity.
  const EVENTS = [
    { date: '2022-11-30', label: 'ChatGPT' },
    { date: '2023-03-14', label: 'GPT-4' },
    { date: '2025-04-16', label: 'o3' },
    { date: '2025-11-24', label: 'Opus 4.5' },
    { date: '2026-06-09', label: 'Fable 5' },
  ];

  function toTs(v) {
    return new Date(String(v).replace(' ', 'T')).getTime();
  }
  function fmtDate(dateStr) {
    const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const p = dateStr.split('-');
    return MONTHS[parseInt(p[1], 10) - 1] + ' ' + parseInt(p[2], 10) + ', ' + p[0];
  }
  function rangeDateStr(v) {
    if (typeof v === 'number') return new Date(v).toISOString().slice(0, 10);
    return String(v).slice(0, 10);
  }

  // "+4.25%" / "-11.2%" for %-mode hover text and the stat readout. Formatted
  // in JS, not a hovertemplate d3 format — Plotly's adjustFormat shim breaks
  // signed f-formats and falls back to raw String(value) (see the fmtPct note
  // in job-market-chart.js).
  function fmtPct(v) {
    const rounded = parseFloat(v.toFixed(2));
    return (rounded > 0 ? '+' : '') + rounded + '%';
  }

  // Sliding-underline tab strips (same recipe as job-market-chart.js).
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

  // ---- chart factory ---------------------------------------------------------
  // cfg: {
  //   id, statId, toolbar,            // ids + a '.jm-toolbar[data-chart="…"] ' prefix
  //   dataUrl,                        // pre-baked JSON: { dates: [], series: {jsonKey: []} }
  //   series: [{ key, json, name, color(T), dash? }],   // fixed order = trace order
  //   hasModes,                       // true → Index / % Change tabs exist in the DOM
  //   yTitle(mode), ticksuffix(mode), baseline(mode),   // axis chrome per mode
  //   hover(mode), fmtVal(v),         // hovertemplate + stat formatting (non-% mode)
  //   uirev, initialMonths,           // uirevision key; preset window applied on load
  //   bands,                          // optional [{x0, x1, label}] shaded reference
  //                                   // periods (e.g. the Fed hiking cycle)
  //   overlay,                        // optional { dataUrl, json, name }: one extra
  //                                   // series on a right-side y2 axis, clipped to
  //                                   // the base series' date span, always raw
  //                                   // (never % rebased), toggled by the toolbar's
  //                                   // data-flag="rate" checkbox
  // }
  function makeCohortChart(cfg) {
    const state = {
      data: {},                    // key → [{date, value}]
      visible: {},
      showEvents: false,
      mode: 'index',               // 'index' = raw values; 'pct' = rebased to window start
      disp: {},
      hov: {},                     // pre-formatted % hover strings (null in index mode)
      overlayData: null,           // [{date, value}] for cfg.overlay, clipped to base span
      showOverlay: false,
    };
    let squelchRelayout = false;
    let dragSide = null;

    function seriesInput(key) {
      return document.querySelector(cfg.toolbar + '.jm-check[data-series="' + key + '"] input');
    }

    function dataBounds() {
      const firsts = [], lasts = [];
      cfg.series.forEach(s => {
        const d = state.data[s.key];
        firsts.push(d[0].date);
        lasts.push(d[d.length - 1].date);
      });
      return { first: firsts.sort()[0], last: lasts.sort().pop() };
    }

    function currentWindow() {
      const el = document.getElementById(cfg.id);
      if (el && el._fullLayout && el._fullLayout.xaxis && el._fullLayout.xaxis.range) {
        const r = el._fullLayout.xaxis.range;
        return { x0: toTs(r[0]), x1: toTs(r[1]) };
      }
      const b = dataBounds();
      return { x0: toTs(b.first), x1: toTs(b.last) };
    }

    function anchorFor(key, ts) {
      return state.data[key].find(d => toTs(d.date) >= ts) || null;
    }

    function endIdxFor(key, ts) {
      const data = state.data[key];
      for (let i = data.length - 1; i >= 0; i--) {
        if (toTs(data[i].date) <= ts) return i;
      }
      return 0;
    }

    function rebaseTo(x0) {
      cfg.series.forEach(s => {
        const anchor = anchorFor(s.key, x0);
        const v0 = anchor ? anchor.value : state.data[s.key][0].value;
        state.disp[s.key] = state.data[s.key].map(d => (d.value / v0 - 1) * 100);
        state.hov[s.key] = state.disp[s.key].map(fmtPct);
      });
    }

    function recomputeDisp() {
      if (state.mode === 'pct') {
        rebaseTo(currentWindow().x0);
        return;
      }
      cfg.series.forEach(s => {
        state.disp[s.key] = state.data[s.key].map(d => d.value);
        state.hov[s.key] = null;
      });
    }

    function visibleYRange(x0, x1) {
      let min = Infinity, max = -Infinity;
      cfg.series.forEach(s => {
        if (!state.visible[s.key]) return;
        const disp = state.disp[s.key];
        state.data[s.key].forEach((d, i) => {
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

    // y2 fit for the overlay within [x0, x1] — null when hidden or off-window.
    function overlayYRange(x0, x1) {
      if (!state.overlayData || !state.showOverlay) return null;
      let min = Infinity, max = -Infinity;
      state.overlayData.forEach(d => {
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

    function rescaleY() {
      const el = document.getElementById(cfg.id);
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

    function pushDisp() {
      Plotly.restyle(cfg.id, {
        y: cfg.series.map(s => state.disp[s.key]),
        text: cfg.series.map(s => state.hov[s.key]),
      }, cfg.series.map((s, i) => i));
    }

    function applyRange(months, btn) {
      const el = document.getElementById(cfg.id);
      const { first, last } = dataBounds();
      let start = first;
      if (months) {
        const d = new Date(last + 'T00:00:00');
        d.setMonth(d.getMonth() - months);
        const iso = d.toISOString().slice(0, 10);
        if (iso > first) start = iso;
      }
      const winX0 = toTs(start), winX1 = toTs(last);
      if (state.mode === 'pct') rebaseTo(winX0);
      const yr = visibleYRange(winX0, winX1);
      const layoutUpd = { 'xaxis.range': [start, last], 'yaxis.range': yr };
      const yr2 = overlayYRange(winX0, winX1);
      if (yr2) layoutUpd['yaxis2.range'] = yr2;
      squelchRelayout = true;
      Plotly.update(el,
        { y: cfg.series.map(s => state.disp[s.key]), text: cfg.series.map(s => state.hov[s.key]) },
        layoutUpd,
        cfg.series.map((s, i) => i)
      ).then(() => { squelchRelayout = false; });
      setActiveTab(document.querySelector(cfg.toolbar + '.jm-ranges'), btn);
      updateStat();
    }

    // ---- drag date tip (same behavior as the postings chart) -----------------
    function dragTipEl(chart) {
      let tip = chart.querySelector('.jm-drag-tip');
      if (!tip) {
        tip = document.createElement('div');
        tip.className = 'jm-drag-tip';
        chart.appendChild(tip);
      }
      return tip;
    }
    function updateDragTip() {
      if (!dragSide) return;
      const el = document.getElementById(cfg.id);
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
      const el = document.getElementById(cfg.id);
      const tip = el && el.querySelector('.jm-drag-tip');
      if (tip) tip.style.display = 'none';
    }

    const GRABBER_SELECTOR = [
      '.rangeslider-grabber-min', '.rangeslider-grabarea-min', '.rangeslider-handle-min',
      '.rangeslider-grabber-max', '.rangeslider-grabarea-max', '.rangeslider-handle-max',
    ].join(', ');
    const GRABBER_MIN_SELECTOR = '.rangeslider-grabber-min, .rangeslider-grabarea-min, .rangeslider-handle-min';
    ['mousedown', 'touchstart'].forEach(type => {
      document.addEventListener(type, e => {
        if (!(e.target instanceof Element)) return;
        if (!e.target.closest('#' + cfg.id + ' .rangeslider-container')) return;
        const grab = e.target.closest(GRABBER_SELECTOR);
        if (grab) {
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

    // ---- render --------------------------------------------------------------
    function traceFor(s, T) {
      const data = state.data[s.key];
      return {
        x: data.map(d => d.date),
        y: state.disp[s.key],
        name: s.name,
        mode: 'lines',
        line: { color: s.color(T), width: 2, shape: 'linear', dash: s.dash || 'solid' },
        visible: state.visible[s.key] ? true : 'legendonly',
        text: state.mode === 'pct' ? state.hov[s.key] : null,
        hovertemplate: cfg.hover(state.mode),
      };
    }

    // The dual-axis overlay line: dashed, mid-gray, on its own right-side y2 so
    // its scale never distorts the cohorts. Deliberately excluded from % mode
    // rebasing, the stat readout, and the series-checkbox min-one rule.
    function overlayTrace(T) {
      return {
        x: state.overlayData.map(d => d.date),
        y: state.overlayData.map(d => d.value),
        name: cfg.overlay.name,
        yaxis: 'y2',
        mode: 'lines',
        line: { color: T.rate, width: 1.5, dash: 'dash' },
        hovertemplate: '<b>%{y:.2f}%</b>  %{fullData.name}<extra></extra>',
      };
    }

    function buildChart() {
      const T = chartTheme();
      const axisFont = { color: T.label, size: 12 };
      const base = cfg.baseline(state.mode);
      const showOv = !!(state.overlayData && state.overlayData.length && state.showOverlay);
      const win = currentWindow();
      const traces = cfg.series.map(s => traceFor(s, T));
      if (showOv) traces.push(overlayTrace(T));
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
          title: { text: cfg.yTitle(state.mode), font: { color: T.label, size: 12 } },
          ticksuffix: cfg.ticksuffix(state.mode),
          gridcolor: T.grid, tickfont: axisFont, zerolinecolor: T.grid,
        },
        // Shaded bands sit under everything; the dotted line is the reference
        // level; dashed verticals are the release markers.
        shapes: (cfg.bands || []).map(b => ({
          type: 'rect', x0: b.x0, x1: b.x1, yref: 'paper', y0: 0, y1: 1,
          fillcolor: blendSafe(T.panel, T.text, 0.08), line: { width: 0 }, layer: 'below',
        })).concat(base === null ? [] : [{
          type: 'line', xref: 'paper', x0: 0, x1: 1, y0: base, y1: base,
          line: { color: T.baseline, width: 1, dash: 'dot' },
        }]).concat(state.showEvents ? EVENTS.map(ev => ({
          type: 'line', x0: ev.date, x1: ev.date, yref: 'paper', y0: 0, y1: 1,
          line: { color: T.baseline, width: 1, dash: 'dash' },
        })) : []),
        // Band labels sit at the bottom so they never collide with the release
        // labels hanging from the top.
        annotations: (cfg.bands || []).map(b => ({
          x: new Date((toTs(b.x0) + toTs(b.x1)) / 2).toISOString().slice(0, 10),
          xref: 'x', y: 0.02, yref: 'paper',
          text: b.label, showarrow: false, yanchor: 'bottom',
          font: { color: T.label, size: 11 },
        })).concat(state.showEvents ? EVENTS.map(ev => ({
          x: ev.date, xref: 'x', y: 1, yref: 'paper',
          text: ev.label, showarrow: false,
          textangle: 270, xanchor: 'left', yanchor: 'top', xshift: 2,
          font: { color: T.label, size: 11 },
        })) : []),
        hovermode: 'x unified',
        hoverlabel: {
          bgcolor: T.panel, bordercolor: T.grid,
          font: { color: T.text, size: 13 },
        },
        dragmode: 'pan',
        plot_bgcolor: T.panel,
        paper_bgcolor: T.panel,
        showlegend: false,
        uirevision: cfg.uirev,
        // Right margin widens for the overlay axis' own tick labels.
        margin: { t: 16, r: showOv ? 46 : 16, b: 8, l: 56 },
      };
      if (showOv) {
        // Ticks wear the overlay line's color so the axis↔line pairing reads.
        layout.yaxis2 = {
          overlaying: 'y', side: 'right', ticksuffix: '%',
          showgrid: false, zeroline: false, fixedrange: true,
          tickfont: { color: T.rate, size: 12 },
        };
        const yr2 = overlayYRange(win.x0, win.x1);
        if (yr2) layout.yaxis2.range = yr2;
      }
      // scrollZoom off: two-finger scroll should scroll the page, not zoom
      // the chart. Zooming lives in the presets and the slider's edge handles.
      Plotly.react(cfg.id, traces, layout, { responsive: true, scrollZoom: false, displayModeBar: false });

      const el = document.getElementById(cfg.id);
      if (el && !el.__ccRelayoutBound) {
        el.__ccRelayoutBound = true;
        el.on('plotly_relayout', ev => {
          if (squelchRelayout) return;
          if (!Object.keys(ev).some(k => k.startsWith('xaxis'))) return;
          setActiveTab(document.querySelector(cfg.toolbar + '.jm-ranges'), null);
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

    // Window-end values for the CHECKED cohorts only (up to 6 rows here, so
    // hidden series stay out of the readout, unlike the two-line postings chart).
    function updateStat() {
      const el = document.getElementById(cfg.statId);
      if (!el) return;
      const pct = state.mode === 'pct';
      const win = currentWindow();
      const rows = cfg.series.filter(s => state.visible[s.key]).map(s => {
        const v = state.disp[s.key][endIdxFor(s.key, win.x1)];
        const shown = pct ? fmtPct(v) : cfg.fmtVal(v);
        return '<span class="jm-key cc-key-' + s.key + '"></span>' +
          s.name.toLowerCase() + ': <span class="jm-val">' + shown + '</span>';
      });
      const ref = cfg.series[0].key;
      const end = state.data[ref][endIdxFor(ref, win.x1)];
      if (pct) {
        const anchor = anchorFor(ref, win.x0) || state.data[ref][0];
        rows.push('<span class="jm-asof">' + fmtDate(anchor.date) + ' → ' + fmtDate(end.date) + '</span>');
      } else {
        rows.push('<span class="jm-asof">as of ' + fmtDate(end.date) + '</span>');
      }
      el.innerHTML = rows.join('<br>');
    }

    function wireControls() {
      document.querySelectorAll(cfg.toolbar + '.jm-check input').forEach(input => {
        input.addEventListener('change', () => {
          const label = input.closest('.jm-check');
          if (label.dataset.flag === 'events') {
            state.showEvents = input.checked;
            buildChart();
            return;
          }
          if (label.dataset.flag === 'rate') {
            state.showOverlay = input.checked;
            buildChart();
            return;
          }
          const key = label.dataset.series;
          const turningOff = state.visible[key];
          const anyOtherOn = cfg.series.some(s => s.key !== key && state.visible[s.key]);
          if (turningOff && !anyOtherOn) {
            input.checked = true;
            return;
          }
          state.visible[key] = input.checked;
          const idx = cfg.series.findIndex(s => s.key === key);
          Plotly.restyle(cfg.id, { visible: state.visible[key] ? true : 'legendonly' }, [idx])
            .then(rescaleY);
          updateStat();
        });
      });

      document.querySelectorAll(cfg.toolbar + '.jm-range').forEach(btn => {
        btn.addEventListener('click', () => {
          const m = btn.dataset.months;
          applyRange(m === 'all' ? null : parseInt(m, 10), btn);
        });
      });

      if (cfg.hasModes) {
        document.querySelectorAll(cfg.toolbar + '.jm-mode').forEach(btn => {
          btn.addEventListener('click', () => {
            if (btn.classList.contains('is-active')) return;
            state.mode = btn.dataset.mode;
            setActiveTab(document.querySelector(cfg.toolbar + '.jm-modes'), btn);
            recomputeDisp();
            buildChart();
            rescaleY();
          });
        });
      }
    }

    function reseatTabBars() {
      document.querySelectorAll(cfg.toolbar + '.jm-tabs').forEach(strip => {
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

    function init(json, overlayJson) {
      cfg.series.forEach(s => {
        state.data[s.key] = json.dates.map((d, i) => ({ date: d, value: json.series[s.json][i] }))
          .filter(d => d.date && typeof d.value === 'number');
        const input = seriesInput(s.key);
        state.visible[s.key] = input ? input.checked : true;
      });
      if (cfg.overlay && overlayJson) {
        // Clip to the base series' span so the overlay's longer history can't
        // stretch the rangeslider beyond the chart's own data.
        const b = dataBounds();
        state.overlayData = overlayJson.dates
          .map((d, i) => ({ date: d, value: overlayJson.series[cfg.overlay.json][i] }))
          .filter(d => d.date && typeof d.value === 'number' && d.date >= b.first && d.date <= b.last);
        const ovInput = document.querySelector(cfg.toolbar + '.jm-check[data-flag="rate"] input');
        state.showOverlay = ovInput ? ovInput.checked : false;
      }
      const evInput = document.querySelector(cfg.toolbar + '.jm-check[data-flag="events"] input');
      state.showEvents = evInput ? evInput.checked : false;
      recomputeDisp();
      buildChart();
      wireControls();
      if (cfg.initialMonths) {
        const btn = document.querySelector(cfg.toolbar + '.jm-range[data-months="' + cfg.initialMonths + '"]');
        applyRange(cfg.initialMonths, btn);
      }
      reseatTabBars();
    }

    return { cfg, buildChart, init, hasData: () => !!state.data[cfg.series[0].key] };
  }

  // ---- the two charts --------------------------------------------------------
  // Cohort colors: the story series wears the accent; every other cohort is
  // the accent hue-rotated around the wheel (rotSafe), so lines stay in-family
  // with the active skin but read as distinct colors. Age is ordinal, so the
  // SWE chart sweeps young→old from the accent (0°) to its complement (180°),
  // and the benchmark cohorts (all workers / 50+) sit at the complement. The
  // checkbox chips mirror these exact rotations via CSS relative colors in
  // cohorts-chart.css (the old gray blends stay there as fallbacks and as the
  // rotSafe fallbacks here).
  const charts = [
    makeCohortChart({
      id: 'cohort-unemp-chart',
      statId: 'cu-stat',
      toolbar: '.jm-toolbar[data-chart="cu"] ',
      dataUrl: 'posts/assets/cohort-unemployment-data.json',
      series: [
        { key: 'grads', json: 'grads', name: 'Recent graduates', color: T => T.accent },
        { key: 'workers', json: 'all', name: 'All workers', color: T => rotSafe(T.accent, 180, T.label) },
        { key: 'young', json: 'young', name: 'Young workers (22-27)', color: T => rotSafe(T.accent, 90, blendSafe(T.accent, T.label, 0.5)), dash: 'dash' },
        { key: 'college', json: 'college', name: 'College graduates', color: T => rotSafe(T.accent, 270, blendSafe(T.label, T.text, 0.35)), dash: 'dot' },
      ],
      hasModes: false,
      yTitle: () => 'Unemployment rate',
      ticksuffix: () => '%',
      baseline: () => null,
      hover: () => '<b>%{y:.1f}%</b>  %{fullData.name}<extra></extra>',
      fmtVal: v => v.toFixed(1) + '%',
      uirev: 'cohort-unemp',
      initialMonths: 120,
      overlay: { dataUrl: 'posts/assets/rate-data.json', json: 'dfii10', name: '10-year real rate' },
    }),
    makeCohortChart({
      id: 'cohort-swe-chart',
      statId: 'cs-stat',
      toolbar: '.jm-toolbar[data-chart="cs"] ',
      dataUrl: 'posts/assets/cohort-swe-age-data.json',
      series: [
        { key: 'g2225', json: 'g2225', name: '22-25', color: T => T.accent },
        { key: 'g2630', json: 'g2630', name: '26-30', color: T => rotSafe(T.accent, 36, blendSafe(T.accent, T.label, 0.2)) },
        { key: 'g3134', json: 'g3134', name: '31-34', color: T => rotSafe(T.accent, 72, blendSafe(T.accent, T.label, 0.4)) },
        { key: 'g3540', json: 'g3540', name: '35-40', color: T => rotSafe(T.accent, 108, blendSafe(T.accent, T.label, 0.6)) },
        { key: 'g4149', json: 'g4149', name: '41-49', color: T => rotSafe(T.accent, 144, blendSafe(T.accent, T.label, 0.8)) },
        { key: 'g50', json: 'g50', name: '50+', color: T => rotSafe(T.accent, 180, T.label) },
      ],
      hasModes: true,
      yTitle: m => m === 'pct' ? '% change since window start' : 'Employment index (Nov 2022 = 100)',
      ticksuffix: m => m === 'pct' ? '%' : '',
      baseline: m => m === 'pct' ? 0 : 100,
      hover: m => m === 'pct'
        ? '<b>%{text}</b>  %{fullData.name}<extra></extra>'
        : '<b>%{y:.1f}</b>  %{fullData.name}<extra></extra>',
      fmtVal: v => v.toFixed(1),
      uirev: 'cohort-swe',
      initialMonths: null,
      overlay: { dataUrl: 'posts/assets/rate-data.json', json: 'dfii10', name: '10-year real rate' },
    }),
    // The standalone rate strip, replaced by the dual-axis overlay above (its
    // HTML block in ai-job-market.md is commented out too). Kept for easy
    // restore if the overlay experiment doesn't stick.
    // makeCohortChart({
    //   id: 'rate-chart',
    //   statId: 'rate-stat',
    //   toolbar: '.jm-toolbar[data-chart="rate"] ',
    //   dataUrl: 'posts/assets/rate-data.json',
    //   series: [
    //     { key: 'dfii10', json: 'dfii10', name: '10-year real rate', color: T => T.accent },
    //   ],
    //   hasModes: false,
    //   yTitle: () => 'Real interest rate (10y TIPS)',
    //   ticksuffix: () => '%',
    //   baseline: () => 0,
    //   bands: [{ x0: '2022-03-17', x1: '2023-07-26', label: 'Fed hiking cycle' }],
    //   hover: () => '<b>%{y:.2f}%</b>  %{fullData.name}<extra></extra>',
    //   fmtVal: v => v.toFixed(2) + '%',
    //   uirev: 'rate',
    //   initialMonths: 60,
    // }),
  ];

  // Redraw on theme changes, debounced like the postings chart.
  let redrawTimer = null;
  window.addEventListener('dawson:palette', () => {
    clearTimeout(redrawTimer);
    redrawTimer = setTimeout(() => {
      charts.forEach(c => { if (c.hasData()) c.buildChart(); });
    }, 150);
  });

  charts.forEach(c => {
    const main = fetch(c.cfg.dataUrl)
      .then(res => { if (!res.ok) throw new Error('HTTP ' + res.status); return res.json(); });
    // The overlay is garnish: if its fetch fails, the chart renders without it.
    const ov = c.cfg.overlay
      ? fetch(c.cfg.overlay.dataUrl)
          .then(res => { if (!res.ok) throw new Error('HTTP ' + res.status); return res.json(); })
          .catch(err => { console.warn('overlay data failed:', c.cfg.id, err); return null; })
      : Promise.resolve(null);
    Promise.all([main, ov])
      .then(([json, ovJson]) => c.init(json, ovJson))
      .catch(err => console.warn('cohort chart data failed:', c.cfg.id, err));
  });
})();
