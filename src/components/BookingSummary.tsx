import { Clock } from "lucide-react";
import { ItemImage } from "@/components/ItemImage";
import { Badge } from "@/components/ui/badge";
import { formatRange, pluralDays } from "@/lib/domain/dates";
import { formatRub, SERVICES } from "@/lib/domain/pricing";
import type { ServiceId } from "@/lib/domain/pricing";
import type { Booking, BookingStatus } from "@/lib/api/types";
import { cn } from "@/lib/utils";

export const STATUS_LABEL: Record<BookingStatus, string> = {
  confirmed: "Подтверждена",
  pending_payment: "Ожидает оплаты",
  cancelled: "Отменена",
};

export function StatusBadge({ status }: { status: BookingStatus }) {
  return (
    <Badge
      variant={status === "confirmed" ? "default" : "outline"}
      className={cn(
        "h-6 rounded-full px-3 font-semibold",
        status === "pending_payment" && "border-warning-line bg-warning-soft text-warning",
        status === "cancelled" && "text-muted-foreground",
      )}
    >
      {STATUS_LABEL[status]}
    </Badge>
  );
}

/** Состав брони: позиции на кремовом фоне, итог, контакт. Для страницы брони. */
export function BookingDetails({ booking }: { booking: Booking }) {
  const { totals } = booking;
  return (
    <div className="flex flex-col gap-5 rounded-[18px] border border-line bg-white p-4 shadow-panel sm:p-6">
      <div className="flex flex-wrap items-center gap-3 text-sm text-stone-600">
        <span className="inline-flex items-center gap-1.5">
          <Clock className="size-4 text-primary" />
          {formatRange(booking.range)} · {pluralDays(totals.days)}
        </span>
        <StatusBadge status={booking.status} />
      </div>
      <ul className="flex flex-col gap-3">
        {booking.lines.map((l) => (
          <li key={l.itemId} className="flex items-center gap-3 rounded-2xl bg-cream p-3 text-sm sm:gap-3.5">
            <span className="block h-12 w-16 flex-none overflow-hidden rounded-xl sm:h-14 sm:w-[76px]">
              <ItemImage id={l.itemId} alt="" sizes="76px" />
            </span>
            <span className="flex min-w-0 flex-1 flex-col">
              <span className="font-heading font-bold">{l.title}</span>
              <span className="text-muted-foreground">
                {formatRub(l.pricePerDay)} × {totals.days} сут. × {l.qty} шт.
              </span>
            </span>
            <span className="font-heading font-bold whitespace-nowrap text-primary">
              {formatRub(totals.lines.find((t) => t.itemId === l.itemId)?.rent ?? 0)}
            </span>
          </li>
        ))}
      </ul>
      <dl className="flex flex-col gap-2.5 border-t border-dashed border-border pt-4 text-sm">
        {(Object.keys(SERVICES) as ServiceId[]).map((id) =>
          booking.services[id] ? (
            <div key={id} className="flex justify-between gap-3">
              <dt className="text-stone-600">{SERVICES[id].label}</dt>
              <dd className="whitespace-nowrap">{formatRub(totals.services[id])}</dd>
            </div>
          ) : null,
        )}
        <div className="flex items-baseline justify-between gap-3">
          <dt className="font-bold">Оплачено онлайн (аренда и услуги)</dt>
          <dd className="font-heading text-xl font-extrabold whitespace-nowrap text-primary">{formatRub(totals.payNow)}</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-stone-600">Залог при выдаче, возвращается</dt>
          <dd className="whitespace-nowrap">{formatRub(totals.deposit)}</dd>
        </div>
      </dl>
      <p className="text-[13px] text-muted-foreground">
        Контакт: {booking.contact.name}, {booking.contact.phone}, {booking.contact.email}
      </p>
    </div>
  );
}
