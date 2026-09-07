/**
 * Canonical navigation behavior owner. DOM inputs: .moving-menu and every .calendly-link;
 * dependency: the optional Calendly widget API. It initializes when its deferred script runs,
 * records hidden state on each owned node after binding and is safe if evaluated twice.
 * Listeners live for the document lifetime; canonical pages have no SPA teardown.
 */
(function () {
  'use strict';

  var CALENDLY_BASE = 'https://calendly.com/dawsonamf/30min';
  var SCROLL_THRESHOLD = 300;
  var CALENDLY_BOUND = '__dawsonNavCalendlyBound';
  var STICKY_BOUND = '__dawsonNavStickyBound';

  function color(name, fallback) {
    var value = (getComputedStyle(document.documentElement).getPropertyValue(name) || '')
      .trim().replace('#', '');
    return value || fallback;
  }

  function calendlyUrl() {
    return CALENDLY_BASE +
      '?background_color=' + color('--bg', '1d1d1d') +
      '&text_color=' + color('--text', 'e6f1ff') +
      '&primary_color=' + color('--primary', '61ffda');
  }

  document.querySelectorAll('.calendly-link').forEach(function (link) {
    if (link[CALENDLY_BOUND]) return;
    link[CALENDLY_BOUND] = true;
    link.addEventListener('click', function (event) {
      event.preventDefault();
      if (window.Calendly && typeof window.Calendly.initPopupWidget === 'function') {
        window.Calendly.initPopupWidget({ url: calendlyUrl() });
      }
    });
  });

  var menu = document.querySelector('.moving-menu');
  if (!menu || menu[STICKY_BOUND]) return;
  menu[STICKY_BOUND] = true;
  var lastScrollTop = 0;
  window.addEventListener('scroll', function () {
    var currentScrollTop = window.pageYOffset || document.documentElement.scrollTop;
    var isScrollingUp = currentScrollTop < lastScrollTop;
    var isPastThreshold = currentScrollTop > SCROLL_THRESHOLD;
    if (currentScrollTop < (SCROLL_THRESHOLD / 3)) menu.classList.add('menu-invisible');
    else menu.classList.remove('menu-invisible');
    if (isScrollingUp && isPastThreshold) menu.classList.add('menu-sticky');
    else menu.classList.remove('menu-sticky');
    lastScrollTop = currentScrollTop;
  });
})();
