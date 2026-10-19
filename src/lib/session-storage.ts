// Безопасная работа с sessionStorage: недоступное хранилище (SSR, приватный режим,
// переполнение) не роняет страницу — чтение возвращает null, запись молча пропускается.

export function readSessionJson<T>(key: string): T | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

/** null удаляет ключ. */
export function writeSessionJson(key: string, value: unknown): void {
  try {
    if (value === null) window.sessionStorage.removeItem(key);
    else window.sessionStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Хранилище недоступно — данные просто не переживут перезагрузку.
  }
}
