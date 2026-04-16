(function () {
  const cursor = document.querySelector('.cursor-follow');
  const circle = document.querySelector('.circle-follow');
  if (!cursor || !circle) return;

  let mouseX = 0, mouseY = 0;
  let circleX = 0, circleY = 0;
  let cursorX = 0, cursorY = 0;

  document.addEventListener('mousemove', function (e) {
    const body = document.body.getBoundingClientRect();
    const mainBody = document.getElementById('main-body');
    let adjustment = 8;
    if (mainBody) {
      const diff = (body.width - mainBody.getBoundingClientRect().width) / 2;
      adjustment = diff <= 0 ? 8 : 8 - diff;
    }
    mouseX = e.clientX - body.left - window.scrollX + adjustment;
    mouseY = e.clientY - body.top - window.scrollY + 8;
  });

  (function animate() {
    circleX += (mouseX - circleX - circle.offsetWidth / 2) * 0.25;
    circleY += (mouseY - circleY - circle.offsetHeight / 2) * 0.25;
    cursorX += (mouseX - cursorX - cursor.offsetWidth / 2) * 0.6;
    cursorY += (mouseY - cursorY - cursor.offsetHeight / 2) * 0.6;
    cursor.style.left = cursorX + 'px';
    cursor.style.top = cursorY + 'px';
    circle.style.left = circleX + 'px';
    circle.style.top = circleY + 'px';
    requestAnimationFrame(animate);
  })();

  // Any anchor or button expands the cursor. .job-menu-item is a non-anchor
  // <li> that behaves as a clickable, so it's kept explicit.
  const hoverSelectors = 'a, button, .job-menu-item';
  document.addEventListener('mouseover', (e) => {
    if (e.target.closest(hoverSelectors)) cursor.classList.add('cursor-follow-clickable');
  });
  document.addEventListener('mouseout', (e) => {
    if (e.target.closest(hoverSelectors)) cursor.classList.remove('cursor-follow-clickable');
  });

  document.addEventListener('mousemove', function () {
    const container = document.getElementById('cursor-container');
    if (container) container.style.opacity = '1';
  }, { once: true });
})();
