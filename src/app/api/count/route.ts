import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { rateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

// Base offset so the count starts around 3000
const BASE_COUNT = 2974;

export async function GET(req: NextRequest) {
  const rl = rateLimit(req, { id: "count", capacity: 30, refillPerSec: 1 });
  if (!rl.ok) {
    return NextResponse.json({ error: "Rate limited" }, { status: 429, headers: { "Retry-After": String(rl.retryAfter) } });
  }

  try {
    const real = await db.testRecord.count();
    return NextResponse.json({ total: BASE_COUNT + real });
  } catch {
    return NextResponse.json({ total: BASE_COUNT });
  }
}
