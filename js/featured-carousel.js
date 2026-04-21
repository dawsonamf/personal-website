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

  const FEATURED_STYLE = 'floating';

  function renderFeaturedCarousel(isSubpage) {
    const featuredProjects = window.FEATURED_PROJECTS || [];
    const section = document.getElementById('featured-carousel');
    const track = document.getElementById('featured-track');
    if (!section || !track || featuredProjects.length === 0) return;

    section.classList.add('fc-style-' + FEATURED_STYLE);

    track.innerHTML = featuredProjects.map(function (proj) {
      const techHTML = proj.tech.map(function (t) { return '<span class="pill">' + t + '</span>'; }).join('');
      const linkTarget = proj.external ? ' target="_blank" rel="noopener noreferrer"' : '';
      const imgSrc = isSubpage ? proj.image : proj.image.replace(/^\.\.\//, '');
      const url = proj.url ? (isSubpage ? proj.url : proj.url.replace(/^\.\.\//, '')) : '';
      const ctaHTML = proj.url && proj.ctaLabel
        ? '<a class="fc-card-cta" href="' + url + '"' + linkTarget + '>' + proj.ctaLabel + '</a>'
        : '';
      return '<div class="fc-card">' +
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
    const images = document.querySelectorAll('.fc-card-image');
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
    const track = document.getElementById('featured-track');
    const section = document.getElementById('featured-carousel');
    if (!track || !section) return;
    const fadeL = section.querySelector('.featured-carousel-fade-left');
    const fadeR = section.querySelector('.featured-carousel-fade-right');
    if (!fadeL || !fadeR) return;

    function update() {
      const sl = track.scrollLeft;
      const sw = track.scrollWidth;
      const cw = track.clientWidth;
      fadeL.style.opacity = sl <= 5 ? '0' : '1';
      fadeR.style.opacity = sl + cw >= sw - 5 ? '0' : '1';
    }

    track.addEventListener('scroll', update, { passive: true });
    update();
  }

  function setupCarouselDots() {
    const featuredProjects = window.FEATURED_PROJECTS || [];
    const track = document.getElementById('featured-track');
    const dotsContainer = document.getElementById('featured-dots');
    if (!track || !dotsContainer || featuredProjects.length === 0) return;

    dotsContainer.innerHTML = featuredProjects.map(function (_, i) {
      return '<button class="fc-dot' + (i === 0 ? ' active' : '') + '" data-index="' + i + '"></button>';
    }).join('');

    dotsContainer.addEventListener('click', function (e) {
      const dot = e.target.closest('.fc-dot');
      if (!dot) return;
      const cards = track.querySelectorAll('.fc-card');
      const idx = parseInt(dot.dataset.index, 10);
      if (cards[idx]) {
        cards[idx].scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
      }
    });

    function updateActiveDot() {
      const cards = track.querySelectorAll('.fc-card');
      const trackRect = track.getBoundingClientRect();
      const center = trackRect.left + trackRect.width / 2;
      let closest = 0;
      let minDist = Infinity;
      cards.forEach(function (card, i) {
        const cardRect = card.getBoundingClientRect();
        const cardCenter = cardRect.left + cardRect.width / 2;
        const dist = Math.abs(cardCenter - center);
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
    const isSubpage = opts && opts.isSubpage;
    renderFeaturedCarousel(isSubpage);
    initCarouselTilt();
    setupCarouselFades();
    setupCarouselDots();
  };
})();
