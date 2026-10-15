// 权重消融实验：验证"分布不均是否由维度权重造成"
import { match, type PersonalityTypeInput } from "../src/lib/match";
import { QUESTIONS, PERSONALITY_TYPES } from "../src/data/quiz-content";
import { getActivePack } from "../src/pack/load";
import type { QuizPack } from "../src/pack/types";

const basePack = getActivePack();
const types: PersonalityTypeInput[] = PERSONALITY_TYPES.map((t) => ({
  code: t.code, name: t.name, group: t.group, vector: t.vector,
  slogan: t.slogan, desc: t.desc, special: t.special ?? false,
}));

const HIGH = ["S1", "F1", "B3", "W3"]; // 当前 1.5 权重的四维
const SCHEMES: Record<string, Record<string, number>> = {
  "当前(1.5×4)": { S1: 1.5, F1: 1.5, B3: 1.5, W3: 1.5 },
  "全部1.0": {},
  "高维2.0": { S1: 2, F1: 2, B3: 2, W3: 2 },
  "高维0.5(反转)": { S1: 0.5, F1: 0.5, B3: 0.5, W3: 0.5 },
};

function makePack(scheme: Record<string, number>): QuizPack {
  const weights: Record<string, number> = {};
  for (const d of basePack.dimensions) weights[d.code] = scheme[d.code] ?? 1.0;
  return { ...basePack, weights };
}

const N = 20000;
function entropy(counts: Map<string, number>): number {
  let h = 0;
  for (const c of counts.values()) {
    const p = c / N;
    h -= p * Math.log2(p);
  }
  return h;
}

for (const [label, scheme] of Object.entries(SCHEMES)) {
  const pack = makePack(scheme);
  const counts = new Map<string, number>();
  for (let i = 0; i < N; i++) {
    const dimScores: Record<string, number> = {};
    let gateValue: string | undefined, triggerFired: string | undefined;
    for (const q of QUESTIONS) {
      // 粉丝向模型：Q19 75% 信奇迹，Q18 = 25/25/30/20，其余均匀
      let idx = Math.floor(Math.random() * q.options.length);
      if (q.type === "trigger") idx = Math.random() < 0.75 ? 0 : 1;
      else if (q.type === "gate") { const r = Math.random(); idx = r < 0.25 ? 0 : r < 0.5 ? 1 : r < 0.8 ? 2 : 3; }
      const opt = q.options[idx];
      if (q.type === "gate") { gateValue = opt.value ?? gateValue; continue; }
      if (q.type === "trigger") { if (opt.trigger) triggerFired = opt.trigger; continue; }
      if (q.dim && q.dim !== "GATE" && q.dim !== "TRIGGER") dimScores[q.dim] = (dimScores[q.dim] ?? 0) + (opt.score ?? 0);
    }
    const r = match({ dimScores, gateValue, triggerFired }, types, pack);
    const key = r.group === "fallback" ? "UNSET" : r.name.replace(" · ", "·");
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  const sorted = [...counts.entries()].sort((a, b) => b[1] - a[1]);
  const top3 = sorted.slice(0, 3).reduce((s, [, c]) => s + c, 0) / N;
  const get = (n: string) => ((counts.get(n) ?? 0) / N) * 100;
  console.log(
    label.padEnd(12)
    + " 熵=" + entropy(counts).toFixed(2)
    + " Top3=" + (top3 * 100).toFixed(1) + "%"
    + " 汉娜=" + get("远野汉娜").toFixed(1) + "%"
    + " 鹿目圆=" + get("鹿目圆").toFixed(2) + "%"
    + " 艾玛=" + get("樱羽艾玛").toFixed(2) + "%"
    + " 蕾雅=" + get("莲见蕾雅").toFixed(1) + "%"
  );
}

// 归因：鹿目圆/远野汉娜与大众重心(期望档位 1.33)的逐维加权差
console.log("\n=== 洼地/头部角色 vs 大众重心（期望档位 1.33）逐维差距 ===");
const centroid = Array(12).fill(4 / 3);
const byName = (n: string) => types.find((t) => t.name === n)!;
for (const name of ["鹿目圆", "远野汉娜", "莲见蕾雅"]) {
  const v: number[] = [];
  for (const ch of byName(name).vector.replace(/-/g, "")) v.push({ L: 0, M: 1, H: 2, X: 3 }[ch] ?? 1);
  const parts = basePack.dimensions.map((d, i) => {
    const gap = centroid[i] - v[i];
    return gap === 0 ? null : d.code + (gap > 0 ? "↓" : "↑") + Math.abs(gap).toFixed(1);
  }).filter(Boolean);
  console.log(name.padEnd(6) + " 向量均值=" + (v.reduce((a, b) => a + b, 0) / 12).toFixed(2) + "  偏离维: " + parts.join(" "));
}
