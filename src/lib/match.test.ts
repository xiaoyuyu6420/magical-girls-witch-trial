import { describe, it, expect } from "vitest";
import { parseVector, formatVector, scoreToTier, weightedManhattan, similarity, match } from "./match";
import { getActivePack } from "@/pack/load";
import { DIMENSIONS } from "@/data/quiz-content";

const pack = getActivePack();

describe("parseVector", () => {
  it("parses LHH-LLM-HHH-LLL correctly", () => {
    expect(parseVector("LHH-LLM-HHH-LLL")).toEqual([0, 2, 2, 0, 0, 1, 2, 2, 2, 0, 0, 0]);
  });

  it("parses all-L vector", () => {
    expect(parseVector("LLL-LLL-LLL-LLL")).toEqual(Array(12).fill(0));
  });

  it("parses all-X vector", () => {
    expect(parseVector("XXX-XXX-XXX-XXX")).toEqual(Array(12).fill(3));
  });

  it("defaults unknown char to 1 (M)", () => {
    expect(parseVector("ZZZ-ZZZ-ZZZ-ZZZ")).toEqual(Array(12).fill(1));
  });
});

describe("formatVector", () => {
  it("formats [0,2,2,0,0,1,2,2,2,0,0,0] as LHH-LLM-HHH-LLL", () => {
    expect(formatVector([0, 2, 2, 0, 0, 1, 2, 2, 2, 0, 0, 0])).toBe("LHH-LLM-HHH-LLL");
  });

  it("is inverse of parseVector", () => {
    const v = "MHM-LMH-HHH-LHH";
    expect(formatVector(parseVector(v))).toBe(v);
  });
});

describe("scoreToTier", () => {
  it("maps score 0-2 to L (0)", () => {
    expect(scoreToTier(0, pack)).toBe(0);
    expect(scoreToTier(2, pack)).toBe(0);
  });

  it("maps score 3-4 to M (1)", () => {
    expect(scoreToTier(3, pack)).toBe(1);
    expect(scoreToTier(4, pack)).toBe(1);
  });

  it("maps score 5 to H (2)", () => {
    expect(scoreToTier(5, pack)).toBe(2);
  });

  it("maps score 6 to X (3)", () => {
    expect(scoreToTier(6, pack)).toBe(3);
  });

  it("maps very high score to X (3)", () => {
    expect(scoreToTier(100, pack)).toBe(3);
  });
});

describe("weightedManhattan", () => {
  it("returns 0 for identical vectors", () => {
    const v = [0, 1, 2, 0, 1, 2, 0, 1, 2, 0, 1, 2];
    expect(weightedManhattan(v, v, pack)).toBe(0);
  });

  it("returns positive for different vectors", () => {
    const a = Array(12).fill(0);
    const b = Array(12).fill(3);
    expect(weightedManhattan(a, b, pack)).toBeGreaterThan(0);
  });

  it("is symmetric", () => {
    const a = [0, 2, 1, 3, 0, 2, 1, 0, 3, 2, 1, 0];
    const b = [1, 0, 3, 2, 1, 0, 2, 1, 0, 3, 2, 1];
    expect(weightedManhattan(a, b, pack)).toBeCloseTo(weightedManhattan(b, a, pack));
  });
});

describe("similarity", () => {
  it("returns 100 for identical vectors", () => {
    const v = [1, 2, 0, 3, 1, 2, 0, 1, 2, 3, 0, 1];
    const dist = weightedManhattan(v, v, pack);
    expect(similarity(dist, pack)).toBe(100);
  });

  it("returns 0 for maximally different vectors", () => {
    const a = Array(12).fill(0);
    const b = Array(12).fill(3);
    const dist = weightedManhattan(a, b, pack);
    expect(similarity(dist, pack)).toBe(0);
  });

  it("returns value between 0 and 100", () => {
    const a = [1, 2, 0, 1, 2, 0, 1, 2, 0, 1, 2, 0];
    const b = [0, 1, 2, 0, 1, 2, 0, 1, 2, 0, 1, 2];
    const sim = similarity(weightedManhattan(a, b, pack), pack);
    expect(sim).toBeGreaterThan(0);
    expect(sim).toBeLessThanOrEqual(100);
  });
});

const makeTypes = () => [
  { code: "EMMA", name: "樱羽艾玛", subtitle: null, group: "B", vector: "LHH-LLM-HHH-LLL", slogan: "s", desc: "d", keywords: null, special: false, translations: "{}" },
  { code: "SHERRY", name: "橘雪莉", subtitle: null, group: "B", vector: "MHM-LMH-HHH-LHH", slogan: "s", desc: "d", keywords: null, special: false, translations: "{}" },
  { code: "HIRO", name: "二阶堂希罗", subtitle: null, group: "F", vector: "HLL-HMH-LHH-HHM", slogan: "s", desc: "d", keywords: null, special: false, translations: "{}" },
  { code: "UNSET", name: "未定之魂", subtitle: null, group: "fallback", vector: "MMM-MMM-MMM-MMM", slogan: "s", desc: "d", keywords: null, special: false, translations: "{}" },
  { code: "YUKI", name: "月代雪", subtitle: "大魔女", group: "special", vector: "HHH-LLL-LLL-LLL", slogan: "s", desc: "d", keywords: null, special: true, translations: "{}" },
  { code: "ETL", name: "不灭雪华", subtitle: "梅露露真身", group: "special", vector: "LLL-HHH-HHH-HHH", slogan: "s", desc: "d", keywords: null, special: true, translations: "{}" },
  { code: "homura_devil", name: "晓美焰·黑化", subtitle: null, group: "special", vector: "HHL-HHH-LHH-HHH", slogan: "s", desc: "d", keywords: null, special: true, translations: "{}" },
  { code: "sayaka_siren", name: "美树沙耶香·魔女", subtitle: null, group: "special", vector: "HML-MHH-HHH-LHH", slogan: "s", desc: "d", keywords: null, special: true, translations: "{}" },
  { code: "kyoko_pragmatist", name: "佐仓杏子·利己", subtitle: null, group: "special", vector: "MHL-MMH-LMH-MMH", slogan: "s", desc: "d", keywords: null, special: true, translations: "{}" },
  { code: "madoka_god", name: "鹿目圆·圆神", subtitle: null, group: "special", vector: "LLH-LLL-HHH-LLL", slogan: "s", desc: "d", keywords: null, special: true, translations: "{}" },
];

describe("match", () => {
  it("returns a result with valid structure", () => {
    const dimScores: Record<string, number> = {};
    DIMENSIONS.forEach((d) => { dimScores[d.code] = 3; });
    const result = match({ dimScores }, makeTypes(), pack);
    expect(result.code).toBeTruthy();
    expect(result.similarity).toBeGreaterThanOrEqual(0);
    expect(result.similarity).toBeLessThanOrEqual(100);
    expect(result.userVector).toBeTruthy();
    expect(result.top3.length).toBeGreaterThanOrEqual(1);
  });

  it("triggers special type with destroy gate + triggerFired", () => {
    const dimScores: Record<string, number> = {};
    DIMENSIONS.forEach((d) => { dimScores[d.code] = 3; });
    const result = match({ dimScores, gateValue: "destroy", triggerFired: "YUKI" }, makeTypes(), pack);
    expect(result.special).toBe(true);
    expect(result.code).toBe("YUKI");
    expect(result.similarity).toBe(100);
  });

  it("resolves SPECIAL_A via explicit pack map", () => {
    const dimScores: Record<string, number> = {};
    DIMENSIONS.forEach((d) => { dimScores[d.code] = 3; });

    const destroyResult = match({ dimScores, gateValue: "destroy", triggerFired: "SPECIAL_A" }, makeTypes(), pack);
    const seenResult = match({ dimScores, gateValue: "seen", triggerFired: "SPECIAL_A" }, makeTypes(), pack);

    expect(destroyResult.special).toBe(true);
    expect(destroyResult.code).toBe("homura_devil");
    expect(seenResult.special).toBe(true);
    expect(seenResult.code).toBe("sayaka_siren");
  });

  it("resolves SPECIAL_B via explicit pack map", () => {
    const dimScores: Record<string, number> = {};
    DIMENSIONS.forEach((d) => { dimScores[d.code] = 3; });

    const destroyResult = match({ dimScores, gateValue: "destroy", triggerFired: "SPECIAL_B" }, makeTypes(), pack);
    const seenResult = match({ dimScores, gateValue: "seen", triggerFired: "SPECIAL_B" }, makeTypes(), pack);

    expect(destroyResult.special).toBe(true);
    expect(destroyResult.code).toBe("kyoko_pragmatist");
    expect(seenResult.special).toBe(true);
    expect(seenResult.code).toBe("madoka_god");
  });

  it("does not trigger special without gateValue", () => {
    const dimScores: Record<string, number> = {};
    DIMENSIONS.forEach((d) => { dimScores[d.code] = 3; });
    const result = match({ dimScores, triggerFired: "YUKI" }, makeTypes(), pack);
    expect(result.special).toBe(false);
  });

  it("applies gate peace bonus to S2", () => {
    const dimScores: Record<string, number> = {};
    DIMENSIONS.forEach((d) => { dimScores[d.code] = 3; });
    // S2 raw 3 → tier M; with +1 → 4 still M. Use 4 so +1 crosses to H(5)
    dimScores["S2"] = 4;
    const resultNormal = match({ dimScores, gateValue: "peace" }, makeTypes(), pack);
    const resultDefault = match({ dimScores }, makeTypes(), pack);
    const idx = DIMENSIONS.findIndex((d) => d.code === "S2");
    const nVals = parseVector(resultNormal.userVector);
    const dVals = parseVector(resultDefault.userVector);
    expect(nVals[idx]).toBeGreaterThan(dVals[idx]);
  });

  it("is deterministic for same dimScores", () => {
    const dimScores: Record<string, number> = {};
    DIMENSIONS.forEach((d) => { dimScores[d.code] = 4; });
    const a = match({ dimScores }, makeTypes(), pack);
    const b = match({ dimScores }, makeTypes(), pack);
    expect(a.code).toBe(b.code);
    expect(a.userVector).toBe(b.userVector);
    expect(a.similarity).toBe(b.similarity);
  });
});

describe("active pack", () => {
  it("loads witch-trial pack with 12 dims", () => {
    expect(pack.id).toBe("witch-trial");
    expect(pack.dimensions).toHaveLength(12);
    expect(pack.rules.optionShuffle).toBe("stable-by-question-id");
    expect(pack.presentation.hideTechnicalVectors).toBe(true);
  });
});
