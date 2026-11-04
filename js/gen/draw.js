// Tiny SVG drawing kit for nonverbal puzzles. Figures are plain data so they can be
// compared (to guarantee every option looks different) and re-drawn later.
//
// Element: { shape, x, y, s, rot, fill }   (x, y relative to the centre of a 100×100 box)
// Figure:  { els: [...], M: [a, b, c, d] } (M = optional 2×2 transform about the centre)

const SW = 3.5; // stroke width

function poly(n, r, rotDeg = 0) {
  const pts = [];
  for (let i = 0; i < n; i++) {
    const a = ((rotDeg - 90) * Math.PI) / 180 + (i * 2 * Math.PI) / n;
    pts.push([r * Math.cos(a), r * Math.sin(a)]);
  }
  return pts;
}
function star(r) {
  const pts = [];
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5, rr = i % 2 ? r * 0.45 : r;
    pts.push([rr * Math.cos(a), rr * Math.sin(a)]);
  }
  return pts;
}
const SHAPES = {
  circle: null,
  square: (s) => poly(4, s * 1.25, 45),
  diamond: (s) => poly(4, s * 1.2, 0),
  triangle: (s) => poly(3, s * 1.25, 0),
  pentagon: (s) => poly(5, s * 1.1, 0),
  hexagon: (s) => poly(6, s * 1.1, 0),
  heptagon: (s) => poly(7, s * 1.1, 0),
  octagon: (s) => poly(8, s * 1.1, 22.5),
  star: (s) => star(s * 1.25),
  cross: (s) => { const a = s * 0.38, b = s; return [[-a, -b], [a, -b], [a, -a], [b, -a], [b, a], [a, a], [a, b], [-a, b], [-a, a], [-b, a], [-b, -a], [-a, -a]]; },
  arrow: (s) => [[0, -s], [s * 0.75, -s * 0.15], [s * 0.28, -s * 0.15], [s * 0.28, s], [-s * 0.28, s], [-s * 0.28, -s * 0.15], [-s * 0.75, -s * 0.15]],
  rectangle: (s) => [[-s * 1.2, -s * 0.65], [s * 1.2, -s * 0.65], [s * 1.2, s * 0.65], [-s * 1.2, s * 0.65]],
  trapezoid: (s) => [[-s * 0.6, -s * 0.7], [s * 0.6, -s * 0.7], [s * 1.15, s * 0.7], [-s * 1.15, s * 0.7]],
  parallelogram: (s) => [[-s * 0.6, -s * 0.7], [s * 1.2, -s * 0.7], [s * 0.6, s * 0.7], [-s * 1.2, s * 0.7]],
  kite: (s) => [[0, -s * 1.2], [s * 0.75, -s * 0.2], [0, s * 1.2], [-s * 0.75, -s * 0.2]],
  righttri: (s) => [[-s, -s], [-s, s], [s, s]],
  semicircle: "semi"
};
export const SIDES = { triangle: 3, righttri: 3, square: 4, diamond: 4, rectangle: 4, trapezoid: 4, parallelogram: 4, kite: 4, pentagon: 5, hexagon: 6, heptagon: 7, octagon: 8 };
export const NAMES = { righttri: "right triangle" };

function fillAttr(f) {
  switch (f) {
    case "solid": return 'fill="currentColor"';
    case "gray": return 'fill="currentColor" fill-opacity=".3"';
    case "stripes": return 'fill="url(#sh-hatch)"';
    default: return 'fill="none"';
  }
}
const r1 = (n) => Math.round(n * 10) / 10;

export function elSvg({ shape, x = 0, y = 0, s = 30, rot = 0, fill = "none", sx = 1 }) {
  const t = `translate(${r1(50 + x)} ${r1(50 + y)})${rot ? ` rotate(${rot})` : ""}${sx !== 1 ? ` scale(${sx} 1)` : ""}`;
  const st = `stroke="currentColor" stroke-width="${SW}" stroke-linejoin="round"`;
  if (shape === "circle") return `<circle transform="${t}" r="${r1(s)}" ${st} ${fillAttr(fill)}/>`;
  if (shape === "dot") return `<circle transform="${t}" r="${r1(s)}" fill="currentColor"/>`;
  if (shape === "semicircle") return `<path transform="${t}" d="M${-s} 0 A${s} ${s} 0 0 1 ${s} 0 Z" ${st} ${fillAttr(fill)}/>`;
  if (shape === "line") return `<line transform="${t}" x1="0" y1="${-s}" x2="0" y2="${s}" stroke="currentColor" stroke-width="${SW}" stroke-linecap="round"/>`;
  const pts = SHAPES[shape](s).map(([px, py]) => `${r1(px)},${r1(py)}`).join(" ");
  return `<polygon transform="${t}" points="${pts}" ${st} ${fillAttr(fill)}/>`;
}

// Draw a figure. extra = raw SVG (already in 0..100 coordinates) drawn under the transform.
export function figSvg(fig, label = "figure") {
  const [a, b, c, d] = fig.M || [1, 0, 0, 1];
  const e = 50 - 50 * a - 50 * c, f = 50 - 50 * b - 50 * d;
  const inner = (fig.raw || "") + (fig.els || []).map(elSvg).join("");
  const g = a === 1 && b === 0 && c === 0 && d === 1 ? inner : `<g transform="matrix(${[a, b, c, d, e, f].map(r1).join(" ")})">${inner}</g>`;
  return `<svg viewBox="0 0 100 100" class="shape" role="img" aria-label="${label}">${g}</svg>`;
}

// Canonical key for comparing figures.
export const figKey = (fig) => JSON.stringify({ e: fig.els, r: fig.raw || "", M: (fig.M || [1, 0, 0, 1]).map((v) => Math.round(v * 1000) / 1000) });

// 2×2 matrix helpers (column form: x' = a x + c y, y' = b x + d y).
export const mul = ([a1, b1, c1, d1], [a2, b2, c2, d2]) => [a1 * a2 + c1 * b2, b1 * a2 + d1 * b2, a1 * c2 + c1 * d2, b1 * c2 + d1 * d2];
export const ID = [1, 0, 0, 1];
export const GEOM = {
  id: { M: ID, say: "stays the same way round" },
  r90: { M: [0, 1, -1, 0], say: "turns 90° clockwise" },
  r180: { M: [-1, 0, 0, -1], say: "turns 180°" },
  r270: { M: [0, -1, 1, 0], say: "turns 90° counterclockwise" },
  fh: { M: [-1, 0, 0, 1], say: "flips left-to-right (a mirror image)" },
  fv: { M: [1, 0, 0, -1], say: "flips upside down" },
  fd: { M: [0, 1, 1, 0], say: "flips across the diagonal" }
};

// A global <defs> block (added once to the page) supplies the hatch pattern.
export const DEFS_SVG = `<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs><pattern id="sh-hatch" patternUnits="userSpaceOnUse" width="7" height="7" patternTransform="rotate(45)"><rect width="7" height="7" fill="none"/><line x1="0" y1="0" x2="0" y2="7" stroke="currentColor" stroke-width="2.6"/></pattern><marker id="sh-arrow" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="4.5" markerHeight="4.5" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="var(--accent)"/></marker></defs></svg>`;
