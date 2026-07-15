import { isSuponRole } from "@/config/permissions.config";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import Link from "next/link";
import { MessageCircle } from "lucide-react";
import Pagination from "@/components/Pagination";
import { formatTicketStatus, formatTicketType, formatShortDate } from "@/utils/format";
import AdminTicketFilters from "./AdminTicketFilters";
import ClickableRow from "./ClickableRow";
import PageHeader from "@/components/PageHeader";

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
  if (!isSuponRole(role)) {
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
    <div className="col-20">
      <PageHeader
        title="Zgłoszenia i Reklamacje Klientów"
        subtitle="Przeglądaj zgłoszenia reklamacyjne, prośby o wymianę odzieży oraz wiadomości kontaktowe od klientów"
      />

      {/* Filters */}
      <AdminTicketFilters clients={clients} />

      {/* List Card */}
      <div className="card card-flush">
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
                        <td style={{ color: "var(--muted)" }}>{ticket.branch.name}</td>
                        <td style={{ fontWeight: 600 }}>{typeLabel}</td>
                        <td>
                          {ticket.order ? (
                            <Link href={`/admin/orders/${ticket.orderId}`} style={{ textDecoration: "underline", color: "var(--muted)" }}>
                              {ticket.order.orderNr}
                            </Link>
                          ) : (
                            <span style={{ color: "var(--muted)", fontSize: "13px" }}>brak</span>
                          )}
                        </td>
                        <td style={{ color: "var(--muted)" }} title={details}>{details}</td>
                        <td style={{ color: "var(--muted)" }}>{formatShortDate(ticket.createdAt)}</td>
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

            <Pagination
              page={page}
              totalPages={totalPages}
              totalItems={totalTickets}
              pageSize={limit}
              getPageUrl={getPageUrl}
              itemLabel="zgłoszeń"
            />
          </>
        )}
      </div>
    </div>
  );
}
