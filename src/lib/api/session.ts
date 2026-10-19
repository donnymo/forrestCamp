// Cookie сессии — часть контракта API: их ставит бэкенд (httpOnly), а витрина только
// пересылает их с серверными запросами и по наличию refresh-cookie делает
// «оптимистичную» проверку входа в proxy.ts.

export const ACCESS_COOKIE = "rr_access";
export const REFRESH_COOKIE = "rr_refresh";

/** Учебный сценарий сбоев (панель в подвале) — пересылается API всегда. */
export const SCENARIO_COOKIE = "rr_scenario";

/** Возвращаем только на свои страницы — защита от открытого редиректа. */
export function safeNextPath(value: unknown, fallback = "/account"): string {
  return typeof value === "string" && value.startsWith("/") && !value.startsWith("//") ? value : fallback;
}
