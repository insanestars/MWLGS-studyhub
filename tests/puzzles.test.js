// Generates thousands of puzzles of every type and level and checks each one.
import { generate, makeRound, makeMock, TYPES, COGAT } from "../js/puzzles.js";
import { NARRATIVE, ARGUMENTATIVE } from "../js/prompts.js";
import { RELATIONS, CATEGORIES, VOCAB } from "../js/data/words.js";
import assert from "node:assert/strict";

const N = Number(process.env.N || 400);
const PAIRS = new Map(RELATIONS.map((r) => [r.id, new Set(r.pairs.flatMap(([a, b]) => (r.symmetric ? [`${a}|${b}`, `${b}|${a}`] : [`${a}|${b}`])))]));
const weight = (m, w) => Object.entries(m).reduce((a, [s, n]) => a + w[s] * n, 0);
// Puzzles are saved to Firestore (mistakes, flags): no undefined values, no arrays directly inside arrays.
function firestoreSafe(v, ctx, inArray = false) {
  assert.notEqual(v, undefined, "undefined value " + ctx());
  if (Array.isArray(v)) { assert.ok(!inArray, "nested array " + ctx()); v.forEach((x) => firestoreSafe(x, ctx, true)); }
  else if (v && typeof v === "object") Object.values(v).forEach((x) => firestoreSafe(x, ctx, false));
}

for (const type of Object.keys(TYPES)) {
  let count = 0;
  for (const level of [1, 2, 3]) {
    for (let i = 0; i < N; i++) {
      const p = generate(type, level);
      const ctx = () => JSON.stringify(p).slice(0, 600);
      assert.equal(p.type, type, ctx());
      assert.equal(p.options.length, 5, "5 options " + ctx());
      assert.ok(p.answer >= 0 && p.answer < 5, ctx());
      const keys = p.options.map((o) => (typeof o === "string" ? o : o.k));
      assert.equal(new Set(keys).size, 5, "duplicate options " + ctx());
      assert.ok(p.explanation && p.question && p.key, ctx());
      assert.ok(!/NaN|undefined|Infinity|\[object/.test(JSON.stringify(p)), "bad value " + ctx());
      firestoreSafe(p, ctx);
      if (p.optionKind === "svg") {
        p.options.forEach((o) => assert.ok(o.svg.startsWith("<svg"), ctx()));
        assert.equal(new Set(p.options.map((o) => o.svg)).size, 5, "identical-looking options " + ctx());
      }
      if (type === "analogy") assert.ok([...PAIRS.values()].some((s) => s.has(`${p.prompt.c}|${p.options[p.answer]}`)), ctx());
      if (type === "classify") {
        const cat = Object.values(CATEGORIES).find((c) => p.prompt.items.every((w) => c.words.includes(w)));
        assert.ok(cat && cat.words.includes(p.options[p.answer]), ctx());
        p.options.forEach((o, j) => j === p.answer || assert.ok(!cat.words.includes(o), "two correct " + ctx()));
      }
      if (type === "balance") {
        const { w, qLeft, ans } = p._check;
        assert.equal(weight(ans, w), weight(qLeft, w), ctx());
      }
      if (type === "numanalogy" || type === "series" || type === "numpuzzle") p.options.forEach((o) => assert.ok(/^-?\d+(\.\d+)?$/.test(o), ctx()));
      count++;
    }
  }
  console.log(`✓ ${count} ${TYPES[type].name} puzzles valid (levels 1–3)`);
}

const r = makeRound(Object.keys(TYPES), 10, 2);
assert.equal(r.length, 10);
assert.equal(new Set(r.map((p) => p.key)).size, 10);
console.log("✓ mixed round: 10 unique questions");
const mock = makeMock(["verbal", "quant", "nonverbal"], 6, 2);
assert.equal(mock.length, 9);
mock.forEach((s) => assert.equal(s.questions.length, 6));
console.log(`✓ mock CogAT: ${mock.length} subtests × 6 questions (${Object.values(COGAT).flat().join(", ")})`);
assert.ok(NARRATIVE.length >= 50 && ARGUMENTATIVE.length >= 60, `prompts ${NARRATIVE.length}/${ARGUMENTATIVE.length}`);
console.log(`✓ prompt banks: ${NARRATIVE.length} narrative, ${ARGUMENTATIVE.length} argumentative; ${VOCAB.length} vocabulary words`);
