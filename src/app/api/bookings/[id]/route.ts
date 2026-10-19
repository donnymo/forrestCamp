import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { authenticate } from "@/server/mock/auth";
import { db, toPublicBooking } from "@/server/mock/store";
import { apiError, delay } from "@/server/mock/http";

export async function GET(req: NextRequest, ctx: RouteContext<"/api/bookings/[id]">) {
  await delay(200);
  const user = authenticate(req);
  if (!user) return apiError(401, "unauthorized", "Требуется вход");
  const { id } = await ctx.params;
  const booking = db().bookings.find((b) => b.id === id && b.userId === user.id);
  if (!booking) return apiError(404, "not_found", "Бронь не найдена");
  return NextResponse.json({ booking: toPublicBooking(booking) });
}
