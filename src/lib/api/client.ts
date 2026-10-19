// Запросы из браузера. На 401 один раз пробуем обновить сессию через refresh-токен
// и повторяем исходный запрос; если не вышло — наружу уходит SessionExpiredError.

import { NetworkError, parseResponse } from "./errors.ts";
import type {
  Booking,
  CreateBookingRequest,
  QuoteRequest,
  QuoteResponse,
  User,
} from "./types.ts";

type RequestOptions = {
  method?: "GET" | "POST" | "DELETE";
  body?: unknown;
  headers?: Record<string, string>;
  /** Требует сессии: на 401 запускается обновление токена. */
  auth?: boolean;
};

const TIMEOUT_MS = 15_000;

let refreshInFlight: Promise<boolean> | null = null;

/** Параллельные 401 разделяют одну попытку обновления. */
export function refreshSession(): Promise<boolean> {
  refreshInFlight ??= fetch("/api/auth/refresh", { method: "POST" })
    .then((res) => res.ok)
    .catch(() => false)
    .finally(() => {
      refreshInFlight = null;
    });
  return refreshInFlight;
}

async function send(path: string, options: RequestOptions): Promise<Response> {
  try {
    return await fetch(path, {
      method: options.method ?? "GET",
      headers: {
        ...(options.body !== undefined ? { "Content-Type": "application/json" } : {}),
        ...options.headers,
      },
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
      signal: AbortSignal.timeout(TIMEOUT_MS),
      cache: "no-store",
    });
  } catch {
    throw new NetworkError();
  }
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  let res = await send(path, options);
  if (res.status === 401 && options.auth && (await refreshSession())) {
    res = await send(path, options);
  }
  return parseResponse<T>(res);
}

export const clientApi = {
  quote: (body: QuoteRequest) =>
    apiRequest<QuoteResponse>("/api/quote", { method: "POST", body }),

  me: () => apiRequest<{ user: User | null }>("/api/auth/me"),

  login: (email: string, password: string) =>
    apiRequest<{ user: User }>("/api/auth/login", { method: "POST", body: { email, password } }),

  logout: () => apiRequest<{ ok: true }>("/api/auth/logout", { method: "POST" }),

  createBooking: (body: CreateBookingRequest, idempotencyKey: string) =>
    apiRequest<{ booking: Booking }>("/api/bookings", {
      method: "POST",
      body,
      auth: true,
      headers: { "Idempotency-Key": idempotencyKey },
    }),

  payBooking: (id: string) =>
    apiRequest<{ booking: Booking }>(`/api/bookings/${encodeURIComponent(id)}/pay`, {
      method: "POST",
      auth: true,
    }),

  // Учебные рычаги для проверки сценариев 401.
  expireSession: (mode: "access" | "all") =>
    apiRequest<{ ok: true }>("/api/dev/session", { method: "POST", body: { mode } }),
};
