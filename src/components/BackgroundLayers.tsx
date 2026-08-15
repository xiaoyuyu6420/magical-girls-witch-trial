"use client";

import { useEffect, useRef, useState } from "react";
import type { JSX } from "react";

/**
 * 背景层组件（IM2 · HTML 32 视觉重做 · crucible/30-adr/final.md 决策 3 / 盲点 #7/#11）
 *
 * 纯展示、零状态、零 E2E 锚点。渲染三层（z 低→高，CSS 见 globals.css atmosphere 层）：
 *   1. <canvas id="bg-canvas">       —— 移植金标（ai_studio_code (32).html）initCanvas/drawCanvas
 *                                      的金粒子：45 个、rgba(212,175,55,α)、shadowBlur=10、
 *                                      rAF 循环、边界反弹、resize 重设尺寸。
 *   2. <div class="bg-typography">   —— 巨型浮雕题号（"01".."26"），questionIndex 变化由
 *                                      React 直接更新文本，无需 effect。
 *   3. <div class="film-grain">      —— 空 div，SVG noise 由 CSS 提供。
 *
 * 守卫：
 *   - SSR（typeof window === 'undefined'）→ return null（盲点 #11）。
 *   - reducedMotion → 不渲染 canvas、不启 rAF（盲点 #7 / P8 红线；题号浮雕与 grain 是
 *     静态层，照常渲染，CSS reduced-motion 层已给 transition:none / opacity 降级）。
 *   - 桌面（>768px）→ return null：与移动端同源（2026-08-15 视觉统一：
 *     粒子/浮雕/颗粒仅移动端渲染；桌面干净背景，rAF 也不启动，零开销）。
 *   - 卸载清理：cancelAnimationFrame + removeEventListener('resize')，防泄漏。
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
  vx: number;
  vy: number;
}

/** 金标粒子数：45 */
const PARTICLE_COUNT = 45;

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
    setIsDesktop(mq.matches);
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
    let rafId = 0;

    /** 金标 initCanvas：按视口重设缓冲尺寸 + 重建 45 粒子 */
    const initCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      particles = [];
      for (let i = 0; i < PARTICLE_COUNT; i++) {
        particles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          radius: Math.random() * 2 + 1,
          alpha: Math.random() * 0.5 + 0.1,
          vx: (Math.random() - 0.5) * 0.4,
          vy: (Math.random() - 0.5) * 0.4,
        });
      }
    };

    /** 金标 drawCanvas：逐粒子移动 + 边界反弹 + 金辉填充（2026-08-15 视觉统一：
        原紫粒子 rgba(216,0,255) → 旧金 rgba(212,175,55)，与全站黑金一致） */
    const drawCanvas = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(212, 175, 55, ${p.alpha})`;
        ctx.shadowBlur = 10;
        ctx.shadowColor = "#D4AF37";
        ctx.fill();
      }
      rafId = requestAnimationFrame(drawCanvas);
    };

    initCanvas();
    rafId = requestAnimationFrame(drawCanvas);
    window.addEventListener("resize", initCanvas);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("resize", initCanvas);
    };
  }, [reducedMotion, isDesktop]);

  // SSR 守卫（盲点 #11）：服务端渲染不输出任何层
  if (typeof window === "undefined") return null;
  // 桌面回滚守卫：桌面不渲染任何层（此时 rAF 已被 effect 内守卫拦下，零开销）
  if (isDesktop) return null;

  const questionLabel = String(questionIndex + 1).padStart(2, "0");

  return (
    <>
      {!reducedMotion && <canvas id="bg-canvas" ref={canvasRef} />}
      <div className="bg-typography">{questionLabel}</div>
      <div className="film-grain" />
    </>
  );
}
