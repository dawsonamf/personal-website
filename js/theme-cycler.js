(function () {
  'use strict';

  // Feature gate lives in js/theme-bootstrap.js; read it from the window.
  if (!window.__THEME_CYCLER_ENABLED) return;

  const DEFAULT_COLORS = ['#e6f1ff','#1d1d1d','#61ffda','#2c2c2c','#61ffda'];
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
  function hslToHex(h,s,l) {
    const [r,g,b] = hslFracToRgb(h/360, s/100, l/100);
    return rgbToHex(r,g,b);
  }
  function invertL(hex) { const {h,s,l}=hexToHsl(hex); return hslToHex(h,s,100-l); }

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

  function generatePalette(scheme, baseHueDeg, isDark) {
    const lightnessTargets = isDark ? [
      uniform(0.90,0.95),
      uniform(0.02,0.08),
      uniform(0.70,0.75),
      uniform(0.30,0.35),
      uniform(0.50,0.60),
    ] : [
      uniform(0.02,0.08),
      uniform(0.96,0.99),
      uniform(0.50,0.55),
      uniform(0.70,0.75),
      uniform(0.60,0.65),
    ];

    const baseHueFrac = baseHueDeg / 360;
    const hueContrast = lerp(0.33, 1.00, Math.random());
    const satFixed    = lerp(0.10, 1.00, Math.random());
    const mult        = SCHEME_MULT[scheme] ?? 0;

    const out = [];
    for (let i=0; i<5; i++) {
      const t = i/4;
      let hueOff = (i<3) ? 0 : t * hueContrast;
      hueOff *= mult;
      if (scheme !== 'monochromatic') hueOff += (Math.random()*2-1)*0.01;
      const [r,g,b] = hslFracToRgb(baseHueFrac + hueOff, satFixed, lightnessTargets[i]);
      out.push(rgbToHex(r,g,b));
    }
    return out;
  }

  // Session persistence: survives page-to-page navigation, but any reload
  // (including force-refresh) resets to defaults. Must agree with theme-bootstrap.js.
  const STORAGE_KEY = 'dawson-theme-cycler';
  const UNLOCK_KEY  = 'dawson-cycler-unlocked';
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

  let state = {
    colors:   DEFAULT_COLORS.slice(),
    locks:    [false,false,false,false,false],
    scheme:   'random',
    theme:    DEFAULT_THEME,
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
    persist();
    if (writeUi) renderRoles();
    else updateRoleSwatches();
  }

  // In-place DOM update for live color-picker dragging — avoids destroying
  // the <input type="color"> element, which would close the native picker.
  function updateRoleSwatches() {
    const host = document.getElementById('tc-roles');
    if (!host) return;
    host.querySelectorAll('.tc-role').forEach((el, i) => {
      const sw = el.querySelector('.tc-sw');
      const hex = el.querySelector('.tc-hex');
      const inp = el.querySelector('input[type="color"]');
      if (sw)  sw.style.background = state.colors[i];
      if (hex) hex.textContent = state.colors[i];
      if (inp && inp.value.toLowerCase() !== state.colors[i].toLowerCase()) {
        inp.value = state.colors[i];
      }
    });
  }

  function applyTheme() {
    root.setAttribute('data-theme', state.theme);
  }

  function flipTheme() {
    state.theme = state.theme === 'dark' ? 'light' : 'dark';
    state.colors = state.colors.map(invertL);
    applyTheme();
    applyColors();
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

  function resetToDefault() {
    state.colors = DEFAULT_COLORS.slice();
    state.locks  = [false,false,false,false,false];
    state.scheme = 'random';
    state.theme  = DEFAULT_THEME;
    try { sessionStorage.removeItem(STORAGE_KEY); } catch {}
    applyTheme();
    applyColors();
    renderSchemes();
  }

  function toggleAdvanced() {
    state.advanced = !state.advanced;
    const panel = document.getElementById('tc-advanced');
    const link  = document.getElementById('tc-advanced-link');
    if (panel) panel.classList.toggle('tc-hidden', !state.advanced);
    if (link)  link.textContent = state.advanced ? 'Simple' : 'Advanced';
  }

  function renderRoles() {
    const host = document.getElementById('tc-roles');
    if (!host) return;
    host.innerHTML = ROLES.map((r,i) => {
      const hex = state.colors[i];
      const locked = state.locks[i];
      return `<label class="tc-role" title="${r.label}">
        <span class="tc-sw" style="background:${hex}"></span>
        <span class="tc-hex">${hex}</span>
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
    host.innerHTML = opts.map(s => `<button data-s="${s}" class="${state.scheme===s?'tc-sel':''}">${s}</button>`).join('');
    host.querySelectorAll('button').forEach(b => {
      b.addEventListener('click', () => { state.scheme = b.dataset.s; renderSchemes(); });
    });
  }

  function injectDom() {
    const toggle = document.createElement('button');
    toggle.className = 'tc-toggle';
    toggle.id = 'tc-toggle';
    toggle.title = 'Customize theme';
    toggle.setAttribute('aria-label', 'Customize theme');
    toggle.innerHTML = '<i class="fa-solid fa-palette"></i>';
    document.body.appendChild(toggle);

    const dock = document.createElement('aside');
    dock.className = 'tc-dock tc-hidden';
    dock.id = 'tc-dock';
    dock.innerHTML = `
      <button class="tc-close" id="tc-close" aria-label="Close">
        <i class="fa-solid fa-xmark"></i>
      </button>

      <button class="tc-randomize" id="tc-randomize" type="button" aria-label="Randomize palette">
        <i class="fa-solid fa-dice"></i>
      </button>

      <div class="tc-advanced tc-hidden" id="tc-advanced">
        <div class="tc-group">
          <span class="tc-group-label">Scheme</span>
          <div class="tc-schemes" id="tc-schemes"></div>
        </div>
        <div class="tc-group">
          <span class="tc-group-label">Colors</span>
          <div class="tc-roles" id="tc-roles"></div>
        </div>
      </div>

      <div class="tc-footer">
        <a href="#" class="tc-link" id="tc-reset">Reset</a>
        <a href="#" class="tc-link" id="tc-advanced-link">Advanced</a>
      </div>
    `;
    document.body.appendChild(dock);

    toggle.addEventListener('click', () => {
      dock.classList.remove('tc-hidden');
      toggle.classList.add('tc-hidden');
    });
    document.getElementById('tc-close').addEventListener('click', () => {
      dock.classList.add('tc-hidden');
      toggle.classList.remove('tc-hidden');
    });
    document.getElementById('tc-randomize').addEventListener('click', randomize);
    document.getElementById('tc-reset').addEventListener('click', e => { e.preventDefault(); resetToDefault(); });
    document.getElementById('tc-advanced-link').addEventListener('click', e => { e.preventDefault(); toggleAdvanced(); });
  }

  // Easter-egg unlock: click the hero selfie to reveal the dock.
  function isUnlocked() {
    try { return sessionStorage.getItem(UNLOCK_KEY) === '1'; } catch { return false; }
  }
  function markUnlocked() {
    try { sessionStorage.setItem(UNLOCK_KEY, '1'); } catch {}
  }

  function revealAtClick(event) {
    if (isUnlocked()) return;
    markUnlocked();

    const toggle = document.getElementById('tc-toggle');
    const dock   = document.getElementById('tc-dock');
    if (!toggle) return;

    // Dock stays closed — the FAB is what appears.
    if (dock) dock.classList.add('tc-hidden');

    toggle.classList.remove('tc-hidden');
    const rect = toggle.getBoundingClientRect();
    const cx = event.clientX;
    const cy = event.clientY;
    // Clamp so the FAB doesn't pop off-screen if clicked near an edge.
    const startLeft = Math.max(8, Math.min(window.innerWidth  - rect.width  - 8, cx - rect.width / 2));
    const startTop  = Math.max(8, Math.min(window.innerHeight - rect.height - 8, cy - rect.height / 2));

    toggle.style.transition = 'none';
    toggle.style.right  = 'auto';
    toggle.style.bottom = 'auto';
    toggle.style.left = startLeft + 'px';
    toggle.style.top  = startTop  + 'px';
    toggle.style.opacity = '0';

    // Force reflow so the next transition actually animates.
    // eslint-disable-next-line no-unused-expressions
    toggle.offsetHeight;

    toggle.style.transition = 'opacity 0.12s linear';
    toggle.style.opacity = '1';

    setTimeout(() => {
      const r = toggle.getBoundingClientRect();
      const targetLeft = window.innerWidth  - r.width  - 20;
      const targetTop  = window.innerHeight - r.height - 20;

      toggle.style.transition = 'left 0.32s cubic-bezier(0.22, 1, 0.36, 1), top 0.32s cubic-bezier(0.22, 1, 0.36, 1)';
      toggle.style.left = targetLeft + 'px';
      toggle.style.top  = targetTop  + 'px';

      // Once docked, hand positioning back to the stylesheet.
      setTimeout(() => {
        toggle.style.transition = '';
        toggle.style.left       = '';
        toggle.style.top        = '';
        toggle.style.right      = '';
        toggle.style.bottom     = '';
        toggle.style.opacity    = '';
      }, 340);
    }, 140);
  }

  function wireUnlockTrigger() {
    // Only wire on the home page (where the selfie exists).
    const selfie = document.getElementById('typing-image');
    if (!selfie) return;
    selfie.addEventListener('click', revealAtClick);
  }

  function boot() {
    if (isReload()) {
      try {
        sessionStorage.removeItem(STORAGE_KEY);
        sessionStorage.removeItem(UNLOCK_KEY);
      } catch {}
    } else {
      restore();
    }
    injectDom();
    applyTheme();
    applyColors();
    renderSchemes();

    const toggle = document.getElementById('tc-toggle');
    if (toggle && !isUnlocked()) toggle.classList.add('tc-hidden');
    if (!isUnlocked()) wireUnlockTrigger();

    document.addEventListener('keydown', e => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      const dockOpen = !document.getElementById('tc-dock').classList.contains('tc-hidden');
      if (e.code === 'Space' && dockOpen) { e.preventDefault(); randomize(); }
      if (e.altKey && e.key.toLowerCase() === 't') { e.preventDefault(); flipTheme(); }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
