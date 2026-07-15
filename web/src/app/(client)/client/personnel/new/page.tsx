import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import EmployeeForm from "../EmployeeForm";

export default async function ClientNewEmployeePage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const { role, clientId, branchId } = session.user;

  // Fetch branches authorized for the user
  const branches = await prisma.branch.findMany({
    where: {
      clientId: clientId!,
      isActive: true,
      ...(role === "BRANCH_HEAD" ? { id: branchId! } : {}),
    },
    select: {
      id: true,
      name: true,
    },
    orderBy: { name: "asc" },
  });

  return (
    <div className="col-24">
      {/* Header */}
      <div style={{ padding: "8px 0", display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "16px" }}>
        <div>
          <h1 style={{ fontFamily: "var(--font-heading)", fontWeight: 800, fontSize: "36px", color: "var(--text)", margin: 0 }}>
            Dodaj pracownika
          </h1>
          <p className="subtitle" style={{ fontSize: "15px", margin: "6px 0 0 0", color: "var(--muted)" }}>
            Utwórz nową kartę pracownika w systemie
          </p>
        </div>
        <div>
          <Link href="/client/personnel" className="btn btn-secondary" style={{ display: "flex", alignItems: "center", gap: "6px", height: "42px" }}>
            <ArrowLeft size={16} /> Wróć do listy
          </Link>
        </div>
      </div>

      {/* Form */}
      <EmployeeForm
        branches={branches}
        userRole={role}
        defaultBranchId={role === "BRANCH_HEAD" ? branchId! : undefined}
      />
    </div>
  );
}
