// Essay scanner: capture pages, clean them up like a document scanner, export a PDF,
// transcribe (AI or free OCR), then get feedback (AI tutor or instant quick check).
import { state, addEssay, updateEssay } from "./store.js";
import { $, $$, escapeHtml, toast, todayKey } from "./util.js";
import { analyze } from "./writing.js";
import * as tutor from "./tutor.js";
import { CHECKLISTS } from "./prompts.js";

const JSPDF = "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js";
const PDFJS = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js";
const PDFJS_WORKER = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
const TESSERACT = "https://cdn.jsdelivr.net/npm/tesseract.js@5.1.1/dist/tesseract.min.js";
const MAX_SIDE = 1800;

let pages = []; // { id, img (HTMLImageElement), rot }
let filter = "scan";
let current = null; // { essayId, type, prompt }
let aiFeedback = null;
let chatHistory = [];
let onBack = () => {};

const loaded = {};
function loadScript(src) {
  return (loaded[src] ||= new Promise((res, rej) => {
    const s = document.createElement("script");
    s.src = src; s.onload = res; s.onerror = () => { delete loaded[src]; rej(new Error("Couldn't load " + src.split("/").pop() + " — check your connection.")); };
    document.head.appendChild(s);
  }));
}

// ── Image processing ─────────────────────────────────────────────────────────
function processPage(p, maxSide = MAX_SIDE) {
  const { img, rot } = p;
  const scale = Math.min(1, maxSide / Math.max(img.naturalWidth, img.naturalHeight));
  const w = Math.round(img.naturalWidth * scale), h = Math.round(img.naturalHeight * scale);
  const c = document.createElement("canvas");
  const swap = rot % 180 !== 0;
  c.width = swap ? h : w; c.height = swap ? w : h;
  const ctx = c.getContext("2d", { willReadFrequently: true });
  ctx.translate(c.width / 2, c.height / 2);
  ctx.rotate((rot * Math.PI) / 180);
  ctx.drawImage(img, -w / 2, -h / 2, w, h);
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  if (filter === "color") return c;
  const id = ctx.getImageData(0, 0, c.width, c.height), d = id.data, n = c.width * c.height;
  const g = new Uint8ClampedArray(n);
  const hist = new Uint32Array(256);
  for (let i = 0; i < n; i++) { const v = (d[i * 4] * 0.299 + d[i * 4 + 1] * 0.587 + d[i * 4 + 2] * 0.114) | 0; g[i] = v; hist[v]++; }
  if (filter === "scan") {
    // Stretch contrast between the 2nd and 98th percentiles, then brighten the paper.
    let lo = 0, hi = 255, acc = 0;
    for (let v = 0; v < 256; v++) { acc += hist[v]; if (acc > n * 0.02) { lo = v; break; } }
    acc = 0; for (let v = 255; v >= 0; v--) { acc += hist[v]; if (acc > n * 0.08) { hi = v; break; } }
    const span = Math.max(1, hi - lo);
    for (let i = 0; i < n; i++) { let v = ((g[i] - lo) / span) * 255; v = 255 * Math.pow(Math.max(0, Math.min(1, v / 255)), 1.25); d[i * 4] = d[i * 4 + 1] = d[i * 4 + 2] = v; }
  } else {
    // Adaptive threshold (local mean via integral image) — crisp black ink on white.
    const W = c.width, H = c.height, I = new Float64Array((W + 1) * (H + 1));
    for (let y = 1; y <= H; y++) { let row = 0; for (let x = 1; x <= W; x++) { row += g[(y - 1) * W + x - 1]; I[y * (W + 1) + x] = I[(y - 1) * (W + 1) + x] + row; } }
    const r = Math.max(8, Math.round(Math.min(W, H) / 32));
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const x0 = Math.max(0, x - r), x1 = Math.min(W, x + r + 1), y0 = Math.max(0, y - r), y1 = Math.min(H, y + r + 1);
      const sum = I[y1 * (W + 1) + x1] - I[y0 * (W + 1) + x1] - I[y1 * (W + 1) + x0] + I[y0 * (W + 1) + x0];
      const mean = sum / ((x1 - x0) * (y1 - y0));
      const v = g[y * W + x] < mean - 12 ? 0 : 255;
      const i = (y * W + x) * 4; d[i] = d[i + 1] = d[i + 2] = v;
    }
  }
  ctx.putImageData(id, 0, 0);
  return c;
}
const toJpeg = (canvas, q = 0.85) => canvas.toDataURL("image/jpeg", q);

function addImage(src) {
  return new Promise((res) => {
    const img = new Image();
    img.onload = () => { pages.push({ id: Math.random().toString(36).slice(2), img, rot: 0 }); res(); };
    img.onerror = () => { toast("Couldn't open that image."); res(); };
    img.src = src;
  });
}

async function addFiles(files) {
  $("#scanStatus").textContent = "Loading…";
  for (const f of files) {
    if (f.type === "application/pdf") {
      try {
        await loadScript(PDFJS);
        window.pdfjsLib.GlobalWorkerOptions.workerSrc = PDFJS_WORKER;
        const pdf = await window.pdfjsLib.getDocument({ data: await f.arrayBuffer() }).promise;
        for (let i = 1; i <= Math.min(pdf.numPages, 12); i++) {
          const page = await pdf.getPage(i);
          const vp1 = page.getViewport({ scale: 1 });
          const vp = page.getViewport({ scale: MAX_SIDE / Math.max(vp1.width, vp1.height) });
          const c = document.createElement("canvas"); c.width = vp.width; c.height = vp.height;
          await page.render({ canvasContext: c.getContext("2d"), viewport: vp }).promise;
          await addImage(c.toDataURL("image/jpeg", 0.92));
        }
      } catch (e) { toast(e.message || "Couldn't read that PDF."); }
    } else if (f.type.startsWith("image/") || /\.(heic|jpe?g|png|webp)$/i.test(f.name)) {
      await addImage(URL.createObjectURL(f));
    }
  }
  $("#scanStatus").textContent = "";
  renderPages();
}

function renderPages() {
  $("#pageList").innerHTML = pages.map((p, i) => `
    <div class="page" data-id="${p.id}">
      <span class="num">${i + 1}</span>
      <img alt="Page ${i + 1}" src="${toJpeg(processPage(p, 600), 0.7)}">
      <div class="pbar">
        <button type="button" data-act="left" title="Move earlier" ${i === 0 ? "disabled" : ""}>◀</button>
        <button type="button" data-act="rot" title="Rotate">↻</button>
        <button type="button" data-act="del" title="Remove">🗑</button>
        <button type="button" data-act="right" title="Move later" ${i === pages.length - 1 ? "disabled" : ""}>▶</button>
      </div>
    </div>`).join("") || `<div class="empty">No pages yet.</div>`;
  const has = pages.length > 0;
  $("#pdfBtn").disabled = !has; $("#ocrBtn").disabled = !has; $("#aiTranscribeBtn").disabled = !has;
  step(has ? 2 : 1);
}

async function downloadPdf() {
  try {
    await loadScript(JSPDF);
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ unit: "pt", format: "a4" });
    const PW = doc.internal.pageSize.getWidth(), PH = doc.internal.pageSize.getHeight(), M = 24;
    pages.forEach((p, i) => {
      const c = processPage(p);
      const s = Math.min((PW - 2 * M) / c.width, (PH - 2 * M) / c.height);
      if (i) doc.addPage();
      doc.addImage(toJpeg(c, 0.8), "JPEG", (PW - c.width * s) / 2, (PH - c.height * s) / 2, c.width * s, c.height * s);
    });
    doc.save(`essay-${todayKey()}.pdf`);
  } catch (e) { toast(e.message || "Couldn't make the PDF."); }
}

// ── Transcription ────────────────────────────────────────────────────────────
function progress(pct, label) {
  const el = $("#transcribeProgress");
  el.hidden = pct == null;
  if (pct != null) { el.querySelector("div").style.width = `${Math.round(pct * 100)}%`; el.querySelector("span").textContent = label; }
}
async function ocr() {
  try {
    progress(0, "Loading text reader…");
    await loadScript(TESSERACT);
    const out = [];
    for (let i = 0; i < pages.length; i++) {
      const prev = filter; filter = "bw";
      const canvas = processPage(pages[i]); filter = prev;
      const { data } = await window.Tesseract.recognize(canvas, "eng", {
        logger: (m) => m.status === "recognizing text" && progress((i + m.progress) / pages.length, `Reading page ${i + 1} of ${pages.length}… ${Math.round(m.progress * 100)}%`)
      });
      out.push(data.text.trim());
    }
    setTranscript(out.join("\n\n"));
    toast("Done — the free reader makes mistakes with handwriting, so check the text.");
  } catch (e) { toast(e.message || "Text reader failed."); }
  progress(null);
}
async function aiTranscribe() {
  if (!tutor.hasKey()) return needKey();
  const btn = $("#aiTranscribeBtn"); btn.disabled = true;
  try {
    progress(0.05, "Sending pages to the tutor…");
    const imgs = pages.map((p) => ({ type: "image/jpeg", data: toJpeg(processPage(p, 1600), 0.85).split(",")[1] }));
    let got = "";
    const text = await tutor.transcribe(imgs, (d) => { got += d; $("#transcript").value = got; updateWords(); progress(Math.min(0.95, 0.1 + got.length / 3000), "Transcribing…"); });
    setTranscript(text);
    toast("Transcribed ✓ — check it, then ask for feedback.");
  } catch (e) { toast(tutor.friendlyError(e), 7000); }
  btn.disabled = false; progress(null);
}
function setTranscript(t) { $("#transcript").value = t; updateWords(); step(3); }
function updateWords() {
  const n = ($("#transcript").value.match(/[A-Za-z’']+/g) || []).length;
  $("#wordCount").textContent = `${n} word${n === 1 ? "" : "s"}${n ? ` · about ${Math.round(n / 40)} words per minute over 40 min` : ""}`;
}
function needKey() {
  toast("Add your Anthropic API key in Settings to use the AI tutor. Opening settings…", 5000);
  setTimeout(() => $("#accountBtn").click(), 600);
}

// ── Feedback rendering ───────────────────────────────────────────────────────
const typeOf = () => current.type;
function renderQuick() {
  const text = $("#transcript").value.trim();
  if (text.split(/\s+/).length < 30) return toast("Add your essay text first (at least a few sentences).");
  const r = analyze(text, typeOf());
  $("#feedbackOut").innerHTML = `<div class="fb-section"><h3>Quick check · ${r.score}/${r.max} checks passed</h3>
    <div class="minis">
      <div class="mini"><span>Words</span><b>${r.stats.words}</b></div>
      <div class="mini"><span>Paragraphs</span><b>${r.stats.paragraphs}</b></div>
      <div class="mini"><span>Avg sentence</span><b>${r.stats.avgSentence} words</b></div>
      <div class="mini"><span>Pace</span><b>${r.stats.wpm} wpm</b></div>
    </div>
    <div class="checks">${r.checks.map((c) => `<div><span class="ic">${c.ok ? "✅" : "⚠️"}</span><span>${escapeHtml(c.msg)}</span></div>`).join("")}</div>
    <p class="tiny muted">The quick check uses simple rules. For detailed, personal feedback, ask the AI tutor.</p></div>`;
}

export function feedbackHtml(f) {
  const bar = (s) => `<div class="meter"><i style="width:${(s / 4) * 100}%"></i></div>`;
  const list = (xs) => `<ul>${xs.map((x) => `<li>${escapeHtml(x)}</li>`).join("")}</ul>`;
  return `<div class="fb-total"><b>${f.total}/${f.max}</b><span class="muted">tutor score · ${new Date(f.date).toLocaleDateString()}</span></div>
    <p>${escapeHtml(f.summary)}</p>
    <div class="rubric">${f.criteria.map((c) => `<div class="crit"><b>${escapeHtml(c.name)}</b>${bar(c.score)}<span class="dots5">${"●".repeat(c.score)}${"○".repeat(4 - c.score)}</span><span class="c-comment">${escapeHtml(c.comment)}</span></div>`).join("")}</div>
    <div class="fb-section"><h3>💪 Strengths</h3>${list(f.strengths)}</div>
    <div class="fb-section"><h3>🎯 Top improvements</h3><ul>${f.improvements.map((x) => `<li><b>${escapeHtml(x.issue)}</b> — ${escapeHtml(x.how_to_fix)}</li>`).join("")}</ul></div>
    ${f.line_edits.length ? `<div class="fb-section"><h3>✏️ Line edits</h3>${f.line_edits.map((x) => `<div class="edit"><del>${escapeHtml(x.original)}</del><br><ins>${escapeHtml(x.revised)}</ins><small>${escapeHtml(x.why)}</small></div>`).join("")}</div>` : ""}
    ${f.vocabulary.length ? `<div class="fb-section"><h3>📚 Vocabulary upgrades</h3><div class="tags">${f.vocabulary.map((v) => `<span class="tag">${escapeHtml(v.instead_of)} → <b>${escapeHtml(v.try_word)}</b></span>`).join("")}</div></div>` : ""}
    <div class="fb-section"><h3>🔁 Stronger version of one passage</h3><div class="edit"><del>${escapeHtml(f.revised_excerpt.original)}</del><br><ins>${escapeHtml(f.revised_excerpt.rewritten)}</ins><small>${escapeHtml(f.revised_excerpt.what_changed)}</small></div></div>
    <div class="notice"><b>Next time, focus on:</b> ${escapeHtml(f.next_focus)}</div>`;
}

async function aiFeedbackRun() {
  if (!tutor.hasKey()) return needKey();
  const text = $("#transcript").value.trim();
  if (text.split(/\s+/).length < 30) return toast("Add your essay text first (at least a few sentences).");
  const btn = $("#aiFeedbackBtn"); btn.disabled = true;
  $("#feedbackOut").innerHTML = `<div class="notice">🎓 The tutor is reading your essay carefully… this usually takes 30–90 seconds.</div>`;
  try {
    aiFeedback = await tutor.feedback({ text, type: typeOf(), prompt: current.prompt });
    $("#feedbackOut").innerHTML = feedbackHtml(aiFeedback);
    $("#tutorChat").hidden = false; chatHistory = []; $("#chatLog").innerHTML = "";
    save(true);
    step(4);
  } catch (e) {
    $("#feedbackOut").innerHTML = `<div class="notice bad">${escapeHtml(tutor.friendlyError(e))}</div>`;
  }
  btn.disabled = false;
}

async function sendChat(e) {
  e.preventDefault();
  const q = $("#chatInput").value.trim();
  if (!q) return;
  $("#chatInput").value = "";
  chatHistory.push({ role: "user", content: q });
  $("#chatLog").insertAdjacentHTML("beforeend", `<div class="msg me">${escapeHtml(q)}</div><div class="msg ai">…</div>`);
  const out = $("#chatLog").lastElementChild;
  let got = "";
  try {
    const reply = await tutor.chat({ text: $("#transcript").value, type: typeOf(), prompt: current.prompt, feedbackSummary: aiFeedback && aiFeedback.summary, history: chatHistory,
      onText: (d) => { got += d; out.textContent = got; } });
    out.textContent = reply;
    chatHistory.push({ role: "assistant", content: reply });
  } catch (err) { out.textContent = tutor.friendlyError(err); chatHistory.pop(); }
}

// ── Save to the essay log ────────────────────────────────────────────────────
function save(silent = false) {
  const transcript = $("#transcript").value.trim();
  if (!transcript && !aiFeedback) { if (!silent) toast("Nothing to save yet."); return; }
  const patch = { transcript, words: (transcript.match(/[A-Za-z’']+/g) || []).length };
  if (aiFeedback) patch.feedback = aiFeedback;
  if (current.essayId && state.essays.some((e) => e.id === current.essayId)) updateEssay(current.essayId, patch);
  else {
    const type = typeOf();
    const e = addEssay({ type, prompt: current.prompt || "(scanned essay)", score: null, max: CHECKLISTS[type].length, checks: [], tags: [], notes: "", ...patch });
    current.essayId = e.id;
  }
  if (!silent) toast("Saved to your essay log ✓");
}

function step(n) {
  $$("#scanSteps li").forEach((li) => { const k = +li.dataset.step; li.classList.toggle("on", k === Math.min(n, 3)); li.classList.toggle("done", k < n); });
}

// ── Open / close ─────────────────────────────────────────────────────────────
export function openScan(essayId, back) {
  onBack = back || (() => {});
  const e = state.essays.find((x) => x.id === essayId);
  current = { essayId: e ? e.id : null, type: e ? e.type : "argumentative", prompt: e ? e.prompt : "" };
  pages = []; aiFeedback = e && e.feedback ? e.feedback : null; chatHistory = [];
  $("#transcript").value = e && e.transcript ? e.transcript : "";
  updateWords();
  $("#feedbackOut").innerHTML = aiFeedback ? feedbackHtml(aiFeedback) : "";
  $("#tutorChat").hidden = !aiFeedback; $("#chatLog").innerHTML = "";
  $("#scanFor").innerHTML = e
    ? `${e.type === "argumentative" ? "Argumentative" : "Narrative"}: ${escapeHtml(e.prompt)}`
    : `<span class="row gap wrap">Essay type:
        <select id="scanType"><option value="argumentative">Argumentative</option><option value="narrative">Narrative</option></select>
        <input id="scanPrompt" class="search" style="flex:1;min-width:200px" placeholder="Prompt (optional)"></span>`;
  if (!e) {
    $("#scanType").addEventListener("change", (ev) => (current.type = ev.target.value));
    $("#scanPrompt").addEventListener("input", (ev) => (current.prompt = ev.target.value));
  }
  const ai = tutor.hasKey();
  $("#aiTranscribeBtn").textContent = ai ? "✨ Transcribe with AI tutor" : "✨ AI transcription (add key in Settings)";
  $("#aiFeedbackBtn").textContent = ai ? "🎓 Ask the AI tutor" : "🎓 AI tutor (add key in Settings)";
  renderPages();
  if (e && e.transcript) step(3);
}

export function initScan() {
  $("#cameraInput").addEventListener("change", (e) => { addFiles([...e.target.files]); e.target.value = ""; });
  $("#uploadInput").addEventListener("change", (e) => { addFiles([...e.target.files]); e.target.value = ""; });
  $("#filterSeg").addEventListener("click", (e) => {
    const b = e.target.closest("[data-filter]"); if (!b) return;
    filter = b.dataset.filter;
    $$("#filterSeg [data-filter]").forEach((x) => x.setAttribute("aria-checked", String(x === b)));
    renderPages();
  });
  $("#pageList").addEventListener("click", (e) => {
    const b = e.target.closest("[data-act]"); if (!b) return;
    const i = pages.findIndex((p) => p.id === b.closest(".page").dataset.id);
    const act = b.dataset.act;
    if (act === "rot") pages[i].rot = (pages[i].rot + 90) % 360;
    if (act === "del") pages.splice(i, 1);
    if (act === "left" && i > 0) [pages[i - 1], pages[i]] = [pages[i], pages[i - 1]];
    if (act === "right" && i < pages.length - 1) [pages[i + 1], pages[i]] = [pages[i], pages[i + 1]];
    renderPages();
  });
  $("#pdfBtn").addEventListener("click", downloadPdf);
  $("#ocrBtn").addEventListener("click", ocr);
  $("#aiTranscribeBtn").addEventListener("click", aiTranscribe);
  $("#transcript").addEventListener("input", () => { updateWords(); if ($("#transcript").value.trim()) step(3); });
  $("#quickCheckBtn").addEventListener("click", renderQuick);
  $("#aiFeedbackBtn").addEventListener("click", aiFeedbackRun);
  $("#saveTranscriptBtn").addEventListener("click", () => save());
  $("#chatForm").addEventListener("submit", sendChat);
  $("#scanBackBtn").addEventListener("click", () => {
    if ($("#transcript").value.trim() && current && !current.essayId && !confirm("Leave without saving this transcript?")) return;
    if (current && current.essayId && $("#transcript").value.trim()) save(true);
    onBack();
  });
}
