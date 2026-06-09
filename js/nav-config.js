(function () {
  'use strict';

  const isSubpage = window.location.pathname.indexOf('/blog') !== -1;
  const prefix = isSubpage ? '../' : '';

  window.NAV_CONFIG = {
    NAV_LINKS: [
      { label: 'About', href: prefix + (isSubpage ? 'index.html#about' : '#about') },
      { label: 'Experience', href: prefix + (isSubpage ? 'index.html#jobs-header-static' : '#jobs-header-static') },
      { label: 'Projects', href: prefix + (isSubpage ? 'index.html#project-header-static' : '#project-header-static') },
      { label: 'Blog', href: isSubpage ? './' : 'blog/', isBlogLink: true },
      { label: 'Contact', href: prefix + (isSubpage ? 'index.html#contact' : '#contact') },
      { label: 'Resume', href: prefix + 'resources/Resume.pdf', isResume: true },
    ],
    MOBILE_NAV_LINKS: [
      { href: 'mailto:dawsonamf@icloud.com', icon: 'bx bx-envelope', label: 'Email' },
      { label: 'Blog', href: isSubpage ? './' : 'blog/', isBlogLink: true },
      { label: 'Resume', href: prefix + 'resources/Resume.pdf', isResume: true },
    ],
    SCROLL_THRESHOLD: 300,
  };

  // Single source of truth for social links. Rendered into the hero sidebar
  // (#socials-list / #blog-socials-list) and the contact-section menus.
  // The anchors are icon-only, so `label` becomes the aria-label.
  const CALENDLY_URL = 'https://calendly.com/dawsonamf/30min?background_color=1d1d1d&text_color=e6f1ff&primary_color=61ffda';
  window.SOCIAL_LINKS = [
    { href: 'https://www.linkedin.com/in/dawsonamf7/', icon: 'fab fa-linkedin', label: 'LinkedIn' },
    { href: 'https://twitter.com/dawsonamf7', icon: 'fa-brands fa-x-twitter', label: 'X (Twitter)' },
    { href: 'https://www.facebook.com/messages/t/dawson.metzgerfleetwood', icon: 'fab fa-facebook-messenger', label: 'Messenger' },
    { href: 'mailto:dawsonamf@icloud.com', icon: 'bx bx-envelope', label: 'Email' },
    { href: 'https://www.dawsonamf.com/resources/contact.vcf', icon: 'fas fa-user-circle', label: 'Contact card' },
    { href: '#', icon: 'far fa-calendar-alt', label: 'Schedule a call', isCalendly: true },
  ];

  function buildSocialAnchor(item) {
    const cls = item.isCalendly ? 'socials-item calendly-link' : 'socials-item';
    const target = item.isCalendly ? '' : ' target="_blank" rel="noopener noreferrer"';
    return '<a href="' + item.href + '"' + target + ' class="' + cls + '" aria-label="' + item.label + '">' +
      '<i class="' + item.icon + '" aria-hidden="true"></i></a>';
  }

  function renderSocialMenus() {
    const links = window.SOCIAL_LINKS;

    // Hero sidebar (home and blog listing pages): spacers + bare anchors.
    const sidebarHTML =
      '<span class="socials-menu-spacer"></span><br>' +
      links.map(buildSocialAnchor).join('') +
      '<br><span class="socials-menu-spacer"></span>';
    ['socials-list', 'blog-socials-list'].forEach(function (id) {
      const el = document.getElementById(id);
      if (el) el.innerHTML = sidebarHTML;
    });

    // Contact section, desktop: list items separated by spacer items.
    const contactMenu = document.querySelector('.contact-menu .menu-list');
    if (contactMenu) {
      contactMenu.innerHTML = links
        .map(function (item) { return '<li>' + buildSocialAnchor(item) + '</li>'; })
        .join('<li><span class="socials-menu-spacer2"></span></li>');
    }

    // Contact section, mobile: plain list items.
    const contactMenuMobile = document.querySelector('.contact-menu-mobile .menu-list');
    if (contactMenuMobile) {
      contactMenuMobile.innerHTML = links
        .map(function (item) { return '<li>' + buildSocialAnchor(item) + '</li>'; })
        .join('');
    }
  }

  function buildNavItems(items) {
    return items.map(function (item, i) {
      const spacer = i < items.length - 1 ? '<li><span class="menu-spacer"></span></li>' : '';
      if (item.icon) {
        const aria = item.label ? ' aria-label="' + item.label + '"' : '';
        return '<li><a href="' + item.href + '" target="_blank" rel="noopener noreferrer" class="socials-item"' + aria + '><i class="' + item.icon + '" aria-hidden="true"></i></a></li>' + spacer;
      }
      const target = item.isResume ? ' target="_blank" rel="noopener noreferrer"' : '';
      let cls = 'menu-item';
      if (item.isResume) cls = 'menu-item resume-link';
      if (item.isBlogLink) cls = 'menu-item blog-page-link';
      return '<li><a class="' + cls + '" href="' + item.href + '"' + target + '>' + item.label + '</a></li>' + spacer;
    }).join('');
  }

  // Populate nav menus
  const desktopHTML = buildNavItems(window.NAV_CONFIG.NAV_LINKS);
  const mobileHTML = buildNavItems(window.NAV_CONFIG.MOBILE_NAV_LINKS);

  const desktopMenus = document.querySelectorAll('.moving-menu .menu-list, .static-menu .menu-list');
  for (let i = 0; i < desktopMenus.length; i++) {
    desktopMenus[i].innerHTML = desktopHTML;
  }
  const mobileMenu = document.querySelector('.static-menu-mobile .menu-list');
  if (mobileMenu) mobileMenu.innerHTML = mobileHTML;

  renderSocialMenus();

  // Calendly popup: one config, one handler, for every .calendly-link (the
  // social anchors rendered above plus the static "schedule a call" text link
  // in the home page's contact section).
  document.querySelectorAll('.calendly-link').forEach(function (link) {
    link.addEventListener('click', function (e) {
      e.preventDefault();
      Calendly.initPopupWidget({ url: CALENDLY_URL });
    });
  });

  // Scroll-based sticky header
  const menu = document.querySelector('.moving-menu');
  if (menu) {
    let lastScrollTop = 0;
    const threshold = window.NAV_CONFIG.SCROLL_THRESHOLD;
    window.addEventListener('scroll', function () {
      const currentScrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const isScrollingUp = currentScrollTop < lastScrollTop;
      const isPastThreshold = currentScrollTop > threshold;
      if (currentScrollTop < (threshold / 3)) {
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
})();
