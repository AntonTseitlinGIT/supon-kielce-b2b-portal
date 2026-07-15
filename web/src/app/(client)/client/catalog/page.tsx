import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import CatalogGrid from "./CatalogGrid";
import Link from "next/link";
import PageHeader from "@/components/PageHeader";

export const metadata = {
  title: "Katalog ŚOI | SUPON Kielce",
};

export default async function ClientCatalogPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const { clientId } = session.user;

  if (!clientId) {
    redirect("/login");
  }

  // 1. Fetch ClientProducts
  const clientProducts = await prisma.clientProduct.findMany({
    where: {
      clientId,
      isActive: true,
    },
    include: {
      product: {
        include: {
          category: true,
        },
      },
    },
    orderBy: {
      product: {
        name: "asc",
      },
    },
  });

  // Map to flat Product array
  const products = clientProducts.map((cp) => ({
    id: cp.product.id,
    articleNr: cp.product.articleNr,
    name: cp.product.name,
    categoryId: cp.product.categoryId,
    categoryName: cp.product.category.name,
    description: cp.product.description,
    photoUrls: cp.product.photoUrls,
    availableSizes: cp.product.availableSizes,
  }));

  // 2. Fetch PPE Categories for filtering
  const categories = await prisma.ppeCategory.findMany({
    orderBy: { name: "asc" },
  });

  return (
    <div className="col-20">
      <PageHeader compact title="Katalog ŚOI i odzieży" subtitle="Przeglądaj wykaz produktów ŚOI i odzieży roboczej uzgodnionych dla Twojej firmy" />

      {/* Interactive Catalog Grid */}
      <CatalogGrid products={products} categories={categories} />
    </div>
  );
}
