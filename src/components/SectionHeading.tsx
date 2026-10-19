import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Заголовок секции: рукописное слово над тонким заголовком капсом. */
export function SectionHeading({
  script,
  title,
  text,
  align = "center",
  as: Heading = "h2",
  id,
  size = "lg",
}: {
  script: string;
  title: ReactNode;
  text?: ReactNode;
  align?: "center" | "left";
  as?: "h1" | "h2";
  id?: string;
  size?: "lg" | "md";
}) {
  return (
    <div className={cn("flex flex-col gap-1", align === "center" ? "items-center text-center" : "items-start")}>
      <span className={cn("font-script leading-none text-bark-text", size === "lg" ? "text-[34px]" : "text-[28px]")}>
        {script}
      </span>
      <Heading
        id={id}
        className={cn(
          "font-heading font-light tracking-[0.08em] uppercase",
          size === "lg" ? "text-3xl sm:text-[40px]" : "text-2xl",
        )}
      >
        {title}
      </Heading>
      {text ? <p className="mt-2 max-w-[560px] text-base leading-relaxed text-muted-foreground">{text}</p> : null}
    </div>
  );
}

export const CONTAINER = "mx-auto w-full max-w-[1200px] px-4 sm:px-6";
