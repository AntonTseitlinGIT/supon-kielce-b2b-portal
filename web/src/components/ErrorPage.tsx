"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCw, ArrowLeft } from "lucide-react";

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
  title?: string;
  backHref?: string;
  backLabel?: string;
}

export default function ErrorPage({
  error,
  reset,
  title = "Wystąpił błąd",
  backHref,
  backLabel = "Wróć",
}: ErrorPageProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      minHeight: "60vh",
      gap: 24,
      textAlign: "center",
      padding: "40px 24px",
    }}>
      <div style={{
        width: 64,
        height: 64,
        borderRadius: 16,
        background: "color-mix(in oklab, var(--err) 10%, var(--page-bg))",
        display: "grid",
        placeItems: "center",
        color: "var(--err)",
      }}>
        <AlertTriangle size={28} />
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8, maxWidth: 420 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, margin: 0, fontFamily: "var(--font-heading)" }}>
          {title}
        </h1>
        <p style={{ color: "var(--muted)", fontSize: 15, margin: 0, lineHeight: 1.6 }}>
          Coś poszło nie tak podczas ładowania tej strony. Spróbuj odświeżyć lub wróć do poprzedniej sekcji.
        </p>
        {error.digest && (
          <code style={{
            fontSize: 11,
            color: "var(--muted)",
            background: "var(--section-bg)",
            padding: "4px 8px",
            borderRadius: 4,
            marginTop: 4,
          }}>
            {error.digest}
          </code>
        )}
      </div>

      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center" }}>
        <button onClick={reset} className="btn btn-secondary" style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <RefreshCw size={15} />
          Spróbuj ponownie
        </button>
        {backHref && (
          <a href={backHref} className="btn btn-ghost" style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <ArrowLeft size={15} />
            {backLabel}
          </a>
        )}
      </div>
    </div>
  );
}
