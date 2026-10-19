import Image from "next/image";
import type { CSSProperties } from "react";
import { itemPhoto } from "@/lib/photos";
import { cn } from "@/lib/utils";

/**
 * Фото позиции. Родитель задаёт размер, фото заполняет его с обрезкой.
 * category — запасное фото, если у позиции нет своего (в брони категория не хранится).
 */
export function ItemImage({
  id,
  category,
  alt,
  className,
  style,
  sizes = "(max-width: 640px) 100vw, 400px",
  priority,
}: {
  id: string;
  category?: string;
  alt: string;
  className?: string;
  style?: CSSProperties;
  sizes?: string;
  priority?: boolean;
}) {
  return (
    <Image
      src={itemPhoto(id, category)}
      alt={alt}
      width={960}
      height={720}
      sizes={sizes}
      priority={priority}
      className={cn("block h-full w-full object-cover", className)}
      style={style}
    />
  );
}
