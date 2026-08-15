// ============================================================================
// Match — posture 体系 5 角色匹配（移植 HTML「审判庭」matchCharacter）
// ----------------------------------------------------------------------------
// 遍历 5 角色的 check 函数（按 homura → madoka → sayaka → kyoko → emma 顺序），
// 第一个命中的返回；emma 的 check 恒真，作为兜底。
// ============================================================================

export interface MatchInput {
  postureA: number;
  postureB: number;
  postureC: number;
  /** Q18 路径：DESTRUCTION/BE_SEEN/PEACE/STRAY */
  path: "DESTRUCTION" | "BE_SEEN" | "PEACE" | "STRAY";
  /** Q19 是否接过沾血钥匙 */
  keyUnlocked: boolean;
  /** Q8/Q22 倾向：SACRIFICE/OBSESSION */
  tendency: "SACRIFICE" | "OBSESSION";
}

export interface MatchResult {
  code: string;
  name: string;
  subtitle?: string;
  group: string;
  ipCode?: string;
  /** 审判官逼视 */
  prosecution: string;
  /** 温柔落点 */
  softlanding: string;
  /** 标签（逗号分隔） */
  tags: string;
  slogan: string;
  desc: string;
  keywords?: string;
  /** 主姿态占比%（max posture / total * 100），结果页"契合度"展示 */
  similarity: number;
  /** posture 占比描述串，如 "A 40 · B 35 · C 25" */
  userVector: string;
  templateVector: string;
  top3: { code: string; name: string; similarity: number; translations?: string }[];
  group_label: string;
  borderType: boolean;
  special: boolean;
  translations?: string;
  /** posture 三姿态占比，结果页画占比条 */
  posturePct: { A: number; B: number; C: number };
}

export interface PersonalityTypeInput {
  code: string;
  name: string;
  subtitle?: string | null;
  group: string;
  vector?: string | null;
  slogan?: string | null;
  desc?: string | null;
  keywords?: string | null;
  special?: boolean;
  translations?: string;
  ipCode?: string | null;
  prosecution?: string | null;
  softlanding?: string | null;
  tags?: string | null;
}

/** 5 角色 check 函数表（顺序 = 优先级，emma 兜底恒真） */
type CheckFn = (p: { A: number; B: number; C: number }, path: MatchInput["path"], key: boolean, tend: MatchInput["tendency"]) => boolean;

const CHARACTER_CHECKS: { code: string; check: CheckFn }[] = [
  {
    code: "homura_devil",
    check: (p, path, key, tend) =>
      path === "DESTRUCTION" && p.C >= p.A && (key || tend === "OBSESSION"),
  },
  {
    code: "madoka_god",
    check: (p, path, _key, tend) =>
      path === "PEACE" && (p.A >= p.C || p.B >= p.C) && tend === "SACRIFICE",
  },
  {
    code: "sayaka_siren",
    check: (p, path, _key, tend) =>
      path === "BE_SEEN" && p.B >= p.C && tend === "SACRIFICE",
  },
  {
    code: "kyoko_pragmatist",
    check: (p, path, _key, tend) =>
      (path === "DESTRUCTION" || path === "PEACE") && p.C >= p.A && tend === "OBSESSION",
  },
  // emma_truth: 兜底，恒真
];

const FALLBACK_CODE = "emma_truth";

export function match(input: MatchInput, types: PersonalityTypeInput[]): MatchResult {
  const p = { A: input.postureA, B: input.postureB, C: input.postureC };

  let matchedCode = FALLBACK_CODE;
  for (const c of CHARACTER_CHECKS) {
    if (c.check(p, input.path, input.keyUnlocked, input.tendency)) {
      matchedCode = c.code;
      break;
    }
  }

  const t = types.find((x) => x.code === matchedCode) ?? types.find((x) => x.code === FALLBACK_CODE);
  if (!t) {
    throw new Error("Missing personality types in database (need at least emma_truth)");
  }

  // posture 占比
  const total = p.A + p.B + p.C || 1;
  const pctA = Math.round((p.A / total) * 100);
  const pctC = Math.round((p.C / total) * 100);
  const pctB = 100 - pctA - pctC;
  const posturePct = { A: pctA, B: pctB, C: pctC };
  const similarity = Math.max(pctA, pctB, pctC);
  const userVector = `A ${pctA} · B ${pctB} · C ${pctC}`;

  const tagsArr = (t.tags ?? "").split(",").filter(Boolean);

  return {
    code: t.code,
    name: t.name,
    subtitle: t.subtitle ?? undefined,
    group: t.group,
    ipCode: t.ipCode ?? undefined,
    prosecution: t.prosecution ?? "",
    softlanding: t.softlanding ?? "",
    tags: tagsArr.join(", "),
    slogan: t.slogan ?? "",
    desc: t.desc ?? "",
    keywords: t.keywords ?? undefined,
    similarity,
    userVector,
    templateVector: tagsArr.join(" / "),
    top3: [{ code: t.code, name: t.name, similarity, translations: t.translations }],
    group_label: t.group,
    borderType: false,
    special: false,
    translations: t.translations,
    posturePct,
  };
}
