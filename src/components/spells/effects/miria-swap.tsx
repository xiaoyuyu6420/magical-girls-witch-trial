"use client";

/**
 * spells/effects/miria-swap.tsx — 佐伯米莉亚「互换」
 *
 * 结果页觉醒：真实的 UI 互换由 bodyClass="spell-miria" 驱动——
 * tarot 卡与详情区沿轨道交换位置再换回（CSS 动画，见 globals.css）。
 * 本组件只负责紫雾氛围 + 浮字（「这具身体里，装着谁的灵魂？」）。
 */

import { useEffect, useRef, useState } from "react";
import type { SpellProps } from "../types";

export default function MiriaSwap({ line, reducedMotion, onDone }: SpellProps) {
  const [shown, setShown] = useState(0);
  const doneRef = useRef(false);
  const finish = useRef(onDone);
  useEffect(() => { finish.current = onDone; }, [onDone]);

  useEffect(() => {
    const done = () => { if (!doneRef.current) { doneRef.current = true; finish.current(); } };
    if (reducedMotion) { const t = setTimeout(done, 2000); return () => clearTimeout(t); }
    const type = setInterval(() => {
      setShown((n) => {
        if (n + 1 >= line.length) clearInterval(type);
        return n + 1;
      });
    }, 60);
    const t = setTimeout(done, line.length * 60 + 1600);
    return () => { clearInterval(type); clearTimeout(t); };
  }, [line, reducedMotion]);

  return (
    <div className="spell-root" style={{ pointerEvents: "none" }}>
      {!reducedMotion && <div className="spell-miria-mist" aria-hidden="true" />}
      <div className="spell-line">
        {reducedMotion ? line : line.slice(0, shown)}
        {!reducedMotion && <span className="spell-caret" aria-hidden="true" />}
      </div>
    </div>
  );
}
