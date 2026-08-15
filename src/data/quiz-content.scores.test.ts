import { describe, it, expect } from "vitest";
import { QUESTIONS, PERSONALITY_TYPES } from "./quiz-content";

describe("quiz-content (posture system)", () => {
  it("26 题结构完整", () => {
    expect(QUESTIONS.length).toBe(26);
  });

  it("普通/天平/门控/触发题选项都有 posture A/B/C + score 1..5", () => {
    for (const q of QUESTIONS) {
      if (q.renderType === "weight") continue; // weight 题用 weight:: 编码，无 posture
      for (const o of q.options) {
        expect(["A", "B", "C"]).toContain(o.posture);
        expect(o.score).toBeGreaterThanOrEqual(1);
        expect(o.score).toBeLessThanOrEqual(5);
      }
    }
  });

  it("scale 天平题（Q8/Q22）选项带 tendency 值", () => {
    const scales = QUESTIONS.filter((q) => q.renderType === "scale");
    expect(scales.length).toBe(2);
    for (const q of scales) {
      expect(q.options.map((o) => o.value)).toEqual(["SACRIFICE", "OBSESSION"]);
    }
  });

  it("gate 门控题四路径 destroy/seen/peace/undecided", () => {
    const gate = QUESTIONS.find((q) => q.type === "gate");
    expect(gate).toBeDefined();
    expect(gate!.options.map((o) => o.value)).toEqual(["destroy", "seen", "peace", "undecided"]);
  });

  it("trigger 触发题 keyUnlocked true/false", () => {
    const trigger = QUESTIONS.find((q) => q.type === "trigger");
    expect(trigger).toBeDefined();
    expect(trigger!.options.map((o) => o.value)).toEqual(["true", "false"]);
  });

  it("weight 筹码题 7 组合 weight:: 编码", () => {
    const w = QUESTIONS.find((q) => q.renderType === "weight");
    expect(w).toBeDefined();
    expect(w!.options.length).toBe(7);
    for (const o of w!.options) {
      expect(o.label.startsWith("weight::")).toBe(true);
    }
  });

  it("5 角色含 prosecution/softlanding/tags 完整文案", () => {
    expect(PERSONALITY_TYPES.length).toBe(5);
    for (const t of PERSONALITY_TYPES) {
      expect(t.prosecution.length).toBeGreaterThan(10);
      expect(t.softlanding.length).toBeGreaterThan(10);
      expect(t.tags.split(",").length).toBeGreaterThanOrEqual(2);
    }
  });
});
