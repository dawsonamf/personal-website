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
 */
function startTypingSequence(config) {
  const element = document.getElementById(config.elementId);
  if (!element) return;

  const typingDelay = config.typingDelay || 75;
  const deleteDelay = config.deleteDelay || 40;
  const sequences   = config.sequences || [];
  if (sequences.length === 0) return;

  const mode = config.mode ||
    (typeof window.__styleTypingMode === 'function' ? window.__styleTypingMode() : 'cursor');
  const usesCursor = mode !== 'letter' && mode !== 'word';

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
      if (node.parentNode) node.parentNode.removeChild(node);
    }, ERASE_MS);
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

  let newlineCount = 0;
  let newlineCbFired = false;

  function setCursorBlink(on) {
    if (usesCursor) cursor.style.animation = on ? 'blink 1s infinite' : 'none';
  }

  function insertBreak() {
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
  function getContentNodes() {
    const nodes = [];
    let child = element.firstChild;
    while (child && child !== cursor) {
      if (!draining.has(child)) nodes.push(child);
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
      setTimeout(function () {
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
            setTimeout(typeToken, typingDelay);
          } else if (token === ' ') {
            element.insertBefore(document.createTextNode(' '), cursor);
            setTimeout(typeToken, typingDelay);
          } else {
            for (let i = 0; i < token.length; i++) {
              element.insertBefore(makeGlyph(token.charAt(i)), cursor);
            }
            setTimeout(typeToken, typingDelay * token.length);
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
              element.insertBefore(document.createTextNode(' '), cursor);
            } else {
              element.insertBefore(makeGlyph(ch), cursor);
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
          setTimeout(typeChar, typingDelay);
        } else {
          runStep(index + 1);
        }
      }

      typeChar();
      return;
    }

    if (step.action === 'delete') {
      setCursorBlink(false);
      let remaining = step.count || 0;

      // In the cursorless modes the last erased glyphs are still fading out
      // (and holding layout) when the count runs dry; wait out the drain so
      // the next type step doesn't land after ghosts and shift left.
      function finishDelete() {
        setTimeout(function () {
          runStep(index + 1);
        }, usesCursor ? 0 : ERASE_MS);
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
          setTimeout(deleteChar, deleteDelay);
        } else if (last.nodeName === 'BR') {
          if (usesCursor) {
            element.removeChild(last);
          } else {
            drainOut(last);
          }
          newlineCount = Math.max(0, newlineCount - 1);
          remaining--;
          setTimeout(deleteChar, deleteDelay);
        } else if (last.nodeType === Node.ELEMENT_NODE && last.classList && last.classList.contains('tw')) {
          // Cursorless glyphs erase in place: the exit class runs the skin's
          // animation while the drain holds layout, then the node leaves
          // the DOM.
          last.classList.add('tw-out');
          drainOut(last);
          remaining--;
          setTimeout(deleteChar, deleteDelay);
        } else if (last.nodeType === Node.ELEMENT_NODE && last.classList && last.classList.contains('typing-accent')) {
          const txt = last.textContent;
          if (txt.length > 1) {
            last.textContent = txt.slice(0, -1);
          } else {
            element.removeChild(last);
          }
          remaining--;
          setTimeout(deleteChar, deleteDelay);
        } else {
          element.removeChild(last);
          remaining--;
          setTimeout(deleteChar, deleteDelay);
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
