import { generate, makeSections, TYPES, BATTERIES, COGAT, FULL_MOCK, typesIn, setSeen } from "./puzzles.js";
import { SKILLS } from "./gen/reading.js";
import { promptHtml, passageHtml, optionsHtml, optionsClass, optionLabel, miniHtml, stepsHtml, KEYS } from "./render.js";
import { STRATEGIES } from "./learn.js";
import { state, addRound, addMistake, removeMistake, onChange, countAnswer, toggleFlag, isFlagged, setSetting, markSeen, seenSet } from "./store.js";
import { $, $$, escapeHtml, fmtClock, shuffle, toast } from "./util.js";

const TYPE_KEY = "studyhub:types";
let selected = new Set(Object.keys(TYPES));
let s = null;          // current session
let tick = null;
let lastStart = null;  // to repeat "Go again"
let onEssay = () => {};

const SCREENS = ["menu", "setup", "mistakes", "learn", "play", "result"];
function show(name) {
  for (const n of SCREENS) $(`#rs${n[0].toUpperCase()}${n.slice(1)}`).hidden = n !== name;
  window.scrollTo(0, 0);
}
const level = () => Number(state.settings.level) || 2;
const pctOf = (o) => (o && o.t ? Math.round((o.c / o.t) * 100) : null);

// ── Accuracy stats (for section cards and the mistakes page) ────────────────
function accuracy() {
  const byType = {};
  for (const r of state.rounds) for (const [t, v] of Object.entries(r.byType || {})) {
    byType[t] = byType[t] || { c: 0, t: 0 }; byType[t].c += v.c; byType[t].t += v.t;
  }
  return byType;
}

// ── Starting sessions ────────────────────────────────────────────────────────
// mode: practice | review | flags | test | sprint
function begin(cfg) {
  lastStart = cfg;
  const base = { chosen: [], times: [], revealed: [], index: 0, startAt: Date.now(), shownAt: Date.now(), level: level(), sec: 0, secStart: Date.now() };
  s = { ...base, ...cfg };
  s.feedback = s.mode !== "test";
  if (s.sections) { // flatten sections into one queue
    s.queue = [];
    s.sections.forEach((sec) => { sec.from = s.queue.length; s.queue.push(...sec.questions); sec.to = s.queue.length; delete sec.questions; });
  }
  if (!s.queue || !s.queue.length) s.queue = [nextGenerated()];
  clearInterval(tick);
  tick = setInterval(onTick, 250);
  $("#rsSectionBar").hidden = !(s.mode === "test" && s.sections.length > 1);
  $("#rsHelpBtn").hidden = s.mode === "test";
  show("play");
  render();
}

function nextGenerated() {
  const types = s.types;
  return generate(types[Math.floor(Math.random() * types.length)], s.level);
}

export function startPractice(types) { begin({ mode: "practice", types, title: "Practice" }); }
function startSprint(types, minutes) { begin({ mode: "sprint", types, limit: minutes * 60, title: `${minutes}-minute sprint` }); }
function startTest(kind, sections, title) { begin({ mode: "test", kind, sections, title }); }
function startReview(list, title) {
  if (!list.length) return toast("Nothing to review here — nice!");
  begin({ mode: "review", queue: shuffle(list).slice(0, 25), title });
}

const cur = () => s.queue[s.index];
const section = () => (s.sections ? s.sections[s.sec] : null);

function render() {
  const p = cur();
  s.shownAt = Date.now();
  $("#rsType").textContent = `${TYPES[p.type] ? TYPES[p.type].name : p.type}${p.skill ? ` · ${SKILLS[p.skill]}` : ""}`;
  $("#rsQuestion").textContent = p.question;
  const passage = p.prompt && p.prompt.kind === "passage";
  $("#rsPassage").hidden = !passage;
  $("#playWrap").classList.toggle("with-passage", passage);
  if (passage) {
    const el = $("#rsPassage");
    if (el.dataset.id !== p.prompt.id) { el.innerHTML = passageHtml(p.prompt); el.dataset.id = p.prompt.id; el.scrollTop = 0; }
  } else $("#rsPassage").dataset.id = "";
  $("#rsDisplay").innerHTML = passage ? "" : promptHtml(p);
  const chosen = s.chosen[s.index];
  const reveal = s.feedback && s.revealed[s.index];
  $("#rsOptions").className = optionsClass(p);
  $("#rsOptions").innerHTML = optionsHtml(p, { selected: chosen ?? null, reveal });
  $("#rsFeedback").hidden = !reveal;
  if (reveal) showFeedback(p, chosen);
  $("#rsHelp").hidden = true;
  $("#rsFlagBtn").setAttribute("aria-pressed", String(isFlagged(p.key)));
  $("#rsFlagBtn").classList.toggle("flagged", isFlagged(p.key));
  updateNav(); updateHead();
}

function updateHead() {
  const done = s.chosen.filter((c) => c != null).length, right = s.queue.filter((p, i) => s.chosen[i] === p.answer).length;
  if (s.mode === "practice") $("#rsProgress").textContent = `Practice · ${right}/${done} correct`;
  else if (s.mode === "sprint") $("#rsProgress").textContent = `Sprint · ${right} correct`;
  else if (s.mode === "test") {
    const sec = section();
    $("#rsProgress").textContent = `${sec.name} · ${s.index - sec.from + 1}/${sec.to - sec.from}`;
    $("#rsSectionBar").innerHTML = s.sections.map((x, i) => `<span class="${i === s.sec ? "on" : i < s.sec ? "done" : ""}">${escapeHtml(x.name)}</span>`).join("");
  } else $("#rsProgress").textContent = `Question ${s.index + 1} / ${s.queue.length}`;
}

function updateNav() {
  const test = s.mode === "test", sec = section();
  const answered = s.chosen[s.index] != null;
  $("#rsPrevBtn").hidden = !test || s.index <= sec.from;
  $("#rsSkipBtn").hidden = !test || answered || s.index >= sec.to - 1;
  const btn = $("#rsNextBtn");
  if (test) {
    const lastInSec = s.index >= sec.to - 1;
    btn.hidden = false;
    btn.textContent = lastInSec ? (s.sec === s.sections.length - 1 ? "Finish test" : "Next section →") : "Next →";
  } else {
    btn.hidden = !s.revealed[s.index] || s.mode === "sprint";
    btn.textContent = s.mode !== "practice" && s.index >= s.queue.length - 1 ? "See results →" : "Next →";
  }
}

function answer(i) {
  const p = cur();
  if (s.feedback && s.revealed[s.index]) return;
  const first = s.chosen[s.index] == null;
  s.chosen[s.index] = i;
  s.times[s.index] = (s.times[s.index] || 0) + (Date.now() - s.shownAt);
  s.shownAt = Date.now();
  if (first) { countAnswer(); markSeen(p.key); }
  if (!s.feedback) { $("#rsOptions").innerHTML = optionsHtml(p, { selected: i }); updateNav(); return; }
  s.revealed[s.index] = true;
  const ok = i === p.answer;
  if (s.mode === "review") { if (ok) removeMistake(p.key); }
  else if (!ok) addMistake(p);
  $("#rsOptions").innerHTML = optionsHtml(p, { selected: i, reveal: true });
  showFeedback(p, i);
  updateNav(); updateHead();
  if (s.mode === "sprint") setTimeout(() => { if (s && s.mode === "sprint" && s.index === s.queue.indexOf(p)) next(); }, ok ? 450 : 1400);
  else $("#rsNextBtn").focus({ preventScroll: true });
}

function showFeedback(p, i) {
  const ok = i === p.answer;
  const fb = $("#rsFeedback");
  fb.className = "feedback " + (ok ? "ok" : "no");
  fb.innerHTML = `<b>${ok ? "Correct!" : `Not quite — the answer is ${escapeHtml(optionLabel(p, p.answer))}.`}</b>${p.steps ? stepsHtml(p.steps) : escapeHtml(p.explanation)}`;
  fb.hidden = false;
}

function next() {
  if (s.mode === "practice" || s.mode === "sprint") {
    s.queue.push(nextGenerated()); s.index++;
    return render();
  }
  if (s.mode === "test") {
    const sec = section();
    if (s.index < sec.to - 1) { s.index++; return render(); }
    return nextSection();
  }
  if (s.index >= s.queue.length - 1) return finish();
  s.index++; render();
}

function nextSection(timeUp = false) {
  if (s.sec >= s.sections.length - 1) return finish(timeUp);
  s.sec++;
  s.index = section().from;
  s.secStart = Date.now();
  toast(`${timeUp ? "Time's up for that section. " : ""}Next: ${section().name} — ${fmtClock(section().seconds)}`, 4000);
  render();
}

function onTick() {
  if (!s) return;
  const el = $("#rsTimer");
  let left = null;
  if (s.mode === "test") { left = section().seconds - (Date.now() - s.secStart) / 1000; if (left <= 0) return nextSection(true); }
  else if (s.mode === "sprint") { left = s.limit - (Date.now() - s.startAt) / 1000; if (left <= 0) return finish(true); }
  if (left != null) { el.textContent = fmtClock(left); el.classList.toggle("warn", left <= 30); }
  else { el.textContent = fmtClock((Date.now() - s.startAt) / 1000); el.classList.remove("warn"); }
}

// ── Results ──────────────────────────────────────────────────────────────────
function finish(timeUp = false) {
  if (!s) return;
  clearInterval(tick);
  const sess = s; s = null;
  const seconds = Math.round((Date.now() - sess.startAt) / 1000);
  const endless = sess.mode === "practice" || sess.mode === "sprint";
  const items = sess.queue.map((p, i) => ({ p, chosen: sess.chosen[i], ms: sess.times[i] || 0 })).filter((x) => !endless || x.chosen != null);
  const total = items.length, correct = items.filter((x) => x.chosen === x.p.answer).length;
  const answered = items.filter((x) => x.chosen != null).length;
  const byType = {}, byBattery = {}, bySkill = {};
  const add = (o, k, ok) => { (o[k] ||= { c: 0, t: 0 }); o[k].t++; o[k].c += ok; };
  for (const x of items) {
    const ok = x.chosen === x.p.answer ? 1 : 0;
    add(byType, x.p.type, ok);
    if (TYPES[x.p.type]) add(byBattery, TYPES[x.p.type].battery, ok);
    if (x.p.skill) add(bySkill, x.p.skill, ok);
  }
  if (sess.mode === "test") for (const x of items) if (x.chosen != null && x.chosen !== x.p.answer) addMistake(x.p);
  const avg = answered ? items.reduce((a, x) => a + x.ms, 0) / answered / 1000 : 0;
  if (answered > 0) addRound({ mode: sess.kind || sess.mode, level: sess.level, total, answered, correct, seconds, avgSeconds: Math.round(avg * 10) / 10, byType, byBattery, bySkill });

  $("#rsResultTitle").textContent = timeUp && sess.mode === "sprint" ? "Time! Sprint finished" : sess.title ? `${sess.title} — results` : "Results";
  $("#rsScore").textContent = `${correct} / ${total}`;
  $("#rsPct").textContent = total ? `${Math.round((correct / total) * 100)}%` : "—";
  $("#rsTime").textContent = fmtClock(seconds);
  $("#rsAvg").textContent = answered ? `${avg.toFixed(1)}s` : "—";
  $("#rsEssayNext").hidden = sess.kind !== "full";
  const row = (label, o, strong) => `<div class="focus-row">${strong ? `<b>${label}</b>` : `<span class="muted">${label}</span>`}<span>${o.c}/${o.t} · ${pctOf(o)}%</span></div>`;
  $("#rsBreakdown").innerHTML = items.length > 1 ? `<div class="card"><h2>Breakdown</h2>
    ${Object.entries(byBattery).map(([b, o]) => row(BATTERIES[b].name, o, true)).join("")}
    ${Object.entries(byType).map(([t, o]) => row(TYPES[t] ? TYPES[t].name : t, o)).join("")}
    ${Object.entries(bySkill).map(([k, o]) => row(`Reading: ${SKILLS[k]}`, o)).join("")}</div>` : "";
  const wrong = items.filter((x) => x.chosen !== x.p.answer);
  $("#rsWrongList").innerHTML = wrong.length ? `<div class="card"><h2>Review these (${wrong.length})</h2>${wrong.map((x) => `
      <div class="res-q"><span class="tiny muted upper">${escapeHtml(TYPES[x.p.type] ? TYPES[x.p.type].name : "")}${x.chosen == null ? " · skipped" : ""}</span>
      ${x.p.prompt && x.p.prompt.kind === "passage" ? `<details><summary class="tiny">Passage: ${escapeHtml(x.p.prompt.title)}</summary>${passageHtml(x.p.prompt)}</details>` : ""}
      <b>${escapeHtml(x.p.question)}</b>${miniHtml(x.p, x.chosen)}
      ${x.p.steps ? stepsHtml(x.p.steps) : `<span>${escapeHtml(x.p.explanation)}</span>`}</div>`).join("")}
      <p class="tiny muted" style="margin:.6rem 0 0">${sess.mode === "review" ? "Mistakes stay saved until you get them right." : "Missed questions are saved to Mistake review."}</p></div>`
    : answered ? `<div class="card"><b>No mistakes — excellent work!</b></div>` : "";
  $("#rsAgainBtn").hidden = sess.mode === "review" && !state.mistakes.length;
  show("result");
}

// ── Menu ─────────────────────────────────────────────────────────────────────
function renderMenu() {
  $("#mistakeCount").textContent = state.mistakes.length ? `${state.mistakes.length} saved to redo` : "No mistakes saved yet";
  $("#flagCount").textContent = state.flags.length ? `${state.flags.length} flagged` : "Flag hard questions with 🚩";
  $$("#levelSeg [data-level]").forEach((b) => b.setAttribute("aria-checked", String(Number(b.dataset.level) === level())));
  const acc = accuracy();
  $("#sectionCards").innerHTML = Object.entries(BATTERIES).map(([b, info]) => {
    const types = typesIn(b);
    const tot = types.reduce((o, t) => (acc[t] ? { c: o.c + acc[t].c, t: o.t + acc[t].t } : o), { c: 0, t: 0 });
    const miss = state.mistakes.filter((p) => TYPES[p.type] && TYPES[p.type].battery === b).length;
    const pick = types.filter((t) => selected.has(t));
    const n = b === "reading" ? 10 : 10, secs = Math.round(pick.reduce((a, t) => a + TYPES[t].secs, 0) / Math.max(1, pick.length) * n);
    return `<div class="card section-card" data-bat="${b}">
      <div class="row between"><h3><i class="dot" style="background:var(--${info.color})"></i>${info.name}</h3>
        <span class="tiny muted">${tot.t ? `${pctOf(tot)}% · ${tot.t} answered` : "not started"}</span></div>
      <div class="tags">${types.map((t) => `<button type="button" class="tag" data-type="${t}" aria-pressed="${selected.has(t)}" title="${acc[t] ? `${pctOf(acc[t])}% correct` : "not tried yet"}">${TYPES[t].name}${acc[t] && acc[t].t >= 4 ? ` <span class="acc ${pctOf(acc[t]) < 60 ? "low" : ""}">${pctOf(acc[t])}%</span>` : ""}</button>`).join("")}</div>
      <div class="row gap wrap sec-actions">
        <button class="btn small primary" data-act="practice">Practice</button>
        <button class="btn small" data-act="timed">⏱ Timed · ${n} Q · ${Math.round(secs / 60)} min</button>
        <button class="btn small ghost" data-act="mistakes"${miss ? "" : " disabled"}>↺ Mistakes (${miss})</button>
      </div></div>`;
  }).join("");
}
function saveTypes() { try { localStorage.setItem(TYPE_KEY, JSON.stringify([...selected])); } catch { /* ignore */ } }
const selectedIn = (b) => { const t = typesIn(b).filter((x) => selected.has(x)); return t.length ? t : typesIn(b); };

// ── Setup screens ────────────────────────────────────────────────────────────
function setup(title, desc, html, wire) {
  $("#setupTitle").textContent = title; $("#setupDesc").innerHTML = desc; $("#setupBody").innerHTML = html;
  show("setup"); wire();
}
const seg = (id, items, cur) => `<div class="segmented" role="radiogroup" id="${id}" style="grid-template-columns:repeat(${items.length},1fr)">${items.map(([v, l]) => `<button role="radio" data-v="${v}" aria-checked="${String(v) === String(cur)}">${l}</button>`).join("")}</div>`;
function segVal(id, onChange) {
  const el = $(`#${id}`);
  el.addEventListener("click", (e) => { const b = e.target.closest("[data-v]"); if (!b) return; $$("[data-v]", el).forEach((x) => x.setAttribute("aria-checked", String(x === b))); onChange && onChange(b.dataset.v); });
  return () => $("[aria-checked=true]", el).dataset.v;
}

function fullSetup() {
  const total = FULL_MOCK.reduce((a, x) => a + x.minutes, 0);
  setup("Full mock test", `Like test day: ${FULL_MOCK.length} timed sections back to back, no feedback until the end, then a timed essay on a surprise topic. <b>No calculator.</b>`,
    `<ol class="sec-list">${FULL_MOCK.map((x) => `<li><b>${x.name}</b> — ${x.n} questions, ${x.minutes} min</li>`).join("")}<li><b>Essay</b> — surprise prompt, ${state.settings.essayMinutes || 40} min (on paper)</li></ol>
     <h3>Length</h3>${seg("fullLen", [[1, `Full · ${total} min`], [0.5, `Half · ${Math.round(total / 2)} min`], [0.25, `Quick · ${Math.round(total / 4)} min`]], 1)}
     <p class="tiny muted">Tip: do the full version once a week as the exam gets close, in a quiet room, with scratch paper and a pencil.</p>
     <button id="goFull" class="btn primary wide">Begin the mock test</button>`,
    () => { const len = segVal("fullLen"); $("#goFull").addEventListener("click", () => startTest("full", makeSections("full", { scale: Number(len()) }, level()), "Full mock test")); });
}
function cogatSetup() {
  const real = COGAT.reduce((a, x) => a + x.n, 0);
  setup("CogAT-style test", `Nine subtests in the CogAT format, 10 minutes each at full length (${real} questions, 90 minutes). Choose a shorter version to practise in less time.`,
    `<h3>Batteries</h3><div class="tags" id="cgBat">${["verbal", "quant", "nonverbal"].map((b) => `<button type="button" class="tag" data-b="${b}" aria-pressed="true">${BATTERIES[b].short}</button>`).join("")}</div>
     <h3 style="margin-top:1rem">Length</h3>${seg("cgLen", [[1, "Real · 90 min"], [0.5, "Half · 45 min"], [0.25, "Quarter · 23 min"]], 0.5)}
     <p class="tiny muted" id="cgSum"></p><button id="goCg" class="btn primary wide">Begin</button>`,
    () => {
      const bats = new Set(["verbal", "quant", "nonverbal"]);
      const len = segVal("cgLen", () => sum());
      const sum = () => { const subs = COGAT.filter((x) => bats.has(TYPES[x.type].battery)); const sc = Number(len()); $("#cgSum").textContent = `${subs.length} subtests · ${subs.reduce((a, x) => a + Math.max(3, Math.round(x.n * sc)), 0)} questions · about ${Math.round(subs.length * 10 * sc)} minutes`; $("#goCg").disabled = !subs.length; };
      $("#cgBat").addEventListener("click", (e) => { const b = e.target.closest("[data-b]"); if (!b) return; bats.has(b.dataset.b) ? bats.delete(b.dataset.b) : bats.add(b.dataset.b); b.setAttribute("aria-pressed", String(bats.has(b.dataset.b))); sum(); });
      sum();
      $("#goCg").addEventListener("click", () => startTest("cogat", makeSections("cogat", { scale: Number(len()), batteries: [...bats] }, level()), "CogAT-style test"));
    });
}
function typeChooser(id, preset) {
  return `<div id="${id}" class="type-groups">${Object.entries(BATTERIES).map(([b, info]) => `<div><h3>${info.name}</h3><div class="tags">${typesIn(b).map((t) => `<button type="button" class="tag" data-t="${t}" aria-pressed="${preset.has(t)}">${TYPES[t].name}</button>`).join("")}</div></div>`).join("")}</div>`;
}
function wireChooser(id, set, onChange) {
  $(`#${id}`).addEventListener("click", (e) => { const b = e.target.closest("[data-t]"); if (!b) return; const t = b.dataset.t; if (set.has(t) && set.size === 1) return; set.has(t) ? set.delete(t) : set.add(t); b.setAttribute("aria-pressed", String(set.has(t))); onChange && onChange(); });
}
function sprintSetup() {
  const set = new Set(selected);
  setup("Speed sprint", "Answer as many as you can before the clock runs out. Feedback flashes after each answer and the next question appears automatically.",
    `<h3>Time</h3>${seg("spLen", [[3, "3 min"], [5, "5 min"], [10, "10 min"]], 5)}<h3 style="margin-top:1rem">Question types</h3>${typeChooser("spTypes", set)}<button id="goSp" class="btn primary wide">Start sprint</button>`,
    () => { const len = segVal("spLen"); wireChooser("spTypes", set); $("#goSp").addEventListener("click", () => startSprint([...set], Number(len()))); });
}
function drillSetup(types, title) {
  const set = new Set(types);
  const paceLabel = { 1.5: "Relaxed (1.5× time)", 1: "Exam pace", 0.75: "Fast (¾ time)" };
  setup(title || "Custom timed drill", "Timed, with no feedback until the end — just like a test section. Skip and come back within the drill.",
    `${types.length > 3 || !title ? `<h3>Question types</h3>${typeChooser("drTypes", set)}` : `<p><b>Topics:</b> ${types.map((t) => TYPES[t].name).join(", ")}</p>`}
     <h3 style="margin-top:1rem">Questions</h3>${seg("drN", [[5, "5"], [10, "10"], [20, "20"], [30, "30"]], 10)}
     <h3 style="margin-top:1rem">Pace</h3>${seg("drPace", [[1.5, paceLabel[1.5]], [1, paceLabel[1]], [0.75, paceLabel[0.75]]], 1)}
     <p class="tiny muted" id="drSum"></p><button id="goDr" class="btn primary wide">Start timed drill</button>`,
    () => {
      const secs = () => Math.round([...set].reduce((a, t) => a + TYPES[t].secs, 0) / set.size * Number(nv()) * Number(pv()));
      const sum = () => { $("#drSum").textContent = `${nv()} questions · ${fmtClock(secs())} on the clock`; };
      const nv = segVal("drN", sum), pv = segVal("drPace", sum);
      if ($("#drTypes")) wireChooser("drTypes", set, sum);
      sum();
      $("#goDr").addEventListener("click", () => startTest("drill", makeSections("drill", { types: [...set], n: Number(nv()), seconds: secs(), name: title || "Timed drill" }, level()), title || "Timed drill"));
    });
}

function renderMistakes() {
  const groups = {};
  for (const p of state.mistakes) { const b = TYPES[p.type] ? TYPES[p.type].battery : "other"; (groups[b] ||= {}); (groups[b][p.type] ||= []).push(p); }
  $("#mistakeList").innerHTML = state.mistakes.length ? `<div class="card"><div class="row between"><b>All mistakes (${state.mistakes.length})</b><button class="btn small primary" data-redo="all">Redo all</button></div></div>` +
    Object.entries(groups).map(([b, types]) => `<div class="card"><h2>${BATTERIES[b] ? BATTERIES[b].name : "Other"}</h2>${Object.entries(types).map(([t, list]) => `
      <div class="focus-row"><span>${TYPES[t] ? TYPES[t].name : t} <span class="muted tiny">· ${list.length}</span></span><button class="btn small" data-redo="${t}">Redo ${list.length}</button></div>`).join("")}
      <div class="row gap" style="margin-top:.5rem"><button class="btn small ghost" data-redo-bat="${b}">Redo all ${BATTERIES[b] ? BATTERIES[b].short : ""}</button></div></div>`).join("")
    : `<div class="empty">No saved mistakes. Every question you miss will appear here.</div>`;
}

function renderLearn() {
  $("#learnList").innerHTML = Object.entries(BATTERIES).map(([b, info]) => `<h2>${info.name}</h2>` +
    typesIn(b).filter((k) => STRATEGIES[k]).map((k) => `
      <details class="card learn-item"><summary>${TYPES[k].name}<button type="button" class="btn small" data-try="${k}">Practice</button></summary>
      <ul>${STRATEGIES[k].steps.map((x) => `<li>${escapeHtml(x)}</li>`).join("")}</ul>
      <div class="eg"><b>Example:</b> ${escapeHtml(STRATEGIES[k].eg)}</div></details>`).join("")).join("");
}

export function start(mode) {
  if (mode === "fullSetup") return fullSetup();
  if (mode === "cogatSetup") return cogatSetup();
  if (mode === "sprintSetup") return sprintSetup();
  if (mode === "customSetup") return drillSetup([...selected]);
  if (mode === "mistakes") { renderMistakes(); return show("mistakes"); }
  if (mode === "flags") return startReview(state.flags, "Flagged questions");
  if (mode === "learn") { renderLearn(); return show("learn"); }
  if (mode === "timed") return drillSetup([...selected]);
  if (mode === "practice") return startPractice([...selected]);
}
export const practiceOnly = (type) => startPractice([type]);
export const isPlaying = () => !!s;

export function initReasoning({ startEssay } = {}) {
  onEssay = startEssay || onEssay;
  try {
    const saved = JSON.parse(localStorage.getItem(TYPE_KEY));
    if (Array.isArray(saved) && saved.length) selected = new Set(saved.filter((t) => TYPES[t]));
    if (!selected.size) selected = new Set(Object.keys(TYPES));
  } catch { /* ignore */ }
  setSeen(seenSet());
  renderMenu();
  $("#levelSeg").addEventListener("click", (e) => { const b = e.target.closest("[data-level]"); if (b) { setSetting("level", Number(b.dataset.level)); renderMenu(); } });
  $$("#rsMenu .mode-grid [data-mode]").forEach((b) => b.addEventListener("click", () => start(b.dataset.mode)));
  $("#sectionCards").addEventListener("click", (e) => {
    const card = e.target.closest(".section-card"); if (!card) return;
    const b = card.dataset.bat;
    const tag = e.target.closest("[data-type]");
    if (tag) {
      const t = tag.dataset.type, inSec = typesIn(b).filter((x) => selected.has(x));
      if (selected.has(t) && inSec.length === 1) return toast("Keep at least one topic selected in each section.");
      selected.has(t) ? selected.delete(t) : selected.add(t);
      saveTypes(); renderMenu(); return;
    }
    const act = e.target.closest("[data-act]");
    if (!act) return;
    if (act.dataset.act === "practice") startPractice(selectedIn(b));
    if (act.dataset.act === "timed") drillSetup(selectedIn(b), `${BATTERIES[b].name} — timed`);
    if (act.dataset.act === "mistakes") startReview(state.mistakes.filter((p) => TYPES[p.type] && TYPES[p.type].battery === b), `${BATTERIES[b].short} mistakes`);
  });
  $("#mistakeList").addEventListener("click", (e) => {
    const r = e.target.closest("[data-redo]"), rb = e.target.closest("[data-redo-bat]");
    if (r) startReview(r.dataset.redo === "all" ? state.mistakes : state.mistakes.filter((p) => p.type === r.dataset.redo), "Mistake review");
    if (rb) startReview(state.mistakes.filter((p) => TYPES[p.type] && TYPES[p.type].battery === rb.dataset.redoBat), "Mistake review");
  });
  $$("[data-back='menu']").forEach((b) => b.addEventListener("click", () => { renderMenu(); show("menu"); }));
  $("#learnList").addEventListener("click", (e) => { const b = e.target.closest("[data-try]"); if (!b) return; e.preventDefault(); startPractice([b.dataset.try]); });
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
    if (!st) return;
    h.innerHTML = `<b>How to solve: ${escapeHtml(TYPES[cur().type].name)}</b><ul>${st.steps.map((x) => `<li>${escapeHtml(x)}</li>`).join("")}</ul>`;
    h.hidden = !h.hidden;
  });
  $("#rsEndBtn").addEventListener("click", () => {
    if ((s.mode === "test" || s.mode === "review") && !confirm("End now? Unanswered questions count as wrong.")) return;
    finish();
  });
  $("#rsAgainBtn").addEventListener("click", () => {
    if (!lastStart) return start("practice");
    if (lastStart.mode === "test") { renderMenu(); show("menu"); return start({ full: "fullSetup", cogat: "cogatSetup", drill: "customSetup" }[lastStart.kind] || "practice"); }
    if (lastStart.mode === "review") return start("mistakes");
    begin({ ...lastStart, queue: undefined, chosen: undefined, sections: undefined });
  });
  $("#rsMenuBtn").addEventListener("click", () => { renderMenu(); show("menu"); });
  $("#rsToEssayBtn").addEventListener("click", () => onEssay());
  window.addEventListener("keydown", (e) => {
    if ($("#rsPlay").hidden || $("#reasoning").hidden || !s || e.target.matches("input, textarea, select") || e.metaKey || e.ctrlKey) return;
    const k = e.key.toLowerCase(), n = cur().options.length;
    if (/^[1-5]$/.test(k) && +k <= n) answer(+k - 1);
    else if (k.length === 1 && "abcde".includes(k) && KEYS.indexOf(k.toUpperCase()) < n) answer(KEYS.indexOf(k.toUpperCase()));
    else if (k === "f") $("#rsFlagBtn").click();
    else if (k === "enter" && !$("#rsNextBtn").hidden && document.activeElement !== $("#rsNextBtn")) next();
  });
  onChange(() => { if (!$("#rsMenu").hidden) renderMenu(); });
  window.addEventListener("viewchange", (e) => { if (e.detail === "reasoning" && !$("#rsMenu").hidden) renderMenu(); });
}
