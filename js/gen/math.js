// Grade 9–10 math: algebra, geometry, percents, probability, functions, statistics.
// Distractors come from the mistakes students actually make.
import { make, retry, gcd } from "./common.js";
import { pick, randInt, shuffle, sample } from "../util.js";

const frac = (n, d) => { const g = gcd(n, d); n /= g; d /= g; if (d < 0) { n = -n; d = -d; } return d === 1 ? String(n) : `${n}/${d}`; };
const near = (n, k = 3) => shuffle([...Array(k)].flatMap((_, i) => [n + i + 1, n - i - 1]));
const S = (x) => (x < 0 ? `− ${-x}` : `+ ${x}`); // signed term
const num = (x) => (x < 0 ? `(${x})` : String(x));

const PROBLEMS = [
  // Linear equation with brackets on both sides
  () => {
    const x = randInt(-6, 12), a = randInt(2, 6), b = randInt(1, 9), c = randInt(1, a - 1 || 1), d = a * (x - b) - c * x;
    if (a === c) return null;
    return { q: `Solve for x:  ${a}(x − ${b}) = ${c}x ${S(d)}`, a: x, why: `${a}x − ${a * b} = ${c}x ${S(d)} → ${a - c}x = ${d + a * b} → x = ${x}.`,
      lures: [(d + b) / (a - c), (d - a * b) / (a - c), (d + a * b) / (a + c), -x] };
  },
  // System of equations
  () => {
    const x = randInt(1, 12), y = randInt(1, 12), m = randInt(2, 4);
    return { q: `If x + y = ${x + y} and ${m}x − y = ${m * x - y}, what is x?`, a: x, why: `Add the equations: ${m + 1}x = ${(m + 1) * x}, so x = ${x} (and y = ${y}).`, lures: [y, x + y, (m * x - y) / m] };
  },
  // Percent change twice
  () => {
    const p = pick([10, 20, 25, 30, 40, 50]), base = pick([80, 100, 120, 200, 240, 400]);
    const after = base * (1 + p / 100) * (1 - p / 100);
    return { q: `A $${base} jacket's price rises ${p}%, then the new price is cut by ${p}%. What is the final price?`, a: `$${after}`, why: `${base} × ${1 + p / 100} = ${base * (1 + p / 100)}; then × ${1 - p / 100} = ${after}. Percent changes don't cancel out.`,
      lures: [`$${base}`, `$${base * (1 - p / 100)}`, `$${base * (1 + p / 100)}`, `$${after + p}`, `$${base - p}`] };
  },
  // Percent of / reverse percent
  () => {
    const p = pick([15, 20, 25, 35, 40, 60, 75]), whole = pick([40, 80, 120, 160, 200, 240, 360]);
    const part = (p * whole) / 100;
    if (!Number.isInteger(part)) return null;
    return { q: `${part} is ${p}% of what number?`, a: whole, why: `${part} ÷ ${p / 100} = ${whole}.`, lures: [(part * p) / 100, part + p, (part * 100) / (100 - p), whole / 2].map((v) => Math.round(v * 100) / 100) };
  },
  // Ratio
  () => {
    const a = randInt(2, 7), b = randInt(2, 9), k = randInt(3, 9);
    if (gcd(a, b) !== 1) return null;
    return { q: `The ratio of boys to girls in a club is ${a}:${b}. There are ${(a + b) * k} members. How many girls are there?`, a: b * k, why: `${a + b} parts = ${(a + b) * k}, so 1 part = ${k}; girls = ${b} × ${k} = ${b * k}.`, lures: [a * k, (a + b) * k - b, b * (a + b), Math.round(((a + b) * k * b) / a)] };
  },
  // Exponent rules
  () => {
    const base = pick([2, 3]), m = randInt(3, 7), n = randInt(2, 6), p = randInt(1, m + n - 1);
    const e = m + n - p;
    return { q: `Simplify: (${base}^${m} × ${base}^${n}) ÷ ${base}^${p}`, a: `${base}^${e}`, why: `Add exponents when multiplying, subtract when dividing: ${m} + ${n} − ${p} = ${e}.`, lures: [`${base}^${m * n - p}`, `${base}^${m + n + p}`, `${base * base}^${e}`, `${base}^${m * n / p}`.includes(".") ? `${base}^${e + 1}` : `${base}^${(m * n) / p}`, `${base}^${e - 1}`] };
  },
  // Pythagorean triples
  () => {
    const [a, b, c] = pick([[3, 4, 5], [5, 12, 13], [8, 15, 17], [7, 24, 25], [20, 21, 29]]), k = pick([1, 2, 3]);
    const askLeg = Math.random() < 0.5;
    return askLeg
      ? { q: `A right triangle has hypotenuse ${c * k} and one leg ${a * k}. How long is the other leg?`, a: b * k, why: `${c * k}² − ${a * k}² = ${(b * k) ** 2}, and √${(b * k) ** 2} = ${b * k}.`, lures: [(c - a) * k, (c + a) * k, Math.round(Math.sqrt((c * k) ** 2 + (a * k) ** 2)), c * k] }
      : { q: `A right triangle has legs ${a * k} and ${b * k}. How long is the hypotenuse?`, a: c * k, why: `${a * k}² + ${b * k}² = ${(c * k) ** 2}, and √${(c * k) ** 2} = ${c * k}.`, lures: [(a + b) * k, (b - a) * k, (c + 1) * k, (a * b * k * k) / 2] };
  },
  // Circle area/circumference in terms of π
  () => {
    const r = randInt(2, 12), d = 2 * r, area = Math.random() < 0.5;
    return area
      ? { q: `A circle has a diameter of ${d} cm. What is its area?`, a: `${r * r}π cm²`, why: `Radius = ${r}; area = πr² = ${r * r}π.`, lures: [`${d * d}π cm²`, `${d}π cm²`, `${2 * r * r}π cm²`, `${r}π cm²`] }
      : { q: `A circle has an area of ${r * r}π cm². What is its circumference?`, a: `${2 * r}π cm`, why: `πr² = ${r * r}π → r = ${r}; circumference = 2πr = ${2 * r}π.`, lures: [`${r}π cm`, `${r * r}π cm`, `${4 * r}π cm`, `${r * r * 2}π cm`] };
  },
  // Probability (with and without replacement)
  () => {
    const r = randInt(2, 6), b = randInt(2, 7), t = r + b;
    return Math.random() < 0.5
      ? { q: `A bag has ${r} red and ${b} blue marbles. One is drawn at random. What is the probability it is red?`, a: frac(r, t), why: `${r} red out of ${t} total = ${frac(r, t)}.`, lures: [frac(b, t), frac(r, b), frac(1, 2) === frac(r, t) ? frac(r + 1, t) : frac(1, 2), frac(r, t + 1)] }
      : { q: `A bag has ${r} red and ${b} blue marbles. Two are drawn without replacement. What is the probability both are red?`, a: frac(r * (r - 1), t * (t - 1)), why: `${r}/${t} × ${r - 1}/${t - 1} = ${frac(r * (r - 1), t * (t - 1))}.`, lures: [frac(r * r, t * t), frac(r, t), frac(2 * r, t), frac(r - 1, t - 1)] };
  },
  // Slope
  () => {
    const x1 = randInt(-5, 5), y1 = randInt(-6, 6), dx = pick([1, 2, 3, 4, -2, -3]), m = pick([-3, -2, -1, 1, 2, 3, 1 / 2, -1 / 2]);
    const dy = m * dx; if (!Number.isInteger(dy)) return null;
    const x2 = x1 + dx, y2 = y1 + dy;
    const sl = Number.isInteger(m) ? String(m) : (m > 0 ? "1/2" : "-1/2");
    const inv = Number.isInteger(m) ? frac(1, m) : (m > 0 ? "2" : "-2");
    return { q: `What is the slope of the line through (${x1}, ${y1}) and (${x2}, ${y2})?`, a: sl, why: `(${y2} − ${num(y1)}) ÷ (${x2} − ${num(x1)}) = ${dy}/${dx} = ${sl}.`, lures: [inv, Number.isInteger(m) ? String(-m) : (m > 0 ? "-1/2" : "1/2"), frac(dx, dy || 1) === sl ? String(dy) : frac(-dy, dx || 1), String(dy + dx), String(y2 - x2)] };
  },
  // Evaluate a quadratic function at a negative number
  () => {
    const a = randInt(1, 3), b = randInt(-5, 5), c = randInt(-6, 6), x = randInt(-4, -1);
    const val = a * x * x + b * x + c;
    return { q: `If f(x) = ${a === 1 ? "" : a}x² ${S(b).replace("+ ", "+ ").replace("− ", "− ")}x ${S(c)}, what is f(${x})?`, a: val, why: `${a}(${x})² ${S(b)}(${x}) ${S(c)} = ${a * x * x} ${S(b * x)} ${S(c)} = ${val}. Remember (${x})² is positive.`,
      lures: [-a * x * x + b * x + c, a * x * x - b * x + c, a * 2 * x + b * x + c, val + 1] };
  },
  // Mean: find the missing value
  () => {
    const n = randInt(4, 6), mean = randInt(70, 90), vals = Array.from({ length: n - 1 }, () => randInt(mean - 12, mean + 12));
    const missing = mean * n - vals.reduce((a, b) => a + b, 0);
    if (missing < 50 || missing > 100) return null;
    return { q: `Your first ${n - 1} test scores are ${vals.join(", ")}. What score do you need on the next test for an average of ${mean}?`, a: missing, why: `You need a total of ${n} × ${mean} = ${mean * n}; you have ${mean * n - missing}, so you need ${missing}.`, lures: [mean, Math.round((mean * (n - 1) - vals.reduce((a, b) => a + b, 0)) + mean), missing + n, missing - n] };
  },
  // Speed / distance / time
  () => {
    const s1 = pick([30, 40, 50, 60]), s2 = pick([20, 30, 40, 60, 80]), d = pick([60, 120, 240]);
    if (s1 === s2 || (d / s1 + d / s2) % 1 !== 0 && ((2 * d) / (d / s1 + d / s2)) % 1 !== 0) return null;
    const avg = (2 * d) / (d / s1 + d / s2);
    if (!Number.isInteger(avg)) return null;
    return { q: `A car drives ${d} km at ${s1} km/h and returns the same ${d} km at ${s2} km/h. What is its average speed for the whole trip?`, a: `${avg} km/h`, why: `Total distance ${2 * d} km ÷ total time (${d / s1} + ${d / s2} h) = ${avg} km/h. It's not the simple average of the speeds.`, lures: [`${(s1 + s2) / 2} km/h`, `${Math.max(s1, s2)} km/h`, `${Math.abs(s1 - s2)} km/h`, `${avg + 5} km/h`] };
  },
  // Angles in polygons
  () => {
    const n = pick([5, 6, 8, 9, 10, 12]);
    const interior = ((n - 2) * 180) / n;
    return Math.random() < 0.5
      ? { q: `What is the sum of the interior angles of a polygon with ${n} sides?`, a: `${(n - 2) * 180}°`, why: `(n − 2) × 180 = ${n - 2} × 180 = ${(n - 2) * 180}°.`, lures: [`${n * 180}°`, `${(n - 1) * 180}°`, `360°`, `${(n - 3) * 180}°`] }
      : { q: `Each interior angle of a regular ${n}-sided polygon measures how many degrees?`, a: `${interior}°`, why: `Sum = ${(n - 2) * 180}°, divided by ${n} = ${interior}°.`, lures: [`${360 / n}°`, `${180 - 360 / n + 10}°`, `${(n * 180) / n}°`, `${interior + 10}°`] };
  },
  // Quadratic roots
  () => {
    const r1 = randInt(-6, 7), r2 = randInt(-6, 7);
    if (r1 === r2 || r1 === 0 || r2 === 0) return null;
    const b = -(r1 + r2), c = r1 * r2;
    const ans = `x = ${Math.min(r1, r2)} or x = ${Math.max(r1, r2)}`;
    return { q: `Solve: x² ${S(b)}x ${S(c)} = 0`, a: ans, why: `Factor: (x ${S(-r1)})(x ${S(-r2)}) = 0, so x = ${r1} or x = ${r2}.`,
      lures: [`x = ${Math.min(-r1, -r2)} or x = ${Math.max(-r1, -r2)}`, `x = ${Math.min(r1, -r2)} or x = ${Math.max(r1, -r2)}`, `x = ${Math.min(-r1, r2)} or x = ${Math.max(-r1, r2)}`, `x = ${Math.min(b, c)} or x = ${Math.max(b, c)}`] };
  },
  // Inequality with negative coefficient (flip!)
  () => {
    const a = randInt(2, 5), x = randInt(-5, 6), b = randInt(-9, 9), rhs = -a * x + b;
    return { q: `Solve:  −${a}x ${S(b)} < ${rhs}`, a: `x > ${x}`, why: `−${a}x < ${rhs - b}; dividing by −${a} flips the sign: x > ${x}.`, lures: [`x < ${x}`, `x > ${-x}`, `x < ${-x}`, `x > ${x + 1}`] };
  },
  // Simple interest
  () => {
    const P = pick([500, 800, 1000, 1200, 2000, 2500]), r = pick([2, 3, 4, 5, 6]), t = randInt(2, 5);
    const I = (P * r * t) / 100;
    return { q: `$${P} is invested at ${r}% simple interest per year. How much interest is earned in ${t} years?`, a: `$${I}`, why: `I = P × r × t = ${P} × ${r / 100} × ${t} = $${I}.`, lures: [`$${(P * r) / 100}`, `$${P + I}`, `$${P * r * t}`, `$${I + (P * r) / 100}`] };
  },
  // Consecutive integers
  () => {
    const n = randInt(3, 5), s = randInt(-5, 30), sum = (n * (2 * s + n - 1)) / 2;
    return { q: `The sum of ${n} consecutive integers is ${sum}. What is the largest?`, a: s + n - 1, why: `Middle value ≈ ${sum} ÷ ${n}; the integers are ${Array.from({ length: n }, (_, i) => s + i).join(", ")}.`, lures: [s, s + n, Math.round(sum / n), s + n - 2] };
  },
  // Rectangle: perimeter → area
  () => {
    const w = randInt(3, 12), extra = randInt(2, 8), l = w + extra;
    return { q: `A rectangle's length is ${extra} more than its width, and its perimeter is ${2 * (l + w)}. What is its area?`, a: l * w, why: `2(w + w + ${extra}) = ${2 * (l + w)} → w = ${w}, length = ${l}; area = ${l * w}.`, lures: [2 * (l + w), (l + 1) * w, l * (w - 1), w * w] };
  },
  // Scientific notation
  () => {
    const a = randInt(2, 9), b = randInt(2, 9), m = randInt(2, 6), n = randInt(2, 6);
    let c = a * b, e = m + n; if (c >= 10) { c /= 10; e += 1; }
    return { q: `(${a} × 10^${m}) × (${b} × 10^${n}) = ?`, a: `${c} × 10^${e}`, why: `${a} × ${b} = ${a * b}; 10^${m} × 10^${n} = 10^${m + n}; written properly that's ${c} × 10^${e}.`, lures: [`${a * b} × 10^${m * n}`, `${c} × 10^${m * n}`, `${a + b} × 10^${m + n}`, `${c} × 10^${e + 1}`, `${c} × 10^${e - 1}`] };
  }
];

export function mathProblem() {
  return retry(() => {
    const r = pick(PROBLEMS)();
    if (!r) return null;
    const correct = String(r.a);
    const lures = r.lures.map(String).filter((x) => !/NaN|Infinity|undefined|\./.test(x) || /π|\$/.test(x));
    const extras = typeof r.a === "number" ? near(r.a, 3).map(String) : [];
    return make({
      type: "math", question: r.q, prompt: { kind: "none" },
      correct, distractors: [...lures, ...extras], explanation: r.why
    });
  });
}
