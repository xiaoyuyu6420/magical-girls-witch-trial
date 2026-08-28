import type { QuizPack } from "@/pack/types";
import { DIMENSIONS, WEIGHTS, ALGO_CONFIG } from "./config";

/**
 * First Content Pack: 魔女审判
 * Engine config lives here. Questions/types remain in quiz-content + DB for seed/admin.
 */
export const witchTrialPack: QuizPack = {
  id: "witch-trial",
  version: 1,
  title: "魔女审判",
  dimensions: DIMENSIONS,
  weights: { ...WEIGHTS },
  algo: {
    tiers: ALGO_CONFIG.tiers,
    delta: ALGO_CONFIG.delta,
    threshold: ALGO_CONFIG.threshold,
  },
  rules: {
    gateValues: ["destroy", "seen", "peace", "undecided"],
    gateBonus: {
      peace: { S2: 1 },
      undecided: { W1: 1 },
    },
    specialTriggers: {
      // Q19 接过钥匙(SPECIAL_A) + Q18 路径 → 解锁觉醒变体
      SPECIAL_A: { destroy: "homura_devil", seen: "sayaka_siren" },
      SPECIAL_B: { destroy: "kyoko_pragmatist", seen: "madoka_god" },
    },
    triggerGates: ["destroy", "seen"],
    optionShuffle: "stable-by-question-id",
  },
  presentation: {
    hideTechnicalVectors: true,
    tierLabels: ["低语", "波动", "共鸣", "侵蚀"],
    result: {
      analysisTitleKey: "result.dimAnalysis",
      fitLabelKey: "result.factorResonanceLabel",
      youLabelKey: "result.you",
      idealLabelKey: "result.ideal",
    },
  },
  workIntro: "26 道情境题，观察你在关系、责任和自我保护之间的取舍。",
};

export default witchTrialPack;
