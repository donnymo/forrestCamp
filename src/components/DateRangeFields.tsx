"use client";

import { useState } from "react";
import { CalendarCheck2, CalendarDays } from "lucide-react";
import { ru } from "react-day-picker/locale";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  addDays,
  formatDate,
  MAX_ADVANCE_DAYS,
  MAX_RENTAL_DAYS,
  rentalDays,
  sameRange,
  todayIso,
  validateRange,
} from "@/lib/domain/dates";
import type { DateRange, IsoDate } from "@/lib/domain/dates";
import { useMediaQuery } from "@/lib/use-media-query";
import { cn } from "@/lib/utils";

export type RangeEdge = "from" | "to";

const toLocalDate = (iso: IsoDate) => {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
};
const fromLocalDate = (date: Date): IsoDate =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

/**
 * Новый период после выбора одной границы. Возврат меняет только возврат;
 * выдача меняет выдачу, а если прежний возврат с ней несовместим —
 * сдвигает его, сохраняя длину периода.
 */
export function rangeWithEdge(range: DateRange, edge: RangeEdge, date: IsoDate): DateRange {
  if (edge === "to") return { from: range.from, to: date };
  const to = validateRange(date, range.to, todayIso()).ok ? range.to : addDays(date, rentalDays(range));
  return { from: date, to };
}

/**
 * Выпадающий календарь одной границы периода. Текущий период подсвечен, но клик меняет
 * только свою дату: «Выдача» — день выдачи, «Возврат» — день возврата. Недопустимые дни
 * закрыты по тем же правилам, что проверяет validateRange.
 */
export function EdgeCalendarPopover({
  edge,
  range,
  onPick,
}: {
  edge: RangeEdge;
  range: DateRange;
  onPick: (date: IsoDate) => void;
}) {
  const today = todayIso();
  // Два месяца рядом не помещаются на телефоне — там показываем один.
  const wide = useMediaQuery("(min-width: 640px)");
  const disabled =
    edge === "from"
      ? [{ before: toLocalDate(today) }, { after: toLocalDate(addDays(today, MAX_ADVANCE_DAYS)) }]
      : [{ before: toLocalDate(addDays(range.from, 1)) }, { after: toLocalDate(addDays(range.from, MAX_RENTAL_DAYS)) }];
  return (
    // w-min: ширину задаёт сетка календаря, а подсказки переносятся — иначе длинная
    // строка внизу растягивает поповер за край телефона.
    <PopoverContent className="w-min p-0" align="start" collisionPadding={16}>
      <p className="border-b px-4 py-2.5 text-sm font-medium">
        {edge === "from" ? "Выберите дату выдачи" : "Выберите дату возврата"}
      </p>
      <Calendar
        mode="range"
        locale={ru}
        numberOfMonths={wide ? 2 : 1}
        defaultMonth={toLocalDate(range[edge])}
        selected={{ from: toLocalDate(range.from), to: toLocalDate(range.to) }}
        disabled={disabled}
        className="[--cell-size:--spacing(9)]"
        onSelect={(_, clicked) => onPick(fromLocalDate(clicked))}
      />
      <p className="border-t px-4 py-2.5 text-xs text-muted-foreground">
        Аренда от 1 до {MAX_RENTAL_DAYS} суток. День возврата не оплачивается.
      </p>
    </PopoverContent>
  );
}

/**
 * Период, который пользователь меняет по одной границе за раз. Выбор сразу применяется
 * (onApply), а до ответа поля показывают уже выбранные даты.
 */
export function useEdgePicker(range: DateRange, onApply: (range: DateRange) => void) {
  const [shown, setShown] = useState<DateRange>(range);
  const [open, setOpen] = useState<RangeEdge | null>(null);
  // Период сменился снаружи (навигация, пересчёт корзины) — подтягиваем поля прямо при рендере.
  const [synced, setSynced] = useState<DateRange>(range);
  if (!sameRange(synced, range)) {
    setSynced(range);
    setShown(range);
  }

  const pick = (edge: RangeEdge, date: IsoDate) => {
    const next = rangeWithEdge(shown, edge, date);
    setShown(next);
    setOpen(null);
    if (!sameRange(next, range)) onApply(next);
  };
  const popoverProps = (edge: RangeEdge) => ({
    open: open === edge,
    onOpenChange: (o: boolean) => setOpen(o ? edge : null),
  });
  return { shown, pick, popoverProps };
}

/** Поля «Выдача — Возврат» в стиле макета: подпись сверху, иконка внутри. */
export function DateRangeFields({
  range,
  onApply,
  disabled,
  layout = "row",
}: {
  range: DateRange;
  onApply: (range: DateRange) => void;
  disabled?: boolean;
  /** row — поля в строку (корзина), grid — две колонки (карточка). */
  layout?: "row" | "grid";
}) {
  const { shown, pick, popoverProps } = useEdgePicker(range, onApply);

  const field = (edge: RangeEdge, label: string, Icon: typeof CalendarDays) => (
    <div className={cn("flex min-w-0 flex-col gap-1.5", layout === "row" && "flex-[1_1_180px]")}>
      <span className="text-[13px] font-medium text-stone-700">{label}</span>
      <Popover {...popoverProps(edge)}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            disabled={disabled}
            className="h-12 justify-start gap-2.5 rounded-[10px] bg-white px-3.5 text-[15px] font-medium"
          >
            <Icon className="size-[18px] text-primary" />
            {formatDate(shown[edge])}
          </Button>
        </PopoverTrigger>
        <EdgeCalendarPopover edge={edge} range={shown} onPick={(date) => pick(edge, date)} />
      </Popover>
    </div>
  );

  return (
    <div className={cn("flex flex-wrap items-end gap-3", layout === "grid" && "grid grid-cols-2")}>
      {field("from", "Выдача", CalendarDays)}
      {field("to", "Возврат", CalendarCheck2)}
    </div>
  );
}
