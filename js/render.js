// Renders a puzzle's prompt and options to HTML. SVG strings come from our own generators.
import { escapeHtml } from "./util.js";

const KEYS = ["A", "B", "C", "D", "E"];
const minus = (s) => String(s).replace(/(^|[\s(=])-(?=\d)/g, "$1−");
const t = (s) => escapeHtml(minus(s));

export function promptHtml(p) {
  const d = p.prompt || {};
  switch (d.kind) {
    case "series":
      return `<div class="series">${d.items.map((x) => `<span>${t(x)}</span>`).join("")}<span class="q">?</span></div>`;
    case "analogy":
      return `<div class="analogy-box"><span>${t(d.a)}</span><span class="sep">→</span><span>${t(d.b)}</span><span class="sep">:</span><span>${t(d.c)}</span><span class="sep">→</span><span class="q">?</span></div>`;
    case "sentence":
      return `<p class="sentence">${t(d.text).replace(/____/g, '<span class="blank"></span>')}</p>`;
    case "words":
      return `<div class="wordrow">${d.items.map((w) => `<span>${t(w)}</span>`).join("")}</div>`;
    case "pairs":
      return `<div class="pair-row">${d.pairs.map(({ a, b }) => `<span class="pair">${t(a)} <span class="arr">→</span> ${t(b)}</span>`).join("")}<span class="pair q">${t(d.last)} <span class="arr">→</span> ?</span></div>`;
    case "equation":
      return `<div class="equation">${t(d.text)}</div>`;
    case "matrix":
      return `<div class="mgrid c${d.cols}">${d.cells.map((c) => (c ? `<div>${c}</div>` : `<div class="q">?</div>`)).join("")}</div>`;
    case "sequence":
      return `<div class="frames${d.arrows ? " big" : ""}">${d.cells.map((c, i) => `<div>${c}</div>${d.arrows && i < d.cells.length - 1 ? '<div class="then">→</div>' : ""}`).join("")}${d.arrows ? "" : '<div class="q">?</div>'}</div>`;
    case "figures":
      return `<div class="figrow">${d.cells.map((c) => `<div>${c}</div>`).join("")}</div>`;
    case "scales":
      return `<div class="scales">${d.cells.join("")}</div>`;
    default:
      return "";
  }
}

// Reading passage panel (paragraphs split on blank lines; poems keep their line breaks).
export function passageHtml(d) {
  const poem = /poetry/i.test(d.genre || "");
  const paras = d.text.split(/\n\s*\n/).map((x) => `<p${poem ? ' class="poem"' : ""}>${escapeHtml(x).replace(/\n/g, poem ? "<br>" : " ")}</p>`).join("");
  return `<span class="tiny muted upper">${escapeHtml(d.genre || "")}${d.n ? ` · question ${d.n} of ${d.of}` : ""}</span><h3>${escapeHtml(d.title)}</h3><div class="ptext">${paras}</div>`;
}

// Numbered step-by-step working.
export const stepsHtml = (steps) => `<ol class="steps">${steps.map((x) => `<li>${t(x)}</li>`).join("")}</ol>`;

export function optionsClass(p) {
  if (p.optionKind === "svg") return "options svg";
  return p.options.some((o) => String(o).length > 22) || p.type === "reading" ? "options long" : "options";
}

export function optionsHtml(p, { selected = null, reveal = false } = {}) {
  return p.options.map((o, i) => {
    const cls = ["opt"];
    if (reveal) cls.push(i === p.answer ? "right" : i === selected ? "wrong" : "dim");
    else if (i === selected) cls.push("chosen");
    const body = p.optionKind === "svg" ? o.svg : `<span>${t(o)}</span>`;
    return `<button class="${cls.join(" ")}" data-i="${i}" aria-label="Option ${KEYS[i]}"${reveal ? " disabled" : ""}><span class="k">${KEYS[i]}</span>${body}</button>`;
  }).join("");
}

export const optionLabel = (p, i) => (p.optionKind === "svg" ? `option ${KEYS[i]}` : minus(p.options[i]));
export { KEYS, minus };

// Compact summary for result lists.
export function miniHtml(p, chosen) {
  const opts = p.options.map((o, i) => {
    const cls = i === p.answer ? "right" : i === chosen ? "wrong" : "";
    return `<span class="${cls}">${KEYS[i]}${p.optionKind === "svg" ? o.svg : ` ${t(o)}`}</span>`;
  }).join("");
  return `<div class="figwrap">${promptHtml(p)}</div><div class="mini-opts">${opts}</div>`;
}
