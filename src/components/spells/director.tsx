"use client";

/**
 * spells/director.tsx — 调度器 + 事件总线 + 内置传感器
 *
 * 传感器发 SpellEvent → 这里查 registry 匹配触发器 → 克制规则过滤 → 播出。
 * 克制规则（防打扰三定律）：
 *   1. 单次答题（run）全场最多 3 场演出
 *   2. 同一能力每 run 至多一次（oncePerRun）
 *   3. progress 类节点触发之间至少间隔 2 题；正在播时新事件最多缓场 1 个
 * 内置传感器（无须业务组件参与）：
 *   - clickSpree：全局 click 滑动窗口计数（雪莉/亚里沙），带点击坐标
 *   - idle：result 舞台静默计时（蕾雅固定视线）
 *   - hover：quiz 舞台悬停 .test-header 计时（可可千里眼）
 */

import {
  createContext, useCallback, useContext, useEffect, useMemo, useRef, useState,
} from "react";
import type { ReactNode } from "react";
import type { Spell, SpellEvent, SpellPayload, SpellStage } from "./types";
import { SPELLS } from "./registry";
import { useGrimoire } from "./useGrimoire";
import GrimoirePeek from "./effects/grimoire-peek";

interface ActivePerformance {
  spell: Spell;
  payload?: SpellPayload;
}

interface DirectorValue {
  stage: SpellStage;
  emit: (event: SpellEvent) => void;
  active: Spell | null;
  /** 当前演出是否处于降级模式（浮字直显） */
  reducedMotion: boolean;
}

const DirectorContext = createContext<DirectorValue | null>(null);

export function useSpellDirector(): DirectorValue {
  const v = useContext(DirectorContext);
  if (!v) throw new Error("useSpellDirector 必须在 DirectorProvider 内使用");
  return v;
}

const MAX_PER_RUN = 3;
const MIN_GAP_QUESTIONS = 2;

export function DirectorProvider({ stage, children }: { stage: SpellStage; children: ReactNode }) {
  const [active, setActive] = useState<ActivePerformance | null>(null);
  const [reducedMotion, setReducedMotion] = useState(false);
  const { witness } = useGrimoire();
  const witnessRef = useRef(witness);
  useEffect(() => { witnessRef.current = witness; }, [witness]);
  const playedRef = useRef<Set<string>>(new Set());
  const playCountRef = useRef(0);
  const lastQIndexRef = useRef<number | null>(null);
  const pendingRef = useRef<ActivePerformance | null>(null);
  const activeRef = useRef<ActivePerformance | null>(null);
  // clickSpree 滑动窗口：连点计数 + 最近点击坐标（裂纹/火苗锚定用）
  const clicksRef = useRef<{ t: number; x: number; y: number }[]>([]);

  // ref 不在 render 期写入：active 状态经 effect 镜像到 ref（react-hooks/refs）
  useEffect(() => { activeRef.current = active; }, [active]);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    queueMicrotask(() => setReducedMotion(mq.matches));
    const onChange = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  /** 播一场；正在播则缓场（队列长度 1，后来的顶掉旧的——克制：错过就错过） */
  const play = useCallback((spell: Spell, payload?: SpellPayload) => {
    if (activeRef.current) {
      pendingRef.current = { spell, payload };
      return;
    }
    playedRef.current.add(spell.id);
    playCountRef.current += 1;
    witnessRef.current(spell.id); // 见证账本：每次真实播出都记入图鉴
    setActive({ spell, payload });
  }, []);

  /** 演出完毕回调（演出组件 onDone）：接续缓场 */
  const finishActive = useCallback(() => {
    setActive(null);
    const next = pendingRef.current;
    pendingRef.current = null;
    if (next) setTimeout(() => play(next.spell, next.payload), 800);
  }, [play]);

  // bodyClass：演出期间挂在 <body> 上的 CSS 钩子（真实 UI 演出，如汉娜漂浮）
  useEffect(() => {
    if (reducedMotion || !active?.spell.bodyClass) return;
    const cls = active.spell.bodyClass;
    document.body.classList.add(cls);
    return () => { document.body.classList.remove(cls); };
  }, [active, reducedMotion]);

  const emit = useCallback((event: SpellEvent) => {
    // 临时诊断钩子（稳定后移除）：console 里 window.__spellLog 可查调度记录
    const w = window as unknown as { __spellLog?: unknown[] };
    (w.__spellLog ??= []).push({ t: Date.now(), event, stage, played: [...playedRef.current], count: playCountRef.current });
    if (playCountRef.current >= MAX_PER_RUN) return;

    const candidates: Spell[] = [];
    for (const sp of SPELLS) {
      if (sp.stage !== stage) continue;
      if (playedRef.current.has(sp.id) && sp.oncePerRun !== false) continue;
      const hit = sp.triggers.some((tr) => {
        if (tr.kind !== event.kind) return false;
        switch (tr.kind) {
          case "backtrack":
          case "dwell":
          case "clickSpree":
            return true; // 时长/窗口由传感器侧判定
          case "progress": {
            if (event.questionIndex === undefined) return false;
            // 进度节点：接近目标题索引（±1 题容错，防跳答漏判）时掷概率
            const total = 26; // 题量事件补充前的近似值
            const at = Math.round((tr.at / 100) * total);
            if (Math.abs(event.questionIndex - at) > 1) return false;
            return Math.random() < tr.chance;
          }
          case "hover":
          case "idle":
            return true; // 悬停/静默时长由内置传感器判定
          case "awaken":
            // 结果页觉醒：事件 target = 结果角色 code，只命中该角色的能力
            return event.target !== undefined && sp.character === event.target;
          case "notfoundRetry":
            return false; // 阶段 3 接线
        }
      });
      if (hit) candidates.push(sp);
    }
    if (candidates.length === 0) return;

    // 间隔克制：仅约束 progress 类节点触发——瞬时行为（backtrack/dwell/连点）
    // 豁免：它们恰恰发生在"当前题位"，与上一场的题距恒为 0，查题距会永久挡死。
    // oncePerRun 已兜底频次。
    if (
      event.kind === "progress"
      && stage === "quiz"
      && lastQIndexRef.current !== null
      && event.questionIndex !== undefined
    ) {
      if (Math.abs(event.questionIndex - lastQIndexRef.current) < MIN_GAP_QUESTIONS) return;
    }

    // 同触发池多候选（如雪莉/亚里沙共享连点）：取最高优先级，同优先级随机打破平局
    const top = Math.max(...candidates.map((c) => c.priority));
    const topPool = candidates.filter((c) => c.priority === top);
    const winner = topPool[Math.floor(Math.random() * topPool.length)];

    // 玛格模仿：随机指定一个同舞台其他能力作为被模仿对象（账本解锁条件阶段 3 加）
    let payload = event.payload;
    if (winner.id === "margo-imitation") {
      const pool = SPELLS.filter((sp) => sp.stage === stage && sp.id !== "margo-imitation");
      const target = pool[Math.floor(Math.random() * pool.length)];
      payload = { ...payload, imitateId: target?.id };
    }

    if (event.questionIndex !== undefined) lastQIndexRef.current = event.questionIndex;
    play(winner, payload);
  }, [stage, play]);

  // ── 内置传感器：clickSpree（全局滑动窗口，带坐标）──
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const now = Date.now();
      clicksRef.current = clicksRef.current.filter((c) => now - c.t < 2000);
      clicksRef.current.push({ t: now, x: e.clientX, y: e.clientY });
      const hasSpree = SPELLS.some((sp) =>
        sp.stage === stage
        && !playedRef.current.has(sp.id)
        && sp.triggers.some((tr) => tr.kind === "clickSpree")
      );
      if (hasSpree && clicksRef.current.length >= 6 && !activeRef.current) {
        const last = clicksRef.current[clicksRef.current.length - 1];
        clicksRef.current = [];
        emit({ kind: "clickSpree", payload: { x: last.x, y: last.y } });
      }
    };
    window.addEventListener("click", onClick);
    return () => window.removeEventListener("click", onClick);
  }, [stage, emit]);

  // ── 内置传感器：idle（result 舞台静默——蕾雅固定视线）──
  useEffect(() => {
    if (stage !== "result") return;
    const need = SPELLS.some((sp) => sp.stage === "result" && sp.triggers.some((tr) => tr.kind === "idle"));
    if (!need) return;
    let timer = 0;
    const arm = () => {
      clearTimeout(timer);
      timer = window.setTimeout(() => emit({ kind: "idle" }), 8000);
    };
    arm();
    const events: (keyof WindowEventMap)[] = ["click", "mousemove", "keydown", "touchstart"];
    events.forEach((ev) => window.addEventListener(ev, arm, { passive: true }));
    return () => {
      clearTimeout(timer);
      events.forEach((ev) => window.removeEventListener(ev, arm));
    };
  }, [stage, emit]);

  // ── 内置传感器：hover（quiz 舞台悬停 .test-header——可可千里眼）──
  useEffect(() => {
    if (stage !== "quiz") return;
    const need = SPELLS.some((sp) => sp.stage === "quiz" && sp.triggers.some((tr) => tr.kind === "hover"));
    if (!need) return;
    let timer = 0;
    const onMove = (e: MouseEvent) => {
      const inHud = (e.target as HTMLElement | null)?.closest?.(".test-header");
      if (inHud) {
        if (!timer) timer = window.setTimeout(() => emit({ kind: "hover", target: "hud" }), 1500);
      } else if (timer) {
        clearTimeout(timer);
        timer = 0;
      }
    };
    window.addEventListener("mousemove", onMove);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("mousemove", onMove);
    };
  }, [stage, emit]);

  // 舞台切换（quiz↔result）即重置 run 状态：两舞台各自独立的"每场一次"
  useEffect(() => {
    playedRef.current = new Set();
    playCountRef.current = 0;
    lastQIndexRef.current = null;
    pendingRef.current = null;
  }, [stage]);

  const value = useMemo<DirectorValue>(
    () => ({ stage, emit, active: active?.spell ?? null, reducedMotion }),
    [stage, emit, active, reducedMotion],
  );

  return (
    <DirectorContext.Provider value={value}>
      {children}
      <GrimoirePeek />
      {/* quiz 舞台的演出带"题目锚定"标签：台词对得上眼前这道题，
          而不是凭空砸一句角色原话（用户裁决：诺亚的「颜料」硬塞进无关的题很怪）。
          questionMeta 由 TestScreen 随事件带入。 */}
      {active && stage === "quiz" && (
        <div className="spell-badge" aria-hidden="true">
          ✦ 第 {active.payload?.questionIndex ?? "?"} 题 · {active.payload?.questionMeta ?? "灵魂的回响"} · RESONANCE
        </div>
      )}
      {active && (
        <active.spell.Component
          line={active.spell.line}
          reducedMotion={reducedMotion}
          onDone={finishActive}
          payload={active.payload}
        />
      )}
    </DirectorContext.Provider>
  );
}
