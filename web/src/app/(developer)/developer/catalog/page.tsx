import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import CatalogClient from "./CatalogClient";
import PageHeader from "@/components/PageHeader";

export const metadata = {
  title: "Katalog Produktów | SUPON Dev",
};

export default async function DevCatalogPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role !== "SUPON_DEV") redirect("/developer/dashboard");

  const [products, categories] = await Promise.all([
    prisma.product.findMany({
      include: { category: true },
      orderBy: { name: "asc" },
    }),
    prisma.ppeCategory.findMany({
      orderBy: { name: "asc" },
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
    category: { id: p.category.id, name: p.category.name },
  }));

  const serializedCategories = categories.map((c) => ({ id: c.id, name: c.name }));

  return (
    <div style={{ display: "flex", flexDirection: "column", width: "100%", animation: "fadeIn 0.4s ease forwards" }}>
      <PageHeader
        title="Katalog produktów ŚOI"
        subtitle="Globalna baza asortymentowa — dodaj, edytuj i zarządzaj produktami dostępnymi dla klientów"
      />
      <div className="container" style={{ padding: 0 }}>
        <CatalogClient products={serializedProducts} categories={serializedCategories} />
      </div>
    </div>
  );
}
