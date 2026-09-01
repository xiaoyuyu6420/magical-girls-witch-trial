"use client";

/**
 * spells/types.ts — 魔法演出系统类型定义（2026-09-01）
 *
 * 设计原则（与产品确认过）：
 * 1. 零暗示：答题中的触发只用"行为元数据"（停留/翻页/连点/悬停/进度/随机），
 *    绝不用选项语义（gate/trigger 的 value 不进触发器）——演出不能变成结果预告。
 * 2. 零耦合：本系统不 import 任何计分/匹配模块，match 管线不受影响。
 * 3. 反向锚定：结果页觉醒演出由 result.code 路由——结果先定、演出后播，
 *    是确认仪式而非预告。
 * 4. 克制：单次答题全场最多 3 场、两场间隔 ≥2 题、reduced-motion 降级为浮字。
 */

import type { ComponentType } from "react";

/** 演出舞台：能力按"干涉什么"决定出场位置 */
export type SpellStage = "quiz" | "result" | "notfound";

/** 触发器——全部是行为元数据，无选项语义 */
export type SpellTrigger =
  | { kind: "backtrack" }                          // 翻回上一题
  | { kind: "dwell"; ms: number }                  // 单题停留超时
  | { kind: "clickSpree"; clicks: number; windowMs: number } // 窗口内连点（雪莉/亚里沙共享池）
  | { kind: "hover"; target: string; ms: number }  // 悬停某目标超时（可可）
  | { kind: "progress"; at: number; chance: number } // 进度节点 + 概率
  | { kind: "idle"; ms: number }                   // 结果页停留无操作（蕾雅）
  | { kind: "awaken" }                             // 结果页觉醒：result.code 命中角色
  | { kind: "notfoundRetry" }                      // 404 重试计数（梅露露，阶段3接）

/** 演出附带数据：点击坐标 / 觉醒的"另一种可能" / 被模仿的能力 id */
export interface SpellPayload {
  /** clickSpree 类触发的点击位置（视口坐标），裂纹/火苗锚定用 */
  x?: number;
  y?: number;
  /** awaken 时传入：top3 次高角色名（奈叶香幻视的"另一种可能"） */
  altName?: string;
  /** 玛格模仿：被模仿能力的 registry id */
  imitateId?: string;
  /** 答题中触发时带入：当前题号与题目标题（演出锚定"这一题"，不硬塞） */
  questionIndex?: number;
  questionMeta?: string;
}

/** 传给演出组件的 props：播完必须调 onDone（Director 据此清理/放行下一场） */
export interface SpellProps {
  /** 浮字台词（registry 集中管理，后续四语翻译只动 registry） */
  line: string;
  reducedMotion: boolean;
  onDone: () => void;
  payload?: SpellPayload;
}

/**
 * 能力注册项。
 * bodyClass：演出期间挂到 <body> 的类（驱动真实 UI 的 CSS 演出，如汉娜漂浮、
 * 雪莉震屏）；挂/摘由 Director 管理，reduced-motion 时跳过。
 */
export interface Spell {
  id: string;
  /** PERSONALITY_TYPES 里的角色 code（如 HIRO），结果页觉醒按此路由 */
  character: string;
  /** 能力名（图鉴展示用） */
  ability: string;
  stage: SpellStage;
  triggers: SpellTrigger[];
  /** 浮字台词 */
  line: string;
  /** 调度优先级：数值大者先播（直触 > 行为 > 随机） */
  priority: number;
  /** 每次答题（run）最多播一次。默认 true */
  oncePerRun?: boolean;
  /** 演出期间挂到 body 的类 */
  bodyClass?: string;
  /** 演出组件（必须调 onDone） */
  Component: ComponentType<SpellProps>;
}

/** 传感器 → Director 的事件 */
export interface SpellEvent {
  kind: SpellTrigger["kind"];
  /** 答题页事件须携带当前题索引（间隔克制规则依赖它） */
  questionIndex?: number;
  /** awaken：结果角色 code；hover：目标标识 */
  target?: string;
  /** 随事件透传给演出组件的附带数据（坐标/altName/imitateId） */
  payload?: SpellPayload;
}
