// Явная модель корзины: состояние + действия + чистый редьюсер + селекторы.
// Итоговая сумма нигде не хранится — она всегда выводится из состояния через
// computeTotals, поэтому после любого действия считается одинаково.

import { rentalDays, sameRange } from "../domain/dates.ts";
import type { DateRange } from "../domain/dates.ts";
import { computeTotals, NO_SERVICES } from "../domain/pricing.ts";
import type { ServiceId, ServiceSelection, Totals } from "../domain/pricing.ts";

export const MAX_QTY_PER_LINE = 10;

export type CartLine = {
  itemId: string;
  title: string;
  category: string;
  pricePerDay: number;
  deposit: number;
  qty: number;
  /** Сколько свободно на даты корзины по последнему ответу API; null — ещё не проверяли. */
  available: number | null;
};

/**
 * fresh — цены и наличие подтверждены API для текущих дат и состава;
 * stale — что-то изменилось, нужен пересчёт перед оформлением.
 */
export type CartStatus = "fresh" | "stale";

export type CartState = {
  range: DateRange | null;
  lines: CartLine[];
  services: ServiceSelection;
  status: CartStatus;
  /** Позиции, которые API отверг при подтверждении (ответ 409). */
  conflicts: string[];
};

export type AvailabilityInfo = { itemId: string; available: number };

export type QuoteLine = {
  itemId: string;
  title: string;
  pricePerDay: number;
  deposit: number;
  available: number;
};

export type CartAction =
  | { type: "hydrate"; state: CartState }
  | {
      type: "add";
      range: DateRange;
      item: Omit<CartLine, "qty">;
      qty?: number;
    }
  | { type: "remove"; itemId: string }
  | { type: "setQty"; itemId: string; qty: number }
  | { type: "setRange"; range: DateRange }
  | { type: "toggleService"; service: ServiceId; enabled: boolean }
  /** Результат пересчёта на сервере: актуальные цены и остатки. */
  | { type: "recalculated"; range: DateRange; lines: QuoteLine[] }
  /** Ответ 409 при подтверждении. */
  | { type: "conflict"; items: AvailabilityInfo[] }
  /** Убрать недоступное: удалить позиции с нулём, остальные урезать до остатка. */
  | { type: "dropUnavailable" }
  | { type: "clear" };

export const emptyCart: CartState = {
  range: null,
  lines: [],
  services: NO_SERVICES,
  status: "fresh",
  conflicts: [],
};

function clampQty(qty: number, available: number | null): number {
  const cap = Math.min(MAX_QTY_PER_LINE, available ?? MAX_QTY_PER_LINE);
  return Math.max(1, Math.min(Math.floor(qty), cap));
}

export function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case "hydrate":
      return action.state;

    case "add": {
      const rangeChanged = !sameRange(state.range, action.range);
      // Даты едины для всей корзины: добавление с другими датами переносит всю корзину
      // на новый период (UI заранее спрашивает подтверждение) и требует пересчёта.
      const lines = rangeChanged
        ? state.lines.map((l) => ({ ...l, available: null }))
        : state.lines;
      const existing = lines.find((l) => l.itemId === action.item.itemId);
      const addQty = action.qty ?? 1;
      const nextLines = existing
        ? lines.map((l) =>
            l.itemId === action.item.itemId
              ? { ...l, ...action.item, qty: clampQty(l.qty + addQty, action.item.available) }
              : l,
          )
        : [...lines, { ...action.item, qty: clampQty(addQty, action.item.available) }];
      return {
        ...state,
        range: action.range,
        lines: nextLines,
        status: rangeChanged && state.lines.length > 0 ? "stale" : state.status,
        conflicts: state.conflicts.filter((id) => id !== action.item.itemId),
      };
    }

    case "remove": {
      const lines = state.lines.filter((l) => l.itemId !== action.itemId);
      return {
        ...state,
        lines,
        range: lines.length === 0 ? null : state.range,
        status: lines.length === 0 ? "fresh" : state.status,
        conflicts: state.conflicts.filter((id) => id !== action.itemId),
      };
    }

    case "setQty":
      return {
        ...state,
        lines: state.lines.map((l) =>
          l.itemId === action.itemId ? { ...l, qty: clampQty(action.qty, l.available) } : l,
        ),
      };

    case "setRange":
      if (sameRange(state.range, action.range)) return state;
      return {
        ...state,
        range: action.range,
        lines: state.lines.map((l) => ({ ...l, available: null })),
        status: state.lines.length > 0 ? "stale" : "fresh",
        conflicts: [],
      };

    case "toggleService":
      return { ...state, services: { ...state.services, [action.service]: action.enabled } };

    case "recalculated": {
      // Ответ на устаревшие даты (пользователь успел их сменить) игнорируем.
      if (!sameRange(state.range, action.range)) return state;
      const byId = new Map(action.lines.map((l) => [l.itemId, l]));
      return {
        ...state,
        lines: state.lines.map((l) => {
          const quote = byId.get(l.itemId);
          if (!quote) return l;
          return {
            ...l,
            title: quote.title,
            pricePerDay: quote.pricePerDay,
            deposit: quote.deposit,
            available: quote.available,
          };
        }),
        status: "fresh",
        conflicts: state.conflicts.filter((id) => {
          const quote = byId.get(id);
          const line = state.lines.find((l) => l.itemId === id);
          return quote && line ? quote.available < line.qty : false;
        }),
      };
    }

    case "conflict": {
      const byId = new Map(action.items.map((i) => [i.itemId, i.available]));
      return {
        ...state,
        lines: state.lines.map((l) =>
          byId.has(l.itemId) ? { ...l, available: byId.get(l.itemId)! } : l,
        ),
        conflicts: action.items.map((i) => i.itemId),
        status: "stale",
      };
    }

    case "dropUnavailable": {
      const lines = state.lines
        .filter((l) => l.available === null || l.available > 0)
        .map((l) => (l.available !== null && l.qty > l.available ? { ...l, qty: l.available } : l));
      return {
        ...state,
        lines,
        range: lines.length === 0 ? null : state.range,
        conflicts: [],
        status: lines.length === 0 ? "fresh" : "stale",
      };
    }

    case "clear":
      return emptyCart;
  }
}

// ——— Селекторы ———

export function selectTotals(state: CartState): Totals {
  const days = state.range ? rentalDays(state.range) : 0;
  return computeTotals(state.lines, days, state.services);
}

export function selectItemCount(state: CartState): number {
  return state.lines.reduce((acc, l) => acc + l.qty, 0);
}

/** Позиции, которых не хватает на выбранные даты. */
export function selectShortages(state: CartState): CartLine[] {
  return state.lines.filter((l) => l.available !== null && l.qty > l.available);
}

export type CheckoutBlocker = "empty" | "no_dates" | "stale" | "shortage" | null;

export function selectCheckoutBlocker(state: CartState): CheckoutBlocker {
  if (state.lines.length === 0) return "empty";
  if (!state.range) return "no_dates";
  if (selectShortages(state).length > 0 || state.conflicts.length > 0) return "shortage";
  if (state.status === "stale") return "stale";
  return null;
}

/** Отпечаток содержимого заказа — для ключа идемпотентности. */
export function cartFingerprint(state: CartState): string {
  return JSON.stringify({
    range: state.range,
    lines: state.lines.map((l) => [l.itemId, l.qty]).sort(),
    services: state.services,
  });
}

/** Защита от испорченного localStorage: всё непохожее на корзину превращается в пустую. */
export function reviveCart(raw: unknown): CartState {
  if (!raw || typeof raw !== "object") return emptyCart;
  const value = raw as Partial<CartState>;
  if (!Array.isArray(value.lines)) return emptyCart;
  const lines = value.lines.filter(
    (l): l is CartLine =>
      !!l &&
      typeof l.itemId === "string" &&
      typeof l.title === "string" &&
      typeof l.pricePerDay === "number" &&
      typeof l.deposit === "number" &&
      typeof l.qty === "number",
  );
  const range =
    value.range && typeof value.range.from === "string" && typeof value.range.to === "string"
      ? value.range
      : null;
  return {
    range: lines.length > 0 ? range : null,
    lines: lines.map((l) => ({ ...l, available: null })),
    services: { ...NO_SERVICES, ...(value.services ?? {}) },
    // После перезагрузки остатки могли измениться — всегда начинаем с пересчёта.
    status: lines.length > 0 ? "stale" : "fresh",
    conflicts: [],
  };
}
