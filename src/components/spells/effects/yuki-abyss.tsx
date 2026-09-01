"use client";

/**
 * spells/effects/yuki-abyss.tsx — 月代雪「大魔女」集齐终局
 *
 * 见证账本集齐其他全部能力后，结果页追加的这一场：
 * 全屏坠入深紫，巨大魔法阵缓缓旋转（双环 + 刻度 + 内接多边形，
 * 内外环反向），中央浮字。仪式感压过一切特效。
 */

import { useEffect, useRef, useState } from "react";
import type { SpellProps } from "../types";

export default function YukiAbyss({ line, reducedMotion, onDone }: SpellProps) {
  const [shown, setShown] = useState(0);
  const doneRef = useRef(false);
  const finish = useRef(onDone);
  useEffect(() => { finish.current = onDone; }, [onDone]);

  // 刻度线 36 根：预生成几何（纯确定性，无随机）
  const ticks = Array.from({ length: 36 }, (_, i) => {
    const a = (i / 36) * Math.PI * 2;
    const r1 = 168, r2 = i % 3 === 0 ? 148 : 158;
    return {
      x1: 200 + Math.cos(a) * r1, y1: 200 + Math.sin(a) * r1,
      x2: 200 + Math.cos(a) * r2, y2: 200 + Math.sin(a) * r2,
      key: i,
    };
  });

  useEffect(() => {
    const done = () => { if (!doneRef.current) { doneRef.current = true; finish.current(); } };
    if (reducedMotion) { const t = setTimeout(done, 2000); return () => clearTimeout(t); }
    const type = setInterval(() => {
      setShown((n) => {
        if (n + 1 >= line.length) clearInterval(type);
        return n + 1;
      });
    }, 70);
    const t = setTimeout(done, line.length * 70 + 2600);
    return () => { clearInterval(type); clearTimeout(t); };
  }, [line, reducedMotion]);

  return (
    <div className="spell-root spell-abyss" style={{ pointerEvents: "none" }}>
      {!reducedMotion && (
        <svg className="spell-abyss-circle" viewBox="0 0 400 400" aria-hidden="true">
          <circle cx="200" cy="200" r="172" fill="none" stroke="rgba(190,150,255,0.35)" strokeWidth="1" />
          <circle cx="200" cy="200" r="128" fill="none" stroke="rgba(190,150,255,0.28)" strokeWidth="1" />
          {ticks.map((t) => (
            <line key={t.key} x1={t.x1} y1={t.y1} x2={t.x2} y2={t.y2}
              stroke="rgba(190,150,255,0.3)" strokeWidth="1" />
          ))}
          <polygon points="200,64 316.8,282 83.2,282" fill="none" stroke="rgba(190,150,255,0.22)" strokeWidth="1" />
          <polygon points="200,336 83.2,118 316.8,118" fill="none" stroke="rgba(190,150,255,0.16)" strokeWidth="1" />
        </svg>
      )}
      <div className="spell-line spell-abyss-line">
        {reducedMotion ? line : line.slice(0, shown)}
        {!reducedMotion && <span className="spell-caret" aria-hidden="true" />}
      </div>
    </div>
  );
}
