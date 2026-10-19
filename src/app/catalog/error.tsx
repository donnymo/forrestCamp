"use client";

import { PageError } from "@/components/PageError";

export default function CatalogError(props: { error: Error & { digest?: string }; reset: () => void }) {
  return <PageError {...props} title="Каталог не открылся" />;
}
