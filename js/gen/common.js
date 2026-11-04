// Shared helpers for puzzle generators.
import { shuffle } from "../util.js";

// Build a puzzle: put the correct answer among unique distractors and shuffle.
// Returns null if there weren't enough distinct distractors (callers retry).
export function make({ type, question, prompt, correct, distractors, explanation, optionKind = "text", n = 5, keyOf = (x) => String(x), _check }) {
  const seen = new Set([keyOf(correct)]);
  const opts = [correct];
  for (const d of distractors) {
    if (d == null) continue;
    const k = keyOf(d);
    if (!seen.has(k) && opts.length < n) { seen.add(k); opts.push(d); }
  }
  if (opts.length < n) return null;
  const options = shuffle(opts);
  const answer = options.findIndex((o) => keyOf(o) === keyOf(correct));
  const key = type + ":" + hash(JSON.stringify(prompt) + "|" + keyOf(correct));
  const p = { v: 2, key, type, question, prompt, options, optionKind, answer, explanation };
  if (_check) Object.defineProperty(p, "_check", { value: _check, enumerable: false }); // test-only, not saved
  return p;
}

// Small, stable string hash (FNV-1a) → base36. Used for keys / Firestore ids.
export function hash(str) {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 0x01000193); }
  return (h >>> 0).toString(36);
}

export function retry(fn, tries = 200) {
  for (let i = 0; i < tries; i++) { const p = fn(); if (p) return p; }
  throw new Error("generator failed repeatedly");
}

export const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
export const gcd = (a, b) => (b ? gcd(b, a % b) : Math.abs(a));
