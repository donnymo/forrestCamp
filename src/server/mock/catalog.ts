import type { DateRange } from "@/lib/domain/dates";
import type { ItemDetail, ItemSummary } from "@/lib/api/types";
import type { InventoryItem } from "./data";
import { rulesFor } from "./data";
import { availableFor } from "./store";

export function toSummary(item: InventoryItem, range: DateRange): ItemSummary {
  return {
    id: item.id,
    title: item.title,
    category: item.category,
    pricePerDay: item.pricePerDay,
    deposit: item.deposit,
    available: availableFor(item.id, range),
    highlights: item.specs.slice(0, 3).map(([, value]) => value),
  };
}

export function toDetail(item: InventoryItem, range: DateRange): ItemDetail {
  return {
    ...toSummary(item, range),
    description: item.description,
    specs: item.specs,
    rules: rulesFor(item.category),
    photos: 3,
  };
}
