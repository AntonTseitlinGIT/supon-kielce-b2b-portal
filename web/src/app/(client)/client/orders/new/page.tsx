import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import NewOrderForm from "./NewOrderForm";

export default async function ClientNewOrderPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const { role, clientId, branchId } = session.user;

  // 1. Fetch branches authorized for this user
  const branches = await prisma.branch.findMany({
    where: {
      clientId: clientId!,
      isActive: true,
      ...(role === "BRANCH_HEAD" ? { id: branchId! } : {}),
    },
    select: {
      id: true,
      name: true,
      address: true,
      deliveryAddresses: {
        where: { isActive: true },
        select: { id: true, address: true },
      },
    },
    orderBy: { name: "asc" },
  });

  // 2. Fetch agreed product assortment
  const clientProducts = await prisma.clientProduct.findMany({
    where: {
      clientId: clientId!,
      isActive: true,
    },
    include: {
      product: {
        include: {
          category: true,
        },
      },
    },
  });

  // Format product options
  const products = clientProducts.map((cp) => ({
    id: cp.product.id,
    name: cp.product.name,
    articleNr: cp.product.articleNr,
    categoryId: cp.product.categoryId,
    categoryName: cp.product.category.name,
    availableSizes: cp.product.availableSizes,
    photoUrls: cp.product.photoUrls,
  }));

  // 3. Fetch active employees with limit usages
  const dbEmployees = await prisma.employee.findMany({
    where: {
      branch: { clientId: clientId! },
      status: "ACTIVE",
      deletedAt: null,
      ...(role === "BRANCH_HEAD" ? { branchId: branchId! } : {}),
    },
    include: {
      ppeLimitUsage: {
        include: {
          ppeLimit: {
            select: {
              categoryId: true,
              limitPerPeriod: true,
            },
          },
        },
      },
    },
    orderBy: { name: "asc" },
  });

  // 4. Fetch general client limits definitions
  const clientLimits = await prisma.ppeLimit.findMany({
    where: { clientId: clientId! },
    select: {
      categoryId: true,
      limitPerPeriod: true,
    },
  });

  return (
    <div className="col-24">
      {/* Header */}
      <div style={{ padding: "8px 0", display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "16px" }}>
        <div>
          <h1 style={{ fontFamily: "var(--font-heading)", fontWeight: 800, fontSize: "36px", color: "var(--text)", margin: 0 }}>
            Nowe zamówienie
          </h1>
          <p className="subtitle" style={{ fontSize: "15px", margin: "6px 0 0 0", color: "var(--muted)" }}>
            Dane zamówienia &rarr; Pozycje &rarr; Podsumowanie &rarr; Akcje
          </p>
        </div>
        <div>
          <Link href="/client/orders" className="btn btn-secondary" style={{ display: "flex", alignItems: "center", gap: "6px", height: "42px" }}>
            <ArrowLeft size={16} /> Wróć do listy
          </Link>
        </div>
      </div>

      {/* Main Form Component */}
      <NewOrderForm
        branches={branches}
        products={products}
        employees={dbEmployees}
        clientLimits={clientLimits}
        userRole={role}
        defaultBranchId={role === "BRANCH_HEAD" ? branchId! : undefined}
      />
    </div>
  );
}
