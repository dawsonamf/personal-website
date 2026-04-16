(function () {
  'use strict';

  const TYPING_DELAY = 75;

  // Typing animation
  function onBlogTypingComplete() {
    const subText = document.getElementById('blog-sub-text');
    if (subText) {
      subText.style.animation = 'fadein 0.8s ease-out';
      subText.style.animationDelay = '0.01s';
      subText.style.animationFillMode = 'forwards';
      subText.addEventListener('animationend', function handler() {
        subText.removeEventListener('animationend', handler);
        subText.style.animation = 'none';
        subText.style.opacity = '1';
      });
    }

    const subText2 = document.getElementById('blog-sub-text-2');
    if (subText2) {
      subText2.style.animation = 'fadein 0.8s ease-out';
      subText2.style.animationDelay = '0.08s';
      subText2.style.animationFillMode = 'forwards';
      subText2.addEventListener('animationend', function handler() {
        subText2.removeEventListener('animationend', handler);
        subText2.style.animation = 'none';
        subText2.style.opacity = '1';
      });
    }

    const subText3 = document.getElementById('blog-sub-text-3');
    if (subText3) {
      subText3.style.animation = 'fadein 0.8s ease-out';
      subText3.style.animationDelay = '0.12s';
      subText3.style.animationFillMode = 'forwards';
      subText3.addEventListener('animationend', function handler() {
        subText3.removeEventListener('animationend', handler);
        subText3.style.animation = 'none';
        subText3.style.opacity = '1';
      });
    }

    const socialsList = document.getElementById('blog-socials-list');
    if (socialsList) {
      socialsList.style.animation = 'fadein 0.8s ease-out';
      socialsList.style.animationDelay = '0.15s';
      socialsList.style.animationFillMode = 'forwards';
      socialsList.addEventListener('animationend', function handler() {
        socialsList.removeEventListener('animationend', handler);
        socialsList.style.animation = 'none';
        socialsList.style.opacity = '1';
      });
    }

    const nameLogo = document.querySelector('.name-logo');
    if (nameLogo) {
      nameLogo.style.animation = 'fadein 0.8s ease-out';
      nameLogo.style.animationDelay = '0.38s';
      nameLogo.style.animationFillMode = 'forwards';
      nameLogo.addEventListener('animationend', function handler() {
        nameLogo.removeEventListener('animationend', handler);
        nameLogo.style.animation = 'none';
        nameLogo.style.visibility = 'visible';
        nameLogo.style.opacity = '1';
      });
    }

    const staticMenu = document.querySelector('.static-menu');
    if (staticMenu) {
      staticMenu.style.animation = 'fadein 0.8s ease-out';
      staticMenu.style.animationDelay = '0.76s';
      staticMenu.style.animationFillMode = 'forwards';
      staticMenu.addEventListener('animationend', function handler() {
        staticMenu.removeEventListener('animationend', handler);
        staticMenu.style.animation = 'none';
        staticMenu.style.visibility = 'visible';
        staticMenu.style.opacity = '1';
      });
    }

    const staticMenuMobile = document.querySelector('.static-menu-mobile');
    if (staticMenuMobile) {
      staticMenuMobile.style.animation = 'fadein 0.8s ease-out';
      staticMenuMobile.style.animationDelay = '0.76s';
      staticMenuMobile.style.animationFillMode = 'forwards';
      staticMenuMobile.addEventListener('animationend', function handler() {
        staticMenuMobile.removeEventListener('animationend', handler);
        staticMenuMobile.style.animation = 'none';
        staticMenuMobile.style.visibility = 'visible';
        staticMenuMobile.style.opacity = '1';
      });
    }

    const selectedWorksHeader = document.getElementById('selected-works-header');
    const featuredCarousel = document.getElementById('featured-carousel');
    [selectedWorksHeader, featuredCarousel].forEach(function (el) {
      if (!el) return;
      el.style.animation = 'slideInUp 0.8s ease-out';
      el.style.animationDelay = '0.25s';
      el.style.animationFillMode = 'forwards';
      el.addEventListener('animationend', function handler() {
        el.removeEventListener('animationend', handler);
        el.style.animation = 'none';
        el.style.opacity = '1';
        el.style.transform = 'translateY(0)';
      });
    });
  }

  startTypingSequence({
    elementId: 'blog-typing-text',
    typingDelay: TYPING_DELAY,
    deleteDelay: 40,
    sequences: [
      [
        { action: 'type', text: "Cool things I've built." },
        { action: 'callback', fn: onBlogTypingComplete },
        { action: 'pause', duration: 800 },
        { action: 'delete', count: 23 },
        { action: 'type', text: 'Blog.' },
      ],
      [
        { action: 'type', text: "Things I find interesting." },
        { action: 'callback', fn: onBlogTypingComplete },
        { action: 'pause', duration: 800 },
        { action: 'delete', count: 26 },
        { action: 'type', text: 'Blog.' },
      ],
      [
        { action: 'type', text: "Late night rabbit holes." },
        { action: 'callback', fn: onBlogTypingComplete },
        { action: 'pause', duration: 800 },
        { action: 'delete', count: 24 },
        { action: 'type', text: 'Blog.' },
      ],
      [
        { action: 'type', text: "Rabbit holes." },
        { action: 'callback', fn: onBlogTypingComplete },
        { action: 'pause', duration: 800 },
        { action: 'delete', count: 13 },
        { action: 'type', text: 'Blog.' },
      ],
      [
        { action: 'type', text: "Things I've built." },
        { action: 'callback', fn: onBlogTypingComplete },
        { action: 'pause', duration: 800 },
        { action: 'delete', count: 18 },
        { action: 'type', text: 'Blog.' },
      ],
      [
        { action: 'type', text: "Random projects." },
        { action: 'callback', fn: onBlogTypingComplete },
        { action: 'pause', duration: 800 },
        { action: 'delete', count: 16 },
        { action: 'type', text: 'Blog.' },
      ],
    ],
  });


  // Data
  const posts = window.BLOG_POSTS || [];
  const allTags = [...new Set(posts.flatMap(p => p.tags || []))].sort();
  const activeTags = new Set();


  // Render filter pills
  function renderFilterBar() {
    const bar = document.getElementById('filter-bar');
    if (!bar) return;
    bar.innerHTML = allTags.map(tag =>
      `<button class="filter-pill" data-tag="${tag}">${tag}</button>`
    ).join('');

    bar.addEventListener('click', function (e) {
      const pill = e.target.closest('.filter-pill');
      if (!pill) return;
      const tag = pill.dataset.tag;
      if (activeTags.has(tag)) {
        activeTags.delete(tag);
        pill.classList.remove('active');
      } else {
        activeTags.add(tag);
        pill.classList.add('active');
      }
      applyFilters();
    });
  }


  // Render cards
  function renderCards() {
    const grid = document.getElementById('blog-grid');
    if (!grid) return;

    grid.innerHTML = posts.map(function (post, i) {
      const tagsHTML = (post.tags || []).map(t => `<span class="pill">${t}</span>`).join('');
      const target = post.external ? ' target="_blank" rel="noopener noreferrer"' : '';
      const url = post.external ? post.url : (post.url.startsWith('blog/') ? post.url.replace('blog/', '') : post.url);
      return `<div class="blog-card-wrapper" data-tags="${(post.tags || []).join(',')}" data-aos="fade-up" data-aos-once="true" data-aos-delay="${i * 50}">
        <a class="blog-card" href="${url}"${target}>
          <h3 class="blog-card-title">${post.title}</h3>
          <p class="blog-card-date">${post.date}</p>
          <p class="blog-card-excerpt">${post.excerpt}</p>
          <div class="blog-card-tags">${tagsHTML}</div>
        </a>
      </div>`;
    }).join('');

    VanillaTilt.init(grid.querySelectorAll('.blog-card'), {
      max: 8,
      speed: 400,
      perspective: 1200,
      scale: 1.02,
      glare: false,
      gyroscope: false
    });
  }


  // Apply tag filters
  function applyFilters() {
    const wrappers = document.querySelectorAll('#blog-grid .blog-card-wrapper');
    wrappers.forEach(wrapper => {
      if (activeTags.size === 0) {
        wrapper.classList.remove('filtered-out');
        return;
      }
      const tags = wrapper.dataset.tags.split(',');
      const match = tags.some(t => activeTags.has(t));
      wrapper.classList.toggle('filtered-out', !match);
    });

    updateGridOffsets();
  }


  function updateGridOffsets() {
    const grid = document.getElementById('blog-grid');
    if (!grid) return;
    const allCards = grid.querySelectorAll('.blog-card-wrapper .blog-card');
    allCards.forEach(c => c.style.transform = '');
    grid.style.marginBottom = '';
  }

  // Init
  initFeaturedCarousel({ isSubpage: true });
  renderFilterBar();
  renderCards();
  updateGridOffsets();
  window.addEventListener('resize', function () {
    updateGridOffsets();
    AOS.refresh();
  });

  AOS.init({ offset: 50 });
})();
