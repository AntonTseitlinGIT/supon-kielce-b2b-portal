"use client";

import React, { useTransition } from "react";
import { closeTicket } from "./closeAction";
import { useRouter } from "next/navigation";

interface CloseTicketButtonProps {
  ticketId: string;
}

export default function CloseTicketButton({ ticketId }: CloseTicketButtonProps) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleClose = () => {
    if (!confirm("Czy na pewno chcesz zamknąć to zgłoszenie? Tej operacji nie można cofnąć.")) {
      return;
    }

    startTransition(async () => {
      const res = await closeTicket(ticketId);
      if (res.success) {
        alert("Zgłoszenie zostało zamknięte.");
        router.refresh();
      } else {
        alert(res.error || "Wystąpił błąd");
      }
    });
  };

  return (
    <button
      onClick={handleClose}
      disabled={isPending}
      className="btn btn-danger btn-sm"
      style={{
        height: "36px",
        padding: "0 16px",
        borderRadius: "8px",
        boxShadow: "none",
        fontSize: "13px",
        fontWeight: 600,
      }}
    >
      {isPending ? "Zamykanie..." : "Zamknij zgłoszenie"}
    </button>
  );
}
