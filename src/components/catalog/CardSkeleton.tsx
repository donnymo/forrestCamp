import { Skeleton } from "@/components/ui/skeleton";

export function CardSkeleton() {
  return (
    <div className="flex flex-col overflow-hidden rounded-2xl bg-cream">
      <Skeleton className="aspect-[4/3] rounded-none bg-shimmer" />
      <div className="flex flex-col gap-2.5 p-5">
        <Skeleton className="h-4 w-4/5 bg-shimmer" />
        <Skeleton className="h-3 w-1/2 bg-shimmer" />
        <Skeleton className="mt-3 h-10 w-36 rounded-[10px] bg-shimmer" />
      </div>
    </div>
  );
}
