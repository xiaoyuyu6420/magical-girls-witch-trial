import { createHmac, timingSafeEqual } from "crypto";

const JWT_SECRET = () => {
  const secret = process.env.JWT_SECRET || process.env.ADMIN_PASSWORD;
  if (!secret) throw new Error("JWT_SECRET or ADMIN_PASSWORD env var is required");
  return secret;
};

export function sign(payload: Record<string, unknown>, expiresInSeconds = 7200): string {
  const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
  const exp = Math.floor(Date.now() / 1000) + expiresInSeconds;
  const body = Buffer.from(JSON.stringify({ ...payload, exp, iat: Math.floor(Date.now() / 1000) })).toString("base64url");
  const signature = createHmac("sha256", JWT_SECRET()).update(`${header}.${body}`).digest("base64url");
  return `${header}.${body}.${signature}`;
}

export function verify(token: string): { payload: Record<string, unknown> | null; valid: boolean } {
  const parts = token.split(".");
  if (parts.length !== 3) return { payload: null, valid: false };
  const [header, body, signature] = parts;
  const expectedSig = createHmac("sha256", JWT_SECRET()).update(`${header}.${body}`).digest("base64url");
  if (!timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSig))) {
    return { payload: null, valid: false };
  }
  try {
    const payload = JSON.parse(Buffer.from(body, "base64url").toString()) as Record<string, unknown>;
    if (typeof payload.exp === "number" && payload.exp < Math.floor(Date.now() / 1000)) {
      return { payload: null, valid: false };
    }
    return { payload, valid: true };
  } catch {
    return { payload: null, valid: false };
  }
}
