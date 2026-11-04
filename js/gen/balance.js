// Figure balancing: shapes have hidden weights. Balanced scales show how they relate;
// pick what balances the last scale.
import { make, retry } from "./common.js";
import { pick, sample, randInt, shuffle, rand } from "../util.js";

const SHAPES = ["circle", "square", "triangle", "star", "diamond"];
const NAMES = { circle: "circle", square: "square", triangle: "triangle", star: "star", diamond: "diamond" };

function icon(shape, x, y, r = 6.2) {
  const st = 'stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"';
  const F = { circle: 'fill="currentColor" fill-opacity=".85"', square: 'fill="currentColor" fill-opacity=".25"', triangle: 'fill="none"', star: 'fill="currentColor" fill-opacity=".55"', diamond: 'fill="url(#sh-hatch)"' }[shape];
  const p = (pts) => `<polygon points="${pts.map(([a, b]) => `${(x + a).toFixed(1)},${(y + b).toFixed(1)}`).join(" ")}" ${st} ${F}/>`;
  switch (shape) {
    case "circle": return `<circle cx="${x}" cy="${y}" r="${r}" ${st} ${F}/>`;
    case "square": return p([[-r * 0.9, -r * 0.9], [r * 0.9, -r * 0.9], [r * 0.9, r * 0.9], [-r * 0.9, r * 0.9]]);
    case "triangle": return p([[0, -r * 1.05], [r * 1.05, r * 0.8], [-r * 1.05, r * 0.8]]);
    case "diamond": return p([[0, -r * 1.1], [r * 0.9, 0], [0, r * 1.1], [-r * 0.9, 0]]);
    case "star": { const pts = []; for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + (i * Math.PI) / 5, rr = i % 2 ? r * 0.5 : r * 1.15; pts.push([rr * Math.cos(a), rr * Math.sin(a)]); } return p(pts); }
  }
}
// Stack shapes on a pan centred at cx, sitting on y=base.
// Stack shapes on a plate centred at cx, sitting on y=base (bottom row first).
const R_ICON = 7.2, GAP = 17, PER_ROW = 4;
function pile(list, cx, base) {
  return list.map((s, i) => {
    const row = Math.floor(i / PER_ROW), col = i % PER_ROW, inRow = Math.min(PER_ROW, list.length - row * PER_ROW);
    return icon(s, cx + (col - (inRow - 1) / 2) * GAP, base - R_ICON - 1.5 - row * (2 * R_ICON + 3), R_ICON);
  }).join("");
}
const expand = (m) => Object.entries(m).flatMap(([s, n]) => Array(n).fill(s));

// A seesaw-style balance: shapes sit on top of the beam on each side of the pivot.
export function scaleSvg(left, right, { question = false } = {}) {
  const L = expand(left), R = right ? expand(right) : [];
  const rows = Math.max(1, Math.ceil(L.length / PER_ROW), Math.ceil(R.length / PER_ROW));
  const W = 180, H = 16 + rows * (2 * R_ICON + 3) + 26, B = H - 24;
  const beam = `<rect x="4" y="${B}" width="${W - 8}" height="4" rx="2" fill="currentColor"/>
    <rect x="8" y="${B - 2}" width="76" height="2.5" rx="1" fill="currentColor" fill-opacity=".45"/>
    <rect x="${W - 84}" y="${B - 2}" width="76" height="2.5" rx="1" fill="currentColor" fill-opacity=".45"/>
    <polygon points="${W / 2},${B + 4} ${W / 2 - 13},${H - 3} ${W / 2 + 13},${H - 3}" fill="currentColor" fill-opacity=".22" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>`;
  const rightStuff = question ? `<text x="${W - 46}" y="${B - 8}" text-anchor="middle" font-size="24" font-weight="800" fill="var(--accent)">?</text>` : pile(R, W - 46, B - 2);
  return `<svg viewBox="0 0 ${W} ${H}" class="scale" role="img" aria-label="balance scale: ${L.join(", ")} on the left${question ? ", unknown on the right" : `, ${R.join(", ")} on the right`}">${beam}${pile(L, 46, B - 2)}${rightStuff}</svg>`;
}
export function groupSvg(m) {
  const L = expand(m), rows = Math.ceil(L.length / PER_ROW);
  const W = PER_ROW * GAP + 6, H = rows * (2 * R_ICON + 4) + 6;
  const out = L.map((s, i) => { const row = Math.floor(i / PER_ROW), col = i % PER_ROW, inRow = Math.min(PER_ROW, L.length - row * PER_ROW); return icon(s, W / 2 + (col - (inRow - 1) / 2) * GAP, H / 2 + (row - (rows - 1) / 2) * (2 * R_ICON + 4), R_ICON); }).join("");
  return `<svg viewBox="0 0 ${W} ${H}" class="group" role="img" aria-label="${L.join(", ")}">${out}</svg>`;
}

const weightOf = (m, w) => Object.entries(m).reduce((a, [s, n]) => a + w[s] * n, 0);
const keyOf = (m) => Object.keys(m).sort().filter((s) => m[s]).map((s) => s + m[s]).join("|");
const count = (m) => Object.values(m).reduce((a, b) => a + b, 0);

// Random multiset of the given shapes with exactly `target` weight (or null).
function combo(shapes, w, target, maxItems = 7) {
  for (let t = 0; t < 200; t++) {
    const m = {}; let tot = 0, n = 0;
    while (tot < target && n < maxItems) { const s = pick(shapes); if (tot + w[s] > target) { if (shapes.every((x) => tot + w[x] > target)) break; continue; } m[s] = (m[s] || 0) + 1; tot += w[s]; n++; }
    if (tot === target) return m;
  }
  return null;
}

// Rank of the scale equations (left − right counts) must be k − 1 so the ratios are determined.
function rank(rows) {
  const M = rows.map((r) => r.slice());
  let rk = 0;
  for (let c = 0; c < (M[0] || []).length && rk < M.length; c++) {
    let p = M.findIndex((r, i) => i >= rk && Math.abs(r[c]) > 1e-9);
    if (p < 0) continue;
    [M[rk], M[p]] = [M[p], M[rk]];
    for (let i = 0; i < M.length; i++) if (i !== rk) { const f = M[i][c] / M[rk][c]; for (let j = c; j < M[i].length; j++) M[i][j] -= f * M[rk][j]; }
    rk++;
  }
  return rk;
}

export function figureBalance(level = 2) {
  return retry(() => {
    const k = level === 1 ? 2 : level === 2 ? pick([2, 3, 3]) : pick([3, 3, 4]);
    const shapes = sample(SHAPES, k);
    // Weights: lightest = 1 so ratios are whole numbers.
    const w = {}; const ws = shuffle([1, ...sample([2, 3, 4, 5, 6], k - 1)]);
    shapes.forEach((s, i) => (w[s] = ws[i]));
    // Build k − 1 balanced scales relating the shapes.
    const scales = [];
    const order = shuffle(shapes);
    for (let i = 0; i < k - 1; i++) {
      const a = order[i], b = order[i + 1];
      const heavy = w[a] >= w[b] ? a : b, light = heavy === a ? b : a;
      const n = level >= 3 ? randInt(1, 2) : 1;
      let left = { [heavy]: n }, right = null;
      if (w[heavy] % w[light] === 0) right = { [light]: (w[heavy] * n) / w[light] };
      else { const r = combo([light, ...order.slice(0, i)], w, w[heavy] * n, 7); right = r && r[light] ? r : null; if (!right) { left = { [heavy]: w[light] }; right = { [light]: w[heavy] }; } }
      if (count(right) > 8 || count(left) > 8) return null;
      scales.push(rand(2) ? [left, right] : [right, left]);
    }
    const vec = (m) => shapes.map((s) => m[s] || 0);
    if (rank(scales.map(([l, r]) => vec(l).map((v, i) => v - vec(r)[i]))) !== k - 1) return null;

    // Question: a left side; options are combinations of the other shapes.
    const qShape = pick(shapes), qn = randInt(1, level >= 2 ? 3 : 2);
    const qLeft = level >= 3 && k > 2 ? { [qShape]: qn, [pick(shapes.filter((s) => s !== qShape))]: 1 } : { [qShape]: qn };
    const target = weightOf(qLeft, w);
    const others = shapes.filter((s) => !(s in qLeft));
    const pool = others.length ? others : shapes;
    const ans = combo(pool, w, target, 8);
    if (!ans || count(ans) < 1 || keyOf(ans) === keyOf(qLeft)) return null;
    const lightest = Math.min(...pool.map((s) => w[s]));
    const wrong = [];
    for (let t = 0; t < 60 && wrong.length < 8; t++) {
      const delta = pick([-2, -1, 1, 2]) * lightest;
      const m = combo(pool, w, target + delta, 8);
      if (m && count(m) && weightOf(m, w) !== target) wrong.push(m);
    }
    const lightName = shapes.find((s) => w[s] === 1);
    return make({
      type: "balance",
      question: "The first scales are balanced. What would balance the last scale?",
      prompt: { kind: "scales", cells: [...scales.map(([l, r]) => scaleSvg(l, r)), scaleSvg(qLeft, null, { question: true })] },
      correct: { svg: groupSvg(ans), k: keyOf(ans) }, distractors: wrong.map((m) => ({ svg: groupSvg(m), k: keyOf(m) })),
      optionKind: "svg", keyOf: (o) => o.k,
      explanation: `Count everything in ${NAMES[lightName]}s: ${shapes.map((s) => `1 ${s} = ${w[s]}`).join(", ")}. The left side weighs ${target}, and so does the answer.`,
      _check: { w, qLeft, ans }
    });
  });
}
