import { describe, it, expect } from "vitest";
import { QUESTIONS } from "./quiz-content";

describe("question explicit scores", () => {
  it("every normal option has a score in 1..3", () => {
    for (const q of QUESTIONS) {
      if (q.type !== "normal") continue;
      for (const o of q.options) {
        expect(o.score).toBeGreaterThanOrEqual(1);
        expect(o.score).toBeLessThanOrEqual(3);
      }
    }
  });

  it("B1 forward high-trust option is not position-tied to score 1 only", () => {
    const q = QUESTIONS.find((x) => x.meta === "羁绊·邂逅");
    expect(q).toBeTruthy();
    const highTrust = q!.options.find((o) => o.label.includes("多一个同伴"));
    expect(highTrust?.score).toBe(3);
  });

  it("S1 reverse harsh option scores high", () => {
    const q = QUESTIONS.find((x) => x.meta === "审判·镜像");
    expect(q).toBeTruthy();
    const harsh = q!.options.find((o) => o.label.includes("自生自灭"));
    expect(harsh?.score).toBe(3);
  });

  it("F2 reverse despair peak is the collapse option", () => {
    const q = QUESTIONS.find((x) => x.meta === "侵蚀·崩塌");
    expect(q).toBeTruthy();
    const collapse = q!.options.find((o) => o.label.includes("再也不想站"));
    expect(collapse?.score).toBe(3);
  });
});
