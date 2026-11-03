// Security-rules test. Needs the Firestore emulator on :8080 and `npm i @firebase/rules-unit-testing firebase`.
// Run: node tests/rules.test.js firestore.rules
import { initializeTestEnvironment, assertSucceeds, assertFails } from "@firebase/rules-unit-testing";
import { doc, getDoc, setDoc, deleteDoc, collection, getDocs } from "firebase/firestore";
import { readFileSync } from "node:fs";
const env = await initializeTestEnvironment({ projectId: "demo-studyhub",
  firestore: { rules: readFileSync(process.argv[2], "utf8"), host: "127.0.0.1", port: 8080 } });
const alice = env.authenticatedContext("alice").firestore();
const bob = env.authenticatedContext("bob").firestore();
const anon = env.unauthenticatedContext().firestore();
const t = async (name, p) => { await p; console.log("✓", name); };
await t("alice writes her own essay", assertSucceeds(setDoc(doc(alice, "users/alice/essays/e1"), { score: 4 })));
await t("alice reads her own essay", assertSucceeds(getDoc(doc(alice, "users/alice/essays/e1"))));
await t("alice lists her essays", assertSucceeds(getDocs(collection(alice, "users/alice/essays"))));
await t("alice writes her meta doc", assertSucceeds(setDoc(doc(alice, "users/alice/meta/main"), { mistakes: [] })));
await t("alice deletes her essay", assertSucceeds(deleteDoc(doc(alice, "users/alice/essays/e1"))));
await setDoc(doc(alice, "users/alice/essays/e2"), { score: 3 });
await t("bob CANNOT read alice's essay", assertFails(getDoc(doc(bob, "users/alice/essays/e2"))));
await t("bob CANNOT list alice's essays", assertFails(getDocs(collection(bob, "users/alice/essays"))));
await t("bob CANNOT write into alice's data", assertFails(setDoc(doc(bob, "users/alice/essays/hack"), { x: 1 })));
await t("bob CANNOT delete alice's essay", assertFails(deleteDoc(doc(bob, "users/alice/essays/e2"))));
await t("signed-out user CANNOT read", assertFails(getDoc(doc(anon, "users/alice/essays/e2"))));
await t("signed-out user CANNOT write", assertFails(setDoc(doc(anon, "users/alice/essays/x"), { x: 1 })));
await t("nobody can write outside /users", assertFails(setDoc(doc(alice, "public/x"), { x: 1 })));
await env.cleanup();
console.log("All security rule checks passed.");
