// Tests Google sign-in + Firestore sync against the local Firebase emulators.
// Needs: `firebase emulators:start --project demo-studyhub` (auth :9099, firestore :8080) and the
// firebase@10.12.2 npm package (for the SDK files, served in place of gstatic).
// Run: FIREBASE_SDK_DIR=path/to/node_modules/firebase node tests/cloud.test.js
import { createRequire } from "node:module";
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, normalize } from "node:path";
import assert from "node:assert/strict";

const require = createRequire(import.meta.url);
const { chromium, devices } = require("playwright");
const ROOT = new URL("..", import.meta.url).pathname;
const SDK = process.env.FIREBASE_SDK_DIR;
const server = createServer(async (req, res) => {
  const path = normalize(decodeURIComponent(new URL(req.url, "http://x").pathname)).replace(/^(\.\.[/\\])+/, "");
  try { const body = await readFile(join(ROOT, path === "/" ? "index.html" : path));
    res.writeHead(200, { "content-type": { ".js": "text/javascript", ".css": "text/css" }[extname(path)] || "text/html" }); res.end(body);
  } catch { res.writeHead(404); res.end(); }
}).listen(0);
const URL_ = `http://localhost:${server.address().port}/`;
const CONFIG = `export const firebaseConfig = { apiKey: "demo-key", authDomain: "demo-studyhub.firebaseapp.com", projectId: "demo-studyhub", appId: "1:1:web:1", emulators: true };`;

// Clear emulator data from earlier runs
await fetch("http://127.0.0.1:8080/emulator/v1/projects/demo-studyhub/databases/(default)/documents", { method: "DELETE" });
await fetch("http://127.0.0.1:9099/emulator/v1/projects/demo-studyhub/accounts", { method: "DELETE" });

const browser = await chromium.launch();
const errors = [];
let n = 0; const ok = (m) => console.log(`✓ ${++n}. ${m}`);

async function device(name, opts) {
  const ctx = await browser.newContext(opts);
  await ctx.route("https://www.gstatic.com/firebasejs/10.12.2/*", async (r) => {
    const file = new URL(r.request().url()).pathname.split("/").pop();
    r.fulfill({ contentType: "text/javascript", body: await readFile(join(SDK, file)) });
  });
  await ctx.route("**/js/firebase-config.js", (r) => r.fulfill({ contentType: "text/javascript", body: CONFIG }));
  const page = await ctx.newPage();
  page.on("pageerror", (e) => errors.push(`${name}: ${e.message}`));
  page.on("console", (m) => process.env.DEBUG && console.log("[console]", m.text()));
  page.on("dialog", (d) => d.accept());
  return { ctx, page };
}

// The real popup loads Google's gapi script from apis.google.com, which the test sandbox can't reach.
// So: click the button (proves it calls Firebase's Google popup), then complete sign-in with a
// Google credential through the same Firebase Auth instance, which the emulator accepts.
async function signIn(page) {
  await page.waitForFunction(() => !document.querySelector("#googleBtn").disabled);
  await page.click("#googleBtn");
  await page.evaluate(async () => {
    const m = await import("https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js");
    const token = JSON.stringify({ sub: "student-123", email: "student@example.com", name: "Test Student", email_verified: true });
    await m.signInWithCredential(m.getAuth(), m.GoogleAuthProvider.credential(token));
  });
  await page.waitForSelector("#app:not([hidden])", { timeout: 15000 });
}

try {
  // ── Device 1: laptop, has some guest progress first ──
  const a = await device("laptop", { viewport: { width: 1280, height: 800 } });
  await a.page.addInitScript(() => {
    if (!localStorage.getItem("seeded")) {
      localStorage.setItem("seeded", "1");
      localStorage.setItem("studyhub:guest", JSON.stringify({ essays: [{ id: "guest1", date: new Date().toISOString(), type: "argumentative", prompt: "Should homework be optional?", score: 4, max: 5, checks: [true, true, true, true, false], tags: [], notes: "from guest mode", minutesUsed: 40 }], rounds: [], mistakes: [], activeDays: [], settings: { sound: true } }));
    }
  });
  await a.page.goto(URL_);
  await a.page.waitForSelector("#login:not([hidden])");
  ok("sign-in screen shown when Firebase is configured");
  await signIn(a.page);
  ok("Google sign-in completes and the app loads the user's cloud data");
  assert.match(await a.page.textContent("#essayHistory"), /from guest mode/);
  ok("progress saved before signing in was copied into the account");

  // Log an essay
  await a.page.click("#essayStartBtn");
  await a.page.click("#promptCards .prompt-card");
  await a.page.click("#finishBtn");
  await a.page.click("#checklist .check:nth-child(1)");
  await a.page.click("#checklist .check:nth-child(2)");
  await a.page.fill("#essayNotes", "synced essay");
  await a.page.click("#saveEssayBtn");
  // Timed round
  await a.page.click("a[data-tab=reasoning]");
  await a.page.click("[data-mode=timed]");
  for (let i = 0; i < 10; i++) { await a.page.click("#rsOptions .opt >> nth=0"); await a.page.click("#rsNextBtn"); }
  await a.page.waitForSelector("#rsResult:not([hidden])");
  const score = await a.page.textContent("#rsScore");
  await a.page.waitForTimeout(1500); // let writes reach the emulator
  ok(`logged an essay and a timed round (${score}) while signed in`);

  // Check the data landed in Firestore under this user's uid only
  const uid = await a.page.evaluate(async () => (await import("./js/store.js")).currentUser().uid);
  const list = async (c) => (await (await fetch(`http://127.0.0.1:8080/v1/projects/demo-studyhub/databases/(default)/documents/users/${uid}/${c}`, { headers: { Authorization: "Bearer owner" } })).json()).documents || [];
  const [essays, rounds, meta] = await Promise.all([list("essays"), list("rounds"), list("meta")]);
  assert.equal(essays.length, 2); assert.equal(rounds.length, 1); assert.equal(meta.length, 1);
  ok(`Firestore has users/${uid.slice(0, 6)}…/ essays=2, rounds=1, meta=1`);

  // ── Device 2: phone, same Google account ──
  const b = await device("phone", { ...devices["iPhone 13"] });
  await b.page.goto(URL_);
  await signIn(b.page);
  const hist = await b.page.textContent("#essayHistory");
  assert.match(hist, /synced essay/); assert.match(hist, /from guest mode/);
  await b.page.click("a[data-tab=progress]");
  await b.page.waitForSelector("#chartScore svg");
  assert.match(await b.page.textContent("#statTiles"), /Essays written2/);
  assert.equal(await b.page.textContent("#streakChip b"), "1");
  ok("phone signed into same account sees both essays, the round, and streak 1");

  // Delete from phone → gone on laptop after reload
  await b.page.click("a[data-tab=essay]");
  await b.page.click("#essayHistory .entry:has-text('synced essay') summary");
  await b.page.click("#essayHistory .entry:has-text('synced essay') [data-del]");
  await b.page.waitForTimeout(1500);
  await a.page.reload();
  await a.page.waitForSelector("#app:not([hidden])");
  await a.page.waitForTimeout(800);
  assert.doesNotMatch(await a.page.textContent("#essayHistory"), /synced essay/);
  ok("deleting on the phone syncs to the laptop");

  // Sign out
  await a.page.click("#accountBtn");
  assert.match(await a.page.textContent("#accountInfo"), /Test Student/);
  await a.page.click("#signOutBtn");
  await a.page.waitForSelector("#login:not([hidden])");
  ok("account sheet shows the user; sign out returns to the sign-in screen");
} finally {
  await browser.close(); server.close();
}
const real = errors.filter((e) => !/favicon/.test(e));
assert.deepEqual(real, [], real.join("\n"));
console.log("\n✓ Cloud sync checks passed with no JavaScript errors.");
