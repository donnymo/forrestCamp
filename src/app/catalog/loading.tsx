import { Skeleton } from "@/components/ui/skeleton";
import { CardSkeleton } from "@/components/catalog/CardSkeleton";
import { CONTAINER } from "@/components/SectionHeading";
import { cn } from "@/lib/utils";

// Первоначальная загрузка каталога. Смена фильтров сюда не попадает —
// там старая выдача остаётся на экране с индикатором (см. PendingRegion).
export default function CatalogLoading() {
  return (
    <div aria-busy="true" aria-label="Загружаем каталог">
      <div className="h-[540px] bg-night" />
      <div className={cn(CONTAINER, "flex flex-col gap-8 pt-20")}>
        <Skeleton className="mx-auto h-16 w-72 bg-sand" />
        <Skeleton className="h-[72px] rounded-[14px] bg-sand" />
        <div className="grid grid-cols-[repeat(auto-fill,minmax(min(320px,100%),1fr))] gap-7">
          {Array.from({ length: 6 }, (_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      </div>
    </div>
  );
}
