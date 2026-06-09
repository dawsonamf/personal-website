(function () {
  'use strict';

  const TYPING_DELAY = 75;

  // Typing animation (animateThenPersist comes from ../js/anim-utils.js)
  function onBlogTypingComplete() {
    animateThenPersist(document.getElementById('blog-sub-text'), 'fadein 0.8s ease-out', '0.01s', { opacity: '1' });
    animateThenPersist(document.getElementById('blog-sub-text-2'), 'fadein 0.8s ease-out', '0.08s', { opacity: '1' });
    animateThenPersist(document.getElementById('blog-sub-text-3'), 'fadein 0.8s ease-out', '0.12s', { opacity: '1' });
    animateThenPersist(document.getElementById('blog-socials-list'), 'fadein 0.8s ease-out', '0.15s', { opacity: '1' });
    animateThenPersist(document.querySelector('.name-logo'), 'fadein 0.8s ease-out', '0.38s', { visibility: 'visible', opacity: '1' });
    animateThenPersist(document.querySelector('.static-menu'), 'fadein 0.8s ease-out', '0.76s', { visibility: 'visible', opacity: '1' });
    animateThenPersist(document.querySelector('.static-menu-mobile'), 'fadein 0.8s ease-out', '0.76s', { visibility: 'visible', opacity: '1' });
    animateThenPersist(document.getElementById('selected-works-header'), 'slideInUp 0.8s ease-out', '0.25s', { opacity: '1', transform: 'translateY(0)' });
    animateThenPersist(document.getElementById('featured-carousel'), 'slideInUp 0.8s ease-out', '0.25s', { opacity: '1', transform: 'translateY(0)' });
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
  }


  // Init
  initFeaturedCarousel({ isSubpage: true });
  renderFilterBar();
  renderCards();
  window.addEventListener('resize', function () {
    AOS.refresh();
  });

  AOS.init({ offset: 50 });
})();
