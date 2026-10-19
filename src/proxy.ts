import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { REFRESH_COOKIE } from "@/lib/api/session";

/**
 * Оптимистичная проверка входа для личных страниц: без refresh-cookie сразу на /login
 * с возвратом обратно. Это не авторизация — её делает API (401), а страницы на 401
 * обновляют сессию через SessionRefresher. Здесь только быстрый редирект без рендера.
 */
export function proxy(request: NextRequest) {
  if (request.cookies.has(REFRESH_COOKIE)) return NextResponse.next();
  const { pathname, search } = request.nextUrl;
  const login = new URL("/login", request.url);
  login.searchParams.set("next", pathname + search);
  return NextResponse.redirect(login);
}

export const config = {
  matcher: ["/account/:path*", "/checkout"],
};
