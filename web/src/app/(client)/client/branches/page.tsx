import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import BranchForm from "./BranchForm";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata = {
  title: "Zarządzanie oddziałami | SUPON Kielce",
};

export default async function ClientBranchesPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const { role, clientId, branchId } = session.user;

  // Access control: CLIENT_HEAD or BRANCH_HEAD
  if ((role !== "CLIENT_HEAD" && role !== "BRANCH_HEAD") || !clientId) {
    redirect("/client/dashboard");
  }

  // Fetch branches with counts of employees and orders + deliveryAddresses
  const branches = await prisma.branch.findMany({
    where: {
      clientId,
      ...(role === "BRANCH_HEAD" ? { id: branchId! } : {}),
    },
    include: {
      _count: {
        select: {
          employees: true,
          orders: true,
        },
      },
      deliveryAddresses: {
        orderBy: { createdAt: "asc" },
      },
    },
    orderBy: {
      name: "asc",
    },
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* Header / Breadcrumbs */}
      <div>
        <Link 
          href="/client/dashboard" 
          className="btn btn-ghost btn-sm" 
          style={{ 
            display: "inline-flex", 
            alignItems: "center", 
            gap: "8px", 
            background: "transparent", 
            color: "var(--muted)", 
            boxShadow: "none", 
            borderColor: "transparent" 
          }}
        >
          <ArrowLeft size={15} /> Powrót do pulpitu
        </Link>
        <h1 style={{ fontFamily: "var(--font-heading)", fontWeight: 800, fontSize: "32px", margin: "12px 0 0 0", color: "var(--text)" }}>
          {role === "BRANCH_HEAD" ? "Adresy dostaw oddziału" : "Oddziały firmy"}
        </h1>
        <p style={{ color: "var(--text-secondary)", fontSize: "14px" }}>
          {role === "BRANCH_HEAD" 
            ? "Zarządzaj adresami dostaw dla swojego oddziału" 
            : "Zarządzaj oddziałami (filiami) i adresami dostaw swojej firmy"
          }
        </p>
      </div>

      {/* Main interactive form + list */}
      <BranchForm branches={branches as any} userRole={role} />
    </div>
  );
}
