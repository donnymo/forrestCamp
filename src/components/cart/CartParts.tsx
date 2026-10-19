"use client";

import Image from "next/image";
import Link from "next/link";
import { Check, Clock, Loader2, Minus, Plus, ShieldCheck, Trash2, TriangleAlert, Truck } from "lucide-react";
import { useCart } from "./CartProvider";
import { ItemImage } from "@/components/ItemImage";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { MAX_QTY_PER_LINE, selectCheckoutBlocker, selectShortages } from "@/lib/cart/model";
import type { CartLine, CartState, CheckoutBlocker } from "@/lib/cart/model";
import { itemHref } from "@/lib/domain/catalog";
import { formatRange, pluralDays } from "@/lib/domain/dates";
import { DELIVERY_PRICE, formatRub, INSURANCE_RATE, SERVICES } from "@/lib/domain/pricing";
import type { ServiceId, Totals } from "@/lib/domain/pricing";
import { HERO_PHOTO } from "@/lib/photos";
import { cn } from "@/lib/utils";

/**
 * Раскладка корзины и оформления: основная колонка и сводка справа. Когда места
 * на две колонки нет (телефон, планшет), сводка уходит под основную колонку.
 */
export const ORDER_LAYOUT = {
  root: "flex flex-wrap items-start gap-6 sm:gap-8",
  main: "flex min-w-0 flex-[999_1_600px] flex-col gap-5",
  aside: "flex-[1_1_340px] overflow-hidden rounded-[18px] border lg:sticky lg:top-24 lg:max-w-[390px]",
  /** Внутренние отступы карточек: на телефоне уже, чтобы не терять ширину. */
  pad: "px-4 sm:px-6",
};

/** Шапка блока итога: ночной лес, рукописное «Итого за N суток». */
export function SummaryHeader({ state, totals }: { state: CartState; totals: Totals }) {
  if (!state.range) return null;
  return (
    <div className={cn("relative overflow-hidden bg-night py-[22px] text-white", ORDER_LAYOUT.pad)}>
      <Image src={HERO_PHOTO} alt="" fill sizes="400px" className="object-cover opacity-40" />
      <div className="relative flex flex-col gap-0.5">
        <span className="font-script text-[28px] leading-none text-tan">Итого за {pluralDays(totals.days)}</span>
        <span className="text-sm text-stone-300">{formatRange(state.range)}</span>
      </div>
    </div>
  );
}

/** Разбивка суммы: по позициям и дням, услуги, залог. Только из selectTotals. */
export function TotalsBreakdown({ state, totals }: { state: CartState; totals: Totals }) {
  if (!state.range) return null;
  return (
    <dl className="flex flex-col gap-2.5 text-sm">
      {totals.lines.map((lt) => {
        const line = state.lines.find((l) => l.itemId === lt.itemId)!;
        return (
          <div key={lt.itemId} className="flex justify-between gap-3">
            <dt className="text-stone-600">
              {line.title}{" "}
              <span className="whitespace-nowrap text-stone-400">
                {lt.pricePerDay} × {totals.days} × {lt.qty}
              </span>
            </dt>
            <dd className="font-medium whitespace-nowrap">{formatRub(lt.rent)}</dd>
          </div>
        );
      })}
      {(Object.keys(SERVICES) as ServiceId[]).map((id) =>
        state.services[id] ? (
          <div key={id} className="flex justify-between gap-3">
            <dt className="text-stone-600">{SERVICES[id].label}</dt>
            <dd className="font-medium whitespace-nowrap">{formatRub(totals.services[id])}</dd>
          </div>
        ) : null,
      )}
      <div className="my-1 h-px bg-line" />
      <div className="flex justify-between gap-3 font-bold">
        <dt>К оплате сейчас</dt>
        <dd className="whitespace-nowrap">{formatRub(totals.payNow)}</dd>
      </div>
      <div className="flex justify-between gap-3">
        <dt className="text-stone-600">
          Залог при выдаче <span className="text-stone-400">возвращается</span>
        </dt>
        <dd className="font-medium whitespace-nowrap">{formatRub(totals.deposit)}</dd>
      </div>
      <div className="my-1 h-px bg-line" />
      <div className="flex items-baseline justify-between gap-3">
        <dt className="text-base font-bold">Всего при выдаче</dt>
        <dd className="font-heading text-2xl font-extrabold whitespace-nowrap text-primary">{formatRub(totals.total)}</dd>
      </div>
    </dl>
  );
}

export function QtyStepper({ line }: { line: CartLine }) {
  const { dispatch } = useCart();
  const max = Math.min(MAX_QTY_PER_LINE, line.available ?? MAX_QTY_PER_LINE);
  return (
    <div role="group" aria-label={`Количество: ${line.title}`} className="inline-flex h-10 items-center overflow-hidden rounded-[10px] border bg-white">
      <Button
        variant="ghost"
        className="h-full w-[38px] rounded-none"
        aria-label="Меньше"
        disabled={line.qty <= 1}
        onClick={() => dispatch({ type: "setQty", itemId: line.itemId, qty: line.qty - 1 })}
      >
        <Minus />
      </Button>
      <span className="min-w-7 text-center text-[15px] font-bold" aria-live="polite">
        {line.qty}
      </span>
      <Button
        variant="ghost"
        className="h-full w-[38px] rounded-none"
        aria-label="Больше"
        disabled={line.qty >= max}
        onClick={() => dispatch({ type: "setQty", itemId: line.itemId, qty: line.qty + 1 })}
      >
        <Plus />
      </Button>
    </div>
  );
}

/** Строка корзины. rent — сумма аренды строки из selectTotals, здесь ничего не пересчитываем. */
export function LineRow({ line, rent, conflicted }: { line: CartLine; rent: number; conflicted: boolean }) {
  const { dispatch, state } = useCart();
  const short = line.available !== null && line.qty > line.available;
  const href = state.range ? itemHref(line.itemId, state.range) : `/items/${encodeURIComponent(line.itemId)}`;
  return (
    <li
      className={cn(
        "flex flex-wrap items-center gap-3.5 rounded-2xl p-3 sm:gap-[18px] sm:py-3.5 sm:pr-[18px] sm:pl-3.5",
        conflicted || short ? "bg-red-50 ring-1 ring-red-200" : "bg-cream",
      )}
    >
      <Link
        href={href}
        tabIndex={-1}
        aria-hidden
        className="block h-[72px] w-24 flex-none overflow-hidden rounded-xl sm:h-[90px] sm:w-[120px]"
      >
        <ItemImage id={line.itemId} category={line.category} alt="" sizes="120px" />
      </Link>
      {/* На телефоне фото и название — первой строкой, количество, сумма и удаление — второй. */}
      <div className="flex min-w-0 flex-[1_1_160px] flex-col gap-1.5">
        <Link href={href} className="font-heading text-base font-bold hover:text-primary">
          {line.title}
        </Link>
        <span className="flex flex-wrap gap-x-3.5 gap-y-1 text-[13px] text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <Clock className="size-3.5 text-primary" />
            {formatRub(line.pricePerDay)} / сутки
          </span>
          <span>залог {formatRub(line.deposit)}</span>
        </span>
        {short ? (
          <Badge variant="destructive" className="mt-1" role="alert">
            {line.available === 0 ? "Недоступно на эти даты" : `Доступно только ${line.available} шт.`}
          </Badge>
        ) : null}
      </div>
      <QtyStepper line={line} />
      <span className="ml-auto w-[100px] text-right font-heading text-[17px] font-bold whitespace-nowrap text-primary">
        {formatRub(rent)}
      </span>
      <Button
        variant="outline"
        size="icon-lg"
        aria-label={`Удалить: ${line.title}`}
        className="size-10 rounded-full bg-white text-muted-foreground"
        onClick={() => dispatch({ type: "remove", itemId: line.itemId })}
      >
        <Trash2 />
      </Button>
    </li>
  );
}

/** Путь восстановления после 409 или найденной нехватки при пересчёте. */
export function ConflictPanel() {
  const { state, dispatch, recalc, recalcState } = useCart();
  const shortages = selectShortages(state);
  if (state.conflicts.length === 0 && shortages.length === 0) return null;
  const affected = state.lines.filter((l) => state.conflicts.includes(l.itemId) || shortages.includes(l));
  return (
    <Alert variant="destructive" className="rounded-[14px] border-red-200 bg-red-50 px-4 py-3.5">
      <TriangleAlert />
      <AlertTitle>Наличие изменилось</AlertTitle>
      <AlertDescription className="flex flex-col gap-2 text-red-900">
        <p>Пока вы оформляли заказ, часть снаряжения забронировали. Остальные позиции сохранены.</p>
        <ul className="list-disc pl-4">
          {affected.map((l) => (
            <li key={l.itemId}>
              {l.title}: {l.available === 0 ? "нет на эти даты" : `доступно ${l.available} из ${l.qty}`}
            </li>
          ))}
        </ul>
        <div className="mt-1 flex flex-wrap gap-2">
          <Button size="sm" className="h-9 rounded-[10px]" onClick={() => dispatch({ type: "dropUnavailable" })}>
            Убрать недоступное и пересчитать
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-9 rounded-[10px] border-red-200 bg-white text-red-900"
            disabled={recalcState.pending}
            onClick={() => void recalc()}
          >
            Проверить ещё раз
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  );
}

const SERVICE_ICONS: Record<ServiceId, typeof Truck> = { insurance: ShieldCheck, delivery: Truck };

/** Дополнительные услуги — карточки-переключатели. */
export function ServicesPicker() {
  const { state, dispatch, totals } = useCart();
  return (
    <fieldset className="flex flex-col gap-3">
      <legend className="mb-3 font-heading text-lg font-bold">Дополнительные услуги</legend>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(260px,100%),1fr))] gap-3.5">
        {(Object.keys(SERVICES) as ServiceId[]).map((id) => {
          const on = state.services[id];
          const Icon = SERVICE_ICONS[id];
          return (
            <label
              key={id}
              htmlFor={`service-${id}`}
              className={cn(
                "flex cursor-pointer items-start gap-3.5 rounded-[14px] p-4 transition-colors sm:p-[18px]",
                on ? "border-2 border-primary bg-primary-tint" : "border border-border bg-white hover:border-primary/40",
              )}
            >
              <span
                className={cn(
                  "flex size-10 flex-none items-center justify-center rounded-xl",
                  on ? "bg-primary text-white" : "bg-sand text-primary",
                )}
              >
                <Icon className="size-5" />
              </span>
              <span className="flex flex-1 flex-col gap-1">
                <span className="text-[15px] font-semibold">{SERVICES[id].label}</span>
                <span className="text-[13px] leading-relaxed text-muted-foreground">{SERVICES[id].hint}</span>
              </span>
              <span className="flex flex-col items-end gap-2">
                <Checkbox
                  id={`service-${id}`}
                  checked={on}
                  onCheckedChange={(checked) => dispatch({ type: "toggleService", service: id, enabled: checked === true })}
                />
                <span className={cn("text-sm", on ? "font-bold" : "font-semibold text-muted-foreground")}>
                  {on
                    ? formatRub(totals.services[id])
                    : id === "delivery"
                      ? formatRub(DELIVERY_PRICE)
                      : `${INSURANCE_RATE * 100}%`}
                </span>
              </span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

export const BLOCKER_TEXT: Record<Exclude<CheckoutBlocker, null>, string> = {
  empty: "Корзина пуста.",
  no_dates: "Выберите даты аренды.",
  stale: "Проверяем наличие на выбранные даты…",
  shortage: "Уберите или уменьшите недоступные позиции.",
};

export function useCheckoutBlocker(): CheckoutBlocker {
  const { state } = useCart();
  return selectCheckoutBlocker(state);
}

export function RecalcStatus() {
  const { state, recalc, recalcState } = useCart();
  if (recalcState.pending) {
    return (
      <p className="flex items-center gap-1.5 text-[13px] text-muted-foreground" role="status">
        <Loader2 className="size-3.5 animate-spin" />
        Пересчитываем по актуальному наличию…
      </p>
    );
  }
  if (recalcState.error) {
    return (
      <p className="text-[13px] text-destructive" role="alert">
        {recalcState.error}.{" "}
        <button type="button" className="font-medium underline" onClick={() => void recalc()}>
          Повторить
        </button>
      </p>
    );
  }
  const allAvailable = state.conflicts.length === 0 && selectShortages(state).length === 0;
  if (state.status === "fresh" && state.lines.length > 0 && allAvailable) {
    return (
      <p className="flex items-center gap-1.5 text-[13px] text-success">
        <Check className="size-3.5" strokeWidth={2.5} />
        Цены и наличие подтверждены
      </p>
    );
  }
  return null;
}
