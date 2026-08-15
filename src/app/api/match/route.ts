import { NextRequest, NextResponse } from "next/server";
import { match } from "@/lib/match";
import { matchRequestSchema } from "@/lib/schemas";
import { db } from "@/lib/db";
import { rateLimit } from "@/lib/rate-limit";
import { processAnswers } from "@/lib/answer-processor";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const rl = rateLimit(req, { id: "match", capacity: 20, refillPerSec: 0.5 });
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Rate limited" },
      { status: 429, headers: { "Retry-After": String(rl.retryAfter) } }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = matchRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.issues },
      { status: 400 }
    );
  }

  const { answers } = parsed.data;

  // Re-derive posture/path/keyUnlocked/tendency from DB — never trust the client.
  const optionIds = Array.from(new Set(answers.map((a) => a.optionId)));
  const options = await db.option.findMany({
    where: { id: { in: optionIds } },
    include: { question: { select: { id: true, dim: true, type: true, renderType: true } } },
  });

  const processed = processAnswers(answers, options);

  if (processed.validAnswers.length !== answers.length) {
    return NextResponse.json(
      { error: "Invalid answers" },
      { status: 400 }
    );
  }

  const result = match(
    {
      postureA: processed.postureA,
      postureB: processed.postureB,
      postureC: processed.postureC,
      path: processed.path,
      keyUnlocked: processed.keyUnlocked,
      tendency: processed.tendency,
    },
    await db.personalityType.findMany(),
  );

  return NextResponse.json(result);
}
