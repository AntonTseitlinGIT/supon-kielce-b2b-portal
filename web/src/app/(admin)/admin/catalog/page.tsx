import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import CatalogClient from "./CatalogClient";

export const metadata = {
  title: "Katalog Produktów ŚOI | SUPON Kielce",
};

export default async function AdminCatalogPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  // Admin access control
  if (session.user.role !== "SUPON_ADMIN") {
    redirect("/admin/dashboard");
  }

  // Fetch products and categories
  const [products, categories] = await Promise.all([
    prisma.product.findMany({
      include: {
        category: true,
      },
      orderBy: {
        name: "asc",
      },
    }),
    prisma.ppeCategory.findMany({
      orderBy: {
        name: "asc",
      },
    }),
  ]);

  const serializedProducts = products.map((p) => ({
    id: p.id,
    articleNr: p.articleNr,
    name: p.name,
    categoryId: p.categoryId,
    description: p.description,
    availableSizes: p.availableSizes,
    isActive: p.isActive,
    category: {
      id: p.category.id,
      name: p.category.name,
    },
  }));

  const serializedCategories = categories.map((c) => ({
    id: c.id,
    name: c.name,
  }));

  return (
    <div style={{ display: "flex", flexDirection: "column", width: "100%", animation: "fadeIn 0.4s ease forwards" }}>
      
      {/* Page Header */}
      <header className="page-header" style={{ borderBottom: "1px solid var(--line)", background: "transparent", margin: "0 -24px 24px -24px", padding: "24px" }}>
        <div className="container" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h1 style={{ fontSize: "32px", fontWeight: 800, margin: 0 }}>Katalog ŚOI i BHP</h1>
            <p className="subtitle" style={{ fontSize: "15px", color: "var(--muted)", margin: "6px 0 0 0" }}>
              Baza asortymentowa produktów ochrony indywidualnej, odzieży roboczej i akcesoriów
            </p>
          </div>
        </div>
      </header>

      <div className="container" style={{ padding: 0 }}>
        <CatalogClient products={serializedProducts} categories={serializedCategories} />
      </div>

    </div>
  );
}
