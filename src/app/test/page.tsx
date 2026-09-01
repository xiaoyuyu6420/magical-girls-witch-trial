"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import ErrorBoundary from "@/components/ErrorBoundary";
import TestScreen from "@/components/TestScreen";
import ResultScreen from "@/components/ResultScreen";
import FullscreenButton from "@/components/FullscreenButton";
import { AuroraBurst } from "@/components/AuroraBurst";
import { trackEvent } from "@/components/GoogleAnalytics";
import { useI18n } from "@/lib/i18n";
import type { QuizQuestion } from "@/components/TestScreen";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Rec = Record<string, any>;

interface MatchResult {
  code: string; name: string; subtitle?: string; slogan: string; desc: string; keywords?: string;
  similarity: number; userVector: string; templateVector: string;
  top3: { code: string; name: string; similarity: number; translations?: string }[];
  group: string; borderType: boolean; special: boolean;
  translations?: string;
}

export default function TestPage() {
  const { translations } = useI18n();
  // 异常态文案走全站调配中心（i18n err 段，可被 /api/copy 覆盖）；翻译包未就绪时回退内置中文。
  const err = (translations as Rec)?.err as Rec | undefined;
  const etx = (key: string, fallback: string): string => {
    const v = err?.[key];
    return typeof v === "string" && v ? v : fallback;
  };
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [result, setResult] = useState<MatchResult | null>(null);
  const [stats, setStats] = useState<{ totalParticipants: number; typePercentage: number; typeCount: number } | null>(null);
  const [auroraActive, setAuroraActive] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [lastCompletion, setLastCompletion] = useState<{ answers: { questionId: number; optionId: number }[] } | null>(null);
  // prefers-reduced-motion 检测：传给 AuroraBurst 缩短最小时长（C3）。
  const [reducedMotion, setReducedMotion] = useState(false);
  // 手机使用紧凑转场：只保留一次短暗场，桌面维持原揭示节奏。
  const [compactMotion, setCompactMotion] = useState(false);
  const startedAtRef = useRef<number>(0);
  // 极光最小时长信号的 resolve 句柄：AuroraBurst 的 onComplete 在 minDurationMs 后调用，
  // 与 fetch 完成信号 Promise.all（ADR 盲点 #13 / 风险1）。
  const resolveAuroraRef = useRef<(() => void) | null>(null);

  const loadQuiz = useCallback(() => {
    fetch("/api/quiz")
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((data) => {
        const qs: QuizQuestion[] = data.questions.map((q: Record<string, unknown>) => ({
          id: q.id as number, dim: q.dim as string, text: q.text as string,
          order: q.order as number, type: q.type as string, meta: (q.meta as string) || "",
          renderType: (q.renderType as string) || "normal",
          translations: (q.translations as string) || "{}",
          options: (q.options as Record<string, unknown>[]).map((o) => ({
            id: o.id as number, label: o.label as string,
            value: (o.value as string | null) ?? null,
          })),
        }));
        setQuestions(qs);
        setLoadError(null);
      })
      .catch((err) => {
        console.error(err);
        setLoadError(err instanceof Error ? err.message : "Failed to load quiz");
      });
  }, []);

  useEffect(() => {
    startedAtRef.current = Date.now();
    loadQuiz();
  }, [loadQuiz]);

  // 检测 prefers-reduced-motion，供 AuroraBurst 缩短最小时长（C3）。
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    queueMicrotask(() => setReducedMotion(mq.matches));
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 768px)");
    queueMicrotask(() => setCompactMotion(mq.matches));
    const handler = (e: MediaQueryListEvent) => setCompactMotion(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  // Tell the welcome shell (parent frame) we're rendered, so it reveals the
  // iframe the moment content is ready instead of a hardcoded 600ms race.
  // No-op when /test is visited directly (not embedded).
  useEffect(() => {
    if (questions.length > 0 && window.parent !== window) {
      window.parent.postMessage("witch-trial-test-ready", "*");
    }
  }, [questions]);

  const handleComplete = useCallback(async (data: {
    answers: { questionId: number; optionId: number }[];
  }) => {
    setSubmitError(null);
    setLastCompletion(data);
    // 触发极光转场（替换原 loading spinner），期间串行提交 match → results（C2）。
    setAuroraActive(true);
    // 极光最小时长信号：AuroraBurst 的 onComplete 在 minDurationMs 后 resolve。
    // fetch 快时极光播满最小时长才切结果；fetch 慢时 auroraActive 保持 true、
    // 极光维持覆盖等待 fetch 完成（弱网保护，ADR 风险1）。
    const auroraGate = new Promise<void>((resolve) => {
      resolveAuroraRef.current = resolve;
    });
    try {
      const matchPromise = fetch("/api/match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers: data.answers }),
      }).then(async (matchRes) => {
        if (!matchRes.ok) {
          const errorData = await matchRes.json().catch(() => null);
          throw new Error(errorData?.error || `Match failed: HTTP ${matchRes.status}`);
        }
        const matchData: MatchResult = await matchRes.json();
        setResult(matchData);
        trackEvent("quiz_complete", { result_code: matchData.code, similarity: matchData.similarity, special: matchData.special ? 1 : 0 });
        return matchData;
      });

      // 串行：先等 match 成功，再发 stats，避免 match 失败但 stats 已写入 DB 的双写虚高。
      // 极光转场不受影响——auroraGate 只依赖最小时长，与 fetch 顺序无关。
      await matchPromise;

      const sessionId = `anon-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const duration = startedAtRef.current ? Date.now() - startedAtRef.current : null;
      const statsPromise = fetch("/api/results", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          answers: data.answers,
          userAgent: navigator.userAgent,
          screenRes: `${window.screen.width}x${window.screen.height}`,
          language: navigator.language,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          startedAt: startedAtRef.current ? new Date(startedAtRef.current).toISOString() : null,
          completedAt: new Date().toISOString(),
          duration,
        }),
      }).then(async (statsRes) => {
        if (!statsRes.ok) {
          const errorData = await statsRes.json().catch(() => null);
          throw new Error(errorData?.error || `Results failed: HTTP ${statsRes.status}`);
        }
        const statsData = await statsRes.json();
        setStats({ totalParticipants: statsData.totalParticipants, typePercentage: statsData.typePercentage, typeCount: statsData.typeCount });
        return statsData;
      });

      await statsPromise;
      setLastCompletion(null);
      // 双信号齐备才切结果：极光最小时长（auroraGate）+ fetch 完成（ADR 盲点 #13）。
      await auroraGate;
      setShowResult(true);
      setAuroraActive(false);
    } catch (err) {
      console.error(err);
      setResult(null);
      setStats(null);
      setSubmitError(err instanceof Error ? err.message : "Failed to submit quiz");
      setAuroraActive(false);
    }
  }, []);

  const handleRestart = useCallback(() => {
    localStorage.removeItem("witch-trial-progress");
    window.location.href = "/";
  }, []);

  return (
    <ErrorBoundary>
      <div style={{
        background: "#030303",
        minHeight: "100vh",
        color: "#EFEFEF",
        fontFamily: "'Space Mono', monospace"
      }}>
        {showResult && result ? (
          <ResultScreen
            result={result}
            stats={stats}
            onRestart={handleRestart}
            compactMotion={compactMotion}
          />
        ) : loadError && !questions.length ? (
          <div style={{
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
            minHeight: "100vh", padding: "2rem", textAlign: "center",
            fontFamily: "'Noto Serif SC', serif",
          }}>
            <div style={{ fontSize: "1.2rem", color: "#d4af37", marginBottom: "1rem", fontFamily: "'Cinzel', serif", letterSpacing: "0.2em" }}>{etx("loadTitle", "题目加载失败")}</div>
            <div style={{ fontSize: "0.8rem", color: "#888", marginBottom: "1.5rem" }}>
              {etx("loadDesc", "暂时无法加载题目，请稍后再试。")}
            </div>
            <button
              onClick={() => { setLoadError(null); loadQuiz(); }}
              style={{
                fontFamily: "'Cinzel', serif", fontSize: "0.7rem", letterSpacing: "0.2em",
                color: "#d4af37", background: "none", border: "1px solid rgba(212,175,55,0.3)",
                padding: "0.5rem 1.5rem", cursor: "pointer", borderRadius: 2,
              }}
            >
              {etx("loadRetry", "重新尝试")}
            </button>
          </div>
        ) : submitError ? (
          <div style={{
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
            minHeight: "100vh", padding: "2rem", textAlign: "center",
            fontFamily: "'Noto Serif SC', serif",
          }}>
            <div style={{ fontSize: "1.2rem", color: "#d4af37", marginBottom: "1rem", fontFamily: "'Cinzel', serif", letterSpacing: "0.2em" }}>{etx("submitTitle", "结果生成失败")}</div>
            <div style={{ fontSize: "0.8rem", color: "#888", marginBottom: "1.5rem", maxWidth: 420, lineHeight: 1.7 }}>
              {etx("submitDesc", "结果暂时没有生成成功，请稍后重新提交。{error}").replace("{error}", submitError ?? "")}
            </div>
            <button
              onClick={() => {
                if (lastCompletion) void handleComplete(lastCompletion);
                else setSubmitError(null);
              }}
              style={{
                fontFamily: "'Cinzel', serif", fontSize: "0.7rem", letterSpacing: "0.2em",
                color: "#d4af37", background: "none", border: "1px solid rgba(212,175,55,0.3)",
                padding: "0.5rem 1.5rem", cursor: "pointer", borderRadius: 2,
              }}
            >
              {etx("submitRetry", "重新提交")}
            </button>
          </div>
        ) : (
          questions.length > 0 && (
            <TestScreen
              questions={questions}
              onComplete={handleComplete}
              onExit={handleRestart}
            />
          )
        )}

        <AuroraBurst
          active={auroraActive}
          minDurationMs={compactMotion ? 720 : 1300}
          reducedMotion={reducedMotion}
          onComplete={() => resolveAuroraRef.current?.()}
        />

        <FullscreenButton />
      </div>
    </ErrorBoundary>
  );
}
