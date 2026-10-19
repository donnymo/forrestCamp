import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ArrowRight, SearchX } from "lucide-react";
import { serverApi } from "@/lib/api/server";
import { isRetryable } from "@/lib/api/errors";
import type { CatalogPage as CatalogPageData } from "@/lib/api/types";
import {
  catalogHref,
  categoryLabel,
  CATEGORIES,
  clampPage,
  parseCatalogQuery,
} from "@/lib/domain/catalog";
import type { CatalogQuery, CategoryId, ParamNotice } from "@/lib/domain/catalog";
import { formatDate, pluralDays, rentalDays, todayIso } from "@/lib/domain/dates";
import { HERO_PHOTO } from "@/lib/photos";
import { CatalogLink, CatalogNavProvider, PendingRegion, ScrollToHash } from "@/components/catalog/CatalogNav";
import { CatalogFilters, HeroSearch, ParamNotices } from "@/components/catalog/CatalogControls";
import { ItemCard } from "@/components/catalog/ItemCard";
import { EmptyState } from "@/components/EmptyState";
import { ERROR_ACTION, ServiceUnavailable } from "@/components/ServiceUnavailable";
import { CONTAINER, SectionHeading } from "@/components/SectionHeading";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Props = PageProps<"/catalog">;

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const { query } = parseCatalogQuery(await searchParams, todayIso());
  const title = query.category ? `${categoryLabel(query.category)} напрокат` : "Каталог снаряжения напрокат";
  // Каноничный адрес для поисковиков — категория без дат и прочих фильтров.
  return {
    title,
    alternates: { canonical: query.category ? `/catalog?category=${query.category}` : "/catalog" },
  };
}

export default async function CatalogPage({ searchParams }: Props) {
  const parsed = parseCatalogQuery(await searchParams, todayIso());
  let query = parsed.query;
  const notices: ParamNotice[] = [...parsed.notices];

  // null — API временно недоступен: баннер с поиском остаётся, вместо выдачи — ошибка.
  let data: CatalogPageData | null;
  try {
    data = await serverApi.catalog(query);
    // Страница за пределами выдачи: открываем последнюю и объясняем почему.
    const clamped = clampPage(query, data.totalPages);
    if (clamped.notice) {
      notices.push(clamped.notice);
      query = clamped.query;
      data = await serverApi.catalog(query);
    }
  } catch (error) {
    // Временный сбой API — штатное состояние с повтором. Прочее уходит в error.tsx.
    if (!isRetryable(error)) throw error;
    data = null;
  }

  return (
    <CatalogNavProvider>
      <section aria-label="Поиск по датам" className="relative overflow-hidden bg-night">
        <Image src={HERO_PHOTO} alt="" fill priority quality={90} sizes="100vw" className="object-cover object-[50%_80%]" />
        {/* На узком экране текст занимает всю ширину — затемняем фото целиком, а не только слева. */}
        <div className="absolute inset-0 bg-[rgb(13_24_20/0.72)] sm:bg-[linear-gradient(90deg,rgb(13_24_20/0.88)_0%,rgb(13_24_20/0.6)_50%,rgb(13_24_20/0.15)_85%)]" />
        <div className={cn(CONTAINER, "relative flex flex-col gap-4 pt-10 pb-10 sm:gap-[18px] sm:pt-24 sm:pb-[72px]")}>
          <span className="font-script text-[32px] leading-none text-tan sm:text-[38px]">В лес на выходные</span>
          {/* Заголовок не зависит от категории: иначе высота баннера менялась бы при смене
              категории и выдача под ним прыгала. Категория видна в поиске, вкладках и <title>. */}
          <h1 className="max-w-[640px] font-heading text-[34px] leading-[1.05] font-extrabold tracking-tight text-white sm:text-[58px]">
            Снаряжение напрокат на ваши даты
          </h1>
          <p className="max-w-[560px] text-base leading-relaxed text-stone-300 sm:text-[17px]">
            Палатки, сапборды, спальники и походная кухня. Наличие и цена считаются сразу на выбранный период.
          </p>
          <div className="mt-2 sm:mt-[18px] md:self-start">
            <HeroSearch query={query} />
          </div>
          <p className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-white/75">
            <span>Выдача и возврат ежедневно с 10:00 до 20:00</span>
            <span aria-hidden className="max-sm:hidden">·</span>
            <span>Залог возвращается при сдаче</span>
          </p>
        </div>
      </section>

      <div className={cn(CONTAINER, "flex flex-col gap-12 pt-12 sm:gap-24 sm:pt-20")}>
        <ParamNotices messages={notices.map((n) => n.message)} canonicalHref={catalogHref(query)} />

        {data ? (
          <GearSection query={query} data={data} />
        ) : (
          <section aria-label="Снаряжение" className="scroll-mt-24 pb-[50px]" id="gear">
            <CatalogUnavailable />
          </section>
        )}
      </div>
      <ScrollToHash id="gear" />
    </CatalogNavProvider>
  );
}

/** Секция «Снаряжение»: категории, фильтры, выдача и пагинация. */
function GearSection({ query, data }: { query: CatalogQuery; data: CatalogPageData }) {
  const days = rentalDays(query.range);
  const hasFilters =
    query.category !== null || query.priceMin !== null || query.priceMax !== null || query.availableOnly;
  const resetHref = catalogHref({ ...query, category: null, priceMin: null, priceMax: null, availableOnly: false, page: 1 });
  const allCount = Object.values(data.categoryCounts).reduce((a, b) => a + b, 0);

  return (
    <section aria-labelledby="gear-title" className="flex scroll-mt-24 flex-col gap-8 pb-[50px]" id="gear">
      <SectionHeading
        id="gear-title"
        script={query.availableOnly ? "Свободно на ваши даты" : "На ваши даты"}
        title="Снаряжение"
        text={
          <>
            Цена в карточке уже посчитана на {pluralDays(days)} — с {formatDate(query.range.from)} по{" "}
            {formatDate(query.range.to)}. Залог возвращается при сдаче.
          </>
        }
      />

      {/* На телефоне вкладки — лента с прокруткой во всю ширину экрана, а не три строки переносов. */}
      <div className="-mx-4 border-b border-line px-4 sm:mx-0 sm:px-0">
        <nav
          aria-label="Категории"
          className="scrollbar-none -mb-px flex gap-x-6 overflow-x-auto whitespace-nowrap sm:flex-wrap sm:overflow-visible"
        >
          {[{ id: null, label: "Всё" }, ...CATEGORIES].map((c) => {
            const active = query.category === c.id;
            const count = c.id ? (data.categoryCounts[c.id] ?? 0) : allCount;
            return (
              <CatalogLink
                key={c.id ?? "all"}
                href={catalogHref({ ...query, category: c.id as CategoryId | null, page: 1 })}
                className={cn(
                  "border-b-2 pt-3 pb-3.5 text-[15px] transition-colors",
                  active
                    ? "border-primary font-semibold text-primary"
                    : "border-transparent font-medium text-stone-600 hover:text-primary",
                )}
                aria-current={active ? "page" : undefined}
              >
                {c.label} <span className="font-normal text-stone-400">{count}</span>
              </CatalogLink>
            );
          })}
        </nav>
      </div>

      <CatalogFilters query={query} resetHref={hasFilters ? resetHref : null} />

      <PendingRegion>
        <p className="text-sm text-muted-foreground">
          <strong className="font-semibold text-foreground">{data.total} позиций</strong>
          {data.totalPages > 1 ? ` · страница ${data.page} из ${data.totalPages}` : ""}
        </p>
        {data.items.length === 0 ? (
          <EmptyResults query={query} resetHref={resetHref} hasFilters={hasFilters} />
        ) : (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(min(320px,100%),1fr))] gap-5 sm:gap-7">
            {data.items.map((item) => (
              <ItemCard key={item.id} item={item} range={query.range} />
            ))}
          </div>
        )}
        <Pagination query={query} totalPages={data.totalPages} />
      </PendingRegion>
    </section>
  );
}

function EmptyResults({
  query,
  resetHref,
  hasFilters,
}: {
  query: CatalogQuery;
  resetHref: string;
  hasFilters: boolean;
}) {
  return (
    <EmptyState
      icon={<SearchX />}
      script="Пусто"
      title="Ничего не нашлось"
      text={
        query.availableOnly
          ? "На эти даты подходящее снаряжение занято. Попробуйте другие даты или покажите занятые позиции."
          : "Под эти условия нет позиций. Ослабьте фильтры."
      }
    >
      {query.availableOnly ? (
        <CatalogLink
          className={cn(buttonVariants({ variant: "outline", size: "lg" }), "h-10 border-primary text-primary")}
          href={catalogHref({ ...query, availableOnly: false, page: 1 })}
        >
          Показать и занятые
        </CatalogLink>
      ) : null}
      {hasFilters ? (
        <CatalogLink className={cn(buttonVariants({ size: "lg" }), "h-10")} href={resetHref}>
          Сбросить фильтры
        </CatalogLink>
      ) : null}
    </EmptyState>
  );
}

function Pagination({ query, totalPages }: { query: CatalogQuery; totalPages: number }) {
  if (totalPages <= 1) return null;
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);
  return (
    <nav aria-label="Страницы выдачи" className="flex flex-wrap items-center justify-between gap-4 pt-2">
      <div className="flex items-center gap-2">
        {pages.map((p) =>
          p === query.page ? (
            <span
              key={p}
              aria-current="page"
              className="flex size-10 items-center justify-center rounded-full bg-primary text-sm font-semibold text-white"
            >
              {p}
            </span>
          ) : (
            <CatalogLink
              key={p}
              scrollToId="gear"
              href={catalogHref({ ...query, page: p })}
              className="flex size-10 items-center justify-center rounded-full text-sm font-medium hover:bg-sand"
            >
              {String(p)}
            </CatalogLink>
          ),
        )}
      </div>
      <div className="flex gap-3">
        <PageArrow query={query} totalPages={totalPages} direction="prev" />
        <PageArrow query={query} totalPages={totalPages} direction="next" />
      </div>
    </nav>
  );
}

/** Стрелка «назад/вперёд»; на краю выдачи — неактивный кружок без ссылки. */
function PageArrow({
  query,
  totalPages,
  direction,
}: {
  query: CatalogQuery;
  totalPages: number;
  direction: "prev" | "next";
}) {
  const target = direction === "prev" ? query.page - 1 : query.page + 1;
  const Icon = direction === "prev" ? ArrowLeft : ArrowRight;
  const base = "flex size-12 items-center justify-center rounded-full border transition-colors";
  if (target < 1 || target > totalPages) {
    return (
      <span className={cn(base, "border-line text-stone-300")} aria-hidden>
        <Icon className="size-5" />
      </span>
    );
  }
  return (
    <CatalogLink
      scrollToId="gear"
      href={catalogHref({ ...query, page: target })}
      className={cn(base, "border-primary text-primary hover:bg-primary-soft")}
      aria-label={direction === "prev" ? "Предыдущая страница" : "Следующая страница"}
    >
      <Icon className="size-5" />
    </CatalogLink>
  );
}

/** Выдача не загрузилась: ошибка встаёт на место секции «Снаряжение», баннер с поиском остаётся. */
function CatalogUnavailable() {
  return (
    <ServiceUnavailable
      title="Каталог временно недоступен"
      text="Сервер не ответил. Ваши фильтры сохранены в адресе — повторите через минуту."
    >
      <Button asChild variant="outline" className={cn(ERROR_ACTION, "border-primary text-primary")}>
        <Link href="/cart">Перейти в корзину</Link>
      </Button>
    </ServiceUnavailable>
  );
}
