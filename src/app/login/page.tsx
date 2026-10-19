import type { Metadata } from "next";
import { Info } from "lucide-react";
import { LoginForm } from "@/components/auth/LoginForm";
import { safeNextPath } from "@/lib/api/session";
import { LogoMark } from "@/components/Logo";
import { CONTAINER } from "@/components/SectionHeading";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Вход", robots: { index: false } };

type Props = PageProps<"/login">;

export default async function LoginPage({ searchParams }: Props) {
  const sp = await searchParams;
  const next = safeNextPath(sp.next);
  const expired = sp.reason === "expired";
  return (
    <div className={cn(CONTAINER, "flex flex-col items-center pt-8 pb-24 sm:pt-14")}>
      <div className="flex w-full max-w-[420px] flex-col gap-6">
        <div className="flex flex-col items-center gap-3 text-center">
          <span className="flex size-14 items-center justify-center rounded-2xl bg-primary">
            <LogoMark className="size-10" />
          </span>
          <span className="font-script text-[30px] leading-none text-bark-text">С возвращением</span>
          <h1 className="font-heading text-3xl font-light tracking-[0.08em] uppercase">Вход</h1>
          {!expired && next === "/checkout" ? (
            <p className="text-sm text-muted-foreground">Чтобы подтвердить бронь, войдите в аккаунт.</p>
          ) : null}
        </div>
        {expired ? (
          <Alert className="rounded-[14px] border-line bg-white">
            <Info className="text-primary" />
            <AlertDescription>Сессия истекла. Войдите снова — корзина и введённые данные сохранены.</AlertDescription>
          </Alert>
        ) : null}
        <LoginForm next={next} />
      </div>
    </div>
  );
}
