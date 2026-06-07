"use client";

import ErrorPage from "@/components/ErrorPage";

export default function UsersError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <ErrorPage
      error={error}
      reset={reset}
      title="Błąd ładowania użytkowników"
      backHref="/admin/dashboard"
      backLabel="Wróć do pulpitu"
    />
  );
}
