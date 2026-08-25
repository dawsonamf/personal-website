(function () {
  const cursor = document.querySelector('.cursor-follow');
  const circle = document.querySelector('.circle-follow');
  if (!cursor || !circle) return;

  let mouseX = 0, mouseY = 0;
  let circleX = 0, circleY = 0;
  let cursorX = 0, cursorY = 0;

  // #cursor-container is pinned to the viewport origin (css/styles.css), so
  // client coordinates land as-is. The follower is centred on the pointer by
  // the half-size subtraction in animate() below. This used to correct for
  // the container sitting at #main-body's content edge by measuring the page
  // gutter every move — arithmetic that assumed the classic centred 1240px
  // column and drifted by the difference under any skin that widens it.
  document.addEventListener('mousemove', function (e) {
    mouseX = e.clientX;
    mouseY = e.clientY;
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
