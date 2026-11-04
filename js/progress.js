import { state, onChange } from "./store.js";
import { TYPES } from "./puzzles.js";
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
  const labelW = Math.min(150, W * 0.38), valW = 64, bw = W - labelW - valW;
  el.innerHTML = `<svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img">
    ${rows.map((r, i) => {
      const yy = i * rowH + 6, w = Math.max(r.value > 0 ? 4 : 0, (r.value / (max || 1)) * bw);
      return `<g data-tip="${escapeHtml(r.tip)}">
        <text class="label" x="0" y="${yy + 15}">${escapeHtml(r.label)}</text>
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
  const timed = rounds.filter((r) => r.mode === "timed");
  const avgEssay = essays.length ? essays.reduce((a, e) => a + e.score / e.max, 0) / essays.length * 5 : null;
  const recent = timed.slice(-5);
  const recentPct = recent.length ? Math.round(recent.reduce((a, r) => a + r.correct / r.total, 0) / recent.length * 100) : null;
  const totalQ = rounds.reduce((a, r) => a + (r.answered ?? r.total), 0);

  $("#statTiles").innerHTML = [
    ["Daily streak", `🔥 ${streak.current}`, streak.doneToday ? `Done today · best ${streak.best}` : streak.current ? `Practise today to keep it! · best ${streak.best}` : `Best ${streak.best}`],
    ["Essays written", essays.length, `${essays.filter((e) => e.type === "narrative").length} narrative · ${essays.filter((e) => e.type === "argumentative").length} argumentative`],
    ["Avg checklist", avgEssay == null ? "—" : `${avgEssay.toFixed(1)}/5`, "across all essays"],
    ["Reasoning", recentPct == null ? "—" : `${recentPct}%`, `last ${recent.length || 0} timed rounds · ${totalQ} questions total`]
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
    { yMax: 100, yFmt: (v) => `${Math.round(v)}%`, empty: "Finish a timed round to see your score trend." });
  lineChart($("#chartSpeed"), pts((r) => ({ y: r.avgSeconds || r.seconds / r.total, tip: `${fmtDate(r.date)}: ${(r.avgSeconds || r.seconds / r.total).toFixed(1)}s per question` })),
    { yFmt: (v) => `${Math.round(v)}s`, empty: "Finish a timed round to see your speed. Lower is faster." });

  const essayRows = ["narrative", "argumentative"].map((t, i) => {
    const list = essays.filter((e) => e.type === t);
    const avg = list.length ? list.reduce((a, e) => a + e.score, 0) / list.length : 0;
    return { label: t === "narrative" ? "Narrative" : "Argumentative", value: list.length, avg, n: list.length,
      color: i ? "var(--series-2)" : "var(--series-1)",
      tip: list.length ? `${list.length} essay${list.length > 1 ? "s" : ""} · avg ${avg.toFixed(1)}/5` : "None yet" };
  });
  barChart($("#chartEssays"), essays.length ? essayRows : [], {
    max: Math.max(...essayRows.map((r) => r.value)), fmt: (r) => r.n ? `${r.n} · ${r.avg.toFixed(1)}/5` : "0",
    empty: "Log an essay to see this."
  });

  const agg = {};
  for (const r of rounds) for (const [t, v] of Object.entries(r.byType || {})) {
    agg[t] = agg[t] || { c: 0, t: 0 }; agg[t].c += v.c; agg[t].t += v.t;
  }
  const typeRows = Object.keys(TYPES).filter((t) => agg[t] && agg[t].t).map((t) => ({
    label: TYPES[t], value: agg[t].c / agg[t].t * 100, tip: `${agg[t].c} of ${agg[t].t} correct`
  }));
  barChart($("#chartTypes"), typeRows, { max: 100, fmt: (r) => `${Math.round(r.value)}%`, empty: "Answer some puzzles to see which types need work." });
}

export function initProgress() {
  onChange(render);
  window.addEventListener("viewchange", (e) => e.detail === "progress" && render());
  window.addEventListener("themechange", render);
  let rt; window.addEventListener("resize", () => { clearTimeout(rt); rt = setTimeout(render, 150); });
  bindTips($("#progress"));
}
