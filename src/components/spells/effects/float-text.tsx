"use client";

/**
 * spells/effects/float-text.tsx — 通用浮字演出（阶段 0 全员占位）
 *
 * 打字机浮字 + 微光淡出，reduced-motion 时整句直显 2s。
 * 每个能力后续替换为专属 Component 时，浮字仍是演出的收尾层——
 * 专属效果先演"现象"，浮字负责"台词"，互不冲突。
 */

import { useEffect, useRef, useState } from "react";

export default function FloatTextSpell({ line, reducedMotion, onDone }: {
  line: string; reducedMotion: boolean; onDone: () => void;
}) {
  const [shown, setShown] = useState(0);
  const doneRef = useRef(false);
  const finish = useRef(onDone);
  // ref 不在 render 期写入（react-hooks/refs）：effect 内同步
  useEffect(() => { finish.current = onDone; }, [onDone]);

  useEffect(() => {
    const done = () => { if (!doneRef.current) { doneRef.current = true; finish.current(); } };
    if (reducedMotion) {
      const t = setTimeout(done, 2000);
      return () => clearTimeout(t);
    }
    // 打字机：60ms/字，全文停留 2s 后回调卸载
    const type = setInterval(() => {
      setShown((n) => {
        if (n + 1 >= line.length) clearInterval(type);
        return n + 1;
      });
    }, 60);
    const total = line.length * 60 + 2000;
    const end = setTimeout(done, total);
    return () => { clearInterval(type); clearTimeout(end); };
  }, [line, reducedMotion]);

  const text = reducedMotion ? line : line.slice(0, shown);
  return (
    <div className="spell-root" style={{ pointerEvents: "none" }}>
      <div className="spell-line">
        {text}
        {!reducedMotion && <span className="spell-caret" aria-hidden="true" />}
      </div>
    </div>
  );
}
