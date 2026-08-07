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
      SPECIAL_A: { destroy: "YUKI", seen: "ETL" },
      SPECIAL_B: { destroy: "ETL", seen: "YUKI" },
      YUKI: { destroy: "YUKI", seen: "YUKI" },
      ETL: { destroy: "ETL", seen: "ETL" },
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
  workIntro: "一部关于「在死亡回溯中守住一个人」的故事",
};

export default witchTrialPack;
