// Paper folding: the paper is folded 1–3 times along symmetry lines, a hole is punched,
// and you pick how it looks unfolded. Folding is simulated exactly with reflections.
import { make, retry } from "./common.js";
import { pick, rand, shuffle, sample } from "../util.js";

const EPS = 1e-6;
const P0 = 16, PW = 68; // paper drawn from 16..84
const X = (v) => +(P0 + v * PW).toFixed(2);

// Line: point (px,py) + unit direction (dx,dy). Reflect point across line.
function reflect([x, y], L) {
  const vx = x - L.px, vy = y - L.py, t = vx * L.dx + vy * L.dy;
  return [L.px + 2 * t * L.dx - vx, L.py + 2 * t * L.dy - vy];
}
const side = ([x, y], L) => (x - L.px) * L.dy - (y - L.py) * L.dx; // sign tells which side

// Keep the part of polygon where sign(side) === s (or on the line).
function clip(poly, L, s) {
  const out = [];
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i], b = poly[(i + 1) % poly.length];
    const sa = side(a, L) * s, sb = side(b, L) * s;
    if (sa >= -EPS) out.push(a);
    if ((sa > EPS && sb < -EPS) || (sa < -EPS && sb > EPS)) {
      const t = sa / (sa - sb);
      out.push([a[0] + t * (b[0] - a[0]), a[1] + t * (b[1] - a[1])]);
    }
  }
  return dedupe(out);
}
function dedupe(poly) {
  const r = [];
  for (const p of poly) if (!r.some((q) => Math.abs(q[0] - p[0]) < EPS && Math.abs(q[1] - p[1]) < EPS)) r.push(p.map((v) => Math.round(v * 1e6) / 1e6));
  return r;
}
const centroid = (poly) => [poly.reduce((a, p) => a + p[0], 0) / poly.length, poly.reduce((a, p) => a + p[1], 0) / poly.length];
const sameSet = (A, B) => A.length === B.length && A.every((p) => B.some((q) => Math.abs(p[0] - q[0]) < 1e-4 && Math.abs(p[1] - q[1]) < 1e-4));

// Symmetry axes of a polygon through its centroid at 0/45/90/135°.
function axes(poly) {
  const [cx, cy] = centroid(poly);
  const res = [];
  for (const deg of [90, 0, 45, 135]) {
    const r = (deg * Math.PI) / 180;
    const L = { px: cx, py: cy, dx: +Math.cos(r).toFixed(12), dy: +Math.sin(r).toFixed(12), deg };
    if (sameSet(poly.map((p) => reflect(p, L)), poly)) res.push(L);
  }
  return res;
}
function inside(p, poly) {
  let c = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i], [xj, yj] = poly[j];
    if ((yi > p[1]) !== (yj > p[1]) && p[0] < ((xj - xi) * (p[1] - yi)) / (yj - yi) + xi) c = !c;
  }
  return c;
}
function distToSeg(p, a, b) {
  const vx = b[0] - a[0], vy = b[1] - a[1], t = Math.max(0, Math.min(1, ((p[0] - a[0]) * vx + (p[1] - a[1]) * vy) / (vx * vx + vy * vy)));
  return Math.hypot(p[0] - a[0] - t * vx, p[1] - a[1] - t * vy);
}

function simulate(nFolds) {
  let region = [[0, 0], [1, 0], [1, 1], [0, 1]];
  const steps = [];
  for (let i = 0; i < nFolds; i++) {
    const ax = axes(region);
    if (!ax.length) return null;
    const L = pick(ax), s = pick([1, -1]);
    const stay = clip(region, L, s), move = clip(region, L, -s);
    steps.push({ before: region, L, stay, move });
    region = stay;
  }
  return { region, steps };
}

function punch(region, n) {
  const holes = [];
  for (let tries = 0; holes.length < n && tries < 500; tries++) {
    const p = [Math.random(), Math.random()].map((v) => Math.round(v * 40) / 40);
    if (!inside(p, region)) continue;
    let ok = true;
    for (let i = 0; i < region.length; i++) if (distToSeg(p, region[i], region[(i + 1) % region.length]) < 0.09) ok = false;
    if (holes.some((h) => Math.hypot(h[0] - p[0], h[1] - p[1]) < 0.16)) ok = false;
    if (ok) holes.push(p);
  }
  return holes.length === n ? holes : null;
}

const uniq = (pts) => { const r = []; for (const p of pts) if (!r.some((q) => Math.hypot(q[0] - p[0], q[1] - p[1]) < 0.02)) r.push(p); return r; };
function unfold(holes, lines) {
  let S = holes.slice();
  for (let k = lines.length - 1; k >= 0; k--) S = uniq([...S, ...S.map((p) => reflect(p, lines[k]))]);
  return S;
}
const keyOf = (pts) => pts.map((p) => p.map((v) => Math.round(v * 100)).join(",")).sort().join(" ");
const tooClose = (pts) => pts.some((p, i) => pts.some((q, j) => j > i && Math.hypot(p[0] - q[0], p[1] - q[1]) < 0.1));

// ── Drawing ──────────────────────────────────────────────────────────────────
const polyPts = (poly) => poly.map(([x, y]) => `${X(x)},${X(y)}`).join(" ");
const HOLE_R = 4.2;
function paperSvg(holes, label = "unfolded paper") {
  return `<svg viewBox="0 0 100 100" class="shape" role="img" aria-label="${label}">
    <rect x="${P0}" y="${P0}" width="${PW}" height="${PW}" fill="currentColor" fill-opacity=".06" stroke="currentColor" stroke-width="2.5"/>
    ${holes.map(([x, y]) => `<circle cx="${X(x)}" cy="${X(y)}" r="${HOLE_R}" fill="currentColor"/>`).join("")}</svg>`;
}
function stepSvg(step, holes) {
  const { before, L, move } = step;
  const ghost = `<rect x="${P0}" y="${P0}" width="${PW}" height="${PW}" fill="none" stroke="currentColor" stroke-opacity=".15" stroke-dasharray="3 3" stroke-width="1.5"/>`;
  const shape = `<polygon points="${polyPts(before)}" fill="currentColor" fill-opacity=".08" stroke="currentColor" stroke-width="2.5" stroke-linejoin="round"/>`;
  // fold line clipped to the region's bounding extent
  const ext = 1.5, a = [L.px - L.dx * ext, L.py - L.dy * ext], b = [L.px + L.dx * ext, L.py + L.dy * ext];
  const seg = clipSegToPoly(a, b, before);
  const line = seg ? `<line x1="${X(seg[0][0])}" y1="${X(seg[0][1])}" x2="${X(seg[1][0])}" y2="${X(seg[1][1])}" stroke="currentColor" stroke-width="2.4" stroke-dasharray="6 4"/>` : "";
  const c1 = centroid(move), c2 = reflect(c1, L);
  const mid = [(c1[0] + c2[0]) / 2 + L.dx * 0.14, (c1[1] + c2[1]) / 2 + L.dy * 0.14];
  const arrow = `<path d="M${X(c1[0])} ${X(c1[1])} Q${X(mid[0])} ${X(mid[1])} ${X(c2[0])} ${X(c2[1])}" fill="none" stroke="var(--accent)" stroke-width="3.2" marker-end="url(#sh-arrow)"/>`;
  const dots = (holes || []).map(([x, y]) => `<circle cx="${X(x)}" cy="${X(y)}" r="${HOLE_R}" fill="currentColor"/>`).join("");
  return `<svg viewBox="0 0 100 100" class="shape" role="img" aria-label="fold step">${ghost}${shape}${line}${arrow}${dots}</svg>`;
}
function finalSvg(region, holes) {
  return `<svg viewBox="0 0 100 100" class="shape" role="img" aria-label="folded paper with hole">
    <rect x="${P0}" y="${P0}" width="${PW}" height="${PW}" fill="none" stroke="currentColor" stroke-opacity=".15" stroke-dasharray="3 3" stroke-width="1.5"/>
    <polygon points="${polyPts(region)}" fill="currentColor" fill-opacity=".08" stroke="currentColor" stroke-width="2.5" stroke-linejoin="round"/>
    ${holes.map(([x, y]) => `<circle cx="${X(x)}" cy="${X(y)}" r="${HOLE_R}" fill="currentColor"/>`).join("")}</svg>`;
}
function clipSegToPoly(a, b, poly) {
  // sample along the segment and keep the inside run (polygons here are convex)
  let first = null, last = null;
  for (let i = 0; i <= 400; i++) {
    const t = i / 400, p = [a[0] + t * (b[0] - a[0]), a[1] + t * (b[1] - a[1])];
    const inOrOn = inside(p, poly) || poly.some((q, k) => distToSeg(p, q, poly[(k + 1) % poly.length]) < 0.004);
    if (inOrOn) { if (!first) first = p; last = p; }
  }
  return first && last ? [first, last] : null;
}

const DIR = (L) => ({ 90: "vertical", 0: "horizontal", 45: "diagonal", 135: "diagonal" }[L.deg]);

export function paperFolding(level = 2) {
  return retry(() => {
    const nFolds = level === 1 ? 1 : level === 2 ? pick([2, 2, 1]) : pick([2, 3, 3]);
    const sim = simulate(nFolds);
    if (!sim) return null;
    const holes = punch(sim.region, level >= 2 && rand(3) === 0 ? 2 : 1);
    if (!holes) return null;
    const lines = sim.steps.map((s) => s.L);
    const ans = unfold(holes, lines);
    if (tooClose(ans)) return null;

    const variants = [];
    // Forget one of the folds.
    for (let k = 0; k < lines.length; k++) variants.push(unfold(holes, lines.filter((_, i) => i !== k)));
    // Mirror across the wrong line for one fold.
    const perp = (L) => ({ ...L, dx: -L.dy, dy: L.dx });
    for (let k = 0; k < lines.length; k++) variants.push(unfold(holes, lines.map((L, i) => (i === k ? perp(L) : L))));
    // Whole pattern flipped / rotated.
    variants.push(ans.map(([x, y]) => [1 - x, y]), ans.map(([x, y]) => [x, 1 - y]), ans.map(([x, y]) => [1 - y, x]));
    // Only the punched holes, no unfolding; or one hole too many / too few.
    variants.push(holes);
    if (ans.length > 1) variants.push(ans.slice(1));
    variants.push([...ans, [1 - holes[0][1], holes[0][0]]]);
    const opts = shuffle(variants).filter((v) => v.length && v.every(([x, y]) => x > 0.03 && x < 0.97 && y > 0.03 && y < 0.97) && !tooClose(v));
    const cells = sim.steps.map((s) => stepSvg(s)).concat(finalSvg(sim.region, holes));
    const dirs = lines.map(DIR);
    return make({
      type: "folding",
      question: "The paper is folded as shown, then a hole is punched. What does it look like when unfolded?",
      prompt: { kind: "sequence", cells, arrows: true },
      correct: { svg: paperSvg(ans), k: keyOf(ans) },
      distractors: opts.map((v) => ({ svg: paperSvg(v), k: keyOf(v) })),
      optionKind: "svg", keyOf: (o) => o.k,
      explanation: `Unfold one step at a time, starting with the last fold: each fold doubles the holes, mirroring them across that fold line (${dirs.join(", then ")}). ${holes.length} hole${holes.length > 1 ? "s" : ""} × 2${lines.length > 1 ? `^${lines.length}` : ""} = ${ans.length} holes.`
    });
  });
}

// Exposed for tests: recompute an answer independently.
export const _test = { simulate, unfold, reflect, axes, clip };
