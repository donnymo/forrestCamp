// Слой запросов различает причины сбоя, потому что у каждой свой путь восстановления:
//   NetworkError        — запрос не дошёл (нет сети, таймаут): повторить;
//   ServiceError        — API ответил 5xx: временный сбой, повторить позже;
//   ValidationError     — 400/422: показать ошибки у полей;
//   SessionExpiredError — 401 и обновить сессию не вышло: на вход;
//   ConflictError       — 409: данные изменились, выделить позиции и пересчитать;
//   NotFoundError       — 404: показать «не найдено»;
//   PaymentError        — 402: имитация оплаты отклонена, бронь и корзина целы, повторить.

import type { AvailabilityInfo } from "../cart/model.ts";
import type { ApiErrorBody } from "./types.ts";

export class ApiError extends Error {
  readonly status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = new.target.name;
    this.status = status;
  }
  /** Имеет ли смысл просто повторить тот же запрос. */
  get retryable(): boolean {
    return false;
  }
}

export class NetworkError extends ApiError {
  constructor(message = "Не удалось связаться с сервером. Проверьте подключение.") {
    super(message, 0);
  }
  get retryable() {
    return true;
  }
}

export class ServiceError extends ApiError {
  get retryable() {
    return true;
  }
}

export class ValidationError extends ApiError {
  readonly fields: Record<string, string>;
  constructor(message: string, status: number, fields: Record<string, string> = {}) {
    super(message, status);
    this.fields = fields;
  }
}

export class SessionExpiredError extends ApiError {
  constructor(message = "Сессия истекла. Войдите снова.") {
    super(message, 401);
  }
}

export class ConflictError extends ApiError {
  readonly items: AvailabilityInfo[];
  constructor(message: string, items: AvailabilityInfo[]) {
    super(message, 409);
    this.items = items;
  }
}

export class NotFoundError extends ApiError {}

export class PaymentError extends ApiError {
  get retryable() {
    return true;
  }
}

export function isRetryable(error: unknown): boolean {
  return error instanceof ApiError && error.retryable;
}

/** Превращает HTTP-ответ в данные или в типизированную ошибку. */
export async function parseResponse<T>(res: Response): Promise<T> {
  if (res.ok) return (await res.json()) as T;

  let body: ApiErrorBody | null = null;
  try {
    body = (await res.json()) as ApiErrorBody;
  } catch {
    // Тело не JSON (например, страница прокси) — опираемся на статус.
  }
  const message = body?.error?.message ?? `HTTP ${res.status}`;

  switch (res.status) {
    case 400:
    case 422:
      return Promise.reject(new ValidationError(message, res.status, body?.error?.fields));
    case 401:
      return Promise.reject(new SessionExpiredError(message));
    case 402:
      return Promise.reject(new PaymentError(message, 402));
    case 404:
      return Promise.reject(new NotFoundError(message, 404));
    case 409:
      return Promise.reject(new ConflictError(message, body?.error?.items ?? []));
    default:
      if (res.status >= 500) return Promise.reject(new ServiceError(message, res.status));
      return Promise.reject(new ApiError(message, res.status));
  }
}
