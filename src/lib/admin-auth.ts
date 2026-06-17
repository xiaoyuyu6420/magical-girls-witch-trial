import { NextRequest, NextResponse } from "next/server";
import { createHash, timingSafeEqual } from "crypto";
import { verify } from "./jwt";

function safeEqual(a: string, b: string): boolean {
  const hashA = createHash("sha256").update(a).digest();
  const hashB = createHash("sha256").update(b).digest();
  if (hashA.length !== hashB.length) return false;
  return timingSafeEqual(hashA, hashB);
}

export function checkAdminAuth(req: NextRequest): NextResponse | null {
  // Prefer JWT token; fallback to password for legacy/transition
  const token = req.headers.get("x-admin-token");
  if (token) {
    const { valid } = verify(token);
    if (valid) return null;
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const pw = process.env.ADMIN_PASSWORD;
  const auth = req.headers.get("x-admin-password");
  if (!pw || !auth || !safeEqual(auth, pw)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return null;
}

export function checkAdminPassword(req: NextRequest): NextResponse | null {
  const pw = process.env.ADMIN_PASSWORD;
  const auth = req.headers.get("x-admin-password");
  if (!pw || !auth || !safeEqual(auth, pw)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return null;
}
