import "server-only";
import type { NextRequest, NextResponse } from "next/server";
import { ACCESS_COOKIE, REFRESH_COOKIE } from "@/lib/api/session";
import type { User } from "@/lib/api/types";
import { db } from "./store";

// Короткий access-токен, чтобы сценарий «истёк → обновили» случался и без кнопок.
const ACCESS_TTL_MS = 5 * 60 * 1000;
const REFRESH_TTL_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * Флаги cookie сессии. Secure — только в продакшене: dev-сервер работает по http.
 * Удаление идёт с теми же флагами: браузер не даст «небезопасному» Set-Cookie
 * перезаписать Secure-cookie, и выход из аккаунта молча не сработал бы.
 */
const SESSION_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
};

export function publicUser(userId: string): User | null {
  const user = db().users.find((u) => u.id === userId);
  if (!user) return null;
  return { id: user.id, name: user.name, email: user.email, phone: user.phone };
}

function validSession(map: Map<string, { userId: string; expiresAt: number }>, token?: string) {
  if (!token) return null;
  const session = map.get(token);
  if (!session) return null;
  if (session.expiresAt < Date.now()) {
    map.delete(token);
    return null;
  }
  return session;
}

/** Пользователь по access-токену. null → ответ 401. */
export function authenticate(req: NextRequest): User | null {
  const session = validSession(db().accessTokens, req.cookies.get(ACCESS_COOKIE)?.value);
  return session ? publicUser(session.userId) : null;
}

/** Пользователь по refresh-токену — «есть ли вообще сессия». */
export function sessionUser(req: NextRequest): User | null {
  const session = validSession(db().refreshTokens, req.cookies.get(REFRESH_COOKIE)?.value);
  return session ? publicUser(session.userId) : null;
}

export function issueTokens(res: NextResponse, userId: string): void {
  const access = crypto.randomUUID();
  const refresh = crypto.randomUUID();
  const now = Date.now();
  db().accessTokens.set(access, { userId, expiresAt: now + ACCESS_TTL_MS });
  db().refreshTokens.set(refresh, { userId, expiresAt: now + REFRESH_TTL_MS });
  res.cookies.set(ACCESS_COOKIE, access, { ...SESSION_COOKIE_OPTIONS, maxAge: ACCESS_TTL_MS / 1000 });
  res.cookies.set(REFRESH_COOKIE, refresh, { ...SESSION_COOKIE_OPTIONS, maxAge: REFRESH_TTL_MS / 1000 });
}

/** Ротация: старый refresh-токен одноразовый. */
export function rotateTokens(req: NextRequest, res: NextResponse): User | null {
  const token = req.cookies.get(REFRESH_COOKIE)?.value;
  const session = validSession(db().refreshTokens, token);
  if (!session || !token) return null;
  db().refreshTokens.delete(token);
  issueTokens(res, session.userId);
  return publicUser(session.userId);
}

/**
 * Отзывает токены на сервере. Cookie при этом остаются в браузере — так ведёт себя
 * реально истёкшая сессия: клиент шлёт токен и получает 401.
 */
export function revokeTokens(req: NextRequest, which: "access" | "all"): void {
  const access = req.cookies.get(ACCESS_COOKIE)?.value;
  if (access) db().accessTokens.delete(access);
  if (which === "all") {
    const refresh = req.cookies.get(REFRESH_COOKIE)?.value;
    if (refresh) db().refreshTokens.delete(refresh);
  }
}

export function clearSessionCookies(res: NextResponse): void {
  res.cookies.set(ACCESS_COOKIE, "", { ...SESSION_COOKIE_OPTIONS, maxAge: 0 });
  res.cookies.set(REFRESH_COOKIE, "", { ...SESSION_COOKIE_OPTIONS, maxAge: 0 });
}
