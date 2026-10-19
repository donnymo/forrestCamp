import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { ChevronRight, Tent } from "lucide-react";
import { serverApi } from "@/lib/api/server";
import { isRetryable, SessionExpiredError } from "@/lib/api/errors";
import type { Booking } from "@/lib/api/types";
import { formatRange } from "@/lib/domain/dates";
import { formatRub } from "@/lib/domain/pricing";
import { StatusBadge } from "@/components/BookingSummary";
import { SessionRefresher } from "@/components/Boundaries";
import { EmptyState } from "@/components/EmptyState";
import { ServiceUnavailable } from "@/components/ServiceUnavailable";
import { ItemImage } from "@/components/ItemImage";
import { CONTAINER, SectionHeading } from "@/components/SectionHeading";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Мои брони", robots: { index: false } };

export default async function AccountPage() {
  // Без сессии сюда не пустит proxy.ts; истёкший access-токен обновит SessionRefresher.
  let bookings: Booking[] | null = null;
  let content: ReactNode;
  try {
    ({ bookings } = await serverApi.bookings());
  } catch (error) {
    if (error instanceof SessionExpiredError) content = <SessionRefresher next="/account" />;
    else if (isRetryable(error)) {
      content = <ServiceUnavailable title="История временно недоступна" />;
    } else throw error;
  }

  if (bookings) {
    content =
      bookings.length === 0 ? (
        <EmptyState icon={<Tent />} script="Всё впереди" title="Броней пока нет">
          <Button asChild size="lg" className="h-10">
            <Link href="/catalog">Выбрать снаряжение</Link>
          </Button>
        </EmptyState>
      ) : (
        <ul className="flex flex-col gap-3.5">
          {bookings.map((b) => (
            <li key={b.id}>
              <Link
                href={`/account/bookings/${b.id}`}
                className="flex flex-wrap items-center gap-x-5 gap-y-3 rounded-2xl bg-cream p-3.5 shadow-lift transition-shadow hover:shadow-panel sm:pr-5"
              >
                <span className="flex -space-x-4">
                  {b.lines.slice(0, 3).map((l) => (
                    <span key={l.itemId} className="block h-14 w-[72px] overflow-hidden rounded-xl border-2 border-cream">
                      <ItemImage id={l.itemId} alt="" sizes="72px" />
                    </span>
                  ))}
                </span>
                <span className="flex min-w-0 flex-[1_1_220px] flex-col gap-0.5">
                  <span className="font-heading text-base font-bold">Бронь {b.number}</span>
                  <span className="line-clamp-2 text-[13px] text-muted-foreground sm:truncate">
                    {formatRange(b.range)} · {b.lines.map((l) => (l.qty > 1 ? `${l.title} ×${l.qty}` : l.title)).join(", ")}
                  </span>
                </span>
                <span className="font-heading text-lg font-bold whitespace-nowrap text-primary">{formatRub(b.totals.payNow)}</span>
                <StatusBadge status={b.status} />
                <ChevronRight className="size-5 text-muted-foreground max-sm:ml-auto" aria-hidden />
              </Link>
            </li>
          ))}
        </ul>
      );
  }

  return (
    <div className={cn(CONTAINER, "flex flex-col gap-6 pt-6 pb-24 sm:gap-8 sm:pt-10")}>
      <SectionHeading as="h1" script="Ваши походы" title="Мои брони" align="left" />
      {content}
    </div>
  );
}
