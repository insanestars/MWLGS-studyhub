// Vocabulary: spaced-repetition flashcards, weighted quizzes, a timed blitz, roots and a word list.
// Missed words drop to box 0: they come back a few cards later AND again the same day,
// and quizzes pick weak words more often.
import { VOCAB, CATEGORIES, BY_WORD } from "./data/vocab.js";
import { ROOTS } from "./data/roots.js";
import { state, setVocab, onChange, countAnswer, setSetting } from "./store.js";
import { $, $$, escapeHtml, shuffle, sample, pick, todayKey, addDays, fmtClock, toast } from "./util.js";

const INTERVAL = [0, 1, 3, 7, 16, 35]; // days until next review, by box
export const MASTERED_BOX = 4;
const NEW_PER_DAY = 12;

const info = (w) => state.vocab[w] || { box: 0, due: "" };
const isWeak = (w) => { const v = state.vocab[w]; return !!v && (v.box <= 1 || (v.miss || 0) >= 2); };
function pool() {
  const cat = $("#vCat") ? $("#vCat").value : "all", weak = $("#vWeak") && $("#vWeak").checked;
  let list = VOCAB.filter((v) => cat === "all" || v.cat === cat);
  if (weak) list = list.filter((v) => isWeak(v.w));
  return list;
}

export function dueWords(list = VOCAB) {
  const today = todayKey();
  const seen = list.filter((v) => state.vocab[v.w]);
  const due = seen.filter((v) => info(v.w).due <= today).map((v) => v.w);
  const fresh = list.filter((v) => !state.vocab[v.w]).map((v) => v.w);
  const startedToday = VOCAB.filter((v) => state.vocab[v.w] && state.vocab[v.w].first === today).length;
  return { due, fresh, newToday: fresh.slice(0, Math.max(0, NEW_PER_DAY - startedToday)) };
}
export function wordOfDay() {
  const k = todayKey().split("-").reduce((a, b) => a * 31 + Number(b), 7);
  return VOCAB[k % VOCAB.length];
}
function grade(word, good) {
  const cur = info(word);
  const box = good ? Math.min(5, cur.box + 1) : 0;
  setVocab(word, { box, due: addDays(todayKey(), INTERVAL[box]), first: cur.first || todayKey(), seen: (cur.seen || 0) + 1, miss: (cur.miss || 0) + (good ? 0 : 1) });
}
// Weighted pick: weak and unseen words are more likely.
function weightedSample(list, n) {
  const w = list.map((v) => { const i = state.vocab[v.w]; return !i ? 2 : i.box <= 1 ? 4 + (i.miss || 0) : i.box >= MASTERED_BOX ? 0.5 : 1.5; });
  const out = [], used = new Set();
  for (let k = 0; k < n && used.size < list.length; k++) {
    let r = Math.random() * w.reduce((a, x, i) => a + (used.has(i) ? 0 : x), 0);
    for (let i = 0; i < list.length; i++) { if (used.has(i)) continue; r -= w[i]; if (r <= 0) { used.add(i); out.push(list[i]); break; } }
  }
  return out;
}
const blank = (v) => {
  const re = new RegExp(`\\b${v.w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\w*`, "i");
  return re.test(v.ex) ? v.ex.replace(re, "____") : null;
};

// ── Flashcards ───────────────────────────────────────────────────────────────
let deck = [], idx = 0;
function buildDeck() {
  const { due, newToday } = dueWords(pool());
  deck = shuffle([...due, ...newToday]);
  idx = 0;
}
function renderCard() {
  const el = $("#vCards");
  if (idx >= deck.length) {
    el.innerHTML = `<div class="card center"><h2>🎉 All caught up</h2><p class="muted">Nothing due in this category right now. Come back tomorrow, or keep going.</p>
      <button class="btn primary" id="moreCards">Study 15 more</button></div>`;
    $("#moreCards").addEventListener("click", () => { deck = weightedSample(pool().filter((v) => info(v.w).box < MASTERED_BOX), 15).map((v) => v.w); idx = 0; renderCard(); });
    return;
  }
  const v = BY_WORD[deck[idx]], b = info(v.w).box;
  el.innerHTML = `<div class="flash" id="flash" tabindex="0" role="button" aria-label="Flashcard — tap to flip">
      <div class="flash-inner">
        <div class="card flash-face front"><span class="w">${escapeHtml(v.w)}</span><span class="pos">${escapeHtml(v.pos)} · ${escapeHtml(CATEGORIES[v.cat])}</span><p class="tiny muted">Say the meaning, then tap to check</p></div>
        <div class="card flash-face back"><span class="def">${escapeHtml(v.def)}</span><span class="ex">“${escapeHtml(v.ex)}”</span></div>
      </div></div>
    <div class="flash-actions"><button class="btn" id="vNo" disabled>✗ Not yet</button><button class="btn primary" id="vYes" disabled>✓ Knew it</button></div>
    <p class="flash-meta">${idx + 1} of ${deck.length} · box ${b}/5${b >= MASTERED_BOX ? " · mastered" : ""}${isWeak(v.w) ? " · weak word" : ""}</p>`;
  const flip = () => { $("#flash").classList.toggle("flipped"); $("#vNo").disabled = $("#vYes").disabled = false; };
  $("#flash").addEventListener("click", flip);
  $("#flash").addEventListener("keydown", (e) => { if (e.key === " " || e.key === "Enter") { e.preventDefault(); flip(); } });
  $("#vYes").addEventListener("click", () => { grade(v.w, true); idx++; renderCard(); renderStats(); });
  // Missed: comes back 3 cards later in this session (and stays due today).
  $("#vNo").addEventListener("click", () => { grade(v.w, false); deck.splice(Math.min(deck.length, idx + 4), 0, v.w); idx++; renderCard(); renderStats(); });
}

// ── Quiz (mixed kinds, weighted toward weak words) ───────────────────────────
let quiz = null;
const KINDS = { def: "What does it mean?", word: "Which word means…", blank: "Fill in the blank", root: "Root meaning" };
function makeQ(kind) {
  const list = pool();
  if (kind === "root") {
    const r = pick(ROOTS), others = sample(ROOTS.filter((x) => x[2] !== r[2]), 3);
    const opts = shuffle([r[2], ...others.map((x) => x[2])]);
    return { kind, prompt: `${r[0]}  (${r[1]}, as in ${r[4].slice(0, 3).join(", ")})`, opts, answer: opts.indexOf(r[2]), fb: `${r[0]} = “${r[2]}” (${r[3]}). Examples: ${r[4].join(", ")}.` };
  }
  const [v] = weightedSample(list.length >= 4 ? list : VOCAB, 1);
  const same = VOCAB.filter((x) => x.w !== v.w && x.pos === v.pos);
  const others = sample(same.length >= 3 ? same : VOCAB.filter((x) => x.w !== v.w), 3);
  const fb = `${v.w} (${v.pos}): ${v.def} — “${v.ex}”`;
  if (kind === "blank") {
    const text = blank(v);
    if (!text) return makeQ("def");
    const diff = sample(VOCAB.filter((x) => x.pos === v.pos && x.cat !== v.cat && x.w !== v.w), 3);
    const opts = shuffle([v.w, ...diff.map((x) => x.w)]);
    return { kind, w: v.w, prompt: text, opts, answer: opts.indexOf(v.w), fb };
  }
  if (kind === "word") { const opts = shuffle([v, ...others]); return { kind, w: v.w, prompt: v.def, opts: opts.map((x) => x.w), answer: opts.indexOf(v), fb }; }
  const opts = shuffle([v, ...others]);
  return { kind: "def", w: v.w, prompt: v.w, opts: opts.map((x) => x.def), answer: opts.indexOf(v), fb };
}
function newQuiz() {
  quiz = { qs: Array.from({ length: 10 }, (_, i) => makeQ(["def", "word", "blank", "def", "word", "blank", "def", "root", "blank", "word"][i])), i: 0, right: 0, missed: [] };
  renderQuiz();
}
function renderQuiz() {
  const el = $("#vQuiz");
  if (!quiz) return newQuiz();
  if (quiz.i >= quiz.qs.length) {
    el.innerHTML = `<div class="card center"><h2>${quiz.right}/${quiz.qs.length}</h2><p class="muted">${quiz.right >= 9 ? "Outstanding!" : quiz.right >= 7 ? "Great — review the ones you missed." : "Keep going — missed words will come back more often."}</p>
      ${quiz.missed.length ? `<p class="tiny">Missed: ${quiz.missed.map(escapeHtml).join(", ")}</p>` : ""}<button class="btn primary" id="vQuizAgain">New quiz</button></div>`;
    $("#vQuizAgain").addEventListener("click", newQuiz);
    return;
  }
  const q = quiz.qs[quiz.i];
  el.innerHTML = `<div class="card question"><span class="tiny muted upper">Question ${quiz.i + 1} / ${quiz.qs.length} · ${KINDS[q.kind]}</span>
    <h2 class="${q.kind === "def" ? "big-word" : ""}">${escapeHtml(q.prompt)}</h2>
    <div class="options long">${q.opts.map((o, i) => `<button class="opt" data-i="${i}"><span class="k">${"ABCD"[i]}</span><span>${escapeHtml(o)}</span></button>`).join("")}</div>
    <div id="vqFb" class="feedback" hidden></div><button id="vqNext" class="btn primary wide" hidden>Next →</button></div>`;
  $$("#vQuiz .opt").forEach((b) => b.addEventListener("click", () => {
    const i = +b.dataset.i, ok = i === q.answer;
    if (ok) quiz.right++; else if (q.w) quiz.missed.push(q.w);
    countAnswer(); if (q.w) grade(q.w, ok);
    $$("#vQuiz .opt").forEach((x, j) => { x.disabled = true; x.classList.add(j === q.answer ? "right" : j === i ? "wrong" : "dim"); });
    $("#vqFb").className = "feedback " + (ok ? "ok" : "no");
    $("#vqFb").innerHTML = `<b>${ok ? "Correct!" : "Not quite."}</b>${escapeHtml(q.fb)}`;
    $("#vqFb").hidden = false; $("#vqNext").hidden = false; $("#vqNext").focus();
    renderStats();
  }));
  $("#vqNext").addEventListener("click", () => { quiz.i++; renderQuiz(); });
}

// ── Blitz: 60 seconds, as many as you can ────────────────────────────────────
let blitz = null;
function renderBlitzStart() {
  const best = state.settings.blitzBest || 0;
  $("#vBlitz").innerHTML = `<div class="card center"><h2>⏱ 60-second blitz</h2><p class="muted">Match words to meanings as fast as you can. Wrong answers cost you a second.</p>
    <p>Best score: <b>${best}</b></p><button class="btn primary" id="blitzGo">Start</button></div>`;
  $("#blitzGo").addEventListener("click", startBlitz);
}
function startBlitz() {
  blitz = { end: Date.now() + 60000, right: 0, wrong: 0, q: null };
  nextBlitz();
  blitz.timer = setInterval(() => {
    const left = (blitz.end - Date.now()) / 1000;
    const t = $("#blitzClock"); if (t) t.textContent = fmtClock(left);
    if (left <= 0) endBlitz();
  }, 200);
}
function nextBlitz() {
  blitz.q = makeQ(Math.random() < 0.5 ? "def" : "word");
  const q = blitz.q;
  $("#vBlitz").innerHTML = `<div class="card question"><div class="row between"><span class="badge">✓ ${blitz.right} · ✗ ${blitz.wrong}</span><span class="rs-timer" id="blitzClock">${fmtClock((blitz.end - Date.now()) / 1000)}</span></div>
    <h2 class="${q.kind === "def" ? "big-word" : ""}">${escapeHtml(q.prompt)}</h2>
    <div class="options long">${q.opts.map((o, i) => `<button class="opt" data-i="${i}"><span class="k">${"ABCD"[i]}</span><span>${escapeHtml(o)}</span></button>`).join("")}</div></div>`;
  $$("#vBlitz .opt").forEach((b) => b.addEventListener("click", () => {
    const ok = +b.dataset.i === q.answer;
    if (ok) blitz.right++; else { blitz.wrong++; blitz.end -= 1000; }
    if (q.w) grade(q.w, ok);
    countAnswer();
    b.classList.add(ok ? "right" : "wrong");
    setTimeout(() => blitz && blitz.q === q && nextBlitz(), ok ? 150 : 500);
  }));
}
function endBlitz() {
  clearInterval(blitz.timer);
  const { right, wrong } = blitz; blitz = null;
  const best = state.settings.blitzBest || 0;
  if (right > best) { setSetting("blitzBest", right); toast(`New best: ${right}! 🎉`); }
  $("#vBlitz").innerHTML = `<div class="card center"><h2>${right} correct</h2><p class="muted">${wrong} wrong · best ${Math.max(best, right)}</p><button class="btn primary" id="blitzGo">Go again</button></div>`;
  $("#blitzGo").addEventListener("click", startBlitz);
  renderStats();
}

// ── Roots ────────────────────────────────────────────────────────────────────
function renderRoots() {
  const groups = { prefix: "Prefixes", root: "Roots", suffix: "Suffixes" };
  $("#vRoots").innerHTML = `<div class="card"><p>Knowing roots lets you decode words you've never seen: <b>bene</b> (good) + <b>vol</b> (wish) = <b>benevolent</b>, “wishing good.”</p>
    <button class="btn primary small" id="rootQuiz">Quiz me on roots</button></div>` +
    Object.entries(groups).map(([k, label]) => `<h2>${label}</h2><div class="roots">${ROOTS.filter((r) => r[1] === k).map((r) => `
      <div class="root"><b>${escapeHtml(r[0])}</b><span>${escapeHtml(r[2])}</span><small>${escapeHtml(r[3])} · ${r[4].map(escapeHtml).join(", ")}</small></div>`).join("")}</div>`).join("");
  $("#rootQuiz").addEventListener("click", () => {
    quiz = { qs: Array.from({ length: 10 }, () => makeQ("root")), i: 0, right: 0, missed: [] };
    showTab("quiz", true);
  });
}

// ── List & stats ─────────────────────────────────────────────────────────────
function renderList() {
  const q = $("#vSearch").value.trim().toLowerCase();
  const rows = pool().filter((v) => !q || v.w.includes(q) || v.def.toLowerCase().includes(q));
  $("#vListBody").innerHTML = rows.map((v) => {
    const b = info(v.w).box;
    return `<div class="vrow"><b>${escapeHtml(v.w)}</b><span class="d">${escapeHtml(v.def)}</span><span class="box" title="Box ${b}/5">${b >= MASTERED_BOX ? "✅" : isWeak(v.w) ? "⚠️" : "●".repeat(b) + "○".repeat(5 - b)}</span><span class="tiny muted" style="grid-column:1/-1"><i>${escapeHtml(v.pos)}</i> · ${escapeHtml(CATEGORIES[v.cat])} · “${escapeHtml(v.ex)}”</span></div>`;
  }).join("") || `<div class="empty">No matches.</div>`;
}
function renderStats() {
  const vals = VOCAB.map((v) => info(v.w));
  const mastered = vals.filter((x) => x.box >= MASTERED_BOX).length, weak = VOCAB.filter((v) => isWeak(v.w)).length;
  const { due, newToday } = dueWords(pool());
  $("#vocabTotal").textContent = VOCAB.length;
  $("#vocabStats").innerHTML = [["Due today", due.length + newToday.length, `${due.length} review · ${newToday.length} new`], ["Weak words", weak, "missed recently"], ["Mastered", mastered, `of ${VOCAB.length} words`], ["Blitz best", state.settings.blitzBest || 0, "words in 60 s"]]
    .map(([k, v, s]) => `<div class="stat"><span>${k}</span><b>${v}</b><small>${s}</small></div>`).join("");
}

let tab = "cards";
function showTab(t, keepQuiz = false) {
  tab = t;
  if (blitz && t !== "blitz") { clearInterval(blitz.timer); blitz = null; }
  $$("#vocabTabs [data-vtab]").forEach((b) => b.setAttribute("aria-checked", String(b.dataset.vtab === t)));
  for (const [k, id] of Object.entries({ cards: "#vCards", quiz: "#vQuiz", blitz: "#vBlitz", roots: "#vRoots", list: "#vList" })) $(id).hidden = k !== t;
  $("#vcatRow").hidden = t === "roots";
  if (t === "cards") { buildDeck(); renderCard(); }
  if (t === "quiz") { if (!keepQuiz) quiz = null; renderQuiz(); }
  if (t === "blitz") renderBlitzStart();
  if (t === "roots") renderRoots();
  if (t === "list") renderList();
}

export function initVocab() {
  $("#vCat").innerHTML = `<option value="all">All categories (${VOCAB.length})</option>` + Object.entries(CATEGORIES).map(([k, v]) => `<option value="${k}">${v} (${VOCAB.filter((x) => x.cat === k).length})</option>`).join("");
  $("#vocabTabs").addEventListener("click", (e) => { const b = e.target.closest("[data-vtab]"); if (b) showTab(b.dataset.vtab); });
  $("#vCat").addEventListener("change", () => { renderStats(); showTab(tab); });
  $("#vWeak").addEventListener("change", () => {
    if ($("#vWeak").checked && !pool().length) { $("#vWeak").checked = false; return toast("No weak words yet — words you miss will show up here."); }
    renderStats(); showTab(tab);
  });
  $("#vSearch").addEventListener("input", renderList);
  window.addEventListener("viewchange", (e) => { if (e.detail === "vocab") { renderStats(); showTab(tab); } });
  onChange(() => { if (!$("#vocab").hidden) renderStats(); });
}
export { VOCAB };
