// Tests the scanner + AI tutor flow in a real browser with the real Anthropic SDK,
// against a fake Anthropic API (no key or network needed). Also checks PDF export.
//
// Needs (paths via env):
//   SDK_BUNDLE  – @anthropic-ai/sdk@0.137.0 bundled to one ESM file (esbuild entry: export { default } from "@anthropic-ai/sdk")
//   JSPDF       – jspdf@2.5.1 dist/jspdf.umd.min.js
// Run: SDK_BUNDLE=… JSPDF=… node tests/tutor.test.js
import { createRequire } from "node:module";
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, normalize } from "node:path";
import assert from "node:assert/strict";

const require = createRequire(import.meta.url);
const { chromium } = require("playwright");
const ROOT = new URL("..", import.meta.url).pathname;
const server = createServer(async (req, res) => {
  const path = normalize(decodeURIComponent(new URL(req.url, "http://x").pathname)).replace(/^(\.\.[/\\])+/, "");
  try { const body = await readFile(join(ROOT, path === "/" ? "index.html" : path));
    res.writeHead(200, { "content-type": { ".js": "text/javascript", ".css": "text/css" }[extname(path)] || "text/html" }); res.end(body);
  } catch { res.writeHead(404); res.end(); }
}).listen(0);
const URL_ = `http://localhost:${server.address().port}/`;

const ESSAY = "Schools should ban phones during the school day because they distract students.\n\nFirst, notifications break concentration. For example, many students check their phones constantly.\n\nSome argue phones are needed for emergencies. However, every school office has a phone.\n\nIn conclusion, schools should ban phones.";
const FEEDBACK = {
  summary: "A clear position with a solid counterargument; add more specific evidence.",
  criteria: [
    { name: "Thesis & position", score: 4, comment: "Your thesis is clear." },
    { name: "Reasons & organization", score: 3, comment: "Good order." },
    { name: "Evidence & explanation", score: 2, comment: "Use a statistic." },
    { name: "Counterargument & rebuttal", score: 3, comment: "Nice rebuttal." },
    { name: "Conventions & formal style", score: 3, comment: "Few errors." }
  ],
  strengths: ["Clear thesis in the first sentence."],
  improvements: [{ issue: "Thin evidence", how_to_fix: "Add one statistic per reason." }],
  line_edits: [{ original: "In conclusion, schools should ban phones.", revised: "Ultimately, a phone-free school day protects learning.", why: "Restates the thesis in new words." }],
  vocabulary: [{ instead_of: "distract", try_word: "divert" }],
  revised_excerpt: { original: "First, notifications break concentration.", rewritten: "First, every buzz fractures a student's focus.", what_changed: "Vivid verb." },
  next_focus: "Back every reason with a specific example."
};

// Build a Messages API SSE stream that returns `text`.
function sse(text) {
  const ev = (type, data) => `event: ${type}\ndata: ${JSON.stringify({ type, ...data })}\n\n`;
  const chunks = text.match(/[\s\S]{1,40}/g);
  return ev("message_start", { message: { id: "msg_test", type: "message", role: "assistant", model: "claude-opus-5-5", content: [], stop_reason: null, stop_sequence: null, usage: { input_tokens: 10, output_tokens: 1 } } }) +
    ev("content_block_start", { index: 0, content_block: { type: "text", text: "" } }) +
    chunks.map((c) => ev("content_block_delta", { index: 0, delta: { type: "text_delta", text: c } })).join("") +
    ev("content_block_stop", { index: 0 }) +
    ev("message_delta", { delta: { stop_reason: "end_turn", stop_sequence: null }, usage: { output_tokens: 50 } }) +
    ev("message_stop", {});
}

const browser = await chromium.launch();
const errors = [], requests = [];
let n = 0; const ok = (m) => console.log(`✓ ${++n}. ${m}`);
try {
  const ctx = await browser.newContext({ viewport: { width: 1200, height: 900 }, acceptDownloads: true, serviceWorkers: "block" });
  await ctx.route("https://cdn.jsdelivr.net/npm/@anthropic-ai/sdk@0.137.0/+esm", async (r) => r.fulfill({ contentType: "text/javascript", body: await readFile(process.env.SDK_BUNDLE) }));
  await ctx.route("https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js", async (r) => r.fulfill({ contentType: "text/javascript", body: await readFile(process.env.JSPDF) }));
  await ctx.route("https://api.anthropic.com/**", async (r) => {
    const req = r.request();
    if (req.method() === "OPTIONS") return r.fulfill({ status: 204, headers: { "access-control-allow-origin": "*", "access-control-allow-headers": "*", "access-control-allow-methods": "POST" } });
    const body = JSON.parse(req.postData());
    requests.push({ url: req.url(), headers: req.headers(), body });
    const isTranscribe = body.messages[0].content.some?.((b) => b.type === "image");
    const isFeedback = body.output_config && body.output_config.format;
    const text = isTranscribe ? ESSAY : isFeedback ? JSON.stringify(FEEDBACK) : "Try opening with a surprising statistic, like: “The average teen checks their phone 96 times a day.”";
    r.fulfill({ status: 200, headers: { "content-type": "text/event-stream", "access-control-allow-origin": "*" }, body: sse(text) });
  });
  const page = await ctx.newPage();
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("dialog", (d) => d.accept());
  await page.goto(URL_ + "#essay");
  await page.waitForSelector("#app:not([hidden])");

  // Add an API key in settings
  await page.click("#accountBtn");
  await page.fill("#setApiKey", "sk-ant-test-key-123");
  await page.click("#saveKeyBtn");
  assert.match(await page.textContent("#keyStatus"), /saved/);
  await page.click("#accountDialog button[value=close]");
  ok("API key saved locally (Settings → AI tutor)");

  // Scan: upload a generated "photo" of a page
  await page.click("#scanOnlyBtn");
  const png = await page.evaluate(() => {
    const c = document.createElement("canvas"); c.width = 800; c.height = 1000;
    const g = c.getContext("2d"); g.fillStyle = "#f3efe6"; g.fillRect(0, 0, 800, 1000); g.fillStyle = "#223"; g.font = "28px serif";
    ["Schools should ban phones", "during the school day…"].forEach((t, i) => g.fillText(t, 60, 100 + i * 50));
    return c.toDataURL("image/png").split(",")[1];
  });
  await page.setInputFiles("#uploadInput", [{ name: "page1.png", mimeType: "image/png", buffer: Buffer.from(png, "base64") }, { name: "page2.png", mimeType: "image/png", buffer: Buffer.from(png, "base64") }]);
  await page.waitForFunction(() => document.querySelectorAll("#pageList .page").length === 2);
  await page.click("#pageList .page:nth-child(1) [data-act=rot]");
  await page.click("#filterSeg [data-filter=bw]");
  await page.click("#pageList .page:nth-child(2) [data-act=left]");
  ok("2 pages uploaded; rotate, B&W filter and reorder work");

  const [download] = await Promise.all([page.waitForEvent("download"), page.click("#pdfBtn")]);
  const pdfPath = await download.path();
  const pdf = await readFile(pdfPath);
  assert.equal(pdf.subarray(0, 5).toString(), "%PDF-");
  assert.equal((pdf.toString("latin1").match(/\/Type \/Page\b/g) || []).length, 2);
  ok(`PDF export: ${download.suggestedFilename()} with 2 pages (${Math.round(pdf.length / 1024)} KB)`);

  // AI transcription
  await page.click("#aiTranscribeBtn");
  await page.waitForFunction(() => document.querySelector("#transcript").value.includes("In conclusion"));
  const t = requests[0];
  assert.equal(t.url, "https://api.anthropic.com/v1/messages?beta=true");
  assert.equal(t.headers["x-api-key"], "sk-ant-test-key-123");
  assert.match(t.headers["anthropic-beta"], /server-side-fallback-2026-07-01/);
  assert.equal(t.headers["anthropic-dangerous-direct-browser-access"], "true");
  assert.equal(t.body.model, "claude-opus-5-5");
  assert.equal(t.body.fallbacks, "default");
  assert.equal(t.body.stream, true);
  assert.equal(t.body.messages[0].content.filter((b) => b.type === "image").length, 2);
  ok("AI transcription: streams the essay into the editor (2 page images, claude-opus-5-5, fallbacks on)");

  // Feedback
  await page.selectOption("#scanType", "argumentative");
  await page.click("#aiFeedbackBtn");
  await page.waitForSelector("#feedbackOut .rubric");
  const f = requests[1];
  assert.equal(f.body.output_config.format.type, "json_schema");
  assert.equal(f.body.output_config.effort, "high");
  assert.match(f.body.system, /Counterargument & rebuttal/);
  const out = await page.textContent("#feedbackOut");
  assert.match(out, /15\/20/); assert.match(out, /Thin evidence/); assert.match(out, /phone-free school day/);
  ok("AI feedback: rubric 15/20, strengths, improvements, line edits, vocabulary, rewrite");

  // Chat
  await page.fill("#chatInput", "How can I make my hook stronger?");
  await page.click("#chatForm button");
  await page.waitForFunction(() => /96 times a day/.test(document.querySelector("#chatLog").textContent));
  assert.equal(requests[2].body.messages.at(-1).content, "How can I make my hook stronger?");
  ok("follow-up chat streams the tutor's reply");

  // Saved to the log automatically after feedback
  await page.click("#scanBackBtn");
  await page.waitForSelector("#essaySetup:not([hidden])");
  const entry = await page.textContent("#essayHistory .entry");
  assert.match(entry, /15\/20/);
  await page.click("#essayHistory .entry summary");
  assert.match(await page.textContent("#essayHistory .entry"), /Transcript/);
  await page.click("#essayHistory [data-scan]");
  assert.match(await page.textContent("#feedbackOut"), /15\/20/);
  ok("essay log keeps the transcript and tutor feedback; reopening shows them");

  // Error handling: bad key
  await ctx.unroute("https://api.anthropic.com/**");
  await ctx.route("https://api.anthropic.com/**", (r) => r.request().method() === "OPTIONS"
    ? r.fulfill({ status: 204, headers: { "access-control-allow-origin": "*", "access-control-allow-headers": "*" } })
    : r.fulfill({ status: 401, headers: { "content-type": "application/json", "access-control-allow-origin": "*" }, body: JSON.stringify({ type: "error", error: { type: "authentication_error", message: "invalid x-api-key" } }) }));
  await page.click("#aiFeedbackBtn");
  await page.waitForFunction(() => /API key was rejected/.test(document.querySelector("#feedbackOut").textContent));
  ok("a rejected API key shows a friendly message");

  // ── Gemini provider ──
  const gReqs = [];
  let first503 = true;
  await ctx.route("https://generativelanguage.googleapis.com/**", async (r) => {
    const req = r.request();
    if (req.method() === "OPTIONS") return r.fulfill({ status: 204, headers: { "access-control-allow-origin": "*", "access-control-allow-headers": "*", "access-control-allow-methods": "POST" } });
    const url = req.url(), body = JSON.parse(req.postData());
    gReqs.push({ url, headers: req.headers(), body });
    const cors = { "access-control-allow-origin": "*" };
    // The first model is "overloaded": the site must fall back to the next model.
    if (first503) { first503 = false; return r.fulfill({ status: 503, headers: { ...cors, "content-type": "application/json" }, body: JSON.stringify({ error: { code: 503, message: "high demand" } }) }); }
    if (url.includes("streamGenerateContent")) {
      const isTr = body.contents[0].parts.some((p) => p.inline_data);
      const text = isTr ? ESSAY : "Start with a surprising fact about phones.";
      const chunks = text.match(/[\s\S]{1,60}/g).map((t) => `data: ${JSON.stringify({ candidates: [{ content: { role: "model", parts: [{ text: t }] } }] })}\n\n`).join("");
      return r.fulfill({ status: 200, headers: { ...cors, "content-type": "text/event-stream" }, body: chunks });
    }
    return r.fulfill({ status: 200, headers: { ...cors, "content-type": "application/json" }, body: JSON.stringify({ candidates: [{ content: { role: "model", parts: [{ text: JSON.stringify(FEEDBACK), thoughtSignature: "x" }] }, finishReason: "STOP" }] }) });
  });
  await page.click("#scanBackBtn");
  await page.click("#accountBtn");
  await page.click("#clearKeyBtn");
  await page.fill("#setGeminiKey", "gemini-test-key-0123456789abcdef");
  await page.click("#saveGeminiBtn");
  assert.match(await page.textContent("#geminiStatus"), /saved/);
  await page.click("#accountDialog button[value=close]");
  await page.click("#scanOnlyBtn");
  assert.match(await page.textContent("#aiTranscribeBtn"), /Gemini/);
  await page.setInputFiles("#uploadInput", [{ name: "page1.png", mimeType: "image/png", buffer: Buffer.from(png, "base64") }]);
  await page.waitForFunction(() => document.querySelectorAll("#pageList .page").length === 1);
  await page.click("#aiTranscribeBtn");
  await page.waitForFunction(() => document.querySelector("#transcript").value.includes("In conclusion"));
  const g0 = gReqs[0], g1 = gReqs[1];
  assert.match(g0.url, /gemini-flash-latest:streamGenerateContent\?alt=sse/);
  assert.match(g1.url, /gemini-3\.5-flash:streamGenerateContent/);
  assert.equal(g1.headers["x-goog-api-key"], "gemini-test-key-0123456789abcdef");
  assert.ok(g1.body.contents[0].parts.some((p) => p.inline_data && p.inline_data.mime_type === "image/jpeg"));
  assert.match(g1.body.systemInstruction.parts[0].text, /transcribe/i);
  ok("Gemini transcription streams in; falls back from an overloaded model to the next one");
  await page.selectOption("#scanType", "argumentative");
  await page.click("#aiFeedbackBtn");
  await page.waitForSelector("#feedbackOut .rubric");
  const gf = gReqs.find((x) => x.url.includes(":generateContent"));
  assert.equal(gf.body.generationConfig.responseMimeType, "application/json");
  assert.equal(gf.body.generationConfig.responseSchema.type, "OBJECT");
  assert.ok(gf.body.generationConfig.responseSchema.properties.criteria.items.properties.score.type === "INTEGER");
  assert.match(await page.textContent("#feedbackOut"), /15\/20/);
  ok("Gemini feedback uses a JSON response schema and renders the rubric");
  await page.fill("#chatInput", "How do I start?");
  await page.click("#chatForm button");
  await page.waitForFunction(() => /surprising fact/.test(document.querySelector("#chatLog").textContent));
  ok("Gemini follow-up chat works");
} finally {
  await browser.close(); server.close();
}
assert.deepEqual(errors, [], errors.join("\n"));
console.log("\n✓ Scanner, PDF export and AI tutor checks passed with no JavaScript errors.");
