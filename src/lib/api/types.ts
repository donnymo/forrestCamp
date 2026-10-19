// Контракт REST API. Его же реализует учебный сервер в src/server/mock.

import type { DateRange } from "../domain/dates.ts";
import type { CategoryId } from "../domain/catalog.ts";
import type { ServiceSelection, Totals } from "../domain/pricing.ts";
import type { AvailabilityInfo, QuoteLine } from "../cart/model.ts";

export type ItemSummary = {
  id: string;
  title: string;
  category: CategoryId;
  pricePerDay: number;
  deposit: number;
  /** Свободно на запрошенный период. */
  available: number;
  /** Две-три ключевые характеристики для карточки: «2 человека · 2,4 кг». */
  highlights: string[];
};

export type ItemDetail = ItemSummary & {
  description: string;
  specs: [label: string, value: string][];
  rules: string[];
  photos: number;
};

export type CatalogPage = {
  items: ItemSummary[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  /** Сколько позиций в каждой категории при текущих фильтрах (без учёта самой категории). */
  categoryCounts: Record<string, number>;
};

export type QuoteRequest = { range: DateRange; lines: { itemId: string; qty: number }[] };
export type QuoteResponse = { range: DateRange; lines: QuoteLine[] };

export type User = { id: string; name: string; email: string; phone: string };

export type Contact = { name: string; phone: string; email: string; comment: string };

export type BookingStatus = "pending_payment" | "confirmed" | "cancelled";

export type BookingLine = {
  itemId: string;
  title: string;
  qty: number;
  pricePerDay: number;
  deposit: number;
};

export type Booking = {
  id: string;
  number: string;
  status: BookingStatus;
  createdAt: string;
  range: DateRange;
  lines: BookingLine[];
  services: ServiceSelection;
  contact: Contact;
  totals: Totals;
};

export type CreateBookingRequest = {
  range: DateRange;
  lines: { itemId: string; qty: number }[];
  services: ServiceSelection;
  contact: Contact;
};

/** Тело любой ошибки API. */
export type ApiErrorBody = {
  error: {
    code:
      | "validation_error"
      | "unauthorized"
      | "forbidden"
      | "not_found"
      | "conflict"
      | "payment_failed"
      | "unavailable";
    message: string;
    fields?: Record<string, string>;
    items?: AvailabilityInfo[];
  };
};
