(function () {
  'use strict';

  var content = document.getElementById('post-content');
  if (!content) return;

  content.addEventListener('click', function (event) {
    var target = event.target;
    var button = target && target.closest ? target.closest('.code-copy-btn') : null;
    if (!button || !content.contains(button)) return;
    var code = button.parentElement && button.parentElement.querySelector('code');
    if (!code) return;
    navigator.clipboard.writeText(code.innerText).then(function () {
      button.classList.add('copied');
      setTimeout(function () { button.classList.remove('copied'); }, 1500);
    });
  });

  var words = content.innerText.trim().split(/\s+/).filter(Boolean).length;
  var minutes = Math.max(1, Math.round(words / 200));
  var readTime = document.getElementById('read-time');
  if (readTime) {
    readTime.textContent = (readTime.dataset.readTime || '{n} min read').replace('{n}', String(minutes));
  }

  function runMermaid() {
    if (window.mermaid && content.querySelector('.mermaid')) {
      window.mermaid.run({ nodes: content.querySelectorAll('.mermaid') });
    }
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', runMermaid, { once: true });
  } else {
    runMermaid();
  }

  if (!document.documentElement.hasAttribute('data-no-tilt') && window.VanillaTilt) {
    window.VanillaTilt.init(content.querySelectorAll('.blog-image'), {
      max: 8,
      speed: 6000,
      perspective: 1200,
      scale: 1,
      glare: true,
      'max-glare': 0.15,
      gyroscope: true,
    });
  }
})();
