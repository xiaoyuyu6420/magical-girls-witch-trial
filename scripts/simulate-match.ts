// 角色分布体检：多作答模型 × 分布 + 向量几何诊断
// 用法: npx tsx scripts/simulate-match.ts（默认多模型对比）
import { match, weightedManhattan, similarity, parseVector, type PersonalityTypeInput } from "../src/lib/match";
import { QUESTIONS, PERSONALITY_TYPES } from "../src/data/quiz-content";
import { getActivePack } from "../src/pack/load";

const pack = getActivePack();
const types: PersonalityTypeInput[] = PERSONALITY_TYPES.map((t) => ({
  code: t.code, name: t.name, group: t.group, vector: t.vector,
  slogan: t.slogan, desc: t.desc, special: t.special ?? false,
}));
const regular = types.filter((t) => !t.special && t.group !== "fallback");

// ---- 作答模型 ----
const MODELS: Record<string, (q: (typeof QUESTIONS)[number]) => number> = {
  均匀随机: () => -1, // 特殊处理
  两端倾向: (q) => (q.options.length === 3 ? sample([0.42, 0.16, 0.42]) : Math.floor(Math.random() * q.options.length)),
  偏后选项: (q) => (q.options.length === 3 ? sample([0.2, 0.3, 0.5]) : q.options.length === 4 ? sample([0.15, 0.2, 0.3, 0.35]) : sample([0.35, 0.65])),
  粉丝向: (q) => {
    if (q.type === "trigger") return Math.random() < 0.75 ? 0 : 1;
    if (q.type === "gate") return sample([0.25, 0.25, 0.3, 0.2]);
    return Math.floor(Math.random() * q.options.length);
  },
};

function sample(probs: number[]): number {
  let r = Math.random();
  for (let i = 0; i < probs.length; i++) if ((r -= probs[i]) < 0) return i;
  return probs.length - 1;
}

const N = 20000;
const results: Record<string, Map<string, number>> = {};

for (const [mode, picker] of Object.entries(MODELS)) {
  const counts = new Map<string, number>();
  for (let i = 0; i < N; i++) {
    const dimScores: Record<string, number> = {};
    let gateValue: string | undefined, triggerFired: string | undefined;
    for (const q of QUESTIONS) {
      const idx = mode === "均匀随机" ? Math.floor(Math.random() * q.options.length) : picker(q);
      const opt = q.options[idx];
      if (q.type === "gate") { gateValue = opt.value ?? gateValue; continue; }
      if (q.type === "trigger") { if (opt.trigger) triggerFired = opt.trigger; continue; }
      if (q.dim && q.dim !== "GATE" && q.dim !== "TRIGGER") dimScores[q.dim] = (dimScores[q.dim] ?? 0) + (opt.score ?? 0);
    }
    const r = match({ dimScores, gateValue, triggerFired }, types, pack);
    const key = r.group === "fallback" ? "UNSET" : r.name.replace(" · ", "·");
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  results[mode] = counts;
}

// ---- 输出对比表 ----
const allNames = [...new Set(Object.values(results).flatMap((m) => [...m.keys()]))];
const header = "角色".padEnd(16) + Object.keys(results).map((m) => m.padStart(10)).join("");
console.log("=== 各作答模型命中率 (N=" + N + ") ===");
console.log(header);
for (const name of allNames) {
  const row = Object.values(results).map((m) => (((m.get(name) ?? 0) / N) * 100).toFixed(1).padStart(9) + "%").join("");
  console.log(name.padEnd(16) + row);
}

// ---- 向量几何诊断 ----
// 重心向量：均匀随机作答下每维档位期望 L=1/9,M=5/9,H=2/9,X=1/9 → 期望值 4/3
const centroid = Array(12).fill(4 / 3);
const diag = regular.map((t) => {
  const v = parseVector(t.vector, 12);
  const dCenter = weightedManhattan(centroid, v, pack);
  let dNearest = Infinity;
  let nearest = "";
  for (const o of regular) {
    if (o.code === t.code) continue;
    const d = weightedManhattan(v, parseVector(o.vector, 12), pack);
    if (d < dNearest) { dNearest = d; nearest = o.name; }
  }
  return { name: t.name, simCenter: similarity(dCenter, pack), dNearest, nearest };
});
console.log("\n=== 向量几何诊断（regular 角色）===");
console.log("角色".padEnd(10) + "对大众重心相似度".padStart(12) + "  最近邻距离(遮蔽风险)  最近邻");
diag.sort((a, b) => b.simCenter - a.simCenter).forEach((d) => {
  console.log(d.name.padEnd(10) + String(d.simCenter).padStart(10) + "%" + String(d.dNearest).padStart(14) + "      " + d.nearest);
});

// ---- 可达性检查 ----
const reachableTriggers = new Set<string>();
for (const q of QUESTIONS) for (const o of q.options) if (o.trigger) reachableTriggers.add(o.trigger);
const specials = types.filter((t) => t.special);
console.log("\n=== 特殊角色可达性 ===");
for (const s of specials) {
  const viaMap = Object.entries(pack.rules.specialTriggers)
    .flatMap(([tok, gates]) => Object.entries(gates).filter(([, code]) => code === s.code).map(([g]) => `${tok}+${g}`));
  const hasToken = viaMap.some((path) => reachableTriggers.has(path.split("+")[0]));
  console.log(`${s.name.padEnd(16)} ${hasToken ? "可达 (" + viaMap.join(", ") + ")" : "❌ 绝版（无题库入口）"}`);
}
