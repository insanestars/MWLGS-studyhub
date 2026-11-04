// Generates thousands of puzzles and checks each one is well-formed.
import { generate, makeRound, TYPES } from "../js/puzzles.js";
import { frameSvg } from "../js/shapes.js";
import { NARRATIVE, ARGUMENTATIVE } from "../js/prompts.js";
import assert from "node:assert/strict";

const N = 3000;
for (const type of Object.keys(TYPES)) {
  for (let i = 0; i < N; i++) {
    const p = generate(type);
    const ctx = JSON.stringify(p);
    assert.equal(p.type, type, ctx);
    assert.equal(p.options.length, 4, ctx);
    assert.ok(p.answer >= 0 && p.answer < 4, ctx);
    const keys = p.options.map((o) => JSON.stringify(o));
    assert.equal(new Set(keys).size, 4, "duplicate options " + ctx);
    assert.ok(p.explanation && p.question && p.key, ctx);
    assert.ok(!/NaN|undefined/.test(ctx), ctx);
    if (type === "number") p.options.forEach((o) => assert.ok(/^-?\d+$/.test(o), ctx));
    if (type === "letter") [...p.display.items, ...p.options].forEach((o) => assert.ok(/^[A-Z]+$/.test(o), ctx));
    if (type === "shapes") {
      [...p.display.frames, ...p.options].forEach((f) => assert.ok(frameSvg(f).includes("<svg"), ctx));
      // Visually identical options would make the puzzle unfair: compare rendered SVG.
      assert.equal(new Set(p.options.map((f) => frameSvg(f))).size, 4, "identical-looking shape options " + ctx);
    }
  }
  console.log(`✓ ${N} ${TYPES[type]} puzzles valid`);
}
const r = makeRound();
assert.equal(r.length, 10);
assert.equal(new Set(r.map((p) => p.key)).size, 10);
console.log("✓ timed round has 10 unique questions, 2 of each type:",
  Object.entries(r.reduce((a, p) => ((a[p.type] = (a[p.type] || 0) + 1), a), {})).map((e) => e.join("=")).join(" "));
assert.ok(NARRATIVE.length >= 40 && ARGUMENTATIVE.length >= 40);
console.log(`✓ prompt banks: ${NARRATIVE.length} narrative, ${ARGUMENTATIVE.length} argumentative`);
