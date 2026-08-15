import { describe, it, expect } from "vitest";
import { processAnswers, type AnswerInput } from "./answer-processor";

interface Opt {
  id: number;
  questionId: number;
  score: number | null;
  value: string | null;
  trigger: string | null;
  posture: string | null;
  label: string;
  question: { id: number; dim: string; type: string; renderType?: string };
}

const opt = (id: number, questionId: number, over: Partial<Opt> = {}): Opt => ({
  id, questionId,
  score: 2, value: null, trigger: null, posture: null, label: "",
  question: { id: questionId, dim: "POSTURE", type: "normal", renderType: "normal" },
  ...over,
});

const ans = (questionId: number, optionId: number): AnswerInput => ({ questionId, optionId });

describe("processAnswers (posture system)", () => {
  it("按 posture 累加 score 到对应桶", () => {
    const options = [
      opt(1, 1, { posture: "A", score: 3 }),
      opt(2, 2, { posture: "B", score: 2 }),
      opt(3, 3, { posture: "C", score: 4 }),
    ];
    const r = processAnswers([ans(1, 1), ans(2, 2), ans(3, 3)], options);
    expect(r.postureA).toBe(3);
    expect(r.postureB).toBe(2);
    expect(r.postureC).toBe(4);
    expect(r.validAnswers.length).toBe(3);
  });

  it("weight 题解析 weight::a|b|c 按 a*3/b*3/c*3 计入", () => {
    const options = [
      opt(1, 1, { label: "weight::2|1|0", score: 3, question: { id: 1, dim: "POSTURE", type: "normal", renderType: "weight" } }),
    ];
    const r = processAnswers([ans(1, 1)], options);
    expect(r.postureA).toBe(6);
    expect(r.postureB).toBe(3);
    expect(r.postureC).toBe(0);
  });

  it("gate 题设 path、trigger 设 keyUnlocked、scale 设 tendency", () => {
    const options = [
      opt(1, 1, { value: "destroy", posture: "C", score: 4, question: { id: 1, dim: "GATE", type: "gate", renderType: "gate" } }),
      opt(2, 2, { value: "true", posture: "C", score: 3, question: { id: 2, dim: "TRIGGER", type: "trigger", renderType: "trigger" } }),
      opt(3, 3, { value: "OBSESSION", posture: "B", score: 3, question: { id: 3, dim: "POSTURE", type: "normal", renderType: "scale" } }),
    ];
    const r = processAnswers([ans(1, 1), ans(2, 2), ans(3, 3)], options);
    expect(r.path).toBe("DESTRUCTION");
    expect(r.keyUnlocked).toBe(true);
    expect(r.tendency).toBe("OBSESSION");
  });

  it("gate/trigger/scale 的 posture 分也累加（忠于 HTML）", () => {
    const options = [
      opt(1, 1, { value: "peace", posture: "A", score: 4, question: { id: 1, dim: "GATE", type: "gate", renderType: "gate" } }),
      opt(2, 2, { value: "false", posture: "B", score: 2, question: { id: 2, dim: "TRIGGER", type: "trigger", renderType: "trigger" } }),
    ];
    const r = processAnswers([ans(1, 1), ans(2, 2)], options);
    expect(r.postureA).toBe(4);
    expect(r.postureB).toBe(2);
    expect(r.path).toBe("PEACE");
    expect(r.keyUnlocked).toBe(false);
  });

  it("默认值：path=PEACE / keyUnlocked=false / tendency=SACRIFICE", () => {
    const options = [opt(1, 1, { posture: "A", score: 3 })];
    const r = processAnswers([ans(1, 1)], options);
    expect(r.path).toBe("PEACE");
    expect(r.keyUnlocked).toBe(false);
    expect(r.tendency).toBe("SACRIFICE");
  });

  it("无效答案被过滤（optionId 不匹配）", () => {
    const options = [opt(1, 1, { posture: "A", score: 3 })];
    const r = processAnswers([ans(1, 999)], options);
    expect(r.validAnswers.length).toBe(0);
    expect(r.postureA).toBe(0);
  });
});
