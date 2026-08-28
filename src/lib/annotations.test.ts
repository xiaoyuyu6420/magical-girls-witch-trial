import { describe, it, expect } from "vitest";
import { pickAnnotation, ANNOTATION_FALLBACKS, type AnnotationNode } from "./annotations";

const node: AnnotationNode = 5;

describe("pickAnnotation (12-dim system)", () => {
  it("主导维度集中度 >= 0.5 → 返回文案池 H 档文案", () => {
    const dimScores = { S1: 30, F2: 10, B1: 10, W3: 5 };
    const text = pickAnnotation(node, dimScores);
    expect(typeof text).toBe("string");
    expect(text.length).toBeGreaterThan(0);
    expect(text).not.toBe(ANNOTATION_FALLBACKS[node]);
  });

  it("集中度 0.34..0.5 → M 档", () => {
    const dimScores = { S1: 16, F2: 14, B1: 10 }; // max 16/40 = 0.4
    const text = pickAnnotation(node, dimScores);
    expect(text.length).toBeGreaterThan(0);
    expect(text).not.toBe(ANNOTATION_FALLBACKS[node]);
  });

  it("集中度 < 0.34 → L 档", () => {
    const dimScores = { S1: 10, F2: 10, B1: 10, W2: 10 }; // max 10/40 = 0.25
    const text = pickAnnotation(node, dimScores);
    expect(text.length).toBeGreaterThan(0);
  });

  it("全部为零 → fallback", () => {
    expect(pickAnnotation(node, {})).toBe(ANNOTATION_FALLBACKS[node]);
  });

  it("确定性 rng 可选：注入固定 rng 返回池内固定文案", () => {
    const a = pickAnnotation(node, { S1: 30, F2: 10, B1: 10 }, () => 0);
    const b = pickAnnotation(node, { S1: 30, F2: 10, B1: 10 }, () => 0);
    expect(a).toBe(b);
  });
});
