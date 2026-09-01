"use client";

/**
 * not-found.tsx — 404「结界受损」× 梅露露「治疗」
 *
 * 每次访问本页，治愈进度 +1（localStorage: witch-trial-404-heal）：
 *   1 → 结界全裂      2 → 裂纹过半，柔光初现
 *   3 → 大部分愈合，「伤口，会好的。」
 *   4+ → 完全痊愈：「……不过这里本来就没有路。我送你回去吧。」
 * 把 404 的挫败体验做成梅露露能力的舞台：用户"重试"的过程就是治疗的过程。
 */

import { useEffect, useState } from "react";

const HEAL_KEY = "witch-trial-404-heal";

export default function NotFound() {
  const [level, setLevel] = useState(0); // 0 = 尚未读账（首帧按全裂渲染避免闪烁）

  useEffect(() => {
    // 异步读账（规避 effect 内同步 setState 的 lint 规则）
    const t = setTimeout(() => {
      const n = parseInt(localStorage.getItem(HEAL_KEY) ?? "0", 10) + 1;
      try { localStorage.setItem(HEAL_KEY, String(n)); } catch { /* ignore */ }
      setLevel(Math.min(n, 4));
    }, 0);
    return () => clearTimeout(t);
  }, []);

  const healed = level >= 4;
  const showCracks = (group: 1 | 2 | 3) => level === 0 || level >= group + 1 || healed === false && level > group;

  return (
    <div className="nf-root">
      <style>{`
        .nf-root { min-height: 100dvh; display: flex; align-items: center; justify-content: center;
          background: radial-gradient(ellipse at 50% 40%, #17121e 0%, #0a0709 55%, #030303 100%);
          color: #EFEFEF; font-family: 'Noto Serif SC', serif; position: relative; overflow: hidden; }
        .nf-frame { position: absolute; inset: 34px; border: 1px solid rgba(212,175,55,.5); }
        .nf-frame::before { content: ''; position: absolute; inset: 9px; border: 1px solid rgba(212,175,55,.2); }
        .nf-stack { text-align: center; position: relative; z-index: 2; max-width: min(40em, 88vw); }
        .nf-code { font-family: Georgia, serif; font-size: clamp(4rem, 12vw, 7rem); letter-spacing: .18em;
          color: rgba(239,239,239,.92); line-height: 1; }
        .nf-title { margin-top: 1.4rem; font-size: clamp(1rem, 2.4vw, 1.3rem); letter-spacing: .3em; color: #d4af37; }
        .nf-sub { margin-top: 1.1rem; font-size: .92rem; line-height: 2; color: rgba(239,239,239,.6); }
        .nf-sub.is-heal { color: rgba(190,230,200,.85); }
        .nf-badge { margin-top: 1.6rem; font-family: 'Space Mono', monospace; font-size: .6rem;
          letter-spacing: .4em; color: rgba(212,175,55,.55); }
        .nf-actions { margin-top: 2rem; display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap; }
        .nf-btn { font-family: 'Noto Serif SC', serif; font-size: .82rem; letter-spacing: .3em;
          padding: .7rem 1.6rem; cursor: pointer; border-radius: 2px;
          border: 1px solid rgba(212,175,55,.35); background: none; color: rgba(239,239,239,.75);
          transition: all .25s ease; }
        .nf-btn:hover { border-color: rgba(212,175,55,.8); color: #fff; }
        .nf-btn.is-primary { border-color: rgba(212,175,55,.85); color: #d4af37; }
        .nf-btn.is-primary:hover { background: rgba(212,175,55,.12); }
        .nf-cracks { position: absolute; inset: 0; z-index: 1; pointer-events: none;
          transition: opacity 1.2s ease; }
        .nf-cracks path { stroke: rgba(239,239,239,.28); fill: none; stroke-linecap: round; }
        .nf-heal-light { position: absolute; left: 50%; top: 50%; width: 60vmin; height: 60vmin;
          transform: translate(-50%, -50%); border-radius: 50%;
          background: radial-gradient(circle, rgba(190,230,200,.14) 0%, transparent 65%);
          pointer-events: none; }
      `}</style>

      <div className="nf-frame" />
      {/* 裂纹三组：治愈进度越高，剩得越少 */}
      <svg className="nf-cracks" viewBox="0 0 1000 800" preserveAspectRatio="none"
        style={{ opacity: healed ? 0 : 1 }} aria-hidden="true">
        <g style={{ opacity: level <= 2 ? 1 : 0.35 }}>
          <path strokeWidth="2" d="M120,80 L210,190 L190,320 L280,470 L260,640" />
          <path strokeWidth="1" d="M210,190 L300,150 M190,320 L120,380" />
        </g>
        <g style={{ opacity: level <= 1 ? 1 : 0 }}>
          <path strokeWidth="2" d="M880,60 L800,200 L830,360 L740,520 L780,700" />
          <path strokeWidth="1" d="M800,200 L720,170 M830,360 L910,420" />
        </g>
        <g style={{ opacity: level === 0 ? 1 : 0 }}>
          <path strokeWidth="1.5" d="M340,120 L420,260 L560,300 L700,240" />
          <path strokeWidth="1.5" d="M480,760 L460,620 L560,540" />
          <path strokeWidth="1" d="M420,260 L400,380 M560,300 L580,420" />
        </g>
      </svg>
      {level >= 3 && <div className="nf-heal-light" />}

      <div className="nf-stack">
        <div className="nf-code">404</div>
        <div className="nf-title">该页已被审判。罪名：不存在。</div>
        <div className={`nf-sub ${healed ? "is-heal" : ""}`}>
          {healed
            ? "伤口已经好了。……不过这里本来就没有路。我送你回去吧。"
            : level >= 3
              ? "伤口，会好的。"
              : level === 2
                ? "裂纹在光里一点点愈合。再试一次，也许就好了。"
                : "结界受损——但有什么东西，正在试图修复它。"}
        </div>
        <div className="nf-badge">✦ 梅露露的治疗 · MERURU</div>
        <div className="nf-actions">
          <button type="button" className="nf-btn" onClick={() => window.location.reload()}>
            再次受审
          </button>
          <a href="/" className={`nf-btn ${healed ? "is-primary" : ""}`} style={{ textDecoration: "none" }}>
            返回审判庭
          </a>
        </div>
      </div>
    </div>
  );
}
