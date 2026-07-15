import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import Link from "next/link";
import { MessageCircle, Plus, Search, X } from "lucide-react";
import Pagination from "@/components/Pagination";
import { formatTicketStatus, formatTicketType, formatShortDate } from "@/utils/format";
import TicketsFilterWrapper from "./TicketsFilterWrapper";
import ClickableRow from "./ClickableRow";
import PageHeader from "@/components/PageHeader";

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

interface PageProps {
  searchParams: SearchParams;
}

export default async function ClientTicketsPage(props: PageProps) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const searchParams = await props.searchParams;

  const search = (searchParams.search as string) || "";
  const status = (searchParams.status as string) || "";
  const type = (searchParams.type as string) || "";
  const branchIdParam = (searchParams.branchId as string) || "";
  const page = parseInt((searchParams.page as string) || "1", 10);
  const limit = 10;
  const skip = (page - 1) * limit;

  const { role, clientId, branchId } = session.user;

  // 1. Where filters
  const where: any = {
    clientId: clientId!,
  };

  if (role === "BRANCH_HEAD") {
    where.branchId = branchId!;
  } else if (branchIdParam) {
    where.branchId = branchIdParam;
  }

  if (status) {
    if (status === "OPEN") {
      where.status = { in: ["NEW", "IN_PROGRESS", "RESOLVED"] };
    } else {
      where.status = status;
    }
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

  // 2. Query DB
  const [tickets, totalTickets, branches] = await Promise.all([
    prisma.ticket.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
      include: {
        branch: { select: { name: true } },
        order: { select: { orderNr: true } },
      },
    }),
    prisma.ticket.count({ where }),
    role === "CLIENT_HEAD"
      ? prisma.branch.findMany({
          where: { clientId: clientId!, isActive: true },
          select: { id: true, name: true },
          orderBy: { name: "asc" },
        })
      : Promise.resolve([]),
  ]);

  const totalPages = Math.ceil(totalTickets / limit) || 1;

  // Pagination URL Generator
  const getPageUrl = (pageNumber: number) => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (status) params.set("status", status);
    if (type) params.set("type", type);
    if (branchIdParam) params.set("branchId", branchIdParam);
    params.set("page", pageNumber.toString());
    return `?${params.toString()}`;
  };

  return (
    <div className="col-20">
      <PageHeader compact title="Zgłoszenia i Reklamacje" subtitle="Zgłaszaj uszkodzenia, reklamacje, chęć wymiany odzieży lub kontaktuj się z menedżerem SUPON">
        <Link href="/client/tickets/new" className="btn btn-primary">
          <Plus size={16} /> Nowe zgłoszenie
        </Link>
      </PageHeader>

      {/* Client tickets filter component with state handlers */}
      <TicketsFilterWrapper 
        search={search}
        status={status}
        type={type}
        branchIdParam={branchIdParam}
        branches={branches}
        role={role}
      />

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
                    <th>Typ zgłoszenia</th>
                    {role === "CLIENT_HEAD" && <th>Oddział</th>}
                    <th>Zamówienie powiązane</th>
                    <th>Pracownik / Towar</th>
                    <th>Data utworzenia</th>
                    <th>Ostatnia zmiana</th>
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
                        <td style={{ fontWeight: 600 }}>
                          {typeLabel}
                        </td>
                        {role === "CLIENT_HEAD" && (
                          <td style={{ color: "var(--muted)" }}>
                            {ticket.branch.name}
                          </td>
                        )}
                        <td>
                          {ticket.order ? (
                            <Link href={`/client/orders/${ticket.orderId}`} style={{ textDecoration: "underline", color: "var(--muted)" }}>
                              {ticket.order.orderNr}
                            </Link>
                          ) : (
                            <span style={{ color: "var(--muted)", fontSize: "13px" }}>brak</span>
                          )}
                        </td>
                        <td style={{ color: "var(--muted)" }} title={details}>
                          {details}
                        </td>
                        <td style={{ color: "var(--muted)" }}>
                          {formatShortDate(ticket.createdAt)}
                        </td>
                        <td style={{ color: "var(--muted)" }}>
                          {formatShortDate(ticket.updatedAt)}
                        </td>
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
