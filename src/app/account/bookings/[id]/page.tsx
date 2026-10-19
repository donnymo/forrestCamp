import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CircleCheck } from "lucide-react";
import { serverApi } from "@/lib/api/server";
import { isRetryable, NotFoundError, SessionExpiredError } from "@/lib/api/errors";
import type { Booking } from "@/lib/api/types";
import { formatRange } from "@/lib/domain/dates";
import { formatRub } from "@/lib/domain/pricing";
import { HERO_PHOTO } from "@/lib/photos";
import { BookingDetails } from "@/components/BookingSummary";
import { SessionRefresher } from "@/components/Boundaries";
import { ServiceUnavailable } from "@/components/ServiceUnavailable";
import { CONTAINER, SectionHeading } from "@/components/SectionHeading";
import { Steps } from "@/components/Steps";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Бронь", robots: { index: false } };

type Props = PageProps<"/account/bookings/[id]">;

const WRAP = cn(CONTAINER, "flex max-w-[800px] flex-col gap-6 pt-6 pb-24 sm:pt-10");

// Страница результата — обычный GET: обновление вкладки только перечитывает бронь.
export default async function BookingPage({ params, searchParams }: Props) {
  const { id } = await params;
  const self = `/account/bookings/${id}`;
  const created = (await searchParams).created === "1";

  let booking: Booking;
  try {
    ({ booking } = await serverApi.booking(id));
  } catch (error) {
    if (error instanceof SessionExpiredError) {
      return (
        <div className={WRAP}>
          <SessionRefresher next={self} />
        </div>
      );
    }
    if (error instanceof NotFoundError) notFound();
    if (isRetryable(error)) {
      return (
        <div className={WRAP}>
          <ServiceUnavailable title="Не удалось загрузить бронь" headingLevel={1} />
        </div>
      );
    }
    throw error;
  }

  return (
    <div className={WRAP}>
      {created && booking.status === "confirmed" ? (
        <>
          <Steps current={3} />
          <section role="status" className="overflow-hidden rounded-[18px] bg-white shadow-panel">
            <div className="relative h-40 bg-night">
              <Image src={HERO_PHOTO} alt="" fill sizes="800px" className="object-cover" />
              <span className="absolute inset-0 bg-[linear-gradient(180deg,rgb(19_34_29/0)_30%,rgb(19_34_29/0.7))]" />
              <span className="absolute bottom-4 left-4 font-script text-[32px] leading-none text-tan sm:left-6 sm:text-[38px]">
                Хорошего похода!
              </span>
            </div>
            <div className="flex flex-col gap-2.5 px-4 py-5 sm:px-6">
              <span className="inline-flex items-center gap-1.5 self-start rounded-full bg-success-soft px-3 py-1 text-xs font-semibold text-success">
                <CircleCheck className="size-3.5" />
                Оплачено
              </span>
              <h1 className="font-heading text-2xl font-extrabold tracking-tight sm:text-[28px]">Бронь {booking.number} оформлена</h1>
              <p className="text-sm leading-relaxed text-stone-600">
                {formatRange(booking.range)} · назовите номер при выдаче. Залог {formatRub(booking.totals.deposit)}{" "}
                вносится на месте.
              </p>
            </div>
          </section>
        </>
      ) : (
        <SectionHeading as="h1" script="Ваш поход" title={`Бронь ${booking.number}`} align="left" />
      )}
      <BookingDetails booking={booking} />
      <div className="flex flex-wrap gap-2.5">
        <Button asChild variant="outline" size="lg" className="h-11 rounded-[10px] border-primary px-5 text-primary">
          <Link href="/account">Все брони</Link>
        </Button>
        <Button asChild size="lg" className="h-11 rounded-[10px] px-5">
          <Link href="/catalog">В каталог</Link>
        </Button>
      </div>
    </div>
  );
}
