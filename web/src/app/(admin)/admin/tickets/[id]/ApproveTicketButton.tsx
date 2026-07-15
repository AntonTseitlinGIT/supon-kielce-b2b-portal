"use client";

import React, { useTransition, useState } from "react";
import { approveTicketAndGenerateOrder } from "./actions";
import { Check, Loader2 } from "lucide-react";

interface ApproveTicketButtonProps {
  ticketId: string;
  ticketType: "EXCHANGE" | "COMPLAINT";
  itemName: string;
  size?: string;
  newSize?: string;
}

export default function ApproveTicketButton({
  ticketId,
  ticketType,
  itemName,
  size,
  newSize,
}: ApproveTicketButtonProps) {
  const [isPending, startTransition] = useTransition();
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const handleApprove = () => {
    setErrorMsg("");
    setSuccessMsg("");

    const confirmed = window.confirm(
      `Czy na pewno chcesz zatwierdzić to zgłoszenie i wygenerować automatyczne zamówienie typu ${
        ticketType === "EXCHANGE" ? "Wymiana" : "Reklamacja"
      }?`
    );
    if (!confirmed) return;

    startTransition(async () => {
      const res = await approveTicketAndGenerateOrder(ticketId);
      if (res.success) {
        setSuccessMsg(`Zatwierdzono! Wygenerowano zamówienie: ${res.orderNr}`);
      } else {
        setErrorMsg(res.error || "Wystąpił błąd podczas zatwierdzania.");
      }
    });
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
      <div style={{ fontSize: "13px", color: "var(--muted)", lineHeight: "1.4" }}>
        {ticketType === "EXCHANGE" ? (
          <>
            Klient prosi o wymianę rozmiaru towaru <strong>{itemName}</strong> z obecnego <strong>{size || "brak"}</strong> na nowy: <strong style={{ color: "var(--accent)", fontSize: "14px" }}>{newSize || "brak"}</strong>.
          </>
        ) : (
          <>
            Klient zgłasza reklamację towaru <strong>{itemName}</strong> (rozmiar: {size || "brak"}). Zatwierdzenie wygeneruje bezpłatną wysyłkę zamiennika.
          </>
        )}
      </div>

      {errorMsg && (
        <div role="alert" style={{ fontSize: "12px", color: "var(--err)", fontWeight: 500 }}>
          {errorMsg}
        </div>
      )}

      {successMsg ? (
        <div role="status" aria-live="polite" style={{ display: "flex", alignItems: "center", gap: "6px", color: "var(--ok)", fontSize: "13px", fontWeight: 600 }}>
          <Check size={16} aria-hidden="true" /> {successMsg}
        </div>
      ) : (
        <button
          onClick={handleApprove}
          className="btn btn-primary"
          disabled={isPending}
          style={{ width: "100%", justifyContent: "center", display: "inline-flex", gap: "8px", height: "40px" }}
        >
          {isPending ? (
            <>
              <Loader2 className="animate-spin" size={16} /> Zatwierdzanie...
            </>
          ) : (
            <>
              <Check size={16} /> Zatwierdź i wygeneruj zamówienie
            </>
          )}
        </button>
      )}
    </div>
  );
}
