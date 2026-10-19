"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useTransition } from "react";
import type { AriaAttributes, MouseEvent, ReactNode } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";

// Смена фильтров/страницы — это переход по URL внутри transition: старая выдача
// остаётся на экране (приглушённой), пока сервер готовит новую. Так «смена фильтров»
// визуально отличается от первоначальной загрузки (там — loading.tsx со скелетоном).

type CatalogNavValue = { navigate: (href: string) => void; isPending: boolean };

const CatalogNavContext = createContext<CatalogNavValue | null>(null);

export function CatalogNavProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const navigate = useCallback(
    (href: string) => startTransition(() => router.push(href, { scroll: false })),
    [router],
  );
  const value = useMemo(() => ({ navigate, isPending }), [navigate, isPending]);
  return <CatalogNavContext.Provider value={value}>{children}</CatalogNavContext.Provider>;
}

export function useCatalogNav(): CatalogNavValue {
  const ctx = useContext(CatalogNavContext);
  if (!ctx) throw new Error("useCatalogNav вне CatalogNavProvider");
  return ctx;
}

/** Обёртка выдачи: показывает, что идёт обновление, не убирая старые карточки. */
export function PendingRegion({ children }: { children: ReactNode }) {
  const { isPending } = useCatalogNav();
  return (
    <div className="relative min-w-0" aria-busy={isPending}>
      {isPending ? (
        <div
          className="sticky top-24 z-10 mx-auto mb-2 flex w-fit items-center gap-2 rounded-full bg-night px-4 py-1.5 text-sm text-white shadow-lg"
          role="status"
        >
          <Loader2 className="size-3.5 animate-spin" />
          Обновляем выдачу…
        </div>
      ) : null}
      <div
        className={
          isPending
            ? "pointer-events-none flex flex-col gap-[18px] opacity-45 transition-opacity"
            : "flex flex-col gap-[18px] transition-opacity"
        }
      >
        {children}
      </div>
    </div>
  );
}

/**
 * Прокрутка к якорю из адреса (например, /catalog?…#gear из хлебных крошек).
 * Next прокручивает к якорю, пока на экране ещё скелетон loading.tsx, где такого
 * блока нет, — поэтому повторяем прокрутку, когда настоящая страница уже отрисована.
 */
export function ScrollToHash({ id }: { id: string }) {
  const searchParams = useSearchParams();
  useEffect(() => {
    if (window.location.hash === `#${id}`) document.getElementById(id)?.scrollIntoView({ block: "start" });
  }, [id, searchParams]);
  return null;
}

/**
 * Обычная ссылка (её видят поисковики и можно открыть в новой вкладке),
 * но простой клик идёт через transition каталога.
 */
export function CatalogLink({
  href,
  children,
  className,
  scrollToId,
  ...rest
}: {
  href: string;
  children: ReactNode;
  className?: string;
  /** После клика прокрутить к началу этого элемента (например, секции выдачи при смене страницы). */
  scrollToId?: string;
} & AriaAttributes) {
  const { navigate } = useCatalogNav();
  return (
    <a
      href={href}
      className={className}
      {...rest}
      onClick={(e: MouseEvent<HTMLAnchorElement>) => {
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
        e.preventDefault();
        navigate(href);
        if (scrollToId) document.getElementById(scrollToId)?.scrollIntoView({ behavior: "smooth", block: "start" });
      }}
    >
      {children}
    </a>
  );
}
