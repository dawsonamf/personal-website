/*
 * Canonical Home disclosures. Each Skills group contains a native <details name> disclosure
 * whose summary is only the toggle label. With script, this file takes each disclosure over: it moves
 * `name` to data-disclosure so the group it closes can animate shut instead of vanishing, eases
 * the border-box height open and closed (immediately under prefers-reduced-motion), reveals the
 * build-rendered bottom close buttons and returns focus to the summary they close. A reversed
 * click starts from the current height. Document-lifetime listeners; no markup is created.
 */
(function () {
  var DURATION = 200;
  var EASING = 'ease-in-out';
  var reduceMotion = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;
  var running = new Map(); // details -> its height and crossfade Animations

  function managed(node) {
    return !!node && node.tagName === 'DETAILS' && node.hasAttribute('data-disclosure');
  }

  // Open and not on its way shut.
  function isOpen(details) {
    return details.open && !details.classList.contains('disclosure-closing');
  }

  function closePeers(details) {
    var group = details.getAttribute('data-disclosure');
    var peers = document.querySelectorAll('details[data-disclosure]');
    for (var i = 0; i < peers.length; i++) {
      if (peers[i] !== details && peers[i].getAttribute('data-disclosure') === group && isOpen(peers[i])) {
        setOpen(peers[i], false);
      }
    }
  }

  function moves() {
    return !(reduceMotion && reduceMotion.matches) && typeof Element.prototype.animate === 'function';
  }

  // Drops a running animation without landing its end state.
  function stop(details) {
    var animations = running.get(details);
    if (!animations) return;
    running.delete(details);
    animations.forEach(function (animation) {
      animation.onfinish = null;
      animation.cancel();
    });
  }

  // The end state: a closing group closes, and no animation styling remains.
  function land(details) {
    if (details.classList.contains('disclosure-closing')) {
      details.open = false;
      details.classList.remove('disclosure-closing');
    }
    details.classList.remove('disclosure-animating');
  }

  function setOpen(details, open) {
    if (isOpen(details) === open) return;
    // offsetHeight includes a running animation, so a reversal starts where the last one was.
    var from = details.offsetHeight;
    var summary = details.querySelector(':scope > summary');
    var panel = details.querySelector('.disclosure-panel');
    var cueOpacity = running.has(details) ? getComputedStyle(summary).opacity : (open ? 1 : 0);
    var panelOpacity = running.has(details) ? getComputedStyle(panel).opacity : (open ? 0 : 1);
    stop(details);
    if (open) {
      details.classList.remove('disclosure-closing');
      details.open = true;
    } else {
      details.classList.add('disclosure-closing');
    }
    if (!moves()) {
      land(details);
      return;
    }
    details.classList.add('disclosure-animating');
    var to;
    if (open) {
      to = details.offsetHeight;
    } else {
      details.classList.add('disclosure-measuring');
      to = details.offsetHeight;
      details.classList.remove('disclosure-measuring');
    }
    if (from === to) {
      land(details);
      return;
    }
    // `forwards` holds the end height until the end state lands, so nothing flashes between.
    var timing = { duration: DURATION, easing: EASING, fill: 'forwards' };
    var animation = details.animate(
      [{ height: from + 'px' }, { height: to + 'px' }],
      timing
    );
    // Fade the outgoing text first so the top cue and the first paragraph never collide.
    var cueAnimation = summary.animate(
      [{ opacity: cueOpacity }, { opacity: open ? 0 : cueOpacity, offset: open ? 0.4 : 0.6 }, { opacity: open ? 0 : 1 }],
      timing
    );
    var panelAnimation = panel.animate(
      [{ opacity: panelOpacity }, { opacity: open ? panelOpacity : 0, offset: open ? 0.4 : 0.6 }, { opacity: open ? 1 : 0 }],
      timing
    );
    var animations = [animation, cueAnimation, panelAnimation];
    running.set(details, animations);
    animation.onfinish = function () {
      running.delete(details);
      land(details);
      animations.forEach(function (active) { active.cancel(); });
    };
  }

  function onClick(event) {
    var target = event.target;
    if (!target || !target.closest) return;

    var close = target.closest('.disclosure-close');
    if (close) {
      var owner = close.closest('details');
      if (!managed(owner)) return;
      setOpen(owner, false);
      var ownerSummary = owner.querySelector(':scope > summary');
      // Keyboard activation must bring the returned focus into view.
      if (ownerSummary) ownerSummary.focus({ preventScroll: event.detail !== 0 });
      return;
    }

    var summary = target.closest('summary');
    var details = summary && summary.parentElement;
    if (!managed(details)) return;
    // Mouse, Enter and Space all arrive here; the script toggles instead of the browser.
    event.preventDefault();
    var open = !isOpen(details);
    if (open) closePeers(details);
    setOpen(details, open);
    // Opening hides the top control; keep keyboard focus in the revealed content.
    var panel = details.querySelector('.disclosure-panel');
    if (open && panel) panel.focus({ preventScroll: true });
  }

  // Something other than a summary click opened a group, such as find in page: keep one open.
  function onToggle(event) {
    var details = event.target;
    if (!managed(details) || running.has(details) || !isOpen(details)) return;
    closePeers(details);
  }

  // Turning reduced motion on lands anything still moving.
  function onMotionPreference() {
    if (!reduceMotion.matches) return;
    var moving = [];
    running.forEach(function (_animation, details) { moving.push(details); });
    for (var i = 0; i < moving.length; i++) {
      stop(moving[i]);
      land(moving[i]);
    }
  }

  function init() {
    var panels = document.querySelectorAll('details[name] > .disclosure-panel');
    for (var i = 0; i < panels.length; i++) {
      var details = panels[i].parentElement;
      details.setAttribute('data-disclosure', details.getAttribute('name'));
      details.removeAttribute('name');
      for (var child = panels[i].firstElementChild; child; child = child.nextElementSibling) {
        if (child.classList.contains('disclosure-close')) child.hidden = false;
      }
    }
    document.addEventListener('click', onClick);
    // `toggle` does not bubble, so it is heard in the capture phase.
    document.addEventListener('toggle', onToggle, true);
    if (reduceMotion) {
      if (reduceMotion.addEventListener) reduceMotion.addEventListener('change', onMotionPreference);
      else if (reduceMotion.addListener) reduceMotion.addListener(onMotionPreference);
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
