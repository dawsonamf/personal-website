// The authoritative theme registry, read at build time. Array order is picker order.
//
// Keep this module pure: it ships in the 404 page's browser bundle (D27), so no
// filesystem, prose or astro imports. Disk checks for `css` land in S1-10.
//
// Labels are not here: they are prose, at `themes.<id>.label` in prose.yaml.
//
// Four skins stay inactive with their sheets on disk and no entry here. Their
// original entries remain commented out in js/theme-bootstrap.js at commit
// 0f196d0 (the main baseline): :213-239 space, :243-265 vapor, :428-456 wanted,
// :460-495 constructivist. Re-activating one is a paste, not a rewrite.
//
// A theme without a `random` profile draws from the picker's DEFAULT_RANDOM
// fallback, which stays with the picker runtime (theme-cycler.js), not here.
import type { Theme } from './types.ts';

/** Ids a theme may not take: they collide with real URL segments and build output. */
export const RESERVED_IDS: readonly string[] = [
  'blog',
  'privacy',
  'lexchat',
  'subsites',
  '12years',
  'embedded-swift-agent',
  '404',
  'sitemap',
  'sitemap-index',
  'robots',
  '_astro',
  'vendor',
  'css',
  'js',
  'resources',
];

export const THEMES: readonly Theme[] = [
  {
    kind: 'skin',
    id: 'default',
    polarity: 'dark',
    // The default stamps no attribute and loads no assets: default visitors get
    // the site unchanged.
    colors: { text: '#e6f1ff', bg: '#1d1d1d', primary: '#61ffda', secondary: '#2c2c2c', accent: '#61ffda' },
  },
  {
    kind: 'skin',
    id: 'brutalist',
    polarity: 'light',
    // still and tilt stamp html attributes read by css/themes/theme-base.css.
    flags: { tilt: false, still: true },
    colors: { text: '#0a0a0a', bg: '#ffe600', primary: '#1400ff', secondary: '#ffffff', accent: '#1400ff' },
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
  {
    kind: 'skin',
    id: 'marquee',
    polarity: 'light',
    // Tilt off: a 3D card lean fights flat poster geometry. Motion stays —
    // the drifting headers and ticking label strips ARE the design.
    flags: { tilt: false },
    // Ink on paper. primary is the band ink (a hair off text so a shuffled
    // palette can separate them); accent is ink too, because links here
    // are marked by rule weight, not by colour.
    colors: { text: '#241f1a', bg: '#faf9f7', primary: '#2a2722', secondary: '#edeae4', accent: '#241f1a' },
    // Cursorless masthead: poster copy is set, not typed. Words clack down
    // into place a word at a time and drain the same way.
    typing: 'word',
    typingDelete: 'word',
    // Random-palette profile: a two-colour poster press, not a monochrome.
    // What holds the skin's identity is the VALUE structure, never the
    // absence of colour: the ground stays paper-pale and every mark stays
    // ink-dark, so text-on-bg can't fall below ~9:1 no matter what the
    // shuffle draws (the near-black alpha steps this skin leans on,
    // --text35 upward, stay readable at that floor).
    //
    // Inside that structure the draws run wide. text/bg/secondary share one
    // saturation, so the sheet and the body copy are always tinted by the
    // same wash, from bare grey to a strong stock tint. primary and accent
    // draw their own, higher, so the band ink and links can come up as a
    // genuine second colour against a quiet sheet. Hue offsets separate the
    // three inks (accent takes the scheme's full spread, primary about
    // half), while paper and panels sit just off the base hue so the stock
    // reads as its own warmth rather than a wash of the ink.
    random: {
      light: {
        sat: [0.04, 0.45],
        roles: [
          { l: [0.07, 0.20], hueT: 0 },                       // text: ink
          { l: [0.90, 0.98], hueT: 0.08 },                    // bg: paper
          { l: [0.10, 0.23], hueT: 0.55, sat: [0.12, 0.62] }, // primary: band ink
          { l: [0.82, 0.92], hueT: 0.18 },                    // secondary: panel paper
          { l: [0.09, 0.24], hueT: 1.00, sat: [0.12, 0.62] }, // accent: second ink (links)
        ],
      },
      // Inverted press. Lightness caps sit a touch lower than light mode's
      // floors are high: a saturated hue at L 0.90 carries less luminance
      // than a grey does, and the ink ground has no headroom to give back.
      dark: {
        sat: [0.04, 0.42],
        roles: [
          { l: [0.84, 0.96], hueT: 0 },
          { l: [0.04, 0.12], hueT: 0.08 },
          { l: [0.76, 0.92], hueT: 0.55, sat: [0.12, 0.55] },
          { l: [0.10, 0.22], hueT: 0.18 },
          { l: [0.78, 0.94], hueT: 1.00, sat: [0.12, 0.55] },
        ],
      },
    },
    tokens: {
      '--font-body': "'Inter Tight', sans-serif",
      // The shouting voice: ultra-condensed heavy grotesque, caps only.
      '--font-heading': "'Anton', sans-serif",
      // The speaking voice: high-contrast literary serif with real italics.
      // Consumed by css/themes/marquee.css for project + post titles.
      '--font-heading-serif': "'Instrument Serif', Georgia, serif",
      '--border-radius': '12px',
      '--radius-pill': '12px',
      '--neutral-gray': '#6b665e',
      // Jobs rail: selected reverses to the band, hover is a paper step.
      '--jobs-menu-navy-dark': '#2a2722',
      '--jobs-menu-navy': '#e6e2da',
      '--jobs-menu-slate': '#6b665e',
    },
    fonts: [
      'https://fonts.googleapis.com/css2?family=Anton&family=Instrument+Serif:ital,wght@0,400;1,400&family=Inter+Tight:wght@400;500;600&display=swap',
    ],
    css: '/css/themes/marquee.css',
  },
  {
    kind: 'skin',
    id: 'blueprint',
    polarity: 'dark',
    flags: { tilt: false, still: true },
    colors: { text: '#e9f2fb', bg: '#0c3a62', primary: '#8fc1ee', secondary: '#0a2e4f', accent: '#ffd23f' },
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
    fonts: [
      'https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;600&family=Saira:wght@400;500&family=Saira+Condensed:wght@500;700&display=swap',
    ],
    css: '/css/themes/blueprint.css',
  },
  {
    kind: 'skin',
    id: 'field-notes',
    polarity: 'light',
    // No still flag: AOS entrances and the cursor dot stay on. Tilt is off,
    // though — taped-down photographs don't wiggle under their tape.
    flags: { tilt: false },
    colors: { text: '#33291a', bg: '#ece2cb', primary: '#3f6f4f', secondary: '#f7f0df', accent: '#b3502a' },
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
    fonts: [
      'https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;600&family=Spectral:ital,wght@0,400;0,600;1,400&family=Zilla+Slab:wght@500;600&display=swap',
    ],
    css: '/css/themes/field-notes.css',
  },
  {
    kind: 'skin',
    id: 'doodle',
    polarity: 'light',
    // Tilt off: sketches lie flat on the page. No still flag — AOS
    // entrances and the cursor follower stay (the follower restyles into
    // a pencil point in the skin sheet).
    flags: { tilt: false },
    colors: { text: '#2b2b2b', bg: '#fdfbf4', primary: '#2f6fde', secondary: '#fff3a3', accent: '#e2483d' },
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
  {
    kind: 'skin',
    id: 'grid',
    polarity: 'light',
    // Müller-Brockmann doesn't move: tilt off, fully still. The visible
    // column grid is drawn by the skin sheet, not a flag. No typing key:
    // the classic caret stays — the sheet recolors it Swiss red, the
    // masthead's one red mark. The skin sheet also brings the cursor
    // follower back (squared) by re-displaying #cursor-container over
    // theme-base's data-still hide.
    flags: { tilt: false, still: true },
    colors: { text: '#111111', bg: '#ffffff', primary: '#e30613', secondary: '#f4f4f4', accent: '#111111' },
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
  {
    kind: 'skin',
    id: 'miami-deco',
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
    colors: { text: '#1f3a44', bg: '#faf3e7', primary: '#e9688c', secondary: '#ffffff', accent: '#2fa8a0' },
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
    fonts: [
      'https://fonts.googleapis.com/css2?family=Josefin+Sans:ital,wght@0,400;0,600;0,700;1,400&family=Poiret+One&display=swap',
    ],
    css: '/css/themes/miami-deco.css',
  },
  {
    kind: 'skin',
    id: 'bauhaus',
    polarity: 'light',
    // Tilt off: poster geometry lies flat on the sheet. No still flag —
    // AOS entrances stay (motion limited to hard slide-ins) and the
    // cursor follower stays: a blue circle-and-dot is already on-grammar.
    flags: { tilt: false },
    colors: { text: '#14110d', bg: '#f2eee6', primary: '#e0311f', secondary: '#ffffff', accent: '#1c52b5' },
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
  {
    kind: 'skin',
    id: 'chinoiserie',
    polarity: 'light',
    // Tilt off: porcelain doesn't wobble. No still flag — entrances and
    // the cursor follower stay (the follower's accent dot reads as gilt).
    flags: { tilt: false },
    // Cursorless masthead: each glyph blooms in like cobalt soaking into
    // glaze (the skin animates the engine's glyph spans).
    typing: 'letter',
    colors: { text: '#22335c', bg: '#f6f8f3', primary: '#2c4f9e', secondary: '#ffffff', accent: '#b08d3e' },
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
    fonts: [
      'https://fonts.googleapis.com/css2?family=EB+Garamond:ital,wght@0,400;0,500;0,600;1,400&family=Marcellus&display=swap',
    ],
    css: '/css/themes/chinoiserie.css',
  },
  {
    kind: 'skin',
    id: 'gallery',
    polarity: 'light',
    // White cube: tilt off, fully still — hung works do not move. No
    // typing key: the classic caret stays, the one moving thing in the
    // room (the sheet thins it to an ink hairline). No accent color at
    // all — accent is decoration-grade gray, never set as text.
    flags: { tilt: false, still: true },
    colors: { text: '#1a1a1a', bg: '#ffffff', primary: '#1a1a1a', secondary: '#f7f7f7', accent: '#b9b9b9' },
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
  {
    kind: 'skin',
    id: 'banknote',
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
    colors: { text: '#1c281d', bg: '#dee3cb', primary: '#1a5b3d', secondary: '#eff1de', accent: '#9c3a2a' },
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
    fonts: [
      'https://fonts.googleapis.com/css2?family=Caveat:wght@600&family=Cinzel:wght@700;900&family=IBM+Plex+Mono:wght@400;600&family=Libre+Caslon+Text:ital,wght@0,400;0,700;1,400&display=swap',
    ],
    css: '/css/themes/banknote.css',
  },
  {
    kind: 'skin',
    id: 'neo-pop',
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
    colors: { text: '#14130f', bg: '#fff7e6', primary: '#005bbb', secondary: '#ffffff', accent: '#e4002b' },
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
    fonts: [
      'https://fonts.googleapis.com/css2?family=Bangers&family=Comic+Neue:ital,wght@0,400;0,700;1,400&family=IBM+Plex+Mono:wght@400;600&display=swap',
    ],
    css: '/css/themes/neo-pop.css',
  },
  {
    kind: 'skin',
    id: 'broadsheet',
    polarity: 'light',
    flags: { tilt: false, still: true },
    // The masthead sets like type on a press: word-at-a-time, no caret.
    typing: 'word',
    colors: { text: '#1c1710', bg: '#f5efe2', primary: '#a31621', secondary: '#ece3cf', accent: '#a31621' },
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
    fonts: [
      'https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400;0,500;0,600;1,400&family=Playfair+Display:ital,wght@0,500;0,700;0,900;1,500&display=swap',
    ],
    css: '/css/themes/broadsheet.css',
  },
  {
    kind: 'skin',
    id: 'studio',
    polarity: 'light',
    flags: { tilt: false, still: true },
    // Cursorless masthead: print doesn't have a caret — copy fades in a
    // word at a time.
    typing: 'word',
    colors: { text: '#1b1a17', bg: '#f4f2ec', primary: '#d44000', secondary: '#e9e6dd', accent: '#d44000' },
    // Random-palette profile: quiet paper and ink, with the saturation in
    // primary/accent only.
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
    fonts: [
      'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Space+Grotesk:wght@500;600;700&display=swap',
    ],
    css: '/css/themes/studio.css',
  },
  {
    kind: 'skin',
    id: 'wheatpaste',
    polarity: 'dark',
    // still kills the scroll entrances, the cursor follower, and the dock
    // lifts — nothing here animates smoothly. Tilt stays ON: a hovered
    // paste-up peels off the wall (base rotation lives on wrappers and
    // chips only, never on tilt targets).
    flags: { still: true },
    colors: { text: '#f0ede4', bg: '#1f2125', primary: '#d4242a', secondary: '#2e3238', accent: '#c8ff3d' },
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
    fonts: [
      'https://fonts.googleapis.com/css2?family=Anton&family=Inter:wght@400;600&family=Permanent+Marker&family=Special+Elite&display=swap',
    ],
    css: '/css/themes/wheatpaste.css',
  },
];

/** Array order is picker order. */
export const THEME_IDS: readonly string[] = THEMES.map((t) => t.id);

export function assertRegistry(themes: readonly Theme[]): void {
  const first = themes[0];
  if (!first || first.id !== 'default' || first.kind !== 'skin') {
    throw new Error('theme registry: THEMES[0] must be the skin with id "default"');
  }
  if ('css' in first || 'flags' in first || 'tokens' in first || 'fonts' in first) {
    throw new Error('theme registry: the default theme must have no css, flags, tokens or fonts');
  }
  const seen = new Set<string>();
  for (const theme of themes) {
    if (seen.has(theme.id)) throw new Error(`theme registry: duplicate id "${theme.id}"`);
    seen.add(theme.id);
    if (RESERVED_IDS.includes(theme.id)) throw new Error(`theme registry: reserved id "${theme.id}"`);
    if (!/^[a-z0-9-]+$/.test(theme.id)) {
      throw new Error(`theme registry: id "${theme.id}" must be lowercase a-z, 0-9 and hyphens (it is a URL segment)`);
    }
    if (theme.kind === 'structural' && !Object.values(theme.layouts ?? {}).some(Boolean)) {
      throw new Error(`theme registry: structural theme "${theme.id}" owns no layouts`);
    }
  }
}

assertRegistry(THEMES);
