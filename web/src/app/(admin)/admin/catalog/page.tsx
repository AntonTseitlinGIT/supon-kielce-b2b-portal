import { isSuponRole } from "@/config/permissions.config";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import PageHeader from "@/components/PageHeader";
import CatalogClient from "./CatalogClient";

export const metadata = {
  title: "Katalog ŚOI | SUPON Kielce",
};

export default async function AdminCatalogPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (!isSuponRole(session.user.role)) redirect("/admin/dashboard");

  const [products, categories] = await Promise.all([
    prisma.product.findMany({
      include: { category: true },
      orderBy: { name: "asc" },
    }),
    prisma.ppeCategory.findMany({
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <div style={{ display: "flex", flexDirection: "column", width: "100%", animation: "fadeIn 0.4s ease forwards" }}>
      <PageHeader
        title="Katalog ŚOI i BHP"
        subtitle="Zarządzaj globalną bazą produktów ochrony indywidualnej i BHP oraz edytuj ich parametry"
      />

      <div className="container" style={{ padding: 0 }}>
        <CatalogClient products={products as any} categories={categories} />
      </div>
    </div>
  );
}
