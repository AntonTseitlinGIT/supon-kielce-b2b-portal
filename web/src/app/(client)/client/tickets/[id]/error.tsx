"use client";

import ErrorPage from "@/components/ErrorPage";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <ErrorPage error={error} reset={reset} title="Błąd ładowania zgłoszenia" backHref="/client/tickets" backLabel="Wróć do zgłoszeń" />;
}
