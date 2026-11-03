// Data layer. Uses Firebase (Auth + Firestore) when configured, otherwise localStorage.
//
// Firestore layout (all private to the signed-in user, see firestore.rules):
//   users/{uid}/essays/{essayId}
//   users/{uid}/rounds/{roundId}
//   users/{uid}/meta/main      { mistakes: [...], activeDays: [...], settings: {...} }

import { firebaseConfig } from "./firebase-config.js";
import { todayKey } from "./util.js";

const FB = "https://www.gstatic.com/firebasejs/10.12.2/";
const LOCAL_KEY = "studyhub:guest";
const MAX_MISTAKES = 40;

export const isConfigured = !!(firebaseConfig && firebaseConfig.apiKey &&
  !String(firebaseConfig.apiKey).startsWith("PASTE"));

const empty = () => ({ essays: [], rounds: [], mistakes: [], activeDays: [], settings: { sound: true } });

export const state = empty();
let backend = null;          // { kind, user?, saveEssay, deleteEssay, saveRound, saveMeta }
let fb = null;               // loaded Firebase modules
const listeners = new Set();
export const onChange = (fn) => listeners.add(fn);
const emit = () => listeners.forEach((fn) => fn(state));

function replaceState(next) {
  Object.assign(state, empty(), next);
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
  try { localStorage.setItem(LOCAL_KEY, JSON.stringify(state)); } catch (e) { console.warn(e); }
}
function localBackend() {
  return {
    kind: "local",
    saveEssay: writeLocal, deleteEssay: writeLocal, saveRound: writeLocal, saveMeta: writeLocal
  };
}
export function useLocal() {
  backend = localBackend();
  replaceState(readLocal());
}
export function localItemCount() {
  const d = readLocal();
  return d.essays.length + d.rounds.length;
}

// ── Firebase backend ─────────────────────────────────────────────────────────
async function loadFirebase() {
  if (fb) return fb;
  const [app, auth, fs] = await Promise.all([
    import(FB + "firebase-app.js"),
    import(FB + "firebase-auth.js"),
    import(FB + "firebase-firestore.js")
  ]);
  const a = app.initializeApp(firebaseConfig);
  let db;
  try {
    db = fs.initializeFirestore(a, {
      localCache: fs.persistentLocalCache({ tabManager: fs.persistentMultipleTabManager() })
    });
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

export async function signOutUser() {
  if (fb) await fb.authMod.signOut(fb.auth);
}

export async function useCloud(user) {
  const { db, fs } = await loadFirebase();
  const base = ["users", user.uid];
  const col = (name) => fs.collection(db, ...base, name);
  const metaRef = fs.doc(db, ...base, "meta", "main");

  const [essaySnap, roundSnap, metaSnap] = await Promise.all([
    fs.getDocs(col("essays")), fs.getDocs(col("rounds")), fs.getDoc(metaRef)
  ]);
  const meta = metaSnap.exists() ? metaSnap.data() : {};
  const loaded = {
    essays: essaySnap.docs.map((d) => d.data()),
    rounds: roundSnap.docs.map((d) => d.data()),
    mistakes: meta.mistakes || [],
    activeDays: meta.activeDays || [],
    settings: { sound: true, ...(meta.settings || {}) }
  };

  const report = (p) => p.catch((e) => { console.error(e); window.dispatchEvent(new CustomEvent("store-error", { detail: e })); });
  backend = {
    kind: "cloud", user,
    saveEssay: (e) => report(fs.setDoc(fs.doc(col("essays"), e.id), e)),
    deleteEssay: (id) => report(fs.deleteDoc(fs.doc(col("essays"), id))),
    saveRound: (r) => report(fs.setDoc(fs.doc(col("rounds"), r.id), r)),
    saveMeta: () => report(fs.setDoc(metaRef, {
      mistakes: state.mistakes, activeDays: state.activeDays, settings: state.settings
    }))
  };

  // Offer to copy anything saved on this device before signing in.
  const local = readLocal();
  const localCount = local.essays.length + local.rounds.length;
  if (localCount && confirm(`Copy ${localCount} item(s) saved on this device into your account?`)) {
    const seenE = new Set(loaded.essays.map((e) => e.id));
    const seenR = new Set(loaded.rounds.map((r) => r.id));
    const batch = fs.writeBatch(db);
    for (const e of local.essays) if (!seenE.has(e.id)) { loaded.essays.push(e); batch.set(fs.doc(col("essays"), e.id), e); }
    for (const r of local.rounds) if (!seenR.has(r.id)) { loaded.rounds.push(r); batch.set(fs.doc(col("rounds"), r.id), r); }
    loaded.activeDays = [...new Set([...loaded.activeDays, ...local.activeDays])].sort();
    loaded.mistakes = [...local.mistakes, ...loaded.mistakes].slice(0, MAX_MISTAKES);
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

// ── Mutations used by the app ────────────────────────────────────────────────
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

export function addMistake(puzzle) {
  state.mistakes = [puzzle, ...state.mistakes.filter((p) => p.key !== puzzle.key)].slice(0, MAX_MISTAKES);
  backend.saveMeta();
}

export function removeMistake(key) {
  state.mistakes = state.mistakes.filter((p) => p.key !== key);
  backend.saveMeta();
}

export function setSetting(name, value) {
  state.settings[name] = value;
  backend.saveMeta();
}
