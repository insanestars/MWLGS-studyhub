// Google Gemini provider for the AI tutor (REST API, called from the browser).
// The key is the student's own and is stored only in this browser's localStorage.
const BASE = "https://generativelanguage.googleapis.com/v1beta/models/";
// Tried in order. If a model is retired, overloaded or out of quota, the next one is used.
const MODELS = ["gemini-flash-latest", "gemini-3.5-flash", "gemini-3.8-flash", "gemini-flash-lite-latest"];
const RETRY_NEXT = new Set([404, 429, 500, 502, 503, 504]);
const KEY_STORE = "studyhub:geminiKey";

export const getGeminiKey = () => { try { return localStorage.getItem(KEY_STORE) || ""; } catch { return ""; } };
export const setGeminiKey = (k) => { try { k ? localStorage.setItem(KEY_STORE, k.trim()) : localStorage.removeItem(KEY_STORE); } catch { /* ignore */ } };
export const hasGeminiKey = () => getGeminiKey().length > 20;

export class GeminiError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}

// Convert a JSON Schema (with additionalProperties etc.) to Gemini's OpenAPI-style schema.
export function toGeminiSchema(s) {
  const out = { type: String(s.type).toUpperCase() };
  if (s.properties) {
    out.properties = Object.fromEntries(Object.entries(s.properties).map(([k, v]) => [k, toGeminiSchema(v)]));
    out.required = s.required || Object.keys(s.properties);
    out.propertyOrdering = Object.keys(s.properties);
  }
  if (s.items) out.items = toGeminiSchema(s.items);
  return out;
}

function body({ system, contents, schema }) {
  const b = { contents };
  if (system) b.systemInstruction = { parts: [{ text: system }] };
  if (schema) b.generationConfig = { responseMimeType: "application/json", responseSchema: toGeminiSchema(schema) };
  return b;
}

async function call(path, payload, signalStream) {
  let lastErr;
  for (const model of MODELS) {
    const res = await fetch(`${BASE}${model}:${path}`, {
      method: "POST",
      headers: { "content-type": "application/json", "x-goog-api-key": getGeminiKey() },
      body: JSON.stringify(payload)
    }).catch((e) => { throw new GeminiError(0, "Couldn't reach Gemini. Check your internet connection."); });
    if (res.ok) return signalStream ? res : res.json();
    let msg = res.statusText;
    try { const j = await res.json(); msg = (j.error && j.error.message) || msg; } catch { /* ignore */ }
    lastErr = new GeminiError(res.status, msg);
    if (!RETRY_NEXT.has(res.status)) break; // bad key / bad request: no point trying other models
  }
  throw lastErr;
}

function textFrom(j) {
  if (j.promptFeedback && j.promptFeedback.blockReason) throw new GeminiError(400, "Gemini declined this request.");
  const c = (j.candidates || [])[0];
  if (!c) throw new GeminiError(500, "Gemini returned no answer. Try again.");
  if (c.finishReason === "SAFETY" || c.finishReason === "PROHIBITED_CONTENT") throw new GeminiError(400, "Gemini declined this request.");
  return ((c.content && c.content.parts) || []).filter((p) => !p.thought).map((p) => p.text || "").join("");
}

// Non-streaming request → text.
export async function geminiText({ system, contents, schema }) {
  return textFrom(await call("generateContent", body({ system, contents, schema })));
}

// Streaming request (Server-Sent Events) → calls onText for each chunk; returns full text.
export async function geminiStream({ system, contents }, onText) {
  const res = await call("streamGenerateContent?alt=sse", body({ system, contents }), true);
  const reader = res.body.getReader(), dec = new TextDecoder();
  let buf = "", full = "";
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    buf += dec.decode(value, { stream: true });
    let i;
    while ((i = buf.indexOf("\n")) >= 0) {
      const line = buf.slice(0, i).trim(); buf = buf.slice(i + 1);
      if (!line.startsWith("data:")) continue;
      const t = textFrom(JSON.parse(line.slice(5)));
      if (t) { full += t; if (onText) onText(t); }
    }
  }
  return full;
}

export const imagePart = (p) => ({ inline_data: { mime_type: p.type, data: p.data } });
