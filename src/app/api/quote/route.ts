import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { todayIso, validateRange } from "@/lib/domain/dates";
import type { QuoteResponse } from "@/lib/api/types";
import { findItem } from "@/server/mock/data";
import { availableFor } from "@/server/mock/store";
import { apiError, delay, readJson } from "@/server/mock/http";

// POST /api/quote — актуальные цены и остатки для состава корзины. Ничего не бронирует.
export async function POST(req: NextRequest) {
  await delay(300);
  const body = (await readJson(req)) as {
    range?: { from?: unknown; to?: unknown };
    lines?: { itemId?: unknown }[];
  } | null;
  const range = validateRange(body?.range?.from, body?.range?.to, todayIso());
  if (!range.ok) {
    return apiError(422, "validation_error", range.message, { fields: { dates: range.message } });
  }
  if (!Array.isArray(body?.lines)) {
    return apiError(422, "validation_error", "Не передан состав корзины");
  }
  const lines: QuoteResponse["lines"] = body.lines.map((l) => {
    const itemId = String(l?.itemId ?? "");
    const item = findItem(itemId);
    return item
      ? {
          itemId,
          title: item.title,
          pricePerDay: item.pricePerDay,
          deposit: item.deposit,
          available: availableFor(itemId, range.range),
        }
      : { itemId, title: "Снято с проката", pricePerDay: 0, deposit: 0, available: 0 };
  });
  return NextResponse.json<QuoteResponse>({ range: range.range, lines });
}
