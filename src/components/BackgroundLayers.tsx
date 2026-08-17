"use client";

import { useEffect, useRef, useState } from "react";
import type { JSX } from "react";

/**
 * 背景层组件（IM2 · HTML 32 视觉重做 · crucible/30-adr/final.md 决策 3 / 盲点 #7/#11）
 *
 * 纯展示、零状态、零 E2E 锚点。渲染三层（z 低→高，CSS 见 globals.css atmosphere 层）：
 *   1. <canvas id="bg-canvas">       —— 静态金色尘点：挂载和 resize 时各绘一帧，
 *                                      不运行持续 rAF，保留空间层次但不制造注意力运动。
 *   2. <div class="mobile-ambient-backdrop"> —— 低对比度审判庭环境底图（只在手机显示），
 *                                      把答题页从“纯黑 + 金点”拉回有空间感的场景。
 *   3. <div class="bg-typography">   —— 巨型浮雕题号（"01".."26"），questionIndex 变化由
 *                                      React 直接更新文本，无需 effect。
 *   4. <div class="film-grain">      —— 空 div，SVG noise 由 CSS 提供。
 *
 * 守卫：
 *   - SSR（typeof window === 'undefined'）→ return null（盲点 #11）。
 *   - reducedMotion → 不渲染 canvas（盲点 #7 / P8 红线；题号浮雕与 grain 是
 *     静态层，照常渲染，CSS reduced-motion 层已给 transition:none / opacity 降级）。
 *   - 桌面（>768px）→ return null：粒子/浮雕/颗粒仅移动端渲染。
 *   - 卸载清理 resize listener，防泄漏。
 */

interface BackgroundLayersProps {
  questionIndex: number;
  reducedMotion: boolean;
}

interface Particle {
  x: number;
  y: number;
  radius: number;
  alpha: number;
}

/** 静态尘点数量：只作为低对比度层次，不承担主视觉。 */
const PARTICLE_COUNT = 14;

export function BackgroundLayers({
  questionIndex,
  reducedMotion,
}: BackgroundLayersProps): JSX.Element | null {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  // 桌面检测：与 mobile-skin 的 (max-width:768px) 互斥。窗口拖跨断点时跟随切换。
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(min-width: 769px)");
    queueMicrotask(() => setIsDesktop(mq.matches));
    const onChange = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  // 桌面回滚守卫（effect 内守卫，不能提前 return——hooks 顺序必须恒定）
  useEffect(() => {
    // SSR 守卫（盲点 #11）：服务端无 window/canvas/rAF；reduced-motion 不启 rAF（盲点 #7）
    if (typeof window === "undefined" || reducedMotion || isDesktop) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let particles: Particle[] = [];

    const paintCanvas = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (const p of particles) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(212, 175, 55, ${p.alpha})`;
        ctx.shadowBlur = 6;
        ctx.shadowColor = "#D4AF37";
        ctx.fill();
      }
    };

    /** 按视口重设缓冲尺寸，重建并静态绘制尘点。 */
    const initCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      particles = [];
      for (let i = 0; i < PARTICLE_COUNT; i++) {
        particles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          radius: Math.random() * 1.25 + 0.45,
          alpha: Math.random() * 0.22 + 0.06,
        });
      }
      paintCanvas();
    };

    initCanvas();
    window.addEventListener("resize", initCanvas);

    return () => {
      window.removeEventListener("resize", initCanvas);
    };
  }, [reducedMotion, isDesktop]);

  // SSR 守卫（盲点 #11）：服务端渲染不输出任何层
  if (typeof window === "undefined") return null;
  // 桌面回滚守卫：桌面不渲染任何层（静态背景层零开销）
  if (isDesktop) return null;

  const questionLabel = String(questionIndex + 1).padStart(2, "0");

  return (
    <>
      <div className="mobile-ambient-backdrop" aria-hidden="true" />
      {!reducedMotion && <canvas id="bg-canvas" ref={canvasRef} />}
      <div className="bg-typography">{questionLabel}</div>
      <div className="film-grain" />
    </>
  );
}
