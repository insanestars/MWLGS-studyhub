// Registry of every question type, grouped like the CogAT batteries.
import { verbalAnalogy, sentenceCompletion, verbalClassification, oddOneOut } from "./gen/verbal.js";
import { numberAnalogy, numberPuzzle, numberSeries, letterSeries } from "./gen/quant.js";
import { mathProblem } from "./gen/math.js";
import { figureMatrix, figureClassification, shapeSequence } from "./gen/figures.js";
import { paperFolding } from "./gen/folding.js";
import { figureBalance } from "./gen/balance.js";
import { shuffle } from "./util.js";

export const BATTERIES = {
  verbal: { name: "Verbal", color: "series-1" },
  quant: { name: "Quantitative", color: "series-2" },
  nonverbal: { name: "Nonverbal", color: "series-3" }
};

// gen(level) → puzzle. level: 1 = warm-up, 2 = hard (grade 9–10), 3 = challenge.
export const TYPES = {
  analogy: { name: "Verbal analogies", battery: "verbal", gen: verbalAnalogy, secs: 30 },
  sentence: { name: "Sentence completion", battery: "verbal", gen: sentenceCompletion, secs: 30 },
  classify: { name: "Verbal classification", battery: "verbal", gen: verbalClassification, secs: 30 },
  odd: { name: "Odd one out", battery: "verbal", gen: oddOneOut, secs: 25, extra: true },
  numanalogy: { name: "Number analogies", battery: "quant", gen: numberAnalogy, secs: 45 },
  numpuzzle: { name: "Number puzzles", battery: "quant", gen: numberPuzzle, secs: 45 },
  series: { name: "Number series", battery: "quant", gen: numberSeries, secs: 45 },
  math: { name: "Math problems", battery: "quant", gen: mathProblem, secs: 75, extra: true },
  letter: { name: "Letter series", battery: "quant", gen: letterSeries, secs: 40, extra: true },
  matrix: { name: "Figure matrices", battery: "nonverbal", gen: figureMatrix, secs: 45 },
  folding: { name: "Paper folding", battery: "nonverbal", gen: paperFolding, secs: 45 },
  figclass: { name: "Figure classification", battery: "nonverbal", gen: figureClassification, secs: 40 },
  balance: { name: "Figure balancing", battery: "nonverbal", gen: figureBalance, secs: 50, extra: true },
  shapes: { name: "Shape sequences", battery: "nonverbal", gen: shapeSequence, secs: 35, extra: true }
};

// CogAT subtests (the "extra" types are practice-only and not part of the mock test).
export const COGAT = Object.fromEntries(Object.keys(BATTERIES).map((b) => [b, Object.keys(TYPES).filter((t) => TYPES[t].battery === b && !TYPES[t].extra)]));

export function generate(type, level = 2) {
  return TYPES[type].gen(level);
}

function batch(types, n, level, seen = new Set()) {
  const out = [];
  let i = 0, guard = 0;
  while (out.length < n && guard++ < n * 50) {
    const p = generate(types[i % types.length], level);
    if (seen.has(p.key)) continue;
    seen.add(p.key); out.push(p); i++;
  }
  return out;
}

// Mixed timed round across the chosen types.
export function makeRound(types, n = 10, level = 2) {
  return shuffle(batch(shuffle(types), n, level));
}

// Mock CogAT: sections in order, each with its own time limit.
export function makeMock(batteries, perSubtest = 6, level = 2) {
  const sections = [];
  const seen = new Set();
  for (const b of batteries) for (const t of COGAT[b]) {
    sections.push({ type: t, battery: b, name: TYPES[t].name, seconds: Math.round(perSubtest * TYPES[t].secs), questions: batch([t], perSubtest, level, seen) });
  }
  return sections;
}
