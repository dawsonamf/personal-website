// The one vendor table (Spec 1 D5, §8): one row per served third-party file.
// Consumer: scripts/vendor.mjs (`npm run vendor`).
// Boxicons rows carry no npmPath: they are committed copies of the pinned CDN
// build, because its npm package pulls React. mermaid, Plotly, js-yaml, marked
// and highlight.js runtime JS are deliberately absent (D5/D6).

export const VENDOR_FILES = [
  {
    npmPath: 'jquery/dist/jquery.min.js',
    publicPath: '/vendor/jquery/jquery.min.js',
    cdnUrl: 'https://code.jquery.com/jquery-3.6.0.min.js',
  },
  {
    // One byte longer than the CDN file (253,669 vs 253,668 B): an extra "\" escaping "/" in
    // escapeSelector's regex at offset 45,840; same semantics (research/library-migration.md).
    npmPath: 'jquery-ui-dist/jquery-ui.min.js',
    publicPath: '/vendor/jquery-ui/jquery-ui.min.js',
    cdnUrl: 'https://code.jquery.com/ui/1.12.1/jquery-ui.min.js',
  },
  {
    npmPath: 'gsap/dist/gsap.min.js',
    publicPath: '/vendor/gsap/gsap.min.js',
    cdnUrl: 'https://cdnjs.cloudflare.com/ajax/libs/gsap/3.9.1/gsap.min.js',
  },
  {
    npmPath: 'aos/dist/aos.js',
    publicPath: '/vendor/aos/aos.js',
    cdnUrl: 'https://unpkg.com/aos@2.3.1/dist/aos.js',
  },
  {
    npmPath: 'aos/dist/aos.css',
    publicPath: '/vendor/aos/aos.css',
    cdnUrl: 'https://unpkg.com/aos@2.3.1/dist/aos.css',
  },
  {
    npmPath: 'vanilla-tilt/dist/vanilla-tilt.min.js',
    publicPath: '/vendor/vanilla-tilt/vanilla-tilt.min.js',
    cdnUrl: 'https://cdnjs.cloudflare.com/ajax/libs/vanilla-tilt/1.7.0/vanilla-tilt.min.js',
  },
  {
    npmPath: 'highlight.js/styles/github-dark.min.css',
    publicPath: '/vendor/highlight.js/github-dark.min.css',
    cdnUrl: 'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/github-dark.min.css',
  },
  {
    npmPath: '@fortawesome/fontawesome-free/css/all.min.css',
    publicPath: '/vendor/fontawesome-free/css/all.min.css',
    cdnUrl: 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css',
  },
  {
    npmPath: '@fortawesome/fontawesome-free/webfonts/fa-brands-400.woff2',
    publicPath: '/vendor/fontawesome-free/webfonts/fa-brands-400.woff2',
    cdnUrl: 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/webfonts/fa-brands-400.woff2',
  },
  {
    npmPath: '@fortawesome/fontawesome-free/webfonts/fa-brands-400.ttf',
    publicPath: '/vendor/fontawesome-free/webfonts/fa-brands-400.ttf',
    cdnUrl: 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/webfonts/fa-brands-400.ttf',
  },
  {
    npmPath: '@fortawesome/fontawesome-free/webfonts/fa-regular-400.woff2',
    publicPath: '/vendor/fontawesome-free/webfonts/fa-regular-400.woff2',
    cdnUrl: 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/webfonts/fa-regular-400.woff2',
  },
  {
    npmPath: '@fortawesome/fontawesome-free/webfonts/fa-regular-400.ttf',
    publicPath: '/vendor/fontawesome-free/webfonts/fa-regular-400.ttf',
    cdnUrl: 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/webfonts/fa-regular-400.ttf',
  },
  {
    npmPath: '@fortawesome/fontawesome-free/webfonts/fa-solid-900.woff2',
    publicPath: '/vendor/fontawesome-free/webfonts/fa-solid-900.woff2',
    cdnUrl: 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/webfonts/fa-solid-900.woff2',
  },
  {
    npmPath: '@fortawesome/fontawesome-free/webfonts/fa-solid-900.ttf',
    publicPath: '/vendor/fontawesome-free/webfonts/fa-solid-900.ttf',
    cdnUrl: 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/webfonts/fa-solid-900.ttf',
  },
  {
    npmPath: '@fortawesome/fontawesome-free/webfonts/fa-v4compatibility.woff2',
    publicPath: '/vendor/fontawesome-free/webfonts/fa-v4compatibility.woff2',
    cdnUrl: 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/webfonts/fa-v4compatibility.woff2',
  },
  {
    npmPath: '@fortawesome/fontawesome-free/webfonts/fa-v4compatibility.ttf',
    publicPath: '/vendor/fontawesome-free/webfonts/fa-v4compatibility.ttf',
    cdnUrl: 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/webfonts/fa-v4compatibility.ttf',
  },
  {
    publicPath: '/vendor/boxicons/css/boxicons.min.css',
    cdnUrl: 'https://cdn.jsdelivr.net/npm/boxicons@2.0.9/css/boxicons.min.css',
  },
  {
    publicPath: '/vendor/boxicons/fonts/boxicons.woff2',
    cdnUrl: 'https://cdn.jsdelivr.net/npm/boxicons@2.0.9/fonts/boxicons.woff2',
  },
];
