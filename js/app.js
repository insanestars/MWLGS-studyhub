import * as store from "./store.js";
import { $, $$, toast, escapeHtml } from "./util.js";
import { initEssay } from "./essay.js";
import { initReasoning } from "./reasoning.js";
import { initProgress, computeStreak } from "./progress.js";

const GUEST_FLAG = "studyhub:guest-mode";

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
const VIEWS = ["essay", "reasoning", "progress"];
function route() {
  const name = VIEWS.includes(location.hash.slice(1)) ? location.hash.slice(1) : "essay";
  for (const v of $$(".view")) v.hidden = v.dataset.view !== name;
  for (const a of $$(".tabs a")) {
    if (a.dataset.tab === name) a.setAttribute("aria-current", "page");
    else a.removeAttribute("aria-current");
  }
  window.dispatchEvent(new CustomEvent("viewchange", { detail: name }));
}
window.addEventListener("hashchange", () => { route(); window.scrollTo(0, 0); });

// ── Screens ──────────────────────────────────────────────────────────────────
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

// ── Account ──────────────────────────────────────────────────────────────────
function renderAccount() {
  const user = store.currentUser();
  const btn = $("#accountBtn");
  btn.innerHTML = user && user.photoURL
    ? `<img src="${escapeHtml(user.photoURL)}" alt="" referrerpolicy="no-referrer">`
    : `<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-6 8-6s8 2 8 6"/></svg>`;
  let info;
  if (user) info = `Signed in as <b>${escapeHtml(user.displayName || "")}</b><br>${escapeHtml(user.email || "")}<br>Your progress syncs across your devices.`;
  else if (store.isConfigured) info = "Not signed in — progress is saved on this device only. Sign in to sync across your phone and laptop.";
  else info = "Cloud sync isn't set up yet, so progress is saved on this device only. (Add your Firebase config in <code>js/firebase-config.js</code> — see README.)";
  $("#accountInfo").innerHTML = info;
  $("#signInFromSheet").hidden = !!user || !store.isConfigured;
  $("#signOutBtn").hidden = !user;
}
$("#accountBtn").addEventListener("click", () => { renderAccount(); $("#accountDialog").showModal(); });

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
  toast(code === "permission-denied" ? "Couldn't save: permission denied (check Firestore rules)." : "Couldn't save to the cloud — will retry when online.", 5000);
});

// ── Streak chip ──────────────────────────────────────────────────────────────
store.onChange((s) => {
  const { current } = computeStreak(s.activeDays);
  const chip = $("#streakChip");
  chip.hidden = false;
  chip.querySelector("b").textContent = current;
  chip.title = `Daily streak: ${current} day${current === 1 ? "" : "s"}`;
});

// ── Boot ─────────────────────────────────────────────────────────────────────
initEssay();
initReasoning();
initProgress();

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
