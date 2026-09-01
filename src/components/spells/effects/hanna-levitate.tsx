"use client";

/**
 * spells/effects/hanna-levitate.tsx — 远野汉娜「飘浮」
 *
 * 两层演出：
 * 1. 真实 UI 失重：registry bodyClass="spell-hanna" → globals.css 里
 *    body.spell-hanna 的题卡/选项异相位正弦漂浮（真 UI 动，不是画个假的）
 * 2. overlay：几粒光尘缓慢上升 + 浮字
 * reduced-motion：Director 跳过 bodyClass，这里只浮字。
 */

import { useEffect, useRef, useState } from "react";
import type { SpellProps } from "../types";

export default function HannaLevitate({ line, reducedMotion, onDone }: SpellProps) {
  const [shown, setShown] = useState(0);
  const doneRef = useRef(false);
  const finish = useRef(onDone);
  useEffect(() => { finish.current = onDone; }, [onDone]);

  // 光尘几何：异步生成（Math.random 不纯，须避开 render 与同步 effect）
  const [dust, setDust] = useState<Array<{
    key: number; left: number; size: number; dur: number; delay: number;
  }>>([]);
  useEffect(() => {
    const t = setTimeout(() => {
      setDust(Array.from({ length: 5 }, (_, i) => ({
        key: i,
        left: 12 + Math.random() * 76,
        size: 3 + Math.random() * 4,
        dur: 2.6 + Math.random() * 1.4,
        delay: Math.random() * 1.2,
      })));
    }, 0);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const done = () => { if (!doneRef.current) { doneRef.current = true; finish.current(); } };
    if (reducedMotion) { const t = setTimeout(done, 2000); return () => clearTimeout(t); }
    const type = setInterval(() => {
      setShown((n) => {
        if (n + 1 >= line.length) clearInterval(type);
        return n + 1;
      });
    }, 60);
    const t = setTimeout(done, line.length * 60 + 2000);
    return () => { clearInterval(type); clearTimeout(t); };
  }, [line, reducedMotion]);

  return (
    <div className="spell-root" style={{ pointerEvents: "none" }}>
      {!reducedMotion && dust.map((p) => (
        <span
          key={p.key}
          className="spell-dust"
          aria-hidden="true"
          style={{
            left: `${p.left}%`, bottom: "-10px",
            width: p.size, height: p.size,
            animationDuration: `${p.dur}s`,
            animationDelay: `${p.delay}s`,
          }}
        />
      ))}
      <div className="spell-line">
        {reducedMotion ? line : line.slice(0, shown)}
        {!reducedMotion && <span className="spell-caret" aria-hidden="true" />}
      </div>
    </div>
  );
}
