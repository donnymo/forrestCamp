"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { DateRangeFields } from "@/components/DateRangeFields";
import { itemHref } from "@/lib/domain/catalog";
import type { DateRange } from "@/lib/domain/dates";

/** Даты на странице позиции: выбор сразу перезапрашивает цену и наличие. */
export function ItemDates({ itemId, range }: { itemId: string; range: DateRange }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  return (
    <div aria-busy={pending} className="flex flex-col gap-2">
      <DateRangeFields
        layout="grid"
        range={range}
        disabled={pending}
        onApply={(next) =>
          startTransition(() => router.replace(itemHref(itemId, next), { scroll: false }))
        }
      />
      {pending ? (
        <p className="flex items-center gap-2 text-[13px] text-muted-foreground" role="status">
          <Loader2 className="size-3.5 animate-spin" />
          Проверяем наличие на эти даты…
        </p>
      ) : null}
    </div>
  );
}
