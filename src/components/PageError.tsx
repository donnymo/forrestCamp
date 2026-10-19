"use client";

import Link from "next/link";
import { useEffect } from "react";
import { RefreshCw, TriangleAlert } from "lucide-react";
import { EmptyState } from "@/components/EmptyState";
import { Button } from "@/components/ui/button";
import { CONTAINER } from "@/components/SectionHeading";
import { cn } from "@/lib/utils";

/** Общий вид границы восстановления для критической ошибки страницы (error.tsx). */
export function PageError({
  error,
  reset,
  title,
}: {
  error: Error & { digest?: string };
  reset: () => void;
  title: string;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <div className={cn(CONTAINER, "py-16")}>
      <EmptyState
        tone="error"
        icon={<TriangleAlert />}
        script="Что-то сломалось"
        title={title}
        headingLevel={1}
        text={
          <>
            Страница не смогла отрисоваться. Корзина и введённые данные не потеряны.
            {error.digest ? <span className="mt-1 block text-xs">Код ошибки: {error.digest}</span> : null}
          </>
        }
      >
        <Button size="lg" onClick={reset}>
          <RefreshCw />
          Попробовать снова
        </Button>
        <Button asChild variant="outline" size="lg" className="border-primary text-primary">
          <Link href="/catalog">В каталог</Link>
        </Button>
      </EmptyState>
    </div>
  );
}
