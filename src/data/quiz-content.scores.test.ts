import { describe, it, expect } from "vitest";
import { QUESTIONS, PERSONALITY_TYPES } from "./quiz-content";

const DIM_CODES = ["S1", "S2", "S3", "F1", "F2", "F3", "B1", "B2", "B3", "W1", "W2", "W3"];

describe("quiz-content (12-dim system)", () => {
  it("26 题结构完整", () => {
    expect(QUESTIONS.length).toBe(26);
  });

  it("普通题维度覆盖：12 维各 2 题，无多余维度", () => {
    const normalDims = QUESTIONS
      .filter((q) => q.type === "normal")
      .map((q) => q.dim);
    expect(normalDims.length).toBe(24);
    for (const code of DIM_CODES) {
      expect(normalDims.filter((d) => d === code).length).toBe(2);
    }
  });

  it("普通题选项 score 1..3（高分=维度高端）", () => {
    for (const q of QUESTIONS) {
      if (q.type !== "normal" || q.renderType === "weight") continue;
      for (const o of q.options) {
        expect(o.score).toBeGreaterThanOrEqual(1);
        expect(o.score).toBeLessThanOrEqual(3);
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
    expect(gate!.dim).toBe("GATE");
    expect(gate!.options.map((o) => o.value)).toEqual(["destroy", "seen", "peace", "undecided"]);
  });

  it("trigger 触发题带 special 解锁标记", () => {
    const trigger = QUESTIONS.find((q) => q.type === "trigger");
    expect(trigger).toBeDefined();
    expect(trigger!.dim).toBe("TRIGGER");
    expect(trigger!.options.map((o) => o.value)).toEqual(["true", "false"]);
    // 接钥匙选项携带 SPECIAL_A 触发标记（解锁隐藏觉醒角色）
    const keyOption = trigger!.options.find((o) => o.value === "true");
    expect(keyOption!.trigger).toBe("SPECIAL_A");
  });

  it("weight 筹码题 7 组合 weight:: 编码", () => {
    const w = QUESTIONS.find((q) => q.renderType === "weight");
    expect(w).toBeDefined();
    expect(w!.options.length).toBe(7);
    for (const o of w!.options) {
      expect(o.label.startsWith("weight::")).toBe(true);
    }
  });

  it("角色库 21+ 个（旧 21 角色 + 4 觉醒变体），均带 12 维向量", () => {
    expect(PERSONALITY_TYPES.length).toBeGreaterThanOrEqual(21);
    for (const t of PERSONALITY_TYPES) {
      expect(t.vector.length).toBe(15); // "LLL-LLL-LLL-LLL" 12 字符 + 3 分隔符
    }
  });
});