// Правила проверки контактов общие для формы и API: клиент подсвечивает ошибки сразу,
// сервер проверяет то же самое и отвечает 422 с теми же ключами полей.

export type ContactInput = { name: string; phone: string; email: string; comment: string };
export type ContactErrors = Partial<Record<keyof ContactInput, string>>;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateContact(input: Partial<Record<keyof ContactInput, unknown>>): ContactErrors {
  const errors: ContactErrors = {};
  const name = typeof input.name === "string" ? input.name.trim() : "";
  const phone = typeof input.phone === "string" ? input.phone : "";
  const email = typeof input.email === "string" ? input.email.trim() : "";
  const comment = typeof input.comment === "string" ? input.comment : "";

  if (name.length < 2) errors.name = "Укажите имя — минимум 2 символа.";
  else if (name.length > 80) errors.name = "Слишком длинное имя.";

  const digits = phone.replace(/\D/g, "");
  if (!/^[\d\s()+-]*$/.test(phone) || digits.length < 10 || digits.length > 15) {
    errors.phone = "Телефон в формате +7 999 000-11-22.";
  }

  if (!EMAIL_RE.test(email)) errors.email = "Проверьте адрес почты.";

  if (comment.length > 500) errors.comment = "Комментарий — не длиннее 500 символов.";

  return errors;
}
