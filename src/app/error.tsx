"use client";

import { PageError } from "@/components/PageError";

export default function RootError(props: { error: Error & { digest?: string }; reset: () => void }) {
  return <PageError {...props} title="Что-то пошло не так" />;
}
