// No-calculator math, part 1: arithmetic, fractions/decimals/percents, ratios & proportions.
// Each template returns { q, a, steps[], lures[] } (or null to retry). Numbers are chosen so
// everything can be done by hand on scratch paper.
import { pick, randInt as R, shuffle, sample } from "../util.js";
import { gcd } from "./common.js";
import { SUP, N, P, fmt, money, F, fAdd, fSub, fMul, fDiv, fStr, mixed, lcm, isPrime, factorStr, near } from "./mathkit.js";

// ── Arithmetic ───────────────────────────────────────────────────────────────
export const ARITH = [
  () => { // order of operations
    const a = R(2, 30), b = R(2, 12), c = R(2, 12), e = R(2, 9), d = e * R(2, 12), v = a + b * c - d / e;
    return { q: `Evaluate: ${a} + ${b} × ${c} − ${d} ÷ ${e}`, a: v,
      steps: [`Order of operations: multiply and divide before adding and subtracting.`, `${b} × ${c} = ${b * c} and ${d} ÷ ${e} = ${d / e}.`, `${a} + ${b * c} − ${d / e} = ${N(v)}.`],
      lures: [(a + b) * c - d / e, a + b * c - d, ((a + b) * c - d) / e, a + b * (c - d / e)] };
  },
  () => { // parentheses and exponents
    const a = R(2, 9), b = R(1, 8), c = R(2, 9), d = R(2, 9), v = (a + b) ** 2 - c * d;
    return { q: `Evaluate: (${a} + ${b})${SUP(2)} − ${c} × ${d}`, a: v,
      steps: [`Parentheses first: ${a} + ${b} = ${a + b}.`, `Exponent: ${a + b}${SUP(2)} = ${(a + b) ** 2}.`, `Multiply: ${c} × ${d} = ${c * d}.`, `${(a + b) ** 2} − ${c * d} = ${N(v)}.`],
      lures: [a * a + b * b - c * d, ((a + b) ** 2 - c) * d, 2 * (a + b) - c * d, (a + b) ** 2 + c * d] };
  },
  () => { // integers with negatives
    const a = R(3, 12), b = R(2, 9), d = R(2, 6), c = d * R(2, 9), v = -a * b + -c / -d;
    return { q: `Evaluate: ${P(-a)} × ${b} + ${P(-c)} ÷ ${P(-d)}`, a: v,
      steps: [`A negative times a positive is negative: ${P(-a)} × ${b} = ${N(-a * b)}.`, `A negative divided by a negative is positive: ${P(-c)} ÷ ${P(-d)} = ${c / d}.`, `${N(-a * b)} + ${c / d} = ${N(v)}.`],
      lures: [-a * b - c / d, a * b + c / d, a * b - c / d, -a * b + c * d] };
  },
  () => { // long multiplication
    const x = R(12, 98), y = R(104, 899), t = Math.floor(x / 10), o = x % 10;
    if (o === 0) return null;
    return { q: `Multiply without a calculator: ${y} × ${x}`, a: x * y,
      steps: [`Split ${x} into ${t * 10} + ${o}.`, `${y} × ${t * 10} = ${fmt(y * t * 10)}.`, `${y} × ${o} = ${fmt(y * o)}.`, `Add the partial products: ${fmt(y * t * 10)} + ${fmt(y * o)} = ${fmt(x * y)}.`],
      lures: [y * t * 10 + y * o * 10, y * t + y * o, x * y + 10 * y, x * y - y, x * y + 100] };
  },
  () => { // long division (partial quotients)
    const dv = R(12, 48), q = R(102, 389), n = dv * q;
    const H = Math.floor(q / 100) * 100, T = Math.floor((q % 100) / 10) * 10, O = q % 10;
    const steps = [`Use partial quotients. ${dv} × ${H} = ${fmt(dv * H)}; ${fmt(n)} − ${fmt(dv * H)} = ${fmt(n - dv * H)}.`];
    let rem = n - dv * H;
    if (T) { steps.push(`${dv} × ${T} = ${fmt(dv * T)}; ${fmt(rem)} − ${fmt(dv * T)} = ${fmt(rem - dv * T)}.`); rem -= dv * T; }
    if (O) steps.push(`${dv} × ${O} = ${fmt(dv * O)}; remainder 0.`);
    steps.push(`Add the parts: ${[H, T, O].filter(Boolean).join(" + ")} = ${q}.`);
    return { q: `Divide without a calculator: ${fmt(n)} ÷ ${dv}`, a: q, steps, lures: [q + 10, q - 10, q + 1, Math.floor(q / 10) * 10 + ((q % 10) + 1) % 10, q + 100] };
  },
  () => { // mental math shortcuts
    const kind = pick(["99", "25", "101", "11"]);
    if (kind === "99") { const n = R(13, 89); return { q: `Compute mentally: 99 × ${n}`, a: 99 * n, steps: [`99 × ${n} = (100 − 1) × ${n}.`, `= ${100 * n} − ${n} = ${fmt(99 * n)}.`], lures: [100 * n - 1, 99 * n + n, 99 * n - 10, 9 * n * 10] }; }
    if (kind === "25") { const n = 4 * R(5, 60); return { q: `Compute mentally: 25 × ${n}`, a: 25 * n, steps: [`25 = 100 ÷ 4, so 25 × ${n} = ${n} ÷ 4 × 100.`, `${n} ÷ 4 = ${n / 4}, and ${n / 4} × 100 = ${fmt(25 * n)}.`], lures: [25 * n + 100, 20 * n, 25 * n - 25, n * 4 * 25 / 10] }; }
    if (kind === "101") { const n = R(14, 98); return { q: `Compute mentally: 101 × ${n}`, a: 101 * n, steps: [`101 × ${n} = 100 × ${n} + 1 × ${n}.`, `= ${100 * n} + ${n} = ${fmt(101 * n)}.`], lures: [100 * n + 1, 101 * n + 10, 110 * n, 101 * n - n] }; }
    const n = R(12, 81); return { q: `Compute mentally: 11 × ${n}`, a: 11 * n, steps: [`11 × ${n} = 10 × ${n} + ${n}.`, `= ${10 * n} + ${n} = ${11 * n}.`], lures: [10 * n + 11, 11 * n + 10, 11 * n - 1, 12 * n] };
  },
  () => { // exponents and roots
    const a = pick([2, 3, 4, 5]), m = a === 2 ? R(3, 6) : a === 3 ? R(2, 4) : 2, s = R(4, 15), b = pick([2, 3, 10]), n = b === 10 ? 2 : R(2, 3);
    const v = a ** m + s - b ** n;
    return { q: `Evaluate: ${a}${SUP(m)} + √${s * s} − ${b}${SUP(n)}`, a: v,
      steps: [`${a}${SUP(m)} = ${Array(m).fill(a).join(" × ")} = ${a ** m}.`, `√${s * s} = ${s} because ${s} × ${s} = ${s * s}.`, `${b}${SUP(n)} = ${b ** n}.`, `${a ** m} + ${s} − ${b ** n} = ${N(v)}.`],
      lures: [a * m + s - b * n, a ** m + s * s - b ** n, a ** m + s / 2 - b ** n, v + s] };
  },
  () => { // GCF
    const g = pick([4, 6, 8, 9, 12, 14, 15, 18]), x = g * pick([2, 3, 5, 7]), y = g * pick([3, 4, 5, 7, 11].filter((k) => gcd(k, x / g) === 1));
    if (x === y) return null;
    return { q: `What is the greatest common factor (GCF) of ${x} and ${y}?`, a: gcd(x, y),
      steps: [`Prime factorizations: ${x} = ${factorStr(x)}, ${y} = ${factorStr(y)}.`, `Multiply the primes they share: GCF = ${gcd(x, y)}.`],
      lures: [gcd(x, y) / 2, gcd(x, y) * 2, (x * y) / gcd(x, y), Math.min(x, y) - gcd(x, y)] };
  },
  () => { // LCM
    const x = pick([4, 6, 8, 9, 10, 12, 14, 15, 16, 18]), y = pick([6, 8, 9, 10, 12, 15, 20, 21, 24]);
    if (x === y || x % y === 0 || y % x === 0) return null;
    const L = lcm(x, y);
    return { q: `What is the least common multiple (LCM) of ${x} and ${y}?`, a: L,
      steps: [`Prime factorizations: ${x} = ${factorStr(x)}, ${y} = ${factorStr(y)}.`, `Take each prime the greatest number of times it appears: LCM = ${factorStr(L)} = ${L}.`, `Shortcut check: ${x} × ${y} ÷ GCF(${gcd(x, y)}) = ${L}.`],
      lures: [x * y, gcd(x, y), L * 2, L / 2] };
  },
  () => { // which is prime
    const primes = [53, 59, 61, 67, 71, 73, 79, 83, 89, 97, 101, 103, 107, 109, 113, 127, 131, 137];
    const fakes = [51, 57, 87, 91, 111, 117, 119, 133, 143, 161, 169, 187, 203, 209, 221, 69, 93, 123, 129, 141];
    const p = pick(primes), f = sample(fakes, 4);
    return { q: "Which of these numbers is prime?", a: p,
      steps: [`A prime has exactly two factors: 1 and itself.`, ...f.map((x) => `${x} = ${factorStr(x)}, so it is not prime.`), `${p} has no factor between 2 and ${Math.floor(Math.sqrt(p))}, so it is prime.`],
      lures: f };
  },
  () => { // rounding
    const n = R(1000, 99999) + R(0, 999) / 1000, place = pick(["hundred", "ten", "tenth", "hundredth"]);
    const m = { hundred: 100, ten: 10, tenth: 0.1, hundredth: 0.01 }[place];
    const r = Math.round(n / m) * m, rs = fmtR(r, place), ns = n.toFixed(3);
    return { q: `Round ${Number(ns).toLocaleString("en-US", { minimumFractionDigits: 3 })} to the nearest ${place}.`, a: rs,
      steps: [`Look at the digit to the right of the ${place}s place.`, `If it is 5 or more, round up; otherwise round down.`, `Result: ${rs}.`],
      lures: [fmtR(Math.floor(n / m) * m === r ? Math.ceil(n / m + 1e-9) * m : Math.floor(n / m) * m, place), fmtR(r + m, place), fmtR(Math.round(n / (m * 10)) * m * 10, place), fmtR(Math.round(n / (m / 10)) * (m / 10), place === "hundredth" ? "thousandth" : place)] };
  },
  () => { // estimate a square root
    const s = R(3, 14), n = s * s + R(1, 2 * s);
    return { q: `√${n} lies between which two whole numbers?`, a: `${s} and ${s + 1}`,
      steps: [`${s}${SUP(2)} = ${s * s} and ${s + 1}${SUP(2)} = ${(s + 1) ** 2}.`, `${s * s} < ${n} < ${(s + 1) ** 2}, so ${s} < √${n} < ${s + 1}.`],
      lures: [`${s - 1} and ${s}`, `${s + 1} and ${s + 2}`, `${Math.floor(n / 2)} and ${Math.floor(n / 2) + 1}`, `${s - 2} and ${s - 1}`] };
  },
  () => { // absolute value
    const a = R(-12, 12), b = R(-12, 12), c = R(-12, 12), d = R(-12, 12), v = Math.abs(a - b) - Math.abs(c - d);
    return { q: `Evaluate: |${N(a)} − ${P(b)}| − |${N(c)} − ${P(d)}|`, a: v,
      steps: [`${N(a)} − ${P(b)} = ${N(a - b)}, and |${N(a - b)}| = ${Math.abs(a - b)}.`, `${N(c)} − ${P(d)} = ${N(c - d)}, and |${N(c - d)}| = ${Math.abs(c - d)}.`, `${Math.abs(a - b)} − ${Math.abs(c - d)} = ${N(v)}.`],
      lures: [(a - b) - (c - d), Math.abs(a - b) + Math.abs(c - d), Math.abs(a + b) - Math.abs(c + d), -v] };
  },
  () => { // scientific notation
    const a = R(2, 9), b = R(2, 9), m = R(2, 7), n = R(2, 6);
    let c = a * b, e = m + n; const big = c >= 10; if (big) { c /= 10; e += 1; }
    return { q: `(${a} × 10${SUP(m)}) × (${b} × 10${SUP(n)}) = ?`, a: `${c} × 10${SUP(e)}`,
      steps: [`Multiply the numbers: ${a} × ${b} = ${a * b}.`, `Multiply the powers of 10 by adding exponents: 10${SUP(m)} × 10${SUP(n)} = 10${SUP(m + n)}.`, big ? `${a * b} × 10${SUP(m + n)} = ${c} × 10${SUP(e)} (the first number must be between 1 and 10).` : `Answer: ${c} × 10${SUP(e)}.`],
      lures: [`${a * b} × 10${SUP(m * n)}`, `${c} × 10${SUP(m * n)}`, `${a + b} × 10${SUP(m + n)}`, `${c} × 10${SUP(e + 1)}`, `${c} × 10${SUP(e - 1)}`] };
  },
  () => { // order of operations with fractions bar
    const a = R(2, 9), b = R(2, 9), c = R(2, 6), top = a * b + c * c, k = pick([2, 3, 4, 5].filter((x) => top % x === 0));
    if (!k) return null;
    return { q: `Evaluate: (${a} × ${b} + ${c}${SUP(2)}) ÷ ${k}`, a: top / k,
      steps: [`Inside the parentheses: ${a} × ${b} = ${a * b} and ${c}${SUP(2)} = ${c * c}.`, `${a * b} + ${c * c} = ${top}.`, `${top} ÷ ${k} = ${top / k}.`],
      lures: [(a * b + c * 2) / k, a * b + (c * c) / k, (a + b + c * c) / k, top / k + 1] };
  }
];
function fmtR(x, place) {
  const d = { hundred: 0, ten: 0, tenth: 1, hundredth: 2, thousandth: 3 }[place];
  return Number(x).toLocaleString("en-US", { minimumFractionDigits: d, maximumFractionDigits: d });
}

// ── Fractions, decimals & percents ───────────────────────────────────────────
const DEN = [2, 3, 4, 5, 6, 8, 9, 10, 12];
const nice = (d) => [2, 4, 5, 8, 10, 20, 25, 40, 50].includes(d);
export const FDP = [
  () => { // add fractions
    const b = pick(DEN), d = pick(DEN.filter((x) => x !== b)), a = R(1, b - 1), c = R(1, d - 1);
    if (gcd(a, b) > 1 || gcd(c, d) > 1) return null;
    const L = lcm(b, d), s = fAdd([a, b], [c, d]);
    return { q: `Add: ${a}/${b} + ${c}/${d}`, a: mixed(s),
      steps: [`Common denominator: LCM(${b}, ${d}) = ${L}.`, `${a}/${b} = ${a * L / b}/${L} and ${c}/${d} = ${c * L / d}/${L}.`, `${a * L / b}/${L} + ${c * L / d}/${L} = ${a * L / b + c * L / d}/${L} = ${mixed(s)}.`],
      lures: [fStr(F(a + c, b + d)), mixed(F(a * d + c * b + 1, b * d)), mixed(fSub([a, b], [c, d])), mixed(F(a + c, L)), mixed(fMul([a, b], [c, d]))] };
  },
  () => { // subtract mixed numbers with regrouping
    const b = pick([3, 4, 5, 6, 8]), d = pick([2, 3, 4, 6, 8].filter((x) => x !== b)), W = R(4, 9), w = R(1, W - 2);
    const a = R(1, b - 1), c = R(1, d - 1);
    if (gcd(a, b) > 1 || gcd(c, d) > 1 || a / b >= c / d) return null; // force regrouping
    const x = F(W * b + a, b), y = F(w * d + c, d), r = fSub(x, y), L = lcm(b, d);
    return { q: `Subtract: ${W} ${a}/${b} − ${w} ${c}/${d}`, a: mixed(r),
      steps: [`Common denominator ${L}: ${W} ${a * L / b}/${L} − ${w} ${c * L / d}/${L}.`, `${a * L / b}/${L} is less than ${c * L / d}/${L}, so regroup: ${W} ${a * L / b}/${L} = ${W - 1} ${a * L / b + L}/${L}.`, `${W - 1} − ${w} = ${W - 1 - w}; ${a * L / b + L}/${L} − ${c * L / d}/${L} = ${a * L / b + L - c * L / d}/${L}.`, `Answer: ${mixed(r)}.`],
      lures: [mixed(fSub(F(W * L + c * L / d, L), F(w * L + a * L / b, L))), mixed(fAdd(r, [1, 1])), mixed(fSub(r, [1, L])), mixed(F(Math.abs((W - w) * L + (a * L / b - c * L / d)), L))] };
  },
  () => { // multiply mixed numbers
    const a = R(1, 3), b = pick([2, 3, 4]), n = R(1, b - 1), c = R(1, 4), d = pick([2, 3, 5]), m = R(1, d - 1);
    if (gcd(n, b) > 1 || gcd(m, d) > 1) return null;
    const x = F(a * b + n, b), y = F(c * d + m, d), p = fMul(x, y);
    return { q: `Multiply: ${a} ${n}/${b} × ${c} ${m}/${d}`, a: mixed(p),
      steps: [`Change to improper fractions: ${a} ${n}/${b} = ${x[0]}/${x[1]} and ${c} ${m}/${d} = ${y[0]}/${y[1]}.`, `Multiply tops and bottoms: ${x[0] * y[0]}/${x[1] * y[1]}.`, `Simplify: ${mixed(p)}.`],
      lures: [mixed(F(a * c * b * d + n * m, b * d)), mixed(fAdd(x, y)), mixed(F(a * c, 1)), mixed(fAdd(p, [1, 1])), mixed(fDiv(x, y))] };
  },
  () => { // divide fractions
    const a = R(1, 8), b = pick([3, 4, 5, 6, 7, 8, 9]), c = R(1, 8), d = pick([2, 3, 4, 5, 6]);
    if (gcd(a, b) > 1 || gcd(c, d) > 1 || a >= b * 2) return null;
    const r = fDiv([a, b], [c, d]);
    return { q: `Divide: ${a}/${b} ÷ ${c}/${d}`, a: mixed(r),
      steps: [`Keep, change, flip: ${a}/${b} × ${d}/${c}.`, `= ${a * d}/${b * c}.`, `Simplify: ${mixed(r)}.`],
      lures: [mixed(fMul([a, b], [c, d])), mixed(fDiv([c, d], [a, b])), mixed(F(a * c, b * d + 1)), mixed(F(a + d, b + c))] };
  },
  () => { // decimal multiplication
    const x = R(11, 96), y = pick([5, 25, 12, 15, 4, 8, 75]), xd = 1, yd = 2;
    const prod = x * y, v = prod / 10 ** (xd + yd);
    return { q: `Multiply: ${(x / 10).toFixed(1)} × ${(y / 100).toFixed(2)}`, a: fmt(v),
      steps: [`Ignore the decimals: ${x} × ${y} = ${prod}.`, `Count decimal places: ${xd} + ${yd} = ${xd + yd}.`, `Move the decimal ${xd + yd} places left: ${fmt(v)}.`],
      lures: [fmt(prod / 100), fmt(prod / 10000), fmt(v + 0.1), fmt(prod / 10)] };
  },
  () => { // decimal division
    const q = pick([12, 15, 18, 24, 35, 40, 45, 60, 80, 120, 150]), d = pick([0.2, 0.4, 0.5, 0.06, 0.03, 0.08, 0.15, 0.25]);
    const n = Math.round(q * d * 1000) / 1000;
    const places = String(d).split(".")[1].length, sh = 10 ** places;
    return { q: `Divide: ${n} ÷ ${d}`, a: fmt(q),
      steps: [`Move both decimal points ${places} place${places > 1 ? "s" : ""} to the right: ${fmt(n * sh)} ÷ ${fmt(d * sh)}.`, `${fmt(n * sh)} ÷ ${fmt(d * sh)} = ${fmt(q)}.`],
      lures: [fmt(q / 10), fmt(q * 10), fmt(n * d), fmt(q + 1)] };
  },
  () => { // fraction → decimal → percent
    const d = pick([8, 20, 25, 40, 16, 5, 4, 50]), n = R(1, d - 1);
    if (gcd(n, d) > 1) return null;
    const dec = n / d, pct = dec * 100;
    return { q: `Write ${n}/${d} as a percent.`, a: `${fmt(pct)}%`,
      steps: [`Divide: ${n} ÷ ${d} = ${fmt(dec)}.`, `Multiply by 100 to get a percent: ${fmt(pct)}%.`],
      lures: [`${fmt(dec)}%`, `${fmt(pct / 10)}%`, `${fmt(n * 10)}%`, `${fmt((d / n) * 100)}%`, `${fmt(pct + 5)}%`] };
  },
  () => { // percent of a number
    const p = pick([5, 10, 12.5, 15, 20, 25, 30, 35, 40, 45, 60, 75, 120, 150]), n = pick([40, 60, 80, 120, 160, 200, 240, 320, 360, 480]);
    const v = (p * n) / 100;
    if (!Number.isInteger(v * 2)) return null;
    return { q: `What is ${p}% of ${n}?`, a: fmt(v),
      steps: [`10% of ${n} is ${n / 10}.`, p === 12.5 ? `12.5% = 1/8, and ${n} ÷ 8 = ${fmt(v)}.` : `${p}% = ${p / 10} × 10%, so ${p / 10} × ${n / 10} = ${fmt(v)}.`],
      lures: [fmt(n / p), fmt(v * 10), fmt(n - v), fmt(v + n / 10), fmt(p + n)] };
  },
  () => { // percent change
    const a = pick([20, 25, 40, 50, 60, 80, 120, 200]), pct = pick([10, 15, 20, 25, 30, 40, 50, 75]), up = Math.random() < 0.5;
    const b = up ? a * (1 + pct / 100) : a * (1 - pct / 100);
    if (!Number.isInteger(b)) return null;
    return { q: `A price changes from $${a} to $${b}. What is the percent ${up ? "increase" : "decrease"}?`, a: `${pct}%`,
      steps: [`Change = ${Math.abs(b - a)}.`, `Percent change = change ÷ ORIGINAL = ${Math.abs(b - a)} ÷ ${a} = ${fmt(pct / 100)}.`, `= ${pct}%.`],
      lures: [`${fmt(Math.round((Math.abs(b - a) / b) * 1000) / 10)}%`, `${Math.abs(b - a)}%`, `${pct * 2}%`, `${100 - pct}%`] };
  },
  () => { // what percent is a of b
    const b = pick([20, 25, 40, 50, 80, 120, 160, 200, 250]), p = pick([5, 10, 15, 20, 25, 30, 40, 60, 75, 80]), a = (b * p) / 100;
    if (!Number.isInteger(a)) return null;
    return { q: `${a} is what percent of ${b}?`, a: `${p}%`,
      steps: [`Percent = part ÷ whole × 100.`, `${a} ÷ ${b} = ${fmt(a / b)}.`, `${fmt(a / b)} × 100 = ${p}%.`],
      lures: [`${fmt((b / a) * 100)}%`, `${a}%`, `${100 - p}%`, `${p / 10}%`] };
  },
  () => { // discount then tax
    const price = pick([40, 60, 80, 120, 150, 200]), disc = pick([10, 20, 25, 30, 40, 50]), tax = pick([5, 10]);
    const sale = price * (1 - disc / 100), total = sale * (1 + tax / 100);
    return { q: `A $${price} jacket is ${disc}% off. Sales tax of ${tax}% is added to the sale price. What is the total cost?`, a: money(total),
      steps: [`Discount: ${disc}% of ${price} = ${fmt(price * disc / 100)}, so the sale price is $${fmt(sale)}.`, `Tax: ${tax}% of ${fmt(sale)} = ${fmt(sale * tax / 100)}.`, `Total: ${fmt(sale)} + ${fmt(sale * tax / 100)} = ${money(total)}.`],
      lures: [money(price * (1 - (disc - tax) / 100)), money(sale), money(price * (1 + tax / 100) - price * disc / 100 + 1), money(price - disc + tax), money(sale + tax)] };
  },
  () => { // compare fractions/decimals/percents
    const pool = shuffle([[3, 8], [2, 5], [5, 12], [7, 16], [4, 9], [3, 7], [5, 11], [1, 3]]).slice(0, 2);
    const vals = [
      { s: `${pool[0][0]}/${pool[0][1]}`, v: pool[0][0] / pool[0][1] },
      { s: `${pool[1][0]}/${pool[1][1]}`, v: pool[1][0] / pool[1][1] },
      { s: `0.${R(30, 49)}`, v: 0 }, { s: `${R(31, 48)}%`, v: 0 }, { s: `0.${R(4, 4)}${R(0, 9)}`, v: 0 }
    ];
    for (const x of vals) if (!x.v) x.v = x.s.endsWith("%") ? parseFloat(x.s) / 100 : parseFloat(x.s);
    const sorted = [...vals].sort((a, b) => b.v - a.v);
    if (sorted[0].v - sorted[1].v < 0.004 || new Set(vals.map((x) => x.v.toFixed(4))).size < 5) return null;
    return { q: "Which number is the greatest?", a: sorted[0].s,
      steps: [`Convert everything to decimals: ${vals.map((x) => `${x.s} ≈ ${x.v.toFixed(3)}`).join(", ")}.`, `The greatest is ${sorted[0].s}.`],
      lures: sorted.slice(1).map((x) => x.s) };
  },
  () => { // fraction of a fraction of a number
    const n = pick([24, 36, 48, 60, 72, 90, 120]), [a, b] = pick([[2, 3], [3, 4], [1, 2], [5, 6], [3, 5]]), [c, d] = pick([[1, 2], [1, 3], [2, 3], [3, 4], [1, 4]]);
    const v = (n * c * a) / (d * b);
    if (!Number.isInteger(v) || (n * c) % d) return null;
    return { q: `What is ${a}/${b} of ${c}/${d} of ${n}?`, a: v,
      steps: [`${c}/${d} of ${n} = ${n} ÷ ${d} × ${c} = ${(n * c) / d}.`, `${a}/${b} of ${(n * c) / d} = ${(n * c) / d} ÷ ${b} × ${a} = ${fmt(v)}.`],
      lures: [(n * c) / d, (n * a) / b, Math.round((n * (a + c)) / (b + d)), v * 2] };
  },
  () => { // repeating decimal to fraction
    const ab = R(10, 98), r = F(ab, 99);
    if (r[1] === 99 && ab % 11 === 0) return null;
    const pad = String(ab).padStart(2, "0");
    return { q: `Write 0.${pad}${pad}${pad}… (the digits ${pad} repeat forever) as a fraction in lowest terms.`, a: fStr(r),
      steps: [`Let x = 0.${pad}${pad}… Then 100x = ${pad}.${pad}${pad}…`, `Subtract: 100x − x = ${ab}, so 99x = ${ab} and x = ${ab}/99.`, `Simplify: ${fStr(r)}.`],
      lures: [fStr(F(ab, 100)), `${ab}/99` === fStr(r) ? fStr(F(ab, 90)) : `${ab}/99`, fStr(F(ab, 999)), fStr(F(ab + 1, 99))] };
  },
  () => { // reverse percent
    const p = pick([15, 20, 25, 30, 40, 60, 75]), whole = pick([40, 80, 120, 160, 200, 240, 360]), part = (p * whole) / 100;
    if (!Number.isInteger(part)) return null;
    return { q: `${part} is ${p}% of what number?`, a: whole,
      steps: [`${p}% of x = ${part}, so ${p / 100} × x = ${part}.`, `x = ${part} ÷ ${p / 100} = ${whole}.`],
      lures: [(part * p) / 100, part + p, Math.round((part * 100) / (100 - p)), whole / 2] };
  }
];

// ── Ratios & proportions ─────────────────────────────────────────────────────
export const RATIO = [
  () => { const a = R(2, 9), b = R(2, 9), k = R(2, 8); if (gcd(a, b) > 1 || a === b) return null;
    return { q: `Simplify the ratio ${a * k}:${b * k}.`, a: `${a}:${b}`, steps: [`GCF of ${a * k} and ${b * k} is ${k}.`, `Divide both parts by ${k}: ${a}:${b}.`], lures: [`${b}:${a}`, `${a * 2}:${b * 2}`, `${a}:${b + a}`, `${a + 1}:${b + 1}`] }; },
  () => { const a = R(2, 7), b = R(2, 9), k = R(3, 9); if (gcd(a, b) > 1) return null;
    return { q: `The ratio of boys to girls in a club is ${a}:${b}. There are ${(a + b) * k} members. How many girls are there?`, a: b * k,
      steps: [`Total parts: ${a} + ${b} = ${a + b}.`, `Each part = ${(a + b) * k} ÷ ${a + b} = ${k}.`, `Girls = ${b} × ${k} = ${b * k}.`], lures: [a * k, b * (a + b), (a + b) * k - b, Math.round(((a + b) * k * b) / a)] }; },
  () => { const a = R(2, 9), b = R(2, 12), k = R(2, 9); if (a === b) return null;
    return { q: `Solve for x: ${a}/${b} = x/${b * k}`, a: a * k, steps: [`The denominator was multiplied by ${k} (${b} × ${k} = ${b * k}).`, `Multiply the numerator by ${k} too: x = ${a} × ${k} = ${a * k}.`, `Check with cross products: ${a} × ${b * k} = ${b} × ${a * k} = ${a * b * k}.`], lures: [a + b * k - b, (b * k) / a, a * k + k, b * k - a] }; },
  () => { // proportion with x on the bottom
    const a = R(2, 9), k = R(2, 6), b = a * k, c = R(2, 9) * k; if (c === b) return null;
    const x = (a * c) / b; if (!Number.isInteger(x)) return null;
    return { q: `Solve the proportion: ${a}/x = ${b}/${c}`, a: x, steps: [`Cross-multiply: ${b} · x = ${a} × ${c} = ${a * c}.`, `x = ${a * c} ÷ ${b} = ${x}.`], lures: [(b * c) / a, x + 1, c - b + a, (b + c) / a] }; },
  () => { // better buy
    const n1 = pick([4, 5, 6, 8]), n2 = pick([10, 12, 15, 16]), u1 = pick([60, 75, 80, 90, 95]), u2 = u1 + pick([-15, -10, -5, 5, 10]);
    if (u2 === u1) return null;
    const p1 = (n1 * u1) / 100, p2 = (n2 * u2) / 100, best = u1 < u2 ? `${n1} for ${money(p1)}` : `${n2} for ${money(p2)}`;
    return { q: `Which is the better buy: ${n1} granola bars for ${money(p1)} or ${n2} granola bars for ${money(p2)}?`, a: best,
      steps: [`Unit price 1: ${money(p1)} ÷ ${n1} = ${money(u1 / 100)} each.`, `Unit price 2: ${money(p2)} ÷ ${n2} = ${money(u2 / 100)} each.`, `The lower unit price is the better buy: ${best}.`],
      lures: [u1 < u2 ? `${n2} for ${money(p2)}` : `${n1} for ${money(p1)}`, "They cost the same per bar", "It depends on how many you need", `${n1 + n2} for ${money(p1 + p2)}`] };
  },
  () => { // map scale
    const s = pick([20, 25, 40, 50, 60, 75]), inches = pick([1.5, 2.5, 3, 3.5, 4.5, 6]);
    return { q: `On a map, 1 inch represents ${s} miles. Two cities are ${inches} inches apart on the map. How far apart are they really?`, a: `${fmt(s * inches)} miles`,
      steps: [`Distance = ${inches} × ${s}.`, `${inches} × ${s} = ${fmt(s * inches)} miles.`], lures: [`${fmt(s + inches)} miles`, `${fmt(s * Math.floor(inches))} miles`, `${fmt(s / inches)} miles`, `${fmt(s * inches + s)} miles`] }; },
  () => { // recipe scaling with fractions
    const serv = pick([4, 6, 8]), want = pick([2, 3, 10, 12].filter((w) => w !== serv)), [a, b] = pick([[3, 4], [2, 3], [1, 2], [3, 2], [5, 4]]);
    const r = fMul([a, b], F(want, serv));
    return { q: `A recipe for ${serv} people uses ${a}/${b} cup of sugar. How much sugar is needed for ${want} people?`, a: `${mixed(r)} cup${r[0] > r[1] ? "s" : ""}`,
      steps: [`Scale factor: ${want} ÷ ${serv} = ${fStr(F(want, serv))}.`, `${a}/${b} × ${fStr(F(want, serv))} = ${mixed(r)}.`],
      lures: [`${mixed(fMul([a, b], F(serv, want)))} cups`, `${mixed(fAdd([a, b], F(want - serv, 1)))} cups`, `${mixed(fMul([a, b], [want, 1]))} cups`, `${mixed(fAdd(r, [1, 2]))} cups`] };
  },
  () => { // speed distance time
    const s = pick([40, 45, 48, 50, 54, 60, 64, 72]), t = pick([1.5, 2.5, 0.75, 1.25, 3.5, 2.25]), d = s * t;
    if (!Number.isInteger(d)) return null;
    const ask = pick(["d", "t", "s"]);
    if (ask === "d") return { q: `A train travels at ${s} mph for ${fmtTime(t)}. How far does it go?`, a: `${d} miles`, steps: [`distance = speed × time.`, `${s} × ${t} = ${d} miles.`], lures: [`${s + t} miles`, `${fmt(s / t)} miles`, `${s * Math.round(t)} miles`, `${d + s / 2} miles`] };
    if (ask === "t") return { q: `A cyclist rides ${d} miles at ${s} mph. How long does the ride take?`, a: fmtTime(t), steps: [`time = distance ÷ speed.`, `${d} ÷ ${s} = ${t} hours = ${fmtTime(t)}.`], lures: [fmtTime(t + 0.5), fmtTime(Math.max(0.25, t - 0.25)), `${t} minutes`, fmtTime(s / d * 10)] };
    return { q: `A car goes ${d} miles in ${fmtTime(t)}. What is its average speed?`, a: `${s} mph`, steps: [`speed = distance ÷ time.`, `${d} ÷ ${t} = ${s} mph.`], lures: [`${d * t} mph`, `${s + 5} mph`, `${Math.round(d / Math.ceil(t))} mph`, `${s - 4} mph`] };
  },
  () => { // add to change a ratio
    const r = R(2, 4), b = R(4, 10), g = r * b, x = R(2, 6), nr = (g + x) / b;
    if (!Number.isInteger(nr) || x === 0) return null;
    return { q: `A jar has red and blue marbles in the ratio ${r}:1. There are ${b} blue marbles. How many red marbles must be added so the ratio becomes ${nr}:1?`, a: x,
      steps: [`Now: red = ${r} × ${b} = ${g}.`, `Goal: red = ${nr} × ${b} = ${nr * b}.`, `Add ${nr * b} − ${g} = ${x}.`], lures: [nr - r, nr * b, x + b, g] };
  },
  () => { // three-part ratio
    const a = R(1, 4), b = R(2, 5), c = R(3, 6), k = R(3, 9), t = (a + b + c) * k;
    if (new Set([a, b, c]).size < 3) return null;
    return { q: `$${t} is shared in the ratio ${a}:${b}:${c}. How much is the largest share?`, a: `$${c * k}`,
      steps: [`Total parts: ${a} + ${b} + ${c} = ${a + b + c}.`, `One part: ${t} ÷ ${a + b + c} = ${k}.`, `Largest share: ${c} × ${k} = $${c * k}.`], lures: [`$${a * k}`, `$${b * k}`, `$${Math.round(t / 3)}`, `$${c * (a + b + c)}`] };
  },
  () => { // direct variation
    const k = R(2, 9), x1 = R(2, 8), x2 = R(3, 12); if (x1 === x2) return null;
    return { q: `y varies directly with x. When x = ${x1}, y = ${k * x1}. What is y when x = ${x2}?`, a: k * x2,
      steps: [`Direct variation: y = kx.`, `k = ${k * x1} ÷ ${x1} = ${k}.`, `y = ${k} × ${x2} = ${k * x2}.`], lures: [k * x1 + (x2 - x1), (k * x1 * x1) / x2, k + x2, k * x2 + k] };
  },
  () => { // unit conversion
    const kind = pick(["ft", "min", "cm", "oz"]);
    if (kind === "ft") { const f = R(3, 12), i = R(1, 11); return { q: `How many inches are in ${f} feet ${i} inches?`, a: f * 12 + i, steps: [`1 foot = 12 inches, so ${f} feet = ${f * 12} inches.`, `${f * 12} + ${i} = ${f * 12 + i} inches.`], lures: [f * 10 + i, f + i, f * 12, f * 12 + i * 12] }; }
    if (kind === "min") { const h = pick([1.25, 1.5, 2.75, 3.2, 0.4, 2.5]); return { q: `How many minutes are in ${h} hours?`, a: fmt(h * 60), steps: [`1 hour = 60 minutes.`, `${h} × 60 = ${fmt(h * 60)} minutes.`], lures: [fmt(h * 100), fmt(h * 60 + 10), fmt(Math.floor(h) * 60 + (h % 1) * 10), fmt(h * 30)] }; }
    if (kind === "cm") { const m = pick([1.2, 2.5, 3.75, 0.8, 4.05]); return { q: `How many centimeters are in ${m} meters?`, a: fmt(m * 100), steps: [`1 meter = 100 centimeters.`, `${m} × 100 = ${fmt(m * 100)} cm.`], lures: [fmt(m * 10), fmt(m * 1000), fmt(m / 100), fmt(m * 100 + 10)] }; }
    const lb = pick([2, 3, 4, 5]), oz = R(2, 14); return { q: `A bag weighs ${lb} pounds ${oz} ounces. How many ounces is that? (16 oz = 1 lb)`, a: lb * 16 + oz, steps: [`${lb} × 16 = ${lb * 16} ounces.`, `${lb * 16} + ${oz} = ${lb * 16 + oz} ounces.`], lures: [lb * 10 + oz, lb * 12 + oz, lb * 16, lb + oz] };
  },
  () => { // similar triangles
    const a = R(3, 9), b = R(4, 12), k = pick([2, 3, 1.5, 2.5]), A = a * k, x = b * k;
    if (!Number.isInteger(A) || !Number.isInteger(x)) return null;
    return { q: `Two triangles are similar. A side of ${a} cm in the small triangle matches a side of ${A} cm in the large triangle. Another side of the small triangle is ${b} cm. How long is the matching side of the large triangle?`, a: `${x} cm`,
      steps: [`Scale factor = ${A} ÷ ${a} = ${k}.`, `${b} × ${k} = ${x} cm.`], lures: [`${b + (A - a)} cm`, `${fmt(b / k)} cm`, `${b * a} cm`, `${x + 1} cm`] };
  }
];
function fmtTime(h) {
  const hrs = Math.floor(h), m = Math.round((h - hrs) * 60);
  return [hrs ? `${hrs} hour${hrs > 1 ? "s" : ""}` : "", m ? `${m} minutes` : ""].filter(Boolean).join(" ");
}
export { isPrime };
