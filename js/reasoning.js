import { generate, makeRound, TYPES } from "./puzzles.js";
import { frameSvg, questionMarkSvg } from "./shapes.js";
import { state, addRound, addMistake, removeMistake, onChange } from "./store.js";
import { $, $$, escapeHtml, fmtClock, shuffle } from "./util.js";

const ROUND_SECONDS = 5 * 60;
const KEYS = ["A", "B", "C", "D"];
const FOCUS_KEY = "studyhub:focus";

let s = null; // session
let focusTypes = new Set(Object.keys(TYPES));
let timerHandle = null;

function show(name) {
  $("#rsMenu").hidden = name !== "menu";
  $("#rsPlay").hidden = name !== "play";
  $("#rsResult").hidden = name !== "result";
  window.scrollTo(0, 0);
}

// ── Rendering a puzzle ───────────────────────────────────────────────────────
function renderDisplay(p) {
  const d = p.display;
  if (d.kind === "series") {
    return `<div class="series">${d.items.map((x) => `<span>${escapeHtml(x)}</span>`).join("")}<span class="q">?</span></div>`;
  }
  if (d.kind === "shapes") {
    return `<div class="frames">${d.frames.map((f, i) => `<div>${frameSvg(f, `figure ${i + 1}`)}</div>`).join("")}<div class="q">${questionMarkSvg}</div></div>`;
  }
  if (p.type === "analogy") return `<p class="analogy">${escapeHtml(d.text)}</p>`;
  return ""; // odd-one-out: the options are the items
}

function renderQuestion() {
  const p = s.current;
  s.shownAt = Date.now();
  s.locked = false;
  $("#rsType").textContent = TYPES[p.type];
  $("#rsQuestion").textContent = p.question;
  $("#rsDisplay").innerHTML = renderDisplay(p);
  const isShape = p.type === "shapes";
  $("#rsOptions").className = "options" + (isShape ? " shapes" : "");
  $("#rsOptions").innerHTML = p.options.map((o, i) => `
    <button class="opt" data-i="${i}" aria-label="Option ${KEYS[i]}">
      <span class="k">${KEYS[i]}</span>${isShape ? frameSvg(o, `option ${KEYS[i]}`) : `<span>${escapeHtml(o)}</span>`}
    </button>`).join("");
  $("#rsFeedback").hidden = true;
  $("#rsNextBtn").hidden = true;
  updateHead();
}

function updateHead() {
  if (s.mode === "practice") $("#rsProgress").textContent = `Practice · ${s.correct}/${s.answered} correct`;
  else $("#rsProgress").textContent = `Question ${Math.min(s.index + 1, s.queue.length)} / ${s.queue.length}`;
}

function answer(i) {
  if (!s || s.locked) return;
  s.locked = true;
  const p = s.current;
  const ok = i === p.answer;
  const ms = Date.now() - s.shownAt;
  s.answered++; if (ok) s.correct++;
  s.results.push({ type: p.type, ok, ms });
  if (!ok) s.wrong.push(p);

  if (s.mode === "review") { if (ok) removeMistake(p.key); }
  else if (!ok) addMistake(p);

  $$("#rsOptions .opt").forEach((b, j) => {
    b.disabled = true;
    if (j === p.answer) b.classList.add("right");
    else if (j === i) b.classList.add("wrong");
    else b.classList.add("dim");
  });
  const right = typeof p.options[p.answer] === "string" ? p.options[p.answer] : `option ${KEYS[p.answer]}`;
  const fb = $("#rsFeedback");
  fb.className = "feedback " + (ok ? "ok" : "no");
  fb.innerHTML = `<b>${ok ? "Correct!" : `Not quite — the answer is ${escapeHtml(right)}.`}</b>${escapeHtml(stripLead(p.explanation))}`;
  fb.hidden = false;
  const last = s.mode !== "practice" && s.index >= s.queue.length - 1;
  $("#rsNextBtn").textContent = last ? "See results →" : "Next →";
  $("#rsNextBtn").hidden = false;
  $("#rsNextBtn").focus({ preventScroll: true });
  updateHead();
}
// Explanations start with "answer — reason"; we already show the answer, so keep the reason.
const stripLead = (t) => t.includes(" — ") ? t.slice(t.indexOf(" — ") + 3).replace(/^./, (c) => c.toUpperCase()) : t;

function next() {
  if (!s) return;
  if (s.mode === "practice") {
    s.current = practicePuzzle();
    return renderQuestion();
  }
  s.index++;
  if (s.index >= s.queue.length) return finish();
  s.current = s.queue[s.index];
  renderQuestion();
}

function practicePuzzle() {
  const types = [...focusTypes];
  let p;
  do { p = generate(types[Math.floor(Math.random() * types.length)]); } while (s.seen.has(p.key));
  s.seen.add(p.key);
  return p;
}

// ── Session lifecycle ────────────────────────────────────────────────────────
function start(mode) {
  if (mode === "review" && !state.mistakes.length) return;
  s = { mode, index: 0, correct: 0, answered: 0, results: [], wrong: [], startAt: Date.now(), seen: new Set() };
  if (mode === "timed") s.queue = makeRound(10);
  if (mode === "review") s.queue = shuffle(state.mistakes).slice(0, 10);
  s.current = mode === "practice" ? practicePuzzle() : s.queue[0];
  clearInterval(timerHandle);
  $("#rsTimer").textContent = "";
  $("#rsTimer").classList.remove("warn");
  if (mode === "timed") { timerHandle = setInterval(tickTimer, 250); tickTimer(); }
  else if (mode === "practice") { timerHandle = setInterval(tickTimer, 1000); tickTimer(); }
  $("#rsEndBtn").textContent = mode === "practice" ? "Finish" : "End";
  show("play");
  renderQuestion();
}

function tickTimer() {
  if (!s) return;
  const elapsed = (Date.now() - s.startAt) / 1000;
  if (s.mode === "timed") {
    const left = ROUND_SECONDS - elapsed;
    $("#rsTimer").textContent = fmtClock(left);
    $("#rsTimer").classList.toggle("warn", left <= 30);
    if (left <= 0) finish(true);
  } else {
    $("#rsTimer").textContent = fmtClock(elapsed);
  }
}

function finish(timeUp = false) {
  if (!s) return;
  clearInterval(timerHandle);
  const seconds = Math.round((Date.now() - s.startAt) / 1000);
  const total = s.mode === "practice" ? s.answered : s.queue.length;
  const byType = {};
  for (const r of s.results) {
    byType[r.type] = byType[r.type] || { c: 0, t: 0 };
    byType[r.type].t++; if (r.ok) byType[r.type].c++;
  }
  // In a timed round, unanswered questions count as wrong.
  if (s.mode === "timed") for (const p of s.queue.slice(s.answered)) {
    byType[p.type] = byType[p.type] || { c: 0, t: 0 }; byType[p.type].t++;
  }
  const answeredMs = s.results.reduce((a, r) => a + r.ms, 0);
  const avg = s.answered ? answeredMs / s.answered / 1000 : 0;
  if (s.answered > 0) {
    addRound({ mode: s.mode, total, answered: s.answered, correct: s.correct, seconds, avgSeconds: Math.round(avg * 10) / 10, byType });
  }

  $("#rsResultTitle").textContent = timeUp ? "Time's up!" : s.mode === "review" ? "Review complete" : s.mode === "practice" ? "Practice complete" : "Round complete";
  $("#rsScore").textContent = `${s.correct} / ${total}`;
  $("#rsTime").textContent = fmtClock(seconds);
  $("#rsAvg").textContent = s.answered ? `${avg.toFixed(1)}s` : "—";
  $("#rsWrongList").innerHTML = s.wrong.length ? `<div class="card"><h2>To review</h2>${s.wrong.map((p) => `
      <div class="wrong-item"><span class="tiny muted upper">${TYPES[p.type]}</span>
      <span>${escapeHtml(p.question)} ${p.display.kind === "series" ? `<b>${escapeHtml(p.display.items.join(", "))}, ?</b>` : p.display.kind === "text" && p.display.text ? `<b>${escapeHtml(p.display.text)}</b>` : ""}</span>
      <span class="muted">${escapeHtml(p.explanation)}</span></div>`).join("")}
      <p class="tiny muted" style="margin:.6rem 0 0">${s.mode === "review" ? "These stay in your mistakes list until you get them right." : "Saved to “Review my mistakes”."}</p></div>`
    : s.answered ? `<div class="card"><b>No mistakes — great work!</b></div>` : "";
  const lastMode = s.mode;
  s = null;
  $("#rsAgainBtn").dataset.mode = lastMode;
  $("#rsAgainBtn").disabled = lastMode === "review" && !state.mistakes.length;
  show("result");
}

// ── Menu ─────────────────────────────────────────────────────────────────────
function renderMenu() {
  const n = state.mistakes.length;
  $("#mistakeCount").textContent = n ? `${n} saved to retry` : "No mistakes saved yet";
  $("#reviewModeBtn").disabled = !n;
}
function renderFocus() {
  $("#typeFilter").innerHTML = Object.entries(TYPES).map(([k, v]) =>
    `<button type="button" class="tag" data-type="${k}" aria-pressed="${focusTypes.has(k)}">${v}</button>`).join("");
}

export function initReasoning() {
  try {
    const saved = JSON.parse(localStorage.getItem(FOCUS_KEY));
    if (Array.isArray(saved) && saved.length) focusTypes = new Set(saved.filter((t) => TYPES[t]));
  } catch { /* ignore */ }
  renderFocus();
  $("#typeFilter").addEventListener("click", (e) => {
    const b = e.target.closest("[data-type]");
    if (!b) return;
    const t = b.dataset.type;
    if (focusTypes.has(t) && focusTypes.size === 1) return; // keep at least one
    focusTypes.has(t) ? focusTypes.delete(t) : focusTypes.add(t);
    try { localStorage.setItem(FOCUS_KEY, JSON.stringify([...focusTypes])); } catch { /* ignore */ }
    renderFocus();
  });
  $$("[data-mode]").forEach((b) => b.addEventListener("click", () => start(b.dataset.mode)));
  $("#rsOptions").addEventListener("click", (e) => {
    const b = e.target.closest(".opt");
    if (b) answer(+b.dataset.i);
  });
  $("#rsNextBtn").addEventListener("click", next);
  $("#rsAgainBtn").addEventListener("click", () => start($("#rsAgainBtn").dataset.mode || "timed"));
  $("#rsEndBtn").addEventListener("click", () => {
    if (s.mode !== "practice" && s.index < s.queue.length - 1 && !confirm("End this round now? Unanswered questions count as wrong.")) return;
    finish();
  });
  $("#rsMenuBtn").addEventListener("click", () => { renderMenu(); show("menu"); });
  window.addEventListener("keydown", (e) => {
    if ($("#rsPlay").hidden || $("#reasoning").hidden || !s || e.target.matches("input, textarea, select")) return;
    if (!s.locked && ["1", "2", "3", "4"].includes(e.key)) answer(+e.key - 1);
    else if (!s.locked && ["a", "b", "c", "d"].includes(e.key.toLowerCase())) answer(KEYS.indexOf(e.key.toUpperCase()));
    else if (s.locked && e.key === "Enter" && document.activeElement !== $("#rsNextBtn")) next();
  });
  onChange(renderMenu);
}
