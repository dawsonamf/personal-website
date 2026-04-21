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
      { href: 'mailto:dawsonamf@icloud.com', icon: 'bx bx-envelope' },
      { label: 'Blog', href: isSubpage ? './' : 'blog/', isBlogLink: true },
      { label: 'Resume', href: prefix + 'resources/Resume.pdf', isResume: true },
    ],
    SCROLL_THRESHOLD: 300,
  };

  function buildNavItems(items) {
    return items.map(function (item, i) {
      const spacer = i < items.length - 1 ? '<li><span class="menu-spacer"></span></li>' : '';
      if (item.icon) {
        return '<li><a href="' + item.href + '" target="_blank" class="socials-item"><i class="' + item.icon + '"></i></a></li>' + spacer;
      }
      const target = item.isResume ? ' target="_blank"' : '';
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
