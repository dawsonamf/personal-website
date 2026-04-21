(function () {
  'use strict';

  const MOBILE_BREAKPOINT = 1100;
  const TYPING_DELAY = 75;
  const ANIMATION_DURATION = 500;
  const DELAY_ADJUSTMENT = 3;

  function persistAfterAnimation(el, finalStyles) {
    el.addEventListener('animationend', function handler(e) {
      if (e.target !== el) return;
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

    // Waits for the later (right) card to finish sliding: delay 3.34s + duration 1.5s.
    const aboutHeaderWrapper = document.querySelector('#about-header-wrapper');
    if (aboutHeaderWrapper) {
      aboutHeaderWrapper.style.animation = "fadein 0.8s ease-out";
      aboutHeaderWrapper.style.animationDelay = `${4.84 - DELAY_ADJUSTMENT}s`;
      aboutHeaderWrapper.style.animationFillMode = "forwards";
      persistAfterAnimation(aboutHeaderWrapper, { visibility: 'visible', opacity: '1' });
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
          { action: 'type', text: "Hi,\nI'm Dawson,\nweb developer." },
          { action: 'callback', fn: startAnimations },
          { action: 'pause', duration: 1500 },
          { action: 'delete', count: 14 },
          { action: 'type', text: "iOS developer." },
          { action: 'pause', duration: 1500 },
          { action: 'delete', count: 14 },
          { action: 'type', text: "ML engineer." },
          { action: 'pause', duration: 1500 },
          { action: 'delete', count: 12 },
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
        ],
        [
          { action: 'type', text: "Hey,\nI'm Dawson,\nbuilder." },
          { action: 'callback', fn: startAnimations },
          { action: 'pause', duration: 1500 },
          { action: 'delete', count: 8 },
          { action: 'type', text: "software engineer." },
        ],
        // [
        //   { action: 'type', text: "Hi,\nI'm Dawson,\nsoftware engineer." },
        //   { action: 'callback', fn: startAnimations },
        //   { action: 'pause', duration: 1000 },
        //   { action: 'delete', count: 18 },
        //   { action: 'type', text: "vibe coder." },
        //   { action: 'pause', duration: 1000 },
        //   { action: 'delete', count: 11 },
        //   { action: 'type', text: "software engineer." },
        // ],
      ],
      onNewlineCount: {
        count: 2,
        callback: fadeInSubText,
      },
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




  initJobsMenu();

  initFeaturedCarousel({ isSubpage: false });

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
