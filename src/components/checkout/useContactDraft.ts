"use client";

import { useEffect, useState } from "react";
import type { User } from "@/lib/api/types";
import type { ContactErrors, ContactInput } from "@/lib/domain/contact";
import { readSessionJson, writeSessionJson } from "@/lib/session-storage";

export const DRAFT_KEY = "rr-checkout-draft";

const EMPTY_CONTACT: ContactInput = { name: "", phone: "", email: "", comment: "" };

/**
 * Контакты формы оформления. Черновик переживает уход на вход после 401 (sessionStorage),
 * пустые поля подставляются из профиля, как только он загрузится.
 */
export function useContactDraft(user: User | null) {
  const [contact, setContact] = useState<ContactInput>(() => ({
    ...EMPTY_CONTACT,
    ...readSessionJson<Partial<ContactInput>>(DRAFT_KEY),
  }));
  const [errors, setErrors] = useState<ContactErrors>({});

  // Профиль появился (или сменился) — дозаполняем пустые поля прямо при рендере.
  const [prefilledFor, setPrefilledFor] = useState<string | null>(null);
  if (user && prefilledFor !== user.id) {
    setPrefilledFor(user.id);
    setContact((c) => ({
      ...c,
      name: c.name || user.name,
      email: c.email || user.email,
      phone: c.phone || user.phone,
    }));
  }

  useEffect(() => {
    const touched = Object.values(contact).some((v) => v !== "");
    if (touched) writeSessionJson(DRAFT_KEY, contact);
  }, [contact]);

  const setField = (field: keyof ContactInput) => (value: string) => {
    setContact((c) => ({ ...c, [field]: value }));
    setErrors((e) => ({ ...e, [field]: undefined }));
  };

  return { contact, errors, setErrors, setField };
}
