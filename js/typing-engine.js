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
 */
function startTypingSequence(config) {
  const element = document.getElementById(config.elementId);
  if (!element) return;

  const typingDelay = config.typingDelay || 75;
  const deleteDelay = config.deleteDelay || 40;
  const sequences   = config.sequences || [];
  if (sequences.length === 0) return;

  const steps = sequences[Math.floor(Math.random() * sequences.length)];

  const cursor = document.createElement('span');
  cursor.className = 'cursor';
  element.appendChild(cursor);

  let newlineCount = 0;
  let newlineCbFired = false;

  function setCursorBlink(on) {
    cursor.style.animation = on ? 'blink 1s infinite' : 'none';
  }

  // Collect all text/br nodes before the cursor so we can delete from the end.
  function getContentNodes() {
    const nodes = [];
    let child = element.firstChild;
    while (child && child !== cursor) {
      nodes.push(child);
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
      let charIdx = 0;

      function typeChar() {
        if (charIdx < text.length) {
          const ch = text.charAt(charIdx);
          if (ch === '\n') {
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

      function deleteChar() {
        if (remaining <= 0) {
          runStep(index + 1);
          return;
        }

        const nodes = getContentNodes();
        if (nodes.length === 0) {
          runStep(index + 1);
          return;
        }

        const last = nodes[nodes.length - 1];

        if (last.nodeType === Node.TEXT_NODE) {
          if (last.textContent.length > 1) {
            last.textContent = last.textContent.slice(0, -1);
          } else {
            element.removeChild(last);
          }
          remaining--;
          setTimeout(deleteChar, deleteDelay);
        } else if (last.nodeName === 'BR') {
          element.removeChild(last);
          newlineCount = Math.max(0, newlineCount - 1);
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
