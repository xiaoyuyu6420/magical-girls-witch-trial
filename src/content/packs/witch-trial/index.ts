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
    gateValues: ["destroy", "endure", "normal", "normal_alt"],
    gateBonus: {
      normal: { S2: 1 },
      normal_alt: { W1: 1 },
    },
    specialTriggers: {
      SPECIAL_A: { destroy: "YUKI", endure: "ETL" },
      SPECIAL_B: { destroy: "ETL", endure: "YUKI" },
      YUKI: { destroy: "YUKI", endure: "YUKI" },
      ETL: { destroy: "ETL", endure: "ETL" },
    },
    triggerGates: ["destroy", "endure"],
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
};

export default witchTrialPack;
