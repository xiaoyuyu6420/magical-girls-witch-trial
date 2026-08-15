import { describe, it, expect } from "vitest";
import { match, type MatchInput } from "./match";
import { PERSONALITY_TYPES } from "@/data/quiz-content";

const base: MatchInput = {
  postureA: 10, postureB: 10, postureC: 10,
  path: "STRAY", keyUnlocked: false, tendency: "SACRIFICE",
};

const make = (p: Partial<MatchInput>): MatchInput => ({ ...base, ...p });

describe("match (posture system)", () => {
  it("homura: DESTRUCTION + C>=A + (key|OBSESSION)", () => {
    const r = match(make({ postureC: 30, postureA: 5, path: "DESTRUCTION", tendency: "OBSESSION" }), PERSONALITY_TYPES);
    expect(r.code).toBe("homura_devil");
  });

  it("homura: keyUnlocked 触发（tendency 无关）", () => {
    const r = match(make({ postureC: 30, postureA: 5, path: "DESTRUCTION", keyUnlocked: true }), PERSONALITY_TYPES);
    expect(r.code).toBe("homura_devil");
  });

  it("madoka: PEACE + SACRIFICE + (A|B)>=C", () => {
    const r = match(make({ postureA: 30, postureC: 5, path: "PEACE", tendency: "SACRIFICE" }), PERSONALITY_TYPES);
    expect(r.code).toBe("madoka_god");
  });

  it("sayaka: BE_SEEN + B>=C + SACRIFICE", () => {
    const r = match(make({ postureB: 30, postureC: 5, path: "BE_SEEN", tendency: "SACRIFICE" }), PERSONALITY_TYPES);
    expect(r.code).toBe("sayaka_siren");
  });

  it("kyoko: (DESTRUCTION|PEACE) + C>=A + OBSESSION", () => {
    const r = match(make({ postureC: 30, postureA: 5, path: "PEACE", tendency: "OBSESSION" }), PERSONALITY_TYPES);
    expect(r.code).toBe("kyoko_pragmatist");
  });

  it("emma 兜底：无任何 check 命中", () => {
    const r = match(make({ postureA: 30, path: "BE_SEEN", tendency: "OBSESSION" }), PERSONALITY_TYPES);
    expect(r.code).toBe("emma_truth");
  });

  it("posturePct 三占比和为 100", () => {
    const r = match(make({ postureA: 30, postureB: 20, postureC: 10 }), PERSONALITY_TYPES);
    expect(r.posturePct.A + r.posturePct.B + r.posturePct.C).toBe(100);
  });

  it("similarity = 主姿态占比", () => {
    const r = match(make({ postureA: 60, postureB: 30, postureC: 10, path: "PEACE", tendency: "SACRIFICE" }), PERSONALITY_TYPES);
    expect(r.similarity).toBe(60);
  });

  it("角色字段齐全（prosecution/softlanding/tags）", () => {
    const r = match(make({ postureA: 60, postureC: 5, path: "PEACE", tendency: "SACRIFICE" }), PERSONALITY_TYPES);
    expect(r.prosecution.length).toBeGreaterThan(0);
    expect(r.softlanding.length).toBeGreaterThan(0);
    expect(r.tags.length).toBeGreaterThan(0);
  });
});
