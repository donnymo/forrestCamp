import type { Metadata } from "next";
import { CartView } from "@/components/cart/CartView";
import { CONTAINER } from "@/components/SectionHeading";
import { StepsHeading } from "@/components/Steps";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Корзина", robots: { index: false } };

// Корзина живёт в браузере (localStorage), серверу здесь отдавать нечего.
export default function CartPage() {
  return (
    <div className={cn(CONTAINER, "flex flex-col gap-6 pt-6 pb-24 sm:gap-7 sm:pt-10")}>
      <StepsHeading script="Собираем рюкзак" title="Корзина" current={1} />
      <CartView />
    </div>
  );
}
