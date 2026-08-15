// ============================================================================
// Answer Processor — posture 评分聚合（移植 HTML「审判庭」calculateScores）
// ----------------------------------------------------------------------------
// 服务端从 DB 重新派生 postureA/B/C + path + keyUnlocked + tendency，
// 不信任客户端。weight 题解析 weight::a|b|c 编码按 a*3/b*3/c*3 计入。
// ============================================================================

import type { MatchInput } from "./match";

export interface AnswerInput {
  questionId: number;
  optionId: number;
}

export interface ProcessedAnswers {
  postureA: number;
  postureB: number;
  postureC: number;
  /** Q18 路径（大写）：DESTRUCTION/BE_SEEN/PEACE/STRAY，默认 PEACE */
  path: MatchInput["path"];
  /** Q19 钥匙：是否接过沾血钥匙，默认 false */
  keyUnlocked: MatchInput["keyUnlocked"];
  /** Q8/Q22 倾向：SACRIFICE/OBSESSION，默认 SACRIFICE（后者覆盖前者） */
  tendency: MatchInput["tendency"];
  /** 原始 gateValue（小写，兼容落库/前端 trigger 显隐） */
  gateValue: string | undefined;
  validAnswers: AnswerInput[];
}

/** 小写 gate value → 大写 path（HTML check 函数用大写） */
const PATH_MAP: Record<string, MatchInput["path"]> = {
  destroy: "DESTRUCTION",
  seen: "BE_SEEN",
  peace: "PEACE",
  undecided: "STRAY",
};

/** 解析 weight::a|b|c */
function parseWeight(label: string): [number, number, number] | null {
  if (!label.startsWith("weight::")) return null;
  const parts = label.slice(8).split("|");
  if (parts.length !== 3) return null;
  const nums = parts.map(Number);
  if (nums.some((n) => Number.isNaN(n))) return null;
  return nums as [number, number, number];
}

/**
 * Process answers from client and derive posture scores + path + keyUnlocked + tendency.
 * Server-side re-derivation — client tampering cannot forge results.
 */
export function processAnswers(
  answers: AnswerInput[],
  options: Array<{
    id: number;
    questionId: number;
    score: number | null;
    value: string | null;
    trigger: string | null;
    posture: string | null;
    label: string;
    question: { id: number; dim: string; type: string; renderType?: string };
  }>,
): ProcessedAnswers {
  const optionMap = new Map(options.map((o) => [o.id, o]));
  const validAnswers: AnswerInput[] = [];

  let postureA = 0;
  let postureB = 0;
  let postureC = 0;
  let path: MatchInput["path"] = "PEACE";
  let keyUnlocked = false;
  let tendency: MatchInput["tendency"] = "SACRIFICE";
  let gateValue: string | undefined;

  for (const a of answers) {
    const opt = optionMap.get(a.optionId);
    if (!opt || opt.questionId !== a.questionId) continue;
    validAnswers.push(a);

    const renderType = opt.question.renderType ?? "normal";

    // weight 题：解析 weight::a|b|c，按 a*3/b*3/c*3 计入（忠于 HTML）
    if (renderType === "weight") {
      const w = parseWeight(opt.label);
      if (w) {
        postureA += w[0] * 3;
        postureB += w[1] * 3;
        postureC += w[2] * 3;
      }
      continue;
    }

    // 普通姿态加分（含 gate/trigger/scale —— HTML 里它们也带 posture/score）
    const score = opt.score ?? 0;
    if (opt.posture === "A") postureA += score;
    else if (opt.posture === "B") postureB += score;
    else if (opt.posture === "C") postureC += score;

    // gate 题：path
    if (opt.question.type === "gate" && opt.value) {
      gateValue = opt.value;
      path = PATH_MAP[opt.value] ?? "STRAY";
    }
    // trigger 题：keyUnlocked
    if (opt.question.type === "trigger" && opt.value != null) {
      keyUnlocked = opt.value === "true";
    }
    // scale 题：tendency（后者覆盖前者）
    if (renderType === "scale" && opt.value) {
      tendency = opt.value as MatchInput["tendency"];
    }
  }

  return { postureA, postureB, postureC, path, keyUnlocked, tendency, gateValue, validAnswers };
}
