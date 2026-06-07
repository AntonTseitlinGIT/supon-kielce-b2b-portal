import { OrderStatus, TicketStatus, TicketType, Priority } from "@prisma/client";

export function formatOrderStatus(status: OrderStatus): { label: string; className: string } {
  switch (status) {
    case "DRAFT":
      return { label: "Szkic", className: "badge-neutral" };
    case "IN_PROGRESS":
      return { label: "W realizacji", className: "badge-warning" };
    case "APPROVED":
      return { label: "Zatwierdzone", className: "badge-info" };
    case "PARTIALLY_SENT":
      return { label: "Częściowo wysłane", className: "badge-warning" };
    case "SENT":
      return { label: "Wysłane", className: "badge-success" };
    case "DELIVERED":
      return { label: "Dostarczone", className: "badge-success" };
    case "CANCELLED":
      return { label: "Anulowane", className: "badge-danger" };
    default:
      return { label: status, className: "badge-neutral" };
  }
}

export function formatTicketStatus(status: TicketStatus): { label: string; className: string } {
  switch (status) {
    case "NEW":
      return { label: "Nowe", className: "badge-info" };
    case "IN_PROGRESS":
      return { label: "W toku", className: "badge-warning" };
    case "RESOLVED":
      return { label: "Rozwiązane", className: "badge-success" };
    case "CLOSED":
      return { label: "Zamknięte", className: "badge-neutral" };
    default:
      return { label: status, className: "badge-neutral" };
  }
}

export function formatTicketType(type: TicketType): string {
  switch (type) {
    case "COMPLAINT":
      return "Reklamacja";
    case "EXCHANGE":
      return "Wymiana";
    case "GENERAL":
      return "Inne";
    default:
      return type;
  }
}

export function formatPriority(priority: Priority): { label: string; className: string } {
  switch (priority) {
    case "STANDARD":
      return { label: "Standard", className: "badge-neutral" };
    case "HIGH":
      return { label: "Wysoki", className: "badge-warning" };
    case "CRITICAL":
      return { label: "Krytyczny", className: "badge-danger" };
    default:
      return { label: priority, className: "badge-neutral" };
  }
}

export function formatDate(date: Date | string | null): string {
  if (!date) return "—";
  const d = new Date(date);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("pl-PL", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatShortDate(date: Date | string | null): string {
  if (!date) return "—";
  const d = new Date(date);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("pl-PL", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}
