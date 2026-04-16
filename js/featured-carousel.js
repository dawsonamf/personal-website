/**
 * Shared featured-carousel renderer, fades, dots, and tilt.
 *
 * Expects window.FEATURED_PROJECTS to be loaded (from blog-data.js).
 *
 * Call initFeaturedCarousel({ isSubpage: true/false }) after the DOM is ready.
 *   - isSubpage: false (default) — strips "../" from image/url paths (root pages)
 *   - isSubpage: true  — uses paths as-is (pages in subdirectories like blog/)
 */
(function () {
  'use strict';

  var FEATURED_STYLE = 'floating';

  function renderFeaturedCarousel(isSubpage) {
    var featuredProjects = window.FEATURED_PROJECTS || [];
    var section = document.getElementById('featured-carousel');
    var track = document.getElementById('featured-track');
    if (!section || !track || featuredProjects.length === 0) return;

    section.classList.add('fc-style-' + FEATURED_STYLE);

    track.innerHTML = featuredProjects.map(function (proj) {
      var techHTML = proj.tech.map(function (t) { return '<span class="pill">' + t + '</span>'; }).join('');
      var linkTarget = proj.external ? ' target="_blank" rel="noopener noreferrer"' : '';
      var imgSrc = isSubpage ? proj.image : proj.image.replace(/^\.\.\//, '');
      var url = proj.url ? (isSubpage ? proj.url : proj.url.replace(/^\.\.\//, '')) : '';
      var ctaHTML = proj.url && proj.ctaLabel
        ? '<a class="fc-card-cta" href="' + url + '"' + linkTarget + '>' + proj.ctaLabel + '</a>'
        : '';
      return '<div class="fc-card" style="--featured-accent: ' + proj.accentColor + '">' +
        '<div class="fc-card-image"><img src="' + imgSrc + '" alt="' + proj.title + '"></div>' +
        '<div class="fc-card-body">' +
          '<h3 class="fc-card-title">' + proj.title + '</h3>' +
          '<p class="fc-card-desc">' + proj.description + '</p>' +
          '<div class="fc-card-tech">' + techHTML + '</div>' +
          ctaHTML +
        '</div></div>';
    }).join('');
  }

  function initCarouselTilt() {
    if (FEATURED_STYLE === 'unified') return;
    var images = document.querySelectorAll('.fc-card-image');
    if (!images.length) return;
    VanillaTilt.init(Array.from(images), {
      max: 8,
      speed: 6000,
      perspective: 1200,
      scale: 1,
      glare: true,
      "max-glare": 0.15,
      gyroscope: true
    });
  }

  function setupCarouselFades() {
    var track = document.getElementById('featured-track');
    var section = document.getElementById('featured-carousel');
    if (!track || !section) return;
    var fadeL = section.querySelector('.featured-carousel-fade-left');
    var fadeR = section.querySelector('.featured-carousel-fade-right');
    if (!fadeL || !fadeR) return;

    function update() {
      var sl = track.scrollLeft;
      var sw = track.scrollWidth;
      var cw = track.clientWidth;
      fadeL.style.opacity = sl <= 5 ? '0' : '1';
      fadeR.style.opacity = sl + cw >= sw - 5 ? '0' : '1';
    }

    track.addEventListener('scroll', update, { passive: true });
    update();
  }

  function setupCarouselDots() {
    var featuredProjects = window.FEATURED_PROJECTS || [];
    var track = document.getElementById('featured-track');
    var dotsContainer = document.getElementById('featured-dots');
    if (!track || !dotsContainer || featuredProjects.length === 0) return;

    dotsContainer.innerHTML = featuredProjects.map(function (_, i) {
      return '<button class="fc-dot' + (i === 0 ? ' active' : '') + '" data-index="' + i + '"></button>';
    }).join('');

    dotsContainer.addEventListener('click', function (e) {
      var dot = e.target.closest('.fc-dot');
      if (!dot) return;
      var cards = track.querySelectorAll('.fc-card');
      var idx = parseInt(dot.dataset.index, 10);
      if (cards[idx]) {
        cards[idx].scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
      }
    });

    function updateActiveDot() {
      var cards = track.querySelectorAll('.fc-card');
      var trackRect = track.getBoundingClientRect();
      var center = trackRect.left + trackRect.width / 2;
      var closest = 0;
      var minDist = Infinity;
      cards.forEach(function (card, i) {
        var cardRect = card.getBoundingClientRect();
        var cardCenter = cardRect.left + cardRect.width / 2;
        var dist = Math.abs(cardCenter - center);
        if (dist < minDist) { minDist = dist; closest = i; }
      });
      dotsContainer.querySelectorAll('.fc-dot').forEach(function (d, i) {
        d.classList.toggle('active', i === closest);
      });
    }

    track.addEventListener('scroll', updateActiveDot, { passive: true });
    updateActiveDot();
  }

  window.initFeaturedCarousel = function (opts) {
    var isSubpage = opts && opts.isSubpage;
    renderFeaturedCarousel(isSubpage);
    initCarouselTilt();
    setupCarouselFades();
    setupCarouselDots();
  };
})();
