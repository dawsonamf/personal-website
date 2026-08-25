(function () {
  'use strict';

  // Feature gate lives in js/theme-bootstrap.js; read it from the window.
  if (!window.__THEME_CYCLER_ENABLED) return;

  // The style registry in js/theme-bootstrap.js is the single source of truth
  // for the default palette and every style version.
  const REGISTRY    = window.__THEME_REGISTRY || {};
  const STYLE_ORDER = window.__THEME_ORDER || ['default'];
  const entryColors = e => [e.colors.text, e.colors.bg, e.colors.primary, e.colors.secondary, e.colors.accent];

  const DEFAULT_COLORS = REGISTRY.default ? entryColors(REGISTRY.default) : ['#e6f1ff','#1d1d1d','#61ffda','#2c2c2c','#61ffda'];
  const DEFAULT_THEME  = 'dark';

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
  // numbers match the original generator, so styles without a `random`
  // profile (including the default) keep the old distribution exactly.
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
    const mode  = isDark ? 'dark' : 'light';
    const entry = REGISTRY[state.style];
    const prof  = (entry && entry.random && entry.random[mode]) || DEFAULT_RANDOM[mode];

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

  // Session persistence: survives page-to-page navigation, but any reload
  // (including force-refresh) resets to defaults. Must agree with theme-bootstrap.js.
  const STORAGE_KEY = 'dawson-theme-cycler';
  const STYLE_KEY   = 'dawson-style';
  function isReload() {
    try {
      const nav = performance.getEntriesByType('navigation')[0];
      return nav && nav.type === 'reload';
    } catch { return false; }
  }
  function persist() {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify({
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
      if (!Array.isArray(saved.colors) || saved.colors.length !== 5) return false;
      state.colors = saved.colors;
      state.locks  = Array.isArray(saved.locks) && saved.locks.length === 5 ? saved.locks : state.locks;
      state.scheme = typeof saved.scheme === 'string' ? saved.scheme : state.scheme;
      state.theme  = saved.theme === 'light' ? 'light' : 'dark';
      return true;
    } catch { return false; }
  }

  const STEPS = [5,10,15,20,25,30,35,40,45,50,55,60,65,70,75,80,85,90,95];
  const ROLES = [
    { key: 'text',      label: 'Text' },
    { key: 'bg',        label: 'Background' },
    { key: 'primary',   label: 'Primary' },
    { key: 'secondary', label: 'Secondary' },
    { key: 'accent',    label: 'Accent' },
  ];
  const root = document.documentElement;

  // theme-bootstrap.js already resolved the active style pre-paint.
  const activeEntry = REGISTRY[window.__ACTIVE_STYLE] || REGISTRY.default || null;

  let state = {
    style:    activeEntry ? activeEntry.id : 'default',
    colors:   activeEntry ? entryColors(activeEntry) : DEFAULT_COLORS.slice(),
    locks:    [false,false,false,false,false],
    scheme:   'random',
    theme:    activeEntry && activeEntry.polarity ? activeEntry.polarity : DEFAULT_THEME,
    advanced: false,
  };

  function applyColors(writeUi = true) {
    ROLES.forEach((r,i) => root.style.setProperty('--'+r.key, state.colors[i]));
    ROLES.forEach((r,i) => {
      const {h,s,l} = hexToHsl(state.colors[i]);
      STEPS.forEach(a => root.style.setProperty(
        `--${r.key}${a}`,
        `hsla(${h.toFixed(0)},${s.toFixed(0)}%,${l.toFixed(0)}%,${a}%)`
      ));
    });
    applyDerivedNeutrals();
    persist();
    // Page widgets that paint with the palette (the Plotly dashboards in blog
    // posts) re-read the CSS variables on this signal and redraw.
    try { window.dispatchEvent(new CustomEvent('dawson:palette')); } catch {}
    if (writeUi) renderRoles();
    else updateRoleSwatches();
    // The preview card shows the ACTIVE style's live palette, so anything
    // that moves the palette (shuffle, a scheme redraw, dragging a color)
    // has to repaint it. Pointing at some other style parks previewId
    // elsewhere, and that card must not move — it is showing that style's
    // own registry colors, which a shuffle never touches.
    if (previewId && previewId === state.style) paintPreview(previewId, previewMeta);
  }

  // The jobs-menu navy palette and --neutral-gray are static (styles.css or
  // registry tokens), so a randomized palette would leave them behind. Once
  // the toy diverges from the active style's base colors, derive replacements
  // from the live roles; on return to base, restore the style's tokens or the
  // static defaults. --code-bg/--code-fg ride along so code blocks keep a
  // dark ground that matches the pinned hljs token colors.
  const DERIVED_NEUTRALS = ['--jobs-menu-navy-dark', '--jobs-menu-navy', '--jobs-menu-slate', '--neutral-gray', '--code-bg', '--code-fg'];
  function blendHex(a, b, t) {
    const A = hexToRgb(a), B = hexToRgb(b);
    return rgbToHex(A.r + (B.r - A.r) * t, A.g + (B.g - A.g) * t, A.b + (B.b - A.b) * t);
  }
  function applyDerivedNeutrals() {
    const entry = REGISTRY[state.style];
    const base = entry ? entryColors(entry) : DEFAULT_COLORS;
    const diverged = state.colors.some((c, i) => String(c).toLowerCase() !== String(base[i]).toLowerCase());
    if (!diverged) {
      DERIVED_NEUTRALS.forEach(k => {
        const v = entry && entry.tokens && entry.tokens[k];
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

  // In-place DOM update for live color-picker dragging. Rebuilding would
  // destroy the <input type="color"> and close the native picker.
  function updateRoleSwatches() {
    const host = document.getElementById('tc-roles');
    if (!host) return;
    host.querySelectorAll('.tc-role').forEach((el, i) => {
      const sw = el.querySelector('.tc-sw');
      const inp = el.querySelector('input[type="color"]');
      if (sw) sw.style.background = state.colors[i];
      el.title = state.colors[i];
      if (inp && inp.value.toLowerCase() !== state.colors[i].toLowerCase()) {
        inp.value = state.colors[i];
      }
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

  // ---- Style versions (preset strip) --------------------------------------

  // Activate a style version: land on the home page with the documented
  // ?style= seed and let theme-bootstrap.js apply it pre-paint. A full
  // navigation means tilt, the cursor follower, and the masthead type all
  // boot natively in the new style — no live patching of page features.
  function switchStyle(id) {
    if (!REGISTRY[id] || id === state.style) return;
    // Palette-toy overrides don't survive a style switch.
    try { sessionStorage.removeItem(STORAGE_KEY); } catch {}
    window.location.href = '/?style=' + encodeURIComponent(id);
  }

  // Each preset card carries its theme's palette + heading font as CSS vars,
  // so a randomized palette never repaints them — they always show the base
  // registry colors. --tc-row-heading is absent for the default theme; the
  // CSS uses var(--tc-row-heading, inherit) so it falls back to the dock's
  // own font in that case.
  function renderPresets() {
    const host = document.getElementById('tc-presets');
    if (!host) return;
    host.innerHTML = STYLE_ORDER.map(id => {
      const e = REGISTRY[id];
      if (!e) return '';
      const [text, bg, primary, secondary, accent] = entryColors(e);
      const heading = (e.tokens && e.tokens['--font-heading']) || '';
      const headingVar = heading ? `--tc-row-heading:${heading};` : '';
      const sel = state.style === id;
      // Two shapes per row: a plain text link for the wide panel and a
      // wordmark card for the narrow sheet. css/theme-cycler.css shows one
      // and hides the other, so order lives in exactly one place.
      //
      // The wide row is an <a> with the real ?style= href, not a <button>:
      // it keeps middle-click working, and it sidesteps the .tc-presets
      // button card rules entirely (see css/theme-cycler.css). .menu-item is
      // what makes each skin style it in that theme's own menu voice.
      return `<li class="${sel ? 'tc-row-sel' : ''}" style="--tc-row-text:${text};--tc-row-bg:${bg};--tc-row-primary:${primary};--tc-row-secondary:${secondary};--tc-row-accent:${accent};${headingVar}">
        <a href="/?style=${encodeURIComponent(id)}" data-id="${id}" class="tc-row-link menu-item tc-stagger ${sel ? 'tc-sel' : ''}"${sel ? ' aria-current="true"' : ''}>${e.label}</a>
        <button data-id="${id}" class="tc-row-card tc-stagger ${sel ? 'tc-sel' : ''}" aria-pressed="${sel}" tabindex="-1" aria-hidden="true">
          <span class="tc-wm-name">${e.label}</span>
          <span class="tc-wm-rule" aria-hidden="true"></span>
        </button>
      </li>`;
    }).join('');
    host.querySelectorAll('[data-id]').forEach(b => {
      // preventDefault so the anchor's own navigation doesn't race
      // switchStyle, which clears the palette override first.
      b.addEventListener('click', e => { e.preventDefault(); switchStyle(b.dataset.id); });
      // Pointing at a style previews it in the card; leaving the list puts
      // the active style back.
      b.addEventListener('mouseenter', () => paintPreview(b.dataset.id, 'preview'));
      b.addEventListener('focus',      () => paintPreview(b.dataset.id, 'preview'));
    });
    host.addEventListener('mouseleave', () => paintPreview(state.style, 'current'));
    paintPreview(state.style, 'current');
    stampStagger();
  }

  // Which style the preview card is currently showing, so a palette change
  // can repaint it without guessing.
  let previewId = null;
  let previewMeta = 'current';

  // Repaints the preview card. The ACTIVE style draws from the live palette,
  // so Shuffle colors is visible in the card as well as on the page. Every
  // other style draws from the registry, never from the live CSS vars, so a
  // shuffle can't bleed into a preview of a style you're only pointing at.
  function paintPreview(id, meta) {
    const card = document.getElementById('tc-preview');
    const entry = REGISTRY[id];
    if (!card || !entry) return;
    previewId = id;
    previewMeta = meta;
    const [text, bg, primary, , accent] = id === state.style ? state.colors : entryColors(entry);
    const heading = (entry.tokens && entry.tokens['--font-heading']) || '';
    card.style.setProperty('--tc-pv-bg', bg);
    card.style.setProperty('--tc-pv-text', text);
    card.style.setProperty('--tc-pv-primary', primary);
    card.style.setProperty('--tc-pv-accent', accent);
    if (heading) card.style.setProperty('--tc-pv-heading', heading);
    else card.style.removeProperty('--tc-pv-heading');
    const name = document.getElementById('tc-preview-name');
    const label = document.getElementById('tc-preview-meta');
    if (name) name.textContent = entry.label;
    if (label) label.textContent = meta;
  }

  // Index every animated child so the CSS cascade delay produces the stagger.
  function stampStagger() {
    const dock = document.getElementById('tc-dock');
    if (!dock) return;
    let i = 0;
    dock.querySelectorAll('.tc-stagger').forEach(el => {
      if (el.classList.contains('tc-row-card') && getComputedStyle(el).display === 'none') return;
      el.style.setProperty('--i', i++);
    });
  }

  // The wordmark cards render each theme's name in its own heading font, so
  // every style's Google Font has to be loaded — not just the active one.
  // Idempotent: skips fonts already in <head>. Deferred to idle so the cost
  // lands after first paint; visitors who never open the menu still pay it,
  // but the requests are non-blocking with display=swap.
  let fontsLoaded = false;
  function loadAllFonts() {
    if (fontsLoaded) return;
    fontsLoaded = true;
    const seen = new Set();
    STYLE_ORDER.forEach(id => {
      const e = REGISTRY[id];
      if (!e || !Array.isArray(e.fonts)) return;
      e.fonts.forEach(href => {
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
    renderSchemes();
  }

  // Advanced swaps what the left column shows — the styles list steps aside
  // for the scheme + color editor — instead of expanding the panel downward.
  // The action's own label flips to the way back out, so there is no hidden
  // second gesture to discover.
  function setAdvanced(on) {
    state.advanced = !!on;
    const panel   = document.getElementById('tc-advanced');
    const presets = document.getElementById('tc-presets');
    const head    = document.getElementById('tc-styles-head');
    const link    = document.getElementById('tc-advanced-link');
    const label   = document.getElementById('tc-advanced-label');
    const sub     = document.getElementById('tc-advanced-sub');
    if (panel)   panel.classList.toggle('tc-hidden', !state.advanced);
    if (presets) presets.classList.toggle('tc-hidden', state.advanced);
    if (head)    head.textContent = state.advanced ? 'Advanced' : 'Styles';
    if (label)   label.textContent = state.advanced ? 'Back to styles' : 'Advanced';
    if (sub)     sub.textContent = state.advanced ? 'done editing' : 'scheme & colors';
    if (link) {
      link.classList.toggle('tc-open', state.advanced);
      link.setAttribute('aria-expanded', state.advanced ? 'true' : 'false');
    }
  }

  function toggleAdvanced() {
    setAdvanced(!state.advanced);
  }

  function renderRoles() {
    const host = document.getElementById('tc-roles');
    if (!host) return;
    host.innerHTML = ROLES.map((r,i) => {
      const hex = state.colors[i];
      const locked = state.locks[i];
      return `<label class="tc-role" title="${hex}">
        <span class="tc-sw" style="background:${hex}"></span>
        <span class="tc-role-name">${r.label}</span>
        <button class="tc-lk ${locked?'tc-on':''}" data-i="${i}" aria-label="${locked?'Unlock':'Lock'} ${r.label}">
          <i class="fa-solid fa-${locked?'lock':'lock-open'}"></i>
        </button>
        <input type="color" value="${hex}" data-i="${i}">
      </label>`;
    }).join('');
    host.querySelectorAll('input[type="color"]').forEach(inp => {
      // Live-drag updates: avoid re-rendering so the native picker stays open.
      inp.addEventListener('input', e => { state.colors[+e.target.dataset.i] = e.target.value; applyColors(false); });
      inp.addEventListener('click', e => e.stopPropagation());
    });
    host.querySelectorAll('.tc-lk').forEach(btn => {
      btn.addEventListener('click', e => {
        e.preventDefault(); e.stopPropagation();
        const i = +btn.dataset.i;
        state.locks[i] = !state.locks[i];
        renderRoles();
      });
    });
  }

  function renderSchemes() {
    const host = document.getElementById('tc-schemes');
    if (!host) return;
    const opts = ['random',...SCHEMES];
    host.innerHTML = opts.map(s => `<button type="button" data-s="${s}" aria-pressed="${state.scheme===s}" class="${state.scheme===s?'tc-sel':''}">${s}</button>`).join('');
    const buttons = host.querySelectorAll('button');
    buttons.forEach(b => {
      b.addEventListener('click', () => {
        state.scheme = b.dataset.s;
        // Move the selection in place rather than re-rendering. A rebuild
        // detaches the button mid-click, and the outside-click handler that
        // closes the panel tests dock.contains(e.target) on the way up — a
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

  function injectDom() {
    const dock = document.createElement('aside');
    // .tc-dock is kept so all 20 skins keep theming this panel unchanged;
    // .tc-mega layers the wide geometry on top. Same element IDs as the
    // compact dock, so renderSchemes/renderRoles/toggleAdvanced are untouched.
    dock.className = 'tc-dock tc-mega tc-hidden';
    dock.id = 'tc-dock';
    dock.setAttribute('aria-label', 'Theme controls');
    dock.innerHTML = `
      <div class="tc-mega-clip">
        <div class="tc-mega-inner">

          <div class="tc-mega-styles">
            <h3 class="tc-mega-head tc-stagger" id="tc-styles-head">Styles</h3>
            <!-- The list and the editor are the two faces of one box: both
                 fill .tc-mega-swap, so switching between them cannot change
                 the panel's height no matter how tall a skin's type runs. -->
            <div class="tc-mega-swap">
            <ul class="tc-presets" id="tc-presets"></ul>
            <div class="tc-advanced tc-hidden" id="tc-advanced">
              <div class="tc-group tc-group-schemes">
                <span class="tc-group-label">Scheme</span>
                <div class="tc-schemes" id="tc-schemes"></div>
              </div>
              <div class="tc-group tc-group-roles">
                <span class="tc-group-label">Colors</span>
                <div class="tc-roles" id="tc-roles"></div>
              </div>
            </div>
            </div>
          </div>

          <div class="tc-mega-side">
            <h3 class="tc-mega-head tc-stagger">Palette</h3>
            <div class="tc-actions">
              <button class="tc-action menu-item tc-stagger" id="tc-randomize" type="button">Shuffle colors<span class="tc-action-sub">random palette</span></button>
              <button class="tc-action menu-item tc-stagger" id="tc-reset" type="button">Reset<span class="tc-action-sub">back to default</span></button>
              <button class="tc-action menu-item tc-stagger" id="tc-advanced-link" type="button" aria-expanded="false" aria-controls="tc-advanced"><span id="tc-advanced-label">Advanced</span><span class="tc-action-sub" id="tc-advanced-sub">scheme &amp; colors</span></button>
            </div>
          </div>

          <div class="tc-preview tc-stagger" id="tc-preview">
            <span class="tc-preview-name" id="tc-preview-name"></span>
            <span class="tc-preview-rule" aria-hidden="true"></span>
            <span class="tc-preview-meta" id="tc-preview-meta">current</span>
          </div>

        </div>
      </div>
    `;

    const navItems = document.querySelectorAll('.tc-nav-item');
    if (!navItems.length) return;

    // The panel always lives on <body>, never inside the pill: .moving-menu
    // carries backdrop-filter, which would make it the containing block for
    // this fixed element and collapse it to the pill's width. See the note
    // at the top of the mega block in css/theme-cycler.css.
    document.body.appendChild(dock);

    const scrim = document.createElement('div');
    scrim.className = 'tc-scrim';
    scrim.id = 'tc-scrim';
    document.body.appendChild(scrim);

    wireNavDropdown(dock, navItems);

    document.getElementById('tc-randomize').addEventListener('click', randomize);
    document.getElementById('tc-reset').addEventListener('click', resetToDefault);
    document.getElementById('tc-advanced-link').addEventListener('click', toggleAdvanced);
  }

  // Nav dropdown: hover opens it on pointer-fine devices, click pins it,
  // and outside click / Esc / the X close it. The single dock node reparents
  // under whichever trigger opened it (static menu at the top of the page,
  // moving menu once it appears on scroll-up, or the mobile quick-links row).
  // Nav dropdown, mega style. The panel is body-parented and fixed, so both
  // the static header pill and the scroll-up moving pill drive the same
  // element; open() just re-reads whichever pill the trigger sits in and
  // positions from its rect. The box starts at that pill's own width and
  // widens to its measure while its height opens, so it reads as the menu
  // growing rather than a panel appearing.
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

    // The pill the trigger lives in: the header menu, the scroll-up menu, or
    // the mobile row. Falls back to the trigger itself if markup changes.
    function pillFor(li) {
      return li.closest('.moving-menu, .static-menu, .static-menu-mobile') ||
             li.querySelector('.tc-nav-trigger') || li;
    }

    // Anchor to the pill's right edge and hang below it. Widths are written
    // as custom properties so CSS owns the transition.
    function position(li) {
      const pill = pillFor(li);
      const r = pill.getBoundingClientRect();
      const target = Math.min(MEASURE, window.innerWidth - EDGE * 2);
      // Clamp so a narrow viewport can't push the left edge off screen.
      const right = Math.min(
        Math.max(EDGE, window.innerWidth - r.right),
        Math.max(EDGE, window.innerWidth - target - EDGE)
      );
      dock.style.top = (r.bottom + 10) + 'px';
      dock.style.right = right + 'px';
      dock.style.setProperty('--tc-mega-w', Math.round(r.width) + 'px');
      dock.style.setProperty('--tc-mega-target', target + 'px');
    }

    function open(li, pin) {
      clearTimeout(closeTimer);
      if (openItem && openItem !== li) setExpanded(openItem, false);
      const reopening = !openItem;
      // Advanced is a detour, not a mode: every fresh open lands on the
      // styles list. Done here rather than on close so the swap happens
      // while the panel is still hidden, not mid-collapse.
      if (reopening && state.advanced) setAdvanced(false);
      position(li);
      dock.classList.remove('tc-hidden');
      if (reopening) {
        // Commit the closed state (pill width, zero height) before opening,
        // or the browser coalesces both into one paint and the morph never
        // shows. Reading offsetWidth forces that flush synchronously —
        // deliberately not requestAnimationFrame, which is throttled in
        // background tabs and skipped under some automation, either of which
        // would leave the panel stuck shut.
        dock.classList.remove('tc-mega-open');
        void dock.offsetWidth;
      }
      dock.classList.add('tc-mega-open');
      const s = scrim();
      if (s) s.classList.add('tc-on');
      // The scrim dims the page, but not the menu you opened it from — that
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
        if (!openItem) dock.classList.add('tc-hidden');
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
        if (pinned || !openItem) return;
        clearTimeout(closeTimer);
        closeTimer = setTimeout(close, 300);
      });
    }

    // Anything inside the panel is handled by the panel. Stopping here rather
    // than testing dock.contains() on the document listener is deliberate:
    // controls that re-render themselves detach the clicked node first, and a
    // detached node is contained by nothing — which read as an outside click
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
    if (isReload()) {
      try { sessionStorage.removeItem(STORAGE_KEY); } catch {}
    } else {
      restore();
    }
    injectDom();
    applyColors();
    renderSchemes();
    renderPresets();

    // Defer loading every theme's Google Fonts so the wordmark cards render
    // each name in its own heading typography. Idle so the cost lands after
    // first paint; falls back to a 800ms timeout where rIC is unavailable.
    const idle = window.requestIdleCallback || function (fn) { return setTimeout(fn, 800); };
    idle(loadAllFonts, { timeout: 2500 });

    document.addEventListener('keydown', e => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      const dock = document.getElementById('tc-dock');
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
