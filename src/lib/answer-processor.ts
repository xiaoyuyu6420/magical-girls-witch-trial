import type { MatchInput } from "./match";
import type { QuizPack } from "@/pack/types";
import { getActivePack } from "@/pack/load";

export interface AnswerInput {
  questionId: number;
  optionId: number;
}

export interface ProcessedAnswers {
  dimScores: Record<string, number>;
  gateValue: MatchInput["gateValue"];
  triggerFired: string | undefined;
  validAnswers: AnswerInput[];
}

/**
 * Process answers from client and derive dimScores, gateValue, triggerFired from DB.
 * This ensures client-side tampering cannot forge results.
 */
export function processAnswers(
  answers: AnswerInput[],
  options: Array<{
    id: number;
    questionId: number;
    score: number | null;
    value: string | null;
    trigger: string | null;
    question: { id: number; dim: string; type: string };
  }>,
  pack: QuizPack = getActivePack(),
): ProcessedAnswers {
  const optionMap = new Map(options.map((o) => [o.id, o]));
  const validAnswers: AnswerInput[] = [];

  const dimScores: Record<string, number> = {};
  let gateValue: MatchInput["gateValue"];
  let triggerFired: string | undefined;
  const gateSet = new Set(pack.rules.gateValues);

  for (const a of answers) {
    const opt = optionMap.get(a.optionId);
    if (!opt || opt.questionId !== a.questionId) continue;
    validAnswers.push(a);

    const qType = opt.question.type;
    if (qType === "gate") {
      const v = opt.value;
      if (v && gateSet.has(v)) {
        gateValue = v;
      }
      continue;
    }
    if (qType === "trigger") {
      if (opt.trigger) triggerFired = opt.trigger;
      continue;
    }

    const dim = opt.question.dim;
    if (!dim || dim === "GATE" || dim === "TRIGGER") continue;
    dimScores[dim] = (dimScores[dim] ?? 0) + (opt.score ?? 0);
  }

  return { dimScores, gateValue, triggerFired, validAnswers };
}
