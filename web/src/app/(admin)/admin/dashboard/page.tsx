import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import Link from "next/link";
import { 
  Building2, ShoppingBag, MessageCircle, Package, 
  ChevronRight, ArrowRight 
} from "lucide-react";
import { formatOrderStatus, formatTicketStatus, formatShortDate, formatTicketType } from "@/utils/format";
import AdminDashboardCharts from "./AdminDashboardCharts";
import PageHeader from "@/components/PageHeader";

// Fallback pricing from client/reports/page.tsx
function getFallbackPrice(categoryName: string) {
  const cat = categoryName.toLowerCase();
  if (cat.includes("obuwie") || cat.includes("buty")) return 150.00;
  if (cat.includes("odzież") || cat.includes("ubranie")) return 95.00;
  if (cat.includes("rękawic")) return 12.50;
  if (cat.includes("głow") || cat.includes("kask")) return 45.00;
  return 50.00;
}

const STATUS_MAP: Record<string, string> = {
  DRAFT: "Szkic",
  APPROVED: "Zatwierdzone",
  IN_PROGRESS: "W realizacji",
  PARTIALLY_SENT: "Częściowo wysłane",
  SENT: "Wysłane",
  DELIVERED: "Dostarczone",
  CANCELLED: "Anulowane",
};

export default async function AdminDashboardPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const { role } = session.user;
  if (role !== "SUPON_ADMIN") {
    redirect("/client/dashboard");
  }

  // 1. Fetch counts
  const [
    clientsCount,
    pendingOrdersCount,
    newTicketsCount,
    productsCount,
    recentOrders,
    recentTickets,
    allOrders,
    clientProducts
  ] = await Promise.all([
    // Active clients
    prisma.client.count({ where: { isActive: true } }),
    // Pending orders (not delivered or cancelled)
    prisma.order.count({
      where: { status: { in: ["IN_PROGRESS", "PARTIALLY_SENT", "APPROVED", "DRAFT"] } }
    }),
    // New tickets
    prisma.ticket.count({ where: { status: "NEW" } }),
    // Active products in catalog
    prisma.product.count({ where: { isActive: true } }),
    // Recent 5 orders
    prisma.order.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      include: {
        client: { select: { name: true } },
        branch: { select: { name: true } },
        items: { select: { quantity: true } }
      }
    }),
    // Recent 5 tickets
    prisma.ticket.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      include: {
        client: { select: { name: true } },
        branch: { select: { name: true } }
      }
    }),
    // All orders for chart analytics
    prisma.order.findMany({
      include: {
        client: { select: { name: true } },
        items: {
          include: {
            product: { include: { category: true } }
          }
        }
      }
    }),
    // Client product custom pricing
    prisma.clientProduct.findMany({
      select: { clientId: true, productId: true, customPrice: true }
    })
  ]);

  // 2. Map pricing for valuations
  const priceMap = new Map<string, number>();
  clientProducts.forEach(cp => {
    if (cp.customPrice) {
      priceMap.set(`${cp.clientId}_${cp.productId}`, Number(cp.customPrice));
    }
  });

  const getValuation = (clientId: string, productId: string, qty: number, categoryName: string) => {
    const price = priceMap.get(`${clientId}_${productId}`) || getFallbackPrice(categoryName);
    return price * qty;
  };

  // 3. Aggregate spend by client
  const clientSpendMap = new Map<string, number>();
  const statusCountMap = new Map<string, number>();

  allOrders.forEach(order => {
    let orderValue = 0;
    order.items.forEach(item => {
      orderValue += getValuation(order.clientId, item.productId, item.quantity, item.product.category.name);
    });

    // Chart 1: Spend per Client (omit CANCELLED)
    if (order.status !== "CANCELLED") {
      const clientName = order.client.name;
      clientSpendMap.set(clientName, (clientSpendMap.get(clientName) || 0) + orderValue);
    }

    // Chart 2: Order status distribution
    const statusLabel = STATUS_MAP[order.status] || order.status;
    statusCountMap.set(statusLabel, (statusCountMap.get(statusLabel) || 0) + 1);
  });

  const clientSpendData = Array.from(clientSpendMap.entries()).map(([clientName, spend]) => ({
    clientName: clientName.split("—")[0].trim().substring(0, 18), // shorten client names for charts
    spend: Number(spend.toFixed(2))
  }));

  const statusData = Array.from(statusCountMap.entries()).map(([name, value]) => ({
    name,
    value
  }));

  return (
    <div style={{ display: "flex", flexDirection: "column", width: "100%", animation: "fadeIn 0.4s ease forwards" }}>
      
      <PageHeader title="Pulpit Menedżera" subtitle="Panel administracyjny SUPON Kielce — Zarządzanie portalem klientów" />

      <div className="container" style={{ padding: 0 }}>
        
        {/* KPI Summaries */}
        <div className="stats-summary" style={{ marginBottom: "24px" }}>
          <Link href="/admin/clients" className="kpi" style={{ textDecoration: "none", color: "inherit" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <h3>Aktywni Klienci</h3>
                <div className="value">{clientsCount}</div>
              </div>
              <div style={{ background: "var(--accent-light)", color: "var(--accent)", padding: "8px", borderRadius: "10px" }}>
                <Building2 size={20} />
              </div>
            </div>
            <div className="delta muted">Zarejestrowane firmy w portalu</div>
          </Link>

          <Link href="/admin/orders" className="kpi" style={{ textDecoration: "none", color: "inherit" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <h3>Oczekujące zamówienia</h3>
                <div className="value">{pendingOrdersCount}</div>
              </div>
              <div style={{ background: "color-mix(in oklab, var(--warn) 15%, var(--page-bg))", color: "var(--warn)", padding: "8px", borderRadius: "10px" }}>
                <ShoppingBag size={20} />
              </div>
            </div>
            <div className="delta muted">Zamówienia do realizacji i wysyłki</div>
          </Link>

          <Link href="/admin/tickets?status=NEW" className="kpi" style={{ textDecoration: "none", color: "inherit" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <h3>Nowe zgłoszenia</h3>
                <div className="value">{newTicketsCount}</div>
              </div>
              <div style={{ background: "color-mix(in oklab, var(--info) 15%, var(--page-bg))", color: "var(--info)", padding: "8px", borderRadius: "10px" }}>
                <MessageCircle size={20} />
              </div>
            </div>
            <div className="delta muted">Zgłoszenia oczekujące na odpowiedź</div>
          </Link>

          <Link href="/admin/catalog" className="kpi" style={{ textDecoration: "none", color: "inherit" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <h3>Asortyment w bazie</h3>
                <div className="value">{productsCount}</div>
              </div>
              <div style={{ background: "color-mix(in oklab, var(--ok) 15%, var(--page-bg))", color: "var(--ok)", padding: "8px", borderRadius: "10px" }}>
                <Package size={20} />
              </div>
            </div>
            <div className="delta muted">Aktywne artykuły BHP / ŚOI</div>
          </Link>
        </div>

        {/* Recharts Analytics Charts */}
        <AdminDashboardCharts
          clientSpendData={clientSpendData}
          statusData={statusData}
        />

        {/* Activity Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(450px, 1fr))", gap: "20px", marginBottom: "32px" }}>
          
          {/* Recent Orders Card */}
          <div className="card">
            <div className="card-header" style={{ padding: "16px 20px" }}>
              <h3 style={{ fontSize: "16px", fontWeight: 700, margin: 0, color: "var(--text)" }}>
                Ostatnie zamówienia
              </h3>
              <Link href="/admin/orders" style={{ fontSize: "13px", color: "var(--accent)", display: "flex", alignItems: "center", gap: "4px", fontWeight: 600 }}>
                Wszystkie <ArrowRight size={14} />
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
                        <th>Klient</th>
                        <th>Pozycje</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentOrders.map(order => {
                        const statusInfo = formatOrderStatus(order.status);
                        const qtySum = order.items.reduce((sum, item) => sum + item.quantity, 0);
                        return (
                          <tr key={order.id} style={{ cursor: "pointer" }}>
                            <td style={{ fontWeight: 600 }}>
                              <Link href={`/admin/orders/${order.id}`} style={{ color: "var(--accent)" }}>
                                {order.orderNr}
                              </Link>
                            </td>
                            <td style={{ color: "var(--text-secondary)" }} title={order.client.name}>
                              {order.client.name.split("—")[0].trim()}
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
              <Link href="/admin/tickets" style={{ fontSize: "13px", color: "var(--accent)", display: "flex", alignItems: "center", gap: "4px", fontWeight: 600 }}>
                Wszystkie <ArrowRight size={14} />
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
                        <th>Klient</th>
                        <th>Typ</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentTickets.map(ticket => {
                        const statusInfo = formatTicketStatus(ticket.status);
                        const typeLabel = formatTicketType(ticket.type);
                        return (
                          <tr key={ticket.id} style={{ cursor: "pointer" }}>
                            <td style={{ fontWeight: 600 }}>
                              <Link href={`/admin/tickets/${ticket.id}`} style={{ color: "var(--accent)" }}>
                                {ticket.ticketNr}
                              </Link>
                            </td>
                            <td style={{ color: "var(--text-secondary)" }}>
                              {ticket.client.name.split("—")[0].trim()}
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

      </div>
    </div>
  );
}
