// Generates thousands of questions of every type and level and checks each one.
import { generate, makeRound, makeSections, TYPES, COGAT, FULL_MOCK } from "../js/puzzles.js";
import { ESSAY_CATS } from "../js/prompts.js";
import { RELATIONS, CATEGORIES } from "../js/data/words.js";
import { VOCAB } from "../js/data/vocab.js";
import { ROOTS } from "../js/data/roots.js";
import { PASSAGES } from "../js/gen/reading.js";
import { SENTENCES } from "../js/data/sentences.js";
import assert from "node:assert/strict";

const N = Number(process.env.N || 300);
const PAIRS = new Map(RELATIONS.map((r) => [r.id, new Set(r.pairs.flatMap(([a, b]) => (r.symmetric ? [`${a}|${b}`, `${b}|${a}`] : [`${a}|${b}`])))]));
const weight = (m, w) => Object.entries(m).reduce((a, [s, n]) => a + w[s] * n, 0);
function firestoreSafe(v, ctx, inArray = false) {
  assert.notEqual(v, undefined, "undefined value " + ctx());
  if (Array.isArray(v)) { assert.ok(!inArray, "nested array " + ctx()); v.forEach((x) => firestoreSafe(x, ctx, true)); }
  else if (v && typeof v === "object") Object.values(v).forEach((x) => firestoreSafe(x, ctx, false));
}
const MATH = new Set(["arith", "fdp", "ratio", "word", "algebra", "geometry"]);

for (const type of Object.keys(TYPES)) {
  let count = 0;
  for (const level of [1, 2, 3]) {
    for (let i = 0; i < N; i++) {
      const p = generate(type, level);
      const ctx = () => JSON.stringify(p).slice(0, 700);
      const n = type === "reading" ? 4 : 5;
      assert.equal(p.type, type, ctx());
      assert.equal(p.options.length, n, `${n} options ` + ctx());
      assert.ok(p.answer >= 0 && p.answer < n, ctx());
      const keys = p.options.map((o) => (typeof o === "string" ? o : o.k));
      assert.equal(new Set(keys).size, n, "duplicate options " + ctx());
      assert.ok(p.explanation && p.question && p.key, ctx());
      assert.ok(!/NaN|undefined|Infinity|\[object/.test(JSON.stringify(p)), "bad value " + ctx());
      if (p.optionKind !== "svg") p.options.forEach((o) => assert.ok(!/\bnull\b/.test(o), "null in option " + ctx()));
      firestoreSafe(p, ctx);
      if (p.optionKind === "svg") {
        p.options.forEach((o) => assert.ok(o.svg.startsWith("<svg"), ctx()));
        assert.equal(new Set(p.options.map((o) => o.svg)).size, n, "identical-looking options " + ctx());
      }
      if (type === "analogy") assert.ok([...PAIRS.values()].some((s) => s.has(`${p.prompt.c}|${p.options[p.answer]}`)), ctx());
      if (type === "classify") {
        const cat = Object.values(CATEGORIES).find((c) => p.prompt.items.every((w) => c.words.includes(w)));
        assert.ok(cat && cat.words.includes(p.options[p.answer]), ctx());
        p.options.forEach((o, j) => j === p.answer || assert.ok(!cat.words.includes(o), "two correct " + ctx()));
      }
      if (type === "balance") { const { w, qLeft, ans } = p._check; assert.equal(weight(ans, w), weight(qLeft, w), ctx()); }
      if (["numanalogy", "series", "numpuzzle"].includes(type)) p.options.forEach((o) => assert.ok(/^-?\d+(\.\d+)?$/.test(o), ctx()));
      if (MATH.has(type)) {
        assert.ok(Array.isArray(p.steps) && p.steps.length >= 1, "math needs steps " + ctx());
        p.steps.forEach((s) => assert.ok(typeof s === "string" && s.length > 3, ctx()));
      }
      if (type === "vocabctx") assert.ok(p.prompt.text.includes("____") && VOCAB.some((v) => v.w === p.options[p.answer]), ctx());
      count++;
    }
  }
  console.log(`✓ ${String(count).padStart(5)} ${TYPES[type].name} questions valid (levels 1–3)`);
}

// Rounds and test sections
const r = makeRound(Object.keys(TYPES), 12, 2);
assert.equal(r.length, 12);
assert.equal(new Set(r.map((p) => p.key)).size, 12);
const cog = makeSections("cogat", { scale: 1 });
assert.equal(cog.length, 9);
assert.equal(cog.reduce((a, s) => a + s.questions.length, 0), COGAT.reduce((a, s) => a + s.n, 0));
assert.equal(cog.reduce((a, s) => a + s.seconds, 0), 90 * 60);
const full = makeSections("full", { scale: 1 });
assert.equal(full.length, FULL_MOCK.length);
assert.ok(full[1].questions.every((p) => p.type === "reading"));
console.log(`✓ CogAT-style test: 9 subtests, ${cog.reduce((a, s) => a + s.questions.length, 0)} questions, 90 min; full mock: ${full.map((s) => s.questions.length).join(" + ")} questions`);

// Content banks
const promptCount = Object.values(ESSAY_CATS).reduce((a, c) => a + c.bank().length, 0);
assert.ok(promptCount >= 180, "essay prompts " + promptCount);
assert.ok(VOCAB.length >= 600, "vocab " + VOCAB.length);
assert.equal(new Set(VOCAB.map((v) => v.w)).size, VOCAB.length, "duplicate vocab words");
VOCAB.forEach((v) => { assert.ok(v.def && v.ex && v.pos && v.cat, v.w); assert.ok(v.ex.toLowerCase().includes(v.w.toLowerCase().slice(0, Math.max(4, v.w.length - 3))), "example lacks word: " + v.w); });
assert.ok(ROOTS.length >= 120);
assert.ok(PASSAGES.length >= 24);
PASSAGES.forEach((p) => { assert.ok(p.text.length > 400, p.id); p.qs.forEach((q) => { assert.equal(q.d.length, 3, p.id); assert.ok(!q.d.includes(q.a), p.id); }); });
assert.ok(SENTENCES.length >= 100);
const catWords = Object.values(CATEGORIES).flatMap((c) => c.words);
assert.equal(new Set(catWords).size, catWords.length, "a word appears in two classification categories");
console.log(`✓ banks: ${promptCount} essay prompts, ${VOCAB.length} vocab words, ${ROOTS.length} roots, ${PASSAGES.length} passages (${PASSAGES.reduce((a, p) => a + p.qs.length, 0)} questions), ${SENTENCES.length} sentences, ${RELATIONS.length} analogy relations (${RELATIONS.reduce((a, r) => a + r.pairs.length, 0)} pairs), ${Object.keys(CATEGORIES).length} categories`);
