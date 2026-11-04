import { generate, makeRound, makeMock, TYPES, BATTERIES, COGAT } from "./puzzles.js";
import { promptHtml, optionsHtml, optionsClass, optionLabel, miniHtml, KEYS } from "./render.js";
import { STRATEGIES } from "./learn.js";
import { state, addRound, addMistake, removeMistake, onChange, countAnswer, toggleFlag, isFlagged, setSetting } from "./store.js";
import { $, $$, escapeHtml, fmtClock, shuffle, toast } from "./util.js";

const TYPE_KEY = "studyhub:types";
let selected = new Set(Object.keys(TYPES));
let mockBatteries = new Set(Object.keys(BATTERIES));
let mockLen = 8;
let s = null;
let tick = null;

const SCREENS = ["menu", "mockSetup", "learn", "play", "result"];
function show(name) {
  for (const n of SCREENS) $(`#rs${n[0].toUpperCase()}${n.slice(1)}`).hidden = n !== name;
  window.scrollTo(0, 0);
}
const level = () => Number(state.settings.level) || 2;

// ── Session ──────────────────────────────────────────────────────────────────
function newSession(mode, queue, extra = {}) {
  s = { mode, level: level(), queue, chosen: [], times: [], index: 0, startAt: Date.now(), shownAt: Date.now(), feedback: mode !== "mock", revealed: [], ...extra };
  clearInterval(tick);
  tick = setInterval(onTick, 250);
  $("#rsSectionBar").hidden = mode !== "mock";
  $("#rsHelpBtn").hidden = mode === "mock";
  show("play");
  render();
}

export function start(mode, opts = {}) {
  const types = [...selected];
  if (mode === "timed") {
    const q = makeRound(types, 10, level());
    newSession("timed", q, { limit: q.reduce((a, p) => a + TYPES[p.type].secs, 0) });
  } else if (mode === "practice") {
    newSession("practice", [practicePuzzle(types)], { types, seen: new Set() });
  } else if (mode === "review") {
    if (!state.mistakes.length) return toast("No mistakes saved yet — nice!");
    newSession("review", shuffle(state.mistakes).slice(0, 15));
  } else if (mode === "flags") {
    if (!state.flags.length) return toast("Flag questions with 🚩 to save them here.");
    newSession("flags", shuffle(state.flags).slice(0, 20));
  } else if (mode === "mock") {
    const sections = makeMock([...(opts.batteries || mockBatteries)], opts.len || mockLen, level());
    const queue = [];
    sections.forEach((sec) => { sec.from = queue.length; queue.push(...sec.questions); sec.to = queue.length; delete sec.questions; });
    newSession("mock", queue, { sections, sec: 0, secStart: Date.now() });
  } else if (mode === "learn") { renderLearn(); show("learn"); }
  else if (mode === "mockSetup") { renderMockSetup(); show("mockSetup"); }
}

function practicePuzzle(types) {
  let p, guard = 0;
  do { p = generate(types[Math.floor(Math.random() * types.length)], level()); } while (s && s.seen && s.seen.has(p.key) && guard++ < 20);
  if (s && s.seen) s.seen.add(p.key);
  return p;
}

const cur = () => s.queue[s.index];
const section = () => (s.mode === "mock" ? s.sections[s.sec] : null);

function render() {
  const p = cur();
  s.shownAt = Date.now();
  $("#rsType").textContent = TYPES[p.type].name + (s.mode === "mock" ? ` · ${BATTERIES[TYPES[p.type].battery].name}` : "");
  $("#rsQuestion").textContent = p.question;
  $("#rsDisplay").innerHTML = promptHtml(p);
  const chosen = s.chosen[s.index];
  const reveal = s.feedback && s.revealed[s.index];
  $("#rsOptions").className = optionsClass(p);
  $("#rsOptions").innerHTML = optionsHtml(p, { selected: chosen ?? null, reveal });
  $("#rsFeedback").hidden = !reveal;
  if (reveal) showFeedback(p, chosen);
  $("#rsHelp").hidden = true;
  $("#rsFlagBtn").setAttribute("aria-pressed", String(isFlagged(p.key)));
  $("#rsFlagBtn").classList.toggle("flagged", isFlagged(p.key));
  updateNav();
  updateHead();
}

function updateHead() {
  if (s.mode === "practice") {
    const done = s.chosen.filter((c) => c != null).length, right = s.queue.filter((p, i) => s.chosen[i] === p.answer).length;
    $("#rsProgress").textContent = `Practice · ${right}/${done} correct`;
  } else if (s.mode === "mock") {
    const sec = section();
    $("#rsProgress").textContent = `${sec.name} · ${s.index - sec.from + 1}/${sec.to - sec.from}`;
    $("#rsSectionBar").innerHTML = s.sections.map((x, i) => `<span class="${i === s.sec ? "on" : i < s.sec ? "done" : ""}">${escapeHtml(x.name)}</span>`).join("");
  } else {
    $("#rsProgress").textContent = `Question ${s.index + 1} / ${s.queue.length}`;
  }
}

function updateNav() {
  const mock = s.mode === "mock", sec = section();
  const answered = s.chosen[s.index] != null;
  $("#rsPrevBtn").hidden = !mock || s.index <= sec.from;
  $("#rsSkipBtn").hidden = !mock || answered || s.index >= sec.to - 1;
  const lastInSec = mock && s.index >= sec.to - 1;
  const last = !mock && s.mode !== "practice" && s.index >= s.queue.length - 1;
  const nextBtn = $("#rsNextBtn");
  if (mock) {
    nextBtn.hidden = false;
    nextBtn.textContent = lastInSec ? (s.sec === s.sections.length - 1 ? "Finish test" : "Next section →") : "Next →";
  } else {
    nextBtn.hidden = !s.revealed[s.index];
    nextBtn.textContent = last ? "See results →" : "Next →";
  }
}

function answer(i) {
  const p = cur();
  if (s.feedback && s.revealed[s.index]) return;
  const first = s.chosen[s.index] == null;
  s.chosen[s.index] = i;
  s.times[s.index] = (s.times[s.index] || 0) + (Date.now() - s.shownAt);
  s.shownAt = Date.now();
  if (first) countAnswer();
  if (!s.feedback) { // mock: just mark the choice
    $("#rsOptions").innerHTML = optionsHtml(p, { selected: i });
    updateNav();
    return;
  }
  s.revealed[s.index] = true;
  const ok = i === p.answer;
  if (s.mode === "review") { if (ok) removeMistake(p.key); }
  else if (!ok) addMistake(p);
  $("#rsOptions").innerHTML = optionsHtml(p, { selected: i, reveal: true });
  showFeedback(p, i);
  updateNav(); updateHead();
  $("#rsNextBtn").focus({ preventScroll: true });
}

function showFeedback(p, i) {
  const ok = i === p.answer;
  const fb = $("#rsFeedback");
  fb.className = "feedback " + (ok ? "ok" : "no");
  fb.innerHTML = `<b>${ok ? "Correct!" : `Not quite — the answer is ${escapeHtml(optionLabel(p, p.answer))}.`}</b>${escapeHtml(p.explanation)}`;
  fb.hidden = false;
}

function next() {
  if (s.mode === "practice") {
    s.queue.push(practicePuzzle(s.types));
    s.index++;
    return render();
  }
  if (s.mode === "mock") {
    const sec = section();
    if (s.index < sec.to - 1) { s.index++; return render(); }
    return nextSection();
  }
  if (s.index >= s.queue.length - 1) return finish();
  s.index++;
  render();
}

function nextSection(timeUp = false) {
  const sec = section();
  sec.used = Math.round((Date.now() - s.secStart) / 1000);
  if (s.sec >= s.sections.length - 1) return finish();
  s.sec++;
  s.index = section().from;
  s.secStart = Date.now();
  toast(`${timeUp ? "Time's up for that section. " : ""}Next: ${section().name} — ${fmtClock(section().seconds)}`);
  render();
}

function onTick() {
  if (!s) return;
  const el = $("#rsTimer");
  if (s.mode === "mock") {
    const left = section().seconds - (Date.now() - s.secStart) / 1000;
    el.textContent = fmtClock(left);
    el.classList.toggle("warn", left <= 30);
    if (left <= 0) nextSection(true);
  } else if (s.mode === "timed") {
    const left = s.limit - (Date.now() - s.startAt) / 1000;
    el.textContent = fmtClock(left);
    el.classList.toggle("warn", left <= 30);
    if (left <= 0) finish(true);
  } else {
    el.textContent = fmtClock((Date.now() - s.startAt) / 1000);
    el.classList.remove("warn");
  }
}

// ── Results ──────────────────────────────────────────────────────────────────
function finish(timeUp = false) {
  if (!s) return;
  clearInterval(tick);
  const sess = s; s = null;
  const seconds = Math.round((Date.now() - sess.startAt) / 1000);
  // Practice only counts questions you actually answered.
  const items = sess.queue.map((p, i) => ({ p, chosen: sess.chosen[i], ms: sess.times[i] || 0 })).filter((x) => sess.mode !== "practice" || x.chosen != null);
  const total = items.length, correct = items.filter((x) => x.chosen === x.p.answer).length;
  const answered = items.filter((x) => x.chosen != null).length;
  const byType = {}, byBattery = {};
  for (const x of items) {
    const b = TYPES[x.p.type].battery, ok = x.chosen === x.p.answer ? 1 : 0;
    (byType[x.p.type] ||= { c: 0, t: 0 }); byType[x.p.type].t++; byType[x.p.type].c += ok;
    (byBattery[b] ||= { c: 0, t: 0 }); byBattery[b].t++; byBattery[b].c += ok;
  }
  // Mock: record mistakes now (no feedback during the test).
  if (sess.mode === "mock") for (const x of items) if (x.chosen != null && x.chosen !== x.p.answer) addMistake(x.p);
  const avg = answered ? items.reduce((a, x) => a + x.ms, 0) / answered / 1000 : 0;
  if (answered > 0) addRound({ mode: sess.mode, level: sess.level, total, answered, correct, seconds, avgSeconds: Math.round(avg * 10) / 10, byType, byBattery });

  $("#rsResultTitle").textContent = timeUp ? "Time's up!" : { mock: "Mock CogAT complete", review: "Review complete", flags: "Flagged questions done", practice: "Practice complete" }[sess.mode] || "Round complete";
  $("#rsScore").textContent = `${correct} / ${total}`;
  $("#rsTime").textContent = fmtClock(seconds);
  $("#rsAvg").textContent = answered ? `${avg.toFixed(1)}s` : "—";
  const pct = (o) => Math.round((o.c / o.t) * 100);
  $("#rsBreakdown").innerHTML = Object.keys(byType).length > 1 ? `<div class="card"><h2>Breakdown</h2>
    ${Object.entries(byBattery).map(([b, o]) => `<div class="focus-row"><b>${BATTERIES[b].name}</b><span>${o.c}/${o.t} · ${pct(o)}%</span></div>`).join("")}
    ${Object.entries(byType).map(([t, o]) => `<div class="focus-row"><span class="muted">${TYPES[t].name}</span><span>${o.c}/${o.t}</span></div>`).join("")}</div>` : "";
  const wrong = items.filter((x) => x.chosen !== x.p.answer);
  $("#rsWrongList").innerHTML = wrong.length ? `<div class="card"><h2>Review these (${wrong.length})</h2>${wrong.map((x) => `
      <div class="res-q"><span class="tiny muted upper">${TYPES[x.p.type].name}${x.chosen == null ? " · skipped" : ""}</span>
      <b>${escapeHtml(x.p.question)}</b>${miniHtml(x.p, x.chosen)}
      <span>${escapeHtml(x.p.explanation)}</span></div>`).join("")}
      <p class="tiny muted" style="margin:.6rem 0 0">${sess.mode === "review" ? "These stay in your mistakes list until you get them right." : "Wrong answers are saved to “Review mistakes”."}</p></div>`
    : answered ? `<div class="card"><b>No mistakes — excellent work!</b></div>` : "";
  $("#rsAgainBtn").dataset.mode = sess.mode;
  $("#rsAgainBtn").hidden = sess.mode === "review" && !state.mistakes.length;
  show("result");
}

// ── Menu, filters, learn, mock setup ─────────────────────────────────────────
function renderMenu() {
  $("#mistakeCount").textContent = state.mistakes.length ? `${state.mistakes.length} saved to retry` : "No mistakes saved yet";
  $("#flagCount").textContent = state.flags.length ? `${state.flags.length} flagged` : "Flag hard questions with 🚩";
  $$("#levelSeg [data-level]").forEach((b) => b.setAttribute("aria-checked", String(Number(b.dataset.level) === level())));
  $("#timedSub").textContent = `10 questions · ${selected.size === Object.keys(TYPES).length ? "all types" : `${selected.size} type${selected.size > 1 ? "s" : ""}`}`;
}
function renderTypes() {
  $("#typeFilter").innerHTML = Object.entries(BATTERIES).map(([b, info]) => `<div><h3>${info.name}</h3><div class="tags">${
    Object.entries(TYPES).filter(([, t]) => t.battery === b).map(([k, t]) => `<button type="button" class="tag" data-type="${k}" aria-pressed="${selected.has(k)}">${t.name}</button>`).join("")}</div></div>`).join("");
  renderMenu();
}
function saveTypes() { try { localStorage.setItem(TYPE_KEY, JSON.stringify([...selected])); } catch { /* ignore */ } }

function renderLearn() {
  $("#learnList").innerHTML = Object.entries(BATTERIES).map(([b, info]) => `<h2>${info.name}</h2>` +
    Object.entries(TYPES).filter(([, t]) => t.battery === b).map(([k, t]) => `
      <details class="card learn-item"><summary>${t.name}<button type="button" class="btn small" data-try="${k}">Practice</button></summary>
      <ul>${STRATEGIES[k].steps.map((x) => `<li>${escapeHtml(x)}</li>`).join("")}</ul>
      <div class="eg"><b>Example:</b> ${escapeHtml(STRATEGIES[k].eg)}</div></details>`).join("")).join("");
}
function renderMockSetup() {
  $("#mockBatteries").innerHTML = Object.entries(BATTERIES).map(([b, info]) => `<button type="button" class="tag" data-bat="${b}" aria-pressed="${mockBatteries.has(b)}">${info.name}</button>`).join("");
  $$("#mockLen [data-len]").forEach((x) => x.setAttribute("aria-checked", String(Number(x.dataset.len) === mockLen)));
  const subs = [...mockBatteries].flatMap((b) => COGAT[b]);
  const secs = subs.reduce((a, t) => a + TYPES[t].secs * mockLen, 0);
  $("#mockSummary").textContent = `${subs.length} subtests · ${subs.length * mockLen} questions · about ${Math.round(secs / 60)} minutes`;
  $("#mockStartBtn").disabled = !subs.length;
}

export function initReasoning() {
  try {
    const saved = JSON.parse(localStorage.getItem(TYPE_KEY));
    if (Array.isArray(saved) && saved.length) selected = new Set(saved.filter((t) => TYPES[t]));
  } catch { /* ignore */ }
  renderTypes();
  $("#typeFilter").addEventListener("click", (e) => {
    const b = e.target.closest("[data-type]"); if (!b) return;
    const t = b.dataset.type;
    if (selected.has(t) && selected.size === 1) return;
    selected.has(t) ? selected.delete(t) : selected.add(t);
    saveTypes(); renderTypes();
  });
  $("#typeAllBtn").addEventListener("click", () => {
    selected = selected.size === Object.keys(TYPES).length ? new Set(Object.keys(TYPES).filter((t) => !TYPES[t].extra)) : new Set(Object.keys(TYPES));
    saveTypes(); renderTypes();
  });
  $("#levelSeg").addEventListener("click", (e) => { const b = e.target.closest("[data-level]"); if (b) { setSetting("level", Number(b.dataset.level)); renderMenu(); } });
  $$("#rsMenu [data-mode]").forEach((b) => b.addEventListener("click", () => start(b.dataset.mode === "mock" ? "mockSetup" : b.dataset.mode)));
  $$("[data-back='menu']").forEach((b) => b.addEventListener("click", () => { renderMenu(); show("menu"); }));
  $("#mockBatteries").addEventListener("click", (e) => { const b = e.target.closest("[data-bat]"); if (!b) return; const k = b.dataset.bat; mockBatteries.has(k) ? mockBatteries.delete(k) : mockBatteries.add(k); renderMockSetup(); });
  $("#mockLen").addEventListener("click", (e) => { const b = e.target.closest("[data-len]"); if (b) { mockLen = Number(b.dataset.len); renderMockSetup(); } });
  $("#mockStartBtn").addEventListener("click", () => start("mock"));
  $("#learnList").addEventListener("click", (e) => {
    const b = e.target.closest("[data-try]"); if (!b) return;
    e.preventDefault(); selected = new Set([b.dataset.try]); saveTypes(); renderTypes(); start("practice");
  });
  $("#rsOptions").addEventListener("click", (e) => { const b = e.target.closest(".opt"); if (b && !b.disabled) answer(+b.dataset.i); });
  $("#rsNextBtn").addEventListener("click", next);
  $("#rsSkipBtn").addEventListener("click", () => { s.index++; render(); });
  $("#rsPrevBtn").addEventListener("click", () => { s.index--; render(); });
  $("#rsFlagBtn").addEventListener("click", () => {
    const on = toggleFlag(cur());
    $("#rsFlagBtn").setAttribute("aria-pressed", String(on)); $("#rsFlagBtn").classList.toggle("flagged", on);
    toast(on ? "Flagged 🚩 — find it under “Flagged”." : "Flag removed");
  });
  $("#rsHelpBtn").addEventListener("click", () => {
    const h = $("#rsHelp"), st = STRATEGIES[cur().type];
    h.innerHTML = `<b>How to solve ${escapeHtml(TYPES[cur().type].name.toLowerCase())}</b><ul>${st.steps.map((x) => `<li>${escapeHtml(x)}</li>`).join("")}</ul>`;
    h.hidden = !h.hidden;
  });
  $("#rsEndBtn").addEventListener("click", () => {
    if (s.mode !== "practice" && !confirm("End now? Unanswered questions count as wrong.")) return;
    finish();
  });
  $("#rsAgainBtn").addEventListener("click", () => start($("#rsAgainBtn").dataset.mode || "timed"));
  $("#rsMenuBtn").addEventListener("click", () => { renderMenu(); show("menu"); });
  window.addEventListener("keydown", (e) => {
    if ($("#rsPlay").hidden || $("#reasoning").hidden || !s || e.target.matches("input, textarea, select") || e.metaKey || e.ctrlKey) return;
    const k = e.key.toLowerCase();
    const n = cur().options.length;
    if (/^[1-5]$/.test(k) && +k <= n) answer(+k - 1);
    else if ("abcde".includes(k) && k.length === 1 && KEYS.indexOf(k.toUpperCase()) < n) answer(KEYS.indexOf(k.toUpperCase()));
    else if (k === "f") $("#rsFlagBtn").click();
    else if (k === "enter" && !$("#rsNextBtn").hidden && document.activeElement !== $("#rsNextBtn")) next();
  });
  onChange(renderMenu);
}

export const isPlaying = () => !!s;
export function practiceOnly(type) {
  selected = new Set([type]); saveTypes(); renderTypes(); start("practice");
}
