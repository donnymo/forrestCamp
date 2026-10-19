"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LogOut, ShoppingCart, User } from "lucide-react";
import type { ReactNode } from "react";
import { useCart } from "./cart/CartProvider";
import { useAuth } from "./auth/AuthProvider";
import { Button } from "@/components/ui/button";
import { selectItemCount } from "@/lib/cart/model";
import { clientApi } from "@/lib/api/client";
import { cn } from "@/lib/utils";

export function NavLink({ href, children }: { href: string; children: ReactNode }) {
  const pathname = usePathname();
  const active = pathname === href || pathname.startsWith(`${href}/`);
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "border-b-2 py-1.5 text-sm font-medium whitespace-nowrap transition-colors sm:text-[15px]",
        active ? "border-primary text-primary" : "border-transparent text-stone-700 hover:text-primary",
      )}
    >
      {children}
    </Link>
  );
}

export function CartLink() {
  const { state, hydrated } = useCart();
  const pathname = usePathname();
  const count = hydrated ? selectItemCount(state) : 0;
  return (
    <Button
      asChild
      size="lg"
      className={cn("relative h-11 gap-2.5 rounded-[10px] px-3 sm:px-[18px]", pathname === "/cart" && "bg-primary-active")}
    >
      <Link href="/cart" aria-label={count > 0 ? `Корзина, ${count} шт.` : "Корзина"}>
        <ShoppingCart className="size-[18px]" />
        <span className="hidden sm:inline">Корзина</span>
        {count > 0 ? (
          // На телефоне счётчик — уголком на иконке: кнопка остаётся квадратной и шапка помещается в 320px.
          <span
            className="flex h-[22px] min-w-[22px] items-center justify-center rounded-full bg-bark-gradient px-1.5 text-xs font-bold text-white max-sm:absolute max-sm:-top-2 max-sm:-right-2 max-sm:ring-2 max-sm:ring-white"
            aria-hidden
          >
            {count}
          </span>
        ) : null}
      </Link>
    </Button>
  );
}

const AUTH_BUTTON = "h-11 rounded-[10px] border-primary px-3 text-primary sm:px-[18px]";

export function AuthMenu() {
  const { user, ready, setUser } = useAuth();
  const router = useRouter();
  // Заглушка той же ширины, что и кнопка, — шапка не прыгает после загрузки сессии.
  if (!ready) return <span className="h-11 w-11 sm:w-24" aria-hidden />;
  if (!user) {
    return (
      <Button asChild variant="outline" size="lg" className={AUTH_BUTTON}>
        <Link href="/login" aria-label="Войти">
          <User className="size-[18px]" />
          <span className="hidden sm:inline">Войти</span>
        </Link>
      </Button>
    );
  }
  return (
    <Button
      variant="outline"
      size="lg"
      className={AUTH_BUTTON}
      aria-label="Выйти"
      title={`Выйти из ${user.email}`}
      onClick={async () => {
        try {
          await clientApi.logout();
        } finally {
          setUser(null);
          router.refresh();
        }
      }}
    >
      <LogOut className="size-[18px]" />
      <span className="hidden sm:inline">Выйти</span>
    </Button>
  );
}
