"use client";

import { useEffect, useState } from "react";
import { CalendarCheck2, CalendarDays, Info, Moon, Tent, X } from "lucide-react";
import { useCatalogNav } from "./CatalogNav";
import { EdgeCalendarPopover, useEdgePicker } from "@/components/DateRangeFields";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Popover, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { catalogHref, CATEGORIES, SORTS } from "@/lib/domain/catalog";
import type { CatalogQuery, CategoryId, SortId } from "@/lib/domain/catalog";
import { formatDate, pluralDays, rentalDays } from "@/lib/domain/dates";
import { formatRub } from "@/lib/domain/pricing";
import { cn } from "@/lib/utils";

const ALL = "all";

/**
 * Поиск в баннере: категория и период. Каждое изменение сразу применяется к выдаче
 * (отдельной кнопки поиска нет) и сбрасывает страницу на первую.
 */
export function HeroSearch({ query }: { query: CatalogQuery }) {
  const { navigate, isPending } = useCatalogNav();
  const [category, setCategory] = useState<string>(query.category ?? ALL);
  // URL сменился извне (вкладки категорий, назад/вперёд) — подтягиваем поле прямо при рендере.
  const [syncedCategory, setSyncedCategory] = useState(query.category);
  if (syncedCategory !== query.category) {
    setSyncedCategory(query.category);
    setCategory(query.category ?? ALL);
  }

  const apply = (patch: Partial<CatalogQuery>) => navigate(catalogHref({ ...query, ...patch, page: 1 }));
  const { shown: range, pick, popoverProps } = useEdgePicker(query.range, (next) => apply({ range: next }));

  // На телефоне — сетка 2×2 (категория во всю ширину), с md — одна строка с разделителями.
  const cell =
    "flex min-w-0 items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-white transition-colors hover:bg-white/10 sm:gap-3 sm:px-4";
  const label = "text-[13px] text-white/70";
  const value = "text-[15px] font-semibold whitespace-nowrap sm:text-base";
  const icon = "size-5 flex-none text-tan sm:size-[22px]";
  const divider = <span className="hidden h-10 w-px bg-white/20 md:block" aria-hidden />;

  return (
    <div role="search" aria-label="Категория и даты аренды">
      <div className="grid grid-cols-2 gap-1 rounded-[18px] border border-white/20 bg-white/12 p-2 shadow-2xl backdrop-blur-md sm:p-2.5 md:flex md:items-center md:gap-1.5 md:pl-3">
        <Select
          value={category}
          onValueChange={(next) => {
            setCategory(next);
            apply({ category: next === ALL ? null : (next as CategoryId) });
          }}
          disabled={isPending}
        >
          <SelectTrigger
            aria-label="Категория"
            className="col-span-2 w-full rounded-xl border-0 bg-transparent px-3 py-2.5 text-white shadow-none hover:bg-white/10 focus-visible:ring-white/40 data-[size=default]:h-auto sm:px-4 md:w-auto md:min-w-[210px] [&>svg]:text-white/70"
          >
            <span className="flex items-center gap-2.5 sm:gap-3">
              <Tent className={icon} />
              <span className="flex flex-col items-start gap-0.5">
                <span className={label}>Категория</span>
                <span className={value}>
                  <SelectValue />
                </span>
              </span>
            </span>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Всё снаряжение</SelectItem>
            {CATEGORIES.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {divider}
        <Popover {...popoverProps("from")}>
          <PopoverTrigger asChild>
            <button type="button" className={cell} disabled={isPending}>
              <CalendarDays className={icon} />
              <span className="flex flex-col gap-0.5">
                <span className={label}>Выдача</span>
                <span className={value}>{formatDate(range.from)}</span>
              </span>
            </button>
          </PopoverTrigger>
          <EdgeCalendarPopover edge="from" range={range} onPick={(date) => pick("from", date)} />
        </Popover>
        {divider}
        <Popover {...popoverProps("to")}>
          <PopoverTrigger asChild>
            <button type="button" className={cell} disabled={isPending}>
              <CalendarCheck2 className={icon} />
              <span className="flex flex-col gap-0.5">
                <span className={label}>Возврат</span>
                <span className={value}>{formatDate(range.to)}</span>
              </span>
            </button>
          </PopoverTrigger>
          <EdgeCalendarPopover edge="to" range={range} onPick={(date) => pick("to", date)} />
        </Popover>
        {divider}
        <span className={cn(cell, "hover:bg-transparent")}>
          <Moon className={icon} />
          <span className="flex flex-col gap-0.5">
            <span className={label}>Срок</span>
            <span className={value}>{pluralDays(rentalDays(range))}</span>
          </span>
        </span>
      </div>
    </div>
  );
}

/** Ползунок цены охватывает весь прайс проката: правый край — самая дорогая позиция. */
const PRICE_MAX = 2500;
const PRICE_STEP = 50;

/** Строка фильтров над выдачей: цена, наличие, сортировка. */
export function CatalogFilters({ query, resetHref }: { query: CatalogQuery; resetHref: string | null }) {
  const { navigate } = useCatalogNav();
  const committed: [number, number] = [query.priceMin ?? 0, Math.min(query.priceMax ?? PRICE_MAX, PRICE_MAX)];
  const [price, setPrice] = useState(committed);
  // URL сменился извне (назад/вперёд, сброс) — двигаем ползунок вслед прямо при рендере.
  const committedKey = committed.join(":");
  const [syncedKey, setSyncedKey] = useState(committedKey);
  if (syncedKey !== committedKey) {
    setSyncedKey(committedKey);
    setPrice(committed);
  }

  const go = (patch: Partial<CatalogQuery>) => navigate(catalogHref({ ...query, ...patch, page: 1 }));
  const priceText =
    price[0] === 0 && price[1] === PRICE_MAX
      ? "любая"
      : `${formatRub(price[0]).replace(" ₽", "")} — ${formatRub(price[1])}`;

  return (
    <div
      role="group"
      aria-label="Фильтры"
      className="flex flex-wrap items-center gap-x-7 gap-y-3.5 rounded-[14px] bg-sand px-4 py-4 sm:px-5"
    >
      <div className="flex w-full flex-wrap items-center gap-x-3.5 gap-y-2 sm:w-auto sm:min-w-[260px] sm:flex-[1_1_320px] sm:flex-nowrap">
        <span className="text-sm font-semibold whitespace-nowrap">Цена за сутки</span>
        <Slider
          min={0}
          max={PRICE_MAX}
          step={PRICE_STEP}
          value={price}
          aria-label="Диапазон цены за сутки"
          // Невыбранная часть дорожки контрастнее фона панели — видно, где края диапазона.
          className="order-last min-w-[120px] basis-full *:data-[slot=slider-track]:bg-stone-300 sm:order-none sm:basis-auto sm:flex-1"
          onValueChange={([min, max]) => setPrice([min, max])}
          onValueCommit={([min, max]) =>
            go({ priceMin: min === 0 ? null : min, priceMax: max === PRICE_MAX ? null : max })
          }
        />
        <span className="ml-auto text-sm whitespace-nowrap text-stone-700 sm:ml-0 sm:w-[120px]">{priceText}</span>
      </div>
      <div className="flex items-center gap-2.5">
        <Switch
          id="available-only"
          checked={query.availableOnly}
          onCheckedChange={(checked) => go({ availableOnly: checked })}
        />
        <Label htmlFor="available-only" className="text-sm font-medium">
          Только свободные
        </Label>
      </div>
      <Select value={query.sort} onValueChange={(sort) => go({ sort: sort as SortId })}>
        <SelectTrigger className="h-10 w-full rounded-[10px] bg-white sm:w-auto sm:min-w-[210px]" aria-label="Сортировка">
          <SelectValue />
        </SelectTrigger>
        <SelectContent align="end">
          {SORTS.map((s) => (
            <SelectItem key={s.id} value={s.id}>
              {s.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {/* С sm место под кнопку есть всегда, чтобы появление «Сбросить» не сдвигало строку.
          На телефоне фильтры и так идут столбиком — пустая строка там не нужна. */}
      <Button
        variant="ghost"
        // Без transition-all: видимость должна переключаться мгновенно, без анимации.
        className={cn("h-10 text-stone-600 transition-colors", !resetHref && "invisible max-sm:hidden")}
        aria-hidden={!resetHref}
        tabIndex={resetHref ? undefined : -1}
        onClick={() => resetHref && navigate(resetHref)}
      >
        <X />
        Сбросить
      </Button>
    </div>
  );
}

/**
 * Заменяет адрес на каноничный (исправленный) без нового запроса к серверу —
 * чтобы ссылка, которой поделятся дальше, уже была корректной, — и объясняет замену.
 */
export function ParamNotices({ messages, canonicalHref }: { messages: string[]; canonicalHref: string }) {
  const [hidden, setHidden] = useState(false);
  useEffect(() => {
    const current = window.location.pathname + window.location.search;
    if (current !== canonicalHref) window.history.replaceState(null, "", canonicalHref);
  }, [canonicalHref]);

  if (hidden || messages.length === 0) return null;
  return (
    <Alert className="rounded-[14px] border-amber-200 bg-amber-50 px-4 py-3.5 text-amber-950 *:data-[slot=alert-description]:text-amber-900">
      <Info className="text-amber-800" />
      <AlertTitle>Мы поправили параметры ссылки</AlertTitle>
      <AlertDescription>
        <ul className="list-disc pl-4">
          {messages.map((m) => (
            <li key={m}>{m}</li>
          ))}
        </ul>
      </AlertDescription>
      <Button
        variant="ghost"
        size="icon-sm"
        className="absolute top-2 right-2 text-amber-800 hover:bg-amber-100"
        aria-label="Скрыть"
        onClick={() => setHidden(true)}
      >
        <X />
      </Button>
    </Alert>
  );
}
