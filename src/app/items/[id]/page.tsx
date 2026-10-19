import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import {
  Check,
  CircleDot,
  Droplet,
  Flame,
  Layers,
  Package,
  Ruler,
  Thermometer,
  Users,
  Weight,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { serverApi } from "@/lib/api/server";
import { isRetryable, NotFoundError } from "@/lib/api/errors";
import type { ItemDetail } from "@/lib/api/types";
import { catalogHref, categoryLabel, itemHref, parseRangeParams } from "@/lib/domain/catalog";
import type { CategoryId } from "@/lib/domain/catalog";
import { pluralDays, rentalDays, todayIso } from "@/lib/domain/dates";
import type { DateRange } from "@/lib/domain/dates";
import { formatRub, quoteSingle } from "@/lib/domain/pricing";
import { ItemImage } from "@/components/ItemImage";
import { AddToCartButton } from "@/components/cart/AddToCartButton";
import { Availability } from "@/components/catalog/ItemCard";
import { CardSkeleton } from "@/components/catalog/CardSkeleton";
import { ItemDates } from "@/components/catalog/ItemDates";
import { ItemGallery } from "@/components/catalog/ItemGallery";
import { ParamNotices } from "@/components/catalog/CatalogControls";
import { SectionBoundary } from "@/components/Boundaries";
import { ServiceUnavailable } from "@/components/ServiceUnavailable";
import { CONTAINER, SectionHeading } from "@/components/SectionHeading";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { cn } from "@/lib/utils";

type Props = PageProps<"/items/[id]">;

/** «Бумажные» карточки характеристик и правил. */
const PAPER_CARD = "rounded-2xl border border-paper-line bg-paper p-5 sm:p-7";
/** Сетка рекомендаций — общая для подборки и её скелетона, чтобы не было скачка при загрузке. */
const RECS_GRID = "grid grid-cols-[repeat(auto-fill,minmax(min(250px,100%),1fr))] gap-4 sm:gap-[22px]";

/** Иконка характеристики по её названию. */
function specIcon(label: string): LucideIcon {
  const l = label.toLowerCase();
  if (l.includes("вместимост") || l.includes("персон")) return Users;
  if (l.includes("вес") || l.includes("нагрузк") || l.includes("грузоподъ")) return Weight;
  if (l.includes("водостойк")) return Droplet;
  if (l.includes("слои")) return Layers;
  if (l.includes("длина") || l.includes("ширина") || l.includes("высота") || l.includes("размер") || l.includes("толщина")) return Ruler;
  if (l.includes("объём")) return Package;
  if (l.includes("комфорт") || l.includes("экстрим")) return Thermometer;
  if (l.includes("мощность") || l.includes("топливо")) return Flame;
  return CircleDot;
}

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const { id } = await params;
  const { range } = parseRangeParams(await searchParams, todayIso());
  try {
    const item = await serverApi.item(id, range);
    return {
      title: `${item.title} напрокат`,
      description: `${item.description} ${formatRub(item.pricePerDay)} в сутки, залог ${formatRub(item.deposit)}.`,
      alternates: { canonical: `/items/${id}` },
    };
  } catch {
    return { title: "Снаряжение напрокат" };
  }
}

export default async function ItemPage({ params, searchParams }: Props) {
  const { id } = await params;
  const { range, notice } = parseRangeParams(await searchParams, todayIso());

  let item: ItemDetail;
  try {
    item = await serverApi.item(id, range);
  } catch (error) {
    if (error instanceof NotFoundError) notFound();
    if (isRetryable(error)) {
      return (
        <div className={cn(CONTAINER, "py-16")}>
          <ServiceUnavailable
            title="Не удалось загрузить карточку"
            text="Сервис временно не отвечает. Повторите попытку."
            headingLevel={1}
          />
        </div>
      );
    }
    throw error;
  }

  const days = rentalDays(range);
  // Та же формула, что в корзине и в брони: одна штука на выбранный период, без услуг.
  const quote = quoteSingle({ itemId: item.id, pricePerDay: item.pricePerDay, deposit: item.deposit }, days);
  // Крошки ведут сразу к выдаче (#gear — секция «Снаряжение» в каталоге), а не к баннеру.
  const catalogLink = (category: CategoryId | null) =>
    `${catalogHref({ range, category, priceMin: null, priceMax: null, availableOnly: false, sort: "popular", page: 1 })}#gear`;

  return (
    <>
      <div className={cn(CONTAINER, "flex flex-col gap-6 pt-5 sm:gap-8 sm:pt-7")}>
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href={catalogLink(null)}>Каталог</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href={catalogLink(item.category)}>{categoryLabel(item.category)}</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{item.title}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <ParamNotices
          messages={notice ? [notice.message] : []}
          canonicalHref={itemHref(item.id, range)}
        />

        <article className="flex flex-wrap items-start gap-8 lg:gap-12">
          <ItemGallery
            id={item.id}
            category={item.category}
            title={item.title}
            badge={<Availability available={item.available} detailed className="px-3.5 py-1.5 text-[13px]" />}
          />

          <div className="flex min-w-0 flex-[1_1_440px] flex-col gap-[22px]">
            <div className="flex flex-col gap-2.5">
              <span className="font-script text-[26px] leading-none text-bark-text sm:text-[30px]">{categoryLabel(item.category)}</span>
              <h1 className="font-heading text-[28px] leading-tight font-extrabold tracking-tight sm:text-[40px]">
                {item.title}
              </h1>
              <p className="text-base leading-relaxed text-stone-600">{item.description}</p>
              <div className="mt-1 flex flex-wrap gap-x-[22px] gap-y-2.5 text-sm text-stone-700">
                {item.specs.slice(0, 4).map(([label, value]) => {
                  const Icon = specIcon(label);
                  return (
                    <span key={label} className="inline-flex items-center gap-2" title={label}>
                      <Icon className="size-[18px] text-primary" />
                      {/* «2» без названия непонятно — показываем «слои: 2». */}
                      {/^\d+$/.test(value) ? `${label.toLowerCase()}: ${value}` : value}
                    </span>
                  );
                })}
              </div>
            </div>

            <section aria-label="Бронирование" className="overflow-hidden rounded-[18px] border border-line bg-white shadow-panel">
              <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 bg-night px-4 py-4 text-white sm:px-6 sm:py-[18px]">
                <span className="font-heading text-[26px] font-extrabold whitespace-nowrap sm:text-3xl">
                  {formatRub(item.pricePerDay)}{" "}
                  <span className="font-sans text-[15px] font-normal text-stone-300">/ сутки</span>
                </span>
                <span className="text-[13px] text-tan">залог {formatRub(item.deposit)}</span>
              </div>
              <div className="flex flex-col gap-[18px] px-4 pt-5 pb-5 sm:px-6 sm:pt-[22px] sm:pb-6">
                <ItemDates itemId={item.id} range={range} />
                <dl className="flex flex-col gap-2.5 rounded-xl bg-sand p-4 text-sm">
                  <div className="flex justify-between gap-3">
                    <dt className="text-muted-foreground">
                      Аренда · {formatRub(item.pricePerDay)} × {pluralDays(days)}
                    </dt>
                    <dd className="font-semibold whitespace-nowrap">{formatRub(quote.rent)}</dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-muted-foreground">Залог, возвращается при сдаче</dt>
                    <dd className="font-semibold whitespace-nowrap">{formatRub(item.deposit)}</dd>
                  </div>
                  <div className="h-px bg-border" />
                  <div className="flex justify-between gap-3 text-base">
                    <dt className="font-bold">При выдаче</dt>
                    <dd className="font-heading font-extrabold whitespace-nowrap text-primary">
                      {formatRub(quote.total)}
                    </dd>
                  </div>
                </dl>
                <AddToCartButton
                  range={range}
                  item={{
                    itemId: item.id,
                    title: item.title,
                    category: item.category,
                    pricePerDay: item.pricePerDay,
                    deposit: item.deposit,
                    available: item.available,
                  }}
                />
                <p className="text-[13px] text-muted-foreground">Даты общие для всей корзины — менять их можно и в ней.</p>
              </div>
            </section>
          </div>
        </article>
      </div>

      <section className="mt-14 bg-sand py-12 sm:mt-[72px] sm:py-[72px]">
        <div className={cn(CONTAINER, "grid grid-cols-[repeat(auto-fit,minmax(min(360px,100%),1fr))] gap-4 sm:gap-6")}>
          <section className={PAPER_CARD}>
            <SectionHeading script="Что внутри" title="Характеристики" align="left" size="md" />
            <dl className="mt-4 text-[15px]">
              {item.specs.map(([label, value]) => (
                <div key={label} className="flex justify-between gap-3 border-b border-dashed border-border py-3 last:border-0">
                  <dt className="text-muted-foreground">{label}</dt>
                  <dd className="text-right font-semibold">{value}</dd>
                </div>
              ))}
            </dl>
          </section>
          <section className={PAPER_CARD}>
            <SectionHeading script="Важно знать" title="Правила выдачи" align="left" size="md" />
            <ul className="mt-4 flex flex-col gap-3 text-[15px] leading-relaxed text-stone-700">
              {item.rules.map((rule) => (
                <li key={rule} className="flex gap-3">
                  <span className="mt-0.5 flex size-6 flex-none items-center justify-center rounded-full bg-primary text-white">
                    <Check className="size-3.5" strokeWidth={3} />
                  </span>
                  {rule}
                </li>
              ))}
            </ul>
          </section>
        </div>
      </section>

      <section aria-labelledby="recs-title" className={cn(CONTAINER, "flex flex-col gap-8 pt-14 pb-24 sm:pt-20")}>
        <SectionHeading id="recs-title" script="С этим берут" title="В поход вместе" />
        {/* Рекомендации грузятся отдельно и не задерживают и не роняют основную карточку. */}
        <SectionBoundary fallback={<RecsFallback />}>
          <Suspense fallback={<RecsSkeleton />}>
            <Recommendations id={item.id} range={range} />
          </Suspense>
        </SectionBoundary>
      </section>
    </>
  );
}

async function Recommendations({ id, range }: { id: string; range: DateRange }) {
  // Сбой подборки не должен ронять карточку: вместо блока — тихая заглушка.
  const items = await serverApi
    .recommendations(id, range)
    .then((res) => res.items)
    .catch(() => null);
  if (items === null) return <RecsFallback />;
  if (items.length === 0) return null;
  return (
    <div className={RECS_GRID}>
      {items.map((rec) => (
        <Link
          key={rec.id}
          href={itemHref(rec.id, range)}
          className="group flex flex-col overflow-hidden rounded-[14px] bg-cream shadow-lift transition-shadow hover:shadow-panel"
        >
          <span className="relative block aspect-[4/3] overflow-hidden">
            <ItemImage id={rec.id} category={rec.category} alt="" sizes="300px" className="transition-transform duration-500 group-hover:scale-105" />
            {rec.available === 0 ? <Availability available={0} className="absolute top-3 left-3" /> : null}
          </span>
          <span className="flex items-baseline justify-between gap-2.5 px-4 py-3.5">
            <span className="font-heading text-[15px] font-bold">{rec.title}</span>
            <span className="text-sm font-semibold whitespace-nowrap text-primary">{formatRub(rec.pricePerDay)} / сут.</span>
          </span>
        </Link>
      ))}
    </div>
  );
}

function RecsFallback() {
  return <p className="text-center text-sm text-muted-foreground">Подборка сейчас недоступна — это не влияет на бронирование.</p>;
}

function RecsSkeleton() {
  return (
    <div className={RECS_GRID} aria-busy="true">
      {Array.from({ length: 4 }, (_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  );
}
