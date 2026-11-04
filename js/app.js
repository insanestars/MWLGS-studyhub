import * as store from "./store.js";
import { $, $$, toast, escapeHtml, todayKey } from "./util.js";
import { initEssay } from "./essay.js";
import { initReasoning, start as startReasoning, practiceOnly } from "./reasoning.js";
import { initProgress, computeStreak } from "./progress.js";
import { initHome } from "./home.js";
import { initVocab } from "./vocab.js";
import { DEFS_SVG } from "./gen/draw.js";
import * as tutor from "./tutor.js";
import { hasGeminiKey, setGeminiKey } from "./gemini.js";
import { startSurpriseEssay } from "./essay.js";

const GUEST_FLAG = "studyhub:guest-mode";
document.body.insertAdjacentHTML("afterbegin", DEFS_SVG); // shared SVG patterns for puzzles

// ── Theme ────────────────────────────────────────────────────────────────────
function effectiveTheme() {
  const t = document.documentElement.dataset.theme;
  if (t) return t;
  return matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}
$("#themeBtn").addEventListener("click", () => {
  const next = effectiveTheme() === "dark" ? "light" : "dark";
  document.documentElement.dataset.theme = next;
  try { localStorage.setItem("studyhub:theme", next); } catch { /* ignore */ }
  window.dispatchEvent(new Event("themechange"));
});

// ── Routing ──────────────────────────────────────────────────────────────────
const VIEWS = ["home", "essay", "reasoning", "vocab", "progress"];
function route() {
  const name = VIEWS.includes(location.hash.slice(1)) ? location.hash.slice(1) : "home";
  for (const v of $$(".view")) v.hidden = v.dataset.view !== name;
  for (const a of $$(".tabs a")) {
    if (a.dataset.tab === name) a.setAttribute("aria-current", "page");
    else a.removeAttribute("aria-current");
  }
  window.dispatchEvent(new CustomEvent("viewchange", { detail: name }));
}
window.addEventListener("hashchange", () => { route(); window.scrollTo(0, 0); });

function showApp() {
  $("#login").hidden = true;
  $("#app").hidden = false;
  $(".tabs").hidden = false;
  route();
}
function showLogin() {
  $("#login").hidden = false;
  $("#app").hidden = true;
  $(".tabs").hidden = true;
}

// ── Account & settings ───────────────────────────────────────────────────────
function renderAccount() {
  const user = store.currentUser();
  const btn = $("#accountBtn");
  btn.innerHTML = user && user.photoURL
    ? `<img src="${escapeHtml(user.photoURL)}" alt="" referrerpolicy="no-referrer">`
    : `<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-6 8-6s8 2 8 6"/></svg>`;
  let info;
  if (user) info = `Signed in as <b>${escapeHtml(user.displayName || "")}</b> · ${escapeHtml(user.email || "")}<br>Your progress syncs across your devices.`;
  else if (store.isConfigured) info = "Not signed in — progress is saved on this device only. Sign in to sync across your phone and laptop.";
  else info = "Cloud sync isn't set up yet, so progress is saved on this device only.";
  $("#accountInfo").innerHTML = info;
  $("#signInFromSheet").hidden = !!user || !store.isConfigured;
  $("#signOutBtn").hidden = !user;
  $("#setExamDate").value = store.state.settings.examDate || "";
  $("#setGoal").value = store.state.settings.dailyGoal || 30;
  $("#setApiKey").value = "";
  $("#setApiKey").placeholder = tutor.hasClaudeKey() ? "•••••• saved — paste to replace" : "sk-ant-…";
  $("#keyStatus").textContent = tutor.hasClaudeKey() ? "✓ saved" : "";
  $("#setGeminiKey").value = "";
  $("#setGeminiKey").placeholder = hasGeminiKey() ? "•••••• saved — paste to replace" : "paste your Gemini API key";
  $("#geminiStatus").textContent = hasGeminiKey() ? "✓ saved" : "";
  $("#providerRow").hidden = !(hasGeminiKey() && tutor.hasClaudeKey());
  $("#setProvider").value = tutor.getProvider() || "gemini";
}
$("#accountBtn").addEventListener("click", () => { renderAccount(); $("#accountDialog").showModal(); });
$("#setExamDate").addEventListener("change", (e) => store.setSetting("examDate", e.target.value));
$("#setGoal").addEventListener("change", (e) => store.setSetting("dailyGoal", Math.max(5, Math.min(200, Number(e.target.value) || 30))));
$("#saveKeyBtn").addEventListener("click", () => {
  const k = $("#setApiKey").value.trim();
  if (!k.startsWith("sk-")) return toast("That doesn't look like an Anthropic API key (it starts with sk-ant-).");
  tutor.setKey(k); renderAccount(); toast("API key saved on this device ✓");
});
$("#clearKeyBtn").addEventListener("click", () => { tutor.setKey(""); renderAccount(); toast("Anthropic key removed"); });
$("#saveGeminiBtn").addEventListener("click", () => {
  const k = $("#setGeminiKey").value.trim();
  if (k.length < 20) return toast("That doesn't look like a complete Gemini API key.");
  setGeminiKey(k); renderAccount(); toast("Gemini key saved on this device ✓ — the AI reader is ready.");
});
$("#clearGeminiBtn").addEventListener("click", () => { setGeminiKey(""); renderAccount(); toast("Gemini key removed"); });
$("#setProvider").addEventListener("change", (e) => { tutor.setProvider(e.target.value); toast(`Using ${tutor.providerName()} for the AI tutor`); });
$("#exportBtn").addEventListener("click", () => {
  const blob = new Blob([store.exportData()], { type: "application/json" });
  const a = Object.assign(document.createElement("a"), { href: URL.createObjectURL(blob), download: `studyhub-backup-${todayKey()}.json` });
  a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 1000);
});
$("#importInput").addEventListener("change", async (e) => {
  const f = e.target.files[0]; if (!f) return;
  try { await store.importData(await f.text()); toast("Backup imported ✓"); } catch (err) { toast("Couldn't import that file: " + err.message); }
  e.target.value = "";
});

async function doSignIn() {
  $("#loginError").hidden = true;
  try {
    await store.signIn();
  } catch (e) {
    console.error(e);
    const msg = e.code === "auth/unauthorized-domain"
      ? "This website's domain isn't authorised in Firebase yet (Authentication → Settings → Authorized domains)."
      : "Sign-in failed: " + (e.message || e);
    $("#loginError").textContent = msg; $("#loginError").hidden = false;
    toast(msg, 6000);
  }
}
$("#googleBtn").addEventListener("click", doSignIn);
$("#signInFromSheet").addEventListener("click", () => { $("#accountDialog").close(); doSignIn(); });
$("#guestBtn").addEventListener("click", () => {
  try { localStorage.setItem(GUEST_FLAG, "1"); } catch { /* ignore */ }
  store.useLocal(); showApp(); renderAccount();
});
$("#signOutBtn").addEventListener("click", async () => {
  $("#accountDialog").close();
  try { localStorage.removeItem(GUEST_FLAG); } catch { /* ignore */ }
  await store.signOutUser();
});

window.addEventListener("store-error", (e) => {
  const code = e.detail && e.detail.code;
  toast(code === "permission-denied" ? "Couldn't save: permission denied (check Firestore rules)."
    : e.detail && e.detail.name === "QuotaExceededError" ? "This device's storage is full — sign in to save to the cloud."
      : "Couldn't save to the cloud — will retry when online.", 5000);
});

store.onChange((s) => {
  const { current } = computeStreak(s.activeDays);
  const chip = $("#streakChip");
  chip.hidden = false;
  chip.querySelector("b").textContent = current;
  chip.title = `Daily streak: ${current} day${current === 1 ? "" : "s"}`;
});

// ── Boot ─────────────────────────────────────────────────────────────────────
initEssay();
initReasoning({ startEssay: startSurpriseEssay });
initProgress();
initVocab();
initHome({ startReasoning, practiceType: practiceOnly });
document.querySelector("#progress").addEventListener("click", (e) => {
  const b = e.target.closest("[data-practice]");
  if (b) { location.hash = "#reasoning"; practiceOnly(b.dataset.practice); }
});

if (!store.isConfigured) {
  store.useLocal(); showApp(); renderAccount();
} else {
  showLogin();
  $("#googleBtn").disabled = true;
  store.watchAuth(async (user) => {
    $("#googleBtn").disabled = false;
    if (user) {
      try {
        await store.useCloud(user);
      } catch (e) {
        console.error(e);
        toast("Couldn't load your data: " + (e.code || e.message), 6000);
        store.useLocal();
      }
      showApp();
    } else {
      let guest = false;
      try { guest = localStorage.getItem(GUEST_FLAG) === "1"; } catch { /* ignore */ }
      if (guest) { store.useLocal(); showApp(); } else showLogin();
    }
    renderAccount();
  }).catch((e) => {
    console.error(e);
    $("#googleBtn").disabled = false;
    $("#loginError").textContent = "Couldn't reach Firebase. You can still continue without signing in.";
    $("#loginError").hidden = false;
  });
}

// Offline support (installable app). Network-first, so updates show up right away when online.
if ("serviceWorker" in navigator && location.protocol !== "file:") {
  window.addEventListener("load", () => navigator.serviceWorker.register("sw.js").catch(() => {}));
}
