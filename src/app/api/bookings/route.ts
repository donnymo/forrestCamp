import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { rentalDays, todayIso, validateRange } from "@/lib/domain/dates";
import { validateContact } from "@/lib/domain/contact";
import { computeTotals } from "@/lib/domain/pricing";
import type { AvailabilityInfo } from "@/lib/cart/model";
import type { BookingLine } from "@/lib/api/types";
import { findItem } from "@/server/mock/data";
import { authenticate } from "@/server/mock/auth";
import {
  availableFor,
  db,
  nextBookingNumber,
  reserveByAnotherCustomer,
  toPublicBooking,
} from "@/server/mock/store";
import type { StoredBooking } from "@/server/mock/store";
import { apiError, delay, scenarioOf, SCENARIO_COOKIE } from "@/server/mock/http";

// GET /api/bookings — история текущего клиента.
export async function GET(req: NextRequest) {
  await delay(300);
  const user = authenticate(req);
  if (!user) return apiError(401, "unauthorized", "Требуется вход");
  const bookings = db()
    .bookings.filter((b) => b.userId === user.id)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .map(toPublicBooking);
  return NextResponse.json({ bookings });
}

type CreateBody = {
  range?: { from?: unknown; to?: unknown };
  lines?: { itemId?: unknown; qty?: unknown }[];
  services?: { insurance?: unknown; delivery?: unknown };
  contact?: Record<string, unknown>;
};

// POST /api/bookings — создаёт бронь в статусе pending_payment.
// Заголовок Idempotency-Key обязателен: повтор с тем же ключом возвращает ту же бронь.
export async function POST(req: NextRequest) {
  await delay(500);
  const user = authenticate(req);
  if (!user) return apiError(401, "unauthorized", "Требуется вход");

  const key = req.headers.get("idempotency-key");
  if (!key || key.length < 8) {
    return apiError(400, "validation_error", "Нужен заголовок Idempotency-Key");
  }

  const raw = await req.text();
  let body: CreateBody | null = null;
  try {
    body = JSON.parse(raw) as CreateBody;
  } catch {
    return apiError(400, "validation_error", "Тело запроса не JSON");
  }

  const store = db();
  const idemKey = `${user.id}:${key}`;
  const existingId = store.idempotency.get(idemKey);
  if (existingId) {
    const existing = store.bookings.find((b) => b.id === existingId)!;
    if (existing.fingerprint !== raw) {
      return apiError(422, "validation_error", "Ключ идемпотентности уже использован для другого заказа");
    }
    return NextResponse.json({ booking: toPublicBooking(existing), replayed: true });
  }

  // ——— Валидация ———
  const fields: Record<string, string> = {};
  const range = validateRange(body?.range?.from, body?.range?.to, todayIso());
  if (!range.ok) fields.dates = range.message;
  const contactErrors = validateContact(body?.contact ?? {});
  Object.assign(fields, contactErrors);

  const rawLines = Array.isArray(body?.lines) ? body.lines : [];
  if (rawLines.length === 0) fields.lines = "Корзина пуста";
  const requested: { itemId: string; qty: number }[] = [];
  for (const l of rawLines) {
    const itemId = String(l?.itemId ?? "");
    const qty = Number(l?.qty);
    if (!findItem(itemId)) fields.lines = `Позиции ${itemId} нет в каталоге`;
    else if (!Number.isInteger(qty) || qty < 1 || qty > 10) fields.lines = "Количество от 1 до 10";
    else requested.push({ itemId, qty });
  }
  if (!range.ok || Object.keys(fields).length > 0) {
    return apiError(422, "validation_error", "Проверьте данные заказа", { fields });
  }

  // Новая попытка заменяет брошенные неоплаченные брони клиента, чтобы они не держали остатки.
  for (const b of store.bookings) {
    if (b.userId === user.id && b.status === "pending_payment") b.status = "cancelled";
  }

  // Учебный сценарий: кто-то успел забрать первую позицию, пока клиент заполнял форму.
  const scenario = scenarioOf(req);
  if (scenario === "conflict") reserveByAnotherCustomer(requested[0].itemId, range.range);

  // ——— Наличие ———
  const shortages: AvailabilityInfo[] = requested
    .map((l) => ({ itemId: l.itemId, available: availableFor(l.itemId, range.range), qty: l.qty }))
    .filter((l) => l.available < l.qty)
    .map(({ itemId, available }) => ({ itemId, available }));
  if (shortages.length > 0) {
    const res = apiError(409, "conflict", "Часть позиций уже недоступна на выбранные даты", {
      items: shortages,
    });
    // Конфликт — разовый сценарий, дальше система ведёт себя честно.
    if (scenario === "conflict") res.cookies.delete(SCENARIO_COOKIE);
    return res;
  }

  // ——— Создание ———
  const lines: BookingLine[] = requested.map(({ itemId, qty }) => {
    const item = findItem(itemId)!;
    return { itemId, title: item.title, qty, pricePerDay: item.pricePerDay, deposit: item.deposit };
  });
  const services = {
    insurance: body?.services?.insurance === true,
    delivery: body?.services?.delivery === true,
  };
  const contact = body!.contact as { name: string; phone: string; email: string; comment?: string };
  const booking: StoredBooking = {
    id: `b-${crypto.randomUUID()}`,
    number: nextBookingNumber(),
    status: "pending_payment",
    createdAt: new Date().toISOString(),
    range: range.range,
    lines,
    services,
    contact: {
      name: contact.name.trim(),
      phone: contact.phone.trim(),
      email: contact.email.trim(),
      comment: (contact.comment ?? "").trim(),
    },
    totals: computeTotals(lines, rentalDays(range.range), services),
    userId: user.id,
    fingerprint: raw,
  };
  store.bookings.push(booking);
  store.idempotency.set(idemKey, booking.id);
  return NextResponse.json({ booking: toPublicBooking(booking) }, { status: 201 });
}
