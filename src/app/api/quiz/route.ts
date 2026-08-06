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
      const options =
        pack.rules.optionShuffle === "stable-by-question-id" && q.type === "normal"
          ? shuffleOptionsStable(q.id, rawOptions)
          : rawOptions;
      return {
        id: q.id,
        dim: q.dim,
        text: q.text,
        order: q.order,
        type: q.type,
        meta: q.meta || "",
        translations: q.translations,
        options,
      };
    }),
  });
}
