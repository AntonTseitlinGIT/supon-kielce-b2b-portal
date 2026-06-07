import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import Link from "next/link";
import PageHeader from "@/components/PageHeader";

export default async function ClientDashboardPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const { role, clientId, branchId } = session.user;

  // Build role-scoped database filters
  const whereFilterOrder = role === "BRANCH_HEAD" 
    ? { branchId: branchId! } 
    : { clientId: clientId! };

  const whereFilterTicket = role === "BRANCH_HEAD"
    ? { branchId: branchId! }
    : { clientId: clientId! };

  const whereFilterEmployee = role === "BRANCH_HEAD"
    ? { branchId: branchId!, status: "ACTIVE" as const }
    : { branch: { clientId: clientId! }, status: "ACTIVE" as const };

  // Fetch counts in parallel for KPIs
  const [
    ordersTotal,
    ordersInProgress,
    ordersSent,
    ticketsTotal,
    ticketsNew,
    ticketsInProgress,
    employeesCount
  ] = await Promise.all([
    // Pending orders (not DELIVERED or CANCELLED)
    prisma.order.count({
      where: {
        ...whereFilterOrder,
        status: { in: ["IN_PROGRESS", "PARTIALLY_SENT", "APPROVED", "DRAFT"] },
      },
    }),
    prisma.order.count({
      where: {
        ...whereFilterOrder,
        status: { in: ["IN_PROGRESS", "APPROVED"] },
      },
    }),
    prisma.order.count({
      where: {
        ...whereFilterOrder,
        status: { in: ["SENT", "PARTIALLY_SENT"] },
      },
    }),
    // Active tickets
    prisma.ticket.count({
      where: {
        ...whereFilterTicket,
        status: { in: ["NEW", "IN_PROGRESS"] },
      },
    }),
    prisma.ticket.count({
      where: {
        ...whereFilterTicket,
        status: "NEW",
      },
    }),
    prisma.ticket.count({
      where: {
        ...whereFilterTicket,
        status: "IN_PROGRESS",
      },
    }),
    // Active employees
    prisma.employee.count({
      where: whereFilterEmployee,
    }),
  ]);

  return (
    <div style={{ display: "flex", flexDirection: "column", width: "100%", animation: "fadeIn 0.4s ease forwards" }}>
      
      <PageHeader title="Witaj w systemie" subtitle="Wybierz moduł, aby rozpocząć" />

      <div className="container" style={{ padding: 0 }}>
        
        {/* KPI Stats (stats-summary from demo) */}
        <div className="stats-summary">
          <div className="kpi">
            <h3>Oczekujące zamówienia</h3>
            <div className="value">{ordersTotal}</div>
            <div className="delta muted">
              {ordersInProgress} w realizacji / {ordersSent} w drodze
            </div>
          </div>
          
          <div className="kpi">
            <h3>Aktywne zgłoszenia</h3>
            <div className="value">{ticketsTotal}</div>
            <div className="delta muted">
              {ticketsNew} nowe / {ticketsInProgress} w toku
            </div>
          </div>
          
          <div className="kpi">
            <h3>Aktywni pracownicy</h3>
            <div className="value">{employeesCount}</div>
            <div className="delta muted">Zarejestrowani w bazie</div>
          </div>
        </div>

        {/* Navigation Grid (module-grid from demo) */}
        <div className="module-grid">
          
          {/* Orders */}
          <Link href="/client/orders" className="module-card">
            <div className="module-icon">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
                <path d="M3 6h18" />
                <path d="M16 10a4 4 0 0 1-8 0" />
              </svg>
            </div>
            <h2>Zamówienia</h2>
            <p>Składaj nowe zamówienia, śledź statusy bieżących dostaw i przeglądaj historię swoich zakupów.</p>
          </Link>

          {/* Tickets */}
          <Link href="/client/tickets" className="module-card">
            <div className="module-icon">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5" />
                <path d="M9 18h6" />
                <path d="M10 22h4" />
              </svg>
            </div>
            <h2>Zgłoszenia</h2>
            <p>Wysyłaj reklamacje, zgłaszaj chęć wymiany towaru i kontaktuj się z nami w sprawach ogólnych.</p>
          </Link>

          {/* Personnel */}
          <Link href="/client/personnel" className="module-card">
            <div className="module-icon">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </div>
            <h2>Personel i odzież</h2>
            <p>Zarządzaj bazą pracowników, przydziałami odzieży roboczej, rozmiarami odzieży i wymiarami.</p>
          </Link>

          {/* Documents (WZ) */}
          <Link href="/client/documents" className="module-card">
            <div className="module-icon">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
                <polyline points="10 9 9 9 8 9" />
              </svg>
            </div>
            <h2>Twoje WZ</h2>
            <p>Przeglądaj i pobieraj dokumenty WZ (Wydania Zewnętrzne) powiązane z Twoimi zamówieniami.</p>
          </Link>

          {/* Internet shop / catalog link */}
          <Link href="/client/catalog" className="module-card">
            <div className="module-icon">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="9" cy="21" r="1" />
                <circle cx="20" cy="21" r="1" />
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
              </svg>
            </div>
            <h2>Sklep internetowy</h2>
            <p>Przejdź do naszego pełnego katalogu online, aby zobaczyć cały asortyment i nowości.</p>
          </Link>

        </div>
      </div>

    </div>
  );
}
