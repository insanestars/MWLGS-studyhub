// AI tutor: handwriting transcription, rubric feedback and follow-up chat, using Claude
// via the official Anthropic TypeScript/JavaScript SDK in the browser.
//
// The API key is the student's own, stored only in this browser's localStorage.
// (Browser use requires `dangerouslyAllowBrowser: true` — acceptable here because the key
// belongs to the person using the page and never leaves their device except to Anthropic.)

const SDK_URL = "https://cdn.jsdelivr.net/npm/@anthropic-ai/sdk@0.137.0/+esm";
const MODEL = "claude-opus-5-5";
// Server-side fallback: if a request is declined, the API retries it on a fallback model.
const BASE = { model: MODEL, betas: ["server-side-fallback-2026-07-01"], fallbacks: "default" };
const KEY_STORE = "studyhub:anthropicKey";

export const getKey = () => { try { return localStorage.getItem(KEY_STORE) || ""; } catch { return ""; } };
export const setKey = (k) => { try { k ? localStorage.setItem(KEY_STORE, k.trim()) : localStorage.removeItem(KEY_STORE); } catch { /* ignore */ } };
export const hasKey = () => getKey().startsWith("sk-");

let sdk = null;
async function getClient() {
  if (!hasKey()) throw new Error("Add your Anthropic API key in Settings (👤 → AI tutor) to use the AI tutor.");
  sdk = sdk || (await import(SDK_URL)).default;
  return new sdk({ apiKey: getKey(), dangerouslyAllowBrowser: true, maxRetries: 2 });
}

export function friendlyError(e) {
  const A = sdk;
  if (A && e instanceof A.AuthenticationError) return "Your API key was rejected. Check it in Settings.";
  if (A && e instanceof A.PermissionDeniedError) return "This API key doesn't have permission for that model.";
  if (A && e instanceof A.RateLimitError) return "Too many requests right now — wait a minute and try again.";
  if (A && e instanceof A.BadRequestError) return "The request was rejected: " + (e.message || "bad request");
  if (A && e instanceof A.APIConnectionError) return "Couldn't reach the AI service. Check your internet connection.";
  if (A && e instanceof A.APIError) return `AI service error (${e.status}). Try again in a moment.`;
  return e && e.message ? e.message : String(e);
}

const textOf = (msg) => msg.content.filter((b) => b.type === "text").map((b) => b.text).join("");
function checkStop(msg) {
  if (msg.stop_reason === "refusal") throw new Error("The tutor couldn't help with this request.");
}

// ── Transcription ────────────────────────────────────────────────────────────
const TRANSCRIBE_SYSTEM = `You transcribe photos of handwritten student essays.
Copy the essay exactly as the student wrote it — keep their wording, spelling, grammar and punctuation, even when it is wrong, because the transcript will be used to give honest feedback.
Keep paragraph breaks as a blank line between paragraphs. Leave out words the student crossed out. If a word is unreadable, write [illegible].
If the student wrote the prompt or a plan/outline at the top, leave it out and transcribe only the essay itself.
Reply with the essay text only — no title, notes or commentary.`;

// pages: [{ type: "image/jpeg", data: base64 }]
export async function transcribe(pages, onText) {
  const client = await getClient();
  const content = [];
  pages.forEach((p, i) => {
    if (pages.length > 1) content.push({ type: "text", text: `Page ${i + 1} of ${pages.length}:` });
    content.push({ type: "image", source: { type: "base64", media_type: p.type, data: p.data } });
  });
  content.push({ type: "text", text: "Transcribe this essay." });
  const stream = client.beta.messages.stream({
    ...BASE, max_tokens: 16000, output_config: { effort: "low" },
    system: TRANSCRIBE_SYSTEM, messages: [{ role: "user", content }]
  });
  if (onText) stream.on("text", onText);
  const msg = await stream.finalMessage();
  checkStop(msg);
  return textOf(msg).trim();
}

// ── Feedback ─────────────────────────────────────────────────────────────────
export const RUBRICS = {
  narrative: ["Hook & focus", "Story & organization", "Sensory detail & voice", "Reflection & meaning", "Conventions"],
  argumentative: ["Thesis & position", "Reasons & organization", "Evidence & explanation", "Counterargument & rebuttal", "Conventions & formal style"]
};

const str = { type: "string" };
const obj = (props) => ({ type: "object", additionalProperties: false, required: Object.keys(props), properties: props });
const FEEDBACK_SCHEMA = obj({
  summary: str,
  criteria: { type: "array", items: obj({ name: str, score: { type: "integer" }, comment: str }) },
  strengths: { type: "array", items: str },
  improvements: { type: "array", items: obj({ issue: str, how_to_fix: str }) },
  line_edits: { type: "array", items: obj({ original: str, revised: str, why: str }) },
  vocabulary: { type: "array", items: obj({ instead_of: str, try_word: str }) },
  revised_excerpt: obj({ original: str, rewritten: str, what_changed: str }),
  next_focus: str
});

function feedbackSystem(type) {
  return `You are an experienced, encouraging writing tutor helping a student in grade 8–9 prepare for a competitive high school entrance exam.
In the exam they hand-write one ${type === "argumentative" ? "argumentative" : "personal narrative"} essay in 40 minutes, so judge it as a timed first draft, not a polished piece.

Score each of these criteria from 1 to 4 (1 = beginning, 2 = developing, 3 = proficient, 4 = excellent for a strong grade 9–10 timed essay), using exactly these names in this order:
${RUBRICS[type].map((c, i) => `${i + 1}. ${c}`).join("\n")}

Be specific: quote the student's own words when pointing to strengths and problems. Give 2–4 strengths, the 3 most important improvements (each with a concrete fix), 2–4 line edits (an original sentence copied exactly from the essay and an improved version), 2–5 vocabulary upgrades, and one rewritten excerpt (their weakest 1–3 sentences, rewritten to show what a stronger version looks like while keeping their ideas and voice). "next_focus" is one sentence on the single most useful thing to practise before the next essay.
Ignore spelling slips that look like transcription errors. Keep the tone warm and direct, and write for a 14-year-old.`;
}

export async function feedback({ text, type, prompt }) {
  const client = await getClient();
  const stream = client.beta.messages.stream({
    ...BASE, max_tokens: 32000, output_config: { effort: "high", format: { type: "json_schema", schema: FEEDBACK_SCHEMA } },
    system: feedbackSystem(type),
    messages: [{ role: "user", content: `Essay prompt: ${prompt || "(not given)"}\n\nStudent's essay:\n"""\n${text}\n"""` }]
  });
  const msg = await stream.finalMessage();
  checkStop(msg);
  if (msg.stop_reason === "max_tokens") throw new Error("The feedback was cut off. Please try again.");
  const data = JSON.parse(textOf(msg));
  data.criteria = RUBRICS[type].map((name, i) => {
    const c = data.criteria.find((x) => x.name === name) || data.criteria[i] || { score: 2, comment: "" };
    return { name, score: Math.max(1, Math.min(4, Math.round(c.score))), comment: c.comment };
  });
  data.total = data.criteria.reduce((a, c) => a + c.score, 0);
  data.max = data.criteria.length * 4;
  data.date = new Date().toISOString();
  return data;
}

// ── Follow-up chat ───────────────────────────────────────────────────────────
// history: [{ role: "user" | "assistant", content: string }]
export async function chat({ text, type, prompt, feedbackSummary, history, onText }) {
  const client = await getClient();
  const system = `You are a friendly writing tutor for a 14-year-old preparing for a timed ${type} essay on a high school entrance exam. Answer their questions about their essay below. Be concise (under 200 words unless they ask for more), concrete, and quote their writing when useful. Don't rewrite the whole essay for them — show short examples and let them do the writing.

Prompt: ${prompt || "(not given)"}
${feedbackSummary ? `Earlier feedback summary: ${feedbackSummary}\n` : ""}
Their essay:
"""
${text}
"""`;
  const stream = client.beta.messages.stream({ ...BASE, max_tokens: 8000, output_config: { effort: "low" }, system, messages: history });
  if (onText) stream.on("text", onText);
  const msg = await stream.finalMessage();
  checkStop(msg);
  return textOf(msg);
}
