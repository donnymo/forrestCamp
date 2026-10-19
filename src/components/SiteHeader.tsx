import Link from "next/link";
import { AuthMenu, CartLink, NavLink } from "@/components/HeaderWidgets";
import { LogoMark } from "@/components/Logo";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/85">
      <div className="mx-auto flex h-16 max-w-[1200px] items-center gap-2.5 px-4 min-[400px]:gap-3 sm:h-[76px] sm:gap-10 sm:px-6">
        <Link href="/catalog" className="flex flex-none items-center gap-2.5" aria-label="Forest Camp — на главную">
          <span className="flex size-10 flex-none items-center justify-center rounded-[11px] bg-primary">
            <LogoMark className="size-[31px]" />
          </span>
          <span className="hidden font-brand text-[27px] leading-none text-primary md:inline">Forest Camp</span>
        </Link>
        <nav aria-label="Основная навигация" className="flex min-w-0 flex-1 gap-3 min-[400px]:gap-3.5 sm:justify-center sm:gap-7">
          <NavLink href="/catalog">Каталог</NavLink>
          <NavLink href="/account">Мои брони</NavLink>
        </nav>
        <div className="flex flex-none items-center gap-2 sm:gap-3">
          <AuthMenu />
          <CartLink />
        </div>
      </div>
    </header>
  );
}
