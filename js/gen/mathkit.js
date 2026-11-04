// Helpers for no-calculator math problems: fractions, formatting, step lists.
import { gcd } from "./common.js";

export const SUP = (n) => String(n).split("").map((c) => ({ "-": "⁻", "0": "⁰", "1": "¹", "2": "²", "3": "³", "4": "⁴", "5": "⁵", "6": "⁶", "7": "⁷", "8": "⁸", "9": "⁹" }[c] || c)).join("");
export const N = (n) => (n < 0 ? `−${fmt(-n)}` : fmt(n)); // display a number with a real minus sign
export const P = (n) => (n < 0 ? `(−${fmt(-n)})` : fmt(n)); // parenthesise negatives
export const S = (n) => (n < 0 ? `− ${fmt(-n)}` : `+ ${fmt(n)}`); // signed term: "+ 3" / "− 3"
export function fmt(n) {
  if (Number.isInteger(n)) return n.toLocaleString("en-US");
  return String(Math.round(n * 1e6) / 1e6);
}
export const plain = (n) => (n < 0 ? `−${Math.abs(n)}` : String(n)); // no thousands separator
export const money = (x) => `$${(Math.round(x * 100) / 100).toFixed(2)}`;

// Fractions as [numerator, denominator] in lowest terms with a positive denominator.
export function F(n, d = 1) {
  if (d < 0) { n = -n; d = -d; }
  const g = gcd(Math.abs(n), d) || 1;
  return [n / g, d / g];
}
export const fAdd = ([a, b], [c, d]) => F(a * d + c * b, b * d);
export const fSub = ([a, b], [c, d]) => F(a * d - c * b, b * d);
export const fMul = ([a, b], [c, d]) => F(a * c, b * d);
export const fDiv = ([a, b], [c, d]) => F(a * d, b * c);
export const fStr = ([n, d]) => (d === 1 ? N(n) : `${n < 0 ? "−" : ""}${Math.abs(n)}/${d}`);
// Mixed number: 7/3 → "2 1/3"
export function mixed([n, d]) {
  if (d === 1) return N(n);
  const s = n < 0 ? "−" : "", a = Math.abs(n), w = Math.floor(a / d), r = a % d;
  return w ? `${s}${w} ${r}/${d}` : `${s}${r}/${d}`;
}
export const lcm = (a, b) => (a * b) / gcd(a, b);

export function isPrime(n) {
  if (n < 2) return false;
  for (let i = 2; i * i <= n; i++) if (n % i === 0) return false;
  return true;
}
export function primeFactors(n) {
  const out = [];
  for (let p = 2; p * p <= n; p++) while (n % p === 0) { out.push(p); n /= p; }
  if (n > 1) out.push(n);
  return out;
}
export const factorStr = (n) => {
  const c = {};
  for (const p of primeFactors(n)) c[p] = (c[p] || 0) + 1;
  return Object.entries(c).map(([p, e]) => (e > 1 ? `${p}${SUP(e)}` : p)).join(" × ");
};

// Spread of plausible wrong numeric answers.
export const near = (x, k = 3, step = 1) => {
  const out = [];
  for (let i = 1; i <= k; i++) out.push(x + i * step, x - i * step);
  return out;
};
// Monomial / polynomial pretty-printing.
export function term(coef, v = "x", pow = 1, first = false) {
  if (coef === 0) return "";
  const c = Math.abs(coef), sign = coef < 0 ? (first ? "−" : " − ") : first ? "" : " + ";
  const body = pow === 0 ? String(c) : `${c === 1 ? "" : c}${v}${pow > 1 ? SUP(pow) : ""}`;
  return sign + body;
}
export function poly(coefs, v = "x") { // coefs from highest power: [a, b, c] → ax² + bx + c
  const deg = coefs.length - 1;
  let s = "";
  coefs.forEach((c, i) => { if (c) s += term(c, v, deg - i, s === ""); });
  return s || "0";
}
