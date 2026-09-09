(() => {
  const root = document.documentElement;
  const key = 'theme.author-proof.visits';
  const visits = Number.parseInt(sessionStorage.getItem(key) || '0', 10) + 1;
  sessionStorage.setItem(key, String(visits));
  root.dataset.authorProofVisits = String(visits);
  window.addEventListener('dawson:palette', () => {
    root.dataset.authorProofPalette = 'applied';
  });
})();
