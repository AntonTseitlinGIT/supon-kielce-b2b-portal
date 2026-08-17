import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import Link from "next/link";
import PageHeader from "@/components/PageHeader";
import { resolveModules } from "@/config/modules.config";
import { 
  ShoppingBag, MessageCircle, Users, FileText, ShoppingCart, 
  Plus, ArrowRight, Package, Building, BarChart2, ChevronRight 
} from "lucide-react";
import { formatOrderStatus, formatTicketStatus, formatTicketType } from "@/utils/format";
import { isDemoSession } from "@/lib/demo";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function ClientDashboardPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const isDemo = isDemoSession(session);
  const role = isDemo ? "CLIENT_HEAD" : session.user.role;
  const { clientId, branchId } = session.user;

  // Build role-scoped database filters
  const whereFilterOrder = role === "BRANCH_HEAD"
    ? { branchId: branchId!, deletedAt: null }
    : { clientId: clientId!, deletedAt: null };

  const whereFilterTicket = role === "BRANCH_HEAD"
    ? { branchId: branchId! }
    : { clientId: clientId! };

  const whereFilterEmployee = role === "BRANCH_HEAD"
    ? { branchId: branchId!, status: "ACTIVE" as const, deletedAt: null }
    : { branch: { clientId: clientId! }, status: "ACTIVE" as const, deletedAt: null };

  const whereFilterWz = role === "BRANCH_HEAD"
    ? { branchId: branchId! }
    : { clientId: clientId! };

  // Fetch counts, client configuration, and recent items in parallel
  const [
    ordersTotal,
    ordersInProgress,
    ordersSent,
    ticketsTotal,
    ticketsNew,
    ticketsInProgress,
    employeesCount,
    wzCount,
    catalogCount,
    branchesCount,
    clientConfig,
    recentOrders,
    recentTickets
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
    // WZ Documents count
    prisma.wzDocument.count({
      where: whereFilterWz,
    }),
    // Client product catalog count
    prisma.clientProduct.count({
      where: { clientId: clientId!, isActive: true },
    }),
    // Client branches count
    prisma.branch.count({
      where: { clientId: clientId!, isActive: true },
    }),
    // Client module configuration
    prisma.clientConfig.findUnique({
      where: { clientId: clientId! },
    }),
    // Recent 5 orders for activity feed
    prisma.order.findMany({
      where: whereFilterOrder,
      orderBy: { createdAt: "desc" },
      take: 5,
      include: {
        branch: { select: { name: true } },
        items: { select: { quantity: true } },
      },
    }),
    // Recent 5 tickets for activity feed
    prisma.ticket.findMany({
      where: whereFilterTicket,
      orderBy: { createdAt: "desc" },
      take: 5,
      include: {
        branch: { select: { name: true } },
      },
    }),
  ]);

  const activeModules = resolveModules(clientConfig?.modules);

  // Module configuration items with live counts & styles
  const allModuleCards = [
    {
      key: "orders",
      title: "Zamówienia",
      href: "/client/orders",
      description: "Składaj nowe zamówienia ŚOI, śledź statusy dostaw i przeglądaj historię zakupów.",
      badge: `${ordersTotal} oczekujące`,
      badgeColor: "#2563eb",
      badgeBg: "#eff6ff",
      icon: ShoppingBag,
      enabled: activeModules.orders,
    },
    {
      key: "tickets",
      title: "Zgłoszenia i Reklamacje",
      href: "/client/tickets",
      description: "Wysyłaj reklamacje, zgłaszaj wymiany odzieży i kontaktuj się z opiekunem SUPON.",
      badge: `${ticketsTotal} aktywne`,
      badgeColor: "#d97706",
      badgeBg: "#fffbeb",
      icon: MessageCircle,
      enabled: activeModules.tickets,
    },
    {
      key: "personnel",
      title: "Personel i Odzież",
      href: "/client/personnel",
      description: "Baza pracowników, przydziały odzieży roboczej, rozmiary i wymiary BHP.",
      badge: `${employeesCount} pracowników`,
      badgeColor: "#059669",
      badgeBg: "#ecfdf5",
      icon: Users,
      enabled: activeModules.personnel,
    },
    {
      key: "documents",
      title: "Dokumenty WZ",
      href: "/client/documents",
      description: "Pobieraj i przeglądaj dokumenty WZ (Wydania Zewnętrzne) dla realizowanych dostaw.",
      badge: `${wzCount} dokumentów WZ`,
      badgeColor: "#7c3aed",
      badgeBg: "#f5f3ff",
      icon: FileText,
      enabled: activeModules.documents,
    },
    {
      key: "catalog",
      title: "Katalog produktów",
      href: "/client/catalog",
      description: "Przeglądaj dedykowany asortyment produktów BHP i ŚOI z uzgodnionymi cenami.",
      badge: `${catalogCount} artykułów`,
      badgeColor: "#0891b2",
      badgeBg: "#ecfeff",
      icon: Package,
      enabled: activeModules.catalog,
    },
    {
      key: "branches",
      title: "Oddziały i Adresy",
      href: "/client/branches",
      description: "Zarządzaj oddziałami firmy, zakładami produkcyjnymi oraz punktami dostaw.",
      badge: `${branchesCount} oddziałów`,
      badgeColor: "#4f46e5",
      badgeBg: "#eef2ff",
      icon: Building,
      enabled: activeModules.branches,
    },
    {
      key: "reports",
      title: "Raporty i Analizy",
      href: "/client/reports",
      description: "Statystyki zużycia odzieży, zestawienia kosztowe i eksporty raportów PDF/Excel.",
      badge: "Raporty PDF/Excel",
      badgeColor: "#db2777",
      badgeBg: "#fdf2f8",
      icon: BarChart2,
      enabled: activeModules.reports,
    },
  ];

  const visibleModules = allModuleCards.filter((m) => m.enabled);

  return (
    <div style={{ display: "flex", flexDirection: "column", width: "100%", animation: "fadeIn 0.4s ease forwards" }}>
      
      <PageHeader title="Witaj w systemie SUPON" subtitle="Pulpit klienta — szybki dostęp do zamówień, zgłoszeń i pracowników" />

      <div className="container" style={{ padding: 0 }}>

        {/* Quick Actions Bar */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "12px",
            marginBottom: "24px",
            padding: "16px 20px",
            background: "var(--card-bg, #ffffff)",
            borderRadius: "16px",
            border: "1px solid var(--line, #e2e8f0)",
            boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
            alignItems: "center",
          }}
        >
          <span style={{ fontSize: "13px", fontWeight: 700, textTransform: "uppercase", color: "var(--muted)", marginRight: "8px" }}>
            Szybkie akcje:
          </span>
          <Link href="/client/orders/new" className="btn btn-sm" style={{ gap: "6px", background: "var(--accent)", color: "#fff", border: "none" }}>
            <Plus size={15} /> Nowe zamówienie
          </Link>
          <Link href="/client/tickets/new" className="btn btn-secondary btn-sm" style={{ gap: "6px" }}>
            <MessageCircle size={15} /> Zgłoś problem / wymianę
          </Link>
          <Link href="/client/personnel" className="btn btn-secondary btn-sm" style={{ gap: "6px" }}>
            <Users size={15} /> Dodaj pracownika
          </Link>
          <Link href="/client/documents" className="btn btn-secondary btn-sm" style={{ gap: "6px" }}>
            <FileText size={15} /> Pobierz WZ
          </Link>
        </div>
        
        {/* KPI Stats */}
        <div className="stats-summary" style={{ marginBottom: "24px" }}>
          <Link href="/client/orders" className="kpi" style={{ textDecoration: "none", color: "inherit" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <h3>Oczekujące zamówienia</h3>
                <div className="value">{ordersTotal}</div>
              </div>
              <div style={{ background: "var(--accent-light, #eff6ff)", color: "var(--accent, #2563eb)", padding: "10px", borderRadius: "12px" }}>
                <ShoppingBag size={22} />
              </div>
            </div>
            <div className="delta muted">
              {ordersInProgress} w realizacji / {ordersSent} w drodze
            </div>
          </Link>
          
          <Link href="/client/tickets" className="kpi" style={{ textDecoration: "none", color: "inherit" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <h3>Aktywne zgłoszenia</h3>
                <div className="value">{ticketsTotal}</div>
              </div>
              <div style={{ background: "color-mix(in oklab, var(--warn, #d97706) 15%, var(--page-bg, #fff))", color: "var(--warn, #d97706)", padding: "10px", borderRadius: "12px" }}>
                <MessageCircle size={22} />
              </div>
            </div>
            <div className="delta muted">
              {ticketsNew} nowe / {ticketsInProgress} w toku
            </div>
          </Link>
          
          <Link href="/client/personnel" className="kpi" style={{ textDecoration: "none", color: "inherit" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <h3>Aktywni pracownicy</h3>
                <div className="value">{employeesCount}</div>
              </div>
              <div style={{ background: "color-mix(in oklab, var(--ok, #059669) 15%, var(--page-bg, #fff))", color: "var(--ok, #059669)", padding: "10px", borderRadius: "12px" }}>
                <Users size={22} />
              </div>
            </div>
            <div className="delta muted">Zarejestrowani w bazie oddziału</div>
          </Link>
        </div>

        {/* Recent Activity Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(450px, 1fr))", gap: "20px", marginBottom: "32px" }}>
          
          {/* Recent Orders Card */}
          <div className="card">
            <div className="card-header" style={{ padding: "16px 20px" }}>
              <h3 style={{ fontSize: "16px", fontWeight: 700, margin: 0, color: "var(--text)" }}>
                Ostatnie zamówienia
              </h3>
              <Link href="/client/orders" style={{ fontSize: "13px", color: "var(--accent)", display: "flex", alignItems: "center", gap: "4px", fontWeight: 600 }}>
                Zobacz wszystkie <ArrowRight size={14} />
              </Link>
            </div>
            
            <div style={{ padding: "0 0 8px 0" }}>
              {recentOrders.length === 0 ? (
                <div style={{ padding: "40px", textAlign: "center", color: "var(--muted)" }}>
                  Brak złożonych zamówień
                </div>
              ) : (
                <div className="table-wrapper" style={{ border: "none", boxShadow: "none", borderRadius: 0 }}>
                  <table className="table" style={{ fontSize: "13.5px" }}>
                    <thead>
                      <tr>
                        <th>Numer</th>
                        <th>Oddział</th>
                        <th>Pozycje</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentOrders.map((order) => {
                        const statusInfo = formatOrderStatus(order.status);
                        const qtySum = order.items.reduce((sum, item) => sum + item.quantity, 0);
                        return (
                          <tr key={order.id}>
                            <td style={{ fontWeight: 600 }}>
                              <Link href={`/client/orders/${order.id}`} style={{ color: "var(--accent)" }}>
                                {order.orderNr}
                              </Link>
                            </td>
                            <td style={{ color: "var(--muted)" }}>
                              {order.branch.name}
                            </td>
                            <td>{qtySum} szt.</td>
                            <td>
                              <span className={`badge ${statusInfo.className}`} style={{ fontSize: "11px" }}>
                                {statusInfo.label}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* Recent Tickets Card */}
          <div className="card">
            <div className="card-header" style={{ padding: "16px 20px" }}>
              <h3 style={{ fontSize: "16px", fontWeight: 700, margin: 0, color: "var(--text)" }}>
                Ostatnie zgłoszenia
              </h3>
              <Link href="/client/tickets" style={{ fontSize: "13px", color: "var(--accent)", display: "flex", alignItems: "center", gap: "4px", fontWeight: 600 }}>
                Zobacz wszystkie <ArrowRight size={14} />
              </Link>
            </div>
            
            <div style={{ padding: "0 0 8px 0" }}>
              {recentTickets.length === 0 ? (
                <div style={{ padding: "40px", textAlign: "center", color: "var(--muted)" }}>
                  Brak zgłoszeń serwisowych
                </div>
              ) : (
                <div className="table-wrapper" style={{ border: "none", boxShadow: "none", borderRadius: 0 }}>
                  <table className="table" style={{ fontSize: "13.5px" }}>
                    <thead>
                      <tr>
                        <th>Numer</th>
                        <th>Oddział</th>
                        <th>Typ</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentTickets.map((ticket) => {
                        const statusInfo = formatTicketStatus(ticket.status);
                        const typeLabel = formatTicketType(ticket.type);
                        return (
                          <tr key={ticket.id}>
                            <td style={{ fontWeight: 600 }}>
                              <Link href={`/client/tickets/${ticket.id}`} style={{ color: "var(--accent)" }}>
                                {ticket.ticketNr}
                              </Link>
                            </td>
                            <td style={{ color: "var(--muted)" }}>
                              {ticket.branch.name}
                            </td>
                            <td>{typeLabel}</td>
                            <td>
                              <span className={`badge ${statusInfo.className}`} style={{ fontSize: "11px" }}>
                                {statusInfo.label}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

        </div>

        {/* Dynamic System Modules Section */}
        <div style={{ marginBottom: "16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h3 style={{ fontSize: "18px", fontWeight: 800, margin: 0, color: "var(--text)" }}>
              Moduły systemu
            </h3>
            <p style={{ fontSize: "13px", color: "var(--muted)", margin: "4px 0 0" }}>
              Dostępne narzędzia i funkcje aktywne dla Twojego konta
            </p>
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
            gap: "20px",
            marginBottom: "32px",
          }}
        >
          {visibleModules.map((module) => {
            const Icon = module.icon;
            return (
              <Link
                key={module.key}
                href={module.href}
                style={{
                  textDecoration: "none",
                  color: "inherit",
                  display: "flex",
                  flexDirection: "column",
                  background: "var(--card-bg, #ffffff)",
                  border: "1px solid var(--line, #e2e8f0)",
                  borderRadius: "20px",
                  padding: "24px",
                  transition: "all 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.03)",
                  position: "relative",
                  overflow: "hidden",
                }}
                className="hover-card-elevation"
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
                  <div
                    style={{
                      width: "52px",
                      height: "52px",
                      borderRadius: "14px",
                      background: module.badgeBg,
                      color: module.badgeColor,
                      display: "grid",
                      placeItems: "center",
                    }}
                  >
                    <Icon size={26} />
                  </div>
                  <span
                    style={{
                      fontSize: "11px",
                      fontWeight: 700,
                      padding: "4px 10px",
                      borderRadius: "99px",
                      background: module.badgeBg,
                      color: module.badgeColor,
                      border: `1px solid ${module.badgeColor}30`,
                    }}
                  >
                    {module.badge}
                  </span>
                </div>

                <h4 style={{ fontSize: "17px", fontWeight: 700, margin: "0 0 8px", color: "var(--text)" }}>
                  {module.title}
                </h4>
                <p style={{ fontSize: "13.5px", lineHeight: "1.5", color: "var(--muted)", margin: "0 0 20px", flex: 1 }}>
                  {module.description}
                </p>

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    fontSize: "13px",
                    fontWeight: 700,
                    color: module.badgeColor,
                    marginTop: "auto",
                  }}
                >
                  Przejdź do modułu <ChevronRight size={16} />
                </div>
              </Link>
            );
          })}
        </div>

      </div>

    </div>
  );
}
