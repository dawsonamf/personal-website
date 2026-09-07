(function () {
  const root = document.getElementById('underviewed-art');
  if (!root) return;

  const reduceMotion =
    !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);

  const REFRESH_ICON =
    '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 12a9 9 0 0 1 15-6.7L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-15 6.7L3 16"/><path d="M3 21v-5h5"/></svg>';

  // ---------- helpers ----------
  function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const t = arr[i]; arr[i] = arr[j]; arr[j] = t;
    }
    return arr;
  }
  function normalize(s) {
    return (s || '').replace(/\s+/g, ' ').trim();
  }
  function preload(src) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve();
      img.onerror = () => reject(new Error('image failed to load'));
      img.src = src;
    });
  }

  // ---------- source adapters ----------
  // Each returns { title, artist, date, imageUrl, objectUrl, sourceName, raw }
  // for a random work that is NOT currently on public display (in storage), with
  // an image that embeds cross-origin. All keyless, browser fetch only.
  // Every endpoint + image host below was verified live on 2026-07-06.

  // -- The Met -- off view == empty GalleryNumber; public-domain works have images.
  const MET_BASE = 'https://collectionapi.metmuseum.org/public/collection/v1';
  let metPool = null;
  async function metObject(id) {
    const r = await fetch(`${MET_BASE}/objects/${id}`);
    return r.ok ? r.json() : null;
  }
  function metUsable(o) {
    const offView = o.GalleryNumber === '' || o.GalleryNumber == null;
    return !!(o.isPublicDomain && o.primaryImageSmall && offView);
  }
  function metShape(o) {
    return {
      title: o.title || 'Untitled',
      artist: o.artistDisplayName || 'Unknown',
      date: o.objectDate || '',
      imageUrl: o.primaryImageSmall,
      objectUrl: o.objectURL || `https://www.metmuseum.org/art/collection/search/${o.objectID}`,
      sourceName: 'The Met',
      raw: o,
    };
  }
  async function pickMet() {
    // Random draw across the full ~500k catalog for maximum variety.
    for (let i = 0; i < 7; i++) {
      const id = 1 + Math.floor(Math.random() * 980000);
      let o = null;
      try { o = await metObject(id); } catch (e) { o = null; }
      if (o && metUsable(o)) return metShape(o);
    }
    // Fallback: the authoritative off-view-with-images search pool (~325, cached).
    if (!metPool) {
      try {
        const res = await fetch(`${MET_BASE}/search?q=*&hasImages=true&isOnView=false`);
        metPool = res.ok ? ((await res.json()).objectIDs || []) : [];
      } catch (e) { metPool = []; }
    }
    for (const id of shuffle((metPool || []).slice()).slice(0, 8)) {
      let o = null;
      try { o = await metObject(id); } catch (e) { o = null; }
      if (o && metUsable(o)) return metShape(o);
    }
    throw new Error('Met: no off-view public-domain image found');
  }

  // -- Cleveland Museum of Art -- off view == empty current_location. CC0 + has_image.
  // Cached API responses drop the CORS header, so every request must be cache-busted.
  const CLE_BASE = 'https://openaccess-api.clevelandart.org/api/artworks/';
  const CLE_FILTERS = 'cc0=1&has_image=1';
  let cleTotal = null;
  function cleBust() { return '_=' + Date.now() + Math.random().toString(36).slice(2); }
  async function cleJSON(qs) {
    const r = await fetch(CLE_BASE + '?' + qs + '&' + cleBust());
    if (!r.ok) throw new Error('Cleveland ' + r.status);
    return r.json();
  }
  async function pickCleveland() {
    if (!cleTotal) {
      const meta = await cleJSON(CLE_FILTERS + '&limit=1');
      cleTotal = (meta.info && meta.info.total) || 0;
    }
    if (!cleTotal) throw new Error('Cleveland: empty collection');
    const BATCH = 25;
    for (let i = 0; i < 6; i++) {
      const skip = Math.floor(Math.random() * Math.max(1, cleTotal - BATCH));
      const page = await cleJSON(CLE_FILTERS + '&limit=' + BATCH + '&skip=' + skip);
      const offView = (page.data || []).filter(a =>
        !a.current_location && a.images && a.images.web && a.images.web.url);
      if (offView.length) {
        const a = offView[Math.floor(Math.random() * offView.length)];
        const creator = a.creators && a.creators[0] && a.creators[0].description;
        const culture = a.culture && a.culture[0];
        return {
          title: a.title || 'Untitled',
          artist: creator || culture || 'Unknown',
          date: a.creation_date || '',
          imageUrl: a.images.web.url,
          objectUrl: a.url,
          sourceName: 'Cleveland Museum of Art',
          raw: a,
        };
      }
    }
    throw new Error('Cleveland: no off-view work found');
  }

  // -- Victoria and Albert Museum -- off view == _currentLocation.onDisplay === false.
  // random=1 reshuffles the whole ~740k collection each call (and dodges the ~10k
  // deep-pagination cap). ~91% of a random batch is off display.
  async function pickVA() {
    const res = await fetch('https://api.vam.ac.uk/v2/objects/search?images_exist=1&random=1&page_size=15');
    if (!res.ok) throw new Error('V&A ' + res.status);
    const json = await res.json();
    const off = (json.records || []).filter(r =>
      r._currentLocation && r._currentLocation.onDisplay === false && r._primaryImageId);
    if (!off.length) throw new Error('V&A: no off-display records in batch');
    const r = off[Math.floor(Math.random() * off.length)];
    return {
      title: r._primaryTitle || r.objectType || 'Untitled',
      artist: (r._primaryMaker && r._primaryMaker.name) || 'Unknown',
      date: r._primaryDate || '',
      imageUrl: `https://framemark.vam.ac.uk/collections/${r._primaryImageId}/full/!800,800/0/default.jpg`,
      objectUrl: `https://collections.vam.ac.uk/item/${r.systemNumber}/`,
      sourceName: 'Victoria and Albert Museum',
      raw: r,
    };
  }

  // -- The Getty -- off view == on_view=false (authoritative server filter); CC0 open content.
  const GETTY_BASE = 'https://www.getty.edu/art/collection/api/search?images=true&open_content=true&on_view=false';
  let gettyTotal = null;
  async function pickGetty() {
    if (!gettyTotal) {
      const res = await fetch(GETTY_BASE + '&size=1&from=0');
      if (!res.ok) throw new Error('Getty count ' + res.status);
      gettyTotal = (await res.json()).total || 0;
    }
    if (!gettyTotal) throw new Error('Getty: no off-view works');
    const from = Math.floor(Math.random() * Math.max(1, gettyTotal - 15));
    const res = await fetch(GETTY_BASE + '&size=15&from=' + from);
    if (!res.ok) throw new Error('Getty search ' + res.status);
    const withImg = ((await res.json()).data || []).filter(r => r.manifest && r.manifest.thumbUuid);
    if (!withImg.length) throw new Error('Getty: no imaged off-view records in batch');
    const r = withImg[Math.floor(Math.random() * withImg.length)];
    const artist = (r.producers || []).map(p => p.primary_name).filter(Boolean).join(', ') || 'Unknown';
    return {
      title: r.primary_name || 'Untitled',
      artist: artist,
      date: r.date_created || '',
      imageUrl: `https://media.getty.edu/iiif/image/${r.manifest.thumbUuid}/full/!800,800/0/default.jpg`,
      objectUrl: 'https://www.getty.edu/art/collection' + (r.slug_with_path || ''),
      sourceName: 'The Getty',
      raw: r,
    };
  }

  const SOURCES = [
    { name: 'The Met', pick: pickMet },
    { name: 'Cleveland Museum of Art', pick: pickCleveland },
    { name: 'Victoria and Albert Museum', pick: pickVA },
    { name: 'The Getty', pick: pickGetty },
  ];

  // ---------- session state ----------
  const seen = new Set();   // object identities we've committed to showing
  const skip = new Set();   // identities whose image failed to load
  const gallery = [];       // works shown this session, in order (drives the rail)
  let selectedKey = null;
  let loading = false;

  // Rotate through the museums, skipping repeats and unloadable images. A single
  // museum being slow or down just means the next one covers for it.
  async function pickNext() {
    let lastErr = null;
    for (const source of shuffle(SOURCES.slice())) {
      let art;
      try {
        art = await source.pick();
      } catch (e) {
        lastErr = e;
        continue;
      }
      if (!art || !art.imageUrl) continue;
      const key = art.objectUrl || art.imageUrl;
      if (seen.has(key) || skip.has(key)) continue;
      try {
        await preload(art.imageUrl);
        seen.add(key);
        art.key = key;
        return art;
      } catch (e) {
        skip.add(key);
        lastErr = e;
      }
    }
    throw lastErr || new Error('no artwork found');
  }

  // ---------- DOM skeleton (replaces the fallback text authored in the post) ----------
  root.classList.add('uva');
  if (reduceMotion) root.classList.add('uva-reduced');
  root.innerHTML =
    '<div class="uva-caption">' +
      '<h3 class="uva-title"></h3>' +
      '<p class="uva-meta"></p>' +
    '</div>' +
    '<div class="uva-frame" aria-label="Artwork not on view"><div class="uva-media"></div></div>' +
    '<div class="uva-controls">' +
      '<button class="uva-refresh" type="button">' + REFRESH_ICON + '<span>Show another</span></button>' +
    '</div>' +
    '<div class="uva-rail" aria-label="Artworks you have seen this visit"><div class="uva-track"></div></div>';

  const titleEl = root.querySelector('.uva-title');
  const metaEl = root.querySelector('.uva-meta');
  const captionEl = root.querySelector('.uva-caption');
  const mediaEl = root.querySelector('.uva-media');
  const refreshBtn = root.querySelector('.uva-refresh');
  const trackEl = root.querySelector('.uva-track');

  function current() {
    return gallery.find(a => a.key === selectedKey) || null;
  }

  function renderCaption() {
    const art = current();
    if (!art) return;

    titleEl.innerHTML = '';
    const link = document.createElement('a');
    link.className = 'text-link'; // site-wide link: underline sweeps in left-to-right
    link.href = art.objectUrl || '#';
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.textContent = art.title || 'Untitled';
    titleEl.appendChild(link);

    // One line: artist · date · holding collection.
    const bits = [normalize(art.artist), normalize(art.date), normalize(art.sourceName)].filter(Boolean);
    metaEl.textContent = bits.join('  ·  ');

    if (!reduceMotion) {
      captionEl.classList.remove('uva-in');
      void captionEl.offsetWidth; // restart the fade
      captionEl.classList.add('uva-in');
    }
  }

  function showImage(art) {
    mediaEl.innerHTML = '';
    const img = document.createElement('img');
    img.className = 'uva-image';
    img.alt = art.title || 'Artwork in storage';
    img.src = art.imageUrl;
    mediaEl.appendChild(img);
    if (reduceMotion) {
      img.classList.add('uva-image-in');
    } else {
      requestAnimationFrame(() => img.classList.add('uva-image-in'));
    }
  }

  function showLoading() {
    mediaEl.innerHTML = '<div class="uva-spinner" role="status" aria-label="Loading artwork"></div>';
  }

  function showError() {
    mediaEl.innerHTML =
      '<div class="uva-error"><p>Could not reach the museums.</p>' +
      '<button type="button" class="uva-retry">try again</button></div>';
    mediaEl.querySelector('.uva-retry').addEventListener('click', loadNext);
  }

  function renderRail() {
    trackEl.innerHTML = '';
    gallery.forEach(art => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'uva-thumb' + (art.key === selectedKey ? ' uva-thumb-active' : '');
      btn.setAttribute('aria-label', `Show ${art.title || 'this artwork'}`);
      const img = document.createElement('img');
      img.src = art.imageUrl;
      img.alt = '';
      btn.appendChild(img);
      btn.addEventListener('click', () => {
        if (art.key === selectedKey) return;
        selectedKey = art.key;
        showImage(art);
        renderCaption();
        renderRail();
      });
      trackEl.appendChild(btn);
    });
    const active = trackEl.querySelector('.uva-thumb-active');
    if (active) {
      active.scrollIntoView({
        behavior: reduceMotion ? 'auto' : 'smooth',
        inline: 'end',
        block: 'nearest',
      });
    }
  }

  async function loadNext() {
    if (loading) return;
    loading = true;
    refreshBtn.disabled = true;
    refreshBtn.classList.add('uva-spinning');
    if (!gallery.length) showLoading();
    try {
      const art = await pickNext();
      gallery.push(art);
      selectedKey = art.key;
      showImage(art);
      renderCaption();
      renderRail();
    } catch (e) {
      // A transient failure shouldn't blank a widget that's already showing art.
      if (!gallery.length) showError();
    } finally {
      loading = false;
      refreshBtn.disabled = false;
      refreshBtn.classList.remove('uva-spinning');
    }
  }

  refreshBtn.addEventListener('click', loadNext);

  loadNext();
})();
