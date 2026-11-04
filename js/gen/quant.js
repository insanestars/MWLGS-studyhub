// Quantitative battery: number analogies, number puzzles, number series, letter series.
import { make, retry, gcd } from "./common.js";
import { pick, randInt, rand, shuffle } from "../util.js";

const near = (n, spread = 3) => shuffle([...Array(spread)].flatMap((_, i) => [n + i + 1, n - i - 1]));
const fmt = (n) => (Number.isInteger(n) ? String(n) : String(Math.round(n * 1000) / 1000));

// ── Number analogies: [a → b] [c → d] [e → ?] ───────────────────────────────
// Candidate rule family, used to make sure only ONE simple rule fits both examples.
const FAMILY = (() => {
  const f = [];
  for (const a of [-3, -2, -1, 1, 2, 3, 4, 5, 6, 7, 8, 9, 1 / 2, 1 / 3, 1 / 4, 1 / 5, 3 / 2])
    for (let b = -40; b <= 40; b++) f.push((x) => a * x + b);
  for (let b = -20; b <= 20; b++) { f.push((x) => x * x + b); f.push((x) => 2 * x * x + b); f.push((x) => x * x * x + b); }
  f.push((x) => x * (x + 1), (x) => x * (x - 1), (x) => (x + 1) ** 2, (x) => (x - 1) ** 2, (x) => (x + 2) ** 2, (x) => x * x / 2, (x) => 2 ** x);
  return f;
})();

const NA_RULES = [
  () => { const k = randInt(3, 9); return { f: (x) => x * k, inputs: () => randInt(2, 15), why: `multiply by ${k}` }; },
  () => { const k = randInt(2, 9); return { f: (x) => x / k, inputs: () => k * randInt(2, 15), why: `divide by ${k}` }; },
  () => { const a = randInt(2, 5), b = pick([-9, -7, -5, -3, -1, 1, 2, 3, 4, 5, 7, 9]); return { f: (x) => a * x + b, inputs: () => randInt(2, 15), why: `multiply by ${a}, then ${b > 0 ? "add" : "subtract"} ${Math.abs(b)}` }; },
  () => { const b = pick([0, 0, 1, -1, 2, -2, 3, 5]); return { f: (x) => x * x + b, inputs: () => randInt(2, 12), why: b ? `square it, then ${b > 0 ? "add" : "subtract"} ${Math.abs(b)}` : "square it" }; },
  () => ({ f: (x) => x * x * x, inputs: () => randInt(2, 6), why: "cube it" }),
  () => ({ f: (x) => x * (x + 1), inputs: () => randInt(2, 12), why: "multiply it by the next number up: n × (n + 1)" }),
  () => { const k = randInt(2, 6); return { f: (x) => x / 2 + k, inputs: () => 2 * randInt(2, 20), why: `halve it, then add ${k}` }; },
  () => { const k = randInt(1, 4); return { f: (x) => (x + k) * 2, inputs: () => randInt(2, 20), why: `add ${k}, then double` }; },
  () => { const k = randInt(2, 4); return { f: (x) => (x - k) * 3, inputs: () => randInt(k + 1, 15), why: `subtract ${k}, then triple` }; }
];

export function numberAnalogy() {
  return retry(() => {
    const rule = pick(NA_RULES)();
    const xs = new Set(); while (xs.size < 3) xs.add(rule.inputs());
    const [x1, x2, x3] = [...xs];
    const [y1, y2, y3] = [x1, x2, x3].map(rule.f);
    if (![y1, y2, y3].every(Number.isInteger)) return null;
    // Every rule in the family that fits both examples must give the same answer.
    const eq = (a, b) => Math.abs(a - b) < 1e-9;
    const fits = FAMILY.filter((g) => eq(g(x1), y1) && eq(g(x2), y2));
    if (fits.some((g) => !eq(g(x3), y3))) return null;
    // Distractors: rules that fit only the first pair, plus near misses.
    const lures = FAMILY.filter((g) => eq(g(x1), y1) && !eq(g(x2), y2)).map((g) => g(x3)).filter(Number.isInteger);
    return make({
      type: "numanalogy",
      question: "The numbers in each pair are related by the same rule. What number completes the last pair?",
      prompt: { kind: "pairs", pairs: [{ a: x1, b: y1 }, { a: x2, b: y2 }], last: x3 },
      correct: fmt(y3), distractors: [...shuffle(lures).slice(0, 3), ...near(y3, 3)].map(fmt),
      explanation: `The rule is “${rule.why}”: ${x1} → ${y1}, ${x2} → ${y2}, so ${x3} → ${y3}.`
    });
  });
}

// ── Number puzzles ───────────────────────────────────────────────────────────
const SYM = ["■", "●", "▲", "◆", "★"];
const NP_RULES = [
  // ? op a = b op c
  () => {
    const forms = [
      (q, a) => [`? + ${a}`, q + a], (q, a) => [`? − ${a}`, q - a], (q, a) => [`? × ${a}`, q * a],
      (q, a) => [`? ÷ ${a}`, q / a], (q, a) => [`${a} × ? − ${a + 3}`, a * q - (a + 3)], (q, a) => [`?² − ${a}`, q * q - a]
    ];
    const q = randInt(3, 15), a = randInt(2, 9);
    const fi = rand(forms.length);
    if (fi === 3 && q % a) return null;
    const [left, val] = forms[fi](q, a);
    // Write the right side as an expression with the same value.
    const rights = [];
    for (let m = 2; m <= 12; m++) if (val % m === 0 && val / m > 1) rights.push(`${m} × ${val / m}`);
    for (let s = 3; s <= 30; s += 1) if (val - s > 0) rights.push(`${val + s} − ${s}`);
    if (!rights.length || val <= 0) return null;
    const right = pick(rights);
    return { text: `${left} = ${right}`, ans: q, why: `${right} = ${val}, so ${left.replace("?", q)} = ${val} when ? = ${q}.`, lures: [val, q + a, q - a, val - a, val + a] };
  },
  // Substitution chain
  () => {
    const [s1, s2] = shuffle(SYM).slice(0, 2);
    const a = randInt(3, 9), b = randInt(3, 9), v1 = a * b;
    const c = randInt(2, v1 - 2), v2 = v1 - c;
    const k = pick([2, 3, 4, 5].filter((x) => v2 % x === 0));
    if (!k) return null;
    return {
      text: `${s1} = ${a} × ${b}\n${s2} = ${s1} − ${c}\n? = ${s2} ÷ ${k}`, ans: v2 / k,
      why: `${s1} = ${v1}, ${s2} = ${v1} − ${c} = ${v2}, and ${v2} ÷ ${k} = ${v2 / k}.`, lures: [v1 / k, v2, (v1 + c) / k, v2 * k]
    };
  },
  // Two-symbol system
  () => {
    const [s1, s2] = shuffle(SYM).slice(0, 2);
    const x = randInt(2, 12), y = randInt(2, 12);
    if (x === y) return null;
    const m = randInt(2, 3);
    const e1 = `${Array(m).fill(s1).join(" + ")} + ${s2} = ${m * x + y}`;
    const e2 = `${s1} + ${s2} = ${x + y}`;
    return { text: `${e1}\n${e2}\n${s1} = ?`, ans: x, why: `Subtract the second line from the first: ${m - 1} × ${s1} = ${(m - 1) * x}, so ${s1} = ${x} (and ${s2} = ${y}).`, lures: [y, x + y, (m * x + y) - (x + y), x * m] };
  },
  // Balance-style statement
  () => {
    const x = randInt(2, 9), a = randInt(2, 6), b = randInt(1, 12);
    const total = a * x + b, c = randInt(2, 5);
    if (total % c) return null;
    return { text: `${a} × ? + ${b} = ${c} × ${total / c}`, ans: x, why: `${c} × ${total / c} = ${total}; ${total} − ${b} = ${total - b}; ${total - b} ÷ ${a} = ${x}.`, lures: [total - b, (total + b) / a, x + 1, total / a] };
  }
];

export function numberPuzzle() {
  return retry(() => {
    const r = pick(NP_RULES)();
    if (!r || !Number.isInteger(r.ans)) return null;
    return make({
      type: "numpuzzle",
      question: "What number should replace the question mark?",
      prompt: { kind: "equation", text: r.text },
      correct: String(r.ans), distractors: [...r.lures.filter(Number.isInteger), ...near(r.ans, 3)].map(String),
      explanation: r.why
    });
  });
}

// ── Number series (hard) ─────────────────────────────────────────────────────
const PRIMES = [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47, 53];
const SERIES = [
  () => { const a = randInt(1, 20), d = randInt(1, 4), k = randInt(1, 4), t = [a];
    for (let i = 0; i < 6; i++) t.push(t[i] + d + i * k);
    return [t, `The differences grow by ${k} each time (+${d}, +${d + k}, +${d + 2 * k}, …).`]; },
  () => { const a = randInt(1, 9), t = [a]; let g = randInt(1, 3);
    for (let i = 0; i < 6; i++) { t.push(t[i] + g); g *= 2; }
    return [t, "The differences double each time."]; },
  () => { const a = randInt(1, 4), m = pick([2, 3]), c = pick([1, -1, 2]), t = [a];
    for (let i = 0; i < 5; i++) t.push(t[i] * m + c);
    if (t[5] > 2000) return null;
    return [t, `Each term is ×${m}, then ${c > 0 ? "+" : "−"}${Math.abs(c)}.`]; },
  () => { const s = randInt(0, 3); const t = PRIMES.slice(s, s + 7);
    return [t, "These are consecutive prime numbers."]; },
  () => { const s = randInt(1, 4), t = [];
    for (let n = s; n < s + 7; n++) t.push((n * (n + 1)) / 2);
    return [t, "Triangular numbers: the differences go up by 1 each time."]; },
  () => { const t = [randInt(1, 4), randInt(2, 6)];
    for (let i = 2; i < 8; i++) t.push(t[i - 1] + t[i - 2]);
    return [t, "Each term is the sum of the two before it."]; },
  () => { const t = [randInt(1, 3)];
    for (let i = 1; i < 6; i++) t.push(t[i - 1] * i);
    t.splice(0, 0); return [t, "Multiply by 1, then 2, then 3, then 4, then 5…"]; },
  () => { const t = [randInt(0, 2), randInt(1, 2), randInt(2, 4)];
    for (let i = 3; i < 8; i++) t.push(t[i - 1] + t[i - 2] + t[i - 3]);
    return [t, "Each term is the sum of the three before it."]; },
  () => { const a = pick([2, 3, 4, 5]), r = -2, t = [a];
    for (let i = 0; i < 5; i++) t.push(t[i] * r);
    return [t, "Each term is multiplied by −2."]; },
  () => { const s = randInt(1, 5), c = pick([0, 1, -1, 2]), t = [];
    for (let n = s; n < s + 6; n++) t.push(n * n * n + c);
    return [t, `Cube numbers${c ? (c > 0 ? ` plus ${c}` : ` minus ${-c}`) : ""}.`]; },
  () => { const s = randInt(1, 4), t = [];
    for (let n = s; n < s + 7; n++) t.push(n * (n + 1));
    return [t, "n × (n + 1): 1×2, 2×3, 3×4, …"]; },
  () => { const a = randInt(1, 6), t = [a];
    for (let i = 0; i < 6; i++) t.push(t[i] + PRIMES[i]);
    return [t, "The differences are the prime numbers 2, 3, 5, 7, 11, 13."]; },
  () => { const a = randInt(2, 6), m = pick([2, 3]), k = randInt(1, 5), t = [a];
    for (let i = 0; i < 6; i++) t.push(i % 2 === 0 ? t[i] * m : t[i] - k);
    if (t[6] > 3000) return null;
    return [t, `The pattern alternates: ×${m}, then −${k}.`]; },
  () => { const a = randInt(3, 12), da = randInt(2, 6), b = randInt(30, 60), db = randInt(2, 5), t = [];
    for (let i = 0; i < 8; i++) t.push(i % 2 === 0 ? a + (i / 2) * da : b - ((i - 1) / 2) * db);
    return [t, `Two series alternate: one goes +${da}, the other −${db}.`]; },
  () => { const a = pick([64, 96, 128, 160, 192]), t = [a];
    for (let i = 0; i < 6; i++) t.push(t[i] / 2);
    return [t, "Each term is halved."]; }
];

export function numberSeries() {
  return retry(() => {
    const r = pick(SERIES)();
    if (!r) return null;
    const [terms, why] = r;
    const shown = terms.slice(0, -1), ans = terms[terms.length - 1];
    const last = shown[shown.length - 1], prev = shown[shown.length - 2];
    const lures = [last + (last - prev), last * 2, ans + (last - prev), ans - 1, ans + 1, ans + 2, ans - 2];
    return make({
      type: "series", question: "What comes next in the series?",
      prompt: { kind: "series", items: shown.map(fmt) },
      correct: fmt(ans), distractors: lures.map(fmt), explanation: `${fmt(ans)} — ${why}`
    });
  });
}

// ── Letter series (hard) ─────────────────────────────────────────────────────
const L = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const ch = (i) => L[((i % 26) + 26) % 26];
const LETTER = [
  () => { const s = randInt(0, 4), t = [s], d = [1, 3, 5, 7, 9]; // +1,+3,+5…
    for (let i = 0; i < 5; i++) t.push(t[i] + d[i]);
    if (t[5] > 25) return null;
    return [t.map(ch), "The jumps grow by two: +1, +3, +5, +7, +9."]; },
  () => { const s = randInt(0, 6), k = randInt(1, 2), t = [];
    for (let i = 0; i < 6; i++) t.push(ch(s + i * k * 2) + ch(25 - s - i * k));
    return [t, `First letter moves forward ${2 * k}; second letter moves back ${k} from Z.`]; },
  () => { const s = randInt(0, 10), g = randInt(1, 3), t = [];
    for (let i = 0; i < 5; i++) t.push(ch(s + i) + ch(s + i + g) + ch(s + i + 2 * g));
    return [t, `Each group shifts forward one; inside a group, letters are ${g} apart.`]; },
  () => { const s = randInt(0, 6), k = randInt(2, 3), t = [];
    for (let i = 0; i < 6; i++) t.push(ch(s + i * k) + String(s + i * k + 1));
    return [t, `Letters skip forward ${k}; each number is that letter's position in the alphabet.`]; },
  () => { const a = randInt(0, 5), b = randInt(18, 25), t = [];
    for (let i = 0; i < 8; i++) t.push(i % 2 === 0 ? ch(a + (i / 2) * 3) : ch(b - ((i - 1) / 2) * 2));
    return [t, "Two series alternate: one moves forward 3, the other back 2."]; },
  () => { const s = randInt(0, 3), t = [], n = [1, 2, 3, 4, 5];
    let p = s; for (const x of n) { t.push(L.slice(p, p + x).length === x ? L.slice(p, p + x) : null); p += x; }
    if (t.includes(null) || p > 26) return null;
    return [t, "Each group takes the next run of letters, one longer each time."]; },
  () => { const s = randInt(0, 4), t = [];
    for (let i = 0; i < 6; i++) t.push(ch(s + i * i));
    if (s + 25 > 25) return null;
    return [t, "The jumps are 1, 3, 5, 7, 9 — positions follow square numbers."]; }
];
const shift = (str, d) => [...str].map((c) => (/[A-Z]/.test(c) ? ch(L.indexOf(c) + d) : c)).join("");

export function letterSeries() {
  return retry(() => {
    const r = pick(LETTER)();
    if (!r) return null;
    const [terms, why] = r;
    const shown = terms.slice(0, -1), ans = terms[terms.length - 1];
    const distract = [1, -1, 2, -2, 3].map((d) => shift(ans, d));
    if (ans.length > 1) distract.push([...ans].reverse().join(""), shift(ans[0], 1) + ans.slice(1), ans.slice(0, -1) + shift(ans.slice(-1), 1));
    if (/\d/.test(ans)) distract.push(ans.replace(/\d+/, (m) => String(+m + 1)), ans.replace(/\d+/, (m) => String(+m - 1)));
    return make({
      type: "letter", question: "What comes next in the series?",
      prompt: { kind: "series", items: shown },
      correct: ans, distractors: shuffle(distract), explanation: `${ans} — ${why}`
    });
  });
}

export { gcd };
