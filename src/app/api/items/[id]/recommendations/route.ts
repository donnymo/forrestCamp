import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { todayIso, validateRange } from "@/lib/domain/dates";
import { findItem, INVENTORY } from "@/server/mock/data";
import { toSummary } from "@/server/mock/catalog";
import { apiError, delay, scenarioOf } from "@/server/mock/http";

// GET /api/items/:id/recommendations?from&to — «с этим берут».
export async function GET(req: NextRequest, ctx: RouteContext<"/api/items/[id]/recommendations">) {
  await delay(900);
  if (scenarioOf(req) === "recs-down") {
    return apiError(500, "unavailable", "Сервис рекомендаций не ответил");
  }
  const { id } = await ctx.params;
  const item = findItem(id);
  if (!item) return apiError(404, "not_found", "Позиция не найдена");
  const sp = req.nextUrl.searchParams;
  const range = validateRange(sp.get("from"), sp.get("to"), todayIso());
  if (!range.ok) return apiError(400, "validation_error", range.message);

  // Сопутствующие категории: к сапу — гермомешок, к палатке — спальник и т. п.
  const companions: Record<string, string[]> = {
    tents: ["sleeping", "cooking"],
    sup: ["sup", "backpacks"],
    sleeping: ["tents", "sleeping"],
    backpacks: ["sleeping", "cooking"],
    cooking: ["tents", "cooking"],
  };
  const wanted = companions[item.category];
  const items = INVENTORY.filter((i) => i.id !== id && wanted.includes(i.category))
    .sort((a, b) => b.popularity - a.popularity)
    .slice(0, 4)
    .map((i) => toSummary(i, range.range));
  return NextResponse.json({ items });
}
