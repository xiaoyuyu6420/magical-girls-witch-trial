"use client";

/**
 * spells/effects/alisa-ignition.tsx — 紫藤亚里沙「点火」：金色仪式火
 *
 * 站内是黑金衬线的审判庭，像素游戏火与它气质相斥（用户裁决）。
 * 这里的火走仪式感：全屏压暗，结果区升起一簇金橙柔火——
 * 大光晕脉动 + 三片火舌剪影（大模糊、缓慢摇曳、零像素感）+ 少量火星上升，
 * 火光里显形，再收敛成余烬。色板收在金 #d4af37 / 深橙 / 暖白。
 * reduced-motion：只浮字。
 */

import { useEffect, useRef, useState } from "react";
import type { SpellProps } from "../types";

interface Spark { dx: number; dy: number; dur: number; delay: number; leftOff: number; key: number }

/** 火舌剪影：宽底泪滴（渲染三片，大小/错相不同） */
const TONGUE = "M0,130 C-58,92 -72,26 -36,-38 C-15,-76 15,-76 36,-38 C72,26 58,92 0,130 Z";

export default function AlisaIgnition({ line, reducedMotion, onDone }: SpellProps) {
  const [dying, setDying] = useState(false);
  const [sparks, setSparks] = useState<Spark[]>([]);
  const doneRef = useRef(false);
  const finish = useRef(onDone);
  useEffect(() => { finish.current = onDone; }, [onDone]);

  useEffect(() => {
    const done = () => { if (!doneRef.current) { doneRef.current = true; finish.current(); } };
    if (reducedMotion) { const t = setTimeout(done, 2000); return () => clearTimeout(t); }
    // 火星轨迹：异步生成（Math.random 不纯，须避开 render 与同步 effect）
    const t0 = setTimeout(() => {
      setSparks(Array.from({ length: 7 }, (_, i) => ({
        dx: (Math.random() - 0.5) * 120,
        dy: -(70 + Math.random() * 130),
        dur: 1.6 + Math.random() * 1.2,
        delay: Math.random() * 1.4,
        leftOff: Math.random() * 160 - 80,
        key: i,
      })));
    }, 0);
    const t1 = setTimeout(() => setDying(true), 2300);
    const t2 = setTimeout(done, 3300);
    return () => { clearTimeout(t0); clearTimeout(t1); clearTimeout(t2); };
  }, [reducedMotion]);

  return (
    <div className="spell-root" style={{ pointerEvents: "none" }}>
      <div className={`spell-fireveil ${dying ? "is-dying" : ""}`} style={{ pointerEvents: "none" }}>
        {/* 主光晕：金橙脉动 */}
        <div className="spell-fire-glow" aria-hidden="true" />
        {/* 火舌剪影三片：大模糊、错相摇曳 */}
        <svg className="spell-fire-tongue spell-fire-tongue--a" viewBox="-120,-80,240,215" aria-hidden="true">
          <path d={TONGUE} />
        </svg>
        <svg className="spell-fire-tongue spell-fire-tongue--b" viewBox="-120,-80,240,215" aria-hidden="true">
          <path d={TONGUE} />
        </svg>
        <svg className="spell-fire-tongue spell-fire-tongue--c" viewBox="-120,-80,240,215" aria-hidden="true">
          <path d={TONGUE} />
        </svg>
        <div className="spell-fire-base" aria-hidden="true" />
        {/* 火星：细长金条上升 */}
        {sparks.map((s) => (
          <span
            key={s.key}
            className="spell-fire-spark"
            aria-hidden="true"
          style={{
            left: `calc(50% + ${s.leftOff.toFixed(0)}px)`,
            bottom: "34%",
              ["--dx" as string]: `${s.dx}px`,
              ["--dy" as string]: `${s.dy}px`,
              animationDuration: `${s.dur}s`,
              animationDelay: `${s.delay}s`,
            }}
          />
        ))}
      </div>
      <div className="spell-line">{line}</div>
    </div>
  );
}
