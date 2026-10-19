import "server-only";
import { cache } from "react";
import { cookies, headers } from "next/headers";
import { NetworkError, parseResponse } from "./errors.ts";
import { catalogSearchParams, rangeSearch } from "../domain/catalog.ts";
import type { CatalogQuery } from "../domain/catalog.ts";
import type { DateRange } from "../domain/dates.ts";
import { ACCESS_COOKIE, REFRESH_COOKIE, SCENARIO_COOKIE } from "./session.ts";
import type { Booking, CatalogPage, ItemDetail, ItemSummary } from "./types.ts";

// Запросы из серверных компонентов. Здесь нельзя записать cookie, поэтому 401 не
// обновляет сессию сам — страница рендерит <SessionRefresher/>, который сделает это в браузере.

const SESSION_COOKIES = [ACCESS_COOKIE, REFRESH_COOKIE];
const ALWAYS_FORWARDED = [SCENARIO_COOKIE];

async function baseUrl(): Promise<string> {
  if (process.env.API_URL) return process.env.API_URL.replace(/\/$/, "");
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? "http";
  return `${proto}://${host}`;
}

async function cookieHeader(withSession: boolean): Promise<string> {
  const store = await cookies();
  const names = withSession ? [...ALWAYS_FORWARDED, ...SESSION_COOKIES] : ALWAYS_FORWARDED;
  return store
    .getAll()
    .filter((c) => names.includes(c.name))
    .map((c) => `${c.name}=${encodeURIComponent(c.value)}`)
    .join("; ");
}

async function serverRequest<T>(path: string, { withSession = false } = {}): Promise<T> {
  const url = `${await baseUrl()}${path}`;
  let res: Response;
  try {
    res = await fetch(url, {
      cache: "no-store",
      headers: { cookie: await cookieHeader(withSession) },
      signal: AbortSignal.timeout(10_000),
    });
  } catch {
    throw new NetworkError("API недоступен");
  }
  return parseResponse<T>(res);
}

const itemCached = cache((id: string, from: string, to: string) =>
  serverRequest<ItemDetail>(`/api/items/${encodeURIComponent(id)}?${rangeSearch({ from, to })}`),
);

export const serverApi = {
  catalog: (query: CatalogQuery) =>
    serverRequest<CatalogPage>(`/api/items?${catalogSearchParams(query).toString()}`),

  // generateMetadata и страница просят одну и ту же карточку — один запрос на рендер.
  item: (id: string, range: DateRange) => itemCached(id, range.from, range.to),

  recommendations: (id: string, range: DateRange) =>
    serverRequest<{ items: ItemSummary[] }>(
      `/api/items/${encodeURIComponent(id)}/recommendations?${rangeSearch(range)}`,
    ),

  bookings: () => serverRequest<{ bookings: Booking[] }>("/api/bookings", { withSession: true }),

  booking: (id: string) =>
    serverRequest<{ booking: Booking }>(`/api/bookings/${encodeURIComponent(id)}`, {
      withSession: true,
    }),
};
