"use client";

import { useState, useCallback, useEffect, useRef, useMemo } from "react";
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
  useEffect(() => {
    let disposed = false;
    queueMicrotask(() => {
      if (disposed) return;
      const saved = answers[safeIndex];
      setSelectedOptionId(saved ? saved.optionId : null);
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
      setCurrentIndex((i) => i + 1);
      setStageFadeOut(false);
    }
    setIsAnimating(false);
    setSelectedOptionId(null);
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

  // ── 返回上一题（回看 + 可改，高亮由 [safeIndex] useEffect 自动恢复）──
  const handleBack = useCallback(() => {
    if (isAnimating) return;
    if (safeIndex <= 0) return;
    setStageFadeOut(false);
    setCurrentIndex(safeIndex - 1);
  }, [safeIndex, isAnimating]);

  // Keyboard support
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      // ── 批注插页：任意键继续 ──
      if (interjection !== null) {
        if (e.key === "Enter" || e.key === " " || e.key.length === 1) {
          e.preventDefault();
          setInterjection(null);
          setInterjectionText("");
        }
        return;
      }

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
  }, [current, isAnimating, handleSelect, flushPending, interjection]);

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
        // 天平题：SVG 天平图形（横梁+支点+托盘）+ 下方双选项，选中侧横梁倾斜
        return (
          <div className="balance-stage" role="radiogroup" aria-labelledby={questionLabelId}>
            <svg
              className={`balance-svg ${
                selectedOptionId === current.options[0]?.id ? "tilt-left"
                : selectedOptionId === current.options[1]?.id ? "tilt-right"
                : ""
              }`}
              viewBox="0 0 220 130"
              aria-hidden="true"
            >
              {/* 支点（尖端朝上） */}
              <polygon points="110,12 96,40 124,40" fill="currentColor" opacity="0.55" />
              {/* 横梁 */}
              <line x1="20" y1="40" x2="200" y2="40" stroke="currentColor" strokeWidth="2" />
              {/* 挂绳 */}
              <line x1="35" y1="40" x2="35" y2="72" stroke="currentColor" strokeWidth="1.5" opacity="0.6" />
              <line x1="185" y1="40" x2="185" y2="72" stroke="currentColor" strokeWidth="1.5" opacity="0.6" />
              {/* 托盘（弧线） */}
              <path d="M 15 72 Q 35 94 55 72" stroke="currentColor" strokeWidth="2" fill="none" />
              <path d="M 165 72 Q 185 94 205 72" stroke="currentColor" strokeWidth="2" fill="none" />
            </svg>
            <div className="balance-beam-options">
              {current.options.map((option, idx) => {
                const isSel = selectedOptionId === option.id;
                const isOther = selectedOptionId !== null && !isSel;
                return (
                  <button
                    type="button"
                    key={option.id}
                    className={`balance-pan ${isSel ? "is-down" : ""} ${isOther ? "is-up" : ""}`}
                    role="radio"
                    aria-checked={isSel}
                    aria-label={option.label}
                    style={{ pointerEvents: isAnimating ? "none" : "auto" }}
                    onClick={() => handleSelect(option)}
                  >
                    <span className="balance-pan-key" aria-hidden="true">{ROMAN[idx]}</span>
                    <span className="balance-pan-text">{option.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        );

      case "weight":
        // 砝码题：三槽 +/- UI
        return renderWeightUI();

      default:
        // normal/gate/trigger：原有纵向推开
        return (
          <div className="options-stage" role="radiogroup" aria-labelledby={questionLabelId}>
            {current.options.map((option, idx) => (
              <button
                type="button"
                key={option.id}
                className={`opt-block ${selectedOptionId === option.id ? "is-selected" : ""} ${selectedOptionId !== null && selectedOptionId !== option.id ? "is-dimmed" : ""}`}
                role="radio"
                aria-checked={false}
                aria-label={option.label}
                style={{ pointerEvents: isAnimating ? "none" : "auto" }}
                onClick={() => handleSelect(option)}
              >
                <div className="opt-content">
                  {/* 2026-08-15 统一：两端同一罗马数字序号（I/II/III），消除手机/桌面分叉 */}
                  <div className="opt-index" aria-hidden="true">{ROMAN[idx] ?? (idx + 1)}</div>
                  <div className="opt-text">{option.label}</div>
                </div>
              </button>
            ))}
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
      <div className="weight-stage" role="group" aria-label="心理筹码分配">
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
      </div>
    );
  };

  // ── 批注插页 overlay ──
  const renderInterjection = () => {
    if (interjection === null) return null;
    const nodeLabels: Record<number, string> = { 5: "I", 10: "II", 15: "III" };
    return (
      <div
        className="interjection-overlay"
        role="dialog"
        aria-label="审判官批注"
        style={{
          position: "absolute", inset: 0, zIndex: 40,
          display: "flex", flexDirection: "column",
          justifyContent: "center", alignItems: "center",
          background: "rgba(3,3,3,0.95)",
          padding: "4vh 8vw",
          cursor: "pointer",
          // A4：reduced-motion 时跳过 staggerIn（inline 优先级高于 CSS 守卫，
          // 故在 JS 侧按 reducedMotion state 门控，元素仍可见）。
          animation: reducedMotion ? "none" : "staggerIn 0.6s var(--ease-out-expo) forwards",
        }}
        onClick={() => { setInterjection(null); setInterjectionText(""); }}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setInterjection(null);
            setInterjectionText("");
          }
        }}
        tabIndex={0}
      >
        <div style={{
          fontFamily: "var(--f-title)", fontSize: "clamp(0.7rem,1.2vw,0.85rem)",
          color: "var(--c-gold)", letterSpacing: "0.3em", marginBottom: "3vh",
          opacity: 0.6,
        }}>
          审判官批注 · {nodeLabels[interjection] ?? interjection}
        </div>
        <div style={{
          fontSize: "clamp(1.1rem,2.5vw,1.6rem)", fontWeight: 400,
          lineHeight: 1.8, textAlign: "center", maxWidth: 480,
          color: "#EFEFEF",
          textShadow: "0 4px 20px rgba(0,0,0,0.8)",
        }}>
          {interjectionText || "…"}
        </div>
        <div style={{
          marginTop: "4vh", fontFamily: "var(--f-title)",
          fontSize: "0.65rem", color: "rgba(255,255,255,0.25)",
          letterSpacing: "0.2em",
        }}>
          {t("test.keyHint") ? "按任意键继续" : "点击继续"}
        </div>
      </div>
    );
  };

  return (
    <div className="view-test" style={{ position: "relative", width: "100%", height: "100dvh" }}>
      {/* 32 背景层（z 0-1 内容之下）：Canvas 紫粒子 + 浮雕题号 + 胶片颗粒 */}
      <BackgroundLayers questionIndex={currentIndex} reducedMotion={reducedMotion} />
      <div id="progress-line" />
      <div className="grain-overlay-test" aria-hidden="true" />
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
            {/* 双向箭头用内联 SVG 绘制（⇄ 字符在部分安卓系统字体缺字形会渲染
                成空白，SVG 保证所有设备一致显示） */}
            <svg width="22" height="14" viewBox="0 0 24 16" fill="none"
              stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"
              strokeLinejoin="round" style={{ display: "block" }} aria-hidden="true">
              <line x1="2" y1="8" x2="22" y2="8" />
              <path d="M7 3 L2 8 L7 13" />
              <path d="M17 3 L22 8 L17 13" />
            </svg>
          </button>
          <div className="hud-counter">
            <span>{String(safeIndex + 1).padStart(2, "0")}</span>
            <span className="counter-slash">/</span>
            <span>{String(questions.length).padStart(2, "0")}</span>
          </div>
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
                <span>{current.meta || "审判"}</span>
              </span>
            )}
            <span className="q-hint">{showKeyboardHint ? (renderType === "weight" ? t("test.weightHint") : t("test.keyHint")) : ""}</span>
          </div>
          <div className="q-text" id={questionLabelId}>{renderRichText(current.text)}</div>
        </div>
        {renderOptions()}
      </div>
      {renderInterjection()}
    </div>
  );
}
