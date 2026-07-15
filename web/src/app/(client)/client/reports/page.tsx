import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import ReportsDashboard from "./ReportsDashboard";
import Link from "next/link";
import PageHeader from "@/components/PageHeader";

export const metadata = {
  title: "Raporty i Statystyki | SUPON Kielce",
};

// Polish translation for Order statuses
const STATUS_MAP: Record<string, string> = {
  IN_PROGRESS: "W realizacji",
  SENT: "Wysłane",
  PARTIALLY_SENT: "Częściowo wysłane",
  DELIVERED: "Dostarczone",
  APPROVED: "Zatwierdzone",
  CANCELLED: "Anulowane",
  DRAFT: "Szkic",
};

// Polish Month Names
const MONTH_NAMES = [
  "Styczeń", "Luty", "Marzec", "Kwiecień", "Maj", "Czerwiec",
  "Lipiec", "Sierpień", "Wrzesień", "Październik", "Listopad", "Grudzień"
];

function getFallbackPrice(categoryName: string) {
  const cat = categoryName.toLowerCase();
  if (cat.includes("obuwie") || cat.includes("buty")) return 150.00;
  if (cat.includes("odzież") || cat.includes("ubranie")) return 95.00;
  if (cat.includes("rękawic")) return 12.50;
  if (cat.includes("głow") || cat.includes("kask")) return 45.00;
  return 50.00;
}

export default async function ClientReportsPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const { role, clientId } = session.user;

  // Authorisation: CLIENT_HEAD only
  if (role !== "CLIENT_HEAD" || !clientId) {
    redirect("/client/dashboard");
  }

  // 1. Fetch agreed prices map
  const clientProducts = await prisma.clientProduct.findMany({
    where: { clientId },
    select: { productId: true, customPrice: true }
  });
  
  const priceMap = new Map<string, number>();
  clientProducts.forEach(cp => {
    if (cp.customPrice) {
      priceMap.set(cp.productId, Number(cp.customPrice));
    }
  });

  // 2. Fetch branches with counts
  const branches = await prisma.branch.findMany({
    where: { clientId },
    include: {
      _count: {
        select: {
          employees: { where: { deletedAt: null } },
          orders: true
        }
      }
    }
  });

  // 3. Fetch all client orders with items
  const orders = await prisma.order.findMany({
    where: { clientId },
    include: {
      items: {
        include: {
          product: {
            include: {
              category: true
            }
          }
        }
      },
      branch: true
    },
    orderBy: { createdAt: "asc" }
  });

  // 4. Fetch active tickets count
  const activeTickets = await prisma.ticket.count({
    where: {
      clientId,
      status: { in: ["NEW", "IN_PROGRESS"] }
    }
  });

  // 5. Fetch total active employees
  const totalEmployees = await prisma.employee.count({
    where: {
      branch: { clientId },
      status: "ACTIVE",
      deletedAt: null
    }
  });

  // --- Calculations and Aggregations ---

  // Order item price calculation
  const getValuation = (productId: string, qty: number, categoryName: string) => {
    const unitPrice = priceMap.get(productId) || getFallbackPrice(categoryName);
    return unitPrice * qty;
  };

  let totalSpent = 0;
  const branchSpendMap = new Map<string, number>();
  const branchOrderCountMap = new Map<string, number>();
  const statusCountMap = new Map<string, number>();
  const categoryQtyMap = new Map<string, number>();
  const monthlyOrdersMap = new Map<string, number>();

  // Pre-populate monthly items for the last 6 months to ensure line chart is full
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const label = `${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`;
    monthlyOrdersMap.set(label, 0);
  }

  // Loop through orders
  orders.forEach((order) => {
    const branchName = order.branch.name;
    let orderValue = 0;

    // Aggregate items
    order.items.forEach((item) => {
      const itemVal = getValuation(item.productId, item.quantity, item.product.category.name);
      orderValue += itemVal;

      // Category distribution
      const catName = item.product.category.name;
      categoryQtyMap.set(catName, (categoryQtyMap.get(catName) || 0) + item.quantity);
    });

    if (order.status !== "CANCELLED") {
      totalSpent += orderValue;
      branchSpendMap.set(branchName, (branchSpendMap.get(branchName) || 0) + orderValue);
    }

    branchOrderCountMap.set(branchName, (branchOrderCountMap.get(branchName) || 0) + 1);

    // Status distribution
    const statusLabel = STATUS_MAP[order.status] || order.status;
    statusCountMap.set(statusLabel, (statusCountMap.get(statusLabel) || 0) + 1);

    // Monthly aggregation
    const orderDate = new Date(order.createdAt);
    const monthLabel = `${MONTH_NAMES[orderDate.getMonth()]} ${orderDate.getFullYear()}`;
    if (monthlyOrdersMap.has(monthLabel)) {
      monthlyOrdersMap.set(monthLabel, (monthlyOrdersMap.get(monthLabel) || 0) + 1);
    } else {
      // Also track older months if order exists
      monthlyOrdersMap.set(monthLabel, (monthlyOrdersMap.get(monthLabel) || 0) + 1);
    }
  });

  // Format data for Recharts
  const branchChartData = branches.map((b) => ({
    name: b.name,
    spend: Number((branchSpendMap.get(b.name) || 0).toFixed(2)),
    orders: branchOrderCountMap.get(b.name) || 0,
  }));

  const monthlyChartData = Array.from(monthlyOrdersMap.entries()).map(([month, count]) => ({
    month,
    count,
  }));

  const statusChartData = Array.from(statusCountMap.entries()).map(([name, value]) => ({
    name,
    value,
  }));

  const categoryChartData = Array.from(categoryQtyMap.entries()).map(([name, value]) => ({
    name,
    value,
  }));

  const branchesTable = branches.map((b) => ({
    name: b.name,
    address: b.address,
    employeeCount: b._count.employees,
    orderCount: branchOrderCountMap.get(b.name) || 0,
    totalSpend: Number((branchSpendMap.get(b.name) || 0).toFixed(2)),
  }));

  return (
    <div className="col-20">
      <PageHeader compact title="Raporty i analizy wydatków" subtitle="Przeglądaj statystyki finansowe, statusy zamówień oraz zużycie asortymentu w skali firmy" />

      {/* Main interactive dashboard */}
      <ReportsDashboard
        kpis={{
          totalSpent,
          totalOrders: orders.length,
          totalEmployees,
          activeTickets,
        }}
        branchChartData={branchChartData}
        monthlyChartData={monthlyChartData}
        statusChartData={statusChartData}
        categoryChartData={categoryChartData}
        branchesTable={branchesTable}
      />
    </div>
  );
}
