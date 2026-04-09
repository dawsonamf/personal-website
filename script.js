(function () {
  'use strict';

  const MOBILE_BREAKPOINT = 1100;
  const TYPING_DELAY = 75;
  const ANIMATION_DURATION = 500;
  const SCROLL_THRESHOLD = 300;
  const DELAY_ADJUSTMENT = 3;
  const NAV_LINKS = [
    { label: 'About', href: '#about' },
    { label: 'Experience', href: '#jobs-header-static' },
    { label: 'Projects', href: '#project-header-static' },
    { label: 'Blog', href: 'blog/', isBlogLink: true },
    { label: 'Contact', href: '#contact' },
    { label: 'Resume', href: 'resources/Resume.pdf', isResume: true },
  ];

  const MOBILE_NAV_LINKS = [
    { href: 'https://www.linkedin.com/in/dawsonamf7/', icon: 'fab fa-linkedin' },
    { href: 'mailto:dawsonamf@icloud.com', icon: 'bx bx-envelope' },
    { label: 'Resume', href: 'resources/Resume.pdf', isResume: true },
  ];

  function buildNavItems(items) {
    return items.map((item, i) => {
      const spacer = i < items.length - 1
        ? '<li><span class="menu-spacer"></span></li>'
        : '';
      if (item.icon) {
        return `<li><a href="${item.href}" target="_blank" class="socials-item"><i class="${item.icon}"></i></a></li>${spacer}`;
      }
      const target = item.isResume ? ' target="_blank"' : '';
      let cls = 'menu-item';
      if (item.isResume) cls = 'menu-item resume-link';
      if (item.isBlogLink) cls = 'menu-item blog-page-link';
      return `<li><a class="${cls}" href="${item.href}"${target}>${item.label}</a></li>${spacer}`;
    }).join('');
  }

  function populateNavMenus() {
    const desktopHTML = buildNavItems(NAV_LINKS);
    const mobileHTML = buildNavItems(MOBILE_NAV_LINKS);

    for (const el of document.querySelectorAll('.moving-menu .menu-list, .static-menu .menu-list')) {
      el.innerHTML = desktopHTML;
    }
    const mobileMenu = document.querySelector('.static-menu-mobile .menu-list');
    if (mobileMenu) mobileMenu.innerHTML = mobileHTML;
  }

  function persistAfterAnimation(el, finalStyles) {
    el.addEventListener('animationend', function handler() {
      el.removeEventListener('animationend', handler);
      el.style.animation = 'none';
      Object.assign(el.style, finalStyles);
    });
  }

  function startAnimations() {
    const staticMenu = document.querySelector('.static-menu');
    const nameLogo = document.querySelector('.name-logo');
    const typingContainer = document.querySelector('#typing-container');
    const socialsList = document.querySelector('#socials-list');
    const staticMenuMobile = document.querySelector('.static-menu-mobile');

    if (staticMenu) {
      staticMenu.style.animation = "fadein 0.8s ease-out";
      staticMenu.style.animationDelay = `${3.76 - DELAY_ADJUSTMENT}s`;
      staticMenu.style.animationFillMode = "forwards";
      persistAfterAnimation(staticMenu, { visibility: 'visible', opacity: '1' });
    }

    if (nameLogo) {
      nameLogo.style.animation = "fadein 0.8s ease-out";
      nameLogo.style.animationDelay = `${3.38 - DELAY_ADJUSTMENT}s`;
      nameLogo.style.animationFillMode = "forwards";
      persistAfterAnimation(nameLogo, { visibility: 'visible', opacity: '1' });
    }

    if (typingContainer) {
      typingContainer.style.animation = "slidein 0.8s ease-out";
      typingContainer.style.animationDelay = `${3 - DELAY_ADJUSTMENT}s`;
      typingContainer.style.animationFillMode = "forwards";
      persistAfterAnimation(typingContainer, { transform: 'translateX(0)' });
    }

    if (socialsList) {
      socialsList.style.animation = "fadein 0.8s ease-out";
      socialsList.style.animationDelay = `${3.76 - DELAY_ADJUSTMENT}s`;
      socialsList.style.animationFillMode = "forwards";
      persistAfterAnimation(socialsList, { visibility: 'visible', opacity: '1' });
    }

    if (staticMenuMobile) {
      staticMenuMobile.style.animation = "fadein 0.8s ease-out";
      staticMenuMobile.style.animationDelay = `${3.76 - DELAY_ADJUSTMENT}s`;
      staticMenuMobile.style.animationFillMode = "forwards";
      persistAfterAnimation(staticMenuMobile, { visibility: 'visible', opacity: '1' });
    }

    const doubleViewLeftElements = document.querySelectorAll('.double-view-left');
    for (const elem of doubleViewLeftElements) {
      elem.style.animation = "slideInLeft 1.5s ease-out";
      elem.style.animationDelay = `${3.04 - DELAY_ADJUSTMENT}s`;
      elem.style.animationFillMode = "forwards";
      persistAfterAnimation(elem, { visibility: 'visible', transform: 'translateX(0)' });
    }

    const doubleViewRightElements = document.querySelectorAll('.double-view-right');
    for (const elem of doubleViewRightElements) {
      elem.style.animation = "slideInRight 1.5s ease-out";
      elem.style.animationDelay = `${3.34 - DELAY_ADJUSTMENT}s`;
      elem.style.animationFillMode = "forwards";
      persistAfterAnimation(elem, { visibility: 'visible', transform: 'translateX(0)' });
    }
  }


  function fadeInSubText() {
    const subText = document.querySelector('#sub-text');
    if (subText) {
      subText.style.animation = "fadein 0.8s ease-out";
      subText.style.animationDelay = "0.01s";
      subText.style.animationFillMode = "forwards";
      persistAfterAnimation(subText, { visibility: 'visible', opacity: '1' });
    }
  }

  function runHomeTypingSequence() {
    startTypingSequence({
      elementId: 'typing-text',
      typingDelay: TYPING_DELAY,
      deleteDelay: 40,
      sequences: [
        [
          { action: 'type', text: "Hi,\nI'm Dawson,\nfrontend" },
          { action: 'pause', duration: 200 },
          { action: 'delete', count: 8 },
          { action: 'type', text: "backend" },
          { action: 'pause', duration: 200 },
          { action: 'delete', count: 7 },
          { action: 'type', text: "software engineer." },
          { action: 'callback', fn: startAnimations },
        ],
        [
          { action: 'type', text: "Hi,\nI'm Dawson,\nsoftware engineer." },
          { action: 'callback', fn: startAnimations },
          { action: 'pause', duration: 1000 },
          { action: 'delete', count: 18 },
          { action: 'type', text: "agentic engineer." },
          { action: 'pause', duration: 1000 },
          { action: 'delete', count: 17 },
          { action: 'type', text: "software engineer." },
        ],
        [
          { action: 'type', text: "Hi,\nI'm Dawson,\nfull stack engineer." },
          { action: 'callback', fn: startAnimations },
          { action: 'pause', duration: 1000 },
          { action: 'delete', count: 20 },
          { action: 'type', text: "software engineer." },
        ],
        [
          { action: 'type', text: "Hey,\nI'm Dawson,\nsoftware engineer." },
          { action: 'callback', fn: startAnimations },
        ],
        [
          { action: 'type', text: "Hi,\nI'm Dawson,\nsoftware engineer." },
          { action: 'callback', fn: startAnimations },
        ]
      ],
      onNewlineCount: {
        count: 2,
        callback: fadeInSubText,
      },
    });
  }


  var FEATURED_STYLE = 'floating';

  function renderFeaturedCarousel() {
    const featuredProjects = window.FEATURED_PROJECTS || [];
    const section = document.getElementById('featured-carousel');
    const track = document.getElementById('featured-track');
    if (!section || !track || featuredProjects.length === 0) return;

    section.classList.add('fc-style-' + FEATURED_STYLE);

    track.innerHTML = featuredProjects.map(function (proj) {
      var techHTML = proj.tech.map(function (t) { return '<span class="pill">' + t + '</span>'; }).join('');
      var linkTarget = proj.external ? ' target="_blank" rel="noopener noreferrer"' : '';
      var imgSrc = proj.image.replace(/^\.\.\//, '');
      var ctaHTML = proj.url && proj.ctaLabel
        ? '<a class="fc-card-cta" href="' + proj.url.replace(/^\.\.\//, '') + '"' + linkTarget + '>' + proj.ctaLabel + '</a>'
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


  function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
  }

  function debounce(fn, delay) {
    let timeoutId;
    return (...args) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => fn(...args), delay);
    };
  }


  function cursorFollow() {
    const cursor = document.querySelector(".cursor-follow");
    const circle = document.querySelector(".circle-follow");

    if (!cursor || !circle) return;

    let mouseX = 0;
    let mouseY = 0;
    let circleX = 0;
    let circleY = 0;
    let cursorX = 0;
    let cursorY = 0;

    document.addEventListener("mousemove", function (event) {
      let adjustment = 8;
      const body = document.body.getBoundingClientRect();
      const mainBody = document.getElementById("main-body");
      if (!mainBody) return;

      const mainBodyRect = mainBody.getBoundingClientRect();
      let widthDifference = body.width - mainBodyRect.width;
      widthDifference = widthDifference / 2;
      adjustment = 8 - widthDifference;

      if (widthDifference <= 0) {
        adjustment = 8;
      }

      mouseX = event.clientX - body.left - window.scrollX + adjustment;
      mouseY = event.clientY - body.top - window.scrollY  + 8;
    });

    function animate() {
      circleX += (mouseX - circleX - circle.offsetWidth / 2) * 0.25;
      circleY += (mouseY - circleY - circle.offsetHeight / 2) * 0.25;

      cursorX += (mouseX - cursorX - cursor.offsetWidth / 2) * 0.6;
      cursorY += (mouseY - cursorY - cursor.offsetHeight / 2) * 0.6;

      cursor.style.left = cursorX + "px";
      cursor.style.top = cursorY + "px";

      circle.style.left = circleX + "px";
      circle.style.top = circleY + "px";

      requestAnimationFrame(animate);
    }
    animate();

    const hoverSelectors = '.menu-item, .socials-item, .text-link, .name-logo, .button-link, .job-menu-item, .blog-card, .fc-card-cta, .fc-dot';
    document.addEventListener('mouseover', (e) => {
      if (e.target.closest(hoverSelectors)) {
        cursor.classList.add('cursor-follow-clickable');
      }
    });
    document.addEventListener('mouseout', (e) => {
      if (e.target.closest(hoverSelectors)) {
        cursor.classList.remove('cursor-follow-clickable');
      }
    });

    document.addEventListener("DOMContentLoaded", function() {
      document.addEventListener("mousemove", function () {
        const cursorContainer = document.querySelector("#cursor-container");
        if (cursorContainer) {
          cursorContainer.style.opacity = "1";
        }
      }, { once: true });
    });
  }


  function setupHeaderMenu() {
    const menu = document.querySelector('.moving-menu');
    if (!menu) return;

    let lastScrollTop = 0;
    window.addEventListener('scroll', () => {
      const currentScrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const isScrollingUp = currentScrollTop < lastScrollTop;
      const isPastThreshold = currentScrollTop > SCROLL_THRESHOLD;

      if (currentScrollTop < (SCROLL_THRESHOLD / 3)) {
        menu.classList.add('menu-invisible');
      } else {
        menu.classList.remove('menu-invisible');
      }

      if (isScrollingUp && isPastThreshold) {
        menu.classList.add('menu-sticky');
      } else {
        menu.classList.remove('menu-sticky');
      }

      lastScrollTop = currentScrollTop;
    });
  }


  AOS.init();


  $(document).ready(function() {
    $('.menu-item').on('click', function(event) {
      if ($(this).is(".resume-link") || $(this).is(".blog-page-link")) {
        return;
      }
      event.preventDefault();
      const target = this.hash;
      let offset = 40;
      switch (target) {
        case "#project-header-static":
          offset = 60;
          break;
        case "#blog-header-static":
          offset = 60;
          break;
        case "#contact":
          offset = 80;
          break;
        default:
          offset = 40;
      }

      const distance = Math.abs($(target).offset().top - $(window).scrollTop());
      let timing = 100 * Math.log(distance);
      timing = Math.max(timing, 300);
      timing = Math.min(timing, 1000);

      $('html, body').animate(
        {
          scrollTop: $(target).offset().top - offset,
        },
        timing,
        'easeInOutQuad'
      );
    });
  });


  $(document).ready(function() {
    const cards = $('.card').get();
    VanillaTilt.init(cards, {
      max: 10,
      speed: 7500,
      perspective: 1250,
      scale: 1.02,
      glare: false,
      "max-glare": 0.3,
      gyroscope: true
    });
  });


  function initJobsMenu() {
    const jobsMenuList = document.getElementById("jobs-menu-list");
    const jobsHighlight = document.getElementById("highlight");
    if (!jobsMenuList || !jobsHighlight) return;

    let jobsSelectedItem = document.querySelector(".menu li.selected");
    let isAnimating = false;

    function isMobileLayout() {
      return window.innerWidth <= MOBILE_BREAKPOINT;
    }

    function moveHighlight(target, animate = true) {
      jobsHighlight.style.transition = animate
        ? "top 0.3s, height 0.3s, left 0.3s, width 0.3s, border-radius 0.3s"
        : "none";
      if (isMobileLayout()) {
        const scrollWrapper = document.querySelector('.menu-scroll-wrapper');
        const scrollLeft = scrollWrapper ? scrollWrapper.scrollLeft : 0;
        jobsHighlight.style.left = (target.offsetLeft - scrollLeft) + "px";
        jobsHighlight.style.width = target.offsetWidth + "px";
        jobsHighlight.style.top = (jobsMenuList.offsetTop + jobsMenuList.offsetHeight) + "px";
        jobsHighlight.style.height = "2px";
        jobsHighlight.style.borderRadius = "0";
      } else {
        jobsHighlight.style.top = target.offsetTop + "px";
        jobsHighlight.style.height = target.offsetHeight + "px";
        jobsHighlight.style.left = "-3px";
        jobsHighlight.style.width = "3px";
        jobsHighlight.style.borderRadius = "6px";
      }
    }

    window.addEventListener("resize", () => {
      if (jobsSelectedItem) moveHighlight(jobsSelectedItem, true);
    });
    window.addEventListener("load", () => {
      if (jobsSelectedItem) moveHighlight(jobsSelectedItem, true);
    });
    const scrollWrapper = document.querySelector('.menu-scroll-wrapper');
    if (scrollWrapper) {
      scrollWrapper.addEventListener("scroll", () => {
        if (jobsSelectedItem) moveHighlight(jobsSelectedItem, false);
      });
    }

    jobsMenuList.addEventListener("click", (e) => {
      if (e.target.tagName.toLowerCase() !== "li") return;
      if (isAnimating) return;
      if (!jobsSelectedItem) return;

      jobsSelectedItem.classList.remove("selected");
      e.target.classList.add("selected");
      jobsSelectedItem = e.target;
      moveHighlight(jobsSelectedItem, true);

      isAnimating = true;
      const newJobID = e.target.getAttribute("data-job");
      const currentlyShowing = document.querySelector(".job-content.showing");
      if (!currentlyShowing || currentlyShowing.id === newJobID) {
        isAnimating = false;
        return;
      }
      currentlyShowing.classList.add("job-out-right");
      setTimeout(() => {
        currentlyShowing.classList.remove("job-out-right", "showing");
        currentlyShowing.classList.add("hidden");
      }, ANIMATION_DURATION);
      const newJob = document.getElementById(newJobID);
      if (!newJob) {
        isAnimating = false;
        return;
      }
      setTimeout(() => {
        newJob.classList.remove("hidden");
        newJob.classList.add("job-in-right");
        setTimeout(() => {
          newJob.classList.remove("job-in-right");
          newJob.classList.add("showing");
          isAnimating = false;
        }, ANIMATION_DURATION);
      }, ANIMATION_DURATION);
    });
  }




  populateNavMenus();
  cursorFollow();
  setupHeaderMenu();
  initJobsMenu();

  renderFeaturedCarousel();
  initCarouselTilt();
  setupCarouselFades();
  setupCarouselDots();

  runHomeTypingSequence();


  const blogPosts = window.BLOG_POSTS || [];

  function renderBlogCards() {
    const track = document.getElementById('blog-scroll-track');
    if (!track) return;

    track.innerHTML = blogPosts.map(post => `
      <a class="blog-card" href="${post.url}"${post.external ? ' target="_blank" rel="noopener noreferrer"' : ''}>
        <h3 class="blog-card-title">${post.title}</h3>
        <p class="blog-card-date">${post.date}</p>
        <p class="blog-card-excerpt">${post.excerpt}</p>
      </a>
    `).join('');

    VanillaTilt.init(track.querySelectorAll('.blog-card'), {
      max: 8,
      speed: 400,
      perspective: 1200,
      scale: 1.02,
      glare: false,
      gyroscope: false
    });
  }

  function setupBlogScrollFade() {
    const track = document.getElementById('blog-scroll-track');
    const fadeLeft = document.querySelector('.blog-scroll-fade-left');
    const fadeRight = document.querySelector('.blog-scroll-fade-right');

    if (!track || !fadeLeft || !fadeRight) return;

    function updateFades() {
      const scrollLeft = track.scrollLeft;
      const scrollWidth = track.scrollWidth;
      const clientWidth = track.clientWidth;
      const atStart = scrollLeft <= 5;
      const atEnd = scrollLeft + clientWidth >= scrollWidth - 5;

      fadeLeft.style.opacity = atStart ? '0' : '1';
      fadeRight.style.opacity = atEnd ? '0' : '1';
    }

    track.addEventListener('scroll', updateFades);
    window.addEventListener('resize', updateFades);
    updateFades();
  }

  document.addEventListener('DOMContentLoaded', function() {
    renderBlogCards();
    setupBlogScrollFade();
  });

})();
