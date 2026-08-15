import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { rateLimit } from "@/lib/rate-limit";
import { getActivePack } from "@/pack/load";
import { shuffleOptionsStable } from "@/pack/shuffle";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const rl = rateLimit(req, { id: "quiz", capacity: 20, refillPerSec: 0.5 });
  if (!rl.ok) {
    return NextResponse.json({ error: "Rate limited" }, { status: 429, headers: { "Retry-After": String(rl.retryAfter) } });
  }

  const pack = getActivePack();

  const [questions, types] = await Promise.all([
    db.question.findMany({ orderBy: { order: "asc" }, include: { options: true } }),
    db.personalityType.findMany({ orderBy: { id: "asc" } }),
  ]);

  return NextResponse.json({
    packId: pack.id,
    packVersion: pack.version,
    // Only expose render-essential dimension fields.
    // `dir` (e.g. "L=宽容 → H=严苛") leaks the scoring direction per dimension —
    // a single GET would let any user infer "high score = harsh", defeating R1.
    // `model`/`modelName` are internal grouping used server-side only.
    dimensions: pack.dimensions.map((d) => ({ code: d.code, name: d.name })),
    // weights intentionally omitted from public quiz payload (not needed to render)
    types,
    questions: questions.map((q) => {
      const rawOptions = q.options.map((o) => (
        q.type === "gate"
          ? { id: o.id, label: o.label, value: o.value ?? null }
          : { id: o.id, label: o.label }
      ));
      // optionShuffle 只对"普通 normal 题"生效；scale/weight 变奏题的 label 顺序
      // 携带语义（weight::a|b|c 编码、scale 的左右对峙），洗牌会破坏前端映射。
      const renderType = (q as { renderType?: string }).renderType ?? "normal";
      const shuffleable = pack.rules.optionShuffle === "stable-by-question-id"
        && q.type === "normal" && renderType === "normal";
      // IM6 诊断（2026-08-13）：shuffle 种子不能用自增 id —— FORCE_RESEED 每次
      // deleteMany+create 后 SQLite AUTOINCREMENT 不重置，q.id 跨 seed 递增，
      // 导致"stable"洗牌跨部署/reseed 输出不同选项顺序 → 视觉基线漂移 + E2E 角色漂移。
      // 改用业务 order（seed 内唯一、跨 seed 稳定）。
      const options = shuffleable ? shuffleOptionsStable(q.order ?? q.id, rawOptions) : rawOptions;
      return {
        id: q.id,
        dim: q.dim,
        text: q.text,
        order: q.order,
        type: q.type,
        renderType,
        meta: q.meta || "",
        translations: q.translations,
        options,
      };
    }),
  });
}
