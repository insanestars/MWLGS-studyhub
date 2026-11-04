// No-calculator math by topic. Every problem is generated fresh and comes with
// step-by-step working. Topics map to their own question types so progress is
// tracked separately.
import { make, retry } from "./common.js";
import { pick, shuffle } from "../util.js";
import { fmt } from "./mathkit.js";
import { ARITH, FDP, RATIO } from "./math-a.js";
import { WORD, ALGEBRA, GEOMETRY } from "./math-b.js";

export const MATH_TOPICS = {
  arith: { name: "Arithmetic (no calculator)", bank: ARITH },
  fdp: { name: "Fractions, decimals & percents", bank: FDP },
  ratio: { name: "Ratios & proportions", bank: RATIO },
  word: { name: "Word problems", bank: WORD },
  algebra: { name: "Algebra I", bank: ALGEBRA },
  geometry: { name: "Geometry & measurement", bank: GEOMETRY }
};

const show = (v) => (typeof v === "number" ? fmt(v) : String(v));
const bad = (s) => /NaN|Infinity|undefined|null/.test(s);

function build(topic) {
  const t = MATH_TOPICS[topic];
  return retry(() => {
    const r = pick(t.bank)();
    if (!r) return null;
    const correct = show(r.a);
    if (bad(correct) || r.steps.some(bad)) return null;
    const lures = shuffle(r.lures.filter((x) => x != null && (typeof x !== "number" || Number.isFinite(x))).map(show).filter((x) => !bad(x) && x !== correct));
    // Pad with near misses for numeric answers if a template didn't give enough lures.
    if (typeof r.a === "number") for (const d of [1, -1, 2, -2, 10, -10]) lures.push(show(r.a + d));
    const p = make({ type: topic, question: r.q, prompt: { kind: "none" }, correct, distractors: lures, explanation: r.steps[r.steps.length - 1] });
    if (p) p.steps = r.steps;
    return p;
  });
}

export const mathTopic = (topic) => () => build(topic);
export function mathProblem() { return build(pick(Object.keys(MATH_TOPICS))); }
