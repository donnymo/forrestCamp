import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { revokeTokens } from "@/server/mock/auth";
import { readJson } from "@/server/mock/http";

// Учебный рычаг: «протухнуть» access-токен (проверка автообновления)
// или всю сессию (проверка возврата на вход).
export async function POST(req: NextRequest) {
  const body = (await readJson(req)) as { mode?: unknown } | null;
  revokeTokens(req, body?.mode === "all" ? "all" : "access");
  return NextResponse.json({ ok: true });
}
