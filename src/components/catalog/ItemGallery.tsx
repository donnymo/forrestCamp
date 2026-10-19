"use client";

import { useState } from "react";
import type { CSSProperties, ReactNode } from "react";
import { ItemImage } from "@/components/ItemImage";
import { cn } from "@/lib/utils";

// Пока у позиции одно фото, дополнительные «виды» — его крупные планы.
const VIEWS: CSSProperties[] = [
  {},
  { transform: "scale(1.6)", objectPosition: "30% 70%" },
  { transform: "scale(1.9) translate(-12%, 0)" },
  { transform: "scale(1.9) translate(12%, 4%)" },
];

export function ItemGallery({
  id,
  category,
  title,
  badge,
}: {
  id: string;
  category: string;
  title: string;
  badge?: ReactNode;
}) {
  const [active, setActive] = useState(0);
  return (
    <div className="flex min-w-0 flex-[1_1_520px] flex-col gap-3.5">
      <div className="relative aspect-[4/3] overflow-hidden rounded-[20px] bg-muted">
        <ItemImage
          id={id}
          category={category}
          alt={`${title} — вид ${active + 1}`}
          style={VIEWS[active]}
          sizes="(max-width: 1024px) 100vw, 600px"
          priority
          className="transition-transform duration-300"
        />
        {badge ? <div className="absolute top-[18px] left-[18px]">{badge}</div> : null}
      </div>
      <div className="grid grid-cols-4 gap-2 sm:gap-3">
        {VIEWS.map((view, i) => (
          <button
            key={i}
            type="button"
            aria-label={`Вид ${i + 1}`}
            aria-pressed={active === i}
            onClick={() => setActive(i)}
            className={cn(
              "aspect-[4/3] overflow-hidden rounded-xl outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
              active === i ? "ring-2 ring-primary" : "opacity-80 ring-1 ring-line hover:opacity-100",
            )}
          >
            <ItemImage id={id} category={category} alt="" style={view} sizes="140px" />
          </button>
        ))}
      </div>
    </div>
  );
}
