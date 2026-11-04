// Registry of every question type, grouped into test sections.
import { verbalAnalogy, sentenceCompletion, verbalClassification, oddOneOut } from "./gen/verbal.js";
import { numberAnalogy, numberPuzzle, numberSeries, letterSeries } from "./gen/quant.js";
import { mathTopic, MATH_TOPICS } from "./gen/math.js";
import { figureMatrix, figureClassification, shapeSequence } from "./gen/figures.js";
import { paperFolding } from "./gen/folding.js";
import { figureBalance } from "./gen/balance.js";
import { readingQuestion, vocabInContext } from "./gen/reading.js";
import { shuffle } from "./util.js";

// Sections of the test (also used for progress by topic).
export const BATTERIES = {
  verbal: { name: "Verbal reasoning", short: "Verbal", color: "series-1" },
  reading: { name: "Reading comprehension", short: "Reading", color: "series-4" },
  math: { name: "Math (no calculator)", short: "Math", color: "series-2" },
  quant: { name: "Quantitative reasoning", short: "Quantitative", color: "series-5" },
  nonverbal: { name: "Nonverbal reasoning", short: "Nonverbal", color: "series-3" }
};

// gen(level, seen) → puzzle. level: 1 = warm-up, 2 = grade 8–10 (default), 3 = challenge.
// secs = typical time per question (used for timed modes).
export const TYPES = {
  analogy: { name: "Verbal analogies", battery: "verbal", gen: verbalAnalogy, secs: 30 },
  sentence: { name: "Sentence completion", battery: "verbal", gen: sentenceCompletion, secs: 30 },
  vocabctx: { name: "Vocabulary in context", battery: "verbal", gen: vocabInContext, secs: 25 },
  classify: { name: "Verbal classification", battery: "verbal", gen: verbalClassification, secs: 30 },
  odd: { name: "Odd one out", battery: "verbal", gen: oddOneOut, secs: 25 },
  reading: { name: "Reading passages", battery: "reading", gen: readingQuestion, secs: 75 },
  ...Object.fromEntries(Object.entries(MATH_TOPICS).map(([k, t]) => [k, { name: t.name, battery: "math", gen: mathTopic(k), secs: k === "word" ? 90 : k === "arith" ? 50 : 70 }])),
  numanalogy: { name: "Number analogies", battery: "quant", gen: numberAnalogy, secs: 40 },
  numpuzzle: { name: "Number puzzles", battery: "quant", gen: numberPuzzle, secs: 40 },
  series: { name: "Number series", battery: "quant", gen: numberSeries, secs: 40 },
  letter: { name: "Letter series", battery: "quant", gen: letterSeries, secs: 35 },
  matrix: { name: "Figure matrices", battery: "nonverbal", gen: figureMatrix, secs: 45 },
  folding: { name: "Paper folding", battery: "nonverbal", gen: paperFolding, secs: 45 },
  figclass: { name: "Figure classification", battery: "nonverbal", gen: figureClassification, secs: 40 },
  balance: { name: "Figure balancing", battery: "nonverbal", gen: figureBalance, secs: 50 },
  shapes: { name: "Shape sequences", battery: "nonverbal", gen: shapeSequence, secs: 35 }
};
export const typesIn = (battery) => Object.keys(TYPES).filter((t) => TYPES[t].battery === battery);

// The nine CogAT-style subtests, with real CogAT Level 15/16 item counts (10 minutes each).
export const COGAT = [
  { type: "analogy", n: 24 }, { type: "sentence", n: 20 }, { type: "classify", n: 20 },
  { type: "numanalogy", n: 18 }, { type: "numpuzzle", n: 16 }, { type: "series", n: 18 },
  { type: "matrix", n: 22 }, { type: "folding", n: 16 }, { type: "figclass", n: 22 }
];

// Full mock admissions test: timed sections, then a timed essay (handled by the essay page).
export const FULL_MOCK = [
  { name: "Verbal reasoning", types: ["analogy", "sentence", "vocabctx", "classify", "odd"], n: 20, minutes: 15 },
  { name: "Reading comprehension", types: ["reading"], n: 15, minutes: 20, passages: 3 },
  { name: "Math (no calculator)", types: ["arith", "fdp", "ratio", "word", "algebra", "geometry"], n: 20, minutes: 30 },
  { name: "Quantitative reasoning", types: ["numanalogy", "numpuzzle", "series"], n: 12, minutes: 10 },
  { name: "Nonverbal reasoning", types: ["matrix", "folding", "figclass", "balance"], n: 12, minutes: 10 }
];

let seenKeys = new Set();
export function setSeen(set) { seenKeys = set; }

// Generate one question, avoiding ones already seen when possible ("no repeats").
export function generate(type, level = 2) {
  let p;
  for (let i = 0; i < 12; i++) {
    p = TYPES[type].gen(level, seenKeys);
    if (!seenKeys.has(p.key)) return p;
  }
  return p;
}

export function batch(types, n, level = 2, seen = new Set()) {
  const out = [];
  let i = 0, guard = 0;
  while (out.length < n && guard++ < n * 60) {
    const p = generate(types[i % types.length], level);
    if (seen.has(p.key)) continue;
    seen.add(p.key); out.push(p); i++;
  }
  return out;
}

export function makeRound(types, n = 10, level = 2) {
  // Keep reading questions together with their passage.
  const qs = batch(shuffle(types), n, level);
  const reading = qs.filter((p) => p.type === "reading"), other = shuffle(qs.filter((p) => p.type !== "reading"));
  return reading.length ? [...other.slice(0, Math.ceil(other.length / 2)), ...reading, ...other.slice(Math.ceil(other.length / 2))] : other;
}

// Sections for a timed test. Each section: { name, seconds, questions }.
export function makeSections(kind, opts = {}, level = 2) {
  const seen = new Set();
  if (kind === "cogat") {
    const scale = opts.scale || 1; // 1 = real length; 0.5 = half length, etc.
    return COGAT.filter((s) => !opts.batteries || opts.batteries.includes(TYPES[s.type].battery))
      .map((s) => { const n = Math.max(3, Math.round(s.n * scale)); return { name: TYPES[s.type].name, seconds: Math.round(600 * (n / s.n)), questions: batch([s.type], n, level, seen) }; });
  }
  if (kind === "full") {
    const scale = opts.scale || 1;
    return FULL_MOCK.map((s) => {
      const n = Math.max(4, Math.round(s.n * scale));
      const questions = s.types[0] === "reading" ? readingSet(Math.max(1, Math.round((s.passages || 3) * scale))) : batch(shuffle(s.types), n, level, seen);
      return { name: s.name, seconds: Math.round(s.minutes * 60 * (questions.length / s.n)), questions };
    });
  }
  // Single section drill: { types, n, seconds }
  const types = opts.types;
  const questions = types.length === 1 && types[0] === "reading" ? readingSet(Math.max(1, Math.round(opts.n / 5))) : batch(shuffle(types), opts.n, level, seen);
  return [{ name: opts.name || "Timed drill", seconds: opts.seconds, questions }];
}

function readingSet(passages) {
  const out = [];
  for (let i = 0; i < passages * 5; i++) out.push(generate("reading"));
  return out;
}
