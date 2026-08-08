// ============================================================================
// IP Registry — 跨IP作品元信息注册表
// ----------------------------------------------------------------------------
// A1/A3：每IP一个内容pack，但作品元信息（title/workIntro）集中注册，
// 供结果页按 result.ipCode 查询"来自《XX》"+ 一句话作品介绍。
// 新增 IP 时在此注册一行 + 建 content/packs/<ip>/config.ts。
// ============================================================================

import { witchTrialPack } from "@/content/packs/witch-trial";
import { MADOKA_TITLE, MADOKA_WORK_INTRO, MADOKA_IP_CODE } from "@/content/packs/madoka/config";

export interface IpMeta {
  /** IP 标识，与 PersonalityType.ipCode 对应 */
  ipCode: string;
  /** 作品名（"魔法少女小圆"），用于"来自《XX》"展示 */
  title: string;
  /** 一句话情绪式作品介绍（A3 per-IP 共用一句） */
  workIntro: string;
}

/** 全部已注册 IP 的元信息。新增 IP 在此追加。 */
export const IP_REGISTRY: Record<string, IpMeta> = {
  "witch-trial": {
    ipCode: "witch-trial",
    title: witchTrialPack.title, // "魔女审判"
    workIntro: witchTrialPack.workIntro ?? "", // "一部关于「在死亡回溯中守住一个人」的故事"
  },
  [MADOKA_IP_CODE]: {
    ipCode: MADOKA_IP_CODE,
    title: MADOKA_TITLE,
    workIntro: MADOKA_WORK_INTRO,
  },
};

/** fallback：未知 ipCode 用魔女审判兜底（向后兼容） */
const FALLBACK_IP: IpMeta = IP_REGISTRY["witch-trial"];

/** 按 ipCode 查作品元信息，未知则 fallback */
export function getIpMeta(ipCode?: string | null): IpMeta {
  if (ipCode && IP_REGISTRY[ipCode]) return IP_REGISTRY[ipCode];
  return FALLBACK_IP;
}

/** 列出所有已注册 IP（供调试/admin） */
export function listIpCodes(): string[] {
  return Object.keys(IP_REGISTRY);
}
