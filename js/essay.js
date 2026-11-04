import { CHECKLISTS, QUICK_TAGS, PLANS, ESSAY_CATS } from "./prompts.js";
import { state, addEssay, deleteEssay, onChange, setSetting } from "./store.js";
import { openScan, initScan } from "./scan.js";
import { $, $$, shuffle, sample, escapeHtml, fmtClock, fmtDate, toast, chime, unlockAudio } from "./util.js";

const TIMER_KEY = "studyhub:timer";
const LABEL = { narrative: "Narrative", argumentative: "Argumentative" };
const catLabel = (e) => (e.cat && ESSAY_CATS[e.cat] ? ESSAY_CATS[e.cat].label : LABEL[e.type]);

// Alerts scale with the essay length: stop planning after ~1/8 of the time, then 10 and 5 minutes left.
const totalOf = () => (session && session.total) || 40 * 60;
function alerts() {
  const T = totalOf(), plan = Math.max(120, Math.round(T / 8 / 60) * 60), out = [];
  out.push({ at: T - plan, msg: `${Math.round((T - plan) / 60)} minutes left — stop planning, start writing.`, beeps: 1 });
  if (T >= 20 * 60) out.push({ at: 600, msg: "10 minutes left — make sure you'll reach your last point.", beeps: 2 });
  if (T >= 10 * 60) out.push({ at: 300, msg: "5 minutes left — start your conclusion.", beeps: 3 });
  return out;
}

let chosenType = "personal";
let session = null; // { type, prompt, endAt, remaining, running, fired: [] }
let tickHandle = null;
let wakeLock = null;

const screens = { setup: "#essaySetup", timer: "#essayTimer", check: "#essayCheck", scan: "#essayScan" };
function show(name) {
  for (const [k, sel] of Object.entries(screens)) $(sel).hidden = k !== name;
  if (name === "setup") renderHistory();
  window.scrollTo(0, 0);
}

// ── Prompts ──────────────────────────────────────────────────────────────────
function freshPrompts(cat, n) {
  const used = new Set(state.essays.map((e) => e.prompt));
  const bank = ESSAY_CATS[cat].bank();
  const pool = bank.filter((p) => !used.has(p));
  return sample(pool.length >= n ? pool : bank, n).map((prompt) => ({ cat, type: ESSAY_CATS[cat].kind, prompt }));
}
// Surprise: one narrative-style and one argument-style prompt from random categories.
function surprisePair() {
  const narr = shuffle(["personal", "challenge"])[0], arg = shuffle(["opinion", "current"])[0];
  return shuffle([...freshPrompts(narr, 1), ...freshPrompts(arg, 1)]);
}
function dealPrompts() {
  const pair = chosenType === "surprise" ? surprisePair() : freshPrompts(chosenType, 2);
  $("#promptCards").innerHTML = pair.map((p, i) => `
    <button class="card prompt-card" data-i="${i}">
      <span class="badge ${p.type === "argumentative" ? "arg" : ""}">${ESSAY_CATS[p.cat].label}</span>
      <span>${escapeHtml(p.prompt)}</span>
      <span class="go">Choose this prompt →</span>
    </button>`).join("");
  $$("#promptCards .prompt-card").forEach((b) => b.addEventListener("click", () => {
    unlockAudio();
    startSession(pair[+b.dataset.i]);
  }));
  $("#promptChoice").hidden = false;
  $("#promptChoice").scrollIntoView({ behavior: "smooth", block: "start" });
}

// ── Timer ────────────────────────────────────────────────────────────────────
function save() {
  try { session ? localStorage.setItem(TIMER_KEY, JSON.stringify(session)) : localStorage.removeItem(TIMER_KEY); } catch { /* ignore */ }
}
function remaining() {
  if (!session) return totalOf();
  return session.running ? (session.endAt - Date.now()) / 1000 : session.remaining;
}

function startSession({ type, cat, prompt }, extra = {}) {
  const total = (Number($("#essayMinutes").value) || Number(state.settings.essayMinutes) || 40) * 60;
  let next = extra.next;
  if (next === undefined && $("#backToBack").checked) {
    // Second essay: the other style, from a random category.
    const other = type === "narrative" ? shuffle(["opinion", "current"])[0] : shuffle(["personal", "challenge"])[0];
    next = freshPrompts(other, 1)[0];
  }
  session = { type, cat, prompt, total, remaining: total, running: false, endAt: 0, fired: [], next: next || null, part: extra.part || 1, typed: "" };
  $("#typeAlong").value = "";
  updateTypeCount();
  openTimer();
  toggleRun(); // start straight away
}

// Used by the full mock test: a surprise prompt at the chosen length.
export function startSurpriseEssay() {
  location.hash = "#essay";
  const [p] = surprisePair();
  startSession(p);
  toast(`Essay section: ${Math.round(session.total / 60)} minutes. Write on paper.`, 4000);
}

function updateTypeCount() {
  const txt = $("#typeAlong").value;
  const n = (txt.match(/[A-Za-z’'-]+/g) || []).length;
  $("#typeCount").textContent = `${n} word${n === 1 ? "" : "s"}`;
  const mins = session ? (totalOf() - Math.max(0, remaining())) / 60 : 0;
  $("#typePace").textContent = n && mins > 0.5 ? `${Math.round(n / mins)} words per minute · on pace for about ${Math.round((n / mins) * totalOf() / 60)} words` : "pace appears after a minute";
  if (session) session.typed = txt;
}

function openTimer() {
  $("#timerType").textContent = (session.cat ? ESSAY_CATS[session.cat].label : LABEL[session.type]) + (session.next || session.part > 1 ? ` · essay ${session.part} of 2` : "");
  $("#timerType").className = "badge" + (session.type === "argumentative" ? " arg" : "");
  $("#timerPrompt").textContent = session.prompt;
  $("#timerAlert").hidden = true;
  $("#planPanel").hidden = true;
  $("#planPanel").innerHTML = planHtml(session.type);
  $("#typeAlong").value = session.typed || "";
  updateTypeCount();
  show("timer");
  clearInterval(tickHandle);
  tickHandle = setInterval(tick, 250);
  tick();
}

function toggleRun() {
  if (!session) return;
  unlockAudio();
  if (session.running) {
    session.remaining = remaining();
    session.running = false;
    releaseWake();
  } else {
    session.endAt = Date.now() + session.remaining * 1000;
    session.running = true;
    requestWake();
  }
  save();
  tick();
}

function tick() {
  if (!session) return;
  const left = Math.max(0, remaining());
  const clock = $("#timerClock");
  clock.textContent = fmtClock(left);
  clock.classList.toggle("paused", !session.running && left > 0);
  clock.classList.toggle("warn", left <= 300 && left > 0);
  clock.classList.toggle("end", left <= 0);
  const T = totalOf(), AL = alerts();
  $("#timerBar").style.width = `${((T - left) / T) * 100}%`;
  $("#timerPhase").textContent = left > AL[0].at ? "Plan" : left > Math.min(300, T / 8) ? "Write" : left > 0 ? "Conclude" : "Time!";
  $("#pauseBtn").textContent = session.running ? "Pause" : left === T ? "Start timer" : "Resume";
  if (session.running && Math.round(left) % 15 === 0) updateTypeCount();
  document.title = session.running ? `${fmtClock(left)} · Study Hub` : "Study Hub";

  // Fire only the most recent alert we've crossed (if the tab slept, don't stack them up).
  const due = AL.filter((a) => left <= a.at && !session.fired.includes(a.at));
  if (due.length) {
    due.forEach((a) => session.fired.push(a.at));
    const a = due[due.length - 1];
    alertUser(a.msg, a.beeps);
    save();
  }
  if (left <= 0 && session.running) {
    session.running = false; session.remaining = 0; save();
    releaseWake();
    alertUser("Time's up — pens down!", 3);
    setTimeout(() => { exitFocus(); openCheck(); }, 2500);
  }
}

function alertUser(msg, beeps) {
  const el = $("#timerAlert");
  el.textContent = msg; el.hidden = false;
  el.style.animation = "none"; void el.offsetWidth; el.style.animation = "";
  if (state.settings.sound !== false) chime(beeps);
  if (navigator.vibrate) navigator.vibrate(beeps > 1 ? [200, 120, 200] : 200);
}

async function requestWake() {
  try { if ("wakeLock" in navigator) wakeLock = await navigator.wakeLock.request("screen"); } catch { /* not allowed */ }
}
function releaseWake() { try { wakeLock && wakeLock.release(); } catch { /* ignore */ } wakeLock = null; }
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible" && session && session.running) requestWake();
});

// Full screen: real full-screen where supported (laptops, Android), a CSS "focus mode" otherwise (iPhone).
function inFocus() { return !!document.fullscreenElement || $("#essayTimer").classList.contains("focus"); }
function enterFocus() {
  const el = $("#essayTimer");
  if (el.requestFullscreen && document.fullscreenEnabled) {
    el.requestFullscreen().catch(() => el.classList.add("focus"));
  } else el.classList.add("focus");
  document.body.classList.add("focus-lock");
  syncFsBtn();
}
function exitFocus() {
  if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
  $("#essayTimer").classList.remove("focus");
  document.body.classList.remove("focus-lock");
  syncFsBtn();
}
function syncFsBtn() { $("#fsBtn").textContent = inFocus() ? "✕ Exit full screen" : "⛶ Full screen"; }
document.addEventListener("fullscreenchange", () => {
  if (!document.fullscreenElement) document.body.classList.remove("focus-lock");
  syncFsBtn();
});

function syncSoundBtn() {
  const on = state.settings.sound !== false;
  $("#soundBtn").textContent = on ? "🔔 Sound on" : "🔕 Sound off";
  $("#soundBtn").setAttribute("aria-pressed", String(on));
}

function endTimer() {
  clearInterval(tickHandle);
  releaseWake();
  exitFocus();
  document.title = "Study Hub";
}

function planHtml(type) {
  const P = PLANS[type];
  return `<b>${LABEL[type]} plan (spend about 5 minutes)</b>
    <ol>${P.structure.map(([h, d]) => `<li><b>${escapeHtml(h)}:</b> ${escapeHtml(d)}</li>`).join("")}</ol>
    <b>Tips</b><ul>${P.tips.map((t) => `<li>${escapeHtml(t)}</li>`).join("")}</ul>
    <b>Hook ideas</b><ul>${P.hooks.map((t) => `<li>${escapeHtml(t)}</li>`).join("")}</ul>`;
}

function toolkitHtml() {
  const sec = (type) => `<h3>${LABEL[type]} structure</h3><ol>${PLANS[type].structure.map(([h, d]) => `<li><b>${escapeHtml(h)}:</b> ${escapeHtml(d)}</li>`).join("")}</ol>
    <ul>${PLANS[type].tips.map((t) => `<li>${escapeHtml(t)}</li>`).join("")}</ul>
    <p><b>Hook ideas:</b></p><ul>${PLANS[type].hooks.map((t) => `<li>${escapeHtml(t)}</li>`).join("")}</ul>`;
  return `${sec("argumentative")}<hr>${sec("narrative")}<hr>
    <h3>Transition words</h3><div class="tags">${PLANS.transitions.map((t) => `<span class="tag">${escapeHtml(t)}</span>`).join("")}</div>
    <h3 style="margin-top:1rem">Counterargument phrases</h3><ul><li>Some argue that…; however, this overlooks…</li><li>Admittedly, … Nevertheless, …</li><li>Critics may claim that… Yet the evidence shows…</li></ul>
    <h3>Conclusion moves</h3><ul><li>Restate the thesis in new words (never copy it).</li><li>Zoom out: why does this matter beyond school?</li><li>End with a call to action, a question, or an image from your introduction.</li></ul>
    <h3>Time plan for 40 minutes</h3><ul><li>0–5 min: read the prompt twice, pick a side or a story, outline.</li><li>5–33 min: write — one paragraph roughly every 6 minutes.</li><li>33–38 min: conclusion.</li><li>38–40 min: reread and fix obvious mistakes.</li></ul>`;
}

// ── Self-check ───────────────────────────────────────────────────────────────
function openCheck() {
  if (!session) return;
  endTimer();
  const items = CHECKLISTS[session.type];
  $("#checkPrompt").textContent = `${session.cat ? ESSAY_CATS[session.cat].label : LABEL[session.type]}: ${session.prompt}`;
  $("#checkTitle").textContent = `${LABEL[session.type]} checklist`;
  $("#checklist").innerHTML = items.map((t, i) => {
    const [head, rest] = t.split(" — ");
    return `<label class="check"><input type="checkbox" data-i="${i}"><span><b>${escapeHtml(head)}</b>${rest ? `<br><span class="muted tiny">${escapeHtml(rest)}</span>` : ""}</span></label>`;
  }).join("");
  $("#quickTags").innerHTML = QUICK_TAGS.map((t) => `<button type="button" class="tag" aria-pressed="false">${escapeHtml(t)}</button>`).join("");
  $("#essayNotes").value = "";
  updateScore();
  show("check");
}
function updateScore() {
  const n = $$("#checklist input:checked").length;
  $("#checkScore").textContent = `${n} / ${CHECKLISTS[session.type].length}`;
}

function saveEssay(scanAfter = false) {
  const checks = $$("#checklist input").map((c) => c.checked);
  const tags = $$("#quickTags .tag[aria-pressed='true']").map((t) => t.textContent);
  const used = Math.round((totalOf() - Math.max(0, remaining())) / 60);
  const typed = (session.typed || "").trim();
  const entry = addEssay({
    type: session.type, cat: session.cat || null, prompt: session.prompt,
    score: checks.filter(Boolean).length, max: checks.length, checks,
    tags, notes: $("#essayNotes").value.trim(), minutesUsed: used, timeLimit: Math.round(totalOf() / 60),
    ...(typed ? { transcript: typed, words: (typed.match(/[A-Za-z’'-]+/g) || []).length } : {})
  });
  const nextUp = session.next, part = session.part;
  session = null; save();
  $("#promptChoice").hidden = true;
  if (nextUp && !scanAfter) {
    toast("Saved ✓ Essay 2 of 2 starts now — new prompt!", 4000);
    startSession(nextUp, { next: null, part: part + 1 });
    return;
  }
  if (scanAfter) { openScan(entry.id, () => show("setup")); show("scan"); toast("Saved ✓ Now scan your pages."); return; }
  show("setup");
  toast("Essay saved to your log ✓");
}

// ── History ──────────────────────────────────────────────────────────────────
function renderHistory() {
  const f = $("#historyFilter").value;
  const list = state.essays.filter((e) => f === "all" || e.type === f);
  if (!list.length) {
    $("#essayHistory").innerHTML = `<div class="empty">No essays logged yet. Your first one will appear here.</div>`;
    return;
  }
  $("#essayHistory").innerHTML = list.map((e) => {
    const items = CHECKLISTS[e.type] || [];
    return `<details class="card entry">
      <summary>
        <span class="meta"><span class="badge ${e.type === "argumentative" ? "arg" : ""}">${escapeHtml(catLabel(e))}</span>${fmtDate(e.date)}${e.minutesUsed != null ? ` · ${e.minutesUsed}${e.timeLimit ? `/${e.timeLimit}` : ""} min` : ""}${e.words ? ` · ${e.words} words` : ""}</span>
        <span class="score" title="${e.feedback ? "Tutor score" : "Checklist score"}">${e.score != null ? `${e.score}/${e.max}` : e.feedback ? `${e.feedback.total}/${e.feedback.max}` : "—"}</span>
        <span class="ptext">${escapeHtml(e.prompt)}</span>
      </summary>
      <div class="body">
        ${e.score != null ? `<ul>${items.map((t, i) => `<li class="${e.checks && e.checks[i] ? "" : "no"}">${e.checks && e.checks[i] ? "✓" : "✗"} ${escapeHtml(t.split(" — ")[0])}</li>`).join("")}</ul>` : ""}
        ${e.feedback ? `<p><b>Tutor ${e.feedback.total}/${e.feedback.max}:</b> ${escapeHtml(e.feedback.summary)}</p>` : ""}
        ${e.transcript ? `<details class="tr"><summary class="tiny">Transcript (${e.words || "?"} words)</summary><p style="white-space:pre-wrap">${escapeHtml(e.transcript)}</p></details>` : ""}
        ${e.tags && e.tags.length ? `<div class="tags">${e.tags.map((t) => `<span class="tag" aria-pressed="true">${escapeHtml(t)}</span>`).join("")}</div>` : ""}
        ${e.notes ? `<p>${escapeHtml(e.notes)}</p>` : ""}
        <div class="actions">
          <button class="btn small" data-scan="${e.id}">${e.transcript || e.feedback ? "📝 Transcript & feedback" : "📷 Scan & get feedback"}</button>
          <button class="btn small ghost danger-text" data-del="${e.id}">Delete</button>
        </div>
      </div>
    </details>`;
  }).join("");
}

// ── Wiring ───────────────────────────────────────────────────────────────────
export function initEssay() {
  $$("[data-etype]").forEach((b) => b.addEventListener("click", () => {
    chosenType = b.dataset.etype;
    $$("[data-etype]").forEach((x) => x.setAttribute("aria-checked", String(x === b)));
  }));
  $("#essayStartBtn").addEventListener("click", dealPrompts);
  $("#essayMinutes").value = String(state.settings.essayMinutes || 40);
  $("#essayMinutes").addEventListener("change", (e) => setSetting("essayMinutes", Number(e.target.value)));
  $("#typeAlong").addEventListener("input", updateTypeCount);
  $("#rerollBtn").addEventListener("click", dealPrompts);
  $("#pauseBtn").addEventListener("click", toggleRun);
  $("#fsBtn").addEventListener("click", () => (inFocus() ? exitFocus() : enterFocus()));
  $("#soundBtn").addEventListener("click", () => {
    setSetting("sound", state.settings.sound === false);
    syncSoundBtn();
    if (state.settings.sound) { unlockAudio(); chime(1); }
  });
  $("#finishBtn").addEventListener("click", () => {
    if (remaining() > 0 && !confirm("Finish early and go to the self-check?")) return;
    if (session.running) { session.remaining = remaining(); session.running = false; }
    openCheck();
  });
  $("#quitBtn").addEventListener("click", () => {
    if (!confirm("Quit this essay without logging it?")) return;
    endTimer(); session = null; save(); show("setup");
  });
  $("#checklist").addEventListener("change", updateScore);
  $("#quickTags").addEventListener("click", (e) => {
    const t = e.target.closest(".tag");
    if (t) t.setAttribute("aria-pressed", String(t.getAttribute("aria-pressed") !== "true"));
  });
  $("#saveEssayBtn").addEventListener("click", () => saveEssay(false));
  $("#saveScanBtn").addEventListener("click", () => saveEssay(true));
  $("#planBtn").addEventListener("click", () => { $("#planPanel").hidden = !$("#planPanel").hidden; });
  $("#scanOnlyBtn").addEventListener("click", () => { openScan(null, () => show("setup")); show("scan"); });
  $("#toolkitBtn").addEventListener("click", () => { $("#toolkitBody").innerHTML = toolkitHtml(); $("#toolkitDialog").showModal(); });
  initScan();
  $("#discardEssayBtn").addEventListener("click", () => {
    if (!confirm("Discard this essay without saving?")) return;
    session = null; save(); show("setup");
  });
  $("#historyFilter").addEventListener("change", renderHistory);
  $("#essayHistory").addEventListener("click", (e) => {
    const b = e.target.closest("[data-del]");
    if (b && confirm("Delete this essay from your log?")) deleteEssay(b.dataset.del);
    const sc = e.target.closest("[data-scan]");
    if (sc) { openScan(sc.dataset.scan, () => show("setup")); show("scan"); }
  });
  window.addEventListener("keydown", (e) => {
    if ($("#essayTimer").hidden || e.target.matches("input, textarea, select")) return;
    if (e.key === " ") { e.preventDefault(); toggleRun(); }
    if (e.key.toLowerCase() === "f") inFocus() ? exitFocus() : enterFocus();
  });

  onChange(() => { if (!$("#essaySetup").hidden) renderHistory(); syncSoundBtn(); if (document.activeElement !== $("#essayMinutes")) $("#essayMinutes").value = String(state.settings.essayMinutes || 40); });
  window.addEventListener("viewchange", (e) => e.detail === "essay" && !$("#essaySetup").hidden && renderHistory());

  // Resume a timer that was running before a refresh.
  try {
    const saved = JSON.parse(localStorage.getItem(TIMER_KEY));
    if (saved && saved.prompt) {
      session = saved;
      if (remaining() <= 0) { session.running = false; session.remaining = 0; openCheck(); }
      else { openTimer(); if (session.running) requestWake(); }
    }
  } catch { /* ignore */ }
}
