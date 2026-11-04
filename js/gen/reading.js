// Reading comprehension (passage sets) and vocabulary-in-context questions.
import { PASSAGES_A } from "../data/passages-a.js";
import { PASSAGES_B } from "../data/passages-b.js";
import { VOCAB, CATEGORIES } from "../data/vocab.js";
import { make, retry } from "./common.js";
import { pick, shuffle, sample } from "../util.js";

export const PASSAGES = [...PASSAGES_A, ...PASSAGES_B];
export const SKILLS = { main: "Main idea", detail: "Details", inference: "Inference", vocab: "Vocab in context", tone: "Tone & attitude", purpose: "Author's purpose", structure: "Structure" };

function passageQuestion(p, i) {
  const q = p.qs[i];
  const puzzle = make({
    type: "reading", n: 4,
    question: q.q,
    prompt: { kind: "passage", id: p.id, title: p.title, genre: p.genre, text: p.text, n: i + 1, of: p.qs.length },
    correct: q.a, distractors: shuffle(q.d), explanation: q.e
  });
  puzzle.key = `reading:${p.id}:${i}`;
  puzzle.skill = q.k;
  return puzzle;
}

// Serve passages as sets: all questions for one passage, in order, then the next passage.
// `seen` (optional) is a Set of keys already answered, so new passages come first.
let deck = [], current = null, qi = 0;
export function readingQuestion(_level, seen) {
  if (!current || qi >= current.qs.length) {
    if (!deck.length) {
      const fresh = PASSAGES.filter((p) => !seen || !p.qs.some((_, i) => seen.has(`reading:${p.id}:${i}`)));
      deck = shuffle(fresh.length ? fresh : PASSAGES);
    }
    current = deck.pop(); qi = 0;
  }
  return passageQuestion(current, qi++);
}
export function passageSet(id) {
  const p = PASSAGES.find((x) => x.id === id) || pick(PASSAGES);
  return p.qs.map((_, i) => passageQuestion(p, i));
}
export function resetReading() { current = null; qi = 0; }

// ── Vocabulary in context (generated from the vocabulary list) ───────────────
const POS = {};
for (const v of VOCAB) (POS[v.pos] ||= []).push(v);
function blankOut(ex, w) {
  // Match the word or a simple inflection (-s, -ed, -ing, -d, -ly…).
  const stem = w.length > 5 ? w.slice(0, -1) : w;
  const re = new RegExp(`\\b${stem.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}[a-z]*\\b`, "i");
  const m = ex.match(re);
  if (!m) return null;
  return { text: ex.replace(re, "____"), form: m[0] };
}
export function vocabInContext() {
  return retry(() => {
    const v = pick(VOCAB);
    const b = blankOut(v.ex, v.w);
    if (!b || b.form.toLowerCase() !== v.w.toLowerCase()) return null; // keep only exact forms so options read naturally
    // Distractors: same part of speech, from different categories (so only one fits the meaning).
    const pool = (POS[v.pos] || []).filter((x) => x.w !== v.w && x.cat !== v.cat);
    if (pool.length < 4) return null;
    const p = make({
      type: "vocabctx", question: "Which word best completes the sentence?",
      prompt: { kind: "sentence", text: b.text },
      correct: v.w, distractors: sample(pool, 6).map((x) => x.w),
      explanation: `${v.w} (${v.pos}): ${v.def}.`
    });
    if (p) p.word = v.w;
    return p;
  });
}
export { CATEGORIES };
