// No-calculator math, part 2: word problems, Algebra I, geometry.
import { pick, randInt as R } from "../util.js";
import { gcd } from "./common.js";
import { SUP, N, P, S, fmt, money, F, fStr, mixed, near, poly, term } from "./mathkit.js";

const sl = (n, d) => fStr(F(n, d)); // slope as a reduced fraction string

// ── Word problems ────────────────────────────────────────────────────────────
export const WORD = [
  () => { // ages
    const k = pick([2, 3]), son = R(5, 14), dad = k * son, y = R(2, 10);
    return { q: `A mother is ${k === 2 ? "twice" : "three times"} as old as her son. In ${y} years, the sum of their ages will be ${dad + son + 2 * y}. How old is the son now?`, a: son,
      steps: [`Let the son be s; the mother is ${k}s.`, `In ${y} years: (s + ${y}) + (${k}s + ${y}) = ${dad + son + 2 * y}.`, `${k + 1}s + ${2 * y} = ${dad + son + 2 * y}, so ${k + 1}s = ${(k + 1) * son} and s = ${son}.`],
      lures: [son + y, dad, Math.round((dad + son + 2 * y) / (k + 1)), son - 1] };
  },
  () => { // consecutive even/odd integers
    const odd = Math.random() < 0.5, n = R(3, 4), start = 2 * R(5, 40) + (odd ? 1 : 0), list = Array.from({ length: n }, (_, i) => start + 2 * i), sum = list.reduce((a, b) => a + b, 0);
    return { q: `The sum of ${n} consecutive ${odd ? "odd" : "even"} integers is ${sum}. What is the smallest?`, a: start,
      steps: [`Let the integers be x, x + 2${n > 2 ? ", x + 4" : ""}${n > 3 ? ", x + 6" : ""}.`, `${n}x + ${2 * (n * (n - 1)) / 2} = ${sum}.`, `${n}x = ${sum - n * (n - 1)}, so x = ${start}. The numbers are ${list.join(", ")}.`],
      lures: [list[n - 1], Math.round(sum / n), start + 1, start - 2] };
  },
  () => { // tickets system
    const a = pick([8, 9, 10, 12, 15]), c = pick([4, 5, 6, 7]), A = R(20, 80), C = R(20, 90);
    if (a === c) return null;
    return { q: `A school play sold ${A + C} tickets. Adult tickets cost $${a} and student tickets cost $${c}. Ticket sales totaled $${a * A + c * C}. How many adult tickets were sold?`, a: A,
      steps: [`Let x = adult tickets, y = student tickets: x + y = ${A + C} and ${a}x + ${c}y = ${a * A + c * C}.`, `Multiply the first by ${c}: ${c}x + ${c}y = ${c * (A + C)}.`, `Subtract: ${a - c}x = ${a * A + c * C - c * (A + C)}, so x = ${A}.`],
      lures: [C, Math.round((a * A + c * C) / a), A + 5, Math.round((A + C) / 2)] };
  },
  () => { // work together
    const [a, b, t] = pick([[3, 6, 2], [4, 12, 3], [6, 12, 4], [2, 6, 1.5], [10, 15, 6], [6, 3, 2], [12, 4, 3], [5, 20, 4], [20, 30, 12]]);
    return { q: `Ana can paint a fence in ${a} hours. Ben can paint it in ${b} hours. How long will it take them working together?`, a: `${fmt(t)} hours`,
      steps: [`Ana paints 1/${a} of the fence per hour; Ben paints 1/${b}.`, `Together: 1/${a} + 1/${b} = ${sl(a + b, a * b)} of the fence per hour.`, `Time = 1 ÷ ${sl(a + b, a * b)} = ${fmt(t)} hours.`],
      lures: [`${fmt((a + b) / 2)} hours`, `${a + b} hours`, `${Math.abs(a - b)} hours`, `${fmt(t + 1)} hours`] };
  },
  () => { // mean / missing score
    const n = R(4, 6), mean = R(78, 92), vals = Array.from({ length: n - 1 }, () => R(mean - 10, mean + 8));
    const missing = mean * n - vals.reduce((a, b) => a + b, 0);
    if (missing < 60 || missing > 100) return null;
    return { q: `Your first ${n - 1} quiz scores are ${vals.join(", ")}. What score do you need on the next quiz to average exactly ${mean}?`, a: missing,
      steps: [`Needed total: ${n} × ${mean} = ${n * mean}.`, `Current total: ${vals.join(" + ")} = ${mean * n - missing}.`, `${n * mean} − ${mean * n - missing} = ${missing}.`],
      lures: [mean, missing + n, missing - n, Math.round((vals.reduce((a, b) => a + b, 0)) / (n - 1))] };
  },
  () => { // trains toward each other
    const s1 = pick([40, 45, 50, 55, 60]), s2 = pick([50, 60, 65, 70, 75]), t = pick([2, 3, 1.5, 2.5, 4]), d = (s1 + s2) * t;
    if (!Number.isInteger(d)) return null;
    return { q: `Two trains leave stations ${d} miles apart at the same time and travel toward each other at ${s1} mph and ${s2} mph. How many hours until they meet?`, a: `${fmt(t)} hours`,
      steps: [`They close the gap at ${s1} + ${s2} = ${s1 + s2} mph.`, `Time = ${d} ÷ ${s1 + s2} = ${fmt(t)} hours.`],
      lures: [`${fmt(d / s2)} hours`, `${fmt(Math.round((d / Math.abs(s2 - s1 || 1)) * 10) / 10)} hours`, `${fmt(t * 2)} hours`, `${fmt(t + 0.5)} hours`] };
  },
  () => { // change from shopping
    const items = [[pick([2.35, 3.75, 4.5, 1.85]), R(2, 4)], [pick([0.65, 1.2, 2.15, 0.95]), R(3, 6)]];
    const total = items.reduce((a, [p, q]) => a + p * q, 0), paid = Math.ceil(total / 10) * 10 + (total % 10 > 8 ? 10 : 0);
    return { q: `You buy ${items[0][1]} notebooks at ${money(items[0][0])} each and ${items[1][1]} pens at ${money(items[1][0])} each. You pay with $${paid}. How much change do you get?`, a: money(paid - total),
      steps: [`Notebooks: ${items[0][1]} × ${money(items[0][0])} = ${money(items[0][0] * items[0][1])}.`, `Pens: ${items[1][1]} × ${money(items[1][0])} = ${money(items[1][0] * items[1][1])}.`, `Total: ${money(total)}. Change: $${paid} − ${money(total)} = ${money(paid - total)}.`],
      lures: [money(paid - total - 1), money(paid - items[0][0] - items[1][0]), money(total), money(paid - total + 0.5)] };
  },
  () => { // buses needed (round up)
    const per = pick([24, 28, 32, 36, 40, 45, 48]), people = per * R(3, 8) + R(1, per - 1);
    return { q: `${people} students are going on a field trip. Each bus holds ${per} students. How many buses are needed?`, a: Math.ceil(people / per),
      steps: [`${people} ÷ ${per} = ${Math.floor(people / per)} remainder ${people % per}.`, `The ${people % per} leftover students still need a bus, so round UP: ${Math.ceil(people / per)} buses.`],
      lures: [Math.floor(people / per), Math.ceil(people / per) + 1, people % per, Math.round(people / per / 2)] };
  },
  () => { // elapsed time
    const h = R(7, 11), m = pick([5, 15, 20, 35, 40, 50]), dur = R(75, 220), end = h * 60 + m + dur;
    const t = (x) => { const hh = Math.floor(x / 60), mm = x % 60, h12 = ((hh - 1) % 12) + 1; return `${h12}:${String(mm).padStart(2, "0")} ${hh >= 12 ? "p.m." : "a.m."}`; };
    return { q: `A movie starts at ${t(h * 60 + m)} and lasts ${Math.floor(dur / 60)} hour${Math.floor(dur / 60) > 1 ? "s" : ""} ${dur % 60} minutes. When does it end?`, a: t(end),
      steps: [`Add ${Math.floor(dur / 60)} hour${Math.floor(dur / 60) > 1 ? "s" : ""}: ${t(h * 60 + m + Math.floor(dur / 60) * 60)}.`, `Add ${dur % 60} minutes: ${t(end)}.`],
      lures: [t(end + 60), t(end - 10), t(end + 40), t(h * 60 + m + Math.floor(dur / 60) * 60 + Math.floor(dur % 60 / 10))] };
  },
  () => { // simple interest
    const Pr = pick([500, 800, 1000, 1200, 2000, 2500]), r = pick([2, 3, 4, 5, 6]), t = R(2, 5), I = (Pr * r * t) / 100;
    return { q: `$${fmt(Pr)} is invested at ${r}% simple interest per year. How much interest is earned in ${t} years?`, a: money(I),
      steps: [`I = P × r × t.`, `${fmt(Pr)} × ${r / 100} = ${fmt((Pr * r) / 100)} per year.`, `× ${t} years = ${money(I)}.`],
      lures: [money((Pr * r) / 100), money(Pr + I), money(I * 2), money(I + (Pr * r) / 100)] };
  },
  () => { // fencing / perimeter
    const l = R(12, 40), w = R(8, 30), gate = pick([3, 4, 5]), cost = pick([2, 3, 4, 5]);
    return { q: `A rectangular garden is ${l} ft by ${w} ft. Fencing goes all the way around except for a ${gate}-ft gate, and costs $${cost} per foot. What is the cost of the fencing?`, a: `$${(2 * (l + w) - gate) * cost}`,
      steps: [`Perimeter: 2 × (${l} + ${w}) = ${2 * (l + w)} ft.`, `Minus the gate: ${2 * (l + w)} − ${gate} = ${2 * (l + w) - gate} ft.`, `Cost: ${2 * (l + w) - gate} × $${cost} = $${(2 * (l + w) - gate) * cost}.`],
      lures: [`$${2 * (l + w) * cost}`, `$${l * w * cost}`, `$${(l + w - gate) * cost}`, `$${(2 * (l + w) + gate) * cost}`] };
  },
  () => { // mixture
    const [p1, p2, pm] = pick([[10, 30, 20], [20, 50, 30], [10, 40, 20], [25, 50, 40], [5, 25, 15]]), total = pick([10, 20, 30, 40]);
    const x = (total * (p2 - pm)) / (p2 - p1);
    if (!Number.isInteger(x)) return null;
    return { q: `How many liters of a ${p1}% salt solution must be mixed with a ${p2}% salt solution to make ${total} liters of a ${pm}% solution?`, a: `${x} liters`,
      steps: [`Let x = liters of ${p1}%. Then ${total} − x liters are ${p2}%.`, `Salt: ${p1 / 100}x + ${p2 / 100}(${total} − x) = ${pm / 100} × ${total}.`, `${p1}x + ${p2 * total} − ${p2}x = ${pm * total} → ${p2 - p1}x = ${p2 * total - pm * total} → x = ${x}.`],
      lures: [`${total - x} liters`, `${total / 2} liters`, `${x + 5} liters`, `${Math.round(total * pm / 100)} liters`] };
  },
  () => { // number puzzle
    const x = R(3, 25), a = R(2, 5), b = R(1, 20);
    return { q: `When a number is multiplied by ${a} and then increased by ${b}, the result is ${a * x + b}. What is the number?`, a: x,
      steps: [`${a}n + ${b} = ${a * x + b}.`, `${a}n = ${a * x}.`, `n = ${x}.`], lures: [(a * x + b) / a, a * x, x + b, (a * x - b) / a].map((v) => Math.round(v)) };
  },
  () => { // plan comparison
    const f1 = pick([0, 10, 20]), r1 = pick([0.5, 0.75, 1, 1.25]), f2 = f1 + pick([15, 20, 25, 30]), r2 = r1 - pick([0.25, 0.5]);
    if (r2 <= 0) return null;
    const x = (f2 - f1) / (r1 - r2);
    if (!Number.isInteger(x)) return null;
    return { q: `Gym A charges $${f1} to join plus ${money(r1)} per visit. Gym B charges $${f2} to join plus ${money(r2)} per visit. After how many visits do they cost the same?`, a: `${x} visits`,
      steps: [`Set the costs equal: ${f1} + ${r1}v = ${f2} + ${r2}v.`, `${fmt(r1 - r2)}v = ${f2 - f1}.`, `v = ${f2 - f1} ÷ ${fmt(r1 - r2)} = ${x}.`],
      lures: [`${x * 2} visits`, `${f2 - f1} visits`, `${Math.round(x / 2)} visits`, `${x + 10} visits`] };
  },
  () => { // coins
    const d = R(5, 20), q = R(4, 16);
    return { q: `Mia has ${d + q} coins, all dimes and quarters, worth ${money(d * 0.1 + q * 0.25)}. How many quarters does she have?`, a: q,
      steps: [`Let q = quarters, so dimes = ${d + q} − q.`, `10(${d + q} − q) + 25q = ${d * 10 + q * 25} cents.`, `${10 * (d + q)} + 15q = ${d * 10 + q * 25} → 15q = ${15 * q} → q = ${q}.`],
      lures: [d, q + 2, Math.round((d * 10 + q * 25) / 25), d + q - 5] };
  }
];

// ── Algebra I ────────────────────────────────────────────────────────────────
export const ALGEBRA = [
  () => { const x = R(-9, 12), a = R(2, 9), b = R(-20, 20); if (!b) return null;
    return { q: `Solve: ${a}x ${S(b)} = ${N(a * x + b)}`, a: `x = ${N(x)}`, steps: [`Undo the ${b > 0 ? "addition" : "subtraction"}: ${a}x = ${N(a * x + b)} ${S(-b)} = ${N(a * x)}.`, `Divide by ${a}: x = ${N(x)}.`],
      lures: [`x = ${N(x + 1)}`, `x = ${N(-x)}`, `x = ${fmt(Math.round(((a * x + b + b) / a) * 10) / 10)}`, `x = ${N(a * x + 2 * b)}`] }; },
  () => { const x = R(-6, 10), a = R(2, 6), b = R(1, 9), c = R(1, a + 3); if (a === c) return null; const d = a * (x - b) - c * x;
    return { q: `Solve: ${a}(x − ${b}) = ${c === 1 ? "" : c}x ${S(d)}`, a: `x = ${N(x)}`, steps: [`Distribute: ${a}x − ${a * b} = ${c === 1 ? "" : c}x ${S(d)}.`, `Get x-terms on one side: ${a - c}x = ${N(d)} + ${a * b} = ${N(d + a * b)}.`, `x = ${N(d + a * b)} ÷ ${a - c} = ${N(x)}.`],
      lures: [`x = ${N(x + 2)}`, `x = ${N(-x)}`, `x = ${fmt(Math.round(((d + b) / (a - c)) * 10) / 10)}`, `x = ${fmt(Math.round(((d - a * b) / (a - c)) * 10) / 10)}`] }; },
  () => { // equation with fractions
    const d1 = pick([2, 3, 4]), d2 = pick([3, 4, 6].filter((x) => x !== d1)), L = (d1 * d2) / gcd(d1, d2), x = L * R(1, 5) * pick([1, -1]), r = x / d1 + x / d2;
    if (!Number.isInteger(r)) return null;
    return { q: `Solve: x/${d1} + x/${d2} = ${N(r)}`, a: `x = ${N(x)}`, steps: [`Multiply everything by the LCD ${L}: ${L / d1}x + ${L / d2}x = ${N(r * L)}.`, `${L / d1 + L / d2}x = ${N(r * L)}.`, `x = ${N(x)}.`],
      lures: [`x = ${N(r * (d1 + d2))}`, `x = ${N(Math.round(r / 2))}`, `x = ${N(-x)}`, `x = ${N(r * L)}`] }; },
  () => { // inequality with flip
    const a = R(2, 6), x = R(-6, 8), b = R(-9, 9), rhs = -a * x + b, op = pick(["<", ">", "≤", "≥"]);
    const flip = { "<": ">", ">": "<", "≤": "≥", "≥": "≤" }[op];
    return { q: `Solve: −${a}x ${S(b)} ${op} ${N(rhs)}`, a: `x ${flip} ${N(x)}`, steps: [`Subtract ${N(b)} from both sides: −${a}x ${op} ${N(rhs - b)}.`, `Divide by −${a}. Dividing by a negative FLIPS the inequality sign: x ${flip} ${N(x)}.`],
      lures: [`x ${op} ${N(x)}`, `x ${flip} ${N(-x)}`, `x ${op} ${N(-x)}`, `x ${flip} ${N(x + 1)}`] }; },
  () => { // compound inequality
    const a = R(2, 5), b = R(-6, 6), lo = R(-5, 2), hi = lo + R(2, 6);
    return { q: `Solve: ${N(a * lo + b)} < ${a}x ${S(b)} < ${N(a * hi + b)}`, a: `${N(lo)} < x < ${N(hi)}`,
      steps: [`Subtract ${N(b)} from all three parts: ${N(a * lo)} < ${a}x < ${N(a * hi)}.`, `Divide all parts by ${a}: ${N(lo)} < x < ${N(hi)}.`],
      lures: [`${N(lo + 1)} < x < ${N(hi + 1)}`, `${N(a * lo)} < x < ${N(a * hi)}`, `x < ${N(lo)} or x > ${N(hi)}`, `${N(lo - 1)} < x < ${N(hi - 1)}`] }; },
  () => { // literal equations
    const f = pick([
      { q: "Solve A = lw for w.", a: "w = A/l", s: ["Divide both sides by l: A/l = w."], l: ["w = Al", "w = A − l", "w = l/A", "w = lA/2"] },
      { q: "Solve y = mx + b for x.", a: "x = (y − b)/m", s: ["Subtract b: y − b = mx.", "Divide by m: x = (y − b)/m."], l: ["x = y/m − b", "x = (y + b)/m", "x = m(y − b)", "x = (b − y)/m"] },
      { q: "Solve P = 2l + 2w for l.", a: "l = (P − 2w)/2", s: ["Subtract 2w: P − 2w = 2l.", "Divide by 2: l = (P − 2w)/2."], l: ["l = P/2 − 2w", "l = (P + 2w)/2", "l = P − w", "l = 2P − 2w"] },
      { q: "Solve d = rt for t.", a: "t = d/r", s: ["Divide both sides by r: t = d/r."], l: ["t = dr", "t = r/d", "t = d − r", "t = r − d"] },
      { q: "Solve V = (1/3)Bh for h.", a: "h = 3V/B", s: ["Multiply both sides by 3: 3V = Bh.", "Divide by B: h = 3V/B."], l: ["h = V/(3B)", "h = 3B/V", "h = VB/3", "h = 3VB"] },
      { q: "Solve C = (5/9)(F − 32) for F.", a: "F = (9/5)C + 32", s: ["Multiply both sides by 9/5: (9/5)C = F − 32.", "Add 32: F = (9/5)C + 32."], l: ["F = (5/9)C + 32", "F = (9/5)C − 32", "F = (9/5)(C + 32)", "F = 9C/5 − 32"] },
      { q: "Solve I = Prt for r.", a: "r = I/(Pt)", s: ["Divide both sides by Pt: r = I/(Pt)."], l: ["r = IPt", "r = Pt/I", "r = I − Pt", "r = It/P"] }
    ]);
    return { q: f.q, a: f.a, steps: [...f.s, "Check: substitute back to make sure the original formula holds."], lures: f.l };
  },
  () => { // slope from two points
    const x1 = R(-6, 6), y1 = R(-6, 6), dx = pick([1, 2, 3, 4, -2, -3, 5]), dy = R(-8, 8);
    if (dy === 0) return null;
    const x2 = x1 + dx, y2 = y1 + dy;
    return { q: `What is the slope of the line through (${N(x1)}, ${N(y1)}) and (${N(x2)}, ${N(y2)})?`, a: sl(dy, dx),
      steps: [`slope = (y₂ − y₁) ÷ (x₂ − x₁).`, `= (${N(y2)} − ${P(y1)}) ÷ (${N(x2)} − ${P(x1)}) = ${N(dy)} ÷ ${N(dx)}.`, `= ${sl(dy, dx)}.`],
      lures: [sl(dx, dy), sl(-dy, dx), sl(y2 + y1, x2 + x1 || 1), sl(dy + 1, dx)] };
  },
  () => { // slope from standard form
    const a = R(-6, 6), b = pick([2, 3, 4, 5, -2, -3]), c = R(-12, 12);
    if (!a) return null;
    const eq = `${term(a, "x", 1, true)}${term(b, "y", 1)} = ${N(c)}`;
    return { q: `What is the slope of the line ${eq}?`, a: sl(-a, b),
      steps: [`Solve for y: ${term(b, "y", 1, true)} = ${term(-a, "x", 1, true)} ${S(c)}.`, `Divide by ${N(b)}: y = ${sl(-a, b)}x ${c / b < 0 ? "−" : "+"} ${fStr(F(Math.abs(c), Math.abs(b)))}.`, `The slope is the number multiplying x: ${sl(-a, b)}.`],
      lures: [sl(a, b), sl(b, -a), sl(-b, a), sl(c, b)] };
  },
  () => { // equation of a line through two points
    const m = pick([-3, -2, -1, 1, 2, 3, 4]), b = R(-6, 6), x1 = R(-3, 2), x2 = x1 + R(1, 4);
    return { q: `Which equation describes the line through (${N(x1)}, ${N(m * x1 + b)}) and (${N(x2)}, ${N(m * x2 + b)})?`, a: `y = ${poly([m, b])}`,
      steps: [`Slope: (${N(m * x2 + b)} − ${P(m * x1 + b)}) ÷ (${N(x2)} − ${P(x1)}) = ${m}.`, `Use y = mx + b with (${N(x1)}, ${N(m * x1 + b)}): ${N(m * x1 + b)} = ${m}(${N(x1)}) + b, so b = ${N(b)}.`, `y = ${poly([m, b])}.`],
      lures: [`y = ${poly([m, -b])}`, `y = ${poly([-m, b])}`, `y = ${poly([b, m])}`, `y = ${poly([m, b + 1])}`] };
  },
  () => { // perpendicular slope
    const n = R(-5, 5), d = pick([1, 2, 3, 4]);
    if (!n) return null;
    return { q: `A line has slope ${sl(n, d)}. What is the slope of a line perpendicular to it?`, a: sl(-d, n),
      steps: [`Perpendicular slopes are negative reciprocals.`, `Flip ${sl(n, d)} and change the sign: ${sl(-d, n)}.`, `Check: ${sl(n, d)} × ${sl(-d, n)} = −1.`],
      lures: [sl(n, d), sl(d, n), sl(-n, d), "0"] };
  },
  () => { // intercepts
    const a = pick([2, 3, 4, 5, 6]), b = pick([2, 3, 4, 5, 6]), k = R(1, 6), c = a * b * k;
    return { q: `What is the x-intercept of ${a}x + ${b}y = ${c}?`, a: `(${c / a}, 0)`,
      steps: [`At the x-intercept, y = 0.`, `${a}x = ${c}, so x = ${c / a}.`, `The x-intercept is (${c / a}, 0).`],
      lures: [`(0, ${c / b})`, `(${c / b}, 0)`, `(${c}, 0)`, `(0, ${c / a})`] };
  },
  () => { // system by elimination
    const x = R(-5, 9), y = R(-5, 9), m = R(2, 4);
    return { q: `Solve the system: x + y = ${N(x + y)} and ${m}x − y = ${N(m * x - y)}. What is x?`, a: `x = ${N(x)}`,
      steps: [`Add the equations to eliminate y: ${m + 1}x = ${N(x + y + m * x - y)}.`, `x = ${N(x)}.`, `Then y = ${N(x + y)} − ${P(x)} = ${N(y)}.`],
      lures: [`x = ${N(y)}`, `x = ${N(x + y)}`, `x = ${N(-x)}`, `x = ${N(x + 1)}`] };
  },
  () => { // system by substitution
    const x = R(-4, 6), m = R(-3, 4), b = R(-5, 5), y = m * x + b, a = R(2, 5), c = R(1, 4);
    if (!m) return null;
    return { q: `Solve the system: y = ${poly([m, b])} and ${a}x + ${c}y = ${N(a * x + c * y)}. What is y?`, a: `y = ${N(y)}`,
      steps: [`Substitute: ${a}x + ${c}(${poly([m, b])}) = ${N(a * x + c * y)}.`, `${a + c * m}x ${S(c * b)} = ${N(a * x + c * y)} → x = ${N(x)}.`, `y = ${m}(${N(x)}) ${S(b)} = ${N(y)}.`],
      lures: [`y = ${N(x)}`, `y = ${N(-y)}`, `y = ${N(y + 2)}`, `y = ${N(b)}`] };
  },
  () => { // monomial exponent rules
    const a = R(2, 5), b = R(2, 5), m = R(2, 5), n = R(1, 4), p = R(1, 3), q = R(1, 3);
    return { q: `Simplify: (${a}x${SUP(m)}y${SUP(p)})(${b}x${SUP(n)}y${SUP(q)})`, a: `${a * b}x${SUP(m + n)}y${SUP(p + q)}`,
      steps: [`Multiply the coefficients: ${a} × ${b} = ${a * b}.`, `Add exponents of like bases: x${SUP(m)} · x${SUP(n)} = x${SUP(m + n)}; y${SUP(p)} · y${SUP(q)} = y${SUP(p + q)}.`],
      lures: [`${a * b}x${SUP(m * n)}y${SUP(p * q)}`, `${a + b}x${SUP(m + n)}y${SUP(p + q)}`, `${a * b}x${SUP(m + n + 1)}y${SUP(p + q)}`, `${a * b}xy${SUP(m + n + p + q)}`] };
  },
  () => { // power of a power
    const a = R(2, 4), m = R(2, 5), k = R(2, 3);
    return { q: `Simplify: (${a}x${SUP(m)})${SUP(k)}`, a: `${a ** k}x${SUP(m * k)}`,
      steps: [`Raise each factor to the ${k === 2 ? "second" : "third"} power: ${a}${SUP(k)} = ${a ** k}.`, `(x${SUP(m)})${SUP(k)} = x${SUP(m * k)} — multiply the exponents.`],
      lures: [`${a * k}x${SUP(m * k)}`, `${a ** k}x${SUP(m + k)}`, `${a}x${SUP(m * k)}`, `${a * k}x${SUP(m + k)}`] };
  },
  () => { // zero and negative exponents
    const a = pick([2, 3, 4, 5, 10]), n = R(1, 3), c = R(2, 9);
    const val = F(1, a ** n), tot = F(val[0] + c * val[1], val[1]);
    return { q: `Evaluate: ${a}${SUP(-n)} + ${c}${SUP(0)} × ${c}`, a: mixed(tot),
      steps: [`A negative exponent means a reciprocal: ${a}${SUP(-n)} = 1/${a ** n}.`, `Anything (except 0) to the zero power is 1: ${c}${SUP(0)} = 1, so 1 × ${c} = ${c}.`, `1/${a ** n} + ${c} = ${mixed(tot)}.`],
      lures: [mixed(F(c - a ** n, 1)), String(c), mixed(F(c * c * a ** n + 1, a ** n)), String(c + 1)] };
  },
  () => { // expand binomials
    const a = R(-7, 7), b = R(-7, 7);
    if (!a || !b) return null;
    return { q: `Expand: (x ${S(a)})(x ${S(b)})`, a: poly([1, a + b, a * b]),
      steps: [`FOIL: x · x = x${SUP(2)}; outer + inner = ${N(b)}x ${S(a)}x = ${N(a + b)}x; last = ${N(a)} × ${P(b)} = ${N(a * b)}.`, `Answer: ${poly([1, a + b, a * b])}.`],
      lures: [poly([1, a * b, a + b]), poly([1, 0, a * b]), poly([1, a + b, -a * b]), poly([1, a - b, a * b])] };
  },
  () => { // factor a trinomial
    const r = R(-8, 8), s = R(-8, 8);
    if (!r || !s || r === s) return null;
    const f = (k) => `(x ${S(k)})`;
    return { q: `Factor: ${poly([1, r + s, r * s])}`, a: `${f(r)}${f(s)}`,
      steps: [`Find two numbers that multiply to ${N(r * s)} and add to ${N(r + s)}: ${N(r)} and ${N(s)}.`, `So ${poly([1, r + s, r * s])} = ${f(r)}${f(s)}.`],
      lures: [`${f(-r)}${f(-s)}`, `${f(r)}${f(-s)}`, `${f(-r)}${f(s)}`, `${f(r + s)}${f(1)}`] };
  },
  () => { // difference of squares
    const k = R(2, 12), a = pick([1, 1, 2, 3]);
    return { q: `Factor: ${a === 1 ? "" : a * a}x${SUP(2)} − ${k * k}`, a: `(${a === 1 ? "" : a}x + ${k})(${a === 1 ? "" : a}x − ${k})`,
      steps: [`This is a difference of squares: A${SUP(2)} − B${SUP(2)} = (A + B)(A − B).`, `A = ${a === 1 ? "" : a}x and B = ${k}.`],
      lures: [`(${a === 1 ? "" : a}x − ${k})${SUP(2)}`, `(${a === 1 ? "" : a}x + ${k})${SUP(2)}`, `(${a === 1 ? "" : a}x − ${k * k})(${a === 1 ? "" : a}x + 1)`, `(${a * a}x + ${k})(x − ${k})`] };
  },
  () => { // quadratic roots
    const r1 = R(-7, 7), r2 = R(-7, 7);
    if (r1 === r2 || !r1 || !r2) return null;
    const lo = Math.min(r1, r2), hi = Math.max(r1, r2), sol = (a, b) => `x = ${N(Math.min(a, b))} or x = ${N(Math.max(a, b))}`;
    return { q: `Solve: ${poly([1, -(r1 + r2), r1 * r2])} = 0`, a: sol(lo, hi),
      steps: [`Factor: (x ${S(-r1)})(x ${S(-r2)}) = 0.`, `Set each factor to zero: x = ${N(r1)} or x = ${N(r2)}.`],
      lures: [sol(-lo, -hi), sol(lo, -hi), sol(-lo, hi), sol(r1 + r2, r1 * r2)] };
  },
  () => { // evaluate a function
    const a = R(1, 3), b = R(-5, 5), c = R(-6, 6), x = R(-4, 3), v = a * x * x + b * x + c;
    return { q: `If f(x) = ${poly([a, b, c])}, what is f(${N(x)})?`, a: v,
      steps: [`Substitute ${N(x)} for x: ${a === 1 ? "" : a}${P(x)}${SUP(2)} ${S(b)}${P(x)} ${S(c)}.`, `${P(x)}${SUP(2)} = ${x * x}, so ${a * x * x} ${S(b * x)} ${S(c)} = ${N(v)}.`],
      lures: [-a * x * x + b * x + c, a * x * x - b * x + c, 2 * a * x + b * x + c, v + 1] };
  },
  () => { // arithmetic sequence nth term
    const a1 = R(-10, 15), d = pick([-5, -4, -3, 2, 3, 4, 5, 6, 7]), n = R(10, 40);
    return { q: `An arithmetic sequence begins ${[0, 1, 2, 3].map((i) => N(a1 + i * d)).join(", ")}, … What is term number ${n}?`, a: a1 + (n - 1) * d,
      steps: [`First term a₁ = ${N(a1)}, common difference d = ${N(d)}.`, `aₙ = a₁ + (n − 1)d = ${N(a1)} + ${n - 1} × ${P(d)}.`, `= ${N(a1)} ${S((n - 1) * d)} = ${N(a1 + (n - 1) * d)}.`],
      lures: [a1 + n * d, n * d, a1 + (n - 2) * d, a1 * n] };
  },
  () => { // absolute value equation
    const a = R(-6, 6), b = R(2, 9);
    return { q: `Solve: |x ${S(-a)}| = ${b}`, a: `x = ${N(a - b)} or x = ${N(a + b)}`,
      steps: [`Two cases: x ${S(-a)} = ${b} or x ${S(-a)} = −${b}.`, `x = ${N(a + b)} or x = ${N(a - b)}.`],
      lures: [`x = ${N(a + b)} only`, `x = ${N(-a - b)} or x = ${N(-a + b)}`, `x = ${N(b - a)} or x = ${N(a + b)}`, "no solution"] };
  },
  () => { // simplify a radical
    const sq = pick([4, 9, 16, 25, 36]), r = pick([2, 3, 5, 6, 7]), n = sq * r, s = Math.sqrt(sq);
    return { q: `Simplify: √${n}`, a: `${s}√${r}`,
      steps: [`Find the largest perfect-square factor: ${n} = ${sq} × ${r}.`, `√${n} = √${sq} × √${r} = ${s}√${r}.`],
      lures: [`${r}√${s}`, `${sq}√${r}`, `${s * r}`, `${s}√${r * 2}`] };
  },
  () => { // evaluate an expression
    const a = R(-4, 5), b = R(-4, 5), v = 3 * a * a - 2 * a * b + b;
    return { q: `If a = ${N(a)} and b = ${N(b)}, what is 3a${SUP(2)} − 2ab + b?`, a: v,
      steps: [`3a${SUP(2)} = 3 × ${P(a)}${SUP(2)} = ${3 * a * a}.`, `2ab = 2 × ${P(a)} × ${P(b)} = ${N(2 * a * b)}.`, `${3 * a * a} − ${P(2 * a * b)} + ${P(b)} = ${N(v)}.`],
      lures: [(3 * a) ** 2 - 2 * a * b + b, 3 * a * a + 2 * a * b + b, 3 * a * a - 2 * a * b - b, v + 2] };
  },
  () => { // combine like terms
    const a = R(2, 9), b = R(-9, 9), c = R(-9, 9), d = R(1, 9);
    if (!b || !c) return null;
    return { q: `Simplify: ${a}x ${S(b)} ${S(c)}x − ${d}(x ${S(-b)})`, a: poly([a + c - d, b + d * b]),
      steps: [`Distribute: −${d}(x ${S(-b)}) = −${d}x ${S(d * b)}.`, `x-terms: ${a}x ${S(c)}x − ${d}x = ${N(a + c - d)}x.`, `Constants: ${N(b)} ${S(d * b)} = ${N(b + d * b)}.`],
      lures: [poly([a + c - d, b - d * b]), poly([a + c + d, b + d * b]), poly([a + c - d, b]), poly([a + c, b + d * b])] };
  }
];

// ── Geometry & measurement ───────────────────────────────────────────────────
export const GEOMETRY = [
  () => { const a = R(25, 85), b = R(25, 85); if (a + b >= 170) return null;
    return { q: `Two angles of a triangle measure ${a}° and ${b}°. What is the third angle?`, a: `${180 - a - b}°`, steps: [`Angles in a triangle add to 180°.`, `180 − ${a} − ${b} = ${180 - a - b}°.`], lures: [`${360 - a - b}°`, `${a + b}°`, `${90 - Math.min(a, b)}°`, `${180 - a - b + 10}°`] }; },
  () => { const a = R(30, 75), b = R(30, 75);
    return { q: `In a triangle, two interior angles are ${a}° and ${b}°. What is the exterior angle at the third vertex?`, a: `${a + b}°`, steps: [`An exterior angle equals the sum of the two remote interior angles.`, `${a} + ${b} = ${a + b}°.`, `(Check: the third angle is ${180 - a - b}°, and 180 − ${180 - a - b} = ${a + b}.)`], lures: [`${180 - a - b}°`, `${180 - a}°`, `${360 - a - b}°`, `${Math.abs(a - b)}°`] }; },
  () => { const x = R(35, 145); if (x === 90) return null; const k = pick(["corresponding", "alternate interior", "same-side interior", "vertical"]);
    const ans = k === "same-side interior" ? 180 - x : x;
    return { q: `Two parallel lines are cut by a transversal. One angle measures ${x}°. What is the measure of its ${k} angle?`, a: `${ans}°`,
      steps: [k === "same-side interior" ? "Same-side interior angles are supplementary (add to 180°)." : `${k[0].toUpperCase() + k.slice(1)} angles are equal.`, `So the angle is ${ans}°.`],
      lures: [`${k === "same-side interior" ? x : 180 - x}°`, `${90 - (x % 90)}°`, `${360 - x}°`, `${Math.abs(ans - 10)}°`] }; },
  () => { const l = R(3, 12), w = R(2, 10), h = R(2, 9);
    return { q: `What is the volume of a rectangular box that is ${l} cm long, ${w} cm wide, and ${h} cm tall?`, a: `${l * w * h} cm³`, steps: [`V = length × width × height.`, `${l} × ${w} × ${h} = ${l * w * h} cm³.`], lures: [`${2 * (l * w + l * h + w * h)} cm³`, `${l + w + h} cm³`, `${l * w} cm³`, `${l * w * h * 2} cm³`] }; },
  () => { const r = R(2, 8), h = R(3, 12);
    return { q: `A cylinder has radius ${r} in and height ${h} in. What is its volume? (Leave your answer in terms of π.)`, a: `${r * r * h}π in³`, steps: [`V = πr${SUP(2)}h.`, `π × ${r}${SUP(2)} × ${h} = π × ${r * r} × ${h} = ${r * r * h}π in³.`], lures: [`${2 * r * h}π in³`, `${r * h}π in³`, `${(2 * r) ** 2 * h}π in³`, `${r * r * h * 2}π in³`] }; },
  () => { const s = R(2, 12);
    return { q: `What is the surface area of a cube with edges of ${s} cm?`, a: `${6 * s * s} cm²`, steps: [`A cube has 6 square faces.`, `Each face: ${s} × ${s} = ${s * s} cm².`, `6 × ${s * s} = ${6 * s * s} cm².`], lures: [`${s ** 3} cm²`, `${4 * s * s} cm²`, `${12 * s} cm²`, `${s * s} cm²`] }; },
  () => { // L-shape area
    const W = R(8, 16), H = R(8, 16), w = R(2, W - 3), h = R(2, H - 3);
    return { q: `An L-shaped room is a ${W} m × ${H} m rectangle with a ${w} m × ${h} m rectangle cut out of one corner. What is its area?`, a: `${W * H - w * h} m²`, steps: [`Big rectangle: ${W} × ${H} = ${W * H} m².`, `Cut-out: ${w} × ${h} = ${w * h} m².`, `${W * H} − ${w * h} = ${W * H - w * h} m².`], lures: [`${W * H} m²`, `${W * H + w * h} m²`, `${2 * (W + H)} m²`, `${(W - w) * (H - h)} m²`] }; },
  () => { // distance between points
    const [a, b, c] = pick([[3, 4, 5], [6, 8, 10], [5, 12, 13], [8, 15, 17], [9, 12, 15]]), x1 = R(-5, 5), y1 = R(-5, 5), sx = pick([1, -1]), sy = pick([1, -1]);
    return { q: `What is the distance between (${N(x1)}, ${N(y1)}) and (${N(x1 + sx * a)}, ${N(y1 + sy * b)})?`, a: c,
      steps: [`Horizontal change: ${a}; vertical change: ${b}.`, `Distance = √(${a}${SUP(2)} + ${b}${SUP(2)}) = √${a * a + b * b} = ${c}.`], lures: [a + b, c + 1, Math.abs(a - b), a * b] }; },
  () => { // midpoint
    const x1 = R(-8, 8), y1 = R(-8, 8), x2 = x1 + 2 * R(-5, 5), y2 = y1 + 2 * R(-5, 5);
    if (x1 === x2 && y1 === y2) return null;
    const mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
    return { q: `What is the midpoint of the segment from (${N(x1)}, ${N(y1)}) to (${N(x2)}, ${N(y2)})?`, a: `(${N(mx)}, ${N(my)})`,
      steps: [`Average the x's: (${N(x1)} + ${P(x2)}) ÷ 2 = ${N(mx)}.`, `Average the y's: (${N(y1)} + ${P(y2)}) ÷ 2 = ${N(my)}.`],
      lures: [`(${N(x2 - x1)}, ${N(y2 - y1)})`, `(${N((x2 - x1) / 2)}, ${N((y2 - y1) / 2)})`, `(${N(my)}, ${N(mx)})`, `(${N(x1 + x2)}, ${N(y1 + y2)})`] }; },
  () => { // scaling area
    const k = pick([2, 3, 4]), A = R(5, 40);
    return { q: `A rectangle has area ${A} cm². Each side is multiplied by ${k}. What is the new area?`, a: `${A * k * k} cm²`, steps: [`When lengths are multiplied by ${k}, area is multiplied by ${k}${SUP(2)} = ${k * k}.`, `${A} × ${k * k} = ${A * k * k} cm².`], lures: [`${A * k} cm²`, `${A * k * k * k} cm²`, `${A + k} cm²`, `${A * 2 * k} cm²`] }; },
  () => { const b = R(4, 20), h = R(3, 16);
    return { q: `A triangle has a base of ${b} ft and a height of ${h} ft. What is its area?`, a: `${fmt((b * h) / 2)} ft²`, steps: [`Area = ½ × base × height.`, `½ × ${b} × ${h} = ${fmt((b * h) / 2)} ft².`], lures: [`${b * h} ft²`, `${b + h} ft²`, `${fmt(b * h / 3)} ft²`, `${2 * (b + h)} ft²`] }; },
  () => { const r = R(2, 12), area = Math.random() < 0.5;
    return area
      ? { q: `A circle has a diameter of ${2 * r} cm. What is its area? (In terms of π.)`, a: `${r * r}π cm²`, steps: [`Radius = ${2 * r} ÷ 2 = ${r}.`, `A = πr${SUP(2)} = ${r * r}π cm².`], lures: [`${4 * r * r}π cm²`, `${2 * r}π cm²`, `${2 * r * r}π cm²`, `${r}π cm²`] }
      : { q: `A circle has an area of ${r * r}π cm². What is its circumference?`, a: `${2 * r}π cm`, steps: [`πr${SUP(2)} = ${r * r}π, so r = ${r}.`, `C = 2πr = ${2 * r}π cm.`], lures: [`${r}π cm`, `${r * r}π cm`, `${4 * r}π cm`, `${2 * r * r}π cm`] }; },
  () => { const n = pick([5, 6, 8, 9, 10, 12]);
    return Math.random() < 0.5
      ? { q: `What is the sum of the interior angles of a polygon with ${n} sides?`, a: `${(n - 2) * 180}°`, steps: [`Sum = (n − 2) × 180°.`, `(${n} − 2) × 180 = ${(n - 2) * 180}°.`], lures: [`${n * 180}°`, `${(n - 1) * 180}°`, "360°", `${(n - 3) * 180}°`] }
      : { q: `Each exterior angle of a regular ${n}-gon measures how many degrees?`, a: `${fmt(360 / n)}°`, steps: [`Exterior angles of any polygon add to 360°.`, `360 ÷ ${n} = ${fmt(360 / n)}°.`], lures: [`${fmt(180 - 360 / n)}°`, `${fmt(180 / n)}°`, `${(n - 2) * 180}°`, `${fmt(360 / n + 10)}°`] }; },
  () => { const [a, b, c] = pick([[3, 4, 5], [5, 12, 13], [8, 15, 17], [7, 24, 25], [20, 21, 29]]), k = pick([1, 2, 3]), leg = Math.random() < 0.5;
    return leg
      ? { q: `A right triangle has a hypotenuse of ${c * k} and one leg of ${a * k}. How long is the other leg?`, a: b * k, steps: [`a${SUP(2)} + b${SUP(2)} = c${SUP(2)}.`, `${c * k}${SUP(2)} − ${a * k}${SUP(2)} = ${(c * k) ** 2 - (a * k) ** 2}.`, `√${(b * k) ** 2} = ${b * k}.`], lures: [(c - a) * k, (c + a) * k, c * k, a * k + 1] }
      : { q: `A right triangle has legs ${a * k} and ${b * k}. How long is the hypotenuse?`, a: c * k, steps: [`c${SUP(2)} = ${a * k}${SUP(2)} + ${b * k}${SUP(2)} = ${(a * k) ** 2} + ${(b * k) ** 2} = ${(c * k) ** 2}.`, `c = √${(c * k) ** 2} = ${c * k}.`], lures: [(a + b) * k, (b - a) * k, (c + 1) * k, (a * b * k * k) / 2] }; },
  () => { const w = R(3, 12), extra = R(2, 8), l = w + extra;
    return { q: `A rectangle's length is ${extra} more than its width, and its perimeter is ${2 * (l + w)}. What is its area?`, a: l * w, steps: [`2(w + w + ${extra}) = ${2 * (l + w)} → 4w + ${2 * extra} = ${2 * (l + w)} → w = ${w}.`, `Length = ${l}.`, `Area = ${l} × ${w} = ${l * w}.`], lures: [2 * (l + w), (l + 1) * w, l * (w - 1), w * w] }; }
];
export { near, term };
