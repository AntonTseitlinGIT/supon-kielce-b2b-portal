"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export interface SearchResult {
  id: string;
  title: string;
  subtitle: string;
  category: "Zamówienia" | "Pracownicy" | "Katalog ŚOI" | "Klienci" | "Zgłoszenia";
  url: string;
  statusLabel?: string;
  statusClass?: string;
}

export async function globalSearch(query: string, scope: "client" | "admin") {
  const session = await auth();

  if (!session?.user) {
    return { success: false, error: "Brak autoryzacji." };
  }

  const q = query.trim().toLowerCase();
  if (q.length < 2) {
    return { success: true, results: [] };
  }

  const results: SearchResult[] = [];

  try {
    if (scope === "client") {
      const clientId = session.user.clientId;
      const branchId = session.user.branchId;
      const role = session.user.role;

      if (!clientId) {
        return { success: false, error: "Błąd sesji klienta." };
      }

      const clientWhere = { clientId };
      const branchWhere = role === "BRANCH_HEAD" ? { branchId } : { branch: { clientId } };

      // 1. Search employees
      const employees = await prisma.employee.findMany({
        where: {
          AND: [
            role === "BRANCH_HEAD" ? { branchId: branchId || "" } : { branch: { clientId } },
            { deletedAt: null },
            {
              OR: [
                { name: { contains: q, mode: "insensitive" } },
                { employeeNr: { contains: q, mode: "insensitive" } },
                { jobTitle: { contains: q, mode: "insensitive" } }
              ]
            }
          ]
        },
        include: { branch: true },
        take: 5
      });

      // 2. Search orders
      const orders = await prisma.order.findMany({
        where: {
          AND: [
            { clientId },
            { deletedAt: null },
            role === "BRANCH_HEAD" ? { branchId: branchId || "" } : {},
            {
              OR: [
                { orderNr: { contains: q, mode: "insensitive" } },
                { clientRef: { contains: q, mode: "insensitive" } },
                { comments: { contains: q, mode: "insensitive" } }
              ]
            }
          ]
        },
        include: { branch: true },
        take: 5
      });

      // 3. Search tickets
      const tickets = await prisma.ticket.findMany({
        where: {
          AND: [
            { clientId },
            role === "BRANCH_HEAD" ? { branchId: branchId || "" } : {},
            {
              OR: [
                { ticketNr: { contains: q, mode: "insensitive" } },
                { employeeName: { contains: q, mode: "insensitive" } },
                { itemName: { contains: q, mode: "insensitive" } }
              ]
            }
          ]
        },
        take: 5
      });

      // 4. Search client catalog products
      const products = await prisma.product.findMany({
        where: {
          AND: [
            { clientProducts: { some: { clientId, isActive: true } } },
            {
              OR: [
                { name: { contains: q, mode: "insensitive" } },
                { articleNr: { contains: q, mode: "insensitive" } },
                { description: { contains: q, mode: "insensitive" } }
              ]
            }
          ]
        },
        take: 5
      });

      // Map employees
      employees.forEach((e) => {
        results.push({
          id: e.id,
          title: e.name,
          subtitle: `${e.jobTitle} — Oddział: ${e.branch.name} (Kod: ${e.employeeNr})`,
          category: "Pracownicy",
          url: `/client/personnel/${e.id}`,
          statusLabel: e.status === "ACTIVE" ? "Aktywny" : "Nieaktywny",
          statusClass: e.status === "ACTIVE" ? "ok" : "err"
        });
      });

      // Map orders
      orders.forEach((o) => {
        const STATUS_MAP: Record<string, string> = {
          DRAFT: "Szkic",
          APPROVED: "Zatwierdzone",
          IN_PROGRESS: "W realizacji",
          PARTIALLY_SENT: "Częściowo wysłane",
          SENT: "Wysłane",
          DELIVERED: "Dostarczone",
          CANCELLED: "Anulowane"
        };
        results.push({
          id: o.id,
          title: `Zamówienie ${o.orderNr}`,
          subtitle: `Dostawa: ${o.branch.name} ${o.clientRef ? `(Ref: ${o.clientRef})` : ""}`,
          category: "Zamówienia",
          url: `/client/orders/${o.id}`,
          statusLabel: STATUS_MAP[o.status] || o.status,
          statusClass: o.status === "DELIVERED" ? "ok" : o.status === "CANCELLED" ? "err" : "info"
        });
      });

      // Map tickets
      tickets.forEach((t) => {
        const TYPE_MAP: Record<string, string> = {
          COMPLAINT: "Reklamacja",
          EXCHANGE: "Wymiana",
          GENERAL: "Zgłoszenie ogólne"
        };
        const STATUS_MAP: Record<string, string> = {
          NEW: "Nowe",
          IN_PROGRESS: "W realizacji",
          RESOLVED: "Rozwiązane",
          CLOSED: "Zamknięte"
        };
        results.push({
          id: t.id,
          title: `Zgłoszenie ${t.ticketNr} (${TYPE_MAP[t.type]})`,
          subtitle: t.itemName ? `Artykuł: ${t.itemName}` : "Brak powiązanego produktu",
          category: "Zgłoszenia",
          url: `/client/tickets/${t.id}`,
          statusLabel: STATUS_MAP[t.status] || t.status,
          statusClass: t.status === "NEW" ? "warn" : t.status === "RESOLVED" ? "ok" : "info"
        });
      });

      // Map products
      products.forEach((p) => {
        results.push({
          id: p.id,
          title: p.name,
          subtitle: `Art. nr: ${p.articleNr}`,
          category: "Katalog ŚOI",
          url: "/client/catalog" // Catalog is a single grid
        });
      });

    } else if (scope === "admin") {
      const [clients, products, orders, tickets] = await Promise.all([
        // 1. Search clients
        prisma.client.findMany({
          where: {
            OR: [
              { name: { contains: q, mode: "insensitive" } },
              { nip: { contains: q, mode: "insensitive" } },
              { address: { contains: q, mode: "insensitive" } }
            ]
          },
          take: 5
        }),

        // 2. Search products
        prisma.product.findMany({
          where: {
            OR: [
              { name: { contains: q, mode: "insensitive" } },
              { articleNr: { contains: q, mode: "insensitive" } },
              { description: { contains: q, mode: "insensitive" } }
            ]
          },
          take: 5
        }),

        // 3. Search orders
        prisma.order.findMany({
          where: {
            deletedAt: null,
            OR: [
              { orderNr: { contains: q, mode: "insensitive" } },
              { clientRef: { contains: q, mode: "insensitive" } },
              { client: { name: { contains: q, mode: "insensitive" } } }
            ]
          },
          include: { client: true },
          take: 5
        }),

        // 4. Search tickets
        prisma.ticket.findMany({
          where: {
            OR: [
              { ticketNr: { contains: q, mode: "insensitive" } },
              { client: { name: { contains: q, mode: "insensitive" } } },
              { employeeName: { contains: q, mode: "insensitive" } }
            ]
          },
          include: { client: true },
          take: 5
        })
      ]);

      // Map clients
      clients.forEach((c) => {
        results.push({
          id: c.id,
          title: c.name,
          subtitle: `NIP: ${c.nip} — ${c.address || ""}`,
          category: "Klienci",
          url: `/admin/clients/${c.id}`,
          statusLabel: c.isActive ? "Aktywny" : "Nieaktywny",
          statusClass: c.isActive ? "ok" : "err"
        });
      });

      // Map products
      products.forEach((p) => {
        results.push({
          id: p.id,
          title: p.name,
          subtitle: `Art. nr: ${p.articleNr}`,
          category: "Katalog ŚOI",
          url: `/admin/catalog`,
          statusLabel: p.isActive ? "Aktywny" : "Zablokowany",
          statusClass: p.isActive ? "ok" : "err"
        });
      });

      // Map orders
      orders.forEach((o) => {
        const STATUS_MAP: Record<string, string> = {
          DRAFT: "Szkic",
          APPROVED: "Zatwierdzone",
          IN_PROGRESS: "W realizacji",
          PARTIALLY_SENT: "Częściowo wysłane",
          SENT: "Wysłane",
          DELIVERED: "Dostarczone",
          CANCELLED: "Anulowane"
        };
        results.push({
          id: o.id,
          title: `Zamówienie ${o.orderNr} — ${o.client.name.split("—")[0].trim()}`,
          subtitle: o.clientRef ? `Ref klienta: ${o.clientRef}` : "Brak referencji",
          category: "Zamówienia",
          url: `/admin/orders/${o.id}`,
          statusLabel: STATUS_MAP[o.status] || o.status,
          statusClass: o.status === "DELIVERED" ? "ok" : o.status === "CANCELLED" ? "err" : "info"
        });
      });

      // Map tickets
      tickets.forEach((t) => {
        const STATUS_MAP: Record<string, string> = {
          NEW: "Nowe",
          IN_PROGRESS: "W realizacji",
          RESOLVED: "Rozwiązane",
          CLOSED: "Zamknięte"
        };
        results.push({
          id: t.id,
          title: `Zgłoszenie ${t.ticketNr} — ${t.client.name.split("—")[0].trim()}`,
          subtitle: t.employeeName ? `Pracownik: ${t.employeeName}` : "Zgłoszenie centrali",
          category: "Zgłoszenia",
          url: `/admin/tickets/${t.id}`,
          statusLabel: STATUS_MAP[t.status] || t.status,
          statusClass: t.status === "NEW" ? "warn" : t.status === "RESOLVED" ? "ok" : "info"
        });
      });
    }

    return { success: true, results };
  } catch (error: any) {
    console.error("Global search failed:", error);
    return { success: false, error: "Błąd wyszukiwania." };
  }
}
