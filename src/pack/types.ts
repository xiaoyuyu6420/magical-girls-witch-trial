/** Content Pack contracts — engine-agnostic quiz configuration */

export interface DimDef {
  code: string;
  name: string;
  model: string;
  modelName: string;
  dir: string;
}

export interface AlgoTier {
  max: number;
  label: string;
  value: number;
}

export interface AlgoConfig {
  tiers: readonly AlgoTier[];
  /** Top1-Top2 similarity gap below this marks border / possible fallback */
  delta: number;
  /** If border and Top1 similarity below this → fallback type */
  threshold: number;
  /**
   * 觉醒变体（special type）解锁的母体相似度门槛（0-100，百分数）。
   * 用户向量与变体母体角色（specialBases 映射）的相似度须 ≥ 此值才允许触发，
   * 否则回落正常向量匹配——保证稀有款稀有。0 或缺省 = 不校验。
   */
  specialMinSim?: number;
}

export type OptionShuffleMode = "none" | "stable-by-question-id";

export interface PackRules {
  /** Allowed gate option values */
  gateValues: readonly string[];
  /** gateValue → { dimCode → bonus points (capped later) } */
  gateBonus: Record<string, Record<string, number>>;
  /**
   * trigger token → gateValue → personality code
   * e.g. SPECIAL_A.destroy = YUKI
   * Direct personality codes (YUKI) still work when listed as special types.
   */
  specialTriggers: Record<string, Record<string, string>>;
  /** Which gate values open the trigger question (client filter) */
  triggerGates: readonly string[];
  /**
   * 觉醒变体 code → 母体角色 code（如 homura_devil → HOMURA）。
   * 用于 specialMinSim 稀有度校验：你得先"是"母体角色，才有资格觉醒成变体。
   * 无映射的 special（如 YUKI 直接映射）不受门槛限制。
   */
  specialBases?: Record<string, string>;
  optionShuffle: OptionShuffleMode;
}

export interface PresentationConfig {
  /** Hide raw userVector / templateVector on result detail */
  hideTechnicalVectors: boolean;
  /** Tier labels for bars: index 0..3 */
  tierLabels: readonly [string, string, string, string];
  result: {
    analysisTitleKey: string;
    fitLabelKey: string;
    youLabelKey: string;
    idealLabelKey: string;
  };
}

export interface QuizPack {
  id: string;
  version: number;
  title: string;
  dimensions: readonly DimDef[];
  weights: Record<string, number>;
  algo: AlgoConfig;
  rules: PackRules;
  presentation: PresentationConfig;
  /** 作品介绍（角色档案卡"一句话作品介绍"，跨IP阶段可扩展为每角色字段） */
  workIntro?: string;
}

export type DimCodeOf<P extends QuizPack> = P["dimensions"][number]["code"];
