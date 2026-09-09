# Mega menu — "top curtain" alternative

The Theme mega menu currently ships as **pill morph**. During the geometry
review, **top curtain** was the runner-up and may be swapped in. This file is
the complete spec for that swap, written to be executable from a cold start
with no prior context.

Both share all content, behaviour and markup. **Only the panel's geometry and
its reveal differ.** Nothing in `injectDom()`, `renderPresets()`,
`paintPreview()` or `stampStagger()` changes.

## The two, in one line each

| | Pill morph (shipping) | Top curtain (this doc) |
|---|---|---|
| Anchor | Hangs off the pill's right edge | Pinned to the top of the viewport |
| Width | Starts at the pill's width, animates to 940px | Full viewport width, no width animation |
| Reveal | Height opens **and** width widens | Height only |
| Pill | Sits above the panel, unchanged | Rides **on top of** the curtain |
| Feel | The menu grows into a panel | A sheet drops over the head of the page |

## Files touched

1. `css/theme-cycler.css` — the `.tc-dock.tc-mega` block
2. `js/theme-cycler.js` — the `position()` function inside `wireNavDropdown()`

That is the entire change surface.

---

## 1. CSS

In `css/theme-cycler.css`, find the `.tc-dock.tc-mega` and
`.tc-dock.tc-mega.tc-mega-open` rules in the MEGA PANEL section.

**Replace both with:**

```css
.tc-dock.tc-mega {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: auto;
  z-index: 9999;
  padding: 0;
  display: grid;
  grid-template-rows: 0fr;
  overflow: hidden;
  max-height: none;
  /* Full bleed: no width animation, so the reveal is purely height. */
  width: 100%;
  max-width: none;
  border-radius: 0 0 var(--border-radius) var(--border-radius);
  opacity: 0;
  transition: grid-template-rows 0.42s cubic-bezier(0.22, 0.61, 0.36, 1),
              opacity 0.2s ease;
}

.tc-dock.tc-mega.tc-mega-open {
  grid-template-rows: 1fr;
  opacity: 1;
}
```

**Then add**, immediately after the `.tc-mega-inner` rule:

```css
/* The curtain starts at the top of the viewport and the pill rides on top of
   it, so the content clears the pill's height. JS writes --tc-curtain-top
   from the pill's own rect on every open; the fallback covers first paint. */
.tc-mega-inner {
  padding-top: var(--tc-curtain-top, 88px);
  max-width: 1200px;
  margin: 0 auto;
}

/* The pill must paint above the curtain, not under it. Both menus are given
   a stacking context by their own backdrop-filter, so only z-index is
   needed. 10000 clears the panel's 9999 and stays under #cursor-container. */
.static-menu,
.moving-menu,
.static-menu-mobile { z-index: 10000; }
```

> **Why `.tc-mega-inner` gets the max-width here:** with a full-bleed panel the
> ground spans the window but the type must stay on the site's 1200px measure,
> or the columns drift wider than every other element on the page.

In the `@media (max-width: 1100px)` block, **replace** the width override:

```css
  /* was: width / max-width calc(100vw - 20px) */
  .tc-dock.tc-mega,
  .tc-dock.tc-mega.tc-mega-open {
    width: 100%;
    max-width: none;
    border-radius: 0;
  }
```

and **add** to that same block:

```css
  .tc-mega-inner { padding-top: var(--tc-curtain-top, 76px); }
```

---

## 2. JS

In `js/theme-cycler.js`, inside `wireNavDropdown()`, **replace the whole
`position()` function** with:

```js
    // Top curtain: the panel is pinned to the top of the viewport and spans
    // it. Nothing to anchor horizontally — the only measurement needed is how
    // far down the content must start so the pill, which rides on top of the
    // curtain, does not cover the first row.
    function position(li) {
      const pill = pillFor(li);
      const r = pill.getBoundingClientRect();
      dock.style.top = '0px';
      dock.style.right = '';
      dock.style.removeProperty('--tc-mega-w');
      dock.style.removeProperty('--tc-mega-target');
      dock.style.setProperty('--tc-curtain-top', Math.round(r.bottom + 16) + 'px');
    }
```

**Also simplify `open()`** — the double-`requestAnimationFrame` exists only to
give the width transition a frame at the pill's width before widening. With no
width animation it is dead weight. Replace the `if (reopening) { … } else { … }`
block with:

```js
      dock.classList.add('tc-mega-open');
```

and delete the now-unused `const reopening = !openItem;` line above it.

The `MEASURE` and `EDGE` constants become unused; delete both.

---

## 3. Verify

No build step — reload and check. The panel must:

- span the full window width, with the ground reaching both edges
- keep its text on the 1200px measure, aligned with the page's other content
- open by height only, with no horizontal movement at all
- keep the pill fully visible and clickable **on top of** the curtain
- put the first row of styles below the pill, never behind it
- still repaint the preview card on hover (unchanged behaviour)

Check from both menus: the static header pill, and the scroll-up moving pill.

## Non-negotiable, whichever geometry is used

**The panel must stay parented to `<body>`.** `.moving-menu` carries
`backdrop-filter: blur(20px)` (`css/styles.css`), and an element with a
backdrop-filter becomes the *containing block* for its fixed and absolutely
positioned descendants. A panel rendered inside the pill collapses to the
pill's ~500px regardless of the width set on it, because the width resolves
against the wrong box. `injectDom()` appends to `document.body` for this
reason, and the same trap is why the older compact dock had a "floating mode"
that reparented to body. Do not move it back inside the menu.
