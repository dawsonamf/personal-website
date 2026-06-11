(function () {
  'use strict';

  marked.use({
    gfm: true,
    breaks: false,
    renderer: {
      link({ href, title, tokens }) {
        const text = this.parser.parseInline(tokens);
        const titleAttr = title ? ` title="${title}"` : '';
        if (href && (href.startsWith('http://') || href.startsWith('https://'))) {
          return `<a href="${href}" class="text-link" target="_blank" rel="noopener noreferrer"${titleAttr}>${text}</a>`;
        }
        return `<a href="${href}" class="text-link"${titleAttr}>${text}</a>`;
      },
      image({ href, title, text }) {
        const titleAttr = title ? ` title="${title}"` : '';
        return `<img src="${href}" alt="${text}" class="blog-image"${titleAttr}>`;
      },
      code({ text, lang }) {
        if (lang === 'mermaid') {
          return `<div class="mermaid">${text}</div>`;
        }
        if (lang && hljs.getLanguage(lang)) {
          return `<pre><code class="hljs language-${lang}">${hljs.highlight(text, { language: lang }).value}</code></pre>`;
        }
        return `<pre><code class="hljs">${hljs.highlightAuto(text).value}</code></pre>`;
      },
    },
  });

  function parseFrontmatter(raw) {
    const match = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
    if (!match) return { meta: {}, body: raw };

    const meta = {};
    match[1].split('\n').forEach(line => {
      const idx = line.indexOf(':');
      if (idx === -1) return;
      const key = line.slice(0, idx).trim();
      let val = line.slice(idx + 1).trim();
      if (val.startsWith('[') && val.endsWith(']')) {
        val = val.slice(1, -1).split(',').map(s => s.trim().replace(/^["']|["']$/g, ''));
      }
      meta[key] = val;
    });
    return { meta, body: match[2] };
  }

  function parsePostDate(dateStr) {
    if (!dateStr) return null;
    const d = new Date(dateStr + ' 1');
    return isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10);
  }

  function injectJsonLd(meta, postData) {
    const url = window.location.href;
    const datePublished = parsePostDate(meta.date);

    const schema = {
      '@context': 'https://schema.org',
      '@type': 'BlogPosting',
      headline: meta.title || '',
      url: url,
      mainEntityOfPage: { '@type': 'WebPage', '@id': url },
      author: {
        '@type': 'Person',
        name: 'Dawson Metzger-Fleetwood',
        url: 'https://www.dawsonamf.com/'
      },
      publisher: {
        '@type': 'Person',
        name: 'Dawson Metzger-Fleetwood',
        url: 'https://www.dawsonamf.com/'
      }
    };
    if (datePublished) {
      schema.datePublished = datePublished;
      schema.dateModified = datePublished;
    }
    if (postData && postData.excerpt) schema.description = postData.excerpt;
    if (postData && postData.tags) schema.keywords = postData.tags.join(', ');

    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify(schema);
    document.head.appendChild(script);
  }

  function addCopyButtons(root) {
    root.querySelectorAll('pre > code').forEach(code => {
      const pre = code.parentElement;
      pre.classList.add('has-copy-btn');

      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'code-copy-btn';
      btn.setAttribute('aria-label', 'Copy code');
      btn.innerHTML =
        '<i class="code-copy-icon code-copy-icon-copy fa-regular fa-copy" aria-hidden="true"></i>' +
        '<i class="code-copy-icon code-copy-icon-check fa-solid fa-check" aria-hidden="true"></i>';

      btn.addEventListener('click', () => {
        navigator.clipboard.writeText(code.innerText).then(() => {
          btn.classList.add('copied');
          setTimeout(() => btn.classList.remove('copied'), 1500);
        });
      });

      pre.appendChild(btn);
    });
  }

  function loadPostScripts(scripts) {
    if (!scripts || !scripts.length) return Promise.resolve();
    return scripts.reduce((chain, src) => {
      return chain.then(() => new Promise((resolve, reject) => {
        const el = document.createElement('script');
        el.src = src;
        el.onload = resolve;
        el.onerror = reject;
        document.body.appendChild(el);
      }));
    }, Promise.resolve());
  }

  function loadPostStyles(styles) {
    if (!styles || !styles.length) return;
    styles.forEach(href => {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = href;
      document.head.appendChild(link);
    });
  }

  const params = new URLSearchParams(window.location.search);
  const postId = params.get('id');

  if (!postId) {
    document.getElementById('post-title').textContent = 'Post not found';
    return;
  }

  fetch(`posts/${postId}.md`)
    .then(res => {
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.text();
    })
    .then(raw => {
      const { meta, body } = parseFrontmatter(raw);

      document.title = (meta.title || 'Blog') + ' | Dawson Metzger-Fleetwood';
      document.getElementById('post-title').textContent = meta.title || '';

      const metaEl = document.getElementById('post-meta');
      const pills = [];
      if (meta.date) pills.push(meta.date);

      const postData = (window.BLOG_POSTS || []).find(p => p.id === postId);
      if (postData && postData.tags) {
        postData.tags.forEach(t => pills.push(t));
      }

      pills.push('<span id="read-time"></span>');
      metaEl.innerHTML = pills.map(p => `<span class="pill">${p}</span>`).join('');

      loadPostStyles(Array.isArray(meta.styles) ? meta.styles : meta.styles ? [meta.styles] : []);

      const contentEl = document.getElementById('post-content');
      contentEl.innerHTML = marked.parse(body);
      mermaid.run({ nodes: contentEl.querySelectorAll('.mermaid') });
      addCopyButtons(contentEl);
      injectJsonLd(meta, postData);

      const words = contentEl.innerText.trim().split(/\s+/).length;
      const minutes = Math.max(1, Math.round(words / 200));
      const readTimeEl = document.getElementById('read-time');
      if (readTimeEl) readTimeEl.textContent = minutes + ' min read';

      // Style versions can switch tilt off (flags.tilt in js/theme-bootstrap.js).
      if (!window.__styleAllowsTilt || window.__styleAllowsTilt()) {
        VanillaTilt.init(contentEl.querySelectorAll('.blog-image'), {
          max: 8,
          speed: 6000,
          perspective: 1200,
          scale: 1,
          glare: true,
          "max-glare": 0.15,
          gyroscope: true
        });
      }

      const scriptsList = Array.isArray(meta.scripts) ? meta.scripts : meta.scripts ? [meta.scripts] : [];
      return loadPostScripts(scriptsList);
    })
    .catch(() => {
      document.getElementById('post-title').textContent = 'Post not found';
      document.getElementById('post-content').innerHTML = '<p>Sorry, this post could not be loaded.</p>';
    });
})();
