/**
 * Canonical blog-listing behavior owner. DOM inputs: #masthead-sequences,
 * #blog-typing-text, the three intro paragraphs, canonical chrome, the static
 * #filter-bar/#blog-grid cards, and the build-rendered carousel. Dependencies:
 * AOS, VanillaTilt, startTypingSequence, animateThenPersist,
 * revealSectionHeader and initFeaturedCarousel.
 *
 * This synchronous end-of-body script starts typing and carousel behavior,
 * binds filter/resize listeners, initializes listing-card tilt when allowed,
 * and initializes AOS. Listeners and animation timers live for the document
 * lifetime; canonical pages have no SPA teardown.
 */
(function () {
  'use strict';

  var TYPING_DELAY = 75;
  var activeTags = new Set();

  function onBlogTypingComplete() {
    animateThenPersist(document.getElementById('blog-sub-text'), 'fadein 0.8s ease-out', '0.01s', { opacity: '1' });
    animateThenPersist(document.getElementById('blog-sub-text-2'), 'fadein 0.8s ease-out', '0.08s', { opacity: '1' });
    animateThenPersist(document.getElementById('blog-sub-text-3'), 'fadein 0.8s ease-out', '0.12s', { opacity: '1' });
    animateThenPersist(document.getElementById('blog-socials-list'), 'fadein 0.8s ease-out', '0.15s', { opacity: '1' });
    animateThenPersist(document.querySelector('.name-logo'), 'fadein 0.8s ease-out', '0.38s', { visibility: 'visible', opacity: '1' });
    animateThenPersist(document.querySelector('.static-menu'), 'fadein 0.8s ease-out', '0.76s', { visibility: 'visible', opacity: '1' });
    animateThenPersist(document.querySelector('.static-menu-mobile'), 'fadein 0.8s ease-out', '0.76s', { visibility: 'visible', opacity: '1' });

    var selectedWorks = document.getElementById('selected-works-header');
    if (selectedWorks) {
      animateThenPersist(selectedWorks.querySelector('.section-header'), 'slideInUp 0.8s ease-out', '0.25s', { opacity: '1', transform: 'translateY(0)' });
      animateThenPersist(selectedWorks.querySelector('.section-header-spacer'), 'fadein 0.8s ease-out', '0.25s', { opacity: '1' });
      setTimeout(function () { window.revealSectionHeader(selectedWorks); }, 250);
    }

    // The section ground stays put while only the carousel contents enter.
    var carousel = document.getElementById('featured-carousel');
    if (carousel) {
      animateThenPersist(carousel.querySelector('.featured-carousel-container'), 'slideInUp 0.8s ease-out', '0.25s', { opacity: '1', transform: 'translateY(0)' });
      animateThenPersist(carousel.querySelector('.featured-carousel-dots'), 'slideInUp 0.8s ease-out', '0.25s', { opacity: '1', transform: 'translateY(0)' });
    }
  }

  function mastheadSequences() {
    var island = document.getElementById('masthead-sequences');
    if (!island) return [];

    var sequences = JSON.parse(island.textContent || '[]');
    if (!Array.isArray(sequences)) return [];
    return sequences.map(function (sequence) {
      var steps = Array.isArray(sequence) ? sequence.slice() : [];
      var firstType = steps.findIndex(function (step) {
        return step && step.action === 'type';
      });
      if (firstType !== -1) {
        steps.splice(firstType + 1, 0, { action: 'callback', fn: onBlogTypingComplete });
      }
      return steps;
    });
  }

  function runListingTypingSequence() {
    var sequences = mastheadSequences();
    if (sequences.length === 0) return;
    startTypingSequence({
      elementId: 'blog-typing-text',
      typingDelay: TYPING_DELAY,
      deleteDelay: 40,
      sequences: sequences
    });
  }

  function applyFilters() {
    document.querySelectorAll('#blog-grid .blog-card-wrapper').forEach(function (wrapper) {
      if (activeTags.size === 0) {
        wrapper.classList.remove('filtered-out');
        return;
      }
      var tags = (wrapper.dataset.tags || '').split(',');
      var match = tags.some(function (tag) { return activeTags.has(tag); });
      wrapper.classList.toggle('filtered-out', !match);
    });
  }

  function initFilters() {
    var bar = document.getElementById('filter-bar');
    if (!bar) return;
    bar.addEventListener('click', function (event) {
      var pill = event.target.closest('.filter-pill');
      if (!pill || !bar.contains(pill)) return;
      var tag = pill.dataset.tag;
      if (activeTags.has(tag)) {
        activeTags.delete(tag);
        pill.classList.remove('active');
      } else {
        activeTags.add(tag);
        pill.classList.add('active');
      }
      applyFilters();
    });
  }

  function initCardTilt() {
    var grid = document.getElementById('blog-grid');
    if (!grid) return;
    if (!document.documentElement.hasAttribute('data-no-tilt')) {
      VanillaTilt.init(grid.querySelectorAll('.blog-card'), {
        max: 8,
        speed: 400,
        perspective: 1200,
        scale: 1.02,
        glare: false,
        gyroscope: false
      });
    }
  }

  runListingTypingSequence();
  initFeaturedCarousel({ isSubpage: true });
  initFilters();
  initCardTilt();
  window.addEventListener('resize', function () {
    AOS.refresh();
  });
  AOS.init({ offset: 50 });
})();
