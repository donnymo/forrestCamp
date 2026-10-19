// Даты аренды хранятся как ISO-строки YYYY-MM-DD без времени и часового пояса.
// Вся арифметика идёт в UTC, чтобы «день» не съезжал при переходе на летнее время.

export type IsoDate = string;
export type DateRange = { from: IsoDate; to: IsoDate };

export const MIN_RENTAL_DAYS = 1;
export const MAX_RENTAL_DAYS = 21;
export const MAX_ADVANCE_DAYS = 180;

const ISO_RE = /^\d{4}-\d{2}-\d{2}$/;
const DAY_MS = 24 * 60 * 60 * 1000;

export function parseIsoDate(value: unknown): Date | null {
  if (typeof value !== "string" || !ISO_RE.test(value)) return null;
  const date = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return null;
  // Отсекаем «2026-02-31», которые Date молча превращает в март.
  return toIsoDate(date) === value ? date : null;
}

export function toIsoDate(date: Date): IsoDate {
  return date.toISOString().slice(0, 10);
}

export function todayIso(now: Date = new Date()): IsoDate {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function addDays(iso: IsoDate, days: number): IsoDate {
  const date = parseIsoDate(iso);
  if (!date) throw new Error(`Invalid ISO date: ${iso}`);
  return toIsoDate(new Date(date.getTime() + days * DAY_MS));
}

export function diffDays(from: IsoDate, to: IsoDate): number {
  const a = parseIsoDate(from);
  const b = parseIsoDate(to);
  if (!a || !b) return NaN;
  return Math.round((b.getTime() - a.getTime()) / DAY_MS);
}

/** Количество оплачиваемых суток: от даты выдачи до даты возврата. */
export function rentalDays(range: DateRange): number {
  return diffDays(range.from, range.to);
}

export function defaultRange(today: IsoDate): DateRange {
  const from = addDays(today, 1);
  return { from, to: addDays(from, 2) };
}

export function sameRange(a: DateRange | null, b: DateRange | null): boolean {
  return a?.from === b?.from && a?.to === b?.to;
}

/** Пересекаются ли полуинтервалы [from, to) — день возврата свободен для новой выдачи. */
export function rangesOverlap(a: DateRange, b: DateRange): boolean {
  return a.from < b.to && b.from < a.to;
}

export type RangeIssue = "missing" | "format" | "past" | "order" | "too_long" | "too_far";

export type RangeValidation =
  | { ok: true; range: DateRange }
  | { ok: false; issue: RangeIssue; message: string };

export function validateRange(from: unknown, to: unknown, today: IsoDate): RangeValidation {
  if (from == null || from === "" || to == null || to === "") {
    return { ok: false, issue: "missing", message: "Укажите даты выдачи и возврата." };
  }
  if (!parseIsoDate(from) || !parseIsoDate(to)) {
    return { ok: false, issue: "format", message: "Дата указана в неверном формате." };
  }
  const range = { from: from as IsoDate, to: to as IsoDate };
  if (range.from < today) {
    return { ok: false, issue: "past", message: "Дата выдачи уже прошла." };
  }
  const days = rentalDays(range);
  if (days < MIN_RENTAL_DAYS) {
    return { ok: false, issue: "order", message: "Дата возврата должна быть позже даты выдачи." };
  }
  if (days > MAX_RENTAL_DAYS) {
    return {
      ok: false,
      issue: "too_long",
      message: `Максимальный срок аренды — ${MAX_RENTAL_DAYS} сут.`,
    };
  }
  if (diffDays(today, range.from) > MAX_ADVANCE_DAYS) {
    return {
      ok: false,
      issue: "too_far",
      message: `Бронировать можно не дальше чем на ${MAX_ADVANCE_DAYS} дней вперёд.`,
    };
  }
  return { ok: true, range };
}

const MONTHS = ["янв", "фев", "мар", "апр", "мая", "июн", "июл", "авг", "сен", "окт", "ноя", "дек"];

export function formatDate(iso: IsoDate): string {
  const [y, m, d] = iso.split("-").map(Number);
  return `${d} ${MONTHS[m - 1]} ${y}`;
}

export function formatRange(range: DateRange): string {
  return `${formatDate(range.from)} — ${formatDate(range.to)}`;
}

export function pluralDays(n: number): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return `${n} сутки`;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return `${n} суток`;
  return `${n} суток`;
}
