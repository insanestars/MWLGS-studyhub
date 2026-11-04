import { state, onChange } from "./store.js";
import { TYPES, BATTERIES } from "./puzzles.js";
import { SKILLS } from "./gen/reading.js";
import { $, todayKey, addDays, escapeHtml, fmtDate } from "./util.js";

// ── Streak ───────────────────────────────────────────────────────────────────
// A day counts if you logged an essay or finished any reasoning session.
// The current streak stays alive until the end of today, so it counts back from yesterday if needed.
export function computeStreak(days, today = todayKey()) {
  const set = new Set(days);
  let start = set.has(today) ? today : set.has(addDays(today, -1)) ? addDays(today, -1) : null;
  let current = 0;
  while (start && set.has(start)) { current++; start = addDays(start, -1); }
  let best = 0, run = 0, prev = null;
  for (const d of [...set].sort()) {
    run = prev && addDays(prev, 1) === d ? run + 1 : 1;
    best = Math.max(best, run); prev = d;
  }
  return { current, best, doneToday: set.has(today) };
}

// ── Tooltip ──────────────────────────────────────────────────────────────────
function bindTips(root) {
  const tip = $("#tooltip");
  const showTip = (e) => {
    const t = e.target.closest("[data-tip]");
    if (!t) { if (e.type === "pointerdown") hide(); return; }
    tip.textContent = t.dataset.tip;
    const r = t.getBoundingClientRect();
    tip.style.left = `${Math.min(window.innerWidth - 80, Math.max(80, r.left + r.width / 2))}px`;
    tip.style.top = `${r.top}px`;
    tip.hidden = false;
    root.querySelectorAll(".cross").forEach((c) => c.remove());
    if (t.dataset.cx) {
      const svg = t.ownerSVGElement;
      const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
      line.setAttribute("class", "cross");
      line.setAttribute("x1", t.dataset.cx); line.setAttribute("x2", t.dataset.cx);
      line.setAttribute("y1", t.dataset.top); line.setAttribute("y2", t.dataset.bottom);
      svg.insertBefore(line, svg.firstChild);
    }
  };
  const hide = () => { tip.hidden = true; root.querySelectorAll(".cross").forEach((c) => c.remove()); };
  root.addEventListener("pointerover", showTip);
  root.addEventListener("pointerdown", showTip);
  // Mouse: hide when leaving. Touch: pointerleave fires right after a tap, so keep the tip until the next tap elsewhere.
  root.addEventListener("pointerleave", (e) => e.pointerType === "mouse" && hide());
  document.addEventListener("pointerdown", (e) => !root.contains(e.target) && hide());
  window.addEventListener("scroll", hide, { passive: true });
}

// ── Charts (hand-rolled SVG, sized to their container) ───────────────────────
function lineChart(el, points, { yMax, yFmt, empty }) {
  if (points.length < 1) { el.innerHTML = `<div class="empty">${empty}</div>`; return; }
  const W = Math.max(280, el.clientWidth || 320), H = 200;
  const m = { l: 36, r: 14, t: 14, b: 26 };
  const iw = W - m.l - m.r, ih = H - m.t - m.b;
  const max = yMax || Math.max(...points.map((p) => p.y)) * 1.15 || 1;
  const x = (i) => m.l + (points.length === 1 ? iw / 2 : (i / (points.length - 1)) * iw);
  const y = (v) => m.t + ih - (v / max) * ih;
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((f) => f * max);
  const path = points.map((p, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(p.y).toFixed(1)}`).join("");
  const area = `${path}L${x(points.length - 1).toFixed(1)},${m.t + ih}L${x(0).toFixed(1)},${m.t + ih}Z`;
  const step = points.length > 1 ? iw / (points.length - 1) : iw;
  const showDots = points.length <= 30;
  const lastI = points.length - 1;
  el.innerHTML = `<svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="${escapeHtml(el.dataset.label || "chart")}">
    ${ticks.map((t) => `<line class="grid" x1="${m.l}" x2="${W - m.r}" y1="${y(t)}" y2="${y(t)}"/><text x="${m.l - 6}" y="${y(t) + 4}" text-anchor="end">${yFmt(t)}</text>`).join("")}
    <path class="area" d="${area}"/><path class="line" d="${path}"/>
    ${showDots ? points.map((p, i) => `<circle class="dot" cx="${x(i)}" cy="${y(p.y)}" r="4"/>`).join("") : ""}
    <text x="${m.l}" y="${H - 6}">${escapeHtml(points[0].label)}</text>
    ${lastI ? `<text x="${W - m.r}" y="${H - 6}" text-anchor="end">${escapeHtml(points[lastI].label)}</text>` : ""}
    <text class="val" x="${Math.min(x(lastI), W - m.r)}" y="${y(points[lastI].y) - 10}" text-anchor="${lastI ? "end" : "middle"}">${yFmt(points[lastI].y)}</text>
    ${points.map((p, i) => `<rect class="hit" x="${x(i) - step / 2}" y="${m.t}" width="${step}" height="${ih}" data-cx="${x(i)}" data-top="${m.t}" data-bottom="${m.t + ih}" data-tip="${escapeHtml(p.tip)}"/>`).join("")}
  </svg>`;
}

function barChart(el, rows, { max, fmt, empty, color }) {
  if (!rows.length) { el.innerHTML = `<div class="empty">${empty}</div>`; return; }
  const W = Math.max(280, el.clientWidth || 320), rowH = 34, H = rows.length * rowH + 4;
  const labelW = Math.min(205, W * 0.44), valW = 64, bw = W - labelW - valW, maxCh = Math.floor((labelW - 6) / 6.3);
  const fit = (s) => (s.length > maxCh ? s.slice(0, maxCh - 1) + "…" : s);
  el.innerHTML = `<svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img">
    ${rows.map((r, i) => {
      const yy = i * rowH + 6, w = Math.max(r.value > 0 ? 4 : 0, (r.value / (max || 1)) * bw);
      return `<g data-tip="${escapeHtml(r.tip)}">
        <text class="label" x="0" y="${yy + 15}">${escapeHtml(fit(r.label))}</text>
        <rect x="${labelW}" y="${yy}" width="${bw}" height="20" rx="4" fill="var(--surface-2)"/>
        <rect x="${labelW}" y="${yy}" width="${w}" height="20" rx="4" fill="${r.color || color || "var(--series-1)"}"/>
        <text class="val" x="${W}" y="${yy + 15}" text-anchor="end">${escapeHtml(fmt(r))}</text>
        <rect class="hit" x="0" y="${yy - 4}" width="${W}" height="${rowH - 2}"/>
      </g>`;
    }).join("")}
  </svg>`;
}

// ── Page ─────────────────────────────────────────────────────────────────────
function render() {
  if ($("#progress").hidden) return;
  const { essays, rounds, activeDays } = state;
  const streak = computeStreak(activeDays);
  const TIMED = new Set(["timed", "mock", "drill", "full", "cogat"]);
  const timed = rounds.filter((r) => TIMED.has(r.mode));
  const checked = essays.filter((e) => e.score != null && e.max);
  const avgEssay = checked.length ? checked.reduce((a, e) => a + e.score / e.max, 0) / checked.length * 5 : null;
  const tutored = essays.filter((e) => e.feedback);
  const avgTutor = tutored.length ? tutored.reduce((a, e) => a + e.feedback.total / e.feedback.max, 0) / tutored.length * 20 : null;
  const recent = timed.slice(-5);
  const recentPct = recent.length ? Math.round(recent.reduce((a, r) => a + r.correct / r.total, 0) / recent.length * 100) : null;
  const totalQ = rounds.reduce((a, r) => a + (r.answered ?? r.total), 0);
  const mocks = rounds.filter((r) => r.mode === "mock" || r.mode === "full" || r.mode === "cogat");
  const bestMock = mocks.length ? Math.max(...mocks.map((r) => Math.round((r.correct / r.total) * 100))) : null;
  const mastered = Object.values(state.vocab || {}).filter((v) => v.box >= 4).length;

  $("#statTiles").innerHTML = [
    ["Daily streak", `🔥 ${streak.current}`, streak.doneToday ? `Done today · best ${streak.best}` : streak.current ? `Practise today to keep it! · best ${streak.best}` : `Best ${streak.best}`],
    ["Reasoning", recentPct == null ? "—" : `${recentPct}%`, `last ${recent.length || 0} timed rounds · ${totalQ} questions total`],
    ["Best mock test", bestMock == null ? "—" : `${bestMock}%`, `${mocks.length} mock test${mocks.length === 1 ? "" : "s"} taken`],
    ["Essays written", essays.length, `${essays.filter((e) => e.type === "narrative").length} narrative · ${essays.filter((e) => e.type === "argumentative").length} argumentative`],
    ["Avg checklist", avgEssay == null ? "—" : `${avgEssay.toFixed(1)}/5`, `self-check · ${checked.length} essays`],
    ["Avg tutor score", avgTutor == null ? "—" : `${avgTutor.toFixed(1)}/20`, `${tutored.length} essay${tutored.length === 1 ? "" : "s"} reviewed`],
    ["Vocabulary", mastered, "words mastered"]
  ].map(([k, v, sub]) => `<div class="stat"><span>${k}</span><b>${v}</b><small>${sub}</small></div>`).join("");

  // Heatmap: 12 weeks, columns = weeks starting Monday.
  const today = todayKey();
  const dow = (new Date().getDay() + 6) % 7; // Mon=0
  const start = addDays(today, -(7 * 11 + dow));
  const set = new Set(activeDays);
  const cells = [];
  for (let i = 0; i < 7 * 12; i++) {
    const d = addDays(start, i);
    if (d > today) { cells.push(`<i style="visibility:hidden"></i>`); continue; }
    cells.push(`<i class="${set.has(d) ? "on" : ""} ${d === today ? "today" : ""}" data-tip="${fmtDate(d + "T12:00:00")}${set.has(d) ? " — practised ✓" : ""}"></i>`);
  }
  $("#heatmap").innerHTML = cells.join("");

  const last = timed.slice(-30);
  const pts = (fn) => last.map((r) => ({ label: new Date(r.date).toLocaleDateString(undefined, { day: "numeric", month: "short" }), ...fn(r) }));
  lineChart($("#chartScore"), pts((r) => ({ y: (r.correct / r.total) * 100, tip: `${fmtDate(r.date)}: ${r.correct}/${r.total} (${Math.round(r.correct / r.total * 100)}%)` })),
    { yMax: 100, yFmt: (v) => `${Math.round(v)}%`, empty: "Finish a timed drill or mock test to see your score trend." });
  lineChart($("#chartSpeed"), pts((r) => ({ y: r.avgSeconds || r.seconds / r.total, tip: `${fmtDate(r.date)}: ${(r.avgSeconds || r.seconds / r.total).toFixed(1)}s per question` })),
    { yFmt: (v) => `${Math.round(v)}s`, empty: "Finish a timed round to see your speed. Lower is faster." });

  const essayRows = ["narrative", "argumentative"].map((t, i) => {
    const list = essays.filter((e) => e.type === t);
    const sc = list.filter((e) => e.score != null);
    const avg = sc.length ? sc.reduce((a, e) => a + (e.score / e.max) * 5, 0) / sc.length : null;
    return { label: t === "narrative" ? "Narrative" : "Argumentative", value: list.length, avg, n: list.length,
      color: i ? "var(--series-2)" : "var(--series-1)",
      tip: list.length ? `${list.length} essay${list.length > 1 ? "s" : ""}${avg != null ? ` · avg checklist ${avg.toFixed(1)}/5` : ""}` : "None yet" };
  });
  barChart($("#chartEssays"), essays.length ? essayRows : [], {
    max: Math.max(...essayRows.map((r) => r.value)), fmt: (r) => (r.n ? `${r.n}${r.avg != null ? ` · ${r.avg.toFixed(1)}/5` : ""}` : "0"),
    empty: "Log an essay to see this."
  });

  const agg = {}, bat = {};
  for (const r of rounds) {
    for (const [t, v] of Object.entries(r.byType || {})) { agg[t] = agg[t] || { c: 0, t: 0 }; agg[t].c += v.c; agg[t].t += v.t; }
    for (const [t, v] of Object.entries(r.byType || {})) {
      const b = TYPES[t] && TYPES[t].battery; if (!b) continue;
      bat[b] = bat[b] || { c: 0, t: 0 }; bat[b].c += v.c; bat[b].t += v.t;
    }
  }
  const batRows = Object.entries(BATTERIES).filter(([b]) => bat[b]).map(([b, info]) => ({
    label: info.name, value: (bat[b].c / bat[b].t) * 100, color: `var(--${info.color})`, tip: `${bat[b].c} of ${bat[b].t} correct`
  }));
  barChart($("#chartBatteries"), batRows, { max: 100, fmt: (r) => `${Math.round(r.value)}%`, empty: "Answer some questions to see your verbal, quantitative and nonverbal accuracy." });
  const typeRows = Object.keys(TYPES).filter((t) => agg[t] && agg[t].t).map((t) => ({
    label: TYPES[t].name, value: agg[t].c / agg[t].t * 100, color: `var(--${BATTERIES[TYPES[t].battery].color})`, tip: `${agg[t].c} of ${agg[t].t} correct`
  })).sort((a, b) => a.value - b.value);
  barChart($("#chartTypes"), typeRows, { max: 100, fmt: (r) => `${Math.round(r.value)}%`, empty: "Answer some puzzles to see which types need work." });
  // Weakest topics (at least 4 answers) and reading skills.
  const weak = Object.keys(agg).filter((t) => TYPES[t] && agg[t].t >= 4).map((t) => ({ t, p: agg[t].c / agg[t].t })).sort((a, b) => a.p - b.p).slice(0, 5);
  $("#weakTopics").innerHTML = weak.length ? weak.map((w) => `<div class="focus-row"><span><b>${TYPES[w.t].name}</b><br><span class="tiny muted">${BATTERIES[TYPES[w.t].battery].short} · ${Math.round(w.p * 100)}% of ${agg[w.t].t}</span></span><button class="btn small" data-practice="${w.t}">Practice</button></div>`).join("")
    : `<p class="muted">Answer at least 4 questions in a topic to see your weak spots.</p>`;
  const sk = {};
  for (const r of rounds) for (const [k, v] of Object.entries(r.bySkill || {})) { sk[k] = sk[k] || { c: 0, t: 0 }; sk[k].c += v.c; sk[k].t += v.t; }
  barChart($("#chartSkills"), Object.keys(SKILLS).filter((k) => sk[k]).map((k) => ({ label: SKILLS[k], value: (sk[k].c / sk[k].t) * 100, color: "var(--series-4)", tip: `${sk[k].c} of ${sk[k].t} correct` })),
    { max: 100, fmt: (r) => `${Math.round(r.value)}%`, empty: "Answer some reading questions to see main idea, inference, tone and vocab-in-context accuracy." });
  const legend = Object.values(BATTERIES).map((i) => `<span><i style="background:var(--${i.color})"></i>${i.name}</span>`).join("");
  if (typeRows.length) $("#chartTypes").insertAdjacentHTML("beforeend", `<div class="legend">${legend}</div>`);
}

export function initProgress() {
  onChange(render);
  window.addEventListener("viewchange", (e) => e.detail === "progress" && render());
  window.addEventListener("themechange", render);
  let rt; window.addEventListener("resize", () => { clearTimeout(rt); rt = setTimeout(render, 150); });
  bindTips($("#progress"));
}
