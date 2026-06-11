// Loaded synchronously before first paint so --text50, --bg50, etc. resolve
// on the first stylesheet read, and so a persisted style version (data-style,
// its tokens, and its CSS) applies with no flash of the default site.
// Flip THEME_CYCLER_ENABLED to kill the cycler UI and its persisted overrides.
(function () {
  // Gate read by js/theme-cycler.js via window.__THEME_CYCLER_ENABLED.
  var THEME_CYCLER_ENABLED = true;
  window.__THEME_CYCLER_ENABLED = THEME_CYCLER_ENABLED;

  // ---- Style registry -----------------------------------------------------
  // One entry per style version (architecture in todo/STYLE_VERSIONS_SPEC.md).
  // The default entry stamps no attribute and loads no assets, so default
  // visitors get the site unchanged. Asset paths are root-absolute so they
  // resolve from subdirectory pages.
  var REGISTRY = {
    'default': {
      id: 'default',
      label: 'Default',
      polarity: 'dark',
      colors: { text:'#e6f1ff', bg:'#1d1d1d', primary:'#61ffda', secondary:'#2c2c2c', accent:'#61ffda' },
    },
    'studio': {
      id: 'studio',
      label: 'Studio',
      polarity: 'light',
      flags: { still: true },
      colors: { text:'#1b1a17', bg:'#f4f2ec', primary:'#d44000', secondary:'#e9e6dd', accent:'#d44000' },
      // Random-palette profile (consumed by js/theme-cycler.js): quiet paper
      // and ink, with the saturation in primary/accent only.
      random: {
        light: {
          sat: [0.05, 0.30],
          roles: [
            { l: [0.06, 0.12], hueT: 0 },                       // text: ink
            { l: [0.92, 0.96], hueT: 0 },                       // bg: paper
            // primary/accent lightness is capped low so even yellow hues
            // stay readable on paper.
            { l: [0.32, 0.44], hueT: 1.00, sat: [0.80, 1.00] }, // primary: one hot editorial color
            { l: [0.84, 0.90], hueT: 0 },                       // secondary: deeper paper
            { l: [0.36, 0.50], hueT: 0.75, sat: [0.75, 1.00] }, // accent
          ],
        },
        dark: {
          sat: [0.05, 0.25],
          roles: [
            { l: [0.88, 0.94], hueT: 0 },                       // text: warm white ink
            { l: [0.08, 0.12], hueT: 0 },                       // bg: night paper
            { l: [0.55, 0.65], hueT: 1.00, sat: [0.75, 1.00] },
            { l: [0.14, 0.20], hueT: 0 },
            { l: [0.58, 0.68], hueT: 0.75, sat: [0.70, 1.00] },
          ],
        },
      },
      tokens: {
        '--font-body': "'Inter', sans-serif",
        '--font-heading': "'Space Grotesk', sans-serif",
        '--border-radius': '0px',
        '--radius-pill': '0px',
        '--neutral-gray': '#6f6a60',
        '--jobs-menu-navy-dark': '#e9e6dd',
        '--jobs-menu-navy': '#dedacf',
        '--jobs-menu-slate': '#6b675e',
      },
      fonts: ['https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Space+Grotesk:wght@500;600;700&display=swap'],
      css: '/css/themes/studio.css',
    },
    'brutalist': {
      id: 'brutalist',
      label: 'Brutalist',
      polarity: 'light',
      // tilt gates the hover physics via window.__styleAllowsTilt below.
      // still and tilt also stamp html attributes read by css/themes/_base.css.
      flags: { tilt: false, still: true },
      colors: { text:'#0a0a0a', bg:'#ffe600', primary:'#1400ff', secondary:'#ffffff', accent:'#1400ff' },
      // Random-palette profile: acid poster. The ground is the loud color,
      // panels stay paper, and primary is capped dark enough (max 0.40 L)
      // to read as ink on the bright ground. Dark mode is the inverted
      // flyer, acid text and electric marks on ink.
      random: {
        light: {
          sat: [0.85, 1.00],
          roles: [
            { l: [0.02, 0.08], hueT: 0, sat: [0.00, 0.30] }, // text: true ink, flyers print black
            { l: [0.47, 0.60], hueT: 0 },                    // bg: acid ground
            { l: [0.26, 0.40], hueT: 1.00 },  // primary: electric interactive
            { l: [0.92, 0.99], hueT: 0 },     // secondary: paper panels (pale tint)
            { l: [0.28, 0.42], hueT: 0.75 },  // accent
          ],
        },
        dark: {
          sat: [0.85, 1.00],
          roles: [
            { l: [0.50, 0.62], hueT: 0 },     // text: acid on ink
            { l: [0.03, 0.09], hueT: 0 },     // bg: ink ground
            { l: [0.55, 0.68], hueT: 1.00 },  // primary
            { l: [0.10, 0.16], hueT: 0 },     // secondary: dark panel
            { l: [0.55, 0.66], hueT: 0.75 },  // accent
          ],
        },
      },
      tokens: {
        '--font-body': "'Archivo', sans-serif",
        '--font-heading': "'Archivo Black', sans-serif",
        '--font-mono': "'Courier New', Courier, monospace",
        '--border-radius': '0px',
        '--radius-pill': '0px',
        '--neutral-gray': '#5a5648',
        '--jobs-menu-navy-dark': '#0a0a0a',
        '--jobs-menu-navy': '#0a0a0a',
        '--jobs-menu-slate': '#6b6552',
      },
      fonts: ['https://fonts.googleapis.com/css2?family=Archivo:wght@400;500;700&family=Archivo+Black&display=swap'],
      css: '/css/themes/brutalist.css',
    },
    'broadsheet': {
      id: 'broadsheet',
      label: 'Broadsheet',
      polarity: 'light',
      flags: { tilt: false, still: true },
      colors: { text:'#1c1710', bg:'#f5efe2', primary:'#a31621', secondary:'#ece3cf', accent:'#a31621' },
      tokens: {
        '--font-body': "'Lora', serif",
        '--font-heading': "'Playfair Display', serif",
        '--border-radius': '0px',
        '--radius-pill': '0px',
        '--neutral-gray': '#6f6757',
        '--jobs-menu-navy-dark': '#ece3cf',
        '--jobs-menu-navy': '#e2d7bc',
        '--jobs-menu-slate': '#6b6147',
      },
      fonts: ['https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400;0,500;0,600;1,400&family=Playfair+Display:ital,wght@0,500;0,700;0,900;1,500&display=swap'],
      css: '/css/themes/broadsheet.css',
    },
    'field-notes': {
      id: 'field-notes',
      label: 'Field Notes',
      polarity: 'light',
      // No flags. Tilt and motion stay on for this skin.
      colors: { text:'#33291a', bg:'#ece2cb', primary:'#3f6f4f', secondary:'#f7f0df', accent:'#b3502a' },
      tokens: {
        '--font-body': "'Spectral', serif",
        '--font-heading': "'Zilla Slab', serif",
        '--font-mono': "'IBM Plex Mono', monospace",
        '--border-radius': '6px',
        '--radius-pill': '4px',
        '--neutral-gray': '#6e6350',
        '--jobs-menu-navy-dark': '#e3d8bf',
        '--jobs-menu-navy': '#d8c9a6',
        '--jobs-menu-slate': '#6e6350',
      },
      fonts: ['https://fonts.googleapis.com/css2?family=Caveat:wght@600&family=IBM+Plex+Mono:wght@400;600&family=Spectral:ital,wght@0,400;0,600;1,400&family=Zilla+Slab:wght@500;600&display=swap'],
      css: '/css/themes/field-notes.css',
    },
    'blueprint': {
      id: 'blueprint',
      label: 'Blueprint',
      polarity: 'dark',
      flags: { tilt: false, still: true },
      colors: { text:'#e9f2fb', bg:'#0c3a62', primary:'#8fc1ee', secondary:'#0a2e4f', accent:'#ffd23f' },
      tokens: {
        '--font-body': "'Saira', sans-serif",
        '--font-heading': "'Saira Condensed', sans-serif",
        '--font-mono': "'IBM Plex Mono', monospace",
        '--border-radius': '0px',
        '--radius-pill': '0px',
        '--neutral-gray': '#90a9c3',
        '--jobs-menu-navy-dark': '#0a2e4f',
        '--jobs-menu-navy': '#11436f',
        '--jobs-menu-slate': '#7fa0c0',
      },
      fonts: ['https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;600&family=Saira:wght@400;500&family=Saira+Condensed:wght@500;700&display=swap'],
      css: '/css/themes/blueprint.css',
    },
  };
  var ORDER = ['default', 'studio', 'brutalist', 'broadsheet', 'field-notes', 'blueprint'];

  window.__THEME_REGISTRY = REGISTRY;
  window.__THEME_ORDER = ORDER;

  // Page scripts ask this before VanillaTilt.init; styles opt out via
  // flags.tilt. The default entry has no flags, so the default site keeps
  // tilting. Live switches are handled by js/theme-cycler.js, which
  // destroys running instances.
  window.__styleAllowsTilt = function () {
    var entry = REGISTRY[window.__ACTIVE_STYLE || 'default'];
    return !(entry && entry.flags && entry.flags.tilt === false);
  };

  var STYLE_KEY   = 'dawson-style';
  var STORAGE_KEY = 'dawson-theme-cycler';
  var STEPS = [5,10,15,20,25,30,35,40,45,50,55,60,65,70,75,80,85,90,95];
  var root = document.documentElement;

  var isReload = false;
  try {
    var nav = performance.getEntriesByType('navigation')[0];
    isReload = !!(nav && nav.type === 'reload');
  } catch (e) {}

  // ---- Resolve the active style -------------------------------------------
  // Session-only: the id survives page-to-page navigation, but any reload
  // returns to the default site. ?style=<id> applies a style and seeds the
  // session, so links are shareable (?style=default is the escape hatch).
  var styleId = 'default';
  if (THEME_CYCLER_ENABLED) {
    try {
      if (isReload) sessionStorage.removeItem(STYLE_KEY);
      var param = new URLSearchParams(window.location.search).get('style');
      if (param && REGISTRY[param]) {
        styleId = param;
        if (param === 'default') sessionStorage.removeItem(STYLE_KEY);
        else sessionStorage.setItem(STYLE_KEY, param);
      } else if (!isReload) {
        var stored = sessionStorage.getItem(STYLE_KEY);
        if (stored && REGISTRY[stored]) styleId = stored;
      }
    } catch (e) {}
  }
  var entry = REGISTRY[styleId] || REGISTRY['default'];
  window.__ACTIVE_STYLE = entry.id;

  // ---- Apply the style (the default applies nothing) ----------------------
  if (entry.id !== 'default') {
    root.setAttribute('data-style', entry.id);
    if (entry.flags && entry.flags.still) root.setAttribute('data-still', '');
    if (entry.flags && entry.flags.tilt === false) root.setAttribute('data-no-tilt', '');
    if (entry.tokens) {
      Object.keys(entry.tokens).forEach(function (k) {
        root.style.setProperty(k, entry.tokens[k]);
      });
    }
    // This is a blocking script in <head>, so links appended here also block
    // first paint. _base.css carries shared skin rules; load it before the
    // skin sheet so the skin wins specificity ties.
    (entry.fonts || []).concat(['/css/themes/_base.css'], entry.css ? [entry.css] : []).forEach(function (href) {
      var link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = href;
      link.setAttribute('data-style-asset', '1');
      document.head.appendChild(link);
    });
  }

  // ---- Colors + alpha ramps ------------------------------------------------
  // Base palette comes from the active style; a saved palette-toy session
  // (randomized within the style) overrides it. Reload clears the toy.
  var colors = entry.colors;
  if (THEME_CYCLER_ENABLED) {
    try {
      if (isReload) {
        sessionStorage.removeItem(STORAGE_KEY);
      } else {
        var raw = sessionStorage.getItem(STORAGE_KEY);
        if (raw) {
          var saved = JSON.parse(raw);
          if (saved && Array.isArray(saved.colors) && saved.colors.length === 5) {
            colors = { text:saved.colors[0], bg:saved.colors[1], primary:saved.colors[2], secondary:saved.colors[3], accent:saved.colors[4] };
          }
        }
      }
    } catch (e) {}
  }

  function hexToHsl(hex) {
    var m = hex.replace('#','');
    var r = parseInt(m.substring(0,2),16)/255;
    var g = parseInt(m.substring(2,4),16)/255;
    var b = parseInt(m.substring(4,6),16)/255;
    var max = Math.max(r,g,b), min = Math.min(r,g,b);
    var h = 0, s = 0, l = (max+min)/2;
    if (max !== min) {
      var d = max - min;
      s = l > 0.5 ? d/(2-max-min) : d/(max+min);
      switch (max) {
        case r: h = (g-b)/d + (g<b?6:0); break;
        case g: h = (b-r)/d + 2; break;
        case b: h = (r-g)/d + 4; break;
      }
      h *= 60;
    }
    return { h: h, s: s*100, l: l*100 };
  }

  Object.keys(colors).forEach(function (role) {
    var hex = colors[role];
    root.style.setProperty('--' + role, hex);
    var hsl = hexToHsl(hex);
    STEPS.forEach(function (a) {
      root.style.setProperty(
        '--' + role + a,
        'hsla(' + hsl.h.toFixed(0) + ',' + hsl.s.toFixed(0) + '%,' + hsl.l.toFixed(0) + '%,' + a + '%)'
      );
    });
  });
})();
