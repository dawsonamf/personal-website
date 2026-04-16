(function () {
  'use strict';

  var isSubpage = window.location.pathname.indexOf('/blog') !== -1;
  var prefix = isSubpage ? '../' : '';

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
      var spacer = i < items.length - 1 ? '<li><span class="menu-spacer"></span></li>' : '';
      if (item.icon) {
        return '<li><a href="' + item.href + '" target="_blank" class="socials-item"><i class="' + item.icon + '"></i></a></li>' + spacer;
      }
      var target = item.isResume ? ' target="_blank"' : '';
      var cls = 'menu-item';
      if (item.isResume) cls = 'menu-item resume-link';
      if (item.isBlogLink) cls = 'menu-item blog-page-link';
      return '<li><a class="' + cls + '" href="' + item.href + '"' + target + '>' + item.label + '</a></li>' + spacer;
    }).join('');
  }

  // Populate nav menus
  var desktopHTML = buildNavItems(window.NAV_CONFIG.NAV_LINKS);
  var mobileHTML = buildNavItems(window.NAV_CONFIG.MOBILE_NAV_LINKS);

  var desktopMenus = document.querySelectorAll('.moving-menu .menu-list, .static-menu .menu-list');
  for (var i = 0; i < desktopMenus.length; i++) {
    desktopMenus[i].innerHTML = desktopHTML;
  }
  var mobileMenu = document.querySelector('.static-menu-mobile .menu-list');
  if (mobileMenu) mobileMenu.innerHTML = mobileHTML;

  // Scroll-based sticky header
  var menu = document.querySelector('.moving-menu');
  if (menu) {
    var lastScrollTop = 0;
    var threshold = window.NAV_CONFIG.SCROLL_THRESHOLD;
    window.addEventListener('scroll', function () {
      var currentScrollTop = window.pageYOffset || document.documentElement.scrollTop;
      var isScrollingUp = currentScrollTop < lastScrollTop;
      var isPastThreshold = currentScrollTop > threshold;
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
