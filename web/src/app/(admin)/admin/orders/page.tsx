import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { formatOrderStatus, formatPriority, formatShortDate } from "@/utils/format";
import AdminOrderFilters from "./AdminOrderFilters";
import AdminOrdersList from "./AdminOrdersList";
import Pagination from "@/components/Pagination";

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

interface PageProps {
  searchParams: SearchParams;
}

export default async function AdminOrdersPage(props: PageProps) {
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
  const status = searchParams.status !== undefined ? (searchParams.status as string) : "IN_PROGRESS";
  const priority = (searchParams.priority as string) || "";
  const clientIdParam = (searchParams.clientId as string) || "";
  const dateFrom = (searchParams.dateFrom as string) || "";
  const dateTo = (searchParams.dateTo as string) || "";
  const page = parseInt((searchParams.page as string) || "1", 10);
  const limit = 10;
  const skip = (page - 1) * limit;

  // 1. Build DB Query Filter
  const where: any = {};

  if (clientIdParam) {
    where.clientId = clientIdParam;
  }

  // Filter logic matching client version:
  // • W realizacji  → IN_PROGRESS + PARTIALLY_SENT
  // • Wysłane       → SENT + PARTIALLY_SENT
  // • Dostarczone   → DELIVERED + PARTIALLY_SENT
  // • Zrealizowane  → APPROVED only
  if (status === "IN_PROGRESS") {
    where.status = { in: ["IN_PROGRESS", "PARTIALLY_SENT"] };
  } else if (status === "SENT") {
    where.status = { in: ["SENT", "PARTIALLY_SENT"] };
  } else if (status === "DELIVERED") {
    where.status = { in: ["DELIVERED", "PARTIALLY_SENT"] };
  } else if (status && status !== "ALL") {
    where.status = status;
  }

  if (priority) {
    where.priority = priority;
  }

  if (dateFrom) {
    where.createdAt = {
      ...(where.createdAt || {}),
      gte: new Date(dateFrom),
    };
  }

  if (dateTo) {
    where.createdAt = {
      ...(where.createdAt || {}),
      lte: new Date(dateTo),
    };
  }

  if (search) {
    where.OR = [
      { orderNr: { contains: search, mode: "insensitive" } },
      { clientRef: { contains: search, mode: "insensitive" } },
      { address: { contains: search, mode: "insensitive" } },
      { items: { some: { productName: { contains: search, mode: "insensitive" } } } },
      { items: { some: { employeeName: { contains: search, mode: "insensitive" } } } },
    ];
  }

  // 2. Fetch Data
  const [orders, totalOrders, clients] = await Promise.all([
    prisma.order.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
      include: {
        client: { select: { id: true, name: true, nip: true } },
        branch: { select: { id: true, name: true } },
        wzDocuments: {
          select: {
            id: true,
            wzNr: true,
            date: true,
            recipient: true,
            carrier: true,
            trackingNr: true,
            status: true
          }
        },
        deliveries: {
          include: {
            items: true
          }
        },
        items: {
          select: {
            id: true,
            productName: true,
            articleNr: true,
            size: true,
            quantity: true,
            qtyDelivered: true,
            qtySent: true,
            employeeName: true,
            remarks: true,
            product: { select: { photoUrls: true } }
          }
        },
      },
    }),
    prisma.order.count({ where }),
    prisma.client.findMany({
      where: { isActive: true },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  const totalPages = Math.ceil(totalOrders / limit) || 1;

  // 3. Pagination URL Generator
  const getPageUrl = (pageNumber: number) => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (status) params.set("status", status);
    if (priority) params.set("priority", priority);
    if (clientIdParam) params.set("clientId", clientIdParam);
    if (dateFrom) params.set("dateFrom", dateFrom);
    if (dateTo) params.set("dateTo", dateTo);
    params.set("page", pageNumber.toString());
    return `?${params.toString()}`;
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* Header */}
      <div className="page-header" style={{ position: "static", background: "transparent", borderBottom: "none", padding: "0 0 10px 0", minHeight: "auto" }}>
        <div>
          <h1 style={{ fontFamily: "var(--font-heading)", fontWeight: 800, fontSize: "28px", color: "var(--text-primary)" }}>
            Zarządzanie Zamówieniami
          </h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "14px" }}>
            Przeglądaj i realizuj zamówienia odzieży roboczej i ŚOI złożone przez klientów
          </p>
        </div>
      </div>

      {/* Filters */}
      <AdminOrderFilters clients={clients} />

      {/* Data Card */}
      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        {orders.length === 0 ? (
          <div className="empty-state">
            <ShoppingBag />
            <h3>Brak zamówień</h3>
            <p>Nie odnaleziono zamówień spełniających wybrane kryteria.</p>
          </div>
        ) : (
          <>
            <AdminOrdersList orders={orders as any} />

            <Pagination
              page={page}
              totalPages={totalPages}
              totalItems={totalOrders}
              pageSize={limit}
              getPageUrl={getPageUrl}
              itemLabel="zamówień"
            />
          </>
        )}
      </div>
    </div>
  );
}
