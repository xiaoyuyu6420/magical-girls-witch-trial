"use client";

/**
 * spells/effects/shiro-time-leap.tsx — 二阶堂希罗「死亡回溯」（结果页觉醒完整版）
 *
 * 编排（~3.8s，全程 pointer-events:none）：
 *   1. 闪白 0.22s——回溯发动的"断片"
 *   2. 全屏负片一瞬（invert + 色相偏移 0.4s 淡出）——时间被拉回去的视觉隐喻
 *   3. 打字机浮字「只要用我的魔法，就能回到今天早上。」（原 Act02_Chapter05_Adv03）
 * reduced-motion：只浮字。
 */

import { useEffect, useRef, useState } from "react";
import type { SpellProps } from "../types";

export default function ShiroTimeLeap({ line, reducedMotion, onDone }: SpellProps) {
  const [phase, setPhase] = useState<"flash" | "invert" | "line">("flash");
  const [shown, setShown] = useState(0);
  const doneRef = useRef(false);
  const finish = useRef(onDone);
  useEffect(() => { finish.current = onDone; }, [onDone]);

  useEffect(() => {
    const done = () => { if (!doneRef.current) { doneRef.current = true; finish.current(); } };
    if (reducedMotion) { const t = setTimeout(done, 2000); return () => clearTimeout(t); }
    const t1 = setTimeout(() => setPhase("invert"), 220);
    const t2 = setTimeout(() => setPhase("line"), 700);
    const t3 = setTimeout(done, 700 + line.length * 60 + 1900);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [line, reducedMotion]);

  useEffect(() => {
    if (phase !== "line" || reducedMotion) return;
    const type = setInterval(() => {
      setShown((n) => {
        if (n + 1 >= line.length) clearInterval(type);
        return n + 1;
      });
    }, 60);
    return () => clearInterval(type);
  }, [phase, reducedMotion, line]);

  return (
    <div className="spell-root" style={{ pointerEvents: "none" }}>
      {phase === "flash" && !reducedMotion && <div className="spell-flash" aria-hidden="true" />}
      {phase === "invert" && !reducedMotion && <div className="spell-invert" aria-hidden="true" />}
      {phase === "line" && (
        <div className="spell-line">
          {reducedMotion ? line : line.slice(0, shown)}
          {!reducedMotion && <span className="spell-caret" aria-hidden="true" />}
        </div>
      )}
    </div>
  );
}
