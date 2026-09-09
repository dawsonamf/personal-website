# Historical registry metadata

Source: `js/theme-bootstrap.js` at commit `0f196d094ad64383ec58df5472fc12d403f846b3`.

## space

```js
{
  id: 'space',
  label: 'Space',
  polarity: 'dark',
  colors: { text:'#dbe7f4', bg:'#050810', primary:'#5b9dff', secondary:'#0b1322', accent:'#4de3ff' },
  tokens: {
    '--font-body': "'Inter', sans-serif",
    '--font-heading': "'Space Grotesk', sans-serif",
    '--font-mono': "'IBM Plex Mono', monospace",
    '--border-radius': '10px',
    '--radius-pill': '999px',
    '--neutral-gray': '#7e8ca3',
    '--jobs-menu-navy-dark': '#0b1322',
    '--jobs-menu-navy': '#101b31',
    '--jobs-menu-slate': '#8496b3',
  },
  fonts: ['https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;600&family=Inter:wght@400;500;600;700&family=Space+Grotesk:wght@500;600;700&display=swap'],
  css: '/css/themes/space.css',
}
```

No flags or typing override. Tilt, AOS entrances, the cursor follower, and the classic caret remain enabled.

## vapor

```js
{
  id: 'vapor',
  label: 'Vaporwave',
  polarity: 'dark',
  colors: { text:'#f3eaff', bg:'#20094a', primary:'#ff2ec4', secondary:'#2c1160', accent:'#00e5ff' },
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
}
```

No flags. Tilt and the motion pack remain enabled.

## wanted

```js
{
  id: 'wanted',
  label: 'Wanted',
  polarity: 'light',
  flags: { tilt: false, still: true },
  typing: 'letter',
  colors: { text:'#3a2a18', bg:'#f0e2c0', primary:'#8c3b22', secondary:'#f7eed6', accent:'#b08945' },
  tokens: {
    '--font-body': "'Special Elite', cursive",
    '--font-heading': "'Rye', cursive",
    '--border-radius': '0px',
    '--radius-pill': '0px',
    '--neutral-gray': '#8a7a5c',
    '--jobs-menu-navy-dark': '#f7eed6',
    '--jobs-menu-navy': '#e4d2a6',
    '--jobs-menu-slate': '#7a6644',
  },
  fonts: ['https://fonts.googleapis.com/css2?family=Rye&family=Smokum&family=Special+Elite&display=swap'],
  css: '/css/themes/wanted.css',
}
```

The original intent was a fully still, flat handbill with hard-cut hover states and typebar-like glyph entrances.

## constructivist

```js
{
  id: 'constructivist',
  label: 'Constructivist',
  polarity: 'light',
  flags: { tilt: false },
  typing: 'word',
  typingDelete: 'word',
  colors: { text:'#1d1a16', bg:'#f1e7d0', primary:'#d22b1f', secondary:'#e9ddbd', accent:'#1d1a16' },
  tokens: {
    '--font-body': "'Inter', sans-serif",
    '--font-heading': "'Anton', sans-serif",
    '--font-mono': "'IBM Plex Mono', monospace",
    '--border-radius': '0px',
    '--radius-pill': '0px',
    '--neutral-gray': '#7a7264',
    '--jobs-menu-navy-dark': '#1d1a16',
    '--jobs-menu-navy': '#e0d3b2',
    '--jobs-menu-slate': '#6e6450',
  },
  fonts: ['https://fonts.googleapis.com/css2?family=Anton&family=IBM+Plex+Mono:wght@400;600&family=Inter:wght@400;500;700&display=swap'],
  css: '/css/themes/constructivist.css',
}
```

The original intent combined red-wedge agitprop and Rodchenko-inspired advertising: flat posters,
AOS entrances, an ink-colored cursor, and word-at-a-time type and deletion.
