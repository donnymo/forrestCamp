import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { sessionUser } from "@/server/mock/auth";

// GET /api/auth/me — есть ли живая сессия (по refresh-токену). Всегда 200.
export async function GET(req: NextRequest) {
  return NextResponse.json({ user: sessionUser(req) });
}
