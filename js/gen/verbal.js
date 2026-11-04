// Verbal battery: analogies, sentence completion, verbal classification.
import { RELATIONS, CATEGORIES } from "../data/words.js";
import { SENTENCES } from "../data/sentences.js";
import { make, retry, cap } from "./common.js";
import { pick, sample, shuffle, rand } from "../util.js";

// ── Verbal analogies ─────────────────────────────────────────────────────────
// Lexicon: word → list of {rel, other}. Used to find tempting lures (words linked to C some other way).
const LEX = new Map();
const PAIRSET = new Map(); // rel id → Set("a|b")
for (const r of RELATIONS) {
  const set = new Set();
  for (const [a, b] of r.pairs) {
    set.add(`${a}|${b}`); if (r.symmetric) set.add(`${b}|${a}`);
    for (const [x, y] of [[a, b], [b, a]]) {
      if (!LEX.has(x)) LEX.set(x, []);
      LEX.get(x).push({ rel: r.id, other: y });
    }
  }
  PAIRSET.set(r.id, set);
}
const NOUN_RELS = RELATIONS.filter((r) => !r.adjective);

export function verbalAnalogy() {
  return retry(() => {
    const r = pick(RELATIONS);
    const [[a, b], [c, d]] = sample(r.pairs, 2);
    if (new Set([a, b, c, d]).size < 4) return null;
    const ok = (w) => w !== c && w !== d && !PAIRSET.get(r.id).has(`${c}|${w}`);
    // 1. Lures: words tied to C by a *different* relationship (e.g. a synonym when we want an antonym).
    const lures = (LEX.get(c) || []).filter((x) => x.rel !== r.id).map((x) => x.other).filter(ok);
    // 2. Other answers from the same relationship, and B itself.
    const same = r.pairs.map(([, y]) => y).filter(ok);
    // 3. Second words from noun-type relationships (avoids accidental synonyms for adjective relations).
    const pool = (r.adjective ? NOUN_RELS : RELATIONS).filter((x) => x.id !== r.id).flatMap((x) => x.pairs.map(([, y]) => y)).filter(ok);
    // Fuzzy relationships (a carpenter can also use a chisel…) only get lures from clearly different relationships.
    const distractors = r.fuzzy
      ? [...sample(lures, 2), ...sample(pool, 8)]
      : [...sample(lures, 2), ...(ok(b) ? [b] : []), ...sample(same, 2), ...sample(pool, 6)];
    return make({
      type: "analogy",
      question: "Choose the word that completes the analogy.",
      prompt: { kind: "analogy", a, b, c },
      correct: d, distractors,
      explanation: `${cap(a)} → ${b} is ${r.label}; ${c} → ${d} is the same relationship.`
    });
  });
}

// ── Sentence completion ──────────────────────────────────────────────────────
export function sentenceCompletion() {
  const item = pick(SENTENCES);
  return make({
    type: "sentence",
    question: "Choose the word or words that best complete the sentence.",
    prompt: { kind: "sentence", text: item.s },
    correct: item.a, distractors: shuffle(item.d),
    explanation: item.e
  });
}

// ── Verbal classification (CogAT style) ──────────────────────────────────────
// Three words share a category; pick the option that belongs with them.
const CAT_NAMES = Object.keys(CATEGORIES).filter((n) => CATEGORIES[n].words.length >= 4); // need 3 shown + 1 answer
export function verbalClassification() {
  return retry(() => {
    const cat = pick(CAT_NAMES);
    const words = sample(CATEGORIES[cat].words, 4);
    const [shown, answer] = [words.slice(0, 3), words[3]];
    const near = (CATEGORIES[cat].near || []).flatMap((n) => CATEGORIES[n].words);
    const far = CAT_NAMES.filter((n) => n !== cat && !(CATEGORIES[cat].near || []).includes(n)).flatMap((n) => CATEGORIES[n].words);
    const distractors = [...sample(near, Math.min(2, near.length)), ...sample(far, 6)];
    const p = make({
      type: "classify",
      question: "The first three words are alike in some way. Which word belongs with them?",
      prompt: { kind: "words", items: shown },
      correct: answer, distractors,
      explanation: `${cap(shown.join(", "))} and ${answer} are all ${cat}.`
    });
    if (p) p.explanation += " " + otherCats(p.options.filter((o) => o !== answer));
    return p;
  });
}
function otherCats(words) {
  const find = (w) => CAT_NAMES.find((n) => CATEGORIES[n].words.includes(w));
  return words.map((w) => `${w} (${singular(find(w))})`).join(", ") + " don't fit.";
}
const singular = (cat) => cat.replace(/^words meaning /, "means ").replace(/^ways to /, "a way to ");

// ── Odd one out (kept as an extra verbal type) ───────────────────────────────
export function oddOneOut() {
  return retry(() => {
    const cat = pick(CAT_NAMES);
    const group = sample(CATEGORIES[cat].words, 4);
    const nears = CATEGORIES[cat].near || [];
    const oddCat = nears.length && rand(2) ? pick(nears) : pick(CAT_NAMES.filter((n) => n !== cat && !nears.includes(n)));
    const odd = pick(CATEGORIES[oddCat].words);
    return make({
      type: "odd",
      question: "Which word does NOT belong with the others?",
      prompt: { kind: "none" },
      correct: odd, distractors: group,
      explanation: `The others are all ${cat}; ${odd} is from ${oddCat}.`
    });
  });
}
