"use client";

import { createContext, useCallback, useContext, useEffect, useLayoutEffect, useMemo, useReducer, useRef, useState } from "react";
import type { Dispatch, ReactNode } from "react";
import { cartReducer, emptyCart, reviveCart, selectTotals } from "@/lib/cart/model";
import type { CartAction, CartState } from "@/lib/cart/model";
import type { Totals } from "@/lib/domain/pricing";
import { clientApi } from "@/lib/api/client";
import { ApiError } from "@/lib/api/errors";

const STORAGE_KEY = "rr-cart-v1";

type RecalcState = { pending: boolean; error: string | null };

type CartContextValue = {
  state: CartState;
  dispatch: Dispatch<CartAction>;
  /** false до чтения localStorage — чтобы не мигать пустой корзиной. */
  hydrated: boolean;
  totals: Totals;
  recalc: () => Promise<boolean>;
  recalcState: RecalcState;
};

const CartContext = createContext<CartContextValue | null>(null);

/** Корзина + флаг «уже прочитана из localStorage». Меняются вместе одним действием hydrate. */
type StoredCart = { cart: CartState; hydrated: boolean };

function storedCartReducer(stored: StoredCart, action: CartAction): StoredCart {
  if (action.type === "hydrate") return { cart: action.state, hydrated: true };
  return { ...stored, cart: cartReducer(stored.cart, action) };
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [{ cart: state, hydrated }, dispatch] = useReducer(storedCartReducer, { cart: emptyCart, hydrated: false });
  const [recalcState, setRecalcState] = useState<RecalcState>({ pending: false, error: null });
  // recalc читает актуальную корзину без пересоздания колбэка. Layout-эффект, а не обычный:
  // он гарантированно отработает раньше эффектов дочерних компонентов (useAutoRecalc).
  const stateRef = useRef(state);
  useLayoutEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    const load = () => {
      try {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        dispatch({ type: "hydrate", state: reviveCart(raw ? JSON.parse(raw) : null) });
      } catch {
        dispatch({ type: "hydrate", state: emptyCart });
      }
    };
    load();
    // Синхронизация между вкладками.
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) load();
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      // Остатки не сохраняем: после загрузки их всё равно нужно перепроверить,
      // а без них запись стабильна и вкладки не перебрасываются событиями storage.
      const { range, services } = state;
      const lines = state.lines.map(({ available: _available, ...line }) => line);
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ range, lines, services }));
    } catch {
      // Приватный режим или переполнение — корзина просто не переживёт перезагрузку.
    }
  }, [state, hydrated]);

  /** Пересчёт по API. true — всё в наличии в нужном количестве, можно оформлять. */
  const recalc = useCallback(async (): Promise<boolean> => {
    const current = stateRef.current;
    if (!current.range || current.lines.length === 0) return false;
    setRecalcState({ pending: true, error: null });
    try {
      const quote = await clientApi.quote({
        range: current.range,
        lines: current.lines.map((l) => ({ itemId: l.itemId, qty: l.qty })),
      });
      dispatch({ type: "recalculated", range: quote.range, lines: quote.lines });
      setRecalcState({ pending: false, error: null });
      const available = new Map(quote.lines.map((l) => [l.itemId, l.available]));
      return current.lines.every((l) => (available.get(l.itemId) ?? 0) >= l.qty);
    } catch (error) {
      setRecalcState({
        pending: false,
        error: error instanceof ApiError ? error.message : "Не удалось пересчитать заказ",
      });
      return false;
    }
  }, []);

  const value = useMemo(
    () => ({ state, dispatch, hydrated, totals: selectTotals(state), recalc, recalcState }),
    [state, hydrated, recalc, recalcState],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart вне CartProvider");
  return ctx;
}

/** Автоматический пересчёт, когда корзина устарела (смена дат, загрузка из хранилища). */
export function useAutoRecalc() {
  const { state, hydrated, recalc, recalcState } = useCart();
  const needsRecalc =
    hydrated && state.status === "stale" && state.conflicts.length === 0 && state.lines.length > 0;
  const rangeKey = state.range ? `${state.range.from}:${state.range.to}` : "";
  // Повторяем, пока корзина устаревшая: ответ на уже сменённые даты отбрасывается
  // редьюсером, и после него нужен ещё один пересчёт. После ошибки ждём ручного «Повторить».
  useEffect(() => {
    if (needsRecalc && !recalcState.pending && !recalcState.error) void recalc();
  }, [needsRecalc, rangeKey, state.lines.length, recalc, recalcState.pending, recalcState.error]);
}
