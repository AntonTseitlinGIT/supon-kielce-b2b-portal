import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import ClientDetailClient from "./ClientDetailClient";

export const metadata = {
  title: "Konfiguracja Klienta | SUPON Kielce",
};

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function AdminClientDetailPage({ params }: PageProps) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  // Admin access control
  if (session.user.role !== "SUPON_ADMIN") {
    redirect("/admin/dashboard");
  }

  const { id: clientId } = await params;

  // 1. Fetch client details, branches and client products list
  const [client, branches, products, clientProducts] = await Promise.all([
    prisma.client.findUnique({
      where: { id: clientId }
    }),
    prisma.branch.findMany({
      where: { clientId },
      include: {
        _count: {
          select: {
            employees: true,
            orders: true,
          }
        }
      },
      orderBy: { name: "asc" }
    }),
    prisma.product.findMany({
      where: { isActive: true },
      include: {
        category: true
      },
      orderBy: { name: "asc" }
    }),
    prisma.clientProduct.findMany({
      where: { clientId }
    })
  ]);

  if (!client) {
    notFound();
  }

  // 2. Map existing ClientProduct settings
  const clientProductsMap: Record<string, { productId: string; customPrice: string; isActive: boolean }> = {};
  
  // Set default state for all products
  products.forEach(p => {
    clientProductsMap[p.id] = {
      productId: p.id,
      customPrice: "",
      isActive: false // Default to false (not assigned/available) if not explicitly set
    };
  });

  // Override with active settings from database
  clientProducts.forEach(cp => {
    clientProductsMap[cp.productId] = {
      productId: cp.productId,
      customPrice: cp.customPrice ? cp.customPrice.toString() : "",
      isActive: cp.isActive
    };
  });

  // Simplify products shape for client rendering
  const serializedProducts = products.map(p => ({
    id: p.id,
    articleNr: p.articleNr,
    name: p.name,
    category: {
      id: p.category.id,
      name: p.category.name
    }
  }));

  const serializedClient = {
    id: client.id,
    name: client.name,
    nip: client.nip,
    address: client.address,
    logoUrl: client.logoUrl,
    isActive: client.isActive
  };

  const serializedBranches = branches.map(b => ({
    id: b.id,
    name: b.name,
    address: b.address,
    isActive: b.isActive,
    _count: {
      employees: b._count.employees,
      orders: b._count.orders
    }
  }));

  return (
    <div style={{ display: "flex", flexDirection: "column", width: "100%", animation: "fadeIn 0.4s ease forwards" }}>
      <div className="container" style={{ padding: "10px 0" }}>
        <ClientDetailClient
          client={serializedClient}
          branches={serializedBranches}
          products={serializedProducts}
          initialClientProducts={clientProductsMap}
        />
      </div>
    </div>
  );
}
