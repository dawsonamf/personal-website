/**
 * Canonical featured-carousel interaction owner: fades, existing dots, tilt,
 * click centering and the vertical wheel guard. FeaturedCarousel.astro owns all
 * markup; presentation.ts owns ticker data. Depends on VanillaTilt and an
 * already-rendered DOM.
 *
 * Existing page callers invoke initFeaturedCarousel() after DOM readiness. One
 * call installs document-lifetime click/scroll/wheel listeners and initializes
 * VanillaTilt; pages do not tear those listeners down because navigation reloads.
 */
(function () {
  'use strict';

  // Card style: 'floating' (image-card + text-on-bg) or 'unified' (image+text in one card).
  const FEATURED_STYLE = 'floating';

  function initCarouselTilt() {
    if (FEATURED_STYLE === 'unified') return;
    if (document.documentElement.hasAttribute('data-no-tilt')) return;
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
    const track = document.getElementById('featured-track');
    const dotsContainer = document.getElementById('featured-dots');
    if (!track || !dotsContainer) return;

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

  window.initFeaturedCarousel = function () {
    initCarouselTilt();
    setupCarouselFades();
    setupCarouselDots();
    setupVerticalWheelGuard();
  };
})();
