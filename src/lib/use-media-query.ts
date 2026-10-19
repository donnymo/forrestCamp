"use client";

import { useSyncExternalStore } from "react";

/**
 * Совпадает ли медиазапрос. На сервере и при гидратации — serverValue,
 * чтобы разметка не расходилась с серверной.
 */
export function useMediaQuery(query: string, serverValue = false): boolean {
  return useSyncExternalStore(
    (onChange) => {
      const list = window.matchMedia(query);
      list.addEventListener("change", onChange);
      return () => list.removeEventListener("change", onChange);
    },
    () => window.matchMedia(query).matches,
    () => serverValue,
  );
}
