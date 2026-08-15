"use client";

import { useEffect, useRef, useState } from "react";
import type { JSX } from "react";

/**
 * AuroraBurst —— 32 同款极光转场幕布（替换 loading spinner）。
 *
 * 视觉：fixed 全屏覆盖层（z8000，复用原 loading overlay 层位，ADR 盲点 #8），
 * 内含 IM1 已在 globals.css 定义的 `.aurora-burst` 圆点
 * （10px scale 1→250 + radial gold→purple→void，≈100ms 触发 + 800ms 主播放 + 400ms 淡出）。
 *
 * 时序契约（ADR 盲点 #13 / 风险1）：
 * - active=true  → 挂 `.active` 触发动画；同时 setTimeout(minDurationMs) 后调 onComplete，
 *   作为"最小时长满足"信号（fetch 完成是 page 侧的另一个信号，两者 Promise.all）。
 * - active=false → 摘 `.active`（圆点收缩 + 淡出，ResultScreen 在其下挂载）。
 * - reduced-motion：globals.css 已把 transform 钉在 scale(1)、仅留 opacity 淡出，
 *   但 JS 时序仍按 minDurationMs 跑（1300ms 过长）。reducedMotion=true 时
 *   用短值 REDUCED_MIN_MS（仅够 opacity 淡出），由调用方（page.tsx 经 matchMedia 检测）传入。
 * - 卸载 / active 提前变 false 时 clearTimeout，onComplete 不再触发（防悬空回调）。
 */
const REDUCED_MIN_MS = 400;

export function AuroraBurst({ active, minDurationMs = 1300, reducedMotion = false, onComplete }: {
  active: boolean;
  minDurationMs?: number;
  reducedMotion?: boolean;
  onComplete?: () => void;
}): JSX.Element | null {
  // 未激活过则完全不渲染（避免常驻空 fixed 层挡交互）；激活后常驻以播放淡出。
  const [everActive, setEverActive] = useState(false);
  // onComplete 经 ref 取最新引用，避免 effect 闭包陈旧。
  const onCompleteRef = useRef(onComplete);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    if (!active) return;
    setEverActive(true);
    const effectiveDuration = reducedMotion ? REDUCED_MIN_MS : minDurationMs;
    const timer = window.setTimeout(() => {
      onCompleteRef.current?.();
    }, effectiveDuration);
    return () => window.clearTimeout(timer);
  }, [active, minDurationMs, reducedMotion]);

  if (!everActive) return null;

  return (
    <div
      aria-hidden="true"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 8000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        // 极光淡出后（active=false）不挡 ResultScreen 交互；播放中（active=true）挡住是预期
        pointerEvents: active ? "auto" : "none",
      }}
    >
      <div className={`aurora-burst${active ? " active" : ""}`} />
    </div>
  );
}
