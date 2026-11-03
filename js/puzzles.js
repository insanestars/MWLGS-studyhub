// Reasoning puzzle generators. Every call makes a fresh puzzle, so they never run out.
// A puzzle is a plain, serialisable object:
//   { key, type, question, display, options, answer, explanation }
// display: { kind: "series", items: [...] } | { kind: "text", text } | { kind: "shapes", frames: [...] }
// options: strings, or shape frames for the "shapes" type. answer: index into options.

import { rand, randInt, pick, shuffle, sample } from "./util.js";

export const TYPES = {
  number: "Number series",
  letter: "Letter series",
  analogy: "Word analogies",
  odd: "Odd one out",
  shapes: "Shape patterns"
};

const L = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const ch = (i) => L[i];

// Put the correct answer among distractors and shuffle. `keyOf` makes options comparable.
function finish(type, question, display, correct, distractors, explanation, keyOf = (x) => String(x)) {
  const seen = new Set([keyOf(correct)]);
  const opts = [correct];
  for (const d of distractors) {
    const k = keyOf(d);
    if (!seen.has(k) && opts.length < 4) { seen.add(k); opts.push(d); }
  }
  if (opts.length < 4) return null; // caller retries
  const options = shuffle(opts);
  const answer = options.findIndex((o) => keyOf(o) === keyOf(correct));
  const key = type + ":" + JSON.stringify(display);
  return { key, type, question, display, options, answer, explanation };
}

const near = (ans, spread) => {
  const out = [];
  for (let i = 1; i <= spread; i++) out.push(ans + i, ans - i);
  return shuffle(out);
};

// ── Number series ────────────────────────────────────────────────────────────
const numberRules = [
  () => { // arithmetic
    const a = randInt(1, 40), d = pick([2, 3, 4, 5, 6, 7, 8, 9, 11, 12, -3, -4, -6, -7]);
    const start = d < 0 ? a + 60 : a;
    const t = Array.from({ length: 6 }, (_, i) => start + i * d);
    return [t, `Each term ${d > 0 ? "adds" : "subtracts"} ${Math.abs(d)}.`, [t[5] + d + 1, t[5] + d - 1, t[5] + 2 * d, t[5] - d]];
  },
  () => { // geometric
    const r = pick([2, 3]), a = randInt(1, r === 2 ? 6 : 3);
    const t = Array.from({ length: 6 }, (_, i) => a * r ** i);
    return [t, `Each term is multiplied by ${r}.`, [t[5] * r + r, t[5] * (r + 1), t[5] + t[4], t[5] * r - 1]];
  },
  () => { // growing differences
    const a = randInt(1, 20), d = randInt(1, 4), k = randInt(1, 3);
    const t = [a];
    for (let i = 0; i < 6; i++) t.push(t[i] + d + i * k);
    const last = t[6] - (d + 5 * k);
    return [t, `The gaps grow by ${k} each time (+${d}, +${d + k}, +${d + 2 * k}, …).`, [t[6] - k, t[6] + k, t[6] + 1, last + (d + 4 * k)]];
  },
  () => { // alternating add/subtract
    const a = randInt(10, 40), up = randInt(4, 12), down = randInt(1, up - 1);
    const t = [a];
    for (let i = 0; i < 6; i++) t.push(t[i] + (i % 2 === 0 ? up : -down));
    return [t, `The pattern alternates: +${up}, −${down}.`, [t[6] + up + down, t[5] - down, t[6] + 1, t[6] - 1]];
  },
  () => { // squares (with optional offset)
    const s = randInt(1, 6), c = pick([0, 0, 1, -1, 2, 3]);
    const t = Array.from({ length: 6 }, (_, i) => (s + i) ** 2 + c);
    const sign = c === 0 ? "" : c > 0 ? ` plus ${c}` : ` minus ${-c}`;
    return [t, `Square numbers${sign}: ${s}², ${s + 1}², ${s + 2}², …`, [(s + 6) ** 2 + c + 1, (s + 6) ** 2 + c - 2, t[5] + (t[5] - t[4]), (s + 7) ** 2 + c]];
  },
  () => { // Fibonacci-style
    const t = [randInt(1, 5), randInt(2, 8)];
    for (let i = 2; i < 7; i++) t.push(t[i - 1] + t[i - 2]);
    return [t, "Each term is the sum of the two before it.", [t[6] + 1, t[6] - 1, t[5] * 2, t[6] - t[4]]];
  },
  () => { // two interleaved series
    const a = randInt(1, 10), da = randInt(2, 5), b = randInt(20, 40), db = -randInt(1, 4);
    const t = [];
    for (let i = 0; i < 7; i++) t.push(i % 2 === 0 ? a + (i / 2) * da : b + ((i - 1) / 2) * db);
    return [t, `Two series take turns: one goes +${da}, the other ${db}.`, [t[5] + db, t[6] + 2 * da, t[6] + 1, t[6] - 1]];
  },
  () => { // ×2 then +k
    const a = randInt(1, 5), k = randInt(1, 4);
    const t = [a];
    for (let i = 0; i < 6; i++) t.push(i % 2 === 0 ? t[i] * 2 : t[i] + k);
    return [t, `The pattern alternates: ×2, then +${k}.`, [t[6] + k, t[6] * 2 + k, t[6] + 1, t[6] * 2 - 1]];
  }
];

export function numberSeries() {
  for (;;) {
    const [terms, why, extra] = pick(numberRules)();
    const shown = terms.slice(0, -1), ans = terms[terms.length - 1];
    const p = finish("number", "What number comes next?", { kind: "series", items: shown.map(String) },
      String(ans), [...extra, ...near(ans, 4)].map(String), `${ans} — ${why}`);
    if (p) return p;
  }
}

// ── Letter series ────────────────────────────────────────────────────────────
const letterRules = [
  () => { // constant skip, forward or back
    const k = randInt(1, 4), back = Math.random() < 0.35, n = 6;
    let s = back ? randInt(k * (n - 1), 25) : randInt(0, 25 - k * (n - 1));
    const t = Array.from({ length: n }, (_, i) => ch(back ? s - i * k : s + i * k));
    const stepWord = k === 1 ? "one letter" : `${k} letters (skipping ${k - 1})`;
    return [t, `Each letter moves ${back ? "back" : "forward"} ${stepWord}.`];
  },
  () => { // growing skip
    const s = randInt(0, 6), t = [s];
    for (let i = 1; i < 6; i++) t.push(t[i - 1] + i);
    return [t.map(ch), "The jump grows by one each time: +1, +2, +3, +4, +5."];
  },
  () => { // pairs closing in from both ends: AZ, BY, CX ...
    const s = randInt(0, 6), k = randInt(1, 2);
    const t = Array.from({ length: 5 }, (_, i) => ch(s + i * k) + ch(25 - s - i * k));
    return [t, `First letter moves forward ${k}, second moves back ${k} from the end of the alphabet.`];
  },
  () => { // groups sliding: ABC, BCD ... or ACE, BDF
    const gap = randInt(1, 2), s = randInt(0, 12);
    const t = Array.from({ length: 5 }, (_, i) => ch(s + i) + ch(s + i + gap) + ch(s + i + 2 * gap));
    return [t, `Each group shifts forward one letter; letters inside are ${gap === 1 ? "consecutive" : "every other letter"}.`];
  },
  () => { // interleaved
    const a = randInt(0, 6), b = randInt(14, 22), ka = randInt(1, 3), kb = randInt(1, 2);
    const t = [];
    for (let i = 0; i < 7; i++) t.push(i % 2 === 0 ? ch(a + (i / 2) * ka) : ch(b - ((i - 1) / 2) * kb));
    return [t, `Two series take turns: one goes forward ${ka}, the other back ${kb}.`];
  }
];

function shiftLetters(str, d) {
  return [...str].map((c) => ch(Math.min(25, Math.max(0, L.indexOf(c) + d)))).join("");
}

export function letterSeries() {
  for (;;) {
    const [terms, why] = pick(letterRules)();
    const shown = terms.slice(0, -1), ans = terms[terms.length - 1];
    const distract = [1, -1, 2, -2, 3].map((d) => shiftLetters(ans, d));
    if (ans.length > 1) distract.push([...ans].reverse().join(""), shiftLetters(ans[0], 1) + ans.slice(1));
    const p = finish("letter", "What comes next?", { kind: "series", items: shown },
      ans, shuffle(distract), `${ans} — ${why}`);
    if (p) return p;
  }
}

// ── Word analogies ───────────────────────────────────────────────────────────
const ANALOGIES = [
  ["is the opposite of", [["hot", "cold"], ["early", "late"], ["generous", "selfish"], ["ancient", "modern"], ["victory", "defeat"], ["brave", "cowardly"], ["expand", "shrink"], ["accept", "refuse"], ["rough", "smooth"], ["shallow", "deep"], ["visible", "hidden"], ["arrive", "depart"], ["scarce", "plentiful"], ["praise", "criticise"]]],
  ["means the same as", [["big", "large"], ["quick", "rapid"], ["begin", "commence"], ["happy", "joyful"], ["brave", "courageous"], ["angry", "cross"], ["shut", "close"], ["clever", "intelligent"], ["tired", "weary"], ["choose", "select"], ["mend", "repair"], ["silent", "quiet"]]],
  ["is the young of", [["puppy", "dog"], ["kitten", "cat"], ["calf", "cow"], ["foal", "horse"], ["cub", "bear"], ["lamb", "sheep"], ["tadpole", "frog"], ["duckling", "duck"], ["kid", "goat"], ["joey", "kangaroo"], ["chick", "hen"], ["piglet", "pig"]]],
  ["works in a", [["chef", "kitchen"], ["teacher", "classroom"], ["pilot", "cockpit"], ["surgeon", "theatre"], ["judge", "court"], ["librarian", "library"], ["farmer", "field"], ["astronaut", "spacecraft"], ["actor", "stage"], ["scientist", "laboratory"], ["sailor", "ship"], ["miner", "mine"]]],
  ["is used by a", [["brush", "painter"], ["stethoscope", "doctor"], ["scalpel", "surgeon"], ["baton", "conductor"], ["whistle", "referee"], ["saw", "carpenter"], ["chisel", "sculptor"], ["needle", "tailor"], ["telescope", "astronomer"], ["camera", "photographer"], ["trowel", "bricklayer"], ["microphone", "singer"]]],
  ["is part of a", [["petal", "flower"], ["page", "book"], ["wheel", "car"], ["key", "keyboard"], ["branch", "tree"], ["finger", "hand"], ["chapter", "novel"], ["lens", "camera"], ["fin", "fish"], ["wing", "bird"], ["string", "guitar"], ["room", "house"]]],
  ["is a group of", [["flock", "sheep"], ["pack", "wolves"], ["school", "fish"], ["swarm", "bees"], ["herd", "cattle"], ["pride", "lions"], ["choir", "singers"], ["fleet", "ships"], ["crew", "sailors"], ["orchestra", "musicians"], ["bouquet", "flowers"], ["galaxy", "stars"]]],
  ["is where you keep", [["wallet", "money"], ["quiver", "arrows"], ["vase", "flowers"], ["kennel", "dog"], ["garage", "car"], ["aquarium", "fish"], ["wardrobe", "clothes"], ["bookcase", "books"], ["hangar", "aeroplane"], ["stable", "horse"], ["hive", "bees"], ["sheath", "sword"]]],
  ["is a more extreme form of", [["boiling", "warm"], ["freezing", "cool"], ["starving", "hungry"], ["exhausted", "tired"], ["terrified", "scared"], ["furious", "annoyed"], ["ecstatic", "pleased"], ["gigantic", "big"], ["minuscule", "small"], ["deafening", "loud"], ["drenched", "damp"], ["hilarious", "funny"]]],
  ["is the sound a", [["bark", "dog"], ["purr", "cat"], ["neigh", "horse"], ["hoot", "owl"], ["roar", "lion"], ["croak", "frog"], ["buzz", "bee"], ["bleat", "sheep"], ["moo", "cow"], ["quack", "duck"], ["hiss", "snake"], ["trumpet", "elephant"]]]
];

export function analogy() {
  for (;;) {
    const ri = rand(ANALOGIES.length);
    const [rel, pairs] = ANALOGIES[ri];
    const [[a, b], [c, d]] = sample(pairs, 2);
    const same = pairs.filter(([x, y]) => y !== d && x !== c).map(([, y]) => y);
    const other = ANALOGIES.filter((_, i) => i !== ri).flatMap(([, ps]) => ps.map(([, y]) => y));
    // Tempting distractor: something related to C in a different way (its own first word partner elsewhere).
    const distract = [...sample(same, 1), ...sample(other, 4)].filter((w) => w !== d && w !== c);
    const p = finish("analogy", `${cap(a)} is to ${b} as ${c} is to …?`, { kind: "text", text: `${a} : ${b} :: ${c} : ?` },
      d, distract, `${d} — ${cap(a)} ${rel} ${b}, just as ${c} ${rel} ${d}.`);
    if (p) return p;
  }
}
const cap = (s) => s[0].toUpperCase() + s.slice(1);

// ── Odd one out ──────────────────────────────────────────────────────────────
const CATEGORIES = {
  "fruits": ["apple", "banana", "mango", "cherry", "peach", "grape", "plum", "kiwi", "lemon", "pear"],
  "mammals": ["whale", "bat", "dolphin", "elephant", "tiger", "rabbit", "horse", "otter", "camel", "squirrel"],
  "birds": ["penguin", "eagle", "ostrich", "sparrow", "parrot", "robin", "owl", "swan", "pigeon", "flamingo"],
  "musical instruments": ["violin", "trumpet", "piano", "flute", "cello", "drum", "harp", "clarinet", "guitar", "oboe"],
  "planets": ["Mercury", "Venus", "Mars", "Jupiter", "Saturn", "Neptune", "Uranus", "Earth"],
  "colours": ["crimson", "scarlet", "turquoise", "violet", "amber", "indigo", "magenta", "maroon", "beige"],
  "pieces of furniture": ["sofa", "wardrobe", "stool", "bookcase", "armchair", "dresser", "bench", "desk"],
  "vehicles": ["bus", "tram", "lorry", "bicycle", "scooter", "taxi", "van", "motorbike"],
  "units of length": ["metre", "mile", "inch", "kilometre", "foot", "yard", "centimetre", "millimetre"],
  "countries": ["France", "Brazil", "Japan", "Kenya", "Canada", "Egypt", "India", "Mexico", "Norway"],
  "sports": ["tennis", "hockey", "rugby", "cricket", "netball", "badminton", "football", "volleyball"],
  "shapes": ["triangle", "hexagon", "circle", "pentagon", "square", "octagon", "rectangle", "oval"]
};
// Categories that could overlap with each other (e.g. "orange" the colour vs the fruit) are kept apart.
const CLASH = { "colours": ["fruits"], "fruits": ["colours", "birds"], "mammals": ["birds"], "birds": ["mammals", "fruits"] };

const ODD_NUMBER_RULES = [
  () => { const k = pick([3, 7, 9, 11]); const mult = sample(Array.from({ length: 12 }, (_, i) => k * (2 * i + 1)), 4);
    let x; do { x = 2 * randInt(4, 60) + 1; } while (x % k === 0 || mult.includes(x));
    return [mult, x, `${x} — the others are all multiples of ${k}.`]; },
  () => { const sq = sample([1, 9, 25, 49, 81, 121, 169, 225], 4);
    let x; do { x = 2 * randInt(2, 110) + 1; } while (Number.isInteger(Math.sqrt(x)) || sq.includes(x));
    return [sq, x, `${x} — the others are all square numbers.`]; },
  () => { const pr = sample([3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47, 53, 59, 61, 67], 4);
    const x = pick([9, 15, 21, 27, 33, 35, 39, 45, 51, 55, 57, 63, 65, 69, 77, 87, 91]);
    return [pr, x, `${x} — the others are all prime numbers; ${x} can be divided (e.g. by ${smallestFactor(x)}).`]; },
  () => { const ev = sample(Array.from({ length: 40 }, (_, i) => 2 * i + 10), 4);
    let x; do { x = randInt(11, 89); } while (x % 2 === 0);
    return [ev, x, `${x} — it is the only odd number.`]; }
];
function smallestFactor(n) { for (let i = 2; i * i <= n; i++) if (n % i === 0) return i; return n; }

export function oddOneOut() {
  for (;;) {
    let group, odd, why;
    if (Math.random() < 0.65) {
      const names = Object.keys(CATEGORIES);
      const cat = pick(names);
      const others = names.filter((n) => n !== cat && !(CLASH[cat] || []).includes(n));
      const oddCat = pick(others);
      group = sample(CATEGORIES[cat], 4);
      odd = pick(CATEGORIES[oddCat]);
      why = `${odd} — the others are all ${cat}; ${odd} is one of the ${oddCat}.`;
    } else {
      const [g, x, w] = pick(ODD_NUMBER_RULES)();
      group = g.map(String); odd = String(x); why = w;
    }
    const p = finish("odd", "Which one does not belong?", { kind: "text", text: "" }, odd, group, why);
    if (!p) continue;
    // Show exactly the four options in the display so the question matches the choices.
    p.display = { kind: "text", text: p.options.join(" · ") };
    p.key = "odd:" + [...p.options].sort().join(",");
    return p;
  }
}

// ── Shape patterns (SVG) ─────────────────────────────────────────────────────
const fk = (f) => JSON.stringify(f);
const shapeRules = [
  () => { // rotating arrow
    const step = pick([45, 90, -45, 135]), start = pick([0, 45, 90, 180, 270]);
    const fill = Math.random() < 0.5;
    const fr = (i) => ({ kind: "arrow", rot: (((start + i * step) % 360) + 360) % 360, fill });
    const ans = fr(4);
    const d = [45, 90, 135, 180, 225, 270, 315].map((x) => ({ ...ans, rot: (ans.rot + x) % 360 }));
    d.unshift({ ...ans, fill: !fill });
    const dir = step > 0 ? "clockwise" : "anticlockwise";
    return [[0, 1, 2, 3].map(fr), ans, d, `The arrow turns ${Math.abs(step)}° ${dir} each step.`];
  },
  () => { // polygons gaining sides
    const s = randInt(3, 5), fill = Math.random() < 0.5;
    const fr = (i) => ({ kind: "poly", sides: s + i, rot: 0, fill });
    const ans = fr(4);
    const d = [{ ...ans, sides: s + 3 }, { ...ans, sides: s + 5 }, { ...ans, fill: !fill }, { ...ans, sides: s + 2 }];
    return [[0, 1, 2, 3].map(fr), ans, d, `Each shape has one more side: ${s}, ${s + 1}, ${s + 2}, ${s + 3}, so next is ${s + 4} sides.`];
  },
  () => { // dots increasing, shading alternates
    const k = pick([1, 2]), s = randInt(1, 9 - 4 * k);
    const fr = (i) => ({ kind: "dots", n: s + i * k, fill: i % 2 === 0 });
    const ans = fr(4);
    const d = [{ ...ans, fill: !ans.fill }, { ...ans, n: ans.n - 1 }, { ...ans, n: Math.min(9, ans.n + 1), fill: !ans.fill }, { ...ans, n: ans.n - k }];
    return [[0, 1, 2, 3].map(fr), ans, d, `Dots go up by ${k} each time and alternate filled / empty.`];
  },
  () => { // marker moves round a square
    const step = pick([1, 2, 3]), start = rand(8), fill = Math.random() < 0.5;
    const fr = (i) => ({ kind: "corner", pos: (start + i * step) % 8, fill });
    const ans = fr(4);
    const d = [1, 2, 3, 4, 5, 6, 7].map((x) => ({ ...ans, pos: (ans.pos + x) % 8 }));
    d.unshift({ ...ans, fill: !fill });
    return [[0, 1, 2, 3].map(fr), ans, d, `The circle moves ${step} place${step > 1 ? "s" : ""} clockwise round the square each step.`];
  },
  () => { // rotating polygon with alternating fill
    const sides = pick([3, 5]), step = sides === 3 ? 30 : 18;
    const fr = (i) => ({ kind: "poly", sides, rot: i * step, fill: i % 2 === 1 });
    const ans = fr(4);
    const d = [{ ...ans, fill: true }, { ...ans, rot: 3 * step }, { ...ans, rot: 5 * step, fill: true }, { ...ans, sides: sides + 1 }];
    return [[0, 1, 2, 3].map(fr), ans, d, `The shape turns ${step}° each step and alternates empty / filled.`];
  },
  () => { // lines increasing and rotating
    const rot0 = pick([0, 45, 90]), step = pick([45, 90]);
    const fr = (i) => ({ kind: "bars", n: i + 1, rot: (rot0 + i * step) % 180 });
    const ans = fr(4);
    const d = [{ ...ans, n: 4 }, { ...ans, rot: (ans.rot + 45) % 180 }, { ...ans, rot: (ans.rot + 90) % 180 }, { ...ans, n: 6 }];
    return [[0, 1, 2, 3].map(fr), ans, d, `One more line each step, and the lines turn ${step}° each time.`];
  }
];

export function shapePattern() {
  for (;;) {
    const [frames, ans, distract, why] = pick(shapeRules)();
    const p = finish("shapes", "Which shape comes next?", { kind: "shapes", frames }, ans, shuffle(distract), why, fk);
    if (p) return p;
  }
}

// ── Public helpers ───────────────────────────────────────────────────────────
const GEN = { number: numberSeries, letter: letterSeries, analogy, odd: oddOneOut, shapes: shapePattern };

export function generate(type) {
  return GEN[type || pick(Object.keys(GEN))]();
}

// 10-question round: 2 of each type, shuffled, no repeats.
export function makeRound(n = 10) {
  const types = Object.keys(GEN), out = [], keys = new Set();
  let i = 0;
  while (out.length < n) {
    const p = GEN[types[i % types.length]]();
    if (keys.has(p.key)) continue;
    keys.add(p.key); out.push(p); i++;
  }
  return shuffle(out);
}
