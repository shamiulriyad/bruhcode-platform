// Generates every BRUHCODE logo file from one shared geometry.
// Run: node branding/build.mjs
import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const OUT = dirname(fileURLToPath(import.meta.url));

const C = {
  charcoal: '#111318',
  lime: '#B6FF5C',
  white: '#F5F5F0',
  gray: '#8A8F98',
};

// ---------- Symbol ----------
// A "B" whose two bowls are ">" chevrons and whose base is the "_" cursor.
// Drawn on a 36x48 box with 8-unit strokes and 45° diagonals.
const SYM_W = 36;
const SYM_H = 48;
const e = 8 * Math.SQRT2; // horizontal offset that keeps 45° diagonals 8 units thick
const r = (n) => +n.toFixed(2);
const SYM_BODY = [
  // Outer silhouette, minus the lime base.
  `M0 0 H18 L32 14 L24 22 L36 34 L30 40 H0 Z`,
  // Upper counter.
  `M8 8 H${r(26 - e)} L${r(32 - e)} 14 L${r(26 - e)} 20 H8 Z`,
  // Lower counter (closed from below by the cursor).
  `M8 28 H${r(30 - e)} L${r(36 - e)} 34 L${r(30 - e)} 40 H8 Z`,
].join(' ');
const SYM_CURSOR = `M0 40 H30 L22 48 H0 Z`;

// One-color versions use a single merged outline so no seam shows between body and cursor.
const SYM_SOLID = SYM_BODY.replace('L30 40 H0 Z', 'L22 48 H0 Z');

function symbol(letter, cursor) {
  if (letter === cursor) return `<path fill="${letter}" fill-rule="evenodd" d="${SYM_SOLID}"/>`;
  return `<path fill="${letter}" fill-rule="evenodd" d="${SYM_BODY}"/><path fill="${cursor}" d="${SYM_CURSOR}"/>`;
}

// ---------- Wordmark ----------
// Custom condensed, chamfered capitals. Glyph box 24x40, stroke 8.
const S = 8;
const GW = 24;
const GH = 40;
const GAP = 7;
const a = S / 2; // stroke centerline inset
const R = GW - a; // right centerline
const Bm = GH - a; // bottom centerline
const M = GH / 2; // middle
const k = 6; // chamfer
const glyphs = {
  B: `M${a} ${M} H${R - k - 1} L${R - 1} ${M - k} V${a + k} L${R - k - 1} ${a} H${a} V${Bm} H${R - k} L${R} ${Bm - k} V${M + k} L${R - k} ${M} H${a + 4}`,
  R: `M${a} ${GH} V${a} H${R - k} L${R} ${a + k} V${M - k} L${R - k} ${M} H${a} M${R - k - 2} ${M} H${R - k} L${R} ${M + k} V${GH}`,
  U: `M${a} 0 V${Bm - 3} L${a + 3} ${Bm} H${R - 3} L${R} ${Bm - 3} V0`, // small chamfer so it never reads as V
  H: `M${a} 0 V${GH} M${R} 0 V${GH} M${a} ${M} H${R}`,
  C: `M${GW} ${a} H${a + k} L${a} ${a + k} V${Bm - k} L${a + k} ${Bm} H${GW}`,
  O: `M${a + k} ${a} H${R - k} L${R} ${a + k} V${Bm - k} L${R - k} ${Bm} H${a + k} L${a} ${Bm - k} V${a + k} Z`,
  D: `M${a} ${a} H${R - k} L${R} ${a + k} V${Bm - k} L${R - k} ${Bm} H${a} Z`,
  E: `M${GW} ${a} H${a} V${Bm} H${GW} M${a} ${M} H${GW - 5}`,
};
const WORD = 'BRUHCODE';
const WORD_W = WORD.length * GW + (WORD.length - 1) * GAP;

function wordmark(color) {
  const parts = [...WORD].map(
    (ch, i) => `<path transform="translate(${i * (GW + GAP)} 0)" d="${glyphs[ch]}"/>`
  );
  return `<g fill="none" stroke="${color}" stroke-width="${S}" stroke-linejoin="miter" stroke-linecap="butt">${parts.join('')}</g>`;
}

// ---------- Building blocks ----------
const svg = (w, h, body, title) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${r(w)} ${r(h)}" width="${r(w)}" height="${r(h)}" role="img" aria-label="${title}">
  <title>${title}</title>
  ${body}
</svg>
`;

// Symbol scaled to a given height, top-left at (x, y).
function placeSymbol(h, x, y, letter, cursor) {
  const s = h / SYM_H;
  return `<g transform="translate(${r(x)} ${r(y)}) scale(${r(s)})">${symbol(letter, cursor)}</g>`;
}

// Rounded-square tile with the symbol centered (app icon, and the mark on light backgrounds).
function tile(size, x = 0, y = 0) {
  const h = size * 0.58;
  const w = (h * SYM_W) / SYM_H;
  return `<g transform="translate(${r(x)} ${r(y)})"><rect width="${r(size)}" height="${r(size)}" rx="${r(size * 0.22)}" fill="${C.charcoal}"/>${placeSymbol(h, (size - w) / 2, (size - h) / 2, C.white, C.lime)}</g>`;
}

// Horizontal lockup, 48 units tall: symbol + wordmark with a 30-unit cap height.
const LOCK_H = 48;
const CAP = 30;
const WM_SCALE = CAP / GH;
const LOCK_GAP = 18;
function lockup(word, mark) {
  const markW = mark === 'tile' ? LOCK_H : SYM_W;
  const markSvg =
    mark === 'tile'
      ? tile(LOCK_H)
      : placeSymbol(LOCK_H, 0, 0, mark.letter, mark.cursor);
  return {
    w: markW + LOCK_GAP + WORD_W * WM_SCALE,
    body: `${markSvg}<g transform="translate(${markW + LOCK_GAP} ${(LOCK_H - CAP) / 2}) scale(${WM_SCALE})">${wordmark(word)}</g>`,
  };
}

const ON_DARK = lockup(C.white, { letter: C.white, cursor: C.lime });
const ON_LIGHT = lockup(C.charcoal, 'tile');
const MONO = lockup(C.white, { letter: C.white, cursor: C.white });
const MONO_DARK_INK = lockup(C.charcoal, { letter: C.charcoal, cursor: C.charcoal });

// Lockup on a solid background with padding.
function framed(bg, lock, pad = 32) {
  const w = Math.ceil(lock.w + pad * 2);
  const h = LOCK_H + pad * 2;
  return svg(w, h, `<rect width="${w}" height="${h}" fill="${bg}"/><g transform="translate(${r((w - lock.w) / 2)} ${pad})">${lock.body}</g>`, 'BRUHCODE');
}

// ---------- Files ----------
const files = {
  'bruhcode-symbol.svg': svg(SYM_W, SYM_H, symbol(C.white, C.lime), 'BRUHCODE'),
  'bruhcode-symbol-mono-white.svg': svg(SYM_W, SYM_H, symbol(C.white, C.white), 'BRUHCODE'),
  'bruhcode-symbol-mono-charcoal.svg': svg(SYM_W, SYM_H, symbol(C.charcoal, C.charcoal), 'BRUHCODE'),
  'bruhcode-app-icon.svg': svg(512, 512, tile(512), 'BRUHCODE'),
  'bruhcode-wordmark.svg': svg(WORD_W, GH, wordmark(C.white), 'BRUHCODE'),
  'bruhcode-logo-dark.svg': framed(C.charcoal, ON_DARK),
  'bruhcode-logo-light.svg': framed(C.white, ON_LIGHT),
  'bruhcode-logo-mono.svg': framed(C.charcoal, MONO),
  'bruhcode-logo-mono-on-light.svg': framed(C.white, MONO_DARK_INK),
  // Transparent lockups for placing on any surface (navbar, docs, README).
  'bruhcode-logo-on-dark.svg': svg(ON_DARK.w, LOCK_H, ON_DARK.body, 'BRUHCODE'),
  'bruhcode-logo-on-light.svg': svg(ON_LIGHT.w, LOCK_H, ON_LIGHT.body, 'BRUHCODE'),
};

// README banner: centered lockup on charcoal (reads well in GitHub light and dark themes).
{
  const W = 1280, H = 320, sc = 2.6;
  const x = (W - ON_DARK.w * sc) / 2, y = (H - LOCK_H * sc) / 2;
  files['bruhcode-banner.svg'] = svg(W, H,
    `<rect width="${W}" height="${H}" rx="24" fill="${C.charcoal}"/><g transform="translate(${r(x)} ${r(y)}) scale(${sc})">${ON_DARK.body}</g>`,
    'BRUHCODE');
}

// Presentation sheet: 2x2 grid, no labels.
{
  const cw = 760, ch = 420, gap = 24, m = 40;
  const W = m * 2 + cw * 2 + gap;
  const H = m * 2 + ch * 2 + gap;
  const sc = 2.4;
  const cell = (x, y, bg, inner, w, h) =>
    `<rect x="${x}" y="${y}" width="${cw}" height="${ch}" rx="20" fill="${bg}"/>` +
    inner(x + (cw - w) / 2, y + (ch - h) / 2);
  const scaled = (lock) => (x, y) => `<g transform="translate(${r(x)} ${r(y)}) scale(${sc})">${lock.body}</g>`;
  const x2 = m + cw + gap, y2 = m + ch + gap;
  const body = [
    `<rect width="${W}" height="${H}" fill="#0B0C10"/>`,
    cell(m, m, C.charcoal, scaled(ON_DARK), ON_DARK.w * sc, LOCK_H * sc),
    cell(x2, m, C.white, scaled(ON_LIGHT), ON_LIGHT.w * sc, LOCK_H * sc),
    cell(m, y2, C.white, (x, y) => tile(200, x, y), 200, 200),
    cell(x2, y2, C.charcoal, scaled(MONO), MONO.w * sc, LOCK_H * sc),
  ];
  files['bruhcode-presentation.svg'] = svg(W, H, body.join('\n  '), 'BRUHCODE brand sheet');
}

for (const [name, content] of Object.entries(files)) {
  writeFileSync(join(OUT, name), content);
  console.log('wrote', name);
}
