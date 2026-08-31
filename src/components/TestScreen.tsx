"use client";

import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import { BalanceScaleIcon } from "./BalanceScaleIcon";
import { useI18n } from "@/lib/i18n";
import type { AnnotationNode } from "@/lib/annotations";
import { ANNOTATION_FALLBACKS } from "@/lib/annotations";
import { renderRichText } from "@/lib/rich-text";
import { BackgroundLayers } from "./BackgroundLayers";

export interface QuizQuestion {
  id: number; dim: string; text: string; order: number; type: string; meta: string;
  renderType: string;
  translations?: string;
  options: QuizOption[];
}

export interface QuizOption {
  id: number; label: string; score?: number; value?: string | null; trigger?: string | null;
}

interface TestScreenProps {
  questions: QuizQuestion[];
  onComplete: (result: {
    answers: { questionId: number; optionId: number }[];
    gateValue?: string;
  }) => void;
  onExit: () => void;
}

const STORAGE_KEY = "witch-trial-progress";
const ROMAN = ["I", "II", "III", "IV", "V"];
const INTERJECTION_NODES: AnnotationNode[] = [5, 10, 15];

/**
 * 把选项 label 拆成「主句 + 尾部括号吐槽」。
 * label 形如 `主句。（吐槽。）（触发特殊分支）【标记】`——从尾部循环剥离 （…）
 * 作为 aside，尾部 【…】 保留在主句末尾（scale 题的【纯洁殉道】等倾向标签）。
 * 拆不出来（如 weight 编码 label / 无吐槽选项）时原样返回，渲染端零行为变化。
 */
export function splitOptionLabel(label: string): { main: string; asides: string[] } {
  const asides: string[] = [];
  let rest = label.trimEnd();
  const tag = rest.match(/(【[^】]*】)\s*$/);
  if (tag) rest = rest.slice(0, tag.index).trimEnd();
  for (;;) {
    const m = rest.match(/（([^（）]*)）\s*$/);
    if (!m) break;
    asides.unshift(m[1]);
    rest = rest.slice(0, m.index).trimEnd();
  }
  return { main: rest + (tag ?? ""), asides };
}

function readSavedProgress(): {
  currentIndex: number;
  answers: { questionId: number; optionId: number }[];
  gateValue: string | undefined;
} {
  if (typeof window === "undefined") {
    return { currentIndex: 0, answers: [], gateValue: undefined };
  }

  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return { currentIndex: 0, answers: [], gateValue: undefined };
    const data = JSON.parse(saved) as {
      currentIndex?: unknown;
      answers?: unknown;
      gateValue?: unknown;
    };
    if (!Array.isArray(data.answers) || typeof data.currentIndex !== "number" || data.currentIndex <= 0) {
      return { currentIndex: 0, answers: [], gateValue: undefined };
    }
    return {
      currentIndex: data.currentIndex,
      answers: data.answers as { questionId: number; optionId: number }[],
      gateValue: typeof data.gateValue === "string" ? data.gateValue : undefined,
    };
  } catch {
    return { currentIndex: 0, answers: [], gateValue: undefined };
  }
}

/**
 * 生成放大镜位移贴图：每像素 R/G 通道编码"该输出像素应从背景哪里采样"。
 * 透镜模型——放大率随半径衰减（中心最强）+ 边缘 rim 反向位移（桶形畸变），
 * 供 feDisplacementMap 逐像素折射背景内容（真畸变，非贴图假光影）。
 */
function buildLensMap(size = 168): string {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) return "";
  const img = ctx.createImageData(size, size);
  const half = size / 2;
  const SCALE = 110; // 须与 CSS 侧 feDisplacementMap scale 一致
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const px = x + 0.5 - half;
      const py = y + 0.5 - half;
      const r = Math.hypot(px, py) / half;
      let dr = 0.5;
      let dg = 0.5;
      if (r <= 1) {
        // 放大率：中心 ~1.75x，向边缘衰减到 ~1.0x
        const mag = 1 + 0.75 * Math.pow(Math.max(0, 1 - r), 1.15);
        // rim：最外 15% 半径额外向外弯，做出玻璃厚边的折射暗环
        const rim = r > 0.85 ? Math.pow((r - 0.85) / 0.15, 2) * 0.3 : 0;
        const k = (1 - 1 / mag) + rim;
        dr = 0.5 - (px * k) / SCALE;
        dg = 0.5 - (py * k) / SCALE;
      }
      const i = (y * size + x) * 4;
      img.data[i] = Math.max(0, Math.min(255, dr * 255));
      img.data[i + 1] = Math.max(0, Math.min(255, dg * 255));
      img.data[i + 2] = 128;
      img.data[i + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  return canvas.toDataURL();
}

/** 把放大镜 SVG 滤镜注入文档（一次），供 cursor-ring 的 backdrop-filter 引用 */
function injectLensFilter(): void {
  if (document.getElementById("witch-lens")) return;
  const map = buildLensMap();
  if (!map) return;
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("aria-hidden", "true");
  svg.setAttribute("style", "position:absolute;width:0;height:0;pointer-events:none");
  // feImage 尺寸须与 hover 态 ring 尺寸（84px）一致，位移贴图恰好铺满滤镜区
  svg.innerHTML =
    `<filter id="witch-lens" x="0" y="0" width="100%" height="100%" color-interpolation-filters="sRGB">` +
    `<feImage href="${map}" x="0" y="0" width="84" height="84" preserveAspectRatio="none" result="map"/>` +
    `<feDisplacementMap in="SourceGraphic" in2="map" scale="110" xChannelSelector="R" yChannelSelector="G"/>` +
    `</filter>`;
  document.body.appendChild(svg);
}

/**
 * 答题页自定义光标（2026-08-31，用户反馈"首页有鼠标效果答题页没了"）：
 * 复刻首页 light 版——金点立即跟随 + 圆环延迟跟随（rAF lerp），悬停可点元素
 * 时 dot 缩没、ring 放大变金（body.hovering，样式在 globals.css 已有），
 * 1.5s 无移动自动淡出。触屏 / reduced-motion 不启动。
 * DOM 挂在组件内而非全局：/test 直开与 iframe 嵌入两种场景都生效。
 */
function CustomCursor() {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (window.matchMedia("(pointer: coarse)").matches) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    injectLensFilter();
    const dot = dotRef.current;
    const ring = ringRef.current;
    if (!dot || !ring) return;

    const mouse = { x: -100, y: -100 };
    const ringPos = { x: -100, y: -100 };
    let raf = 0;
    let idleTimer = 0;
    let started = false;

    const setVisible = (v: boolean) => {
      dot.style.opacity = v ? "1" : "0";
      ring.style.opacity = v ? "1" : "0";
    };
    setVisible(false);

    const onMove = (e: MouseEvent) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
      dot.style.transform = `translate(${mouse.x}px, ${mouse.y}px) translate(-50%, -50%)`;
      if (!started) {
        ringPos.x = mouse.x;
        ringPos.y = mouse.y;
        started = true;
      }
      setVisible(true);
      clearTimeout(idleTimer);
      idleTimer = window.setTimeout(() => setVisible(false), 1500);
      const target = e.target as HTMLElement | null;
      document.body.classList.toggle(
        "hovering",
        !!target?.closest("button, a, .opt-block, .balance-pan, .weight-card, .interjection-overlay"),
      );
    };

    const loop = () => {
      ringPos.x += (mouse.x - ringPos.x) * 0.16;
      ringPos.y += (mouse.y - ringPos.y) * 0.16;
      ring.style.transform = `translate(${ringPos.x}px, ${ringPos.y}px) translate(-50%, -50%)`;
      raf = requestAnimationFrame(loop);
    };

    window.addEventListener("mousemove", onMove);
    raf = requestAnimationFrame(loop);
    return () => {
      window.removeEventListener("mousemove", onMove);
      cancelAnimationFrame(raf);
      clearTimeout(idleTimer);
      document.body.classList.remove("hovering");
    };
  }, []);
  return (
    <>
      <div id="cursor-dot" ref={dotRef} aria-hidden="true" />
      <div id="cursor-ring" ref={ringRef} aria-hidden="true" />
    </>
  );
}

export default function TestScreen({ questions, onComplete, onExit }: TestScreenProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<{ questionId: number; optionId: number }[]>([]);
  const [gateValue, setGateValue] = useState<string | undefined>();
  const [isAnimating, setIsAnimating] = useState(false);
  const [selectedOptionId, setSelectedOptionId] = useState<number | null>(null);
  const { t, locale } = useI18n();
  const [stageFadeOut, setStageFadeOut] = useState(false);
  const [toastVerdict, setToastVerdict] = useState(false);
  const [showKeyboardHint, setShowKeyboardHint] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const stageRef = useRef<HTMLDivElement>(null);
  const pendingRef = useRef<{
    answers: { questionId: number; optionId: number }[];
    gateValue: string | undefined;
    isLast: boolean;
  } | null>(null);
  const touchFeedbackRef = useRef(false);
  const timerRef = useRef<number>(0);
  const fadeTimerRef = useRef<number>(0);
  const toastTimerRef = useRef<number>(0);

  // ── 批注插页：独立 state，不改 currentIndex ──
  const [interjection, setInterjection] = useState<AnnotationNode | null>(null);
  const [interjectionText, setInterjectionText] = useState<string>("");
  const [interjectionExiting, setInterjectionExiting] = useState(false);
  const interjectionFetchedRef = useRef(false);
  // 记录已展示过的批注节点，避免点击关闭后 useEffect 因 answers.length 未变而重新触发（无限重开 bug）
  const shownInterjectionsRef = useRef<Set<AnnotationNode>>(new Set());

  // ── 砝码题：三槽分配值 ──
  const [weightSlots, setWeightSlots] = useState<[number, number, number]>([1, 1, 1]);

  // ── prefers-reduced-motion 检测（仅视觉层：传给 BackgroundLayers 控制 Canvas/浮雕）──
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    // 微任务读初始值（同下方恢复进度的既有模式，避免 effect 内同步 setState）
    queueMicrotask(() => setReducedMotion(mq.matches));
    const onChange = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  // ── 桌面/移动端检测：视觉排版按端回退（2026-08-14 桌面回 HEAD 旧金气质）。
  // 桌面：水印/序号用罗马数字、q-meta 内嵌计数；移动端：32 皮肤阿拉伯数字 + HUD 计数器。
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(min-width: 769px)");
    queueMicrotask(() => setIsDesktop(mq.matches));
    const onChange = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    queueMicrotask(() => {
      const saved = readSavedProgress();
      setAnswers(saved.answers);
      setCurrentIndex(saved.currentIndex);
      setGateValue(saved.gateValue);
      const isTouchLike = window.matchMedia("(pointer: coarse)").matches || "ontouchstart" in window;
      touchFeedbackRef.current = isTouchLike;
      setShowKeyboardHint(!isTouchLike);
    });
  }, []);

  useEffect(() => {
    // Don't save the empty initial state — readSavedProgress ignores it anyway
    if (currentIndex === 0 && answers.length === 0) return;
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ currentIndex, answers, gateValue })); } catch { /* ignore */ }
  }, [currentIndex, answers, gateValue]);

  useEffect(() => {
    return () => {
      clearTimeout(timerRef.current);
      clearTimeout(fadeTimerRef.current);
      clearTimeout(toastTimerRef.current);
    };
  }, []);

  const displayQuestions = useMemo(() => {
    if (locale === "zh-CN") {
      return questions.filter((q) => {
        if (q.type === "trigger") return gateValue === "destroy" || gateValue === "seen";
        return true;
      });
    }

    return questions.map((q) => {
      try {
        const trans = JSON.parse(q.translations || "{}");
        const lt = trans[locale] as { text?: string; meta?: string; options?: string[] } | undefined;
        if (!lt) return q;
        return {
          ...q,
          text: lt.text || q.text,
          meta: lt.meta || q.meta,
          options: q.options.map((opt, i) => ({
            ...opt,
            label: lt.options?.[i] || opt.label,
          })),
        };
      } catch {
        return q;
      }
    }).filter((q) => {
      if (q.type === "trigger") return gateValue === "destroy" || gateValue === "seen";
      return true;
    });
  }, [questions, locale, gateValue]);

  // 防越界：currentIndex 不能超过 displayQuestions 长度（语言切换后题目数量可能变化）
  const safeIndex = Math.min(currentIndex, Math.max(0, displayQuestions.length - 1));
  const current = displayQuestions[safeIndex];
  const progress = displayQuestions.length > 0 ? (safeIndex / displayQuestions.length) * 100 : 0;

  // ── 砝码题：当题切换时重置 slots 为 0（HTML「审判庭」从零分配）──
  useEffect(() => {
    let disposed = false;
    queueMicrotask(() => {
      if (!disposed && current?.renderType === "weight") setWeightSlots([0, 0, 0]);
    });
    return () => { disposed = true; };
  }, [safeIndex, current?.renderType]);

  // ── 换题时恢复已选高亮（回看场景：进入已答题显示上次的选择）──
  // isRecap=true 表示当前选中来自"回看恢复"而非本次点击——渲染端据此跳过
  // is-selected/is-dimmed 折叠动效（否则回看已答题时其他选项被压成细条无法点选，
  // 桌面尤甚——2026-08-31 用户反馈"答案占满整个答题区域"即此）。
  const [isRecap, setIsRecap] = useState(false);
  useEffect(() => {
    let disposed = false;
    queueMicrotask(() => {
      if (disposed) return;
      const saved = answers[safeIndex];
      setSelectedOptionId(saved ? saved.optionId : null);
      setIsRecap(true);
    });
    return () => { disposed = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [safeIndex]);

  // ── 批注插页：answers.length 命中 5/10/15 且未显示过时触发 ──
  useEffect(() => {
    if (interjection !== null) return; // 已在显示
    if (isAnimating) return;
    const node = INTERJECTION_NODES.find((n) => n === answers.length);
    if (node !== undefined && !shownInterjectionsRef.current.has(node)) {
      shownInterjectionsRef.current.add(node);
      setInterjection(node);
      interjectionFetchedRef.current = false;
    }
  }, [answers.length, interjection, isAnimating]);

  // ── 批注插页：fetch /api/annotation ──
  useEffect(() => {
    if (interjection === null || interjectionFetchedRef.current) return;
    interjectionFetchedRef.current = true;
    fetch(`/api/annotation?node=${interjection}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ answers }),
    })
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((data: { text: string }) => {
        setInterjectionText(data.text);
      })
      .catch(() => {
        // fallback 静态文案
        setInterjectionText(ANNOTATION_FALLBACKS[interjection] ?? "");
      });
  }, [interjection, answers]);

  // ── 批注浮条：从背景浮现、自动消散，不打断答题（可点击提前关闭）──
  const dismissInterjection = useCallback(() => {
    if (interjectionExiting) return;
    setInterjectionExiting(true);
    setTimeout(() => {
      setInterjection(null);
      setInterjectionText("");
      setInterjectionExiting(false);
    }, 500);
  }, [interjectionExiting]);

  useEffect(() => {
    if (interjection === null) return;
    const t = setTimeout(dismissInterjection, 4200);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [interjection, interjectionText]);

  const flushPending = useCallback(() => {
    clearTimeout(timerRef.current);
    clearTimeout(fadeTimerRef.current);
    const p = pendingRef.current;
    if (!p) return;
    pendingRef.current = null;
    if (p.isLast) {
      const progressLine = document.getElementById("progress-line");
      if (progressLine) progressLine.style.width = "100%";
      localStorage.removeItem(STORAGE_KEY);
      setIsCompleted(true);
      onComplete({ answers: p.answers, gateValue: p.gateValue });
    } else {
      setAnswers(p.answers);
      setCurrentIndex((i) => {
        maxVisitedRef.current = Math.max(maxVisitedRef.current, i + 1);
        return i + 1;
      });
      setStageFadeOut(false);
    }
    setIsAnimating(false);
    setSelectedOptionId(null);
    setIsRecap(false);
  }, [onComplete]);

  const handleSelect = useCallback((option: QuizOption) => {
    // If animating, skip current animation and apply pending state first
    if (isAnimating) {
      flushPending();
      // Return — the next keypress on the NEW question will be a fresh handleSelect
      return;
    }
    setIsAnimating(true);
    setSelectedOptionId(option.id);
    setIsRecap(false);
    document.body.classList.remove("hovering");

    const isTouchFeedback = touchFeedbackRef.current
      || window.matchMedia("(max-width: 768px)").matches;

    // ✦ 契约已被记录 ✦ —— desktop 保留；手机 CSS 隐藏，卡片金边本身
    // 已经是更直接的确认反馈。仍维护短计时以保持状态机/无障碍契约不变。
    setToastVerdict(true);
    clearTimeout(toastTimerRef.current);
    toastTimerRef.current = window.setTimeout(
      () => setToastVerdict(false),
      isTouchFeedback ? 260 : 400
    );

    const answer = { questionId: current.id, optionId: option.id };
    // 按 safeIndex 覆盖（支持回看改答）：写入当前位置，保留后续已答
    const newAnswers = [...answers];
    newAnswers[safeIndex] = answer;
    let newGateValue = gateValue;
    if (current.type === "gate" && option.value) { newGateValue = option.value; setGateValue(option.value); }

    if (navigator.vibrate) navigator.vibrate(isTouchFeedback ? 12 : 40);

    const isLast = safeIndex >= displayQuestions.length - 1;
    pendingRef.current = { answers: newAnswers, gateValue: newGateValue, isLast };

    // Mobile keeps one quiet confirmation beat: 180ms selected state followed
    // by an opacity-only crossfade. Desktop retains the original cadence.
    const feedbackDelay = isTouchFeedback ? 180 : 400;
    const totalDelay = isTouchFeedback ? 360 : 700;
    fadeTimerRef.current = window.setTimeout(() => {
      setStageFadeOut(true);
    }, feedbackDelay);
    timerRef.current = window.setTimeout(() => {
      flushPending();
    }, totalDelay);
  }, [current, answers, gateValue, safeIndex, displayQuestions.length, isAnimating, flushPending]);

  // ── 砝码题：9确认提交（查找匹配的 optionId）──
  const handleWeightConfirm = useCallback(() => {
    if (!current) return;
    const [a, b, c] = weightSlots;
    if (a + b + c !== 3) return;
    const targetLabel = `weight::${a}|${b}|${c}`;
    const matched = current.options.find((o) => o.label === targetLabel);
    if (matched) {
      handleSelect(matched);
    }
  }, [current, weightSlots, handleSelect]);

  // ── 中止当前题的推进动画（动画中回退时调用：丢弃未确认的作答，清掉
  //    stage-fade-out 压缩/淡出残影，避免视觉上"被压缩的题"残留）──
  const cancelPending = useCallback(() => {
    clearTimeout(timerRef.current);
    clearTimeout(fadeTimerRef.current);
    clearTimeout(toastTimerRef.current);
    pendingRef.current = null;
    setIsAnimating(false);
    setStageFadeOut(false);
    setSelectedOptionId(null);
    setIsRecap(false);
    setToastVerdict(false);
  }, []);

  // ── 返回上一题（回看 + 可改，高亮由 [safeIndex] useEffect 自动恢复）──
  const handleBack = useCallback(() => {
    if (safeIndex <= 0) return;
    // 动画中点击回退：丢弃当前未确认的作答并中止推进，再回退，
    // 否则回退请求被吞、fade 残影残留出现"压缩"视觉。
    if (isAnimating) cancelPending();
    setCurrentIndex(safeIndex - 1);
  }, [safeIndex, isAnimating, cancelPending]);

  // ── 前进下一题（后退后再往回走）。显示条件 = 后方存在"到过的题"：
  // maxVisitedRef 记录本次作答到达过的最大 index（后退不清除），因此
  // 后退 1 步前进键立即可用——不依赖下一题是否已有作答记录。 ──
  const maxVisitedRef = useRef(0);
  const handleForward = useCallback(() => {
    if (isAnimating) cancelPending();
    setCurrentIndex((i) => {
      const next = Math.min(i + 1, maxVisitedRef.current);
      return next > i ? next : i;
    });
  }, [isAnimating, cancelPending]);

  // Keyboard support
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (!current) return;
      const rt = current.renderType ?? current.type;

      // ── 天平题：1=左, 2=右 ──
      if (rt === "scale") {
        if (isAnimating) { flushPending(); return; }
        if (e.key === "1" && current.options[0]) handleSelect(current.options[0]);
        if (e.key === "2" && current.options[1]) handleSelect(current.options[1]);
        return;
      }

      // ── 砝码题：禁用数字键（用 +/- 按钮）──
      if (rt === "weight") {
        // 不处理数字键
        return;
      }

      // ── normal/gate/trigger：原有 1/2/3/4 映射 ──
      const keyMap: Record<string, number> = { "1": 0, "2": 1, "3": 2, "4": 3 };
      const idx = keyMap[e.key];
      if (idx === undefined) return;
      if (isAnimating) {
        // Skip animation, then process new key after state updates
        flushPending();
        return;
      }
      const blocks = stageRef.current?.querySelectorAll(".opt-block");
      if (blocks && blocks[idx] && current.options[idx]) handleSelect(current.options[idx]);
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [current, isAnimating, handleSelect, flushPending]);

  // Update progress line
  useEffect(() => {
    const el = document.getElementById("progress-line");
    if (el) el.style.width = `${progress}%`;
  }, [progress]);

  // Toggle body class for progress line visibility
  useEffect(() => {
    document.body.classList.add("in-test");
    return () => {
      document.body.classList.remove("in-test");
    };
  }, []);

  if (isCompleted || !current) return null;

  const isGateOrTrigger = current.type === "gate" || current.type === "trigger";
  const questionLabelId = `q-text-${current.id}`;
  const renderType = current.renderType ?? current.type;

  // ── I2：题卡进场动画 floatIn（32）── 已接线（key remount + backwards fill）
  // 题卡 key={safeIndex}：切题时 remount 新 DOM，className 恒定含 .enter → animation 只播一次。
  // 之前 2 次 class-toggle 方案失败根因：className 随 state toggle → animation 反复重启 →
  // Playwright stability 持续判 not-stable → click 重试 ~99s timeout。
  // 现改 key remount（className 不 toggle）+ CSS backwards fill（mount 即 opacity:0 不闪，
  // 结束回归默认 1，getAnimations 干净）。

  // ── renderType 分发：渲染 options 区域 ──
  const renderOptions = () => {
    switch (renderType) {
      case "scale":
        // 天平题：game-icons 天平图形 + 下方双选项，选中后天平变暗
        return (
          <div className={`balance-stage ${interjection !== null ? "has-interjection" : ""}`} role="radiogroup" aria-labelledby={questionLabelId}>
            <BalanceScaleIcon
              className={`balance-svg ${selectedOptionId !== null ? "is-resolved" : ""}`}
            />
            <div className="balance-beam-options">
              {current.options.map((option, idx) => {
                const isSel = selectedOptionId === option.id;
                return (
                  <button
                    type="button"
                    key={option.id}
                    className={`balance-pan ${
                      isSel ? (isRecap ? "is-recap" : "is-down") : ""
                    } ${selectedOptionId !== null && !isRecap && !isSel ? "is-up" : ""}`}
                    role="radio"
                    aria-checked={isSel}
                    aria-label={option.label}
                    style={{ pointerEvents: isAnimating ? "none" : "auto" }}
                    onClick={() => handleSelect(option)}
                  >
                    <span className="balance-pan-key" aria-hidden="true">{ROMAN[idx]}</span>
                    {(() => {
                      const { main, asides } = splitOptionLabel(option.label);
                      return (
                        <span className="balance-pan-text">
                          <span className="opt-main">{main}</span>
                          {asides.length > 0 && (
                            <span className="opt-aside">（{asides.join("）（")}）</span>
                          )}
                        </span>
                      );
                    })()}
                  </button>
                );
              })}
            </div>
            {renderInterjection()}
          </div>
        );

      case "weight":
        // 砝码题：三槽 +/- UI
        return renderWeightUI();

      default:
        // normal/gate/trigger：原有纵向推开
        return (
          <div className={`options-stage ${interjection !== null ? "has-interjection" : ""}`} role="radiogroup" aria-labelledby={questionLabelId}>
            {current.options.map((option, idx) => (
              <button
                type="button"
                key={option.id}
                className={`opt-block ${
                  selectedOptionId === option.id ? (isRecap ? "is-recap" : "is-selected") : ""
                } ${selectedOptionId !== null && !isRecap && selectedOptionId !== option.id ? "is-dimmed" : ""}`}
                role="radio"
                aria-checked={false}
                aria-label={option.label}
                style={{ pointerEvents: isAnimating ? "none" : "auto" }}
                onClick={() => handleSelect(option)}
              >
                <div className="opt-content">
                  {/* 2026-08-15 统一：两端同一罗马数字序号（I/II/III），消除手机/桌面分叉 */}
                  <div className="opt-index" aria-hidden="true">{ROMAN[idx] ?? (idx + 1)}</div>
                  {(() => {
                    const { main, asides } = splitOptionLabel(option.label);
                    return (
                      <div className="opt-text">
                        <span className="opt-main">{main}</span>
                        {asides.length > 0 && (
                          <span className="opt-aside">（{asides.join("）（")}）</span>
                        )}
                      </div>
                    );
                  })()}
                </div>
              </button>
            ))}
            {renderInterjection()}
          </div>
        );
    }
  };

  // ── 砝码题 UI ──
  const renderWeightUI = () => {
    const slotLabels: [string, string, string] = ["A", "B", "C"];
    // 三槽主题（HTML「审判庭」固定语义：A 假装平静 / B 暗中反抗 / C 彻底放弃）
    const slotThemes: [string, string, string] = ["假装平静", "暗中反抗", "彻底放弃"];
    const total = weightSlots[0] + weightSlots[1] + weightSlots[2];
    const isValid = total === 3;

    // 点阵点击：未满(总和<3)且未到顶(槽<2)→ +1；否则重置该槽为 0
    const cycleSlot = (slotIdx: number) => {
      setWeightSlots((prev) => {
        const sum = prev[0] + prev[1] + prev[2];
        const cur = prev[slotIdx];
        const next: [number, number, number] = [...prev];
        next[slotIdx] = cur < 2 && sum < 3 ? cur + 1 : 0;
        return next;
      });
    };

    return (
      <div className={`weight-stage ${interjection !== null ? "has-interjection" : ""}`} role="group" aria-label="心理筹码分配">
        <div className="weight-allocator">
          {weightSlots.map((val, slotIdx) => (
            <div
              key={slotIdx}
              className="weight-card"
              role="button"
              tabIndex={0}
              aria-label={`${slotThemes[slotIdx]}：当前 ${val} 点`}
              onClick={() => cycleSlot(slotIdx)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") { e.preventDefault(); cycleSlot(slotIdx); }
              }}
            >
              <div className="weight-title">
                <span className="weight-key">{slotLabels[slotIdx]}</span>
                <span>{slotThemes[slotIdx]}</span>
              </div>
              <div className="node-group" aria-hidden="true">
                {[0, 1].map((d) => (
                  <span key={d} className={`node-dot ${d < val ? "active" : ""}`} />
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="weight-footer">
          <div className="weight-status">
            {isValid ? "⚖️ 筹码已分配完毕" : `尚余 ${3 - total} 点心理筹码（点击卡片分配）`}
          </div>
          <button
            type="button"
            className={`btn-confirm-weight ${isValid ? "active" : ""}`}
            onClick={handleWeightConfirm}
            disabled={!isValid || isAnimating}
          >
            落 锤 决 断
          </button>
        </div>
        {renderInterjection()}
      </div>
    );
  };

  // ── 批注浮条（背景浮现 → 自动消散；非阻塞，答题与键盘不受影响）──
  const renderInterjection = () => {
    if (interjection === null) return null;
    const nodeLabels: Record<number, string> = { 5: "I", 10: "II", 15: "III" };
    return (
      <div
        className={`interjection-overlay ${interjectionExiting ? "is-leaving" : ""}`}
        role="status"
        aria-live="polite"
        onClick={dismissInterjection}
      >
        <div style={{
          fontFamily: "var(--f-title)", fontSize: "0.62rem",
          color: "var(--c-gold)", letterSpacing: "0.3em", marginBottom: "0.55rem",
          opacity: 0.65,
        }}>
          审判官批注 · {nodeLabels[interjection] ?? interjection}
        </div>
        <div style={{
          fontSize: "clamp(0.95rem, 1.8vw, 1.15rem)", fontWeight: 400,
          lineHeight: 1.75, textAlign: "center",
          color: "#EFEFEF",
          textShadow: "0 4px 20px rgba(0,0,0,0.8)",
        }}>
          {interjectionText || "…"}
        </div>
      </div>
    );
  };

  return (
    <div className="view-test" style={{ position: "relative", width: "100%", height: "100dvh" }}>
      {/* 32 背景层（z 0-1 内容之下）：Canvas 紫粒子 + 浮雕题号 + 胶片颗粒 */}
      <BackgroundLayers questionIndex={currentIndex} reducedMotion={reducedMotion} />
      <CustomCursor />
      <div id="progress-line" />
      {/* grain-overlay-test（胶片颗粒噪点）已移除：2026-08-31 用户反馈手机端背景噪点干扰阅读 */}
      {/* Top bar — HUD 双胶囊（32 提取）：左 PREV+计数器 / 右 EXIT。Q1 时
          #btn-back 保持 DOM（CSS 默认 opacity 0），safeIndex>0 时加 .visible 显现。
          .test-header 容器定位机制不动（桌面 absolute 顶角 / 移动端 flex 列）。 */}
      <div className="test-header">
        <div className="hud-capsule">
          <button
            type="button"
            id="btn-back"
            className={`hud-btn ${safeIndex > 0 ? "visible" : ""}`}
            tabIndex={safeIndex > 0 ? 0 : -1}
            onClick={handleBack}
            aria-label="返回上一题"
          >
            {/* 单向左箭头（功能只有"后退一题"；SVG 内联绘制保证安卓缺字形设备一致） */}
            <svg width="22" height="14" viewBox="0 0 24 16" fill="none"
              stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"
              strokeLinejoin="round" style={{ display: "block" }} aria-hidden="true">
              <line x1="22" y1="8" x2="3" y2="8" />
              <path d="M8 3 L3 8 L8 13" />
            </svg>
          </button>
          <div className="hud-counter">
            <span>{String(safeIndex + 1).padStart(2, "0")}</span>
            <span className="counter-slash">/</span>
            <span>{String(displayQuestions.length).padStart(2, "0")}</span>
          </div>
          <button
            type="button"
            id="btn-forward"
            className={`hud-btn ${safeIndex < maxVisitedRef.current ? "visible" : ""}`}
            tabIndex={safeIndex < maxVisitedRef.current ? 0 : -1}
            onClick={handleForward}
            aria-label="前进下一题"
          >
            {/* 与返回键镜像的单向右箭头（仅在后退过、下一题已作答时显现） */}
            <svg width="22" height="14" viewBox="0 0 24 16" fill="none"
              stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"
              strokeLinejoin="round" style={{ display: "block" }} aria-hidden="true">
              <line x1="2" y1="8" x2="21" y2="8" />
              <path d="M16 3 L21 8 L16 13" />
            </svg>
          </button>
        </div>
        {/* 退出按钮（2026-08-15 统一：两端同一文案，不再按端分支） */}
        <div className="hud-capsule">
          <button type="button" className="hud-btn" onClick={() => { localStorage.removeItem(STORAGE_KEY); onExit(); }}>
            {t("test.exit") || "EXIT"}
          </button>
        </div>
      </div>
      <div className="watermark-index" aria-hidden="true">
        {ROMAN[safeIndex] ?? (safeIndex + 1)}
      </div>
      <div ref={stageRef} id="test-stage-wrapper" className={stageFadeOut ? "stage-fade-out" : ""}>
        {/* 题卡：.card.enter 为 floatIn 进场钩子（key remount 接线，见上方 I2 注释）。
            玻璃态/紫 glow/金线仅移动端 32 皮肤（mobile-skin）；桌面为 HEAD 旧版无卡排版。
            card-glare 已随桌面回滚移除（32 元素）。 */}
        <div key={safeIndex} className="question-stage card enter">
          <span className={`toast-verdict ${toastVerdict ? "show" : ""}`} aria-live="polite">✦ 契约已被记录 ✦</span>
          <div className="q-meta">
            {isGateOrTrigger ? (
              <span className="gate-badge">{current.type === "gate" ? t("test.gateBadge") : t("test.triggerBadge")}</span>
            ) : isDesktop ? (
              // 桌面回 HEAD：meta · 计数内嵌（HUD 计数器仅移动端 32 皮肤）
              <span>{`${current.meta || "审判"} \u00B7 ${String(safeIndex + 1).padStart(2, "0")} / ${String(displayQuestions.length).padStart(2, "0")}`}</span>
            ) : (
              <span className="tag-pill">
                <span className="pulse-orb" aria-hidden="true" />
                {/* 题号 QN 数字换罗马数字（2026-08-31 用户要求）：与选项序号 I/II/III、
                    背景水印的罗马数字体系统一 */}
                <span>{(current.meta || "审判").replace(/^Q\s*(\d+)/, (_, n) => `Q ${ROMAN[Number(n) - 1] ?? n}`)}</span>
              </span>
            )}
            <span className="q-hint">{showKeyboardHint ? (renderType === "weight" ? t("test.weightHint") : t("test.keyHint")) : ""}</span>
          </div>
          <div className="q-text" id={questionLabelId}>{renderRichText(current.text)}</div>
        </div>
        {renderOptions()}
      </div>
    </div>
  );
}
