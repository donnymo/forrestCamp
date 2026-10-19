import { Skeleton } from "@/components/ui/skeleton";
import { CONTAINER } from "@/components/SectionHeading";
import { cn } from "@/lib/utils";

export default function ItemLoading() {
  return (
    <div className={cn(CONTAINER, "flex flex-wrap gap-12 pt-16 pb-16")} aria-busy="true" aria-label="Загружаем карточку">
      <Skeleton className="aspect-[4/3] flex-[1_1_520px] rounded-[20px] bg-sand" />
      <div className="flex flex-[1_1_440px] flex-col gap-4">
        <Skeleton className="h-7 w-40 bg-sand" />
        <Skeleton className="h-11 w-3/4 bg-sand" />
        <Skeleton className="h-16 bg-sand" />
        <Skeleton className="h-80 rounded-[18px] bg-sand" />
      </div>
    </div>
  );
}
