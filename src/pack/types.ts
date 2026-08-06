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
}

export type DimCodeOf<P extends QuizPack> = P["dimensions"][number]["code"];
