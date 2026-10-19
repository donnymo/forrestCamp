"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { clientApi } from "@/lib/api/client";
import type { User } from "@/lib/api/types";

type AuthContextValue = {
  user: User | null;
  ready: boolean;
  reload: () => Promise<void>;
  setUser: (user: User | null) => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);

  const reload = useCallback(async () => {
    try {
      const { user } = await clientApi.me();
      setUser(user);
    } catch {
      setUser(null);
    } finally {
      setReady(true);
    }
  }, []);

  // Первичная загрузка сессии. Ответ после размонтирования игнорируем.
  useEffect(() => {
    let active = true;
    clientApi
      .me()
      .then(({ user }) => active && setUser(user))
      .catch(() => active && setUser(null))
      .finally(() => active && setReady(true));
    return () => {
      active = false;
    };
  }, []);

  const value = useMemo(() => ({ user, ready, reload, setUser }), [user, ready, reload]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth вне AuthProvider");
  return ctx;
}
