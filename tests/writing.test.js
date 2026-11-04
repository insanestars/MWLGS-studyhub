import { analyze } from "../js/writing.js";
import assert from "node:assert/strict";
const arg = `Should schools ban phones? Schools should ban smartphones during the school day because they distract students and harm learning.

First, phones are a constant distraction. For example, a 2023 survey found that students check their phones over 100 times a day. Furthermore, notifications break concentration.

Second, banning phones improves social skills. According to research, students talk more at lunch when phones are put away. As a result, friendships grow stronger.

Some argue that phones are needed for emergencies. However, schools have phones in every office, so families can still reach students.

In conclusion, schools should ban phones. Ultimately, students will learn more and connect with each other.`;
const r = analyze(arg, "argumentative");
assert.equal(r.stats.paragraphs, 5);
assert.ok(r.checks.find((c) => /counterargument/.test(c.msg)).ok);
assert.ok(r.checks.find((c) => /position/.test(c.msg)).ok);
const n = analyze("One day I went to the store. It was very good. I got a lot of stuff. It was nice.", "narrative");
assert.ok(!n.checks.find((c) => /Weak opening/.test(c.msg)).ok);
assert.ok(n.checks.some((c) => /Vague words/.test(c.msg) && !c.ok));
console.log("✓ quick-check analysis:", r.score + "/" + r.max, "on a model argumentative essay;", n.score + "/" + n.max, "on a weak narrative");
