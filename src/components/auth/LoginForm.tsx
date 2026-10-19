"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { useAuth } from "./AuthProvider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { clientApi } from "@/lib/api/client";
import { ApiError, ValidationError } from "@/lib/api/errors";

export function LoginForm({ next }: { next: string }) {
  const router = useRouter();
  const { setUser } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  return (
    <Card className="rounded-[18px] border-line shadow-panel">
      <form
        noValidate
        className="flex flex-col gap-6"
        onSubmit={async (e) => {
          e.preventDefault();
          if (pending) return;
          setPending(true);
          setErrors({});
          setFormError(null);
          try {
            const { user } = await clientApi.login(email, password);
            setUser(user);
            router.replace(next);
            router.refresh();
          } catch (error) {
            if (error instanceof ValidationError) setErrors(error.fields);
            else setFormError(error instanceof ApiError ? error.message : "Не удалось войти");
            setPending(false);
          }
        }}
      >
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="login-email">Почта</Label>
            <Input
              id="login-email"
              type="email"
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              aria-invalid={!!errors.email}
              className="h-12 rounded-[10px] text-[15px]"
            />
            {errors.email ? <span className="text-[13px] text-destructive">{errors.email}</span> : null}
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="login-password">Пароль</Label>
            <Input
              id="login-password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              aria-invalid={!!errors.password}
              className="h-12 rounded-[10px] text-[15px]"
            />
            {errors.password ? <span className="text-[13px] text-destructive">{errors.password}</span> : null}
          </div>
          {formError ? (
            <p className="text-sm text-destructive" role="alert">
              {formError}
            </p>
          ) : null}
        </CardContent>
        <CardFooter className="flex flex-col items-stretch gap-3">
          <Button type="submit" size="lg" className="h-12 rounded-xl text-base font-semibold" disabled={pending}>
            {pending ? <Loader2 className="animate-spin" /> : null}
            {pending ? "Входим…" : "Войти"}
          </Button>
          <p className="text-center text-[13px] text-muted-foreground">Учебный аккаунт: demo@prokat.test / demo1234</p>
        </CardFooter>
      </form>
    </Card>
  );
}
