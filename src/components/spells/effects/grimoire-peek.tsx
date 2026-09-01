"use client";

/**
 * spells/effects/grimoire-peek.tsx — 见证账本（图鉴）
 *
 * 右下角一枚低透明度的 ✦ 装饰符，点击展开账本浮层：
 * 已见证的能力实名在册，未解锁的以 █████ 入册——收集闭环的实体。
 * 挂在 DirectorProvider 内，quiz / result 两舞台常驻。
 */

import { useState } from "react";
import { SPELLS } from "../registry";
import { useGrimoire } from "../useGrimoire";

export default function GrimoirePeek() {
  const [open, setOpen] = useState(false);
  const { data } = useGrimoire();
  const seenCount = SPELLS.filter((s) => data.seen[s.id]).length;

  return (
    <>
      <button
        type="button"
        className={`grimoire-fab ${open ? "is-open" : ""}`}
        aria-label="见证账本"
        onClick={() => setOpen((v) => !v)}
      >
        ✦
      </button>
      {open && (
        <div className="grimoire-panel" role="dialog" aria-label="见证账本">
          <div className="grimoire-head">
            <span className="grimoire-title">见证账本 · GRIMOIRE</span>
            <span className="grimoire-count">{seenCount} / {SPELLS.length}</span>
          </div>
          <div className="grimoire-list">
            {SPELLS.map((s) => {
              const seen = data.seen[s.id];
              return (
                <div key={s.id} className={`grimoire-row ${seen ? "is-seen" : ""}`}>
                  <span className="grimoire-ability">{seen ? s.ability : "█████"}</span>
                  <span className="grimoire-meta">{seen ? `${s.character} · ×${seen}` : "???"}</span>
                </div>
              );
            })}
          </div>
          <div className="grimoire-foot">与魔法少女的每一次擦肩，都会记在这里</div>
        </div>
      )}
    </>
  );
}
