import Link from "next/link";
import { PackageX } from "lucide-react";
import { EmptyState } from "@/components/EmptyState";
import { CONTAINER } from "@/components/SectionHeading";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function ItemNotFound() {
  return (
    <div className={cn(CONTAINER, "py-16")}>
      <EmptyState
        icon={<PackageX />}
        script="Не нашли"
        title="Такой позиции нет"
        text="Её могли снять с проката или в ссылке опечатка. Посмотрите похожее в каталоге."
        headingLevel={1}
      >
        <Button asChild size="lg">
          <Link href="/catalog">Открыть каталог</Link>
        </Button>
      </EmptyState>
    </div>
  );
}
