"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, FlaskConical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { clientApi } from "@/lib/api/client";
import { SCENARIO_COOKIE } from "@/lib/api/session";

// Панель учебных сценариев: позволяет руками проверить пути восстановления.
// Работает только с учебным API — сценарий хранится в cookie, которую API читает.

const SCENARIOS = [
  { id: "none", label: "Всё работает" },
  { id: "catalog-down", label: "Каталог отвечает 503" },
  { id: "recs-down", label: "Рекомендации падают (500)" },
  { id: "conflict", label: "Конфликт при подтверждении (409, разово)" },
  { id: "payment-fail", label: "Первая оплата брони отклоняется (402)" },
];

function readScenario(): string {
  const pair = document.cookie
    .split("; ")
    .find((c) => c.startsWith(`${SCENARIO_COOKIE}=`));
  return pair ? decodeURIComponent(pair.slice(SCENARIO_COOKIE.length + 1)) : "none";
}

export function ScenarioPanel() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [scenario, setScenario] = useState("none");
  const [message, setMessage] = useState<string | null>(null);

  // Сценарий мог смениться на сервере (409 выключает себя сам) — перечитываем cookie при открытии.
  const toggle = () => {
    if (!open) setScenario(readScenario());
    setOpen(!open);
  };

  const choose = (value: string) => {
    document.cookie =
      value === "none"
        ? `${SCENARIO_COOKIE}=; path=/; max-age=0`
        : `${SCENARIO_COOKIE}=${value}; path=/; max-age=86400; samesite=lax`;
    setScenario(value);
    setMessage(null);
    router.refresh();
  };

  const expire = async (mode: "access" | "all") => {
    await clientApi.expireSession(mode);
    setMessage(
      mode === "access"
        ? "Access-токен отозван. Следующий защищённый запрос получит 401 и обновит сессию."
        : "Сессия отозвана полностью. Следующий защищённый запрос вернёт на страницу входа.",
    );
  };

  return (
    // Плавающая панель вместо подвала: учебный инструмент, не часть витрины.
    <div className="fixed bottom-4 left-4 z-50 flex max-w-[calc(100vw-2rem)] flex-col-reverse items-start gap-2">
      <Button
        variant="outline"
        size="sm"
        className="rounded-full bg-white/95 text-stone-600 shadow-lift backdrop-blur"
        aria-expanded={open}
        onClick={toggle}
      >
        <FlaskConical />
        Учебные сценарии
        <ChevronDown className={open ? "transition-transform" : "rotate-180 transition-transform"} />
      </Button>
      {open ? (
        <div className="flex w-[340px] max-w-full flex-col gap-3 rounded-xl border bg-card p-4 text-sm shadow-panel">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="scenario">Режим API</Label>
            <Select value={scenario} onValueChange={choose}>
              <SelectTrigger id="scenario" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SCENARIOS.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={() => expire("access")}>
              Истечь access-токен
            </Button>
            <Button variant="outline" size="sm" onClick={() => expire("all")}>
              Истечь всю сессию
            </Button>
          </div>
          {message ? <p className="text-[13px] text-muted-foreground">{message}</p> : null}
          <p className="text-[13px] text-muted-foreground">Демо-вход: demo@prokat.test / demo1234</p>
        </div>
      ) : null}
    </div>
  );
}
