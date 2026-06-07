import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import ClientListClient from "./ClientListClient";

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
      
      {/* Page Header */}
      <header className="page-header" style={{ borderBottom: "1px solid var(--line)", background: "transparent", margin: "0 -24px 24px -24px", padding: "24px" }}>
        <div className="container" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h1 style={{ fontSize: "32px", fontWeight: 800, margin: 0 }}>Klienci B2B</h1>
            <p className="subtitle" style={{ fontSize: "15px", color: "var(--muted)", margin: "6px 0 0 0" }}>
              Zarządzanie kontrahentami, oddziałami dostaw oraz indywidualnymi cennikami
            </p>
          </div>
        </div>
      </header>

      <div className="container" style={{ padding: 0 }}>
        <ClientListClient clients={clients} />
      </div>

    </div>
  );
}
