import { defaultRange, validateRange } from "./dates.ts";
import type { DateRange, IsoDate } from "./dates.ts";

export const CATEGORIES = [
  { id: "tents", label: "Палатки и тенты" },
  { id: "sup", label: "Сапборды" },
  { id: "sleeping", label: "Спальники и коврики" },
  { id: "backpacks", label: "Рюкзаки" },
  { id: "cooking", label: "Кухня и лагерь" },
] as const;

export type CategoryId = (typeof CATEGORIES)[number]["id"];

export const SORTS = [
  { id: "popular", label: "Сначала популярные" },
  { id: "price_asc", label: "Сначала дешевле" },
  { id: "price_desc", label: "Сначала дороже" },
  { id: "title", label: "По названию" },
] as const;

export type SortId = (typeof SORTS)[number]["id"];

export const PAGE_SIZE = 9;

export type CatalogQuery = {
  range: DateRange;
  category: CategoryId | null;
  priceMin: number | null;
  priceMax: number | null;
  availableOnly: boolean;
  sort: SortId;
  page: number;
};

/** Объяснение, почему параметр из ссылки был заменён безопасным значением. */
export type ParamNotice = { param: string; message: string };

type RawParams = Record<string, string | string[] | undefined>;

export function categoryLabel(id: string): string {
  return CATEGORIES.find((c) => c.id === id)?.label ?? id;
}

export function isCategory(value: unknown): value is CategoryId {
  return CATEGORIES.some((c) => c.id === value);
}

function isSort(value: unknown): value is SortId {
  return SORTS.some((s) => s.id === value);
}

function first(raw: RawParams, key: string): string | undefined {
  const value = raw[key];
  return Array.isArray(value) ? value[0] : value;
}

function parsePrice(value: string | undefined): number | null | "invalid" {
  if (value === undefined || value === "") return null;
  if (!/^\d{1,7}$/.test(value)) return "invalid";
  return Number(value);
}

/** Даты из ссылки. Отсутствие — молча подставляем период по умолчанию, ошибка — объясняем. */
export function parseRangeParams(
  raw: RawParams,
  today: IsoDate,
): { range: DateRange; notice: ParamNotice | null } {
  const from = first(raw, "from");
  const to = first(raw, "to");
  if (from === undefined && to === undefined) {
    return { range: defaultRange(today), notice: null };
  }
  const check = validateRange(from, to, today);
  if (check.ok) return { range: check.range, notice: null };
  const fallback = defaultRange(today);
  return {
    range: fallback,
    notice: {
      param: "dates",
      message: `${check.message} Показаны ближайшие доступные даты по умолчанию.`,
    },
  };
}

export function parseCatalogQuery(
  raw: RawParams,
  today: IsoDate,
): { query: CatalogQuery; notices: ParamNotice[] } {
  const notices: ParamNotice[] = [];

  const { range, notice: rangeNotice } = parseRangeParams(raw, today);
  if (rangeNotice) notices.push(rangeNotice);

  let category: CategoryId | null = null;
  const rawCategory = first(raw, "category");
  if (rawCategory) {
    if (isCategory(rawCategory)) category = rawCategory;
    else notices.push({ param: "category", message: "Такой категории нет — показаны все категории." });
  }

  let priceMin = parsePrice(first(raw, "priceMin"));
  let priceMax = parsePrice(first(raw, "priceMax"));
  if (priceMin === "invalid" || priceMax === "invalid") {
    notices.push({ param: "price", message: "Некорректный фильтр цены сброшен." });
    if (priceMin === "invalid") priceMin = null;
    if (priceMax === "invalid") priceMax = null;
  }
  if (priceMin !== null && priceMax !== null && priceMin > priceMax) {
    [priceMin, priceMax] = [priceMax, priceMin];
    notices.push({ param: "price", message: "Минимальная цена была больше максимальной — границы поменяли местами." });
  }

  let sort: SortId = "popular";
  const rawSort = first(raw, "sort");
  if (rawSort) {
    if (isSort(rawSort)) sort = rawSort;
    else notices.push({ param: "sort", message: "Неизвестная сортировка заменена на «Сначала популярные»." });
  }

  let page = 1;
  const rawPage = first(raw, "page");
  if (rawPage !== undefined) {
    if (/^\d{1,4}$/.test(rawPage) && Number(rawPage) >= 1) page = Number(rawPage);
    else notices.push({ param: "page", message: "Номер страницы некорректен — открыта первая страница." });
  }

  const availableOnly = first(raw, "available") === "1";

  return {
    query: { range, category, priceMin, priceMax, availableOnly, sort, page },
    notices,
  };
}

/** Страница за пределами выдачи заменяется последней существующей. */
export function clampPage(
  query: CatalogQuery,
  totalPages: number,
): { query: CatalogQuery; notice: ParamNotice | null } {
  const last = Math.max(1, totalPages);
  if (query.page <= last) return { query, notice: null };
  return {
    query: { ...query, page: last },
    notice: {
      param: "page",
      message: `Страницы ${query.page} нет в выдаче — открыта последняя, ${last}-я.`,
    },
  };
}

/** Каноничный вид параметров: значения по умолчанию в ссылку не попадают. */
export function catalogSearchParams(query: CatalogQuery): URLSearchParams {
  const params = new URLSearchParams();
  params.set("from", query.range.from);
  params.set("to", query.range.to);
  if (query.category) params.set("category", query.category);
  if (query.priceMin !== null) params.set("priceMin", String(query.priceMin));
  if (query.priceMax !== null) params.set("priceMax", String(query.priceMax));
  if (query.availableOnly) params.set("available", "1");
  if (query.sort !== "popular") params.set("sort", query.sort);
  if (query.page !== 1) params.set("page", String(query.page));
  return params;
}

export function catalogHref(query: CatalogQuery): string {
  return `/catalog?${catalogSearchParams(query).toString()}`;
}

export function rangeSearch(range: DateRange): string {
  return new URLSearchParams({ from: range.from, to: range.to }).toString();
}

/** Страница позиции на выбранные даты — цена и наличие сразу посчитаны на них. */
export function itemHref(itemId: string, range: DateRange): string {
  return `/items/${encodeURIComponent(itemId)}?${rangeSearch(range)}`;
}
