import type { QuizPack } from "@/pack/types";
import { getActivePack } from "@/pack/load";

// --- 向量解析与计算 ---

const TIER_CHAR_TO_NUM: Record<string, number> = { L: 0, M: 1, H: 2, X: 3 };
const TIER_NUM_TO_CHAR = ["L", "M", "H", "X"] as const;

function dimCodes(pack: QuizPack): string[] {
  return pack.dimensions.map((d) => d.code);
}

function dimWeights(pack: QuizPack): number[] {
  return dimCodes(pack).map((c) => pack.weights[c] ?? 1.0);
}

function maxDistanceOf(pack: QuizPack): number {
  return dimWeights(pack).reduce((s, w) => s + w * 3, 0);
}

/** 将 "LHH-LLM-HHH-LLL" 解析为数值数组（长度 = 维度数，默认 12） */
export function parseVector(v: string, expectedLen = 12): number[] {
  const nums = v.replace(/-/g, "").split("").map((c) => TIER_CHAR_TO_NUM[c] ?? 1);
  if (nums.length !== expectedLen) {
    throw new Error(`Invalid vector length: expected ${expectedLen}, got ${nums.length} in "${v}"`);
  }
  return nums;
}

/** 将档位数值转为 "LHH-LLM-HHH-LLL" 格式（按 3 维一组） */
export function formatVector(values: number[]): string {
  if (values.length === 0) {
    throw new Error("Invalid vector length: expected at least 1");
  }
  const chars = values.map((v) => TIER_NUM_TO_CHAR[Math.max(0, Math.min(v, 3))]);
  const groups: string[] = [];
  for (let i = 0; i < chars.length; i += 3) {
    groups.push(chars.slice(i, i + 3).join(""));
  }
  return groups.join("-");
}

/** 分数转档位（依赖 pack.algo.tiers） */
export function scoreToTier(total: number, pack: QuizPack = getActivePack()): number {
  for (const tier of pack.algo.tiers) {
    if (total <= tier.max) return tier.value;
  }
  return 3;
}

/** 加权曼哈顿距离 */
export function weightedManhattan(a: number[], b: number[], pack: QuizPack = getActivePack()): number {
  const codes = dimCodes(pack);
  const weights = dimWeights(pack);
  if (a.length !== codes.length || b.length !== codes.length) {
    throw new Error(`Invalid vector length: a=${a.length}, b=${b.length}, dims=${codes.length}`);
  }
  let dist = 0;
  for (let i = 0; i < codes.length; i++) {
    dist += weights[i] * Math.abs(a[i] - b[i]);
  }
  return dist;
}

/** 最大可能距离 */
export function maxDistance(pack: QuizPack = getActivePack()): number {
  return maxDistanceOf(pack);
}

/** 相似度 % */
export function similarity(dist: number, pack: QuizPack = getActivePack()): number {
  const maxD = maxDistanceOf(pack);
  if (maxD <= 0) return 0;
  return Math.round(((1 - dist / maxD) * 100) * 10) / 10;
}

// --- 匹配主函数 ---

export interface MatchInput {
  // dimCode → sum of scores (raw, before tier conversion)
  dimScores: Record<string, number>;
  gateValue?: string;
  triggerFired?: string;
}

export interface MatchResult {
  code: string;
  name: string;
  subtitle?: string;
  slogan: string;
  desc: string;
  keywords?: string;
  similarity: number;
  userVector: string;
  templateVector: string;
  top3: { code: string; name: string; similarity: number; translations?: string }[];
  group: string;
  borderType: boolean;
  special: boolean;
  translations?: string;
  /** 角色 IP 归属（跨IP全局匹配，结果页按 ipCode 显示对应作品信息） */
  ipCode?: string;
}

export interface PersonalityTypeInput {
  code: string;
  name: string;
  subtitle?: string | null;
  group: string;
  vector: string;
  slogan: string;
  desc: string;
  keywords?: string | null;
  special: boolean;
  translations?: string;
  /** 角色 IP 归属（透传到 MatchResult 供结果页使用） */
  ipCode?: string | null;
}

function applyGateBonus(
  dimScores: Record<string, number>,
  gateValue: string | undefined,
  pack: QuizPack,
): Record<string, number> {
  const scores = { ...dimScores };
  if (!gateValue) return scores;
  const bonus = pack.rules.gateBonus[gateValue];
  if (!bonus) return scores;
  for (const [dim, add] of Object.entries(bonus)) {
    scores[dim] = Math.min((scores[dim] ?? 0) + add, 6);
  }
  return scores;
}

function buildUserValues(dimScores: Record<string, number>, pack: QuizPack): number[] {
  const scores = dimScores;
  return dimCodes(pack).map((code) => {
    const total = scores[code] ?? 3; // default mid
    return scoreToTier(total, pack);
  });
}

function resolveSpecialCode(
  trigger: string,
  gateValue: string,
  specialTypes: { code: string }[],
  pack: QuizPack,
): string | undefined {
  // 1) Explicit pack map: SPECIAL_A.destroy → YUKI
  const mapped = pack.rules.specialTriggers[trigger]?.[gateValue]
    ?? pack.rules.specialTriggers[trigger.toUpperCase()]?.[gateValue];
  if (mapped && specialTypes.some((t) => t.code === mapped)) return mapped;

  // 2) Direct personality code
  if (specialTypes.some((t) => t.code === trigger)) return trigger;

  // 3) Legacy SPECIAL_A / SPECIAL_1 index into candidate list (stable sort by code)
  const match = /^SPECIAL_([A-Z]|\d+)$/i.exec(trigger);
  if (!match) return undefined;

  const token = match[1].toUpperCase();
  const index = /^\d+$/.test(token)
    ? Number(token) - 1
    : token.charCodeAt(0) - "A".charCodeAt(0);

  const sorted = [...specialTypes].sort((a, b) => a.code.localeCompare(b.code));
  // Historical gate filtering: endure → odd indices in insertion order was used;
  // keep pack map as primary; legacy fallback uses full sorted list.
  return index >= 0 ? sorted[index]?.code : undefined;
}

export function match(
  input: MatchInput,
  types: PersonalityTypeInput[],
  pack: QuizPack = getActivePack(),
): MatchResult {
  const allTypes = types.map((t) => ({
    ...t,
    subtitle: t.subtitle ?? undefined,
    keywords: t.keywords ?? undefined,
  }));

  const regularTypes = allTypes.filter((t) => !t.special && t.group !== "fallback");
  const specialTypes = allTypes.filter((t) => t.special);
  const unsetType = allTypes.find((t) => t.group === "fallback");
  if (!unsetType) {
    throw new Error("Missing fallback personality type in database");
  }

  const dimLen = pack.dimensions.length;

  // ① 特殊触发
  if (input.triggerFired && input.gateValue) {
    const specialCode = resolveSpecialCode(
      input.triggerFired,
      input.gateValue,
      specialTypes,
      pack,
    );
    if (specialCode) {
      const t = allTypes.find((p) => p.code === specialCode);
      if (!t) {
        throw new Error(`Missing special personality type ${specialCode} in database`);
      }
      const scored = applyGateBonus(input.dimScores, input.gateValue, pack);
      const specialUserVec = formatVector(buildUserValues(scored, pack));

      return {
        code: t.code,
        name: t.name,
        subtitle: t.subtitle,
        slogan: t.slogan,
        desc: t.desc,
        keywords: t.keywords,
        similarity: 100,
        userVector: specialUserVec,
        templateVector: t.vector,
        top3: [{ code: t.code, name: t.name, similarity: 100, translations: t.translations }],
        group: "special",
        borderType: false,
        special: true,
        translations: t.translations,
        ipCode: t.ipCode ?? undefined,
      };
    }
  }

  // ② 计算用户向量
  const scored = applyGateBonus(input.dimScores, input.gateValue, pack);
  const userValues = buildUserValues(scored, pack);
  const userVec = formatVector(userValues);

  // ③ 向量匹配
  const ranked = regularTypes
    .map((t) => {
      const tplValues = parseVector(t.vector, dimLen);
      const dist = weightedManhattan(userValues, tplValues, pack);
      return { type: t, dist, sim: similarity(dist, pack) };
    })
    .sort((a, b) => a.dist - b.dist);

  const top3 = ranked.slice(0, 3);
  const best = top3[0];
  if (!best) {
    return {
      code: unsetType.code,
      name: unsetType.name,
      subtitle: unsetType.subtitle,
      slogan: unsetType.slogan,
      desc: unsetType.desc,
      keywords: unsetType.keywords,
      similarity: 0,
      userVector: userVec,
      templateVector: unsetType.vector,
      top3: [],
      group: "fallback",
      borderType: true,
      special: false,
      translations: unsetType.translations,
      ipCode: unsetType.ipCode ?? undefined,
    };
  }

  // ④ 边界检查
  const delta = pack.algo.delta;
  const threshold = pack.algo.threshold;
  let borderType = false;
  const resultCode = best.type.code;

  if (top3.length >= 2) {
    const gap = best.sim - top3[1].sim;
    if (gap < delta) {
      if (best.sim < threshold) {
        return {
          code: unsetType.code,
          name: unsetType.name,
          subtitle: unsetType.subtitle,
          slogan: unsetType.slogan,
          desc: unsetType.desc,
          keywords: unsetType.keywords,
          similarity: best.sim,
          userVector: userVec,
          templateVector: unsetType.vector,
          top3: top3.map((r) => ({
            code: r.type.code,
            name: r.type.name,
            similarity: r.sim,
            translations: r.type.translations,
          })),
          group: "fallback",
          borderType: true,
          special: false,
          translations: unsetType.translations,
          ipCode: unsetType.ipCode ?? undefined,
        };
      }
      borderType = true;
    }
  }

  return {
    code: resultCode,
    name: best.type.name,
    subtitle: best.type.subtitle,
    slogan: best.type.slogan,
    desc: best.type.desc,
    keywords: best.type.keywords,
    similarity: best.sim,
    userVector: userVec,
    templateVector: best.type.vector,
    top3: top3.map((r) => ({
      code: r.type.code,
      name: r.type.name,
      similarity: r.sim,
      translations: r.type.translations,
    })),
    group: best.type.group,
    borderType,
    special: false,
    translations: best.type.translations,
    ipCode: best.type.ipCode ?? undefined,
  };
}
