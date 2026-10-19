"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Loader2, ShoppingCart } from "lucide-react";
import { useCart, useAutoRecalc } from "./CartProvider";
import {
  BLOCKER_TEXT,
  ConflictPanel,
  LineRow,
  ORDER_LAYOUT,
  RecalcStatus,
  ServicesPicker,
  SummaryHeader,
  TotalsBreakdown,
  useCheckoutBlocker,
} from "./CartParts";
import { DateRangeFields } from "@/components/DateRangeFields";
import { EmptyState } from "@/components/EmptyState";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { selectItemCount } from "@/lib/cart/model";
import type { CheckoutBlocker } from "@/lib/cart/model";
import { cn } from "@/lib/utils";

export function CartView() {
  const { state, dispatch, hydrated, totals } = useCart();
  const blocker = useCheckoutBlocker();
  useAutoRecalc();

  if (!hydrated) return <Skeleton className="h-72 rounded-2xl bg-sand" aria-busy="true" />;

  if (state.lines.length === 0) {
    return (
      <EmptyState icon={<ShoppingCart />} script="Пока пусто" title="Корзина пуста" text="Выберите даты и добавьте снаряжение из каталога.">
        <Button asChild size="lg" className="h-10">
          <Link href="/catalog">В каталог</Link>
        </Button>
      </EmptyState>
    );
  }

  return (
    <div className={ORDER_LAYOUT.root}>
      <div className={ORDER_LAYOUT.main}>
        <ConflictPanel />

        {state.range ? (
          <section
            aria-label="Даты аренды"
            className="flex flex-col gap-2 rounded-2xl border border-line bg-white px-4 py-4 shadow-panel sm:px-[22px] sm:py-5"
          >
            <DateRangeFields
              range={state.range}
              onApply={(range) => dispatch({ type: "setRange", range })}
            />
            <p className="text-[13px] text-muted-foreground">Даты едины для всего заказа. После смены наличие пересчитается.</p>
          </section>
        ) : null}

        <p className="text-sm text-muted-foreground">
          {state.lines.length} поз. · {selectItemCount(state)} шт.
        </p>
        <ul aria-label="Позиции" className="-mt-2 flex flex-col gap-3.5">
          {state.lines.map((line) => (
            <LineRow
              key={line.itemId}
              line={line}
              rent={totals.lines.find((t) => t.itemId === line.itemId)?.rent ?? 0}
              conflicted={state.conflicts.includes(line.itemId)}
            />
          ))}
        </ul>

        <ServicesPicker />
      </div>

      <aside aria-label="Итого" className={cn(ORDER_LAYOUT.aside, "border-line bg-white shadow-panel")}>
        <SummaryHeader state={state} totals={totals} />
        <div className={cn("flex flex-col gap-4 pt-5 pb-5 sm:pt-[22px] sm:pb-6", ORDER_LAYOUT.pad)}>
          <TotalsBreakdown state={state} totals={totals} />
          <RecalcStatus />
          <CheckoutButton blocker={blocker} />
        </div>
      </aside>
    </div>
  );
}

/**
 * «Оформить бронь» сначала пересчитывает корзину по актуальным ценам и остаткам
 * и переходит к оформлению, только если всё в наличии. Иначе остаёмся в корзине:
 * ошибка пересчёта видна в RecalcStatus, нехватка — в ConflictPanel и под кнопкой.
 */
function CheckoutButton({ blocker }: { blocker: CheckoutBlocker }) {
  const router = useRouter();
  const { recalc, recalcState } = useCart();
  const [checking, setChecking] = useState(false);
  // stale — не помеха: кнопка сама запускает пересчёт.
  const hardBlocker = blocker === "stale" ? null : blocker;
  const busy = checking || recalcState.pending;

  const go = async () => {
    setChecking(true);
    const ok = await recalc();
    if (ok) router.push("/checkout");
    else setChecking(false);
  };

  return (
    <>
      <Button
        size="lg"
        className="h-[52px] rounded-xl bg-bark-gradient text-base font-semibold shadow-bark hover:brightness-110"
        disabled={!!hardBlocker || busy}
        onClick={() => void go()}
      >
        {busy ? <Loader2 className="size-[18px] animate-spin" /> : null}
        {busy ? "Проверяем наличие…" : "Оформить бронь"}
        {busy ? null : <ArrowRight className="size-[18px]" />}
      </Button>
      {hardBlocker ? <p className="text-[13px] text-muted-foreground">{BLOCKER_TEXT[hardBlocker]}</p> : null}
    </>
  );
}
