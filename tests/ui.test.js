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
const MIME = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".webmanifest": "application/manifest+json", ".png": "image/png" };

const server = createServer(async (req, res) => {
  const path = normalize(decodeURIComponent(new URL(req.url, "http://x").pathname)).replace(/^(\.\.[/\\])+/, "");
  try {
    const body = await readFile(join(ROOT, path === "/" ? "index.html" : path));
    res.writeHead(200, { "content-type": MIME[extname(path)] || "text/html" }); res.end(body);
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
  const ctx = await browser.newContext({ ...contextOpts, serviceWorkers: "block" });
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
  const tab = async (t) => { await page.click(`a[data-tab=${t}]`); await page.waitForFunction((t) => !document.querySelector("#" + t).hidden, t); };
  const answerAll = async (pick = 0, max = 300) => { for (let i = 0; i < max && await page.isVisible("#rsPlay"); i++) { await page.click(`#rsOptions .opt >> nth=${pick}`); await page.click("#rsNextBtn"); } };
  await page.goto(URL_);
  await visible(page, "#app");

  // ── Home & settings ──
  assert.match(await page.textContent("#greeting"), /Good (morning|afternoon|evening)/);
  assert.equal(await page.$$eval(".quick", (x) => x.length), 4);
  await page.click("#accountBtn");
  const exam = new Date(Date.now() + 30 * 86400000);
  await page.fill("#setExamDate", `${exam.getFullYear()}-${String(exam.getMonth() + 1).padStart(2, "0")}-${String(exam.getDate()).padStart(2, "0")}`);
  await page.dispatchEvent("#setExamDate", "change");
  await page.fill("#setGoal", "20"); await page.dispatchEvent("#setGoal", "change");
  await page.click("#accountDialog button[value=close]");
  assert.match(await page.textContent("#countdown"), /30 days until your exam/);
  ok("home: greeting, quick starts, exam countdown, daily goal");

  // ── Essay ──
  await tab("essay");
  for (const [cat, label] of [["personal", "Personal narrative"], ["challenge", "Describe a challenge"], ["opinion", "Opinion / argument"], ["current", "Current events"]]) {
    await page.click(`[data-etype=${cat}]`);
    await page.click("#essayStartBtn");
    assert.deepEqual(await page.$$eval("#promptCards .badge", (b) => b.map((x) => x.textContent)), [label, label]);
  }
  await page.click("[data-etype=surprise]"); await page.click("#rerollBtn");
  assert.equal(new Set(await page.$$eval("#promptCards .badge", (b) => b.map((x) => x.textContent))).size, 2);
  ok("essay prompt categories: personal, challenge, opinion, current events, surprise");
  await page.click("[data-etype=challenge]"); await page.click("#rerollBtn");
  await page.selectOption("#essayMinutes", "40");
  await page.click("#promptCards .prompt-card");
  await visible(page, "#essayTimer");
  assert.match(await page.textContent("#timerClock"), /^(40:00|39:59)$/);
  await page.click("#planBtn"); assert.match(await page.textContent("#planPanel"), /Reflection/); await page.click("#planBtn");
  await page.click("#typeAlongBox summary");
  await page.fill("#typeAlong", "The hardest thing I ever did was learn to swim in the cold lake behind my grandmother's house.");
  await page.dispatchEvent("#typeAlong", "input");
  assert.equal(await page.textContent("#typeCount"), "18 words");
  ok("timer 40:00, planning guide, type-along word counter");
  await page.evaluate(() => window.__advance(5 * 60 * 1000 + 500));
  await page.waitForFunction(() => /35 minutes left/.test(document.querySelector("#timerAlert").textContent));
  await page.click("#pauseBtn");
  const paused = await page.textContent("#timerClock");
  await page.evaluate(() => window.__advance(60 * 1000)); await page.waitForTimeout(350);
  assert.equal(await page.textContent("#timerClock"), paused);
  await page.click("#pauseBtn");
  await page.click("#fsBtn"); await page.waitForTimeout(200);
  assert.ok(await page.evaluate(() => !!document.fullscreenElement || document.querySelector("#essayTimer").classList.contains("focus")));
  await page.click("#fsBtn");
  await page.evaluate(() => window.__advance(25 * 60 * 1000));
  await page.waitForFunction(() => /10 minutes/.test(document.querySelector("#timerAlert").textContent));
  await page.evaluate(() => window.__advance(5 * 60 * 1000));
  await page.waitForFunction(() => /5 minutes/.test(document.querySelector("#timerAlert").textContent));
  await page.reload(); await visible(page, "#app"); await tab("essay"); await visible(page, "#essayTimer");
  await page.evaluate(() => window.__advance(6 * 60 * 1000));
  await visible(page, "#essayCheck");
  ok("alerts at 35/10/5 min, pause, full screen, survives refresh, time-up → checklist");
  await page.click("#checklist .check:nth-child(1)"); await page.click("#checklist .check:nth-child(4)");
  await page.click("#saveEssayBtn");
  await visible(page, "#essaySetup");
  const entry = await page.textContent("#essayHistory .entry");
  assert.match(entry, /Describe a challenge/); assert.match(entry, /2\/5/); assert.match(entry, /18 words/);
  ok("essay logged with category, checklist score and typed word count");
  // 20-minute back-to-back
  await page.click("[data-etype=opinion]"); await page.click("#essayStartBtn");
  await page.selectOption("#essayMinutes", "20");
  await page.check("#backToBack");
  await page.click("#promptCards .prompt-card");
  assert.match(await page.textContent("#timerType"), /essay 1 of 2/);
  assert.match(await page.textContent("#timerClock"), /^(20:00|19:59)$/);
  await page.evaluate(() => window.__advance(21 * 60 * 1000));
  await visible(page, "#essayCheck");
  await page.click("#saveEssayBtn");
  await page.waitForFunction(() => /essay 2 of 2/.test(document.querySelector("#timerType").textContent));
  assert.match(await page.textContent("#timerType"), /(Personal narrative|Describe a challenge)/);
  await page.click("#quitBtn");
  await page.uncheck("#backToBack"); await page.selectOption("#essayMinutes", "40");
  ok("20-minute timer and two-essays-back-to-back mode (second essay switches style)");
  // Scanner: paste + quick check + save
  await page.click("#scanOnlyBtn"); await visible(page, "#essayScan");
  await page.selectOption("#scanType", "argumentative");
  await page.fill("#transcript", "Homework should be optional because it causes stress.\n\nFirst, students lose sleep. For example, many sleep less than seven hours.\n\nSome argue that homework teaches discipline. However, sports teach it too.\n\nIn conclusion, homework should be optional.");
  await page.dispatchEvent("#transcript", "input");
  await page.click("#quickCheckBtn");
  assert.match(await page.textContent("#feedbackOut"), /checks passed/);
  await page.click("#saveTranscriptBtn"); await page.click("#scanBackBtn");
  await visible(page, "#essaySetup");
  ok("scanner: paste text, instant quick check, save to log");

  // ── Practice ──
  await tab("reasoning");
  assert.equal(await page.$$eval("#sectionCards .section-card", (x) => x.length), 5);
  // Math section practice: step-by-step
  await page.click(".section-card[data-bat=math] [data-act=practice]");
  await visible(page, "#rsPlay");
  await page.click("#rsOptions .opt >> nth=0");
  assert.ok(await page.$$eval("#rsFeedback .steps li", (x) => x.length) >= 1);
  await page.click("#rsNextBtn");
  await page.click("#rsOptions .opt >> nth=1");
  await page.click("#rsEndBtn"); await visible(page, "#rsResult"); await page.click("#rsMenuBtn");
  ok("math practice shows numbered step-by-step solutions");
  // Reading: passage panel + set of questions
  await page.click(".section-card[data-bat=reading] [data-act=practice]");
  await visible(page, "#rsPassage");
  const title = await page.textContent("#rsPassage h3");
  for (let i = 0; i < 5; i++) { assert.equal(await page.textContent("#rsPassage h3"), title); await page.click("#rsOptions .opt >> nth=0"); await page.click("#rsNextBtn"); }
  assert.notEqual(await page.textContent("#rsPassage h3"), title);
  await page.click("#rsEndBtn"); await page.click("#rsMenuBtn");
  ok(`reading: passage “${title}” stays for its 5 questions, then a new passage`);
  // Section timed drill (verbal)
  await page.click(".section-card[data-bat=verbal] [data-act=timed]");
  await page.click("#drN [data-v='5']");
  assert.match(await page.textContent("#drSum"), /5 questions/);
  await page.click("#goDr"); await visible(page, "#rsPlay");
  assert.ok(await page.isHidden("#rsFeedback"));
  await answerAll(1);
  await visible(page, "#rsResult");
  assert.match(await page.textContent("#rsScore"), /\/ 5/);
  await page.click("#rsMenuBtn");
  ok("timed section drill: no feedback during, results at the end");
  // Full mock (quick)
  await page.click("[data-mode=fullSetup]");
  await page.click("#fullLen [data-v='0.25']");
  await page.click("#goFull"); await visible(page, "#rsPlay");
  assert.equal(await page.$$eval("#rsSectionBar span", (x) => x.length), 5);
  await page.click("#rsSkipBtn"); await page.click("#rsPrevBtn");
  await page.evaluate(() => window.__advance(5 * 60 * 1000)); // section 1 time runs out
  await page.waitForFunction(() => /Reading/.test(document.querySelector("#rsProgress").textContent));
  await answerAll(0);
  await visible(page, "#rsResult");
  assert.ok(await page.isVisible("#rsEssayNext"));
  assert.match(await page.textContent("#rsBreakdown"), /Reading comprehension.*Math/s);
  ok(`full mock: 5 timed sections, auto-advance on time-up, ${await page.textContent("#rsScore")}, breakdown`);
  await page.click("#rsToEssayBtn");
  await visible(page, "#essayTimer");
  await page.click("#quitBtn");
  ok("full mock hands off to a timed essay with a surprise prompt");
  // CogAT-style quarter
  await tab("reasoning");
  if (await page.isVisible("#rsMenuBtn")) await page.click("#rsMenuBtn");
  await page.click("[data-mode=cogatSetup]");
  await page.click("#cgLen [data-v='0.25']");
  assert.match(await page.textContent("#cgSum"), /9 subtests/);
  await page.click("#goCg"); await visible(page, "#rsPlay");
  await page.click("#rsEndBtn"); await visible(page, "#rsResult"); await page.click("#rsMenuBtn");
  ok("CogAT-style test (quarter length) starts with 9 subtests");
  // Sprint
  await page.click("[data-mode=sprintSetup]");
  await page.click("#spLen [data-v='3']");
  await page.click("#goSp"); await visible(page, "#rsPlay");
  for (let i = 0; i < 3; i++) { await page.click("#rsOptions .opt >> nth=0"); await page.waitForTimeout(1500); }
  await page.evaluate(() => window.__advance(4 * 60 * 1000));
  await visible(page, "#rsResult");
  assert.match(await page.textContent("#rsResultTitle"), /Sprint/);
  await page.click("#rsMenuBtn");
  ok("speed sprint auto-advances and ends on time");
  // Mistakes
  await page.click("[data-mode=mistakes]");
  assert.ok(await page.$$eval("#mistakeList [data-redo]", (x) => x.length) >= 2);
  await page.click("#mistakeList [data-redo=all]"); await visible(page, "#rsPlay");
  await page.click("#rsOptions .opt >> nth=0"); await page.click("#rsNextBtn");
  await page.click("#rsEndBtn"); await page.click("#rsMenuBtn");
  ok("mistake review grouped by section/topic with redo");
  // Flag + learn
  await page.click(".section-card[data-bat=nonverbal] [data-act=practice]");
  await page.click("#rsFlagBtn");
  assert.equal(await page.$$eval("#rsOptions .opt svg", (x) => x.length), 5);
  await page.click("#rsHelpBtn"); assert.ok(await page.isVisible("#rsHelp"));
  await page.keyboard.press("2"); await page.keyboard.press("Enter");
  await page.click("#rsEndBtn"); await page.click("#rsMenuBtn");
  assert.match(await page.textContent("#flagCount"), /1 flagged/);
  await page.click("[data-mode=learn]");
  assert.ok(await page.$$eval("#learnList details", (x) => x.length) >= 20);
  await page.click("[data-back=menu] >> visible=true");
  ok("nonverbal SVG questions, flags, hints, keyboard, strategy guides");

  // ── Vocab ──
  await tab("vocab");
  assert.match(await page.textContent("#vocabTotal"), /^6\d\d$/);
  await tap("#flash"); await page.click("#vNo");
  await tap("#flash"); await page.click("#vYes");
  await page.click("[data-vtab=quiz]");
  for (let i = 0; i < 10; i++) { await page.click("#vQuiz .opt >> nth=0"); await page.click("#vqNext"); }
  assert.match(await page.textContent("#vQuiz h2"), /\d+\/10/);
  await page.click("[data-vtab=blitz]"); await page.click("#blitzGo");
  await page.click("#vBlitz .opt >> nth=0");
  await page.evaluate(() => window.__advance(70 * 1000)); await page.waitForTimeout(400);
  assert.match(await page.textContent("#vBlitz"), /correct/);
  await page.click("[data-vtab=roots]");
  assert.ok(await page.$$eval(".root", (x) => x.length) >= 120);
  await page.click("[data-vtab=list]");
  await page.selectOption("#vCat", "cool");
  assert.ok(await page.$$eval(".vrow", (x) => x.length) >= 50);
  await page.selectOption("#vCat", "all");
  await page.check("#vWeak"); // the word missed on a flashcard above is now a weak word
  assert.ok(await page.$$eval(".vrow", (x) => x.length) >= 1);
  await page.uncheck("#vWeak");
  ok("vocab: flashcards, mixed quiz, 60-s blitz, roots, categories, weak-word filter");

  // ── Progress ──
  await tab("progress");
  await page.waitForSelector("#chartBatteries svg");
  assert.match(await page.textContent("#statTiles"), /Essays written[34]/);
  assert.ok(await page.$$eval("#chartBatteries svg g", (x) => x.length) >= 4);
  assert.ok(await page.$$eval("#chartSkills svg g", (x) => x.length) >= 1);
  assert.match(await page.textContent("#weakTopics"), /Practice|Answer at least/);
  ok("progress: accuracy by section, reading skills, weakest topics");
  await tap("#chartBatteries svg g");

  await page.reload(); await visible(page, "#app"); await tab("progress");
  await page.waitForFunction(() => /Essays written[34]/.test(document.querySelector("#statTiles").textContent));
  ok("data persists after reload (saved in the browser)");

  await page.click("#themeBtn");
  const bg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
  await page.click("#themeBtn");
  assert.notEqual(bg, await page.evaluate(() => getComputedStyle(document.body).backgroundColor));
  for (const t of ["home", "essay", "reasoning", "vocab", "progress"]) {
    await tab(t);
    const over = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    assert.ok(over <= 1, `${t} overflows by ${over}px`);
  }
  ok("dark mode toggles; no horizontal overflow on any tab");
  await ctx.close();
}

async function offline() {
  console.log("\n── Offline ──");
  const ctx = await browser.newContext({ viewport: { width: 1000, height: 800 } });
  const page = await ctx.newPage();
  page.on("pageerror", (e) => errors.push(`offline: ${e.message}`));
  await page.goto(URL_);
  await page.waitForSelector("#app:not([hidden])");
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.reload(); // let the service worker cache everything it serves
  await page.waitForSelector("#app:not([hidden])");
  await ctx.setOffline(true);
  await page.reload();
  await page.waitForSelector("#app:not([hidden])");
  await page.click("a[data-tab=reasoning]");
  await page.click(".section-card[data-bat=math] [data-act=practice]");
  await page.waitForSelector("#rsPlay:not([hidden])");
  ok("works offline after the first visit (installable app with a service worker)");
  await ctx.close();
}

try {
  await run("Laptop (1280×800)", { viewport: { width: 1280, height: 800 } });
  await run("Phone (iPhone 13)", { ...devices["iPhone 13"] });
  await offline();
} finally {
  await browser.close();
  server.close();
}
const real = errors.filter((e) => !/favicon/.test(e));
assert.deepEqual(real, [], "browser errors:\n" + real.join("\n"));
console.log("\n✓ No JavaScript errors. All UI checks passed.");
