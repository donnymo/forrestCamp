import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Пустое/ошибочное состояние блока: иконка в круге, рукописная подпись, заголовок, действия. */
export function EmptyState({
  icon,
  script,
  title,
  text,
  children,
  tone = "neutral",
  headingLevel = 2,
}: {
  icon: ReactNode;
  script?: string;
  title: string;
  text?: ReactNode;
  children?: ReactNode;
  tone?: "neutral" | "error";
  headingLevel?: 1 | 2;
}) {
  const Heading = headingLevel === 1 ? "h1" : "h2";
  return (
    <div
      role={tone === "error" ? "alert" : undefined}
      className={cn(
        "flex flex-col items-center gap-2.5 rounded-2xl bg-white px-6 py-12 text-center",
        tone === "error" ? "border border-red-200" : "border border-dashed border-line-strong",
      )}
    >
      <span
        className={cn(
          "mb-1 flex size-14 items-center justify-center rounded-full [&_svg]:size-6",
          tone === "error" ? "bg-red-50 text-destructive" : "bg-sand text-primary",
        )}
      >
        {icon}
      </span>
      {script ? <span className="font-script text-[28px] leading-none text-bark-text">{script}</span> : null}
      <Heading className="font-heading text-lg font-bold">{title}</Heading>
      {text ? <p className="max-w-[440px] text-sm leading-relaxed text-muted-foreground">{text}</p> : null}
      {children ? <div className="mt-2 flex flex-wrap justify-center gap-2">{children}</div> : null}
    </div>
  );
}
