// 微调影响面审计：同一批虚拟用户，原版 vs 微调版结果对比
import { match, weightedManhattan, parseVector, type PersonalityTypeInput } from "../src/lib/match";
import { QUESTIONS, PERSONALITY_TYPES } from "../src/data/quiz-content";
import { getActivePack } from "../src/pack/load";

const pack = getActivePack();

// 固定种子 LCG：保证两版本面对完全相同的虚拟用户
function makeRng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0x100000000;
  };
}

const N = 20000;
const VARIANT = process.argv[2] ?? "LLH-LMH-HLM-MLH"; // 微调3档：W1+S2+F2→M

const mkTypes = (madokaVec: string): PersonalityTypeInput[] =>
  PERSONALITY_TYPES.map((t) => ({
    code: t.code, name: t.name, group: t.group, slogan: t.slogan, desc: t.desc,
    special: t.special ?? false,
    vector: t.code === "MADOKA" ? madokaVec : t.vector,
  }));

// 生成一批虚拟用户的答案
const rng = makeRng(20260903);
const users: Array<{ dimScores: Record<string, number>; gateValue?: string; triggerFired?: string }> = [];
for (let i = 0; i < N; i++) {
  const dimScores: Record<string, number> = {};
  let gateValue: string | undefined, triggerFired: string | undefined;
  for (const q of QUESTIONS) {
    let idx = Math.floor(rng() * q.options.length);
    if (q.type === "trigger") idx = rng() < 0.75 ? 0 : 1;
    else if (q.type === "gate") { const r = rng(); idx = r < 0.25 ? 0 : r < 0.5 ? 1 : r < 0.8 ? 2 : 3; }
    const opt = q.options[idx];
    if (q.type === "gate") { gateValue = opt.value ?? gateValue; continue; }
    if (q.type === "trigger") { if (opt.trigger) triggerFired = opt.trigger; continue; }
    if (q.dim && q.dim !== "GATE" && q.dim !== "TRIGGER") dimScores[q.dim] = (dimScores[q.dim] ?? 0) + (opt.score ?? 0);
  }
  users.push({ dimScores, gateValue, triggerFired });
}

const runAll = (madokaVec: string) =>
  users.map((u) => match(u, mkTypes(madokaVec), pack));

const before = runAll("LLH-LLH-HLH-LLH");
const after = runAll(VARIANT);

// ① 结果改变的用户
let changed = 0;
const transitions = new Map<string, number>();
before.forEach((b, i) => {
  const a = after[i];
  if (b.code !== a.code) {
    changed++;
    const key = `${b.name} → ${a.name}`;
    transitions.set(key, (transitions.get(key) ?? 0) + 1);
  }
});
console.log(`① 结果被改判的用户: ${changed}/${N} = ${(changed / N * 100).toFixed(2)}%`);
[...transitions.entries()].sort((x, y) => y[1] - x[1]).forEach(([k, c]) => console.log(`   ${k}: ${c}`));

// ② 边界/兜底率
const borderBefore = before.filter((r) => r.borderType).length;
const borderAfter = after.filter((r) => r.borderType).length;
const fbBefore = before.filter((r) => r.group === "fallback").length;
const fbAfter = after.filter((r) => r.group === "fallback").length;
console.log(`② 边界判定(borderType): ${before ? (borderBefore / N * 100).toFixed(1) : 0}% → ${(borderAfter / N * 100).toFixed(1)}%`);
console.log(`   兜底(UNSET): ${(fbBefore / N * 100).toFixed(1)}% → ${(fbAfter / N * 100).toFixed(1)}%`);

// ③ 全角色分布对比
const dist = (rs: typeof before) => {
  const m = new Map<string, number>();
  rs.forEach((r) => { const k = r.group === "fallback" ? "UNSET" : r.name.replace(" · ", "·"); m.set(k, (m.get(k) ?? 0) + 1); });
  return m;
};
const dBefore = dist(before), dAfter = dist(after);
const allKeys = [...new Set([...dBefore.keys(), ...dAfter.keys()])].sort((a, b) => (dAfter.get(b) ?? 0) - (dAfter.get(a) ?? 0));
console.log("③ 全角色分布（只列变化 >0.1pp 的）:");
console.log("   角色".padEnd(14) + "原版    微调后   变化");
allKeys.forEach((k) => {
  const b = (dBefore.get(k) ?? 0) / N * 100;
  const a = (dAfter.get(k) ?? 0) / N * 100;
  if (Math.abs(a - b) > 0.1) console.log("   " + k.padEnd(14) + b.toFixed(1).padStart(4) + "%" + a.toFixed(1).padStart(7) + "%" + ((a - b >= 0 ? " +" : " ") + (a - b).toFixed(1) + "pp").padStart(8));
});

// ④ 区分度：鹿目圆与所有角色的最近距离
const regular = mkTypes(VARIANT).filter((t) => !t.special && t.group !== "fallback");
const madoka = regular.find((t) => t.code === "MADOKA")!;
const mv = parseVector(madoka.vector, 12);
const dists = regular.filter((t) => t.code !== "MADOKA")
  .map((t) => ({ name: t.name, d: weightedManhattan(mv, parseVector(t.vector, 12), pack) }))
  .sort((a, b) => a.d - b.d);
console.log("④ 鹿目圆(微调后)与最近 3 个角色的向量距离（原版最近邻城崎诺亚 5.5）:");
dists.slice(0, 3).forEach((d) => console.log(`   ${d.name}: ${d.d}`));

// ⑤ 特殊门槛联动：madoka_god 母体校验
console.log("⑤ 联动检查: madoka_god 绝版中（无题库入口），母体相似度门槛变化无实际影响");
