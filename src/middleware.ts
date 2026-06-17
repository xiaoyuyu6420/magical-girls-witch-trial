import { NextRequest } from "next/server";
import { proxy } from "./proxy";

export function middleware(req: NextRequest) {
  return proxy(req);
}

export const config = {
  matcher: "/api/admin/:path*",
};
