"use client";

/**
 * spells/registry.ts — 能力注册表（全员 14 条）
 *
 * 能力名全部经原剧情核实（《魔女审判》txt 剧情逐人宣告段，见 docs 讨论记录）。
 * 台词原则：无预告性——只说能力本身，不说"你走向了谁"（零暗示原则）。
 *
 * 阶段 0：Component 全部可触发（希罗为专属样板，其余用通用浮字占位）；
 *         stage=result 的条目等结果页觉醒管线接线后自然生效（传感器未接=不触发，安全）。
 * 扩展方式：加角色能力 = 加一条注册 + （可选）一个专属 Component 文件。
 */

import type { Spell } from "./types";
import FloatTextSpell from "./effects/float-text";
import ShiroTimeLeap from "./effects/shiro-time-leap";
import SherryCrack from "./effects/sherry-crack";
import AlisaIgnition from "./effects/alisa-ignition";
import HannaLevitate from "./effects/hanna-levitate";
import LeiaFixate from "./effects/leia-fixate";
import NanokaPhantom from "./effects/nanoka-phantom";
import MargoImitation from "./effects/margo-imitation";
import CocoClairvoyance from "./effects/coco-clairvoyance";
import MiriaSwap from "./effects/miria-swap";
import YukiAbyss from "./effects/yuki-abyss";

export const SPELLS: Spell[] = [
  // ── 答题中（quiz）——触发全为行为元数据 ──
  // 注：希罗「死亡回溯」不在答题中触发——能力的叙事前提是"走完这一天"，
  // 只有结果页（一天终结、结果已宣判）撑得起"回到今天早上"，
  // 答到一半突然回去既突兀又廉价化能力（2026-09-01 用户裁决）。见 result 区。
  {
    id: "hanna-levitate",
    character: "HANNA",
    ability: "飘浮",
    stage: "quiz",
    triggers: [{ kind: "progress", at: 40, chance: 0.5 }],
    line: "重力，不过是诸位共享的错觉。",
    priority: 3,
    bodyClass: "spell-hanna",
    Component: HannaLevitate,
  },
  // 连点触发已移除（2026-09-01 用户裁决）：正常答题者不会连点，会连点的只有
  // 乱点/测试者——重演出打在负面情绪时刻是错位的。雪莉/亚里沙改结果页觉醒，
  // "砸开卷宗 / 火光显形"的终局仪式感才是两个能力该有的分量。
  {
    id: "sherry-strength",
    character: "SHERRY",
    ability: "怪力",
    stage: "result",
    triggers: [{ kind: "awaken" }],
    line: "有意思。",
    priority: 10,
    bodyClass: "spell-quake",
    Component: SherryCrack,
  },
  {
    id: "alisa-ignition",
    character: "ALISA",
    ability: "点火",
    stage: "result",
    triggers: [{ kind: "awaken" }],
    line: "点火。",
    priority: 10,
    Component: AlisaIgnition,
  },
  {
    id: "anan-brainwash",
    character: "ANAN",
    ability: "洗脑",
    stage: "quiz",
    triggers: [{ kind: "progress", at: 55, chance: 0.4 }],
    line: "认可我。",
    priority: 3,
    Component: FloatTextSpell,
  },
  {
    id: "noa-liquid",
    character: "NOAH",
    ability: "操纵液体",
    stage: "quiz",
    triggers: [{ kind: "progress", at: 70, chance: 0.4 }],
    line: "颜料会替我说完剩下的。",
    priority: 3,
    Component: FloatTextSpell,
  },
  {
    id: "coco-clairvoyance",
    character: "COCO",
    ability: "千里眼",
    stage: "quiz",
    triggers: [{ kind: "hover", target: "hud", ms: 1500 }],
    line: "你在看着我，所以我看得到。",
    priority: 5,
    Component: CocoClairvoyance,
  },
  {
    id: "margo-imitation",
    character: "MARGO",
    ability: "模仿",
    stage: "quiz",
    triggers: [{ kind: "progress", at: 85, chance: 0.35 }],
    line: "这一招，我学起来了。",
    priority: 2,
    Component: MargoImitation,
  },

  // ── 结果页（result）——觉醒/停留触发，阶段 2 接线 ──
  {
    id: "hiro-time-leap",
    character: "HIRO",
    ability: "死亡回溯",
    stage: "result",
    // 觉醒演出叙事：答完全部题 = 走完一整天；结果落锤后揭示
    // "这份结果正是回溯之后的那一次"——前提明确，不打断作答。
    triggers: [{ kind: "awaken" }],
    line: "只要用我的魔法，就能回到今天早上。",
    priority: 10,
    Component: ShiroTimeLeap,
  },
  {
    id: "emma-witch-killer",
    character: "EMMA",
    ability: "魔女杀手",
    stage: "result",
    triggers: [{ kind: "awaken" }],
    line: "你们是错的。",
    priority: 10,
    Component: FloatTextSpell,
  },
  {
    id: "miria-swap",
    character: "MIRIA",
    ability: "互换",
    stage: "result",
    triggers: [{ kind: "awaken" }],
    line: "这具身体里，装着谁的灵魂？",
    priority: 10,
    bodyClass: "spell-miria",
    Component: MiriaSwap,
  },
  {
    id: "nanoka-phantom-vision",
    character: "NANOKA",
    ability: "幻视",
    stage: "result",
    triggers: [{ kind: "awaken" }],
    line: "我看见了你还没走到的未来。",
    priority: 10,
    Component: NanokaPhantom,
  },
  {
    id: "meruru-heal",
    character: "MERURU",
    ability: "治疗",
    stage: "result",
    // 阶段 3：notfound 页按重试计数触发分档治愈演出
    triggers: [{ kind: "awaken" }, { kind: "notfoundRetry" }],
    line: "伤口，会好的。",
    priority: 8,
    Component: FloatTextSpell,
  },
  {
    id: "leia-fixate",
    character: "LEIA",
    ability: "固定视线",
    stage: "result",
    triggers: [{ kind: "idle", ms: 8000 }],
    line: "不要移开视线。",
    priority: 4,
    Component: LeiaFixate,
  },
  {
    id: "yuki-great-witch",
    character: "YUKI",
    ability: "大魔女",
    stage: "result",
    // 集齐判定在 AwakenBridge：见证账本集齐其余全部能力后追加本场
    triggers: [{ kind: "awaken" }],
    line: "所有魔法的源头，正注视着你。",
    priority: 1,
    Component: YukiAbyss,
  },

  // ── 小圆系客串角色（madoka pack 结果池）——觉醒演出 ──
  {
    id: "homura-time-backlash",
    character: "HOMURA",
    ability: "时间回溯",
    stage: "result",
    triggers: [{ kind: "awaken" }],
    line: "这个结局，由我来改变。",
    priority: 10,
    Component: FloatTextSpell,
  },
  {
    id: "madoka-rewrite",
    character: "MADOKA",
    ability: "因果改写",
    stage: "result",
    triggers: [{ kind: "awaken" }],
    line: "我许下的愿望，会把这一切重写。",
    priority: 10,
    Component: FloatTextSpell,
  },
  {
    id: "sayaka-heal",
    character: "SAYAKA",
    ability: "治愈",
    stage: "result",
    triggers: [{ kind: "awaken" }],
    line: "这份痛，由我来承受。",
    priority: 10,
    Component: FloatTextSpell,
  },
  {
    id: "kyoko-barrier",
    character: "KYOKO",
    ability: "结界",
    stage: "result",
    triggers: [{ kind: "awaken" }],
    line: "结界，展开。别死在里面。",
    priority: 10,
    Component: FloatTextSpell,
  },
  {
    id: "mami-tiro-finale",
    character: "MAMI",
    ability: "Tiro Finale",
    stage: "result",
    triggers: [{ kind: "awaken" }],
    line: "Tiro Finale.",
    priority: 10,
    Component: FloatTextSpell,
  },

  // ── 特殊变体（隐藏结果）——专属台词 ──
  {
    id: "homura-devil-awaken",
    character: "homura_devil",
    ability: "恶魔之爱",
    stage: "result",
    triggers: [{ kind: "awaken" }],
    line: "这份执念，连神明都要退让。",
    priority: 10,
    Component: FloatTextSpell,
  },
  {
    id: "madoka-god-awaken",
    character: "madoka_god",
    ability: "圆环之理",
    stage: "result",
    triggers: [{ kind: "awaken" }],
    line: "已经没有什么好怕的了。",
    priority: 10,
    Component: FloatTextSpell,
  },
  {
    id: "sayaka-siren-awaken",
    character: "sayaka_siren",
    ability: "悲叹回响",
    stage: "result",
    triggers: [{ kind: "awaken" }],
    line: "为别人许的愿，为什么会变成这样。",
    priority: 10,
    Component: FloatTextSpell,
  },
  {
    id: "kyoko-pragmatist-awaken",
    character: "kyoko_pragmatist",
    ability: "利己的真心",
    stage: "result",
    triggers: [{ kind: "awaken" }],
    line: "原则这种东西，饿肚子的时候最诚实。",
    priority: 10,
    Component: FloatTextSpell,
  },
  {
    id: "emma-truth-awaken",
    character: "emma_truth",
    ability: "审判者权能",
    stage: "result",
    triggers: [{ kind: "awaken" }],
    line: "魔女杀手，就此就位。",
    priority: 10,
    Component: FloatTextSpell,
  },
];
