// End-to-end test of the whole site in a real (headless) browser, in "this device only" mode.
// Run: node tests/ui.test.js   (starts its own static server; needs Playwright)
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
const visible = (page, sel) => page.waitForSelector(`${sel}:not([hidden])`);

async function run(name, contextOpts) {
  console.log(`\n── ${name} ──`);
  const ctx = await browser.newContext(contextOpts);
  // Controllable clock that survives reloads.
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
  const tap = (sel) => (contextOpts.hasTouch ? page.tap(sel) : page.click(sel));
  await page.goto(URL_);
  await visible(page, "#app");

  // ── Home & settings ──
  assert.ok(await page.isVisible("#home"));
  assert.match(await page.textContent("#greeting"), /Good (morning|afternoon|evening)/);
  assert.equal(await page.$$eval(".quick", (x) => x.length), 4);
  ok("home dashboard: greeting, goal ring, 4 quick starts, word of the day");
  await page.click("#accountBtn");
  const exam = new Date(Date.now() + 30 * 86400000);
  const examKey = `${exam.getFullYear()}-${String(exam.getMonth() + 1).padStart(2, "0")}-${String(exam.getDate()).padStart(2, "0")}`;
  await page.fill("#setExamDate", examKey);
  await page.dispatchEvent("#setExamDate", "change");
  await page.fill("#setGoal", "20");
  await page.dispatchEvent("#setGoal", "change");
  await page.click("#accountDialog button[value=close]");
  assert.match(await page.textContent("#countdown"), /30 days until your exam/);
  assert.match(await page.textContent("#goalRing"), /of 20/);
  ok("settings: exam-date countdown (30 days) and daily goal (20)");

  // ── Essay ──
  await page.click("a[data-tab=essay]");
  await page.click("[data-etype=argumentative]");
  await page.click("#essayStartBtn");
  const badges = await page.$$eval("#promptCards .badge", (b) => b.map((x) => x.textContent));
  assert.deepEqual(badges, ["Argumentative", "Argumentative"]);
  const promptText = await page.textContent("#promptCards .prompt-card span:nth-child(2)");
  ok(`argumentative prompts are formal: “${promptText.slice(0, 60)}…”`);
  await page.click("[data-etype=surprise]");
  await page.click("#rerollBtn");
  assert.deepEqual((await page.$$eval("#promptCards .badge", (b) => b.map((x) => x.textContent))).sort(), ["Argumentative", "Narrative"]);
  await page.click("[data-etype=narrative]");
  await page.click("#rerollBtn");
  await page.click("#promptCards .prompt-card");
  await visible(page, "#essayTimer");
  ok("surprise deals one of each; narrative prompt starts the 40:00 timer");
  await page.click("#planBtn");
  assert.match(await page.textContent("#planPanel"), /Reflection/);
  await page.click("#planBtn");
  ok("planning guide toggles during the timer");
  await page.evaluate(() => window.__advance(5 * 60 * 1000 + 500));
  await page.waitForFunction(() => /35 minutes left/.test(document.querySelector("#timerAlert").textContent));
  await page.click("#pauseBtn");
  const paused = await page.textContent("#timerClock");
  await page.evaluate(() => window.__advance(60 * 1000));
  await page.waitForTimeout(400);
  assert.equal(await page.textContent("#timerClock"), paused);
  await page.click("#pauseBtn");
  await page.click("#fsBtn");
  await page.waitForTimeout(200);
  assert.ok(await page.evaluate(() => !!document.fullscreenElement || document.querySelector("#essayTimer").classList.contains("focus")));
  await page.click("#fsBtn");
  await page.evaluate(() => window.__advance(25 * 60 * 1000));
  await page.waitForFunction(() => /10 minutes/.test(document.querySelector("#timerAlert").textContent));
  await page.evaluate(() => window.__advance(5 * 60 * 1000));
  await page.waitForFunction(() => /5 minutes/.test(document.querySelector("#timerAlert").textContent));
  await page.reload();
  await visible(page, "#app");
  await page.click("a[data-tab=essay]");
  await visible(page, "#essayTimer");
  await page.evaluate(() => window.__advance(6 * 60 * 1000));
  await visible(page, "#essayCheck");
  ok("35/10/5-min alerts, pause, full screen, survives refresh, time-up → checklist");
  await page.click("#checklist .check:nth-child(1)");
  await page.click("#checklist .check:nth-child(4)");
  await page.click("#quickTags .tag:has-text('weak ending')");
  await page.click("#saveEssayBtn");
  await visible(page, "#essaySetup");
  assert.match(await page.textContent("#essayHistory .entry"), /2\/5/);
  ok("essay saved to the log with score 2/5");

  // Scan screen (no AI key): paste text → quick check → save as a new log entry
  await page.click("#scanOnlyBtn");
  await visible(page, "#essayScan");
  await page.selectOption("#scanType", "argumentative");
  await page.fill("#scanPrompt", "Should homework be optional?");
  const essay = `Homework should be optional for high school students because it causes stress and does not always improve learning.\n\nFirst, homework takes time away from sleep. For example, a survey found that many students sleep less than seven hours. As a result, they learn less in class.\n\nSecond, optional homework lets students choose what helps them. Furthermore, motivated students will still practise.\n\nSome argue that homework teaches discipline. However, discipline can be built through sports and clubs too.\n\nIn conclusion, homework should be optional so that students can rest, choose, and learn.`;
  await page.fill("#transcript", essay);
  await page.dispatchEvent("#transcript", "input");
  assert.match(await page.textContent("#wordCount"), /\d+ words/);
  await page.click("#quickCheckBtn");
  assert.match(await page.textContent("#feedbackOut"), /checks passed/);
  assert.match(await page.textContent("#feedbackOut"), /counterargument/i);
  await page.click("#aiFeedbackBtn");
  await page.waitForFunction(() => document.querySelector("#accountDialog").open); // settings open so you can add a key
  await page.click("#accountDialog button[value=close]");
  ok("scanner: quick check works offline; AI tutor asks for an API key first");
  await page.click("#saveTranscriptBtn");
  await page.click("#scanBackBtn");
  await visible(page, "#essaySetup");
  assert.equal(await page.$$eval("#essayHistory .entry", (x) => x.length), 2);
  assert.match(await page.textContent("#essayHistory"), /Should homework be optional/);
  ok("pasted essay saved to the log with its transcript");
  await page.click("#toolkitBtn");
  assert.match(await page.textContent("#toolkitBody"), /Transition words/);
  await page.click("#toolkitDialog button[value=close]");
  ok("writing toolkit opens");

  // ── Reasoning ──
  await page.click("a[data-tab=reasoning]");
  await page.click("#levelSeg [data-level='3']");
  await page.click("#levelSeg [data-level='2']");
  await page.click("[data-mode=timed]");
  await visible(page, "#rsPlay");
  const seen = new Set();
  let right = 0;
  for (let i = 0; i < 10; i++) {
    seen.add(await page.textContent("#rsType"));
    assert.equal(await page.$$eval("#rsOptions .opt", (x) => x.length), 5);
    if (i === 0) { await page.click("#rsFlagBtn"); }
    await page.click(`#rsOptions .opt >> nth=${i % 5}`);
    const fb = await page.textContent("#rsFeedback");
    if (fb.startsWith("Correct")) right++;
    assert.ok(fb.length > 20);
    await page.click("#rsNextBtn");
  }
  await visible(page, "#rsResult");
  assert.equal(await page.textContent("#rsScore"), `${right} / 10`);
  ok(`timed mix: 10 questions from ${seen.size} types, 5 options each, explanations; scored ${right}/10`);
  await page.click("#rsMenuBtn");
  assert.match(await page.textContent("#flagCount"), /1 flagged/);
  const wrong = 10 - right;
  if (wrong) assert.match(await page.textContent("#mistakeCount"), new RegExp(`^${wrong} saved`));
  await page.click("[data-mode=flags]");
  await visible(page, "#rsPlay");
  await page.click("#rsOptions .opt >> nth=0");
  await page.click("#rsNextBtn");
  await visible(page, "#rsResult");
  await page.click("#rsMenuBtn");
  ok(`flagged question saved & replayed; ${wrong} mistakes saved for review`);

  for (const t of ["Paper folding", "Figure balancing", "Figure matrices"]) {
    await page.click("#typeAllBtn"); // toggles to core set or all
    const ids = await page.$$eval("#typeFilter .tag", (x) => x.map((b) => [b.textContent, b.getAttribute("aria-pressed")]));
    for (const [label, pressed] of ids) if ((label === t) !== (pressed === "true")) await page.click(`#typeFilter .tag:text-is("${label}")`);
    await page.click("[data-mode=practice]");
    await visible(page, "#rsPlay");
    assert.equal(await page.textContent("#rsType"), t);
    assert.equal(await page.$$eval("#rsOptions .opt svg", (x) => x.length), 5);
    assert.ok(await page.$$eval("#rsDisplay svg", (x) => x.length) >= 2);
    await page.click("#rsHelpBtn");
    assert.ok(await page.isVisible("#rsHelp"));
    await page.keyboard.press("3");
    await page.keyboard.press("Enter");
    await page.click("#rsEndBtn");
    await page.click("#rsMenuBtn");
  }
  await page.click("#typeAllBtn");
  if ((await page.$$eval("#typeFilter .tag[aria-pressed=true]", (x) => x.length)) < 14) await page.click("#typeAllBtn");
  ok("nonverbal practice: folding, balance and matrices draw SVG questions with 5 SVG options; keyboard + hints work");

  await page.click("[data-mode=learn]");
  assert.equal(await page.$$eval("#learnList details", (x) => x.length), 14);
  await page.click("[data-back=menu] >> visible=true");
  ok("“How to solve” has strategies for all 14 question types");

  // Mock CogAT, short form: 9 subtests × 4
  await page.click("[data-mode=mock]");
  await page.click("#mockLen [data-len='4']");
  assert.match(await page.textContent("#mockSummary"), /9 subtests · 36 questions/);
  await page.click("#mockStartBtn");
  await visible(page, "#rsPlay");
  assert.match(await page.textContent("#rsProgress"), /Verbal analogies · 1\/4/);
  await page.click("#rsSkipBtn");
  await page.click("#rsPrevBtn");
  await page.click("#rsOptions .opt >> nth=1");
  assert.ok(await page.isHidden("#rsFeedback"));
  for (let i = 0; i < 3; i++) { await page.click("#rsOptions .opt >> nth=0"); await page.click("#rsNextBtn"); }
  await page.click("#rsNextBtn"); // last question of section 1 → next section
  assert.match(await page.textContent("#rsProgress"), /Sentence completion · 1\/4/);
  await page.evaluate(() => window.__advance(10 * 60 * 1000)); // section time runs out
  await page.waitForFunction(() => /Verbal classification/.test(document.querySelector("#rsProgress").textContent));
  ok("mock CogAT: no feedback during the test, skip/back within a section, section timer auto-advances");
  for (let i = 0; i < 40 && await page.isVisible("#rsPlay"); i++) { await page.click("#rsOptions .opt >> nth=2"); await page.click("#rsNextBtn"); }
  await visible(page, "#rsResult");
  assert.match(await page.textContent("#rsScore"), /\/ 36/);
  assert.match(await page.textContent("#rsBreakdown"), /Verbal.*Quantitative.*Nonverbal/s);
  ok(`mock finished: ${await page.textContent("#rsScore")} with battery breakdown and full review`);
  await page.click("#rsMenuBtn");

  // ── Vocab ──
  await page.click("a[data-tab=vocab]");
  await visible(page, "#vCards");
  await tap("#flash");
  await page.click("#vYes");
  await tap("#flash");
  await page.click("#vNo");
  await page.click("[data-vtab=quiz]");
  await page.click("#vQuiz .opt >> nth=0");
  assert.ok(await page.isVisible("#vqFb"));
  await page.click("#vqNext");
  await page.click("[data-vtab=list]");
  await page.fill("#vSearch", "ephemeral");
  assert.equal(await page.$$eval(".vrow", (x) => x.length), 1);
  ok("vocab: flashcards flip & grade, quiz gives feedback, word list search");

  // ── Progress ──
  await page.click("a[data-tab=progress]");
  await page.waitForSelector("#chartScore svg");
  const tiles = await page.textContent("#statTiles");
  assert.match(tiles, /🔥 1/); assert.match(tiles, /Essays written2/); assert.match(tiles, /Best mock CogAT\d+%/);
  assert.equal(await page.$$eval("#chartBatteries svg g", (x) => x.length), 3);
  assert.ok(await page.$$eval("#chartTypes svg g", (x) => x.length) >= 9);
  ok("progress: streak, mock best, essays, battery chart (3 bars), per-type accuracy");
  await tap("#chartScore .hit");
  assert.ok(!(await page.$eval("#tooltip", (t) => t.hidden)));
  ok("chart tooltip works");

  await page.click("a[data-tab=home]");
  await page.waitForFunction(() => /Practice/.test(document.querySelector("#focusBody").textContent));
  assert.ok(Number((await page.textContent("#goalRing text")).trim()) > 40);
  ok("home: focus area lists weakest types; goal ring counts today's answers");

  await page.reload();
  await visible(page, "#app");
  await page.click("a[data-tab=progress]");
  await page.waitForFunction(() => /Essays written2/.test(document.querySelector("#statTiles").textContent));
  ok("data persists after reload");

  await page.click("#themeBtn");
  const bg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
  await page.click("#themeBtn");
  assert.notEqual(bg, await page.evaluate(() => getComputedStyle(document.body).backgroundColor));
  for (const tab of ["home", "essay", "reasoning", "vocab", "progress"]) {
    await page.click(`a[data-tab=${tab}]`);
    await page.waitForFunction((t) => !document.querySelector("#" + t).hidden, tab);
    const over = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    assert.ok(over <= 1, `${tab} overflows by ${over}px`);
  }
  ok("dark mode toggles; no horizontal overflow on any tab");
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
