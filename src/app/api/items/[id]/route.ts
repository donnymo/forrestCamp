import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { todayIso, validateRange } from "@/lib/domain/dates";
import { findItem } from "@/server/mock/data";
import { toDetail } from "@/server/mock/catalog";
import { apiError, delay, scenarioOf } from "@/server/mock/http";

// GET /api/items/:id?from&to
export async function GET(req: NextRequest, ctx: RouteContext<"/api/items/[id]">) {
  await delay(250);
  if (scenarioOf(req) === "catalog-down") {
    return apiError(503, "unavailable", "Каталог временно недоступен, попробуйте через минуту.");
  }
  const { id } = await ctx.params;
  const sp = req.nextUrl.searchParams;
  const range = validateRange(sp.get("from"), sp.get("to"), todayIso());
  if (!range.ok) {
    return apiError(400, "validation_error", range.message, { fields: { dates: range.message } });
  }
  const item = findItem(id);
  if (!item) return apiError(404, "not_found", "Позиция не найдена");
  return NextResponse.json(toDetail(item, range.range));
}
