// Loaded synchronously before first paint so --text50, --bg50, etc.
// resolve on the first stylesheet read. Flip THEME_CYCLER_ENABLED to
// kill the cycler UI and its persisted overrides site-wide.
(function () {
  // Gate read by js/theme-cycler.js via window.__THEME_CYCLER_ENABLED.
  var THEME_CYCLER_ENABLED = true;
  window.__THEME_CYCLER_ENABLED = THEME_CYCLER_ENABLED;

  var DEFAULTS = { text:'#e6f1ff', bg:'#1d1d1d', primary:'#61ffda', secondary:'#2c2c2c', accent:'#61ffda' };
  var STEPS = [5,10,15,20,25,30,35,40,45,50,55,60,65,70,75,80,85,90,95];

  var colors = DEFAULTS;
  if (THEME_CYCLER_ENABLED) {
    try {
      var nav = performance.getEntriesByType('navigation')[0];
      var isReload = nav && nav.type === 'reload';
      if (isReload) {
        sessionStorage.removeItem('dawson-theme-cycler');
      } else {
        var raw = sessionStorage.getItem('dawson-theme-cycler');
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

  var root = document.documentElement;
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
