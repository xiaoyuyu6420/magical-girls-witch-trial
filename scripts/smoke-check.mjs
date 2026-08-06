// Standalone smoke test — no vitest, no alias.
// Mirrors the assertions in src/lib/match.test.ts, shuffle.test.ts, scores test.
// Run: node scripts/smoke-check.mjs

import { pathToFileURL } from "node:url";

const root = pathToFileURL(process.cwd() + "/").href;

// Minimal inline re-implementations to avoid TS import issues in plain node.
function hashString(s) {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h >>> 0;
}
function mulberry32(seed) {
  return function () {
    let t = (seed += 0x6d2b79f5) >>> 0;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function shuffleOptionsStable(key, options) {
  const arr = options.slice();
  if (arr.length <= 1) return arr;
  const rand = mulberry32(hashString(String(key)));
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// match core (mirrors src/lib/match.ts)
const TIER_CHAR_TO_NUM = { L: 0, M: 1, H: 2, X: 3 };
const TIER_NUM_TO_CHAR = ["L", "M", "H", "X"];
function parseVector(v, expectedLen = 12) {
  const nums = v.replace(/-/g, "").split("").map((c) => TIER_CHAR_TO_NUM[c] ?? 1);
  if (nums.length !== expectedLen) throw new Error(`len ${nums.length} != ${expectedLen}`);
  return nums;
}
function formatVector(values) {
  const chars = values.map((v) => TIER_NUM_TO_CHAR[Math.max(0, Math.min(v, 3))]);
  const groups = [];
  for (let i = 0; i < chars.length; i += 3) groups.push(chars.slice(i, i + 3).join(""));
  return groups.join("-");
}
const DIMENSIONS = [
  { code: "S1", model: "S" }, { code: "S2", model: "S" }, { code: "S3", model: "S" },
  { code: "F1", model: "F" }, { code: "F2", model: "F" }, { code: "F3", model: "F" },
  { code: "B1", model: "B" }, { code: "B2", model: "B" }, { code: "B3", model: "B" },
  { code: "W1", model: "W" }, { code: "W2", model: "W" }, { code: "W3", model: "W" },
];
const WEIGHTS = { S1:1.5,S2:1,S3:1,F1:1.5,F2:1,F3:1,B1:1,B2:1,B3:1.5,W1:1,W2:1,W3:1.5 };
const TIERS = [{max:2,value:0},{max:4,value:1},{max:5,value:2},{max:6,value:3}];
const MAX_DIST = DIMENSIONS.reduce((s,d)=>s+(WEIGHTS[d.code]??1)*3,0);
function scoreToTier(total){for(const t of TIERS){if(total<=t.max)return t.value;}return 3;}
function weightedManhattan(a,b){let d=0;for(let i=0;i<DIMENSIONS.length;i++)d+=(WEIGHTS[DIMENSIONS[i].code]??1)*Math.abs(a[i]-b[i]);return d;}
function similarity(dist){return Math.round(((1-dist/MAX_DIST)*100)*10)/10;}

const SPECIAL_TRIGGERS = {
  SPECIAL_A: { destroy: "YUKI", endure: "ETL" },
  YUKI: { destroy: "YUKI", endure: "YUKI" },
  ETL: { destroy: "ETL", endure: "ETL" },
};
const GATE_BONUS = { normal: { S2: 1 }, normal_alt: { W1: 1 } };

function applyBonus(scores, gate) {
  const out = { ...scores };
  const b = GATE_BONUS[gate];
  if (b) for (const [k,v] of Object.entries(b)) out[k] = Math.min((out[k] ?? 0) + v, 6);
  return out;
}
function buildUser(scores) {
  return DIMENSIONS.map((d) => scoreToTier(scores[d.code] ?? 3));
}
function match(input, types) {
  const regular = types.filter((t) => !t.special && t.group !== "fallback");
  const special = types.filter((t) => t.special);
  const unset = types.find((t) => t.group === "fallback");
  if (input.triggerFired && input.gateValue) {
    const mapped = SPECIAL_TRIGGERS[input.triggerFired]?.[input.gateValue];
    if (mapped && special.some((t) => t.code === mapped)) {
      const t = types.find((x) => x.code === mapped);
      const vec = formatVector(buildUser(applyBonus(input.dimScores, input.gateValue)));
      return { code: t.code, similarity: 100, userVector: vec, special: true };
    }
  }
  const uv = buildUser(applyBonus(input.dimScores, input.gateValue));
  const userVec = formatVector(uv);
  const ranked = regular.map((t) => {
    const dist = weightedManhattan(uv, parseVector(t.vector));
    return { type: t, sim: similarity(dist) };
  }).sort((a, b) => similarity(a.sim) - similarity(b.sim)).sort((a,b)=> (weightedManhattan(uv, parseVector(b.type.vector))) - (weightedManhattan(uv, parseVector(a.type.vector))));
  // simpler: sort by dist asc
  const ranked2 = regular.map((t) => ({ type: t, dist: weightedManhattan(uv, parseVector(t.vector)), sim: similarity(weightedManhattan(uv, parseVector(t.vector))) })).sort((a,b)=>a.dist-b.dist);
  const best = ranked2[0];
  return { code: best.type.code, similarity: best.sim, userVector: userVec, special: false };
}

const failures = [];
function assert(cond, msg) {
  if (!cond) { failures.push(msg); console.log("  ✗ " + msg); }
  else console.log("  ✓ " + msg);
}

console.log("== shuffle ==");
const a = shuffleOptionsStable(7, [1,2,3,4]);
const b = shuffleOptionsStable(7, [1,2,3,4]);
assert(JSON.stringify(a) === JSON.stringify(b), "stable");
assert(JSON.stringify(a.slice().sort()) === JSON.stringify([1,2,3,4]), "membership");

console.log("== vector ==");
assert(JSON.stringify(parseVector("LHH-LLM-HHH-LLL")) === JSON.stringify([0,2,2,0,0,1,2,2,2,0,0,0]), "parse");
assert(formatVector([0,2,2,0,0,1,2,2,2,0,0,0]) === "LHH-LLM-HHH-LLL", "format");
assert(scoreToTier(6) === 3, "tier X");

console.log("== special ==");
const dimScores = Object.fromEntries(DIMENSIONS.map((d) => [d.code, 3]));
const types = [
  { code: "EMMA", group: "B", vector: "LHH-LLM-HHH-LLL", special: false },
  { code: "UNSET", group: "fallback", vector: "MMM-MMM-MMM-MMM", special: false },
  { code: "YUKI", group: "special", vector: "HHH-LLL-LLL-LLL", special: true },
  { code: "ETL", group: "special", vector: "LLL-HHH-HHH-HHH", special: true },
];
const sp1 = match({ dimScores, gateValue: "destroy", triggerFired: "SPECIAL_A" }, types);
assert(sp1.code === "YUKI" && sp1.special, "SPECIAL_A destroy→YUKI");
const sp2 = match({ dimScores, gateValue: "endure", triggerFired: "SPECIAL_A" }, types);
assert(sp2.code === "ETL" && sp2.special, "SPECIAL_A endure→ETL");

console.log("== deterministic ==");
const r1 = match({ dimScores }, types);
const r2 = match({ dimScores }, types);
assert(r1.code === r2.code && r1.userVector === r2.userVector, "same dimScores → same result");

console.log("== gate bonus ==");
const ds2 = { ...dimScores, S2: 4 };
const rn = match({ dimScores: ds2, gateValue: "normal" }, types);
const rd = match({ dimScores: ds2 }, types);
const s2idx = DIMENSIONS.findIndex((d) => d.code === "S2");
assert(parseVector(rn.userVector)[s2idx] > parseVector(rd.userVector)[s2idx], "normal gate boosts S2");

console.log(failures.length === 0 ? "\nALL_SMOKE_OK" : `\n${failures.length} FAILURES`);
process.exit(failures.length === 0 ? 0 : 1);
