"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";
import { useCart } from "@/components/cart/CartProvider";
import { clientApi } from "@/lib/api/client";
import {
  ConflictError,
  NetworkError,
  PaymentError,
  ServiceError,
  SessionExpiredError,
  ValidationError,
} from "@/lib/api/errors";
import { cartFingerprint } from "@/lib/cart/model";
import type { ContactErrors, ContactInput } from "@/lib/domain/contact";
import { readSessionJson, writeSessionJson } from "@/lib/session-storage";
import { DRAFT_KEY } from "./useContactDraft";

// Ключ идемпотентности живёт в sessionStorage вместе с отпечатком корзины. Повторный клик,
// перезагрузка посреди запроса или повтор после сбоя оплаты отправят тот же ключ —
// сервер вернёт уже созданную бронь, а не создаст вторую. Изменилась корзина — новый ключ.
const ATTEMPT_KEY = "rr-checkout-attempt";

type Attempt = { key: string; fingerprint: string };

export type SubmitPhase = "idle" | "creating" | "paying" | "done";

export type SubmitFailure = { kind: "payment" | "transport" | "conflict" | "validation"; message: string };

/**
 * Создание и оплата брони. Каждая ошибка API ведёт по своему пути восстановления:
 * 401 — на вход (корзина и черновик сохранены), 409 — подсветка позиций в корзине,
 * 402 — повтор оплаты той же брони, 422 — ошибки у полей, сеть/5xx — безопасный повтор.
 */
export function useBookingSubmit({ onFieldErrors }: { onFieldErrors: (errors: ContactErrors) => void }) {
  const router = useRouter();
  const { state, dispatch } = useCart();
  const { setUser } = useAuth();
  const [phase, setPhase] = useState<SubmitPhase>("idle");
  const [failure, setFailure] = useState<SubmitFailure | null>(null);
  // Защита от двойного клика до того, как React перерисует кнопку заблокированной.
  const inFlight = useRef(false);

  const submit = async (contact: ContactInput) => {
    if (inFlight.current || !state.range) return;
    inFlight.current = true;
    setFailure(null);
    setPhase("creating");

    const fingerprint = cartFingerprint(state);
    let attempt = readSessionJson<Attempt>(ATTEMPT_KEY);
    if (!attempt || attempt.fingerprint !== fingerprint) {
      attempt = { key: crypto.randomUUID(), fingerprint };
      writeSessionJson(ATTEMPT_KEY, attempt);
    }

    try {
      let { booking } = await clientApi.createBooking(
        {
          range: state.range,
          lines: state.lines.map((l) => ({ itemId: l.itemId, qty: l.qty })),
          services: state.services,
          contact,
        },
        attempt.key,
      );
      if (booking.status !== "confirmed") {
        setPhase("paying");
        ({ booking } = await clientApi.payBooking(booking.id));
      }
      setPhase("done");
      writeSessionJson(ATTEMPT_KEY, null);
      writeSessionJson(DRAFT_KEY, null);
      dispatch({ type: "clear" });
      // replace: «назад» не вернёт на форму, обновление страницы брони ничего не отправит.
      router.replace(`/account/bookings/${booking.id}?created=1`);
      return;
    } catch (error) {
      setPhase("idle");
      if (error instanceof SessionExpiredError) {
        setUser(null);
        router.replace(`/login?next=${encodeURIComponent("/checkout")}&reason=expired`);
      } else if (error instanceof ConflictError) {
        if (error.items.length > 0) dispatch({ type: "conflict", items: error.items });
        setFailure({ kind: "conflict", message: error.message });
      } else if (error instanceof PaymentError) {
        setFailure({
          kind: "payment",
          message: `${error.message} Бронь сохранена, корзина на месте — можно повторить оплату.`,
        });
      } else if (error instanceof ValidationError) {
        onFieldErrors(error.fields as ContactErrors);
        setFailure({ kind: "validation", message: error.message });
      } else if (error instanceof NetworkError || error instanceof ServiceError) {
        setFailure({ kind: "transport", message: `${error.message}. Повтор безопасен: второй брони не появится.` });
      } else {
        setFailure({ kind: "transport", message: "Непредвиденная ошибка. Попробуйте ещё раз." });
      }
    } finally {
      inFlight.current = false;
    }
  };

  return { phase, failure, submit };
}
