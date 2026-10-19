// Единственная формула стоимости. Её используют и корзина в браузере, и учебный API
// при создании брони — поэтому итог на экране и в брони совпадает до рубля.

export const INSURANCE_RATE = 0.1;
export const DELIVERY_PRICE = 700;

export const SERVICES = {
  insurance: {
    label: "Страховка снаряжения",
    hint: `${INSURANCE_RATE * 100}% от стоимости аренды, покрывает мелкие повреждения`,
  },
  delivery: {
    label: "Доставка",
    hint: `${DELIVERY_PRICE} ₽ за заказ, в пределах города`,
  },
} as const;

export type ServiceId = keyof typeof SERVICES;
export type ServiceSelection = Record<ServiceId, boolean>;

export const NO_SERVICES: ServiceSelection = { insurance: false, delivery: false };

export type PricedLine = {
  itemId: string;
  pricePerDay: number;
  deposit: number;
  qty: number;
};

export type LineTotals = {
  itemId: string;
  qty: number;
  pricePerDay: number;
  rent: number;
  deposit: number;
};

export type Totals = {
  days: number;
  lines: LineTotals[];
  rent: number;
  services: Record<ServiceId, number>;
  servicesTotal: number;
  /** Аренда + услуги — то, что не возвращается. */
  payNow: number;
  /** Возвратный залог. */
  deposit: number;
  /** Всё, что клиент вносит при выдаче. */
  total: number;
};

export function computeTotals(
  lines: readonly PricedLine[],
  days: number,
  services: ServiceSelection,
): Totals {
  const safeDays = Number.isFinite(days) && days > 0 ? days : 0;
  const lineTotals = lines.map((line) => ({
    itemId: line.itemId,
    qty: line.qty,
    pricePerDay: line.pricePerDay,
    rent: line.pricePerDay * line.qty * safeDays,
    deposit: line.deposit * line.qty,
  }));
  const rent = sum(lineTotals.map((l) => l.rent));
  const deposit = sum(lineTotals.map((l) => l.deposit));
  const hasLines = lines.length > 0;
  const serviceTotals = {
    insurance: services.insurance ? Math.round(rent * INSURANCE_RATE) : 0,
    delivery: services.delivery && hasLines ? DELIVERY_PRICE : 0,
  };
  const servicesTotal = serviceTotals.insurance + serviceTotals.delivery;
  const payNow = rent + servicesTotal;
  return {
    days: safeDays,
    lines: lineTotals,
    rent,
    services: serviceTotals,
    servicesTotal,
    payNow,
    deposit,
    total: payNow + deposit,
  };
}

/** Цена одной штуки на период — для карточки и страницы позиции, по той же формуле. */
export function quoteSingle(item: { itemId: string; pricePerDay: number; deposit: number }, days: number): Totals {
  return computeTotals([{ ...item, qty: 1 }], days, NO_SERVICES);
}

function sum(values: number[]): number {
  return values.reduce((acc, v) => acc + v, 0);
}

const rub = new Intl.NumberFormat("ru-RU");

export function formatRub(value: number): string {
  return `${rub.format(value)} ₽`;
}
