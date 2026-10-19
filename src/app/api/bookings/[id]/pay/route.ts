import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { authenticate } from "@/server/mock/auth";
import { db, toPublicBooking } from "@/server/mock/store";
import { apiError, delay, scenarioOf } from "@/server/mock/http";

// POST /api/bookings/:id/pay — имитация платёжного шага, без реальных денег.
// Идемпотентно: оплаченная бронь просто возвращается.
export async function POST(req: NextRequest, ctx: RouteContext<"/api/bookings/[id]/pay">) {
  await delay(800);
  const user = authenticate(req);
  if (!user) return apiError(401, "unauthorized", "Требуется вход");
  const { id } = await ctx.params;
  const store = db();
  const booking = store.bookings.find((b) => b.id === id && b.userId === user.id);
  if (!booking) return apiError(404, "not_found", "Бронь не найдена");

  if (booking.status === "confirmed") return NextResponse.json({ booking: toPublicBooking(booking) });
  if (booking.status === "cancelled") {
    return apiError(409, "conflict", "Бронь отменена — оформите заказ заново", { items: [] });
  }

  const attempt = (store.paymentAttempts.get(id) ?? 0) + 1;
  store.paymentAttempts.set(id, attempt);
  // Сценарий «сбой оплаты»: первая попытка по каждой брони отклоняется.
  if (scenarioOf(req) === "payment-fail" && attempt === 1) {
    return apiError(402, "payment_failed", "Платёжный шлюз отклонил операцию. Деньги не списаны.");
  }

  booking.status = "confirmed";
  return NextResponse.json({ booking: toPublicBooking(booking) });
}
