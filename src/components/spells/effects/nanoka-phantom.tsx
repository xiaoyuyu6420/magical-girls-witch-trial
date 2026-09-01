"use client";

/**
 * spells/effects/nanoka-phantom.tsx — 黑部奈叶香「幻视」
 *
 * 结果页觉醒演出：结果卡前浮现"另一种可能的你"——
 * top3 次高角色名（payload.altName）以半透明重影显形又消散。
 * 无 altName 时退化为纯浮字。
 */

import { useEffect, useRef, useState } from "react";
import type { SpellProps } from "../types";

export default function NanokaPhantom({ line, reducedMotion, onDone, payload }: SpellProps) {
  const altName = payload?.altName ?? null;
  const [phase, setPhase] = useState<"in" | "out">("in");
  const doneRef = useRef(false);
  const finish = useRef(onDone);
  useEffect(() => { finish.current = onDone; }, [onDone]);

  useEffect(() => {
    const done = () => { if (!doneRef.current) { doneRef.current = true; finish.current(); } };
    if (reducedMotion) { const t = setTimeout(done, 2000); return () => clearTimeout(t); }
    const t1 = setTimeout(() => setPhase("out"), 2400);
    const t2 = setTimeout(done, 3100);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [reducedMotion]);

  return (
    <div className="spell-root" style={{ pointerEvents: "none" }}>
      {altName && !reducedMotion && (
        <div
          className="spell-phantom-name"
          aria-hidden="true"
          style={phase === "out" ? { animation: "spell-phantom-out 0.7s ease-in forwards" } : undefined}
        >
          {altName}
          <span className="spell-phantom-sub">—— 另一种可能的你</span>
        </div>
      )}
      <div className="spell-line">{line}</div>
    </div>
  );
}
