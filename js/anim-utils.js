/**
 * Shared animation helpers, used by js/script.js and blog/blog-listing.js.
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
