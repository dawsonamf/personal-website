/**
 * Shared animation helpers, used by public/js/script.js and public/js/blog-listing-client.js.
 *
 * persistAfterAnimation(el, finalStyles)
 *   When el's CSS animation ends, clears the animation and pins the given
 *   final styles so the element keeps its end state.
 *
 * animateThenPersist(el, animation, delay, finalStyles)
 *   Starts a CSS animation on el (with animation-fill-mode: forwards) and
 *   persists finalStyles once it completes. No-op if el is null.
 *
 * Loaded as a plain (non-defer) script so both deferred scripts and
 * end-of-body scripts can rely on it being defined.
 */

/**
 * Canonical owner and lifecycle: inputs are animation targets plus
 * .section-header-wrapper/data-header-intro DOM; dependencies are DOM,
 * requestAnimationFrame, matchMedia and optional IntersectionObserver. It initializes once
 * at DOM ready, exposes revealSectionHeader to page intro code, and installs document-lifetime
 * observer/scroll/resize/RAF work. There is no SPA teardown. A canonical document's theme is
 * fixed, so this port intentionally installs no data-style MutationObserver.
 */
function persistAfterAnimation(el, finalStyles) {
  el.addEventListener('animationend', function handler(e) {
    if (e.target !== el) return;
    el.removeEventListener('animationend', handler);
    el.style.animation = 'none';
    Object.assign(el.style, finalStyles);
  });
}

function animateThenPersist(el, animation, delay, finalStyles) {
  if (!el) return;
  el.style.animation = animation;
  el.style.animationDelay = delay;
  el.style.animationFillMode = 'forwards';
  persistAfterAnimation(el, finalStyles);
}


/* ---- Scroll-scrubbed section headers --------------------------------------
 *
 * Two things, both driven here and drawn by whichever skin wants them. The
 * JS is skin-agnostic: it only supplies numbers and a class, so skins that
 * style neither are completely unaffected.
 *
 *   --section-rule   0 -> 1 on the wrapper, scrubbed against scroll position.
 *                    0 when the header's top edge is at the bottom of the
 *                    viewport, 1 when its bottom edge reaches the middle —
 *                    so the rule finishes drawing while the header still
 *                    sits just above the halfway line, not at the top of the
 *                    screen. A skin draws it as scaleX() on a rule.
 *
 *   .section-header-in   added once the header is meaningfully on screen and
 *                    taken off again if it leaves back out the bottom, so
 *                    scrolling up runs the title's entrance in reverse and
 *                    coming back down sets it again. Leaving past the TOP
 *                    keeps the class: a header you have already read stays
 *                    read. The class goes on the wrapper and not on anything
 *                    painted, so a section that reverses out to a colour
 *                    keeps its ground from the first frame while the words
 *                    arrive.
 *
 * The rule is gated on the title. Scroll position alone would let the rule
 * finish drawing before the last letter had landed — a fast flick puts the
 * header past the halfway line inside a single frame, while the letters are
 * still running out their stagger — and the bar arriving first reads as the
 * wrong thing leading. So the value written is the LOWER of the scroll
 * progress and the title's own entrance progress, which pins the rule behind
 * the letters no matter how fast the page moves. Skins declare how long that
 * entrance takes in --header-in-ms on the wrapper; a skin that sets nothing
 * draws no entrance, so its rule follows scroll alone.
 *
 * The title text is wrapped in .section-header-text so there is something to
 * transform that is not the <h2> itself (the h2 also holds .sec-num, which
 * skins position independently). Skins listed in GLYPH_SKINS additionally
 * get one .section-header-glyph per character, each carrying its index in
 * --glyph-i and its distance from the end in --glyph-r, so a skin can
 * stagger the arrival left to right and the exit right to left off the same
 * markup. That split is opt-in because breaking a word into per-letter boxes
 * breaks the shaping run with it, and the lost kerning shows at display
 * sizes. The fixed per-document skin decides that split at initialization.
 *
 * Each run of non-space characters is grouped in a .section-header-word so a
 * header that is allowed to wrap still wraps at its spaces: per-letter boxes
 * are atomic inlines, and a line may otherwise break between any two of them
 * ("WHERE I'VE WORKE / D"). A glyph skin has to pin that wrapper against
 * internal breaks — see .section-header-word in css/themes/marquee.css.
 *
 * Wrappers marked data-header-intro are left to the page's own intro wave —
 * public/js/script.js and public/js/blog-listing-client.js call revealSectionHeader() on them
 * at the point in the sequence where their title is due. They join the
 * observer at that moment, so from then on they reverse like the rest.
 */
(function () {
  'use strict';

  var GLYPH_SKINS = { marquee: true };

  var REVEAL_MARGIN = '0px 0px -12% 0px';
  var EASE = 0.14;          // per-frame approach to the scrub target
  var SETTLED = 0.0015;     // close enough to stop the loop

  var headers = [];
  var frame = 0;
  var observer = null;

  function now() {
    return (window.performance && performance.now) ? performance.now() : +new Date();
  }

  function skin() {
    return document.documentElement.getAttribute('data-style') || '';
  }

  function entryFor(el) {
    for (var i = 0; i < headers.length; i++) {
      if (headers[i].el === el) return headers[i];
    }
    return null;
  }

  // Wrap the h2's own text (its element children — .sec-num — stay put) in
  // .section-header-text, optionally exploding it into glyph spans. The untouched title is stashed on the node the first time through so
  // any repeated initialization-side call reads the same source text.
  function split(h2, perGlyph) {
    if (h2.__headerText === undefined) {
      var own = '';
      for (var n = h2.firstChild; n; n = n.nextSibling) {
        if (n.nodeType === 3) own += n.textContent;
      }
      h2.__headerText = own.replace(/\s+/g, ' ').trim();
    }

    var text = h2.__headerText;
    if (!text) return;
    if (h2.__headerSplit === (perGlyph ? 'glyph' : 'whole')) return;
    h2.__headerSplit = perGlyph ? 'glyph' : 'whole';

    var existing = h2.querySelector('.section-header-text');
    if (existing) h2.removeChild(existing);

    var wrap = document.createElement('span');
    wrap.className = 'section-header-text';

    if (perGlyph) {
      var last = text.length - 1;
      var word = null;
      for (var i = 0; i < text.length; i++) {
        var ch = text.charAt(i);
        if (ch === ' ') {
          word = null;
          wrap.appendChild(document.createTextNode(' '));
          continue;
        }
        if (!word) {
          word = document.createElement('span');
          word.className = 'section-header-word';
          wrap.appendChild(word);
        }
        var g = document.createElement('span');
        g.className = 'section-header-glyph';
        g.style.setProperty('--glyph-i', String(i));
        g.style.setProperty('--glyph-r', String(last - i));
        g.textContent = ch;
        word.appendChild(g);
      }
    } else {
      wrap.textContent = text;
    }

    // Text nodes go; .sec-num and any other element child stay where the
    // markup put them, with the wrapped title taking the text's place.
    for (var c = h2.firstChild; c; ) {
      var next = c.nextSibling;
      if (c.nodeType === 3) h2.removeChild(c);
      c = next;
    }
    h2.appendChild(wrap);
  }

  // How long the skin's title entrance runs, start of the first glyph to end
  // of the last. Read off the wrapper so the number lives in the sheet next
  // to the animation it describes; 0 (or no declaration) means the skin
  // draws no entrance and the rule is free to follow scroll alone.
  function readInMs(el) {
    var v = parseFloat(getComputedStyle(el).getPropertyValue('--header-in-ms'));
    return v > 0 ? v : 0;
  }

  function reveal(h) {
    if (h.shown) return;
    h.shown = true;
    h.el.classList.add('section-header-in');
    h.inMs = readInMs(h.el);
    h.revealAt = now();
    schedule();
  }

  function unreveal(h) {
    if (!h.shown) return;
    h.shown = false;
    h.el.classList.remove('section-header-in');
    h.revealAt = 0;
    schedule();
  }

  // 0 before the title starts arriving, 1 once the last glyph has landed.
  function titleProgress(h) {
    if (!h.shown) return 0;
    if (!h.inMs) return 1;
    var p = (now() - h.revealAt) / h.inMs;
    return p < 0 ? 0 : (p > 1 ? 1 : p);
  }

  function measure() {
    var vh = window.innerHeight || document.documentElement.clientHeight;
    for (var i = 0; i < headers.length; i++) {
      var h = headers[i];
      var box = h.el.getBoundingClientRect();
      // Travel from "top edge at viewport bottom" to "bottom edge at viewport
      // middle" — vh/2 + the header's own height of scrolling.
      var travel = vh / 2 + box.height;
      var p = travel > 0 ? (vh - box.top) / travel : 1;
      p = p < 0 ? 0 : (p > 1 ? 1 : p);
      // The letters lead, always: whichever of the two is further behind
      // is the one the rule follows.
      var t = titleProgress(h);
      h.target = p < t ? p : t;
      // The title's own clock keeps the loop alive even when the page is
      // still, or the rule would stop at whatever the first frame after the
      // reveal happened to catch.
      h.pending = h.shown && t < 1;
    }
  }

  function tick() {
    frame = 0;
    measure();

    var running = false;
    for (var i = 0; i < headers.length; i++) {
      var h = headers[i];
      h.value += (h.target - h.value) * EASE;
      if (Math.abs(h.target - h.value) < SETTLED) {
        h.value = h.target;
      } else {
        running = true;
      }
      if (h.pending) running = true;
      h.el.style.setProperty('--section-rule', h.value.toFixed(4));
    }

    if (running) frame = requestAnimationFrame(tick);
  }

  function schedule() {
    if (!frame) frame = requestAnimationFrame(tick);
  }

  // Called by the page intro waves for the headers they own. The wrapper
  // joins the observer here rather than at init, so the intro gets to place
  // the title first and every scroll after that is handled the normal way.
  function revealSectionHeader(el) {
    var h = entryFor(el);
    if (!h) {
      if (el) el.classList.add('section-header-in');
      return;
    }
    reveal(h);
    if (observer && !h.observed) {
      h.observed = true;
      observer.observe(h.el);
    }
  }

  function resplit() {
    var perGlyph = !!GLYPH_SKINS[skin()];
    for (var i = 0; i < headers.length; i++) {
      split(headers[i].h2, perGlyph);
      // The fixed document skin supplies the entrance length used by headers
      // that are already showing when initialization measures them.
      if (headers[i].shown) headers[i].inMs = readInMs(headers[i].el);
    }
    schedule();
  }

  function init() {
    var wrappers = document.querySelectorAll('.section-header-wrapper');
    if (!wrappers.length) return;

    for (var i = 0; i < wrappers.length; i++) {
      var el = wrappers[i];
      var h2 = el.querySelector('.section-header');
      if (!h2) continue;
      headers.push({
        el: el, h2: h2, value: 0, target: 0,
        shown: false, observed: false, pending: false, revealAt: 0, inMs: 0,
      });
      el.style.setProperty('--section-rule', '0');
    }
    if (!headers.length) return;

    resplit();

    var reduced = window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (reduced || !window.IntersectionObserver) {
      for (var r = 0; r < headers.length; r++) {
        headers[r].shown = true;
        headers[r].el.classList.add('section-header-in');
        headers[r].value = headers[r].target = 1;
        headers[r].el.style.setProperty('--section-rule', '1');
      }
      return;
    }

    observer = new IntersectionObserver(function (entries) {
      for (var e = 0; e < entries.length; e++) {
        var entry = entries[e];
        var h = entryFor(entry.target);
        if (!h) continue;
        if (entry.isIntersecting) {
          reveal(h);
        } else if (entry.boundingClientRect.top > 0) {
          // Gone back out the bottom: the reader is scrolling up, so the
          // title unsets and will run its entrance again on the way down.
          // (A header that left past the top has top < 0 and is left alone.)
          unreveal(h);
        }
      }
    }, { rootMargin: REVEAL_MARGIN, threshold: 0.1 });

    for (var o = 0; o < headers.length; o++) {
      // The page's intro wave owns these; it calls revealSectionHeader when
      // the title is due in its sequence, and the wrapper is observed from
      // then on.
      if (headers[o].el.hasAttribute('data-header-intro')) continue;
      headers[o].observed = true;
      observer.observe(headers[o].el);
    }

    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    schedule();
  }

  window.revealSectionHeader = revealSectionHeader;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
