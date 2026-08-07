// ============================================================================
// Annotations — 审判官批注（行为素描，非维度标签）
// ----------------------------------------------------------------------------
// REDESIGN 第六节"审判官批注"：第5/10/15题后插入审判官插页，三次递进
// （试探→逼近→审判）。动态读用户当前各维度总分，按主导维度的档位（H/M/L）
// 从文案池选一条行为描写。R9：不输出维度标签/角色/百分比——档位只是内部
// 选文案的依据，文案本身只有行为描写。
// ============================================================================

import type { QuizPack } from "@/pack/types";
import { scoreToTier } from "@/lib/match";

/** 批注节点：答完第5/10/15题后触发 */
export type AnnotationNode = 5 | 10 | 15;

/** 档位：主导维度（当前 sum 最高的维度）经 scoreToTier 映射后归并为三档 */
type Tier = "H" | "M" | "L";

/**
 * 文案池：节点 → 档位 → 多条变体文案（rng 随机选一，避免每次完全一样）。
 * 每条都是行为描写，不含任何维度标签/角色/百分比。
 * 语气随节点递进：probe(试探) → press(逼近) → judge(审判)。
 */
const POOLS: Record<AnnotationNode, Record<Tier, string[]>> = {
  5: {
    // 试探语气——审判官刚看出点东西，轻轻戳一下
    H: [
      "你回答时很少犹豫。这说明……你要么很清楚自己是谁，要么很擅长让自己看起来清楚。",
      "前五题，你几乎没有回头。这么笃定的人，要么真的清醒，要么把怀疑压得很深。",
    ],
    M: [
      "你的回答里有几处停顿。那不是犹豫——是你在衡量，要不要把真正的答案交出来。",
      "五题下来，你在某些地方选得很干脆，某些地方又退了一步。你在保护什么？",
    ],
    L: [
      "你一直在给'正确答案'。但这里没有正确答案——只有你的答案。",
      "五题了，你的回答都很'安全'。安全不是错，可审讯室里最安全的回答，往往离真相最远。",
    ],
  },
  10: {
    // 逼近语气——审判官开始施压，指出用户的回避
    H: [
      "有些题你答得太快了。快到像是在回避真正去想。",
      "十题了。你的回答越来越干脆，可越干脆的地方，我越觉得你在用'确定'盖住'动摇'。",
    ],
    M: [
      "十题下来，你的立场在来回晃。不是优柔寡断——是你心里两套东西在打架，你还没决定让哪一套赢。",
      "你给的答案里有矛盾。没关系，人本来就是矛盾的。我只是想让你也听见这个矛盾。",
    ],
    L: [
      "你答了十题，可我觉得你一道都没真正回答。你在绕。",
      "十题了，你始终在'看起来合理'的选项上落脚。可合理不等于真实——你在回避哪个真实？",
    ],
  },
  15: {
    // 审判语气——审判官摊牌，逼用户承认
    H: [
      "你今天交出来的答案，有些连你自己都没承认过，对吧？",
      "十五题。你一直在用最锋利的选项剖自己。可最锋利的刀，往往是为了不让自己看见伤口。",
    ],
    M: [
      "十五题了。你交出来的东西，比你自己以为的要多。",
      "你一直在两个自己之间摆动。今天，你至少没有假装只有一个自己。",
    ],
    L: [
      "十五题，你始终没有真正亮出立场。你害怕的不是答错——你害怕被自己的答案认出来。",
      "你把自己藏得很好。可藏得越好的人，心里压的东西越重。你确定要一直这样压下去？",
    ],
  },
};

/** fallback 档位（理论不应触达，纯防御） */
const FALLBACK: Record<AnnotationNode, string> = {
  5: "前五题，你已经在审讯室里坐定。让我们继续。",
  10: "十题了。你和我，都还没松口。",
  15: "十五题。审判快要落锤——你准备好了吗？",
};

/**
 * 纯函数：根据用户当前各维度总分，选一条审判官批注。
 *
 * @param node 批注节点（5/10/15）
 * @param dimScores 用户当前各维度累计原始分（dimCode → sum of scores）
 * @param pack 内容包（用其 dimensions + algo.tiers）
 * @param rng 可选随机数生成器（默认 Math.random），单测注入确定性 rng
 * @returns 行为描写文案（无维度标签/角色/百分比）
 */
export function pickAnnotation(
  node: AnnotationNode,
  dimScores: Record<string, number>,
  pack: QuizPack,
  rng: () => number = Math.random,
): string {
  // 找主导维度：sum 最高的真实维度（排除 GATE/TRIGGER 占位）
  let dominantDim: string | null = null;
  let maxSum = -Infinity;
  for (const d of pack.dimensions) {
    const sum = dimScores[d.code] ?? 0;
    if (sum > maxSum) {
      maxSum = sum;
      dominantDim = d.code;
    }
  }

  // 空输入或无主导维度 → fallback
  if (!dominantDim || maxSum < 0) {
    return FALLBACK[node];
  }

  // 主导维度档位：scoreToTier 用 pack.algo.tiers（tiers=[2,4,5,6]→[0,1,2,3]=L/M/H/X）
  // 归并为三档：0-1(L/M) → M偏稳；2(H) → H；3(X) → H；0(L) → L
  const tierNum = scoreToTier(maxSum, pack);
  const tier: Tier = tierNum <= 0 ? "L" : tierNum === 1 ? "M" : "H";

  const pool = POOLS[node][tier];
  if (!pool || pool.length === 0) {
    return FALLBACK[node];
  }

  const idx = Math.floor(rng() * pool.length) % pool.length;
  return pool[idx];
}

/** 导出文案池（供文档/调试/admin 预览，不用于运行时计算） */
export const ANNOTATION_POOLS = POOLS;
