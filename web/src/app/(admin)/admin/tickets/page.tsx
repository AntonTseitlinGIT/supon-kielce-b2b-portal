import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import Link from "next/link";
import { MessageCircle, ChevronLeft, ChevronRight } from "lucide-react";
import { formatTicketStatus, formatTicketType, formatShortDate } from "@/utils/format";
import AdminTicketFilters from "./AdminTicketFilters";
import ClickableRow from "./ClickableRow";

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

interface PageProps {
  searchParams: SearchParams;
}

export default async function AdminTicketsPage(props: PageProps) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const { role } = session.user;
  if (role !== "SUPON_MANAGER" && role !== "SUPON_ADMIN") {
    redirect("/client/dashboard");
  }

  const searchParams = await props.searchParams;

  const search = (searchParams.search as string) || "";
  const status = (searchParams.status as string) || "";
  const type = (searchParams.type as string) || "";
  const clientIdParam = (searchParams.clientId as string) || "";
  const page = parseInt((searchParams.page as string) || "1", 10);
  const limit = 10;
  const skip = (page - 1) * limit;

  // 1. Build DB Query Filter
  const where: any = {};

  if (clientIdParam) {
    where.clientId = clientIdParam;
  }

  if (status) {
    where.status = status;
  }

  if (type) {
    where.type = type;
  }

  if (search) {
    where.OR = [
      { ticketNr: { contains: search, mode: "insensitive" } },
      { employeeName: { contains: search, mode: "insensitive" } },
      { itemName: { contains: search, mode: "insensitive" } },
    ];
  }

  // 2. Query Data
  const [tickets, totalTickets, clients] = await Promise.all([
    prisma.ticket.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
      include: {
        client: { select: { name: true } },
        branch: { select: { name: true } },
        order: { select: { orderNr: true } },
      },
    }),
    prisma.ticket.count({ where }),
    prisma.client.findMany({
      where: { isActive: true },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  const totalPages = Math.ceil(totalTickets / limit) || 1;

  // 3. Pagination URL Generator
  const getPageUrl = (pageNumber: number) => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (status) params.set("status", status);
    if (type) params.set("type", type);
    if (clientIdParam) params.set("clientId", clientIdParam);
    params.set("page", pageNumber.toString());
    return `?${params.toString()}`;
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* Page Header */}
      <div className="page-header" style={{ position: "static", background: "transparent", borderBottom: "none", padding: "0 0 10px 0", minHeight: "auto" }}>
        <div>
          <h1 style={{ fontFamily: "var(--font-heading)", fontWeight: 800, fontSize: "28px", color: "var(--text-primary)" }}>
            Zgłoszenia i Reklamacje Klientów
          </h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "14px" }}>
            Przeglądaj zgłoszenia reklamacyjne, prośby o wymianę odzieży oraz wiadomości kontaktowe od klientów
          </p>
        </div>
      </div>

      {/* Filters */}
      <AdminTicketFilters clients={clients} />

      {/* List Card */}
      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        {tickets.length === 0 ? (
          <div className="empty-state">
            <MessageCircle />
            <h3>Brak zgłoszeń</h3>
            <p>Nie odnaleziono zgłoszeń spełniających wybrane kryteria.</p>
          </div>
        ) : (
          <>
            <div className="table-wrapper">
              <table className="table">
                <thead>
                  <tr>
                    <th>Numer</th>
                    <th>Klient</th>
                    <th>Oddział</th>
                    <th>Typ zgłoszenia</th>
                    <th>Zamówienie powiązane</th>
                    <th>Pracownik / Towar</th>
                    <th>Data utworzenia</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {tickets.map((ticket) => {
                    const statusInfo = formatTicketStatus(ticket.status);
                    const typeLabel = formatTicketType(ticket.type);
                    const details = ticket.employeeName 
                      ? `${ticket.employeeName}${ticket.itemName ? ` (${ticket.itemName})` : ""}`
                      : ticket.itemName || "—";

                    return (
                      <ClickableRow key={ticket.id} id={ticket.id}>
                        <td style={{ fontWeight: 600, color: "var(--accent)" }}>
                          {ticket.ticketNr}
                        </td>
                        <td>{ticket.client.name.split("—")[0].trim()}</td>
                        <td style={{ color: "var(--text-secondary)" }}>{ticket.branch.name}</td>
                        <td style={{ fontWeight: 600 }}>{typeLabel}</td>
                        <td>
                          {ticket.order ? (
                            <Link href={`/admin/orders/${ticket.orderId}`} style={{ textDecoration: "underline", color: "var(--text-secondary)" }}>
                              {ticket.order.orderNr}
                            </Link>
                          ) : (
                            <span style={{ color: "var(--text-muted)", fontSize: "13px" }}>brak</span>
                          )}
                        </td>
                        <td style={{ color: "var(--text-secondary)" }} title={details}>{details}</td>
                        <td style={{ color: "var(--text-secondary)" }}>{formatShortDate(ticket.createdAt)}</td>
                        <td>
                          <span className={`badge ${statusInfo.className}`}>
                            {statusInfo.label}
                          </span>
                        </td>
                      </ClickableRow>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="pagination">
                <div>
                  Pokazano <strong>{skip + 1}</strong>–<strong>{Math.min(skip + limit, totalTickets)}</strong> z <strong>{totalTickets}</strong> zgłoszeń
                </div>
                <div className="pagination-controls">
                  <Link
                    href={getPageUrl(page - 1)}
                    className="page-btn"
                    style={{ pointerEvents: page <= 1 ? "none" : "auto", opacity: page <= 1 ? 0.4 : 1 }}
                  >
                    <ChevronLeft size={16} />
                  </Link>

                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                    <Link
                      key={p}
                      href={getPageUrl(p)}
                      className={`page-btn ${p === page ? "active" : ""}`}
                    >
                      {p}
                    </Link>
                  ))}

                  <Link
                    href={getPageUrl(page + 1)}
                    className="page-btn"
                    style={{ pointerEvents: page >= totalPages ? "none" : "auto", opacity: page >= totalPages ? 0.4 : 1 }}
                  >
                    <ChevronRight size={16} />
                  </Link>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
