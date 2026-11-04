// Vocabulary: spaced-repetition flashcards (Leitner boxes), quizzes and a word list.
import { VOCAB } from "./data/words.js";
import { state, setVocab, onChange, countAnswer } from "./store.js";
import { $, $$, escapeHtml, shuffle, sample, todayKey, addDays } from "./util.js";

const INTERVAL = [0, 1, 3, 7, 16, 35]; // days until the next review for boxes 0–5
const MASTERED = 4;
const NEW_PER_DAY = 10;
const W = Object.fromEntries(VOCAB.map(([w, pos, def, ex]) => [w, { w, pos, def, ex }]));

const info = (w) => state.vocab[w] || { box: 0, due: "" };
export function dueWords() {
  const today = todayKey();
  const seen = VOCAB.filter(([w]) => state.vocab[w]);
  const due = seen.filter(([w]) => info(w).due <= today).map(([w]) => w);
  const fresh = VOCAB.filter(([w]) => !state.vocab[w]).map(([w]) => w);
  const startedToday = seen.filter(([w]) => state.vocab[w].first === today).length;
  return { due, fresh, newToday: fresh.slice(0, Math.max(0, NEW_PER_DAY - startedToday)) };
}
export function wordOfDay() {
  const k = todayKey().split("-").reduce((a, b) => a * 31 + Number(b), 7);
  return W[VOCAB[k % VOCAB.length][0]];
}
function grade(word, good) {
  const cur = info(word);
  const box = good ? Math.min(5, cur.box + 1) : 1;
  setVocab(word, { box, due: addDays(todayKey(), INTERVAL[box]), first: cur.first || todayKey(), seen: (cur.seen || 0) + 1 });
}

// ── Flashcards ───────────────────────────────────────────────────────────────
let deck = [], idx = 0;
function buildDeck() {
  const { due, newToday } = dueWords();
  deck = shuffle([...due, ...newToday]);
  idx = 0;
}
function renderCard() {
  const el = $("#vCards");
  if (idx >= deck.length) {
    const { fresh } = dueWords();
    el.innerHTML = `<div class="card center"><h2>🎉 All caught up for today</h2><p class="muted">Come back tomorrow for your next review. ${fresh.length ? `${fresh.length} words not started yet.` : "You've seen every word!"}</p>
      <button class="btn" id="moreCards">Study 10 more anyway</button></div>`;
    $("#moreCards").addEventListener("click", () => { deck = sample(VOCAB.map(([w]) => w).filter((w) => info(w).box < MASTERED), 10); idx = 0; renderCard(); });
    return;
  }
  const v = W[deck[idx]], b = info(v.w).box;
  el.innerHTML = `<div class="flash" id="flash" tabindex="0" role="button" aria-label="Flashcard — tap to flip">
      <div class="flash-inner">
        <div class="card flash-face front"><span class="w">${escapeHtml(v.w)}</span><span class="pos">${escapeHtml(v.pos)}</span><p class="tiny muted">Say the meaning, then tap to check</p></div>
        <div class="card flash-face back"><span class="def">${escapeHtml(v.def)}</span><span class="ex">“${escapeHtml(v.ex)}”</span></div>
      </div></div>
    <div class="flash-actions"><button class="btn" id="vNo" disabled>✗ Not yet</button><button class="btn primary" id="vYes" disabled>✓ Knew it</button></div>
    <p class="flash-meta">${idx + 1} of ${deck.length} · box ${b}/5${b >= MASTERED ? " · mastered" : ""}</p>`;
  const flip = () => { $("#flash").classList.toggle("flipped"); $("#vNo").disabled = $("#vYes").disabled = false; };
  $("#flash").addEventListener("click", flip);
  $("#flash").addEventListener("keydown", (e) => { if (e.key === " " || e.key === "Enter") { e.preventDefault(); flip(); } });
  $("#vYes").addEventListener("click", () => { grade(v.w, true); idx++; renderCard(); renderStats(); });
  $("#vNo").addEventListener("click", () => { grade(v.w, false); deck.push(v.w); idx++; renderCard(); renderStats(); });
}

// ── Quiz ─────────────────────────────────────────────────────────────────────
let quiz = null;
function newQuiz() {
  quiz = {
    qs: sample(VOCAB, 10).map(([w, , def]) => {
      const reverse = Math.random() < 0.4;
      const opts = shuffle([[w, def], ...sample(VOCAB.filter(([x]) => x !== w), 3).map(([x, , d]) => [x, d])]);
      return { w, reverse, prompt: reverse ? def : w, opts: opts.map(([x, d]) => (reverse ? x : d)), answer: opts.findIndex(([x]) => x === w) };
    }),
    i: 0, right: 0
  };
  renderQuiz();
}
function renderQuiz() {
  const el = $("#vQuiz");
  if (!quiz) return newQuiz();
  if (quiz.i >= quiz.qs.length) {
    el.innerHTML = `<div class="card center"><h2>${quiz.right}/${quiz.qs.length}</h2><p class="muted">${quiz.right >= 8 ? "Excellent!" : quiz.right >= 5 ? "Good — review the ones you missed." : "Keep going with the flashcards."}</p><button class="btn primary" id="vQuizAgain">New quiz</button></div>`;
    $("#vQuizAgain").addEventListener("click", newQuiz);
    return;
  }
  const q = quiz.qs[quiz.i];
  el.innerHTML = `<div class="card question"><span class="tiny muted upper">Question ${quiz.i + 1} / ${quiz.qs.length} · ${q.reverse ? "Which word means…" : "What does it mean?"}</span>
    <h2 style="font-size:${q.reverse ? "1.1rem" : "1.6rem"}">${escapeHtml(q.prompt)}</h2>
    <div class="options long">${q.opts.map((o, i) => `<button class="opt" data-i="${i}"><span class="k">${"ABCD"[i]}</span><span>${escapeHtml(o)}</span></button>`).join("")}</div>
    <div id="vqFb" class="feedback" hidden></div><button id="vqNext" class="btn primary wide" hidden>Next →</button></div>`;
  $$("#vQuiz .opt").forEach((b) => b.addEventListener("click", () => {
    const i = +b.dataset.i, ok = i === q.answer;
    if (ok) quiz.right++;
    countAnswer(); grade(q.w, ok);
    $$("#vQuiz .opt").forEach((x, j) => { x.disabled = true; x.classList.add(j === q.answer ? "right" : j === i ? "wrong" : "dim"); });
    const v = W[q.w];
    $("#vqFb").className = "feedback " + (ok ? "ok" : "no");
    $("#vqFb").innerHTML = `<b>${ok ? "Correct!" : "Not quite."}</b>${escapeHtml(v.w)} (${escapeHtml(v.pos)}): ${escapeHtml(v.def)} — “${escapeHtml(v.ex)}”`;
    $("#vqFb").hidden = false; $("#vqNext").hidden = false; $("#vqNext").focus();
    renderStats();
  }));
  $("#vqNext").addEventListener("click", () => { quiz.i++; renderQuiz(); });
}

// ── List & stats ─────────────────────────────────────────────────────────────
function renderList() {
  const q = $("#vSearch").value.trim().toLowerCase();
  const rows = VOCAB.filter(([w, , d]) => !q || w.includes(q) || d.toLowerCase().includes(q));
  $("#vListBody").innerHTML = rows.map(([w, pos, d, ex]) => {
    const b = info(w).box;
    return `<div class="vrow"><b>${escapeHtml(w)}</b><span class="d">${escapeHtml(d)}</span><span class="box" title="Box ${b}/5">${b >= MASTERED ? "✅" : "●".repeat(b) + "○".repeat(5 - b)}</span><span class="tiny muted" style="grid-column:1/-1"><i>${escapeHtml(pos)}</i> “${escapeHtml(ex)}”</span></div>`;
  }).join("") || `<div class="empty">No matches.</div>`;
}
function renderStats() {
  const vals = VOCAB.map(([w]) => info(w).box);
  const mastered = vals.filter((b) => b >= MASTERED).length, learning = vals.filter((b) => b > 0 && b < MASTERED).length;
  const { due, newToday } = dueWords();
  $("#vocabStats").innerHTML = [["Due today", due.length + newToday.length, `${due.length} review · ${newToday.length} new`], ["Learning", learning, "not mastered yet"], ["Mastered", mastered, `of ${VOCAB.length} words`]]
    .map(([k, v, s]) => `<div class="stat"><span>${k}</span><b>${v}</b><small>${s}</small></div>`).join("");
}

let tab = "cards";
function showTab(t) {
  tab = t;
  $$("#vocabTabs [data-vtab]").forEach((b) => b.setAttribute("aria-checked", String(b.dataset.vtab === t)));
  $("#vCards").hidden = t !== "cards"; $("#vQuiz").hidden = t !== "quiz"; $("#vList").hidden = t !== "list";
  if (t === "cards") { buildDeck(); renderCard(); }
  if (t === "quiz") renderQuiz();
  if (t === "list") renderList();
}

export function initVocab() {
  $("#vocabTabs").addEventListener("click", (e) => { const b = e.target.closest("[data-vtab]"); if (b) showTab(b.dataset.vtab); });
  $("#vSearch").addEventListener("input", renderList);
  window.addEventListener("viewchange", (e) => { if (e.detail === "vocab") { renderStats(); showTab(tab); } });
  onChange(() => { if (!$("#vocab").hidden) renderStats(); });
}
export const MASTERED_BOX = MASTERED;
