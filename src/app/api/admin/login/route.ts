import { NextRequest, NextResponse } from "next/server";
import { checkAdminPassword } from "@/lib/admin-auth";
import { sign } from "@/lib/jwt";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const authErr = checkAdminPassword(req);
  if (authErr) return authErr;
  const token = sign({ role: "admin" }, 7200); // 2 hours
  return NextResponse.json({ token });
}
