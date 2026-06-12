// Loaded synchronously before first paint so --text50, --bg50, etc. resolve
// on the first stylesheet read, and so a persisted style version (data-style,
// its tokens, and its CSS) applies with no flash of the default site.
// Flip THEME_CYCLER_ENABLED to kill the cycler UI and its persisted overrides.
(function () {
  // Gate read by js/theme-cycler.js via window.__THEME_CYCLER_ENABLED.
  var THEME_CYCLER_ENABLED = true;
  window.__THEME_CYCLER_ENABLED = THEME_CYCLER_ENABLED;

  // ---- Style registry -----------------------------------------------------
  // One entry per style version (architecture in docs/THEMES.md).
  // The default entry stamps no attribute and loads no assets, so default
  // visitors get the site unchanged. Asset paths are root-absolute so they
  // resolve from subdirectory pages.
  var REGISTRY = {
    'default': {
      id: 'default',
      label: 'Default',
      polarity: 'dark',
      colors: { text:'#e6f1ff', bg:'#1d1d1d', primary:'#61ffda', secondary:'#2c2c2c', accent:'#61ffda' },
    },
    'studio': {
      id: 'studio',
      label: 'Studio',
      polarity: 'light',
      flags: { tilt: false, still: true },
      // Cursorless masthead: print doesn't have a caret — copy fades in a
      // word at a time (js/typing-engine.js reads this via __styleTypingMode).
      typing: 'word',
      colors: { text:'#1b1a17', bg:'#f4f2ec', primary:'#d44000', secondary:'#e9e6dd', accent:'#d44000' },
      // Random-palette profile (consumed by js/theme-cycler.js): quiet paper
      // and ink, with the saturation in primary/accent only.
      random: {
        light: {
          sat: [0.05, 0.30],
          roles: [
            { l: [0.06, 0.12], hueT: 0 },                       // text: ink
            { l: [0.92, 0.96], hueT: 0 },                       // bg: paper
            // primary/accent lightness is capped low so even yellow hues
            // stay readable on paper.
            { l: [0.32, 0.44], hueT: 1.00, sat: [0.80, 1.00] }, // primary: one hot editorial color
            { l: [0.84, 0.90], hueT: 0 },                       // secondary: deeper paper
            { l: [0.36, 0.50], hueT: 0.75, sat: [0.75, 1.00] }, // accent
          ],
        },
        dark: {
          sat: [0.05, 0.25],
          roles: [
            { l: [0.88, 0.94], hueT: 0 },                       // text: warm white ink
            { l: [0.08, 0.12], hueT: 0 },                       // bg: night paper
            { l: [0.55, 0.65], hueT: 1.00, sat: [0.75, 1.00] },
            { l: [0.14, 0.20], hueT: 0 },
            { l: [0.58, 0.68], hueT: 0.75, sat: [0.70, 1.00] },
          ],
        },
      },
      tokens: {
        '--font-body': "'Inter', sans-serif",
        '--font-heading': "'Space Grotesk', sans-serif",
        '--border-radius': '0px',
        '--radius-pill': '0px',
        '--neutral-gray': '#6f6a60',
        '--jobs-menu-navy-dark': '#e9e6dd',
        '--jobs-menu-navy': '#dedacf',
        '--jobs-menu-slate': '#6b675e',
      },
      fonts: ['https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Space+Grotesk:wght@500;600;700&display=swap'],
      css: '/css/themes/studio.css',
    },
    'brutalist': {
      id: 'brutalist',
      label: 'Brutalist',
      polarity: 'light',
      // tilt gates the hover physics via window.__styleAllowsTilt below.
      // still and tilt also stamp html attributes read by css/themes/theme-base.css.
      flags: { tilt: false, still: true },
      colors: { text:'#0a0a0a', bg:'#ffe600', primary:'#1400ff', secondary:'#ffffff', accent:'#1400ff' },
      // Random-palette profile: acid poster. The ground is the loud color,
      // panels stay paper, and primary is capped dark enough (max 0.40 L)
      // to read as ink on the bright ground. Dark mode is the inverted
      // flyer, acid text and electric marks on ink.
      random: {
        light: {
          sat: [0.85, 1.00],
          roles: [
            { l: [0.02, 0.08], hueT: 0, sat: [0.00, 0.30] }, // text: true ink, flyers print black
            { l: [0.47, 0.60], hueT: 0 },                    // bg: acid ground
            { l: [0.26, 0.40], hueT: 1.00 },  // primary: electric interactive
            { l: [0.92, 0.99], hueT: 0 },     // secondary: paper panels (pale tint)
            { l: [0.28, 0.42], hueT: 0.75 },  // accent
          ],
        },
        dark: {
          sat: [0.85, 1.00],
          roles: [
            { l: [0.50, 0.62], hueT: 0 },     // text: acid on ink
            { l: [0.03, 0.09], hueT: 0 },     // bg: ink ground
            { l: [0.55, 0.68], hueT: 1.00 },  // primary
            { l: [0.10, 0.16], hueT: 0 },     // secondary: dark panel
            { l: [0.55, 0.66], hueT: 0.75 },  // accent
          ],
        },
      },
      tokens: {
        '--font-body': "'Archivo', sans-serif",
        '--font-heading': "'Archivo Black', sans-serif",
        '--font-mono': "'Courier New', Courier, monospace",
        '--border-radius': '0px',
        '--radius-pill': '0px',
        '--neutral-gray': '#5a5648',
        '--jobs-menu-navy-dark': '#0a0a0a',
        '--jobs-menu-navy': '#0a0a0a',
        '--jobs-menu-slate': '#6b6552',
      },
      fonts: ['https://fonts.googleapis.com/css2?family=Archivo:wght@400;500;700&family=Archivo+Black&display=swap'],
      css: '/css/themes/brutalist.css',
    },
    'broadsheet': {
      id: 'broadsheet',
      label: 'Broadsheet',
      polarity: 'light',
      flags: { tilt: false, still: true },
      // The masthead sets like type on a press: word-at-a-time, no caret.
      typing: 'word',
      colors: { text:'#1c1710', bg:'#f5efe2', primary:'#a31621', secondary:'#ece3cf', accent:'#a31621' },
      tokens: {
        '--font-body': "'Lora', serif",
        '--font-heading': "'Playfair Display', serif",
        '--border-radius': '0px',
        '--radius-pill': '0px',
        '--neutral-gray': '#6f6757',
        '--jobs-menu-navy-dark': '#ece3cf',
        '--jobs-menu-navy': '#e2d7bc',
        '--jobs-menu-slate': '#6b6147',
      },
      fonts: ['https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400;0,500;0,600;1,400&family=Playfair+Display:ital,wght@0,500;0,700;0,900;1,500&display=swap'],
      css: '/css/themes/broadsheet.css',
    },
    'field-notes': {
      id: 'field-notes',
      label: 'Field Notes',
      polarity: 'light',
      // No still flag: AOS entrances and the cursor dot stay on. Tilt is off,
      // though — taped-down photographs don't wiggle under their tape.
      flags: { tilt: false },
      colors: { text:'#33291a', bg:'#ece2cb', primary:'#3f6f4f', secondary:'#f7f0df', accent:'#b3502a' },
      tokens: {
        '--font-body': "'Spectral', serif",
        '--font-heading': "'Zilla Slab', serif",
        '--font-mono': "'IBM Plex Mono', monospace",
        '--border-radius': '6px',
        '--radius-pill': '4px',
        '--neutral-gray': '#6e6350',
        '--jobs-menu-navy-dark': '#e3d8bf',
        '--jobs-menu-navy': '#d8c9a6',
        '--jobs-menu-slate': '#6e6350',
      },
      fonts: ['https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;600&family=Spectral:ital,wght@0,400;0,600;1,400&family=Zilla+Slab:wght@500;600&display=swap'],
      css: '/css/themes/field-notes.css',
    },
    'blueprint': {
      id: 'blueprint',
      label: 'Blueprint',
      polarity: 'dark',
      flags: { tilt: false, still: true },
      colors: { text:'#e9f2fb', bg:'#0c3a62', primary:'#8fc1ee', secondary:'#0a2e4f', accent:'#ffd23f' },
      tokens: {
        '--font-body': "'Saira', sans-serif",
        '--font-heading': "'Saira Condensed', sans-serif",
        '--font-mono': "'IBM Plex Mono', monospace",
        '--border-radius': '0px',
        '--radius-pill': '0px',
        '--neutral-gray': '#90a9c3',
        '--jobs-menu-navy-dark': '#0a2e4f',
        '--jobs-menu-navy': '#11436f',
        '--jobs-menu-slate': '#7fa0c0',
      },
      fonts: ['https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;600&family=Saira:wght@400;500&family=Saira+Condensed:wght@500;700&display=swap'],
      css: '/css/themes/blueprint.css',
    },
    'doodle': {
      id: 'doodle',
      label: 'Doodle',
      polarity: 'light',
      // Tilt off: sketches lie flat on the page. No still flag — AOS
      // entrances and the cursor follower stay (the follower restyles into
      // a pencil point in the skin sheet).
      flags: { tilt: false },
      colors: { text:'#2b2b2b', bg:'#fdfbf4', primary:'#2f6fde', secondary:'#fff3a3', accent:'#e2483d' },
      // Cursorless masthead: each letter draws itself in by hand and rubs
      // out under an eraser (the skin animates the engine's glyph spans).
      typing: 'letter',
      tokens: {
        '--font-body': "'Patrick Hand', cursive",
        '--font-heading': "'Patrick Hand', cursive",
        // The uneven-radius trick rides the tokens, so every token-rounded
        // surface wobbles like it was drawn by hand. --font-mono stays the
        // default: code keeps a real mono face.
        '--border-radius': '255px 15px 225px 15px / 15px 225px 15px 255px',
        '--radius-pill': '255px 15px 225px 15px / 15px 225px 15px 255px',
        '--neutral-gray': '#8f8a7c',
        // Selected jobs entry reads as a highlighted line: sticky yellow.
        '--jobs-menu-navy-dark': '#fff3a3',
        '--jobs-menu-navy': '#f4f0e0',
        '--jobs-menu-slate': '#6e6a5e',
      },
      fonts: ['https://fonts.googleapis.com/css2?family=Caveat:wght@600&family=Patrick+Hand&display=swap'],
      css: '/css/themes/doodle.css',
    },
    'vapor': {
      id: 'vapor',
      label: 'Vaporwave',
      polarity: 'dark',
      // No flags: tilt stays on and the motion pack stays — the one skin
      // that turns the dials up instead of down.
      colors: { text:'#f3eaff', bg:'#20094a', primary:'#ff2ec4', secondary:'#2c1160', accent:'#00e5ff' },
      // Cursorless masthead: each glyph is a neon tube that flickers alight
      // (the skin animates the engine's glyph spans).
      typing: 'letter',
      tokens: {
        '--font-body': "'Exo 2', sans-serif",
        '--font-heading': "'Exo 2', sans-serif",
        '--border-radius': '14px',
        '--radius-pill': '999px',
        '--neutral-gray': '#8f7fb8',
        '--jobs-menu-navy-dark': '#2c1160',
        '--jobs-menu-navy': '#341473',
        '--jobs-menu-slate': '#9d8ec7',
      },
      fonts: ['https://fonts.googleapis.com/css2?family=Exo+2:ital,wght@0,400;0,600;0,800;1,800&family=Monoton&display=swap'],
      css: '/css/themes/vapor.css',
    },
    'wheatpaste': {
      id: 'wheatpaste',
      label: 'Street Poster',
      polarity: 'dark',
      // still kills the scroll entrances, the cursor follower, and the dock
      // lifts — nothing here animates smoothly. Tilt stays ON: a hovered
      // paste-up peels off the wall (base rotation lives on wrappers and
      // chips only, never on tilt targets).
      flags: { still: true },
      colors: { text:'#f0ede4', bg:'#1f2125', primary:'#d4242a', secondary:'#2e3238', accent:'#c8ff3d' },
      tokens: {
        '--font-body': "'Special Elite', cursive",
        '--font-heading': "'Anton', sans-serif",
        // --font-mono stays the default: code keeps a real mono face.
        '--border-radius': '0px',
        '--radius-pill': '0px',
        '--neutral-gray': '#8a8d85',
        '--jobs-menu-navy-dark': '#2e3238',
        '--jobs-menu-navy': '#272a2f',
        '--jobs-menu-slate': '#9a958a',
      },
      fonts: ['https://fonts.googleapis.com/css2?family=Anton&family=Inter:wght@400;600&family=Permanent+Marker&family=Special+Elite&display=swap'],
      css: '/css/themes/wheatpaste.css',
    },
    'bauhaus': {
      id: 'bauhaus',
      label: 'Bauhaus',
      polarity: 'light',
      // Tilt off: poster geometry lies flat on the sheet. No still flag —
      // AOS entrances stay (motion limited to hard slide-ins) and the
      // cursor follower stays: a blue circle-and-dot is already on-grammar.
      flags: { tilt: false },
      colors: { text:'#14110d', bg:'#f2eee6', primary:'#e0311f', secondary:'#ffffff', accent:'#1c52b5' },
      tokens: {
        '--font-body': "'Jost', sans-serif",
        '--font-heading': "'Jost', sans-serif",
        // --font-mono stays the default: code keeps a real mono face.
        '--border-radius': '0px',
        '--radius-pill': '0px',
        '--neutral-gray': '#6f6a60',
        // Selected jobs entry reads as a white exhibition panel.
        '--jobs-menu-navy-dark': '#ffffff',
        '--jobs-menu-navy': '#e7e2d4',
        '--jobs-menu-slate': '#6f6a60',
      },
      fonts: ['https://fonts.googleapis.com/css2?family=Jost:wght@400;500;600&display=swap'],
      css: '/css/themes/bauhaus.css',
    },
    'chinoiserie': {
      id: 'chinoiserie',
      label: 'Porcelain',
      polarity: 'light',
      // Tilt off: porcelain doesn't wobble. No still flag — entrances and
      // the cursor follower stay (the follower's accent dot reads as gilt).
      flags: { tilt: false },
      // Cursorless masthead: each glyph blooms in like cobalt soaking into
      // glaze (the skin animates the engine's glyph spans).
      typing: 'letter',
      colors: { text:'#22335c', bg:'#f6f8f3', primary:'#2c4f9e', secondary:'#ffffff', accent:'#b08d3e' },
      tokens: {
        '--font-body': "'EB Garamond', serif",
        '--font-heading': "'Marcellus', serif",
        // --font-mono stays the default: code keeps a real mono face.
        '--border-radius': '16px',
        '--radius-pill': '999px',
        '--neutral-gray': '#76809f',
        '--jobs-menu-navy-dark': '#ffffff',
        '--jobs-menu-navy': '#e9eef8',
        '--jobs-menu-slate': '#5d6c94',
      },
      fonts: ['https://fonts.googleapis.com/css2?family=EB+Garamond:ital,wght@0,400;0,500;0,600;1,400&family=Marcellus&display=swap'],
      css: '/css/themes/chinoiserie.css',
    },
    'banknote': {
      id: 'banknote',
      label: 'Banknote',
      polarity: 'light',
      // Tilt off and fully still: engraved certificates do not move.
      flags: { tilt: false, still: true },
      // Cursorless masthead: engraved print sets word-at-a-time, no caret —
      // each word presses onto the security paper like one intaglio pass.
      typing: 'word',
      // Currency duotone: treasury-green intaglio ink on green-tinted
      // security paper; the accent role is the second ink, overprint red
      // (serials, stamps, SPECIMEN marks). No gold — foil gilt read as
      // chinoiserie's gilt thread.
      colors: { text:'#1c281d', bg:'#dee3cb', primary:'#1a5b3d', secondary:'#eff1de', accent:'#9c3a2a' },
      tokens: {
        '--font-body': "'Libre Caslon Text', serif",
        '--font-heading': "'Cinzel', serif",
        '--font-mono': "'IBM Plex Mono', monospace",
        '--border-radius': '0px',
        '--radius-pill': '0px',
        '--neutral-gray': '#6d7a64',
        // Selected jobs entry reads as the bright bond panel; hover is a
        // deeper green-paper wash.
        '--jobs-menu-navy-dark': '#eff1de',
        '--jobs-menu-navy': '#cfd8b6',
        '--jobs-menu-slate': '#56624f',
      },
      fonts: ['https://fonts.googleapis.com/css2?family=Caveat:wght@600&family=Cinzel:wght@700;900&family=IBM+Plex+Mono:wght@400;600&family=Libre+Caslon+Text:ital,wght@0,400;0,700;1,400&display=swap'],
      css: '/css/themes/banknote.css',
    },
    'grid': {
      id: 'grid',
      label: 'Swiss Grid',
      polarity: 'light',
      // Müller-Brockmann doesn't move: tilt off, fully still. The visible
      // column grid is drawn by the skin sheet, not a flag. No typing key:
      // the classic caret stays — the sheet recolors it Swiss red, the
      // masthead's one red mark. The skin sheet also brings the cursor
      // follower back (squared) by re-displaying #cursor-container over
      // theme-base's data-still hide.
      flags: { tilt: false, still: true },
      colors: { text:'#111111', bg:'#ffffff', primary:'#e30613', secondary:'#f4f4f4', accent:'#111111' },
      tokens: {
        // System Helvetica everywhere: the only zero-webfont-payload skin
        // (no fonts array). --font-mono stays the default: code keeps a
        // real mono face; the sheet retires mono from the site chrome.
        '--font-body': "'Helvetica Neue', Helvetica, Arial, sans-serif",
        '--font-heading': "'Helvetica Neue', Helvetica, Arial, sans-serif",
        '--border-radius': '0px',
        '--radius-pill': '0px',
        '--neutral-gray': '#6b6b6b',
        // Selected jobs entry reads as a light gray panel on the white sheet.
        '--jobs-menu-navy-dark': '#f4f4f4',
        '--jobs-menu-navy': '#ececec',
        '--jobs-menu-slate': '#6b6b6b',
      },
      css: '/css/themes/grid.css',
    },
    'gallery': {
      id: 'gallery',
      label: 'Gallery',
      polarity: 'light',
      // White cube: tilt off, fully still — hung works do not move. No
      // typing key: the classic caret stays, the one moving thing in the
      // room (the sheet thins it to an ink hairline). No accent color at
      // all — accent is decoration-grade gray, never set as text.
      flags: { tilt: false, still: true },
      colors: { text:'#1a1a1a', bg:'#ffffff', primary:'#1a1a1a', secondary:'#f7f7f7', accent:'#b9b9b9' },
      tokens: {
        // Inter only, 300/400/500 — display is 300, emphasis is 500,
        // never bold. --font-mono stays the default: code keeps a real
        // mono face; the sheet retires mono from the site chrome.
        '--font-body': "'Inter', sans-serif",
        '--font-heading': "'Inter', sans-serif",
        '--border-radius': '0px',
        '--radius-pill': '0px',
        '--neutral-gray': '#9b9b9b',
        // Jobs rail: rows rest on the white wall; hover is one gray step
        // and the thin ink rule does the marking.
        '--jobs-menu-navy-dark': '#ffffff',
        '--jobs-menu-navy': '#f7f7f7',
        '--jobs-menu-slate': '#6f6f6f',
      },
      fonts: ['https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500&display=swap'],
      css: '/css/themes/gallery.css',
    },
    'wanted': {
      id: 'wanted',
      label: 'Wanted',
      polarity: 'light',
      // Territorial reward poster: tilt off, fully still — handbills nailed
      // to a board do not move. Every hover is an ink-press hard cut.
      flags: { tilt: false, still: true },
      // Cursorless masthead: each glyph lands like a typebar strike — held
      // off the page a beat, one over-inked frame, then it settles clean
      // (the skin animates the engine's glyph spans; the Special Elite
      // body makes the typewriter grammar literal).
      typing: 'letter',
      colors: { text:'#3a2a18', bg:'#f0e2c0', primary:'#8c3b22', secondary:'#f7eed6', accent:'#b08945' },
      tokens: {
        '--font-body': "'Special Elite', cursive",
        '--font-heading': "'Rye', cursive",
        // --font-mono stays the default: code keeps a real mono face.
        '--border-radius': '0px',
        '--radius-pill': '0px',
        '--neutral-gray': '#8a7a5c',
        // Selected jobs entry reads as the bright handbill panel; hover is
        // a deeper sun-toasted parchment wash.
        '--jobs-menu-navy-dark': '#f7eed6',
        '--jobs-menu-navy': '#e4d2a6',
        '--jobs-menu-slate': '#7a6644',
      },
      fonts: ['https://fonts.googleapis.com/css2?family=Rye&family=Smokum&family=Special+Elite&display=swap'],
      css: '/css/themes/wanted.css',
    },
    'constructivist': {
      id: 'constructivist',
      label: 'Constructivist',
      polarity: 'light',
      // Merges theme-explorations tiles 06 (red wedge agitprop) + 06·B (Rodchenko's
      // 1924 advertising shout): one red, one black, unbleached paper.
      // Tilt off — posters lie flat — but no still flag: AOS fade-ups stay
      // as the agit entrances, and the cursor follower stays (accent is ink,
      // so the dot-and-ring reads as the black disc roaming the sheet).
      flags: { tilt: false },
      // Cursorless masthead: slogans stamp onto the sheet a word at a time,
      // each one slamming in like a press pass (the skin animates the
      // engine's glyph spans).
      typing: 'word',
      // ...and they leave the same way: dead slogans drop off the form a
      // whole word per beat, not a char-by-char backspace
      // (js/typing-engine.js reads this via __styleTypingDeleteMode).
      typingDelete: 'word',
      // accent is ink, not red — red stays scarce: active states and the
      // words being sold only (06·B's discipline).
      colors: { text:'#1d1a16', bg:'#f1e7d0', primary:'#d22b1f', secondary:'#e9ddbd', accent:'#1d1a16' },
      tokens: {
        '--font-body': "'Inter', sans-serif",
        '--font-heading': "'Anton', sans-serif",
        '--font-mono': "'IBM Plex Mono', monospace",
        '--border-radius': '0px',
        '--radius-pill': '0px',
        '--neutral-gray': '#7a7264',
        // Selected jobs entry reads as the solid ink block of the plan.
        '--jobs-menu-navy-dark': '#1d1a16',
        '--jobs-menu-navy': '#e0d3b2',
        '--jobs-menu-slate': '#6e6450',
      },
      fonts: ['https://fonts.googleapis.com/css2?family=Anton&family=IBM+Plex+Mono:wght@400;600&family=Inter:wght@400;500;700&display=swap'],
      css: '/css/themes/constructivist.css',
    },
    'miami-deco': {
      id: 'miami-deco',
      label: 'Miami Deco',
      polarity: 'light',
      // No flags: the friendliest deco keeps the tilt sway, the AOS
      // entrances, and the cursor follower (the accent ring reads as a
      // porthole roaming the sand).
      // Cursorless masthead: each glyph is a neon tube on the hotel sign
      // flickering alight (the skin animates the engine's glyph spans).
      typing: 'letter',
      // Ocean Drive 1939: deep-teal ink on sand, white hotel facades,
      // flamingo interactives, seafoam labels and rims. The sunset-gold
      // garnish (#f0b46a) lives only in the skin sheet's tri-color rules.
      colors: { text:'#1f3a44', bg:'#faf3e7', primary:'#e9688c', secondary:'#ffffff', accent:'#2fa8a0' },
      tokens: {
        '--font-body': "'Josefin Sans', sans-serif",
        '--font-heading': "'Poiret One', cursive",
        // --font-mono stays the default: code keeps a real mono face.
        '--border-radius': '18px',
        '--radius-pill': '999px',
        '--neutral-gray': '#7d8f96',
        // Selected jobs entry reads as the white facade panel; hover is a
        // deeper sand wash.
        '--jobs-menu-navy-dark': '#ffffff',
        '--jobs-menu-navy': '#f1e5cd',
        '--jobs-menu-slate': '#5d7681',
      },
      fonts: ['https://fonts.googleapis.com/css2?family=Josefin+Sans:ital,wght@0,400;0,600;0,700;1,400&family=Poiret+One&display=swap'],
      css: '/css/themes/miami-deco.css',
    },
    'neo-pop': {
      id: 'neo-pop',
      label: 'Pop Art',
      polarity: 'light',
      // Merges theme-explorations tiles 02 (neo-pop comic-brutalist) + PA·1
      // (Lichtenstein ben-day panel): thick ink keylines and hard offset
      // shadows with press-down physics from 02, dot screens, Bangers
      // onomatopoeia display, caption boxes, and starbursts from PA·1.
      // Tilt off — comic panels lie flat — but no still flag: AOS
      // entrances stay as the action beats, and the cursor follower stays
      // (the red dot-and-ring reads as a ben-day dot under the loupe).
      flags: { tilt: false },
      // Cursorless masthead: each glyph POWs in over-scale with a comic
      // bounce (the skin animates the engine's glyph spans).
      typing: 'letter',
      // Four-color press: ink on cream newsprint, white panels, ben-day
      // blue interactives, overprint red for the shout. The yellow caption
      // garnish (#ffe94f) lives only in the skin sheet's literal rules.
      colors: { text:'#14130f', bg:'#fff7e6', primary:'#005bbb', secondary:'#ffffff', accent:'#e4002b' },
      tokens: {
        '--font-body': "'Comic Neue', cursive",
        '--font-heading': "'Bangers', cursive",
        '--font-mono': "'IBM Plex Mono', monospace",
        '--border-radius': '0px',
        '--radius-pill': '0px',
        '--neutral-gray': '#8a8068',
        // Selected jobs entry reads as the yellow caption box; hover is a
        // deeper newsprint-cream wash.
        '--jobs-menu-navy-dark': '#ffe94f',
        '--jobs-menu-navy': '#f6e8c4',
        '--jobs-menu-slate': '#7a715c',
      },
      fonts: ['https://fonts.googleapis.com/css2?family=Bangers&family=Comic+Neue:ital,wght@0,400;0,700;1,400&family=IBM+Plex+Mono:wght@400;600&display=swap'],
      css: '/css/themes/neo-pop.css',
    },
  };
  var ORDER = ['default', 'brutalist', 'blueprint', 'field-notes', 'doodle', 'grid', 'miami-deco', 'bauhaus', 'chinoiserie', 'gallery', 'vapor', 'wanted', 'banknote', 'constructivist', 'neo-pop', 'broadsheet', 'studio', 'wheatpaste'];

  window.__THEME_REGISTRY = REGISTRY;
  window.__THEME_ORDER = ORDER;

  // Page scripts ask this before VanillaTilt.init; styles opt out via
  // flags.tilt. The default entry has no flags, so the default site keeps
  // tilting. Live switches are handled by js/theme-cycler.js, which
  // destroys running instances.
  window.__styleAllowsTilt = function () {
    var entry = REGISTRY[window.__ACTIVE_STYLE || 'default'];
    return !(entry && entry.flags && entry.flags.tilt === false);
  };

  // js/typing-engine.js asks this for the masthead reveal mode: 'cursor'
  // (the classic caret, the default), 'letter', or 'word'. Styles opt in
  // via a `typing` key on their registry entry.
  window.__styleTypingMode = function () {
    var entry = REGISTRY[window.__ACTIVE_STYLE || 'default'];
    return (entry && entry.typing) || 'cursor';
  };

  // js/typing-engine.js asks this for how the masthead erases: 'char' (one
  // glyph per tick, the default everywhere) or 'word' (a whole word's glyph
  // spans exit on one beat). Styles opt in via a `typingDelete` key on
  // their registry entry; only meaningful alongside a cursorless `typing`
  // mode — cursor-mode text has no glyph spans to group.
  window.__styleTypingDeleteMode = function () {
    var entry = REGISTRY[window.__ACTIVE_STYLE || 'default'];
    return (entry && entry.typingDelete) || 'char';
  };

  var STYLE_KEY   = 'dawson-style';
  var STORAGE_KEY = 'dawson-theme-cycler';
  var STEPS = [5,10,15,20,25,30,35,40,45,50,55,60,65,70,75,80,85,90,95];
  var root = document.documentElement;

  var isReload = false;
  try {
    var nav = performance.getEntriesByType('navigation')[0];
    isReload = !!(nav && nav.type === 'reload');
  } catch (e) {}

  // ---- Resolve the active style -------------------------------------------
  // Session-only: the id survives page-to-page navigation, but any reload
  // returns to the default site. ?style=<id> applies a style and seeds the
  // session, so links are shareable (?style=default is the escape hatch).
  var styleId = 'default';
  if (THEME_CYCLER_ENABLED) {
    try {
      if (isReload) sessionStorage.removeItem(STYLE_KEY);
      var param = new URLSearchParams(window.location.search).get('style');
      if (param && REGISTRY[param]) {
        styleId = param;
        if (param === 'default') sessionStorage.removeItem(STYLE_KEY);
        else sessionStorage.setItem(STYLE_KEY, param);
      } else if (!isReload) {
        var stored = sessionStorage.getItem(STYLE_KEY);
        if (stored && REGISTRY[stored]) styleId = stored;
      }
    } catch (e) {}
  }
  var entry = REGISTRY[styleId] || REGISTRY['default'];
  window.__ACTIVE_STYLE = entry.id;

  // ---- Apply the style (the default applies nothing) ----------------------
  if (entry.id !== 'default') {
    root.setAttribute('data-style', entry.id);
    if (entry.flags && entry.flags.still) root.setAttribute('data-still', '');
    if (entry.flags && entry.flags.tilt === false) root.setAttribute('data-no-tilt', '');
    if (entry.tokens) {
      Object.keys(entry.tokens).forEach(function (k) {
        root.style.setProperty(k, entry.tokens[k]);
      });
    }
    // This is a blocking script in <head>, so links appended here also block
    // first paint. theme-base.css carries shared skin rules; load it before the
    // skin sheet so the skin wins specificity ties.
    (entry.fonts || []).concat(['/css/themes/theme-base.css'], entry.css ? [entry.css] : []).forEach(function (href) {
      var link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = href;
      link.setAttribute('data-style-asset', '1');
      document.head.appendChild(link);
    });
  }

  // ---- Colors + alpha ramps ------------------------------------------------
  // Base palette comes from the active style; a saved palette-toy session
  // (randomized within the style) overrides it. Reload clears the toy.
  var colors = entry.colors;
  if (THEME_CYCLER_ENABLED) {
    try {
      if (isReload) {
        sessionStorage.removeItem(STORAGE_KEY);
      } else {
        var raw = sessionStorage.getItem(STORAGE_KEY);
        if (raw) {
          var saved = JSON.parse(raw);
          if (saved && Array.isArray(saved.colors) && saved.colors.length === 5) {
            colors = { text:saved.colors[0], bg:saved.colors[1], primary:saved.colors[2], secondary:saved.colors[3], accent:saved.colors[4] };
          }
        }
      }
    } catch (e) {}
  }

  function hexToHsl(hex) {
    var m = hex.replace('#','');
    var r = parseInt(m.substring(0,2),16)/255;
    var g = parseInt(m.substring(2,4),16)/255;
    var b = parseInt(m.substring(4,6),16)/255;
    var max = Math.max(r,g,b), min = Math.min(r,g,b);
    var h = 0, s = 0, l = (max+min)/2;
    if (max !== min) {
      var d = max - min;
      s = l > 0.5 ? d/(2-max-min) : d/(max+min);
      switch (max) {
        case r: h = (g-b)/d + (g<b?6:0); break;
        case g: h = (b-r)/d + 2; break;
        case b: h = (r-g)/d + 4; break;
      }
      h *= 60;
    }
    return { h: h, s: s*100, l: l*100 };
  }

  Object.keys(colors).forEach(function (role) {
    var hex = colors[role];
    root.style.setProperty('--' + role, hex);
    var hsl = hexToHsl(hex);
    STEPS.forEach(function (a) {
      root.style.setProperty(
        '--' + role + a,
        'hsla(' + hsl.h.toFixed(0) + ',' + hsl.s.toFixed(0) + '%,' + hsl.l.toFixed(0) + '%,' + a + '%)'
      );
    });
  });
})();
