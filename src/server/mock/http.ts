import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SCENARIO_COOKIE } from "@/lib/api/session";
import type { ApiErrorBody } from "@/lib/api/types";

export type Scenario = "none" | "catalog-down" | "recs-down" | "payment-fail" | "conflict";

export { SCENARIO_COOKIE };

/** Учебные сценарии сбоев включаются cookie из панели в подвале сайта. */
export function scenarioOf(req: NextRequest): Scenario {
  const value = req.cookies.get(SCENARIO_COOKIE)?.value;
  const known: Scenario[] = ["catalog-down", "recs-down", "payment-fail", "conflict"];
  return known.includes(value as Scenario) ? (value as Scenario) : "none";
}

export function apiError(
  status: number,
  code: ApiErrorBody["error"]["code"],
  message: string,
  extra: Omit<ApiErrorBody["error"], "code" | "message"> = {},
) {
  return NextResponse.json<ApiErrorBody>({ error: { code, message, ...extra } }, { status });
}

/** Сетевая задержка, чтобы состояния загрузки были видны. */
export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function readJson(req: NextRequest): Promise<unknown> {
  try {
    return await req.json();
  } catch {
    return null;
  }
}
