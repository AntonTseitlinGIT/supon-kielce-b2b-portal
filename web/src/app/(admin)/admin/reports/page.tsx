import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { isSuponRole } from "@/config/permissions.config";
import { prisma } from "@/lib/db";
import PageHeader from "@/components/PageHeader";
import ReportsDashboard from "@/app/(client)/client/reports/ReportsDashboard";

export const metadata = {
  title: "Raporty globalne | SUPON Kielce",
};

const STATUS_MAP: Record<string, string> = {
  IN_PROGRESS: "W realizacji",
  SENT: "Wysłane",
  PARTIALLY_SENT: "Częściowo wysłane",
  DELIVERED: "Dostarczone",
  APPROVED: "Zatwierdzone",
  CANCELLED: "Anulowane",
  DRAFT: "Szkic",
};

const MONTH_NAMES = [
  "Styczeń", "Luty", "Marzec", "Kwiecień", "Maj", "Czerwiec",
  "Lipiec", "Sierpień", "Wrzesień", "Październik", "Listopad", "Grudzień",
];

function getFallbackPrice(categoryName: string) {
  const cat = categoryName.toLowerCase();
  if (cat.includes("obuwie") || cat.includes("buty")) return 150.00;
  if (cat.includes("odzież") || cat.includes("ubranie")) return 95.00;
  if (cat.includes("rękawic")) return 12.50;
  if (cat.includes("głow") || cat.includes("kask")) return 45.00;
  return 50.00;
}

export default async function AdminReportsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (!isSuponRole(session.user.role)) redirect("/client/dashboard");

  // 1. Agreed prices across all clients, keyed by `${clientId}:${productId}`
  const clientProducts = await prisma.clientProduct.findMany({
    select: { clientId: true, productId: true, customPrice: true },
  });
  const priceMap = new Map<string, number>();
  clientProducts.forEach((cp) => {
    if (cp.customPrice) {
      priceMap.set(`${cp.clientId}:${cp.productId}`, Number(cp.customPrice));
    }
  });

  // 2. All clients with order counts
  const clients = await prisma.client.findMany({
    include: {
      _count: { select: { orders: true } },
    },
    orderBy: { name: "asc" },
  });

  // Employees relate to Client only via Branch, so count them per branch and
  // roll up to each client (excluding soft-deleted employees).
  const branchEmployeeCounts = await prisma.branch.findMany({
    select: {
      clientId: true,
      _count: { select: { employees: { where: { deletedAt: null } } } },
    },
  });
  const employeeCountByClient = new Map<string, number>();
  branchEmployeeCounts.forEach((b) => {
    employeeCountByClient.set(
      b.clientId,
      (employeeCountByClient.get(b.clientId) || 0) + b._count.employees
    );
  });

  // 3. All orders across the platform, with items and owning client
  const orders = await prisma.order.findMany({
    where: { deletedAt: null },
    include: {
      items: { include: { product: { include: { category: true } } } },
      client: true,
    },
    orderBy: { createdAt: "asc" },
  });

  // 4. Platform-wide KPI counts
  const activeTickets = await prisma.ticket.count({
    where: { status: { in: ["NEW", "IN_PROGRESS"] } },
  });
  const totalEmployees = await prisma.employee.count({
    where: { status: "ACTIVE", deletedAt: null },
  });

  // --- Aggregations (grouped by client) ---
  const getValuation = (clientId: string, productId: string, qty: number, categoryName: string) => {
    const unitPrice = priceMap.get(`${clientId}:${productId}`) || getFallbackPrice(categoryName);
    return unitPrice * qty;
  };

  const clientShortName = (full: string) => full.split("—")[0].trim();

  // Aggregation maps are keyed by clientId (unique) — not by display name, which can collide.
  let totalSpent = 0;
  const clientSpendMap = new Map<string, number>();
  const clientOrderCountMap = new Map<string, number>();
  const statusCountMap = new Map<string, number>();
  const categoryQtyMap = new Map<string, number>();
  const monthlyOrdersMap = new Map<string, number>();

  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const label = `${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`;
    monthlyOrdersMap.set(label, 0);
  }

  orders.forEach((order) => {
    const cid = order.clientId;
    let orderValue = 0;

    order.items.forEach((item) => {
      orderValue += getValuation(order.clientId, item.productId, item.quantity, item.product.category.name);
      const catName = item.product.category.name;
      categoryQtyMap.set(catName, (categoryQtyMap.get(catName) || 0) + item.quantity);
    });

    if (order.status !== "CANCELLED") {
      totalSpent += orderValue;
      clientSpendMap.set(cid, (clientSpendMap.get(cid) || 0) + orderValue);
    }

    clientOrderCountMap.set(cid, (clientOrderCountMap.get(cid) || 0) + 1);

    const statusLabel = STATUS_MAP[order.status] || order.status;
    statusCountMap.set(statusLabel, (statusCountMap.get(statusLabel) || 0) + 1);

    const orderDate = new Date(order.createdAt);
    const monthLabel = `${MONTH_NAMES[orderDate.getMonth()]} ${orderDate.getFullYear()}`;
    monthlyOrdersMap.set(monthLabel, (monthlyOrdersMap.get(monthLabel) || 0) + 1);
  });

  const branchChartData = clients.map((c) => ({
    name: clientShortName(c.name),
    spend: Number((clientSpendMap.get(c.id) || 0).toFixed(2)),
    orders: clientOrderCountMap.get(c.id) || 0,
  }));

  const monthlyChartData = Array.from(monthlyOrdersMap.entries()).map(([month, count]) => ({ month, count }));
  const statusChartData = Array.from(statusCountMap.entries()).map(([name, value]) => ({ name, value }));
  const categoryChartData = Array.from(categoryQtyMap.entries()).map(([name, value]) => ({ name, value }));

  const branchesTable = clients.map((c) => ({
    name: clientShortName(c.name),
    address: c.nip,
    employeeCount: employeeCountByClient.get(c.id) || 0,
    orderCount: clientOrderCountMap.get(c.id) || 0,
    totalSpend: Number((clientSpendMap.get(c.id) || 0).toFixed(2)),
  }));

  return (
    <div className="col-20">
      <PageHeader
        compact
        title="Raporty globalne"
        subtitle="Statystyki finansowe, statusy zamówień oraz zużycie asortymentu w skali wszystkich klientów"
      />

      <ReportsDashboard
        kpis={{ totalSpent, totalOrders: orders.length, totalEmployees, activeTickets }}
        branchChartData={branchChartData}
        monthlyChartData={monthlyChartData}
        statusChartData={statusChartData}
        categoryChartData={categoryChartData}
        branchesTable={branchesTable}
        dimensionLabel="Klient"
        secondaryColLabel="NIP"
        emptyMessage="Brak danych klientów."
        pdfUrl={null}
      />
    </div>
  );
}
