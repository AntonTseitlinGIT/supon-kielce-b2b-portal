"use client";

import React, { useState, useTransition } from "react";
import { TicketStatus } from "@prisma/client";
import { updateTicketStatus } from "./actions";
import { Loader2 } from "lucide-react";

interface TicketStatusControllerProps {
  ticketId: string;
  initialStatus: TicketStatus;
}

export default function TicketStatusController({
  ticketId,
  initialStatus,
}: TicketStatusControllerProps) {
  const [status, setStatus] = useState<TicketStatus>(initialStatus);
  const [isPending, startTransition] = useTransition();

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newStatus = e.target.value as TicketStatus;
    startTransition(async () => {
      const res = await updateTicketStatus(ticketId, newStatus);
      if (res.success) {
        setStatus(newStatus);
      } else {
        alert(res.error || "Wystąpił błąd");
      }
    });
  };

  return (
    <div>
      <label htmlFor="ticket-status-select" style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", color: "var(--muted)", display: "block", marginBottom: "6px" }}>
        Status zgłoszenia
      </label>
      <div className="row-8">
        <select
          id="ticket-status-select"
          className="form-select"
          value={status}
          onChange={handleStatusChange}
          disabled={isPending}
          style={{ flex: 1, marginTop: 0 }}
        >
          <option value="NEW">Nowe</option>
          <option value="IN_PROGRESS">W toku</option>
          <option value="RESOLVED">Rozwiązane</option>
          <option value="CLOSED">Zamknięte</option>
        </select>
        {isPending && <Loader2 size={16} className="animate-spin" style={{ color: "var(--accent)" }} />}
      </div>
    </div>
  );
}
