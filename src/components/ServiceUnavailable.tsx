import type { ReactNode } from "react";
import { CloudOff } from "lucide-react";
import { RetryButton } from "@/components/Boundaries";
import { EmptyState } from "@/components/EmptyState";

/** Высота и форма кнопок в состоянии ошибки — чтобы «Повторить» и соседние стояли ровно. */
export const ERROR_ACTION = "h-10 rounded-[10px] px-4 text-sm";

/**
 * Временный сбой API (сеть, 5xx): объяснение и повтор без перезагрузки страницы.
 * children — дополнительные действия рядом с «Повторить».
 */
export function ServiceUnavailable({
  title,
  text,
  headingLevel = 2,
  children,
}: {
  title: string;
  text?: ReactNode;
  headingLevel?: 1 | 2;
  children?: ReactNode;
}) {
  return (
    <EmptyState tone="error" icon={<CloudOff />} script="Связь пропала" title={title} text={text} headingLevel={headingLevel}>
      <RetryButton className={ERROR_ACTION} />
      {children}
    </EmptyState>
  );
}
