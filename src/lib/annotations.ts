// ============================================================================
// Annotations — 审判官批注（行为素描，非维度标签）
// ----------------------------------------------------------------------------
// REDESIGN 第六节"审判官批注"：第5/10/15题后插入审判官插页，三次递进
// （试探→逼近→审判）。动态读用户当前各维度总分，按主导维度的档位（H/M/L）
// 从文案池选一条行为描写。R9：不输出维度标签/角色/百分比——档位只是内部
// 选文案的依据，文案本身只有行为描写。
// ============================================================================

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
    // 试探语气——第一阶段中段：冷眼初探，克制疏离的轻吐槽
    H: [
      "五题了。您的回答几乎不需要思考。是早就认清了自己——还是早就练好了那副“认清了自己”的表情呢。",
      "前五题，您一次都没有回头。这么笃定的人，要么真的清醒，要么把怀疑压进了很深的地方。",
    ],
    M: [
      "您的回答里有几处停顿。那不是犹豫——是您在衡量，要不要把真正的答案交出来。",
      "五题下来，有些地方选得很干脆，有些地方又退了半步。您在保护什么呢。",
    ],
    L: [
      "您一直在给“正确答案”。可惜这里没有正确答案——只有您的答案。",
      "五题了，您的每一笔都落得很“安全”。安全不是错。只是审判庭里最安全的回答，往往离真相最远。",
    ],
  },
  10: {
    // 逼近语气——第二阶段中段：手术刀式解剖，戳穿防御机制
    H: [
      "有些题，您答得太快了。快到像是在回避真正去想。",
      "十题了。您的回答越来越干脆——可越干脆的地方，我越怀疑，您是在用“确定”盖住“动摇”。",
    ],
    M: [
      "十题下来，您的立场在来回晃。不是优柔寡断——是您心里两套东西在打架，而您还没决定让哪一套赢。",
      "您的答案里有矛盾。没关系，人本来就是矛盾的。我只是想让您，也亲耳听见这个矛盾。",
    ],
    L: [
      "您答了十题，可我觉得您一道都没有真正回答。您在绕。",
      "十题了，您始终在“看起来合理”的选项上落脚。合理不等于真实——您在回避哪一个真实呢。",
    ],
  },
  15: {
    // 审判前夜——第二阶段末尾：语气放软，带上一点恶魔式的低语钩子
    H: [
      "您今天交出的答案里，有几条——连您自己都不曾对任何人承认过，对吧。",
      "十五题。您一直在用最锋利的选项剖开自己。可最锋利的刀，往往是为了不让自己看见伤口。",
    ],
    M: [
      "十五题了。您交出来的东西，比您自己以为的要多。",
      "您一直在两个自己之间摇摆。不过没关系——至少今天，您没有假装只有一个自己。",
    ],
    L: [
      "十五题，您始终没有真正亮出立场。您害怕的不是答错——您是害怕被自己的答案认出来。",
      "您把自己藏得很好。可藏得越好的人，心里压着的东西就越重。……要不要，在剩下的题里试着放下来一点。",
    ],
  },
};

/** fallback 档位（理论不应触达，纯防御）——单一来源，供 route/TestScreen 共享 */
export const ANNOTATION_FALLBACKS: Record<AnnotationNode, string> = {
  5: "五题了。您已经在审讯室里坐定——请继续，我并不着急。",
  10: "十题。您和我，都还没松口。",
  15: "十五题。离落锤还有一段路——在那之前，不妨对我诚实一点。",
};

/**
 * 纯函数：根据用户当前各维度累加分的集中度，选一条审判官批注。
 *
 * @param node 批注节点（5/10/15）
 * @param dimScores 各维度累计分（key=维度 code，value=累加原始分）
 * @param rng 可选随机数生成器（默认 Math.random），单测注入确定性 rng
 * @param poolOverride 后台自定义池（按 tier 分组的 DB 文案）；某 tier 空则回退内置池
 * @returns 行为描写文案（无姿态标签/角色/百分比）
 */
export function pickAnnotation(
  node: AnnotationNode,
  dimScores: Record<string, number>,
  rng: () => number = Math.random,
  poolOverride?: Partial<Record<Tier, string[]>>,
): string {
  const values = Object.values(dimScores);
  const total = values.reduce((s, v) => s + v, 0);
  if (total <= 0) {
    return ANNOTATION_FALLBACKS[node];
  }

  // 主导维度集中度：max / total。集中度高=倾向明显(笃定 H)；低=分散(回避 L)
  const maxDim = Math.max(...values);
  const dominance = maxDim / total;
  const tier: Tier = dominance >= 0.5 ? "H" : dominance >= 0.34 ? "M" : "L";

  const override = poolOverride?.[tier];
  const pool = override && override.length > 0 ? override : POOLS[node][tier];
  if (!pool || pool.length === 0) {
    return ANNOTATION_FALLBACKS[node];
  }

  const idx = Math.floor(rng() * pool.length) % pool.length;
  return pool[idx];
}

/** 导出文案池（供文档/调试/admin 预览，不用于运行时计算） */
export const ANNOTATION_POOLS = POOLS;
