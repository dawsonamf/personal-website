(function () {
  'use strict';

  // Chart chrome follows the live palette (style versions + the palette toy):
  // each render re-reads the CSS variables, which resolve to the original
  // hardcoded colors at the default palette. The red/blue series colors are
  // identity (Swift orange, steering blue) and stay fixed.
  function cssVar(name, fallback) {
    var v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    return v || fallback;
  }
  function rgbaFromHex(hex, alpha, fallback) {
    var m = /^#([0-9a-f]{6})$/i.exec(hex.trim());
    if (!m) return fallback;
    var n = parseInt(m[1], 16);
    return 'rgba(' + (n >> 16) + ',' + ((n >> 8) & 255) + ',' + (n & 255) + ',' + alpha + ')';
  }
  function currentColors() {
    var C = {
      accent: cssVar('--accent', '#61ffda'),
      red: '#F05138',
      blue: '#64B5F6',
      white: cssVar('--text', '#e6f1ff'),
      gray: cssVar('--neutral-gray', '#a2a2a3'),
      bg: cssVar('--bg', '#1d1d1d'),
      cardBg: cssVar('--secondary', '#2c2c2c'),
    };
    C.grid10 = rgbaFromHex(C.gray, 0.1, 'rgba(162,162,163,0.1)');
    C.grid15 = rgbaFromHex(C.gray, 0.15, 'rgba(162,162,163,0.15)');
    C.grid30 = rgbaFromHex(C.gray, 0.3, 'rgba(162,162,163,0.3)');
    C.legendBg = rgbaFromHex(C.cardBg, 0.85, 'rgba(44,44,44,0.85)');
    return C;
  }
  function plotlyLayoutBase(COLORS) {
    return {
      paper_bgcolor: 'rgba(0,0,0,0)',
      plot_bgcolor: COLORS.cardBg,
      font: { family: 'SF Mono, monospace', color: COLORS.white, size: 12 },
      margin: { t: 30, r: 30, b: 50, l: 60 },
      hoverlabel: {
        bgcolor: COLORS.cardBg,
        bordercolor: COLORS.gray,
        font: { color: COLORS.white, size: 12 },
      },
    };
  }

  var PLOTLY_CONFIG = {
    displayModeBar: false,
    responsive: true,
  };

  // ── Pareto Frontier Chart ──

  function renderParetoChart() {
    var el = document.getElementById('pareto-chart');
    if (!el) return;
    var COLORS = currentColors();
    var PLOTLY_LAYOUT_BASE = plotlyLayoutBase(COLORS);

    var paretoRefusals = [3, 4, 5, 6, 7, 8, 9, 10, 12, 15, 20, 30];
    var paretoKL = [0.4059, 0.32, 0.24, 0.21, 0.17, 0.14, 0.1077, 0.09, 0.07, 0.05, 0.035, 0.02];

    var frontierTrace = {
      x: paretoRefusals,
      y: paretoKL,
      mode: 'lines',
      line: { color: COLORS.gray, width: 1.5, dash: 'dot' },
      name: 'Pareto frontier',
      hoverinfo: 'skip',
    };

    var trialRefusals = [3, 5, 7, 9, 12, 15, 4, 6, 8, 10, 20, 25, 30, 14, 18, 22, 11, 35, 40, 50];
    var trialKL = [0.4059, 0.24, 0.17, 0.1077, 0.07, 0.05, 0.45, 0.35, 0.25, 0.20, 0.15, 0.12, 0.10, 0.08, 0.06, 0.04, 0.22, 0.08, 0.06, 0.03];

    var trialsTrace = {
      x: trialRefusals,
      y: trialKL,
      mode: 'markers',
      marker: { color: COLORS.gray, size: 5, opacity: 0.35 },
      name: 'Other trials',
      hovertemplate: 'Refusals: %{x}/100<br>KL: %{y:.4f}<extra></extra>',
    };

    var publishedTrace = {
      x: [3, 9],
      y: [0.4059, 0.1077],
      mode: 'markers+text',
      marker: { color: [COLORS.red, COLORS.accent], size: 14, symbol: 'diamond', line: { color: COLORS.white, width: 1.5 } },
      text: ['R3-KL4059', 'R9-KL1077'],
      textposition: ['top right', 'top right'],
      textfont: { color: COLORS.white, size: 11 },
      name: 'Published models',
      hovertemplate: '<b>%{text}</b><br>Refusals: %{x}/100<br>KL: %{y:.4f}<extra></extra>',
    };

    var vanillaTrace = {
      x: [100],
      y: [0],
      mode: 'markers+text',
      marker: { color: COLORS.blue, size: 12, symbol: 'circle', line: { color: COLORS.white, width: 1.5 } },
      text: ['Vanilla'],
      textposition: 'top left',
      textfont: { color: COLORS.blue, size: 11 },
      name: 'Vanilla Gemma 4',
      hovertemplate: '<b>Vanilla Gemma 4 26B A4B</b><br>Refusals: 100/100<br>KL: 0<extra></extra>',
    };

    var layout = Object.assign({}, PLOTLY_LAYOUT_BASE, {
      xaxis: {
        title: { text: 'Refusals (out of 100)', standoff: 10 },
        color: COLORS.gray,
        gridcolor: COLORS.grid15,
        range: [-2, 105],
        dtick: 20,
        zeroline: false,
      },
      yaxis: {
        title: { text: 'KL Divergence', standoff: 10 },
        color: COLORS.gray,
        gridcolor: COLORS.grid15,
        range: [-0.02, 0.52],
        zeroline: false,
      },
      showlegend: true,
      legend: {
        x: 1, y: 1, xanchor: 'right', yanchor: 'top',
        bgcolor: COLORS.legendBg,
        bordercolor: COLORS.gray,
        borderwidth: 1,
        font: { size: 11 },
      },
      annotations: [{
        x: 50, y: 0.35,
        text: 'Better →',
        showarrow: true,
        arrowhead: 2,
        ax: 40, ay: 30,
        arrowcolor: COLORS.gray,
        font: { color: COLORS.gray, size: 11 },
      }],
    });

    Plotly.newPlot(el, [trialsTrace, frontierTrace, publishedTrace, vanillaTrace], layout, PLOTLY_CONFIG);
  }


  // ── ARA Objectives Visualization ──

  function renderARAObjectivesChart() {
    var el = document.getElementById('ara-objectives-chart');
    if (!el) return;
    var COLORS = currentColors();
    var PLOTLY_LAYOUT_BASE = plotlyLayoutBase(COLORS);

    var harmlessX = [], harmlessY = [];
    for (var i = 0; i < 40; i++) {
      harmlessX.push(2.0 + (Math.random() - 0.5) * 1.2);
      harmlessY.push(3.0 + (Math.random() - 0.5) * 1.2);
    }

    var harmfulOrigX = [], harmfulOrigY = [];
    for (var j = 0; j < 30; j++) {
      harmfulOrigX.push(6.0 + (Math.random() - 0.5) * 1.0);
      harmfulOrigY.push(1.5 + (Math.random() - 0.5) * 1.0);
    }

    var harmfulSteeredX = [], harmfulSteeredY = [];
    for (var k = 0; k < 30; k++) {
      harmfulSteeredX.push(1.2 + (Math.random() - 0.5) * 1.4);
      harmfulSteeredY.push(3.2 + (Math.random() - 0.5) * 1.4);
    }

    var harmlessTrace = {
      x: harmlessX, y: harmlessY,
      mode: 'markers',
      marker: { color: COLORS.accent, size: 8, opacity: 0.7 },
      name: 'Harmless outputs',
      hoverinfo: 'skip',
    };

    var harmfulOrigTrace = {
      x: harmfulOrigX, y: harmfulOrigY,
      mode: 'markers',
      marker: { color: COLORS.red, size: 8, opacity: 0.5, symbol: 'x' },
      name: 'Harmful (original)',
      hoverinfo: 'skip',
    };

    var harmfulSteeredTrace = {
      x: harmfulSteeredX, y: harmfulSteeredY,
      mode: 'markers',
      marker: { color: COLORS.blue, size: 8, opacity: 0.7, symbol: 'diamond' },
      name: 'Harmful (after ARA)',
      hoverinfo: 'skip',
    };

    var arrowTraces = [];
    var arrowCount = Math.min(8, harmfulOrigX.length);
    for (var a = 0; a < arrowCount; a++) {
      arrowTraces.push({
        x: [harmfulOrigX[a], harmfulSteeredX[a]],
        y: [harmfulOrigY[a], harmfulSteeredY[a]],
        mode: 'lines',
        line: { color: COLORS.grid30, width: 1, dash: 'dot' },
        showlegend: false,
        hoverinfo: 'skip',
      });
    }

    var layout = Object.assign({}, PLOTLY_LAYOUT_BASE, {
      xaxis: {
        title: { text: 'Activation Dimension 1', standoff: 10 },
        color: COLORS.gray,
        gridcolor: COLORS.grid10,
        showticklabels: false,
        zeroline: false,
      },
      yaxis: {
        title: { text: 'Activation Dimension 2', standoff: 10 },
        color: COLORS.gray,
        gridcolor: COLORS.grid10,
        showticklabels: false,
        zeroline: false,
      },
      showlegend: true,
      legend: {
        x: 1, y: 1, xanchor: 'right', yanchor: 'top',
        bgcolor: COLORS.legendBg,
        bordercolor: COLORS.gray,
        borderwidth: 1,
        font: { size: 11 },
      },
      annotations: [
        {
          x: 2.0, y: 3.0,
          text: '① Keep stable',
          showarrow: true, arrowhead: 0,
          ax: -60, ay: -40,
          arrowcolor: COLORS.accent,
          font: { color: COLORS.accent, size: 11 },
        },
        {
          x: 4.0, y: 2.3,
          text: '② Steer toward harmless',
          showarrow: true, arrowhead: 2,
          ax: 50, ay: 20,
          arrowcolor: COLORS.blue,
          font: { color: COLORS.blue, size: 11 },
        },
        {
          x: 1.2, y: 3.2,
          text: '③ Overcorrect past',
          showarrow: true, arrowhead: 0,
          ax: -50, ay: 30,
          arrowcolor: COLORS.blue,
          font: { color: COLORS.blue, size: 11 },
        },
      ],
    });

    var traces = [harmlessTrace, harmfulOrigTrace, harmfulSteeredTrace].concat(arrowTraces);
    Plotly.newPlot(el, traces, layout, PLOTLY_CONFIG);
  }


  // ── KL Divergence Explainer ──

  function renderKLExplainerChart() {
    var el = document.getElementById('kl-explainer-chart');
    if (!el) return;
    var COLORS = currentColors();
    var PLOTLY_LAYOUT_BASE = plotlyLayoutBase(COLORS);

    var tokens = ['The', 'cat', 'sat', 'on', 'a', 'mat', 'rug', 'chair', 'floor', 'bed'];
    var originalProbs = [0.02, 0.15, 0.05, 0.08, 0.03, 0.25, 0.18, 0.10, 0.09, 0.05];
    var r9Probs =       [0.02, 0.14, 0.05, 0.08, 0.03, 0.24, 0.19, 0.11, 0.09, 0.05];
    var r3Probs =       [0.03, 0.11, 0.06, 0.07, 0.04, 0.20, 0.22, 0.12, 0.08, 0.07];

    var originalTrace = {
      x: tokens, y: originalProbs,
      type: 'bar',
      name: 'Vanilla',
      marker: { color: COLORS.blue, opacity: 0.8 },
      hovertemplate: '%{x}: %{y:.2%}<extra>Vanilla</extra>',
    };

    var r9Trace = {
      x: tokens, y: r9Probs,
      type: 'bar',
      name: 'R9-KL1077',
      marker: { color: COLORS.accent, opacity: 0.8 },
      hovertemplate: '%{x}: %{y:.2%}<extra>R9-KL1077</extra>',
    };

    var r3Trace = {
      x: tokens, y: r3Probs,
      type: 'bar',
      name: 'R3-KL4059',
      marker: { color: COLORS.red, opacity: 0.8 },
      hovertemplate: '%{x}: %{y:.2%}<extra>R3-KL4059</extra>',
    };

    var layout = Object.assign({}, PLOTLY_LAYOUT_BASE, {
      barmode: 'group',
      xaxis: {
        title: { text: 'Next Token', standoff: 10 },
        color: COLORS.gray,
        gridcolor: COLORS.grid10,
      },
      yaxis: {
        title: { text: 'Probability', standoff: 10 },
        color: COLORS.gray,
        gridcolor: COLORS.grid15,
        tickformat: '.0%',
        range: [0, 0.30],
        zeroline: false,
      },
      showlegend: true,
      legend: {
        x: 1, y: 1, xanchor: 'right', yanchor: 'top',
        bgcolor: COLORS.legendBg,
        bordercolor: COLORS.gray,
        borderwidth: 1,
        font: { size: 11 },
        orientation: 'h',
      },
    });

    Plotly.newPlot(el, [originalTrace, r9Trace, r3Trace], layout, PLOTLY_CONFIG);
  }


  // ── Init ──

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  function init() {
    renderParetoChart();
    renderARAObjectivesChart();
    renderKLExplainerChart();
  }

  // Redraw when the theme cycler changes the palette. Debounced: the
  // color-picker fires once per drag tick.
  var redrawTimer = null;
  window.addEventListener('dawson:palette', function () {
    clearTimeout(redrawTimer);
    redrawTimer = setTimeout(init, 150);
  });
})();
