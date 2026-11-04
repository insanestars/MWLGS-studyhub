// The full vocabulary list: original core words + parts A–D, de-duplicated.
// Each entry: { w, pos, def, ex, cat }
import { VOCAB as CORE } from "./words.js";
import { VOCAB_A } from "./vocab-a.js";
import { VOCAB_B } from "./vocab-b.js";
import { VOCAB_C } from "./vocab-c.js";
import { VOCAB_D } from "./vocab-d.js";

export const CATEGORIES = {
  character: "Describing people",
  emotion: "Emotions & moods",
  speech: "Speaking & writing",
  argument: "Argument & logic",
  mind: "Mind & knowledge",
  society: "Society, power & law",
  conflict: "Conflict & cooperation",
  action: "Change & action",
  amount: "Size & amount",
  time: "Time",
  quality: "Qualities of things",
  nature: "Nature & science",
  story: "Atmosphere words for stories",
  cool: "Cool words"
};

// Categories for the original core list.
const CORE_CAT = {
  character: "adamant affable amiable articulate audacious austere benevolent candid capricious conscientious cynical diligent dogmatic eccentric eloquent fastidious frugal gregarious haughty impartial impetuous indolent intrepid judicious magnanimous meticulous negligent nonchalant obstinate pragmatic prudent reticent resilient skeptical tenacious wary zealous novice proficient",
  emotion: "ambivalent apathy contrite despondent elated empathy fervent indifferent lament optimistic pessimistic reluctant reverence solemn vehement",
  speech: "admonish assert brevity concise equivocal hackneyed lucid verbose",
  argument: "ambiguous arbitrary cogent concede conjecture corroborate credible fallacy hypothesis implicit paradox plausible refute relevant substantiate validate vindicate",
  mind: "aberration contemplate discern enigma innate quandary scrutinize",
  society: "censure consensus conventional deference integrity",
  conflict: "acquiesce antagonize coerce deride placate",
  action: "abate abstain advocate alleviate bolster deplete deter emulate exacerbate jeopardize mitigate",
  amount: "disparity superfluous paramount prevalent ubiquitous",
  time: "ephemeral incessant inevitable obsolete unprecedented",
  quality: "aesthetic anomaly arduous complacent elusive erratic exemplary feasible futile innovative malleable mundane opaque precarious profound spontaneous stagnant tedious tentative trivial viable volatile",
  story: "ominous adversity perseverance"
};
const catOf = {};
for (const [c, words] of Object.entries(CORE_CAT)) for (const w of words.split(" ")) catOf[w] = c;

const seen = new Set();
export const VOCAB = [];
for (const [w, pos, def, ex, cat] of [
  ...CORE.map(([w, pos, def, ex]) => [w, pos, def, ex, catOf[w] || "quality"]),
  ...VOCAB_A, ...VOCAB_B, ...VOCAB_C, ...VOCAB_D
]) {
  if (seen.has(w)) continue;
  seen.add(w);
  VOCAB.push({ w, pos, def, ex, cat });
}
export const BY_WORD = Object.fromEntries(VOCAB.map((v) => [v.w, v]));
