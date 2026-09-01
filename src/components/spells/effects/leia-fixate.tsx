"use client";

/**
 * spells/effects/leia-fixate.tsx — 莲见蕾雅「固定视线」
 *
 * 结果页静默 8s 后触发：画面骤暗，金色焦点环在屏幕中央锁死、
 * 周围放射细线收束——「不要移开视线。」1.6s 后松开。
 * 纯视觉隐喻，不真禁滚动（结果页无滚动需求）。
 */

import { useEffect, useRef, useState } from "react";
import type { SpellProps } from "../types";

export default function LeiaFixate({ line, reducedMotion, onDone }: SpellProps) {
  const [released, setReleased] = useState(false);
  const doneRef = useRef(false);
  const finish = useRef(onDone);
  useEffect(() => { finish.current = onDone; }, [onDone]);

  useEffect(() => {
    const done = () => { if (!doneRef.current) { doneRef.current = true; finish.current(); } };
    if (reducedMotion) { const t = setTimeout(done, 2000); return () => clearTimeout(t); }
    const t1 = setTimeout(() => setReleased(true), 1700);
    const t2 = setTimeout(done, 2300);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [reducedMotion]);

  return (
    <div
      className="spell-root"
      style={{
        pointerEvents: "none",
        background: released && !reducedMotion ? "transparent" : "rgba(3,3,3,0.62)",
        transition: reducedMotion ? "none" : "background 0.6s ease",
      }}
    >
      {!reducedMotion && !released && (
        <div className="spell-fixate" aria-hidden="true">
          <span className="spell-fixate-ring" />
        </div>
      )}
      <div className="spell-line">{line}</div>
    </div>
  );
}
