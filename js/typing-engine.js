/**
 * Reusable type-delete-retype animation engine.
 *
 * Usage:
 *   startTypingSequence({
 *     elementId: 'typing-text',
 *     sequences: [
 *       [
 *         { action: 'type',   text: "Hello,\nworld." },
 *         { action: 'pause',  duration: 1000 },
 *         { action: 'delete', count: 6 },
 *         { action: 'type',   text: "earth." },
 *       ],
 *       [
 *         { action: 'type', text: "Hi there." },
 *       ],
 *     ],
 *     typingDelay: 75,
 *     deleteDelay: 40,
 *     onNewlineCount: { count: 2, callback: function () { ... } },
 *     onComplete: function () { ... },
 *   });
 *
 * Before the first character lands, the element is given a min-height equal
 * to the tallest state the chosen sequence will reach, so the lines that are
 * already written stay where they are as the ones below them arrive (and
 * whatever sits under the headline stops being pushed around). See
 * reserveHeight below.
 *
 * One sequence is picked at random per call. Steps run in order:
 *   - type:     inserts characters one at a time before the cursor
 *   - delete:   removes characters one at a time before the cursor
 *   - pause:    waits for `duration` ms (cursor blinks while waiting)
 *   - callback: fires `fn()` immediately, then continues to the next step
 *
 * Reveal modes. The classic look is 'cursor': bare text typed behind a
 * blinking caret. Style versions can pick a cursorless mode in the registry
 * (js/theme-bootstrap.js, read here via window.__styleTypingMode):
 *   - 'letter': each glyph is wrapped in <span class="tw"> and appears one
 *     at a time; the active skin animates .tw in (draw, flicker, fade...).
 *   - 'word':   same glyph spans, but a whole word's spans land at once, so
 *     the skin's .tw entrance reads word-by-word.
 * In both cursorless modes a deleted glyph gets .tw-out and lingers briefly
 * for the skin's exit animation (erase, flicker-off...) before leaving the
 * DOM. Deleted spaces and <br>s linger through that same drain (no visible
 * exit, but yanking one early would jerk the still-fading glyphs on its
 * right leftward), and an invisible zero-width anchor span stands where the
 * caret would, so the last line's box survives the beat between the final
 * erased glyph draining away and the retype landing. Spaces stay bare text
 * nodes (a lone space inside an inline-block span collapses to nothing);
 * newlines stay <br>. The accent span contract holds: glyphs typed after
 * the second newline also carry .typing-accent.
 *
 * A word's glyph spans share a <span class="tw-word">, which css/styles.css
 * sets nowrap. Without it the line breaker treats every glyph as its own
 * atomic inline and is free to break between any two of them, which is how a
 * masthead ends up setting a lone letter on its own line the moment its
 * column gets tight. Spaces and <br>s stay direct children of the headline,
 * so they remain the only break opportunities. The boxes are an insertion
 * detail only: getContentNodes() walks through them, so deletion still sees
 * one flat run of glyphs, spaces and <br>s.
 *
 * Deletion normally backspaces one glyph per tick in every mode. A style
 * can additionally set typingDelete: 'word' in the registry (read here via
 * window.__styleTypingDeleteMode) to erase the way 'word' mode types: the
 * trailing word's glyph spans take .tw-out on the same frame and drain
 * together — separators fold into the same beat — so the line breaks up a
 * whole word at a time, in reverse order. Delete counts keep their per-char
 * meaning: a count that dries up mid-word takes only that many trailing
 * glyphs. Cursor mode ignores the key (bare text has no spans to group).
 */
function startTypingSequence(config) {
  const element = document.getElementById(config.elementId);
  if (!element) return;

  const typingDelay = config.typingDelay || 75;
  const deleteDelay = config.deleteDelay || 40;
  const sequences   = config.sequences || [];
  if (sequences.length === 0) return;

  // Live style switches replay the masthead via window.__restartTypingSequence
  // (bottom of this file): each call cancels the previous run's pending
  // timers through this token and clears the prior render, so the DOM
  // rebuilds in the incoming style's grammar (caret vs glyph spans).
  if (startTypingSequence._activeRun) startTypingSequence._activeRun.cancelled = true;
  const run = { cancelled: false };
  startTypingSequence._activeRun = run;
  startTypingSequence._lastConfig = config;
  element.innerHTML = '';

  // Every timer that drives the sequence routes through here so a cancelled
  // run stops dead. drainOut keeps raw timeouts: its removals must finish
  // even after cancellation (they self-guard on parentNode).
  function later(fn, ms) {
    setTimeout(function () { if (!run.cancelled) fn(); }, ms);
  }

  const mode = config.mode ||
    (typeof window.__styleTypingMode === 'function' ? window.__styleTypingMode() : 'cursor');
  const usesCursor = mode !== 'letter' && mode !== 'word';

  // How delete steps erase: 'char' (one glyph per tick, the default
  // everywhere) or 'word' (a whole word's glyph spans exit on one beat).
  // Captured once, like `mode`, so a live style switch mid-sequence lets
  // the current phrase finish in the grammar it started with. Word
  // deletion only exists in the cursorless modes — cursor-mode text is
  // bare text nodes with nothing to group.
  const deleteMode = config.deleteMode ||
    (typeof window.__styleTypingDeleteMode === 'function' ? window.__styleTypingDeleteMode() : 'char');
  const wordDelete = !usesCursor && deleteMode === 'word';

  // How long a deleted node stays in the DOM for its exit animation.
  const ERASE_MS = 300;

  // Nodes mid-drain: deleted but still holding layout while the exit
  // animation runs. Membership lives here (not on a class) because spaces
  // are bare text nodes, which can't carry .tw-out.
  const draining = new Set();

  function drainOut(node) {
    draining.add(node);
    setTimeout(function () {
      draining.delete(node);
      const box = node.parentNode;
      if (box) box.removeChild(node);
      // A word box that has lost its last glyph has nothing left to hold.
      if (box && box !== element && !box.firstChild && box.parentNode) {
        box.parentNode.removeChild(box);
      }
    }, ERASE_MS);
  }

  // ---- Word boxes ---------------------------------------------------------
  // The cursorless modes give every glyph its own inline-block so a skin can
  // transform it, and the line breaker is allowed to break between any two
  // atomic inlines — so the moment the column got tight the masthead broke
  // mid-word and set a lone letter on its own line. Each word's glyphs go in
  // a shared <span class="tw-word">, which css/styles.css sets nowrap; the
  // spaces and <br>s stay direct children of the headline, so they remain the
  // only places a line can break.
  //
  // Everything downstream still sees the flat list it always did: the box is
  // an implementation detail of insertion, and getContentNodes() below walks
  // through it. Cursor mode has no glyph spans and never opens one.
  let wordBox = null;

  function glyphHost() {
    if (!wordBox) {
      wordBox = document.createElement('span');
      wordBox.className = 'tw-word';
      element.insertBefore(wordBox, cursor);
    }
    return wordBox;
  }

  // Called wherever a word ends: a space, a newline, or any deletion. After a
  // delete the next glyph opens a fresh box rather than rejoining whatever is
  // left of the old one — the sequences only ever delete whole trailing
  // phrases, so there is no word to rejoin, and starting clean means a
  // half-drained box can never collect the retype.
  function endWord() {
    wordBox = null;
  }

  const steps = sequences[Math.floor(Math.random() * sequences.length)];

  // The insertion anchor: the blinking caret in cursor mode. The cursorless
  // modes get an invisible stand-in — a zero-width space — that keeps a
  // line box alive on the last line even when every real glyph is gone.
  const cursor = document.createElement('span');
  if (usesCursor) {
    cursor.className = 'cursor';
  } else {
    cursor.className = 'tw-anchor';
    cursor.textContent = '\u200B';
  }
  element.appendChild(cursor);

  // ---- Reserve the block's height -----------------------------------------
  // The typed block grows a line at a time, and every layout it sits in
  // reacts to that: a top-aligned column pushes whatever is under the
  // headline further down with each line, and a bottom-aligned one (the home
  // masthead hangs off the portrait's bottom edge, css/styles.css) lifts the
  // lines already written by a whole line every time a new one starts. Either
  // way the type is not where it will end up until the last line lands.
  //
  // So work out how tall the block will ever get and hold that from the
  // first frame. Every state the chosen sequence passes through is known up
  // front: type appends, delete takes from the end, and a step can only be
  // at its tallest once its typing has finished, so the completed states are
  // the only ones worth measuring.
  //
  // Measuring happens on a copy laid out beside the real element, which
  // keeps the reservation off the live node — the element is mid-animation
  // by the time fonts finish loading and we measure again. The copy keeps
  // the id on purpose: the id is what most of the type is hung off
  // (#typing-text is 70px, marquee's is a 96px clamp), so dropping it would
  // measure the wrong block. It exists for one synchronous function and
  // nothing looks the element up in between; getElementById keeps returning
  // the original either way, since the copy is appended after it.
  //
  // The copy is left in normal flow, hidden rather than taken out of it. The
  // column around the headline is shrink-to-fit, so its width is decided by
  // the widest thing in it — which, while the real element is still empty,
  // is the standfirst underneath. Pinning the copy to that width made every
  // word wrap and reserved six lines for a three-line sequence. In flow the
  // copy sizes the column itself, exactly as the finished text will. Nothing
  // paints between the insert and the remove, so the page never shows it.
  function plannedStates() {
    const out = [];
    let text = '';
    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      if (step.action === 'type') {
        text += (step.text || '');
        out.push(text);
      } else if (step.action === 'delete') {
        text = text.slice(0, Math.max(0, text.length - (step.count || 0)));
      }
    }
    return out;
  }

  function fill(node, str) {
    node.textContent = '';
    const lines = str.split('\n');
    for (let i = 0; i < lines.length; i++) {
      if (i) node.appendChild(document.createElement('br'));
      node.appendChild(document.createTextNode(lines[i]));
    }
  }

  function reserveHeight() {
    const states = plannedStates();
    if (!states.length || !element.parentNode) return;

    const cs = getComputedStyle(element);
    const padY = parseFloat(cs.paddingTop) + parseFloat(cs.paddingBottom);
    const borderY = parseFloat(cs.borderTopWidth) + parseFloat(cs.borderBottomWidth);

    const probe = element.cloneNode(false);
    probe.style.minHeight = '0';
    probe.style.height = 'auto';
    probe.style.visibility = 'hidden';
    probe.style.pointerEvents = 'none';
    element.parentNode.insertBefore(probe, element.nextSibling);

    let tallest = 0;
    for (let i = 0; i < states.length; i++) {
      fill(probe, states[i]);
      const h = probe.getBoundingClientRect().height;
      if (h > tallest) tallest = h;
    }
    probe.parentNode.removeChild(probe);

    if (!tallest) return;
    // min-height addresses the content box unless the element is
    // border-box, in which case the frame has to be added back.
    const content = tallest - padY - borderY;
    const reserve = cs.boxSizing === 'border-box' ? tallest : content;
    if (reserve > 0) element.style.minHeight = reserve + 'px';
  }

  reserveHeight();
  // The line count depends on where the text wraps, and that changes with
  // the column width and with the webfont replacing whatever stood in for it
  // during the first paint. The resize handler is bound once for the life of
  // the page and always calls the current run's version, so a live style
  // switch (which starts a fresh run) does not stack another listener.
  if (document.fonts && document.fonts.ready && document.fonts.ready.then) {
    document.fonts.ready.then(function () { if (!run.cancelled) reserveHeight(); });
  }
  // The type being measured is the SKIN's, and the skin sheet is a <link>
  // js/theme-bootstrap.js appends in <head> (data-style-asset). Warm in the
  // HTTP cache it applies before these deferred scripts run; cold — which is
  // exactly the first load after switching to a style — it can land after
  // them, and the reservation gets made against the DEFAULT sheet's 70px/1.2
  // type. The masthead column is bottom-anchored (css/styles.css), so a
  // min-height left over from taller type falls as slack under the last line
  // and the headline floats up off the standfirst instead of sitting flush on
  // it: bauhaus reserves the default's 252px, then sets three lines of 58px
  // in 200px. fonts.ready does not cover this — it can resolve before the
  // sheet lands, and the sheet is what decides the size, not just the face.
  // So re-measure as each sheet lands, with window load as the backstop for
  // any that had already landed by the time the listener went on. The links
  // are listened to unconditionally rather than skipping the ones that look
  // settled: a link.sheet is readable well before the sheet has actually
  // arrived, so it can't be used to tell the two apart, and a load listener
  // on a sheet that is genuinely done simply never fires. Load alone would
  // not do — it waits on the portrait and the CDN scripts too, so on a slow
  // connection the headline would sit wrong for seconds before snapping.
  Array.prototype.forEach.call(
    document.querySelectorAll('link[data-style-asset]'),
    function (link) {
      link.addEventListener('load', function () {
        if (!run.cancelled) reserveHeight();
      });
    }
  );
  if (document.readyState !== 'complete') {
    window.addEventListener('load', function () {
      if (!run.cancelled) reserveHeight();
    }, { once: true });
  }
  startTypingSequence._reserve = reserveHeight;
  if (!startTypingSequence._resizeBound) {
    startTypingSequence._resizeBound = true;
    window.addEventListener('resize', function () {
      if (startTypingSequence._reserve) startTypingSequence._reserve();
    });
  }

  let newlineCount = 0;
  let newlineCbFired = false;

  function setCursorBlink(on) {
    if (usesCursor) cursor.style.animation = on ? 'blink 1s infinite' : 'none';
  }

  function insertBreak() {
    endWord();
    element.insertBefore(document.createElement('br'), cursor);
    newlineCount++;
    if (
      !newlineCbFired &&
      config.onNewlineCount &&
      newlineCount >= config.onNewlineCount.count &&
      typeof config.onNewlineCount.callback === 'function'
    ) {
      newlineCbFired = true;
      config.onNewlineCount.callback();
    }
  }

  function makeGlyph(ch) {
    const span = document.createElement('span');
    span.className = newlineCount >= 2 ? 'tw typing-accent' : 'tw';
    span.textContent = ch;
    return span;
  }

  // Collect all text/br/glyph nodes before the cursor so we can delete from
  // the end. Nodes already mid-drain are skipped — they're awaiting removal.
  // Word boxes are stepped THROUGH rather than reported: they exist purely to
  // stop the line breaker splitting a word (see glyphHost above), so the rest
  // of the engine keeps seeing one flat run of glyphs, spaces and <br>s in
  // document order, exactly as it did before they were introduced.
  function getContentNodes() {
    const nodes = [];
    let child = element.firstChild;
    while (child && child !== cursor) {
      if (!draining.has(child)) {
        if (child.nodeType === Node.ELEMENT_NODE && child.classList &&
            child.classList.contains('tw-word')) {
          for (let g = child.firstChild; g; g = g.nextSibling) {
            if (!draining.has(g)) nodes.push(g);
          }
        } else {
          nodes.push(child);
        }
      }
      child = child.nextSibling;
    }
    return nodes;
  }

  function runStep(index) {
    if (index >= steps.length) {
      setCursorBlink(true);
      if (typeof config.onComplete === 'function') config.onComplete();
      return;
    }

    const step = steps[index];

    if (step.action === 'pause') {
      setCursorBlink(true);
      later(function () {
        runStep(index + 1);
      }, step.duration || 800);
      return;
    }

    if (step.action === 'type') {
      setCursorBlink(false);
      const text = step.text || '';

      if (mode === 'word') {
        // Whole words land at once (their glyph spans share one animation
        // start); the wait after each word is budgeted like per-char typing
        // so the overall pace matches the other modes.
        const tokens = text.split(/(\n| )/).filter(function (t) { return t !== ''; });
        let tokenIdx = 0;

        function typeToken() {
          if (tokenIdx >= tokens.length) {
            runStep(index + 1);
            return;
          }
          const token = tokens[tokenIdx];
          tokenIdx++;
          if (token === '\n') {
            insertBreak();
            later(typeToken, typingDelay);
          } else if (token === ' ') {
            endWord();
            element.insertBefore(document.createTextNode(' '), cursor);
            later(typeToken, typingDelay);
          } else {
            const host = glyphHost();
            for (let i = 0; i < token.length; i++) {
              host.appendChild(makeGlyph(token.charAt(i)));
            }
            later(typeToken, typingDelay * token.length);
          }
        }

        typeToken();
        return;
      }

      let charIdx = 0;

      function typeChar() {
        if (charIdx < text.length) {
          const ch = text.charAt(charIdx);
          if (ch === '\n') {
            insertBreak();
          } else if (mode === 'letter') {
            if (ch === ' ') {
              endWord();
              element.insertBefore(document.createTextNode(' '), cursor);
            } else {
              glyphHost().appendChild(makeGlyph(ch));
            }
          } else if (newlineCount >= 2) {
            const prev = cursor.previousSibling;
            if (prev && prev.nodeType === Node.ELEMENT_NODE && prev.classList && prev.classList.contains('typing-accent')) {
              prev.appendChild(document.createTextNode(ch));
            } else {
              const span = document.createElement('span');
              span.className = 'typing-accent';
              span.appendChild(document.createTextNode(ch));
              element.insertBefore(span, cursor);
            }
          } else {
            element.insertBefore(document.createTextNode(ch), cursor);
          }
          charIdx++;
          later(typeChar, typingDelay);
        } else {
          runStep(index + 1);
        }
      }

      typeChar();
      return;
    }

    if (step.action === 'delete') {
      setCursorBlink(false);
      // Nothing types during a delete step, so closing the open word box once
      // here is enough: whatever gets retyped afterwards starts its own.
      endWord();
      let remaining = step.count || 0;

      // In the cursorless modes the last erased glyphs are still fading out
      // (and holding layout) when the count runs dry; wait out the drain so
      // the next type step doesn't land after ghosts and shift left.
      function finishDelete() {
        later(function () {
          runStep(index + 1);
        }, usesCursor ? 0 : ERASE_MS);
      }

      if (wordDelete) {
        // Words stamp out the way they stamped in: every glyph span of the
        // trailing word gets .tw-out on the same frame (one shared exit
        // animation, so the word moves as a unit) and drains together. The
        // separator run before it — the space or <br> that joined it to the
        // rest of the line — drains silently on the same beat. The wait
        // after each word is budgeted like the type side's
        // `typingDelay * token.length` (deleteDelay per character
        // consumed), so a delete step takes about the same overall time as
        // the per-char path, just grouped into slams.
        function deleteWord() {
          if (remaining <= 0) {
            finishDelete();
            return;
          }

          const nodes = getContentNodes();
          if (nodes.length === 0) {
            finishDelete();
            return;
          }

          let consumed = 0;

          // Trailing separators first (after the previous word fell, the
          // line ends in the whitespace that preceded it).
          while (remaining > 0 && nodes.length > 0) {
            const last = nodes[nodes.length - 1];
            if (last.nodeType === Node.TEXT_NODE && /^\s*$/.test(last.textContent)) {
              drainOut(last);
            } else if (last.nodeName === 'BR') {
              drainOut(last);
              newlineCount = Math.max(0, newlineCount - 1);
            } else {
              break;
            }
            nodes.pop();
            remaining--;
            consumed++;
          }

          // The word itself: the contiguous run of trailing glyph spans,
          // capped at the step's remaining count so per-char delete counts
          // keep their meaning (a count ending mid-word takes only that
          // word's trailing glyphs).
          while (remaining > 0 && nodes.length > 0) {
            const last = nodes[nodes.length - 1];
            if (last.nodeType === Node.ELEMENT_NODE && last.classList && last.classList.contains('tw')) {
              last.classList.add('tw-out');
              drainOut(last);
              nodes.pop();
              remaining--;
              consumed++;
            } else {
              break;
            }
          }

          // Anything else trailing (defensive — word-mode content is only
          // glyph spans, spaces, and <br>s): take one char the per-char way
          // so the loop can't stall.
          if (consumed === 0 && remaining > 0 && nodes.length > 0) {
            const last = nodes[nodes.length - 1];
            if (last.nodeType === Node.TEXT_NODE && last.textContent.length > 1) {
              last.textContent = last.textContent.slice(0, -1);
            } else {
              drainOut(last);
            }
            remaining--;
            consumed = 1;
          }

          later(deleteWord, deleteDelay * Math.max(consumed, 1));
        }

        deleteWord();
        return;
      }

      function deleteChar() {
        if (remaining <= 0) {
          finishDelete();
          return;
        }

        const nodes = getContentNodes();
        if (nodes.length === 0) {
          finishDelete();
          return;
        }

        const last = nodes[nodes.length - 1];

        if (last.nodeType === Node.TEXT_NODE) {
          if (last.textContent.length > 1) {
            last.textContent = last.textContent.slice(0, -1);
          } else if (usesCursor) {
            element.removeChild(last);
          } else {
            // A deleted space holds its slot through the drain so the
            // fading glyphs to its right don't jump left.
            drainOut(last);
          }
          remaining--;
          later(deleteChar, deleteDelay);
        } else if (last.nodeName === 'BR') {
          if (usesCursor) {
            element.removeChild(last);
          } else {
            drainOut(last);
          }
          newlineCount = Math.max(0, newlineCount - 1);
          remaining--;
          later(deleteChar, deleteDelay);
        } else if (last.nodeType === Node.ELEMENT_NODE && last.classList && last.classList.contains('tw')) {
          // Cursorless glyphs erase in place: the exit class runs the skin's
          // animation while the drain holds layout, then the node leaves
          // the DOM.
          last.classList.add('tw-out');
          drainOut(last);
          remaining--;
          later(deleteChar, deleteDelay);
        } else if (last.nodeType === Node.ELEMENT_NODE && last.classList && last.classList.contains('typing-accent')) {
          const txt = last.textContent;
          if (txt.length > 1) {
            last.textContent = txt.slice(0, -1);
          } else if (last.parentNode) {
            last.parentNode.removeChild(last);
          }
          remaining--;
          later(deleteChar, deleteDelay);
        } else {
          element.removeChild(last);
          remaining--;
          later(deleteChar, deleteDelay);
        }
      }

      deleteChar();
      return;
    }

    if (step.action === 'callback') {
      if (typeof step.fn === 'function') step.fn();
      runStep(index + 1);
      return;
    }

    // Unknown action, skip
    runStep(index + 1);
  }

  runStep(0);
}

// Replay the most recently started sequence from scratch. js/theme-cycler.js
// calls this on every live style switch so the masthead re-renders in the
// incoming style's typing grammar (caret vs glyph spans, fresh spacing)
// instead of carrying the old mode's DOM. The reveal callbacks inside the
// sequence are idempotent (js/script.js guards them), so only the type
// itself re-runs.
window.__restartTypingSequence = function () {
  if (startTypingSequence._lastConfig) startTypingSequence(startTypingSequence._lastConfig);
};
