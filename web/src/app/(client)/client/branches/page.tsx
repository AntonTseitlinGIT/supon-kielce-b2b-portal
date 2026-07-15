import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import BranchForm from "./BranchForm";
import Link from "next/link";
import PageHeader from "@/components/PageHeader";

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
          employees: { where: { deletedAt: null } },
          orders: { where: { deletedAt: null } },
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
    <div className="col-20">
      <PageHeader
        compact
        title={role === "BRANCH_HEAD" ? "Adresy dostaw oddziału" : "Oddziały firmy"}
        subtitle={role === "BRANCH_HEAD" ? "Zarządzaj adresami dostaw dla swojego oddziału" : "Zarządzaj oddziałami (filiami) i adresami dostaw swojej firmy"}
      />

      {/* Main interactive form + list */}
      <BranchForm branches={branches as any} userRole={role} />
    </div>
  );
}
