// Учебная «база данных» в памяти процесса. Живёт на globalThis, чтобы переживать
// горячую перезагрузку модулей в dev-режиме. Перезапуск сервера сбрасывает данные.

import "server-only";
import { addDays, rangesOverlap, todayIso } from "@/lib/domain/dates";
import type { DateRange } from "@/lib/domain/dates";
import { computeTotals } from "@/lib/domain/pricing";
import type { Booking, User } from "@/lib/api/types";
import { findItem, INVENTORY } from "./data";

export type StoredUser = User & { password: string };
export type Session = { userId: string; expiresAt: number };
export type StoredBooking = Booking & { userId: string; fingerprint: string };

type Store = {
  users: StoredUser[];
  accessTokens: Map<string, Session>;
  refreshTokens: Map<string, Session>;
  bookings: StoredBooking[];
  /** `${userId}:${Idempotency-Key}` → id брони. */
  idempotency: Map<string, string>;
  paymentAttempts: Map<string, number>;
  sequence: number;
};

const globalStore = globalThis as unknown as { __rentalStore?: Store };

export function db(): Store {
  globalStore.__rentalStore ??= seed();
  return globalStore.__rentalStore;
}

function seed(): Store {
  const user: StoredUser = {
    id: "u-1",
    name: "Алексей Демо",
    email: "demo@prokat.test",
    phone: "+79990001122",
    password: "demo1234",
  };
  const store: Store = {
    users: [user],
    accessTokens: new Map(),
    refreshTokens: new Map(),
    bookings: [],
    idempotency: new Map(),
    paymentAttempts: new Map(),
    sequence: 1040,
  };

  // Прошлая бронь, чтобы история не была пустой.
  const today = todayIso();
  const range = { from: addDays(today, -40), to: addDays(today, -37) };
  const lines = [
    { itemId: "tent-trek-2", qty: 1 },
    { itemId: "mat-foam", qty: 2 },
  ].map(({ itemId, qty }) => {
    const item = findItem(itemId)!;
    return { itemId, title: item.title, qty, pricePerDay: item.pricePerDay, deposit: item.deposit };
  });
  const services = { insurance: true, delivery: false };
  store.bookings.push({
    id: "b-seed-1",
    number: "PR-1039",
    status: "confirmed",
    createdAt: new Date(Date.now() - 45 * 86400_000).toISOString(),
    range,
    lines,
    services,
    contact: { name: user.name, phone: user.phone, email: user.email, comment: "" },
    totals: computeTotals(lines, 3, services),
    userId: user.id,
    fingerprint: "seed",
  });
  return store;
}

export function nextBookingNumber(): string {
  const store = db();
  store.sequence += 1;
  return `PR-${store.sequence}`;
}

/** Свободный остаток позиции на период. Неоплаченные брони тоже держат снаряжение. */
export function availableFor(itemId: string, range: DateRange, excludeBookingId?: string): number {
  const item = findItem(itemId);
  if (!item) return 0;
  const reserved = db()
    .bookings.filter(
      (b) => b.status !== "cancelled" && b.id !== excludeBookingId && rangesOverlap(b.range, range),
    )
    .flatMap((b) => b.lines)
    .filter((l) => l.itemId === itemId)
    .reduce((acc, l) => acc + l.qty, 0);
  return Math.max(0, item.stock - reserved);
}

/** Имитация чужой брони: забирает весь остаток позиции на период. */
export function reserveByAnotherCustomer(itemId: string, range: DateRange): void {
  const item = findItem(itemId);
  const free = availableFor(itemId, range);
  if (!item || free === 0) return;
  const lines = [{ itemId, title: item.title, qty: free, pricePerDay: item.pricePerDay, deposit: item.deposit }];
  const services = { insurance: false, delivery: false };
  db().bookings.push({
    id: `b-other-${crypto.randomUUID()}`,
    number: nextBookingNumber(),
    status: "confirmed",
    createdAt: new Date().toISOString(),
    range,
    lines,
    services,
    contact: { name: "Другой клиент", phone: "", email: "", comment: "" },
    totals: computeTotals(lines, 1, services),
    userId: "someone-else",
    fingerprint: "phantom",
  });
}

export function toPublicBooking(b: StoredBooking): Booking {
  const { userId: _userId, fingerprint: _fingerprint, ...booking } = b;
  return booking;
}

export { INVENTORY };
