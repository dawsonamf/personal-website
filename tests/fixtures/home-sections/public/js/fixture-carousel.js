// S1-15 fixture boundary: S1-16 owns the carousel runtime. Preserve the call and its argument
// while leaving the fixture's already-rendered, approved project cards untouched.
window.initFeaturedCarousel = function initFeaturedCarousel(options) {
  window.__homeFixtureEvents = window.__homeFixtureEvents || [];
  window.__homeFixtureEvents.push({ name: 'carousel', options: options });
};
