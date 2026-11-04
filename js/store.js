// Data layer. Uses Firebase (Auth + Firestore) when configured, otherwise localStorage.
//
// Firestore layout (all private to the signed-in user, see firestore.rules):
//   users/{uid}/essays/{essayId}      essay log (+ transcript & tutor feedback)
//   users/{uid}/rounds/{roundId}      reasoning rounds & mock tests
//   users/{uid}/mistakes/{key}        puzzles to retry
//   users/{uid}/flags/{key}           puzzles you bookmarked
//   users/{uid}/meta/main             { activeDays, daily, vocab, settings }

import { firebaseConfig } from "./firebase-config.js";
import { todayKey } from "./util.js";

const FB = "https://www.gstatic.com/firebasejs/10.12.2/";
const LOCAL_KEY = "studyhub:guest";
const MAX_MISTAKES = 150;

export const isConfigured = !!(firebaseConfig && firebaseConfig.apiKey &&
  !String(firebaseConfig.apiKey).startsWith("PASTE"));

export const DEFAULT_SETTINGS = { sound: true, level: 2, dailyGoal: 30, examDate: "" };
const empty = () => ({ essays: [], rounds: [], mistakes: [], flags: [], activeDays: [], daily: {}, vocab: {}, settings: { ...DEFAULT_SETTINGS } });

export const state = empty();
let backend = null;
let fb = null;
const listeners = new Set();
export const onChange = (fn) => listeners.add(fn);
const emit = () => listeners.forEach((fn) => fn(state));

// Drop data from older versions that the app can't use anymore.
const valid = (p) => p && p.v === 2;

function replaceState(next) {
  Object.assign(state, empty(), next);
  state.settings = { ...DEFAULT_SETTINGS, ...(next.settings || {}) };
  state.mistakes = (state.mistakes || []).filter(valid);
  state.flags = (state.flags || []).filter(valid);
  state.essays.sort((a, b) => b.date.localeCompare(a.date));
  state.rounds.sort((a, b) => a.date.localeCompare(b.date));
  emit();
}

const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

// ── Local (guest) backend ────────────────────────────────────────────────────
function readLocal() {
  try { return JSON.parse(localStorage.getItem(LOCAL_KEY)) || empty(); } catch { return empty(); }
}
function writeLocal() {
  try { localStorage.setItem(LOCAL_KEY, JSON.stringify(state)); } catch (e) { console.warn(e); window.dispatchEvent(new CustomEvent("store-error", { detail: e })); }
}
export function useLocal() {
  const w = writeLocal;
  backend = { kind: "local", saveEssay: w, deleteEssay: w, saveRound: w, saveMeta: w, saveMistake: w, deleteMistake: w, saveFlag: w, deleteFlag: w };
  replaceState(readLocal());
}

// ── Firebase backend ─────────────────────────────────────────────────────────
async function loadFirebase() {
  if (fb) return fb;
  const [app, auth, fs] = await Promise.all([
    import(FB + "firebase-app.js"), import(FB + "firebase-auth.js"), import(FB + "firebase-firestore.js")
  ]);
  const a = app.initializeApp(firebaseConfig);
  let db;
  try {
    db = fs.initializeFirestore(a, { localCache: fs.persistentLocalCache({ tabManager: fs.persistentMultipleTabManager() }) });
  } catch { db = fs.getFirestore(a); }
  fb = { auth: auth.getAuth(a), authMod: auth, db, fs };
  // Only used by the automated tests (local Firebase emulators); never set in the real config.
  if (firebaseConfig.emulators) {
    auth.connectAuthEmulator(fb.auth, "http://127.0.0.1:9099", { disableWarnings: true });
    fs.connectFirestoreEmulator(db, "127.0.0.1", 8080);
  }
  return fb;
}

export async function watchAuth(callback) {
  const { auth, authMod } = await loadFirebase();
  authMod.onAuthStateChanged(auth, callback);
}

export async function signIn() {
  const { auth, authMod } = await loadFirebase();
  const provider = new authMod.GoogleAuthProvider();
  provider.setCustomParameters({ prompt: "select_account" });
  try {
    await authMod.signInWithPopup(auth, provider);
  } catch (e) {
    if (e.code === "auth/popup-blocked" || e.code === "auth/operation-not-supported-in-this-environment") {
      await authMod.signInWithRedirect(auth, provider);
    } else if (e.code !== "auth/popup-closed-by-user" && e.code !== "auth/cancelled-popup-request") {
      throw e;
    }
  }
}
export async function signOutUser() { if (fb) await fb.authMod.signOut(fb.auth); }

export async function useCloud(user) {
  const { db, fs } = await loadFirebase();
  const base = ["users", user.uid];
  const col = (name) => fs.collection(db, ...base, name);
  const metaRef = fs.doc(db, ...base, "meta", "main");

  const [essaySnap, roundSnap, mistakeSnap, flagSnap, metaSnap] = await Promise.all([
    fs.getDocs(col("essays")), fs.getDocs(col("rounds")), fs.getDocs(col("mistakes")), fs.getDocs(col("flags")), fs.getDoc(metaRef)
  ]);
  const meta = metaSnap.exists() ? metaSnap.data() : {};
  const loaded = {
    essays: essaySnap.docs.map((d) => d.data()),
    rounds: roundSnap.docs.map((d) => d.data()),
    mistakes: mistakeSnap.docs.map((d) => d.data()).sort((a, b) => (b.savedAt || "").localeCompare(a.savedAt || "")),
    flags: flagSnap.docs.map((d) => d.data()),
    activeDays: meta.activeDays || [], daily: meta.daily || {}, vocab: meta.vocab || {},
    settings: meta.settings || {}
  };

  const report = (p) => p.catch((e) => { console.error(e); window.dispatchEvent(new CustomEvent("store-error", { detail: e })); });
  // Firestore rejects undefined values and arrays nested directly inside arrays.
  const safe = (v) => JSON.parse(JSON.stringify(v, (k, x) => (Array.isArray(x) && x.some(Array.isArray) ? Object.fromEntries(x.map((y, i) => [i, y])) : x)));
  const put = (c, id, data) => report(Promise.resolve().then(() => fs.setDoc(fs.doc(col(c), id), safe(data))));
  const del = (c, id) => report(fs.deleteDoc(fs.doc(col(c), id)));
  backend = {
    kind: "cloud", user,
    saveEssay: (e) => put("essays", e.id, e), deleteEssay: (id) => del("essays", id),
    saveRound: (r) => put("rounds", r.id, r),
    saveMistake: (p) => put("mistakes", p.key, p), deleteMistake: (k) => del("mistakes", k),
    saveFlag: (p) => put("flags", p.key, p), deleteFlag: (k) => del("flags", k),
    saveMeta: () => report(fs.setDoc(metaRef, { activeDays: state.activeDays, daily: state.daily, vocab: state.vocab, settings: state.settings }))
  };

  // Offer to copy anything saved on this device before signing in.
  const local = readLocal();
  const localCount = (local.essays || []).length + (local.rounds || []).length;
  if (localCount && confirm(`Copy ${localCount} item(s) saved on this device into your account?`)) {
    const seenE = new Set(loaded.essays.map((e) => e.id)), seenR = new Set(loaded.rounds.map((r) => r.id));
    const batch = fs.writeBatch(db);
    for (const e of local.essays || []) if (!seenE.has(e.id)) { loaded.essays.push(e); batch.set(fs.doc(col("essays"), e.id), e); }
    for (const r of local.rounds || []) if (!seenR.has(r.id)) { loaded.rounds.push(r); batch.set(fs.doc(col("rounds"), r.id), r); }
    for (const m of (local.mistakes || []).filter(valid).slice(0, 100)) { loaded.mistakes.push(m); batch.set(fs.doc(col("mistakes"), m.key), m); }
    loaded.activeDays = [...new Set([...loaded.activeDays, ...(local.activeDays || [])])].sort();
    loaded.vocab = { ...(local.vocab || {}), ...loaded.vocab };
    await batch.commit();
    localStorage.removeItem(LOCAL_KEY);
    replaceState(loaded);
    await backend.saveMeta();
    return;
  }
  replaceState(loaded);
}

export const currentUser = () => (backend && backend.user) || null;
export const backendKind = () => (backend ? backend.kind : null);

// ── Mutations ────────────────────────────────────────────────────────────────
function markActive() {
  const k = todayKey();
  if (!state.activeDays.includes(k)) { state.activeDays.push(k); state.activeDays.sort(); }
}

export function addEssay(entry) {
  const e = { id: uid(), date: new Date().toISOString(), ...entry };
  state.essays.unshift(e);
  markActive();
  backend.saveEssay(e); backend.saveMeta();
  emit();
  return e;
}
export function updateEssay(id, patch) {
  const e = state.essays.find((x) => x.id === id);
  if (!e) return;
  Object.assign(e, patch);
  backend.saveEssay(e);
  emit();
}
export function deleteEssay(id) {
  state.essays = state.essays.filter((e) => e.id !== id);
  backend.deleteEssay(id);
  emit();
}

export function addRound(round) {
  const r = { id: uid(), date: new Date().toISOString(), ...round };
  state.rounds.push(r);
  markActive();
  backend.saveRound(r); backend.saveMeta();
  emit();
  return r;
}

// Count answered questions per day (for the daily goal). Keeps the last 90 days.
export function countAnswer() {
  const k = todayKey();
  state.daily[k] = (state.daily[k] || 0) + 1;
  const keys = Object.keys(state.daily).sort();
  for (const old of keys.slice(0, Math.max(0, keys.length - 90))) delete state.daily[old];
  markActive();
  clearTimeout(countAnswer.t);
  countAnswer.t = setTimeout(() => { backend.saveMeta(); emit(); }, 1500); // batch writes
}

export function addMistake(puzzle) {
  const p = { ...puzzle, savedAt: new Date().toISOString() };
  state.mistakes = [p, ...state.mistakes.filter((x) => x.key !== p.key)];
  if (state.mistakes.length > MAX_MISTAKES) for (const old of state.mistakes.splice(MAX_MISTAKES)) backend.deleteMistake(old.key);
  backend.saveMistake(p);
}
export function removeMistake(key) {
  state.mistakes = state.mistakes.filter((p) => p.key !== key);
  backend.deleteMistake(key);
}
export function toggleFlag(puzzle) {
  if (state.flags.some((p) => p.key === puzzle.key)) {
    state.flags = state.flags.filter((p) => p.key !== puzzle.key);
    backend.deleteFlag(puzzle.key);
    return false;
  }
  const p = { ...puzzle, savedAt: new Date().toISOString() };
  state.flags.unshift(p);
  backend.saveFlag(p);
  return true;
}
export const isFlagged = (key) => state.flags.some((p) => p.key === key);

export function setVocab(word, data) {
  state.vocab[word] = data;
  clearTimeout(setVocab.t);
  setVocab.t = setTimeout(() => backend.saveMeta(), 1200);
}

export function setSetting(name, value) {
  state.settings[name] = value;
  backend.saveMeta();
  emit();
}

// Export / import a full backup (JSON).
export function exportData() { return JSON.stringify({ app: "studyhub", version: 2, exported: new Date().toISOString(), data: state }, null, 1); }
export async function importData(json) {
  const parsed = JSON.parse(json);
  const d = parsed.data || parsed;
  const have = new Set(state.essays.map((e) => e.id)), haveR = new Set(state.rounds.map((r) => r.id));
  for (const e of d.essays || []) if (!have.has(e.id)) { state.essays.push(e); backend.saveEssay(e); }
  for (const r of d.rounds || []) if (!haveR.has(r.id)) { state.rounds.push(r); backend.saveRound(r); }
  for (const m of (d.mistakes || []).filter(valid)) if (!state.mistakes.some((x) => x.key === m.key)) { state.mistakes.push(m); backend.saveMistake(m); }
  state.activeDays = [...new Set([...state.activeDays, ...(d.activeDays || [])])].sort();
  state.vocab = { ...(d.vocab || {}), ...state.vocab };
  backend.saveMeta();
  replaceState({ ...state });
}
