import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { db } from "@/server/mock/store";
import { issueTokens, publicUser } from "@/server/mock/auth";
import { apiError, delay, readJson } from "@/server/mock/http";

export async function POST(req: NextRequest) {
  await delay(400);
  const body = (await readJson(req)) as { email?: unknown; password?: unknown } | null;
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body?.password === "string" ? body.password : "";
  if (!email || !password) {
    return apiError(422, "validation_error", "Введите почту и пароль", {
      fields: {
        ...(email ? {} : { email: "Введите почту" }),
        ...(password ? {} : { password: "Введите пароль" }),
      },
    });
  }
  const user = db().users.find((u) => u.email === email && u.password === password);
  if (!user) {
    return apiError(422, "validation_error", "Неверная почта или пароль", {
      fields: { password: "Неверная почта или пароль" },
    });
  }
  const res = NextResponse.json({ user: publicUser(user.id) });
  issueTokens(res, user.id);
  return res;
}
