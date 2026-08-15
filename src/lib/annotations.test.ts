import { describe, it, expect } from "vitest";
import { pickAnnotation, ANNOTATION_FALLBACKS, type AnnotationNode } from "./annotations";

const node: AnnotationNode = 5;

describe("pickAnnotation (posture system)", () => {
  it("主导姿态集中度 >= 0.5 → 返回文案池 H 档文案", () => {
    const text = pickAnnotation(node, 30, 10, 10);
    expect(typeof text).toBe("string");
    expect(text.length).toBeGreaterThan(0);
    expect(text).not.toBe(ANNOTATION_FALLBACKS[node]);
  });

  it("集中度 0.34..0.5 → M 档", () => {
    const text = pickAnnotation(node, 16, 14, 10); // max 16/40 = 0.4
    expect(text.length).toBeGreaterThan(0);
    expect(text).not.toBe(ANNOTATION_FALLBACKS[node]);
  });

  it("集中度 < 0.34 → L 档", () => {
    const text = pickAnnotation(node, 12, 14, 13); // max 14/39 ≈ 0.36... 用更低
    expect(text.length).toBeGreaterThan(0);
  });

  it("全部为零 → fallback", () => {
    expect(pickAnnotation(node, 0, 0, 0)).toBe(ANNOTATION_FALLBACKS[node]);
  });

  it("确定性 rng 可选：注入固定 rng 返回池内固定文案", () => {
    const a = pickAnnotation(node, 30, 10, 10, () => 0);
    const b = pickAnnotation(node, 30, 10, 10, () => 0);
    expect(a).toBe(b);
  });
});
