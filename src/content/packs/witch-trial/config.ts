import type { DimDef, AlgoConfig } from "@/pack/types";

export const DIMENSIONS: readonly DimDef[] = [
  { code: "S1", name: "严厉度", model: "S", modelName: "审判", dir: "L=宽容 → H=严苛" },
  { code: "S2", name: "直觉度", model: "S", modelName: "审判", dir: "L=理性 → H=感性" },
  { code: "S3", name: "宽恕度", model: "S", modelName: "审判", dir: "L=不宽恕 → H=易宽恕" },
  { code: "F1", name: "复仇心", model: "F", modelName: "侵蚀", dir: "L=无复仇心 → H=强烈复仇" },
  { code: "F2", name: "绝望度", model: "F", modelName: "侵蚀", dir: "L=从不绝望 → H=容易绝望" },
  { code: "F3", name: "执念度", model: "F", modelName: "侵蚀", dir: "L=随遇而安 → H=极度执着" },
  { code: "B1", name: "信任度", model: "B", modelName: "羁绊", dir: "L=封闭 → H=开放" },
  { code: "B2", name: "背叛感", model: "B", modelName: "羁绊", dir: "L=不在意 → H=极度敏感" },
  { code: "B3", name: "犠牲度", model: "B", modelName: "羁绊", dir: "L=自我优先 → H=甘愿牺牲" },
  { code: "W1", name: "压抑力", model: "W", modelName: "觉醒", dir: "L=不压抑 → H=强力压抑" },
  { code: "W2", name: "理性力", model: "W", modelName: "觉醒", dir: "L=感性驱动 → H=理性维系" },
  { code: "W3", name: "本能度", model: "W", modelName: "觉醒", dir: "L=克制 → H=放任" },
];

export type DimCode = (typeof DIMENSIONS)[number]["code"];

export const WEIGHTS: Record<DimCode, number> = {
  S1: 1.5, S2: 1.0, S3: 1.0,
  F1: 1.5, F2: 1.0, F3: 1.0,
  B1: 1.0, B2: 1.0, B3: 1.5,
  W1: 1.0, W2: 1.0, W3: 1.5,
};

export const ALGO_CONFIG: AlgoConfig = {
  tiers: [
    { max: 2, label: "L", value: 0 },
    { max: 4, label: "M", value: 1 },
    { max: 5, label: "H", value: 2 },
    { max: 6, label: "X", value: 3 },
  ],
  delta: 3,
  threshold: 40,
};
