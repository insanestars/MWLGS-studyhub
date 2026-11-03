// Renders shape-sequence frames as SVG. Frames are plain objects so puzzles can be
// saved (e.g. in "Review my mistakes") and re-drawn later.
//   { kind: "arrow", rot, fill }
//   { kind: "poly",  sides, rot, fill }
//   { kind: "dots",  n, fill }
//   { kind: "corner", pos, fill }   // a marker moving round the 8 points of a square
//   { kind: "bars", n, rot }        // n parallel lines, rotated

const S = 'stroke="currentColor" stroke-width="4" stroke-linejoin="round" stroke-linecap="round"';
const fillAttr = (f) => (f ? 'fill="currentColor"' : 'fill="none"');

function polyPoints(sides, r = 34, rot = 0) {
  const pts = [];
  for (let i = 0; i < sides; i++) {
    const a = ((rot - 90) * Math.PI) / 180 + (i * 2 * Math.PI) / sides;
    pts.push(`${(50 + r * Math.cos(a)).toFixed(1)},${(50 + r * Math.sin(a)).toFixed(1)}`);
  }
  return pts.join(" ");
}

const DOT_LAYOUT = [
  [], [[50, 50]], [[30, 50], [70, 50]], [[50, 28], [28, 68], [72, 68]],
  [[30, 30], [70, 30], [30, 70], [70, 70]], [[30, 30], [70, 30], [50, 50], [30, 70], [70, 70]],
  [[30, 25], [70, 25], [30, 50], [70, 50], [30, 75], [70, 75]],
  [[30, 25], [70, 25], [30, 50], [50, 50], [70, 50], [30, 75], [70, 75]],
  [[25, 25], [50, 25], [75, 25], [25, 50], [75, 50], [25, 75], [50, 75], [75, 75]],
  [[25, 25], [50, 25], [75, 25], [25, 50], [50, 50], [75, 50], [25, 75], [50, 75], [75, 75]]
];
// 8 positions round a square, clockwise from top-left.
const CORNERS = [[20, 20], [50, 20], [80, 20], [80, 50], [80, 80], [50, 80], [20, 80], [20, 50]];

export function frameSvg(f, label = "") {
  let body = "";
  switch (f.kind) {
    case "arrow":
      body = `<g transform="rotate(${f.rot} 50 50)">
        <line x1="50" y1="82" x2="50" y2="30" ${S}/>
        <polygon points="50,14 36,34 64,34" ${S} ${fillAttr(f.fill)}/></g>`;
      break;
    case "poly":
      body = `<polygon points="${polyPoints(f.sides, 34, f.rot || 0)}" ${S} ${fillAttr(f.fill)}/>`;
      break;
    case "dots":
      body = `<rect x="10" y="10" width="80" height="80" rx="8" ${S} fill="none" opacity=".35"/>` +
        DOT_LAYOUT[f.n].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="7" ${f.fill ? 'fill="currentColor"' : `${S} fill="none"`} stroke-width="3"/>`).join("");
      break;
    case "corner": {
      const [x, y] = CORNERS[f.pos % 8];
      body = `<rect x="20" y="20" width="60" height="60" ${S} fill="none" opacity=".45"/>
        <circle cx="${x}" cy="${y}" r="10" ${S} ${fillAttr(f.fill)}/>`;
      break;
    }
    case "bars": {
      const gap = 14, start = 50 - ((f.n - 1) * gap) / 2;
      body = `<g transform="rotate(${f.rot} 50 50)">` +
        Array.from({ length: f.n }, (_, i) => `<line x1="${start + i * gap}" y1="20" x2="${start + i * gap}" y2="80" ${S}/>`).join("") + "</g>";
      break;
    }
  }
  return `<svg viewBox="0 0 100 100" class="shape" role="img" aria-label="${label}">${body}</svg>`;
}

export const questionMarkSvg =
  `<svg viewBox="0 0 100 100" class="shape" role="img" aria-label="missing"><text x="50" y="66" text-anchor="middle" font-size="48" font-weight="700" fill="currentColor">?</text></svg>`;
