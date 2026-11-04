// Home dashboard: countdown, daily goal, quick starts, focus area, word of the day.
import { state, onChange } from "./store.js";
import { TYPES } from "./puzzles.js";
import { dueWords, wordOfDay } from "./vocab.js";
import { $, escapeHtml, todayKey, addDays, shuffle } from "./util.js";

const TIPS = [
  "Read every option before choosing — CogAT lures are designed to look right.",
  "In analogies, make a precise sentence linking the first pair before looking at choices.",
  "Paper folding: unfold from the LAST fold backwards; each fold doubles the holes.",
  "Skip a hard question in a timed section and come back — every question is worth the same.",
  "For essays, spend about 5 minutes planning. A clear plan beats a rushed start.",
  "In argumentative essays, answer the strongest counterargument, not the weakest.",
  "Narratives need reflection: what did you learn, and how are you different now?",
  "Sleep matters: memory and reasoning are measurably worse after a short night.",
  "Practise under real timing at least twice a week as the exam gets closer.",
  "Number series: write the differences underneath — the pattern is usually there."
];

export function weakestTypes(n = 3) {
  const agg = {};
  for (const r of state.rounds.slice(-40)) for (const [t, v] of Object.entries(r.byType || {})) {
    if (!TYPES[t]) continue;
    agg[t] = agg[t] || { c: 0, t: 0 }; agg[t].c += v.c; agg[t].t += v.t;
  }
  return Object.entries(agg).filter(([, v]) => v.t >= 4).map(([t, v]) => ({ t, pct: v.c / v.t, n: v.t })).sort((a, b) => a.pct - b.pct).slice(0, n);
}

function ring(done, goal) {
  const pct = Math.min(1, done / Math.max(1, goal)), R = 38, C = 2 * Math.PI * R;
  return `<svg viewBox="0 0 92 92" role="img" aria-label="${done} of ${goal} questions today">
    <circle cx="46" cy="46" r="${R}" fill="none" stroke="var(--surface-2)" stroke-width="9"/>
    <circle cx="46" cy="46" r="${R}" fill="none" stroke="${pct >= 1 ? "var(--good)" : "var(--accent)"}" stroke-width="9" stroke-linecap="round"
      stroke-dasharray="${(C * pct).toFixed(1)} ${C.toFixed(1)}" transform="rotate(-90 46 46)"/>
    <text x="46" y="45" text-anchor="middle" font-size="19">${done}</text>
    <text x="46" y="62" text-anchor="middle" font-size="10" style="fill:var(--muted);font-weight:600">of ${goal}</text></svg>`;
}

function render() {
  if ($("#home").hidden) return;
  const now = new Date(), today = todayKey();
  const h = now.getHours();
  $("#todayLabel").textContent = now.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });
  $("#greeting").textContent = h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
  const exam = state.settings.examDate;
  if (exam) {
    const days = Math.round((new Date(exam + "T00:00:00") - new Date(today + "T00:00:00")) / 86400000);
    $("#countdown").innerHTML = days > 1 ? `📅 ${days} days until your exam` : days === 1 ? "📅 Your exam is tomorrow — rest well!" : days === 0 ? "🍀 Exam day — you've got this!" : "Exam date has passed — set a new one in Settings.";
  } else $("#countdown").innerHTML = `<a href="#" id="setExamLink">📅 Set your exam date</a> to see a countdown`;
  const done = state.daily[today] || 0, goal = Number(state.settings.dailyGoal) || 30;
  $("#goalRing").innerHTML = ring(done, goal);
  const { due, newToday } = dueWords();
  $("#vocabDue").textContent = `${due.length + newToday.length} cards due`;

  const weak = weakestTypes();
  $("#focusBody").innerHTML = weak.length
    ? weak.map((w) => `<div class="focus-row"><span><b>${TYPES[w.t].name}</b><br><span class="tiny muted">${Math.round(w.pct * 100)}% correct · ${w.n} answered</span></span><button class="btn small" data-practice="${w.t}">Practice</button></div>`).join("")
    : `<p class="muted">Answer at least 4 questions of a type and your weakest areas will appear here.</p>`;

  const v = wordOfDay();
  $("#wotd").innerHTML = `<div class="wotd-word">${escapeHtml(v.w)} <span class="muted tiny"><i>${escapeHtml(v.pos)}</i></span></div><p>${escapeHtml(v.def)}</p><p class="muted"><i>“${escapeHtml(v.ex)}”</i></p>`;

  const days = Array.from({ length: 7 }, (_, i) => addDays(today, i - 6));
  const max = Math.max(goal, ...days.map((d) => state.daily[d] || 0));
  $("#weekStats").innerHTML = days.map((d) => {
    const n = state.daily[d] || 0;
    const essays = state.essays.filter((e) => todayKey(new Date(e.date)) === d).length;
    return `<div><div class="bar7"><i class="${n ? "" : "zero"}" style="height:${Math.max(3, (n / max) * 100)}%" title="${n} questions"></i></div><b>${n}${essays ? " ✍️" : ""}</b>${new Date(d + "T12:00:00").toLocaleDateString(undefined, { weekday: "narrow" })}</div>`;
  }).join("");
  if (!$("#tipList").children.length) $("#tipList").innerHTML = shuffle(TIPS).slice(0, 4).map((t) => `<li>${escapeHtml(t)}</li>`).join("");
}

export function initHome({ startReasoning, practiceType }) {
  onChange(render);
  window.addEventListener("viewchange", (e) => e.detail === "home" && render());
  $("#home").addEventListener("click", (e) => {
    const q = e.target.closest("[data-quick]");
    if (q && q.dataset.quick !== "essay") {
      e.preventDefault();
      if (q.dataset.quick === "vocab") location.hash = "#vocab";
      else { location.hash = "#reasoning"; startReasoning(q.dataset.quick === "mix" ? "sprintSetup" : "fullSetup"); }
    }
    const p = e.target.closest("[data-practice]");
    if (p) { location.hash = "#reasoning"; practiceType(p.dataset.practice); }
    if (e.target.id === "setExamLink") { e.preventDefault(); $("#accountBtn").click(); }
  });
}
