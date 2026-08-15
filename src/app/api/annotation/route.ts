import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { processAnswers } from "@/lib/answer-processor";
import { pickAnnotation, ANNOTATION_FALLBACKS } from "@/lib/annotations";
import { rateLimit } from "@/lib/rate-limit";
import type { AnnotationNode } from "@/lib/annotations";

export const dynamic = "force-dynamic";

/** 请求体：用户当前的 answers 数组 */
interface AnnotationBody {
  answers: { questionId: number; optionId: number }[];
}

export async function POST(req: NextRequest) {
  const rl = rateLimit(req, { id: "annotation", capacity: 30, refillPerSec: 1 });
  if (!rl.ok) {
    return NextResponse.json({ error: "Rate limited" }, { status: 429, headers: { "Retry-After": String(rl.retryAfter) } });
  }

  // 解析 node 参数
  const nodeParam = req.nextUrl.searchParams.get("node");
  const node = Number(nodeParam);
  if (node !== 5 && node !== 10 && node !== 15) {
    return NextResponse.json({ error: "Invalid node; must be 5, 10, or 15" }, { status: 400 });
  }

  // 解析 body
  let body: AnnotationBody;
  try {
    const parsed = await req.json();
    if (!Array.isArray(parsed?.answers)) {
      return NextResponse.json({ error: "answers must be an array" }, { status: 400 });
    }
    body = parsed as AnnotationBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const answers = body.answers;
  if (answers.length === 0) {
    // 没有 answers，返回 fallback
    return NextResponse.json({ text: ANNOTATION_FALLBACKS[node as AnnotationNode] });
  }

  try {
    // 从 DB 读 options（服务端防篡改路径——score 不在客户端）
    const optionIds = Array.from(new Set(answers.map((a) => a.optionId)));
    const options = await db.option.findMany({
      where: { id: { in: optionIds } },
      include: { question: { select: { id: true, dim: true, type: true, renderType: true } } },
    });

    const processed = processAnswers(answers, options);

    // 使用确定性 rng（基于 node + answer hash，避免同一用户每次刷新看到不同文案）
    const answerHash = answers.reduce((h, a) => h ^ (a.optionId * 31 + a.questionId), 0);
    const seed = node * 1000 + (Math.abs(answerHash) % 1000);
    let rngState = seed;
    const rng = () => {
      rngState = (rngState * 16807) % 2147483647;
      return rngState / 2147483647;
    };

    const text = pickAnnotation(node as AnnotationNode, processed.postureA, processed.postureB, processed.postureC, rng);
    return NextResponse.json({ text });
  } catch (err) {
    console.error("Annotation error:", err);
    // fallback
    return NextResponse.json({ text: ANNOTATION_FALLBACKS[node as AnnotationNode] });
  }
}
