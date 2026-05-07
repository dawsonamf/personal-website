/**
 * Shared featured-carousel renderer, fades, dots, tilt, expand treatment,
 * and wheel guard.
 *
 * Expects window.FEATURED_PROJECTS to be loaded (from blog-data.js).
 *
 * Call initFeaturedCarousel({ isSubpage: true/false }) after the DOM is ready.
 *   - isSubpage: false (default): strips "../" from image/url paths (root pages)
 *   - isSubpage: true: uses paths as-is (pages in subdirectories like blog/)
 */
(function () {
  'use strict';

  // Card style: 'floating' (image-card + text-on-bg) or 'unified' (image+text in one card).
  const FEATURED_STYLE = 'floating';
  // Wrapper treatment: when true, the home-page carousel gets the scroll-driven expand visual.
  const EXPAND_VISUAL = false;

  function getCssVar(name) {
    return getComputedStyle(document.documentElement)
      .getPropertyValue(name)
      .trim();
  }

  function parseHexColor(hex) {
    const normalized = hex.replace('#', '').trim();
    if (normalized.length !== 6) return null;
    return {
      r: parseInt(normalized.substring(0, 2), 16),
      g: parseInt(normalized.substring(2, 4), 16),
      b: parseInt(normalized.substring(4, 6), 16)
    };
  }

  function mixColor(from, to, progress) {
    return {
      r: Math.round(from.r + (to.r - from.r) * progress),
      g: Math.round(from.g + (to.g - from.g) * progress),
      b: Math.round(from.b + (to.b - from.b) * progress)
    };
  }

  function colorToRgb(color) {
    return 'rgb(' + color.r + ', ' + color.g + ', ' + color.b + ')';
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function lerp(from, to, progress) {
    return from + (to - from) * progress;
  }

  function smoothstep(progress) {
    return progress * progress * (3 - 2 * progress);
  }

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

  function applyExpandVisualShell() {
    const section = document.getElementById('featured-carousel');
    if (!section) return null;

    const existing = document.getElementById('fc-expand-visual');
    if (existing) return existing;

    const shell = document.createElement('div');
    shell.className = 'fc-expand-visual';
    shell.id = 'fc-expand-visual';

    const backdrop = document.createElement('div');
    backdrop.className = 'fc-expand-backdrop';

    const heading = document.createElement('div');
    heading.className = 'fc-expand-heading';
    heading.innerHTML =
      '<h2 class="fc-expand-title">Selected Works</h2>' +
      '<p class="fc-expand-subtitle">A few projects I\'m proud of</p>';

    section.parentNode.insertBefore(shell, section);
    shell.appendChild(backdrop);
    shell.appendChild(heading);
    shell.appendChild(section);

    return shell;
  }

  function setupExpandVisual() {
    const shell = applyExpandVisualShell();
    if (!shell) return;

    const backdrop = shell.querySelector('.fc-expand-backdrop');
    const heading = shell.querySelector('.fc-expand-heading');
    if (!backdrop || !heading) return;

    const bg = parseHexColor(getCssVar('--bg') || '#1d1d1d') || { r: 29, g: 29, b: 29 };
    const text = parseHexColor(getCssVar('--text') || '#e6f1ff') || { r: 230, g: 241, b: 255 };
    // Match the static --text10 backdrop (text at 10% over bg) as the scroll-start color.
    const startColor = mixColor(bg, text, 0.10);
    const endColor = bg;
    const baseRadius = parseFloat(getCssVar('--border-radius')) || 20;
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let ticking = false;

    function renderProgress(progress) {
      const eased = smoothstep(progress);
      const headerProgress = smoothstep(clamp((progress - 0.45) / 0.45, 0, 1));
      const startInset = window.innerWidth <= 1100 ? 10 : 24;
      const inset = lerp(startInset, 0, eased);
      const radius = lerp(baseRadius, 0, eased);
      const scaleY = lerp(0.92, 1, eased);
      const liveColor = colorToRgb(mixColor(startColor, endColor, eased));

      backdrop.style.left = inset + 'px';
      backdrop.style.right = inset + 'px';
      backdrop.style.borderRadius = radius + 'px';
      backdrop.style.transform = 'scaleY(' + scaleY + ')';
      backdrop.style.backgroundColor = liveColor;
      shell.style.setProperty('--fc-expand-bg', liveColor);

      heading.style.opacity = headerProgress;
      heading.style.transform = 'translateY(' + lerp(18, 0, headerProgress) + 'px)';
    }

    function update() {
      ticking = false;
      const rect = shell.getBoundingClientRect();
      const start = window.innerHeight * 0.82;
      const end = window.innerHeight * 0.34;
      const progress = clamp((start - rect.top) / (start - end), 0, 1);
      renderProgress(progress);
    }

    function requestUpdate() {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(update);
    }

    if (reduceMotion) {
      renderProgress(1);
      return;
    }

    window.addEventListener('scroll', requestUpdate, { passive: true });
    window.addEventListener('resize', requestUpdate);
    requestUpdate();
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

  function clampScrollLeft(track, left) {
    const max = Math.max(0, track.scrollWidth - track.clientWidth);
    return Math.max(0, Math.min(max, left));
  }

  function getCenteredScrollLeft(track, card) {
    const trackRect = track.getBoundingClientRect();
    const cardRect = card.getBoundingClientRect();
    const left = track.scrollLeft +
      (cardRect.left - trackRect.left) +
      (cardRect.width / 2) -
      (track.clientWidth / 2);
    return clampScrollLeft(track, left);
  }

  function getClosestCardIndex(track) {
    const cards = Array.from(track.querySelectorAll('.fc-card'));
    const trackRect = track.getBoundingClientRect();
    const center = trackRect.left + trackRect.width / 2;
    let closest = 0;
    let minDist = Infinity;

    cards.forEach(function (card, i) {
      const cardRect = card.getBoundingClientRect();
      const cardCenter = cardRect.left + cardRect.width / 2;
      const dist = Math.abs(cardCenter - center);
      if (dist < minDist) {
        minDist = dist;
        closest = i;
      }
    });

    return closest;
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

    function setActiveDot(idx) {
      dotsContainer.querySelectorAll('.fc-dot').forEach(function (d, i) {
        d.classList.toggle('active', i === idx);
      });
    }

    dotsContainer.addEventListener('click', function (e) {
      const dot = e.target.closest('.fc-dot');
      if (!dot) return;
      const cards = track.querySelectorAll('.fc-card');
      const idx = parseInt(dot.dataset.index, 10);
      if (!cards[idx]) return;

      setActiveDot(idx);
      track.scrollTo({
        left: getCenteredScrollLeft(track, cards[idx]),
        behavior: 'smooth'
      });
    });

    function updateActiveDot() {
      setActiveDot(getClosestCardIndex(track));
    }

    track.addEventListener('scroll', updateActiveDot, { passive: true });
    updateActiveDot();
  }

  function setupVerticalWheelGuard() {
    const track = document.getElementById('featured-track');
    if (!track) return;

    const VERTICAL_RATIO = 1.15;
    const HORIZONTAL_RATIO = 1.25;
    const GESTURE_END_MS = 140;

    let gestureAxis = null;
    let gestureTimer = null;
    let restoreFrame = null;
    let lockedLeft = 0;

    function lockCurrentCard() {
      const cards = track.querySelectorAll('.fc-card');
      const idx = getClosestCardIndex(track);
      lockedLeft = cards[idx] ? getCenteredScrollLeft(track, cards[idx]) : track.scrollLeft;
      track.classList.add('is-vertical-wheeling');
    }

    function restoreLockedLeft() {
      restoreFrame = null;
      track.scrollLeft = lockedLeft;
    }

    function scheduleRestore() {
      if (restoreFrame !== null) return;
      restoreFrame = requestAnimationFrame(restoreLockedLeft);
    }

    function endGesture() {
      const endingAxis = gestureAxis;
      gestureAxis = null;
      gestureTimer = null;
      if (endingAxis === 'vertical') {
        track.classList.remove('is-vertical-wheeling');
      }
    }

    track.addEventListener('wheel', function (e) {
      const ax = Math.abs(e.deltaX);
      const ay = Math.abs(e.deltaY);

      if (!gestureAxis) {
        if (ay >= ax * VERTICAL_RATIO) {
          gestureAxis = 'vertical';
          lockCurrentCard();
        } else if (ax >= ay * HORIZONTAL_RATIO) {
          gestureAxis = 'horizontal';
        } else {
          return;
        }
      }

      if (gestureTimer) clearTimeout(gestureTimer);
      gestureTimer = setTimeout(endGesture, GESTURE_END_MS);

      if (gestureAxis === 'vertical') {
        scheduleRestore();
      }
    }, { passive: true });
  }

  window.initFeaturedCarousel = function (opts) {
    const isSubpage = opts && opts.isSubpage;
    renderFeaturedCarousel(isSubpage);
    if (EXPAND_VISUAL && !isSubpage) setupExpandVisual();
    initCarouselTilt();
    setupCarouselFades();
    setupCarouselDots();
    setupVerticalWheelGuard();
  };
})();
