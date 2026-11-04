// Nonverbal battery: figure matrices, figure classification, shape sequences.
import { make, retry } from "./common.js";
import { figSvg, figKey, mul, GEOM, SIDES, NAMES } from "./draw.js";
import { pick, sample, shuffle, rand, randInt } from "../util.js";

const BIG = ["square", "circle", "hexagon", "pentagon", "triangle", "octagon"];
const SMALL = ["dot", "triangle", "square", "star", "circle"];
const MARK_POS = [[-22, -22], [22, -22], [22, 22], [-22, 22], [0, -25], [25, 0], [0, 25], [-25, 0]];
const svgOpt = (fig) => ({ svg: figSvg(fig, "option"), k: figKey(fig) });
const keyOf = (o) => o.k;

// An asymmetric figure: a big shape plus two different small marks placed so that
// no rotation or reflection maps the figure onto itself.
function asymFigure(avoidBig) {
  const big = pick(BIG.filter((b) => b !== avoidBig));
  let p1, p2;
  do { [p1, p2] = sample(MARK_POS, 2); } while (p1[0] * p2[1] - p1[1] * p2[0] === 0); // not collinear with centre
  const [m1, m2] = sample(SMALL, 2);
  return {
    big,
    els: [
      { shape: big, s: 34, fill: pick(["none", "gray", "stripes"]) },
      { shape: m1, x: p1[0], y: p1[1], s: m1 === "dot" ? 6 : 8, fill: m1 === "dot" ? "solid" : pick(["solid", "none"]) },
      { shape: m2, x: p2[0], y: p2[1], s: m2 === "dot" ? 6 : 8, fill: m2 === "dot" ? "solid" : pick(["solid", "none"]) }
    ],
    M: [1, 0, 0, 1]
  };
}

const ATTR = {
  none: { f: (fig) => fig, say: "" },
  inv: {
    f: (fig) => ({ ...fig, els: fig.els.map((e, i) => (i === 0 || e.shape === "dot" ? e : { ...e, fill: e.fill === "solid" ? "none" : "solid" })) }),
    say: "the small shapes switch between filled and empty"
  },
  swap: {
    f: (fig) => ({ ...fig, els: [fig.els[0], { ...fig.els[1], x: fig.els[2].x, y: fig.els[2].y }, { ...fig.els[2], x: fig.els[1].x, y: fig.els[1].y }] }),
    say: "the two small shapes swap places"
  },
  bigfill: {
    f: (fig) => ({ ...fig, els: [{ ...fig.els[0], fill: fig.els[0].fill === "none" ? "gray" : "none" }, ...fig.els.slice(1)] }),
    say: "the big shape switches between empty and gray"
  }
};
const apply = (fig, g, a) => { const t = ATTR[a].f(fig); return { ...t, M: mul(GEOM[g].M, fig.M) }; };
// inv needs a non-dot mark to be visible
const canInv = (fig) => fig.els.slice(1).some((e) => e.shape !== "dot");

// ── Figure matrices ──────────────────────────────────────────────────────────
function matrix2x2(level) {
  return retry(() => {
    const A = asymFigure(), C = asymFigure(A.big);
    const geoms = ["r90", "r180", "r270", "fh", "fv"];
    const g = pick(level >= 2 ? [...geoms, "fd"] : geoms);
    let a = "none";
    if (level >= 2 && rand(3) > 0) a = pick(["inv", "swap", "bigfill"]);
    if (level >= 3) a = pick(["inv", "swap", "bigfill"]);
    if (a === "inv" && (!canInv(A) || !canInv(C))) return null;
    if (a === "bigfill") { const f0 = pick(["none", "gray"]); A.els[0].fill = f0; C.els[0].fill = f0; }
    const B = apply(A, g, a), D = apply(C, g, a);
    const distract = [];
    for (const g2 of shuffle(Object.keys(GEOM))) if (g2 !== g) distract.push(apply(C, g2, a));
    if (a !== "none") distract.splice(1, 0, apply(C, g, "none"));
    else if (canInv(C)) distract.splice(2, 0, apply(C, g, "inv"));
    const says = [GEOM[g].say, ATTR[a].say].filter(Boolean).join(", and ");
    return make({
      type: "matrix",
      question: "The top pair follows a rule. Which figure completes the bottom pair in the same way?",
      prompt: { kind: "matrix", cols: 2, cells: [figSvg(A), figSvg(B), figSvg(C), null] },
      correct: svgOpt(D), distractors: distract.slice(0, 6).map(svgOpt), optionKind: "svg", keyOf,
      explanation: `From the first figure to the second, the figure ${says}. Do the same to the third figure.`
    });
  });
}

// Cell for 3×3 grids: n copies of a shape with a fill.
function groupFig(shape, n, fill) {
  const pos = { 1: [[0, 0]], 2: [[-18, 0], [18, 0]], 3: [[0, -17], [-18, 15], [18, 15]], 4: [[-17, -17], [17, -17], [-17, 17], [17, 17]] }[n];
  const s = n === 1 ? 26 : n === 2 ? 14 : 12;
  return { els: pos.map(([x, y]) => ({ shape, x, y, s, fill })) };
}

function latinMatrix(level) {
  return retry(() => {
    const shapes = sample(["circle", "square", "triangle", "diamond", "hexagon", "star", "cross"], 3);
    const counts = level >= 2 ? sample([1, 2, 3, 4], 3) : [1, 1, 1];
    const fills = sample(["none", "solid", "stripes", "gray"], 3);
    const useFill = level !== 1 || true;
    // Two orthogonal Latin squares (shape, count) plus a third rule for fill.
    const L1 = (i, j) => (i + j) % 3, L2 = (i, j) => (i + 2 * j) % 3, L3 = (i, j) => (2 * i + j) % 3;
    const cell = (i, j) => groupFig(shapes[L1(i, j)], counts[L2(i, j)], useFill ? fills[level >= 3 ? L3(i, j) : i] : "none");
    const cells = [];
    for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) cells.push(i === 2 && j === 2 ? null : figSvg(cell(i, j)));
    const ans = cell(2, 2);
    const S = shapes[L1(2, 2)], N = counts[L2(2, 2)], F = ans.els[0].fill;
    const d = [];
    for (const s2 of shapes) for (const n2 of counts) for (const f2 of fills) if (s2 !== S || n2 !== N || f2 !== F) d.push(groupFig(s2, n2, f2));
    // Prefer distractors that differ in only one feature (hardest).
    const diff = (x) => (x.els[0].shape !== S) + (x.els.length !== N) + (x.els[0].fill !== F);
    const ranked = shuffle(d).sort((x, y) => diff(x) - diff(y));
    const rules = [`each row has one ${shapes.join(", one ")}`];
    if (level >= 2) rules.push(`one group of ${counts.join(", ")}`);
    rules.push(level >= 3 ? "and each shading appears once in every row and column" : "and every shape in a row has the same shading");
    return make({
      type: "matrix", question: "Which figure completes the grid?",
      prompt: { kind: "matrix", cols: 3, cells },
      correct: svgOpt(ans), distractors: ranked.slice(0, 8).map(svgOpt), optionKind: "svg", keyOf,
      explanation: `Look along the rows and columns: ${rules.join(", ")}.`
    });
  });
}

function rotationMatrix() {
  return retry(() => {
    const step = pick(["r90", "r270", "r180"]);
    const rows = [asymFigure(), null, null];
    rows[1] = asymFigure(rows[0].big); rows[2] = asymFigure(rows[1].big);
    const at = (i, j) => { let f = rows[i]; for (let k = 0; k < j; k++) f = { ...f, M: mul(GEOM[step].M, f.M) }; return f; };
    const cells = [];
    for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) cells.push(i === 2 && j === 2 ? null : figSvg(at(i, j)));
    const ans = at(2, 2);
    const distract = Object.keys(GEOM).map((g) => ({ ...rows[2], M: mul(GEOM[g].M, ans.M) })).filter((f) => figKey(f) !== figKey(ans));
    if (canInv(rows[2])) distract.push(ATTR.inv.f(ans));
    return make({
      type: "matrix", question: "Which figure completes the grid?",
      prompt: { kind: "matrix", cols: 3, cells },
      correct: svgOpt(ans), distractors: shuffle(distract).map(svgOpt), optionKind: "svg", keyOf,
      explanation: `Across each row, the figure ${GEOM[step].say} at every step. The last figure is the third row's figure turned twice.`
    });
  });
}

// Line-overlay matrices: third column = first two combined (union or "only lines not shared").
const LINES = [[20, 20, 80, 20], [20, 80, 80, 80], [20, 20, 20, 80], [80, 20, 80, 80], [20, 20, 80, 80], [80, 20, 20, 80], [50, 20, 50, 80], [20, 50, 80, 50]];
const lineFig = (set) => ({ raw: `<rect x="20" y="20" width="60" height="60" fill="none" stroke="currentColor" stroke-opacity=".18" stroke-width="2"/>` + [...set].sort().map((i) => `<line x1="${LINES[i][0]}" y1="${LINES[i][1]}" x2="${LINES[i][2]}" y2="${LINES[i][3]}" stroke="currentColor" stroke-width="4" stroke-linecap="round"/>`).join(""), els: [] });
const randSet = () => new Set(sample([0, 1, 2, 3, 4, 5, 6, 7], randInt(2, 4)));
const xor = (a, b) => new Set([...a, ...b].filter((x) => a.has(x) !== b.has(x)));
const union = (a, b) => new Set([...a, ...b]);
const inter = (a, b) => new Set([...a].filter((x) => b.has(x)));

function overlayMatrix(level) {
  return retry(() => {
    const op = level >= 2 && rand(2) ? "xor" : "union";
    const f = op === "xor" ? xor : union;
    const rows = [0, 1, 2].map(() => { const a = randSet(), b = randSet(); return [a, b, f(a, b)]; });
    // The example rows must show overlap, so XOR and union look different and the rule is learnable.
    if (rows.some(([a, b]) => inter(a, b).size === 0) || rows.some((r) => r[2].size === 0)) return null;
    const cells = rows.flat().map((s, i) => (i === 8 ? null : figSvg(lineFig(s))));
    const [a, b, ans] = rows[2];
    const alt = op === "xor" ? union(a, b) : xor(a, b);
    const tweak = (s) => { const t = new Set(s); const x = pick([...Array(8).keys()]); t.has(x) ? t.delete(x) : t.add(x); return t; };
    const opts = [alt, inter(a, b), a, b, tweak(ans), tweak(ans), tweak(alt)].filter((s) => s.size > 0).map((s) => { const fg = lineFig(s); return { svg: figSvg(fg), k: [...s].sort().join() }; });
    return make({
      type: "matrix", question: "Which figure completes the grid?",
      prompt: { kind: "matrix", cols: 3, cells },
      correct: { svg: figSvg(lineFig(ans)), k: [...ans].sort().join() }, distractors: opts, optionKind: "svg", keyOf,
      explanation: op === "xor"
        ? "In each row, the third figure combines the first two, but lines that appear in BOTH disappear."
        : "In each row, the third figure is the first two figures laid on top of each other."
    });
  });
}

export function figureMatrix(level = 2) {
  const kinds = level >= 2 ? [matrix2x2, matrix2x2, latinMatrix, rotationMatrix, overlayMatrix] : [matrix2x2, latinMatrix, overlayMatrix];
  return pick(kinds)(level);
}

// ── Figure classification ────────────────────────────────────────────────────
// Three figures share a rule; choose the option that follows it too.
const POLYS = ["triangle", "righttri", "square", "diamond", "rectangle", "trapezoid", "parallelogram", "kite", "pentagon", "hexagon", "octagon"];
const fillsAll = ["none", "solid", "gray", "stripes"];
const dotsInside = (n) => [[-9, -9], [9, -9], [-9, 9], [9, 9], [0, 0], [0, -14], [0, 14], [-14, 0]].slice(0, n).map(([x, y]) => ({ shape: "dot", x, y, s: 3.5 }));
const nameOf = (s) => NAMES[s] || s;

const CLASS_RULES = [
  { // same number of sides
    say: (k) => `all have exactly ${k} sides`,
    gen: () => {
      const k = pick([3, 4, 5]);
      const fam = POLYS.filter((p) => SIDES[p] === k), others = POLYS.filter((p) => SIDES[p] !== k);
      const one = (shape) => ({ els: [{ shape, s: randInt(20, 30), rot: pick([0, 15, 30, 90, 180, 210]), fill: pick(fillsAll) }] });
      const pickFam = () => one(pick(fam));
      // Make sure the examples differ in shading, so shading can't be the rule.
      const ex = sample(fillsAll, 3).map((f) => ({ els: [{ ...one(pick(fam)).els[0], fill: f }] }));
      return { k, ex, ans: pickFam(), wrong: () => one(pick(others)) };
    }
  },
  { // inner shape matches outer shape
    say: () => "each has a small shape inside a larger copy of the same shape",
    gen: () => {
      const pool = ["circle", "square", "triangle", "hexagon", "pentagon", "diamond", "star"];
      const nest = (o, i) => ({ els: [{ shape: o, s: 32, fill: pick(["none", "gray", "stripes"]) }, { shape: i, s: 12, fill: pick(["solid", "none"]) }] });
      const same = () => { const s = pick(pool); return nest(s, s); };
      return { ex: [same(), same(), same()], ans: same(), wrong: () => { const [a, b] = sample(pool, 2); return nest(a, b); } };
    }
  },
  { // dots inside = number of sides
    say: () => "the number of dots inside equals the number of sides of the shape",
    gen: () => {
      const pool = ["triangle", "square", "pentagon", "hexagon"];
      const fig = (shape, n) => ({ els: [{ shape, s: 34, rot: shape === "square" ? 0 : 0 }, ...dotsInside(n)] });
      const good = () => { const s = pick(pool); return fig(s, SIDES[s]); };
      return { ex: sample(pool, 3).map((s) => fig(s, SIDES[s])), ans: good(), wrong: () => { const s = pick(pool); let n; do { n = randInt(2, 7); } while (n === SIDES[s]); return fig(s, n); } };
    }
  },
  { // inner shape shaded, outer empty
    say: () => "the small inner shape is shaded and the outer shape is empty",
    gen: () => {
      const pool = ["circle", "square", "triangle", "hexagon", "diamond", "pentagon"];
      const fig = (outerFill, innerFill) => { const [o, i] = sample(pool, 2); return { els: [{ shape: o, s: 32, fill: outerFill }, { shape: i, s: 12, fill: innerFill }] }; };
      return { ex: [fig("none", "solid"), fig("none", "solid"), fig("none", "solid")], ans: fig("none", "solid"),
        wrong: () => pick([fig("gray", "none"), fig("stripes", "none"), fig("none", "none"), fig("stripes", "solid")]) };
    }
  },
  { // exactly three separate shapes
    say: () => "each is made of exactly three separate shapes",
    gen: () => {
      const pos = [[-22, -20], [22, -20], [0, 20], [-22, 20], [22, 20], [0, -22]];
      const fig = (n) => ({ els: sample(pos, n).map(([x, y]) => ({ shape: pick(["circle", "square", "triangle", "star", "diamond"]), x, y, s: 11, fill: pick(fillsAll) })) });
      return { ex: [fig(3), fig(3), fig(3)], ans: fig(3), wrong: () => fig(pick([2, 4, 5])) };
    }
  },
  { // arrow points toward the dot
    say: () => "the arrow always points toward the dot",
    gen: () => {
      const dirs = [[0, -1, 0], [1, 0, 90], [0, 1, 180], [-1, 0, 270]];
      const fig = (good) => {
        const [dx, dy, rot] = pick(dirs);
        let t = good ? [dx, dy] : pick(dirs.filter((d) => d[0] !== dx || d[1] !== dy));
        return { els: [{ shape: "arrow", s: 16, rot, fill: pick(["none", "solid"]) }, { shape: "dot", x: t[0] * 34, y: t[1] * 34, s: 6 }] };
      };
      return { ex: [fig(true), fig(true), fig(true)], ans: fig(true), wrong: () => fig(false) };
    }
  }
];

export function figureClassification() {
  return retry(() => {
    const rule = pick(CLASS_RULES);
    const g = rule.gen();
    const keys = new Set(g.ex.map(figKey));
    if (keys.size < 3 || keys.has(figKey(g.ans))) return null;
    const wrong = Array.from({ length: 10 }, g.wrong).filter((f) => !keys.has(figKey(f)));
    return make({
      type: "figclass",
      question: "The first three figures are alike in some way. Which option goes with them?",
      prompt: { kind: "figures", cells: g.ex.map((f) => figSvg(f)) },
      correct: svgOpt(g.ans), distractors: wrong.map(svgOpt), optionKind: "svg", keyOf,
      explanation: `Rule: ${rule.say(g.k)}. Size, rotation and shading that vary between the figures don't matter.`
    });
  });
}

// ── Shape sequences (5 frames, two things changing at once on hard levels) ───
export function shapeSequence(level = 2) {
  return retry(() => {
    const kind = pick(level >= 2 ? ["rotfill", "sides", "dots", "orbit", "rotcount"] : ["rot", "sides", "dots", "orbit"]);
    let frames, ans, distract, why;
    if (kind === "rot" || kind === "rotfill") {
      const step = pick([45, 90, 135, -45, -90]), base = pick([0, 90, 180]);
      const fr = (i) => ({ els: [{ shape: "arrow", s: 30, rot: (((base + i * step) % 360) + 360) % 360, fill: kind === "rotfill" ? (i % 2 ? "solid" : "none") : "none" }] });
      frames = [0, 1, 2, 3].map(fr); ans = fr(4);
      const R = ans.els[0].rot, F = ans.els[0].fill;
      distract = [45, 90, 135, 180, 225, 270, 315].map((x) => ({ els: [{ ...ans.els[0], rot: (R + x) % 360 }] }));
      if (kind === "rotfill") distract.unshift({ els: [{ ...ans.els[0], fill: F === "solid" ? "none" : "solid" }] }, { els: [{ ...ans.els[0], rot: (R + step + 360) % 360, fill: F === "solid" ? "none" : "solid" }] });
      why = `The arrow turns ${Math.abs(step)}° ${step > 0 ? "clockwise" : "counterclockwise"} each step${kind === "rotfill" ? " and alternates empty / filled" : ""}.`;
    } else if (kind === "sides") {
      const order = ["triangle", "square", "pentagon", "hexagon", "heptagon", "octagon"];
      const st = level >= 2 ? rand(2) : 0; // start at 3 or 4 sides
      const fills = level >= 2 ? ["none", "gray"] : ["none", "none"];
      const fr = (i) => ({ els: [{ shape: order[st + i], s: 30, fill: fills[i % 2] }] });
      frames = [0, 1, 2, 3].map(fr); ans = fr(4);
      const F = fills[0], G = fills[1];
      distract = [order[st + 3], order[st + 5] || "octagon", order[st + 2], "circle"].map((sh) => ({ els: [{ shape: sh, s: 30, fill: F }] }));
      distract.push({ els: [{ shape: order[st + 4], s: 30, fill: G === F ? "solid" : G }] });
      why = `Each shape has one more side than the one before (${3 + st}, ${4 + st}, ${5 + st}, ${6 + st}), so the next has ${7 + st} sides${level >= 2 ? "; the shading alternates empty / gray" : ""}.`;
    } else if (kind === "dots") {
      const k = pick([1, 2]), s = randInt(1, 9 - 4 * k);
      const fr = (i) => ({ els: [...dotsGrid(s + i * k, i % 2 === 0)] });
      frames = [0, 1, 2, 3].map(fr); ans = fr(4);
      const n = s + 4 * k;
      distract = [dotsGridFig(n, false), dotsGridFig(n - 1, true), dotsGridFig(Math.min(9, n + 1), true), dotsGridFig(n - k, true), dotsGridFig(n - 1, false)];
      why = `The dots go up by ${k} each step and alternate filled / empty.`;
    } else if (kind === "orbit") {
      const step = pick([1, 2, 3]), start = rand(8), sh = pick(["circle", "square", "triangle"]);
      const P = [[-28, -28], [0, -28], [28, -28], [28, 0], [28, 28], [0, 28], [-28, 28], [-28, 0]];
      const fr = (i) => { const [x, y] = P[(start + i * step) % 8]; return { els: [{ shape: "square", s: 28, fill: "none" }, { shape: sh, x, y, s: 9, fill: "solid" }] }; };
      frames = [0, 1, 2, 3].map(fr); ans = fr(4);
      distract = [1, 2, 3, 4, 5, 6, 7].map((o) => { const [x, y] = P[(start + 4 * step + o) % 8]; return { els: [ans.els[0], { ...ans.els[1], x, y }] }; });
      why = `The small shape moves ${step} place${step > 1 ? "s" : ""} clockwise around the square each step.`;
    } else { // rotcount: lines increase and rotate
      const step = pick([45, 90]), r0 = pick([0, 45]);
      const fr = (i) => ({ els: Array.from({ length: i + 1 }, (_, j) => ({ shape: "line", x: (j - i / 2) * 11, s: 26 })), M: rotM(r0 + i * step) });
      frames = [0, 1, 2, 3].map(fr); ans = fr(4);
      distract = [{ ...ans, M: rotM(r0 + 4 * step + 45) }, { ...ans, M: rotM(r0 + 4 * step + 90) }, { ...fr(3), M: ans.M }, { els: Array.from({ length: 6 }, (_, j) => ({ shape: "line", x: (j - 2.5) * 11, s: 26 })), M: ans.M }];
      why = `One more line each step, and the lines turn ${step}° each time.`;
    }
    return make({
      type: "shapes", question: "Which figure comes next in the sequence?",
      prompt: { kind: "sequence", cells: frames.map((f) => figSvg(f)) },
      correct: svgOpt(ans), distractors: shuffle(distract).map(svgOpt), optionKind: "svg", keyOf, explanation: why
    });
  });
}
const rotM = (deg) => { const r = (((deg % 180) + 180) % 180) * Math.PI / 180; return [Math.cos(r), Math.sin(r), -Math.sin(r), Math.cos(r)].map((v) => Math.round(v * 1000) / 1000); };
const DOTS = [[], [[0, 0]], [[-16, 0], [16, 0]], [[0, -16], [-16, 14], [16, 14]], [[-16, -16], [16, -16], [-16, 16], [16, 16]], [[-16, -16], [16, -16], [0, 0], [-16, 16], [16, 16]],
  [[-16, -20], [16, -20], [-16, 0], [16, 0], [-16, 20], [16, 20]], [[-16, -20], [16, -20], [-16, 0], [0, 0], [16, 0], [-16, 20], [16, 20]],
  [[-20, -20], [0, -20], [20, -20], [-20, 0], [20, 0], [-20, 20], [0, 20], [20, 20]], [[-20, -20], [0, -20], [20, -20], [-20, 0], [0, 0], [20, 0], [-20, 20], [0, 20], [20, 20]]];
function dotsGrid(n, filled) { return DOTS[n].map(([x, y]) => ({ shape: "circle", x, y, s: 6.5, fill: filled ? "solid" : "none" })); }
const dotsGridFig = (n, filled) => ({ els: dotsGrid(Math.max(1, n), filled) });
