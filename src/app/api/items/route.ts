import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { isCategory, PAGE_SIZE } from "@/lib/domain/catalog";
import { todayIso, validateRange } from "@/lib/domain/dates";
import type { CatalogPage } from "@/lib/api/types";
import { INVENTORY } from "@/server/mock/data";
import { toSummary } from "@/server/mock/catalog";
import { apiError, delay, scenarioOf } from "@/server/mock/http";

// GET /api/items?from&to&category&priceMin&priceMax&available=1&sort&page&pageSize
export async function GET(req: NextRequest) {
  await delay(350);
  if (scenarioOf(req) === "catalog-down") {
    return apiError(503, "unavailable", "Каталог временно недоступен, попробуйте через минуту.");
  }

  const sp = req.nextUrl.searchParams;
  const fields: Record<string, string> = {};

  const range = validateRange(sp.get("from"), sp.get("to"), todayIso());
  if (!range.ok) fields.dates = range.message;

  const category = sp.get("category");
  if (category && !isCategory(category)) fields.category = "Неизвестная категория";

  const num = (key: string) => {
    const raw = sp.get(key);
    if (raw === null || raw === "") return null;
    if (!/^\d+$/.test(raw)) {
      fields[key] = "Ожидается целое неотрицательное число";
      return null;
    }
    return Number(raw);
  };
  const priceMin = num("priceMin");
  const priceMax = num("priceMax");
  const page = num("page") ?? 1;
  const pageSize = Math.min(num("pageSize") ?? PAGE_SIZE, 30);
  if (page < 1) fields.page = "Страницы нумеруются с 1";
  if (pageSize < 1) fields.pageSize = "Размер страницы от 1";

  if (!range.ok || Object.keys(fields).length > 0) {
    return apiError(400, "validation_error", "Некорректные параметры каталога", { fields });
  }

  // Сначала все фильтры, кроме категории, — для счётчиков по категориям.
  let filtered = INVENTORY.filter(
    (i) =>
      (priceMin === null || i.pricePerDay >= priceMin) &&
      (priceMax === null || i.pricePerDay <= priceMax),
  ).map((i) => ({ summary: toSummary(i, range.range), popularity: i.popularity }));
  if (sp.get("available") === "1") filtered = filtered.filter((i) => i.summary.available > 0);

  const categoryCounts: Record<string, number> = {};
  for (const i of filtered) {
    categoryCounts[i.summary.category] = (categoryCounts[i.summary.category] ?? 0) + 1;
  }

  const items = category ? filtered.filter((i) => i.summary.category === category) : filtered;

  const sort = sp.get("sort") ?? "popular";
  items.sort((a, b) => {
    switch (sort) {
      case "price_asc":
        return a.summary.pricePerDay - b.summary.pricePerDay;
      case "price_desc":
        return b.summary.pricePerDay - a.summary.pricePerDay;
      case "title":
        return a.summary.title.localeCompare(b.summary.title, "ru");
      default:
        return b.popularity - a.popularity;
    }
  });

  const total = items.length;
  const totalPages = Math.ceil(total / pageSize);
  // Страница за пределами выдачи — не ошибка: отдаём пустой список и totalPages,
  // чтобы клиент сам решил, на какую страницу перейти.
  const body: CatalogPage = {
    items: items.slice((page - 1) * pageSize, page * pageSize).map((i) => i.summary),
    page,
    pageSize,
    total,
    totalPages,
    categoryCounts,
  };
  return NextResponse.json(body);
}
