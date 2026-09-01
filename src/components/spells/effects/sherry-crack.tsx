"use client";

/**
 * spells/effects/sherry-crack.tsx — 橘雪莉「怪力」：全屏碎裂
 *
 * 原理（GSAP 社区通行做法，无现成库）：
 * 1. html-to-image 把当前视口真实截屏
 * 2. 截图切成放射网格碎片，每块从点击点向外爆开、旋转、坠落
 * 3. 碎的是"页面本身"——碎片飞走后露出底下的真实页面，随后一切归位
 * 先以 SVG 裂纹作蓄力（150ms），随即爆裂。截屏失败（CORS 等）自动降级为纯裂纹。
 */

import { useEffect, useRef, useState } from "react";
import type { SpellProps } from "../types";

interface Piece {
  key: number;
  left: number; top: number; w: number; h: number;
  /** 截图裁剪偏移 */
  bx: number; by: number;
  /** 爆开位移 / 旋转 / 起爆延迟（距点击点越近越先爆） */
  dx: number; dy: number; rot: number; delay: number;
}

export default function SherryCrack({ line, reducedMotion, onDone, payload }: SpellProps) {
  const x = payload?.x ?? (typeof window !== "undefined" ? window.innerWidth / 2 : 0);
  const y = payload?.y ?? (typeof window !== "undefined" ? window.innerHeight / 2 : 0);
  const [shot, setShot] = useState<string | null>(null);
  const [pieces, setPieces] = useState<Piece[]>([]);
  const [phase, setPhase] = useState<"crack" | "done">("crack");
  const doneRef = useRef(false);
  const finish = useRef(onDone);
  useEffect(() => { finish.current = onDone; }, [onDone]);

  useEffect(() => {
    const done = () => { if (!doneRef.current) { doneRef.current = true; finish.current(); } };
    if (reducedMotion) { const t = setTimeout(done, 2000); return () => clearTimeout(t); }

    let cancelled = false;
    (async () => {
      try {
        // 动态加载：只有真触发演出时才下载这块代码
        const { toCanvas } = await import("html-to-image");
        const canvas = await toCanvas(document.body, {
          width: window.innerWidth, height: window.innerHeight, pixelRatio: 1,
        });
        if (cancelled) return;
        const url = canvas.toDataURL("image/png");
        setShot(url);

        // 放射网格碎片：位移方向 = 块中心相对点击点的向量。
        // 拳头感 = 快和狠：起爆延迟压到 0.05s 起、位移翻倍，不搞优雅散落
        const vw = window.innerWidth, vh = window.innerHeight;
        const cols = 8, rows = 5, w = vw / cols, h = vh / rows;
        const hyp = Math.hypot(vw, vh);
        const list: Piece[] = [];
        for (let r = 0; r < rows; r++) {
          for (let c = 0; c < cols; c++) {
            const cx = c * w + w / 2, cy = r * h + h / 2;
            const vec = { x: cx - x, y: cy - y };
            const dist = Math.hypot(vec.x, vec.y) || 1;
            const power = 150 + Math.random() * 230;
            list.push({
              key: r * cols + c,
              left: c * w, top: r * h, w: Math.ceil(w) + 1, h: Math.ceil(h) + 1,
              bx: -(c * w), by: -(r * h),
              dx: (vec.x / dist) * power,
              dy: (vec.y / dist) * power - 50 + Math.random() * 70,
              rot: (Math.random() - 0.5) * 160,
              delay: 0.05 + (dist / hyp) * 0.12 + Math.random() * 0.04,
            });
          }
        }
        setPieces(list);
      } catch {
        // 截屏失败（跨域污染等）：保持纯裂纹降级
      }
    })();

    const t1 = setTimeout(() => setPhase("done"), 1500);
    const t2 = setTimeout(done, 1900);
    return () => { cancelled = true; clearTimeout(t1); clearTimeout(t2); };
  }, [reducedMotion, x, y]);

  if (reducedMotion) {
    return (
      <div className="spell-root" style={{ pointerEvents: "none" }}>
        <div className="spell-line">{line}</div>
      </div>
    );
  }

  return (
    <div className="spell-root" style={{ pointerEvents: "none" }}>
      {/* 碎片层：截图块从点击点爆开（真实页面在下面静止不动，碎的是"表面"） */}
      {shot && pieces.map((p) => (
        <div
          key={p.key}
          className="spell-shard"
          aria-hidden="true"
          style={{
            left: p.left, top: p.top, width: p.w, height: p.h,
            backgroundImage: `url(${shot})`,
            backgroundPosition: `${p.bx}px ${p.by}px`,
            ["--dx" as string]: `${p.dx}px`,
            ["--dy" as string]: `${p.dy}px`,
            ["--rot" as string]: `${p.rot}deg`,
            animationDelay: `${0.18 + p.delay}s`,
          }}
        />
      ))}
      {phase === "crack" && <div className="spell-shard-flash" aria-hidden="true" />}
      <div className="spell-line">{line}</div>
    </div>
  );
}
