import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import OrderFilters from "./OrderFilters";
import OrdersListClient from "./OrdersListClient";
import Pagination from "@/components/Pagination";
import { OrderStatus } from "@prisma/client";

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

interface PageProps {
  searchParams: SearchParams;
}

export default async function ClientOrdersPage(props: PageProps) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const searchParams = await props.searchParams;

  const search = (searchParams.search as string) || "";
  const status = searchParams.status !== undefined ? (searchParams.status as string) : "IN_PROGRESS";
  const priority = (searchParams.priority as string) || "";
  const branchIdParam = (searchParams.branchId as string) || "";
  const dateFrom = (searchParams.dateFrom as string) || "";
  const dateTo = (searchParams.dateTo as string) || "";
  const page = parseInt((searchParams.page as string) || "1", 10);
  const limit = 10;
  const skip = (page - 1) * limit;

  const role = session.user.role;
  const clientId = session.user.clientId!;

  // 1. Build DB Query Filter
  const where: any = {
    clientId,
  };

  if (role === "BRANCH_HEAD") {
    where.branchId = session.user.branchId!;
  } else if (branchIdParam) {
    where.branchId = branchIdParam;
  }

  // Filter logic:
  // • W realizacji  → IN_PROGRESS + PARTIALLY_SENT (not yet fully shipped)
  // • Wysłane       → SENT + PARTIALLY_SENT        (at least partially in transit)
  // • Dostarczone   → DELIVERED + PARTIALLY_SENT   (at least some packages arrived)
  // • Zrealizowane  → APPROVED only                (fully closed)
  if (status === "IN_PROGRESS") {
    where.status = { in: [OrderStatus.IN_PROGRESS, OrderStatus.PARTIALLY_SENT] };
  } else if (status === "SENT") {
    where.status = { in: [OrderStatus.SENT, OrderStatus.PARTIALLY_SENT] };
  } else if (status === "DELIVERED") {
    where.status = { in: [OrderStatus.DELIVERED, OrderStatus.PARTIALLY_SENT] };
  } else if (status && status !== "ALL") {
    where.status = status as OrderStatus;
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
      { department: { contains: search, mode: "insensitive" } },
      { items: { some: { productName: { contains: search, mode: "insensitive" } } } },
      { items: { some: { employeeName: { contains: search, mode: "insensitive" } } } },
    ];
  }

  // 2. Fetch Data
  const [orders, totalOrders, branches] = await Promise.all([
    prisma.order.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
      include: {
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
        branch: { select: { name: true } },
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
    role === "CLIENT_HEAD"
      ? prisma.branch.findMany({
          where: { clientId, isActive: true },
          select: { id: true, name: true },
          orderBy: { name: "asc" },
        })
      : Promise.resolve([]),
  ]);

  const totalPages = Math.ceil(totalOrders / limit) || 1;

  // 3. Pagination URL Generator
  const getPageUrl = (pageNumber: number) => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (status) params.set("status", status);
    if (priority) params.set("priority", priority);
    if (branchIdParam) params.set("branchId", branchIdParam);
    if (dateFrom) params.set("dateFrom", dateFrom);
    if (dateTo) params.set("dateTo", dateTo);
    params.set("page", pageNumber.toString());
    return `?${params.toString()}`;
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Header */}
      <div style={{ display: "flex", flexDirection: "column", gap: "16px", padding: "8px 0" }}>
        <div>
          <h1 style={{ fontFamily: "var(--font-heading)", fontWeight: 800, fontSize: "36px", color: "var(--text)", margin: 0 }}>
            Twoje Zamówienia
          </h1>
          <p className="subtitle" style={{ fontSize: "15px", margin: "6px 0 0 0", color: "var(--muted)" }}>
            Zarządzaj swoimi zamówieniami, śledź dostawy i pobieraj dokumenty
          </p>
        </div>
        <div>
          <Link href="/client/orders/new" className="btn" style={{ background: "var(--accent)", color: "#fff", fontWeight: 700, borderRadius: "10px", padding: "10px 24px" }}>
            Złóż zamówienie
          </Link>
        </div>
      </div>

      {/* Filters */}
      <OrderFilters
        branches={branches}
        showBranchFilter={role === "CLIENT_HEAD"}
      />

      {/* Data Card */}
      <div className="card" style={{ padding: 0, overflow: "hidden", border: "1px solid var(--line)" }}>
        {orders.length === 0 ? (
          <div className="empty-state" style={{ padding: "60px 24px" }}>
            <ShoppingBag size={48} style={{ color: "var(--muted)", marginBottom: "16px" }} />
            <h3 style={{ fontSize: "18px", fontWeight: 700, margin: "0 0 8px 0" }}>Brak zamówień</h3>
            <p style={{ color: "var(--muted)", margin: 0 }}>Nie znaleziono zamówień spełniających wybrane kryteria.</p>
          </div>
        ) : (
          <>
            <OrdersListClient orders={orders as any} />

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
