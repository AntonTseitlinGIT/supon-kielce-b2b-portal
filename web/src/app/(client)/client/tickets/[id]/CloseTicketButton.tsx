"use client";

import React, { useTransition } from "react";
import { closeTicket } from "./closeAction";
import { useRouter } from "next/navigation";
import { useConfirm } from "@/components/ConfirmDialog";
import { useToast } from "@/components/ToastProvider";

interface CloseTicketButtonProps {
  ticketId: string;
}

export default function CloseTicketButton({ ticketId }: CloseTicketButtonProps) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const { confirm } = useConfirm();
  const { showSuccess, showError } = useToast();

  const handleClose = async () => {
    const confirmed = await confirm({
      title: "Zamknij zgłoszenie",
      message: "Czy na pewno chcesz zamknąć to zgłoszenie? Tej operacji nie można cofnąć.",
      confirmText: "Zamknij zgłoszenie",
      variant: "danger",
    });

    if (!confirmed) return;

    startTransition(async () => {
      const res = await closeTicket(ticketId);
      if (res.success) {
        showSuccess("Zgłoszenie zostało pomyślnie zamknięte.");
        router.refresh();
      } else {
        showError(res.error || "Wystąpił błąd podczas zamykania zgłoszenia.");
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

