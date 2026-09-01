"use client";

/**
 * spells/useGrimoire.ts — 见证账本（图鉴数据源）
 *
 * 记录用户"见证过"的能力：答题中触发、结果页觉醒、404 治疗各算一次见证。
 * localStorage key: witch-trial-grimoire —— 跨会话累计，是收集闭环（集齐大魔女）的地基。
 * 阶段 0 先建 API；结果页图鉴 UI / 集齐判定在阶段 2/3 接线。
 */

import { useCallback, useState } from "react";

const GRIMOIRE_KEY = "witch-trial-grimoire";

export interface GrimoireData {
  /** 能力 id → 见证次数 */
  seen: Record<string, number>;
  /** 首次见证时间线（能力 id → epoch ms），图鉴可展示收集轨迹 */
  firstSeenAt: Record<string, number>;
}

function read(): GrimoireData {
  if (typeof window === "undefined") return { seen: {}, firstSeenAt: {} };
  try {
    const raw = localStorage.getItem(GRIMOIRE_KEY);
    if (!raw) return { seen: {}, firstSeenAt: {} };
    const data = JSON.parse(raw) as Partial<GrimoireData>;
    return {
      seen: data.seen ?? {},
      firstSeenAt: data.firstSeenAt ?? {},
    };
  } catch {
    return { seen: {}, firstSeenAt: {} };
  }
}

/** 模块级直读（跨实例/跨组件取最新账本，如集齐判定） */
export function readGrimoire(): GrimoireData {
  return read();
}

export function useGrimoire() {
  const [data, setData] = useState<GrimoireData>({ seen: {}, firstSeenAt: {} });

  /** 见证一次能力（幂等累加次数）；返回是否为首次见证 */
  const witness = useCallback((spellId: string): boolean => {
    const cur = read();
    const first = !cur.seen[spellId];
    cur.seen[spellId] = (cur.seen[spellId] ?? 0) + 1;
    if (first) cur.firstSeenAt[spellId] = Date.now();
    try { localStorage.setItem(GRIMOIRE_KEY, JSON.stringify(cur)); } catch { /* ignore */ }
    setData(cur);
    return first;
  }, []);

  const reset = useCallback(() => {
    try { localStorage.removeItem(GRIMOIRE_KEY); } catch { /* ignore */ }
    setData({ seen: {}, firstSeenAt: {} });
  }, []);

  return { data, witness, reset };
}
