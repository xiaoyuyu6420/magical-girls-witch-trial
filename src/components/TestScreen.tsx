"use client";

import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import { useI18n } from "@/lib/i18n";
import type { AnnotationNode } from "@/lib/annotations";
import { ANNOTATION_FALLBACKS } from "@/lib/annotations";

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

/** 砝码题：解析 weight::a|b|c 格式的 label */
function parseWeightLabel(label: string): [number, number, number] | null {
  if (!label.startsWith("weight::")) return null;
  const parts = label.slice(8).split("|");
  if (parts.length !== 3) return null;
  const nums = parts.map(Number);
  if (nums.some((n) => isNaN(n))) return null;
  return nums as [number, number, number];
}

/** 砝码题：解析 question.text 里的三槽主题文案 */
function parseSlotThemes(text: string): [string, string, string] {
  // text 格式：... A：「...」\nB：「...」\nC：「...」
  const lines = text.split("\n");
  const themes: string[] = [];
  for (const line of lines) {
    const m = line.match(/^[ABC]：「(.+?)」$/);
    if (m) themes.push(m[1]);
  }
  if (themes.length === 3) return themes as [string, string, string];
  // fallback：用 A/B/C
  return ["审判之秤 · A", "审判之秤 · B", "审判之秤 · C"];
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

export default function TestScreen({ questions, onComplete, onExit }: TestScreenProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<{ questionId: number; optionId: number }[]>([]);
  const [gateValue, setGateValue] = useState<string | undefined>();
  const [isAnimating, setIsAnimating] = useState(false);
  const [selectedOptionId, setSelectedOptionId] = useState<number | null>(null);
  const { t, locale } = useI18n();
  const [stageFadeOut, setStageFadeOut] = useState(false);
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

  // ── 批注插页：独立 state，不改 currentIndex ──
  const [interjection, setInterjection] = useState<AnnotationNode | null>(null);
  const [interjectionText, setInterjectionText] = useState<string>("");
  const interjectionFetchedRef = useRef(false);

  // ── 砝码题：三槽分配值 ──
  const [weightSlots, setWeightSlots] = useState<[number, number, number]>([1, 1, 1]);

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

  // ── 砝码题：当题切换时重置 slots 为均分 ──
  useEffect(() => {
    if (current?.renderType === "weight") {
      setWeightSlots([1, 1, 1]);
    }
  }, [safeIndex, current?.renderType]);

  // ── 批注插页：answers.length 命中 5/10/15 且未显示时触发 ──
  useEffect(() => {
    if (interjection !== null) return; // 已在显示
    if (isAnimating) return;
    const node = INTERJECTION_NODES.find((n) => n === answers.length);
    if (node !== undefined) {
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

    const answer = { questionId: current.id, optionId: option.id };
    const newAnswers = [...answers, answer];
    let newGateValue = gateValue;
    if (current.type === "gate" && option.value) { newGateValue = option.value; setGateValue(option.value); }

    const isTouchFeedback = touchFeedbackRef.current;
    if (navigator.vibrate) navigator.vibrate(isTouchFeedback ? 12 : 40);

    const isLast = safeIndex >= displayQuestions.length - 1;
    pendingRef.current = { answers: newAnswers, gateValue: newGateValue, isLast };

    const feedbackDelay = isTouchFeedback ? 120 : 400;
    const totalDelay = isTouchFeedback ? 280 : 700;
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

  // ── renderType 分发：渲染 options 区域 ──
  const renderOptions = () => {
    switch (renderType) {
      case "scale":
        // 天平题：2 个 option，左右对峙，复用 opt-block 时序推开
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
                style={{ animationDelay: `${idx * 0.1}s`, pointerEvents: isAnimating ? "none" : "auto" }}
                onClick={() => handleSelect(option)}
              >
                <div className="opt-content">
                  <div className="opt-index" aria-hidden="true">{ROMAN[idx]}</div>
                  <div className="opt-text">{option.label}</div>
                </div>
              </button>
            ))}
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
                style={{ animationDelay: `${idx * 0.1}s`, pointerEvents: isAnimating ? "none" : "auto" }}
                onClick={() => handleSelect(option)}
              >
                <div className="opt-content">
                  <div className="opt-index" aria-hidden="true">{ROMAN[idx]}</div>
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
    const themes = parseSlotThemes(current.text);
    const total = weightSlots[0] + weightSlots[1] + weightSlots[2];
    const isValid = total === 3;

    const adjustSlot = (slotIdx: number, delta: number) => {
      setWeightSlots((prev) => {
        const next: [number, number, number] = [...prev];
        const newVal = next[slotIdx] + delta;
        if (newVal < 0 || newVal > 2) return prev;
        next[slotIdx] = newVal;
        return next;
      });
    };

    return (
      <div className="options-stage weight-stage" role="group" aria-label="砝码分配">
        <div style={{
          display: "flex", flexDirection: "column", width: "100%", height: "100%",
          justifyContent: "center", alignItems: "center", padding: "2vh 4vw", gap: "2vh",
        }}>
          {/* 三槽 */}
          <div style={{
            display: "flex", gap: "3vw", width: "100%", maxWidth: 600,
            justifyContent: "center", alignItems: "stretch",
          }}>
            {weightSlots.map((val, slotIdx) => (
              <div key={slotIdx} style={{
                flex: 1, display: "flex", flexDirection: "column", alignItems: "center",
                border: "1px solid rgba(212,175,55,0.15)",
                background: "rgba(10,5,20,0.35)",
                backdropFilter: "blur(8px)",
                padding: "1.5vh 0",
                borderRadius: 2,
                opacity: 0, transform: "translateY(20px)",
                animation: `staggerIn 0.6s var(--ease-out-expo) ${slotIdx * 0.1}s forwards`,
              }}>
                <div style={{
                  fontFamily: "var(--f-title)", fontSize: "clamp(0.7rem,1.5vw,0.9rem)",
                  color: "var(--c-gold)", letterSpacing: "0.2em", marginBottom: "0.5vh",
                }}>
                  {slotLabels[slotIdx]}
                </div>
                <div style={{
                  fontSize: "clamp(0.8rem,1.8vw,1rem)", color: "rgba(255,255,255,0.6)",
                  textAlign: "center", lineHeight: 1.5, marginBottom: "1vh",
                  padding: "0 0.5rem", fontStyle: "italic",
                }}>
                  {themes[slotIdx]}
                </div>
                <div style={{
                  fontSize: "clamp(2rem,5vw,3.5rem)", fontFamily: "var(--f-title)",
                  color: "#fff", lineHeight: 1, margin: "0.5vh 0",
                  textShadow: "0 0 20px rgba(212,175,55,0.3)",
                }}>
                  {val}
                </div>
                <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.5vh" }}>
                  <button
                    type="button"
                    onClick={() => adjustSlot(slotIdx, -1)}
                    disabled={val <= 0}
                    style={{
                      width: 36, height: 36, fontSize: "1.2rem", lineHeight: 1,
                      background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
                      color: val <= 0 ? "rgba(255,255,255,0.15)" : "rgba(255,255,255,0.7)",
                      cursor: val <= 0 ? "not-allowed" : "pointer",
                      borderRadius: 2, transition: "all 0.2s",
                      font: "inherit", padding: 0, appearance: "none", WebkitAppearance: "none",
                    }}
                    aria-label={`${slotLabels[slotIdx]} 减少`}
                  >
                    −
                  </button>
                  <button
                    type="button"
                    onClick={() => adjustSlot(slotIdx, 1)}
                    disabled={val >= 2}
                    style={{
                      width: 36, height: 36, fontSize: "1.2rem", lineHeight: 1,
                      background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
                      color: val >= 2 ? "rgba(255,255,255,0.15)" : "rgba(255,255,255,0.7)",
                      cursor: val >= 2 ? "not-allowed" : "pointer",
                      borderRadius: 2, transition: "all 0.2s",
                      font: "inherit", padding: 0, appearance: "none", WebkitAppearance: "none",
                    }}
                    aria-label={`${slotLabels[slotIdx]} 增加`}
                  >
                    +
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* 总和 + 确认按钮 */}
          <div style={{
            display: "flex", flexDirection: "column", alignItems: "center", gap: "0.8vh",
          }}>
            <div style={{
              fontFamily: "var(--f-title)", fontSize: "clamp(0.65rem,1.2vw,0.8rem)",
              color: isValid ? "var(--c-gold)" : "rgba(184,10,31,0.8)",
              letterSpacing: "0.15em",
              transition: "color 0.3s",
            }}>
              {isValid ? "天平已定" : `尚余 ${3 - total} 枚砝码未放`}
            </div>
            <button
              type="button"
              onClick={handleWeightConfirm}
              disabled={!isValid || isAnimating}
              style={{
                fontFamily: "var(--f-title)", fontSize: "clamp(0.75rem,1.5vw,0.95rem)",
                letterSpacing: "0.2em",
                color: isValid ? "var(--c-gold)" : "rgba(255,255,255,0.15)",
                background: "none",
                border: isValid ? "1px solid rgba(212,175,55,0.4)" : "1px solid rgba(255,255,255,0.05)",
                padding: "0.6rem 2rem", cursor: isValid && !isAnimating ? "pointer" : "not-allowed",
                borderRadius: 2, transition: "all 0.3s",
                opacity: 0, transform: "translateY(20px)",
                animation: "staggerIn 0.6s var(--ease-out-expo) 0.3s forwards",
              }}
            >
              落锤
            </button>
          </div>
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
          animation: "staggerIn 0.6s var(--ease-out-expo) forwards",
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
    <div className="view-test" style={{ position: "relative", width: "100%", height: "100%" }}>
      <div id="progress-line" />
      {/* EXIT button */}
      <button type="button" onClick={() => { localStorage.removeItem(STORAGE_KEY); onExit(); }}
        style={{
          position: "absolute",
          top: "max(1.2rem, env(safe-area-inset-top, 1.2rem))",
          right: "max(1.2rem, env(safe-area-inset-right, 1.2rem))",
          zIndex: 30,
          background: "transparent",
          border: "none",
          color: "rgba(255,255,255,0.4)",
          fontFamily: "var(--f-title)",
          fontSize: "0.7rem",
          letterSpacing: "0.15em",
          padding: "0.3rem 0.5rem",
          cursor: "pointer",
          transition: "all 0.3s ease",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.color = "rgba(184, 10, 31, 0.8)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.color = "rgba(255,255,255,0.4)";
        }}
      >
        {t("test.exit")}
      </button>
      <div className="watermark-index" aria-hidden="true">{ROMAN[safeIndex] || (safeIndex + 1)}</div>
      <div ref={stageRef} id="test-stage-wrapper" className={stageFadeOut ? "stage-fade-out" : ""}>
        <div className="question-stage">
          <div className="q-meta">
            <span>
              {isGateOrTrigger && <span className="gate-badge">{current.type === "gate" ? t("test.gateBadge") : t("test.triggerBadge")}</span>}
              {isGateOrTrigger ? "" : `${current.meta || "审判"} \u00B7 ${String(safeIndex + 1).padStart(2, "0")} / ${String(displayQuestions.length).padStart(2, "0")}`}
            </span>
            <span className="q-hint">{showKeyboardHint ? (renderType === "weight" ? "用 +/- 调整砝码" : t("test.keyHint")) : ""}</span>
          </div>
          <div className="q-text" id={questionLabelId}>{current.text}</div>
        </div>
        {renderOptions()}
      </div>
      {renderInterjection()}
    </div>
  );
}
