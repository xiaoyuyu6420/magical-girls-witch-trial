"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { getActivePack } from "@/pack/load";
import { useLocalizedContent } from "@/lib/use-localized-content";
import { toPng } from "html-to-image";
import { useI18n } from "@/lib/i18n";

/* ═══════════════════════════════════════════
   Contracts — R1: REVEAL_TIMINGS as tunable constant
   ═══════════════════════════════════════════ */
const REVEAL_TIMINGS = {
  pageFadeOut: 0,
  judgementText: 800,
  transitionText: 1800,
  nameReveal: 2400,
  slogan: 3000,
  fromWork: 3800,
  cardReady: 4200,
} as const;

/** R4: ease-out-expo cubic-bezier(0.16,1,0.3,1) */
const EASE_OUT_EXPO = "cubic-bezier(0.16,1,0.3,1)";
/** R3: motion-7 transition duration for blur cross-fade */
const MOTION7_DURATION = "0.8s";
/** Stagger fade duration for reveal text elements */
const STAGGER_DURATION = "0.6s";

interface ResultData {
  code: string; name: string; subtitle?: string; slogan: string; desc: string; keywords?: string;
  similarity: number; userVector: string; templateVector: string;
  top3: { code: string; name: string; similarity: number; translations?: string }[];
  group: string; borderType: boolean; special: boolean;
  translations?: string;
}

interface ResultScreenProps {
  result: ResultData;
  stats?: { totalParticipants: number; typePercentage: number; typeCount: number } | null;
  onRestart: () => void;
}

/* ═══════════════════════════════════════════
   Reveal element visibility states (R1 stagger)
   ═══════════════════════════════════════════ */
interface RevealVisibility {
  judgementText: boolean;
  transitionText: boolean;
  nameReveal: boolean;
  slogan: boolean;
  fromWork: boolean;
}

const ALL_VISIBLE: RevealVisibility = {
  judgementText: true,
  transitionText: true,
  nameReveal: true,
  slogan: true,
  fromWork: true,
};

const NONE_VISIBLE: RevealVisibility = {
  judgementText: false,
  transitionText: false,
  nameReveal: false,
  slogan: false,
  fromWork: false,
};

export default function ResultScreen({ result, stats, onRestart }: ResultScreenProps) {
  const pack = getActivePack();
  const { t } = useI18n();
  const localized = useLocalizedContent(
    result.code, result.name, result.slogan, result.desc, result.keywords, result.subtitle, result.translations
  );

  /* ── A1: Internal reveal phase ── */
  const [revealPhase, setRevealPhase] = useState<"revealing" | "done">("revealing");
  const [revealVis, setRevealVis] = useState<RevealVisibility>(NONE_VISIBLE);
  const [revealLayerOut, setRevealLayerOut] = useState(false); // true = fading out
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  /* ── R5: prefers-reduced-motion check ── */
  const prefersReducedMotion = useRef(
    typeof window !== "undefined"
      ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
      : false
  ).current;

  /* ── Share card state ── */
  const shareCardRef = useRef<HTMLDivElement>(null);
  const [sharing, setSharing] = useState(false);
  const [shareCardReady, setShareCardReady] = useState(false);

  /* ── Profile card scroll ref for motion-6 edge blur ── */
  const profileRef = useRef<HTMLDivElement>(null);
  const [needsEdgeBlur, setNeedsEdgeBlur] = useState(false);

  /* ═══════════════════════════════════════════
     R1: Stagger reveal sequence on mount
     ═══════════════════════════════════════════ */
  useEffect(() => {
    document.body.classList.add("revealed");

    // R5: reduced-motion → skip directly to done
    if (prefersReducedMotion) {
      setRevealVis(ALL_VISIBLE);
      setRevealPhase("done");
      return () => { document.body.classList.remove("revealed"); };
    }

    const timers: ReturnType<typeof setTimeout>[] = [];
    timersRef.current = timers;

    const schedule = (cb: () => void, delay: number) => {
      const id = setTimeout(cb, delay);
      timers.push(id);
    };

    schedule(() => setRevealVis((v) => ({ ...v, judgementText: true })), REVEAL_TIMINGS.judgementText);
    schedule(() => setRevealVis((v) => ({ ...v, transitionText: true })), REVEAL_TIMINGS.transitionText);
    schedule(() => setRevealVis((v) => ({ ...v, nameReveal: true })), REVEAL_TIMINGS.nameReveal);
    schedule(() => setRevealVis((v) => ({ ...v, slogan: true })), REVEAL_TIMINGS.slogan);
    schedule(() => setRevealVis((v) => ({ ...v, fromWork: true })), REVEAL_TIMINGS.fromWork);
    schedule(() => {
      setRevealPhase("done");
    }, REVEAL_TIMINGS.cardReady);

    return () => {
      timers.forEach(clearTimeout);
      document.body.classList.remove("revealed");
    };
  }, [prefersReducedMotion]);

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

  /* ═══════════════════════════════════════════
     R2: Skip — any click/keydown → immediately done
     ═══════════════════════════════════════════ */
  const skipReveal = useCallback(() => {
    if (revealPhase === "done") return;
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
    setRevealVis(ALL_VISIBLE);
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
    if (revealPhase === "done" && !prefersReducedMotion) {
      // Small delay so the state settles before starting the CSS transition
      const id = setTimeout(() => setRevealLayerOut(true), 50);
      return () => clearTimeout(id);
    }
    if (revealPhase === "done" && prefersReducedMotion) {
      setRevealLayerOut(true);
    }
  }, [revealPhase, prefersReducedMotion]);

  /* ═══════════════════════════════════════════
     Share logic (preserved from original — R10)
     ═══════════════════════════════════════════ */
  const shareText = t("result.shareText", {
    name: localized.name,
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

  /* ── Pack work intro (A4) ── */
  const workIntro = pack.workIntro ?? "";
  const fromTitle = t("result.revealFrom", { title: pack.title || "魔女审判" });

  /* ═══════════════════════════════════════════
     Stagger fade-in helper
     ═══════════════════════════════════════════ */
  const staggerStyle = (visible: boolean): React.CSSProperties => ({
    opacity: visible ? 1 : 0,
    transform: visible ? "translateY(0)" : "translateY(12px)",
    transition: `opacity ${STAGGER_DURATION} ${EASE_OUT_EXPO}, transform ${STAGGER_DURATION} ${EASE_OUT_EXPO}`,
  });

  /* ═══════════════════════════════════════════
     RENDER
     ═══════════════════════════════════════════ */
  return (
    <div id="view-result">
      {/* ─── Profile Card (behind reveal layer) ─── */}
      <div
        className="result-layout"
        style={{
          opacity: revealPhase === "done" ? 1 : 0,
          transition: `opacity 0.8s ${EASE_OUT_EXPO}`,
        }}
      >
        <div
          ref={profileRef}
          style={{
            width: "100%",
            maxWidth: 640,
            margin: "0 auto",
            padding: "3rem 1.5rem 2rem",
            position: "relative",
            overflowY: needsEdgeBlur ? "auto" : "visible",
            maxHeight: needsEdgeBlur ? "100vh" : "none",
            /* R9: motion-6 edge blur via mask-image when content overflows */
            ...(needsEdgeBlur
              ? {
                  WebkitMaskImage: "linear-gradient(to bottom, transparent, black 40px, black calc(100% - 40px), transparent)",
                  maskImage: "linear-gradient(to bottom, transparent, black 40px, black calc(100% - 40px), transparent)",
                }
              : {}),
          }}
        >
          {/* R6: 角色名 + English subtitle */}
          <div className="r-name" style={{ fontSize: "clamp(2.5rem, 10vw, 5rem)", marginBottom: "0.3rem" }}>
            {localized.name}
          </div>
          {localized.subtitle && (
            <div style={{
              fontFamily: "var(--f-title)",
              fontSize: "clamp(0.75rem, 1.5vw, 1rem)",
              letterSpacing: "0.2em",
              color: "#888",
              marginBottom: "1rem",
            }}>
              {localized.subtitle}
            </div>
          )}

          {/* Slogan */}
          <div className="r-slogan" style={{ marginBottom: "0.6rem" }}>{localized.slogan}</div>

          {/* ── 来自《魔女审判》 ── */}
          <div style={{
            display: "flex", alignItems: "center", gap: "0.8rem",
            fontSize: "0.7rem", fontFamily: "var(--f-title)", letterSpacing: "0.15em",
            color: "#888", marginBottom: "1.2rem",
          }}>
            <span style={{ flex: 1, height: 1, background: "rgba(0,0,0,0.1)" }} />
            {fromTitle}
            <span style={{ flex: 1, height: 1, background: "rgba(0,0,0,0.1)" }} />
          </div>

          {/* R7/R6: 一句话作品介绍 (A4: pack.workIntro) */}
          {workIntro && (
            <div style={{
              fontSize: "clamp(0.8rem, 1.5vw, 0.95rem)",
              color: "rgba(0,0,0,0.55)",
              fontStyle: "italic",
              lineHeight: 1.7,
              marginBottom: "1.2rem",
              paddingBottom: "1.2rem",
              borderBottom: "1px solid rgba(0,0,0,0.08)",
            }}>
              {workIntro}
            </div>
          )}

          {/* R8: 第二人称描述 */}
          <div className="r-desc" style={{ marginBottom: "1.2rem" }}>{localized.desc}</div>

          {/* R8: 灵魂特质 keywords */}
          {localized.keywords && (
            <div className="r-keywords" style={{ marginBottom: "1.2rem" }}>
              <div style={{
                fontSize: "0.65rem", fontFamily: "var(--f-title)", letterSpacing: "0.2em",
                color: "#888", marginBottom: "0.5rem",
              }}>
                {t("result.soulTraits")}
              </div>
              <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
                {localized.keywords.split(/[、,，]/).map((kw: string, i: number) => (
                  <span key={i} className="r-keyword-tag">{kw.trim()}</span>
                ))}
              </div>
            </div>
          )}

          {/* R11: 稀有度 */}
          <div style={{ marginBottom: "0.8rem" }}>
            <div style={{
              fontSize: "0.65rem", fontFamily: "var(--f-title)", letterSpacing: "0.2em",
              color: "#888", marginBottom: "0.5rem",
            }}>
              {t("result.rarityLabel")}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
              {/* Progress bar: fill = typePercentage%, rarer = emptier */}
              <div style={{
                flex: 1, height: 6, borderRadius: 3,
                background: "rgba(0,0,0,0.06)", overflow: "hidden",
              }}>
                <div style={{
                  width: `${rarityBarPercent}%`, height: "100%",
                  background: "rgba(139,0,0,0.35)", borderRadius: 3,
                  transition: `width 0.6s ${EASE_OUT_EXPO}`,
                }} />
              </div>
              <span style={{
                fontSize: "0.7rem", fontFamily: "var(--f-title)", letterSpacing: "0.1em",
                color: typePercentage !== null ? "#555" : "#bbb",
                whiteSpace: "nowrap",
              }}>
                {rarityText}
              </span>
            </div>
          </div>

          {/* R16: Hidden character light text */}
          {result.special && (
            <div style={{
              fontSize: "clamp(0.8rem, 1.3vw, 0.9rem)",
              fontStyle: "italic",
              color: "#8b5cf6",
              marginBottom: "1rem",
              opacity: 0.8,
            }}>
              {t("result.hiddenReveal")}
            </div>
          )}

          {/* R10: Action buttons */}
          <div className="r-actions">
            <button className="btn-restart" onClick={handleShare} disabled={sharing}>
              {sharing ? "..." : t("result.share")}
            </button>
            <button className="btn-restart" onClick={onRestart}>
              {t("result.rebirth")}
            </button>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════
         R1-R5: Reveal overlay layer
         Sits above profile card; fades out when done
         ═══════════════════════════════════════════ */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 100,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          background: "#050308",
          color: "#e6e6e6",
          fontFamily: "var(--f-body)",
          pointerEvents: revealLayerOut ? "none" : "auto",
          opacity: revealLayerOut ? 0 : 1,
          transition: revealLayerOut
            ? `opacity 0.8s ${EASE_OUT_EXPO}`
            : "none",
        }}
      >
        {/* Skip hint */}
        {!revealLayerOut && revealPhase === "revealing" && !prefersReducedMotion && (
          <div style={{
            position: "absolute",
            bottom: "5vh",
            fontSize: "0.55rem",
            letterSpacing: "0.3em",
            color: "rgba(255,255,255,0.15)",
            fontFamily: "var(--f-title)",
          }}>
            点击任意处跳过
          </div>
        )}

        <div style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          textAlign: "center",
          gap: "0",
          padding: "0 2rem",
          maxWidth: 500,
        }}>
          {/* 1. 「审判结束了。」 */}
          <div style={{
            ...staggerStyle(revealVis.judgementText),
            fontSize: "clamp(0.85rem, 1.5vw, 1rem)",
            fontWeight: 300,
            letterSpacing: "0.15em",
            color: "rgba(255,255,255,0.6)",
            marginBottom: "2rem",
          }}>
            {t("result.revealJudgement")}
          </div>

          {/* 2. 「而你是——」 */}
          <div style={{
            ...staggerStyle(revealVis.transitionText),
            fontSize: "clamp(0.85rem, 1.5vw, 1rem)",
            fontWeight: 300,
            letterSpacing: "0.15em",
            color: "rgba(255,255,255,0.5)",
            marginBottom: "2.5rem",
          }}>
            {t("result.revealTransition")}
          </div>

          {/* 3. 角色名 — motion-7: blur cross-fade */}
          <div style={{
            fontSize: "clamp(2.8rem, 10vw, 5.5rem)",
            fontWeight: 900,
            lineHeight: 1.1,
            letterSpacing: "0.15em",
            color: "#fff",
            marginBottom: "1rem",
            /* R3: motion-7 cross-fade through blur */
            opacity: revealVis.nameReveal ? 1 : 0,
            filter: revealVis.nameReveal ? "blur(0px)" : "blur(20px)",
            transform: revealVis.nameReveal ? "scale(1)" : "scale(1.05)",
            transition: `opacity ${MOTION7_DURATION} ${EASE_OUT_EXPO}, filter ${MOTION7_DURATION} ${EASE_OUT_EXPO}, transform ${MOTION7_DURATION} ${EASE_OUT_EXPO}`,
          }}>
            {localized.name}
          </div>

          {/* 4. 标语 */}
          <div style={{
            ...staggerStyle(revealVis.slogan),
            fontSize: "clamp(0.85rem, 1.6vw, 1.05rem)",
            fontStyle: "italic",
            fontWeight: 300,
            color: "rgba(212,175,55,0.7)",
            lineHeight: 1.7,
            marginBottom: "1.2rem",
          }}>
            {localized.slogan}
          </div>

          {/* 5. 来自《魔女审判》 */}
          <div style={{
            ...staggerStyle(revealVis.fromWork),
            fontSize: "0.7rem",
            fontFamily: "var(--f-title)",
            letterSpacing: "0.2em",
            color: "rgba(255,255,255,0.3)",
          }}>
            {fromTitle}
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════
         R14-R15: Share card (offscreen, for toPng)
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
            {/* R14: Hook text — "我接受了灵魂审判。" */}
            <div style={{
              fontFamily: "'Cinzel', serif",
              fontSize: "0.55rem",
              letterSpacing: "0.5em",
              color: "rgba(212,175,55,0.6)",
              marginBottom: "1.2rem",
            }}>
              {t("result.shareHook")}
            </div>
            {/* 角色名 */}
            <div style={{
              fontSize: "1.8rem", fontWeight: 900, lineHeight: 1.15,
              color: "#fff", marginBottom: "0.4rem",
            }}>
              {localized.name}
            </div>
            {/* English subtitle */}
            {localized.subtitle && (
              <div style={{
                fontSize: "0.75rem", color: "#888", letterSpacing: "0.15em",
                marginBottom: "0.3rem",
              }}>
                {localized.subtitle}
              </div>
            )}
            {/* 标语 */}
            <div style={{
              fontSize: "0.75rem", fontStyle: "italic",
              color: "#d4af37", marginTop: "0.8rem", lineHeight: 1.6,
            }}>
              {localized.slogan}
            </div>
            {/* 来自《魔女审判》 */}
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
            {localized.keywords && (
              <div style={{ display: "flex", gap: "0.3rem", flexWrap: "wrap", marginBottom: "1rem" }}>
                {localized.keywords.split(/[、,，]/).map((kw: string, i: number) => (
                  <span key={i} style={{
                    fontSize: "0.55rem", padding: "0.15rem 0.45rem",
                    border: "1px solid rgba(212,175,55,0.25)", borderRadius: 999,
                    color: "rgba(212,175,55,0.7)",
                  }}>
                    {kw.trim()}
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
                      fontWeight: 900, color: "#d4af37",
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
              {/* R14: CTA — "来接受审判 →" */}
              <div style={{
                fontSize: "0.6rem", letterSpacing: "0.15em",
                color: "rgba(212,175,55,0.5)",
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
