/**
 * Theme picker runtime, S1-11.
 *
 * OWNERSHIP
 *   The one shared picker runtime, loaded by every picker-enabled page (canonical pages,
 *   utility pages that mount a FAB, and structural themes' own layouts).
 *   It is a classic script on purpose: no modules, no imports, and it defines no global.
 *
 * INPUTS (all read from DOM this file does not create; there is no runtime theme registry)
 *   <html data-style>            the active theme id; absent means 'default'. boot() reads it.
 *   #tc-dock                     the dock, rendered by ThemeDock.astro. Its data-* attributes
 *                                carry the prose this file writes at runtime: data-styles,
 *                                data-advanced, data-back-to-styles, data-advanced-sub,
 *                                data-done-editing, data-current, data-preview, data-lock,
 *                                data-unlock.
 *   #tc-scrim                    the page veil, a sibling of the dock.
 *   #tc-presets li               one row per theme in picker order. Each carries its theme's
 *                                palette as --tc-row-text/-bg/-primary/-secondary/-accent and,
 *                                when the theme has one, --tc-row-heading. Every read of those
 *                                is trimmed: custom properties round-trip with their authored
 *                                whitespace, and the divergence test below is a raw string
 *                                compare, so an untrimmed read would report "diverged" on a
 *                                fresh page and swap the theme's neutrals for blends.
 *   li[data-profile]             on every row: {"polarity":"dark"|"light"[,"random":…]}; the
 *                                runtime reads the active row's. Absent or unparseable means
 *                                polarity 'dark' and the DEFAULT_RANDOM below.
 *   #tc-presets a[data-id][href] the row link. href is the themed URL of the CURRENT page, so
 *                                switching a theme keeps the page (D11); its text is the label.
 *   a[data-fonts]                JSON array of that skin's font URLs, for loadAllFonts().
 *   #tc-schemes button[data-s]   the scheme strip; #tc-roles .tc-role the five colour tiles,
 *                                whose .tc-role-name text is the role name in the lock label.
 *   .tc-nav-item                 every trigger mount: a nav pill item or a .tc-fab.
 *   .tc-fab[data-corner]         'br', 'bl', 'tr' or 'tl': the corner the FAB sits in, and the
 *                                one the dock opens away from.
 *   the anchoring pill           position() measures the mount's closest .moving-menu,
 *                                .static-menu, .static-menu-mobile or .tc-fab, else the
 *                                .tc-nav-trigger inside it, else the mount itself.
 *   ids this file drives         #tc-randomize, #tc-reset, #tc-advanced-link,
 *                                #tc-advanced-label, #tc-advanced-sub, #tc-advanced,
 *                                #tc-styles-head, #tc-preview, #tc-preview-name,
 *                                #tc-preview-meta.
 *
 * DEPENDENCIES
 *   Runtime: no library or global. The marked ramp adapter is generated at build time from
 *   src/themes/ramp.ts by scripts/build-picker.mjs. The page must load
 *   /css/theme-cycler.css (dock geometry, scrim, FAB) and a Font Awesome stylesheet
 *   (the lock icons and the FAB glyph).
 *
 * INITIALIZATION
 *   Loaded with `defer` at the tail of <body>; boots on DOMContentLoaded, or immediately when
 *   the document is already parsed. With no #tc-dock it returns without binding anything, so
 *   a picker-free page can load it harmlessly.
 *   One page applies a theme after parse, the 404 (D27). Its script must run BEFORE this one
 *   and must do the work synchronously at its own execution, not from a DOMContentLoaded
 *   callback, which fires after every deferred script has already run. It sets the <html>
 *   attributes, style and links from themeHtml(), and moves the visual marker in #tc-presets:
 *   the `tc-row-sel` class onto that theme's <li>, `tc-sel` + aria-current="true" onto its <a>,
 *   `tc-sel` + aria-pressed="true" onto its card <button>, removing all three from the default
 *   row. The marker is presentation only. This runtime locates the active row by data-id, never
 *   by the marker, and every row already carries its own data-profile, so the 404 synthesizes
 *   no theme data.
 *
 * STORAGE + EVENT CONTRACTS
 *   sessionStorage['dawson-theme-cycler'] =
 *     {style, colors:[5 '#rrggbb'], locks:[5 bool], scheme, theme}, where `style` is the theme
 *   the palette was drawn under and `theme` is that theme's polarity.
 *   It survives navigation AND reload; only switching themes clears it, because a new theme
 *   has a new base palette. A record whose `style` is not this page's is ignored rather than
 *   removed: with the theme in the URL an ordinary navigation can land on another theme, and
 *   boot() then persists this theme's palette over the stale record.
 *   The pre-paint script in <head> owns the other half of that contract and must mirror the
 *   same rule: restore only when
 *   saved.style === (document.documentElement.getAttribute('data-style') || 'default') and the
 *   five `colors` are '#rrggbb' strings; nothing else in the record matters before paint. It
 *   rewrites the five base roles and the 95-step alpha ramp from those colours before first
 *   paint. This file restores everything else (locks, scheme, polarity, the derived neutrals,
 *   the controls) once the document is parsed.
 *   window 'dawson:palette', dispatched from applyColors(), no detail. Page widgets that
 *   paint with the palette (the Plotly dashboards in blog posts) re-read the CSS variables on
 *   this signal and redraw.
 */
(function () {
  'use strict';

  function hexToRgb(hex) {
    const m = hex.replace('#','');
    return { r: parseInt(m.substring(0,2),16), g: parseInt(m.substring(2,4),16), b: parseInt(m.substring(4,6),16) };
  }
  function rgbToHex(r,g,b) {
    const h = x => Math.round(Math.max(0,Math.min(255,x))).toString(16).padStart(2,'0');
    return '#' + h(r) + h(g) + h(b);
  }
  function hexToHsl(hex) {
    const {r,g,b} = hexToRgb(hex);
    const R=r/255,G=g/255,B=b/255;
    const max=Math.max(R,G,B), min=Math.min(R,G,B);
    let h=0,s=0,l=(max+min)/2;
    if (max!==min) {
      const d=max-min;
      s = l>0.5 ? d/(2-max-min) : d/(max+min);
      switch(max) {
        case R: h=(G-B)/d+(G<B?6:0); break;
        case G: h=(B-R)/d+2; break;
        case B: h=(R-G)/d+4; break;
      }
      h*=60;
    }
    return { h, s: s*100, l: l*100 };
  }

  // <generated:rampDeclarations source="src/themes/ramp.ts">
  function rampDeclarations(colors        )         {
    const STEPS = [5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85, 90, 95];
    const ROLES = ['text', 'bg', 'primary', 'secondary', 'accent']         ;

    function hexToHsl(hex        )                                      {
      const m = hex.replace('#', '');
      const r = parseInt(m.substring(0, 2), 16) / 255;
      const g = parseInt(m.substring(2, 4), 16) / 255;
      const b = parseInt(m.substring(4, 6), 16) / 255;
      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      let h = 0;
      let s = 0;
      const l = (max + min) / 2;
      if (max !== min) {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
          case r:
            h = (g - b) / d + (g < b ? 6 : 0);
            break;
          case g:
            h = (b - r) / d + 2;
            break;
          case b:
            h = (r - g) / d + 4;
            break;
        }
        h *= 60;
      }
      return { h: h, s: s * 100, l: l * 100 };
    }

    let out = '';
    for (const role of ROLES) {
      const hex = colors[role];
      out += '--' + role + ':' + hex + ';';
      const hsl = hexToHsl(hex);
      for (const a of STEPS) {
        out +=
          '--' + role + a + ':hsla(' +
          hsl.h.toFixed(0) + ',' + hsl.s.toFixed(0) + '%,' + hsl.l.toFixed(0) + '%,' + a + '%);';
      }
    }
    return out;
  }
  // </generated:rampDeclarations>

  function hslFracToRgb(h,s,l) {
    h = ((h % 1) + 1) % 1;
    if (s===0) { const v = Math.round(l*255); return [v,v,v]; }
    const q = l<0.5 ? l*(1+s) : l+s-l*s;
    const p = 2*l-q;
    const hue2rgb = (p,q,t) => {
      if (t<0) t+=1; if (t>1) t-=1;
      if (t<1/6) return p+(q-p)*6*t;
      if (t<1/2) return q;
      if (t<2/3) return p+(q-p)*(2/3-t)*6;
      return p;
    };
    return [
      Math.round(hue2rgb(p,q,h+1/3)*255),
      Math.round(hue2rgb(p,q,h)*255),
      Math.round(hue2rgb(p,q,h-1/3)*255),
    ];
  }
  const uniform = (a,b) => Math.random()*(b-a)+a;
  const lerp    = (a,b,t) => a+(b-a)*t;

  const SCHEMES = ['monochromatic','analogous','complementary','triadic','tetradic'];
  const SCHEME_MULT = {
    'monochromatic': 0,
    'analogous': 0.25,
    'complementary': 0.33,
    'triadic': 0.66,
    'tetradic': 0.75,
  };

  // Random-palette profiles. Roles are [text, bg, primary, secondary, accent].
  // Each role has a lightness band, hueT (its share of the scheme's hue
  // spread), and optionally its own saturation range; without one, all roles
  // share a single saturation draw, which keeps a palette cohesive. These
  // numbers match the original generator, so themes without a `random`
  // profile (including the default) keep the old distribution exactly. A theme
  // that has one ships it on the active row's data-profile.
  const DEFAULT_RANDOM = {
    dark: {
      sat: [0.10, 1.00],
      roles: [
        { l: [0.90, 0.95], hueT: 0 },     // text
        { l: [0.02, 0.08], hueT: 0 },     // bg
        { l: [0.70, 0.75], hueT: 0 },     // primary
        { l: [0.30, 0.35], hueT: 0.75 },  // secondary
        { l: [0.50, 0.60], hueT: 1.00 },  // accent
      ],
    },
    light: {
      sat: [0.10, 1.00],
      roles: [
        { l: [0.02, 0.08], hueT: 0 },
        { l: [0.96, 0.99], hueT: 0 },
        { l: [0.50, 0.55], hueT: 0 },
        { l: [0.70, 0.75], hueT: 0.75 },
        { l: [0.60, 0.65], hueT: 1.00 },
      ],
    },
  };

  function generatePalette(scheme, baseHueDeg, isDark) {
    const mode = isDark ? 'dark' : 'light';
    const prof = (state.random && state.random[mode]) || DEFAULT_RANDOM[mode];

    const baseHueFrac = baseHueDeg / 360;
    const hueContrast = lerp(0.33, 1.00, Math.random());
    const satShared   = uniform(prof.sat[0], prof.sat[1]);
    const mult        = SCHEME_MULT[scheme] ?? 0;

    const out = [];
    for (let i=0; i<5; i++) {
      const role = prof.roles[i];
      let hueOff = role.hueT * hueContrast * mult;
      if (scheme !== 'monochromatic') hueOff += (Math.random()*2-1)*0.01;
      const sat = role.sat ? uniform(role.sat[0], role.sat[1]) : satShared;
      const [r,g,b] = hslFracToRgb(baseHueFrac + hueOff, sat, uniform(role.l[0], role.l[1]));
      out.push(rgbToHex(r,g,b));
    }
    return out;
  }

  // Session persistence: survives navigation and reload alike. Only a theme switch
  // clears it. Must agree with the pre-paint override in <head>.
  //
  // The record is scoped to the theme it was drawn under, which is why `style` is in it: with
  // the theme in the URL, an ordinary navigation (Back after a switch, a typed themed URL, the
  // 404's default-theme links) can land on another theme, and a saved palette belongs only to
  // the theme it was drawn under. A record for a different theme, or one missing `style`, is
  // ignored rather than removed; boot() re-persists this theme's palette over it.
  const STORAGE_KEY = 'dawson-theme-cycler';
  function persist() {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify({
        style:  state.style,
        colors: state.colors,
        locks:  state.locks,
        scheme: state.scheme,
        theme:  state.theme,
      }));
    } catch {}
  }
  function restore() {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      if (!raw) return false;
      const saved = JSON.parse(raw);
      const usable = saved.style === state.style
        && Array.isArray(saved.colors) && saved.colors.length === 5
        && saved.colors.every(c => /^#[0-9a-f]{6}$/i.test(c));
      if (!usable) return false;
      state.colors = saved.colors;
      state.locks  = Array.isArray(saved.locks) && saved.locks.length === 5 ? saved.locks : state.locks;
      state.scheme = typeof saved.scheme === 'string' ? saved.scheme : state.scheme;
      state.theme  = saved.theme === 'light' ? 'light' : 'dark';
      return true;
    } catch { return false; }
  }

  const ROLES = ['text','bg','primary','secondary','accent'];
  const ROW_VARS = ROLES.map(k => '--tc-row-' + k);
  const DEFAULT_THEME = 'dark';
  const root = document.documentElement;

  // Filled by wireDom(); nothing above here touches the document.
  let dock = null, presets = null, roleHost = null, schemeHost = null;
  // The default row's colours, which is where a reset lands.
  let DEFAULT_COLORS = null;

  let state = {
    style:    'default',  // boot() reads the real one off <html data-style>
    colors:   null,       // wireDom() seeds these from the active row
    locks:    [false,false,false,false,false],
    scheme:   'random',
    theme:    DEFAULT_THEME,
    random:   null,
    advanced: false,
  };

  const rowLink = id => presets && presets.querySelector('a[data-id="' + id + '"]');
  const rowFor  = id => { const a = rowLink(id); return a ? a.parentElement : null; };

  /** The row's five base colours, or null if the row is missing one. Always trimmed. */
  function rowColors(li) {
    if (!li) return null;
    const out = ROW_VARS.map(v => li.style.getPropertyValue(v).trim());
    return out.every(Boolean) ? out : null;
  }

  function applyColors() {
    const ramp = rampDeclarations({
      text: state.colors[0],
      bg: state.colors[1],
      primary: state.colors[2],
      secondary: state.colors[3],
      accent: state.colors[4],
    }).split(';');
    ramp.forEach(declaration => {
      const colon = declaration.indexOf(':');
      if (colon > 0) root.style.setProperty(declaration.slice(0, colon), declaration.slice(colon + 1));
    });
    applyDerivedNeutrals();
    persist();
    // Page widgets that paint with the palette (the Plotly dashboards in blog
    // posts) re-read the CSS variables on this signal and redraw.
    try { window.dispatchEvent(new CustomEvent('dawson:palette')); } catch {}
    // Always in place, never a rebuild: rebuilding would destroy the
    // <input type="color"> and close the native picker mid-drag.
    syncRoles();
    // The preview card shows the ACTIVE theme's live palette, so anything
    // that moves the palette (shuffle, a scheme redraw, dragging a color)
    // has to repaint it. Pointing at some other theme parks previewId
    // elsewhere, and that card must not move: it is showing that theme's
    // own base colors, which a shuffle never touches.
    if (previewId && previewId === state.style) paintPreview(previewId, previewMeta);
  }

  // The jobs-menu navy palette and --neutral-gray are static (styles.css or
  // theme tokens), so a randomized palette would leave them behind. Once
  // the toy diverges from the active theme's base colors, derive replacements
  // from the live roles; on return to base, restore what <html style> carried
  // before this function first wrote to it. --code-bg/--code-fg ride along so
  // code blocks keep a dark ground that matches the pinned hljs token colors.
  const DERIVED_NEUTRALS = ['--jobs-menu-navy-dark', '--jobs-menu-navy', '--jobs-menu-slate', '--neutral-gray', '--code-bg', '--code-fg'];
  // Snapshotted lazily on the first call, which is the last moment before the first
  // write. The build emitted the theme's tokens and the pre-paint override rewrote only
  // the ramp, so this holds the theme's own values: four of them plus two absences for a
  // theme with tokens, six absences for the default. '' means "was not set".
  let neutralBaseline = null;
  function blendHex(a, b, t) {
    const A = hexToRgb(a), B = hexToRgb(b);
    return rgbToHex(A.r + (B.r - A.r) * t, A.g + (B.g - A.g) * t, A.b + (B.b - A.b) * t);
  }
  function applyDerivedNeutrals() {
    if (!neutralBaseline) {
      neutralBaseline = {};
      DERIVED_NEUTRALS.forEach(k => { neutralBaseline[k] = root.style.getPropertyValue(k); });
    }
    const base = rowColors(rowFor(state.style)) || DEFAULT_COLORS;
    const diverged = state.colors.some((c, i) => String(c).toLowerCase() !== String(base[i]).toLowerCase());
    if (!diverged) {
      DERIVED_NEUTRALS.forEach(k => {
        const v = neutralBaseline[k];
        if (v) root.style.setProperty(k, v);
        else root.style.removeProperty(k);
      });
      return;
    }
    const [text, bg, , secondary] = state.colors;
    root.style.setProperty('--jobs-menu-navy-dark', secondary);
    root.style.setProperty('--jobs-menu-navy', blendHex(secondary, text, 0.18));
    root.style.setProperty('--jobs-menu-slate', blendHex(text, bg, 0.42));
    root.style.setProperty('--neutral-gray', blendHex(text, bg, 0.40));
    root.style.setProperty('--code-bg', '#0d1117');
    root.style.setProperty('--code-fg', '#c9d1d9');
  }

  // In-place update of the five colour tiles the build rendered: swatch, native input,
  // lock state and the composed "Lock <Role>" / "Unlock <Role>" label. The role names are
  // the rendered labels, so this file holds none of that prose.
  function syncRoles() {
    if (!roleHost) return;
    roleHost.querySelectorAll('.tc-role').forEach((el, i) => {
      const hex = state.colors[i];
      el.title = hex;
      const sw = el.querySelector('.tc-sw');
      // setAttribute, not style.background: it keeps the authored `background:<hex>` form
      // the build wrote, where the CSSOM would rewrite the whole attribute to rgb().
      if (sw) sw.setAttribute('style', 'background:' + hex);
      const inp = el.querySelector('input[type="color"]');
      if (inp) {
        // The live value first, then the content attribute, so the serialized dock stays the
        // dock the legacy renderer produced instead of keeping the built-in default forever.
        // Each only when it differs: assigning during a drag would fight the native picker,
        // and a dirty value ignores the attribute anyway.
        if (inp.value.toLowerCase() !== String(hex).toLowerCase()) inp.value = hex;
        if (inp.getAttribute('value') !== hex) inp.setAttribute('value', hex);
      }
      const lk = el.querySelector('.tc-lk');
      if (!lk) return;
      const locked = !!state.locks[i];
      const name = el.querySelector('.tc-role-name');
      lk.classList.toggle('tc-on', locked);
      lk.setAttribute('aria-label',
        (locked ? dock.dataset.unlock : dock.dataset.lock) + ' ' + (name ? name.textContent : ''));
      const icon = lk.querySelector('i');
      if (icon) icon.className = 'fa-solid fa-' + (locked ? 'lock' : 'lock-open');
    });
  }

  function randomize() {
    let baseHue = null;
    for (let i=0; i<5; i++) {
      if (state.locks[i]) { baseHue = hexToHsl(state.colors[i]).h; break; }
    }
    if (baseHue === null) baseHue = Math.random()*360;

    const scheme = state.scheme === 'random'
      ? SCHEMES[Math.floor(Math.random()*SCHEMES.length)]
      : state.scheme;

    const newColors = generatePalette(scheme, baseHue, state.theme === 'dark');
    state.colors = state.colors.map((c,i) => state.locks[i] ? c : newColors[i]);
    applyColors();
  }

  // ---- Theme versions (preset rows) ---------------------------------------

  // Activate a theme: follow the row's own link, which the build wrote as the themed URL
  // of the page you are on, so a switch keeps the page. A full navigation means tilt, the
  // cursor follower and the masthead type all boot natively in the new theme, with no live
  // patching of page features.
  function switchStyle(id) {
    const a = rowLink(id);
    if (!a || id === state.style) return;
    // Palette-toy overrides don't survive a theme switch.
    try { sessionStorage.removeItem(STORAGE_KEY); } catch {}
    window.location.href = a.href;
  }

  // Which theme the preview card is currently showing, so a palette change
  // can repaint it without guessing.
  let previewId = null;
  let previewMeta = 'current';

  // Repaints the preview card. The ACTIVE theme draws from the live palette,
  // so Shuffle colors is visible in the card as well as on the page. Every
  // other theme draws from its row, never from the live CSS vars, so a
  // shuffle can't bleed into a preview of a theme you're only pointing at.
  function paintPreview(id, meta) {
    const card = document.getElementById('tc-preview');
    const li = rowFor(id);
    if (!card || !li) return;
    previewId = id;
    previewMeta = meta;
    const [text, bg, primary, , accent] = id === state.style ? state.colors : (rowColors(li) || state.colors);
    const heading = li.style.getPropertyValue('--tc-row-heading').trim();
    card.style.setProperty('--tc-pv-bg', bg);
    card.style.setProperty('--tc-pv-text', text);
    card.style.setProperty('--tc-pv-primary', primary);
    card.style.setProperty('--tc-pv-accent', accent);
    if (heading) card.style.setProperty('--tc-pv-heading', heading);
    else card.style.removeProperty('--tc-pv-heading');
    const link  = rowLink(id);
    const name  = document.getElementById('tc-preview-name');
    const label = document.getElementById('tc-preview-meta');
    if (name && link) name.textContent = link.textContent;
    if (label) label.textContent = meta === 'preview' ? dock.dataset.preview : dock.dataset.current;
  }

  // Index every animated child so the CSS cascade delay produces the stagger.
  function stampStagger() {
    if (!dock) return;
    let i = 0;
    dock.querySelectorAll('.tc-stagger').forEach(el => {
      if (el.classList.contains('tc-row-card') && getComputedStyle(el).display === 'none') return;
      el.style.setProperty('--i', i++);
    });
  }

  // The wordmark cards render each theme's name in its own heading font, so
  // every theme's Google Font has to be loaded, not just the active one. The
  // rows carry them: a skin row with fonts has data-fonts, and nothing else does,
  // so an inactive structural theme's assets are never pulled in here.
  // Idempotent: skips fonts already in <head>. Deferred to idle so the cost
  // lands after first paint; visitors who never open the menu still pay it,
  // but the requests are non-blocking with display=swap.
  let fontsLoaded = false;
  function loadAllFonts() {
    if (fontsLoaded || !presets) return;
    fontsLoaded = true;
    const seen = new Set();
    presets.querySelectorAll('a[data-fonts]').forEach(a => {
      let list;
      try { list = JSON.parse(a.dataset.fonts); } catch { return; }
      if (!Array.isArray(list)) return;
      list.forEach(href => {
        if (seen.has(href)) return;
        seen.add(href);
        if (document.querySelector('link[href="' + href + '"]')) return;
        const l = document.createElement('link');
        l.rel = 'stylesheet';
        l.href = href;
        document.head.appendChild(l);
      });
    });
  }

  function resetToDefault() {
    switchStyle('default');
    state.colors = DEFAULT_COLORS.slice();
    state.locks  = [false,false,false,false,false];
    state.scheme = 'random';
    state.theme  = DEFAULT_THEME;
    try { sessionStorage.removeItem(STORAGE_KEY); } catch {}
    applyColors();
    syncSchemes();
  }

  // Advanced swaps what the left column shows, the themes list steps aside
  // for the scheme + color editor, instead of expanding the panel downward.
  // The action's own label flips to the way back out, so there is no hidden
  // second gesture to discover. Both label pairs come off the dock's prose.
  function setAdvanced(on) {
    state.advanced = !!on;
    const panel   = document.getElementById('tc-advanced');
    const head    = document.getElementById('tc-styles-head');
    const link    = document.getElementById('tc-advanced-link');
    const label   = document.getElementById('tc-advanced-label');
    const sub     = document.getElementById('tc-advanced-sub');
    if (panel)   panel.classList.toggle('tc-hidden', !state.advanced);
    if (presets) presets.classList.toggle('tc-hidden', state.advanced);
    if (head)    head.textContent = state.advanced ? dock.dataset.advanced : dock.dataset.styles;
    if (label)   label.textContent = state.advanced ? dock.dataset.backToStyles : dock.dataset.advanced;
    if (sub)     sub.textContent = state.advanced ? dock.dataset.doneEditing : dock.dataset.advancedSub;
    if (link) {
      link.classList.toggle('tc-open', state.advanced);
      link.setAttribute('aria-expanded', state.advanced ? 'true' : 'false');
    }
  }

  function toggleAdvanced() {
    setAdvanced(!state.advanced);
  }

  function syncSchemes() {
    if (!schemeHost) return;
    schemeHost.querySelectorAll('button').forEach(b => {
      const on = b.dataset.s === state.scheme;
      b.classList.toggle('tc-sel', on);
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
  }

  // Bind the dock the build rendered. Creates nothing: every element below is already
  // in the document, and this is the only place that reads the seed data off it.
  // Returns false, having bound nothing, when the dock carries no usable rows.
  function wireDom() {
    presets    = document.getElementById('tc-presets');
    roleHost   = document.getElementById('tc-roles');
    schemeHost = document.getElementById('tc-schemes');

    DEFAULT_COLORS = rowColors(rowFor('default'));
    const active = rowFor(state.style);
    const colors = rowColors(active) || (DEFAULT_COLORS && DEFAULT_COLORS.slice());
    // A dock without its rows is a build error that S1-13's invariants catch; nothing to drive.
    if (!colors) return false;
    state.colors = colors;
    if (active && active.dataset.profile) {
      try {
        const profile = JSON.parse(active.dataset.profile);
        if (profile && profile.polarity === 'light') state.theme = 'light';
        if (profile && profile.random) state.random = profile.random;
      } catch {}
    }

    if (presets) {
      presets.querySelectorAll('[data-id]').forEach(b => {
        // preventDefault so the anchor's own navigation doesn't race
        // switchStyle, which clears the palette override first.
        b.addEventListener('click', e => { e.preventDefault(); switchStyle(b.dataset.id); });
        // Pointing at a theme previews it in the card; leaving the list puts
        // the active theme back.
        b.addEventListener('mouseenter', () => paintPreview(b.dataset.id, 'preview'));
        b.addEventListener('focus',      () => paintPreview(b.dataset.id, 'preview'));
      });
      presets.addEventListener('mouseleave', () => paintPreview(state.style, 'current'));
    }

    if (roleHost) {
      roleHost.querySelectorAll('input[type="color"]').forEach(inp => {
        // Live-drag updates: applyColors only ever writes these tiles in place,
        // so the native picker stays open.
        inp.addEventListener('input', e => { state.colors[+e.target.dataset.i] = e.target.value; applyColors(); });
        inp.addEventListener('click', e => e.stopPropagation());
      });
      roleHost.querySelectorAll('.tc-lk').forEach(btn => {
        // No preventDefault/stopPropagation needed: the lock is outside every
        // label so nothing forwards its click, and the dock's own click
        // listener already keeps the panel open for anything inside it.
        btn.addEventListener('click', () => {
          const i = +btn.dataset.i;
          state.locks[i] = !state.locks[i];
          syncRoles();
        });
      });
    }

    if (schemeHost) {
      const buttons = schemeHost.querySelectorAll('button');
      buttons.forEach(b => {
        b.addEventListener('click', () => {
          state.scheme = b.dataset.s;
          // Move the selection in place rather than re-rendering. A rebuild
          // detaches the button mid-click, and the outside-click handler that
          // closes the panel tests dock.contains(e.target) on the way up, and a
          // detached node is in nothing, so the panel used to dismiss itself
          // every time a scheme was picked.
          buttons.forEach(o => {
            const on = o.dataset.s === state.scheme;
            o.classList.toggle('tc-sel', on);
            o.setAttribute('aria-pressed', on ? 'true' : 'false');
          });
        });
      });
    }

    const randomizeBtn = document.getElementById('tc-randomize');
    const resetBtn     = document.getElementById('tc-reset');
    const advancedBtn  = document.getElementById('tc-advanced-link');
    if (randomizeBtn) randomizeBtn.addEventListener('click', randomize);
    if (resetBtn)     resetBtn.addEventListener('click', resetToDefault);
    if (advancedBtn)  advancedBtn.addEventListener('click', toggleAdvanced);

    wireNavDropdown(dock, document.querySelectorAll('.tc-nav-item'));
    return true;
  }

  // Nav dropdown, mega style. The panel is body-parented and fixed, so every trigger drives
  // the same element; open() re-reads whichever pill or FAB the trigger sits in and positions
  // from its rect. The box starts at that pill's own width and widens to its measure while its
  // height opens, so it reads as the menu growing rather than a panel appearing. Hover opens it
  // on pointer-fine devices, click pins it, and outside click / Esc close it.
  function wireNavDropdown(dock, navItems) {
    let openItem = null;
    let pinned = false;
    let closeTimer = null;
    let liftedPill = null;
    const canHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    const scrim = () => document.getElementById('tc-scrim');
    const MEASURE = 940;   // widest the panel opens to on a roomy viewport
    const EDGE = 10;       // keep this much clear of the viewport edge

    function setExpanded(li, on) {
      li.classList.toggle('tc-open', on);
      const btn = li.querySelector('.tc-nav-trigger');
      if (btn) btn.setAttribute('aria-expanded', on ? 'true' : 'false');
    }

    // The pill the trigger lives in: the header menu, the scroll-up menu, the mobile
    // row, or the FAB, which is its own pill. Falls back to the trigger itself if
    // markup changes.
    function pillFor(li) {
      return li.closest('.moving-menu, .static-menu, .static-menu-mobile, .tc-fab') ||
             li.querySelector('.tc-nav-trigger') || li;
    }

    // Anchor to the pill and hang off it: below and right-aligned for a nav mount,
    // and for a FAB away from whichever corner it sits in, so the panel opens into the
    // viewport instead of off it. Widths are written as custom properties so CSS owns
    // the transition.
    function position(li) {
      const pill = pillFor(li);
      const r = pill.getBoundingClientRect();
      const target = Math.min(MEASURE, window.innerWidth - EDGE * 2);
      // Clamp so a narrow viewport can't push the left edge off screen.
      const right = Math.min(
        Math.max(EDGE, window.innerWidth - r.right),
        Math.max(EDGE, window.innerWidth - target - EDGE)
      );
      if (li.classList.contains('tc-fab')) {
        const corner = li.dataset.corner || 'br';
        if (corner.charAt(0) === 'b') {
          dock.style.removeProperty('top');
          dock.style.bottom = (window.innerHeight - r.top + 10) + 'px';
        } else {
          dock.style.removeProperty('bottom');
          dock.style.top = (r.bottom + 10) + 'px';
        }
        if (corner.charAt(1) === 'l') {
          dock.style.removeProperty('right');
          dock.style.left = Math.min(
            Math.max(EDGE, r.left),
            Math.max(EDGE, window.innerWidth - target - EDGE)
          ) + 'px';
        } else {
          dock.style.removeProperty('left');
          dock.style.right = right + 'px';
        }
      } else {
        dock.style.removeProperty('bottom');
        dock.style.removeProperty('left');
        dock.style.top = (r.bottom + 10) + 'px';
        dock.style.right = right + 'px';
      }
      dock.style.setProperty('--tc-mega-w', Math.round(r.width) + 'px');
      dock.style.setProperty('--tc-mega-target', target + 'px');
    }

    function open(li, pin) {
      clearTimeout(closeTimer);
      if (openItem && openItem !== li) setExpanded(openItem, false);
      const reopening = !openItem;
      // Advanced is a detour, not a mode: every fresh open lands on the
      // themes list. Done here rather than on close so the swap happens
      // while the panel is still hidden, not mid-collapse.
      if (reopening && state.advanced) setAdvanced(false);
      // A FAB dock is bottom- or top-anchored with no nav bar to sit under, so it caps
      // its own height instead of trusting the pill to leave room.
      dock.classList.toggle('tc-from-fab', li.classList.contains('tc-fab'));
      position(li);
      dock.classList.remove('tc-hidden');
      if (reopening) {
        // Commit the closed state (pill width, zero height) before opening,
        // or the browser coalesces both into one paint and the morph never
        // shows. Reading offsetWidth forces that flush synchronously,
        // deliberately not requestAnimationFrame, which is throttled in
        // background tabs and skipped under some automation, either of which
        // would leave the panel stuck shut.
        dock.classList.remove('tc-mega-open');
        void dock.offsetWidth;
      }
      dock.classList.add('tc-mega-open');
      const s = scrim();
      if (s) s.classList.add('tc-on');
      // The scrim dims the page, but not the menu you opened it from: that
      // pill is the thing being pointed at, so it rides above the veil.
      if (liftedPill && liftedPill !== pillFor(li)) liftedPill.classList.remove('tc-lift');
      liftedPill = pillFor(li);
      liftedPill.classList.add('tc-lift');
      setExpanded(li, true);
      openItem = li;
      pinned = !!pin;
      stampStagger();
    }

    function close() {
      clearTimeout(closeTimer);
      if (!openItem) return;
      dock.classList.remove('tc-mega-open');
      const s = scrim();
      if (s) s.classList.remove('tc-on');
      if (liftedPill) { liftedPill.classList.remove('tc-lift'); liftedPill = null; }
      setExpanded(openItem, false);
      openItem = null;
      pinned = false;
      // Hide only once the collapse has run, so the height animates out.
      closeTimer = setTimeout(() => {
        if (!openItem) {
          dock.classList.add('tc-hidden');
          dock.classList.remove('tc-from-fab');
        }
      }, 440);
    }

    // The moving pill slides down as it appears and the header pill scrolls,
    // so keep the anchor honest while the panel is open.
    function reanchor() { if (openItem) position(openItem); }
    window.addEventListener('resize', reanchor);
    window.addEventListener('scroll', reanchor, { passive: true });

    navItems.forEach(li => {
      const btn = li.querySelector('.tc-nav-trigger');
      if (btn) {
        btn.addEventListener('click', e => {
          e.stopPropagation();
          if (openItem === li) {
            if (pinned) close();
            else pinned = true;
          } else {
            open(li, true);
          }
        });
      }
      if (canHover) {
        li.addEventListener('mouseenter', () => {
          if (openItem === li) clearTimeout(closeTimer);
          else open(li, false);
        });
        li.addEventListener('mouseleave', () => {
          if (openItem !== li || pinned) return;
          clearTimeout(closeTimer);
          closeTimer = setTimeout(close, 300);
        });
      }
    });

    if (canHover) {
      dock.addEventListener('mouseenter', () => clearTimeout(closeTimer));
      dock.addEventListener('mouseleave', () => {
        // A focused control in the panel counts as pinned. <input type="color">
        // opens the OS colour panel over the page, which pulls the pointer out
        // of the web contents and fires this mouseleave, so the hover-close
        // timer ran while you were still picking, and the menu dismissed itself
        // mid-edit. The input keeps DOM focus the whole time the native panel
        // is up, so testing focus is what tells "hovered away" apart from
        // "still using it".
        if (pinned || !openItem || dock.contains(document.activeElement)) return;
        clearTimeout(closeTimer);
        closeTimer = setTimeout(close, 300);
      });
    }

    // Anything inside the panel is handled by the panel. Stopping here rather
    // than testing dock.contains() on the document listener is deliberate:
    // controls that re-render themselves detach the clicked node first, and a
    // detached node is contained by nothing, which read as an outside click
    // and dismissed the panel. This holds the panel open regardless of what
    // any individual control does to the DOM on its way through.
    dock.addEventListener('click', e => e.stopPropagation());

    document.addEventListener('click', e => {
      if (!openItem) return;
      if (dock.contains(e.target) || e.target.closest('.tc-nav-item')) return;
      close();
    });
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') close();
    });
  }

  function boot() {
    // Read here, not while this file is being evaluated: the 404 applies its theme to <html>
    // from its own script, and this one is deferred, so the attribute is in place by now.
    state.style = root.dataset.style || 'default';
    dock = document.getElementById('tc-dock');
    // No dock, no picker: a picker-free page can load this file harmlessly.
    if (!dock) return;
    if (!wireDom()) return;
    restore();
    applyColors();
    syncSchemes();
    paintPreview(state.style, 'current');
    stampStagger();

    // Defer loading every theme's Google Fonts so the wordmark cards render
    // each name in its own heading typography. Idle so the cost lands after
    // first paint; falls back to a 800ms timeout where rIC is unavailable.
    const idle = window.requestIdleCallback || function (fn) { return setTimeout(fn, 800); };
    idle(loadAllFonts, { timeout: 2500 });

    document.addEventListener('keydown', e => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      const dockOpen = dock && !dock.classList.contains('tc-hidden');
      if (e.code === 'Space' && dockOpen) { e.preventDefault(); randomize(); }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
