import { describe, it, expect } from "vitest";
import { pickAnnotation, ANNOTATION_POOLS, type AnnotationNode } from "./annotations";
import type { QuizPack } from "@/pack/types";

// 最小 pack：2 个维度 + algo.tiers（与 witch-trial 一致：[2,4,5,6]→[L,M,H,X]）
const mockPack: QuizPack = {
  id: "test",
  version: 1,
  title: "test",
  dimensions: [
    { code: "S1", name: "严厉/宽容倾向", model: "S", modelName: "评判", dir: "" },
    { code: "F1", name: "复仇/释怀倾向", model: "F", modelName: "执念", dir: "" },
  ],
  weights: { S1: 1.5, F1: 1.5 },
  algo: {
    tiers: [
      { max: 2, label: "L", value: 0 },
      { max: 4, label: "M", value: 1 },
      { max: 5, label: "H", value: 2 },
      { max: 6, label: "X", value: 3 },
    ],
    delta: 3,
    threshold: 40,
  },
  rules: {
    gateValues: [],
    gateBonus: {},
    specialTriggers: {},
    triggerGates: [],
    optionShuffle: "none",
  },
  presentation: {
    hideTechnicalVectors: true,
    tierLabels: ["低", "中", "高", "极"],
    result: { analysisTitleKey: "", fitLabelKey: "", youLabelKey: "", idealLabelKey: "" },
  },
};

// 确定性 rng：永远返回 0（选池中第一条）
const rngFirst = () => 0;

describe("pickAnnotation", () => {
  describe("档位判定（主导维度 sum 决定 H/M/L）", () => {
    it("主导维度 sum ≤ 2 → L 档（scoreToTier=0）", () => {
      const dimScores = { S1: 2, F1: 1 }; // 主导 S1=2 → tier 0 → L
      const result = pickAnnotation(5, dimScores, mockPack, rngFirst);
      expect(result).toBe(ANNOTATION_POOLS[5].L[0]);
    });

    it("主导维度 sum 3-4 → M 档（scoreToTier=1）", () => {
      const dimScores = { S1: 4, F1: 1 }; // 主导 S1=4 → tier 1 → M
      const result = pickAnnotation(10, dimScores, mockPack, rngFirst);
      expect(result).toBe(ANNOTATION_POOLS[10].M[0]);
    });

    it("主导维度 sum 5 → H 档（scoreToTier=2）", () => {
      const dimScores = { S1: 5, F1: 1 }; // 主导 S1=5 → tier 2 → H
      const result = pickAnnotation(15, dimScores, mockPack, rngFirst);
      expect(result).toBe(ANNOTATION_POOLS[15].H[0]);
    });

    it("主导维度 sum 6 → H 档（scoreToTier=3=X，归并到 H）", () => {
      const dimScores = { S1: 6, F1: 1 }; // 主导 S1=6 → tier 3(X) → H
      const result = pickAnnotation(5, dimScores, mockPack, rngFirst);
      expect(result).toBe(ANNOTATION_POOLS[5].H[0]);
    });
  });

  describe("主导维度选取", () => {
    it("取 sum 最高的维度作主导", () => {
      const dimScores = { S1: 2, F1: 5 }; // 主导 F1=5 → H
      const result = pickAnnotation(5, dimScores, mockPack, rngFirst);
      expect(result).toBe(ANNOTATION_POOLS[5].H[0]);
    });

    it("并列时取先遍历到的维度（pack.dimensions 顺序）", () => {
      const dimScores = { S1: 5, F1: 5 }; // 并列，取 S1（dimensions[0]）
      const result = pickAnnotation(5, dimScores, mockPack, rngFirst);
      // 两者都 5 → H 档，结果应为 H 池第一条
      expect(result).toBe(ANNOTATION_POOLS[5].H[0]);
    });
  });

  describe("三节点递进", () => {
    it("5/10/15 节点返回各自池中的文案", () => {
      const dimScores = { S1: 5 }; // H 档
      const r5 = pickAnnotation(5, dimScores, mockPack, rngFirst);
      const r10 = pickAnnotation(10, dimScores, mockPack, rngFirst);
      const r15 = pickAnnotation(15, dimScores, mockPack, rngFirst);
      expect(r5).toBe(ANNOTATION_POOLS[5].H[0]);
      expect(r10).toBe(ANNOTATION_POOLS[10].H[0]);
      expect(r15).toBe(ANNOTATION_POOLS[15].H[0]);
      // 三节点语气不同，文案不同
      expect(r5).not.toBe(r10);
      expect(r10).not.toBe(r15);
    });
  });

  describe("rng 确定性", () => {
    it("同 rng 输入 → 同输出", () => {
      const dimScores = { S1: 5 };
      const a = pickAnnotation(5, dimScores, mockPack, () => 0.5);
      const b = pickAnnotation(5, dimScores, mockPack, () => 0.5);
      expect(a).toBe(b);
    });

    it("不同 rng → 可能选不同变体", () => {
      const dimScores = { S1: 5 }; // H 档，node 5 的 H 池有 2 条变体
      const first = pickAnnotation(5, dimScores, mockPack, () => 0);
      const second = pickAnnotation(5, dimScores, mockPack, () => 0.99);
      expect(first).toBe(ANNOTATION_POOLS[5].H[0]);
      expect(second).toBe(ANNOTATION_POOLS[5].H[1]);
      expect(first).not.toBe(second);
    });
  });

  describe("边界与 fallback", () => {
    it("空 dimScores → 退化为 L 档（所有维度0分，主导维度 scoreToTier(0)=0→L）", () => {
      const result = pickAnnotation(5, {}, mockPack, rngFirst);
      expect(result).toBe(ANNOTATION_POOLS[5].L[0]);
    });

    it("dimScores 全 0 → fallback（无主导维度 maxSum=0 会被 S1=0 占据，tier=L）", () => {
      // 注意：全0时 S1=0 也是最高，scoreToTier(0)=0→L 档，返回 L 池第一条（非 fallback）
      const result = pickAnnotation(5, { S1: 0, F1: 0 }, mockPack, rngFirst);
      expect(result).toBe(ANNOTATION_POOLS[5].L[0]);
    });
  });

  describe("R9 合规：不含剧透信息", () => {
    it("所有文案都不含维度 code（S1/F1 等）", () => {
      const allTexts = Object.values(ANNOTATION_POOLS)
        .flatMap((byTier) => Object.values(byTier))
        .flat();
      for (const text of allTexts) {
        expect(text).not.toMatch(/\b(S1|S2|S3|F1|F2|F3|B1|B2|B3|W1|W2|W3)\b/);
      }
    });

    it("所有文案都不含百分比", () => {
      const allTexts = Object.values(ANNOTATION_POOLS)
        .flatMap((byTier) => Object.values(byTier))
        .flat();
      for (const text of allTexts) {
        expect(text).not.toMatch(/\d+\s*%/);
      }
    });
  });
});
