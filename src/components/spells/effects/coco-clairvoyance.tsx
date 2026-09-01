"use client";

/**
 * spells/effects/coco-clairvoyance.tsx — 泽渡可可「千里眼」
 *
 * 发动条件（原作设定）：「对方看着我」——悬停审判庭 HUD 1.5s 触发。
 * 千里眼看穿的不是未来，是你自己的数据：读取 TestScreen 记录的
 * window.__trialStats（全场用时 / 最久犹豫的题），浮字下方亮出两条真相。
 */

import { useEffect, useRef, useState } from "react";
import type { SpellProps } from "../types";

interface TrialStats { start: number; maxDwellSec: number; maxDwellQ: number }

export default function CocoClairvoyance({ line, reducedMotion, onDone }: SpellProps) {
  const [facts, setFacts] = useState<string[]>([]);
  const doneRef = useRef(false);
  const finish = useRef(onDone);
  useEffect(() => { finish.current = onDone; }, [onDone]);

  useEffect(() => {
    // 千里眼的内容 = 你的真实行为数据（TestScreen 侧维护）；异步读（lint 规则）
    const t = setTimeout(() => {
      const st = (window as unknown as { __trialStats?: TrialStats }).__trialStats;
      const rows: string[] = [];
      if (st) {
        const sec = Math.round((Date.now() - st.start) / 1000);
        rows.push(`入场至今 ${Math.floor(sec / 60)} 分 ${sec % 60} 秒`);
        if (st.maxDwellSec > 0) rows.push(`第 ${st.maxDwellQ} 题前，你犹豫了 ${st.maxDwellSec} 秒`);
      }
      setFacts(rows);
    }, 0);
    const done = () => { if (!doneRef.current) { doneRef.current = true; finish.current(); } };
    const end = setTimeout(done, reducedMotion ? 2000 : 3600);
    return () => { clearTimeout(t); clearTimeout(end); };
  }, [reducedMotion]);

  return (
    <div className="spell-root" style={{ pointerEvents: "none" }}>
      <div className="spell-clairvoy">
        <div className="spell-line">{line}</div>
        {facts.map((f, i) => (
          <div key={i} className="spell-clairvoy-fact" style={{ animationDelay: `${0.5 + i * 0.45}s` }}>
            {f}
          </div>
        ))}
      </div>
    </div>
  );
}
