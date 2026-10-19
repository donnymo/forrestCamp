import { Check } from "lucide-react";
import { SectionHeading } from "@/components/SectionHeading";
import { cn } from "@/lib/utils";

const STEPS = ["Корзина", "Контакты и оплата", "Готово"];

type StepNumber = 1 | 2 | 3;

/** Шаги оформления: пройденные — галочкой, текущий — залитым кругом. */
export function Steps({ current }: { current: StepNumber }) {
  return (
    <ol aria-label="Шаги оформления" className="flex flex-wrap items-center gap-1.5 text-sm sm:gap-2.5">
      {STEPS.map((label, i) => {
        const n = i + 1;
        const done = n < current;
        const active = n === current;
        return (
          <li key={label} className="flex items-center gap-1.5 sm:gap-2.5">
            {i > 0 ? <span aria-hidden className={cn("h-px w-4 sm:w-8", n <= current ? "bg-primary" : "bg-stone-300")} /> : null}
            <span
              aria-current={active ? "step" : undefined}
              className={cn("flex items-center gap-2", active ? "font-semibold" : done ? "text-stone-600" : "text-muted-foreground")}
            >
              <span
                className={cn(
                  "flex size-7 flex-none items-center justify-center rounded-full text-[13px]",
                  active && "bg-primary text-white",
                  done && "bg-primary-soft text-primary",
                  !active && !done && "border border-stone-300",
                )}
              >
                {done ? <Check className="size-3.5" strokeWidth={3} /> : n}
              </span>
              {/* На телефоне все подписи в строку не влезают — видна только текущая. */}
              <span className={cn(!active && "max-sm:sr-only")}>{label}</span>
            </span>
          </li>
        );
      })}
    </ol>
  );
}

/** Заголовок страниц корзины и оформления: название слева, шаги справа (на телефоне — под ним). */
export function StepsHeading({ script, title, current }: { script: string; title: string; current: StepNumber }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4 sm:gap-5">
      <SectionHeading as="h1" script={script} title={title} align="left" />
      <Steps current={current} />
    </div>
  );
}
