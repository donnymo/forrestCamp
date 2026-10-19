import type { Metadata } from "next";
import { CheckoutForm } from "@/components/checkout/CheckoutForm";
import { CONTAINER } from "@/components/SectionHeading";
import { StepsHeading } from "@/components/Steps";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Оформление брони", robots: { index: false } };

export default function CheckoutPage() {
  // Без сессии сюда не пустит proxy.ts. Истёкший access-токен обработает
  // клиентский слой запросов при отправке формы.
  return (
    <div className={cn(CONTAINER, "flex flex-col gap-6 pt-6 pb-24 sm:gap-7 sm:pt-10")}>
      <StepsHeading script="Почти в пути" title="Оформление" current={2} />
      <CheckoutForm />
    </div>
  );
}
