"use client";

import { Component, useEffect, useRef, useState, useTransition } from "react";
import type { ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { refreshSession } from "@/lib/api/client";
import { useAuth } from "./auth/AuthProvider";

/**
 * Граница для второстепенного блока: если он упал, основное содержимое страницы
 * остаётся на месте, а вместо блока — тихая заглушка.
 */
export class SectionBoundary extends Component<
  { fallback: ReactNode; children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

/** Повтор загрузки серверной части страницы без полной перезагрузки. */
export function RetryButton({ label = "Повторить", className }: { label?: string; className?: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  return (
    <Button size="lg" className={className} disabled={pending} onClick={() => startTransition(() => router.refresh())}>
      {pending ? <Loader2 className="animate-spin" /> : <RefreshCw />}
      {pending ? "Загружаем…" : label}
    </Button>
  );
}

/**
 * Серверный компонент получил 401 (access-токен истёк). Cookie на сервере при рендере
 * не записать, поэтому обновляем сессию из браузера и перерисовываем страницу;
 * если refresh не удался — отправляем на вход.
 */
export function SessionRefresher({ next }: { next: string }) {
  const router = useRouter();
  const { setUser } = useAuth();
  const started = useRef(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    void refreshSession().then((ok) => {
      if (ok) router.refresh();
      else {
        setFailed(true);
        setUser(null);
        router.replace(`/login?next=${encodeURIComponent(next)}&reason=expired`);
      }
    });
  }, [next, router, setUser]);

  return (
    <div className="flex flex-col items-center gap-3 py-16 text-center" role="status">
      {failed ? null : <Loader2 className="size-6 animate-spin text-muted-foreground" />}
      <p className="text-sm text-muted-foreground">
        {failed ? "Сессия истекла, переходим ко входу…" : "Обновляем сессию…"}
      </p>
      {failed ? (
        <Button asChild variant="outline">
          <Link href={`/login?next=${encodeURIComponent(next)}`}>Войти</Link>
        </Button>
      ) : null}
    </div>
  );
}
