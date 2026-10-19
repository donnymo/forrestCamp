import Link from "next/link";
import { Clock, ShieldCheck } from "lucide-react";
import { ItemImage } from "@/components/ItemImage";
import { AddToCartButton } from "@/components/cart/AddToCartButton";
import { categoryLabel, itemHref } from "@/lib/domain/catalog";
import { pluralDays, rentalDays } from "@/lib/domain/dates";
import type { DateRange } from "@/lib/domain/dates";
import { formatRub, quoteSingle } from "@/lib/domain/pricing";
import type { ItemSummary } from "@/lib/api/types";
import { cn } from "@/lib/utils";

/** Серверная карточка: разметка и текст в HTML, клиентская только кнопка. */
export function ItemCard({ item, range }: { item: ItemSummary; range: DateRange }) {
  const href = itemHref(item.id, range);
  const days = rentalDays(range);
  return (
    <article className="flex flex-col overflow-hidden rounded-2xl bg-cream shadow-lift transition-shadow hover:shadow-panel">
      <Link href={href} tabIndex={-1} aria-hidden className="relative block aspect-[4/3] bg-muted">
        <ItemImage id={item.id} category={item.category} alt="" />
        <Availability available={item.available} className="absolute top-3.5 left-3.5" />
        <span className="absolute top-3.5 right-3.5 rounded-full bg-night/75 px-3 py-1 text-xs font-medium text-white backdrop-blur-sm">
          {categoryLabel(item.category)}
        </span>
      </Link>
      <div className="flex flex-1 flex-col gap-3 px-4 pt-4 pb-4 sm:px-5 sm:pt-[18px] sm:pb-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 flex-col gap-1.5">
            <h2 className="font-heading text-[17px] leading-snug font-bold">
              <Link href={href} className="hover:text-primary">
                {item.title}
              </Link>
            </h2>
            <span className="text-[13px] text-muted-foreground">{item.highlights.join(" · ")}</span>
          </div>
          <div className="flex flex-none flex-col items-end gap-0.5">
            <span className="font-heading text-lg font-bold whitespace-nowrap text-primary">
              {formatRub(quoteSingle({ itemId: item.id, pricePerDay: item.pricePerDay, deposit: item.deposit }, days).rent)}
            </span>
            <span className="text-xs whitespace-nowrap text-muted-foreground">за {pluralDays(days)}</span>
          </div>
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-[13px] text-stone-700">
          <span className="inline-flex items-center gap-1.5">
            <Clock className="size-[15px] text-primary" />
            {formatRub(item.pricePerDay)} / сутки
          </span>
          <span className="inline-flex items-center gap-1.5">
            <ShieldCheck className="size-[15px] text-primary" />
            залог {formatRub(item.deposit)}
          </span>
        </div>
        <div className="mt-auto pt-1">
          <AddToCartButton
            compact
            range={range}
            item={{
              itemId: item.id,
              title: item.title,
              category: item.category,
              pricePerDay: item.pricePerDay,
              deposit: item.deposit,
              available: item.available,
            }}
          />
        </div>
      </div>
    </article>
  );
}

/** Плашка наличия: белая пилюля с цветной точкой. */
export function Availability({
  available,
  detailed,
  className,
}: {
  available: number;
  /** «Свободно 4 шт. на ваши даты» вместо короткого «Свободно». */
  detailed?: boolean;
  className?: string;
}) {
  const [color, dot, text] =
    available === 0
      ? ["text-red-700", "bg-red-600", "Занято на эти даты"]
      : available <= 2
        ? ["text-warning", "bg-warning-dot", `Осталось ${available} шт.`]
        : ["text-success", "bg-green-600", detailed ? `Свободно ${available} шт. на ваши даты` : "Свободно"];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1 text-xs font-semibold shadow-xs",
        color,
        className,
      )}
    >
      <span className={cn("size-[7px] rounded-full", dot)} />
      {text}
    </span>
  );
}
