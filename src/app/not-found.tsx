import Link from "next/link";
import { Compass } from "lucide-react";
import { EmptyState } from "@/components/EmptyState";
import { CONTAINER } from "@/components/SectionHeading";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function NotFound() {
  return (
    <div className={cn(CONTAINER, "py-16")}>
      <EmptyState icon={<Compass />} script="Сбились с тропы" title="Страница не найдена" text="Возможно, ссылка устарела." headingLevel={1}>
        <Button asChild size="lg">
          <Link href="/catalog">В каталог</Link>
        </Button>
      </EmptyState>
    </div>
  );
}
