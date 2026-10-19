"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { Clock, CreditCard, Loader2, Mail, Phone, RefreshCw, ShieldCheck, ShoppingCart, TriangleAlert, UserRound } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import { useAutoRecalc, useCart } from "@/components/cart/CartProvider";
import {
  BLOCKER_TEXT,
  ConflictPanel,
  ORDER_LAYOUT,
  RecalcStatus,
  ServicesPicker,
  TotalsBreakdown,
  useCheckoutBlocker,
} from "@/components/cart/CartParts";
import { EmptyState } from "@/components/EmptyState";
import { ItemImage } from "@/components/ItemImage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { validateContact } from "@/lib/domain/contact";
import { formatRange, pluralDays } from "@/lib/domain/dates";
import { formatRub } from "@/lib/domain/pricing";
import { cn } from "@/lib/utils";
import { useBookingSubmit } from "./useBookingSubmit";
import { useContactDraft } from "./useContactDraft";

/** Шаг «Контакты и оплата»: форма контактов, услуги и сводка заказа. */
export function CheckoutForm() {
  const { state, hydrated, totals } = useCart();
  const { user } = useAuth();
  const blocker = useCheckoutBlocker();
  useAutoRecalc();

  const { contact, errors, setErrors, setField } = useContactDraft(user);
  const { phase, failure, submit } = useBookingSubmit({ onFieldErrors: setErrors });

  if (!hydrated) return <Skeleton className="h-72 rounded-2xl bg-sand" aria-busy="true" />;

  if (phase === "done") {
    return (
      <p className="flex items-center gap-2 py-16 text-sm text-muted-foreground" role="status">
        <Loader2 className="size-4 animate-spin" />
        Бронь оформлена, открываем её…
      </p>
    );
  }

  if (state.lines.length === 0) {
    return (
      <EmptyState
        icon={<ShoppingCart />}
        script="Пока пусто"
        title="Оформлять нечего"
        text="Корзина пуста. Если вы только что оформили бронь — она в истории."
      >
        <Button asChild size="lg">
          <Link href="/catalog">В каталог</Link>
        </Button>
        <Button asChild variant="outline" size="lg">
          <Link href="/account">Мои брони</Link>
        </Button>
      </EmptyState>
    );
  }

  const onSubmit = () => {
    if (blocker) return;
    const contactErrors = validateContact(contact);
    setErrors(contactErrors);
    if (Object.keys(contactErrors).length === 0) void submit(contact);
  };

  const busy = phase !== "idle";
  const label =
    phase === "creating"
      ? "Создаём бронь…"
      : phase === "paying"
        ? "Проводим оплату…"
        : failure?.kind === "payment"
          ? "Повторить оплату"
          : `Подтвердить и оплатить`;

  return (
    <div className={ORDER_LAYOUT.root}>
      <form
        className={ORDER_LAYOUT.main}
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit();
        }}
      >
        <ConflictPanel />

        {/* Конфликт показывает ConflictPanel со своими действиями — здесь остальные сбои. */}
        {failure && failure.kind !== "conflict" ? (
          <div role="alert" className="flex gap-3.5 rounded-[14px] border border-red-200 bg-red-50 px-[18px] py-4 text-red-950">
            <span className="flex size-10 flex-none items-center justify-center rounded-xl bg-red-100 text-destructive">
              {failure.kind === "payment" ? <CreditCard className="size-5" /> : <TriangleAlert className="size-5" />}
            </span>
            <div className="flex flex-1 flex-col gap-1">
              <strong className="text-[15px] font-bold">
                {failure.kind === "payment"
                  ? "Оплата не прошла"
                  : failure.kind === "validation"
                    ? "Проверьте данные"
                    : "Не удалось отправить заказ"}
              </strong>
              <span className="text-sm leading-relaxed text-red-900">{failure.message}</span>
            </div>
          </div>
        ) : null}

        <fieldset
          disabled={busy}
          className="flex min-w-0 flex-col gap-[18px] rounded-[18px] border border-line bg-white p-4 shadow-panel sm:p-6"
        >
          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <legend className="font-heading text-xl font-bold">Контактные данные</legend>
            {user ? <span className="text-[13px] text-muted-foreground">Вы вошли как {user.email}</span> : null}
          </div>
          <div className="grid grid-cols-[repeat(auto-fit,minmax(min(240px,100%),1fr))] gap-4">
            <Field id="name" label="Имя" icon={UserRound} error={errors.name}>
              <Input id="name" autoComplete="name" value={contact.name} onChange={(e) => setField("name")(e.target.value)} aria-invalid={!!errors.name} />
            </Field>
            <Field id="phone" label="Телефон" icon={Phone} error={errors.phone}>
              <Input
                id="phone"
                type="tel"
                autoComplete="tel"
                placeholder="+7 999 000-11-22"
                value={contact.phone}
                onChange={(e) => setField("phone")(e.target.value)}
                aria-invalid={!!errors.phone}
              />
            </Field>
            <Field id="email" label="Почта" icon={Mail} error={errors.email}>
              <Input id="email" type="email" autoComplete="email" value={contact.email} onChange={(e) => setField("email")(e.target.value)} aria-invalid={!!errors.email} />
            </Field>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="comment" className="text-[13px] text-stone-700">
              Комментарий <span className="font-normal text-muted-foreground">необязательно</span>
            </Label>
            <Textarea
              id="comment"
              rows={3}
              placeholder="Например: заберём к 11:00"
              value={contact.comment}
              onChange={(e) => setField("comment")(e.target.value)}
              aria-invalid={!!errors.comment}
              className="rounded-[10px] bg-white px-3.5 py-3 text-[15px]"
            />
            {errors.comment ? <span className="text-[13px] text-destructive">{errors.comment}</span> : null}
          </div>
        </fieldset>

        <ServicesPicker />

        <Button
          type="submit"
          size="lg"
          // Длинная подпись с суммой на узком экране переносится, а не вылезает за кнопку.
          className="h-auto min-h-14 rounded-xl bg-bark-gradient py-3 text-base font-semibold whitespace-normal shadow-bark hover:brightness-110"
          disabled={busy || !!blocker}
        >
          {busy ? <Loader2 className="animate-spin" /> : failure?.kind === "payment" ? <RefreshCw /> : null}
          {label}
          {!busy ? ` · ${formatRub(totals.payNow)}` : ""}
        </Button>
        {blocker ? <p className="text-[13px] text-muted-foreground">{BLOCKER_TEXT[blocker]}</p> : null}
        <p className="flex items-center gap-2 text-[13px] text-muted-foreground">
          <ShieldCheck className="size-4 flex-none text-primary" />
          Повтор безопасен: вторая бронь не появится. Оплата учебная, деньги не списываются.
        </p>
      </form>

      <aside aria-label="Ваш заказ" className={cn(ORDER_LAYOUT.aside, "border-paper-line bg-cream")}>
        <div className={cn("flex flex-col gap-0.5 pt-5 pb-2 sm:pt-[22px]", ORDER_LAYOUT.pad)}>
          <span className="font-script text-[28px] leading-none text-bark-text">Ваш заказ</span>
          {state.range ? (
            <span className="inline-flex items-center gap-1.5 text-sm text-stone-600">
              <Clock className="size-3.5 text-primary" />
              {formatRange(state.range)} · {pluralDays(totals.days)}
            </span>
          ) : null}
        </div>
        <ul className={cn("flex flex-col gap-3 py-3.5", ORDER_LAYOUT.pad)}>
          {state.lines.map((l) => (
            <li key={l.itemId} className="flex items-center gap-3 text-sm">
              <span className="block h-12 w-16 flex-none overflow-hidden rounded-[10px]">
                <ItemImage id={l.itemId} category={l.category} alt="" sizes="64px" />
              </span>
              <span className="flex-1 font-medium">
                {l.title}
                {l.qty > 1 ? ` × ${l.qty}` : ""}
              </span>
            </li>
          ))}
        </ul>
        <div className={cn("flex flex-col gap-3 border-t border-dashed border-border pt-4 pb-5 sm:pb-6", ORDER_LAYOUT.pad)}>
          <TotalsBreakdown state={state} totals={totals} />
          <RecalcStatus />
          <Link href="/cart" className="text-sm font-semibold text-primary hover:underline">
            Изменить состав или даты
          </Link>
        </div>
      </aside>
    </div>
  );
}

/** Поле с подписью сверху и иконкой внутри, как в макете. */
function Field({
  id,
  label,
  icon: Icon,
  error,
  children,
}: {
  id: string;
  label: string;
  icon: LucideIcon;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id} className="text-[13px] text-stone-700">
        {label}
      </Label>
      <div className="relative [&_input]:h-12 [&_input]:rounded-[10px] [&_input]:bg-white [&_input]:pl-11 [&_input]:text-[15px] [&_input]:font-medium">
        <Icon className="pointer-events-none absolute top-1/2 left-3.5 size-[18px] -translate-y-1/2 text-primary" />
        {children}
      </div>
      {error ? <span className="text-[13px] text-destructive">{error}</span> : null}
    </div>
  );
}
