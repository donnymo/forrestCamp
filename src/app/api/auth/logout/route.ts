import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { clearSessionCookies, revokeTokens } from "@/server/mock/auth";

export async function POST(req: NextRequest) {
  revokeTokens(req, "all");
  const res = NextResponse.json({ ok: true });
  clearSessionCookies(res);
  return res;
}
