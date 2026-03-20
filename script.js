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
    { label: 'Blog', href: '#blog-header-static' },
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
      const cls = item.isResume ? 'menu-item resume-link' : 'menu-item';
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


  function createTypingAnimation(id) {
    const element = document.getElementById(id);
    if (!element) return;

    const text = element.getAttribute('data-text').replace(/&#10;/g, '\n');
    let charIndex = 0;
    let newlineCount = 0;

    const cursor = document.createElement('span');
    cursor.className = 'cursor';
    element.appendChild(cursor);

    function type() {
      return new Promise((resolve) => {
        function typeCharacter() {
          if (charIndex < text.length) {
            if (text.charAt(charIndex) === '\n') {
              element.insertBefore(document.createElement('br'), cursor);
              newlineCount++;
              if (newlineCount === 2) {
                const subText = document.querySelector('#sub-text');
                if (subText) {
                  subText.style.animation = "fadein 0.8s ease-out";
                  subText.style.animationDelay = `0.01s`;
                  subText.style.animationFillMode = "forwards";
                  persistAfterAnimation(subText, { visibility: 'visible', opacity: '1' });
                }
              }
            } else {
              element.insertBefore(document.createTextNode(text.charAt(charIndex)), cursor);
            }
            charIndex++;
            setTimeout(typeCharacter, TYPING_DELAY);
          } else {
            cursor.style.animation = "blink 1s infinite";
            resolve();
          }
        }

        typeCharacter();
      });
    }

    type().then(startAnimations);
  }


  function loadDynamicContent() {
    const contentDivs = document.querySelectorAll('#project-content > div');
    const menuItems = document.querySelectorAll('.project-menu-item');
    let isAnimating = false;

    menuItems.forEach(item => {
      item.addEventListener('click', () => {
        const currentShowing = document.querySelector('#project-content > div.showing');

        if (currentShowing && currentShowing.id === item.dataset.contentId) {
          return;
        }

        if (isAnimating) return;

        isAnimating = true;
        contentDivs.forEach(div => {
          const imageContainer = div.querySelector('.image-container');
          const projectInfo = div.querySelector('.project-info');

          if (!imageContainer || !projectInfo) return;

          if (div.id !== item.dataset.contentId) {
            if (div.classList.contains('showing')) {
              projectInfo.classList.add('out-right');
              imageContainer.classList.add('out-left');
              setTimeout(() => {
                projectInfo.classList.remove('out-right');
                imageContainer.classList.remove('out-left');
                div.classList.remove('showing');
                div.classList.add('hidden');
              }, ANIMATION_DURATION);
            } else {
              div.classList.add('hidden');
            }
          } else {
            setTimeout(() => {
              projectInfo.classList.add('in-right');
              imageContainer.classList.add('in-left');
              div.classList.remove('hidden');
              div.classList.add('showing');

              setTimeout(() => {
                projectInfo.classList.remove('in-right');
                imageContainer.classList.remove('in-left');
                isAnimating = false;
              }, ANIMATION_DURATION);
            }, ANIMATION_DURATION);
          }

          if (div.id === item.dataset.contentId) {
            const color1 = getComputedStyle(div).getPropertyValue('--project-color1');
            const color2 = getComputedStyle(div).getPropertyValue('--project-color2');
            const color3 = getComputedStyle(div).getPropertyValue('--project-color3');

            gsap.to("html", {"--project-color1": color1, duration: 1});
            gsap.to("html", {"--project-color2": color2, duration: 1});
            gsap.to("html", {"--project-color3": color3, duration: 1});
          }
        });
      });
    });
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

    const hoverSelectors = '.project-menu-item, .menu-item, .socials-item, .text-link, .name-logo, .button-link, .job-menu-item, .blog-card';
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
      if (!$(this).is(".resume-link")) {
        event.preventDefault();
      }
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


  function initProjectHighlight() {
    const menu = document.querySelector(".project-nav-container .project-menu");
    const highlight = document.getElementById("project-nav-highlight");
    const scrollWrap = document.querySelector(".project-nav-container .menu-scroll-wrapper");
    if (!menu || !highlight) return;

    let selectedItem = menu.querySelector("li.selected") || menu.querySelector("li");

    function moveProjectHighlight(animate = true) {
      highlight.style.transition = animate
        ? "top 0.3s, height 0.3s, left 0.3s, width 0.3s, border-radius 0.3s"
        : "none";

      if (window.innerWidth <= MOBILE_BREAKPOINT) {
        const scrollLeft = scrollWrap ? scrollWrap.scrollLeft : 0;
        highlight.style.left = (selectedItem.offsetLeft - scrollLeft) + "px";
        highlight.style.width = selectedItem.offsetWidth + "px";
        highlight.style.top = (menu.offsetTop + menu.offsetHeight) + "px";
        highlight.style.height = "2px";
        highlight.style.borderRadius = "0";
      } else {
        highlight.style.top = selectedItem.offsetTop + "px";
        highlight.style.height = selectedItem.offsetHeight + "px";
        highlight.style.left = (selectedItem.offsetLeft + selectedItem.offsetWidth) + "px";
        highlight.style.width = "3px";
        highlight.style.borderRadius = "6px";
      }
    }

    menu.addEventListener("click", (e) => {
      if (e.target.tagName.toLowerCase() === "li") {
        menu.querySelector("li.selected")?.classList.remove("selected");
        e.target.classList.add("selected");
        selectedItem = e.target;
        moveProjectHighlight(true);
      }
    });

    if (scrollWrap) {
      scrollWrap.addEventListener("scroll", () => {
        if (selectedItem) moveProjectHighlight(false);
      });
    }

    window.addEventListener("resize", () => moveProjectHighlight(true));
    window.addEventListener("load", () => moveProjectHighlight(true));
    moveProjectHighlight(true);
  }


  populateNavMenus();
  cursorFollow();
  loadDynamicContent();
  setupHeaderMenu();
  initJobsMenu();
  initProjectHighlight();

  const menuItems = document.querySelectorAll('.project-menu-item');
  if (menuItems.length > 0) {
    menuItems[0].click();
  }

  createTypingAnimation('typing-text');


  const blogPosts = [
    {
      title: "How Fast Are AI Agents Improving?",
      date: "February 2026",
      excerpt: "An analysis of METR-Horizon benchmark data showing AI agent capability doubling times, with interactive projections through 2033.",
      image: "resources/ML_Media.png",
      url: "blog/metr-doubling-post.html"
    },
    {
      title: "Autoencoders – Part 2",
      date: "April 2024",
      excerpt: "Using autoencoders in practice: outlier detection, variational autoencoders for data generation, denoising, and the CLIP model.",
      image: "resources/ML_Media.png",
      url: "https://www.aboutobjects.com/2024/04/01/autoencoders-part-2/",
      external: true
    },
    {
      title: "Autoencoders – Part 1",
      date: "January 2024",
      excerpt: "Building intuition for autoencoders: how they compress data into lower-dimensional representations and what makes them useful.",
      image: "resources/ML_Media.png",
      url: "https://www.aboutobjects.com/2024/01/05/autoencoders-part-1/",
      external: true
    }
  ];

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
