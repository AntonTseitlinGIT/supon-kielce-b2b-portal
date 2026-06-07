import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import ClientListClient from "./ClientListClient";
import PageHeader from "@/components/PageHeader";

export const metadata = {
  title: "Zarządzanie Klientami | SUPON Kielce",
};

export default async function AdminClientsPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  // Admin check
  if (session.user.role !== "SUPON_ADMIN") {
    redirect("/admin/dashboard");
  }

  // Fetch all clients with counts of branches and contract products
  const clients = await prisma.client.findMany({
    include: {
      _count: {
        select: {
          branches: true,
          clientProducts: true,
        }
      }
    },
    orderBy: {
      name: "asc",
    }
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", width: "100%", animation: "fadeIn 0.4s ease forwards" }}>
      
      <PageHeader title="Klienci B2B" subtitle="Zarządzanie kontrahentami, oddziałami dostaw oraz indywidualnymi cennikami" />

      <div className="container" style={{ padding: 0 }}>
        <ClientListClient clients={clients} />
      </div>

    </div>
  );
}
