"use client";

/**
 * spells/effects/margo-imitation.tsx — 宝生玛格「模仿」
 *
 * 元彩蛋：随机"模仿"另一个能力的演出，但整体色调偏紫（模仿的破绽）。
 * 被模仿者由 Director 在调度时注入 payload.imitateId（排除玛格自身）。
 * 找不到目标时退化为浮字。
 */

import { useEffect, useRef, useState } from "react";
import type { SpellProps } from "../types";
import { SPELLS } from "../registry";

export default function MargoImitation({ line, reducedMotion, onDone, payload }: SpellProps) {
  const target = SPELLS.find((sp) => sp.id === payload?.imitateId && sp.id !== "margo-imitation");
  const doneRef = useRef(false);
  const finish = useRef(onDone);
  useEffect(() => { finish.current = onDone; }, [onDone]);

  useEffect(() => {
    const done = () => { if (!doneRef.current) { doneRef.current = true; finish.current(); } };
    const t = setTimeout(done, reducedMotion ? 2000 : 3800);
    return () => clearTimeout(t);
  }, [reducedMotion]);

  // 没有可模仿对象：退化为浮字
  if (!target) {
    return (
      <div className="spell-root" style={{ pointerEvents: "none" }}>
        <div className="spell-line">{line}</div>
      </div>
    );
  }

  const Imitated = target.Component;
  return (
    <div className="spell-root" style={{ pointerEvents: "none" }}>
      {!reducedMotion && (
        <div
          className="spell-mimic-badge"
          aria-hidden="true"
        >
          MIMICRY
        </div>
      )}
      {/* 紫色偏移 = 模仿的破绽：原版能力不会带这层滤镜 */}
      <div style={{ filter: reducedMotion ? "none" : "hue-rotate(45deg) saturate(1.25)" }}>
        <Imitated
          line={target.line}
          reducedMotion={reducedMotion}
          onDone={() => finish.current()}
          payload={target.stage === "quiz" ? { x: payload?.x, y: payload?.y } : undefined}
        />
      </div>
    </div>
  );
}
