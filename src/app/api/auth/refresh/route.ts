import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { clearSessionCookies, rotateTokens } from "@/server/mock/auth";
import { apiError, delay } from "@/server/mock/http";

// POST /api/auth/refresh — новая пара токенов по refresh-cookie.
export async function POST(req: NextRequest) {
  await delay(200);
  const res = NextResponse.json({ ok: true });
  const user = rotateTokens(req, res);
  if (!user) {
    const fail = apiError(401, "unauthorized", "Сессия истекла, войдите снова");
    clearSessionCookies(fail);
    return fail;
  }
  return res;
}
