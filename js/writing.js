// Instant, free essay analysis (no AI). Heuristics tuned for 40-minute entrance-exam essays.

const TRANSITIONS = ["furthermore", "moreover", "in addition", "additionally", "however", "nevertheless", "nonetheless", "on the other hand", "in contrast", "consequently", "as a result", "therefore", "thus", "for example", "for instance", "admittedly", "although", "similarly", "likewise", "ultimately", "in conclusion", "finally", "first", "second", "third", "meanwhile", "afterward", "suddenly", "eventually", "later", "at first", "in the end"];
const VAGUE = ["very", "really", "things", "thing", "stuff", "a lot", "lots", "good", "bad", "nice", "got", "kind of", "sort of", "basically", "literally", "awesome", "huge", "big deal"];
const STOP = new Set("the a an and or but of to in on at for with is was were are be been it its this that these those i me my we our you your he she they them his her their as by from so if not no do did does have has had would could should will can just than then there here what when where who which how all any some more most very also into out up about over after before because while".split(" "));
const SENSORY = ["saw", "see", "seen", "looked", "heard", "hear", "sound", "smell", "smelled", "scent", "taste", "tasted", "felt", "touch", "cold", "warm", "hot", "bright", "dark", "loud", "quiet", "silent", "rough", "smooth", "sharp", "sweet", "bitter", "trembl", "shook", "pounding", "whisper", "glow", "shadow"];
const REFLECT = ["learned", "realized", "realised", "understand", "understood", "taught me", "now i", "looking back", "i know now", "changed", "lesson", "since then", "to this day", "made me", "i see now", "i discovered"];
const COUNTER = ["some argue", "some people", "critics", "opponents", "others believe", "others may", "although", "admittedly", "it is true that", "on the other hand", "while some", "skeptics", "some may say", "some might"];
const THESIS = ["should", "must", "ought", "because", "therefore", "it is essential", "i believe", "is better", "is worse", "is necessary", "should not"];

const count = (text, words) => words.reduce((n, w) => n + (text.match(new RegExp(`\\b${w}`, "gi")) || []).length, 0);

export function analyze(raw, type) {
  const text = (raw || "").replace(/\r/g, "").trim();
  const lower = text.toLowerCase();
  const words = text.match(/[A-Za-z’']+/g) || [];
  const paras = text.split(/\n\s*\n|\n(?=\s{2,})/).map((p) => p.trim()).filter((p) => p.split(/\s+/).length > 3);
  const sentences = text.split(/(?<=[.!?])\s+(?=[A-Z“"])/).map((x) => x.trim()).filter((x) => x.split(/\s+/).length > 1);
  const lens = sentences.map((x) => x.split(/\s+/).length);
  const avg = lens.length ? lens.reduce((a, b) => a + b, 0) / lens.length : 0;
  const sd = lens.length ? Math.sqrt(lens.reduce((a, b) => a + (b - avg) ** 2, 0) / lens.length) : 0;
  const transitions = TRANSITIONS.filter((t) => new RegExp(`\\b${t}\\b`, "i").test(lower));
  const vague = VAGUE.map((v) => [v, (lower.match(new RegExp(`\\b${v}\\b`, "g")) || []).length]).filter(([, n]) => n > 0).sort((a, b) => b[1] - a[1]);
  const freq = {};
  for (const w of words.map((w) => w.toLowerCase().replace(/[’']s$/, ""))) if (w.length > 3 && !STOP.has(w)) freq[w] = (freq[w] || 0) + 1;
  const repeated = Object.entries(freq).filter(([, n]) => n >= 4).sort((a, b) => b[1] - a[1]).slice(0, 6);
  const longWords = words.filter((w) => w.length >= 8).length;
  const first = (paras[0] || sentences.slice(0, 3).join(" ")).toLowerCase();
  const last = (paras[paras.length - 1] || "").toLowerCase();
  const openers = sentences.map((x) => x.split(/\s+/)[0].toLowerCase());
  const sameOpeners = Object.entries(openers.reduce((a, o) => ((a[o] = (a[o] || 0) + 1), a), {})).filter(([, n]) => n >= 4 && n / openers.length > 0.25);

  const checks = [];
  const add = (ok, msg) => checks.push({ ok, msg });
  const W = words.length;
  add(W >= 350, W >= 350 ? `Length: ${W} words — a solid amount for 40 minutes.` : `Length: ${W} words. Aim for 350–550 in 40 minutes; spend less time planning if you're running short.`);
  add(paras.length >= 4, paras.length >= 4 ? `${paras.length} paragraphs — clear structure.` : `Only ${paras.length || 1} paragraph${paras.length === 1 ? "" : "s"} detected. Use 4–6 (intro, body, ${type === "argumentative" ? "counterargument, " : ""}conclusion). Leave a blank line between paragraphs when transcribing.`);
  add(sd >= 5, sd >= 5 ? "Good sentence variety (mix of short and long)." : "Sentences are similar in length — add a few short, punchy sentences or a longer, flowing one.");
  add(avg <= 26, avg <= 26 ? `Average sentence: ${avg.toFixed(0)} words.` : `Average sentence is ${avg.toFixed(0)} words — some sentences may be run-ons. Split them up.`);
  add(transitions.length >= 4, transitions.length >= 4 ? `Uses transitions (${transitions.slice(0, 5).join(", ")}…).` : `Few transitions (${transitions.join(", ") || "none"}). Add words like however, furthermore, as a result${type === "narrative" ? ", eventually, at first" : ""}.`);
  if (vague.length) add(vague.reduce((a, [, n]) => a + n, 0) <= 3, `Vague words: ${vague.slice(0, 5).map(([v, n]) => `“${v}” ×${n}`).join(", ")}. Replace them with precise words.`);
  if (repeated.length) add(false, `Repeated a lot: ${repeated.map(([w, n]) => `${w} (${n})`).join(", ")}. Try synonyms.`);
  if (sameOpeners.length) add(false, `Many sentences start with “${sameOpeners[0][0]}”. Vary how sentences begin.`);
  const hook = sentences[0] || "";
  add(!/^(one day|in this essay|i am going to|hello|my name is|since the dawn of time|throughout history)/i.test(hook.trim()), /^(one day|in this essay|i am going to|hello|my name is|since the dawn of time|throughout history)/i.test(hook.trim()) ? `Weak opening: “${hook.slice(0, 60)}…”. Start with action, dialogue, a question or a striking fact.` : "Opening avoids clichés.");

  if (type === "argumentative") {
    add(THESIS.some((t) => first.includes(t)), THESIS.some((t) => first.includes(t)) ? "Introduction appears to state a position." : "No clear position found in the introduction. State your thesis plainly: “Schools should… because…”.");
    const c = count(lower, COUNTER);
    add(c > 0, c > 0 ? "Addresses the other side (counterargument)." : "No counterargument found. Add “Some argue that… However…” and rebut it.");
    const ex = count(lower, ["for example", "for instance", "such as", "according to", "studies", "research", "percent", "%", "survey", "data"]);
    add(ex >= 2, ex >= 2 ? `Uses evidence/examples (${ex} signals).` : "Few evidence signals. Back each reason with an example, a statistic or an expert.");
    const fp = (lower.match(/\bi (think|believe|feel)\b/g) || []).length;
    if (fp) add(false, `“I think / I believe” used ${fp}× — state claims directly for a more formal tone.`);
    const contr = (text.match(/\b\w+n['’]t\b|\b(it|that|there|what)['’]s\b|\b\w+['’](re|ll|ve|d)\b/gi) || []).length;
    if (contr >= 3) add(false, `${contr} contractions (don't, it's…). Formal essays usually spell them out.`);
    add(/(in conclusion|ultimately|therefore|to conclude|clearly|for these reasons)/.test(last), /(in conclusion|ultimately|therefore|to conclude|clearly|for these reasons)/.test(last) ? "Conclusion signals a wrap-up." : "Conclusion doesn't clearly restate your position — echo the thesis in new words.");
  } else {
    const sens = count(lower, SENSORY);
    add(sens >= 4, sens >= 4 ? `Sensory detail present (${sens} sensory words).` : "Little sensory detail. Show sights, sounds, textures and feelings in the key moment.");
    const ref = count(lower, REFLECT);
    add(ref >= 2, ref >= 2 ? "Includes reflection on what you learned." : "Reflection is thin. Explain what the experience taught you and how you changed — usually a full paragraph.");
    const dlg = (text.match(/[“"][^”"]{3,}[”"]/g) || []).length;
    add(dlg > 0, dlg > 0 ? `Uses dialogue (${dlg} line${dlg > 1 ? "s" : ""}).` : "No dialogue. One or two lines of dialogue can bring a scene to life.");
    add(REFLECT.some((r) => last.includes(r)) || /(now|today|still|since)/.test(last), REFLECT.some((r) => last.includes(r)) || /(now|today|still|since)/.test(last) ? "Ending connects to the present / the lesson." : "Ending doesn't reflect. Finish by connecting the story to who you are now.");
  }
  return {
    stats: { words: W, paragraphs: paras.length, sentences: sentences.length, avgSentence: Math.round(avg), wpm: Math.round(W / 40 * 10) / 10, advanced: longWords },
    checks,
    score: checks.filter((c) => c.ok).length, max: checks.length
  };
}
