(function () {
  'use strict';

  const events = window.__homeFixtureEvents = window.__homeFixtureEvents || [];
  window.__homeFixtureHeroCallbacks = 0;
  const rootClasses = document.documentElement.classList;
  const addClass = rootClasses.add.bind(rootClasses);
  rootClasses.add = function () {
    if (Array.from(arguments).includes('hero-extras-in')) {
      window.__homeFixtureHeroCallbacks += 1;
    }
    return addClass.apply(this, arguments);
  };
  window.__homeFixtureRailBefore = document.getElementById('blog-scroll-track')?.innerHTML;
  const originalGet = document.getElementById.bind(document);
  let jobsSeen = false;
  document.getElementById = function (id) {
    if (id === 'jobs-menu-list' && !jobsSeen) {
      jobsSeen = true;
      events.push({ name: 'jobs' });
    }
    return originalGet(id);
  };

  const aosInit = window.AOS.init.bind(window.AOS);
  window.AOS.init = function () {
    events.push({ name: 'aos' });
    return aosInit.apply(this, arguments);
  };

  const tiltInit = window.VanillaTilt.init.bind(window.VanillaTilt);
  window.VanillaTilt.init = function (elements, options) {
    const list = Array.from(elements || []);
    events.push({
      name: list.some((element) => element.classList.contains('blog-card')) ? 'rail-tilt' : 'general-tilt',
      count: list.length,
      options: options,
    });
    return tiltInit.apply(this, arguments);
  };

  const typing = window.startTypingSequence;
  window.startTypingSequence = function (config) {
    events.push({
      name: 'typing',
      typingDelay: config.typingDelay,
      deleteDelay: config.deleteDelay,
      callbackIndex: config.sequences.map((steps) => steps.findIndex((step) => step.action === 'callback')),
    });
    return typing(config);
  };

  const animate = window.jQuery.fn.animate;
  window.jQuery.fn.animate = function (properties, duration, easing) {
    events.push({ name: 'smooth-scroll', properties, duration, easing });
    return this;
  };
  window.__homeFixtureOriginalAnimate = animate;

  const ready = window.jQuery.fn.ready;
  let readyRegistrations = 0;
  window.jQuery.fn.ready = function (callback) {
    readyRegistrations += 1;
    events.push({ name: readyRegistrations === 1 ? 'smooth-register' : 'general-tilt-register' });
    return ready.call(this, callback);
  };

  const addDocumentListener = document.addEventListener.bind(document);
  let domReadyRegistered = false;
  document.addEventListener = function (type, listener, options) {
    if (type === 'DOMContentLoaded' && !domReadyRegistered) {
      domReadyRegistered = true;
      events.push({ name: 'rail-register' });
    }
    return addDocumentListener(type, listener, options);
  };
})();
