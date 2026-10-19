"use client";

// Последний рубеж: упал сам корневой layout. Стили приложения здесь недоступны.
export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="ru">
      <body style={{ fontFamily: "system-ui, sans-serif", padding: 32 }}>
        <h1>Сайт временно недоступен</h1>
        <p>Мы уже знаем о проблеме. Корзина сохранена в браузере.</p>
        <button type="button" onClick={reset}>
          Перезагрузить
        </button>
      </body>
    </html>
  );
}
