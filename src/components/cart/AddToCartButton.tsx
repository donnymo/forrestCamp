"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Check, Minus, Plus, ShoppingCart } from "lucide-react";
import { toast } from "sonner";
import { useCart } from "./CartProvider";
import { Button } from "@/components/ui/button";
import { MAX_QTY_PER_LINE } from "@/lib/cart/model";
import { formatRange, sameRange } from "@/lib/domain/dates";
import type { DateRange } from "@/lib/domain/dates";

// В клиент передаём только то, что нужно для строки корзины, — без описаний и характеристик.
export type CartItemInput = {
  itemId: string;
  title: string;
  category: string;
  pricePerDay: number;
  deposit: number;
  available: number;
};

export function AddToCartButton({
  item,
  range,
  compact,
}: {
  item: CartItemInput;
  range: DateRange;
  /** compact — кнопка в карточке каталога; иначе — степпер и большая кнопка на странице товара. */
  compact?: boolean;
}) {
  const { state, dispatch, hydrated } = useCart();
  const router = useRouter();
  const [confirmingRange, setConfirmingRange] = useState(false);
  const [qty, setQty] = useState(1);

  const line = state.lines.find((l) => l.itemId === item.itemId);
  const otherDates = state.lines.length > 0 && state.range && !sameRange(state.range, range);
  const inCartQty = otherDates ? 0 : (line?.qty ?? 0);
  const limit = Math.min(item.available, MAX_QTY_PER_LINE);
  const canAddMore = Math.max(0, limit - inCartQty);
  const addQty = compact ? 1 : Math.min(qty, canAddMore);

  const add = () => {
    dispatch({ type: "add", range, item, qty: addQty });
    setConfirmingRange(false);
    setQty(1);
    toast.success("Добавлено в корзину", {
      description: `${item.title} · ${formatRange(range)}`,
      action: { label: "Открыть", onClick: () => router.push("/cart") },
    });
  };

  if (item.available === 0) {
    return (
      <Button variant="outline" size="lg" className="h-10 rounded-[10px] px-4 font-semibold" disabled>
        Нет мест на эти даты
      </Button>
    );
  }

  if (confirmingRange && state.range) {
    return (
      <div className="flex w-full flex-col gap-2 rounded-xl bg-warning-soft p-3 text-sm" role="group" aria-label="Смена дат корзины">
        <p>
          В корзине даты {formatRange(state.range)}. Даты едины для всего заказа — перенести корзину на{" "}
          {formatRange(range)}? Наличие перепроверим.
        </p>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" onClick={add}>
            Перенести и добавить
          </Button>
          <Button size="sm" variant="outline" onClick={() => setConfirmingRange(false)}>
            Отмена
          </Button>
        </div>
      </div>
    );
  }

  const onAdd = () => (otherDates ? setConfirmingRange(true) : add());

  if (compact) {
    if (inCartQty > 0) {
      return (
        <Button asChild size="lg" className="h-10 rounded-[10px] px-4 font-semibold">
          <Link href="/cart">
            <Check strokeWidth={2.5} />В корзине · {inCartQty}
          </Link>
        </Button>
      );
    }
    return (
      <Button
        variant="outline"
        size="lg"
        className="h-10 rounded-[10px] border-primary px-4 font-semibold text-primary hover:bg-primary-soft hover:text-primary"
        disabled={!hydrated}
        onClick={onAdd}
      >
        <Plus />В корзину
      </Button>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-3">
        <div
          role="group"
          aria-label="Количество"
          className="inline-flex h-[50px] items-center overflow-hidden rounded-[10px] border bg-white"
        >
          <Button
            variant="ghost"
            className="h-full w-11 rounded-none"
            aria-label="Меньше"
            disabled={qty <= 1}
            onClick={() => setQty(qty - 1)}
          >
            <Minus />
          </Button>
          <span className="min-w-8 text-center text-base font-bold" aria-live="polite">
            {qty}
          </span>
          <Button
            variant="ghost"
            className="h-full w-11 rounded-none"
            aria-label="Больше"
            disabled={qty >= canAddMore}
            onClick={() => setQty(qty + 1)}
          >
            <Plus />
          </Button>
        </div>
        <Button
          size="lg"
          className="h-[50px] flex-1 rounded-[10px] text-base font-semibold"
          disabled={!hydrated || canAddMore === 0}
          onClick={onAdd}
        >
          <ShoppingCart className="size-[18px]" />
          {inCartQty > 0 ? "Добавить ещё" : "Добавить в корзину"}
        </Button>
      </div>
      {inCartQty > 0 ? (
        <Link href="/cart" className="text-sm font-medium text-primary hover:underline">
          В корзине: {inCartQty} шт.{canAddMore === 0 ? " — больше свободных нет" : ""}
        </Link>
      ) : null}
    </div>
  );
}
