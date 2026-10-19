"use client";

import { PageError } from "@/components/PageError";

export default function ItemError(props: { error: Error & { digest?: string }; reset: () => void }) {
  return <PageError {...props} title="Карточка не открылась" />;
}
