import { NextRequest, NextResponse } from "next/server";
import { createHash, timingSafeEqual } from "crypto";
import { verify } from "./lib/jwt";

function safeEqual(a: string, b: string): boolean {
  const hashA = createHash("sha256").update(a).digest();
  const hashB = createHash("sha256").update(b).digest();
  if (hashA.length !== hashB.length) return false;
  return timingSafeEqual(hashA, hashB);
}

const adminAttempts = new Map<string, { count: number; lastAttempt: number }>();
const ADMIN_RATE_LIMIT = 10;
const ADMIN_RATE_WINDOW = 60 * 1000;

// Cleanup old admin rate-limit entries every minute
setInterval(() => {
  const cutoff = Date.now() - ADMIN_RATE_WINDOW;
  for (const [ip, entry] of adminAttempts) {
    if (entry.lastAttempt < cutoff) adminAttempts.delete(ip);
  }
}, 60 * 1000);

function isAdminRateLimited(ip: string): boolean {
  const entry = adminAttempts.get(ip);
  if (!entry) return false;
  if (Date.now() - entry.lastAttempt > ADMIN_RATE_WINDOW) {
    adminAttempts.delete(ip);
    return false;
  }
  return entry.count >= ADMIN_RATE_LIMIT;
}

function recordAdminAttempt(ip: string) {
  const entry = adminAttempts.get(ip);
  if (!entry || Date.now() - entry.lastAttempt > ADMIN_RATE_WINDOW) {
    adminAttempts.set(ip, { count: 1, lastAttempt: Date.now() });
  } else {
    entry.count++;
    entry.lastAttempt = Date.now();
  }
}

function getClientIp(req: NextRequest): string {
  const forwarded = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  if (forwarded) return forwarded;
  return req.headers.get("x-real-ip") ?? "unknown";
}

export function proxy(req: NextRequest) {
  if (req.nextUrl.pathname.startsWith("/api/admin")) {
    // CSRF protection: reject cross-origin requests to admin endpoints
    const origin = req.headers.get("origin");
    const host = req.headers.get("host") || req.nextUrl.host;
    if (origin && !origin.includes(host)) {
      return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
    }

    const ip = getClientIp(req);

    if (isAdminRateLimited(ip)) {
      return NextResponse.json({ error: "Too many attempts" }, { status: 429 });
    }

    // Prefer JWT token; fallback to password
    const token = req.headers.get("x-admin-token");
    if (token) {
      const { valid } = verify(token);
      if (valid) return NextResponse.next();
      recordAdminAttempt(ip);
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const auth = req.headers.get("x-admin-password");
    const expected = process.env.ADMIN_PASSWORD;
    if (!auth || !expected || !safeEqual(auth, expected)) {
      recordAdminAttempt(ip);
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }
  return NextResponse.next();
}

export const config = { matcher: "/api/admin/:path*" };
