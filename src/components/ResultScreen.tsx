"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { getIpMeta } from "@/content/packs/ip-registry";
import { useLocalizedContent } from "@/lib/use-localized-content";
import { toPng } from "html-to-image";
import { useI18n } from "@/lib/i18n";

/* ═══════════════════════════════════════════
   Reveal 骨架契约（crucible/30-adr/final.md 决策1 + 盲点 #9/#10/#12；40-implementation IM5）
   - `body.revealed` ← globals.css `body.revealed .result-layout` 可见性门控，勿拆
   - revealPhase 状态机 / skipReveal（click/Space/touch 三路）/
     resultLayoutRef.focus()（done 后）/ aria-hidden / aria-live /
     edge-blur 滚动门控：对外行为不变（reveal.spec/result.spec/quiz.spec 的 skip 断言锚定）
   - 6 段 4.6s stagger（judgementText/transitionText/slogan/fromWork/hiddenReveal）
     已精简为单名字闪现（O1=B：角色名 blur crossfade ≤800ms）
   - reduced-motion：跳过动画直达 done（P8 守卫）
   ═══════════════════════════════════════════ */
const REVEAL_TIMINGS = {
  nameReveal: 200, // 名字柔和浮现起始（极光暗幕 active=false 瞬间归零，同色无缝）
  cardReady: 1800, // 名字渐显(0.8s)+完整展示后 revealPhase → done
} as const;

/* 手机不是“无动画”，而是把同一段仪式压缩成一个可感知的短句。
   这个节奏留给极光转场一个收尾拍，再让结果牌自然接管视线。 */
const COMPACT_REVEAL_TIMINGS = {
  nameReveal: 180,
  cardReady: 980,
} as const;

/** R4: ease-out-expo cubic-bezier(0.16,1,0.3,1) */
const EASE_OUT_EXPO = "cubic-bezier(0.16,1,0.3,1)";
/** R3: motion-7 名字 blur cross-fade 时长 */
const MOTION7_DURATION = "0.8s";

interface ResultData {
  code: string; name: string; subtitle?: string; slogan: string; desc: string; keywords?: string;
  similarity: number; userVector: string; templateVector: string;
  top3: { code: string; name: string; similarity: number; translations?: string }[];
  group: string; borderType: boolean; special: boolean;
  translations?: string;
  /** 角色 IP 归属（跨IP全局匹配，结果页按此查作品信息） */
  ipCode?: string;
  /** 旧版结果字段，保留以兼容现有 API；新版页面只使用 localized 文案。 */
  prosecution?: string;
  softlanding?: string;
  tags?: string;
  posturePct?: { A: number; B: number; C: number };
}

interface ResultScreenProps {
  result: ResultData;
  stats?: { totalParticipants: number; typePercentage: number; typeCount: number } | null;
  onRestart: () => void;
  compactMotion?: boolean;
}

export default function ResultScreen({ result, stats, onRestart, compactMotion = false }: ResultScreenProps) {
  const { t } = useI18n();
  const localized = useLocalizedContent(
    result.code, result.name, result.slogan, result.desc, result.keywords, result.subtitle, result.translations
  );
  const displayName = localized.name.split(/[·•|｜]/)[0]?.trim() || localized.name;
  const sloganText = localized.slogan;
  const keywordList = localized.keywords
    .split(/[、,，]/)
    .map((keyword) => keyword.trim())
    .filter(Boolean);
  const ipMeta = getIpMeta(result.ipCode);
  const ipTitle = t(`works.${ipMeta.ipCode}.title`);
  const workIntro = t(`works.${ipMeta.ipCode}.intro`);
  const fromTitle = t("result.revealFrom", { title: ipTitle });

  /* ── R5: prefers-reduced-motion check ── */
  const [prefersReducedMotion] = useState(() =>
    typeof window !== "undefined"
      ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
      : false
  );
  // compactMotion 只缩短时序，不跳过结果揭示。此前手机把整段 reveal
  // 直接设成 done，Aurora 一收就只剩一张已经排好的长页面，仪式感因此被砍掉。
  const instantReveal = prefersReducedMotion;
  const nameRevealDelay = compactMotion ? COMPACT_REVEAL_TIMINGS.nameReveal : REVEAL_TIMINGS.nameReveal;
  const cardReadyDelay = compactMotion ? COMPACT_REVEAL_TIMINGS.cardReady : REVEAL_TIMINGS.cardReady;

  /* ── A1: Internal reveal phase（骨架保留）── */
  const [revealPhase, setRevealPhase] = useState<"revealing" | "done">(
    instantReveal ? "done" : "revealing"
  );
  const [nameRevealed, setNameRevealed] = useState(instantReveal); // 单名字闪现（O1=B）
  const [revealLayerOut, setRevealLayerOut] = useState(instantReveal); // true = overlay 淡出中
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  /* ── Share card state ── */
  const shareCardRef = useRef<HTMLDivElement>(null);
  const [sharing, setSharing] = useState(false);
  const [shareCardReady, setShareCardReady] = useState(false);

  /* ── R9: motion-6 edge blur 检测（滚动容器现为 #view-result，mask 随之挂载）── */
  const profileRef = useRef<HTMLDivElement>(null);
  const [needsEdgeBlur, setNeedsEdgeBlur] = useState(false);

  /* ── A-F1: Focus management ref for result-layout ── */
  const resultLayoutRef = useRef<HTMLDivElement>(null);

  /* ═══════════════════════════════════════════
     O1=B 单名字闪现：mount 即挂 body.revealed（盲点 #9 门控），
     ~150ms 起名字 blur crossfade，~950ms revealPhase → done
     ═══════════════════════════════════════════ */
  useEffect(() => {
    document.body.classList.add("revealed");

    if (instantReveal) {
      return () => { document.body.classList.remove("revealed"); };
    }

    const timers: ReturnType<typeof setTimeout>[] = [];
    timersRef.current = timers;

    const schedule = (cb: () => void, delay: number) => {
      const id = setTimeout(cb, delay);
      timers.push(id);
    };

    schedule(() => setNameRevealed(true), nameRevealDelay);
    schedule(() => {
      setRevealPhase("done");
    }, cardReadyDelay);

    return () => {
      timers.forEach(clearTimeout);
      document.body.classList.remove("revealed");
    };
  }, [instantReveal, nameRevealDelay, cardReadyDelay]);

  /* ── R9: motion-6 edge blur detection ── */
  useEffect(() => {
    if (revealPhase !== "done") return;
    const el = profileRef.current;
    if (!el) return;
    const check = () => {
      setNeedsEdgeBlur(el.scrollHeight > el.clientHeight + 2);
    };
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, [revealPhase]);

  /* ── A-F1: Move focus to result card after reveal completes ── */
  useEffect(() => {
    if (revealPhase === "done") {
      // Small delay to allow DOM to settle after reveal layer fades
      const id = setTimeout(() => {
        resultLayoutRef.current?.focus();
      }, 100);
      return () => clearTimeout(id);
    }
  }, [revealPhase]);

  /* ═══════════════════════════════════════════
     R2: Skip — any click/keydown/touch → immediately done
     ═══════════════════════════════════════════ */
  const skipReveal = useCallback(() => {
    if (revealPhase === "done") return;
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
    setNameRevealed(true);
    setRevealPhase("done");
  }, [revealPhase]);

  useEffect(() => {
    if (revealPhase === "done") return;
    const onClick = () => skipReveal();
    const onKey = () => skipReveal();
    window.addEventListener("click", onClick);
    window.addEventListener("keydown", onKey);
    window.addEventListener("touchstart", onClick);
    return () => {
      window.removeEventListener("click", onClick);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("touchstart", onClick);
    };
  }, [revealPhase, skipReveal]);

  /* ── Reveal layer fade-out after done ── */
  useEffect(() => {
    if (revealPhase === "done" && !instantReveal) {
      // Small delay so the state settles before starting the CSS transition
      const id = setTimeout(() => setRevealLayerOut(true), 50);
      return () => clearTimeout(id);
    }
  }, [revealPhase, instantReveal]);

  /* ═══════════════════════════════════════════
     Share logic (preserved from original — R10)
     ═══════════════════════════════════════════ */
  const shareText = t("result.shareText", {
    name: displayName,
    slogan: localized.slogan,
    url: typeof window !== "undefined" ? window.location.href : "",
  });

  const generateShareImage = useCallback(async (): Promise<Blob | null> => {
    if (!shareCardRef.current) return null;
    try {
      const dataUrl = await toPng(shareCardRef.current, { pixelRatio: 2 });
      const res = await fetch(dataUrl);
      return await res.blob();
    } catch (e) {
      console.error("Failed to generate share image:", e);
      return null;
    }
  }, []);

  const handleShare = useCallback(async () => {
    setShareCardReady(true);
    await new Promise((resolve) => requestAnimationFrame(resolve));
    try {
      const imageBlob = await generateShareImage();
      const imageFile = imageBlob
        ? new File([imageBlob], `witch-trial-${result.code}.png`, { type: "image/png" })
        : undefined;
      const shareTitle = t("meta.title");
      if (navigator.share && imageFile) {
        await navigator.share({ title: shareTitle, text: shareText, url: window.location.href, files: [imageFile] });
      } else if (navigator.share) {
        await navigator.share({ title: shareTitle, text: shareText, url: window.location.href });
      } else if (imageBlob && typeof ClipboardItem !== "undefined") {
        await navigator.clipboard.write([new ClipboardItem({ "image/png": imageBlob })]);
      } else {
        await navigator.clipboard.writeText(shareText);
      }
    } catch {
      try { await navigator.clipboard.writeText(shareText); } catch { /* ignore */ }
    } finally {
      setSharing(false);
      setShareCardReady(false);
    }
  }, [result, shareText, generateShareImage, t]);

  /* ── R11: Rarity helpers ── */
  const typePercentage = stats?.typePercentage ?? null;
  const rarityText = (() => {
    if (typePercentage === null) return t("result.rarityCollecting");
    if (result.special) return t("result.rarityRare", { percentage: typePercentage });
    return t("result.rarityGlobal", { percentage: typePercentage });
  })();
  const rarityBarPercent = typePercentage !== null ? Math.min(typePercentage, 100) : 0;

  /* ═══════════════════════════════════════════
     RENDER — 32 塔罗分栏（editorial-grid；CSS 由 globals.css IM1 定义）
     ═══════════════════════════════════════════ */
  return (
    <div
      id="view-result"
      style={needsEdgeBlur
        ? {
            WebkitMaskImage: "linear-gradient(to bottom, transparent, black 40px, black calc(100% - 40px), transparent)",
            maskImage: "linear-gradient(to bottom, transparent, black 40px, black calc(100% - 40px), transparent)",
          }
        : undefined}
    >
      {/* ─── 结果卡（Reveal 可见性门控；E2E 锚点 .result-layout）─── */}
      <div
        ref={(node) => {
          resultLayoutRef.current = node;
          profileRef.current = node;
        }}
        className={`result-layout ${revealPhase === "done" ? "is-ready" : "is-revealing"}`}
        role="region"
        aria-label={t("result.regionLabel")}
        aria-hidden={revealPhase !== "done"}
        tabIndex={-1}
        style={{
          opacity: revealPhase === "done" ? 1 : 0,
          transition: instantReveal ? "none" : `opacity ${compactMotion ? "0.34s" : "0.8s"} ${EASE_OUT_EXPO}`,
          /* 32 金标为列式编辑布局：badge 在上、editorial-grid 在下 */
          flexDirection: "column",
          alignItems: "flex-start",
          maxWidth: 1000,
          margin: "0 auto",
          width: "100%",
        }}
      >
        <div className="result-header">
          <div className="result-header-badge">{t("result.archetype")}</div>
          <div className="result-header-meta" aria-hidden="true">
            <span>{t("result.matchLabel")}</span>
            <span className="result-header-rule" />
            <span>{ipTitle}</span>
          </div>
        </div>

        <div className="editorial-grid" style={{ width: "100%" }}>
          {/* 左栏：克制的角色判印卡；未来角色图可直接覆盖占位层。 */}
          <div className={`tarot-card-frame ${revealPhase === "done" ? "is-shimmering" : ""}`} data-character-code={result.code}>
            <div className="tarot-card-topline" aria-hidden="true">
              <span>{t("result.matchLabel")}</span>
              <span>{ipTitle}</span>
            </div>
            <div className="tarot-placeholder">
              <div className="tarot-sigil" aria-hidden="true">
                <span className="tarot-sigil-orbit" />
                <svg className="tarot-icon" viewBox="0 0 72 72">
                  <path d="M36 7 43 28l21 8-21 8-7 21-7-21-21-8 21-8 7-21Z" />
                  <circle cx="36" cy="36" r="29" />
                  <circle cx="36" cy="36" r="3" className="tarot-sigil-dot" />
                </svg>
              </div>
              <div className="tarot-card-name">
                {displayName}
              </div>
              <div className="tarot-card-subtitle">
                {sloganText}
              </div>
            </div>
            <div className="tarot-card-footer" aria-hidden="true">
              <span>{t("result.matchedLabel")}</span>
              <span className="tarot-card-footer-mark">✦</span>
              <span>{t("result.referenceOnly")}</span>
            </div>
          </div>

          {/* 右栏：只保留匹配结论、原因、特质与分享动作。 */}
          <div className="result-details">
            <div className="result-identity">
              <div className="res-ip-tag">{fromTitle}</div>
              {/* 渐变标题（res-title）+ E2E 锚点（r-name）同节点 */}
              <h1 className="res-title r-name">{displayName}</h1>
              <div className="r-slogan">{sloganText}</div>
            </div>

            {/* 一句话作品介绍（reveal.spec 断言 pack.workIntro） */}
            {workIntro && (
              <div className="result-work-intro">
                {workIntro}
              </div>
            )}

            {/* 具体特质（E2E 锚点 .r-keywords/.r-keyword-tag 同节点） */}
            {keywordList.length > 0 && (
              <div className="tag-cloud r-keywords">
                {keywordList.map((keyword) => (
                  <span key={keyword} className="neo-chip r-keyword-tag">{keyword}</span>
                ))}
              </div>
            )}

            {/* 单段匹配理由，不再做“控诉 + 安抚”的诊断式二段模板。 */}
            {localized.desc && (
              <div className="match-reason-card r-desc">
                <div className="section-label"><span aria-hidden="true">01</span> {t("result.analysis")}</div>
                <p className="section-body">{localized.desc}</p>
              </div>
            )}

            {/* R11: 稀有度（保留；深色金紫适配，仅宽 transition 且有 reduced-motion 守卫） */}
            <div className="rarity-meter" style={{ marginTop: "0.5rem" }}>
              <div style={{
                fontSize: "0.65rem",
                fontFamily: "var(--f-title)",
                letterSpacing: "0.2em",
                color: "var(--text-dim)",
                marginBottom: "0.5rem",
              }}>
                {t("result.rarityLabel")}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                <div style={{ flex: 1, height: 6, borderRadius: 3, background: "rgba(255,255,255,0.05)", overflow: "hidden" }}>
                  <div style={{
                    width: `${rarityBarPercent}%`,
                    height: "100%",
                    background: "linear-gradient(90deg, var(--violet-deep), var(--purple-neon), var(--gold-hyper))",
                    borderRadius: 3,
                    transition: prefersReducedMotion ? "none" : `width 0.6s ${EASE_OUT_EXPO}`,
                  }} />
                </div>
                <span style={{
                  fontSize: "0.7rem",
                  fontFamily: "var(--f-title)",
                  letterSpacing: "0.1em",
                  color: typePercentage !== null ? "var(--gold-hyper)" : "rgba(255,255,255,0.4)",
                  whiteSpace: "nowrap",
                }}>
                  {rarityText}
                </span>
              </div>
            </div>

            {/* R16: Hidden character light text（special 专属） */}
            {result.special && (
              <div style={{
                fontSize: "0.8rem",
                fontStyle: "italic",
                color: "var(--purple-neon)",
                opacity: 0.85,
              }}>
                {t("result.hiddenReveal")}
              </div>
            )}

            {/* R10: 操作按钮（32 胶囊；E2E 锚点 .r-actions/.btn-restart 同节点） */}
            <div className="action-row r-actions">
              <button
                className="btn-restart btn-neo btn-neo-primary"
                onClick={handleShare}
                disabled={sharing}
                tabIndex={revealPhase === "done" ? 0 : -1}
                style={{ borderBottom: "none", alignSelf: "auto" }}
              >
                {sharing ? "..." : t("result.share")}
              </button>
              <button
                className="btn-restart btn-neo btn-neo-secondary"
                onClick={onRestart}
                tabIndex={revealPhase === "done" ? 0 : -1}
                style={{ borderBottom: "none", alignSelf: "auto" }}
              >
                {t("result.rebirth")}
              </button>
            </div>

            {/* 结果页补充声明（角色版权） */}
            <div style={{
              marginTop: "1rem",
              fontSize: "0.6rem",
              textAlign: "center",
              color: "rgba(255,255,255,0.35)",
              letterSpacing: "0.05em",
            }}>
              {t("disclaimer.result")}
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════
         Reveal overlay（骨架保留；内容精简为单名字闪现 O1=B）
         深色金紫黑重皮：底 #050308 + 名字白→金→紫渐变
         ═══════════════════════════════════════════ */}
      <div
        role="status"
        aria-live="polite"
        aria-hidden={revealLayerOut}
        className={`result-reveal-overlay ${revealLayerOut ? "is-leaving" : "is-active"}`}
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 100,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          background: "var(--reveal-bg, #050308)",
          color: "#e6e6e6",
          fontFamily: "var(--f-body)",
          pointerEvents: revealLayerOut ? "none" : "auto",
          opacity: revealLayerOut ? 0 : 1,
          visibility: revealLayerOut ? "hidden" : "visible",
          transition: revealLayerOut
            ? (instantReveal
              ? "none"
              : `opacity ${compactMotion ? "0.3s" : "0.8s"} ${EASE_OUT_EXPO}, visibility 0s linear ${compactMotion ? "0.3s" : "0.8s"}`)
            : "none",
        }}
      >
        {/* Skip hint（#12：result.skipHint 键保留） */}
        {!revealLayerOut && revealPhase === "revealing" && !instantReveal && (
          <div style={{
            position: "absolute",
            bottom: "5vh",
            fontSize: "0.7rem",
            letterSpacing: "0.3em",
            color: "rgba(255,255,255,0.55)",
            fontFamily: "var(--f-title)",
          }}>
            {t("result.skipHint")}
          </div>
        )}

        <div className="result-reveal-stage" style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          textAlign: "center",
          padding: "0 2rem",
          maxWidth: 500,
        }}>
          <div className="result-reveal-kicker">{t("result.revealJudgement")}</div>
          <div className="result-reveal-sigil" aria-hidden="true">
            <span className="result-reveal-sigil-ring result-reveal-sigil-ring-outer" />
            <span className="result-reveal-sigil-ring result-reveal-sigil-ring-inner" />
            <span className="result-reveal-sigil-core">✦</span>
          </div>
          {/* 单名字闪现 — R3 motion-7 柔和浮现（2026-08-15：blur20px+scale 金光凝聚
              在暗幕上读作"闪一下"，改 opacity+translateY+浅 blur 的柔和浮现；
              渐变经 token：桌面重定义后 = 米白→旧金，移动端保留 超金→霓虹紫） */}
          <div className="result-reveal-name" role="heading" aria-level={1} style={{
            fontSize: "clamp(2.8rem, 10vw, 5.5rem)",
            fontWeight: 900,
            lineHeight: 1.1,
            letterSpacing: "0.15em",
            background: "linear-gradient(135deg, #F2EFE9 15%, var(--gold-hyper) 60%, var(--purple-neon) 100%)",
            WebkitBackgroundClip: "text",
            backgroundClip: "text",
            WebkitTextFillColor: "transparent",
            color: "transparent",
            opacity: nameRevealed ? 1 : 0,
            filter: instantReveal || nameRevealed ? "blur(0px)" : "blur(8px)",
            transform: instantReveal || nameRevealed ? "translateY(0)" : "translateY(26px)",
            transition: instantReveal ? "none" : `opacity ${MOTION7_DURATION} ${EASE_OUT_EXPO}, transform ${MOTION7_DURATION} ${EASE_OUT_EXPO}, filter ${MOTION7_DURATION} ${EASE_OUT_EXPO}`,
          }}>
            {displayName}
          </div>
          <div className="result-reveal-caption">{fromTitle}</div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════
         分享卡（离屏 toPng；深色实色 #050308 + 金紫文字，
         子树禁用 backdrop-filter/mix-blend-mode/纯 transparent —— 盲点 #4）
         ═══════════════════════════════════════════ */}
      {shareCardReady && (
        <div
          ref={shareCardRef}
          aria-hidden="true"
          style={{
            position: "fixed", top: "-9999px", left: "-9999px",
            width: 390, height: 693,
            background: "#050308", color: "#e6e6e6",
            fontFamily: "'Noto Serif SC', serif",
            padding: "2rem 1.5rem",
            display: "flex", flexDirection: "column",
            justifyContent: "space-between",
          }}
        >
          <div>
            {/* 分享卡标题 */}
            <div style={{
              fontFamily: "'Cinzel', serif",
              fontSize: "0.55rem",
              letterSpacing: "0.5em",
              color: "rgba(255,215,0,0.6)",
              marginBottom: "1.2rem",
            }}>
              {t("result.shareHook")}
            </div>
            {/* 角色名 */}
            <div style={{
              fontSize: "1.8rem", fontWeight: 900, lineHeight: 1.15,
              color: "#fff", marginBottom: "0.4rem",
            }}>
              {displayName}
            </div>
            {/* 标语 */}
            <div style={{
              fontSize: "0.75rem", fontStyle: "italic",
              color: "rgba(255,215,0,0.9)", marginTop: "0.8rem", lineHeight: 1.6,
            }}>
              {sloganText}
            </div>
            {/* 作品出处 */}
            <div style={{
              fontSize: "0.55rem", fontFamily: "'Cinzel', serif",
              letterSpacing: "0.15em", color: "rgba(255,255,255,0.25)",
              marginTop: "0.6rem",
            }}>
              {fromTitle}
            </div>
          </div>
          <div>
            {/* Keywords */}
            {keywordList.length > 0 && (
              <div style={{ display: "flex", gap: "0.3rem", flexWrap: "wrap", marginBottom: "1rem" }}>
                {keywordList.map((keyword) => (
                  <span key={keyword} style={{
                    fontSize: "0.55rem", padding: "0.15rem 0.45rem",
                    border: "1px solid rgba(255,215,0,0.25)", borderRadius: 999,
                    color: "rgba(255,215,0,0.7)",
                  }}>
                    {keyword}
                  </span>
                ))}
              </div>
            )}
            {/* R13: Rarity only, NO similarity/RESONANCE */}
            <div style={{
              display: "flex", justifyContent: "space-between", alignItems: "flex-end",
              borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: "0.8rem",
            }}>
              <div>
                {typePercentage !== null ? (
                  <>
                    <div style={{
                      fontFamily: "'Cinzel', serif", fontSize: "1.6rem",
                      fontWeight: 900, color: "rgba(255,215,0,0.95)",
                    }}>
                      {typePercentage}%
                    </div>
                    <div style={{
                      fontSize: "0.5rem", color: "rgba(255,255,255,0.25)", letterSpacing: "0.15em",
                    }}>
                      {t("result.rarityLabel").toUpperCase()}
                    </div>
                  </>
                ) : (
                  <div style={{
                    fontSize: "0.55rem", color: "rgba(255,255,255,0.3)", letterSpacing: "0.1em",
                  }}>
                    {t("result.rarityCollecting")}
                  </div>
                )}
              </div>
              {/* 分享页 CTA */}
              <div style={{
                fontSize: "0.6rem", letterSpacing: "0.15em",
                color: "rgba(255,215,0,0.5)",
                fontFamily: "'Cinzel', serif",
              }}>
                {t("result.shareCta")}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
