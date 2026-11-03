// End-to-end test of the site in a real (headless) browser, in "this device only" mode.
// Run: node tests/ui.test.js   (starts its own static server)
import { createRequire } from "node:module";
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, normalize } from "node:path";
import assert from "node:assert/strict";

const require = createRequire(import.meta.url);
const { chromium, devices } = require("playwright");
const ROOT = new URL("..", import.meta.url).pathname;
const TYPES = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css" };

const server = createServer(async (req, res) => {
  const path = normalize(decodeURIComponent(new URL(req.url, "http://x").pathname)).replace(/^(\.\.[/\\])+/, "");
  try {
    const body = await readFile(join(ROOT, path === "/" ? "index.html" : path));
    res.writeHead(200, { "content-type": TYPES[extname(path)] || "text/html" }); res.end(body);
  } catch { res.writeHead(404); res.end(); }
}).listen(0);
const URL_ = `http://localhost:${server.address().port}/`;

const browser = await chromium.launch();
const errors = [];
let step = 0;
const ok = (msg) => console.log(`✓ ${++step}. ${msg}`);

async function run(name, contextOpts) {
  console.log(`\n── ${name} ──`);
  const ctx = await browser.newContext(contextOpts);
  // Fast-forward time: install a controllable clock.
  await ctx.addInitScript(() => {
    const realNow = Date.now.bind(Date);
    const get = () => +(sessionStorage.getItem("__offset") || 0);
    Date.now = () => realNow() + get();
    window.__advance = (ms) => sessionStorage.setItem("__offset", get() + ms);
  });
  const page = await ctx.newPage();
  page.on("pageerror", (e) => errors.push(`${name}: ${e.message}`));
  page.on("console", (m) => m.type() === "error" && errors.push(`${name}: ${m.text()}`));
  page.on("dialog", (d) => d.accept());
  await page.goto(URL_);

  // App shows (no Firebase config → local mode)
  await page.waitForSelector("#app:not([hidden])");
  ok("app loads in local mode, essay tab visible");

  // ── Essay ──
  await page.click("[data-etype=argumentative]");
  await page.click("#essayStartBtn");
  const cards = await page.$$("#promptCards .prompt-card");
  assert.equal(cards.length, 2);
  const badges = await page.$$eval("#promptCards .badge", (b) => b.map((x) => x.textContent));
  assert.deepEqual(badges, ["Argumentative", "Argumentative"]);
  ok("Start shows 2 argumentative prompts");
  await page.click("[data-etype=surprise]");
  await page.click("#rerollBtn");
  const sb = await page.$$eval("#promptCards .badge", (b) => b.map((x) => x.textContent).sort());
  assert.deepEqual(sb, ["Argumentative", "Narrative"]);
  ok("Surprise me deals one of each type");
  await page.click("[data-etype=narrative]");
  await page.click("#rerollBtn");
  const prompt = await page.textContent("#promptCards .prompt-card span:nth-child(2)");
  await page.click("#promptCards .prompt-card");
  await page.waitForSelector("#essayTimer:not([hidden])");
  assert.equal(await page.textContent("#timerPrompt"), prompt);
  const c1 = await page.textContent("#timerClock");
  assert.ok(c1 === "40:00" || c1 === "39:59", c1);
  ok(`timer starts at ${c1} with chosen prompt`);

  await page.evaluate(() => window.__advance(5 * 60 * 1000 + 500));
  await page.waitForFunction(() => !document.querySelector("#timerAlert").hidden);
  assert.match(await page.textContent("#timerAlert"), /35 minutes left/);
  assert.equal(await page.textContent("#timerPhase"), "Write");
  ok("35-min alert fires: " + (await page.textContent("#timerAlert")));

  await page.click("#pauseBtn");
  const paused = await page.textContent("#timerClock");
  await page.evaluate(() => window.__advance(60 * 1000));
  await page.waitForTimeout(400);
  assert.equal(await page.textContent("#timerClock"), paused);
  await page.click("#pauseBtn");
  ok(`pause holds the clock at ${paused}, resume works`);

  await page.click("#soundBtn");
  assert.match(await page.textContent("#soundBtn"), /off/);
  await page.click("#soundBtn");
  ok("sound toggle works");

  await page.click("#fsBtn");
  await page.waitForTimeout(300);
  const fs = await page.evaluate(() => !!document.fullscreenElement || document.querySelector("#essayTimer").classList.contains("focus"));
  assert.ok(fs);
  const box = await page.$eval("#timerClock", (e) => e.getBoundingClientRect().height);
  ok(`full-screen mode on (clock ${Math.round(box)}px tall)`);
  await page.click("#fsBtn");

  await page.evaluate(() => window.__advance(25 * 60 * 1000));
  await page.waitForFunction(() => /10 minutes/.test(document.querySelector("#timerAlert").textContent));
  ok("10-min alert fires");
  await page.evaluate(() => window.__advance(5 * 60 * 1000));
  await page.waitForFunction(() => /5 minutes/.test(document.querySelector("#timerAlert").textContent));
  assert.equal(await page.textContent("#timerPhase"), "Conclude");
  ok("5-min alert fires (start concluding)");

  // Reload mid-essay: timer should survive
  await page.reload();
  await page.waitForSelector("#essayTimer:not([hidden])");
  ok("timer survives a page refresh: " + (await page.textContent("#timerClock")));

  await page.evaluate(() => window.__advance(6 * 60 * 1000));
  await page.waitForSelector("#essayCheck:not([hidden])", { timeout: 6000 });
  const items = await page.$$eval("#checklist .check b", (b) => b.map((x) => x.textContent));
  assert.deepEqual(items, ["Hook", "Clear story", "Sensory detail", "Reflection / lesson", "Strong ending"]);
  ok("time up → narrative self-check checklist appears");
  await page.click("#checklist .check:nth-child(1)");
  await page.click("#checklist .check:nth-child(3)");
  await page.click("#checklist .check:nth-child(4)");
  assert.equal(await page.textContent("#checkScore"), "3 / 5");
  await page.click("#quickTags .tag:has-text('weak ending')");
  await page.fill("#essayNotes", "Good hook but rushed");
  await page.click("#saveEssayBtn");
  await page.waitForSelector("#essaySetup:not([hidden])");
  const entry = await page.textContent("#essayHistory .entry");
  assert.match(entry, /3\/5/); assert.match(entry, /weak ending/); assert.match(entry, /rushed/);
  ok("essay logged with score 3/5, tag and notes");

  // ── Reasoning: timed round ──
  await page.click("a[data-tab=reasoning]");
  await page.click("[data-mode=timed]");
  await page.waitForSelector("#rsPlay:not([hidden])");
  assert.equal(await page.textContent("#rsTimer"), "05:00");
  let correct = 0; const seenTypes = new Set();
  for (let i = 0; i < 10; i++) {
    seenTypes.add(await page.textContent("#rsType"));
    const choice = i % 3 === 0 ? 0 : 1; // answer a mix of options
    await page.click(`#rsOptions .opt >> nth=${choice}`);
    const fb = await page.textContent("#rsFeedback");
    if (fb.startsWith("Correct")) correct++;
    assert.ok(fb.length > 15, "explanation shown");
    assert.equal(await page.$$eval("#rsOptions .opt.right", (x) => x.length), 1);
    await page.click("#rsNextBtn");
  }
  await page.waitForSelector("#rsResult:not([hidden])");
  assert.equal(await page.textContent("#rsScore"), `${correct} / 10`);
  assert.equal(seenTypes.size, 5);
  ok(`timed round: 10 questions across all 5 types, scored ${correct}/10, answer+explanation each time`);

  const shapeSvg = await page.evaluate(async () => {
    const m = await import("./js/shapes.js"); return m.frameSvg({ kind: "arrow", rot: 90, fill: true });
  });
  assert.match(shapeSvg, /<svg/);

  // ── Review mistakes ──
  await page.click("#rsMenuBtn");
  const mc = await page.textContent("#mistakeCount");
  const wrong = 10 - correct;
  if (wrong > 0) {
    assert.match(mc, new RegExp(`^${wrong} saved`));
    await page.click("[data-mode=review]");
    let fixed = 0;
    const n = Math.min(10, wrong);
    for (let i = 0; i < n; i++) {
      await page.click("#rsOptions .opt >> nth=0");
      if ((await page.textContent("#rsFeedback")).startsWith("Correct")) fixed++;
      await page.click("#rsNextBtn");
    }
    await page.waitForSelector("#rsResult:not([hidden])");
    await page.click("#rsMenuBtn");
    const after = wrong - fixed;
    assert.match(await page.textContent("#mistakeCount"), after ? new RegExp(`^${after} saved`) : /No mistakes/);
    ok(`review mode retried ${n} mistakes; ${fixed} correct ones removed, ${after} remain`);
  }

  // ── Untimed practice with focus filter ──
  for (const t of ["Number series", "Letter series", "Word analogies", "Odd one out"]) await page.click(`#typeFilter .tag:has-text("${t}")`);
  await page.click("[data-mode=practice]");
  for (let i = 0; i < 4; i++) {
    assert.equal(await page.textContent("#rsType"), "Shape patterns");
    assert.equal(await page.$$eval("#rsDisplay .frames svg", (x) => x.length), 5);
    assert.equal(await page.$$eval("#rsOptions svg", (x) => x.length), 4);
    await page.keyboard.press("2");
    await page.keyboard.press("Enter");
  }
  await page.click("#rsEndBtn");
  await page.waitForSelector("#rsResult:not([hidden])");
  ok("untimed practice filtered to shape patterns (SVG), keyboard answering works");
  await page.click("#rsMenuBtn");
  for (const t of ["Number series", "Letter series", "Word analogies", "Odd one out"]) await page.click(`#typeFilter .tag:has-text("${t}")`);

  // ── Progress ──
  await page.click("a[data-tab=progress]");
  await page.waitForSelector("#chartScore svg");
  const tiles = await page.textContent("#statTiles");
  assert.match(tiles, /🔥 1/); assert.match(tiles, /Essays written1/); assert.match(tiles, /3\.0\/5/);
  assert.equal(await page.$$eval("#chartSpeed svg", (x) => x.length), 1);
  assert.equal(await page.$$eval("#chartEssays svg", (x) => x.length), 1);
  assert.equal(await page.$$eval("#chartTypes svg g", (x) => x.length), 5);
  assert.equal(await page.$$eval("#heatmap i.on", (x) => x.length), 1);
  assert.equal(await page.textContent("#streakChip b"), "1");
  ok("progress: streak 1, essay stats, score/speed/essay/type charts, activity heatmap");
  if (contextOpts.hasTouch) await page.tap("#chartScore .hit"); else await page.hover("#chartScore .hit");
  assert.ok(!(await page.$eval("#tooltip", (t) => t.hidden)));
  ok("chart hover tooltip works");

  // ── Persistence ──
  await page.reload();
  await page.waitForSelector("#app:not([hidden])");
  await page.click("a[data-tab=progress]");
  assert.match(await page.textContent("#statTiles"), /Essays written1/);
  ok("data persists after reload");

  // ── Dark mode ──
  await page.click("#themeBtn");
  const bg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
  await page.click("#themeBtn");
  const bg2 = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
  assert.notEqual(bg, bg2);
  ok(`dark mode toggle switches theme (${bg} ↔ ${bg2})`);

  // No horizontal scroll
  for (const tab of ["essay", "reasoning", "progress"]) {
    await page.click(`a[data-tab=${tab}]`);
    const over = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    assert.ok(over <= 1, `${tab} overflows by ${over}px`);
  }
  ok("no horizontal overflow on any tab");
  await ctx.close();
}

try {
  await run("Laptop (1280×800)", { viewport: { width: 1280, height: 800 } });
  await run("Phone (iPhone 13)", { ...devices["iPhone 13"] });
} finally {
  await browser.close();
  server.close();
}
const real = errors.filter((e) => !/favicon/.test(e));
assert.deepEqual(real, [], "browser errors:\n" + real.join("\n"));
console.log("\n✓ No JavaScript errors. All UI checks passed.");
